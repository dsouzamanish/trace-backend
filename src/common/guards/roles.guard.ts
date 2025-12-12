import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      return false;
    }

    // Check if user has any of the required roles
    return requiredRoles.some((role) => {
      if (role === Role.ADMIN) {
        return user.isAdmin === true;
      }
      if (role === Role.MANAGER) {
        return user.isManager === true || user.isAdmin === true;
      }
      if (role === Role.USER) {
        return true; // All authenticated users have USER role
      }
      return false;
    });
  }
}

