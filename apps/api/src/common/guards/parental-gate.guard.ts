import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PARENT_ONLY_KEY } from '../decorators/parent-only.decorator';

@Injectable()
export class ParentalGateGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isParentOnly = this.reflector.getAllAndOverride<boolean>(
      PARENT_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!isParentOnly) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user || user.role === 'CHILD') {
      throw new ForbiddenException('Parent access required');
    }
    return true;
  }
}
