/**
 * ATDD Tests - Story 1.3: Supabase Auth Configuration
 * Test ID: 1.3-UNIT-003
 * Priority: P1
 * Status: 🔴 RED (failing before implementation)
 *
 * Validates Supabase Auth integration configuration
 * including JWT validation setup and auth module structure.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Path helpers - __dirname = apps/api/test/acceptance/story-1-3/
// Up 3 levels = apps/api/
// Up 6 levels = workspace root (bmad-english-pro/)

describe('Story 1.3: Supabase Auth Config @P1 @Unit', () => {
    // 1.3-UNIT-003: Supabase Auth configuration
    describe('1.3-UNIT-003: Auth Configuration', () => {
        it('should have Supabase environment variables defined in .env.example', () => {
            const envExamplePath = join(__dirname, '../../../.env.example');
            expect(existsSync(envExamplePath)).toBe(true);

            const envContent = readFileSync(envExamplePath, 'utf-8');

            // Required Supabase env vars
            expect(envContent).toContain('SUPABASE_URL');
            expect(envContent).toContain('SUPABASE_ANON_KEY');
            expect(envContent).toContain('SUPABASE_SERVICE_ROLE_KEY');
            expect(envContent).toContain('SUPABASE_JWT_SECRET');
        });

        it('should have AuthModule defined', () => {
            const { AuthModule } = require('../../../src/auth/auth.module');
            expect(AuthModule).toBeDefined();
        });

        it('should have SupabaseAuthGuard defined', () => {
            const { SupabaseAuthGuard } = require(
                '../../../src/auth/guards/supabase-auth.guard',
            );
            expect(SupabaseAuthGuard).toBeDefined();
        });

        it('should validate JWT tokens from Supabase', async () => {
            const { SupabaseAuthGuard } = require(
                '../../../src/auth/guards/supabase-auth.guard',
            );

            const guard = new SupabaseAuthGuard();

            // Invalid token should throw/return false
            const mockContext = {
                switchToHttp: () => ({
                    getRequest: () => ({
                        headers: {
                            authorization: 'Bearer invalid-token-here',
                        },
                    }),
                }),
            } as any;

            await expect(guard.canActivate(mockContext)).rejects.toThrow();
        });

        it('should reject requests without authorization header', async () => {
            const { SupabaseAuthGuard } = require(
                '../../../src/auth/guards/supabase-auth.guard',
            );

            const guard = new SupabaseAuthGuard();

            const mockContext = {
                switchToHttp: () => ({
                    getRequest: () => ({
                        headers: {},
                    }),
                }),
            } as any;

            await expect(guard.canActivate(mockContext)).rejects.toThrow();
        });

        it('should extract user info from valid JWT payload', () => {
            const { SupabaseAuthGuard } = require(
                '../../../src/auth/guards/supabase-auth.guard',
            );

            // Verify the guard has a method to extract user from token
            const guard = new SupabaseAuthGuard();
            expect(
                typeof (guard as any).extractUserFromToken === 'function' ||
                typeof (guard as any).validateToken === 'function',
            ).toBe(true);
        });
    });

    describe('Supabase Client Configuration', () => {
        it('should have Supabase config in infra/supabase/config.toml', () => {
            // Up 5 levels from test file to workspace root, then infra/supabase/
            const configPath = join(
                __dirname,
                '../../../../../../infra/supabase/config.toml',
            );
            expect(existsSync(configPath)).toBe(true);
        });

        it('should configure auth providers in Supabase config', () => {
            const configPath = join(
                __dirname,
                '../../../../../../infra/supabase/config.toml',
            );
            const configContent = readFileSync(configPath, 'utf-8');

            // Should have auth section
            expect(configContent).toMatch(/\[auth\]/);
        });
    });
});
