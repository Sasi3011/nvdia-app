import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EnrollmentStatus, prisma } from "@ai-digital-passport/database";
import type { Course, CourseEnrollment } from "@ai-digital-passport/database";
import { CourseStatus, NotificationType } from "@ai-digital-passport/shared-types";
import { AuditLogService } from "../common/audit-log/audit-log.service";
import { MentorRoutingService } from "../common/mentor-routing/mentor-routing.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PointsService } from "../points/points.service";

@Injectable()
export class CoursesService {
  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly notificationsService: NotificationsService,
    private readonly mentorRoutingService: MentorRoutingService,
    private readonly pointsService: PointsService,
  ) {}

  // ---------------------------------------------------------------------
  // Student-facing
  // ---------------------------------------------------------------------

  // Course completion points come from the scoring matrix ("course_completion").
  private async coursePoints(fallback: number): Promise<number> {
    const rule = await prisma.scoringRule.findUnique({ where: { category: "course_completion" } });
    return rule?.points ?? fallback;
  }

  // Every published course — whether an admin or a faculty member created
  // it — is visible to every student in every department. The level
  // requirement is shown as guidance only; it no longer hides a course.
  async listPublishedForStudent(userId: string) {
    const courses = await prisma.course.findMany({
      where: { status: CourseStatus.PUBLISHED },
      orderBy: { created_at: "desc" },
    });
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { user_id: userId, course_id: { in: courses.map((c) => c.course_id) } },
    });
    const byCourseId = new Map(enrollments.map((e) => [e.course_id, e]));
    const matrixPoints = await this.coursePoints(0);
    return courses.map((c) => ({ ...courseDto(c), pointsValue: matrixPoints || c.points_value, enrollmentStatus: byCourseId.get(c.course_id)?.status ?? EnrollmentStatus.NOT_STARTED }));
  }

  // Visiting the detail page is what creates the enrollment row (lazily —
  // no separate "enroll" click required by the spec's student flow).
  async getDetailForStudent(courseId: string, userId: string) {
    const course = await this.findVisibleOrThrow(courseId, userId);
    const enrollment = await this.getOrCreateEnrollment(courseId, userId);
    return {
      ...courseDto(course),
      pointsValue: await this.coursePoints(course.points_value),
      enrollment: enrollmentDto(enrollment),
    };
  }





  async submitProof(
    courseId: string,
    userId: string,
    input: { proofUrl?: string; fileKey?: string; fileName?: string; mimeType?: string; sizeBytes?: number },
  ) {
    await this.findVisibleOrThrow(courseId, userId);
    const enrollment = await this.getOrCreateEnrollment(courseId, userId);
    if (enrollment.status === EnrollmentStatus.SUBMITTED || enrollment.status === EnrollmentStatus.APPROVED) {
      throw new BadRequestException({ code: "ALREADY_SUBMITTED", message: "This course has already been submitted or approved." });
    }

    const updated = await prisma.courseEnrollment.update({
      where: { enrollment_id: enrollment.enrollment_id },
      data: {
        status: EnrollmentStatus.SUBMITTED,
        submitted_proof_url: input.fileKey ?? input.proofUrl ?? null,
        submitted_at: new Date(),
        review_feedback: null,
      },
    });

    await this.auditLogService.record({
      actorId: userId,
      action: "COURSE_PROOF_SUBMITTED",
      entityType: "course_enrollment",
      entityId: updated.enrollment_id,
    });

    // Route to the student's department mentor (or every mentor as a
    // fallback) — reuses the shared notification table, not a new one.
    const student = await prisma.user.findUniqueOrThrow({ where: { user_id: userId }, include: { student: true } });
    const course = await prisma.course.findUniqueOrThrow({ where: { course_id: courseId } });
    await this.mentorRoutingService.notifyDepartmentMentors(student.student?.department ?? "", {
      type: NotificationType.MENTOR_REVIEW_REMINDER,
      title: "Course proof submitted for review",
      message: `${student.full_name} submitted proof for "${course.title}".`,
    });

    return enrollmentDto(updated);
  }

  // ---------------------------------------------------------------------
  // Admin/Mentor course + task CRUD (BR-13)
  // ---------------------------------------------------------------------

  async listAllForAdmin() {
    return prisma.course.findMany({ orderBy: { created_at: "desc" }, include: { tasks: { orderBy: { sequence_order: "asc" } } } });
  }

  async getForAdmin(courseId: string) {
    const course = await prisma.course.findUnique({ where: { course_id: courseId } });
    if (!course) throw new NotFoundException({ code: "COURSE_NOT_FOUND" });
    return course;
  }

  async create(actorId: string, input: {
    title: string; description: string; provider: string; externalUrl: string;
    pointsValue: number; levelRequirement?: number | null; status: CourseStatus;
    shortDescription?: string; category: string; difficulty: string; durationHours: number; durationWeeks?: number | null;
    deliveryMode: string; enrollmentType: string; certificateAvailable: boolean; isFeatured: boolean;
    skillsCovered: string[]; prerequisites: string[]; learningOutcomes: string[]; toolsRequired: string[]; targetAudience?: string;
  }) {
    const course = await prisma.course.create({
      data: {
        title: input.title,
        description: input.description,
        short_description: input.shortDescription ?? "",
        category: input.category,
        difficulty: input.difficulty,
        duration_hours: input.durationHours,
        duration_weeks: input.durationWeeks ?? null,
        delivery_mode: input.deliveryMode,
        enrollment_type: input.enrollmentType,
        certificate_available: input.certificateAvailable,
        is_featured: input.isFeatured,
        skills_covered: input.skillsCovered,
        prerequisites: input.prerequisites,
        learning_outcomes: input.learningOutcomes,
        tools_required: input.toolsRequired,
        target_audience: input.targetAudience ?? "",
        provider: input.provider,
        external_url: input.externalUrl,
        points_value: input.pointsValue,
        level_requirement: input.levelRequirement ?? null,
        status: input.status,
        created_by: actorId,
      },
    });
    await this.auditLogService.record({ actorId, action: "COURSE_CREATED", entityType: "course", entityId: course.course_id });
    if (course.status === CourseStatus.PUBLISHED) await this.announcePublished(course);
    return course;
  }

  // A newly published course goes out to every department at once: all
  // students and all mentors.
  private async announcePublished(course: Course) {
    const [students, mentors] = await Promise.all([
      prisma.student.findMany({ select: { user_id: true } }),
      prisma.userRole.findMany({ where: { role: { name: "MENTOR" } }, select: { user_id: true } }),
    ]);
    const userIds = [...new Set([...students, ...mentors].map((r) => r.user_id))];
    if (userIds.length === 0) return;

    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        user_id: userId,
        type: NotificationType.SYSTEM,
        title: "New course published",
        message: `"${course.title}" (${course.provider}) is now available in Courses & Curricula.`,
      })),
    });
  }

  async update(actorId: string, courseId: string, input: {
    title: string; description: string; provider: string; externalUrl: string;
    pointsValue: number; levelRequirement?: number | null; status: CourseStatus;
    shortDescription?: string; category: string; difficulty: string; durationHours: number; durationWeeks?: number | null;
    deliveryMode: string; enrollmentType: string; certificateAvailable: boolean; isFeatured: boolean;
    skillsCovered: string[]; prerequisites: string[]; learningOutcomes: string[]; toolsRequired: string[]; targetAudience?: string;
  }) {
    const before = await this.getForAdmin(courseId);
    const course = await prisma.course.update({
      where: { course_id: courseId },
      data: {
        title: input.title,
        description: input.description,
        short_description: input.shortDescription ?? "",
        category: input.category,
        difficulty: input.difficulty,
        duration_hours: input.durationHours,
        duration_weeks: input.durationWeeks ?? null,
        delivery_mode: input.deliveryMode,
        enrollment_type: input.enrollmentType,
        certificate_available: input.certificateAvailable,
        is_featured: input.isFeatured,
        skills_covered: input.skillsCovered,
        prerequisites: input.prerequisites,
        learning_outcomes: input.learningOutcomes,
        tools_required: input.toolsRequired,
        target_audience: input.targetAudience ?? "",
        provider: input.provider,
        external_url: input.externalUrl,
        points_value: input.pointsValue,
        level_requirement: input.levelRequirement ?? null,
        status: input.status,
      },
    });
    await this.auditLogService.record({ actorId, action: "COURSE_UPDATED", entityType: "course", entityId: courseId });
    if (before.status !== CourseStatus.PUBLISHED && course.status === CourseStatus.PUBLISHED) await this.announcePublished(course);
    return course;
  }

  async setStatus(actorId: string, courseId: string, status: CourseStatus) {
    const before = await this.getForAdmin(courseId);
    const course = await prisma.course.update({ where: { course_id: courseId }, data: { status } });
    await this.auditLogService.record({ actorId, action: `COURSE_${status}`, entityType: "course", entityId: courseId });
    if (before.status !== CourseStatus.PUBLISHED && status === CourseStatus.PUBLISHED) await this.announcePublished(course);
    return course;
  }

  // Courses that already awarded points keep their history: archive them
  // instead. Anything else is removed together with its dependent rows.
  async deleteCourse(actorId: string, courseId: string) {
    const course = await this.getForAdmin(courseId);
    const awarded = await prisma.pointsTransaction.count({ where: { enrollment: { course_id: courseId } } });
    if (awarded > 0) {
      throw new BadRequestException({
        code: "COURSE_HAS_AWARDED_POINTS",
        message: "Students have already earned points from this course, so it cannot be deleted. Archive it instead.",
      });
    }

    const tasks = await prisma.courseTask.findMany({ where: { course_id: courseId }, select: { task_id: true } });
    const taskIds = tasks.map((t) => t.task_id);
    const sessions = await prisma.proctoringSession.findMany({ where: { task_id: { in: taskIds } }, select: { session_id: true } });
    const sessionIds = sessions.map((x) => x.session_id);

    await prisma.$transaction([
      prisma.proctoringViolation.deleteMany({ where: { session_id: { in: sessionIds } } }),
      prisma.proctoringSession.deleteMany({ where: { task_id: { in: taskIds } } }),
      prisma.courseTaskCompletion.deleteMany({ where: { task_id: { in: taskIds } } }),
      prisma.courseTask.deleteMany({ where: { course_id: courseId } }),
      prisma.courseEnrollment.deleteMany({ where: { course_id: courseId } }),
      prisma.course.delete({ where: { course_id: courseId } }),
    ]);
    await this.auditLogService.record({ actorId, action: "COURSE_DELETED", entityType: "course", entityId: courseId });
    return course;
  }




  // ---------------------------------------------------------------------
  // Mentor review (BR-14) — reuses PointsService, the same approval path
  // every other claim in the app uses.
  // ---------------------------------------------------------------------

  async reviewQueue() {
    return prisma.courseEnrollment.findMany({
      where: { status: EnrollmentStatus.SUBMITTED },
      orderBy: { submitted_at: "asc" },
      include: { course: true, student: { include: { student: { select: { department: true } } } } },
    });
  }

  async approve(actorId: string, enrollmentId: string) {
    const enrollment = await prisma.courseEnrollment.findUnique({ where: { enrollment_id: enrollmentId }, include: { course: true } });
    if (!enrollment) throw new NotFoundException({ code: "ENROLLMENT_NOT_FOUND" });
    if (enrollment.status !== EnrollmentStatus.SUBMITTED) {
      throw new BadRequestException({ code: "NOT_SUBMITTED", message: "Only a submitted enrollment can be approved." });
    }

    const updated = await prisma.courseEnrollment.update({
      where: { enrollment_id: enrollmentId },
      data: { status: EnrollmentStatus.APPROVED, reviewed_by: actorId, reviewed_at: new Date(), review_feedback: null },
    });

    const points = await this.coursePoints(enrollment.course.points_value);
    const award = await this.pointsService.awardForEnrollment({
      userId: enrollment.user_id,
      enrollmentId,
      points,
      reason: `Course completed: ${enrollment.course.title}`,
    });

    await this.auditLogService.record({ actorId, action: "COURSE_ENROLLMENT_APPROVED", entityType: "course_enrollment", entityId: enrollmentId });
    await this.notificationsService.create({
      userId: enrollment.user_id,
      type: NotificationType.CLAIM_APPROVED,
      title: "Course approved",
      message: `Your submission for "${enrollment.course.title}" was approved. +${points} points.`,
    });

    return { ...enrollmentDto(updated), pointsAwarded: award.totalPoints, alreadyAwarded: award.alreadyAwarded, leveledUp: award.leveledUp };
  }

  async reject(actorId: string, enrollmentId: string, feedback: string) {
    const enrollment = await prisma.courseEnrollment.findUnique({ where: { enrollment_id: enrollmentId }, include: { course: true } });
    if (!enrollment) throw new NotFoundException({ code: "ENROLLMENT_NOT_FOUND" });
    if (enrollment.status !== EnrollmentStatus.SUBMITTED) {
      throw new BadRequestException({ code: "NOT_SUBMITTED", message: "Only a submitted enrollment can be rejected." });
    }

    // Spec: rejection sends the student back to IN_PROGRESS, resubmittable.
    const updated = await prisma.courseEnrollment.update({
      where: { enrollment_id: enrollmentId },
      data: { status: EnrollmentStatus.IN_PROGRESS, reviewed_by: actorId, reviewed_at: new Date(), review_feedback: feedback },
    });

    await this.auditLogService.record({ actorId, action: "COURSE_ENROLLMENT_REJECTED", entityType: "course_enrollment", entityId: enrollmentId, metadata: { feedback } });
    await this.notificationsService.create({
      userId: enrollment.user_id,
      type: NotificationType.CLAIM_REJECTED,
      title: "Course submission needs changes",
      message: `Your submission for "${enrollment.course.title}" was sent back: ${feedback}`,
    });

    return enrollmentDto(updated);
  }

  // ---------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------

  private async findVisibleOrThrow(courseId: string, _userId: string): Promise<Course> {
    const course = await prisma.course.findUnique({ where: { course_id: courseId } });
    if (!course) throw new NotFoundException({ code: "COURSE_NOT_FOUND" });
    if (course.status !== CourseStatus.PUBLISHED) throw new ForbiddenException({ code: "COURSE_NOT_PUBLISHED" });
    return course;
  }

  private async getOrCreateEnrollment(courseId: string, userId: string, bumpToStatus?: EnrollmentStatus): Promise<CourseEnrollment> {
    const existing = await prisma.courseEnrollment.findUnique({ where: { course_id_user_id: { course_id: courseId, user_id: userId } } });
    if (existing) {
      if (bumpToStatus && existing.status === EnrollmentStatus.NOT_STARTED) {
        return prisma.courseEnrollment.update({ where: { enrollment_id: existing.enrollment_id }, data: { status: bumpToStatus } });
      }
      return existing;
    }
    return prisma.courseEnrollment.create({
      data: { course_id: courseId, user_id: userId, status: bumpToStatus ?? EnrollmentStatus.NOT_STARTED },
    });
  }

}

function courseDto(c: Course) {
  return {
    courseId: c.course_id,
    title: c.title,
    description: c.description,
    shortDescription: c.short_description,
    category: c.category,
    difficulty: c.difficulty,
    durationHours: c.duration_hours,
    durationWeeks: c.duration_weeks,
    deliveryMode: c.delivery_mode,
    enrollmentType: c.enrollment_type,
    certificateAvailable: c.certificate_available,
    isFeatured: c.is_featured,
    skillsCovered: c.skills_covered,
    prerequisites: c.prerequisites,
    learningOutcomes: c.learning_outcomes,
    toolsRequired: c.tools_required,
    targetAudience: c.target_audience,
    provider: c.provider,
    externalUrl: c.external_url,
    pointsValue: c.points_value,
    levelRequirement: c.level_requirement,
    status: c.status,
    createdAt: c.created_at,
  };
}

function enrollmentDto(e: CourseEnrollment) {
  return {
    enrollmentId: e.enrollment_id,
    courseId: e.course_id,
    status: e.status,
    submittedProofUrl: e.submitted_proof_url,
    submittedAt: e.submitted_at,
    reviewFeedback: e.review_feedback,
    reviewedAt: e.reviewed_at,
  };
}
