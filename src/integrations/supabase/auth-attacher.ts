import { createMiddleware } from '@tanstack/react-start'
import { supabase } from './client'

// Must be registered as a global `functionMiddleware` in `src/start.ts`; otherwise
// the browser never attaches the bearer token to serverFn RPCs.
export const attachSupabaseAuth = createMiddleware({ type: 'function' }).client(
  async ({ next }) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || null;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  },
)
