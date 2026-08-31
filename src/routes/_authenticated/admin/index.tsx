import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  LogOut,
  FileText,
  Loader2,
  Mail,
  Phone,
  Briefcase,
  ExternalLink,
  Download,
  Clock,
  Settings2,
  FileDown,
  Filter,
  X,
  MapPin,
  Shield,
  Bell,
  BellOff,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  PenLine,
  Users,
  TrendingUp,
  ChevronRight,
  Building2,
  Send,
  ShieldCheck,
  ClipboardList,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { listApplications, updateAdminNotes, getResumeSignedUrl, regenerateInterviewQuestions, listApplicationProjects, deleteApplication, listEmployees, updateApplicantByAdmin, createApplicantByAdmin } from "@/lib/applications.functions";
import { generatePayslipPdf } from "@/lib/payslip";
import { generateNocPdf, urlToBase64 } from "@/lib/nocGenerator";
import { saveNocPdf, saveInternshipCertificatePdf, updateNocUrl } from "@/lib/noc.functions";
import { getApplicationsOpen, setApplicationsOpen, getBrandingSettings } from "@/lib/settings.functions";
import { listJobPostings, createJobPosting, updateJobPosting, toggleJobPosting, deleteJobPosting } from "@/lib/job-postings.functions";
import { listAdminNotifications, markAllNotificationsRead } from "@/lib/notifications.functions";
import { getVisitorCount } from "@/lib/visitor.functions";
import { listAllLeaveRequests, listAllFeedbacks, updateLeaveStatus, deleteStoredOfferLetterAndRegenerate, deleteStoredNocAndRegenerate, deleteStoredOfferLetter, deleteStoredNoc } from "@/lib/operations.functions";
import { Sparkles, RefreshCw, GraduationCap, FolderGit2, Link2, FileSpreadsheet, Award, MessageCircle } from "lucide-react";
import { WorldClocks } from "@/components/world-clocks";
import { InstallPwaButton } from "@/components/install-pwa-button";
import { Switch } from "@/components/ui/switch";
import { AdminInternTasksView } from "@/components/admin-intern-tasks-view";
import { SelectionEmailTrackerDialog } from "@/components/selection-email-tracker-dialog";
import { AdminB2bPlaybook } from "@/components/admin-b2b-playbook";
import {
  changeApplicationStatus,
  listStatusEvents,
  ALLOWED_TRANSITIONS,
  type AppStatus,
  scheduleSelectionEmail,
  sendBulkSelectionEmails,
  processScheduledEmails,
} from "@/lib/workflow.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Super Admin Dashboard — Vyntyra Careers" }] }),
  component: AdminDashboard,
});

const STATUS_COLORS: Record<string, string> = {
  new: "bg-secondary/15 text-secondary border-secondary/30",
  reviewing: "bg-amber-100 text-amber-800 border-amber-300",
  shortlisted: "bg-emerald-100 text-emerald-800 border-emerald-300",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
  hired: "bg-primary text-primary-foreground border-primary",
};

const STATUS_OPTIONS: (AppStatus | "all")[] = ["all", "new", "reviewing", "shortlisted", "hired", "rejected"];

const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract"];

const NOTIF_ICONS: Record<string, string> = {
  new_application: "🆕",
  status_change: "🔄",
  email_sent: "📧",
};

function AdminDashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useServerFn(listApplications);
  const fetchOpen = useServerFn(getApplicationsOpen);
  const setOpen = useServerFn(setApplicationsOpen);
  const fetchJobs = useServerFn(listJobPostings);
  const fetchNotifications = useServerFn(listAdminNotifications);
  const markAllRead = useServerFn(markAllNotificationsRead);
  const fetchVisitorCount = useServerFn(getVisitorCount);
  const triggerProcessScheduled = useServerFn(processScheduledEmails);
  const doBulkSendEmails = useServerFn(sendBulkSelectionEmails);
  
  const fetchLeaveRequests = useServerFn(listAllLeaveRequests);
  const fetchFeedbacks = useServerFn(listAllFeedbacks);
  const doUpdateLeave = useServerFn(updateLeaveStatus);

  const leavesQ = useQuery({
    queryKey: ["admin-leaves"],
    queryFn: () => fetchLeaveRequests(),
    refetchInterval: 15_000,
  });

  const feedbacksQ = useQuery({
    queryKey: ["admin-feedbacks"],
    queryFn: () => fetchFeedbacks(),
    refetchInterval: 15_000,
  });

  useEffect(() => {
    triggerProcessScheduled()
      .then((res) => {
        if (res?.processedCount && res.processedCount > 0) {
          toast.success(`Processed ${res.processedCount} scheduled selection emails!`);
          qc.invalidateQueries({ queryKey: ["applications"] });
        }
      })
      .catch((err) => console.warn("Failed to process scheduled emails:", err));
  }, []);

  const [selected, setSelected] = useState<any>(null);

  // MFA / 2FA Security states & handlers
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [mfaStatus, setMfaStatus] = useState<"checking" | "enrolled" | "unenrolled" | "enrolling">("checking");
  const [mfaQrCode, setMfaQrCode] = useState<string | null>(null);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  useEffect(() => {
    checkMfa();
  }, [showMfaSetup]);

  async function checkMfa() {
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) throw error;
      if (data && (data.currentLevel === 'aal2' || data.nextLevel === 'aal2')) {
        setMfaStatus('enrolled');
      } else {
        // List verified factors
        const { data: factors, error: factorsErr } = await supabase.auth.mfa.listFactors();
        if (factorsErr) throw factorsErr;
        const verified = factors?.totp?.find((f: any) => f.status === 'verified');
        if (verified) {
          setMfaStatus('enrolled');
        } else {
          setMfaStatus('unenrolled');
        }
      }
    } catch (err) {
      setMfaStatus('unenrolled');
    }
  }

  async function handleEnrollMfa() {
    setMfaStatus("enrolling");
    try {
      // Clean up previous unverified factors first
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors && factors.all) {
        for (const f of factors.all) {
          if (f.status === 'unverified') {
            await supabase.auth.mfa.unenroll({ factorId: f.id });
          }
        }
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "Vyntyra Careers",
        friendlyName: "Super Admin",
      });

      if (error || !data) throw error || new Error("MFA Enroll failed");
      setMfaFactorId(data.id);
      setMfaQrCode(data.totp.uri);
    } catch (err: any) {
      toast.error(err.message || "Failed to enroll MFA");
      setMfaStatus("unenrolled");
    }
  }

  async function handleVerifyMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!mfaFactorId || !mfaCode) return;
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (challenge.error) throw challenge.error;
      const verify = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.data.id,
        code: mfaCode
      });
      if (verify.error) throw verify.error;

      setMfaStatus("enrolled");
      setMfaQrCode(null);
      setMfaCode("");
      toast.success("2FA enabled successfully using Authenticator app!");
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    }
  }

  async function handleDisableMfa() {
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors && factors.all) {
        for (const f of factors.all) {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
      }
      toast.success("2FA has been disabled");
      setMfaStatus("unenrolled");
    } catch (err: any) {
      toast.error(err.message || "Failed to disable 2FA");
    }
  }

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Job posting dialog
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [selectionTrackerOpen, setSelectionTrackerOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  const { data: apps = [], isLoading, error } = useQuery({
    queryKey: ["applications"],
    queryFn: () => list(),
    refetchInterval: 15_000, // Poll every 15 seconds for live updates
  });

  // Live Supabase Realtime subscription for applications table
  useEffect(() => {
    const channel = supabase
      .channel("admin-applications-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications" },
        () => {
          qc.invalidateQueries({ queryKey: ["applications"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const openQ = useQuery({
    queryKey: ["applications-open"],
    queryFn: () => fetchOpen(),
  });
  const toggleOpen = useMutation({
    mutationFn: (enabled: boolean) => setOpen({ data: { enabled } }),
    onSuccess: (r) => {
      qc.setQueryData(["applications-open"], r);
      toast.success(r.enabled ? "Applications are now OPEN" : "Applications are now PAUSED");
    },
    onError: (e: any) => toast.error(e?.message || "Failed to update"),
  });
  const applicationsOpen = openQ.data?.enabled !== false;

  // Job postings
  const jobsQ = useQuery({
    queryKey: ["job-postings"],
    queryFn: () => fetchJobs(),
  });

  // Notifications
  const notifsQ = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => fetchNotifications(),
    refetchInterval: 60_000,
  });

  // Visitor count
  const visitorQ = useQuery({
    queryKey: ["visitor-count"],
    queryFn: () => fetchVisitorCount(),
  });

  const markAllReadMut = useMutation({
    mutationFn: () => markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast.success("All notifications marked as read");
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom).getTime() : null;
    const to = dateTo ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 : null;
    return (apps as any[]).filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      const t = new Date(a.created_at).getTime();
      if (from && t < from) return false;
      if (to && t > to) return false;
      if (q) {
        const hay = [a.full_name, a.email, a.phone, a.role_applied, a.company, a.position].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [apps, statusFilter, search, dateFrom, dateTo]);

  const hasFilters = statusFilter !== "all" || search || dateFrom || dateTo;

  // Bulk Action Helpers
  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((a: any) => a.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const changeStatusMut = useMutation({
    mutationFn: (args: { id: string; status: AppStatus; note: string }) =>
      changeApplicationStatus({ data: args }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }),
  });

  const handleBulkStatusChange = async (status: AppStatus) => {
    const note = prompt(`Enter a note for bulk updating ${selectedIds.size} applications to '${status}':`);
    if (!note) return;
    const ids = Array.from(selectedIds);
    let count = 0;
    for (const id of ids) {
      try {
        await changeStatusMut.mutateAsync({ id, status, note });
        count++;
      } catch (e) {
        console.error("Bulk update failed for", id, e);
      }
    }
    toast.success(`Successfully updated ${count} applications to ${status}`);
    setSelectedIds(new Set());
  };

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: '/auth/admin' })
  }

  function resetFilters() {
    setStatusFilter("all"); setSearch(""); setDateFrom(""); setDateTo("");
  }

  function exportCsv() {
    if (filtered.length === 0) { toast.error("No applications to export"); return; }
    const headers = [
      "ID", "Submitted", "Status", "Full Name", "Email", "Phone", "Role Applied",
      "State", "College", "Graduation Year", "HOD Name", "HOD Contact", "HOD Email",
      "T&P Officer Name", "T&P Officer Contact", "T&P Officer Email",
      "Company", "Position", "Years Experience", "Availability",
      "LinkedIn", "Portfolio", "Resume Path", "Cover Message", "Admin Notes",
    ];
    const rows = filtered.map((a: any) => [
      a.id, new Date(a.created_at).toISOString(), a.status,
      a.full_name, a.email, a.phone, a.role_applied,
      a.state ?? "", a.college ?? "", a.graduation_year ?? "",
      a.hod_name ?? "", a.hod_contact ?? "", a.hod_email ?? "",
      a.tp_officer_name ?? "", a.tp_officer_contact ?? "", a.tp_officer_email ?? "",
      a.company ?? "", a.position ?? "", a.years_experience ?? "", a.availability ?? "",
      a.linkedin_url ?? "", a.portfolio_url ?? "", a.resume_path ?? "",
      a.message ?? "", a.admin_notes ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""').replace(/\r?\n/g, " ")}"`).join(","))
      .join("\n");
    // Add UTF-8 BOM so Excel opens it correctly
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vynexa-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} application${filtered.length === 1 ? "" : "s"}`);
  }

  function exportBulkCsv() {
    if (selectedIds.size === 0) return;
    const selectedApps = filtered.filter((a: any) => selectedIds.has(a.id));
    const headers = ["ID", "Status", "Full Name", "Email", "Role Applied", "Resume Path"];
    const rows = selectedApps.map((a: any) => [a.id, a.status, a.full_name, a.email, a.role_applied, a.resume_path ?? ""]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""').replace(/\r?\n/g, " ")}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vynexa-bulk-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selectedApps.length} applications`);
    setSelectedIds(new Set());
  }

  const stats = {
    total: apps.length,
    new: apps.filter((a: any) => a.status === "new").length,
    reviewing: apps.filter((a: any) => a.status === "reviewing").length,
    shortlisted: apps.filter((a: any) => a.status === "shortlisted").length,
    hired: apps.filter((a: any) => a.status === "hired").length,
    rejected: apps.filter((a: any) => a.status === "rejected").length,
  };

  const chartData = [
    { name: 'New', count: stats.new, color: '#0ea5e9' },
    { name: 'Reviewing', count: stats.reviewing, color: '#f59e0b' },
    { name: 'Shortlisted', count: stats.shortlisted, color: '#10b981' },
    { name: 'Hired', count: stats.hired, color: '#0A1F44' },
    { name: 'Rejected', count: stats.rejected, color: '#ef4444' },
  ];

  const unreadCount = (notifsQ.data ?? []).filter((n: any) => !n.is_read).length;

  function timeAgo(dateStr: string) {
    const now = Date.now();
    const d = new Date(dateStr).getTime();
    const diff = Math.max(0, now - d);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/icon-512.png" alt="Vyntyra" className="h-8 sm:h-10 w-auto shrink-0" />
            <div className="border-l border-border pl-3 min-w-0 hidden xs:block sm:block">
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                Super Admin
              </div>
              <div className="text-sm font-semibold text-primary truncate">Vyntyra Careers</div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <InstallPwaButton />
            <Link
              to="/admin/b2b-playbook"
              className="inline-flex items-center gap-1.5 rounded-sm px-2 sm:px-3 py-1.5 text-sm text-gold hover:bg-gold/10 font-semibold"
            >
              <BookOpen className="h-4 w-4" /> <span className="hidden sm:inline">B2B Playbook</span>
            </Link>
            <Link
              to="/admin/operations"
              className="inline-flex items-center gap-1.5 rounded-sm px-2 sm:px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface"
            >
              <Users className="h-4 w-4" /> <span className="hidden sm:inline">Operations</span>
            </Link>
            <Link
              to="/admin/email-campaigns"
              className="inline-flex items-center gap-1.5 rounded-sm px-2 sm:px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface"
            >
              <Mail className="h-4 w-4" /> <span className="hidden sm:inline">Email Campaigns</span>
            </Link>
            <Link
              to="/cms"
              className="inline-flex items-center gap-1.5 rounded-sm px-2 sm:px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface"
            >
              <Settings2 className="h-4 w-4" /> <span className="hidden sm:inline">CMS</span>
            </Link>
            <Link
              to="/templates"
              className="inline-flex items-center gap-1.5 rounded-sm px-2 sm:px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface"
            >
              <Settings2 className="h-4 w-4" /> <span className="hidden sm:inline">Templates</span>
            </Link>
            <Link
              to="/admin/security"
              className="inline-flex items-center gap-1.5 rounded-sm px-2 sm:px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface"
            >
              <Shield className="h-4 w-4" /> <span className="hidden sm:inline">Security</span>
            </Link>
            <Link
              to="/admin/settings"
              className="inline-flex items-center gap-1.5 rounded-sm px-2 sm:px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface"
            >
              <Settings2 className="h-4 w-4" /> <span className="hidden sm:inline">Settings</span>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        {/* ── Hero Greeting ── */}
        <div className="relative rounded-lg overflow-hidden bg-gradient-hero text-primary-foreground mb-8 shadow-elev">
          <div className="absolute inset-0 corporate-grid" />
          <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-gold/10 to-transparent hidden lg:block" />
          <div className="relative px-6 sm:px-8 py-8 sm:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-sm border border-gold/40 bg-gold/10 px-3 py-1 text-[10px] font-medium text-gold uppercase tracking-[0.18em] mb-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
                  Super Admin Dashboard
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight leading-tight">
                  Hello, <span className="text-gold">Super Admin</span>
                </h1>
                <p className="text-lg sm:text-xl text-primary-foreground/80 mt-1">
                  @ <span className="font-medium text-primary-foreground">Vyntyra Consultancy Services</span>
                </p>
                <p className="text-sm text-primary-foreground/60 mt-3 max-w-xl">
                  {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  {" · "}
                  {stats.total} total applications · {stats.new} new · {stats.shortlisted} shortlisted
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="text-right hidden sm:block">
                  <div className="text-5xl font-bold tracking-tight">{stats.total}</div>
                  <div className="text-xs uppercase tracking-widest text-primary-foreground/60 mt-1">Total Applications</div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    asChild
                    className="bg-gold hover:bg-gold/90 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-1.5 border-0"
                  >
                    <Link to="/admin/b2b-playbook">
                      <BookOpen className="h-4 w-4" /> B2B Sales Playbook
                    </Link>
                  </Button>

                  <Button
                    onClick={() => setSelectionTrackerOpen(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 border-0"
                  >
                    <Mail className="h-4 w-4 text-gold" /> Selection Emails
                  </Button>

                  <Button
                    asChild
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 border-0"
                  >
                    <Link to="/admin/operations">
                      <ClipboardList className="h-4 w-4" /> Operations & Tasks
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <WorldClocks />
        </div>

        <div className="rounded-md border border-border bg-card shadow-corp p-5 mb-8">
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-secondary mb-4">At a Glance</div>
          <div className="grid md:grid-cols-3 gap-5">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 flex-shrink-0 rounded-sm bg-secondary/10 flex items-center justify-center">
                <MapPin className="h-4.5 w-4.5 text-secondary" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Locations</div>
                <div className="text-sm font-medium text-foreground leading-snug">
                  India — Visakhapatnam, Bengaluru, Hyderabad, Uttar Pradesh
                  <span className="text-muted-foreground"> · Remote</span>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 flex-shrink-0 rounded-sm bg-secondary/10 flex items-center justify-center">
                <Clock className="h-4.5 w-4.5 text-secondary" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Response Time</div>
                <div className="text-2xl font-semibold text-foreground">5–7 days</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 flex-shrink-0 rounded-sm bg-secondary/10 flex items-center justify-center">
                <Shield className="h-4.5 w-4.5 text-secondary" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Data Handling</div>
                <div className="text-sm font-medium text-foreground leading-snug">
                  Secured by Cloudflare Technologies
                  <span className="block text-muted-foreground mt-0.5">ISO-aligned · NASSCOM Verified · Registered under MSME</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── B2B Cold Email & Pitch Script Playbook Preview Card ── */}
        <div className="rounded-lg border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl p-5 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-gold" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/30">
                    B2B Revenue Engine
                  </span>
                  <span className="text-xs text-slate-400">4 Targeted Sectors</span>
                </div>
                <h3 className="text-base font-bold text-white">
                  B2B Cold Email & Pitch Script Playbook
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  High-converting B2B cold email templates and 45-second phone/walk-in pitch scripts targeting Restaurants, Schools & Colleges, Salons & Spas, and Furniture Showrooms.
                </p>
              </div>
            </div>
            <Button
              asChild
              className="bg-gold hover:bg-gold/90 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-2 shrink-0 border-0"
            >
              <Link to="/admin/b2b-playbook">
                Open Full Playbook <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Public Application Form Card */}
          <div className="rounded-md border border-border bg-card shadow-corp p-4 sm:p-5 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className={`mt-0.5 h-9 w-9 rounded-sm flex items-center justify-center shrink-0 ${applicationsOpen ? "bg-destructive/10" : "bg-muted"}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${applicationsOpen ? "bg-destructive animate-pulse" : "bg-muted-foreground/50"}`} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-secondary">Public Application Form</div>
                <div className="text-sm font-semibold text-primary mt-0.5 truncate">
                  {applicationsOpen ? "LIVE · Accepting" : "Paused · Closed"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                  Toggling updates the public form instantly.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-muted-foreground">{applicationsOpen ? "On" : "Off"}</span>
              <Switch
                checked={applicationsOpen}
                disabled={openQ.isLoading || toggleOpen.isPending}
                onCheckedChange={(v) => toggleOpen.mutate(v)}
              />
            </div>
          </div>

          {/* Two-Factor Authentication Card */}
          <div className="rounded-md border border-border bg-card shadow-corp p-4 sm:p-5 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5 h-9 w-9 rounded-sm flex items-center justify-center bg-gold/10 shrink-0">
                <Shield className="h-4.5 w-4.5 text-gold" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-secondary">Super Admin 2FA</div>
                <div className="text-sm font-semibold text-primary mt-0.5 truncate">
                  {mfaStatus === "checking" ? "Checking Status..." : mfaStatus === "enrolled" ? "2FA Enabled" : "2FA Disabled"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                  {mfaStatus === "enrolled" ? "Account is secured with TOTP." : "Enhance account security using authenticator."}
                </div>
              </div>
            </div>
            <div className="shrink-0">
              {mfaStatus === "checking" ? (
                <Loader2 className="h-4 w-4 animate-spin text-gold" />
              ) : mfaStatus === "enrolled" ? (
                <Button 
                  onClick={handleDisableMfa} 
                  variant="outline" 
                  size="sm"
                  className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-9 font-semibold text-xs tracking-wider uppercase px-3 bg-transparent border hover:border-red-500"
                >
                  REMOVE 2FA
                </Button>
              ) : (
                <Button 
                  asChild
                  size="sm"
                  className="bg-gold hover:bg-gold/90 text-primary font-bold shadow-[0_0_10px_rgba(212,175,55,0.1)] h-9 text-xs tracking-wider uppercase px-3 border-0"
                >
                  <Link to="/admin/security" className="hover:no-underline">ADD 2FA</Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats Grid & Analytics ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2 rounded-md border border-border bg-card shadow-corp p-5 flex flex-col justify-center">
             <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-secondary mb-4">Pipeline Analytics</div>
             <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-elev)' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Total" value={stats.total} onClick={() => setStatusFilter("all")} />
            <Stat label="New" value={stats.new} tone="secondary" onClick={() => setStatusFilter("new")} />
            <Stat label="Reviewing" value={stats.reviewing} tone="amber" onClick={() => setStatusFilter("reviewing")} />
            <Stat label="Shortlisted" value={stats.shortlisted} tone="emerald" onClick={() => setStatusFilter("shortlisted")} />
            <Stat label="Hired" value={stats.hired} tone="primary" onClick={() => setStatusFilter("hired")} />
            <Stat label="Rejected" value={stats.rejected} tone="destructive" onClick={() => setStatusFilter("rejected")} />
          </div>
        </div>

        {/* ── Notifications Panel ── */}
        <div className="rounded-md border border-border bg-card shadow-corp mb-8 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-secondary" />
              <span className="text-sm font-semibold text-primary">Notifications</span>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => markAllReadMut.mutate()} disabled={markAllReadMut.isPending} className="text-xs">
                <BellOff className="h-3.5 w-3.5 mr-1.5" /> Mark all read
              </Button>
            )}
          </div>
          <div className="max-h-[280px] overflow-y-auto divide-y divide-border">
            {notifsQ.isLoading ? (
              <div className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-secondary" /></div>
            ) : (notifsQ.data ?? []).length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No notifications yet. They'll appear here when applications are submitted or statuses change.
              </div>
            ) : (
              (notifsQ.data ?? []).map((n: any) => (
                <div key={n.id} className={`px-5 py-3 flex items-start gap-3 text-sm transition-colors ${n.is_read ? "opacity-60" : "bg-secondary/[0.03]"}`}>
                  <span className="text-lg leading-none mt-0.5 shrink-0">{NOTIF_ICONS[n.type] ?? "🔔"}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground">{n.title}</div>
                    <div className="text-muted-foreground text-xs mt-0.5 leading-relaxed">{n.message}</div>
                  </div>
                  <div className="text-[10px] text-muted-foreground shrink-0 mt-0.5 whitespace-nowrap">{timeAgo(n.created_at)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Job Postings Management ── */}
        <JobPostingsSection
          jobs={jobsQ.data ?? []}
          isLoading={jobsQ.isLoading}
          apps={apps}
          onCreateNew={() => { setEditingJob(null); setJobDialogOpen(true); }}
          onEdit={(j: any) => { setEditingJob(j); setJobDialogOpen(true); }}
        />

        {/* ── Applications Section ── */}
        <div className="mb-8 mt-8">
          <h2 className="text-2xl font-semibold text-primary tracking-tight">Applications</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review candidate submissions for Project VyNexa. Status changes require a note and email the applicant automatically.
          </p>
        </div>

        {/* Filters bar */}
        <div className="rounded-md border border-border bg-card shadow-corp p-4 mb-4">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-end gap-3">
            <div className="col-span-2 sm:flex-1 sm:min-w-[220px]">
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Search</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-9" placeholder="Name, email, phone, role, company…" />
              </div>
            </div>
            <div className="sm:w-[160px]">
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s === "all" ? "All statuses" : s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-[150px]">
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">From</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1" />
            </div>
            <div className="sm:w-[150px]">
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">To</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1" />
            </div>
            <div className="flex gap-2 ml-auto">
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
                  <X className="h-4 w-4 mr-1.5" /> Clear
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200"
                onClick={async () => {
                  const confirmBulk = window.confirm("Are you sure you want to send selection emails and activate accounts for ALL applications marked as 'Hired'?");
                  if (!confirmBulk) return;
                  const loadingToast = toast.loading("Sending bulk selection emails...");
                  try {
                    const res = await doBulkSendEmails();
                    toast.dismiss(loadingToast);
                    if (res?.sentCount) {
                      toast.success(`Successfully sent selection emails to ${res.sentCount} selected interns!`);
                      qc.invalidateQueries({ queryKey: ["applications"] });
                    } else {
                      toast.info("No unsent hired applications found.");
                    }
                  } catch (err: any) {
                    toast.dismiss(loadingToast);
                    toast.error(err.message || "Failed to dispatch bulk emails");
                  }
                }}
              >
                <Send className="h-4 w-4 mr-1.5" /> Send Bulk Selection
              </Button>
              <Button variant="outline" size="sm" onClick={exportCsv}>
                <FileDown className="h-4 w-4 mr-1.5" /> Export All
              </Button>
              <Button
                variant="default"
                size="sm"
                className="bg-primary hover:bg-secondary text-primary-foreground font-semibold flex items-center gap-1.5"
                onClick={() => setAddMemberOpen(true)}
              >
                <Plus className="h-4 w-4" /> Add Member
              </Button>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Filter className="h-3 w-3" />
              Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
              <span className="font-medium text-foreground">{apps.length}</span> applications
            </div>
          </div>
          
          {/* Bulk Actions Toolbar */}
          {selectedIds.size > 0 && (
            <div className="mt-4 p-3 bg-secondary/5 border border-secondary/20 rounded-md flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="text-sm font-medium text-secondary">
                {selectedIds.size} applicant{selectedIds.size > 1 ? 's' : ''} selected
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" className="h-8 text-xs bg-white" onClick={() => handleBulkStatusChange('reviewing')}>
                  Mark Reviewing
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200" onClick={() => handleBulkStatusChange('shortlisted')}>
                  Shortlist
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs bg-destructive/5 text-destructive hover:bg-destructive/10 border-destructive/20" onClick={() => handleBulkStatusChange('rejected')}>
                  Reject
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs ml-2" onClick={exportBulkCsv}>
                  <Download className="h-3 w-3 mr-1" /> Export Selected
                </Button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive mb-6">
            {(error as Error).message.includes("Forbidden")
              ? "Your account does not have admin access. Ask a platform admin to grant your user the admin role."
              : (error as Error).message}
          </div>
        )}

        <div className="rounded-md border border-border bg-card shadow-corp overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-secondary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {apps.length === 0 ? "No applications yet." : "No applications match your filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 w-10">
                      <Checkbox 
                        checked={filtered.length > 0 && selectedIds.size === filtered.length}
                        onCheckedChange={toggleAll}
                        className="rounded-[4px] border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </th>
                    <th className="px-6 py-3 font-medium">Candidate</th>
                    <th className="px-6 py-3 font-medium">Role</th>
                    <th className="px-6 py-3 font-medium">Contact</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Applied</th>
                    <th className="px-6 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a: any) => (
                    <tr
                      key={a.id}
                      className={`border-b border-border last:border-0 hover:bg-surface cursor-pointer transition-colors ${selectedIds.has(a.id) ? 'bg-secondary/5' : ''}`}
                      onClick={(e) => {
                        // Don't open dialog if clicking checkbox
                        if ((e.target as HTMLElement).closest('.checkbox-cell')) return;
                        setSelected(a);
                      }}
                    >
                      <td className="px-4 py-4 checkbox-cell" onClick={(e) => e.stopPropagation()}>
                         <Checkbox 
                           checked={selectedIds.has(a.id)}
                           onCheckedChange={() => toggleOne(a.id)}
                           className="rounded-[4px] border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                         />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{a.full_name}</div>
                        <div className="text-xs text-muted-foreground">{a.years_experience || "—"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{a.role_applied}</div>
                        {a.sub_domain && (
                          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Sub-Domain: {a.sub_domain}
                          </div>
                        )}
                        {!a.sub_domain && a.domain && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Domain: {a.domain}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        <div>{a.email}</div>
                        <div>{a.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize " +
                            (STATUS_COLORS[a.status] || "")
                          }
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm">View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Leaves and Feedbacks ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 mt-8">
          {/* Leave Requests */}
          <div className="rounded-md border border-border bg-card shadow-corp flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-secondary" />
                <span className="text-sm font-semibold text-primary">Leave Requests</span>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-y-auto max-h-[400px] space-y-3">
              {leavesQ.isLoading ? (
                <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : leavesQ.data?.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center p-4">No leave requests found.</div>
              ) : (
                leavesQ.data?.map((l: any) => (
                  <div key={l.id} className="border border-border rounded-lg p-3 text-sm flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{l.profiles?.full_name || 'Unknown User'}</div>
                        <div className="text-xs text-muted-foreground">{new Date(l.start_date).toLocaleDateString()} to {new Date(l.end_date).toLocaleDateString()}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${l.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : l.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-amber-100 text-amber-800'}`}>{l.status}</span>
                    </div>
                    <div className="text-muted-foreground text-xs mt-1 bg-surface p-2 rounded">{l.reason}</div>
                    {l.status === 'pending' && (
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={() => {
                          doUpdateLeave({ data: { id: l.id, status: 'approved' } })
                            .then(() => { 
                              toast.success('Approved'); 
                              qc.invalidateQueries({queryKey: ['admin-leaves']}); 
                            })
                            .catch((err: any) => {
                              toast.error(err.message || 'Failed to approve leave');
                            });
                        }} className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs">Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => {
                          doUpdateLeave({ data: { id: l.id, status: 'rejected' } })
                            .then(() => { 
                              toast.success('Rejected'); 
                              qc.invalidateQueries({queryKey: ['admin-leaves']}); 
                            })
                            .catch((err: any) => {
                              toast.error(err.message || 'Failed to reject leave');
                            });
                        }} className="h-7 text-xs">Reject</Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Feedbacks */}
          <div className="rounded-md border border-border bg-card shadow-corp flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-secondary" />
                <span className="text-sm font-semibold text-primary">Feedbacks</span>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-y-auto max-h-[400px] space-y-3">
              {feedbacksQ.isLoading ? (
                <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : feedbacksQ.data?.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center p-4">No feedbacks found.</div>
              ) : (
                feedbacksQ.data?.map((f: any) => (
                  <div key={f.id} className="border border-border rounded-lg p-3 text-sm flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div className="font-semibold text-xs text-muted-foreground">{f.user_id}</div>
                      <div className="text-[10px] text-muted-foreground">{new Date(f.created_at).toLocaleString()}</div>
                    </div>
                    <div className="text-foreground bg-surface p-3 rounded-md border border-border shadow-inner text-sm whitespace-pre-wrap">
                      {f.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Visitor Count Footer ── */}
        <div className="mt-10 mb-4">
          <div className="rounded-md border border-border bg-card shadow-corp p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-sm bg-secondary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Public Page Visitors</div>
                <div className="text-xs text-muted-foreground mt-0.5">Total visits to the careers landing page</div>
              </div>
            </div>
            <div className="text-right">
              {visitorQ.isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-secondary" />
              ) : (
                <div className="text-3xl font-bold text-primary tracking-tight">
                  {(visitorQ.data?.count ?? 0).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <ApplicationDialog app={selected} onClose={() => setSelected(null)} />
      <JobPostingDialog
        open={jobDialogOpen}
        onClose={() => { setJobDialogOpen(false); setEditingJob(null); }}
        editing={editingJob}
      />
      <SelectionEmailTrackerDialog
        open={selectionTrackerOpen}
        onClose={() => setSelectionTrackerOpen(false)}
      />
      <AddMemberDialog
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
      />

    </div>
  );
}

/* ── Job Postings Section ── */
function JobPostingsSection({
  jobs,
  isLoading,
  apps,
  onCreateNew,
  onEdit,
}: {
  jobs: any[];
  isLoading: boolean;
  apps: any[];
  onCreateNew: () => void;
  onEdit: (j: any) => void;
}) {
  const qc = useQueryClient();
  const toggleFn = useServerFn(toggleJobPosting);
  const deleteFn = useServerFn(deleteJobPosting);

  const toggleMut = useMutation({
    mutationFn: (id: string) => toggleFn({ data: { id } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["job-postings"] });
      toast.success(r.is_active ? "Job posting activated" : "Job posting deactivated");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-postings"] });
      toast.success("Job posting deleted");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  function appCountForJob(jobId: string) {
    return (apps as any[]).filter((a: any) => a.job_posting_id === jobId).length;
  }

  return (
    <div className="rounded-md border border-border bg-card shadow-corp overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-secondary" />
          <span className="text-sm font-semibold text-primary">Job Postings</span>
          <span className="text-xs text-muted-foreground">({jobs.length})</span>
        </div>
        <Button size="sm" onClick={onCreateNew} className="bg-primary hover:bg-secondary">
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Post New Job
        </Button>
      </div>
      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-secondary" /></div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No job postings yet. Create your first job opening to start receiving targeted applications.</p>
          </div>
        ) : (
          jobs.map((j: any) => (
            <div key={j.id} className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 ${!j.is_active ? "opacity-50" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground truncate">{j.title}</span>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${j.is_active ? "border-emerald-300 bg-emerald-100 text-emerald-800" : "border-border bg-muted text-muted-foreground"}`}>
                    {j.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                  <span>{j.department}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location}</span>
                  <span>{j.type}</span>
                  {j.salary_range && <span className="text-secondary font-medium">{j.salary_range}</span>}
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{appCountForJob(j.id)} applications</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => toggleMut.mutate(j.id)} disabled={toggleMut.isPending} title={j.is_active ? "Deactivate" : "Activate"}>
                  {j.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onEdit(j)} title="Edit">
                  <PenLine className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  if (confirm("Delete this job posting? Applications linked to it will keep their data.")) deleteMut.mutate(j.id);
                }} disabled={deleteMut.isPending} title="Delete" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ── Job Posting Create/Edit Dialog ── */
function JobPostingDialog({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: any }) {
  const qc = useQueryClient();
  const createFn = useServerFn(createJobPosting);
  const updateFn = useServerFn(updateJobPosting);

  const [form, setForm] = useState({
    title: "", department: "", location: "Remote", type: "Full-time",
    description: "", requirements: "", salary_range: "",
  });

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title ?? "",
        department: editing.department ?? "",
        location: editing.location ?? "Remote",
        type: editing.type ?? "Full-time",
        description: editing.description ?? "",
        requirements: editing.requirements ?? "",
        salary_range: editing.salary_range ?? "",
      });
    } else {
      setForm({ title: "", department: "", location: "Remote", type: "Full-time", description: "", requirements: "", salary_range: "" });
    }
  }, [editing, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        await updateFn({ data: { id: editing.id, ...form } });
        return { id: editing.id };
      } else {
        const res = await createFn({ data: form });
        return { id: res.id };
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-postings"] });
      toast.success(editing ? "Job posting updated" : "Job posting created");
      onClose();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const u = (k: string) => (v: string) => setForm((s) => ({ ...s, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary tracking-tight">
            {editing ? "Edit Job Posting" : "Post New Job Opening"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Job Title *</label>
              <Input className="mt-1.5" value={form.title} onChange={(e) => u("title")(e.target.value)} placeholder="e.g. Frontend Engineer" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Department *</label>
              <Input className="mt-1.5" value={form.department} onChange={(e) => u("department")(e.target.value)} placeholder="e.g. Engineering" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Location</label>
              <Input className="mt-1.5" value={form.location} onChange={(e) => u("location")(e.target.value)} placeholder="Remote" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Type</label>
              <Select value={form.type} onValueChange={u("type")}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {JOB_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Salary Range (optional)</label>
              <Input className="mt-1.5" value={form.salary_range} onChange={(e) => u("salary_range")(e.target.value)} placeholder="e.g. ₹8–12 LPA" />
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Job Description *</label>
            <Textarea className="mt-1.5" rows={5} value={form.description} onChange={(e) => u("description")(e.target.value)}
              placeholder="Describe the role, responsibilities, and what the candidate will work on…" />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Requirements (optional)</label>
            <Textarea className="mt-1.5" rows={4} value={form.requirements} onChange={(e) => u("requirements")(e.target.value)}
              placeholder="Skills, qualifications, and experience needed…" />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !form.title.trim() || !form.department.trim() || form.description.trim().length < 10}
              className="bg-primary hover:bg-secondary"
            >
              {mutation.isPending
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                : editing ? "Update Posting" : "Publish Job Opening"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, tone = "default", onClick }: { label: string; value: number; tone?: string; onClick?: () => void }) {
  const toneColor: Record<string, string> = {
    default: "text-primary",
    secondary: "text-secondary",
    amber: "text-amber-600",
    emerald: "text-emerald-600",
    primary: "text-primary",
    destructive: "text-destructive",
  };
  return (
    <div 
      onClick={onClick}
      className={`rounded-md border border-border bg-card p-5 shadow-corp select-none transition-all duration-200 ${onClick ? "cursor-pointer hover:bg-surface hover:border-gold/30 hover:shadow-elev active:scale-95" : ""}`}
    >
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">{label}</div>
      <div className={"mt-2 text-3xl font-semibold tracking-tight " + (toneColor[tone] || "text-primary")}>{value}</div>
    </div>
  );
}

/* ── Custom WhatsApp Message / Group Dispatcher Modal ── */
function CustomWhatsAppModal({
  open,
  onClose,
  recipientName,
  recipientPhone,
  recipientEmail,
  applicationId,
}: {
  open: boolean;
  onClose: () => void;
  recipientName: string;
  recipientPhone?: string | null;
  recipientEmail?: string | null;
  applicationId?: string | null;
}) {
  const defaultGroupUrl = "https://chat.whatsapp.com/FXsC4CT1hVRHvKzGH0k5y5";
  const [targetType, setTargetType] = useState<"group" | "direct">("group");
  const [customPhone, setCustomPhone] = useState(recipientPhone || "");
  const [message, setMessage] = useState(
    `Hello ${recipientName || "Candidate"}!\n\nWelcome to Project VyNexa at Vyntyra Consultancy Services. Please join our official WhatsApp Community Group for updates, mentoring sessions, and announcements:\n👉 ${defaultGroupUrl}\n\nFeel free to reach out if you have any questions!\n\nBest regards,\nVyntyra Consultancy Services Team`
  );

  const presets = [
    {
      title: "Join Official WhatsApp Group",
      text: `Hello ${recipientName || "Candidate"}!\n\nWelcome to Project VyNexa at Vyntyra Consultancy Services. Please join our official WhatsApp Community Group for onboarding, mentoring, and team updates:\n👉 ${defaultGroupUrl}\n\nBest regards,\nVyntyra Team`,
    },
    {
      title: "Offer Letter & NOC Ready",
      text: `Dear ${recipientName || "Candidate"},\n\nCongratulations! Your official Offer Letter and NOC verification document have been generated and updated on your Project VyNexa portal.\n\nPlease log in to review and download your documents. Also join the official WhatsApp group here: ${defaultGroupUrl}\n\nBest regards,\nVyntyra Consultancy Services`,
    },
    {
      title: "Task Review & Feedback Notice",
      text: `Hi ${recipientName || "Candidate"},\n\nYour recent task deliverable has been reviewed by your mentor on the Project VyNexa portal. Please check the feedback and remarks in your Intern Dashboard.\n\nKeep up the great work!\nVyntyra Directorate`,
    },
    {
      title: "Urgent Meeting / Sync Alert",
      text: `Urgent Alert for ${recipientName || "Candidate"}:\n\nA team sync has been scheduled. Please join our WhatsApp Group (${defaultGroupUrl}) or check your Intern Dashboard for meeting coordinates.\n\nVyntyra Consultancy Services`,
    },
  ];

  const handleSend = () => {
    let url = "";
    if (targetType === "direct" && customPhone) {
      const cleanPhone = customPhone.replace(/[^0-9]/g, "");
      url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    } else {
      url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    }
    window.open(url, "_blank");
    toast.success("Opening WhatsApp with custom message!");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-700 font-bold">
            <MessageCircle className="h-5 w-5 text-emerald-600" />
            Send Custom WhatsApp Message
          </DialogTitle>
          <DialogDescription>
            Send WhatsApp message to official group or directly to candidate with one click.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={targetType === "group" ? "default" : "outline"}
              size="sm"
              className={targetType === "group" ? "bg-emerald-700 text-white hover:bg-emerald-800 font-semibold" : ""}
              onClick={() => setTargetType("group")}
            >
              📢 Official Group Link
            </Button>
            <Button
              type="button"
              variant={targetType === "direct" ? "default" : "outline"}
              size="sm"
              className={targetType === "direct" ? "bg-emerald-700 text-white hover:bg-emerald-800 font-semibold" : ""}
              onClick={() => setTargetType("direct")}
            >
              👤 Direct Message
            </Button>
          </div>

          {targetType === "direct" && (
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Candidate WhatsApp Number (with country code):</label>
              <Input
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="+91 9390515106"
                className="text-xs h-8"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Quick Template Presets:</label>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMessage(p.text)}
                  className="px-2.5 py-1 text-[11px] rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 transition-colors font-medium text-slate-700"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Message Content:</label>
            <Textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="text-xs font-mono"
            />
          </div>

          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-900 flex items-center justify-between gap-2">
            <span className="truncate">Official Group: <strong className="font-mono">https://chat.whatsapp.com/FXsC4CT1hVRHvKzGH0k5y5</strong></span>
            <a
              href={defaultGroupUrl}
              target="_blank"
              rel="noreferrer"
              className="underline font-bold text-emerald-700 hover:text-emerald-900 shrink-0"
            >
              Open Link
            </a>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-sm"
              onClick={handleSend}
            >
              <Send className="h-3.5 w-3.5" /> Open & Send via WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ApplicationDialog({ app, onClose }: { app: any; onClose: () => void }) {
  const qc = useQueryClient();
  const changeStatus = useServerFn(changeApplicationStatus);
  const saveNotes = useServerFn(updateAdminNotes);
  const listEvents = useServerFn(listStatusEvents);
  const signed = useServerFn(getResumeSignedUrl);
  const regenAi = useServerFn(regenerateInterviewQuestions);
  const doRegenOfferLetter = useServerFn(deleteStoredOfferLetterAndRegenerate);
  const doRegenNoc = useServerFn(deleteStoredNocAndRegenerate);
  const doDeleteOfferLetter = useServerFn(deleteStoredOfferLetter);
  const doDeleteNocDoc = useServerFn(deleteStoredNoc);

  const [status, setStatus] = useState<AppStatus>((app?.status as AppStatus) ?? "new");
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState(app?.admin_notes ?? "");
  const [meetLink, setMeetLink] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [interviewerName, setInterviewerName] = useState("");
  const [interviewerId, setInterviewerId] = useState("");
  const [ccEmail, setCcEmail] = useState("");
  const [salary, setSalary] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [aiText, setAiText] = useState<string | null>(app?.interview_questions ?? null);
  const [regenerating, setRegenerating] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [payslipOpen, setPayslipOpen] = useState(false);
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
  const [isRegeneratingOffer, setIsRegeneratingOffer] = useState(false);
  const [isRegeneratingNoc, setIsRegeneratingNoc] = useState(false);

  const [profileExists, setProfileExists] = useState(false);
  const [scheduledEmail, setScheduledEmail] = useState<any>(null);
  const [scheduleTime, setScheduleTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const triggerSchedule = useServerFn(scheduleSelectionEmail);
  const doSaveNocPdf = useServerFn(saveNocPdf);
  const doUpdateNocUrl = useServerFn(updateNocUrl);
  const doSaveCertificatePdf = useServerFn(saveInternshipCertificatePdf);

  useEffect(() => {
    if (app && app.status === "hired") {
      supabase.from("profiles")
        .select("id")
        .eq("email", app.email)
        .maybeSingle()
        .then(({ data }) => {
          setProfileExists(!!data);
        });

      supabase.from("scheduled_emails")
        .select("*")
        .eq("application_id", app.id)
        .maybeSingle()
        .then(({ data }) => {
          setScheduledEmail(data);
          if (data?.send_at) {
            setScheduleTime(new Date(data.send_at).toISOString().slice(0, 16));
          }
        });
    }
  }, [app?.id, app?.status]);

  async function handleRegenerateOfferLetter() {
    if (!app) return;
    setIsRegeneratingOffer(true);
    const lToast = toast.loading("Regenerating Offer Letter in 1-Click...");
    try {
      await doRegenOfferLetter({ data: { profileId: app.id, email: app.email } });
      toast.dismiss(lToast);
      toast.success("Offer Letter regenerated successfully!");
      qc.invalidateQueries({ queryKey: ["applications"] });
    } catch (e: any) {
      toast.dismiss(lToast);
      toast.error("Failed to regenerate offer letter: " + e.message);
    } finally {
      setIsRegeneratingOffer(false);
    }
  }

  async function handleRegenerateNoc() {
    if (!app) return;
    setIsRegeneratingNoc(true);
    const lToast = toast.loading("Regenerating NOC Certificate in 1-Click...");
    try {
      await doRegenNoc({ data: { profileId: app.id, email: app.email } });
      toast.dismiss(lToast);
      toast.success("NOC Certificate regenerated successfully!");
      qc.invalidateQueries({ queryKey: ["applications"] });
    } catch (e: any) {
      toast.dismiss(lToast);
      toast.error("Failed to regenerate NOC: " + e.message);
    } finally {
      setIsRegeneratingNoc(false);
    }
  }

  async function handleDownloadNoc() {
    const loadingToast = toast.loading("Generating customized NOC Certificate...");
    try {
      let photoBase64: string | null = null;
      const photoUrl = app.profile_photo_url || app.avatar_url || app.photo_url || null;
      if (photoUrl) {
        photoBase64 = await urlToBase64(photoUrl, 180, 220, false);
      }

      let sigUrl = "/signature.png";
      let logoUrl = "/icon-512.png";
      try {
        const branding = await getBrandingSettings();
        if (branding.founder_signature_url) sigUrl = branding.founder_signature_url;
        if (branding.vyntyra_logo_url) logoUrl = branding.vyntyra_logo_url;
      } catch (e) {
        console.warn("Using default signature & logo:", e);
      }

      const logoBase64 = await urlToBase64(logoUrl, 160, 160, false);
      const signatureBase64 = await urlToBase64(sigUrl, 260, 80, true);

      const verificationUrl = `https://careers.vyntyraconsultancyservices.in/verify?id=${app.id}`;
      const QRCode = (await import("qrcode")).default;
      const qrBase64 = await QRCode.toDataURL(verificationUrl, { margin: 1, color: { dark: '#0f172a', light: '#ffffff' } });

      const selectionDate = new Date();
      const calcStartDate = new Date(selectionDate.getTime() + 4 * 24 * 60 * 60 * 1000);
      const formattedStartDate = calcStartDate.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

      const doc = generateNocPdf({
        fullName: app.full_name,
        email: app.email,
        phone: app.phone,
        applicationId: app.id,
        college: app.college || "Academic Institution",
        domain: app.domain || "Technology & Software",
        subDomain: app.sub_domain || "Full Stack Web Development",
        internshipStartDate: formattedStartDate,
        profilePhotoUrl: photoBase64,
        qrCodeBase64: qrBase64,
        logoBase64: logoBase64,
        signatureBase64: signatureBase64,
        hodName: app.hod_name,
      });

      doc.save(`NOC_${app.full_name.replace(/\s+/g, "_")}_Vyntyra.pdf`);

      // Auto-replace previous NOC file in storage
      const pdfBlob = doc.output("blob");
      const filepath = `nocs/${app.id}_NOC.pdf`;

      let uploadSuccess = false;
      try {
        const { error: storageError } = await supabase.storage
          .from("default")
          .upload(filepath, pdfBlob, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (!storageError) {
          const { data: { publicUrl } } = supabase.storage.from("default").getPublicUrl(filepath);
          await doUpdateNocUrl({ data: { applicationId: app.id, publicUrl } });
          uploadSuccess = true;
        }
      } catch (clientUploadErr) {
        console.warn("Client storage upload failed, using server fallback:", clientUploadErr);
      }

      if (!uploadSuccess) {
        const pdfDataUri = doc.output("datauristring");
        try {
          await doSaveNocPdf({ data: { applicationId: app.id, pdfBase64: pdfDataUri } });
        } catch (e) {
          console.warn("Failed to auto-replace NOC in storage:", e);
        }
      }

      toast.dismiss(loadingToast);
      toast.success("NOC Certificate generated & updated in storage!");
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error("Failed to generate NOC PDF: " + err.message);
    }
  }

  async function handleDownloadInternshipCertificate() {
    const loadingToast = toast.loading("Generating Internship Completion Certificate...");
    try {
      const internId = app.intern_id || `VY-INT-${app.id.slice(0, 6).toUpperCase()}`;
      const verificationUrl = `https://careers.vyntyraconsultancyservices.in/verify?id=${internId}`;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verificationUrl)}`;
      const qrCodeBase64 = await urlToBase64(qrApiUrl);

      const { generateInternshipCertificatePdf } = await import("@/lib/certificateGenerator");
      const startDateStr = app.created_at ? new Date(app.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "12 Jun 2026";
      const endDateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      const doc = generateInternshipCertificatePdf({
        candidateName: app.full_name,
        internId,
        domainName: app.domain || "Technology & Software",
        subDomainName: app.sub_domain || "Full Stack Web Development",
        startDate: startDateStr,
        completionDate: endDateStr,
        issueDate: endDateStr,
        qrCodeBase64,
      });

      doc.save(`Internship_Certificate_${app.full_name.replace(/\s+/g, "_")}.pdf`);

      // Auto-replace previous Certificate file in storage
      const pdfDataUri = doc.output("datauristring");
      try {
        await doSaveCertificatePdf({ data: { applicationId: app.id, pdfBase64: pdfDataUri } });
      } catch (e) {
        console.warn("Failed to auto-replace Certificate in storage:", e);
      }

      toast.dismiss(loadingToast);
      toast.success("Internship Completion Certificate generated & updated in storage!");
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error("Failed to generate certificate: " + err.message);
    }
  }

  const isPdf = !!app?.resume_path && /\.pdf$/i.test(app.resume_path);

  useEffect(() => {
    if (app) {
      setStatus(app.status);
      setNote("");
      setNotes(app.admin_notes ?? "");
      setAiText(app.interview_questions ?? null);
      setResumeUrl(null);
      setMeetLink(app.meet_link || "");
      setMeetingTime(app.meeting_time ? new Date(app.meeting_time).toISOString().slice(0, 16) : "");
      setInterviewerName(app.interviewer_name || "");
      setInterviewerId(app.interviewer_id || "");
      setCcEmail("");
      setSalary(app.salary || "");
      setJoiningDate(app.joining_date || "");
      setJobLocation(app.job_location || "");
      if (app.resume_path) {
        signed({ data: { path: app.resume_path } })
          .then((r) => setResumeUrl(r.url))
          .catch(() => {});
      }
    }
  }, [app?.id]);

  const currentStatus = (app?.status as AppStatus) ?? "new";
  const options: AppStatus[] = ["new", "reviewing", "interview_scheduled", "shortlisted", "finalised", "selected", "rejected", "hired"];

  const events = useQuery({
    queryKey: ["status-events", app?.id],
    queryFn: () => listEvents({ data: { applicationId: app.id } }),
    enabled: !!app,
  });

  const projectsList = useServerFn(listApplicationProjects);
  const projects = useQuery({
    queryKey: ["app-projects", app?.id],
    queryFn: () => projectsList({ data: { id: app.id } }),
    enabled: !!app,
  });

  const fetchEmployees = useServerFn(listEmployees);
  const employeesQ = useQuery({
    queryKey: ["employees-list"],
    queryFn: () => fetchEmployees(),
  });
  const employees = employeesQ.data || [];

  const statusMut = useMutation({
    mutationFn: () => changeStatus({
      data: {
        id: app.id,
        status,
        note,
        meetLink: status === "interview_scheduled" && meetLink ? btoa(unescape(encodeURIComponent(meetLink))) : null,
        meetingTime: status === "interview_scheduled" && meetingTime ? new Date(meetingTime).toISOString() : null,
        interviewerId: status === "interview_scheduled" ? interviewerId : null,
        interviewerName: status === "interview_scheduled" ? (employees.find((e: any) => e.id === interviewerId)?.full_name || "") : null,
        ccEmail: ccEmail || null,
        salary: status === "hired" ? salary : null,
        joiningDate: status === "hired" ? joiningDate : null,
        jobLocation: status === "hired" ? jobLocation : null,
      }
    }),
    onSuccess: () => {
      toast.success(
        status === currentStatus
          ? "Note added to timeline"
          : "Status updated — applicant notified",
      );
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["status-events", app.id] });
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
      setNote("");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const notesMut = useMutation({
    mutationFn: () => saveNotes({ data: { id: app.id, admin_notes: notes } }),
    onSuccess: () => {
      toast.success("Notes saved");
      qc.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to save notes"),
  });

  const deleteApp = useServerFn(deleteApplication);
  const delMut = useMutation({
    mutationFn: () => deleteApp({ data: { id: app.id } }),
    onSuccess: () => {
      toast.success("Application deleted");
      qc.invalidateQueries({ queryKey: ["applications"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to delete application"),
  });

  async function regenerate() {
    setRegenerating(true);
    try {
      const { text } = await regenAi({ data: { id: app.id } });
      setAiText(text);
      qc.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Interview questions regenerated");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRegenerating(false);
    }
  }

  if (!app) return null;

  const isTerminal = currentStatus === "hired" || currentStatus === "rejected";

  return (
    <Dialog open={!!app} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <DialogTitle className="text-xl font-bold tracking-tight text-primary">
              {app.full_name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2">
              <span>Applied for <strong className="text-foreground">{app.role_applied || "Position"}</strong></span>
              <span>•</span>
              <span>{new Date(app.created_at).toLocaleDateString()}</span>
            </DialogDescription>
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${app.status === 'hired' ? 'bg-emerald-100 text-emerald-800' : 'bg-secondary/15 text-secondary'}`}>
                Status: {app.status}
              </span>
              {app.sub_domain && (
                <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold px-2 py-0.5 rounded-md">
                  Sub-Domain: {app.sub_domain}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap -mt-1 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
              className="text-foreground hover:bg-muted"
            >
              <PenLine className="h-4 w-4 mr-1.5" />
              Edit Applicant
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerateOfferLetter}
              disabled={isRegeneratingOffer}
              className="bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-300 font-semibold"
              title="Delete stored Offer Letter & Regenerate in 1-Click"
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isRegeneratingOffer ? "animate-spin" : ""}`} />
              Delete & Gen Offer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerateNoc}
              disabled={isRegeneratingNoc}
              className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-300 font-semibold"
              title="Delete stored NOC & Regenerate in 1-Click"
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isRegeneratingNoc ? "animate-spin" : ""}`} />
              Delete & Gen NOC
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWhatsAppOpen(true)}
              className="bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600 font-bold shadow-sm"
              title="Send custom message or official group invite via WhatsApp"
            >
              <MessageCircle className="h-4 w-4 mr-1.5" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPayslipOpen(true)}
              className="bg-slate-900 text-white hover:bg-slate-800 border-slate-900"
            >
              <FileSpreadsheet className="h-4 w-4 mr-1.5 text-emerald-400" />
              Payslip PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm("Are you sure you want to delete this application? This action cannot be undone.")) {
                  delMut.mutate();
                }
              }}
              disabled={delMut.isPending}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoRow icon={Mail} label="Email" value={app.email} />
            <InfoRow icon={Phone} label="Phone" value={app.phone} />
            <InfoRow label="Opportunity Type" value={app.opportunity_type ? <span className="font-semibold text-secondary">{app.opportunity_type}</span> : "—"} />
            <InfoRow label="Domain / Specialization" value={app.domain || "—"} />
            <InfoRow label="Sub-Domain Track" value={app.sub_domain ? <span className="font-semibold text-emerald-600 dark:text-emerald-400">{app.sub_domain}</span> : "—"} />
            <InfoRow icon={Briefcase} label="Company" value={app.company || "—"} />
            <InfoRow icon={Briefcase} label="Position" value={app.position || "—"} />
            <InfoRow label="Experience" value={app.years_experience || "—"} />
            <InfoRow label="Availability" value={app.availability || "—"} />
            {app.profile_photo_url && (
              <div className="col-span-2 flex items-center gap-3 p-3 bg-secondary/5 border border-secondary/20 rounded-md">
                <img src={app.profile_photo_url} alt={app.full_name} className="h-12 w-12 rounded-full object-cover border border-border shadow-sm" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-primary">Candidate Profile Photo (Dashboard Avatar)</div>
                  <a href={app.profile_photo_url} target="_blank" rel="noreferrer" className="text-xs text-secondary underline truncate block mt-0.5">{app.profile_photo_url}</a>
                </div>
              </div>
            )}
            {app.linkedin_url && (
              <InfoRow icon={ExternalLink} label="LinkedIn" value={
                <a href={app.linkedin_url} target="_blank" rel="noreferrer" className="text-secondary underline">Open</a>
              } />
            )}
            {app.portfolio_url && (
              <InfoRow icon={ExternalLink} label="Portfolio" value={
                <a href={app.portfolio_url} target="_blank" rel="noreferrer" className="text-secondary underline">Open</a>
              } />
            )}
            {app.message && (
              <div className="col-span-2">
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block mb-1">Cover Letter / Message</span>
                <div className="bg-secondary/5 border border-secondary/20 rounded-md p-3 text-sm text-foreground whitespace-pre-wrap">
                  {app.message}
                </div>
              </div>
            )}
          </div>

          {app.status === "interview_scheduled" && (
            <div className="rounded-md border border-border bg-muted/20 p-4 space-y-2">
              <div className="text-sm font-semibold text-primary">Scheduled Interview Details</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <InfoRow label="Interviewer" value={app.interviewer_name || "—"} />
                <InfoRow label="Meeting Time" value={app.meeting_time ? new Date(app.meeting_time).toLocaleString() : "—"} />
                <InfoRow label="Meeting Link" value={app.meet_link ? <a href={app.meet_link} target="_blank" rel="noreferrer" className="text-secondary underline break-all">{app.meet_link}</a> : "—"} />
              </div>
              {(app.interview_summary || app.interview_remarks) && (
                <div className="border-t border-border/50 pt-2 mt-2 space-y-2">
                  <div className="text-[11px] font-semibold text-primary uppercase tracking-wider">Interviewer Remarks</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground uppercase font-medium">Summary</span>
                      <p className="mt-1 text-slate-700 whitespace-pre-wrap">{app.interview_summary}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground uppercase font-medium">Remarks / Recommendation</span>
                      <p className="mt-1 text-slate-700 whitespace-pre-wrap">{app.interview_remarks}</p>
                    </div>
                  </div>
                  {app.interview_feedback_submitted_at && (
                    <div className="text-[9px] text-muted-foreground italic text-right mt-1">
                      Submitted on {new Date(app.interview_feedback_submitted_at).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {(app.state || app.college || app.graduation_year || app.hod_name || app.tp_officer_name) && (
            <div className="rounded-md border border-border bg-surface p-4">
              <div className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <GraduationCap className="h-4 w-4" /> Education & Department Contacts
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <InfoRow label="State" value={app.state || "—"} />
                <InfoRow label="College" value={app.college || "—"} />
                <InfoRow label="Graduation" value={app.graduation_year ?? "—"} />
                <InfoRow label="HOD" value={app.hod_name || "—"} />
                <InfoRow label="HOD contact" value={app.hod_contact || "—"} />
                <InfoRow label="HOD email" value={app.hod_email || "—"} />
                <InfoRow label="T&P officer" value={app.tp_officer_name || "—"} />
                <InfoRow label="T&P contact" value={app.tp_officer_contact || "—"} />
                <InfoRow label="T&P email" value={app.tp_officer_email || "—"} />
              </div>
            </div>
          )}

          {(projects.data?.length ?? 0) > 0 && (
            <div className="rounded-md border border-border bg-surface">
              <div className="px-4 py-3 border-b border-border text-sm font-semibold text-primary flex items-center gap-2">
                <FolderGit2 className="h-4 w-4" /> Candidate Projects ({projects.data!.length})
              </div>
              <div className="divide-y divide-border">
                {projects.data!.map((p: any) => (
                  <div key={p.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-medium text-foreground">{p.title}</div>
                      <div className="flex items-center gap-3 text-xs">
                        {p.project_url && (
                          <a href={p.project_url} target="_blank" rel="noreferrer" className="text-secondary hover:underline inline-flex items-center gap-1">
                            <Link2 className="h-3 w-3" /> URL
                          </a>
                        )}
                        {p.document_url && (
                          <a href={p.document_url} target="_blank" rel="noreferrer" className="text-secondary hover:underline inline-flex items-center gap-1">
                            <Download className="h-3 w-3" /> Document
                          </a>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {app.resume_path && (
            <div className="rounded-md border border-border bg-surface overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="text-sm font-semibold text-primary flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Resume
                  <span className="text-xs font-normal text-muted-foreground">
                    · {app.resume_path.split("/").pop()}
                  </span>
                </div>
                {resumeUrl && (
                  <a href={resumeUrl} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-secondary hover:text-primary font-medium">
                    <Download className="h-3.5 w-3.5" /> Open in new tab
                  </a>
                )}
              </div>
              {resumeUrl ? (
                isPdf ? (
                  <iframe
                    src={resumeUrl + "#toolbar=1&view=FitH"}
                    title="Resume preview"
                    className="w-full h-[520px] border-0 bg-white"
                  />
                ) : (
                  <div className="p-6 text-sm text-muted-foreground text-center">
                    Inline preview available only for PDF files. Use "Open in new tab" to view/download.
                  </div>
                )
              ) : (
                <div className="p-6 flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-secondary" />
                </div>
              )}
            </div>
          )}

          {/* AI Interview Questions */}
          <div className="rounded-md border border-border bg-surface overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="text-sm font-semibold text-primary flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" /> AI-Generated Interview Kit
              </div>
              <Button size="sm" variant="ghost" onClick={regenerate} disabled={regenerating}>
                {regenerating
                  ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating…</>
                  : <><RefreshCw className="h-3.5 w-3.5 mr-1.5" /> {aiText ? "Regenerate" : "Generate"}</>}
              </Button>
            </div>
            <div className="p-4 max-h-[420px] overflow-y-auto">
              {aiText ? (
                <div className="prose prose-sm max-w-none text-sm whitespace-pre-wrap text-foreground leading-relaxed">
                  {aiText}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-6">
                  {regenerating
                    ? "Analysing resume and generating questions…"
                    : "No AI-generated questions yet. Click Generate to analyse the resume and produce a tailored interview kit."}
                </div>
              )}
            </div>
          </div>

          {app.message && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">Cover message</div>
              <div className="rounded-sm border border-border bg-surface p-4 text-sm whitespace-pre-wrap">
                {app.message}
              </div>
            </div>
          )}

          {app.status === "hired" && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50/30 p-5 space-y-4">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                <GraduationCap className="h-5 w-5 text-emerald-600" /> 
                Selection Email & Portal Activation Hub
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This applicant has been selected. You can now activate their intern account and dispatch their welcome pack containing their login details, premium verification NOC, and Offer Letter.
              </p>

              {profileExists ? (
                <div className="bg-emerald-100/50 border border-emerald-200 text-emerald-800 text-xs rounded-lg p-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <strong>Intern Profile Active:</strong> Account has been fully activated and credentials sent.
                  </div>
                </div>
              ) : scheduledEmail && scheduledEmail.status === "pending" ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0 text-amber-600 animate-pulse" />
                    <strong>Selection Email Scheduled:</strong> Will be dispatched on <strong>{new Date(scheduledEmail.send_at).toLocaleString()}</strong>.
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-xs border-amber-300 text-amber-800 bg-white hover:bg-amber-50"
                    disabled={isScheduling}
                    onClick={async () => {
                      setIsScheduling(true);
                      try {
                        const { error } = await supabase.from("scheduled_emails").delete().eq("id", scheduledEmail.id);
                        if (error) throw error;
                        setScheduledEmail(null);
                        toast.success("Schedule cancelled successfully.");
                      } catch (err: any) {
                        toast.error(err.message || "Failed to cancel schedule");
                      } finally {
                        setIsScheduling(false);
                      }
                    }}
                  >
                    Cancel Schedule
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Schedule Dispatch Date & Time</label>
                    <Input
                      type="datetime-local"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="bg-white border-slate-200"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 h-9"
                      disabled={isScheduling}
                      onClick={async () => {
                        setIsScheduling(true);
                        try {
                          await triggerSchedule({ data: { applicationId: app.id } });
                          toast.success("Selection Email & Welcome Pack dispatched successfully!");
                          setProfileExists(true);
                          qc.invalidateQueries({ queryKey: ["applications"] });
                        } catch (err: any) {
                          toast.error(err.message || "Failed to send selection email");
                        } finally {
                          setIsScheduling(false);
                        }
                      }}
                    >
                      <Send className="h-3.5 w-3.5" /> Send Selection Email Now
                    </Button>

                    <Button 
                      size="sm"
                      variant="outline"
                      className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold gap-1.5 h-9"
                      disabled={isScheduling || !scheduleTime}
                      onClick={async () => {
                        setIsScheduling(true);
                        try {
                          const date = new Date(scheduleTime);
                          await triggerSchedule({ data: { applicationId: app.id, sendAt: date.toISOString() } });
                          toast.success(`Selection email scheduled for ${date.toLocaleString()}`);
                          
                          const { data } = await supabase.from("scheduled_emails").select("*").eq("application_id", app.id).maybeSingle();
                          setScheduledEmail(data);
                        } catch (err: any) {
                          toast.error(err.message || "Failed to schedule selection email");
                        } finally {
                          setIsScheduling(false);
                        }
                      }}
                    >
                      <Clock className="h-3.5 w-3.5" /> Schedule Welcome Pack
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="rounded-md border border-border bg-surface p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-semibold text-primary">Change status</div>
                <div className="text-xs text-muted-foreground">
                  Current: <span className="capitalize font-medium text-foreground">{currentStatus}</span>
                  
                </div>
              </div>
              <Link to="/templates" className="text-xs text-secondary underline">
                Edit email templates
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Next status</label>
                <Select value={status} onValueChange={(v) => setStatus(v as AppStatus)} >
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {options.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s} {s === currentStatus && "(current)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">CC Email (Optional)</label>
                <Input 
                  className="mt-1.5" 
                  value={ccEmail} 
                  onChange={(e) => setCcEmail(e.target.value)} 
                  placeholder="interviewer@example.com" 
                />
              </div>
            </div>

            {status === "interview_scheduled" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border/50 pt-4">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Assigned Interviewer *</label>
                  <Select value={interviewerId} onValueChange={setInterviewerId}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select interviewer..." /></SelectTrigger>
                    <SelectContent>
                      {employees.map((e: any) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.full_name || e.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Meeting Time *</label>
                  <Input 
                    required
                    type="datetime-local"
                    className="mt-1.5" 
                    value={meetingTime} 
                    onChange={(e) => setMeetingTime(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Google Meet / Team Link *</label>
                  <Input 
                    required
                    type="url"
                    className="mt-1.5" 
                    value={meetLink} 
                    onChange={(e) => setMeetLink(e.target.value)} 
                    placeholder="https://meet.google.com/..." 
                  />
                </div>
              </div>
            )}

            {status === "hired" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border/50 pt-4 bg-muted/10 p-3 rounded-md">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Monthly CTC / Annual Salary *</label>
                  <Input 
                    required
                    className="mt-1.5 bg-background" 
                    value={salary} 
                    onChange={(e) => setSalary(e.target.value)} 
                    placeholder="e.g. ₹8,00,000 per annum"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Joining Date *</label>
                  <Input 
                    required
                    type="date"
                    className="mt-1.5 bg-background" 
                    value={joiningDate} 
                    onChange={(e) => setJoiningDate(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Job Location *</label>
                  <Input 
                    required
                    className="mt-1.5 bg-background" 
                    value={jobLocation} 
                    onChange={(e) => setJobLocation(e.target.value)} 
                    placeholder="e.g. Bangalore / Remote"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Note (required · logged to timeline)
              </label>
              <Textarea className="mt-1.5" rows={2} value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Why this change? e.g. 'Passed initial screen — schedule technical round.'" />
            </div>

            <div className="flex justify-end">
              <Button onClick={() => statusMut.mutate()}
                disabled={statusMut.isPending || note.trim().length < 3 }
                className="bg-primary hover:bg-secondary">
                {statusMut.isPending
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                  : status === currentStatus ? "Add note" : `Move to ${status} & email applicant`}
              </Button>
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5 font-medium">
              <Clock className="h-3 w-3" /> Timeline
            </div>
            {events.isLoading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : (events.data?.length ?? 0) === 0 ? (
              <div className="text-sm text-muted-foreground">
                No status changes yet. Application submitted {new Date(app.created_at).toLocaleString()}.
              </div>
            ) : (
              <ol className="space-y-2">
                {events.data!.map((e: any) => (
                  <li key={e.id} className="rounded-sm border border-border bg-card p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        <span className="capitalize">{e.from_status ?? "—"}</span> →{" "}
                        <span className="capitalize text-primary">{e.to_status}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(e.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-muted-foreground mt-1 whitespace-pre-wrap">{e.note}</div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="pt-4 border-t border-border">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Internal notes (private to admins)
            </label>
            <Textarea className="mt-1.5" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div className="flex justify-end mt-2">
              <Button variant="outline" size="sm" onClick={() => notesMut.mutate()} disabled={notesMut.isPending}>
                {notesMut.isPending ? "Saving…" : "Save notes"}
              </Button>
            </div>
          </div>
        </div>

        <EditApplicantDialog app={app} open={editOpen} onClose={() => setEditOpen(false)} />
        <PayslipModalDialog app={app} open={payslipOpen} onClose={() => setPayslipOpen(false)} />
        <CustomWhatsAppModal
          open={whatsAppOpen}
          onClose={() => setWhatsAppOpen(false)}
          recipientName={app.full_name}
          recipientPhone={app.phone}
          recipientEmail={app.email}
          applicationId={app.id}
        />
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: any;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 font-medium">
        {Icon && <Icon className="h-3 w-3" />} {label}
      </div>
      <div className="mt-1 text-foreground">{value}</div>
    </div>
  );
}

/* ── Admin Edit Applicant Dialog ── */
function EditApplicantDialog({ app, open, onClose }: { app: any; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const updateAppMut = useServerFn(updateApplicantByAdmin);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    role_applied: "",
    domain: "",
    sub_domain: "",
    college: "",
    state: "",
    graduation_year: "",
    availability: "",
    status: "new",
    admin_notes: "",
    profile_photo_url: "",
    certificate_url: "",
  });

  useEffect(() => {
    if (app) {
      setFormData({
        full_name: app.full_name || "",
        email: app.email || "",
        phone: app.phone || "",
        role_applied: app.role_applied || "",
        domain: app.domain || "",
        sub_domain: app.sub_domain || "",
        college: app.college || "",
        state: app.state || "",
        graduation_year: app.graduation_year ? String(app.graduation_year) : "",
        availability: app.availability || "",
        status: app.status || "new",
        admin_notes: app.admin_notes || "",
        profile_photo_url: app.profile_photo_url || "",
        certificate_url: app.certificate_url || "",
      });
    }
  }, [app]);

  const saveMut = useMutation({
    mutationFn: () => updateAppMut({
      data: {
        id: app.id,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        role_applied: formData.role_applied,
        domain: formData.domain || null,
        sub_domain: formData.sub_domain || null,
        college: formData.college || null,
        state: formData.state || null,
        graduation_year: formData.graduation_year ? parseInt(formData.graduation_year, 10) : null,
        availability: formData.availability || null,
        status: formData.status,
        admin_notes: formData.admin_notes || null,
        profile_photo_url: formData.profile_photo_url || null,
        certificate_url: formData.certificate_url || null,
      }
    }),
    onSuccess: () => {
      toast.success("Applicant details updated successfully!");
      qc.invalidateQueries({ queryKey: ["applications"] });
      onClose();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (!app) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary tracking-tight font-semibold flex items-center gap-2">
            <PenLine className="h-5 w-5 text-secondary" /> Edit Applicant Application
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); saveMut.mutate(); }} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Full Name *</label>
              <Input className="mt-1" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Email Address *</label>
              <Input className="mt-1" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Phone Number *</label>
              <Input className="mt-1" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Role Applied *</label>
              <Input className="mt-1" value={formData.role_applied} onChange={(e) => setFormData({ ...formData, role_applied: e.target.value })} required />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Domain Track</label>
              <Input className="mt-1" placeholder="e.g. Technology & Software" value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })} />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Sub-Domain Specialization</label>
              <Input className="mt-1" placeholder="e.g. Full Stack Web Development" value={formData.sub_domain} onChange={(e) => setFormData({ ...formData, sub_domain: e.target.value })} />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">College / University</label>
              <Input className="mt-1" placeholder="e.g. Andhra University" value={formData.college} onChange={(e) => setFormData({ ...formData, college: e.target.value })} />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">State</label>
              <Input className="mt-1" placeholder="e.g. Andhra Pradesh" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Graduation Year</label>
              <Input className="mt-1" type="number" placeholder="2026" value={formData.graduation_year} onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })} />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Internship Start Date / Availability</label>
              <Input className="mt-1" placeholder="e.g. 2026-08-15" value={formData.availability} onChange={(e) => setFormData({ ...formData, availability: e.target.value })} />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["new", "reviewing", "interview_scheduled", "shortlisted", "finalised", "selected", "rejected", "hired"].map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Profile Photo URL</label>
              <Input className="mt-1" placeholder="https://..." value={formData.profile_photo_url} onChange={(e) => setFormData({ ...formData, profile_photo_url: e.target.value })} />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Certificate URL</label>
              <Input className="mt-1" placeholder="https://..." value={formData.certificate_url} onChange={(e) => setFormData({ ...formData, certificate_url: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">Admin Notes / Remarks</label>
            <Textarea className="mt-1" rows={3} value={formData.admin_notes} onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saveMut.isPending}>
              {saveMut.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving Changes…</> : "Save Applicant Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Admin Add Member Dialog ── */
function AddMemberDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const createApplicantMut = useServerFn(createApplicantByAdmin);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    role_applied: "Intern",
    domain: "Technology & Software",
    sub_domain: "Full Stack Web Development",
    college: "",
    state: "",
    graduation_year: "",
    availability: "",
    status: "hired",
    admin_notes: "",
    profile_photo_url: "",
    certificate_url: "",
  });

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      role_applied: "Intern",
      domain: "Technology & Software",
      sub_domain: "Full Stack Web Development",
      college: "",
      state: "",
      graduation_year: "",
      availability: "",
      status: "hired",
      admin_notes: "",
      profile_photo_url: "",
      certificate_url: "",
    });
  };

  const createMut = useMutation({
    mutationFn: () => createApplicantMut({
      data: {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        role_applied: formData.role_applied,
        domain: formData.domain || null,
        sub_domain: formData.sub_domain || null,
        college: formData.college || null,
        state: formData.state || null,
        graduation_year: formData.graduation_year ? parseInt(formData.graduation_year, 10) : null,
        availability: formData.availability || null,
        status: formData.status,
        admin_notes: formData.admin_notes || null,
        profile_photo_url: formData.profile_photo_url || null,
        certificate_url: formData.certificate_url || null,
      }
    }),
    onSuccess: () => {
      toast.success("New member added successfully!");
      qc.invalidateQueries({ queryKey: ["applications"] });
      resetForm();
      onClose();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary tracking-tight font-semibold flex items-center gap-2">
            <Plus className="h-5 w-5 text-secondary" /> Add New Member (Direct Entry)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Full Name *</label>
              <Input className="mt-1" placeholder="e.g. Jamie Eswar" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Email Address *</label>
              <Input className="mt-1" type="email" placeholder="e.g. name@domain.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Phone Number *</label>
              <Input className="mt-1" placeholder="e.g. +91 98765 43210" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Designation / Role Applied *</label>
              <Input className="mt-1" placeholder="e.g. Intern, Web Developer" value={formData.role_applied} onChange={(e) => setFormData({ ...formData, role_applied: e.target.value })} required />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Domain Track</label>
              <Input className="mt-1" placeholder="e.g. Technology & Software" value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })} />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Sub-Domain Specialization</label>
              <Input className="mt-1" placeholder="e.g. Full Stack Web Development" value={formData.sub_domain} onChange={(e) => setFormData({ ...formData, sub_domain: e.target.value })} />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">College / University</label>
              <Input className="mt-1" placeholder="e.g. Andhra University" value={formData.college} onChange={(e) => setFormData({ ...formData, college: e.target.value })} />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">State</label>
              <Input className="mt-1" placeholder="e.g. Andhra Pradesh" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Graduation Year</label>
              <Input className="mt-1" type="number" placeholder="2026" value={formData.graduation_year} onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })} />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Internship Start Date / Availability</label>
              <Input className="mt-1" placeholder="e.g. 2026-08-15" value={formData.availability} onChange={(e) => setFormData({ ...formData, availability: e.target.value })} />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["new", "reviewing", "interview_scheduled", "shortlisted", "finalised", "selected", "rejected", "hired"].map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Profile Photo URL</label>
              <Input className="mt-1" placeholder="https://..." value={formData.profile_photo_url} onChange={(e) => setFormData({ ...formData, profile_photo_url: e.target.value })} />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Certificate URL</label>
              <Input className="mt-1" placeholder="https://..." value={formData.certificate_url} onChange={(e) => setFormData({ ...formData, certificate_url: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">Admin Notes / Remarks</label>
            <Textarea className="mt-1" rows={3} placeholder="Add any private notes about the new member..." value={formData.admin_notes} onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onClose(); }}>Cancel</Button>
            <Button type="submit" disabled={createMut.isPending}>
              {createMut.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding Member…</> : "Add Member"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Corporate Payslip Generator Dialog ── */
function PayslipModalDialog({ app, open, onClose }: { app: any; open: boolean; onClose: () => void }) {
  const [payPeriod, setPayPeriod] = useState("August 2026");
  const [basicSalary, setBasicSalary] = useState(25000);
  const [hra, setHra] = useState(10000);
  const [specialAllowance, setSpecialAllowance] = useState(6000);
  const [conveyanceAllowance, setConveyanceAllowance] = useState(4000);
  const [bonus, setBonus] = useState(0);
  const [pf, setPf] = useState(1800);
  const [pt, setPt] = useState(200);
  const [tds, setTds] = useState(0);

  if (!app) return null;

  async function handleDownload() {
    try {
      const logoBase64 = await urlToBase64("/icon-512.png");
      const signatureBase64 = await urlToBase64("/signature.png");
      const doc = generatePayslipPdf({
        employeeName: app.full_name,
        employeeId: app.id.slice(0, 8).toUpperCase(),
        designation: app.role_applied,
        domain: app.domain || "Technology & Software",
        subDomain: app.sub_domain || "Full Stack Web Development",
        department: "Project VyNexa",
        payPeriod,
        dateOfJoining: app.created_at ? new Date(app.created_at).toLocaleDateString("en-IN") : "2026-08-01",
        basicSalary: Number(basicSalary),
        hra: Number(hra),
        specialAllowance: Number(specialAllowance),
        conveyanceAllowance: Number(conveyanceAllowance),
        performanceBonus: Number(bonus),
        providentFund: Number(pf),
        professionalTax: Number(pt),
        incomeTax: Number(tds),
        logoBase64,
        signatureBase64,
      });
      doc.save(`Payslip_${app.full_name.replace(/\s+/g, "_")}_${payPeriod.replace(/\s+/g, "_")}.pdf`);
      toast.success("Corporate Payslip PDF generated & downloaded!");
      onClose();
    } catch (err: any) {
      toast.error("Failed to generate payslip: " + err.message);
    }
  }

  const gross = Number(basicSalary) + Number(hra) + Number(specialAllowance) + Number(conveyanceAllowance) + Number(bonus);
  const deductions = Number(pf) + Number(pt) + Number(tds);
  const net = Math.max(0, gross - deductions);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary font-semibold flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" /> Corporate Payslip Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="bg-slate-900 text-white p-3.5 rounded-lg flex items-center justify-between">
            <div>
              <div className="font-semibold text-base">{app.full_name}</div>
              <div className="text-xs text-slate-300">{app.role_applied} · {app.domain || "Tech"} ({app.sub_domain || "Software"})</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase text-slate-400 font-medium">Net Take-Home</div>
              <div className="text-lg font-bold text-emerald-400">₹ {net.toLocaleString("en-IN")}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-muted-foreground uppercase">Pay Period</label>
              <Input className="mt-1 text-xs" value={payPeriod} onChange={(e) => setPayPeriod(e.target.value)} />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground uppercase">Basic Salary (₹)</label>
              <Input className="mt-1 text-xs" type="number" value={basicSalary} onChange={(e) => setBasicSalary(Number(e.target.value))} />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground uppercase">HRA (₹)</label>
              <Input className="mt-1 text-xs" type="number" value={hra} onChange={(e) => setHra(Number(e.target.value))} />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground uppercase">Special Allowance (₹)</label>
              <Input className="mt-1 text-xs" type="number" value={specialAllowance} onChange={(e) => setSpecialAllowance(Number(e.target.value))} />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground uppercase">Conveyance Allowance (₹)</label>
              <Input className="mt-1 text-xs" type="number" value={conveyanceAllowance} onChange={(e) => setConveyanceAllowance(Number(e.target.value))} />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground uppercase">Performance Bonus (₹)</label>
              <Input className="mt-1 text-xs" type="number" value={bonus} onChange={(e) => setBonus(Number(e.target.value))} />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground uppercase">Provident Fund / PF (₹)</label>
              <Input className="mt-1 text-xs" type="number" value={pf} onChange={(e) => setPf(Number(e.target.value))} />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground uppercase">Professional Tax / PT (₹)</label>
              <Input className="mt-1 text-xs" type="number" value={pt} onChange={(e) => setPt(Number(e.target.value))} />
            </div>
          </div>

          <div className="border-t border-border pt-3 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Gross: <span className="font-semibold text-foreground">₹ {gross.toLocaleString("en-IN")}</span> · Deductions: <span className="font-semibold text-destructive">₹ {deductions.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button size="sm" onClick={handleDownload} className="bg-slate-900 text-white hover:bg-slate-800">
                <Download className="h-4 w-4 mr-1.5" /> Download Payslip PDF
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
