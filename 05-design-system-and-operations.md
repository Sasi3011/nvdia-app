> **Part 5 of 7 — Error Handling, Notifications, Open Decisions, Mobile Phase Notes & UI/UX Design System**
> Companion files: `01-overview-roles-navigation.md` · `02-page-specifications.md` · `03-workflows-and-data-model.md` · `04-api-business-rules-reference.md` · `06-PROMPT-courses-and-proctoring.md` · `07-roles-and-responsibilities.md`
> Section 18 in this file (the design system) governs the visual implementation of every page in Part 2.

# AI Digital Passport Platform — Operations & Design System (Part 5 of 7)

## 14. Error Handling Matrix

| Scenario | Expected Behavior |
|---|---|
| Non-institutional email | Reject with HTTP 403 + domain restriction message |
| Expired QR token | Reject scan, show "QR expired/invalid" |
| Invalid QR token | Reject claim, no points awarded |
| Rejected claim | Persist REJECTED + mentor feedback, notify student |
| Unauthorized role | Return authorization error, do not expose protected data |
| Level below required threshold | Block access, show required level |
| Invalid proof type | Reject submission with validation error |
| Duplicate attendance | Do not award duplicate points |
| Storage upload failure | Do not falsely mark claim verified; return actionable failure |
| Point allocation failure | Keep state consistent via transaction/retry handling |

---

## 15. Notifications

- Rejected claims → notify student with mentor feedback.
- Approved claims → student sees updated points/level state.
- Pending review work → optionally notify mentors.
- Annual fellowship/award results → optionally notify affected students.
- Notification delivery state should be trackable internally regardless of which external push provider is eventually wired in.

---

## 16. Open Decisions — Do Not Silently Assume These

These are gaps in the original requirements. The AI builder should implement them as **configurable** and flag them for product-owner decision rather than hard-coding an assumption:

1. **Level 6 "High Impact" criteria** — not numerically defined. Needs a measurable eligibility rule.
2. **GPU credit rules** — allocation, consumption, expiry, quota, and reversal rules for GPU credits (mentioned as a Level 3+ privilege) are unspecified.
3. **Mentor assignment model** — how a claim gets assigned to a specific mentor (shared pool vs. explicit assignment) is undefined.
4. **Duplicate activity claim rules** — whether a given activity can be claimed once ever, once per event, once per course, or once per project is unspecified.
5. **Startup stage transition rules** — who approves advancement between stages and what evidence is required is unspecified.
6. **Annual audit timing** — exact schedule/academic-year boundary for the annual run is unspecified.
7. **Notification provider** — push notification service has not been selected.
8. **Problem Bank content model** — full metadata/status schema for problem statements beyond "100 problems" is unspecified.
9. **Leaderboard rules** — ranking tie-break and visibility/privacy rules are unspecified.
10. **Data retention policy** — retention period for claims, proofs, logs, and awards is unspecified.

---

## 17. Notes for the Future Mobile App Phase

The web app should be built so the mobile app can reuse the exact same backend/API without change:
- Keep **all business logic server-side** (already required above) — the mobile client will just be another consumer of the same REST API.
- The Live Event QR Scan (Page 17) is the one page expected to be used far more heavily on mobile (camera-first); keep its API contract (`POST /events/:id/scan`) generic enough to serve both a web camera capture and a native mobile camera capture.
- Keep responses lean/paginated from the start (per API Design Rules) since mobile clients are more bandwidth/latency sensitive.

---

## 18. UI/UX Design System

This product is a **technical credentialing system**, not a consumer game. The audience is engineering students, faculty mentors, and lab administrators who already live in IDEs, terminals, and lab-monitoring dashboards. The visual language should read like a **serious instrumentation/control-room product** — closer to a GPU-cluster monitoring console or a conference-badge/credentialing platform than a mobile game with confetti and cartoon trophies. Gamification here means *precise progress tracking*, not playful decoration. Every design decision below is grounded in that brief and in the brand colors already established in the source SRS document, not generic SaaS defaults.

### 18.1 Design Principles

1. **Earned, not decorated.** Levels, badges, and points are the product's core trust signal — they represent real, mentor-verified work. Render them with restraint and precision (clean numerals, thin progress rings/bars, understated badge glyphs) rather than playful illustration. A student's Level 4 badge should look more like a certification mark than a game-app achievement sticker.
2. **Two distinct operating modes, one visual language.** The Student experience is card-forward and personal (their passport, their progress). The Mentor/Admin experience is dense and table-forward (queues, configuration, analytics). Both share the same color tokens, type scale, and component library — only density and layout shift.
3. **Data is content, not decoration.** Points, timestamps, IDs, and thresholds are read constantly and compared at a glance — treat them typographically as data (tabular figures, a monospace face for exact values) rather than styling them the same as prose.
4. **State is always visible.** Every claim, event, and level has a real status (`PENDING`/`APPROVED`/`REJECTED`, locked/unlocked, active/expired). Status must be legible from color **and** label together — never color alone — for accessibility.
5. **One accent, used with intent.** NVIDIA green is the platform's single "go/success/primary action" color. It appears on primary buttons, approvals, and level-up moments — not on every icon or border. Overusing it flattens its meaning.

### 18.2 Color System

Grounded directly in the brand colors already used in the official SRS document (not invented):

| Token | Hex | Role |
|---|---|---|
| `--color-ink` | `#141414` | Primary text on light surfaces, near-black |
| `--color-navy-900` | `#142D4B` | Deepest surface — admin shell background, sidebar |
| `--color-navy-700` | `#17365D` | Primary brand navy — headers, active nav state, primary headings |
| `--color-surface` | `#FFFFFF` | Card and content surfaces |
| `--color-surface-muted` | `#F4F6F8` | Page background (student shell), table row alternation |
| `--color-border` | `#C8D2DC` | Hairline borders, table dividers (matches the SRS table border tone) |
| `--color-text-muted` | `#5A5A5A` | Secondary text, captions, timestamps |
| `--color-accent` | `#76B900` | NVIDIA green — primary actions, "Approved," level-up, success states |
| `--color-accent-deep` | `#376E14` | Hover/pressed state for accent, and dark-mode-safe accent text |
| `--color-pending` | `#B98900` | Amber — `PENDING` status, warnings |
| `--color-rejected` | `#B3261E` | Red — `REJECTED` status, destructive actions, errors |

Usage rule: **navy is structural, green is active/success, amber is waiting, red is stop.** Do not introduce additional accent hues for decoration — every color in the interface should be answerable with "what does this status mean," not "what looked nice here."

Dark admin shell (Mentor/Admin) uses `--color-navy-900` as the base surface with white/`#F4F6F8` text, sidebar items in `--color-navy-700`, and the same accent/pending/rejected tokens for status — this reads as an "operations console," distinct from the lighter, personal Student shell.

### 18.3 Typography

| Role | Typeface | Notes |
|---|---|---|
| UI text / headings / body | **IBM Plex Sans** (or Inter as a fallback) | Clean, technical, legible at small sizes — fits an engineering-institute audience without feeling corporate-generic |
| Data values (points, IDs, timestamps, level thresholds, claim/test IDs) | **IBM Plex Mono** | Used specifically for numerals and identifiers so data is instantly scannable and visually distinct from prose — functional, not decorative |

Type scale (base 16px, 1.25 ratio):

| Style | Size | Weight | Use |
|---|---|---|---|
| Display | 32px | 600 | Passport level name, dashboard hero number |
| H1 | 24px | 600 | Page titles |
| H2 | 19px | 600 | Section headers within a page |
| Body | 16px | 400 | Default text |
| Small / caption | 13px | 400 | Timestamps, helper text, table meta |
| Data-mono | 16px (or 13px in tables) | 500 | Points, IDs, thresholds — set in IBM Plex Mono |

Keep line length under ~80 characters for body copy (claim descriptions, mentor feedback text). Avoid tracked-out all-caps labels — use sentence case with color/weight for emphasis instead (e.g., a status chip, not an uppercase eyebrow).

### 18.4 Layout & Spacing

- **Spacing scale:** 4px base unit — 4, 8, 12, 16, 24, 32, 48, 64. Card padding = 24px; section gaps = 32–48px.
- **Grid:** 12-column responsive grid, max content width 1280px on admin/mentor screens (data-dense), 960px on student screens (focused, personal).
- **Breakpoints:** mobile ≤ 640px, tablet 641–1024px, desktop > 1024px. Nine-grid navigation collapses from 3×3 → 2×N → single column as width decreases.
- **Radius:** one consistent radius scale — 8px for cards/inputs, 4px for chips/badges, 999px (pill) only for status chips. Do not mix arbitrary radii across components.
- **Elevation:** flat design with hairline borders (`--color-border`) as the primary separator; use shadow only for floating/overlay elements (modals, dropdowns) — not under every card, which is the generic "SaaS card kit" look this product should avoid.

### 18.5 Shell Layouts (ASCII wireframes)

**Student shell — card-forward, single focus:**
```
┌─────────────────────────────────────────────┐
│  [Logo]      AI Digital Passport      [Bell] [Avatar] │
├─────────────────────────────────────────────┤
│  ┌───────────────────────────────────────┐  │
│  │  PASSPORT CARD                         │  │
│  │  Name · Dept · Cohort                  │  │
│  │  Level 3 — AI Builder  [progress bar]  │  │
│  │  2,340 pts     GPU credits: 120        │  │
│  └───────────────────────────────────────┘  │
│                                               │
│  ┌────┐ ┌────┐ ┌────┐                        │
│  │Sess│ │Cert│ │Labs│   ← nine-grid,          │
│  ├────┤ ├────┤ ├────┤     locked tiles show   │
│  │Proj│ │Hack│ │Rsch│     "Requires Level N"  │
│  ├────┤ ├────┤ ├────┤                        │
│  │Prob│ │Strt│ │Lead│                        │
│  └────┘ └────┘ └────┘                        │
└─────────────────────────────────────────────┘
```

**Mentor / Admin shell — sidebar + dense table, operations-console feel:**
```
┌───────────┬───────────────────────────────────┐
│ (navy bg) │  Queue: Pending Claims (24)   [⌕]  │
│  Dashboard│ ─────────────────────────────────  │
│  Queue    │  Student      Category   Submitted │
│  Startups │  A. Rao       Hackathon  2h ago  › │
│  Events   │  S. Iyer      Research   5h ago  › │
│  Problems │  ...                                │
│  Users    │                                     │
│  Scoring  │  [status chips: PENDING/APPROVED/   │
│  Reports  │   REJECTED use color + label]       │
│  Audit    │                                     │
└───────────┴───────────────────────────────────┘
```

### 18.6 Core Components

- **Status chip** — pill shape, `--color-pending` / `--color-accent` / `--color-rejected` background at 12% opacity with full-strength text of the same hue, plus the word (`Pending`, `Approved`, `Rejected`) — never color-only.
- **Level badge** — a small, precise ring/arc progress indicator around the level number (not a cartoon medal), with the level title in Plex Sans and the point count in Plex Mono beside it.
- **Nine-grid tile** — icon + label; locked state uses reduced opacity (~40%), a small lock glyph, and a caption "Requires Level 3" rather than hiding the tile.
- **Data table** (mentor queue, admin lists) — zebra striping using `--color-surface-muted`, monospace for IDs/timestamps/points columns, sticky header, row-level action on the right edge, pagination controls below (never infinite unbounded lists per the API pagination rule in Section 9).
- **Evidence viewer** (claim review) — PDF/GitHub/DOI preview pane on one side, approve/reject actions with a **required** feedback field on reject (the field should be disabled/highlighted as required, not just optional-looking).
- **Empty state** — icon + one direct sentence in the interface's voice ("No claims yet — submit evidence from any module to get started"), never a bare blank area.
- **Buttons** — one primary style (filled, `--color-accent`) per screen; everything else is secondary (outline) or tertiary (text link). Never more than one primary action visible at once.

### 18.7 Motion

Use motion only to confirm a result of a user action, not for decoration:
- Level-up: a single, deliberate progress-bar fill + number count-up on the dashboard when a threshold is crossed — this is the one moment worth an orchestrated animation, since it's the emotional payoff of the whole product.
- QR scan success/failure: an immediate, brief inline confirmation (checkmark or error icon) — no full-screen takeover.
- Everything else (hovers, page transitions, card entrances) should be fast (~150ms) and functional, not scroll-triggered fade-ins on every element.

### 18.8 Accessibility Baseline

- All status information conveyed by color must also be conveyed by text/label (colorblind-safe).
- Visible keyboard focus states on every interactive element, especially in the mentor review queue (heavily keyboard-driven for fast triage).
- Minimum contrast ratio 4.5:1 for body text against its background in both the light Student shell and the dark Admin shell.
- Respect `prefers-reduced-motion` — disable the level-up count-up animation and swap in an instant state change.
- Touch targets ≥ 44px for anything used during live-event QR scanning (students will be scanning quickly, often standing).

### 18.9 Voice & Content Guidance

- **Active voice, plain language.** "Submit evidence" not "Initiate claim submission process." A button labeled "Approve" produces a status that says "Approved" — the vocabulary never shifts between the action and its result.
- **Errors state what happened and what to do**, in the system's voice: "This QR code has expired. Ask the event host to refresh it." — not a generic "Something went wrong."
- **Empty states are an invitation to act**, not a dead end: every empty list names the exact next action available (e.g., "No startup project yet — create one to begin Stage 1: Idea").
- **Locked-content messaging is motivational, not just restrictive**: "Reach Level 3 (2,000 pts) to unlock the Industry Problem Bank" rather than a bare "Access Denied," reinforcing the progression loop even when blocking access.

---

*End of document. This specification consolidates and reorganizes NVIDIA-AI-PASSPORT-2026 SRS v6.0 into a page-by-page, workflow-by-workflow build reference, including a complete UI/UX design system. All point values, level thresholds, role gates, status enumerations, and color/type tokens above are exact values from the approved baseline and established brand, and must not be altered without explicit product-owner sign-off.*
