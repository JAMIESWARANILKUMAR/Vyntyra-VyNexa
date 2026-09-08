import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = "https://nitjxrrzcibpxlftndeh.supabase.co";
const FALLBACK_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pdGp4cnJ6Y2licHhsZnRuZGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MTM1ODUsImV4cCI6MjA5OTE4OTU4NX0.Kix5zsat69WbQp2sa3Z-PZ6nMdqlxggxfcJbZQ3e4CI";

export function getAdminClient() {
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || FALLBACK_URL;
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
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
