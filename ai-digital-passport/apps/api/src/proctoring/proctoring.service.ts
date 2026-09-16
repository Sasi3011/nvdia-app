import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CourseTaskType, ProctoringStatus, prisma } from "@ai-digital-passport/database";
import { CourseStatus, NotificationType, PROCTORING_MAX_VIOLATIONS, ViolationType } from "@ai-digital-passport/shared-types";
import { AuditLogService } from "../common/audit-log/audit-log.service";
import { MentorRoutingService } from "../common/mentor-routing/mentor-routing.service";
import { NotificationsService } from "../notifications/notifications.service";

/**
 * Proctored Live Session tasks (Feature 2). What this actually guarantees,
 * stated plainly (and repeated in the student-facing UI copy — see
 * apps/web/app/courses/proctoring/page.tsx): fullscreen-exit and tab/app-
 * switch detection is a deterrent against casually switching to an AI tool
 * in the *same* device's browser. It cannot detect a second physical
 * device (e.g. a phone) being used alongside the session — this system
 * flags fullscreen/tab violations, it does not "prevent AI tool use." A
 * stronger guarantee (e.g. webcam proctoring) would need a separate,
 * explicit product decision.
 *
 * BR-15/BR-16: violations 1-3 notify the student's department mentor and
 * allow continuation; violation 4 locks the session server-side
 * (independent of whatever the client already did) and only a mentor's
 * explicit grant-access action reopens it.
 */
@Injectable()
export class ProctoringService {
  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly notificationsService: NotificationsService,
    private readonly mentorRoutingService: MentorRoutingService,
  ) {}

  async startSession(taskId: string, userId: string) {
    const task = await prisma.courseTask.findUnique({ where: { task_id: taskId }, include: { course: true } });
    if (!task) throw new NotFoundException({ code: "TASK_NOT_FOUND" });
    if (task.type !== CourseTaskType.LIVE_PROCTORED) {
      throw new BadRequestException({ code: "NOT_PROCTORED_TASK" });
    }
    if (task.course.status !== CourseStatus.PUBLISHED) throw new ForbiddenException({ code: "COURSE_NOT_PUBLISHED" });
    if (task.course.level_requirement != null) {
      const user = await prisma.user.findUniqueOrThrow({ where: { user_id: userId } });
      if (user.current_level_id < task.course.level_requirement) throw new ForbiddenException({ code: "LEVEL_TOO_LOW" });
    }

    const latest = await prisma.proctoringSession.findFirst({
      where: { task_id: taskId, user_id: userId },
      orderBy: { started_at: "desc" },
    });

    // BR-16, server-side enforcement: a LOCKED session can never be
    // restarted by the student, even if a tampered client tries to skip
    // straight to the session view.
    if (latest?.status === ProctoringStatus.LOCKED) {
      throw new ForbiddenException({
        code: "SESSION_LOCKED",
        message: "This task is locked after repeated violations. A mentor must grant access before you can retry.",
      });
    }
    if (latest?.status === ProctoringStatus.ACTIVE) return sessionDto(latest);

    const session = await prisma.proctoringSession.create({ data: { task_id: taskId, user_id: userId } });
    return sessionDto(session);
  }

  async reportViolation(sessionId: string, userId: string, violationType: ViolationType) {
    const session = await this.ownedActiveSessionOrThrow(sessionId, userId);

    await prisma.proctoringViolation.create({ data: { session_id: sessionId, violation_type: violationType } });
    const violationCount = session.violation_count + 1;
    const locked = violationCount >= PROCTORING_MAX_VIOLATIONS;

    const student = await prisma.user.findUniqueOrThrow({ where: { user_id: userId } });
    const task = await prisma.courseTask.findUniqueOrThrow({ where: { task_id: session.task_id }, include: { course: true } });

    if (locked) {
      const updated = await prisma.proctoringSession.update({
        where: { session_id: sessionId },
        data: { violation_count: violationCount, status: ProctoringStatus.LOCKED, locked_at: new Date(), ended_at: new Date() },
      });
      await this.auditLogService.record({
        actorId: null,
        action: "PROCTORING_LOCKED",
        entityType: "proctoring_session",
        entityId: sessionId,
        metadata: { userId, taskId: session.task_id, violationCount },
      });
      await this.mentorRoutingService.notifyDepartmentMentors(student.department, {
        type: NotificationType.SYSTEM,
        title: "Student locked out of proctored session",
        message: `${student.full_name} was locked out of "${task.title}" (${task.course.title}) after ${violationCount} violations.`,
      });
      await prisma.proctoringViolation.updateMany({ where: { session_id: sessionId }, data: { mentor_notified: true } });
      return { locked: true, violationCount, remaining: 0, session: sessionDto(updated) };
    }

    const updated = await prisma.proctoringSession.update({
      where: { session_id: sessionId },
      data: { violation_count: violationCount },
    });
    await this.mentorRoutingService.notifyDepartmentMentors(student.department, {
      type: NotificationType.SYSTEM,
      title: "Proctoring violation",
      message: `${student.full_name} triggered a ${violationType} violation during "${task.title}" (${violationCount}/${PROCTORING_MAX_VIOLATIONS}).`,
    });
    await prisma.proctoringViolation.updateMany({
      where: { session_id: sessionId, mentor_notified: false },
      data: { mentor_notified: true },
    });

    return { locked: false, violationCount, remaining: PROCTORING_MAX_VIOLATIONS - violationCount, session: sessionDto(updated) };
  }

  async completeSession(sessionId: string, userId: string) {
    const session = await this.ownedActiveSessionOrThrow(sessionId, userId);
    const updated = await prisma.proctoringSession.update({
      where: { session_id: session.session_id },
      data: { status: ProctoringStatus.COMPLETED, ended_at: new Date() },
    });
    return sessionDto(updated);
  }

  // ---------------------------------------------------------------------
  // Mentor — "Proctoring Locks" page
  // ---------------------------------------------------------------------

  async listLocked() {
    const sessions = await prisma.proctoringSession.findMany({
      where: { status: ProctoringStatus.LOCKED },
      orderBy: { locked_at: "desc" },
      include: { task: { include: { course: true } }, user: true },
    });
    return sessions.map((s) => ({
      sessionId: s.session_id,
      violationCount: s.violation_count,
      lockedAt: s.locked_at,
      task: { taskId: s.task.task_id, title: s.task.title },
      course: { courseId: s.task.course.course_id, title: s.task.course.title },
      student: { userId: s.user.user_id, fullName: s.user.full_name, department: s.user.department },
    }));
  }

  async grantAccess(mentorId: string, sessionId: string) {
    const session = await prisma.proctoringSession.findUnique({ where: { session_id: sessionId }, include: { task: { include: { course: true } }, user: true } });
    if (!session) throw new NotFoundException({ code: "SESSION_NOT_FOUND" });
    if (session.status !== ProctoringStatus.LOCKED) throw new BadRequestException({ code: "NOT_LOCKED" });

    const updated = await prisma.proctoringSession.update({
      where: { session_id: sessionId },
      data: {
        status: ProctoringStatus.ACTIVE,
        violation_count: 0,
        locked_at: null,
        ended_at: null,
        unlocked_by: mentorId,
        unlocked_at: new Date(),
      },
    });

    await this.auditLogService.record({
      actorId: mentorId,
      action: "PROCTORING_UNLOCKED",
      entityType: "proctoring_session",
      entityId: sessionId,
      metadata: { userId: session.user_id, taskId: session.task_id },
    });
    await this.notificationsService.create({
      userId: session.user_id,
      type: NotificationType.SYSTEM,
      title: "Proctoring access restored",
      message: `A mentor granted you access to retry "${session.task.title}" (${session.task.course.title}).`,
    });

    return sessionDto(updated);
  }

  private async ownedActiveSessionOrThrow(sessionId: string, userId: string) {
    const session = await prisma.proctoringSession.findUnique({ where: { session_id: sessionId } });
    if (!session || session.user_id !== userId) throw new NotFoundException({ code: "SESSION_NOT_FOUND" });
    if (session.status === ProctoringStatus.LOCKED) throw new ForbiddenException({ code: "SESSION_LOCKED" });
    if (session.status === ProctoringStatus.COMPLETED) throw new BadRequestException({ code: "SESSION_ALREADY_COMPLETED" });
    return session;
  }
}

function sessionDto(s: { session_id: string; task_id: string; status: string; violation_count: number; started_at: Date; ended_at: Date | null }) {
  return {
    sessionId: s.session_id,
    taskId: s.task_id,
    status: s.status,
    violationCount: s.violation_count,
    startedAt: s.started_at,
    endedAt: s.ended_at,
  };
}
