import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  HttpException,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { AuthRateLimit } from '../../common/decorators/throttle.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/jwt-payload.type';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SwitchChildDto } from './dto/switch-child.dto';

@ApiTags('auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @AuthRateLimit()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Register a new parent account' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 422, description: 'Email already registered' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Public()
  @AuthRateLimit()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Post('switch-to-child')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('PARENT')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Switch to child session and get child JWT' })
  @ApiResponse({ status: 200, description: 'Child session started' })
  @ApiResponse({ status: 400, description: 'Invalid childId format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions (not a parent)',
  })
  @ApiResponse({
    status: 404,
    description: 'Child profile not found or not owned by parent',
  })
  async switchToChild(
    @Body() dto: SwitchChildDto,
    @CurrentUser() user: RequestUser,
  ) {
    const parentId = user.userId ?? user.sub;
    return this.authService.generateChildJwt(parentId, dto.childId);
  }

  @Post('switch-to-parent')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('CHILD')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Switch back to parent session from child mode' })
  @ApiResponse({ status: 200, description: 'Parent session restored' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions (not a child session)',
  })
  async switchToParent(@CurrentUser() user: RequestUser) {
    const parentId = user.parentId ?? user.userId;
    if (!parentId) {
      throw new HttpException(
        'Cannot determine parent identity from token',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.authService.generateParentSessionToken(parentId);
  }
}
