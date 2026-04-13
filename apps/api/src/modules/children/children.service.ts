import {
  Injectable,
  Inject,
  UnprocessableEntityException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChildDto } from './dto/create-child.dto';
import { ChildProfileDto } from './dto/child-profile.dto';

/** Maximum number of child profiles allowed per parent. */
const MAX_CHILD_PROFILES = 3;

@Injectable()
export class ChildrenService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  /**
   * Creates a new child profile for the given parent.
   *
   * Enforces a limit of 3 child profiles per parent using a serializable
   * transaction to prevent TOCTOU race conditions when concurrent requests
   * are made from the same parent account.
   *
   * Throws `UnprocessableEntityException('PROFILE_LIMIT_REACHED')` when limit is exceeded.
   */
  async createChildProfile(
    parentId: string,
    dto: CreateChildDto,
  ): Promise<ChildProfileDto> {
    try {
      const profile = await this.prisma.$transaction(
        async (tx) => {
          // Count existing profiles INSIDE the transaction so the read
          // and write are atomic — prevents race conditions when two
          // requests arrive simultaneously from the same parent.
          const existingCount = await tx.childProfile.count({
            where: { parentId, isActive: true },
          });

          if (existingCount >= MAX_CHILD_PROFILES) {
            throw new UnprocessableEntityException('PROFILE_LIMIT_REACHED');
          }

          return tx.childProfile.create({
            data: {
              parentId,
              displayName: dto.displayName,
              avatarId: dto.avatarId ?? 1,
              level: 'beginner',
              xpTotal: 0,
            },
          });
        },
        { isolationLevel: 'Serializable' },
      );

      this.logger.log(
        `Child profile created for parent ${parentId}: ${profile.id}`,
        'ChildrenService',
      );

      return {
        id: profile.id,
        parentId: profile.parentId,
        displayName: profile.displayName,
        avatarId: profile.avatarId,
        level: profile.level,
        xpTotal: profile.xpTotal,
        createdAt: profile.createdAt,
      };
    } catch (error) {
      // Re-throw business logic exceptions as-is
      if (
        error instanceof UnprocessableEntityException ||
        error instanceof HttpException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to create child profile for parent ${parentId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        undefined,
        'ChildrenService',
      );

      throw new HttpException(
        'Không thể tạo hồ sơ trẻ em. Vui lòng thử lại.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Returns all active child profiles for a given parent.
   *
   * Ordered by creation date ascending (oldest first).
   */
  async getChildProfiles(parentId: string): Promise<ChildProfileDto[]> {
    try {
      const profiles = await this.prisma.childProfile.findMany({
        where: { parentId, isActive: true },
        orderBy: { createdAt: 'asc' },
      });

      return profiles.map((profile) => ({
        id: profile.id,
        parentId: profile.parentId,
        displayName: profile.displayName,
        avatarId: profile.avatarId,
        level: profile.level,
        xpTotal: profile.xpTotal,
        createdAt: profile.createdAt,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to get child profiles for parent ${parentId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        undefined,
        'ChildrenService',
      );

      throw new HttpException(
        'Không thể lấy danh sách hồ sơ trẻ em. Vui lòng thử lại.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
