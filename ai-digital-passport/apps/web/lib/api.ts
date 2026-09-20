import { API_BASE_URL, apiClient } from "./api-client";

export { API_BASE_URL };

// Response shapes mirror exactly what apps/api's controllers return
// (Phases 2-3) — kept here rather than re-deriving from Prisma types so
// the frontend has no compile-time dependency on the backend's internals,
// only on its actual HTTP contract.

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

function toQueryString(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) q.set(key, String(value));
  }
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

// ---------------------------------------------------------------------------
// Auth (Phase 3)
// ---------------------------------------------------------------------------

export interface SessionResponse {
  authenticated: boolean;
  onboarded?: boolean;
  email?: string;
  fullName?: string;
  roles?: string[];
}

export const authApi = {
  session: () => apiClient.get<SessionResponse>("/auth/session"),
  onboard: (input: { registerNum: string; department: string; cohortYear: number }) =>
    apiClient.post<{ userId: string; email: string; currentLevelId: number; totalPoints: number; gpuCreditBalance: number }>(
      "/auth/onboard",
      input,
    ),
  logout: () => apiClient.post<void>("/auth/logout"),
  devLogin: (input: { email: string; fullName: string; password: string }) => apiClient.post<void>("/auth/dev-login", input),
  googleLoginUrl: () => `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:1002"}/auth/google`,
};

// ---------------------------------------------------------------------------
// Me (Page 4, Page 18)
// ---------------------------------------------------------------------------

export interface MeResponse {
  userId: string;
  email: string;
  fullName: string;
  registerNum: string;
  department: string;
  cohortYear: number;
  totalPoints: number;
  gpuCreditBalance: number;
  highImpactFlag: boolean;
  avatarUrl: string | null;
  roles: string[];
  level: { levelId: number; levelName: string; minPoints: number; unlockedPrivilege: string };
}

export const meApi = {
  get: () => apiClient.get<MeResponse>("/me"),
  update: (input: { fullName?: string; department?: string; cohortYear?: number }) => apiClient.patch<MeResponse>("/me", input),
};

// ---------------------------------------------------------------------------
// Levels (Page 4, Page 28)
// ---------------------------------------------------------------------------

export interface LevelResponse {
  levelId: number;
  levelName: string;
  minPoints: number;
  unlockedPrivilege: string;
  requiresHighImpact: boolean;
}

export const levelsApi = {
  list: () => apiClient.get<LevelResponse[]>("/levels"),
};

// ---------------------------------------------------------------------------
// Activities / Claims (Page 5-10, Page 14-16)
// ---------------------------------------------------------------------------

export interface ActivityResponse {
  category: string;
  label: string;
  points: number;
}

export interface ClaimSummaryResponse {
  claimId: string;
  category: string;
  proofType: "TOTP_QR" | "PDF_FILE" | "GITHUB_LINK" | "DOI_LINK";
  pointsRequested: number;
  pointsAwarded: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  mentorFeedback: string | null;
  createdAt: string;
}

export interface ClaimDetailResponse extends ClaimSummaryResponse {
  proofUrl: string | null;
  reviewedAt: string | null;
  claimant: { userId: string; fullName: string };
  attachments: { attachmentId: string; fileKey: string; fileName: string }[];
  reviews: { reviewId: string; decision: string; comment: string | null; createdAt: string }[];
}

export const activitiesApi = {
  discover: (category?: string) => apiClient.get<ActivityResponse[]>(`/activities${category ? `?category=${category}` : ""}`),
  createClaim: (input: {
    category: string;
    proofType: "PDF_FILE" | "GITHUB_LINK" | "DOI_LINK";
    proofUrl?: string;
    fileKey?: string;
    fileName?: string;
    mimeType?: string;
    sizeBytes?: number;
  }) => apiClient.post<{ claimId: string; category: string; proofType: string; pointsRequested: number; status: string; createdAt: string }>(
    "/activities",
    input,
  ),
};

export const claimsApi = {
  list: (params: { page?: number; pageSize?: number; status?: string; category?: string } = {}) =>
    apiClient.get<PaginatedResult<ClaimSummaryResponse>>(`/claims${toQueryString(params)}`),
  detail: (id: string) => apiClient.get<ClaimDetailResponse>(`/claims/${id}`),
  downloadUrl: (claimId: string, attachmentId: string) =>
    apiClient.get<{ downloadUrl: string; expiresInSeconds: number }>(`/claims/${claimId}/attachments/${attachmentId}/download-url`),
};

// ---------------------------------------------------------------------------
// Mentor — Review Queue (Page 20-22)
// ---------------------------------------------------------------------------

export interface MentorQueueItemResponse {
  claimId: string;
  category: string;
  proofType: "TOTP_QR" | "PDF_FILE" | "GITHUB_LINK" | "DOI_LINK";
  pointsRequested: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  student: { userId: string; fullName: string };
}

export interface ApproveClaimResponse {
  claimId: string;
  status: string;
  pointsAwarded: number;
  alreadyAwarded: boolean;
  totalPoints: number;
  leveledUp: boolean;
}

export const mentorApi = {
  queue: (params: { page?: number; pageSize?: number; status?: string; category?: string } = {}) =>
    apiClient.get<PaginatedResult<MentorQueueItemResponse>>(`/mentor/claims${toQueryString(params)}`),
  approve: (claimId: string, pointsAwarded?: number) =>
    apiClient.post<ApproveClaimResponse>(`/mentor/claims/${claimId}/approve`, pointsAwarded !== undefined ? { pointsAwarded } : {}),
  reject: (claimId: string, feedback: string) =>
    apiClient.post<{ claimId: string; status: string }>(`/mentor/claims/${claimId}/reject`, { feedback }),
};

// ---------------------------------------------------------------------------
// Mentor — Startup Milestone Review (Page 23)
// ---------------------------------------------------------------------------

export interface PendingMilestoneResponse {
  milestoneId: string;
  targetStage: number;
  evidenceUrl: string | null;
  createdAt: string;
  project: { projectId: string; title: string; leadName: string };
}

export const mentorStartupApi = {
  pending: (params: { page?: number; pageSize?: number } = {}) =>
    apiClient.get<PaginatedResult<PendingMilestoneResponse>>(`/mentor/startups${toQueryString(params)}`),
  review: (milestoneId: string, decision: "APPROVED" | "REJECTED", feedback?: string) =>
    apiClient.post<{ milestoneId: string; status: string }>(`/mentor/startups/${milestoneId}/review`, { decision, feedback }),
};

// ---------------------------------------------------------------------------
// Points (Page 4)
// ---------------------------------------------------------------------------

export interface PointsTransactionResponse {
  transactionId: string;
  claimId: string | null;
  points: number;
  reason: string;
  createdAt: string;
}

export const pointsApi = {
  mine: (params: { page?: number; pageSize?: number } = {}) =>
    apiClient.get<{ balance: number; transactions: PaginatedResult<PointsTransactionResponse> }>(
      `/me/points${toQueryString(params)}`,
    ),
};

// ---------------------------------------------------------------------------
// Problem Bank (Page 11)
// ---------------------------------------------------------------------------

export interface ProblemResponse {
  problemId: string;
  title: string;
  description: string;
  organization: string | null;
  levelRequirement: number;
}

export const problemsApi = {
  list: (params: { page?: number; pageSize?: number } = {}) =>
    apiClient.get<PaginatedResult<ProblemResponse>>(`/problems${toQueryString(params)}`),
  submit: (problemId: string, input: { summary: string; fileKey?: string }) =>
    apiClient.post<{ submissionId: string; problemId: string; summary: string; fileKey: string | null; createdAt: string }>(
      `/problems/${problemId}/submissions`,
      input,
    ),
};

// ---------------------------------------------------------------------------
// Startup Launchpad (Page 12)
// ---------------------------------------------------------------------------

export interface StartupMilestoneResponse {
  milestoneId: string;
  targetStage: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  feedback: string | null;
  createdAt: string;
}

export interface StartupProjectResponse {
  projectId: string;
  title: string;
  currentStage: number;
  currentStageName: string;
  gpuValidated: boolean;
  milestones: StartupMilestoneResponse[];
}

export const startupApi = {
  list: () => apiClient.get<StartupProjectResponse[]>("/startup/projects"),
  create: (title: string) => apiClient.post<{ projectId: string; title: string; currentStage: number }>("/startup/projects", { title }),
  submitMilestone: (projectId: string, input: { targetStage: number; evidenceUrl?: string }) =>
    apiClient.post<{ milestoneId: string; projectId: string; targetStage: number; status: string; createdAt: string }>(
      `/startup/projects/${projectId}/milestones`,
      input,
    ),
};

// ---------------------------------------------------------------------------
// Leaderboard (Page 13)
// ---------------------------------------------------------------------------

export interface LeaderboardEntryResponse {
  userId: string;
  fullName: string;
  totalPoints: number;
  levelName: string;
}

export const leaderboardApi = {
  top: (limit = 20) => apiClient.get<LeaderboardEntryResponse[]>(`/leaderboard?limit=${limit}`),
};

// ---------------------------------------------------------------------------
// Notifications (Page 19)
// ---------------------------------------------------------------------------

export interface NotificationResponse {
  notificationId: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

export const notificationsApi = {
  list: (params: { page?: number; pageSize?: number } = {}) =>
    apiClient.get<PaginatedResult<NotificationResponse>>(`/notifications${toQueryString(params)}`),
  markRead: (id: string) => apiClient.patch<{ ok: true }>(`/notifications/${id}/read`),
};

// ---------------------------------------------------------------------------
// Live Event QR Scan (Page 17)
// ---------------------------------------------------------------------------

export interface ScanResponse {
  alreadyRecorded: boolean;
  claimId: string | null;
  pointsAwarded: number;
  leveledUp?: boolean;
  totalPoints?: number;
}

export const eventsApi = {
  scan: (sessionId: string, token: string) => apiClient.post<ScanResponse>(`/events/${sessionId}/scan`, { token }),
};

// ---------------------------------------------------------------------------
// Uploads (PostgreSQL-backed file storage, Page 14)
// ---------------------------------------------------------------------------

export const uploadsApi = {
  uploadPdf: (input: { fileName: string; mimeType: string; sizeBytes: number; base64Data: string; entityType?: string; entityId?: string }) =>
    apiClient.post<{ fileKey: string; fileName: string; mimeType: string; sizeBytes: number }>("/uploads/files", input),
  presign: (input: { fileName: string; mimeType: string; sizeBytes: number }) =>
    apiClient.post<{ uploadUrl: string; fileKey: string; expiresInSeconds: number; directUploadRequired?: boolean }>("/uploads/presign", input),
};

// ---------------------------------------------------------------------------
// Admin — Dashboard (Page 24)
// ---------------------------------------------------------------------------

export interface AdminDashboardResponse {
  totalStudents: number;
  pendingClaims: number;
  activeEvents: number;
  levelDistribution: { levelId: number; count: number }[];
}

export const adminDashboardApi = {
  summary: () => apiClient.get<AdminDashboardResponse>("/admin/dashboard"),
};

// ---------------------------------------------------------------------------
// Admin — Event & QR Management (Page 25)
// ---------------------------------------------------------------------------

export interface AdminEventSessionResponse {
  sessionId: string;
  eventId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  qrActive: boolean;
  qrWindowSeconds: number;
}

export interface AdminEventResponse {
  eventId: string;
  title: string;
  description: string | null;
  location: string | null;
  category: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  sessions: AdminEventSessionResponse[];
}

export const adminEventsApi = {
  list: () => apiClient.get<AdminEventResponse[]>("/admin/events"),
  get: (eventId: string) => apiClient.get<AdminEventResponse>(`/admin/events/${eventId}`),
  create: (input: { title: string; description?: string; location?: string; category: string; startsAt: string; endsAt: string }) =>
    apiClient.post<AdminEventResponse>("/admin/events", input),
  createSession: (eventId: string, input: { title: string; startsAt: string; endsAt: string }) =>
    apiClient.post<AdminEventSessionResponse>(`/admin/events/${eventId}/sessions`, input),
  activate: (sessionId: string) => apiClient.post<AdminEventSessionResponse>(`/admin/events/sessions/${sessionId}/activate`),
  deactivate: (sessionId: string) => apiClient.post<AdminEventSessionResponse>(`/admin/events/sessions/${sessionId}/deactivate`),
  currentQr: (sessionId: string) =>
    apiClient.get<{ token: string; windowStart: string; windowEnd: string; refreshSeconds: number }>(
      `/admin/events/sessions/${sessionId}/qr`,
    ),
  attendanceCount: (sessionId: string) => apiClient.get<{ count: number }>(`/admin/events/sessions/${sessionId}/attendance-count`),
};

// ---------------------------------------------------------------------------
// Admin — Problem Bank Management (Page 26)
// ---------------------------------------------------------------------------

export interface AdminProblemResponse {
  problemId: string;
  title: string;
  description: string;
  organization: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  levelRequirement: number;
  createdAt: string;
}

export interface UpsertProblemInput {
  title: string;
  description: string;
  organization?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  levelRequirement: number;
}

export const adminProblemsApi = {
  list: (params: { page?: number; pageSize?: number } = {}) =>
    apiClient.get<PaginatedResult<AdminProblemResponse>>(`/admin/problems${toQueryString(params)}`),
  create: (input: UpsertProblemInput) => apiClient.post<AdminProblemResponse>("/admin/problems", input),
  update: (id: string, input: UpsertProblemInput) => apiClient.put<AdminProblemResponse>(`/admin/problems/${id}`, input),
};

// ---------------------------------------------------------------------------
// Admin — User & Role Management (Page 27)
// ---------------------------------------------------------------------------

export interface AdminUserResponse {
  userId: string;
  email: string;
  fullName: string;
  registerNum: string;
  totalPoints: number;
  gpuCreditBalance: number;
  levelName: string;
  roles: string[];
  department: string;
  mentorDepartment: string | null;
}

export const adminUsersApi = {
  search: (params: { q?: string; page?: number; pageSize?: number } = {}) =>
    apiClient.get<PaginatedResult<AdminUserResponse>>(`/admin/users${toQueryString(params)}`),
  assignRole: (userId: string, role: "STUDENT" | "MENTOR" | "ADMIN" | "INDUSTRY_PARTNER" | "EVALUATOR") =>
    apiClient.post<{ ok: true }>(`/admin/users/${userId}/roles`, { role }),
  adjustPoints: (userId: string, delta: number, reason: string) =>
    apiClient.post<{ userId: string; totalPoints: number }>(`/admin/users/${userId}/points-adjustment`, { delta, reason }),
  adjustGpuCredits: (userId: string, delta: number, reason: string) =>
    apiClient.post<{ userId: string; gpuCreditBalance: number }>(`/admin/users/${userId}/gpu-credits-adjustment`, { delta, reason }),
  setHighImpactFlag: (userId: string, highImpactFlag: boolean, reason: string) =>
    apiClient.post<{ userId: string; highImpactFlag: boolean; currentLevelId: number }>(`/admin/users/${userId}/high-impact-flag`, {
      highImpactFlag,
      reason,
    }),
};

// ---------------------------------------------------------------------------
// Admin — Scoring & Level Configuration (Page 28)
// ---------------------------------------------------------------------------

export interface AdminScoringRuleResponse {
  category: string;
  label: string;
  points: number;
  maxClaimsPerUser: number | null;
}

export const adminScoringApi = {
  listRules: () => apiClient.get<AdminScoringRuleResponse[]>("/admin/scoring/rules"),
  upsertRule: (category: string, input: { label: string; points: number; maxClaimsPerUser?: number | null }) =>
    apiClient.put<AdminScoringRuleResponse>(`/admin/scoring/rules/${category}`, { category, ...input }),
  listLevels: () => apiClient.get<LevelResponse[]>("/admin/scoring/levels"),
  updateLevel: (
    levelId: number,
    input: { levelName?: string; minPoints?: number; unlockedPrivilege?: string; requiresHighImpact?: boolean },
  ) => apiClient.put<LevelResponse>(`/admin/scoring/levels/${levelId}`, input),
};

// ---------------------------------------------------------------------------
// Admin — Reports & Analytics Export (Page 29)
// ---------------------------------------------------------------------------

export interface AdminReportsSummaryResponse {
  pointsByCategory: { category: string; approvedCount: number; totalPointsAwarded: number }[];
  claimsByStatus: { status: string; count: number }[];
  levelDistribution: { levelId: number; count: number }[];
  startupStageDistribution: { stage: number; count: number }[];
  problemBank: { submissionCount: number; distinctSubmitters: number };
}

export const adminReportsApi = {
  summary: () => apiClient.get<AdminReportsSummaryResponse>("/admin/reports/summary"),
  claimsExportUrl: () => `${API_BASE_URL}/admin/reports/claims/export.csv`,
  gpuExportUrl: () => `${API_BASE_URL}/admin/reports/gpu/export.csv`,
  projectsExportUrl: () => `${API_BASE_URL}/admin/reports/projects/export.csv`,
  hackathonsExportUrl: () => `${API_BASE_URL}/admin/reports/hackathons/export.csv`,
};

export interface GpuRequestResponse {
  gpu_request_id: string;
  purpose: string;
  title: string;
  justification: string;
  requested_credits: number;
  allocated_credits: number | null;
  status: string;
  admin_comment: string | null;
  created_at: string;
}

export const gpuApi = {
  mine: () => apiClient.get<GpuRequestResponse[]>("/gpu/requests"),
  create: (input: { purpose: string; title: string; justification: string; requestedCredits: number }) =>
    apiClient.post<GpuRequestResponse>("/gpu/requests", input),
};

export interface HackathonResponse {
  hackathon_id: string;
  title: string;
  description: string;
  theme: string | null;
  status: string;
  starts_at: string;
  ends_at: string;
  problems: { problem_id: string; title: string; description: string }[];
  teams: { team_id: string; name: string }[];
  submissions: { submission_id: string; title: string; evaluations: { total_score: number }[] }[];
}

export const hackathonsApi = {
  list: () => apiClient.get<HackathonResponse[]>("/hackathons"),
  createTeam: (hackathonId: string, input: { name: string; problemId?: string; memberIds: string[] }) =>
    apiClient.post(`/hackathons/${hackathonId}/teams`, input),
  submit: (hackathonId: string, teamId: string, input: { title: string; summary: string; githubUrl?: string; demoUrl?: string; fileKey?: string }) =>
    apiClient.post(`/hackathons/${hackathonId}/teams/${teamId}/submissions`, input),
};

export interface ProjectRecordResponse {
  project_id: string;
  title: string;
  problem_statement: string;
  project_type: string;
  status: string;
  milestones: { milestone_id: string; title: string; status: string; feedback: string | null }[];
}

export const projectRecordsApi = {
  list: () => apiClient.get<ProjectRecordResponse[]>("/projects/records"),
  create: (input: { title: string; problemStatement: string; projectType: string; mentorId?: string; industryProblemId?: string; githubUrl?: string; demoUrl?: string; reportFileKey?: string }) =>
    apiClient.post<ProjectRecordResponse>("/projects/records", input),
  createMilestone: (projectId: string, input: { title: string; description: string; dueAt?: string; evidenceUrl?: string }) =>
    apiClient.post(`/projects/records/${projectId}/milestones`, input),
};

export const adminProgramApi = {
  gpuRequests: () => apiClient.get<GpuRequestResponse[]>("/admin/gpu/requests"),
  reviewGpu: (id: string, input: { status: string; allocatedCredits?: number; comment?: string }) => apiClient.post(`/admin/gpu/requests/${id}/review`, input),
  createHackathon: (input: { title: string; description: string; theme?: string; startsAt: string; endsAt: string; registrationDeadline?: string; teamSizeMin: number; teamSizeMax: number; status: string; pointsParticipation: number; pointsWinner: number }) =>
    apiClient.post("/admin/hackathons", input),
  createCertificate: (input: { userId: string; title: string; certificateType: string }) => apiClient.post("/admin/certificates", input),
  createIndustryPartner: (input: { userId: string; companyName: string; contactPerson: string; website?: string }) => apiClient.post("/admin/industry/partners", input),
  createEvaluator: (input: { userId: string; expertise: string[] }) => apiClient.post("/admin/evaluators", input),
  evaluateHackathon: (submissionId: string, input: { innovation: number; technical: number; impact: number; presentation: number; completeness: number; comments?: string }) =>
    apiClient.post(`/evaluator/hackathon-submissions/${submissionId}/evaluate`, input),
  createBadgeRule: (input: { badgeId: string; trigger: string; threshold: number }) => apiClient.post("/admin/badge-rules", input),
  applyBadges: (userId: string) => apiClient.post(`/admin/users/${userId}/apply-badges`),
};

// ---------------------------------------------------------------------------
// Admin — Annual Audit & Awards (Page 30) + Audit Log Viewer (Page 31)
// ---------------------------------------------------------------------------

export interface AuditRunSummaryResponse {
  auditRunId: string;
  academicYear: string;
  candidateCount: number;
  runAt: string;
}

export interface AuditRunDetailResponse extends AuditRunSummaryResponse {
  candidates: {
    candidateId: string;
    rank: number | null;
    totalPoints: number;
    notes: string | null;
    user: { userId: string; fullName: string; email: string };
  }[];
  nominations: { nominationId: string; awardId: string; nomineeId: string; status: string; createdAt: string }[];
}

export interface AwardResponse {
  awardId: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface AuditLogEntryResponse {
  auditLogId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Assigned Courses (additive feature) — student browse/submit, admin CRUD,
// mentor review, proctoring.
// ---------------------------------------------------------------------------

export type EnrollmentStatusValue = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "APPROVED" | "REJECTED";
export type CourseTaskTypeValue = "STANDARD" | "LIVE_PROCTORED";
export type ProctoringStatusValue = "ACTIVE" | "COMPLETED" | "LOCKED";
export type ViolationTypeValue = "FULLSCREEN_EXIT" | "TAB_SWITCH" | "WINDOW_BLUR";

export interface CourseListItemResponse {
  courseId: string;
  title: string;
  description: string;
  shortDescription: string;
  category: string;
  difficulty: string;
  durationHours: number;
  durationWeeks: number | null;
  deliveryMode: string;
  enrollmentType: string;
  certificateAvailable: boolean;
  isFeatured: boolean;
  skillsCovered: string[];
  prerequisites: string[];
  learningOutcomes: string[];
  toolsRequired: string[];
  targetAudience: string;
  provider: string;
  externalUrl: string;
  pointsValue: number;
  levelRequirement: number | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  enrollmentStatus: EnrollmentStatusValue;
}

export interface CourseTaskResponse {
  taskId: string;
  title: string;
  type: CourseTaskTypeValue;
  instructions: string | null;
  sequenceOrder: number;
  isRequired: boolean;
  completed: boolean;
  proctoringStatus: ProctoringStatusValue | null;
}

export interface CourseDetailResponse extends Omit<CourseListItemResponse, "enrollmentStatus"> {
  enrollment: { enrollmentId: string; courseId: string; status: EnrollmentStatusValue; submittedProofUrl: string | null; submittedAt: string | null; reviewFeedback: string | null; reviewedAt: string | null };
  tasks: CourseTaskResponse[];
}

export const coursesApi = {
  list: () => apiClient.get<CourseListItemResponse[]>("/courses"),
  detail: (id: string) => apiClient.get<CourseDetailResponse>(`/courses/${id}`),
  completeTask: (courseId: string, taskId: string) => apiClient.post<{ taskId: string; completed: boolean }>(`/courses/${courseId}/tasks/${taskId}/complete`),
  submitProof: (courseId: string, input: { proofUrl?: string; fileKey?: string; fileName?: string; mimeType?: string; sizeBytes?: number }) =>
    apiClient.post(`/courses/${courseId}/proof`, input),
};

export interface AdminCourseListItemResponse {
  courseId: string;
  title: string;
  shortDescription: string;
  category: string;
  difficulty: string;
  durationHours: number;
  durationWeeks: number | null;
  deliveryMode: string;
  enrollmentType: string;
  certificateAvailable: boolean;
  isFeatured: boolean;
  skillsCovered: string[];
  provider: string;
  pointsValue: number;
  levelRequirement: number | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  taskCount: number;
  createdAt: string;
}

export interface AdminCourseDetailResponse {
  courseId: string;
  title: string;
  description: string;
  shortDescription: string;
  category: string;
  difficulty: string;
  durationHours: number;
  durationWeeks: number | null;
  deliveryMode: string;
  enrollmentType: string;
  certificateAvailable: boolean;
  isFeatured: boolean;
  skillsCovered: string[];
  prerequisites: string[];
  learningOutcomes: string[];
  toolsRequired: string[];
  targetAudience: string;
  provider: string;
  externalUrl: string;
  pointsValue: number;
  levelRequirement: number | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  tasks: { taskId: string; title: string; type: CourseTaskTypeValue; instructions: string | null; sequenceOrder: number; isRequired: boolean }[];
}

export interface UpsertCourseInput {
  title: string;
  description: string;
  shortDescription?: string;
  category: string;
  difficulty: string;
  durationHours: number;
  durationWeeks?: number | null;
  deliveryMode: string;
  enrollmentType: string;
  certificateAvailable: boolean;
  isFeatured: boolean;
  skillsCovered: string[];
  prerequisites: string[];
  learningOutcomes: string[];
  toolsRequired: string[];
  targetAudience?: string;
  provider: string;
  externalUrl: string;
  pointsValue: number;
  levelRequirement?: number | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

export interface UpsertCourseTaskInput {
  title: string;
  type: CourseTaskTypeValue;
  instructions?: string;
  sequenceOrder: number;
  isRequired: boolean;
}

export const adminCoursesApi = {
  list: () => apiClient.get<AdminCourseListItemResponse[]>("/admin/courses"),
  get: (id: string) => apiClient.get<AdminCourseDetailResponse>(`/admin/courses/${id}`),
  create: (input: UpsertCourseInput) => apiClient.post<{ courseId: string }>("/admin/courses", input),
  update: (id: string, input: UpsertCourseInput) => apiClient.put<{ courseId: string }>(`/admin/courses/${id}`, input),
  publish: (id: string) => apiClient.post(`/admin/courses/${id}/publish`),
  archive: (id: string) => apiClient.post(`/admin/courses/${id}/archive`),
  createTask: (id: string, input: UpsertCourseTaskInput) => apiClient.post(`/admin/courses/${id}/tasks`, input),
  updateTask: (id: string, taskId: string, input: UpsertCourseTaskInput) => apiClient.put(`/admin/courses/${id}/tasks/${taskId}`, input),
};

export interface MentorCourseQueueItemResponse {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  pointsValue: number;
  submittedProofUrl: string | null;
  submittedAt: string | null;
  student: { userId: string; fullName: string; department: string };
}

export const mentorCoursesApi = {
  queue: () => apiClient.get<MentorCourseQueueItemResponse[]>("/mentor/courses/queue"),
  approve: (enrollmentId: string) => apiClient.post(`/mentor/courses/${enrollmentId}/approve`),
  reject: (enrollmentId: string, feedback: string) => apiClient.post(`/mentor/courses/${enrollmentId}/reject`, { feedback }),
  proofDownloadUrl: (enrollmentId: string) => apiClient.get<{ downloadUrl: string; expiresInSeconds: number }>(`/mentor/courses/${enrollmentId}/proof-download-url`),
};

export interface ProctoringSessionResponse {
  sessionId: string;
  taskId: string;
  status: ProctoringStatusValue;
  violationCount: number;
  startedAt: string;
  endedAt: string | null;
}

export interface ReportViolationResponse {
  locked: boolean;
  violationCount: number;
  remaining: number;
  session: ProctoringSessionResponse;
}

export const proctoringApi = {
  start: (taskId: string) => apiClient.post<ProctoringSessionResponse>(`/proctoring/tasks/${taskId}/start`),
  reportViolation: (sessionId: string, violationType: ViolationTypeValue) =>
    apiClient.post<ReportViolationResponse>(`/proctoring/sessions/${sessionId}/violations`, { violationType }),
  complete: (sessionId: string) => apiClient.post<ProctoringSessionResponse>(`/proctoring/sessions/${sessionId}/complete`),
};

export interface LockedProctoringSessionResponse {
  sessionId: string;
  violationCount: number;
  lockedAt: string;
  task: { taskId: string; title: string };
  course: { courseId: string; title: string };
  student: { userId: string; fullName: string; department: string };
}

export const mentorProctoringApi = {
  listLocked: () => apiClient.get<LockedProctoringSessionResponse[]>("/mentor/proctoring/locks"),
  grantAccess: (sessionId: string) => apiClient.post<ProctoringSessionResponse>(`/mentor/proctoring/locks/${sessionId}/grant-access`),
};

export const adminMentorDepartmentApi = {
  set: (userId: string, department: string | null) => apiClient.post<{ userId: string; mentorDepartment: string | null }>(`/admin/users/${userId}/mentor-department`, { department }),
};

export const adminAuditApi = {
  run: (academicYear: string, candidateCount: number) =>
    apiClient.post<AuditRunDetailResponse>("/admin/audit/run", { academicYear, candidateCount }),
  listRuns: () => apiClient.get<AuditRunSummaryResponse[]>("/admin/audit/runs"),
  getRun: (id: string) => apiClient.get<AuditRunDetailResponse>(`/admin/audit/runs/${id}`),
  listAwards: () => apiClient.get<AwardResponse[]>("/admin/audit/awards"),
  createAward: (name: string, description?: string) => apiClient.post<AwardResponse>("/admin/audit/awards", { name, description }),
  nominate: (awardId: string, nomineeId: string) =>
    apiClient.post<{ nominationId: string }>("/admin/audit/nominations", { awardId, nomineeId }),
  logs: (params: { page?: number; pageSize?: number } = {}) =>
    apiClient.get<PaginatedResult<AuditLogEntryResponse>>(`/admin/audit/logs${toQueryString(params)}`),
};
