import { BadRequestException, Body, Controller, Get, Param, Post } from "@nestjs/common";
import { prisma } from "@ai-digital-passport/database";
import { RejectClaimSchema, UserRole } from "@ai-digital-passport/shared-types";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { Roles } from "../common/auth/roles.decorator";
import type { RequestUser } from "../common/auth/types";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { UploadsService } from "../uploads/uploads.service";
import { CoursesService } from "./courses.service";

// Mentor review of course-proof submissions — a separate queue from
// /mentor/claims (Page 20-22) but the exact same approve/reject-with-
// feedback pattern and the same PointsService award path underneath.
@Controller("mentor/courses")
@Roles(UserRole.MENTOR, UserRole.ADMIN)
export class MentorCoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Get("queue")
  async queue() {
    const items = await this.coursesService.reviewQueue();
    return items.map((e) => ({
      enrollmentId: e.enrollment_id,
      courseId: e.course_id,
      courseTitle: e.course.title,
      pointsValue: e.course.points_value,
      submittedProofUrl: e.submitted_proof_url,
      submittedAt: e.submitted_at,
      student: { userId: e.student.user_id, fullName: e.student.full_name, department: e.student.student?.department ?? "" },
    }));
  }

  @Post(":enrollmentId/approve")
  async approve(@CurrentUser() user: RequestUser, @Param("enrollmentId") enrollmentId: string) {
    return this.coursesService.approve(user.userId, enrollmentId);
  }

  // The evidence field (submitted_proof_url) holds either an external
  // link (GITHUB_LINK-style URL) or an S3 file key from /uploads/presign,
  // same dual shape as claim proof (Page 14). Only the latter needs a
  // presigned viewer URL (SEC-07).
  @Get(":enrollmentId/proof-download-url")
  async proofDownloadUrl(@Param("enrollmentId") enrollmentId: string) {
    const enrollment = await prisma.courseEnrollment.findUniqueOrThrow({ where: { enrollment_id: enrollmentId } });
    if (!enrollment.submitted_proof_url || /^https?:\/\//.test(enrollment.submitted_proof_url)) {
      throw new BadRequestException({ code: "NOT_A_FILE_KEY", message: "This submission's proof is an external link, not an uploaded file." });
    }
    return this.uploadsService.presignDownload(enrollment.submitted_proof_url);
  }

  @Post(":enrollmentId/reject")
  async reject(
    @CurrentUser() user: RequestUser,
    @Param("enrollmentId") enrollmentId: string,
    @Body(new ZodValidationPipe(RejectClaimSchema)) body: ReturnType<typeof RejectClaimSchema.parse>,
  ) {
    return this.coursesService.reject(user.userId, enrollmentId, body.feedback);
  }
}
