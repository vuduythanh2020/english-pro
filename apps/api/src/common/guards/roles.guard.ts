import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('No user context');

    // Normalize role comparison to handle both 'PARENT'/'CHILD' and 'parent'/'child'
    const userRole = (user.role || '').toUpperCase();
    const normalizedRequired = requiredRoles.map((r) => r.toUpperCase());

    if (!normalizedRequired.includes(userRole)) {
      throw new ForbiddenException(
        'Insufficient permissions for this resource',
      );
    }
    return true;
  }
}
