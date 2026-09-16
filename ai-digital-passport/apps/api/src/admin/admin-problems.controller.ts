import { Body, Controller, Get, Param, Post, Put, Query } from "@nestjs/common";
import { prisma } from "@ai-digital-passport/database";
import type { IndustryProblem } from "@ai-digital-passport/database";
import { PaginationQuerySchema, UpsertProblemSchema, UserRole } from "@ai-digital-passport/shared-types";
import { AuditLogService } from "../common/audit-log/audit-log.service";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { Roles } from "../common/auth/roles.decorator";
import type { RequestUser } from "../common/auth/types";
import { pageSkipTake, toPaginatedResult } from "../common/pagination/pagination";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";

function problemDto(p: IndustryProblem) {
  return {
    problemId: p.problem_id,
    title: p.title,
    description: p.description,
    organization: p.organization,
    status: p.status,
    levelRequirement: p.level_requirement,
    createdAt: p.created_at,
  };
}

// Problem Bank Management (Page 26) — full CRUD including drafts, unlike
// the student-facing GET /problems (published + level-gated only).
@Controller("admin/problems")
@Roles(UserRole.ADMIN)
export class AdminProblemsController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  async list(@Query(new ZodValidationPipe(PaginationQuerySchema)) query: { page: number; pageSize: number }) {
    const { skip, take } = pageSkipTake(query);
    const [items, total] = await Promise.all([
      prisma.industryProblem.findMany({ orderBy: { created_at: "desc" }, skip, take }),
      prisma.industryProblem.count(),
    ]);
    return toPaginatedResult(items.map(problemDto), total, query);
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(UpsertProblemSchema)) body: ReturnType<typeof UpsertProblemSchema.parse>,
  ) {
    const problem = await prisma.industryProblem.create({
      data: {
        title: body.title,
        description: body.description,
        organization: body.organization,
        status: body.status,
        level_requirement: body.levelRequirement,
        created_by: user.userId,
      },
    });
    await this.auditLogService.record({ actorId: user.userId, action: "PROBLEM_CREATED", entityType: "industry_problem", entityId: problem.problem_id });
    return problemDto(problem);
  }

  @Put(":id")
  async update(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpsertProblemSchema)) body: ReturnType<typeof UpsertProblemSchema.parse>,
  ) {
    const problem = await prisma.industryProblem.update({
      where: { problem_id: id },
      data: {
        title: body.title,
        description: body.description,
        organization: body.organization,
        status: body.status,
        level_requirement: body.levelRequirement,
      },
    });
    await this.auditLogService.record({ actorId: user.userId, action: "PROBLEM_UPDATED", entityType: "industry_problem", entityId: id });
    return problemDto(problem);
  }
}
