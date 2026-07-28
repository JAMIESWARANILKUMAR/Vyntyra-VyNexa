import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { routeTree } from "./routeTree.gen";

if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const [resource, config] = args;
    
    let url = "";
    if (typeof resource === "string") {
      url = resource;
    } else if (resource instanceof Request) {
      url = resource.url;
    }

    if (url.includes("/_server")) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        // If resource is a Request, we need to clone it to modify headers
        if (resource instanceof Request) {
          const newHeaders = new Headers(resource.headers);
          newHeaders.set("Authorization", `Bearer ${session.access_token}`);
          
          // Combine original config headers if any
          if (config?.headers) {
             const configHeaders = new Headers(config.headers);
             configHeaders.forEach((value, key) => newHeaders.set(key, value));
          }
          
          const newRequest = new Request(resource, {
            ...config,
            headers: newHeaders
          });
          return originalFetch(newRequest);
        } else {
          const newConfig = config || {};
          const headers = new Headers(newConfig.headers);
          headers.set("Authorization", `Bearer ${session.access_token}`);
          newConfig.headers = headers;
          return originalFetch(resource, newConfig);
        }
      }
    }
    return originalFetch(...args);
  };
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
