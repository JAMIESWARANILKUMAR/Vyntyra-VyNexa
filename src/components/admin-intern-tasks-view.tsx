import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAllInternTasksWithProgress, reviewInternTaskByAdmin, deleteTask } from "@/lib/operations.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { InternTaskAssignmentModal } from "@/components/intern-task-assignment-modal";
import {
  ClipboardList, Search, Plus, CheckCircle2, Clock, AlertTriangle, ExternalLink,
  Trash2, Sparkles, Filter, FileText, Check, RotateCcw, User, Eye
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function AdminInternTasksView() {
  const qc = useQueryClient();
  const fetchTasks = useServerFn(listAllInternTasksWithProgress);
  const doReview = useServerFn(reviewInternTaskByAdmin);
  const doDelete = useServerFn(deleteTask);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

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

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const internName = t.assigned_profile?.full_name || t.assigned_profile?.email || "";
    const titleMatches = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         internName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (t.description || "").toLowerCase().includes(searchQuery.toLowerCase());

    const statusMatches = statusFilter === "all" || t.status === statusFilter;
    const priorityMatches = priorityFilter === "all" || t.priority === priorityFilter;

    return titleMatches && statusMatches && priorityMatches;
  });

  // Calculate statistics
  const totalCount = tasks.length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const submittedCount = tasks.filter((t) => t.status === "submitted" || t.deliverable_url).length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

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

        <Button
          onClick={() => setAssignModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" /> Assign Tasks (CSV / Manual)
        </Button>
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

      {/* Intern Tasks Progress Table */}
      <div className="rounded-xl border bg-white dark:bg-slate-950 shadow-sm overflow-hidden divide-y">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No intern tasks found matching criteria. Click <strong className="text-indigo-600">Assign Tasks</strong> to start!
          </div>
        ) : (
          filteredTasks.map((t) => {
            const internProfile = t.assigned_profile;
            const internName = internProfile?.full_name || internProfile?.email || "Assigned Intern";
            const taskFile = t.project_requirements || t.task_file_url;
            const submissionFile = t.deliverable_url;

            return (
              <div key={t.id} className="p-5 hover:bg-slate-50/60 dark:hover:bg-slate-900/60 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
          })
        )}
      </div>

      {/* Review Modal */}
      {selectedTaskForReview && (
        <Dialog open={!!selectedTaskForReview} onOpenChange={(v) => !v && setSelectedTaskForReview(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Review Task: {selectedTaskForReview.title}
              </DialogTitle>
              <DialogDescription>
                Assigned to {selectedTaskForReview.assigned_profile?.full_name || "Intern"}. Update status or leave feedback remarks.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <label className="text-xs font-bold text-slate-700">Update Status</label>
                <Select
                  defaultValue={selectedTaskForReview.status}
                  onValueChange={(val) => handleUpdateStatus(selectedTaskForReview.id, val, adminRemarks)}
                >
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress (Request Revision)</SelectItem>
                    <SelectItem value="submitted">Submitted (Under Review)</SelectItem>
                    <SelectItem value="completed">Completed (Approved)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Admin Remarks / Feedback Notes</label>
                <Textarea
                  placeholder="Provide feedback for the intern..."
                  rows={3}
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  className="text-xs mt-1"
                />
              </div>

              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
                onClick={() => handleUpdateStatus(selectedTaskForReview.id, selectedTaskForReview.status, adminRemarks)}
              >
                Save Feedback & Remarks
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk / Manual Task Assignment Modal */}
      <InternTaskAssignmentModal open={assignModalOpen} onClose={() => setAssignModalOpen(false)} />
    </div>
  );
}
