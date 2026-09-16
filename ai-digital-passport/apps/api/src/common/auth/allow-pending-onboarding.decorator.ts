import { SetMetadata } from "@nestjs/common";

export const ALLOW_PENDING_ONBOARDING_KEY = "allowPendingOnboarding";

// Marks a route as reachable with a verified session that has no `users`
// row yet (mid-onboarding) — SessionAuthGuard won't reject it with
// ONBOARDING_REQUIRED, and populates `req.pendingIdentity` instead of (or
// alongside) `req.appUser`.
export const AllowPendingOnboarding = () => SetMetadata(ALLOW_PENDING_ONBOARDING_KEY, true);
