import { Controller, Get, Param, Query } from "@nestjs/common";
import { ClaimStatus } from "@ai-digital-passport/database";
import { PaginationQuerySchema, UserRole, startupStageName } from "@ai-digital-passport/shared-types";
import { z } from "zod";
import { Roles } from "../common/auth/roles.decorator";
import { pageSkipTake, toPaginatedResult } from "../common/pagination/pagination";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { StartupService } from "./startup.service";

const AdminStartupsQuerySchema = PaginationQuerySchema.extend({
  search: z.string().trim().max(100).optional(),
  stage: z.coerce.number().int().min(1).max(6).optional(),
  status: z.nativeEnum(ClaimStatus).optional(),
});

type Details = { fields?: Record<string, string>; documents?: { fileKey: string; fileName: string }[] } | null;

// Startup Launchpad — read-only overview for admins. Milestone approval stays with mentors.
// Shared by the admin and faculty portals; milestone approval goes through
// /mentor/startups/:id/review, which both roles can call.
@Controller("admin/startups")
@Roles(UserRole.ADMIN, UserRole.MENTOR)
export class AdminStartupsController {
  constructor(private readonly startupService: StartupService) {}

  @Get()
  async list(@Query(new ZodValidationPipe(AdminStartupsQuerySchema)) query: z.infer<typeof AdminStartupsQuerySchema>) {
    const { skip, take } = pageSkipTake(query);
    const [{ items, total }, summary] = await Promise.all([
      this.startupService.listForAdmin({ search: query.search, stage: query.stage, status: query.status }, skip, take),
      this.startupService.adminSummary(),
    ]);
    const paged = toPaginatedResult(
      items.map((p) => {
        const count = (s: ClaimStatus) => p.milestones.filter((m) => m.status === s).length;
        return {
          projectId: p.project_id,
          title: p.title,
          currentStage: p.current_stage,
          currentStageName: startupStageName(p.current_stage),
          gpuValidated: p.gpu_validated,
          lead: {
            userId: p.lead.user_id,
            fullName: p.lead.full_name,
            email: p.lead.email,
            department: p.lead.student?.department ?? "",
            cohortYear: p.lead.student?.cohort_year ?? null,
          },
          milestones: { approved: count(ClaimStatus.APPROVED), pending: count(ClaimStatus.PENDING), rejected: count(ClaimStatus.REJECTED) },
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        };
      }),
      total,
      query,
    );
    return { ...paged, summary };
  }

  @Get(":projectId")
  async detail(@Param("projectId") projectId: string) {
    const p = await this.startupService.getForAdmin(projectId);
    return {
      projectId: p.project_id,
      title: p.title,
      currentStage: p.current_stage,
      currentStageName: startupStageName(p.current_stage),
      gpuValidated: p.gpu_validated,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      lead: {
        userId: p.lead.user_id,
        fullName: p.lead.full_name,
        email: p.lead.email,
        registerNum: p.lead.student?.register_num ?? "",
        department: p.lead.student?.department ?? "",
        cohortYear: p.lead.student?.cohort_year ?? null,
      },
      milestones: p.milestones.map((m) => {
        const details = (m.details ?? null) as Details;
        return {
          milestoneId: m.milestone_id,
          targetStage: m.target_stage,
          stageName: startupStageName(m.target_stage),
          status: m.status,
          evidenceUrl: m.evidence_url,
          fields: details?.fields ?? {},
          documents: details?.documents ?? [],
          feedback: m.feedback,
          reviewerName: m.reviewer?.full_name ?? null,
          reviewedAt: m.reviewed_at,
          submittedAt: m.created_at,
        };
      }),
    };
  }
}
