import { Controller, Get, Param, Query } from "@nestjs/common";
import { ClaimStatus } from "@ai-digital-passport/database";
import { PaginationQuerySchema, UserRole, problemStageName } from "@ai-digital-passport/shared-types";
import { z } from "zod";
import { Roles } from "../common/auth/roles.decorator";
import { pageSkipTake, toPaginatedResult } from "../common/pagination/pagination";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { ProblemsService } from "./problems.service";

const AdminProblemProjectsQuerySchema = PaginationQuerySchema.extend({
  search: z.string().trim().max(100).optional(),
  stage: z.coerce.number().int().min(1).max(6).optional(),
  status: z.nativeEnum(ClaimStatus).optional(),
});

type Details = { fields?: Record<string, string> } | null;

// Industry Problem Bank — staged solutions, read-only overview for admins.
// Milestone approval stays with mentors.
@Controller("admin/problem-projects")
@Roles(UserRole.ADMIN)
export class AdminProblemProjectsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Get()
  async list(@Query(new ZodValidationPipe(AdminProblemProjectsQuerySchema)) query: z.infer<typeof AdminProblemProjectsQuerySchema>) {
    const { skip, take } = pageSkipTake(query);
    const [{ items, total }, summary] = await Promise.all([
      this.problemsService.listForAdmin({ search: query.search, stage: query.stage, status: query.status }, skip, take),
      this.problemsService.adminSummary(),
    ]);
    const paged = toPaginatedResult(
      items.map((p) => {
        const count = (s: ClaimStatus) => p.milestones.filter((m) => m.status === s).length;
        return {
          projectId: p.project_id,
          problemTitle: p.problem.title,
          organization: p.problem.organization,
          currentStage: p.current_stage,
          currentStageName: problemStageName(p.current_stage),
          student: {
            userId: p.user.user_id,
            fullName: p.user.full_name,
            email: p.user.email,
            department: p.user.student?.department ?? "",
            cohortYear: p.user.student?.cohort_year ?? null,
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
    const p = await this.problemsService.getForAdmin(projectId);
    return {
      projectId: p.project_id,
      problemTitle: p.problem.title,
      organization: p.problem.organization,
      currentStage: p.current_stage,
      currentStageName: problemStageName(p.current_stage),
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      student: {
        userId: p.user.user_id,
        fullName: p.user.full_name,
        email: p.user.email,
        registerNum: p.user.student?.register_num ?? "",
        department: p.user.student?.department ?? "",
        cohortYear: p.user.student?.cohort_year ?? null,
      },
      milestones: p.milestones.map((m) => {
        const details = (m.details ?? null) as Details;
        return {
          milestoneId: m.milestone_id,
          targetStage: m.target_stage,
          stageName: problemStageName(m.target_stage),
          status: m.status,
          evidenceUrl: m.evidence_url,
          fields: details?.fields ?? {},
          feedback: m.feedback,
          reviewerName: m.reviewer?.full_name ?? null,
          reviewedAt: m.reviewed_at,
          submittedAt: m.created_at,
        };
      }),
    };
  }
}
