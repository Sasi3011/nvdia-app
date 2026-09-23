import { Controller, Get } from "@nestjs/common";
import { ClaimStatus, Prisma, prisma } from "@ai-digital-passport/database";
import { LEVEL_DEFINITIONS, UserRole } from "@ai-digital-passport/shared-types";
import { Roles } from "../common/auth/roles.decorator";

const DAY_MS = 24 * 60 * 60 * 1000;
// The programme runs in India: bucket days/months in IST so a late-night claim lands on the right day.
const TZ_OFFSET_MS = 330 * 60 * 1000;

function istDate(d: Date): Date {
  return new Date(d.getTime() + TZ_OFFSET_MS);
}
function dayKey(d: Date): string {
  return istDate(d).toISOString().slice(0, 10);
}
function monthKey(d: Date): string {
  return dayKey(d).slice(0, 7);
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Admin Dashboard / Analytics (Page 24) — every number comes from the database.
// System health (API/DB/cache/S3) is already covered by GET /health.
@Controller("admin/dashboard")
@Roles(UserRole.ADMIN)
export class AdminDashboardController {
  @Get()
  async summary() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
    const monthAgo = new Date(now.getTime() - 30 * DAY_MS);
    const studentWhere: Prisma.UserWhereInput = { user_roles: { some: { role: { name: "STUDENT" } } } };

    // Start of the month 11 months back (IST) for the 12-month claim trend.
    const nowIst = istDate(now);
    const trendStart = new Date(Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth() - 11, 1) - TZ_OFFSET_MS);

    const [
      totalStudents,
      newStudents30d,
      pendingClaims,
      activeEvents,
      levelGroups,
      pointsAgg,
      reviewedClaims,
      claimsForTrend,
      activeClaimUsers,
      activePointUsers,
      activeAttendUsers,
      approvedByCategory,
      scoringRules,
      recentClaims,
      recentPoints,
    ] = await Promise.all([
      prisma.user.count({ where: studentWhere }),
      prisma.user.count({ where: { ...studentWhere, created_at: { gte: monthAgo } } }),
      prisma.activityClaim.count({ where: { status: ClaimStatus.PENDING } }),
      prisma.event.count({ where: { ends_at: { gt: now } } }),
      prisma.student.groupBy({ by: ["current_level_id"], where: { user: studentWhere }, _count: { _all: true } }),
      prisma.student.aggregate({ where: { user: studentWhere }, _sum: { total_points: true } }),
      prisma.activityClaim.findMany({
        where: { reviewed_at: { not: null } },
        select: { created_at: true, reviewed_at: true, status: true },
        orderBy: { reviewed_at: "desc" },
        take: 500,
      }),
      prisma.activityClaim.findMany({
        where: { created_at: { gte: trendStart } },
        select: { created_at: true, status: true },
      }),
      prisma.activityClaim.findMany({
        where: { claimant: studentWhere, created_at: { gte: weekAgo } },
        select: { user_id: true },
        distinct: ["user_id"],
      }),
      prisma.pointsTransaction.findMany({
        where: { user: studentWhere, created_at: { gte: weekAgo } },
        select: { user_id: true },
        distinct: ["user_id"],
      }),
      prisma.attendance.findMany({
        where: { user: studentWhere, checked_in_at: { gte: weekAgo } },
        select: { user_id: true },
        distinct: ["user_id"],
      }),
      prisma.activityClaim.groupBy({
        by: ["category"],
        where: { status: ClaimStatus.APPROVED },
        _sum: { points_awarded: true },
      }),
      prisma.scoringRule.findMany({ select: { category: true, label: true } }),
      prisma.activityClaim.findMany({
        orderBy: { updated_at: "desc" },
        take: 8,
        include: { claimant: { select: { full_name: true } }, scoring_rule: { select: { label: true } } },
      }),
      prisma.pointsTransaction.findMany({
        orderBy: { created_at: "desc" },
        take: 8,
        include: { user: { select: { full_name: true } } },
      }),
    ]);

    // Levels: always all six, named from the canonical definitions.
    const levelCount = new Map(levelGroups.map((r) => [r.current_level_id, r._count._all]));
    const levelDistribution = LEVEL_DEFINITIONS.map((l) => ({
      levelId: l.levelId,
      levelName: l.levelName,
      count: levelCount.get(l.levelId) ?? 0,
    }));

    const totalPoints = pointsAgg._sum.total_points ?? 0;
    const avgPointsPerStudent = totalStudents > 0 ? Math.round(totalPoints / totalStudents) : 0;

    const turnarounds = reviewedClaims
      .filter((c) => c.reviewed_at)
      .map((c) => (c.reviewed_at as Date).getTime() - c.created_at.getTime())
      .filter((ms) => ms >= 0);
    const avgReviewHours = turnarounds.length
      ? Math.round((turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length / 3_600_000) * 10) / 10
      : null;

    const reviewedThisWeek = reviewedClaims.filter((c) => c.reviewed_at && c.reviewed_at >= weekAgo);
    const approvedThisWeek = reviewedThisWeek.filter((c) => c.status === ClaimStatus.APPROVED).length;
    const approvalRate7d = reviewedThisWeek.length ? Math.round((approvedThisWeek / reviewedThisWeek.length) * 100) : null;

    const activeStudents7d = new Set([...activeClaimUsers, ...activePointUsers, ...activeAttendUsers].map((r) => r.user_id)).size;

    // Last 12 months of claim submissions by status.
    const months: { key: string; month: string; approved: number; pending: number; rejected: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const m = new Date(Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth() - i, 1));
      months.push({
        key: m.toISOString().slice(0, 7),
        month: `${MONTH_NAMES[m.getUTCMonth()]} ${String(m.getUTCFullYear()).slice(2)}`,
        approved: 0,
        pending: 0,
        rejected: 0,
      });
    }
    const monthIndex = new Map(months.map((m, i) => [m.key, i]));

    // Last 7 days (today included) by status.
    const days: { key: string; day: string; approved: number; pending: number; rejected: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * DAY_MS);
      days.push({ key: dayKey(d), day: DAY_NAMES[istDate(d).getUTCDay()] as string, approved: 0, pending: 0, rejected: 0 });
    }
    const dayIndex = new Map(days.map((d, i) => [d.key, i]));

    const bucket = (row: { approved: number; pending: number; rejected: number }, status: ClaimStatus) => {
      if (status === ClaimStatus.APPROVED) row.approved++;
      else if (status === ClaimStatus.REJECTED) row.rejected++;
      else row.pending++;
    };
    for (const c of claimsForTrend) {
      const mi = monthIndex.get(monthKey(c.created_at));
      if (mi !== undefined) bucket(months[mi] as (typeof months)[number], c.status);
      const di = dayIndex.get(dayKey(c.created_at));
      if (di !== undefined) bucket(days[di] as (typeof days)[number], c.status);
    }

    // Points by category (approved claims), top 5 with share of the listed total.
    const labelByCategory = new Map(scoringRules.map((r) => [r.category, r.label]));
    const categoryRows = approvedByCategory
      .map((r) => ({ category: r.category, label: labelByCategory.get(r.category) ?? r.category, points: r._sum.points_awarded ?? 0 }))
      .filter((r) => r.points > 0)
      .sort((a, b) => b.points - a.points);
    const categoryTotal = categoryRows.reduce((a, r) => a + r.points, 0);
    const categoryPoints = categoryRows.slice(0, 5).map((r) => ({
      ...r,
      share: categoryTotal ? Math.round((r.points / categoryTotal) * 100) : 0,
    }));

    // Live activity: latest claim changes and point awards, merged newest-first.
    type Activity = { id: string; kind: "CLAIM_APPROVED" | "CLAIM_REJECTED" | "CLAIM_SUBMITTED" | "POINTS"; user: string; action: string; at: Date };
    const activity: Activity[] = [
      ...recentClaims.map((c): Activity => {
        const label = c.scoring_rule?.label ?? c.category;
        const kind = c.status === ClaimStatus.APPROVED ? "CLAIM_APPROVED" : c.status === ClaimStatus.REJECTED ? "CLAIM_REJECTED" : "CLAIM_SUBMITTED";
        const verb = kind === "CLAIM_APPROVED" ? "Claim approved" : kind === "CLAIM_REJECTED" ? "Claim rejected" : "Claim submitted";
        return { id: `c-${c.claim_id}`, kind, user: c.claimant.full_name, action: `${verb}: ${label}`, at: c.updated_at };
      }),
      ...recentPoints.map((p): Activity => ({
        id: `p-${p.transaction_id}`,
        kind: "POINTS",
        user: p.user.full_name,
        action: `${p.points >= 0 ? "+" : ""}${p.points} pts · ${p.reason}`,
        at: p.created_at,
      })),
    ]
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, 8);

    return {
      totalStudents,
      newStudents30d,
      activeStudents7d,
      pendingClaims,
      activeEvents,
      totalPoints,
      avgPointsPerStudent,
      avgReviewHours,
      approvalRate7d,
      levelDistribution,
      monthlyClaims: months.map(({ key: _key, ...m }) => m),
      weeklyClaims: days.map(({ key: _key, ...d }) => d),
      categoryPoints,
      recentActivity: activity.map((a) => ({ ...a, at: a.at.toISOString() })),
    };
  }
}
