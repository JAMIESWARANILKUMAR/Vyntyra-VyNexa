import { createFileRoute } from "@tanstack/react-router";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Applicant Terms — Vyntyra Careers" },
      { name: "description", content: "Terms of use for the Vyntyra Careers applicant portal and Project VyNexa application form." },
      { property: "og:title", content: "Applicant Terms — Vyntyra Careers" },
      { property: "og:description", content: "Terms of use for the Vyntyra Careers applicant portal." },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
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
          <h1 className="text-3xl sm:text-4xl font-semibold text-primary tracking-tight">Applicant Terms</h1>
          <p className="text-sm text-muted-foreground mt-3">
            Effective date: 09 July 2026 · Maintained by Vyntyra Consultancy Services
          </p>
        </div>

        <div className="rounded-md border border-border bg-card shadow-corp p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-foreground">
          <Section title="1. Scope">
            These terms govern your use of the Vyntyra Careers applicant portal (the "Portal") operated by Vyntyra
            Consultancy Services ("Vyntyra", "we", "us") to submit applications for Project VyNexa and other openings.
            By submitting an application you agree to these terms and to the accompanying{" "}
            <a href="/privacy" className="text-secondary underline underline-offset-4 hover:text-primary">Privacy Notice</a>.
          </Section>
          <Section title="2. Eligibility & accuracy">
            You confirm that you are legally eligible to work in the location you have applied to and that all
            information you submit — including contact details, academic details, resume, portfolio, and project
            documents — is accurate and your own. Misrepresentation may result in disqualification.
          </Section>
          <Section title="3. Your submission">
            You retain ownership of the content you submit. You grant Vyntyra a limited, non-exclusive licence to
            store, review, share internally with the hiring team, and process your submission for the purpose of
            evaluating your application and communicating with you about it.
          </Section>
          <Section title="4. Automated processing">
            We may use automated tooling to parse your resume, generate interview preparation notes for the hiring
            team, and send status updates by email. Hiring decisions are made by humans; automated tooling only
            assists reviewers and never rejects an application on its own.
          </Section>
          <Section title="5. Acceptable use">
            Do not submit malware, unlawful content, or information belonging to a third party without their consent.
            Do not attempt to interfere with the Portal, its security controls, or other applicants' data.
          </Section>
          <Section title="6. Communications">
            By applying you agree that we may contact you at the email address and phone number you provide about
            your application status, interview scheduling, and role updates. You may withdraw your application at any
            time by contacting hr@vyntyraconsultancyservices.in.
          </Section>
          <Section title="7. No offer or guarantee">
            Submitting an application does not create an employment relationship or a guarantee of interview or
            offer. Any offer of employment will be made in writing on separate terms.
          </Section>
          <Section title="8. Changes">
            We may update these terms. The "Effective date" above reflects the latest version. Continued use of the
            Portal after an update constitutes acceptance of the revised terms.
          </Section>
          <Section title="9. Contact">
            Questions about these terms: <a className="text-secondary underline underline-offset-4" href="mailto:hr@vyntyraconsultancyservices.in">hr@vyntyraconsultancyservices.in</a>.
          </Section>
        </div>

        <p className="mt-6 text-xs text-muted-foreground flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-secondary" /> This page is maintained by Vyntyra Consultancy Services and answers common questions about applying through this portal. It is not a legal certification.
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
