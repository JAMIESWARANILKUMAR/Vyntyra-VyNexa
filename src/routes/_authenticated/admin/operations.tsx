import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2, Plus, Mail, ClipboardList, Calendar, Trash2, Users,
  ShieldAlert, Loader2, AlertCircle, UserCheck, UserX, Clock,
  CheckCircle2, Circle, AlertTriangle, ChevronDown, ArrowLeft,
  Shield, GraduationCap, Briefcase, CalendarDays, RefreshCw,
  Video, FileText, UploadCloud, MessageSquare, CreditCard, LifeBuoy, Award,
  Play, Pause, Square, Search, ExternalLink, ShieldCheck, Download
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
  getPresignedUrl, updateUserProfile, listFeedbacks, markFeedbackRead, listKudos,
  listAllLeaves, updateLeaveStatus, listAllAttendance, listAllPayouts, createPayout,
  assignIntern, removeIntern, adminResetPassword,
  listAllExpenses, updateExpenseStatus, listAllSupportTickets, updateSupportTicketStatus,
  listAllStandups, updateStandupStatus, listAllDeliverables, updateDeliverableStatus,
  listAllAccessRequests, updateAccessRequestStatus, updateTaskByAdmin,
  listLeads, createLead, updateLeadStatus, deleteLead,
  listBugs, createBug, updateBugStatus,
  sendPromotionalInternshipEmail, listAutomatedEmailLogs, deleteAutomatedEmailLog
} from "@/lib/operations.functions";
import { GoogleDocViewerModal } from "@/components/google-doc-viewer-modal";
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

  const fetchAllLeaves = useServerFn(listAllLeaves);
  const doUpdateLeaveStatus = useServerFn(updateLeaveStatus);
  const fetchAllAttendance = useServerFn(listAllAttendance);
  const fetchAllPayouts = useServerFn(listAllPayouts);
  const doCreatePayout = useServerFn(createPayout);
  const doAssignIntern = useServerFn(assignIntern);
  const doRemoveIntern = useServerFn(removeIntern);
  const doAdminResetPassword = useServerFn(adminResetPassword);

  const fetchExpenses = useServerFn(listAllExpenses);
  const doUpdateExpenseStatus = useServerFn(updateExpenseStatus);
  const fetchTickets = useServerFn(listAllSupportTickets);
  const doUpdateTicketStatus = useServerFn(updateSupportTicketStatus);
  const doUpdateTaskByAdmin = useServerFn(updateTaskByAdmin);
  const [editingTaskByAdmin, setEditingTaskByAdmin] = useState<any>(null);
  const [viewingDoc, setViewingDoc] = useState<{ url: string; title: string } | null>(null);
  const fetchKudos = useServerFn(listKudos);

  // Dialog states
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [resourceOpen, setResourceOpen] = useState(false);

  // Form states
  const [provisionForm, setProvisionForm] = useState({ full_name: "", email: "", password: "", role: "employee" as "employee" | "intern", department: "", position: "", bank_account_number: "", employee_id: "", intern_id: "", duration_months: "" });
  const [announcementForm, setAnnouncementForm] = useState({ title: "", body: "", target_role: "all" as "employee" | "intern" | "all" });
  const [taskForm, setTaskForm] = useState({ title: "", description: "", assigned_to: "", due_date: "", priority: "medium" as "low" | "medium" | "high", is_pool_task: false });
  const [scheduleForm, setScheduleForm] = useState({ title: "", description: "", event_date: "", event_time: "", target_role: "all" as "employee" | "intern" | "all" });
  const [meetingForm, setMeetingForm] = useState({ title: "", meeting_link: "", start_time: "", target_role: "all" as "employee" | "intern" | "all" });
  const [resourceForm, setResourceForm] = useState({ title: "", type: "document" as "document" | "video" | "link" | "template" | "guide", description: "", target_role: "all" as "employee" | "intern" | "all" });
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ user_id: "", amount: 0, type: "Salary", status: "paid" as "paid" | "pending" });

  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetPasswordForm, setResetPasswordForm] = useState({ userId: "", newPassword: "" });
  const [resetUserTarget, setResetUserTarget] = useState<any>(null);

  const [assignInternOpen, setAssignInternOpen] = useState(false);
  const [assignInternForm, setAssignInternForm] = useState({ internId: "", employeeId: "" });

  // Queries with Stale Time optimization for Instant Load Performance
  const queryOpts = { staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 10 };
  const teamQ = useQuery({ queryKey: ["team-members"], queryFn: () => fetchTeam(), ...queryOpts });
  const announcementsQ = useQuery({ queryKey: ["announcements"], queryFn: () => fetchAnnouncements(), ...queryOpts });
  const tasksQ = useQuery({ queryKey: ["tasks"], queryFn: () => fetchTasks(), ...queryOpts });
  const schedulesQ = useQuery({ queryKey: ["schedules"], queryFn: () => fetchSchedules(), ...queryOpts });
  const meetingsQ = useQuery({ queryKey: ["meetings"], queryFn: () => fetchMeetings(), ...queryOpts });
  const resourcesQ = useQuery({ queryKey: ["resources"], queryFn: () => fetchResources(), ...queryOpts });
  const feedbacksQ = useQuery({ queryKey: ["feedbacks"], queryFn: () => fetchFeedbacks(), ...queryOpts });
  const expensesQ = useQuery({ queryKey: ["admin-expenses"], queryFn: () => fetchExpenses(), ...queryOpts });
  const ticketsQ = useQuery({ queryKey: ["admin-tickets"], queryFn: () => fetchTickets(), ...queryOpts });
  const fetchAllStandups = useServerFn(listAllStandups);
  const doUpdateStandupStatus = useServerFn(updateStandupStatus);
  const fetchAllDeliverables = useServerFn(listAllDeliverables);
  const doUpdateDeliverableStatus = useServerFn(updateDeliverableStatus);
  const fetchAllAccessRequests = useServerFn(listAllAccessRequests);
  const doUpdateAccessRequestStatus = useServerFn(updateAccessRequestStatus);

  const fetchLeads = useServerFn(listLeads);
  const doCreateLead = useServerFn(createLead);
  const doUpdateLeadStatus = useServerFn(updateLeadStatus);
  const doDeleteLead = useServerFn(deleteLead);
  const fetchBugs = useServerFn(listBugs);
  const doCreateBug = useServerFn(createBug);
  const doUpdateBugStatus = useServerFn(updateBugStatus);

  const fetchEmailLogs = useServerFn(listAutomatedEmailLogs);
  const doSendPromotionalEmail = useServerFn(sendPromotionalInternshipEmail);
  const doDeleteAutomatedEmailLog = useServerFn(deleteAutomatedEmailLog);

  const leadsAdminQ = useQuery({ queryKey: ["admin-leads"], queryFn: () => fetchLeads(), ...queryOpts });
  const bugsAdminQ = useQuery({ queryKey: ["admin-bugs"], queryFn: () => fetchBugs(), ...queryOpts });
  const emailLogsQ = useQuery({ queryKey: ["admin-email-logs"], queryFn: () => fetchEmailLogs(), ...queryOpts });

  const standupsAdminQ = useQuery({ queryKey: ["admin-standups"], queryFn: () => fetchAllStandups(), ...queryOpts });
  const deliverablesAdminQ = useQuery({ queryKey: ["admin-deliverables"], queryFn: () => fetchAllDeliverables(), ...queryOpts });
  const accessRequestsAdminQ = useQuery({ queryKey: ["admin-access-requests"], queryFn: () => fetchAllAccessRequests(), ...queryOpts });

  const kudosQ = useQuery({ queryKey: ["admin-kudos"], queryFn: () => fetchKudos(), ...queryOpts });

  const leavesQ = useQuery({ queryKey: ["admin-leaves"], queryFn: () => fetchAllLeaves(), ...queryOpts });
  const attendanceQ = useQuery({ queryKey: ["admin-attendance"], queryFn: () => fetchAllAttendance(), ...queryOpts });
  const payoutsQ = useQuery({ queryKey: ["admin-payouts"], queryFn: () => fetchAllPayouts(), ...queryOpts });

  const team: any[] = teamQ.data || [];
  const employees = team.filter((m: any) => m.role === "employee");
  const interns = team.filter((m: any) => m.role === "intern");

  async function handleAdminResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetUserTarget) return;
    try {
      await doAdminResetPassword({ data: { userId: resetUserTarget.id, newPassword: resetPasswordForm.newPassword } });
      toast.success("Password reset successfully for " + resetUserTarget.full_name);
      setResetPasswordOpen(false);
      setResetPasswordForm({ userId: "", newPassword: "" });
      setResetUserTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    }
  }

  async function handleAssignIntern(e: React.FormEvent) {
    e.preventDefault();
    try {
      await doAssignIntern({ data: { internId: assignInternForm.internId, employeeId: assignInternForm.employeeId } });
      toast.success("Intern assigned successfully!");
      setAssignInternOpen(false);
      setAssignInternForm({ internId: "", employeeId: "" });
      qc.invalidateQueries({ queryKey: ["team-members"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to assign intern");
    }
  }

  async function handleRemoveIntern(internId: string) {
    try {
      await doRemoveIntern({ data: { internId } });
      toast.success("Intern removed from employee successfully!");
      qc.invalidateQueries({ queryKey: ["team-members"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to remove intern");
    }
  }

  const tasks = tasksQ.data || [];

  // Mutations
  async function handleProvision(e: React.FormEvent) {
    e.preventDefault();
    try {
      await doProvision({ data: {
        ...provisionForm,
        duration_months: provisionForm.duration_months ? parseInt(provisionForm.duration_months as string) : undefined,
        email: provisionForm.email.trim(),
        password: provisionForm.password.trim(),
      } });
      toast.success(`${provisionForm.role === "employee" ? "Employee" : "Intern"} account created for ${provisionForm.full_name}`);
      setProvisionOpen(false);
      setProvisionForm({ full_name: "", email: "", password: "", role: "employee", department: "", position: "", bank_account_number: "", employee_id: "", intern_id: "", duration_months: "" });
      qc.invalidateQueries({ queryKey: ["team-members"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to provision user");
    }
  }


  async function handleMarkFeedbackRead(id: string) {
    try {
      await doMarkFeedbackRead({ data: { id } });
      qc.invalidateQueries({ queryKey: ["feedbacks"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update feedback");
    }
  }

  async function handleUpdateLeave(id: string, status: "approved" | "rejected") {
    try {
      await doUpdateLeaveStatus({ data: { id, status } });
      toast.success(`Leave ${status}!`);
      qc.invalidateQueries({ queryKey: ["admin-leaves"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update leave");
    }
  }

  async function handleCreatePayout(e: React.FormEvent) {
    e.preventDefault();
    try {
      await doCreatePayout({ data: { ...payoutForm, amount: Number(payoutForm.amount) } });
      toast.success("Payout issued!");
      setPayoutOpen(false);
      setPayoutForm({ user_id: "", amount: 0, type: "Salary", status: "paid" });
      qc.invalidateQueries({ queryKey: ["admin-payouts"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to issue payout");
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
                
                {provisionForm.role === 'employee' && (
                  <>
                    <div className="space-y-1.5">
                      <Label>Employee ID</Label>
                      <Input value={provisionForm.employee_id} onChange={e => setProvisionForm({ ...provisionForm, employee_id: e.target.value })} placeholder="e.g. EMP-2024-001" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Job Title / Position</Label>
                      <Input value={provisionForm.position} onChange={e => setProvisionForm({ ...provisionForm, position: e.target.value })} placeholder="e.g. Software Engineer" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Department</Label>
                      <Input value={provisionForm.department} onChange={e => setProvisionForm({ ...provisionForm, department: e.target.value })} placeholder="e.g. Engineering" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Bank Account Number</Label>
                      <Input value={provisionForm.bank_account_number} onChange={e => setProvisionForm({ ...provisionForm, bank_account_number: e.target.value })} placeholder="Account Number for Payouts" />
                    </div>
                  </>
                )}

                {provisionForm.role === 'intern' && (
                  <>
                    <div className="space-y-1.5">
                      <Label>Intern ID</Label>
                      <Input value={provisionForm.intern_id} onChange={e => setProvisionForm({ ...provisionForm, intern_id: e.target.value })} placeholder="e.g. INT-2024-001" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Department</Label>
                      <Input value={provisionForm.department} onChange={e => setProvisionForm({ ...provisionForm, department: e.target.value })} placeholder="e.g. Design" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Duration (Months)</Label>
                      <Input type="number" value={provisionForm.duration_months} onChange={e => setProvisionForm({ ...provisionForm, duration_months: e.target.value })} placeholder="e.g. 6" />
                    </div>
                  </>
                )}
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
                        {t.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{t.description}</p>}

                        {/* Acceptance & Execution Details */}
                        <div className="mt-2 text-xs space-y-1 bg-slate-50 p-2.5 rounded-md border border-slate-200">
                          {t.accepted_at ? (
                            <div className="text-emerald-700 font-medium flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Accepted on {new Date(t.accepted_at).toLocaleString()}
                            </div>
                          ) : (
                            <div className="text-amber-700 font-medium">Not accepted yet</div>
                          )}
                          {t.progress_percentage !== undefined && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-bold text-slate-700">{t.progress_percentage}% Done</span>
                              <div className="h-1.5 w-24 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${t.progress_percentage}%` }} />
                              </div>
                            </div>
                          )}
                          {t.progress_notes && <p className="text-slate-600 italic mt-1">"Notes: {t.progress_notes}"</p>}
                          {t.project_requirements && <p className="text-slate-500 font-mono text-[10px] mt-1">Specs: {t.project_requirements}</p>}
                          {t.deliverable_url && (
                            <a href={t.deliverable_url} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline flex items-center gap-1 mt-1">
                              <FileText className="h-3 w-3" /> Deliverable: {t.deliverable_url}
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => setEditingTaskByAdmin(t)}>
                          Edit Task
                        </Button>
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
                        <span className="font-medium text-sm">{f.profiles?.full_name || "Unknown User" || f.intern_id || "Anonymous"}</span>
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

        {/* ── Expense Claims & Reimbursements Control ── */}
        <section className="rounded-xl border bg-white shadow-sm overflow-hidden mt-6">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-sm flex items-center gap-2"><CreditCard className="h-4 w-4 text-emerald-600" /> Expense Claims & Reimbursements</h2>
            <span className="text-xs text-slate-500 font-light">Manage employee expense claims</span>
          </div>
          <div className="divide-y max-h-[380px] overflow-y-auto">
            {expensesQ.isLoading ? (
              <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading expense claims...</div>
            ) : expensesQ.isError ? (
              <ErrorState message="Could not load expense claims." onRetry={() => expensesQ.refetch()} />
            ) : (expensesQ.data || []).length === 0 ? (
              <EmptyState icon={<CreditCard className="h-6 w-6" />} message="No expense claims submitted." />
            ) : (
              (expensesQ.data as any[]).map((exp: any) => (
                <div key={exp.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900 text-sm">{exp.title}</span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">₹{exp.amount}</span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">{exp.category}</span>
                      </div>
                      <div className="text-xs text-slate-500 font-light mt-0.5">
                        Claimed by: <span className="font-medium text-slate-800">{exp.profiles?.full_name || exp.user_id?.slice(0, 8)}</span> ({exp.profiles?.email}) • Date: {exp.date}
                      </div>
                      {exp.notes && <p className="text-xs text-slate-600 font-light mt-1.5">{exp.notes}</p>}
                      {exp.receipt_url && (
                        <a href={exp.receipt_url} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 hover:underline mt-1.5 inline-flex items-center gap-1">
                          <FileText className="h-3 w-3" /> View Uploaded Receipt
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${exp.status === 'approved' ? 'bg-blue-100 text-blue-800' : exp.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : exp.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                        {exp.status}
                      </span>
                      <div className="flex items-center gap-1">
                        {exp.status !== 'approved' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={async () => {
                            try {
                              await doUpdateExpenseStatus({ data: { id: exp.id, status: 'approved' } });
                              toast.success("Expense approved");
                              qc.invalidateQueries({ queryKey: ["admin-expenses"] });
                            } catch (err: any) { toast.error("Failed to update status"); }
                          }}>Approve</Button>
                        )}
                        {exp.status !== 'paid' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={async () => {
                            try {
                              await doUpdateExpenseStatus({ data: { id: exp.id, status: 'paid' } });
                              toast.success("Expense marked as paid");
                              qc.invalidateQueries({ queryKey: ["admin-expenses"] });
                            } catch (err: any) { toast.error("Failed to update status"); }
                          }}>Mark Paid</Button>
                        )}
                        {exp.status !== 'rejected' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-red-600 border-red-200 hover:bg-red-50" onClick={async () => {
                            try {
                              await doUpdateExpenseStatus({ data: { id: exp.id, status: 'rejected' } });
                              toast.success("Expense rejected");
                              qc.invalidateQueries({ queryKey: ["admin-expenses"] });
                            } catch (err: any) { toast.error("Failed to update status"); }
                          }}>Reject</Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── Helpdesk & IT/HR Tickets Control ── */}
        <section className="rounded-xl border bg-white shadow-sm overflow-hidden mt-6">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-sm flex items-center gap-2"><LifeBuoy className="h-4 w-4 text-blue-600" /> Helpdesk & IT/HR Tickets</h2>
            <span className="text-xs text-slate-500 font-light">Resolve employee support tickets</span>
          </div>
          <div className="divide-y max-h-[380px] overflow-y-auto">
            {ticketsQ.isLoading ? (
              <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading support tickets...</div>
            ) : ticketsQ.isError ? (
              <ErrorState message="Could not load support tickets." onRetry={() => ticketsQ.refetch()} />
            ) : (ticketsQ.data || []).length === 0 ? (
              <EmptyState icon={<LifeBuoy className="h-6 w-6" />} message="No support tickets raised." />
            ) : (
              (ticketsQ.data as any[]).map((tick: any) => (
                <div key={tick.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">#{tick.id.slice(0, 8).toUpperCase()}</span>
                        <span className="font-semibold text-slate-900 text-sm">{tick.subject}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700">{tick.category}</span>
                      </div>
                      <div className="text-xs text-slate-500 font-light mt-0.5">
                        Raised by: <span className="font-medium text-slate-800">{tick.profiles?.full_name || tick.user_id?.slice(0, 8)}</span> ({tick.profiles?.email}) • Priority: <span className="font-bold text-slate-800">{tick.priority}</span>
                      </div>
                      <p className="text-sm text-slate-700 font-light mt-2 leading-relaxed">{tick.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${tick.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : tick.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                        {tick.status}
                      </span>
                      <div className="flex items-center gap-1">
                        {tick.status !== 'in_progress' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={async () => {
                            try {
                              await doUpdateTicketStatus({ data: { id: tick.id, status: 'in_progress' } });
                              toast.success("Ticket set to In Progress");
                              qc.invalidateQueries({ queryKey: ["admin-tickets"] });
                            } catch (err: any) { toast.error("Failed to update status"); }
                          }}>In Progress</Button>
                        )}
                        {tick.status !== 'resolved' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={async () => {
                            try {
                              await doUpdateTicketStatus({ data: { id: tick.id, status: 'resolved' } });
                              toast.success("Ticket resolved");
                              qc.invalidateQueries({ queryKey: ["admin-tickets"] });
                            } catch (err: any) { toast.error("Failed to update status"); }
                          }}>Resolve</Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── Organization Peer Kudos & Shoutouts Feed ── */}
        <section className="rounded-xl border bg-white shadow-sm overflow-hidden mt-6">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-sm flex items-center gap-2"><Award className="h-4 w-4 text-amber-500" /> Peer Kudos & Appreciation Feed</h2>
          </div>
          <div className="divide-y max-h-[300px] overflow-y-auto">
            {kudosQ.isLoading ? (
              <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading kudos feed...</div>
            ) : (kudosQ.data || []).length === 0 ? (
              <EmptyState icon={<Award className="h-6 w-6" />} message="No peer kudos sent yet." />
            ) : (
              (kudosQ.data as any[]).map((kud: any) => (
                <div key={kud.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold text-xs">
                    <Award className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">{kud.badge}</span>
                      <span className="text-xs text-slate-400">• {new Date(kud.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-light mt-1.5 italic">"{kud.message}"</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
        
        {/* ── Manager & Mentor Oversight Dashboard ── */}
        <section className="rounded-xl border bg-white shadow-sm overflow-hidden mt-6">
          <div className="px-5 py-4 border-b flex items-center justify-between bg-slate-900 text-white">
            <h2 className="font-semibold text-sm flex items-center gap-2"><GraduationCap className="h-4 w-4 text-emerald-400" /> Manager & Mentor Oversight Dashboard</h2>
            <span className="text-xs text-slate-400">Multi-Intern Batch Approvals & Performance Oversight</span>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Daily Standups Approval */}
              <div className="rounded-xl border bg-slate-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-blue-600" /> Daily Standups Review</h3>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{(standupsAdminQ.data || []).length} Logs</span>
                </div>
                <div className="divide-y max-h-[220px] overflow-y-auto bg-white rounded-lg border p-2 text-xs">
                  {(standupsAdminQ.data || []).length === 0 ? (
                    <div className="p-4 text-center text-slate-400">No standup logs to review</div>
                  ) : (
                    (standupsAdminQ.data as any[]).slice(0, 5).map((s: any) => (
                      <div key={s.id} className="py-2 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 truncate">{s.profiles?.full_name || "Intern"}</div>
                          <div className="text-[10px] text-slate-400 truncate">{s.did_today}</div>
                        </div>
                        {s.status !== 'approved' ? (
                          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={async () => {
                            await doUpdateStandupStatus({ data: { id: s.id, status: 'approved' } });
                            toast.success("Standup approved");
                            qc.invalidateQueries({ queryKey: ["admin-standups"] });
                          }}>Approve</Button>
                        ) : (
                          <span className="text-[9px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Approved</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Deliverable Review */}
              <div className="rounded-xl border bg-slate-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-purple-600" /> Deliverables Review</h3>
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{(deliverablesAdminQ.data || []).length} Submissions</span>
                </div>
                <div className="divide-y max-h-[220px] overflow-y-auto bg-white rounded-lg border p-2 text-xs">
                  {(deliverablesAdminQ.data || []).length === 0 ? (
                    <div className="p-4 text-center text-slate-400">No deliverables to review</div>
                  ) : (
                    (deliverablesAdminQ.data as any[]).slice(0, 5).map((d: any) => (
                      <div key={d.id} className="py-2 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 truncate">{d.title}</div>
                          <div className="text-[10px] text-slate-400 truncate">{d.profiles?.full_name || "Intern"}</div>
                        </div>
                        {d.status !== 'approved' ? (
                          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-purple-600 border-purple-200 hover:bg-purple-50" onClick={async () => {
                            await doUpdateDeliverableStatus({ data: { id: d.id, status: 'approved', feedback: 'Great work! Approved by Manager.' } });
                            toast.success("Deliverable approved");
                            qc.invalidateQueries({ queryKey: ["admin-deliverables"] });
                          }}>Approve</Button>
                        ) : (
                          <span className="text-[9px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Approved</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Tooling Access Provisioning */}
              <div className="rounded-xl border bg-slate-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-emerald-600" /> Tooling & Access Requests</h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{(accessRequestsAdminQ.data || []).length} Requests</span>
                </div>
                <div className="divide-y max-h-[220px] overflow-y-auto bg-white rounded-lg border p-2 text-xs">
                  {(accessRequestsAdminQ.data || []).length === 0 ? (
                    <div className="p-4 text-center text-slate-400">No tooling access requests</div>
                  ) : (
                    (accessRequestsAdminQ.data as any[]).slice(0, 5).map((a: any) => (
                      <div key={a.id} className="py-2 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 truncate">{a.tool_name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{a.profiles?.full_name || "Intern"}</div>
                        </div>
                        {a.status !== 'provisioned' ? (
                          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={async () => {
                            await doUpdateAccessRequestStatus({ data: { id: a.id, status: 'provisioned' } });
                            toast.success("Access provisioned");
                            qc.invalidateQueries({ queryKey: ["admin-access-requests"] });
                          }}>Provision</Button>
                        ) : (
                          <span className="text-[9px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Provisioned</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Email Automation & Promotional Campaign Engine ── */}
        <EmailAutomationHub 
          emailLogsQ={emailLogsQ} 
          doSendPromotionalEmail={doSendPromotionalEmail} 
          doDeleteAutomatedEmailLog={doDeleteAutomatedEmailLog} 
          qc={qc} 
        />
      </main>
      
      {/* ── User Profile Drawer / Dialog ── */}
      <UserProfileDialog 
        user={selectedUser} 
        open={!!selectedUser} 
        onOpenChange={(open: boolean) => !open && setSelectedUser(null)} 
        doUpdateProfile={doUpdateProfile} 
        doGetUploadUrl={doGetUploadUrl} 
        qc={qc} 
        team={team}
        doAssignIntern={doAssignIntern}
        doRemoveIntern={doRemoveIntern}
      />

      {/* ── Google Docs / Sheets & Spreadsheet Viewer Modal ── */}
      {viewingDoc && (
        <GoogleDocViewerModal
          url={viewingDoc.url}
          title={viewingDoc.title}
          isOpen={!!viewingDoc}
          onClose={() => setViewingDoc(null)}
        />
      )}
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

function UserProfileDialog({ user, open, onOpenChange, doUpdateProfile, doGetUploadUrl, qc, team, doAssignIntern, doRemoveIntern }: any) {
  const [selectedInternToAssign, setSelectedInternToAssign] = useState("");
  const [form, setForm] = useState(user || {});
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLetter, setUploadingLetter] = useState(false);

  useEffect(() => {
    if (user) setForm(user);
  }, [user]);

  if (!user) return null;

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    const cleanValue = (val: string | undefined | null) => (val === "" ? null : val);
    
    try {
      await doUpdateProfile({ data: { 
        id: user.id, 
        full_name: cleanValue(form.full_name),
        phone: cleanValue(form.phone),
        address: cleanValue(form.address),
        intern_id: cleanValue(form.intern_id),
        start_date: cleanValue(form.start_date),
        end_date: cleanValue(form.end_date),
        avatar_url: cleanValue(form.avatar_url),
        offer_letter_url: cleanValue(form.offer_letter_url),
        blood_group: cleanValue(form.blood_group),
        security_level: cleanValue(form.security_level),
        emergency_contact: cleanValue(form.emergency_contact),
        bank_details: cleanValue(form.bank_details),
        department: cleanValue(form.department)
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
             <div className="space-y-1.5"><Label>{user.role === "employee" ? "Employee ID" : "Intern ID"}</Label><Input value={form.intern_id || ""} onChange={e => setForm({...form, intern_id: e.target.value})} /></div>
             <div className="space-y-1.5"><Label>Blood Group</Label><Input value={form.blood_group || ""} onChange={e => setForm({...form, blood_group: e.target.value})} placeholder="e.g. O+ Positive" /></div>
             <div className="space-y-1.5"><Label>Security Clearance</Label><Input value={form.security_level || ""} onChange={e => setForm({...form, security_level: e.target.value})} placeholder="e.g. L3 - Enterprise Access" /></div>
             <div className="space-y-1.5"><Label>Emergency Contact</Label><Input value={form.emergency_contact || ""} onChange={e => setForm({...form, emergency_contact: e.target.value})} placeholder="e.g. +91 98765 00000" /></div>
             <div className="space-y-1.5"><Label>Department</Label><Input value={form.department || ""} onChange={e => setForm({...form, department: e.target.value})} placeholder="e.g. Engineering & IT" /></div>
             <div className="col-span-2 space-y-1.5"><Label>Bank & Financial Details</Label><Input value={form.bank_details || ""} onChange={e => setForm({...form, bank_details: e.target.value})} placeholder="e.g. Kotak Mahindra Bank · A/C 882101923 · IFSC: KKBK0001823" /></div>
             <div className="space-y-1.5"><Label>Start Date</Label><Input type="date" value={form.start_date || ""} onChange={e => setForm({...form, start_date: e.target.value})} /></div>
             <div className="space-y-1.5"><Label>End Date</Label><Input type="date" value={form.end_date || ""} onChange={e => setForm({...form, end_date: e.target.value})} /></div>
          </div>
          
          <div className="space-y-1.5">
            <Label>Avatar</Label>
            <div className="flex gap-2">
              <Input value={form.avatar_url || ""} onChange={e => setForm({...form, avatar_url: e.target.value})} placeholder="https://example.com/image.png" />
              <div className="relative shrink-0">
                <Button type="button" variant="outline" disabled={uploadingAvatar} className="w-[100px]">
                  {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload"}
                </Button>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "avatar"); }} />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Offer Letter</Label>
            <div className="flex gap-2">
              <Input value={form.offer_letter_url || ""} onChange={e => setForm({...form, offer_letter_url: e.target.value})} placeholder="https://example.com/letter.pdf" />
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

          {user.role === "employee" && team && (
            <div className="border-t pt-4 mt-4 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <GraduationCap className="h-4.5 w-4.5 text-emerald-600" />
                  Assigned Interns
                </h4>
                <p className="text-xs text-slate-400 font-light mt-0.5">Manage interns mentored/supervised by this employee.</p>
              </div>

              {/* List of currently assigned interns */}
              <div className="space-y-2">
                {team.filter((m: any) => m.role === "intern" && m.mentor_id === user.id).length === 0 ? (
                  <div className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-dashed text-center">
                    No interns assigned to this employee.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {team.filter((m: any) => m.role === "intern" && m.mentor_id === user.id).map((intern: any) => (
                      <div key={intern.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="flex items-center gap-2 min-w-0">
                          <div 
                            className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 bg-cover bg-center"
                            style={intern.avatar_url ? { backgroundImage: `url(${intern.avatar_url})` } : {}}
                          >
                            {!intern.avatar_url && (intern.full_name || "?")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate text-slate-700">{intern.full_name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{intern.email}</div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (confirm(`Remove ${intern.full_name} from this mentor?`)) {
                              try {
                                await doRemoveIntern({ data: { internId: intern.id } });
                                toast.success("Intern removed successfully");
                                qc.invalidateQueries({ queryKey: ["team-members"] });
                              } catch (err: any) {
                                toast.error("Failed to remove intern");
                              }
                            }
                          }}
                          className="h-7 px-2 text-[10px] font-semibold text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dropdown to assign a new intern */}
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Assign a new Intern</Label>
                  <Select 
                    value={selectedInternToAssign} 
                    onValueChange={setSelectedInternToAssign}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-100 rounded-xl h-10">
                      <SelectValue placeholder="Select an intern..." />
                    </SelectTrigger>
                    <SelectContent>
                      {team.filter((m: any) => m.role === "intern" && m.mentor_id !== user.id).length === 0 ? (
                        <SelectItem value="none" disabled>No other interns available</SelectItem>
                      ) : (
                        team
                          .filter((m: any) => m.role === "intern" && m.mentor_id !== user.id)
                          .map((intern: any) => (
                            <SelectItem key={intern.id} value={intern.id}>
                              {intern.full_name} ({intern.email})
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  disabled={!selectedInternToAssign || selectedInternToAssign === "none"}
                  onClick={async () => {
                    try {
                      await doAssignIntern({ data: { internId: selectedInternToAssign, employeeId: user.id } });
                      toast.success("Intern assigned successfully");
                      setSelectedInternToAssign("");
                      qc.invalidateQueries({ queryKey: ["team-members"] });
                    } catch (err: any) {
                      toast.error("Failed to assign intern");
                    }
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-10 px-4 font-semibold text-xs border-0 shrink-0"
                >
                  Assign Intern
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4">
             <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
             <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EmailAutomationHub({ emailLogsQ, doSendPromotionalEmail, doDeleteAutomatedEmailLog, qc }: any) {
  const [inputText, setInputText] = useState("");
  const [subjectText, setSubjectText] = useState("Invitation: 2026 Official Internship Program — Vyntyra Consultancy Services");
  const [recipients, setRecipients] = useState<{ email: string; name: string; university: string }[]>([]);
  
  // Campaign automation state
  const [isAutomating, setIsAutomating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [activeStatus, setActiveStatus] = useState("Idle");

  // Log table filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Download Sample CSV Audience Template
  function downloadCsvTemplate() {
    const csvContent = `Email Address, Candidate Name, University / Organization\njamianil37@gmail.com, Jami Eswar Anil Kumar, Andhra University\npriya.sharma@iitm.ac.in, Priya Sharma, IIT Madras\nrahul.verma@bits.ac.in, Rahul Verma, BITS Pilani\n`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Vyntyra_Internship_Email_Audience_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloaded CSV Audience Template!");
  }

  // Parse text or files into recipients
  function handleParse(text: string) {
    const extracted = extractEmails(text);
    setRecipients(extracted);
    if (extracted.length > 0) {
      toast.success(`Extracted ${extracted.length} recipient records with details!`);
    } else {
      toast.error("No valid email addresses found in the input.");
    }
  }

  function extractEmails(raw: string) {
    const lines = raw.split(/[\r\n]+/);
    const list: { email: string; name: string; university: string }[] = [];
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      const emailMatch = line.match(emailRegex);
      if (emailMatch) {
        const email = emailMatch[0].toLowerCase().trim();

        // Split line by comma, tab, or pipe to parse: Email, Name, University / Organization
        const parts = line.split(/[,;\t|]+/).map((p) => p.replace(/[<>"']/g, "").trim());
        let name = "";
        let university = "";

        const emailIdx = parts.findIndex((p) => p.toLowerCase().includes(email));
        if (emailIdx !== -1) {
          const otherParts = parts.filter((_, idx) => idx !== emailIdx && _ !== "");
          if (otherParts.length >= 1) name = otherParts[0];
          if (otherParts.length >= 2) university = otherParts[1];
        }

        if (!name) {
          name = email.split("@")[0];
        }

        list.push({ email, name, university });
      }
    }
    return list;
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setInputText(content);
        handleParse(content);
      }
    };
    reader.readAsText(file);
  }

  // Automation Runner
  useEffect(() => {
    let timer: any;
    if (isAutomating && !isPaused && currentIndex < recipients.length) {
      const currentItem = recipients[currentIndex];
      setActiveStatus(`Sending to ${currentItem.email}...`);

      doSendPromotionalEmail({
        data: {
          recipient_email: currentItem.email,
          recipient_name: currentItem.name,
          university_name: currentItem.university,
          custom_subject: subjectText,
        }
      })
      .then(() => {
        setSentCount((prev) => prev + 1);
        qc.invalidateQueries({ queryKey: ["admin-email-logs"] });
      })
      .catch((err: any) => {
        setFailedCount((prev) => prev + 1);
        toast.error(`Failed sending to ${currentItem.email}: ${err.message}`);
      })
      .finally(() => {
        // 5-second rate limit countdown
        setCountdown(5);
        let secondsLeft = 5;
        const countdownInterval = setInterval(() => {
          secondsLeft -= 1;
          setCountdown(secondsLeft);
          if (secondsLeft <= 0) {
            clearInterval(countdownInterval);
            setCurrentIndex((prev) => prev + 1);
          }
        }, 1000);
      });
    } else if (isAutomating && currentIndex >= recipients.length && recipients.length > 0) {
      setIsAutomating(false);
      setActiveStatus("Campaign Completed");
      toast.success(`Bulk Email Campaign finished! Sent: ${sentCount}, Failed: ${failedCount}`);
    }
    return () => clearTimeout(timer);
  }, [isAutomating, isPaused, currentIndex]);

  function startAutomation() {
    if (recipients.length === 0) {
      toast.error("Please add or upload recipient email addresses first!");
      return;
    }
    setIsAutomating(true);
    setIsPaused(false);
    setActiveStatus("Starting campaign...");
    toast.info("Started Automated Email Campaign (5s delay per email)");
  }

  function pauseAutomation() {
    setIsPaused(true);
    setActiveStatus("Paused");
    toast.info("Campaign paused.");
  }

  function resumeAutomation() {
    setIsPaused(false);
    toast.info("Campaign resumed.");
  }

  function stopAutomation() {
    setIsAutomating(false);
    setIsPaused(false);
    setCurrentIndex(0);
    setSentCount(0);
    setFailedCount(0);
    setCountdown(0);
    setActiveStatus("Stopped");
    toast.warning("Campaign stopped.");
  }

  // Filter logs
  const rawLogs: any[] = emailLogsQ.data || [];
  const filteredLogs = rawLogs.filter((log: any) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (log.recipient_email || "").toLowerCase().includes(searchLower) ||
                          (log.recipient_name || "").toLowerCase().includes(searchLower) ||
                          (log.university_name || "").toLowerCase().includes(searchLower) ||
                          (log.subject || "").toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-8">
      {/* Banner */}
      <div className="bg-slate-900 text-white px-6 py-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" /> Resend High-Deliverability Inbox Engine
          </div>
          <h2 className="text-xl font-bold mt-1 text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-emerald-400" /> Automated Email Campaign Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Automate bulk promotional internship invitations to up to <strong>1,000 email addresses</strong> with a mandatory <strong>5-second delay per email</strong> to ensure inbox delivery, prevent spam folder flagging, and align with SPF/DKIM verification standards.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60 text-xs">
          <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
          <div>
            <div className="text-slate-300 font-medium">Auto Rate Limit</div>
            <div className="text-emerald-400 font-bold">5s Interval Delay</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Recipient Extraction Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-emerald-600" /> Upload Excel / CSV or Paste Email, Name, University
              </label>
              <span className="text-xs text-slate-400 font-mono">Up to 1,000 Emails</span>
            </div>

            <Textarea 
              rows={5}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                handleParse(e.target.value);
              }}
              placeholder={`Paste format: Email Address, Candidate Name, University / Organization\ne.g.\njamianil37@gmail.com, Jami Eswar Anil Kumar, Andhra University\npriya.sharma@iitm.ac.in, Priya Sharma, IIT Madras`}
              className="font-mono text-xs p-3 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-xs">
                  <UploadCloud className="h-4 w-4 text-emerald-600" /> Upload Excel / CSV
                  <input type="file" accept=".csv,.xlsx,.xls,.txt" onChange={handleFileUpload} className="hidden" />
                </label>

                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadCsvTemplate}
                  className="text-xs gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <Download className="h-3.5 w-3.5" /> Download CSV Template
                </Button>

                <Button variant="ghost" size="sm" onClick={() => handleParse(inputText)} className="text-xs text-slate-600 hover:text-slate-900">
                  Re-Parse Input
                </Button>
              </div>

              <div className="text-xs font-semibold text-slate-700 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Extracted Audience: <strong className="text-emerald-900 font-bold">{recipients.length} Recipients</strong>
              </div>
            </div>
          </div>

          {/* Campaign Subject & Template Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                Campaign Subject Line
              </label>
              <Input 
                value={subjectText} 
                onChange={(e) => setSubjectText(e.target.value)} 
                placeholder="Exclusive Internship Opportunity 2026..."
                className="text-xs rounded-xl border-slate-200"
              />
            </div>

            {/* Template Specs */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2.5 text-xs text-slate-700">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Verified High-Inbox Template Features:
              </div>
              <ul className="space-y-1.5 text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <strong>Format:</strong> Email, Name, University / Organization
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <strong>Apply CTA:</strong> "Apply For Internship" button linking to Careers portal
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <strong>Official Contact:</strong> internships@vyntyraconsultancyservices.in
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <strong>Anti-Spam Standards:</strong> Clean HTML-to-text ratio & DKIM signed header
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Live Automation Controls & Progress Engine */}
        <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-6 space-y-4 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase font-bold tracking-widest text-emerald-400">Live Campaign Controller</div>
              <div className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                Status: <span className="text-emerald-400">{activeStatus}</span>
                {isAutomating && !isPaused && <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isAutomating ? (
                <Button 
                  onClick={startAutomation} 
                  disabled={recipients.length === 0}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all gap-2 text-xs"
                >
                  <Play className="h-4 w-4 fill-slate-950" /> Start 5s Delay Campaign ({recipients.length})
                </Button>
              ) : isPaused ? (
                <Button 
                  onClick={resumeAutomation} 
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs gap-2"
                >
                  <Play className="h-4 w-4 fill-slate-950" /> Resume Campaign
                </Button>
              ) : (
                <Button 
                  onClick={pauseAutomation} 
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs gap-2"
                >
                  <Pause className="h-4 w-4 fill-slate-950" /> Pause Campaign
                </Button>
              )}

              {isAutomating && (
                <Button 
                  onClick={stopAutomation} 
                  variant="outline" 
                  className="border-rose-500 text-rose-400 hover:bg-rose-950/40 text-xs px-4 py-2.5 rounded-xl gap-1.5"
                >
                  <Square className="h-3.5 w-3.5 fill-rose-400" /> Stop Campaign
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
              <span>
                Progress: <strong>{currentIndex}</strong> / {recipients.length} ({recipients.length > 0 ? Math.round((currentIndex / recipients.length) * 100) : 0}%)
              </span>
              {isAutomating && countdown > 0 && (
                <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 animate-spin" /> Next email in {countdown}s
                </span>
              )}
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500 ease-out" 
                style={{ width: `${recipients.length > 0 ? (currentIndex / recipients.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Campaign Metrics */}
          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-800 text-center text-xs">
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-400">Total Queued</div>
              <div className="text-base font-bold text-white mt-0.5">{recipients.length}</div>
            </div>
            <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-900/50">
              <div className="text-emerald-400">Successfully Sent</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">{sentCount}</div>
            </div>
            <div className="bg-rose-950/40 p-3 rounded-xl border border-rose-900/50">
              <div className="text-rose-400">Failed / Errors</div>
              <div className="text-base font-bold text-rose-400 mt-0.5">{failedCount}</div>
            </div>
          </div>
        </div>

        {/* ── Sent Emails Log Management Table ── */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden space-y-4">
          <div className="p-5 border-b bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-600" /> Sent Emails Log Management
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Track all sent promotional email dispatches with recipient email, name, university/organization, sent date, sent time, email ID, and delivery status.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search email, name, university..."
                  className="pl-8 text-xs h-8 w-56 rounded-lg border-slate-200"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs w-32 rounded-lg border-slate-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={() => emailLogsQ.refetch()} className="h-8 text-xs gap-1.5">
                <RefreshCw className={`h-3.5 w-3.5 ${emailLogsQ.isFetching ? "animate-spin" : ""}`} /> Refresh Log
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/70 text-slate-700 uppercase tracking-wider font-semibold border-b text-[10px]">
                <tr>
                  <th className="px-5 py-3">Recipient Email</th>
                  <th className="px-5 py-3">Recipient Name</th>
                  <th className="px-5 py-3">University / Organization</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Sent Date</th>
                  <th className="px-5 py-3">Sent Time</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Resend ID</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {emailLogsQ.isLoading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> Loading sent email logs...
                      </div>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No sent email logs found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log: any) => {
                    const dateObj = new Date(log.sent_at || log.created_at);
                    const sentDate = dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
                    const sentTime = dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900">{log.recipient_email}</td>
                        <td className="px-5 py-3.5 text-slate-600">{log.recipient_name || "—"}</td>
                        <td className="px-5 py-3.5 text-slate-600">{log.university_name || "—"}</td>
                        <td className="px-5 py-3.5 text-slate-700 max-w-xs truncate" title={log.subject}>{log.subject}</td>
                        <td className="px-5 py-3.5 text-slate-600 font-mono">{sentDate}</td>
                        <td className="px-5 py-3.5 text-slate-600 font-mono">{sentTime}</td>
                        <td className="px-5 py-3.5">
                          {log.status === "sent" ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Sent
                            </span>
                          ) : (
                            <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> Failed
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[10px] text-slate-500" title={log.resend_id || ""}>
                          {log.resend_id ? log.resend_id.slice(0, 14) + "..." : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            onClick={async () => {
                              try {
                                await doDeleteAutomatedEmailLog({ data: { id: log.id } });
                                toast.success("Log deleted");
                                qc.invalidateQueries({ queryKey: ["admin-email-logs"] });
                              } catch (e) {
                                toast.error("Failed to delete log");
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
