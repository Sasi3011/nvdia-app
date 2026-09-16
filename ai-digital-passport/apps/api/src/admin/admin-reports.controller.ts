import { Controller, Get, Header, Res } from "@nestjs/common";
import type { Response } from "express";
import { prisma } from "@ai-digital-passport/database";
import { UserRole } from "@ai-digital-passport/shared-types";
import { Roles } from "../common/auth/roles.decorator";

function toCsv(rows: Record<string, unknown>[]): string {
  const [first] = rows;
  if (!first) return "";
  const headers = Object.keys(first);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

// Reports & Analytics Export (Page 29).
@Controller("admin/reports")
@Roles(UserRole.ADMIN)
export class AdminReportsController {
  @Get("summary")
  async summary() {
    const [
      pointsByCategory,
      claimsByStatus,
      levelDistribution,
      startupStageDistribution,
      problemSubmissionCount,
      distinctSubmitters,
      gpuByStatus,
      hackathonsByStatus,
      projectByStatus,
      certificateCount,
    ] =
      await Promise.all([
        prisma.activityClaim.groupBy({
          by: ["category"],
          where: { status: "APPROVED" },
          _sum: { points_awarded: true },
          _count: { _all: true },
        }),
        prisma.activityClaim.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.user.groupBy({ by: ["current_level_id"], _count: { _all: true } }),
        prisma.startupProject.groupBy({ by: ["current_stage"], _count: { _all: true } }),
        prisma.problemSubmission.count(),
        prisma.problemSubmission.findMany({ select: { user_id: true }, distinct: ["user_id"] }),
        prisma.gpuRequest.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.hackathon.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.projectRecord.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.generatedCertificate.count(),
      ]);

    return {
      pointsByCategory: pointsByCategory.map((r) => ({
        category: r.category,
        approvedCount: r._count._all,
        totalPointsAwarded: r._sum.points_awarded ?? 0,
      })),
      claimsByStatus: claimsByStatus.map((r) => ({ status: r.status, count: r._count._all })),
      levelDistribution: levelDistribution.map((r) => ({ levelId: r.current_level_id, count: r._count._all })),
      startupStageDistribution: startupStageDistribution.map((r) => ({ stage: r.current_stage, count: r._count._all })),
      problemBank: { submissionCount: problemSubmissionCount, distinctSubmitters: distinctSubmitters.length },
      gpuByStatus: gpuByStatus.map((r) => ({ status: r.status, count: r._count._all })),
      hackathonsByStatus: hackathonsByStatus.map((r) => ({ status: r.status, count: r._count._all })),
      projectByStatus: projectByStatus.map((r) => ({ status: r.status, count: r._count._all })),
      certificates: { issuedCount: certificateCount },
    };
  }

  @Get("claims/export.csv")
  @Header("Content-Type", "text/csv")
  @Header("Content-Disposition", 'attachment; filename="claims.csv"')
  async exportClaimsCsv(@Res() res: Response) {
    const claims = await prisma.activityClaim.findMany({
      include: { claimant: true },
      orderBy: { created_at: "desc" },
      take: 5000,
    });
    const csv = toCsv(
      claims.map((c) => ({
        claim_id: c.claim_id,
        student: c.claimant.full_name,
        category: c.category,
        proof_type: c.proof_type,
        status: c.status,
        points_requested: c.points_requested,
        points_awarded: c.points_awarded,
        created_at: c.created_at.toISOString(),
      })),
    );
    res.send(csv);
  }

  @Get("gpu/export.csv")
  @Header("Content-Type", "text/csv")
  @Header("Content-Disposition", 'attachment; filename="gpu-requests.csv"')
  async exportGpuCsv(@Res() res: Response) {
    const rows = await prisma.gpuRequest.findMany({ include: { student: true }, orderBy: { created_at: "desc" }, take: 5000 });
    res.send(toCsv(rows.map((r) => ({
      id: r.gpu_request_id,
      student: r.student.full_name,
      purpose: r.purpose,
      title: r.title,
      requested_credits: r.requested_credits,
      allocated_credits: r.allocated_credits,
      status: r.status,
      created_at: r.created_at.toISOString(),
    }))));
  }

  @Get("projects/export.csv")
  @Header("Content-Type", "text/csv")
  @Header("Content-Disposition", 'attachment; filename="projects.csv"')
  async exportProjectsCsv(@Res() res: Response) {
    const rows = await prisma.projectRecord.findMany({ include: { lead: true, milestones: true }, orderBy: { created_at: "desc" }, take: 5000 });
    res.send(toCsv(rows.map((r) => ({
      id: r.project_id,
      lead: r.lead.full_name,
      title: r.title,
      type: r.project_type,
      status: r.status,
      milestones: r.milestones.length,
      created_at: r.created_at.toISOString(),
    }))));
  }

  @Get("hackathons/export.csv")
  @Header("Content-Type", "text/csv")
  @Header("Content-Disposition", 'attachment; filename="hackathons.csv"')
  async exportHackathonsCsv(@Res() res: Response) {
    const rows = await prisma.hackathon.findMany({ include: { teams: true, submissions: true }, orderBy: { starts_at: "desc" }, take: 5000 });
    res.send(toCsv(rows.map((r) => ({
      id: r.hackathon_id,
      title: r.title,
      status: r.status,
      teams: r.teams.length,
      submissions: r.submissions.length,
      starts_at: r.starts_at.toISOString(),
    }))));
  }
}
