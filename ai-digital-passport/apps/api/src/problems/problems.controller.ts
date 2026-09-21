import { Body, Controller, ForbiddenException, Get, Param, Post, Query } from "@nestjs/common";
import { PaginationQuerySchema, PROBLEM_BANK_MIN_LEVEL } from "@ai-digital-passport/shared-types";
import { z } from "zod";
import { CurrentUser } from "../common/auth/current-user.decorator";
import type { RequestUser } from "../common/auth/types";
import { pageSkipTake, toPaginatedResult } from "../common/pagination/pagination";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { ProblemsService } from "./problems.service";

const SubmitProblemSchema = z.object({
  summary: z.string().trim().min(1).max(4000),
  fileKey: z.string().trim().min(1).optional(),
});

// GET /problems — Industry Problem Bank (Page 11). BR-07 / SEC-06: level
// re-checked server-side on every request, never trusting the frontend
// having hidden the tile.
@Controller("problems")
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: { page: number; pageSize: number },
  ) {
    if (user.currentLevelId < PROBLEM_BANK_MIN_LEVEL) {
      throw new ForbiddenException({
        code: "LEVEL_TOO_LOW",
        message: `Requires Level ${PROBLEM_BANK_MIN_LEVEL} (AI Builder) to access the Industry Problem Bank.`,
      });
    }
    const { skip, take } = pageSkipTake(query);
    const { items, total } = await this.problemsService.listPublished(skip, take);
    return toPaginatedResult(
      items.map((p) => ({
        problemId: p.problem_id,
        title: p.title,
        description: p.description,
        organization: p.organization,
        levelRequirement: p.level_requirement,
        attachment: p.attachment_file_key
          ? {
              fileKey: p.attachment_file_key,
              fileName: p.attachment_file_name ?? "attachment",
              mimeType: p.attachment_mime_type ?? "application/octet-stream",
              sizeBytes: p.attachment_size_bytes ?? 0,
            }
          : null,
      })),
      total,
      query,
    );
  }

  @Post(":id/submissions")
  async submit(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(SubmitProblemSchema)) body: z.infer<typeof SubmitProblemSchema>,
  ) {
    if (user.currentLevelId < PROBLEM_BANK_MIN_LEVEL) {
      throw new ForbiddenException({
        code: "LEVEL_TOO_LOW",
        message: `Requires Level ${PROBLEM_BANK_MIN_LEVEL} (AI Builder) to access the Industry Problem Bank.`,
      });
    }
    const submission = await this.problemsService.submit(id, user.userId, body.summary, body.fileKey);
    return {
      submissionId: submission.submission_id,
      problemId: submission.problem_id,
      summary: submission.summary,
      fileKey: submission.file_key,
      createdAt: submission.created_at,
    };
  }
}
