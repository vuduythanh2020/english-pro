import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ChildrenService } from './children.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ChildrenService', () => {
    let service: ChildrenService;

    const mockLogger = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
    };

    const mockChildProfile = {
        id: 'child-uuid-123',
        parentId: 'parent-uuid-123',
        displayName: 'Bé Nam',
        avatarId: 3,
        age: null,
        level: 'beginner',
        xpTotal: 0,
        currentStreak: 0,
        longestStreak: 0,
        isActive: true,
        createdAt: new Date('2026-04-12T00:00:00Z'),
        updatedAt: new Date('2026-04-12T00:00:00Z'),
    };

    // Transaction client mock (used inside $transaction callback)
    const mockTxClient = {
        childProfile: {
            count: jest.fn(),
            create: jest.fn(),
        },
    };

    // Top-level PrismaService mock — $transaction calls the callback with mockTxClient
    const mockPrisma = {
        childProfile: {
            findMany: jest.fn(),
        },
        $transaction: jest.fn().mockImplementation(
            (callback: (tx: typeof mockTxClient) => Promise<unknown>) =>
                callback(mockTxClient),
        ),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChildrenService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
            ],
        }).compile();

        service = module.get<ChildrenService>(ChildrenService);
        jest.clearAllMocks();

        // Re-apply $transaction behaviour after clearAllMocks
        mockPrisma.$transaction.mockImplementation(
            (callback: (tx: typeof mockTxClient) => Promise<unknown>) =>
                callback(mockTxClient),
        );
    });

    describe('createChildProfile', () => {
        const parentId = 'parent-uuid-123';
        const dto = { displayName: 'Bé Nam', avatarId: 3 };

        it('should create child profile successfully (happy path)', async () => {
            mockTxClient.childProfile.count.mockResolvedValue(0);
            mockTxClient.childProfile.create.mockResolvedValue(mockChildProfile);

            const result = await service.createChildProfile(parentId, dto);

            expect(result).toEqual({
                id: 'child-uuid-123',
                parentId: 'parent-uuid-123',
                displayName: 'Bé Nam',
                avatarId: 3,
                level: 'beginner',
                xpTotal: 0,
                createdAt: mockChildProfile.createdAt,
            });

            expect(mockTxClient.childProfile.count).toHaveBeenCalledWith({
                where: { parentId, isActive: true },
            });
            expect(mockTxClient.childProfile.create).toHaveBeenCalledWith({
                data: {
                    parentId,
                    displayName: 'Bé Nam',
                    avatarId: 3,
                    level: 'beginner',
                    xpTotal: 0,
                },
            });
            expect(mockLogger.log).toHaveBeenCalled();
        });

        it('should run count and create inside a Serializable transaction', async () => {
            mockTxClient.childProfile.count.mockResolvedValue(0);
            mockTxClient.childProfile.create.mockResolvedValue(mockChildProfile);

            await service.createChildProfile(parentId, dto);

            // $transaction must be called once with the isolation level option
            expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
            expect(mockPrisma.$transaction).toHaveBeenCalledWith(
                expect.any(Function),
                { isolationLevel: 'Serializable' },
            );
        });

        it('should default avatarId to 1 when not provided', async () => {
            const dtoWithoutAvatar = { displayName: 'Bé An' };
            const profileWithAvatar1 = { ...mockChildProfile, avatarId: 1 };

            mockTxClient.childProfile.count.mockResolvedValue(0);
            mockTxClient.childProfile.create.mockResolvedValue(profileWithAvatar1);

            await service.createChildProfile(parentId, dtoWithoutAvatar);

            expect(mockTxClient.childProfile.create).toHaveBeenCalledWith({
                data: expect.objectContaining({ avatarId: 1 }),
            });
        });

        it('should throw 422 PROFILE_LIMIT_REACHED when parent has 3 profiles', async () => {
            mockTxClient.childProfile.count.mockResolvedValue(3);

            await expect(service.createChildProfile(parentId, dto)).rejects.toThrow(
                UnprocessableEntityException,
            );

            // create should NOT be called when limit is reached
            expect(mockTxClient.childProfile.create).not.toHaveBeenCalled();
        });

        it('should allow creation when parent has exactly 2 profiles (1 slot remaining)', async () => {
            mockTxClient.childProfile.count.mockResolvedValue(2);
            mockTxClient.childProfile.create.mockResolvedValue(mockChildProfile);

            const result = await service.createChildProfile(parentId, dto);

            expect(result).toBeDefined();
            expect(mockTxClient.childProfile.create).toHaveBeenCalledTimes(1);
        });

        it('should throw 500 on Prisma create error inside transaction', async () => {
            mockTxClient.childProfile.count.mockResolvedValue(0);
            mockTxClient.childProfile.create.mockRejectedValue(
                new Error('Connection refused'),
            );

            await expect(service.createChildProfile(parentId, dto)).rejects.toThrow(
                new HttpException(
                    'Không thể tạo hồ sơ trẻ em. Vui lòng thử lại.',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                ),
            );
            expect(mockLogger.error).toHaveBeenCalled();
        });

        it('should throw 500 on Prisma count error inside transaction', async () => {
            mockTxClient.childProfile.count.mockRejectedValue(
                new Error('DB timeout'),
            );

            await expect(service.createChildProfile(parentId, dto)).rejects.toThrow(
                new HttpException(
                    'Không thể tạo hồ sơ trẻ em. Vui lòng thử lại.',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                ),
            );
            expect(mockLogger.error).toHaveBeenCalled();
        });

        it('should throw 500 when $transaction itself fails', async () => {
            mockPrisma.$transaction.mockRejectedValue(new Error('Transaction aborted'));

            await expect(service.createChildProfile(parentId, dto)).rejects.toThrow(
                new HttpException(
                    'Không thể tạo hồ sơ trẻ em. Vui lòng thử lại.',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                ),
            );
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });

    describe('getChildProfiles', () => {
        const parentId = 'parent-uuid-123';

        it('should return array of child profiles ordered by createdAt asc', async () => {
            const profiles = [
                { ...mockChildProfile, displayName: 'Bé 1' },
                { ...mockChildProfile, id: 'child-uuid-456', displayName: 'Bé 2' },
            ];
            mockPrisma.childProfile.findMany.mockResolvedValue(profiles);

            const result = await service.getChildProfiles(parentId);

            expect(result).toHaveLength(2);
            expect(result[0].displayName).toBe('Bé 1');
            expect(mockPrisma.childProfile.findMany).toHaveBeenCalledWith({
                where: { parentId, isActive: true },
                orderBy: { createdAt: 'asc' },
            });
        });

        it('should return empty array when parent has no child profiles', async () => {
            mockPrisma.childProfile.findMany.mockResolvedValue([]);

            const result = await service.getChildProfiles(parentId);

            expect(result).toEqual([]);
        });

        it('should throw 500 on Prisma error', async () => {
            mockPrisma.childProfile.findMany.mockRejectedValue(
                new Error('Connection refused'),
            );

            await expect(service.getChildProfiles(parentId)).rejects.toThrow(
                new HttpException(
                    'Không thể lấy danh sách hồ sơ trẻ em. Vui lòng thử lại.',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                ),
            );
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });
});
