/**
 * ATDD Tests - Story 1.3: PrismaService Integration
 * Test IDs: 1.3-INT-001, 1.3-INT-003, 1.3-INT-004
 * Priority: P0/P1
 * Status: 🔴 RED → 🟢 GREEN (partially, DB-dependent tests need running DB)
 *
 * These tests validate PrismaService as a NestJS injectable,
 * seed script functionality, and database health check.
 *
 * Tests marked @DB require a running PostgreSQL database.
 */

import { Test, TestingModule } from '@nestjs/testing';

// Path helpers - __dirname = apps/api/test/acceptance/story-1-3/
// Up 3 levels = apps/api/

describe('Story 1.3: PrismaService Integration @P0 @Integration', () => {
  // 1.3-INT-001: PrismaService is injectable in NestJS
  describe('1.3-INT-001: PrismaService NestJS Injectable', () => {
    let module: TestingModule;

    afterAll(async () => {
      if (module) {
        await module.close();
      }
    });

    it('should import PrismaModule without errors', async () => {
      const { PrismaModule } = require('../../../src/prisma/prisma.module');

      module = await Test.createTestingModule({
        imports: [PrismaModule],
      }).compile();

      expect(module).toBeDefined();
    });

    it('should resolve PrismaService from DI container', async () => {
      const { PrismaModule } = require('../../../src/prisma/prisma.module');
      const { PrismaService } = require('../../../src/prisma/prisma.service');

      module = await Test.createTestingModule({
        imports: [PrismaModule],
      }).compile();

      const prismaService = module.get(PrismaService);
      expect(prismaService).toBeDefined();
      // Use constructor name check to avoid module resolution instanceof issues
      expect(prismaService.constructor.name).toBe('PrismaService');
    });

    it('should expose PrismaService as exportable provider', async () => {
      const { PrismaModule } = require('../../../src/prisma/prisma.module');
      const { PrismaService } = require('../../../src/prisma/prisma.service');

      module = await Test.createTestingModule({
        imports: [PrismaModule],
      }).compile();

      const prismaService = module.get(PrismaService);
      expect(prismaService).toBeDefined();
    });

    it('should implement onModuleInit lifecycle hook', () => {
      const { PrismaService } = require('../../../src/prisma/prisma.service');

      const prismaService = new PrismaService();
      expect(typeof prismaService.onModuleInit).toBe('function');
    });

    it('should implement onModuleDestroy lifecycle hook', () => {
      const { PrismaService } = require('../../../src/prisma/prisma.service');

      const prismaService = new PrismaService();
      expect(typeof prismaService.onModuleDestroy).toBe('function');
    });
  });

  // 1.3-INT-003: Seed script populates test data
  describe('1.3-INT-003: Seed Script @P1', () => {
    it('should have a seed script defined in package.json prisma section', () => {
      const { readFileSync } = require('fs');
      const { join } = require('path');

      const packageJson = JSON.parse(
        readFileSync(join(__dirname, '../../../package.json'), 'utf-8'),
      );

      // package.json should have prisma.seed defined
      expect(packageJson.prisma).toBeDefined();
      expect(packageJson.prisma.seed).toBeDefined();
      expect(typeof packageJson.prisma.seed).toBe('string');
    });

    it('should have a seed file that exists', () => {
      const { existsSync } = require('fs');
      const { join } = require('path');

      // Check common seed file locations
      const seedPaths = [
        join(__dirname, '../../../prisma/seed.ts'),
        join(__dirname, '../../../prisma/seed.js'),
        join(__dirname, '../../../src/prisma/seed.ts'),
      ];

      const seedExists = seedPaths.some((p: string) => existsSync(p));
      expect(seedExists).toBe(true);
    });

    // @DB - These tests require a running database with seeded data
    it('should seed at least one parent user', async () => {
      const { PrismaService } = require('../../../src/prisma/prisma.service');

      const prisma = new PrismaService();
      try {
        await prisma.onModuleInit();
        const parentCount = await prisma.parent.count();
        expect(parentCount).toBeGreaterThanOrEqual(1);
      } finally {
        await prisma.onModuleDestroy();
      }
    });

    it('should seed at least one child profile', async () => {
      const { PrismaService } = require('../../../src/prisma/prisma.service');

      const prisma = new PrismaService();
      try {
        await prisma.onModuleInit();
        const childCount = await prisma.childProfile.count();
        expect(childCount).toBeGreaterThanOrEqual(1);
      } finally {
        await prisma.onModuleDestroy();
      }
    });
  });

  // 1.3-INT-004: Database connection health check
  describe('1.3-INT-004: Database Health Check @P1', () => {
    // @DB - These tests require a running database
    it('should connect to database successfully', async () => {
      const { PrismaService } = require('../../../src/prisma/prisma.service');

      const prisma = new PrismaService();
      try {
        await prisma.onModuleInit();
      } finally {
        await prisma.onModuleDestroy();
      }
    });

    it('should execute raw query for health check', async () => {
      const { PrismaService } = require('../../../src/prisma/prisma.service');

      const prisma = new PrismaService();
      await prisma.onModuleInit();

      try {
        const result = await prisma.$queryRaw`SELECT 1 as health`;
        expect(result).toBeDefined();
        expect(result[0].health).toBe(1);
      } finally {
        await prisma.onModuleDestroy();
      }
    });

    it('should disconnect gracefully on module destroy', async () => {
      const { PrismaService } = require('../../../src/prisma/prisma.service');

      const prisma = new PrismaService();
      await prisma.onModuleInit();

      await expect(prisma.onModuleDestroy()).resolves.not.toThrow();
    });
  });
});
