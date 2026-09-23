import { Body, Controller, ForbiddenException, Get, Param, Post, Query } from "@nestjs/common";
import { CreateProblemProjectSchema, PaginationQuerySchema, PROBLEM_BANK_MIN_LEVEL, problemStageName, SubmitProblemMilestoneSchema } from "@ai-digital-passport/shared-types";
import { CurrentUser } from "../common/auth/current-user.decorator";
import type { RequestUser } from "../common/auth/types";
import { pageSkipTake, toPaginatedResult } from "../common/pagination/pagination";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { ProblemsService } from "./problems.service";

function assertLevel(user: RequestUser) {
  if (user.currentLevelId < PROBLEM_BANK_MIN_LEVEL) {
    throw new ForbiddenException({
      code: "LEVEL_TOO_LOW",
      message: `Requires Level ${PROBLEM_BANK_MIN_LEVEL} (AI Builder) to access the Industry Problem Bank.`,
    });
  }
}

// GET /problems — Industry Problem Bank (Page 11). BR-07 / SEC-06: level
// re-checked server-side on every request, never trusting the frontend
// having hidden the tile.
//
// Students work a problem through 6 sequential, mentor-approved stages
// (ProblemProject/ProblemMilestone) — the same staged pattern as the
// Startup Launchpad, not a single free-form submission.
@Controller("problems")
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: { page: number; pageSize: number },
  ) {
    assertLevel(user);
    const { skip, take } = pageSkipTake(query);
    const { items, total } = await this.problemsService.listPublished(user.userId, skip, take);
    return toPaginatedResult(
      items.map((p) => {
        const project = p.projects?.[0];
        return {
          problemId: p.problem_id,
          title: p.title,
          description: p.description,
          organization: p.organization,
          levelRequirement: p.level_requirement,
          attachment: p.attachment_file_key
            ? {
                fileKey: p.attachment_file_key,
                fileName: p.attachment_file_name ?? "attachment",
                mimeType: p.attachment_mime_type ?? "application/octet-stream",
                sizeBytes: p.attachment_size_bytes ?? 0,
              }
            : null,
          project: project
            ? {
                projectId: project.project_id,
                currentStage: project.current_stage,
                currentStageName: problemStageName(project.current_stage),
                verifiedStage: Math.max(0, ...project.milestones.filter((m) => m.status === "APPROVED").map((m) => m.target_stage)),
                milestones: project.milestones.map((m) => ({
                  milestoneId: m.milestone_id,
                  targetStage: m.target_stage,
                  status: m.status,
                  feedback: m.feedback,
                  details: m.details,
                  evidenceUrl: m.evidence_url,
                  createdAt: m.created_at,
                })),
              }
            : null,
        };
      }),
      total,
      query,
    );
  }

  @Post(":id/projects")
  async startProject(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(CreateProblemProjectSchema)) _body: ReturnType<typeof CreateProblemProjectSchema.parse>,
  ) {
    assertLevel(user);
    const project = await this.problemsService.createProject(user.userId, id);
    return { projectId: project.project_id, problemId: project.problem_id, currentStage: project.current_stage };
  }

  @Post("projects/:projectId/milestones")
  async submitMilestone(
    @CurrentUser() user: RequestUser,
    @Param("projectId") projectId: string,
    @Body(new ZodValidationPipe(SubmitProblemMilestoneSchema)) body: ReturnType<typeof SubmitProblemMilestoneSchema.parse>,
  ) {
    assertLevel(user);
    const milestone = await this.problemsService.submitMilestone(user.userId, projectId, body.targetStage, body.evidenceUrl, body.details);
    return {
      milestoneId: milestone.milestone_id,
      projectId: milestone.project_id,
      targetStage: milestone.target_stage,
      status: milestone.status,
      createdAt: milestone.created_at,
    };
  }
}
