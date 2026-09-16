import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client shared by apps/web (build-time only, since the
 * frontend is statically exported) and apps/api (runtime queries).
 *
 * Guards against exhausting DB connections from Next.js dev-mode hot
 * reload, which would otherwise instantiate a new PrismaClient per reload.
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
