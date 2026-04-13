import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase/supabase.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

const TEST_JWT_SECRET = 'test-jwt-secret-for-unit-tests';

describe('AuthService', () => {
  let service: AuthService;
  let supabaseService: jest.Mocked<SupabaseService>;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  const mockSupabaseService = {
    signUp: jest.fn(),
    signIn: jest.fn(),
    refreshSession: jest.fn(),
    getAdminClient: jest.fn(),
    onModuleDestroy: jest.fn(),
  };

  const mockPrismaService = {
    childProfile: {
      findFirst: jest.fn(),
    },
    parent: {
      findUnique: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'SUPABASE_JWT_SECRET') return TEST_JWT_SECRET;
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    supabaseService = module.get(SupabaseService);

    jest.clearAllMocks();
    // Restore default config mock
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'SUPABASE_JWT_SECRET') return TEST_JWT_SECRET;
      return undefined;
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'parent@example.com',
      password: 'Password1',
    };

    it('should register successfully and return tokens', async () => {
      mockSupabaseService.signUp.mockResolvedValue({
        user: {
          id: 'auth-user-uuid',
          email: 'parent@example.com',
        },
        session: {
          access_token: 'access-token-123',
          refresh_token: 'refresh-token-456',
        },
      });

      const result = await service.register(registerDto);

      expect(result).toEqual({
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        user: {
          id: 'auth-user-uuid',
          email: 'parent@example.com',
          role: 'PARENT',
        },
      });
      expect(supabaseService.signUp).toHaveBeenCalledWith(
        'parent@example.com',
        'Password1',
        undefined,
      );
    });

    it('should pass displayName to supabaseService.signUp', async () => {
      mockSupabaseService.signUp.mockResolvedValue({
        user: { id: 'auth-user-uuid', email: 'parent@example.com' },
        session: { access_token: 'token', refresh_token: 'refresh' },
      });

      await service.register({ ...registerDto, displayName: 'Test Parent' });

      expect(supabaseService.signUp).toHaveBeenCalledWith(
        'parent@example.com',
        'Password1',
        'Test Parent',
      );
    });

    it('should fall back to dto.email when user.email is missing', async () => {
      mockSupabaseService.signUp.mockResolvedValue({
        user: { id: 'auth-user-uuid', email: null },
        session: { access_token: 'token', refresh_token: 'refresh' },
      });

      const result = await service.register(registerDto);
      expect(result.user.email).toBe('parent@example.com');
    });

    it('should throw 422 for duplicate email via status code', async () => {
      mockSupabaseService.signUp.mockRejectedValue({
        message: 'User already registered',
        status: 422,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        new HttpException(
          'Email đã được đăng ký',
          HttpStatus.UNPROCESSABLE_ENTITY,
        ),
      );
    });

    it('should throw 422 for duplicate email via Supabase error code', async () => {
      mockSupabaseService.signUp.mockRejectedValue({
        message: 'A user with this email address has already been registered',
        code: 'user_already_exists',
        status: 422,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        new HttpException(
          'Email đã được đăng ký',
          HttpStatus.UNPROCESSABLE_ENTITY,
        ),
      );
    });

    it('should throw 400 for Supabase validation errors without leaking raw message', async () => {
      mockSupabaseService.signUp.mockRejectedValue({
        message:
          'Password should be at least 6 characters. Internal schema: passwords table',
        status: 400,
      });

      try {
        await service.register(registerDto);
        fail('Should have thrown');
      } catch (e) {
        expect((e as HttpException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
        // Must NOT forward raw Supabase message to client
        const response = (e as HttpException).getResponse();
        const message =
          typeof response === 'string' ? response : (response as any).message;
        expect(message).not.toContain('passwords table');
        expect(message).toBe('Dữ liệu đăng ký không hợp lệ');
      }
    });

    it('should throw 429 for rate limiting', async () => {
      mockSupabaseService.signUp.mockRejectedValue({
        message: 'Rate limit exceeded',
        status: 429,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        new HttpException(
          'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );
    });

    it('should throw 503 when Supabase fetch fails', async () => {
      mockSupabaseService.signUp.mockRejectedValue({
        message: 'fetch failed',
        status: undefined,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        new HttpException(
          'Dịch vụ xác thực tạm thời không khả dụng',
          HttpStatus.SERVICE_UNAVAILABLE,
        ),
      );
    });

    it('should throw 503 when Supabase returns ECONNREFUSED', async () => {
      mockSupabaseService.signUp.mockRejectedValue({
        message: 'connect ECONNREFUSED 127.0.0.1:54321',
        status: undefined,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        new HttpException(
          'Dịch vụ xác thực tạm thời không khả dụng',
          HttpStatus.SERVICE_UNAVAILABLE,
        ),
      );
    });

    it('should throw 503 when Supabase returns 503 status', async () => {
      mockSupabaseService.signUp.mockRejectedValue({
        message: 'Service temporarily unavailable',
        status: 503,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        new HttpException(
          'Dịch vụ xác thực tạm thời không khả dụng',
          HttpStatus.SERVICE_UNAVAILABLE,
        ),
      );
    });

    it('should throw 500 when session is null (email confirmation misconfiguration)', async () => {
      mockSupabaseService.signUp.mockResolvedValue({
        user: { id: 'auth-user-uuid', email: 'parent@example.com' },
        session: null,
      });

      try {
        await service.register(registerDto);
        fail('Should have thrown');
      } catch (e) {
        expect((e as HttpException).getStatus()).toBe(
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      // Should log error (not warn) — this is a misconfiguration
      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should throw 500 when user is null despite session', async () => {
      mockSupabaseService.signUp.mockResolvedValue({
        user: null,
        session: { access_token: 'token', refresh_token: 'refresh' },
      });

      try {
        await service.register(registerDto);
        fail('Should have thrown');
      } catch (e) {
        expect((e as HttpException).getStatus()).toBe(
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    });

    it('should throw 500 for unknown errors', async () => {
      mockSupabaseService.signUp.mockRejectedValue(
        new Error('Something broke'),
      );

      await expect(service.register(registerDto)).rejects.toThrow(
        new HttpException(
          'Đăng ký thất bại. Vui lòng thử lại.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('should not log password in any logger calls', async () => {
      mockSupabaseService.signUp.mockRejectedValue({
        message: 'Unknown error',
        status: 500,
      });

      try {
        await service.register(registerDto);
      } catch {
        // Expected
      }

      const allCalls = [
        ...mockLogger.log.mock.calls,
        ...mockLogger.error.mock.calls,
        ...mockLogger.warn.mock.calls,
      ];
      for (const call of allCalls) {
        for (const arg of call) {
          if (typeof arg === 'string') {
            expect(arg).not.toContain('Password1');
          }
        }
      }
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'parent@example.com',
      password: 'anypassword',
    };

    const mockSession = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
    };

    const mockUser = {
      id: 'auth-user-uuid',
      email: 'parent@example.com',
    };

    it('should login successfully and return tokens (AC1)', async () => {
      mockSupabaseService.signIn.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });

      const result = await service.login(loginDto);

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: {
          id: 'auth-user-uuid',
          email: 'parent@example.com',
          role: 'PARENT',
        },
      });
      expect(mockSupabaseService.signIn).toHaveBeenCalledWith(
        'parent@example.com',
        'anypassword',
      );
    });

    it('should throw 401 with unified error for invalid credentials (AC4)', async () => {
      mockSupabaseService.signIn.mockRejectedValue({
        message: 'Invalid login credentials',
        status: 400,
        __isAuthError: true,
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        new HttpException(
          'Email hoặc mật khẩu không đúng',
          HttpStatus.UNAUTHORIZED,
        ),
      );
    });

    it('should throw 401 via invalid_credentials code (AC4)', async () => {
      mockSupabaseService.signIn.mockRejectedValue({
        message: 'invalid_credentials',
        code: 'invalid_credentials',
        status: 400,
        __isAuthError: true,
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        new HttpException(
          'Email hoặc mật khẩu không đúng',
          HttpStatus.UNAUTHORIZED,
        ),
      );
    });

    it('should throw 429 for rate limiting (AC5)', async () => {
      mockSupabaseService.signIn.mockRejectedValue({
        message: 'Rate limit exceeded',
        status: 429,
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        new HttpException(
          'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );
    });

    it('should throw 503 when Supabase is unavailable', async () => {
      mockSupabaseService.signIn.mockRejectedValue({
        message: 'fetch failed',
        status: undefined,
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        new HttpException(
          'Dịch vụ xác thực tạm thời không khả dụng',
          HttpStatus.SERVICE_UNAVAILABLE,
        ),
      );
    });

    it('should throw 503 for ECONNREFUSED', async () => {
      mockSupabaseService.signIn.mockRejectedValue({
        message: 'connect ECONNREFUSED 127.0.0.1:54321',
        status: undefined,
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        new HttpException(
          'Dịch vụ xác thực tạm thời không khả dụng',
          HttpStatus.SERVICE_UNAVAILABLE,
        ),
      );
    });

    it('should throw 500 when session is null despite successful call', async () => {
      mockSupabaseService.signIn.mockResolvedValue({
        user: mockUser,
        session: null,
      });

      await expect(service.login(loginDto)).rejects.toThrow(HttpException);
      const call = await service.login(loginDto).catch((e: HttpException) => e);
      expect((call as HttpException).getStatus()).toBe(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });

    it('should not log the password in any logger call', async () => {
      mockSupabaseService.signIn.mockRejectedValue({
        message: 'Unknown error',
        status: 500,
      });

      try {
        await service.login({
          email: 'test@example.com',
          password: 'Secret123',
        });
      } catch {
        // Expected
      }

      const allCalls = [
        ...mockLogger.log.mock.calls,
        ...mockLogger.error.mock.calls,
        ...mockLogger.warn.mock.calls,
      ];
      for (const call of allCalls) {
        for (const arg of call) {
          if (typeof arg === 'string') {
            expect(arg).not.toContain('Secret123');
          }
        }
      }
    });
  });

  describe('refresh', () => {
    const refreshDto = { refreshToken: 'valid-refresh-token' };

    it('should refresh successfully and return new tokens (AC2)', async () => {
      mockSupabaseService.refreshSession.mockResolvedValue({
        user: { id: 'auth-user-uuid', email: 'parent@example.com' },
        session: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
        },
      });

      const result = await service.refresh(refreshDto);

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
      expect(mockSupabaseService.refreshSession).toHaveBeenCalledWith(
        'valid-refresh-token',
      );
    });

    it('should throw 401 for invalid refresh token', async () => {
      mockSupabaseService.refreshSession.mockRejectedValue({
        message: 'Invalid Refresh Token: Already Used',
        code: 'refresh_token_not_found',
        status: 400,
        __isAuthError: true,
      });

      await expect(service.refresh(refreshDto)).rejects.toThrow(
        new HttpException(
          'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          HttpStatus.UNAUTHORIZED,
        ),
      );
    });

    it('should throw 401 for expired session', async () => {
      mockSupabaseService.refreshSession.mockRejectedValue({
        message: 'Session not found',
        code: 'session_not_found',
        status: 400,
        __isAuthError: true,
      });

      await expect(service.refresh(refreshDto)).rejects.toThrow(
        new HttpException(
          'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          HttpStatus.UNAUTHORIZED,
        ),
      );
    });

    it('should throw 401 when session is null after refresh', async () => {
      mockSupabaseService.refreshSession.mockResolvedValue({
        user: null,
        session: null,
      });

      await expect(service.refresh(refreshDto)).rejects.toThrow(
        new HttpException(
          'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          HttpStatus.UNAUTHORIZED,
        ),
      );
    });

    it('should throw 503 when Supabase is unavailable', async () => {
      mockSupabaseService.refreshSession.mockRejectedValue({
        message: 'fetch failed',
        status: undefined,
      });

      await expect(service.refresh(refreshDto)).rejects.toThrow(
        new HttpException(
          'Dịch vụ xác thực tạm thời không khả dụng',
          HttpStatus.SERVICE_UNAVAILABLE,
        ),
      );
    });
  });

  describe('generateChildJwt', () => {
    const parentId = 'parent-uuid-123';
    const childId = 'child-uuid-456';

    it('should generate valid child JWT with correct claims', async () => {
      mockPrismaService.childProfile.findFirst.mockResolvedValue({
        id: childId,
        parentId,
        displayName: 'Bé Nam',
        avatarId: 3,
        isActive: true,
      });

      const result = await service.generateChildJwt(parentId, childId);

      expect(result.childId).toBe(childId);
      expect(result.expiresIn).toBe(3600);
      expect(result.childProfile).toEqual({
        displayName: 'Bé Nam',
        avatarId: 3,
      });

      // Verify JWT claims
      const decoded = jwt.verify(result.accessToken, TEST_JWT_SECRET) as any;
      expect(decoded.sub).toBe(childId);
      expect(decoded.role).toBe('child');
      expect(decoded.childId).toBe(childId);
      expect(decoded.parentId).toBe(parentId);
      expect(decoded.exp).toBeDefined();
    });

    it('should throw 404 when child not owned by parent', async () => {
      mockPrismaService.childProfile.findFirst.mockResolvedValue(null);

      await expect(
        service.generateChildJwt(parentId, childId),
      ).rejects.toThrow(HttpException);

      try {
        await service.generateChildJwt(parentId, childId);
      } catch (e) {
        expect((e as HttpException).getStatus()).toBe(HttpStatus.NOT_FOUND);
        const response = (e as HttpException).getResponse() as any;
        expect(response.error).toBe('CHILD_PROFILE_NOT_FOUND');
      }
    });

    it('should throw 404 when child profile is inactive', async () => {
      // findFirst with isActive: true will return null for inactive profiles
      mockPrismaService.childProfile.findFirst.mockResolvedValue(null);

      await expect(
        service.generateChildJwt(parentId, childId),
      ).rejects.toThrow(HttpException);
    });

    it('should throw 500 when JWT secret is not configured', async () => {
      mockPrismaService.childProfile.findFirst.mockResolvedValue({
        id: childId,
        parentId,
        displayName: 'Bé Nam',
        avatarId: 1,
        isActive: true,
      });
      mockConfigService.get.mockReturnValue(undefined);

      await expect(
        service.generateChildJwt(parentId, childId),
      ).rejects.toThrow(HttpException);

      try {
        await service.generateChildJwt(parentId, childId);
      } catch (e) {
        expect((e as HttpException).getStatus()).toBe(
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    });
  });

  describe('generateParentSessionToken', () => {
    const parentId = 'parent-uuid-123';

    it('should generate valid parent JWT', async () => {
      mockPrismaService.parent.findUnique.mockResolvedValue({
        id: parentId,
        authUserId: 'auth-user-uuid',
        email: 'parent@example.com',
      });

      const result = await service.generateParentSessionToken(parentId);

      expect(result.role).toBe('parent');
      expect(result.accessToken).toBeDefined();

      // Verify JWT claims
      const decoded = jwt.verify(result.accessToken, TEST_JWT_SECRET) as any;
      expect(decoded.sub).toBe('auth-user-uuid');
      expect(decoded.user_role).toBe('PARENT');
      expect(decoded.user_id).toBe(parentId);
      expect(decoded.exp).toBeDefined();
    });

    it('should throw 404 when parent not found', async () => {
      mockPrismaService.parent.findUnique.mockResolvedValue(null);

      await expect(
        service.generateParentSessionToken(parentId),
      ).rejects.toThrow(HttpException);

      try {
        await service.generateParentSessionToken(parentId);
      } catch (e) {
        expect((e as HttpException).getStatus()).toBe(HttpStatus.NOT_FOUND);
      }
    });

    it('should throw 500 when JWT secret is not configured', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      await expect(
        service.generateParentSessionToken(parentId),
      ).rejects.toThrow(HttpException);

      try {
        await service.generateParentSessionToken(parentId);
      } catch (e) {
        expect((e as HttpException).getStatus()).toBe(
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    });
  });
});
