import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  const error = consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`);
  console.error(error);
  return new Response(renderErrorPage(error), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    // Cloudflare Workers explicitly empty process.env for nodejs_compat.
    // Polyfill process.env with the env bindings for Tanstack Start and Supabase to work.
    if (!globalThis.process) {
      (globalThis as any).process = { env: {} };
    } else if (!globalThis.process.env) {
      (globalThis.process as any).env = {};
    }
    if (env && typeof env === "object") {
      Object.assign(globalThis.process.env, env);
      for (const [key, val] of Object.entries(env as Record<string, any>)) {
        if (typeof val === "string") {
          if (!globalThis.process.env[key]) globalThis.process.env[key] = val;
          if (key.startsWith("VITE_")) {
            const bare = key.replace("VITE_", "");
            if (!globalThis.process.env[bare]) globalThis.process.env[bare] = val;
          } else {
            const viteKey = `VITE_${key}`;
            if (!globalThis.process.env[viteKey]) globalThis.process.env[viteKey] = val;
          }
        }
      }
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(error), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
