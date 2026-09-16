import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { prisma } from "@ai-digital-passport/database";
import type { Award, AwardNomination, FellowshipCandidate, User } from "@ai-digital-passport/database";
import { NominateAwardSchema, PaginationQuerySchema, RunAnnualAuditSchema, UserRole } from "@ai-digital-passport/shared-types";
import { z } from "zod";
import { AuditLogService } from "../common/audit-log/audit-log.service";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { Roles } from "../common/auth/roles.decorator";
import type { RequestUser } from "../common/auth/types";
import { pageSkipTake, toPaginatedResult } from "../common/pagination/pagination";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";

const CreateAwardSchema = z.object({ name: z.string().trim().min(1).max(200), description: z.string().trim().max(2000).optional() });

function candidateDto(c: FellowshipCandidate & { user: User }) {
  return {
    candidateId: c.candidate_id,
    rank: c.rank,
    totalPoints: c.total_points,
    notes: c.notes,
    user: { userId: c.user.user_id, fullName: c.user.full_name, email: c.user.email },
  };
}

function awardDto(a: Award) {
  return { awardId: a.award_id, name: a.name, description: a.description, createdAt: a.created_at };
}

function nominationDto(n: AwardNomination) {
  return { nominationId: n.nomination_id, awardId: n.award_id, nomineeId: n.nominee_id, status: n.status, createdAt: n.created_at };
}

// Annual Audit & Awards (Page 30) + Audit Log Viewer (Page 31), both under
// /admin/audit/* per spec 04's domain grouping. Admin-triggered (open
// decision #6) rather than cron-scheduled on a guessed academic-year
// boundary.
@Controller("admin/audit")
@Roles(UserRole.ADMIN)
export class AdminAuditController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Post("run")
  async run(
    @CurrentUser() actor: RequestUser,
    @Body(new ZodValidationPipe(RunAnnualAuditSchema)) body: ReturnType<typeof RunAnnualAuditSchema.parse>,
  ) {
    const topStudents = await prisma.user.findMany({
      orderBy: [{ total_points: "desc" }, { created_at: "asc" }],
      take: body.candidateCount,
    });

    const auditRun = await prisma.annualAuditRun.create({
      data: {
        triggered_by: actor.userId,
        academic_year: body.academicYear,
        candidate_count: topStudents.length,
        candidates: {
          create: topStudents.map((s, index) => ({
            user_id: s.user_id,
            rank: index + 1,
            total_points: s.total_points,
          })),
        },
      },
      include: { candidates: { include: { user: true }, orderBy: { rank: "asc" } } },
    });

    await this.auditLogService.record({
      actorId: actor.userId,
      action: "ANNUAL_AUDIT_RUN",
      entityType: "annual_audit_run",
      entityId: auditRun.audit_run_id,
      metadata: { academicYear: body.academicYear, candidateCount: topStudents.length },
    });

    return {
      auditRunId: auditRun.audit_run_id,
      academicYear: auditRun.academic_year,
      candidateCount: auditRun.candidate_count,
      runAt: auditRun.run_at,
      candidates: auditRun.candidates.map(candidateDto),
    };
  }

  @Get("runs")
  async listRuns() {
    const runs = await prisma.annualAuditRun.findMany({ orderBy: { run_at: "desc" } });
    return runs.map((r) => ({
      auditRunId: r.audit_run_id,
      academicYear: r.academic_year,
      candidateCount: r.candidate_count,
      runAt: r.run_at,
    }));
  }

  @Get("runs/:id")
  async runDetail(@Param("id") id: string) {
    const run = await prisma.annualAuditRun.findUniqueOrThrow({
      where: { audit_run_id: id },
      include: { candidates: { include: { user: true }, orderBy: { rank: "asc" } }, nominations: true },
    });
    return {
      auditRunId: run.audit_run_id,
      academicYear: run.academic_year,
      candidateCount: run.candidate_count,
      runAt: run.run_at,
      candidates: run.candidates.map(candidateDto),
      nominations: run.nominations.map(nominationDto),
    };
  }

  @Get("awards")
  async listAwards() {
    const awards = await prisma.award.findMany({ orderBy: { created_at: "desc" } });
    return awards.map(awardDto);
  }

  @Post("awards")
  async createAward(
    @CurrentUser() actor: RequestUser,
    @Body(new ZodValidationPipe(CreateAwardSchema)) body: z.infer<typeof CreateAwardSchema>,
  ) {
    const award = await prisma.award.create({ data: body });
    await this.auditLogService.record({ actorId: actor.userId, action: "AWARD_CREATED", entityType: "award", entityId: award.award_id });
    return awardDto(award);
  }

  @Post("nominations")
  async nominate(
    @CurrentUser() actor: RequestUser,
    @Body(new ZodValidationPipe(NominateAwardSchema)) body: ReturnType<typeof NominateAwardSchema.parse>,
  ) {
    const nomination = await prisma.awardNomination.create({
      data: { award_id: body.awardId, nominee_id: body.nomineeId, status: body.status },
    });
    await this.auditLogService.record({
      actorId: actor.userId,
      action: "AWARD_NOMINATION_CREATED",
      entityType: "award_nomination",
      entityId: nomination.nomination_id,
    });
    return nominationDto(nomination);
  }

  // Audit Log Viewer (Page 31, SEC-09).
  @Get("logs")
  async logs(@Query(new ZodValidationPipe(PaginationQuerySchema)) query: { page: number; pageSize: number }) {
    const { skip, take } = pageSkipTake(query);
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({ orderBy: { created_at: "desc" }, skip, take, include: { actor: true } }),
      prisma.auditLog.count(),
    ]);
    return toPaginatedResult(
      items.map((l) => ({
        auditLogId: l.audit_log_id,
        actorName: l.actor?.full_name ?? "System",
        action: l.action,
        entityType: l.entity_type,
        entityId: l.entity_id,
        metadata: l.metadata,
        createdAt: l.created_at,
      })),
      total,
      query,
    );
  }
}
