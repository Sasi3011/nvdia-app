import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import type { SessionIdentity } from "./types";

// Reads the session's verified-but-not-yet-onboarded identity, for routes
// marked @AllowPendingOnboarding() (currently just POST /auth/onboard).
export const PendingIdentity = createParamDecorator((_data: unknown, ctx: ExecutionContext): SessionIdentity => {
  const req = ctx.switchToHttp().getRequest<Request>();
  if (!req.pendingIdentity) {
    throw new UnauthorizedException({ code: "UNAUTHENTICATED", message: "No verified session on request." });
  }
  return req.pendingIdentity;
});
