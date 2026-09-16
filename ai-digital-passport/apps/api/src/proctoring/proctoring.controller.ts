import { Body, Controller, Param, Post } from "@nestjs/common";
import { ReportProctoringViolationSchema } from "@ai-digital-passport/shared-types";
import { CurrentUser } from "../common/auth/current-user.decorator";
import type { RequestUser } from "../common/auth/types";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { ProctoringService } from "./proctoring.service";

// Student-facing proctored-session lifecycle. Every route is scoped to the
// logged-in student's own sessions (checked in ProctoringService), same as
// every other student-scoped endpoint in the app — no separate role needed
// beyond "authenticated", since a LIVE_PROCTORED task is just one kind of
// course task any student can attempt.
@Controller("proctoring")
export class ProctoringController {
  constructor(private readonly proctoringService: ProctoringService) {}

  @Post("tasks/:taskId/start")
  async start(@CurrentUser() user: RequestUser, @Param("taskId") taskId: string) {
    return this.proctoringService.startSession(taskId, user.userId);
  }

  @Post("sessions/:id/violations")
  async reportViolation(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(ReportProctoringViolationSchema)) body: ReturnType<typeof ReportProctoringViolationSchema.parse>,
  ) {
    return this.proctoringService.reportViolation(id, user.userId, body.violationType);
  }

  @Post("sessions/:id/complete")
  async complete(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.proctoringService.completeSession(id, user.userId);
  }
}
