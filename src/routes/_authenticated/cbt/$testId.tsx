import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getInternTestSessionFn, submitCbtExamFn } from "@/lib/cbt.functions";
import { useProctoringEnforcement } from "@/hooks/useProctoringEnforcement";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertTriangle, ShieldCheck, VideoOff, CheckCircle2, ChevronRight, ChevronLeft, ShieldAlert, Monitor, AlertCircle } from "lucide-react";

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

  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 text-slate-900 font-sans relative overflow-hidden">
        <div className="bg-white p-10 shadow-lg max-w-3xl w-full border-t-8 border-slate-900 relative z-10 rounded-sm">
          
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200">
            <img src="/icon-512.png" alt="Vyntyra" className="h-12 w-12 rounded shadow-sm border border-slate-200" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">Vyntyra Secure Assessment</h1>
              <p className="text-slate-500 text-sm font-medium">Candidate Verification & Pre-Exam Setup</p>
            </div>
          </div>
          
          <h2 className="text-xl font-bold mb-2 text-slate-800">{test.title}</h2>
          <p className="text-slate-600 mb-8 text-sm">{test.description}</p>
          
          <div className="bg-slate-50 border border-slate-300 p-6 mb-8 text-left">
            <h3 className="font-bold flex items-center gap-2 mb-4 text-slate-800 uppercase text-xs tracking-wider">
              <ShieldAlert className="h-4 w-4 text-slate-700"/> Rules of Conduct
            </h3>
            
            <div className="grid grid-cols-2 gap-8 text-sm">
              <ul className="space-y-3 font-medium text-slate-700">
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> <strong>Fullscreen Enforced:</strong> Exiting triggers a violation.</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> <strong>Proctoring Active:</strong> Webcam is continuously monitored.</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> <strong>Focus Tracking:</strong> Alt+Tab or losing focus is recorded.</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> <strong>No Clipboard:</strong> Copy/Paste operations are blocked.</li>
              </ul>
              <ul className="space-y-3 font-medium text-slate-700 border-l border-slate-300 pl-6">
                <li className="flex items-center justify-between"><span className="text-slate-500">Duration:</span> <strong className="text-slate-900">{test.time_limit_minutes || 30} Minutes</strong></li>
                <li className="flex items-center justify-between"><span className="text-slate-500">Passing Criteria:</span> <strong className="text-slate-900">{test.passing_score || 60}%</strong></li>
                <li className="flex items-center justify-between"><span className="text-slate-500">Total Modules:</span> <strong className="text-slate-900">{questions.length}</strong></li>
                <li className="flex items-center justify-between"><span className="text-slate-500">Origin IP:</span> <strong className="text-slate-900 font-mono text-xs">{ipAddress}</strong></li>
              </ul>
            </div>
            <div className="mt-6 bg-red-50 border border-red-200 p-3 text-red-700 font-bold text-xs flex items-center gap-2 uppercase tracking-wide">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Maximum 1 warning. The 2nd violation automatically terminates the exam.
            </div>
          </div>
          <Button onClick={async () => { await requestFullscreen(); setHasStarted(true); }} className="w-full h-12 bg-slate-900 hover:bg-slate-800 font-bold text-white uppercase tracking-wider rounded-sm">
            Acknowledge & Start Exam
          </Button>
        </div>
      </div>
    );
  }

  const q = questions[activeQ];
  const mins = Math.floor((timeLeft || 0) / 60);
  const secs = (timeLeft || 0) % 60;

  return (
    <div className="flex flex-col h-screen bg-slate-200 font-sans select-none overflow-hidden text-slate-900">
      
      {/* Top Strict Header */}
      <div className="h-16 bg-slate-900 text-white flex items-center justify-between px-6 shadow-md z-30 shrink-0">
        <div className="flex items-center gap-4">
          <img src="/icon-512.png" alt="Vyntyra" className="h-8 w-8 rounded border border-slate-700" />
          <div>
            <h1 className="font-bold text-base uppercase tracking-wider leading-none">Vyntyra Secure Assessment</h1>
            <div className="text-[10px] text-slate-400 font-mono mt-1">CANDIDATE IP: {ipAddress}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 mb-0.5">Time Remaining</span>
            <div className={`font-mono text-xl font-bold leading-none ${ (timeLeft || 0) < 300 ? "text-red-500 animate-pulse" : "text-white" }`}>
              {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
            </div>
          </div>
          
          <Button 
            onClick={() => {
              if(window.confirm("Are you sure you want to finalize and submit the exam? This cannot be undone.")) {
                handleSubmit(false);
              }
            }} 
            variant="destructive"
            className="h-9 rounded-sm font-bold uppercase tracking-wider text-xs bg-red-600 hover:bg-red-700"
          >
            Submit Exam
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar (Proctoring & Progress Panel) */}
        <div className="w-[280px] bg-slate-50 flex flex-col shadow-inner z-20 border-r border-slate-300 shrink-0">
          
          <div className="p-4 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
            
            {/* Live Video Feed */}
            <div className="mb-6">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                <Monitor className="h-3 w-3" /> Proctoring Feed
              </div>
              <div className="relative bg-black rounded-sm overflow-hidden border border-slate-800 aspect-video flex items-center justify-center">
                {stream ? (
                  <video ref={setVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-600 gap-2">
                    <VideoOff className="h-6 w-6" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Feed Lost</span>
                  </div>
                )}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 text-red-500 font-bold text-[9px] uppercase tracking-widest bg-black/80 px-1.5 py-0.5 rounded-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> REC
                </div>
              </div>
            </div>

            {/* Strikes Info */}
            <div className="mb-6 bg-white p-3 border border-slate-200 rounded-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase">Violations</span>
                <span className={`font-black text-sm ${strikes > 0 ? "text-red-600" : "text-emerald-600"}`}>{strikes} / 2</span>
              </div>
              {strikes > 0 && <div className="mt-2 text-[10px] text-red-700 font-bold bg-red-50 p-2 border border-red-200 rounded-sm">Warning: 1 strike remaining.</div>}
            </div>

            {/* Palette Grid */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-slate-600 text-[10px] uppercase tracking-widest">Question Palette</h3>
                <span className="text-slate-500 text-[10px] font-mono font-bold">
                  {Object.keys(answers).length}/{questions.length} Answered
                </span>
              </div>
              
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, i) => {
                  const isAns = answers[questions[i].id];
                  const isActive = activeQ === i;
                  return (
                    <button 
                      key={i} 
                      onClick={() => setActiveQ(i)}
                      className={`h-10 rounded-sm font-bold text-xs transition-colors border ${
                        isActive ? "bg-slate-800 text-white border-slate-900" : 
                        isAns ? "bg-emerald-100 text-emerald-800 border-emerald-300" : 
                        "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-6 flex flex-col gap-2 text-[10px] text-slate-500 font-medium">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-800 border border-slate-900 rounded-sm"></div> Current Question</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-100 border border-emerald-300 rounded-sm"></div> Answered</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-white border border-slate-300 rounded-sm"></div> Not Answered</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Main Panel (Active Question Area) */}
        <div className="flex-1 flex flex-col relative z-10 bg-white">
          
          {/* Repeating Watermark Grid */}
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden flex flex-wrap gap-x-12 gap-y-16 opacity-[0.03] rotate-[-30deg] scale-150 justify-center items-center">
            {Array.from({ length: 200 }).map((_, i) => (
              <span key={i} className="text-2xl font-bold text-slate-900 whitespace-nowrap">Vyntyra Consultancy Services</span>
            ))}
          </div>

          {/* Top Header for Question */}
          <div className="bg-slate-50 border-b border-slate-200 py-3 px-8 z-20 flex justify-between items-center shrink-0">
            <h2 className="text-lg font-bold text-slate-800">Question {activeQ + 1}</h2>
            <div className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-slate-300">
              {q?.question_type.replace("_", " ")}
            </div>
          </div>

          {/* Question Content */}
          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative z-10">
            <div className="max-w-4xl">
              
              <div className="mb-10">
                <h3 className="text-xl text-slate-900 font-medium leading-relaxed whitespace-pre-wrap">{q?.question_text}</h3>
              </div>
              
              {/* Answer Controls */}
              <div>
                {q?.question_type === "mcq" && q.options && (
                  <div className="space-y-3">
                    {q.options.map((opt: any) => {
                      const checked = answers[q.id]?.id === opt.id;
                      return (
                        <label key={opt.id} onClick={() => setAnswers({...answers, [q.id]: opt})} className={`flex items-center gap-4 p-4 cursor-pointer transition-colors border rounded-sm ${
                          checked 
                            ? "border-emerald-500 bg-emerald-50/50" 
                            : "border-slate-300 bg-white hover:bg-slate-50"
                        }`}>
                          <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                            checked ? "border-emerald-600 bg-white" : "border-slate-400 bg-white"
                          }`}>
                            {checked && <div className="h-2 w-2 rounded-full bg-emerald-600" />}
                          </div>
                          <span className={`text-base ${checked ? "text-slate-900 font-semibold" : "text-slate-700"}`}>{opt.text}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                
                {q?.question_type === "coding" && (
                  <div className="rounded-sm overflow-hidden border border-slate-300 bg-white">
                    <div className="bg-slate-100 text-slate-600 px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest border-b border-slate-300">
                      JavaScript/TypeScript Editor
                    </div>
                    <textarea 
                      className="w-full h-[400px] p-6 bg-slate-900 text-slate-100 font-mono text-[14px] leading-relaxed outline-none resize-none"
                      placeholder="// Write your optimized solution here..."
                      value={answers[q.id] || ""}
                      onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
                      spellCheck={false}
                    />
                  </div>
                )}

                {q?.question_type === "long_answer" && (
                  <div className="bg-white rounded-sm border border-slate-300 overflow-hidden focus-within:border-slate-500 transition-colors">
                    <textarea 
                      className="w-full h-[350px] p-6 font-sans text-base leading-relaxed outline-none resize-none text-slate-800 placeholder:text-slate-400"
                      placeholder="Type your comprehensive response here..."
                      value={answers[q.id] || ""}
                      onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
                    />
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Inline Navigation (Strict Bottom Bar) */}
          <div className="bg-slate-100 border-t border-slate-300 p-4 flex items-center justify-between shrink-0 z-20">
            <Button 
              variant="outline" 
              disabled={activeQ === 0} 
              onClick={() => setActiveQ(prev => prev - 1)}
              className="font-bold border-slate-300 text-slate-700 bg-white rounded-sm hover:bg-slate-50 uppercase text-xs tracking-wider h-10 px-6"
            >
              <ChevronLeft className="h-4 w-4 mr-2" /> Previous
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => {
                const newAns = {...answers};
                delete newAns[q.id];
                setAnswers(newAns);
              }}
              className="font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200 uppercase text-[10px] tracking-wider rounded-sm h-8 px-4"
            >
              Clear Response
            </Button>

            <Button 
              onClick={() => {
                if (activeQ < questions.length - 1) setActiveQ(prev => prev + 1);
              }}
              disabled={activeQ === questions.length - 1}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-sm uppercase text-xs tracking-wider h-10 px-8 disabled:opacity-50"
            >
              Save & Next <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
