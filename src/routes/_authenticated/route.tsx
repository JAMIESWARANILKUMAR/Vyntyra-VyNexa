import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { clearAllCookies } from "@/lib/cookie-maintenance";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function verifyAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          const storedExpiry = localStorage.getItem("vyntyra_intern_session_expiry");
          const isInternSessionExpired = storedExpiry && Date.now() > Number(storedExpiry);

          if (!session || isInternSessionExpired) {
            if (isInternSessionExpired) {
              localStorage.removeItem("vyntyra_intern_session_id");
              localStorage.removeItem("vyntyra_intern_session_expiry");
              clearAllCookies();
              await supabase.auth.signOut().catch(() => {});
            }
            setIsAuthenticated(false);
            setChecking(false);
            const p = location.pathname;
            const isAdminRoute = p.startsWith("/admin") || p === "/cms" || p === "/templates";
            const isInternRoute = p.startsWith("/intern") || p.startsWith("/cbt");
            navigate({ to: isAdminRoute ? "/auth/admin" : isInternRoute ? "/auth/intern" : "/auth/employee" });
          } else {
            setIsAuthenticated(true);
            setChecking(false);
          }
        }
      } catch (err) {
        if (mounted) {
          setChecking(false);
        }
      }
    }

    verifyAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "SIGNED_OUT" || !session) {
        clearAllCookies();
        setIsAuthenticated(false);
        const p = location.pathname;
        const isAdminRoute = p.startsWith("/admin") || p === "/cms" || p === "/templates";
        const isInternRoute = p.startsWith("/intern") || p.startsWith("/cbt");
        navigate({ to: isAdminRoute ? "/auth/admin" : isInternRoute ? "/auth/intern" : "/auth/employee" });
      } else if (session) {
        setIsAuthenticated(true);
        setChecking(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Outlet />;
}
