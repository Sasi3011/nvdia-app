/**
 * Zod request/response schemas shared by apps/web and apps/api, matching
 * the API domains in spec 04 Section 9. The backend validates every
 * request against these (never trusting client input — API Design Rules,
 * spec 04 Section 9); the frontend imports the same schemas so the two
 * never drift on shape.
 *
 * Points are deliberately never client-supplied on claim creation — the
 * backend always looks up the point value from `scoring_rules` for the
 * given category server-side (BR-03, SEC boundary re-validation).
 */
import { z } from "zod";
import {
  ClaimStatus,
  CourseStatus,
  CourseTaskType,
  HackathonStatus,
  NominationStatus,
  ProblemStatus,
  ProofType,
  RequestStatus,
  UserRole,
  ViolationType,
} from "./enums";

// Links must be http(s): a plain .url() also accepts javascript: and data:
// URLs, which would run script when a reviewer clicks the link.
const HTTP_URL = /^https?:\/\//i;
const HTTP_URL_MESSAGE = "Link must start with http:// or https://";

// ---------------------------------------------------------------------------
// Pagination (API Design Rules, spec 04 Section 9 — paginate large
// collections: claims, problems, leaderboard).
// ---------------------------------------------------------------------------

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export const HealthCheckResponseSchema = z.object({
  status: z.enum(["ok", "degraded", "down"]),
  checks: z.object({
    database: z.boolean(),
    redis: z.boolean(),
  }),
  timestamp: z.string(),
});
export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;

// ---------------------------------------------------------------------------
// Auth / Onboarding (Page 2 — Register Number, Department, Cohort Year)
// ---------------------------------------------------------------------------

export const OnboardUserSchema = z.object({
  registerNum: z.string().trim().min(1).max(50),
  department: z.string().trim().min(1).max(100),
  cohortYear: z.coerce.number().int().min(2000).max(2100),
});
export type OnboardUserInput = z.infer<typeof OnboardUserSchema>;

// ---------------------------------------------------------------------------
// Users — GET /me, PATCH /me. Email and register number are not editable
// post-onboarding (Page 18) since they're auth/points-integrity keys.
// ---------------------------------------------------------------------------

export const UpdateProfileSchema = z.object({
  fullName: z.string().trim().min(1).max(200).optional(),
  department: z.string().trim().min(1).max(100).optional(),
  cohortYear: z.coerce.number().int().min(2000).max(2100).optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

// ---------------------------------------------------------------------------
// Activities / Claims — GET/POST /activities, GET /claims, GET /claims/:id
// ---------------------------------------------------------------------------

// TOTP_QR is excluded here — that proof type is only ever produced by the
// live Scan flow (POST /events/:id/scan), never submitted through this
// endpoint (Page 14).
export const CreateActivityClaimSchema = z.object({
  category: z.string().trim().min(1),
  proofType: z.enum([ProofType.PDF_FILE, ProofType.GITHUB_LINK, ProofType.DOI_LINK]),
  proofUrl: z.string().trim().url().regex(HTTP_URL, HTTP_URL_MESSAGE).optional(),
  // fileKey comes from a prior POST /uploads/presign call; the file/mime/
  // size fields describe that same upload for the claim_attachments row.
  fileKey: z.string().trim().min(1).optional(),
  fileName: z.string().trim().min(1).max(200).optional(),
  mimeType: z.string().trim().min(1).optional(),
  sizeBytes: z.coerce.number().int().positive().optional(),
}).refine(
  (data) => (data.proofType === ProofType.PDF_FILE ? !!data.fileKey : !!data.proofUrl),
  { message: "proofUrl is required for GITHUB_LINK/DOI_LINK; fileKey is required for PDF_FILE" },
);
export type CreateActivityClaimInput = z.infer<typeof CreateActivityClaimSchema>;

export const ListClaimsQuerySchema = PaginationQuerySchema.extend({
  status: z.nativeEnum(ClaimStatus).optional(),
  category: z.string().trim().min(1).optional(),
});
export type ListClaimsQuery = z.infer<typeof ListClaimsQuerySchema>;

// ---------------------------------------------------------------------------
// Mentor review — POST /mentor/claims/:id/approve, .../reject
// ---------------------------------------------------------------------------

export const ApproveClaimSchema = z.object({
  // Optional override of the scoring-matrix value for this one claim;
  // defaults to the category's configured points if omitted.
  pointsAwarded: z.coerce.number().int().nonnegative().optional(),
});
export type ApproveClaimInput = z.infer<typeof ApproveClaimSchema>;

export const RejectClaimSchema = z.object({
  // Mandatory feedback (FR-VERIF-03) — rejected claims must retain and
  // surface mentor feedback to the student.
  feedback: z.string().trim().min(1).max(2000),
});
export type RejectClaimInput = z.infer<typeof RejectClaimSchema>;

// ---------------------------------------------------------------------------
// Live Event QR Scan — POST /events/:id/scan (Page 17)
// ---------------------------------------------------------------------------

export const ScanQrSchema = z.object({
  token: z.string().trim().min(1),
});
export type ScanQrInput = z.infer<typeof ScanQrSchema>;

// ---------------------------------------------------------------------------
// Startup Launchpad — GET/POST /startup/projects (Page 12)
// ---------------------------------------------------------------------------

export const CreateStartupProjectSchema = z.object({
  title: z.string().trim().min(1).max(200),
});
export type CreateStartupProjectInput = z.infer<typeof CreateStartupProjectSchema>;

export const SubmitStartupMilestoneSchema = z.object({
  targetStage: z.coerce.number().int().min(1).max(6),
  evidenceUrl: z.string().trim().url().regex(HTTP_URL, HTTP_URL_MESSAGE).optional(),
  // Stage-specific text fields plus uploaded file keys (see STARTUP_STAGE_FORMS in the web app).
  details: z.record(z.string().max(4000)).optional(),
  documents: z.array(z.object({ fileKey: z.string().min(1), fileName: z.string().min(1).max(255) })).max(5).optional(),
});
export type SubmitStartupMilestoneInput = z.infer<typeof SubmitStartupMilestoneSchema>;

export const ReviewStartupMilestoneSchema = z.object({
  decision: z.enum([ClaimStatus.APPROVED, ClaimStatus.REJECTED]),
  feedback: z.string().trim().max(2000).optional(),
}).refine((d) => d.decision !== ClaimStatus.REJECTED || !!d.feedback, {
  message: "feedback is required when rejecting a milestone",
});
export type ReviewStartupMilestoneInput = z.infer<typeof ReviewStartupMilestoneSchema>;

// ---------------------------------------------------------------------------
// Industry Problem Bank — staged solution flow (mirrors Startup Launchpad)
// ---------------------------------------------------------------------------

export const CreateProblemProjectSchema = z.object({
  problemId: z.string().trim().min(1),
});
export type CreateProblemProjectInput = z.infer<typeof CreateProblemProjectSchema>;

export const SubmitProblemMilestoneSchema = z.object({
  targetStage: z.coerce.number().int().min(1).max(6),
  evidenceUrl: z.string().trim().url().regex(HTTP_URL, HTTP_URL_MESSAGE).optional(),
  // Stage-specific text fields (see PROBLEM_STAGE_FORMS in the web app).
  details: z.record(z.string().max(4000)).optional(),
});
export type SubmitProblemMilestoneInput = z.infer<typeof SubmitProblemMilestoneSchema>;

export const ReviewProblemMilestoneSchema = z.object({
  decision: z.enum([ClaimStatus.APPROVED, ClaimStatus.REJECTED]),
  feedback: z.string().trim().max(2000).optional(),
}).refine((d) => d.decision !== ClaimStatus.REJECTED || !!d.feedback, {
  message: "feedback is required when rejecting a milestone",
});
export type ReviewProblemMilestoneInput = z.infer<typeof ReviewProblemMilestoneSchema>;

// ---------------------------------------------------------------------------
// Admin — Scoring & Level Configuration (Page 28)
// ---------------------------------------------------------------------------

export const UpsertScoringRuleSchema = z.object({
  category: z.string().trim().min(1),
  label: z.string().trim().min(1).max(200),
  points: z.coerce.number().int().nonnegative(),
  maxClaimsPerUser: z.coerce.number().int().positive().nullable().optional(),
});
export type UpsertScoringRuleInput = z.infer<typeof UpsertScoringRuleSchema>;

export const UpdateLevelSchema = z.object({
  levelName: z.string().trim().min(1).max(100).optional(),
  minPoints: z.coerce.number().int().nonnegative().optional(),
  unlockedPrivilege: z.string().trim().min(1).max(200).optional(),
  requiresHighImpact: z.boolean().optional(),
});
export type UpdateLevelInput = z.infer<typeof UpdateLevelSchema>;

// ---------------------------------------------------------------------------
// Admin — Event & QR Management (Page 25)
// ---------------------------------------------------------------------------

export const CreateEventSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(200).optional(),
  // Which scoring-matrix category a QR check-in at this event awards.
  category: z.string().trim().min(1),
  year: z.string().trim().max(50).optional(),
  department: z.string().trim().max(100).optional(),
  sessionType: z.string().trim().max(50).optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});
export type CreateEventInput = z.infer<typeof CreateEventSchema>;

export const UpdateEventSchema = CreateEventSchema.partial();
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;

export const CreateEventSessionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});
export type CreateEventSessionInput = z.infer<typeof CreateEventSessionSchema>;

// ---------------------------------------------------------------------------
// Mentor — CoE Class Teaching Logs ("what I taught in this class")
// ---------------------------------------------------------------------------

export const CreateClassTeachingLogSchema = z.object({
  eventId: z.string().trim().min(1),
  classDate: z.coerce.date(),
  topicsCovered: z.string().trim().min(1).max(4000),
  materialsUrl: z.string().trim().url().regex(HTTP_URL, HTTP_URL_MESSAGE).optional(),
  notes: z.string().trim().max(2000).optional(),
  coMentorIds: z.array(z.string()).optional(),
});
export type CreateClassTeachingLogInput = z.infer<typeof CreateClassTeachingLogSchema>;

export const UpdateClassTeachingLogSchema = CreateClassTeachingLogSchema.omit({ eventId: true }).partial();
export type UpdateClassTeachingLogInput = z.infer<typeof UpdateClassTeachingLogSchema>;

// ---------------------------------------------------------------------------
// Admin — Problem Bank Management (Page 26)
// ---------------------------------------------------------------------------

export const ProblemAttachmentSchema = z.object({
  fileKey: z.string().trim().min(1),
  fileName: z.string().trim().min(1).max(200),
  mimeType: z.string().trim().min(1).max(200),
  sizeBytes: z.coerce.number().int().positive(),
});

export const UpsertProblemSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    // Optional when an original file is attached; otherwise the text is required (see refine below).
    description: z.string().trim().default(""),
    organization: z.string().trim().max(200).optional(),
    status: z.nativeEnum(ProblemStatus).default(ProblemStatus.DRAFT),
    // Per-problem competency gating was removed; every problem is open to all levels.
    levelRequirement: z.coerce.number().int().min(1).max(6).default(1),
    // Original PDF/Excel/Word file. null removes an existing attachment on update.
    attachment: ProblemAttachmentSchema.nullable().optional(),
  })
  .refine((d) => d.description.length > 0 || !!d.attachment, {
    message: "Provide a problem description or attach a file.",
    path: ["description"],
  });
export type UpsertProblemInput = z.infer<typeof UpsertProblemSchema>;

// ---------------------------------------------------------------------------
// Admin — User & Role Management (Page 27)
// ---------------------------------------------------------------------------

export const AssignRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});
export type AssignRoleInput = z.infer<typeof AssignRoleSchema>;

// Manual point/GPU-credit corrections always require an audit reason
// (Section 21.1 "Point reversal or correction"; open decision #2 for GPU
// credits — admin-adjustable only, no auto-accrual invented).
export const AdjustPointsSchema = z.object({
  delta: z.coerce.number().int(),
  reason: z.string().trim().min(1).max(500),
});
export type AdjustPointsInput = z.infer<typeof AdjustPointsSchema>;

export const AdjustGpuCreditsSchema = z.object({
  delta: z.coerce.number().int(),
  reason: z.string().trim().min(1).max(500),
});
export type AdjustGpuCreditsInput = z.infer<typeof AdjustGpuCreditsSchema>;

export const SetHighImpactFlagSchema = z.object({
  highImpactFlag: z.boolean(),
  reason: z.string().trim().min(1).max(500),
});
export type SetHighImpactFlagInput = z.infer<typeof SetHighImpactFlagSchema>;

// ---------------------------------------------------------------------------
// Admin — Annual Audit & Awards (Page 30). Admin-triggered (open decision
// #6) rather than cron-scheduled on a guessed academic-year boundary.
// ---------------------------------------------------------------------------

export const RunAnnualAuditSchema = z.object({
  academicYear: z.string().trim().min(1).max(20),
  candidateCount: z.coerce.number().int().min(1).max(100).default(25),
});
export type RunAnnualAuditInput = z.infer<typeof RunAnnualAuditSchema>;

export const NominateAwardSchema = z.object({
  awardId: z.string().trim().min(1),
  nomineeId: z.string().trim().min(1),
  status: z.nativeEnum(NominationStatus).default(NominationStatus.NOMINATED),
});
export type NominateAwardInput = z.infer<typeof NominateAwardSchema>;

// ---------------------------------------------------------------------------
// Assigned Courses (additive feature) — Admin/Mentor course + task CRUD,
// student browse/submit, mentor review, proctoring.
// ---------------------------------------------------------------------------

export const UpsertCourseSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  shortDescription: z.string().trim().max(300).optional(),
  category: z.string().trim().min(1).max(100).default("AI Foundation"),
  difficulty: z.string().trim().min(1).max(50).default("Beginner"),
  durationHours: z.coerce.number().int().nonnegative().default(0),
  durationWeeks: z.coerce.number().int().positive().nullable().optional(),
  deliveryMode: z.string().trim().min(1).max(50).default("Online"),
  enrollmentType: z.string().trim().min(1).max(50).default("Open"),
  certificateAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  skillsCovered: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  prerequisites: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  learningOutcomes: z.array(z.string().trim().min(1).max(240)).max(20).default([]),
  toolsRequired: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  targetAudience: z.string().trim().max(500).optional(),
  provider: z.string().trim().min(1).max(100),
  externalUrl: z.string().trim().url().regex(HTTP_URL, HTTP_URL_MESSAGE),
  pointsValue: z.coerce.number().int().nonnegative(),
  levelRequirement: z.coerce.number().int().min(1).max(6).nullable().optional(),
  status: z.nativeEnum(CourseStatus).default(CourseStatus.DRAFT),
});
export type UpsertCourseInput = z.infer<typeof UpsertCourseSchema>;

export const UpsertCourseTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  type: z.nativeEnum(CourseTaskType).default(CourseTaskType.STANDARD),
  instructions: z.string().trim().max(5000).optional(),
  content: z.any().optional(),
  sequenceOrder: z.coerce.number().int().nonnegative().default(0),
  isRequired: z.boolean().default(true),
});
export type UpsertCourseTaskInput = z.infer<typeof UpsertCourseTaskSchema>;

// Mirrors CreateActivityClaimSchema's proofUrl-vs-fileKey shape (Page 14) —
// same two proof mechanisms, same validation rule.
export const SubmitCourseProofSchema = z
  .object({
    proofUrl: z.string().trim().url().regex(HTTP_URL, HTTP_URL_MESSAGE).optional(),
    fileKey: z.string().trim().min(1).optional(),
    fileName: z.string().trim().min(1).max(200).optional(),
    mimeType: z.string().trim().min(1).optional(),
    sizeBytes: z.coerce.number().int().positive().optional(),
  })
  .refine((d) => !!d.proofUrl || !!d.fileKey, {
    message: "Either proofUrl or fileKey (from /uploads/presign) is required",
  });
export type SubmitCourseProofInput = z.infer<typeof SubmitCourseProofSchema>;

export const ReportProctoringViolationSchema = z.object({
  violationType: z.nativeEnum(ViolationType),
});
export type ReportProctoringViolationInput = z.infer<typeof ReportProctoringViolationSchema>;

// Admin-only — "one department, one mentor" routing hint for course-
// submission and proctoring-violation notifications (product-owner
// request). Not a hard uniqueness constraint at the DB level; see
// schema.prisma's User.mentor_department comment.
export const SetMentorDepartmentSchema = z.object({
  department: z.string().trim().min(1).max(100).nullable(),
});
export type SetMentorDepartmentInput = z.infer<typeof SetMentorDepartmentSchema>;

export const CreateGpuRequestSchema = z.object({
  purpose: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(200),
  justification: z.string().trim().min(1).max(5000),
  requestedCredits: z.coerce.number().int().positive().max(10000),
});
export type CreateGpuRequestInput = z.infer<typeof CreateGpuRequestSchema>;

export const ReviewGpuRequestSchema = z.object({
  status: z.enum([RequestStatus.MENTOR_RECOMMENDED, RequestStatus.APPROVED, RequestStatus.REJECTED, RequestStatus.ALLOCATED, RequestStatus.COMPLETED]),
  allocatedCredits: z.coerce.number().int().positive().optional(),
  comment: z.string().trim().max(2000).optional(),
});
export type ReviewGpuRequestInput = z.infer<typeof ReviewGpuRequestSchema>;

export const CreateHackathonSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  theme: z.string().trim().max(200).optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  registrationDeadline: z.coerce.date().optional(),
  teamSizeMin: z.coerce.number().int().min(1).max(20).default(1),
  teamSizeMax: z.coerce.number().int().min(1).max(20).default(4),
  status: z.nativeEnum(HackathonStatus).default(HackathonStatus.DRAFT),
  pointsParticipation: z.coerce.number().int().nonnegative().default(100),
  pointsWinner: z.coerce.number().int().nonnegative().default(250),
});
export type CreateHackathonInput = z.infer<typeof CreateHackathonSchema>;

export const CreateHackathonProblemSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
});
export type CreateHackathonProblemInput = z.infer<typeof CreateHackathonProblemSchema>;

export const CreateHackathonTeamSchema = z.object({
  name: z.string().trim().min(1).max(200),
  problemId: z.string().trim().min(1).optional(),
  memberIds: z.array(z.string().trim().min(1)).max(20).default([]),
});
export type CreateHackathonTeamInput = z.infer<typeof CreateHackathonTeamSchema>;

export const SubmitHackathonSchema = z.object({
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().min(1).max(5000),
  githubUrl: z.string().trim().url().regex(HTTP_URL, HTTP_URL_MESSAGE).optional(),
  demoUrl: z.string().trim().url().regex(HTTP_URL, HTTP_URL_MESSAGE).optional(),
  fileKey: z.string().trim().min(1).optional(),
});
export type SubmitHackathonInput = z.infer<typeof SubmitHackathonSchema>;

export const EvaluateHackathonSubmissionSchema = z.object({
  innovation: z.coerce.number().int().min(0).max(10),
  technical: z.coerce.number().int().min(0).max(10),
  impact: z.coerce.number().int().min(0).max(10),
  presentation: z.coerce.number().int().min(0).max(10),
  completeness: z.coerce.number().int().min(0).max(10),
  comments: z.string().trim().max(2000).optional(),
});
export type EvaluateHackathonSubmissionInput = z.infer<typeof EvaluateHackathonSubmissionSchema>;

export const CreateProjectRecordSchema = z.object({
  title: z.string().trim().min(1).max(200),
  problemStatement: z.string().trim().min(1).max(5000),
  projectType: z.string().trim().min(1).max(100),
  mentorId: z.string().trim().min(1).optional(),
  industryProblemId: z.string().trim().min(1).optional(),
  githubUrl: z.string().trim().url().regex(HTTP_URL, HTTP_URL_MESSAGE).optional(),
  demoUrl: z.string().trim().url().regex(HTTP_URL, HTTP_URL_MESSAGE).optional(),
  reportFileKey: z.string().trim().min(1).optional(),
});
export type CreateProjectRecordInput = z.infer<typeof CreateProjectRecordSchema>;

export const CreateProjectMilestoneSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  dueAt: z.coerce.date().optional(),
  evidenceUrl: z.string().trim().url().regex(HTTP_URL, HTTP_URL_MESSAGE).optional(),
});
export type CreateProjectMilestoneInput = z.infer<typeof CreateProjectMilestoneSchema>;

export const ReviewProjectMilestoneSchema = z.object({
  status: z.enum([RequestStatus.APPROVED, RequestStatus.REJECTED, RequestStatus.COMPLETED]),
  feedback: z.string().trim().max(2000).optional(),
});
export type ReviewProjectMilestoneInput = z.infer<typeof ReviewProjectMilestoneSchema>;

export const CreateIndustryPartnerSchema = z.object({
  userId: z.string().trim().min(1),
  companyName: z.string().trim().min(1).max(200),
  contactPerson: z.string().trim().min(1).max(200),
  website: z.string().trim().url().regex(HTTP_URL, HTTP_URL_MESSAGE).optional(),
});
export type CreateIndustryPartnerInput = z.infer<typeof CreateIndustryPartnerSchema>;

export const CreateEvaluatorProfileSchema = z.object({
  userId: z.string().trim().min(1),
  expertise: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
});
export type CreateEvaluatorProfileInput = z.infer<typeof CreateEvaluatorProfileSchema>;

export const GenerateCertificateSchema = z.object({
  userId: z.string().trim().min(1),
  title: z.string().trim().min(1).max(200),
  certificateType: z.string().trim().min(1).max(100),
});
export type GenerateCertificateInput = z.infer<typeof GenerateCertificateSchema>;

export const CreateBadgeRuleSchema = z.object({
  badgeId: z.string().trim().min(1),
  trigger: z.string().trim().min(1).max(100),
  threshold: z.coerce.number().int().nonnegative(),
});
export type CreateBadgeRuleInput = z.infer<typeof CreateBadgeRuleSchema>;
