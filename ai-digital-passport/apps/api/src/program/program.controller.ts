import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import {
  CreateGpuRequestSchema,
  CreateHackathonTeamSchema,
  CreateProjectMilestoneSchema,
  CreateProjectRecordSchema,
  SubmitHackathonSchema,
} from "@ai-digital-passport/shared-types";
import { CurrentUser } from "../common/auth/current-user.decorator";
import type { RequestUser } from "../common/auth/types";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { ProgramService } from "./program.service";

@Controller()
export class ProgramController {
  constructor(private readonly program: ProgramService) {}

  @Get("gpu/requests")
  listMyGpu(@CurrentUser() user: RequestUser) {
    return this.program.listGpuRequests(user.userId);
  }

  @Post("gpu/requests")
  createGpu(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(CreateGpuRequestSchema)) body: ReturnType<typeof CreateGpuRequestSchema.parse>) {
    return this.program.createGpuRequest(user.userId, body);
  }

  @Get("hackathons")
  listHackathons() {
    return this.program.listHackathons();
  }

  @Post("hackathons/:id/teams")
  createTeam(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body(new ZodValidationPipe(CreateHackathonTeamSchema)) body: ReturnType<typeof CreateHackathonTeamSchema.parse>) {
    return this.program.createHackathonTeam(user.userId, id, body);
  }

  @Post("hackathons/:id/teams/:teamId/submissions")
  submitHackathon(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Param("teamId") teamId: string,
    @Body(new ZodValidationPipe(SubmitHackathonSchema)) body: ReturnType<typeof SubmitHackathonSchema.parse>,
  ) {
    return this.program.submitHackathon(user.userId, id, teamId, body);
  }

  @Get("projects/records")
  listProjects(@CurrentUser() user: RequestUser) {
    return this.program.listProjects(user.userId);
  }

  @Post("projects/records")
  createProject(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(CreateProjectRecordSchema)) body: ReturnType<typeof CreateProjectRecordSchema.parse>) {
    return this.program.createProject(user.userId, body);
  }

  @Post("projects/records/:id/milestones")
  createMilestone(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(CreateProjectMilestoneSchema)) body: ReturnType<typeof CreateProjectMilestoneSchema.parse>,
  ) {
    return this.program.createProjectMilestone(user.userId, id, body);
  }
}
