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
import { AccreditationsRouteMap } from "@/components/accreditations-route-map";
import { CareerJourneyRouteMap } from "@/components/career-journey-route-map";
import { HiringCompaniesMarquee } from "@/components/hiring-companies-marquee";
import { GLOBAL_SEO_META_TAGS } from "@/lib/seo-metadata";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vyntyra Consultancy Services Pvt. Ltd. — Enterprise Technology, AI Engineering & Talent Ecosystem" },
      {
        name: "description",
        content:
          "Vyntyra Consultancy Services Pvt. Ltd. — Great Place to Work Certified 2026-27, NASSCOM FutureSkills Prime Recognised, MSME Registered (UDYAM-AP-09-0051886), Skill Development of India. 4.5★ on AmbitionBox, 4.1★ on Justdial. Enterprise Software, Custom AI Labs, Cloud DevOps, and Verified Industrial Internships.",
      },
      { property: "og:title", content: "About Vyntyra Consultancy Services Pvt. Ltd. — Innovation, AI & Excellence" },
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
  component: HomePage,
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

const SERVICES = [
  {
    icon: Briefcase,
    title: "Enterprise IT Consultancy",
    desc: "Strategic digital transformation, technology stack audits, process automation, and cloud migration roadmaps engineered for enterprise scalability.",
  },
  {
    icon: Code2,
    title: "Custom Software & Web Engineering",
    desc: "High-performance full-stack web applications, PWAs, single-page apps, and scalable microservices built with Next.js, React, Node.js, and TypeScript.",
  },
  {
    icon: Cpu,
    title: "AI & Machine Learning Solutions",
    desc: "Enterprise GenAI implementations, LLM fine-tuning, retrieval-augmented generation (RAG), intelligent workflow agents, and predictive data modeling.",
  },
  {
    icon: Laptop,
    title: "Mobile App Development",
    desc: "Cross-platform iOS and Android mobile solutions built with Flutter and React Native, delivering native performance and intuitive UX.",
  },
  {
    icon: Server,
    title: "Cloud & DevOps Engineering",
    desc: "Architecting zero-downtime CI/CD pipelines, container orchestration with Kubernetes & Docker, and edge computing on Cloudflare and AWS.",
  },
  {
    icon: BookOpen,
    title: "E-Learning & Vyntyra Academy",
    desc: "Industry-aligned masterclasses, hands-on coding labs, corporate upskilling programs, and real-time AI mock interview evaluations.",
  },
  {
    icon: Users,
    title: "Hiring & Talent Acquisition",
    desc: "Campus placement drives, lateral tech hiring, rigorous competency evaluations, and pre-assessed talent pipelines for growing tech firms.",
  },
  {
    icon: Megaphone,
    title: "Branding & Digital Growth",
    desc: "Modern digital brand identity, technical SEO visibility engineered from day one, and high-conversion omnichannel digital marketing.",
  },
  {
    icon: FlaskConical,
    title: "Research & Development",
    desc: "Cutting-edge exploratory engineering, prototyping experimental architectures, and product validation for forward-looking tech ventures.",
  },
];

const INTERNSHIP_DOMAINS = [
  { title: "Full-Stack Web Development", tech: "React, Next.js, Node.js, TypeScript, PostgreSQL", duration: "1 – 6 Months" },
  { title: "AI & Machine Learning", tech: "Python, PyTorch, LangChain, OpenRouter, NLP", duration: "1 – 6 Months" },
  { title: "Mobile App Engineering", tech: "Flutter, React Native, Dart, REST APIs", duration: "1 – 6 Months" },
  { title: "Cloud Computing & DevOps", tech: "AWS, Cloudflare Workers, Docker, CI/CD", duration: "1 – 6 Months" },
  { title: "Cyber Security & Auditing", tech: "Ethical Hacking, OWASP, Network Defense, Compliance", duration: "1 – 6 Months" },
  { title: "Data Science & Analytics", tech: "Pandas, NumPy, PowerBI, BigQuery, SQL", duration: "1 – 6 Months" },
  { title: "UI/UX & Product Design", tech: "Figma, Wireframing, User Research, Design Systems", duration: "1 – 6 Months" },
  { title: "Human Resources & Talent Acquisition", tech: "Technical Screening, HR Analytics, Talent Ops", duration: "1 – 6 Months" },
  { title: "Digital Marketing & Growth", tech: "SEO, Performance Marketing, Analytics, Social Ads", duration: "1 – 6 Months" },
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

function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />

      {/* ── Hero Section (Signature Corporate Navy/Blue Theme) ── */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground py-16 sm:py-24 lg:py-28">
        <div className="absolute inset-0 corporate-grid" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gold/15 blur-[120px] pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-[11px] font-semibold text-gold uppercase tracking-[0.18em] shadow-sm backdrop-blur-md mb-4">
            <Sparkles className="h-3 w-3 text-gold" />
            Vyntyra Consultancy Services Pvt. Ltd.
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.12] tracking-tight max-w-4xl text-white">
            Enterprise Technology, AI Solutions &amp;{" "}
            <span className="text-gold">
              Next-Gen Talent Development.
            </span>
          </h1>

          <p className="mt-6 text-sm sm:text-base lg:text-lg text-primary-foreground/85 max-w-3xl leading-relaxed">
            Vyntyra Consultancy Services Pvt. Ltd. is a premier Indian technology consultancy and talent enablement firm headquartered in Visakhapatnam. We deliver custom web &amp; mobile architectures, enterprise AI integrations, and industry-accredited student internship programs. Certified by Great Place to Work® and recognized by NASSCOM FutureSkills Prime and MSME Govt. of India.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="/careers"
              className="inline-flex items-center gap-2 bg-gold hover:bg-gold/90 text-gold-foreground px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-gold/25 transition-all hover:scale-[1.02]"
            >
              Explore Careers &amp; Internships <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/about"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 rounded-xl text-sm font-semibold transition-all backdrop-blur-sm"
            >
              About Our Company <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="https://vyntyraconsultancyservices.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border border-primary-foreground/30 hover:bg-primary-foreground/10 text-primary-foreground px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              Corporate Portal <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href="/verify"
              className="inline-flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 px-5 py-3 rounded-xl text-sm font-semibold transition-colors backdrop-blur-sm"
            >
              <Shield className="h-4 w-4 text-emerald-400" /> Verify Credentials
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
              Corporate Mission &amp; Heritage
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary tracking-tight">
              Engineering with Integrity. Delivering at Scale.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Founded on the belief that software excellence and talent acceleration should go hand-in-hand, Vyntyra Consultancy Services Pvt. Ltd. connects enterprise technology demands with elite engineering talent.
            </p>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              From developing mission-critical platforms for businesses across India, North America, UAE, and Singapore to pioneering the 1:1 Live AI Mock Interview suite for student developers, we stand as an innovation-driven force recognized by statutory bodies and top rating platforms.
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
              Statutory Details &amp; Headquarters
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
                  Direct Line &amp; Corporate Email
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
                  Compliance, Registrations &amp; Audit
                </dt>
                <dd className="font-mono text-xs text-primary bg-surface p-2.5 rounded-lg border border-border">
                  MSME UDYAM-AP-09-0051886 · Great Place to Work® 2026-27 · NASSCOM Verified
                </dd>
              </div>
            </dl>
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

        {/* ── Core Services ── */}
        <section>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
              Services Portfolio
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary tracking-tight mt-1">
              Full-Spectrum Technology Delivery
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-card p-6 hover:border-secondary/60 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="h-11 w-11 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-4 group-hover:bg-secondary group-hover:text-primary-foreground transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-base text-primary tracking-tight">{title}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Internship & Talent Ecosystem ── */}
        <section className="rounded-3xl border border-border bg-gradient-to-br from-surface via-card to-surface p-6 sm:p-10 lg:p-12 shadow-sm">
          <div className="max-w-3xl mb-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
              Vyntyra Academy &amp; Internships
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary tracking-tight mt-1">
              Industrial Internships &amp; Placement Readiness
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Our internship curriculum bridges academia and corporate delivery. Interns collaborate on production systems, complete rigorous milestone deliverables, and hone their interview skills with our 1:1 Live AI Mock Interview system.
            </p>
          </div>

          {/* Domains Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-8">
            {INTERNSHIP_DOMAINS.map((dom) => (
              <div
                key={dom.title}
                className="p-4 rounded-xl border border-border bg-background hover:border-primary/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-primary">{dom.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-1 font-mono">{dom.tech}</div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] text-secondary font-semibold pt-2 border-t border-border/60">
                  <span>{dom.duration}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">Certificate + LOR</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border">
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-primary">Ready to begin your corporate journey?</div>
              <div className="text-xs text-muted-foreground">Apply for open internships or verify existing credentials online.</div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href="/careers"
                className="bg-primary hover:bg-secondary text-primary-foreground text-xs font-bold px-5 py-2.5 rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                Apply for Internship <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <a
                href="/verify"
                className="bg-surface hover:bg-card text-primary border border-border text-xs font-bold px-4 py-2.5 rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                <Shield className="h-3.5 w-3.5 text-secondary" /> Verify Credential
              </a>
            </div>
          </div>
        </section>

        {/* ── 8-Step Career Accelerator Journey Route Map ── */}
        <CareerJourneyRouteMap />

        {/* ── Trusted by 500+ Hiring Companies Infinite Marquee ── */}
        <HiringCompaniesMarquee />

        {/* ── Leadership Team ── */}
        <section>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
              Executive Leadership
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

        {/* ── Enterprise Trust Bar ── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
          {[
            {
              icon: Shield,
              title: "Enterprise Grade Security",
              desc: "TLS 1.3 end-to-end encryption, regular code audits, and strict data privacy compliance protect every project.",
            },
            {
              icon: Award,
              title: "Proven Delivery Track Record",
              desc: "Trusted by educational institutions and enterprises alike for critical platform engineering and digital delivery.",
            },
            {
              icon: GraduationCap,
              title: "Career & Placement Acceleration",
              desc: "Structured mentorship, AI-evaluated live interviews, verified LORs, and direct paths to full-time engineering roles.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5 text-secondary" />
                </div>
                <div className="font-bold text-sm text-primary">{title}</div>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </section>
      </main>
</div>
  );
}
