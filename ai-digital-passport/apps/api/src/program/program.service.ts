import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { prisma, RequestStatus } from "@ai-digital-passport/database";
import { NotificationType } from "@ai-digital-passport/shared-types";
import { AuditLogService } from "../common/audit-log/audit-log.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PointsService } from "../points/points.service";

@Injectable()
export class ProgramService {
  constructor(
    private readonly auditLog: AuditLogService,
    private readonly notifications: NotificationsService,
    private readonly points: PointsService,
  ) {}

  async createGpuRequest(userId: string, input: { purpose: string; title: string; justification: string; requestedCredits: number }) {
    const request = await prisma.gpuRequest.create({
      data: {
        student_id: userId,
        purpose: input.purpose,
        title: input.title,
        justification: input.justification,
        requested_credits: input.requestedCredits,
        status: RequestStatus.SUBMITTED,
      },
    });
    await this.auditLog.record({ actorId: userId, action: "GPU_REQUEST_SUBMITTED", entityType: "gpu_request", entityId: request.gpu_request_id });
    return request;
  }

  async listGpuRequests(userId?: string) {
    return prisma.gpuRequest.findMany({
      where: userId ? { student_id: userId } : undefined,
      include: { student: true, reviewer: true },
      orderBy: { created_at: "desc" },
    });
  }

  async reviewGpuRequest(actorId: string, id: string, input: { status: RequestStatus; allocatedCredits?: number; comment?: string }) {
    const request = await prisma.gpuRequest.findUnique({ where: { gpu_request_id: id } });
    if (!request) throw new NotFoundException({ code: "GPU_REQUEST_NOT_FOUND" });
    if ((input.status === RequestStatus.ALLOCATED || input.status === RequestStatus.APPROVED) && !input.allocatedCredits) {
      throw new BadRequestException({ code: "ALLOCATED_CREDITS_REQUIRED" });
    }
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.gpuRequest.update({
        where: { gpu_request_id: id },
        data: {
          status: input.status,
          allocated_credits: input.allocatedCredits ?? request.allocated_credits,
          admin_comment: input.comment,
          reviewed_by: actorId,
          reviewed_at: new Date(),
        },
      });
      if (input.status === RequestStatus.ALLOCATED && input.allocatedCredits) {
        await tx.student.update({ where: { user_id: request.student_id }, data: { gpu_credit_balance: { increment: input.allocatedCredits } } });
      }
      return row;
    });
    await this.notifications.create({
      userId: request.student_id,
      type: NotificationType.SYSTEM,
      title: "GPU request updated",
      message: `Your GPU request "${request.title}" is now ${input.status}.`,
    });
    await this.auditLog.record({ actorId, action: `GPU_REQUEST_${input.status}`, entityType: "gpu_request", entityId: id });
    return updated;
  }

  async listHackathons() {
    return prisma.hackathon.findMany({ include: { problems: true, teams: true, submissions: { include: { evaluations: true } } }, orderBy: { starts_at: "desc" } });
  }

  async createHackathon(actorId: string, input: any) {
    const hackathon = await prisma.hackathon.create({
      data: {
        title: input.title,
        description: input.description,
        theme: input.theme,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
        registration_deadline: input.registrationDeadline,
        team_size_min: input.teamSizeMin,
        team_size_max: input.teamSizeMax,
        status: input.status,
        points_participation: input.pointsParticipation,
        points_winner: input.pointsWinner,
        created_by: actorId,
      },
    });
    await this.auditLog.record({ actorId, action: "HACKATHON_CREATED", entityType: "hackathon", entityId: hackathon.hackathon_id });
    return hackathon;
  }

  async addHackathonProblem(actorId: string, hackathonId: string, input: { title: string; description: string }) {
    const problem = await prisma.hackathonProblem.create({ data: { hackathon_id: hackathonId, title: input.title, description: input.description } });
    await this.auditLog.record({ actorId, action: "HACKATHON_PROBLEM_CREATED", entityType: "hackathon_problem", entityId: problem.problem_id });
    return problem;
  }

  async createHackathonTeam(userId: string, hackathonId: string, input: { name: string; problemId?: string; memberIds: string[] }) {
    const team = await prisma.hackathonTeam.create({
      data: {
        hackathon_id: hackathonId,
        problem_id: input.problemId,
        name: input.name,
        lead_id: userId,
        members: { create: [{ user_id: userId, role: "LEAD" }, ...input.memberIds.filter((id) => id !== userId).map((id) => ({ user_id: id }))] },
      },
      include: { members: true },
    });
    await this.auditLog.record({ actorId: userId, action: "HACKATHON_TEAM_CREATED", entityType: "hackathon_team", entityId: team.team_id });
    return team;
  }

  async submitHackathon(userId: string, hackathonId: string, teamId: string, input: { title: string; summary: string; githubUrl?: string; demoUrl?: string; fileKey?: string }) {
    const team = await prisma.hackathonTeam.findUnique({ where: { team_id: teamId }, include: { members: true } });
    if (!team || team.hackathon_id !== hackathonId || !team.members.some((m) => m.user_id === userId)) throw new NotFoundException({ code: "TEAM_NOT_FOUND" });
    const submission = await prisma.hackathonSubmission.create({
      data: { hackathon_id: hackathonId, team_id: teamId, title: input.title, summary: input.summary, github_url: input.githubUrl, demo_url: input.demoUrl, file_key: input.fileKey },
    });
    await this.auditLog.record({ actorId: userId, action: "HACKATHON_SUBMISSION_CREATED", entityType: "hackathon_submission", entityId: submission.submission_id });
    return submission;
  }

  async evaluateHackathon(actorId: string, submissionId: string, input: { innovation: number; technical: number; impact: number; presentation: number; completeness: number; comments?: string }) {
    const total = input.innovation + input.technical + input.impact + input.presentation + input.completeness;
    const evaluation = await prisma.hackathonEvaluation.upsert({
      where: { submission_id_evaluator_id: { submission_id: submissionId, evaluator_id: actorId } },
      update: { ...input, total_score: total },
      create: { submission_id: submissionId, evaluator_id: actorId, ...input, total_score: total },
    });
    await this.auditLog.record({ actorId, action: "HACKATHON_EVALUATED", entityType: "hackathon_submission", entityId: submissionId, metadata: { total } });
    return evaluation;
  }

  async createProject(userId: string, input: any) {
    const project = await prisma.projectRecord.create({
      data: {
        lead_student_id: userId,
        title: input.title,
        problem_statement: input.problemStatement,
        project_type: input.projectType,
        mentor_id: input.mentorId,
        industry_problem_id: input.industryProblemId,
        github_url: input.githubUrl,
        demo_url: input.demoUrl,
        report_file_key: input.reportFileKey,
        status: "SUBMITTED",
      },
    });
    await this.auditLog.record({ actorId: userId, action: "PROJECT_CREATED", entityType: "project_record", entityId: project.project_id });
    return project;
  }

  async listProjects(userId?: string) {
    return prisma.projectRecord.findMany({ where: userId ? { lead_student_id: userId } : undefined, include: { milestones: true, lead: true }, orderBy: { created_at: "desc" } });
  }

  async createProjectMilestone(userId: string, projectId: string, input: any) {
    const project = await prisma.projectRecord.findUnique({ where: { project_id: projectId } });
    if (!project || project.lead_student_id !== userId) throw new NotFoundException({ code: "PROJECT_NOT_FOUND" });
    return prisma.projectMilestone.create({ data: { project_id: projectId, title: input.title, description: input.description, due_at: input.dueAt, evidence_url: input.evidenceUrl, status: RequestStatus.SUBMITTED } });
  }

  async reviewProjectMilestone(actorId: string, milestoneId: string, input: { status: RequestStatus; feedback?: string }) {
    const milestone = await prisma.projectMilestone.update({
      where: { milestone_id: milestoneId },
      data: { status: input.status, feedback: input.feedback, reviewed_by: actorId, reviewed_at: new Date() },
      include: { project: true },
    });
    await this.notifications.create({ userId: milestone.project.lead_student_id, type: NotificationType.SYSTEM, title: "Project milestone reviewed", message: `${milestone.title}: ${input.status}` });
    return milestone;
  }

  async createIndustryPartner(input: { userId: string; companyName: string; contactPerson: string; website?: string }) {
    return prisma.industryPartner.upsert({
      where: { user_id: input.userId },
      update: { company_name: input.companyName, contact_person: input.contactPerson, website: input.website },
      create: { user_id: input.userId, company_name: input.companyName, contact_person: input.contactPerson, website: input.website },
    });
  }

  async createEvaluatorProfile(input: { userId: string; expertise: string[] }) {
    return prisma.evaluatorProfile.upsert({
      where: { user_id: input.userId },
      update: { expertise: input.expertise },
      create: { user_id: input.userId, expertise: input.expertise },
    });
  }

  async generateCertificate(actorId: string, input: { userId: string; title: string; certificateType: string }) {
    const pdf = Buffer.from(`%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 120>>stream\nBT /F1 24 Tf 72 700 Td (${input.title.replace(/[()]/g, "")}) Tj 0 -40 Td (AI Competency Centre Certificate) Tj ET\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF`);
    const stored = await prisma.storedFile.create({ data: { original_name: `${input.title}.pdf`, mime_type: "application/pdf", size_bytes: pdf.length, file_data: pdf, entity_type: "certificate", uploaded_by: actorId } });
    const cert = await prisma.generatedCertificate.create({ data: { user_id: input.userId, title: input.title, certificate_type: input.certificateType, file_key: stored.file_id, issued_by: actorId } });
    await this.notifications.create({ userId: input.userId, type: NotificationType.SYSTEM, title: "Certificate issued", message: `${input.title} is ready.` });
    return cert;
  }

  async createBadgeRule(input: { badgeId: string; trigger: string; threshold: number }) {
    return prisma.badgeRule.create({ data: { badge_id: input.badgeId, trigger: input.trigger, threshold: input.threshold } });
  }

  async applyBadgeRules(userId: string) {
    const student = await prisma.student.findUnique({ where: { user_id: userId } });
    const totalPoints = student?.total_points ?? 0;
    const rules = await prisma.badgeRule.findMany({ where: { active: true }, include: { badge: true } });
    const awarded = [];
    for (const rule of rules) {
      const qualifies = rule.trigger === "TOTAL_POINTS" ? totalPoints >= rule.threshold : false;
      if (!qualifies) continue;
      const badge = await prisma.userBadge.upsert({
        where: { user_id_badge_id: { user_id: userId, badge_id: rule.badge_id } },
        update: {},
        create: { user_id: userId, badge_id: rule.badge_id },
      });
      awarded.push(badge);
    }
    return awarded;
  }
}
