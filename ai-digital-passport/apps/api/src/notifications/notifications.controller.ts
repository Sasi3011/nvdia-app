import { Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { PaginationQuerySchema } from "@ai-digital-passport/shared-types";
import { CurrentUser } from "../common/auth/current-user.decorator";
import type { RequestUser } from "../common/auth/types";
import { pageSkipTake, toPaginatedResult } from "../common/pagination/pagination";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { NotificationsService } from "./notifications.service";

// GET /notifications — in-app notification center (Page 19), all roles.
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: { page: number; pageSize: number },
  ) {
    const { skip, take } = pageSkipTake(query);
    const { items, total } = await this.notificationsService.listForUser(user.userId, skip, take);
    return toPaginatedResult(
      items.map((n) => ({
        notificationId: n.notification_id,
        type: n.type,
        title: n.title,
        message: n.message,
        readAt: n.read_at,
        createdAt: n.created_at,
      })),
      total,
      query,
    );
  }

  @Patch(":id/read")
  async markRead(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    await this.notificationsService.markRead(user.userId, id);
    return { ok: true };
  }
}
