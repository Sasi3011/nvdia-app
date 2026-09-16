import { Controller, Get } from "@nestjs/common";
import { Public } from "../common/auth/public.decorator";
import { LevelsService } from "./levels.service";

// GET /levels — level thresholds and privileges (Page 4, Page 28).
// Public: this is reference data, not user-specific.
@Controller("levels")
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  @Public()
  @Get()
  async list() {
    const levels = await this.levelsService.listLevels();
    return levels.map((l) => ({
      levelId: l.level_id,
      levelName: l.level_name,
      minPoints: l.min_points,
      unlockedPrivilege: l.unlocked_privilege,
      requiresHighImpact: l.requires_high_impact,
    }));
  }
}
