import { UserRole } from "@ai-digital-passport/shared-types";

// Fully resolved identity — a real `users` row exists. What `@CurrentUser()`
// returns for every ordinary protected endpoint.
export interface RequestUser {
  userId: string;
  email: string;
  roles: UserRole[];
  currentLevelId: number;
}

// The Google profile passport-google-oauth20's strategy resolves for the
// single OAuth callback request — never persisted, just used to mint our
// own JWT session cookie.
export interface GoogleProfile {
  googleId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

// What our own signed session cookie decodes to (see session.service.ts).
export interface SessionIdentity {
  sub: string; // googleId
  email: string;
  fullName: string;
  avatarUrl?: string;
}

declare module "express" {
  interface Request {
    // Set by GoogleAuthCallbackGuard for the one /auth/google/callback
    // request only (never persisted).
    user?: GoogleProfile;
    // Set by SessionAuthGuard once a `users` row is found for the
    // session's verified email.
    appUser?: RequestUser;
    // Set by SessionAuthGuard instead of `appUser` on routes marked
    // @AllowPendingOnboarding() when the JWT is valid but no `users` row
    // exists yet (i.e. mid-onboarding).
    pendingIdentity?: SessionIdentity;
  }
}
