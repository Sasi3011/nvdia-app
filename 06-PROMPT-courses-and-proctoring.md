> **Part 6 of 7 — Assigned Courses & Proctoring Addendum**
> Companion files: ``01-overview-roles-navigation.md`` · ``02-page-specifications.md`` · ``03-workflows-and-data-model.md`` · ``04-api-business-rules-reference.md`` · ``05-design-system-and-operations.md`` · ``07-roles-and-responsibilities.md``
> This addendum extends the Certifications module (Pages 6 and 35) with structured course assignment and completion verification rules.

# AI Digital Passport Platform — Assigned Courses & Proctoring (Part 6 of 7)

## 19. Assigned Courses Feature

### 19.1 Purpose

Admins and Mentors can **assign specific courses** to individual students or cohort groups. Assigned courses appear in the student's Certifications module (``/certifications``) as a prioritised to-do list alongside self-discovered courses. Completion of an assigned course follows the standard claim/verification flow and awards the appropriate points from the scoring matrix (Section 11.1).

### 19.2 Course Data Schema

**``courses``**
| Field | Type / Constraint | Notes |
|---|---|---|
| course_id | PK, UUID | |
| title | text, NOT NULL | Course name |
| provider | enum — see Section 19.3 | The platform the course is hosted on |
| provider_other | text, nullable | Only populated when ``provider = 'OTHER'``; Admin must enter the actual provider name |
| url | text, nullable | Direct link to the course (optional but recommended) |
| description | text | Admin/Mentor-authored summary |
| point_category | text | References the scoring matrix activity name: ``Complete Course`` (+50) or ``Certification`` (+100) |
| level_required | integer 1–6, default 1 | Minimum passport level to be assigned / take this course |
| active | boolean, default true | Inactive courses are hidden from new assignments but historical completions are retained |
| created_by | FK → users | Admin or Mentor who created the course record |
| created_at | timestamp | |

**``course_assignments``**
| Field | Type / Constraint | Notes |
|---|---|---|
| assignment_id | PK, UUID | |
| course_id | FK → courses | |
| assignee_user_id | FK → users | The student this assignment targets |
| assigned_by | FK → users | Admin or Mentor who made the assignment |
| due_date | date, nullable | Optional deadline |
| status | enum | ``ASSIGNED``, ``IN_PROGRESS``, ``COMPLETED``, ``OVERDUE`` |
| claim_id | FK → activity_claims, nullable | Populated when the student submits a completion claim |
| created_at | timestamp | |
| completed_at | timestamp, nullable | Set when the linked claim reaches ``APPROVED`` status |

---

### 19.3 Provider Enumeration — Constrained to Learning Platform Ecosystem

The ``courses.provider`` field is **not free text**. It is constrained to the canonical Learning Platform Ecosystem list (Section 4A, ``01-overview-roles-navigation.md``) plus one escape hatch for Admin use:

| Enum Value | Display Name | Notes |
|---|---|---|
| ``NVIDIA`` | NVIDIA | GPU/AI platform training |
| ``NPTEL`` | NPTEL | MOOCs (IIT/IISc) |
| ``COURSERA`` | Coursera | MOOCs |
| ``AWS`` | AWS | Cloud/ML training |
| ``MICROSOFT_LEARN`` | Microsoft Learn | Cloud/AI training |
| ``GOOGLE_CLOUD`` | Google Cloud | Cloud/AI training |
| ``CISCO`` | Cisco | Networking/AI |
| ``GITHUB`` | GitHub | Developer/DevOps skills |
| ``KAGGLE`` | Kaggle | Data science / ML competitions |
| ``HUGGING_FACE`` | Hugging Face | LLMs / Generative AI |
| ``LEETCODE`` | LeetCode | Coding / algorithms |
| ``OTHER`` | Other (specify) | Admin-only escape hatch; requires ``provider_other`` text to be non-null |

**Rules for the ``OTHER`` escape hatch:**
- Only Admin (not Mentor) may select ``OTHER`` when creating a course record.
- When ``provider = OTHER``, ``provider_other`` is mandatory and must be non-empty.
- Courses with ``provider = OTHER`` are flagged in the Admin dashboard as candidates for promotion to the canonical enum list on the next spec review.
- The canonical enum list is seeded from ``learning_providers`` (Section 8.3, ``03-workflows-and-data-model.md``). Adding a new provider to ``learning_providers.is_canonical = true`` requires both a DB migration and an enum update.

---

### 19.4 Course Assignment Workflow

1. Admin or Mentor opens ``/admin/academy`` (Page 35) or the Mentor's course-assignment interface and creates or selects an existing course record.
2. They assign the course to a student (or group): creates rows in ``course_assignments`` with ``status = ASSIGNED``.
3. Student sees the assigned course in their Certifications module (``/certifications``) with a priority badge ("Assigned by [Mentor name]") and optional due date.
4. Student completes the course on the external platform, then submits a completion claim on ``/claims/new`` (proof type: ``PDF_FILE`` for certificate, or ``GITHUB_LINK`` / ``DOI_LINK`` for project-based completions).
5. Backend links the new claim to the ``course_assignments`` row (via ``claim_id`` FK) and sets ``status = IN_PROGRESS``.
6. Mentor reviews and approves the claim (standard async verification path, Workflow 7.3).
7. On approval: ``activity_claims.status → APPROVED``, points awarded per ``point_category``, ``course_assignments.status → COMPLETED``, ``completed_at`` set.
8. If a due date exists and the claim is not approved by then, the assignment status transitions to ``OVERDUE`` — the student is notified, no automatic penalty (points still awardable on late completion unless the product owner defines a late-submission penalty).

---

### 19.5 Proctoring & Completion Verification Rules

| Scenario | Proof Expected | Verification Path |
|---|---|---|
| Online course completion (NPTEL, Coursera, etc.) | Certificate PDF from the provider | Async mentor review (PDF_FILE) |
| Coding challenge / LeetCode / Kaggle | Screenshot or profile link | Async mentor review (GITHUB_LINK or PDF_FILE) |
| NVIDIA certification | Certificate PDF or NGC credential link | Async mentor review (PDF_FILE) |
| GitHub-based project course | Repository link | Async mentor review (GITHUB_LINK) |
| Research publication course credit | DOI / journal link | Async mentor review (DOI_LINK) |

**Proctoring constraints:**
- The platform does **not** do live remote proctoring of external courses — it verifies completion after the fact via evidence submission.
- Mentor reviews the submitted certificate/link for authenticity: correct student name, course title matching the assignment, completion date within a plausible window.
- Mentors may reject with feedback if the certificate appears tampered, mismatched, or from a non-approved provider.
- **Duplicate claim rule (open decision — Section 16.4):** whether a student can claim the same course twice is not yet defined. Implement a soft warning (not a hard block) if a student submits a claim for a course they have a previous ``APPROVED`` claim on.

---

### 19.6 API Surface — Courses

| Domain | Endpoint | Purpose |
|---|---|---|
| Courses | ``GET /courses`` | List available courses (Admin/Mentor — all; Student — assigned + browseable active list) |
| Courses | ``POST /courses`` | Create a new course record (Admin/Mentor) |
| Courses | ``PATCH /courses/:id`` | Edit course metadata (Admin/Mentor) |
| Courses | ``DELETE /courses/:id`` | Archive course (Admin only; soft-delete via ``active = false``) |
| Assignments | ``GET /courses/assignments`` | List assignments (scoped by role) |
| Assignments | ``POST /courses/assignments`` | Assign a course to a student (Admin/Mentor) |
| Assignments | ``PATCH /courses/assignments/:id`` | Update assignment status / due date |
| Providers | ``GET /courses/providers`` | Return the canonical provider list (drives the dropdown in course creation UI) |

**API rules specific to this feature:**
- ``POST /courses`` must validate that ``provider`` is one of the allowed enum values; ``OTHER`` requires ``provider_other`` to be non-empty.
- ``GET /courses`` for a Student must only return courses assigned to them + courses with ``level_required <= student.current_level``.
- Course creation and assignment are auditable actions (write to ``audit_logs``).

---

### 19.7 Business Rules — Assigned Courses

| ID | Rule |
|---|---|
| BR-COURSE-01 | ``courses.provider`` must be one of the 11 canonical enum values or ``OTHER`` with a non-null ``provider_other``. Free-text provider is not accepted. |
| BR-COURSE-02 | Only Admin may use the ``OTHER`` provider escape hatch. Mentors must pick from the 11 canonical values. |
| BR-COURSE-03 | Assigned course completion follows the standard async claim flow (Workflow 7.3) and awards points per Section 11.1. |
| BR-COURSE-04 | A course claim linked to an assignment must reference a valid, active ``course_assignments`` row for that student. |
| BR-COURSE-05 | Archiving a course (``active = false``) does not invalidate existing assignments or historical approved claims. |
| BR-COURSE-06 | Level gate: if a course has ``level_required = 3``, a Level-1 or Level-2 student cannot self-enroll (backend enforced), though an Admin/Mentor can still assign it to them (with a warning). |

---

### 19.8 Edge Cases

- **Provider not on the list:** Admin submits ``provider = OTHER`` without ``provider_other`` → API returns 400 with message: "Provider name is required when selecting 'Other'."
- **Assignment with no due date:** Treated as open-ended; ``OVERDUE`` status is never triggered.
- **Student claims a course they were never assigned:** Claim is still accepted (self-initiated learning is allowed); it is simply not linked to any ``course_assignments`` row. Points awarded on approval per normal.
- **Mentor assigned a course then leaves the platform:** The assignment remains active; ownership transfers to Admin for follow-up review.
