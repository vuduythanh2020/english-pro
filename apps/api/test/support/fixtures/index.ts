// test/support/fixtures/index.ts
// Central fixture exports
export {
    createPrismaFixture,
    createMockPrismaService,
} from './prisma.fixture';

export {
    createAppFixture,
    createTestModule,
    type AppFixture,
} from './app.fixture';

export {
    createTestToken,
    createParentToken,
    createChildToken,
    createExpiredToken,
    MockAuthGuard,
    MockRolesGuard,
    type TestJwtPayload,
} from './auth.fixture';
