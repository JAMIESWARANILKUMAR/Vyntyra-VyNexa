import React from "react";
import {
  CheckCircle2,
  ShieldCheck,
  Award,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Star,
  Building,
  Flag,
  Flame,
  Check,
} from "lucide-react";

export interface RouteStop {
  id: string;
  stepNumber: string;
  category: string;
  title: string;
  badge: string;
  authority: string;
  verificationId: string;
  description: string;
  accentColor: string;
  badgeBg: string;
  borderGlow: string;
  logo: React.ReactNode;
}

// ── Official Branding Logo Components ──

function GreatPlaceToWorkOfficialLogo() {
  return (
    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#DF192A] text-white p-1.5 flex flex-col justify-between shadow-lg shadow-red-900/40 border border-red-400/30 select-none shrink-0">
      <div className="leading-tight font-extrabold text-[8px] sm:text-[9px] tracking-tight uppercase">
        <div>Great</div>
        <div>Place</div>
        <div>To</div>
        <div className="flex items-center justify-between">
          <span>Work</span>
          <span className="text-[6px] font-sans">®</span>
        </div>
      </div>
      <div className="bg-black/90 text-white text-center py-0.5 rounded-[3px] text-[6px] sm:text-[7px] font-black tracking-wider uppercase">
        Certified
        <div className="text-[5px] sm:text-[6px] font-mono text-red-300 font-bold leading-none">2026-2027</div>
      </div>
    </div>
  );
}

function NasscomOfficialLogo() {
  return (
    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white p-1.5 flex flex-col items-center justify-center shadow-lg shadow-blue-950/40 border border-slate-200 select-none shrink-0 overflow-hidden">
      <img
        src="/social/nasscom_hd.png"
        alt="NASSCOM FutureSkills Prime"
        className="w-full h-8 object-contain"
      />
      <div className="text-[6px] sm:text-[6.5px] font-extrabold text-[#003366] uppercase tracking-tighter text-center leading-none mt-1">
        FutureSkills
        <span className="text-[#FF6600] ml-0.5">Prime</span>
      </div>
    </div>
  );
}

function MsmeOfficialLogo() {
  return (
    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white p-1.5 flex flex-col items-center justify-center shadow-lg shadow-emerald-950/40 border border-slate-200 select-none shrink-0 overflow-hidden">
      <img
        src="/social/msme_hd.png"
        alt="Ministry of MSME Govt. of India"
        className="w-full h-9 object-contain"
      />
      <div className="text-[6px] font-bold text-slate-700 uppercase tracking-tighter text-center leading-none mt-0.5">
        Govt. of India
      </div>
    </div>
  );
}

function SkillIndiaOfficialLogo() {
  return (
    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 p-1.5 flex flex-col items-center justify-center shadow-lg shadow-sky-950/40 border border-sky-500/30 select-none shrink-0 relative overflow-hidden">
      {/* Tricolor stylized banner emblem */}
      <div className="flex items-center gap-0.5 mb-1">
        <span className="h-1.5 w-2 rounded-xs bg-[#FF9933]" />
        <span className="h-1.5 w-2 rounded-xs bg-white" />
        <span className="h-1.5 w-2 rounded-xs bg-[#138808]" />
      </div>
      <div className="text-[8px] sm:text-[9px] font-black text-white uppercase tracking-tight text-center leading-none">
        Skill India
      </div>
      <div className="text-[6px] sm:text-[6.5px] font-medium text-sky-300 text-center leading-tight mt-0.5">
        कौशल भारत
      </div>
      <div className="text-[5px] text-slate-400 font-mono tracking-tighter mt-0.5">
        NSDC ALIGNED
      </div>
    </div>
  );
}

function AmbitionBoxOfficialLogo() {
  return (
    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#0F1E28] p-1.5 flex flex-col items-center justify-between shadow-lg shadow-emerald-950/40 border border-emerald-500/40 select-none shrink-0">
      <div className="flex items-center gap-1 w-full justify-center pt-0.5">
        <div className="h-4 w-4 rounded-sm bg-[#00BA74] text-white flex items-center justify-center font-black text-[9px]">
          AB
        </div>
        <span className="text-[8px] font-black text-white tracking-tighter">AmbitionBox</span>
      </div>
      <div className="bg-[#00BA74]/20 border border-[#00BA74]/40 w-full rounded py-0.5 px-1 flex items-center justify-center gap-1">
        <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
        <span className="text-[8px] font-bold text-white">4.5</span>
        <span className="text-[6px] text-emerald-300">/5</span>
      </div>
    </div>
  );
}

function JustdialOfficialLogo() {
  return (
    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white p-1.5 flex flex-col items-center justify-between shadow-lg shadow-orange-950/40 border border-slate-200 select-none shrink-0">
      <div className="flex items-center justify-center pt-1">
        <span className="text-[12px] sm:text-[13px] font-black text-[#F25C05] tracking-tight">Just</span>
        <span className="text-[12px] sm:text-[13px] font-black text-[#0076CE] tracking-tight">dial</span>
      </div>
      <div className="bg-orange-50 border border-orange-200 w-full rounded py-0.5 px-1 flex items-center justify-center gap-1">
        <Star className="h-2.5 w-2.5 text-[#F25C05] fill-[#F25C05]" />
        <span className="text-[8px] font-extrabold text-slate-900">4.1★</span>
        <span className="text-[6px] font-bold text-orange-700 uppercase">Verified</span>
      </div>
    </div>
  );
}

export const ROUTE_STOPS: RouteStop[] = [
  {
    id: "msme",
    stepNumber: "01",
    category: "Statutory Incorporation",
    title: "MSME Registered Enterprise",
    badge: "Govt. of India",
    authority: "Ministry of Micro, Small & Medium Enterprises",
    verificationId: "UDYAM-AP-09-0051886",
    description: "Formally registered and accredited enterprise adhering to central corporate governance and Indian IT industry standards.",
    accentColor: "emerald",
    badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    borderGlow: "group-hover:border-emerald-500/50 group-hover:shadow-emerald-500/10",
    logo: <MsmeOfficialLogo />,
  },
  {
    id: "skill-india",
    stepNumber: "02",
    category: "National Mission Alignment",
    title: "Skill Development of India",
    badge: "Skill India Mission",
    authority: "National Technical Development Framework",
    verificationId: "National Competency Aligned",
    description: "Curriculum and hands-on internship programs aligned with national goals for high-tech youth employment and industrial competency.",
    accentColor: "sky",
    badgeBg: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    borderGlow: "group-hover:border-sky-500/50 group-hover:shadow-sky-500/10",
    logo: <SkillIndiaOfficialLogo />,
  },
  {
    id: "nasscom",
    stepNumber: "03",
    category: "Emerging Tech Accreditation",
    title: "NASSCOM FutureSkills Prime",
    badge: "Recognised Partner",
    authority: "NASSCOM & MeitY Digital Ecosystem",
    verificationId: "Digital Skills Partner",
    description: "Accelerating modern tech talent across Enterprise AI, Next.js Web Architectures, Mobile Engineering, and Cloud DevOps.",
    accentColor: "blue",
    badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    borderGlow: "group-hover:border-blue-500/50 group-hover:shadow-blue-500/10",
    logo: <NasscomOfficialLogo />,
  },
  {
    id: "justdial",
    stepNumber: "04",
    category: "Client Trust & Delivery",
    title: "Justdial Verified Enterprise",
    badge: "4.1 / 5.0 ★ Rated",
    authority: "Justdial Consumer Business Ratings",
    verificationId: "Verified Service Provider",
    description: "Validated client delivery track record, transparent operational metrics, and authentic verified ratings for IT solutions.",
    accentColor: "orange",
    badgeBg: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    borderGlow: "group-hover:border-orange-500/50 group-hover:shadow-orange-500/10",
    logo: <JustdialOfficialLogo />,
  },
  {
    id: "ambitionbox",
    stepNumber: "05",
    category: "Employee & Mentee Experience",
    title: "AmbitionBox Workplace Benchmark",
    badge: "4.5 / 5.0 ★ Rated",
    authority: "AmbitionBox · A Times Internet Company",
    verificationId: "Top-Rated Culture Score",
    description: "Praised by interns, engineers, and mentors for an empowering learning curve, work-life balance, and transparent leadership.",
    accentColor: "teal",
    badgeBg: "bg-teal-500/10 text-teal-400 border-teal-500/30",
    borderGlow: "group-hover:border-teal-500/50 group-hover:shadow-teal-500/10",
    logo: <AmbitionBoxOfficialLogo />,
  },
  {
    id: "gptw",
    stepNumber: "06",
    category: "Pinnacle Workplace Standard",
    title: "Great Place to Work®",
    badge: "Certified 2026–27",
    authority: "Great Place to Work® Institute",
    verificationId: "Certified Cohort 2026–2027",
    description: "The global benchmark in workplace culture, high-trust leadership, employee flourishing, and innovation excellence.",
    accentColor: "red",
    badgeBg: "bg-red-500/10 text-red-400 border-red-500/30",
    borderGlow: "group-hover:border-red-500/50 group-hover:shadow-red-500/10",
    logo: <GreatPlaceToWorkOfficialLogo />,
  },
];

export function AccreditationsRouteMap() {
  return (
    <section className="relative overflow-hidden bg-[#070B14] text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-y border-slate-800">
      {/* Background Decorative Corporate Grids and Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 corporate-grid opacity-25" />

      <div className="relative mx-auto max-w-7xl">
        {/* ── Section Header ── */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-[11px] font-mono font-bold text-amber-400 uppercase tracking-widest mb-4">
            <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            Institutional Accreditation Route Map
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Backed by National Trust,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-gold to-white">
              Global Standards
            </span>
          </h2>

          <p className="mt-4 text-xs sm:text-sm lg:text-base text-slate-300 max-w-2xl leading-relaxed">
            Follow the certified trajectory of Vyntyra Consultancy Services — from statutory central government incorporation to prestigious national skill alignments and the gold standard in workplace excellence.
          </p>

          {/* Quick Stats Pill Strip */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-white">6 / 6</span> Milestones Verified
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              <span>Govt. MSME &amp; NASSCOM Aligned</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800">
              <Award className="h-3.5 w-3.5 text-amber-400" />
              <span>Great Place to Work® 2026–27</span>
            </div>
          </div>
        </div>

        {/* ── Desktop & Wide Screens: Interactive Route Map Track ── */}
        <div className="hidden lg:block relative pb-4">
          {/* Continuous Glowing Route Line */}
          <div className="absolute top-[38px] left-[6%] right-[6%] h-[3px] bg-gradient-to-r from-emerald-500 via-blue-500 via-orange-500 via-teal-500 to-red-500 shadow-lg shadow-indigo-500/20 z-0">
            {/* Animated Pulses along track */}
            <div className="absolute top-0 bottom-0 left-0 right-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.8)_50%,transparent_100%)] animate-pulse" />
          </div>

          {/* 6 Route Stop Pins Grid */}
          <div className="grid grid-cols-6 gap-3.5 relative z-10">
            {ROUTE_STOPS.map((stop, idx) => (
              <div key={stop.id} className="flex flex-col items-center group">
                {/* Route Station Pin Node */}
                <div className="relative mb-6">
                  {/* Outer Pulsing Beacon */}
                  <div className="w-14 h-14 rounded-full bg-slate-900 border-2 border-slate-700 group-hover:border-white transition-all flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:shadow-indigo-500/40">
                    <span className="font-mono text-xs font-black text-slate-300 group-hover:text-white">
                      {stop.stepNumber}
                    </span>
                  </div>

                  {/* Pulsing indicator ring */}
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[8px] font-bold text-white items-center justify-center">
                      ✓
                    </span>
                  </span>

                  {/* Directional connecting arrow */}
                  {idx < ROUTE_STOPS.length - 1 && (
                    <div className="absolute top-1/2 -right-5 -translate-y-1/2 text-slate-600 hidden xl:block">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Corporate Card */}
                <div
                  className={`w-full rounded-2xl bg-[#0D1424]/90 p-4 border border-slate-800 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl ${stop.borderGlow} flex flex-col justify-between min-h-[350px] relative overflow-hidden backdrop-blur-md`}
                >
                  {/* Ambient Backlight */}
                  <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-white/[0.02] pointer-events-none group-hover:bg-white/[0.05] transition-all" />

                  <div>
                    {/* Top Row: Official Logo & Station Badge */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      {stop.logo}
                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border leading-tight ${stop.badgeBg}`}
                      >
                        {stop.badge}
                      </span>
                    </div>

                    {/* Milestone Category */}
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {stop.category}
                    </div>

                    {/* Stop Title */}
                    <h3 className="text-sm font-extrabold text-white group-hover:text-amber-300 transition-colors tracking-tight line-clamp-2">
                      {stop.title}
                    </h3>

                    {/* Authority */}
                    <div className="text-[11px] font-medium text-slate-400 mt-1">
                      {stop.authority}
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-slate-300/90 leading-relaxed mt-2.5">
                      {stop.description}
                    </p>
                  </div>

                  {/* Bottom Verification Seal */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider truncate mb-1">
                      Registry ID
                    </div>
                    <div className="text-[10px] font-mono font-semibold text-slate-200 truncate bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                      {stop.verificationId}
                    </div>

                    <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                      <span>Officially Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Mobile & Tablet: Vertical Route Map Track ── */}
        <div className="block lg:hidden relative pl-6 sm:pl-8 space-y-6">
          {/* Vertical Connecting Route Line */}
          <div className="absolute left-[15px] sm:left-[21px] top-6 bottom-6 w-[3px] bg-gradient-to-b from-emerald-500 via-blue-500 via-orange-500 via-teal-500 to-red-500 shadow-md shadow-indigo-500/20" />

          {ROUTE_STOPS.map((stop) => (
            <div key={stop.id} className="relative group">
              {/* Route Node Pin on Vertical Line */}
              <div className="absolute -left-[27px] sm:-left-[35px] top-4 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-900 border-2 border-slate-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:border-white transition-all z-10">
                <span className="font-mono text-[10px] sm:text-xs font-bold text-white">
                  {stop.stepNumber}
                </span>
              </div>

              {/* Card Container */}
              <div
                className={`rounded-2xl bg-[#0D1424]/90 p-4 sm:p-5 border border-slate-800 transition-all ${stop.borderGlow} backdrop-blur-md shadow-xl`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {stop.logo}
                    <div>
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        {stop.category}
                      </div>
                      <h3 className="text-base font-extrabold text-white tracking-tight">
                        {stop.title}
                      </h3>
                      <div className="text-xs text-slate-400">{stop.authority}</div>
                    </div>
                  </div>

                  <span
                    className={`self-start sm:self-center text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full border ${stop.badgeBg}`}
                  >
                    {stop.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mt-2">
                  {stop.description}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="font-mono text-[11px] text-slate-300 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                    ID: {stop.verificationId}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Officially Verified Credential</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Route Map Footer / Action ── */}
        <div className="mt-12 sm:mt-16 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm sm:text-base font-bold text-white flex items-center justify-center sm:justify-start gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Verified Institutional Compliance &amp; Integrity
            </h4>
            <p className="text-xs text-slate-400 max-w-xl">
              All accreditations are backed by official public registries, ISO alignment, and real-time verification at Vyntyra Consultancy Services.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/verify"
              className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
            >
              Verify Credentials Online <ChevronRight className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://vyntyraconsultancyservices.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 border border-slate-700 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
            >
              Company Website <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
