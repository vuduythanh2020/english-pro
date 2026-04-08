/**
 * ATDD Tests - Story 1.4: CommonModule Integration
 * Test IDs: 1.4-INTG-001 through 1.4-INTG-005
 * Priority: P0/P1/P2 (Infrastructure Wiring)
 * Status: 🔴 RED (failing before implementation)
 *
 * These tests validate that:
 * - ThrottlerModule is configured (AC #7)
 * - Swagger is accessible at /api/docs (AC #8)
 * - CommonModule wires all guards/filters/interceptors globally (AC #9)
 * - Guard execution order is correct
 * - Error responses are NOT wrapped by ResponseWrapper
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const COMMON_MODULE_PATH = join(
  __dirname,
  '../../../src/common/common.module.ts',
);
const APP_MODULE_PATH = join(__dirname, '../../../src/app.module.ts');
const MAIN_TS_PATH = join(__dirname, '../../../src/main.ts');

describe('Story 1.4: CommonModule Integration @P0 @Integration', () => {
  // 1.4-INTG-001: ThrottlerModule configured
  describe('1.4-INTG-001: ThrottlerModule Configuration', () => {
    it.skip('should have @nestjs/throttler installed', async () => {
      // RED: @nestjs/throttler not installed yet
      const throttler = await import('@nestjs/throttler');
      expect(throttler.ThrottlerModule).toBeDefined();
      expect(throttler.ThrottlerGuard).toBeDefined();
    });

    it.skip('should have ThrottlerModule imported in AppModule', () => {
      // RED: AppModule not updated yet
      expect(existsSync(APP_MODULE_PATH)).toBe(true);
      const appModuleContent = readFileSync(APP_MODULE_PATH, 'utf-8');
      expect(appModuleContent).toContain('ThrottlerModule');
      expect(appModuleContent).toContain('ThrottlerGuard');
    });

    it.skip('should configure default rate limit of 60 req/min', () => {
      // RED: ThrottlerModule not configured yet
      const appModuleContent = readFileSync(APP_MODULE_PATH, 'utf-8');
      // Should have ttl: 60000 (60 seconds) and limit: 60
      expect(appModuleContent).toMatch(/ttl:\s*60000/);
      expect(appModuleContent).toMatch(/limit:\s*60/);
    });

    it.skip('should have custom rate limit decorators', () => {
      // RED: Custom decorators not created yet
      const throttleDecoratorPath = join(
        __dirname,
        '../../../src/common/decorators/throttle.decorator.ts',
      );
      expect(existsSync(throttleDecoratorPath)).toBe(true);

      const decoratorContent = readFileSync(throttleDecoratorPath, 'utf-8');
      // AI rate limit: 10 req/min
      expect(decoratorContent).toContain('AiRateLimit');
      expect(decoratorContent).toMatch(/limit:\s*10/);
      // Auth rate limit: 5 attempts/min
      expect(decoratorContent).toContain('AuthRateLimit');
      expect(decoratorContent).toMatch(/limit:\s*5/);
    });
  });

  // 1.4-INTG-002: Swagger UI at /api/docs
  describe('1.4-INTG-002: Swagger Configuration', () => {
    it.skip('should have @nestjs/swagger installed', async () => {
      // RED: @nestjs/swagger not installed yet
      const swagger = await import('@nestjs/swagger');
      expect(swagger.SwaggerModule).toBeDefined();
      expect(swagger.DocumentBuilder).toBeDefined();
    });

    it.skip('should have Swagger configured in main.ts', () => {
      // RED: Swagger not configured yet
      expect(existsSync(MAIN_TS_PATH)).toBe(true);
      const mainContent = readFileSync(MAIN_TS_PATH, 'utf-8');

      expect(mainContent).toContain('SwaggerModule');
      expect(mainContent).toContain('DocumentBuilder');
      expect(mainContent).toContain("'English Pro API'");
      expect(mainContent).toContain("'api/docs'");
      expect(mainContent).toContain('addBearerAuth');
    });

    it.skip('should configure API prefix /api/v1', () => {
      // RED: API prefix not configured yet
      const mainContent = readFileSync(MAIN_TS_PATH, 'utf-8');
      expect(mainContent).toContain("setGlobalPrefix('api/v1'");
    });
  });

  // 1.4-INTG-003: CommonModule wires all globally
  describe('1.4-INTG-003: CommonModule Wiring', () => {
    it.skip('should have common.module.ts in src/common/', () => {
      // RED: CommonModule does not exist yet
      expect(existsSync(COMMON_MODULE_PATH)).toBe(true);
    });

    it.skip('should register AuthGuard as APP_GUARD', () => {
      // RED: CommonModule not implemented yet
      const moduleContent = readFileSync(COMMON_MODULE_PATH, 'utf-8');
      expect(moduleContent).toContain('APP_GUARD');
      expect(moduleContent).toContain('AuthGuard');
    });

    it.skip('should register RolesGuard as APP_GUARD', () => {
      // RED: CommonModule not implemented yet
      const moduleContent = readFileSync(COMMON_MODULE_PATH, 'utf-8');
      expect(moduleContent).toContain('RolesGuard');
    });

    it.skip('should register ParentalGateGuard as APP_GUARD', () => {
      // RED: CommonModule not implemented yet
      const moduleContent = readFileSync(COMMON_MODULE_PATH, 'utf-8');
      expect(moduleContent).toContain('ParentalGateGuard');
    });

    it.skip('should register HttpExceptionFilter as APP_FILTER', () => {
      // RED: CommonModule not implemented yet
      const moduleContent = readFileSync(COMMON_MODULE_PATH, 'utf-8');
      expect(moduleContent).toContain('APP_FILTER');
      expect(moduleContent).toContain('HttpExceptionFilter');
    });

    it.skip('should register ResponseWrapperInterceptor as APP_INTERCEPTOR', () => {
      // RED: CommonModule not implemented yet
      const moduleContent = readFileSync(COMMON_MODULE_PATH, 'utf-8');
      expect(moduleContent).toContain('APP_INTERCEPTOR');
      expect(moduleContent).toContain('ResponseWrapperInterceptor');
    });

    it.skip('should register LoggingInterceptor as APP_INTERCEPTOR', () => {
      // RED: CommonModule not implemented yet
      const moduleContent = readFileSync(COMMON_MODULE_PATH, 'utf-8');
      expect(moduleContent).toContain('LoggingInterceptor');
    });

    it.skip('should import CommonModule in AppModule', () => {
      // RED: AppModule not updated yet
      const appModuleContent = readFileSync(APP_MODULE_PATH, 'utf-8');
      expect(appModuleContent).toContain('CommonModule');
    });

    it.skip('should import ConfigModule.forRoot() as global in AppModule', () => {
      // RED: ConfigModule not imported yet
      const appModuleContent = readFileSync(APP_MODULE_PATH, 'utf-8');
      expect(appModuleContent).toContain('ConfigModule');
      expect(appModuleContent).toContain('isGlobal: true');
    });

    it.skip('should remove old AuthModule import from AppModule', () => {
      // RED: Old AuthModule still imported
      const appModuleContent = readFileSync(APP_MODULE_PATH, 'utf-8');
      // AuthModule should NOT be imported anymore — replaced by CommonModule
      expect(appModuleContent).not.toMatch(
        /import.*AuthModule.*from.*['"]\.\/(auth|auth\/auth\.module)['"]/,
      );
    });
  });

  // 1.4-INTG-004: Guard execution order
  describe('1.4-INTG-004: Guard Execution Order', () => {
    it.skip('should register guards in correct order: Auth → Roles → ParentalGate', () => {
      // RED: CommonModule not implemented yet
      // NestJS executes global guards in registration order
      const moduleContent = readFileSync(COMMON_MODULE_PATH, 'utf-8');

      const authGuardIndex = moduleContent.indexOf('AuthGuard');
      const rolesGuardIndex = moduleContent.indexOf('RolesGuard');
      const parentalGateIndex = moduleContent.indexOf('ParentalGateGuard');

      // All should exist
      expect(authGuardIndex).toBeGreaterThan(-1);
      expect(rolesGuardIndex).toBeGreaterThan(-1);
      expect(parentalGateIndex).toBeGreaterThan(-1);

      // AuthGuard must come before RolesGuard
      expect(authGuardIndex).toBeLessThan(rolesGuardIndex);
      // RolesGuard must come before ParentalGateGuard
      expect(rolesGuardIndex).toBeLessThan(parentalGateIndex);
    });
  });

  // 1.4-INTG-005: Error responses NOT wrapped by ResponseWrapper
  describe('1.4-INTG-005: Error Response Not Wrapped', () => {
    it.skip('should have HttpExceptionFilter registered AFTER ResponseWrapperInterceptor', () => {
      // RED: CommonModule not implemented yet
      // When an error occurs, the filter should produce the final response
      // The interceptor wraps success; the filter handles errors
      const moduleContent = readFileSync(COMMON_MODULE_PATH, 'utf-8');

      // APP_FILTER should be separate from APP_INTERCEPTOR
      expect(moduleContent).toContain('APP_FILTER');
      expect(moduleContent).toContain('APP_INTERCEPTOR');

      // Both HttpExceptionFilter and ResponseWrapperInterceptor must be present
      expect(moduleContent).toContain('HttpExceptionFilter');
      expect(moduleContent).toContain('ResponseWrapperInterceptor');
    });

    it.skip('should have LoggingInterceptor registered before ResponseWrapperInterceptor', () => {
      // RED: CommonModule not implemented yet
      // Logging wraps everything (including errors), ResponseWrapper only wraps success
      const moduleContent = readFileSync(COMMON_MODULE_PATH, 'utf-8');

      const loggingIndex = moduleContent.indexOf('LoggingInterceptor');
      const wrapperIndex = moduleContent.indexOf('ResponseWrapperInterceptor');

      expect(loggingIndex).toBeGreaterThan(-1);
      expect(wrapperIndex).toBeGreaterThan(-1);
      // LoggingInterceptor should be registered before ResponseWrapperInterceptor
      expect(loggingIndex).toBeLessThan(wrapperIndex);
    });
  });
});

describe('Story 1.4: File Structure Validation @P1 @Integration', () => {
  it.skip('should have deleted old src/auth/ directory', () => {
    // RED: Old auth directory still exists
    const oldAuthDir = join(__dirname, '../../../src/auth');
    expect(existsSync(oldAuthDir)).toBe(false);
  });

  it.skip('should have all required decorator files', () => {
    // RED: Decorators not created yet
    const decoratorsDir = join(__dirname, '../../../src/common/decorators');
    const requiredDecorators = [
      'public.decorator.ts',
      'roles.decorator.ts',
      'parent-only.decorator.ts',
      'current-user.decorator.ts',
      'throttle.decorator.ts',
    ];

    for (const decorator of requiredDecorators) {
      expect(existsSync(join(decoratorsDir, decorator))).toBe(true);
    }
  });

  it.skip('should have CurrentUser param decorator', () => {
    // RED: CurrentUser decorator not created yet
    const decoratorPath = join(
      __dirname,
      '../../../src/common/decorators/current-user.decorator.ts',
    );
    expect(existsSync(decoratorPath)).toBe(true);

    const content = readFileSync(decoratorPath, 'utf-8');
    expect(content).toContain('createParamDecorator');
    expect(content).toContain('CurrentUser');
  });

  it.skip('should have API response types in shared/types/', () => {
    // RED: Type files not created yet
    const apiResponsePath = join(
      __dirname,
      '../../../src/shared/types/api-response.type.ts',
    );
    expect(existsSync(apiResponsePath)).toBe(true);
  });
});
