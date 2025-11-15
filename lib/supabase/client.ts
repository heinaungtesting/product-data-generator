/**
 * Supabase Client Configuration
 *
 * Creates Supabase client instances for different environments:
 * - Browser client (anon key) - for frontend
 * - Server client (service role) - for API routes
 * - Edge client - for Vercel Edge Runtime
 *
 * Features:
 * - Real-time subscriptions
 * - Optimistic updates
 * - Automatic reconnection
 * - Type-safe queries
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Browser client for frontend use
 * Uses anon key with Row Level Security
 */
export const supabaseBrowser = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    auth: {
      persistSession: false, // We use our own session management
      autoRefreshToken: false,
    },
  }
);

/**
 * Server client for API routes and server-side operations
 * Uses service role key with full access
 */
export function createServerClient() {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Edge client for Vercel Edge Runtime
 * Optimized for minimal cold start time
 */
export function createEdgeClient(serviceKey?: string) {
  const key = serviceKey || supabaseAnonKey;

  return createClient<Database>(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Real-time channel configuration presets
 */
export const REALTIME_CHANNELS = {
  PRODUCTS: 'products',
  PRESENCE: 'presence',
  NOTIFICATIONS: 'notifications',
} as const;

/**
 * Real-time event types
 */
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

/**
 * Product change payload
 */
export interface ProductChangePayload {
  eventType: RealtimeEvent;
  new: Record<string, any>;
  old: Record<string, any>;
  table: string;
}

/**
 * Presence user state
 */
export interface PresenceUser {
  userId: string;
  username: string;
  editingProductId?: string;
  lastSeen: string;
}
