import { Injectable } from "@nestjs/common";
import { prisma, RoleName } from "@ai-digital-passport/database";
import type { NotificationType } from "@ai-digital-passport/shared-types";
import { NotificationsService } from "../../notifications/notifications.service";

/**
 * Routes course-submission and proctoring-violation notifications to the
 * mentor assigned to a student's department ("one department, one mentor",
 * product-owner request) instead of the shared mentor pool the rest of the
 * platform uses for claim review. Falls back to every mentor when a
 * department has no mentor assigned yet, so a notification is never
 * silently dropped for a department nobody has configured.
 *
 * Reuses NotificationsService (the same internal table every other
 * notification in the app uses) rather than a parallel pipeline.
 */
@Injectable()
export class MentorRoutingService {
  constructor(private readonly notificationsService: NotificationsService) {}

  async notifyDepartmentMentors(
    department: string,
    payload: { type: NotificationType; title: string; message: string },
  ): Promise<string[]> {
    const assigned = await prisma.user.findMany({
      where: { mentor_department: department, user_roles: { some: { role: { name: RoleName.MENTOR } } } },
    });
    const targets =
      assigned.length > 0
        ? assigned
        : await prisma.user.findMany({ where: { user_roles: { some: { role: { name: RoleName.MENTOR } } } } });

    await Promise.all(targets.map((mentor) => this.notificationsService.create({ userId: mentor.user_id, ...payload })));
    return targets.map((mentor) => mentor.user_id);
  }
}
