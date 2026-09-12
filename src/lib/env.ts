/**
 * Universal environment variable resolver for Cloudflare Workers, Vercel, Node, and browser.
 * On Cloudflare Workers with nodejs_compat, process.env is initially empty, and
 * Cloudflare injects runtime bindings into globalThis.__env__ on each fetch event.
 */

function resolveValue(val: any): string | undefined {
  if (!val) return undefined;
  const str = String(val).trim();
  if (str === "" || str === "undefined" || str === "null") return undefined;
  return str;
}

export function getEnv(key: string): string | undefined {
  let val: string | undefined;

  // 1. Check Cloudflare Worker global environment
  const cfEnv = (globalThis as any).__env__ || (globalThis as any).env;
  if (cfEnv && typeof cfEnv === "object") {
    val = resolveValue(cfEnv[key]);
    if (val) return val;
    
    if (key.startsWith("VITE_")) {
      val = resolveValue(cfEnv[key.slice(5)]);
      if (val) return val;
    } else {
      val = resolveValue(cfEnv[`VITE_${key}`]);
      if (val) return val;
    }
  }

  // 2. Check process.env (Node / Vercel / local dev / hydrated worker)
  if (typeof process !== "undefined" && process.env) {
    val = resolveValue(process.env[key]);
    if (val) return val;

    if (key.startsWith("VITE_")) {
      val = resolveValue(process.env[key.slice(5)]);
      if (val) return val;
    } else {
      val = resolveValue(process.env[`VITE_${key}`]);
      if (val) return val;
    }
  }

  // 3. Check import.meta.env (Vite client build-time defines)
  if (typeof import.meta !== "undefined" && (import.meta as any).env) {
    const metaEnv = (import.meta as any).env;
    val = resolveValue(metaEnv[key]);
    if (val) return val;

    if (key.startsWith("VITE_")) {
      val = resolveValue(metaEnv[key.slice(5)]);
      if (val) return val;
    } else {
      val = resolveValue(metaEnv[`VITE_${key}`]);
      if (val) return val;
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
