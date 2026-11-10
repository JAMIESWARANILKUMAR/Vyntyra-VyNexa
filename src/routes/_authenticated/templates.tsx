import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { 
  ArrowLeft, 
  Loader2, 
  Mail, 
  Save, 
  FileText, 
  CheckCircle2, 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Heading2, 
  Heading3, 
  Link as LinkIcon, 
  Send, 
  Code2, 
  Eye, 
  Sparkles, 
  Layers, 
  ExternalLink,
  RotateCcw,
  Check,
  Copy
} from "lucide-react";
import { toast } from "sonner";
import { listStatusTemplates, updateStatusTemplate, sendTestStatusTemplateEmail } from "@/lib/workflow.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/templates")({
  head: () => ({ meta: [{ title: "Email Templates - Vyntyra Admin" }] }),
  component: TemplatesPage,
});

const STATUSES = [
  "new", 
  "reviewing", 
  "interview_scheduled", 
  "shortlisted", 
  "finalised", 
  "selected", 
  "rejected", 
  "hired", 
  "promotional"
] as const;

const TEMPLATE_VARIABLES = [
  { key: "{{full_name}}", label: "Candidate Name", sample: "Priya Sharma", desc: "Full name of candidate" },
  { key: "{{role_applied}}", label: "Role Applied", sample: "Software Engineer Intern", desc: "Designated role or domain" },
  { key: "{{status}}", label: "Status Stage", sample: "shortlisted", desc: "Current application stage" },
  { key: "{{portal_link}}", label: "Tracking Link", sample: "https://portal.vyntyraconsultancyservices.in/track", desc: "One-time encrypted applicant status link" },
  { key: "{{application_id}}", label: "Application ID", sample: "APP-2026-9481", desc: "Official reference tracking code" },
];

const STAGE_PRESETS: Record<string, { subject: string; body: string }> = {
  new: {
    subject: "Application Received: {{role_applied}} — Vyntyra Consultancy Services",
    body: `<p>Dear <strong>{{full_name}}</strong>,</p>
<p>Thank you for submitting your application for the <strong>{{role_applied}}</strong> role at Vyntyra Consultancy Services for <strong>Project VyNexa</strong>.</p>
<p>We have successfully received your credentials and application details. Our Talent Acquisition Committee is actively screening applications against the eligibility criteria.</p>
<div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #0284c7;border-radius:6px;padding:14px 18px;margin:20px 0;">
  <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Application Reference</div>
  <div style="font-size:14px;color:#0f172a;font-weight:600;">ID: {{application_id}}</div>
  <div style="font-size:12px;color:#64748b;margin-top:2px;">You will receive email updates as your application progresses through our evaluation stages.</div>
</div>
<p>You can monitor the live evaluation status of your submission at any time through our candidate verification portal:</p>
<p style="margin:24px 0;">
  <a href="{{portal_link}}" style="display:inline-block;background-color:#0f172a;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Track Application Status &rarr;</a>
</p>
<p>Best regards,<br/><strong>Vyntyra Talent Acquisition Committee</strong></p>`,
  },
  reviewing: {
    subject: "Application Under Review: {{role_applied}} — Vyntyra",
    body: `<p>Dear <strong>{{full_name}}</strong>,</p>
<p>Your application for <strong>{{role_applied}}</strong> is currently under formal assessment by our Technical Assessment Directorate.</p>
<p>Our mentors and operations panel are reviewing your academic background, submitted portfolios, and domain preferences.</p>
<div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:14px 18px;margin:20px 0;">
  <div style="font-size:13px;color:#334155;"><strong>Next Step:</strong> Candidates meeting our benchmark requirements will be invited to the technical aptitude &amp; CBT assessment round.</div>
</div>
<p style="margin:24px 0;">
  <a href="{{portal_link}}" style="display:inline-block;background-color:#0f172a;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">View Application Status &rarr;</a>
</p>`,
  },
  interview_scheduled: {
    subject: "Interview Round Scheduled: {{role_applied}} — Vyntyra Consultancy Services",
    body: `<p>Dear <strong>{{full_name}}</strong>,</p>
<p>Congratulations! Based on your evaluation, we are pleased to invite you to the <strong>1:1 Technical &amp; Operational Interview Round</strong> for the <strong>{{role_applied}}</strong> cohort.</p>
<div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #059669;border-radius:6px;padding:16px 20px;margin:20px 0;">
  <div style="font-size:11px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Interview Instructions</div>
  <div style="font-size:13.5px;color:#334155;line-height:1.6;">
    Please access your candidate portal to view your assigned interview window, meeting link, and preparation materials. Please ensure you join 5 minutes early with video enabled.
  </div>
</div>
<p style="margin:24px 0;">
  <a href="{{portal_link}}" style="display:inline-block;background-color:#0f172a;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Access Interview Details &rarr;</a>
</p>`,
  },
  shortlisted: {
    subject: "Candidate Shortlisted: {{role_applied}} — Project VyNexa",
    body: `<p>Dear <strong>{{full_name}}</strong>,</p>
<p>We are delighted to inform you that you have been <strong>Shortlisted</strong> for the <strong>{{role_applied}}</strong> position at Vyntyra Consultancy Services.</p>
<p>Your performance across the preliminary evaluation benchmarks demonstrated the diligence and technical competence we seek for our project teams.</p>
<div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:16px 20px;margin:20px 0;">
  <div style="font-size:11px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Selection Status: Shortlisted</div>
  <div style="font-size:13.5px;color:#14532d;line-height:1.5;">Our operations team is finalizing team allocation and mentorship cohorts. Please keep your candidate file updated.</div>
</div>
<p style="margin:24px 0;">
  <a href="{{portal_link}}" style="display:inline-block;background-color:#0f172a;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Confirm Profile &amp; Details &rarr;</a>
</p>`,
  },
  finalised: {
    subject: "Final Review Completed: {{role_applied}} — Vyntyra",
    body: `<p>Dear <strong>{{full_name}}</strong>,</p>
<p>The final operational review for your application for <strong>{{role_applied}}</strong> has concluded successfully.</p>
<p>Your documentation and mentor allocation schedule have been forwarded to the Executive Directorate for onboarding authorization.</p>
<p style="margin:24px 0;">
  <a href="{{portal_link}}" style="display:inline-block;background-color:#0f172a;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Review Status Portal &rarr;</a>
</p>`,
  },
  selected: {
    subject: "Selection Confirmed: Official Offer & 6-Mo Agreement — Vyntyra",
    body: `<p>Dear <strong>{{full_name}}</strong>,</p>
<p>On behalf of the Directorate of Vyntyra Consultancy Services, we are delighted to formally extend our <strong>Official Selection Offer</strong> for the <strong>{{role_applied}}</strong> program (Project VyNexa).</p>
<div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #0284c7;border-radius:6px;padding:16px 20px;margin:20px 0;">
  <div style="font-size:11px;font-weight:700;color:#0284c7;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Onboarding Protocol</div>
  <div style="font-size:13.5px;color:#334155;line-height:1.6;">
    Your official 6-Month Internship Agreement and digital appointment pack have been generated. Please review and sign your acceptance through the secure portal below within 48 hours.
  </div>
</div>
<p style="margin:24px 0;">
  <a href="{{portal_link}}" style="display:inline-block;background-color:#0f172a;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Accept Offer &amp; Sign Agreement &rarr;</a>
</p>`,
  },
  rejected: {
    subject: "Application Update: {{role_applied}} — Vyntyra Consultancy Services",
    body: `<p>Dear <strong>{{full_name}}</strong>,</p>
<p>Thank you for your interest in the <strong>{{role_applied}}</strong> program and for the time and diligence invested in your application.</p>
<p>After thorough review of all submissions for this cohort against our current project capacity, we regret to inform you that we are unable to advance your application at this time.</p>
<div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:14px 18px;margin:20px 0;">
  <div style="font-size:13px;color:#475569;line-height:1.6;">
    Our selection decisions are competitive and project-specific. Your candidate profile remains on record in our talent database, and we warmly invite you to apply for upcoming cohorts.
  </div>
</div>
<p>We wish you the very best in your academic and professional endeavors.</p>
<p>Best regards,<br/><strong>Vyntyra Talent Acquisition Committee</strong></p>`,
  },
  hired: {
    subject: "Welcome Onboard: Official Onboarding & Credentials — Vyntyra",
    body: `<p>Dear <strong>{{full_name}}</strong>,</p>
<p>Welcome to <strong>Vyntyra Consultancy Services</strong>! Your formal onboarding for <strong>{{role_applied}}</strong> is now complete.</p>
<div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:16px 20px;margin:20px 0;">
  <div style="font-size:11px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Internship Status: Active &amp; Verified</div>
  <div style="font-size:13.5px;color:#14532d;line-height:1.6;">
    Your portal profile has been provisioned with your official tasks dashboard, LMS training modules, and mentor connect links.
  </div>
</div>
<p style="margin:24px 0;">
  <a href="{{portal_link}}" style="display:inline-block;background-color:#0f172a;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Enter Intern Workspace &rarr;</a>
</p>`,
  },
  promotional: {
    subject: "Invitation: Official 2026 Internship Program — Vyntyra Consultancy Services",
    body: `<p>Dear <strong>{{full_name}}</strong>,</p>
<p>You are cordially invited to apply for the official 2026 cohort at <strong>Vyntyra Consultancy Services (Project VyNexa)</strong>.</p>
<p>Join high-impact enterprise projects, gain verified corporate experience, and collaborate with industry mentors across scalable software systems, AI integration, and digital growth tech.</p>
<div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #0284c7;border-radius:6px;padding:16px 20px;margin:20px 0;">
  <div style="font-size:11px;font-weight:700;color:#0284c7;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Cohort Highlights</div>
  <ul style="margin:8px 0 0;padding-left:18px;font-size:13px;color:#334155;line-height:1.6;">
    <li>Dual certification: Certificate of Completion + Corporate Recommendation Letter</li>
    <li>Dedicated 1:1 mentor code reviews &amp; live architecture standups</li>
    <li>ISO 9001:2015 &amp; MSME Government recognized corporate credentialing</li>
  </ul>
</div>
<p style="margin:24px 0;">
  <a href="https://portal.vyntyraconsultancyservices.in" style="display:inline-block;background-color:#0f172a;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Explore Opportunities &amp; Apply &rarr;</a>
</p>`,
  },
};

function TemplatesPage() {
  const list = useServerFn(listStatusTemplates);
  const { data: tpls = [], isLoading, error } = useQuery({
    queryKey: ["status-templates"],
    queryFn: () => list(),
  });

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Corporate Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-40 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
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
                Automated Stage Triggers &middot; ISO Standard Engine
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Dynamic Variable Reference Ribbon */}
        <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 text-sm text-indigo-900 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600 mt-0.5 shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                <h4 className="font-bold text-slate-900 text-sm">Dynamic Personalization Placeholders</h4>
                <span className="text-xs text-indigo-600 font-semibold">Click any variable below to copy to clipboard</span>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Use these dynamic tokens in your email subject lines or body text. The system automatically injects candidate-specific details upon dispatch.
              </p>
              <div className="flex flex-wrap gap-2">
                {TEMPLATE_VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(v.key);
                      toast.success(`Copied ${v.key} to clipboard!`);
                    }}
                    title={`${v.desc} (Example: "${v.sample}")`}
                    className="inline-flex items-center gap-1.5 bg-white hover:bg-indigo-50 border border-indigo-200/80 hover:border-indigo-400 text-slate-800 hover:text-indigo-700 px-3 py-1.5 rounded-lg shadow-sm text-xs font-mono transition-all cursor-pointer group"
                  >
                    <code className="font-bold text-indigo-600">{v.key}</code>
                    <span className="text-[11px] font-sans text-slate-500 font-normal">({v.label})</span>
                    <Copy className="h-3 w-3 text-slate-400 group-hover:text-indigo-600 ml-0.5 opacity-60 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 font-medium mb-6 shadow-sm">
            {(error as Error).message}
          </div>
        )}

        {isLoading ? (
          <div className="p-20 flex justify-center bg-white rounded-2xl border border-slate-200">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <Tabs defaultValue="new" className="w-full">
              <div className="bg-slate-50 border-b border-slate-200 p-3">
                <TabsList className="w-full flex overflow-x-auto bg-slate-200/60 p-1.5 rounded-xl h-auto gap-1">
                  {STATUSES.map((s) => (
                    <TabsTrigger 
                      key={s} 
                      value={s} 
                      className="flex-1 capitalize text-[11px] font-bold tracking-wide py-2 px-3 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg transition-all whitespace-nowrap"
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
                        <TemplateEditor tpl={tpl} statusKey={s} />
                      ) : (
                        <div className="text-sm text-slate-500 italic p-12 text-center bg-slate-50 rounded-xl border border-slate-100">
                          Template configuration not found for {s}. Please check your database.
                        </div>
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

function TemplateEditor({ tpl, statusKey }: { tpl: any; statusKey: string }) {
  const qc = useQueryClient();
  const update = useServerFn(updateStatusTemplate);
  const sendTest = useServerFn(sendTestStatusTemplateEmail);

  const [subject, setSubject] = useState(tpl.subject);
  const [body, setBody] = useState(tpl.html_body);
  const [enabled, setEnabled] = useState(tpl.enabled);
  const [editorMode, setEditorMode] = useState<"visual" | "html">("visual");
  const [testEmail, setTestEmail] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  const visualEditorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setSubject(tpl.subject);
    setBody(tpl.html_body);
    setEnabled(tpl.enabled);
    if (visualEditorRef.current) {
      visualEditorRef.current.innerHTML = tpl.html_body;
    }
  }, [tpl.id]);

  // Keep visual editor in sync when switching modes or updating body externally
  useEffect(() => {
    if (editorMode === "visual" && visualEditorRef.current && visualEditorRef.current.innerHTML !== body) {
      visualEditorRef.current.innerHTML = body;
    }
  }, [editorMode]);

  const handleVisualInput = () => {
    if (visualEditorRef.current) {
      setBody(visualEditorRef.current.innerHTML);
    }
  };

  const execFormat = (command: string, value: string | undefined = undefined) => {
    if (editorMode !== "visual") return;
    document.execCommand(command, false, value);
    if (visualEditorRef.current) {
      visualEditorRef.current.focus();
      handleVisualInput();
    }
  };

  const insertVariable = (token: string) => {
    if (editorMode === "visual") {
      if (visualEditorRef.current) {
        visualEditorRef.current.focus();
        document.execCommand("insertText", false, token);
        handleVisualInput();
      }
    } else {
      if (textareaRef.current) {
        const start = textareaRef.current.selectionStart || 0;
        const end = textareaRef.current.selectionEnd || 0;
        const nextBody = body.substring(0, start) + token + body.substring(end);
        setBody(nextBody);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(start + token.length, start + token.length);
          }
        }, 50);
      } else {
        setBody((prev: string) => prev + token);
      }
    }
  };

  const insertButtonCTA = () => {
    const buttonHtml = `<p style="margin:22px 0;"><a href="{{portal_link}}" style="display:inline-block;background-color:#0f172a;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Track Application Status &rarr;</a></p>`;
    if (editorMode === "visual") {
      if (visualEditorRef.current) {
        visualEditorRef.current.focus();
        document.execCommand("insertHTML", false, buttonHtml);
        handleVisualInput();
      }
    } else {
      setBody((prev: string) => prev + "\n" + buttonHtml);
    }
  };

  const insertCalloutBox = () => {
    const calloutHtml = `<div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #0284c7;border-radius:6px;padding:14px 18px;margin:20px 0;"><div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Notice</div><div style="font-size:13.5px;color:#334155;line-height:1.6;">Please keep your contact information up-to-date in your candidate file.</div></div>`;
    if (editorMode === "visual") {
      if (visualEditorRef.current) {
        visualEditorRef.current.focus();
        document.execCommand("insertHTML", false, calloutHtml);
        handleVisualInput();
      }
    } else {
      setBody((prev: string) => prev + "\n" + calloutHtml);
    }
  };

  const handleLoadPreset = () => {
    const preset = STAGE_PRESETS[statusKey];
    if (preset) {
      if (window.confirm(`Load recommended corporate template for "${statusKey.replace("_", " ")}"? This will replace current unsaved edits.`)) {
        setSubject(preset.subject);
        setBody(preset.body);
        if (visualEditorRef.current) {
          visualEditorRef.current.innerHTML = preset.body;
        }
        toast.success(`Loaded standard corporate template for ${statusKey.replace("_", " ")}`);
      }
    } else {
      toast.info("No preset available for this stage");
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      toast.error("Please enter a valid email address to send test preview");
      return;
    }
    setIsSendingTest(true);
    try {
      await sendTest({
        data: {
          status: statusKey,
          subject,
          html_body: body,
          test_email: testEmail.trim(),
        },
      });
      toast.success(`Test preview email dispatched to ${testEmail}! Check your inbox.`);
    } catch (e: any) {
      toast.error(e.message || "Failed to dispatch test email");
    } finally {
      setIsSendingTest(false);
    }
  };

  const mut = useMutation({
    mutationFn: () =>
      update({
        data: { status: tpl.id, subject, html_body: body, enabled },
      }),
    onSuccess: () => {
      toast.success("Template Configuration Saved Successfully!");
      qc.invalidateQueries({ queryKey: ["status-templates"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Stage Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-50/80 rounded-2xl border border-slate-200">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Stage Trigger Active
          </div>
          <div className="text-xl font-bold text-slate-900 capitalize tracking-tight">
            {tpl.id.replace("_", " ")} Notification
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automatically dispatched to applicant upon transitioning to the <span className="font-semibold text-slate-700">"{tpl.id.replace("_", " ")}"</span> stage.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLoadPreset}
            className="text-xs h-9 bg-white border-slate-200 text-slate-700 hover:text-indigo-700 hover:border-indigo-300 shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
            Load Standard Preset
          </Button>

          <label className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 cursor-pointer shadow-sm hover:border-indigo-200 transition-all">
            <span className="text-xs font-bold text-slate-700">Dispatch Automatically</span>
            <Switch checked={enabled} onCheckedChange={setEnabled} className="data-[state=checked]:bg-emerald-500" />
          </label>
        </div>
      </div>

      {/* Email Subject Line */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Email Subject Line
          </label>
          <span className="text-[11px] text-slate-500">Supports dynamic placeholders like &#123;&#123;role_applied&#125;&#125;</span>
        </div>
        <Input 
          className="h-11 text-sm font-medium bg-slate-50/50 focus:bg-white border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all rounded-xl" 
          value={subject} 
          onChange={(e) => setSubject(e.target.value)} 
          placeholder="e.g. Application Update: {{role_applied}} — Vyntyra"
        />
      </div>

      {/* Body Content Editor Section (Visual vs HTML) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Email Body Content
            </label>
            <span className="text-xs text-slate-500">
              {editorMode === "visual" 
                ? "Visual Composer: Type and format naturally like a Word document." 
                : "HTML Source Code: Direct markup payload with full tag control."}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                if (editorMode !== "visual") {
                  setEditorMode("visual");
                  setTimeout(() => {
                    if (visualEditorRef.current) visualEditorRef.current.innerHTML = body;
                  }, 10);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                editorMode === "visual" 
                  ? "bg-white text-indigo-700 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="h-3.5 w-3.5" /> Visual Editor
            </button>
            <button
              type="button"
              onClick={() => {
                if (editorMode !== "html") {
                  setEditorMode("html");
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                editorMode === "html" 
                  ? "bg-white text-indigo-700 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Code2 className="h-3.5 w-3.5" /> HTML Source
            </button>
          </div>
        </div>

        {/* Toolbar & Fast Placeholder Inserter */}
        <div className="border border-slate-200 rounded-xl bg-slate-50/70 p-2.5 space-y-2">
          {/* Quick Insert Tokens */}
          <div className="flex items-center gap-1.5 flex-wrap pb-2 border-b border-slate-200/80 text-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-indigo-500" /> Insert:
            </span>
            {TEMPLATE_VARIABLES.map((v) => (
              <Button
                key={v.key}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => insertVariable(v.key)}
                className="h-7 text-[11px] font-medium bg-white hover:bg-indigo-50 hover:text-indigo-700 border-slate-200 text-slate-700 px-2.5 rounded-md"
              >
                + {v.label}
              </Button>
            ))}
          </div>

          {/* Formatting Actions (Visible in Visual Mode) */}
          {editorMode === "visual" ? (
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => execFormat("bold")}
                title="Bold (Ctrl+B)"
                className="p-1.5 hover:bg-slate-200 rounded text-slate-700 hover:text-slate-900 transition-colors"
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => execFormat("italic")}
                title="Italic (Ctrl+I)"
                className="p-1.5 hover:bg-slate-200 rounded text-slate-700 hover:text-slate-900 transition-colors"
              >
                <Italic className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => execFormat("underline")}
                title="Underline (Ctrl+U)"
                className="p-1.5 hover:bg-slate-200 rounded text-slate-700 hover:text-slate-900 transition-colors"
              >
                <UnderlineIcon className="h-4 w-4" />
              </button>
              <div className="h-4 w-px bg-slate-300 mx-1" />
              <button
                type="button"
                onClick={() => execFormat("formatBlock", "<h2>")}
                title="Heading 2"
                className="p-1.5 hover:bg-slate-200 rounded text-slate-700 hover:text-slate-900 transition-colors font-bold text-xs"
              >
                <Heading2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => execFormat("formatBlock", "<h3>")}
                title="Heading 3"
                className="p-1.5 hover:bg-slate-200 rounded text-slate-700 hover:text-slate-900 transition-colors font-bold text-xs"
              >
                <Heading3 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => execFormat("formatBlock", "<p>")}
                title="Normal Paragraph"
                className="p-1.5 hover:bg-slate-200 rounded text-slate-700 hover:text-slate-900 transition-colors font-bold text-xs"
              >
                P
              </button>
              <div className="h-4 w-px bg-slate-300 mx-1" />
              <button
                type="button"
                onClick={() => execFormat("insertUnorderedList")}
                title="Bullet List"
                className="p-1.5 hover:bg-slate-200 rounded text-slate-700 hover:text-slate-900 transition-colors"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => execFormat("insertOrderedList")}
                title="Numbered List"
                className="p-1.5 hover:bg-slate-200 rounded text-slate-700 hover:text-slate-900 transition-colors"
              >
                <ListOrdered className="h-4 w-4" />
              </button>
              <div className="h-4 w-px bg-slate-300 mx-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={insertButtonCTA}
                className="h-7 text-xs font-semibold text-slate-700 hover:bg-slate-200 px-2 rounded"
              >
                + Corporate Button
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={insertCalloutBox}
                className="h-7 text-xs font-semibold text-slate-700 hover:bg-slate-200 px-2 rounded"
              >
                + Highlight Card
              </Button>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Editing raw HTML payload. Paragraph tags (&lt;p&gt;...&lt;/p&gt;) and inline styles are preserved.</span>
            </div>
          )}
        </div>

        {/* Editor Surfaces */}
        {editorMode === "visual" ? (
          <div
            ref={visualEditorRef}
            contentEditable
            onInput={handleVisualInput}
            onBlur={handleVisualInput}
            className="w-full min-h-[300px] p-6 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none transition-all leading-relaxed text-[15px] text-slate-800 shadow-inner prose prose-slate max-w-none [&_p]:my-3.5 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-slate-900 [&_a]:text-indigo-600 [&_ul]:my-3 [&_ul]:pl-5 [&_li]:my-1"
          />
        ) : (
          <Textarea
            ref={textareaRef}
            className="font-mono text-xs bg-slate-50/50 focus:bg-white border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all rounded-xl p-4 min-h-[300px] leading-relaxed"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        )}
      </div>

      {/* Real-Time Pixel-Accurate Email Client Preview */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Mail className="h-4 w-4 text-indigo-600" />
            Exact Email Template Preview (Recipient Client Render)
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Live 1:1 render including ISO corporate shell, logo, button, &amp; executive signature
          </span>
        </div>

        {/* Realistic Email Client Frame */}
        <div className="rounded-2xl border border-slate-200 bg-[#f1f5f9] overflow-hidden shadow-sm">
          {/* Simulated Email Client Title Bar */}
          <div className="bg-slate-200/90 border-b border-slate-300/80 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
              </div>
              <span className="text-[11px] font-bold text-slate-600 ml-2">Inbox Preview &middot; Vyntyra Careers Transmission</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">MIME: text/html &middot; TLS Encrypted</span>
          </div>

          {/* Email Headers Box */}
          <div className="bg-white border-b border-slate-200 p-4 text-xs space-y-1.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-bold text-slate-900 text-sm">
                  {renderPreviewTokens(subject)}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Today, 08:30 PM (IST)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-[11px]">
              <span className="font-semibold text-slate-700">From:</span>
              <span>Vyntyra Careers &lt;careers@vyntyraconsultancyservices.in&gt;</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-[11px]">
              <span className="font-semibold text-slate-700">To:</span>
              <span>Priya Sharma &lt;priya.sharma@example.com&gt;</span>
            </div>
          </div>

          {/* Actual Standardized Email Container */}
          <div className="p-4 sm:p-8 bg-[#f8fafc]">
            <div className="max-w-[620px] mx-auto bg-white rounded-xl border border-slate-200/90 shadow-md overflow-hidden text-left">
              {/* Email Top Header */}
              <div className="px-8 py-6 border-b border-slate-200 flex items-center gap-3">
                <img 
                  src="https://portal.vyntyraconsultancyservices.in/icon-512.png" 
                  alt="Vyntyra Icon" 
                  className="w-8 h-8 rounded-md object-contain" 
                />
                <span className="text-[17px] font-semibold text-slate-900 tracking-tight">
                  Vyntyra Consultancy Services
                </span>
              </div>

              {/* Email Body Content */}
              <div className="p-8 sm:p-10 text-slate-700 text-[15px] leading-relaxed">
                <div 
                  className="prose prose-slate max-w-none text-slate-700 leading-relaxed [&_p]:my-3.5 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-slate-900 [&_ul]:my-3 [&_ul]:pl-5 [&_li]:my-1"
                  dangerouslySetInnerHTML={{ __html: renderPreviewTokens(body) }} 
                />

                {/* Executive Signature Block */}
                <div className="mt-8 pt-5 border-t border-slate-200">
                  <p className="text-[15px] text-slate-900 m-0 mb-2">Sincerely,</p>
                  <div className="my-2">
                    <img 
                      src="https://portal.vyntyraconsultancyservices.in/signature.png" 
                      alt="Jami Eswar Anil Kumar Signature" 
                      className="w-32 h-auto block max-w-[130px]" 
                    />
                  </div>
                  <div className="text-[15px] font-bold text-slate-900 leading-tight">
                    Jami Eswar Anil Kumar
                  </div>
                  <div className="text-[13px] text-sky-600 font-semibold mt-0.5">
                    Founder &amp; Managing Director
                  </div>
                  <div className="text-[12px] text-slate-500">
                    Vyntyra Talent Acquisition &middot; Project VyNexa
                  </div>
                </div>
              </div>

              {/* Compliance & Legal Footer */}
              <div className="bg-slate-50 border-t border-slate-200 p-6 sm:p-8 text-center text-slate-500 text-xs leading-relaxed">
                <div className="text-slate-900 font-semibold text-sm mb-2">
                  Vyntyra Consultancy Services
                </div>
                
                <div className="mb-3 text-[11.5px]">
                  <a href="https://www.linkedin.com/company/vyntyra-consultancy-services" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline mx-2">LinkedIn</a>
                  <span className="text-slate-300">|</span>
                  <a href="https://www.instagram.com/vyntyraindia" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline mx-2">Instagram</a>
                  <span className="text-slate-300">|</span>
                  <a href="https://portal.vyntyraconsultancyservices.in/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline mx-2">Official Portal</a>
                </div>

                <div className="text-[11px] text-slate-500">
                  Dwaraka Nagar, Visakhapatnam - 530016, AP, India<br />
                  ISO 9001:2015 Certified &middot; MSME Registered &middot; UDYAM-AP-10-0143100
                </div>

                <div className="mt-3 text-[10.5px] text-slate-400">
                  This communication relates to your application for Project VyNexa.<br />
                  Need assistance? Email <a href="mailto:hr@vyntyraconsultancyservices.in" className="text-blue-600 hover:underline">hr@vyntyraconsultancyservices.in</a>
                </div>

                <div className="mt-3 text-[10px] text-slate-400 italic">
                  Disclaimer: This transmission contains confidential information intended solely for the recipient. If received in error, please notify the sender immediately and delete all copies.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Controls: Live Test Email & Save */}
      <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Send Test Email Module */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input 
            placeholder="Enter your email for live test..." 
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="text-xs h-10 w-64 bg-slate-50 focus:bg-white"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleSendTestEmail}
            disabled={isSendingTest}
            className="h-10 text-xs font-semibold border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 shrink-0"
          >
            {isSendingTest ? (
              <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Dispatching...</>
            ) : (
              <><Send className="mr-1.5 h-3.5 w-3.5" /> Send Test Email</>
            )}
          </Button>
        </div>

        {/* Primary Save Button */}
        <Button 
          onClick={() => mut.mutate()} 
          disabled={mut.isPending} 
          className="w-full sm:w-auto h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 rounded-xl font-bold transition-all"
        >
          {mut.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Changes...</>
          ) : (
            <><Save className="mr-2 h-4 w-4" /> Save Configuration</>
          )}
        </Button>
      </div>
    </div>
  );
}

function renderPreviewTokens(str: string) {
  if (!str) return "";
  const vars: Record<string, string> = {
    full_name: "Priya Sharma",
    role_applied: "Software Engineer Intern",
    status: "Shortlisted",
    portal_link: "https://portal.vyntyraconsultancyservices.in/track",
    application_id: "APP-2026-9481",
  };
  return str.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}
