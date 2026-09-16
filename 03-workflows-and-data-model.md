> **Part 3 of 7 — End-to-End Workflows & Data Model**
> Companion files: `01-overview-roles-navigation.md` · `02-page-specifications.md` · `04-api-business-rules-reference.md` · `05-design-system-and-operations.md` · `06-PROMPT-courses-and-proctoring.md` · `07-roles-and-responsibilities.md`
> These workflows reference the pages defined in Part 2 and the APIs defined in Part 4.

# AI Digital Passport Platform — Workflows & Data Model (Part 3 of 7)

## 7. End-to-End Workflows

### 7.1 Authentication & Onboarding
1. User opens the web portal → clicks Sign in with Google.
2. Backend validates the OAuth identity response and checks the email domain.
3. Non-`@sece.ac.in` email → reject with HTTP 403 → Access Denied page.
4. First-time eligible user → Onboarding page collects Register Number, Department, Cohort Year.
5. Backend creates the user profile at **Level 1, 0 points, 0 GPU credits**.
6. Returning user → backend fetches existing profile/state → straight to Dashboard.

### 7.2 Live Event Verification (instant path)
1. Admin creates/publishes a live event on `/admin/events`.
2. Backend generates a TOTP-backed QR token bound to that event, refreshing every 15 seconds.
3. Student opens `/scan`, scans the currently displayed QR.
4. Backend validates: token not expired, bound to this event, not already used by this student.
5. Invalid/expired → reject, no points.
6. Valid → claim is **auto-approved instantly** → proceeds directly to the points engine.

### 7.3 Asynchronous Claim Verification (mentor path)
1. Student picks an eligible activity (from a module page) and goes to `/claims/new`.
2. Student uploads a PDF or supplies a GitHub/DOI link.
3. Backend creates the claim with status `PENDING`, stores file in S3 (if applicable), and places it in the mentor queue.
4. Mentor opens `/mentor/queue`, opens the claim detail, reviews the evidence.
5. **Reject** → status `REJECTED`, feedback stored, student notified; claim remains available for revision/resubmission.
   **Approve** → status `APPROVED`, proceeds to point allocation.

### 7.4 Points & Level Progression
1. A points-eligible event occurs (QR approval or mentor approval).
2. Backend looks up the fixed point value for that activity category (Section 11.1).
3. Points are added to the student's total inside a database transaction (must be idempotent — no double-award on retry).
4. Backend re-evaluates level thresholds **from the highest applicable condition down to the lowest** (Section 10.2 of SRS) every time a point transaction posts.
5. If a new threshold is crossed, the student's `current_level_id` updates and the newly unlocked privilege becomes active (e.g., crossing 2,000 points unlocks Level 3 → Industry Problem Bank access).

### 7.5 Industry Problem Bank Gate
1. Student navigates to `/problems`.
2. Backend checks `current_level_id` on every request.
3. Level 1–2 → authorization error, UI shows "Requires Level 3 (AI Builder)."
4. Level 3+ → problems list returned.

### 7.6 Startup Launchpad Progression
1. Student creates a startup project (Stage 1 — Idea).
2. Student submits evidence to request advancement to the next stage.
3. (Pending Section 16 decision) A mentor/admin reviews and approves/rejects the stage advancement.
4. Project stage increments sequentially, 1 through 6 (Idea → Prototype → GPU Validation → MVP → Industry Pilot → AI Startup).

### 7.7 Annual Audit & Awards
1. On the defined annual schedule (date TBD — Section 16), the system evaluates cumulative passport data for all students.
2. Top 20–30 students are selected as **NVIDIA AI Student Fellowship** candidates.
3. Award nominations are generated per the 8 AI Excellence Award categories: AI Student of the Year, AI Researcher of the Year, Best AI Project, Best AI Startup, Best AI Faculty Mentor, Best Industry Project, Most Active AI Learner, Best GPU Computing Project.
4. The roster is persisted for historical reference and surfaced on `/admin/audit` (and notifications sent, once a provider is chosen).
5. Admin publishes award results to the public-facing `/leaderboard` page via `/admin/awards`.

### 7.8 Fellowship Application & Selection

**NVIDIA AI Student Fellowship (self-applied track)**
1. Admin opens the application window via `/admin/fellowships` (sets open/close dates — visible to students on `/fellowships`).
2. Student submits an expression of interest on `/fellowships/student/apply`.
3. System records a row in `fellowship_applications` with `fellowship_type = STUDENT`, `status = PENDING`.
4. Admin (and optionally assigned mentors) reviews applicants on Page 37 — eligibility indicators (level, points, claim breakdown) are pulled live from passport data.
5. Admin marks selected applicants as `SELECTED` (others as `NOT_SELECTED`). This is an auditable action (audit_logs entry).
6. On selection: GPU credit allocation is triggered (audit_logs entry), mentor assignment is created, funding/training access is activated. Student receives a notification.
7. Application window closes; latecomers receive a "window closed" error if they try to apply via the API directly.

**AI Research Fellowship (faculty-nominated track)**
1. Faculty mentor (Mentor role) submits a nomination for an eligible student via `/admin/fellowships` or a mentor-facing endpoint.
2. System records a row in `fellowship_applications` with `fellowship_type = RESEARCH`, `status = NOMINATED`, storing domain focus, GPU allocation requested, supervising faculty.
3. Admin reviews nominations on Page 37 Section B.
4. Admin selects nominees: `status → SELECTED`; GPU allocation is activated; publication/patent support flag is set.
5. Student is notified of their Research Fellowship selection.
6. Outcomes are tracked: Research Excellence indicators, publications, patents — linked back to `activity_claims` (Research Paper, Patent activities).

> **Key invariant:** `fellowship_type` ensures the two tracks never merge into one list. A student can simultaneously hold `STUDENT` and `RESEARCH` fellowship records.


---

## 8. Data Model

### 8.1 Baseline Tables (from source requirements — must exist)

**`levels`**
| Field | Notes |
|---|---|
| level_id | PK |
| level_name | e.g. "AI Explorer" |
| min_points | threshold |
| unlocked_privilege | text description |

**`users`**
| Field | Notes |
|---|---|
| user_id | PK, UUID |
| passport_id | Unique structured ID, format: `SE-AI-[cohort_year]-[NNN]`, generated at onboarding |
| email | unique, must match `%@sece.ac.in` |
| full_name | |
| register_num | unique |
| department | |
| cohort_year | |
| current_level_id | FK → levels, default 1 |
| total_points | default 0 |
| gpu_credit_balance | default 0 |
| created_at | |

**`activity_claims`**
| Field | Notes |
|---|---|
| claim_id | PK, UUID |
| user_id | FK → users |
| category | activity category |
| proof_type | one of `TOTP_QR`, `PDF_FILE`, `GITHUB_LINK`, `DOI_LINK` |
| proof_url | |
| points_requested | |
| status | one of `PENDING`, `APPROVED`, `REJECTED`, default `PENDING` |
| mentor_feedback | |
| reviewed_by | FK → users |
| created_at | |

**`startup_projects`**
| Field | Notes |
|---|---|
| project_id | PK, UUID |
| lead_student_id | FK → users |
| title | |
| current_stage | 1–6, default 1 |
| gpu_validated | boolean, default false |
| created_at | |

### 8.2 Recommended Production Extensions
The baseline schema above is intentionally minimal. To actually implement everything described in this document, add:

- `roles` / `user_roles` — explicit RBAC instead of a single role field.
- `events` / `event_sessions` — live sessions and attendance windows.
- `qr_tokens` — generated token windows/metadata.
- `attendance` — prevents duplicate attendance, gives event history.
- `points_transactions` — an auditable, append-only points ledger (this is what makes point allocation traceable per BR-12, and what audit logs report from).
- `claim_reviews` — mentor review history (who, when, what feedback) — separate from the claim's current state, so history isn't lost on re-review.
- `claim_attachments` — proof metadata and S3 object keys.
- `notifications` — delivery state, independent of whatever push provider is chosen later.
- `industry_problems` / `problem_submissions` — Problem Bank content and student submissions.
- `startup_milestones` — stage-level evidence and reviews.
- `badges` / `user_badges` — passport badge state.
- `awards` / `award_nominations` / `fellowship_candidates` — annual outcomes, persisted historically.
- `audit_logs` — administrative/security traceability feed for Page 34.

### 8.3 New Tables — Appendix A Additions (2026-09-15)

**`learning_providers`** *(canonical Learning Platform Ecosystem list; see Section 4A, file 01)*
| Field | Notes |
|---|---|
| provider_id | PK |
| name | e.g. "NVIDIA", "NPTEL", "Coursera" |
| type | e.g. "MOOCs", "GPU training" |
| is_canonical | boolean — true for the 11 poster-listed providers; false for Admin-added "Other" entries |
| active | boolean |

**`learning_tracks`** *(AI Learning Academy — 4 tracks)*
| Field | Notes |
|---|---|
| track_id | PK |
| name | e.g. "AI Foundation", "AI Engineering", "AI Computing", "Advanced AI" |
| description | Admin-authored |
| sort_order | display order |
| active | boolean |

**`learning_topics`** *(topics within each track — 6 per track, 24 total)*
| Field | Notes |
|---|---|
| topic_id | PK |
| track_id | FK → learning_tracks |
| name | e.g. "GPU Computing", "Prompt Engineering" |
| description | Admin-authored |
| recommended_providers | array of FK → learning_providers |
| point_category | references the scoring matrix activity name (e.g. "Complete Course", "Certification") |
| sort_order | display order within the track |
| active | boolean |

**`programme_types`** *(the 10 named recurring programme types; see Section 4B, file 01)*
| Field | Notes |
|---|---|
| programme_type_id | PK |
| name | e.g. "Tech Eves @ AI Centre", "GPU Hands-on Friday" |
| cadence_description | e.g. "Every Tuesday, 4:00–5:00 PM" |
| description | Admin-editable |
| point_category | references the scoring matrix activity name (e.g. "Attend Session", "Hands-on Lab") |
| active | boolean |

**`programme_instances`** *(scheduled occurrences of each programme type)*
| Field | Notes |
|---|---|
| instance_id | PK, UUID |
| programme_type_id | FK → programme_types |
| scheduled_at | timestamp |
| venue | text |
| event_session_id | FK → event_sessions (nullable — links to the QR session for attendance) |
| status | one of `DRAFT`, `PUBLISHED`, `CANCELLED` |
| created_at | |

**`fellowships`** *(academic-year cycle record for each fellowship programme)*
| Field | Notes |
|---|---|
| fellowship_id | PK |
| fellowship_type | enum: `STUDENT` or `RESEARCH` |
| academic_year | e.g. "2025–26" |
| application_open_at | timestamp (Student fellowship only) |
| application_close_at | timestamp (Student fellowship only) |
| status | one of `OPEN`, `CLOSED`, `SELECTION_DONE` |

**`fellowship_applications`** *(individual student applications and nominations; both tracks share this table via fellowship_type)*
| Field | Notes |
|---|---|
| application_id | PK, UUID |
| fellowship_id | FK → fellowships |
| fellowship_type | enum: `STUDENT` or `RESEARCH` — denormalised for fast filtering; must match parent fellowship |
| applicant_user_id | FK → users |
| nominated_by | FK → users (nullable; mentor who submitted Research Fellowship nomination) |
| domain_focus | text (Research Fellowship — domain/topic area) |
| gpu_requested | boolean |
| status | one of `PENDING`, `NOMINATED`, `SELECTED`, `NOT_SELECTED` |
| benefits_activated | boolean (Student Fellowship — set true on selection) |
| gpu_allocated | boolean (Research Fellowship) |
| publication_support | boolean (Research Fellowship) |
| created_at | |

> **Invariant:** A student can have at most one `STUDENT` application and one `RESEARCH` application per fellowship cycle (unique constraint on `fellowship_id + applicant_user_id + fellowship_type`).

**`award_categories`** *(pre-seeded with the 8 AI Excellence Award categories; feeds award_nominations)*
| Field | Notes |
|---|---|
| category_id | PK |
| name | e.g. "AI Student of the Year" |
| description | Admin-editable |
| metric_hint | text — hints at which passport metric to use for auto-pulling nominees (e.g. "total_points", "research_claim_count") |
| sort_order | display order |
| active | boolean |

> **Seed data:** The 8 categories from the poster must be pre-seeded at schema migration time: AI Student of the Year, AI Researcher of the Year, Best AI Project, Best AI Startup, Best AI Faculty Mentor, Best Industry Project, Most Active AI Learner, Best GPU Computing Project.

> **Relationship to existing tables:** `award_nominations` (already listed in Section 8.2) gains a FK `category_id → award_categories` to bind each nomination to a named category. The existing `fellowship_candidates` table (Section 8.2) remains and maps to the NVIDIA AI Student Fellowship track.

---

