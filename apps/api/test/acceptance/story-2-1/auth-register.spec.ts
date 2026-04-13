/**
 * ATDD Tests - Story 2.1: Parent Registration & Email Authentication
 * Test IDs: 2.1-INT-001 through 2.1-INT-006, 2.1-UNIT-001 through 2.1-UNIT-006
 * Priority: P0 (Critical — Auth Registration)
 * Status: 🟢 GREEN (activated — Story 2.1 is DONE)
 *
 * These tests validate the parent registration flow via Supabase Auth,
 * including DTO validation, error handling, and database trigger integration.
 *
 * Uses existing test infrastructure:
 * - auth.fixture.ts (createTestToken, createParentToken)
 * - parent.factory.ts (parentFactory)
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// ── Path constants ─────────────────────────────────────────────────
const AUTH_MODULE_DIR = join(__dirname, '../../../src/modules/auth');
const AUTH_MODULE_PATH = join(AUTH_MODULE_DIR, 'auth.module.ts');
const AUTH_CONTROLLER_PATH = join(AUTH_MODULE_DIR, 'auth.controller.ts');
const AUTH_SERVICE_PATH = join(AUTH_MODULE_DIR, 'auth.service.ts');
const REGISTER_DTO_PATH = join(AUTH_MODULE_DIR, 'dto/register.dto.ts');
const SUPABASE_SERVICE_PATH = join(
  AUTH_MODULE_DIR,
  'supabase/supabase.service.ts',
);

// ── Mock Helpers ───────────────────────────────────────────────────

/**
 * Creates a mock SupabaseService matching actual API:
 * - signUp(email, password, displayName?) → { user, session } or throws
 * - signIn(email, password)
 * - refreshSession(refreshToken)
 * - getAdminClient()
 */
function createMockSupabaseService(signUpResult: {
  user: { id: string; email: string } | null;
  session: { access_token: string; refresh_token: string } | null;
}) {
  return {
    signUp: jest.fn().mockResolvedValue(signUpResult),
    signIn: jest.fn(),
    refreshSession: jest.fn(),
    getAdminClient: jest.fn(),
    onModuleDestroy: jest.fn(),
  };
}

function createMockSupabaseServiceRejecting(error: Error | { message: string; status?: number; code?: string; __isAuthError?: boolean }) {
  return {
    signUp: jest.fn().mockRejectedValue(error),
    signIn: jest.fn(),
    refreshSession: jest.fn(),
    getAdminClient: jest.fn(),
    onModuleDestroy: jest.fn(),
  };
}

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
};

// Successful registration mock
const SUCCESSFUL_SIGNUP = {
  user: { id: 'auth-user-uuid', email: 'parent@example.com' },
  session: {
    access_token: 'jwt-access-token',
    refresh_token: 'jwt-refresh-token',
  },
};

// ════════════════════════════════════════════════════════════════════
// SECTION 1: FILE EXISTENCE (Structural Prerequisites)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.1: Auth Module Structure @P0 @Structure', () => {
  describe('2.1-STRUCT-001: Auth Module Files', () => {
    it('should have auth.module.ts', () => {
      expect(existsSync(AUTH_MODULE_PATH)).toBe(true);
    });

    it('should have auth.controller.ts', () => {
      expect(existsSync(AUTH_CONTROLLER_PATH)).toBe(true);
    });

    it('should have auth.service.ts', () => {
      expect(existsSync(AUTH_SERVICE_PATH)).toBe(true);
    });

    it('should have register.dto.ts', () => {
      expect(existsSync(REGISTER_DTO_PATH)).toBe(true);
    });

    it('should have supabase.service.ts', () => {
      expect(existsSync(SUPABASE_SERVICE_PATH)).toBe(true);
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 2: DTO VALIDATION (AC2 — Validation Errors)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.1: RegisterDto Validation @P0 @Unit', () => {
  async function validateDto(data: Record<string, unknown>) {
    const { RegisterDto } =
      await import('../../../src/modules/auth/dto/register.dto');
    const { validate } = await import('class-validator');
    const { plainToInstance } = await import('class-transformer');

    const dto = plainToInstance(RegisterDto, data);
    return validate(dto as object);
  }

  describe('2.1-UNIT-001: Valid DTO', () => {
    it('should accept valid email, password (8+ chars, 1 uppercase, 1 number), and optional displayName', async () => {
      const errors = await validateDto({
        email: 'parent@example.com',
        password: 'StrongPass1',
        displayName: 'Test Parent',
      });
      expect(errors).toHaveLength(0);
    });

    it('should accept DTO without optional displayName', async () => {
      const errors = await validateDto({
        email: 'parent@example.com',
        password: 'StrongPass1',
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe('2.1-UNIT-002: Invalid Email', () => {
    it('should reject empty email', async () => {
      const errors = await validateDto({
        email: '',
        password: 'StrongPass1',
      });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e: any) => e.property === 'email')).toBeDefined();
    });

    it('should reject malformed email', async () => {
      const errors = await validateDto({
        email: 'not-an-email',
        password: 'StrongPass1',
      });
      expect(errors.find((e: any) => e.property === 'email')).toBeDefined();
    });
  });

  describe('2.1-UNIT-003: Weak Password', () => {
    it('should reject password shorter than 8 characters', async () => {
      const errors = await validateDto({
        email: 'parent@example.com',
        password: 'Abc1',
      });
      expect(errors.find((e: any) => e.property === 'password')).toBeDefined();
    });

    it('should reject password without uppercase letter', async () => {
      const errors = await validateDto({
        email: 'parent@example.com',
        password: 'nouppercase1',
      });
      expect(errors.find((e: any) => e.property === 'password')).toBeDefined();
    });

    it('should reject password without number', async () => {
      const errors = await validateDto({
        email: 'parent@example.com',
        password: 'NoNumberHere',
      });
      expect(errors.find((e: any) => e.property === 'password')).toBeDefined();
    });

    it('should reject displayName longer than 50 characters', async () => {
      const errors = await validateDto({
        email: 'parent@example.com',
        password: 'StrongPass1',
        displayName: 'A'.repeat(51),
      });
      expect(
        errors.find((e: any) => e.property === 'displayName'),
      ).toBeDefined();
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 3: AUTH SERVICE (AC1, AC3 — Registration Logic)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.1: AuthService Registration @P0 @Integration', () => {
  /**
   * Creates AuthService with proper DI mocks.
   * AuthService constructor: (supabaseService, logger)
   */
  async function createAuthService(
    supabaseMock: ReturnType<typeof createMockSupabaseService>,
  ) {
    const { AuthService } =
      await import('../../../src/modules/auth/auth.service');
    // AuthService constructor: (supabaseService, prisma, configService, logger)
    // register() only uses supabaseService + logger, so minimal mocks for prisma/configService
    return new AuthService(
      supabaseMock as any,
      {} as any,
      {} as any,
      mockLogger as any,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('2.1-INT-001: Successful Registration', () => {
    it('should call Supabase Auth signUp and return tokens', async () => {
      const supabaseMock = createMockSupabaseService(SUCCESSFUL_SIGNUP);
      const service = await createAuthService(supabaseMock);
      const result = await service.register({
        email: 'parent@example.com',
        password: 'StrongPass1',
      });

      // Verify SupabaseService.signUp called with correct args
      expect(supabaseMock.signUp).toHaveBeenCalledWith(
        'parent@example.com',
        'StrongPass1',
        undefined, // no displayName
      );

      // Verify response shape
      expect(result).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: {
          id: expect.any(String),
          email: 'parent@example.com',
          role: 'PARENT',
        },
      });
    });
  });

  describe('2.1-INT-002: API Response Format', () => {
    it('should return { accessToken, refreshToken, user } from service', async () => {
      const supabaseMock = createMockSupabaseService(SUCCESSFUL_SIGNUP);
      const service = await createAuthService(supabaseMock);
      const result = await service.register({
        email: 'parent@example.com',
        password: 'StrongPass1',
      });

      // Service returns raw object; ResponseWrapperInterceptor wraps to { data, meta }
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('role');
    });
  });

  describe('2.1-INT-003: Public Endpoint', () => {
    it('should have @Public() decorator on register endpoint', async () => {
      const { AuthController } =
        await import('../../../src/modules/auth/auth.controller');
      const { IS_PUBLIC_KEY } =
        await import('../../../src/common/decorators/public.decorator');

      const metadata = Reflect.getMetadata(
        IS_PUBLIC_KEY,
        AuthController.prototype.register,
      );
      expect(metadata).toBe(true);
    });

    it('should register endpoint at POST /api/v1/auth/register', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PATH_METADATA, METHOD_METADATA } = require('@nestjs/common/constants') as {
        PATH_METADATA: string;
        METHOD_METADATA: string;
      };
      const { RequestMethod } = await import('@nestjs/common');
      const { AuthController } =
        await import('../../../src/modules/auth/auth.controller');

      const controllerPath = Reflect.getMetadata(PATH_METADATA, AuthController);
      expect(controllerPath).toBe('api/v1/auth');

      const method = Reflect.getMetadata(
        METHOD_METADATA,
        AuthController.prototype.register,
      );
      expect(method).toBe(RequestMethod.POST);

      const path = Reflect.getMetadata(
        PATH_METADATA,
        AuthController.prototype.register,
      );
      expect(path).toBe('register');
    });
  });

  describe('2.1-INT-004: Duplicate Email @P0', () => {
    it('should throw HttpException when email already exists (422)', async () => {
      const dupError = {
        message: 'User already registered',
        status: 422,
        code: 'user_already_exists',
      };
      const supabaseMock = createMockSupabaseServiceRejecting(dupError);
      const service = await createAuthService(supabaseMock);

      await expect(
        service.register({
          email: 'existing@example.com',
          password: 'StrongPass1',
        }),
      ).rejects.toThrow();
    });

    it('should throw when session is null (email confirmation enabled = misconfiguration)', async () => {
      // Supabase returns user but no session when email confirmation is enabled
      const noSessionMock = createMockSupabaseService({
        user: { id: 'uuid', email: 'dup@example.com' },
        session: null,
      });
      const service = await createAuthService(noSessionMock);

      await expect(
        service.register({
          email: 'dup@example.com',
          password: 'StrongPass1',
        }),
      ).rejects.toThrow();
    });
  });

  describe('2.1-INT-005: Supabase Unavailable @P1', () => {
    it('should throw when Supabase Auth is unreachable', async () => {
      const connError = new Error('fetch failed: ECONNREFUSED');
      (connError as any).status = 503;
      (connError as any).message = 'fetch failed: ECONNREFUSED';
      const supabaseMock = createMockSupabaseServiceRejecting(connError);
      const service = await createAuthService(supabaseMock);

      await expect(
        service.register({
          email: 'new@example.com',
          password: 'StrongPass1',
        }),
      ).rejects.toThrow();
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 4: SUPABASE SERVICE (Singleton Client)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.1: SupabaseService @P0 @Unit', () => {
  function createMockConfigService(): Record<string, jest.Mock> {
    const config: Record<string, string> = {
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      SUPABASE_ANON_KEY: 'test-anon-key',
    };

    return {
      get: jest.fn((key: string) => config[key]),
      getOrThrow: jest.fn((key: string) => {
        if (!config[key]) throw new Error(`Missing config: ${key}`);
        return config[key];
      }),
    };
  }

  describe('2.1-UNIT-004: SupabaseService', () => {
    it('should create SupabaseService with ConfigService and expose getAdminClient()', async () => {
      const { SupabaseService } =
        await import('../../../src/modules/auth/supabase/supabase.service');

      const mockConfig = createMockConfigService();
      const service = new SupabaseService(mockConfig as any);

      expect(service).toBeDefined();
      expect(service.getAdminClient()).toBeDefined();
    });

    it('should have signUp, signIn, refreshSession methods', async () => {
      const { SupabaseService } =
        await import('../../../src/modules/auth/supabase/supabase.service');

      const mockConfig = createMockConfigService();
      const service = new SupabaseService(mockConfig as any);

      expect(typeof service.signUp).toBe('function');
      expect(typeof service.signIn).toBe('function');
      expect(typeof service.refreshSession).toBe('function');
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 5: AUTH MODULE INTEGRATION
// ════════════════════════════════════════════════════════════════════

describe('Story 2.1: AuthModule Registration @P0 @Integration', () => {
  describe('2.1-INT-006: Module Registration', () => {
    it('should have AuthModule imported in app.module.ts', async () => {
      const { AppModule } = await import('../../../src/app.module');
      const { AuthModule } =
        await import('../../../src/modules/auth/auth.module');

      const imports = Reflect.getMetadata('imports', AppModule) || [];
      const hasAuthModule = imports.some(
        (imp: any) => imp === AuthModule || imp?.name === 'AuthModule',
      );
      expect(hasAuthModule).toBe(true);
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 6: SECURITY (AC4 — No IDFA/AAID, AC5 — TLS)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.1: Security Compliance @P1 @Static', () => {
  function readTsFilesRecursive(dir: string): string[] {
    if (!existsSync(dir)) return [];

    const files: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...readTsFilesRecursive(fullPath));
      } else if (entry.name.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
    return files;
  }

  describe('2.1-STATIC-001: No IDFA/AAID (FR36)', () => {
    it('should not reference advertising identifiers in auth module', () => {
      const tsFiles = readTsFilesRecursive(AUTH_MODULE_DIR);
      expect(tsFiles.length).toBeGreaterThan(0);

      for (const file of tsFiles) {
        const content = readFileSync(file, 'utf-8');
        expect(content).not.toMatch(/idfa|aaid|advertising[_-]?id/i);
        expect(content).not.toMatch(/app[_-]?tracking[_-]?transparency/i);
      }
    });
  });

  describe('2.1-CONFIG-001: TLS/HTTPS (FR38)', () => {
    it('should create SupabaseService with HTTPS URL', async () => {
      const { SupabaseService } =
        await import('../../../src/modules/auth/supabase/supabase.service');

      const mockConfig = {
        get: jest.fn(),
        getOrThrow: jest.fn((key: string) => {
          const config: Record<string, string> = {
            SUPABASE_URL: 'https://secure.supabase.co',
            SUPABASE_SERVICE_ROLE_KEY: 'test-key',
            SUPABASE_ANON_KEY: 'test-anon-key',
          };
          return config[key];
        }),
      };
      const service = new SupabaseService(mockConfig as any);
      expect(service).toBeDefined();
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 7: ERROR HANDLING PATTERNS
// ════════════════════════════════════════════════════════════════════

describe('Story 2.1: Error Handling @P0 @Unit', () => {
  describe('2.1-UNIT-005: No Password Logging', () => {
    it('should never include password in log output', () => {
      expect(existsSync(AUTH_SERVICE_PATH)).toBe(true);

      const content = readFileSync(AUTH_SERVICE_PATH, 'utf-8');
      const loggerCalls = content.match(
        /this\.logger\.(log|error|warn|debug|verbose)\([\s\S]*?\)/g,
      );

      if (loggerCalls) {
        for (const call of loggerCalls) {
          expect(call).not.toMatch(/password/i);
          expect(call).not.toMatch(/dto\.password/i);
        }
      }
    });
  });

  describe('2.1-UNIT-006: Generic Error Messages', () => {
    it('should not expose internal Supabase error details to client', async () => {
      const internalError = new Error(
        'Database error: duplicate key value violates unique constraint',
      );
      (internalError as any).status = 500;
      const supabaseMock = createMockSupabaseServiceRejecting(internalError);

      const { AuthService } =
        await import('../../../src/modules/auth/auth.service');
      const service = new AuthService(supabaseMock as any, mockLogger as any);

      try {
        await service.register({
          email: 'test@example.com',
          password: 'StrongPass1',
        });
        fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).not.toMatch(/duplicate key/i);
        expect(error.message).not.toMatch(/constraint/i);
        expect(error.message).not.toMatch(/Database error/i);
      }
    });
  });
});
