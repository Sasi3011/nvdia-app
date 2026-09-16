# AI Digital Passport

Monorepo scaffold for NVIDIA AI Supercomputing & Competency Centre @ Sri
Eshwar Engineering College: a statically-exportable Next.js frontend
(`apps/web`, later wrapped by Capacitor for Android/iOS), a NestJS REST
API backend (`apps/api`, deployed independently), and shared
Prisma/type/config packages.

> **Status:** Phases 1-3 are complete and verified end-to-end against real
> Postgres/Redis (scaffold, data model + backend API, and real Google OAuth
> auth). See the assistant's Phase 2/3 handoff messages for exactly what was
> built, tested, and assumed (Section 16 "Open Decisions" items are
> implemented as configurable data, not hard-coded guesses). Auth is real:
> `GET /auth/google` starts the OAuth flow, a signed JWT in an httpOnly
> cookie is the session (see `apps/api/src/auth/`), and
> `POST /auth/dev-login { email, fullName }` is a dev-only bypass (hard
> refuses outside development) for exercising the app without live Google
> credentials configured. Phase 4 (all Student-role pages) is also done —
> login/onboarding/access-denied, dashboard with the nine-grid, all 6
> activity modules, Problem Bank, Startup Launchpad, Leaderboard, claims
> (submit/list/detail), live QR scan (camera + manual fallback), profile,
> and notifications — styled to spec 05 Section 18's design system and
> wired to the real API. Phase 5 (Mentor pages) is also done — mentor
> dashboard, review queue (shared-pool, paginated/filterable), claim
> review detail with a real evidence viewer (presigned S3 download URLs —
> a gap from Phase 2 fixed here, see `GET
> /claims/:id/attachments/:attachmentId/download-url`), and startup
> milestone review — all on a new dark "operations console" shell
> (`ConsoleShell`, shared with Phase 6's Admin pages) distinct from the
> light Student shell. Verified: every route builds and serves in the
> static export, and the full mentor flow (queue → approve/reject → points
> awarded → notification sent, plus startup milestone → stage advancement)
> was re-checked live against the running backend using the frontend's
> exact request/response shapes. Phase 6 (Admin pages) is also done — all
> 8 admin pages (dashboard, event & live-QR management, problem bank,
> users & roles, scoring/level config, reports + CSV export, annual audit,
> audit log viewer), all on `ConsoleShell`. Fixed the same snake_case
> response inconsistency across every admin controller (events, scoring,
> problems, audit) while building these. Verified: the full admin→student
> QR loop end-to-end — admin creates an event/session, activates the QR,
> fetches the live TOTP code, a student scans that exact payload and gets
> checked in, attendance count updates — plus every other admin flow
> (problems CRUD, user search/role-assign/points-correction, scoring
> edits, reports, annual audit run + roster, audit log) against the real
> backend. All admin actions taken during testing showed up correctly in
> the audit log itself. No browser was available this session, so this is
> build + live-API-contract verified, not click-tested. Phase 7 (Capacitor)
> is also done for Android — `apps/web/android` is a real, committed native
> project that **actually compiles**: `gradlew assembleDebug` was run for
> real in this environment (Android SDK + JDK 21) and produced a working
> debug APK, including the native ML Kit QR scanner
> (`@capacitor-mlkit/barcode-scanning`) wired into the Scan page (native
> camera on-device, jsQR-in-webview fallback on plain web, manual entry
> always available — see `apps/web/app/scan/page.tsx`). `apps/web/ios` was
> also generated, but this machine is Windows — CocoaPods/Xcode don't
> exist here, so the iOS project has not been built; see "Mobile
> (Capacitor)" below for the exact commands to run on a Mac. Phase 8 (OTA
> updates) is also done — self-hosted via `@capgo/capacitor-updater`
> (open-source, no Capgo cloud account or subscription). The wire
> contract (`apps/api/src/ota/`) was reverse-verified from the plugin's
> own Android source rather than guessed from docs, and the whole publish
> pipeline was run for real end-to-end: `pnpm ota:publish` built the app,
> zipped it, computed a checksum, called the real backend, got a real
> presigned S3 URL, and made a genuine HTTPS PUT to AWS (which correctly
> rejected it — this repo has no real S3 bucket configured, which is the
> one piece that couldn't be tested here). See "OTA Updates" below for
> exactly which changes ship instantly vs. which still need a store
> release.

## Prerequisites

- Node.js >= 20
- pnpm 11.x (`corepack enable` will pick up the version pinned in
  `package.json`'s `packageManager` field)
- Docker (for local Postgres + Redis)

## 1. Start local infrastructure

```bash
docker compose --env-file .env -f infra/docker-compose.yml up -d
```

This starts Postgres (host port 5434 by default — see `POSTGRES_PORT` in
`.env.example` if that collides with a local install) and Redis (port
6379), with credentials from `.env` (copy `.env.example` to `.env` first,
see below).

## 2. Install dependencies

From the repo root (installs for every app/package via the pnpm workspace):

```bash
pnpm install
```

## 3. Configure environment variables

```bash
cp .env.example .env
pnpm env:sync
```

Fill in Google OAuth credentials, `SESSION_SECRET`, AWS S3 credentials, and
`ALLOWED_EMAIL_DOMAIN`. See the comments in `.env.example` for what each
variable is for and which app consumes it.

The root `.env` is the file you edit. `pnpm env:sync` copies it into
`apps/web/.env`, `apps/api/.env`, and `packages/database/.env` — Next.js and
the Prisma CLI only auto-load `.env` from the directory they run in, not
from the monorepo root. Re-run `pnpm env:sync` any time you change the root
`.env`.

## 4. Run database migrations + seed

```bash
pnpm db:migrate   # applies packages/database/prisma/schema.prisma
pnpm db:seed      # seeds the levels table + scoring matrix (placeholder data)
```

## 5. Run everything in dev mode

```bash
pnpm dev
```

This fans out via Turborepo to:

- `apps/web` — http://localhost:1001
- `apps/api` — http://localhost:1002 (try `GET /health`)

## Other useful scripts

| Command            | What it does                                      |
| ------------------ | -------------------------------------------------- |
| `pnpm build`        | Builds all apps/packages via Turborepo             |
| `pnpm lint`         | Lints all apps/packages                            |
| `pnpm typecheck`    | Type-checks all apps/packages                      |
| `pnpm test`         | Runs tests (no test suites yet)                    |
| `pnpm db:studio`    | Opens Prisma Studio against the local database     |

## Mobile (Capacitor)

`apps/web`'s static export (`out/`) is wrapped by Capacitor into real
Android/iOS shells — one frontend codebase, three targets (web, Android,
iOS).

### Android (buildable on Windows/macOS/Linux)

Prerequisites: Android SDK (set `ANDROID_HOME`), JDK 17-21 (JDK 25 is too
new for the bundled Android Gradle Plugin — this repo was built and
verified with JDK 21).

```bash
cd apps/web
pnpm cap:sync            # next build + copies the export into android/
pnpm cap:android:open    # opens the project in Android Studio, or:
pnpm cap:android:build   # builds app/build/outputs/apk/debug/app-debug.apk directly
pnpm cap:android:release # builds an AAB (app/build/outputs/bundle/release) — needs a signing config first
```

`android/local.properties` (gitignored, machine-specific) needs an
`sdk.dir` line pointing at your Android SDK. **Use forward slashes even on
Windows** (`sdk.dir=C:/Users/you/AppData/Local/Android/Sdk`) — this file
is parsed as a Java `.properties` file, where backslash is an escape
character. A Windows username starting with `u` (e.g. `ubend`) turns
`\u` + the next four characters into a broken unicode-escape parse
(`Malformed \uxxxx encoding`) if you use backslashes — a real, non-obvious
error this project hit while setting up the build.

`android/variables.gradle`'s `minSdkVersion` is 23 (not the Capacitor
template's default 22) — `@capgo/capacitor-updater` (Phase 8) transitively
pulls in `com.google.android.gms:play-services-tasks`, which requires 23;
the manifest merger fails below it.

### iOS (macOS + Xcode only)

`apps/web/ios/` already exists in this repo (generated by `cap add ios`),
but it cannot be built on Windows — `pod install` and `xcodebuild` both
require macOS. On a Mac, with Xcode and CocoaPods installed:

```bash
cd apps/web
pnpm cap:sync         # next build + copies the export into ios/
cd ios/App && pod install && cd ../..
pnpm cap:ios:open      # opens Xcode — build/archive/App Store submission from there
```

### Native QR camera (Page 17)

`apps/web/app/scan/page.tsx` picks the scanning method at runtime:
- **Native (Android/iOS app)** — `@capacitor-mlkit/barcode-scanning`'s
  `scan()`, Google Play Services' / Apple's own full-screen scanner UI.
  No camera permission needed in the app itself on Android (Play Services
  handles it); the plugin auto-installs its ML Kit module on first use if
  missing.
- **Plain web browser** — `getUserMedia` + `jsqr`, decoding frames off a
  hidden canvas.
- **Manual entry** — always available on every platform, per spec.

All three call the same `POST /events/:id/scan` contract.

## OTA Updates (Phase 8)

JS/HTML/CSS/asset changes can ship to already-installed apps instantly,
without an app store review — via
[`@capgo/capacitor-updater`](https://github.com/Cap-go/capacitor-updater),
self-hosted on our own backend (no Capgo cloud account, no subscription).

### The exact command to ship a live update

```bash
# from the repo root, with OTA_PUBLISH_API_KEY and API_BASE_URL set in .env
pnpm ota:publish --version 1.2.0 [--channel production] [--platform android|ios] [--notes "fix login bug"]
```

This one command: builds `apps/web` (`next build`), zips the static
export, computes a SHA-256 checksum, uploads the zip to the same private
S3 bucket used for claim evidence, and registers it as the new active
bundle for that app+platform+channel (deactivating whatever was active
before). Every installed app checks in with the backend on each
foreground transition (`capacitor.config.ts`'s `autoUpdate: "atBackground"`)
and applies the new bundle the next time it's backgrounded — never
interrupting an active session. Every publish is recorded in the Audit
Log (`OTA_BUNDLE_PUBLISHED`).

### Which changes ship via OTA, and which need a real store release

| Change | Path |
| --- | --- |
| Anything in `apps/web` — pages, components, styles, API calls, business-logic-adjacent UI | `pnpm ota:publish` — **instant, no review** |
| A new/updated native Capacitor plugin (e.g. a new permission-requiring plugin) | Store release (Phase 7's `cap:android:build` / `cap:ios:open` flow) |
| Android/iOS permissions, app icon, splash screen, anything under `android/` or `ios/` | Store release |
| `capacitor.config.ts` itself (appId, native plugin config) | Store release — it's baked into the compiled native shell, an OTA bundle can't change it |
| A Capacitor or plugin version bump | Store release |

This split isn't a workaround — it's explicitly permitted by both
platforms' guidelines (see the plugin's own README's "Store Guideline
Compliance" section, `node_modules/@capgo/capacitor-updater/README.md`):
Google Play's restriction on updating outside its mechanism doesn't apply
to code running in a webview, and Apple's Developer Agreement §3.3.2 has
allowed OTA JS/asset updates since 2015, as long as the update doesn't
change the app's fundamental purpose or bypass OS security features.

### How the update check works (the wire contract)

`apps/api/src/ota/` implements the exact request/response contract the
native plugin's `updateUrl` config point at
(`capacitor.config.ts` → `plugins.CapacitorUpdater.updateUrl`) — reverse-
verified from the plugin's own Android source
(`CapgoUpdater.java`'s `createInfoObject()`/`getLatest()`), not guessed
from marketing docs:

- The app `POST`s a flat JSON body (`platform`, `app_id`, `version_name`
  — the currently-active bundle version — plus device metadata we
  ignore) to `POST /ota/check`.
- The server looks up the active `OtaBundle` row for that
  app+platform+channel. If its version differs from what the device
  reports, it responds `{ version, url, checksum }` with a 1-hour
  presigned S3 GET URL; otherwise `{ version, message: "No new version
  available" }`.
- `apps/web/components/OtaBootstrap.tsx` calls `notifyAppReady()` on
  every native launch — **this is not optional**: skipping it makes the
  native layer assume the bundle failed to load and auto-roll-back to
  the previous version after 10 seconds, even when nothing is wrong.

### Testing this without a real S3 bucket

`pnpm ota:publish` was run for real against the local dev backend during
development — it got all the way through build → zip → checksum →
presign → a genuine HTTPS PUT to AWS, which correctly rejected it because
the bucket in that test didn't exist. Everything up to "does a real S3
bucket accept the upload" is verified; you'll need `AWS_S3_BUCKET` (plus
real credentials) set in `.env` for a real publish to succeed.

## Repo layout

```
apps/
  web/                 Next.js frontend (App Router, static export)
  api/                 NestJS backend (REST API, deployed independently)
packages/
  database/            Prisma schema + generated client (singleton export)
  shared-types/        Enums, DTOs, zod schemas shared by web + api
  config/              Shared tsconfig/eslint/prettier config
infra/
  docker-compose.yml   Local Postgres + Redis for development
```

## Notes on the stack

- **Frontend** is Next.js (App Router) configured for static export
  (`output: "export"`) so the same build is wrapped by Capacitor for
  Android/iOS (see "Mobile (Capacitor)" above) and deployable as a normal
  static website. Dynamic-ID pages (claim detail, mentor review detail)
  use query-param routes rather than `[id]` path segments, since static
  export can't pre-build arbitrary runtime IDs into path segments.
- **Backend** is NestJS — a fully separate REST API, never renders HTML,
  deployed independently from the frontend.
- **`packages/shared-types` and `packages/database` are compiled, not run
  from source.** Next.js can transpile workspace TypeScript on the fly via
  webpack, but NestJS's plain `node dist/main.js` runtime cannot — so both
  packages have a real `build` script (`tsc`) producing `dist/*.js`, and
  their `package.json` `main`/`types` point at that compiled output. Run
  `pnpm build` (or let Turborepo's `^build` dependency graph do it
  automatically before `dev`/`typecheck`) after changing either package.
- **Auth** (once implemented) will be Google OAuth via Passport.js in
  `apps/api`, restricted to `ALLOWED_EMAIL_DOMAIN`, issuing an httpOnly
  session cookie the frontend consumes — no tokens in `localStorage`.
- **Shared code** lives in `packages/` so both apps stay in sync on enums
  (claim status, proof type, roles, level names) and the Prisma
  schema/client.
