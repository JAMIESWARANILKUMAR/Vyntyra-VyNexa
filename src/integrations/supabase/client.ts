import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = "https://nitjxrrzcibpxlftndeh.supabase.co";
const FALLBACK_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pdGp4cnJ6Y2licHhsZnRuZGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MTM1ODUsImV4cCI6MjA5OTE4OTU4NX0.Kix5zsat69WbQp2sa3Z-PZ6nMdqlxggxfcJbZQ3e4CI";

const supabaseUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== "undefined" &&
    (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)) ||
  FALLBACK_URL;

const supabaseKey =
  (typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY) ||
  (typeof process !== "undefined" &&
    (process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_KEY ||
      process.env.VITE_SUPABASE_KEY)) ||
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
