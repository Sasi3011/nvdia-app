import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from "@nestjs/common";
import { UserRole } from "@ai-digital-passport/shared-types";
import { z } from "zod";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { Roles } from "../common/auth/roles.decorator";
import type { RequestUser } from "../common/auth/types";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { ExternalHackathonsService } from "./external-hackathons.service";

const AddExternalHackathonSchema = z.object({
  title: z.string().trim().min(2).max(200),
  url: z.string().trim().url().max(1000),
  description: z.string().trim().max(4000).optional(),
  organizer: z.string().trim().max(200).optional(),
  location: z.string().trim().max(200).optional(),
  isOnline: z.boolean().optional(),
  prize: z.string().trim().max(100).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
  imageUrl: z.string().trim().url().max(1000).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  deadlineAt: z.string().optional(),
});

const UpdateExternalHackathonSchema = AddExternalHackathonSchema.partial().extend({
  registerPoints: z.number().int().min(0).max(1000).optional(),
});

@Controller("hackathons/external")
export class ExternalHackathonsController {
  constructor(private readonly service: ExternalHackathonsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.service.list(user.userId);
  }

  @Post(":id/register")
  @HttpCode(200)
  register(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.service.register(user.userId, id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateExternalHackathonSchema)) body: z.infer<typeof UpdateExternalHackathonSchema>,
  ) {
    return this.service.update(id, body);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  add(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(AddExternalHackathonSchema)) body: z.infer<typeof AddExternalHackathonSchema>,
  ) {
    return this.service.addManual(user.userId, body);
  }

  @Post("sync")
  @HttpCode(200)
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  sync() {
    return this.service.sync();
  }

  @Delete(":id")
  @HttpCode(204)
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
