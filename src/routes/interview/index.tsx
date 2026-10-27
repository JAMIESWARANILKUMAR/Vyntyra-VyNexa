import React, { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { 
  Sparkles, Video, Mic, ShieldCheck, ArrowRight, Clock, Award, 
  Code2, CheckCircle2, ChevronRight, Play, History, Loader2, 
  BrainCircuit, Briefcase, FileSpreadsheet, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  INTERVIEW_DOMAINS, 
  createMockSessionFn, 
  listMockSessionsFn 
} from '@/lib/mock-interview.functions';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/interview/')({
  component: MockInterviewLobby
});

function MockInterviewLobby() {
  const navigate = useNavigate();
  const createSession = useServerFn(createMockSessionFn);
  const listSessions = useServerFn(listMockSessionsFn);

  // User State
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [internId, setInternId] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('fullstack');
  const [difficulty, setDifficulty] = useState<'junior' | 'mid' | 'senior'>('mid');
  const [customRole, setCustomRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);

  // Auto-fill from authenticated user if available
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCandidateEmail(data.user.email || '');
        const metaName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || '';
        if (metaName) setCandidateName(metaName);
      }
    });

    const savedIntern = localStorage.getItem('vcs_intern_id') || localStorage.getItem('intern_id');
    if (savedIntern) setInternId(savedIntern);
  }, []);

  // Fetch Previous Mock Sessions
  const { data: previousSessionsData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['mock_sessions_history', candidateEmail, internId],
    queryFn: () => listSessions({ data: { candidateEmail, internId } }),
    enabled: true
  });

  const selectedDomainMeta = INTERVIEW_DOMAINS.find(d => d.id === selectedDomain) || INTERVIEW_DOMAINS[2];

  // Start Live AI Mock Interview
  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim()) {
      toast.error("Please enter your name to proceed.");
      return;
    }

    setIsInitializing(true);
    toast.info("Initializing 1:1 Live AI Interlocutor session and generating tailored curriculum...", { duration: 4000 });

    try {
      const res = await createSession({
        data: {
          candidateName: candidateName.trim(),
          candidateEmail: candidateEmail.trim() || undefined,
          internId: internId.trim() || undefined,
          domain: selectedDomain,
          targetRole: customRole.trim() || selectedDomainMeta.recommendedRole,
          difficulty,
          jobDescription: jobDescription.trim() || undefined
        }
      });

      if (res && res.sessionId) {
        toast.success("AI Interviewer is ready! Connecting to 1:1 live room...");
        navigate({ to: `/interview/${res.sessionId}` });
      }
    } catch (err: any) {
      console.error("Failed to initialize session:", err);
      toast.error("Could not start interview. Please try again.");
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090f] text-white font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      
      {/* ─── Hero Navigation Header ─── */}
      <header className="border-b border-white/10 bg-[#0c101c]/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              VyNexa 1:1 AI Mock Interview Studio
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live Multi-Modal
              </span>
            </h1>
            <p className="text-xs text-gray-400">
              Interactive video, natural speech, real-time code editor & OpenRouter evaluation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/intern'}
            className="h-8 rounded-xl border-white/15 text-xs text-gray-300 hover:text-white hover:bg-white/10"
          >
            LMS Dashboard
          </Button>
        </div>
      </header>

      {/* ─── Main Content Container ─── */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        
        {/* Banner Hero */}
        <div className="relative rounded-3xl bg-gradient-to-br from-blue-900/30 via-indigo-950/20 to-purple-950/30 border border-blue-500/25 p-6 sm:p-10 overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold">
              <Star className="h-3.5 w-3.5 text-blue-400 fill-blue-400" />
              <span>Next-Gen Career Acceleration & LMS Readiness</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Master Technical Rounds with a Live <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">AI Bar Raiser</span>
            </h2>
            
            <p className="text-sm text-gray-300 leading-relaxed">
              Experience realistic 1:1 FAANG-grade mock interviews. Our virtual agent speaks naturally, evaluates your real-time speech fluency, monitors eye contact, tests your code in an embedded Monaco editor, and returns an executive debrief report.
            </p>
          </div>
        </div>

        {/* ─── Two-Column Setup & Previous Interviews ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT 7 COLUMNS: Configuration Form */}
          <div className="lg:col-span-7 rounded-3xl bg-[#0c101c] border border-white/10 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-400" />
                Configure Your Mock Interview
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Select your target engineering profile and difficulty calibration.
              </p>
            </div>

            <form onSubmit={handleStartInterview} className="space-y-5">
              
              {/* Domain Profile Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block mb-2">
                  1. Target Engineering Domain
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {INTERVIEW_DOMAINS.map(d => {
                    const isSelected = selectedDomain === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setSelectedDomain(d.id);
                          setCustomRole(d.recommendedRole);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          isSelected 
                            ? 'bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/20 text-white' 
                            : 'bg-black/40 border-white/10 text-gray-300 hover:border-white/20 hover:bg-white/[0.02]'
                        }`}
                      >
                        <span className="font-bold text-xs block text-white">{d.title}</span>
                        <span className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{d.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty Level */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block mb-2">
                  2. Interview Difficulty Calibration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['junior', 'mid', 'senior'] as const).map(lvl => {
                    const isSelected = difficulty === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setDifficulty(lvl)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase font-mono transition-all text-center ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30'
                            : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Candidate Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
                    Candidate Full Name *
                  </label>
                  <Input
                    value={candidateName}
                    onChange={e => setCandidateName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    required
                    className="h-10 bg-black/50 border-white/15 text-white text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
                    Intern ID / Candidate ID (Optional)
                  </label>
                  <Input
                    value={internId}
                    onChange={e => setInternId(e.target.value.toUpperCase())}
                    placeholder="e.g. VCS-INT-2024-001"
                    className="h-10 bg-black/50 border-white/15 text-white text-xs rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Custom Target Role */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
                  Target Position Title
                </label>
                <Input
                  value={customRole || selectedDomainMeta.recommendedRole}
                  onChange={e => setCustomRole(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="h-10 bg-black/50 border-white/15 text-white text-xs rounded-xl"
                />
              </div>

              {/* Hardware Pre-flight Check */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <Video className="h-4 w-4" />
                    <span>Camera Ready</span>
                  </div>
                  <div className="h-3 w-px bg-white/20" />
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <Mic className="h-4 w-4" />
                    <span>Mic Ready</span>
                  </div>
                </div>

                <span className="text-[10px] text-gray-400">Audio visualizer & speech sync enabled</span>
              </div>

              {/* Submit CTA */}
              <Button
                type="submit"
                disabled={isInitializing}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-600/25 transition-transform hover:scale-[1.01]"
              >
                {isInitializing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Orchestrating Live AI Session...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-white" />
                    <span>Enter 1:1 Live Mock Interview Room</span>
                  </>
                )}
              </Button>

            </form>
          </div>

          {/* RIGHT 5 COLUMNS: Past Interview Records & Scorecards */}
          <div className="lg:col-span-5 rounded-3xl bg-[#0c101c] border border-white/10 p-6 sm:p-8 shadow-2xl flex flex-col justify-between space-y-6">
            <div>
              <div className="border-b border-white/10 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <History className="h-4 w-4 text-emerald-400" />
                    Your Mock Interview History
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Track your bar-raiser trajectory</p>
                </div>
              </div>

              {/* History List */}
              <div className="mt-4 space-y-3">
                {isLoadingHistory ? (
                  <div className="p-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-400" /> Loading past sessions...
                  </div>
                ) : !previousSessionsData?.sessions || previousSessionsData.sessions.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-black/40 border border-dashed border-white/15 text-center text-xs text-gray-400 space-y-2">
                    <BrainCircuit className="h-8 w-8 text-gray-600 mx-auto" />
                    <p>No mock interviews recorded yet. Complete your first session to unlock comprehensive bar-raiser analytics!</p>
                  </div>
                ) : (
                  previousSessionsData.sessions.map((sess: any) => (
                    <div 
                      key={sess.id}
                      className="p-3.5 rounded-2xl bg-black/40 border border-white/10 hover:border-blue-500/40 transition-colors flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-white block truncate max-w-[180px]">
                          {sess.target_role || 'Software Engineer'}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(sess.created_at).toLocaleDateString()} • {sess.difficulty}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        {sess.overall_score ? (
                          <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-xs">
                            {sess.overall_score}%
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-mono">In Progress</span>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate({ to: `/interview/report/${sess.id}` })}
                          className="h-7 px-2.5 rounded-lg border-white/15 text-[11px] text-blue-400 hover:text-white hover:bg-blue-600"
                        >
                          Report
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Feature Highlights Card */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-xs text-gray-300 space-y-2">
              <span className="font-bold text-blue-400 uppercase text-[10px] tracking-wider block">
                Enterprise Standards:
              </span>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Sessions are recorded securely to Cloudflare R2 with transcripts evaluated via OpenRouter. You may export verified PDF scorecards directly for recruiter submissions or internal LMS milestones.
              </p>
            </div>

          </div>

        </div>

      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/10 p-4 text-center text-xs text-gray-400 bg-[#0c101c]/60">
        <span>VyNexa Connect AI Mock Interview Studio • Powered by OpenRouter, Cloudflare Realtime, D1, & R2</span>
      </footer>

    </div>
  );
}
