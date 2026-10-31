import { createMiddleware } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { supabase } from './client';

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

export const requireSupabaseAuth = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const request = getRequest();

    if (!request?.headers) {
      throw new AuthError('Unauthorized: No request headers available', 401);
    }

    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      throw new AuthError('Unauthorized: No authorization header provided', 401);
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new AuthError('Unauthorized: Only Bearer tokens are supported', 401);
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new AuthError('Unauthorized: No token provided', 401);
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        throw new AuthError('Unauthorized: Invalid or expired token', 401);
      }

      return next({
        context: {
          userId: user.id,
          user: user,
        },
      });
    } catch (error: any) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Unauthorized: Invalid token', 401);
    }
  },
);
