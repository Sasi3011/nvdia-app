import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { UserRole } from "@ai-digital-passport/shared-types";
import { z } from "zod";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { Roles } from "../common/auth/roles.decorator";
import type { RequestUser } from "../common/auth/types";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { AwardsService } from "./awards.service";

const RequestSchema = z.object({
  awardId: z.string().trim().min(1),
  reason: z.string().trim().min(10, "Please describe why this award is deserved (at least 10 characters).").max(2000),
  nomineeEmail: z.string().trim().email().optional(),
});
const ReviewSchema = z.object({
  status: z.enum(["CONFIRMED", "DECLINED"]),
  note: z.string().trim().max(1000).optional(),
});

@Controller("awards")
export class AwardsController {
  constructor(private readonly service: AwardsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.service.list(user.userId);
  }

  @Post("requests")
  request(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(RequestSchema)) body: z.infer<typeof RequestSchema>) {
    return this.service.request(user, body);
  }
}

@Controller("admin/awards")
@Roles(UserRole.ADMIN)
export class AdminAwardsController {
  constructor(private readonly service: AwardsService) {}

  @Get("requests")
  list() {
    return this.service.adminList();
  }

  @Post("requests/:id/review")
  review(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(ReviewSchema)) body: z.infer<typeof ReviewSchema>,
  ) {
    return this.service.review(user, id, body.status, body.note);
  }
}
