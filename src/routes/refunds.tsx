import { createFileRoute } from "@tanstack/react-router";
import { Shield, ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/refunds")({
  head: () => ({
    meta: [
      { title: "Cancellation & Refund Policy — Vyntyra Careers" },
      { name: "description", content: "Cancellation and Refund Policy of Vyntyra Consultancy Services." },
      { property: "og:title", content: "Cancellation & Refund Policy — Vyntyra Careers" },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: RefundsPage,
});

function RefundsPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Header />

      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Careers
          </Link>
          <div className="text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold mb-2">Legal · Financials</div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-primary tracking-tight">Cancellation &amp; Refund Policy</h1>
          <p className="text-sm text-muted-foreground mt-3">
            Last Updated: August 17, 2026 · Vyntyra Consultancy Services
          </p>
        </div>

        <div className="rounded-md border border-border bg-card shadow-corp p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-foreground">
          
          <Section title="1. Overview">
            This policy governs fee transactions, cancellations, and refund requests related to training programs, application evaluations, verification fees, or course materials offered by Vyntyra Consultancy Services ("Company", "we", "us").
          </Section>

          <Section title="2. Application &amp; Registration Fees">
            If an administrative application processing fee or test proctoring fee is charged, it is strictly non-refundable once the screening or evaluation process has commenced.
            <br /><br />
            If a duplicate payment occurs due to a payment gateway timeout or network error, the duplicate amount will be refunded in full.
          </Section>

          <Section title="3. Program / Training Material Fees">
            For programs with associated material, platform access, or training components:
            <ul className="list-disc pl-5 mt-2 space-y-2 text-foreground/80">
              <li><strong>Before Program Start Date:</strong> Cancellation requests received at least 7 days before the scheduled batch orientation date are eligible for a 100% refund (less payment gateway transaction charges).</li>
              <li><strong>Cooling-off Period:</strong> Cancellation requests submitted within the first 3 days of program commencement will be eligible for a 50% refund.</li>
              <li><strong>After the Cooling-off Period:</strong> No refunds will be issued after the cooling-off period has expired or after access credentials to proprietary repositories/learning platforms have been distributed.</li>
            </ul>
          </Section>

          <Section title="4. Company Cancellation or Rescheduling">
            In the rare event that Vyntyra Consultancy Services cancels or indefinitely postpones an internship/training cohort, enrolled candidates will be offered the choice of an immediate 100% full refund or free transfer to a subsequent cohort batch.
          </Section>

          <Section title="5. Refund Request and Processing Workflow">
            <ul className="list-disc pl-5 mt-2 space-y-2 text-foreground/80">
              <li><strong>How to Request:</strong> Email <a href="mailto:billing@vyntyraconsultancyservices.in" className="text-secondary hover:underline">billing@vyntyraconsultancyservices.in</a> from your registered email address with the Subject line: &quot;Refund Request - [Your Name] - [Transaction/Order ID]&quot;.</li>
              <li><strong>Investigation:</strong> Our finance team will review the request against program activity logs within 5 to 7 business days.</li>
              <li><strong>Settlement:</strong> Approved refunds will be processed automatically back to the original payment method (Bank Account / UPI / Card) within 7 to 10 working days, subject to your bank's clearance timelines.</li>
            </ul>
          </Section>

        </div>

        <p className="mt-6 text-xs text-muted-foreground flex flex-col gap-1.5">
          <span className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-secondary" /> This policy outlines all refund rules and guidelines for training or orientation plans.
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
