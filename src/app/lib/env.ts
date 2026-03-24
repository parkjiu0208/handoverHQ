const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

export const appEnv = {
  appName: import.meta.env.VITE_APP_NAME?.trim() || 'Handover HQ',
  appUrl: import.meta.env.VITE_APP_URL?.trim() || '',
  supabaseUrl,
  supabaseAnonKey,
  hasSupabase:
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('your-project') &&
    !supabaseAnonKey.includes('your-anon-key'),
};
