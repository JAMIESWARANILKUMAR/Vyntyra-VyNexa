import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { 
  listAllInternTasksWithProgress, reviewInternTaskByAdmin, deleteTask, 
  reviewDeadlineExtension, bulkDeleteTasks, deleteTaskBatch, deleteAllInternTasks, 
  adminFinalizeTaskCompletion, listActiveInternsForCohortAssignment, rolloverVerifiedTasksToCohort,
  moveTasksToStoredBank, assignStoredTasksToInterns
} from "@/lib/operations.functions";
import { Button } from "@/components/ui/button";
import { Award, CreditCard, Layers, ArrowRight, CheckCheck, RefreshCw, SendHorizonal, Calendar, FolderArchive, Archive, PackageCheck, BookmarkPlus, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { InternTaskAssignmentModal } from "@/components/intern-task-assignment-modal";
import {
  ClipboardList, Search, Plus, CheckCircle2, Clock, AlertTriangle, ExternalLink,
  Trash2, Sparkles, Filter, FileText, Check, RotateCcw, User, Eye, Download, Bell,
  Mail, MessageSquare, Loader2, Send, Users, Video, BookOpen, Play
} from "lucide-react";
import { sendTaskNotification } from "@/lib/notifications.functions";
import { sendTaskNotificationEmail, generateTaskWhatsApp } from "@/lib/notifications-omni.functions";
import { toast } from "sonner";
import { TaskRichDescription } from "@/components/task-rich-description";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";

export function AdminInternTasksView() {
  const qc = useQueryClient();
  const fetchTasks = useServerFn(listAllInternTasksWithProgress);
  const doReview = useServerFn(reviewInternTaskByAdmin);
  const doAdminFinalize = useServerFn(adminFinalizeTaskCompletion);
  const doDelete = useServerFn(deleteTask);
  const doBulkDelete = useServerFn(bulkDeleteTasks);
  const doReviewDeadlineExtension = useServerFn(reviewDeadlineExtension);
  const doDeleteBatch = useServerFn(deleteTaskBatch);
  const doClearAllTasks = useServerFn(deleteAllInternTasks);
  const doSendNotification = useServerFn(sendTaskNotification);
  const doSendTaskEmail = useServerFn(sendTaskNotificationEmail);
  const doGenTaskWhatsApp = useServerFn(generateTaskWhatsApp);
  const fetchActiveInterns = useServerFn(listActiveInternsForCohortAssignment);
  const doRollover = useServerFn(rolloverVerifiedTasksToCohort);
  const doMoveToStoredBank = useServerFn(moveTasksToStoredBank);
  const doAssignStoredTasks = useServerFn(assignStoredTasksToInterns);

  // Tab State: "active" (Assigned to Interns) vs "stored_bank" (Repository for Future)
  const [activeViewTab, setActiveViewTab] = useState<"active" | "stored_bank">("active");

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [clearAllModalOpen, setClearAllModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // Stored Bank State
  const [assignStoredModalOpen, setAssignStoredModalOpen] = useState(false);
  const [selectedStoredTaskIds, setSelectedStoredTaskIds] = useState<string[]>([]);
  const [storedTargetInternIds, setStoredTargetInternIds] = useState<string[]>([]);
  const [storedDueDate, setStoredDueDate] = useState("");
  const [storedPriority, setStoredPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [storedCustomInstructions, setStoredCustomInstructions] = useState("");
  const [storedInternSearch, setStoredInternSearch] = useState("");
  const [storedInternDomainFilter, setStoredInternDomainFilter] = useState("all");
  const [isAssigningStored, setIsAssigningStored] = useState(false);
  const [isStoringTasks, setIsStoringTasks] = useState(false);
  const [storedTaskSearchQuery, setStoredTaskSearchQuery] = useState("");
  const [storedTaskDomainFilter, setStoredTaskDomainFilter] = useState("all");

  // Cohort Rollover State
  const [rolloverModalOpen, setRolloverModalOpen] = useState(false);
  const [rolloverStep, setRolloverStep] = useState<1 | 2>(1);
  const [selectedVerifiedTaskIds, setSelectedVerifiedTaskIds] = useState<string[]>([]);
  const [targetCohort, setTargetCohort] = useState("Cohort September 2026");
  const [selectedTargetInternIds, setSelectedTargetInternIds] = useState<string[]>([]);
  const [targetDueDate, setTargetDueDate] = useState("");
  const [targetPriority, setTargetPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [targetDomain, setTargetDomain] = useState<string>("all");
  const [customCohortInstructions, setCustomCohortInstructions] = useState("");
  const [notifyInterns, setNotifyInterns] = useState(true);
  const [isRolloverLoading, setIsRolloverLoading] = useState(false);
  const [internSearchQuery, setInternSearchQuery] = useState("");
  const [internDomainFilter, setInternDomainFilter] = useState("all");
  const [verifiedTaskSearchQuery, setVerifiedTaskSearchQuery] = useState("");
  const [verifiedTaskDomainFilter, setVerifiedTaskDomainFilter] = useState("all");
  const [onlyVerifiedFilter, setOnlyVerifiedFilter] = useState(true);

  const toggleExpand = (key: string) => {
    setExpandedGroups(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  
  // Bulk Selection State
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Review modal state
  const [selectedTaskForReview, setSelectedTaskForReview] = useState<any>(null);
  const [adminRemarks, setAdminRemarks] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Individual Task Status Email Modal State
  const [taskEmailModalOpen, setTaskEmailModalOpen] = useState(false);
  const [isSendingTaskEmail, setIsSendingTaskEmail] = useState(false);
  const [taskEmailForm, setTaskEmailForm] = useState({
    recipient_email: "",
    recipient_name: "",
    recipient_phone: "",
    task_title: "",
    task_status: "assigned", // 'assigned' | 'completed' | 'changes_requested' | 'submitted' | 'deadline_reminder'
    mentor_remarks: "",
    custom_subject: "",
    due_date: "",
    credits: 10,
  });

  async function openTaskEmailModal(t: any, defaultStatus?: string) {
    const profile = t.assigned_profile || {};
    const email = profile.email || "";
    const name = profile.full_name || profile.name || "";
    let phone = profile.phone || profile.phone_number || profile.mobile || profile.whatsapp || "";
    const status = defaultStatus || t.status || "assigned";
    const targetId = t.assigned_to || t.target_user_id || t.user_id;

    // Auto-fetch intern phone number from profiles table if missing from cached profile
    if (!phone && (targetId || email)) {
      try {
        let q = supabase.from("profiles").select("phone, phone_number");
        if (targetId) {
          q = q.eq("id", targetId);
        } else if (email) {
          q = q.eq("email", email);
        }
        const { data: pData } = await q.maybeSingle();
        if (pData) {
          phone = pData.phone || pData.phone_number || "";
        }
      } catch (err) {
        console.warn("[openTaskEmailModal] Phone auto-fetch error:", err);
      }
    }

    setTaskEmailForm({
      recipient_email: email,
      recipient_name: name,
      recipient_phone: phone,
      task_title: t.title || "Internship Project Milestone",
      task_status: status,
      mentor_remarks: t.progress_notes || "",
      custom_subject: "",
      due_date: t.due_date || "",
      credits: t.credits || 10,
    });
    setTaskEmailModalOpen(true);
  }

  async function handleSendTaskEmailSubmit() {
    if (!taskEmailForm.recipient_email) {
      return toast.error("Recipient email is missing.");
    }
    setIsSendingTaskEmail(true);
    try {
      await doSendTaskEmail({
        data: {
          recipient_email: taskEmailForm.recipient_email,
          recipient_name: taskEmailForm.recipient_name,
          task_title: taskEmailForm.task_title,
          task_status: taskEmailForm.task_status,
          mentor_remarks: taskEmailForm.mentor_remarks,
          custom_subject: taskEmailForm.custom_subject || undefined,
          due_date: taskEmailForm.due_date || undefined,
          credits: taskEmailForm.credits,
        },
      });
      toast.success(`Task status email dispatched to ${taskEmailForm.recipient_email}!`);
      setTaskEmailModalOpen(false);
    } catch (err: any) {
      toast.error("Failed to send task email: " + err.message);
    } finally {
      setIsSendingTaskEmail(false);
    }
  }

  async function handleSendTaskWhatsAppSubmit() {
    if (!taskEmailForm.recipient_phone || !taskEmailForm.recipient_phone.trim()) {
      return toast.error("Please enter the intern's WhatsApp phone number in the field above.");
    }
    try {
      const res = await doGenTaskWhatsApp({
        data: {
          recipientPhone: taskEmailForm.recipient_phone.trim(),
          recipientName: taskEmailForm.recipient_name,
          taskTitle: taskEmailForm.task_title,
          taskStatus: taskEmailForm.task_status,
          remarks: taskEmailForm.mentor_remarks,
        },
      });
      window.open(res.whatsappUrl, "_blank");
      toast.success("WhatsApp status notification opened!");
    } catch (err: any) {
      toast.error("Failed to generate WhatsApp: " + err.message);
    }
  }

  const tasksQ = useQuery({
    queryKey: ["admin-intern-tasks"],
    queryFn: () => fetchTasks(),
    refetchInterval: 5000, // Live poll task progress every 5 seconds
  });

  const tasks: any[] = tasksQ.data || [];

  // Split tasks into Active Assigned vs Stored Future Repository
  const activeAssignedTasks = tasks.filter((t) => t && t.assigned_to && !t.is_pool_task);
  const storedBankTasks = tasks.filter((t) => t && (!t.assigned_to || t.is_pool_task));

  // Filter Active Assigned Tasks
  const filteredTasks = activeAssignedTasks.filter((t) => {
    if (!t) return false;
    const internName = t.assigned_profile?.full_name || t.assigned_profile?.email || "";
    const title = t.title || "";
    const description = t.description || "";
    const searchLower = (searchQuery || "").toLowerCase();
    
    const titleMatches = !searchLower || 
                         title.toLowerCase().includes(searchLower) ||
                         internName.toLowerCase().includes(searchLower) ||
                         description.toLowerCase().includes(searchLower);

    const statusMatches = statusFilter === "all" || t.status === statusFilter;
    const priorityMatches = priorityFilter === "all" || t.priority === priorityFilter;

    return titleMatches && statusMatches && priorityMatches;
  });

  // Filter Stored Bank Tasks
  const filteredStoredTasks = storedBankTasks.filter((t) => {
    if (!t) return false;
    const title = t.title || "";
    const description = t.description || "";
    const searchLower = (storedTaskSearchQuery || "").toLowerCase();
    const titleMatches = !searchLower || title.toLowerCase().includes(searchLower) || description.toLowerCase().includes(searchLower);
    const domainMatches = storedTaskDomainFilter === "all" || (t.task_domain || "").toLowerCase() === storedTaskDomainFilter.toLowerCase();
    return titleMatches && domainMatches;
  });

  // Group active tasks by batch safely
  const groupedTasks = filteredTasks.reduce((acc, t) => {
    if (!t) return acc;
    const key = `${t.title || 'Untitled'}-${t.created_at || 'date'}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {} as Record<string, any[]>);
  
  const groupedTaskEntries = (Object.values(groupedTasks) as any[][]).sort((a, b) => {
    const timeB = b?.[0]?.created_at ? new Date(b[0].created_at).getTime() : 0;
    const timeA = a?.[0]?.created_at ? new Date(a[0].created_at).getTime() : 0;
    return timeB - timeA;
  });

  // Calculate statistics safely for active tasks
  const totalCount = activeAssignedTasks.length;
  const inProgressCount = activeAssignedTasks.filter((t) => t?.status === "in_progress").length;
  const submittedCount = activeAssignedTasks.filter((t) => t?.status === "submitted" || t?.deliverable_url).length;
  const completedCount = activeAssignedTasks.filter((t) => 
    t?.status === "completed" || 
    t?.status === "verified" || 
    t?.status === "approved" || 
    t?.status === "done" || 
    t?.status === "resolved" || 
    t?.is_verified === true
  ).length;

  const handleUpdateStatus = async (taskId: string, newStatus: any, remarks?: string) => {
    try {
      await doReview({
        data: {
          taskId,
          status: newStatus,
          admin_remarks: remarks,
        },
      });
      qc.invalidateQueries({ queryKey: ["admin-intern-tasks"] });
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      toast.success(`Task status updated to ${newStatus}`);
      setSelectedTaskForReview(null);
    } catch (err: any) {
      toast.error("Failed to update task: " + err.message);
    }
  };

  const handleDeleteBatch = async (title: string, created_at: string) => {
    if (!confirm(`Are you sure you want to delete this mass-assigned task? This will delete it for ALL assigned interns.`)) return;
    try {
      await doDeleteBatch({ data: { title, created_at } });
      qc.invalidateQueries({ queryKey: ["admin-intern-tasks"] });
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      toast.success("Batch deleted successfully.");
    } catch (err: any) {
      toast.error("Failed to delete batch: " + err.message);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await doDelete({ data: { id: taskId } });
      qc.invalidateQueries({ queryKey: ["admin-intern-tasks"] });
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      toast.success("Task deleted successfully");
    } catch (err: any) {
      toast.error("Failed to delete task: " + err.message);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTaskIds(filteredTasks.map(t => t.id));
    } else {
      setSelectedTaskIds([]);
    }
  };

  const handleToggleSelect = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTaskIds(prev => [...prev, taskId]);
    } else {
      setSelectedTaskIds(prev => prev.filter(id => id !== taskId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTaskIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedTaskIds.length} selected task(s)?`)) return;
    
    try {
      await doBulkDelete({ data: { taskIds: selectedTaskIds } });
      qc.invalidateQueries({ queryKey: ["admin-intern-tasks"] });
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      setSelectedTaskIds([]);
      toast.success(`${selectedTaskIds.length} tasks deleted successfully.`);
    } catch (err: any) {
      toast.error("Failed to delete tasks: " + err.message);
    }
  };

  const handleClearAllTasks = async () => {
    try {
      await doClearAllTasks();
      qc.invalidateQueries({ queryKey: ["admin-intern-tasks"] });
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      toast.success("All intern tasks have been cleared.");
      setClearAllModalOpen(false);
    } catch (err: any) {
      toast.error("Failed to clear tasks: " + err.message);
    }
  };

  const handleExtractAll = () => {
    const tasksToExtract = selectedTaskIds.length > 0 
      ? filteredTasks.filter(t => selectedTaskIds.includes(t.id)) 
      : filteredTasks;
      
    if (tasksToExtract.length === 0) {
      toast.error("No tasks to extract.");
      return;
    }

    const headers = ["Intern Name", "Intern Email", "Task Title", "Status", "Priority", "Assigned Date", "Deadline", "Task Description"];
    const rows = tasksToExtract.map(t => [
      `"${t.assigned_profile?.full_name || ''}"`,
      `"${t.assigned_profile?.email || ''}"`,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${t.status || ''}"`,
      `"${t.priority || ''}"`,
      `"${new Date(t.created_at).toLocaleDateString()}"`,
      `"${t.due_date || 'N/A'}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `intern_tasks_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Tasks exported to CSV successfully.");
  };

  const internsQ = useQuery({
    queryKey: ["active-interns-for-cohort"],
    queryFn: () => fetchActiveInterns(),
    enabled: rolloverModalOpen || assignStoredModalOpen,
  });
  const allActiveInterns: any[] = internsQ.data || [];

  const handleMoveToStoredBank = async (taskIds: string[]) => {
    if (!taskIds || taskIds.length === 0) {
      return toast.error("Please select at least one task to move to Stored Bank.");
    }
    if (!confirm(`Are you sure you want to move ${taskIds.length} task(s) to the Stored Bank for future use? They will be unassigned from current interns and preserved in the repository.`)) {
      return;
    }
    setIsStoringTasks(true);
    try {
      await doMoveToStoredBank({ data: { taskIds } });
      qc.invalidateQueries({ queryKey: ["admin-intern-tasks"] });
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      setSelectedTaskIds([]);
      toast.success(`Successfully moved ${taskIds.length} task(s) to Stored Task Bank (For Future Use)!`);
    } catch (err: any) {
      toast.error("Failed to move tasks to store: " + err.message);
    } finally {
      setIsStoringTasks(false);
    }
  };

  const handleAssignStoredTasksSubmit = async () => {
    if (selectedStoredTaskIds.length === 0) {
      return toast.error("Please select at least one stored task to assign.");
    }
    if (storedTargetInternIds.length === 0) {
      return toast.error("Please select at least one intern to assign the task(s) to.");
    }
    setIsAssigningStored(true);
    try {
      const res = await doAssignStoredTasks({
        data: {
          storedTaskIds: selectedStoredTaskIds,
          targetInternIds: storedTargetInternIds,
          dueDate: storedDueDate || null,
          priority: storedPriority,
          customInstructions: storedCustomInstructions || null,
          notifyInterns: true,
        },
      });
      qc.invalidateQueries({ queryKey: ["admin-intern-tasks"] });
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      toast.success(`Assigned ${res.assignedCount} task(s) to ${res.internCount} intern(s) successfully!`);
      setAssignStoredModalOpen(false);
      setSelectedStoredTaskIds([]);
      setStoredTargetInternIds([]);
    } catch (err: any) {
      toast.error("Failed to assign stored tasks: " + err.message);
    } finally {
      setIsAssigningStored(false);
    }
  };

  const handleExecuteRollover = async () => {
    if (selectedVerifiedTaskIds.length === 0) {
      return toast.error("Please select at least one task to rollover.");
    }
    if (!targetCohort.trim()) {
      return toast.error("Please enter the target cohort name.");
    }
    setIsRolloverLoading(true);
    try {
      const res = await doRollover({
        data: {
          sourceTaskIds: selectedVerifiedTaskIds,
          targetCohort: targetCohort.trim(),
          targetInternIds: selectedTargetInternIds,
          dueDate: targetDueDate || null,
          priority: targetPriority,
          taskDomain: targetDomain === "all" ? null : targetDomain,
          customInstructions: customCohortInstructions || null,
          notifyInterns,
        }
      });
      qc.invalidateQueries({ queryKey: ["admin-intern-tasks"] });
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      toast.success(`Successfully rolled over ${res.clonedTaskCount} task(s) for ${res.assignedInternCount} intern(s) in ${res.targetCohort}!`);
      setRolloverModalOpen(false);
      setSelectedVerifiedTaskIds([]);
      setSelectedTargetInternIds([]);
    } catch (err: any) {
      toast.error("Failed to rollover tasks: " + err.message);
    } finally {
      setIsRolloverLoading(false);
    }
  };

  const allVerifiedTasks = tasks.filter((t) => {
    if (!t) return false;
    if (onlyVerifiedFilter) {
      return t.status === "completed" || t.is_verified === true || t.status === "submitted";
    }
    return true;
  });

  const filteredVerifiedTasks = allVerifiedTasks.filter((t) => {
    const titleMatch = !verifiedTaskSearchQuery || 
      (t.title || "").toLowerCase().includes(verifiedTaskSearchQuery.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(verifiedTaskSearchQuery.toLowerCase());
    const domainMatch = verifiedTaskDomainFilter === "all" || (t.task_domain || "").toLowerCase() === verifiedTaskDomainFilter.toLowerCase();
    return titleMatch && domainMatch;
  });

  const filteredTargetInterns = allActiveInterns.filter((intern) => {
    const searchLower = internSearchQuery.toLowerCase();
    const matchesSearch = !searchLower ||
      (intern.full_name || "").toLowerCase().includes(searchLower) ||
      (intern.email || "").toLowerCase().includes(searchLower) ||
      (intern.intern_id || "").toLowerCase().includes(searchLower) ||
      (intern.department || "").toLowerCase().includes(searchLower);
    const matchesDomain = internDomainFilter === "all" ||
      (intern.department || intern.domain || "").toLowerCase().includes(internDomainFilter.toLowerCase());
    return matchesSearch && matchesDomain;
  });

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6">
      {/* ── Top View Navigation Tabs ── */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit border shadow-xs">
        <button
          type="button"
          onClick={() => setActiveViewTab("active")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeViewTab === "active"
              ? "bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-sm border"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          <span>Active Assigned Tasks</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeViewTab === "active" ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-700"}`}>
            {activeAssignedTasks.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveViewTab("stored_bank")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeViewTab === "stored_bank"
              ? "bg-white dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 shadow-sm border"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <FolderArchive className="h-4 w-4 text-emerald-600" />
          <span>Stored Task Bank (Future Repository)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeViewTab === "stored_bank" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
            {storedBankTasks.length}
          </span>
        </button>
      </div>

      {activeViewTab === "active" && (
        <div className="space-y-6 w-full max-w-full">
          {/* Header Banner & Stat Cards */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white dark:bg-slate-950 p-5 sm:p-6 rounded-2xl border shadow-sm">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ClipboardList className="h-6 w-6 text-indigo-600 shrink-0" /> Active Intern Tasks &amp; Progress Tracker
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Monitor and verify live intern milestone submissions. Move completed or reusable tasks directly to the Stored Bank for future cohorts with 1 click.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 w-full lg:w-auto">
              <Button
                onClick={async () => {
                  const completedIds = activeAssignedTasks
                    .filter(t => t.status === 'completed' || t.is_verified)
                    .map(t => t.id);
                  if (completedIds.length === 0) {
                    return toast.info("No completed tasks found in active list to move. You can also select specific tasks and click 'Move to Stored Bank'.");
                  }
                  await handleMoveToStoredBank(completedIds);
                }}
                className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md gap-2 cursor-pointer text-xs h-9"
                title="Immediately moves all completed tasks to the Stored Task Bank for future cohorts without needing to assign them first"
              >
                <FolderArchive className="h-4 w-4" /> Move Completed Tasks to Stored Bank (For Future)
              </Button>
              <Button
                onClick={() => setClearAllModalOpen(true)}
                variant="destructive"
                className="font-semibold shadow-md shrink-0 text-xs h-9 cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-1.5" /> Clear All Tasks
              </Button>
              <Button
                onClick={() => setAssignModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shrink-0 text-xs h-9 cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Assign Tasks (CSV / Manual)
              </Button>
            </div>
          </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-white dark:bg-slate-950 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Total Intern Tasks</div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{totalCount}</div>
        </div>
        <div className="p-4 rounded-xl border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 shadow-sm">
          <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">In Progress</div>
          <div className="text-2xl font-black text-amber-900 dark:text-amber-300 mt-1">{inProgressCount}</div>
        </div>
        <div className="p-4 rounded-xl border bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900 shadow-sm">
          <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">Submitted / Under Review</div>
          <div className="text-2xl font-black text-indigo-900 dark:text-indigo-300 mt-1">{submittedCount}</div>
        </div>
        <div className="p-4 rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 shadow-sm">
          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Completed</div>
          <div className="text-2xl font-black text-emerald-900 dark:text-emerald-300 mt-1">{completedCount}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-950 p-4 rounded-xl border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by intern name, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32 text-xs">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions & Select All */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900 border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Checkbox 
            id="select-all" 
            checked={filteredTasks.length > 0 && selectedTaskIds.length === filteredTasks.length} 
            onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
          />
          <label htmlFor="select-all" className="text-sm font-medium cursor-pointer text-slate-700 dark:text-slate-300">
            Select All <span className="text-slate-500">({selectedTaskIds.length} selected)</span>
          </label>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {selectedTaskIds.length > 0 && (
            <>
              <Button 
                size="sm" 
                onClick={() => handleMoveToStoredBank(selectedTaskIds)} 
                className="h-8 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs gap-1.5 cursor-pointer"
                title="Unassign selected tasks from current interns and preserve in Stored Bank for future cohorts"
              >
                <FolderArchive className="h-3.5 w-3.5" /> Move to Stored Bank ({selectedTaskIds.length})
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBulkDelete} className="h-8 text-xs font-semibold cursor-pointer">
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Selected
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={handleExtractAll} className="h-8 text-xs font-semibold bg-white dark:bg-slate-950 cursor-pointer">
            <Download className="h-3.5 w-3.5 mr-1.5 text-indigo-600" /> Extract {selectedTaskIds.length > 0 ? "Selected" : "All"}
          </Button>
        </div>
      </div>



      {/* Intern Tasks Progress Table */}
      <div className="rounded-xl border bg-white dark:bg-slate-950 shadow-sm overflow-hidden divide-y">
        {groupedTaskEntries.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No intern tasks found matching criteria. Click <strong className="text-indigo-600">Assign Tasks</strong> to start!
          </div>
        ) : (
          groupedTaskEntries.map((group) => {
            const isBatch = group.length > 1;
            const rep = group[0];
            const groupKey = `${rep.title}-${rep.created_at}`;
            const isExpanded = expandedGroups.includes(groupKey);

            const renderTask = (t: any) => {
              const internProfile = t.assigned_profile;
              const internName = internProfile?.full_name || internProfile?.email || "Assigned Intern";
              const taskFile = t.project_requirements || t.task_file_url;
              const submissionFile = t.deliverable_url;
              return (
                <div key={t.id} className="p-4 sm:p-5 hover:bg-slate-50/60 dark:hover:bg-slate-900/60 transition-colors flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 w-full min-w-0">
                  {/* Left: Bulk Checkbox & Intern & Task Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0 w-full">
                    <div className="mt-1 shrink-0">
                      <Checkbox 
                        checked={selectedTaskIds.includes(t.id)} 
                        onCheckedChange={(checked) => handleToggleSelect(t.id, checked as boolean)}
                      />
                    </div>

                    {/* Intern & Task Info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100 break-words">{t.title}</span>

                        {/* Status Badge */}
                        {t.status === "completed" && (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
                          </Badge>
                        )}
                        {(t.status === "submitted" || submissionFile) && t.status !== "completed" && (
                          <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[10px]">
                            <Sparkles className="h-3 w-3 mr-1" /> Submitted
                          </Badge>
                        )}
                        {t.status === "in_progress" && (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
                            <Clock className="h-3 w-3 mr-1" /> In Progress
                          </Badge>
                        )}
                        {t.status === "pending" && (
                          <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px]">
                            Pending Start
                          </Badge>
                        )}

                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-600">
                          Priority: {t.priority || "medium"}
                        </Badge>

                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 border-indigo-200">
                          Level: {t.level || "Beginner"}
                        </Badge>

                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 border-amber-200 flex items-center gap-0.5">
                          <CreditCard className="h-3 w-3 text-amber-600" /> {t.credits || 10} Credits
                        </Badge>

                        {(t.team_name || t.team_id || t.assignment_mode === "team") && (
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] flex items-center gap-1">
                            <Users className="h-3 w-3 text-purple-700" /> {t.team_name || `Collaborative Team (${t.team_size || 2})`}
                          </Badge>
                        )}
                      </div>

                      {t.description && (
                        <TaskRichDescription description={t.description} teamMembers={t.team_members || t.team_member_names} />
                      )}

                      <div className="flex items-center gap-3 sm:gap-4 text-[11px] text-slate-500 flex-wrap pt-1">
                        <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                          <User className="h-3.5 w-3.5 text-indigo-500 shrink-0" /> {internName} {internProfile?.intern_id ? `(${internProfile.intern_id})` : ""}
                        </span>

                        {t.due_date && (
                          <span>Deadline: <strong className="text-slate-700 dark:text-slate-300">{t.due_date}</strong></span>
                        )}

                        {taskFile && (
                          <a
                            href={taskFile}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-medium"
                          >
                            <FileText className="h-3.5 w-3.5" /> View Task File
                          </a>
                        )}

                        {t.task_meet_link && (
                          <a
                            href={t.task_meet_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-700 hover:underline inline-flex items-center gap-1 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                          >
                            <Video className="h-3.5 w-3.5 text-blue-600" /> Meet Link
                          </a>
                        )}
                      </div>

                      {/* Mentor Feedback / Progress notes */}
                      {(t.mentor_report || t.progress_notes) && (
                        <div className="mt-2 p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 text-xs">
                          <span className="font-semibold text-indigo-900 dark:text-indigo-300">Admin/Mentor Notes:</span>{" "}
                          <p className="text-slate-600 dark:text-slate-300 italic inline">
                            "{t.mentor_report || t.progress_notes}"
                          </p>
                        </div>
                      )}

                      {/* Deadline Extension Review block */}
                      {t.extension_status === "requested" && (
                        <div className="mt-2 p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 text-xs space-y-1.5">
                          <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-amber-700" /> Intern Requested Deadline Extension:
                          </div>
                          <div className="text-slate-700 dark:text-slate-200">
                            <strong>Reason:</strong> "{t.extension_reason || 'No explanation provided.'}"
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            <strong>Requested New Date:</strong> {t.extension_requested_date ? new Date(t.extension_requested_date).toLocaleDateString() : ""}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Button 
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-6 px-2 text-[10px]"
                              onClick={async () => {
                                try {
                                  await doReviewDeadlineExtension({ data: { taskId: t.id, status: 'approved' } });
                                  toast.success("Deadline extension approved!");
                                  qc.invalidateQueries({ queryKey: ["admin-intern-tasks"] });
                                } catch (e) {
                                  toast.error("Failed to approve extension");
                                }
                              }}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              className="border-slate-300 text-rose-600 hover:bg-rose-50 font-bold h-6 px-2 text-[10px]"
                              onClick={async () => {
                                try {
                                  await doReviewDeadlineExtension({ data: { taskId: t.id, status: 'rejected' } });
                                  toast.success("Deadline extension rejected!");
                                  qc.invalidateQueries({ queryKey: ["admin-intern-tasks"] });
                                } catch (e) {
                                  toast.error("Failed to reject extension");
                                }
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Admin Quick Actions */}
                  <div className="flex items-center gap-1.5 flex-wrap w-full xl:w-auto xl:shrink-0 justify-start xl:justify-end pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-100 dark:border-slate-800">
                    {t.mentor_verification_status === "mentor_verified" && t.status !== "completed" ? (
                      <Button
                        size="sm"
                        className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-1 shadow-xs cursor-pointer"
                        onClick={async () => {
                          try {
                            const pts = t.mentor_recommended_credits || t.credits || 10;
                            await doAdminFinalize({ data: { taskId: t.id, awardedCredits: pts } });
                            toast.success(`Task finalized as Completed! Awarded +${pts} Credits to intern.`);
                            qc.invalidateQueries({ queryKey: ["admin-intern-tasks"] });
                          } catch (err: any) {
                            toast.error("Failed to finalize task: " + err.message);
                          }
                        }}
                      >
                        <Award className="h-3.5 w-3.5 text-amber-300" /> Approve &amp; Award +{t.mentor_recommended_credits || t.credits || 10}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs font-bold bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                        onClick={() => handleUpdateStatus(t.id, "completed")}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs text-amber-700 border-amber-200 hover:bg-amber-50 cursor-pointer"
                      onClick={() => {
                        setSelectedTaskForReview(t);
                        setAdminRemarks(t.progress_notes || "");
                      }}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Review
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs font-bold text-blue-700 bg-blue-50/70 border-blue-200 hover:bg-blue-100 gap-1.5 shadow-2xs cursor-pointer"
                      onClick={() => openTaskEmailModal(t)}
                      title="Send tailored Task Status email to this intern"
                    >
                      <Mail className="h-3.5 w-3.5" /> Email
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs font-bold text-teal-700 bg-teal-50/70 border-teal-200 hover:bg-teal-100 gap-1.5 shadow-2xs cursor-pointer"
                      onClick={() => openTaskEmailModal(t)}
                      title="Open formatted WhatsApp task status"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs font-bold text-amber-700 bg-amber-50/80 border-amber-200 hover:bg-amber-100 gap-1 shadow-2xs cursor-pointer"
                      onClick={() => handleMoveToStoredBank([t.id])}
                      title="Move task to Stored Bank (Unassigns from current intern and saves for future cohorts)"
                    >
                      <FolderArchive className="h-3.5 w-3.5 text-amber-600" /> Store for Future
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 cursor-pointer"
                      onClick={() => handleDeleteTask(t.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            };

            if (!isBatch) return renderTask(rep);

            return (
              <div key={groupKey} className="flex flex-col border-b last:border-0 border-slate-200 dark:border-slate-800">
                <div 
                  className="p-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleExpand(groupKey)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <Badge variant="outline" className="w-fit bg-indigo-100 text-indigo-700 border-indigo-200 flex items-center gap-1 px-2.5">
                      <Sparkles className="h-3 w-3" /> Mass Assigned Batch
                    </Badge>
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{rep.title}</span>
                    <span className="text-xs text-slate-500 font-medium">({group.length} Interns Assigned)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => { e.stopPropagation(); handleDeleteBatch(rep.title, rep.created_at); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs font-semibold px-3">
                      {isExpanded ? "Collapse" : "Expand"}
                    </Button>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="border-l-2 sm:border-l-4 border-indigo-200 dark:border-indigo-800 ml-4 sm:ml-6 divide-y bg-white dark:bg-slate-950">
                    {group.map((t: any) => renderTask(t))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      </div>
      )}

      {/* ── STORED TASK BANK / FUTURE REPOSITORY VIEW ── */}
      {activeViewTab === "stored_bank" && (
        <div className="space-y-6">
          {/* Stored Bank Banner */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white dark:bg-slate-950 p-6 rounded-2xl border shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FolderArchive className="h-6 w-6 text-emerald-600" /> Stored Task Bank &amp; Future Repository
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Preserved project tasks and milestone templates ready to be assigned to upcoming cohorts or newly enrolled interns on demand.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                onClick={() => {
                  if (selectedStoredTaskIds.length === 0) {
                    return toast.error("Please select at least one stored task to assign.");
                  }
                  setAssignStoredModalOpen(true);
                }}
                disabled={selectedStoredTaskIds.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="h-4 w-4" /> Assign Selected Tasks ({selectedStoredTaskIds.length})
              </Button>
              <Button
                onClick={() => setAssignModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shrink-0 cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" /> Create / CSV Import
              </Button>
            </div>
          </div>

          {/* Stored Bank Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-950 p-4 rounded-xl border">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search stored tasks by title or description..."
                value={storedTaskSearchQuery}
                onChange={(e) => setStoredTaskSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={storedTaskDomainFilter} onValueChange={setStoredTaskDomainFilter}>
                <SelectTrigger className="w-36 text-xs">
                  <SelectValue placeholder="All Domains" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  <SelectItem value="tech">Tech / Development</SelectItem>
                  <SelectItem value="management">Management / Operations</SelectItem>
                  <SelectItem value="non_tech">Marketing / Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stored Bank Bulk Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900 border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Checkbox 
                id="select-all-stored" 
                checked={filteredStoredTasks.length > 0 && selectedStoredTaskIds.length === filteredStoredTasks.length} 
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedStoredTaskIds(filteredStoredTasks.map(t => t.id));
                  } else {
                    setSelectedStoredTaskIds([]);
                  }
                }}
              />
              <label htmlFor="select-all-stored" className="text-sm font-medium cursor-pointer text-slate-700 dark:text-slate-300">
                Select All Stored Tasks <span className="text-slate-500">({selectedStoredTaskIds.length} selected)</span>
              </label>
            </div>

            {selectedStoredTaskIds.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setAssignStoredModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 gap-1.5 shadow-xs cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" /> Assign to Intern(s) ({selectedStoredTaskIds.length})
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    if (!confirm(`Delete ${selectedStoredTaskIds.length} stored task(s) from repository?`)) return;
                    try {
                      await doBulkDelete({ data: { taskIds: selectedStoredTaskIds } });
                      qc.invalidateQueries({ queryKey: ["admin-intern-tasks"] });
                      setSelectedStoredTaskIds([]);
                      toast.success("Tasks deleted from stored repository.");
                    } catch (e: any) {
                      toast.error("Failed to delete: " + e.message);
                    }
                  }}
                  className="h-8 text-xs font-semibold cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Selected
                </Button>
              </div>
            )}
          </div>

          {/* Stored Tasks List */}
          <div className="rounded-xl border bg-white dark:bg-slate-950 shadow-sm overflow-hidden divide-y">
            {filteredStoredTasks.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                <FolderArchive className="h-8 w-8 text-slate-400 mx-auto opacity-60" />
                <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">No tasks currently in the Stored Bank matching criteria.</p>
                <p className="text-slate-400">
                  You can move active tasks here by selecting them and clicking <strong>"Store for Future"</strong>, or import template tasks via CSV.
                </p>
              </div>
            ) : (
              filteredStoredTasks.map((t) => {
                const isSelected = selectedStoredTaskIds.includes(t.id);
                return (
                  <div key={t.id} className="p-4 sm:p-5 hover:bg-slate-50/60 dark:hover:bg-slate-900/60 transition-colors flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 w-full min-w-0">
                    <div className="flex items-start gap-3 flex-1 min-w-0 w-full">
                      <div className="mt-1 shrink-0">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedStoredTaskIds(prev => [...prev, t.id]);
                            } else {
                              setSelectedStoredTaskIds(prev => prev.filter(id => id !== t.id));
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100 break-words">{t.title}</span>
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] flex items-center gap-1 font-bold">
                            <FolderArchive className="h-3 w-3 text-emerald-700" /> Stored in Repository
                          </Badge>
                          <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-600">
                            Priority: {t.priority || "medium"}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 border-amber-200">
                            <CreditCard className="h-3 w-3 text-amber-600 inline mr-1" /> {t.credits || 10} Credits
                          </Badge>
                          {t.task_domain && (
                            <Badge variant="outline" className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 border-indigo-200">
                              Domain: {t.task_domain}
                            </Badge>
                          )}
                        </div>

                        {t.description && (
                          <TaskRichDescription description={t.description} teamMembers={t.team_members || t.team_member_names} />
                        )}

                        <div className="flex items-center gap-3 sm:gap-4 text-[11px] text-slate-400 flex-wrap pt-1">
                          <span>Created: {new Date(t.created_at).toLocaleDateString()}</span>
                          {t.task_file_url && (
                            <a href={t.task_file_url} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-bold">
                              <FileText className="h-3.5 w-3.5" /> Task Spec/Files
                            </a>
                          )}
                          {t.task_doc_url && (
                            <a href={t.task_doc_url} target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-bold">
                              <BookOpen className="h-3.5 w-3.5" /> Handbook
                            </a>
                          )}
                          {t.report_template_url && (
                            <a href={t.report_template_url} target="_blank" rel="noreferrer" className="text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-1 font-bold">
                              <FileText className="h-3.5 w-3.5" /> Report Template
                            </a>
                          )}
                          {t.ppt_template_url && (
                            <a href={t.ppt_template_url} target="_blank" rel="noreferrer" className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 font-bold">
                              <Play className="h-3.5 w-3.5" /> PPT File
                            </a>
                          )}
                          {t.task_meet_link && (
                            <a href={t.task_meet_link} target="_blank" rel="noreferrer" className="text-blue-700 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-bold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                              <Video className="h-3.5 w-3.5 text-blue-600" /> Meet Link
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full xl:w-auto xl:shrink-0 justify-start xl:justify-end pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-100 dark:border-slate-800">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedStoredTaskIds([t.id]);
                          setAssignStoredModalOpen(true);
                        }}
                        className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" /> Pick &amp; Assign to Intern(s)
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 cursor-pointer"
                        onClick={() => handleDeleteTask(t.id)}
                        title="Delete from Repository"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedTaskForReview && (
        <Dialog open={!!selectedTaskForReview} onOpenChange={(v) => !v && setSelectedTaskForReview(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Verify & Review Task: {selectedTaskForReview.title}
              </DialogTitle>
              <DialogDescription>
                Assigned to <strong>{selectedTaskForReview.assigned_profile?.full_name || selectedTaskForReview.assigned_profile?.email || "Intern"}</strong> ({selectedTaskForReview.assigned_profile?.intern_id || "Intern"}). Review work and leave official feedback.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {selectedTaskForReview.deliverable_url && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <span className="text-[11px] font-bold text-slate-700 block">Submitted Deliverable URL:</span>
                  <a
                    href={selectedTaskForReview.deliverable_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-mono break-all"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    {selectedTaskForReview.deliverable_url}
                  </a>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Verification Status</label>
                  <Select
                    defaultValue={selectedTaskForReview.status}
                    onValueChange={(val) => {
                      setSelectedTaskForReview((prev: any) => ({ ...prev, status: val }));
                    }}
                  >
                    <SelectTrigger className="mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">✓ Approved & Completed</SelectItem>
                      <SelectItem value="submitted">⏳ Submitted (Under Review)</SelectItem>
                      <SelectItem value="blocked">⚠️ Needs Revision / Changes</SelectItem>
                      <SelectItem value="in_progress">⚡ In Progress</SelectItem>
                      <SelectItem value="pending">⏸️ Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Credits / Score</label>
                  <Input
                    type="number"
                    defaultValue={selectedTaskForReview.credits || 10}
                    onChange={(e) => {
                      setSelectedTaskForReview((prev: any) => ({ ...prev, credits: parseInt(e.target.value) || 10 }));
                    }}
                    className="mt-1 text-xs h-9"
                    placeholder="Credits e.g. 10"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Mentor Review & Feedback (Displayed in Intern Portal)</label>
                <Textarea
                  placeholder="e.g. Excellent implementation of the authentication endpoints. Clean architecture and unit tests verified. Approved!"
                  rows={4}
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  className="text-xs mt-1"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="sm:w-1/4 text-xs"
                  onClick={() => setSelectedTaskForReview(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="sm:w-3/8 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs gap-1.5 shadow-sm"
                  disabled={isUpdating}
                  onClick={async () => {
                    setIsUpdating(true);
                    try {
                      await doReview({
                        data: {
                          taskId: selectedTaskForReview.id,
                          status: selectedTaskForReview.status || "completed",
                          admin_remarks: adminRemarks,
                          credits: selectedTaskForReview.credits,
                        },
                      });
                      qc.invalidateQueries({ queryKey: ["admin-intern-tasks"] });
                      qc.invalidateQueries({ queryKey: ["my-tasks"] });
                      toast.success(`Task verified and review feedback saved!`);
                      setSelectedTaskForReview(null);
                    } catch (err: any) {
                      toast.error("Failed to update task: " + err.message);
                    } finally {
                      setIsUpdating(false);
                    }
                  }}
                >
                  <Check className="h-4 w-4" /> Save Review
                </Button>
                <Button
                  className="sm:w-3/8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-sm"
                  disabled={isUpdating}
                  onClick={async () => {
                    setIsUpdating(true);
                    try {
                      await doReview({
                        data: {
                          taskId: selectedTaskForReview.id,
                          status: selectedTaskForReview.status || "completed",
                          admin_remarks: adminRemarks,
                          credits: selectedTaskForReview.credits,
                        },
                      });
                      qc.invalidateQueries({ queryKey: ["admin-intern-tasks"] });
                      qc.invalidateQueries({ queryKey: ["my-tasks"] });
                      
                      const email = selectedTaskForReview.assigned_profile?.email;
                      if (email) {
                        await doSendTaskEmail({
                          data: {
                            recipient_email: email,
                            recipient_name: selectedTaskForReview.assigned_profile?.full_name,
                            task_title: selectedTaskForReview.title,
                            task_status: selectedTaskForReview.status || "completed",
                            mentor_remarks: adminRemarks,
                            credits: selectedTaskForReview.credits,
                          },
                        });
                        toast.success(`Review saved & status email dispatched to ${email}!`);
                      } else {
                        toast.success(`Review saved!`);
                      }
                      setSelectedTaskForReview(null);
                    } catch (err: any) {
                      toast.error("Failed to update task / send email: " + err.message);
                    } finally {
                      setIsUpdating(false);
                    }
                  }}
                >
                  <Mail className="h-4 w-4" /> Save &amp; Email Intern
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ─── DEDICATED TASK STATUS EMAIL & NOTIFICATION MODAL ─── */}
      {taskEmailModalOpen && (
        <Dialog open={taskEmailModalOpen} onOpenChange={setTaskEmailModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Send Task Status Email to Intern
              </DialogTitle>
              <DialogDescription>
                Dispatch a tailored corporate email notification regarding milestone status, mentor remarks, or deadline reminders.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Intern Name</label>
                  <Input value={taskEmailForm.recipient_name} onChange={(e) => setTaskEmailForm({ ...taskEmailForm, recipient_name: e.target.value })} />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Recipient Email *</label>
                  <Input value={taskEmailForm.recipient_email} onChange={(e) => setTaskEmailForm({ ...taskEmailForm, recipient_email: e.target.value })} required />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>WhatsApp Phone</span>
                    {!taskEmailForm.recipient_phone && <span className="text-[10px] text-amber-600 font-normal">(Required for WhatsApp)</span>}
                  </label>
                  <Input 
                    placeholder="e.g. +91 9876543210" 
                    value={taskEmailForm.recipient_phone} 
                    onChange={(e) => setTaskEmailForm({ ...taskEmailForm, recipient_phone: e.target.value })} 
                    className={!taskEmailForm.recipient_phone ? "border-amber-400 focus:ring-amber-400" : ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Task Title *</label>
                  <Input value={taskEmailForm.task_title} onChange={(e) => setTaskEmailForm({ ...taskEmailForm, task_title: e.target.value })} required />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Task Status Notification Type *</label>
                  <Select
                    value={taskEmailForm.task_status}
                    onValueChange={(val) => setTaskEmailForm({ ...taskEmailForm, task_status: val })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">✓ Task Approved &amp; Completed</SelectItem>
                      <SelectItem value="changes_requested">⚠️ Revisions Requested / Feedback</SelectItem>
                      <SelectItem value="deadline_reminder">⏰ Urgent Deadline Reminder</SelectItem>
                      <SelectItem value="submitted">⏳ Submission Acknowledged</SelectItem>
                      <SelectItem value="assigned">📋 New Task Assigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mentor Remarks &amp; Official Feedback</label>
                <Textarea
                  rows={3}
                  placeholder="e.g. Excellent work! Code submitted fulfills all acceptance criteria. Approved."
                  value={taskEmailForm.mentor_remarks}
                  onChange={(e) => setTaskEmailForm({ ...taskEmailForm, mentor_remarks: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Due Deadline (Optional)</label>
                  <Input value={taskEmailForm.due_date} onChange={(e) => setTaskEmailForm({ ...taskEmailForm, due_date: e.target.value })} placeholder="e.g. 26 August 2026" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Custom Subject (Optional)</label>
                  <Input value={taskEmailForm.custom_subject} onChange={(e) => setTaskEmailForm({ ...taskEmailForm, custom_subject: e.target.value })} placeholder="Leave blank for auto-generated subject" />
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-xs">
                <strong>Corporate Template:</strong> Includes Vyntyra header, task milestone badge, mentor remarks box, and direct button linking to the Intern Dashboard.
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t">
                <Button variant="outline" size="sm" onClick={() => setTaskEmailModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendTaskWhatsAppSubmit}
                  className="text-teal-700 border-teal-300 hover:bg-teal-50 font-bold gap-1 text-xs"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Send via WhatsApp
                </Button>
                <Button
                  type="button"
                  disabled={isSendingTaskEmail}
                  onClick={handleSendTaskEmailSubmit}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1 text-xs"
                >
                  {isSendingTaskEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Dispatch Status Email
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk / Manual Task Assignment Modal */}
      <InternTaskAssignmentModal open={assignModalOpen} onClose={() => setAssignModalOpen(false)} />

      {/* Clear All Confirmation Modal */}
      <Dialog open={clearAllModalOpen} onOpenChange={setClearAllModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" /> Confirm Clear All
            </DialogTitle>
            <DialogDescription className="text-slate-600 pt-2">
              Are you sure you want to delete <strong>ALL</strong> intern tasks? 
              This action will irreversibly wipe the entire task board for every active intern.
              <br /><br />
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setClearAllModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleClearAllTasks}>
              Yes, Clear All Tasks
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cohort Task Rollover & Reassignment Modal */}
      <Dialog open={rolloverModalOpen} onOpenChange={setRolloverModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50 dark:bg-slate-900">
          <DialogHeader className="p-6 bg-white dark:bg-slate-950 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-emerald-600" />
                  Cohort Task Rollover &amp; Reassignment Hub
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-1">
                  Select verified &amp; completed tasks from current cohorts, clone them for the next cohort, and directly assign to newly enrolled interns.
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${rolloverStep === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                  Step 1: Select Tasks ({selectedVerifiedTaskIds.length})
                </span>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${rolloverStep === 2 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                  Step 2: Destination &amp; Interns ({selectedTargetInternIds.length})
                </span>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            {rolloverStep === 1 ? (
              <div className="space-y-4">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-950 p-4 rounded-xl border shadow-xs">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search verified task titles or descriptions..."
                      value={verifiedTaskSearchQuery}
                      onChange={(e) => setVerifiedTaskSearchQuery(e.target.value)}
                      className="pl-9 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      variant={onlyVerifiedFilter ? "default" : "outline"}
                      size="sm"
                      onClick={() => setOnlyVerifiedFilter(!onlyVerifiedFilter)}
                      className={`text-xs font-bold ${onlyVerifiedFilter ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                    >
                      <CheckCheck className="h-3.5 w-3.5 mr-1" /> Only Verified / Done
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (selectedVerifiedTaskIds.length === filteredVerifiedTasks.length) {
                          setSelectedVerifiedTaskIds([]);
                        } else {
                          setSelectedVerifiedTaskIds(filteredVerifiedTasks.map(t => t.id));
                        }
                      }}
                      className="text-xs font-bold shrink-0"
                    >
                      {selectedVerifiedTaskIds.length === filteredVerifiedTasks.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                </div>

                {/* Verified Task Cards List */}
                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {filteredVerifiedTasks.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-slate-950 rounded-xl border border-dashed text-slate-400 text-xs">
                      No matching verified tasks found. Uncheck "Only Verified" or adjust search.
                    </div>
                  ) : (
                    filteredVerifiedTasks.map((t) => {
                      const isSelected = selectedVerifiedTaskIds.includes(t.id);
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSelectedVerifiedTaskIds(prev => 
                              prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id]
                            );
                          }}
                          className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-start gap-3.5 ${
                            isSelected 
                              ? "bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-700 shadow-xs" 
                              : "bg-white dark:bg-slate-950 border-slate-200/80 hover:border-slate-300"
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => {
                              setSelectedVerifiedTaskIds(prev => 
                                prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id]
                              );
                            }}
                            className="mt-1 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                {t.title}
                                {t.is_verified && (
                                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold border-0">
                                    Verified
                                  </Badge>
                                )}
                              </h4>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                                  {t.priority || "Medium"}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                                  {t.credits || 10} Credits
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {t.description || "No description provided."}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400">
                              {t.assigned_profile && (
                                <span>Previous Assignee: <strong>{t.assigned_profile.full_name || t.assigned_profile.email}</strong></span>
                              )}
                              {t.task_domain && <span>Domain: <strong>{t.task_domain}</strong></span>}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Cohort Configuration */}
                <div className="bg-white dark:bg-slate-950 p-5 rounded-xl border shadow-xs space-y-4">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-600" /> Destination Cohort &amp; Timeline
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Cohort Name</label>
                      <Input
                        value={targetCohort}
                        onChange={(e) => setTargetCohort(e.target.value)}
                        placeholder="e.g. Cohort September 2026"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">New Submission Deadline</label>
                      <Input
                        type="date"
                        value={targetDueDate}
                        onChange={(e) => setTargetDueDate(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Task Priority</label>
                      <Select value={targetPriority} onValueChange={(val: any) => setTargetPriority(val)}>
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low Priority</SelectItem>
                          <SelectItem value="medium">Medium Priority</SelectItem>
                          <SelectItem value="high">High Priority</SelectItem>
                          <SelectItem value="urgent">Urgent / Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Custom Cohort Instructions / Addendum (Optional)</label>
                    <Textarea
                      rows={2}
                      placeholder="e.g. Please submit your GitHub repository link and deployed live demo before week 3 review."
                      value={customCohortInstructions}
                      onChange={(e) => setCustomCohortInstructions(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Target Intern Selection */}
                <div className="bg-white dark:bg-slate-950 p-5 rounded-xl border shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                        <Users className="h-4 w-4 text-emerald-600" /> Assign Directly to Enrolled Interns
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Select specific interns or assign to the whole cohort.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (selectedTargetInternIds.length === filteredTargetInterns.length) {
                            setSelectedTargetInternIds([]);
                          } else {
                            setSelectedTargetInternIds(filteredTargetInterns.map(i => i.id));
                          }
                        }}
                        className="text-xs font-bold"
                      >
                        {selectedTargetInternIds.length === filteredTargetInterns.length ? "Deselect All" : "Select All Interns"}
                      </Button>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search interns by name, email, roll number, or domain..."
                      value={internSearchQuery}
                      onChange={(e) => setInternSearchQuery(e.target.value)}
                      className="pl-9 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {internsQ.isLoading ? (
                      <div className="col-span-2 text-center py-8 text-slate-400 text-xs flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> Loading active interns...
                      </div>
                    ) : filteredTargetInterns.length === 0 ? (
                      <div className="col-span-2 text-center py-8 text-slate-400 text-xs">
                        No interns found matching the criteria.
                      </div>
                    ) : (
                      filteredTargetInterns.map((intern) => {
                        const isSelected = selectedTargetInternIds.includes(intern.id);
                        return (
                          <div
                            key={intern.id}
                            onClick={() => {
                              setSelectedTargetInternIds(prev => 
                                prev.includes(intern.id) ? prev.filter(id => id !== intern.id) : [...prev, intern.id]
                              );
                            }}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                              isSelected
                                ? "bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-700"
                                : "bg-slate-50 dark:bg-slate-900 border-slate-200/80 hover:bg-white"
                            }`}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => {
                                setSelectedTargetInternIds(prev => 
                                  prev.includes(intern.id) ? prev.filter(id => id !== intern.id) : [...prev, intern.id]
                                );
                              }}
                              className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                                {intern.full_name || "Intern"}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {intern.email} {intern.intern_id && `• ${intern.intern_id}`}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Summary Box */}
                <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-cyan-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>
                      Will clone <strong>{selectedVerifiedTaskIds.length} verified task(s)</strong> and assign them to <strong>{selectedTargetInternIds.length} intern(s)</strong> in <strong>{targetCohort}</strong> (Total <strong>{selectedVerifiedTaskIds.length * (selectedTargetInternIds.length || 1)}</strong> fresh assignments).
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 bg-white dark:bg-slate-950 border-t shrink-0 flex items-center justify-between sm:justify-between w-full">
            <div>
              {rolloverStep === 2 && (
                <Button variant="outline" size="sm" onClick={() => setRolloverStep(1)} className="text-xs font-bold">
                  ← Back to Task Selection
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setRolloverModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              {rolloverStep === 1 ? (
                <Button
                  size="sm"
                  disabled={selectedVerifiedTaskIds.length === 0}
                  onClick={() => setRolloverStep(2)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md"
                >
                  Configure Cohort &amp; Assign Interns ({selectedVerifiedTaskIds.length}) →
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={isRolloverLoading || selectedVerifiedTaskIds.length === 0}
                  onClick={handleExecuteRollover}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs gap-1.5 shadow-md"
                >
                  {isRolloverLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                  Execute Cohort Rollover &amp; Direct Assignment
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Assign Stored Tasks to Interns Dialog ── */}
      <Dialog open={assignStoredModalOpen} onOpenChange={setAssignStoredModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50 dark:bg-slate-900">
          <DialogHeader className="p-6 bg-white dark:bg-slate-950 border-b shrink-0">
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Send className="h-5 w-5 text-emerald-600" />
              Assign Stored Tasks to Enrolled Interns
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Select one or multiple interns to assign the {selectedStoredTaskIds.length} stored task(s) from the repository.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            {/* Timeline & Instructions */}
            <div className="bg-white dark:bg-slate-950 p-5 rounded-xl border shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" /> Assignment Timeline &amp; Priority
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Submission Deadline</label>
                  <Input
                    type="date"
                    value={storedDueDate}
                    onChange={(e) => setStoredDueDate(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Task Priority</label>
                  <Select value={storedPriority} onValueChange={(val: any) => setStoredPriority(val)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="urgent">Urgent / Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Custom Assignment Instructions / Addendum (Optional)</label>
                <Textarea
                  rows={2}
                  placeholder="e.g. Please submit your GitHub repository link and report before final review."
                  value={storedCustomInstructions}
                  onChange={(e) => setStoredCustomInstructions(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Target Intern Selection */}
            <div className="bg-white dark:bg-slate-950 p-5 rounded-xl border shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-600" /> Select Target Interns ({storedTargetInternIds.length} Selected)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Select specific interns or assign to all.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const filtered = allActiveInterns.filter((intern) => {
                      const s = storedInternSearch.toLowerCase();
                      return !s || (intern.full_name || '').toLowerCase().includes(s) || (intern.email || '').toLowerCase().includes(s) || (intern.intern_id || '').toLowerCase().includes(s);
                    });
                    if (storedTargetInternIds.length === filtered.length) {
                      setStoredTargetInternIds([]);
                    } else {
                      setStoredTargetInternIds(filtered.map(i => i.id));
                    }
                  }}
                  className="text-xs font-bold cursor-pointer"
                >
                  {storedTargetInternIds.length > 0 ? "Deselect All" : "Select All Interns"}
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search interns by name, email, roll number, or domain..."
                  value={storedInternSearch}
                  onChange={(e) => setStoredInternSearch(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                {internsQ.isLoading ? (
                  <div className="col-span-2 text-center py-8 text-slate-400 text-xs flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> Loading active interns...
                  </div>
                ) : allActiveInterns.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-slate-400 text-xs">
                    No active interns enrolled.
                  </div>
                ) : (
                  allActiveInterns
                    .filter((intern) => {
                      const s = storedInternSearch.toLowerCase();
                      return !s || (intern.full_name || '').toLowerCase().includes(s) || (intern.email || '').toLowerCase().includes(s) || (intern.intern_id || '').toLowerCase().includes(s);
                    })
                    .map((intern) => {
                      const isSelected = storedTargetInternIds.includes(intern.id);
                      return (
                        <div
                          key={intern.id}
                          onClick={() => {
                            setStoredTargetInternIds(prev =>
                              prev.includes(intern.id) ? prev.filter(id => id !== intern.id) : [...prev, intern.id]
                            );
                          }}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                            isSelected
                              ? "bg-emerald-50/90 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700 shadow-2xs font-semibold"
                              : "bg-slate-50 dark:bg-slate-900 border-slate-200/80 hover:bg-white"
                          }`}
                        >
                          <div className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                            isSelected ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 bg-white"
                          }`}>
                            {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                              {intern.full_name || "Intern"}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {intern.email} {intern.intern_id && `• ${intern.intern_id}`}
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 bg-white dark:bg-slate-950 border-t shrink-0 flex items-center justify-between w-full">
            <Button variant="outline" size="sm" onClick={() => setAssignStoredModalOpen(false)} className="text-xs cursor-pointer">
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isAssigningStored || selectedStoredTaskIds.length === 0 || storedTargetInternIds.length === 0}
              onClick={handleAssignStoredTasksSubmit}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              {isAssigningStored ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
              Assign {selectedStoredTaskIds.length} Task(s) to {storedTargetInternIds.length} Intern(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
