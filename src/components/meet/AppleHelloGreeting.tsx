import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShieldCheck, CheckCircle2, ArrowRight, Volume2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface AppleHelloGreetingProps {
  attendeeName: string;
  userRole?: string;
  internId?: string | null;
  onComplete: () => void;
  durationMs?: number;
}

// Iconic Multilingual greetings in genuine Apple style (approx 12-14 seconds total experience)
const GREETINGS = [
  { word: 'hello', lang: 'English', sub: 'Welcome to Vyntyra Connect' },
  { word: 'hola', lang: 'Español', sub: 'Bienvenido' },
  { word: 'bonjour', lang: 'Français', sub: 'Bienvenue' },
  { word: 'ciao', lang: 'Italiano', sub: 'Benvenuto' },
  { word: 'नमस्ते', lang: 'Hindi', sub: 'आपका स्वागत है' },
  { word: 'வணக்கம்', lang: 'Tamil', sub: 'நல்வரவு' },
];

export function AppleHelloGreeting({
  attendeeName,
  userRole = 'Verified Guest',
  internId,
  onComplete,
  durationMs = 13000, // 13 seconds: slow, luxurious, true Apple unboxing experience (10-15s range)
}: AppleHelloGreetingProps) {
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [showPersonalWelcome, setShowPersonalWelcome] = useState(false);
  const [progress, setProgress] = useState(0);

  // Play iconic Apple-style ambient startup chime with warm harmonics
  useEffect(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        
        // Multi-stage Apple chime: warm sub bass + sparkling C major pentatonic chord
        // C4, G4, C5, E5, G5, C6
        const freqs = [261.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = idx === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);

          gain.gain.setValueAtTime(0.08 / (idx + 1), now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5 + idx * 0.2);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.1);
          osc.stop(now + 3.0);
        });

        // Second gentle chime when switching to personal welcome at 7.2s
        const personalChimeTimer = setTimeout(() => {
          try {
            const now2 = ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, now2 + idx * 0.08);
              gain.gain.setValueAtTime(0.06 / (idx + 1), now2 + idx * 0.08);
              gain.gain.exponentialRampToValueAtTime(0.0001, now2 + 1.8);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(now2 + idx * 0.08);
              osc.stop(now2 + 2.0);
            });
          } catch (_) {}
        }, 7200);

        return () => clearTimeout(personalChimeTimer);
      }
    } catch (_) {}
  }, []);

  // Cycle multilingual "hello" words slowly (approx 1.25s per greeting across 7.5 seconds)
  useEffect(() => {
    const cycleTimer = setInterval(() => {
      setGreetingIndex((prev) => (prev + 1) % GREETINGS.length);
    }, 1300);

    // Transition to personal welcome at 7.2 seconds
    const personalTimer = setTimeout(() => {
      clearInterval(cycleTimer);
      setShowPersonalWelcome(true);
    }, 7200);

    // Smooth progress line tracker (updates smoothly across the 13 seconds)
    const startTime = Date.now();
    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);
    }, 50);

    const finishTimer = setTimeout(() => {
      onComplete();
    }, durationMs);

    return () => {
      clearInterval(cycleTimer);
      clearInterval(progressTimer);
      clearTimeout(personalTimer);
      clearTimeout(finishTimer);
    };
  }, [durationMs, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 bg-[#050608] text-white flex flex-col items-center justify-center overflow-hidden select-none px-4"
    >
      {/* Apple-style deep atmospheric ambient aurora glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[30%] left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-gradient-to-b from-blue-600/20 via-indigo-600/15 to-transparent rounded-full blur-[180px] opacity-80 animate-pulse" />
        <div className="absolute -bottom-[25%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-t from-purple-600/15 via-blue-900/10 to-transparent rounded-full blur-[160px] opacity-60" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-xl w-full px-4">
        
        {/* Apple Iconic Calligraphic Script "hello" Stroke Area */}
        <div className="mb-8 h-40 flex items-center justify-center w-full">
          <AnimatePresence mode="wait">
            {!showPersonalWelcome ? (
              <motion.div
                key={greetingIndex}
                initial={{ opacity: 0, y: 18, scale: 0.93, filter: 'blur(12px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -18, scale: 1.04, filter: 'blur(12px)' }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center justify-center"
              >
                {/* SVG Apple-Style Calligraphy Cursive Hello with handwriting stroke gradient */}
                <svg
                  viewBox="0 0 500 150"
                  className="w-80 sm:w-[440px] h-32 overflow-visible drop-shadow-[0_0_50px_rgba(255,255,255,0.45)]"
                >
                  <defs>
                    <linearGradient id="appleHelloGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="30%" stopColor="#f0f5ff" />
                      <stop offset="60%" stopColor="#d0e2ff" />
                      <stop offset="85%" stopColor="#a8cbff" />
                      <stop offset="100%" stopColor="#ffffff" />
                    </linearGradient>
                    <filter id="appleGlow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  
                  {/* Elegant Calligraphic Script for Hello - True Apple Style */}
                  <text
                    x="50%"
                    y="65%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="url(#appleHelloGradient)"
                    filter="url(#appleGlow)"
                    className="font-serif italic font-normal tracking-wide"
                    style={{
                      fontFamily: "'Snell Roundhand', 'Brush Script MT', 'Bickham Script Pro', 'Apple Chancery', 'Playfair Display', cursive, serif",
                      fontSize: "88px",
                      letterSpacing: "4px",
                    }}
                  >
                    {GREETINGS[greetingIndex].word}
                  </text>
                </svg>

                <div className="flex items-center gap-2 -mt-1">
                  <span className="text-[12px] font-mono tracking-[0.25em] uppercase text-blue-300/90 font-medium">
                    {GREETINGS[greetingIndex].lang}
                  </span>
                  <span className="text-gray-500 text-xs">·</span>
                  <span className="text-xs text-gray-400 font-light tracking-wide">
                    {GREETINGS[greetingIndex].sub}
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="welcome-name"
                initial={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(14px)' }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center"
              >
                {/* Glowing Iridescent Vyntyra App Icon Badge */}
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-3xl blur-xl opacity-60 animate-pulse" />
                  <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-[2px] shadow-2xl">
                    <div className="w-full h-full bg-[#0a0d14] rounded-[22px] flex items-center justify-center p-3">
                      <img src="/icon-512.png" alt="VCS Logo" className="w-full h-full object-contain rounded-xl" />
                    </div>
                  </div>
                </div>
                
                <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white flex items-center justify-center gap-2 flex-wrap">
                  <span className="text-white/90">Welcome,</span>
                  <span className="bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 bg-clip-text text-transparent">
                    {attendeeName || "Attendee"}
                  </span>
                </h2>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Subtitle, Badges & Verification Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="space-y-4 w-full flex flex-col items-center"
        >
          {/* Identity & Role Badges */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-200 shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Identity Verified</span>
            </span>

            {internId ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-xs font-mono text-purple-300 shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
                <span>Intern ID: {internId}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-xs text-blue-300 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                <span>{userRole || 'VCS Official Workspace'}</span>
              </span>
            )}
          </div>

          {/* Real-time Hardware & Security Checkmarks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-gray-400 max-w-md w-full pt-1">
            <div className="flex items-center justify-center gap-1.5 bg-black/40 border border-white/5 px-2.5 py-1 rounded-xl">
              <Volume2 className="h-3 w-3 text-blue-400" />
              <span>Dolby 3D Audio</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 bg-black/40 border border-white/5 px-2.5 py-1 rounded-xl">
              <Sparkles className="h-3 w-3 text-purple-400" />
              <span>HD Studio Lights</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 bg-black/40 border border-white/5 px-2.5 py-1 rounded-xl">
              <Shield className="h-3 w-3 text-emerald-400" />
              <span>Exam Proctoring</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto leading-relaxed pt-1">
            {showPersonalWelcome 
              ? "Establishing secure high-speed WebRTC connection with Dolby Audio..."
              : "Preparing your meeting environment at Vyntyra Consultancy Services..."}
          </p>

          {/* Apple-style Smooth Progress Bar across the 13-second experience */}
          <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden mt-3">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* Quick Skip / Enter Immediately Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={onComplete}
            className="mt-2 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded-full px-5 h-8 flex items-center gap-1.5 border border-white/10 transition-all hover:scale-105 active:scale-95"
          >
            <span>Enter Meeting Immediately</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </motion.div>

      </div>
    </motion.div>
  );
}
