import { createMiddleware } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

export const requireFirebaseAuth = createMiddleware({ type: 'function' }).server(
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

    // Dynamic import to avoid loading Firebase Admin on the client
    const { adminAuth } = await import('@/integrations/firebase/admin');
    
    if (!adminAuth) {
        throw new Error('Internal Server Error: Firebase Admin not initialized');
    }

    try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        
        return next({
            context: {
                userId: decodedToken.uid,
                claims: decodedToken,
            },
        });
    } catch (error) {
        console.error("Firebase auth verification error", error);
        throw new Error('Unauthorized: Invalid token');
    }
  },
);
