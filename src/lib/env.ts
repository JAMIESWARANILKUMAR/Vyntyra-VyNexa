/**
 * Universal environment variable resolver for Cloudflare Workers, Vercel, Node, and browser.
 * On Cloudflare Workers with nodejs_compat, process.env is initially empty, and
 * Cloudflare injects runtime bindings into globalThis.__env__ on each fetch event.
 */

export function getEnv(key: string): string | undefined {
  // 1. Check Cloudflare Worker global environment
  const cfEnv = (globalThis as any).__env__ || (globalThis as any).env;
  if (cfEnv && typeof cfEnv === "object") {
    if (cfEnv[key]) return String(cfEnv[key]);
    if (key.startsWith("VITE_")) {
      const bare = key.slice(5);
      if (cfEnv[bare]) return String(cfEnv[bare]);
    } else {
      const viteKey = `VITE_${key}`;
      if (cfEnv[viteKey]) return String(cfEnv[viteKey]);
    }
  }

  // 2. Check process.env (Node / Vercel / local dev / hydrated worker)
  if (typeof process !== "undefined" && process.env) {
    if (process.env[key]) return String(process.env[key]);
    if (key.startsWith("VITE_")) {
      const bare = key.slice(5);
      if (process.env[bare]) return String(process.env[bare]);
    } else {
      const viteKey = `VITE_${key}`;
      if (process.env[viteKey]) return String(process.env[viteKey]);
    }
  }

  // 3. Check import.meta.env (Vite client build-time defines)
  if (typeof import.meta !== "undefined" && (import.meta as any).env) {
    const metaEnv = (import.meta as any).env;
    if (metaEnv[key]) return String(metaEnv[key]);
    if (key.startsWith("VITE_")) {
      const bare = key.slice(5);
      if (metaEnv[bare]) return String(metaEnv[bare]);
    } else {
      const viteKey = `VITE_${key}`;
      if (metaEnv[viteKey]) return String(metaEnv[viteKey]);
    }
  }

  return undefined;
}

/**
 * Synchronizes Cloudflare Worker bindings into process.env so third-party
 * libraries that read process.env directly will always find them.
 */
export function syncProcessEnv(envObj?: unknown): void {
  const source = envObj || (globalThis as any).__env__ || (globalThis as any).env;
  if (!source || typeof source !== "object") return;

  if (!globalThis.process) {
    (globalThis as any).process = { env: {} };
  } else if (!globalThis.process.env) {
    (globalThis.process as any).env = {};
  }

  for (const [k, v] of Object.entries(source as Record<string, any>)) {
    if (typeof v === "string") {
      if (!globalThis.process.env[k]) globalThis.process.env[k] = v;
      if (k.startsWith("VITE_")) {
        const bare = k.replace("VITE_", "");
        if (!globalThis.process.env[bare]) globalThis.process.env[bare] = v;
      } else {
        const viteKey = `VITE_${k}`;
        if (!globalThis.process.env[viteKey]) globalThis.process.env[viteKey] = v;
      }
    }
  }
}
