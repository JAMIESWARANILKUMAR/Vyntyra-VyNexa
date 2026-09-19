import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getInternTestSessionFn, submitCbtExamFn } from "@/lib/cbt.functions";
import { useProctoringEnforcement } from "@/hooks/useProctoringEnforcement";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertTriangle, ShieldCheck, VideoOff, CheckCircle2, ChevronRight, ChevronLeft, ShieldAlert, AlertCircle, RefreshCcw, MonitorSmartphone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cbt/$testId")({
  component: CbtExamInterface,
});

function CbtExamInterface() {
  const { testId } = Route.useParams();
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkSize = () => setIsDesktop(window.innerWidth >= 1024);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any>({});
  const [activeQ, setActiveQ] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [ipAddress, setIpAddress] = useState("Fetching IP...");
  
  // Post-test state
  const [examStatus, setExamStatus] = useState<"not_started" | "running" | "terminating" | "submitting">("not_started");
  const [postTestCountdown, setPostTestCountdown] = useState(120);
  const [terminationReason, setTerminationReason] = useState("");
  const [calculatedScore, setCalculatedScore] = useState(0);

  // WebRTC / Live Streaming hook
  const rtcConnection = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (examStatus !== "running" || !test) return;

    const channelName = `cbt-exam-${testId}-${test.internId || 'UNKNOWN'}`;
    const channel = supabase.channel(channelName, { config: { presence: { key: test.internId } } });

    channel
      .on('presence', { event: 'sync' }, () => {
        console.log('Presence sync', channel.presenceState());
      })
      .on('broadcast', { event: 'request_stream' }, async () => {
        try {
          if (rtcConnection.current) {
            rtcConnection.current.close();
          }
          const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
          rtcConnection.current = pc;

          // Get media (assume permissions granted by proctoring)
          const webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch(() => null);
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true }).catch(() => null);

          if (webcamStream) webcamStream.getTracks().forEach(track => pc.addTrack(track, webcamStream));
          if (screenStream) screenStream.getTracks().forEach(track => pc.addTrack(track, screenStream));

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              channel.send({ type: 'broadcast', event: 'ice_candidate', payload: { candidate: event.candidate, target: 'admin' } });
            }
          };

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          channel.send({ type: 'broadcast', event: 'sdp_offer', payload: { offer } });
        } catch (err) {
          console.error("WebRTC Error:", err);
        }
      })
      .on('broadcast', { event: 'sdp_answer' }, async ({ payload }) => {
        if (rtcConnection.current) {
          await rtcConnection.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
        }
      })
      .on('broadcast', { event: 'ice_candidate' }, async ({ payload }) => {
        if (payload.target === 'intern' && rtcConnection.current) {
          await rtcConnection.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
           // Track in specific channel for WebRTC signaling
           await channel.track({ testId, internId: test.internId, startedAt: Date.now(), ip: ipAddress });
        }
      });

    const globalChannel = supabase.channel('cbt-active-exams', { config: { presence: { key: test.internId } } });
    globalChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
         await globalChannel.track({ testId, internId: test.internId, startedAt: Date.now(), ip: ipAddress, status: 'running' });
      }
    });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(globalChannel);
      if (rtcConnection.current) {
        rtcConnection.current.close();
        rtcConnection.current = null;
      }
    };
  }, [examStatus, test, testId, ipAddress]);

  const getSessionFn = useServerFn(getInternTestSessionFn);
  const submitFn = useServerFn(submitCbtExamFn);

  useEffect(() => {
    fetch("https://api.ipify.org?format=json").then(r => r.json()).then(data => setIpAddress(data.ip)).catch(() => setIpAddress("Unknown"));

    const saved = localStorage.getItem(`cbt_autosave_${testId}`);
    if (saved) {
      try { setAnswers(JSON.parse(saved)); } catch (e) {}
    }

    if (testId === "demo") {
      setTest({ title: "VyNexa Portal Familiarization Demo", description: "This is a 5-question demo to familiarize yourself with the VyNexa portal CBT engine.", time_limit_minutes: 10, passing_score: 80, internId: "INT-8492" });
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
      setTest({...res.test, internId: "INT-4829"}); // fallback if not in test
      setQuestions(res.questions);
      setTimeLeft(((res.test as any).time_limit_minutes || 30) * 60);
    });
  }, [testId]);

  useEffect(() => {
    if (examStatus !== "running") return;
    const interval = setInterval(() => {
      localStorage.setItem(`cbt_autosave_${testId}`, JSON.stringify(answers));
    }, 5000);
    return () => clearInterval(interval);
  }, [answers, examStatus, testId]);

  useEffect(() => {
    if (examStatus !== "running" || timeLeft === null) return;
    if (timeLeft <= 0) {
      handleFinalize(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => (prev ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [examStatus, timeLeft]);

  // Post-test countdown timer (120s -> 0)
  useEffect(() => {
    if (examStatus !== "terminating" && examStatus !== "submitting") return;
    if (postTestCountdown <= 0) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(()=>{});
      }
      navigate({ to: "/intern" });
      return;
    }
    const timer = setInterval(() => setPostTestCountdown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [examStatus, postTestCountdown, navigate]);

  const { requestFullscreen, strikes, logs, stream, activeWarning, clearWarning } = useProctoringEnforcement(
    examStatus === "running", 
    (reason) => handleTerminate(reason)
  );

  const handleTerminate = (reason: string) => {
    setTerminationReason(reason);
    setExamStatus("terminating");
    calculateMockScore();
    submitExamData();
  };

  const handleFinalize = async (isAuto = false) => {
    setExamStatus("submitting");
    calculateMockScore();
    submitExamData();
    if (isAuto) toast.info("Time is up! Exam auto-submitted.");
  };

  const calculateMockScore = () => {
    // Basic mock score calculation for the visual representation
    const answeredCount = Object.keys(answers).length;
    const score = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
    setCalculatedScore(score);
  };

  const submitExamData = async () => {
    localStorage.removeItem(`cbt_autosave_${testId}`); 
    if (testId === "demo") return;
    try {
      await submitFn({ data: { testId, answers, proctoringLogs: logs } });
    } catch (e) {
      toast.error("Network error during submission. Result cached locally.");
    }
  };

  const setVideoRef = (node: HTMLVideoElement | null) => {
    if (node && stream) {
      node.srcObject = stream;
    }
  };

  // -------------------------------------------------------------
  // Warning Overlay (20s)
  // -------------------------------------------------------------
  const [warningLeft, setWarningLeft] = useState(20);
  useEffect(() => {
    if (!activeWarning) {
      setWarningLeft(20);
      return;
    }
    const rem = Math.max(0, Math.ceil((activeWarning.expiresAt - Date.now()) / 1000));
    setWarningLeft(rem);
    const int = setInterval(() => {
      const left = Math.max(0, Math.ceil((activeWarning.expiresAt - Date.now()) / 1000));
      setWarningLeft(left);
      if (left <= 0) clearWarning();
    }, 1000);
    return () => clearInterval(int);
  }, [activeWarning]);


  if (!isDesktop) {
    return (
      <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-8 text-center text-white">
        <MonitorSmartphone className="h-16 w-16 text-rose-500 mb-6" />
        <h1 className="text-3xl font-black mb-4">Desktop Required</h1>
        <p className="text-slate-400 max-w-md mx-auto">
          The AI CBT Engine and Proctoring environment is strictly restricted to desktop and larger screens (1024px or wider) to ensure test integrity and optimal experience.
        </p>
        <Button className="mt-8 bg-indigo-600 hover:bg-indigo-700 font-bold" onClick={() => navigate({ to: "/dashboard" })}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  if (!test) return <div className="flex h-screen items-center justify-center text-slate-500 font-sans">Loading Secure Environment...</div>;

  // -------------------------------------------------------------
  // Post-Exam Overlay (2 Min Delay)
  // -------------------------------------------------------------
  if (examStatus === "terminating" || examStatus === "submitting") {
    const isTerminated = examStatus === "terminating";
    const circleRadius = 60;
    const circleCircumference = 2 * Math.PI * circleRadius;
    const strokeDashoffset = circleCircumference - (calculatedScore / 100) * circleCircumference;

    return (
      <div className="flex h-screen w-screen bg-slate-100 flex-col items-center justify-center font-sans overflow-hidden relative">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0 bg-white" />
        <div className={`absolute top-0 left-0 w-full h-2 ${isTerminated ? "bg-red-500" : "bg-emerald-500"}`} />
        
        <div className="z-10 w-full max-w-4xl bg-white shadow-2xl border border-slate-200 rounded-sm flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className={`p-8 text-white ${isTerminated ? "bg-red-600" : "bg-slate-900"} flex items-center justify-between`}>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-wider mb-2">
                {isTerminated ? "Exam Terminated" : "Exam Successfully Submitted"}
              </h1>
              <p className="text-white/80 font-medium">
                {isTerminated 
                  ? `Violation: ${terminationReason}` 
                  : "Your responses have been securely recorded."}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest text-white/70 mb-1">Redirecting to Dashboard in</div>
              <div className="text-4xl font-mono font-bold flex items-center justify-end gap-2">
                <RefreshCcw className="h-6 w-6 animate-spin" />
                {Math.floor(postTestCountdown / 60)}:{(postTestCountdown % 60).toString().padStart(2, "0")}
              </div>
            </div>
          </div>

          <div className="p-10 flex gap-12 bg-slate-50">
            {/* Graphical Score */}
            <div className="w-1/3 flex flex-col items-center justify-center border-r border-slate-200 pr-12">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 text-center">Calculated Accuracy</div>
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r={circleRadius} stroke="#e2e8f0" strokeWidth="12" fill="none" />
                  <circle 
                    cx="70" cy="70" r={circleRadius} 
                    stroke={isTerminated ? "#ef4444" : "#10b981"} 
                    strokeWidth="12" fill="none" 
                    strokeLinecap="round"
                    style={{
                      strokeDasharray: circleCircumference,
                      strokeDashoffset: strokeDashoffset,
                      transition: "stroke-dashoffset 2s ease-out"
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-black ${isTerminated ? "text-red-600" : "text-emerald-600"}`}>{calculatedScore}%</span>
                </div>
              </div>
              <div className="mt-6 text-xs text-slate-500 text-center">
                {Object.keys(answers).length} of {questions.length} attempted
              </div>
            </div>

            {/* Answer Summary */}
            <div className="w-2/3">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Response Audit</div>
              <div className="h-64 overflow-y-auto custom-scrollbar border border-slate-200 bg-white rounded-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="px-4 py-3 border-b border-slate-200">Q#</th>
                      <th className="px-4 py-3 border-b border-slate-200">Status</th>
                      <th className="px-4 py-3 border-b border-slate-200">Recorded Answer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q, i) => {
                      const ans = answers[q.id];
                      return (
                        <tr key={q.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono font-bold text-slate-500">{i + 1}</td>
                          <td className="px-4 py-3">
                            {ans ? (
                              <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded">Answered</span>
                            ) : (
                              <span className="text-slate-400 font-bold text-xs bg-slate-100 px-2 py-1 rounded">Skipped</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-700 truncate max-w-[200px]">
                            {ans ? (typeof ans === "string" ? ans : ans.text) : "--"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 border-t border-slate-200 flex justify-between items-center">
            <span className="text-slate-400 text-xs font-mono">Session ID: {testId}-{Date.now()}</span>
            <Button variant="outline" onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});
              navigate({ to: "/intern" });
            }}>
              Return to Dashboard Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Pre-Exam Screen
  // -------------------------------------------------------------
  if (examStatus === "not_started") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 text-slate-900 font-sans relative overflow-hidden">
        <div className="bg-white p-10 shadow-lg max-w-3xl w-full border-t-8 border-slate-900 relative z-10 rounded-sm">
          
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200 justify-between">
            <div className="flex items-center gap-4">
              <img src="/icon-512.png" alt="Vyntyra" className="h-12 w-12 rounded shadow-sm border border-slate-200" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">Vyntyra Secure Assessment</h1>
                <p className="text-slate-500 text-sm font-medium">Candidate Verification & Pre-Exam Setup</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Intern ID</div>
              <div className="text-sm font-mono font-black text-slate-800 bg-slate-100 px-3 py-1 border border-slate-300 rounded-sm">
                {test.internId || "INT-UNKNOWN"}
              </div>
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
          <Button onClick={async () => { await requestFullscreen(); setExamStatus("running"); }} className="w-full h-12 bg-slate-900 hover:bg-slate-800 font-bold text-white uppercase tracking-wider rounded-sm">
            Acknowledge & Start Exam
          </Button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Live Exam Screen
  // -------------------------------------------------------------
  const q = questions[activeQ];
  const mins = Math.floor((timeLeft || 0) / 60);
  const secs = (timeLeft || 0) % 60;

  return (
    <div className="flex flex-col h-screen bg-slate-200 font-sans select-none overflow-hidden text-slate-900">
      
      {/* 20s Warning Overlay */}
      {activeWarning && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full rounded-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-amber-500 text-white p-6 flex flex-col items-center justify-center text-center">
              <AlertTriangle className="h-16 w-16 mb-4 animate-bounce" />
              <h2 className="text-3xl font-black uppercase tracking-widest">Malpractice Warning!</h2>
            </div>
            <div className="p-8 text-center bg-amber-50">
              <p className="text-xl font-bold text-slate-800 mb-2">Proctoring Violation Detected</p>
              <p className="text-slate-600 mb-8">{activeWarning.reason}</p>
              
              <div className="inline-flex flex-col items-center justify-center bg-white border border-amber-200 w-32 h-32 rounded-full shadow-inner">
                <span className="text-5xl font-mono font-black text-amber-600">{warningLeft}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Seconds</span>
              </div>
              <p className="mt-8 text-sm font-bold text-amber-700 bg-amber-100 p-3 rounded-sm">
                Please return to the secure exam immediately. Repeating this action will lead to auto-termination.
              </p>
            </div>
            <div className="p-4 border-t border-amber-200 bg-white flex justify-center">
              <Button onClick={() => clearWarning()} className="w-full bg-slate-900 font-bold uppercase tracking-wider">Acknowledge Warning</Button>
            </div>
          </div>
        </div>
      )}

      {/* Top Strict Header */}
      <div className="h-16 bg-slate-900 text-white flex items-center justify-between px-6 shadow-md z-30 shrink-0">
        <div className="flex items-center gap-4">
          <img src="/icon-512.png" alt="Vyntyra" className="h-8 w-8 rounded border border-slate-700 bg-white" />
          <div>
            <h1 className="font-bold text-base uppercase tracking-wider leading-none">Vyntyra Secure Assessment</h1>
            <div className="text-[10px] text-slate-400 font-mono mt-1">INTERN ID: {test.internId || "UNKNOWN"} | IP: {ipAddress}</div>
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
                handleFinalize(false);
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
        <div className="w-[300px] bg-slate-50 flex flex-col shadow-inner z-20 border-r border-slate-300 shrink-0">
          
          <div className="p-4 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
            
            {/* Live Video Feed - Strict, No Black Background */}
            <div className="mb-6 relative">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                Proctoring Feed
              </div>
              <div className="relative rounded-sm overflow-hidden border border-slate-300 aspect-video flex items-center justify-center bg-slate-200">
                {stream ? (
                  <video ref={setVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror mix-blend-multiply" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                    <VideoOff className="h-6 w-6" />
                  </div>
                )}
                {/* Floating REC Badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 text-red-600 font-black text-[9px] uppercase tracking-widest bg-white/90 backdrop-blur-sm px-2 py-1 rounded-sm border border-slate-200 shadow-sm">
                  <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" /> REC
                </div>
              </div>
            </div>

            {/* Strikes Info */}
            <div className="mb-6 bg-white p-3 border border-slate-200 rounded-sm shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase">Violations</span>
                <span className={`font-black text-sm ${strikes > 0 ? "text-red-600" : "text-emerald-600"}`}>{strikes} / 2</span>
              </div>
              {strikes > 0 && <div className="mt-2 text-[10px] text-red-700 font-bold bg-red-50 p-2 border border-red-200 rounded-sm">Warning: 1 strike remaining.</div>}
            </div>

            {/* Question Palette */}
            <div className="mb-6">
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
            </div>

            {/* Persistent Instructions sidebar */}
            <div className="mt-auto border-t border-slate-200 pt-4">
              <h3 className="font-bold text-slate-500 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" /> Exam Instructions
              </h3>
              <ul className="space-y-2 text-[10px] text-slate-600 font-medium leading-relaxed bg-white border border-slate-200 p-3 rounded-sm">
                <li>• Ensure your face remains visible in the camera frame at all times.</li>
                <li>• Do not switch tabs or use keyboard shortcuts (Alt+Tab, Windows Key).</li>
                <li>• Copying or Pasting is strictly prohibited and logged.</li>
                <li>• 2 Warnings will result in immediate termination.</li>
              </ul>
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
