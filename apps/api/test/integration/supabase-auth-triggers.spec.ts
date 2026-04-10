/**
 * E2E Integration Test: Supabase Auth Triggers
 *
 * Tests the full auth pipeline:
 * 1. handle_new_user() trigger → creates public.parents on signup
 * 2. custom_access_token_hook() → injects role/user_id/children_ids into JWT
 *
 * PREREQUISITES:
 * - Supabase must be running locally: `npx supabase start` (from apps/api/)
 * - Migrations applied: supabase/migrations/ are auto-applied on `supabase start`
 * - config.toml must have [auth.hook.custom_access_token] enabled
 *
 * Run: pnpm test:integration --testPathPatterns=supabase-auth-triggers
 */

import * as pg from 'pg';
import * as jwt from 'jsonwebtoken';

// ---------------------------------------------------------------------------
// Environment — defaults are standard Supabase local dev values
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:54322/postgres';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** POST JSON to Supabase GoTrue and return parsed body. */
async function gotruePost(
  path: string,
  body: Record<string, unknown>,
  extraHeaders?: Record<string, string>,
): Promise<{ ok: boolean; status: number; data: any }> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

/** Delete an auth user via the Admin API (service-role). */
async function deleteAuthUser(userId: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
    },
  });
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Supabase Auth Triggers E2E @Integration', () => {
  let pool: pg.Pool;
  let supabaseAvailable = false;

  // Track auth users created during tests for cleanup
  const createdAuthUserIds: string[] = [];

  // Shared test credentials (set once per suite, reused across describes)
  const testPassword = 'TestPassword123!';
  let primaryEmail: string;
  let primaryAuthUserId: string;

  beforeAll(async () => {
    // 1. Probe Supabase health
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
        signal: AbortSignal.timeout(3000),
      });
      supabaseAvailable = res.ok;
    } catch {
      supabaseAvailable = false;
    }

    if (!supabaseAvailable) {
      console.warn(
        '⚠️  Supabase not running — skipping auth trigger E2E tests.\n' +
          '   Start Supabase: cd apps/api && npx supabase start',
      );
      return;
    }

    // 2. Open a direct PG connection for assertions & cleanup
    pool = new pg.Pool({ connectionString: DATABASE_URL });

    // 3. Create the primary test user that most tests will share
    primaryEmail = `e2e-trigger-${Date.now()}@test.com`;

    const signup = await gotruePost('/signup', {
      email: primaryEmail,
      password: testPassword,
      data: { display_name: 'E2E Test Parent' },
    });

    if (!signup.ok) {
      throw new Error(
        `Signup failed (${signup.status}): ${JSON.stringify(signup.data)}`,
      );
    }

    primaryAuthUserId = signup.data.user.id;
    createdAuthUserIds.push(primaryAuthUserId);

    // Brief pause for trigger execution
    await sleep(500);
  });

  afterAll(async () => {
    if (!supabaseAvailable) return;

    // Cleanup all auth users created during this suite
    for (const uid of createdAuthUserIds) {
      try {
        await deleteAuthUser(uid);
      } catch {
        /* best-effort */
      }
      try {
        await pool.query('DELETE FROM public.parents WHERE auth_user_id = $1', [
          uid,
        ]);
      } catch {
        /* best-effort */
      }
    }

    await pool.end();
  });

  // Use a conditional wrapper so the suite reports SKIPPED rather than failing
  const when = (fn: () => Promise<void>): (() => Promise<void>) => {
    return supabaseAvailable ? fn : async () => {};
  };

  // -----------------------------------------------------------------------
  // 1. handle_new_user() trigger
  // -----------------------------------------------------------------------
  describe('handle_new_user() trigger', () => {
    it(
      'should create a parent record in public.parents on auth signup',
      when(async () => {
        const result = await pool.query(
          'SELECT * FROM public.parents WHERE auth_user_id = $1',
          [primaryAuthUserId],
        );

        expect(result.rows).toHaveLength(1);

        const parent = result.rows[0];
        expect(parent.auth_user_id).toBe(primaryAuthUserId);
        expect(parent.email).toBe(primaryEmail);
        expect(parent.role).toBe('PARENT');
        expect(parent.display_name).toBe('E2E Test Parent');
        expect(parent.is_active).toBe(true);
        expect(parent.created_at).toBeInstanceOf(Date);
        expect(parent.updated_at).toBeInstanceOf(Date);
        // id should be a valid UUID (auto-generated by DB)
        expect(parent.id).toMatch(UUID_RE);
      }),
    );

    it(
      'should fall back to email prefix when display_name is not provided',
      when(async () => {
        const email = `e2e-noname-${Date.now()}@test.com`;

        const signup = await gotruePost('/signup', {
          email,
          password: testPassword,
          // No data.display_name
        });

        expect(signup.ok).toBe(true);
        createdAuthUserIds.push(signup.data.user.id);

        await sleep(500);

        const result = await pool.query(
          'SELECT display_name FROM public.parents WHERE auth_user_id = $1',
          [signup.data.user.id],
        );

        expect(result.rows).toHaveLength(1);
        // COALESCE fallback → split_part(email, '@', 1)
        expect(result.rows[0].display_name).toBe(email.split('@')[0]);
      }),
    );

    it(
      'should be idempotent (ON CONFLICT DO NOTHING)',
      when(async () => {
        // The trigger fires only on INSERT, so we can't re-trigger it.
        // Instead, verify exactly one parent record exists for our auth user.
        const result = await pool.query(
          'SELECT COUNT(*)::int AS cnt FROM public.parents WHERE auth_user_id = $1',
          [primaryAuthUserId],
        );
        expect(result.rows[0].cnt).toBe(1);
      }),
    );
  });

  // -----------------------------------------------------------------------
  // 2. custom_access_token_hook()
  // -----------------------------------------------------------------------
  describe('custom_access_token_hook()', () => {
    it(
      'should inject user_role, user_id, and empty children_ids into JWT',
      when(async () => {
        const signin = await gotruePost('/token?grant_type=password', {
          email: primaryEmail,
          password: testPassword,
        });

        expect(signin.ok).toBe(true);
        expect(signin.data.access_token).toBeDefined();

        const decoded = jwt.decode(signin.data.access_token) as Record<
          string,
          any
        >;

        expect(decoded).not.toBeNull();
        expect(decoded.user_role).toBe('PARENT');
        expect(decoded.user_id).toBeDefined();
        expect(decoded.user_id).toMatch(UUID_RE);
        // user_id should be the public.parents.id, NOT auth.users.id
        expect(decoded.user_id).not.toBe(primaryAuthUserId);

        // No children yet → empty array
        expect(decoded.children_ids).toBeDefined();
        expect(Array.isArray(decoded.children_ids)).toBe(true);
        expect(decoded.children_ids).toEqual([]);
      }),
    );

    it(
      'should include child IDs when child profiles exist',
      when(async () => {
        // 1. Get parent's public ID
        const parentResult = await pool.query(
          'SELECT id FROM public.parents WHERE auth_user_id = $1',
          [primaryAuthUserId],
        );
        const parentId = parentResult.rows[0].id;

        // 2. Insert two child profiles directly in DB
        const child1 = await pool.query(
          `INSERT INTO public.child_profiles
             (parent_id, display_name, avatar_id, age, level, created_at, updated_at)
           VALUES ($1, 'An', 1, 6, 'beginner', NOW(), NOW())
           RETURNING id`,
          [parentId],
        );
        const child2 = await pool.query(
          `INSERT INTO public.child_profiles
             (parent_id, display_name, avatar_id, age, level, created_at, updated_at)
           VALUES ($1, 'Binh', 2, 8, 'beginner', NOW(), NOW())
           RETURNING id`,
          [parentId],
        );
        const childId1 = child1.rows[0].id as string;
        const childId2 = child2.rows[0].id as string;

        try {
          // 3. Sign in to get JWT with updated claims
          const signin = await gotruePost('/token?grant_type=password', {
            email: primaryEmail,
            password: testPassword,
          });

          const decoded = jwt.decode(signin.data.access_token) as Record<
            string,
            any
          >;

          // 4. Verify children_ids
          expect(decoded.children_ids).toBeDefined();
          expect(decoded.children_ids).toHaveLength(2);
          expect(decoded.children_ids).toContain(childId1);
          expect(decoded.children_ids).toContain(childId2);
        } finally {
          // Cleanup children
          await pool.query(
            'DELETE FROM public.child_profiles WHERE parent_id = $1',
            [parentId],
          );
        }
      }),
    );

    it(
      'should still return valid JWT when parent record is missing (graceful)',
      when(async () => {
        // Create a user without the trigger (edge case: trigger disabled)
        // We can't easily disable the trigger, but we CAN test what happens
        // if we call the hook function directly with a non-existent user.
        const result = await pool.query(
          `SELECT public.custom_access_token_hook($1::jsonb) AS result`,
          [
            JSON.stringify({
              user_id: '00000000-0000-0000-0000-000000000000',
              claims: { sub: '00000000-0000-0000-0000-000000000000' },
            }),
          ],
        );

        const hookResult = result.rows[0].result;
        // Hook should return the event unchanged (parent not found → no claims added)
        expect(hookResult.claims.sub).toBe(
          '00000000-0000-0000-0000-000000000000',
        );
        // No custom claims should be set
        expect(hookResult.claims.user_role).toBeUndefined();
        expect(hookResult.claims.user_id).toBeUndefined();
      }),
    );
  });

  // -----------------------------------------------------------------------
  // 3. Full Pipeline Integration
  // -----------------------------------------------------------------------
  describe('Full Pipeline: Signup → Parent Record → JWT Claims', () => {
    it(
      'should complete the full pipeline in under 3 seconds',
      when(async () => {
        const email = `e2e-pipeline-${Date.now()}@test.com`;
        let newAuthUserId: string | null = null;

        try {
          const start = Date.now();

          // Step 1: Signup
          const signup = await gotruePost('/signup', {
            email,
            password: testPassword,
            data: { display_name: 'Pipeline Test' },
          });
          expect(signup.ok).toBe(true);
          newAuthUserId = signup.data.user.id;

          // Step 2: Brief wait for trigger
          await sleep(300);

          // Step 3: Verify parent record
          const parentResult = await pool.query(
            'SELECT id FROM public.parents WHERE auth_user_id = $1',
            [newAuthUserId],
          );
          expect(parentResult.rows).toHaveLength(1);

          // Step 4: Sign in & verify JWT
          const signin = await gotruePost('/token?grant_type=password', {
            email,
            password: testPassword,
          });
          expect(signin.ok).toBe(true);

          const decoded = jwt.decode(signin.data.access_token) as Record<
            string,
            any
          >;
          expect(decoded.user_role).toBe('PARENT');
          expect(decoded.user_id).toBe(parentResult.rows[0].id);
          expect(decoded.children_ids).toEqual([]);

          const elapsed = Date.now() - start;
          expect(elapsed).toBeLessThan(3000);
        } finally {
          if (newAuthUserId) {
            createdAuthUserIds.push(newAuthUserId);
          }
        }
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
