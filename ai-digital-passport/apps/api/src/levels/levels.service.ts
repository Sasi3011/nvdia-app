import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { prisma } from "@ai-digital-passport/database";
import type { Level } from "@ai-digital-passport/database";

@Injectable()
export class LevelsService {
  async listLevels(): Promise<Level[]> {
    return prisma.level.findMany({ orderBy: { level_id: "asc" } });
  }

  /**
   * BR-08 / spec 03 Section 7.4 step 4, spec 04 Section 11.2: re-evaluate
   * from the highest eligibility condition down to the lowest every time a
   * point transaction posts. A level whose `requires_high_impact` is true
   * (Level 6 in the seeded data — open decision #1) additionally requires
   * the user's `high_impact_flag`.
   */
  async determineLevel(totalPoints: number, highImpactFlag: boolean): Promise<Level> {
    const levels = await prisma.level.findMany({ orderBy: { level_id: "desc" } });
    for (const level of levels) {
      if (totalPoints < level.min_points) continue;
      if (level.requires_high_impact && !highImpactFlag) continue;
      return level;
    }
    // Fallback: lowest level (Level 1 has min_points 0, so this only
    // triggers if seed data is missing/misconfigured).
    const lowest = levels[levels.length - 1];
    if (!lowest) {
      throw new InternalServerErrorException({ code: "LEVELS_NOT_SEEDED", message: "No levels configured." });
    }
    return lowest;
  }
}
