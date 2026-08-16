import { createFileRoute } from "@tanstack/react-router";
import { Shield, ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/agreement")({
  head: () => ({
    meta: [
      { title: "Internship User Agreement — Vyntyra Careers" },
      { name: "description", content: "Internship Agreement governing experiential learning at Vyntyra Consultancy Services." },
      { property: "og:title", content: "Internship User Agreement — Vyntyra Careers" },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: AgreementPage,
});

function AgreementPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Header />

      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Careers
          </Link>
          <div className="text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold mb-2">Legal · Onboarding</div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-primary tracking-tight">Internship User Agreement</h1>
          <p className="text-sm text-muted-foreground mt-3">
            Last Updated: August 17, 2026 · Vyntyra Consultancy Services
          </p>
        </div>

        <div className="rounded-md border border-border bg-card shadow-corp p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-foreground">
          
          <Section title="1. Nature of Engagement">
            The internship is a training and experiential learning program designed to help the intern acquire practical technical and professional skills.
            <br /><br />
            Acceptance into the internship program does not constitute permanent employment or establish an employer-employee relationship under Indian labor laws. No guarantee of full-time employment, placement, or retention is created by this engagement unless explicitly stated in a separate formal Offer of Employment.
          </Section>

          <Section title="2. Intern Code of Conduct & Expectations">
            During the program, the intern agrees to:
            <ul className="list-disc pl-5 mt-2 space-y-1 text-foreground/80">
              <li>Devote the designated hours per week to tasks, team syncs, and assigned projects.</li>
              <li>Maintain professional etiquette, adhere to sprint deadlines, and report progress transparently to assigned mentors.</li>
              <li>Comply with all information security protocols, zero-trust policies, and development standards set by the Company.</li>
            </ul>
          </Section>

          <Section title="3. Work Product and Intellectual Property Assignment">
            Any code, software architectures, documentation, designs, algorithms, digital assets, or research developed by the intern during the course of the internship (whether individually or jointly) shall be considered &quot;work made for hire&quot;.
            <br /><br />
            All right, title, and interest, including worldwide copyrights and patent rights, in such work products belong solely and exclusively to Vyntyra Consultancy Services. Interns may reference their role and non-confidential project titles in resumes or portfolios, provided proprietary source code is not exposed.
          </Section>

          <Section title="4. Confidentiality & Non-Disclosure">
            Interns will have access to confidential and proprietary information (source code, client data, business strategies, API keys, credentials).
            <br /><br />
            Interns shall maintain strict confidentiality during and indefinitely after the completion of the internship. Unauthorized disclosure, cloning, or public hosting of private repositories will result in immediate dismissal, revocation of certification, and potential legal action under the Information Technology Act, 2000.
          </Section>

          <Section title="5. Certification and Completion Criteria">
            To be eligible for an Internship Completion Certificate and Letter of Recommendation (LOR), the intern must:
            <ul className="list-disc pl-5 mt-2 space-y-1 text-foreground/80">
              <li>Complete all mandatory sprint deliverables and final milestone projects.</li>
              <li>Achieve satisfactory attendance and evaluation marks from the reporting supervisor.</li>
              <li>Complete formal handover of all digital assets, code, and access credentials.</li>
            </ul>
          </Section>

          <Section title="6. Termination">
            Either party may terminate the internship agreement by giving 7 days written notice.
            <br /><br />
            The Company reserves the right to terminate the internship immediately without notice in cases of gross misconduct, plagiarism, data breaches, falsification of documents, or prolonged unexcused absence.
          </Section>

        </div>

        <p className="mt-6 text-xs text-muted-foreground flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-secondary" /> This agreement governs the training engagement for accepted candidates.
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
