import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/admin")({
  head: () => ({ meta: [{ title: "Super Admin Sign In — Vyntyra" }] }),
  component: AdminAuthPage,
});

function AdminAuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id);
        const role = roles?.[0]?.role;
        if (role === 'employee') navigate({ to: "/employee" });
        else if (role === 'intern') navigate({ to: "/intern" });
        else navigate({ to: "/admin" });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back, Administrator");
        
        // Navigation is handled by onAuthStateChange listener
    } catch(error: any) {
        toast.error(error.message);
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-slate-950">
      {/* Animated Background Orbs (Corporate Theme) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/30 blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gold/15 blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute top-[40%] right-[-20%] w-[30%] h-[30%] rounded-full bg-secondary/20 blur-[120px] animate-pulse" style={{ animationDuration: '5s' }} />
      
      <div className="w-full max-w-md relative z-10" style={{ animation: 'fadeInUp 0.8s ease-out forwards' }}>
        <a href="/" className="flex flex-col items-center justify-center mb-8 group">
          <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            <img src="https://vyntyraconsultancyservices.in/logo.png" alt="Vyntyra" className="h-14 w-auto drop-shadow-md" />
          </div>
          <span className="mt-4 text-white/50 tracking-[0.2em] uppercase text-[10px] font-bold group-hover:text-white/90 transition-colors duration-300">Vyntyra Connect</span>
        </a>

        <div className="backdrop-blur-2xl bg-slate-900/40 border border-white/10 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 text-[10px] text-gold uppercase tracking-widest font-bold mb-6">
              <Shield className="h-3.5 w-3.5" /> Super Admin Portal
            </div>
            <h1 className="font-serif text-3xl font-semibold text-white text-center mb-1">Authorised Sign In</h1>
            <p className="text-sm text-slate-400 text-center mb-8">System operations and management</p>

            <form onSubmit={handleSignIn} className="space-y-5">
              <div className="space-y-1.5 group">
                <Label className="text-[10px] uppercase tracking-widest text-slate-400 group-focus-within:text-gold transition-colors ml-1">Email Address</Label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 h-5 w-5 text-slate-500 group-focus-within:text-gold transition-colors" />
                  <Input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="bg-black/40 border-white/10 text-white placeholder:text-slate-600 focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all rounded-xl h-14 pl-12 pr-4 text-base"
                    placeholder="admin@vyntyra.in"
                  />
                </div>
              </div>

              <div className="space-y-1.5 group">
                <Label className="text-[10px] uppercase tracking-widest text-slate-400 group-focus-within:text-gold transition-colors ml-1">Password</Label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 h-5 w-5 text-slate-500 group-focus-within:text-gold transition-colors" />
                  <Input 
                    type="password" 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="bg-black/40 border-white/10 text-white placeholder:text-slate-600 focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all rounded-xl h-14 pl-12 pr-4 text-base"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 mt-4 bg-gold hover:bg-gold/90 text-primary font-bold tracking-wide rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all duration-300"
              >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Authenticate"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
