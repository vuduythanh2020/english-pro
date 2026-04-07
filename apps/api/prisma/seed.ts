// prisma/seed.ts
// Seed data for development and testing

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as pg from 'pg';

async function main() {
    const connectionString =
        process.env.DATABASE_URL ??
        'postgresql://postgres:postgres@localhost:54322/postgres';
    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    console.log('🌱 Seeding database...');

    // 1. Create parent user
    const parent = await prisma.parent.upsert({
        where: { email: 'parent@test.com' },
        update: {},
        create: {
            authUserId: '00000000-0000-0000-0000-000000000001',
            email: 'parent@test.com',
            role: 'PARENT',
            displayName: 'Test Parent',
        },
    });
    console.log(`✅ Parent created: ${parent.email}`);

    // 2. Create child profiles
    const child1 = await prisma.childProfile.upsert({
        where: { id: '00000000-0000-0000-0000-000000000011' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000011',
            parentId: parent.id,
            displayName: 'Minh',
            avatarId: 1,
            age: 8,
            level: 'beginner',
        },
    });
    console.log(`✅ Child 1 created: ${child1.displayName}`);

    const child2 = await prisma.childProfile.upsert({
        where: { id: '00000000-0000-0000-0000-000000000012' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000012',
            parentId: parent.id,
            displayName: 'Linh',
            avatarId: 2,
            age: 10,
            level: 'intermediate',
        },
    });
    console.log(`✅ Child 2 created: ${child2.displayName}`);

    // 3. Create conversation scenarios
    const scenario1 = await prisma.conversationScenario.upsert({
        where: { id: '00000000-0000-0000-0000-000000000101' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000101',
            title: 'Ordering Food',
            description: 'Practice ordering food at a restaurant',
            level: 'beginner',
            topicBoundaries: { allowed: ['food', 'restaurant', 'menu'] },
            maxTurns: 10,
            promptTemplate:
                'You are Max, a friendly waiter. Help the child order food.',
        },
    });
    console.log(`✅ Scenario 1 created: ${scenario1.title}`);

    const scenario2 = await prisma.conversationScenario.upsert({
        where: { id: '00000000-0000-0000-0000-000000000102' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000102',
            title: 'At the Zoo',
            description: 'Learn animal names and descriptions at the zoo',
            level: 'beginner',
            topicBoundaries: { allowed: ['animals', 'zoo', 'nature'] },
            maxTurns: 10,
            promptTemplate:
                'You are Max, a zookeeper. Talk about animals with the child.',
        },
    });
    console.log(`✅ Scenario 2 created: ${scenario2.title}`);

    const scenario3 = await prisma.conversationScenario.upsert({
        where: { id: '00000000-0000-0000-0000-000000000103' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000103',
            title: 'My Family',
            description: 'Practice describing family members',
            level: 'beginner',
            topicBoundaries: { allowed: ['family', 'home', 'people'] },
            maxTurns: 10,
            promptTemplate:
                'You are Max, a friendly neighbor. Ask about family members.',
        },
    });
    console.log(`✅ Scenario 3 created: ${scenario3.title}`);

    // 4. Create parental consent
    await prisma.parentalConsent.upsert({
        where: { parentId: parent.id },
        update: {},
        create: {
            parentId: parent.id,
            status: 'GRANTED',
            consentVersion: '1.0',
            consentTimestamp: new Date(),
        },
    });
    console.log('✅ Parental consent created');

    console.log('🌱 Seeding complete!');

    await prisma.$disconnect();
    pool.end();
}

main().catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
});
