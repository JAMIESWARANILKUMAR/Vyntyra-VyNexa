/**
 * Cloudflare D1 Database Helper & Types for TanStack Start
 * 
 * Standardizes access to Cloudflare D1 so server functions (`createServerFn`)
 * can read the `context.cloudflare?.env?.DB` binding safely without crashing
 * when run locally, on Vercel, or during build-time SSR.
 */

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta: Record<string, unknown>;
  error?: string;
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

/**
 * Safely retrieves the Cloudflare D1 database binding.
 * 
 * @param context - The context object passed into createServerFn handler,
 *                  typically containing `context.cloudflare?.env?.DB`.
 * @returns The D1Database instance if available, or null if running in an
 *          environment without the binding (e.g. local Node, Vercel, SSR build).
 */
export function getD1Database(context?: any): D1Database | null {
  if (!context && typeof globalThis === "undefined") {
    return null;
  }

  // 1. Check TanStack Start Cloudflare context: context.cloudflare?.env?.DB
  if (context?.cloudflare?.env?.DB) {
    return context.cloudflare.env.DB as D1Database;
  }

  // 2. Direct env on context: context.env?.DB
  if (context?.env?.DB) {
    return context.env.DB as D1Database;
  }

  // 3. Fallback to globalThis environment if running inside a Worker
  const g = globalThis as any;
  if (g?.__env__?.DB) {
    return g.__env__.DB as D1Database;
  }
  if (g?.DB && typeof g.DB.prepare === "function") {
    return g.DB as D1Database;
  }

  return null;
}
