import React, { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMockSessionFn } from '@/lib/mock-interview.functions';
import { InterviewRoom } from '@/components/interview/InterviewRoom';
import { InterviewReport } from '@/components/interview/InterviewReport';

export const Route = createFileRoute('/interview/$sessionId')({
  component: LiveMockInterviewPage
});

function LiveMockInterviewPage() {
  const params = Route.useParams() as { sessionId: string };
  const sessionId = params.sessionId;
  const navigate = useNavigate();
  const getSession = useServerFn(getMockSessionFn);

  const [completedReport, setCompletedReport] = useState<any | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['mock_session_live', sessionId],
    queryFn: () => getSession({ data: { sessionId } }),
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#07090f] text-white flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p className="text-sm font-semibold tracking-wide text-gray-300">
          Connecting to 1:1 Live AI Interview Room...
        </p>
      </div>
    );
  }

  if (error || !data?.session) {
    return (
      <div className="fixed inset-0 bg-[#07090f] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-3 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Mock Interview Session Not Found</h2>
        <p className="text-xs text-gray-400 max-w-md">
          The requested interview session ID could not be loaded or may have expired.
        </p>
        <Button
          onClick={() => navigate({ to: '/interview' })}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl px-5 h-9"
        >
          Return to Interview Lobby
        </Button>
      </div>
    );
  }

  const session = data.session;
  const questions = Array.isArray(session.questions_bank) ? session.questions_bank : [];
  const isObserverMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('observer') === 'true';
  const isDemoMode = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('demo') === 'true' ||
    session.target_role?.includes('(Demo') ||
    session.difficulty === 'demo'
  );

  // If already completed or user just finished, display the full report
  if (completedReport || (session.status === 'completed' && session.evaluation_report)) {
    const reportData = completedReport || session.evaluation_report;
    return (
      <div className="min-h-screen bg-[#07090f] py-8 px-4">
        <InterviewReport
          report={reportData}
          candidateName={session.candidate_name}
          targetRole={session.target_role}
          domain={session.domain}
          difficulty={session.difficulty}
          sessionId={sessionId}
          reportR2Url={session.report_r2_url}
          onRetake={() => navigate({ to: '/interview' })}
          onBackToDashboard={() => window.location.href = '/intern'}
        />
      </div>
    );
  }

  return (
    <InterviewRoom
      sessionId={sessionId}
      candidateName={session.candidate_name}
      targetRole={session.target_role}
      domain={session.domain}
      difficulty={session.difficulty}
      questions={questions}
      initialQuestionIndex={session.current_question_index || 0}
      initialCode={session.code_snippet}
      initialCodeLanguage={session.code_language || 'javascript'}
      isObserver={isObserverMode}
      isDemoMode={isDemoMode}
      onConcludeInterview={(report) => {
        setCompletedReport(report);
      }}
    />
  );
}
