import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types/jwt-payload.type';
import { ConsentService } from './consent.service';
import { CreateConsentDto } from './dto/create-consent.dto';

/** Loose IPv4 / IPv6 pattern for basic format validation of stored IP addresses. */
const IP_PATTERN =
  /^(?:\d{1,3}\.){3}\d{1,3}$|^[0-9a-fA-F:]{2,39}$/;

/**
 * Extracts and validates the client IP address from the request.
 *
 * Reads `X-Forwarded-For` first (set by trusted reverse proxy in production),
 * then falls back to `req.ip`. Returns `undefined` if the extracted value is
 * not a valid IPv4 or IPv6 address — prevents arbitrary strings from being
 * stored in the audit field.
 */
function extractIpAddress(req: {
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
}): string | undefined {
  const forwardedFor = req.headers?.['x-forwarded-for'];
  const candidate =
    (typeof forwardedFor === 'string'
      ? forwardedFor.split(',')[0]?.trim()
      : undefined) ?? req.ip;

  if (candidate && IP_PATTERN.test(candidate)) {
    return candidate;
  }
  return undefined;
}

@ApiTags('consent')
@Controller('api/v1/consent')
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Post()
  @Roles('PARENT')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Grant parental consent for child app usage' })
  @ApiResponse({ status: 201, description: 'Consent granted' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async grantConsent(
    @Body() dto: CreateConsentDto,
    @CurrentUser() user: RequestUser,
    @Req() req: any,
  ) {
    const parentId = user.userId ?? user.sub;
    const ipAddress = extractIpAddress(req);

    return this.consentService.grantConsent(parentId, dto, ipAddress);
  }

  @Get()
  @Roles('PARENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current consent status for parent' })
  @ApiResponse({ status: 200, description: 'Consent record found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'No consent record found' })
  async getConsent(@CurrentUser() user: RequestUser) {
    const parentId = user.userId ?? user.sub;
    const record = await this.consentService.getConsent(parentId);

    if (!record) {
      throw new NotFoundException('Consent record not found');
    }

    return {
      status: record.status,
      consentVersion: record.consentVersion,
      consentTimestamp: record.consentTimestamp,
    };
  }
}
