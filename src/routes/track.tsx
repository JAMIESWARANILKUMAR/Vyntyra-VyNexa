import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Mail, Hash, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { lookupApplicationStatus } from "@/lib/portal.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorldClocks } from "@/components/world-clocks";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track Application — Vyntyra Careers" },
      {
        name: "description",
        content:
          "Instantly track your Project VyNexa application status using your reference ID and registered email.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrackPage,
});

const STATUS_LABEL: Record<string, string> = {
  new: "Received",
  reviewing: "Under Review",
  shortlisted: "Shortlisted",
  rejected: "Not Selected",
  hired: "Hired",
};

const STATUS_STYLE: Record<string, string> = {
  new: "bg-secondary/10 text-secondary border-secondary/30",
  reviewing: "bg-gold/15 text-gold-foreground border-gold/40",
  shortlisted: "bg-emerald-50 text-emerald-800 border-emerald-300",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
  hired: "bg-primary text-primary-foreground border-primary",
};

function TrackPage() {
  const lookup = useServerFn(lookupApplicationStatus);
  const [referenceId, setReferenceId] = useState("");
  const [email, setEmail] = useState("");

  const mut = useMutation({
    mutationFn: () => lookup({ data: { referenceId, email } }),
    onError: (e) => toast.error((e as Error).message),
  });

  const data = mut.data;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 h-14 sm:h-16 flex items-center gap-3">
          <img src="/favicon.png" alt="Vyntyra" className="h-8 sm:h-10 w-auto" />
          <div className="border-l border-border pl-3">
            <div className="text-sm font-semibold text-primary leading-none">Vyntyra Careers</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
              Track Application
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-16">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <WorldClocks />

          <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-corp">
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-primary">
              Track your application
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Enter the <strong>Reference ID</strong> shown after you submitted and the email you
              applied with. No magic link required.
            </p>

            <form
              className="mt-6 grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!referenceId || !email) return;
                mut.mutate();
              }}
            >
              <div className="sm:col-span-1">
                <label htmlFor="ref" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Reference ID
                </label>
                <div className="relative mt-1.5">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="ref"
                    required
                    minLength={6}
                    maxLength={16}
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value.toUpperCase())}
                    placeholder="e.g. A1B2C3D4"
                    className="pl-9 font-mono uppercase"
                  />
                </div>
              </div>
              <div className="sm:col-span-1">
                <label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Registered email
                </label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  disabled={mut.isPending}
                  className="w-full bg-primary hover:bg-secondary"
                >
                  {mut.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking…
                    </>
                  ) : (
                    "Check status"
                  )}
                </Button>
              </div>
            </form>

            <p className="mt-4 text-xs text-muted-foreground">
              Prefer a secure one-time link instead?{" "}
              <Link to="/status" className="text-secondary underline">
                Email me a magic link
              </Link>
              .
            </p>
          </div>

          {data && !data.ok && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 flex gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-destructive">No matching application</div>
                <div className="text-muted-foreground mt-1">
                  Double-check the Reference ID and email you used when applying. Both must match.
                </div>
              </div>
            </div>
          )}

          {data && data.ok && (
            <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-corp">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">
                    Application
                  </div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-primary mt-1">
                    {data.application.full_name}
                  </h2>
                  <div className="text-sm text-muted-foreground">
                    {data.application.role_applied}
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-sm border border-border bg-background px-3 py-1.5 text-xs">
                  <span className="uppercase tracking-widest text-muted-foreground">Ref</span>
                  <span className="font-mono text-primary font-medium">
                    {data.application.reference_id}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 flex-wrap">
                <span
                  className={
                    "inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium " +
                    (STATUS_STYLE[data.application.status] || "")
                  }
                >
                  {STATUS_LABEL[data.application.status] || data.application.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  Last updated {new Date(data.application.updated_at).toLocaleString()}
                </span>
              </div>

              <div className="mt-8">
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                  Timeline
                </div>
                <ol className="space-y-3">
                  <li className="flex gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-1 shrink-0" />
                    <div className="text-sm">
                      <div className="font-medium text-foreground">Application submitted</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(data.application.submitted_at).toLocaleString()}
                      </div>
                    </div>
                  </li>
                  {data.history.map((e: any, i: number) => (
                    <li key={i} className="flex gap-3">
                      <Clock className="h-4 w-4 text-secondary mt-1 shrink-0" />
                      <div className="text-sm">
                        <div className="font-medium text-foreground">
                          Moved to {STATUS_LABEL[e.to_status] || e.to_status}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(e.created_at).toLocaleString()}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-8 rounded-md bg-muted/40 border border-border p-4 text-xs text-muted-foreground">
                Questions? Reach us at{" "}
                <a
                  href="mailto:hr@vyntyraconsultancyservices.in"
                  className="text-secondary underline"
                >
                  hr@vyntyraconsultancyservices.in
                </a>
                .
              </div>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Vyntyra Consultancy Services · Project VyNexa
          </p>
        </div>
      </main>
    </div>
  );
}
