import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { SupabaseService } from './supabase/supabase.service';
import { RegisterDto } from './dto/register.dto';

export interface RegisterResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  /**
   * Register a new parent account via Supabase Auth.
   *
   * The Supabase `handle_new_user()` trigger automatically creates a
   * record in `public.parents` when a new auth user is inserted.
   * The `custom_access_token_hook()` then injects `user_role`, `user_id`,
   * and `children_ids` into the JWT claims.
   *
   * PREREQUISITE: Supabase project MUST have "Confirm email" disabled (auto-confirm ON).
   * If email confirmation is required, signUp returns { user, session: null } which is
   * treated as a server misconfiguration — not a user-facing flow.
   */
  async register(dto: RegisterDto): Promise<RegisterResult> {
    try {
      const data = await this.supabaseService.signUp(
        dto.email,
        dto.password,
        dto.displayName,
      );

      if (!data.session) {
        // This indicates Supabase project has "Confirm email" enabled.
        // This app requires auto-confirm ON — email verification is out of scope.
        // Treat as a server misconfiguration, not a user error.
        this.logger.error(
          'Registration returned no session — Supabase "Confirm email" must be disabled (auto-confirm ON). Check Supabase project Auth settings.',
          undefined,
          'AuthService',
        );
        throw new HttpException(
          'Đăng ký thất bại do lỗi cấu hình máy chủ. Vui lòng liên hệ hỗ trợ.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const user = data.user;
      if (!user) {
        throw new HttpException(
          'Đăng ký thất bại. Vui lòng thử lại.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      this.logger.log(
        `Parent registered successfully: ${user.id}`,
        'AuthService',
      );

      return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        user: {
          id: user.id,
          email: user.email || dto.email,
          role: 'PARENT',
        },
      };
    } catch (error) {
      // Re-throw HttpExceptions as-is
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle Supabase-specific errors
      const supabaseError = error as {
        message?: string;
        status?: number;
        code?: string;
      };

      this.logger.error(
        `Registration failed: ${supabaseError.message || 'Unknown error'}`,
        undefined,
        'AuthService',
      );

      // Duplicate email — Supabase returns "User already registered" (status 422)
      if (
        supabaseError.message?.includes('User already registered') ||
        supabaseError.code === 'user_already_exists' ||
        supabaseError.status === 422
      ) {
        throw new HttpException(
          'Email đã được đăng ký',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      // Rate limiting
      if (supabaseError.status === 429) {
        throw new HttpException(
          'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Supabase unavailable
      if (
        supabaseError.status === 503 ||
        supabaseError.message?.includes('fetch failed') ||
        supabaseError.message?.includes('ECONNREFUSED')
      ) {
        throw new HttpException(
          'Dịch vụ xác thực tạm thời không khả dụng',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // Validation errors from Supabase — do NOT forward raw message (may leak internals)
      if (supabaseError.status === 400) {
        throw new HttpException(
          'Dữ liệu đăng ký không hợp lệ',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Unknown error
      throw new HttpException(
        'Đăng ký thất bại. Vui lòng thử lại.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
