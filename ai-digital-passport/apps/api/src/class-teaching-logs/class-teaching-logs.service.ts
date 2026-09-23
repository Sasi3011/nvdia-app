import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@ai-digital-passport/database";
import type { CreateClassTeachingLogInput, UpdateClassTeachingLogInput } from "@ai-digital-passport/shared-types";

// Faculty-authored record of what was taught in a CoE Class session
// (Event), separate from Attendance (which only proves a student checked
// in). Mentors manage their own log entries; admin reads every entry
// across all departments/mentors — same "department is metadata, not an
// access filter" convention used for claims/courses elsewhere in the app.
@Injectable()
export class ClassTeachingLogsService {
  // ---- Mentor: pick which CoE Class (Event) they taught ------------------

  async listEventsForMentor() {
    return prisma.event.findMany({
      orderBy: { starts_at: "desc" },
      select: {
        event_id: true,
        title: true,
        department: true,
        year: true,
        session_type: true,
        starts_at: true,
      },
    });
  }

  // ---- Mentor: their own teaching logs ------------------------------------

  async listForMentor(mentorId: string) {
    const logs = await prisma.classTeachingLog.findMany({
      where: {
        OR: [
          { mentor_id: mentorId },
          { co_mentor_ids: { has: mentorId } },
        ],
      },
      orderBy: { class_date: "desc" },
      include: { event: { select: { title: true, department: true, year: true } } },
    });

    // Fetch the mentor names for the UI
    const allMentorIds = new Set<string>();
    for (const log of logs) {
      if (log.co_mentor_ids) {
        for (const id of log.co_mentor_ids) {
          allMentorIds.add(id);
        }
      }
    }
    
    let coMentors: Record<string, string> = {};
    if (allMentorIds.size > 0) {
      const users = await prisma.user.findMany({
        where: { user_id: { in: Array.from(allMentorIds) } },
        select: { user_id: true, full_name: true }
      });
      coMentors = Object.fromEntries(users.map(u => [u.user_id, u.full_name]));
    }

    return logs.map(log => ({
      ...log,
      coMentors: log.co_mentor_ids?.map(id => ({ id, name: coMentors[id] || "Unknown" })) || []
    }));
  }

  async create(mentorId: string, input: CreateClassTeachingLogInput) {
    const event = await prisma.event.findUnique({ where: { event_id: input.eventId } });
    if (!event) throw new NotFoundException({ code: "EVENT_NOT_FOUND", message: "That CoE Class could not be found." });

    return prisma.classTeachingLog.create({
      data: {
        event_id: input.eventId,
        mentor_id: mentorId,
        co_mentor_ids: input.coMentorIds ?? [],
        class_date: input.classDate,
        topics_covered: input.topicsCovered,
        materials_url: input.materialsUrl,
        notes: input.notes,
      },
      include: { event: { select: { title: true, department: true, year: true } } },
    });
  }

  async update(mentorId: string, logId: string, input: UpdateClassTeachingLogInput) {
    const existing = await prisma.classTeachingLog.findUnique({ where: { log_id: logId } });
    if (!existing) throw new NotFoundException({ code: "LOG_NOT_FOUND" });
    // A mentor can only edit logs they created or are co-mentoring.
    if (existing.mentor_id !== mentorId && !(existing.co_mentor_ids || []).includes(mentorId)) {
      throw new ForbiddenException({ code: "NOT_YOUR_LOG", message: "You can only edit your own teaching logs." });
    }

    return prisma.classTeachingLog.update({
      where: { log_id: logId },
      data: {
        co_mentor_ids: input.coMentorIds !== undefined ? input.coMentorIds : undefined,
        class_date: input.classDate,
        topics_covered: input.topicsCovered,
        materials_url: input.materialsUrl,
        notes: input.notes,
      },
      include: { event: { select: { title: true, department: true, year: true } } },
    });
  }

  async delete(mentorId: string, logId: string) {
    const existing = await prisma.classTeachingLog.findUnique({ where: { log_id: logId } });
    if (!existing) throw new NotFoundException({ code: "LOG_NOT_FOUND" });
    if (existing.mentor_id !== mentorId && !(existing.co_mentor_ids || []).includes(mentorId)) {
      throw new ForbiddenException({ code: "NOT_YOUR_LOG", message: "You can only delete your own teaching logs." });
    }
    await prisma.classTeachingLog.delete({ where: { log_id: logId } });
  }

  // ---- Admin: read every mentor's teaching logs ---------------------------

  async listForAdmin() {
    return prisma.classTeachingLog.findMany({
      orderBy: { class_date: "desc" },
      include: {
        event: { select: { title: true, department: true, year: true, session_type: true } },
        mentor: { select: { full_name: true, email: true, faculty: { select: { department: true } } } },
      },
    });
  }
}
