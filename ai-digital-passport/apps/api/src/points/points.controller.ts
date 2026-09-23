import { Controller, Get, Query } from "@nestjs/common";
import { prisma } from "@ai-digital-passport/database";
import { PaginationQuerySchema } from "@ai-digital-passport/shared-types";
import { CurrentUser } from "../common/auth/current-user.decorator";
import type { RequestUser } from "../common/auth/types";
import { pageSkipTake, toPaginatedResult } from "../common/pagination/pagination";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { PointsService } from "./points.service";

// GET /me/points — point balance and transaction history (Page 4).
@Controller("me/points")
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get()
  async myPoints(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: { page: number; pageSize: number },
  ) {
    const { skip, take } = pageSkipTake(query);
    const [{ items, total }, currentUser] = await Promise.all([
      this.pointsService.listForUser(user.userId, skip, take),
      prisma.student.findUnique({ where: { user_id: user.userId } }),
    ]);

    return {
      balance: currentUser?.total_points ?? 0,
      transactions: toPaginatedResult(
        items.map((t) => ({
          transactionId: t.transaction_id,
          claimId: t.claim_id,
          points: t.points,
          reason: t.reason,
          createdAt: t.created_at,
        })),
        total,
        query,
      ),
    };
  }
}
