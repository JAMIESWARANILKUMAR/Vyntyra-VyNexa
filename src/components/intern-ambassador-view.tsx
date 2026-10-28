import React, { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Sparkles,
  Gift,
  Award,
  TrendingUp,
  Zap,
  Plane,
  FileCheck2,
  Crown,
  CheckCircle2,
  ArrowRight,
  BatteryCharging,
  Headphones,
  Speaker,
  Watch,
  Video,
  Loader2,
  ExternalLink,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitAmbassadorApplication } from "@/lib/ambassador.functions";
import { AmbassadorComingSoonModal } from "@/components/ambassador-coming-soon-modal";

interface InternAmbassadorViewProps {
  profile: any;
  application: any;
}

export function InternAmbassadorView({ profile, application }: InternAmbassadorViewProps) {
  const submitAppFn = useServerFn(submitAmbassadorApplication);

  // Coming Soon Modal State
  const [comingSoonModalOpen, setComingSoonModalOpen] = useState(false);

  const [fullName, setFullName] = useState(profile?.full_name || application?.full_name || "");
  const [email, setEmail] = useState(profile?.email || application?.email || "");
  const [phone, setPhone] = useState(profile?.phone || application?.phone || "");
  const [collegeName, setCollegeName] = useState(application?.college || "");
  const [degreeBranch, setDegreeBranch] = useState(application?.domain || "Engineering & Technology");
  const [graduationYear, setGraduationYear] = useState("2026");
  const [cityState, setCityState] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !collegeName) {
      toast.error("Please fill in your name, email, phone, and college name.");
      return;
    }

    setLoading(true);
    try {
      await submitAppFn({
        data: {
          full_name: fullName,
          email,
          phone,
          college_name: collegeName,
          degree_branch: degreeBranch,
          graduation_year: graduationYear,
          city_state: cityState || "Campus Resident",
          motivation: "Registered Intern applying for First Cohort Campus Ambassador",
        },
      });

      setSubmitted(true);
      toast.success("Successfully registered for First Cohort Campus Ambassador priority list!");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-slate-950 via-[#0d1633] to-slate-950 p-6 sm:p-10 text-white shadow-2xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-72 w-72 rounded-full bg-pink-500/15 blur-3xl" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1 text-xs font-mono font-bold text-amber-300 uppercase tracking-widest">
            <Sparkles className="h-3 w-3 text-amber-400" />
            FIRST COHORT 2026-27 · LAUNCHING SOON
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            Vyntyra Institutional Relations Associate{" "}
            <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-300 bg-clip-text text-transparent">
              (Campus Ambassador Program)
            </span>
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed font-light">
            As an active Vyntyra intern, you receive <strong>priority enrollment</strong> into our flagship Institutional Relations Associate Program. Expand your leadership, lead tech initiatives at your college, and unlock unmatched corporate privileges.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setComingSoonModalOpen(true)}
              className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              <Ticket className="h-4 w-4" />
              <span>Claim Intern VIP Pass (Coming Soon)</span>
            </Button>

            <a
              href="/campus-ambassador"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white transition-colors"
            >
              <span>View Public Landing Page</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Visual Product Showcase for Swags, Goodies & Gadgets */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Gift className="h-4 w-4 text-amber-600" /> Swags, Goodies &amp; Gadgets Catalog
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Physical merchandise &amp; electronics awarded to First Cohort associates.
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            Shipped to Campus
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              name: "IRA Welcome Box",
              tag: "Executive Kit",
              img: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=400&auto=format&fit=crop",
            },
            {
              name: "Corporate Hoodie",
              tag: "3D Crest Fleece",
              img: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=400&auto=format&fit=crop",
            },
            {
              name: "20k Powerbank",
              tag: "65W Fast Charge",
              img: "https://images.unsplash.com/photo-1609592426815-397750868a25?q=80&w=400&auto=format&fit=crop",
            },
            {
              name: "ANC Earbuds",
              tag: "Noise Canceling",
              img: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=400&auto=format&fit=crop",
            },
            {
              name: "AMOLED Watch",
              tag: "Calling & Health",
              img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&auto=format&fit=crop",
            },
            {
              name: "Travel Retreat",
              tag: "Top 10 Curated",
              img: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=400&auto=format&fit=crop",
            },
          ].map((item, idx) => (
            <div key={idx} className="group rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col">
              <div className="aspect-square w-full overflow-hidden bg-slate-100">
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <div className="p-2 text-center">
                <div className="text-xs font-bold text-slate-900 truncate">{item.name}</div>
                <div className="text-[10px] text-amber-700 font-mono font-medium">{item.tag}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7 Exclusive Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Gift className="h-5 w-5" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">IRA Welcome Kit</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Custom Associate Badge, Official Executive ID Card, Welcome Stationery &amp; Swag.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
            <Award className="h-5 w-5" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Corporate Merchandise</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Performance-based branded apparel: Hoodies, T-shirts, Laptop sleeves, and Bottles.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <TrendingUp className="h-5 w-5" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Earn Up to ₹15,000 Rewards</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Stipends and performance milestone payouts (*Performance &amp; T&amp;C Apply).
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <Zap className="h-5 w-5" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Branded Electronic Gadgets</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Powerbanks, Wireless Earbuds, Soundbars, Smartwatches, and Full HD Webcams.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Plane className="h-5 w-5" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Curated Travel Experience</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Top 10 Associates win an all-expenses-paid curated corporate retreat with co-associates.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Dual Certification</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Certificate of Recognition &amp; Corporate Leadership Internship Experience Letter.
          </p>
        </div>

        <div className="md:col-span-2 p-5 rounded-2xl border border-amber-200 bg-amber-50/60 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Exclusive VVIP Access Pass</h4>
              <p className="text-xs text-slate-600">
                Complimentary VIP entry to all Vyntyra Workshops, Bootcamps, Masterclasses, Sessions, Learning Modules &amp; Courses.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-700 font-mono shrink-0">100% Free</span>
        </div>
      </div>

      {/* Pre-Registration Card for Interns */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="max-w-2xl">
            <h3 className="text-lg font-bold text-slate-900">Intern Priority Expression of Interest</h3>
            <p className="text-xs text-slate-500 mt-1">
              Confirm your details below to secure priority consideration for Cohort 1.0.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setComingSoonModalOpen(true)}
            variant="outline"
            className="border-amber-300 bg-amber-50/70 text-amber-900 hover:bg-amber-100 text-xs font-bold rounded-xl shrink-0"
          >
            <Ticket className="h-4 w-4 mr-1.5 text-amber-600" />
            <span>Open VIP Ticket Popup</span>
          </Button>
        </div>

        {submitted ? (
          <div className="p-6 text-center rounded-2xl border border-emerald-300 bg-emerald-50 max-w-md mx-auto">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
            <h4 className="font-bold text-slate-900 text-base">Priority Interest Registered!</h4>
            <p className="text-xs text-slate-600 mt-1">
              You are on the First Cohort priority list. We will send updates to <strong>{email}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <Input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp / Phone</label>
                <Input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">College / University</label>
                <Input
                  required
                  placeholder="Your college full name"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Degree / Branch</label>
                <Input
                  required
                  value={degreeBranch}
                  onChange={(e) => setDegreeBranch(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Graduation Year</label>
                <Input
                  required
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City &amp; State</label>
                <Input
                  required
                  placeholder="e.g. Visakhapatnam, AP"
                  value={cityState}
                  onChange={(e) => setCityState(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-6 h-10 rounded-xl shadow-md cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Confirm First Cohort Priority Interest <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>
        )}
      </div>

      {/* Coming Soon VIP Pass Modal */}
      <AmbassadorComingSoonModal
        open={comingSoonModalOpen}
        onOpenChange={setComingSoonModalOpen}
        defaultName={fullName}
        defaultEmail={email}
        defaultPhone={phone}
        defaultCollege={collegeName}
      />
    </div>
  );
}
