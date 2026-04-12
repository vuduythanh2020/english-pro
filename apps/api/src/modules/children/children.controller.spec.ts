import { Test, TestingModule } from '@nestjs/testing';
import { CanActivate, ExecutionContext, HttpStatus } from '@nestjs/common';
import { ChildrenController } from './children.controller';
import { ChildrenService } from './children.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateChildDto } from './dto/create-child.dto';
import type { RequestUser } from '../../common/types/jwt-payload.type';

// Override guards to bypass authentication in unit tests
class MockAuthGuard implements CanActivate {
    canActivate(_context: ExecutionContext) {
        return true;
    }
}
class MockRolesGuard implements CanActivate {
    canActivate(_context: ExecutionContext) {
        return true;
    }
}

describe('ChildrenController', () => {
    let controller: ChildrenController;

    const mockChildProfile = {
        id: 'child-uuid-123',
        parentId: 'parent-uuid-456',
        displayName: 'Bé Nam',
        avatarId: 3,
        level: 'beginner',
        xpTotal: 0,
        createdAt: new Date('2026-04-12T00:00:00Z'),
    };

    const mockChildrenService = {
        createChildProfile: jest.fn(),
        getChildProfiles: jest.fn(),
    };

    const mockUser: RequestUser = {
        sub: 'supabase-uuid-123',
        userId: 'parent-uuid-456',
        role: 'PARENT',
        email: 'parent@example.com',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ChildrenController],
            providers: [
                { provide: ChildrenService, useValue: mockChildrenService },
            ],
        })
            .overrideGuard(AuthGuard).useClass(MockAuthGuard)
            .overrideGuard(RolesGuard).useClass(MockRolesGuard)
            .compile();

        controller = module.get<ChildrenController>(ChildrenController);
        jest.clearAllMocks();
    });

    describe('createChildProfile', () => {
        it('should call service with parentId from userId and return the created profile', async () => {
            const dto: CreateChildDto = { displayName: 'Bé Nam', avatarId: 3 };
            mockChildrenService.createChildProfile.mockResolvedValue(mockChildProfile);

            const result = await controller.createChildProfile(dto, mockUser);

            expect(mockChildrenService.createChildProfile).toHaveBeenCalledWith(
                'parent-uuid-456', // userId takes priority over sub
                dto,
            );
            expect(result).toEqual(mockChildProfile);
        });

        it('should fall back to sub when userId is undefined', async () => {
            const userWithoutId: RequestUser = {
                sub: 'supabase-fallback-uuid',
                role: 'PARENT',
            };
            const dto: CreateChildDto = { displayName: 'Bé An' };
            mockChildrenService.createChildProfile.mockResolvedValue({
                ...mockChildProfile,
                parentId: 'supabase-fallback-uuid',
            });

            await controller.createChildProfile(dto, userWithoutId);

            expect(mockChildrenService.createChildProfile).toHaveBeenCalledWith(
                'supabase-fallback-uuid',
                dto,
            );
        });

        it('should propagate service errors', async () => {
            const dto: CreateChildDto = { displayName: 'Bé Lỗi', avatarId: 1 };
            const serviceError = new Error('PROFILE_LIMIT_REACHED');
            mockChildrenService.createChildProfile.mockRejectedValue(serviceError);

            await expect(controller.createChildProfile(dto, mockUser)).rejects.toThrow(
                serviceError,
            );
        });

        it('should pass avatarId=undefined to service when not provided (service defaults to 1)', async () => {
            const dto: CreateChildDto = { displayName: 'Bé Default' };
            mockChildrenService.createChildProfile.mockResolvedValue({
                ...mockChildProfile,
                avatarId: 1,
            });

            await controller.createChildProfile(dto, mockUser);

            expect(mockChildrenService.createChildProfile).toHaveBeenCalledWith(
                'parent-uuid-456',
                dto,
            );
        });
    });

    describe('getChildProfiles', () => {
        it('should call service with parentId and return array of profiles', async () => {
            const profiles = [
                mockChildProfile,
                { ...mockChildProfile, id: 'child-uuid-456', displayName: 'Bé Lan' },
            ];
            mockChildrenService.getChildProfiles.mockResolvedValue(profiles);

            const result = await controller.getChildProfiles(mockUser);

            expect(mockChildrenService.getChildProfiles).toHaveBeenCalledWith(
                'parent-uuid-456',
            );
            expect(result).toHaveLength(2);
            expect(result[0].displayName).toBe('Bé Nam');
        });

        it('should return empty array when parent has no profiles', async () => {
            mockChildrenService.getChildProfiles.mockResolvedValue([]);

            const result = await controller.getChildProfiles(mockUser);

            expect(result).toEqual([]);
        });

        it('should fall back to sub when userId is undefined', async () => {
            const userWithoutId: RequestUser = {
                sub: 'sub-uuid-only',
                role: 'PARENT',
            };
            mockChildrenService.getChildProfiles.mockResolvedValue([]);

            await controller.getChildProfiles(userWithoutId);

            expect(mockChildrenService.getChildProfiles).toHaveBeenCalledWith(
                'sub-uuid-only',
            );
        });

        it('should propagate service errors on GET', async () => {
            mockChildrenService.getChildProfiles.mockRejectedValue(
                new Error('DB unavailable'),
            );

            await expect(controller.getChildProfiles(mockUser)).rejects.toThrow(
                'DB unavailable',
            );
        });
    });

    describe('HTTP metadata', () => {
        it('POST endpoint has @HttpCode(201)', async () => {
            // NOTE: '@nestjs/common/constants' is resolvable at Jest runtime.
            // TypeScript strict mode with resolvePackageJsonExports shows a false
            // TS error in some IDE setups (same pattern used in acceptance tests).
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { HTTP_CODE_METADATA } = require('@nestjs/common/constants') as {
                HTTP_CODE_METADATA: string;
            };

            const httpCode = Reflect.getMetadata(
                HTTP_CODE_METADATA,
                ChildrenController.prototype.createChildProfile,
            );

            expect(httpCode).toBe(HttpStatus.CREATED);
        });

        it('GET endpoint has @HttpCode(200) or undefined (default 200)', () => {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { HTTP_CODE_METADATA } = require('@nestjs/common/constants') as {
                HTTP_CODE_METADATA: string;
            };

            const httpCode = Reflect.getMetadata(
                HTTP_CODE_METADATA,
                ChildrenController.prototype.getChildProfiles,
            );

            expect(httpCode === undefined || httpCode === HttpStatus.OK).toBe(true);
        });
    });
});
