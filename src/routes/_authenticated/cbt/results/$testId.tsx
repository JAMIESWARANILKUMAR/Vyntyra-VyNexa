import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getInternSubmissionResultFn } from "@/lib/cbt.functions";
import { Button } from "@/components/ui/button";
import { 
  Trophy, XCircle, BrainCircuit, Activity, Clock, ShieldAlert, ArrowLeft, 
  Download, CheckCircle2, AlertTriangle, Sparkles, Target, Lightbulb, FileText, CheckCircle, RotateCcw
} from "lucide-react";
import { 
  downloadCbtDetailedReportPdf, 
  generateNextAttemptSuggestions, 
  CbtQuestionAudit 
} from "@/lib/cbt-report";

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

  if (isLoading) return <div className="flex h-screen items-center justify-center text-slate-500 font-sans">Loading AI Evaluation Results...</div>;
  if (error || !result) return <div className="flex h-screen items-center justify-center text-rose-500 font-sans">Error loading assessment results.</div>;

  const isTerminated = result.status === "terminated_cheating";
  const strikes = (result.proctoring_logs as any[])?.length || 0;

  // Extract Question & Answer Lists
  const questionsList: any[] = (result.questionsReview && result.questionsReview.length > 0) 
    ? result.questionsReview 
    : (result.questions || []);
  const answersList: any[] = result.answers || [];

  // Accurate Points Calculation (Guarantees points are added from answers)
  const pointsFromAnswers = answersList.reduce((acc: number, a: any) => acc + (Number(a.ai_score) || 0), 0);
  const totalScore = Math.max(Number(result.score) || 0, pointsFromAnswers);
  const totalQuestions = questionsList.length || 0;

  const correctCount = questionsList.filter((q: any) => {
    const ans = answersList.find((a: any) => a.question_id === (q.question_id || q.id));
    const pts = q.score ?? ans?.ai_score ?? 0;
    const max = q.max_points || 10;
    return pts >= max;
  }).length;

  const partialCount = questionsList.filter((q: any) => {
    const ans = answersList.find((a: any) => a.question_id === (q.question_id || q.id));
    const pts = q.score ?? ans?.ai_score ?? 0;
    const max = q.max_points || 10;
    return pts > 0 && pts < max;
  }).length;

  const incorrectCount = Math.max(0, totalQuestions - correctCount - partialCount);
  const accuracyRate = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const maxScore = Number(result.maxScore) || questionsList.reduce((acc: number, q: any) => acc + (Number(q.max_points) || 10), 0) || 100;
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : (Number(result.percentage) || 0);
  const passingScore = Number(result.passingScore) || Number(result.cbt_exams?.passing_score) || 50;
  const passed = percentage >= passingScore;

  // An exam is considered graded if status is 'graded', or if answers exist with score
  const isGraded = result.status === "graded" || answersList.length > 0 || totalScore > 0;

  // Build question audit models for PDF export & recommendations
  const questionAudits: CbtQuestionAudit[] = questionsList.map((q: any, i: number) => {
    const answerRow = answersList.find((a: any) => a.question_id === (q.question_id || q.id));
    const isCorrect = q.is_correct ?? (answerRow ? (Number(answerRow.ai_score) >= (q.max_points || 10)) : false);
    const pts = q.score ?? answerRow?.ai_score ?? 0;
    const maxPts = q.max_points || 10;
    const candidateAns = q.intern_answer || answerRow?.selected_option || answerRow?.subjective_answer || "(Skipped)";
    
    let cleanCandidateAns = candidateAns;
    if (typeof candidateAns === "object" && candidateAns !== null) {
      cleanCandidateAns = candidateAns.text ? `[${candidateAns.id || ''}] ${candidateAns.text}` : (candidateAns.id || JSON.stringify(candidateAns));
    }

    return {
      question_id: q.question_id || q.id || `q_${i + 1}`,
      question_number: i + 1,
      question_text: q.question_text,
      question_type: q.question_type || "mcq",
      max_points: maxPts,
      awarded_score: pts,
      is_correct: isCorrect,
      candidate_answer: String(cleanCandidateAns),
      correct_answer: typeof q.correct_answer === "object" ? JSON.stringify(q.correct_answer) : String(q.correct_answer || "Refer to explanation"),
      explanation: q.explanation,
      feedback: q.feedback || answerRow?.ai_feedback
    };
  });

  const suggestions = generateNextAttemptSuggestions(questionAudits, passingScore, percentage, totalScore, maxScore);

  const handleDownloadPdf = () => {
    downloadCbtDetailedReportPdf({
      candidateName: result.profiles?.full_name || result.intern_id || "Candidate",
      candidateEmail: result.profiles?.email || "",
      internId: result.profiles?.intern_id || result.intern_id || "INT-SECURE",
      examTitle: result.cbt_exams?.title || "VyNexa Technical Assessment",
      examDescription: result.cbt_exams?.description || "",
      submittedAt: new Date(result.submitted_at || result.created_at || Date.now()).toLocaleString(),
      submissionId: result.id || testId,
      totalScore,
      maxScore,
      percentage,
      passingScore,
      passed,
      totalQuestions,
      correctCount,
      partialCount,
      incorrectCount,
      accuracyRate,
      infractionsCount: strikes,
      malpracticeLogs: result.proctoring_logs,
      questions: questionAudits,
      suggestions
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8 font-sans relative overflow-hidden">
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

      <div className="max-w-5xl mx-auto space-y-6 relative z-10">
        
        {/* Top Header with Back and PDF Download Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => window.history.back()} className="rounded-full h-10 w-10 p-0 shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Assessment Mark Sheet & Audit</h1>
              <p className="text-slate-500 font-medium text-xs sm:text-sm">{result.cbt_exams?.title || "Technical CBT Exam"}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button 
              onClick={handleDownloadPdf}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider h-11 px-5 rounded-xl flex items-center gap-2 shadow-md hover:shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" /> Download Detailed Report (PDF)
            </Button>
            {result.canRetake && (
              <Button
                onClick={() => window.location.href = `/cbt/${testId}`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider h-11 px-5 rounded-xl flex items-center gap-2 shadow-md hover:shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" /> Retake Test Now
              </Button>
            )}
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
            <p className="text-slate-600">The AI grading engine is currently evaluating your responses and code submissions. Check back shortly!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Column: Scorecard, Breakdown & Details */}
            <div className="md:col-span-1 space-y-6">
              
              {/* Scorecard Tile */}
              <div className={`p-8 rounded-3xl text-center shadow-lg border transition-all ${passed ? "bg-emerald-600 border-emerald-500 text-white" : "bg-white border-slate-200"}`}>
                {passed ? <Trophy className="h-16 w-16 mx-auto mb-3 text-emerald-200 animate-in zoom-in" /> : <XCircle className="h-16 w-16 mx-auto mb-3 text-rose-500 animate-in zoom-in" />}
                <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Total Points Awarded</div>
                <div className={`text-5xl font-black mb-1 ${!passed ? "text-slate-900" : "text-white"}`}>{totalScore}</div>
                <div className={`text-xs font-semibold mb-4 ${!passed ? "text-slate-500" : "text-emerald-100"}`}>
                  out of {maxScore} max points ({percentage}%)
                </div>
                <div className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${passed ? "bg-emerald-500 text-white" : "bg-rose-100 text-rose-800 border border-rose-200"}`}>
                  {passed ? "QUALIFIED / PASSED" : "FAILED / NEEDS RETAKE"}
                </div>
                <div className={`mt-4 pt-3 border-t text-xs flex items-center justify-between font-medium ${passed ? "border-emerald-500/50 text-emerald-100" : "border-slate-100 text-slate-600"}`}>
                  <span>Attempt Record:</span>
                  <span className="font-bold font-mono">
                    {result.attemptsUsed || 1} / {result.isUnlimited ? "Unlimited" : (result.maxAttempts || 1)}
                  </span>
                </div>
                {result.canRetake && (
                  <Button
                    onClick={() => window.location.href = `/cbt/${testId}`}
                    className={`mt-3 w-full font-bold text-xs uppercase tracking-wider py-2 rounded-xl flex items-center justify-center gap-2 shadow-sm ${passed ? "bg-white text-emerald-800 hover:bg-emerald-50" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
                  >
                    <RotateCcw className="h-4 w-4" /> Retake Test Now
                  </Button>
                )}
              </div>

              {/* Performance Breakdown Box (Shows Exactly How Many Are Correct) */}
              <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Target className="h-4 w-4 text-indigo-500" /> Accuracy & Question Breakdown
                </h3>
                
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                    <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Correct Answers (Full Marks):
                    </span>
                    <span className="font-black text-emerald-800">{correctCount} / {totalQuestions}</span>
                  </div>

                  {partialCount > 0 && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-100">
                      <span className="font-semibold text-amber-900 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Partially Correct:
                      </span>
                      <span className="font-black text-amber-800">{partialCount}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50 border border-rose-100">
                    <span className="font-semibold text-rose-900 flex items-center gap-1.5">
                      <XCircle className="h-3.5 w-3.5 text-rose-600" /> Incorrect / Skipped:
                    </span>
                    <span className="font-black text-rose-800">{incorrectCount}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">Overall Accuracy Rate:</span>
                    <span className="font-bold text-slate-800">{accuracyRate}%</span>
                  </div>
                </div>
              </div>

              {/* Assessment Administration Details */}
              <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-3 text-xs">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-500" /> Assessment Details
                </h3>
                <div className="space-y-2.5">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Passing Benchmark</span>
                    <span className="font-bold text-slate-800">{passingScore}%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Submitted On</span>
                    <span className="font-bold text-slate-800">{new Date(result.submitted_at || result.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Proctoring Telemetry</span>
                    <span className={`font-bold ${strikes > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {strikes === 0 ? "Zero Infractions" : `${strikes} Strikes Logged`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Next Attempt Suggestions & Question Breakdown */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Suggestions for Next Attempt Card */}
              {suggestions.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-xs border border-indigo-200 bg-gradient-to-br from-white via-indigo-50/20 to-indigo-50/40 space-y-4">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                    <h3 className="text-sm font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-indigo-600" />
                      Examiner Guidance: Suggestions for Next Attempt
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                      Personalized Roadmap
                    </span>
                  </div>

                  <div className="space-y-3">
                    {suggestions.map((s, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-white border border-indigo-100 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-indigo-900 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
                            {s.title}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {s.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed pl-3">
                          {s.advice}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete Question & Solution Breakdown */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-slate-200 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-emerald-600"/> Question-by-Question Response Audit ({totalQuestions} Questions)
                  </h2>
                  <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    Pre-Marked Official Solutions
                  </span>
                </div>
                
                {questionsList.length > 0 ? (
                  <div className="space-y-4">
                    {questionsList.map((qItem: any, i: number) => {
                      const answerRow = answersList.find((a: any) => a.question_id === (qItem.question_id || qItem.id));
                      const isCorrect = qItem.is_correct ?? (answerRow ? (Number(answerRow.ai_score) >= (qItem.max_points || 10)) : false);
                      const pts = qItem.score ?? answerRow?.ai_score ?? 0;
                      const maxPts = qItem.max_points || 10;
                      const isPartial = pts > 0 && pts < maxPts;
                      const candidateAns = qItem.intern_answer || answerRow?.selected_option || answerRow?.subjective_answer || "(Skipped)";

                      let displayAns = candidateAns;
                      if (typeof candidateAns === "object" && candidateAns !== null) {
                        displayAns = candidateAns.text ? `[${candidateAns.id || ''}] ${candidateAns.text}` : (candidateAns.id || JSON.stringify(candidateAns));
                      }

                      return (
                        <div key={qItem.id || i} className={`p-5 rounded-2xl border text-sm space-y-3 transition-all ${
                          isCorrect 
                            ? "bg-emerald-50/40 border-emerald-200" 
                            : isPartial 
                            ? "bg-amber-50/40 border-amber-200" 
                            : "bg-slate-50/70 border-slate-200"
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono font-bold text-slate-900 bg-slate-200 px-2.5 py-1 rounded-md text-xs">
                                Q{i + 1}
                              </span>
                              <span className="font-bold uppercase tracking-wider text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                                {(qItem.question_type || "mcq").toUpperCase().replace("_", " ")}
                              </span>
                            </div>
                            <span className={`font-black px-3 py-1 rounded-full text-xs ${
                              isCorrect 
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300" 
                                : isPartial 
                                ? "bg-amber-100 text-amber-800 border border-amber-300" 
                                : "bg-rose-100 text-rose-800 border border-rose-300"
                            }`}>
                              {pts} / {maxPts} Points Awarded
                            </span>
                          </div>

                          <div className="font-semibold text-slate-900 leading-relaxed whitespace-pre-wrap">
                            {qItem.question_text}
                          </div>

                          {/* Candidate Response vs Benchmark */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="p-3 bg-white border border-slate-200 rounded-xl">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Candidate Submitted Response:</span>
                              <div className={`font-mono text-xs font-semibold break-words ${isCorrect ? "text-emerald-700" : isPartial ? "text-amber-700" : "text-rose-700"}`}>
                                {String(displayAns)}
                              </div>
                            </div>

                            <div className="p-3 bg-white border border-emerald-200 rounded-xl">
                              <span className="text-[10px] uppercase font-bold text-emerald-600 block mb-1">Benchmark / Correct Answer:</span>
                              <div className="font-mono text-xs font-semibold text-slate-800 break-words">
                                {typeof qItem.correct_answer === "object" ? JSON.stringify(qItem.correct_answer) : String(qItem.correct_answer || "Refer to explanation")}
                              </div>
                            </div>
                          </div>

                          {/* Coding Automated Output Verification if applicable */}
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

                          {/* Feedback / Remarks */}
                          {(qItem.feedback || answerRow?.ai_feedback || qItem.explanation) && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                              <div className="font-bold text-emerald-900">Feedback / Remarks:</div>
                              <p className="text-emerald-800 leading-relaxed">
                                {qItem.feedback || answerRow?.ai_feedback || qItem.explanation}
                              </p>
                            </div>
                          )}
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
