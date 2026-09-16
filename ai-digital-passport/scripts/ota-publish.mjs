#!/usr/bin/env node
/**
 * Ships a live OTA update to already-installed Android/iOS apps —
 * Phase 8, @capgo/capacitor-updater, self-hosted (apps/api/src/ota/).
 *
 * What this does NOT do: touch anything native. It rebuilds the Next.js
 * static export (apps/web/out/), zips it, uploads it to S3, and registers
 * it with the backend as the new active bundle for a channel. The next
 * time an installed app checks in (foreground/background per
 * capacitor.config.ts's `autoUpdate` setting), it downloads and applies
 * this bundle — no app store review, no reinstall.
 *
 * When you need a real store release instead (and this script can't help):
 *   - Any native code change: new/updated Capacitor plugin, changed
 *     Android/iOS permissions, app icon, splash screen, native config in
 *     android/ or ios/, or a Capacitor/plugin version bump.
 *   - Anything in capacitor.config.ts itself (appId, plugin native
 *     config) — that's baked into the compiled native shell, an OTA
 *     bundle can't change it.
 *   Those go through Phase 7's normal `cap:android:build`/`cap:ios:open`
 *   flow and the App Store / Play Store review process.
 *
 * Usage:
 *   pnpm ota:publish --version 1.2.0 [--channel production] [--platform android|ios] [--notes "fix login bug"]
 *
 * Requires OTA_PUBLISH_API_KEY and API_BASE_URL in the root .env (see
 * .env.example) — the same key apps/api's OtaApiKeyGuard checks.
 */
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import AdmZip from "adm-zip";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const webDir = join(rootDir, "apps/web");
const outDir = join(webDir, "out");
const zipPath = join(rootDir, "scripts/.ota-bundle.zip");

// Must match capacitor.config.ts's appId exactly.
const APP_ID = "in.ac.sece.aidigitalpassport";

function loadRootEnv() {
  const envPath = join(rootDir, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^"(.*)"$/, "$1");
    }
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { channel: "production", platforms: ["android", "ios"] };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--version") opts.version = args[++i];
    else if (arg === "--channel") opts.channel = args[++i];
    else if (arg === "--platform") opts.platforms = [args[++i]];
    else if (arg === "--notes") opts.notes = args[++i];
  }
  if (!opts.version) {
    console.error("Usage: pnpm ota:publish --version <semver> [--channel production] [--platform android|ios] [--notes \"...\"]");
    process.exit(1);
  }
  return opts;
}

async function main() {
  loadRootEnv();
  const opts = parseArgs();

  const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:1002";
  const apiKey = process.env.OTA_PUBLISH_API_KEY;
  if (!apiKey) {
    console.error("OTA_PUBLISH_API_KEY is not set — see .env.example. Refusing to publish without it.");
    process.exit(1);
  }

  console.log(`\n1. Building apps/web (next build → out/)…`);
  execSync("pnpm --filter @ai-digital-passport/web run build", { cwd: rootDir, stdio: "inherit" });

  if (!existsSync(outDir)) {
    console.error(`Build succeeded but ${outDir} doesn't exist — check next.config.js's output: "export" setting.`);
    process.exit(1);
  }

  console.log(`\n2. Zipping ${outDir} → ${zipPath}…`);
  const zip = new AdmZip();
  // Whole contents of out/, flattened at the zip root — per the plugin's
  // requirement that index.html live at the zip's top level, and no
  // hidden files (AdmZip's addLocalFolder does not add dotfiles by
  // default filter behavior here since Next's export doesn't emit any).
  zip.addLocalFolder(outDir);
  zip.writeZip(zipPath);
  const sizeBytes = statSync(zipPath).size;
  const checksum = createHash("sha256").update(readFileSync(zipPath)).digest("hex");
  console.log(`   ${(sizeBytes / 1024 / 1024).toFixed(2)} MB, sha256 ${checksum.slice(0, 12)}…`);

  for (const platform of opts.platforms) {
    console.log(`\n3. Publishing to ${platform}/${opts.channel} as version ${opts.version}…`);

    const presignRes = await fetch(`${apiBaseUrl}/admin/ota/presign`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ota-api-key": apiKey },
      body: JSON.stringify({
        appId: APP_ID,
        platform: platform.toUpperCase(),
        channel: opts.channel,
        version: opts.version,
        fileName: "dist.zip",
      }),
    });
    if (!presignRes.ok) {
      throw new Error(`Presign failed (${presignRes.status}): ${await presignRes.text()}`);
    }
    const { uploadUrl, s3Key } = await presignRes.json();

    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/zip" },
      body: readFileSync(zipPath),
    });
    if (!putRes.ok) {
      throw new Error(`Upload to S3 failed (${putRes.status}): ${await putRes.text()}`);
    }

    const publishRes = await fetch(`${apiBaseUrl}/admin/ota/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ota-api-key": apiKey },
      body: JSON.stringify({
        appId: APP_ID,
        platform: platform.toUpperCase(),
        channel: opts.channel,
        version: opts.version,
        s3Key,
        sizeBytes,
        checksum,
        notes: opts.notes,
      }),
    });
    if (!publishRes.ok) {
      throw new Error(`Publish failed (${publishRes.status}): ${await publishRes.text()}`);
    }
    console.log(`   ✔ ${platform} is now serving version ${opts.version} on channel "${opts.channel}"`);
  }

  console.log(`\nDone. Installed apps on the "${opts.channel}" channel will pick this up next time they check`);
  console.log(`(per capacitor.config.ts's autoUpdate: "atBackground" — on foreground, applied on next background).`);
}

main().catch((err) => {
  console.error("\nOTA publish failed:", err.message ?? err);
  process.exit(1);
});
