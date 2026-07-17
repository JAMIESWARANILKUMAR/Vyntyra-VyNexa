import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getApplicationsOpen } from "@/lib/settings.functions";
import { listActiveJobPostings } from "@/lib/job-postings.functions";
import { incrementVisitorCount } from "@/lib/visitor.functions";
import { toast } from "sonner";
import {
  Search,
  Shield,
  CheckCircle2,
  Upload,
  Link as LinkIcon,
  Loader2,
  ArrowRight,
  Lock,
  Globe2,
  Building2,
  Phone,
  MapPin,
  Mail,
  X,
  ChevronRight,
  GraduationCap,
  Plus,
  Trash2,
  FileText,
  Clock,
  Menu,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { submitApplication } from "@/lib/applications.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { COLLEGES, STATES, graduationYears, type StateName } from "@/lib/colleges";
import { WorldClocks } from "@/components/world-clocks";
import { InstallPwaButton } from "@/components/install-pwa-button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Careers at Project VyNexa — Vyntyra Consultancy Services" },
      {
        name: "description",
        content:
          "Apply to Project VyNexa — a next-generation search engine by Vyntyra Consultancy Services. Secure corporate careers portal.",
      },
    ],
  }),
  component: ApplicationPage,
});

const ROLES = [
  "Software Engineer — Search Infrastructure",
  "Machine Learning Engineer — Ranking",
  "Frontend Engineer",
  "Backend Engineer",
  "DevOps / SRE",
  "Data Engineer",
  "Product Designer",
  "Product Manager",
  "Marketing / Growth",
  "Business Development",
  "Internship — Engineering",
  "Internship — Research",
  "Other",
];

const EXPERIENCE = ["0-1 years", "1-3 years", "3-5 years", "5-8 years", "8+ years"];
const AVAILABILITY = ["Immediately", "Within 15 days", "Within 30 days", "Within 60 days", "Flexible"];

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED_EXT = /\.(pdf|docx?|rtf)$/i;
const ACCEPTED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/rtf",
  "text/rtf",
]);

type ApplicationForm = {
  full_name: string;
  email: string;
  phone: string;
  role_applied: string;
  message: string;
  company: string;
  position: string;
  linkedin_url: string;
  years_experience: string;
  portfolio_url: string;
  availability: string;
  state: StateName | "";
  college: string;
  graduation_year: string;
  hod_name: string;
  hod_contact: string;
  hod_email: string;
  tp_officer_name: string;
  tp_officer_contact: string;
  tp_officer_email: string;
  job_posting_id: string;
};

type ProjectEntry = {
  title: string;
  summary: string;
  project_url: string;
  document_path: string;
  document_name: string;
  uploading?: boolean;
};

function ApplicationPage() {
  const submit = useServerFn(submitApplication);
  const fetchOpen = useServerFn(getApplicationsOpen);
  const fetchJobs = useServerFn(listActiveJobPostings);
  const incrementVisit = useServerFn(incrementVisitorCount);
  const [submitting, setSubmitting] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resumePath, setResumePath] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [resumeSize, setResumeSize] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);
  const [applicationsOpen, setApplicationsOpen] = useState(true);
  const [jobPostings, setJobPostings] = useState<any[]>([]);

  const handleStateChange = (v: string) => {
    update("state")(v);
    setForm((s: ApplicationForm) => ({ ...s, college: "" }));
  };

  const handleAgreementChange = (v: boolean | "indeterminate") => {
    setAgreed(v === true);
  };

  useEffect(() => {
    fetchOpen().then((r: { enabled: boolean }) => setApplicationsOpen(r.enabled)).catch(() => {});
    fetchJobs().then((r: any[]) => setJobPostings(r ?? [])).catch(() => {});
    incrementVisit().catch(() => {});
  }, [fetchOpen, fetchJobs, incrementVisit]);

  const [form, setForm] = useState<ApplicationForm>({
    full_name: "", email: "", phone: "", role_applied: "", message: "",
    company: "", position: "", linkedin_url: "", years_experience: "",
    portfolio_url: "", availability: "",
    state: "" as StateName | "",
    college: "",
    graduation_year: "" as string,
    hod_name: "", hod_contact: "", hod_email: "",
    tp_officer_name: "", tp_officer_contact: "", tp_officer_email: "",
    job_posting_id: "",
  });
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const update = (k: keyof ApplicationForm) => (v: string) => setForm((s: ApplicationForm) => ({ ...s, [k]: v }));

  function addProject() {
    if (projects.length >= 30) { toast.error("Maximum 30 projects"); return; }
    setProjects((p: ProjectEntry[]) => [...p, { title: "", summary: "", project_url: "", document_path: "", document_name: "" }]);
  }
  function removeProject(i: number) {
    const p = projects[i];
    if (p?.document_path) {
        supabase.storage.from("default").remove([p.document_path]).catch(() => {});
    }
    setProjects((s: ProjectEntry[]) => s.filter((_: ProjectEntry, idx: number) => idx !== i));
  }
  function updateProject(i: number, patch: Partial<ProjectEntry>) {
    setProjects((s: ProjectEntry[]) => s.map((p: ProjectEntry, idx: number) => (idx === i ? { ...p, ...patch } : p)));
  }
  async function uploadProjectDoc(i: number, file: File | null) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Project document must be under 10 MB"); return; }
    updateProject(i, { uploading: true });
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `project-docs/${new Date().getFullYear()}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safe}`;
    try {
        const { error } = await supabase.storage.from("default").upload(path, file, { contentType: file.type || "application/octet-stream" });
        if (error) throw error;
        updateProject(i, { document_path: path, document_name: file.name, uploading: false });
        toast.success("Project document uploaded");
    } catch(error: any) {
        toast.error("Upload failed: " + error.message); updateProject(i, { uploading: false }); return;
    }
  }

  async function handleResume(file: File | null) {
    if (!file) return;
    if (file.size > MAX_SIZE) { toast.error("Resume must be under 5 MB"); return; }
    if (!ACCEPTED_EXT.test(file.name)) { toast.error("Only PDF, DOC, DOCX or RTF files are accepted"); return; }
    if (file.type && !ACCEPTED_MIME.has(file.type) && !ACCEPTED_EXT.test(file.name)) {
      toast.error("Unsupported file type"); return;
    }
    setUploading(true);
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `resumes/${new Date().getFullYear()}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safe}`;
    try {
        const { error } = await supabase.storage.from("default").upload(path, file, { contentType: file.type || "application/octet-stream" });
        if (error) throw error;
        setResumePath(path);
        setResumeName(file.name);
        setResumeSize(file.size);
        toast.success("Resume uploaded securely");
    } catch (error: any) {
        toast.error("Upload failed: " + error.message); return;
    } finally {
        setUploading(false);
    }
  }

  function removeResume() {
    if (resumePath) {
        supabase.storage.from("default").remove([resumePath]).catch(() => {});
    }
    setResumePath(""); setResumeName(""); setResumeSize(0);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!agreed) { setAgreementOpen(true); return; }
    for (const k of ["full_name", "email", "phone", "role_applied"] as const) {
      if (!form[k].trim()) { toast.error("Please complete all required fields"); return; }
    }
    for (const p of projects) {
      if (!p.title.trim() || !p.summary.trim()) { toast.error("Each project needs a title and summary"); return; }
    }
    setSubmitting(true);
    try {
      const res = await submit({ data: {
        ...form,
        graduation_year: form.graduation_year ? parseInt(form.graduation_year, 10) : null,
        resume_path: resumePath,
        job_posting_id: form.job_posting_id || null,
        projects: projects.map((p: ProjectEntry) => ({
          title: p.title, summary: p.summary,
          project_url: p.project_url, document_path: p.document_path,
        })),
        agreement_accepted: true as const,
      } });
      setSuccess(res.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error((err as Error).message || "Submission failed");
    } finally { setSubmitting(false); }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar live={applicationsOpen} />
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="max-w-2xl w-full">
            <div className="rounded-md border border-border bg-card shadow-corp overflow-hidden">
              <div className="border-l-4 border-l-secondary bg-surface px-8 py-10 text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10">
                  <CheckCircle2 className="h-7 w-7 text-secondary" strokeWidth={2} />
                </div>
                <h1 className="text-3xl font-semibold text-primary tracking-tight">Application Received</h1>
                <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                  Thank you for applying to <span className="font-medium text-foreground">Project VyNexa</span>.
                  A confirmation has been dispatched to <span className="font-medium text-foreground">{form.email}</span>.
                </p>
                <div className="mt-6 inline-flex items-center gap-3 rounded-sm border border-border bg-background px-5 py-2.5 text-sm">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">Reference ID</span>
                  <span className="font-mono text-primary font-medium">{success.slice(0, 8).toUpperCase()}</span>
                </div>
                <p className="mt-6 text-xs text-muted-foreground">
                  Our Talent Acquisition team will review your profile within <span className="font-medium">5–7 business days</span>.
                </p>
              </div>
              <div className="px-8 py-5 bg-card border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
                <a href="/track" className="text-sm text-secondary font-medium hover:underline inline-flex items-center gap-1">
                  Track application status <ChevronRight className="h-4 w-4" />
                </a>
                <a href="https://vyntyraconsultancyservices.in" target="_blank" rel="noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                  Visit Vyntyra <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <UtilityBar />
      <TopBar live={applicationsOpen} />
      <Hero />
      <TrustStrip />

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 pt-6 space-y-4">
        <WorldClocks />
        <OperationsStrip />
      </div>

      <main id="form" className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="grid lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
          {/* Left rail — steps + trust */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-widest text-secondary mb-3">Application Sections</div>
                <ol className="space-y-1">
                  {[
                    { n: "01", t: "Personal Information" },
                    { n: "02", t: "Education & HOD Contacts" },
                    { n: "03", t: "Professional Background" },
                    { n: "04", t: "Portfolio & Resume" },
                    { n: "05", t: "Recent Projects" },
                    { n: "06", t: "Cover Message" },
                    { n: "07", t: "Review & Submit" },
                  ].map((s) => (
                    <li key={s.n} className="flex items-start gap-3 py-2 border-l-2 border-border pl-3 hover:border-secondary transition-colors">
                      <span className="font-mono text-[11px] text-muted-foreground mt-0.5">{s.n}</span>
                      <span className="text-sm text-foreground">{s.t}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="rounded-sm border border-border bg-surface p-4">
                <div className="flex items-center gap-2 text-xs text-secondary font-medium mb-2">
                  <Lock className="h-3.5 w-3.5" /> Data Protection
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  All submissions are encrypted in transit and at rest. Resume files are stored in a private, access-controlled vault and are accessible only to authorised HR personnel.
                </p>
              </div>
            </div>
          </aside>

          {/* Form column */}
          <div className="rounded-md border border-border bg-card shadow-corp overflow-hidden">
            <div className="border-b border-border bg-surface px-5 sm:px-8 py-5 sm:py-6">
              <div className="flex items-center gap-3">
                <div className="h-1 w-10 bg-secondary rounded-full" />
                <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-secondary">
                  Careers · Project VyNexa
                </span>
              </div>
              <h2 className="mt-3 text-xl sm:text-2xl font-semibold text-primary tracking-tight">Submit Your Application</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Fields marked with <span className="text-destructive">*</span> are required. Estimated time: 6–8 minutes.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="px-4 sm:px-8 py-6 sm:py-8 space-y-8 sm:space-y-10">
              <Section title="Personal Information" step="01">
                <div className="grid md:grid-cols-2 gap-5">
                  <Field label="Full name" required>
                    <Input value={form.full_name} onChange={(e) => update("full_name")(e.target.value)} placeholder="John Doe" />
                  </Field>
                  <Field label="Email address" required>
                    <Input type="email" value={form.email} onChange={(e) => update("email")(e.target.value)} placeholder="you@example.com" />
                  </Field>
                  <Field label="Phone number" required>
                    <Input value={form.phone} onChange={(e) => update("phone")(e.target.value)} placeholder="+91 98765 43210" />
                  </Field>
                  {jobPostings.length > 0 ? (
                    <Field label="Job Opening" required>
                      <Select value={form.job_posting_id} onValueChange={(v) => {
                        update("job_posting_id")(v);
                        const job = jobPostings.find((j: any) => j.id === v);
                        if (job) update("role_applied")(job.title);
                      }}>
                        <SelectTrigger><SelectValue placeholder="Select a job opening" /></SelectTrigger>
                        <SelectContent>
                          {jobPostings.map((j: any) => (
                            <SelectItem key={j.id} value={j.id}>
                              <div className="flex flex-col">
                                <span>{j.title}</span>
                                <span className="text-xs text-muted-foreground">{j.department} · {j.location} · {j.type}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  ) : (
                    <Field label="Role you're applying for" required>
                      <Select value={form.role_applied} onValueChange={update("role_applied")}>
                        <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                        <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                  )}
                </div>
                {jobPostings.length > 0 && form.job_posting_id && (() => {
                  const selJob = jobPostings.find((j: any) => j.id === form.job_posting_id);
                  if (!selJob) return null;
                  return (
                    <div className="mt-4 rounded-sm border border-secondary/30 bg-secondary/5 p-4">
                      <div className="text-[11px] uppercase tracking-widest text-secondary font-medium mb-2">Selected Position Details</div>
                      <div className="text-sm font-medium text-foreground">{selJob.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">{selJob.department} · {selJob.location} · {selJob.type}</div>
                      {selJob.description && <p className="text-sm text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap line-clamp-4">{selJob.description}</p>}
                      {selJob.requirements && (
                        <div className="mt-2">
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Requirements</div>
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-3">{selJob.requirements}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </Section>

              <Section title="Education & Department Contacts" step="02">
                <div className="grid md:grid-cols-2 gap-5">
                  <Field label="State">
                    <Select value={form.state} onValueChange={handleStateChange}>
                      <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                      <SelectContent>{STATES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="College / Institution">
                    <Select value={form.college} onValueChange={update("college")} disabled={!form.state}>
                      <SelectTrigger><SelectValue placeholder={form.state ? "Select college" : "Select state first"} /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        {(form.state ? COLLEGES[form.state as StateName] : []).map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Graduation year">
                    <Select value={form.graduation_year} onValueChange={update("graduation_year")}>
                      <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                      <SelectContent>{graduationYears().map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="HOD name"><Input value={form.hod_name} onChange={(e) => update("hod_name")(e.target.value)} placeholder="Dr. …" /></Field>
                  <Field label="HOD contact"><Input value={form.hod_contact} onChange={(e) => update("hod_contact")(e.target.value)} placeholder="+91 …" /></Field>
                  <Field label="HOD email"><Input type="email" value={form.hod_email} onChange={(e) => update("hod_email")(e.target.value)} placeholder="hod@college.edu" /></Field>
                  <div className="md:col-span-2 grid md:grid-cols-3 gap-5 pt-3 mt-2 border-t border-border">
                    <div className="md:col-span-3 text-[11px] uppercase tracking-widest text-muted-foreground font-medium flex items-center gap-2">
                      <GraduationCap className="h-3.5 w-3.5" /> Training & Placement (optional)
                    </div>
                    <Field label="T&P officer name"><Input value={form.tp_officer_name} onChange={(e) => update("tp_officer_name")(e.target.value)} placeholder="Prof. …" /></Field>
                    <Field label="T&P officer contact"><Input value={form.tp_officer_contact} onChange={(e) => update("tp_officer_contact")(e.target.value)} placeholder="+91 …" /></Field>
                    <Field label="T&P officer email"><Input type="email" value={form.tp_officer_email} onChange={(e) => update("tp_officer_email")(e.target.value)} placeholder="tpo@college.edu" /></Field>
                  </div>
                </div>
              </Section>

              <Section title="Professional Background" step="03">
                <div className="grid md:grid-cols-2 gap-5">
                  <Field label="Current company"><Input value={form.company} onChange={(e) => update("company")(e.target.value)} placeholder="Acme Corp" /></Field>
                  <Field label="Current position"><Input value={form.position} onChange={(e) => update("position")(e.target.value)} placeholder="Senior Engineer" /></Field>
                  <Field label="Years of experience">
                    <Select value={form.years_experience} onValueChange={update("years_experience")}>
                      <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                      <SelectContent>{EXPERIENCE.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="LinkedIn profile">
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" value={form.linkedin_url} onChange={(e) => update("linkedin_url")(e.target.value)} placeholder="https://linkedin.com/in/…" />
                    </div>
                  </Field>
                </div>
              </Section>

              <Section title="Portfolio & Resume" step="04">
                <div className="grid md:grid-cols-2 gap-5">
                  <Field label="Portfolio / GitHub URL">
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" value={form.portfolio_url} onChange={(e) => update("portfolio_url")(e.target.value)} placeholder="https://github.com/…" />
                    </div>
                  </Field>
                  <Field label="Availability to join">
                    <Select value={form.availability} onValueChange={update("availability")}>
                      <SelectTrigger><SelectValue placeholder="Select availability" /></SelectTrigger>
                      <SelectContent>{AVAILABILITY.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Resume / CV — PDF, DOC, DOCX or RTF (max 5 MB)" className="md:col-span-2">
                    {resumeName ? (
                      <div className="flex items-center justify-between gap-3 rounded-sm border border-secondary/40 bg-secondary/5 px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 flex-shrink-0 rounded-sm bg-secondary/10 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-secondary" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{resumeName}</div>
                            <div className="text-xs text-muted-foreground">
                              {(resumeSize / 1024).toFixed(0)} KB · uploaded securely
                            </div>
                          </div>
                        </div>
                        <button type="button" onClick={removeResume}
                          className="text-muted-foreground hover:text-destructive p-1" aria-label="Remove resume">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-4 rounded-sm border-2 border-dashed border-border bg-surface px-5 py-6 cursor-pointer hover:border-secondary hover:bg-secondary/5 transition-colors">
                        <div className="h-10 w-10 rounded-sm bg-secondary/10 flex items-center justify-center">
                          {uploading
                            ? <Loader2 className="h-5 w-5 text-secondary animate-spin" />
                            : <Upload className="h-5 w-5 text-secondary" />}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground">
                            {uploading ? "Uploading securely…" : "Click to upload your resume"}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            PDF, DOC, DOCX, RTF · 5 MB maximum · Encrypted & confidential
                          </div>
                        </div>
                        <input type="file" className="hidden" accept=".pdf,.doc,.docx,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/rtf"
                          onChange={(e) => handleResume(e.target.files?.[0] ?? null)} disabled={uploading} />
                      </label>
                    )}
                  </Field>
                </div>
              </Section>

              <Section title="Recent Projects (optional)" step="05">
                <div className="space-y-4">
                  {projects.length === 0 && (
                    <p className="text-sm text-muted-foreground">Add any relevant academic, personal, or professional projects. You can include a URL, document, and summary.</p>
                  )}
                  {projects.map((p, i) => (
                    <div key={i} className="rounded-sm border border-border bg-surface p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] uppercase tracking-widest text-secondary font-medium">Project {i + 1}</div>
                        <button type="button" onClick={() => removeProject(i)} className="text-muted-foreground hover:text-destructive p-1">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <Field label="Project title" required>
                          <Input value={p.title} onChange={(e) => updateProject(i, { title: e.target.value })} placeholder="e.g. Distributed Search Prototype" />
                        </Field>
                        <Field label="Project URL">
                          <Input value={p.project_url} onChange={(e) => updateProject(i, { project_url: e.target.value })} placeholder="https://…" />
                        </Field>
                        <Field label="Summary" required className="md:col-span-2">
                          <Textarea rows={3} value={p.summary} onChange={(e) => updateProject(i, { summary: e.target.value })} placeholder="Problem, approach, your role, outcome…" />
                        </Field>
                        <Field label="Document (PDF/DOC/ZIP, max 10 MB)" className="md:col-span-2">
                          {p.document_name ? (
                            <div className="flex items-center justify-between rounded-sm border border-secondary/40 bg-secondary/5 px-3 py-2 text-sm">
                              <span className="flex items-center gap-2 min-w-0"><FileText className="h-4 w-4 text-secondary" /><span className="truncate">{p.document_name}</span></span>
                              <button type="button" onClick={() => updateProject(i, { document_path: "", document_name: "" })} className="text-muted-foreground hover:text-destructive p-1"><X className="h-3.5 w-3.5" /></button>
                            </div>
                          ) : (
                            <label className="flex items-center gap-3 rounded-sm border border-dashed border-border bg-background px-3 py-2 cursor-pointer hover:border-secondary text-sm text-muted-foreground">
                              {p.uploading ? <Loader2 className="h-4 w-4 animate-spin text-secondary" /> : <Upload className="h-4 w-4 text-secondary" />}
                              <span>{p.uploading ? "Uploading…" : "Attach project document"}</span>
                              <input type="file" className="hidden" onChange={(e) => uploadProjectDoc(i, e.target.files?.[0] ?? null)} disabled={p.uploading} />
                            </label>
                          )}
                        </Field>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addProject} className="w-full">
                    <Plus className="h-4 w-4 mr-2" /> Add project {projects.length > 0 && `(${projects.length}/30)`}
                  </Button>
                </div>
              </Section>

              <Section title="Cover Message" step="06">
                <Field label="Why do you want to join Project VyNexa?">
                  <Textarea rows={5} value={form.message} onChange={(e) => update("message")(e.target.value)}
                    placeholder="Tell us briefly about your motivation, relevant experience, and what you'd bring to the team…" />
                </Field>
              </Section>

              <div className={`rounded-sm border p-5 ${agreed ? "border-secondary/40 bg-secondary/5" : "border-border bg-surface"}`}>
                <div className="flex items-start gap-3">
                  <Checkbox id="agreement" checked={agreed}
                    onCheckedChange={handleAgreementChange} className="mt-0.5" />
                  <label htmlFor="agreement" className="text-sm text-foreground leading-relaxed cursor-pointer select-none">
                    I confirm I have read and agree to the{" "}
                    <a href="/terms" target="_blank" rel="noreferrer"
                      className="text-secondary font-medium underline underline-offset-4 hover:text-primary">
                      Applicant Terms
                    </a>{" "}and{" "}
                    <a href="/privacy" target="_blank" rel="noreferrer"
                      className="text-secondary font-medium underline underline-offset-4 hover:text-primary">
                      Privacy Notice & Data Handling Policy
                    </a>
                    . I confirm all information provided is accurate to the best of my knowledge.{" "}
                    <button type="button" onClick={() => setAgreementOpen(true)}
                      className="text-muted-foreground underline underline-offset-4 hover:text-primary">
                      View full summary
                    </button>
                  </label>
                </div>
                {!agreed && (
                  <p className="mt-3 pl-7 text-[11px] text-muted-foreground">
                    Submission is disabled until you confirm the agreement above.
                  </p>
                )}
              </div>

              {!applicationsOpen && (
                <div className="rounded-sm border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                  Applications are currently paused. Please check back soon or track existing applications via the portal.
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-secondary" /> Secure submission · TLS 1.3 · ISO-aligned data handling
                </p>
                <Button type="submit" size="lg" disabled={submitting || !agreed || !applicationsOpen}
                  className="bg-primary hover:bg-secondary text-primary-foreground min-w-[220px] font-medium">
                  {submitting
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</>
                    : !applicationsOpen
                      ? <>Applications Paused</>
                      : <>Submit Application <ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
      <AgreementDialog open={agreementOpen} onOpenChange={setAgreementOpen}
        onAccept={() => { setAgreed(true); setAgreementOpen(false); }} />
    </div>
  );
}

function UtilityBar() {
  return (
    <div className="border-b border-border bg-primary text-primary-foreground/80 text-[11px] sm:text-xs">
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-6 h-8 sm:h-9 flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <span className="inline-flex items-center gap-1 sm:gap-1.5 shrink-0"><Globe2 className="h-3 w-3 shrink-0" /> IN · Global</span>
          <span className="opacity-40 hidden xs:inline sm:inline">|</span>
          <a href="mailto:hr@vyntyraconsultancyservices.in" className="inline-flex items-center gap-1 sm:gap-1.5 truncate hover:text-gold min-w-0">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">hr@vyntyraconsultancyservices.in</span>
          </a>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 ml-auto shrink-0">
          <a href="https://vyntyraconsultancyservices.in" target="_blank" rel="noreferrer" className="hover:text-gold hidden sm:inline">Vyntyra.in</a>
          <span className="opacity-40 hidden sm:inline">|</span>
          <a href="/status" className="hover:text-gold">Track</a>
          <span className="opacity-40">|</span>
          <a href="/auth" className="hover:text-gold">Employee</a>
        </div>
      </div>
    </div>
  );
}

const APPLY_PHRASES = ["Apply Now", "Interested to work on VyNexa"] as const;

function AnimatedApplyText({ className = "" }: { className?: string }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      timeoutId = setTimeout(() => {
        setIdx((i) => (i + 1) % APPLY_PHRASES.length);
        schedule();
      }, 30000);
    };
    const clear = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
    const onVisibility = () => {
      clear();
      if (!document.hidden) schedule();
    };
    schedule();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clear();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  return (
    <span className={"relative inline-block " + className}>
      <span key={idx} className="inline-block animate-fade-in whitespace-nowrap">
        {APPLY_PHRASES[idx]}
      </span>
    </span>
  );
}

function TopBar({ live = true }: { live?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="border-b border-border bg-card sticky top-0 z-40 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        <a href="/" className="flex items-center gap-3 min-w-0 shrink">
          <img src="/favicon.png" alt="Vyntyra Consultancy Services" className="h-8 sm:h-11 w-auto shrink-0" />
        </a>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {live ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-sm border border-destructive/30 bg-destructive/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-destructive">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive"></span>
              </span>
              Live · Accepting Applications
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
              Applications Paused
            </span>
          )}
          <InstallPwaButton />
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <a href="/about" className="px-3 py-2 text-muted-foreground hover:text-primary hover:bg-surface rounded-sm">About</a>
            <a href="#form" className="px-3 py-2 text-muted-foreground hover:text-primary hover:bg-surface rounded-sm">Careers</a>
            <a href="/status" className="px-3 py-2 text-muted-foreground hover:text-primary hover:bg-surface rounded-sm">Track Status</a>
            <div className="w-px h-5 bg-border mx-2" />
            <a href="#form" className="group relative inline-flex items-center gap-1.5 bg-primary hover:bg-secondary text-primary-foreground px-4 py-2 rounded-sm text-sm font-medium transition-colors overflow-hidden">
              <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out" />
              <AnimatedApplyText />
              <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </a>
          </nav>
          {/* Mobile: Apply Now + Hamburger */}
          <a
            href="#form"
            onClick={(e) => {
              if (menuOpen) {
                e.preventDefault();
                setMenuOpen(false);
                setTimeout(() => {
                  const el = document.getElementById("form");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  else window.location.hash = "form";
                }, 320);
              }
            }}
            className="group relative md:hidden inline-flex items-center gap-1 bg-primary hover:bg-secondary text-primary-foreground px-3 py-1.5 rounded-sm text-xs font-medium overflow-hidden max-w-[62vw]"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full group-active:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out" />
            <AnimatedApplyText className="truncate" />
            <ArrowRight className="h-3 w-3 shrink-0" />
          </a>
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-sm border border-border text-primary hover:bg-surface transition-colors"
          >
            <span className="relative h-5 w-5">
              <Menu className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${menuOpen ? "rotate-90 opacity-0 scale-75" : "rotate-0 opacity-100 scale-100"}`} />
              <X className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${menuOpen ? "rotate-0 opacity-100 scale-100" : "-rotate-90 opacity-0 scale-75"}`} />
            </span>
          </button>
        </div>
      </div>
      {/* Mobile menu panel */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${menuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="border-t border-border bg-card">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-3 flex flex-col text-sm">
            {live ? (
              <span className="sm:hidden inline-flex items-center gap-1.5 self-start rounded-sm border border-destructive/30 bg-destructive/10 px-2 py-1 mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-destructive">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive"></span>
                </span>
                Live · Accepting Applications
              </span>
            ) : (
              <span className="sm:hidden inline-flex items-center gap-1.5 self-start rounded-sm border border-border bg-surface px-2 py-1 mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
                Applications Paused
              </span>
            )}
            <a href="/about" onClick={() => setMenuOpen(false)} className="px-2 py-2.5 border-b border-border text-primary hover:bg-surface rounded-sm transition-colors">About</a>
            <a href="#form" onClick={() => setMenuOpen(false)} className="px-2 py-2.5 border-b border-border text-primary hover:bg-surface rounded-sm transition-colors">Careers</a>
            <a href="/status" onClick={() => setMenuOpen(false)} className="px-2 py-2.5 border-b border-border text-primary hover:bg-surface rounded-sm transition-colors">Track Status</a>
            <a href="/auth" onClick={() => setMenuOpen(false)} className="px-2 py-2.5 text-muted-foreground hover:text-primary hover:bg-surface rounded-sm transition-colors">Employee Sign-in</a>
          </div>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
      <div className="absolute inset-0 corporate-grid" />
      <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-gold/10 to-transparent hidden lg:block" />
      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 py-14 sm:py-20 lg:py-28">
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8 lg:gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-sm border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-medium text-gold uppercase tracking-[0.18em]">
              Now Hiring · Founding Team
            </div>
            <h1 className="mt-5 sm:mt-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tight">
              Build the next generation of{" "}
              <span className="text-gold">intelligent search.</span>
            </h1>
            <p className="mt-6 text-base lg:text-lg text-primary-foreground/75 max-w-2xl leading-relaxed">
              Vyntyra Consultancy Services is assembling a founding team for <span className="text-primary-foreground font-medium">Project VyNexa</span> —
              a private, intelligent search engine designed for how people actually find things today.
              Apply securely through our corporate careers portal.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#form" className="inline-flex items-center gap-2 bg-gold hover:bg-gold/90 text-gold-foreground px-6 py-3 rounded-full text-sm font-semibold transition-colors shadow-lg shadow-gold/20">
                Apply Now <ArrowRight className="h-4 w-4" />
              </a>
              <a href="/about"
                className="inline-flex items-center gap-2 border border-primary-foreground/30 hover:bg-primary-foreground/10 text-primary-foreground px-6 py-3 rounded-full text-sm font-medium transition-colors">
                About Vyntyra
              </a>
            </div>
          </div>

          {/* Right-side info card */}
          <div className="hidden lg:block">
            <div className="rounded-sm border border-primary-foreground/15 bg-primary-foreground/[0.04] backdrop-blur p-6">
              <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-gold mb-4">At a Glance</div>
              <dl className="space-y-4">
                <div className="pb-3 border-b border-primary-foreground/10">
                  <dt className="text-xs uppercase tracking-wider text-primary-foreground/60 mb-1.5">Locations</dt>
                  <dd className="text-sm font-medium leading-relaxed">
                    India — Visakhapatnam, Bengaluru, Hyderabad, Uttar Pradesh
                    <span className="text-primary-foreground/60"> · Remote</span>
                  </dd>
                </div>
                <div className="flex justify-between items-baseline pb-3 border-b border-primary-foreground/10">
                  <dt className="text-xs uppercase tracking-wider text-primary-foreground/60">Response Time</dt>
                  <dd className="text-2xl font-semibold">5–7 days</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-primary-foreground/60 mb-1.5">Data Handling</dt>
                  <dd className="text-sm font-medium leading-relaxed">
                    Secured by Cloudflare Technologies
                    <span className="block text-primary-foreground/70 mt-1">ISO-aligned · NASSCOM Verified · Registered under MSME</span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const items: Array<{ icon: typeof Globe2; label: string; value: string }> = [
    { icon: Shield, label: "Confidential Process", value: "Your application is visible only to authorised HR personnel." },
    { icon: Lock, label: "Encrypted at Rest", value: "TLS 1.3 in transit; encrypted vault for resumes." },
    { icon: Building2, label: "Merit-Based Review", value: "Equal-opportunity evaluation, transparent workflow." },
    { icon: CheckCircle2, label: "Trackable Status", value: "Automated email updates at every stage." },
  ];
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {items.map((i) => (
          <div key={i.label} className="flex items-start gap-3">
            <div className="h-9 w-9 flex-shrink-0 rounded-sm bg-secondary/10 flex items-center justify-center">
              <i.icon className="h-4.5 w-4.5 text-secondary" strokeWidth={2} />
            </div>
            <div>
              <div className="text-sm font-medium text-primary">{i.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{i.value}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function OperationsStrip() {
  const items = [
    {
      icon: MapPin,
      label: "Locations",
      value: "India · Visakhapatnam · Bengaluru · Hyderabad · Uttar Pradesh · Remote",
    },
    {
      icon: Clock,
      label: "Response Time",
      value: "5–7 business days",
    },
    {
      icon: Shield,
      label: "Data Handling",
      value: "Secured by Cloudflare · ISO-aligned · NASSCOM Verified · MSME Registered",
    },
  ];
  return (
    <div className="rounded-md border border-border bg-card">
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
        {items.map((i) => (
          <div key={i.label} className="flex items-start gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3">
            <div className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 rounded-sm bg-secondary/10 flex items-center justify-center">
              <i.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-secondary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.16em] sm:tracking-[0.18em] text-secondary font-semibold">
                {i.label}
              </div>
              <div className="text-[12px] sm:text-sm text-foreground mt-0.5 leading-snug break-words">{i.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function Section({ title, step, children }: { title: string; step: string; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-5 pb-3 border-b border-border">
        <span className="inline-flex items-center justify-center h-7 w-7 rounded-sm bg-primary text-primary-foreground text-[11px] font-semibold font-mono">
          {step}
        </span>
        <h3 className="text-base font-semibold text-primary tracking-tight">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, required, children, className = "" }: { label: string; required?: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={"space-y-1.5 " + className}>
      <Label className="text-xs font-medium text-foreground/80">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-10 sm:py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white rounded-sm p-2">
                <img src="/favicon.png" alt="Vyntyra" className="h-10 w-auto" />
              </div>
              <div>
                <div className="font-semibold text-lg leading-tight">Vyntyra Consultancy Services</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-primary-foreground/60 mt-0.5">
                  Building Project VyNexa
                </div>
              </div>
            </div>
            <p className="text-sm text-primary-foreground/70 leading-relaxed max-w-md">
              A technology consultancy engineering the next generation of intelligent search infrastructure.
              Our team spans engineering, research, product and enterprise delivery.
            </p>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-gold font-medium mb-3">Company</div>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><a href="https://vyntyraconsultancyservices.in" target="_blank" rel="noreferrer" className="hover:text-gold">About Vyntyra</a></li>
              <li><a href="#form" className="hover:text-gold">Careers</a></li>
              <li><a href="/status" className="hover:text-gold">Track Application</a></li>
              <li><a href="/auth" className="hover:text-gold">Employee Portal</a></li>
            </ul>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-gold font-medium mb-3">Contact</div>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li className="flex items-start gap-2"><Mail className="h-4 w-4 mt-0.5 text-gold/70" /> hr@vyntyraconsultancyservices.in</li>
              <li className="flex items-start gap-2"><Phone className="h-4 w-4 mt-0.5 text-gold/70" /> Contact via website</li>
              <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 text-gold/70" /> India · Global Delivery</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-primary-foreground/50">
          <div>© {new Date().getFullYear()} Vyntyra Consultancy Services. All rights reserved.</div>
          <div className="flex gap-5">
            <a href="/privacy" className="hover:text-gold">Privacy Notice</a>
            <a href="/terms" className="hover:text-gold">Applicant Terms</a>
            <a href="/about" className="hover:text-gold">About</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function AgreementDialog({ open, onOpenChange, onAccept }: { open: boolean; onOpenChange: (v: boolean) => void; onAccept: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary tracking-tight">Applicant Agreement</DialogTitle>
          <DialogDescription>Please read the terms below before submitting your application.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm text-foreground leading-relaxed">
          {[
            ["Accuracy of Information", "You confirm that all information provided in this application, including personal details, employment history, and uploaded documents, is true, complete, and accurate to the best of your knowledge. Any misrepresentation may lead to disqualification."],
            ["Data Collection & Purpose", "Vyntyra Consultancy Services collects the information you submit solely for the purpose of evaluating your candidacy for Project VyNexa. Data is stored securely on encrypted infrastructure and access is restricted to authorised talent-acquisition personnel."],
            ["Data Retention", "Application data is retained for up to 24 months to consider you for future openings unless you request earlier deletion by writing to hr@vyntyraconsultancyservices.in."],
            ["Confidentiality", "Any information regarding Project VyNexa disclosed during the recruitment process (interviews, assignments, technical discussions) is confidential and shall not be shared with third parties."],
            ["Non-Discrimination", "Vyntyra is an equal-opportunity employer. Applications are evaluated on merit, without regard to race, gender, religion, age, disability, or any protected characteristic."],
            ["Your Rights", "You have the right to access, correct, or request deletion of your personal data. Contact our data-protection team at hr@vyntyraconsultancyservices.in for any privacy requests."],
            ["Communication", "By submitting, you consent to receive application-status emails at the address provided. You will not receive marketing communications."],
          ].map(([h, p], i) => (
            <div key={h}>
              <h4 className="font-semibold text-primary mb-1">{i + 1}. {h}</h4>
              <p className="text-muted-foreground">{p}</p>
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-primary hover:bg-secondary" onClick={onAccept}>I Agree & Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
