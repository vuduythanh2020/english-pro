/**
 * ATDD Tests - Story 1.3: Supabase RLS Policies
 * Test ID: 1.3-INT-002
 * Priority: P0 (Critical - Security)
 * Status: 🔴 RED (failing before implementation)
 *
 * Validates Row Level Security policies protect child data
 * and enforce parent-only access patterns.
 *
 * NOTE: These tests require SQL migration files with RLS policy definitions.
 * They verify RLS policies at the file level using pattern matching.
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

describe('Story 1.3: RLS Policies @P0 @Integration @Security', () => {
  // 1.3-INT-002: RLS policies restrict data access
  describe('1.3-INT-002: Row Level Security Policies', () => {
    // __dirname = apps/api/test/acceptance/story-1-3/
    // Up 6 levels = workspace root (bmad-english-pro/)
    const supabaseMigrationsPath = join(
      __dirname,
      '../../../../../../infra/supabase/migrations',
    );

    it('should have Supabase migrations directory with RLS migration files', () => {
      expect(existsSync(supabaseMigrationsPath)).toBe(true);

      const files = readdirSync(supabaseMigrationsPath);
      expect(files.length).toBeGreaterThan(0);

      // At least one migration should contain RLS policy definitions
      const hasRlsMigration = files.some((file) => {
        if (!file.endsWith('.sql')) return false;
        const content = readFileSync(
          join(supabaseMigrationsPath, file),
          'utf-8',
        );
        return (
          content.includes('ENABLE ROW LEVEL SECURITY') ||
          content.includes('CREATE POLICY')
        );
      });

      expect(hasRlsMigration).toBe(true);
    });

    it('should enable RLS on child_profiles table', () => {
      const files = readdirSync(supabaseMigrationsPath).filter((f) =>
        f.endsWith('.sql'),
      );
      const allSql = files
        .map((f) => readFileSync(join(supabaseMigrationsPath, f), 'utf-8'))
        .join('\n');

      // RLS must be enabled on child_profiles
      expect(allSql).toMatch(
        /ALTER TABLE.*child_profiles.*ENABLE ROW LEVEL SECURITY/i,
      );
    });

    it('should enable RLS on conversation_sessions table', () => {
      const files = readdirSync(supabaseMigrationsPath).filter((f) =>
        f.endsWith('.sql'),
      );
      const allSql = files
        .map((f) => readFileSync(join(supabaseMigrationsPath, f), 'utf-8'))
        .join('\n');

      expect(allSql).toMatch(
        /ALTER TABLE.*conversation_sessions.*ENABLE ROW LEVEL SECURITY/i,
      );
    });

    it('should enable RLS on pronunciation_scores table', () => {
      const files = readdirSync(supabaseMigrationsPath).filter((f) =>
        f.endsWith('.sql'),
      );
      const allSql = files
        .map((f) => readFileSync(join(supabaseMigrationsPath, f), 'utf-8'))
        .join('\n');

      expect(allSql).toMatch(
        /ALTER TABLE.*pronunciation_scores.*ENABLE ROW LEVEL SECURITY/i,
      );
    });

    it('should define SELECT policy for parent to access own children only', () => {
      const files = readdirSync(supabaseMigrationsPath).filter((f) =>
        f.endsWith('.sql'),
      );
      const allSql = files
        .map((f) => readFileSync(join(supabaseMigrationsPath, f), 'utf-8'))
        .join('\n');

      // Policy should restrict SELECT on child_profiles to parent's own children
      expect(allSql).toMatch(/CREATE POLICY.*child_profiles.*SELECT/i);
      // Policy should reference auth.uid() for user isolation
      expect(allSql).toMatch(/auth\.uid\(\)/i);
    });

    it('should define INSERT policy for parent to create own children only', () => {
      const files = readdirSync(supabaseMigrationsPath).filter((f) =>
        f.endsWith('.sql'),
      );
      const allSql = files
        .map((f) => readFileSync(join(supabaseMigrationsPath, f), 'utf-8'))
        .join('\n');

      expect(allSql).toMatch(/CREATE POLICY.*child_profiles.*INSERT/i);
    });

    it('should define UPDATE policy for parent to modify own children only', () => {
      const files = readdirSync(supabaseMigrationsPath).filter((f) =>
        f.endsWith('.sql'),
      );
      const allSql = files
        .map((f) => readFileSync(join(supabaseMigrationsPath, f), 'utf-8'))
        .join('\n');

      expect(allSql).toMatch(/CREATE POLICY.*child_profiles.*UPDATE/i);
    });

    it('should define DELETE policy for parent to remove own children only', () => {
      const files = readdirSync(supabaseMigrationsPath).filter((f) =>
        f.endsWith('.sql'),
      );
      const allSql = files
        .map((f) => readFileSync(join(supabaseMigrationsPath, f), 'utf-8'))
        .join('\n');

      expect(allSql).toMatch(/CREATE POLICY.*child_profiles.*DELETE/i);
    });

    it('should deny anonymous access to child data (no anon policy)', () => {
      const files = readdirSync(supabaseMigrationsPath).filter((f) =>
        f.endsWith('.sql'),
      );
      const allSql = files
        .map((f) => readFileSync(join(supabaseMigrationsPath, f), 'utf-8'))
        .join('\n');

      // Policies should target authenticated role, not anon
      // Anon should NOT have SELECT access to child_profiles
      const childPolicies = allSql.match(
        /CREATE POLICY[^;]*child_profiles[^;]*/gi,
      );

      if (childPolicies) {
        for (const policy of childPolicies) {
          // Policies should use 'authenticated' role, not 'anon'
          expect(policy).not.toMatch(/TO\s+anon/i);
        }
      }
    });

    it('should enable RLS on safety_flags table', () => {
      const files = readdirSync(supabaseMigrationsPath).filter((f) =>
        f.endsWith('.sql'),
      );
      const allSql = files
        .map((f) => readFileSync(join(supabaseMigrationsPath, f), 'utf-8'))
        .join('\n');

      expect(allSql).toMatch(
        /ALTER TABLE.*safety_flags.*ENABLE ROW LEVEL SECURITY/i,
      );
    });
  });
});
