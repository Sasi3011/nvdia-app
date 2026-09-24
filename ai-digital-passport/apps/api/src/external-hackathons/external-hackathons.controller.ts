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

const ProofFields = z.object({
  proofType: z.enum(["PDF_FILE", "DOI_LINK"]),
  proofUrl: z.string().trim().url().max(1000).optional(),
  fileKey: z.string().trim().min(1).optional(),
  fileName: z.string().trim().min(1).max(200).optional(),
  mimeType: z.string().trim().min(1).optional(),
  sizeBytes: z.coerce.number().int().positive().optional(),
});
const hasProof = (d: z.infer<typeof ProofFields>) => (d.proofType === "PDF_FILE" ? !!d.fileKey : !!d.proofUrl);

const TeamMemberSchema = z.object({
  name: z.string().trim().min(1).max(120),
  registerNum: z.string().trim().max(50).optional(),
  email: z.string().trim().email().max(200).optional().or(z.literal("").transform(() => undefined)),
  department: z.string().trim().max(120).optional(),
});

const RegisterProofSchema = ProofFields.extend({
  teamName: z.string().trim().min(1, "Team name is required.").max(120),
  teamMembers: z.array(TeamMemberSchema).min(1, "Add at least one team member.").max(10),
}).refine(hasProof, { message: "Proof of registration is required (a PDF/screenshot file or a link)." });

const ResultProofSchema = ProofFields.extend({
  resultType: z.enum(["PARTICIPATION", "WINNER"]),
}).refine(hasProof, { message: "Proof of participation or winning is required (a PDF/screenshot file or a link)." });

const UpdateExternalHackathonSchema = AddExternalHackathonSchema.partial().extend({
});

@Controller("hackathons/external")
export class ExternalHackathonsController {
  constructor(private readonly service: ExternalHackathonsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.service.list(user.userId);
  }

  @Get("applications")
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  applications() {
    return this.service.applications();
  }

  @Post(":id/register")
  @HttpCode(200)
  register(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(RegisterProofSchema)) body: z.infer<typeof RegisterProofSchema>,
  ) {
    return this.service.register(user.userId, id, body);
  }

  @Post(":id/result")
  @HttpCode(200)
  submitResult(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(ResultProofSchema)) body: z.infer<typeof ResultProofSchema>,
  ) {
    return this.service.submitResult(user.userId, id, body);
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
