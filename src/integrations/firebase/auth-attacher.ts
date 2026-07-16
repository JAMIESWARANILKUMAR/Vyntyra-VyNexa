import { createMiddleware } from '@tanstack/react-start'
import { auth } from './client'

// Must be registered as a global `functionMiddleware` in `src/start.ts`; otherwise
// the browser never attaches the bearer token to serverFn RPCs.
export const attachFirebaseAuth = createMiddleware({ type: 'function' }).client(
  async ({ next }) => {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  },
)
