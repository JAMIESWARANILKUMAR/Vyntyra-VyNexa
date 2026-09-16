
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getInternTestSessionFn, submitCbtExamFn } from "@/lib/cbt.functions";
import { useProctoringEnforcement } from "@/hooks/useProctoringEnforcement";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera, AlertTriangle, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cbt/$testId")({
  component: CbtExamInterface,
});

function CbtExamInterface() {
  const { testId } = Route.useParams();
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any>({});
  const [activeQ, setActiveQ] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  
  const getSessionFn = useServerFn(getInternTestSessionFn);
  const submitFn = useServerFn(submitCbtExamFn);

  useEffect(() => {
    getSessionFn({ testId }).then(res => {
      setTest(res.test);
      setQuestions(res.questions);
    });
  }, [testId]);

  const handleSubmit = async (isAuto = false) => {
    try {
      await submitFn({ testId, answers, proctoringLogs: logs });
      toast.success(isAuto ? "Test auto-submitted" : "Test submitted successfully");
      window.location.href = `/cbt/results/${testId}`; // simplified redirect
    } catch (e) {
      toast.error("Failed to submit");
    }
  };

  const { requestFullscreen, strikes, logs } = useProctoringEnforcement(() => {
    handleSubmit(true);
  });

  if (!test) return <div>Loading...</div>;

  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-8">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-lg w-full text-center">
          <ShieldCheck className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">{test.title}</h1>
          <p className="text-slate-600 mb-6">{test.description}</p>
          <div className="bg-rose-50 text-rose-700 p-4 rounded-lg mb-6 text-sm text-left">
            <h3 className="font-bold flex items-center gap-2 mb-2"><AlertTriangle className="h-4 w-4"/> Proctoring Rules</h3>
            <ul className="list-disc pl-5">
              <li>Test runs in Fullscreen mode. Exiting is a violation.</li>
              <li>Switching tabs will result in a strike.</li>
              <li>2 strikes = automatic termination and failure.</li>
            </ul>
          </div>
          <Button onClick={() => { requestFullscreen(); setHasStarted(true); }} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-lg">
            Accept & Begin Test
          </Button>
        </div>
      </div>
    );
  }

  const q = questions[activeQ];

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-slate-300 p-4 flex flex-col">
        <div className="flex items-center gap-2 text-rose-500 font-bold mb-6 animate-pulse">
          <div className="h-3 w-3 rounded-full bg-rose-500" /> REC
        </div>
        <div className="mb-8">
          <h3 className="font-bold text-white mb-2">Questions Palette</h3>
          <div className="grid grid-cols-4 gap-2">
            {questions.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setActiveQ(i)}
                className={`h-10 rounded-md font-bold ${activeQ === i ? "border-2 border-emerald-500" : ""} ${answers[questions[i].id] ? "bg-emerald-600 text-white" : "bg-slate-800"}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-auto space-y-4">
          <div className="text-rose-400 text-sm font-bold">Strikes: {strikes}/2</div>
          <Button onClick={() => handleSubmit(false)} className="w-full bg-emerald-600">Submit Final Exam</Button>
        </div>
      </div>
      
      {/* Main Panel */}
      <div className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Question {activeQ + 1}</h2>
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6">
          <p className="text-lg">{q?.question_text}</p>
        </div>
        
        {q?.question_type === "mcq" && q.options && (
          <div className="space-y-3">
            {q.options.map((opt: any) => (
              <label key={opt.id} className="flex items-center gap-3 p-4 border rounded-lg hover:bg-slate-50 cursor-pointer">
                <input 
                  type="radio" 
                  name={q.id} 
                  checked={answers[q.id]?.id === opt.id}
                  onChange={() => setAnswers({...answers, [q.id]: { id: opt.id }})} 
                  className="h-5 w-5"
                />
                <span>{opt.text}</span>
              </label>
            ))}
          </div>
        )}
        
        {(q?.question_type === "long_answer" || q?.question_type === "coding") && (
          <textarea 
            className="w-full h-64 p-4 border border-slate-300 rounded-lg font-mono"
            placeholder={q?.question_type === "coding" ? "Write your code here..." : "Type your answer..."}
            value={answers[q.id] || ""}
            onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
          />
        )}
      </div>
    </div>
  );
}

