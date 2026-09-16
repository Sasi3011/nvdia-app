import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ClaimStatus } from "@ai-digital-passport/database";
import { ApproveClaimSchema, PaginationQuerySchema, RejectClaimSchema, UserRole } from "@ai-digital-passport/shared-types";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { Roles } from "../common/auth/roles.decorator";
import type { RequestUser } from "../common/auth/types";
import { pageSkipTake, toPaginatedResult } from "../common/pagination/pagination";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { MentorService } from "./mentor.service";

// GET /mentor/claims, POST /mentor/claims/:id/approve|reject (Page 20-22).
// SEC-05: role-checked server-side — a student can never call these.
@Controller("mentor/claims")
@Roles(UserRole.MENTOR, UserRole.ADMIN)
export class MentorController {
  constructor(private readonly mentorService: MentorService) {}

  @Get()
  async queue(
    @Query(new ZodValidationPipe(PaginationQuerySchema)) pagination: { page: number; pageSize: number },
    @Query("status") status?: ClaimStatus,
    @Query("category") category?: string,
  ) {
    const { skip, take } = pageSkipTake(pagination);
    const { items, total } = await this.mentorService.queue(status, category, skip, take);
    return toPaginatedResult(
      items.map((c) => ({
        claimId: c.claim_id,
        category: c.category,
        proofType: c.proof_type,
        pointsRequested: c.points_requested,
        status: c.status,
        createdAt: c.created_at,
        student: { userId: c.claimant.user_id, fullName: c.claimant.full_name },
      })),
      total,
      pagination,
    );
  }

  @Post(":id/approve")
  async approve(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(ApproveClaimSchema)) body: ReturnType<typeof ApproveClaimSchema.parse>,
  ) {
    return this.mentorService.approve(id, user.userId, body.pointsAwarded);
  }

  @Post(":id/reject")
  async reject(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(RejectClaimSchema)) body: ReturnType<typeof RejectClaimSchema.parse>,
  ) {
    return this.mentorService.reject(id, user.userId, body.feedback);
  }
}
