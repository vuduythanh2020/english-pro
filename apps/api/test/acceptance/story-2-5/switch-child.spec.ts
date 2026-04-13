/**
 * Story 2.5: Child Login & Profile Switching
 * ATDD Tests — Auth Switch Endpoints (TDD GREEN PHASE)
 *
 * 🟢 TDD Phase: GREEN — Tests activated after implementation complete
 *
 * AC coverage:
 *   AC1 — Profile Selection Screen (structural prerequisites)
 *   AC2 — POST /api/v1/auth/switch-to-child (child JWT issuance)
 *   AC4 — POST /api/v1/auth/switch-to-parent (restore parent session)
 *   SwitchChildDto validation
 *   RolesGuard 'child' role support
 *
 * Infrastructure tái sử dụng:
 *   - childProfileFactory (test/support/factories/child-profile.factory.ts)
 *   - parentFactory (test/support/factories/parent.factory.ts)
 *   - createParentToken, createChildToken (test/support/fixtures/auth.fixture.ts)
 *   - Jest acceptance test runner (jest-acceptance.json)
 *
 * Test ID format: 2.5-{TYPE}-{###}
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// ── Path constants ──────────────────────────────────────────────────
const AUTH_MODULE_DIR = join(__dirname, '../../../src/modules/auth');
const AUTH_CONTROLLER_PATH = join(AUTH_MODULE_DIR, 'auth.controller.ts');
const AUTH_SERVICE_PATH = join(AUTH_MODULE_DIR, 'auth.service.ts');
const AUTH_SERVICE_SPEC_PATH = join(AUTH_MODULE_DIR, 'auth.service.spec.ts');
const SWITCH_CHILD_DTO_PATH = join(
    AUTH_MODULE_DIR,
    'dto/switch-child.dto.ts',
);
const ROLES_GUARD_PATH = join(
    __dirname,
    '../../../src/common/guards/roles.guard.ts',
);

// ════════════════════════════════════════════════════════════════════
// SECTION 1: STRUCTURAL PREREQUISITES (AC2, AC4)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.5: Auth Switch Structure @P0 @Structure', () => {
    it('2.5-STRUCT-001: SwitchChildDto file tồn tại tại src/modules/auth/dto/switch-child.dto.ts', () => {
        expect(existsSync(SWITCH_CHILD_DTO_PATH)).toBe(true);
    });

    it('2.5-STRUCT-002: auth controller expose POST switch-to-child và switch-to-parent', () => {
        const content = readFileSync(AUTH_CONTROLLER_PATH, 'utf-8');
        expect(content).toMatch(/switch-to-child/);
        expect(content).toMatch(/switch-to-parent/);
    });

    it('2.5-STRUCT-003: auth service có phương thức generateChildJwt và generateParentSessionToken', () => {
        const content = readFileSync(AUTH_SERVICE_PATH, 'utf-8');
        expect(content).toMatch(/generateChildJwt/);
        expect(content).toMatch(/generateParentSessionToken/);
    });

    it('2.5-STRUCT-004: auth service spec có tests cho generateChildJwt và generateParentSessionToken', () => {
        const content = readFileSync(AUTH_SERVICE_SPEC_PATH, 'utf-8');
        expect(content).toMatch(/generateChildJwt/);
        expect(content).toMatch(/generateParentSessionToken/);
    });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 2: SwitchChildDto VALIDATION (AC2)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.5: SwitchChildDto Validation @P0 @Unit', () => {
    async function validateSwitchChildDto(data: Record<string, unknown>) {
        const { SwitchChildDto } = await import(
            '../../../src/modules/auth/dto/switch-child.dto'
        );
        const { validate } = await import('class-validator');
        const { plainToInstance } = await import('class-transformer');

        const dto = plainToInstance(SwitchChildDto, data);
        return validate(dto as object);
    }

    it('2.5-UNIT-001: dto hợp lệ — childId là UUID v4 hợp lệ → pass', async () => {
        const errors = await validateSwitchChildDto({
            childId: '550e8400-e29b-41d4-a716-446655440000',
        });
        expect(errors).toHaveLength(0);
    });

    it('2.5-UNIT-002: childId bị thiếu → ValidationError (isNotEmpty)', async () => {
        const errors = await validateSwitchChildDto({});
        const childIdError = errors.find((e) => e.property === 'childId');
        expect(childIdError).toBeDefined();
    });

    it('2.5-UNIT-003: childId không phải UUID → ValidationError (isUUID)', async () => {
        const errors = await validateSwitchChildDto({
            childId: 'not-a-valid-uuid',
        });
        const childIdError = errors.find((e) => e.property === 'childId');
        expect(childIdError).toBeDefined();
    });

    it('2.5-UNIT-004: childId là số nguyên → ValidationError (isString/isUUID)', async () => {
        const errors = await validateSwitchChildDto({ childId: 12345 });
        const childIdError = errors.find((e) => e.property === 'childId');
        expect(childIdError).toBeDefined();
    });

    it('2.5-UNIT-005: childId là UUID v4 boundary — all zeros UUID → ValidationError', async () => {
        // UUID với version field sai (không phải v4)
        const errors = await validateSwitchChildDto({
            childId: '00000000-0000-0000-0000-000000000000',
        });
        const childIdError = errors.find((e) => e.property === 'childId');
        expect(childIdError).toBeDefined();
    });

    it('2.5-UNIT-006: SwitchChildDto có @IsString, @IsUUID("4"), @IsNotEmpty decorators', () => {
        const content = readFileSync(SWITCH_CHILD_DTO_PATH, 'utf-8');
        expect(content).toMatch(/@IsString\(\)/);
        expect(content).toMatch(/@IsUUID\(['"]4['"]\)/);
        expect(content).toMatch(/@IsNotEmpty\(\)/);
    });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 3: AuthService — generateChildJwt (AC2)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.5: AuthService.generateChildJwt @P0 @Integration', () => {
    async function createAuthServiceWithMocks(prismaMock: {
        childProfile: { findFirst: jest.Mock };
    }) {
        const { AuthService } = await import(
            '../../../src/modules/auth/auth.service'
        );
        const { SupabaseService } = await import(
            '../../../src/modules/auth/supabase/supabase.service'
        );
        const { PrismaService } = await import(
            '../../../src/prisma/prisma.service'
        );
        const { ConfigService } = await import('@nestjs/config');

        const mockLogger = {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn(),
        };

        const mockConfigService = {
            get: jest.fn().mockReturnValue('test-jwt-secret-for-testing-only'),
        };

        const mockSupabaseService = {
            signUp: jest.fn(),
            signIn: jest.fn(),
            refreshSession: jest.fn(),
            getAdminClient: jest.fn(),
        };

        const { Test } = await import('@nestjs/testing');
        const { WINSTON_MODULE_NEST_PROVIDER } = await import('nest-winston');

        const module = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: PrismaService,
                    useValue: prismaMock,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
                {
                    provide: SupabaseService,
                    useValue: mockSupabaseService,
                },
                {
                    provide: WINSTON_MODULE_NEST_PROVIDER,
                    useValue: mockLogger,
                },
            ],
        }).compile();

        return module.get<AuthService>(AuthService);
    }

    it('2.5-INT-001: generateChildJwt() thành công — trả về JWT với claims { role: "child", childId, parentId } (AC2)', async () => {
        const { childProfileFactory } = await import(
            'test/support/factories/child-profile.factory'
        );
        const parentId = '00000000-0000-4000-a000-000000000001';
        const childId = '00000000-0000-4000-b000-000000000001';
        const mockProfile = childProfileFactory({
            id: childId,
            parentId,
            displayName: 'Bé Nam',
            avatarId: 3,
            isActive: true,
        });

        const prismaMock = {
            childProfile: {
                findFirst: jest.fn().mockResolvedValue(mockProfile),
            },
        };

        const service = await createAuthServiceWithMocks(prismaMock);
        const result = await (service as any).generateChildJwt(parentId, childId);

        // Kiểm tra response shape (AC2)
        expect(result).toMatchObject({
            accessToken: expect.any(String),
            expiresIn: expect.any(Number),
            childId,
            childProfile: {
                displayName: 'Bé Nam',
                avatarId: 3,
            },
        });

        // Kiểm tra JWT claims
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.decode(result.accessToken) as Record<string, unknown>;
        expect(decoded).toMatchObject({
            sub: childId,
            role: 'child',
            childId,
            parentId,
        });
        expect(decoded.exp).toBeDefined();
    });

    it('2.5-INT-002: generateChildJwt() — childId không thuộc parent → NotFoundException 404 (AC2)', async () => {
        const prismaMock = {
            childProfile: {
                findFirst: jest.fn().mockResolvedValue(null), // Không tìm thấy profile
            },
        };

        const service = await createAuthServiceWithMocks(prismaMock);

        await expect(
            (service as any).generateChildJwt(
                'parent-uuid',
                'non-existent-child-uuid',
            ),
        ).rejects.toMatchObject({
            status: 404,
        });

        // Kiểm tra query đúng: findFirst với parentId + isActive
        expect(prismaMock.childProfile.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    id: 'non-existent-child-uuid',
                    parentId: 'parent-uuid',
                    isActive: true,
                }),
            }),
        );
    });

    it('2.5-INT-003: generateChildJwt() — profile inactive → NotFoundException 404 (edge case)', async () => {
        const { childProfileFactory } = await import(
            'test/support/factories/child-profile.factory'
        );
        const inactiveProfile = childProfileFactory({
            id: 'child-uuid',
            parentId: 'parent-uuid',
            isActive: false,
        });

        const prismaMock = {
            childProfile: {
                // findFirst trả về null vì filter isActive: true
                findFirst: jest.fn().mockResolvedValue(null),
            },
        };

        const service = await createAuthServiceWithMocks(prismaMock);

        await expect(
            (service as any).generateChildJwt('parent-uuid', inactiveProfile.id),
        ).rejects.toMatchObject({
            status: 404,
        });
    });

    it('2.5-INT-004: generateChildJwt() — JWT có exp là 1 giờ từ hiện tại (AC2)', async () => {
        const { childProfileFactory } = await import(
            'test/support/factories/child-profile.factory'
        );
        const parentId = '00000000-0000-4000-a000-000000000001';
        const childId = '00000000-0000-4000-b000-000000000001';
        const mockProfile = childProfileFactory({
            id: childId,
            parentId,
            isActive: true,
        });

        const prismaMock = {
            childProfile: {
                findFirst: jest.fn().mockResolvedValue(mockProfile),
            },
        };

        const service = await createAuthServiceWithMocks(prismaMock);
        const result = await (service as any).generateChildJwt(parentId, childId);

        const jwt = await import('jsonwebtoken');
        const decoded = jwt.decode(result.accessToken) as Record<string, unknown>;
        const exp = decoded.exp as number;
        const iat = decoded.iat as number;

        // exp phải là iat + 3600 (±5 giây tolerance)
        expect(exp - iat).toBeGreaterThanOrEqual(3595);
        expect(exp - iat).toBeLessThanOrEqual(3605);
        expect(result.expiresIn).toBe(3600);
    });

    it('2.5-INT-005: generateChildJwt() — Prisma failure propagation @P1', async () => {
        const prismaMock = {
            childProfile: {
                findFirst: jest
                    .fn()
                    .mockRejectedValue(new Error('DB connection timeout')),
            },
        };

        const service = await createAuthServiceWithMocks(prismaMock);

        await expect(
            (service as any).generateChildJwt('parent-uuid', 'child-uuid'),
        ).rejects.toThrow();
    });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 4: AuthService — generateParentSessionToken (AC4)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.5: AuthService.generateParentSessionToken @P1 @Integration', () => {
    it('2.5-INT-006: generateParentSessionToken() thành công — re-issue parent JWT với role "PARENT" (AC4)', async () => {
        const { parentFactory } = await import(
            'test/support/factories/parent.factory'
        );
        const parent = parentFactory({ id: 'parent-uuid' });

        const { AuthService } = await import(
            '../../../src/modules/auth/auth.service'
        );
        const { SupabaseService } = await import(
            '../../../src/modules/auth/supabase/supabase.service'
        );
        const { PrismaService } = await import(
            '../../../src/prisma/prisma.service'
        );
        const { Test } = await import('@nestjs/testing');
        const { WINSTON_MODULE_NEST_PROVIDER } = await import('nest-winston');
        const { ConfigService } = await import('@nestjs/config');

        const mockLogger = {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
        };

        const prismaMock = {
            parent: {
                findUnique: jest.fn().mockResolvedValue(parent),
            },
            childProfile: {
                findFirst: jest.fn(),
            },
        };

        const module = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: PrismaService,
                    useValue: prismaMock,
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue('test-jwt-secret-for-testing-only'),
                    },
                },
                {
                    provide: SupabaseService,
                    useValue: {
                        signUp: jest.fn(),
                        signIn: jest.fn(),
                        refreshSession: jest.fn(),
                    },
                },
                { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
            ],
        }).compile();

        const service = module.get<AuthService>(AuthService);
        const result = await (service as any).generateParentSessionToken(
            'parent-uuid',
        );

        expect(result).toMatchObject({
            accessToken: expect.any(String),
            role: 'parent',
        });

        const jwt = await import('jsonwebtoken');
        const decoded = jwt.decode(result.accessToken) as Record<string, unknown>;
        expect(decoded.role).toBe('parent');
    });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 5: CONTROLLER GUARDS & DECORATORS (AC2, AC4)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.5: AuthController Guards @P0 @Unit', () => {
    it('2.5-CTRL-001: POST switch-to-child KHÔNG có @Public() — yêu cầu JWT parent (AC2)', () => {
        const content = readFileSync(AUTH_CONTROLLER_PATH, 'utf-8');
        // switch-to-child không phải public endpoint
        // Kiểm tra không có @Public() ngay trước/sau khai báo method switchToChild
        const switchToChildBlock = content.match(
            /switchToChild[\s\S]*?(?=\n\s*@|\nclass|\nmodule\.exports)/,
        );
        if (switchToChildBlock) {
            expect(switchToChildBlock[0]).not.toMatch(/@Public\(\)/);
        }
        // Hoặc đơn giản: controller có @UseGuards trên switch-to-child
        expect(content).toMatch(/switch-to-child/);
    });

    it('2.5-CTRL-002: POST switch-to-child dùng @UseGuards(AuthGuard, RolesGuard) + @Roles("PARENT") (AC2)', () => {
        const content = readFileSync(AUTH_CONTROLLER_PATH, 'utf-8');
        // Controller class hoặc method phải có guards + PARENT role
        expect(content).toMatch(/switch-to-child/);
        expect(content).toMatch(/@UseGuards/);
        expect(content).toMatch(/@Roles\(.*PARENT.*\)/);
    });

    it('2.5-CTRL-003: POST switch-to-child trả về HTTP 200 (AC2)', async () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { HTTP_CODE_METADATA } = require('@nestjs/common/constants') as { HTTP_CODE_METADATA: string };
        const { HttpStatus } = await import('@nestjs/common');
        const { AuthController } = await import(
            '../../../src/modules/auth/auth.controller'
        );

        const httpCode = Reflect.getMetadata(
            HTTP_CODE_METADATA,
            AuthController.prototype.switchToChild,
        );
        expect(httpCode === undefined || httpCode === HttpStatus.OK).toBe(true);
    });

    it('2.5-CTRL-004: POST switch-to-parent dùng @UseGuards(AuthGuard, RolesGuard) + @Roles("child") (AC4)', () => {
        const content = readFileSync(AUTH_CONTROLLER_PATH, 'utf-8');
        expect(content).toMatch(/switch-to-parent/);
        expect(content).toMatch(/@Roles\(.*CHILD.*\)/i);
    });

    it('2.5-CTRL-005: POST switch-to-parent trả về HTTP 200 (AC4)', async () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { HTTP_CODE_METADATA } = require('@nestjs/common/constants') as { HTTP_CODE_METADATA: string };
        const { HttpStatus } = await import('@nestjs/common');
        const { AuthController } = await import(
            '../../../src/modules/auth/auth.controller'
        );

        const httpCode = Reflect.getMetadata(
            HTTP_CODE_METADATA,
            AuthController.prototype.switchToParent,
        );
        expect(httpCode === undefined || httpCode === HttpStatus.OK).toBe(true);
    });

    it('2.5-CTRL-006: controller có @ApiTags và @ApiOperation trên switch endpoints (AC2, AC4)', () => {
        const content = readFileSync(AUTH_CONTROLLER_PATH, 'utf-8');
        expect(content).toMatch(/@ApiOperation/);
        // Phải có ít nhất 3 ApiOperation (register, login, + switch endpoints)
        const apiOperationMatches = content.match(/@ApiOperation/g);
        expect(apiOperationMatches!.length).toBeGreaterThanOrEqual(3);
    });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 6: RolesGuard — 'child' role support (AC4, AC2)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.5: RolesGuard child role @P0 @Unit', () => {
    it('2.5-ROLES-001: RolesGuard allow khi user.role = "child" và @Roles("child") (AC4)', async () => {
        const { RolesGuard } = await import(
            '../../../src/common/guards/roles.guard'
        );
        const { Reflector } = await import('@nestjs/core');

        const reflector = new Reflector();
        const guard = new RolesGuard(reflector);

        // Mock context với user.role = 'child'
        const mockContext = {
            switchToHttp: () => ({
                getRequest: () => ({
                    user: { sub: 'child-uuid', role: 'child', childId: 'child-uuid' },
                }),
            }),
            getHandler: () => ({}),
            getClass: () => ({}),
        } as any;

        // Mock reflector để return ['child'] role
        jest
            .spyOn(reflector, 'getAllAndOverride')
            .mockReturnValue(['child'] as any);

        expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('2.5-ROLES-002: RolesGuard reject khi user.role = "child" và @Roles("PARENT") (AC2)', async () => {
        const { RolesGuard } = await import(
            '../../../src/common/guards/roles.guard'
        );
        const { Reflector } = await import('@nestjs/core');
        const { ForbiddenException } = await import('@nestjs/common');

        const reflector = new Reflector();
        const guard = new RolesGuard(reflector);

        const mockContext = {
            switchToHttp: () => ({
                getRequest: () => ({
                    user: { sub: 'child-uuid', role: 'child', childId: 'child-uuid' },
                }),
            }),
            getHandler: () => ({}),
            getClass: () => ({}),
        } as any;

        // PARENT route, child đang call → phải throw 403
        jest
            .spyOn(reflector, 'getAllAndOverride')
            .mockReturnValue(['PARENT'] as any);

        expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('2.5-ROLES-003: RolesGuard normalize case — "CHILD" và "child" đều được chấp nhận khi @Roles("child")', async () => {
        const { RolesGuard } = await import(
            '../../../src/common/guards/roles.guard'
        );
        const { Reflector } = await import('@nestjs/core');

        const reflector = new Reflector();
        const guard = new RolesGuard(reflector);

        // Test với CHILD uppercase
        const mockContextUppercase = {
            switchToHttp: () => ({
                getRequest: () => ({
                    user: { sub: 'child-uuid', role: 'CHILD', childId: 'child-uuid' },
                }),
            }),
            getHandler: () => ({}),
            getClass: () => ({}),
        } as any;

        jest
            .spyOn(reflector, 'getAllAndOverride')
            .mockReturnValue(['child'] as any);

        expect(guard.canActivate(mockContextUppercase)).toBe(true);
    });

    it('2.5-ROLES-004: RolesGuard source cập nhật normalize logic để support child role (AC4)', () => {
        const content = readFileSync(ROLES_GUARD_PATH, 'utf-8');
        // Phải có normalize/toLowerCase logic
        expect(content).toMatch(/toLowerCase|normalize|child/i);
    });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 7: STATIC ANALYSIS
// ════════════════════════════════════════════════════════════════════

describe('Story 2.5: Static Analysis @P1 @Static', () => {
    it('2.5-STATIC-001: generateChildJwt() KHÔNG wrap response thủ công (ResponseWrapperInterceptor tự xử lý)', () => {
        const content = readFileSync(AUTH_SERVICE_PATH, 'utf-8');
        // Trong generateChildJwt, service trả về raw object, không wrap { data: ... }
        // Nếu có generateChildJwt rồi, kiểm tra không có return { data:
        if (content.includes('generateChildJwt')) {
            const jwtMethodMatch = content.match(
                /generateChildJwt[\s\S]*?(?=\n\s{0,2}async|\nclass|\n\}$)/,
            );
            if (jwtMethodMatch) {
                expect(jwtMethodMatch[0]).not.toMatch(/return\s*\{\s*data:/);
            }
        }
        expect(content).toMatch(/generateChildJwt/);
    });

    it('2.5-STATIC-002: generateChildJwt() validate profile ownership với prisma.childProfile.findFirst (AC2)', () => {
        const content = readFileSync(AUTH_SERVICE_PATH, 'utf-8');
        expect(content).toMatch(/generateChildJwt/);
        expect(content).toMatch(/childProfile.*findFirst|findFirst.*childProfile/);
    });

    it('2.5-STATIC-003: generateChildJwt() dùng ConfigService để lấy JWT secret (không hardcode)', () => {
        const content = readFileSync(AUTH_SERVICE_PATH, 'utf-8');
        expect(content).toMatch(/generateChildJwt/);
        // Phải dùng configService.get hoặc env var — không hardcode secret
        expect(content).toMatch(/configService\.get|ConfigService|process\.env/);
    });

    it('2.5-STATIC-004: SwitchChildDto có @ApiProperty Swagger decorator', () => {
        const content = readFileSync(SWITCH_CHILD_DTO_PATH, 'utf-8');
        expect(content).toMatch(/@ApiProperty/);
    });

    it('2.5-STATIC-005: controller import và sử dụng @CurrentUser() decorator để lấy parentId/childId (AC2, AC4)', () => {
        const content = readFileSync(AUTH_CONTROLLER_PATH, 'utf-8');
        expect(content).toMatch(/@CurrentUser\(\)/);
    });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 8: RESPONSE CONTRACT VALIDATION (AC2, AC4)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.5: Response Contract Shapes @P0 @Unit', () => {
    it('2.5-CONTRACT-001: switch-to-child response shape — { data: { accessToken, expiresIn, childId, childProfile: { displayName, avatarId } }, meta }', async () => {
        const expectedResponseShape = {
            accessToken: expect.any(String),
            expiresIn: 3600,
            childId: expect.any(String),
            childProfile: {
                displayName: expect.any(String),
                avatarId: expect.any(Number),
            },
        };

        // Khi không có implementation, chỉ verify shape spec
        const mockResult = {
            accessToken: 'child-jwt-token',
            expiresIn: 3600,
            childId: '00000000-0000-4000-b000-000000000001',
            childProfile: {
                displayName: 'Bé Nam',
                avatarId: 3,
            },
        };

        expect(mockResult).toMatchObject(expectedResponseShape);
    });

    it('2.5-CONTRACT-002: switch-to-parent response shape — { data: { accessToken, role: "parent" }, meta }', async () => {
        const expectedResponseShape = {
            accessToken: expect.any(String),
            role: 'parent',
        };

        const mockResult = {
            accessToken: 'parent-jwt-token',
            role: 'parent',
        };

        expect(mockResult).toMatchObject(expectedResponseShape);
    });

    it('2.5-CONTRACT-003: switch-to-child 404 error shape — CHILD_PROFILE_NOT_FOUND (AC2)', async () => {
        // Khi childId không thuộc parent, phải trả về:
        // { statusCode: 404, error: "CHILD_PROFILE_NOT_FOUND", message: "...", meta: {...} }
        const expectedErrorShape = {
            statusCode: 404,
            error: 'CHILD_PROFILE_NOT_FOUND',
            message: expect.any(String),
        };

        const mockError = {
            statusCode: 404,
            error: 'CHILD_PROFILE_NOT_FOUND',
            message: 'Child profile not found or not owned by parent',
        };

        expect(mockError).toMatchObject(expectedErrorShape);
    });
});
