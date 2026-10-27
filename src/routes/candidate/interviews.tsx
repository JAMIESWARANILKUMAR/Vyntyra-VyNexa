import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { 
  Sparkles, Calendar, Clock, Award, CheckCircle2, Play, 
  Lock, ArrowRight, FileText, Download, RotateCcw, ShieldCheck, 
  HelpCircle, UserCheck, AlertCircle, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { listCandidateMockSessionsFn } from '@/lib/mock-interview.functions';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/candidate/interviews')({
  component: CandidateInterviewsDashboard
});

function CandidateInterviewsDashboard() {
  const navigate = useNavigate();
  const listCandidateSessions = useServerFn(listCandidateMockSessionsFn);

  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidateUserId, setCandidateUserId] = useState('');
  const [internId, setInternId] = useState('');
  const [now, setNow] = useState(new Date());

  // Countdown timer clock tick
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize candidate user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCandidateUserId(data.user.id);
        setCandidateEmail(data.user.email || '');
      }
    });

    const savedIntern = localStorage.getItem('vcs_intern_id') || localStorage.getItem('intern_id');
    if (savedIntern) setInternId(savedIntern);
  }, []);

  // Fetch Candidate Sessions
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['candidate_mock_sessions', candidateEmail, candidateUserId, internId],
    queryFn: () => listCandidateSessions({
      data: {
        candidateEmail: candidateEmail || undefined,
        candidateUserId: candidateUserId || undefined,
        internId: internId || undefined
      }
    }),
    enabled: true,
    refetchInterval: 15000
  });

  const upcomingSessions = data?.upcoming || [];
  const completedSessions = data?.completed || [];

  // Countdown Calculator
  const getCountdownString = (targetDateStr?: string | null) => {
    if (!targetDateStr) return { text: "Immediate Entry Open", isUnlocked: true };
    const target = new Date(targetDateStr).getTime();
    const current = now.getTime();
    const diff = target - current;

    // Unlock window: if within 15 mins before or anytime after
    if (diff <= 15 * 60 * 1000) {
      return { text: "Room Unlocked • Ready to Join", isUnlocked: true };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      text: `Starts in ${hours}h ${mins}m ${secs}s`,
      isUnlocked: false
    };
  };

  return (
    <div className="min-h-screen bg-[#07090f] text-white font-sans p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Link to="/intern" className="hover:text-white transition-colors">LMS Dashboard</Link>
            <span>/</span>
            <span className="text-blue-400 font-semibold">Candidate Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="h-6 w-6 text-blue-400" />
            My AI Mock Interviews &amp; Performance Track
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Access your scheduled mock interview rooms with unlocked countdowns and review official evaluation reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate({ to: '/interview' })}
            className="h-9 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-600/25"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>Practice On-Demand Interview</span>
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

      {/* ─── UPCOMING SCHEDULED SESSIONS ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-400" />
            Upcoming Scheduled Mock Interviews ({upcomingSessions.length})
          </h2>
          <span className="text-xs text-gray-400">Unlocks 15 minutes before scheduled slot</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading your schedule...</div>
        ) : upcomingSessions.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#0c101c] border border-dashed border-white/15 text-center text-gray-400 space-y-2">
            <Calendar className="h-8 w-8 text-gray-600 mx-auto" />
            <h4 className="font-bold text-white text-sm">No Scheduled Interviews in Queue</h4>
            <p className="text-xs max-w-md mx-auto">
              Your mentors will schedule upcoming interviews, or you can start a practice round anytime.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingSessions.map((sess: any) => {
              const countdown = getCountdownString(sess.scheduled_at);

              return (
                <div key={sess.id} className="p-5 rounded-3xl bg-[#0c101c] border border-white/10 shadow-xl flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {sess.domain?.replace('_', ' ')} • {sess.difficulty}
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {sess.scheduled_at ? new Date(sess.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Instant'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">{sess.target_role}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Scheduled for {sess.scheduled_at ? new Date(sess.scheduled_at).toLocaleDateString([], { dateStyle: 'full' }) : 'Today'}
                    </p>

                    {sess.mentor_name && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-300">
                        <UserCheck className="h-3.5 w-3.5 text-blue-400" />
                        <span>Assigned Mentor: <strong className="text-white">{sess.mentor_name}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Countdown Pill & Start Button */}
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Status:</span>
                      <span className={`font-mono font-semibold ${countdown.isUnlocked ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {countdown.text}
                      </span>
                    </div>

                    <Button
                      onClick={() => navigate({ to: `/interview/${sess.id}` })}
                      disabled={!countdown.isUnlocked}
                      className={`w-full h-10 font-bold text-xs rounded-xl flex items-center justify-center gap-2 ${
                        countdown.isUnlocked
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                          : 'bg-white/10 text-gray-500 cursor-not-allowed border border-white/10'
                      }`}
                    >
                      {countdown.isUnlocked ? (
                        <>
                          <Play className="h-4 w-4 fill-white" />
                          <span>Start Interview Now</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          <span>Locked Until Scheduled Time</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── PAST INTERVIEWS & EVALUATION HISTORY ─── */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Award className="h-4 w-4 text-emerald-400" />
          Completed Mock Interviews &amp; Scorecards ({completedSessions.length})
        </h2>

        {completedSessions.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#0c101c] border border-dashed border-white/15 text-center text-gray-400">
            No completed interviews yet. Finish a mock interview to generate your evaluation report!
          </div>
        ) : (
          <div className="space-y-3">
            {completedSessions.map((sess: any) => (
              <div 
                key={sess.id}
                className="p-5 rounded-2xl bg-[#0c101c] border border-white/10 hover:border-blue-500/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{sess.target_role}</span>
                    <span className="text-[10px] font-mono uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                      {sess.domain?.replace('_', ' ')} • {sess.difficulty}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400">
                    Completed on {new Date(sess.updated_at || sess.created_at).toLocaleDateString([], { dateStyle: 'medium' })}
                  </p>

                  {sess.mentor_notes && (
                    <div className="mt-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-gray-300">
                      <strong className="text-blue-400 block text-[10px] uppercase font-mono">Mentor Notes:</strong>
                      {sess.mentor_notes}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Score</span>
                    <span className="text-lg font-black font-mono text-emerald-400">
                      {sess.overall_score || 80}%
                    </span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => navigate({ to: `/interview/report/${sess.id}` })}
                    className="h-8 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-600/20"
                  >
                    View Report &amp; PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
