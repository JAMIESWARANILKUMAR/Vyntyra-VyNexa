import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getInternTestSessionFn, submitCbtExamFn } from "@/lib/cbt.functions";
import { useProctoringEnforcement } from "@/hooks/useProctoringEnforcement";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  AlertTriangle, ShieldCheck, VideoOff, CheckCircle2, ChevronRight, ChevronLeft, 
  ShieldAlert, AlertCircle, RefreshCcw, MonitorSmartphone, XCircle, Code2, 
  Terminal, Copy, FileText, RotateCcw, Check, Sparkles, Download, ExternalLink
} from "lucide-react";
import { downloadCbtDetailedReportPdf, generateNextAttemptSuggestions, CbtQuestionAudit } from "@/lib/cbt-report";

function createBlankCanvasTrack(width = 640, height = 480): MediaStreamTrack | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);
  }
  const stream = (canvas as any).captureStream ? (canvas as any).captureStream(1) : null;
  return stream?.getVideoTracks()[0] || null;
}

function normalizeOptions(options: any, questionType?: string): Array<{ id: string; text: string }> {
  let opts = options;
  if (typeof opts === 'string') {
    try { opts = JSON.parse(opts); } catch (e) {}
  }
  
  if (Array.isArray(opts) && opts.length > 0) {
    return opts.map((opt, idx) => {
      if (typeof opt === 'string') {
        return { id: String.fromCharCode(65 + idx), text: opt };
      }
      if (typeof opt === 'object' && opt !== null) {
        return {
          id: String(opt.id || String.fromCharCode(65 + idx)),
          text: String(opt.text ?? opt.value ?? opt.label ?? opt.title ?? '')
        };
      }
      return { id: String.fromCharCode(65 + idx), text: String(opt) };
    });
  }

  if (opts && typeof opts === 'object' && !Array.isArray(opts)) {
    const keys = Object.keys(opts);
    if (keys.length > 0) {
      return keys.map((k, idx) => ({
        id: k.length <= 2 ? k.toUpperCase() : String.fromCharCode(65 + idx),
        text: String(opts[k])
      }));
    }
  }

  // Fallback for true_false questions if missing or empty
  if (questionType === 'true_false') {
    return [
      { id: "A", text: "True" },
      { id: "B", text: "False" }
    ];
  }

  return [];
}

function getBadgeInfo(type: string) {
  const norm = (type || "").toLowerCase();
  switch (norm) {
    case "true_false":
      return { label: "TRUE / FALSE", color: "bg-amber-100 text-amber-800 border-amber-300" };
    case "scenario":
    case "scenario_based":
      return { label: "SCENARIO CASE", color: "bg-purple-100 text-purple-800 border-purple-300" };
    case "code_snippet":
    case "code_based":
    case "sql":
      return { label: "CODE SNIPPET", color: "bg-sky-100 text-sky-800 border-sky-300" };
    case "coding":
      return { label: "HANDS-ON CODING", color: "bg-emerald-100 text-emerald-800 border-emerald-300" };
    case "short_answer":
      return { label: "SHORT ANSWER", color: "bg-blue-100 text-blue-800 border-blue-300" };
    case "long_answer":
    case "subjective":
      return { label: "WRITTEN RESPONSE", color: "bg-indigo-100 text-indigo-800 border-indigo-300" };
    case "aptitude":
      return { label: "APTITUDE REASONING", color: "bg-orange-100 text-orange-800 border-orange-300" };
    case "mcq":
    default:
      return { label: "MULTIPLE CHOICE", color: "bg-slate-200 text-slate-700 border-slate-300" };
  }
}

export const Route = createFileRoute("/_authenticated/cbt/$testId")({
  component: CbtExamInterface,
});

function CbtExamInterface() {
  const { testId } = Route.useParams();
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(true);

  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any>({});
  const [activeQ, setActiveQ] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [overallTimeLeft, setOverallTimeLeft] = useState<number | null>(null);
  const questionTimersRef = useRef<{ [key: number]: number }>({});
  const [ipAddress, setIpAddress] = useState("Fetching IP...");
  
  // Post-test state
  const [examStatus, setExamStatus] = useState<"not_started" | "running" | "terminating" | "submitting">("not_started");
  const [postTestCountdown, setPostTestCountdown] = useState(120);
  const [terminationReason, setTerminationReason] = useState("");
  const [calculatedScore, setCalculatedScore] = useState(0);
  const [warningLeft, setWarningLeft] = useState(20);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);

  // WebRTC / Live Streaming hook
  const rtcConnection = useRef<RTCPeerConnection | null>(null);
  const globalChannelRef = useRef<any>(null);
  const activeScreenTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenSenderRef = useRef<RTCRtpSender | null>(null);
  const isScreenShareAllowedRef = useRef<boolean>(false);

  const getSessionFn = useServerFn(getInternTestSessionFn);
  const submitFn = useServerFn(submitCbtExamFn);

  // Score & Submit Helpers
  const calculateMockScore = () => {
    const answeredCount = Object.keys(answers).length;
    const score = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
    setCalculatedScore(score);
  };

  const submitExamData = async (currentLogs?: any[]) => {
    localStorage.removeItem(`cbt_autosave_${testId}`); 
    if (testId === "demo") {
      setSubmissionResult({
        score: calculatedScore,
        percentage: calculatedScore,
        passed: calculatedScore >= (test?.passing_score || 60),
        questionsReview: questions.map((q, i) => ({
          question_id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          intern_answer: answers[q.id],
          correct_answer: q.options ? q.options[0]?.id : "Sample Answer",
          explanation: "Familiarization demo question reference solution.",
          is_correct: Boolean(answers[q.id]),
          score: answers[q.id] ? 10 : 0,
          max_points: 10
        }))
      });
      return;
    }
    setIsSubmittingExam(true);
    try {
      const res = await submitFn({ data: { testId, answers, proctoringLogs: currentLogs || logs } });
      if (res) {
        setSubmissionResult(res);
        if (typeof res.percentage === 'number') {
          setCalculatedScore(res.percentage);
        }
      }
    } catch (e) {
      toast.error("Network error during submission. Result cached locally.");
    } finally {
      setIsSubmittingExam(false);
    }
  };

  const handleTerminate = (reason: string) => {
    setTerminationReason(reason);
    setExamStatus("terminating");
    calculateMockScore();
    submitExamData(logs);
  };

  const handleFinalize = async (isAuto = false) => {
    setExamStatus("submitting");
    calculateMockScore();
    submitExamData(logs);
    if (isAuto) toast.info("Time is up! Exam auto-submitted.");
  };

  const handleDownloadReport = () => {
    const questionsReview = submissionResult?.questionsReview || [];
    const maxScore = submissionResult?.maxScore || questions.reduce((acc: number, q: any) => acc + (Number(q.max_points) || 10), 0) || 100;
    const totalScore = submissionResult?.totalScore ?? submissionResult?.score ?? questionsReview.reduce((acc: number, r: any) => acc + (Number(r.score) || 0), 0);
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : calculatedScore;
    const passingScore = test?.passing_score || 50;
    const passed = percentage >= passingScore;

    let correctCount = 0;
    let partialCount = 0;
    let incorrectCount = 0;

    const questionAudits: CbtQuestionAudit[] = (questionsReview.length > 0 ? questionsReview : questions).map((qItem: any, idx: number) => {
      const review = questionsReview.find((r: any) => r.question_id === (qItem.id || qItem.question_id)) || qItem;
      const ans = answers[qItem.id || qItem.question_id];
      const isCorrect = Boolean(review.is_correct);
      const maxPts = Number(review.max_points) || 10;
      const score = review.score !== undefined ? Number(review.score) : (isCorrect ? maxPts : 0);

      if (score >= maxPts) correctCount++;
      else if (score > 0) partialCount++;
      else incorrectCount++;

      const candidateAns = ans ? (typeof ans === "string" ? ans : ans.text || ans.id) : "No answer recorded";
      const correctAns = review.correct_answer ? (typeof review.correct_answer === "object" ? JSON.stringify(review.correct_answer) : String(review.correct_answer)) : "Verified Answer";

      return {
        question_id: qItem.id || qItem.question_id || String(idx),
        question_number: idx + 1,
        question_text: qItem.question_text,
        question_type: qItem.question_type || "mcq",
        max_points: maxPts,
        awarded_score: score,
        is_correct: score >= maxPts,
        candidate_answer: String(candidateAns),
        correct_answer: correctAns,
        explanation: review.explanation,
        feedback: review.ai_feedback
      };
    });

    const accuracyRate = questionAudits.length > 0 ? Math.round((correctCount / questionAudits.length) * 100) : 0;
    const suggestions = generateNextAttemptSuggestions(questionAudits, passingScore, percentage, totalScore, maxScore);

    downloadCbtDetailedReportPdf({
      candidateName: test?.internName || test?.internId || "Candidate",
      candidateEmail: "",
      internId: test?.internId || "INT-SECURE",
      examTitle: test?.title || "VyNexa Technical Assessment",
      examDescription: test?.description,
      submittedAt: new Date().toLocaleString(),
      submissionId: submissionResult?.submissionId || `${testId}-${Date.now()}`,
      totalScore,
      maxScore,
      percentage,
      passingScore,
      passed,
      totalQuestions: questionAudits.length,
      correctCount,
      partialCount,
      incorrectCount,
      accuracyRate,
      infractionsCount: strikes,
      malpracticeLogs: logs,
      questions: questionAudits,
      suggestions
    });
  };

  const isCameraEnabled = test?.proctoring_mode === "focus_only" ? false : (test?.enable_camera !== false && test?.camera_required !== false);
  const isExpired = Boolean(test?.deadline && new Date(test.deadline).getTime() < Date.now());
  const strictness = (test?.camera_strictness || "standard") as "lenient" | "standard" | "strict";
  const proctoringMode = test?.proctoring_mode || (isCameraEnabled ? "camera_malpractice" : "focus_only");
  const allowCtrlKeys = Boolean(test?.allow_ctrl_keys);

  // Proctoring Enforcement Hook (must be declared before useEffect hooks that use strikes/logs)
  const { requestFullscreen, strikes, maxStrikes, logs, stream, activeWarning, clearWarning, detectedDevice } = useProctoringEnforcement(
    examStatus === "running", 
    (reason) => handleTerminate(reason),
    isCameraEnabled,
    strictness,
    proctoringMode,
    allowCtrlKeys
  );

  const switchQuestion = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= questions.length || newIndex === activeQ) return;
    questionTimersRef.current[activeQ] = timeLeft !== null ? timeLeft : (questions[activeQ]?.time_limit_seconds || 60);
    const targetTime = questionTimersRef.current[newIndex] !== undefined
      ? questionTimersRef.current[newIndex]
      : (questions[newIndex]?.time_limit_seconds || 60);
    setTimeLeft(targetTime);
    setActiveQ(newIndex);
  };

  const setVideoRef = (node: HTMLVideoElement | null) => {
    if (node && stream) {
      node.srcObject = stream;
    }
  };

  // 1. Desktop Window Size check
  useEffect(() => {
    const checkSize = () => setIsDesktop(window.innerWidth >= 1024);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // 2. Fetch IP & Load CBT Exam Session
  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then(r => r.json())
      .then(data => setIpAddress(data.ip))
      .catch(() => setIpAddress("Unknown"));

    const saved = localStorage.getItem(`cbt_autosave_${testId}`);
    if (saved) {
      try { setAnswers(JSON.parse(saved)); } catch (e) {}
    }

    if (testId === "demo") {
      setTest({ 
        title: "VyNexa Portal Familiarization Demo", 
        description: "This is a 5-question demo to familiarize yourself with the VyNexa portal CBT engine.", 
        time_limit_minutes: 10, 
        passing_score: 80, 
        internId: "INT-DEMO-PREVIEW" 
      });
      setQuestions([
        { id: "demo-q1", question_type: "mcq", question_text: "What is the primary color of the VyNexa dashboard theme?", options: [{id: "A", text: "Emerald"}, {id: "B", text: "Crimson"}, {id: "C", text: "Indigo"}] },
        { id: "demo-q2", question_type: "true_false", question_text: "JavaScript 'Constructors' are used to create new objects based on a blueprint.", options: [{id: "A", text: "True"}, {id: "B", text: "False"}] },
        { id: "demo-q3", question_type: "scenario", question_text: "Scenario: An intern's camera stream drops during an exam due to a brief network glitch. As a proctoring policy, what should happen?", options: [{id: "A", text: "A 20-second malpractice warning appears with grace timer"}, {id: "B", text: "The test is immediately terminated with 0 score"}, {id: "C", text: "The candidate's computer restarts"}, {id: "D", text: "Nothing happens and proctoring is permanently disabled"}] },
        { id: "demo-q4", question_type: "code_snippet", question_text: "What will the following code snippet log to the console?\n\nconst [a, ...b] = [1, 2, 3, 4];\nconsole.log(b.length);", reference_code: "const [a, ...b] = [1, 2, 3, 4];\nconsole.log(b.length);", options: [{id: "A", text: "3"}, {id: "B", text: "4"}, {id: "C", text: "1"}, {id: "D", text: "undefined"}] },
        { id: "demo-q5", question_type: "coding", question_text: "Write a simple function `getGreeting(name)` that returns `'Hello, ' + name`.", reference_code: "function getGreeting(name) {\n  // Write implementation\n  return 'Hello, ' + name;\n}", test_cases: [{ input: "VyNexa", expected_output: "Hello, VyNexa" }] },
        { id: "demo-q6", question_type: "short_answer", question_text: "Briefly explain the role of proctoring in technical assessments." }
      ]);
      setTimeLeft(60);
      return;
    }

    getSessionFn({ data: { testId } })
      .then(res => {
        setTest({
          ...res.test,
          attemptsUsed: res.attemptsUsed,
          maxAttempts: res.maxAttempts,
          isUnlimited: res.isUnlimited,
          currentAttemptNumber: res.currentAttemptNumber,
          proctoring_mode: res.proctoring_mode || res.test?.proctoring_mode,
          allow_ctrl_keys: res.allow_ctrl_keys ?? res.test?.allow_ctrl_keys,
          allow_screen_share: res.allow_screen_share ?? res.test?.allow_screen_share ?? false
        });
        isScreenShareAllowedRef.current = Boolean(res.allow_screen_share ?? res.test?.allow_screen_share);
        const qs = res.questions || [];
        setQuestions(qs);
        setOverallTimeLeft((res.test?.time_limit_minutes || 30) * 60);
        if (qs.length > 0) {
          const firstQTime = qs[0]?.time_limit_seconds || 60;
          setTimeLeft(firstQTime);
          questionTimersRef.current[0] = firstQTime;
        }
      })
      .catch(err => {
        console.error("Failed to load CBT test:", err);
        toast.error("Failed to load test session: " + (err.message || "Unknown error"));
      });
  }, [testId]);

  // 3. WebRTC & Channel setup
  useEffect(() => {
    if (examStatus !== "running" || !test) return;

    const channelName = `cbt-exam-${testId}-${test.internId || 'UNKNOWN'}`;
    const channel = supabase.channel(channelName, { config: { presence: { key: test.internId } } });

    channel
      .on('presence', { event: 'sync' }, () => {
        console.log('Presence sync', channel.presenceState());
      })
      .on('broadcast', { event: 'set_screen_share' }, async ({ payload }: any) => {
        const shouldEnable = Boolean(payload?.enabled);
        isScreenShareAllowedRef.current = shouldEnable;
        setTest((prev: any) => prev ? { ...prev, allow_screen_share: shouldEnable } : prev);

        if (shouldEnable) {
          toast.info("External screen sharing has been requested/enabled by the Exam Administrator.", { duration: 5000 });
          try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            if (screenStream && screenStream.getVideoTracks().length > 0) {
              const screenTrack = screenStream.getVideoTracks()[0];
              activeScreenTrackRef.current = screenTrack;
              if (screenSenderRef.current) {
                await screenSenderRef.current.replaceTrack(screenTrack);
              }
            }
          } catch (err) {
            console.warn("Screen share prompt declined or cancelled by candidate:", err);
          }
        } else {
          toast.info("External screen sharing has been disabled by Administrator.");
          if (activeScreenTrackRef.current) {
            activeScreenTrackRef.current.stop();
            activeScreenTrackRef.current = null;
          }
          const blankTrack = createBlankCanvasTrack();
          if (blankTrack && screenSenderRef.current) {
            await screenSenderRef.current.replaceTrack(blankTrack);
          }
        }
      })
      .on('broadcast', { event: 'request_stream' }, async () => {
        try {
          if (rtcConnection.current) {
            rtcConnection.current.close();
          }
          const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
          rtcConnection.current = pc;

          const webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch(() => null);
          if (webcamStream) webcamStream.getTracks().forEach(track => pc.addTrack(track, webcamStream));

          // Admin screen sharing policy: only share screen if enabled by admin, otherwise send blank track
          if (isScreenShareAllowedRef.current) {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true }).catch(() => null);
            if (screenStream && screenStream.getVideoTracks().length > 0) {
              const track = screenStream.getVideoTracks()[0];
              activeScreenTrackRef.current = track;
              screenSenderRef.current = pc.addTrack(track, screenStream);
            } else {
              const blankTrack = createBlankCanvasTrack();
              if (blankTrack) screenSenderRef.current = pc.addTrack(blankTrack, new MediaStream([blankTrack]));
            }
          } else {
            const blankTrack = createBlankCanvasTrack();
            if (blankTrack) screenSenderRef.current = pc.addTrack(blankTrack, new MediaStream([blankTrack]));
          }

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
           await channel.track({ testId, internId: test.internId, startedAt: Date.now(), ip: ipAddress });
        }
      });

    const globalChannel = supabase.channel('cbt-active-exams', { config: { presence: { key: test.internId } } });
    globalChannelRef.current = globalChannel;
    globalChannel
      .on('broadcast', { event: 'force_submit' }, (payload: any) => {
        if (payload.payload?.internId === test.internId && payload.payload?.testId === testId) {
           toast.error("An Admin has forcefully submitted your exam!");
           handleFinalize(true);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
           await globalChannel.track({ testId, internId: test.internId, startedAt: Date.now(), ip: ipAddress, status: 'running' });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(globalChannel);
      globalChannelRef.current = null;
      if (activeScreenTrackRef.current) {
        activeScreenTrackRef.current.stop();
        activeScreenTrackRef.current = null;
      }
      if (rtcConnection.current) {
        rtcConnection.current.close();
        rtcConnection.current = null;
      }
    };
  }, [examStatus, test, testId, ipAddress]);

  // 4. Telemetry Tracking
  useEffect(() => {
    if (globalChannelRef.current && test) {
       const latestLog = logs.length > 0 ? logs[logs.length - 1].reason : null;
       globalChannelRef.current.track({ 
         testId, 
         internId: test.internId, 
         ip: ipAddress, 
         status: 'running', 
         activeQ, 
         totalQ: questions.length, 
         timeLeft,
         strikes,
         latestLog
       });
    }
  }, [activeQ, timeLeft, questions.length, strikes, logs]);

  // 5. Question Timer Initializer
  useEffect(() => {
    if (examStatus !== "running" || questions.length === 0) return;
    if (timeLeft === null) {
      const currentQTime = questionTimersRef.current[activeQ] ?? (questions[activeQ]?.time_limit_seconds || 60);
      setTimeLeft(currentQTime);
    }
  }, [examStatus, activeQ, questions, timeLeft]);

  // 6. Autosave Interval
  useEffect(() => {
    if (examStatus !== "running") return;
    const interval = setInterval(() => {
      localStorage.setItem(`cbt_autosave_${testId}`, JSON.stringify(answers));
    }, 5000);
    return () => clearInterval(interval);
  }, [answers, examStatus, testId]);

  // 7. Per-Question Countdown Timer
  useEffect(() => {
    if (examStatus !== "running" || timeLeft === null) return;
    if (timeLeft <= 0) {
      if (activeQ < questions.length - 1) {
        toast.info(`Time is up for Question ${activeQ + 1}! Moving to next question.`);
        switchQuestion(activeQ + 1);
      } else {
        toast.error("Time is up for the final question!");
        handleFinalize(true);
      }
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const nextVal = prev !== null && prev > 0 ? prev - 1 : 0;
        questionTimersRef.current[activeQ] = nextVal;
        return nextVal;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [examStatus, timeLeft, activeQ, questions.length]);

  // 7b. Overall Exam Timer Countdown
  useEffect(() => {
    if (examStatus !== "running" || overallTimeLeft === null) return;
    if (overallTimeLeft <= 0) {
      toast.error("Overall exam time limit reached! Auto-submitting...");
      handleFinalize(true);
      return;
    }
    const timer = setInterval(() => {
      setOverallTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [examStatus, overallTimeLeft]);

  // 8. Post-test countdown timer (120s -> 0)
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

  // 9. Warning Overlay Timer
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
        
        {/* Repeating Watermark Grid with Vyntyra Branding and Intern ID */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden flex flex-wrap gap-x-14 gap-y-16 opacity-[0.035] rotate-[-25deg] scale-150 justify-center items-center select-none">
          {Array.from({ length: 140 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 whitespace-nowrap font-mono">
              <span className="text-xl font-black text-slate-900 tracking-wider">Vyntyra</span>
              <span className="text-xl font-bold text-slate-400">•</span>
              <span className="text-xl font-black text-slate-800 tracking-widest">{test?.internId || "INT-SECURE"}</span>
            </div>
          ))}
        </div>

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
            {/* Graphical Score & Breakdown */}
            <div className="w-1/3 flex flex-col items-center justify-center border-r border-slate-200 pr-12">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 text-center">Score & Accuracy</div>
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
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    {submissionResult?.passed ? "Passed" : "Completed"}
                  </span>
                </div>
              </div>

              {/* Points & Correct Breakdown */}
              <div className="mt-4 text-center space-y-1 w-full">
                <div className="text-xs font-bold text-slate-700">
                  Total Points: <span className="text-indigo-600 font-black">{submissionResult?.totalScore ?? (submissionResult?.score ?? 0)} / {submissionResult?.maxScore ?? (questions.length * 10)} pts</span>
                </div>
                {submissionResult?.questionsReview && (
                  <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block">
                    Correct: {submissionResult.questionsReview.filter((r: any) => Boolean(r.is_correct)).length} / {questions.length} Questions
                  </div>
                )}
                <div className="text-[10px] text-slate-400">
                  {Object.keys(answers).length} of {questions.length} attempted
                </div>
              </div>

              {/* Action Buttons in Left Column */}
              <div className="mt-4 w-full space-y-2">
                <Button 
                  onClick={handleDownloadReport} 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Download className="h-4 w-4" /> Download Report (PDF)
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate({ to: `/cbt/results/${testId}` })} 
                  className="w-full text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Full Results & Guidance
                </Button>
                {(test?.isUnlimited || ((test?.attemptsUsed || 1) < (test?.maxAttempts || 1))) && (
                  <Button
                    onClick={() => window.location.reload()}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <RotateCcw className="h-4 w-4" /> Retake Test Now
                  </Button>
                )}
              </div>
            </div>

            {/* Answer Summary */}
            <div className="w-2/3 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Post-Submission Question & Solution Sheet
                </div>
                {submissionResult?.submissionId && (
                  <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    Score Saved to Database
                  </span>
                )}
              </div>

              {isSubmittingExam ? (
                <div className="h-72 border border-slate-200 bg-white rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-3">
                  <RefreshCcw className="h-8 w-8 text-indigo-600 animate-spin" />
                  <p className="font-bold text-slate-800 text-sm">Grading Responses & Running Code Verifications...</p>
                  <p className="text-xs text-slate-500">Checking unit test case outputs and checking pre-marked solutions.</p>
                </div>
              ) : (
                <div className="h-80 overflow-y-auto custom-scrollbar border border-slate-200 bg-white rounded-xl p-4 space-y-4">
                  {((submissionResult?.questionsReview || []).length > 0 ? submissionResult.questionsReview : questions).map((qItem: any, i: number) => {
                    const ans = answers[qItem.id || qItem.question_id];
                    const review = (submissionResult?.questionsReview || []).find((r: any) => r.question_id === (qItem.id || qItem.question_id)) || qItem;
                    const isCorrect = Boolean(review.is_correct);
                    const qScore = review.score ?? (isCorrect ? (review.max_points || 10) : 0);
                    const maxPts = review.max_points || 10;
                    const correctOptId = typeof review.correct_answer === 'object' ? review.correct_answer?.id : String(review.correct_answer || '');

                    return (
                      <div key={qItem.id || i} className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all ${
                        isCorrect ? "bg-emerald-50/40 border-emerald-200" : "bg-slate-50/70 border-slate-200"
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800 bg-slate-200 px-2 py-0.5 rounded">
                              Q{i + 1}
                            </span>
                            <span className="font-bold uppercase tracking-wider text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                              {(qItem.question_type || "mcq").toUpperCase()}
                            </span>
                          </div>
                          <span className={`font-black px-2 py-0.5 rounded text-[11px] ${
                            isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}>
                            {qScore} / {maxPts} pts
                          </span>
                        </div>

                        <p className="font-medium text-slate-800 whitespace-pre-wrap">{qItem.question_text}</p>

                        {/* Candidate Selected Answer */}
                        <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Your Response:</span>
                          <span className={`font-semibold ${isCorrect ? "text-emerald-700" : "text-rose-700"}`}>
                            {ans ? (typeof ans === "string" ? ans : ans.text || ans.id) : "(Skipped / Unanswered)"}
                          </span>
                        </div>

                        {/* Coding Output Verification Box */}
                        {qItem.question_type === 'coding' && review.coding_verification && (
                          <div className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] space-y-1">
                            <div className="text-[10px] font-sans font-bold text-indigo-400 uppercase tracking-wider">
                              Automated Code Output Verification:
                            </div>
                            <div className={review.coding_verification.output_matches ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                              {review.coding_verification.output_matches ? "✓ Required Output Matched Expected Criteria" : "✗ Output Did Not Match Required Criteria"}
                            </div>
                            {review.coding_verification.actual_output && (
                              <div className="text-slate-400 text-[10px]">Actual Output: {review.coding_verification.actual_output}</div>
                            )}
                            {review.coding_verification.expected_output && (
                              <div className="text-emerald-300 text-[10px]">Expected Output: {review.coding_verification.expected_output}</div>
                            )}
                          </div>
                        )}

                        {/* Pre-Marked Correct Answer & Explanation */}
                        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg space-y-1">
                          <div className="flex items-center gap-1.5 text-emerald-800 font-black text-[10px] uppercase tracking-wider">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Pre-Marked Correct Solution:
                          </div>
                          <div className="text-emerald-950 font-bold">
                            {review.correct_answer ? (typeof review.correct_answer === "string" ? review.correct_answer : JSON.stringify(review.correct_answer)) : "Verified Answer"}
                          </div>
                          {review.explanation && (
                            <div className="text-[11px] text-emerald-800 pt-1 border-t border-emerald-200/80">
                              <span className="font-bold">Explanation:</span> {review.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
            <span className="text-slate-400 text-xs font-mono">Session ID: {testId}-{Date.now()}</span>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleDownloadReport}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="h-4 w-4" /> Download Detailed Report (PDF)
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});
                  navigate({ to: "/intern" });
                }}
              >
                Return to Dashboard Now
              </Button>
            </div>
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
        {/* Repeating Watermark Grid with Vyntyra Branding and Intern ID */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden flex flex-wrap gap-x-14 gap-y-16 opacity-[0.035] rotate-[-25deg] scale-150 justify-center items-center select-none">
          {Array.from({ length: 140 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 whitespace-nowrap font-mono">
              <span className="text-xl font-black text-slate-900 tracking-wider">Vyntyra</span>
              <span className="text-xl font-bold text-slate-400">•</span>
              <span className="text-xl font-black text-slate-800 tracking-widest">{test?.internId || "INT-SECURE"}</span>
            </div>
          ))}
        </div>
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
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> 
                  <strong>Proctoring:</strong> {proctoringMode === "camera_monitoring" ? "Passive Camera Monitoring (No auto-strikes)" : proctoringMode === "focus_only" ? "Focus Only (Camera Disabled)" : "Camera with Direct Malpractice Protection"}
                </li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> <strong>Focus Tracking:</strong> Alt+Tab, window blur, and fullscreen drops are logged.</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> <strong>Keyboard Controls:</strong> {allowCtrlKeys ? "Ctrl Shortcuts Allowed for IDE & Coding" : "Copy/Paste blocked"}</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" /> <strong>Attempts:</strong> {test?.isUnlimited ? "Unlimited Retakes Allowed" : `Attempt ${test?.currentAttemptNumber || (test?.attemptsUsed || 0) + 1} of ${test?.maxAttempts || 1}`}</li>
              </ul>
              <ul className="space-y-3 font-medium text-slate-700 border-l border-slate-300 pl-6">
                <li className="flex items-center justify-between"><span className="text-slate-500">Duration:</span> <strong className="text-slate-900">{test.time_limit_minutes || 30} Minutes</strong></li>
                <li className="flex items-center justify-between"><span className="text-slate-500">Passing Criteria:</span> <strong className="text-slate-900">{test.passing_score || 60}%</strong></li>
                <li className="flex items-center justify-between"><span className="text-slate-500">Total Modules:</span> <strong className="text-slate-900">{questions.length}</strong></li>
                {test.deadline && (
                  <li className="flex items-center justify-between">
                    <span className="text-slate-500">Deadline:</span> 
                    <strong className={`text-xs ${isExpired ? "text-red-600 font-bold" : "text-slate-900"}`}>
                      {new Date(test.deadline).toLocaleString()}
                    </strong>
                  </li>
                )}
                <li className="flex items-center justify-between"><span className="text-slate-500">Origin IP:</span> <strong className="text-slate-900 font-mono text-xs">{ipAddress}</strong></li>
              </ul>
            </div>
            {isExpired ? (
              <div className="mt-6 bg-red-100 border border-red-300 p-3 text-red-800 font-bold text-xs flex items-center gap-2 rounded-sm uppercase tracking-wide">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                This assessment has expired as of {new Date(test.deadline).toLocaleString()}. Access is locked.
              </div>
            ) : (
              <div className="mt-6 bg-amber-50 border border-amber-200 p-3 text-amber-900 font-bold text-xs flex items-center justify-between rounded-sm">
                <div className="flex items-center gap-2 uppercase tracking-wide">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  Policy: Maximum {maxStrikes} warning{maxStrikes > 1 ? "s" : ""}. The {maxStrikes + 1}th violation automatically terminates the exam.
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-200/80 text-amber-900">
                  {strictness === "strict" ? "Ultra-Strict" : strictness === "lenient" ? "Lenient" : "Standard"} Proctoring
                </span>
              </div>
            )}
          </div>
          <Button 
            disabled={isExpired}
            onClick={async () => { await requestFullscreen(); setExamStatus("running"); }} 
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 font-bold text-white uppercase tracking-wider rounded-sm"
          >
            {isExpired ? "Assessment Expired - Contact Admin" : "Acknowledge & Start Exam"}
          </Button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Live Exam Screen
  // -------------------------------------------------------------
  const q = questions[activeQ];
  if (!q) {
    return <div className="flex h-screen items-center justify-center text-slate-500 font-sans">Loading question data...</div>;
  }
  const mins = Math.floor((timeLeft || 0) / 60);
  const secs = (timeLeft || 0) % 60;

  const normOpts = normalizeOptions(q?.options, q?.question_type);
  const qType = (q?.question_type || "mcq").toLowerCase();
  const isTrueFalse = qType === "true_false";
  const isCoding = qType === "coding";
  const isCodeSnippet = qType === "code_snippet" || qType === "code_based" || qType === "sql";
  const isScenario = qType === "scenario" || qType === "scenario_based" || Boolean(q?.question_text?.toLowerCase().includes("scenario:"));
  const hasOptions = normOpts.length > 0;
  const badgeInfo = getBadgeInfo(q?.question_type);

  const isTrueSelected = (
    answers[q?.id]?.id === "A" || 
    answers[q?.id]?.text?.toLowerCase() === "true" ||
    String(answers[q?.id] || "").toLowerCase() === "true" ||
    String(answers[q?.id] || "").toLowerCase() === "a"
  );
  const isFalseSelected = (
    answers[q?.id]?.id === "B" || 
    answers[q?.id]?.text?.toLowerCase() === "false" ||
    String(answers[q?.id] || "").toLowerCase() === "false" ||
    String(answers[q?.id] || "").toLowerCase() === "b"
  );

  return (
    <div className="flex flex-col h-screen bg-slate-200 font-sans select-none overflow-hidden text-slate-900">
      
      {/* Real-Time Prohibited Device Banner (Center Screen Alert) */}
      {detectedDevice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white px-6 py-3.5 rounded-full shadow-2xl border-2 border-white flex items-center gap-3.5 animate-bounce">
          <MonitorSmartphone className="h-6 w-6 text-amber-300 animate-pulse shrink-0" />
          <div className="flex flex-col text-left">
            <span className="font-black text-xs uppercase tracking-wider text-amber-200">
              Prohibited Device Warning: {detectedDevice.type} Detected!
            </span>
            <span className="text-[11px] text-white font-semibold">
              Detected in {detectedDevice.location}. Remove all phones, laptops, and screens immediately!
            </span>
          </div>
        </div>
      )}

      {/* 20s Warning Overlay */}
      {activeWarning && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full rounded-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`${activeWarning.reason.toLowerCase().includes("device") || activeWarning.reason.toLowerCase().includes("phone") ? "bg-rose-600" : "bg-amber-500"} text-white p-6 flex flex-col items-center justify-center text-center`}>
              {activeWarning.reason.toLowerCase().includes("device") || activeWarning.reason.toLowerCase().includes("phone") ? (
                <MonitorSmartphone className="h-16 w-16 mb-4 animate-bounce text-amber-200" />
              ) : (
                <AlertTriangle className="h-16 w-16 mb-4 animate-bounce" />
              )}
              <h2 className="text-3xl font-black uppercase tracking-widest">
                {activeWarning.reason.toLowerCase().includes("device") ? "Prohibited Device Detected!" : "Malpractice Warning!"}
              </h2>
            </div>
            <div className="p-8 text-center bg-amber-50">
              <p className="text-xl font-bold text-slate-800 mb-2">Proctoring Violation Detected</p>
              <p className="text-slate-600 mb-8 font-medium">{activeWarning.reason}</p>
              
              <div className="inline-flex flex-col items-center justify-center bg-white border border-amber-200 w-32 h-32 rounded-full shadow-inner">
                <span className="text-5xl font-mono font-black text-amber-600">{warningLeft}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Seconds</span>
              </div>
              <p className="mt-8 text-sm font-bold text-amber-700 bg-amber-100 p-3 rounded-sm">
                Please return to the secure exam immediately. Remove all phones, secondary screens, or gadgets. Repeating this action will lead to auto-termination.
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
        
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex flex-col items-center bg-slate-800/90 px-3 py-1 rounded border border-slate-700">
            <span className="text-[9px] uppercase tracking-widest text-indigo-400 font-semibold mb-0.5">Q{activeQ + 1} Time</span>
            <div className={`font-mono text-lg font-black leading-none ${(timeLeft || 0) <= 15 ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>
              {Math.floor((timeLeft || 0) / 60).toString().padStart(2, "0")}:{((timeLeft || 0) % 60).toString().padStart(2, "0")}
            </div>
          </div>

          <div className="flex flex-col items-center bg-slate-800/90 px-3 py-1 rounded border border-slate-700">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Total Exam Time</span>
            <div className={`font-mono text-lg font-bold leading-none ${(overallTimeLeft || 0) < 300 ? "text-red-500 animate-pulse" : "text-white"}`}>
              {Math.floor((overallTimeLeft || 0) / 60).toString().padStart(2, "0")}:{((overallTimeLeft || 0) % 60).toString().padStart(2, "0")}
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
            
            {/* Live Video Feed or Focus Tracking Mode */}
            <div className="mb-6 relative">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center justify-between">
                <span>Proctoring Feed</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isCameraEnabled ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                  {isCameraEnabled ? "Cam Active" : "Focus Only"}
                </span>
              </div>
              {isCameraEnabled ? (
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
                  {detectedDevice && (
                    <div className="absolute inset-0 border-2 border-rose-500 bg-rose-500/15 flex flex-col justify-between p-2 pointer-events-none z-10 animate-pulse">
                      <span className="bg-rose-600 text-white font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded self-end shadow">
                        ⚠ {detectedDevice.type} ({detectedDevice.confidence}%)
                      </span>
                      <span className="bg-black/80 text-rose-300 text-[8px] font-bold px-1.5 py-0.5 rounded text-center">
                        Position: {detectedDevice.location}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative rounded-sm border border-slate-300 aspect-video p-3 bg-white flex flex-col items-center justify-center text-center">
                  <ShieldCheck className="h-6 w-6 text-emerald-600 mb-1" />
                  <span className="text-xs font-bold text-slate-800">Focus-Only Proctoring</span>
                  <span className="text-[9px] text-slate-500 mt-0.5 leading-tight">Camera disabled by admin. Fullscreen & tab tracking enabled.</span>
                </div>
              )}
            </div>

            {/* Strikes Info */}
            <div className="mb-6 bg-white p-3 border border-slate-200 rounded-sm shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700 uppercase block">Violations</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">
                    {strictness === "strict" ? "Ultra-Strict" : strictness === "lenient" ? "Lenient" : "Standard"}
                  </span>
                </div>
                <span className={`font-black text-sm ${strikes > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {strikes} / {maxStrikes}
                </span>
              </div>
              {strikes > 0 && (
                <div className="mt-2 text-[10px] text-red-700 font-bold bg-red-50 p-2 border border-red-200 rounded-sm">
                  {maxStrikes - strikes <= 0 ? "Final violation reached." : `Warning: ${maxStrikes - strikes} strike(s) remaining.`}
                </div>
              )}
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
                      onClick={() => switchQuestion(i)}
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
          
          {/* Repeating Watermark Grid with Vyntyra Branding and Intern ID */}
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden flex flex-wrap gap-x-14 gap-y-16 opacity-[0.045] rotate-[-25deg] scale-150 justify-center items-center select-none">
            {Array.from({ length: 160 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 whitespace-nowrap font-mono">
                <span className="text-xl font-black text-slate-900 tracking-wider">Vyntyra</span>
                <span className="text-xl font-bold text-slate-400">•</span>
                <span className="text-xl font-black text-slate-800 tracking-widest">{test?.internId || "INT-SECURE"}</span>
              </div>
            ))}
          </div>

          {/* Top Header for Question */}
          <div className="bg-slate-50 border-b border-slate-200 py-3.5 px-8 z-20 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-800">
                Question {activeQ + 1} <span className="text-sm font-normal text-slate-400">of {questions.length}</span>
              </h2>
              <div className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shadow-2xs ${badgeInfo.color}`}>
                {badgeInfo.label}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded">
                {q?.max_points || 10} Points
              </span>
            </div>
          </div>

          {/* Question Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar relative z-10">
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Scenario Context Callout */}
              {isScenario && (
                <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-200 flex items-start gap-3 shadow-2xs">
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-700 shrink-0 mt-0.5">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider">Industrial Case Scenario</h4>
                    <p className="text-xs text-purple-700 mt-0.5 leading-relaxed">
                      Evaluate the operational context, business constraints, and technical requirements before selecting or formulating your solution.
                    </p>
                  </div>
                </div>
              )}

              {/* Main Question Text */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
                <h3 className="text-lg md:text-xl text-slate-900 font-medium leading-relaxed whitespace-pre-wrap">{q?.question_text}</h3>
              </div>

              {/* Reference Code Box if available */}
              {q?.reference_code && (
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-300">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-emerald-400" />
                      <span className="font-bold tracking-wider uppercase text-[11px] text-slate-300">Reference Code Context</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(q.reference_code);
                        toast.success("Code copied to clipboard");
                      }}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono leading-relaxed text-emerald-400 overflow-x-auto selection:bg-emerald-900 selection:text-white">
                    <code>{q.reference_code}</code>
                  </pre>
                </div>
              )}
              
              {/* Answer Controls Area */}
              <div>
                {/* 1. Dedicated True / False Interactive Cards */}
                {isTrueFalse && (
                  <div className="space-y-4">
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-center gap-2.5 text-xs text-amber-900 font-medium">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Select whether the proposition stated above is factually <strong>True</strong> or <strong>False</strong>.</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* True Card */}
                      <button
                        type="button"
                        onClick={() => setAnswers({ ...answers, [q.id]: { id: "A", text: "True" } })}
                        className={`p-6 rounded-xl border-2 text-left transition-all flex items-start gap-4 cursor-pointer select-none ${
                          isTrueSelected 
                            ? "border-emerald-600 bg-emerald-50/90 shadow-md ring-2 ring-emerald-500/30" 
                            : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/20"
                        }`}
                      >
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isTrueSelected ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700 border border-emerald-300"
                        }`}>
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-lg font-black tracking-wide text-slate-900">TRUE</span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                              isTrueSelected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}>[A]</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            The technical proposition is verified, correct, and valid.
                          </p>
                        </div>
                      </button>

                      {/* False Card */}
                      <button
                        type="button"
                        onClick={() => setAnswers({ ...answers, [q.id]: { id: "B", text: "False" } })}
                        className={`p-6 rounded-xl border-2 text-left transition-all flex items-start gap-4 cursor-pointer select-none ${
                          isFalseSelected 
                            ? "border-rose-600 bg-rose-50/90 shadow-md ring-2 ring-rose-500/30" 
                            : "border-slate-200 bg-white hover:border-rose-300 hover:bg-rose-50/20"
                        }`}
                      >
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isFalseSelected ? "bg-rose-600 text-white" : "bg-rose-100 text-rose-700 border border-rose-300"
                        }`}>
                          <XCircle className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-lg font-black tracking-wide text-slate-900">FALSE</span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                              isFalseSelected ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}>[B]</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            The technical proposition contains errors, misconceptions, or is invalid.
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Multiple Choice Options (for MCQ, Scenario, Code Snippet, Aptitude, or any question with options) */}
                {!isTrueFalse && hasOptions && (
                  <div className="space-y-3 pt-1">
                    {normOpts.map((opt: any) => {
                      const isChecked = 
                        answers[q.id]?.id === opt.id || 
                        answers[q.id]?.text === opt.text ||
                        answers[q.id] === opt.id ||
                        answers[q.id] === opt.text;

                      return (
                        <div 
                          key={opt.id} 
                          onClick={() => setAnswers({ ...answers, [q.id]: opt })} 
                          className={`flex items-start gap-4 p-4 cursor-pointer transition-all border-2 rounded-xl select-none ${
                            isChecked 
                              ? "border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-500/20" 
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                          }`}
                        >
                          <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isChecked ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white text-slate-500"
                          }`}>
                            <span className="text-[11px] font-bold">{opt.id}</span>
                          </div>
                          <div className="flex-1">
                            <span className={`text-base leading-relaxed ${isChecked ? "text-slate-900 font-semibold" : "text-slate-700"}`}>
                              {opt.text}
                            </span>
                          </div>
                          <div className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            isChecked ? "border-indigo-600 bg-white" : "border-slate-300 bg-white"
                          }`}>
                            {isChecked && <div className="h-2.5 w-2.5 rounded-full bg-indigo-600" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 3. Coding Implementation Editor */}
                {!isTrueFalse && !hasOptions && (isCoding || isCodeSnippet) && (
                  <div className="space-y-4 pt-1">
                    <div className="rounded-xl overflow-hidden border border-slate-300 bg-white shadow-sm">
                      <div className="bg-slate-100 text-slate-700 px-4 py-2.5 flex items-center justify-between border-b border-slate-300">
                        <div className="flex items-center gap-2">
                          <Terminal className="h-4 w-4 text-emerald-600" />
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                            Source Code Implementation Editor
                          </span>
                        </div>
                        {q.reference_code && (
                          <button
                            type="button"
                            onClick={() => setAnswers({ ...answers, [q.id]: q.reference_code })}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="h-3 w-3" /> Reset to Starter Code
                          </button>
                        )}
                      </div>
                      <textarea 
                        className="w-full h-[360px] p-5 bg-slate-950 text-slate-100 font-mono text-[13px] leading-relaxed outline-none resize-none selection:bg-indigo-900 selection:text-white"
                        placeholder="// Write your clean, working implementation here..."
                        value={typeof answers[q.id] === 'string' ? answers[q.id] : (answers[q.id]?.text || "")}
                        onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                        spellCheck={false}
                      />
                    </div>

                    {Array.isArray(q.test_cases) && q.test_cases.length > 0 && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Unit Test Cases ({q.test_cases.length})
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                          {q.test_cases.map((tc: any, tIdx: number) => (
                            <div key={tIdx} className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1">
                              <div className="text-[10px] uppercase font-bold text-slate-500">Case #{tIdx + 1}</div>
                              {tc.input !== undefined && (
                                <div className="text-slate-700 truncate"><span className="text-slate-400">Input:</span> {typeof tc.input === 'object' ? JSON.stringify(tc.input) : String(tc.input)}</div>
                              )}
                              {tc.expected_output !== undefined && (
                                <div className="text-emerald-700 font-semibold truncate"><span className="text-slate-400">Expected:</span> {typeof tc.expected_output === 'object' ? JSON.stringify(tc.expected_output) : String(tc.expected_output)}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Subjective / Short Answer / Written Response (Universal Fallback) */}
                {!isTrueFalse && !hasOptions && !isCoding && !isCodeSnippet && (
                  <div className="space-y-2 pt-1">
                    <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-xs">
                      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-indigo-600" />
                          {q.question_type === "short_answer" ? "Short Answer / Theory Input" : "Technical Response Area"}
                        </span>
                        <span>
                          {String(answers[q.id] || "").trim() ? `${String(answers[q.id] || "").trim().split(/\s+/).length} words` : "0 words"} • {String(answers[q.id] || "").length} characters
                        </span>
                      </div>
                      <textarea 
                        className={`w-full p-5 font-sans text-base leading-relaxed outline-none resize-none text-slate-900 placeholder:text-slate-400 ${
                          q.question_type === "short_answer" ? "h-[220px]" : "h-[320px]"
                        }`}
                        placeholder={
                          q.question_type === "short_answer" 
                            ? "Type your concise explanation or solution here..." 
                            : "Type your structured, in-depth architectural or technical response here..."
                        }
                        value={typeof answers[q.id] === 'string' ? answers[q.id] : (answers[q.id]?.text || "")}
                        onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 italic">
                      Auto-saved continuously. Technical accuracy, key concepts, and structure are evaluated.
                    </p>
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
              onClick={() => switchQuestion(activeQ - 1)}
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
                if (activeQ < questions.length - 1) switchQuestion(activeQ + 1);
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
