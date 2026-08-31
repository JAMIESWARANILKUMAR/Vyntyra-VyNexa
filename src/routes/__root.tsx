import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { PwaRegister } from "@/components/pwa-register";
import { Footer } from "@/components/footer";
import { Analytics } from "@vercel/analytics/react";
import { GLOBAL_SEO_META_TAGS, SCHEMA_ORGANIZATION_JSON_LD } from "@/lib/seo-metadata";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-serif font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-secondary"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("Root ErrorComponent caught:", error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-xl font-semibold text-foreground">This page didn't load</h1>
        <p className="text-sm text-muted-foreground">
          {error?.message || "Something went wrong. Try refreshing or head back home."}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              try {
                router.invalidate();
                reset();
              } catch {
                window.location.reload();
              }
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-secondary transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            Reload Page
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0B1E3F" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "VyNexa Connect" },
      { title: "Careers at Project VyNexa — Vyntyra Consultancy Services" },
      {
        name: "description",
        content:
          "Apply to Project VyNexa — a next-generation search engine by Vyntyra Consultancy Services. Secure corporate careers portal.",
      },
      { name: "author", content: "Vyntyra Consultancy Services" },
      { property: "og:title", content: "Careers at Project VyNexa — Vyntyra Consultancy Services" },
      {
        property: "og:description",
        content:
          "Apply to Project VyNexa — a next-generation search engine by Vyntyra Consultancy Services. Secure corporate careers portal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Careers at Project VyNexa — Vyntyra Consultancy Services" },
      { name: "twitter:description", content: "Apply to Project VyNexa — a next-generation search engine by Vyntyra Consultancy Services. Secure corporate careers portal." },
      { property: "og:image", content: "/icon-512.png" },
      { name: "twitter:image", content: "/icon-512.png" },
      ...GLOBAL_SEO_META_TAGS,
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: SCHEMA_ORGANIZATION_JSON_LD,
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/icon-512.png", type: "image/png" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/icon-512.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Serif:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function PageLoadingIndicator() {
  const isLoading = useRouterState({ select: (s) => s.status === 'pending' });
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-background/95 backdrop-blur-md">
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex items-center justify-center w-20 h-20">
           <div className="absolute inset-0 rounded-full border-2 border-t-gold border-r-primary border-b-secondary border-l-transparent animate-spin" style={{ animationDuration: '3s' }} />
           <div className="absolute inset-2 rounded-full border-2 border-b-gold/70 border-l-primary/70 border-t-secondary/70 border-r-transparent animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
           <img src="/icon-512.png" className="w-8 h-8 object-contain animate-pulse" alt="Loading" />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold animate-pulse">Loading Workspace</p>
      </div>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Hide public chrome on dashboard pages
  const isDashboard = 
    pathname.startsWith("/admin") ||
    pathname.startsWith("/employee") ||
    pathname.startsWith("/intern") ||
    pathname.startsWith("/cms") ||
    pathname.startsWith("/templates");

  return (
    <QueryClientProvider client={queryClient}>
      <PwaRegister />
      <PageLoadingIndicator />
      <div className={`flex min-h-screen flex-col flex-1 w-full relative ${!isDashboard ? "pb-14 md:pb-0" : ""}`}>
        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>
        {!isDashboard && <Footer />}
      </div>
      <Toaster position="top-center" richColors />
      <Analytics />
    </QueryClientProvider>
  );
}

