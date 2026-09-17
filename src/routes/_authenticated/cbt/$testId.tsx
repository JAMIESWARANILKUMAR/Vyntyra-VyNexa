import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getInternTestSessionFn, submitCbtExamFn } from "@/lib/cbt.functions";
import { useProctoringEnforcement } from "@/hooks/useProctoringEnforcement";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera, AlertTriangle, ShieldCheck, User, VideoOff, CheckCircle2, Info, ChevronRight, ChevronLeft, Flag, BrainCircuit } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cbt/$testId")({
  component: CbtExamInterface,
});

function CbtExamInterface() {
  const { testId } = Route.useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any>({});
  const [activeQ, setActiveQ] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [ipAddress, setIpAddress] = useState("Fetching IP...");
  
  const getSessionFn = useServerFn(getInternTestSessionFn);
  const submitFn = useServerFn(submitCbtExamFn);

  useEffect(() => {
    fetch("https://api.ipify.org?format=json").then(r => r.json()).then(data => setIpAddress(data.ip)).catch(() => setIpAddress("Unknown"));

    // LocalStorage Autosave Restoration
    const saved = localStorage.getItem(`cbt_autosave_${testId}`);
    if (saved) {
      try { setAnswers(JSON.parse(saved)); } catch (e) {}
    }

    if (testId === "demo") {
      setTest({ title: "VyNexa Portal Familiarization Demo", description: "This is a 5-question demo to familiarize yourself with the VyNexa portal CBT engine.", time_limit_minutes: 10 });
      setQuestions([
        { id: "demo-q1", question_type: "mcq", question_text: "What is the primary color of the VyNexa dashboard theme?", options: [{id: "opt1", text: "Emerald"}, {id: "opt2", text: "Crimson"}, {id: "opt3", text: "Indigo"}] },
        { id: "demo-q2", question_type: "mcq", question_text: "Where can you find the AI CBT Exams tab?", options: [{id: "opt4", text: "Connect & Support"}, {id: "opt5", text: "My Profile"}, {id: "opt6", text: "Settings"}] },
        { id: "demo-q3", question_type: "long_answer", question_text: "Describe the purpose of the Daily Standup log in a few words." },
        { id: "demo-q4", question_type: "mcq", question_text: "What happens if you switch tabs during a proctored exam?", options: [{id: "opt7", text: "You get a strike (2 strikes = fail)"}, {id: "opt8", text: "Nothing"}, {id: "opt9", text: "You earn bonus points"}] },
        { id: "demo-q5", question_type: "coding", question_text: "Write a simple function that returns 'VyNexa'." }
      ]);
      setTimeLeft(10 * 60);
      return;
    }

    getSessionFn({ data: { testId } }).then(res => {
      setTest(res.test);
      setQuestions(res.questions);
      setTimeLeft((res.test.time_limit_minutes || 30) * 60);
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

  // Timer Countdown
  useEffect(() => {
    if (!hasStarted || timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => (prev ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [hasStarted, timeLeft]);

  const handleSubmit = async (isAuto = false) => {
    localStorage.removeItem(`cbt_autosave_${testId}`); // clear autosave
    if (testId === "demo") {
      toast.success("Practice Demo Completed!");
      navigate({ to: "/intern" });
      return;
    }
    try {
      await submitFn({ data: { testId, answers, proctoringLogs: logs } });
      toast.success(isAuto ? "Time is up! Test auto-submitted" : "Test submitted successfully");
      navigate({ to: "/cbt/results/$testId", params: { testId } });
    } catch (e) {
      toast.error("Failed to submit");
    }
  };

  const { requestFullscreen, strikes, logs, stream } = useProctoringEnforcement(hasStarted, () => {
    handleSubmit(true);
  });

  const setVideoRef = (node: HTMLVideoElement | null) => {
    if (node && stream) {
      node.srcObject = stream;
    }
  };

  if (!test) return <div className="flex h-screen items-center justify-center text-slate-500 font-sans">Loading Secure Environment...</div>;

  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-8 font-sans relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
        <div className="bg-white p-12 rounded-[2rem] shadow-2xl max-w-2xl w-full text-center border border-slate-200/50 relative overflow-hidden z-10">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
          <div className="mx-auto mb-6 bg-emerald-500 p-4 rounded-3xl w-24 h-24 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <BrainCircuit className="h-14 w-14 text-white" />
          </div>
          <h1 className="text-4xl font-black mb-3 text-slate-900 tracking-tight">{test.title}</h1>
          <p className="text-slate-500 mb-8 text-lg font-medium">{test.description}</p>
          
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 text-left shadow-inner">
            <h3 className="font-bold flex items-center gap-2 mb-4 text-slate-800 text-lg">
              <AlertTriangle className="h-5 w-5 text-amber-500"/> Pre-Exam Checklist & Rules
            </h3>
            <div className="grid grid-cols-2 gap-8 text-sm">
              <ul className="space-y-3 font-medium text-slate-600">
                <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> <strong>Fullscreen Required:</strong> You cannot exit fullscreen mode.</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> <strong>Webcam Monitoring:</strong> Live video is recorded and analyzed.</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> <strong>No Tab Switching:</strong> (Alt+Tab) or losing window focus is tracked.</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> <strong>Clipboard Blocked:</strong> Copy, Paste, and Right-click are disabled.</li>
              </ul>
              <ul className="space-y-3 font-medium text-slate-600 border-l border-slate-200 pl-8">
                <li className="flex items-start gap-3"><span className="text-slate-400 font-mono">Time Limit:</span> <strong className="text-slate-900">{test.time_limit_minutes || 30} Minutes</strong></li>
                <li className="flex items-start gap-3"><span className="text-slate-400 font-mono">Passing Criteria:</span> <strong className="text-slate-900">{test.passing_score || 60}% Minimum</strong></li>
                <li className="flex items-start gap-3"><span className="text-slate-400 font-mono">Total Questions:</span> <strong className="text-slate-900">{questions.length} Modules</strong></li>
                <li className="flex items-start gap-3"><span className="text-slate-400 font-mono">Your Network IP:</span> <strong className="text-slate-900 font-mono">{ipAddress}</strong></li>
              </ul>
            </div>
            <div className="mt-6 bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-800 font-bold flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-rose-600 shrink-0" />
              <span>WARNING: Any 2 violations will result in immediate auto-termination and test failure.</span>
            </div>
          </div>
          <Button onClick={async () => { await requestFullscreen(); setHasStarted(true); }} className="w-full h-16 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-xl font-bold rounded-2xl shadow-xl text-white border border-slate-700 transition-transform active:scale-[0.98]">
            Grant Permissions & Begin Exam
          </Button>
        </div>
      </div>
    );
  }

  const q = questions[activeQ];
  const mins = Math.floor((timeLeft || 0) / 60);
  const secs = (timeLeft || 0) % 60;

  return (
    <div className="flex h-screen bg-slate-50 font-sans select-none overflow-hidden">
      
      {/* Left Sidebar (Proctoring & Progress Panel) */}
      <div className="w-[340px] bg-slate-900 text-slate-300 flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.15)] z-20 relative">
        
        {/* Header Branding */}
        <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="font-black text-xl text-white tracking-wider flex items-center gap-3">
            <div className="bg-emerald-500 p-1.5 rounded-lg">
              <BrainCircuit className="h-5 w-5 text-slate-950" />
            </div>
            <span>Vyntyra<span className="text-emerald-500">CBT</span></span>
          </div>
        </div>

        <div className="p-6 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
          
          {/* Live Video Feed */}
          <div className="relative bg-black rounded-2xl overflow-hidden mb-8 border border-slate-700 aspect-video flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)] group">
            {stream ? (
              <video ref={setVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror scale-[1.02]" />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-600 gap-2">
                <VideoOff className="h-8 w-8" />
                <span className="text-xs font-bold uppercase tracking-widest">Feed Lost</span>
              </div>
            )}
            <div className="absolute bottom-3 right-3 text-white/50 text-[9px] font-mono font-bold uppercase tracking-widest bg-black/50 px-2 py-1 rounded">IP: {ipAddress}</div>
            <div className="absolute top-3 left-3 flex items-center gap-2 text-rose-500 font-bold text-[10px] uppercase tracking-widest bg-black/70 px-2 py-1 rounded backdrop-blur-md border border-rose-500/30">
              <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" /> Live Proctoring
            </div>
          </div>

          {/* Strikes Info */}
          <div className="mb-8 bg-slate-950 rounded-2xl p-5 border border-slate-800 shadow-inner">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Session Integrity</div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">Warning Strikes</span>
              <span className={`font-black text-2xl ${strikes > 0 ? "text-rose-500" : "text-emerald-500"}`}>{strikes} / 2</span>
            </div>
            {strikes > 0 && <div className="mt-3 text-xs text-rose-400 font-medium bg-rose-950/50 p-3 rounded-lg border border-rose-900/50">Violation detected. One more strike will terminate the exam.</div>}
          </div>

          {/* Palette Grid */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest">Question Palette</h3>
              <span className="text-emerald-400 text-xs font-mono font-bold bg-emerald-950/30 px-3 py-1 rounded border border-emerald-900/50">
                {Object.keys(answers).length} / {questions.length}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {questions.map((_, i) => {
                const isAns = answers[questions[i].id];
                const isActive = activeQ === i;
                return (
                  <button 
                    key={i} 
                    onClick={() => setActiveQ(i)}
                    className={`h-12 rounded-xl font-bold text-sm transition-all shadow-sm ${
                      isActive ? "bg-white text-slate-900 scale-[1.15] shadow-lg z-10" : 
                      isAns ? "bg-emerald-600 text-white hover:bg-emerald-500 border border-emerald-500" : 
                      "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Submit Section */}
        <div className="p-6 border-t border-slate-800 bg-slate-950">
          <Button onClick={() => {
            if(window.confirm("Are you sure you want to submit the exam? You cannot undo this action.")) {
              handleSubmit(false);
            }
          }} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg h-14 rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            End Exam & Submit
          </Button>
        </div>
      </div>
      
      {/* Right Main Panel (Active Question Area) */}
      <div className="flex-1 flex flex-col bg-slate-50 relative">
        
        
        {/* Diagonal Transparent Watermark */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden z-0 opacity-[0.03]">
          <h1 className="text-[130px] font-black text-slate-900 -rotate-45 whitespace-nowrap select-none">
            Vyntyra Consultancy Services
          </h1>
        </div>

        {/* Top Header */}
        <div className="h-24 bg-white border-b border-slate-200 flex items-center justify-between px-10 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border border-indigo-100">
              {q?.question_type.replace("_", " ")}
            </div>
            <h2 className="text-2xl font-black text-slate-800">Question {activeQ + 1}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Time Remaining</div>
            <div className={`font-mono text-3xl font-black ${ (timeLeft || 0) < 300 ? "text-rose-600 animate-pulse" : "text-slate-800" }`}>
              {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 overflow-y-auto p-12 pb-36 custom-scrollbar relative z-10">
          <div className="max-w-4xl mx-auto">
            
            <div className="mb-10">
              <h3 className="text-[1.7rem] text-slate-900 font-medium leading-relaxed whitespace-pre-wrap">{q?.question_text}</h3>
            </div>
            
            {/* Answer Controls */}
            <div>
              {q?.question_type === "mcq" && q.options && (
                <div className="space-y-4">
                  {q.options.map((opt: any) => {
                    const checked = answers[q.id]?.id === opt.id;
                    return (
                      <label key={opt.id} onClick={() => setAnswers({...answers, [q.id]: opt})} className={`group flex items-center gap-5 p-6 rounded-2xl cursor-pointer transition-all border-2 ${
                        checked 
                          ? "border-emerald-500 bg-emerald-50/50 shadow-[0_4px_20px_rgba(16,185,129,0.15)] scale-[1.01]" 
                          : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50 shadow-sm"
                      }`}>
                        <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          checked ? "border-emerald-500" : "border-slate-300 group-hover:border-emerald-400"
                        }`}>
                          {checked && <div className="h-4 w-4 rounded-full bg-emerald-500 shadow-sm" />}
                        </div>
                        <span className={`text-xl ${checked ? "text-emerald-950 font-bold" : "text-slate-700 font-medium"}`}>{opt.text}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              
              {q?.question_type === "coding" && (
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
                  <div className="bg-slate-900 text-slate-400 px-5 py-3 text-xs font-mono font-bold uppercase tracking-widest flex justify-between border-b border-slate-800">
                    <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-rose-500"></div><div className="h-2 w-2 rounded-full bg-amber-500"></div><div className="h-2 w-2 rounded-full bg-emerald-500"></div></span>
                    <span>JavaScript/TypeScript</span>
                  </div>
                  <textarea 
                    className="w-full h-[500px] p-8 bg-[#0d1117] text-[#c9d1d9] font-mono text-[15px] leading-relaxed outline-none resize-none"
                    placeholder="// Write your optimized solution here..."
                    value={answers[q.id] || ""}
                    onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
                    spellCheck={false}
                  />
                </div>
              )}

              {q?.question_type === "long_answer" && (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all">
                  <textarea 
                    className="w-full h-[450px] p-10 font-sans text-xl leading-relaxed outline-none resize-none text-slate-800 placeholder:text-slate-300"
                    placeholder="Type your comprehensive analysis here..."
                    value={answers[q.id] || ""}
                    onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="absolute bottom-0 left-0 w-full h-28 bg-white/90 backdrop-blur-lg border-t border-slate-200 flex items-center justify-between px-12 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <Button 
            variant="outline" 
            size="lg"
            disabled={activeQ === 0} 
            onClick={() => setActiveQ(prev => prev - 1)}
            className="font-bold border-slate-200 text-slate-600 w-40 h-14 rounded-xl hover:bg-slate-50 text-lg"
          >
            <ChevronLeft className="h-6 w-6 mr-2" /> Previous
          </Button>
          
          <div className="flex items-center gap-3 text-slate-500 font-bold text-sm bg-slate-100/80 px-6 py-3 rounded-full border border-slate-200/50">
            <Info className="h-5 w-5 text-indigo-500" /> Autosaving encrypted responses...
          </div>
          
          <Button 
            size="lg"
            onClick={() => {
              if (activeQ < questions.length - 1) setActiveQ(prev => prev + 1);
            }}
            disabled={activeQ === questions.length - 1}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold w-40 h-14 rounded-xl shadow-xl shadow-slate-900/20 text-lg"
          >
            Next <ChevronRight className="h-6 w-6 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
