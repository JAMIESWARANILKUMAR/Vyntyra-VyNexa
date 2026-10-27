import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMockSessionFn } from '@/lib/mock-interview.functions';
import { InterviewReport } from '@/components/interview/InterviewReport';

export const Route = createFileRoute('/interview/report/$sessionId')({
  component: MockInterviewReportPage
});

function MockInterviewReportPage() {
  const params = Route.useParams() as { sessionId: string };
  const sessionId = params.sessionId;
  const navigate = useNavigate();
  const getSession = useServerFn(getMockSessionFn);

  const { data, isLoading, error } = useQuery({
    queryKey: ['mock_session_report', sessionId],
    queryFn: () => getSession({ data: { sessionId } }),
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07090f] text-white flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p className="text-sm font-semibold tracking-wide text-gray-300">
          Loading AI Bar Raiser Evaluation Report...
        </p>
      </div>
    );
  }

  if (error || !data?.session) {
    return (
      <div className="min-h-screen bg-[#07090f] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-3 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Evaluation Report Not Found</h2>
        <p className="text-xs text-gray-400 max-w-md">
          The requested interview report could not be found or has not been concluded yet.
        </p>
        <Button
          onClick={() => navigate({ to: '/interview' })}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl px-5 h-9"
        >
          Return to Interview Studio
        </Button>
      </div>
    );
  }

  const session = data.session;
  const report = session.evaluation_report || {
    overallScore: session.overall_score || 80,
    technicalScore: session.technical_score || 78,
    communicationScore: session.communication_score || 82,
    behavioralScore: session.behavioral_score || 80,
    fluencyWpm: session.fluency_wpm || 120,
    fillerWordsCount: session.filler_words_count || 3,
    eyeContactPercent: session.eye_contact_percent || 85,
    headStabilityPercent: session.head_stability_percent || 90,
    hiringVerdict: session.hiring_verdict || 'Hire',
    executiveSummary: `${session.candidate_name} completed the ${session.target_role} mock interview with solid technical foundations.`,
    technicalBreakdown: { problemSolving: 80, systemArchitecture: 75, codeQuality: 82, csFundamentals: 78 },
    communicationBreakdown: { clarity: 84, pacing: 82, professionalDiction: 82, activeListening: 86 },
    keyStrengths: ["Clear communication", "Structured approach to code"],
    areasForImprovement: ["Add edge-case guard clauses"],
    questionReviews: [],
    preparationRoadmap: ["Review system design patterns"]
  };

  return (
    <div className="min-h-screen bg-[#07090f] py-8 px-4">
      <InterviewReport
        report={report}
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
