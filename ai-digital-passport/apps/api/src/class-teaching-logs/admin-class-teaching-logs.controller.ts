import { Controller, Get } from "@nestjs/common";
import type { ClassTeachingLog, Event, User } from "@ai-digital-passport/database";
import { UserRole } from "@ai-digital-passport/shared-types";
import { Roles } from "../common/auth/roles.decorator";
import { ClassTeachingLogsService } from "./class-teaching-logs.service";

function adminLogDto(
  l: ClassTeachingLog & {
    event?: Pick<Event, "title" | "department" | "year" | "session_type">;
    mentor?: Pick<User, "full_name" | "email" | "department">;
  },
) {
  return {
    logId: l.log_id,
    eventId: l.event_id,
    eventTitle: l.event?.title ?? null,
    eventDepartment: l.event?.department ?? null,
    eventYear: l.event?.year ?? null,
    eventSessionType: l.event?.session_type ?? null,
    mentorName: l.mentor?.full_name ?? null,
    mentorEmail: l.mentor?.email ?? null,
    mentorDepartment: l.mentor?.department ?? null,
    classDate: l.class_date,
    topicsCovered: l.topics_covered,
    materialsUrl: l.materials_url,
    notes: l.notes,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
  };
}

// Admin — read-only view of every mentor's CoE Class teaching logs
// (Page 25 companion). No department filter: admin sees every submission
// across every department, same convention as the rest of the console.
@Controller("admin/coe-classes/logs")
@Roles(UserRole.ADMIN)
export class AdminClassTeachingLogsController {
  constructor(private readonly service: ClassTeachingLogsService) {}

  @Get()
  async list() {
    const logs = await this.service.listForAdmin();
    return logs.map(adminLogDto);
  }
}
