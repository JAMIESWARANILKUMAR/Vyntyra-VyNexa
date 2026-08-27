import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2, Plus, Mail, ClipboardList, Calendar, Trash2, Users,
  ShieldAlert, Loader2, AlertCircle, UserCheck, UserX, Clock,
  CheckCircle2, Circle, AlertTriangle, ChevronDown, ArrowLeft,
  Shield, GraduationCap, Briefcase, CalendarDays, RefreshCw,
  Video, FileText, UploadCloud, MessageSquare, CreditCard, LifeBuoy, Award,
  Play, Pause, Square, Search, ExternalLink, ShieldCheck, Download, Send, MessageCircle, Key,
  PartyPopper, LayoutDashboard, Layers, FolderOpen, Megaphone, DollarSign,
  CalendarPlus, Share2, Copy, Check, Pencil, Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listTeamMembers, provisionUser, revokeUser,
  listAnnouncements, createAnnouncement, deleteAnnouncement,
  listTasks, createTask, deleteTask,
  listSchedules, createSchedule, deleteSchedule,
  listMeetings, createMeeting, deleteMeeting, updateMeeting,
  listResources, createResource, deleteResource,
  getPresignedUrl, updateUserProfile, listFeedbacks, markFeedbackRead, listKudos,
  listAllLeaves, updateLeaveStatus, listAllAttendance, listAllPayouts, createPayout, updatePayoutStatus,
  assignIntern, removeIntern, adminResetPassword,
  listAllExpenses, updateExpenseStatus, listAllSupportTickets, updateSupportTicketStatus,
  listAllStandups, updateStandupStatus, listAllDeliverables, updateDeliverableStatus,
  listAllAccessRequests, updateAccessRequestStatus, updateTaskByAdmin,
  listLeads, createLead, updateLeadStatus, deleteLead,
  listBugs, createBug, updateBugStatus,
  sendPromotionalInternshipEmail, listAutomatedEmailLogs, deleteAutomatedEmailLog, getEmailQuotaStats, getPromotionalEmailConversionStats,
  sendSmsNotification, getSmsQuotaStats, listSmsLogs, deleteSmsLog,
  listAllSupportQueries, assignSupportQueryEmployee, approveSupportMeeting,
  deleteStoredOfferLetterAndRegenerate, deleteStoredNocAndRegenerate, deleteStoredOfferLetter, deleteStoredNoc,
  listHolidays, createHoliday, deleteHoliday, updateHoliday, type HolidayItem
} from "@/lib/operations.functions";
import { localDateTimeToIso, isoToLocalDateTimeInput, formatDateTimeDisplay, generateGoogleCalendarUrl, formatMeetingTimeRange } from "@/lib/date-utils";
import { sendPaymentReminderEmail, generatePaymentReminderWhatsApp } from "@/lib/notifications-omni.functions";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { GoogleDocViewerModal } from "@/components/google-doc-viewer-modal";
import EmailAutomationHub from "@/components/email-automation-hub";
import { SmartAvatar } from "@/components/SmartAvatar";
import { AdminInternTasksView } from "@/components/admin-intern-tasks-view";
import { MonthlyCalendar } from "@/components/monthly-calendar";
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
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: (search.tab as string) || "overview",
  }),
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
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();
  const [activeTab, setActiveTab] = useState<string>((searchParams as any)?.tab || "overview");

  useEffect(() => {
    if ((searchParams as any)?.tab && (searchParams as any).tab !== activeTab) {
      setActiveTab((searchParams as any).tab);
    }
  }, [(searchParams as any)?.tab]);

  const switchTab = (tab: string) => {
    setActiveTab(tab);
    navigate({ search: { tab }, replace: true });
  };

  // Server functions
  const fetchHolidays = useServerFn(listHolidays);
  const doCreateHoliday = useServerFn(createHoliday);
  const doDeleteHoliday = useServerFn(deleteHoliday);
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
  const doUpdateMeeting = useServerFn(updateMeeting);
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
  const doUpdatePayoutStatus = useServerFn(updatePayoutStatus);
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
  const [scheduleForm, setScheduleForm] = useState({ title: "", description: "", event_date: "", event_time: "", target_role: "all" as "employee" | "intern" | "all" | "individual", target_user_id: "" });
  const [meetingForm, setMeetingForm] = useState({
    title: "",
    description: "",
    meeting_link: "",
    date: new Date().toISOString().split("T")[0],
    from_time: "10:00",
    to_time: "10:45",
    target_role: "all" as "employee" | "intern" | "all" | "individual",
    target_user_id: "",
    send_email_notification: true,
  });
  const [editMeetingModalOpen, setEditMeetingModalOpen] = useState(false);
  const [editMeetingForm, setEditMeetingForm] = useState({
    id: "",
    title: "",
    description: "",
    meeting_link: "",
    date: "",
    from_time: "10:00",
    to_time: "10:45",
    target_role: "all" as "employee" | "intern" | "all" | "individual",
    target_user_id: "",
    send_email_notification: false,
  });
  const [isUpdatingMeeting, setIsUpdatingMeeting] = useState(false);
  const [resourceForm, setResourceForm] = useState({ title: "", type: "document" as "document" | "video" | "link" | "template" | "guide", description: "", target_role: "all" as "employee" | "intern" | "all" | "individual", target_user_id: "" });
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
  const [showAttendanceLogs, setShowAttendanceLogs] = useState(false);

  const [selectedQueryForResolver, setSelectedQueryForResolver] = useState<any>(null);
  const [selectedResolverEmployeeId, setSelectedResolverEmployeeId] = useState<string>("");
  const [selectedQueryForMeeting, setSelectedQueryForMeeting] = useState<any>(null);
  const [meetingTimeInput, setMeetingTimeInput] = useState<string>("");

  const fetchAllSupportQueries = useServerFn(listAllSupportQueries);
  const doAssignSupportQueryEmployee = useServerFn(assignSupportQueryEmployee);
  const doApproveSupportMeeting = useServerFn(approveSupportMeeting);

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
  
  const supportQueriesQ = useQuery({ queryKey: ["admin-support-queries"], queryFn: () => fetchAllSupportQueries(), staleTime: 0, refetchInterval: 4000 });
  const supportQueries: any[] = supportQueriesQ.data || [];
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

  const fetchSmsLogsList = useServerFn(listSmsLogs);
  const doSendSms = useServerFn(sendSmsNotification);
  const doDeleteSmsLog = useServerFn(deleteSmsLog);

  const leadsAdminQ = useQuery({ queryKey: ["admin-leads"], queryFn: () => fetchLeads(), ...queryOpts });
  const bugsAdminQ = useQuery({ queryKey: ["admin-bugs"], queryFn: () => fetchBugs(), ...queryOpts });
  const emailLogsQ = useQuery({ queryKey: ["admin-email-logs"], queryFn: () => fetchEmailLogs(), staleTime: 0, refetchInterval: 4000 });
  const smsLogsQ = useQuery({ queryKey: ["sms-logs"], queryFn: () => fetchSmsLogsList(), staleTime: 0, refetchInterval: 4000 });

  const standupsAdminQ = useQuery({ queryKey: ["admin-standups"], queryFn: () => fetchAllStandups(), ...queryOpts });
  const deliverablesAdminQ = useQuery({ queryKey: ["admin-deliverables"], queryFn: () => fetchAllDeliverables(), ...queryOpts });
  const accessRequestsAdminQ = useQuery({ queryKey: ["admin-access-requests"], queryFn: () => fetchAllAccessRequests(), ...queryOpts });

  const kudosQ = useQuery({ queryKey: ["admin-kudos"], queryFn: () => fetchKudos(), ...queryOpts });

  const leavesQ = useQuery({ queryKey: ["admin-leaves"], queryFn: () => fetchAllLeaves(), staleTime: 0, refetchInterval: 4000 });
  const attendanceQ = useQuery({ queryKey: ["admin-attendance"], queryFn: () => fetchAllAttendance(), staleTime: 0, refetchInterval: 4000 });
  const payoutsQ = useQuery({ queryKey: ["admin-payouts"], queryFn: () => fetchAllPayouts(), staleTime: 0, refetchInterval: 4000 });
  const holidaysQ = useQuery({ queryKey: ["admin-holidays"], queryFn: () => fetchHolidays(), ...queryOpts });

  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ name: "", date: "", type: "public" as "public" | "company" | "festive" | "optional", description: "", is_recurring: false });
  const [isSavingHoliday, setIsSavingHoliday] = useState(false);

  async function handleCreateHolidaySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!holidayForm.name || !holidayForm.date) {
      toast.error("Please enter holiday title and date.");
      return;
    }
    setIsSavingHoliday(true);
    try {
      await doCreateHoliday({ data: holidayForm });
      toast.success("Holiday added to official calendar!");
      setHolidayModalOpen(false);
      setHolidayForm({ name: "", date: "", type: "public", description: "", is_recurring: false });
      qc.invalidateQueries({ queryKey: ["admin-holidays"] });
    } catch (err: any) {
      toast.error("Failed to save holiday: " + err.message);
    } finally {
      setIsSavingHoliday(false);
    }
  }

  async function handleDeleteHoliday(id: string, name: string) {
    if (!confirm(`Delete holiday "${name}"?`)) return;
    try {
      await doDeleteHoliday({ data: { id } });
      toast.success("Holiday removed.");
      qc.invalidateQueries({ queryKey: ["admin-holidays"] });
    } catch (err: any) {
      toast.error("Failed to delete holiday: " + err.message);
    }
  }

  const team: any[] = teamQ.data || [];
  const employees = team.filter((m: any) => m.role === "employee");
  const interns = team.filter((m: any) => m.role === "intern");

  const [attendanceRoleFilter, setAttendanceRoleFilter] = useState<"all" | "employee" | "intern">("all");

  const processedTeamAttendance = useMemo(() => {
    const nonAdminTeam = team.filter((m: any) => m.role !== "admin" && m.role !== "super_admin");
    return nonAdminTeam.map((member: any) => {
      const memberAttendance = (attendanceQ.data || []).filter((a: any) => {
        if (!a) return false;
        if (a.user_id === member.id || a.user_id === member.user_id) return true;
        if (member.email && a.profiles?.email && a.profiles.email.toLowerCase() === member.email.toLowerCase()) return true;
        if (member.email && a.email && a.email.toLowerCase() === member.email.toLowerCase()) return true;
        return false;
      });
      const totalAttendance = memberAttendance.length;

      const todayStr = new Date().toISOString().split('T')[0];
      const todayDateStr = new Date().toDateString();
      const todayLog = memberAttendance.find((a: any) => {
        if (a.date === todayStr) return true;
        if (a.clock_in && new Date(a.clock_in).toDateString() === todayDateStr) return true;
        return false;
      });

      let activeStatus: "Active" | "Offline" | "Completed" = "Offline";
      let clockInTime = "â€”";
      let clockOutTime = "â€”";

      if (todayLog) {
        clockInTime = todayLog.clock_in ? new Date(todayLog.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "â€”";
        clockOutTime = todayLog.clock_out ? new Date(todayLog.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "â€”";
        
        if (todayLog.clock_in && !todayLog.clock_out) {
          activeStatus = "Active";
        } else if (todayLog.clock_in && todayLog.clock_out) {
          activeStatus = "Completed";
        }
      }

      let remainingDays = "â€”";
      if (member.end_date) {
        const end = new Date(member.end_date).getTime();
        const diff = end - Date.now();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        remainingDays = days > 0 ? `${days} Days` : "Ended";
      }

      const completedTasks = (tasksQ.data || []).filter((t: any) => t.assigned_to === member.id && t.status === "completed").length;

      return {
        ...member,
        totalAttendance,
        activeStatus,
        clockInTime,
        clockOutTime,
        remainingDays,
        completedTasks,
        attendance: memberAttendance
      };
    });
  }, [team, attendanceQ.data, tasksQ.data]);

  const filteredAttendance = useMemo(() => {
    if (attendanceRoleFilter === "all") return processedTeamAttendance;
    return processedTeamAttendance.filter((m: any) => m.role === attendanceRoleFilter);
  }, [processedTeamAttendance, attendanceRoleFilter]);

  const processedInternAttendance = processedTeamAttendance.filter((m: any) => m.role === "intern");

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
      setScheduleForm({ title: "", description: "", event_date: "", event_time: "", target_role: "all", target_user_id: "" });
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
      if (!meetingForm.title || !meetingForm.meeting_link || !meetingForm.date || !meetingForm.from_time) {
        toast.error("Please fill in meeting title, link, date, and from-time.");
        return;
      }

      // Build start and end ISO timestamps
      const startIso = new Date(`${meetingForm.date}T${meetingForm.from_time}:00`).toISOString();
      let endIso = meetingForm.to_time ? new Date(`${meetingForm.date}T${meetingForm.to_time}:00`).toISOString() : null;

      // Calculate duration
      let durationMins = 30;
      if (endIso) {
        const diffMs = new Date(endIso).getTime() - new Date(startIso).getTime();
        if (diffMs > 0) {
          durationMins = Math.round(diffMs / (60 * 1000));
        } else {
          endIso = new Date(new Date(startIso).getTime() + 30 * 60 * 1000).toISOString();
        }
      }

      let cleanLink = meetingForm.meeting_link.trim();
      if (!/^https?:\/\//i.test(cleanLink)) {
        cleanLink = `https://${cleanLink}`;
      }

      await doCreateMeeting({
        data: {
          title: meetingForm.title.trim(),
          description: meetingForm.description || null,
          meeting_link: cleanLink,
          scheduled_at: startIso,
          end_at: endIso,
          duration_minutes: durationMins,
          target_role: meetingForm.target_role,
          target_user_id: meetingForm.target_role === "individual" && meetingForm.target_user_id ? meetingForm.target_user_id : null,
          send_email_notification: meetingForm.send_email_notification,
        }
      });

      toast.success(
        meetingForm.send_email_notification
          ? "Meeting scheduled & automated email invitations dispatched!"
          : "Meeting scheduled successfully!"
      );
      setMeetingOpen(false);
      setMeetingForm({
        title: "",
        description: "",
        meeting_link: "",
        date: new Date().toISOString().split("T")[0],
        from_time: "10:00",
        to_time: "10:45",
        target_role: "all",
        target_user_id: "",
        send_email_notification: true,
      });
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

  function handleOpenEditMeeting(meeting: any) {
    const schedTime = meeting.scheduled_at || meeting.start_time || meeting.created_at;
    const d = new Date(schedTime);
    const dateStr = !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
    const pad = (n: number) => n.toString().padStart(2, "0");
    const fromTime = !isNaN(d.getTime()) ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : "10:00";

    let toTime = "10:45";
    if (meeting.end_at) {
      const endD = new Date(meeting.end_at);
      if (!isNaN(endD.getTime())) {
        toTime = `${pad(endD.getHours())}:${pad(endD.getMinutes())}`;
      }
    } else if (meeting.duration_minutes) {
      const endD = new Date(d.getTime() + meeting.duration_minutes * 60 * 1000);
      if (!isNaN(endD.getTime())) {
        toTime = `${pad(endD.getHours())}:${pad(endD.getMinutes())}`;
      }
    }

    setEditMeetingForm({
      id: meeting.id,
      title: meeting.title || "",
      description: meeting.description || "",
      meeting_link: meeting.meeting_link || "",
      date: dateStr,
      from_time: fromTime,
      to_time: toTime,
      target_role: meeting.target_role || "all",
      target_user_id: meeting.target_user_id || "",
      send_email_notification: false,
    });
    setEditMeetingModalOpen(true);
  }

  async function handleUpdateMeetingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editMeetingForm.title || !editMeetingForm.meeting_link || !editMeetingForm.date || !editMeetingForm.from_time) {
      toast.error("Please fill in meeting title, link, date, and from-time.");
      return;
    }

    setIsUpdatingMeeting(true);
    try {
      const startIso = new Date(`${editMeetingForm.date}T${editMeetingForm.from_time}:00`).toISOString();
      let endIso = editMeetingForm.to_time ? new Date(`${editMeetingForm.date}T${editMeetingForm.to_time}:00`).toISOString() : null;

      let durationMins = 30;
      if (endIso) {
        const diffMs = new Date(endIso).getTime() - new Date(startIso).getTime();
        if (diffMs > 0) {
          durationMins = Math.round(diffMs / (60 * 1000));
        } else {
          endIso = new Date(new Date(startIso).getTime() + 30 * 60 * 1000).toISOString();
        }
      }

      let cleanLink = editMeetingForm.meeting_link.trim();
      if (!/^https?:\/\//i.test(cleanLink)) {
        cleanLink = `https://${cleanLink}`;
      }

      await doUpdateMeeting({
        data: {
          id: editMeetingForm.id,
          title: editMeetingForm.title.trim(),
          description: editMeetingForm.description || null,
          meeting_link: cleanLink,
          scheduled_at: startIso,
          end_at: endIso,
          duration_minutes: durationMins,
          target_role: editMeetingForm.target_role,
          target_user_id: editMeetingForm.target_role === "individual" && editMeetingForm.target_user_id ? editMeetingForm.target_user_id : null,
          send_email_notification: editMeetingForm.send_email_notification,
        }
      });

      toast.success(
        editMeetingForm.send_email_notification
          ? "Meeting timeline updated and reschedule emails dispatched!"
          : "Meeting timeline updated successfully!"
      );
      setEditMeetingModalOpen(false);
      qc.invalidateQueries({ queryKey: ["meetings"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update meeting");
    } finally {
      setIsUpdatingMeeting(false);
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
      setResourceForm({ title: "", type: "document", description: "", target_role: "all", target_user_id: "" });
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

  async function handleEditTaskByAdminSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTaskByAdmin) return;
    try {
      await doUpdateTaskByAdmin({
        data: {
          id: editingTaskByAdmin.id,
          title: editingTaskByAdmin.title,
          description: editingTaskByAdmin.description,
          priority: editingTaskByAdmin.priority,
          due_date: editingTaskByAdmin.due_date,
        },
      });
      toast.success("Task updated!");
      setEditingTaskByAdmin(null);
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["admin-intern-tasks"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update task");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* â”€â”€ Header â”€â”€ */}
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
                  <Input required type="text" minLength={6} value={provisionForm.password} onChange={e => setProvisionForm({ ...provisionForm, password: e.target.value })} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" />
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

          {/* â”€â”€ Admin Password Reset Modal â”€â”€ */}
          <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-slate-900">
                  <ShieldCheck className="h-5 w-5 text-indigo-600" /> Reset Password for User
                </DialogTitle>
                <DialogDescription>
                  Instantly set a new secure password for {resetUserTarget?.full_name || resetUserTarget?.email || "this account"}.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdminResetPassword} className="space-y-4 py-2">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div><strong className="text-slate-900">Account:</strong> {resetUserTarget?.full_name || "â€”"} ({resetUserTarget?.email})</div>
                  <div><strong className="text-slate-900">Role:</strong> <span className="uppercase font-bold text-indigo-600">{resetUserTarget?.role}</span> &middot; ID: {resetUserTarget?.employee_id || resetUserTarget?.intern_id || resetUserTarget?.id}</div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">New Secure Password (min 6 chars) *</Label>
                  <Input
                    required
                    type="text"
                    minLength={6}
                    value={resetPasswordForm.newPassword}
                    onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, newPassword: e.target.value })}
                    placeholder="e.g. Vyntyra2026#Pass"
                    className="text-xs font-mono"
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setResetPasswordOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5">
                    <ShieldCheck className="h-4 w-4" /> Set & Update Password
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* ─── Add Holiday Modal ─── */}
          <Dialog open={holidayModalOpen} onOpenChange={setHolidayModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 font-bold">
                <PartyPopper className="h-3.5 w-3.5 text-amber-600" /> Add Holiday
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-slate-900">
                  <PartyPopper className="h-5 w-5 text-amber-600" /> Add Official Holiday
                </DialogTitle>
                <DialogDescription>
                  This holiday will be reflected in the calendar and dashboard across all Admin, Employee, and Intern portals.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateHolidaySubmit} className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Holiday Title *</Label>
                  <Input 
                    required 
                    value={holidayForm.name} 
                    onChange={e => setHolidayForm({ ...holidayForm, name: e.target.value })} 
                    placeholder="e.g. Diwali, Independence Day, Annual Company Day" 
                    className="text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Holiday Date *</Label>
                    <Input 
                      required 
                      type="date" 
                      value={holidayForm.date} 
                      onChange={e => setHolidayForm({ ...holidayForm, date: e.target.value })} 
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Holiday Type</Label>
                    <Select 
                      value={holidayForm.type} 
                      onValueChange={(v: any) => setHolidayForm({ ...holidayForm, type: v })}
                    >
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public / National Holiday</SelectItem>
                        <SelectItem value="company">Official Company Holiday</SelectItem>
                        <SelectItem value="festive">Festive Celebration</SelectItem>
                        <SelectItem value="optional">Optional / Restricted Holiday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Description (Optional)</Label>
                  <Textarea 
                    rows={2} 
                    value={holidayForm.description} 
                    onChange={e => setHolidayForm({ ...holidayForm, description: e.target.value })} 
                    placeholder="e.g. Offices and sprint operations closed." 
                    className="text-xs"
                  />
                </div>

                <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border text-xs cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={holidayForm.is_recurring} 
                    onChange={e => setHolidayForm({ ...holidayForm, is_recurring: e.target.checked })} 
                    className="accent-amber-600 rounded" 
                  />
                  <span className="font-semibold text-slate-700">Recurring annual holiday</span>
                </label>

                <DialogFooter>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setHolidayModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSavingHoliday} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5">
                    {isSavingHoliday ? <Loader2 className="h-4 w-4 animate-spin" /> : <PartyPopper className="h-4 w-4" />}
                    Save Holiday
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ─── Operations Sub-Navigation Bar ─── */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: "overview", label: "Overview", icon: LayoutDashboard, count: null },
            { id: "directory", label: "Directory & Users", icon: Users, count: team.length },
            { id: "tasks", label: "Tasks & LMS", icon: ClipboardList, count: (tasksQ.data || []).filter((t: any) => t.status !== "completed").length },
            { id: "attendance", label: "Attendance & Logs", icon: Clock, count: null },
            { id: "holidays", label: "Holidays & Calendar", icon: CalendarDays, count: (holidaysQ.data || []).length },
            { id: "leaves", label: "Leaves & Requests", icon: FileText, count: (leavesQ.data || []).filter((l: any) => l.status === "pending").length || null },
            { id: "meetings", label: "Meetings & Standups", icon: Video, count: null },
            { id: "announcements", label: "Communication & Promos", icon: Megaphone, count: null },
            { id: "finances", label: "Finances & Payouts", icon: DollarSign, count: null },
            { id: "support", label: "Support & Feedback", icon: LifeBuoy, count: (supportQueries || []).filter((q: any) => q.status === "open").length || null },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm scale-[1.02]"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-amber-400" : "text-slate-500"}`} />
                <span>{tab.label}</span>
                {tab.count !== null && tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-700"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─── TAB: OVERVIEW ─── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard icon={<Users className="h-5 w-5 text-primary" />} label="Total Members" value={team.length} color="bg-primary/10" />
              <StatCard icon={<Briefcase className="h-5 w-5 text-blue-600" />} label="Employees" value={employees.length} color="bg-blue-50" />
              <StatCard icon={<GraduationCap className="h-5 w-5 text-emerald-600" />} label="Interns" value={interns.length} color="bg-emerald-50" />
              <StatCard icon={<ClipboardList className="h-5 w-5 text-amber-600" />} label="Active Tasks" value={(tasksQ.data || []).filter((t: any) => t.status !== "completed").length} color="bg-amber-50" />
            </div>

            {/* Quick Navigation Cards */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Operations Control Sub-Pages</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: "directory", title: "Directory & User Management", desc: "Provision accounts, reset passwords, and assign unassigned interns to mentors.", icon: Users, color: "text-blue-600 bg-blue-50 border-blue-200", badge: `${team.length} Members` },
                  { id: "tasks", title: "Intern Task Hub & Deliverables", desc: "Assign milestones, track progress, review submissions, and manage pool tasks.", icon: ClipboardList, color: "text-amber-600 bg-amber-50 border-amber-200", badge: `${(tasksQ.data || []).filter((t: any) => t.status !== "completed").length} Active` },
                  { id: "attendance", title: "Attendance & Punch Logs", desc: "Monitor daily check-ins, clock-in times, and view shift attendance metrics.", icon: Clock, color: "text-emerald-600 bg-emerald-50 border-emerald-200", badge: "Live Logs" },
                  { id: "holidays", title: "Holidays & Calendar Schedule", desc: "Manage company & public holidays, festive observances, and sync team calendar.", icon: CalendarDays, color: "text-amber-600 bg-amber-50 border-amber-200", badge: `${(holidaysQ.data || []).length} Holidays` },
                  { id: "leaves", title: "Leaves & Access Requests", desc: "Review leave applications, grant tool access, and approve time-off requests.", icon: FileText, color: "text-rose-600 bg-rose-50 border-rose-200", badge: `${(leavesQ.data || []).filter((l: any) => l.status === "pending").length} Pending` },
                  { id: "meetings", title: "Meetings & Daily Standups", desc: "Schedule Google Meet syncs, 1-on-1 reviews, and track daily standup blockers.", icon: Video, color: "text-indigo-600 bg-indigo-50 border-indigo-200", badge: `${(meetingsQ.data || []).length} Meetings` },
                  { id: "announcements", title: "Communication, Email & SMS Hub", desc: "Broadcast company notices, kudos recognition, and promotional email & SMS campaigns.", icon: Megaphone, color: "text-purple-600 bg-purple-50 border-purple-200", badge: "Omni-Hub" },
                  { id: "finances", title: "Finances & Payouts Engine", desc: "Approve stipend payouts, review expense claims, and track compensation records.", icon: DollarSign, color: "text-emerald-700 bg-emerald-50 border-emerald-200", badge: `${(payoutsQ.data || []).length} Payouts` },
                  { id: "support", title: "Helpdesk & Resolution Hub", desc: "Assign customer and intern support tickets to employee resolvers and approve syncs.", icon: LifeBuoy, color: "text-cyan-600 bg-cyan-50 border-cyan-200", badge: `${(supportQueries || []).filter((q: any) => q.status === "open").length} Open` },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => switchTab(item.id)}
                      className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all text-left group flex flex-col justify-between space-y-3 cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className={`p-2.5 rounded-xl border ${item.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                          {item.badge}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 group-hover:text-primary transition-colors flex items-center gap-1.5">
                          {item.title}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upcoming Holidays & Quick Calendar Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <PartyPopper className="h-4 w-4 text-amber-500" /> Upcoming Official Holidays
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => switchTab("holidays")} className="text-xs text-primary font-bold">
                    View All Holidays &rarr;
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(holidaysQ.data || []).slice(0, 4).map((h: any) => (
                    <div key={h.id} className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/70 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-amber-500 text-white font-bold flex flex-col items-center justify-center text-xs shrink-0">
                        <span className="text-[8px] uppercase">{new Date(h.date).toLocaleString('default', { month: 'short' })}</span>
                        <span className="leading-none">{new Date(h.date).getDate()}</span>
                      </div>
                      <div className="min-w-0 text-xs">
                        <div className="font-bold text-slate-900 truncate">{h.name}</div>
                        <div className="text-[10px] text-amber-800 font-semibold uppercase">{h.type || "Holiday"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-1 shadow-xs">
                <MonthlyCalendar 
                  events={(schedulesQ.data || []).map((s: any) => ({
                    id: s.id,
                    title: s.title,
                    event_date: s.event_date,
                    event_time: s.event_time,
                    target_role: s.target_role,
                    description: s.description,
                    meeting_url: s.meeting_url
                  }))}
                  holidays={holidaysQ.data || []}
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: DIRECTORY ─── */}
        {activeTab === "directory" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Users / Directory
                </h2>
                <p className="text-xs text-slate-500">Manage employee and intern accounts, role provisioning, password resets, and mentor mappings.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setProvisionOpen(true)} className="gap-2 text-xs shadow-sm">
                  <Plus className="h-4 w-4" /> Add Team Member
                </Button>
                <Button variant="outline" size="sm" onClick={() => teamQ.refetch()} className="gap-1.5 text-xs">
                  <RefreshCw className={`h-3.5 w-3.5 ${teamQ.isFetching ? "animate-spin" : ""}`} /> Refresh
                </Button>
              </div>
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
                      <MemberRow
                        key={m.id}
                        member={m}
                        team={team}
                        onRevoke={handleRevoke}
                        onResetPassword={(user) => {
                          setResetUserTarget(user);
                          setResetPasswordForm({ userId: user.id, newPassword: "" });
                          setResetPasswordOpen(true);
                        }}
                        onClick={() => setSelectedUser(m)}
                      />
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
                      <MemberRow
                        key={m.id}
                        member={m}
                        team={team}
                        onRevoke={handleRevoke}
                        onResetPassword={(user) => {
                          setResetUserTarget(user);
                          setResetPasswordForm({ userId: user.id, newPassword: "" });
                          setResetPasswordOpen(true);
                        }}
                        onClick={() => setSelectedUser(m)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ─── TAB: TASKS & LMS ─── */}
        {activeTab === "tasks" && (
          <div className="space-y-6">
            {/* Intern Task Assignment & Progress Tracker */}
            <section id="intern-tasks-section">
              <AdminInternTasksView />
            </section>
            {/* Task Assignments */}
            <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" /> General & Pool Task Assignments</h2>
                  <p className="text-xs text-slate-500">Create individual tasks or bulk-claimable tasks for the Intern Pool.</p>
                </div>
                <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1.5 text-xs h-8 px-3" disabled={team.length === 0}>
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
              <div className="divide-y max-h-[420px] overflow-y-auto">
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
        )}

        {/* ─── TAB: ANNOUNCEMENTS & COMMUNICATION ─── */}
        {activeTab === "announcements" && (
          <div className="space-y-6">
            {/* Announcements */}
            <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-sm flex items-center gap-2"><Mail className="h-4 w-4 text-amber-500" /> Broadcast Announcements</h2>
                  <p className="text-xs text-slate-500">Publish organization-wide or targeted role announcements.</p>
                </div>
                <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1.5 text-xs h-8 px-3"><Plus className="h-3.5 w-3.5" /> New Post</Button>
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
          </div>
        )}

        {/* ─── TAB: HOLIDAYS & CALENDAR ─── */}
        {activeTab === "holidays" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <PartyPopper className="h-5 w-5 text-amber-500" /> Organization & National Holiday Manager
                </h2>
                <p className="text-xs text-slate-500">
                  Manage official company holidays, public observances, and non-working days. These dates are highlighted across all employee & intern calendar views.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setHolidayModalOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 text-xs h-9">
                  <Plus className="h-4 w-4" /> Add Official Holiday
                </Button>
                <Button variant="outline" size="sm" onClick={() => holidaysQ.refetch()} className="gap-1.5 text-xs h-9">
                  <RefreshCw className={`h-3.5 w-3.5 ${holidaysQ.isFetching ? "animate-spin" : ""}`} /> Refresh
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Holidays List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-5 py-4 border-b bg-amber-50/50 flex items-center justify-between">
                    <div className="font-bold text-xs uppercase tracking-wider text-amber-900 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-amber-600" /> Official Holidays & Observances
                    </div>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900">
                      {(holidaysQ.data || []).length} Holidays
                    </span>
                  </div>
                  <div className="divide-y max-h-[480px] overflow-y-auto">
                    {(holidaysQ.data || []).length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">No holidays configured yet. Click "Add Official Holiday" above.</div>
                    ) : (
                      (holidaysQ.data as HolidayItem[]).map((h) => {
                        const holidayDate = new Date(h.date);
                        return (
                          <div key={h.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-10 w-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex flex-col items-center justify-center shrink-0">
                                <span className="text-[9px] uppercase font-bold">{holidayDate.toLocaleString('default', { month: 'short' })}</span>
                                <span className="text-sm font-extrabold leading-none">{holidayDate.getDate()}</span>
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-sm text-slate-900 truncate flex items-center gap-2">
                                  <span>{h.name}</span>
                                  <span className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                                    h.type === 'festive' ? 'bg-purple-100 text-purple-800' :
                                    h.type === 'public' ? 'bg-blue-100 text-blue-800' :
                                    h.type === 'company' ? 'bg-amber-100 text-amber-800' :
                                    'bg-slate-100 text-slate-700'
                                  }`}>
                                    {h.type || 'Holiday'}
                                  </span>
                                  {h.is_recurring && (
                                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">Annual</span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                  {holidayDate.toLocaleDateString("en-IN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                  {h.description && ` · ${h.description}`}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteHoliday(h.id, h.name)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Monthly Calendar Preview */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-1 shadow-xs">
                  <MonthlyCalendar 
                    events={(schedulesQ.data || []).map((s: any) => ({
                      id: s.id,
                      title: s.title,
                      event_date: s.event_date,
                      event_time: s.event_time,
                      target_role: s.target_role,
                      description: s.description,
                      meeting_url: s.meeting_url
                    }))}
                    holidays={holidaysQ.data || []}
                  />
                </div>
              </div>
            </div>

            {/* Schedules & Events Section */}
            <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-sm flex items-center gap-2"><CalendarDays className="h-4 w-4 text-emerald-600" /> Schedules & Company Events</h2>
                  <p className="text-xs text-slate-500">Add webinars, sprint planning calls, and company milestones.</p>
                </div>
                <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8 px-3"><Plus className="h-3.5 w-3.5" /> Add Event</Button>
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
                            <SelectItem value="individual">Specific Person (Individual)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {scheduleForm.target_role === "individual" && (
                        <div className="space-y-1.5">
                          <Label>Select Team Member</Label>
                          <Select value={scheduleForm.target_user_id} onValueChange={(v) => setScheduleForm({ ...scheduleForm, target_user_id: v })}>
                            <SelectTrigger><SelectValue placeholder="Choose Person..." /></SelectTrigger>
                            <SelectContent>
                              {(teamQ.data || []).map((m: any) => (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.full_name || m.email} ({m.role || "Member"})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setScheduleOpen(false)}>Cancel</Button>
                        <Button type="submit">Add to Schedule</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="divide-y max-h-[360px] overflow-y-auto">
                {schedulesQ.isLoading ? (
                  <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading schedules...</div>
                ) : schedulesQ.isError ? (
                  <ErrorState message="Could not load schedules. Ensure the schedules table exists." onRetry={() => schedulesQ.refetch()} />
                ) : (schedulesQ.data || []).length === 0 ? (
                  <EmptyState icon={<Calendar className="h-6 w-6" />} message="No schedules added yet." />
                ) : (
                  (schedulesQ.data as any[]).map((s: any) => (
                    <div key={s.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{s.title}</h4>
                          {s.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.description}</p>}
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide ${s.target_role === "all" ? "bg-slate-100 text-slate-600" : s.target_role === "employee" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                              {s.target_role === "all" ? "Everyone" : s.target_role}
                            </span>
                            <span className="text-xs font-semibold text-slate-700">{s.event_date} {s.event_time ? `at ${s.event_time}` : ""}</span>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/50 hover:text-destructive hover:bg-destructive/10 shrink-0">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Event?</AlertDialogTitle>
                              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteSchedule(s.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
        )}

        {/* ─── TAB: MEETINGS & STANDUPS ─── */}
        {activeTab === "meetings" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Video className="h-5 w-5 text-indigo-600" /> Meetings & Daily Standups
                </h2>
                <p className="text-xs text-slate-500">
                  Host team video syncs, 1-on-1 reviews, and verify daily standup progress logs.
                </p>
              </div>
              <Dialog open={meetingOpen} onOpenChange={setMeetingOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 text-xs h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                    <Plus className="h-3.5 w-3.5" /> Schedule New Meeting
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Video className="h-5 w-5 text-indigo-600" /> Schedule Meeting</DialogTitle>
                    <DialogDescription>Add a new meeting for your team, specific department, or an individual member.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateMeeting} className="space-y-3.5 py-2">
                    <div className="space-y-1.5">
                      <Label>Meeting Title / Topic</Label>
                      <Input required value={meetingForm.title} onChange={e => setMeetingForm({ ...meetingForm, title: e.target.value })} placeholder="e.g. Sprint Milestone Review & Daily Standup" />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Agenda & Discussion Details (Optional)</Label>
                      <Input value={meetingForm.description} onChange={e => setMeetingForm({ ...meetingForm, description: e.target.value })} placeholder="e.g. Discuss deliverable timelines, code reviews, and Q&A." />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Meeting Video Link (Google Meet / Zoom / MS Teams)</Label>
                      <Input required type="url" value={meetingForm.meeting_link} onChange={e => setMeetingForm({ ...meetingForm, meeting_link: e.target.value })} placeholder="https://meet.google.com/xyz-abcd-efg" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label>Meeting Date</Label>
                        <Input required type="date" value={meetingForm.date} onChange={e => setMeetingForm({ ...meetingForm, date: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>From (Start Time)</Label>
                        <Input required type="time" value={meetingForm.from_time} onChange={e => setMeetingForm({ ...meetingForm, from_time: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>To (End Time)</Label>
                        <Input required type="time" value={meetingForm.to_time} onChange={e => setMeetingForm({ ...meetingForm, to_time: e.target.value })} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Target Audience</Label>
                      <Select value={meetingForm.target_role} onValueChange={(v: any) => setMeetingForm({ ...meetingForm, target_role: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Everyone (Employees & Interns)</SelectItem>
                          <SelectItem value="employee">Employees Only</SelectItem>
                          <SelectItem value="intern">Interns Only</SelectItem>
                          <SelectItem value="individual">Specific Person (Individual)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {meetingForm.target_role === "individual" && (
                      <div className="space-y-1.5">
                        <Label>Select Team Member</Label>
                        <Select value={meetingForm.target_user_id} onValueChange={(v) => setMeetingForm({ ...meetingForm, target_user_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Choose Person..." /></SelectTrigger>
                          <SelectContent>
                            {(teamQ.data || []).map((m: any) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.full_name || m.email} ({m.role || "Member"})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="pt-2 border-t flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="send_meeting_email"
                        checked={meetingForm.send_email_notification}
                        onChange={(e) => setMeetingForm({ ...meetingForm, send_email_notification: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <Label htmlFor="send_meeting_email" className="text-xs text-slate-700 font-medium cursor-pointer">
                        Send automated email notification with Google Calendar link to all participants
                      </Label>
                    </div>

                    <DialogFooter className="pt-2">
                      <Button type="button" variant="ghost" onClick={() => setMeetingOpen(false)}>Cancel</Button>
                      <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">Schedule Meeting</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Edit Meeting Dialog */}
              <Dialog open={editMeetingModalOpen} onOpenChange={setEditMeetingModalOpen}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Pencil className="h-5 w-5 text-indigo-600" /> Update Meeting Timelines & Details
                    </DialogTitle>
                    <DialogDescription>
                      Modify the scheduled time window, agenda, or platform link for this meeting.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleUpdateMeetingSubmit} className="space-y-3.5 py-2">
                    <div className="space-y-1.5">
                      <Label>Meeting Title / Topic</Label>
                      <Input 
                        required 
                        value={editMeetingForm.title} 
                        onChange={e => setEditMeetingForm({ ...editMeetingForm, title: e.target.value })} 
                        placeholder="e.g. Sprint Milestone Review & Daily Standup" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Agenda & Discussion Details (Optional)</Label>
                      <Input 
                        value={editMeetingForm.description} 
                        onChange={e => setEditMeetingForm({ ...editMeetingForm, description: e.target.value })} 
                        placeholder="e.g. Discuss deliverable timelines, code reviews, and Q&A." 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Meeting Video Link (Google Meet / Zoom / MS Teams)</Label>
                      <Input 
                        required 
                        type="url" 
                        value={editMeetingForm.meeting_link} 
                        onChange={e => setEditMeetingForm({ ...editMeetingForm, meeting_link: e.target.value })} 
                        placeholder="https://meet.google.com/xyz-abcd-efg" 
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label>Meeting Date</Label>
                        <Input 
                          required 
                          type="date" 
                          value={editMeetingForm.date} 
                          onChange={e => setEditMeetingForm({ ...editMeetingForm, date: e.target.value })} 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>From (Start Time)</Label>
                        <Input 
                          required 
                          type="time" 
                          value={editMeetingForm.from_time} 
                          onChange={e => setEditMeetingForm({ ...editMeetingForm, from_time: e.target.value })} 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>To (End Time)</Label>
                        <Input 
                          required 
                          type="time" 
                          value={editMeetingForm.to_time} 
                          onChange={e => setEditMeetingForm({ ...editMeetingForm, to_time: e.target.value })} 
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Target Audience</Label>
                      <Select 
                        value={editMeetingForm.target_role} 
                        onValueChange={(v: any) => setEditMeetingForm({ ...editMeetingForm, target_role: v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Everyone (Employees & Interns)</SelectItem>
                          <SelectItem value="employee">Employees Only</SelectItem>
                          <SelectItem value="intern">Interns Only</SelectItem>
                          <SelectItem value="individual">Specific Person (Individual)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {editMeetingForm.target_role === "individual" && (
                      <div className="space-y-1.5">
                        <Label>Select Team Member</Label>
                        <Select 
                          value={editMeetingForm.target_user_id} 
                          onValueChange={(v) => setEditMeetingForm({ ...editMeetingForm, target_user_id: v })}
                        >
                          <SelectTrigger><SelectValue placeholder="Choose Person..." /></SelectTrigger>
                          <SelectContent>
                            {(teamQ.data || []).map((m: any) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.full_name || m.email} ({m.role || "Member"})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="pt-2 border-t flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="edit_send_meeting_email"
                        checked={editMeetingForm.send_email_notification}
                        onChange={(e) => setEditMeetingForm({ ...editMeetingForm, send_email_notification: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <Label htmlFor="edit_send_meeting_email" className="text-xs text-slate-700 font-medium cursor-pointer">
                        Send updated reschedule email notification with Google Calendar link to participants
                      </Label>
                    </div>

                    <DialogFooter className="pt-2">
                      <Button type="button" variant="ghost" onClick={() => setEditMeetingModalOpen(false)}>Cancel</Button>
                      <Button 
                        type="submit" 
                        disabled={isUpdatingMeeting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                      >
                        {isUpdatingMeeting ? "Updating..." : "Save Timeline Changes"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Scheduled Meetings List */}
              <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b flex items-center justify-between">
                  <h2 className="font-semibold text-sm flex items-center gap-2"><Video className="h-4 w-4 text-indigo-500" /> Scheduled Meetings</h2>
                  <span className="text-xs text-slate-400">{(meetingsQ.data || []).length} Meetings</span>
                </div>
                <div className="divide-y max-h-[500px] overflow-y-auto">
                  {meetingsQ.isLoading ? (
                    <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
                  ) : meetingsQ.isError ? (
                    <ErrorState message="Could not load meetings." onRetry={() => meetingsQ.refetch()} />
                  ) : (meetingsQ.data || []).length === 0 ? (
                    <EmptyState icon={<Video className="h-6 w-6" />} message="No meetings scheduled." />
                  ) : (
                    (meetingsQ.data as any[]).map((m: any) => {
                      const scheduledTime = m.scheduled_at || m.start_time || m.created_at;
                      const durationMins = m.duration_minutes || 30;
                      const { dateStr, rangeStr } = formatMeetingTimeRange(scheduledTime, m.end_at, durationMins);
                      const gcalUrl = m.gcal_url || generateGoogleCalendarUrl({
                        title: m.title,
                        description: m.description,
                        location: m.meeting_link,
                        startTime: scheduledTime,
                        endTime: m.end_at,
                      });

                      const handleWhatsAppNotice = () => {
                        const text = `📢 *OFFICIAL MEETING NOTICE · PROJECT VYNEXA*\n\n📌 *Topic:* ${m.title}\n📅 *Date:* ${dateStr}\n⏰ *Time:* ${rangeStr} (${durationMins} Mins)\n🔗 *Meeting Link:* ${m.meeting_link}\n\n📝 *Agenda:*\n${m.description || "General sync and sprint review."}\n\n🗓️ *Google Calendar:*\n${gcalUrl}\n\n— *Vyntyra Directorate*`;
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
                      };

                      const handleCopyNotice = () => {
                        const text = `📢 OFFICIAL MEETING NOTICE · PROJECT VYNEXA\nTopic: ${m.title}\nDate: ${dateStr}\nTime: ${rangeStr} (${durationMins} Mins)\nMeeting Link: ${m.meeting_link}\nAgenda: ${m.description || "General sync."}\nCalendar: ${gcalUrl}`;
                        navigator.clipboard.writeText(text);
                        toast.success("Meeting details copied!");
                      };

                      return (
                        <div key={m.id} className="p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-sm text-slate-900 truncate">{m.title}</h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${m.target_role === "all" ? "bg-slate-100 text-slate-700" : m.target_role === "employee" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                                  {m.target_role === "all" ? "Everyone" : m.target_role}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                                <span className="flex items-center gap-1 font-medium"><Calendar className="h-3 w-3 text-slate-400" /> {dateStr}</span>
                                <span className="flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                  <Clock className="h-3 w-3 text-indigo-600" /> {rangeStr}
                                </span>
                                <span className="text-slate-400 text-[11px]">({durationMins} Mins)</span>
                              </div>

                              {m.description && (
                                <p className="text-xs text-slate-500 line-clamp-1 pt-0.5">{m.description}</p>
                              )}

                              <div className="flex items-center gap-2 pt-1 flex-wrap">
                                <a href={m.meeting_link} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline font-mono truncate max-w-[200px]">
                                  {m.meeting_link}
                                </a>

                                {/* Dedicated Google Calendar Button */}
                                <a
                                  href={gcalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded transition-colors"
                                  title="Add to Google Calendar"
                                >
                                  <CalendarPlus className="h-3 w-3 text-indigo-600" /> Google Calendar
                                </a>

                                {/* WhatsApp Group Notice Button */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleWhatsAppNotice}
                                  className="h-6 px-2 text-[10px] font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border-teal-200 gap-1"
                                >
                                  <Share2 className="h-3 w-3 text-teal-600" /> WhatsApp
                                </Button>

                                {/* Edit Timeline Button */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenEditMeeting(m)}
                                  className="h-6 px-2 text-[10px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200 gap-1"
                                  title="Edit scheduled time and details"
                                >
                                  <Pencil className="h-3 w-3 text-indigo-600" /> Edit Timeline
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCopyNotice}
                                  className="h-6 w-6 p-0 text-slate-400 hover:text-slate-700"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                onClick={() => handleOpenEditMeeting(m)}
                                title="Edit Meeting"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>

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
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              {/* Daily Standups Review */}
              <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b flex items-center justify-between">
                  <h2 className="font-semibold text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-blue-600" /> Daily Standups Review</h2>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{(standupsAdminQ.data || []).length} Logs</span>
                </div>
                <div className="divide-y max-h-[420px] overflow-y-auto">
                  {(standupsAdminQ.data || []).length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">No daily standup logs to review.</div>
                  ) : (
                    (standupsAdminQ.data as any[]).map((s: any) => (
                      <div key={s.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 text-xs">{s.profiles?.full_name || "Intern"}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{new Date(s.date || s.created_at).toLocaleDateString("en-IN")}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2"><strong>Today:</strong> {s.did_today}</p>
                          {s.plan_tomorrow && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1"><strong>Tomorrow:</strong> {s.plan_tomorrow}</p>}
                          {s.blockers && <p className="text-xs text-rose-600 font-medium mt-0.5 line-clamp-1"><strong>Blockers:</strong> {s.blockers}</p>}
                        </div>
                        <div className="shrink-0">
                          {s.status !== 'approved' ? (
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={async () => {
                              await doUpdateStandupStatus({ data: { id: s.id, status: 'approved' } });
                              toast.success("Standup approved");
                              qc.invalidateQueries({ queryKey: ["admin-standups"] });
                            }}>Approve</Button>
                          ) : (
                            <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Approved</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ─── TAB: ANNOUNCEMENTS & COMMUNICATION ADDITIONS ─── */}
        {activeTab === "announcements" && (
          <div className="space-y-6">
            {/* Peer Kudos Feed */}
            <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-sm flex items-center gap-2"><Award className="h-4 w-4 text-amber-500" /> Peer Kudos & Appreciation Feed</h2>
                  <p className="text-xs text-slate-500">Live shoutouts, badges, and recognition from teammates.</p>
                </div>
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

            {/* Email Automation Hub */}
            <EmailAutomationHub 
              emailLogsQ={emailLogsQ} 
              doSendPromotionalEmail={doSendPromotionalEmail} 
              doDeleteAutomatedEmailLog={doDeleteAutomatedEmailLog} 
              qc={qc} 
            />

            {/* SMS Gateway Automation Engine */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-emerald-600" /> Multi-Provider Free SMS Gateway Hub
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Send candidate interview updates, selection alerts, and emergency notifications using free SMS gateways.
                  </p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                  500 Total SMS / month
                </span>
              </div>

              <SmsGatewayHub
                smsLogsQ={smsLogsQ}
                doSendSms={doSendSms}
                doDeleteSmsLog={doDeleteSmsLog}
                qc={qc}
              />
            </section>

            {/* Resources Library */}
            <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-pink-500" /> Training & Handbook Resources Library</h2>
                  <p className="text-xs text-slate-500">Upload documentation, onboarding guidelines, guides, and templates.</p>
                </div>
                <Dialog open={resourceOpen} onOpenChange={setResourceOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8 px-3"><Plus className="h-3.5 w-3.5" /> Add Resource</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-pink-500" /> Upload Resource</DialogTitle>
                      <DialogDescription>Share documents or links with your team or an individual person.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateResource} className="space-y-4 py-2">
                      <div className="space-y-1.5">
                        <Label>Title</Label>
                        <Input required value={resourceForm.title} onChange={e => setResourceForm({ ...resourceForm, title: e.target.value })} placeholder="e.g. Employee Handbook / Onboarding Specs" />
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
                              <SelectItem value="individual">Specific Person (Individual)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {resourceForm.target_role === "individual" && (
                        <div className="space-y-1.5">
                          <Label>Select Team Member</Label>
                          <Select value={resourceForm.target_user_id} onValueChange={(v) => setResourceForm({ ...resourceForm, target_user_id: v })}>
                            <SelectTrigger><SelectValue placeholder="Choose Person..." /></SelectTrigger>
                            <SelectContent>
                              {(teamQ.data || []).map((m: any) => (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.full_name || m.email} ({m.role || "Member"})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
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
                  <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading resources...</div>
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
        )}

        {/* ─── TAB: LEAVES & ACCESS REQUESTS ─── */}
        {activeTab === "leaves" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-rose-600" /> Leaves & Tooling Access Approvals
                </h2>
                <p className="text-xs text-slate-500">
                  Review time-off requests, sick leaves, and manage software tooling / API access permissions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Leaves Approval */}
              <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b flex items-center justify-between">
                  <h2 className="font-semibold text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-rose-600" /> Leave Applications</h2>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                    {(leavesQ.data || []).length} Requests
                  </span>
                </div>
                <div className="divide-y max-h-[420px] overflow-y-auto">
                  {leavesQ.isLoading ? (
                    <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading leaves...</div>
                  ) : (leavesQ.data || []).length === 0 ? (
                    <EmptyState icon={<FileText className="h-6 w-6" />} message="No leave requests pending." />
                  ) : (
                    (leavesQ.data as any[]).map((l: any) => (
                      <div key={l.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-slate-900">{l.profiles?.full_name || l.user_id?.slice(0, 8)}</span>
                              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">{l.leave_type || "Leave"}</span>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                l.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                l.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {l.status}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              Duration: <span className="font-semibold text-slate-800">{l.start_date} to {l.end_date}</span>
                            </div>
                            {l.reason && <p className="text-xs text-slate-600 italic mt-1.5">"{l.reason}"</p>}
                          </div>
                          {l.status === 'pending' && (
                            <div className="flex items-center gap-1 shrink-0">
                              <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={async () => {
                                await doUpdateLeaveStatus({ data: { id: l.id, status: 'approved' } });
                                toast.success("Leave approved");
                                qc.invalidateQueries({ queryKey: ["admin-leaves"] });
                              }}>Approve</Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-red-600 border-red-200 hover:bg-red-50" onClick={async () => {
                                await doUpdateLeaveStatus({ data: { id: l.id, status: 'rejected' } });
                                toast.success("Leave rejected");
                                qc.invalidateQueries({ queryKey: ["admin-leaves"] });
                              }}>Reject</Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Tooling Access Requests */}
              <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b flex items-center justify-between">
                  <h2 className="font-semibold text-sm flex items-center gap-2"><Shield className="h-4 w-4 text-emerald-600" /> Tooling & Software Access Requests</h2>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{(accessRequestsAdminQ.data || []).length} Requests</span>
                </div>
                <div className="divide-y max-h-[420px] overflow-y-auto">
                  {(accessRequestsAdminQ.data || []).length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">No tooling access requests submitted.</div>
                  ) : (
                    (accessRequestsAdminQ.data as any[]).map((a: any) => (
                      <div key={a.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">{a.tool_name}</span>
                            <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              a.status === 'provisioned' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {a.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">Requested by: {a.profiles?.full_name || "Intern"} ({a.profiles?.email})</div>
                          {a.reason && <p className="text-xs text-slate-600 italic mt-1">"{a.reason}"</p>}
                        </div>
                        <div className="shrink-0">
                          {a.status !== 'provisioned' ? (
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={async () => {
                              await doUpdateAccessRequestStatus({ data: { id: a.id, status: 'provisioned' } });
                              toast.success("Access provisioned");
                              qc.invalidateQueries({ queryKey: ["admin-access-requests"] });
                            }}>Provision</Button>
                          ) : (
                            <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Provisioned</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ─── TAB: FINANCES & PAYOUTS ─── */}
        {activeTab === "finances" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-600" /> Stipend Payouts & Expense Reimbursements
                </h2>
                <p className="text-xs text-slate-500">
                  Manage stipend disbursement cycles, authorize employee expense claims, and track compensation records.
                </p>
              </div>
            </div>

            {/* Payouts Section */}
            <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-sm flex items-center gap-2"><DollarSign className="h-4 w-4 text-emerald-600" /> Stipend & Compensation Payouts</h2>
                  <p className="text-xs text-slate-500">Track and approve team compensation batches.</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {(payoutsQ.data || []).length} Records
                </span>
              </div>
              <div className="divide-y max-h-[380px] overflow-y-auto">
                {payoutsQ.isLoading ? (
                  <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading payouts...</div>
                ) : (payoutsQ.data || []).length === 0 ? (
                  <EmptyState icon={<DollarSign className="h-6 w-6" />} message="No stipend payout records generated yet." />
                ) : (
                  (payoutsQ.data as any[]).map((p: any) => (
                    <div key={p.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{p.profiles?.full_name || p.user_id?.slice(0, 8)}</span>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">₹{p.amount}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            p.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                            p.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Period: {p.period || "Monthly"} • {p.profiles?.email}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {p.status !== 'paid' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={async () => {
                            await doUpdatePayoutStatus({ data: { id: p.id, status: 'paid' } });
                            toast.success("Payout marked as paid");
                            qc.invalidateQueries({ queryKey: ["admin-payouts"] });
                          }}>Mark Paid</Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Expense Claims Section */}
            <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-sm flex items-center gap-2"><CreditCard className="h-4 w-4 text-emerald-600" /> Expense Claims & Reimbursements</h2>
                  <p className="text-xs text-slate-500">Review bills, travel allowances, and uploaded receipts.</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {(expensesQ.data || []).length} Claims
                </span>
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
          </div>
        )}

        {/* ─── TAB: SUPPORT & HELPDESK ─── */}
        {activeTab === "support" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <LifeBuoy className="h-5 w-5 text-purple-600" /> Support Queries, IT Helpdesk & Feedback
                </h2>
                <p className="text-xs text-slate-500">
                  Assign resolvers, schedule support sync calls, handle IT tickets, and review user suggestions.
                </p>
              </div>
            </div>

            {/* Intern Support Queries (Oversight & Sync approvals) */}
            <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-sm flex items-center gap-2"><LifeBuoy className="h-4 w-4 text-purple-600" /> Intern Support Queries</h2>
                  <p className="text-xs text-slate-500">Assign resolver employees and approve scheduled sync meetings.</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  {supportQueries.length} Queries
                </span>
              </div>
              <div className="divide-y max-h-[380px] overflow-y-auto">
                {supportQueriesQ.isLoading ? (
                  <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading intern queries...</div>
                ) : supportQueriesQ.isError ? (
                  <ErrorState message="Could not load intern queries." onRetry={() => supportQueriesQ.refetch()} />
                ) : supportQueries.length === 0 ? (
                  <EmptyState icon={<MessageSquare className="h-6 w-6" />} message="No intern support queries raised yet." />
                ) : (
                  supportQueries.map((q: any) => {
                    const hasMeeting = q.meeting_id && q.meeting_status === "approved";
                    return (
                      <div key={q.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-semibold text-slate-900 text-sm">{q.subject}</span>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700">{q.category}</span>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                q.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' :
                                q.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {q.status}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 font-medium">
                              Intern: <strong className="text-slate-800">{q.intern?.full_name}</strong> ({q.intern?.email}) • Mentor: <span className="font-bold text-slate-700">{q.mentor?.full_name || "Official Mentor"}</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-2 italic">"{q.description}"</p>

                            <div className="bg-slate-50 border p-2.5 rounded-lg mt-3 text-xs flex items-center justify-between">
                              <div className="text-slate-600">
                                <strong>Resolver:</strong> {q.assigned_employee?.full_name || <span className="text-rose-600 italic">Not Assigned</span>}
                              </div>
                              
                              {q.status !== "resolved" && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="border-slate-300 hover:bg-slate-100 font-semibold text-xs h-7"
                                  onClick={() => {
                                    setSelectedQueryForResolver(q);
                                    setSelectedResolverEmployeeId(q.assigned_employee_id || "");
                                  }}
                                >
                                  {q.assigned_employee_id ? "Change Resolver" : "Assign Resolver"}
                                </Button>
                              )}
                            </div>

                            {q.progress_notes && (
                              <p className="text-[11px] text-slate-500 italic mt-2"><strong>Resolver Notes:</strong> "{q.progress_notes}"</p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className="text-[10px] text-slate-400 font-mono">{new Date(q.created_at).toLocaleDateString()}</span>
                            
                            {q.meeting_status === "requested" && (
                              <div className="flex items-center gap-1.5 mt-2">
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1"><Video className="h-3 w-3 animate-pulse" /> Sync Meeting Requested</span>
                                <Button 
                                  size="sm" 
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-7 text-xs"
                                  onClick={() => {
                                    setSelectedQueryForMeeting(q);
                                    setMeetingTimeInput(new Date(Date.now() + 1000 * 60 * 60).toISOString().slice(0, 16));
                                  }}
                                >
                                  Approve & Schedule
                                </Button>
                              </div>
                            )}

                            {hasMeeting && (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded flex items-center gap-1">
                                ✓ Meeting Scheduled
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Helpdesk & IT/HR Tickets Control */}
            <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-sm flex items-center gap-2"><LifeBuoy className="h-4 w-4 text-blue-600" /> Helpdesk & IT/HR Tickets</h2>
                  <p className="text-xs text-slate-500">Resolve employee support and infrastructure tickets.</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {(ticketsQ.data || []).length} Tickets
                </span>
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

            {/* Feedback Inbox */}
            <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4 text-purple-500" /> User Feedback & Suggestions Inbox</h2>
                  <p className="text-xs text-slate-500">Anonymous and named feedback submitted from user dashboards.</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  {(feedbacksQ.data || []).length} Feedbacks
                </span>
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
                          <Button variant="outline" size="sm" className="text-xs h-7" onClick={async () => {
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
          </div>
        )}

        {/* ─── TAB: ATTENDANCE MONITORING ─── */}
        {activeTab === "attendance" && (
          <div className="space-y-6">
            <section className="rounded-2xl border bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-semibold text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-400" /> Employee &amp; Intern Attendance Monitoring
                  </h2>
                  <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
                    <button
                      onClick={() => setAttendanceRoleFilter("all")}
                      className={`px-3 py-1 rounded-md font-semibold transition-all ${
                        attendanceRoleFilter === "all" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-300 hover:text-white"
                      }`}
                    >
                      All Team ({processedTeamAttendance.length})
                    </button>
                    <button
                      onClick={() => setAttendanceRoleFilter("employee")}
                      className={`px-3 py-1 rounded-md font-semibold transition-all ${
                        attendanceRoleFilter === "employee" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-300 hover:text-white"
                      }`}
                    >
                      Employees ({processedTeamAttendance.filter((m: any) => m.role === "employee").length})
                    </button>
                    <button
                      onClick={() => setAttendanceRoleFilter("intern")}
                      className={`px-3 py-1 rounded-md font-semibold transition-all ${
                        attendanceRoleFilter === "intern" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-300 hover:text-white"
                      }`}
                    >
                      Interns ({processedTeamAttendance.filter((m: any) => m.role === "intern").length})
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    {filteredAttendance.filter((i: any) => i.activeStatus === "Active").length} Online Now
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Quick Metrics Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                    <div className="p-3 bg-emerald-100 text-emerald-700 rounded-full shrink-0">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Clocked-In Today</div>
                      <div className="text-xl font-bold text-slate-800">
                        {filteredAttendance.filter((i: any) => i.activeStatus === "Active" || i.activeStatus === "Completed").length} Present
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                    <div className="p-3 bg-blue-100 text-blue-700 rounded-full shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Shift Presence Rate</div>
                      <div className="text-xl font-bold text-slate-800">
                        {filteredAttendance.length > 0 
                          ? `${Math.round((filteredAttendance.filter((i: any) => i.activeStatus === "Active" || i.activeStatus === "Completed").length / filteredAttendance.length) * 100)}%`
                          : "0%"}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 text-indigo-700 rounded-full shrink-0">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Task Completion Rate</div>
                      <div className="text-xl font-bold text-slate-800">
                        {tasksQ.data?.length > 0 
                          ? `${Math.round((tasksQ.data.filter((t: any) => t.status === "completed").length / tasksQ.data.length) * 100)}%`
                          : "0%"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Attendance Table */}
                <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                          <th className="px-5 py-3">Member Details</th>
                          <th className="px-5 py-3">Role</th>
                          <th className="px-5 py-3">Today's Status</th>
                          <th className="px-5 py-3">Clock In</th>
                          <th className="px-5 py-3">Clock Out</th>
                          <th className="px-5 py-3">Total Attendance</th>
                          <th className="px-5 py-3">Task Completions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {filteredAttendance.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-5 py-8 text-center text-slate-400">No team members found for this filter</td>
                          </tr>
                        ) : (
                          filteredAttendance.map((member: any) => (
                            <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <SmartAvatar
                                    src={member.avatar_url}
                                    alt={member.full_name}
                                    fallbackInitials={(member.full_name || "?")[0]}
                                    className="h-8 w-8 rounded-full"
                                  />
                                  <div>
                                    <div className="font-semibold text-slate-900 text-sm">{member.full_name}</div>
                                    <div className="text-[10px] text-slate-400 font-light">{member.intern_id || member.email} · {member.department}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  member.role === "employee" 
                                    ? "bg-purple-50 text-purple-700 border border-purple-200" 
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}>
                                  {member.role || "member"}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                {member.activeStatus === "Active" ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Active
                                  </span>
                                ) : member.activeStatus === "Completed" ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-600 border border-slate-200">
                                    Clocked Out
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                    Offline
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-4 font-mono text-slate-600">{member.clockInTime}</td>
                              <td className="px-5 py-4 font-mono text-slate-600">{member.clockOutTime}</td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800">{member.totalAttendance} Days</span>
                                  <span className="text-[10px] text-slate-400 font-normal">Present</span>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800">{member.completedTasks} Tasks</span>
                                  <span className="text-[10px] text-slate-400 font-normal">Done</span>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Day-Wise Logs Toggle & List */}
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowAttendanceLogs(!showAttendanceLogs)}
                    className="gap-2 font-semibold text-xs border-slate-200"
                  >
                    <Calendar className="h-4 w-4" /> 
                    {showAttendanceLogs ? "Hide Detailed History Logs" : "Show Detailed History Logs"}
                  </Button>

                  {showAttendanceLogs && (
                    <div className="mt-4 rounded-xl border bg-white overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
                      <div className="bg-slate-50 px-5 py-3 border-b flex items-center justify-between text-xs">
                        <span className="font-bold uppercase tracking-wider text-slate-500">Every Day-Wise Attendance Logs</span>
                        <span className="text-slate-400 font-light">All recorded clock-in and clock-out history</span>
                      </div>
                      <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                              <th className="px-5 py-2.5">Date</th>
                              <th className="px-5 py-2.5">Intern Name</th>
                              <th className="px-5 py-2.5">Email</th>
                              <th className="px-5 py-2.5">Clock In</th>
                              <th className="px-5 py-2.5">Clock Out</th>
                              <th className="px-5 py-2.5">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                            {(attendanceQ.data || []).length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-5 py-8 text-center text-slate-400">No attendance logs in database</td>
                              </tr>
                            ) : (
                              (attendanceQ.data as any[]).map((log: any) => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-5 py-3 font-semibold text-slate-800">
                                    {new Date(log.date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </td>
                                  <td className="px-5 py-3 font-semibold text-slate-900">{log.profiles?.full_name || "—"}</td>
                                  <td className="px-5 py-3 text-slate-500">{log.profiles?.email || "—"}</td>
                                  <td className="px-5 py-3 font-mono">
                                    {log.clock_in ? new Date(log.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                                  </td>
                                  <td className="px-5 py-3 font-mono">
                                    {log.clock_out ? new Date(log.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                                  </td>
                                  <td className="px-5 py-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                      log.clock_in && !log.clock_out ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-600"
                                    }`}>
                                      {log.clock_in && !log.clock_out ? "Active" : "Completed"}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
      
      {/* â”€â”€ User Profile Drawer / Dialog â”€â”€ */}
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

      {/* â”€â”€ Dialog for Assigning Resolver Employee â”€â”€ */}
      {selectedQueryForResolver && (
        <Dialog open={!!selectedQueryForResolver} onOpenChange={(open) => !open && setSelectedQueryForResolver(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Resolver Employee</DialogTitle>
              <DialogDescription>Assign a resolver to resolve the intern's support query.</DialogDescription>
            </DialogHeader>
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (!selectedResolverEmployeeId) return;
                try {
                  await doAssignSupportQueryEmployee({
                    data: {
                      queryId: selectedQueryForResolver.id,
                      employeeId: selectedResolverEmployeeId
                    }
                  });
                  toast.success("Resolver employee assigned successfully!");
                  setSelectedQueryForResolver(null);
                  setSelectedResolverEmployeeId("");
                  qc.invalidateQueries({ queryKey: ["admin-support-queries"] });
                } catch (err: any) {
                  toast.error("Failed to assign resolver");
                }
              }}
              className="space-y-4 py-2"
            >
              <div className="space-y-1.5">
                <Label>Choose Employee Resolver</Label>
                <Select value={selectedResolverEmployeeId} onValueChange={setSelectedResolverEmployeeId}>
                  <SelectTrigger><SelectValue placeholder="Select employee resolver..." /></SelectTrigger>
                  <SelectContent>
                    {employees.map((emp: any) => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.full_name} ({emp.department || "General"})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setSelectedQueryForResolver(null)}>Cancel</Button>
                <Button type="submit" disabled={!selectedResolverEmployeeId}>Assign Resolver</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* â”€â”€ Dialog for Approving Support Meeting â”€â”€ */}
      {selectedQueryForMeeting && (
        <Dialog open={!!selectedQueryForMeeting} onOpenChange={(open) => !open && setSelectedQueryForMeeting(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Approve & Schedule Support Sync</DialogTitle>
              <DialogDescription>Approve the sync meeting request and schedule a Google Meet room.</DialogDescription>
            </DialogHeader>
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (!meetingTimeInput) return;
                try {
                  await doApproveSupportMeeting({
                    data: {
                      queryId: selectedQueryForMeeting.id,
                      meetingTime: new Date(meetingTimeInput).toISOString()
                    }
                  });
                  toast.success("Meeting approved and Google Meet sync room linked!");
                  setSelectedQueryForMeeting(null);
                  setMeetingTimeInput("");
                  qc.invalidateQueries({ queryKey: ["admin-support-queries"] });
                  qc.invalidateQueries({ queryKey: ["meetings"] });
                } catch (err: any) {
                  toast.error("Failed to approve meeting");
                }
              }}
              className="space-y-4 py-2"
            >
              <div className="space-y-1.5">
                <Label>Scheduled Sync Date & Time</Label>
                <Input 
                  type="datetime-local" 
                  required 
                  value={meetingTimeInput}
                  onChange={e => setMeetingTimeInput(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setSelectedQueryForMeeting(null)}>Cancel</Button>
                <Button type="submit" disabled={!meetingTimeInput}>Approve Sync</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* â”€â”€ Google Docs / Sheets & Spreadsheet Viewer Modal â”€â”€ */}
      {viewingDoc && (
        <GoogleDocViewerModal
          url={viewingDoc.url}
          title={viewingDoc.title}
          isOpen={!!viewingDoc}
          onClose={() => setViewingDoc(null)}
        />
      )}

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTaskByAdmin} onOpenChange={(open) => !open && setEditingTaskByAdmin(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-600" /> Edit Task
            </DialogTitle>
          </DialogHeader>
          {editingTaskByAdmin && (
            <form onSubmit={handleEditTaskByAdminSubmit} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input
                  required
                  value={editingTaskByAdmin.title}
                  onChange={(e) =>
                    setEditingTaskByAdmin({ ...editingTaskByAdmin, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  value={editingTaskByAdmin.description || ""}
                  onChange={(e) =>
                    setEditingTaskByAdmin({ ...editingTaskByAdmin, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select
                    value={editingTaskByAdmin.priority || "medium"}
                    onValueChange={(v) =>
                      setEditingTaskByAdmin({ ...editingTaskByAdmin, priority: v })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={editingTaskByAdmin.due_date || ""}
                    onChange={(e) =>
                      setEditingTaskByAdmin({ ...editingTaskByAdmin, due_date: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEditingTaskByAdmin(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MemberRow({ member, team, onRevoke, onResetPassword, onClick }: { member: any; team?: any[]; onRevoke: (id: string, name: string) => void; onResetPassword?: (member: any) => void; onClick: () => void }) {
  const roleStyles = member.role === "employee"
    ? "bg-blue-100 text-blue-800"
    : "bg-emerald-100 text-emerald-800";

  const assignedMentor = member.mentor_id && team ? team.find((t: any) => (t.id === member.mentor_id || t.user_id === member.mentor_id)) : null;
  const mentorDisplayName = assignedMentor ? assignedMentor.full_name : member.mentor_id ? "Assigned Mentor" : "Lead Mentor (Jami Eswar Anil Kumar)";

  return (
    <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer group" onClick={onClick}>
      <div className="flex items-center gap-3 min-w-0">
        <SmartAvatar
          src={member.avatar_url}
          alt={member.full_name}
          fallbackInitials={(member.full_name || member.email || "?")[0]}
          className="h-9 w-9 rounded-full shrink-0"
        />
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-slate-900 group-hover:text-primary transition-colors">{member.full_name || "—"}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${roleStyles}`}>{member.role}</span>
            {member.role === "intern" && (
              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Mentor: {mentorDisplayName}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate">{member.email} {member.intern_id && `· ID: ${member.intern_id}`}</div>
          
          {member.role === "intern" && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {member.exam_fee_paid ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ✓ Fee Paid (₹{member.exam_fee_amount || 199})
                </span>
              ) : member.is_fee_exempted ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  Exempted
                </span>
              ) : member.fee_payment_scheduled ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  ⏳ Fee Scheduled (₹{member.exam_fee_amount || 199})
                </span>
              ) : (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  Unscheduled
                </span>
              )}
              {member.urgent_popup_active && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200 animate-pulse">
                  🚨 Urgent Popup Alert Active
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
        {member.role === "intern" && !member.exam_fee_paid && !member.is_fee_exempted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              const loadingToast = toast.loading(`Sending payment reminder email to ${member.email}...`);
              try {
                await sendPaymentReminderEmail({
                  data: {
                    recipient_email: member.email,
                    recipient_name: member.full_name,
                    recipient_phone: member.phone || member.phone_number,
                    intern_id: member.intern_id,
                    exam_fee_amount: member.exam_fee_amount !== undefined ? member.exam_fee_amount : 199,
                    payment_deadline: member.fee_payment_deadline,
                  },
                });
                toast.dismiss(loadingToast);
                toast.success(`Payment reminder email sent to ${member.email}!`);
              } catch (err: any) {
                toast.dismiss(loadingToast);
                toast.error("Failed to send reminder: " + err.message);
              }
            }}
            title="Send Individual Payment Reminder"
            className="h-8 px-2.5 text-xs font-bold text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg gap-1.5"
          >
            <Mail className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Pay Reminder</span>
          </Button>
        )}

        {onResetPassword && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onResetPassword(member)}
            title="Reset User Password"
            className="h-8 px-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg gap-1.5"
          >
            <Key className="h-3.5 w-3.5 text-amber-600" />
            <span className="hidden sm:inline">Reset Pass</span>
          </Button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/40 hover:text-destructive hover:bg-destructive/10" title="Revoke Access">
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
  );
}

function UserProfileDialog({ user, open, onOpenChange, doUpdateProfile, doGetUploadUrl, qc, team, doAssignIntern, doRemoveIntern }: any) {
  const [selectedInternToAssign, setSelectedInternToAssign] = useState("");
  const [form, setForm] = useState(user || {});
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLetter, setUploadingLetter] = useState(false);
  const [uploadingCertificate, setUploadingCertificate] = useState(false);

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
        phone: cleanValue(form.phone || form.phone_number),
        phone_number: cleanValue(form.phone_number || form.phone),
        address: cleanValue(form.address),
        intern_id: cleanValue(form.intern_id),
        position: cleanValue(form.position),
        department: cleanValue(form.department),
        mentor_id: form.mentor_id === "none" ? null : (form.mentor_id || null),
        stipend: cleanValue(form.stipend),
        start_date: cleanValue(form.start_date),
        end_date: cleanValue(form.end_date),
        avatar_url: cleanValue(form.avatar_url),
        offer_letter_url: cleanValue(form.offer_letter_url),
        noc_url: cleanValue(form.noc_url),
        blood_group: cleanValue(form.blood_group),
        security_level: cleanValue(form.security_level),
        emergency_contact: cleanValue(form.emergency_contact),
        bank_details: cleanValue(form.bank_details),
        certificate_url: cleanValue(form.certificate_url),
        fee_payment_scheduled: Boolean(form.fee_payment_scheduled),
        fee_payment_deadline: form.fee_payment_deadline ? localDateTimeToIso(form.fee_payment_deadline) : null,
        exam_fee_amount: form.exam_fee_amount !== undefined ? Number(form.exam_fee_amount) : 199,
        exam_fee_paid: Boolean(form.exam_fee_paid),
        is_fee_exempted: Boolean(form.is_fee_exempted),
        referral_code_used: cleanValue(form.referral_code_used ? form.referral_code_used.toUpperCase() : null),
        payment_reference_no: cleanValue(form.payment_reference_no),
        payment_mode: cleanValue(form.payment_mode),
        urgent_popup_active: Boolean(form.urgent_popup_active),
        urgent_popup_title: cleanValue(form.urgent_popup_title),
        urgent_popup_message: cleanValue(form.urgent_popup_message),
      } });
      toast.success("Profile & assignments updated successfully");
      qc.invalidateQueries({ queryKey: ["team-members"] });
      qc.invalidateQueries({ queryKey: ["intern-mentor"] });
      qc.invalidateQueries({ queryKey: ["all-interns-fee-status"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    }
  }

  async function handleFileUpload(file: File, type: "avatar" | "letter" | "certificate") {
    const isAvatar = type === "avatar";
    const isLetter = type === "letter";
    if (isAvatar) setUploadingAvatar(true);
    else if (isLetter) setUploadingLetter(true);
    else setUploadingCertificate(true);
    try {
      const uploadInfo = await doGetUploadUrl({ data: { filename: file.name, contentType: file.type } });
      await fetch(uploadInfo.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      setForm((prev: any) => ({ 
        ...prev, 
        [isAvatar ? "avatar_url" : isLetter ? "offer_letter_url" : "certificate_url"]: uploadInfo.fileUrl 
      }));
      toast.success(isAvatar ? "Avatar uploaded" : isLetter ? "Offer letter uploaded" : "Certificate uploaded");
    } catch (err: any) {
      toast.error("Upload failed");
    } finally {
      if (isAvatar) setUploadingAvatar(false);
      else if (isLetter) setUploadingLetter(false);
      else setUploadingCertificate(false);
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
             <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone || form.phone_number || ""} onChange={e => setForm({...form, phone: e.target.value, phone_number: e.target.value})} /></div>
             <div className="col-span-2 space-y-1.5"><Label>Address</Label><Input value={form.address || ""} onChange={e => setForm({...form, address: e.target.value})} /></div>
             <div className="space-y-1.5"><Label>{user.role === "employee" ? "Employee ID" : "Intern ID"}</Label><Input value={form.intern_id || ""} onChange={e => setForm({...form, intern_id: e.target.value})} /></div>
             <div className="space-y-1.5"><Label>Position / Specialization Track</Label><Input value={form.position || ""} onChange={e => setForm({...form, position: e.target.value})} placeholder="e.g. Full Stack Web Development" /></div>
             
             {user.role === "intern" && (
               <div className="col-span-2 space-y-1.5">
                 <Label className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold">
                   <Users className="h-4 w-4" /> Assigned Mentor / Supervisor
                 </Label>
                 <Select
                   value={form.mentor_id || "none"}
                   onValueChange={(val) => setForm({ ...form, mentor_id: val === "none" ? null : val })}
                 >
                   <SelectTrigger className="h-9 bg-emerald-50/50 border-emerald-200">
                     <SelectValue placeholder="Select official mentor..." />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="none">Lead Mentor (Jami Eswar Anil Kumar - Default)</SelectItem>
                     {team?.filter((m: any) => (m.id !== user.id && m.user_id !== user.id) && m.role !== "intern").map((mentor: any) => {
                       const mentorId = mentor.id || mentor.user_id;
                       return (
                         <SelectItem key={mentorId} value={mentorId}>
                           {mentor.full_name || mentor.email} ({mentor.position || mentor.department || "Employee"})
                         </SelectItem>
                       );
                     })}
                   </SelectContent>
                 </Select>
                 <p className="text-[11px] text-muted-foreground">This employee will appear as the dedicated mentor on the intern's dashboard and task submissions.</p>
               </div>
             )}

             <div className="space-y-1.5"><Label>Department</Label><Input value={form.department || ""} onChange={e => setForm({...form, department: e.target.value})} placeholder="e.g. Engineering & IT" /></div>
             <div className="space-y-1.5"><Label>Stipend / Compensation</Label><Input value={form.stipend || ""} onChange={e => setForm({...form, stipend: e.target.value})} placeholder="e.g. Performance-based / INR 15,000" /></div>
             <div className="space-y-1.5"><Label>Blood Group</Label><Input value={form.blood_group || ""} onChange={e => setForm({...form, blood_group: e.target.value})} placeholder="e.g. O+ Positive" /></div>
             <div className="space-y-1.5"><Label>Security Clearance</Label><Input value={form.security_level || ""} onChange={e => setForm({...form, security_level: e.target.value})} placeholder="e.g. L3 - Enterprise Access" /></div>
             <div className="space-y-1.5"><Label>Emergency Contact</Label><Input value={form.emergency_contact || ""} onChange={e => setForm({...form, emergency_contact: e.target.value})} placeholder="e.g. +91 98765 00000" /></div>
             <div className="col-span-2 space-y-1.5"><Label>Bank & Financial Details</Label><Input value={form.bank_details || ""} onChange={e => setForm({...form, bank_details: e.target.value})} placeholder="e.g. Kotak Mahindra Bank · A/C 882101923 · IFSC: KKBK0001823" /></div>
             <div className="space-y-1.5"><Label>Start Date</Label><Input type="date" value={form.start_date || ""} onChange={e => setForm({...form, start_date: e.target.value})} /></div>
             <div className="space-y-1.5"><Label>End Date</Label><Input type="date" value={form.end_date || ""} onChange={e => setForm({...form, end_date: e.target.value})} /></div>
          </div>

          {/* Intern Fee Schedule & Exam Policy Controls */}
          {user.role === "intern" && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-amber-700" /> Exam Fee &amp; Payment Schedule Settings
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700">Exam Fee Amount (₹)</Label>
                  <Input 
                    type="number" 
                    value={form.exam_fee_amount !== undefined ? form.exam_fee_amount : 199} 
                    onChange={e => setForm({ ...form, exam_fee_amount: Number(e.target.value) })}
                    className="bg-white h-8 text-xs" 
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700">Payment Due Deadline</Label>
                  <Input 
                    type="datetime-local" 
                    value={form.fee_payment_deadline ? isoToLocalDateTimeInput(form.fee_payment_deadline) : ""} 
                    onChange={e => setForm({ ...form, fee_payment_deadline: e.target.value })}
                    className="bg-white h-8 text-xs" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700">Referral ID Used</Label>
                  <Input 
                    placeholder="e.g. VYNTYRA2026" 
                    value={form.referral_code_used || ""} 
                    onChange={e => setForm({ ...form, referral_code_used: e.target.value.toUpperCase() })}
                    className="bg-white h-8 text-xs font-mono font-semibold uppercase" 
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700">Payment Reference / UTR No</Label>
                  <Input 
                    placeholder="e.g. UTR-987654321" 
                    value={form.payment_reference_no || ""} 
                    onChange={e => setForm({ ...form, payment_reference_no: e.target.value })}
                    className="bg-white h-8 text-xs font-mono" 
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700">Payment Mode</Label>
                  <Input 
                    placeholder="e.g. UPI Transfer / PayU" 
                    value={form.payment_mode || ""} 
                    onChange={e => setForm({ ...form, payment_mode: e.target.value })}
                    className="bg-white h-8 text-xs" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={Boolean(form.fee_payment_scheduled)} 
                    onChange={e => setForm({ ...form, fee_payment_scheduled: e.target.checked })} 
                    className="accent-amber-600 rounded" 
                  />
                  <span className="font-semibold text-slate-800">Fee Scheduled</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={Boolean(form.exam_fee_paid)} 
                    onChange={e => setForm({ ...form, exam_fee_paid: e.target.checked })} 
                    className="accent-emerald-600 rounded" 
                  />
                  <span className="font-semibold text-slate-800">Exam Fee Paid</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={Boolean(form.is_fee_exempted)} 
                    onChange={e => setForm({ ...form, is_fee_exempted: e.target.checked })} 
                    className="accent-purple-600 rounded" 
                  />
                  <span className="font-semibold text-slate-800">Fee Exempted</span>
                </label>
              </div>

              <label className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200 cursor-pointer text-xs">
                <input 
                  type="checkbox" 
                  checked={Boolean(form.urgent_popup_active)} 
                  onChange={e => setForm({ ...form, urgent_popup_active: e.target.checked })} 
                  className="accent-red-600 rounded" 
                />
                <span className="font-bold text-red-900">Show Urgent Onscreen Popup Alert on Intern Portal</span>
              </label>
            </div>
          )}
          
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

          {/* Offer Letter & NOC Management with 1-Click Delete & Regenerate */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-amber-600" /> Offer Letter & NOC Documents</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-[11px] gap-1 bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600"
                onClick={() => {
                  const defaultGroup = "https://chat.whatsapp.com/FXsC4CT1hVRHvKzGH0k5y5";
                  const msg = `Hello ${form.full_name || "Intern"}!\n\nOfficial notice from Project VyNexa at Vyntyra Consultancy Services. Please join our official community group: ${defaultGroup}\n\nBest regards,\nVyntyra Directorate`;
                  const phone = (form.phone || form.phone_number || "").replace(/[^0-9]/g, "");
                  const url = phone ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}` : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
                  window.open(url, "_blank");
                }}
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Message / Group
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-2.5 bg-white dark:bg-slate-800 border rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Offer Letter PDF</span>
                  {form.offer_letter_url && (
                    <a href={form.offer_letter_url} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5">
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full text-xs font-semibold h-7 bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-300 gap-1"
                  onClick={async () => {
                    const lToast = toast.loading("Regenerating Offer Letter with 1-click...");
                    try {
                      const res = await deleteStoredOfferLetterAndRegenerate({ data: { profileId: user.id, email: user.email } });
                      toast.dismiss(lToast);
                      toast.success("Offer Letter regenerated!");
                      setForm((prev: any) => ({ ...prev, offer_letter_url: res.offer_letter_url }));
                      qc.invalidateQueries({ queryKey: ["team-members"] });
                    } catch (e: any) {
                      toast.dismiss(lToast);
                      toast.error("Failed: " + e.message);
                    }
                  }}
                >
                  <RefreshCw className="h-3 w-3" /> Delete & Regenerate Offer Letter
                </Button>
              </div>

              <div className="p-2.5 bg-white dark:bg-slate-800 border rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">NOC Verification PDF</span>
                  {form.noc_url && (
                    <a href={form.noc_url} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5">
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full text-xs font-semibold h-7 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-300 gap-1"
                  onClick={async () => {
                    const lToast = toast.loading("Regenerating NOC with 1-click...");
                    try {
                      const res = await deleteStoredNocAndRegenerate({ data: { profileId: user.id, email: user.email } });
                      toast.dismiss(lToast);
                      toast.success("NOC Certificate regenerated!");
                      setForm((prev: any) => ({ ...prev, noc_url: res.noc_url }));
                      qc.invalidateQueries({ queryKey: ["team-members"] });
                    } catch (e: any) {
                      toast.dismiss(lToast);
                      toast.error("Failed: " + e.message);
                    }
                  }}
                >
                  <RefreshCw className="h-3 w-3" /> Delete & Regenerate NOC
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Certificate</Label>
            <div className="flex gap-2">
              <Input value={form.certificate_url || ""} onChange={e => setForm({...form, certificate_url: e.target.value})} placeholder="https://example.com/certificate.pdf" />
              <div className="relative shrink-0">
                <Button type="button" variant="outline" disabled={uploadingCertificate} className="w-[100px]">
                  {uploadingCertificate ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload"}
                </Button>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="application/pdf,image/*" onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "certificate"); }} />
              </div>
            </div>
            {form.certificate_url && (
              <a href={form.certificate_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                <FileText className="h-3 w-3" /> View Certificate
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
                          <SmartAvatar
                            src={intern.avatar_url}
                            alt={intern.full_name}
                            fallbackInitials={(intern.full_name || "?")[0]}
                            className="h-7 w-7 rounded-full"
                          />
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

              {/* Dropdown to assign a new intern - Filtered to ONLY unassigned / remaining interns */}
              {(() => {
                const unassignedInterns = (team || []).filter((m: any) => m.role === "intern" && (!m.mentor_id || m.mentor_id === "none" || m.mentor_id === null));
                return (
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-slate-600">Assign a new Intern (Unassigned Only)</Label>
                        <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
                          {unassignedInterns.length} Unassigned Remaining
                        </span>
                      </div>
                      <Select 
                        value={selectedInternToAssign} 
                        onValueChange={setSelectedInternToAssign}
                      >
                        <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-10">
                          <SelectValue placeholder={unassignedInterns.length > 0 ? "Select unassigned intern..." : "No unassigned interns remaining"} />
                        </SelectTrigger>
                        <SelectContent>
                          {unassignedInterns.length === 0 ? (
                            <SelectItem value="none" disabled>No unassigned interns remaining</SelectItem>
                          ) : (
                            unassignedInterns.map((intern: any) => (
                              <SelectItem key={intern.id} value={intern.id}>
                                {intern.full_name} ({intern.email}) {intern.intern_id && `· ID: ${intern.intern_id}`} {intern.position && `· ${intern.position}`}
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
                );
              })()}
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

function SmsGatewayHub({ smsLogsQ, doSendSms, doDeleteSmsLog, qc }: any) {
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const [provider, setProvider] = useState<"auto" | "twilio" | "textbee" | "httpsms">("auto");
  const [isSending, setIsSending] = useState(false);

  const quotaQ = useQuery({
    queryKey: ["sms-quota-stats"],
    queryFn: () => getSmsQuotaStats(),
    refetchInterval: 10000,
  });

  const quota = quotaQ.data || {
    totalSentThisMonth: 0,
    twilioSentThisMonth: 0,
    textbeeSentThisMonth: 0,
    textbeeSentToday: 0,
    textbeeAvailableMonth: 300,
    textbeeAvailableToday: 50,
    httpsmsSentThisMonth: 0,
    httpsmsAvailableMonth: 200,
    hasTwilio: false,
    twilioAccountSid: null,
    hasTextBee: false,
    hasHttpSms: false,
  };

  const smsLogs = smsLogsQ.data || [];

  async function handleSendSms(e: React.FormEvent) {
    e.preventDefault();
    if (!recipientPhone || !message) {
      toast.error("Please enter a valid recipient phone number and SMS message!");
      return;
    }
    setIsSending(true);
    try {
      await doSendSms({
        data: {
          recipient_phone: recipientPhone,
          recipient_name: recipientName,
          message: message,
          preferred_provider: provider,
        }
      });
      toast.success("SMS notification sent successfully!");
      setRecipientPhone("");
      setRecipientName("");
      setMessage("");
      qc.invalidateQueries({ queryKey: ["sms-logs"] });
      qc.invalidateQueries({ queryKey: ["sms-quota-stats"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to send SMS notification");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Provider Quota Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Twilio SMS Card */}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">Twilio SMS API</span>
            <span className="bg-indigo-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              Global SMS Gateway
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-indigo-950">{(quota.twilioSentThisMonth || 0).toLocaleString()}</div>
            <div className="text-xs text-indigo-800 font-medium">Sent This Month</div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-indigo-800 pt-0.5 font-mono">
            <span>SID: {quota.twilioAccountSid ? quota.twilioAccountSid.slice(0, 12) + "..." : "AC2d14c4fd..."}</span>
            <span className="text-emerald-700 font-bold">{quota.hasTwilio ? "âœ“ Configured" : "âš ï¸ Key Configured"}</span>
          </div>
          <div className="text-[10.5px] text-indigo-900 font-medium pt-1 border-t border-indigo-200/60">
            Twilio API Key: SK4d739a2e... (Direct Carrier SMS)
          </div>
        </div>

        {/* TextBee Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">TextBee Gateway (textbee.dev)</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              300 SMS / month
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900">{quota.textbeeAvailableMonth}</div>
            <div className="text-xs text-slate-500 font-medium">Available Month</div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all" 
              style={{ width: `${Math.min(100, (quota.textbeeSentThisMonth / 300) * 100)}%` }} 
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span>Today: <strong>{quota.textbeeSentToday} / 50 max</strong></span>
            <span className="text-slate-400">Resets monthly &amp; daily</span>
          </div>
          <div className="text-[10.5px] text-slate-500 italic pt-1 border-t border-slate-100">
            Restrictions: Max 50 texts per day.
          </div>
        </div>

        {/* HttpSMS Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">HttpSMS Gateway (httpsms.com)</span>
            <span className="bg-sky-100 text-sky-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              200 SMS / month
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900">{quota.httpsmsAvailableMonth}</div>
            <div className="text-xs text-slate-500 font-medium">Available Month</div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-sky-500 h-full transition-all" 
              style={{ width: `${Math.min(100, (quota.httpsmsSentThisMonth / 200) * 100)}%` }} 
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span>Sent: <strong>{quota.httpsmsSentThisMonth} / 200</strong></span>
            <span className="text-slate-400">Resets monthly</span>
          </div>
          <div className="text-[10.5px] text-sky-800 font-medium pt-1 border-t border-slate-100">
            Requires an Android device (Android Gateway App).
          </div>
        </div>
      </div>

      {/* Quick SMS Dispatcher Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-emerald-600" /> Send Instant Candidate SMS Notification
        </h3>

        <form onSubmit={handleSendSms} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Recipient Phone Number *</Label>
              <Input
                placeholder="+91 98765 43210"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="mt-1 font-mono text-xs"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Candidate Name (Optional)</Label>
              <Input
                placeholder="Candidate Name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Preferred Gateway Provider</Label>
              <Select value={provider} onValueChange={(val: any) => setProvider(val)}>
                <SelectTrigger className="mt-1 text-xs">
                  <SelectValue placeholder="Auto Load Balance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto Load Balance (Recommended)</SelectItem>
                  <SelectItem value="twilio">Twilio SMS API Gateway (Direct Carrier)</SelectItem>
                  <SelectItem value="textbee">TextBee Gateway (300/mo &middot; 50/day)</SelectItem>
                  <SelectItem value="httpsms">HttpSMS Gateway (200/mo &middot; Android)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">SMS Message Body *</Label>
            <Textarea
              rows={3}
              placeholder="e.g. Congratulations! Your application for Vyntyra Internship Program 2026 has been reviewed. Check your portal: https://careers.vyntyraconsultancyservices.in/"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 text-xs p-3 font-mono"
              required
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSending} className="bg-emerald-600 hover:bg-emerald-700 text-xs gap-2">
              <Send className="h-3.5 w-3.5" /> {isSending ? "Dispatching SMS..." : "Dispatch SMS Notification"}
            </Button>
          </div>
        </form>
      </div>

      {/* SMS Dispatch History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">SMS Outbound Dispatch Logs</h4>
          <span className="text-xs text-slate-500 font-mono">{smsLogs.length} Log Entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Phone Number</th>
                <th className="px-5 py-3">Candidate Name</th>
                <th className="px-5 py-3">Provider</th>
                <th className="px-5 py-3">Message Snippet</th>
                <th className="px-5 py-3">Sent Time</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {smsLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    No SMS notifications sent yet.
                  </td>
                </tr>
              ) : (
                smsLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-800">{log.recipient_phone}</td>
                    <td className="px-5 py-3.5 text-slate-700">{log.recipient_name || "â€”"}</td>
                    <td className="px-5 py-3.5">
                      {log.provider === "httpsms" ? (
                        <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          HttpSMS
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          TextBee
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate" title={log.message}>{log.message}</td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono">{new Date(log.sent_at).toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      {log.status === "sent" ? (
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          Sent
                        </span>
                      ) : (
                        <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          if (confirm("Delete SMS log record?")) {
                            await doDeleteSmsLog({ data: { id: log.id } });
                            qc.invalidateQueries({ queryKey: ["sms-logs"] });
                            toast.success("SMS log deleted.");
                          }
                        }}
                        className="h-7 w-7 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
