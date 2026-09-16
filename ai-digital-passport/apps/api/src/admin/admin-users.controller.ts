import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { prisma } from "@ai-digital-passport/database";
import {
  AdjustGpuCreditsSchema,
  AdjustPointsSchema,
  AssignRoleSchema,
  PaginationQuerySchema,
  SetHighImpactFlagSchema,
  SetMentorDepartmentSchema,
  UserRole,
} from "@ai-digital-passport/shared-types";
import { z } from "zod";
import { AuditLogService } from "../common/audit-log/audit-log.service";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { Roles } from "../common/auth/roles.decorator";
import type { RequestUser } from "../common/auth/types";
import { pageSkipTake, toPaginatedResult } from "../common/pagination/pagination";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { LevelsService } from "../levels/levels.service";

const SearchQuerySchema = PaginationQuerySchema.extend({ q: z.string().trim().optional() });

// User & Role Management (Page 27). Point/GPU-credit corrections always
// require a mandatory audit reason (Section 21.1 "Point reversal or
// correction"; open decision #2 for GPU credits — admin-adjustable only).
@Controller("admin/users")
@Roles(UserRole.ADMIN)
export class AdminUsersController {
  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly levelsService: LevelsService,
  ) {}

  @Get()
  async search(@Query(new ZodValidationPipe(SearchQuerySchema)) query: z.infer<typeof SearchQuerySchema>) {
    const { skip, take } = pageSkipTake(query);
    const where = query.q
      ? {
          OR: [
            { full_name: { contains: query.q, mode: "insensitive" as const } },
            { email: { contains: query.q, mode: "insensitive" as const } },
            { register_num: { contains: query.q, mode: "insensitive" as const } },
          ],
        }
      : undefined;
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: "desc" },
        include: { current_level: true, user_roles: { include: { role: true } } },
      }),
      prisma.user.count({ where }),
    ]);
    return toPaginatedResult(
      items.map((u) => ({
        userId: u.user_id,
        email: u.email,
        fullName: u.full_name,
        registerNum: u.register_num,
        totalPoints: u.total_points,
        gpuCreditBalance: u.gpu_credit_balance,
        levelName: u.current_level.level_name,
        roles: u.user_roles.map((ur) => ur.role.name),
        department: u.department,
        mentorDepartment: u.mentor_department,
      })),
      total,
      query,
    );
  }

  @Post(":id/roles")
  async assignRole(
    @CurrentUser() actor: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(AssignRoleSchema)) body: ReturnType<typeof AssignRoleSchema.parse>,
  ) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: body.role } });
    await prisma.userRole.upsert({
      where: { user_id_role_id: { user_id: id, role_id: role.role_id } },
      update: {},
      create: { user_id: id, role_id: role.role_id },
    });
    await this.auditLogService.record({
      actorId: actor.userId,
      action: "ROLE_ASSIGNED",
      entityType: "user",
      entityId: id,
      metadata: { role: body.role },
    });
    return { ok: true };
  }

  @Post(":id/points-adjustment")
  async adjustPoints(
    @CurrentUser() actor: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(AdjustPointsSchema)) body: ReturnType<typeof AdjustPointsSchema.parse>,
  ) {
    const user = await prisma.$transaction(async (tx) => {
      await tx.pointsTransaction.create({
        data: { user_id: id, points: body.delta, reason: `Admin correction: ${body.reason}` },
      });
      const updated = await tx.user.update({
        where: { user_id: id },
        data: { total_points: { increment: body.delta } },
      });
      const newLevel = await this.levelsService.determineLevel(updated.total_points, updated.high_impact_flag);
      if (newLevel.level_id !== updated.current_level_id) {
        await tx.user.update({ where: { user_id: id }, data: { current_level_id: newLevel.level_id } });
      }
      return updated;
    });

    await this.auditLogService.record({
      actorId: actor.userId,
      action: "POINTS_ADJUSTED",
      entityType: "user",
      entityId: id,
      metadata: { delta: body.delta, reason: body.reason },
    });
    return { userId: id, totalPoints: user.total_points };
  }

  @Post(":id/gpu-credits-adjustment")
  async adjustGpuCredits(
    @CurrentUser() actor: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(AdjustGpuCreditsSchema)) body: ReturnType<typeof AdjustGpuCreditsSchema.parse>,
  ) {
    const user = await prisma.user.update({
      where: { user_id: id },
      data: { gpu_credit_balance: { increment: body.delta } },
    });
    await this.auditLogService.record({
      actorId: actor.userId,
      action: "GPU_CREDITS_ADJUSTED",
      entityType: "user",
      entityId: id,
      metadata: { delta: body.delta, reason: body.reason },
    });
    return { userId: id, gpuCreditBalance: user.gpu_credit_balance };
  }

  // Assigned Courses feature — "one department, one mentor" routing hint
  // (product-owner request) for course-submission and proctoring-
  // violation notifications; see MentorRoutingService.
  @Post(":id/mentor-department")
  async setMentorDepartment(
    @CurrentUser() actor: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(SetMentorDepartmentSchema)) body: ReturnType<typeof SetMentorDepartmentSchema.parse>,
  ) {
    const user = await prisma.user.update({ where: { user_id: id }, data: { mentor_department: body.department } });
    await this.auditLogService.record({
      actorId: actor.userId,
      action: "MENTOR_DEPARTMENT_SET",
      entityType: "user",
      entityId: id,
      metadata: { department: body.department },
    });
    return { userId: id, mentorDepartment: user.mentor_department };
  }

  // Open decision #1: Level 6 "High Impact" has no numeric rule yet, so
  // it's a manual, audited admin flag until one is defined.
  @Post(":id/high-impact-flag")
  async setHighImpactFlag(
    @CurrentUser() actor: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(SetHighImpactFlagSchema)) body: ReturnType<typeof SetHighImpactFlagSchema.parse>,
  ) {
    const user = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { user_id: id },
        data: { high_impact_flag: body.highImpactFlag },
      });
      const newLevel = await this.levelsService.determineLevel(updated.total_points, updated.high_impact_flag);
      if (newLevel.level_id !== updated.current_level_id) {
        return tx.user.update({ where: { user_id: id }, data: { current_level_id: newLevel.level_id } });
      }
      return updated;
    });

    await this.auditLogService.record({
      actorId: actor.userId,
      action: "HIGH_IMPACT_FLAG_SET",
      entityType: "user",
      entityId: id,
      metadata: { highImpactFlag: body.highImpactFlag, reason: body.reason },
    });
    return { userId: id, highImpactFlag: user.high_impact_flag, currentLevelId: user.current_level_id };
  }
}
