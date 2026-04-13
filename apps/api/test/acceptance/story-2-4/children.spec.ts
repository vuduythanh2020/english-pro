/**
 * Story 2.4: Child Profile Creation & Avatar Selection
 * ATDD Tests — ChildrenModule implementation verification
 * TDD Phase: 🔴 RED (failing before implementation)
 *
 * AC coverage:
 *   AC4 — POST /api/v1/children (create child profile, RLS, 201 response)
 *   AC7 — Max 3 child profiles per parent (422 PROFILE_LIMIT_REACHED)
 *
 * Infrastructure tái sử dụng:
 *   - childProfileFactory (test/support/factories/child-profile.factory.ts)
 *   - parentFactory (test/support/factories/parent.factory.ts)
 *   - Jest acceptance test runner (jest-acceptance.json)
 *
 * Convention: tất cả tests dùng it() — TDD red phase markers.
 * Xóa .skip() khi implement từng section.
 *
 * Test ID format: 2.4-{TYPE}-{###}
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// ── Path constants ──────────────────────────────────────────────────
const CHILDREN_MODULE_DIR = join(__dirname, '../../../src/modules/children');
const CHILDREN_MODULE_PATH = join(CHILDREN_MODULE_DIR, 'children.module.ts');
const CHILDREN_CONTROLLER_PATH = join(
  CHILDREN_MODULE_DIR,
  'children.controller.ts',
);
const CHILDREN_SERVICE_PATH = join(CHILDREN_MODULE_DIR, 'children.service.ts');
const CREATE_CHILD_DTO_PATH = join(
  CHILDREN_MODULE_DIR,
  'dto/create-child.dto.ts',
);
const CHILD_PROFILE_DTO_PATH = join(
  CHILDREN_MODULE_DIR,
  'dto/child-profile.dto.ts',
);
const APP_MODULE_PATH = join(__dirname, '../../../src/app.module.ts');

// ════════════════════════════════════════════════════════════════════
// SECTION 1: STRUCTURAL PREREQUISITES
// ════════════════════════════════════════════════════════════════════

describe('Story 2.4: ChildrenModule Structure @P0 @Structure', () => {
  it('2.4-STRUCT-001: module, controller, service và dto files tồn tại', () => {
    expect(existsSync(CHILDREN_MODULE_PATH)).toBe(true);
    expect(existsSync(CHILDREN_CONTROLLER_PATH)).toBe(true);
    expect(existsSync(CHILDREN_SERVICE_PATH)).toBe(true);
    expect(existsSync(CREATE_CHILD_DTO_PATH)).toBe(true);
    expect(existsSync(CHILD_PROFILE_DTO_PATH)).toBe(true);
  });

  it('2.4-STRUCT-002: ChildrenModule được đăng ký trong AppModule', () => {
    expect(existsSync(APP_MODULE_PATH)).toBe(true);
    const content = readFileSync(APP_MODULE_PATH, 'utf-8');
    expect(content).toMatch(/ChildrenModule/);
  });

  it('2.4-STRUCT-003: controller expose POST và GET tại /api/v1/children', () => {
    const content = readFileSync(CHILDREN_CONTROLLER_PATH, 'utf-8');
    expect(content).toMatch(/['"]api\/v1\/children['"]/);
    expect(content).toMatch(/@Post/);
    expect(content).toMatch(/@Get/);
  });

  it('2.4-STRUCT-004: thư mục dto tồn tại với create-child.dto và child-profile.dto', () => {
    const dtoDir = join(CHILDREN_MODULE_DIR, 'dto');
    expect(existsSync(dtoDir)).toBe(true);
    expect(existsSync(CREATE_CHILD_DTO_PATH)).toBe(true);
    expect(existsSync(CHILD_PROFILE_DTO_PATH)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 2: DTO VALIDATION
// ════════════════════════════════════════════════════════════════════

describe('Story 2.4: CreateChildDto Validation @P0 @Unit', () => {
  async function validateCreateChildDto(data: Record<string, unknown>) {
    const { CreateChildDto } =
      await import('../../../src/modules/children/dto/create-child.dto');
    const { validate } = await import('class-validator');
    const { plainToInstance } = await import('class-transformer');

    const dto = plainToInstance(CreateChildDto, data);
    return validate(dto as object);
  }

  it('2.4-UNIT-001: dto hợp lệ (displayName≤20 ký tự, avatarId 1–6) → pass', async () => {
    const errors = await validateCreateChildDto({
      displayName: 'Bé Nam',
      avatarId: 3,
    });
    expect(errors).toHaveLength(0);
  });

  it('2.4-UNIT-002: dto hợp lệ không có avatarId (optional) → pass', async () => {
    const errors = await validateCreateChildDto({
      displayName: 'Bé Nam',
    });
    expect(errors).toHaveLength(0);
  });

  it('2.4-UNIT-003: thiếu displayName → ValidationError', async () => {
    const errors = await validateCreateChildDto({ avatarId: 1 });
    const nameError = errors.find((e) => e.property === 'displayName');
    expect(nameError).toBeDefined();
  });

  it('2.4-UNIT-004: displayName rỗng → ValidationError (isNotEmpty)', async () => {
    const errors = await validateCreateChildDto({
      displayName: '',
      avatarId: 1,
    });
    const nameError = errors.find((e) => e.property === 'displayName');
    expect(nameError).toBeDefined();
  });

  it('2.4-UNIT-005: displayName vượt quá 20 ký tự → ValidationError (maxLength)', async () => {
    const errors = await validateCreateChildDto({
      displayName: 'A'.repeat(21),
      avatarId: 1,
    });
    const nameError = errors.find((e) => e.property === 'displayName');
    expect(nameError).toBeDefined();
  });

  it('2.4-UNIT-006: displayName đúng 20 ký tự → pass (edge case)', async () => {
    const errors = await validateCreateChildDto({
      displayName: 'A'.repeat(20),
      avatarId: 1,
    });
    expect(errors).toHaveLength(0);
  });

  it('2.4-UNIT-007: avatarId = 0 (dưới minimum) → ValidationError (min: 1)', async () => {
    const errors = await validateCreateChildDto({
      displayName: 'Bé Nam',
      avatarId: 0,
    });
    const avatarError = errors.find((e) => e.property === 'avatarId');
    expect(avatarError).toBeDefined();
  });

  it('2.4-UNIT-008: avatarId = 7 (trên maximum) → ValidationError (max: 6)', async () => {
    const errors = await validateCreateChildDto({
      displayName: 'Bé Nam',
      avatarId: 7,
    });
    const avatarError = errors.find((e) => e.property === 'avatarId');
    expect(avatarError).toBeDefined();
  });

  it('2.4-UNIT-009: avatarId không phải integer → ValidationError (isInt)', async () => {
    const errors = await validateCreateChildDto({
      displayName: 'Bé Nam',
      avatarId: 1.5,
    });
    const avatarError = errors.find((e) => e.property === 'avatarId');
    expect(avatarError).toBeDefined();
  });

  it('2.4-UNIT-010: avatarId = 1 và avatarId = 6 (boundary values) → pass', async () => {
    const errorsMin = await validateCreateChildDto({
      displayName: 'Bé Min',
      avatarId: 1,
    });
    const errorsMax = await validateCreateChildDto({
      displayName: 'Bé Max',
      avatarId: 6,
    });
    expect(errorsMin).toHaveLength(0);
    expect(errorsMax).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 3: CHILDREN SERVICE LOGIC (AC4, AC7)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.4: ChildrenService @P0 @Integration', () => {
  async function createChildrenService(prismaMock: {
    childProfile: {
      count: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
    };
  }) {
    const { ChildrenService } =
      await import('../../../src/modules/children/children.service');
    const loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    // ChildrenService uses this.prisma.$transaction(callback, options)
    // The callback receives a `tx` object with the same shape as prisma
    // We delegate tx.childProfile.* to prismaMock.childProfile.*
    const prismaMockWithTransaction = {
      ...prismaMock,
      $transaction: jest.fn(async (callback: (tx: typeof prismaMock) => Promise<unknown>) => {
        return callback(prismaMock);
      }),
    };

    return new ChildrenService(
      prismaMockWithTransaction as unknown as never,
      loggerMock as unknown as never,
    );
  }

  // ── 2.4-INT-001: createChildProfile() success (AC4) ──────────────

  describe('2.4-INT-001: createChildProfile() thành công @P0', () => {
    it('nên tạo child profile với fields đúng và trả về ChildProfile', async () => {
      const { childProfileFactory } =
        await import('test/support/factories/child-profile.factory');
      const mockProfile = childProfileFactory({
        parentId: 'parent-uuid',
        displayName: 'Bé Nam',
        avatarId: 3,
        level: 'beginner',
        xpTotal: 0,
      });

      const prismaMock = {
        childProfile: {
          count: jest.fn().mockResolvedValue(0),
          create: jest.fn().mockResolvedValue(mockProfile),
          findMany: jest.fn(),
        },
      };

      const service = await createChildrenService(prismaMock);
      const result = await service.createChildProfile('parent-uuid', {
        displayName: 'Bé Nam',
        avatarId: 3,
      });

      // Kiểm tra count được gọi trước (limit guard)
      expect(prismaMock.childProfile.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ parentId: 'parent-uuid' }),
        }),
      );

      // Kiểm tra create được gọi với đúng fields (AC4)
      expect(prismaMock.childProfile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            parentId: 'parent-uuid',
            displayName: 'Bé Nam',
            avatarId: 3,
            level: 'beginner',
            xpTotal: 0,
          }),
        }),
      );

      // Kiểm tra response shape
      expect(result).toMatchObject({
        id: expect.any(String),
        parentId: 'parent-uuid',
        displayName: 'Bé Nam',
        avatarId: 3,
        level: 'beginner',
        xpTotal: 0,
      });
    });
  });

  // ── 2.4-INT-002: avatarId defaults to 1 (AC4) ────────────────────

  describe('2.4-INT-002: avatarId mặc định là 1 khi không truyền @P0', () => {
    it('nên dùng avatarId=1 khi dto không có avatarId', async () => {
      const { childProfileFactory } =
        await import('test/support/factories/child-profile.factory');
      const mockProfile = childProfileFactory({
        parentId: 'parent-uuid',
        displayName: 'Bé An',
        avatarId: 1,
      });

      const prismaMock = {
        childProfile: {
          count: jest.fn().mockResolvedValue(0),
          create: jest.fn().mockResolvedValue(mockProfile),
          findMany: jest.fn(),
        },
      };

      const service = await createChildrenService(prismaMock);
      await service.createChildProfile('parent-uuid', {
        displayName: 'Bé An',
        // avatarId omitted
      });

      expect(prismaMock.childProfile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            avatarId: 1,
          }),
        }),
      );
    });
  });

  // ── 2.4-INT-003: PROFILE_LIMIT_REACHED (AC7) ─────────────────────

  describe('2.4-INT-003: Profile limit enforcement — max 3 profiles (AC7) @P0', () => {
    it('nên throw khi parent đã có 3 child profiles', async () => {
      const prismaMock = {
        childProfile: {
          count: jest.fn().mockResolvedValue(3), // Đã đạt limit
          create: jest.fn(),
          findMany: jest.fn(),
        },
      };

      const service = await createChildrenService(prismaMock);

      await expect(
        service.createChildProfile('parent-uuid', {
          displayName: 'Profile thứ 4',
          avatarId: 1,
        }),
      ).rejects.toThrow();

      // create KHÔNG được gọi khi đã đạt limit
      expect(prismaMock.childProfile.create).not.toHaveBeenCalled();
    });

    it('nên throw UnprocessableEntityException với code PROFILE_LIMIT_REACHED khi count >= 3', async () => {
      const prismaMock = {
        childProfile: {
          count: jest.fn().mockResolvedValue(3),
          create: jest.fn(),
          findMany: jest.fn(),
        },
      };

      const service = await createChildrenService(prismaMock);

      try {
        await service.createChildProfile('parent-uuid', {
          displayName: 'Profile thứ 4',
          avatarId: 1,
        });
        fail('Phải throw error');
      } catch (error: any) {
        // Chấp nhận error chứa PROFILE_LIMIT_REACHED hoặc status 422
        expect(
          error.message?.includes('PROFILE_LIMIT_REACHED') ||
          error.response?.error?.includes('PROFILE_LIMIT_REACHED') ||
          error.status === 422,
        ).toBe(true);
      }
    });

    it('nên cho phép tạo khi count = 2 (còn 1 slot)', async () => {
      const { childProfileFactory } =
        await import('test/support/factories/child-profile.factory');
      const mockProfile = childProfileFactory({ parentId: 'parent-uuid' });

      const prismaMock = {
        childProfile: {
          count: jest.fn().mockResolvedValue(2), // Còn 1 slot
          create: jest.fn().mockResolvedValue(mockProfile),
          findMany: jest.fn(),
        },
      };

      const service = await createChildrenService(prismaMock);
      const result = await service.createChildProfile('parent-uuid', {
        displayName: 'Bé Ba',
        avatarId: 2,
      });

      expect(result).toBeDefined();
      expect(prismaMock.childProfile.create).toHaveBeenCalledTimes(1);
    });

    it('nên cho phép tạo khi count = 0 (parent chưa có profile nào)', async () => {
      const { childProfileFactory } =
        await import('test/support/factories/child-profile.factory');
      const mockProfile = childProfileFactory({ parentId: 'new-parent-uuid' });

      const prismaMock = {
        childProfile: {
          count: jest.fn().mockResolvedValue(0),
          create: jest.fn().mockResolvedValue(mockProfile),
          findMany: jest.fn(),
        },
      };

      const service = await createChildrenService(prismaMock);
      const result = await service.createChildProfile('new-parent-uuid', {
        displayName: 'Bé Đầu Tiên',
        avatarId: 1,
      });

      expect(result).toBeDefined();
    });
  });

  // ── 2.4-INT-004: Prisma failure propagation @P1 ──────────────────

  describe('2.4-INT-004: Xử lý Prisma failure @P1', () => {
    it('nên propagate error khi prisma create thất bại', async () => {
      const prismaMock = {
        childProfile: {
          count: jest.fn().mockResolvedValue(0),
          create: jest.fn().mockRejectedValue(new Error('Connection refused')),
          findMany: jest.fn(),
        },
      };

      const service = await createChildrenService(prismaMock);

      await expect(
        service.createChildProfile('parent-uuid', {
          displayName: 'Bé Nam',
          avatarId: 1,
        }),
      ).rejects.toThrow();
    });

    it('nên propagate error khi prisma count thất bại', async () => {
      const prismaMock = {
        childProfile: {
          count: jest.fn().mockRejectedValue(new Error('DB timeout')),
          create: jest.fn(),
          findMany: jest.fn(),
        },
      };

      const service = await createChildrenService(prismaMock);

      await expect(
        service.createChildProfile('parent-uuid', {
          displayName: 'Bé Nam',
          avatarId: 1,
        }),
      ).rejects.toThrow();
    });
  });

  // ── 2.4-INT-005: getChildProfiles() @P0 ─────────────────────────

  describe('2.4-INT-005: getChildProfiles() @P0', () => {
    it('nên trả về array profiles active của parent, sắp xếp theo createdAt asc', async () => {
      const { childProfileFactory } =
        await import('test/support/factories/child-profile.factory');
      const profiles = [
        childProfileFactory({ parentId: 'parent-uuid', displayName: 'Bé 1' }),
        childProfileFactory({ parentId: 'parent-uuid', displayName: 'Bé 2' }),
      ];

      const prismaMock = {
        childProfile: {
          count: jest.fn(),
          create: jest.fn(),
          findMany: jest.fn().mockResolvedValue(profiles),
        },
      };

      const service = await createChildrenService(prismaMock);
      const result = await service.getChildProfiles('parent-uuid');

      // Kiểm tra query đúng: filter parentId + isActive, order asc
      expect(prismaMock.childProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            parentId: 'parent-uuid',
            isActive: true,
          }),
          orderBy: { createdAt: 'asc' },
        }),
      );

      expect(result).toHaveLength(2);
      expect(result[0].displayName).toBe('Bé 1');
    });

    it('nên trả về mảng rỗng khi parent chưa có child profile', async () => {
      const prismaMock = {
        childProfile: {
          count: jest.fn(),
          create: jest.fn(),
          findMany: jest.fn().mockResolvedValue([]),
        },
      };

      const service = await createChildrenService(prismaMock);
      const result = await service.getChildProfiles('parent-uuid');

      expect(result).toEqual([]);
    });

    it('nên trả về profiles đúng parentId, không lẫn profiles của parent khác', async () => {
      const { childProfileFactory, childProfileFactoryMany } =
        await import('test/support/factories/child-profile.factory');
      const myProfiles = childProfileFactoryMany(2, {
        parentId: 'my-parent-uuid',
      });

      const prismaMock = {
        childProfile: {
          count: jest.fn(),
          create: jest.fn(),
          findMany: jest.fn().mockResolvedValue(myProfiles),
        },
      };

      const service = await createChildrenService(prismaMock);
      const result = await service.getChildProfiles('my-parent-uuid');

      // Tất cả profiles phải thuộc đúng parentId
      expect(result.every((p: any) => p.parentId === 'my-parent-uuid')).toBe(
        true,
      );
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 4: CONTROLLER GUARDS & DECORATORS
// ════════════════════════════════════════════════════════════════════

describe('Story 2.4: ChildrenController Guards @P0 @Unit', () => {
  it('2.4-INT-006: POST /api/v1/children KHÔNG có @Public() (yêu cầu JWT)', () => {
    const content = readFileSync(CHILDREN_CONTROLLER_PATH, 'utf-8');
    expect(content).not.toMatch(/@Public\(\)/);
  });

  it('2.4-INT-007: @Roles(PARENT) được enforce trên children endpoints', () => {
    const content = readFileSync(CHILDREN_CONTROLLER_PATH, 'utf-8');
    expect(content).toMatch(/@Roles\(.*PARENT.*\)/);
  });

  it('2.4-CTRL-001: POST endpoint trả về HTTP 201', async () => {
    const { HTTP_CODE_METADATA } = await import('@nestjs/common/constants');
    const { HttpStatus } = await import('@nestjs/common');
    const { ChildrenController } =
      await import('../../../src/modules/children/children.controller');

    const httpCode = Reflect.getMetadata(
      HTTP_CODE_METADATA,
      ChildrenController.prototype.createChildProfile,
    );
    expect(httpCode).toBe(HttpStatus.CREATED);
  });

  it('2.4-CTRL-002: GET /api/v1/children trả về HTTP 200', async () => {
    const { HTTP_CODE_METADATA } = await import('@nestjs/common/constants');
    const { HttpStatus } = await import('@nestjs/common');
    const { ChildrenController } =
      await import('../../../src/modules/children/children.controller');

    const httpCode = Reflect.getMetadata(
      HTTP_CODE_METADATA,
      ChildrenController.prototype.getChildProfiles,
    );
    // HTTP 200 là default — có thể undefined hoặc 200
    expect(httpCode === undefined || httpCode === HttpStatus.OK).toBe(true);
  });

  it('2.4-CTRL-003: POST dùng @CurrentUser() để lấy parentId (không hardcode)', () => {
    const content = readFileSync(CHILDREN_CONTROLLER_PATH, 'utf-8');
    expect(content).toMatch(/@CurrentUser\(\)/);
  });

  it('2.4-CTRL-004: controller dùng @UseGuards(AuthGuard, RolesGuard)', () => {
    const content = readFileSync(CHILDREN_CONTROLLER_PATH, 'utf-8');
    expect(content).toMatch(/@UseGuards/);
    expect(content).toMatch(/AuthGuard/);
    expect(content).toMatch(/RolesGuard/);
  });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 5: STATIC ANALYSIS
// ════════════════════════════════════════════════════════════════════

describe('Story 2.4: Static Analysis @P1 @Static', () => {
  // 2.4-STATIC-001: Service set default values (AC4)
  it('2.4-STATIC-001: service set level="beginner" và xpTotal=0 làm defaults (AC4)', () => {
    const content = readFileSync(CHILDREN_SERVICE_PATH, 'utf-8');
    expect(content).toMatch(/beginner/);
    // xpTotal: 0 phải xuất hiện trong data create
    expect(content).toMatch(/xpTotal.*0|xp_total.*0/);
  });

  // 2.4-STATIC-002: count check trước create (AC7 guard order)
  it('2.4-STATIC-002: service gọi count() TRƯỚC create() (profile limit guard — AC7)', () => {
    const content = readFileSync(CHILDREN_SERVICE_PATH, 'utf-8');
    const countIndex = content.indexOf('.count(');
    const createIndex = content.indexOf('.create(');
    expect(countIndex).toBeGreaterThan(-1);
    expect(createIndex).toBeGreaterThan(-1);
    // count phải xuất hiện trước create trong source
    expect(countIndex).toBeLessThan(createIndex);
  });

  // 2.4-STATIC-003: isActive filter trong getChildProfiles
  it('2.4-STATIC-003: getChildProfiles filter isActive: true (không trả soft-deleted profiles)', () => {
    const content = readFileSync(CHILDREN_SERVICE_PATH, 'utf-8');
    expect(content).toMatch(/isActive.*true|isActive:\s*true/);
  });

  // 2.4-STATIC-004: PrismaModule imported (không inject PrismaService trực tiếp)
  it('2.4-STATIC-004: ChildrenModule import PrismaModule (pattern từ ConsentModule)', () => {
    const content = readFileSync(CHILDREN_MODULE_PATH, 'utf-8');
    expect(content).toMatch(/PrismaModule/);
    expect(content).toMatch(/from.*prisma/i);
  });

  // 2.4-STATIC-005: Swagger decorators trên controller
  it('2.4-STATIC-005: controller có @ApiTags và @ApiOperation decorators', () => {
    const content = readFileSync(CHILDREN_CONTROLLER_PATH, 'utf-8');
    expect(content).toMatch(/@ApiTags/);
    expect(content).toMatch(/@ApiOperation/);
  });

  // 2.4-STATIC-006: ValidationPipe với whitelist trên POST
  it('2.4-STATIC-006: POST endpoint dùng ValidationPipe(whitelist: true, forbidNonWhitelisted: true)', () => {
    const content = readFileSync(CHILDREN_CONTROLLER_PATH, 'utf-8');
    expect(content).toMatch(/ValidationPipe/);
    expect(content).toMatch(/whitelist.*true/);
    expect(content).toMatch(/forbidNonWhitelisted.*true/);
  });

  // 2.4-STATIC-007: ResponseWrapperInterceptor KHÔNG wrap thủ công
  it('2.4-STATIC-007: service KHÔNG wrap response thủ công (ResponseWrapperInterceptor tự xử lý)', () => {
    const content = readFileSync(CHILDREN_SERVICE_PATH, 'utf-8');
    // Service trả về raw object, không wrap { data: ..., meta: ... }
    expect(content).not.toMatch(/return\s*\{\s*data:/);
  });

  // 2.4-STATIC-008: avatarId integer range annotation trong DTO
  it('2.4-STATIC-008: CreateChildDto có @Min(1) và @Max(6) trên avatarId', () => {
    const content = readFileSync(CREATE_CHILD_DTO_PATH, 'utf-8');
    expect(content).toMatch(/@Min\(1\)/);
    expect(content).toMatch(/@Max\(6\)/);
    expect(content).toMatch(/@IsInt\(\)/);
  });

  // 2.4-STATIC-009: displayName constraints trong DTO
  it('2.4-STATIC-009: CreateChildDto có @IsNotEmpty() và @MaxLength(20) trên displayName', () => {
    const content = readFileSync(CREATE_CHILD_DTO_PATH, 'utf-8');
    expect(content).toMatch(/@IsString\(\)/);
    expect(content).toMatch(/@IsNotEmpty\(\)/);
    expect(content).toMatch(/@MaxLength\(20\)/);
  });
});
