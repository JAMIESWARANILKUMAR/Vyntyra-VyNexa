import { createFileRoute } from "@tanstack/react-router";
import { Shield, ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Vyntyra Careers" },
      { name: "description", content: "Privacy Policy of Vyntyra Consultancy Services aligned with DPDPA 2023." },
      { property: "og:title", content: "Privacy Policy — Vyntyra Careers" },
      { property: "og:description", content: "Privacy Policy aligned with the Digital Personal Data Protection Act, 2023." },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Header />

      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Careers
          </Link>
          <div className="text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold mb-2">Legal · Compliance</div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-primary tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-3">
            Last Updated: August 17, 2026 · Vyntyra Consultancy Services
          </p>
        </div>

        <div className="rounded-md border border-border bg-card shadow-corp p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-foreground">
          
          <Section title="1. Introduction and Scope">
            This Privacy Policy outlines how Vyntyra Consultancy Services ("Company", "we", "us", or "our"), functioning as a Data Fiduciary, collects, stores, uses, processes, and protects the personal data of students, applicants, and platform visitors ("Data Principal", "you", or "your") in compliance with the Digital Personal Data Protection Act (DPDPA), 2023 and the Information Technology Act, 2000.
          </Section>

          <Section title="2. Personal Data We Collect">
            We collect only the data necessary to process your internship application and administer the program:
            <ul className="list-disc pl-5 mt-2 space-y-1 text-foreground/80">
              <li><strong>Identity & Contact Data:</strong> Full name, email address, phone number, residential address, date of birth, and gender.</li>
              <li><strong>Academic & Professional Data:</strong> College/university name, degree, branch/stream, year of study, roll/registration number, GPA/marks, resumes/CVs, GitHub/portfolio links, and skill assessments.</li>
              <li><strong>Verification Documents:</strong> Government-issued identification (Aadhaar, PAN, College ID card) when required for formal onboarding.</li>
              <li><strong>Financial Details:</strong> Bank account details (Account Number, IFSC code, UPI ID) solely for processing stipends or reimbursement of expenses where applicable.</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information, and standard session cookies.</li>
            </ul>
          </Section>

          <Section title="3. Purpose of Data Processing">
            Your personal data is processed strictly for the following specified purposes:
            <ul className="list-disc pl-5 mt-2 space-y-1 text-foreground/80">
              <li>Evaluating eligibility and assessing internship applications.</li>
              <li>Coordinating interviews, practical tests, and selection workflows.</li>
              <li>Onboarding selected candidates into the company's internal tools and communications platforms.</li>
              <li>Monitoring project milestones, assigning mentors, and evaluating performance.</li>
              <li>Issuing formal Offer Letters, Letters of Recommendation (LOR), and Certificates of Completion.</li>
              <li>Disbursing stipends and maintaining mandatory financial/corporate records under Indian law.</li>
            </ul>
          </Section>

          <Section title="4. Consent & Withdrawal (Section 6, DPDPA 2023)">
            Processing of your data is based on your free, specific, informed, unconditional, and unambiguous consent signified by an affirmative action (such as submitting an application form or checking a consent box).
            <br /><br />
            You retain the right to withdraw your consent at any time by contacting our Grievance Officer. The ease of withdrawing consent is comparable to giving it. Upon withdrawal, we will cease data processing unless required by applicable statutory record-keeping regulations. Withdrawal of consent does not affect the legality of processing prior to the request.
          </Section>

          <Section title="5. Processing Personal Data of Children (Section 9, DPDPA 2023)">
            If you are under the age of 18 ("child"), you must obtain verifiable consent from your parent or lawful guardian before submitting personal data. We do not engage in targeted advertising, behavioral tracking, or any processing that causes detrimental effects on the well-being of minors.
          </Section>

          <Section title="6. Data Storage, Security & Retention">
            We deploy technical and organizational measures (encryption in transit and at rest, role-based access control, secure databases) to prevent data breaches.
            <br /><br />
            Personal data of non-selected applicants is erased within 180 days of closing the recruitment drive. Data of onboarded interns is retained for the duration of the internship and up to 3 years post-completion for certificate verification and compliance auditing, after which it is securely shredded/purged.
          </Section>

          <Section title="7. Data Principal Rights (Sections 11–14, DPDPA 2023)">
            You have the right to:
            <ul className="list-disc pl-5 mt-2 space-y-1 text-foreground/80">
              <li><strong>Access Information:</strong> Request a summary of your personal data being processed and identities of Data Processors involved.</li>
              <li><strong>Correction & Erasure:</strong> Request correction of inaccurate data, completion of incomplete records, or erasure of data no longer needed for the specified purpose.</li>
              <li><strong>Grievance Redressal:</strong> Access our internal grievance mechanism to resolve data privacy concerns.</li>
              <li><strong>Nomination:</strong> Nominate an individual to exercise your data rights in the event of death or incapacity.</li>
            </ul>
          </Section>

          <Section title="8. Grievance Officer Contact Details">
            In accordance with Section 8(9) of the DPDPA, 2023, for questions, rights requests, or complaints:
            <div className="mt-3 p-4 bg-muted/30 border rounded-lg space-y-1 text-xs">
              <div><strong>Grievance Officer:</strong> Data Protection & Grievance Officer</div>
              <div><strong>Designation:</strong> Data Protection & Grievance Officer</div>
              <div><strong>Email:</strong> <a href="mailto:grievance@vyntyraconsultancyservices.in" className="text-secondary hover:underline">grievance@vyntyraconsultancyservices.in</a></div>
              <div><strong>Address:</strong> Dwaraka Nagar, Visakhapatnam - 530016, AP, India</div>
              <div><strong>Response Timeline:</strong> Within 30 days of receiving the request.</div>
            </div>
            <br />
            If your grievance is not resolved satisfactorily, you may escalate the matter to the Data Protection Board of India.
          </Section>

        </div>

        <p className="mt-6 text-xs text-muted-foreground flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-secondary" /> This policy is aligned with the Digital Personal Data Protection Act (DPDPA), 2023 and the Information Technology Act, 2000.
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
