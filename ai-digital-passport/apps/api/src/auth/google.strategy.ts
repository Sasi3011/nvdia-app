import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, type Profile, type VerifyCallback } from "passport-google-oauth20";
import type { GoogleProfile } from "../common/auth/types";

// Stateless (session: false, set in AuthModule's PassportModule.register)
// — used only to exchange the OAuth code for a Google profile on the one
// callback request. We mint our own JWT cookie afterward (session.service)
// rather than using Passport's session serialization.
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor() {
    // Falls back to placeholders rather than throwing at boot when Google
    // credentials aren't configured yet (e.g. local dev before Cloud
    // Console setup) — the app still starts and everything except the
    // real OAuth handshake works (dev-login bypasses it entirely).
    // Navigating to /auth/google without real credentials fails with a
    // Google-side error, not a crashed API.
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || "not-configured",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "not-configured",
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:1002/auth/google/callback",
      scope: ["email", "profile"],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error("Google profile has no email"), false);
      return;
    }
    const googleProfile: GoogleProfile = {
      googleId: profile.id,
      email: email.toLowerCase(),
      fullName: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value,
    };
    done(null, googleProfile);
  }
}
