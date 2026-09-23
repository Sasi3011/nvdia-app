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
    const student = record.student;
    // Same response shape for every role: non-students have no points or
    // level of their own, so they report Level 1 / 0 points as before.
    const level = student?.current_level ?? (await this.usersService.baseLevel());
    return {
      userId: record.user_id,
      email: record.email,
      fullName: record.full_name,
      registerNum: student?.register_num ?? record.faculty?.employee_id ?? record.admin?.employee_id ?? "",
      department: student?.department ?? record.faculty?.department ?? "",
      cohortYear: student?.cohort_year ?? record.created_at.getFullYear(),
      totalPoints: student?.total_points ?? 0,
      gpuCreditBalance: student?.gpu_credit_balance ?? 0,
      highImpactFlag: student?.high_impact_flag ?? false,
      avatarUrl: record.avatar_url,
      roles: record.user_roles.map((ur) => ur.role.name),
      level: {
        levelId: level.level_id,
        levelName: level.level_name,
        minPoints: level.min_points,
        unlockedPrivilege: level.unlocked_privilege,
      },
    };
  }

  @Patch()
  async updateMe(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) body: ReturnType<typeof UpdateProfileSchema.parse>,
  ) {
    const updated = await this.usersService.updateProfile(user.userId, body);
    return {
      userId: updated.user_id,
      fullName: updated.full_name,
      department: updated.student?.department ?? updated.faculty?.department ?? "",
      cohortYear: updated.student?.cohort_year ?? updated.created_at.getFullYear(),
    };
  }
}

@Controller("users")
export class UsersListController {
  constructor(private readonly usersService: UsersService) {}

  @Get("mentors")
  async listMentors() {
    return this.usersService.listMentors();
  }
}
