/**
 * Supabase Client for Frontend
 * Initialize Supabase client with environment variables
 * NOTE: This is optional - the app works through Backend API
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getEnvVar(name: string) {
  try {
    // @ts-expect-error import.meta may not have env typed in some test environments
    const v = (import.meta as unknown as { env?: Record<string, string> })?.env?.[name];
    if (v) return v;
  } catch {
    // ignore
  }
  const nodeVal = typeof process !== 'undefined' ? (process as any).env?.[name] : undefined;
  return nodeVal;
}

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || '';
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || '';

// Only create client if environment variables are available
// Otherwise, realtime features will be disabled but app still works via Backend API
let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
} else {
  console.warn('Supabase environment variables not set - realtime features disabled');
}

export { supabase };

// Helper to get current user (only works if Supabase client is initialized)
export const getCurrentUser = async () => {
  if (!supabase) return null;
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Helper to get session
export const getSession = async () => {
  if (!supabase) return null;
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

// Auth state change listener
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
  return supabase.auth.onAuthStateChange(callback);
};

export default supabase;
