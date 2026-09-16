ALTER TABLE "courses"
  ADD COLUMN "short_description" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "category" TEXT NOT NULL DEFAULT 'AI Foundation',
  ADD COLUMN "difficulty" TEXT NOT NULL DEFAULT 'Beginner',
  ADD COLUMN "duration_hours" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "duration_weeks" INTEGER,
  ADD COLUMN "delivery_mode" TEXT NOT NULL DEFAULT 'Online',
  ADD COLUMN "enrollment_type" TEXT NOT NULL DEFAULT 'Open',
  ADD COLUMN "certificate_available" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "is_featured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "skills_covered" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "prerequisites" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "learning_outcomes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "tools_required" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "target_audience" TEXT NOT NULL DEFAULT '';

CREATE INDEX "courses_category_idx" ON "courses"("category");
CREATE INDEX "courses_difficulty_idx" ON "courses"("difficulty");
CREATE INDEX "courses_is_featured_idx" ON "courses"("is_featured");
