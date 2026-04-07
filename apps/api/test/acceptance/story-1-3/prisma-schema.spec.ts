/**
 * ATDD Tests - Story 1.3: Prisma Schema Validation
 * Test IDs: 1.3-UNIT-001, 1.3-UNIT-002, 1.3-UNIT-004
 * Priority: P0 (Critical)
 * Status: 🔴 RED (failing before implementation)
 *
 * These tests validate that the Prisma schema correctly defines
 * all required database tables and relationships for bmad-english-pro.
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Path to Prisma schema - relative to test file location
// __dirname = apps/api/test/acceptance/story-1-3/
// Up 3 levels = apps/api/ → prisma/schema.prisma
const PRISMA_SCHEMA_PATH = join(__dirname, '../../../prisma/schema.prisma');

describe('Story 1.3: Prisma Schema @P0 @Unit', () => {
    // 1.3-UNIT-001: Prisma schema defines all required tables
    describe('1.3-UNIT-001: Schema Table Definitions', () => {
        let schemaContent: string;

        beforeAll(() => {
            expect(existsSync(PRISMA_SCHEMA_PATH)).toBe(true);
            schemaContent = readFileSync(PRISMA_SCHEMA_PATH, 'utf-8');
        });

        it('should define Parent model', () => {
            expect(schemaContent).toMatch(/model\s+Parent\s*\{/);
        });

        it('should define ChildProfile model', () => {
            expect(schemaContent).toMatch(/model\s+ChildProfile\s*\{/);
        });

        it('should define ConversationSession model', () => {
            expect(schemaContent).toMatch(/model\s+ConversationSession\s*\{/);
        });

        it('should define PronunciationScore model', () => {
            expect(schemaContent).toMatch(/model\s+PronunciationScore\s*\{/);
        });

        it('should define Badge model', () => {
            expect(schemaContent).toMatch(/model\s+Badge\s*\{/);
        });

        it('should define Streak model', () => {
            expect(schemaContent).toMatch(/model\s+Streak\s*\{/);
        });

        it('should define XpTransaction model', () => {
            expect(schemaContent).toMatch(/model\s+XpTransaction\s*\{/);
        });

        it('should define ConversationScenario model', () => {
            expect(schemaContent).toMatch(/model\s+ConversationScenario\s*\{/);
        });

        it('should define ParentalConsent model', () => {
            expect(schemaContent).toMatch(/model\s+ParentalConsent\s*\{/);
        });

        it('should define SafetyFlag model', () => {
            expect(schemaContent).toMatch(/model\s+SafetyFlag\s*\{/);
        });
    });

    // 1.3-UNIT-002: Prisma migrations are valid
    describe('1.3-UNIT-002: Migration Validity', () => {
        it('should have Prisma migrations directory', () => {
            const migrationsPath = join(__dirname, '../../../prisma/migrations');
            expect(existsSync(migrationsPath)).toBe(true);
        });

        it('should validate schema without errors (prisma validate)', () => {
            // This will fail if schema has syntax errors
            expect(() => {
                execSync('npx prisma validate', {
                    cwd: join(__dirname, '../../..'),
                    timeout: 30000,
                });
            }).not.toThrow();
        });

        it('should generate Prisma client without errors', () => {
            expect(() => {
                execSync('npx prisma generate', {
                    cwd: join(__dirname, '../../..'),
                    timeout: 30000,
                });
            }).not.toThrow();
        });
    });

    // 1.3-UNIT-004: Entity relationships are correct
    describe('1.3-UNIT-004: Entity Relationships', () => {
        let schemaContent: string;

        beforeAll(() => {
            schemaContent = readFileSync(PRISMA_SCHEMA_PATH, 'utf-8');
        });

        it('should define Parent → ChildProfile one-to-many relationship', () => {
            // Parent has children field
            expect(schemaContent).toMatch(/model\s+Parent\s*\{[\s\S]*?children\s+ChildProfile\[\]/);
        });

        it('should define ChildProfile → ConversationSession one-to-many relationship', () => {
            expect(schemaContent).toMatch(/model\s+ChildProfile\s*\{[\s\S]*?conversations\s+ConversationSession\[\]/);
        });

        it('should define ChildProfile → PronunciationScore one-to-many relationship', () => {
            expect(schemaContent).toMatch(/model\s+ChildProfile\s*\{[\s\S]*?pronunciationScores\s+PronunciationScore\[\]/);
        });

        it('should define ChildProfile → Badge many-to-many relationship', () => {
            expect(schemaContent).toMatch(/model\s+ChildProfile\s*\{[\s\S]*?badges\s+/);
        });

        it('should define ChildProfile → Streak one-to-one or one-to-many', () => {
            expect(schemaContent).toMatch(/model\s+ChildProfile\s*\{[\s\S]*?streak/);
        });

        it('should define ChildProfile → XpTransaction one-to-many', () => {
            expect(schemaContent).toMatch(/model\s+ChildProfile\s*\{[\s\S]*?xpTransactions\s+XpTransaction\[\]/);
        });

        it('should define Parent → ParentalConsent one-to-one', () => {
            expect(schemaContent).toMatch(/model\s+Parent\s*\{[\s\S]*?consent/);
        });

        it('should include Supabase auth user ID reference in Parent model', () => {
            // Parent should have supabaseUserId or authUserId field
            expect(schemaContent).toMatch(/model\s+Parent\s*\{[\s\S]*?(supabaseUserId|authUserId|auth_user_id)\s+String/);
        });

        it('should use UUID as primary key for all models', () => {
            // Each model should use @id with @default(uuid()) or cuid()
            const modelBlocks = schemaContent.match(/model\s+\w+\s*\{[^}]+\}/g) || [];
            expect(modelBlocks.length).toBeGreaterThan(0);

            for (const block of modelBlocks) {
                expect(block).toMatch(/@id/);
                expect(block).toMatch(/@default\((uuid|cuid|dbgenerated)\(/);
            }
        });

        it('should include timestamps (createdAt, updatedAt) on all models', () => {
            const modelBlocks = schemaContent.match(/model\s+\w+\s*\{[^}]+\}/g) || [];
            expect(modelBlocks.length).toBeGreaterThan(0);

            for (const block of modelBlocks) {
                expect(block).toMatch(/createdAt\s+DateTime/);
                expect(block).toMatch(/updatedAt\s+DateTime/);
            }
        });
    });
});
