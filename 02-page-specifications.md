> **Part 2 of 7 — Detailed Page Specifications**
> Companion files: `01-overview-roles-navigation.md` · `03-workflows-and-data-model.md` · `04-api-business-rules-reference.md` · `05-design-system-and-operations.md` · `06-PROMPT-courses-and-proctoring.md` · `07-roles-and-responsibilities.md`
> This file assumes the roles, routes, and navigation rules defined in Part 1. Apply the visual system in Part 5 (Section 18) to every page below.

# AI Digital Passport Platform — Page Specifications (Part 2 of 7)

## 6. Detailed Page Specifications

Each page below follows the same template: **Purpose · Access · What it shows · Actions/Functions · APIs used · Business rules enforced · Edge cases.**

### 6.1 Public Pages

#### Page 1 — Login (`/login`)
- **Purpose:** Entry point; authenticates via Google OAuth 2.0.
- **Access:** Public.
- **Shows:** Platform branding, "Sign in with Google" button, short tagline (e.g., "Power • People • Projects • Possibilities").
- **Functions:** `Sign in with Google` → triggers OAuth flow.
- **APIs:** `GET/POST /auth/*` (SSO callback, session creation).
- **Business rules:** Only `@sece.ac.in` email addresses are permitted (FR-AUTH-01 / BR-01). All other domains must be rejected with HTTP 403.
- **Edge cases:** OAuth token expired/invalid → show retry; non-institutional email → redirect to Access Denied page.

#### Page 2 — Onboarding (`/onboarding`)
- **Purpose:** Collects required profile info for first-time institutional users.
- **Access:** Authenticated, first-time user only (no existing profile row).
- **Shows:** Form fields: **Register Number, Department, Cohort Year**.
- **Functions:** Submit → creates user profile.
- **APIs:** `POST /auth/onboard` (or equivalent under `/auth/*`) → creates row in `users` table.
- **Business rules:** New profile is always initialized at **Level 1 (AI Explorer), 0 points, 0 GPU credits** (FR-AUTH-03 / BR-02). Returning users skip this page entirely and go straight to `/dashboard` (fetch existing profile/state).
- **Edge cases:** Duplicate register number → validation error; incomplete form → block submission.

#### Page 3 — Access Denied (`/access-denied`)
- **Purpose:** Shown when a non-institutional email attempts login.
- **Access:** Public.
- **Shows:** Clear message that only `@sece.ac.in` accounts may authenticate.
- **Business rules:** BR-01, FR-AUTH-01. Must return/display HTTP 403 semantics.

---

### 6.2 Student Pages

#### Page 4 — Dashboard / AI Digital Passport (`/dashboard`)
- **Purpose:** The student's home page — the "passport card" itself (FR-DASH-01).
- **Access:** Student (own data only).
- **Shows:**
  - Identity header: name, register number, department, cohort year.
  - Current Level (name + number, e.g., "Level 2 — AI Practitioner") and progress toward next threshold.
  - Total points.
  - Active badge(s).
  - GPU credit balance.
  - Recent activity / claim status summary.
  - The **Nine-Grid Navigation** to all modules (FR-DASH-02), with locked tiles clearly marked (Industry Problems requires Level 3+).
- **Functions:** Navigate to any module tile; quick-link to "Submit Claim" and "My Claims."
- **APIs:** `GET /passport` (aggregated dashboard payload), `GET /me`, `GET /levels`.
- **Business rules:** Privilege unlock display must reflect FR-PRIV-01 (each level maps to a defined privilege — see Section 11 table). Level-gated tiles are visually locked but the actual enforcement happens server-side when the student tries to access them.
- **Edge cases:** New user with 0 points/Level 1 — dashboard must render gracefully with empty history, not error.

#### Pages 5–10 — Module Pages: Sessions, Certifications, Labs, Projects, Hackathons, Research
- **Purpose:** Each is a category-specific activity module reachable from the nine-grid. They let a student browse relevant activities/opportunities and initiate a claim for that category.
- **Access:** Student. All six of these modules are open at Level 1 (only the Industry Problem Bank and, indirectly, higher-tier resources are level-gated).
- **Shows:** List of relevant activities/opportunities in that category (e.g., upcoming Tech Eve sessions, GPU Friday labs, available certifications/courses, ongoing hackathons, research opportunities); each item shows its point value from the scoring matrix (Section 11.1).
- **Functions:** "Submit Evidence" / "Claim this activity" → routes to `/claims/new` pre-filled with the category.
- **APIs:** `GET/POST /activities` (activity discovery + claim submission, scoped by category query param).
- **Business rules:** Point values per category are fixed by the scoring matrix (FR-GAME-01) — see Section 11.1. A claim is not "worth" points until approved (BR-03).
- **Edge cases:** No activities currently open in a category → empty state message, not a blank page.

#### Page 11 — Industry Problem Bank (`/problems`)
- **Purpose:** Browse and access real industry problem statements (FR-PROB-01).
- **Access:** **Student, Level 3 (AI Builder) or higher only.** Level 1–2 users must be blocked (FR-PROB-01, BR-07).
- **Shows:** List of published problem statements (managed by Admin); status/metadata per problem.
- **Functions:** View problem detail; (if applicable) express interest / submit a solution claim.
- **APIs:** `GET /problems`.
- **Business rules:** Backend must independently re-verify the user's level on every request — do not rely on the frontend hiding the tile (Role/Access Principle, Section 4.1 of SRS).
- **Edge cases:** Level 1–2 user directly hits the route or API → must receive an authorization error, not just a redirect (SEC-06); page should explain "Requires Level 3 (AI Builder)."

#### Page 12 — Startup Launchpad (`/startup`)
- **Purpose:** Track a student's startup project through its six-stage pipeline (FR-INC-01).
- **Access:** Student (own project(s)).
- **Shows:** Current stage out of 6: **1 Idea → 2 Prototype → 3 GPU Validation → 4 MVP → 5 Industry Pilot → 6 AI Startup**; project title; GPU-validated flag; stage history/milestones.
- **Functions:** Create a new startup project; submit evidence/milestone for current stage to request advancement.
- **APIs:** `GET/POST /startup/projects`.
- **Business rules:** Projects always start at Stage 1 and move sequentially through Stage 6 (BR-09). **Open decision:** exact rules for who approves stage transitions and what evidence is required are undefined in the source spec — see Section 16. Build the UI to support a mentor-reviewed milestone submission (consistent with the rest of the platform's verification pattern) pending that decision.
- **Edge cases:** No project yet → prompt to create one.

#### Page 13 — Leaderboard & Awards (`/leaderboard`)
- **Purpose:** Cohort ranking and recognition (part of Reporting/Analytics, Section 18 of SRS).
- **Access:** All authenticated roles can view (read-only for students).
- **Shows:**
  - Cohort leaderboard ranked by points; badges/awards; (for admins) links into the Annual Audit results.
  - **AI Excellence Awards section** — displays the 8 named annual award categories with current nominees/winners once published by Admin:
    1. AI Student of the Year
    2. AI Researcher of the Year
    3. Best AI Project
    4. Best AI Startup
    5. Best AI Faculty Mentor
    6. Best Industry Project
    7. Most Active AI Learner
    8. Best GPU Computing Project
  - Award results are published by Admin after the Annual Celebration Night; before publication the categories are shown with "Results to be announced" placeholder.
- **APIs:** Backed by Redis for low-latency ranking, rebuilt from PostgreSQL if cache is unavailable (Architectural Principle, Section 5.1 of SRS). Award results via `GET /awards/categories`.
- **Business rules:** **Open decision:** tie-breaking and privacy/visibility rules for the leaderboard are not defined in the source spec — see Section 16. Do not silently invent ranking tie-break logic; flag it as configurable.
- **Edge cases:** Redis outage — page must still work by falling back to a PostgreSQL query (Risk: "Redis outage," Section 25 of SRS). Award categories with no nominees yet — show empty placeholder, not an error.

#### Page 14 — Submit Claim / Evidence (`/claims/new`)
- **Purpose:** Central point where a student submits proof of an activity for verification (FR-VERIF-02).
- **Access:** Student.
- **Shows:** Category selector (pre-filled if coming from a module page), proof-type selector, upload/link field.
- **Functions:** Submit claim. Proof type must be one of: **TOTP_QR, PDF_FILE, GITHUB_LINK, DOI_LINK** (Section 11.3 enumeration). PDF/GitHub/DOI submissions always enter `PENDING` status and route to the mentor queue (FR-VERIF-02); TOTP_QR is not submitted here — it's handled by the live Scan page (Page 17) and is auto-approved instantly.
- **APIs:** `POST /activities` (or a dedicated `POST /claims`), which creates a row in `activity_claims`.
- **Business rules:** Only approved claims generate points (BR-03). File uploads must go to private S3 buckets with validated file type/size (SEC-07, Section 13.2 File Security Controls); consider malware scanning before it reaches a mentor.
- **Edge cases:** Upload failure to S3 → must not silently mark the claim as verified — return an actionable failure state (Error Handling matrix, Section 14).

#### Page 15 — My Claims (`/claims`)
- **Purpose:** History and current status of all of a student's claims.
- **Access:** Student (own claims only).
- **Shows:** List with status badges: **PENDING / APPROVED / REJECTED** (Section 11.2 enumeration); mentor feedback visible on rejected claims.
- **APIs:** `GET /claims`.
- **Business rules:** Rejected claims must retain mentor feedback and remain available for revision/resubmission (FR-VERIF-03).
- **Edge cases:** No claims yet → empty state.

#### Page 16 — Claim Detail (`/claims/[id]`)
- **Purpose:** Full detail of one claim, including timeline.
- **Access:** Student (own), Mentor/Admin (if assigned/reviewing).
- **Shows:** Proof submitted, status, timestamps, reviewer identity (if reviewed), feedback text.
- **APIs:** `GET /claims/:id`.
- **Business rules:** Every point allocation must be traceable to exactly one approved claim (BR-12).

#### Page 17 — Live Event QR Scan (`/scan`)
- **Purpose:** Attendance/verification for live events via dynamic TOTP-backed QR (FR-VERIF-01). On web this is typically a camera-based scanner (webcam) or a manual token-entry fallback; on the future mobile app this becomes the primary camera flow.
- **Access:** Student.
- **Shows:** Camera viewfinder / QR scan UI, event name once resolved.
- **Functions:** Scan → sends the scanned token to the backend for validation.
- **APIs:** `POST /events/:id/scan`.
- **Business rules:**
  - QR refreshes every **15 seconds** (FR-VERIF-01).
  - Token must be bound to the specific event/session, within its active time window (Section 13.1 QR Security Controls).
  - Expired or already-used tokens are rejected; **no duplicate attendance for the same event by the same student** (BR-05, Risk: "Duplicate QR scans").
  - Valid scans are **auto-approved immediately** and proceed straight to the points engine (FR-VERIF-01) — no mentor step involved.
  - Point allocation from a QR scan must be idempotent (Section 13.1).
- **Edge cases:** Expired/invalid token → "QR expired/invalid" message, no points awarded (TC-VERIF-02). Duplicate scan attempt → rejected silently or with a friendly "already recorded" message, not double credit.

#### Page 18 — Profile & Settings (`/profile`)
- **Purpose:** View/edit non-critical profile info; session management.
- **Access:** Student (own), similarly available to Mentor/Admin for their own account.
- **Shows:** Name, email (read-only — tied to SSO), department, cohort year, register number (read-only after creation).
- **APIs:** `GET /me`, `PATCH /me`.
- **Business rules:** Core identity fields (email, register number) should not be freely editable post-onboarding, since they're unique keys tied to authentication and points integrity.

#### Page 19 — Notifications (`/notifications`)
- **Purpose:** In-app notification center.
- **Access:** All authenticated roles.
- **Shows:** Claim rejection/approval notices with feedback, pending mentor-review reminders (for mentors), annual award/fellowship results.
- **Business rules:** Rejected claims must notify the student with mentor feedback (FR-VERIF-03, Section 16 of SRS body). **Open decision:** push notification provider is not yet selected (see Section 16) — build this page against an internal notification table/API first so it works regardless of what push provider is chosen later.

#### Page 20 — AI Learning Academy (`/academy`)
- **Purpose:** Browse the platform's structured AI curriculum across 4 learning tracks; surface course/certification opportunities and link each topic into the existing claim/course submission flow.
- **Access:** Student (all levels).
- **Shows:**
  - 4 track cards: **AI Foundation**, **AI Engineering**, **AI Computing**, **Advanced AI**.
  - Expanding each track reveals its topics (6 topics per track):
    - **AI Foundation:** AI Fundamentals, Generative AI, Prompt Engineering, Responsible AI, AI Tools, Data Fundamentals.
    - **AI Engineering:** Python for AI, Machine Learning, Deep Learning, LLMs & Agentic AI, Computer Vision, Multimodal AI.
    - **AI Computing:** GPU Computing, CUDA Fundamentals, Parallel Computing, Model Training, Model Optimisation, Inference.
    - **Advanced AI:** Generative AI, AI Agents, Vision-Language Models, Large Language Models, Distributed AI, AI Deployment.
  - Each topic shows: description (Admin-authored), recommended provider(s) from the Learning Platform Ecosystem (Section 4A), and a "Start / Submit Evidence" CTA.
  - Student's completion status per topic (based on approved claims in that topic's category).
- **Functions:** Click topic → routes to `/claims/new` pre-filled with topic/category. Filter tracks by completion status.
- **APIs:** `GET /academy/tracks` (returns tracks → topics → resources), `GET /me/academy-progress`.
- **Business rules:** Topic completion is derived from approved claims — not a separate state (no double-awarding). All topics are visible at Level 1 (browsing the curriculum is always allowed; actual lab/GPU resources may be level-gated separately).
- **Edge cases:** No claims for a topic yet → show "Not started" state with CTA. Track with all topics complete → show completion badge.

#### Page 21 — Programme Calendar (`/programmes`)
- **Purpose:** List all upcoming instances of the 10 named recurring programme types; let students register/attend and feed into the existing QR/claim verification flow.
- **Access:** Student (all levels).
- **Shows:**
  - Upcoming programme instances in chronological order, grouped or filterable by programme type.
  - Each instance card: programme type name, specific date/time/venue, point value on attendance, registration/attend button.
  - Cadence reference ("Every Tuesday," "Monthly," etc.) visible so students can plan ahead.
  - Past instances the student attended (from their attendance record).
- **Functions:** Register interest (optional, for capacity-limited events). Attend via QR scan (routes to `/scan` or deep-links to the event's QR session). View past attendance.
- **APIs:** `GET /programmes` (all programme types + upcoming instances), `GET /me/programme-attendance`.
- **Business rules:** Attendance is always recorded via the existing QR scan flow (FR-VERIF-01) — this page is discovery/planning only; it does not itself award points. Each programme instance maps to exactly one programme type, which determines the point value (see Section 4B point mapping in file 01).
- **Edge cases:** No upcoming instances scheduled → "Check back soon" message with the cadence so students know when the next one is expected. Student already attended this instance → show "Attended" badge on the card.

#### Page 22 — Fellowships (`/fellowships`)
- **Purpose:** Show a student's eligibility status and provide the application/nomination entry point for both fellowship programmes.
- **Access:** Student (all levels; eligibility criteria may not be met, but the page is always visible to motivate progression).
- **Shows:** Two clearly distinct sections:

  **Section A — NVIDIA AI Student Fellowship**
  - Description: "20–30 high-performing students selected annually."
  - Benefits listed: Dedicated GPU Access; Faculty + Industry Mentorship; Advanced Training; Research & Project Funding; Certification & Conference Support; Internships & Industry Exposure.
  - Outcomes: Research | Patents | Products | Startups.
  - Student's current eligibility indicators (level, points, relevant claim counts).
  - Application/expression of interest CTA (active during the annual window set by Admin; disabled otherwise with "Applications open [date range]").

  **Section B — AI Research Fellowship**
  - Description: "Faculty-led GPU-intensive research programmes."
  - Elements: Domain-focused Research; GPU Allocation; Industry Collaboration; Publication & Patent Support.
  - Outcomes: Research Excellence | Real-world Impact.
  - This fellowship is faculty-nominated, not self-applied — the student sees "Nominated students will be contacted by their faculty mentor" and their own nomination status if applicable.
  - Eligibility: Level 5 (AI Researcher) or higher recommended.

- **APIs:** `GET /fellowships` (both types + student's status), `POST /fellowships/student/apply` (Student Fellowship only), `GET /me/fellowship-status`.
- **Business rules:** The two fellowships are distinct programmes tracked in separate `fellowship_applications` rows via `fellowship_type` field (see Section 8, file 03). A student may be an applicant/nominee for both simultaneously. The Student Fellowship application window is controlled by an Admin-set date range; outside that window, the CTA is disabled. The Research Fellowship nomination is admin/mentor-initiated, not student-initiated.
- **Edge cases:** No active application window for Student Fellowship → show next expected window if known, else "TBD." Student already applied for Student Fellowship this cycle → show "Application submitted — under review." Research Fellowship — student not nominated → show motivational "Keep building towards Level 5" message.

---


### 6.3 Mentor / Faculty Pages

#### Page 23 — Mentor Dashboard (`/mentor`)
- **Purpose:** Landing page for mentors — at-a-glance workload.
- **Access:** Mentor.
- **Shows:** Count of pending claims, count assigned to this mentor, recent activity.
- **APIs:** `GET /mentor/claims` (summary view).

#### Page 24 — Mentor Review Queue (`/mentor/queue`)
- **Purpose:** List of claims awaiting async review (FR-VERIF-02).
- **Access:** Mentor.
- **Shows:** Queue of `PENDING` claims (PDF/GitHub/DOI submissions), student name, category, submitted date; sortable/filterable; paginated (per API Design Rules, Section 19.1 — large collections must be paginated).
- **Functions:** Open a claim to review.
- **APIs:** `GET /mentor/claims`.
- **Business rules:** **Open decision:** the exact mentor-assignment model (who gets which claim) is not defined in the source spec (`reviewed_by` exists, but assignment logic doesn't) — see Section 16. Build the queue to support either "shared pool, first mentor to open it reviews it" or "pre-assigned" without hard-coding one model.

#### Page 25 — Mentor Claim Review Detail (`/mentor/queue/[id]`)
- **Purpose:** Review a single claim's evidence and decide.
- **Access:** Mentor.
- **Shows:** Full proof (PDF viewer / GitHub link / DOI link), student info, requested points/category.
- **Functions:** **Approve** or **Reject (with mandatory feedback text)**.
- **APIs:** `POST /mentor/claims/:id/approve`, and an equivalent reject endpoint (e.g., `POST /mentor/claims/:id/reject`).
- **Business rules:**
  - Approval → claim status becomes `APPROVED`, proceeds to point allocation (FR-VERIF-02, BR-06).
  - Rejection → claim status becomes `REJECTED`, feedback is mandatory and persisted, student is notified (FR-VERIF-03).
  - The reviewing mentor's identity and review timestamp must be recorded (Auditability, Section 17 of SRS: "Record who reviewed," "Record when the review occurred").
  - This action must be role-checked server-side — a student must never be able to call this endpoint (SEC-05).
- **Edge cases:** Two mentors opening/approving the same claim concurrently → must not double-award points (Additional Engineering Test: "Duplicate mentor approval request," Section 21.1 of SRS).

#### Page 26 — Startup Milestone Review (`/mentor/startups`)
- **Purpose:** Mentor evaluation of startup stage-advancement evidence.
- **Access:** Mentor.
- **Shows:** List of startup projects with pending stage-advancement requests.
- **Functions:** Approve/reject stage advancement.
- **Business rules:** Same open-decision caveat as Page 12 — exact evidence/approval rules for stage transitions are unspecified in the source (Section 16). Implement using the same approve/reject-with-feedback pattern as claim review for consistency.

---

### 6.4 Admin Pages

#### Page 27 — Admin Dashboard (`/admin`)
- **Purpose:** System-wide operational overview.
- **Access:** Admin.
- **Shows:** Headline metrics — total students, pending claims, level distribution, active events, active programme instances, system health (API/DB/cache/S3 status per NFR health-check requirements, Section 22).

#### Page 28 — Event & QR Management (`/admin/events`)
- **Purpose:** Create and manage live events and their dynamic QR sessions (feeds FR-VERIF-01).
- **Access:** Admin.
- **Shows:** List of events (past/active/upcoming); for an active event, a live-refreshing QR code display (15-second TOTP rotation) meant to be projected/displayed at the venue.
- **Functions:** Create event, start/stop QR session, view live attendance count.
- **APIs:** Under `/admin/*`; event creation/session control.
- **Business rules:** Each generated token must be bound to that specific event and time window (Section 13.1).

#### Page 29 — Problem Bank Management (`/admin/problems`)
- **Purpose:** CRUD for Industry Problem Bank statements (FR-PROB-01, "manageable by authorized administrators").
- **Access:** Admin.
- **Shows:** List/edit/create problem statements.
- **APIs:** Admin CRUD under `/admin/*`, read exposed to students via `GET /problems`.
- **Business rules:** **Open decision:** the source spec references "100 problems" but doesn't define full metadata/status schema — see Section 16. Design the schema to at minimum support: title, description, status (draft/published/archived), and level requirement.

#### Page 30 — User & Role Management (`/admin/users`)
- **Purpose:** Manage user accounts and role assignments.
- **Access:** Admin.
- **Shows:** Searchable user list; role badges (Student/Mentor/Admin); level/points override tools (for corrections).
- **Functions:** Assign/change roles; manually adjust points with a mandatory audit reason (supports point-correction test case, Section 21.1: "Point reversal or correction").
- **Business rules:** RBAC should be modeled explicitly (recommended `roles`/`user_roles` tables — Section 8's Data Model Extensions) rather than a single role string, to keep this screen and its permission checks maintainable.

#### Page 31 — Scoring & Level Configuration (`/admin/scoring`)
- **Purpose:** Central, data-driven configuration of the points matrix and level thresholds — this is what keeps FR-GAME-01/02/03 configurable instead of hard-coded (Maintainability requirement, Section 24: "Keep points rules configurable rather than hard-coded in UI code").
- **Access:** Admin.
- **Shows:** Editable table of activity categories → point values (Section 11.1); editable table of level thresholds → privileges (Section 11.2).
- **Business rules:** Changing these values is itself an auditable administrative action (Section 17: "Record administrative changes to scoring/configuration").
- **Caution:** The **Level 6 "High Impact" condition is explicitly undefined** in the source requirements (see Section 16) — this screen should expose it as a configurable rule once defined, not assume a number.

#### Page 32 — Reports & Analytics Export (`/admin/reports`)
- **Purpose:** Reporting hub (Section 18 of SRS).
- **Access:** Admin.
- **Shows:** Points distribution by activity category, level distribution across the cohort, pending/approved/rejected claim statistics, Problem Bank usage among eligible students, startup stage distribution, programme attendance statistics by programme type.
- **Functions:** Export data (CSV/analytics export).

#### Page 33 — Annual Audit & Awards (`/admin/audit`)
- **Purpose:** Run and review the automated annual fellowship/award process (FR-AUD-01).
- **Access:** Admin.
- **Shows:** Top 20–30 NVIDIA AI Student Fellowship candidates generated from cumulative passport data; award nomination roster by the 8 named AI Excellence Award categories; history of past annual runs.
- **Functions:** Trigger annual audit (or view its scheduled run); export/persist the roster for historical reference (BR-10); publish award results to `/leaderboard`.
- **Business rules:** **Open decision:** exact schedule/timing (what counts as the academic-year boundary) is unspecified — see Section 16.

#### Page 34 — Audit Log Viewer (`/admin/logs`)
- **Purpose:** Administrative/security traceability (Section 17, SEC-09).
- **Access:** Admin.
- **Shows:** Chronological log of sensitive actions: claim approvals/rejections (with reviewer + timestamp), scoring/config changes, role changes, annual audit runs, fellowship application window open/close events.
- **APIs:** `GET /admin/audit/*`.

#### Page 35 — Learning Academy Management (`/admin/academy`)
- **Purpose:** CRUD for the AI Learning Academy curriculum — manage the 4 tracks and their topics.
- **Access:** Admin.
- **Shows:** List of the 4 learning tracks; expand each to see its topics (name, description, recommended providers, associated point category). Edit/reorder buttons per track and topic.
- **Functions:**
  - Edit track name and description.
  - Create / edit / archive topics within a track.
  - Assign recommended Learning Platform Ecosystem provider(s) to each topic.
  - Set the topic's point-earning category (maps to a scoring matrix row).
  - Reorder topics within a track via drag-and-drop or explicit ordering field.
- **APIs:** Admin CRUD under `/admin/academy/*`; read endpoint `GET /academy/tracks` shared with the student-facing `/academy` page.
- **Business rules:** Track and topic changes are auditable (Section 17). Archiving a topic does not delete historical claims against it. At least one active topic must remain in each track at all times (prevent empty track).
- **Edge cases:** Attempt to delete a track with active topic claims → block deletion, offer archive instead.

#### Page 36 — Programme Calendar Management (`/admin/programmes`)
- **Purpose:** Manage programme type definitions and schedule specific instances of each type.
- **Access:** Admin.
- **Shows:**
  - List of the 10 programme types (from Section 4B of file 01) — each with its canonical cadence, description, and point-earning category.
  - Upcoming and past instances for each type.
- **Functions:**
  - Create / edit / cancel a programme instance (date, time, venue, QR session link).
  - Edit the description or notes of a programme type (cadence is configurable but changing it requires an explicit admin confirmation step since it appears in student-facing UI).
  - Link a programme instance to an Event & QR session (Page 28).
- **APIs:** Admin CRUD under `/admin/programmes/*`; read endpoint `GET /programmes` shared with the student-facing `/programmes` page.
- **Business rules:** Programme instances always belong to exactly one programme type. A programme instance must have at least a scheduled date before it can be published/visible to students. Creating an instance automatically links it to a new or existing QR session for attendance.
- **Edge cases:** Scheduling a programme instance with a past date → warn Admin but allow (for backfilling historical records). Cancelling a live instance with active QR → must also stop the QR session.

#### Page 37 — Fellowship Management (`/admin/fellowships`)
- **Purpose:** Manage both fellowship programmes — NVIDIA AI Student Fellowship and AI Research Fellowship — as two distinct tracked programmes.
- **Access:** Admin.
- **Shows:** Two clearly labelled sections:

  **Section A — NVIDIA AI Student Fellowship**
  - Current cycle's applicant list (from student self-applications).
  - Eligibility indicators per applicant pulled from passport data (level, points, claim counts).
  - Selection status per applicant: Under Review / Selected / Not Selected.
  - Application window controls (open/close date).
  - Selected cohort (20–30 students) with benefits activation status (GPU Access, Mentorship assignment, Funding, etc.).

  **Section B — AI Research Fellowship**
  - Faculty-nominated candidates list (mentor-submitted nominations).
  - Domain focus per nominee, GPU allocation request, supervising faculty.
  - Selection status and outcome tracking (GPU allocated Y/N, publication/patent support activated Y/N).

- **Functions:** Open/close Student Fellowship application window. Review and select/reject applicants (Student Fellowship). Add/review/select nominations (Research Fellowship). Export selected cohort list.
- **APIs:** Admin endpoints under `/admin/fellowships/*`; student-read endpoints under `/fellowships`.
- **Business rules:**
  - The two fellowships are stored as distinct rows in `fellowship_applications` via `fellowship_type` = `STUDENT` or `RESEARCH` — they must not be merged into one cohort.
  - A student can hold both a Student Fellowship and a Research Fellowship simultaneously (e.g., a Level-5 student who self-applied AND was faculty-nominated).
  - Selecting a Student Fellowship candidate triggers benefit activation (GPU credit allocation, mentor assignment) — these are auditable actions.
- **Edge cases:** Application window closed but a student tries to apply via the API directly → reject with a clear error. Research Fellowship nominee not yet at Level 5 → Admin can still nominate but the system flags a warning (not a hard block, since faculty discretion applies).

#### Page 38 — Award Category & Nomination Management (`/admin/awards`)
- **Purpose:** Manage the 8 AI Excellence Award categories and the nomination/selection process for the Annual Celebration Night.
- **Access:** Admin.
- **Shows:**
  - The 8 named award categories (pre-seeded, editable by Admin):
    1. AI Student of the Year
    2. AI Researcher of the Year
    3. Best AI Project
    4. Best AI Startup
    5. Best AI Faculty Mentor
    6. Best Industry Project
    7. Most Active AI Learner
    8. Best GPU Computing Project
  - Per category: list of nominees, their relevant passport data (points, claims, level), and selection status.
  - Publication status (draft / published to `/leaderboard`).
- **Functions:**
  - Add / edit nominees per category (manual entry or pull from top-N passport data for that category's metric).
  - Select winner per category.
  - Publish results to the Leaderboard & Awards page (Page 13).
  - Export nominees and winners as a formatted roster.
- **APIs:** Admin CRUD under `/admin/awards/*`; read endpoint `GET /awards/categories` shared with the student-facing `/leaderboard` page.
- **Business rules:** Award categories are pre-seeded from the poster's list but Admin can add new categories or rename existing ones (auditable). Publishing results is a one-way irreversible action per annual cycle (can create a new cycle, but past results are immutable). Each category must have at least one nominee before it can be published.
- **Edge cases:** Attempt to publish with empty nominee list in any category → warn Admin and require confirmation. Past-cycle results must remain visible on `/leaderboard` permanently (historical record).

---
