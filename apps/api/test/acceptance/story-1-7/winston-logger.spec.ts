/**
 * ATDD Tests - Story 1.7: CI/CD Pipeline - Winston Logger Integration
 * Test IDs: 1.7-UNIT-001 through 1.7-UNIT-012
 * Priority: P0 (Critical — Observability)
 * Status: 🔴 RED (failing before implementation)
 *
 * These tests validate that Winston logger is properly configured in NestJS API
 * and that LoggingInterceptor is updated to use Winston (replacing NestJS default Logger).
 *
 * AC#8: GCP Cloud Logging (Winston) is configured in NestJS
 *
 * Architecture requirements:
 * - Development: colorized console output
 * - Production: GCP Cloud Logging structured JSON (via @google-cloud/logging-winston)
 * - LoggingInterceptor must use Winston logger, NOT NestJS Logger
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// __dirname = apps/api/test/acceptance/story-1-7/
const API_SRC_DIR = join(__dirname, '../../../src');
const LOGGER_CONFIG_PATH = join(API_SRC_DIR, 'config/logger.config.ts');
const LOGGING_INTERCEPTOR_PATH = join(
  API_SRC_DIR,
  'common/interceptors/logging.interceptor.ts',
);
const APP_MODULE_PATH = join(API_SRC_DIR, 'app.module.ts');

describe('Story 1.7: Winston Logger Integration (NestJS) @P0 @Unit', () => {
  // =========================================================================
  // 1.7-UNIT-001: Logger config file existence and location
  // =========================================================================
  describe('1.7-UNIT-001: Winston Logger Config File', () => {
    it('should have logger.config.ts at apps/api/src/config/', () => {
      // RED: src/config/logger.config.ts does not exist yet
      expect(existsSync(LOGGER_CONFIG_PATH)).toBe(true);
    });

    it('should export a loggerConfig function from logger.config.ts', () => {
      // RED: logger.config.ts does not exist yet

      const module = require(LOGGER_CONFIG_PATH.replace('.ts', ''));
      expect(typeof module.loggerConfig).toBe('function');
    });
  });

  // =========================================================================
  // 1.7-UNIT-002: loggerConfig function returns correct WinstonModuleOptions
  // =========================================================================
  describe('1.7-UNIT-002: loggerConfig() Development Mode', () => {
    let originalEnv: string | undefined;

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should return winston options with console transport in development', () => {
      // RED: logger.config.ts does not exist yet
      process.env.NODE_ENV = 'development';

      const { loggerConfig } = require(LOGGER_CONFIG_PATH.replace('.ts', ''));
      const options = loggerConfig();

      expect(options).toBeDefined();
      expect(options.transports).toBeDefined();
      expect(Array.isArray(options.transports)).toBe(true);
      expect(options.transports.length).toBeGreaterThan(0);
    });

    it('should set log level to debug in development', () => {
      // RED: logger.config.ts does not exist yet
      process.env.NODE_ENV = 'development';

      const { loggerConfig } = require(LOGGER_CONFIG_PATH.replace('.ts', ''));
      const options = loggerConfig();

      expect(options.level).toBe('debug');
    });
  });

  // =========================================================================
  // 1.7-UNIT-003: loggerConfig production mode
  // =========================================================================
  describe('1.7-UNIT-003: loggerConfig() Production Mode', () => {
    let originalEnv: string | undefined;

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should set log level to info in production', () => {
      // RED: logger.config.ts does not exist yet
      process.env.NODE_ENV = 'production';

      const { loggerConfig } = require(LOGGER_CONFIG_PATH.replace('.ts', ''));
      const options = loggerConfig();

      expect(options.level).toBe('info');
    });

    it('should return winston options with at least one transport in production', () => {
      // RED: logger.config.ts does not exist yet
      process.env.NODE_ENV = 'production';

      const { loggerConfig } = require(LOGGER_CONFIG_PATH.replace('.ts', ''));
      const options = loggerConfig();

      expect(options.transports).toBeDefined();
      expect(Array.isArray(options.transports)).toBe(true);
      expect(options.transports.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 1.7-UNIT-004: logger.config.ts uses winston (not NestJS Logger)
  // =========================================================================
  describe('1.7-UNIT-004: logger.config.ts Uses Winston Package', () => {
    it('should import from winston package (not @nestjs/common Logger)', () => {
      // RED: logger.config.ts does not exist yet
      const content = readFileSync(LOGGER_CONFIG_PATH, 'utf-8');

      // Must use winston
      expect(content).toMatch(/from\s+['"]winston['"]/);
      // Must NOT use NestJS Logger for transport configuration
      expect(content).not.toMatch(/from\s+['"]@nestjs\/common['"]/);
    });

    it('should import nest-winston WinstonModuleOptions type', () => {
      // RED: logger.config.ts does not exist yet
      const content = readFileSync(LOGGER_CONFIG_PATH, 'utf-8');

      // Accepts: WinstonModuleOptions, WinstonModuleAsyncOptions, etc.
      expect(content).toMatch(/nest-winston|WinstonModule/);
    });
  });

  // =========================================================================
  // 1.7-UNIT-005: LoggingInterceptor updated to use Winston
  // =========================================================================
  describe('1.7-UNIT-005: LoggingInterceptor Uses Winston (Not NestJS Logger)', () => {
    it('should NOT import Logger from @nestjs/common in logging.interceptor.ts', () => {
      // RED: LoggingInterceptor still uses NestJS default Logger
      // After Story 1.7: must import WINSTON_MODULE_PROVIDER or use NestJS Logger via Winston
      const content = readFileSync(LOGGING_INTERCEPTOR_PATH, 'utf-8');

      // Current implementation uses: import { Logger } from '@nestjs/common';
      // After Story 1.7: should NOT use NestJS native Logger directly
      // Acceptable alternatives:
      //   1. Inject WINSTON_MODULE_PROVIDER from nest-winston
      //   2. Use LoggerService interface backed by Winston
      const usesNestJSLoggerDirectly =
        content.includes("import { Logger } from '@nestjs/common'") ||
        content.includes('new Logger(');

      expect(usesNestJSLoggerDirectly).toBe(false);
    });

    it('should use winston-compatible logger in LoggingInterceptor', () => {
      // RED: logging.interceptor.ts still uses NestJS Logger
      const content = readFileSync(LOGGING_INTERCEPTOR_PATH, 'utf-8');

      // After update: should use Winston via nest-winston injection OR Logger service
      // Accepts: WINSTON_MODULE_PROVIDER, Inject(WINSTON_MODULE_PROVIDER), LoggerService
      const usesWinstonApproach =
        content.includes('WINSTON_MODULE_PROVIDER') ||
        content.includes('nest-winston') ||
        content.includes('LoggerService') ||
        content.includes('WinstonLogger');

      expect(usesWinstonApproach).toBe(true);
    });
  });

  // =========================================================================
  // 1.7-UNIT-006: AppModule integrates WinstonModule
  // =========================================================================
  describe('1.7-UNIT-006: AppModule Registers WinstonModule (AC#8)', () => {
    it('should import WinstonModule in app.module.ts', () => {
      // RED: app.module.ts does not register WinstonModule yet
      const content = readFileSync(APP_MODULE_PATH, 'utf-8');

      // Accepts: WinstonModule.forRoot(), WinstonModule.forRootAsync()
      expect(content).toMatch(/WinstonModule/);
    });

    it('should configure WinstonModule with loggerConfig', () => {
      // RED: app.module.ts does not use loggerConfig yet
      const content = readFileSync(APP_MODULE_PATH, 'utf-8');

      // Must use the loggerConfig factory from src/config/logger.config.ts
      const usesLoggerConfig =
        content.includes('loggerConfig') || content.includes('logger.config');

      expect(usesLoggerConfig).toBe(true);
    });
  });

  // =========================================================================
  // 1.7-UNIT-007: Winston dependency in package.json
  // =========================================================================
  describe('1.7-UNIT-007: Winston Dependencies in package.json', () => {
    let packageJson: Record<string, any>;

    beforeEach(() => {
      const pkgPath = join(__dirname, '../../../package.json');
      packageJson = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    });

    it('should have winston in dependencies', () => {
      // RED: winston is not in apps/api/package.json yet
      expect(packageJson.dependencies?.['winston']).toBeDefined();
      // Should be ^3.x.x
      expect(packageJson.dependencies['winston']).toMatch(/^\^3\./);
    });

    it('should have nest-winston in dependencies', () => {
      // RED: nest-winston is not in apps/api/package.json yet
      expect(packageJson.dependencies?.['nest-winston']).toBeDefined();
    });

    it('should have @google-cloud/logging-winston in dependencies', () => {
      // RED: @google-cloud/logging-winston is not in apps/api/package.json yet
      // Required for production Cloud Logging transport
      expect(
        packageJson.dependencies?.['@google-cloud/logging-winston'],
      ).toBeDefined();
    });
  });

  // =========================================================================
  // 1.7-UNIT-008: AI Worker logger config file
  // =========================================================================
  describe('1.7-UNIT-008: AI Worker Winston Logger Config', () => {
    const AI_WORKER_LOGGER_PATH = join(
      __dirname,
      '../../../../ai-worker/src/config/logger.config.ts',
    );

    it('should have logger.config.ts at apps/ai-worker/src/config/', () => {
      // RED: apps/ai-worker/src/config/logger.config.ts does not exist yet
      expect(existsSync(AI_WORKER_LOGGER_PATH)).toBe(true);
    });

    it('should export a loggerConfig function from ai-worker logger config', () => {
      // RED: ai-worker logger.config.ts does not exist yet

      const module = require(AI_WORKER_LOGGER_PATH.replace('.ts', ''));
      expect(typeof module.loggerConfig).toBe('function');
    });
  });

  // =========================================================================
  // 1.7-UNIT-009: Logger config source file quality checks
  // =========================================================================
  describe('1.7-UNIT-009: Logger Config Code Quality', () => {
    it('logger.config.ts should be under 50 lines (focused module)', () => {
      // RED: logger.config.ts does not exist yet
      const content = readFileSync(LOGGER_CONFIG_PATH, 'utf-8');
      const lineCount = content.split('\n').length;

      // Logger config should be focused and concise
      expect(lineCount).toBeLessThanOrEqual(50);
    });

    it('logger.config.ts should NOT hardcode GCP project ID', () => {
      // RED: logger.config.ts does not exist yet
      // GCP project ID must come from environment variable
      const content = readFileSync(LOGGER_CONFIG_PATH, 'utf-8');

      // Should use process.env.GCP_PROJECT_ID, not hardcoded value
      expect(content).not.toMatch(/'english-pro-prod'/);
      expect(content).not.toMatch(/'english-pro-staging'/);
    });
  });
});
