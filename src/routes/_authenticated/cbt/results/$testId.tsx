import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getInternSubmissionResultFn } from "@/lib/cbt.functions";
import { Button } from "@/components/ui/button";
import { Trophy, XCircle, BrainCircuit, Activity, Clock, ShieldAlert, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cbt/results/$testId")({
  component: CbtResults,
});

function CbtResults() {
  const { testId } = Route.useParams();
  const getResultsFn = useServerFn(getInternSubmissionResultFn);

  const { data: result, isLoading, error } = useQuery({
    queryKey: ["cbt-result", testId],
    queryFn: () => {
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const subId = urlParams ? urlParams.get('submissionId') : undefined;
      return getResultsFn({ data: { testId, submissionId: subId || undefined } });
    },
  });

  if (isLoading) return <div className="flex h-screen items-center justify-center text-slate-500">Loading AI Results...</div>;
  if (error || !result) return <div className="flex h-screen items-center justify-center text-rose-500">Error loading results.</div>;

  const isTerminated = result.status === "terminated_cheating";
  const isGraded = result.status === "graded";
  const strikes = (result.proctoring_logs as any[])?.length || 0;

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans relative overflow-hidden">
      {/* Repeating Watermark Grid with Vyntyra Branding and Intern ID */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden flex flex-wrap gap-x-14 gap-y-16 opacity-[0.035] rotate-[-25deg] scale-150 justify-center items-center select-none">
        {Array.from({ length: 140 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2.5 whitespace-nowrap font-mono">
            <span className="text-xl font-black text-slate-900 tracking-wider">Vyntyra</span>
            <span className="text-xl font-bold text-slate-400">•</span>
            <span className="text-xl font-black text-slate-800 tracking-widest">{result?.intern_id || "INT-SECURE"}</span>
          </div>
        ))}
      </div>
      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => window.history.back()} className="rounded-full h-10 w-10 p-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-slate-900">Exam Results</h1>
            <p className="text-slate-500 font-medium">{result.cbt_exams?.title || "AI CBT Exam"}</p>
          </div>
        </div>

        {isTerminated ? (
          <div className="bg-rose-50 border border-rose-200 p-8 rounded-2xl text-center shadow-lg shadow-rose-500/10">
            <ShieldAlert className="h-20 w-20 text-rose-500 mx-auto mb-4" />
            <h2 className="text-3xl font-black text-rose-700 mb-2">Exam Terminated</h2>
            <p className="text-rose-900 font-medium mb-6">Your session was automatically terminated by the proctoring engine due to multiple policy violations.</p>
            <div className="inline-block bg-white text-rose-600 px-6 py-3 rounded-xl font-bold shadow-sm border border-rose-100">
              {strikes} Violation(s) Logged
            </div>
          </div>
        ) : !isGraded ? (
          <div className="bg-white border border-slate-200 p-12 rounded-2xl text-center shadow-xl">
            <Activity className="h-16 w-16 text-indigo-500 mx-auto mb-6 animate-pulse" />
            <h2 className="text-2xl font-black text-slate-900 mb-2">Processing Results...</h2>
            <p className="text-slate-600">The AI grading engine is currently evaluating your long answers and code submissions. Check back shortly!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
              <div className={`p-8 rounded-3xl text-center shadow-xl border ${result.passed ? "bg-emerald-600 border-emerald-500 text-white" : "bg-white border-slate-200"}`}>
                {result.passed ? <Trophy className="h-20 w-20 mx-auto mb-4 text-emerald-200" /> : <XCircle className="h-20 w-20 mx-auto mb-4 text-rose-500" />}
                <div className="text-sm font-bold uppercase tracking-wider mb-2 opacity-80">Final Score</div>
                <div className={`text-6xl font-black mb-4 ${!result.passed && "text-slate-900"}`}>{result.score}</div>
                <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${result.passed ? "bg-emerald-500 text-white" : "bg-rose-100 text-rose-700"}`}>
                  {result.passed ? "PASSED" : "FAILED"}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-indigo-500" /> Exam Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Passing Score</span><span className="font-bold">{result.cbt_exams?.passing_score}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Submitted</span><span className="font-bold">{new Date(result.submitted_at || result.created_at).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Proctoring</span><span className={`font-bold ${strikes > 0 ? "text-rose-600" : "text-emerald-600"}`}>{strikes} Strikes</span></div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <BrainCircuit className="h-6 w-6 text-emerald-500"/> Complete Question & Solution Breakdown
                  </h2>
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    Official Record
                  </span>
                </div>
                
                {((result.questionsReview || []).length > 0 ? result.questionsReview : (result.questions || [])).length > 0 ? (
                  <div className="space-y-4">
                    {((result.questionsReview || []).length > 0 ? result.questionsReview : result.questions).map((qItem: any, i: number) => {
                      const answerRow = (result.answers || []).find((a: any) => a.question_id === (qItem.question_id || qItem.id));
                      const isCorrect = qItem.is_correct ?? (answerRow ? (answerRow.ai_score > 0) : false);
                      const pts = qItem.score ?? answerRow?.ai_score ?? 0;
                      const maxPts = qItem.max_points || 10;
                      const candidateAns = qItem.intern_answer || answerRow?.selected_option || answerRow?.subjective_answer || "(Skipped)";

                      return (
                        <div key={qItem.id || i} className={`p-5 rounded-2xl border text-sm space-y-3 transition-all ${
                          isCorrect ? "bg-emerald-50/40 border-emerald-200" : "bg-slate-50/70 border-slate-200"
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono font-bold text-slate-900 bg-slate-200 px-2.5 py-1 rounded-md text-xs">
                                Question {i + 1}
                              </span>
                              <span className="font-bold uppercase tracking-wider text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                                {(qItem.question_type || "mcq").toUpperCase()}
                              </span>
                            </div>
                            <span className={`font-black px-3 py-1 rounded-full text-xs ${
                              isCorrect ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-rose-100 text-rose-800 border border-rose-300"
                            }`}>
                              {pts} / {maxPts} Points Awarded
                            </span>
                          </div>

                          <div className="font-semibold text-slate-900 leading-relaxed whitespace-pre-wrap">
                            {qItem.question_text}
                          </div>

                          {/* Candidate Response */}
                          <div className="p-3 bg-white border border-slate-200 rounded-xl">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Candidate Submitted Response:</span>
                            <div className={`font-mono text-xs font-semibold ${isCorrect ? "text-emerald-700" : "text-rose-700"}`}>
                              {typeof candidateAns === "object" ? JSON.stringify(candidateAns) : String(candidateAns)}
                            </div>
                          </div>

                          {/* Coding Automated Output Verification */}
                          {qItem.coding_verification && (
                            <div className="p-3.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs space-y-1">
                              <div className="text-[10px] font-sans font-bold text-indigo-400 uppercase tracking-wider">
                                Automated Code Output Verification:
                              </div>
                              <div className={qItem.coding_verification.output_matches ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                {qItem.coding_verification.output_matches ? "✓ Required Output Matched Expected Unit Tests" : "✗ Output Did Not Match Required Criteria"}
                              </div>
                              {qItem.coding_verification.actual_output && (
                                <div className="text-slate-400 text-[11px]">Actual Output: {qItem.coding_verification.actual_output}</div>
                              )}
                              {qItem.coding_verification.expected_output && (
                                <div className="text-emerald-300 text-[11px]">Expected Output: {qItem.coding_verification.expected_output}</div>
                              )}
                            </div>
                          )}

                          {/* Pre-Marked Solution */}
                          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl space-y-1.5">
                            <div className="flex items-center gap-1.5 text-emerald-800 font-black text-xs uppercase tracking-wider">
                              <Trophy className="h-4 w-4 text-emerald-600" /> Pre-Marked Official Solution:
                            </div>
                            <div className="text-emerald-950 font-bold text-xs">
                              {qItem.correct_answer ? (typeof qItem.correct_answer === "string" ? qItem.correct_answer : JSON.stringify(qItem.correct_answer)) : "Official Reference Solution"}
                            </div>
                            {qItem.explanation && (
                              <div className="text-xs text-emerald-800 pt-1.5 border-t border-emerald-200">
                                <span className="font-bold">Explanation / Reasoning:</span> {qItem.explanation}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center p-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No detailed question breakdown recorded for this submission.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
