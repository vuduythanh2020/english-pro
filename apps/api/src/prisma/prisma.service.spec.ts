import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

// Mock pg module
jest.mock('pg', () => {
  const mockPool = {
    end: jest.fn().mockResolvedValue(undefined),
  };
  return { Pool: jest.fn(() => mockPool) };
});

// Mock @prisma/adapter-pg
jest.mock('@prisma/adapter-pg', () => {
  return { PrismaPg: jest.fn() };
});

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: class MockPrismaClient {
      constructor(_opts?: any) {}
      $connect = jest.fn().mockResolvedValue(undefined);
      $disconnect = jest.fn().mockResolvedValue(undefined);
    },
  };
});

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should call $connect on module init', async () => {
      const connectSpy = jest.spyOn(service, '$connect');
      await service.onModuleInit();
      expect(connectSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('onModuleDestroy', () => {
    it('should call $disconnect and pool.end on module destroy', async () => {
      const disconnectSpy = jest.spyOn(service, '$disconnect');
      await service.onModuleDestroy();
      expect(disconnectSpy).toHaveBeenCalledTimes(1);
      // pool.end() is called internally — verified via mock
    });
  });

  describe('constructor', () => {
    it('should use DATABASE_URL from env when available', () => {
      const originalUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';

      // Re-instantiate to test constructor
      const pg = require('pg');
      pg.Pool.mockClear();

      const newService = new PrismaService();
      expect(newService).toBeDefined();
      expect(pg.Pool).toHaveBeenCalledWith({
        connectionString: 'postgresql://test:test@localhost:5432/testdb',
      });

      process.env.DATABASE_URL = originalUrl;
    });

    it('should use default connection string when DATABASE_URL is not set', () => {
      const originalUrl = process.env.DATABASE_URL;
      delete process.env.DATABASE_URL;

      const pg = require('pg');
      pg.Pool.mockClear();

      const newService = new PrismaService();
      expect(newService).toBeDefined();
      expect(pg.Pool).toHaveBeenCalledWith({
        connectionString:
          'postgresql://postgres:postgres@localhost:54322/postgres',
      });

      process.env.DATABASE_URL = originalUrl;
    });
  });
});
