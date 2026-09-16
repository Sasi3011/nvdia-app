ALTER TYPE "RoleName" ADD VALUE IF NOT EXISTS 'INDUSTRY_PARTNER';
ALTER TYPE "RoleName" ADD VALUE IF NOT EXISTS 'EVALUATOR';

CREATE TYPE "RequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'MENTOR_RECOMMENDED', 'APPROVED', 'REJECTED', 'ALLOCATED', 'COMPLETED');
CREATE TYPE "HackathonStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'SUBMISSION_OPEN', 'EVALUATION', 'COMPLETED', 'ARCHIVED');

CREATE TABLE "gpu_requests" (
  "gpu_request_id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "justification" TEXT NOT NULL,
  "requested_credits" INTEGER NOT NULL,
  "allocated_credits" INTEGER,
  "status" "RequestStatus" NOT NULL DEFAULT 'DRAFT',
  "mentor_comment" TEXT,
  "admin_comment" TEXT,
  "reviewed_by" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "gpu_requests_pkey" PRIMARY KEY ("gpu_request_id")
);
CREATE INDEX "gpu_requests_student_id_idx" ON "gpu_requests"("student_id");
CREATE INDEX "gpu_requests_status_idx" ON "gpu_requests"("status");
ALTER TABLE "gpu_requests" ADD CONSTRAINT "gpu_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "gpu_requests" ADD CONSTRAINT "gpu_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "industry_partners" (
  "partner_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "company_name" TEXT NOT NULL,
  "contact_person" TEXT NOT NULL,
  "website" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "industry_partners_pkey" PRIMARY KEY ("partner_id")
);
CREATE UNIQUE INDEX "industry_partners_user_id_key" ON "industry_partners"("user_id");
ALTER TABLE "industry_partners" ADD CONSTRAINT "industry_partners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "evaluator_profiles" (
  "evaluator_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "expertise" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "evaluator_profiles_pkey" PRIMARY KEY ("evaluator_id")
);
CREATE UNIQUE INDEX "evaluator_profiles_user_id_key" ON "evaluator_profiles"("user_id");
ALTER TABLE "evaluator_profiles" ADD CONSTRAINT "evaluator_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "hackathons" (
  "hackathon_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "theme" TEXT,
  "starts_at" TIMESTAMP(3) NOT NULL,
  "ends_at" TIMESTAMP(3) NOT NULL,
  "registration_deadline" TIMESTAMP(3),
  "team_size_min" INTEGER NOT NULL DEFAULT 1,
  "team_size_max" INTEGER NOT NULL DEFAULT 4,
  "status" "HackathonStatus" NOT NULL DEFAULT 'DRAFT',
  "points_participation" INTEGER NOT NULL DEFAULT 100,
  "points_winner" INTEGER NOT NULL DEFAULT 250,
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hackathons_pkey" PRIMARY KEY ("hackathon_id")
);
CREATE INDEX "hackathons_status_idx" ON "hackathons"("status");

CREATE TABLE "hackathon_problems" (
  "problem_id" TEXT NOT NULL,
  "hackathon_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hackathon_problems_pkey" PRIMARY KEY ("problem_id")
);
CREATE INDEX "hackathon_problems_hackathon_id_idx" ON "hackathon_problems"("hackathon_id");
ALTER TABLE "hackathon_problems" ADD CONSTRAINT "hackathon_problems_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "hackathons"("hackathon_id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "hackathon_teams" (
  "team_id" TEXT NOT NULL,
  "hackathon_id" TEXT NOT NULL,
  "problem_id" TEXT,
  "name" TEXT NOT NULL,
  "lead_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hackathon_teams_pkey" PRIMARY KEY ("team_id")
);
CREATE INDEX "hackathon_teams_hackathon_id_idx" ON "hackathon_teams"("hackathon_id");
CREATE INDEX "hackathon_teams_lead_id_idx" ON "hackathon_teams"("lead_id");
ALTER TABLE "hackathon_teams" ADD CONSTRAINT "hackathon_teams_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "hackathons"("hackathon_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hackathon_teams" ADD CONSTRAINT "hackathon_teams_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "hackathon_problems"("problem_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hackathon_teams" ADD CONSTRAINT "hackathon_teams_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "hackathon_team_members" (
  "member_id" TEXT NOT NULL,
  "team_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'MEMBER',
  "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hackathon_team_members_pkey" PRIMARY KEY ("member_id")
);
CREATE UNIQUE INDEX "hackathon_team_members_team_id_user_id_key" ON "hackathon_team_members"("team_id", "user_id");
ALTER TABLE "hackathon_team_members" ADD CONSTRAINT "hackathon_team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "hackathon_teams"("team_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hackathon_team_members" ADD CONSTRAINT "hackathon_team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "hackathon_submissions" (
  "submission_id" TEXT NOT NULL,
  "hackathon_id" TEXT NOT NULL,
  "team_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "github_url" TEXT,
  "demo_url" TEXT,
  "file_key" TEXT,
  "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hackathon_submissions_pkey" PRIMARY KEY ("submission_id")
);
CREATE INDEX "hackathon_submissions_hackathon_id_idx" ON "hackathon_submissions"("hackathon_id");
CREATE INDEX "hackathon_submissions_team_id_idx" ON "hackathon_submissions"("team_id");
ALTER TABLE "hackathon_submissions" ADD CONSTRAINT "hackathon_submissions_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "hackathons"("hackathon_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hackathon_submissions" ADD CONSTRAINT "hackathon_submissions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "hackathon_teams"("team_id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "hackathon_evaluations" (
  "evaluation_id" TEXT NOT NULL,
  "submission_id" TEXT NOT NULL,
  "evaluator_id" TEXT NOT NULL,
  "innovation" INTEGER NOT NULL,
  "technical" INTEGER NOT NULL,
  "impact" INTEGER NOT NULL,
  "presentation" INTEGER NOT NULL,
  "completeness" INTEGER NOT NULL,
  "comments" TEXT,
  "total_score" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hackathon_evaluations_pkey" PRIMARY KEY ("evaluation_id")
);
CREATE UNIQUE INDEX "hackathon_evaluations_submission_id_evaluator_id_key" ON "hackathon_evaluations"("submission_id", "evaluator_id");
CREATE INDEX "hackathon_evaluations_evaluator_id_idx" ON "hackathon_evaluations"("evaluator_id");
ALTER TABLE "hackathon_evaluations" ADD CONSTRAINT "hackathon_evaluations_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "hackathon_submissions"("submission_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hackathon_evaluations" ADD CONSTRAINT "hackathon_evaluations_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "project_records" (
  "project_id" TEXT NOT NULL,
  "lead_student_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "problem_statement" TEXT NOT NULL,
  "project_type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "mentor_id" TEXT,
  "industry_problem_id" TEXT,
  "github_url" TEXT,
  "demo_url" TEXT,
  "report_file_key" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "project_records_pkey" PRIMARY KEY ("project_id")
);
CREATE INDEX "project_records_lead_student_id_idx" ON "project_records"("lead_student_id");
CREATE INDEX "project_records_status_idx" ON "project_records"("status");
ALTER TABLE "project_records" ADD CONSTRAINT "project_records_lead_student_id_fkey" FOREIGN KEY ("lead_student_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_records" ADD CONSTRAINT "project_records_industry_problem_id_fkey" FOREIGN KEY ("industry_problem_id") REFERENCES "industry_problems"("problem_id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "project_milestones" (
  "milestone_id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "due_at" TIMESTAMP(3),
  "evidence_url" TEXT,
  "status" "RequestStatus" NOT NULL DEFAULT 'DRAFT',
  "feedback" TEXT,
  "reviewed_by" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_milestones_pkey" PRIMARY KEY ("milestone_id")
);
CREATE INDEX "project_milestones_project_id_idx" ON "project_milestones"("project_id");
CREATE INDEX "project_milestones_status_idx" ON "project_milestones"("status");
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project_records"("project_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "generated_certificates" (
  "certificate_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "certificate_type" TEXT NOT NULL,
  "file_key" TEXT,
  "issued_by" TEXT,
  "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  CONSTRAINT "generated_certificates_pkey" PRIMARY KEY ("certificate_id")
);
CREATE INDEX "generated_certificates_user_id_idx" ON "generated_certificates"("user_id");
ALTER TABLE "generated_certificates" ADD CONSTRAINT "generated_certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "badge_rules" (
  "rule_id" TEXT NOT NULL,
  "badge_id" TEXT NOT NULL,
  "trigger" TEXT NOT NULL,
  "threshold" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "badge_rules_pkey" PRIMARY KEY ("rule_id")
);
CREATE INDEX "badge_rules_trigger_idx" ON "badge_rules"("trigger");
ALTER TABLE "badge_rules" ADD CONSTRAINT "badge_rules_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("badge_id") ON DELETE RESTRICT ON UPDATE CASCADE;
