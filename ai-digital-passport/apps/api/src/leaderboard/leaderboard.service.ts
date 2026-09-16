import { Injectable, Logger } from "@nestjs/common";
import { prisma } from "@ai-digital-passport/database";
import { RedisService } from "../common/redis/redis.service";

const LEADERBOARD_KEY = "leaderboard:total_points";

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(private readonly redisService: RedisService) {}

  // Called after any point award so the cache stays warm (Redis is
  // disposable/rebuildable — spec 01 Section 2 architectural principle).
  async setScore(userId: string, totalPoints: number): Promise<void> {
    try {
      await this.redisService.client.zadd(LEADERBOARD_KEY, totalPoints, userId);
    } catch (error) {
      this.logger.warn(`Redis unavailable while updating leaderboard: ${(error as Error).message}`);
    }
  }

  // GET /leaderboard — ranked by total_points desc. Tie-break: created_at
  // asc (earliest account to reach the score wins) — an explicit,
  // documented assumption (open decision #9), not silently invented as
  // "the" rule; falls back to a direct PostgreSQL query if Redis is down
  // (Risk: "Redis outage", spec 04 NFR-AVAIL).
  async top(limit: number) {
    try {
      const raw = await this.redisService.client.zrevrange(LEADERBOARD_KEY, 0, limit - 1, "WITHSCORES");
      if (raw.length > 0) {
        const userIds: string[] = [];
        const scoreByUser = new Map<string, number>();
        for (let i = 0; i < raw.length; i += 2) {
          const userId = raw[i];
          const score = raw[i + 1];
          if (!userId || score === undefined) continue;
          userIds.push(userId);
          scoreByUser.set(userId, Number(score));
        }
        const users = await prisma.user.findMany({
          where: { user_id: { in: userIds } },
          include: { current_level: true },
        });
        const byId = new Map(users.map((u) => [u.user_id, u]));
        return userIds
          .map((id) => byId.get(id))
          .filter((u): u is NonNullable<typeof u> => !!u)
          .map((u) => ({
            userId: u.user_id,
            fullName: u.full_name,
            totalPoints: scoreByUser.get(u.user_id) ?? u.total_points,
            levelName: u.current_level.level_name,
          }));
      }
    } catch (error) {
      this.logger.warn(`Redis unavailable, falling back to PostgreSQL for leaderboard: ${(error as Error).message}`);
    }

    const users = await prisma.user.findMany({
      orderBy: [{ total_points: "desc" }, { created_at: "asc" }],
      take: limit,
      include: { current_level: true },
    });
    return users.map((u) => ({
      userId: u.user_id,
      fullName: u.full_name,
      totalPoints: u.total_points,
      levelName: u.current_level.level_name,
    }));
  }

  async rebuildFromPostgres(): Promise<number> {
    const users = await prisma.user.findMany({ select: { user_id: true, total_points: true } });
    if (users.length === 0) return 0;
    await this.redisService.client.del(LEADERBOARD_KEY);
    const args: (string | number)[] = [];
    for (const u of users) args.push(u.total_points, u.user_id);
    await this.redisService.client.zadd(LEADERBOARD_KEY, ...args);
    return users.length;
  }
}
