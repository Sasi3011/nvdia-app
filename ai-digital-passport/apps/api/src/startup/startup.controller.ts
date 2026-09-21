import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CreateStartupProjectSchema, startupStageName, SubmitStartupMilestoneSchema } from "@ai-digital-passport/shared-types";
import { CurrentUser } from "../common/auth/current-user.decorator";
import type { RequestUser } from "../common/auth/types";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { StartupService } from "./startup.service";

// GET/POST /startup/projects (Page 12).
@Controller("startup/projects")
export class StartupController {
  constructor(private readonly startupService: StartupService) {}

  @Get()
  async list(@CurrentUser() user: RequestUser) {
    const projects = await this.startupService.listOwn(user.userId);
    return projects.map((p) => ({
      projectId: p.project_id,
      title: p.title,
      currentStage: p.current_stage,
      currentStageName: startupStageName(p.current_stage),
      gpuValidated: p.gpu_validated,
      verifiedStage: Math.max(0, ...p.milestones.filter((m) => m.status === "APPROVED").map((m) => m.target_stage)),
      milestones: p.milestones.map((m) => ({
        milestoneId: m.milestone_id,
        targetStage: m.target_stage,
        status: m.status,
        feedback: m.feedback,
        details: m.details,
        evidenceUrl: m.evidence_url,
        createdAt: m.created_at,
      })),
    }));
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(CreateStartupProjectSchema)) body: ReturnType<typeof CreateStartupProjectSchema.parse>,
  ) {
    const project = await this.startupService.create(user.userId, body.title);
    return { projectId: project.project_id, title: project.title, currentStage: project.current_stage };
  }

  @Post(":id/milestones")
  async submitMilestone(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(SubmitStartupMilestoneSchema)) body: ReturnType<typeof SubmitStartupMilestoneSchema.parse>,
  ) {
    const milestone = await this.startupService.submitMilestone(user.userId, id, body.targetStage, body.evidenceUrl, body.details, body.documents);
    return {
      milestoneId: milestone.milestone_id,
      projectId: milestone.project_id,
      targetStage: milestone.target_stage,
      status: milestone.status,
      createdAt: milestone.created_at,
    };
  }
}
