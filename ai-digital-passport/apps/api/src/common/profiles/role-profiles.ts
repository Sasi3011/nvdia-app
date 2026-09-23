import { NotFoundException } from "@nestjs/common";
import { prisma, type Prisma } from "@ai-digital-passport/database";
import { UserRole } from "@ai-digital-passport/shared-types";

type Db = Prisma.TransactionClient | typeof prisma;

/**
 * Role-specific data lives in per-role profile tables (students, faculty,
 * admins). When a role is granted after onboarding, this creates the
 * matching profile if the user doesn't have one yet. Existing profiles are
 * never touched. Missing details are borrowed from the user's other
 * profiles (register number / employee ID, department), then from the
 * email's local part.
 */
export async function ensureRoleProfile(db: Db, userId: string, role: string, fallbackDepartment?: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { user_id: userId },
    include: { student: true, faculty: true, admin: true },
  });
  if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND" });

  const idNumber =
    user.student?.register_num ?? user.faculty?.employee_id ?? user.admin?.employee_id ?? user.email.split("@")[0] ?? userId;
  const department = user.student?.department ?? user.faculty?.department ?? fallbackDepartment ?? "";

  if (role === UserRole.STUDENT && !user.student) {
    await db.student.create({
      data: { user_id: userId, register_num: idNumber, department, cohort_year: new Date().getFullYear() },
    });
  } else if (role === UserRole.MENTOR && !user.faculty) {
    await db.faculty.create({ data: { user_id: userId, employee_id: idNumber, department } });
  } else if (role === UserRole.ADMIN && !user.admin) {
    await db.admin.create({ data: { user_id: userId, employee_id: idNumber } });
  }
}
