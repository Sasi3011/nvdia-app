import { Controller, Get, Param, Query } from "@nestjs/common";
import { ListClaimsQuerySchema } from "@ai-digital-passport/shared-types";
import { CurrentUser } from "../common/auth/current-user.decorator";
import type { RequestUser } from "../common/auth/types";
import { pageSkipTake, toPaginatedResult } from "../common/pagination/pagination";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { UploadsService } from "../uploads/uploads.service";
import { ClaimsService } from "./claims.service";

// GET /claims, GET /claims/:id (Page 15, Page 16).
@Controller("claims")
export class ClaimsController {
  constructor(
    private readonly claimsService: ClaimsService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(ListClaimsQuerySchema)) query: ReturnType<typeof ListClaimsQuerySchema.parse>,
  ) {
    const { skip, take } = pageSkipTake(query);
    const { items, total } = await this.claimsService.listForUser(user.userId, query, skip, take);
    return toPaginatedResult(
      items.map((c) => ({
        claimId: c.claim_id,
        category: c.category,
        proofType: c.proof_type,
        pointsRequested: c.points_requested,
        pointsAwarded: c.points_awarded,
        status: c.status,
        mentorFeedback: c.mentor_feedback,
        createdAt: c.created_at,
      })),
      total,
      query,
    );
  }

  @Get(":id")
  async detail(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    const claim = await this.claimsService.findByIdForViewer(id, user);
    return {
      claimId: claim.claim_id,
      category: claim.category,
      proofType: claim.proof_type,
      proofUrl: claim.proof_url,
      pointsRequested: claim.points_requested,
      pointsAwarded: claim.points_awarded,
      status: claim.status,
      mentorFeedback: claim.mentor_feedback,
      reviewedAt: claim.reviewed_at,
      createdAt: claim.created_at,
      claimant: { userId: claim.claimant.user_id, fullName: claim.claimant.full_name },
      attachments: claim.attachments.map((a) => ({ attachmentId: a.attachment_id, fileKey: a.file_key, fileName: a.file_name })),
      reviews: claim.reviews.map((r) => ({
        reviewId: r.review_id,
        decision: r.decision,
        comment: r.comment,
        createdAt: r.created_at,
      })),
    };
  }

  // Evidence viewer (Page 22) — presigned, time-limited GET URL rather
  // than a public one (SEC-07).
  @Get(":id/attachments/:attachmentId/download-url")
  async downloadUrl(@CurrentUser() user: RequestUser, @Param("id") id: string, @Param("attachmentId") attachmentId: string) {
    const attachment = await this.claimsService.getAttachmentForViewer(id, attachmentId, user);
    return this.uploadsService.presignDownload(attachment.file_key);
  }
}
