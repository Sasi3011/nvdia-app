-- Replace the single-shot "problem_submissions" evidence table with a
-- staged project/milestone pair, mirroring startup_projects/startup_milestones:
-- students now progress a problem solution through 6 mentor-approved phases
-- instead of one free-form submission.

-- DropTable (safe no-op where it was never applied)
DROP TABLE IF EXISTS "problem_submissions";

-- CreateTable
CREATE TABLE "problem_projects" (
    "project_id" TEXT NOT NULL,
    "problem_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_stage" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "problem_projects_pkey" PRIMARY KEY ("project_id")
);

-- CreateTable
CREATE TABLE "problem_milestones" (
    "milestone_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "target_stage" INTEGER NOT NULL,
    "evidence_url" TEXT,
    "details" JSONB,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "feedback" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "problem_milestones_pkey" PRIMARY KEY ("milestone_id")
);

-- CreateIndex
CREATE INDEX "problem_projects_problem_id_idx" ON "problem_projects"("problem_id");

-- CreateIndex
CREATE INDEX "problem_projects_user_id_idx" ON "problem_projects"("user_id");

-- CreateIndex
CREATE INDEX "problem_milestones_project_id_idx" ON "problem_milestones"("project_id");

-- AddForeignKey
ALTER TABLE "problem_projects" ADD CONSTRAINT "problem_projects_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "industry_problems"("problem_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_projects" ADD CONSTRAINT "problem_projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_milestones" ADD CONSTRAINT "problem_milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "problem_projects"("project_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_milestones" ADD CONSTRAINT "problem_milestones_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
