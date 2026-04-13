import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import * as jwt from 'jsonwebtoken';
import { SupabaseService } from './supabase/supabase.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

export interface RegisterResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

export interface ChildJwtResult {
  accessToken: string;
  expiresIn: number;
  childId: string;
  childProfile: {
    displayName: string;
    avatarId: number;
  };
}

export interface ParentSessionResult {
  accessToken: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
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

  /**
   * Authenticates a parent account via Supabase Auth.
   *
   * Uses the unified error message for invalid credentials —
   * does NOT distinguish between wrong email and wrong password (AC4).
   */
  async login(dto: LoginDto): Promise<LoginResult> {
    try {
      const data = await this.supabaseService.signIn(dto.email, dto.password);

      const session = data.session;
      const user = data.user;

      if (!session || !user) {
        this.logger.error(
          'Login returned no session or user',
          undefined,
          'AuthService',
        );
        throw new HttpException(
          'Đăng nhập thất bại. Vui lòng thử lại.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      this.logger.log(`Parent logged in: ${user.id}`, 'AuthService');

      return {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        user: {
          id: user.id,
          email: user.email || dto.email,
          role: 'PARENT',
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const supabaseError = error as {
        message?: string;
        status?: number;
        code?: string;
        __isAuthError?: boolean;
      };

      this.logger.error(
        `Login failed: ${supabaseError.message || 'Unknown error'}`,
        undefined,
        'AuthService',
      );

      // Invalid credentials — unified message (AC4: do NOT reveal which field is wrong)
      if (
        supabaseError.code === 'invalid_credentials' ||
        supabaseError.message
          ?.toLowerCase()
          .includes('invalid login credentials') ||
        supabaseError.status === 400 ||
        supabaseError.__isAuthError
      ) {
        throw new HttpException(
          'Email hoặc mật khẩu không đúng',
          HttpStatus.UNAUTHORIZED,
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

      throw new HttpException(
        'Đăng nhập thất bại. Vui lòng thử lại.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Refreshes an access token using the provided refresh token.
   *
   * Supabase automatically rotates the refresh token on success —
   * the old refresh token is invalidated and a new one is returned.
   */
  async refresh(dto: RefreshTokenDto): Promise<RefreshResult> {
    try {
      const data = await this.supabaseService.refreshSession(dto.refreshToken);

      const session = data.session;

      if (!session) {
        throw new HttpException(
          'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          HttpStatus.UNAUTHORIZED,
        );
      }

      return {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const supabaseError = error as {
        message?: string;
        status?: number;
        code?: string;
        __isAuthError?: boolean;
      };

      this.logger.error(
        `Token refresh failed: ${supabaseError.message || 'Unknown error'}`,
        undefined,
        'AuthService',
      );

      // Invalid or expired refresh token
      if (
        supabaseError.code === 'refresh_token_not_found' ||
        supabaseError.code === 'session_not_found' ||
        supabaseError.status === 400 ||
        supabaseError.status === 401 ||
        supabaseError.__isAuthError
      ) {
        throw new HttpException(
          'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          HttpStatus.UNAUTHORIZED,
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

      throw new HttpException(
        'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  /**
   * Generates a child-specific JWT for child session.
   *
   * Validates that the child profile belongs to the parent and is active,
   * then generates a JWT with child-specific claims.
   *
   * @param parentId - The parent's UUID (from parent JWT)
   * @param childId - The child profile UUID to switch to
   * @returns Child JWT with profile info
   */
  async generateChildJwt(
    parentId: string,
    childId: string,
  ): Promise<ChildJwtResult> {
    // Validate child belongs to parent and is active
    const childProfile = await this.prisma.childProfile.findFirst({
      where: { id: childId, parentId, isActive: true },
    });

    if (!childProfile) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          error: 'CHILD_PROFILE_NOT_FOUND',
          message: 'Child profile not found or not owned by parent',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    const secret = this.configService.get<string>('SUPABASE_JWT_SECRET');
    if (!secret) {
      this.logger.error(
        'SUPABASE_JWT_SECRET not configured — cannot generate child JWT',
        undefined,
        'AuthService',
      );
      throw new HttpException(
        'Lỗi cấu hình máy chủ',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const expiresIn = 3600; // 1 hour

    const childJwtPayload = {
      sub: childId,
      role: 'child',
      childId,
      parentId,
    };

    const accessToken = jwt.sign(childJwtPayload, secret, {
      algorithm: 'HS256',
      expiresIn,
      noTimestamp: false,
    });

    this.logger.log(
      `Child session started: child=${childId}, parent=${parentId}`,
      'AuthService',
    );

    return {
      accessToken,
      expiresIn,
      childId,
      childProfile: {
        displayName: childProfile.displayName,
        avatarId: childProfile.avatarId,
      },
    };
  }

  /**
   * Re-issues a parent session token when switching back from child mode.
   *
   * Uses Supabase admin client to get the parent user and generate
   * a fresh parent JWT.
   *
   * @param parentId - The parent's UUID (from child JWT claims)
   * @returns Parent JWT with role info
   */
  async generateParentSessionToken(
    parentId: string,
  ): Promise<ParentSessionResult> {
    const secret = this.configService.get<string>('SUPABASE_JWT_SECRET');
    if (!secret) {
      this.logger.error(
        'SUPABASE_JWT_SECRET not configured — cannot generate parent JWT',
        undefined,
        'AuthService',
      );
      throw new HttpException(
        'Lỗi cấu hình máy chủ',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Verify parent exists in database
    const parent = await this.prisma.parent.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          error: 'PARENT_NOT_FOUND',
          message: 'Parent account not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 3600; // 1 hour

    const parentJwtPayload = {
      sub: parent.authUserId,
      role: 'parent',
      user_role: 'PARENT',
      user_id: parentId,
      iat: now,
    };

    const accessToken = jwt.sign(parentJwtPayload, secret, {
      algorithm: 'HS256',
      expiresIn,
    });

    this.logger.log(
      `Parent session restored: parent=${parentId}`,
      'AuthService',
    );

    return {
      accessToken,
      role: 'parent',
    };
  }
}
