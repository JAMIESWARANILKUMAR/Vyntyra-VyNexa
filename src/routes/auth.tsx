import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Shield, Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // Fetch role to determine routing
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
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', (await supabase.auth.getUser()).data.user?.id);
        const role = roles?.[0]?.role;
        toast.success("Welcome back");
        
        if (role === 'employee') navigate({ to: "/employee" });
        else if (role === 'intern') navigate({ to: "/intern" });
        else navigate({ to: "/admin" });
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
          {/* subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 text-[10px] text-gold uppercase tracking-widest font-bold mb-6">
              <Shield className="h-3.5 w-3.5" /> Secure Portal
            </div>
            <h1 className="font-serif text-3xl font-semibold text-white text-center mb-1">Admin Sign In</h1>
            <p className="text-sm text-slate-400 text-center mb-8">Authorised HR personnel only</p>

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
                    autoComplete="email" 
                    className="bg-black/40 border-white/10 text-white placeholder:text-slate-600 focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all rounded-xl h-14 pl-12 pr-4 shadow-inner text-base"
                    placeholder="admin@vyntyra.in"
                  />
                </div>
              </div>
              <div className="space-y-1.5 group">
                <div className="flex justify-between items-center px-1">
                  <Label className="text-[10px] uppercase tracking-widest text-slate-400 group-focus-within:text-gold transition-colors">Secure Password</Label>
                  <a href="#" className="text-[10px] uppercase tracking-widest text-gold hover:text-gold/80 transition-colors">Forgot?</a>
                </div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 h-5 w-5 text-slate-500 group-focus-within:text-gold transition-colors" />
                  <Input 
                    type="password" 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    autoComplete="current-password" 
                    className="bg-black/40 border-white/10 text-white placeholder:text-slate-600 focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all rounded-xl h-14 pl-12 pr-4 shadow-inner text-base tracking-widest"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 px-1 py-2">
                <Checkbox id="remember" className="border-white/20 data-[state=checked]:bg-gold data-[state=checked]:border-gold data-[state=checked]:text-gold-foreground" />
                <label htmlFor="remember" className="text-xs text-slate-400 cursor-pointer select-none hover:text-slate-300 transition-colors">
                  Trust this device for 30 days
                </label>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gold hover:bg-gold/90 text-gold-foreground rounded-xl h-14 font-semibold tracking-wide transition-all duration-300 hover:shadow-[0_0_20px_rgba(201,162,39,0.3)] hover:-translate-y-0.5 mt-2 flex items-center justify-center gap-2 group">
                {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Authenticating…</> : <>Sign In <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
              </Button>
            </form>

            <p className="mt-8 text-[11px] uppercase tracking-widest text-slate-500 text-center border-t border-white/10 pt-6">
              Protected by Enterprise Grade Security
            </p>
          </div>
        </div>

        <a href="/" className="block text-center mt-8 text-sm text-slate-400 hover:text-white transition-colors duration-300 flex items-center justify-center gap-2 group">
          <span className="transform transition-transform duration-300 group-hover:-translate-x-1">←</span> Return to Careers
        </a>
      </div>
      
      {/* Global CSS for fadeInUp */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
