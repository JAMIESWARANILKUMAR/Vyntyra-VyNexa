import { createClient } from '@supabase/supabase-js';
import { getEnv, syncProcessEnv } from '@/lib/env';

const FALLBACK_URL = "https://yvcocxnucmqxigrgkzha.supabase.co";
const FALLBACK_KEY = "sb_publishable_tPu7MwjyM1jh0TLGDr7-CA_biaOnQp8";

export function getAdminClient() {
  syncProcessEnv();

  const supabaseUrl =
    getEnv("SUPABASE_URL") ||
    getEnv("VITE_SUPABASE_URL") ||
    FALLBACK_URL;

  const supabaseServiceKey =
    getEnv("SUPABASE_SERVICE_ROLE_KEY") ||
    getEnv("VITE_SUPABASE_SERVICE_ROLE_KEY") ||
    getEnv("SUPABASE_SERVICE_KEY") ||
    getEnv("VITE_SUPABASE_SERVICE_KEY") ||
    getEnv("SUPABASE_PUBLISHABLE_KEY") ||
    getEnv("VITE_SUPABASE_PUBLISHABLE_KEY") ||
    getEnv("SUPABASE_ANON_KEY") ||
    getEnv("VITE_SUPABASE_ANON_KEY") ||
    FALLBACK_KEY;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      },
    },
    global: {
      fetch: (...args) => fetch(...args),
    },
  });
}
