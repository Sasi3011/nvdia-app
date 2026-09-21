import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@ai-digital-passport/database";
import { AuditLogService } from "../common/audit-log/audit-log.service";

export type WhitelistRole = "STUDENT" | "MENTOR" | "ADMIN";
export type WhitelistStatus = "AUTHORIZED" | "SUSPENDED";

export interface WhitelistInput {
  email: string;
  fullName?: string;
  role?: WhitelistRole;
  department?: string;
  year?: string;
  source?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

function guessName(email: string) {
  return (email.split("@")[0] || "User")
    .replace(/[._-]/g, " ")
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
    .join(" ")
    .trim();
}

function dto(e: {
  email: string;
  full_name: string | null;
  role: string;
  department: string;
  year: string | null;
  status: string;
  source: string;
  added_at: Date;
  last_login_at: Date | null;
}) {
  return {
    email: e.email,
    fullName: e.full_name,
    role: e.role as WhitelistRole,
    department: e.department,
    year: e.year,
    status: e.status as WhitelistStatus,
    source: e.source,
    addedAt: e.added_at,
    lastLoginAt: e.last_login_at,
  };
}

@Injectable()
export class WhitelistService {
  constructor(private readonly auditLogService: AuditLogService) {}

  /** Sign-in gate: the email must be on the list and not suspended. */
  async check(email: string): Promise<{ ok: boolean; reason?: string; role?: WhitelistRole; fullName?: string | null }> {
    const normalized = normalizeEmail(email);
    const entry = await prisma.accessWhitelist.findUnique({ where: { email: normalized } });
    if (!entry) {
      return {
        ok: false,
        reason: `Access Denied: "${normalized}" is not on the authorized access list. Please contact the administrator to grant access.`,
      };
    }
    if (entry.status === "SUSPENDED") {
      return { ok: false, reason: `Access Suspended: portal access for "${normalized}" has been deactivated by the administrator.` };
    }
    return { ok: true, role: entry.role as WhitelistRole, fullName: entry.full_name };
  }

  async touchLogin(email: string) {
    await prisma.accessWhitelist.updateMany({ where: { email: normalizeEmail(email) }, data: { last_login_at: new Date() } });
  }

  async roleFor(email: string): Promise<WhitelistRole> {
    const entry = await prisma.accessWhitelist.findUnique({ where: { email: normalizeEmail(email) }, select: { role: true } });
    return (entry?.role as WhitelistRole | undefined) ?? "STUDENT";
  }

  async list(filter: { search?: string; role?: string; status?: string }) {
    const q = filter.search?.trim();
    const rows = await prisma.accessWhitelist.findMany({
      where: {
        role: filter.role && filter.role !== "ALL" ? filter.role : undefined,
        status: filter.status && filter.status !== "ALL" ? filter.status : undefined,
        OR: q
          ? [
              { email: { contains: q, mode: "insensitive" } },
              { full_name: { contains: q, mode: "insensitive" } },
              { department: { contains: q, mode: "insensitive" } },
              { source: { contains: q, mode: "insensitive" } },
            ]
          : undefined,
      },
      orderBy: [{ added_at: "desc" }, { email: "asc" }],
    });
    return rows.map(dto);
  }

  async summary() {
    const grouped = await prisma.accessWhitelist.groupBy({ by: ["role", "status"], _count: { _all: true } });
    const count = (pred: (g: { role: string; status: string }) => boolean) =>
      grouped.filter(pred).reduce((n, g) => n + g._count._all, 0);
    return {
      total: count(() => true),
      students: count((g) => g.role === "STUDENT"),
      mentors: count((g) => g.role === "MENTOR"),
      admins: count((g) => g.role === "ADMIN"),
      suspended: count((g) => g.status === "SUSPENDED"),
    };
  }

  private async assertNotLastAdmin(email: string) {
    const target = await prisma.accessWhitelist.findUnique({ where: { email } });
    if (target?.role === "ADMIN" && target.status === "AUTHORIZED") {
      const others = await prisma.accessWhitelist.count({ where: { role: "ADMIN", status: "AUTHORIZED", NOT: { email } } });
      if (others === 0) {
        throw new BadRequestException({ code: "LAST_ADMIN", message: "At least one authorized admin must remain." });
      }
    }
  }

  /** Keeps an existing account's role in line with the list (a person has exactly the role assigned here). */
  private async syncUserRole(email: string, role: WhitelistRole) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;
    const roleRow = await prisma.role.findUnique({ where: { name: role } });
    if (!roleRow) return;
    await prisma.$transaction([
      prisma.userRole.deleteMany({ where: { user_id: user.user_id, NOT: { role_id: roleRow.role_id } } }),
      prisma.userRole.upsert({
        where: { user_id_role_id: { user_id: user.user_id, role_id: roleRow.role_id } },
        update: {},
        create: { user_id: user.user_id, role_id: roleRow.role_id },
      }),
    ]);
  }

  async upsertMany(
    actor: { userId: string; email: string },
    rows: WhitelistInput[],
    defaults: { role?: WhitelistRole; department?: string; source?: string } = {},
  ) {
    let added = 0;
    let updated = 0;
    let invalid = 0;
    const seen = new Set<string>();

    for (const row of rows) {
      const email = normalizeEmail(row.email ?? "");
      if (!EMAIL_RE.test(email)) {
        invalid++;
        continue;
      }
      if (seen.has(email)) continue;
      seen.add(email);

      const existing = await prisma.accessWhitelist.findUnique({ where: { email } });
      const role = row.role ?? defaults.role ?? (existing?.role as WhitelistRole | undefined) ?? "STUDENT";

      if (existing && existing.role === "ADMIN" && role !== "ADMIN") {
        if (email === normalizeEmail(actor.email)) {
          throw new BadRequestException({ code: "SELF_DEMOTION", message: "You cannot remove your own admin role." });
        }
        await this.assertNotLastAdmin(email);
      }

      const department = row.department?.trim() || defaults.department?.trim() || existing?.department || "";
      const source = row.source?.trim() || defaults.source?.trim() || existing?.source || "Manual Admin Entry";
      const fullName = row.fullName?.trim() || existing?.full_name || guessName(email);
      const year = row.year?.trim() || existing?.year || null;

      if (existing) {
        await prisma.accessWhitelist.update({
          where: { email },
          data: { full_name: fullName, role, department, year, source, status: "AUTHORIZED" },
        });
        updated++;
      } else {
        await prisma.accessWhitelist.create({
          data: { email, full_name: fullName, role, department, year, source, status: "AUTHORIZED", added_by: actor.userId },
        });
        added++;
      }
      await this.syncUserRole(email, role);
    }

    await this.auditLogService.record({
      actorId: actor.userId,
      action: "ACCESS_WHITELIST_UPDATED",
      entityType: "access_whitelist",
      metadata: { added, updated, invalid },
    });
    return { addedCount: added, updatedCount: updated, invalidCount: invalid, totalProcessed: rows.length };
  }

  async setStatus(actor: { userId: string; email: string }, rawEmail: string, status: WhitelistStatus) {
    const email = normalizeEmail(rawEmail);
    const existing = await prisma.accessWhitelist.findUnique({ where: { email } });
    if (!existing) throw new NotFoundException({ code: "WHITELIST_ENTRY_NOT_FOUND" });
    if (status === "SUSPENDED") {
      if (email === normalizeEmail(actor.email)) {
        throw new BadRequestException({ code: "SELF_SUSPEND", message: "You cannot suspend your own access." });
      }
      await this.assertNotLastAdmin(email);
    }
    const row = await prisma.accessWhitelist.update({ where: { email }, data: { status } });
    await this.auditLogService.record({
      actorId: actor.userId,
      action: status === "SUSPENDED" ? "ACCESS_SUSPENDED" : "ACCESS_GRANTED",
      entityType: "access_whitelist",
      entityId: email,
    });
    return dto(row);
  }

  async remove(actor: { userId: string; email: string }, rawEmail: string) {
    const email = normalizeEmail(rawEmail);
    const existing = await prisma.accessWhitelist.findUnique({ where: { email } });
    if (!existing) throw new NotFoundException({ code: "WHITELIST_ENTRY_NOT_FOUND" });
    if (email === normalizeEmail(actor.email)) {
      throw new BadRequestException({ code: "SELF_REMOVE", message: "You cannot remove your own access." });
    }
    await this.assertNotLastAdmin(email);
    await prisma.accessWhitelist.delete({ where: { email } });
    await this.auditLogService.record({ actorId: actor.userId, action: "ACCESS_REMOVED", entityType: "access_whitelist", entityId: email });
  }
}
