import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request, Response } from "express";
import { z } from "zod";
import { OnboardUserSchema } from "@ai-digital-passport/shared-types";
import { AllowPendingOnboarding } from "../common/auth/allow-pending-onboarding.decorator";
import { SESSION_COOKIE_NAME } from "../common/auth/constants";
import { PendingIdentity } from "../common/auth/pending-identity.decorator";
import { Public } from "../common/auth/public.decorator";
import type { GoogleProfile } from "../common/auth/types";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { WhitelistService } from "../whitelist/whitelist.service";
import { AuthService } from "./auth.service";
import { SessionService } from "./session.service";

function frontendUrl(path: string): string {
  const origin = process.env.WEB_ORIGIN?.split(",")[0]?.trim() ?? "http://localhost:1001";
  return `${origin}${path}`;
}

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
    private readonly whitelist: WhitelistService,
  ) {}

  // Page 1 — Login: a plain link/button to this URL (full-page navigation,
  // not an AJAX call, since apps/web is a static export with no server of
  // its own to broker the OAuth handshake).
  @Public()
  @Get("google")
  @UseGuards(AuthGuard("google"))
  googleLogin(): void {
    // AuthGuard('google') intercepts and redirects to Google; this body
    // never runs.
  }

  // Google redirects here after consent. We mint our own session cookie
  // and redirect back into the static frontend.
  @Public()
  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as GoogleProfile | undefined;
    if (!profile) {
      res.redirect(frontendUrl("/access-denied"));
      return;
    }

    try {
      this.authService.assertAllowedDomain(profile.email);
    } catch {
      // BR-01/FR-AUTH-01: reject non-institutional domains — Page 3.
      res.redirect(frontendUrl("/access-denied"));
      return;
    }

    const access = await this.whitelist.check(profile.email);
    if (!access.ok) {
      res.redirect(frontendUrl("/access-denied"));
      return;
    }
    await this.whitelist.touchLogin(profile.email);

    await this.authService.ensureUser(profile.email, access.fullName || profile.fullName);
    this.sessionService.issueCookie(res, profile);

    res.redirect(frontendUrl("/"));
  }

  // Frontend calls this on load to decide where to route: logged out ->
  // /login, logged in but not onboarded -> /onboarding, else role-based:
  // ADMIN -> /admin, MENTOR -> /mentor, STUDENT -> /dashboard.
  @Public()
  @Get("session")
  async session(@Req() req: Request) {
    const identity = this.sessionService.verifyCookie(req.cookies?.[SESSION_COOKIE_NAME] as string | undefined);
    if (!identity) return { authenticated: false as const };

    // A suspended or removed email is signed out on the next session check.
    const access = await this.whitelist.check(identity.email);
    if (!access.ok) return { authenticated: false as const, reason: access.reason };

    // Covers sessions issued before profiles were auto-created at login.
    await this.authService.ensureUser(identity.email, identity.fullName);
    const user = await this.authService.findByEmailWithRoles(identity.email);
    return {
      authenticated: true as const,
      onboarded: !!user,
      email: identity.email,
      fullName: identity.fullName,
      roles: user ? user.user_roles.map((ur) => ur.role.name as string) : [],
    };
  }

  @Public()
  @Post("logout")
  logout(@Res() res: Response) {
    this.sessionService.clearCookie(res);
    res.status(204).send();
  }

  // Page 2 — Onboarding. Requires a verified session (Google auth already
  // succeeded) but deliberately allowed even with no `users` row yet
  // (that's the entire point of this endpoint) — see
  // @AllowPendingOnboarding on SessionAuthGuard.
  @AllowPendingOnboarding()
  @Post("onboard")
  async onboard(
    @PendingIdentity() identity: { email: string; fullName: string },
    @Body(new ZodValidationPipe(OnboardUserSchema)) body: z.infer<typeof OnboardUserSchema>,
  ) {
    const user = await this.authService.onboard(identity.email, identity.fullName, body);
    return {
      userId: user.user_id,
      email: user.email,
      currentLevelId: user.student?.current_level_id ?? 1,
      totalPoints: user.student?.total_points ?? 0,
      gpuCreditBalance: user.student?.gpu_credit_balance ?? 0,
    };
  }

  /**
   * TEMPORARY, dev-only — establishes a real session cookie for an
   * arbitrary email without going through Google, so the app can be
   * exercised end-to-end (including onboarding) without live Google OAuth
   * credentials configured. Hard-disabled outside development. Everything
   * downstream (SessionAuthGuard, onboarding, role checks) is the exact
   * same real code path production traffic uses — only the OAuth
   * handshake itself is skipped.
   */
  @Public()
  @Post("dev-login")
  async devLogin(
    @Res() res: Response,
    @Body(new ZodValidationPipe(z.object({ email: z.string().trim().toLowerCase().email(), fullName: z.string().trim().min(1).max(200), password: z.string().min(1) })))
    body: { email: string; fullName: string; password: string },
  ) {
    if (process.env.NODE_ENV === "production") {
      res.status(404).send();
      return;
    }
    if (body.password !== (process.env.DEV_LOGIN_PASSWORD || "password123")) {
      res.status(401).send({ message: "Invalid email or password." });
      return;
    }
    const access = await this.whitelist.check(body.email);
    if (!access.ok) {
      res.status(403).send({ code: "ACCESS_DENIED", message: access.reason });
      return;
    }
    await this.whitelist.touchLogin(body.email);
    const fullName = access.fullName || body.fullName;
    await this.authService.ensureUser(body.email, fullName);
    this.sessionService.issueCookie(res, { googleId: `dev-${body.email}`, email: body.email, fullName });
    res.status(204).send();
  }
}
