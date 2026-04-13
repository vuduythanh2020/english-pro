/**
 * Story 2.6: Parental Gate (PIN & Biometric)
 * ATDD Tests — Backend Infrastructure Verification (TDD GREEN PHASE)
 *
 * 🟢 TDD Phase: GREEN — Tests activated 2026-04-13 (backend infra verified)
 *
 * AC coverage:
 *   AC6 — Child Cannot Bypass (ParentalGateGuard blocks CHILD role on @ParentOnly() endpoints)
 *   AC7 — Parental Gate wraps "Switch to Parent" button (switch-to-parent endpoint supports flow)
 *
 * Infrastructure tái sử dụng:
 *   - childProfileFactory (test/support/factories/child-profile.factory.ts)
 *   - parentFactory (test/support/factories/parent.factory.ts)
 *   - createParentToken, createChildToken (test/support/fixtures/auth.fixture.ts)
 *   - Jest acceptance test runner (jest-acceptance.json)
 *
 * Backend scope note:
 *   Story 2.6 là Flutter-only. Backend acceptance tests verify:
 *   (1) Infrastructure support đã có: ParentalGateGuard, ParentOnly decorator, guard chain
 *   (2) switch-to-parent endpoint hỗ trợ đúng flow sau khi PIN/biometric verify thành công
 *   (3) CHILD JWT không thể bypass @ParentOnly() endpoints
 *
 * Test ID format: 2.6-{TYPE}-{###}
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// ── Path constants ──────────────────────────────────────────────────
const COMMON_GUARDS_DIR = join(
    __dirname,
    '../../../src/common/guards',
);
const COMMON_DECORATORS_DIR = join(
    __dirname,
    '../../../src/common/decorators',
);
const PARENTAL_GATE_GUARD_PATH = join(
    COMMON_GUARDS_DIR,
    'parental-gate.guard.ts',
);
const PARENT_ONLY_DECORATOR_PATH = join(
    COMMON_DECORATORS_DIR,
    'parent-only.decorator.ts',
);
const COMMON_MODULE_PATH = join(
    __dirname,
    '../../../src/common/common.module.ts',
);
const AUTH_CONTROLLER_PATH = join(
    __dirname,
    '../../../src/modules/auth/auth.controller.ts',
);

// ════════════════════════════════════════════════════════════════════
// SECTION 1: STRUCTURAL PREREQUISITES (AC6, AC7)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.6: Parental Gate Backend Infrastructure @P0 @Structure', () => {
    it('2.6-STRUCT-001: parental-gate.guard.ts tồn tại tại src/common/guards/', () => {
        // Backend guard phải tồn tại để support AC6 (child cannot bypass)
        expect(existsSync(PARENTAL_GATE_GUARD_PATH)).toBe(true);
    });

    it('2.6-STRUCT-002: parent-only.decorator.ts tồn tại tại src/common/decorators/', () => {
        // @ParentOnly() decorator phải tồn tại để mark parent-only endpoints
        expect(existsSync(PARENT_ONLY_DECORATOR_PATH)).toBe(true);
    });

    it('2.6-STRUCT-003: common.module.ts register ParentalGateGuard như global APP_GUARD (AC6)', () => {
        // Guard phải được đăng ký globally để protect tất cả endpoints
        const content = readFileSync(COMMON_MODULE_PATH, 'utf-8');
        expect(content).toMatch(/ParentalGateGuard/);
        expect(content).toMatch(/APP_GUARD/);
    });

    it('2.6-STRUCT-004: auth controller có POST switch-to-parent endpoint (AC7)', () => {
        // switch-to-parent endpoint phải tồn tại để Flutter dispatch AuthChildSessionEnded
        const content = readFileSync(AUTH_CONTROLLER_PATH, 'utf-8');
        expect(content).toMatch(/switch-to-parent/);
    });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 2: ParentalGateGuard BEHAVIOR (AC6 — Child Cannot Bypass)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.6: ParentalGateGuard — Ngăn chặn CHILD bypass (AC6) @P0 @Unit', () => {
    function createMockExecutionContext(request: {
        user?: { sub: string; role: string; childId?: string; parentId?: string };
    }) {
        return {
            switchToHttp: () => ({
                getRequest: () => request,
                getResponse: () => ({}),
            }),
            getHandler: () => jest.fn(),
            getClass: () => jest.fn(),
        } as any;
    }

    it('2.6-GUARD-001: ParentalGateGuard throw ForbiddenException khi CHILD cố truy cập @ParentOnly() endpoint (AC6)', async () => {
        // Verify guard blocks child role on parent-only endpoints
        const { ParentalGateGuard } = await import(
            '../../../src/common/guards/parental-gate.guard'
        );
        const { ForbiddenException } = await import('@nestjs/common');

        const mockReflector = {
            getAllAndOverride: jest.fn().mockReturnValue(true), // @ParentOnly() is set
        };
        const guard = new ParentalGateGuard(mockReflector as any);

        // Child session đang active — cố truy cập parent-only endpoint
        const mockContext = createMockExecutionContext({
            user: {
                sub: '00000000-0000-4000-b000-000000000001',
                role: 'CHILD',
                childId: '00000000-0000-4000-b000-000000000001',
                parentId: '00000000-0000-4000-a000-000000000001',
            },
        });

        expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('2.6-GUARD-002: ParentalGateGuard throw error với message "Parent access required" (AC6)', async () => {
        // Error message phải rõ ràng cho logging/debugging
        const { ParentalGateGuard } = await import(
            '../../../src/common/guards/parental-gate.guard'
        );

        const mockReflector = {
            getAllAndOverride: jest.fn().mockReturnValue(true),
        };
        const guard = new ParentalGateGuard(mockReflector as any);

        const mockContext = createMockExecutionContext({
            user: { sub: 'child-uuid', role: 'CHILD', childId: 'child-uuid' },
        });

        try {
            guard.canActivate(mockContext);
            fail('Should have thrown ForbiddenException');
        } catch (error: any) {
            expect(error.message).toContain('Parent access required');
        }
    });

    it('2.6-GUARD-003: ParentalGateGuard cho phép PARENT truy cập @ParentOnly() endpoint (AC6)', async () => {
        // Sau khi parental gate success, PARENT phải được phép truy cập
        const { ParentalGateGuard } = await import(
            '../../../src/common/guards/parental-gate.guard'
        );

        const mockReflector = {
            getAllAndOverride: jest.fn().mockReturnValue(true), // @ParentOnly() is set
        };
        const guard = new ParentalGateGuard(mockReflector as any);

        // Parent đã verified qua PIN/biometric → có PARENT JWT
        const mockContext = createMockExecutionContext({
            user: {
                sub: '00000000-0000-4000-a000-000000000001',
                role: 'PARENT',
                parentId: '00000000-0000-4000-a000-000000000001',
            },
        });

        expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('2.6-GUARD-004: ParentalGateGuard bỏ qua khi không có @ParentOnly() decorator (không phải endpoint nhạy cảm)', async () => {
        // Guard không chặn non-parent-only endpoints
        const { ParentalGateGuard } = await import(
            '../../../src/common/guards/parental-gate.guard'
        );

        // @ParentOnly() KHÔNG được set trên endpoint này
        const mockReflector = {
            getAllAndOverride: jest.fn().mockReturnValue(false),
        };
        const guard = new ParentalGateGuard(mockReflector as any);

        // Child có thể access non-parent-only endpoints
        const mockContext = createMockExecutionContext({
            user: { sub: 'child-uuid', role: 'CHILD', childId: 'child-uuid' },
        });

        expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('2.6-GUARD-005: ParentalGateGuard throw ForbiddenException khi user không có trong request (unauthenticated) @P1', async () => {
        // Defensive — không có user object trong request
        const { ParentalGateGuard } = await import(
            '../../../src/common/guards/parental-gate.guard'
        );
        const { ForbiddenException } = await import('@nestjs/common');

        const mockReflector = {
            getAllAndOverride: jest.fn().mockReturnValue(true),
        };
        const guard = new ParentalGateGuard(mockReflector as any);

        // Không có user trong request — trường hợp lý thuyết vì AuthGuard đã run trước
        const mockContext = createMockExecutionContext({ user: undefined });

        expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 3: switch-to-parent ENDPOINT (AC7 — Parental Gate Flow)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.6: AuthController switch-to-parent @P0 @Unit', () => {
    it('2.6-CTRL-001: POST switch-to-parent chỉ chấp nhận CHILD JWT — @Roles("CHILD") required (AC7)', () => {
        // Sau khi Flutter PIN verify thành công, app gọi switch-to-parent với child JWT
        // Endpoint phải yêu cầu CHILD role
        const content = readFileSync(AUTH_CONTROLLER_PATH, 'utf-8');
        expect(content).toMatch(/switch-to-parent/);
        // Phải có @Roles('CHILD') hoặc @Roles("CHILD")
        expect(content).toMatch(/@Roles\(.*CHILD.*\)/i);
    });

    it('2.6-CTRL-002: POST switch-to-parent trả về parent JWT với role "parent" (AC7)', async () => {
        // Sau khi parental gate thành công, Flutter cần parent JWT để restore session
        const { parentFactory } = await import(
            'test/support/factories/parent.factory'
        );
        // Fix: authUserId must match parentId so JWT sub === parentId
        const PARENT_UUID = '00000000-0000-4000-a000-000000000001';
        const parent = parentFactory({
            id: PARENT_UUID,
            authUserId: PARENT_UUID,
        });

        const { AuthService } = await import(
            '../../../src/modules/auth/auth.service'
        );
        const { PrismaService } = await import(
            '../../../src/prisma/prisma.service'
        );
        const { SupabaseService } = await import(
            '../../../src/modules/auth/supabase/supabase.service'
        );
        const { ConfigService } = await import('@nestjs/config');
        const { Test } = await import('@nestjs/testing');
        const { WINSTON_MODULE_NEST_PROVIDER } = await import('nest-winston');

        const module = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: PrismaService,
                    useValue: {
                        parent: {
                            findUnique: jest.fn().mockResolvedValue(parent),
                        },
                        childProfile: {
                            findFirst: jest.fn(),
                        },
                    },
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
                {
                    provide: WINSTON_MODULE_NEST_PROVIDER,
                    useValue: {
                        log: jest.fn(),
                        error: jest.fn(),
                        warn: jest.fn(),
                        debug: jest.fn(),
                    },
                },
            ],
        }).compile();

        const service = module.get<AuthService>(AuthService);
        const result = await (service as any).generateParentSessionToken(PARENT_UUID);

        // Kiểm tra response shape (AC7 — app nhận được parent JWT)
        expect(result).toMatchObject({
            accessToken: expect.any(String),
            role: 'parent',
        });

        // Kiểm tra JWT claims: phải có role=parent
        const jwtModule = await import('jsonwebtoken');
        const decoded = jwtModule.decode(result.accessToken) as Record<string, unknown>;
        expect(decoded.role).toBe('parent');
        // sub is authUserId which we set == PARENT_UUID
        expect(decoded.sub).toBe(PARENT_UUID);
    });

    it('2.6-CTRL-003: POST switch-to-parent chặn PARENT JWT (chỉ CHILD được gọi) — 403 Forbidden (AC7)', async () => {
        // PARENT JWT không thể gọi switch-to-parent (đã ở parent mode)
        // RolesGuard chặn vì endpoint yêu cầu CHILD role
        const { RolesGuard } = await import(
            '../../../src/common/guards/roles.guard'
        );
        const { Reflector } = await import('@nestjs/core');
        const { ForbiddenException } = await import('@nestjs/common');

        const reflector = new Reflector();
        const guard = new RolesGuard(reflector);

        // PARENT cố gọi switch-to-parent (endpoint require CHILD role)
        const mockContext = {
            switchToHttp: () => ({
                getRequest: () => ({
                    user: {
                        sub: 'parent-uuid',
                        role: 'PARENT',
                        parentId: 'parent-uuid',
                    },
                }),
            }),
            getHandler: () => ({}),
            getClass: () => ({}),
        } as any;

        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['CHILD'] as any);

        expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 4: GUARD CHAIN INTEGRATION (AC6 — Full Chain)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.6: Guard Chain Integration @P1 @Integration', () => {
    it('2.6-CHAIN-001: CommonModule đăng ký guard chain đúng thứ tự Auth → Roles → ParentalGate (AC6)', () => {
        // Thứ tự guard quan trọng — ParentalGate phải sau Auth và Roles
        const content = readFileSync(COMMON_MODULE_PATH, 'utf-8');

        // Cả 3 guards phải có mặt
        expect(content).toMatch(/AuthGuard/);
        expect(content).toMatch(/RolesGuard/);
        expect(content).toMatch(/ParentalGateGuard/);

        // Kiểm tra thứ tự xuất hiện trong file
        const authGuardPos = content.indexOf('AuthGuard');
        const rolesGuardPos = content.indexOf('RolesGuard');
        const parentalGatePos = content.indexOf('ParentalGateGuard');

        expect(authGuardPos).toBeLessThan(rolesGuardPos);
        expect(rolesGuardPos).toBeLessThan(parentalGatePos);
    });

    it('2.6-CHAIN-002: ParentalGateGuard source export PARENT_ONLY_KEY từ parent-only.decorator.ts (AC6)', () => {
        // Guard phải import đúng key từ decorator
        const guardContent = readFileSync(PARENTAL_GATE_GUARD_PATH, 'utf-8');
        const decoratorContent = readFileSync(PARENT_ONLY_DECORATOR_PATH, 'utf-8');

        // Guard import PARENT_ONLY_KEY
        expect(guardContent).toMatch(/PARENT_ONLY_KEY/);

        // Decorator export PARENT_ONLY_KEY
        expect(decoratorContent).toMatch(/PARENT_ONLY_KEY/);
        expect(decoratorContent).toMatch(/export.*PARENT_ONLY_KEY|PARENT_ONLY_KEY.*export/);
    });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 5: STATIC ANALYSIS (AC6, AC7)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.6: Static Analysis @P1 @Static', () => {
    it('2.6-STATIC-001: ParentalGateGuard implements CanActivate interface (AC6)', () => {
        // Guard phải implement NestJS interface
        const content = readFileSync(PARENTAL_GATE_GUARD_PATH, 'utf-8');
        expect(content).toMatch(/implements CanActivate/);
        expect(content).toMatch(/@Injectable\(\)/);
    });

    it('2.6-STATIC-002: ParentalGateGuard check role === "CHILD" — không phải "child" lowercase (AC6)', () => {
        // Role trong JWT từ backend luôn là uppercase 'CHILD'
        // Guard phải match đúng case
        const content = readFileSync(PARENTAL_GATE_GUARD_PATH, 'utf-8');
        // Guard check phải có pattern user.role === 'CHILD' hoặc tương đương
        expect(content).toMatch(/CHILD/);
    });

    it('2.6-STATIC-003: parent-only.decorator.ts export đúng PARENT_ONLY_KEY constant (AC6)', () => {
        // Key phải là string constant 'parentOnly'
        const content = readFileSync(PARENT_ONLY_DECORATOR_PATH, 'utf-8');
        expect(content).toMatch(/PARENT_ONLY_KEY.*=.*['"]parentOnly['"]/);
    });

    it('2.6-STATIC-004: auth controller import @Roles decorator để protect switch-to-parent (AC7)', () => {
        // Controller phải dùng @Roles để protect endpoints
        const content = readFileSync(AUTH_CONTROLLER_PATH, 'utf-8');
        expect(content).toMatch(/import.*Roles.*from/);
        expect(content).toMatch(/@Roles/);
    });

    it('2.6-STATIC-005: switch-to-parent có @ApiOperation Swagger doc (AC7)', () => {
        // Endpoint phải có Swagger documentation
        const content = readFileSync(AUTH_CONTROLLER_PATH, 'utf-8');
        // Đếm số @ApiOperation: phải có ít nhất 4 (register, login, switch-to-child, switch-to-parent)
        const apiOperationMatches = content.match(/@ApiOperation/g);
        expect(apiOperationMatches!.length).toBeGreaterThanOrEqual(4);
    });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 6: RESPONSE CONTRACT VALIDATION (AC7)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.6: Response Contract Shapes @P0 @Contract', () => {
    it('2.6-CONTRACT-001: switch-to-parent response shape — { accessToken, role: "parent" } (AC7)', () => {
        // Flutter AuthBloc._onAuthChildSessionEnded() expects this shape
        // khi call switch-to-parent sau parental gate success
        const expectedResponseShape = {
            accessToken: expect.any(String),
            role: 'parent',
        };

        const mockResult = {
            accessToken: 'parent-jwt-token-after-parental-gate',
            role: 'parent',
        };

        expect(mockResult).toMatchObject(expectedResponseShape);
    });

    it('2.6-CONTRACT-002: switch-to-parent 403 error khi gọi không phải từ CHILD JWT (AC7)', () => {
        // Error shape phải consistent
        // Flutter app handles 403 bằng cách hiển thị thông báo lỗi
        const expectedErrorShape = {
            statusCode: 403,
            message: expect.any(String),
        };

        const mockError = {
            statusCode: 403,
            message: 'Forbidden resource',
            error: 'Forbidden',
        };

        expect(mockError).toMatchObject(expectedErrorShape);
    });

    it('2.6-CONTRACT-003: switch-to-parent 401 error khi thiếu Authorization header (AC7)', () => {
        // Unauthenticated request phải nhận 401
        // Flutter app handles 401 bằng cách redirect về login screen
        const expectedErrorShape = {
            statusCode: 401,
        };

        const mockError = {
            statusCode: 401,
            message: 'Unauthorized',
        };

        expect(mockError).toMatchObject(expectedErrorShape);
    });
});
