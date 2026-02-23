import { createClient } from '@supabase/supabase-js';

// Use safe fallbacks during build so static analysis does not crash when secrets are not injected.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://invalid.local';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-time-placeholder';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
