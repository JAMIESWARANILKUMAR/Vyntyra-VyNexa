import { createClient } from '@supabase/supabase-js';
import { getEnv, syncProcessEnv } from '@/lib/env';

const FALLBACK_URL = "https://nitjxrrzcibpxlftndeh.supabase.co";
const FALLBACK_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pdGp4cnJ6Y2licHhsZnRuZGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MTM1ODUsImV4cCI6MjA5OTE4OTU4NX0.Kix5zsat69WbQp2sa3Z-PZ6nMdqlxggxfcJbZQ3e4CI";

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
