import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Admin Sign In — Vyntyra Careers" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back");
    navigate({ to: "/admin" });
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <a href="/" className="flex items-center justify-center mb-8">
          <div className="bg-white rounded-md p-3 shadow-corp">
            <img src="/favicon.png" alt="Vyntyra" className="h-14 w-auto" />
          </div>
        </a>

        <div className="bg-card rounded-xl shadow-corp p-8">
          <div className="flex items-center gap-2 text-xs text-secondary uppercase tracking-widest font-medium mb-3">
            <Shield className="h-3.5 w-3.5" /> Restricted Access
          </div>
          <h1 className="font-serif text-2xl font-semibold text-primary">Sign in</h1>
          <p className="text-sm text-muted-foreground mt-1">Authorised HR personnel only.</p>

          <form onSubmit={handleSignIn} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-secondary">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</> : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            Admin accounts are provisioned by the platform team.
          </p>
        </div>

        <a href="/" className="block text-center mt-6 text-sm text-primary-foreground/70 hover:text-gold">← Back to careers</a>
      </div>
    </div>
  );
}
