import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Briefcase, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/employee")({
  head: () => ({ meta: [{ title: "Employee Portal — Vyntyra" }] }),
  component: EmployeeAuthPage,
});

function EmployeeAuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id);
        const role = roles?.[0]?.role;
        if (role === 'intern') navigate({ to: "/intern" });
        else if (role === 'admin') navigate({ to: "/admin" });
        else navigate({ to: "/employee" });
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
        toast.success("Welcome back to your workspace");
    } catch(error: any) {
        toast.error(error.message);
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-slate-50">
      {/* Animated Background Orbs (Employee Theme - Blues) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-300/40 blur-[120px] animate-pulse" style={{ animationDuration: '5s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-300/40 blur-[120px] animate-pulse" style={{ animationDuration: '7s' }} />
      
      <div className="w-full max-w-md relative z-10" style={{ animation: 'fadeInUp 0.8s ease-out forwards' }}>
        <a href="/" className="flex flex-col items-center justify-center mb-8 group">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-lg transform transition-all duration-500 group-hover:scale-110 group-hover:-rotate-2 group-hover:shadow-xl">
            <img src="/icon-512.png" alt="Vyntyra" className="h-14 w-auto drop-shadow-sm" />
          </div>
          <span className="mt-4 text-slate-500 tracking-[0.2em] uppercase text-[10px] font-bold group-hover:text-blue-600 transition-colors duration-300">Vyntyra Connect</span>
        </a>

        <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 text-[10px] text-blue-600 uppercase tracking-widest font-bold mb-6">
              <Briefcase className="h-3.5 w-3.5" /> Employee Workspace
            </div>
            <h1 className="font-serif text-3xl font-bold text-slate-900 text-center mb-1">Welcome Back</h1>
            <p className="text-sm text-slate-500 text-center mb-8">Sign in to access your dashboard</p>

            <form onSubmit={handleSignIn} className="space-y-5">
              <div className="space-y-1.5 group">
                <Label className="text-[10px] uppercase tracking-widest text-slate-500 group-focus-within:text-blue-600 transition-colors ml-1">Email Address</Label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all rounded-xl h-14 pl-12 pr-4 text-base"
                    placeholder="name@vyntyra.in"
                  />
                </div>
              </div>

              <div className="space-y-1.5 group">
                <Label className="text-[10px] uppercase tracking-widest text-slate-500 group-focus-within:text-blue-600 transition-colors ml-1">Password</Label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input 
                    type="password" 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all rounded-xl h-14 pl-12 pr-4 text-base"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
              >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Sign In to Workspace"}
              </Button>
            </form>

            {/* Support Contact */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center text-center">
              <span className="text-xs text-slate-500 mb-2">Need support? Contact your administrator</span>
              <a 
                href="mailto:hr@vyntyraconsultancyservices.in" 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors group"
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
