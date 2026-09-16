import { Body, Controller, Post } from "@nestjs/common";
import { z } from "zod";
import { OtaPlatform } from "@ai-digital-passport/database";
import { Public } from "../common/auth/public.decorator";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { OtaService } from "./ota.service";

// The native plugin's request body has many device/metadata fields we
// don't need (device_id, version_build, version_code, version_os,
// plugin_version, is_emulator, is_prod, install_source, custom_id,
// key_id…) — only these four drive the response, everything else is
// ignored rather than rejected.
const CheckUpdateSchema = z.object({
  app_id: z.string().min(1),
  platform: z.enum(["android", "ios"]),
  version_name: z.string().default("builtin"),
  channel: z.string().optional(),
  defaultChannel: z.string().optional(),
});

// POST /ota/check — the exact endpoint @capgo/capacitor-updater's
// `updateUrl` config points at (capacitor.config.ts). Public: called by
// the app before the user has any session.
@Controller("ota")
export class OtaController {
  constructor(private readonly otaService: OtaService) {}

  @Public()
  @Post("check")
  async check(@Body(new ZodValidationPipe(CheckUpdateSchema)) body: z.infer<typeof CheckUpdateSchema>) {
    return this.otaService.checkForUpdate({
      appId: body.app_id,
      platform: body.platform === "ios" ? OtaPlatform.IOS : OtaPlatform.ANDROID,
      channel: body.channel || body.defaultChannel || "production",
      currentVersion: body.version_name,
    });
  }
}
