import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import { UserRole } from "@ai-digital-passport/shared-types";
import { z } from "zod";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { Roles } from "../common/auth/roles.decorator";
import type { RequestUser } from "../common/auth/types";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { WhitelistService } from "./whitelist.service";

const ROLE = z.enum(["STUDENT", "MENTOR", "ADMIN"]);
const RowSchema = z.object({
  email: z.string().trim().min(1).max(200),
  fullName: z.string().trim().max(200).optional(),
  role: ROLE.optional(),
  department: z.string().trim().max(200).optional(),
  year: z.string().trim().max(50).optional(),
  source: z.string().trim().max(200).optional(),
});
const ImportSchema = z.object({
  rows: z.array(RowSchema).min(1).max(5000),
  role: ROLE.optional(),
  department: z.string().trim().max(200).optional(),
  source: z.string().trim().max(200).optional(),
});
const StatusSchema = z.object({ status: z.enum(["AUTHORIZED", "SUSPENDED"]) });
const ListQuerySchema = z.object({
  search: z.string().trim().optional(),
  role: z.string().trim().optional(),
  status: z.string().trim().optional(),
});

// Admin - User Management: who is allowed to sign in, and as what role.
@Controller("admin/whitelist")
@Roles(UserRole.ADMIN)
export class AdminWhitelistController {
  constructor(private readonly service: WhitelistService) {}

  @Get()
  async list(@Query(new ZodValidationPipe(ListQuerySchema)) query: z.infer<typeof ListQuerySchema>) {
    const [items, summary] = await Promise.all([this.service.list(query), this.service.summary()]);
    return { items, summary };
  }

  @Post()
  add(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(RowSchema)) body: z.infer<typeof RowSchema>) {
    return this.service.upsertMany(user, [body], { source: "Manual Admin Whitelist Entry" });
  }

  @Post("import")
  @HttpCode(200)
  import(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(ImportSchema)) body: z.infer<typeof ImportSchema>) {
    return this.service.upsertMany(user, body.rows, { role: body.role, department: body.department, source: body.source });
  }

  @Patch(":email/status")
  setStatus(
    @CurrentUser() user: RequestUser,
    @Param("email") email: string,
    @Body(new ZodValidationPipe(StatusSchema)) body: z.infer<typeof StatusSchema>,
  ) {
    return this.service.setStatus(user, email, body.status);
  }

  @Delete(":email")
  @HttpCode(204)
  remove(@CurrentUser() user: RequestUser, @Param("email") email: string) {
    return this.service.remove(user, email);
  }
}
