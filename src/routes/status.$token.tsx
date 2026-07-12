import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CheckCircle2, XCircle, Clock, Download } from "lucide-react";
import { checkPortalToken } from "@/lib/portal.functions";
import { WorldClocks } from "@/components/world-clocks";

export const Route = createFileRoute("/status/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Application Status — Vyntyra Careers" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StatusView,
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

function StatusView() {
  const { token } = Route.useParams();
  const check = useServerFn(checkPortalToken);

  const { data, isLoading, error } = useQuery({
    queryKey: ["portal-token", token],
    queryFn: () => check({ data: { token } }),
    retry: false,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center gap-3">
          <img src="/favicon.png" alt="Vyntyra" className="h-10 w-auto" />
          <div className="border-l border-border pl-3">
            <div className="text-sm font-semibold text-primary leading-none">Vyntyra Careers</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Applicant Portal</div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-16">
        <div className="mx-auto max-w-3xl space-y-6">
          <WorldClocks />
          {isLoading && (
            <div className="rounded-xl border border-border bg-card p-12 text-center shadow-corp">
              <Loader2 className="h-6 w-6 animate-spin text-secondary mx-auto" />
              <p className="mt-3 text-sm text-muted-foreground">Verifying your link…</p>
            </div>
          )}

          {error && (
            <ErrorCard title="Something went wrong" message={(error as Error).message} />
          )}

          {data && !data.ok && (
            <ErrorCard
              title={
                data.reason === "expired"
                  ? "Link expired"
                  : data.reason === "used"
                    ? "Link already used"
                    : "Invalid link"
              }
              message={
                data.reason === "expired"
                  ? "This link expired. Request a fresh one below."
                  : data.reason === "used"
                    ? "This link has already been opened. Request a new one to check again."
                    : "This link is not valid. Request a new one below."
              }
            />
          )}

          {data && data.ok && (
            <div className="rounded-xl border border-border bg-card p-8 shadow-corp">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Application</div>
              <h1 className="font-serif text-2xl font-bold text-primary mt-1">{data.application.full_name}</h1>
              <div className="text-sm text-muted-foreground">{data.application.role_applied}</div>

              <div className="mt-6 flex items-center gap-3">
                <span
                  className={
                    "inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium capitalize " +
                    (STATUS_STYLE[data.application.status] || "")
                  }
                >
                  {STATUS_LABEL[data.application.status] || data.application.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  Last updated {new Date(data.application.updated_at).toLocaleString()}
                </span>
              </div>

              {data.history.length > 0 && (
                <div className="mt-8">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Timeline</div>
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
                          <div className="font-medium text-foreground capitalize">
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
              )}

              {(data as any).resume && (
                <div className="mt-6 rounded-md border border-secondary/30 bg-secondary/5 p-4 flex items-center justify-between gap-3">
                  <div className="text-sm">
                    <div className="font-medium text-foreground">Your submitted resume</div>
                    <div className="text-xs text-muted-foreground">Signed link · valid 30 minutes</div>
                  </div>
                  <a
                    href={(data as any).resume.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground hover:bg-secondary"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                </div>
              )}

              <div className="mt-8 rounded-md bg-muted/40 border border-border p-4 text-xs text-muted-foreground">
                For any queries reach us at{" "}
                <a href="mailto:hr@vyntyraconsultancyservices.in" className="text-secondary underline">
                  hr@vyntyraconsultancyservices.in
                </a>
                .
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-corp text-center">
      <XCircle className="h-10 w-10 text-destructive mx-auto" />
      <h1 className="mt-4 font-serif text-xl font-bold text-primary">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <Link
        to="/status"
        className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-secondary"
      >
        Request a new link
      </Link>
    </div>
  );
}
