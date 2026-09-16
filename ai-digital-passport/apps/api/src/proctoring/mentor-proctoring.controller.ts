import { Controller, Get, Param, Post } from "@nestjs/common";
import { UserRole } from "@ai-digital-passport/shared-types";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { Roles } from "../common/auth/roles.decorator";
import type { RequestUser } from "../common/auth/types";
import { ProctoringService } from "./proctoring.service";

// "Proctoring Locks" mentor page (BR-16) — list of locked students'
// sessions, with a grant-access action. Mentor/Admin only.
@Controller("mentor/proctoring")
@Roles(UserRole.MENTOR, UserRole.ADMIN)
export class MentorProctoringController {
  constructor(private readonly proctoringService: ProctoringService) {}

  @Get("locks")
  async listLocked() {
    return this.proctoringService.listLocked();
  }

  @Post("locks/:sessionId/grant-access")
  async grantAccess(@CurrentUser() user: RequestUser, @Param("sessionId") sessionId: string) {
    return this.proctoringService.grantAccess(user.userId, sessionId);
  }
}
