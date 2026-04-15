/**
 * Story 2.7: Privacy Policy, Data Management & Account Deletion
 * ATDD Tests — Auto-Delete Inactive Accounts Job (TDD GREEN PHASE)
 *
 * ✅ TDD Phase: GREEN — Tests activated 2026-04-15
 *
 * AC coverage:
 *   AC5 — Auto-Delete Sau 12 Tháng Không Hoạt Động (cron job + 30-day warning)
 *
 * Infrastructure tái sử dụng:
 *   - childProfileFactory (test/support/factories/child-profile.factory.ts)
 *   - parentFactory (test/support/factories/parent.factory.ts)
 *
 * Implementation note:
 *   AutoDeleteInactiveAccountsJob delegates all data operations to UserService.
 *   Tests mock UserService methods, NOT Prisma directly.
 *
 * Test ID format: 2.7-{TYPE}-{###}
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// ── Path constants ──────────────────────────────────────────────────
const USER_MODULE_DIR = join(__dirname, '../../../src/modules/user');
const AUTO_DELETE_JOB_PATH = join(
    USER_MODULE_DIR,
    'jobs/auto-delete-inactive-accounts.job.ts',
);
const USER_MODULE_PATH = join(USER_MODULE_DIR, 'user.module.ts');
const APP_MODULE_PATH = join(__dirname, '../../../src/app.module.ts');
const PRISMA_SCHEMA_PATH = join(__dirname, '../../../prisma/schema.prisma');

// ════════════════════════════════════════════════════════════════════
// SECTION 1: STRUCTURAL PREREQUISITES (AC5)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.7: Auto-Delete Job Structure @P1 @Structure', () => {
    it('2.7-JOB-STRUCT-001: auto-delete-inactive-accounts.job.ts tồn tại tại src/modules/user/jobs/ (AC5)', () => {
        expect(existsSync(AUTO_DELETE_JOB_PATH)).toBe(true);
    });

    it('2.7-JOB-STRUCT-002: AutoDeleteInactiveAccountsJob implement @Injectable() và @Cron() decorator (AC5)', () => {
        const content = readFileSync(AUTO_DELETE_JOB_PATH, 'utf-8');
        expect(content).toMatch(/@Injectable\(\)/);
        expect(content).toMatch(/@Cron\(/);
    });

    it('2.7-JOB-STRUCT-003: Cron schedule dùng CronExpression.EVERY_DAY_AT_2AM (daily 02:00 UTC) (AC5)', () => {
        const content = readFileSync(AUTO_DELETE_JOB_PATH, 'utf-8');
        // Implementation uses CronExpression.EVERY_DAY_AT_2AM constant
        expect(content).toMatch(/CronExpression\.EVERY_DAY_AT_2AM|0 2 \* \* \*/);
    });

    it('2.7-JOB-STRUCT-004: user.module.ts đăng ký AutoDeleteInactiveAccountsJob như provider (AC5)', () => {
        const content = readFileSync(USER_MODULE_PATH, 'utf-8');
        expect(content).toMatch(/AutoDeleteInactiveAccountsJob/);
    });

    it('2.7-JOB-STRUCT-005: user.module.ts import ScheduleModule.forRoot() để support @Cron() (AC5)', () => {
        // ScheduleModule is imported in UserModule (not AppModule directly)
        const content = readFileSync(USER_MODULE_PATH, 'utf-8');
        expect(content).toMatch(/ScheduleModule/);
        expect(content).toMatch(/ScheduleModule\.forRoot\(\)/);
    });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 2: PRISMA SCHEMA — Inactivity Tracking Fields (AC5)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.7: Prisma Schema — Inactivity Tracking Fields (AC5) @P1 @Static', () => {
    it('2.7-SCHEMA-001: ChildProfile model có field lastActivityAt DateTime (AC5)', () => {
        const content = readFileSync(PRISMA_SCHEMA_PATH, 'utf-8');
        expect(content).toMatch(/lastActivityAt.*DateTime/);
    });

    it('2.7-SCHEMA-002: ChildProfile model có field deletionWarningSent Boolean @default(false) (AC5)', () => {
        const content = readFileSync(PRISMA_SCHEMA_PATH, 'utf-8');
        expect(content).toMatch(/deletionWarningSent.*Boolean/);
        expect(content).toMatch(/deletionWarningSent.*@default\(false\)/);
    });

    it('2.7-SCHEMA-003: ChildProfile related models có onDelete: Cascade (AC4, AC5 — hard delete cascade)', () => {
        const content = readFileSync(PRISMA_SCHEMA_PATH, 'utf-8');
        expect(content).toMatch(/onDelete.*Cascade/);
    });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 3: AutoDeleteInactiveAccountsJob.run() BEHAVIOR (AC5)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.7: AutoDeleteInactiveAccountsJob.run() — AC5 @P1 @Unit', () => {
    it('2.7-JOB-001: run() gửi warning notification 30 ngày trước khi xóa (AC5)', async () => {
        const { Test } = await import('@nestjs/testing');
        const { WINSTON_MODULE_NEST_PROVIDER } = await import('nest-winston');
        const { AutoDeleteInactiveAccountsJob } = await import(
            '../../../src/modules/user/jobs/auto-delete-inactive-accounts.job'
        );
        const { UserService } = await import('../../../src/modules/user/user.service');

        const warningAccounts = [
            { childId: 'child-1', childName: 'Minh', parentEmail: 'parent@test.com' },
        ];

        const mockUserService = {
            findAccountsNeedingDeletionWarning: jest.fn().mockResolvedValue(warningAccounts),
            markDeletionWarningSent: jest.fn().mockResolvedValue(undefined),
            findAccountsForAutoDeletion: jest.fn().mockResolvedValue([]),
            autoDeleteChildAccount: jest.fn(),
        };

        const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

        const module = await Test.createTestingModule({
            providers: [
                AutoDeleteInactiveAccountsJob,
                { provide: UserService, useValue: mockUserService },
                { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
            ],
        }).compile();

        const job = module.get<InstanceType<typeof AutoDeleteInactiveAccountsJob>>(AutoDeleteInactiveAccountsJob);
        await job.run();

        // Warning phase should have queried for accounts needing warning
        expect(mockUserService.findAccountsNeedingDeletionWarning).toHaveBeenCalled();

        // Warning sent flag should be marked
        expect(mockUserService.markDeletionWarningSent).toHaveBeenCalledWith('child-1');

        // Logger should log warning info
        expect(mockLogger.log).toHaveBeenCalledWith(
            expect.stringContaining('Minh'),
            'AutoDeleteJob',
        );
    });

    it('2.7-JOB-002: run() xóa account sau 12 tháng inactive (AC5)', async () => {
        const { Test } = await import('@nestjs/testing');
        const { WINSTON_MODULE_NEST_PROVIDER } = await import('nest-winston');
        const { AutoDeleteInactiveAccountsJob } = await import(
            '../../../src/modules/user/jobs/auto-delete-inactive-accounts.job'
        );
        const { UserService } = await import('../../../src/modules/user/user.service');

        const deleteAccounts = [
            { childId: 'child-2', childName: 'An', parentEmail: 'parent2@test.com' },
        ];

        const mockUserService = {
            findAccountsNeedingDeletionWarning: jest.fn().mockResolvedValue([]),
            markDeletionWarningSent: jest.fn(),
            findAccountsForAutoDeletion: jest.fn().mockResolvedValue(deleteAccounts),
            autoDeleteChildAccount: jest.fn().mockResolvedValue(undefined),
        };

        const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

        const module = await Test.createTestingModule({
            providers: [
                AutoDeleteInactiveAccountsJob,
                { provide: UserService, useValue: mockUserService },
                { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
            ],
        }).compile();

        const job = module.get<InstanceType<typeof AutoDeleteInactiveAccountsJob>>(AutoDeleteInactiveAccountsJob);
        await job.run();

        // Auto-delete should have been called for the inactive account
        expect(mockUserService.autoDeleteChildAccount).toHaveBeenCalledWith(
            'child-2', 'An', 'parent2@test.com',
        );

        // Logger should log auto-deletion completion
        expect(mockLogger.log).toHaveBeenCalledWith(
            expect.stringContaining('Auto-deletion complete'),
            'AutoDeleteJob',
        );
    });

    it('2.7-JOB-003: run() KHÔNG gửi warning khi không có accounts cần warning (AC5)', async () => {
        const { Test } = await import('@nestjs/testing');
        const { WINSTON_MODULE_NEST_PROVIDER } = await import('nest-winston');
        const { AutoDeleteInactiveAccountsJob } = await import(
            '../../../src/modules/user/jobs/auto-delete-inactive-accounts.job'
        );
        const { UserService } = await import('../../../src/modules/user/user.service');

        const mockUserService = {
            findAccountsNeedingDeletionWarning: jest.fn().mockResolvedValue([]),
            markDeletionWarningSent: jest.fn(),
            findAccountsForAutoDeletion: jest.fn().mockResolvedValue([]),
            autoDeleteChildAccount: jest.fn(),
        };

        const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

        const module = await Test.createTestingModule({
            providers: [
                AutoDeleteInactiveAccountsJob,
                { provide: UserService, useValue: mockUserService },
                { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
            ],
        }).compile();

        const job = module.get<InstanceType<typeof AutoDeleteInactiveAccountsJob>>(AutoDeleteInactiveAccountsJob);
        await job.run();

        // No warning should be marked
        expect(mockUserService.markDeletionWarningSent).not.toHaveBeenCalled();

        // No deletion should occur
        expect(mockUserService.autoDeleteChildAccount).not.toHaveBeenCalled();
    });

    it('2.7-JOB-004: run() handles errors gracefully — continues with deletion phase even if warning phase fails (AC5)', async () => {
        const { Test } = await import('@nestjs/testing');
        const { WINSTON_MODULE_NEST_PROVIDER } = await import('nest-winston');
        const { AutoDeleteInactiveAccountsJob } = await import(
            '../../../src/modules/user/jobs/auto-delete-inactive-accounts.job'
        );
        const { UserService } = await import('../../../src/modules/user/user.service');

        const mockUserService = {
            // Warning phase throws
            findAccountsNeedingDeletionWarning: jest.fn().mockRejectedValue(new Error('DB connection lost')),
            markDeletionWarningSent: jest.fn(),
            // Deletion phase should still run
            findAccountsForAutoDeletion: jest.fn().mockResolvedValue([]),
            autoDeleteChildAccount: jest.fn(),
        };

        const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

        const module = await Test.createTestingModule({
            providers: [
                AutoDeleteInactiveAccountsJob,
                { provide: UserService, useValue: mockUserService },
                { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
            ],
        }).compile();

        const job = module.get<InstanceType<typeof AutoDeleteInactiveAccountsJob>>(AutoDeleteInactiveAccountsJob);

        // Should not throw even though warning phase fails
        await expect(job.run()).resolves.not.toThrow();

        // Error should be logged
        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringContaining('Warning phase failed'),
            undefined,
            'AutoDeleteJob',
        );

        // Deletion phase should still have been attempted
        expect(mockUserService.findAccountsForAutoDeletion).toHaveBeenCalled();
    });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 4: JOB STATIC ANALYSIS (AC5)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.7: Auto-Delete Job Static Analysis @P2 @Static', () => {
    it('2.7-JOB-STATIC-001: AutoDeleteInactiveAccountsJob class là @Injectable() (AC5)', () => {
        const content = readFileSync(AUTO_DELETE_JOB_PATH, 'utf-8');
        expect(content).toMatch(/@Injectable\(\)/);
        expect(content).toMatch(/export class AutoDeleteInactiveAccountsJob/);
    });

    it('2.7-JOB-STATIC-002: AutoDeleteInactiveAccountsJob inject UserService và Logger (AC5)', () => {
        const content = readFileSync(AUTO_DELETE_JOB_PATH, 'utf-8');
        expect(content).toMatch(/UserService/);
        expect(content).toMatch(/WINSTON_MODULE_NEST_PROVIDER/);
    });

    it('2.7-JOB-STATIC-003: Job import Cron từ @nestjs/schedule (AC5)', () => {
        const content = readFileSync(AUTO_DELETE_JOB_PATH, 'utf-8');
        expect(content).toMatch(/import.*Cron.*@nestjs\/schedule/);
    });

    it('2.7-JOB-STATIC-004: @nestjs/schedule trong package.json dependencies (AC5)', () => {
        const pkgPath = join(__dirname, '../../../package.json');
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        // @nestjs/schedule phải có trong dependencies (không devDependencies)
        expect(pkg.dependencies).toHaveProperty('@nestjs/schedule');
    });
});
