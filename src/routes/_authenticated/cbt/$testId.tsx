import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getInternTestSessionFn, submitCbtExamFn } from "@/lib/cbt.functions";
import { useProctoringEnforcement } from "@/hooks/useProctoringEnforcement";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertTriangle, ShieldCheck, VideoOff, CheckCircle2, Info, ChevronRight, ChevronLeft } from "lucide-react";

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

    const saved = localStorage.getItem(`cbt_autosave_${testId}`);
    if (saved) {
      try { setAnswers(JSON.parse(saved)); } catch (e) {}
    }

    if (testId === "demo") {
      setTest({ title: "VyNexa Portal Familiarization Demo", description: "This is a 5-question demo to familiarize yourself with the VyNexa portal CBT engine.", time_limit_minutes: 10, passing_score: 80 });
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

  useEffect(() => {
    if (!hasStarted) return;
    const interval = setInterval(() => {
      localStorage.setItem(`cbt_autosave_${testId}`, JSON.stringify(answers));
    }, 5000);
    return () => clearInterval(interval);
  }, [answers, hasStarted, testId]);

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
    localStorage.removeItem(`cbt_autosave_${testId}`); 
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

  const ambientMesh = (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute -top-32 -left-32 w-[700px] h-[700px] bg-emerald-300/20 rounded-full blur-[160px]" />
      <div className="absolute top-1/3 -right-32 w-[700px] h-[700px] bg-emerald-300/20 rounded-full blur-[160px]" />
      <div className="absolute -bottom-40 left-1/4 w-[800px] h-[800px] bg-rose-200/20 rounded-full blur-[180px]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b9810a_1px,transparent_1px),linear-gradient(to_bottom,#10b9810a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
    </div>
  );

  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-white text-slate-900 font-sans relative overflow-hidden">
        {ambientMesh}
        <div className="bg-white/80 backdrop-blur-2xl p-12 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] max-w-2xl w-full text-center border border-emerald-100 relative overflow-hidden z-10">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
          
          <div className="mx-auto mb-6 bg-white p-4 rounded-3xl w-24 h-24 flex items-center justify-center shadow-lg shadow-emerald-500/10 border border-slate-100">
            <img src="/icon-512.png" alt="Vyntyra" className="h-16 w-16 drop-shadow-md rounded-xl" />
          </div>
          
          <h1 className="text-4xl font-black mb-3 text-slate-900 tracking-tight">{test.title}</h1>
          <p className="text-slate-500 mb-8 text-lg font-medium">{test.description}</p>
          
          <div className="bg-white/60 border border-slate-200/60 rounded-2xl p-8 mb-8 text-left shadow-sm">
            <h3 className="font-bold flex items-center gap-2 mb-6 text-slate-800 text-lg">
              <ShieldCheck className="h-6 w-6 text-emerald-500"/> Pre-Exam Checklist & Rules
            </h3>
            
            <div className="grid grid-cols-2 gap-8 text-sm">
              <ul className="space-y-4 font-medium text-slate-600">
                <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> <strong>Fullscreen Required:</strong> You cannot exit fullscreen mode.</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> <strong>Webcam Monitoring:</strong> Live video is recorded and analyzed.</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> <strong>No Tab Switching:</strong> (Alt+Tab) or losing window focus is tracked.</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> <strong>Clipboard Blocked:</strong> Copy, Paste, and Right-click are disabled.</li>
              </ul>
              <ul className="space-y-4 font-medium text-slate-600 border-l border-slate-200 pl-8">
                <li className="flex items-start gap-3"><span className="text-slate-400 font-mono">Time Limit:</span> <strong className="text-slate-900">{test.time_limit_minutes || 30} Minutes</strong></li>
                <li className="flex items-start gap-3"><span className="text-slate-400 font-mono">Passing Criteria:</span> <strong className="text-slate-900">{test.passing_score || 60}% Minimum</strong></li>
                <li className="flex items-start gap-3"><span className="text-slate-400 font-mono">Total Questions:</span> <strong className="text-slate-900">{questions.length} Modules</strong></li>
                <li className="flex items-start gap-3"><span className="text-slate-400 font-mono">Your Network IP:</span> <strong className="text-slate-900 font-mono">{ipAddress}</strong></li>
              </ul>
            </div>
            <div className="mt-8 bg-rose-50/80 border border-rose-200 p-4 rounded-xl text-rose-800 font-bold flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-rose-600 shrink-0" />
              <span>WARNING: Any 2 violations will result in immediate auto-termination and test failure.</span>
            </div>
          </div>
          <Button onClick={async () => { await requestFullscreen(); setHasStarted(true); }} className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-xl font-bold rounded-2xl shadow-xl text-white transition-transform active:scale-[0.98]">
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
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-white font-sans select-none overflow-hidden text-slate-900 relative">
      
      {ambientMesh}

      {/* Left Sidebar (Proctoring & Progress Panel) */}
      <div className="w-[320px] bg-white/60 backdrop-blur-2xl flex flex-col shadow-[10px_0_40px_rgba(16,185,129,0.04)] z-20 relative border-r border-emerald-100/50">
        
        {/* Header Branding */}
        <div className="p-6 border-b border-emerald-100/50 flex items-center justify-between z-30">
          <div className="font-black text-xl text-slate-900 tracking-wider flex items-center gap-3">
            <img src="/icon-512.png" alt="Vyntyra" className="h-8 w-8 rounded-lg shadow-sm" />
            <span>Vyntyra<span className="text-emerald-500">CBT</span></span>
          </div>
        </div>

        <div className="p-6 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
          
          {/* Live Video Feed */}
          <div className="relative bg-slate-900 rounded-2xl overflow-hidden mb-8 border-[6px] border-white shadow-[0_10px_30px_rgba(0,0,0,0.1)] aspect-video flex items-center justify-center group">
            {stream ? (
              <video ref={setVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror scale-[1.02]" />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                <VideoOff className="h-8 w-8" />
                <span className="text-xs font-bold uppercase tracking-widest">Feed Lost</span>
              </div>
            )}
            <div className="absolute bottom-3 right-3 text-white/50 text-[9px] font-mono font-bold uppercase tracking-widest bg-black/50 px-2 py-1 rounded">IP: {ipAddress}</div>
            <div className="absolute top-3 left-3 flex items-center gap-2 text-rose-500 font-bold text-[10px] uppercase tracking-widest bg-white/90 px-2 py-1 rounded-full backdrop-blur-md shadow-sm">
              <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" /> Live
            </div>
          </div>

          {/* Strikes Info */}
          <div className="mb-8 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-2 font-bold">Session Integrity</div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">Warning Strikes</span>
              <span className={`font-black text-2xl ${strikes > 0 ? "text-rose-500" : "text-emerald-500"}`}>{strikes} / 2</span>
            </div>
            {strikes > 0 && <div className="mt-3 text-xs text-rose-600 font-bold bg-rose-50 p-3 rounded-lg border border-rose-100">Violation detected. One more strike will terminate the exam.</div>}
          </div>

          {/* Palette Grid */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest">Question Palette</h3>
              <span className="text-emerald-600 text-xs font-mono font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {Object.keys(answers).length} / {questions.length}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((_, i) => {
                const isAns = answers[questions[i].id];
                const isActive = activeQ === i;
                return (
                  <button 
                    key={i} 
                    onClick={() => setActiveQ(i)}
                    className={`h-12 rounded-xl font-bold text-sm transition-all shadow-sm border ${
                      isActive ? "bg-slate-900 text-white scale-[1.1] shadow-lg z-10 border-slate-900" : 
                      isAns ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-300" : 
                      "bg-white text-slate-500 border-slate-200 hover:border-emerald-200 hover:text-emerald-600"
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
        <div className="p-6 border-t border-emerald-100/50 bg-white/40">
          <Button onClick={() => {
            if(window.confirm("Are you sure you want to submit the exam? You cannot undo this action.")) {
              handleSubmit(false);
            }
          }} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-lg h-14 rounded-2xl shadow-xl transition-transform active:scale-[0.98]">
            End Exam & Submit
          </Button>
        </div>
      </div>
      
      {/* Right Main Panel (Active Question Area) */}
      <div className="flex-1 flex flex-col relative z-10 bg-transparent">
        
        {/* Diagonal Transparent Watermark */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden z-0 opacity-[0.02]">
          <h1 className="text-[140px] font-black text-slate-900 -rotate-45 whitespace-nowrap select-none">
            Vyntyra Consultancy Services
          </h1>
        </div>

        {/* Top Header */}
        <div className="h-24 bg-white/40 backdrop-blur-xl border-b border-emerald-100/50 flex items-center justify-between px-12 z-20">
          <div className="flex items-center gap-5">
            <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-200">
              {q?.question_type.replace("_", " ")}
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Question {activeQ + 1}</h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50/80 px-4 py-2 rounded-full border border-emerald-200 shadow-sm backdrop-blur-sm">
              <Info className="h-4 w-4 text-emerald-500" /> Autosaving
            </div>
            <div className="flex flex-col items-end">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Time Remaining</div>
              <div className={`font-mono text-3xl font-black leading-none mt-1 ${ (timeLeft || 0) < 300 ? "text-rose-600 animate-pulse" : "text-slate-900" }`}>
                {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
              </div>
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 overflow-y-auto p-16 pb-20 custom-scrollbar relative z-10">
          <div className="max-w-4xl mx-auto">
            
            <div className="mb-14 bg-white/60 backdrop-blur-md p-8 rounded-3xl border border-slate-200/60 shadow-sm">
              <h3 className="text-[1.6rem] text-slate-900 font-medium leading-relaxed whitespace-pre-wrap">{q?.question_text}</h3>
            </div>
            
            {/* Answer Controls */}
            <div>
              {q?.question_type === "mcq" && q.options && (
                <div className="space-y-4">
                  {q.options.map((opt: any) => {
                    const checked = answers[q.id]?.id === opt.id;
                    return (
                      <label key={opt.id} onClick={() => setAnswers({...answers, [q.id]: opt})} className={`group flex items-center gap-5 p-6 rounded-2xl cursor-pointer transition-all border shadow-sm ${
                        checked 
                          ? "border-emerald-500 bg-white ring-2 ring-emerald-500/20 shadow-md scale-[1.01]" 
                          : "border-slate-200/80 bg-white/80 backdrop-blur-sm hover:border-emerald-300 hover:shadow-md hover:bg-white"
                      }`}>
                        <div className={`h-7 w-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          checked ? "border-emerald-500 bg-emerald-50" : "border-slate-300 group-hover:border-emerald-400 bg-white"
                        }`}>
                          {checked && <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm" />}
                        </div>
                        <span className={`text-xl ${checked ? "text-slate-900 font-bold" : "text-slate-700 font-medium"}`}>{opt.text}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              
              {q?.question_type === "coding" && (
                <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white">
                  <div className="bg-slate-100 text-slate-500 px-6 py-4 text-xs font-mono font-bold uppercase tracking-widest flex justify-between border-b border-slate-200">
                    <span className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-rose-400"></div><div className="h-3 w-3 rounded-full bg-amber-400"></div><div className="h-3 w-3 rounded-full bg-emerald-400"></div></span>
                    <span>JavaScript/TypeScript</span>
                  </div>
                  <textarea 
                    className="w-full h-[500px] p-8 bg-slate-900 text-emerald-400 font-mono text-[15px] leading-relaxed outline-none resize-none selection:bg-emerald-500/30"
                    placeholder="// Write your optimized solution here..."
                    value={answers[q.id] || ""}
                    onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
                    spellCheck={false}
                  />
                </div>
              )}

              {q?.question_type === "long_answer" && (
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-slate-200 overflow-hidden focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all">
                  <textarea 
                    className="w-full h-[450px] p-10 font-sans text-xl leading-relaxed outline-none resize-none text-slate-800 placeholder:text-slate-300 bg-transparent"
                    placeholder="Type your comprehensive analysis here..."
                    value={answers[q.id] || ""}
                    onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
                  />
                </div>
              )}
            </div>

            {/* Inline Navigation (Footer Replaced) */}
            <div className="mt-16 pt-10 border-t border-emerald-100/50 flex items-center justify-between">
              <Button 
                variant="outline" 
                size="lg"
                disabled={activeQ === 0} 
                onClick={() => setActiveQ(prev => prev - 1)}
                className="font-bold border-slate-200 text-slate-700 bg-white w-40 h-14 rounded-2xl hover:bg-slate-50 hover:text-slate-900 text-lg shadow-sm transition-all"
              >
                <ChevronLeft className="h-6 w-6 mr-2" /> Previous
              </Button>
              <Button 
                size="lg"
                onClick={() => {
                  if (activeQ < questions.length - 1) setActiveQ(prev => prev + 1);
                }}
                disabled={activeQ === questions.length - 1}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold w-40 h-14 rounded-2xl shadow-xl shadow-emerald-600/20 text-lg transition-all disabled:opacity-50 disabled:shadow-none"
              >
                Next <ChevronRight className="h-6 w-6 ml-2" />
              </Button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
