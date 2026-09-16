import { Body, Controller, Get, Patch } from "@nestjs/common";
import { UpdateProfileSchema } from "@ai-digital-passport/shared-types";
import { CurrentUser } from "../common/auth/current-user.decorator";
import type { RequestUser } from "../common/auth/types";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { UsersService } from "./users.service";

// GET /me, PATCH /me (Page 18 — Profile & Settings).
@Controller("me")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async me(@CurrentUser() user: RequestUser) {
    const record = await this.usersService.findById(user.userId);
    return {
      userId: record.user_id,
      email: record.email,
      fullName: record.full_name,
      registerNum: record.register_num,
      department: record.department,
      cohortYear: record.cohort_year,
      totalPoints: record.total_points,
      gpuCreditBalance: record.gpu_credit_balance,
      highImpactFlag: record.high_impact_flag,
      avatarUrl: record.avatar_url,
      roles: record.user_roles.map((ur) => ur.role.name),
      level: {
        levelId: record.current_level.level_id,
        levelName: record.current_level.level_name,
        minPoints: record.current_level.min_points,
        unlockedPrivilege: record.current_level.unlocked_privilege,
      },
    };
  }

  @Patch()
  async updateMe(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) body: ReturnType<typeof UpdateProfileSchema.parse>,
  ) {
    const updated = await this.usersService.updateProfile(user.userId, body);
    return { userId: updated.user_id, fullName: updated.full_name, department: updated.department, cohortYear: updated.cohort_year };
  }
}
