import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles, Video, Calendar, Clock, Award, Shield, Users,
  Search, RefreshCw, Eye, CheckCircle2, AlertCircle, Plus,
  FileText, ExternalLink, ChevronRight, Play, Edit, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  listMentorMockSessionsFn,
  scheduleMockInterviewFn,
  updateMentorNotesAndGradeFn,
  listInternsForMockInterviewFn,
  INTERVIEW_DOMAINS
} from "@/lib/mock-interview.functions";

interface EmployeeMockInterviewsViewProps {
  currentUserId?: string;
  currentUserEmail?: string;
  currentUserName?: string;
  myInterns?: any[];
}

export function EmployeeMockInterviewsView({
  currentUserId,
  currentUserEmail,
  currentUserName,
  myInterns = []
}: EmployeeMockInterviewsViewProps) {
  const qc = useQueryClient();
  const listMentorSessions = useServerFn(listMentorMockSessionsFn);
  const scheduleSession = useServerFn(scheduleMockInterviewFn);
  const updateGrade = useServerFn(updateMentorNotesAndGradeFn);
  const listInterns = useServerFn(listInternsForMockInterviewFn);

  // Modals
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [selectedSessionForGrade, setSelectedSessionForGrade] = useState<any>(null);

  // Schedule Form State
  const [selectedInternId, setSelectedInternId] = useState("");
  const [formCandidateName, setFormCandidateName] = useState("");
  const [formCandidateEmail, setFormCandidateEmail] = useState("");
  const [formDomain, setFormDomain] = useState("fullstack");
  const [formRole, setFormRole] = useState("Full-Stack Software Engineer");
  const [formDifficulty, setFormDifficulty] = useState<"junior" | "mid" | "senior">("mid");
  const [formScheduledAt, setFormScheduledAt] = useState("");

  // Grade Form State
  const [mentorNotes, setMentorNotes] = useState("");
  const [mentorGrade, setMentorGrade] = useState<number>(85);

  // Query mentor sessions
  const { data: mentorData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["employee_mentor_mock_sessions", currentUserId, currentUserEmail],
    queryFn: () => listMentorSessions({
      data: {
        mentorId: currentUserId || undefined,
        mentorEmail: currentUserEmail || undefined
      }
    }),
    enabled: true,
    refetchInterval: 12000
  });

  // Query all platform interns as fallback
  const { data: internsData } = useQuery({
    queryKey: ["interns_for_employee_interview_pick"],
    queryFn: () => listInterns({ data: {} }),
    enabled: scheduleModalOpen
  });

  const allAvailableInterns = React.useMemo(() => {
    const list: any[] = [...myInterns];
    (internsData?.interns || []).forEach((pi: any) => {
      const already = list.some(
        (mi: any) =>
          (mi.intern_id && mi.intern_id === pi.intern_id) ||
          (mi.id && mi.id === pi.id) ||
          (mi.email && mi.email?.toLowerCase() === pi.email?.toLowerCase())
      );
      if (!already) list.push(pi);
    });
    return list;
  }, [myInterns, internsData?.interns]);

  // Schedule Mutation
  const scheduleMut = useMutation({
    mutationFn: () => scheduleSession({
      data: {
        candidateName: formCandidateName.trim(),
        candidateEmail: formCandidateEmail.trim(),
        internId: selectedInternId || undefined,
        domain: formDomain,
        targetRole: formRole,
        difficulty: formDifficulty,
        scheduledAt: formScheduledAt ? new Date(formScheduledAt).toISOString() : new Date().toISOString(),
        mentorId: currentUserId || undefined,
        mentorName: currentUserName || currentUserEmail || "Mentor"
      }
    }),
    onSuccess: () => {
      toast.success("Candidate mock interview scheduled successfully!");
      setScheduleModalOpen(false);
      setFormCandidateName("");
      setFormCandidateEmail("");
      setSelectedInternId("");
      qc.invalidateQueries({ queryKey: ["employee_mentor_mock_sessions"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to schedule interview.");
    }
  });

  // Grade Mutation
  const gradeMut = useMutation({
    mutationFn: () => updateGrade({
      data: {
        sessionId: selectedSessionForGrade?.id,
        mentorNotes: mentorNotes.trim(),
        mentorGrade: Number(mentorGrade),
        mentorName: currentUserName || currentUserEmail || "Mentor"
      }
    }),
    onSuccess: () => {
      toast.success("Mentor evaluation saved successfully!");
      setGradeModalOpen(false);
      setSelectedSessionForGrade(null);
      qc.invalidateQueries({ queryKey: ["employee_mentor_mock_sessions"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save mentor evaluation.");
    }
  });

  const allSessions = mentorData?.sessions || [];
  const activeSessions = mentorData?.activeSessions || [];
  const scheduledSessions = mentorData?.scheduledSessions || [];
  const completedSessions = mentorData?.completedSessions || [];

  return (
    <div className="space-y-6">
      {/* ── Header Banner ── */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/60 via-indigo-950/60 to-purple-950/60 border border-blue-500/30 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-amber-400" />
              Mentor AI Command Desk
            </span>
            <Badge variant="outline" className="border-indigo-500/40 text-indigo-300 bg-indigo-950/40 text-[10px]">
              Assigned Mentees &amp; Evaluation
            </Badge>
          </div>
          <h2 className="text-xl font-extrabold text-white">
            AI-Powered 1:1 Mock Interview Studio
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Schedule practice interview rounds for your interns, observe live sessions in silent audit mode, and provide manual mentor grading alongside the AI scorecard.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl gap-1.5 h-9"
            disabled={isFetching}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            onClick={() => setScheduleModalOpen(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl gap-1.5 h-9 shadow-lg shadow-blue-600/30"
          >
            <Plus className="h-4 w-4" />
            Schedule Candidate
          </Button>
        </div>
      </div>

      {/* ── Quick KPI Counters ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0E131F]/90 rounded-2xl p-4 border border-slate-800 shadow-md">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Assigned</div>
          <div className="text-2xl font-black text-white mt-1">{allSessions.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Mock rounds</div>
        </div>

        <div className="bg-[#0E131F]/90 rounded-2xl p-4 border border-emerald-500/30 bg-emerald-950/20 shadow-md">
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Active Live Now
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{activeSessions.length}</div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5">In room right now</div>
        </div>

        <div className="bg-[#0E131F]/90 rounded-2xl p-4 border border-blue-500/30 bg-blue-950/20 shadow-md">
          <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Upcoming</div>
          <div className="text-2xl font-black text-blue-400 mt-1">{scheduledSessions.length}</div>
          <div className="text-[10px] text-blue-500/80 mt-0.5">Awaiting start</div>
        </div>

        <div className="bg-[#0E131F]/90 rounded-2xl p-4 border border-purple-500/30 bg-purple-950/20 shadow-md">
          <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Completed</div>
          <div className="text-2xl font-black text-purple-400 mt-1">{completedSessions.length}</div>
          <div className="text-[10px] text-purple-500/80 mt-0.5">Ready for grading</div>
        </div>
      </div>

      {/* ── Active Live Sessions Alert (if any) ── */}
      {activeSessions.length > 0 && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 shadow-lg flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <div className="text-xs font-bold text-emerald-200">
                Live Mock Interview in Progress! ({activeSessions[0].candidate_name})
              </div>
              <div className="text-[11px] text-emerald-300/80">
                Role: {activeSessions[0].target_role} • Domain: {activeSessions[0].domain}
              </div>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl gap-1.5 shadow-md"
          >
            <a href={`/interview/${activeSessions[0].id}?observer=true`} target="_blank" rel="noreferrer">
              <Eye className="h-3.5 w-3.5" />
              Join Live Audit (Silent)
            </a>
          </Button>
        </div>
      )}

      {/* ── Sessions List Table ── */}
      <div className="bg-[#0E131F]/90 rounded-3xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Assigned Candidates &amp; Interview Sessions</h3>
            <span className="text-xs text-slate-400">({allSessions.length})</span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
            Loading assigned interviews...
          </div>
        ) : allSessions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <div>No mock interview sessions assigned yet.</div>
            <Button
              onClick={() => setScheduleModalOpen(true)}
              size="sm"
              variant="outline"
              className="border-indigo-500/40 text-indigo-300 text-xs rounded-xl"
            >
              Schedule Your First Intern
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Role &amp; Domain</th>
                  <th className="py-3 px-4">Scheduled Slot</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">AI Score</th>
                  <th className="py-3 px-4">Mentor Feedback</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allSessions.map((s: any) => {
                  const isLive = s.status === "in_progress";
                  const isScheduled = s.status === "scheduled";
                  const isCompleted = s.status === "completed";

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{s.candidate_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{s.candidate_email || "No email"}</div>
                        {s.intern_id && (
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                            {s.intern_id}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200">{s.target_role}</div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-slate-400 text-[10px]">
                          <span className="uppercase font-bold">{s.domain}</span>
                          <span>•</span>
                          <span className="capitalize">{s.difficulty}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {s.scheduled_at ? (
                          <div>
                            <div className="text-slate-200 font-medium">
                              {new Date(s.scheduled_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {new Date(s.scheduled_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">On-demand</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {isLive ? (
                          <Badge className="bg-emerald-500 text-white font-bold text-[10px] gap-1 animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                            Active Live
                          </Badge>
                        ) : isScheduled ? (
                          <Badge variant="outline" className="border-blue-500/40 text-blue-300 bg-blue-950/40 text-[10px] font-bold">
                            Scheduled
                          </Badge>
                        ) : isCompleted ? (
                          <Badge variant="outline" className="border-purple-500/40 text-purple-300 bg-purple-950/40 text-[10px] font-bold">
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px]">
                            {s.status}
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {s.overall_score !== null && s.overall_score !== undefined ? (
                          <div>
                            <div className={`font-black text-sm ${s.overall_score >= 70 ? "text-emerald-400" : s.overall_score >= 50 ? "text-amber-400" : "text-rose-400"}`}>
                              {Math.round(s.overall_score)}/100
                            </div>
                            {s.hiring_verdict && (
                              <span className="text-[10px] text-slate-400">
                                {s.hiring_verdict}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {s.mentor_grade ? (
                          <div>
                            <span className="font-bold text-indigo-300 text-xs">
                              {Math.round(s.mentor_grade)}/100
                            </span>
                            <div className="text-[10px] text-slate-400 truncate max-w-[150px]" title={s.mentor_notes}>
                              {s.mentor_notes || "Graded"}
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedSessionForGrade(s);
                              setMentorNotes(s.mentor_notes || "");
                              setMentorGrade(s.mentor_grade || 85);
                              setGradeModalOpen(true);
                            }}
                            className="text-xs text-indigo-400 hover:text-indigo-300 p-0 h-auto font-bold"
                          >
                            + Add Grade &amp; Notes
                          </Button>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isLive ? (
                            <Button
                              asChild
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] h-7 px-2.5 rounded-lg gap-1"
                            >
                              <a href={`/interview/${s.id}?observer=true`} target="_blank" rel="noreferrer">
                                <Eye className="h-3 w-3" />
                                Audit
                              </a>
                            </Button>
                          ) : isCompleted ? (
                            <>
                              <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 text-[11px] h-7 px-2.5 rounded-lg gap-1"
                              >
                                <a href={`/interview/report/${s.id}`} target="_blank" rel="noreferrer">
                                  <FileText className="h-3 w-3 text-purple-400" />
                                  Report
                                </a>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedSessionForGrade(s);
                                  setMentorNotes(s.mentor_notes || "");
                                  setMentorGrade(s.mentor_grade || 85);
                                  setGradeModalOpen(true);
                                }}
                                className="border-indigo-500/40 bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/60 text-[11px] h-7 px-2 rounded-lg"
                                title="Edit Mentor Notes"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800 text-[11px] h-7 px-2.5 rounded-lg gap-1"
                            >
                              <a href={`/interview/${s.id}`} target="_blank" rel="noreferrer">
                                <Play className="h-3 w-3 text-blue-400" />
                                Enter
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

      {/* ── Modal: Schedule Interview for Intern ── */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent className="max-w-md rounded-3xl bg-[#0E131F] border border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-white">
              <Calendar className="h-5 w-5 text-blue-400" />
              Schedule Mentee Mock Interview
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Pick one of your assigned mentees or manually enter candidate details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Select Intern / Candidate</span>
                <span className="text-[10px] text-indigo-400 font-normal">
                  {allAvailableInterns.length} available
                </span>
              </Label>
              <Select
                value={selectedInternId}
                onValueChange={(val) => {
                  setSelectedInternId(val);
                  const intern = allAvailableInterns.find(
                    (i: any) => (i.intern_id || i.id) === val || i.email === val
                  );
                  if (intern) {
                    setFormCandidateName(intern.name || intern.full_name || "");
                    setFormCandidateEmail(intern.email || "");
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
                <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Choose registered intern..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-60">
                  {allAvailableInterns.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No registered interns found
                    </SelectItem>
                  ) : (
                    allAvailableInterns.map((i: any) => (
                      <SelectItem key={i.id || i.intern_id} value={i.intern_id || i.id}>
                        {i.name || i.full_name || i.email} {i.intern_id ? `(${i.intern_id})` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-300">Candidate Name *</Label>
                <Input
                  value={formCandidateName}
                  onChange={(e) => setFormCandidateName(e.target.value)}
                  placeholder="Intern Name"
                  className="h-9 text-xs rounded-xl bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-300">Candidate Email *</Label>
                <Input
                  type="email"
                  value={formCandidateEmail}
                  onChange={(e) => setFormCandidateEmail(e.target.value)}
                  placeholder="intern@example.com"
                  className="h-9 text-xs rounded-xl bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-300">Domain</Label>
                <Select
                  value={formDomain}
                  onValueChange={(val) => {
                    setFormDomain(val);
                    const meta = INTERVIEW_DOMAINS.find(d => d.id === val);
                    if (meta) setFormRole(meta.recommendedRole);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    {INTERVIEW_DOMAINS.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-300">Difficulty</Label>
                <Select value={formDifficulty} onValueChange={(v: any) => setFormDifficulty(v)}>
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="mid">Mid-Level</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-300">Target Role</Label>
              <Input
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                placeholder="Full-Stack Software Engineer"
                className="h-9 text-xs rounded-xl bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-300">Scheduled Date &amp; Time Slot</Label>
              <Input
                type="datetime-local"
                value={formScheduledAt}
                onChange={(e) => setFormScheduledAt(e.target.value)}
                className="h-9 text-xs rounded-xl bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScheduleModalOpen(false)}
              className="border-slate-700 text-slate-300 text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => scheduleMut.mutate()}
              disabled={scheduleMut.isPending || !formCandidateName || !formCandidateEmail}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl"
            >
              {scheduleMut.isPending ? "Scheduling..." : "Confirm Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Add Mentor Grade & Feedback Notes ── */}
      <Dialog open={gradeModalOpen} onOpenChange={setGradeModalOpen}>
        <DialogContent className="max-w-md rounded-3xl bg-[#0E131F] border border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-white">
              <Award className="h-5 w-5 text-amber-400" />
              Mentor Feedback &amp; Score Override
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Submit your evaluation for {selectedSessionForGrade?.candidate_name} ({selectedSessionForGrade?.target_role}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-300">Mentor Score (0 - 100)</Label>
                <span className="text-xs font-bold text-amber-400">{mentorGrade}/100</span>
              </div>
              <Input
                type="number"
                min={0}
                max={100}
                value={mentorGrade}
                onChange={(e) => setMentorGrade(Number(e.target.value))}
                className="h-9 text-xs rounded-xl bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-300">Mentor Feedback &amp; Recommendations *</Label>
              <Textarea
                rows={4}
                value={mentorNotes}
                onChange={(e) => setMentorNotes(e.target.value)}
                placeholder="Write actionable technical & communication feedback for the candidate..."
                className="text-xs rounded-xl bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGradeModalOpen(false)}
              className="border-slate-700 text-slate-300 text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => gradeMut.mutate()}
              disabled={gradeMut.isPending || !mentorNotes.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
            >
              {gradeMut.isPending ? "Saving..." : "Submit Mentor Grade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
