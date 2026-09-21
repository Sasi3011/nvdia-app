import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query } from "@nestjs/common";
import { prisma } from "@ai-digital-passport/database";
import type { IndustryProblem } from "@ai-digital-passport/database";
import { PaginationQuerySchema, ProblemAttachmentSchema, UpsertProblemSchema, UserRole } from "@ai-digital-passport/shared-types";
import { AuditLogService } from "../common/audit-log/audit-log.service";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { Roles } from "../common/auth/roles.decorator";
import type { RequestUser } from "../common/auth/types";
import { pageSkipTake, toPaginatedResult } from "../common/pagination/pagination";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { z } from "zod";

// Import keeps the uploaded original file (PDF / Excel / Word ...) as an attachment instead of parsing its text.
const ImportSchema = z.object({
  title: z.string().trim().min(1, "Problem title is required").max(200),
  description: z.string().trim().max(4000).default(""),
  // Industry name and lifecycle status are chosen by the admin at import time.
  organization: z.string().trim().min(1, "Industry name is required").max(200),
  status: z.enum(["PUBLISHED", "DRAFT", "ARCHIVED"]),
  attachment: ProblemAttachmentSchema,
});

function attachmentData(a: z.infer<typeof ProblemAttachmentSchema> | null | undefined) {
  if (a === undefined) return {};
  return {
    attachment_file_key: a?.fileKey ?? null,
    attachment_file_name: a?.fileName ?? null,
    attachment_mime_type: a?.mimeType ?? null,
    attachment_size_bytes: a?.sizeBytes ?? null,
  };
}

// Stored files are only removed when nothing references them any more.
async function dropFileIfOrphan(fileKey: string | null | undefined) {
  if (!fileKey) return;
  const still = await prisma.industryProblem.count({ where: { attachment_file_key: fileKey } });
  if (still === 0) await prisma.storedFile.deleteMany({ where: { file_id: fileKey } });
}

function problemDto(p: IndustryProblem) {
  return {
    problemId: p.problem_id,
    title: p.title,
    description: p.description,
    organization: p.organization,
    status: p.status,
    levelRequirement: p.level_requirement,
    attachment: p.attachment_file_key
      ? {
          fileKey: p.attachment_file_key,
          fileName: p.attachment_file_name ?? "attachment",
          mimeType: p.attachment_mime_type ?? "application/octet-stream",
          sizeBytes: p.attachment_size_bytes ?? 0,
        }
      : null,
    createdAt: p.created_at,
  };
}

// Problem Bank Management (Page 26) — full CRUD including drafts, unlike
// the student-facing GET /problems (published + level-gated only).
@Controller("admin/problems")
@Roles(UserRole.ADMIN)
export class AdminProblemsController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  async list(@Query(new ZodValidationPipe(PaginationQuerySchema)) query: { page: number; pageSize: number }) {
    const { skip, take } = pageSkipTake(query);
    const [items, total] = await Promise.all([
      prisma.industryProblem.findMany({ orderBy: { created_at: "desc" }, skip, take }),
      prisma.industryProblem.count(),
    ]);
    return toPaginatedResult(items.map(problemDto), total, query);
  }

  @Post("import")
  async importProblem(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(ImportSchema)) body: z.infer<typeof ImportSchema>,
  ) {
    const problem = await prisma.industryProblem.create({
      data: {
        title: body.title,
        description: body.description,
        organization: body.organization,
        status: body.status,
        level_requirement: 1,
        created_by: user.userId,
        ...attachmentData(body.attachment),
      },
    });
    await this.auditLogService.record({
      actorId: user.userId,
      action: "PROBLEM_IMPORTED",
      entityType: "industry_problem",
      entityId: problem.problem_id,
      metadata: { fileName: body.attachment.fileName },
    });
    return problemDto(problem);
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(UpsertProblemSchema)) body: ReturnType<typeof UpsertProblemSchema.parse>,
  ) {
    const problem = await prisma.industryProblem.create({
      data: {
        title: body.title,
        description: body.description,
        organization: body.organization,
        status: body.status,
        level_requirement: body.levelRequirement,
        created_by: user.userId,
        ...attachmentData(body.attachment),
      },
    });
    await this.auditLogService.record({ actorId: user.userId, action: "PROBLEM_CREATED", entityType: "industry_problem", entityId: problem.problem_id });
    return problemDto(problem);
  }

  @Delete(":id")
  async remove(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    const problem = await prisma.industryProblem.findUnique({ where: { problem_id: id } });
    if (!problem) throw new NotFoundException({ code: "PROBLEM_NOT_FOUND" });

    // Student work is never deleted with the problem; archive it instead.
    const submissions = await prisma.problemSubmission.count({ where: { problem_id: id } });
    if (submissions > 0) {
      throw new BadRequestException({
        code: "PROBLEM_HAS_SUBMISSIONS",
        message: "Students have already submitted solutions to this problem, so it cannot be deleted. Archive it instead.",
      });
    }

    await prisma.$transaction([
      prisma.projectRecord.updateMany({ where: { industry_problem_id: id }, data: { industry_problem_id: null } }),
      prisma.industryProblem.delete({ where: { problem_id: id } }),
    ]);
    await dropFileIfOrphan(problem.attachment_file_key);
    await this.auditLogService.record({ actorId: user.userId, action: "PROBLEM_DELETED", entityType: "industry_problem", entityId: id });
    return { success: true };
  }

  @Put(":id")
  async update(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpsertProblemSchema)) body: ReturnType<typeof UpsertProblemSchema.parse>,
  ) {
    const existing = await prisma.industryProblem.findUnique({ where: { problem_id: id } });
    if (!existing) throw new NotFoundException({ code: "PROBLEM_NOT_FOUND" });
    const problem = await prisma.industryProblem.update({
      where: { problem_id: id },
      data: {
        title: body.title,
        description: body.description,
        organization: body.organization,
        status: body.status,
        level_requirement: body.levelRequirement,
        ...attachmentData(body.attachment),
      },
    });
    if (existing.attachment_file_key && existing.attachment_file_key !== problem.attachment_file_key) {
      await dropFileIfOrphan(existing.attachment_file_key);
    }
    await this.auditLogService.record({ actorId: user.userId, action: "PROBLEM_UPDATED", entityType: "industry_problem", entityId: id });
    return problemDto(problem);
  }
}
