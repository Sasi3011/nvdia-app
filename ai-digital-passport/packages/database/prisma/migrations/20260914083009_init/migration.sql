-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('STUDENT', 'MENTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProofType" AS ENUM ('TOTP_QR', 'PDF_FILE', 'GITHUB_LINK', 'DOI_LINK');

-- CreateEnum
CREATE TYPE "ProblemStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CLAIM_APPROVED', 'CLAIM_REJECTED', 'MENTOR_REVIEW_REMINDER', 'LEVEL_UP', 'AWARD_RESULT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NominationStatus" AS ENUM ('NOMINATED', 'CONFIRMED', 'DECLINED');

-- CreateTable
CREATE TABLE "levels" (
    "level_id" INTEGER NOT NULL,
    "level_name" TEXT NOT NULL,
    "min_points" INTEGER NOT NULL,
    "unlocked_privilege" TEXT NOT NULL,
    "requires_high_impact" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "levels_pkey" PRIMARY KEY ("level_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "register_num" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "cohort_year" INTEGER NOT NULL,
    "current_level_id" INTEGER NOT NULL DEFAULT 1,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "gpu_credit_balance" INTEGER NOT NULL DEFAULT 0,
    "google_id" TEXT,
    "avatar_url" TEXT,
    "high_impact_flag" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "activity_claims" (
    "claim_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "proof_type" "ProofType" NOT NULL,
    "proof_url" TEXT,
    "points_requested" INTEGER NOT NULL,
    "points_awarded" INTEGER,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "mentor_feedback" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_claims_pkey" PRIMARY KEY ("claim_id")
);

-- CreateTable
CREATE TABLE "startup_projects" (
    "project_id" TEXT NOT NULL,
    "lead_student_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "current_stage" INTEGER NOT NULL DEFAULT 1,
    "gpu_validated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "startup_projects_pkey" PRIMARY KEY ("project_id")
);

-- CreateTable
CREATE TABLE "roles" (
    "role_id" TEXT NOT NULL,
    "name" "RoleName" NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_role_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_role_id")
);

-- CreateTable
CREATE TABLE "events" (
    "event_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "event_sessions" (
    "session_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "qr_secret" TEXT,
    "qr_active" BOOLEAN NOT NULL DEFAULT false,
    "qr_window_seconds" INTEGER NOT NULL DEFAULT 15,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "qr_tokens" (
    "qr_token_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,
    "window_end" TIMESTAMP(3) NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qr_tokens_pkey" PRIMARY KEY ("qr_token_id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "attendance_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "qr_token_id" TEXT,
    "checked_in_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("attendance_id")
);

-- CreateTable
CREATE TABLE "points_transactions" (
    "transaction_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "claim_id" TEXT,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_transactions_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "claim_reviews" (
    "review_id" TEXT NOT NULL,
    "claim_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "decision" "ClaimStatus" NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_reviews_pkey" PRIMARY KEY ("review_id")
);

-- CreateTable
CREATE TABLE "claim_attachments" (
    "attachment_id" TEXT NOT NULL,
    "claim_id" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_attachments_pkey" PRIMARY KEY ("attachment_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notification_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "industry_problems" (
    "problem_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "organization" TEXT,
    "status" "ProblemStatus" NOT NULL DEFAULT 'DRAFT',
    "level_requirement" INTEGER NOT NULL DEFAULT 3,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "industry_problems_pkey" PRIMARY KEY ("problem_id")
);

-- CreateTable
CREATE TABLE "problem_submissions" (
    "submission_id" TEXT NOT NULL,
    "problem_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "file_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "problem_submissions_pkey" PRIMARY KEY ("submission_id")
);

-- CreateTable
CREATE TABLE "startup_milestones" (
    "milestone_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "target_stage" INTEGER NOT NULL,
    "evidence_url" TEXT,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "feedback" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "startup_milestones_pkey" PRIMARY KEY ("milestone_id")
);

-- CreateTable
CREATE TABLE "badges" (
    "badge_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("badge_id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "user_badge_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "awarded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("user_badge_id")
);

-- CreateTable
CREATE TABLE "awards" (
    "award_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "awards_pkey" PRIMARY KEY ("award_id")
);

-- CreateTable
CREATE TABLE "award_nominations" (
    "nomination_id" TEXT NOT NULL,
    "award_id" TEXT NOT NULL,
    "nominee_id" TEXT NOT NULL,
    "audit_run_id" TEXT,
    "status" "NominationStatus" NOT NULL DEFAULT 'NOMINATED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "award_nominations_pkey" PRIMARY KEY ("nomination_id")
);

-- CreateTable
CREATE TABLE "fellowship_candidates" (
    "candidate_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "audit_run_id" TEXT,
    "rank" INTEGER,
    "total_points" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fellowship_candidates_pkey" PRIMARY KEY ("candidate_id")
);

-- CreateTable
CREATE TABLE "annual_audit_runs" (
    "audit_run_id" TEXT NOT NULL,
    "triggered_by" TEXT,
    "academic_year" TEXT NOT NULL,
    "candidate_count" INTEGER NOT NULL,
    "run_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annual_audit_runs_pkey" PRIMARY KEY ("audit_run_id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "audit_log_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("audit_log_id")
);

-- CreateTable
CREATE TABLE "scoring_rules" (
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "max_claims_per_user" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scoring_rules_pkey" PRIMARY KEY ("category")
);

-- CreateIndex
CREATE UNIQUE INDEX "levels_level_name_key" ON "levels"("level_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_register_num_key" ON "users"("register_num");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "users_current_level_id_idx" ON "users"("current_level_id");

-- CreateIndex
CREATE INDEX "activity_claims_user_id_idx" ON "activity_claims"("user_id");

-- CreateIndex
CREATE INDEX "activity_claims_status_idx" ON "activity_claims"("status");

-- CreateIndex
CREATE INDEX "activity_claims_category_idx" ON "activity_claims"("category");

-- CreateIndex
CREATE INDEX "startup_projects_lead_student_id_idx" ON "startup_projects"("lead_student_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE INDEX "event_sessions_event_id_idx" ON "event_sessions"("event_id");

-- CreateIndex
CREATE INDEX "qr_tokens_session_id_token_idx" ON "qr_tokens"("session_id", "token");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_user_id_session_id_key" ON "attendance"("user_id", "session_id");

-- CreateIndex
CREATE UNIQUE INDEX "points_transactions_claim_id_key" ON "points_transactions"("claim_id");

-- CreateIndex
CREATE INDEX "points_transactions_user_id_idx" ON "points_transactions"("user_id");

-- CreateIndex
CREATE INDEX "claim_reviews_claim_id_idx" ON "claim_reviews"("claim_id");

-- CreateIndex
CREATE INDEX "claim_attachments_claim_id_idx" ON "claim_attachments"("claim_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "industry_problems_status_idx" ON "industry_problems"("status");

-- CreateIndex
CREATE INDEX "problem_submissions_problem_id_idx" ON "problem_submissions"("problem_id");

-- CreateIndex
CREATE INDEX "startup_milestones_project_id_idx" ON "startup_milestones"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "badges_name_key" ON "badges"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_id_key" ON "user_badges"("user_id", "badge_id");

-- CreateIndex
CREATE UNIQUE INDEX "awards_name_key" ON "awards"("name");

-- CreateIndex
CREATE INDEX "fellowship_candidates_audit_run_id_idx" ON "fellowship_candidates"("audit_run_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_current_level_id_fkey" FOREIGN KEY ("current_level_id") REFERENCES "levels"("level_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_claims" ADD CONSTRAINT "activity_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_claims" ADD CONSTRAINT "activity_claims_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_claims" ADD CONSTRAINT "activity_claims_category_fkey" FOREIGN KEY ("category") REFERENCES "scoring_rules"("category") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "startup_projects" ADD CONSTRAINT "startup_projects_lead_student_id_fkey" FOREIGN KEY ("lead_student_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_sessions" ADD CONSTRAINT "event_sessions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("event_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_tokens" ADD CONSTRAINT "qr_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "event_sessions"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "event_sessions"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_qr_token_id_fkey" FOREIGN KEY ("qr_token_id") REFERENCES "qr_tokens"("qr_token_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "activity_claims"("claim_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_reviews" ADD CONSTRAINT "claim_reviews_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "activity_claims"("claim_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_reviews" ADD CONSTRAINT "claim_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_attachments" ADD CONSTRAINT "claim_attachments_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "activity_claims"("claim_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "industry_problems" ADD CONSTRAINT "industry_problems_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_submissions" ADD CONSTRAINT "problem_submissions_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "industry_problems"("problem_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_submissions" ADD CONSTRAINT "problem_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "startup_milestones" ADD CONSTRAINT "startup_milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "startup_projects"("project_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "startup_milestones" ADD CONSTRAINT "startup_milestones_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("badge_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "award_nominations" ADD CONSTRAINT "award_nominations_award_id_fkey" FOREIGN KEY ("award_id") REFERENCES "awards"("award_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "award_nominations" ADD CONSTRAINT "award_nominations_nominee_id_fkey" FOREIGN KEY ("nominee_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "award_nominations" ADD CONSTRAINT "award_nominations_audit_run_id_fkey" FOREIGN KEY ("audit_run_id") REFERENCES "annual_audit_runs"("audit_run_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fellowship_candidates" ADD CONSTRAINT "fellowship_candidates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fellowship_candidates" ADD CONSTRAINT "fellowship_candidates_audit_run_id_fkey" FOREIGN KEY ("audit_run_id") REFERENCES "annual_audit_runs"("audit_run_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annual_audit_runs" ADD CONSTRAINT "annual_audit_runs_triggered_by_fkey" FOREIGN KEY ("triggered_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
