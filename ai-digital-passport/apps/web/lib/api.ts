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
  // Full activity record for the dashboard analytics (points history, category breakdown, rank, badges, etc.) — self-service mirror of the staff student-progress view.
  progress: () => apiClient.get<StudentProgressResponse>("/me/progress"),
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
  details?: StartupSubmissionDetails | null;
  createdAt: string;
  project: { projectId: string; title: string; leadName: string };
}

export interface AdminStartupListItem {
  projectId: string;
  title: string;
  currentStage: number;
  currentStageName: string;
  gpuValidated: boolean;
  lead: { userId: string; fullName: string; email: string; department: string; cohortYear: number };
  milestones: { approved: number; pending: number; rejected: number };
  createdAt: string;
  updatedAt: string;
}

export interface AdminStartupSummary {
  total: number;
  stageCounts: Record<string, number>;
  gpuValidated: number;
  pendingReviews: number;
  newLast30Days: number;
}

export interface AdminStartupMilestone {
  milestoneId: string;
  targetStage: number;
  stageName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  evidenceUrl: string | null;
  fields: Record<string, string>;
  documents: { fileKey: string; fileName: string }[];
  feedback: string | null;
  reviewerName: string | null;
  reviewedAt: string | null;
  submittedAt: string;
}

export interface AdminStartupDetail {
  projectId: string;
  title: string;
  currentStage: number;
  currentStageName: string;
  gpuValidated: boolean;
  createdAt: string;
  updatedAt: string;
  lead: { userId: string; fullName: string; email: string; registerNum: string; department: string; cohortYear: number };
  milestones: AdminStartupMilestone[];
}

export const adminStartupsApi = {
  list: (params: { page?: number; pageSize?: number; search?: string; stage?: number; status?: string } = {}) =>
    apiClient.get<PaginatedResult<AdminStartupListItem> & { summary: AdminStartupSummary }>(`/admin/startups${toQueryString(params)}`),
  detail: (projectId: string) => apiClient.get<AdminStartupDetail>(`/admin/startups/${projectId}`),
};

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

export interface FileAttachment {
  fileKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface ProblemMilestoneResponse {
  milestoneId: string;
  targetStage: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  feedback: string | null;
  evidenceUrl?: string | null;
  details?: { fields: Record<string, string> } | null;
  createdAt: string;
}

export interface ProblemProjectResponse {
  projectId: string;
  currentStage: number;
  currentStageName: string;
  verifiedStage: number;
  milestones: ProblemMilestoneResponse[];
}

export interface ProblemResponse {
  problemId: string;
  title: string;
  description: string;
  organization: string | null;
  levelRequirement: number;
  attachment: FileAttachment | null;
  // The student's own staged solution for this problem, if they've started one — same
  // staged, mentor-approved pattern as the Startup Launchpad (6 sequential phases).
  project: ProblemProjectResponse | null;
}

export const problemsApi = {
  list: (params: { page?: number; pageSize?: number } = {}) =>
    apiClient.get<PaginatedResult<ProblemResponse>>(`/problems${toQueryString(params)}`),
  startProject: (problemId: string) =>
    apiClient.post<{ projectId: string; problemId: string; currentStage: number }>(`/problems/${problemId}/projects`, { problemId }),
  submitMilestone: (projectId: string, input: { targetStage: number; evidenceUrl?: string; details?: Record<string, string> }) =>
    apiClient.post<{ milestoneId: string; projectId: string; targetStage: number; status: string; createdAt: string }>(
      `/problems/projects/${projectId}/milestones`,
      input,
    ),
};

export interface PendingProblemMilestoneResponse {
  milestoneId: string;
  targetStage: number;
  evidenceUrl: string | null;
  details?: { fields: Record<string, string> } | null;
  createdAt: string;
  project: { projectId: string; problemTitle: string; organization: string | null; studentName: string };
}

export const mentorProblemsApi = {
  pending: (params: { page?: number; pageSize?: number } = {}) =>
    apiClient.get<PaginatedResult<PendingProblemMilestoneResponse>>(`/mentor/problems${toQueryString(params)}`),
  review: (milestoneId: string, decision: "APPROVED" | "REJECTED", feedback?: string) =>
    apiClient.post<{ milestoneId: string; status: string }>(`/mentor/problems/${milestoneId}/review`, { decision, feedback }),
};

export interface AdminProblemProjectListItem {
  projectId: string;
  problemTitle: string;
  organization: string | null;
  currentStage: number;
  currentStageName: string;
  student: { userId: string; fullName: string; email: string; department: string; cohortYear: number | null };
  milestones: { approved: number; pending: number; rejected: number };
  createdAt: string;
  updatedAt: string;
}

export interface AdminProblemProjectSummary {
  total: number;
  stageCounts: Record<string, number>;
  pendingReviews: number;
  newLast30Days: number;
}

export interface AdminProblemMilestone {
  milestoneId: string;
  targetStage: number;
  stageName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  evidenceUrl: string | null;
  fields: Record<string, string>;
  feedback: string | null;
  reviewerName: string | null;
  reviewedAt: string | null;
  submittedAt: string;
}

export interface AdminProblemProjectDetail {
  projectId: string;
  problemTitle: string;
  organization: string | null;
  currentStage: number;
  currentStageName: string;
  createdAt: string;
  updatedAt: string;
  student: { userId: string; fullName: string; email: string; registerNum: string; department: string; cohortYear: number | null };
  milestones: AdminProblemMilestone[];
}

export const adminProblemProjectsApi = {
  list: (params: { page?: number; pageSize?: number; search?: string; stage?: number; status?: string } = {}) =>
    apiClient.get<PaginatedResult<AdminProblemProjectListItem> & { summary: AdminProblemProjectSummary }>(`/admin/problem-projects${toQueryString(params)}`),
  detail: (projectId: string) => apiClient.get<AdminProblemProjectDetail>(`/admin/problem-projects/${projectId}`),
};

// ---------------------------------------------------------------------------
// Startup Launchpad (Page 12)
// ---------------------------------------------------------------------------

export interface StartupMilestoneResponse {
  milestoneId: string;
  targetStage: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  feedback: string | null;
  evidenceUrl?: string | null;
  details?: StartupSubmissionDetails | null;
  createdAt: string;
}

export interface StartupSubmissionDetails {
  fields: Record<string, string>;
  documents: { fileKey: string; fileName: string }[];
}

export interface StartupProjectResponse {
  projectId: string;
  title: string;
  currentStage: number;
  currentStageName: string;
  gpuValidated: boolean;
  verifiedStage: number;
  milestones: StartupMilestoneResponse[];
}

export const startupApi = {
  list: () => apiClient.get<StartupProjectResponse[]>("/startup/projects"),
  create: (title: string) => apiClient.post<{ projectId: string; title: string; currentStage: number }>("/startup/projects", { title }),
  submitMilestone: (projectId: string, input: { targetStage: number; evidenceUrl?: string; details?: Record<string, string>; documents?: { fileKey: string; fileName: string }[] }) =>
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
  department: string;
  totalPoints: number;
  levelName: string;
}

export interface LeaderboardSummaryResponse {
  totalStudents: number;
  averagePoints: number;
  topScore: number;
  topLevelName: string | null;
  topLevelMinPoints: number | null;
  topLevelCount: number;
}

export const leaderboardApi = {
  top: (limit = 20) => apiClient.get<LeaderboardEntryResponse[]>(`/leaderboard?limit=${limit}`),
  summary: () => apiClient.get<LeaderboardSummaryResponse>("/leaderboard/summary"),
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

export interface StudentClassScheduleItem {
  eventId: string;
  title: string;
  description: string | null;
  location: string | null;
  category: string;
  year: string | null;
  department: string | null;
  sessionType: string | null;
  startsAt: string;
  endsAt: string;
  attended: boolean;
  qrActive: boolean;
  isPast: boolean;
}

export const eventsApi = {
  list: () => apiClient.get<StudentClassScheduleItem[]>("/events"),
  scan: (sessionId: string, token: string) => apiClient.post<ScanResponse>(`/events/${sessionId}/scan`, { token }),
  // Resolves the active event session purely from the 6-digit TOTP code — no Session ID required.
  scanGlobal: (token: string) => apiClient.post<ScanResponse>(`/events/scan`, { token }),
};

// ---------------------------------------------------------------------------
// Uploads (PostgreSQL-backed file storage, Page 14)
// ---------------------------------------------------------------------------

// Fetches a stored file through the session cookie and returns it as a Blob (used for in-page viewing).
export async function fetchStoredFile(fileKey: string): Promise<Blob> {
  const res = await fetch(`${API_BASE_URL}/uploads/files/${fileKey}`, { credentials: "include" });
  if (!res.ok) throw new Error(res.status === 404 ? "The file could not be found." : "The file could not be loaded.");
  return res.blob();
}

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
  newStudents30d: number;
  activeStudents7d: number;
  pendingClaims: number;
  activeEvents: number;
  totalPoints: number;
  avgPointsPerStudent: number;
  avgReviewHours: number | null;
  approvalRate7d: number | null;
  levelDistribution: { levelId: number; levelName: string; count: number }[];
  monthlyClaims: { month: string; approved: number; pending: number; rejected: number }[];
  weeklyClaims: { day: string; approved: number; pending: number; rejected: number }[];
  categoryPoints: { category: string; label: string; points: number; share: number }[];
  recentActivity: { id: string; kind: "CLAIM_APPROVED" | "CLAIM_REJECTED" | "CLAIM_SUBMITTED" | "POINTS"; user: string; action: string; at: string }[];
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
  year: string | null;
  department: string | null;
  sessionType: string | null;
  checkIns: number;
  points: number | null;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  sessions: AdminEventSessionResponse[];
}

export interface EventRosterEntry {
  userId: string;
  fullName: string;
  registerNum: string;
  department: string;
  checkedInAt: string;
}

export type AdminEventInput = {
  title: string; description?: string; location?: string; category: string;
  year?: string; department?: string; sessionType?: string; startsAt: string; endsAt: string;
};

export const adminEventsApi = {
  list: () => apiClient.get<AdminEventResponse[]>("/admin/events"),
  get: (eventId: string) => apiClient.get<AdminEventResponse>(`/admin/events/${eventId}`),
  roster: (eventId: string) => apiClient.get<EventRosterEntry[]>(`/admin/events/${eventId}/attendance`),
  delete: (eventId: string) => apiClient.delete<void>(`/admin/events/${eventId}`),
  create: (input: AdminEventInput) =>
    apiClient.post<AdminEventResponse>("/admin/events", input),
  update: (
    eventId: string,
    input: Partial<AdminEventInput>,
  ) => apiClient.patch<AdminEventResponse>(`/admin/events/${eventId}`, input),
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
  attachment: FileAttachment | null;
  createdAt: string;
}

export interface UpsertProblemInput {
  title: string;
  description: string;
  organization?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  levelRequirement: number;
  // undefined = leave as is, null = remove the attached file
  attachment?: FileAttachment | null;
}

export type IndustryGpuStatus = "NEW" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "FULFILLED";

export interface IndustryGpuRequestResponse {
  requestId: string;
  companyName: string;
  contactPerson: string;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  sector: string | null;
  useCase: string;
  gpuType: string | null;
  gpuCount: number | null;
  hoursNeeded: number | null;
  duration: string | null;
  status: IndustryGpuStatus;
  adminNotes: string | null;
  createdAt: string;
}

export const adminIndustryGpuApi = {
  list: () => apiClient.get<IndustryGpuRequestResponse[]>("/admin/industry/gpu-requests"),
  create: (input: Record<string, unknown>) => apiClient.post<IndustryGpuRequestResponse>("/admin/industry/gpu-requests", input),
  update: (id: string, input: Record<string, unknown>) => apiClient.put<IndustryGpuRequestResponse>(`/admin/industry/gpu-requests/${id}`, input),
  remove: (id: string) => apiClient.delete<void>(`/admin/industry/gpu-requests/${id}`),
};

export type WhitelistRole = "STUDENT" | "MENTOR" | "ADMIN";
export type WhitelistStatus = "AUTHORIZED" | "SUSPENDED";

export interface WhitelistEntryResponse {
  email: string;
  fullName: string | null;
  role: WhitelistRole;
  department: string;
  year: string | null;
  status: WhitelistStatus;
  source: string;
  addedAt: string;
  lastLoginAt: string | null;
}

export interface WhitelistListResponse {
  items: WhitelistEntryResponse[];
  summary: { total: number; students: number; mentors: number; admins: number; suspended: number };
}

export interface WhitelistRowInput {
  email: string;
  fullName?: string;
  role?: WhitelistRole;
  department?: string;
  year?: string;
  source?: string;
}

export const adminWhitelistApi = {
  list: (params: { search?: string; role?: string; status?: string } = {}) =>
    apiClient.get<WhitelistListResponse>(`/admin/whitelist${toQueryString(params)}`),
  add: (input: WhitelistRowInput) =>
    apiClient.post<{ addedCount: number; updatedCount: number; invalidCount: number }>("/admin/whitelist", input),
  import: (input: { rows: WhitelistRowInput[]; role?: WhitelistRole; department?: string; source?: string }) =>
    apiClient.post<{ addedCount: number; updatedCount: number; invalidCount: number }>("/admin/whitelist/import", input),
  setStatus: (email: string, status: WhitelistStatus) =>
    apiClient.patch<WhitelistEntryResponse>(`/admin/whitelist/${encodeURIComponent(email)}/status`, { status }),
  remove: (email: string) => apiClient.delete<void>(`/admin/whitelist/${encodeURIComponent(email)}`),
};

export const adminProblemsApi = {
  list: (params: { page?: number; pageSize?: number } = {}) =>
    apiClient.get<PaginatedResult<AdminProblemResponse>>(`/admin/problems${toQueryString(params)}`),
  create: (input: UpsertProblemInput) => apiClient.post<AdminProblemResponse>("/admin/problems", input),
  importFile: (input: { title: string; description?: string; organization: string; status: "PUBLISHED" | "DRAFT" | "ARCHIVED"; attachment: FileAttachment }) =>
    apiClient.post<AdminProblemResponse>("/admin/problems/import", input),
  update: (id: string, input: UpsertProblemInput) => apiClient.put<AdminProblemResponse>(`/admin/problems/${id}`, input),
  remove: (id: string) => apiClient.delete<{ success: true }>(`/admin/problems/${id}`),
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

export type ReportRange = "7d" | "30d" | "90d" | "all";

export interface AdminReportsSummaryResponse {
  range: ReportRange;
  department: string | null;
  generatedAt: string;
  departmentOptions: string[];
  overview: {
    totalStudents: number;
    activeStudents30d: number;
    pointsAwarded: number;
    averagePoints: number;
    claims: { approved: number; pending: number; rejected: number; total: number };
    approvalRatePct: number | null;
    avgReviewHours: number | null;
  };
  levels: { levelId: number; levelName: string; minPoints: number; count: number }[];
  pointsOverTime: { label: string; points: number }[];
  claimsByCategory: { category: string; label: string; approved: number; pending: number; rejected: number; points: number }[];
  departments: { name: string; students: number; averagePoints: number; claims: number; approvedClaims: number }[];
  topStudents: { rank: number; userId: string; fullName: string; department: string; levelId: number; totalPoints: number }[];
  courses: {
    courseId: string; title: string; provider: string; status: string;
    enrolled: number; completed: number; inReview: number; completionRatePct: number | null;
  }[];
  hackathons: {
    external: { total: number; approved: number; pending: number; rejected: number };
    internal: { byStatus: { status: string; count: number }[]; teams: number; submissions: number };
  };
  liveClasses: { eventId: string; title: string; startsAt: string; category: string; checkIns: number }[];
  problemBank: { byStatus: { status: string; count: number }[]; submissions: number; distinctSubmitters: number };
  startups: { stages: { stage: number; name: string; count: number }[]; projectsByStatus: { status: string; count: number }[] };
  gpu: { total: number; requestedCredits: number; allocatedCredits: number; byStatus: { status: string; count: number }[] };
  awards: { status: string; count: number }[];
  certificates: { issuedCount: number };
}

export const adminReportsApi = {
  summary: (params: { range: ReportRange; department?: string }) =>
    apiClient.get<AdminReportsSummaryResponse>(`/admin/reports/summary${toQueryString(params)}`),
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

export interface ExternalHackathon {
  external_id: string;
  source: "DEVPOST" | "UNSTOP" | "DEVFOLIO" | "MANUAL";
  title: string;
  description: string;
  url: string;
  image_url: string | null;
  organizer: string | null;
  location: string | null;
  is_online: boolean;
  prize: string | null;
  tags: string[];
  starts_at: string | null;
  ends_at: string | null;
  deadline_at: string | null;
  register_points: number;
  created_at: string;
  registered: boolean;
  registrationStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  registrationFeedback: string | null;
}

export interface HackathonApplicationsRow {
  externalId: string;
  title: string;
  organizer: string | null;
  deadlineAt: string | null;
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  applicants: {
    registrationId: string;
    claimId: string | null;
    studentName: string;
    studentEmail: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    feedback: string | null;
    pointsAwarded: number;
    appliedAt: string;
  }[];
}

export const externalHackathonsApi = {
  applications: () => apiClient.get<HackathonApplicationsRow[]>("/hackathons/external/applications"),
  list: () => apiClient.get<ExternalHackathon[]>("/hackathons/external"),
  sync: () => apiClient.post<{ fetched: number; saved: number; errors: string[] }>("/hackathons/external/sync"),
  add: (input: {
    title: string; url: string; description?: string; organizer?: string; location?: string; isOnline?: boolean;
    prize?: string; tags?: string[]; deadlineAt?: string; endsAt?: string;
  }) => apiClient.post<ExternalHackathon>("/hackathons/external", input),
  remove: (id: string) => apiClient.delete<void>(`/hackathons/external/${id}`),
  update: (id: string, input: {
    title?: string; url?: string; description?: string; organizer?: string; location?: string; isOnline?: boolean;
    prize?: string; tags?: string[]; deadlineAt?: string;
  }) => apiClient.patch<ExternalHackathon>(`/hackathons/external/${id}`, input),
  register: (
    id: string,
    proof: { proofType: "PDF_FILE" | "DOI_LINK"; proofUrl?: string; fileKey?: string; fileName?: string; mimeType?: string; sizeBytes?: number },
  ) => apiClient.post<{ alreadyRegistered: boolean; status: string; pointsAwarded: number }>(`/hackathons/external/${id}/register`, proof),
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
// mentor review.
// ---------------------------------------------------------------------------

export type EnrollmentStatusValue = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "APPROVED" | "REJECTED";

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

export interface CourseDetailResponse extends Omit<CourseListItemResponse, "enrollmentStatus"> {
  enrollment: { enrollmentId: string; courseId: string; status: EnrollmentStatusValue; submittedProofUrl: string | null; submittedAt: string | null; reviewFeedback: string | null; reviewedAt: string | null };
}

export const coursesApi = {
  list: () => apiClient.get<CourseListItemResponse[]>("/courses"),
  detail: (id: string) => apiClient.get<CourseDetailResponse>(`/courses/${id}`),
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
  externalUrl: string;
  pointsValue: number;
  levelRequirement: number | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
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

export const adminCoursesApi = {
  list: () => apiClient.get<AdminCourseListItemResponse[]>("/admin/courses"),
  get: (id: string) => apiClient.get<AdminCourseDetailResponse>(`/admin/courses/${id}`),
  create: (input: UpsertCourseInput) => apiClient.post<{ courseId: string }>("/admin/courses", input),
  update: (id: string, input: UpsertCourseInput) => apiClient.put<{ courseId: string }>(`/admin/courses/${id}`, input),
  publish: (id: string) => apiClient.post(`/admin/courses/${id}/publish`),
  archive: (id: string) => apiClient.post(`/admin/courses/${id}/archive`),
  delete: (id: string) => apiClient.delete(`/admin/courses/${id}`),
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

// ---------------------------------------------------------------------------
// CoE Class Teaching Logs — faculty record what they taught in a CoE Class
// session; admin reads every submission across all departments/mentors.
// ---------------------------------------------------------------------------

export interface CoeClassEventOption {
  eventId: string;
  title: string;
  department: string | null;
  year: string | null;
  sessionType: string | null;
  startsAt: string;
}

export interface ClassTeachingLogResponse {
  logId: string;
  eventId: string;
  eventTitle: string | null;
  eventDepartment: string | null;
  eventYear: string | null;
  classDate: string;
  topicsCovered: string;
  materialsUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminClassTeachingLogResponse extends ClassTeachingLogResponse {
  eventSessionType: string | null;
  mentorName: string | null;
  mentorEmail: string | null;
  mentorDepartment: string | null;
}

export const mentorCoeClassesApi = {
  events: () => apiClient.get<CoeClassEventOption[]>("/mentor/coe-classes/events"),
  myLogs: () => apiClient.get<ClassTeachingLogResponse[]>("/mentor/coe-classes/logs"),
  create: (input: { eventId: string; classDate: string; topicsCovered: string; materialsUrl?: string; notes?: string }) =>
    apiClient.post<ClassTeachingLogResponse>("/mentor/coe-classes/logs", input),
  update: (logId: string, input: { classDate?: string; topicsCovered?: string; materialsUrl?: string; notes?: string }) =>
    apiClient.patch<ClassTeachingLogResponse>(`/mentor/coe-classes/logs/${logId}`, input),
  remove: (logId: string) => apiClient.delete<{ deleted: boolean }>(`/mentor/coe-classes/logs/${logId}`),
};

export const adminCoeClassLogsApi = {
  list: () => apiClient.get<AdminClassTeachingLogResponse[]>("/admin/coe-classes/logs"),
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
};

// ---------------------------------------------------------------------------
// Awards — requests by students / staff, review by admin
// ---------------------------------------------------------------------------

export interface AwardCatalogEntry {
  awardId: string;
  name: string;
  description: string;
  audience: "STUDENT" | "STAFF";
  order: number;
  myRequests: { nominationId: string; status: "NOMINATED" | "CONFIRMED" | "DECLINED"; reason: string | null; adminNote: string | null; createdAt: string }[];
}

export interface AdminAwardRequest {
  nominationId: string;
  awardId: string;
  awardName: string;
  status: "NOMINATED" | "CONFIRMED" | "DECLINED";
  reason: string | null;
  adminNote: string | null;
  createdAt: string;
  requester: { userId: string; fullName: string; email: string };
  nominee: { userId: string; fullName: string; email: string };
}

export const awardsApi = {
  list: () => apiClient.get<AwardCatalogEntry[]>("/awards"),
  request: (input: { awardId: string; reason: string; nomineeEmail?: string }) =>
    apiClient.post<{ nominationId: string; status: string }>("/awards/requests", input),
  adminRequests: () => apiClient.get<AdminAwardRequest[]>("/admin/awards/requests"),
  adminReview: (id: string, status: "CONFIRMED" | "DECLINED", note?: string) =>
    apiClient.post<{ nominationId: string; status: string }>(`/admin/awards/requests/${id}/review`, { status, note }),
};

// ---------------------------------------------------------------------------
// Staff — Student Progress (mentor + admin, read-only)
// ---------------------------------------------------------------------------

export interface StaffStudentRow {
  userId: string;
  fullName: string;
  email: string;
  registerNum: string;
  department: string;
  cohortYear: number;
  totalPoints: number;
  levelId: number;
  levelName: string;
  claims: { approved: number; pending: number; rejected: number };
  lastActivityAt: string | null;
}

export interface StaffStudentList {
  items: StaffStudentRow[];
  total: number;
  page: number;
  pageSize: number;
  summary: { totalStudents: number; averagePoints: number; pendingClaims: number; byLevel: { levelId: number; count: number }[] };
  departments: string[];
}

export interface StudentProgressResponse {
  profile: {
    userId: string;
    fullName: string;
    email: string;
    registerNum: string;
    department: string;
    cohortYear: number;
    avatarUrl: string | null;
    totalPoints: number;
    gpuCreditBalance: number;
    highImpactFlag: boolean;
    joinedAt: string;
    rank: number;
    level: {
      levelId: number;
      levelName: string;
      minPoints: number;
      nextLevel: { levelId: number; levelName: string; minPoints: number; pointsNeeded: number } | null;
    };
  };
  summary: {
    pointsByCategory: { category: string; points: number }[];
    claims: { approved: number; pending: number; rejected: number };
    coursesCompleted: number;
    coursesInProgress: number;
    hackathonRegistrationsVerified: number;
    classesAttended: number;
    projects: number;
    badges: number;
    certificates: number;
  };
  pointsHistory: { transactionId: string; points: number; reason: string; source: string; createdAt: string }[];
  claims: {
    claimId: string; category: string; proofType: string; status: "PENDING" | "APPROVED" | "REJECTED";
    pointsRequested: number; pointsAwarded: number | null; mentorFeedback: string | null; createdAt: string; reviewedAt: string | null;
  }[];
  courses: {
    enrollmentId: string; title: string; provider: string; status: string; pointsEarned: number;
    submittedAt: string | null; reviewedAt: string | null; reviewFeedback: string | null;
  }[];
  hackathons: {
    external: { registrationId: string; title: string; organizer: string | null; url: string; status: string; feedback: string | null; registeredAt: string }[];
    teams: {
      teamId: string; teamName: string; hackathonTitle: string; hackathonStatus: string; role: string; joinedAt: string;
      submissions: { submissionId: string; title: string; submittedAt: string }[];
    }[];
  };
  attendance: { attendanceId: string; eventTitle: string; sessionTitle: string; category: string; classDate: string; checkedInAt: string }[];
  projects: {
    startups: {
      projectId: string; title: string; currentStage: number; gpuValidated: boolean; createdAt: string;
      milestones: { milestoneId: string; targetStage: number; status: string; feedback: string | null; createdAt: string }[];
    }[];
    records: {
      projectId: string; title: string; projectType: string; status: string; githubUrl: string | null; demoUrl: string | null; createdAt: string;
      milestones: { milestoneId: string; title: string; status: string; feedback: string | null; dueAt: string | null }[];
    }[];
    problemProjects: { projectId: string; problemTitle: string; currentStage: number; verifiedStage: number; pendingStage: boolean; createdAt: string }[];
  };
  achievements: {
    certificates: { certificateId: string; title: string; type: string; issuedAt: string }[];
    badges: { badgeId: string; name: string; description: string | null; awardedAt: string }[];
    awards: {
      nominationId: string; awardName: string; status: "NOMINATED" | "CONFIRMED" | "DECLINED";
      relation: "NOMINEE" | "REQUESTER" | "SELF_REQUEST"; reason: string | null; adminNote: string | null; createdAt: string;
    }[];
  };
  gpu: {
    balance: number;
    requests: { requestId: string; title: string; status: string; requestedCredits: number; allocatedCredits: number | null; createdAt: string }[];
  };
}

export const staffStudentsApi = {
  list: (params: { search?: string; department?: string; year?: number; level?: number; page?: number; pageSize?: number } = {}) =>
    apiClient.get<StaffStudentList>(`/staff/students${toQueryString(params)}`),
  progress: (userId: string) => apiClient.get<StudentProgressResponse>(`/staff/students/${userId}/progress`),
};
