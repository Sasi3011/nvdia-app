import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import type { Event, EventSession } from "@ai-digital-passport/database";
import { CreateEventSchema, CreateEventSessionSchema, UserRole } from "@ai-digital-passport/shared-types";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { Roles } from "../common/auth/roles.decorator";
import type { RequestUser } from "../common/auth/types";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { EventsService } from "./events.service";

function sessionDto(s: EventSession) {
  return {
    sessionId: s.session_id,
    eventId: s.event_id,
    title: s.title,
    startsAt: s.starts_at,
    endsAt: s.ends_at,
    qrActive: s.qr_active,
    qrWindowSeconds: s.qr_window_seconds,
  };
}

function eventDto(e: Event & { sessions?: EventSession[] }) {
  return {
    eventId: e.event_id,
    title: e.title,
    description: e.description,
    location: e.location,
    category: e.category,
    startsAt: e.starts_at,
    endsAt: e.ends_at,
    createdAt: e.created_at,
    sessions: e.sessions?.map(sessionDto) ?? [],
  };
}

// Admin — Event & QR Management (Page 25).
@Controller("admin/events")
@Roles(UserRole.ADMIN)
export class AdminEventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async listEvents() {
    const events = await this.eventsService.listEvents();
    return events.map(eventDto);
  }

  @Get(":eventId")
  async getEvent(@Param("eventId") eventId: string) {
    return eventDto(await this.eventsService.getEvent(eventId));
  }

  @Post()
  async createEvent(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(CreateEventSchema)) body: ReturnType<typeof CreateEventSchema.parse>,
  ) {
    return eventDto(await this.eventsService.createEvent(user.userId, body));
  }

  @Post(":eventId/sessions")
  async createSession(
    @CurrentUser() user: RequestUser,
    @Param("eventId") eventId: string,
    @Body(new ZodValidationPipe(CreateEventSessionSchema)) body: ReturnType<typeof CreateEventSessionSchema.parse>,
  ) {
    return sessionDto(await this.eventsService.createSession(user.userId, eventId, body));
  }

  @Post("sessions/:sessionId/activate")
  async activate(@CurrentUser() user: RequestUser, @Param("sessionId") sessionId: string) {
    return sessionDto(await this.eventsService.activateSession(user.userId, sessionId));
  }

  @Post("sessions/:sessionId/deactivate")
  async deactivate(@CurrentUser() user: RequestUser, @Param("sessionId") sessionId: string) {
    return sessionDto(await this.eventsService.deactivateSession(user.userId, sessionId));
  }

  // Polled by the venue display to show the live-refreshing QR (15s).
  @Get("sessions/:sessionId/qr")
  async currentQr(@Param("sessionId") sessionId: string) {
    const qr = await this.eventsService.currentQr(sessionId);
    return { token: qr.token, windowStart: qr.windowStart, windowEnd: qr.windowEnd, refreshSeconds: qr.refreshSeconds };
  }

  @Get("sessions/:sessionId/attendance-count")
  async attendanceCount(@Param("sessionId") sessionId: string) {
    return { count: await this.eventsService.liveAttendanceCount(sessionId) };
  }
}
