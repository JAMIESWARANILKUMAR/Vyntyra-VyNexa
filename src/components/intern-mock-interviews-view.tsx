import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles, Video, Calendar, Clock, Award, Shield, Users,
  Search, RefreshCw, Eye, CheckCircle2, AlertCircle, Plus,
  FileText, ExternalLink, ChevronRight, Play, ArrowRight,
  Code2, Cpu, BrainCircuit, Mic, Star, Timer
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
  listCandidateMockSessionsFn,
  createMockSessionFn,
  INTERVIEW_DOMAINS
} from "@/lib/mock-interview.functions";

interface InternMockInterviewsViewProps {
  currentUserId?: string;
  currentUserEmail?: string;
  internId?: string;
  candidateName?: string;
}

export function InternMockInterviewsView({
  currentUserId,
  currentUserEmail,
  internId,
  candidateName = "Candidate"
}: InternMockInterviewsViewProps) {
  const qc = useQueryClient();
  const listSessions = useServerFn(listCandidateMockSessionsFn);
  const createSession = useServerFn(createMockSessionFn);

  // Instant Practice Modal
  const [practiceModalOpen, setPracticeModalOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState("fullstack");
  const [difficulty, setDifficulty] = useState<"junior" | "mid" | "senior">("mid");
  const [customRole, setCustomRole] = useState("Full-Stack Software Engineer");
  const [isStarting, setIsStarting] = useState(false);

  // Query candidate sessions
  const { data: sessionData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["intern_mock_sessions", currentUserEmail, currentUserId, internId],
    queryFn: () => listSessions({
      data: {
        candidateEmail: currentUserEmail || undefined,
        candidateUserId: currentUserId || undefined,
        internId: internId || undefined
      }
    }),
    refetchInterval: 15000
  });

  const upcomingSessions = sessionData?.upcoming || [];
  const completedSessions = sessionData?.completed || [];

  // Start Demo Mode Simulation
  const handleStartDemoMode = async (track = "fullstack") => {
    setIsStarting(true);
    toast.info("Initializing 5-Minute Demo Practice Simulation...", { duration: 3000 });

    try {
      const meta = INTERVIEW_DOMAINS.find(d => d.id === track) || INTERVIEW_DOMAINS[2];
      const res = await createSession({
        data: {
          candidateName: candidateName.trim() || currentUserEmail || "Intern (Demo)",
          candidateEmail: currentUserEmail || undefined,
          internId: internId || undefined,
          domain: track,
          targetRole: `${meta.recommendedRole} (Demo Mode)`,
          difficulty: 'junior'
        }
      });

      if (res?.sessionId) {
        toast.success("Demo Mode Ready! Connecting with demo watermark...");
        window.location.href = `/interview/${res.sessionId}?demo=true`;
      } else {
        throw new Error("Failed to generate demo session ID");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start demo mode.");
    } finally {
      setIsStarting(false);
    }
  };

  // Start Instant Practice Interview
  const handleStartInstantPractice = async () => {
    setIsStarting(true);
    toast.info("Initializing 1:1 Live AI Interview room...", { duration: 3000 });

    try {
      const res = await createSession({
        data: {
          candidateName: candidateName.trim() || currentUserEmail || "Intern",
          candidateEmail: currentUserEmail || undefined,
          internId: internId || undefined,
          domain: selectedDomain,
          targetRole: customRole.trim() || "Full-Stack Software Engineer",
          difficulty
        }
      });

      if (res?.sessionId) {
        toast.success("AI Interviewer is ready! Connecting now...");
        window.location.href = `/interview/${res.sessionId}`;
      } else {
        throw new Error("Session ID missing from creation response");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to initialize interview. Please try again.");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Feature Hero Card ── */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-6 sm:p-8 overflow-hidden shadow-xl border border-indigo-500/30">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-mono font-semibold flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              1:1 Live Multi-Modal AI Interviewer
            </span>
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 bg-emerald-950/40 text-[10px]">
              WebRTC &amp; OpenRouter
            </Badge>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-white">
            Master FAANG-Grade Technical &amp; HR Rounds
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Practice with an intelligent AI interviewer that speaks and listens live. Features real-time speech recognition, natural TTS, eye contact &amp; posture tracking, an embedded Monaco code playground with test execution, and comprehensive debrief reports.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              onClick={() => handleStartDemoMode(selectedDomain)}
              disabled={isStarting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 px-5 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              <span>Launch 5-Min Demo Mode</span>
            </Button>

            <Button
              onClick={() => setPracticeModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-10 px-5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" /> Start Practice Interview
            </Button>

            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl gap-1.5 h-10"
              disabled={isFetching}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <span className="text-xs text-slate-400">Takes ~15–20 minutes • Instant PDF &amp; R2 Report</span>
          </div>
        </div>
      </div>

      {/* ── Demo Mode Card ── */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/50 via-teal-950/40 to-slate-900 border border-emerald-500/40 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
              🎮 Zero-Pressure Demo Simulation
            </span>
            <Badge variant="outline" className="border-teal-500/40 text-teal-300 text-[10px]">
              Not Graded • Unlimited Retries
            </Badge>
          </div>
          <h4 className="text-base font-extrabold text-white">Experience AI Mock Interview in Demo Mode</h4>
          <p className="text-xs text-slate-300 max-w-xl">
            Test your webcam, microphone, real-time speech recognition, voice synthesis, and interactive code playground with guided questions before taking your mentor-scheduled rounds.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => handleStartDemoMode("frontend")}
            disabled={isStarting}
            size="sm"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl h-9"
          >
            Demo Frontend
          </Button>
          <Button
            onClick={() => handleStartDemoMode("fullstack")}
            disabled={isStarting}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl h-9"
          >
            Demo Full-Stack
          </Button>
          <Button
            onClick={() => handleStartDemoMode("aiml")}
            disabled={isStarting}
            size="sm"
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl h-9"
          >
            Demo AI/ML
          </Button>
          <Button
            onClick={() => handleStartDemoMode("hr_behavioral")}
            disabled={isStarting}
            size="sm"
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl h-9"
          >
            Demo HR Round
          </Button>
        </div>
      </div>

      {/* ── Upcoming & Scheduled Mock Interviews Section ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <h4 className="text-base font-bold text-slate-900">Your Scheduled Mock Interviews</h4>
            <span className="text-xs text-slate-400">({upcomingSessions.length})</span>
          </div>
        </div>

        {upcomingSessions.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 text-center text-xs text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700">No upcoming interviews scheduled by your mentor.</div>
            <div>You can launch an on-demand practice interview round anytime using the button above.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingSessions.map((session: any) => {
              const isLiveNow = session.status === "in_progress";
              const scheduledDate = session.scheduled_at ? new Date(session.scheduled_at) : null;

              return (
                <div
                  key={session.id}
                  className={`p-5 rounded-2xl border transition-all shadow-sm ${
                    isLiveNow
                      ? "bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 border-emerald-300 ring-2 ring-emerald-400/20"
                      : "bg-white border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {isLiveNow ? (
                          <Badge className="bg-emerald-600 text-white text-[10px] font-bold gap-1 animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                            Live Now
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-blue-400 text-blue-700 bg-blue-50 text-[10px] font-bold">
                            Scheduled Slot
                          </Badge>
                        )}
                        <span className="text-xs font-bold text-slate-500 uppercase">{session.domain}</span>
                      </div>
                      <h4 className="text-base font-extrabold text-slate-900">{session.target_role}</h4>
                      <div className="text-xs text-slate-500 capitalize">Difficulty: {session.difficulty} Level</div>
                    </div>

                    <Button
                      asChild
                      size="sm"
                      className={`font-bold text-xs rounded-xl shadow-md gap-1.5 h-9 px-4 ${
                        isLiveNow
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      <a href={`/interview/${session.id}`}>
                        <Play className="h-3.5 w-3.5 fill-white" />
                        <span>Enter Room</span>
                      </a>
                    </Button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        {scheduledDate
                          ? scheduledDate.toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                          : "On-Demand"}
                      </span>
                    </div>

                    {session.mentor_name && (
                      <span className="text-indigo-600 font-medium">
                        Mentor: {session.mentor_name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Engineering Tracks Quick Practice Cards ── */}
      <div className="space-y-3">
        <h4 className="text-base font-bold text-slate-900">Practice by Domain Tracks</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition space-y-2">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
              <Code2 className="h-4 w-4" />
              <span>Frontend Engineering</span>
            </div>
            <p className="text-xs text-slate-600">React, TypeScript, Next.js, state management, and real-time DOM optimization challenges.</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedDomain("frontend");
                setCustomRole("Frontend Engineer (React/TypeScript)");
                setPracticeModalOpen(true);
              }}
              className="text-xs text-blue-600 p-0 h-auto font-semibold hover:bg-transparent"
            >
              Practice Frontend &rarr;
            </Button>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
              <Cpu className="h-4 w-4" />
              <span>Full-Stack &amp; Systems</span>
            </div>
            <p className="text-xs text-slate-600">End-to-end architectures, distributed APIs, Cloudflare Workers, and database query tuning.</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedDomain("fullstack");
                setCustomRole("Full-Stack Software Engineer");
                setPracticeModalOpen(true);
              }}
              className="text-xs text-indigo-600 p-0 h-auto font-semibold hover:bg-transparent"
            >
              Practice Full-Stack &rarr;
            </Button>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition space-y-2">
            <div className="flex items-center gap-2 text-purple-600 font-bold text-sm">
              <BrainCircuit className="h-4 w-4" />
              <span>AI / LLM Engineering</span>
            </div>
            <p className="text-xs text-slate-600">RAG architectures, vector embeddings, prompt engineering, and GenAI agent orchestration.</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedDomain("aiml");
                setCustomRole("AI / Machine Learning Engineer");
                setPracticeModalOpen(true);
              }}
              className="text-xs text-purple-600 p-0 h-auto font-semibold hover:bg-transparent"
            >
              Practice AI/ML &rarr;
            </Button>
          </div>
        </div>
      </div>

      {/* ── Past Mock Interview Reports & Scorecards Section ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-purple-600" />
            <h4 className="text-base font-bold text-slate-900">Your Past Scorecards &amp; Performance Reports</h4>
            <span className="text-xs text-slate-400">({completedSessions.length})</span>
          </div>
        </div>

        {completedSessions.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 text-center text-xs text-slate-500">
            No completed mock interviews yet. Finish your first practice round to view comprehensive AI evaluation reports!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedSessions.map((session: any) => {
              const score = session.overall_score || 0;
              const completedAt = session.updated_at ? new Date(session.updated_at) : null;

              return (
                <div key={session.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {session.domain}
                        </span>
                        {session.hiring_verdict && (
                          <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-50 text-[10px]">
                            {session.hiring_verdict}
                          </Badge>
                        )}
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 mt-1">{session.target_role}</h4>
                      <div className="text-[11px] text-slate-400">
                        {completedAt ? completedAt.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Recent"}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-xl font-black ${score >= 70 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-rose-600"}`}>
                        {Math.round(score)}/100
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Overall Score</div>
                    </div>
                  </div>

                  {/* Sub-scores */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-[11px]">
                    <div>
                      <div className="text-slate-400">Technical</div>
                      <div className="font-bold text-slate-800">{session.technical_score ? Math.round(session.technical_score) : "—"}/100</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Communication</div>
                      <div className="font-bold text-slate-800">{session.communication_score ? Math.round(session.communication_score) : "—"}/100</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Behavioral</div>
                      <div className="font-bold text-slate-800">{session.behavioral_score ? Math.round(session.behavioral_score) : "—"}/100</div>
                    </div>
                  </div>

                  {/* Mentor Notes (if graded) */}
                  {session.mentor_grade && (
                    <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/60 text-xs">
                      <div className="flex items-center justify-between font-bold text-indigo-900">
                        <span>Mentor Grade: {Math.round(session.mentor_grade)}/100</span>
                        {session.mentor_name && <span className="text-[11px] text-indigo-600 font-normal">by {session.mentor_name}</span>}
                      </div>
                      {session.mentor_notes && (
                        <p className="text-[11px] text-indigo-700 mt-1 italic">&ldquo;{session.mentor_notes}&rdquo;</p>
                      )}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>WPM: {session.fluency_wpm || "—"}</span>
                      <span>•</span>
                      <span>Eye Contact: {session.eye_contact_percent ? `${Math.round(session.eye_contact_percent)}%` : "—"}</span>
                    </div>

                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs rounded-xl h-8 gap-1.5"
                    >
                      <a href={`/interview/report/${session.id}`} target="_blank" rel="noreferrer">
                        <FileText className="h-3.5 w-3.5 text-purple-600" />
                        <span>View Full Report</span>
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal: Instant Practice Configuration ── */}
      <Dialog open={practiceModalOpen} onOpenChange={setPracticeModalOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Configure Practice Mock Interview
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Customize your 1:1 AI Mock session. Live camera &amp; microphone interaction will begin immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Target Track / Domain</Label>
              <Select
                value={selectedDomain}
                onValueChange={(val) => {
                  setSelectedDomain(val);
                  const meta = INTERVIEW_DOMAINS.find(d => d.id === val);
                  if (meta) setCustomRole(meta.recommendedRole);
                }}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVIEW_DOMAINS.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Target Job Role</Label>
              <Input
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="e.g. Full-Stack Software Engineer"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Difficulty Round</Label>
              <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Junior (Core Fundamentals &amp; Language)</SelectItem>
                  <SelectItem value="mid">Mid-Level (Practical Architecture &amp; Debugging)</SelectItem>
                  <SelectItem value="senior">Senior (System Design &amp; Edge Cases)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPracticeModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleStartInstantPractice}
              disabled={isStarting}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl gap-1.5"
            >
              {isStarting ? "Preparing Room..." : "Launch Interview Studio Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
