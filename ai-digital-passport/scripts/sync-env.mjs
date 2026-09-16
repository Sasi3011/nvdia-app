#!/usr/bin/env node
/**
 * Copies the root .env into each app/package that needs one.
 *
 * Next.js only auto-loads .env from the directory it's run in (each app's
 * own folder), and the Prisma CLI only auto-loads .env from the directory
 * containing prisma/schema.prisma's parent package — neither reads a
 * monorepo-root .env automatically. The root .env stays the single file a
 * developer edits; this script fans it out after `cp .env.example .env`.
 */
import { copyFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const rootEnv = join(rootDir, ".env");

if (!existsSync(rootEnv)) {
  console.error("No .env found at repo root. Run `cp .env.example .env` first.");
  process.exit(1);
}

const targets = ["apps/web/.env", "apps/api/.env", "packages/database/.env"];

for (const target of targets) {
  copyFileSync(rootEnv, join(rootDir, target));
  console.log(`Synced .env -> ${target}`);
}
