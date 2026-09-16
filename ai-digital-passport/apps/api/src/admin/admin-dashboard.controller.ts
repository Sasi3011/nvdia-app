import { Controller, Get } from "@nestjs/common";
import { ClaimStatus, prisma } from "@ai-digital-passport/database";
import { UserRole } from "@ai-digital-passport/shared-types";
import { Roles } from "../common/auth/roles.decorator";

// Admin Dashboard / Analytics (Page 24) — headline operational metrics.
// System health (API/DB/cache/S3) is already covered by GET /health.
@Controller("admin/dashboard")
@Roles(UserRole.ADMIN)
export class AdminDashboardController {
  @Get()
  async summary() {
    const [totalStudents, pendingClaims, levelDistribution, activeEvents] = await Promise.all([
      prisma.user.count(),
      prisma.activityClaim.count({ where: { status: ClaimStatus.PENDING } }),
      prisma.user.groupBy({ by: ["current_level_id"], _count: { _all: true } }),
      prisma.event.count({ where: { ends_at: { gt: new Date() } } }),
    ]);
    return {
      totalStudents,
      pendingClaims,
      activeEvents,
      levelDistribution: levelDistribution.map((r) => ({ levelId: r.current_level_id, count: r._count._all })),
    };
  }
}
