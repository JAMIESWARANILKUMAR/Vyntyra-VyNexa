import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Mail, Save, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { listStatusTemplates, updateStatusTemplate } from "@/lib/workflow.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/templates")({
  head: () => ({ meta: [{ title: "Email Templates - Vyntyra Admin" }] }),
  component: TemplatesPage,
});

const STATUSES = ["new", "reviewing", "interview_scheduled", "shortlisted", "finalised", "selected", "rejected", "hired", "promotional"] as const;

function TemplatesPage() {
  const list = useServerFn(listStatusTemplates);
  const { data: tpls = [], isLoading, error } = useQuery({
    queryKey: ["status-templates"],
    queryFn: () => list(),
  });

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Corporate Glass Header */}
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur-xl sticky top-0 z-40 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full px-4 h-9 font-semibold">
              <Link to="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Directory
              </Link>
            </Button>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <div>
              <div className="text-[15px] font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Mail className="h-4 w-4 text-indigo-600" />
                Communication Configurations
              </div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-0.5">
                Automated Stage Triggers
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 text-sm text-indigo-800 shadow-sm flex items-start gap-3">
          <FileText className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold text-indigo-900 mb-1">Template Variables Available</h4>
            <p className="text-indigo-700/80 mb-2">You can use these placeholders to personalize the emails. They will be dynamically replaced when the system dispatches the notification.</p>
            <div className="flex flex-wrap gap-2">
              <code className="bg-white text-indigo-700 px-2 py-1 rounded-md shadow-sm text-xs font-bold font-mono">{"{{full_name}}"}</code>
              <code className="bg-white text-indigo-700 px-2 py-1 rounded-md shadow-sm text-xs font-bold font-mono">{"{{role_applied}}"}</code>
              <code className="bg-white text-indigo-700 px-2 py-1 rounded-md shadow-sm text-xs font-bold font-mono">{"{{status}}"}</code>
              <code className="bg-white text-indigo-700 px-2 py-1 rounded-md shadow-sm text-xs font-bold font-mono">{"{{portal_link}}"}</code>
              <code className="bg-white text-indigo-700 px-2 py-1 rounded-md shadow-sm text-xs font-bold font-mono">{"{{application_id}}"}</code>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 font-medium mb-6 shadow-sm">
            {(error as Error).message}
          </div>
        )}

        {isLoading ? (
          <div className="p-20 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/50 border border-slate-200/80 overflow-hidden">
            <Tabs defaultValue="new" className="w-full">
              <div className="bg-slate-50 border-b border-slate-200 p-3">
                <TabsList className="w-full flex overflow-x-auto bg-slate-200/50 p-1.5 rounded-xl h-auto">
                  {STATUSES.map((s) => (
                    <TabsTrigger 
                      key={s} 
                      value={s} 
                      className="flex-1 capitalize text-[11px] font-bold tracking-wide py-2.5 px-4 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md rounded-lg transition-all"
                    >
                      {s.replace("_", " ")}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              
              <div className="p-6 sm:p-8 bg-white">
                {STATUSES.map((s) => {
                  const tpl = tpls.find((t: any) => t.id === s);
                  return (
                    <TabsContent key={s} value={s} className="mt-0 outline-none">
                      {tpl ? (
                        <TemplateEditor tpl={tpl} />
                      ) : (
                        <div className="text-sm text-slate-500 italic p-12 text-center bg-slate-50 rounded-xl border border-slate-100">Template configuration not found for {s}. Please check your database.</div>
                      )}
                    </TabsContent>
                  );
                })}
              </div>
            </Tabs>
          </div>
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
  }, [tpl.id]);

  const mut = useMutation({
    mutationFn: () =>
      update({
        data: { status: tpl.id, subject, html_body: body, enabled },
      }),
    onSuccess: () => {
      toast.success("Template Configuration Saved!");
      qc.invalidateQueries({ queryKey: ["status-templates"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Stage Trigger</div>
          <div className="text-xl font-black text-slate-900 capitalize tracking-tight">{tpl.id.replace("_", " ")} Automation</div>
        </div>
        <label className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-slate-200 cursor-pointer shadow-sm hover:border-indigo-200 hover:shadow-md transition-all group">
          <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">Dispatch Automatically</span>
          <Switch checked={enabled} onCheckedChange={setEnabled} className="data-[state=checked]:bg-emerald-500" />
        </label>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider ml-1">Email Subject Line</label>
        <Input 
          className="h-12 text-sm font-medium bg-slate-50 focus:bg-white border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all rounded-xl" 
          value={subject} 
          onChange={(e) => setSubject(e.target.value)} 
          placeholder="e.g. Update on your VyNexa Application..."
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between ml-1 mb-2">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">HTML Body Payload</label>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">Supports Corporate Styling</span>
        </div>
        <Textarea
          className="font-mono text-xs bg-slate-50 focus:bg-white border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all rounded-xl p-4 min-h-[280px] leading-relaxed"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider ml-1 flex items-center gap-1.5 mb-2">
          <Mail className="h-4 w-4 text-slate-400" /> Client Preview Render
        </div>
        <div
          className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 md:p-10 text-sm text-[#0A1F44] prose prose-slate max-w-none shadow-inner"
          dangerouslySetInnerHTML={{ __html: renderPreview(body) }}
        />
      </div>

      <div className="flex justify-end pt-6 border-t border-slate-100">
        <Button 
          onClick={() => mut.mutate()} 
          disabled={mut.isPending} 
          className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {mut.isPending ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Committing Changes...</>
          ) : (
            <><Save className="mr-2 h-5 w-5" /> Save Configuration</>
          )}
        </Button>
      </div>
    </div>
  );
}

function renderPreview(html: string) {
  const vars: Record<string, string> = {
    full_name: "Priya Sharma",
    role_applied: "Software Engineer Intern",
    status: "reviewing",
    portal_link: "https://vynexaconsultancyservices.in/track",
    application_id: "APP-0000-0000",
  };
  return html.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_, k) => vars[k] ?? {{}});
}
