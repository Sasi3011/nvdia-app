import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@ai-digital-passport/database";
import type { UpdateProfileInput } from "@ai-digital-passport/shared-types";

@Injectable()
export class UsersService {
  async findById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      include: { current_level: true, user_roles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND" });
    return user;
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  // Core identity fields (email, register_num) are intentionally not
  // patchable here — Page 18: they're auth/points-integrity keys.
  async updateProfile(userId: string, input: UpdateProfileInput) {
    return prisma.user.update({
      where: { user_id: userId },
      data: {
        full_name: input.fullName,
        department: input.department,
        cohort_year: input.cohortYear,
      },
    });
  }
}
