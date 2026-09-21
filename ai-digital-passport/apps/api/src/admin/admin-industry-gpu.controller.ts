import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Post, Put } from "@nestjs/common";
import { prisma } from "@ai-digital-passport/database";
import type { IndustryGpuRequest } from "@ai-digital-passport/database";
import { UserRole } from "@ai-digital-passport/shared-types";
import { z } from "zod";
import { AuditLogService } from "../common/audit-log/audit-log.service";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { Roles } from "../common/auth/roles.decorator";
import type { RequestUser } from "../common/auth/types";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";

const STATUSES = ["NEW", "UNDER_REVIEW", "APPROVED", "REJECTED", "FULFILLED"] as const;

const optional = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));

const GpuRequestSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  contactPerson: z.string().trim().min(1).max(200),
  contactEmail: optional(200),
  contactPhone: optional(50),
  website: optional(300),
  sector: optional(200),
  useCase: z.string().trim().min(1).max(4000),
  gpuType: optional(200),
  gpuCount: z.coerce.number().int().min(0).max(100000).optional(),
  hoursNeeded: z.coerce.number().int().min(0).max(1000000).optional(),
  duration: optional(200),
  status: z.enum(STATUSES).default("NEW"),
  adminNotes: optional(4000),
});

function dto(r: IndustryGpuRequest) {
  return {
    requestId: r.request_id,
    companyName: r.company_name,
    contactPerson: r.contact_person,
    contactEmail: r.contact_email,
    contactPhone: r.contact_phone,
    website: r.website,
    sector: r.sector,
    useCase: r.use_case,
    gpuType: r.gpu_type,
    gpuCount: r.gpu_count,
    hoursNeeded: r.hours_needed,
    duration: r.duration,
    status: r.status,
    adminNotes: r.admin_notes,
    createdAt: r.created_at,
  };
}

function data(b: z.infer<typeof GpuRequestSchema>) {
  return {
    company_name: b.companyName,
    contact_person: b.contactPerson,
    contact_email: b.contactEmail ?? null,
    contact_phone: b.contactPhone ?? null,
    website: b.website ?? null,
    sector: b.sector ?? null,
    use_case: b.useCase,
    gpu_type: b.gpuType ?? null,
    gpu_count: b.gpuCount ?? null,
    hours_needed: b.hoursNeeded ?? null,
    duration: b.duration ?? null,
    status: b.status,
    admin_notes: b.adminNotes ?? null,
  };
}

// Industry GPU access requests — companies asking for GPU compute; admins log and track them.
@Controller("admin/industry/gpu-requests")
@Roles(UserRole.ADMIN)
export class AdminIndustryGpuController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  async list() {
    const rows = await prisma.industryGpuRequest.findMany({ orderBy: { created_at: "desc" } });
    return rows.map(dto);
  }

  @Post()
  async create(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(GpuRequestSchema)) body: z.infer<typeof GpuRequestSchema>) {
    const row = await prisma.industryGpuRequest.create({ data: { ...data(body), created_by: user.userId } });
    await this.auditLogService.record({ actorId: user.userId, action: "INDUSTRY_GPU_REQUEST_CREATED", entityType: "industry_gpu_request", entityId: row.request_id });
    return dto(row);
  }

  @Put(":id")
  async update(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(GpuRequestSchema)) body: z.infer<typeof GpuRequestSchema>,
  ) {
    const existing = await prisma.industryGpuRequest.findUnique({ where: { request_id: id } });
    if (!existing) throw new NotFoundException({ code: "GPU_REQUEST_NOT_FOUND" });
    const row = await prisma.industryGpuRequest.update({ where: { request_id: id }, data: data(body) });
    await this.auditLogService.record({ actorId: user.userId, action: "INDUSTRY_GPU_REQUEST_UPDATED", entityType: "industry_gpu_request", entityId: id });
    return dto(row);
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    const existing = await prisma.industryGpuRequest.findUnique({ where: { request_id: id } });
    if (!existing) throw new NotFoundException({ code: "GPU_REQUEST_NOT_FOUND" });
    await prisma.industryGpuRequest.delete({ where: { request_id: id } });
    await this.auditLogService.record({ actorId: user.userId, action: "INDUSTRY_GPU_REQUEST_DELETED", entityType: "industry_gpu_request", entityId: id });
  }
}
