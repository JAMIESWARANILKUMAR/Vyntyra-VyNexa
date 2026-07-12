import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { requestPortalLink } from "@/lib/portal.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorldClocks } from "@/components/world-clocks";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "Check Application Status — Vyntyra Careers" },
      {
        name: "description",
        content:
          "Check the status of your Project VyNexa application. Enter your email to receive a secure one-time link.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StatusRequestPage,
});

function StatusRequestPage() {
  const request = useServerFn(requestPortalLink);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const mut = useMutation({
    mutationFn: () => request({ data: { email } }),
    onSuccess: () => setSent(true),
    onError: (e) => toast.error((e as Error).message),
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

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-3xl space-y-6">
          <WorldClocks />
          <div className="rounded-xl border border-border bg-card p-8 shadow-corp">
            <h1 className="font-serif text-2xl font-bold text-primary">Check your application</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Enter the email you applied with. We'll email a secure one-time link (valid 30 minutes) to view your status.
            </p>

            {sent ? (
              <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <div className="font-medium mb-1">Check your inbox</div>
                <p>
                  If an application exists for <strong>{email}</strong>, we've sent a status link. It expires in 30 minutes and can be opened once.
                </p>
              </div>
            ) : (
              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!email) return;
                  mut.mutate();
                }}
              >
                <div>
                  <label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
                    Email address
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
                <Button
                  type="submit"
                  disabled={mut.isPending}
                  className="w-full bg-primary hover:bg-secondary"
                >
                  {mut.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending link…
                    </>
                  ) : (
                    "Email me a status link"
                  )}
                </Button>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Vyntyra Consultancy Services · Project VyNexa
          </p>
        </div>
      </main>
    </div>
  );
}
