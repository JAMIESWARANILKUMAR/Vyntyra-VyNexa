import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2, Plus, Mail, ClipboardList, Calendar, Trash2, Users,
  ShieldAlert, Loader2, AlertCircle, UserCheck, UserX, Clock,
  CheckCircle2, Circle, AlertTriangle, ChevronDown, ArrowLeft,
  Shield, GraduationCap, Briefcase, CalendarDays, RefreshCw,
  Video, FileText, UploadCloud, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listTeamMembers, provisionUser, revokeUser,
  listAnnouncements, createAnnouncement, deleteAnnouncement,
  listTasks, createTask, deleteTask,
  listSchedules, createSchedule, deleteSchedule,
  listMeetings, createMeeting, deleteMeeting,
  listResources, createResource, deleteResource,
  getPresignedUrl, updateUserProfile, listFeedbacks, markFeedbackRead
} from "@/lib/operations.functions";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/admin/operations")({
  head: () => ({ meta: [{ title: "Operations — Vyntyra Super Admin" }] }),
  component: OperationsDashboard,
});

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl border bg-card p-4 flex items-center gap-4 shadow-sm`}>
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-primary">{value}</div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
      <div className="opacity-30 scale-150">{icon}</div>
      <p className="text-sm">{message}</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3 text-destructive">
      <AlertCircle className="h-8 w-8 opacity-50" />
      <p className="text-sm text-center text-muted-foreground max-w-xs">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </Button>
      )}
    </div>
  );
}

function OperationsDashboard() {
  const qc = useQueryClient();

  // Server functions
  const fetchTeam = useServerFn(listTeamMembers);
  const doProvision = useServerFn(provisionUser);
  const doRevoke = useServerFn(revokeUser);
  const fetchAnnouncements = useServerFn(listAnnouncements);
  const doCreateAnnouncement = useServerFn(createAnnouncement);
  const doDeleteAnnouncement = useServerFn(deleteAnnouncement);
  const fetchTasks = useServerFn(listTasks);
  const doCreateTask = useServerFn(createTask);
  const doDeleteTask = useServerFn(deleteTask);
  const fetchSchedules = useServerFn(listSchedules);
  const doCreateSchedule = useServerFn(createSchedule);
  const doDeleteSchedule = useServerFn(deleteSchedule);
  const fetchMeetings = useServerFn(listMeetings);
  const doCreateMeeting = useServerFn(createMeeting);
  const doDeleteMeeting = useServerFn(deleteMeeting);
  const fetchResources = useServerFn(listResources);
  const doCreateResource = useServerFn(createResource);
  const doDeleteResource = useServerFn(deleteResource);
  const doGetUploadUrl = useServerFn(getPresignedUrl);
  const doUpdateProfile = useServerFn(updateUserProfile);
  const fetchFeedbacks = useServerFn(listFeedbacks);
  const doMarkFeedbackRead = useServerFn(markFeedbackRead);

  // Dialog states
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [resourceOpen, setResourceOpen] = useState(false);

  // Form states
  const [provisionForm, setProvisionForm] = useState({ full_name: "", email: "", password: "", role: "employee" as "employee" | "intern" });
  const [announcementForm, setAnnouncementForm] = useState({ title: "", body: "", target_role: "all" as "employee" | "intern" | "all" });
  const [taskForm, setTaskForm] = useState({ title: "", description: "", assigned_to: "", due_date: "", priority: "medium" as "low" | "medium" | "high", is_pool_task: false });
  const [scheduleForm, setScheduleForm] = useState({ title: "", description: "", event_date: "", event_time: "", target_role: "all" as "employee" | "intern" | "all" });
  const [meetingForm, setMeetingForm] = useState({ title: "", meeting_link: "", start_time: "", target_role: "all" as "employee" | "intern" | "all" });
  const [resourceForm, setResourceForm] = useState({ title: "", type: "document" as "document" | "video" | "link" | "template" | "guide", description: "", target_role: "all" as "employee" | "intern" | "all" });
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Queries
  const teamQ = useQuery({ queryKey: ["team-members"], queryFn: () => fetchTeam() });
  const announcementsQ = useQuery({ queryKey: ["announcements"], queryFn: () => fetchAnnouncements() });
  const tasksQ = useQuery({ queryKey: ["tasks"], queryFn: () => fetchTasks() });
  const schedulesQ = useQuery({ queryKey: ["schedules"], queryFn: () => fetchSchedules() });
  const meetingsQ = useQuery({ queryKey: ["meetings"], queryFn: () => fetchMeetings() });
  const resourcesQ = useQuery({ queryKey: ["resources"], queryFn: () => fetchResources() });
  const feedbacksQ = useQuery({ queryKey: ["feedbacks"], queryFn: () => fetchFeedbacks() });

  const team: any[] = teamQ.data || [];
  const employees = team.filter((m: any) => m.role === "employee");
  const interns = team.filter((m: any) => m.role === "intern");

  // Mutations
  async function handleProvision(e: React.FormEvent) {
    e.preventDefault();
    try {
      await doProvision({ data: provisionForm });
      toast.success(`${provisionForm.role === "employee" ? "Employee" : "Intern"} account created for ${provisionForm.full_name}`);
      setProvisionOpen(false);
      setProvisionForm({ full_name: "", email: "", password: "", role: "employee" });
      qc.invalidateQueries({ queryKey: ["team-members"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to provision user");
    }
  }

  async function handleRevoke(userId: string, name: string) {
    try {
      await doRevoke({ data: { userId } });
      toast.success(`Access revoked for ${name}`);
      qc.invalidateQueries({ queryKey: ["team-members"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke access");
    }
  }

  async function handleCreateAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    try {
      await doCreateAnnouncement({ data: announcementForm });
      toast.success("Announcement posted!");
      setAnnouncementOpen(false);
      setAnnouncementForm({ title: "", body: "", target_role: "all" });
      qc.invalidateQueries({ queryKey: ["announcements"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to post announcement");
    }
  }

  async function handleDeleteAnnouncement(id: string) {
    try {
      await doDeleteAnnouncement({ data: { id } });
      toast.success("Announcement deleted");
      qc.invalidateQueries({ queryKey: ["announcements"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    try {
      await doCreateTask({ data: taskForm });
      toast.success("Task assigned successfully!");
      setTaskOpen(false);
      setTaskForm({ title: "", description: "", assigned_to: "", due_date: "", priority: "medium", is_pool_task: false });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to assign task");
    }
  }

  async function handleDeleteTask(id: string) {
    try {
      await doDeleteTask({ data: { id } });
      toast.success("Task removed");
      qc.invalidateQueries({ queryKey: ["tasks"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to remove task");
    }
  }

  async function handleCreateSchedule(e: React.FormEvent) {
    e.preventDefault();
    try {
      await doCreateSchedule({ data: scheduleForm });
      toast.success("Event scheduled!");
      setScheduleOpen(false);
      setScheduleForm({ title: "", description: "", event_date: "", event_time: "", target_role: "all" });
      qc.invalidateQueries({ queryKey: ["schedules"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to create schedule");
    }
  }

  async function handleDeleteSchedule(id: string) {
    try {
      await doDeleteSchedule({ data: { id } });
      toast.success("Event removed");
      qc.invalidateQueries({ queryKey: ["schedules"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to remove event");
    }
  }

  async function handleCreateMeeting(e: React.FormEvent) {
    e.preventDefault();
    try {
      await doCreateMeeting({ data: meetingForm });
      toast.success("Meeting scheduled!");
      setMeetingOpen(false);
      setMeetingForm({ title: "", meeting_link: "", start_time: "", target_role: "all" });
      qc.invalidateQueries({ queryKey: ["meetings"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to create meeting");
    }
  }

  async function handleDeleteMeeting(id: string) {
    try {
      await doDeleteMeeting({ data: { id } });
      toast.success("Meeting removed");
      qc.invalidateQueries({ queryKey: ["meetings"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to remove meeting");
    }
  }

  async function handleCreateResource(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsUploading(true);
      let fileUrl = "";
      
      if (resourceFile) {
        const uploadInfo = await doGetUploadUrl({ data: { filename: resourceFile.name, contentType: resourceFile.type } });
        
        await fetch(uploadInfo.uploadUrl, {
          method: "PUT",
          body: resourceFile,
          headers: {
            "Content-Type": resourceFile.type,
          },
        });
        fileUrl = uploadInfo.fileUrl;
      }

      await doCreateResource({ data: { ...resourceForm, url: fileUrl } });
      toast.success("Resource added!");
      setResourceOpen(false);
      setResourceForm({ title: "", type: "document", description: "", target_role: "all" });
      setResourceFile(null);
      qc.invalidateQueries({ queryKey: ["resources"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to add resource");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDeleteResource(id: string) {
    try {
      await doDeleteResource({ data: { id } });
      toast.success("Resource removed");
      qc.invalidateQueries({ queryKey: ["resources"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to remove resource");
    }
  }

  const priorityStyles: Record<string, string> = {
    high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };

  const taskStatusStyles: Record<string, string> = {
    pending: "bg-slate-100 text-slate-600",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    blocked: "bg-red-100 text-red-700",
  };

  function getMemberName(id: string) {
    return team.find((m: any) => m.id === id)?.full_name || id;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Link>
            <div className="w-px h-5 bg-slate-200" />
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="font-semibold text-sm leading-tight">Operations Control</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Super Admin</div>
              </div>
            </div>
          </div>
          <Dialog open={provisionOpen} onOpenChange={setProvisionOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" /> Add Team Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-primary" /> Provision Team Member</DialogTitle>
                <DialogDescription>Create a secure login account. The user can sign in immediately with these credentials.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleProvision} className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input required value={provisionForm.full_name} onChange={e => setProvisionForm({ ...provisionForm, full_name: e.target.value })} placeholder="e.g. Priya Sharma" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email Address</Label>
                  <Input required type="email" value={provisionForm.email} onChange={e => setProvisionForm({ ...provisionForm, email: e.target.value })} placeholder="priya@vyntyra.in" />
                </div>
                <div className="space-y-1.5">
                  <Label>Temporary Password <span className="text-muted-foreground text-xs">(min 6 characters)</span></Label>
                  <Input required type="text" minLength={6} value={provisionForm.password} onChange={e => setProvisionForm({ ...provisionForm, password: e.target.value })} placeholder="••••••••" />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select value={provisionForm.role} onValueChange={(v: any) => setProvisionForm({ ...provisionForm, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee"><span className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> Employee</span></SelectItem>
                      <SelectItem value="intern"><span className="flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Intern</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setProvisionOpen(false)}>Cancel</Button>
                  <Button type="submit" className="gap-2"><UserCheck className="h-4 w-4" /> Create Account</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={<Users className="h-5 w-5 text-primary" />} label="Total Members" value={team.length} color="bg-primary/10" />
          <StatCard icon={<Briefcase className="h-5 w-5 text-blue-600" />} label="Employees" value={employees.length} color="bg-blue-50" />
          <StatCard icon={<GraduationCap className="h-5 w-5 text-emerald-600" />} label="Interns" value={interns.length} color="bg-emerald-50" />
          <StatCard icon={<ClipboardList className="h-5 w-5 text-amber-600" />} label="Active Tasks" value={(tasksQ.data || []).filter((t: any) => t.status !== "completed").length} color="bg-amber-50" />
        </div>

        {/* ── Team Members (Employees + Interns) ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Users / Directory
            </h2>
            <Button variant="outline" size="sm" onClick={() => teamQ.refetch()} className="gap-1.5 text-xs">
              <RefreshCw className={`h-3.5 w-3.5 ${teamQ.isFetching ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employees */}
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b bg-blue-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium text-sm text-blue-800">
                  <Briefcase className="h-4 w-4" /> Employees <span className="ml-1 text-xs bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded-full">{employees.length}</span>
                </div>
              </div>
              <div className="divide-y">
                {teamQ.isLoading ? (
                  <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                  </div>
                ) : teamQ.isError ? (
                  <ErrorState message="Could not load team members. Check if the schema is applied." onRetry={() => teamQ.refetch()} />
                ) : employees.length === 0 ? (
                  <EmptyState icon={<Briefcase className="h-6 w-6" />} message="No employees provisioned yet" />
                ) : (
                  employees.map((m: any) => (
                    <MemberRow key={m.id} member={m} onRevoke={handleRevoke} onClick={() => setSelectedUser(m)} />
                  ))
                )}
              </div>
            </div>

            {/* Interns */}
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b bg-emerald-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium text-sm text-emerald-800">
                  <GraduationCap className="h-4 w-4" /> Interns <span className="ml-1 text-xs bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-full">{interns.length}</span>
                </div>
              </div>
              <div className="divide-y">
                {teamQ.isLoading ? (
                  <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                  </div>
                ) : teamQ.isError ? (
                  <ErrorState message="Could not load team members. Check if the schema is applied." onRetry={() => teamQ.refetch()} />
                ) : interns.length === 0 ? (
                  <EmptyState icon={<GraduationCap className="h-6 w-6" />} message="No interns provisioned yet" />
                ) : (
                  interns.map((m: any) => (
                    <MemberRow key={m.id} member={m} onRevoke={handleRevoke} onClick={() => setSelectedUser(m)} />
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Announcements + Tasks ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Announcements */}
          <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2"><Mail className="h-4 w-4 text-amber-500" /> Announcements</h2>
              <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7 px-3"><Plus className="h-3.5 w-3.5" /> New Post</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-amber-500" /> Post Announcement</DialogTitle>
                    <DialogDescription>This will be visible to the selected audience in their dashboards.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateAnnouncement} className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label>Title</Label>
                      <Input required value={announcementForm.title} onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })} placeholder="e.g. Q3 All Hands Meeting" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Message</Label>
                      <Textarea required rows={4} value={announcementForm.body} onChange={e => setAnnouncementForm({ ...announcementForm, body: e.target.value })} placeholder="Write your announcement here..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Target Audience</Label>
                      <Select value={announcementForm.target_role} onValueChange={(v: any) => setAnnouncementForm({ ...announcementForm, target_role: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Everyone (Employees + Interns)</SelectItem>
                          <SelectItem value="employee">Employees Only</SelectItem>
                          <SelectItem value="intern">Interns Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setAnnouncementOpen(false)}>Cancel</Button>
                      <Button type="submit">Post Announcement</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="divide-y max-h-[380px] overflow-y-auto">
              {announcementsQ.isLoading ? (
                <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
              ) : announcementsQ.isError ? (
                <ErrorState message="Could not load announcements." onRetry={() => announcementsQ.refetch()} />
              ) : (announcementsQ.data || []).length === 0 ? (
                <EmptyState icon={<Mail className="h-6 w-6" />} message="No announcements yet. Post one above!" />
              ) : (
                (announcementsQ.data as any[]).map((a: any) => (
                  <div key={a.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{a.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide ${a.target_role === "all" ? "bg-slate-100 text-slate-600" : a.target_role === "employee" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {a.target_role === "all" ? "Everyone" : a.target_role}
                          </span>
                          <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{a.body}</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/50 hover:text-destructive hover:bg-destructive/10 shrink-0">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
                            <AlertDialogDescription>This will remove the announcement from all dashboards immediately.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteAnnouncement(a.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Tasks */}
          <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" /> Task Assignments</h2>
              <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7 px-3" disabled={team.length === 0}>
                    <Plus className="h-3.5 w-3.5" /> Assign Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Assign a Task</DialogTitle>
                    <DialogDescription>Tasks will appear in the assigned person's dashboard.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateTask} className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label>Task Title</Label>
                      <Input required value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="e.g. Complete onboarding documentation" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Textarea rows={3} value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Detailed instructions..." />
                    </div>
                    <div className="flex items-center space-x-2 pb-2">
                      <input type="checkbox" id="pool_task" checked={taskForm.is_pool_task} onChange={e => setTaskForm({...taskForm, is_pool_task: e.target.checked, assigned_to: e.target.checked ? "" : taskForm.assigned_to})} className="rounded border-gray-300 h-4 w-4" />
                      <Label htmlFor="pool_task" className="cursor-pointer">Add to Intern Pool (Bulk Claimable)</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Assign To</Label>
                        <Select disabled={taskForm.is_pool_task} required={!taskForm.is_pool_task} value={taskForm.assigned_to} onValueChange={v => setTaskForm({ ...taskForm, assigned_to: v })}>
                          <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                          <SelectContent>
                            {employees.length > 0 && <SelectItem value="__header_emp" disabled className="text-xs text-muted-foreground font-semibold">— Employees —</SelectItem>}
                            {employees.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
                            {interns.length > 0 && <SelectItem value="__header_int" disabled className="text-xs text-muted-foreground font-semibold">— Interns —</SelectItem>}
                            {interns.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Priority</Label>
                        <Select value={taskForm.priority} onValueChange={(v: any) => setTaskForm({ ...taskForm, priority: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Due Date <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setTaskOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={!taskForm.assigned_to && !taskForm.is_pool_task}>Assign Task</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="divide-y max-h-[380px] overflow-y-auto">
              {tasksQ.isLoading ? (
                <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
              ) : tasksQ.isError ? (
                <ErrorState message="Could not load tasks. Ensure the tasks table exists." onRetry={() => tasksQ.refetch()} />
              ) : (tasksQ.data || []).length === 0 ? (
                <EmptyState icon={<ClipboardList className="h-6 w-6" />} message={team.length === 0 ? "Add team members first, then assign tasks" : "No tasks yet. Assign one above!"} />
              ) : (
                (tasksQ.data as any[]).map((t: any) => (
                  <div key={t.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{t.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold uppercase tracking-wide ${priorityStyles[t.priority] || priorityStyles.medium}`}>{t.priority}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${taskStatusStyles[t.status] || taskStatusStyles.pending}`}>{(t.status || "pending").replace("_", " ")}</span>
                          {t.is_pool_task ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-semibold">INTERN POOL</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">→ {t.profiles?.full_name || getMemberName(t.assigned_to)}</span>
                          )}
                          {t.due_date && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(t.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
                        </div>
                        {t.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">{t.description}</p>}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/50 hover:text-destructive hover:bg-destructive/10 shrink-0">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Task?</AlertDialogTitle>
                            <AlertDialogDescription>This will remove the task from the assignee's dashboard.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteTask(t.id)} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* ── Schedules ── */}
        <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-sm flex items-center gap-2"><CalendarDays className="h-4 w-4 text-emerald-600" /> Schedules & Events</h2>
            <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7 px-3"><Plus className="h-3.5 w-3.5" /> Add Event</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-emerald-600" /> Schedule an Event</DialogTitle>
                  <DialogDescription>Events will appear in the targeted team's schedule view.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateSchedule} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label>Event Title</Label>
                    <Input required value={scheduleForm.title} onChange={e => setScheduleForm({ ...scheduleForm, title: e.target.value })} placeholder="e.g. Weekly Sync Call" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Textarea rows={2} value={scheduleForm.description} onChange={e => setScheduleForm({ ...scheduleForm, description: e.target.value })} placeholder="Agenda, meeting link, etc." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Date</Label>
                      <Input required type="date" value={scheduleForm.event_date} onChange={e => setScheduleForm({ ...scheduleForm, event_date: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Time <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input type="time" value={scheduleForm.event_time} onChange={e => setScheduleForm({ ...scheduleForm, event_time: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Target Audience</Label>
                    <Select value={scheduleForm.target_role} onValueChange={(v: any) => setScheduleForm({ ...scheduleForm, target_role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Everyone</SelectItem>
                        <SelectItem value="employee">Employees Only</SelectItem>
                        <SelectItem value="intern">Interns Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setScheduleOpen(false)}>Cancel</Button>
                    <Button type="submit">Add to Schedule</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="divide-y">
            {schedulesQ.isLoading ? (
              <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading schedules...</div>
            ) : schedulesQ.isError ? (
              <ErrorState message="Could not load schedules. Ensure the schedules table exists." onRetry={() => schedulesQ.refetch()} />
            ) : (schedulesQ.data || []).length === 0 ? (
              <EmptyState icon={<CalendarDays className="h-6 w-6" />} message="No upcoming events. Add one above!" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-x divide-y">
                {(schedulesQ.data as any[]).map((s: any) => (
                  <div key={s.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-lg bg-emerald-50 flex flex-col items-center justify-center border border-emerald-100 shrink-0">
                            <span className="text-[10px] font-bold text-emerald-700 leading-none">{new Date(s.event_date).toLocaleDateString("en-IN", { day: "2-digit" })}</span>
                            <span className="text-[8px] text-emerald-500 uppercase">{new Date(s.event_date).toLocaleDateString("en-IN", { month: "short" })}</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm leading-tight">{s.title}</h4>
                            {s.event_time && <p className="text-xs text-muted-foreground">{s.event_time}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${s.target_role === "all" ? "bg-slate-100 text-slate-600" : s.target_role === "employee" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {s.target_role === "all" ? "Everyone" : s.target_role}
                          </span>
                        </div>
                        {s.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{s.description}</p>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteSchedule(s.id)} className="h-7 w-7 text-destructive/40 hover:text-destructive hover:bg-destructive/10 shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Meetings + Resources ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Meetings */}
          <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2"><Video className="h-4 w-4 text-indigo-500" /> Meetings</h2>
              <Dialog open={meetingOpen} onOpenChange={setMeetingOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7 px-3"><Plus className="h-3.5 w-3.5" /> New Meeting</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Video className="h-5 w-5 text-indigo-500" /> Schedule Meeting</DialogTitle>
                    <DialogDescription>Add a new meeting for your team.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateMeeting} className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label>Title</Label>
                      <Input required value={meetingForm.title} onChange={e => setMeetingForm({ ...meetingForm, title: e.target.value })} placeholder="e.g. Daily Standup" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Meeting Link</Label>
                      <Input required type="url" value={meetingForm.meeting_link} onChange={e => setMeetingForm({ ...meetingForm, meeting_link: e.target.value })} placeholder="https://zoom.us/j/..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Start Time</Label>
                      <Input required type="datetime-local" value={meetingForm.start_time} onChange={e => setMeetingForm({ ...meetingForm, start_time: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Target Audience</Label>
                      <Select value={meetingForm.target_role} onValueChange={(v: any) => setMeetingForm({ ...meetingForm, target_role: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Everyone</SelectItem>
                          <SelectItem value="employee">Employees Only</SelectItem>
                          <SelectItem value="intern">Interns Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setMeetingOpen(false)}>Cancel</Button>
                      <Button type="submit">Schedule</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="divide-y max-h-[380px] overflow-y-auto">
              {meetingsQ.isLoading ? (
                <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
              ) : meetingsQ.isError ? (
                <ErrorState message="Could not load meetings." onRetry={() => meetingsQ.refetch()} />
              ) : (meetingsQ.data || []).length === 0 ? (
                <EmptyState icon={<Video className="h-6 w-6" />} message="No meetings scheduled." />
              ) : (
                (meetingsQ.data as any[]).map((m: any) => (
                  <div key={m.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{m.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide ${m.target_role === "all" ? "bg-slate-100 text-slate-600" : m.target_role === "employee" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {m.target_role === "all" ? "Everyone" : m.target_role}
                          </span>
                          <span className="text-xs text-muted-foreground">{new Date(m.start_time).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                        </div>
                        <a href={m.meeting_link} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline mt-2 block truncate">{m.meeting_link}</a>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/50 hover:text-destructive hover:bg-destructive/10 shrink-0">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Meeting?</AlertDialogTitle>
                            <AlertDialogDescription>This will remove the meeting from all dashboards.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteMeeting(m.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Resources */}
          <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-pink-500" /> Resources</h2>
              <Dialog open={resourceOpen} onOpenChange={setResourceOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7 px-3"><Plus className="h-3.5 w-3.5" /> Add Resource</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-pink-500" /> Upload Resource</DialogTitle>
                    <DialogDescription>Share documents or links with your team.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateResource} className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label>Title</Label>
                      <Input required value={resourceForm.title} onChange={e => setResourceForm({ ...resourceForm, title: e.target.value })} placeholder="e.g. Employee Handbook" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Textarea rows={2} value={resourceForm.description} onChange={e => setResourceForm({ ...resourceForm, description: e.target.value })} placeholder="Brief description..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Type</Label>
                        <Select value={resourceForm.type} onValueChange={(v: any) => setResourceForm({ ...resourceForm, type: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="document">Document</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="link">Link</SelectItem>
                            <SelectItem value="template">Template</SelectItem>
                            <SelectItem value="guide">Guide</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Target Audience</Label>
                        <Select value={resourceForm.target_role} onValueChange={(v: any) => setResourceForm({ ...resourceForm, target_role: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Everyone</SelectItem>
                            <SelectItem value="employee">Employees Only</SelectItem>
                            <SelectItem value="intern">Interns Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>File</Label>
                      <Input type="file" required onChange={e => setResourceFile(e.target.files?.[0] || null)} />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setResourceOpen(false)} disabled={isUploading}>Cancel</Button>
                      <Button type="submit" disabled={!resourceFile || isUploading}>
                        {isUploading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading...</> : "Upload"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="divide-y max-h-[380px] overflow-y-auto">
              {resourcesQ.isLoading ? (
                <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
              ) : resourcesQ.isError ? (
                <ErrorState message="Could not load resources." onRetry={() => resourcesQ.refetch()} />
              ) : (resourcesQ.data || []).length === 0 ? (
                <EmptyState icon={<FileText className="h-6 w-6" />} message="No resources uploaded." />
              ) : (
                (resourcesQ.data as any[]).map((r: any) => (
                  <div key={r.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{r.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide ${r.target_role === "all" ? "bg-slate-100 text-slate-600" : r.target_role === "employee" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {r.target_role === "all" ? "Everyone" : r.target_role}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium capitalize bg-gray-100 text-gray-700">{r.type}</span>
                          <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                        </div>
                        {r.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{r.description}</p>}
                        <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-pink-600 hover:underline mt-2 flex items-center gap-1">
                          <UploadCloud className="h-3 w-3" /> Download / View
                        </a>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/50 hover:text-destructive hover:bg-destructive/10 shrink-0">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Resource?</AlertDialogTitle>
                            <AlertDialogDescription>This will remove the resource from all dashboards.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteResource(r.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>

        {/* ── Feedback Inbox ── */}
        <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4 text-purple-500" /> Feedback Inbox</h2>
          </div>
          <div className="divide-y max-h-[380px] overflow-y-auto">
            {feedbacksQ.isLoading ? (
              <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading feedbacks...</div>
            ) : feedbacksQ.isError ? (
              <ErrorState message="Could not load feedbacks." onRetry={() => feedbacksQ.refetch()} />
            ) : (feedbacksQ.data || []).length === 0 ? (
              <EmptyState icon={<MessageSquare className="h-6 w-6" />} message="No feedback submitted yet." />
            ) : (
              (feedbacksQ.data as any[]).map((f: any) => (
                <div key={f.id} className={`p-4 hover:bg-slate-50 transition-colors ${!f.is_read ? "bg-purple-50/30" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{f.profiles?.full_name || f.intern_id || "Anonymous"}</span>
                        {!f.is_read && <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">New</span>}
                        <span className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                      </div>
                      <p className="text-sm mt-1 text-slate-700 whitespace-pre-wrap">{f.content}</p>
                    </div>
                    {!f.is_read && (
                      <Button variant="outline" size="sm" onClick={async () => {
                        try {
                          await doMarkFeedbackRead({ data: { id: f.id } });
                          qc.invalidateQueries({ queryKey: ["feedbacks"] });
                          toast.success("Marked as read");
                        } catch (err: any) {
                          toast.error("Failed to mark read");
                        }
                      }}>
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </main>
      
      {/* ── User Profile Drawer / Dialog ── */}
      <UserProfileDialog 
        user={selectedUser} 
        open={!!selectedUser} 
        onOpenChange={(open: boolean) => !open && setSelectedUser(null)} 
        doUpdateProfile={doUpdateProfile} 
        doGetUploadUrl={doGetUploadUrl} 
        qc={qc} 
      />
    </div>
  );
}

function MemberRow({ member, onRevoke, onClick }: { member: any; onRevoke: (id: string, name: string) => void; onClick: () => void }) {
  const roleStyles = member.role === "employee"
    ? "bg-blue-100 text-blue-800"
    : "bg-emerald-100 text-emerald-800";

  return (
    <div className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer group" onClick={onClick}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${member.role === "employee" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"} bg-cover bg-center`} style={member.avatar_url ? { backgroundImage: `url(${member.avatar_url})` } : {}}>
          {!member.avatar_url && (member.full_name || member.email || "?")[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">{member.full_name || "—"}</div>
          <div className="text-xs text-muted-foreground truncate">{member.email}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${roleStyles}`}>{member.role}</span>
        <div onClick={(e) => e.stopPropagation()}>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/40 hover:text-destructive hover:bg-destructive/10">
                <UserX className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-destructive" /> Revoke Access?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete <strong>{member.full_name}</strong>'s account (<em>{member.email}</em>). They will lose all access immediately. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onRevoke(member.id, member.full_name)} className="bg-destructive hover:bg-destructive/90">
                  Revoke Access
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

function UserProfileDialog({ user, open, onOpenChange, doUpdateProfile, doGetUploadUrl, qc }: any) {
  const [form, setForm] = useState(user || {});
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLetter, setUploadingLetter] = useState(false);

  useEffect(() => {
    if (user) setForm(user);
  }, [user]);

  if (!user) return null;

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await doUpdateProfile({ data: { 
        userId: user.id, 
        updates: {
          full_name: form.full_name,
          phone: form.phone,
          address: form.address,
          intern_id: form.intern_id,
          start_date: form.start_date,
          end_date: form.end_date,
          avatar_url: form.avatar_url,
          offer_letter_url: form.offer_letter_url
        } 
      } });
      toast.success("Profile updated successfully");
      qc.invalidateQueries({ queryKey: ["team-members"] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    }
  }

  async function handleFileUpload(file: File, type: "avatar" | "letter") {
    const isAvatar = type === "avatar";
    isAvatar ? setUploadingAvatar(true) : setUploadingLetter(true);
    try {
      const uploadInfo = await doGetUploadUrl({ data: { filename: file.name, contentType: file.type } });
      await fetch(uploadInfo.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      setForm((prev: any) => ({ ...prev, [isAvatar ? "avatar_url" : "offer_letter_url"]: uploadInfo.fileUrl }));
      toast.success(isAvatar ? "Avatar uploaded" : "Offer letter uploaded");
    } catch (err: any) {
      toast.error("Upload failed");
    } finally {
      isAvatar ? setUploadingAvatar(false) : setUploadingLetter(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile: {user.full_name}</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5"><Label>Full Name</Label><Input value={form.full_name || ""} onChange={e => setForm({...form, full_name: e.target.value})} /></div>
             <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone || ""} onChange={e => setForm({...form, phone: e.target.value})} /></div>
             <div className="col-span-2 space-y-1.5"><Label>Address</Label><Input value={form.address || ""} onChange={e => setForm({...form, address: e.target.value})} /></div>
             <div className="space-y-1.5"><Label>Intern ID</Label><Input value={form.intern_id || ""} onChange={e => setForm({...form, intern_id: e.target.value})} /></div>
             <div className="space-y-1.5"><Label>Start Date</Label><Input type="date" value={form.start_date || ""} onChange={e => setForm({...form, start_date: e.target.value})} /></div>
             <div className="space-y-1.5"><Label>End Date</Label><Input type="date" value={form.end_date || ""} onChange={e => setForm({...form, end_date: e.target.value})} /></div>
          </div>
          
          <div className="space-y-1.5">
            <Label>Avatar URL</Label>
            <div className="flex gap-2">
              <Input value={form.avatar_url || ""} onChange={e => setForm({...form, avatar_url: e.target.value})} placeholder="https://..." />
              <div className="relative shrink-0">
                <Button type="button" variant="outline" disabled={uploadingAvatar} className="w-[100px]">
                  {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload"}
                </Button>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "avatar"); }} />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Offer Letter URL</Label>
            <div className="flex gap-2">
              <Input value={form.offer_letter_url || ""} onChange={e => setForm({...form, offer_letter_url: e.target.value})} placeholder="https://..." />
              <div className="relative shrink-0">
                <Button type="button" variant="outline" disabled={uploadingLetter} className="w-[100px]">
                  {uploadingLetter ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload"}
                </Button>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="application/pdf,image/*" onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "letter"); }} />
              </div>
            </div>
            {form.offer_letter_url && (
              <a href={form.offer_letter_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                <FileText className="h-3 w-3" /> View Offer Letter
              </a>
            )}
          </div>

          <DialogFooter className="pt-4">
             <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
             <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
