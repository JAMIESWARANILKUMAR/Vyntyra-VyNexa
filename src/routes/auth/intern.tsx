import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/intern")({
  head: () => ({ meta: [{ title: "Intern Portal — Vyntyra" }] }),
  component: InternAuthPage,
});

function InternAuthPage() {
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
        else if (role === 'admin') navigate({ to: "/admin" });
        else navigate({ to: "/intern" });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
        const { error } = await supabase.auth.signInWithPassword({ 
          email: email.trim(), 
          password: password.trim() 
        });
        if (error) throw error;
        toast.success("Welcome back to your workspace");
    } catch(error: any) {
        toast.error(error.message);
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-slate-900">
      {/* Animated Background Orbs (Intern Theme - Emerald/Green) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/20 blur-[120px] animate-pulse" style={{ animationDuration: '4.5s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-400/20 blur-[120px] animate-pulse" style={{ animationDuration: '6.5s' }} />
      
      <div className="w-full max-w-md relative z-10" style={{ animation: 'fadeInUp 0.8s ease-out forwards' }}>
        <a href="/" className="flex flex-col items-center justify-center mb-8 group">
          <div className="bg-slate-800/80 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-4 shadow-[0_0_20px_rgba(16,185,129,0.15)] transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-2 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <img src="/icon-512.png" alt="Vyntyra" className="h-14 w-auto drop-shadow-sm" />
          </div>
          <span className="mt-4 text-emerald-400/60 tracking-[0.2em] uppercase text-[10px] font-bold group-hover:text-emerald-400 transition-colors duration-300">Vyntyra Connect</span>
        </a>

        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 text-[10px] text-emerald-400 uppercase tracking-widest font-bold mb-6">
              <GraduationCap className="h-4 w-4" /> Intern Portal
            </div>
            <h1 className="font-serif text-3xl font-bold text-white text-center mb-1">Hello there!</h1>
            <p className="text-sm text-slate-400 text-center mb-8">Sign in to track your internship progress</p>

            <form onSubmit={handleSignIn} className="space-y-5">
              <div className="space-y-1.5 group">
                <Label className="text-[10px] uppercase tracking-widest text-slate-400 group-focus-within:text-emerald-400 transition-colors ml-1">Email Address</Label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  <Input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all rounded-xl h-14 pl-12 pr-4 text-base"
                    placeholder="intern@vyntyra.in"
                  />
                </div>
              </div>

              <div className="space-y-1.5 group">
                <Label className="text-[10px] uppercase tracking-widest text-slate-400 group-focus-within:text-emerald-400 transition-colors ml-1">Password</Label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  <Input 
                    type="password" 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all rounded-xl h-14 pl-12 pr-4 text-base"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold tracking-wide rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all duration-300"
              >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Sign In"}
              </Button>
            </form>

            {/* Support Contact */}
            <div className="mt-8 pt-6 border-t border-slate-700/50 flex flex-col items-center text-center">
              <span className="text-xs text-slate-400 mb-2">Need support? Contact your administrator</span>
              <a 
                href="mailto:hr@vyntyraconsultancyservices.in" 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors group"
              >
                hr@vyntyraconsultancyservices.in
                <ArrowRight className="h-3.5 w-3.5 -translate-x-1 group-hover:translate-x-0 transition-transform duration-300" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
