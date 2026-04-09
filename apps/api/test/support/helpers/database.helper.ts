// test/support/helpers/database.helper.ts
// Database test helpers for integration tests

/**
 * Truncates all tables in the database (for integration test cleanup).
 * Uses TRUNCATE ... CASCADE to handle foreign keys.
 *
 * ⚠️ Only use in integration tests with a real test database.
 * Accepts any Prisma-like client (PrismaService extends PrismaClient).
 *
 * @example
 * afterEach(async () => { await truncateAllTables(prisma); });
 */
export async function truncateAllTables(prisma: any): Promise<void> {
  const tableNames = [
    'safety_flags',
    'xp_transactions',
    'pronunciation_scores',
    'badges',
    'streaks',
    'conversation_sessions',
    'conversation_scenarios',
    'subscriptions',
    'parental_consents',
    'child_profiles',
    'parents',
  ];

  for (const table of tableNames) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
  }
}

/**
 * Seeds minimum required data for a test (parent + child).
 * Returns the created records for use in test assertions.
 *
 * @example
 * const { parent, child } = await seedTestFamily(prisma);
 */
export async function seedTestFamily(
  prisma: any,
  overrides?: {
    parentEmail?: string;
    childName?: string;
    childAge?: number;
  },
) {
  const parent = await prisma.parent.create({
    data: {
      authUserId: crypto.randomUUID(),
      email: overrides?.parentEmail ?? 'test-parent@test.com',
      displayName: 'Test Parent',
    },
  });

  const child = await prisma.childProfile.create({
    data: {
      parentId: parent.id,
      displayName: overrides?.childName ?? 'Test Kid',
      age: overrides?.childAge ?? 6,
    },
  });

  return { parent, child };
}
