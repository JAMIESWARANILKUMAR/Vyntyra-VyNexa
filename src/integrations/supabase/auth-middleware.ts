import { createMiddleware } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { supabase } from './client';
import { redirect, isRedirect } from '@tanstack/react-router'

export const requireSupabaseAuth = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const request = getRequest();

    if (!request?.headers) {
      throw redirect({ to: '/' });
    }

    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      throw redirect({ to: '/' });
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw redirect({ to: '/' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw redirect({ to: '/' });
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
           throw redirect({ to: '/' });
        }

        return next({
            context: {
                userId: user.id,
                user: user,
            },
        });
    } catch (error) {
        if (isRedirect(error)) {
            throw error;
        }
        console.error("Supabase auth verification error", error);
        throw redirect({ to: '/' });
    }
  },
);
