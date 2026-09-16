import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";

/**
 * The OTA publish flow runs from `scripts/ota-publish.mjs` (a release
 * script), not a logged-in browser — there is no session cookie to check.
 * Guarded instead by a static bearer secret (`OTA_PUBLISH_API_KEY`), the
 * same pattern CI/CD pipelines use for deploy-time API calls. This guard
 * fully replaces SessionAuthGuard/RolesGuard for the routes it's applied
 * to (those routes are also marked @Public() so SessionAuthGuard skips
 * them) — it is the only auth check on those endpoints.
 */
@Injectable()
export class OtaApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const configuredKey = process.env.OTA_PUBLISH_API_KEY;
    if (!configuredKey) {
      throw new UnauthorizedException({
        code: "OTA_PUBLISH_NOT_CONFIGURED",
        message: "OTA_PUBLISH_API_KEY is not set on the server.",
      });
    }

    const req = context.switchToHttp().getRequest<Request>();
    const provided = req.header("x-ota-api-key");
    if (!provided || provided !== configuredKey) {
      throw new UnauthorizedException({ code: "INVALID_OTA_API_KEY" });
    }
    return true;
  }
}
