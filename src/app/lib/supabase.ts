import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { appEnv } from './env';

let browserClient: SupabaseClient | null = null;
export const isSupabaseConfigured = appEnv.hasSupabase;

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(appEnv.supabaseUrl, appEnv.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}

export const supabase = getSupabaseBrowserClient();
