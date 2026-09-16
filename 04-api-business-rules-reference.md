> **Part 4 of 7 — API Reference, Business Rules, Enumerations, Security & NFRs**
> Companion files: `01-overview-roles-navigation.md` · `02-page-specifications.md` · `03-workflows-and-data-model.md` · `05-design-system-and-operations.md` · `06-PROMPT-courses-and-proctoring.md` · `07-roles-and-responsibilities.md`
> This is the authoritative reference for exact values (points, thresholds, statuses) and API shape used throughout Parts 2 and 3.

# AI Digital Passport Platform — API & Rules Reference (Part 4 of 7)

## 9. API Reference

The source spec doesn't mandate exact endpoint names — this is the recommended organization; the AI builder should finalize exact paths/payloads but keep this domain grouping and behavior:

| Domain | Endpoints | Purpose |
|---|---|---|
| Auth | `GET/POST /auth/*` | SSO callback, session creation, user identity |
| Users | `GET /me`, `PATCH /me` | Current profile |
| Passport | `GET /passport` | Aggregated dashboard payload |
| Activities | `GET/POST /activities` | Activity discovery + claim submission |
| Claims | `GET /claims`, `GET /claims/:id` | Student claim status/history |
| Mentor | `GET /mentor/claims`, `POST /mentor/claims/:id/approve` (+ reject) | Review workflow |
| QR | `POST /events/:id/scan` | Validate live-event QR attendance |
| Points | `GET /me/points` | Point balance and history |
| Levels | `GET /levels` | Level thresholds and privileges |
| Problems | `GET /problems` | Level-gated Problem Bank |
| Startup | `GET/POST /startup/projects` | Startup project lifecycle |
| Admin | `/admin/*` | Events, scoring rules, problems, users, analytics |
| Audit | `GET /admin/audit/*` | Administrative audit data |

**API design rules (apply to every endpoint):**
- Consistent HTTP status codes; never leak internal DB errors to the client.
- Validate all request bodies and query params server-side.
- Return stable, machine-readable error codes (for frontend to branch on, not just display raw text).
- Every endpoint re-checks role and level — never trust the frontend.
- Any endpoint that awards points must be **idempotent** (safe to retry without double-awarding).
- Paginate large collections: claims, problems, leaderboard.

---

## 10. Business Rules Master List

| ID | Rule |
|---|---|
| BR-01 | Only `@sece.ac.in` accounts may authenticate. |
| BR-02 | First-time eligible users start at Level 1 with 0 points. |
| BR-03 | Only approved activity claims may generate points. |
| BR-04 | Live event claims are approved after valid dynamic QR verification. |
| BR-05 | Expired dynamic QR tokens must not award points. |
| BR-06 | Async evidence requires mentor review before points are awarded. |
| BR-07 | Problem Bank access requires Level 3 or higher. |
| BR-08 | Level status is determined by cumulative verified points and, for Level 6, the (yet-to-be-defined) impact condition. |
| BR-09 | Startup projects follow the six-stage pipeline. |
| BR-10 | Annual fellowship/award selection uses the annual audit output. |
| BR-11 | Role and level restrictions must be enforced on the backend. |
| BR-12 | Point allocation must be traceable to an approved activity/claim. |

---

## 11. Points, Levels & Enumerations Reference

### 11.1 Scoring Matrix (fixed point values)

Source of truth: the official programme poster (NVIDIA AI Supercomputing & Competency Centre @ Sri Eshwar). One row per activity — do not bundle categories.

| Activity | Points | Notes |
|---|---|---|
| Attend Session | +10 | Any live programme session (Tech Eves, AI Masterclass, AI Research Friday, AI Industry Connect, etc.) |
| Hands-on Lab | +30 | GPU Hands-on Friday, GPU lab workshops |
| Complete Course | +50 | Any approved course on the Learning Platform Ecosystem |
| Certification | +100 | Any certification from the Learning Platform Ecosystem |
| Mini Project | +100 | Supervised mini project submission |
| Hackathon Participation | +100 | Registered and participated (any tier) |
| Hackathon Prize | +250 | Prize/award at any hackathon tier |
| Industry Project | +250 | Completed industry-sourced problem/project |
| Research Paper | +300 | Accepted/published research paper |
| Patent | +300 | Filed patent |

> **Note:** The previous spec bundled some of the above into combined rows (e.g., "Certification / Mini Project / Hackathon" at +100, "Industry Project / Hackathon Win" at +250, "Research Paper / Patent Filing" at +300). All point values are identical — only the granularity has changed to match the poster's official Gamified Point System table exactly.

### 11.2 Level & Privilege Matrix
| Level | Title | Threshold | Privilege |
|---|---|---|---|
| 1 | AI Explorer | < 1,000 points | Basic Centre Access |
| 2 | AI Practitioner | ≥ 1,000 points | Advanced Labs Access |
| 3 | AI Builder | ≥ 2,000 points | GPU Project Credits |
| 4 | AI Innovator | ≥ 3,000 points | Innovation Opportunities |
| 5 | AI Researcher | ≥ 5,000 points | Research GPU Cluster |
| 6 | AI Champion | ≥ 5,000 points **+ High Impact** | Fellowship & Industry Perks |

> **PO-confirmed (2026-09-15) — Level 1 threshold:** The programme poster's marketing artwork shows "500 points" as an illustrative example balance on a sample passport card, and its summary strip reads "500+ Points → AI Explorer." This is **not** a threshold change. Level 1 remains `< 1,000 points`, beginning at 0 points upon onboarding (BR-02). Do not alter this value without explicit product-owner sign-off.

> **PO-confirmed (2026-09-15) — Level 5 vs Level 6:** The poster's right-side summary strip omits AI Researcher (Level 5) as a separate marker, jumping from AI Innovator (3,000+) directly to AI Champion (5,000+). This is a poster layout constraint (ran out of space), not a structural change. Both Level 5 (AI Researcher, ≥ 5,000) and Level 6 (AI Champion, ≥ 5,000 + High Impact condition) remain as distinct levels in this spec.

⚠️ **Level 6's "High Impact" condition is not numerically defined anywhere in the source requirements.** Build the level-evaluation logic so this condition is a pluggable/configurable rule (see Section 16), not a hard-coded guess.

Level evaluation order: always check from the **highest** eligibility condition down to the lowest, every time a point transaction posts.

### 11.3 Startup Launchpad Stages
| Stage | Name |
|---|---|
| 1 | Idea |
| 2 | Prototype |
| 3 | GPU Validation |
| 4 | MVP |
| 5 | Industry Pilot |
| 6 | AI Startup |

### 11.4 Claim Status Enumeration
`PENDING` (awaiting mentor review) → `APPROVED` (verified, points eligible) or `REJECTED` (with mentor feedback).

### 11.5 Proof Type Enumeration
`TOTP_QR` (live-event attendance), `PDF_FILE` (uploaded certificate/document), `GITHUB_LINK` (project/source repo), `DOI_LINK` (research publication).

---

## 12. Security Requirements

| ID | Requirement |
|---|---|
| SEC-01 | All client-server traffic uses TLS 1.3. |
| SEC-02 | No user passwords stored — auth is fully delegated to SSO. |
| SEC-03 | Sensitive stored data uses AES-256 encryption. |
| SEC-04 | Institution-domain validation enforced at backend/API boundary. |
| SEC-05 | Role checks enforced server-side. |
| SEC-06 | Level-gated resources protected server-side. |
| SEC-07 | Proof documents stored in controlled/private object storage. |
| SEC-08 | QR validation rejects expired tokens. |
| SEC-09 | Critical administrative and verification actions are auditable. |
| SEC-10 | APIs apply rate limiting and input validation. |

**QR-specific controls:** bind token to event/session; enforce active time window; prevent duplicate attendance by the same student; reject expired/invalid tokens; rate-limit repeated scan attempts; ensure idempotent point allocation.

**File-specific controls:** private buckets only; validate file type/size; store keys/metadata (never trust arbitrary public URLs); authorize downloads through the app; consider malware scanning before mentor review.

---

## 13. Non-Functional Requirements

| ID | Category | Target |
|---|---|---|
| NFR-PERF-01 | Performance | Normal API response < 200 ms |
| NFR-PERF-02 | Performance | QR validation + point crediting < 1.5 s |
| NFR-AVAIL-01 | Availability | ≥ 99.5% during active academic semesters |
| NFR-SCALE-01 | Scalability | Up to 1,000 concurrent QR scan requests |
| NFR-SEC-01/02 | Security | TLS 1.3 transport / AES-256 storage |
| NFR-MAINT-01 | Maintainability | Modular, microservices-ready architecture |
| NFR-PORT-01 | Portability | Business logic separable from infra providers |

Usability requirements: passport navigation must be understandable to first-time students; QR scanning should require minimal interaction; locked modules must clearly state the required level; mentor queues must clearly expose claim status and evidence.

Reliability requirements: critical point updates are transactional; duplicate submissions never create duplicate rewards; storage/notification failures never silently corrupt claim state; background jobs are retryable and idempotent.

---

