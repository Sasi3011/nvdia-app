-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CourseTaskType" ADD VALUE 'MCQ';
ALTER TYPE "CourseTaskType" ADD VALUE 'CODING';

-- AlterTable
ALTER TABLE "course_task_completions" ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "score" INTEGER;

-- AlterTable
ALTER TABLE "course_tasks" ADD COLUMN     "content" JSONB;
