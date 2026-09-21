import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CourseTaskType, EnrollmentStatus, prisma } from "@ai-digital-passport/database";
import type { Course, CourseEnrollment, CourseTask } from "@ai-digital-passport/database";
import { CourseStatus, NotificationType } from "@ai-digital-passport/shared-types";
import { AuditLogService } from "../common/audit-log/audit-log.service";
import { MentorRoutingService } from "../common/mentor-routing/mentor-routing.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PointsService } from "../points/points.service";

type CourseWithTasks = Course & { tasks: CourseTask[] };

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

  async listPublishedForStudent(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({ where: { user_id: userId } });
    const courses = await prisma.course.findMany({
      where: {
        status: CourseStatus.PUBLISHED,
        OR: [{ level_requirement: null }, { level_requirement: { lte: user.current_level_id } }],
      },
      orderBy: { created_at: "desc" },
    });
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { user_id: userId, course_id: { in: courses.map((c) => c.course_id) } },
    });
    const byCourseId = new Map(enrollments.map((e) => [e.course_id, e]));
    return courses.map((c) => ({ ...courseDto(c), enrollmentStatus: byCourseId.get(c.course_id)?.status ?? EnrollmentStatus.NOT_STARTED }));
  }

  // Visiting the detail page is what creates the enrollment row (lazily —
  // no separate "enroll" click required by the spec's student flow).
  async getDetailForStudent(courseId: string, userId: string) {
    const course = await this.findVisibleOrThrow(courseId, userId);
    const enrollment = await this.getOrCreateEnrollment(courseId, userId);
    const completions = await prisma.courseTaskCompletion.findMany({
      where: { user_id: userId, task: { course_id: courseId } },
    });
    const completedStandardTaskIds = new Set(completions.map((c) => c.task_id));
    const proctoringSessions = await prisma.proctoringSession.findMany({
      where: { user_id: userId, task: { course_id: courseId } },
      orderBy: { started_at: "desc" },
    });
    const latestSessionByTask = new Map<string, (typeof proctoringSessions)[number]>();
    for (const session of proctoringSessions) {
      if (!latestSessionByTask.has(session.task_id)) latestSessionByTask.set(session.task_id, session);
    }

    let anyPreviousRequiredIncomplete = false;

    return {
      ...courseDto(course),
      enrollment: enrollmentDto(enrollment),
      tasks: course.tasks
        .sort((a, b) => a.sequence_order - b.sequence_order)
        .map((t) => {
          let isCompleted = false;
          if (t.type === CourseTaskType.STANDARD) {
            isCompleted = completedStandardTaskIds.has(t.task_id);
          } else if (t.type === CourseTaskType.MCQ || t.type === CourseTaskType.CODING || t.type === CourseTaskType.LIVE_PROCTORED) {
            isCompleted = latestSessionByTask.get(t.task_id)?.status === "COMPLETED";
          }

          const isLocked = anyPreviousRequiredIncomplete;
          if (t.is_required && !isCompleted) {
            anyPreviousRequiredIncomplete = true;
          }

          const completionRecord = completions.find(c => c.task_id === t.task_id);

          return {
            taskId: t.task_id,
            title: t.title,
            type: t.type,
            instructions: t.instructions,
            content: t.content,
            sequenceOrder: t.sequence_order,
            isRequired: t.is_required,
            completed: isCompleted,
            locked: isLocked,
            score: completionRecord?.score ?? null,
            feedback: completionRecord?.feedback ?? null,
            proctoringStatus: (t.type !== CourseTaskType.STANDARD) ? (latestSessionByTask.get(t.task_id)?.status ?? null) : null,
          };
        }),
    };
  }

  async completeStandardTask(courseId: string, taskId: string, userId: string) {
    const task = await prisma.courseTask.findUniqueOrThrow({ where: { task_id: taskId } });
    if (task.course_id !== courseId) throw new NotFoundException({ code: "TASK_NOT_FOUND" });
    if (task.type !== CourseTaskType.STANDARD) {
      throw new BadRequestException({ code: "NOT_A_STANDARD_TASK", message: "Live proctored tasks are completed via the proctoring flow, not this endpoint." });
    }
    await this.findVisibleOrThrow(courseId, userId);
    await prisma.courseTaskCompletion.upsert({
      where: { task_id_user_id: { task_id: taskId, user_id: userId } },
      update: {},
      create: { task_id: taskId, user_id: userId },
    });
    await this.getOrCreateEnrollment(courseId, userId, EnrollmentStatus.IN_PROGRESS);
    return { taskId, completed: true };
  }

  async submitProctoredTask(courseId: string, taskId: string, userId: string, submission: any) {
    const task = await prisma.courseTask.findUniqueOrThrow({ where: { task_id: taskId } });
    if (task.course_id !== courseId) throw new NotFoundException({ code: "TASK_NOT_FOUND" });
    if (task.type === CourseTaskType.STANDARD) {
      throw new BadRequestException({ code: "INVALID_TASK_TYPE", message: "Standard tasks cannot be submitted via proctored evaluation." });
    }

    const session = await prisma.proctoringSession.findFirst({
      where: { task_id: taskId, user_id: userId },
      orderBy: { started_at: "desc" },
    });

    if (!session || session.status === "LOCKED") {
      throw new ForbiddenException({ code: "SESSION_LOCKED", message: "Your session is locked or does not exist." });
    }

    let score = 0;
    let feedback = "";

    if (task.type === CourseTaskType.MCQ) {
      // Mock MCQ Evaluation
      // Expecting content: { questions: [{ id, answer }] }
      // Expecting submission: { answers: { [id]: string } }
      const content = task.content as any;
      if (content && content.questions && submission.answers) {
        let correctCount = 0;
        content.questions.forEach((q: any) => {
          if (submission.answers[q.id] === q.answer) correctCount++;
        });
        score = Math.round((correctCount / content.questions.length) * 100);
        feedback = `You scored ${score}% (${correctCount}/${content.questions.length}).`;
      }
    } else if (task.type === CourseTaskType.CODING) {
      // Mock LeetCode style Evaluation
      // In a real system, this would execute the code in a sandbox container.
      // For this demo, we simulate success if they submit non-empty code.
      if (submission.code && submission.code.trim().length > 10) {
        score = 100;
        feedback = "All 15 test cases passed! (Simulated)";
      } else {
        score = 0;
        feedback = "Compilation Error or Failed Test Cases.";
      }
    }

    await prisma.proctoringSession.update({
      where: { session_id: session.session_id },
      data: {
        status: "COMPLETED",
        ended_at: new Date(),
      },
    });

    await prisma.courseTaskCompletion.upsert({
      where: { task_id_user_id: { task_id: taskId, user_id: userId } },
      update: { score, feedback },
      create: { task_id: taskId, user_id: userId, score, feedback },
    });

    await this.getOrCreateEnrollment(courseId, userId, EnrollmentStatus.IN_PROGRESS);

    return { taskId, score, feedback, completed: true };
  }

  async startProctoredTask(courseId: string, taskId: string, userId: string) {
    const task = await prisma.courseTask.findUniqueOrThrow({ where: { task_id: taskId } });
    if (task.course_id !== courseId) throw new NotFoundException({ code: "TASK_NOT_FOUND" });
    if (task.type === CourseTaskType.STANDARD) {
      throw new BadRequestException({ code: "INVALID_TASK_TYPE", message: "Cannot start a proctoring session for a standard task." });
    }

    await this.findVisibleOrThrow(courseId, userId);

    const session = await prisma.proctoringSession.create({
      data: {
        task_id: taskId,
        user_id: userId,
        status: "ACTIVE",
      },
    });

    return { sessionId: session.session_id };
  }

  async recordViolation(courseId: string, taskId: string, userId: string, violationTypeStr: string) {
    const session = await prisma.proctoringSession.findFirst({
      where: { task_id: taskId, user_id: userId },
      orderBy: { started_at: "desc" },
    });

    if (!session || session.status !== "ACTIVE") {
      throw new ForbiddenException({ code: "INVALID_SESSION", message: "No active session to record violation on." });
    }

    const updatedSession = await prisma.proctoringSession.update({
      where: { session_id: session.session_id },
      data: {
        violation_count: { increment: 1 },
      },
    });

    // We can dynamically cast the string since schema is out of sync in the type defs for this snippet
    await prisma.proctoringViolation.create({
      data: {
        session_id: session.session_id,
        violation_type: violationTypeStr as any,
      },
    });

    if (updatedSession.violation_count >= 5) {
      await prisma.proctoringSession.update({
        where: { session_id: session.session_id },
        data: {
          status: "LOCKED",
          locked_at: new Date(),
        },
      });
      return { locked: true, violations: updatedSession.violation_count };
    }

    return { locked: false, violations: updatedSession.violation_count };
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
    const student = await prisma.user.findUniqueOrThrow({ where: { user_id: userId } });
    const course = await prisma.course.findUniqueOrThrow({ where: { course_id: courseId } });
    await this.mentorRoutingService.notifyDepartmentMentors(student.department, {
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
    const course = await prisma.course.findUnique({ where: { course_id: courseId }, include: { tasks: { orderBy: { sequence_order: "asc" } } } });
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
    return course;
  }

  async update(actorId: string, courseId: string, input: {
    title: string; description: string; provider: string; externalUrl: string;
    pointsValue: number; levelRequirement?: number | null; status: CourseStatus;
    shortDescription?: string; category: string; difficulty: string; durationHours: number; durationWeeks?: number | null;
    deliveryMode: string; enrollmentType: string; certificateAvailable: boolean; isFeatured: boolean;
    skillsCovered: string[]; prerequisites: string[]; learningOutcomes: string[]; toolsRequired: string[]; targetAudience?: string;
  }) {
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
    return course;
  }

  async setStatus(actorId: string, courseId: string, status: CourseStatus) {
    const course = await prisma.course.update({ where: { course_id: courseId }, data: { status } });
    await this.auditLogService.record({ actorId, action: `COURSE_${status}`, entityType: "course", entityId: courseId });
    return course;
  }

  async deleteCourse(actorId: string, courseId: string) {
    const course = await prisma.course.delete({ where: { course_id: courseId } });
    await this.auditLogService.record({ actorId, action: "COURSE_DELETED", entityType: "course", entityId: courseId });
    return course;
  }

  async createTask(actorId: string, courseId: string, input: {
    title: string; type: CourseTaskType; instructions?: string; content?: any; sequenceOrder: number; isRequired: boolean;
  }) {
    const task = await prisma.courseTask.create({
      data: {
        course_id: courseId,
        title: input.title,
        type: input.type,
        instructions: input.instructions ?? null,
        content: input.content ?? null,
        sequence_order: input.sequenceOrder,
        is_required: input.isRequired,
      },
    });
    await this.auditLogService.record({ actorId, action: "COURSE_TASK_CREATED", entityType: "course_task", entityId: task.task_id, metadata: { courseId } });
    return task;
  }

  async updateTask(actorId: string, courseId: string, taskId: string, input: {
    title: string; type: CourseTaskType; instructions?: string; content?: any; sequenceOrder: number; isRequired: boolean;
  }) {
    const existing = await prisma.courseTask.findUniqueOrThrow({ where: { task_id: taskId } });
    if (existing.course_id !== courseId) throw new NotFoundException({ code: "TASK_NOT_FOUND" });
    const task = await prisma.courseTask.update({
      where: { task_id: taskId },
      data: {
        title: input.title,
        type: input.type,
        instructions: input.instructions ?? null,
        content: input.content ?? null,
        sequence_order: input.sequenceOrder,
        is_required: input.isRequired,
      },
    });
    await this.auditLogService.record({ actorId, action: "COURSE_TASK_UPDATED", entityType: "course_task", entityId: taskId, metadata: { courseId } });
    return task;
  }

  async deleteTask(actorId: string, courseId: string, taskId: string) {
    const existing = await prisma.courseTask.findUniqueOrThrow({ where: { task_id: taskId } });
    if (existing.course_id !== courseId) throw new NotFoundException({ code: "TASK_NOT_FOUND" });
    const task = await prisma.courseTask.delete({ where: { task_id: taskId } });
    await this.auditLogService.record({ actorId, action: "COURSE_TASK_DELETED", entityType: "course_task", entityId: taskId, metadata: { courseId } });
    return task;
  }

  // ---------------------------------------------------------------------
  // Mentor review (BR-14) — reuses PointsService, the same approval path
  // every other claim in the app uses.
  // ---------------------------------------------------------------------

  async reviewQueue() {
    return prisma.courseEnrollment.findMany({
      where: { status: EnrollmentStatus.SUBMITTED },
      orderBy: { submitted_at: "asc" },
      include: { course: true, student: true },
    });
  }

  async approve(actorId: string, enrollmentId: string) {
    const enrollment = await prisma.courseEnrollment.findUnique({ where: { enrollment_id: enrollmentId }, include: { course: { include: { tasks: true } } } });
    if (!enrollment) throw new NotFoundException({ code: "ENROLLMENT_NOT_FOUND" });
    if (enrollment.status !== EnrollmentStatus.SUBMITTED) {
      throw new BadRequestException({ code: "NOT_SUBMITTED", message: "Only a submitted enrollment can be approved." });
    }

    // BR-14: every required task must be COMPLETED (not LOCKED) for this
    // student before proof approval can award points.
    const incomplete = await this.findIncompleteRequiredTasks(enrollment.course as CourseWithTasks, enrollment.user_id);
    if (incomplete.length > 0) {
      throw new BadRequestException({
        code: "REQUIRED_TASKS_INCOMPLETE",
        message: `${incomplete.length} required task(s) are not complete for this student yet.`,
        incompleteTasks: incomplete.map((t) => t.title),
      });
    }

    const updated = await prisma.courseEnrollment.update({
      where: { enrollment_id: enrollmentId },
      data: { status: EnrollmentStatus.APPROVED, reviewed_by: actorId, reviewed_at: new Date(), review_feedback: null },
    });

    const award = await this.pointsService.awardForEnrollment({
      userId: enrollment.user_id,
      enrollmentId,
      points: enrollment.course.points_value,
      reason: `Course completed: ${enrollment.course.title}`,
    });

    await this.auditLogService.record({ actorId, action: "COURSE_ENROLLMENT_APPROVED", entityType: "course_enrollment", entityId: enrollmentId });
    await this.notificationsService.create({
      userId: enrollment.user_id,
      type: NotificationType.CLAIM_APPROVED,
      title: "Course approved",
      message: `Your submission for "${enrollment.course.title}" was approved. +${enrollment.course.points_value} points.`,
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

  private async findVisibleOrThrow(courseId: string, userId: string): Promise<CourseWithTasks> {
    const course = await prisma.course.findUnique({ where: { course_id: courseId }, include: { tasks: { orderBy: { sequence_order: "asc" } } } });
    if (!course) throw new NotFoundException({ code: "COURSE_NOT_FOUND" });
    if (course.status !== CourseStatus.PUBLISHED) throw new ForbiddenException({ code: "COURSE_NOT_PUBLISHED" });
    if (course.level_requirement != null) {
      const user = await prisma.user.findUniqueOrThrow({ where: { user_id: userId } });
      if (user.current_level_id < course.level_requirement) {
        throw new ForbiddenException({ code: "LEVEL_TOO_LOW", message: `This course requires level ${course.level_requirement}.` });
      }
    }
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

  async findIncompleteRequiredTasks(course: CourseWithTasks, userId: string): Promise<CourseTask[]> {
    const required = course.tasks.filter((t) => t.is_required);
    if (required.length === 0) return [];
    const [completions, sessions] = await Promise.all([
      prisma.courseTaskCompletion.findMany({ where: { user_id: userId, task_id: { in: required.map((t) => t.task_id) } } }),
      prisma.proctoringSession.findMany({ where: { user_id: userId, task_id: { in: required.map((t) => t.task_id) } }, orderBy: { started_at: "desc" } }),
    ]);
    const completedStandard = new Set(completions.map((c) => c.task_id));
    const latestSessionByTask = new Map<string, (typeof sessions)[number]>();
    for (const s of sessions) if (!latestSessionByTask.has(s.task_id)) latestSessionByTask.set(s.task_id, s);

    return required.filter((t) => {
      if (t.type === CourseTaskType.STANDARD) return !completedStandard.has(t.task_id);
      return latestSessionByTask.get(t.task_id)?.status !== "COMPLETED";
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
