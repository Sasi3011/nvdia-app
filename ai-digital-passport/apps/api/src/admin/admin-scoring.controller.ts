import { Body, Controller, Get, Param, Put } from "@nestjs/common";
import { prisma } from "@ai-digital-passport/database";
import type { Level, ScoringRule } from "@ai-digital-passport/database";
import { UpdateLevelSchema, UpsertScoringRuleSchema, UserRole } from "@ai-digital-passport/shared-types";
import { AuditLogService } from "../common/audit-log/audit-log.service";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { Roles } from "../common/auth/roles.decorator";
import type { RequestUser } from "../common/auth/types";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { LevelsService } from "../levels/levels.service";

function ruleDto(r: ScoringRule) {
  return { category: r.category, label: r.label, points: r.points, maxClaimsPerUser: r.max_claims_per_user };
}

function levelDto(l: Level) {
  return {
    levelId: l.level_id,
    levelName: l.level_name,
    minPoints: l.min_points,
    unlockedPrivilege: l.unlocked_privilege,
    requiresHighImpact: l.requires_high_impact,
  };
}

// Scoring & Level Configuration (Page 28). Changing these is itself an
// auditable admin action (Section 17).
@Controller("admin/scoring")
@Roles(UserRole.ADMIN)
export class AdminScoringController {
  constructor(
    private readonly levelsService: LevelsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get("rules")
  async listRules() {
    const rules = await prisma.scoringRule.findMany({ orderBy: { points: "asc" } });
    return rules.map(ruleDto);
  }

  @Put("rules/:category")
  async upsertRule(
    @CurrentUser() user: RequestUser,
    @Param("category") category: string,
    @Body(new ZodValidationPipe(UpsertScoringRuleSchema)) body: ReturnType<typeof UpsertScoringRuleSchema.parse>,
  ) {
    const rule = await prisma.scoringRule.upsert({
      where: { category },
      update: { label: body.label, points: body.points, max_claims_per_user: body.maxClaimsPerUser },
      create: {
        category,
        label: body.label,
        points: body.points,
        max_claims_per_user: body.maxClaimsPerUser ?? null,
      },
    });
    await this.auditLogService.record({
      actorId: user.userId,
      action: "SCORING_RULE_UPDATED",
      entityType: "scoring_rule",
      entityId: category,
      metadata: { points: body.points },
    });
    return ruleDto(rule);
  }

  @Get("levels")
  async listLevels() {
    const levels = await this.levelsService.listLevels();
    return levels.map(levelDto);
  }

  @Put("levels/:levelId")
  async updateLevel(
    @CurrentUser() user: RequestUser,
    @Param("levelId") levelId: string,
    @Body(new ZodValidationPipe(UpdateLevelSchema)) body: ReturnType<typeof UpdateLevelSchema.parse>,
  ) {
    const level = await prisma.level.update({
      where: { level_id: Number(levelId) },
      data: {
        level_name: body.levelName,
        min_points: body.minPoints,
        unlocked_privilege: body.unlockedPrivilege,
        requires_high_impact: body.requiresHighImpact,
      },
    });
    await this.auditLogService.record({
      actorId: user.userId,
      action: "LEVEL_CONFIG_UPDATED",
      entityType: "level",
      entityId: levelId,
      metadata: body,
    });
    return levelDto(level);
  }
}
