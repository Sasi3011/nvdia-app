import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ClaimStatus, prisma } from "@ai-digital-passport/database";
import { NotificationType } from "@ai-digital-passport/shared-types";
import { AuditLogService } from "../common/audit-log/audit-log.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PointsService } from "../points/points.service";

@Injectable()
export class MentorService {
  constructor(
    private readonly pointsService: PointsService,
    private readonly notificationsService: NotificationsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  // GET /mentor/claims — shared-pool queue (open decision #3): any mentor
  // can see and open any PENDING claim, no pre-assignment.
  async queue(status: ClaimStatus | undefined, category: string | undefined, skip: number, take: number) {
    const where = { status: status ?? ClaimStatus.PENDING, category };
    const [items, total] = await Promise.all([
      prisma.activityClaim.findMany({
        where,
        orderBy: { created_at: "asc" },
        skip,
        take,
        include: { claimant: true },
      }),
      prisma.activityClaim.count({ where }),
    ]);
    return { items, total };
  }

  /**
   * Approve: PENDING -> APPROVED, then award points (BR-06). The
   * conditional `updateMany` with `status: PENDING` in the WHERE clause is
   * what makes two mentors approving the same claim concurrently safe —
   * only the first one to land actually transitions the row; the second
   * gets `count === 0` and a clear conflict instead of double-approving
   * (Section 21.1 "Duplicate mentor approval request").
   */
  async approve(claimId: string, reviewerId: string, pointsAwardedOverride: number | undefined) {
    const claim = await prisma.activityClaim.findUnique({ where: { claim_id: claimId } });
    if (!claim) throw new NotFoundException({ code: "CLAIM_NOT_FOUND" });

    const pointsAwarded = pointsAwardedOverride ?? claim.points_requested;

    const { count } = await prisma.activityClaim.updateMany({
      where: { claim_id: claimId, status: ClaimStatus.PENDING },
      data: {
        status: ClaimStatus.APPROVED,
        points_awarded: pointsAwarded,
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
      },
    });
    if (count === 0) {
      throw new ConflictException({
        code: "CLAIM_ALREADY_REVIEWED",
        message: "This claim was already reviewed by someone else.",
      });
    }

    await prisma.claimReview.create({
      data: { claim_id: claimId, reviewer_id: reviewerId, decision: ClaimStatus.APPROVED },
    });

    const award = await this.pointsService.awardForClaim({
      userId: claim.user_id,
      claimId,
      points: pointsAwarded,
      reason: `Claim approved: ${claim.category}`,
    });

    await this.notificationsService.create({
      userId: claim.user_id,
      type: NotificationType.CLAIM_APPROVED,
      title: "Your claim was approved",
      message: `+${pointsAwarded} points for ${claim.category}.`,
    });

    await this.auditLogService.record({
      actorId: reviewerId,
      action: "CLAIM_APPROVED",
      entityType: "activity_claim",
      entityId: claimId,
      metadata: { pointsAwarded },
    });

    return { claimId, status: ClaimStatus.APPROVED, pointsAwarded, ...award };
  }

  async reject(claimId: string, reviewerId: string, feedback: string) {
    const claim = await prisma.activityClaim.findUnique({ where: { claim_id: claimId } });
    if (!claim) throw new NotFoundException({ code: "CLAIM_NOT_FOUND" });

    const { count } = await prisma.activityClaim.updateMany({
      where: { claim_id: claimId, status: ClaimStatus.PENDING },
      data: {
        status: ClaimStatus.REJECTED,
        mentor_feedback: feedback,
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
      },
    });
    if (count === 0) {
      throw new ConflictException({
        code: "CLAIM_ALREADY_REVIEWED",
        message: "This claim was already reviewed by someone else.",
      });
    }

    await prisma.claimReview.create({
      data: { claim_id: claimId, reviewer_id: reviewerId, decision: ClaimStatus.REJECTED, comment: feedback },
    });

    await this.notificationsService.create({
      userId: claim.user_id,
      type: NotificationType.CLAIM_REJECTED,
      title: "Your claim was rejected",
      message: feedback,
    });

    await this.auditLogService.record({
      actorId: reviewerId,
      action: "CLAIM_REJECTED",
      entityType: "activity_claim",
      entityId: claimId,
      metadata: { feedback },
    });

    return { claimId, status: ClaimStatus.REJECTED };
  }
}
