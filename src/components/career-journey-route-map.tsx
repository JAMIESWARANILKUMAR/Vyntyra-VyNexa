import React, { useState } from "react";
import {
  Laptop,
  Users,
  ShieldCheck,
  CheckCircle2,
  Award,
  Presentation,
  Bot,
  Globe2,
  Sparkles,
  ArrowRight,
  Code2,
  FileCheck2,
  Briefcase,
  Layers,
  GraduationCap,
  TrendingUp,
  MapPin,
  Check,
  ExternalLink,
  ChevronRight,
  Flame,
  LayoutGrid,
  Route as RouteIcon,
} from "lucide-react";

export interface JourneyStep {
  step: number;
  phase: string;
  category: "foundation" | "execution" | "acceleration" | "placement";
  categoryLabel: string;
  title: string;
  badge: string;
  desc: string;
  icon: typeof Laptop;
  highlights: string[];
  isTop: boolean;
  accentColor: string;
}

const STEPS: JourneyStep[] = [
  {
    step: 1,
    phase: "Phase 01 · Onboarding",
    category: "foundation",
    categoryLabel: "LMS & Resources",
    title: "Dedicated LMS Portal & Premium Resources",
    badge: "24/7 Cloud LMS",
    desc: "Seamless onboarding to Vyntyra's dedicated cloud LMS portal equipped with curated enterprise repositories, architectural specs, video masterclasses, and premium developer toolkits.",
    icon: Laptop,
    highlights: ["Dedicated LMS Portal", "Curated Tech Stacks", "Premium Dev Resources"],
    isTop: true,
    accentColor: "from-blue-600 to-cyan-500",
  },
  {
    step: 2,
    phase: "Phase 01 · Onboarding",
    category: "foundation",
    categoryLabel: "Mentorship",
    title: "Dedicated Mentorship & Corporate Environment",
    badge: "1:1 Corporate Culture",
    desc: "Work within an authentic corporate setup with dedicated senior mentors, agile daily standups, sprint retrospectives, and cross-functional team collaboration.",
    icon: Users,
    highlights: ["1:1 Senior Mentors", "Agile Standups & Sprints", "Corporate Workspaces"],
    isTop: false,
    accentColor: "from-blue-600 to-indigo-600",
  },
  {
    step: 3,
    phase: "Phase 02 · Engineering",
    category: "execution",
    categoryLabel: "Projects",
    title: "ISO-Graded Industry-Level Projects",
    badge: "ISO Benchmarked",
    desc: "Architect and deliver production-grade platforms aligned with ISO quality standards, robust data security protocols, and enterprise microservice patterns.",
    icon: ShieldCheck,
    highlights: ["ISO Graded Standards", "Live Client Architectures", "High Availability Systems"],
    isTop: true,
    accentColor: "from-indigo-600 to-blue-700",
  },
  {
    step: 4,
    phase: "Phase 02 · Engineering",
    category: "execution",
    categoryLabel: "Hands-on Tasks",
    title: "6 to 12 Tasks Across Various Projects",
    badge: "6–12 Live Tasks",
    desc: "Execute 6 to 12 structured, milestone-driven tasks across varied client projects, encompassing Full-Stack web, AI/ML pipelines, Cloud/DevOps, and Data Engineering.",
    icon: Layers,
    highlights: ["6–12 Real-World Tasks", "Multi-Domain Experience", "Practical Problem Solving"],
    isTop: false,
    accentColor: "from-blue-700 to-purple-600",
  },
  {
    step: 5,
    phase: "Phase 02 · Engineering",
    category: "execution",
    categoryLabel: "Task Validation",
    title: "Task Report & CBT Validation with Grading",
    badge: "CBT Automated QA",
    desc: "Submit detailed task reports evaluated through Computer-Based Testing (CBT), automated test suites, transparent grade rubrics, and actionable pull-request code reviews.",
    icon: FileCheck2,
    highlights: ["CBT Based Task Validation", "Task-to-Task PR Reviews", "Transparent Grade Cards"],
    isTop: true,
    accentColor: "from-purple-600 to-indigo-600",
  },
  {
    step: 6,
    phase: "Phase 03 · Acceleration",
    category: "acceleration",
    categoryLabel: "Bootcamps",
    title: "Technical & Non-Technical Workshops & Bootcamps",
    badge: "Tier-1 Experts",
    desc: "Participate in intensive weekend bootcamps and workshops led by Tier-1 tech architects, covering Cloud Native architectures, GenAI, and executive corporate communication.",
    icon: Presentation,
    highlights: ["Tech & Soft Skills Workshops", "Industry Expert Bootcamps", "Live Interactive Q&A"],
    isTop: false,
    accentColor: "from-amber-500 to-orange-500",
  },
  {
    step: 7,
    phase: "Phase 03 · Acceleration",
    category: "acceleration",
    categoryLabel: "AI Mock Interviews",
    title: "Advanced AI Mock Interviews & ATS Resume Builder",
    badge: "AI Evaluated",
    desc: "Undergo simulated technical and HR interviews with Vyntyra's voice/video AI interviewer with real-time scoring, paired with an intelligent ATS-compliant resume builder.",
    icon: Bot,
    highlights: ["Conversational Voice AI", "Real-Time Scoring Rubrics", "ATS Resume Optimizer"],
    isTop: true,
    accentColor: "from-emerald-600 to-teal-600",
  },
  {
    step: 8,
    phase: "Phase 04 · Career Launch",
    category: "placement",
    categoryLabel: "Global Presence",
    title: "LinkedIn Hardening & Global Placement Assistance",
    badge: "500+ Partner Network",
    desc: "Amplify your global presence with verified credentials, institutional Letters of Recommendation (LOR), LinkedIn profile hardening, and direct hiring access to 500+ companies.",
    icon: Globe2,
    highlights: ["Verified Corporate LOR", "LinkedIn Profile Hardening", "500+ Hiring Companies"],
    isTop: false,
    accentColor: "from-blue-600 to-cyan-600",
  },
];

export function CareerJourneyRouteMap() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [activeFilter, setActiveFilter] = useState<"all" | "foundation" | "execution" | "acceleration" | "placement">("all");
  const [viewMode, setViewMode] = useState<"route" | "grid">("route");

  const filteredSteps = activeFilter === "all" ? STEPS : STEPS.filter((s) => s.category === activeFilter);
  const currentStepData = STEPS.find((s) => s.step === activeStep) || STEPS[0];

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white text-slate-900 border-t border-slate-200/80 relative overflow-hidden">
      {/* ── Subtle Background Corporate Grid Texture ── */}
      <div className="absolute inset-0 corporate-grid opacity-10 pointer-events-none" />

      <div className="mx-auto max-w-7xl relative z-10">
        {/* ── Section Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-600/20 bg-blue-50 px-3.5 py-1 text-xs font-mono font-bold text-blue-700 uppercase tracking-widest mb-3 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              YOUR CAREER ACCELERATOR ROUTE MAP
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.12]">
              Build your career,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800">
                not just a resume.
              </span>
            </h2>

            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl font-normal">
              More than an internship — our 8-step Career Accelerator equips you with dedicated LMS access, ISO-graded industry projects, CBT-based task evaluations, live expert bootcamps, and AI-driven interview readiness.
            </p>
          </div>

          {/* Controls: Category Filter + View Switcher */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-xl">
              {[
                { id: "all", label: "All 8 Steps" },
                { id: "foundation", label: "LMS & Mentorship" },
                { id: "execution", label: "Projects & CBT" },
                { id: "acceleration", label: "Bootcamps & AI" },
                { id: "placement", label: "Global Placement" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id as typeof activeFilter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeFilter === f.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="hidden xl:flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-xl">
              <button
                onClick={() => setViewMode("route")}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === "route" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
                title="Interactive Zig-Zag Route View"
              >
                <RouteIcon className="h-4 w-4" />
                <span>Route</span>
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === "grid" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
                title="Matrix Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
                <span>Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Active Milestone Quick Inspector Strip (Interactive Highlight) ── */}
        <div className="mb-10 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-md shadow-blue-600/20">
              0{currentStepData.step}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-blue-600 font-bold">
                  {currentStepData.phase}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  {currentStepData.badge}
                </span>
              </div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate mt-0.5">
                {currentStepData.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <span className="text-xs text-slate-500 hidden sm:inline font-medium">Navigate:</span>
            {STEPS.map((s) => (
              <button
                key={s.step}
                onClick={() => setActiveStep(s.step)}
                className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all ${
                  activeStep === s.step
                    ? "bg-blue-600 text-white shadow-sm scale-110"
                    : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {s.step}
              </button>
            ))}
          </div>
        </div>

        {/* ── DESKTOP VIEW 1: Creative Zig-Zag Highway Route Map ── */}
        {viewMode === "route" && (
          <div className="hidden xl:block relative select-none" style={{ height: "700px" }}>
            {/* SVG Connecting Zig-Zag Corporate Highway (Coordinates strictly pass through node centers!) */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <svg className="w-full h-full" viewBox="0 0 1200 700" fill="none" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="routeGlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="50%" stopColor="#4F46E5" />
                    <stop offset="100%" stopColor="#2563EB" />
                  </linearGradient>
                </defs>

                {/* Outer Ambient Track Line */}
                <path
                  d="M 80 270 L 230 430 L 375 270 L 525 430 L 675 270 L 825 430 L 970 270 L 1120 430"
                  stroke="#DBEAFE"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Main Vibrant Blue Dashed Highway Path */}
                <path
                  d="M 80 270 L 230 430 L 375 270 L 525 430 L 675 270 L 825 430 L 970 270 L 1120 430"
                  stroke="url(#routeGlowGrad)"
                  strokeWidth="3.5"
                  strokeDasharray="10 8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Vertical Connector Stems from Nodes to Cards (Never intersects text!) */}
                {/* Odd Steps (Top): Stem from node (y=245) upwards to bottom of card (y=210) */}
                <line x1="80" y1="245" x2="80" y2="210" stroke="#93C5FD" strokeWidth="2" strokeDasharray="3 3" />
                <line x1="375" y1="245" x2="375" y2="210" stroke="#93C5FD" strokeWidth="2" strokeDasharray="3 3" />
                <line x1="675" y1="245" x2="675" y2="210" stroke="#93C5FD" strokeWidth="2" strokeDasharray="3 3" />
                <line x1="970" y1="245" x2="970" y2="210" stroke="#93C5FD" strokeWidth="2" strokeDasharray="3 3" />

                {/* Even Steps (Bottom): Stem from node (y=455) downwards to top of card (y=490) */}
                <line x1="230" y1="455" x2="230" y2="490" stroke="#93C5FD" strokeWidth="2" strokeDasharray="3 3" />
                <line x1="525" y1="455" x2="525" y2="490" stroke="#93C5FD" strokeWidth="2" strokeDasharray="3 3" />
                <line x1="825" y1="455" x2="825" y2="490" stroke="#93C5FD" strokeWidth="2" strokeDasharray="3 3" />
                <line x1="1120" y1="455" x2="1120" y2="490" stroke="#93C5FD" strokeWidth="2" strokeDasharray="3 3" />
              </svg>
            </div>

            {/* 8 Columns: Nodes and Cards placed with absolute clearance */}
            <div className="grid grid-cols-8 gap-3 h-full relative z-10">
              {STEPS.map((s) => {
                const isSelected = activeStep === s.step;
                const IconComponent = s.icon;
                return (
                  <div
                    key={s.step}
                    className="relative flex flex-col items-center h-full cursor-pointer group"
                    onClick={() => setActiveStep(s.step)}
                  >
                    {/* Top Cards (Odd Steps: 1, 3, 5, 7) */}
                    {s.isTop && (
                      <div
                        className={`absolute top-0 w-full max-w-[155px] rounded-xl p-3 border transition-all duration-300 bg-white ${
                          isSelected
                            ? "border-blue-600 shadow-xl ring-2 ring-blue-100 -translate-y-1.5"
                            : "border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md"
                        }`}
                        style={{ height: "210px" }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] font-mono font-bold text-blue-600 uppercase truncate">
                            {s.categoryLabel}
                          </span>
                          <span className="text-[8px] font-semibold px-1 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {s.badge}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-[11px] leading-snug line-clamp-2 mb-1.5">
                          {s.title}
                        </h4>
                        <p className="text-[10px] text-slate-600 leading-tight line-clamp-3">
                          {s.desc}
                        </p>
                        <div className="mt-2 pt-1.5 border-t border-slate-100 flex flex-col gap-0.5">
                          {s.highlights.slice(0, 2).map((h, i) => (
                            <span key={i} className="text-[9px] text-slate-700 flex items-center gap-1 truncate">
                              <Check className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{h}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Milestone Node Circle on the Route (Y = 245 for Top, Y = 405 for Bottom) */}
                    <div
                      className="absolute flex flex-col items-center"
                      style={{ top: s.isTop ? "245px" : "405px" }}
                    >
                      <div
                        className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md select-none ${
                          isSelected
                            ? "bg-blue-600 text-white scale-115 shadow-lg shadow-blue-600/30 ring-4 ring-blue-100"
                            : "bg-white border-2 border-blue-600 text-blue-600 group-hover:scale-105 group-hover:bg-blue-50"
                        }`}
                      >
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <span
                        className={`mt-1.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600 group-hover:text-blue-600"
                        }`}
                      >
                        Step 0{s.step}
                      </span>
                    </div>

                    {/* Bottom Cards (Even Steps: 2, 4, 6, 8) */}
                    {!s.isTop && (
                      <div
                        className={`absolute bottom-0 w-full max-w-[155px] rounded-xl p-3 border transition-all duration-300 bg-white ${
                          isSelected
                            ? "border-blue-600 shadow-xl ring-2 ring-blue-100 translate-y-1.5"
                            : "border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md"
                        }`}
                        style={{ height: "210px" }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] font-mono font-bold text-blue-600 uppercase truncate">
                            {s.categoryLabel}
                          </span>
                          <span className="text-[8px] font-semibold px-1 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            {s.badge}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-[11px] leading-snug line-clamp-2 mb-1.5">
                          {s.title}
                        </h4>
                        <p className="text-[10px] text-slate-600 leading-tight line-clamp-3">
                          {s.desc}
                        </p>
                        <div className="mt-2 pt-1.5 border-t border-slate-100 flex flex-col gap-0.5">
                          {s.highlights.slice(0, 2).map((h, i) => (
                            <span key={i} className="text-[9px] text-slate-700 flex items-center gap-1 truncate">
                              <Check className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{h}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── DESKTOP VIEW 2: Executive Matrix Grid View ── */}
        {(viewMode === "grid" || false) && (
          <div className="hidden xl:grid grid-cols-4 gap-5">
            {filteredSteps.map((s) => {
              const IconComponent = s.icon;
              const isSelected = activeStep === s.step;
              return (
                <div
                  key={s.step}
                  onClick={() => setActiveStep(s.step)}
                  className={`rounded-2xl p-5 border transition-all duration-300 cursor-pointer flex flex-col justify-between bg-white ${
                    isSelected
                      ? "border-blue-600 shadow-lg ring-2 ring-blue-100 -translate-y-1"
                      : "border-slate-200 hover:border-blue-300 hover:shadow-md"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-sm">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                        Step 0{s.step}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 mb-1">
                      {s.phase}
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm leading-snug mb-2">
                      {s.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {s.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                    {s.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-slate-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── LAPTOP & TABLET VIEW: Responsive 4-Column Modern Cards ── */}
        <div className="hidden md:block xl:hidden py-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredSteps.map((s) => {
              const IconComponent = s.icon;
              return (
                <div
                  key={s.step}
                  onClick={() => setActiveStep(s.step)}
                  className="rounded-2xl p-5 border border-slate-200 bg-white shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        Step 0{s.step}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 mb-1">
                      {s.categoryLabel} · <span className="text-amber-700">{s.badge}</span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-blue-600 transition-colors">
                      {s.title}
                    </h4>

                    <p className="mt-2 text-xs text-slate-600 leading-relaxed font-normal">
                      {s.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                    {s.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-slate-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── MOBILE VIEW: Vertical Metro Highway Route Map ── */}
        <div className="block md:hidden relative pl-8 space-y-5 pt-2">
          {/* Vertical Highway Line */}
          <div className="absolute left-[15px] top-4 bottom-4 w-1 bg-gradient-to-b from-blue-600 via-indigo-600 to-blue-700 rounded-full" />

          {filteredSteps.map((s) => {
            const IconComponent = s.icon;
            const isSelected = activeStep === s.step;
            return (
              <div
                key={s.step}
                className="relative group cursor-pointer"
                onClick={() => setActiveStep(s.step)}
              >
                {/* Number Circle Node on Line */}
                <div
                  className={`absolute -left-[32px] top-2 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all z-10 shadow-sm ${
                    isSelected
                      ? "bg-blue-600 text-white ring-4 ring-blue-100 scale-110"
                      : "bg-white border-2 border-blue-600 text-blue-600"
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                </div>

                {/* Content Card */}
                <div
                  className={`rounded-xl border p-4 transition-all bg-white ${
                    isSelected
                      ? "border-blue-600 shadow-md ring-2 ring-blue-50"
                      : "border-slate-200 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600">
                      Step 0{s.step} · {s.categoryLabel}
                    </span>
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {s.badge}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm leading-snug">{s.title}</h4>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed font-normal">{s.desc}</p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                    {s.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-700">
                        <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Bottom Feature Highlights Matrix Bar ── */}
        <div className="mt-14 sm:mt-18 pt-8 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              icon: Laptop,
              title: "Dedicated LMS & Tools",
              desc: "Personalized dashboard, task progress tracking & premium enterprise repos.",
            },
            {
              icon: ShieldCheck,
              title: "ISO-Graded Projects",
              desc: "Engineered to strict quality benchmarks with 6–12 multi-domain tasks.",
            },
            {
              icon: FileCheck2,
              title: "CBT Task Validation",
              desc: "Automated test suites, task-to-task PR reviews & transparent grade cards.",
            },
            {
              icon: Bot,
              title: "AI Interviews & ATS",
              desc: "Voice/video AI interview coaching & recruiter-ready ATS resume crafting.",
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-slate-50/80 p-4.5 shadow-xs flex items-start gap-3 hover:border-blue-300 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">{item.title}</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-normal font-normal">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
