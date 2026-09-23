import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import type { ClassTeachingLog, Event } from "@ai-digital-passport/database";
import { CreateClassTeachingLogSchema, UpdateClassTeachingLogSchema, UserRole } from "@ai-digital-passport/shared-types";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { Roles } from "../common/auth/roles.decorator";
import type { RequestUser } from "../common/auth/types";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { ClassTeachingLogsService } from "./class-teaching-logs.service";

function logDto(l: ClassTeachingLog & { event?: Pick<Event, "title" | "department" | "year">; coMentors?: { id: string; name: string }[] }) {
  return {
    logId: l.log_id,
    eventId: l.event_id,
    eventTitle: l.event?.title ?? null,
    eventDepartment: l.event?.department ?? null,
    eventYear: l.event?.year ?? null,
    classDate: l.class_date,
    topicsCovered: l.topics_covered,
    materialsUrl: l.materials_url,
    notes: l.notes,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
    coMentors: l.coMentors,
  };
}

// Mentor — CoE Class Teaching Logs: faculty record what they taught in a
// CoE Class session so admin has visibility into actual class content,
// not just QR attendance counts.
@Controller("mentor/coe-classes")
@Roles(UserRole.MENTOR, UserRole.ADMIN)
export class MentorClassTeachingLogsController {
  constructor(private readonly service: ClassTeachingLogsService) {}

  @Get("events")
  async events() {
    const events = await this.service.listEventsForMentor();
    return events.map((e) => ({
      eventId: e.event_id,
      title: e.title,
      department: e.department,
      year: e.year,
      sessionType: e.session_type,
      startsAt: e.starts_at,
    }));
  }

  @Get("logs")
  async myLogs(@CurrentUser() user: RequestUser) {
    const logs = await this.service.listForMentor(user.userId);
    return logs.map(logDto);
  }

  @Post("logs")
  async create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(CreateClassTeachingLogSchema)) body: ReturnType<typeof CreateClassTeachingLogSchema.parse>,
  ) {
    const log = await this.service.create(user.userId, body);
    return logDto(log);
  }

  @Patch("logs/:id")
  async update(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateClassTeachingLogSchema)) body: ReturnType<typeof UpdateClassTeachingLogSchema.parse>,
  ) {
    const log = await this.service.update(user.userId, id, body);
    return logDto(log);
  }

  @Delete("logs/:id")
  async remove(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    await this.service.delete(user.userId, id);
    return { deleted: true };
  }
}
