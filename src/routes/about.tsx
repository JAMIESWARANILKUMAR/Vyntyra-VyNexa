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
  Search,
  FileText,
  FlaskConical,
} from "lucide-react";
import { WorldClocks } from "@/components/world-clocks";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Vyntyra Consultancy Services — Innovation, Talent & Technology" },
      {
        name: "description",
        content:
          "Vyntyra Consultancy Services is an innovation-driven firm providing IT consultancy, hiring & recruitment, branding, e-learning, marketing and R&D. Learn about our mission, services, leadership team and headquarters in Visakhapatnam, India.",
      },
      { property: "og:title", content: "About Vyntyra Consultancy Services" },
      {
        property: "og:description",
        content:
          "Innovation-driven IT consultancy, hiring, branding, e-learning, marketing and R&D. Headquartered in Visakhapatnam, India.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

const SERVICES = [
  { icon: Briefcase, title: "IT Consultancy", desc: "Digital transformation, technology assessment, process automation and cloud & infrastructure consulting for growing businesses." },
  { icon: Code2, title: "Software Solutions", desc: "Custom enterprise applications, automation tools, and ongoing maintenance & support engineered for scale." },
  { icon: Globe2, title: "Web Development", desc: "Modern, responsive corporate websites, portfolios, e-commerce and UI/UX design work." },
  { icon: Users, title: "Hiring & Recruitment", desc: "Campus and lateral hiring, talent assessment and HR consulting — connecting talent with real opportunity." },
  { icon: Megaphone, title: "Branding & Marketing", desc: "Brand identity, digital & social media marketing and content creation that elevates presence." },
  { icon: BookOpen, title: "E-Learning & Training", desc: "Online courses, workshops, corporate training and structured skill-development programs." },
  { icon: FileText, title: "Resume Building", desc: "Professional resume writing, LinkedIn profile optimization and interview preparation." },
  { icon: FlaskConical, title: "Research & Development", desc: "Market and industry research, product and process innovation, and data analytics." },
];

const WHY = [
  { title: "Uncompromised SEO", desc: "Search visibility engineered from day one — no shortcuts, no compromises." },
  { title: "Value for Investment", desc: "Every rupee accounted for. We deliver maximum worth for your budget." },
  { title: "Secure Deployments", desc: "One year of free deployments with Advanced BOT Protection." },
  { title: "Daily Maintenance", desc: "Day-to-day verification and bug fixing for flawless operation." },
];

const LEADERSHIP = [
  { name: "Jami Eswar Anil Kumar", role: "Founder & Director", note: "India Mentor · Udemy Instructor · Lead Educator" },
  { name: "Anu Sri Metta", role: "Co-Founder", note: "R&D Manager · Director of Administration" },
  { name: "Harshitha Patnana", role: "Co-Founder", note: "Relations Manager · Administration Associate" },
  { name: "Niveditha M", role: "Co-Founder", note: "Web Developer · Vyntyra Academy Curriculum Associate" },
  { name: "Abhishek Pandey", role: "Co-Founder", note: "Backend Developer · Technical Trainee" },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Utility bar */}
      <div className="border-b border-border bg-primary text-primary-foreground/80 text-xs">
        <div className="mx-auto max-w-6xl px-6 h-9 flex items-center justify-between">
          <div className="hidden sm:flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5"><Globe2 className="h-3 w-3" /> IN · Global Delivery</span>
            <span className="opacity-40">|</span>
            <span className="inline-flex items-center gap-1.5"><Mail className="h-3 w-3" /> hr@vyntyraconsultancyservices.in</span>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <a href="/" className="hover:text-gold">Careers</a>
            <span className="opacity-40">|</span>
            <a href="/status" className="hover:text-gold">Track Application</a>
            <span className="opacity-40">|</span>
            <a href="/auth" className="hover:text-gold">Employee Portal</a>
          </div>
        </div>
      </div>

      {/* Top bar */}
      <header className="border-b border-border bg-card sticky top-0 z-40 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src="/favicon.png" alt="Vyntyra Consultancy Services" className="h-11 w-auto" />
          </a>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <a href="/about" className="px-3 py-2 text-primary font-medium rounded-sm bg-surface">About</a>
            <a href="/" className="px-3 py-2 text-muted-foreground hover:text-primary hover:bg-surface rounded-sm">Careers</a>
            <a href="/status" className="px-3 py-2 text-muted-foreground hover:text-primary hover:bg-surface rounded-sm">Track Status</a>
            <div className="w-px h-5 bg-border mx-2" />
            <a href="/" className="inline-flex items-center gap-1.5 bg-primary hover:bg-secondary text-primary-foreground px-4 py-2 rounded-sm text-sm font-medium transition-colors">
              Apply Now <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="absolute inset-0 corporate-grid" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <div className="inline-flex items-center gap-2 rounded-sm border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-medium text-gold uppercase tracking-[0.18em]">
            <Sparkles className="h-3 w-3" /> About the Company
          </div>
          <h1 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.05] tracking-tight max-w-4xl">
            Innovation-driven consultancy for the <span className="text-gold">next digital era.</span>
          </h1>
          <p className="mt-6 text-base lg:text-lg text-primary-foreground/75 max-w-3xl leading-relaxed">
            Vyntyra Consultancy Services connects talent with opportunity and elevates brand identities with strategic creativity.
            We deliver tailored IT consultancy, hiring & recruitment, branding, e-learning, marketing and research — building
            solutions that make a meaningful impact for clients across India and beyond.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/" className="inline-flex items-center gap-2 bg-gold hover:bg-gold/90 text-gold-foreground px-6 py-3 rounded-sm text-sm font-semibold transition-colors">
              Explore Careers <ArrowRight className="h-4 w-4" />
            </a>
            <a href="https://vyntyraconsultancyservices.in" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 border border-primary-foreground/30 hover:bg-primary-foreground/10 text-primary-foreground px-6 py-3 rounded-sm text-sm font-medium transition-colors">
              Visit Main Website
            </a>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-16 space-y-16">
        {/* Clocks */}
        <WorldClocks />

        {/* Mission */}
        <section className="grid lg:grid-cols-[1.2fr_1fr] gap-10">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-secondary mb-3">Our Mission</div>
            <h2 className="text-3xl font-semibold text-primary tracking-tight">Real results for real clients.</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              We are a passionate team of educators, developers and designers dedicated to transforming how businesses adopt
              technology and how individuals grow their careers. From startups launching their first MVP to enterprises
              modernizing legacy systems, we craft solutions that are secure, scalable and thoughtful.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Our work spans consultancy, custom software, digital marketing, e-learning and structured internship programs —
              each anchored in the same commitment: measurable impact, transparent delivery and long-term partnership.
            </p>
          </div>
          <div className="rounded-sm border border-border bg-card p-6">
            <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-secondary mb-4">Company Snapshot</div>
            <dl className="space-y-4 text-sm">
              <div className="pb-3 border-b border-border">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Headquarters</dt>
                <dd className="font-medium text-primary flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-secondary" />
                  Unit 601, 5th Floor, Grand Palace, Plot 238 & 239, Dwaraka Nagar, Visakhapatnam, Andhra Pradesh 530016
                </dd>
              </div>
              <div className="pb-3 border-b border-border">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Working Hours</dt>
                <dd className="font-medium text-primary">Mon – Fri · 9 AM – 11 PM · Sat · 10 AM – 2 PM</dd>
              </div>
              <div className="pb-3 border-b border-border">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Contact</dt>
                <dd className="font-medium text-primary flex flex-col gap-1">
                  <span className="inline-flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-secondary" /> +91 93905 15106</span>
                  <span className="inline-flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-secondary" /> +91 63015 88867</span>
                  <span className="inline-flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-secondary" /> info@vyntyraconsultancyservices.in</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Compliance</dt>
                <dd className="font-medium text-primary">ISO-aligned · NASSCOM Verified · MSME Registered</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Why choose us */}
        <section>
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-secondary mb-3">Why Choose Us</div>
          <h2 className="text-3xl font-semibold text-primary tracking-tight mb-8">Excellence through our core commitments.</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {WHY.map((w) => (
              <div key={w.title} className="rounded-sm border border-border bg-card p-5">
                <div className="h-9 w-9 rounded-sm bg-primary/5 text-primary flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="font-semibold text-primary">{w.title}</div>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Services */}
        <section>
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-secondary mb-3">What We Do</div>
          <h2 className="text-3xl font-semibold text-primary tracking-tight mb-8">Services across the digital lifecycle.</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-sm border border-border bg-card p-6 hover:border-secondary/50 transition-colors">
                <div className="h-10 w-10 rounded-sm bg-secondary/10 text-secondary flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="font-semibold text-primary">{title}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Internship / VyNexa */}
        <section className="rounded-sm border border-border bg-surface p-8 lg:p-10">
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10 items-start">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-secondary mb-3">Talent & Internships</div>
              <h2 className="text-3xl font-semibold text-primary tracking-tight">Gain invaluable experience with Vyntyra.</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Our internships go beyond the ordinary — real-world projects, hands-on learning, global collaboration and
                measurable impact. Interns work alongside our founding team on live client engagements and internal R&D
                including <span className="font-medium text-primary">Project VyNexa</span>, our next-generation search engine.
              </p>
              <ul className="mt-5 grid sm:grid-cols-2 gap-2.5 text-sm">
                {[
                  "Real-world client projects",
                  "Personalized career guidance",
                  "Letter of Recommendation (LOR)",
                  "Official internship certificate",
                  "Resume & LinkedIn optimization",
                  "Pathway to full-time offers",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2 text-primary">
                    <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <a href="/" className="inline-flex items-center gap-2 bg-primary hover:bg-secondary text-primary-foreground px-5 py-2.5 rounded-sm text-sm font-medium transition-colors">
                  Apply for VyNexa <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
            <div className="rounded-sm border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Search className="h-5 w-5 text-secondary" />
                <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-secondary">Project VyNexa</div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A private, intelligent search engine being built in-house at Vyntyra — designed for how people actually find
                things today. We are hiring a founding team across engineering, ML, design and growth.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-sm border border-border p-3">
                  <div className="text-xs text-muted-foreground">Response</div>
                  <div className="text-lg font-semibold text-primary">5–7 days</div>
                </div>
                <div className="rounded-sm border border-border p-3">
                  <div className="text-xs text-muted-foreground">Mode</div>
                  <div className="text-lg font-semibold text-primary">Hybrid</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Leadership */}
        <section>
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-secondary mb-3">Leadership</div>
          <h2 className="text-3xl font-semibold text-primary tracking-tight mb-8">The minds behind Vyntyra.</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {LEADERSHIP.map((p) => (
              <div key={p.name} className="rounded-sm border border-border bg-card p-6">
                <div className="h-11 w-11 rounded-full bg-primary/5 text-primary flex items-center justify-center font-semibold">
                  {p.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="mt-4 font-semibold text-primary">{p.name}</div>
                <div className="text-sm text-secondary">{p.role}</div>
                <div className="mt-1 text-xs text-muted-foreground">{p.note}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Trust */}
        <section className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Shield, title: "Enterprise Security", desc: "Encryption, secure coding practices and regular audits protect every engagement." },
            { icon: Award, title: "Proven Delivery", desc: "Trusted by clients such as AITAM and Ignite Wheels for critical platform work." },
            { icon: GraduationCap, title: "Talent Focused", desc: "Structured mentorship, LOR-backed internships and transparent hiring." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-sm border border-border bg-card p-6">
              <div className="h-10 w-10 rounded-sm bg-primary/5 text-primary flex items-center justify-center mb-3">
                <Icon className="h-5 w-5" />
              </div>
              <div className="font-semibold text-primary">{title}</div>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-primary text-primary-foreground/80 mt-12">
        <div className="mx-auto max-w-6xl px-6 py-10 grid md:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img src="/favicon.png" alt="Vyntyra" className="h-10 w-auto brightness-0 invert" />
            </div>
            <p className="text-primary-foreground/60 leading-relaxed">
              Innovation-driven IT consultancy, hiring, branding and R&D. Headquartered in Visakhapatnam, India.
            </p>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-gold mb-3">Company</div>
            <ul className="space-y-1.5">
              <li><a href="/about" className="hover:text-gold">About</a></li>
              <li><a href="/" className="hover:text-gold">Careers</a></li>
              <li><a href="/status" className="hover:text-gold">Track Application</a></li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-gold mb-3">Contact</div>
            <ul className="space-y-1.5 text-primary-foreground/70">
              <li className="inline-flex items-center gap-2"><Building2 className="h-3.5 w-3.5" /> Dwaraka Nagar, Visakhapatnam</li>
              <li className="inline-flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> +91 93905 15106</li>
              <li className="inline-flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> info@vyntyraconsultancyservices.in</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-primary-foreground/10">
          <div className="mx-auto max-w-6xl px-6 py-4 text-xs text-primary-foreground/50 flex justify-between">
            <span>© {new Date().getFullYear()} Vyntyra Consultancy Services</span>
            <span>All rights reserved</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
