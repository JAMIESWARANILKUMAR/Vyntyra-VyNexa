import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe2,
  Mail,
  MapPin,
  Phone,
  Shield,
  Sparkles,
  Users,
  Award,
  Briefcase,
  GraduationCap,
  Code2,
  Megaphone,
  BookOpen,
  FileText,
  FlaskConical,
  Star,
  ExternalLink,
  Laptop,
  Check,
  TrendingUp,
  Cpu,
  Layers,
  Server,
  Zap,
  Target,
  Compass,
  Milestone,
  Lock,
  Headphones,
  FileCheck2,
  Flag,
} from "lucide-react";
import { WorldClocks } from "@/components/world-clocks";
import { Header } from "@/components/Header";
import { Footer } from "@/components/footer";
import { AccreditationsRouteMap } from "@/components/accreditations-route-map";
import { HiringCompaniesMarquee } from "@/components/hiring-companies-marquee";
import { GLOBAL_SEO_META_TAGS } from "@/lib/seo-metadata";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Vyntyra Consultancy Services Pvt. Ltd. | Accreditations, Leadership & Innovation" },
      {
        name: "description",
        content:
          "About Vyntyra Consultancy Services Pvt. Ltd. — Great Place to Work Certified 2026-27, NASSCOM FutureSkills Prime Recognised, MSME Registered (UDYAM-AP-09-0051886), Skill Development of India. 4.5★ on AmbitionBox, 4.1★ on Justdial. Learn about our 4 core divisions, leadership, vision, and corporate milestones.",
      },
      { property: "og:title", content: "About Us — Vyntyra Consultancy Services Pvt. Ltd." },
      {
        property: "og:description",
        content:
          "Great Place to Work Certified 2026-27, NASSCOM FutureSkills Prime Recognised, MSME Registered. Enterprise Web, Mobile, AI & Microservices.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      ...GLOBAL_SEO_META_TAGS,
    ],
  }),
  component: AboutPage,
});

const DIVISIONS = [
  {
    icon: Code2,
    badge: "Enterprise Engineering",
    title: "VCS Enterprise Platforms & Cloud Architecture",
    desc: "Architecting high-concurrency web applications, cross-platform mobile apps (Flutter / React Native), and distributed microservices with zero-downtime CI/CD and Cloudflare edge computing.",
    tags: ["React / Next.js", "Flutter", "Node.js", "Docker / K8s", "Cloudflare Workers"],
  },
  {
    icon: Cpu,
    badge: "Artificial Intelligence",
    title: "VCS AI & Autonomous Systems Labs",
    desc: "Production GenAI integrations, reasoning LLMs via OpenRouter, automated evaluation pipelines, multimodal speech & vision models, and retrieval-augmented generation (RAG) architectures.",
    tags: ["LangChain", "OpenRouter", "Computer Vision", "Realtime WebRTC", "Predictive Analytics"],
  },
  {
    icon: BookOpen,
    badge: "Education & Academy",
    title: "Vyntyra Academy & Industrial Internships",
    desc: "Empowering university graduates and career switchers with live industrial projects, 1:1 Live AI Mock Interviews, verified cryptographically-signed credentials, and direct placement assistance.",
    tags: ["9 Tech Domains", "Live AI Mock Interviews", "Verified Credentials", "500+ Hiring Network"],
  },
  {
    icon: Briefcase,
    badge: "Consultancy & Advisory",
    title: "VCS Strategic Advisory & Fractional CTO",
    desc: "Guiding enterprise digital transformation, security posture hardening, technical due diligence, stack modernization, and executive technology leadership for fast-growing ventures.",
    tags: ["Tech Architecture Audits", "CTO Advisory", "SLA Optimization", "Cloud Cost Governance"],
  },
];

const UNIQUE_ADVANTAGES = [
  {
    icon: Headphones,
    title: "1:1 Live AI Mock Interview Studio",
    desc: "Our proprietary WebRTC interview suite connects candidates with dynamic AI interlocutors, scoring real-time speech fluency, facial attention stability, and live coding performance.",
  },
  {
    icon: FileCheck2,
    title: "Cryptographically Verified Credentials",
    desc: "Every NOC, Offer Letter, and Certificate of Completion issued by Vyntyra features a unique cryptographic verification hash verifiable 24/7 on our public portal (/verify).",
  },
  {
    icon: Shield,
    title: "Enterprise Edge Security & Bot Protection",
    desc: "Every enterprise client platform is backed by Cloudflare Enterprise, TLS 1.3 encryption, automatic DDoS defense, and 1 year of complimentary deployment care.",
  },
  {
    icon: Award,
    title: "Great Place to Work® Certified (2026–27)",
    desc: "Recognized as a certified high-trust workplace with an outstanding 4.5★ AmbitionBox and 4.1★ Justdial rating from employees, mentees, and business clients alike.",
  },
  {
    icon: Flag,
    title: "National Statutory & Skill Accreditations",
    desc: "Central Government MSME Registered (UDYAM-AP-09-0051886), NASSCOM FutureSkills Prime Recognised Partner, and officially aligned with the Skill India Mission.",
  },
  {
    icon: Globe2,
    title: "Global Delivery & Strategic Scalability",
    desc: "Headquartered in Visakhapatnam with delivery centers across Bengaluru, Hyderabad, and Uttar Pradesh, serving premier clients across India, US, UK, UAE, and Singapore.",
  },
];

const CORE_VALUES = [
  {
    icon: Shield,
    title: "Uncompromising Integrity",
    desc: "Every commitment to our clients, partners, and interns is upheld with absolute transparent accountability, ethical billing, and cryptographic verification.",
  },
  {
    icon: Zap,
    title: "Radical Innovation",
    desc: "We stay on the cutting edge of AI, cloud architecture, and edge computing, ensuring our client solutions and student training reflect true state-of-the-art industry standards.",
  },
  {
    icon: Users,
    title: "Meritocratic Inclusivity",
    desc: "Talent is everywhere. We democratize access to elite industrial internships, high-impact mentorship, and global enterprise career trajectories regardless of background.",
  },
  {
    icon: Target,
    title: "Relentless Execution",
    desc: "From zero-downtime microservices to flawless day-to-day client platform maintenance, our team executes with disciplined engineering precision.",
  },
];

const MILESTONES = [
  {
    year: "September 2024",
    title: "Statutory Incorporation & MSME Accreditation",
    desc: "Vyntyra Consultancy Services Pvt. Ltd. was incorporated (ROC Vijayawada) and registered under Ministry of MSME (UDYAM-AP-09-0051886), establishing our core delivery center in Visakhapatnam.",
  },
  {
    year: "2025",
    title: "Vyntyra Academy Launch & National Alliances",
    desc: "Established Vyntyra Academy, launched accredited student internships across 9 domains, achieved NASSCOM FutureSkills Prime partnership, and trained over 500+ successful engineers.",
  },
  {
    year: "2026 – 2027",
    title: "Great Place to Work® Certification & AI Studio Rollout",
    desc: "Certified by Great Place to Work® Institute. Launched our proprietary 1:1 Live AI Mock Interview Studio and expanded enterprise consultancy across international markets.",
  },
];

const LEADERSHIP = [
  {
    name: "Jami Eswar Anil Kumar",
    role: "Founder & Managing Director",
    note: "India Mentor · Udemy Instructor · Lead Enterprise Architect & Technology Educator",
  },
  {
    name: "Niveditha M",
    role: "Co-Founder",
    note: "Web Developer · Vyntyra Academy Curriculum Associate & Technical Lead",
  },
  {
    name: "Kashish Khilani",
    role: "Senior Advisor",
    note: "Strategic Advisor · Executive Advisory Board & Growth Operations",
  },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-white border-b border-slate-100 text-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(37,99,235,0.08),rgba(255,255,255,0))]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-[11px] font-bold text-blue-700 uppercase tracking-widest mb-4 shadow-2xs">
            <Sparkles className="h-3 w-3 text-blue-600" />
            About Vyntyra Consultancy Services Pvt. Ltd.
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.12] tracking-tight max-w-4xl text-slate-900">
            Pioneering Enterprise Software, AI Engineering &amp;{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">
              Frontier Talent Ecosystems.
            </span>
          </h1>

          <p className="mt-6 text-sm sm:text-base lg:text-lg text-slate-600 max-w-3xl leading-relaxed">
            Headquartered in Visakhapatnam, Andhra Pradesh, Vyntyra Consultancy Services Pvt. Ltd. is an accredited technology consulting firm and digital talent incubator. We partner with fast-growing ventures and large-scale enterprises across India, North America, the UK, UAE, and Singapore to architect resilient software platforms while empowering the next generation of engineers through rigorous industrial mentorship.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="/careers"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02]"
            >
              Explore Careers &amp; Internships <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="https://vyntyraconsultancyservices.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              Visit Corporate Portal <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href="/verify"
              className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 px-5 py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              <Shield className="h-4 w-4 text-emerald-600" /> Verify Credentials
            </a>
          </div>
        </div>
      </section>

      {/* ── Corporate Accreditations Route Map ── */}
      <AccreditationsRouteMap />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-20">
        {/* Clocks Component */}
        <WorldClocks />

        {/* ── Corporate Mission & Snapshot ── */}
        <section className="grid lg:grid-cols-[1.3fr_1fr] gap-8 lg:gap-12 items-start">
          <div className="space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
              Corporate Heritage &amp; Vision
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary tracking-tight">
              Engineering with Purpose. Empowering with Integrity.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Vyntyra Consultancy Services Pvt. Ltd. was established to solve a critical industry challenge: the widening gap between traditional academic curricula and modern production-grade enterprise software demands.
            </p>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Today, our teams engineer distributed cloud systems, modern web and mobile applications, and intelligent AI reasoning models for clients globally, while our educational division, Vyntyra Academy, trains ambitious developers through real client codebases, 1:1 Live AI Mock Interviews, and cryptographic credential verification.
            </p>

            <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <div className="text-2xl font-black text-primary">500+</div>
                <div className="text-xs text-muted-foreground mt-0.5">Engineers Trained</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <div className="text-2xl font-black text-primary">99.8%</div>
                <div className="text-xs text-muted-foreground mt-0.5">Uptime SLA</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <div className="text-2xl font-black text-primary">4.5★</div>
                <div className="text-xs text-muted-foreground mt-0.5">AmbitionBox Rating</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <div className="text-2xl font-black text-primary">4.1★</div>
                <div className="text-xs text-muted-foreground mt-0.5">Justdial Verified</div>
              </div>
            </div>
          </div>

          {/* Corporate Snapshot Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary pb-2 border-b border-border">
              Statutory Details &amp; Corporate Identity
            </div>
            <dl className="space-y-4 text-xs sm:text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                  Registered Corporate Headquarters
                </dt>
                <dd className="font-medium text-primary flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-secondary shrink-0" />
                  <span>
                    Unit 601, 5th Floor, Grand Palace, Plot 238 &amp; 239, Dwaraka Nagar, Visakhapatnam, Andhra Pradesh – 530016, India
                  </span>
                </dd>
              </div>

              <div className="pt-3 border-t border-border">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                  Operating Hours &amp; Delivery Shifts
                </dt>
                <dd className="font-medium text-primary">
                  Mon – Fri: 9:00 AM – 11:00 PM · Sat: 10:00 AM – 2:00 PM IST
                </dd>
              </div>

              <div className="pt-3 border-t border-border">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                  Direct Line &amp; Corporate Inquiries
                </dt>
                <dd className="font-medium text-primary space-y-1">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-secondary shrink-0" /> +91 93905 15106 / +91 63015 88867
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-secondary shrink-0" /> contact@vyntyraconsultancyservices.in
                  </div>
                </dd>
              </div>

              <div className="pt-3 border-t border-border">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                  Statutory Registrations &amp; Certifications
                </dt>
                <dd className="font-mono text-xs text-primary bg-surface p-2.5 rounded-lg border border-border">
                  MSME UDYAM-AP-09-0051886 · Great Place to Work® 2026-27 · NASSCOM FutureSkills Prime
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* ── Core Values ── */}
        <section>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
              Our Foundation
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary tracking-tight mt-1">
              Guiding Principles &amp; Core Values
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Every system we engineer and every intern we mentor is guided by a disciplined set of values.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CORE_VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between">
                <div>
                  <div className="h-10 w-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-base text-primary tracking-tight">{title}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Four Specialized Operating Divisions ── */}
        <section>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
              Organizational Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary tracking-tight mt-1">
              Four Core Operating Divisions
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Structured to deliver specialized excellence across enterprise platforms, applied AI labs, industrial internships, and executive consulting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DIVISIONS.map((div) => (
              <div
                key={div.title}
                className="rounded-2xl border border-border bg-card p-6 hover:border-secondary/60 hover:shadow-lg transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="h-11 w-11 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-primary-foreground transition-colors">
                      <div.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-surface border border-border text-primary">
                      {div.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-primary tracking-tight">{div.title}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">{div.desc}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-border flex flex-wrap gap-1.5">
                  {div.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-medium px-2 py-0.5 rounded bg-surface border border-border/70 text-slate-600 dark:text-slate-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── What Makes Vyntyra Unique ── */}
        <section className="rounded-3xl border border-border bg-gradient-to-br from-surface via-card to-surface p-6 sm:p-10 lg:p-12 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
              Distinctive Value Proposition
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary tracking-tight mt-1">
              What Makes Vyntyra Unique
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Combining world-class engineering discipline with an empowering, certified learning environment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {UNIQUE_ADVANTAGES.map((adv) => (
              <div
                key={adv.title}
                className="rounded-2xl border border-border bg-background p-6 hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="h-10 w-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-4">
                    <adv.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-base text-primary tracking-tight">{adv.title}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">{adv.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Corporate Milestones Trajectory ── */}
        <section>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
              Evolution &amp; Milestones
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight mt-1">
              Our Journey of Continuous Innovation
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {MILESTONES.map((m) => (
              <div key={m.year} className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono font-bold text-secondary uppercase tracking-widest mb-1.5">
                    {m.year}
                  </div>
                  <h3 className="font-bold text-base text-primary tracking-tight">{m.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Trusted by 500+ Hiring Companies Infinite Marquee ── */}
        <HiringCompaniesMarquee />

        {/* ── Leadership Team ── */}
        <section>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
              Executive Leadership &amp; Advisory Board
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight mt-1">
              The Minds Driving Vyntyra
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {LEADERSHIP.map((p) => (
              <div key={p.name} className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                <div className="h-12 w-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-black text-sm">
                  {p.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="mt-4 font-bold text-base text-primary">{p.name}</div>
                <div className="text-xs text-secondary font-semibold mt-0.5">{p.role}</div>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{p.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Direct Contact / Partnership CTA ── */}
        <section className="rounded-3xl border border-border bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white p-8 sm:p-12 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 inline-block">
              Connect With Vyntyra
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Ready to Accelerate Your Enterprise Platform or Tech Career?
            </h2>
            <p className="text-sm sm:text-base text-white/80 max-w-2xl mx-auto leading-relaxed">
              Whether you are an enterprise seeking custom AI and cloud microservices, an educational institution looking for certified training partnerships, or a candidate aspiring to build a real-world career, we are ready to collaborate.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/careers"
                className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg hover:scale-105"
              >
                Apply for Openings &amp; Internships
              </a>
              <a
                href="mailto:contact@vyntyraconsultancyservices.in"
                className="bg-white/15 hover:bg-white/20 text-white border border-white/30 font-semibold px-6 py-3 rounded-xl text-sm transition-all"
              >
                Contact Corporate Office
              </a>
              <a
                href="/verify"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold px-5 py-3 rounded-xl text-sm transition-all flex items-center gap-1.5"
              >
                <Shield className="h-4 w-4" /> Verify Intern Credentials
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
