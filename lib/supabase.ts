/**
 * Supabase Client Configuration
 *
 * This file provides Supabase client instances for both client-side and server-side usage.
 * - Client-side: Uses anon key (safe for browser)
 * - Server-side: Uses service role key (for API routes)
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

/**
 * Client-side Supabase client
 * Safe to use in browser/components
 * Uses anon key with Row Level Security (RLS)
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We use our own session management
    autoRefreshToken: false,
  },
});

/**
 * Server-side Supabase client (Admin)
 * Only use in API routes and server components
 * Bypasses Row Level Security (RLS)
 */
export function createServerSupabaseClient() {
  if (!supabaseServiceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
      'This client can only be used server-side (API routes).'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Singleton instance for server-side usage
 * Import this in API routes
 */
export const supabaseAdmin = createServerSupabaseClient();

/**
 * Type exports for convenience
 */
export type SupabaseClient = typeof supabase;
export type SupabaseAdminClient = ReturnType<typeof createServerSupabaseClient>;

/**
 * Helper: Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Helper: Get Supabase status
 */
export async function getSupabaseStatus() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    return {
      configured: true,
      connected: !error,
      error: error?.message,
    };
  } catch (err) {
    return {
      configured: false,
      connected: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
