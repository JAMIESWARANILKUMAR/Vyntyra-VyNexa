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
    queryFn: () => getResultsFn({ data: { testId } }),
  });

  if (isLoading) return <div className="flex h-screen items-center justify-center text-slate-500">Loading AI Results...</div>;
  if (error || !result) return <div className="flex h-screen items-center justify-center text-rose-500">Error loading results.</div>;

  const isTerminated = result.status === "terminated_cheating";
  const isGraded = result.status === "graded";
  const strikes = (result.proctoring_logs as any[])?.length || 0;

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => window.history.back()} className="rounded-full h-10 w-10 p-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-slate-900">Exam Results</h1>
            <p className="text-slate-500 font-medium">{result.cbt_tests?.title || "AI CBT Exam"}</p>
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
                  <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Passing Score</span><span className="font-bold">{result.cbt_tests?.passing_score} / {result.max_score}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Submitted</span><span className="font-bold">{new Date(result.submitted_at || result.created_at).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Proctoring</span><span className={`font-bold ${strikes > 0 ? "text-rose-600" : "text-emerald-600"}`}>{strikes} Strikes</span></div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
                <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><BrainCircuit className="h-6 w-6 text-emerald-500"/> AI Grading Feedback</h2>
                
                {result.ai_feedback && Array.isArray(result.ai_feedback) && result.ai_feedback.length > 0 ? (
                  <div className="space-y-6">
                    {result.ai_feedback.map((fb: any, i: number) => (
                      <div key={i} className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-slate-800">{fb.question_id || `Question ${i+1}`}</h4>
                          <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">{fb.points_awarded} / {fb.max_points} pts</span>
                        </div>
                        <p className="text-slate-600 text-sm">{fb.feedback || fb.justification || "Correct."}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No detailed AI feedback available for this run.
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
