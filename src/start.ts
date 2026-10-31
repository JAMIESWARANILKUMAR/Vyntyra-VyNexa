import { createStart, createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { syncProcessEnv } from "@/lib/env";

const envMiddleware = createMiddleware().server(async ({ next }) => {
  syncProcessEnv();
  return next();
});

// Security Shield: Drop common vulnerability scans & malicious probes before SSR
const securityShieldMiddleware = createMiddleware().server(async ({ next }) => {
  const request = getRequest();
  if (!request?.url) return next();

  let pathname = "";
  try {
    pathname = new URL(request.url).pathname.toLowerCase();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  // 1. Secret files & credential probes (.env, .aws, .ssh, .sql backups, etc.)
  const isSecretProbe =
    /\.(env|aws|ssh|secrets|sql|bak|old|swp|ini|cfg|conf|pem|key|crt|yml|yaml)(\/|$)/i.test(pathname) ||
    pathname.includes(".env") ||
    pathname.includes("wp-config") ||
    pathname.includes("id_rsa") ||
    pathname.includes("id_dsa") ||
    pathname.includes("credentials") ||
    pathname.includes("database.yml");

  // 2. Source control probes (.git, .svn, .hg, etc.)
  const isSourceControlProbe =
    pathname.startsWith("/.git") ||
    pathname.startsWith("/.svn") ||
    pathname.startsWith("/.hg") ||
    pathname.startsWith("/.bzr");

  // 3. Debug & admin profiling endpoints
  const isDebugProbe =
    pathname.startsWith("/_profiler") ||
    pathname.startsWith("/actuator") ||
    pathname.startsWith("/phpinfo") ||
    pathname.startsWith("/__inspect") ||
    pathname.startsWith("/server-status") ||
    pathname.startsWith("/_next/debug") ||
    pathname.includes("phpunit") ||
    pathname.includes("telescope");

  // 4. Known scanner paths
  const isScannerProbe =
    pathname.includes("nice%20ports") ||
    pathname.includes("nice ports") ||
    pathname.startsWith("/cgi-bin") ||
    pathname.startsWith("/owa") ||
    pathname.startsWith("/solr") ||
    pathname.startsWith("/invoker") ||
    pathname.startsWith("/jmx-console") ||
    pathname.startsWith("/manager/html");

  // 5. Filesystem traversal attacks
  const isFilesystemProbe =
    pathname.includes("..") ||
    pathname.includes("/etc/passwd") ||
    pathname.includes("/etc/shadow") ||
    pathname.includes("/win.ini") ||
    pathname.includes("/boot.ini") ||
    pathname.includes("/proc/self") ||
    pathname.includes("/windows/system32");

  if (isSecretProbe || isSourceControlProbe || isDebugProbe || isScannerProbe || isFilesystemProbe) {
    return new Response("Not Found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store",
      },
    });
  }

  return next();
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error: any) {
    if (error != null && typeof error === "object") {
      const statusCode = error.statusCode || (error.name === "AuthError" ? 401 : null);
      if (statusCode && statusCode < 500) {
        return new Response(JSON.stringify({ error: error.message || "Unauthorized", statusCode }), {
          status: statusCode,
          headers: { 
            "content-type": "application/json",
            "X-Content-Type-Options": "nosniff" 
          },
        });
      }
    }
    console.error(error);
    return new Response(renderErrorPage(error), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [securityShieldMiddleware, envMiddleware, errorMiddleware],
}));
