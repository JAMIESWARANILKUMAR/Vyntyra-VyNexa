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
} from "lucide-react";

export interface JourneyStep {
  step: number;
  category: "foundation" | "execution" | "acceleration" | "placement";
  categoryLabel: string;
  title: string;
  badge: string;
  desc: string;
  icon: typeof Laptop;
  highlights: string[];
  isTop: boolean;
}

const STEPS: JourneyStep[] = [
  {
    step: 1,
    category: "foundation",
    categoryLabel: "LMS & Resources",
    title: "Dedicated LMS Portal & Premium Resources",
    badge: "24/7 Access",
    desc: "Seamless onboarding to Vyntyra's dedicated cloud LMS portal equipped with curated enterprise repositories, architectural specs, video modules, and premium engineering toolkits.",
    icon: Laptop,
    highlights: ["Dedicated LMS Portal", "Curated Tech Stacks", "Premium Dev Resources"],
    isTop: true,
  },
  {
    step: 2,
    category: "foundation",
    categoryLabel: "Mentorship",
    title: "Dedicated Mentorship & Corporate Environment",
    badge: "1:1 Guidance",
    desc: "Work within an authentic corporate setup with dedicated senior mentors, agile daily standups, sprint retrospectives, and cross-functional team collaboration.",
    icon: Users,
    highlights: ["1:1 Senior Mentors", "Agile Standups & Sprints", "Corporate Culture"],
    isTop: false,
  },
  {
    step: 3,
    category: "execution",
    categoryLabel: "Projects",
    title: "ISO-Graded Industry-Level Projects",
    badge: "Production Scale",
    desc: "Architect and deliver production-grade platforms aligned with ISO quality standards, robust data security protocols, and enterprise microservice patterns.",
    icon: ShieldCheck,
    highlights: ["ISO Graded Standards", "Live Client Architectures", "High Availability Systems"],
    isTop: true,
  },
  {
    step: 4,
    category: "execution",
    categoryLabel: "Hands-on Tasks",
    title: "6 to 12 Tasks on Various Projects",
    badge: "Deep Practice",
    desc: "Execute 6 to 12 structured, milestone-driven tasks across varied client projects, encompassing Full-Stack web, AI/ML pipelines, Cloud/DevOps, and Data Engineering.",
    icon: Layers,
    highlights: ["6–12 Real-World Tasks", "Multi-Domain Experience", "Practical Problem Solving"],
    isTop: false,
  },
  {
    step: 5,
    category: "execution",
    categoryLabel: "Task Validation",
    title: "CBT Task Validation, Grading & Task-to-Task Reviews",
    badge: "Automated QA",
    desc: "Submit detailed task reports evaluated through Computer-Based Testing (CBT), automated test suites, transparent grade rubrics, and actionable pull-request code reviews.",
    icon: FileCheck2,
    highlights: ["CBT Based Task Validation", "Task-to-Task PR Reviews", "Transparent Grade Cards"],
    isTop: true,
  },
  {
    step: 6,
    category: "acceleration",
    categoryLabel: "Workshops",
    title: "Technical & Non-Technical Workshops & Bootcamps",
    badge: "Expert Led",
    desc: "Participate in intensive weekend bootcamps and workshops led by Tier-1 tech architects, covering Cloud Native architectures, GenAI, and executive corporate communication.",
    icon: Presentation,
    highlights: ["Tech & Soft Skills Workshops", "Industry Expert Bootcamps", "Live Interactive Demos"],
    isTop: false,
  },
  {
    step: 7,
    category: "acceleration",
    categoryLabel: "AI Interview Prep",
    title: "Advanced AI-Based Mock Interviews & ATS Resume Builder",
    badge: "Interview Ready",
    desc: "Undergo simulated technical and HR interviews with Vyntyra's voice/video AI interviewer with real-time scoring, paired with an intelligent ATS-compliant resume builder.",
    icon: Bot,
    highlights: ["Conversational Voice AI", "Real-Time Scoring Rubrics", "ATS Resume Optimizer"],
    isTop: true,
  },
  {
    step: 8,
    category: "placement",
    categoryLabel: "Global Career",
    title: "LinkedIn Branding & Global Placement Assistance",
    badge: "Career Launch",
    desc: "Amplify your global presence with verified credentials, institutional Letters of Recommendation (LOR), LinkedIn profile hardening, and direct hiring access to 500+ companies.",
    icon: Globe2,
    highlights: ["Verified Corporate LOR", "LinkedIn Profile Hardening", "500+ Hiring Companies"],
    isTop: false,
  },
];

export function CareerJourneyRouteMap() {
  const [activeFilter, setActiveFilter] = useState<"all" | "foundation" | "execution" | "acceleration" | "placement">("all");

  const filteredSteps = activeFilter === "all" ? STEPS : STEPS.filter((s) => s.category === activeFilter);

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50/70 border-t border-slate-200/80 overflow-hidden relative">
      {/* Background Subtle Corporate Grid Texture */}
      <div className="absolute inset-0 corporate-grid opacity-30 pointer-events-none" />
      <div className="absolute top-1/4 right-5 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-5 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl relative z-10">
        {/* ── Section Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-600/20 bg-blue-50 px-3 py-1 text-xs font-mono font-bold text-blue-700 uppercase tracking-widest mb-3 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              YOUR CAREER ACCELERATOR ROUTE MAP
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Build your career,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900">
                not just a resume.
              </span>
            </h2>

            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
              More than an internship — our 8-step Career Accelerator equips you with dedicated LMS access, ISO-graded industry projects, CBT-based task evaluations, live expert bootcamps, and AI-driven interview readiness.
            </p>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-xs self-start md:self-auto">
            {[
              { id: "all", label: "All 8 Milestones" },
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
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Desktop View: Elegant Route Map with Safe Timeline & Cards ── */}
        <div className="hidden xl:block relative pt-4 pb-12">
          {/* Main Horizontal Timeline Track (No overlapping lines on text!) */}
          <div className="relative mb-8">
            <div className="grid grid-cols-8 gap-4 items-center relative">
              {/* Central Continuous Connecting Route Line */}
              <div className="absolute left-[6%] right-[6%] top-1/2 -translate-y-1/2 h-[3px] bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-full z-0 shadow-xs">
                {/* Flowing animated dash indicator */}
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.8)_50%,transparent_100%)] opacity-60 animate-pulse" />
              </div>

              {STEPS.map((s) => {
                const isMatch = activeFilter === "all" || s.category === activeFilter;
                const IconComponent = s.icon;
                return (
                  <div key={s.step} className="flex flex-col items-center relative z-10 group">
                    {/* Node Circle on the Line */}
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md ${
                        isMatch
                          ? "bg-white border-2 border-blue-600 text-blue-700 shadow-blue-600/15 scale-100 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white"
                          : "bg-slate-100 border border-slate-300 text-slate-400 opacity-50 scale-95"
                      }`}
                    >
                      <IconComponent className="h-6 w-6 transition-transform group-hover:rotate-6" />
                    </div>

                    {/* Step Number Badge */}
                    <span
                      className={`mt-2 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
                        isMatch
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      Step 0{s.step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 8 Milestone Executive Cards in a clean, high-visibility 8-column layout */}
          <div className="grid grid-cols-8 gap-3.5 relative z-10">
            {STEPS.map((s) => {
              const isMatch = activeFilter === "all" || s.category === activeFilter;
              return (
                <div
                  key={s.step}
                  className={`rounded-2xl p-4 flex flex-col justify-between border transition-all duration-300 bg-white ${
                    isMatch
                      ? "border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-400 hover:-translate-y-1.5 opacity-100"
                      : "border-slate-200/60 opacity-35 bg-slate-50/50"
                  }`}
                >
                  <div>
                    {/* Card Category & Badge */}
                    <div className="flex items-center justify-between gap-1 mb-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 font-mono">
                        {s.categoryLabel}
                      </span>
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60">
                        {s.badge}
                      </span>
                    </div>

                    {/* Milestone Title */}
                    <h3 className="font-bold text-slate-900 text-xs leading-snug tracking-tight mb-2 min-h-[36px]">
                      {s.title}
                    </h3>

                    {/* Milestone Description */}
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>

                  {/* Highlights Bullet Tags */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1">
                    {s.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-700 font-medium">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Laptop & Tablet View: 4-Column Responsive Grid ── */}
        <div className="hidden md:block xl:hidden py-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredSteps.map((s) => {
              const IconComponent = s.icon;
              return (
                <div
                  key={s.step}
                  className="rounded-2xl p-5 border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:border-blue-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-sm shadow-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                        Step 0{s.step}
                      </span>
                    </div>

                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-1">
                      {s.categoryLabel} · <span className="text-amber-600">{s.badge}</span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-blue-600 transition-colors">
                      {s.title}
                    </h3>

                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                    {s.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
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

        {/* ── Mobile View: Vertical Connected Route Map ── */}
        <div className="block md:hidden relative pl-8 space-y-5 pt-2">
          {/* Vertical Continuous Blue Route Line */}
          <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-600 via-indigo-600 to-blue-700" />

          {filteredSteps.map((s) => {
            const IconComponent = s.icon;
            return (
              <div key={s.step} className="relative group">
                {/* Number Circle Node on Line */}
                <div className="absolute -left-[32px] top-2 w-8 h-8 rounded-full bg-white border-2 border-blue-600 text-blue-700 font-bold text-xs flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors z-10">
                  {s.step}
                </div>

                {/* Content Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-blue-300 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 font-mono">
                      {s.categoryLabel}
                    </span>
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60">
                      {s.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{s.title}</h3>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">{s.desc}</p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                    {s.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-700">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
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
                className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
