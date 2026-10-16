import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { GraduationCap, Mail, Lock, Loader2, ArrowRight, Sun, Heart, Sparkles, PartyPopper, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { listHolidays } from "@/lib/operations.functions";
import { recordInternLoginSessionFn } from "@/lib/cbt.functions";

export const Route = createFileRoute("/auth/intern")({
  head: () => ({ meta: [{ title: "Intern Portal — Vyntyra" }] }),
  component: InternAuthPage,
});

function InternAuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Holiday Alert Modal State
  const [todayHoliday, setTodayHoliday] = useState<any>(null);
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const fetchHolidays = useServerFn(listHolidays);
  const recordSession = useServerFn(recordInternLoginSessionFn);

  useEffect(() => {
    // Check if today is marked as a company or public holiday
    const checkTodayHoliday = async () => {
      try {
        const holidays = await fetchHolidays();
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        const match = (holidays || []).find((h: any) => {
          if (!h.date) return false;
          if (h.date === todayStr) return true;
          if (h.is_recurring && h.date.slice(5) === todayStr.slice(5)) return true;
          return false;
        });

        if (match) {
          setTodayHoliday(match);
          setHolidayModalOpen(true);
        }
      } catch (err) {
        console.warn("[Holiday Check Notice]:", err);
      }
    };

    checkTodayHoliday();
  }, []);

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
        const { data: authData, error } = await supabase.auth.signInWithPassword({ 
          email: email.trim(), 
          password: password.trim() 
        });
        if (error) throw error;

        // Generate a new cryptographically secured session ID on each login
        const newSessionId = "sess_" + crypto.randomUUID();
        const oneDayMs = 24 * 60 * 60 * 1000; // 24 hours
        const expiresAt = Date.now() + oneDayMs;

        // Securely store the 24-hour session token in localStorage & document cookie
        localStorage.setItem("vyntyra_intern_session_id", newSessionId);
        localStorage.setItem("vyntyra_intern_session_expiry", expiresAt.toString());
        localStorage.setItem("vyntyra_intern_session_started", Date.now().toString());

        try {
          document.cookie = `vyntyra_intern_session_id=${newSessionId}; max-age=86400; path=/; SameSite=Lax`;
          document.cookie = `vyntyra_intern_session_expiry=${expiresAt}; max-age=86400; path=/; SameSite=Lax`;
        } catch (_) {}

        // Record session to server audit logs
        try {
          await recordSession({
            data: {
              sessionId: newSessionId,
              expiresAt,
              userAgent: navigator.userAgent
            }
          });
        } catch (_) {}

        toast.success("Welcome back! Active session secured for 24 hours.");
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

      {/* Holiday Alert Dialog */}
      <Dialog open={holidayModalOpen} onOpenChange={setHolidayModalOpen}>
        <DialogContent className="max-w-md bg-slate-900 border border-emerald-500/40 text-white rounded-3xl p-6 shadow-2xl overflow-hidden relative">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

          <DialogHeader className="text-center space-y-3 relative z-10">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-500/30 to-emerald-500/30 border border-emerald-400/40 flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)] animate-bounce">
              <PartyPopper className="h-8 w-8 text-amber-400" />
            </div>
            <DialogTitle className="text-2xl font-black text-white tracking-wide">
              Official Holiday Today!
            </DialogTitle>
            <DialogDescription className="text-emerald-300 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5">
              <CalendarCheck className="h-4 w-4 text-emerald-400" />
              {todayHoliday?.name || "Company Holiday"} ({todayHoliday?.type || "Official"})
            </DialogDescription>
          </DialogHeader>

          <div className="my-5 p-5 bg-slate-800/80 border border-slate-700/60 rounded-2xl text-center relative z-10 space-y-3">
            <p className="text-base font-bold text-amber-200 leading-relaxed italic">
              "take a break yarr, your company has provided holiday enjoy with your family see you tommorrow."
            </p>
            {todayHoliday?.description && (
              <p className="text-xs text-slate-400 border-t border-slate-700/50 pt-2.5">
                {todayHoliday.description}
              </p>
            )}
          </div>

          <div className="space-y-2 relative z-10">
            <Button
              onClick={() => {
                setHolidayModalOpen(false);
                toast.info("Enjoy your holiday! Have a wonderful time with your family.");
              }}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20"
            >
              🎉 Enjoy the Holiday
            </Button>
            <Button
              variant="ghost"
              onClick={() => setHolidayModalOpen(false)}
              className="w-full text-xs text-slate-400 hover:text-white hover:bg-slate-800/60"
            >
              Continue to Workspace anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
