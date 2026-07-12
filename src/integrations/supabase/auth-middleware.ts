import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { getDb } from '@/db';
import { userRoles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const requireCloudflareAuth = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const request = getRequest();

    if (!request?.headers) {
      throw new Error('Unauthorized: No request headers available');
    }

    const email = request.headers.get('cf-access-authenticated-user-email');

    // For local development fallback if not behind Cloudflare
    const devToken = request.headers.get('authorization');
    const isLocal = process.env.NODE_ENV === 'development';

    if (!email && !(isLocal && devToken)) {
      throw new Error('Unauthorized: No Cloudflare Access token provided');
    }

    let userEmail = email;
    if (!email && isLocal && devToken) {
      userEmail = "admin@vyntyra.com"; // mock for local dev
    }

    if (!userEmail) {
      throw new Error('Unauthorized: Invalid user');
    }

    return next({
      context: {
        userEmail,
      },
    });
  },
);
