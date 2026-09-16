import { Body, Controller, Param, Post } from "@nestjs/common";
import { ScanQrSchema } from "@ai-digital-passport/shared-types";
import { CurrentUser } from "../common/auth/current-user.decorator";
import type { RequestUser } from "../common/auth/types";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { EventsService } from "./events.service";

// POST /events/:id/scan — live-event QR attendance (Page 17). `:id` is the
// event_session id — the scanned token is bound to one session/time
// window (Section 13.1).
@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post(":id/scan")
  async scan(
    @CurrentUser() user: RequestUser,
    @Param("id") sessionId: string,
    @Body(new ZodValidationPipe(ScanQrSchema)) body: ReturnType<typeof ScanQrSchema.parse>,
  ) {
    return this.eventsService.scan(sessionId, user.userId, body.token);
  }
}
