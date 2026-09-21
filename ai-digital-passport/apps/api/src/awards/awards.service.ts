import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { NominationStatus, prisma } from "@ai-digital-passport/database";
import { UserRole } from "@ai-digital-passport/shared-types";
import { AuditLogService } from "../common/audit-log/audit-log.service";
import type { RequestUser } from "../common/auth/types";
import { AWARD_CATALOG } from "./awards.catalog";

@Injectable()
export class AwardsService {
  constructor(private readonly auditLogService: AuditLogService) {}

  // Idempotent: makes sure the 8 official awards exist without touching other rows.
  async ensureCatalog() {
    for (const a of AWARD_CATALOG) {
      await prisma.award.upsert({ where: { name: a.name }, create: { name: a.name, description: a.description }, update: {} });
    }
  }

  async list(userId: string) {
    await this.ensureCatalog();
    const names = AWARD_CATALOG.map((a) => a.name as string);
    const awards = await prisma.award.findMany({ where: { name: { in: names } } });
    const mine = await prisma.awardNomination.findMany({ where: { requested_by: userId } });
    return AWARD_CATALOG.map((c, i) => {
      const award = awards.find((a) => a.name === c.name)!;
      const requests = mine.filter((m) => m.award_id === award.award_id);
      return {
        awardId: award.award_id,
        name: c.name as string,
        description: award.description ?? c.description,
        audience: c.audience as string,
        order: i + 1,
        myRequests: requests.map((r) => ({
          nominationId: r.nomination_id,
          status: r.status,
          reason: r.reason,
          adminNote: r.admin_note,
          createdAt: r.created_at,
        })),
      };
    });
  }

  async request(user: RequestUser, input: { awardId: string; reason: string; nomineeEmail?: string }) {
    await this.ensureCatalog();
    const award = await prisma.award.findUnique({ where: { award_id: input.awardId } });
    const catalog = AWARD_CATALOG.find((c) => c.name === award?.name);
    if (!award || !catalog) throw new NotFoundException({ code: "AWARD_NOT_FOUND" });

    const isStaff = user.roles.includes(UserRole.MENTOR) || user.roles.includes(UserRole.ADMIN);
    let nomineeId = user.userId;
    if (input.nomineeEmail) {
      const nominee = await prisma.user.findUnique({ where: { email: input.nomineeEmail.toLowerCase() } });
      if (!nominee) throw new BadRequestException({ code: "NOMINEE_NOT_FOUND", message: "No registered user with that email." });
      nomineeId = nominee.user_id;
    } else if (catalog.audience === "STAFF" && !isStaff) {
      throw new ForbiddenException({ code: "STAFF_AWARD", message: "Enter the email of the mentor you are nominating." });
    }

    const open = await prisma.awardNomination.findFirst({
      where: { award_id: award.award_id, requested_by: user.userId, nominee_id: nomineeId, status: NominationStatus.NOMINATED },
    });
    if (open) {
      throw new BadRequestException({ code: "REQUEST_ALREADY_OPEN", message: "You already have a pending request for this award." });
    }

    const row = await prisma.awardNomination.create({
      data: { award_id: award.award_id, nominee_id: nomineeId, requested_by: user.userId, reason: input.reason, status: NominationStatus.NOMINATED },
    });
    await this.auditLogService.record({ actorId: user.userId, action: "AWARD_REQUESTED", entityType: "award_nomination", entityId: row.nomination_id });
    return { nominationId: row.nomination_id, status: row.status };
  }

  async adminList() {
    await this.ensureCatalog();
    const rows = await prisma.awardNomination.findMany({
      where: { requested_by: { not: null } },
      orderBy: { created_at: "desc" },
      include: { award: true, nominee: true },
    });
    const requesterIds = [...new Set(rows.map((r) => r.requested_by as string))];
    const requesters = await prisma.user.findMany({ where: { user_id: { in: requesterIds } } });
    return rows.map((r) => {
      const requester = requesters.find((u) => u.user_id === r.requested_by);
      return {
        nominationId: r.nomination_id,
        awardId: r.award_id,
        awardName: r.award.name,
        status: r.status,
        reason: r.reason,
        adminNote: r.admin_note,
        createdAt: r.created_at,
        requester: { userId: requester?.user_id ?? "", fullName: requester?.full_name ?? "Unknown", email: requester?.email ?? "" },
        nominee: { userId: r.nominee.user_id, fullName: r.nominee.full_name, email: r.nominee.email },
      };
    });
  }

  async review(actor: RequestUser, nominationId: string, status: "CONFIRMED" | "DECLINED", note?: string) {
    const row = await prisma.awardNomination.findUnique({ where: { nomination_id: nominationId } });
    if (!row) throw new NotFoundException({ code: "REQUEST_NOT_FOUND" });
    const updated = await prisma.awardNomination.update({
      where: { nomination_id: nominationId },
      data: { status: NominationStatus[status], admin_note: note ?? null },
    });
    await this.auditLogService.record({ actorId: actor.userId, action: `AWARD_REQUEST_${status}`, entityType: "award_nomination", entityId: nominationId });
    return { nominationId, status: updated.status };
  }
}
