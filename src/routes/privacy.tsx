import { createFileRoute } from "@tanstack/react-router";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Notice — Vyntyra Careers" },
      { name: "description", content: "How Vyntyra Consultancy Services collects, uses, and protects applicant data for Project VyNexa." },
      { property: "og:title", content: "Privacy Notice — Vyntyra Careers" },
      { property: "og:description", content: "How Vyntyra handles applicant data for the Project VyNexa careers portal." },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src="/favicon.png" alt="Vyntyra" className="h-9 w-auto" />
          </a>
          <a href="/" className="text-sm text-muted-foreground hover:text-primary">← Back to application</a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-8">
          <div className="text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold mb-2">Legal · Applicants</div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-primary tracking-tight">Privacy Notice</h1>
          <p className="text-sm text-muted-foreground mt-3">
            Effective date: 09 July 2026 · Maintained by Vyntyra Consultancy Services
          </p>
        </div>

        <div className="rounded-md border border-border bg-card shadow-corp p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-foreground">
          <Section title="Who we are">
            Vyntyra Consultancy Services ("Vyntyra") is the data controller for personal information submitted through
            the Vyntyra Careers applicant portal. Contact: hr@vyntyraconsultancyservices.in.
          </Section>
          <Section title="What we collect">
            Identity and contact details (name, email, phone), professional details (current company, role, LinkedIn,
            portfolio, years of experience, availability), academic details (state, college, graduation year, HOD and
            T&P contact details), your resume, project links and summaries, any documents you attach, and the cover
            message you provide.
          </Section>
          <Section title="How we use it">
            We use your data to review your application, contact you about it, schedule interviews, generate internal
            interview preparation notes for reviewers, send you automated status updates, and keep audit records of
            status changes. We do not sell your data.
          </Section>
          <Section title="Legal basis">
            We process your data on the basis of steps taken at your request prior to entering a possible employment
            contract, our legitimate interest in evaluating candidates fairly, and your consent captured through the
            agreement checkbox on the application form.
          </Section>
          <Section title="Sharing">
            Access is limited to authorised Vyntyra hiring team members. We use trusted processors to run the portal
            and send transactional email (application confirmation and status notifications). Resumes are stored in a
            private storage bucket and shared internally only through time-limited signed links.
          </Section>
          <Section title="Security">
            Traffic is served over TLS. Application data is stored with row-level security so records are only
            accessible to authorised administrators. The portal is fronted by Cloudflare Technologies. We follow
            ISO-aligned data handling practices. No online system is perfectly secure; we work to reduce risk and
            respond quickly to incidents.
          </Section>
          <Section title="Retention">
            We retain application data for up to 24 months after the final status decision so we can consider you for
            future roles, then delete or anonymise it. You can ask us to delete it sooner.
          </Section>
          <Section title="Your rights">
            You can request access, correction, or deletion of your personal data, withdraw consent, or ask us to
            restrict processing by emailing hr@vyntyraconsultancyservices.in. You can also track your application
            status at any time through the applicant portal using the secure link we send you.
          </Section>
          <Section title="Cookies & analytics">
            The portal uses only the cookies and local storage entries needed to run the application form, keep you
            signed in to the applicant portal, and remember your device for the installable app. No third-party
            advertising trackers are used.
          </Section>
          <Section title="Changes">
            We may update this notice. The "Effective date" above reflects the latest version.
          </Section>
        </div>

        <p className="mt-6 text-xs text-muted-foreground flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-secondary" /> This page is maintained by Vyntyra Consultancy Services and describes current practices for the applicant portal. It is not a certification.
        </p>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">{title}</h2>
      <p className="text-foreground/90">{children}</p>
    </section>
  );
}
