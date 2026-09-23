import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@ai-digital-passport/database";
import type { UpdateProfileInput } from "@ai-digital-passport/shared-types";

@Injectable()
export class UsersService {
  async findById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      include: {
        student: { include: { current_level: true } },
        faculty: true,
        admin: true,
        user_roles: { include: { role: true } },
      },
    });
    if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND" });
    return user;
  }

  // Level 1 — what non-student accounts report on /me.
  async baseLevel() {
    return prisma.level.findUniqueOrThrow({ where: { level_id: 1 } });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  // Core identity fields (email, register_num) are intentionally not
  // patchable here — Page 18: they're auth/points-integrity keys.
  // Department and cohort year go to whichever role profiles the user has.
  async updateProfile(userId: string, input: UpdateProfileInput) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { user_id: userId },
        data: { full_name: input.fullName },
        include: { student: true, faculty: true },
      });
      const student = user.student
        ? await tx.student.update({
            where: { user_id: userId },
            data: { department: input.department, cohort_year: input.cohortYear },
          })
        : null;
      const faculty = user.faculty
        ? await tx.faculty.update({ where: { user_id: userId }, data: { department: input.department } })
        : null;
      return { ...user, student, faculty };
    });
  }

  async listMentors() {
    const mentors = await prisma.user.findMany({
      where: { user_roles: { some: { role: { name: "MENTOR" } } } },
      select: { user_id: true, full_name: true },
      orderBy: { full_name: "asc" }
    });
    return mentors.map(m => ({ id: m.user_id, name: m.full_name }));
  }
}
