import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Response } from "express";
import { SESSION_COOKIE_NAME } from "../common/auth/constants";
import type { GoogleProfile, SessionIdentity } from "../common/auth/types";

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Our own signed session, carried in an httpOnly cookie — not tokens in
 * localStorage (architecture requirement). Deliberately stateless (no
 * server-side session store): every protected request re-verifies the JWT
 * and re-derives role/level from PostgreSQL (SessionAuthGuard), so a role
 * change takes effect on the very next request rather than waiting for a
 * stale session payload to expire.
 */
@Injectable()
export class SessionService {
  constructor(private readonly jwtService: JwtService) {}

  issueCookie(res: Response, profile: GoogleProfile): void {
    const payload: SessionIdentity = {
      sub: profile.googleId,
      email: profile.email,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
    };
    const token = this.jwtService.sign(payload);
    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE_MS,
      path: "/",
      domain: process.env.COOKIE_DOMAIN || undefined,
    });
  }

  clearCookie(res: Response): void {
    res.clearCookie(SESSION_COOKIE_NAME, { path: "/", domain: process.env.COOKIE_DOMAIN || undefined });
  }

  verifyCookie(token: string | undefined): SessionIdentity | null {
    if (!token) return null;
    try {
      return this.jwtService.verify<SessionIdentity>(token);
    } catch {
      return null;
    }
  }

  requireCookie(token: string | undefined): SessionIdentity {
    const identity = this.verifyCookie(token);
    if (!identity) {
      throw new UnauthorizedException({ code: "UNAUTHENTICATED", message: "No valid session." });
    }
    return identity;
  }
}
