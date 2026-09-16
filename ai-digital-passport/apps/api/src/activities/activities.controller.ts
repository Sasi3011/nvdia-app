import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { CreateActivityClaimSchema } from "@ai-digital-passport/shared-types";
import { CurrentUser } from "../common/auth/current-user.decorator";
import type { RequestUser } from "../common/auth/types";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { ActivitiesService } from "./activities.service";

// GET/POST /activities — activity discovery + claim submission (Page 5-10,
// Page 14).
@Controller("activities")
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  async discover(@Query("category") category?: string) {
    const rules = await this.activitiesService.discover(category);
    return rules.map((r) => ({ category: r.category, label: r.label, points: r.points }));
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(CreateActivityClaimSchema)) body: ReturnType<typeof CreateActivityClaimSchema.parse>,
  ) {
    const claim = await this.activitiesService.createClaim(user.userId, body);
    return {
      claimId: claim.claim_id,
      category: claim.category,
      proofType: claim.proof_type,
      pointsRequested: claim.points_requested,
      status: claim.status,
      createdAt: claim.created_at,
    };
  }
}
