/**
 * Story 2.3: Parental Consent & Age Declaration Flow
 * ATDD Tests — ConsentModule implementation verification
 *
 * AC coverage:
 *   AC3 — Consent recording (POST /api/v1/consent)
 *   AC6 — Returning parent (GET /api/v1/consent)
 *
 * Pattern follows Story 2.2 acceptance test conventions.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// ── Path constants ─────────────────────────────────────────────────
const CONSENT_MODULE_DIR = join(__dirname, '../../../src/modules/consent');
const CONSENT_CONTROLLER_PATH = join(
  CONSENT_MODULE_DIR,
  'consent.controller.ts',
);
const CONSENT_SERVICE_PATH = join(CONSENT_MODULE_DIR, 'consent.service.ts');
const CONSENT_MODULE_PATH = join(CONSENT_MODULE_DIR, 'consent.module.ts');
const CREATE_CONSENT_DTO_PATH = join(
  CONSENT_MODULE_DIR,
  'dto/create-consent.dto.ts',
);
const APP_MODULE_PATH = join(__dirname, '../../../src/app.module.ts');

// ════════════════════════════════════════════════════════════════════
// SECTION 1: STRUCTURAL PREREQUISITES
// ════════════════════════════════════════════════════════════════════

describe('Story 2.3: ConsentModule Structure @P0 @Structure', () => {
  it('2.3-STRUCT-001: consent module, controller, service, dto files exist', () => {
    expect(existsSync(CONSENT_MODULE_PATH)).toBe(true);
    expect(existsSync(CONSENT_CONTROLLER_PATH)).toBe(true);
    expect(existsSync(CONSENT_SERVICE_PATH)).toBe(true);
    expect(existsSync(CREATE_CONSENT_DTO_PATH)).toBe(true);
  });

  it('2.3-STRUCT-002: ConsentModule is registered in AppModule', () => {
    expect(existsSync(APP_MODULE_PATH)).toBe(true);
    const content = readFileSync(APP_MODULE_PATH, 'utf-8');
    expect(content).toMatch(/ConsentModule/);
  });

  it('2.3-STRUCT-003: controller exposes POST and GET /api/v1/consent', () => {
    const content = readFileSync(CONSENT_CONTROLLER_PATH, 'utf-8');
    expect(content).toMatch(/['"]api\/v1\/consent['"]/);
    expect(content).toMatch(/@Post/);
    expect(content).toMatch(/@Get/);
  });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 2: DTO VALIDATION
// ════════════════════════════════════════════════════════════════════

describe('Story 2.3: CreateConsentDto Validation @P0 @Unit', () => {
  async function validateConsentDto(data: Record<string, unknown>) {
    const { CreateConsentDto } =
      await import('../../../src/modules/consent/dto/create-consent.dto');
    const { validate } = await import('class-validator');
    const { plainToInstance } = await import('class-transformer');

    const dto = plainToInstance(CreateConsentDto, data);
    return validate(dto as object);
  }

  it('2.3-UNIT-001: valid dto (childAge=12, consentVersion="1.0") passes', async () => {
    const errors = await validateConsentDto({
      childAge: 12,
      consentVersion: '1.0',
    });
    expect(errors).toHaveLength(0);
  });

  it('2.3-UNIT-002: missing childAge → ValidationError', async () => {
    const errors = await validateConsentDto({ consentVersion: '1.0' });
    const ageError = errors.find((e) => e.property === 'childAge');
    expect(ageError).toBeDefined();
  });

  it('2.3-UNIT-003: childAge < 1 → ValidationError', async () => {
    const errors = await validateConsentDto({
      childAge: 0,
      consentVersion: '1.0',
    });
    const ageError = errors.find((e) => e.property === 'childAge');
    expect(ageError).toBeDefined();
  });

  it('2.3-UNIT-003b: childAge > 18 → ValidationError', async () => {
    const errors = await validateConsentDto({
      childAge: 19,
      consentVersion: '1.0',
    });
    const ageError = errors.find((e) => e.property === 'childAge');
    expect(ageError).toBeDefined();
  });

  it('2.3-UNIT-003c: childAge non-integer → ValidationError', async () => {
    const errors = await validateConsentDto({
      childAge: 12.5,
      consentVersion: '1.0',
    });
    const ageError = errors.find((e) => e.property === 'childAge');
    expect(ageError).toBeDefined();
  });

  it('2.3-UNIT-004: consentVersion empty → ValidationError', async () => {
    const errors = await validateConsentDto({
      childAge: 12,
      consentVersion: '',
    });
    const versionError = errors.find((e) => e.property === 'consentVersion');
    expect(versionError).toBeDefined();
  });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 3: CONSENT SERVICE LOGIC (AC3, AC6)
// ════════════════════════════════════════════════════════════════════

describe('Story 2.3: ConsentService @P0 @Integration', () => {
  async function createConsentService(prismaMock: {
    parentalConsent: { upsert: jest.Mock; findUnique: jest.Mock };
  }) {
    const { ConsentService } =
      await import('../../../src/modules/consent/consent.service');
    const loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };
    return new ConsentService(
      prismaMock as unknown as never,
      loggerMock as unknown as never,
    );
  }

  // 2.3-INT-001: grantConsent upserts with correct fields (AC3)
  describe('2.3-INT-001: grantConsent() @P0', () => {
    it('should upsert consent record with GRANTED status, timestamp, and version', async () => {
      const mockUpsertResult = {
        id: 'consent-uuid',
        parentId: 'parent-uuid',
        status: 'GRANTED',
        consentVersion: '1.0',
        consentTimestamp: new Date('2026-04-11T00:00:00Z'),
        ipAddress: '192.168.1.1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const prismaMock = {
        parentalConsent: {
          upsert: jest.fn().mockResolvedValue(mockUpsertResult),
          findUnique: jest.fn(),
        },
      };
      const service = await createConsentService(prismaMock);

      const result = await service.grantConsent(
        'parent-uuid',
        { childAge: 12, consentVersion: '1.0' },
        '192.168.1.1',
      );

      expect(result).toEqual({
        id: 'consent-uuid',
        status: 'GRANTED',
        consentVersion: '1.0',
        consentTimestamp: mockUpsertResult.consentTimestamp,
      });

      expect(prismaMock.parentalConsent.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { parentId: 'parent-uuid' },
          create: expect.objectContaining({
            parentId: 'parent-uuid',
            status: 'GRANTED',
            consentVersion: '1.0',
            ipAddress: '192.168.1.1',
          }),
          update: expect.objectContaining({
            status: 'GRANTED',
            consentVersion: '1.0',
            ipAddress: '192.168.1.1',
          }),
        }),
      );
    });
  });

  // 2.3-INT-003: getConsent returns null or record
  describe('2.3-INT-003: getConsent() @P0', () => {
    it('should return consent record when found', async () => {
      const mockRecord = {
        id: 'consent-uuid',
        parentId: 'parent-uuid',
        status: 'GRANTED',
        consentVersion: '1.0',
        consentTimestamp: new Date(),
        ipAddress: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const prismaMock = {
        parentalConsent: {
          upsert: jest.fn(),
          findUnique: jest.fn().mockResolvedValue(mockRecord),
        },
      };
      const service = await createConsentService(prismaMock);

      const result = await service.getConsent('parent-uuid');
      expect(result).not.toBeNull();
      expect(result?.status).toBe('GRANTED');
    });

    it('should return null when no consent record exists', async () => {
      const prismaMock = {
        parentalConsent: {
          upsert: jest.fn(),
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };
      const service = await createConsentService(prismaMock);

      const result = await service.getConsent('parent-uuid');
      expect(result).toBeNull();
    });
  });

  // 2.3-INT-004: Prisma failure → HttpException 500
  describe('2.3-INT-004: Prisma Failure @P1', () => {
    it('should throw 500 on prisma error in grantConsent', async () => {
      const prismaMock = {
        parentalConsent: {
          upsert: jest.fn().mockRejectedValue(new Error('Connection refused')),
          findUnique: jest.fn(),
        },
      };
      const service = await createConsentService(prismaMock);

      await expect(
        service.grantConsent('parent-uuid', {
          childAge: 12,
          consentVersion: '1.0',
        }),
      ).rejects.toThrow();
    });

    it('should throw 500 on prisma error in getConsent', async () => {
      const prismaMock = {
        parentalConsent: {
          upsert: jest.fn(),
          findUnique: jest
            .fn()
            .mockRejectedValue(new Error('Connection refused')),
        },
      };
      const service = await createConsentService(prismaMock);

      await expect(service.getConsent('parent-uuid')).rejects.toThrow();
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 4: CONTROLLER GUARDS & DECORATORS
// ════════════════════════════════════════════════════════════════════

describe('Story 2.3: ConsentController Guards @P0 @Unit', () => {
  it('2.3-INT-005: POST /api/v1/consent is NOT @Public() (requires JWT)', () => {
    const content = readFileSync(CONSENT_CONTROLLER_PATH, 'utf-8');
    // Controller should NOT use @Public() decorator
    expect(content).not.toMatch(/@Public\(\)/);
  });

  it('2.3-INT-007: @Roles(PARENT) enforced on consent endpoints', () => {
    const content = readFileSync(CONSENT_CONTROLLER_PATH, 'utf-8');
    expect(content).toMatch(/@Roles\(.*PARENT.*\)/);
  });

  it('2.3-CTRL-001: POST endpoint returns HTTP 201', async () => {
    const { HTTP_CODE_METADATA } = await import('@nestjs/common/constants');
    const { HttpStatus } = await import('@nestjs/common');
    const { ConsentController } =
      await import('../../../src/modules/consent/consent.controller');

    const httpCode = Reflect.getMetadata(
      HTTP_CODE_METADATA,
      ConsentController.prototype.grantConsent,
    );
    expect(httpCode).toBe(HttpStatus.CREATED);
  });

  it('2.3-CTRL-002: GET endpoint returns HTTP 200', async () => {
    const { HTTP_CODE_METADATA } = await import('@nestjs/common/constants');
    const { HttpStatus } = await import('@nestjs/common');
    const { ConsentController } =
      await import('../../../src/modules/consent/consent.controller');

    const httpCode = Reflect.getMetadata(
      HTTP_CODE_METADATA,
      ConsentController.prototype.getConsent,
    );
    expect(httpCode).toBe(HttpStatus.OK);
  });
});

// ════════════════════════════════════════════════════════════════════
// SECTION 5: STATIC ANALYSIS
// ════════════════════════════════════════════════════════════════════

describe('Story 2.3: Static Analysis @P1 @Static', () => {
  it('2.3-STATIC-002: ip_address stored in upsert call (AC3)', () => {
    const content = readFileSync(CONSENT_SERVICE_PATH, 'utf-8');
    expect(content).toMatch(/ipAddress/);
    expect(content).toMatch(/upsert/);
  });

  it('2.3-STATIC-003: consentVersion persisted in both create and update', () => {
    const content = readFileSync(CONSENT_SERVICE_PATH, 'utf-8');
    // Both create and update blocks should include consentVersion
    const createMatch = content.match(/create:\s*\{[\s\S]*?consentVersion/);
    const updateMatch = content.match(/update:\s*\{[\s\S]*?consentVersion/);
    expect(createMatch).not.toBeNull();
    expect(updateMatch).not.toBeNull();
  });

  // F-5: IP validation in controller
  it('2.3-STATIC-004: controller uses IP_PATTERN validation (F-5)', () => {
    const content = readFileSync(CONSENT_CONTROLLER_PATH, 'utf-8');
    expect(content).toMatch(/IP_PATTERN/);
    expect(content).toMatch(/extractIpAddress/);
  });

  // F-2: ConsentStatus enum imported from @prisma/client
  it('2.3-STATIC-005: service uses ConsentStatus enum not string literal (F-2)', () => {
    const content = readFileSync(CONSENT_SERVICE_PATH, 'utf-8');
    expect(content).toMatch(/from '@prisma\/client'/);
    expect(content).toMatch(/ConsentStatus\.GRANTED/);
    // Must NOT use bare string literal 'GRANTED' in upsert
    const upsertBlock = content.match(/upsert\([\s\S]*?\)\s*;/)?.[0] ?? '';
    expect(upsertBlock).not.toMatch(/status:\s*'GRANTED'/);
  });
});
