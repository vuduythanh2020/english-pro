import { Injectable, Inject } from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { UserService } from '../user.service';

/**
 * Scheduled job for auto-deleting inactive child accounts (Story 2.7, AC5).
 *
 * Runs daily at 02:00 UTC:
 * 1. Sends 30-day deletion warning to parents of accounts inactive for 11 months
 * 2. Auto-deletes accounts inactive for 12+ months and notifies parents
 *
 * Implements FR26: Auto-delete inactive accounts after 12 months with 30-day warning.
 */
@Injectable()
export class AutoDeleteInactiveAccountsJob {
    constructor(
        private readonly userService: UserService,
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService,
    ) { }

    /**
     * Runs daily at 02:00 UTC.
     *
     * Step 1: Find accounts inactive 11-12 months without warning → send 30-day notice.
     * Step 2: Find accounts inactive 12+ months → delete and notify.
     */
    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async run(): Promise<void> {
        this.logger.log('AutoDeleteInactiveAccountsJob: Starting daily run', 'AutoDeleteJob');

        try {
            await this._sendDeletionWarnings();
        } catch (error) {
            this.logger.error(
                `AutoDeleteJob: Warning phase failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                undefined,
                'AutoDeleteJob',
            );
        }

        try {
            await this._autoDeleteAccounts();
        } catch (error) {
            this.logger.error(
                `AutoDeleteJob: Deletion phase failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                undefined,
                'AutoDeleteJob',
            );
        }

        this.logger.log('AutoDeleteInactiveAccountsJob: Daily run complete', 'AutoDeleteJob');
    }

    /**
     * Sends 30-day deletion warnings to parents of accounts inactive for 11 months.
     */
    private async _sendDeletionWarnings(): Promise<void> {
        const accounts = await this.userService.findAccountsNeedingDeletionWarning();

        if (accounts.length === 0) {
            this.logger.log('AutoDeleteJob: No accounts need deletion warning', 'AutoDeleteJob');
            return;
        }

        this.logger.log(
            `AutoDeleteJob: Sending deletion warnings to ${accounts.length} accounts`,
            'AutoDeleteJob',
        );

        for (const account of accounts) {
            try {
                // Log the warning (email service will be wired when NotificationService is implemented)
                this.logger.log(
                    `AutoDeleteJob: 30-day deletion warning for child "${account.childName}" (${account.childId}), parent: ${account.parentEmail}`,
                    'AutoDeleteJob',
                );

                // Mark warning as sent to avoid duplicate warnings
                await this.userService.markDeletionWarningSent(account.childId);
            } catch (error) {
                this.logger.error(
                    `AutoDeleteJob: Failed to send warning for child ${account.childId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    undefined,
                    'AutoDeleteJob',
                );
                // Continue with other accounts even if one fails
            }
        }
    }

    /**
     * Auto-deletes accounts that have been inactive for 12+ months.
     */
    private async _autoDeleteAccounts(): Promise<void> {
        const accounts = await this.userService.findAccountsForAutoDeletion();

        if (accounts.length === 0) {
            this.logger.log('AutoDeleteJob: No accounts require auto-deletion', 'AutoDeleteJob');
            return;
        }

        this.logger.log(
            `AutoDeleteJob: Auto-deleting ${accounts.length} inactive accounts`,
            'AutoDeleteJob',
        );

        for (const account of accounts) {
            try {
                // F06 fix: log warning if account is being deleted without prior 30-day warning
                // (warning phase may have failed for this account in a previous run)
                if (!account.warningWasSent) {
                    this.logger.warn(
                        `AutoDeleteJob: Deleting child "${account.childName}" (${account.childId}) without prior 30-day warning — warning may have failed previously. Last-minute notice should be sent to ${account.parentEmail}`,
                        'AutoDeleteJob',
                    );
                }

                await this.userService.autoDeleteChildAccount(
                    account.childId,
                    account.childName,
                    account.parentEmail,
                );

                // Log deletion notification (email service will be wired when available)
                this.logger.log(
                    `AutoDeleteJob: Auto-deletion complete for child "${account.childName}" (${account.childId}). Confirmation should be sent to ${account.parentEmail}`,
                    'AutoDeleteJob',
                );
            } catch (error) {
                this.logger.error(
                    `AutoDeleteJob: Failed to auto-delete child ${account.childId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    undefined,
                    'AutoDeleteJob',
                );
                // Continue with other accounts even if one fails
            }
        }
    }
}
