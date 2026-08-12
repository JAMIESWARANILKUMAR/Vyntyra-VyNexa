import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SmartAvatar } from "@/components/SmartAvatar";
import { Sparkles, Award, Rocket, CheckCircle2, ShieldCheck, Heart, PartyPopper } from "lucide-react";

interface FirstLoginWelcomeModalProps {
  user: {
    id: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
    role?: string;
    department?: string;
    position?: string;
    employee_id?: string;
    intern_id?: string;
  } | null;
}

export function FirstLoginWelcomeModal({ user }: FirstLoginWelcomeModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || !user.id) return;
    const storageKey = `vy_first_login_seen_${user.id}`;
    const alreadySeen = localStorage.getItem(storageKey);

    if (!alreadySeen) {
      // Show modal on first time login
      setOpen(true);
    }
  }, [user]);

  const handleClose = () => {
    if (user?.id) {
      localStorage.setItem(`vy_first_login_seen_${user.id}`, "true");
    }
    setOpen(false);
  };

  if (!user) return null;

  const roleTitle = user.role === "intern" ? "Industrial Intern" : user.role === "employee" ? "Official Team Member" : "Portal User";
  const userCode = user.intern_id || user.employee_id || user.email;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-0 bg-transparent shadow-2xl">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 border border-indigo-500/30 text-white p-6 sm:p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
          
          {/* Animated Background Rays & Light Effects */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

          {/* Top Badge */}
          <div className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-emerald-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider shadow-lg animate-bounce">
            <PartyPopper className="h-4 w-4 text-amber-400" /> Welcome to Vyntyra Consultancy Services
          </div>

          {/* Avatar with Animated Pulse Rings */}
          <div className="relative flex justify-center pt-2">
            <div className="relative">
              <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-indigo-500 via-amber-400 to-emerald-400 opacity-75 blur-md animate-spin" style={{ animationDuration: '6s' }} />
              <SmartAvatar
                src={user.avatar_url}
                alt={user.full_name}
                fallbackInitials={(user.full_name || user.email || "V")[0]}
                className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full border-4 border-slate-900 shadow-2xl object-cover"
              />
              <div className="absolute bottom-0 right-0 bg-emerald-500 text-slate-950 p-1.5 rounded-full border-2 border-slate-900 shadow-lg">
                <CheckCircle2 className="h-4 w-4 stroke-[3]" />
              </div>
            </div>
          </div>

          {/* Congratulations Greeting */}
          <div className="relative space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-emerald-200 tracking-tight">
              Congratulations, {user.full_name || "Welcome"}!
            </h2>
            <div className="text-xs font-semibold text-indigo-300 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> {roleTitle} &middot; {userCode}
            </div>
          </div>

          {/* Welcome Message Card */}
          <div className="relative p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-xs sm:text-sm text-slate-300 leading-relaxed text-left space-y-2">
            <p className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <span>We are thrilled to welcome you to <strong>Vyntyra</strong>! Your official profile and digital workstation have been successfully activated.</span>
            </p>
            <p className="flex items-start gap-2 text-slate-400 text-xs pt-1">
              <Award className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Access your assigned tasks, attendance logs, verifiable credentials, and interactive tools directly in your dashboard.</span>
            </p>
          </div>

          {/* Action Button */}
          <div className="relative pt-2">
            <Button
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-600 hover:from-indigo-600 hover:to-emerald-700 text-white font-bold h-12 rounded-xl text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 group transition-all transform hover:scale-[1.02]"
            >
              <Rocket className="h-4 w-4 group-hover:translate-x-1 transition-transform" /> Explore My Workstation Dashboard
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
