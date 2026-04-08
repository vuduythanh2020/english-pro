/**
 * ATDD Tests - Story 1.4: ParentalGateGuard
 * Test IDs: 1.4-UNIT-011 through 1.4-UNIT-013
 * Priority: P0 (Critical — Child Protection)
 * Status: 🔴 RED (failing before implementation)
 *
 * These tests validate that ParentalGateGuard blocks child role
 * from accessing parent-only endpoints marked with @ParentOnly().
 */

import { existsSync } from 'fs';
import { join } from 'path';

const PARENTAL_GATE_GUARD_PATH = join(
  __dirname,
  '../../../src/common/guards/parental-gate.guard.ts',
);
const PARENT_ONLY_DECORATOR_PATH = join(
  __dirname,
  '../../../src/common/decorators/parent-only.decorator.ts',
);

describe('Story 1.4: ParentalGateGuard @P0 @Unit', () => {
  // 1.4-UNIT-011: ParentalGateGuard blocks child role on @ParentOnly() endpoints
  describe('1.4-UNIT-011: Block Child on @ParentOnly()', () => {
    it.skip('should have parental-gate.guard.ts file in src/common/guards/', () => {
      // RED: File does not exist yet
      expect(existsSync(PARENTAL_GATE_GUARD_PATH)).toBe(true);
    });

    it.skip('should have @ParentOnly() decorator file', () => {
      // RED: Decorator does not exist yet
      expect(existsSync(PARENT_ONLY_DECORATOR_PATH)).toBe(true);
    });

    it.skip('should throw ForbiddenException with "Parent access required" for child user', async () => {
      // RED: ParentalGateGuard not implemented yet
      const { ParentalGateGuard } =
        await import('../../../src/common/guards/parental-gate.guard');
      const { ForbiddenException } = await import('@nestjs/common');

      // Reflector returns true for PARENT_ONLY_KEY
      const mockReflector = {
        getAllAndOverride: jest.fn().mockReturnValue(true),
      };
      const guard = new ParentalGateGuard(mockReflector as any);

      const mockRequest = {
        user: {
          sub: 'child-1',
          role: 'CHILD',
          userId: 'uid-1',
          childId: 'child-uuid-1',
        },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);

      try {
        guard.canActivate(mockContext);
      } catch (error: any) {
        expect(error.message).toContain('Parent access required');
      }
    });
  });

  // 1.4-UNIT-012: ParentalGateGuard allows parent role
  describe('1.4-UNIT-012: Allow Parent on @ParentOnly()', () => {
    it.skip('should allow request when user role is PARENT on @ParentOnly() endpoint', async () => {
      // RED: ParentalGateGuard not implemented yet
      const { ParentalGateGuard } =
        await import('../../../src/common/guards/parental-gate.guard');

      const mockReflector = {
        getAllAndOverride: jest.fn().mockReturnValue(true),
      };
      const guard = new ParentalGateGuard(mockReflector as any);

      const mockRequest = {
        user: { sub: 'parent-1', role: 'PARENT', userId: 'uid-parent-1' },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
    });
  });

  // 1.4-UNIT-013: ParentalGateGuard skips when no @ParentOnly() decorator
  describe('1.4-UNIT-013: No @ParentOnly() — Skip Check', () => {
    it.skip('should allow any role when @ParentOnly() is not present', async () => {
      // RED: ParentalGateGuard not implemented yet
      const { ParentalGateGuard } =
        await import('../../../src/common/guards/parental-gate.guard');

      // Reflector returns false/undefined — no @ParentOnly() on endpoint
      const mockReflector = {
        getAllAndOverride: jest.fn().mockReturnValue(false),
      };
      const guard = new ParentalGateGuard(mockReflector as any);

      const mockRequest = {
        user: {
          sub: 'child-1',
          role: 'CHILD',
          userId: 'uid-1',
          childId: 'child-uuid-1',
        },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
    });
  });
});

function createMockExecutionContext(request: any) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as any;
}
