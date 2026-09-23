import { Injectable } from "@nestjs/common";
import { ClaimStatus, Prisma, prisma } from "@ai-digital-passport/database";
import { LEVEL_DEFINITIONS, STARTUP_STAGES } from "@ai-digital-passport/shared-types";

export type ReportRange = "7d" | "30d" | "90d" | "all";

const DAY_MS = 24 * 60 * 60 * 1000;
// Program runs in India: bucket chart days/weeks/months in IST so a 11pm claim lands on the right day.
const TZ_OFFSET_MS = 330 * 60 * 1000;

function toLocalDay(d: Date): Date {
  const t = new Date(d.getTime() + TZ_OFFSET_MS);
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()));
}

function dayKey(d: Date): string {
  return toLocalDay(d).toISOString().slice(0, 10);
}

function monthKey(d: Date): string {
  return dayKey(d).slice(0, 7);
}

function rangeStart(range: ReportRange): Date | undefined {
  if (range === "all") return undefined;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return new Date(Date.now() - days * DAY_MS);
}

@Injectable()
export class AdminReportsService {
  async summary(range: ReportRange, department?: string) {
    const start = rangeStart(range);
    const inRange = start ? { gte: start } : undefined;
    const studentWhere: Prisma.UserWhereInput = {
      user_roles: { some: { role: { name: "STUDENT" } } },
      ...(department ? { student: { department } } : {}),
    };

    const activeSince = new Date(Date.now() - 30 * DAY_MS);

    const [
      students,
      allStudentDepartments,
      claimRows,
      pointRows,
      activeClaimUsers,
      activePointUsers,
      activeAttendUsers,
      scoringRules,
      topStudents,
      courses,
      enrollments,
      allExternalRegs,
      hackathons,
      teamCount,
      hackSubmissionCount,
      events,
      problems,
      problemSubmissions,
      startupGroups,
      projectRecordGroups,
      gpuRows,
      awardGroups,
      certificateCount,
    ] = await Promise.all([
      prisma.student.findMany({
        where: { user: studentWhere },
        select: { user_id: true, department: true, total_points: true, current_level_id: true },
      }),
      prisma.student.findMany({
        where: { user: { user_roles: { some: { role: { name: "STUDENT" } } } } },
        select: { department: true, total_points: true, user_id: true },
      }),
      prisma.activityClaim.findMany({
        where: { claimant: studentWhere, created_at: inRange },
        select: { category: true, status: true, points_awarded: true, created_at: true, reviewed_at: true, user_id: true },
      }),
      prisma.pointsTransaction.findMany({
        where: { user: studentWhere, created_at: inRange },
        select: { points: true, created_at: true, user_id: true },
      }),
      prisma.activityClaim.findMany({
        where: { claimant: studentWhere, created_at: { gte: activeSince } },
        select: { user_id: true },
        distinct: ["user_id"],
      }),
      prisma.pointsTransaction.findMany({
        where: { user: studentWhere, created_at: { gte: activeSince } },
        select: { user_id: true },
        distinct: ["user_id"],
      }),
      prisma.attendance.findMany({
        where: { user: studentWhere, checked_in_at: { gte: activeSince } },
        select: { user_id: true },
        distinct: ["user_id"],
      }),
      prisma.scoringRule.findMany({ select: { category: true, label: true } }),
      prisma.student.findMany({
        where: { user: studentWhere },
        orderBy: [{ total_points: "desc" }, { user: { full_name: "asc" } }],
        take: 10,
        select: { user_id: true, department: true, total_points: true, current_level_id: true, user: { select: { full_name: true } } },
      }),
      prisma.course.findMany({
        where: { status: { not: "ARCHIVED" } },
        select: { course_id: true, title: true, provider: true, status: true },
        orderBy: { created_at: "desc" },
      }),
      prisma.courseEnrollment.findMany({
        where: { student: studentWhere, created_at: inRange },
        select: { course_id: true, status: true },
      }),
      prisma.externalHackathonRegistration.findMany({
        where: { created_at: inRange },
        select: { claim_id: true, user_id: true },
      }),
      prisma.hackathon.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.hackathonTeam.count({ where: { lead: studentWhere, created_at: inRange } }),
      prisma.hackathonSubmission.count({ where: { team: { lead: studentWhere }, submitted_at: inRange } }),
      prisma.event.findMany({
        where: { starts_at: inRange },
        orderBy: { starts_at: "desc" },
        take: 10,
        select: { event_id: true, title: true, starts_at: true, category: true, sessions: { select: { session_id: true } } },
      }),
      prisma.industryProblem.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.problemProject.findMany({
        where: { user: studentWhere, created_at: inRange },
        select: { user_id: true },
      }),
      prisma.startupProject.groupBy({ by: ["current_stage"], where: { lead: studentWhere }, _count: { _all: true } }),
      prisma.projectRecord.groupBy({ by: ["status"], where: { lead: studentWhere }, _count: { _all: true } }),
      prisma.gpuRequest.findMany({
        where: { student: studentWhere, created_at: inRange },
        select: { status: true, requested_credits: true, allocated_credits: true },
      }),
      prisma.awardNomination.groupBy({ by: ["status"], where: { nominee: studentWhere, created_at: inRange }, _count: { _all: true } }),
      prisma.generatedCertificate.count({ where: { user: studentWhere, issued_at: inRange } }),
    ]);

    // ---- Overview -----------------------------------------------------------
    const claimCounts = { approved: 0, pending: 0, rejected: 0 };
    let reviewMs = 0;
    let reviewCount = 0;
    for (const c of claimRows) {
      if (c.status === ClaimStatus.APPROVED) claimCounts.approved++;
      else if (c.status === ClaimStatus.REJECTED) claimCounts.rejected++;
      else claimCounts.pending++;
      if (c.reviewed_at) {
        reviewMs += c.reviewed_at.getTime() - c.created_at.getTime();
        reviewCount++;
      }
    }
    const decided = claimCounts.approved + claimCounts.rejected;
    const totalStudentPoints = students.reduce((n, s) => n + s.total_points, 0);
    const activeIds = new Set([...activeClaimUsers, ...activePointUsers, ...activeAttendUsers].map((u) => u.user_id));

    const overview = {
      totalStudents: students.length,
      activeStudents30d: activeIds.size,
      pointsAwarded: pointRows.reduce((n, p) => n + p.points, 0),
      averagePoints: students.length ? Math.round(totalStudentPoints / students.length) : 0,
      claims: { ...claimCounts, total: claimRows.length },
      approvalRatePct: decided ? Math.round((claimCounts.approved / decided) * 100) : null,
      avgReviewHours: reviewCount ? Math.round((reviewMs / reviewCount / 3_600_000) * 10) / 10 : null,
    };

    // ---- Levels (snapshot, all six shown even when empty) --------------------
    const levelCounts = new Map<number, number>();
    for (const s of students) levelCounts.set(s.current_level_id, (levelCounts.get(s.current_level_id) ?? 0) + 1);
    const levels = LEVEL_DEFINITIONS.map((l) => ({
      levelId: l.levelId,
      levelName: l.levelName,
      minPoints: l.minPoints,
      count: levelCounts.get(l.levelId) ?? 0,
    }));

    // ---- Points over time ----------------------------------------------------
    const pointsOverTime = buildSeries(range, pointRows);

    // ---- Claims by category --------------------------------------------------
    const labelByCategory = new Map(scoringRules.map((r) => [r.category, r.label]));
    const byCategory = new Map<string, { approved: number; pending: number; rejected: number; points: number }>();
    for (const c of claimRows) {
      const row = byCategory.get(c.category) ?? { approved: 0, pending: 0, rejected: 0, points: 0 };
      if (c.status === ClaimStatus.APPROVED) {
        row.approved++;
        row.points += c.points_awarded ?? 0;
      } else if (c.status === ClaimStatus.REJECTED) row.rejected++;
      else row.pending++;
      byCategory.set(c.category, row);
    }
    const claimsByCategory = Array.from(byCategory.entries())
      .map(([category, v]) => ({ category, label: labelByCategory.get(category) ?? category, ...v }))
      .sort((a, b) => b.points - a.points || b.approved - a.approved);

    // ---- Departments ---------------------------------------------------------
    const deptMap = new Map<string, { students: number; points: number; claims: number; approved: number }>();
    for (const s of allStudentDepartments) {
      const row = deptMap.get(s.department) ?? { students: 0, points: 0, claims: 0, approved: 0 };
      row.students++;
      row.points += s.total_points;
      deptMap.set(s.department, row);
    }
    const deptClaims = await prisma.activityClaim.findMany({
      where: { claimant: { user_roles: { some: { role: { name: "STUDENT" } } } }, created_at: inRange },
      select: { status: true, claimant: { select: { student: { select: { department: true } } } } },
    });
    for (const c of deptClaims) {
      if (!c.claimant.student) continue;
      const row = deptMap.get(c.claimant.student.department);
      if (!row) continue;
      row.claims++;
      if (c.status === ClaimStatus.APPROVED) row.approved++;
    }
    const departments = Array.from(deptMap.entries())
      .map(([name, v]) => ({ name, students: v.students, averagePoints: v.students ? Math.round(v.points / v.students) : 0, claims: v.claims, approvedClaims: v.approved }))
      .sort((a, b) => b.students - a.students || a.name.localeCompare(b.name));

    // ---- Courses -------------------------------------------------------------
    const enrollByCourse = new Map<string, { enrolled: number; completed: number; inReview: number }>();
    for (const e of enrollments) {
      const row = enrollByCourse.get(e.course_id) ?? { enrolled: 0, completed: 0, inReview: 0 };
      row.enrolled++;
      if (e.status === "APPROVED") row.completed++;
      if (e.status === "SUBMITTED") row.inReview++;
      enrollByCourse.set(e.course_id, row);
    }
    const courseStats = courses
      .map((c) => {
        const v = enrollByCourse.get(c.course_id) ?? { enrolled: 0, completed: 0, inReview: 0 };
        return {
          courseId: c.course_id,
          title: c.title,
          provider: c.provider,
          status: c.status,
          ...v,
          completionRatePct: v.enrolled ? Math.round((v.completed / v.enrolled) * 100) : null,
        };
      })
      .sort((a, b) => b.enrolled - a.enrolled || a.title.localeCompare(b.title));

    // ---- Hackathons ----------------------------------------------------------
    const studentIds = new Set(students.map((s) => s.user_id));
    const externalRegs = allExternalRegs.filter((r) => studentIds.has(r.user_id));
    const regClaimIds = externalRegs.map((r) => r.claim_id).filter((c): c is string => !!c);
    const regClaims = regClaimIds.length
      ? await prisma.activityClaim.findMany({ where: { claim_id: { in: regClaimIds } }, select: { status: true } })
      : [];
    const externalByStatus = { approved: 0, pending: 0, rejected: 0 };
    for (const r of externalRegs) {
      // Registrations from before the proof flow have no claim: they were already awarded.
      if (!r.claim_id) externalByStatus.approved++;
    }
    for (const c of regClaims) {
      if (c.status === ClaimStatus.APPROVED) externalByStatus.approved++;
      else if (c.status === ClaimStatus.REJECTED) externalByStatus.rejected++;
      else externalByStatus.pending++;
    }
    const hackathonStats = {
      external: { total: externalRegs.length, ...externalByStatus },
      internal: {
        byStatus: hackathons.map((h) => ({ status: h.status, count: h._count._all })),
        teams: teamCount,
        submissions: hackSubmissionCount,
      },
    };

    // ---- Live classes --------------------------------------------------------
    const sessionIds = events.flatMap((e) => e.sessions.map((s) => s.session_id));
    const attendance = sessionIds.length
      ? await prisma.attendance.groupBy({ by: ["session_id"], where: { session_id: { in: sessionIds } }, _count: { _all: true } })
      : [];
    const attBySession = new Map(attendance.map((a) => [a.session_id, a._count._all]));
    const liveClasses = events.map((e) => ({
      eventId: e.event_id,
      title: e.title,
      startsAt: e.starts_at.toISOString(),
      category: labelByCategory.get(e.category) ?? e.category,
      checkIns: e.sessions.reduce((n, s) => n + (attBySession.get(s.session_id) ?? 0), 0),
    }));

    // ---- Industry problems ---------------------------------------------------
    const problemBank = {
      byStatus: problems.map((p) => ({ status: p.status, count: p._count._all })),
      submissions: problemSubmissions.length,
      distinctSubmitters: new Set(problemSubmissions.map((s) => s.user_id)).size,
    };

    // ---- Startups & projects -------------------------------------------------
    const stageCounts = new Map(startupGroups.map((g) => [g.current_stage, g._count._all]));
    const startupStages = STARTUP_STAGES.map((s) => ({ stage: s.stage, name: s.name, count: stageCounts.get(s.stage) ?? 0 }));
    const projectsByStatus = projectRecordGroups.map((g) => ({ status: g.status, count: g._count._all }));

    // ---- GPU -----------------------------------------------------------------
    const gpuByStatus = new Map<string, number>();
    let requestedCredits = 0;
    let allocatedCredits = 0;
    for (const g of gpuRows) {
      gpuByStatus.set(g.status, (gpuByStatus.get(g.status) ?? 0) + 1);
      requestedCredits += g.requested_credits;
      allocatedCredits += g.allocated_credits ?? 0;
    }
    const gpu = {
      total: gpuRows.length,
      requestedCredits,
      allocatedCredits,
      byStatus: Array.from(gpuByStatus.entries()).map(([status, count]) => ({ status, count })),
    };

    return {
      range,
      department: department ?? null,
      generatedAt: new Date().toISOString(),
      departmentOptions: Array.from(new Set(allStudentDepartments.map((s) => s.department))).sort(),
      overview,
      levels,
      pointsOverTime,
      claimsByCategory,
      departments,
      topStudents: topStudents.map((s, i) => ({
        rank: i + 1,
        userId: s.user_id,
        fullName: s.user.full_name,
        department: s.department,
        levelId: s.current_level_id,
        totalPoints: s.total_points,
      })),
      courses: courseStats,
      hackathons: hackathonStats,
      liveClasses,
      problemBank,
      startups: { stages: startupStages, projectsByStatus },
      gpu,
      awards: awardGroups.map((a) => ({ status: a.status, count: a._count._all })),
      certificates: { issuedCount: certificateCount },
    };
  }
}

// 7d/30d -> one bucket per day; 90d -> 13 weekly buckets; all -> last 12 months.
function buildSeries(range: ReportRange, rows: { points: number; created_at: Date }[]) {
  const buckets: { key: string; label: string; points: number }[] = [];
  const today = toLocalDay(new Date());
  const addTo = (i: number, pts: number) => {
    const b = buckets[i];
    if (b) b.points += pts;
  };
  const fmtDay = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

  if (range === "7d" || range === "30d") {
    const n = range === "7d" ? 7 : 30;
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * DAY_MS);
      buckets.push({ key: d.toISOString().slice(0, 10), label: fmtDay(d), points: 0 });
    }
    const idx = new Map(buckets.map((b, i) => [b.key, i]));
    for (const r of rows) {
      const i = idx.get(dayKey(r.created_at));
      if (i !== undefined) addTo(i, r.points);
    }
  } else if (range === "90d") {
    for (let i = 12; i >= 0; i--) {
      const startD = new Date(today.getTime() - (i * 7 + 6) * DAY_MS);
      buckets.push({ key: startD.toISOString().slice(0, 10), label: `${fmtDay(startD)}`, points: 0 });
    }
    for (const r of rows) {
      const t = toLocalDay(r.created_at).getTime();
      const daysAgo = Math.floor((today.getTime() - t) / DAY_MS);
      if (daysAgo < 0) continue;
      const i = 12 - Math.floor(daysAgo / 7);
      if (i >= 0) addTo(i, r.points);
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1));
      buckets.push({
        key: d.toISOString().slice(0, 7),
        label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" }),
        points: 0,
      });
    }
    const idx = new Map(buckets.map((b, i) => [b.key, i]));
    for (const r of rows) {
      const i = idx.get(monthKey(r.created_at));
      if (i !== undefined) addTo(i, r.points);
    }
  }
  return buckets.map((b) => ({ label: b.label, points: b.points }));
}
