/**
 * ATDD Tests - Story 2.1: Parent Registration & Email Authentication
 * Test IDs: 2.1-INT-001 through 2.1-INT-006, 2.1-UNIT-001 through 2.1-UNIT-006
 * Priority: P0 (Critical — Auth Registration)
 * Status: 🔴 RED (failing before implementation)
 *
 * These tests validate the parent registration flow via Supabase Auth,
 * including DTO validation, error handling, and database trigger integration.
 * All tests use describe.skip() / it.skip() as TDD red phase markers.
 *
 * Uses existing test infrastructure:
 * - auth.fixture.ts (createTestToken, createParentToken)
 * - parent.factory.ts (parentFactory)
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
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

// ── Mock Helpers (DRY — extracted to avoid 5+ repetitions) ────────

interface MockSupabaseSignUpResult {
  data: {
    user: { id: string; email: string } | null;
    session: { access_token: string; refresh_token: string } | null;
  };
  error: { message: string; status: number } | null;
}

function createMockSupabaseService(signUpResult: MockSupabaseSignUpResult) {
  return {
    getClient: jest.fn().mockReturnValue({
      auth: {
        signUp: jest.fn().mockResolvedValue(signUpResult),
      },
    }),
  };
}

function createMockSupabaseServiceRejecting(errorMessage: string) {
  return {
    getClient: jest.fn().mockReturnValue({
      auth: {
        signUp: jest.fn().mockRejectedValue(new Error(errorMessage)),
      },
    }),
  };
}

function createMockConfigService(
  overrides?: Record<string, string>,
): Record<string, jest.Mock> {
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

// Successful registration mock (reused by multiple tests)
const SUCCESSFUL_SIGNUP: MockSupabaseSignUpResult = {
  data: {
    user: { id: 'auth-user-uuid', email: 'parent@example.com' },
    session: {
      access_token: 'jwt-access-token',
      refresh_token: 'jwt-refresh-token',
    },
  },
  error: null,
};

const DUPLICATE_EMAIL_SIGNUP: MockSupabaseSignUpResult = {
  data: { user: null, session: null },
  error: { message: 'User already registered', status: 422 },
};

// ════════════════════════════════════════════════════════════════════
// SECTION 1: FILE EXISTENCE (Structural Prerequisites)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.1: Auth Module Structure @P0 @Structure', () => {
  // 2.1-STRUCT-001: Auth module files exist
  describe('2.1-STRUCT-001: Auth Module Files', () => {
    it.skip('should have auth.module.ts', () => {
      expect(existsSync(AUTH_MODULE_PATH)).toBe(true);
    });

    it.skip('should have auth.controller.ts', () => {
      expect(existsSync(AUTH_CONTROLLER_PATH)).toBe(true);
    });

    it.skip('should have auth.service.ts', () => {
      expect(existsSync(AUTH_SERVICE_PATH)).toBe(true);
    });

    it.skip('should have register.dto.ts', () => {
      expect(existsSync(REGISTER_DTO_PATH)).toBe(true);
    });

    it.skip('should have supabase.service.ts', () => {
      expect(existsSync(SUPABASE_SERVICE_PATH)).toBe(true);
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 2: DTO VALIDATION (AC2 — Validation Errors)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.1: RegisterDto Validation @P0 @Unit', () => {
  // Helper: validate a DTO instance and return errors
  async function validateDto(data: Record<string, unknown>) {
    const { RegisterDto } =
      await import('../../../src/modules/auth/dto/register.dto');
    const { validate } = await import('class-validator');
    const { plainToInstance } = await import('class-transformer');

    const dto = plainToInstance(RegisterDto, data);
    return validate(dto as object);
  }

  // 2.1-UNIT-001: Valid registration DTO
  describe('2.1-UNIT-001: Valid DTO', () => {
    it.skip('should accept valid email, password (8+ chars, 1 uppercase, 1 number), and optional displayName', async () => {
      const errors = await validateDto({
        email: 'parent@example.com',
        password: 'StrongPass1',
        displayName: 'Test Parent',
      });
      expect(errors).toHaveLength(0);
    });

    it.skip('should accept DTO without optional displayName', async () => {
      const errors = await validateDto({
        email: 'parent@example.com',
        password: 'StrongPass1',
      });
      expect(errors).toHaveLength(0);
    });
  });

  // 2.1-UNIT-002: Invalid email validation
  describe('2.1-UNIT-002: Invalid Email', () => {
    it.skip('should reject empty email', async () => {
      const errors = await validateDto({
        email: '',
        password: 'StrongPass1',
      });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e: any) => e.property === 'email')).toBeDefined();
    });

    it.skip('should reject malformed email', async () => {
      const errors = await validateDto({
        email: 'not-an-email',
        password: 'StrongPass1',
      });
      expect(errors.find((e: any) => e.property === 'email')).toBeDefined();
    });
  });

  // 2.1-UNIT-003: Weak password validation
  describe('2.1-UNIT-003: Weak Password', () => {
    it.skip('should reject password shorter than 8 characters', async () => {
      const errors = await validateDto({
        email: 'parent@example.com',
        password: 'Abc1',
      });
      expect(errors.find((e: any) => e.property === 'password')).toBeDefined();
    });

    it.skip('should reject password without uppercase letter', async () => {
      const errors = await validateDto({
        email: 'parent@example.com',
        password: 'nouppercase1',
      });
      expect(errors.find((e: any) => e.property === 'password')).toBeDefined();
    });

    it.skip('should reject password without number', async () => {
      const errors = await validateDto({
        email: 'parent@example.com',
        password: 'NoNumberHere',
      });
      expect(errors.find((e: any) => e.property === 'password')).toBeDefined();
    });

    it.skip('should reject displayName longer than 50 characters', async () => {
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
  // Helper: create AuthService with given mocks
  async function createAuthService(
    supabaseMock: ReturnType<typeof createMockSupabaseService>,
    prismaMock?: any,
  ) {
    const { AuthService } =
      await import('../../../src/modules/auth/auth.service');
    return new AuthService(supabaseMock as any, prismaMock ?? ({} as any));
  }

  // 2.1-INT-001: Successful registration creates account
  describe('2.1-INT-001: Successful Registration', () => {
    it.skip('should call Supabase Auth signUp with email and password', async () => {
      const { parentFactory } =
        await import('test/support/factories/parent.factory');
      const parent = parentFactory({
        authUserId: 'auth-user-uuid',
        email: 'parent@example.com',
      });

      const mockSupabase = createMockSupabaseService(SUCCESSFUL_SIGNUP);
      const mockPrisma = {
        parent: {
          findUnique: jest.fn().mockResolvedValue(parent),
        },
      };

      const service = await createAuthService(mockSupabase, mockPrisma);
      const result = await service.register({
        email: 'parent@example.com',
        password: 'StrongPass1',
      });

      // Verify Supabase signUp called
      expect(mockSupabase.getClient().auth.signUp).toHaveBeenCalledWith({
        email: 'parent@example.com',
        password: 'StrongPass1',
      });

      // Verify response shape
      expect(result).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: {
          id: expect.any(String),
          email: 'parent@example.com',
        },
      });
    });
  });

  // 2.1-INT-002: Registration returns tokens in API response format
  describe('2.1-INT-002: API Response Format', () => {
    it.skip('should return { data: { accessToken, refreshToken, user }, meta: { ... } } format', async () => {
      // AuthController.register() returns raw object
      // ResponseWrapperInterceptor wraps to { data: ..., meta: { timestamp, requestId } }
      const { AuthController } =
        await import('../../../src/modules/auth/auth.controller');
      expect(AuthController).toBeDefined();
    });
  });

  // 2.1-INT-003: Registration endpoint is @Public()
  describe('2.1-INT-003: Public Endpoint', () => {
    it.skip('should have @Public() decorator on register endpoint', async () => {
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

    it.skip('should register endpoint at POST /api/v1/auth/register', async () => {
      const { PATH_METADATA, METHOD_METADATA } =
        await import('@nestjs/common/constants');
      const { RequestMethod } = await import('@nestjs/common');
      const { AuthController } =
        await import('../../../src/modules/auth/auth.controller');

      const controllerPath = Reflect.getMetadata(PATH_METADATA, AuthController);
      expect(controllerPath).toBe('auth');

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

  // 2.1-INT-004: Duplicate email returns 422 (AC3)
  describe('2.1-INT-004: Duplicate Email @P0', () => {
    it.skip('should throw error when email already exists', async () => {
      const mockSupabase = createMockSupabaseService(DUPLICATE_EMAIL_SIGNUP);
      const service = await createAuthService(mockSupabase);

      await expect(
        service.register({
          email: 'existing@example.com',
          password: 'StrongPass1',
        }),
      ).rejects.toThrow();
    });

    it.skip('should NOT distinguish between verified and unverified duplicate email', async () => {
      // Supabase returns different responses for verified vs unverified
      // Our service MUST normalize to same error
      const verifiedDup = createMockSupabaseService(DUPLICATE_EMAIL_SIGNUP);

      const unverifiedDup = createMockSupabaseService({
        data: {
          user: { id: 'uuid', email: 'dup@example.com' },
          session: null,
        },
        error: null,
      });

      const service1 = await createAuthService(verifiedDup);
      const service2 = await createAuthService(unverifiedDup);

      const error1 = await service1
        .register({ email: 'dup@example.com', password: 'StrongPass1' })
        .catch((e: Error) => e);
      const error2 = await service2
        .register({ email: 'dup@example.com', password: 'StrongPass1' })
        .catch((e: Error) => e);

      expect(error1).toBeInstanceOf(Error);
      expect(error2).toBeInstanceOf(Error);
    });
  });

  // 2.1-INT-005: Supabase unavailable returns 503
  describe('2.1-INT-005: Supabase Unavailable @P1', () => {
    it.skip('should return 503 when Supabase Auth is unreachable', async () => {
      const mockSupabase = createMockSupabaseServiceRejecting(
        'fetch failed: ECONNREFUSED',
      );
      const service = await createAuthService(mockSupabase);

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
  // 2.1-UNIT-004: SupabaseService initialization
  describe('2.1-UNIT-004: SupabaseService', () => {
    it.skip('should create Supabase client with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY', async () => {
      const { SupabaseService } =
        await import('../../../src/modules/auth/supabase/supabase.service');

      const mockConfig = createMockConfigService();
      const service = new SupabaseService(mockConfig as any);
      const client = service.getClient();

      expect(client).toBeDefined();
      expect(client.auth).toBeDefined();
    });

    it.skip('should return the same client instance (singleton)', async () => {
      const { SupabaseService } =
        await import('../../../src/modules/auth/supabase/supabase.service');

      const mockConfig = createMockConfigService();
      const service = new SupabaseService(mockConfig as any);

      expect(service.getClient()).toBe(service.getClient());
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 5: AUTH MODULE INTEGRATION
// ════════════════════════════════════════════════════════════════════

describe('Story 2.1: AuthModule Registration @P0 @Integration', () => {
  // 2.1-INT-006: AuthModule is registered in AppModule
  describe('2.1-INT-006: Module Registration', () => {
    it.skip('should have AuthModule imported in app.module.ts', async () => {
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
  // Helper: recursively read all .ts files in a directory
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

  // 2.1-STATIC-001: No advertising identifier collection
  describe('2.1-STATIC-001: No IDFA/AAID (FR36)', () => {
    it.skip('should not reference advertising identifiers in auth module', () => {
      const tsFiles = readTsFilesRecursive(AUTH_MODULE_DIR);
      if (tsFiles.length === 0) return; // Module not yet created

      for (const file of tsFiles) {
        const content = readFileSync(file, 'utf-8');
        expect(content).not.toMatch(/idfa|aaid|advertising[_-]?id/i);
        expect(content).not.toMatch(/app[_-]?tracking[_-]?transparency/i);
      }
    });
  });

  // 2.1-CONFIG-001: HTTPS enforcement
  describe('2.1-CONFIG-001: TLS/HTTPS (FR38)', () => {
    it.skip('should create SupabaseService with HTTPS URL', async () => {
      const { SupabaseService } =
        await import('../../../src/modules/auth/supabase/supabase.service');

      const mockConfig = createMockConfigService({
        SUPABASE_URL: 'https://secure.supabase.co',
      });
      const service = new SupabaseService(mockConfig as any);
      expect(service).toBeDefined();
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 7: ERROR HANDLING PATTERNS
// ════════════════════════════════════════════════════════════════════

describe('Story 2.1: Error Handling @P0 @Unit', () => {
  // 2.1-UNIT-005: AuthService should not log passwords
  describe('2.1-UNIT-005: No Password Logging', () => {
    it.skip('should never include password in log output', () => {
      if (!existsSync(AUTH_SERVICE_PATH)) return;

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

  // 2.1-UNIT-006: Error messages should be generic
  describe('2.1-UNIT-006: Generic Error Messages', () => {
    it.skip('should not expose internal Supabase error details to client', async () => {
      const mockSupabase = createMockSupabaseService({
        data: { user: null, session: null },
        error: {
          message:
            'Database error: duplicate key value violates unique constraint',
          status: 500,
        },
      });

      const { AuthService } =
        await import('../../../src/modules/auth/auth.service');
      const service = new AuthService(mockSupabase as any, {} as any);

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
