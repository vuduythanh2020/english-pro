import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { ConsentStatus } from '@prisma/client';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConsentDto } from './dto/create-consent.dto';

export interface ConsentRecord {
  id: string;
  status: ConsentStatus;
  consentVersion: string;
  consentTimestamp: Date | null;
}

@Injectable()
export class ConsentService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) { }

  /**
   * Grant parental consent — upsert so re-granting after revocation works.
   *
   * Uses Prisma native `upsert` (NOT a find-then-create/update pattern)
   * because the parent may revoke and re-grant consent.
   */
  /**
   * Resolve the internal parents.id from either parents.id or auth_user_id.
   * This handles the case where the custom_access_token_hook hasn't injected
   * the internal user_id claim into the JWT.
   */
  private async resolveParentId(idOrAuthId: string): Promise<string> {
    // Try direct lookup first (id = parents.id)
    const byId = await this.prisma.parent.findUnique({
      where: { id: idOrAuthId },
      select: { id: true },
    });
    if (byId) return byId.id;

    // Fallback: lookup by auth_user_id
    const byAuth = await this.prisma.parent.findUnique({
      where: { authUserId: idOrAuthId },
      select: { id: true },
    });
    if (byAuth) return byAuth.id;

    throw new HttpException(
      'Parent record not found',
      HttpStatus.NOT_FOUND,
    );
  }

  async grantConsent(
    parentIdOrAuthId: string,
    dto: CreateConsentDto,
    ipAddress?: string,
  ): Promise<ConsentRecord> {
    try {
      const parentId = await this.resolveParentId(parentIdOrAuthId);
      const now = new Date();

      const record = await this.prisma.parentalConsent.upsert({
        where: { parentId },
        create: {
          parentId,
          status: ConsentStatus.GRANTED,
          consentVersion: dto.consentVersion,
          consentTimestamp: now,
          ipAddress: ipAddress ?? null,
        },
        update: {
          status: ConsentStatus.GRANTED,
          consentVersion: dto.consentVersion,
          consentTimestamp: now,
          ipAddress: ipAddress ?? null,
        },
      });

      this.logger.log(
        `Consent granted for parent ${parentId}`,
        'ConsentService',
      );

      return {
        id: record.id,
        status: record.status,
        consentVersion: record.consentVersion,
        consentTimestamp: record.consentTimestamp,
      };
    } catch (error) {
      this.logger.error(
        `Failed to grant consent for parent ${parentIdOrAuthId}: ${error instanceof Error ? error.message : 'Unknown error'
        }`,
        undefined,
        'ConsentService',
      );
      throw new HttpException(
        'Không thể lưu consent. Vui lòng thử lại.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Retrieve the current consent record for a parent.
   *
   * Returns `null` when no consent record exists (parent has never consented).
   */
  async getConsent(parentIdOrAuthId: string): Promise<ConsentRecord | null> {
    try {
      const parentId = await this.resolveParentId(parentIdOrAuthId);
      const record = await this.prisma.parentalConsent.findUnique({
        where: { parentId },
      });

      if (!record) return null;

      return {
        id: record.id,
        status: record.status,
        consentVersion: record.consentVersion,
        consentTimestamp: record.consentTimestamp,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get consent for parent ${parentIdOrAuthId}: ${error instanceof Error ? error.message : 'Unknown error'
        }`,
        undefined,
        'ConsentService',
      );
      throw new HttpException(
        'Không thể truy vấn consent. Vui lòng thử lại.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
