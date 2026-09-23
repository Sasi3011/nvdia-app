/**
 * Canonical enums and configurable domain data shared by apps/web and
 * apps/api. Values here are the single source of truth — the Prisma
 * schema's enums (packages/database/prisma/schema.prisma) and the seed
 * script (packages/database/prisma/seed.ts) both derive from this file so
 * the two apps and the database never drift.
 *
 * Values are exact, from spec 04 (API & Business Rules Reference) Section
 * 11 — do not alter without explicit product-owner sign-off (per spec 01's
 * note to the AI builder).
 */

// Section 11.4
export enum ClaimStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

// Section 11.5
export enum ProofType {
  TOTP_QR = "TOTP_QR",
  PDF_FILE = "PDF_FILE",
  GITHUB_LINK = "GITHUB_LINK",
  DOI_LINK = "DOI_LINK",
}

// Spec 01 Section 3
export enum UserRole {
  STUDENT = "STUDENT",
  MENTOR = "MENTOR",
  ADMIN = "ADMIN",
  INDUSTRY_PARTNER = "INDUSTRY_PARTNER",
  EVALUATOR = "EVALUATOR",
}

export enum NotificationType {
  CLAIM_APPROVED = "CLAIM_APPROVED",
  CLAIM_REJECTED = "CLAIM_REJECTED",
  MENTOR_REVIEW_REMINDER = "MENTOR_REVIEW_REMINDER",
  LEVEL_UP = "LEVEL_UP",
  AWARD_RESULT = "AWARD_RESULT",
  SYSTEM = "SYSTEM",
}

// Open decision #8 (spec 05 Section 16) — spec's stated minimum schema.
export enum ProblemStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export enum NominationStatus {
  NOMINATED = "NOMINATED",
  CONFIRMED = "CONFIRMED",
  DECLINED = "DECLINED",
}

// Assigned Courses feature (additive — see schema.prisma's BR-13..BR-17
// comment block for the business rules these enums back).
export enum CourseStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export enum EnrollmentStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  SUBMITTED = "SUBMITTED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum CourseTaskType {
  STANDARD = "STANDARD",
  LIVE_PROCTORED = "LIVE_PROCTORED",
  MCQ = "MCQ",
  CODING = "CODING",
}

export enum ProctoringStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  LOCKED = "LOCKED",
}

export enum ViolationType {
  FULLSCREEN_EXIT = "FULLSCREEN_EXIT",
  TAB_SWITCH = "TAB_SWITCH",
  WINDOW_BLUR = "WINDOW_BLUR",
}

export enum RequestStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  MENTOR_RECOMMENDED = "MENTOR_RECOMMENDED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  ALLOCATED = "ALLOCATED",
  COMPLETED = "COMPLETED",
}

export enum HackathonStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  REGISTRATION_OPEN = "REGISTRATION_OPEN",
  SUBMISSION_OPEN = "SUBMISSION_OPEN",
  EVALUATION = "EVALUATION",
  COMPLETED = "COMPLETED",
  ARCHIVED = "ARCHIVED",
}

// BR-15: violation 4 locks the session — the client enforces this
// instantly and the server re-enforces it independently (see
// ProctoringService.reportViolation).
export const PROCTORING_MAX_VIOLATIONS = 4;

// Section 11.3 — Startup Launchpad Stages
export const STARTUP_STAGES = [
  { stage: 1, name: "Idea" },
  { stage: 2, name: "Prototype" },
  { stage: 3, name: "GPU Validation" },
  { stage: 4, name: "MVP" },
  { stage: 5, name: "Industry Pilot" },
  { stage: 6, name: "AI Startup" },
] as const;

export type StartupStageNumber = (typeof STARTUP_STAGES)[number]["stage"];

export function startupStageName(stage: number): string {
  return STARTUP_STAGES.find((s) => s.stage === stage)?.name ?? "Unknown";
}

// Section 11.2 — Level & Privilege Matrix.
// `requiresHighImpact` is open decision #1: Level 6's numeric "High
// Impact" condition isn't defined in the source spec. It's enforced as a
// per-user `high_impact_flag` an admin sets manually (see
// packages/database's schema.prisma) until a measurable rule is chosen —
// flagged here rather than silently assumed.
export const LEVEL_DEFINITIONS = [
  { levelId: 1, levelName: "AI Explorer", minPoints: 500, unlockedPrivilege: "Basic Centre Access", requiresHighImpact: false },
  { levelId: 2, levelName: "AI Practitioner", minPoints: 1500, unlockedPrivilege: "Advanced Labs Access", requiresHighImpact: false },
  { levelId: 3, levelName: "AI Builder", minPoints: 3000, unlockedPrivilege: "GPU Project Credits", requiresHighImpact: false },
  { levelId: 4, levelName: "AI Innovator", minPoints: 5000, unlockedPrivilege: "Innovation Opportunities", requiresHighImpact: false },
  { levelId: 5, levelName: "AI Researcher", minPoints: 7500, unlockedPrivilege: "Research GPU Cluster", requiresHighImpact: false },
  { levelId: 6, levelName: "AI Champion", minPoints: 10000, unlockedPrivilege: "Fellowship & Industry Perks", requiresHighImpact: true },
] as const;

export type LevelId = (typeof LEVEL_DEFINITIONS)[number]["levelId"];

// The Industry Problem Bank gate (BR-07, Page 11).
export const PROBLEM_BANK_MIN_LEVEL = 0;

// Section 11.1 — Scoring Matrix (fixed point values).
// `category` is the stable key `activity_claims.category` and
// `scoring_rules.category` use — the display label is what spec 04 lists.
export const SCORING_MATRIX = [
  { category: "tech_eve_masterclass", label: "Tech Eve / Masterclass attendance", points: 10 },
  { category: "gpu_friday_lab", label: "GPU Hands-on Friday Lab", points: 30 },
  { category: "course_completion", label: "NPTEL / Coursera course completion", points: 50 },
  { category: "certification_project_hackathon", label: "Certification / Mini Project / Hackathon", points: 100 },
  { category: "industry_hackathon_win", label: "Industry Project / Hackathon Win", points: 250 },
  { category: "research_patent", label: "Research Paper / Patent Filing", points: 300 },
  { category: "hackathon_registration", label: "External Hackathon Registration", points: 20 },
] as const;

export type ScoringCategory = (typeof SCORING_MATRIX)[number]["category"];

// QR refresh interval (FR-VERIF-01).
export const QR_REFRESH_SECONDS = 15;
