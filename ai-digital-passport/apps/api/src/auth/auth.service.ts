import { BadRequestException, ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import { prisma } from "@ai-digital-passport/database";
import { UserRole, type OnboardUserInput } from "@ai-digital-passport/shared-types";
import { LeaderboardService } from "../leaderboard/leaderboard.service";
import { WhitelistService } from "../whitelist/whitelist.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly leaderboardService: LeaderboardService,
    private readonly whitelist: WhitelistService,
  ) {}

  // BR-01 / FR-AUTH-01: only the institutional domain may authenticate.
  assertAllowedDomain(email: string): void {
    const domain = process.env.ALLOWED_EMAIL_DOMAIN;
    if (!domain) {
      throw new BadRequestException({ code: "DOMAIN_NOT_CONFIGURED", message: "ALLOWED_EMAIL_DOMAIN is not set." });
    }
    if (!email.toLowerCase().endsWith(`@${domain.toLowerCase()}`)) {
      throw new ForbiddenException({
        code: "DOMAIN_NOT_ALLOWED",
        message: `Only @${domain} accounts may authenticate.`,
      });
    }
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findByEmailWithRoles(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { user_roles: { include: { role: true } } },
    });
  }


  // BR-02 / FR-AUTH-03: new profile always starts at Level 1, 0 points,
  // 0 GPU credits. Returning users skip onboarding entirely (Page 2).
  async onboard(email: string, fullName: string, input: OnboardUserInput) {
    this.assertAllowedDomain(email);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException({ code: "ALREADY_ONBOARDED", message: "A profile already exists for this email." });
    }

    // The role comes from the access list (students by default).
    const role = await this.whitelist.roleFor(email);

    // Each role gets its own profile table; the register number doubles as
    // the employee ID for faculty and admins.
    const user = await prisma.user.create({
      data: {
        email,
        full_name: fullName,
        user_roles: {
          create: { role: { connect: { name: role as UserRole } } },
        },
        ...(role === UserRole.STUDENT && {
          student: {
            create: {
              register_num: input.registerNum,
              department: input.department,
              cohort_year: input.cohortYear,
              current_level_id: 1,
              total_points: 0,
              gpu_credit_balance: 0,
            },
          },
        }),
        ...(role === UserRole.MENTOR && {
          faculty: { create: { employee_id: input.registerNum, department: input.department } },
        }),
        ...(role === UserRole.ADMIN && {
          admin: { create: { employee_id: input.registerNum } },
        }),
      },
      include: { student: true },
    });

    // Keeps the Redis leaderboard consistent with its PostgreSQL fallback
    // (Page 13) — without this, a fresh cohort with no approved claims
    // yet would show nobody via Redis but everyone via the fallback.
    await this.leaderboardService.setScore(user.user_id, 0);

    return user;
  }
}
