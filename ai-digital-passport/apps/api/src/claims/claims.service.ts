import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@ai-digital-passport/database";
import { UserRole, type ListClaimsQuery } from "@ai-digital-passport/shared-types";

@Injectable()
export class ClaimsService {
  async listForUser(userId: string, query: ListClaimsQuery, skip: number, take: number) {
    const where = { user_id: userId, status: query.status, category: query.category };
    const [items, total] = await Promise.all([
      prisma.activityClaim.findMany({ where, orderBy: { created_at: "desc" }, skip, take }),
      prisma.activityClaim.count({ where }),
    ]);
    return { items, total };
  }

  // Page 16: own claim (student), or any claim if reviewing (mentor/admin
  // — shared-pool review model, open decision #3).
  async findByIdForViewer(claimId: string, viewer: { userId: string; roles: UserRole[] }) {
    const claim = await prisma.activityClaim.findUnique({
      where: { claim_id: claimId },
      include: { attachments: true, reviews: { orderBy: { created_at: "desc" } }, reviewer: true, claimant: true },
    });
    if (!claim) throw new NotFoundException({ code: "CLAIM_NOT_FOUND" });

    const isOwner = claim.user_id === viewer.userId;
    const isReviewer = viewer.roles.includes(UserRole.MENTOR) || viewer.roles.includes(UserRole.ADMIN);
    if (!isOwner && !isReviewer) {
      throw new ForbiddenException({ code: "NOT_YOUR_CLAIM", message: "You cannot view this claim." });
    }
    return claim;
  }

  // Evidence viewer (Page 22) — same authorization as the claim itself
  // (SEC-07: downloads authorized through the app, not a public URL).
  async getAttachmentForViewer(claimId: string, attachmentId: string, viewer: { userId: string; roles: UserRole[] }) {
    const claim = await this.findByIdForViewer(claimId, viewer);
    const attachment = claim.attachments.find((a) => a.attachment_id === attachmentId);
    if (!attachment) throw new NotFoundException({ code: "ATTACHMENT_NOT_FOUND" });
    return attachment;
  }
}
