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
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { listApplications, updateAdminNotes, getResumeSignedUrl, regenerateInterviewQuestions, listApplicationProjects, deleteApplication } from "@/lib/applications.functions";
import { getApplicationsOpen, setApplicationsOpen } from "@/lib/settings.functions";
import { listJobPostings, createJobPosting, updateJobPosting, toggleJobPosting, deleteJobPosting } from "@/lib/job-postings.functions";
import { listAdminNotifications, markAllNotificationsRead } from "@/lib/notifications.functions";
import { getVisitorCount } from "@/lib/visitor.functions";
import { Sparkles, RefreshCw, GraduationCap, FolderGit2, Link2 } from "lucide-react";
import { WorldClocks } from "@/components/world-clocks";
import { InstallPwaButton } from "@/components/install-pwa-button";
import { Switch } from "@/components/ui/switch";
import {
  changeApplicationStatus,
  listStatusEvents,
  ALLOWED_TRANSITIONS,
  type AppStatus,
} from "@/lib/workflow.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Vyntyra Careers" }] }),
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
  const [selected, setSelected] = useState<any>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Job posting dialog
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);

  const { data: apps = [], isLoading, error } = useQuery({
    queryKey: ["applications"],
    queryFn: () => list(),
  });

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

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
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

  const stats = {
    total: apps.length,
    new: apps.filter((a: any) => a.status === "new").length,
    reviewing: apps.filter((a: any) => a.status === "reviewing").length,
    shortlisted: apps.filter((a: any) => a.status === "shortlisted").length,
    hired: apps.filter((a: any) => a.status === "hired").length,
    rejected: apps.filter((a: any) => a.status === "rejected").length,
  };

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
            <img src="/favicon.png" alt="Vyntyra" className="h-8 sm:h-10 w-auto shrink-0" />
            <div className="border-l border-border pl-3 min-w-0 hidden xs:block sm:block">
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                Admin
              </div>
              <div className="text-sm font-semibold text-primary truncate">Vyntyra Careers</div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <InstallPwaButton />
            <Link
              to="/_authenticated/templates"
              className="inline-flex items-center gap-1.5 rounded-sm px-2 sm:px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface"
            >
              <Settings2 className="h-4 w-4" /> <span className="hidden sm:inline">Templates</span>
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
                  Admin Panel
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight leading-tight">
                  Hello, <span className="text-gold">Recruiter</span>
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

        <div className="rounded-md border border-border bg-card shadow-corp p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 h-9 w-9 rounded-sm flex items-center justify-center ${applicationsOpen ? "bg-destructive/10" : "bg-muted"}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${applicationsOpen ? "bg-destructive animate-pulse" : "bg-muted-foreground/50"}`} />
            </div>
            <div>
              <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-secondary">Public Application Form</div>
              <div className="text-sm font-semibold text-primary mt-0.5">
                {applicationsOpen ? "LIVE · Accepting Applications" : "Paused · Not Accepting Applications"}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Toggling this instantly updates the public form and the LIVE badge — no deploy needed.
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

        {/* ── Stats Grid (6 cards) ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Stat label="Total" value={stats.total} />
          <Stat label="New" value={stats.new} tone="secondary" />
          <Stat label="Reviewing" value={stats.reviewing} tone="amber" />
          <Stat label="Shortlisted" value={stats.shortlisted} tone="emerald" />
          <Stat label="Hired" value={stats.hired} tone="primary" />
          <Stat label="Rejected" value={stats.rejected} tone="destructive" />
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
              <Button variant="outline" size="sm" onClick={exportCsv}>
                <FileDown className="h-4 w-4 mr-1.5" /> Export CSV
              </Button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Filter className="h-3 w-3" />
            Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
            <span className="font-medium text-foreground">{apps.length}</span> applications
          </div>
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
                      className="border-b border-border last:border-0 hover:bg-surface cursor-pointer"
                      onClick={() => setSelected(a)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{a.full_name}</div>
                        <div className="text-xs text-muted-foreground">{a.years_experience || "—"}</div>
                      </td>
                      <td className="px-6 py-4 text-foreground">{a.role_applied}</td>
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

function Stat({ label, value, tone = "default" }: { label: string; value: number; tone?: string }) {
  const toneColor: Record<string, string> = {
    default: "text-primary",
    secondary: "text-secondary",
    amber: "text-amber-600",
    emerald: "text-emerald-600",
    primary: "text-primary",
    destructive: "text-destructive",
  };
  return (
    <div className="rounded-md border border-border bg-card p-5 shadow-corp">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">{label}</div>
      <div className={"mt-2 text-3xl font-semibold tracking-tight " + (toneColor[tone] || "text-primary")}>{value}</div>
    </div>
  );
}

function ApplicationDialog({ app, onClose }: { app: any; onClose: () => void }) {
  const qc = useQueryClient();
  const changeStatus = useServerFn(changeApplicationStatus);
  const saveNotes = useServerFn(updateAdminNotes);
  const listEvents = useServerFn(listStatusEvents);
  const signed = useServerFn(getResumeSignedUrl);
  const regenAi = useServerFn(regenerateInterviewQuestions);

  const [status, setStatus] = useState<AppStatus>((app?.status as AppStatus) ?? "new");
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState(app?.admin_notes ?? "");
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [aiText, setAiText] = useState<string | null>(app?.interview_questions ?? null);
  const [regenerating, setRegenerating] = useState(false);

  const isPdf = !!app?.resume_path && /\.pdf$/i.test(app.resume_path);

  useEffect(() => {
    if (app) {
      setStatus(app.status);
      setNote("");
      setNotes(app.admin_notes ?? "");
      setAiText(app.interview_questions ?? null);
      setResumeUrl(null);
      if (app.resume_path) {
        signed({ data: { path: app.resume_path } })
          .then((r) => setResumeUrl(r.url))
          .catch(() => {});
      }
    }
  }, [app?.id]);

  const currentStatus = (app?.status as AppStatus) ?? "new";
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] ?? [];
  const options = Array.from(new Set([currentStatus, ...allowedNext]));

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

  const statusMut = useMutation({
    mutationFn: () => changeStatus({ data: { id: app.id, status, note } }),
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
      toast.success("Internal notes saved");
      qc.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteApp = useServerFn(deleteApplication);
  const delMut = useMutation({
    mutationFn: () => deleteApp({ data: { id: app.id } }),
    onSuccess: () => {
      toast.success("Application deleted");
      qc.invalidateQueries({ queryKey: ["applications"] });
      onClose();
    },
    onError: (e) => toast.error((e as Error).message),
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
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-start justify-between sm:items-center">
          <div>
            <DialogTitle className="text-2xl text-primary tracking-tight">{app.full_name}</DialogTitle>
            <div className="text-sm text-muted-foreground">{app.role_applied}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("Are you sure you want to delete this application? This action cannot be undone.")) {
                delMut.mutate();
              }
            }}
            disabled={delMut.isPending}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 -mt-1 sm:mt-0"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete
          </Button>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoRow icon={Mail} label="Email" value={app.email} />
            <InfoRow icon={Phone} label="Phone" value={app.phone} />
            <InfoRow icon={Briefcase} label="Company" value={app.company || "—"} />
            <InfoRow icon={Briefcase} label="Position" value={app.position || "—"} />
            <InfoRow label="Experience" value={app.years_experience || "—"} />
            <InfoRow label="Availability" value={app.availability || "—"} />
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
          </div>

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

          <div className="rounded-md border border-border bg-surface p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-semibold text-primary">Change status</div>
                <div className="text-xs text-muted-foreground">
                  Current: <span className="capitalize font-medium text-foreground">{currentStatus}</span>
                  {isTerminal && " · terminal state (no further transitions)"}
                </div>
              </div>
              <Link to="/_authenticated/templates" className="text-xs text-secondary underline">
                Edit email templates
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Next status</label>
                <Select value={status} onValueChange={(v) => setStatus(v as AppStatus)} disabled={isTerminal}>
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
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Note (required · logged to timeline)
              </label>
              <Textarea className="mt-1.5" rows={2} value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Why this change? e.g. 'Passed initial screen — schedule technical round.'" />
            </div>

            <div className="flex justify-end">
              <Button onClick={() => statusMut.mutate()}
                disabled={statusMut.isPending || note.trim().length < 3 || isTerminal}
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
