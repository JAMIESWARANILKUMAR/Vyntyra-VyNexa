import React, { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Ticket,
  Clock,
  CheckCircle2,
  Gift,
  Zap,
  ArrowRight,
  Share2,
  Copy,
  Users,
  ShieldCheck,
  Loader2,
  X,
} from "lucide-react";
import { submitAmbassadorApplication } from "@/lib/ambassador.functions";

interface AmbassadorComingSoonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
  defaultName?: string;
  defaultPhone?: string;
  defaultCollege?: string;
}

export function AmbassadorComingSoonModal({
  open,
  onOpenChange,
  defaultEmail = "",
  defaultName = "",
  defaultPhone = "",
  defaultCollege = "",
}: AmbassadorComingSoonModalProps) {
  const submitAppFn = useServerFn(submitAmbassadorApplication);

  const [fullName, setFullName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState(defaultPhone);
  const [collegeName, setCollegeName] = useState(defaultCollege);
  const [degreeBranch, setDegreeBranch] = useState("Engineering & Technology");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [passNumber, setPassNumber] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !collegeName) {
      toast.error("Please fill in all fields to reserve your priority spot.");
      return;
    }

    setLoading(true);
    try {
      const generatedPass = `VCS-IRA-${Math.floor(1000 + Math.random() * 9000)}`;
      await submitAppFn({
        data: {
          full_name: fullName,
          email,
          phone,
          college_name: collegeName,
          degree_branch: degreeBranch,
          graduation_year: "2026",
          city_state: "Campus Resident",
          motivation: `VIP Early-Bird Waitlist Pass: ${generatedPass}`,
        },
      });

      setPassNumber(generatedPass);
      setConfirmed(true);
      toast.success("Priority Spot Reserved! Welcome to First Cohort VIP Waitlist.");
    } catch (err: any) {
      toast.error(err.message || "Failed to reserve spot. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(
      `🚀 *I just reserved my VIP Priority Spot for the Vyntyra Campus Ambassador First Cohort 2026-27!*\n\nExclusive Welcome Kits, Branded Gadgets (Earbuds, Powerbanks, Watches), Rewards up to ₹15,000, and a Curated Travel Retreat for Top 10.\n\nPre-register before official applications open:\n👉 https://vyntyraconsultancyservices.in/campus-ambassador`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const copyLink = () => {
    navigator.clipboard.writeText("https://vyntyraconsultancyservices.in/campus-ambassador");
    toast.success("Ambassador Program link copied!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[95vw] p-0 border border-amber-500/40 bg-gradient-to-b from-[#0b1124] via-[#090d1a] to-[#060810] text-white shadow-2xl rounded-3xl overflow-hidden z-50">
        {/* Top Accent Gradient Stripe */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 shrink-0" />

        <div className="p-6 sm:p-8 space-y-6 max-h-[88vh] overflow-y-auto">
          {/* Header */}
          <DialogHeader className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 text-[11px] font-mono font-bold tracking-widest uppercase mx-auto animate-pulse">
              <Sparkles className="h-3 w-3 text-amber-400" />
              OFFICIAL APPLICATIONS OPENING SOON
            </div>

            <DialogTitle className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Vyntyra Institutional Relations Associate
            </DialogTitle>
            <div className="text-xs sm:text-sm font-semibold text-amber-400">
              Campus Ambassador Program · First Cohort (2026-27)
            </div>

            <DialogDescription className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
              The application portal is currently in its priority preview phase. Lock in your <strong>VIP Priority Pass</strong> to get screened before public rollout!
            </DialogDescription>
          </DialogHeader>

          {/* Golden VIP Ticket Card */}
          <div className="relative rounded-2xl border border-dashed border-amber-500/50 bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-500/10 p-5 shadow-inner">
            <div className="flex items-center justify-between text-xs font-mono text-amber-300 pb-2 border-b border-amber-500/20">
              <span className="flex items-center gap-1.5 font-bold">
                <Ticket className="h-4 w-4 text-amber-400" /> VIP ADMISSION PASS
              </span>
              <span>COHORT 1.0</span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Program Access
                </div>
                <div className="text-sm font-extrabold text-white">Campus Ambassador Lead</div>
              </div>

              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Launch Phase
                </div>
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Phase 1 Priority
                </div>
              </div>
            </div>

            {/* Early bird privileges list */}
            <div className="mt-3 pt-3 border-t border-amber-500/20 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-amber-400 shrink-0" />
                <span>Priority Interview Slot</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-amber-400 shrink-0" />
                <span>Reserved Welcome Kit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-amber-400 shrink-0" />
                <span>Rewards up to ₹15,000*</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-amber-400 shrink-0" />
                <span>Top 10 Travel Retreat</span>
              </div>
            </div>
          </div>

          {confirmed ? (
            /* Confirmation State */
            <div className="text-center py-4 space-y-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mx-auto flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">VIP Pass #{passNumber} Confirmed!</h3>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  Congratulations <strong>{fullName}</strong>! You have secured priority early-bird access for the First Cohort.
                </p>
                <p className="mt-2 text-[11px] text-slate-400">
                  We will dispatch the official application link and welcome kit allocation instructions to <strong>{email}</strong> upon launch.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  onClick={shareOnWhatsApp}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
                >
                  <Share2 className="h-3.5 w-3.5" /> Share on WhatsApp
                </Button>
                <Button
                  onClick={copyLink}
                  size="sm"
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:text-white text-xs gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy Link
                </Button>
              </div>
            </div>
          ) : (
            /* Pre-Registration Form inside Modal */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Full Name *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Ananya Reddy"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-slate-900/90 border-slate-800 text-white placeholder:text-slate-500 h-10 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Email Address *
                  </label>
                  <Input
                    required
                    type="email"
                    placeholder="name@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-900/90 border-slate-800 text-white placeholder:text-slate-500 h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    WhatsApp Phone *
                  </label>
                  <Input
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-slate-900/90 border-slate-800 text-white placeholder:text-slate-500 h-10 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    College / University *
                  </label>
                  <Input
                    required
                    placeholder="e.g. IIT Madras, BITS, Andhra Univ"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    className="bg-slate-900/90 border-slate-800 text-white placeholder:text-slate-500 h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Degree & Branch
                </label>
                <Input
                  placeholder="e.g. B.Tech Computer Science / ECE / MBA"
                  value={degreeBranch}
                  onChange={(e) => setDegreeBranch(e.target.value)}
                  className="bg-slate-900/90 border-slate-800 text-white placeholder:text-slate-500 h-10 text-xs rounded-xl"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black h-11 rounded-xl text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-500/25 cursor-pointer mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Securing VIP Priority Pass...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Claim VIP Early-Bird Pass <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>

              <p className="text-[10px] text-center text-slate-500">
                ⚡ Strictly limited priority allocations for First Cohort 2026-27.
              </p>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
