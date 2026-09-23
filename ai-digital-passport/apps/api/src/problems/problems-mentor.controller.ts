import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { PaginationQuerySchema, ReviewProblemMilestoneSchema, UserRole } from "@ai-digital-passport/shared-types";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { Roles } from "../common/auth/roles.decorator";
import type { RequestUser } from "../common/auth/types";
import { pageSkipTake, toPaginatedResult } from "../common/pagination/pagination";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { ProblemsService } from "./problems.service";

// Industry Problem Bank — Solution Stage Review, same approve/reject-with-
// feedback pattern as Startup Milestone Review (open decision #5).
@Controller("mentor/problems")
@Roles(UserRole.MENTOR, UserRole.ADMIN)
export class ProblemsMentorController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Get()
  async pending(@Query(new ZodValidationPipe(PaginationQuerySchema)) query: { page: number; pageSize: number }) {
    const { skip, take } = pageSkipTake(query);
    const { items, total } = await this.problemsService.pendingMilestones(skip, take);
    return toPaginatedResult(
      items.map((m) => ({
        milestoneId: m.milestone_id,
        targetStage: m.target_stage,
        evidenceUrl: m.evidence_url,
        details: m.details,
        createdAt: m.created_at,
        project: {
          projectId: m.project.project_id,
          problemTitle: m.project.problem.title,
          organization: m.project.problem.organization,
          studentName: m.project.user.full_name,
        },
      })),
      total,
      query,
    );
  }

  @Post(":id/review")
  async review(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(ReviewProblemMilestoneSchema)) body: ReturnType<typeof ReviewProblemMilestoneSchema.parse>,
  ) {
    return this.problemsService.reviewMilestone(id, user.userId, body.decision, body.feedback);
  }
}
