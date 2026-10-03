/**
 * Ultra-fast edge memory cache for Cloudflare Workers & TanStack Start Server Functions.
 * Eliminates redundant Supabase API hits and keeps Worker CPU time well under Cloudflare's 10ms free-tier limit.
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

/**
 * Retrieves data from the in-memory edge cache if valid, or invokes the fetcher and caches the result.
 * @param key Unique cache key
 * @param ttlMs Time-to-live in milliseconds
 * @param fetcher Async function to fetch fresh data if cache missed
 */
export async function getOrSetCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const cached = memoryCache.get(key);
  if (cached && cached.expiry > now) {
    return cached.data;
  }
  const freshData = await fetcher();
  memoryCache.set(key, { data: freshData, expiry: now + ttlMs });
  return freshData;
}

/**
 * Clears cached entries matching the specified prefix, or clears all entries if no prefix is given.
 * @param keyPrefix Optional key prefix to target specific cache entries
 */
export function invalidateCache(keyPrefix?: string) {
  if (!keyPrefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(keyPrefix)) {
      memoryCache.delete(key);
    }
  }
}
