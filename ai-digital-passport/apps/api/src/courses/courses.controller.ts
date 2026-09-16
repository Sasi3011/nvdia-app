import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { SubmitCourseProofSchema } from "@ai-digital-passport/shared-types";
import { CurrentUser } from "../common/auth/current-user.decorator";
import type { RequestUser } from "../common/auth/types";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { CoursesService } from "./courses.service";

// Student-facing Assigned Courses — GET /courses, GET /courses/:id,
// POST /courses/:id/tasks/:taskId/complete, POST /courses/:id/proof.
@Controller("courses")
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async list(@CurrentUser() user: RequestUser) {
    return this.coursesService.listPublishedForStudent(user.userId);
  }

  @Get(":id")
  async detail(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.coursesService.getDetailForStudent(id, user.userId);
  }

  @Post(":id/tasks/:taskId/complete")
  async completeTask(@CurrentUser() user: RequestUser, @Param("id") id: string, @Param("taskId") taskId: string) {
    return this.coursesService.completeStandardTask(id, taskId, user.userId);
  }

  @Post(":id/proof")
  async submitProof(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(SubmitCourseProofSchema)) body: ReturnType<typeof SubmitCourseProofSchema.parse>,
  ) {
    return this.coursesService.submitProof(id, user.userId, body);
  }
}
