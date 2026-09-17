import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getInternTestSessionFn, submitCbtExamFn } from "@/lib/cbt.functions";
import { useProctoringEnforcement } from "@/hooks/useProctoringEnforcement";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera, AlertTriangle, ShieldCheck, User, VideoOff } from "lucide-react";

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
    // LocalStorage Autosave Restoration
    const saved = localStorage.getItem(`cbt_autosave_${testId}`);
    if (saved) {
      try { setAnswers(JSON.parse(saved)); } catch (e) {}
    }

    if (testId === "demo") {
      setTest({ title: "VyNexa Portal Familiarization Demo", description: "This is a 5-question demo to familiarize yourself with the VyNexa portal CBT engine." });
      setQuestions([
        { id: "demo-q1", question_type: "mcq", question_text: "What is the primary color of the VyNexa dashboard theme?", options: [{id: "opt1", text: "Emerald"}, {id: "opt2", text: "Crimson"}, {id: "opt3", text: "Indigo"}] },
        { id: "demo-q2", question_type: "mcq", question_text: "Where can you find the AI CBT Exams tab?", options: [{id: "opt4", text: "Connect & Support"}, {id: "opt5", text: "My Profile"}, {id: "opt6", text: "Settings"}] },
        { id: "demo-q3", question_type: "long_answer", question_text: "Describe the purpose of the Daily Standup log in a few words." },
        { id: "demo-q4", question_type: "mcq", question_text: "What happens if you switch tabs during a proctored exam?", options: [{id: "opt7", text: "You get a strike (2 strikes = fail)"}, {id: "opt8", text: "Nothing"}, {id: "opt9", text: "You earn bonus points"}] },
        { id: "demo-q5", question_type: "coding", question_text: "Write a simple function that returns \"VyNexa\"." }
      ]);
      return;
    }

    getSessionFn({ data: { testId } }).then(res => {
      setTest(res.test);
      setQuestions(res.questions);
    });
  }, [testId]);

  // LocalStorage Autosave Loop
  useEffect(() => {
    if (!hasStarted) return;
    const interval = setInterval(() => {
      localStorage.setItem(`cbt_autosave_${testId}`, JSON.stringify(answers));
    }, 5000);
    return () => clearInterval(interval);
  }, [answers, hasStarted, testId]);

  const handleSubmit = async (isAuto = false) => {
    localStorage.removeItem(`cbt_autosave_${testId}`); // clear autosave
    if (testId === "demo") {
      toast.success("Practice Demo Completed!");
      window.location.href = "/intern";
      return;
    }
    try {
      await submitFn({ data: { testId, answers, proctoringLogs: logs } });
      toast.success(isAuto ? "Test auto-submitted" : "Test submitted successfully");
      window.location.href = `/cbt/results/${testId}`;
    } catch (e) {
      toast.error("Failed to submit");
    }
  };

  const { requestFullscreen, strikes, logs, stream } = useProctoringEnforcement(hasStarted, () => {
    handleSubmit(true);
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!test) return <div className="flex h-screen items-center justify-center text-slate-500">Loading Exam Data...</div>;

  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-8">
        <div className="bg-white p-12 rounded-2xl shadow-2xl max-w-2xl w-full text-center border border-slate-200">
          <ShieldCheck className="h-20 w-20 text-emerald-500 mx-auto mb-6" />
          <h1 className="text-3xl font-black mb-3 text-slate-900">{test.title}</h1>
          <p className="text-slate-600 mb-8 text-lg">{test.description}</p>
          <div className="bg-rose-50 border border-rose-100 text-rose-800 p-6 rounded-xl mb-8 text-left shadow-sm">
            <h3 className="font-bold flex items-center gap-2 mb-3 text-rose-900"><AlertTriangle className="h-5 w-5"/> Strict Proctoring Rules Active</h3>
            <ul className="list-disc pl-5 space-y-2 font-medium">
              <li>Test runs in <strong>Fullscreen mode</strong>. Exiting is a violation.</li>
              <li>Switching tabs, losing window focus, or opening other apps will result in a strike.</li>
              <li>Copy, Paste, Cut, and Right-Click are <strong>disabled</strong>.</li>
              <li>Camera feed is actively monitored. <strong>2 strikes = automatic termination and failure.</strong></li>
            </ul>
          </div>
          <Button onClick={async () => { await requestFullscreen(); setHasStarted(true); }} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-xl font-bold rounded-xl shadow-lg shadow-emerald-600/30">
            Accept Rules & Begin Test
          </Button>
        </div>
      </div>
    );
  }

  const q = questions[activeQ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans select-none">
      {/* Left Sidebar (Proctoring & Progress Panel) */}
      <div className="w-72 bg-slate-950 text-slate-300 p-6 flex flex-col shadow-2xl z-10 border-r border-slate-800">
        
        {/* Profile Details */}
        <div className="flex items-center gap-3 mb-8 bg-slate-900 p-3 rounded-xl border border-slate-800">
          <div className="bg-slate-800 p-2 rounded-lg text-emerald-400">
            <User className="h-6 w-6" />
          </div>
          <div>
            <div className="text-white font-bold text-sm">Candidate</div>
            <div className="text-xs text-slate-400">Proctored Session</div>
          </div>
        </div>

        {/* Live Video Feed */}
        <div className="relative bg-black rounded-xl overflow-hidden mb-8 border border-slate-800 aspect-video flex items-center justify-center shadow-inner">
          {stream ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-600 gap-2">
              <VideoOff className="h-8 w-8" />
              <span className="text-xs font-bold">Camera Disabled</span>
            </div>
          )}
          <div className="absolute top-3 left-3 flex items-center gap-2 text-rose-500 font-bold text-xs bg-black/60 px-2 py-1 rounded-md backdrop-blur-sm border border-rose-500/30">
            <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" /> REC
          </div>
        </div>

        {/* Palette Grid */}
        <div className="mb-8">
          <h3 className="font-bold text-white mb-4 text-sm flex justify-between items-center">
            Questions Palette 
            <span className="text-emerald-400 text-xs font-mono">{Object.keys(answers).length}/{questions.length}</span>
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((_, i) => {
              const isAns = answers[questions[i].id];
              const isActive = activeQ === i;
              return (
                <button 
                  key={i} 
                  onClick={() => setActiveQ(i)}
                  className={`h-10 rounded-lg font-bold transition-all ${isActive ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-950 bg-slate-800 text-white" : isAns ? "bg-emerald-600/90 text-white hover:bg-emerald-500" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Strikes & Submit */}
        <div className="mt-auto space-y-4">
          <div className="bg-rose-950/30 border border-rose-900/50 p-4 rounded-xl text-center">
            <div className="text-rose-400 text-xs font-bold uppercase mb-1">Warning Strikes</div>
            <div className="text-rose-500 text-2xl font-black font-mono">{strikes} / 2</div>
          </div>
          <Button onClick={() => {
            if(window.confirm("Are you sure you want to submit the exam? You cannot undo this action.")) {
              handleSubmit(false);
            }
          }} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 rounded-xl">
            Submit Final Exam
          </Button>
        </div>
      </div>
      
      {/* Right Main Panel (Active Question Area) */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-8 bg-white shadow-sm z-10">
          <h2 className="text-xl font-bold text-slate-800">Question {activeQ + 1} of {questions.length}</h2>
          <div className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full text-sm font-bold border border-slate-200 uppercase">
            {q?.question_type.replace("_", " ")}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
            <p className="text-lg text-slate-800 font-medium whitespace-pre-wrap">{q?.question_text}</p>
          </div>
          
          {/* Answer Controls */}
          <div className="max-w-4xl">
            {q?.question_type === "mcq" && q.options && (
              <div className="space-y-3">
                {q.options.map((opt: any) => {
                  const checked = answers[q.id]?.id === opt.id;
                  return (
                    <label key={opt.id} className={`flex items-center gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all ${checked ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50"}`}>
                      <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${checked ? "border-emerald-500" : "border-slate-300"}`}>
                        {checked && <div className="h-3 w-3 rounded-full bg-emerald-500" />}
                      </div>
                      <span className={`text-lg ${checked ? "text-emerald-900 font-bold" : "text-slate-700 font-medium"}`}>{opt.text}</span>
                    </label>
                  );
                })}
              </div>
            )}
            
            {q?.question_type === "coding" && (
              <textarea 
                className="w-full h-80 p-6 border-2 border-slate-800 bg-slate-900 text-emerald-400 rounded-xl font-mono text-sm focus:ring-4 focus:ring-emerald-500/20 outline-none"
                placeholder="// Write your code here..."
                value={answers[q.id] || ""}
                onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
                spellCheck={false}
              />
            )}

            {q?.question_type === "long_answer" && (
              <textarea 
                className="w-full h-64 p-6 border-2 border-slate-200 rounded-xl font-sans text-lg focus:ring-4 focus:ring-emerald-500/20 outline-none resize-none bg-white"
                placeholder="Type your detailed answer here..."
                value={answers[q.id] || ""}
                onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
              />
            )}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="h-20 border-t border-slate-200 bg-white flex items-center justify-between px-8 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <Button 
            variant="outline" 
            size="lg"
            disabled={activeQ === 0} 
            onClick={() => setActiveQ(prev => prev - 1)}
            className="font-bold border-slate-300 text-slate-700 w-32"
          >
            Previous
          </Button>
          <div className="text-slate-400 font-medium text-sm">Autosaving locally...</div>
          <Button 
            size="lg"
            onClick={() => {
              if (activeQ < questions.length - 1) setActiveQ(prev => prev + 1);
            }}
            disabled={activeQ === questions.length - 1}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold w-32"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
