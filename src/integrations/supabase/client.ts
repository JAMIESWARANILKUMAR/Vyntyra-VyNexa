import { createClient } from '@supabase/supabase-js';
import { getEnv, syncProcessEnv } from '@/lib/env';

syncProcessEnv();

const FALLBACK_URL = "https://yvcocxnucmqxigrgkzha.supabase.co";
const FALLBACK_KEY = "sb_publishable_tPu7MwjyM1jh0TLGDr7-CA_biaOnQp8";

const supabaseUrl =
  getEnv("SUPABASE_URL") ||
  getEnv("VITE_SUPABASE_URL") ||
  FALLBACK_URL;

const supabaseKey =
  getEnv("SUPABASE_PUBLISHABLE_KEY") ||
  getEnv("VITE_SUPABASE_PUBLISHABLE_KEY") ||
  getEnv("SUPABASE_ANON_KEY") ||
  getEnv("VITE_SUPABASE_ANON_KEY") ||
  getEnv("SUPABASE_KEY") ||
  getEnv("VITE_SUPABASE_KEY") ||
  FALLBACK_KEY;

const isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
    detectSessionInUrl: isBrowser,
    storage: isBrowser
      ? undefined
      : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        },
  },
  global: {
    fetch: (...args) => fetch(...args),
  },
});
