import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

// Marks a route as not requiring an authenticated user. Everything else is
// protected by default (DevAuthGuard / the real session guard in Phase 3)
// — this is an explicit opt-out, not the default posture.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
