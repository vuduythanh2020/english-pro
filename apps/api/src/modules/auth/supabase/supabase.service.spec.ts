import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from './supabase.service';

// Mock @supabase/supabase-js
const mockAnonAuth = { signUp: jest.fn() };
const mockAdminAuth = { signUp: jest.fn() };

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn((url: string, key: string) => {
    // Return different mock clients based on key
    if (key === 'test-anon-key') {
      return { auth: mockAnonAuth };
    }
    return { auth: mockAdminAuth };
  }),
}));

import { createClient } from '@supabase/supabase-js';

describe('SupabaseService', () => {
  let service: SupabaseService;
  let mockConfigService: jest.Mocked<ConfigService>;

  const mockConfig: Record<string, string> = {
    SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockConfigService = {
      getOrThrow: jest.fn((key: string) => {
        if (mockConfig[key]) return mockConfig[key];
        throw new Error(`Missing config: ${key}`);
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SupabaseService>(SupabaseService);
  });

  describe('constructor', () => {
    it('should create two Supabase clients (anon + admin)', () => {
      expect(createClient).toHaveBeenCalledTimes(2);
    });

    it('should create anon client with SUPABASE_ANON_KEY', () => {
      expect(createClient).toHaveBeenCalledWith(
        'http://localhost:54321',
        'test-anon-key',
        { auth: { autoRefreshToken: false, persistSession: false } },
      );
    });

    it('should create admin client with SUPABASE_SERVICE_ROLE_KEY', () => {
      expect(createClient).toHaveBeenCalledWith(
        'http://localhost:54321',
        'test-service-role-key',
        { auth: { autoRefreshToken: false, persistSession: false } },
      );
    });

    it('should throw if SUPABASE_URL is missing', () => {
      const badConfig = {
        getOrThrow: jest.fn((key: string) => {
          if (key === 'SUPABASE_URL') throw new Error('Missing SUPABASE_URL');
          return 'value';
        }),
      } as any;
      expect(() => new SupabaseService(badConfig)).toThrow('Missing SUPABASE_URL');
    });

    it('should throw if SUPABASE_ANON_KEY is missing', () => {
      const badConfig = {
        getOrThrow: jest.fn((key: string) => {
          if (key === 'SUPABASE_ANON_KEY') throw new Error('Missing SUPABASE_ANON_KEY');
          return 'value';
        }),
      } as any;
      expect(() => new SupabaseService(badConfig)).toThrow('Missing SUPABASE_ANON_KEY');
    });

    it('should throw if SUPABASE_SERVICE_ROLE_KEY is missing', () => {
      const badConfig = {
        getOrThrow: jest.fn((key: string) => {
          if (key === 'SUPABASE_SERVICE_ROLE_KEY')
            throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
          return 'value';
        }),
      } as any;
      expect(() => new SupabaseService(badConfig)).toThrow(
        'Missing SUPABASE_SERVICE_ROLE_KEY',
      );
    });
  });

  describe('getAdminClient', () => {
    it('should return the admin Supabase client instance', () => {
      const client = service.getAdminClient();
      expect(client).toBeDefined();
      expect(client.auth).toBeDefined();
    });
  });

  describe('signUp', () => {
    it('should call anonClient.auth.signUp (not admin client)', async () => {
      mockAnonAuth.signUp.mockResolvedValue({
        data: {
          user: { id: 'test-id', email: 'test@example.com' },
          session: { access_token: 'token', refresh_token: 'refresh' },
        },
        error: null,
      });

      const result = await service.signUp('test@example.com', 'Password1');

      expect(mockAnonAuth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password1',
      });
      // Admin client must NOT be called for signUp
      expect(mockAdminAuth.signUp).not.toHaveBeenCalled();
      expect(result).toEqual({
        user: { id: 'test-id', email: 'test@example.com' },
        session: { access_token: 'token', refresh_token: 'refresh' },
      });
    });

    it('should throw when Supabase returns an error', async () => {
      mockAnonAuth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered', status: 422 },
      });

      await expect(
        service.signUp('existing@example.com', 'Password1'),
      ).rejects.toEqual({ message: 'User already registered', status: 422 });
    });
  });

  describe('onModuleDestroy', () => {
    it('should not throw on cleanup', () => {
      expect(() => service.onModuleDestroy()).not.toThrow();
    });
  });
});
