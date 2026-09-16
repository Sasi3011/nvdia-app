import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma, ProblemStatus } from "@ai-digital-passport/database";

@Injectable()
export class ProblemsService {
  async listPublished(skip: number, take: number) {
    const where = { status: ProblemStatus.PUBLISHED };
    const [items, total] = await Promise.all([
      prisma.industryProblem.findMany({ where, orderBy: { created_at: "desc" }, skip, take }),
      prisma.industryProblem.count({ where }),
    ]);
    return { items, total };
  }

  async findByIdOrThrow(problemId: string) {
    const problem = await prisma.industryProblem.findUnique({ where: { problem_id: problemId } });
    if (!problem) throw new NotFoundException({ code: "PROBLEM_NOT_FOUND" });
    return problem;
  }

  async submit(problemId: string, userId: string, summary: string, fileKey?: string) {
    await this.findByIdOrThrow(problemId);
    return prisma.problemSubmission.create({
      data: { problem_id: problemId, user_id: userId, summary, file_key: fileKey },
    });
  }
}
