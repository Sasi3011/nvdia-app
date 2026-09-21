import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { PaginationQuerySchema, ReviewStartupMilestoneSchema, UserRole } from "@ai-digital-passport/shared-types";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { Roles } from "../common/auth/roles.decorator";
import type { RequestUser } from "../common/auth/types";
import { pageSkipTake, toPaginatedResult } from "../common/pagination/pagination";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { StartupService } from "./startup.service";

// Startup Milestone Review (Page 23) — same approve/reject-with-feedback
// pattern as claim review (open decision #5).
@Controller("mentor/startups")
@Roles(UserRole.MENTOR, UserRole.ADMIN)
export class StartupMentorController {
  constructor(private readonly startupService: StartupService) {}

  @Get()
  async pending(@Query(new ZodValidationPipe(PaginationQuerySchema)) query: { page: number; pageSize: number }) {
    const { skip, take } = pageSkipTake(query);
    const { items, total } = await this.startupService.pendingMilestones(skip, take);
    return toPaginatedResult(
      items.map((m) => ({
        milestoneId: m.milestone_id,
        targetStage: m.target_stage,
        evidenceUrl: m.evidence_url,
        details: m.details,
        createdAt: m.created_at,
        project: { projectId: m.project.project_id, title: m.project.title, leadName: m.project.lead.full_name },
      })),
      total,
      query,
    );
  }

  @Post(":id/review")
  async review(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(ReviewStartupMilestoneSchema)) body: ReturnType<typeof ReviewStartupMilestoneSchema.parse>,
  ) {
    return this.startupService.reviewMilestone(id, user.userId, body.decision, body.feedback);
  }
}
