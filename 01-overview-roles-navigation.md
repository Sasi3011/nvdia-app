> **Part 1 of 7 — Overview, Tech Stack, Roles & Navigation**
> Companion files: `02-page-specifications.md` · `03-workflows-and-data-model.md` · `04-api-business-rules-reference.md` · `05-design-system-and-operations.md` · `06-PROMPT-courses-and-proctoring.md` · `07-roles-and-responsibilities.md`
> Read all 7 files before building — they form one specification split for readability.

# AI Digital Passport Platform — Web Application Documentation
### (Build Specification for AI-Assisted Development — Phase 1: Web Portal)

**System:** NVIDIA-AI-PASSPORT-2026
**Organization:** NVIDIA AI Supercomputing & Competency Centre @ Sri Eshwar Engineering College
**Document Purpose:** This is a complete, standalone functional and technical specification for building the **web application** first. A mobile app (Flutter) will be built later from the same backend/API, so all business logic must live server-side, not in the web frontend.

> **Note to the AI builder:** This document is derived from the project's engineering SRS (v6.0) and reorganized page-by-page and workflow-by-workflow specifically for implementation. Every rule, threshold, and value below is a real product requirement — do not alter point values, level thresholds, or role gates without explicit instruction. Where the original requirements left something undefined, it is explicitly flagged in **Section 16 (Open Decisions)** — treat those as configuration to confirm with the product owner, not as something to silently invent. For visual implementation, follow **Section 18 (UI/UX Design System)** exactly — it defines the color tokens, typography, layout, and component patterns to use on every page in Section 6; do not substitute generic component-library defaults.

---

## 1. Project Summary

The AI Digital Passport Platform is a **gamified educational lifecycle and competency-tracking system**. It gives every student a persistent digital "passport" that tracks their participation, learning evidence, project work, research, industry engagement, and startup progress, and automatically converts verified activity into points, levels, and unlocked privileges.

Core loop:
1. Student does something (attends a session, completes a certification, wins a hackathon, publishes research, etc.).
2. The activity is verified — either instantly via a live QR scan, or asynchronously by a mentor reviewing uploaded proof.
3. Verified activity awards points from a fixed scoring matrix.
4. Points accumulate into a **Level** (1–6), which unlocks new privileges (lab access, GPU credits, Problem Bank access, fellowship eligibility).
5. An annual audit reviews all passports and nominates top students for fellowships/awards.

---

## 2. Technology Stack (Web Phase)

| Layer | Technology |
|---|---|
| Web frontend | Next.js / React |
| Backend | REST API (HTTPS/TLS 1.3) — framework-agnostic, but must be modular/microservices-ready |
| Primary database | PostgreSQL (authoritative system of record) |
| Cache | Redis (sessions, leaderboard — **cache only, never the source of truth for points**) |
| File/object storage | AWS S3 (proof documents — private buckets only) |
| Authentication | Google OAuth 2.0 / Institutional SSO, restricted to the `@sece.ac.in` domain |
| Notifications | Push notification provider — **not yet selected, see Section 16** |

Architectural principles the AI builder must follow throughout:
- **All business rules (points, level-ups, access gates) are enforced on the backend.** The frontend may hide/disable UI for locked features, but this is a UX convenience only — every API endpoint independently re-validates auth, role, and level.
- PostgreSQL is the source of truth. Redis is disposable and must be rebuildable from PostgreSQL at any time.
- Files are never stored in the database — only their S3 object keys/metadata are.
- Critical state transitions (point allocation, level-up, claim approval) must be transactional and auditable.
- Keep scoring rules and level thresholds **data-driven** (configurable in the database/admin panel), not hard-coded in frontend or backend logic.

---

## 3. User Roles

| Role | Who | Can do |
|---|---|---|
| **Student** | Any onboarded `@sece.ac.in` user | View own passport, submit claims/evidence, scan live-event QR, browse eligible modules (level-gated), track startup project, view leaderboard |
| **Faculty / Mentor** | Staff reviewing evidence | Review assigned/queued claims, approve or reject with feedback, evaluate startup milestones |
| **System Admin** | Platform operators | Manage live events & QR sessions, manage Problem Bank content, manage users/roles, configure scoring/levels, run/view annual audits, view analytics, view audit logs |

**Authorization principle:** Authorization is enforced at the API boundary, never trusted from the client. Every protected endpoint must re-check: (1) is the user authenticated, (2) does their role permit this action, (3) does their level/privilege permit this resource.

---

## 4. Global Navigation & Layout Rules

- **Header/Passport bar** (student view): always visible once logged in — shows name, current level badge, total points, GPU credit balance.
- **Nine-Grid Navigation**: the student dashboard's main navigation is a 3x3 (or responsive equivalent) grid of module tiles: **Sessions, Certifications, Labs, Projects, Hackathons, Research, Industry Problems, Startup Launchpad, Leaderboard/Awards**. Locked tiles (below required level) must be visibly disabled/greyed and show the level required to unlock, rather than being hidden — this helps motivate progression (per Usability requirements).
- **Role-based shell**: Students see the Passport shell; Mentors see a Mentor shell (queue-centric); Admins see an Admin shell (management-centric). A user with multiple roles should be able to switch between shells.
- **Empty/locked states matter**: every gated page must have a clear "Requires Level N" or "No items yet" state — this is a named requirement (Usability, Section 14.1 of the SRS), not just a nicety.
- **Full visual system:** colors, typography, layout grid, component patterns, motion, and accessibility baseline are all specified in **Section 18 — UI/UX Design System**. Apply it consistently across every page below rather than defaulting to a generic component-library look.

---

## 4A. Learning Platform Ecosystem — Canonical Provider List

The following 11 platforms are the **approved external learning providers** for this platform. They appear as the constrained enumeration for:
- Course/certification claim submissions (Certifications module — Pages 5–6).
- The `provider` field in the Assigned Courses feature (see `06-PROMPT-courses-and-proctoring.md`).
- Display in the AI Learning Academy (`/academy`) as the source platforms for each track's topics.

| # | Provider | Type |
|---|---|---|
| 1 | NVIDIA | GPU/AI platform training |
| 2 | NPTEL | MOOCs (IIT/IISc) |
| 3 | Coursera | MOOCs |
| 4 | AWS | Cloud/ML training |
| 5 | Microsoft Learn | Cloud/AI training |
| 6 | Google Cloud | Cloud/AI training |
| 7 | Cisco | Networking/AI |
| 8 | GitHub | Developer/DevOps skills |
| 9 | Kaggle | Data science / ML competitions |
| 10 | Hugging Face | LLMs / Generative AI |
| 11 | LeetCode | Coding / algorithms |

> **Extensibility:** Admins may add providers not on this list using an "Other (specify)" escape hatch available only in the Admin interface. New providers added this way become candidates for promotion to the canonical list on the next spec review. The list above is the hard-coded default seed; the `learning_providers` table (see `03-workflows-and-data-model.md` Section 8) should make this configurable without a code deploy.

---

## 4B. Programme Calendar — Named Recurring Programme Types

The platform tracks **8 named recurring programme types** sourced from the official NVIDIA AI Supercomputing & Competency Centre programme poster. These are not generic "events" — they are first-class programme categories with fixed cadences, point-earning opportunities, and dedicated UI surfaces.

Admin creates **instances** of these programme types (specific dates/venues). Students attend instances and earn "Attend Session" points (+10) via the QR scan flow.

| # | Programme Name | Cadence | Description |
|---|---|---|---|
| 1 | Tech Eves @ AI Centre | Every Tuesday, 4:00–5:00 PM | Technical talks on emerging AI & GPU topics |
| 2 | GPU Hands-on Friday | Every Friday | GPU labs, training, optimisation & performance analysis (earns Hands-on Lab +30 points) |
| 3 | AI Masterclass | Monthly | Top experts. Deep insights. Future-ready knowledge. |
| 4 | AI Project Mela | Annual | Annual showcase — Imagine. Build. Demonstrate. Multiple categories. (earns Mini Project +100 for demonstrated projects) |
| 5 | AI Mini Challenge | Quarterly | Tier-1 hackathon |
| 6 | AI Buildathon | Semester-wise (twice/year) | Tier-2 hackathon |
| 7 | Sri Eshwar NVIDIA AI Grand Challenge | Annual | Tier-3 flagship hackathon |
| 8 | Problem of the Month | Monthly | Real-world problems. Badges. Recognition. GPU Credits. |
| 9 | AI Research Friday | Every 2 months (on the 30th) | Research presentations, GPU utilisation results, papers & patents, knowledge sharing |
| 10 | AI Industry Connect | Every Quarter | Industry presents problems; students and faculty present solutions |

> **Point mapping:** Programmes 1, 3, 9, 10 → Attend Session (+10). Programme 2 → Hands-on Lab (+30). Programmes 5–7 are Hackathon tiers (Hackathon Participation +100 / Hackathon Prize +250). Programme 8 → Industry Project (+250) or Mini Project (+100) depending on outcome. Programme 4 → Mini Project (+100) for demonstrated projects.

> **Admin note:** Programmes 5–7 form the **AI Hackathon Calendar** — three tiers at different cadences. All three use the standard hackathon claim/verification flow.

---

## 5. Complete Page Directory

| # | Page | Suggested Route | Role(s) |
|---|---|---|---|
| 1 | Login | `/login` | Public |
| 2 | Onboarding (first-time profile setup) | `/onboarding` | New student |
| 3 | Access Denied (non-institutional email) | `/access-denied` | Public |
| 4 | Student Dashboard (AI Digital Passport) | `/dashboard` | Student |
| 5 | Sessions | `/sessions` | Student |
| 6 | Certifications | `/certifications` | Student |
| 7 | Labs | `/labs` | Student |
| 8 | Projects | `/projects` | Student |
| 9 | Hackathons | `/hackathons` | Student |
| 10 | Research | `/research` | Student |
| 11 | Industry Problem Bank | `/problems` | Student (Level 3+) |
| 12 | Startup Launchpad | `/startup` | Student |
| 13 | Leaderboard & Awards | `/leaderboard` | Student (all), visible to all roles |
| 14 | Submit Claim / Evidence | `/claims/new` | Student |
| 15 | My Claims (status & history) | `/claims` | Student |
| 16 | Claim Detail | `/claims/[id]` | Student (own), Mentor/Admin (assigned) |
| 17 | Live Event QR Scan | `/scan` | Student |
| 18 | Profile & Settings | `/profile` | Student |
| 19 | Notifications | `/notifications` | Student, Mentor, Admin |
| **20** | **AI Learning Academy** | `/academy` | **Student** |
| **21** | **Programme Calendar** | `/programmes` | **Student** |
| **22** | **Fellowships** | `/fellowships` | **Student** |
| 23 | Mentor Dashboard | `/mentor` | Mentor |
| 24 | Mentor Review Queue | `/mentor/queue` | Mentor |
| 25 | Mentor Claim Review Detail | `/mentor/queue/[id]` | Mentor |
| 26 | Startup Milestone Review | `/mentor/startups` | Mentor |
| 27 | Admin Dashboard / Analytics | `/admin` | Admin |
| 28 | Event & QR Management | `/admin/events` | Admin |
| 29 | Problem Bank Management | `/admin/problems` | Admin |
| 30 | User & Role Management | `/admin/users` | Admin |
| 31 | Scoring & Level Configuration | `/admin/scoring` | Admin |
| 32 | Reports & Analytics Export | `/admin/reports` | Admin |
| 33 | Annual Audit & Awards | `/admin/audit` | Admin |
| 34 | Audit Log Viewer | `/admin/logs` | Admin |
| **35** | **Learning Academy Management** | `/admin/academy` | **Admin** |
| **36** | **Programme Calendar Management** | `/admin/programmes` | **Admin** |
| **37** | **Fellowship Management** | `/admin/fellowships` | **Admin** |
| **38** | **Award Category & Nomination Management** | `/admin/awards` | **Admin** |

> **Renumbering note (2026-09-15):** Pages 20–22 (Academy, Programmes, Fellowships) and 35–38 (new Admin pages) are new additions from the Appendix A reconciliation. As a result, the former Mentor pages (previously 20–23) are now 23–26, and former Admin pages (previously 24–31) are now 27–34. All internal cross-references in files 02–05 have been updated accordingly. The route paths (`/mentor`, `/admin`, etc.) are unchanged.

---
