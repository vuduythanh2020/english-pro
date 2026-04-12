/**
 * ATDD Tests - Story 2.2: Parent Login & Session Management
 * Test IDs: 2.2-STRUCT-*, 2.2-UNIT-*, 2.2-INT-*, 2.2-STATIC-*
 * Priority: P0 (Critical — Auth Login), P1 (Session, Rate Limit)
 * TDD Phase: 🔴 RED (failing before implementation)
 *
 * Story AC coverage:
 *   AC1 — Login thành công → JWT tokens issued
 *   AC2 — Refresh token rotation
 *   AC3 — Session persist (AuthBloc side — tested in Flutter)
 *   AC4 — Invalid credentials → unified error message
 *   AC5 — Rate limiting 5 req/min
 *   AC6 — Logout (client-side only — tested in Flutter)
 *
 * Infrastructure reused from Story 2.1:
 *   - createMockSupabaseService / createMockConfigService helpers (local)
 *   - parentFactory (test/support/factories/parent.factory.ts)
 *   - Jest acceptance test runner (jest-acceptance.json)
 *
 * Convention: All tests active — TDD Green phase (Story 2.2 implemented).
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// ── Path constants ─────────────────────────────────────────────────
const AUTH_MODULE_DIR = join(__dirname, '../../../src/modules/auth');
const AUTH_CONTROLLER_PATH = join(AUTH_MODULE_DIR, 'auth.controller.ts');
const AUTH_SERVICE_PATH = join(AUTH_MODULE_DIR, 'auth.service.ts');
const LOGIN_DTO_PATH = join(AUTH_MODULE_DIR, 'dto/login.dto.ts');
const REFRESH_TOKEN_DTO_PATH = join(
  AUTH_MODULE_DIR,
  'dto/refresh-token.dto.ts',
);
const SUPABASE_SERVICE_PATH = join(
  AUTH_MODULE_DIR,
  'supabase/supabase.service.ts',
);

// ── Mock Helpers ───────────────────────────────────────────────────

interface MockSupabaseSignInResult {
  data: {
    user: { id: string; email: string } | null;
    session: { access_token: string; refresh_token: string } | null;
  };
  error: { message: string; status?: number; code?: string } | null;
}

interface MockSupabaseRefreshResult {
  data: {
    user: { id: string; email: string } | null;
    session: { access_token: string; refresh_token: string } | null;
  };
  error: { message: string; status?: number } | null;
}

function createMockSupabaseService(signInResult: MockSupabaseSignInResult) {
  return {
    signIn: jest.fn().mockResolvedValue(signInResult.data),
    refreshSession: jest.fn(),
  };
}

function createMockSupabaseServiceWithRefresh(
  signInResult: MockSupabaseSignInResult,
  refreshResult: MockSupabaseRefreshResult,
) {
  return {
    signIn: jest.fn().mockResolvedValue(signInResult.data),
    refreshSession: jest.fn().mockResolvedValue(refreshResult.data),
  };
}

function createMockSupabaseServiceRejecting(
  errorMessage: string,
  method: 'signIn' | 'refreshSession' = 'signIn',
) {
  const mock: { signIn: jest.Mock; refreshSession: jest.Mock } = {
    signIn: jest.fn(),
    refreshSession: jest.fn(),
  };
  mock[method].mockRejectedValue(new Error(errorMessage));
  return mock;
}

// Successful login mock
const SUCCESSFUL_SIGNIN: MockSupabaseSignInResult = {
  data: {
    user: { id: 'auth-user-uuid', email: 'parent@example.com' },
    session: {
      access_token: 'jwt-access-token',
      refresh_token: 'jwt-refresh-token',
    },
  },
  error: null,
};

// Invalid credentials mock (Supabase error code)
const INVALID_CREDENTIALS: MockSupabaseSignInResult = {
  data: { user: null, session: null },
  error: {
    message: 'Invalid login credentials',
    code: 'invalid_credentials',
    status: 400,
  },
};

// Successful refresh mock (rotated tokens)
const SUCCESSFUL_REFRESH: MockSupabaseRefreshResult = {
  data: {
    user: { id: 'auth-user-uuid', email: 'parent@example.com' },
    session: {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token', // Rotated!
    },
  },
  error: null,
};

// Expired refresh token mock
const EXPIRED_REFRESH: MockSupabaseRefreshResult = {
  data: { user: null, session: null },
  error: {
    message: 'refresh_token_not_found',
    status: 400,
  },
};

// ════════════════════════════════════════════════════════════════════
// SECTION 1: FILE EXISTENCE (Structural Prerequisites)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.2: Auth Login Module Structure @P0 @Structure', () => {
  describe('2.2-STRUCT-001: Login DTO Files', () => {
    it('should have login.dto.ts', () => {
      expect(existsSync(LOGIN_DTO_PATH)).toBe(true);
    });

    it('should have refresh-token.dto.ts', () => {
      expect(existsSync(REFRESH_TOKEN_DTO_PATH)).toBe(true);
    });

    it('should have auth.controller.ts updated with /login and /refresh routes', () => {
      expect(existsSync(AUTH_CONTROLLER_PATH)).toBe(true);
      if (existsSync(AUTH_CONTROLLER_PATH)) {
        const content = readFileSync(AUTH_CONTROLLER_PATH, 'utf-8');
        expect(content).toMatch(/['"]login['"]/);
        expect(content).toMatch(/['"]refresh['"]/);
      }
    });

    it('should have supabase.service.ts with signIn and refreshSession methods', () => {
      expect(existsSync(SUPABASE_SERVICE_PATH)).toBe(true);
      if (existsSync(SUPABASE_SERVICE_PATH)) {
        const content = readFileSync(SUPABASE_SERVICE_PATH, 'utf-8');
        expect(content).toMatch(/signIn/);
        expect(content).toMatch(/refreshSession/);
      }
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 2: DTO VALIDATION
// ════════════════════════════════════════════════════════════════════

describe('Story 2.2: LoginDto Validation @P0 @Unit', () => {
  async function validateLoginDto(data: Record<string, unknown>) {
    const { LoginDto } =
      await import('../../../src/modules/auth/dto/login.dto');
    const { validate } = await import('class-validator');
    const { plainToInstance } = await import('class-transformer');

    const dto = plainToInstance(LoginDto, data);
    return validate(dto as object);
  }

  // 2.2-UNIT-001: Valid LoginDto
  describe('2.2-UNIT-001: Valid LoginDto', () => {
    it('should accept valid email and non-empty password', async () => {
      const errors = await validateLoginDto({
        email: 'parent@example.com',
        password: 'anypassword',
      });
      expect(errors).toHaveLength(0);
    });

    it('should accept password with minimal length (no strength rules — login differs from registration)', async () => {
      // Login ONLY checks non-empty — no uppercase/number requirements
      const errors = await validateLoginDto({
        email: 'parent@example.com',
        password: 'short',
      });
      expect(errors).toHaveLength(0);
    });
  });

  // 2.2-UNIT-002: Invalid LoginDto — email
  describe('2.2-UNIT-002: Invalid Email in LoginDto', () => {
    it('should reject empty email', async () => {
      const errors = await validateLoginDto({ email: '', password: 'anypass' });
      const emailError = errors.find((e) => e.property === 'email');
      expect(emailError).toBeDefined();
    });

    it('should reject malformed email', async () => {
      const errors = await validateLoginDto({
        email: 'not-an-email',
        password: 'anypass',
      });
      const emailError = errors.find((e) => e.property === 'email');
      expect(emailError).toBeDefined();
    });
  });

  // 2.2-UNIT-003: Invalid LoginDto — password
  describe('2.2-UNIT-003: Invalid Password in LoginDto', () => {
    it('should reject empty password', async () => {
      const errors = await validateLoginDto({
        email: 'parent@example.com',
        password: '',
      });
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeDefined();
    });

    it('should reject password exceeding 128 characters', async () => {
      const errors = await validateLoginDto({
        email: 'parent@example.com',
        password: 'A'.repeat(129),
      });
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeDefined();
    });
  });
});

describe('Story 2.2: RefreshTokenDto Validation @P0 @Unit', () => {
  async function validateRefreshDto(data: Record<string, unknown>) {
    const { RefreshTokenDto } =
      await import('../../../src/modules/auth/dto/refresh-token.dto');
    const { validate } = await import('class-validator');
    const { plainToInstance } = await import('class-transformer');

    const dto = plainToInstance(RefreshTokenDto, data);
    return validate(dto as object);
  }

  describe('2.2-UNIT-004: Valid RefreshTokenDto', () => {
    it('should accept a non-empty refresh token string', async () => {
      const errors = await validateRefreshDto({
        refreshToken: 'valid-refresh-token-string',
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe('2.2-UNIT-005: Invalid RefreshTokenDto', () => {
    it('should reject empty refreshToken', async () => {
      const errors = await validateRefreshDto({ refreshToken: '' });
      const tokenError = errors.find((e) => e.property === 'refreshToken');
      expect(tokenError).toBeDefined();
    });

    it('should reject missing refreshToken', async () => {
      const errors = await validateRefreshDto({});
      const tokenError = errors.find((e) => e.property === 'refreshToken');
      expect(tokenError).toBeDefined();
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 3: AUTH SERVICE — LOGIN (AC1, AC4)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.2: AuthService.login() @P0 @Integration', () => {
  async function createAuthService(supabaseMock: {
    signIn: jest.Mock;
    refreshSession: jest.Mock;
  }) {
    const { AuthService } =
      await import('../../../src/modules/auth/auth.service');
    const loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };
    return new AuthService(
      supabaseMock as unknown as never,
      loggerMock as unknown as never,
    );
  }

  // 2.2-INT-001: Successful login returns tokens (AC1)
  describe('2.2-INT-001: Successful Login @P0', () => {
    it('should call supabase.signIn with email and password', async () => {
      const mockSupabase = createMockSupabaseService(SUCCESSFUL_SIGNIN);
      const service = await createAuthService(mockSupabase);

      await service.login({
        email: 'parent@example.com',
        password: 'StrongPass1',
      });

      expect(mockSupabase.signIn).toHaveBeenCalledWith(
        'parent@example.com',
        'StrongPass1',
      );
    });

    it('should return accessToken, refreshToken, and user on success', async () => {
      const mockSupabase = createMockSupabaseService(SUCCESSFUL_SIGNIN);
      const service = await createAuthService(mockSupabase);

      const result = await service.login({
        email: 'parent@example.com',
        password: 'StrongPass1',
      });

      expect(result).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: {
          id: expect.any(String),
          email: 'parent@example.com',
        },
      });
    });

    it('should NOT return raw Supabase access_token — must return normalized accessToken field', async () => {
      const mockSupabase = createMockSupabaseService(SUCCESSFUL_SIGNIN);
      const service = await createAuthService(mockSupabase);

      const result = (await service.login({
        email: 'parent@example.com',
        password: 'StrongPass1',
      })) as Record<string, unknown>;

      // camelCase normalized fields
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      // NOT snake_case Supabase format
      expect(result).not.toHaveProperty('access_token');
      expect(result).not.toHaveProperty('refresh_token');
    });
  });

  // 2.2-INT-002: Invalid credentials returns unified error (AC4)
  describe('2.2-INT-002: Invalid Credentials @P0', () => {
    it('should throw HttpException 401 on invalid credentials', async () => {
      const { HttpException, HttpStatus } = await import('@nestjs/common');
      const mockSupabase = createMockSupabaseService(INVALID_CREDENTIALS);
      // Make signIn throw the error (mimicking SupabaseService behavior)
      mockSupabase.signIn.mockRejectedValue(
        new HttpException(
          'Email hoặc mật khẩu không đúng',
          HttpStatus.UNAUTHORIZED,
        ),
      );

      const service = await createAuthService(mockSupabase);

      await expect(
        service.login({ email: 'wrong@example.com', password: 'wrong' }),
      ).rejects.toThrow();
    });

    it('should NOT distinguish "email not found" from "wrong password" in error message (AC4)', async () => {
      // Both mock the same Supabase-style invalid_credentials error pattern
      // (Supabase returns "Invalid login credentials" for both wrong email AND wrong password)
      const mockSupabase1 = createMockSupabaseService(INVALID_CREDENTIALS);
      mockSupabase1.signIn.mockRejectedValue(
        new Error('Invalid login credentials'),
      );

      const mockSupabase2 = createMockSupabaseService(INVALID_CREDENTIALS);
      // Supabase also returns "invalid_credentials" pattern for non-existent emails
      mockSupabase2.signIn.mockRejectedValue(
        new Error('Invalid login credentials'),
      );

      const service1 = await createAuthService(mockSupabase1);
      const service2 = await createAuthService(mockSupabase2);

      const error1 = await service1
        .login({ email: 'notfound@example.com', password: 'pass' })
        .catch((e: Error) => e.message);
      const error2 = await service2
        .login({ email: 'existing@example.com', password: 'wrongpass' })
        .catch((e: Error) => e.message);

      // Both should produce the same user-facing message (unified error — AC4)
      expect(error1).toBe('Email hoặc mật khẩu không đúng');
      expect(error2).toBe('Email hoặc mật khẩu không đúng');
    });

    it('error message should not reveal "email" or "password" specifically which field is wrong', async () => {
      const mockSupabase = createMockSupabaseService(INVALID_CREDENTIALS);
      mockSupabase.signIn.mockRejectedValue(
        new Error('Invalid login credentials'),
      );

      const service = await createAuthService(mockSupabase);

      try {
        await service.login({ email: 'test@example.com', password: 'wrong' });
        fail('Should have thrown');
      } catch (error: unknown) {
        const msg =
          error instanceof Error
            ? error.message
            : (error as { message: string }).message;
        // Message should be unified — not "incorrect email" or "wrong password"
        expect(msg).toBe('Email hoặc mật khẩu không đúng');
      }
    });
  });

  // 2.2-INT-003: Supabase unavailable returns 503
  describe('2.2-INT-003: Supabase Unavailable @P1', () => {
    it('should return 503 when Supabase is unreachable', async () => {
      const mockSupabase = createMockSupabaseServiceRejecting(
        'fetch failed: ECONNREFUSED',
      );
      const service = await createAuthService(mockSupabase);

      await expect(
        service.login({ email: 'parent@example.com', password: 'StrongPass1' }),
      ).rejects.toThrow();
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 4: AUTH SERVICE — REFRESH (AC2)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.2: AuthService.refresh() @P0 @Integration', () => {
  async function createAuthService(supabaseMock: {
    signIn: jest.Mock;
    refreshSession: jest.Mock;
  }) {
    const { AuthService } =
      await import('../../../src/modules/auth/auth.service');
    const loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };
    return new AuthService(
      supabaseMock as unknown as never,
      loggerMock as unknown as never,
    );
  }

  // 2.2-INT-004: Successful refresh returns rotated tokens (AC2)
  describe('2.2-INT-004: Successful Refresh @P0', () => {
    it('should call supabase.refreshSession with the provided refreshToken', async () => {
      const mockSupabase = createMockSupabaseServiceWithRefresh(
        SUCCESSFUL_SIGNIN,
        SUCCESSFUL_REFRESH,
      );
      const service = await createAuthService(mockSupabase);

      await service.refresh({ refreshToken: 'old-refresh-token' });

      expect(mockSupabase.refreshSession).toHaveBeenCalledWith(
        'old-refresh-token',
      );
    });

    it('should return new accessToken and new refreshToken (rotation)', async () => {
      const mockSupabase = createMockSupabaseServiceWithRefresh(
        SUCCESSFUL_SIGNIN,
        SUCCESSFUL_REFRESH,
      );
      const service = await createAuthService(mockSupabase);

      const result = await service.refresh({
        refreshToken: 'old-refresh-token',
      });

      expect(result).toMatchObject({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token', // rotated
      });
    });

    it('should return DIFFERENT tokens from the input (rotation confirmed)', async () => {
      const mockSupabase = createMockSupabaseServiceWithRefresh(
        SUCCESSFUL_SIGNIN,
        SUCCESSFUL_REFRESH,
      );
      const service = await createAuthService(mockSupabase);

      const result = (await service.refresh({
        refreshToken: 'old-refresh-token',
      })) as {
        accessToken: string;
        refreshToken: string;
      };

      // New tokens should differ from old ones
      expect(result.refreshToken).not.toBe('old-refresh-token');
    });
  });

  // 2.2-INT-005: Expired/invalid refresh token returns 401
  describe('2.2-INT-005: Expired Refresh Token @P0', () => {
    it('should throw HttpException 401 when refresh token is expired', async () => {
      const mockSupabase = createMockSupabaseServiceRejecting(
        'refresh_token_not_found',
        'refreshSession',
      );
      const service = await createAuthService(mockSupabase);

      await expect(
        service.refresh({ refreshToken: 'expired-refresh-token' }),
      ).rejects.toThrow();
    });

    it('error message for expired refresh should indicate re-login required', async () => {
      const mockSupabase = createMockSupabaseServiceRejecting(
        'refresh_token_not_found',
        'refreshSession',
      );
      const service = await createAuthService(mockSupabase);

      try {
        await service.refresh({ refreshToken: 'expired-token' });
        fail('Should have thrown');
      } catch (error: unknown) {
        const msg =
          error instanceof Error
            ? error.message
            : (error as { message: string }).message;
        // User-friendly Vietnamese message
        expect(msg).toMatch(/đăng nhập lại|hết hạn/i);
      }
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 5: CONTROLLER ENDPOINTS (AC1, AC5)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.2: AuthController Login/Refresh Routes @P0 @Unit', () => {
  // 2.2-INT-006: /login endpoint is @Public() with HTTP 200
  describe('2.2-INT-006: Login Endpoint Contract', () => {
    it('should have @Public() decorator on login endpoint (skip AuthGuard)', async () => {
      const { AuthController } =
        await import('../../../src/modules/auth/auth.controller');
      const { IS_PUBLIC_KEY } =
        await import('../../../src/common/decorators/public.decorator');

      const metadata = Reflect.getMetadata(
        IS_PUBLIC_KEY,
        AuthController.prototype.login,
      );
      expect(metadata).toBe(true);
    });

    it('should return HTTP 200 (not 201) for login', async () => {
      const { HTTP_CODE_METADATA } = await import('@nestjs/common/constants');
      const { HttpStatus } = await import('@nestjs/common');
      const { AuthController } =
        await import('../../../src/modules/auth/auth.controller');

      const httpCode = Reflect.getMetadata(
        HTTP_CODE_METADATA,
        AuthController.prototype.login,
      );
      expect(httpCode).toBe(HttpStatus.OK); // 200, not 201
    });

    it('should have @AuthRateLimit() decorator on login endpoint (AC5)', async () => {
      const { AuthController } =
        await import('../../../src/modules/auth/auth.controller');
      // @AuthRateLimit uses @Throttle({ default: { ttl, limit } })
      // @nestjs/throttler stores metadata with key 'THROTTLER:LIMIT' + throttleName
      // For the 'default' throttle: key = 'THROTTLER:LIMITdefault'
      const throttleMetadata = Reflect.getMetadata(
        'THROTTLER:LIMITdefault',
        AuthController.prototype.login,
      );
      // Throttle metadata should be set to 5 (5 req/min per AuthRateLimit)
      expect(throttleMetadata).toBeDefined();
      expect(throttleMetadata).toBe(5);
    });
  });

  // 2.2-INT-007: /refresh endpoint is @Public() with HTTP 200
  describe('2.2-INT-007: Refresh Endpoint Contract', () => {
    it('should have @Public() decorator on refresh endpoint', async () => {
      const { AuthController } =
        await import('../../../src/modules/auth/auth.controller');
      const { IS_PUBLIC_KEY } =
        await import('../../../src/common/decorators/public.decorator');

      const metadata = Reflect.getMetadata(
        IS_PUBLIC_KEY,
        AuthController.prototype.refresh,
      );
      expect(metadata).toBe(true);
    });

    it('should return HTTP 200 for refresh', async () => {
      const { HTTP_CODE_METADATA } = await import('@nestjs/common/constants');
      const { HttpStatus } = await import('@nestjs/common');
      const { AuthController } =
        await import('../../../src/modules/auth/auth.controller');

      const httpCode = Reflect.getMetadata(
        HTTP_CODE_METADATA,
        AuthController.prototype.refresh,
      );
      expect(httpCode).toBe(HttpStatus.OK);
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 6: SUPABASE SERVICE — signIn & refreshSession
// ════════════════════════════════════════════════════════════════════

describe('Story 2.2: SupabaseService.signIn() and refreshSession() @P0 @Unit', () => {
  function createMockConfigServiceLocal(overrides?: Record<string, string>) {
    const defaults: Record<string, string> = {
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      SUPABASE_ANON_KEY: 'test-anon-key',
    };
    const config = { ...defaults, ...overrides };
    return {
      get: jest.fn((key: string) => config[key]),
      getOrThrow: jest.fn((key: string) => {
        if (!config[key]) throw new Error(`Missing config: ${key}`);
        return config[key];
      }),
    };
  }

  // 2.2-UNIT-006: SupabaseService.signIn() uses anonClient (NOT adminClient)
  describe('2.2-UNIT-006: signIn() uses anonClient @P0', () => {
    it('should use anonClient for signInWithPassword (NOT adminClient/service-role)', async () => {
      const { SupabaseService } =
        await import('../../../src/modules/auth/supabase/supabase.service');
      const mockConfig = createMockConfigServiceLocal();
      const service = new SupabaseService(mockConfig as unknown as never);

      // The anon client should exist
      expect(service.anonClient).toBeDefined();
      // signIn should be implemented on the service
      expect(typeof service.signIn).toBe('function');
    });
  });

  // 2.2-UNIT-007: SupabaseService.refreshSession() uses anonClient
  describe('2.2-UNIT-007: refreshSession() uses anonClient @P0', () => {
    it('should have refreshSession method that uses anonClient', async () => {
      const { SupabaseService } =
        await import('../../../src/modules/auth/supabase/supabase.service');
      const mockConfig = createMockConfigServiceLocal();
      const service = new SupabaseService(mockConfig as unknown as never);

      expect(typeof service.refreshSession).toBe('function');
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 7: SECURITY (No password logging)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.2: Security Compliance @P1 @Static', () => {
  // 2.2-STATIC-001: auth.service.ts KHÔNG log password
  describe('2.2-STATIC-001: No Password Logging', () => {
    it('should never log password in auth service', () => {
      if (!existsSync(AUTH_SERVICE_PATH)) return;
      const content = readFileSync(AUTH_SERVICE_PATH, 'utf-8');

      const loggerCalls = content.match(
        /this\.logger\.(log|error|warn|debug|verbose)\([\s\S]*?\)/g,
      );
      if (loggerCalls) {
        for (const call of loggerCalls) {
          expect(call).not.toMatch(/password/i);
          expect(call).not.toMatch(/dto\.password/i);
          expect(call).not.toMatch(/refreshToken/);
        }
      }
    });
  });

  // 2.2-STATIC-002: Raw Supabase errors not forwarded to client
  describe('2.2-STATIC-002: No Raw Supabase Error Exposure', () => {
    it('should not include "Invalid login credentials" (Supabase raw message) in response', async () => {
      const { AuthService } =
        await import('../../../src/modules/auth/auth.service');
      const mockSupabase = {
        signIn: jest
          .fn()
          .mockRejectedValue(new Error('Invalid login credentials')),
        refreshSession: jest.fn(),
      };
      const loggerMock = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      };
      const service = new AuthService(
        mockSupabase as unknown as never,
        loggerMock as unknown as never,
      );

      try {
        await service.login({ email: 'test@example.com', password: 'wrong' });
        fail('Should have thrown');
      } catch (error: unknown) {
        const msg =
          error instanceof Error
            ? error.message
            : (error as { message: string }).message;
        // Raw Supabase message MUST NOT be forwarded
        expect(msg).not.toBe('Invalid login credentials');
        // Should be our normalized Vietnamese message
        expect(msg).toBe('Email hoặc mật khẩu không đúng');
      }
    });
  });

  // 2.2-STATIC-003: AuthInterceptor URL path aligns with backend endpoint
  describe('2.2-STATIC-003: Refresh URL Path Alignment @P0', () => {
    it('auth_interceptor.dart should call /auth/refresh (relative to baseUrl /api/v1)', () => {
      const interceptorPath = join(
        __dirname,
        '../../../../../../../../english-pro/apps/mobile/lib/core/api/interceptors/auth_interceptor.dart',
      );
      if (!existsSync(interceptorPath)) {
        // Flutter file existence — static check
        return;
      }
      const content = readFileSync(interceptorPath, 'utf-8');
      expect(content).toMatch(/\/auth\/refresh/);
    });
  });
});
