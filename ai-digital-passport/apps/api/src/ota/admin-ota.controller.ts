import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { OtaPlatform } from "@ai-digital-passport/database";
import { Public } from "../common/auth/public.decorator";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { OtaApiKeyGuard } from "./ota-api-key.guard";
import { OtaService } from "./ota.service";

const PresignSchema = z.object({
  appId: z.string().min(1),
  platform: z.enum(["ANDROID", "IOS"]),
  channel: z.string().trim().min(1).default("production"),
  version: z.string().trim().min(1),
  fileName: z.string().trim().min(1),
});

const PublishSchema = z.object({
  appId: z.string().min(1),
  platform: z.enum(["ANDROID", "IOS"]),
  channel: z.string().trim().min(1).default("production"),
  version: z.string().trim().min(1),
  s3Key: z.string().min(1),
  sizeBytes: z.coerce.number().int().positive(),
  checksum: z.string().optional(),
  notes: z.string().max(500).optional(),
});

// Publishing API driven by scripts/ota-publish.mjs (the documented "exact
// command to run to ship a live update") — a release script, not a
// logged-in browser session, so this is guarded by OtaApiKeyGuard
// (x-ota-api-key header) rather than the usual cookie session + role
// check. @Public() so SessionAuthGuard doesn't also demand a cookie.
@Controller("admin/ota")
@Public()
@UseGuards(OtaApiKeyGuard)
export class AdminOtaController {
  constructor(private readonly otaService: OtaService) {}

  @Get("bundles")
  async list(@Query("appId") appId?: string) {
    return this.otaService.listBundles(appId);
  }

  @Post("presign")
  async presign(@Body(new ZodValidationPipe(PresignSchema)) body: z.infer<typeof PresignSchema>) {
    return this.otaService.presignPublish({
      ...body,
      platform: body.platform === "IOS" ? OtaPlatform.IOS : OtaPlatform.ANDROID,
    });
  }

  @Post("publish")
  async publish(@Body(new ZodValidationPipe(PublishSchema)) body: z.infer<typeof PublishSchema>) {
    return this.otaService.registerBundle(null, {
      ...body,
      platform: body.platform === "IOS" ? OtaPlatform.IOS : OtaPlatform.ANDROID,
    });
  }

  @Post("bundles/:id/deactivate")
  async deactivate(@Param("id") id: string) {
    return this.otaService.deactivate(null, id);
  }
}
