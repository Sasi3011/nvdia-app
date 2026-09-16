import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ClaimStatus, prisma } from "@ai-digital-passport/database";
import type { CreateActivityClaimInput } from "@ai-digital-passport/shared-types";

@Injectable()
export class ActivitiesService {
  // GET /activities?category= — "available activities to claim" is the
  // scoring matrix itself (each module page shows its category's point
  // value, Page 5-10); optionally filtered to one category.
  async discover(category?: string) {
    return prisma.scoringRule.findMany({
      where: category ? { category } : undefined,
      orderBy: { points: "asc" },
    });
  }

  // POST /activities — creates the claim (Page 14). Points are always
  // server-derived from the scoring matrix (BR-03) — never client-supplied.
  async createClaim(userId: string, input: CreateActivityClaimInput) {
    const scoringRule = await prisma.scoringRule.findUnique({ where: { category: input.category } });
    if (!scoringRule) {
      throw new NotFoundException({ code: "UNKNOWN_CATEGORY", message: "No scoring rule for that category." });
    }

    if (scoringRule.max_claims_per_user != null) {
      const existingCount = await prisma.activityClaim.count({
        where: { user_id: userId, category: input.category, status: { not: ClaimStatus.REJECTED } },
      });
      if (existingCount >= scoringRule.max_claims_per_user) {
        throw new BadRequestException({
          code: "CLAIM_LIMIT_REACHED",
          message: `You've reached the maximum number of claims for ${scoringRule.label}.`,
        });
      }
    }

    return prisma.activityClaim.create({
      data: {
        user_id: userId,
        category: input.category,
        proof_type: input.proofType,
        proof_url: input.proofUrl,
        points_requested: scoringRule.points,
        status: ClaimStatus.PENDING,
        attachments:
          input.proofType === "PDF_FILE" && input.fileKey
            ? {
                create: {
                  file_key: input.fileKey,
                  file_name: input.fileName ?? input.fileKey,
                  mime_type: input.mimeType ?? "application/pdf",
                  size_bytes: input.sizeBytes ?? 0,
                },
              }
            : undefined,
      },
      include: { attachments: true },
    });
  }
}
