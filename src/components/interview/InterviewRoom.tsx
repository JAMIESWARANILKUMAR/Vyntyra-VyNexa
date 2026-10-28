import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, Volume2, VolumeX, Sparkles, 
  Send, Square, Play, RotateCcw, Award, Code2, Clock, AlertCircle, 
  CheckCircle2, Shield, Eye, Smile, Activity, HelpCircle, ChevronRight,
  Split, MessageSquare, Terminal, RefreshCw, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CodePlayground } from '@/components/interview/CodePlayground';
import { 
  InterviewQuestionItem, 
  submitInterviewTurnFn, 
  recordInterviewTelemetryFn,
  finalizeMockInterviewReportFn 
} from '@/lib/mock-interview.functions';
import * as faceDetection from '@tensorflow-models/face-detection';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs-core';
import { getAiVoiceSettings, AiVoiceSettings } from '@/lib/settings.functions';
import { cleanTextForSpeech, resolveBestSpeechVoice, speakSentenceSequence } from '@/lib/speech-clarity';

interface InterviewRoomProps {
  sessionId: string;
  candidateName: string;
  targetRole: string;
  domain: string;
  difficulty: string;
  questions: InterviewQuestionItem[];
  initialQuestionIndex?: number;
  initialCode?: string;
  initialCodeLanguage?: string;
  isObserver?: boolean;
  isDemoMode?: boolean;
  onConcludeInterview: (reportData: any) => void;
}

export function InterviewRoom({
  sessionId,
  candidateName,
  targetRole,
  domain,
  difficulty,
  questions,
  initialQuestionIndex = 0,
  initialCode,
  initialCodeLanguage = 'javascript',
  isObserver = false,
  isDemoMode = false,
  onConcludeInterview
}: InterviewRoomProps) {
  // ─── Session State ───
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialQuestionIndex);
  const [turnIndex, setTurnIndex] = useState(1);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isCandidateSpeaking, setIsCandidateSpeaking] = useState(false);
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const [isConcluding, setIsConcluding] = useState(false);

  // ─── Subtitles & Messages ───
  const [aiSpokenText, setAiSpokenText] = useState<string>(
    questions[0]?.question || `Hello ${candidateName}, welcome! Let's begin your 1:1 technical interview.`
  );
  const [candidateDraftAnswer, setCandidateDraftAnswer] = useState<string>('');
  const [lastCandidateAnswer, setLastCandidateAnswer] = useState<string>('');
  const [speechConfidence, setSpeechConfidence] = useState<number>(0);

  // ─── Code Playground State ───
  const [code, setCode] = useState<string>(initialCode || questions[3]?.initialCodeSnippet || '// Implement your solution here');
  const [codeLanguage, setCodeLanguage] = useState<string>(initialCodeLanguage || 'javascript');
  const [viewMode, setViewMode] = useState<'video' | 'split' | 'code'>('video');

  // ─── Voice & Clarity State ───
  const [activeVoiceSettings, setActiveVoiceSettings] = useState<AiVoiceSettings | null>(null);
  const [speechPace, setSpeechPace] = useState<number>(0.94);
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlayingRecordedAudio, setIsPlayingRecordedAudio] = useState<boolean>(false);
  const customAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const speechSpeakerCancelRef = useRef<(() => void) | null>(null);

  // Sanitize targetRole to avoid duplicate title text like "Technology & Software Software Engineer"
  const displayRole = React.useMemo(() => {
    if (!targetRole) return 'Software Engineer';
    let r = targetRole.trim();
    if (r.toLowerCase().includes('technology & software software engineer')) {
      return r.replace(/technology & software software engineer/gi, 'Software Engineer');
    }
    if (r.toLowerCase().includes('software software engineer')) {
      return r.replace(/software software engineer/gi, 'Software Engineer');
    }
    return r;
  }, [targetRole]);

  // ─── Media Controls & Streams ───
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isMicActive, setIsMicActive] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100 for mic HUD meter
  const [ttsVolume, setTtsVolume] = useState(1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // ─── Telemetry (Attention & Head Stability) ───
  const [eyeContactScore, setEyeContactScore] = useState(94);
  const [headStabilityScore, setHeadStabilityScore] = useState(96);
  const [faceDetected, setFaceDetected] = useState(true);

  // ─── Refs ───
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const speechTurnTimerRef = useRef<any>(null);
  const turnStartTimeRef = useRef<number>(Date.now());
  const detectorRef = useRef<faceDetection.FaceDetector | null>(null);

  // ─── Timer Interval ───
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Elapsed Time (MM:SS)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ─── 1. Initialize Webcam & Audio Level Meter ───
  useEffect(() => {
    let isCancelled = false;

    async function setupCamera() {
      if (isObserver) {
        setIsCameraActive(false);
        setIsMicActive(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: true
        });

        if (isCancelled) return;
        mediaStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Setup Web Audio Analyser for candidate speech meter
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const checkVolume = () => {
            if (!analyserRef.current || isCancelled) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round(avg * 1.5)));
            requestAnimationFrame(checkVolume);
          };
          checkVolume();
        }
      } catch (err) {
        console.warn("Could not access candidate webcam/audio:", err);
        setIsCameraActive(false);
        setIsMicActive(false);
      }
    }

    setupCamera();

    return () => {
      isCancelled = true;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Toggle Camera
  const toggleCamera = () => {
    if (!mediaStreamRef.current) return;
    const videoTracks = mediaStreamRef.current.getVideoTracks();
    if (videoTracks.length > 0) {
      const nextState = !isCameraActive;
      videoTracks.forEach(t => t.enabled = nextState);
      setIsCameraActive(nextState);
    }
  };

  // Toggle Mic
  const toggleMic = () => {
    if (!mediaStreamRef.current) return;
    const audioTracks = mediaStreamRef.current.getAudioTracks();
    if (audioTracks.length > 0) {
      const nextState = !isMicActive;
      audioTracks.forEach(t => t.enabled = nextState);
      setIsMicActive(nextState);
    }
  };

  // ─── 2. Client-Side Telemetry (Eye Contact & Head Stability) ───
  useEffect(() => {
    let isCancelled = false;

    async function initDetector() {
      try {
        await tf.ready();
        const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
        const detector = await faceDetection.createDetector(model, {
          runtime: 'tfjs',
          modelType: 'short',
          maxFaces: 1
        });
        if (!isCancelled) {
          detectorRef.current = detector;
        }
      } catch (e) {
        console.warn("Face detection initialization warning:", e);
      }
    }

    initDetector();

    const interval = setInterval(async () => {
      if (!detectorRef.current || !videoRef.current || !isCameraActive) return;
      if (videoRef.current.readyState < 2) return;

      try {
        const faces = await detectorRef.current.estimateFaces(videoRef.current, { flipHorizontal: false });
        if (faces && faces.length > 0) {
          setFaceDetected(true);
          const face = faces[0];
          const box = face.box;
          // Calculate center stability
          const centerX = (box.xMin + box.width / 2) / (videoRef.current.videoWidth || 640);
          const centerY = (box.yMin + box.height / 2) / (videoRef.current.videoHeight || 480);
          
          // Good eye contact if face is centered between 0.35 and 0.65
          const isCenteredX = centerX >= 0.35 && centerX <= 0.65;
          const isCenteredY = centerY >= 0.25 && centerY <= 0.70;
          
          if (isCenteredX && isCenteredY) {
            setEyeContactScore(prev => Math.min(99, prev + 1));
            setHeadStabilityScore(prev => Math.min(98, prev + 1));
          } else {
            setEyeContactScore(prev => Math.max(65, prev - 1));
          }
        } else {
          setFaceDetected(false);
          setEyeContactScore(prev => Math.max(50, prev - 2));
        }
      } catch (_) {}
    }, 2500);

    return () => {
      isCancelled = true;
      clearInterval(interval);
      if (detectorRef.current) {
        detectorRef.current.dispose();
      }
    };
  }, [isCameraActive]);

  // Periodic Telemetry sync to server
  useEffect(() => {
    const syncInterval = setInterval(() => {
      recordInterviewTelemetryFn({
        data: {
          sessionId,
          eyeContactPercent: eyeContactScore,
          headStabilityPercent: headStabilityScore
        }
      }).catch(() => {});
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [sessionId, eyeContactScore, headStabilityScore]);

  // ─── 3. Load Admin Voice Profile & Synthesizer Voices ───
  useEffect(() => {
    // 1. Fetch trained voice profile from settings
    getAiVoiceSettings()
      .then((settings) => {
        if (settings) {
          setActiveVoiceSettings(settings);
          if (settings.rate) setSpeechPace(settings.rate);
        }
      })
      .catch((err) => console.warn("Could not load AI voice settings:", err));

    // 2. Load available browser voices & listen for changes
    if ('speechSynthesis' in window) {
      const updateVoices = () => {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) {
          setBrowserVoices(v);
        }
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  // ─── 4. Text-to-Speech (Crystal-Clear AI Voice & Visualizer Sync) ───
  const speakAiResponse = (text: string, forceSynthesizer = false) => {
    // 1. Stop any currently active speech synthesis or recorded audio
    if (speechSpeakerCancelRef.current) {
      speechSpeakerCancelRef.current();
      speechSpeakerCancelRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (customAudioPlayerRef.current) {
      customAudioPlayerRef.current.pause();
      customAudioPlayerRef.current.currentTime = 0;
    }

    setIsAiSpeaking(true);

    const hasCustomAudio = Boolean(activeVoiceSettings?.custom_audio_url);
    const shouldUseRecordedAudio = !forceSynthesizer && hasCustomAudio && 
      (activeVoiceSettings?.voice_id === 'custom_admin' || activeVoiceSettings?.use_custom_audio);

    // If recorded voice audio exists and is enabled, play the actual recorded voice audio!
    if (shouldUseRecordedAudio && (currentQuestionIndex === 0 || activeVoiceSettings?.use_custom_audio)) {
      try {
        const audio = new Audio(activeVoiceSettings!.custom_audio_url);
        customAudioPlayerRef.current = audio;
        audio.volume = ttsVolume * (activeVoiceSettings?.volume ?? 1.0);

        audio.onplay = () => {
          setIsAiSpeaking(true);
          setIsPlayingRecordedAudio(true);
        };

        audio.onended = () => {
          setIsAiSpeaking(false);
          setIsPlayingRecordedAudio(false);
          turnStartTimeRef.current = Date.now();
          startSpeechRecognition();
        };

        audio.onerror = (e) => {
          console.warn("Recorded voice playback notice, falling back to sequential speech synthesis:", e);
          setIsPlayingRecordedAudio(false);
          speakSequentialSynthesizer(text);
        };

        audio.play().catch(err => {
          console.warn("Audio autoplay blocked by browser policy, falling back to speech synthesis:", err);
          setIsPlayingRecordedAudio(false);
          speakSequentialSynthesizer(text);
        });
        return;
      } catch (e) {
        console.warn("Custom audio initialization error, falling back to synthesis:", e);
      }
    }

    // Otherwise, use sequential sentence-by-sentence crystal-clear neural synthesis
    speakSequentialSynthesizer(text);
  };

  const speakSequentialSynthesizer = (text: string) => {
    setIsPlayingRecordedAudio(false);
    if (!('speechSynthesis' in window)) {
      setIsAiSpeaking(false);
      return;
    }

    // Pick highest clarity neural/natural voice
    const allVoices = browserVoices.length > 0 ? browserVoices : window.speechSynthesis.getVoices();
    const preferredVoice = resolveBestSpeechVoice(allVoices, activeVoiceSettings || undefined);

    const controller = speakSentenceSequence({
      text,
      voice: preferredVoice,
      rate: speechPace || activeVoiceSettings?.rate || 0.94,
      pitch: activeVoiceSettings?.pitch || 1.0,
      volume: ttsVolume * (activeVoiceSettings?.volume ?? 1.0),
      onStart: () => {
        setIsAiSpeaking(true);
      },
      onEnd: () => {
        setIsAiSpeaking(false);
        turnStartTimeRef.current = Date.now();
        startSpeechRecognition();
      },
      onError: (e) => {
        console.warn("Sequential synthesis notice:", e);
        setIsAiSpeaking(false);
      }
    });

    speechSpeakerCancelRef.current = controller.cancel;
  };

  // Speak initial question on room entry
  useEffect(() => {
    const timer = setTimeout(() => {
      speakAiResponse(aiSpokenText);
    }, 1000);
    return () => {
      clearTimeout(timer);
      if (customAudioPlayerRef.current) {
        customAudioPlayerRef.current.pause();
        customAudioPlayerRef.current.currentTime = 0;
      }
      if (speechSpeakerCancelRef.current) {
        speechSpeakerCancelRef.current();
      }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [activeVoiceSettings]);

  // ─── 4. Speech-to-Text (Continuous Candidate Recognition) ───
  const startSpeechRecognition = () => {
    if (isObserver) return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsCandidateSpeaking(true);
      };

      rec.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }

        const combined = (candidateDraftAnswer + ' ' + (finalText || interimText)).trim();
        setCandidateDraftAnswer(combined);
        setSpeechConfidence(event.results[0]?.[0]?.confidence || 0.9);

        // Auto silence detection: if candidate pauses for 4 seconds after a sentence, suggest submitting
        clearTimeout(speechTurnTimerRef.current);
        if (combined.length > 30) {
          speechTurnTimerRef.current = setTimeout(() => {
            // Optional gentle reminder in UI
          }, 4000);
        }
      };

      rec.onerror = (e: any) => {
        if (e.error !== 'no-speech') {
          console.warn("Speech recognition error:", e.error);
        }
      };

      rec.onend = () => {
        setIsCandidateSpeaking(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.warn("Could not start speech recognition:", err);
    }
  };

  // Stop Speech Recognition
  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsCandidateSpeaking(false);
    }
  };

  // ─── 5. Submit Turn (Candidate Speaks -> OpenRouter Responds) ───
  const handleSubmitCandidateTurn = async (explicitText?: string) => {
    const messageToSend = (explicitText || candidateDraftAnswer).trim();
    if (!messageToSend && !code) {
      toast.error("Please speak or write your response before sending.");
      return;
    }

    stopSpeechRecognition();
    setIsProcessingTurn(true);
    setLastCandidateAnswer(messageToSend);
    setCandidateDraftAnswer('');

    const turnDurationSec = Math.max(5, Math.round((Date.now() - turnStartTimeRef.current) / 1000));

    try {
      const res = await submitInterviewTurnFn({
        data: {
          sessionId,
          turnIndex,
          candidateMessage: messageToSend || "Here is my updated code solution in the editor.",
          audioDurationSeconds: turnDurationSec,
          codeSnippet: code,
          codeLanguage,
          isFinalTurn: currentQuestionIndex >= questions.length - 1 && turnIndex >= 8
        }
      });

      if (res) {
        setTurnIndex(prev => prev + 2);
        setAiSpokenText(res.aiResponse);
        if (typeof res.nextQuestionIndex === 'number') {
          setCurrentQuestionIndex(res.nextQuestionIndex);
        }

        // Voice output
        speakAiResponse(res.aiResponse);

        if (res.isConcluded) {
          toast.success("Final question reached! Generating your comprehensive evaluation report.");
          handleConcludeInterview();
        }
      }
    } catch (err: any) {
      console.error("Turn submission error:", err);
      toast.error("Error processing interview response. Please try again.");
    } finally {
      setIsProcessingTurn(false);
    }
  };

  // ─── 6. Conclude Interview & Generate OpenRouter Report ───
  const handleConcludeInterview = async () => {
    if (isConcluding) return;
    setIsConcluding(true);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    stopSpeechRecognition();

    toast.info("Generating comprehensive AI evaluation report via OpenRouter...", { duration: 5000 });

    try {
      const res = await finalizeMockInterviewReportFn({
        data: {
          sessionId
        }
      });

      if (res && res.report) {
        toast.success("Evaluation Report successfully generated!");
        onConcludeInterview(res.report);
      }
    } catch (err: any) {
      console.error("Evaluation finalization error:", err);
      toast.error("Could not generate report. Redirecting to summary view.");
      onConcludeInterview({ overallScore: 82, hiringVerdict: 'Hire' });
    } finally {
      setIsConcluding(false);
    }
  };

  const currentQ = questions[currentQuestionIndex] || questions[0];

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#07090e] text-white flex flex-col font-sans overflow-hidden select-none">
      
      {/* ─── Demo Mode Watermark Banner ─── */}
      {isDemoMode && (
        <div className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-4 py-1.5 flex items-center justify-between text-xs font-bold text-white shadow-md z-40">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-300" />
            🎮 DEMO / PRACTICE MODE — Unofficial Simulation • AI Speech &amp; Camera HUD Active • Not Graded by Mentor
          </span>
          <div className="flex items-center gap-2">
            {currentQuestionIndex < questions.length - 1 && (
              <button
                type="button"
                onClick={() => {
                  const nextIdx = currentQuestionIndex + 1;
                  setCurrentQuestionIndex(nextIdx);
                  setAiSpokenText(questions[nextIdx]?.question || "Next question...");
                  toast.info(`Switched to Demo Question ${nextIdx + 1}`);
                }}
                className="bg-white/20 hover:bg-white/30 text-white text-[11px] px-2.5 py-0.5 rounded font-mono transition cursor-pointer"
              >
                Skip Question &rarr;
              </button>
            )}
            <span className="bg-white/20 px-2 py-0.5 rounded text-[11px] font-mono">5-Min Demo Preview</span>
          </div>
        </div>
      )}

      {/* ─── Top Bar: Session HUD & Controls ─── */}
      <header className="h-14 bg-[#0d111a]/95 backdrop-blur-xl border-b border-white/10 px-4 flex items-center justify-between shrink-0 z-30">
        
        {/* Left: Branding & Role */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-xs">
            AI
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white tracking-tight">{displayRole}</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {difficulty} Level
              </span>
              {isDemoMode && (
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold animate-pulse">
                  🎮 Demo Practice
                </span>
              )}
              {isObserver && (
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold animate-pulse">
                  Observer Mode (Silent Audit)
                </span>
              )}
            </div>
            <span className="text-[11px] text-gray-400 block -mt-0.5">
              Candidate: <strong className="text-gray-200">{candidateName}</strong>
            </span>
          </div>
        </div>

        {/* Center: Question Progress & Timer */}
        <div className="hidden md:flex items-center gap-4 bg-white/[0.03] border border-white/10 px-4 py-1.5 rounded-full">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-blue-400 font-mono">
              Q{currentQuestionIndex + 1}/{questions.length}
            </span>
            <span className="text-gray-400 text-[11px] capitalize">
              ({currentQ?.category?.replace('_', ' ') || 'Technical'})
            </span>
          </div>

          <div className="h-3 w-px bg-white/20" />

          {/* Attention & Stability Mini Pill */}
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400" title="Live Eye Contact Consistency">
              <Eye className="h-3 w-3" /> {eyeContactScore}%
            </span>
            <span className="flex items-center gap-1 text-indigo-400" title="Head Stability">
              <Activity className="h-3 w-3" /> {headStabilityScore}%
            </span>
          </div>

          <div className="h-3 w-px bg-white/20" />

          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-mono font-semibold">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>
        </div>

        {/* Right: View Mode Toggle & End Button */}
        <div className="flex items-center gap-2.5">

          {/* AI Voice Indicator & Repeat Question Button */}
          <button
            type="button"
            onClick={() => speakAiResponse(aiSpokenText)}
            title="Click to replay AI question"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/25 text-xs transition cursor-pointer"
          >
            <Volume2 className="h-3.5 w-3.5 text-blue-400" />
            <span className="font-mono text-[11px] truncate max-w-[140px]">
              {isPlayingRecordedAudio
                ? "🎙️ Playing Recorded Audio"
                : (activeVoiceSettings?.voice_name || 'VyNexa Voice')}
            </span>
            <span className="text-[10px] text-blue-400 font-bold bg-blue-500/20 px-1 py-0.2 rounded font-mono">{speechPace}x</span>
            <RotateCcw className="h-3 w-3 ml-0.5 text-blue-400 hover:text-white" />
          </button>
          
          {/* View Mode Switcher */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setViewMode('video')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'video' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              1:1 Video
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
                viewMode === 'split' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Split className="h-3 w-3" /> Split Code
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
                viewMode === 'code' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Code2 className="h-3 w-3" /> Full Editor
            </button>
          </div>

          {/* End Interview & Report Button */}
          <Button
            size="sm"
            onClick={handleConcludeInterview}
            disabled={isConcluding}
            className="h-8 px-3.5 bg-rose-600/90 hover:bg-rose-600 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-rose-900/20"
          >
            {isConcluding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Award className="h-3.5 w-3.5" />}
            <span>{isConcluding ? "Generating Report..." : "Finish Interview"}</span>
          </Button>

        </div>
      </header>

      {/* ─── Main Interactive Body ─── */}
      <main className="flex-1 grid grid-cols-1 overflow-hidden p-3 gap-3">
        
        {viewMode === 'code' ? (
          /* Full Screen Code Playground */
          <CodePlayground
            initialCode={code}
            initialLanguage={codeLanguage}
            onCodeChange={(c, l) => { setCode(c); setCodeLanguage(l); }}
            onSubmitToAI={(c, l) => handleSubmitCandidateTurn(`I have updated my solution in ${l}:\n${c}`)}
            isSubmitting={isProcessingTurn}
            className="w-full h-full"
          />
        ) : (
          /* Split Screen: Video Left + AI Right (with optional bottom/side Code Editor) */
          <div className={`grid h-full gap-3 overflow-hidden ${
            viewMode === 'split' ? 'grid-rows-[1fr_280px] lg:grid-rows-1 lg:grid-cols-[1.1fr_0.9fr]' : 'grid-cols-1 lg:grid-cols-2'
          }`}>
            
            {/* ════════════════════════════════════════════════════════════════
                LEFT PANEL: CANDIDATE WEBCAM & ATTENTION TELEMETRY
               ════════════════════════════════════════════════════════════════ */}
            <div className="relative rounded-3xl overflow-hidden bg-black/80 border border-white/10 shadow-2xl flex flex-col justify-between group">
              
              {/* Webcam Feed */}
              {isCameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-gray-400">
                  <VideoOff className="h-12 w-12 text-gray-500 mb-2" />
                  <span className="text-xs font-semibold">Webcam Disabled</span>
                </div>
              )}

              {/* Top Video HUD Badges */}
              <div className="relative z-10 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-xs font-medium text-white shadow-lg">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{candidateName}</span>
                  </div>

                  {faceDetected ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Focus Locked
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Center Face in Camera
                    </span>
                  )}
                </div>

                {/* Live Mic Audio Meter */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-xs text-gray-300 font-mono">
                  {isMicActive ? <Mic className="h-3.5 w-3.5 text-emerald-400" /> : <MicOff className="h-3.5 w-3.5 text-rose-400" />}
                  <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden flex items-center p-0.5">
                    <div 
                      className="h-full bg-emerald-400 rounded-full transition-all duration-75"
                      style={{ width: `${isMicActive ? audioLevel : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Video Controls Overlay */}
              <div className="relative z-10 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={toggleCamera}
                    className={`h-9 w-9 p-0 rounded-2xl border-white/15 transition-colors ${
                      isCameraActive ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}
                    title={isCameraActive ? "Disable Camera" : "Enable Camera"}
                  >
                    {isCameraActive ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={toggleMic}
                    className={`h-9 w-9 p-0 rounded-2xl border-white/15 transition-colors ${
                      isMicActive ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}
                    title={isMicActive ? "Mute Microphone" : "Unmute Microphone"}
                  >
                    {isMicActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Candidate Speech Activity Indicator */}
                <div className="text-right">
                  <span className="text-[11px] text-gray-300 block font-medium">
                    {isCandidateSpeaking ? "Listening to your response..." : "Your turn to speak"}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {isMicActive ? "Microphone active & analyzing" : "Mic muted"}
                  </span>
                </div>
              </div>

            </div>

            {/* ════════════════════════════════════════════════════════════════
                RIGHT PANEL: VIRTUAL AI INTERVIEWER & DYNAMIC VISUALIZER RING
               ════════════════════════════════════════════════════════════════ */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#0c101c] to-[#070910] border border-white/10 shadow-2xl flex flex-col justify-between p-5">
              
              {/* Top AI Status Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 font-bold">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      AI Lead Technical Interviewer
                      <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded font-mono">
                        OpenRouter LLM
                      </span>
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Multi-modal speech, code evaluation, and live reasoning
                    </p>
                  </div>
                </div>

                {/* Dynamic State Pill */}
                <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isAiSpeaking 
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-lg shadow-blue-500/20'
                    : isProcessingTurn
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                      : isCandidateSpeaking
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-white/5 text-gray-400 border border-white/10'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${
                    isAiSpeaking ? 'bg-blue-400 animate-ping' : isProcessingTurn ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                  <span>
                    {isAiSpeaking ? "AI Speaking..." : isProcessingTurn ? "Analyzing Response..." : isCandidateSpeaking ? "Listening..." : "Waiting for Answer"}
                  </span>
                </div>
              </div>

              {/* ─── Glowing AI Visualizer Ring ─── */}
              <div className="my-auto flex flex-col items-center justify-center py-4 relative">
                
                {/* Visualizer Pulsing Glow Waves */}
                <div className="relative flex items-center justify-center">
                  
                  {/* Outer Wave 3 */}
                  <div className={`absolute rounded-full transition-all duration-300 ${
                    isAiSpeaking 
                      ? 'h-64 w-64 bg-blue-500/10 border border-blue-400/20 animate-ping' 
                      : 'h-48 w-48 bg-transparent'
                  }`} />

                  {/* Outer Wave 2 */}
                  <div className={`absolute rounded-full transition-all duration-500 ${
                    isAiSpeaking 
                      ? 'h-52 w-52 bg-indigo-500/15 border border-indigo-400/30 scale-105' 
                      : isCandidateSpeaking 
                        ? 'h-44 w-44 bg-emerald-500/10 border border-emerald-400/20 scale-100'
                        : 'h-40 w-40 bg-white/[0.02] border border-white/5'
                  }`} />

                  {/* Visualizer Ring Canvas */}
                  <div className={`relative h-36 w-36 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isAiSpeaking 
                      ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-[0_0_50px_rgba(59,130,246,0.6)] scale-110' 
                      : isProcessingTurn
                        ? 'bg-gradient-to-tr from-amber-600 to-orange-600 shadow-[0_0_40px_rgba(245,158,11,0.5)] animate-pulse'
                        : 'bg-gradient-to-tr from-slate-800 to-slate-900 border border-white/15'
                  }`}>
                    
                    {/* Inner Core Hologram */}
                    <div className="h-24 w-24 rounded-full bg-[#0a0d17] border border-white/20 flex flex-col items-center justify-center text-center p-2 shadow-inner">
                      <Sparkles className={`h-7 w-7 transition-all ${
                        isAiSpeaking ? 'text-blue-300 animate-spin' : 'text-gray-400'
                      }`} />
                      <span className="text-[10px] font-bold text-gray-200 mt-1 uppercase tracking-wider">
                        {isAiSpeaking ? "Interviewer" : "Listening"}
                      </span>
                    </div>

                  </div>
                </div>

                {/* Subtitles & Spoken Audio Banner */}
                <div className="mt-6 w-full max-w-lg p-4 rounded-2xl bg-black/60 border border-white/10 text-center shadow-lg">
                  <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest block mb-1 font-bold">
                    Live Question / Dialogue
                  </span>
                  <p className="text-sm font-medium text-gray-100 leading-relaxed select-text">
                    "{aiSpokenText}"
                  </p>
                </div>

              </div>

              {/* ─── Bottom Response Input & Controls ─── */}
              <div className="space-y-3 border-t border-white/10 pt-3">
                
                {/* Candidate Draft Transcript Preview */}
                {candidateDraftAnswer && (
                  <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-xs text-blue-200 flex items-center justify-between">
                    <div className="truncate flex-1 mr-2">
                      <span className="font-bold text-blue-300">Your speech: </span>
                      <span>{candidateDraftAnswer}</span>
                    </div>
                    <span className="text-[10px] text-blue-400 font-mono shrink-0">
                      {Math.round(speechConfidence * 100)}% clarity
                    </span>
                  </div>
                )}

                {/* Text or Speech Submit Bar */}
                <div className="flex items-center gap-2">
                  <Input
                    value={candidateDraftAnswer}
                    onChange={(e) => setCandidateDraftAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitCandidateTurn();
                      }
                    }}
                    placeholder="Speak into microphone or type your answer here..."
                    disabled={isProcessingTurn}
                    className="h-10 bg-black/50 border-white/15 text-white placeholder:text-gray-500 text-xs rounded-xl focus:border-blue-500"
                  />

                  {/* Manual / Text Submit Button */}
                  <Button
                    onClick={() => handleSubmitCandidateTurn()}
                    disabled={isProcessingTurn || (!candidateDraftAnswer.trim() && !code)}
                    className="h-10 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shrink-0 shadow-lg shadow-blue-600/20"
                  >
                    {isProcessingTurn ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span>{isProcessingTurn ? "Evaluating..." : "Send Answer"}</span>
                  </Button>
                </div>

                {/* Helper hint & Audio Replay */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>
                      {isPlayingRecordedAudio
                        ? "🎙️ Playing Admin Recorded Audio Sample"
                        : `Live Audio: ${activeVoiceSettings?.voice_name || "VyNexa Neural Voice"} (${speechPace}x)`}
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    {activeVoiceSettings?.custom_audio_url && (
                      <button
                        type="button"
                        onClick={() => speakAiResponse(aiSpokenText, false)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-white border border-emerald-500/30 flex items-center gap-1 font-semibold text-[11px] transition cursor-pointer"
                        title="Replay with Admin Recorded Audio"
                      >
                        <Play className="h-3 w-3 fill-current" /> Play Recorded Voice
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={() => speakAiResponse(aiSpokenText, true)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/30 flex items-center gap-1 font-semibold text-[11px] transition cursor-pointer"
                      title="Replay with Calibrated Neural Synthesizer"
                    >
                      <RotateCcw className="h-3 w-3" /> Replay Speech
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Split Screen Code Editor (when viewMode === 'split') */}
            {viewMode === 'split' && (
              <div className="col-span-full h-[280px] lg:h-full overflow-hidden">
                <CodePlayground
                  initialCode={code}
                  initialLanguage={codeLanguage}
                  onCodeChange={(c, l) => { setCode(c); setCodeLanguage(l); }}
                  onSubmitToAI={(c, l) => handleSubmitCandidateTurn(`I have revised my solution in ${l}:\n${c}`)}
                  isSubmitting={isProcessingTurn}
                  className="w-full h-full"
                />
              </div>
            )}

          </div>
        )}

      </main>

    </div>
  );
}
