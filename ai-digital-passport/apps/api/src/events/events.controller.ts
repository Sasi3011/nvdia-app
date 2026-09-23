import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ScanQrSchema } from "@ai-digital-passport/shared-types";
import { CurrentUser } from "../common/auth/current-user.decorator";
import type { RequestUser } from "../common/auth/types";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { EventsService } from "./events.service";

// GET /events, POST /events/:id/scan — CoE Class schedule + live QR
// attendance (Page 17). `:id` on scan is the event_session id — the
// scanned token is bound to one session/time window (Section 13.1).
@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async list(@CurrentUser() user: RequestUser) {
    return this.eventsService.listForStudent(user.userId);
  }

  @Post("scan")
  async scanGlobal(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(ScanQrSchema)) body: ReturnType<typeof ScanQrSchema.parse>,
  ) {
    return this.eventsService.scanGlobal(user.userId, body.token);
  }

  @Post(":id/scan")
  async scan(
    @CurrentUser() user: RequestUser,
    @Param("id") sessionId: string,
    @Body(new ZodValidationPipe(ScanQrSchema)) body: ReturnType<typeof ScanQrSchema.parse>,
  ) {
    return this.eventsService.scan(sessionId, user.userId, body.token);
  }
}
