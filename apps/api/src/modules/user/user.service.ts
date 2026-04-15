import {
    Injectable,
    Inject,
    NotFoundException,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PrismaService } from '../../prisma/prisma.service';
import {
    ChildDataResponseDto,
    ChildProfileDataDto,
    LearningProgressDataDto,
    PronunciationScoreDataDto,
    BadgeDataDto,
} from './dto/child-data.dto';

/**
 * Service handling user data management features (Story 2.7):
 * - Retrieve all child data for display/export
 * - Delete child account with cascade
 * - Auto-delete inactive accounts (used by scheduled job)
 */
@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService,
    ) { }

    /**
     * Retrieves all data for a child profile, verifying parent ownership.
     *
     * Returns profile info, learning progress, pronunciation scores (≤100),
     * and badges. Voice data is NEVER returned as it is never stored (FR24).
     *
     * @throws NotFoundException when childId doesn't belong to parentId
     */
    async getChildData(
        parentId: string,
        childId: string,
    ): Promise<ChildDataResponseDto> {
        // 1. Verify parent owns child (application-level guard — Supabase RLS is defense-in-depth)
        const child = await this.prisma.childProfile.findFirst({
            where: { id: childId, parentId },
        });

        if (!child) {
            throw new NotFoundException('Child not found or access denied');
        }

        // 2. Fetch all child data in parallel
        const [sessions, pronunciationScores, badges, totalSessions] = await Promise.all([
            this.prisma.conversationSession.findMany({
                where: { childId },
                orderBy: { createdAt: 'desc' },
                take: 50, // Limit to 50 most recent sessions for UI
            }),
            this.prisma.pronunciationScore.findMany({
                where: { childId },
                orderBy: { createdAt: 'desc' },
                take: 100, // Limit to 100 most recent scores
            }),
            this.prisma.badge.findMany({
                where: { childId },
                orderBy: { earnedAt: 'asc' },
            }),
            this.prisma.conversationSession.count({ where: { childId } }),
        ]);

        // 3. Map to response DTO
        const profile: ChildProfileDataDto = {
            id: child.id,
            name: child.displayName,
            avatar: child.avatarId,
            age: child.age ?? null,
            createdAt: child.createdAt,
        };

        const learningProgress: LearningProgressDataDto = {
            totalSessions,
            sessions: sessions.map((s) => ({
                id: s.id,
                scenarioId: s.scenarioId,
                status: s.status,
                durationSeconds: s.durationSeconds,
                wordsSpoken: s.wordsSpoken,
                xpEarned: s.xpEarned,
                createdAt: s.createdAt,
            })),
        };

        const pronunciationScoreDtos: PronunciationScoreDataDto[] = pronunciationScores.map((ps) => ({
            sessionId: ps.sessionId,
            word: ps.word,
            phoneme: ps.phoneme ?? null,
            score: ps.score,
            errorType: ps.errorType ?? null,
            createdAt: ps.createdAt,
        }));

        const badgeDtos: BadgeDataDto[] = badges.map((b) => ({
            id: b.id,
            badgeType: b.badgeType,
            name: b.title,
            description: b.description ?? null,
            earnedAt: b.earnedAt,
        }));

        this.logger.log(
            `Child data retrieved for child ${childId} (parent ${parentId})`,
            'UserService',
        );

        return {
            profile,
            learningProgress,
            pronunciationScores: pronunciationScoreDtos,
            badges: badgeDtos,
            // NOTE: No voice data — never stored (FR24)
            exportedAt: new Date().toISOString(),
        };
    }

    /**
     * Permanently deletes a child account and all associated data.
     *
     * Cascade deletion is handled by Prisma schema (onDelete: Cascade on
     * all child-related models). Sends confirmation email to parent.
     *
     * @throws NotFoundException when childId doesn't belong to parentId
     */
    async deleteChildAccount(parentId: string, childId: string): Promise<void> {
        // 1. Verify parent owns child (must check before delete)
        const child = await this.prisma.childProfile.findFirst({
            where: { id: childId, parentId },
        });

        if (!child) {
            throw new NotFoundException('Child not found or access denied');
        }

        // 2. Hard delete — cascade via Prisma schema removes all related records:
        //    ConversationSession, PronunciationScore, Badge, Streak, XpTransaction, SafetyFlag
        await this.prisma.childProfile.delete({ where: { id: childId } });

        // 3. Send confirmation email to parent
        const parent = await this.prisma.parent.findUnique({ where: { id: parentId } });

        if (parent) {
            // Log the deletion notification (email service to be wired when NotificationService is implemented)
            this.logger.log(
                `Account deletion confirmation should be sent to ${parent.email} for child "${child.displayName}"`,
                'UserService',
            );
        }

        this.logger.log(
            `Child account deleted: childId=${childId}, parentId=${parentId}`,
            'UserService',
        );
    }

    /**
     * Updates lastActivityAt for a child profile when a new conversation session occurs.
     * Should be called from ConversationSession creation logic (FR26, Story 2.7).
     *
     * Note: Uses type cast because Prisma client must be regenerated after schema migration
     * (`pnpm prisma generate`) to expose lastActivityAt field in typings.
     */
    async updateLastActivityAt(childId: string): Promise<void> {
        // TODO: Remove cast after running `pnpm prisma generate` with migration for lastActivityAt
        await (this.prisma.childProfile.update as Function)({
            where: { id: childId },
            data: { lastActivityAt: new Date() },
        });
    }

    /**
     * Finds all child profiles inactive for 11-12 months that haven't received a warning yet.
     * Used by AutoDeleteInactiveAccountsJob (AC5).
     *
     * Note: Uses type cast because Prisma client must be regenerated after schema migration.
     */
    async findAccountsNeedingDeletionWarning(): Promise<
        Array<{ childId: string; childName: string; parentEmail: string }>
    > {
        const now = new Date();
        const elevenMonthsAgo = new Date(now);
        elevenMonthsAgo.setMonth(elevenMonthsAgo.getMonth() - 11);
        const twelveMonthsAgo = new Date(now);
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        // TODO: Remove cast after running `pnpm prisma generate`
        interface ChildWithParent { id: string; displayName: string; parent: { email: string }; deletionWarningSent: boolean }
        const accounts = await (this.prisma.childProfile.findMany as Function)({
            where: {
                lastActivityAt: {
                    lt: elevenMonthsAgo,
                    gte: twelveMonthsAgo,
                },
                deletionWarningSent: false,
            },
            include: { parent: true },
        }) as ChildWithParent[];

        return accounts.map((c) => ({
            childId: c.id,
            childName: c.displayName,
            parentEmail: c.parent.email,
        }));
    }

    /**
     * Marks a child profile as having had a deletion warning sent.
     */
    async markDeletionWarningSent(childId: string): Promise<void> {
        // TODO: Remove cast after running `pnpm prisma generate`
        await (this.prisma.childProfile.update as Function)({
            where: { id: childId },
            data: { deletionWarningSent: true },
        });
    }

    /**
     * Finds all child profiles that have been inactive for 12+ months.
     * These accounts should be auto-deleted.
     *
     * Note: includes accounts where `deletionWarningSent` is false (warning failed)
     * to ensure deletion is always enforced per regulation (FR26).
     * A last-minute warning email is logged for such accounts in the job.
     */
    async findAccountsForAutoDeletion(): Promise<
        Array<{ childId: string; childName: string; parentEmail: string; warningWasSent: boolean }>
    > {
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        // TODO: Remove cast after running `pnpm prisma generate`
        interface ChildWithParent { id: string; displayName: string; parent: { email: string }; deletionWarningSent: boolean }
        const accounts = await (this.prisma.childProfile.findMany as Function)({
            where: {
                lastActivityAt: { lt: twelveMonthsAgo },
            },
            include: { parent: true },
        }) as ChildWithParent[];

        return accounts.map((c) => ({
            childId: c.id,
            childName: c.displayName,
            parentEmail: c.parent.email,
            warningWasSent: c.deletionWarningSent,
        }));
    }

    /**
     * Auto-deletes a child account and logs the action.
     * Used by AutoDeleteInactiveAccountsJob (AC5).
     */
    async autoDeleteChildAccount(
        childId: string,
        childName: string,
        parentEmail: string,
    ): Promise<void> {
        try {
            await this.prisma.childProfile.delete({ where: { id: childId } });

            this.logger.log(
                `Auto-deleted inactive child account: childId=${childId}, name="${childName}", parentEmail=${parentEmail}`,
                'UserService',
            );
        } catch (error) {
            this.logger.error(
                `Failed to auto-delete child account ${childId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                undefined,
                'UserService',
            );
            throw new HttpException('Auto-deletion failed', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
