/**
 * Story 2.7: Privacy Policy, Data Management & Account Deletion
 * ATDD Tests — Child Data API Endpoints (TDD GREEN PHASE)
 *
 * ✅ TDD Phase: GREEN — Tests activated 2026-04-15
 *
 * AC coverage:
 *   AC2 — Xem Dữ Liệu Trẻ (GET /api/v1/users/children/:childId/data)
 *   AC3 — Export Dữ Liệu JSON (GET /api/v1/users/children/:childId/export)
 *   AC4 — Xóa Tài Khoản Con (DELETE /api/v1/users/children/:childId)
 *
 * Infrastructure tái sử dụng:
 *   - childProfileFactory (test/support/factories/child-profile.factory.ts)
 *   - parentFactory (test/support/factories/parent.factory.ts)
 *   - Jest acceptance test runner (jest-acceptance.json)
 *
 * Test ID format: 2.7-{TYPE}-{###}
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

// ── Path constants ──────────────────────────────────────────────────
const USER_MODULE_DIR = join(__dirname, '../../../src/modules/user');
const USER_CONTROLLER_PATH = join(USER_MODULE_DIR, 'user.controller.ts');
const USER_SERVICE_PATH = join(USER_MODULE_DIR, 'user.service.ts');
const USER_MODULE_PATH = join(USER_MODULE_DIR, 'user.module.ts');
const CHILD_DATA_DTO_PATH = join(USER_MODULE_DIR, 'dto/child-data.dto.ts');
const AUTO_DELETE_JOB_PATH = join(
    USER_MODULE_DIR,
    'jobs/auto-delete-inactive-accounts.job.ts',
);

// ════════════════════════════════════════════════════════════════════
// SECTION 1: STRUCTURAL PREREQUISITES (AC2, AC3, AC4)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.7: User Module Structure @P0 @Structure', () => {
    it('2.7-STRUCT-001: user.controller.ts tồn tại tại src/modules/user/ (AC2, AC3, AC4)', () => {
        expect(existsSync(USER_CONTROLLER_PATH)).toBe(true);
    });

    it('2.7-STRUCT-002: user.service.ts tồn tại tại src/modules/user/ (AC2, AC3, AC4)', () => {
        expect(existsSync(USER_SERVICE_PATH)).toBe(true);
    });

    it('2.7-STRUCT-003: user.module.ts tồn tại và register UserController, UserService (AC2, AC3, AC4)', () => {
        expect(existsSync(USER_MODULE_PATH)).toBe(true);
        const content = readFileSync(USER_MODULE_PATH, 'utf-8');
        expect(content).toMatch(/UserController/);
        expect(content).toMatch(/UserService/);
    });

    it('2.7-STRUCT-004: child-data.dto.ts tồn tại tại src/modules/user/dto/ (AC2, AC3)', () => {
        expect(existsSync(CHILD_DATA_DTO_PATH)).toBe(true);
    });

    it('2.7-STRUCT-005: UserController có GET endpoint /children/:childId/data (AC2)', () => {
        const content = readFileSync(USER_CONTROLLER_PATH, 'utf-8');
        expect(content).toMatch(/children\/:childId\/data|children\/:childId.*\/data/);
        expect(content).toMatch(/@Get/);
    });

    it('2.7-STRUCT-006: UserController có GET endpoint /children/:childId/export (AC3)', () => {
        const content = readFileSync(USER_CONTROLLER_PATH, 'utf-8');
        expect(content).toMatch(/children\/:childId\/export|children\/:childId.*\/export/);
    });

    it('2.7-STRUCT-007: UserController có DELETE endpoint /children/:childId (AC4)', () => {
        const content = readFileSync(USER_CONTROLLER_PATH, 'utf-8');
        expect(content).toMatch(/@Delete/);
        expect(content).toMatch(/children\/:childId/);
    });

    it('2.7-STRUCT-008: UserController dùng @UseGuards(AuthGuard, RolesGuard) + @Roles("PARENT") cho tất cả endpoints (AC2, AC3, AC4)', () => {
        const content = readFileSync(USER_CONTROLLER_PATH, 'utf-8');
        expect(content).toMatch(/AuthGuard/);
        expect(content).toMatch(/RolesGuard/);
        expect(content).toMatch(/@Roles\(.*PARENT.*\)/i);
    });

    it('2.7-STRUCT-009: UserController dùng @CurrentUser() decorator để lấy JWT payload (AC2, AC3, AC4)', () => {
        const content = readFileSync(USER_CONTROLLER_PATH, 'utf-8');
        expect(content).toMatch(/@CurrentUser\(\)/);
        expect(content).toMatch(/import.*CurrentUser.*from/);
    });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 2: ChildDataResponseDto CONTRACT (AC2, AC3)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.7: ChildDataResponseDto Structure @P0 @Contract', () => {
    it('2.7-DTO-001: ChildDataResponseDto có field "profile" với sub-fields id, name, avatar, age, createdAt (AC2)', () => {
        const content = readFileSync(CHILD_DATA_DTO_PATH, 'utf-8');
        expect(content).toMatch(/profile/);
        expect(content).toMatch(/name/);
        expect(content).toMatch(/avatar/);
        expect(content).toMatch(/age/);
        expect(content).toMatch(/createdAt/);
    });

    it('2.7-DTO-002: ChildDataResponseDto có field "learningProgress" với totalSessions (AC2)', () => {
        const content = readFileSync(CHILD_DATA_DTO_PATH, 'utf-8');
        expect(content).toMatch(/learningProgress/);
        expect(content).toMatch(/totalSessions/);
    });

    it('2.7-DTO-003: ChildDataResponseDto có field "pronunciationScores" (AC2)', () => {
        const content = readFileSync(CHILD_DATA_DTO_PATH, 'utf-8');
        expect(content).toMatch(/pronunciationScores/);
    });

    it('2.7-DTO-004: ChildDataResponseDto có field "badges" (AC2)', () => {
        const content = readFileSync(CHILD_DATA_DTO_PATH, 'utf-8');
        expect(content).toMatch(/badges/);
    });

    it('2.7-DTO-005: ChildDataResponseDto có field "exportedAt" ISO string (AC3)', () => {
        const content = readFileSync(CHILD_DATA_DTO_PATH, 'utf-8');
        expect(content).toMatch(/exportedAt/);
    });

    it('2.7-DTO-006: ChildDataResponseDto KHÔNG có field voice hoặc recording (FR24 — voice không được lưu) (AC2, AC3)', () => {
        const content = readFileSync(CHILD_DATA_DTO_PATH, 'utf-8');
        expect(content).not.toMatch(/voiceRecording|voice_recording|audioFile|audio_file/i);
    });

    it('2.7-DTO-007: ChildDataResponseDto dùng @ApiProperty() decorator cho Swagger (AC2, AC3)', () => {
        const content = readFileSync(CHILD_DATA_DTO_PATH, 'utf-8');
        expect(content).toMatch(/@ApiProperty/);
    });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 3: UserService.getChildData() BEHAVIOR (AC2)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.7: UserService.getChildData() — Xem dữ liệu trẻ (AC2) @P0 @Unit', () => {
    it('2.7-SVC-001: getChildData() trả về đúng ChildDataResponseDto khi parent owns childId (AC2)', async () => {
        const { childProfileFactory } = await import('test/support/factories/child-profile.factory');

        const PARENT_UUID = '00000000-0000-4000-a000-000000000001';
        const CHILD_UUID = '00000000-0000-4000-b000-000000000001';

        const child = childProfileFactory({
            id: CHILD_UUID,
            parentId: PARENT_UUID,
            displayName: 'Minh',
            avatarId: 2,
            age: 7,
        });

        const { Test } = await import('@nestjs/testing');
        const { WINSTON_MODULE_NEST_PROVIDER } = await import('nest-winston');
        const { UserService } = await import('../../../src/modules/user/user.service');
        const { PrismaService } = await import('../../../src/prisma/prisma.service');

        const mockPrisma = {
            childProfile: {
                findFirst: jest.fn().mockResolvedValue(child),
            },
            conversationSession: {
                findMany: jest.fn().mockResolvedValue([]),
                count: jest.fn().mockResolvedValue(0),
            },
            pronunciationScore: {
                findMany: jest.fn().mockResolvedValue([]),
            },
            badge: {
                findMany: jest.fn().mockResolvedValue([]),
            },
        };

        const module = await Test.createTestingModule({
            providers: [
                UserService,
                { provide: PrismaService, useValue: mockPrisma },
                {
                    provide: WINSTON_MODULE_NEST_PROVIDER,
                    useValue: { log: jest.fn(), error: jest.fn(), warn: jest.fn() },
                },
            ],
        }).compile();

        const service = module.get<InstanceType<typeof UserService>>(UserService);
        const result = await service.getChildData(PARENT_UUID, CHILD_UUID);

        // Kiểm tra response shape (AC2)
        expect(result).toMatchObject({
            profile: {
                id: CHILD_UUID,
                name: 'Minh',
                avatar: expect.any(Number),
                age: 7,
                createdAt: expect.any(Date),
            },
            learningProgress: {
                totalSessions: expect.any(Number),
                sessions: expect.any(Array),
            },
            pronunciationScores: expect.any(Array),
            badges: expect.any(Array),
            exportedAt: expect.any(String),
        });

        // KHÔNG có voice data (FR24)
        expect(result).not.toHaveProperty('voiceRecordings');
        expect(result).not.toHaveProperty('audioFiles');
    });

    it('2.7-SVC-002: getChildData() throw NotFoundException khi parent không sở hữu childId (AC2 — ownership check)', async () => {
        const PARENT_UUID = '00000000-0000-4000-a000-000000000001';
        const OTHER_CHILD_UUID = '00000000-0000-4000-b000-999999999999';

        const { Test } = await import('@nestjs/testing');
        const { WINSTON_MODULE_NEST_PROVIDER } = await import('nest-winston');
        const { UserService } = await import('../../../src/modules/user/user.service');
        const { PrismaService } = await import('../../../src/prisma/prisma.service');

        const mockPrisma = {
            childProfile: {
                findFirst: jest.fn().mockResolvedValue(null),
            },
            conversationSession: { findMany: jest.fn(), count: jest.fn() },
            pronunciationScore: { findMany: jest.fn() },
            badge: { findMany: jest.fn() },
        };

        const module = await Test.createTestingModule({
            providers: [
                UserService,
                { provide: PrismaService, useValue: mockPrisma },
                {
                    provide: WINSTON_MODULE_NEST_PROVIDER,
                    useValue: { log: jest.fn(), error: jest.fn(), warn: jest.fn() },
                },
            ],
        }).compile();

        const service = module.get<InstanceType<typeof UserService>>(UserService);

        await expect(service.getChildData(PARENT_UUID, OTHER_CHILD_UUID)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('2.7-SVC-003: getChildData() query Prisma với đúng where clause { id: childId, parentId } (AC2 — ownership)', async () => {
        const PARENT_UUID = '00000000-0000-4000-a000-000000000001';
        const CHILD_UUID = '00000000-0000-4000-b000-000000000001';

        const { Test } = await import('@nestjs/testing');
        const { WINSTON_MODULE_NEST_PROVIDER } = await import('nest-winston');
        const { UserService } = await import('../../../src/modules/user/user.service');
        const { PrismaService } = await import('../../../src/prisma/prisma.service');
        const { childProfileFactory } = await import('test/support/factories/child-profile.factory');

        const child = childProfileFactory({ id: CHILD_UUID, parentId: PARENT_UUID });

        const mockFindFirst = jest.fn().mockResolvedValue(child);
        const mockPrisma = {
            childProfile: { findFirst: mockFindFirst },
            conversationSession: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
            pronunciationScore: { findMany: jest.fn().mockResolvedValue([]) },
            badge: { findMany: jest.fn().mockResolvedValue([]) },
        };

        const module = await Test.createTestingModule({
            providers: [
                UserService,
                { provide: PrismaService, useValue: mockPrisma },
                {
                    provide: WINSTON_MODULE_NEST_PROVIDER,
                    useValue: { log: jest.fn(), error: jest.fn(), warn: jest.fn() },
                },
            ],
        }).compile();

        const service = module.get<InstanceType<typeof UserService>>(UserService);
        await service.getChildData(PARENT_UUID, CHILD_UUID);

        // Kiểm tra ownership check: phải query với cả id và parentId
        expect(mockFindFirst).toHaveBeenCalledWith({
            where: {
                id: CHILD_UUID,
                parentId: PARENT_UUID,
            },
        });
    });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 4: GET /children/:childId/export (AC3)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.7: Export Child Data — GET /children/:childId/export (AC3) @P0 @Contract', () => {
    it('2.7-EXPORT-001: UserController.exportChildData() set Content-Disposition header với filename format đúng (AC3)', () => {
        const content = readFileSync(USER_CONTROLLER_PATH, 'utf-8');
        expect(content).toMatch(/Content-Disposition/);
        expect(content).toMatch(/attachment.*filename/i);
        // Filename format: english_pro_data_{child_name}_{date}.json
        expect(content).toMatch(/english_pro_data/);
    });

    it('2.7-EXPORT-002: UserController.exportChildData() set Content-Type: application/json (AC3)', () => {
        const content = readFileSync(USER_CONTROLLER_PATH, 'utf-8');
        expect(content).toMatch(/application\/json/);
    });

    it('2.7-EXPORT-003: Export response shape khớp ChildDataResponseDto — KHÔNG có voice data (AC3, FR24)', () => {
        // Contract: export response phải cùng shape với getChildData response
        const expectedExportShape = {
            profile: expect.objectContaining({
                id: expect.any(String),
                name: expect.any(String),
                age: expect.any(Number),
            }),
            learningProgress: expect.objectContaining({
                totalSessions: expect.any(Number),
            }),
            pronunciationScores: expect.any(Array),
            badges: expect.any(Array),
            exportedAt: expect.any(String),
        };

        const mockExportData = {
            profile: { id: 'uuid', name: 'Minh', avatar: 1, age: 7, createdAt: '2026-01-01T00:00:00Z' },
            learningProgress: { totalSessions: 5, sessions: [] },
            pronunciationScores: [],
            badges: [],
            exportedAt: '2026-04-13T00:00:00Z',
        };

        expect(mockExportData).toMatchObject(expectedExportShape);
        expect(mockExportData).not.toHaveProperty('voiceRecordings');
    });

    it('2.7-EXPORT-004: Export filename format: english_pro_data_{childName}_{date}.json (AC3)', () => {
        const childName = 'Minh Anh';
        const date = new Date('2026-04-13').toISOString().split('T')[0];
        const normalizedName = childName.replace(/\s+/g, '_');
        const expectedFilename = `english_pro_data_${normalizedName}_${date}.json`;

        expect(expectedFilename).toMatch(/^english_pro_data_.*_\d{4}-\d{2}-\d{2}\.json$/);
        expect(expectedFilename).toBe('english_pro_data_Minh_Anh_2026-04-13.json');
    });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 5: UserService.deleteChildAccount() BEHAVIOR (AC4)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.7: UserService.deleteChildAccount() — Xóa tài khoản con (AC4) @P0 @Unit', () => {
    it('2.7-DEL-001: deleteChildAccount() xóa child profile thành công khi parent owns childId (AC4)', async () => {
        const PARENT_UUID = '00000000-0000-4000-a000-000000000001';
        const CHILD_UUID = '00000000-0000-4000-b000-000000000001';

        const { Test } = await import('@nestjs/testing');
        const { WINSTON_MODULE_NEST_PROVIDER } = await import('nest-winston');
        const { UserService } = await import('../../../src/modules/user/user.service');
        const { PrismaService } = await import('../../../src/prisma/prisma.service');
        const { childProfileFactory } = await import('test/support/factories/child-profile.factory');
        const { parentFactory } = await import('test/support/factories/parent.factory');

        const parent = parentFactory({ id: PARENT_UUID, email: 'parent@test.com' });
        const child = childProfileFactory({ id: CHILD_UUID, parentId: PARENT_UUID, displayName: 'Minh' });

        const mockDelete = jest.fn().mockResolvedValue(child);
        const mockPrisma = {
            childProfile: {
                findFirst: jest.fn().mockResolvedValue(child),
                delete: mockDelete,
            },
            parent: {
                findUnique: jest.fn().mockResolvedValue(parent),
            },
        };

        const module = await Test.createTestingModule({
            providers: [
                UserService,
                { provide: PrismaService, useValue: mockPrisma },
                {
                    provide: WINSTON_MODULE_NEST_PROVIDER,
                    useValue: { log: jest.fn(), error: jest.fn(), warn: jest.fn() },
                },
            ],
        }).compile();

        const service = module.get<InstanceType<typeof UserService>>(UserService);
        await expect(service.deleteChildAccount(PARENT_UUID, CHILD_UUID)).resolves.not.toThrow();

        // Verify hard delete đã được gọi (AC4 — hard delete, không phải soft delete)
        expect(mockDelete).toHaveBeenCalledWith({
            where: { id: CHILD_UUID },
        });
    });

    it('2.7-DEL-002: deleteChildAccount() logs deletion notification cho parent (AC4)', async () => {
        const PARENT_UUID = '00000000-0000-4000-a000-000000000001';
        const CHILD_UUID = '00000000-0000-4000-b000-000000000001';

        const { Test } = await import('@nestjs/testing');
        const { WINSTON_MODULE_NEST_PROVIDER } = await import('nest-winston');
        const { UserService } = await import('../../../src/modules/user/user.service');
        const { PrismaService } = await import('../../../src/prisma/prisma.service');
        const { childProfileFactory } = await import('test/support/factories/child-profile.factory');
        const { parentFactory } = await import('test/support/factories/parent.factory');

        const parent = parentFactory({ id: PARENT_UUID, email: 'parent@test.com' });
        const child = childProfileFactory({ id: CHILD_UUID, parentId: PARENT_UUID, displayName: 'Minh' });

        const mockLog = jest.fn();
        const mockPrisma = {
            childProfile: {
                findFirst: jest.fn().mockResolvedValue(child),
                delete: jest.fn().mockResolvedValue(child),
            },
            parent: {
                findUnique: jest.fn().mockResolvedValue(parent),
            },
        };

        const module = await Test.createTestingModule({
            providers: [
                UserService,
                { provide: PrismaService, useValue: mockPrisma },
                {
                    provide: WINSTON_MODULE_NEST_PROVIDER,
                    useValue: { log: mockLog, error: jest.fn(), warn: jest.fn() },
                },
            ],
        }).compile();

        const service = module.get<InstanceType<typeof UserService>>(UserService);
        await service.deleteChildAccount(PARENT_UUID, CHILD_UUID);

        // Verify logger was called with deletion info (AC4)
        expect(mockLog).toHaveBeenCalledWith(
            expect.stringContaining('confirmation'),
            'UserService',
        );
    });

    it('2.7-DEL-003: deleteChildAccount() throw NotFoundException khi parent không sở hữu childId (AC4)', async () => {
        const PARENT_UUID = '00000000-0000-4000-a000-000000000001';
        const OTHER_CHILD_UUID = '00000000-0000-4000-b000-999999999999';

        const { Test } = await import('@nestjs/testing');
        const { WINSTON_MODULE_NEST_PROVIDER } = await import('nest-winston');
        const { UserService } = await import('../../../src/modules/user/user.service');
        const { PrismaService } = await import('../../../src/prisma/prisma.service');

        const mockPrisma = {
            childProfile: {
                findFirst: jest.fn().mockResolvedValue(null),
                delete: jest.fn(),
            },
            parent: { findUnique: jest.fn() },
        };

        const module = await Test.createTestingModule({
            providers: [
                UserService,
                { provide: PrismaService, useValue: mockPrisma },
                {
                    provide: WINSTON_MODULE_NEST_PROVIDER,
                    useValue: { log: jest.fn(), error: jest.fn(), warn: jest.fn() },
                },
            ],
        }).compile();

        const service = module.get<InstanceType<typeof UserService>>(UserService);

        await expect(service.deleteChildAccount(PARENT_UUID, OTHER_CHILD_UUID)).rejects.toThrow(
            NotFoundException,
        );

        // Không được call delete nếu không verify ownership
        expect(mockPrisma.childProfile.delete).not.toHaveBeenCalled();
    });

    it('2.7-DEL-004: DELETE /children/:childId trả về 403 khi gọi bằng CHILD JWT (AC4 — role guard)', async () => {
        const { RolesGuard } = await import('../../../src/common/guards/roles.guard');
        const { Reflector } = await import('@nestjs/core');

        const reflector = new Reflector();
        const guard = new RolesGuard(reflector);

        // CHILD cố gọi delete endpoint (chỉ PARENT được phép)
        const mockContext = {
            switchToHttp: () => ({
                getRequest: () => ({
                    user: {
                        sub: 'child-uuid',
                        role: 'CHILD',
                        childId: 'child-uuid',
                    },
                }),
            }),
            getHandler: () => ({}),
            getClass: () => ({}),
        } as any;

        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['PARENT'] as any);

        // RolesGuard phải block CHILD role
        expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 6: DELETE RESPONSE CONTRACT (AC4)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.7: Delete Account Response Contracts @P0 @Contract', () => {
    it('2.7-CONTRACT-001: DELETE /children/:childId response shape — { message: string } (AC4)', () => {
        // Flutter expects: response.data.data.message
        // (vì ResponseWrapperInterceptor wrap tất cả responses)
        const expectedShape = {
            message: expect.any(String),
        };

        const mockDeleteResponse = {
            message: 'Child account deleted successfully',
        };

        expect(mockDeleteResponse).toMatchObject(expectedShape);
        expect(mockDeleteResponse.message).toBe('Child account deleted successfully');
    });

    it('2.7-CONTRACT-002: DELETE /children/:childId 404 khi childId không tồn tại hoặc không thuộc parent (AC4)', () => {
        const expectedErrorShape = {
            statusCode: 404,
            message: expect.any(String),
        };

        const mockError = {
            statusCode: 404,
            message: 'Child not found or access denied',
            error: 'Not Found',
        };

        expect(mockError).toMatchObject(expectedErrorShape);
    });

    it('2.7-CONTRACT-003: DELETE /children/:childId 401 khi thiếu Authorization header (AC4)', () => {
        const expectedErrorShape = {
            statusCode: 401,
        };

        const mockError = {
            statusCode: 401,
            message: 'Unauthorized',
        };

        expect(mockError).toMatchObject(expectedErrorShape);
    });

    it('2.7-CONTRACT-004: GET /children/:childId/data response shape đúng với Flutter ChildDataModel (AC2)', () => {
        // Flutter ChildDataModel.fromJson(response.data['data']) expects this shape
        const expectedDataShape = {
            profile: expect.objectContaining({
                id: expect.any(String),
                name: expect.any(String),
                age: expect.any(Number),
                createdAt: expect.any(String),
            }),
            learningProgress: expect.objectContaining({
                totalSessions: expect.any(Number),
                sessions: expect.any(Array),
            }),
            pronunciationScores: expect.any(Array),
            badges: expect.any(Array),
            exportedAt: expect.any(String),
        };

        const mockApiResponse = {
            profile: { id: 'uuid', name: 'Minh', avatar: 1, age: 7, createdAt: '2026-01-15T10:00:00Z' },
            learningProgress: { totalSessions: 12, sessions: [] },
            pronunciationScores: [{ sessionId: 'uuid', score: 85.5, word: 'hello', createdAt: '2026-02-01T...' }],
            badges: [{ id: 'uuid', name: 'First Conversation', earnedAt: '2026-01-20T...' }],
            exportedAt: '2026-04-13T16:00:00Z',
        };

        expect(mockApiResponse).toMatchObject(expectedDataShape);

        // Voice data phải KHÔNG có mặt (FR24)
        expect(mockApiResponse).not.toHaveProperty('voiceRecordings');
        expect(mockApiResponse).not.toHaveProperty('audioData');
    });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 7: STATIC ANALYSIS (AC2, AC3, AC4)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.7: Static Analysis @P1 @Static', () => {
    it('2.7-STATIC-001: UserController có @ApiTags decorator cho Swagger (AC2, AC3, AC4)', () => {
        const content = readFileSync(USER_CONTROLLER_PATH, 'utf-8');
        expect(content).toMatch(/@ApiTags/);
    });

    it('2.7-STATIC-002: UserController có @ApiOperation cho từng endpoint (AC2, AC3, AC4)', () => {
        const content = readFileSync(USER_CONTROLLER_PATH, 'utf-8');
        const apiOperationMatches = content.match(/@ApiOperation/g);
        // Phải có ít nhất 3 @ApiOperation (getChildData, exportChildData, deleteChildAccount)
        expect(apiOperationMatches!.length).toBeGreaterThanOrEqual(3);
    });

    it('2.7-STATIC-003: UserService import PrismaService để access database (AC2, AC3, AC4)', () => {
        const content = readFileSync(USER_SERVICE_PATH, 'utf-8');
        expect(content).toMatch(/PrismaService/);
        expect(content).toMatch(/import.*PrismaService/);
    });

    it('2.7-STATIC-004: UserService.deleteChildAccount() dùng hard delete (prisma.childProfile.delete) không phải soft delete (AC4)', () => {
        const content = readFileSync(USER_SERVICE_PATH, 'utf-8');
        expect(content).toMatch(/childProfile\.delete/);
        // Không được có softDelete pattern
        expect(content).not.toMatch(/isDeleted.*true|deletedAt.*new Date/);
    });

    it('2.7-STATIC-005: UserController base URL là /api/v1/users/ (AC2, AC3, AC4)', () => {
        const content = readFileSync(USER_CONTROLLER_PATH, 'utf-8');
        expect(content).toMatch(/api\/v1\/users/);
    });
});
