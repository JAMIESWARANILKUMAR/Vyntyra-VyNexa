import React from "react";

export interface JourneyStep {
  step: number;
  title: string;
  desc: string;
  isTop: boolean;
}

const STEPS: JourneyStep[] = [
  {
    step: 1,
    title: "Live Mentor Guidance",
    desc: "Learn directly from experienced industry professionals through interactive live sessions and expert guidance.",
    isTop: true,
  },
  {
    step: 2,
    title: "Industry-Relevant Projects",
    desc: "Apply your knowledge by working on practical projects designed around real business challenges.",
    isTop: false,
  },
  {
    step: 3,
    title: "Portfolio Development",
    desc: "Build a strong project portfolio that showcases your practical skills and technical expertise.",
    isTop: true,
  },
  {
    step: 4,
    title: "ATS-Optimized Resume Building",
    desc: "Create a professional resume optimized for Applicant Tracking Systems (ATS) to improve your chances of getting shortlisted.",
    isTop: false,
  },
  {
    step: 5,
    title: "LinkedIn Profile Optimization",
    desc: "Develop a recruiter-friendly LinkedIn profile that strengthens your professional presence and personal brand.",
    isTop: true,
  },
  {
    step: 6,
    title: "Mock Interviews",
    desc: "Prepare for technical and HR interviews through structured mock interview sessions with personalized feedback.",
    isTop: false,
  },
  {
    step: 7,
    title: "Career Readiness",
    desc: "Enhance your communication, presentation, and professional skills to confidently enter the job market.",
    isTop: true,
  },
  {
    step: 8,
    title: "Placement Assistance",
    desc: "Receive placement assistance through our network of 500+ collaborated companies to help you explore relevant career opportunities.",
    isTop: false,
  },
];

export function CareerJourneyRouteMap() {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100 overflow-hidden">
      <div className="mx-auto max-w-7xl">
        {/* ── Section Header ── */}
        <div className="max-w-3xl mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-blue-600 uppercase tracking-widest mb-3">
            <span className="h-2 w-2 rounded-full bg-blue-600 inline-block" />
            YOUR JOURNEY
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Build your career, not just a resume.
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
            More than an internship — our 8-step Career Accelerator equips you with the skills, experience, and confidence to become industry-ready, one verifiable milestone at a time.
          </p>
        </div>

        {/* ── Desktop View: 8-Column Zig-Zag Route Map ── */}
        <div className="hidden xl:block relative pt-6 pb-12">
          {/* SVG Connecting Zig-Zag Dashed Blue Path */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <svg
              className="w-full h-full"
              viewBox="0 0 1200 320"
              fill="none"
              preserveAspectRatio="none"
            >
              {/* Coordinates:
                  Column Centers: x = 75, 225, 375, 525, 675, 825, 975, 1125
                  Top Y = 28, Bottom Y = 175
              */}
              <path
                d="M 75 28 L 225 175 L 375 28 L 525 175 L 675 28 L 825 175 L 975 28 L 1125 175 L 1180 200"
                stroke="#2563EB"
                strokeWidth="2.5"
                strokeDasharray="8 8"
                strokeLinecap="round"
              />
              {/* Endpoint Solid Blue Dot */}
              <circle cx="1185" cy="202" r="6" fill="#2563EB" />
            </svg>
          </div>

          {/* 8 Columns Grid */}
          <div className="grid grid-cols-8 gap-3 relative z-10">
            {STEPS.map((s) => (
              <div
                key={s.step}
                className="flex flex-col items-center text-center group"
                style={{
                  paddingTop: s.isTop ? "0px" : "147px",
                }}
              >
                {/* Numbered Circle Node */}
                <div className="w-12 h-12 rounded-full bg-white border-2 border-blue-600 text-blue-600 font-bold text-base flex items-center justify-center shadow-md shadow-blue-600/10 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 cursor-default select-none mb-4 shrink-0">
                  {s.step}
                </div>

                {/* Step Title & Description */}
                <div className="px-1 max-w-[145px]">
                  <h3 className="font-bold text-slate-900 text-[13px] leading-snug group-hover:text-blue-600 transition-colors">
                    {s.title}
                  </h3>
                  <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Laptop / Tablet View: 4-Column Responsive Layout ── */}
        <div className="hidden md:block xl:hidden relative py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative">
            {STEPS.map((s) => (
              <div
                key={s.step}
                className="rounded-2xl p-5 border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-400 hover:shadow-lg transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-blue-600 text-blue-600 font-bold text-sm flex items-center justify-center shadow-xs group-hover:bg-blue-600 group-hover:text-white transition-colors mb-3">
                    {s.step}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Mobile View: Vertical Connected Route Map ── */}
        <div className="block md:hidden relative pl-8 space-y-6 pt-2">
          {/* Vertical Dashed Blue Line */}
          <div className="absolute left-[15px] top-4 bottom-4 w-0 border-l-2 border-dashed border-blue-600" />

          {STEPS.map((s) => (
            <div key={s.step} className="relative group">
              {/* Number Circle Node on Line */}
              <div className="absolute -left-[32px] top-1 w-8 h-8 rounded-full bg-white border-2 border-blue-600 text-blue-600 font-bold text-xs flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors z-10">
                {s.step}
              </div>

              {/* Content Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 hover:bg-white hover:border-blue-300 transition-all">
                <h3 className="font-bold text-slate-900 text-sm">{s.title}</h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
