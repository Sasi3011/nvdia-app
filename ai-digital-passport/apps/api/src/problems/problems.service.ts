import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ClaimStatus, Prisma, prisma, ProblemStatus } from "@ai-digital-passport/database";
import { NotificationType } from "@ai-digital-passport/shared-types";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class ProblemsService {
  constructor(private readonly notificationsService: NotificationsService) {}

  async listPublished(userId: string, skip: number, take: number) {
    const where = { status: ProblemStatus.PUBLISHED };
    const [items, total] = await Promise.all([
      prisma.industryProblem.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take,
        include: {
          projects: {
            where: { user_id: userId },
            orderBy: { created_at: "desc" },
            take: 1,
            include: { milestones: { orderBy: { created_at: "desc" } } },
          },
        },
      }),
      prisma.industryProblem.count({ where }),
    ]);
    return { items, total };
  }

  async findByIdOrThrow(problemId: string) {
    const problem = await prisma.industryProblem.findUnique({ where: { problem_id: problemId } });
    if (!problem) throw new NotFoundException({ code: "PROBLEM_NOT_FOUND" });
    return problem;
  }

  // ---- Student: staged solution flow (mirrors StartupService) ------------

  async listOwnProjects(userId: string) {
    return prisma.problemProject.findMany({
      where: { user_id: userId },
      include: { milestones: { orderBy: { created_at: "desc" } }, problem: { select: { title: true } } },
      orderBy: { created_at: "desc" },
    });
  }

  // A project always starts at Stage 1 (Problem Understanding).
  async createProject(userId: string, problemId: string) {
    await this.findByIdOrThrow(problemId);
    const existing = await prisma.problemProject.findFirst({ where: { user_id: userId, problem_id: problemId } });
    if (existing) throw new BadRequestException({ code: "PROJECT_ALREADY_EXISTS", message: "You already have a project for this problem." });
    return prisma.problemProject.create({
      data: { user_id: userId, problem_id: problemId, current_stage: 1 },
    });
  }

  async submitMilestone(userId: string, projectId: string, targetStage: number, evidenceUrl: string | undefined, details?: Record<string, string>) {
    const project = await prisma.problemProject.findUnique({ where: { project_id: projectId } });
    if (!project) throw new NotFoundException({ code: "PROJECT_NOT_FOUND" });
    if (project.user_id !== userId) {
      throw new ForbiddenException({ code: "NOT_YOUR_PROJECT" });
    }
    if (targetStage !== project.current_stage + 1) {
      throw new BadRequestException({
        code: "INVALID_STAGE_TRANSITION",
        message: `Stages advance sequentially — expected stage ${project.current_stage + 1}.`,
      });
    }

    return prisma.problemMilestone.create({
      data: { project_id: projectId, target_stage: targetStage, evidence_url: evidenceUrl, details: { fields: details ?? {} }, status: ClaimStatus.PENDING },
    });
  }

  // ---- Mentor: review queue -------------------------------------------------

  async pendingMilestones(skip: number, take: number) {
    const where = { status: ClaimStatus.PENDING };
    const [items, total] = await Promise.all([
      prisma.problemMilestone.findMany({
        where,
        orderBy: { created_at: "asc" },
        skip,
        take,
        include: { project: { include: { user: true, problem: { select: { title: true, organization: true } } } } },
      }),
      prisma.problemMilestone.count({ where }),
    ]);
    return { items, total };
  }

  async reviewMilestone(milestoneId: string, reviewerId: string, decision: ClaimStatus, feedback: string | undefined) {
    const milestone = await prisma.problemMilestone.findUnique({ where: { milestone_id: milestoneId } });
    if (!milestone) throw new NotFoundException({ code: "MILESTONE_NOT_FOUND" });

    const { count } = await prisma.problemMilestone.updateMany({
      where: { milestone_id: milestoneId, status: ClaimStatus.PENDING },
      data: { status: decision, feedback, reviewed_by: reviewerId, reviewed_at: new Date() },
    });
    if (count === 0) {
      throw new ConflictException({ code: "MILESTONE_ALREADY_REVIEWED" });
    }

    const project = await prisma.problemProject.findUniqueOrThrow({ where: { project_id: milestone.project_id } });

    if (decision === ClaimStatus.APPROVED) {
      await prisma.problemProject.update({
        where: { project_id: milestone.project_id },
        data: { current_stage: milestone.target_stage },
      });
    }

    await this.notificationsService.create({
      userId: project.user_id,
      type: decision === ClaimStatus.APPROVED ? NotificationType.CLAIM_APPROVED : NotificationType.CLAIM_REJECTED,
      title: decision === ClaimStatus.APPROVED ? "Problem solution stage approved" : "Problem solution stage rejected",
      message: feedback ?? `Stage ${milestone.target_stage} ${decision === ClaimStatus.APPROVED ? "approved" : "rejected"}.`,
    });

    return { milestoneId, status: decision };
  }

  // ---- Admin (read-only) ---------------------------------------------------

  async adminSummary() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [total, byStage, pendingReviews, newLast30Days] = await Promise.all([
      prisma.problemProject.count(),
      prisma.problemProject.groupBy({ by: ["current_stage"], _count: { _all: true } }),
      prisma.problemMilestone.count({ where: { status: ClaimStatus.PENDING } }),
      prisma.problemProject.count({ where: { created_at: { gte: since } } }),
    ]);
    const stageCounts: Record<number, number> = {};
    for (const row of byStage) stageCounts[row.current_stage] = row._count._all;
    return { total, stageCounts, pendingReviews, newLast30Days };
  }

  async listForAdmin(filters: { search?: string; stage?: number; status?: ClaimStatus }, skip: number, take: number) {
    const and: Prisma.ProblemProjectWhereInput[] = [];
    const search = filters.search?.trim();
    if (search) {
      and.push({
        OR: [
          { problem: { title: { contains: search, mode: "insensitive" } } },
          { user: { full_name: { contains: search, mode: "insensitive" } } },
          { user: { email: { contains: search, mode: "insensitive" } } },
        ],
      });
    }
    if (filters.stage) and.push({ current_stage: filters.stage });
    if (filters.status) and.push({ milestones: { some: { status: filters.status } } });
    const where: Prisma.ProblemProjectWhereInput = and.length ? { AND: and } : {};

    const [items, total] = await Promise.all([
      prisma.problemProject.findMany({
        where,
        orderBy: { updated_at: "desc" },
        skip,
        take,
        include: {
          user: {
            select: { user_id: true, full_name: true, email: true, student: { select: { department: true, cohort_year: true } } },
          },
          problem: { select: { title: true, organization: true } },
          milestones: { select: { status: true } },
        },
      }),
      prisma.problemProject.count({ where }),
    ]);
    return { items, total };
  }

  async getForAdmin(projectId: string) {
    const project = await prisma.problemProject.findUnique({
      where: { project_id: projectId },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            student: { select: { register_num: true, department: true, cohort_year: true } },
          },
        },
        problem: { select: { title: true, organization: true } },
        milestones: {
          orderBy: [{ target_stage: "asc" }, { created_at: "asc" }],
          include: { reviewer: { select: { full_name: true } } },
        },
      },
    });
    if (!project) throw new NotFoundException({ code: "PROBLEM_PROJECT_NOT_FOUND" });
    return project;
  }
}
