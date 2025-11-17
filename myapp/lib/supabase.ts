import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

// Helper to get current user from custom session (nickname + PIN based)
export async function getCurrentUser() {
  if (typeof window === 'undefined') return null;

  const sessionData = localStorage.getItem('myapp_session');
  if (!sessionData) return null;

  try {
    const session = JSON.parse(sessionData);
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.userId)
      .eq('is_active', true)
      .single();

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Helper to check if user is admin
export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === 'admin';
}

// Helper to set session
export function setSession(userId: string, nickname: string, role: string) {
  if (typeof window === 'undefined') return;

  const sessionData = JSON.stringify({
    userId,
    nickname,
    role,
    timestamp: Date.now(),
  });

  // Store in localStorage
  localStorage.setItem('myapp_session', sessionData);

  // Also set cookie for middleware
  document.cookie = `myapp_session=${encodeURIComponent(sessionData)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

// Helper to clear session
export function clearSession() {
  if (typeof window === 'undefined') return;

  // Clear localStorage
  localStorage.removeItem('myapp_session');

  // Clear cookie
  document.cookie = 'myapp_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

// Helper to get session
export function getSession() {
  if (typeof window === 'undefined') return null;

  const sessionData = localStorage.getItem('myapp_session');
  if (!sessionData) return null;

  try {
    return JSON.parse(sessionData);
  } catch {
    return null;
  }
}
