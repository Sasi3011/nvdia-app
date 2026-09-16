import { SetMetadata } from "@nestjs/common";
import { UserRole } from "@ai-digital-passport/shared-types";

export const ROLES_KEY = "roles";

// SEC-05: role checks enforced server-side, never trusted from the client.
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
