import { Injectable, NotFoundException } from "@nestjs/common";
import { ClaimStatus, Prisma, prisma } from "@ai-digital-passport/database";

export interface StudentListQuery {
  search?: string;
  department?: string;
  year?: number;
  level?: number;
  page: number;
  pageSize: number;
}

const STUDENT_ROLE = { user_roles: { some: { role: { name: "STUDENT" as const } } } };
// Student profiles whose user currently holds the STUDENT role.
const STUDENT_PROFILE = { user: STUDENT_ROLE };

@Injectable()
export class StudentProgressService {
  // Mentors and admins both see every student: claim review is a shared pool in this
  // codebase (open decision #3), and `faculty.mentor_department` is only a notification-routing hint.
  async list(query: StudentListQuery) {
    const where: Prisma.StudentWhereInput = {
      ...STUDENT_PROFILE,
      ...(query.department ? { department: query.department } : {}),
      ...(query.year ? { cohort_year: query.year } : {}),
      ...(query.level ? { current_level_id: query.level } : {}),
      ...(query.search
        ? {
            OR: [
              { user: { full_name: { contains: query.search, mode: "insensitive" } } },
              { user: { email: { contains: query.search, mode: "insensitive" } } },
              { register_num: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [users, total, allStudents, pendingClaims, departments] = await Promise.all([
      prisma.student.findMany({
        where,
        orderBy: [{ total_points: "desc" }, { user: { created_at: "asc" } }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: { current_level: true, user: { select: { full_name: true, email: true } } },
      }),
      prisma.student.count({ where }),
      prisma.student.groupBy({ by: ["current_level_id"], where: STUDENT_PROFILE, _count: { _all: true }, _sum: { total_points: true } }),
      prisma.activityClaim.count({ where: { status: ClaimStatus.PENDING, claimant: STUDENT_ROLE } }),
      prisma.student.findMany({ where: STUDENT_PROFILE, distinct: ["department"], select: { department: true }, orderBy: { department: "asc" } }),
    ]);

    const ids = users.map((u) => u.user_id);
    const [claimGroups, lastClaims, lastPoints] = await Promise.all([
      prisma.activityClaim.groupBy({ by: ["user_id", "status"], where: { user_id: { in: ids } }, _count: { _all: true } }),
      prisma.activityClaim.groupBy({ by: ["user_id"], where: { user_id: { in: ids } }, _max: { created_at: true } }),
      prisma.pointsTransaction.groupBy({ by: ["user_id"], where: { user_id: { in: ids } }, _max: { created_at: true } }),
    ]);

    const counts = new Map<string, { approved: number; pending: number; rejected: number }>();
    for (const g of claimGroups) {
      const c = counts.get(g.user_id) ?? { approved: 0, pending: 0, rejected: 0 };
      if (g.status === ClaimStatus.APPROVED) c.approved = g._count._all;
      else if (g.status === ClaimStatus.PENDING) c.pending = g._count._all;
      else c.rejected = g._count._all;
      counts.set(g.user_id, c);
    }
    const lastClaim = new Map(lastClaims.map((g) => [g.user_id, g._max.created_at]));
    const lastPoint = new Map(lastPoints.map((g) => [g.user_id, g._max.created_at]));

    const totalStudents = allStudents.reduce((n, g) => n + g._count._all, 0);
    const totalPoints = allStudents.reduce((n, g) => n + (g._sum.total_points ?? 0), 0);

    return {
      items: users.map((u) => {
        const a = lastClaim.get(u.user_id);
        const b = lastPoint.get(u.user_id);
        const last = a && b ? (a > b ? a : b) : (a ?? b ?? null);
        return {
          userId: u.user_id,
          fullName: u.user.full_name,
          email: u.user.email,
          registerNum: u.register_num,
          department: u.department,
          cohortYear: u.cohort_year,
          totalPoints: u.total_points,
          levelId: u.current_level.level_id,
          levelName: u.current_level.level_name,
          claims: counts.get(u.user_id) ?? { approved: 0, pending: 0, rejected: 0 },
          lastActivityAt: last,
        };
      }),
      total,
      page: query.page,
      pageSize: query.pageSize,
      summary: {
        totalStudents,
        averagePoints: totalStudents ? Math.round(totalPoints / totalStudents) : 0,
        pendingClaims,
        byLevel: allStudents.map((g) => ({ levelId: g.current_level_id, count: g._count._all })),
      },
      departments: departments.map((d) => d.department),
    };
  }

  async progress(userId: string) {
    const student = await prisma.student.findUnique({ where: { user_id: userId }, include: { current_level: true, user: true } });
    if (!student) throw new NotFoundException({ code: "STUDENT_NOT_FOUND" });
    const { user } = student;

    const [
      nextLevel, rankAhead, transactions, claims, enrollments, hackRegs, teamMemberships, attendance,
      startups, projects, certificates, badges, nominations, gpuRequests, problemProjects,
    ] = await Promise.all([
      prisma.level.findFirst({ where: { min_points: { gt: student.total_points } }, orderBy: { min_points: "asc" } }),
      prisma.student.count({
        where: {
          ...STUDENT_PROFILE,
          OR: [
            { total_points: { gt: student.total_points } },
            { total_points: student.total_points, user: { created_at: { lt: user.created_at } } },
          ],
        },
      }),
      prisma.pointsTransaction.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        take: 200,
        include: { claim: { select: { category: true } }, enrollment: { select: { course: { select: { title: true } } } } },
      }),
      prisma.activityClaim.findMany({ where: { user_id: userId }, orderBy: { created_at: "desc" }, take: 200 }),
      prisma.courseEnrollment.findMany({
        where: { user_id: userId },
        orderBy: { updated_at: "desc" },
        include: { course: { select: { title: true, provider: true, points_value: true } }, transaction: { select: { points: true } } },
      }),
      prisma.externalHackathonRegistration.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        include: { hackathon: { select: { title: true, url: true, organizer: true } } },
      }),
      prisma.hackathonTeamMember.findMany({
        where: { user_id: userId },
        orderBy: { joined_at: "desc" },
        include: { team: { include: { hackathon: { select: { title: true, status: true } }, submissions: { select: { submission_id: true, title: true, submitted_at: true } } } } },
      }),
      prisma.attendance.findMany({
        where: { user_id: userId },
        orderBy: { checked_in_at: "desc" },
        take: 200,
        include: { session: { select: { title: true, starts_at: true, event: { select: { title: true, category: true } } } } },
      }),
      prisma.startupProject.findMany({ where: { lead_student_id: userId }, orderBy: { created_at: "desc" }, include: { milestones: { orderBy: { created_at: "asc" } } } }),
      prisma.projectRecord.findMany({ where: { lead_student_id: userId }, orderBy: { created_at: "desc" }, include: { milestones: { orderBy: { created_at: "asc" } } } }),
      prisma.generatedCertificate.findMany({ where: { user_id: userId }, orderBy: { issued_at: "desc" } }),
      prisma.userBadge.findMany({ where: { user_id: userId }, orderBy: { awarded_at: "desc" }, include: { badge: true } }),
      prisma.awardNomination.findMany({
        where: { OR: [{ nominee_id: userId }, { requested_by: userId }] },
        orderBy: { created_at: "desc" },
        include: { award: { select: { name: true } } },
      }),
      prisma.gpuRequest.findMany({ where: { student_id: userId }, orderBy: { created_at: "desc" } }),
      prisma.problemProject.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        include: { problem: { select: { title: true } }, milestones: { select: { status: true, target_stage: true } } },
      }),
    ]);

    // Points by category: approved claims grouped by category, course completions as their own bucket.
    const byCategory = new Map<string, number>();
    for (const c of claims) {
      if (c.status !== ClaimStatus.APPROVED) continue;
      byCategory.set(c.category, (byCategory.get(c.category) ?? 0) + (c.points_awarded ?? c.points_requested));
    }
    const coursePoints = transactions.filter((t) => t.enrollment_id).reduce((n, t) => n + t.points, 0);
    if (coursePoints) byCategory.set("course_completion", (byCategory.get("course_completion") ?? 0) + coursePoints);

    const hackClaimIds = hackRegs.map((r) => r.claim_id).filter((c): c is string => !!c);
    const hackClaims = hackClaimIds.length
      ? await prisma.activityClaim.findMany({ where: { claim_id: { in: hackClaimIds } }, select: { claim_id: true, status: true, mentor_feedback: true } })
      : [];
    const hackClaimById = new Map(hackClaims.map((c) => [c.claim_id, c]));

    const claimCount = (s: ClaimStatus) => claims.filter((c) => c.status === s).length;

    return {
      profile: {
        userId: user.user_id,
        fullName: user.full_name,
        email: user.email,
        registerNum: student.register_num,
        department: student.department,
        cohortYear: student.cohort_year,
        avatarUrl: user.avatar_url,
        totalPoints: student.total_points,
        gpuCreditBalance: student.gpu_credit_balance,
        highImpactFlag: student.high_impact_flag,
        joinedAt: user.created_at,
        rank: rankAhead + 1,
        level: {
          levelId: student.current_level.level_id,
          levelName: student.current_level.level_name,
          minPoints: student.current_level.min_points,
          nextLevel: nextLevel
            ? { levelId: nextLevel.level_id, levelName: nextLevel.level_name, minPoints: nextLevel.min_points, pointsNeeded: nextLevel.min_points - student.total_points }
            : null,
        },
      },
      summary: {
        pointsByCategory: Array.from(byCategory, ([category, points]) => ({ category, points })).sort((a, b) => b.points - a.points),
        claims: { approved: claimCount(ClaimStatus.APPROVED), pending: claimCount(ClaimStatus.PENDING), rejected: claimCount(ClaimStatus.REJECTED) },
        coursesCompleted: enrollments.filter((e) => e.status === "APPROVED").length,
        coursesInProgress: enrollments.filter((e) => e.status === "IN_PROGRESS" || e.status === "SUBMITTED").length,
        hackathonRegistrationsVerified: hackRegs.filter((r) => !r.claim_id || hackClaimById.get(r.claim_id)?.status === ClaimStatus.APPROVED).length,
        classesAttended: attendance.length,
        projects: projects.length + startups.length,
        badges: badges.length,
        certificates: certificates.length,
      },
      pointsHistory: transactions.map((t) => ({
        transactionId: t.transaction_id,
        points: t.points,
        reason: t.reason,
        source: t.claim ? t.claim.category : t.enrollment ? `Course: ${t.enrollment.course.title}` : "Adjustment",
        createdAt: t.created_at,
      })),
      claims: claims.map((c) => ({
        claimId: c.claim_id,
        category: c.category,
        proofType: c.proof_type,
        status: c.status,
        pointsRequested: c.points_requested,
        pointsAwarded: c.points_awarded,
        mentorFeedback: c.mentor_feedback,
        createdAt: c.created_at,
        reviewedAt: c.reviewed_at,
      })),
      courses: enrollments.map((e) => ({
        enrollmentId: e.enrollment_id,
        title: e.course.title,
        provider: e.course.provider,
        status: e.status,
        pointsEarned: e.transaction?.points ?? 0,
        submittedAt: e.submitted_at,
        reviewedAt: e.reviewed_at,
        reviewFeedback: e.review_feedback,
      })),
      hackathons: {
        external: hackRegs.map((r) => {
          const claim = r.claim_id ? hackClaimById.get(r.claim_id) : undefined;
          return {
            registrationId: r.registration_id,
            title: r.hackathon.title,
            organizer: r.hackathon.organizer,
            url: r.hackathon.url,
            // Registrations made before proof verification existed were paid up front.
            status: claim?.status ?? "APPROVED",
            feedback: claim?.mentor_feedback ?? null,
            registeredAt: r.created_at,
          };
        }),
        teams: teamMemberships.map((m) => ({
          teamId: m.team.team_id,
          teamName: m.team.name,
          hackathonTitle: m.team.hackathon.title,
          hackathonStatus: m.team.hackathon.status,
          role: m.role,
          joinedAt: m.joined_at,
          submissions: m.team.submissions.map((s) => ({ submissionId: s.submission_id, title: s.title, submittedAt: s.submitted_at })),
        })),
      },
      attendance: attendance.map((a) => ({
        attendanceId: a.attendance_id,
        eventTitle: a.session.event.title,
        sessionTitle: a.session.title,
        category: a.session.event.category,
        classDate: a.session.starts_at,
        checkedInAt: a.checked_in_at,
      })),
      projects: {
        startups: startups.map((s) => ({
          projectId: s.project_id,
          title: s.title,
          currentStage: s.current_stage,
          gpuValidated: s.gpu_validated,
          createdAt: s.created_at,
          milestones: s.milestones.map((m) => ({ milestoneId: m.milestone_id, targetStage: m.target_stage, status: m.status, feedback: m.feedback, createdAt: m.created_at })),
        })),
        records: projects.map((p) => ({
          projectId: p.project_id,
          title: p.title,
          projectType: p.project_type,
          status: p.status,
          githubUrl: p.github_url,
          demoUrl: p.demo_url,
          createdAt: p.created_at,
          milestones: p.milestones.map((m) => ({ milestoneId: m.milestone_id, title: m.title, status: m.status, feedback: m.feedback, dueAt: m.due_at })),
        })),
        problemProjects: problemProjects.map((p) => ({
          projectId: p.project_id,
          problemTitle: p.problem.title,
          currentStage: p.current_stage,
          verifiedStage: Math.max(0, ...p.milestones.filter((m) => m.status === "APPROVED").map((m) => m.target_stage)),
          pendingStage: p.milestones.some((m) => m.status === "PENDING"),
          createdAt: p.created_at,
        })),
      },
      achievements: {
        certificates: certificates.map((c) => ({ certificateId: c.certificate_id, title: c.title, type: c.certificate_type, issuedAt: c.issued_at })),
        badges: badges.map((b) => ({ badgeId: b.badge_id, name: b.badge.name, description: b.badge.description, awardedAt: b.awarded_at })),
        awards: nominations.map((n) => ({
          nominationId: n.nomination_id,
          awardName: n.award.name,
          status: n.status,
          relation: n.nominee_id === userId ? (n.requested_by === userId ? "SELF_REQUEST" : "NOMINEE") : "REQUESTER",
          reason: n.reason,
          adminNote: n.admin_note,
          createdAt: n.created_at,
        })),
      },
      gpu: {
        balance: student.gpu_credit_balance,
        requests: gpuRequests.map((g) => ({
          requestId: g.gpu_request_id,
          title: g.title,
          status: g.status,
          requestedCredits: g.requested_credits,
          allocatedCredits: g.allocated_credits,
          createdAt: g.created_at,
        })),
      },
    };
  }
}
