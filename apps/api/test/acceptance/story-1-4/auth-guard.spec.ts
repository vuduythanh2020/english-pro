/**
 * ATDD Tests - Story 1.4: AuthGuard
 * Test IDs: 1.4-UNIT-001 through 1.4-UNIT-007
 * Priority: P0 (Critical — Security)
 * Status: 🔴 RED (failing before implementation)
 *
 * These tests validate that AuthGuard properly verifies JWT tokens
 * using jsonwebtoken library with Supabase JWT secret.
 * All tests use describe.skip() / it.skip() as TDD red phase markers.
 */

import { existsSync } from 'fs';
import { join } from 'path';

// Path to source files - relative to test file location
// __dirname = apps/api/test/acceptance/story-1-4/
const COMMON_GUARDS_DIR = join(__dirname, '../../../src/common/guards');
const AUTH_GUARD_PATH = join(COMMON_GUARDS_DIR, 'auth.guard.ts');
const PUBLIC_DECORATOR_PATH = join(
  __dirname,
  '../../../src/common/decorators/public.decorator.ts',
);
const JWT_PAYLOAD_TYPE_PATH = join(
  __dirname,
  '../../../src/common/types/jwt-payload.type.ts',
);

describe('Story 1.4: AuthGuard @P0 @Unit', () => {
  // 1.4-UNIT-001: AuthGuard allows request with valid JWT token
  describe('1.4-UNIT-001: Valid JWT Token', () => {
    it.skip('should have auth.guard.ts file in src/common/guards/', () => {
      // RED: File does not exist yet
      expect(existsSync(AUTH_GUARD_PATH)).toBe(true);
    });

    it.skip('should have JwtPayload type definition', () => {
      // RED: Type file does not exist yet
      expect(existsSync(JWT_PAYLOAD_TYPE_PATH)).toBe(true);
    });

    it.skip('should allow request with valid JWT signed by SUPABASE_JWT_SECRET', async () => {
      // RED: AuthGuard not implemented yet
      // This test validates that a properly signed JWT passes verification
      const jwt = await import('jsonwebtoken');
      const TEST_SECRET = 'test-supabase-jwt-secret-for-testing';

      const validToken = jwt.sign(
        {
          sub: 'auth-user-uuid-123',
          email: 'parent@example.com',
          exp: Math.floor(Date.now() / 1000) + 3600,
          app_metadata: {
            role: 'PARENT',
            user_id: 'public-user-uuid-456',
          },
        },
        TEST_SECRET,
      );

      // Import AuthGuard — will fail because module doesn't exist
      const { AuthGuard } =
        await import('../../../src/common/guards/auth.guard');
      expect(AuthGuard).toBeDefined();

      // Create guard instance with mocked dependencies
      const mockConfigService = { get: jest.fn().mockReturnValue(TEST_SECRET) };
      const mockReflector = {
        getAllAndOverride: jest.fn().mockReturnValue(false),
      };

      const guard = new AuthGuard(
        mockReflector as any,
        mockConfigService as any,
      );

      const mockRequest = {
        headers: { authorization: `Bearer ${validToken}` },
        user: undefined,
      };
      const mockContext = createMockExecutionContext(mockRequest);

      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user).toMatchObject({
        sub: 'auth-user-uuid-123',
        email: 'parent@example.com',
        role: 'PARENT',
        userId: 'public-user-uuid-456',
      });
    });
  });

  // 1.4-UNIT-002: AuthGuard returns 401 when no token
  describe('1.4-UNIT-002: Missing Token', () => {
    it.skip('should throw UnauthorizedException when no Authorization header', async () => {
      // RED: AuthGuard not implemented yet
      const { AuthGuard } =
        await import('../../../src/common/guards/auth.guard');
      const { UnauthorizedException } = await import('@nestjs/common');

      const mockConfigService = { get: jest.fn().mockReturnValue('secret') };
      const mockReflector = {
        getAllAndOverride: jest.fn().mockReturnValue(false),
      };
      const guard = new AuthGuard(
        mockReflector as any,
        mockConfigService as any,
      );

      const mockRequest = { headers: {}, user: undefined };
      const mockContext = createMockExecutionContext(mockRequest);

      expect(() => guard.canActivate(mockContext)).toThrow(
        UnauthorizedException,
      );
    });

    it.skip('should throw UnauthorizedException when Authorization header is not Bearer', async () => {
      // RED: AuthGuard not implemented yet
      const { AuthGuard } =
        await import('../../../src/common/guards/auth.guard');
      const { UnauthorizedException } = await import('@nestjs/common');

      const mockConfigService = { get: jest.fn().mockReturnValue('secret') };
      const mockReflector = {
        getAllAndOverride: jest.fn().mockReturnValue(false),
      };
      const guard = new AuthGuard(
        mockReflector as any,
        mockConfigService as any,
      );

      const mockRequest = {
        headers: { authorization: 'Basic dXNlcjpwYXNz' },
        user: undefined,
      };
      const mockContext = createMockExecutionContext(mockRequest);

      expect(() => guard.canActivate(mockContext)).toThrow(
        UnauthorizedException,
      );
    });
  });

  // 1.4-UNIT-003: AuthGuard returns 401 for expired token
  describe('1.4-UNIT-003: Expired Token', () => {
    it.skip('should throw UnauthorizedException for expired JWT', async () => {
      // RED: AuthGuard not implemented yet
      const jwt = await import('jsonwebtoken');
      const TEST_SECRET = 'test-supabase-jwt-secret-for-testing';

      const expiredToken = jwt.sign(
        {
          sub: 'auth-user-uuid-123',
          exp: Math.floor(Date.now() / 1000) - 3600, // expired 1 hour ago
          app_metadata: { role: 'PARENT' },
        },
        TEST_SECRET,
      );

      const { AuthGuard } =
        await import('../../../src/common/guards/auth.guard');
      const { UnauthorizedException } = await import('@nestjs/common');

      const mockConfigService = { get: jest.fn().mockReturnValue(TEST_SECRET) };
      const mockReflector = {
        getAllAndOverride: jest.fn().mockReturnValue(false),
      };
      const guard = new AuthGuard(
        mockReflector as any,
        mockConfigService as any,
      );

      const mockRequest = {
        headers: { authorization: `Bearer ${expiredToken}` },
        user: undefined,
      };
      const mockContext = createMockExecutionContext(mockRequest);

      expect(() => guard.canActivate(mockContext)).toThrow(
        UnauthorizedException,
      );
    });
  });

  // 1.4-UNIT-004: AuthGuard returns 401 for token missing exp claim
  describe('1.4-UNIT-004: Missing Exp Claim', () => {
    it.skip('should throw UnauthorizedException when JWT has no exp claim', async () => {
      // RED: AuthGuard not implemented yet
      // This fixes deferred bug from Story 1.3
      const jwt = await import('jsonwebtoken');
      const TEST_SECRET = 'test-supabase-jwt-secret-for-testing';

      // Sign without exp — using noTimestamp to also skip iat
      const tokenNoExp = jwt.sign(
        { sub: 'auth-user-uuid-123', app_metadata: { role: 'PARENT' } },
        TEST_SECRET,
        { noTimestamp: true },
      );

      const { AuthGuard } =
        await import('../../../src/common/guards/auth.guard');
      const { UnauthorizedException } = await import('@nestjs/common');

      const mockConfigService = { get: jest.fn().mockReturnValue(TEST_SECRET) };
      const mockReflector = {
        getAllAndOverride: jest.fn().mockReturnValue(false),
      };
      const guard = new AuthGuard(
        mockReflector as any,
        mockConfigService as any,
      );

      const mockRequest = {
        headers: { authorization: `Bearer ${tokenNoExp}` },
        user: undefined,
      };
      const mockContext = createMockExecutionContext(mockRequest);

      expect(() => guard.canActivate(mockContext)).toThrow(
        UnauthorizedException,
      );
    });
  });

  // 1.4-UNIT-005: AuthGuard returns 401 for invalid signature
  describe('1.4-UNIT-005: Invalid Signature', () => {
    it.skip('should throw UnauthorizedException for JWT signed with wrong secret', async () => {
      // RED: AuthGuard not implemented yet
      const jwt = await import('jsonwebtoken');

      const tokenWrongSecret = jwt.sign(
        {
          sub: 'auth-user-uuid-123',
          exp: Math.floor(Date.now() / 1000) + 3600,
          app_metadata: { role: 'PARENT' },
        },
        'wrong-secret-not-supabase',
      );

      const { AuthGuard } =
        await import('../../../src/common/guards/auth.guard');
      const { UnauthorizedException } = await import('@nestjs/common');

      const mockConfigService = {
        get: jest.fn().mockReturnValue('correct-supabase-secret'),
      };
      const mockReflector = {
        getAllAndOverride: jest.fn().mockReturnValue(false),
      };
      const guard = new AuthGuard(
        mockReflector as any,
        mockConfigService as any,
      );

      const mockRequest = {
        headers: { authorization: `Bearer ${tokenWrongSecret}` },
        user: undefined,
      };
      const mockContext = createMockExecutionContext(mockRequest);

      expect(() => guard.canActivate(mockContext)).toThrow(
        UnauthorizedException,
      );
    });
  });

  // 1.4-UNIT-006: AuthGuard skips auth for @Public() endpoints
  describe('1.4-UNIT-006: @Public() Decorator', () => {
    it.skip('should have @Public() decorator file', () => {
      // RED: Decorator does not exist yet
      expect(existsSync(PUBLIC_DECORATOR_PATH)).toBe(true);
    });

    it.skip('should allow request without token on @Public() endpoint', async () => {
      // RED: AuthGuard and @Public() decorator not implemented yet
      const { AuthGuard } =
        await import('../../../src/common/guards/auth.guard');

      const mockConfigService = { get: jest.fn().mockReturnValue('secret') };
      // Reflector returns true for IS_PUBLIC_KEY
      const mockReflector = {
        getAllAndOverride: jest.fn().mockReturnValue(true),
      };
      const guard = new AuthGuard(
        mockReflector as any,
        mockConfigService as any,
      );

      const mockRequest = { headers: {}, user: undefined };
      const mockContext = createMockExecutionContext(mockRequest);

      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
    });
  });

  // 1.4-UNIT-007: AuthGuard extracts user payload to request.user
  describe('1.4-UNIT-007: User Payload Extraction', () => {
    it.skip('should attach correct user shape to request.user for PARENT role', async () => {
      // RED: AuthGuard not implemented yet
      const jwt = await import('jsonwebtoken');
      const TEST_SECRET = 'test-supabase-jwt-secret-for-testing';

      const parentToken = jwt.sign(
        {
          sub: 'auth-user-uuid-parent',
          email: 'parent@example.com',
          exp: Math.floor(Date.now() / 1000) + 3600,
          app_metadata: {
            role: 'PARENT',
            user_id: 'public-user-uuid-parent',
          },
        },
        TEST_SECRET,
      );

      const { AuthGuard } =
        await import('../../../src/common/guards/auth.guard');

      const mockConfigService = { get: jest.fn().mockReturnValue(TEST_SECRET) };
      const mockReflector = {
        getAllAndOverride: jest.fn().mockReturnValue(false),
      };
      const guard = new AuthGuard(
        mockReflector as any,
        mockConfigService as any,
      );

      const mockRequest = {
        headers: { authorization: `Bearer ${parentToken}` },
        user: undefined as any,
      };
      const mockContext = createMockExecutionContext(mockRequest);

      guard.canActivate(mockContext);

      expect(mockRequest.user).toMatchObject({
        sub: 'auth-user-uuid-parent',
        email: 'parent@example.com',
        role: 'PARENT',
        userId: 'public-user-uuid-parent',
      });
      expect(mockRequest.user.childId).toBeUndefined();
    });

    it.skip('should attach childId for CHILD role JWT', async () => {
      // RED: AuthGuard not implemented yet
      const jwt = await import('jsonwebtoken');
      const TEST_SECRET = 'test-supabase-jwt-secret-for-testing';

      const childToken = jwt.sign(
        {
          sub: 'auth-user-uuid-child',
          exp: Math.floor(Date.now() / 1000) + 3600,
          app_metadata: {
            role: 'CHILD',
            user_id: 'public-user-uuid-parent',
            child_id: 'child-profile-uuid-123',
          },
        },
        TEST_SECRET,
      );

      const { AuthGuard } =
        await import('../../../src/common/guards/auth.guard');

      const mockConfigService = { get: jest.fn().mockReturnValue(TEST_SECRET) };
      const mockReflector = {
        getAllAndOverride: jest.fn().mockReturnValue(false),
      };
      const guard = new AuthGuard(
        mockReflector as any,
        mockConfigService as any,
      );

      const mockRequest = {
        headers: { authorization: `Bearer ${childToken}` },
        user: undefined as any,
      };
      const mockContext = createMockExecutionContext(mockRequest);

      guard.canActivate(mockContext);

      expect(mockRequest.user).toMatchObject({
        sub: 'auth-user-uuid-child',
        role: 'CHILD',
        userId: 'public-user-uuid-parent',
        childId: 'child-profile-uuid-123',
      });
    });
  });
});

// Helper function following existing story-1-3 patterns
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
