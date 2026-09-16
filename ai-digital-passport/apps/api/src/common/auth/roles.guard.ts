import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { UserRole } from "@ai-digital-passport/shared-types";
import { ROLES_KEY } from "./roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const userRoles = req.appUser?.roles ?? [];
    const allowed = requiredRoles.some((role) => userRoles.includes(role));
    if (!allowed) {
      throw new ForbiddenException({
        code: "ROLE_NOT_PERMITTED",
        message: "Your role does not permit this action.",
      });
    }
    return true;
  }
}
