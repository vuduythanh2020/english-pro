import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ParentalGateGuard } from './parental-gate.guard';

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

describe('ParentalGateGuard', () => {
  let guard: ParentalGateGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParentalGateGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn().mockReturnValue(false),
          },
        },
      ],
    }).compile();
    guard = module.get<ParentalGateGuard>(ParentalGateGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when @ParentOnly() is not present', () => {
    const context = createMockContext({ role: 'CHILD' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access for PARENT on @ParentOnly() endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const context = createMockContext({ role: 'PARENT' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException for CHILD on @ParentOnly() endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const context = createMockContext({ role: 'CHILD' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('Parent access required');
  });

  it('should throw ForbiddenException when no user context and @ParentOnly() is present', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const context = createMockContext(undefined);
    // No user (unauthenticated) should be blocked from parent-only endpoints
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('Parent access required');
  });

  it('should throw ForbiddenException when user context is null and @ParentOnly() is present', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const context = createMockContext(null);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('Parent access required');
  });
});
