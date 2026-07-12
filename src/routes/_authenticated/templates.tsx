import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { listStatusTemplates, updateStatusTemplate } from "@/lib/workflow.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/templates")({
  head: () => ({ meta: [{ title: "Email Templates — Vyntyra Admin" }] }),
  component: TemplatesPage,
});

const STATUSES = ["new", "reviewing", "shortlisted", "rejected", "hired"] as const;

function TemplatesPage() {
  const list = useServerFn(listStatusTemplates);
  const { data: tpls = [], isLoading, error } = useQuery({
    queryKey: ["status-templates"],
    queryFn: () => list(),
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/_authenticated/admin" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="font-serif text-lg font-bold text-primary leading-none">Status Emails</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                Templates sent to applicants on status change
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Variables you can use: <code className="text-foreground">{"{{full_name}}"}</code>,{" "}
          <code className="text-foreground">{"{{role_applied}}"}</code>,{" "}
          <code className="text-foreground">{"{{status}}"}</code>,{" "}
          <code className="text-foreground">{"{{portal_link}}"}</code>,{" "}
          <code className="text-foreground">{"{{application_id}}"}</code>.
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive mb-6">
            {(error as Error).message}
          </div>
        )}

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-secondary" />
          </div>
        ) : (
          <Tabs defaultValue="new">
            <TabsList className="grid grid-cols-5">
              {STATUSES.map((s) => (
                <TabsTrigger key={s} value={s} className="capitalize">
                  {s}
                </TabsTrigger>
              ))}
            </TabsList>
            {STATUSES.map((s) => {
              const tpl = tpls.find((t: any) => t.status === s);
              return (
                <TabsContent key={s} value={s} className="mt-6">
                  {tpl ? (
                    <TemplateEditor tpl={tpl} />
                  ) : (
                    <div className="text-sm text-muted-foreground">Template not found for {s}.</div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </main>
    </div>
  );
}

function TemplateEditor({ tpl }: { tpl: any }) {
  const qc = useQueryClient();
  const update = useServerFn(updateStatusTemplate);
  const [subject, setSubject] = useState(tpl.subject);
  const [body, setBody] = useState(tpl.html_body);
  const [enabled, setEnabled] = useState(tpl.enabled);

  useEffect(() => {
    setSubject(tpl.subject);
    setBody(tpl.html_body);
    setEnabled(tpl.enabled);
  }, [tpl.status]);

  const mut = useMutation({
    mutationFn: () =>
      update({
        data: { status: tpl.status, subject, html_body: body, enabled },
      }),
    onSuccess: () => {
      toast.success("Template saved");
      qc.invalidateQueries({ queryKey: ["status-templates"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-corp space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Status</div>
          <div className="font-serif text-xl font-bold text-primary capitalize">{tpl.status}</div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={enabled} onCheckedChange={setEnabled} />
          <span className="text-muted-foreground">Send email on this status</span>
        </label>
      </div>

      <div>
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Subject</label>
        <Input className="mt-1.5" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>

      <div>
        <label className="text-xs uppercase tracking-wider text-muted-foreground">HTML body</label>
        <Textarea
          className="mt-1.5 font-mono text-xs"
          rows={14}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
          <Mail className="h-3 w-3" /> Preview
        </div>
        <div
          className="rounded-md border border-border bg-white p-4 text-sm text-[#0A1F44] prose max-w-none"
          dangerouslySetInnerHTML={{ __html: renderPreview(body) }}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={() => mut.mutate()} disabled={mut.isPending} className="bg-primary hover:bg-secondary">
          {mut.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            "Save template"
          )}
        </Button>
      </div>
    </div>
  );
}

function renderPreview(html: string) {
  const vars: Record<string, string> = {
    full_name: "Priya Sharma",
    role_applied: "Search Relevance Engineer",
    status: "reviewing",
    portal_link: "https://example.com/status/preview",
    application_id: "00000000-0000-0000-0000-000000000000",
  };
  return html.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}
