import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { prisma } from "@ai-digital-passport/database";
import { UserRole } from "@ai-digital-passport/shared-types";
import { ALLOW_PENDING_ONBOARDING_KEY } from "./allow-pending-onboarding.decorator";
import { SESSION_COOKIE_NAME } from "./constants";
import { IS_PUBLIC_KEY } from "./public.decorator";
import type { RequestUser, SessionIdentity } from "./types";

/**
 * Real session auth (Phase 3) — replaces the Phase 2 DevAuthGuard. Reads
 * the `adp_session` httpOnly cookie our own backend issued after Google
 * OAuth (session.service.ts), verifies it, then re-derives role/level
 * fresh from PostgreSQL on every request rather than trusting anything
 * baked into the token — a role change takes effect immediately, and
 * every protected endpoint independently re-validates auth (SEC-04/05/06).
 */
@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const token = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
    const identity = this.verify(token);
    if (!identity) {
      throw new UnauthorizedException({ code: "UNAUTHENTICATED", message: "No valid session." });
    }

    const user = await prisma.user.findUnique({
      where: { email: identity.email },
      include: { user_roles: { include: { role: true } } },
    });

    const allowPending = this.reflector.getAllAndOverride<boolean>(ALLOW_PENDING_ONBOARDING_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!user) {
      if (allowPending) {
        req.pendingIdentity = identity;
        return true;
      }
      throw new ForbiddenException({
        code: "ONBOARDING_REQUIRED",
        message: "Complete onboarding before accessing this resource.",
      });
    }

    const requestUser: RequestUser = {
      userId: user.user_id,
      email: user.email,
      roles: user.user_roles.map((ur) => ur.role.name as UserRole),
      currentLevelId: user.current_level_id,
    };
    req.appUser = requestUser;
    if (allowPending) req.pendingIdentity = identity;
    return true;
  }

  private verify(token: string | undefined): SessionIdentity | null {
    if (!token) return null;
    try {
      return this.jwtService.verify<SessionIdentity>(token);
    } catch {
      return null;
    }
  }
}
