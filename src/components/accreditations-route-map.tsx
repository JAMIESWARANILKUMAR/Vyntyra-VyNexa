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
} from "lucide-react";

export interface RouteStop {
  id: string;
  stepNumber: number;
  category: string;
  title: string;
  badge: string;
  authority: string;
  verificationId: string;
  description: string;
  isTop: boolean;
  logo: React.ReactNode;
}

// ── Official Branding Logo Badges (Crisp White Corporate Finish) ──

function GreatPlaceToWorkOfficialLogo() {
  return (
    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#DF192A] text-white p-1.5 flex flex-col justify-between shadow-md border border-red-500/20 select-none shrink-0">
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
    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white p-1.5 flex flex-col items-center justify-center shadow-md border border-slate-200 select-none shrink-0 overflow-hidden">
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
    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white p-1.5 flex flex-col items-center justify-center shadow-md border border-slate-200 select-none shrink-0 overflow-hidden">
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
    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white p-1.5 flex flex-col items-center justify-center shadow-md border border-slate-200 select-none shrink-0 relative overflow-hidden">
      <div className="flex items-center gap-0.5 mb-1">
        <span className="h-1.5 w-2 rounded-xs bg-[#FF9933]" />
        <span className="h-1.5 w-2 rounded-xs bg-slate-200" />
        <span className="h-1.5 w-2 rounded-xs bg-[#138808]" />
      </div>
      <div className="text-[8px] sm:text-[9px] font-black text-slate-900 uppercase tracking-tight text-center leading-none">
        Skill India
      </div>
      <div className="text-[6px] sm:text-[6.5px] font-bold text-blue-600 text-center leading-tight mt-0.5">
        कौशल भारत
      </div>
      <div className="text-[5px] text-slate-500 font-mono tracking-tighter mt-0.5 font-bold">
        NSDC ALIGNED
      </div>
    </div>
  );
}

function AmbitionBoxOfficialLogo() {
  return (
    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white p-1.5 flex flex-col items-center justify-between shadow-md border border-slate-200 select-none shrink-0">
      <div className="flex items-center gap-1 w-full justify-center pt-0.5">
        <div className="h-4 w-4 rounded-sm bg-[#00BA74] text-white flex items-center justify-center font-black text-[9px]">
          AB
        </div>
        <span className="text-[8px] font-black text-slate-900 tracking-tighter">AmbitionBox</span>
      </div>
      <div className="bg-emerald-50 border border-emerald-200 w-full rounded py-0.5 px-1 flex items-center justify-center gap-1">
        <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
        <span className="text-[8px] font-bold text-slate-900">4.5</span>
        <span className="text-[6px] text-emerald-700 font-semibold">/5</span>
      </div>
    </div>
  );
}

function JustdialOfficialLogo() {
  return (
    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white p-1.5 flex flex-col items-center justify-between shadow-md border border-slate-200 select-none shrink-0">
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
    stepNumber: 1,
    category: "Statutory Accreditation",
    title: "MSME Registered Enterprise",
    badge: "Govt. of India",
    authority: "Ministry of Micro, Small & Medium Enterprises",
    verificationId: "UDYAM-AP-09-0051886",
    description: "Officially registered corporate entity complying with central enterprise governance and Indian IT industry standards.",
    isTop: true,
    logo: <MsmeOfficialLogo />,
  },
  {
    id: "skill-india",
    stepNumber: 2,
    category: "National Mission Alignment",
    title: "Skill Development of India",
    badge: "Skill India Mission",
    authority: "National Technical Development Framework",
    verificationId: "National Competency Aligned",
    description: "Curriculum and hands-on internship programs aligned with national goals for youth tech employment and industrial competency.",
    isTop: false,
    logo: <SkillIndiaOfficialLogo />,
  },
  {
    id: "nasscom",
    stepNumber: 3,
    category: "Emerging Tech Accreditation",
    title: "NASSCOM FutureSkills Prime",
    badge: "Recognised Partner",
    authority: "NASSCOM & MeitY Digital Ecosystem",
    verificationId: "Digital Skills Partner",
    description: "Accelerating modern tech talent across Enterprise AI, Next.js Web Architectures, Mobile Engineering, and Cloud DevOps.",
    isTop: true,
    logo: <NasscomOfficialLogo />,
  },
  {
    id: "justdial",
    stepNumber: 4,
    category: "Client Trust & Delivery",
    title: "Justdial Verified Enterprise",
    badge: "4.1 / 5.0 ★ Rated",
    authority: "Justdial Consumer Business Ratings",
    verificationId: "Verified Service Provider",
    description: "Validated client delivery track record, transparent operational metrics, and authentic verified ratings for IT solutions.",
    isTop: false,
    logo: <JustdialOfficialLogo />,
  },
  {
    id: "ambitionbox",
    stepNumber: 5,
    category: "Employee & Mentee Experience",
    title: "AmbitionBox Workplace Benchmark",
    badge: "4.5 / 5.0 ★ Rated",
    authority: "AmbitionBox · A Times Internet Company",
    verificationId: "Top-Rated Culture Score",
    description: "Praised by interns, engineers, and mentors for an empowering learning curve, work-life balance, and transparent leadership.",
    isTop: true,
    logo: <AmbitionBoxOfficialLogo />,
  },
  {
    id: "gptw",
    stepNumber: 6,
    category: "Pinnacle Workplace Standard",
    title: "Great Place to Work®",
    badge: "Certified 2026–27",
    authority: "Great Place to Work® Institute",
    verificationId: "Certified Cohort 2026–2027",
    description: "The global gold standard in workplace culture, high-trust leadership, employee flourishing, and innovation excellence.",
    isTop: false,
    logo: <GreatPlaceToWorkOfficialLogo />,
  },
];

export function AccreditationsRouteMap() {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50/70 border-y border-slate-200/80 overflow-hidden">
      <div className="mx-auto max-w-7xl">
        {/* ── Section Header ── */}
        <div className="max-w-3xl mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-blue-600 uppercase tracking-widest mb-3">
            <span className="h-2 w-2 rounded-full bg-blue-600 inline-block" />
            INSTITUTIONAL ACCREDITATION ROUTE MAP
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Backed by National Trust, Global Standards.
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
            Follow the certified trajectory of Vyntyra Consultancy Services — from statutory central government incorporation to prestigious national skill alignments and the gold standard in workplace excellence.
          </p>

          {/* Verification Pill Strip */}
          <div className="mt-6 flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              6 / 6 Milestones Verified
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              Govt. MSME &amp; NASSCOM Aligned
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-semibold">
              <Award className="h-3.5 w-3.5 text-amber-600" />
              Great Place to Work® 2026–27
            </span>
          </div>
        </div>

        {/* ── Desktop View: 6-Column Zig-Zag Route Map ── */}
        <div className="hidden xl:block relative pt-6 pb-12">
          {/* SVG Connecting Zig-Zag Dashed Blue Path */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <svg
              className="w-full h-full"
              viewBox="0 0 1200 380"
              fill="none"
              preserveAspectRatio="none"
            >
              {/* Coordinates for 6 Columns:
                  x = 100, 300, 500, 700, 900, 1100
                  Top Y = 28, Bottom Y = 185
              */}
              <path
                d="M 100 28 L 300 185 L 500 28 L 700 185 L 900 28 L 1100 185 L 1170 205"
                stroke="#2563EB"
                strokeWidth="2.5"
                strokeDasharray="8 8"
                strokeLinecap="round"
              />
              <circle cx="1175" cy="206" r="6" fill="#2563EB" />
            </svg>
          </div>

          {/* 6 Columns Grid */}
          <div className="grid grid-cols-6 gap-3.5 relative z-10">
            {ROUTE_STOPS.map((s) => (
              <div
                key={s.id}
                className="flex flex-col items-center group"
                style={{
                  paddingTop: s.isTop ? "0px" : "157px",
                }}
              >
                {/* Numbered Circle Node */}
                <div className="w-12 h-12 rounded-full bg-white border-2 border-blue-600 text-blue-600 font-bold text-base flex items-center justify-center shadow-md shadow-blue-600/10 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 cursor-default select-none mb-4 shrink-0">
                  {s.stepNumber}
                </div>

                {/* Stylish White Corporate Card */}
                <div className="w-full rounded-2xl bg-white p-4 border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all duration-300 flex flex-col justify-between min-h-[310px]">
                  <div>
                    {/* Top: Logo & Badge */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      {s.logo}
                      <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                        {s.badge}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 mb-1">
                      {s.category}
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors leading-snug">
                      {s.title}
                    </h3>

                    <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                      {s.authority}
                    </div>

                    <p className="mt-2 text-[11px] text-slate-600 leading-relaxed">
                      {s.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400">Registry ID</div>
                    <div className="font-mono text-[10px] font-semibold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 truncate mt-0.5">
                      {s.verificationId}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Officially Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Laptop / Tablet View: 3-Column Responsive Grid ── */}
        <div className="hidden md:block xl:hidden relative py-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {ROUTE_STOPS.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl p-5 border border-slate-200 bg-white hover:border-blue-400 hover:shadow-lg transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-full bg-white border-2 border-blue-600 text-blue-600 font-bold text-sm flex items-center justify-center shadow-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {s.stepNumber}
                    </div>
                    {s.logo}
                  </div>

                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 mb-1">
                    {s.category}
                  </div>

                  <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                    {s.title}
                  </h3>
                  <div className="text-xs text-slate-500 mb-2">{s.authority}</div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {s.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold truncate max-w-[150px]">
                    {s.verificationId}
                  </span>
                  <span className="text-emerald-600 text-[11px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Mobile View: Vertical Connected Route Track ── */}
        <div className="block md:hidden relative pl-8 space-y-6 pt-2">
          {/* Vertical Dashed Blue Line */}
          <div className="absolute left-[15px] top-4 bottom-4 w-0 border-l-2 border-dashed border-blue-600" />

          {ROUTE_STOPS.map((s) => (
            <div key={s.id} className="relative group">
              {/* Number Circle Node on Line */}
              <div className="absolute -left-[32px] top-1 w-8 h-8 rounded-full bg-white border-2 border-blue-600 text-blue-600 font-bold text-xs flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors z-10">
                {s.stepNumber}
              </div>

              {/* Card Container */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm hover:border-blue-400 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    {s.logo}
                    <div>
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600">
                        {s.category}
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                        {s.title}
                      </h3>
                      <div className="text-[11px] text-slate-500">{s.authority}</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                    {s.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mt-2">
                  {s.description}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold truncate max-w-[180px]">
                    ID: {s.verificationId}
                  </span>
                  <span className="text-emerald-600 text-[11px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Officially Verified
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Route Map Footer Card (Crisp White Finish) ── */}
        <div className="mt-12 sm:mt-16 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Verified Institutional Compliance &amp; Integrity
            </h4>
            <p className="text-xs text-slate-500 max-w-xl">
              All accreditations are backed by official public registries, ISO alignment, and real-time verification at Vyntyra Consultancy Services Pvt. Ltd.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/verify"
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
            >
              Verify Credentials Online <ChevronRight className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://vyntyraconsultancyservices.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
            >
              Company Website <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
