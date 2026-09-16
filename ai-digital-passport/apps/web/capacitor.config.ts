import type { CapacitorConfig } from "@capacitor/cli";

// The API base URL is baked in at native-build time (there's no server to
// read env vars from once this is a compiled app) — set
// NEXT_PUBLIC_API_BASE_URL to the real production API before running
// `pnpm cap:sync`/`cap:android:build`/`cap:ios:open` for a release build.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:1002";

const config: CapacitorConfig = {
  appId: "in.ac.sece.aidigitalpassport",
  appName: "AI Digital Passport",
  // Next.js's static export output (next.config.js output: "export").
  webDir: "out",
  server: {
    // Android emulator loopback to the host machine's localhost during
    // native dev. Point this at the real API_BASE_URL for release builds
    // via `npx cap sync` after changing NEXT_PUBLIC_API_BASE_URL and
    // rebuilding — the app calls the API directly over HTTPS in
    // production, this block only matters for local dev convenience.
    androidScheme: "https",
  },
  plugins: {
    // Phase 8 — self-hosted OTA updates (@capgo/capacitor-updater). See
    // apps/api/src/ota/ (the server side of this contract, reverse-verified
    // from the plugin's own Android source) and scripts/ota-publish.mjs
    // (the command that ships a new bundle).
    CapacitorUpdater: {
      // "atBackground" (the plugin's default meaning of `true`): check on
      // every foreground, download in the background, apply the next time
      // the app is backgrounded — never interrupts an active session.
      autoUpdate: "atBackground",
      // POST here — request/response contract implemented by
      // apps/api/src/ota/ota.controller.ts.
      updateUrl: `${API_BASE_URL}/ota/check`,
      // No stats collection endpoint of our own yet (open decision #10 —
      // out of scope) — disable rather than silently 404 against a path
      // that doesn't exist.
      statsUrl: "",
    },
  },
};

export default config;
