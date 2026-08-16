import { createMiddleware } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { supabase } from './client';

export const requireSupabaseAuth = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const request = getRequest();

    if (!request?.headers) {
      throw new Error('Unauthorized: No request headers available');
    }

    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      throw new Error('Unauthorized: No authorization header provided');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized: Only Bearer tokens are supported');
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new Error('Unauthorized: No token provided');
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
           throw new Error('Unauthorized: Invalid token');
        }

        return next({
            context: {
                userId: user.id,
                user: user,
            },
        });
    } catch (error) {
        console.error("Supabase auth verification error", error);
        throw new Error('Unauthorized: Invalid token');
    }
  },
);
