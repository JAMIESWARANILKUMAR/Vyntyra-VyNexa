import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Sparkles,
  Award,
  Gift,
  Zap,
  TrendingUp,
  Plane,
  FileCheck2,
  Crown,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  Ticket,
  ShieldCheck,
  Building2,
  Layers,
  HeartHandshake,
  AlertTriangle,
  Flame,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/Header";
import {
  submitAmbassadorApplication,
  getAmbassadorProgramSettings,
  DEFAULT_AMBASSADOR_SETTINGS,
  type AmbassadorProgramSettings,
  type AmbassadorProductItem,
} from "@/lib/ambassador.functions";
import { AmbassadorComingSoonModal } from "@/components/ambassador-coming-soon-modal";
import { GLOBAL_SEO_META_TAGS } from "@/lib/seo-metadata";

export const Route = createFileRoute("/campus-ambassador")({
  head: () => ({
    meta: [
      {
        title:
          "Vyntyra Institutional Relations Associate (Campus Ambassador Program) — First Cohort 2026-27",
      },
      {
        name: "description",
        content:
          "Official Launching Soon: Vyntyra Institutional Relations Associate (Campus Ambassador) Program First Cohort. Exclusive welcome kit, branded gadgets (Earbuds, Powerbanks, Soundbars, Smartwatches), rewards up to ₹15,000, top 10 curated travel retreat, dual internship certificates & VVIP event access across Indian colleges.",
      },
      {
        name: "keywords",
        content:
          "Campus Ambassador Program 2026, Vyntyra Institutional Relations Associate, College Ambassador Internship India, Student Partner Program, Campus Lead, Earn up to 15k College Students, Free Tech Gadgets Internship, Best Campus Ambassador India, Visakhapatnam, Hyderabad, Bengaluru, Delhi, Mumbai, Pune, Chennai, Kolkata, Engineering Student Internships",
      },
      { name: "geo.region", content: "IN-AP" },
      { name: "geo.placename", content: "Visakhapatnam, Andhra Pradesh, India" },
      { name: "geo.position", content: "17.6868;83.2185" },
      { name: "ICBM", content: "17.6868, 83.2185" },
      {
        property: "og:title",
        content:
          "Vyntyra Institutional Relations Associate (Campus Ambassador) — First Cohort Launching Soon",
      },
      {
        property: "og:description",
        content:
          "Join the elite First Cohort. Earn up to ₹15,000, win electronic gadgets, curated travel retreat for Top 10, executive welcome kits, and official dual certification.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://vyntyraconsultancyservices.in/campus-ambassador" },
      ...GLOBAL_SEO_META_TAGS,
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOccupationalProgram",
          name: "Vyntyra Institutional Relations Associate (Campus Ambassador Program) — First Cohort",
          description:
            "Premier student leadership and institutional partnership program by Vyntyra Consultancy Services Pvt. Ltd. Offering ₹15,000 performance rewards, branded electronics, top 10 travel retreats, welcome kits and certified internship recognition.",
          provider: {
            "@type": "Organization",
            name: "Vyntyra Consultancy Services Pvt. Ltd.",
            url: "https://vyntyraconsultancyservices.in",
            logo: "https://vyntyraconsultancyservices.in/icon-512.png",
          },
          timeToComplete: "P3M",
          occupationalCategory: "Institutional Relations, Brand Advocacy, Student Leadership",
          educationalProgramMode: "hybrid",
        }),
      },
    ],
  }),
  component: CampusAmbassadorPage,
});

const ICON_MAP: Record<string, any> = {
  Gift,
  Award,
  TrendingUp,
  Zap,
  Plane,
  FileCheck2,
  Crown,
  Sparkles,
  ShieldCheck,
  Building2,
  HeartHandshake,
  Layers,
  CheckCircle2,
  Ticket,
  Flame,
  Star,
  Users,
};

function CampusAmbassadorPage() {
  const submitApplicationFn = useServerFn(submitAmbassadorApplication);
  const fetchSettingsFn = useServerFn(getAmbassadorProgramSettings);

  // Dynamic Admin Settings
  const settingsQ = useQuery({
    queryKey: ["ambassador-settings"],
    queryFn: () => fetchSettingsFn(),
  });

  const settings: AmbassadorProgramSettings = settingsQ.data || DEFAULT_AMBASSADOR_SETTINGS;
  const theme = settings.theme || DEFAULT_AMBASSADOR_SETTINGS.theme;
  const isEnabled = settings.applications_enabled !== false;

  // Products from Settings
  const allActiveProducts = useMemo(() => {
    const list = settings.products || DEFAULT_AMBASSADOR_SETTINGS.products;
    return list.filter((p) => p.is_active);
  }, [settings.products]);

  const swagsAndGoodies = useMemo(
    () => allActiveProducts.filter((p) => p.category !== "Gadgets"),
    [allActiveProducts]
  );
  const gadgetsList = useMemo(
    () => allActiveProducts.filter((p) => p.category === "Gadgets" || p.featured_in_gadgets),
    [allActiveProducts]
  );

  // Coming Soon Modal State
  const [comingSoonModalOpen, setComingSoonModalOpen] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [degreeBranch, setDegreeBranch] = useState("");
  const [graduationYear, setGraduationYear] = useState("2026");
  const [cityState, setCityState] = useState("");
  const [linkedinProfile, setLinkedinProfile] = useState("");
  const [motivation, setMotivation] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState<string>("All");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEnabled) {
      toast.error(settings.disabled_notice || "Applications are currently paused.");
      return;
    }

    if (!fullName || !email || !phone || !collegeName || !degreeBranch || !cityState) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      await submitApplicationFn({
        data: {
          full_name: fullName,
          email,
          phone,
          college_name: collegeName,
          degree_branch: degreeBranch,
          graduation_year: graduationYear,
          city_state: cityState,
          linkedin_profile: linkedinProfile,
          motivation,
        },
      });

      setSubmitted(true);
      toast.success("Pre-registration successful! Welcome to First Cohort priority list.");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit pre-registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const scrollToForm = () => {
    const el = document.getElementById("pre-register-form");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Gallery categories
  const galleryCategories = useMemo(() => {
    const set = new Set<string>(["All"]);
    swagsAndGoodies.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [swagsAndGoodies]);

  const filteredGallery = useMemo(() => {
    if (selectedGalleryCategory === "All") return swagsAndGoodies;
    return swagsAndGoodies.filter((item) => item.category === selectedGalleryCategory);
  }, [selectedGalleryCategory, swagsAndGoodies]);

  // Dynamic Pillars
  const pillarsList = settings.pillars_section?.pillars || DEFAULT_AMBASSADOR_SETTINGS.pillars_section.pillars;

  // Dynamic FAQs
  const faqsList = settings.faqs || DEFAULT_AMBASSADOR_SETTINGS.faqs;

  return (
    <div
      style={{
        backgroundColor: theme.page_bg_color || "#070b14",
        color: "#f1f5f9",
      }}
      className="min-h-screen selection:bg-amber-500/30 selection:text-amber-200 font-sans relative overflow-x-hidden"
    >
      {/* Top Global Header */}
      <Header />

      {/* Cyber-Luxe Dynamic Background Ambient Light Effects */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Glow Light 1 (Top Primary) */}
        <div
          style={{
            background: `radial-gradient(circle, ${theme.glow_primary || "#6366f1"}33 0%, transparent 70%)`,
          }}
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1200px] h-[650px] blur-[150px] opacity-80"
        />

        {/* Glow Light 2 (Mid Secondary) */}
        <div
          style={{
            background: `radial-gradient(circle, ${theme.glow_secondary || "#ec4899"}26 0%, transparent 70%)`,
          }}
          className="absolute top-[800px] -left-48 w-[600px] h-[600px] rounded-full blur-[160px] opacity-70"
        />

        {/* Glow Light 3 (Lower Accent) */}
        <div
          style={{
            background: `radial-gradient(circle, ${theme.glow_accent || "#f59e0b"}26 0%, transparent 70%)`,
          }}
          className="absolute top-[1800px] -right-48 w-[600px] h-[600px] rounded-full blur-[160px] opacity-70"
        />

        {/* Subtle Cyber Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:32px_32px] opacity-20" />
      </div>

      <main className="relative z-10">
        {/* ─── Top Live Priority Countdown Bar ─── */}
        <div className="border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 backdrop-blur-md py-2.5 px-4">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
              </span>
              <span className="font-extrabold uppercase tracking-wider text-amber-300">
                ⚡ Priority Intake: {settings.cohort_name || "First Cohort 2026-27"}
              </span>
              <span className="hidden sm:inline text-slate-400">|</span>
              <span className="hidden sm:inline text-slate-300">
                Official Welcome Kits, ₹15,000 Rewards & Top 10 Curated Retreat
              </span>
            </div>
            <button
              onClick={() => setComingSoonModalOpen(true)}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline underline-offset-4 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Instant VIP Pass</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* ─── Hero Section ─── */}
        <section className="pt-14 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6 max-w-6xl mx-auto text-center">
          {/* Animated Cohort Launch Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/40 bg-gradient-to-r from-amber-500/20 via-pink-500/15 to-indigo-500/20 backdrop-blur-md shadow-lg shadow-amber-500/10 mb-8 animate-pulse">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400"></span>
            </span>
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.2em] bg-gradient-to-r from-amber-300 via-pink-300 to-indigo-200 bg-clip-text text-transparent">
              {settings.hero?.badge_text || `${settings.cohort_name || "FIRST COHORT 2026-27"} · LAUNCHING SOON`}
            </span>
          </div>

          {/* Main Hero Heading with Dynamic Gradient Stops */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08] max-w-5xl mx-auto">
            {settings.hero?.title_prefix || "Vyntyra Institutional Relations Associate"}{" "}
            <span
              style={{
                backgroundImage: `linear-gradient(to right, ${theme.hero_heading_gradient_start || "#fbbf24"}, ${theme.hero_heading_gradient_mid || "#f43f5e"}, ${theme.hero_heading_gradient_end || "#818cf8"})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
              className="block mt-2"
            >
              {settings.hero?.title_gradient || "(Campus Ambassador Program)"}
            </span>
          </h1>

          <p
            style={{ color: theme.hero_desc_color || "#cbd5e1" }}
            className="mt-6 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-light"
          >
            {settings.hero?.description || (
              <>
                Become the official student leader representing Vyntyra Consultancy Services at your institution.
                Unlock <strong className="text-amber-300 font-semibold">exclusive welcome kits</strong>,{" "}
                <strong className="text-emerald-300 font-semibold">rewards up to {settings.target_rewards || "₹15,000"}</strong>,{" "}
                <strong className="text-sky-300 font-semibold">branded electronic gadgets</strong>, and qualify for an{" "}
                <strong className="text-pink-300 font-semibold">all-expenses-paid curated travel retreat</strong> for the Top 10.
              </>
            )}
          </p>

          {/* Interactive CTA Buttons with Dynamic Theme Colors */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setComingSoonModalOpen(true)}
              style={{
                background: `linear-gradient(to right, ${theme.primary_btn_bg_start || "#f59e0b"}, ${theme.primary_btn_bg_end || "#eab308"})`,
                color: theme.primary_btn_text || "#020617",
              }}
              className="font-black px-8 py-5 rounded-full text-base shadow-xl shadow-amber-500/25 transition-all duration-300 hover:scale-105 cursor-pointer uppercase tracking-wider flex items-center gap-2"
            >
              <Ticket className="h-5 w-5" />
              <span>{settings.hero?.primary_cta || "Claim Early-Bird VIP Spot (Coming Soon)"}</span>
            </button>

            <Button
              onClick={scrollToForm}
              variant="outline"
              size="lg"
              className="border-slate-700 bg-slate-900/70 hover:bg-slate-800 text-slate-200 hover:text-white px-7 py-6 rounded-full text-sm font-bold backdrop-blur"
            >
              <span>{settings.hero?.secondary_cta || "Full Expression of Interest Form"}</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Link
              to="/careers"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-sm transition-all backdrop-blur"
            >
              <Building2 className="h-4 w-4" />
              <span>Explore Corporate Careers</span>
            </Link>
          </div>

          {/* Quick Metrics Bar (Pin-to-pin customizable in Admin) */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {(settings.hero?.metrics || DEFAULT_AMBASSADOR_SETTINGS.hero.metrics).map((metric, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: `${theme.card_bg_color || "#0f172a"}80`,
                  borderColor: `${theme.card_border_color || "#1e293b"}`,
                }}
                className="p-4 rounded-xl border backdrop-blur transition-transform hover:-translate-y-1 duration-200"
              >
                <div
                  style={{ color: metric.color || "#fbbf24" }}
                  className="text-2xl sm:text-3xl font-black"
                >
                  {metric.value}
                </div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Ultra Holographic VIP Pass Teaser Ticket ─── */}
        <section className="px-4 sm:px-6 max-w-4xl mx-auto mb-16">
          <div className="relative rounded-3xl p-1 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 shadow-2xl shadow-amber-500/10">
            <div
              style={{ backgroundColor: theme.card_bg_color || "#0b1224" }}
              className="rounded-[22px] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
                  <Ticket className="h-7 w-7" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 mb-1">
                    <Sparkles className="h-3 w-3" /> OFFICIAL VIP ADMISSION PASS
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {settings.popup?.title || "Vyntyra Institutional Relations Associate"}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-md">
                    {settings.popup?.announcement_message ||
                      "Lock in early-bird priority interview rounds, welcome kit reservations, and direct rewards tracking."}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setComingSoonModalOpen(true)}
                style={{
                  background: `linear-gradient(to right, ${theme.primary_btn_bg_start || "#f59e0b"}, ${theme.primary_btn_bg_end || "#eab308"})`,
                  color: theme.primary_btn_text || "#020617",
                }}
                className="w-full md:w-auto px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 shrink-0 cursor-pointer flex items-center justify-center gap-2 hover:scale-105 transition-transform"
              >
                <span>Generate Instant VIP Pass</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* ─── Dedicated Goodies, Swags & Merchandise Showcase with Real Images ─── */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto border-t border-slate-800/80">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-400 text-xs font-mono font-bold tracking-widest uppercase mb-3">
              <Gift className="h-3.5 w-3.5" />
              EXCLUSIVE PHYSICAL SWAGS &amp; MERCHANDISE
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              Goodies, Swags &amp; Corporate Merchandise
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
              Every Institutional Relations Associate represents the gold standard of Vyntyra. Wear the brand, carry the tech gear, and unpack physical premium merchandise delivered directly to your doorstep.
            </p>

            {/* Filter Pills */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {galleryCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedGalleryCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    selectedGalleryCategory === cat
                      ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-500/30 scale-105"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Goodies Visual Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredGallery.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: `${theme.card_bg_color || "#0f172a"}99`,
                  borderColor: theme.card_border_color || "#1e293b",
                }}
                className="group relative rounded-2xl border overflow-hidden hover:border-amber-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 flex flex-col justify-between"
              >
                {/* Product Photo with Hover Zoom */}
                <div className="relative aspect-video sm:aspect-[4/3] w-full overflow-hidden bg-slate-950">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 group-hover:opacity-95"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Category Pill */}
                  <span
                    className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-md ${
                      item.badge_style || "border-amber-400/40 bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-mono text-amber-400 uppercase tracking-widest mb-1">
                      {item.subtitle}
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono text-[11px]">{settings.cohort_name || "First Cohort"}</span>
                    <button
                      onClick={() => setComingSoonModalOpen(true)}
                      className="text-amber-400 hover:text-amber-300 font-semibold text-xs flex items-center gap-1 group/btn cursor-pointer"
                    >
                      <span>Claim via Waitlist</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Pillars & Perks Showcase (Pin-to-pin customizable in Admin) ─── */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs font-mono font-bold tracking-widest uppercase mb-3">
              <Sparkles className="h-3 w-3" />
              {settings.pillars_section?.badge || "EXCLUSIVE COHORT PRIVILEGES"}
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              {settings.pillars_section?.heading || `Everything You Receive in ${settings.cohort_name || "First Cohort"}`}
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
              {settings.pillars_section?.description ||
                "Designed to elevate your student profile, provide authentic executive experience, and celebrate institutional leadership with industry-first perks."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pillarsList.map((pillar, idx) => {
              const Icon = ICON_MAP[pillar.icon] || Sparkles;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: `${theme.card_bg_color || "#0f172a"}90`,
                    borderColor: theme.card_border_color || "#1e293b",
                  }}
                  className="group relative rounded-2xl border p-6 sm:p-7 backdrop-blur hover:border-amber-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col justify-between overflow-hidden"
                >
                  <div className="absolute -right-20 -top-20 w-40 h-40 bg-gradient-to-br from-indigo-500/10 via-amber-500/5 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform shadow-md">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${pillar.badgeColor || "border-amber-500/40 bg-amber-500/10 text-amber-400"}`}>
                        {pillar.highlight}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                      {pillar.title}
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm text-slate-400 leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>{settings.cohort_name || "Cohort 1.0"}</span>
                    <span className="text-amber-400 flex items-center gap-1 font-sans font-semibold">
                      Included <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── Electronic Gadgets Spotlight (Pin-to-pin customizable in Admin) ─── */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto">
          <div
            style={{
              backgroundColor: `${theme.card_bg_color || "#0f172a"}`,
              borderColor: theme.card_border_color || "#1e293b",
            }}
            className="rounded-3xl border bg-gradient-to-b from-slate-900/90 via-[#0b1329] to-slate-950 p-8 sm:p-12 relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-3xl mb-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-400/30 bg-sky-400/10 text-sky-300 text-xs font-mono font-bold tracking-widest uppercase mb-3">
                <Zap className="h-3.5 w-3.5" />
                {settings.gadgets_section?.badge || "HIGH-PERFORMANCE TECH GEAR"}
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {settings.gadgets_section?.heading || "Branded Electronic Gadgets Showcase"}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-400 leading-relaxed">
                {settings.gadgets_section?.description ||
                  "As an Institutional Relations Associate, meeting tiered engagement milestones equips your workstation with genuine top-tier consumer electronics."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gadgetsList.map((gadget) => (
                <div
                  key={gadget.id}
                  className="rounded-2xl border border-slate-800/90 bg-slate-950/60 backdrop-blur hover:border-sky-500/40 transition-all group overflow-hidden flex flex-col justify-between"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                    <img
                      src={gadget.image_url}
                      alt={gadget.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 w-9 h-9 rounded-lg bg-slate-900/80 backdrop-blur border border-slate-700/60 text-sky-400 flex items-center justify-center">
                      <Zap className="h-4 w-4" />
                    </div>
                    <span className="absolute top-3 right-3 text-[10px] font-mono text-sky-300 bg-sky-500/20 backdrop-blur px-2 py-0.5 rounded border border-sky-400/40">
                      {gadget.badge || "Tech Gear"}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-sky-400 font-bold uppercase mb-1">
                        {gadget.subtitle}
                      </div>
                      <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-sky-300 transition-colors">
                        {gadget.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                        {gadget.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500 font-mono">Performance Tier</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                        Eligible in Cohort <CheckCircle2 className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Special Gadget Callout */}
              <div className="p-6 rounded-2xl border border-dashed border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-slate-950 to-slate-950 backdrop-blur flex flex-col justify-between">
                <div>
                  <div className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" /> Complete Ecosystem
                  </div>
                  <h4 className="text-lg font-black text-white">
                    Unlock All Electronic Gadgets
                  </h4>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                    Institutional Relations Associates who fulfill comprehensive college outreach &amp; workshop benchmarks qualify for the full branded workstation ecosystem.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-amber-500/20 flex flex-col gap-3">
                  <button
                    onClick={() => setComingSoonModalOpen(true)}
                    style={{
                      background: `linear-gradient(to right, ${theme.primary_btn_bg_start || "#f59e0b"}, ${theme.primary_btn_bg_end || "#eab308"})`,
                      color: theme.primary_btn_text || "#020617",
                    }}
                    className="w-full font-black py-2.5 rounded-lg text-xs cursor-pointer uppercase tracking-wider hover:scale-[1.02] transition-transform"
                  >
                    Reserve Priority Spot &rarr;
                  </button>
                  <div className="text-[11px] text-amber-300/80 font-mono text-center">
                    *Performance Criteria Announced at Launch
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Top 10 Curated Travel Experience (Pin-to-pin customizable in Admin) ─── */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="rounded-3xl border border-pink-500/30 bg-gradient-to-r from-pink-950/30 via-slate-900 to-indigo-950/40 p-8 sm:p-12 relative overflow-hidden shadow-2xl">
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-pink-500/40 bg-pink-500/10 text-pink-400 text-xs font-mono font-bold tracking-widest uppercase mb-4">
                  <Plane className="h-3.5 w-3.5" />
                  {settings.retreat_section?.badge || "PINNACLE RECOGNITION"}
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  {settings.retreat_section?.heading || "Top 10 Associates: Curated Travel Experience"}
                </h2>
                <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed font-light">
                  {settings.retreat_section?.description ||
                    "Work hard, lead your campus, and travel in style. The Top 10 Institutional Relations Associates will be awarded an all-expenses-paid curated corporate and leisure retreat with co-associates and company executives."}
                </p>

                {/* Retreat Highlights Bullets */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                  {(
                    settings.retreat_section?.bullets || [
                      "Flight & Luxury Resort Stay Included",
                      "Executive Networking Gala",
                      "Team Building & Adventure Sports",
                      "Exclusive Trophy & Honors Night",
                    ]
                  ).map((bullet, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-pink-400 shrink-0" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 flex justify-center">
                <div className="relative rounded-2xl border border-pink-500/30 bg-slate-900/95 shadow-xl max-w-sm w-full overflow-hidden text-center">
                  <div className="aspect-video w-full overflow-hidden bg-slate-950">
                    <img
                      src={
                        settings.retreat_section?.image_url ||
                        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop"
                      }
                      alt="Curated Travel Retreat"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <div className="text-lg font-bold text-white">
                      {settings.retreat_section?.card_title || "First Cohort Leadership Retreat"}
                    </div>
                    <div className="text-xs text-pink-300 mt-1 uppercase tracking-wider font-mono">
                      {settings.retreat_section?.card_subtitle || "Top 10 Associates Qualifier"}
                    </div>
                    <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                      {settings.retreat_section?.card_description ||
                        "Evaluated based on institutional engagement, student community growth, and overall leadership performance."}
                    </p>
                    <button
                      onClick={() => setComingSoonModalOpen(true)}
                      className="mt-5 w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-2.5 rounded-lg shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider transition-colors"
                    >
                      <Ticket className="h-4 w-4" />
                      <span>Claim Early-Bird Waitlist Pass</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Pre-Registration Expression of Interest Form (Pin-to-pin customizable in Admin) ─── */}
        <section id="pre-register-form" className="py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto scroll-mt-20">
          <div
            style={{
              backgroundColor: `${theme.card_bg_color || "#070b14"}`,
              borderColor: `${theme.card_border_color || "#1e293b"}`,
            }}
            className="rounded-3xl border bg-gradient-to-b from-slate-900/95 via-slate-950 to-[#070b14] p-6 sm:p-10 lg:p-12 shadow-2xl relative"
          >
            {/* Quick VIP Pass Shortcut Banner */}
            <div className="mb-8 p-4 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-pink-500/10 to-indigo-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                  <Ticket className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Prefer Quick 1-Minute VIP Pass?</h4>
                  <p className="text-xs text-slate-300">
                    Get an instant numbered ticket code &amp; VIP waitlist confirmation popup.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setComingSoonModalOpen(true)}
                style={{
                  background: `linear-gradient(to right, ${theme.primary_btn_bg_start || "#f59e0b"}, ${theme.primary_btn_bg_end || "#eab308"})`,
                  color: theme.primary_btn_text || "#020617",
                }}
                className="font-black text-xs px-5 py-2.5 rounded-xl shrink-0 cursor-pointer uppercase tracking-wider hover:scale-105 transition-transform"
              >
                Open Coming Soon Popup &rarr;
              </button>
            </div>

            {/* Applications Disabled Alert Banner if Paused in Admin */}
            {!isEnabled && (
              <div className="mb-8 p-5 rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-200 text-xs flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white text-sm block">Registration Currently Paused</span>
                  <p className="mt-1 leading-relaxed text-slate-300">
                    {settings.disabled_notice || "Pre-registrations for this cohort are temporarily paused."}
                  </p>
                </div>
              </div>
            )}

            <div className="text-center max-w-2xl mx-auto mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-400 text-xs font-mono font-bold tracking-widest uppercase mb-3">
                <Sparkles className="h-3 w-3" />
                {settings.form_section?.badge || "FULL EXPRESSION OF INTEREST FORM"}
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                {settings.form_section?.heading || `Pre-Register for the ${settings.cohort_name || "First Cohort"}`}
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-400">
                {settings.form_section?.description ||
                  "Official announcement launching soon. Pre-registered candidates receive priority screening, interview invites, and early allocation of Welcome Kits."}
              </p>
            </div>

            {submitted ? (
              <div className="py-12 px-6 text-center rounded-2xl border border-emerald-500/40 bg-emerald-500/10 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mx-auto flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {settings.form_section?.confirmation_heading || "Pre-Registration Confirmed!"}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Thank you, <strong>{fullName}</strong>.{" "}
                  {settings.form_section?.confirmation_subtext ||
                    `You are officially on the ${settings.cohort_name || "First Cohort"} Priority List for Vyntyra Institutional Relations Associates.`}
                </p>
                <div className="mt-6 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
                  We will reach out to <strong>{email}</strong> as soon as selection rounds and welcome kit dispatches begin.
                </div>
                <Button
                  onClick={() => setSubmitted(false)}
                  variant="outline"
                  size="sm"
                  className="mt-6 border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                >
                  Submit Another Response
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Full Name *
                    </label>
                    <Input
                      required
                      disabled={!isEnabled}
                      placeholder="e.g. Rahul Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-500 rounded-lg h-11"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Email Address *
                    </label>
                    <Input
                      required
                      disabled={!isEnabled}
                      type="email"
                      placeholder="e.g. rahul@college.edu / personal"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-500 rounded-lg h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      WhatsApp / Phone Number *
                    </label>
                    <Input
                      required
                      disabled={!isEnabled}
                      placeholder="e.g. +91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-500 rounded-lg h-11"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      College / University Full Name *
                    </label>
                    <Input
                      required
                      disabled={!isEnabled}
                      placeholder="e.g. Andhra University, Vizag"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      className="bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-500 rounded-lg h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Degree &amp; Branch *
                    </label>
                    <Input
                      required
                      disabled={!isEnabled}
                      placeholder="e.g. B.Tech CSE / ECE / MBA"
                      value={degreeBranch}
                      onChange={(e) => setDegreeBranch(e.target.value)}
                      className="bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-500 rounded-lg h-11"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Graduation Year *
                    </label>
                    <Input
                      required
                      disabled={!isEnabled}
                      placeholder="e.g. 2026 / 2027"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      className="bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-500 rounded-lg h-11"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      City &amp; State *
                    </label>
                    <Input
                      required
                      disabled={!isEnabled}
                      placeholder="e.g. Visakhapatnam, AP"
                      value={cityState}
                      onChange={(e) => setCityState(e.target.value)}
                      className="bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-500 rounded-lg h-11"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    LinkedIn / Portfolio URL (Optional)
                  </label>
                  <Input
                    disabled={!isEnabled}
                    placeholder="https://linkedin.com/in/username"
                    value={linkedinProfile}
                    onChange={(e) => setLinkedinProfile(e.target.value)}
                    className="bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-500 rounded-lg h-11"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Why do you want to represent Vyntyra at your institution?
                  </label>
                  <Textarea
                    disabled={!isEnabled}
                    rows={3}
                    placeholder="Tell us briefly about your campus presence, student club involvement, or leadership interests..."
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    className="bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-500 rounded-lg"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !isEnabled}
                    style={{
                      background: `linear-gradient(to right, ${theme.primary_btn_bg_start || "#f59e0b"}, ${theme.primary_btn_bg_end || "#eab308"})`,
                      color: theme.primary_btn_text || "#020617",
                    }}
                    className="w-full font-black h-12 rounded-xl text-sm sm:text-base shadow-lg shadow-amber-500/20 cursor-pointer uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" /> Submitting Priority Pre-Registration...
                      </span>
                    ) : !isEnabled ? (
                      <span>Applications Currently Paused</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {settings.form_section?.submit_btn_text || "Submit Priority Pre-Registration"} <ArrowRight className="h-5 w-5" />
                      </span>
                    )}
                  </button>
                  <p className="mt-2.5 text-center text-[11px] text-slate-500">
                    By submitting, you agree to receive communications regarding {settings.cohort_name || "First Cohort"} selection &amp; onboarding.
                  </p>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* ─── Frequently Asked Questions (Pin-to-pin customizable in Admin) ─── */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Everything you need to know about the {settings.cohort_name || "First Cohort"} Campus Ambassador Program.
            </p>
          </div>

          <div className="space-y-3">
            {faqsList.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  style={{
                    backgroundColor: `${theme.card_bg_color || "#0f172a"}80`,
                    borderColor: theme.card_border_color || "#1e293b",
                  }}
                  className="rounded-xl border overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-white hover:text-amber-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5 text-amber-400 shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-500 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/40 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* ─── Coming Soon VIP Pass Modal ─── */}
      <AmbassadorComingSoonModal
        open={comingSoonModalOpen}
        onOpenChange={setComingSoonModalOpen}
        settings={settings}
      />
    </div>
  );
}
