import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase/supabase.service';

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
    getAdminClient: jest.fn(),
    onModuleDestroy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    supabaseService = module.get(SupabaseService);

    jest.clearAllMocks();
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
        new HttpException('Email đã được đăng ký', HttpStatus.UNPROCESSABLE_ENTITY),
      );
    });

    it('should throw 422 for duplicate email via Supabase error code', async () => {
      mockSupabaseService.signUp.mockRejectedValue({
        message: 'A user with this email address has already been registered',
        code: 'user_already_exists',
        status: 422,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        new HttpException('Email đã được đăng ký', HttpStatus.UNPROCESSABLE_ENTITY),
      );
    });

    it('should throw 400 for Supabase validation errors without leaking raw message', async () => {
      mockSupabaseService.signUp.mockRejectedValue({
        message: 'Password should be at least 6 characters. Internal schema: passwords table',
        status: 400,
      });

      try {
        await service.register(registerDto);
        fail('Should have thrown');
      } catch (e) {
        expect((e as HttpException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
        // Must NOT forward raw Supabase message to client
        const response = (e as HttpException).getResponse();
        const message = typeof response === 'string' ? response : (response as any).message;
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
        expect((e as HttpException).getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
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
        expect((e as HttpException).getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });

    it('should throw 500 for unknown errors', async () => {
      mockSupabaseService.signUp.mockRejectedValue(new Error('Something broke'));

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
});
