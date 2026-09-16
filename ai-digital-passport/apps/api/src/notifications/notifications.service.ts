import { Injectable } from "@nestjs/common";
import { prisma } from "@ai-digital-passport/database";
import type { NotificationType } from "@ai-digital-passport/shared-types";

// Internal notification table (spec 05 Section 15 + open decision #7 —
// no external push provider chosen yet; this works regardless of what's
// picked later).
@Injectable()
export class NotificationsService {
  async create(params: { userId: string; type: NotificationType; title: string; message: string }) {
    return prisma.notification.create({
      data: {
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
      },
    });
  }

  async listForUser(userId: string, skip: number, take: number) {
    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        skip,
        take,
      }),
      prisma.notification.count({ where: { user_id: userId } }),
    ]);
    return { items, total };
  }

  async markRead(userId: string, notificationId: string) {
    return prisma.notification.updateMany({
      where: { notification_id: notificationId, user_id: userId },
      data: { read_at: new Date() },
    });
  }
}
