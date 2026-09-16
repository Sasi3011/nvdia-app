# AI Digital Passport Platform — Roles & Responsibilities (Part 7 of 7)

> **Part 7 of 7 — Standalone Onboarding Reference**
> Companion files: ``01-overview-roles-navigation.md`` · ``02-page-specifications.md`` · ``03-workflows-and-data-model.md`` · ``04-api-business-rules-reference.md`` · ``05-design-system-and-operations.md`` · ``06-PROMPT-courses-and-proctoring.md``
> This file is a standalone onboarding reference for anyone new to a role. It consolidates every responsibility implied by files 01–06 and the Appendix A programme poster into one place. For full technical detail on any item, cross-reference the indicated file/section.

---

## Overview

| Role | Who | Shell |
|---|---|---|
| **Admin** | Platform operators / NVIDIA AI Centre staff | Admin shell (`/admin/*`) |
| **Mentor / Faculty** | Faculty members reviewing evidence and mentoring students | Mentor shell (`/mentor/*`) |
| **Student** | Any onboarded ``@sece.ac.in`` user | Student/Passport shell (`/dashboard`, module pages) |

A user may hold multiple roles simultaneously and switch between shells without logging out. All role checks are enforced server-side on every API request — role assignment in the UI is a display convenience only.

---

## 1. Admin

Admins operate the platform end-to-end. They configure the system, run and publish programme content, manage the verification ecosystem, and run annual recognition cycles.

### 1.1 Platform Configuration
- Configure and update the **scoring matrix** (point values per activity) and **level thresholds** without a code deploy — via `/admin/scoring` (Page 31). Every change is written to `audit_logs`.
- Configure the **Learning Platform Ecosystem provider list** — promote "Other" providers to the canonical list as needed (requires a DB migration + enum update; see Section 19.3 of file 06).
- Manage **user accounts**: create, search, assign/change roles, manually adjust point balances with a mandatory audit reason — via `/admin/users` (Page 30).
- Manage **system health monitoring**: the Admin Dashboard (Page 27) surfaces API/DB/cache/S3 status.
- Oversee **data retention** and **audit log review** via `/admin/logs` (Page 34).

### 1.2 Curriculum & Content Management
- **AI Learning Academy** (Page 35, `/admin/academy`):
  - Create, edit, archive **learning tracks** and **learning topics**.
  - Assign recommended learning providers (from the canonical 11-provider list) to each topic.
  - Map each topic to its scoring matrix point category.
  - Reorder tracks and topics.
- **Assigned Courses** (file 06, Section 19):
  - Create course records — the only role authorised to use the ``OTHER`` provider escape hatch.
  - Set course level gates (`level_required`).
  - Archive obsolete courses (soft-delete; historical claims are preserved).
- **Industry Problem Bank** (Page 29, `/admin/problems`):
  - Create, publish, and archive problem statements.
  - Set level requirements per problem (minimum Level 3 for access).

### 1.3 Programme Management
- **Programme Calendar** (Page 36, `/admin/programmes`):
  - Create instances of any of the 10 named programme types (Tech Eves, GPU Hands-on Friday, AI Masterclass, AI Project Mela, AI Mini Challenge, AI Buildathon, Sri Eshwar NVIDIA AI Grand Challenge, Problem of the Month, AI Research Friday, AI Industry Connect).
  - Set date, time, venue, and link each instance to a QR session.
  - Cancel live instances (which also stops the linked QR session).
  - Edit programme type descriptions and cadence notes (cadence changes require explicit confirmation since they appear in student-facing UI).
- **Event & QR Management** (Page 28, `/admin/events`):
  - Create live events and start/stop TOTP-backed QR sessions (15-second rotation).
  - Monitor live attendance counts.
  - Each token is bound to a specific event and time window (SEC-08).

### 1.4 Verification & Review Oversight
- View all claims across all students and mentors (read access to the full mentor queue).
- Manually override claim status with a mandatory audit reason (point-correction use case).
- Monitor claim statistics via Reports & Analytics (Page 32, `/admin/reports`): pending/approved/rejected counts, turnaround times.

### 1.5 Competitions & Hackathon Administration
- Create Programme Calendar instances for each hackathon tier (AI Mini Challenge quarterly, AI Buildathon semester-wise, Sri Eshwar NVIDIA AI Grand Challenge annually).
- Publish problem statements for Problem of the Month.
- Review and approve Hackathon Prize claims (or delegate to a Mentor reviewer).

### 1.6 Fellowship Management (Page 37, ``/admin/fellowships``)
- **NVIDIA AI Student Fellowship:**
  - Open and close the annual application window (sets `application_open_at` / `application_close_at` in `fellowships`).
  - Review applicant eligibility indicators (level, points, claim breakdown — pulled live from passport data).
  - Select the annual cohort (20–30 students); mark others as Not Selected.
  - Activate benefits on selection: GPU credit allocation (auditable), mentor assignment, funding and training access.
  - Export the selected cohort roster.
- **AI Research Fellowship:**
  - Review faculty-submitted nominations.
  - Select nominees; activate GPU allocation and publication/patent support flags.
  - Track research outcomes (publications, patents) linked to ``activity_claims``.
- The two fellowship tracks are kept strictly separate via ``fellowship_type`` = ``STUDENT`` or ``RESEARCH``. Do not merge cohorts.

### 1.7 Annual Recognition (Page 33 + 38)
- Trigger (or review the scheduled run of) the **Annual Audit** — evaluates cumulative passport data across all students.
- Manage the **8 AI Excellence Award categories** via `/admin/awards` (Page 38):
  - AI Student of the Year
  - AI Researcher of the Year
  - Best AI Project
  - Best AI Startup
  - Best AI Faculty Mentor
  - Best Industry Project
  - Most Active AI Learner
  - Best GPU Computing Project
- Add/edit nominees per category; select winners; publish results to the public-facing Leaderboard & Awards page (Page 13). Publishing is irreversible per annual cycle.
- Persist historical audit and award results permanently.
- Export full rosters (CSV) for institutional records.

---

## 2. Mentor / Faculty

Mentors are the platform's primary verification and guidance layer. They review student evidence, advance startup stages, and (in some cases) submit fellowship nominations.

### 2.1 Claim Review & Verification
- Work through the **Mentor Review Queue** (Page 24, `/mentor/queue`) — a paginated, filterable list of all ``PENDING`` async claims (PDF certificates, GitHub links, DOI links).
- Open a Claim Review Detail (Page 25, `/mentor/queue/[id]`):
  - **Approve**: claim moves to ``APPROVED``, points engine runs, student is notified.
  - **Reject**: mandatory feedback text required; claim moves to ``REJECTED``, student is notified with the feedback; claim remains available for revision and resubmission.
- Mentor identity and review timestamp are recorded on every decision (auditability, SEC-09).
- Never approve a claim without reviewing the actual evidence (PDF/link).
- Concurrent approvals of the same claim by two mentors must not double-award points — the backend enforces idempotency.

### 2.2 Curriculum Support
- **Assign courses** to students (file 06, Section 19.4):
  - Create course records using the constrained provider enum (11 canonical providers — Mentors cannot use the ``OTHER`` escape hatch).
  - Assign specific courses to individual students with optional due dates.
  - Monitor assignment completion status in the course assignment dashboard.
- Recommend learning topics from the **AI Learning Academy** (Page 20) to students based on their career/research goals.

### 2.3 Startup Milestone Review (Page 26, ``/mentor/startups``)
- Review startup stage-advancement evidence submitted by students.
- Approve or reject stage transitions (Stage 1–6: Idea → Prototype → GPU Validation → MVP → Industry Pilot → AI Startup) with mandatory feedback on rejection.
- Exact evidence requirements per stage are an open decision (Section 16.5, file 05) — apply the same approve/reject-with-feedback pattern used for regular claims.

### 2.4 Fellowship Nominations
- **AI Research Fellowship:** Submit nominations for eligible students (typically Level 5+) via the fellowship management interface.
- Provide domain focus, GPU allocation requirements, and supervising faculty information for each nomination.
- Track the nominated student's research outcomes (publications, patents) and link evidence to the platform as ``activity_claims``.

### 2.5 General Responsibilities
- Maintain timely review of the claim queue — pending claims should not sit unreviewed indefinitely (queue management is a platform usability requirement, Section 14.3 of SRS).
- Provide constructive, actionable feedback on rejected claims so students can resubmit effectively.
- Attend and contribute to **AI Research Friday** (every 2 months) and **AI Industry Connect** (quarterly) as subject-matter guides.

---

## 3. Student

Students are the primary users of the platform. Their goal is to build a verified AI passport by earning points through real activities, progressing through 6 levels, and becoming eligible for fellowships and awards.

### 3.1 Profile & Onboarding
- Complete the onboarding flow (Page 2, `/onboarding`) on first login: submit Register Number, Department, Cohort Year.
- Account is created at **Level 1 (AI Explorer), 0 points, 0 GPU credits** (BR-02).
- A unique **Passport ID** (format: ``SE-AI-[cohort_year]-[NNN]``) is generated at onboarding and visible on the passport card.
- Keep profile information accurate; core identity fields (email, register number) are locked after onboarding.

### 3.2 Point Earning — Activity Categories
Students earn points by participating in real activities and submitting verified evidence:

| Activity | Points | How to Claim |
|---|---|---|
| Attend Session | +10 | QR scan at the event (auto-approved) |
| Hands-on Lab | +30 | QR scan at GPU Hands-on Friday or lab session |
| Complete Course | +50 | Upload certificate PDF or submit link (mentor review) |
| Certification | +100 | Upload certification PDF (mentor review) |
| Mini Project | +100 | Upload project evidence (mentor review) |
| Hackathon Participation | +100 | Upload participation proof (mentor review) |
| Hackathon Prize | +250 | Upload prize/award certificate (mentor review) |
| Industry Project | +250 | Upload project outcome evidence (mentor review) |
| Research Paper | +300 | Upload DOI/journal link (mentor review) |
| Patent | +300 | Upload filing proof (mentor review) |

### 3.3 Verification Flow
- **Live events (QR path):** Open `/scan` (Page 17), scan the event's displayed QR code → instant approval, no mentor review needed.
- **Async evidence (mentor path):** Go to `/claims/new` (Page 14), select the activity category, upload proof (PDF, GitHub link, or DOI link) → claim enters ``PENDING`` queue → Mentor reviews and approves/rejects → student notified.
- Rejected claims: read mentor feedback in `/claims` (Page 15) and resubmit with corrected evidence.
- Only approved claims generate points (BR-03).

### 3.4 Passport Progression & Level Unlocks
- Progress through **6 levels** as total verified points accumulate:

| Level | Title | Threshold | Unlocks |
|---|---|---|---|
| 1 | AI Explorer | < 1,000 pts (starts at 0) | Basic Centre Access |
| 2 | AI Practitioner | ≥ 1,000 pts | Advanced Labs Access |
| 3 | AI Builder | ≥ 2,000 pts | GPU Project Credits; Industry Problem Bank access |
| 4 | AI Innovator | ≥ 3,000 pts | Innovation Opportunities |
| 5 | AI Researcher | ≥ 5,000 pts | Research GPU Cluster |
| 6 | AI Champion | ≥ 5,000 pts + High Impact | Fellowship & Industry Perks |

- Level-up is automatic — the backend recalculates level on every point transaction.
- Locked module tiles on the dashboard show the exact level and points needed to unlock.

### 3.5 Attending Programmes
- Browse the **Programme Calendar** (Page 21, `/programmes`) to discover all upcoming instances of the 10 named programme types.
- Attend and scan QR codes to record attendance and earn points.
- Track past attendance history within the Programme Calendar page.

### 3.6 AI Learning Academy
- Browse the **AI Learning Academy** (Page 20, `/academy`) to explore the 4 learning tracks and their 24 topics.
- Use the Academy as a guided roadmap for which courses/certifications to pursue on the 11 approved external platforms.
- Click any topic → pre-fills a claim submission for that category.
- Track completion status per topic (derived from approved claims — no separate toggle).

### 3.7 Assigned Courses
- View courses assigned by a Mentor or Admin in the Certifications module (`/certifications`), highlighted with a priority badge and optional due date.
- Complete the course on the external platform, then submit a completion claim (PDF certificate or link).
- Self-initiated learning is also valid — students may claim any course from the approved provider list even if not formally assigned.

### 3.8 Startup Launchpad
- Create and track a startup project through 6 sequential stages (Page 12, `/startup`):
  1. Idea → 2. Prototype → 3. GPU Validation → 4. MVP → 5. Industry Pilot → 6. AI Startup
- Submit milestone evidence at each stage to request advancement — a Mentor reviews and approves/rejects the stage transition.

### 3.9 Industry Problem Bank
- Access unlocked at **Level 3 (AI Builder)** (FR-PROB-01, BR-07).
- Browse real industry problem statements (Page 11, `/problems`); express interest or submit solution claims.
- AI Industry Connect (quarterly programme) surfaces new industry problems — attend to earn session points and discover new problems.

### 3.10 Research
- Submit research outputs via the Research module (Page 10, `/research`):
  - Research Paper (DOI link) → +300 pts on approval.
  - Patent filing proof → +300 pts on approval.
- Attend **AI Research Friday** (every 2 months) → +10 pts per session.
- At Level 5, become eligible for **Research GPU Cluster** access.

### 3.11 Fellowships
- Track eligibility and apply for fellowships via the Fellowships page (Page 22, `/fellowships`):
  - **NVIDIA AI Student Fellowship:** Self-apply during the annual application window set by Admin. Top 20–30 students are selected.
  - **AI Research Fellowship:** Faculty-nominated only — students cannot self-apply. Stay engaged with mentors and research activities to increase nomination likelihood.
- Both fellowships are shown in distinct sections; a student may hold both simultaneously.

### 3.12 Annual Recognition
- Top students are recognised at the **Annual Celebration Night** across 8 AI Excellence Award categories.
- Award nominees and winners are published on the Leaderboard & Awards page (Page 13, `/leaderboard`).
- Students receive in-app notifications when fellowship results or award outcomes are published.

---

*This file is the authoritative onboarding reference for all three roles. For technical API details, data schemas, and security rules, refer to the indicated companion files. Last updated: 2026-09-15 (Appendix A reconciliation).*
