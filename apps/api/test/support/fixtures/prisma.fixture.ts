// test/support/fixtures/prisma.fixture.ts
// Reusable PrismaService test fixture with auto-cleanup

/**
 * Creates a mock PrismaService for unit testing.
 * All model methods return jest.fn() by default.
 *
 * @example
 * const mockPrisma = createMockPrismaService();
 * mockPrisma.parent.findUnique.mockResolvedValue(parentFactory());
 */
export function createMockPrismaService() {
  const createModelMock = () => ({
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  });

  const mock: any = {
    parent: createModelMock(),
    childProfile: createModelMock(),
    conversationScenario: createModelMock(),
    conversationSession: createModelMock(),
    pronunciationScore: createModelMock(),
    badge: createModelMock(),
    streak: createModelMock(),
    xpTransaction: createModelMock(),
    parentalConsent: createModelMock(),
    safetyFlag: createModelMock(),
    subscription: createModelMock(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
  };

  // Setup $transaction to support both callback and array modes
  mock.$transaction.mockImplementation((fnOrArray: any): any => {
    if (typeof fnOrArray === 'function') return fnOrArray(mock);
    return Promise.resolve([]);
  });

  return mock;
}

/**
 * Type helper — use as PrismaService provider in TestingModule.
 *
 * @example
 * const mockPrisma = createMockPrismaService();
 * const module = await Test.createTestingModule({
 *   providers: [
 *     { provide: PrismaService, useValue: mockPrisma },
 *   ],
 * }).compile();
 */
export type MockPrismaService = ReturnType<typeof createMockPrismaService>;
