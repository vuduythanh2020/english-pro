import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Provides two Supabase client instances following the principle of least privilege:
 *
 * - `anonClient`: Uses the anon key for public-facing operations (signUp, signIn).
 *   Subject to Row Level Security — safe for user-initiated calls.
 *
 * - `adminClient`: Uses the service-role key for privileged operations (admin.getUser,
 *   admin.updateUser, etc.). Bypasses RLS — MUST NOT be used for user-initiated calls.
 *
 * REQUIREMENT: Supabase project MUST have "Confirm email" disabled (auto-confirm ON).
 * This app does not implement an email verification flow. If auto-confirm is off,
 * signUp() will return { user, session: null } which this service treats as a
 * configuration error (500).
 */
@Injectable()
export class SupabaseService implements OnModuleDestroy {
  private readonly anonClient: SupabaseClient;
  private readonly adminClient: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    const anonKey = this.configService.getOrThrow<string>('SUPABASE_ANON_KEY');
    const serviceRoleKey = this.configService.getOrThrow<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    const clientOptions = {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    };

    // Public client — uses anon key, RLS applies
    this.anonClient = createClient(supabaseUrl, anonKey, clientOptions);

    // Admin client — uses service-role key, bypasses RLS
    // Use ONLY for privileged server-side operations (e.g. admin.getUserById)
    this.adminClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      clientOptions,
    );
  }

  /**
   * Returns the admin Supabase client (service-role key).
   * Use ONLY for privileged admin operations — not for user-facing auth calls.
   */
  getAdminClient(): SupabaseClient {
    return this.adminClient;
  }

  /**
   * Signs up a new user via Supabase Auth using the anon key.
   *
   * Uses the anon client intentionally — signUp is a public operation
   * that should not bypass Row Level Security.
   *
   * @param email User email address
   * @param password User password
   * @param displayName Optional display name stored in user_metadata
   * @returns The created user and session data.
   * @throws Error if sign-up fails.
   */
  async signUp(email: string, password: string, displayName?: string) {
    const { data, error } = await this.anonClient.auth.signUp({
      email,
      password,
      options: displayName
        ? { data: { display_name: displayName } }
        : undefined,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  onModuleDestroy(): void {
    // No explicit cleanup needed for Supabase JS client
  }
}
