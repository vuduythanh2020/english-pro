import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

function createMockContext(
  user: any = undefined,
  overrides: { handler?: any; cls?: any } = {},
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => overrides.handler || jest.fn(),
    getClass: () => overrides.cls || jest.fn(),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn().mockReturnValue(null),
          },
        },
      ],
    }).compile();
    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no @Roles() decorator present', () => {
    const context = createMockContext({ role: 'PARENT' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when @Roles() has empty array', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    const context = createMockContext({ role: 'PARENT' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user role matches required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['PARENT']);
    const context = createMockContext({ role: 'PARENT' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user role is one of multiple required roles', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['PARENT', 'CHILD']);
    const context = createMockContext({ role: 'CHILD' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when role does not match', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['PARENT']);
    const context = createMockContext({ role: 'CHILD' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(
      'Insufficient permissions for this resource',
    );
  });

  it('should throw ForbiddenException when no user context', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['PARENT']);
    const context = createMockContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('No user context');
  });
});
