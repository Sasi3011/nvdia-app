import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import type { RequestUser } from "./types";

// Every protected endpoint re-checks identity server-side (SEC-04/05/06,
// spec 04 Section 12) — this decorator is how controllers read the user
// SessionAuthGuard already resolved onto the request; it never trusts
// client input.
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): RequestUser => {
  const req = ctx.switchToHttp().getRequest<Request>();
  if (!req.appUser) {
    throw new UnauthorizedException({ code: "UNAUTHENTICATED", message: "No authenticated user on request." });
  }
  return req.appUser;
});
