import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { RequestStatus } from "@ai-digital-passport/database";
import {
  CreateBadgeRuleSchema,
  CreateEvaluatorProfileSchema,
  CreateHackathonProblemSchema,
  CreateHackathonSchema,
  CreateIndustryPartnerSchema,
  EvaluateHackathonSubmissionSchema,
  GenerateCertificateSchema,
  ReviewGpuRequestSchema,
  ReviewProjectMilestoneSchema,
  UserRole,
} from "@ai-digital-passport/shared-types";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { Roles } from "../common/auth/roles.decorator";
import type { RequestUser } from "../common/auth/types";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { ProgramService } from "./program.service";

@Controller()
export class ProgramAdminController {
  constructor(private readonly program: ProgramService) {}

  @Get("admin/gpu/requests")
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  listGpu() {
    return this.program.listGpuRequests();
  }

  @Post("admin/gpu/requests/:id/review")
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  reviewGpu(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body(new ZodValidationPipe(ReviewGpuRequestSchema)) body: ReturnType<typeof ReviewGpuRequestSchema.parse>) {
    return this.program.reviewGpuRequest(user.userId, id, { ...body, status: body.status as RequestStatus });
  }

  @Post("admin/hackathons")
  @Roles(UserRole.ADMIN)
  createHackathon(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(CreateHackathonSchema)) body: ReturnType<typeof CreateHackathonSchema.parse>) {
    return this.program.createHackathon(user.userId, body);
  }

  @Post("admin/hackathons/:id/problems")
  @Roles(UserRole.ADMIN)
  addProblem(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body(new ZodValidationPipe(CreateHackathonProblemSchema)) body: ReturnType<typeof CreateHackathonProblemSchema.parse>) {
    return this.program.addHackathonProblem(user.userId, id, body);
  }

  @Post("evaluator/hackathon-submissions/:id/evaluate")
  @Roles(UserRole.EVALUATOR, UserRole.ADMIN)
  evaluate(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body(new ZodValidationPipe(EvaluateHackathonSubmissionSchema)) body: ReturnType<typeof EvaluateHackathonSubmissionSchema.parse>) {
    return this.program.evaluateHackathon(user.userId, id, body);
  }

  @Get("admin/projects/records")
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  listProjects() {
    return this.program.listProjects();
  }

  @Post("mentor/projects/milestones/:id/review")
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  reviewMilestone(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body(new ZodValidationPipe(ReviewProjectMilestoneSchema)) body: ReturnType<typeof ReviewProjectMilestoneSchema.parse>) {
    return this.program.reviewProjectMilestone(user.userId, id, { ...body, status: body.status as RequestStatus });
  }

  @Post("admin/industry/partners")
  @Roles(UserRole.ADMIN)
  createPartner(@Body(new ZodValidationPipe(CreateIndustryPartnerSchema)) body: ReturnType<typeof CreateIndustryPartnerSchema.parse>) {
    return this.program.createIndustryPartner(body);
  }

  @Post("admin/evaluators")
  @Roles(UserRole.ADMIN)
  createEvaluator(@Body(new ZodValidationPipe(CreateEvaluatorProfileSchema)) body: ReturnType<typeof CreateEvaluatorProfileSchema.parse>) {
    return this.program.createEvaluatorProfile(body);
  }

  @Post("admin/certificates")
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  generateCertificate(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(GenerateCertificateSchema)) body: ReturnType<typeof GenerateCertificateSchema.parse>) {
    return this.program.generateCertificate(user.userId, body);
  }

  @Post("admin/badge-rules")
  @Roles(UserRole.ADMIN)
  createBadgeRule(@Body(new ZodValidationPipe(CreateBadgeRuleSchema)) body: ReturnType<typeof CreateBadgeRuleSchema.parse>) {
    return this.program.createBadgeRule(body);
  }

  @Post("admin/users/:id/apply-badges")
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  applyBadges(@Param("id") id: string) {
    return this.program.applyBadgeRules(id);
  }
}
