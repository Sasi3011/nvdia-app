/**
 * Seeds configurable domain data: the six levels and the scoring matrix.
 * The values themselves live in packages/shared-types (single source of
 * truth for both apps and this seed) — see that package's src/enums.ts
 * for the spec references and the Level 6 "High Impact" open-decision
 * note.
 */
import { PrismaClient } from "@prisma/client";
import { LEVEL_DEFINITIONS, SCORING_MATRIX, UserRole } from "@ai-digital-passport/shared-types";

const prisma = new PrismaClient();

async function main() {
  for (const role of Object.values(UserRole)) {
    await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: { name: role },
    });
  }

  for (const level of LEVEL_DEFINITIONS) {
    await prisma.level.upsert({
      where: { level_id: level.levelId },
      update: {
        level_name: level.levelName,
        min_points: level.minPoints,
        unlocked_privilege: level.unlockedPrivilege,
        requires_high_impact: level.requiresHighImpact,
      },
      create: {
        level_id: level.levelId,
        level_name: level.levelName,
        min_points: level.minPoints,
        unlocked_privilege: level.unlockedPrivilege,
        requires_high_impact: level.requiresHighImpact,
      },
    });
  }

  for (const rule of SCORING_MATRIX) {
    await prisma.scoringRule.upsert({
      where: { category: rule.category },
      update: { label: rule.label, points: rule.points },
      create: { category: rule.category, label: rule.label, points: rule.points },
    });
  }

  const awardNames = [
    "AI Student of the Year",
    "AI Researcher of the Year",
    "Best AI Project",
    "Best AI Startup",
    "Best AI Faculty Mentor",
    "Best Industry Mentor",
    "Most Active AI Learner",
    "Best GPU Computing Project",
  ];
  for (const name of awardNames) {
    await prisma.award.upsert({ where: { name }, update: {}, create: { name } });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
