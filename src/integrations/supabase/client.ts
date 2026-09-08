import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)) ||
  "https://xvyqrqfslzfxhhnfsluq.supabase.co";

const supabaseKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY) ||
  (typeof process !== 'undefined' && (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY)) ||
  "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables.");
}

const isBrowser = typeof window !== 'undefined';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
  },
  global: {
    fetch: (...args) => fetch(...args),
  },
});
