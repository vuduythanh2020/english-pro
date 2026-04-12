import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ConsentService } from './consent.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ConsentService', () => {
  let service: ConsentService;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  const mockPrisma = {
    parentalConsent: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ConsentService>(ConsentService);
    jest.clearAllMocks();
  });

  describe('grantConsent', () => {
    const parentId = 'parent-uuid-123';
    const dto = { childAge: 12, consentVersion: '1.0' };

    it('should create a new consent record (happy path)', async () => {
      const mockRecord = {
        id: 'consent-uuid',
        parentId,
        status: 'GRANTED',
        consentVersion: '1.0',
        consentTimestamp: new Date('2026-04-11T00:00:00Z'),
        ipAddress: '127.0.0.1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.parentalConsent.upsert.mockResolvedValue(mockRecord);

      const result = await service.grantConsent(parentId, dto, '127.0.0.1');

      expect(result).toEqual({
        id: 'consent-uuid',
        status: 'GRANTED',
        consentVersion: '1.0',
        consentTimestamp: mockRecord.consentTimestamp,
      });
      expect(mockPrisma.parentalConsent.upsert).toHaveBeenCalledWith({
        where: { parentId },
        create: expect.objectContaining({
          parentId,
          status: 'GRANTED',
          consentVersion: '1.0',
          ipAddress: '127.0.0.1',
        }),
        update: expect.objectContaining({
          status: 'GRANTED',
          consentVersion: '1.0',
          ipAddress: '127.0.0.1',
        }),
      });
    });

    it('should upsert when consent already exists (re-grant)', async () => {
      const mockRecord = {
        id: 'consent-uuid',
        parentId,
        status: 'GRANTED',
        consentVersion: '1.0',
        consentTimestamp: new Date(),
        ipAddress: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.parentalConsent.upsert.mockResolvedValue(mockRecord);

      const result = await service.grantConsent(parentId, dto);

      expect(result.status).toBe('GRANTED');
      expect(mockPrisma.parentalConsent.upsert).toHaveBeenCalledTimes(1);
    });

    it('should handle null ipAddress when not provided', async () => {
      const mockRecord = {
        id: 'consent-uuid',
        parentId,
        status: 'GRANTED',
        consentVersion: '1.0',
        consentTimestamp: new Date(),
        ipAddress: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.parentalConsent.upsert.mockResolvedValue(mockRecord);

      await service.grantConsent(parentId, dto);

      expect(mockPrisma.parentalConsent.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ ipAddress: null }),
          update: expect.objectContaining({ ipAddress: null }),
        }),
      );
    });

    it('should throw 500 on Prisma error', async () => {
      mockPrisma.parentalConsent.upsert.mockRejectedValue(
        new Error('Connection refused'),
      );

      await expect(service.grantConsent(parentId, dto)).rejects.toThrow(
        new HttpException(
          'Không thể lưu consent. Vui lòng thử lại.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getConsent', () => {
    const parentId = 'parent-uuid-123';

    it('should return consent record when found', async () => {
      const mockRecord = {
        id: 'consent-uuid',
        parentId,
        status: 'GRANTED',
        consentVersion: '1.0',
        consentTimestamp: new Date('2026-04-11T00:00:00Z'),
        ipAddress: '127.0.0.1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.parentalConsent.findUnique.mockResolvedValue(mockRecord);

      const result = await service.getConsent(parentId);

      expect(result).toEqual({
        id: 'consent-uuid',
        status: 'GRANTED',
        consentVersion: '1.0',
        consentTimestamp: mockRecord.consentTimestamp,
      });
    });

    it('should return null when no consent record exists', async () => {
      mockPrisma.parentalConsent.findUnique.mockResolvedValue(null);

      const result = await service.getConsent(parentId);

      expect(result).toBeNull();
    });

    it('should throw 500 on Prisma error', async () => {
      mockPrisma.parentalConsent.findUnique.mockRejectedValue(
        new Error('Connection refused'),
      );

      await expect(service.getConsent(parentId)).rejects.toThrow(
        new HttpException(
          'Không thể truy vấn consent. Vui lòng thử lại.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
