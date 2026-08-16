import { createFileRoute } from "@tanstack/react-router";
import { Shield, ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions — Vyntyra Careers" },
      { name: "description", content: "Terms of use for the Vyntyra Careers applicant portal and Project VyNexa application form." },
      { property: "og:title", content: "Terms and Conditions — Vyntyra Careers" },
      { property: "og:description", content: "Terms and Conditions aligned with DPDPA 2023." },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Header />

      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Careers
          </Link>
          <div className="text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold mb-2">Legal · User Rules</div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-primary tracking-tight">Terms and Conditions</h1>
          <p className="text-sm text-muted-foreground mt-3">
            Last Updated: August 17, 2026 · Vyntyra Consultancy Services
          </p>
        </div>

        <div className="rounded-md border border-border bg-card shadow-corp p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-foreground">
          
          <Section title="1. Acceptance of Terms">
            By accessing or using the website of Vyntyra Consultancy Services ("Company", "we", "us"), applying for internships, or accessing instructional materials, you agree to be bound by these Terms and Conditions and our Privacy Policy.
          </Section>

          <Section title="2. Eligibility">
            You must be currently enrolled in an accredited educational institution or be a recent graduate eligible for practical skill development. If you are under 18 years of age, your parent or legal guardian must review and agree to these Terms on your behalf.
          </Section>

          <Section title="3. Duties of Users (Section 15, DPDPA 2023)">
            As a user and applicant on our platform, you agree to:
            <ul className="list-disc pl-5 mt-2 space-y-1 text-foreground/80">
              <li>Furnish authentic, truthful, and verifiable academic records and identity proofs.</li>
              <li>Not impersonate any person or entity or suppress material information.</li>
              <li>Refrain from lodging false, frivolous, or malicious complaints.</li>
              <li>Keep login credentials and platform access confidential.</li>
            </ul>
          </Section>

          <Section title="4. Intellectual Property Rights">
            All website content, branding, UI designs, code snippets, course modules, assignments, and proprietary tools remain the exclusive intellectual property of Vyntyra Consultancy Services.
            <br /><br />
            You are granted a revocable, non-exclusive, non-transferable license to access materials solely for your learning and internship evaluation. Unauthorized distribution, reverse engineering, scraping, or commercial exploitation of our platform is strictly prohibited.
          </Section>

          <Section title="5. Prohibited Conduct">
            Users shall not:
            <ul className="list-disc pl-5 mt-2 space-y-1 text-foreground/80">
              <li>Transmit viruses, worms, Trojan horses, or harmful code.</li>
              <li>Attempt unauthorized access to internal servers, databases, or fellow applicant records.</li>
              <li>Use our communication boards for harassment, spamming, academic dishonesty, or hate speech.</li>
            </ul>
          </Section>

          <Section title="6. Limitation of Liability & Disclaimer">
            The website and internship application portal are provided on an "AS IS" and "AS AVAILABLE" basis. We do not guarantee that submitting an application guarantees an internship offer or certificate.
            <br /><br />
            To the maximum extent permitted by law, Vyntyra Consultancy Services shall not be liable for any indirect, incidental, or consequential damages arising from website downtime, lost data, or application transmission failures.
          </Section>

          <Section title="7. Governing Law and Jurisdiction">
            These terms are governed by the laws of India. Any disputes arising out of these Terms shall be subject to the exclusive jurisdiction of the courts located in Visakhapatnam, Andhra Pradesh, India.
          </Section>

        </div>

        <p className="mt-6 text-xs text-muted-foreground flex flex-col gap-1.5">
          <span className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-secondary" /> This terms page governs access and portal usage for candidates.
          </span>
          <span className="text-[10px] text-muted-foreground/80">
            Managed by Legal Authorized Person: <strong>JAMI ESWAR ANIL KUMAR</strong> (Founder &amp; Director) · <a href="mailto:jamieswaranilkumar@vyntyraconsultancyservices.in" className="text-secondary hover:underline">jamieswaranilkumar@vyntyraconsultancyservices.in</a>
          </span>
        </p>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">{title}</h2>
      <div className="text-foreground/90">{children}</div>
    </section>
  );
}
