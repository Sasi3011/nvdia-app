import { Injectable, Logger } from "@nestjs/common";
import { Prisma, prisma } from "@ai-digital-passport/database";
import { NotificationType } from "@ai-digital-passport/shared-types";
import { LeaderboardService } from "../leaderboard/leaderboard.service";
import { LevelsService } from "../levels/levels.service";
import { NotificationsService } from "../notifications/notifications.service";

const UNIQUE_CONSTRAINT_VIOLATION = "P2002";

@Injectable()
export class PointsService {
  private readonly logger = new Logger(PointsService.name);

  constructor(
    private readonly levelsService: LevelsService,
    private readonly notificationsService: NotificationsService,
    private readonly leaderboardService: LeaderboardService,
  ) {}

  /**
   * Awards points for exactly one claim, idempotently (BR-04/BR-06, NFR
   * reliability: "duplicate submissions never create duplicate rewards").
   * `points_transactions.claim_id` is unique, so a second call for the
   * same claim can never insert a second transaction — the unique
   * violation is caught and treated as an already-applied no-op rather
   * than an error, which is what makes retries safe.
   *
   * Re-evaluates the user's level (BR-08) inside the same transaction and
   * fires a LEVEL_UP notification when a threshold is crossed.
   */
  async awardForClaim(params: { userId: string; claimId: string; points: number; reason: string }) {
    return this.award({ userId: params.userId, points: params.points, reason: params.reason, claimId: params.claimId });
  }

  /**
   * Assigned Courses feature — identical idempotent award/level-evaluation
   * path as awardForClaim, keyed to points_transactions.enrollment_id's
   * unique constraint instead of claim_id (BR-14). No parallel points
   * pipeline: this is the same method as every other approval path in the
   * app, just called with a different unique key.
   */
  async awardForEnrollment(params: { userId: string; enrollmentId: string; points: number; reason: string }) {
    return this.award({ userId: params.userId, points: params.points, reason: params.reason, enrollmentId: params.enrollmentId });
  }

  async awardGeneric(params: { userId: string; points: number; reason: string }) {
    return this.award({ userId: params.userId, points: params.points, reason: params.reason });
  }

  private async award(params: { userId: string; points: number; reason: string; claimId?: string; enrollmentId?: string }): Promise<{
    alreadyAwarded: boolean;
    totalPoints: number;
    leveledUp: boolean;
  }> {
    const idempotencyLabel = params.claimId ? `claim ${params.claimId}` : `enrollment ${params.enrollmentId}`;
    try {
      const result = await prisma.$transaction(async (tx) => {
        await tx.pointsTransaction.create({
          data: {
            user_id: params.userId,
            claim_id: params.claimId,
            enrollment_id: params.enrollmentId,
            points: params.points,
            reason: params.reason,
          },
        });

        const user = await tx.user.update({
          where: { user_id: params.userId },
          data: { total_points: { increment: params.points } },
        });

        const newLevel = await this.levelsService.determineLevel(user.total_points, user.high_impact_flag);
        const leveledUp = newLevel.level_id !== user.current_level_id;
        if (leveledUp) {
          await tx.user.update({
            where: { user_id: params.userId },
            data: { current_level_id: newLevel.level_id },
          });
        }

        const badgeRules = await tx.badgeRule.findMany({ where: { active: true, trigger: "TOTAL_POINTS", threshold: { lte: user.total_points } } });
        for (const rule of badgeRules) {
          await tx.userBadge.upsert({
            where: { user_id_badge_id: { user_id: params.userId, badge_id: rule.badge_id } },
            update: {},
            create: { user_id: params.userId, badge_id: rule.badge_id },
          });
        }

        return { totalPoints: user.total_points, leveledUp, newLevelName: newLevel.level_name };
      });

      if (result.leveledUp) {
        await this.notificationsService.create({
          userId: params.userId,
          type: NotificationType.LEVEL_UP,
          title: "You leveled up!",
          message: `You've reached ${result.newLevelName}.`,
        });
      }
      await this.leaderboardService.setScore(params.userId, result.totalPoints);

      return { alreadyAwarded: false, totalPoints: result.totalPoints, leveledUp: result.leveledUp };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_CONSTRAINT_VIOLATION) {
        this.logger.warn(`Points already awarded for ${idempotencyLabel} — idempotent no-op.`);
        const user = await prisma.user.findUniqueOrThrow({ where: { user_id: params.userId } });
        return { alreadyAwarded: true, totalPoints: user.total_points, leveledUp: false };
      }
      throw error;
    }
  }

  async listForUser(userId: string, skip: number, take: number) {
    const [items, total] = await Promise.all([
      prisma.pointsTransaction.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        skip,
        take,
      }),
      prisma.pointsTransaction.count({ where: { user_id: userId } }),
    ]);
    return { items, total };
  }
}
