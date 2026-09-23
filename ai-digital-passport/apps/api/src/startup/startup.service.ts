import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ClaimStatus, Prisma, prisma } from "@ai-digital-passport/database";
import { NotificationType } from "@ai-digital-passport/shared-types";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class StartupService {
  constructor(private readonly notificationsService: NotificationsService) {}

  async listOwn(userId: string) {
    return prisma.startupProject.findMany({
      where: { lead_student_id: userId },
      include: { milestones: { orderBy: { created_at: "desc" } } },
      orderBy: { created_at: "desc" },
    });
  }

  // BR-09: projects always start at Stage 1 (Idea).
  async create(userId: string, title: string) {
    return prisma.startupProject.create({
      data: { lead_student_id: userId, title, current_stage: 1 },
    });
  }

  // Open decision #5: same mentor-reviewed pattern as activity claims.
  async submitMilestone(userId: string, projectId: string, targetStage: number, evidenceUrl: string | undefined, details?: Record<string, string>, documents?: { fileKey: string; fileName: string }[]) {
    const project = await prisma.startupProject.findUnique({ where: { project_id: projectId } });
    if (!project) throw new NotFoundException({ code: "PROJECT_NOT_FOUND" });
    if (project.lead_student_id !== userId) {
      throw new ForbiddenException({ code: "NOT_YOUR_PROJECT" });
    }
    if (targetStage !== project.current_stage + 1) {
      throw new BadRequestException({
        code: "INVALID_STAGE_TRANSITION",
        message: `Stages advance sequentially — expected stage ${project.current_stage + 1}.`,
      });
    }

    return prisma.startupMilestone.create({
      data: { project_id: projectId, target_stage: targetStage, evidence_url: evidenceUrl, details: { fields: details ?? {}, documents: documents ?? [] }, status: ClaimStatus.PENDING },
    });
  }

  async pendingMilestones(skip: number, take: number) {
    const where = { status: ClaimStatus.PENDING };
    const [items, total] = await Promise.all([
      prisma.startupMilestone.findMany({
        where,
        orderBy: { created_at: "asc" },
        skip,
        take,
        include: { project: { include: { lead: true } } },
      }),
      prisma.startupMilestone.count({ where }),
    ]);
    return { items, total };
  }

  // BR-09: stage increments sequentially, 1 through 6, on mentor approval.
  async reviewMilestone(milestoneId: string, reviewerId: string, decision: ClaimStatus, feedback: string | undefined) {
    const milestone = await prisma.startupMilestone.findUnique({ where: { milestone_id: milestoneId } });
    if (!milestone) throw new NotFoundException({ code: "MILESTONE_NOT_FOUND" });

    const { count } = await prisma.startupMilestone.updateMany({
      where: { milestone_id: milestoneId, status: ClaimStatus.PENDING },
      data: { status: decision, feedback, reviewed_by: reviewerId, reviewed_at: new Date() },
    });
    if (count === 0) {
      throw new ConflictException({ code: "MILESTONE_ALREADY_REVIEWED" });
    }

    const project = await prisma.startupProject.findUniqueOrThrow({ where: { project_id: milestone.project_id } });

    if (decision === ClaimStatus.APPROVED) {
      await prisma.startupProject.update({
        where: { project_id: milestone.project_id },
        data: { current_stage: milestone.target_stage },
      });
    }

    await this.notificationsService.create({
      userId: project.lead_student_id,
      type: decision === ClaimStatus.APPROVED ? NotificationType.CLAIM_APPROVED : NotificationType.CLAIM_REJECTED,
      title: decision === ClaimStatus.APPROVED ? "Startup milestone approved" : "Startup milestone rejected",
      message: feedback ?? `Stage ${milestone.target_stage} ${decision === ClaimStatus.APPROVED ? "approved" : "rejected"}.`,
    });

    return { milestoneId, status: decision };
  }

  // ---- Admin (read-only) --------------------------------------------------

  async adminSummary() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [total, byStage, gpuValidated, pendingReviews, newLast30Days] = await Promise.all([
      prisma.startupProject.count(),
      prisma.startupProject.groupBy({ by: ["current_stage"], _count: { _all: true } }),
      prisma.startupProject.count({ where: { gpu_validated: true } }),
      prisma.startupMilestone.count({ where: { status: ClaimStatus.PENDING } }),
      prisma.startupProject.count({ where: { created_at: { gte: since } } }),
    ]);
    const stageCounts: Record<number, number> = {};
    for (const row of byStage) stageCounts[row.current_stage] = row._count._all;
    return { total, stageCounts, gpuValidated, pendingReviews, newLast30Days };
  }

  async listForAdmin(filters: { search?: string; stage?: number; status?: ClaimStatus }, skip: number, take: number) {
    const and: Prisma.StartupProjectWhereInput[] = [];
    const search = filters.search?.trim();
    if (search) {
      and.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { lead: { full_name: { contains: search, mode: "insensitive" } } },
          { lead: { email: { contains: search, mode: "insensitive" } } },
        ],
      });
    }
    if (filters.stage) and.push({ current_stage: filters.stage });
    if (filters.status) and.push({ milestones: { some: { status: filters.status } } });
    const where: Prisma.StartupProjectWhereInput = and.length ? { AND: and } : {};

    const [items, total] = await Promise.all([
      prisma.startupProject.findMany({
        where,
        orderBy: { updated_at: "desc" },
        skip,
        take,
        include: {
          lead: {
            select: { user_id: true, full_name: true, email: true, student: { select: { department: true, cohort_year: true } } },
          },
          milestones: { select: { status: true } },
        },
      }),
      prisma.startupProject.count({ where }),
    ]);
    return { items, total };
  }

  async getForAdmin(projectId: string) {
    const project = await prisma.startupProject.findUnique({
      where: { project_id: projectId },
      include: {
        lead: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            student: { select: { register_num: true, department: true, cohort_year: true } },
          },
        },
        milestones: {
          orderBy: [{ target_stage: "asc" }, { created_at: "asc" }],
          include: { reviewer: { select: { full_name: true } } },
        },
      },
    });
    if (!project) throw new NotFoundException({ code: "STARTUP_NOT_FOUND" });
    return project;
  }
}
