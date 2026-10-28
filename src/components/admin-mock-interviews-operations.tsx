import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles, Video, Calendar, Clock, Award, Shield, Users,
  Search, RefreshCw, Eye, CheckCircle2, AlertCircle, Plus,
  FileText, ExternalLink, ChevronRight, UserCheck, Play, ArrowUpRight, Mic
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  listAdminMockSessionsFn,
  scheduleMockInterviewFn,
  assignUserRoleFn,
  listManageableUsersFn,
  listInternsForMockInterviewFn,
  INTERVIEW_DOMAINS
} from "@/lib/mock-interview.functions";
import { AdminVoiceTrainingStudio } from "@/components/interview/AdminVoiceTrainingStudio";

export function AdminMockInterviewsOperationsView() {
  const qc = useQueryClient();
  const listSessions = useServerFn(listAdminMockSessionsFn);
  const scheduleSession = useServerFn(scheduleMockInterviewFn);
  const assignRole = useServerFn(assignUserRoleFn);
  const listUsers = useServerFn(listManageableUsersFn);
  const listInterns = useServerFn(listInternsForMockInterviewFn);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [domainFilter, setDomainFilter] = useState("all");

  // Modals
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [voiceStudioModalOpen, setVoiceStudioModalOpen] = useState(false);

  // Schedule Form State
  const [scheduleMode, setScheduleMode] = useState<"intern" | "manual">("intern");
  const [selectedInternId, setSelectedInternId] = useState("");
  const [internSearchFilter, setInternSearchFilter] = useState("");
  const [formCandidateName, setFormCandidateName] = useState("");
  const [formCandidateEmail, setFormCandidateEmail] = useState("");
  const [formInternId, setFormInternId] = useState("");
  const [formDomain, setFormDomain] = useState("fullstack");
  const [formRole, setFormRole] = useState("Full-Stack Software Engineer");
  const [formDifficulty, setFormDifficulty] = useState<"junior" | "mid" | "senior">("mid");
  const [formScheduledAt, setFormScheduledAt] = useState("");
  const [formMentorId, setFormMentorId] = useState("");
  const [formMentorName, setFormMentorName] = useState("");

  // Role Assignment State
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<"super_admin" | "admin" | "employee" | "candidate">("employee");

  // Query sessions
  const { data: adminData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin_mock_interviews_ops", statusFilter, domainFilter, searchTerm],
    queryFn: () => listSessions({
      data: {
        status: statusFilter,
        domain: domainFilter,
        search: searchTerm || undefined,
        page: 1,
        pageSize: 50
      }
    }),
    refetchInterval: 10000 // Polling for live status
  });

  // Query users for staff selection & role assignment
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["manageable_users_for_interviews"],
    queryFn: () => listUsers({ data: {} }),
    enabled: scheduleModalOpen || roleModalOpen
  });

  // Query registered interns for interview assignment
  const { data: internsData, isLoading: isLoadingInterns } = useQuery({
    queryKey: ["interns_for_mock_interview_ops"],
    queryFn: () => listInterns({ data: {} }),
    enabled: scheduleModalOpen
  });

  const internsList = internsData?.interns || [];

  // Filtered interns for quick pick
  const filteredInterns = useMemo(() => {
    if (!internSearchFilter.trim()) return internsList;
    const q = internSearchFilter.toLowerCase();
    return internsList.filter(
      (i: any) =>
        i.name?.toLowerCase().includes(q) ||
        i.email?.toLowerCase().includes(q) ||
        i.intern_id?.toLowerCase().includes(q)
    );
  }, [internsList, internSearchFilter]);

  // Mutation: Schedule interview
  const scheduleMut = useMutation({
    mutationFn: () => scheduleSession({
      data: {
        candidateName: formCandidateName.trim(),
        candidateEmail: formCandidateEmail.trim(),
        internId: formInternId.trim() || undefined,
        domain: formDomain,
        targetRole: formRole,
        difficulty: formDifficulty,
        scheduledAt: formScheduledAt ? new Date(formScheduledAt).toISOString() : new Date().toISOString(),
        mentorId: formMentorId || undefined,
        mentorName: formMentorName || undefined,
        callerRole: "super_admin"
      }
    }),
    onSuccess: () => {
      toast.success("Mock Interview scheduled successfully!");
      setScheduleModalOpen(false);
      setFormCandidateName("");
      setFormCandidateEmail("");
      setFormInternId("");
      setSelectedInternId("");
      qc.invalidateQueries({ queryKey: ["admin_mock_interviews_ops"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to schedule interview.");
    }
  });

  // Mutation: Assign role
  const roleMut = useMutation({
    mutationFn: () => assignRole({
      data: {
        targetUserEmail: selectedUserEmail.trim(),
        targetEmail: selectedUserEmail.trim(),
        newRole: selectedRole,
        callerRole: "super_admin"
      }
    }),
    onSuccess: (res: any) => {
      toast.success(res?.message || "Role updated successfully.");
      setRoleModalOpen(false);
      setSelectedUserEmail("");
      qc.invalidateQueries({ queryKey: ["manageable_users_for_interviews"] });
    },
    onError: (err: any) => {
      console.error("Assign role error:", err);
      toast.error(err?.message || "Failed to assign role.");
    }
  });

  const metrics = adminData?.metrics || {
    totalSessions: 0,
    activeLive: 0,
    scheduled: 0,
    completed: 0,
    averageScore: 0,
    passRate: 0
  };

  const sessions = adminData?.sessions || [];

  return (
    <div className="space-y-6">
      {/* ── Header Banner ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-amber-400" />
              Super Admin AI Command Center
            </span>
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 bg-emerald-950/40 text-[10px]">
              Cloudflare Realtime &amp; OpenRouter
            </Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            1:1 Live AI Mock Interviews &amp; RBAC Studio
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Monitor real-time WebRTC sessions, audit live candidate audio/video feeds, schedule mentor-graded rounds, and manage institutional interview access permissions.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl gap-1.5"
            disabled={isFetching}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            onClick={() => setRoleModalOpen(true)}
            variant="outline"
            size="sm"
            className="border-indigo-500/40 bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 text-xs font-bold rounded-xl gap-1.5"
          >
            <Shield className="h-3.5 w-3.5 text-indigo-400" />
            Manage Roles
          </Button>

          <Button
            onClick={() => setVoiceStudioModalOpen(true)}
            variant="outline"
            size="sm"
            className="border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 text-xs font-bold rounded-xl gap-1.5"
          >
            <Mic className="h-3.5 w-3.5 text-emerald-400" />
            Voice Training Studio
          </Button>

          <Button
            onClick={() => setScheduleModalOpen(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl gap-1.5 shadow-lg shadow-blue-600/30"
          >
            <Plus className="h-4 w-4" />
            Schedule Interview
          </Button>
        </div>
      </div>

      {/* ── KPI Metrics Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
        <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[96px] transition-all hover:shadow-md">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">Total Rounds</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 my-1">{metrics.totalSessions}</div>
          <div className="text-[10px] text-slate-400 truncate">All-time sessions</div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-emerald-200/80 bg-emerald-50/30 shadow-sm flex flex-col justify-between min-h-[96px] transition-all hover:shadow-md">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5 truncate">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            Active Live
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 my-1">{metrics.activeLive}</div>
          <div className="text-[10px] text-emerald-600/80 truncate">In room right now</div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-blue-200/80 bg-blue-50/30 shadow-sm flex flex-col justify-between min-h-[96px] transition-all hover:shadow-md">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider truncate">Scheduled</div>
          <div className="text-2xl sm:text-3xl font-black text-blue-700 my-1">{metrics.scheduled}</div>
          <div className="text-[10px] text-blue-600/80 truncate">Upcoming slots</div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-purple-200/80 bg-purple-50/30 shadow-sm flex flex-col justify-between min-h-[96px] transition-all hover:shadow-md">
          <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider truncate">Completed</div>
          <div className="text-2xl sm:text-3xl font-black text-purple-700 my-1">{metrics.completed}</div>
          <div className="text-[10px] text-purple-600/80 truncate">Evaluations ready</div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-amber-200/80 bg-amber-50/30 shadow-sm flex flex-col justify-between min-h-[96px] transition-all hover:shadow-md">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider truncate">Avg Score</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 my-1">
            {metrics.averageScore}<span className="text-xs font-semibold text-slate-400">/100</span>
          </div>
          <div className="text-[10px] text-amber-600/80 truncate">Across all domains</div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[96px] transition-all hover:shadow-md">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">Pass Rate</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 my-1">{metrics.passRate}%</div>
          <div className="text-[10px] text-slate-400 truncate">Score &ge; 70</div>
        </div>
      </div>

      {/* ── Filters & Search Bar ── */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search candidate name, email, or role..."
              className="pl-9 h-9 text-xs rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs rounded-xl w-[130px] bg-slate-50 border-slate-200">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="in_progress">Active Live</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={domainFilter} onValueChange={setDomainFilter}>
            <SelectTrigger className="h-9 text-xs rounded-xl w-[150px] bg-slate-50 border-slate-200">
              <SelectValue placeholder="Domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {INTERVIEW_DOMAINS.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Global Monitoring Grid Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Live Mock Interviews Roster</h3>
            <span className="text-xs text-slate-400">({sessions.length} sessions listed)</span>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-ping" />
            Auto-polling enabled
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            Loading real-time interview roster...
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No mock interview sessions found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Target Role &amp; Domain</th>
                  <th className="py-3 px-4">Scheduled Slot</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">AI Score</th>
                  <th className="py-3 px-4">Mentor Evaluation</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((s: any) => {
                  const isLive = s.status === "in_progress";
                  const isScheduled = s.status === "scheduled";
                  const isCompleted = s.status === "completed";

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{s.candidate_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{s.candidate_email || "No email"}</div>
                        {s.intern_id && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                            {s.intern_id}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{s.target_role}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{s.domain}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[10px] capitalize text-slate-500">{s.difficulty}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {s.scheduled_at ? (
                          <div>
                            <div className="font-medium text-slate-800">
                              {new Date(s.scheduled_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {new Date(s.scheduled_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Immediate / On-demand</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {isLive ? (
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold gap-1 text-[10px] animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                            Active Live
                          </Badge>
                        ) : isScheduled ? (
                          <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50 text-[10px] font-bold">
                            Scheduled
                          </Badge>
                        ) : isCompleted ? (
                          <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-50 text-[10px] font-bold">
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-slate-300 text-slate-600 text-[10px]">
                            {s.status}
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {s.overall_score !== null && s.overall_score !== undefined ? (
                          <div>
                            <div className={`font-black text-sm ${s.overall_score >= 70 ? "text-emerald-600" : s.overall_score >= 50 ? "text-amber-600" : "text-rose-600"}`}>
                              {Math.round(s.overall_score)}/100
                            </div>
                            {s.hiring_verdict && (
                              <span className="text-[10px] font-bold text-slate-500">
                                {s.hiring_verdict}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {s.mentor_grade ? (
                          <div>
                            <span className="font-bold text-indigo-700 text-xs">
                              {Math.round(s.mentor_grade)}/100
                            </span>
                            <div className="text-[10px] text-slate-400 truncate max-w-[140px]" title={s.mentor_notes}>
                              {s.mentor_name ? `${s.mentor_name}: ` : ""}{s.mentor_notes || "Graded"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-[11px] italic">Pending mentor review</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isLive ? (
                            <Button
                              asChild
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] h-7 px-2.5 rounded-lg gap-1 shadow-xs"
                            >
                              <a href={`/interview/${s.id}?observer=true`} target="_blank" rel="noreferrer">
                                <Eye className="h-3 w-3" />
                                Audit Live (Silent)
                              </a>
                            </Button>
                          ) : isCompleted ? (
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-[11px] h-7 px-2.5 rounded-lg gap-1"
                            >
                              <a href={`/interview/report/${s.id}`} target="_blank" rel="noreferrer">
                                <FileText className="h-3 w-3 text-purple-600" />
                                View Report
                              </a>
                            </Button>
                          ) : (
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] h-7 px-2.5 rounded-lg gap-1"
                            >
                              <a href={`/interview/${s.id}`} target="_blank" rel="noreferrer">
                                <Play className="h-3 w-3 text-blue-600" />
                                Open Room
                              </a>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal: Schedule Candidate Mock Interview ── */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent className="max-w-lg w-[95vw] rounded-3xl bg-white text-slate-900 border border-slate-200 shadow-2xl p-6 sm:p-7 max-h-[92vh] overflow-y-auto">
          <DialogHeader className="space-y-1.5 pb-2 border-b border-slate-100">
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-slate-900">
              <Calendar className="h-5 w-5 text-blue-600 shrink-0" />
              Schedule Candidate Mock Interview
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Assign an AI-evaluated mock interview session to an intern or candidate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            {/* Quick Pick Registered Intern or Manual Entry Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Button
                type="button"
                variant={scheduleMode === "intern" ? "default" : "outline"}
                size="sm"
                onClick={() => setScheduleMode("intern")}
                className={`text-xs h-8 sm:h-9 rounded-xl font-bold cursor-pointer transition-all ${
                  scheduleMode === "intern"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Users className="h-3.5 w-3.5 mr-1" />
                Select Registered Intern ({internsList.length})
              </Button>
              <Button
                type="button"
                variant={scheduleMode === "manual" ? "default" : "outline"}
                size="sm"
                onClick={() => setScheduleMode("manual")}
                className={`text-xs h-8 sm:h-9 rounded-xl font-bold cursor-pointer transition-all ${
                  scheduleMode === "manual"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Manual Candidate Entry
              </Button>
            </div>

            {scheduleMode === "intern" && (
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80">
                <Label className="text-xs font-bold text-blue-900 flex items-center justify-between">
                  <span>Pick Registered Intern *</span>
                  <span className="text-[10px] text-blue-600 font-normal">Auto-fills name, email &amp; intern ID</span>
                </Label>
                <Select
                  value={selectedInternId}
                  onValueChange={(val) => {
                    setSelectedInternId(val);
                    const intern = internsList.find(
                      (i: any) => i.id === val || i.intern_id === val || i.email === val
                    );
                    if (intern) {
                      setFormCandidateName(intern.name);
                      setFormCandidateEmail(intern.email);
                      setFormInternId(intern.intern_id || "");
                      if (intern.department) {
                        const dept = intern.department.trim();
                        const cleanRole = dept.toLowerCase().includes("software")
                          ? (dept.toLowerCase().includes("engineer") ? dept : "Software Engineer")
                          : `${dept} Engineer`;
                        setFormRole(cleanRole);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-white border-blue-300 text-slate-900 shadow-xs">
                    <SelectValue placeholder={isLoadingInterns ? "Loading interns list..." : "Choose intern..."} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 bg-white border-slate-200 text-slate-900 shadow-xl rounded-xl z-50">
                    {internsList.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No registered interns found
                      </SelectItem>
                    ) : (
                      internsList.map((i: any) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.name} — {i.email} {i.intern_id ? `(${i.intern_id})` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-800">Candidate Name *</Label>
                <Input
                  value={formCandidateName}
                  onChange={(e) => setFormCandidateName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="h-10 text-xs rounded-xl bg-slate-50 hover:bg-white text-slate-900 border-slate-300 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-800">Candidate Email *</Label>
                <Input
                  type="email"
                  value={formCandidateEmail}
                  onChange={(e) => setFormCandidateEmail(e.target.value)}
                  placeholder="candidate@example.com"
                  className="h-10 text-xs rounded-xl bg-slate-50 hover:bg-white text-slate-900 border-slate-300 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-800">Intern ID (Optional)</Label>
                <Input
                  value={formInternId}
                  onChange={(e) => setFormInternId(e.target.value)}
                  placeholder="VCS-INT-2026-..."
                  className="h-10 text-xs rounded-xl bg-slate-50 hover:bg-white text-slate-900 border-slate-300 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-800">Difficulty Level</Label>
                <Select value={formDifficulty} onValueChange={(v: any) => setFormDifficulty(v)}>
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 hover:bg-white text-slate-900 border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl rounded-xl z-50">
                    <SelectItem value="junior">Junior (Foundations)</SelectItem>
                    <SelectItem value="mid">Mid-Level (Standard)</SelectItem>
                    <SelectItem value="senior">Senior (Architecture/Lead)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-800">Interview Domain</Label>
              <Select
                value={formDomain}
                onValueChange={(val) => {
                  setFormDomain(val);
                  const meta = INTERVIEW_DOMAINS.find(d => d.id === val);
                  if (meta) setFormRole(meta.recommendedRole);
                }}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 hover:bg-white text-slate-900 border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl rounded-xl z-50 max-h-60">
                  {INTERVIEW_DOMAINS.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-800">Target Role Title</Label>
              <Input
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                placeholder="e.g. Senior Full-Stack Engineer"
                className="h-10 text-xs rounded-xl bg-slate-50 hover:bg-white text-slate-900 border-slate-300 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-800">Date &amp; Time Slot</Label>
                <Input
                  type="datetime-local"
                  value={formScheduledAt}
                  onChange={(e) => setFormScheduledAt(e.target.value)}
                  className="h-10 text-xs rounded-xl bg-slate-50 hover:bg-white text-slate-900 border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-800">Assign Staff / Mentor</Label>
                <Select
                  value={formMentorId}
                  onValueChange={(val) => {
                    setFormMentorId(val);
                    const user = usersData?.users?.find((u: any) => u.id === val);
                    if (user) setFormMentorName(user.name || user.email);
                  }}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 hover:bg-white text-slate-900 border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600">
                    <SelectValue placeholder="Select staff..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl rounded-xl z-50 max-h-60">
                    <SelectItem value="unassigned">-- No Mentor Assigned --</SelectItem>
                    {(usersData?.users || [])
                      .filter((u: any) => u.role === "employee" || u.role === "admin" || u.role === "super_admin")
                      .map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name || u.email} ({u.role})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScheduleModalOpen(false)}
              className="text-xs rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 h-9 px-4 font-semibold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => scheduleMut.mutate()}
              disabled={scheduleMut.isPending || !formCandidateName || !formCandidateEmail}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl gap-1.5 h-9 px-5 shadow-md shadow-blue-600/20"
            >
              {scheduleMut.isPending ? "Scheduling..." : "Confirm & Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Manage User Roles ── */}
      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent className="max-w-md w-[95vw] rounded-3xl bg-white text-slate-900 border border-slate-200 shadow-2xl p-6 sm:p-7">
          <DialogHeader className="space-y-1.5 pb-2 border-b border-slate-100">
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-slate-900">
              <Shield className="h-5 w-5 text-indigo-600 shrink-0" />
              Manage User Interview Access Role
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Assign permission tier for the AI Mock Interview Suite &amp; Dashboards.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800">Quick-Pick Registered Staff / User</Label>
              <Select
                value={selectedUserEmail}
                onValueChange={(val) => setSelectedUserEmail(val)}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 hover:bg-white text-slate-900 border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600">
                  <SelectValue placeholder={isLoadingUsers ? "Loading user list..." : "Choose staff / user from platform..."} />
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-white border-slate-200 text-slate-900 shadow-xl rounded-xl z-50">
                  {(usersData?.users || []).map((u: any) => (
                    <SelectItem key={u.id} value={u.email}>
                      <span className="font-semibold text-slate-900">{u.full_name || u.email}</span>
                      <span className="text-slate-500 text-[11px] ml-1">({u.email})</span>
                      <span className="ml-1 text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                        {u.role || "candidate"}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800">User Email *</Label>
              <Input
                type="email"
                value={selectedUserEmail}
                onChange={(e) => setSelectedUserEmail(e.target.value)}
                placeholder="staff@vyntyraconsultancyservices.in"
                className="h-10 text-xs rounded-xl bg-slate-50 hover:bg-white text-slate-900 border-slate-300 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800">Select Role Tier</Label>
              <Select value={selectedRole} onValueChange={(v: any) => setSelectedRole(v)}>
                <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 hover:bg-white text-slate-900 border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl rounded-xl z-50">
                  <SelectItem value="super_admin">
                    <div className="py-0.5">
                      <div className="font-bold text-indigo-700">Super Admin</div>
                      <div className="text-[10px] text-slate-500">Global Full Access &amp; Operations Command</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="py-0.5">
                      <div className="font-bold text-blue-700">Admin</div>
                      <div className="text-[10px] text-slate-500">Org-wide Live Monitoring &amp; Scheduling</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="employee">
                    <div className="py-0.5">
                      <div className="font-bold text-emerald-700">Employee / Mentor</div>
                      <div className="text-[10px] text-slate-500">Assigned Mentees &amp; Manual Grading</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="candidate">
                    <div className="py-0.5">
                      <div className="font-bold text-slate-700">Candidate</div>
                      <div className="text-[10px] text-slate-500">Student &amp; Intern Practice Dashboard</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRoleModalOpen(false)}
              className="text-xs rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 h-9 px-4 font-semibold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => roleMut.mutate()}
              disabled={roleMut.isPending || !selectedUserEmail}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl h-9 px-5 shadow-md shadow-indigo-600/20"
            >
              {roleMut.isPending ? "Saving..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Voice Studio Dialog ── */}
      <Dialog open={voiceStudioModalOpen} onOpenChange={setVoiceStudioModalOpen}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-0 shadow-none overflow-hidden max-h-[90vh] overflow-y-auto">
          <AdminVoiceTrainingStudio onSaved={() => setVoiceStudioModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
