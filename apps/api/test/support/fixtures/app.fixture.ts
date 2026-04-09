// test/support/fixtures/app.fixture.ts
// NestJS Testing Module fixture for integration/e2e tests
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../../src/app.module';

export interface AppFixture {
  app: INestApplication;
  module: TestingModule;
}

/**
 * Creates a full NestJS application fixture for e2e testing.
 * Applies the same pipes, filters, interceptors as production.
 *
 * @example
 * let fixture: AppFixture;
 * beforeAll(async () => { fixture = await createAppFixture(); });
 * afterAll(async () => { await fixture.app.close(); });
 */
export async function createAppFixture(overrides?: {
  imports?: any[];
  providers?: any[];
}): Promise<AppFixture> {
  const moduleBuilder = Test.createTestingModule({
    imports: [AppModule, ...(overrides?.imports || [])],
    providers: [...(overrides?.providers || [])],
  });

  const module = await moduleBuilder.compile();
  const app = module.createNestApplication();

  // Apply same global config as main.ts
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  return { app, module };
}

/**
 * Creates a minimal testing module (without full app bootstrap).
 * Useful for testing individual services/controllers in isolation.
 *
 * @example
 * const module = await createTestModule({
 *   providers: [MyService, { provide: PrismaService, useValue: mockPrisma }],
 * });
 */
export async function createTestModule(config: {
  imports?: any[];
  controllers?: any[];
  providers?: any[];
}): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: config.imports || [],
    controllers: config.controllers || [],
    providers: config.providers || [],
  }).compile();
}
