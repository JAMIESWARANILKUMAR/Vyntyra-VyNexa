import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema from './schema';

export function getDb() {
  const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
  const DATABASE_ID = process.env.CLOUDFLARE_DATABASE_ID;
  const TOKEN = process.env.CLOUDFLARE_D1_TOKEN;

  if (!ACCOUNT_ID || !DATABASE_ID || !TOKEN) {
    throw new Error('Missing Cloudflare D1 HTTP credentials in environment variables.');
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`;

  return drizzle(async (sql, params, method) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql,
          params,
        }),
      });

      const json = await response.json();
      if (!json.success) {
        throw new Error(json.errors?.[0]?.message || 'Cloudflare D1 error');
      }

      const result = json.result[0];

      if (method === 'run') {
        return {
          rows: result.results,
        };
      }

      return { rows: result.results };
    } catch (e) {
      console.error('D1 Query Error:', e);
      return { rows: [] };
    }
  }, { schema });
}

export const db = getDb();
