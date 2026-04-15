import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CommonModule } from '../../common/common.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AutoDeleteInactiveAccountsJob } from './jobs/auto-delete-inactive-accounts.job';

/**
 * UserModule — Story 2.7: Privacy Policy, Data Management & Account Deletion.
 *
 * Provides:
 * - UserController: GET/DELETE endpoints for child data management
 * - UserService: business logic for data retrieval and account deletion
 * - AutoDeleteInactiveAccountsJob: scheduled cron job for auto-deletion (AC5)
 *
 * Note: ScheduleModule.forRoot() is registered in AppModule (root), not here.
 * Feature modules should not call ScheduleModule.forRoot() to avoid duplicate
 * scheduler instances. See F05 fix in code review.
 */
@Module({
    imports: [
        PrismaModule,
        CommonModule,
    ],
    controllers: [UserController],
    providers: [UserService, AutoDeleteInactiveAccountsJob],
    exports: [UserService],
})
export class UserModule { }
