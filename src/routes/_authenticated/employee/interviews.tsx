import React, { useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { 
  Sparkles, Calendar, Users, Award, Clock, Search, Eye, 
  CheckCircle2, Plus, RefreshCw, MessageSquare, BookOpen, 
  Send, AlertCircle, FileText, Check, Radio, Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  listMentorMockSessionsFn, 
  scheduleMockInterviewFn, 
  updateMentorNotesAndGradeFn,
  INTERVIEW_DOMAINS 
} from '@/lib/mock-interview.functions';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/_authenticated/employee/interviews')({
  component: EmployeeMentorInterviewsDashboard
});

function EmployeeMentorInterviewsDashboard() {
  const navigate = useNavigate();
  const listMentorSessions = useServerFn(listMentorMockSessionsFn);
  const scheduleSession = useServerFn(scheduleMockInterviewFn);
  const updateEvaluation = useServerFn(updateMentorNotesAndGradeFn);

  // Current Mentor State
  const [mentorId, setMentorId] = useState<string>('');
  const [mentorName, setMentorName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'assigned' | 'schedule' | 'live'>('assigned');

  // Mentor Review Modal State
  const [reviewingSession, setReviewingSession] = useState<any | null>(null);
  const [mentorNotesInput, setMentorNotesInput] = useState('');
  const [mentorGradeInput, setMentorGradeInput] = useState<number>(85);
  const [isSavingReview, setIsSavingReview] = useState(false);

  // Scheduler Form State
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [internId, setInternId] = useState('');
  const [domain, setDomain] = useState('fullstack');
  const [difficulty, setDifficulty] = useState<'junior' | 'mid' | 'senior'>('mid');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  // Initialize Mentor profile
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setMentorId(data.user.id);
        const name = data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email || 'Mentor';
        setMentorName(name);
      }
    });
  }, []);

  // Fetch Mentor Sessions
  const { data: mentorData, isLoading, refetch } = useQuery({
    queryKey: ['mentor_mock_sessions', mentorId],
    queryFn: () => listMentorSessions({ data: { mentorId } }),
    enabled: true,
    refetchInterval: 8000 // Real-time 8s polling for live session watcher
  });

  // Handle Schedule Submit
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim() || !candidateEmail.trim() || !scheduledDate) {
      toast.error("Please fill in candidate name, email, and scheduled date/time.");
      return;
    }

    setIsScheduling(true);
    try {
      await scheduleSession({
        data: {
          candidateName: candidateName.trim(),
          candidateEmail: candidateEmail.trim(),
          internId: internId.trim() || undefined,
          domain,
          targetRole: INTERVIEW_DOMAINS.find(d => d.id === domain)?.recommendedRole || 'Full-Stack Software Engineer',
          difficulty,
          scheduledAt: new Date(scheduledDate).toISOString(),
          mentorId,
          mentorName,
          callerRole: 'employee',
          callerUserId: mentorId
        }
      });
      toast.success(`Mock interview successfully scheduled for ${candidateName}!`);
      setCandidateName('');
      setCandidateEmail('');
      setInternId('');
      setScheduledDate('');
      setActiveTab('assigned');
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule interview");
    } finally {
      setIsScheduling(false);
    }
  };

  // Handle Mentor Notes & Grade Submit
  const handleSaveMentorReview = async () => {
    if (!reviewingSession) return;
    setIsSavingReview(true);
    try {
      await updateEvaluation({
        data: {
          sessionId: reviewingSession.id,
          mentorNotes: mentorNotesInput,
          mentorGrade: Number(mentorGradeInput),
          mentorName
        }
      });
      toast.success("Mentor evaluation notes and grade saved!");
      setReviewingSession(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to save evaluation");
    } finally {
      setIsSavingReview(false);
    }
  };

  const assignedSessions = mentorData?.sessions || [];
  const activeSessions = mentorData?.activeSessions || [];
  const scheduledSessions = mentorData?.scheduledSessions || [];
  const completedSessions = mentorData?.completedSessions || [];

  return (
    <div className="min-h-screen bg-[#07090f] text-white font-sans p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Link to="/employee" className="hover:text-white transition-colors">Employee Portal</Link>
            <span>/</span>
            <span className="text-blue-400 font-semibold">Mentor Interview Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="h-6 w-6 text-blue-400" />
            Mentor AI Mock Interview Command Dashboard
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Schedule candidate sessions, review AI-generated reports, grade mentees, and audit live rooms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setActiveTab('schedule')}
            className="h-9 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-600/25"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule Candidate</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-9 px-3 rounded-xl border-white/15 text-gray-300 hover:text-white hover:bg-white/10 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ─── Mentor Metrics Grid ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#0c101c] border border-white/10 space-y-1">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Assigned</span>
          <div className="text-2xl font-black text-white">{assignedSessions.length}</div>
          <span className="text-[11px] text-gray-400">Mentees under your wing</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c101c] border border-emerald-500/30 space-y-1 shadow-lg shadow-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Currently In Interview</span>
            {activeSessions.length > 0 && <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />}
          </div>
          <div className="text-2xl font-black text-emerald-300">{activeSessions.length}</div>
          <span className="text-[11px] text-emerald-400/80">Live now</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c101c] border border-white/10 space-y-1">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Upcoming Scheduled</span>
          <div className="text-2xl font-black text-blue-400">{scheduledSessions.length}</div>
          <span className="text-[11px] text-gray-400">Queue</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c101c] border border-white/10 space-y-1">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Completed Reviews</span>
          <div className="text-2xl font-black text-purple-300">{completedSessions.length}</div>
          <span className="text-[11px] text-gray-400">Evaluations finalized</span>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('assigned')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'assigned'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>My Assigned Candidates ({assignedSessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('live')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'live'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Radio className="h-4 w-4" />
          <span>Live Session Watcher ({activeSessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'schedule'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Schedule New Session</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 1: MY ASSIGNED CANDIDATES
         ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'assigned' && (
        <div className="rounded-3xl bg-[#0c101c] border border-white/10 p-5 space-y-4 shadow-2xl">
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121727] text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Candidate &amp; Intern ID</th>
                  <th className="py-3 px-4">Track &amp; Difficulty</th>
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">AI Score / Verdict</th>
                  <th className="py-3 px-4">Mentor Grade</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">Loading your mentees...</td>
                  </tr>
                ) : assignedSessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No candidates assigned yet. Click "Schedule Candidate" to invite a student!
                    </td>
                  </tr>
                ) : (
                  assignedSessions.map((sess: any) => (
                    <tr key={sess.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-white block">{sess.candidate_name}</span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {sess.intern_id || sess.candidate_email}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-200 block">{sess.target_role}</span>
                        <span className="text-[10px] text-blue-400 font-mono capitalize">
                          {sess.domain?.replace('_', ' ')} • {sess.difficulty}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-gray-300 font-mono text-[11px]">
                        {sess.scheduled_at 
                          ? new Date(sess.scheduled_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                          : new Date(sess.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono inline-flex items-center gap-1 ${
                          sess.status === 'in_progress'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                            : sess.status === 'completed'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {sess.status?.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {sess.overall_score ? (
                          <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {sess.overall_score}% ({sess.hiring_verdict || 'Pass'})
                          </span>
                        ) : (
                          <span className="text-gray-500 font-mono text-[11px]">Pending Exam</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {sess.mentor_grade ? (
                          <span className="font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                            {sess.mentor_grade}/100
                          </span>
                        ) : (
                          <span className="text-gray-500 text-[11px]">Not Graded</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right space-x-1.5">
                        {sess.status === 'in_progress' ? (
                          <Button
                            size="sm"
                            onClick={() => window.open(`/interview/${sess.id}?observer=true`, '_blank')}
                            className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] rounded-lg"
                          >
                            <Eye className="h-3 w-3 mr-1" /> Watch Live
                          </Button>
                        ) : sess.status === 'completed' ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReviewingSession(sess);
                                setMentorNotesInput(sess.mentor_notes || '');
                                setMentorGradeInput(sess.mentor_grade || sess.overall_score || 85);
                              }}
                              className="h-7 px-2.5 border-white/15 text-indigo-300 hover:text-white rounded-lg text-[11px]"
                            >
                              <Edit3 className="h-3 w-3 mr-1" /> Grade &amp; Notes
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate({ to: `/interview/report/${sess.id}` })}
                              className="h-7 px-2.5 border-white/15 text-blue-400 hover:text-white rounded-lg text-[11px]"
                            >
                              Report
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate({ to: `/interview/${sess.id}` })}
                            className="h-7 px-2.5 border-white/15 text-gray-300 hover:text-white rounded-lg text-[11px]"
                          >
                            Enter Room
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 2: LIVE SESSION WATCHER (REAL-TIME AUDIT)
         ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          {activeSessions.length === 0 ? (
            <div className="p-12 rounded-3xl bg-[#0c101c] border border-dashed border-white/15 text-center text-gray-400 space-y-3">
              <Radio className="h-10 w-10 text-gray-600 mx-auto" />
              <h4 className="font-bold text-white text-base">No Assigned Candidates Currently Live</h4>
              <p className="text-xs max-w-md mx-auto">
                When one of your scheduled students begins their 1:1 AI Mock Interview, their room will appear here with live audit and observer controls.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeSessions.map((sess: any) => (
                <div key={sess.id} className="p-5 rounded-3xl bg-[#0c101c] border border-emerald-500/40 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <span className="font-bold text-sm text-white">{sess.candidate_name}</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        In Call
                      </span>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => window.open(`/interview/${sess.id}?observer=true`, '_blank')}
                      className="h-7 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1 shadow-sm"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Join Live Audit Stream</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">Target Track</span>
                      <span className="font-semibold text-white mt-0.5 block">{sess.target_role}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">Current Question</span>
                      <span className="font-mono text-blue-400 font-bold mt-0.5 block">
                        Question #{(sess.current_question_index || 0) + 1}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400">
                    Live speech transcripts and code submissions are being recorded to Cloudflare R2 and evaluated via OpenRouter.
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 3: SCHEDULE INTERVIEW FORM
         ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'schedule' && (
        <div className="max-w-2xl mx-auto rounded-3xl bg-[#0c101c] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              Schedule Mentee Mock Interview
            </h3>
            <p className="text-xs text-gray-400 mt-1">Assign an engineering track and slot a live interview time</p>
          </div>

          <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-300 uppercase block mb-1">Candidate Name *</label>
                <Input
                  value={candidateName}
                  onChange={e => setCandidateName(e.target.value)}
                  placeholder="e.g. Maya Patel"
                  required
                  className="h-10 bg-black/50 border-white/15 text-white rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-300 uppercase block mb-1">Candidate Email *</label>
                <Input
                  type="email"
                  value={candidateEmail}
                  onChange={e => setCandidateEmail(e.target.value)}
                  placeholder="maya@example.com"
                  required
                  className="h-10 bg-black/50 border-white/15 text-white rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-300 uppercase block mb-1">Intern ID</label>
                <Input
                  value={internId}
                  onChange={e => setInternId(e.target.value.toUpperCase())}
                  placeholder="VCS-INT-2024-..."
                  className="h-10 bg-black/50 border-white/15 text-white rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-300 uppercase block mb-1">Domain Track</label>
                <select
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  className="w-full h-10 px-3 bg-black/50 border border-white/15 text-white rounded-xl text-xs focus:outline-none"
                >
                  {INTERVIEW_DOMAINS.map(d => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-300 uppercase block mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as any)}
                  className="w-full h-10 px-3 bg-black/50 border border-white/15 text-white rounded-xl text-xs focus:outline-none font-mono"
                >
                  <option value="junior">Junior</option>
                  <option value="mid">Mid-Level</option>
                  <option value="senior">Senior</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-300 uppercase block mb-1">Scheduled Date &amp; Time *</label>
                <Input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  required
                  className="h-10 bg-black/50 border-white/15 text-white rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isScheduling}
              className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              <span>{isScheduling ? "Generating Curriculum & Dispatching..." : "Schedule Mock Interview"}</span>
            </Button>
          </form>
        </div>
      )}

      {/* ─── Mentor Notes & Grade Modal ─── */}
      <Dialog open={Boolean(reviewingSession)} onOpenChange={() => setReviewingSession(null)}>
        <DialogContent className="sm:max-w-lg bg-[#0e1118]/98 backdrop-blur-2xl border-white/15 text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-400" />
              Mentor Grade &amp; Qualitative Notes
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              Evaluation for <strong className="text-white">{reviewingSession?.candidate_name}</strong> ({reviewingSession?.target_role}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            {/* AI Automated Score Reference */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 block uppercase font-bold">OpenRouter AI Score</span>
                <span className="text-sm font-bold text-emerald-400">{reviewingSession?.overall_score}%</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block uppercase font-bold">AI Verdict</span>
                <span className="text-xs font-semibold text-blue-300">{reviewingSession?.hiring_verdict || 'Reviewed'}</span>
              </div>
            </div>

            {/* Mentor Grade Override (0-100) */}
            <div>
              <label className="text-[11px] font-bold text-gray-300 uppercase block mb-1">
                Mentor Grade (0 to 100)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={mentorGradeInput}
                onChange={e => setMentorGradeInput(Number(e.target.value))}
                className="h-10 bg-black/50 border-white/15 text-white rounded-xl text-xs font-mono"
              />
            </div>

            {/* Qualitative Mentor Notes */}
            <div>
              <label className="text-[11px] font-bold text-gray-300 uppercase block mb-1">
                Mentor Qualitative Remarks &amp; Feedback for Candidate
              </label>
              <Textarea
                rows={4}
                value={mentorNotesInput}
                onChange={e => setMentorNotesInput(e.target.value)}
                placeholder="Write actionable constructive feedback, areas to review before technical round, etc..."
                className="bg-black/50 border-white/15 text-white rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReviewingSession(null)}
              className="h-8 border-white/15 text-xs text-gray-300 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveMentorReview}
              disabled={isSavingReview}
              className="h-8 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl"
            >
              {isSavingReview ? "Saving..." : "Save Evaluation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
