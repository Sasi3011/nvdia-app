-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CourseTaskType" AS ENUM ('STANDARD', 'LIVE_PROCTORED');

-- CreateEnum
CREATE TYPE "ProctoringStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'LOCKED');

-- CreateEnum
CREATE TYPE "ViolationType" AS ENUM ('FULLSCREEN_EXIT', 'TAB_SWITCH', 'WINDOW_BLUR');

-- AlterTable
ALTER TABLE "points_transactions" ADD COLUMN     "enrollment_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "mentor_department" TEXT;

-- CreateTable
CREATE TABLE "courses" (
    "course_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "external_url" TEXT NOT NULL,
    "points_value" INTEGER NOT NULL,
    "level_requirement" INTEGER,
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("course_id")
);

-- CreateTable
CREATE TABLE "course_enrollments" (
    "enrollment_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "submitted_proof_url" TEXT,
    "submitted_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "review_feedback" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_enrollments_pkey" PRIMARY KEY ("enrollment_id")
);

-- CreateTable
CREATE TABLE "course_tasks" (
    "task_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "CourseTaskType" NOT NULL DEFAULT 'STANDARD',
    "instructions" TEXT,
    "sequence_order" INTEGER NOT NULL DEFAULT 0,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_tasks_pkey" PRIMARY KEY ("task_id")
);

-- CreateTable
CREATE TABLE "course_task_completions" (
    "completion_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_task_completions_pkey" PRIMARY KEY ("completion_id")
);

-- CreateTable
CREATE TABLE "proctoring_sessions" (
    "session_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "ProctoringStatus" NOT NULL DEFAULT 'ACTIVE',
    "violation_count" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "locked_at" TIMESTAMP(3),
    "unlocked_by" TEXT,
    "unlocked_at" TIMESTAMP(3),

    CONSTRAINT "proctoring_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "proctoring_violations" (
    "violation_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "violation_type" "ViolationType" NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mentor_notified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "proctoring_violations_pkey" PRIMARY KEY ("violation_id")
);

-- CreateIndex
CREATE INDEX "courses_status_idx" ON "courses"("status");

-- CreateIndex
CREATE INDEX "course_enrollments_status_idx" ON "course_enrollments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "course_enrollments_course_id_user_id_key" ON "course_enrollments"("course_id", "user_id");

-- CreateIndex
CREATE INDEX "course_tasks_course_id_idx" ON "course_tasks"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_task_completions_task_id_user_id_key" ON "course_task_completions"("task_id", "user_id");

-- CreateIndex
CREATE INDEX "proctoring_sessions_task_id_user_id_idx" ON "proctoring_sessions"("task_id", "user_id");

-- CreateIndex
CREATE INDEX "proctoring_sessions_status_idx" ON "proctoring_sessions"("status");

-- CreateIndex
CREATE INDEX "proctoring_violations_session_id_idx" ON "proctoring_violations"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "points_transactions_enrollment_id_key" ON "points_transactions"("enrollment_id");

-- CreateIndex
CREATE INDEX "users_mentor_department_idx" ON "users"("mentor_department");

-- AddForeignKey
ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "course_enrollments"("enrollment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_tasks" ADD CONSTRAINT "course_tasks_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_task_completions" ADD CONSTRAINT "course_task_completions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "course_tasks"("task_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_task_completions" ADD CONSTRAINT "course_task_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proctoring_sessions" ADD CONSTRAINT "proctoring_sessions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "course_tasks"("task_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proctoring_sessions" ADD CONSTRAINT "proctoring_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proctoring_sessions" ADD CONSTRAINT "proctoring_sessions_unlocked_by_fkey" FOREIGN KEY ("unlocked_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proctoring_violations" ADD CONSTRAINT "proctoring_violations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "proctoring_sessions"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE;

