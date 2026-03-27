import { SUBMISSION_ASSET_BUCKET } from './constants';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';
const supabaseSubmissionBucket =
  import.meta.env.VITE_SUPABASE_SUBMISSION_BUCKET?.trim() || SUBMISSION_ASSET_BUCKET;

export const appEnv = {
  appName: import.meta.env.VITE_APP_NAME?.trim() || 'Handover HQ',
  appUrl: import.meta.env.VITE_APP_URL?.trim() || '',
  supabaseUrl,
  supabaseAnonKey,
  supabaseSubmissionBucket,
  hasSupabase:
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('your-project') &&
    !supabaseAnonKey.includes('your-anon-key'),
};
