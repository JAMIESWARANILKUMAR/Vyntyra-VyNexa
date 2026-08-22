import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAllInternTasksWithProgress, reviewInternTaskByAdmin, deleteTask, reviewDeadlineExtension, bulkDeleteTasks, deleteTaskBatch, deleteAllInternTasks } from "@/lib/operations.functions";
import { Button } from "@/components/ui/button";
import { Award, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { InternTaskAssignmentModal } from "@/components/intern-task-assignment-modal";
import {
  ClipboardList, Search, Plus, CheckCircle2, Clock, AlertTriangle, ExternalLink,
  Trash2, Sparkles, Filter, FileText, Check, RotateCcw, User, Eye, Download, Bell
} from "lucide-react";
import { sendTaskNotification } from "@/lib/notifications.functions";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export function AdminInternTasksView() {
  const qc = useQueryClient();
  const fetchTasks = useServerFn(listAllInternTasksWithProgress);
  const doReview = useServerFn(reviewInternTaskByAdmin);
  const doDelete = useServerFn(deleteTask);
  const doBulkDelete = useServerFn(bulkDeleteTasks);
  const doReviewDeadlineExtension = useServerFn(reviewDeadlineExtension);
  const doDeleteBatch = useServerFn(deleteTaskBatch);
  const doClearAllTasks = useServerFn(deleteAllInternTasks);
  const doSendNotification = useServerFn(sendTaskNotification);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [clearAllModalOpen, setClearAllModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

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

  const tasksQ = useQuery({
    queryKey: ["admin-intern-tasks"],
    queryFn: () => fetchTasks(),
    refetchInterval: 5000, // Live poll task progress every 5 seconds
  });

  const tasks: any[] = tasksQ.data || [];

  // Filter tasks with full null-safety
  const filteredTasks = tasks.filter((t) => {
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

  // Group tasks by batch safely
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

  // Calculate statistics safely
  const totalCount = tasks.length;
  const inProgressCount = tasks.filter((t) => t?.status === "in_progress").length;
  const submittedCount = tasks.filter((t) => t?.status === "submitted" || t?.deliverable_url).length;
  const completedCount = tasks.filter((t) => t?.status === "completed").length;

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

  return (
    <div className="space-y-6">
      {/* Header Banner & Stat Cards */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-950 p-6 rounded-2xl border shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-indigo-600" /> Intern Task Assignment & Progress Tracker
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Assign tasks manually or via bulk CSV upload. Track real-time submission progress across all active interns.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <Button
            onClick={() => setClearAllModalOpen(true)}
            variant="destructive"
            className="font-semibold shadow-md shrink-0"
          >
            <Trash2 className="h-4 w-4 mr-2" /> Clear All Tasks
          </Button>
          <Button
            onClick={() => setAssignModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" /> Assign Tasks (CSV / Manual)
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
        
        <div className="flex items-center gap-2">
          {selectedTaskIds.length > 0 && (
            <Button size="sm" variant="destructive" onClick={handleBulkDelete} className="h-8 text-xs font-semibold">
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Selected
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleExtractAll} className="h-8 text-xs font-semibold bg-white dark:bg-slate-950">
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
                <div key={t.id} className="p-5 hover:bg-slate-50/60 dark:hover:bg-slate-900/60 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* Bulk Checkbox */}
                  <div className="mt-1">
                    <Checkbox 
                      checked={selectedTaskIds.includes(t.id)} 
                      onCheckedChange={(checked) => handleToggleSelect(t.id, checked as boolean)}
                    />
                  </div>

                  {/* Intern & Task Info */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{t.title}</span>

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
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{t.description}</p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap pt-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                        <User className="h-3.5 w-3.5 text-indigo-500" /> {internName} {internProfile?.intern_id ? `(${internProfile.intern_id})` : ""}
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
                    </div>

                    {/* Intern Submission Info */}
                    {submissionFile && (
                      <div className="mt-2 p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 text-xs space-y-1">
                        <div className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5" /> Intern Deliverable Submitted:
                        </div>
                        <a
                          href={submissionFile}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-700 dark:text-indigo-400 underline font-medium truncate block"
                        >
                          {submissionFile}
                        </a>
                        {t.progress_notes && (
                          <div className="text-slate-600 dark:text-slate-300 text-[11px] italic">
                            &ldquo;{t.progress_notes}&rdquo;
                          </div>
                        )}
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

                  {/* Admin Quick Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      onClick={() => handleUpdateStatus(t.id, "completed")}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Approve / Complete
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
                      onClick={() => {
                        setSelectedTaskForReview(t);
                        setAdminRemarks(t.progress_notes || "");
                      }}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Review / Feedback
                    </Button>

                    {t.assigned_to && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                        onClick={async () => {
                          const loadingToast = toast.loading("Sending notification to intern...");
                          try {
                            await doSendNotification({ data: { taskId: t.id } });
                            toast.dismiss(loadingToast);
                            toast.success("Notification sent successfully!");
                          } catch (err: any) {
                            toast.dismiss(loadingToast);
                            toast.error("Failed to send notification: " + err.message);
                          }
                        }}
                      >
                        <Bell className="h-3.5 w-3.5 mr-1" /> Send Notification
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
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

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-1/3 text-xs"
                  onClick={() => setSelectedTaskForReview(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-sm"
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
                  <Check className="h-4 w-4" /> Save & Publish Review
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
    </div>
  );
}
