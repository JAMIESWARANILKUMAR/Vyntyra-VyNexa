import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getApplicationsOpen } from "@/lib/settings.functions";
import { listActiveJobPostings } from "@/lib/job-postings.functions";
import { incrementVisitorCount } from "@/lib/visitor.functions";
import {
  Shield,
  CheckCircle2,
  ArrowRight,
  Globe2,
  Mail,
  X,
  ChevronRight,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Laptop,
  Layers,
  Code2,
  Bot,
  Cloud,
  Database,
  Smartphone,
  Cpu,
  Award,
  Users,
  Gift,
  TrendingUp,
  Zap,
  Plane,
  FileCheck2,
  Crown,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorldClocks } from "@/components/world-clocks";
import { Header } from "@/components/Header";
import { AccreditationsRouteMap } from "@/components/accreditations-route-map";
import { CareerJourneyRouteMap } from "@/components/career-journey-route-map";
import { HiringCompaniesMarquee } from "@/components/hiring-companies-marquee";
import { AmbassadorComingSoonModal } from "@/components/ambassador-coming-soon-modal";
import { GLOBAL_SEO_META_TAGS } from "@/lib/seo-metadata";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Careers & Internships — Vyntyra Consultancy Services" },
      {
        name: "description",
        content:
          "Explore careers and accredited student internships at Vyntyra Consultancy Services — Great Place to Work® Certified 2026-27. Full-Stack, Enterprise AI, Cloud & DevOps, and Data Engineering roles.",
      },
      ...GLOBAL_SEO_META_TAGS,
    ],
  }),
  component: CareersPage,
});

const DOMAINS_LIST = [
  {
    icon: Laptop,
    title: "Full-Stack Web & Cloud Architecture",
    type: "Engineering & Technology",
    badge: "Hiring Immediately",
    desc: "Architect enterprise web platforms using Next.js, React, Node.js, and modern TypeScript. Build scalable REST/GraphQL APIs, microservices, and reactive user interfaces.",
    skills: ["React / Next.js", "Node.js & Python", "PostgreSQL & Redis", "Cloud Architecture"],
  },
  {
    icon: Bot,
    title: "Enterprise AI, Machine Learning & NLP",
    type: "Artificial Intelligence",
    badge: "High Demand",
    desc: "Build production-grade AI solutions, LLM agentic pipelines, Retrieval-Augmented Generation (RAG), and fine-tuned models for enterprise automation and intelligence.",
    skills: ["LLM Agents & RAG", "Python AI / PyTorch", "Vector DBs", "Prompt Engineering"],
  },
  {
    icon: Smartphone,
    title: "Mobile App Engineering",
    type: "Mobile Platforms",
    badge: "Active Openings",
    desc: "Develop cross-platform and native mobile applications using Flutter and React Native. Ship high-performance consumer and enterprise apps with offline sync.",
    skills: ["Flutter & Dart", "React Native", "State Management", "Mobile CI/CD"],
  },
  {
    icon: Cloud,
    title: "Cloud Infrastructure, DevOps & SRE",
    type: "Cloud Platforms",
    badge: "Active Openings",
    desc: "Manage high-availability cloud systems on AWS, Cloudflare, and GCP. Design CI/CD pipelines, container orchestration with Docker/K8s, and automated zero-downtime releases.",
    skills: ["Docker & Kubernetes", "CI/CD Workflows", "AWS / Cloudflare", "Infrastructure as Code"],
  },
  {
    icon: Database,
    title: "Data Engineering & Analytics",
    type: "Data Platforms",
    badge: "Open Cohort",
    desc: "Engineer resilient data pipelines, ETL workflows, and big data transformations. Power real-time dashboards and business intelligence reporting for global clients.",
    skills: ["BigQuery & SQL", "Data Pipelines", "ETL Systems", "Analytics Frameworks"],
  },
  {
    icon: GraduationCap,
    title: "Accredited Student Internship Cohorts",
    type: "Internship Programs",
    badge: "Accepting Applications",
    desc: "Structured, milestone-based internships for B.Tech, BCA, MBA, and BBA students. Includes dedicated LMS portal, ISO-graded projects, 6–12 live tasks, CBT validation, AI mock interviews, and verified corporate LORs.",
    skills: ["Dedicated LMS Portal", "ISO-Graded Projects", "6–12 Tasks & CBT", "AI Mock Interviews"],
  },
];

function CareersPage() {
  const [applicationsOpen, setApplicationsOpen] = useState(true);
  const [jobPostings, setJobPostings] = useState<any[]>([]);
  const [ambassadorModalOpen, setAmbassadorModalOpen] = useState(false);

  const fetchApplicationsOpen = useServerFn(getApplicationsOpen);
  const fetchJobPostings = useServerFn(listActiveJobPostings);
  const incrementVisitors = useServerFn(incrementVisitorCount);

  useEffect(() => {
    fetchApplicationsOpen().then((r) => setApplicationsOpen(r?.open ?? true)).catch(() => {});
    fetchJobPostings()
      .then((r: any) => setJobPostings(Array.isArray(r) ? r : (r?.postings ?? [])))
      .catch(() => setJobPostings([]));
    incrementVisitors().catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {(jobPostings || []).map((job) => (
        <script
          type="application/ld+json"
          key={`ld-${job.id}`}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "JobPosting",
              title: job.title,
              description: job.description || job.title,
              datePosted: job.created_at,
              employmentType: job.type === "Full-time" ? "FULL_TIME" : job.type === "Internship" ? "INTERN" : "OTHER",
              hiringOrganization: {
                "@type": "Organization",
                name: "Vyntyra Consultancy Services",
                sameAs: "https://vyntyraconsultancyservices.in",
              },
              jobLocation: {
                "@type": "Place",
                address: {
                  "@type": "PostalAddress",
                  addressLocality: job.location,
                  addressCountry: "IN",
                },
              },
            }),
          }}
        />
      ))}
      <Header live={applicationsOpen} />
      <Hero />
      <WhyJoinUs />
      <AccreditationsRouteMap />
      <CareerJourneyRouteMap />
      <HiringCompaniesMarquee />

      {/* ── Vyntyra Institutional Relations Associate (Campus Ambassador) Spotlight ── */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="relative rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#0a0f24] via-[#0d1633] to-[#080d1e] p-6 sm:p-10 lg:p-12 shadow-2xl overflow-hidden">
          {/* Ambient Lighting */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[130px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-[130px] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-slate-800">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs font-mono font-bold tracking-widest uppercase mb-3">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400"></span>
                  </span>
                  FIRST COHORT 2026-27 · LAUNCHING SOON
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                  Vyntyra Institutional Relations Associate{" "}
                  <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-300 bg-clip-text text-transparent">
                    (Campus Ambassador Program)
                  </span>
                </h2>
                <p className="mt-3 text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl font-light">
                  Lead enterprise tech initiatives, represent Vyntyra at your institution, unlock rewards up to ₹15,000, win branded electronic gadgets, and qualify for an all-expenses-paid curated travel retreat for the Top 10.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <Button
                  onClick={() => setAmbassadorModalOpen(true)}
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-black px-6 py-3 rounded-full text-sm shadow-xl shadow-amber-500/20 hover:scale-105 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Ticket className="h-4 w-4" />
                  <span>Claim Early-Bird Pass (Coming Soon)</span>
                </Button>
                <Button asChild variant="outline" size="sm" className="border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white rounded-full">
                  <Link to="/campus-ambassador">
                    Full Program Details <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Visual Goodies & Gadgets Row with Photography */}
            <div className="mt-6 mb-8">
              <div className="flex items-center justify-between mb-3 text-xs font-mono">
                <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Goodies, Swags & Gadgets Preview
                </span>
                <span className="text-slate-500">Shipped Directly to Associates</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { title: "Welcome Box", sub: "Custom Metal ID", img: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=400&auto=format&fit=crop" },
                  { title: "Embroidered Hoodie", sub: "3D Crest Patch", img: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=400&auto=format&fit=crop" },
                  { title: "Fast Powerbank", sub: "20,000mAh PD", img: "https://images.unsplash.com/photo-1609592426815-397750868a25?q=80&w=400&auto=format&fit=crop" },
                  { title: "ANC Earbuds", sub: "Bluetooth 5.4", img: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=400&auto=format&fit=crop" },
                  { title: "Smartwatch", sub: "AMOLED Touch", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&auto=format&fit=crop" },
                  { title: "Curated Retreat", sub: "Top 10 Travel", img: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=400&auto=format&fit=crop" },
                ].map((item, idx) => (
                  <div key={idx} className="group relative rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden hover:border-amber-400/40 transition-all">
                    <div className="aspect-square w-full overflow-hidden bg-slate-950">
                      <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                    </div>
                    <div className="p-2.5 text-center">
                      <div className="text-xs font-bold text-white truncate">{item.title}</div>
                      <div className="text-[10px] text-amber-300/80 font-mono">{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Perks Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 backdrop-blur hover:border-amber-500/40 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
                  <Gift className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Exclusive IRA Welcome Kit</h4>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Personalized associate ID, custom badge, welcome stationery & corporate swag.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 backdrop-blur hover:border-pink-500/40 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center mb-3">
                  <Award className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Corporate Merchandise</h4>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Performance-based branded hoodies, t-shirts, laptop sleeves, and bottles.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 backdrop-blur hover:border-emerald-500/40 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Earn Up to ₹15,000 Rewards</h4>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Generous milestone incentives (*Performance & Terms and Conditions apply).
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 backdrop-blur hover:border-sky-500/40 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center mb-3">
                  <Zap className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Branded Tech Gadgets</h4>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Powerbanks, Wireless Earbuds, Soundbars, Smartwatches, and HD Webcams.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 backdrop-blur hover:border-purple-500/40 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
                  <Plane className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Curated Travel Experience</h4>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Top 10 win an all-expenses-paid curated corporate retreat with co-associates.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 backdrop-blur hover:border-cyan-500/40 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Dual Certification</h4>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Certificate of Recognition & accredited Corporate Internship Experience letter.
                </p>
              </div>

              <div className="sm:col-span-2 p-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-indigo-500/10 backdrop-blur flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Exclusive VVIP Access Pass</h4>
                    <p className="text-xs text-slate-300">
                      Free unlimited entry to all Vyntyra Workshops, AI Bootcamps, Masterclasses, Sessions, Learning Modules & Courses.
                    </p>
                  </div>
                </div>
                <Link to="/campus-ambassador" className="shrink-0 text-xs font-bold text-amber-300 hover:text-white flex items-center gap-1">
                  Details &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Open Roles & Domain Tracks Directory ── */}
      <section id="roles" className="py-20 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3.5 py-1 text-xs font-mono font-bold text-secondary uppercase tracking-widest mb-3">
              <Sparkles className="h-3 w-3" />
              OPEN ROLES & INTERNSHIP DOMAINS
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">
              Explore Opportunities at Vyntyra
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
              Whether you are an experienced software engineer or a student seeking an accredited internship, find your track and build enterprise solutions with us.
            </p>
          </div>

          <Button asChild size="lg" className="bg-primary hover:bg-secondary text-primary-foreground font-semibold px-6 rounded-full self-start md:self-auto shadow-md">
            <Link to="/apply">
              Go to Application Portal <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DOMAINS_LIST.map((domain, i) => {
            const Icon = domain.icon;
            return (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card p-6 shadow-xs hover:border-secondary/50 hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/5 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-primary-foreground transition-colors shadow-xs">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                      {domain.badge}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {domain.type}
                  </span>
                  <h3 className="font-bold text-base sm:text-lg text-primary tracking-tight mt-1 mb-2.5 group-hover:text-secondary transition-colors">
                    {domain.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {domain.desc}
                  </p>

                  <div className="mt-4 pt-4 border-t border-border/60 flex flex-wrap gap-1.5">
                    {domain.skills.map((s, idx) => (
                      <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded bg-muted/50 text-foreground border border-border/40">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Location: India / Remote</span>
                  <Button asChild size="sm" variant="ghost" className="text-secondary hover:text-secondary hover:bg-secondary/10 font-semibold p-0">
                    <Link to="/apply">
                      Apply Now <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Ready to Apply CTA Section ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-gradient-hero text-primary-foreground p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-2xl border border-blue-900/40">
          <div className="absolute inset-0 corporate-grid opacity-25 pointer-events-none" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[140px] pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-xs font-semibold text-gold uppercase tracking-[0.18em] mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Take the Next Step in Your Career
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
              Ready to engineer the future with Vyntyra Consultancy Services?
            </h2>
            <p className="mt-4 text-sm sm:text-base lg:text-lg text-primary-foreground/85 leading-relaxed font-light">
              Join an environment certified by Great Place to Work®, recognized by NASSCOM FutureSkills Prime, and registered under MSME Govt. of India. Submit your application online in just a few minutes.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button asChild size="lg" className="bg-gold hover:bg-gold/90 text-gold-foreground font-bold px-8 py-4 rounded-full text-base shadow-lg shadow-gold/25 transition-all hover:scale-[1.02]">
                <Link to="/apply">
                  Start Your Application <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-primary-foreground/20 bg-primary-foreground/5 hover:bg-primary-foreground/10 text-primary-foreground font-semibold px-6 py-4 rounded-full text-base backdrop-blur-sm">
                <Link to="/about">
                  Learn About Our Company
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <TrustStrip />

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-6">
        <WorldClocks />
      </div>

      <AmbassadorComingSoonModal
        open={ambassadorModalOpen}
        onOpenChange={setAmbassadorModalOpen}
      />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[580px] sm:min-h-[640px] flex flex-col justify-center overflow-hidden bg-gradient-hero text-primary-foreground py-16 sm:py-24">
      <div className="absolute inset-0 corporate-grid" />
      <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-gold/10 to-transparent hidden lg:block" />
      <div className="absolute top-[20%] right-[10%] w-[450px] h-[450px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 z-10">
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8 lg:gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-sm border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-medium text-gold uppercase tracking-[0.18em]">
              NOW HIRING · FOUNDING TEAM
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight text-white">
              Build the next <br className="hidden sm:inline" />
              generation of{" "}
              <span className="text-gold">
                enterprise technology.
              </span>
            </h1>

            <p className="text-base lg:text-lg text-primary-foreground/75 max-w-2xl leading-relaxed">
              Vyntyra Consultancy Services is assembling an elite engineering team — architecting high-performance cloud platforms, scalable full-stack applications, and enterprise AI systems. Apply securely through our corporate careers portal.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button asChild size="lg" className="bg-gold hover:bg-gold/90 text-gold-foreground font-semibold px-6 py-3 rounded-full text-sm shadow-md transition-all hover:scale-[1.02]">
                <Link to="/apply">
                  Apply Now <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-primary-foreground/20 bg-primary-foreground/5 hover:bg-primary-foreground/10 text-primary-foreground font-medium px-6 py-3 rounded-full text-sm transition-all backdrop-blur-sm">
                <Link to="/about">
                  About Vyntyra
                </Link>
              </Button>
            </div>
          </div>

          {/* Right-side At a Glance Glass Card */}
          <div className="hidden lg:block">
            <div className="rounded-sm border border-primary-foreground/15 bg-primary-foreground/[0.04] backdrop-blur-md p-6 shadow-2xl">
              <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-gold mb-5">
                AT A GLANCE
              </div>

              <dl className="space-y-5">
                <div className="pb-3.5 border-b border-primary-foreground/10">
                  <dt className="text-xs uppercase tracking-wider text-primary-foreground/60 mb-1.5 font-medium">
                    LOCATIONS
                  </dt>
                  <dd className="text-sm font-medium leading-relaxed text-white">
                    India — Visakhapatnam, Bengaluru, Hyderabad, Uttar Pradesh{" "}
                    <span className="text-primary-foreground/60">· Remote</span>
                  </dd>
                </div>
                <div className="flex justify-between items-baseline pb-3.5 border-b border-primary-foreground/10">
                  <dt className="text-xs uppercase tracking-wider text-primary-foreground/60 font-medium">
                    RESPONSE TIME
                  </dt>
                  <dd className="text-3xl font-bold text-white tracking-tight">5–7 days</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-primary-foreground/60 mb-1.5 font-medium">
                    DATA HANDLING
                  </dt>
                  <dd className="text-sm font-medium leading-relaxed text-white">
                    Secured by Cloudflare Technologies
                    <span className="block text-primary-foreground/70 mt-1 text-xs font-normal">
                      ISO-aligned · NASSCOM Verified · Registered under MSME
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyJoinUs() {
  return (
    <section className="py-20 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto border-t border-border bg-background">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">Why Join Vyntyra</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">Accelerating Careers through Real-World Engineering</h2>
          <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
            At Vyntyra Consultancy Services, we build full-stack web architectures, cross-platform mobile apps, and enterprise AI automation systems. Our interns and engineers collaborate with certified mentors, complete verifiable deliverables, and prepare for premier placements.
          </p>
          <ul className="space-y-3.5 pt-2">
            {[
              "Great Place to Work® Certified Culture (2026–27)",
              "NASSCOM FutureSkills Prime & MSME Aligned Framework",
              "1:1 Live AI Mock Interviews & Executive Placement Coaching",
              "Dedicated LMS Portal with 6 to 12 ISO-Graded Tasks"
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-foreground font-medium text-sm">
                <CheckCircle2 className="h-5 w-5 text-secondary shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="relative group">
          <div className="absolute inset-0 bg-secondary/10 rounded-2xl blur-2xl transition-all duration-500" />
          <div className="relative rounded-2xl overflow-hidden bg-card border border-border aspect-[4/3] flex items-center justify-center p-8">
             <div className="absolute inset-0 corporate-grid opacity-50" />
             <div className="relative z-10 w-full h-full border border-border rounded-xl bg-surface flex items-center justify-center shadow-corp overflow-hidden">
                <div className="w-32 h-32 rounded-full border-4 border-t-gold border-r-primary border-b-secondary border-l-transparent animate-spin" style={{ animationDuration: '8s' }} />
                <div className="absolute w-24 h-24 rounded-full border-4 border-b-gold/70 border-l-primary/70 border-t-secondary/70 border-r-transparent animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }} />
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const items: Array<{ icon: typeof Globe2; label: string; value: string }> = [
    { icon: Shield, label: "Confidential Process", value: "Your application is visible only to authorised HR personnel." },
    { icon: Globe2, label: "Global Reach", value: "Serving clients & remote teams across North America, UK, UAE & Singapore." },
    {
      icon: CheckCircle2,
      label: "Compliance & Accreditations",
      value: "Secured by Cloudflare · ISO-aligned · NASSCOM Verified · MSME Registered",
    },
  ];
  return (
    <div className="rounded-md border border-border bg-card max-w-6xl mx-auto my-10">
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
        {items.map((i) => (
          <div key={i.label} className="flex items-start gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3">
            <div className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 rounded-sm bg-secondary/10 flex items-center justify-center">
              <i.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-secondary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.16em] sm:tracking-[0.18em] text-secondary font-semibold">
                {i.label}
              </div>
              <div className="text-[12px] sm:text-sm text-foreground mt-0.5 leading-snug break-words">{i.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
