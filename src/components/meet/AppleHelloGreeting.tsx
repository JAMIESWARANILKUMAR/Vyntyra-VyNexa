import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';

export interface AppleHelloGreetingProps {
  attendeeName: string;
  userRole?: string;
  internId?: string | null;
  onComplete: () => void;
  durationMs?: number;
}

// Iconic Multilingual greetings in Apple style
const GREETINGS = [
  { word: 'hello', lang: 'English' },
  { word: 'welcome', lang: 'English' },
  { word: 'नमस्ते', lang: 'Hindi' },
  { word: 'வணக்கம்', lang: 'Tamil' },
  { word: 'స్వాగతం', lang: 'Telugu' },
  { word: 'স্বাগতম', lang: 'Bengali' },
];

export function AppleHelloGreeting({
  attendeeName,
  userRole = 'Verified Guest',
  internId,
  onComplete,
  durationMs = 2800,
}: AppleHelloGreetingProps) {
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [showPersonalWelcome, setShowPersonalWelcome] = useState(false);

  // Gentle Apple-style startup chime
  useEffect(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        
        // Harmonic bell chime chords (Apple-inspired C major triad)
        const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);

          gain.gain.setValueAtTime(0.08 / (idx + 1), now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2 + idx * 0.1);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + 1.4);
        });
      }
    } catch (_) {}
  }, []);

  // Cycle multilingual "hello" words, then show personal attendee welcome
  useEffect(() => {
    const cycleTimer = setInterval(() => {
      setGreetingIndex((prev) => (prev + 1) % GREETINGS.length);
    }, 450);

    const personalTimer = setTimeout(() => {
      clearInterval(cycleTimer);
      setShowPersonalWelcome(true);
    }, 1200);

    const finishTimer = setTimeout(() => {
      onComplete();
    }, durationMs);

    return () => {
      clearInterval(cycleTimer);
      clearTimeout(personalTimer);
      clearTimeout(finishTimer);
    };
  }, [durationMs, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 bg-[#050608] text-white flex flex-col items-center justify-center overflow-hidden select-none"
    >
      {/* Apple-style subtle ambient backdrop light */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-blue-500/20 via-indigo-600/15 to-transparent rounded-full blur-[140px] opacity-70 animate-pulse" />
        <div className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-t from-purple-500/15 to-transparent rounded-full blur-[120px] opacity-50" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg px-6">
        
        {/* Apple Iconic Handwriting "hello" SVG Stroke Drawing Animation */}
        <div className="mb-6 h-28 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {!showPersonalWelcome ? (
              <motion.div
                key={greetingIndex}
                initial={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, scale: 1.05, filter: 'blur(8px)' }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="flex flex-col items-center"
              >
                {/* SVG Apple-Style Calligraphy Cursive Hello */}
                <svg
                  viewBox="0 0 450 140"
                  className="w-72 sm:w-84 h-24 overflow-visible drop-shadow-[0_0_35px_rgba(255,255,255,0.45)]"
                >
                  <defs>
                    <linearGradient id="appleHelloGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="40%" stopColor="#d1e3ff" />
                      <stop offset="80%" stopColor="#a3c7ff" />
                      <stop offset="100%" stopColor="#ffffff" />
                    </linearGradient>
                  </defs>
                  
                  {/* Elegant Calligraphic Script for Hello */}
                  <text
                    x="50%"
                    y="65%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="url(#appleHelloGradient)"
                    className="font-serif italic font-normal tracking-wide"
                    style={{
                      fontFamily: "'Playfair Display', 'Baskerville', 'Georgia', cursive, serif",
                      fontSize: "72px",
                      letterSpacing: "2px",
                    }}
                  >
                    {GREETINGS[greetingIndex].word}
                  </text>
                </svg>

                <span className="text-[11px] font-mono tracking-widest uppercase text-blue-300/80 -mt-2">
                  {GREETINGS[greetingIndex].lang}
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="welcome-name"
                initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center"
              >
                <div className="h-16 w-16 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-[1.5px] shadow-2xl shadow-blue-500/30 mb-3 flex items-center justify-center">
                  <div className="w-full h-full bg-[#0b0e14] rounded-[22px] flex items-center justify-center">
                    <img src="/icon-512.png" alt="VCS" className="h-9 w-9 object-contain rounded-xl" />
                  </div>
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Welcome,</span>
                  <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
                    {attendeeName || "Attendee"}
                  </span>
                </h2>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Subtitle & Status Badges */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              <span>Vyntyra Zero-Trust Authorized</span>
            </span>

            {internId && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Intern ID: {internId}</span>
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
            Initializing high-speed WebRTC connection, AI lighting enhancers, and 48kHz Dolby spatial sound...
          </p>

          {/* Apple-style minimalist loading bar */}
          <div className="w-48 h-1 bg-white/10 rounded-full mx-auto overflow-hidden mt-4">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: durationMs / 1000, ease: 'easeInOut' }}
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500 rounded-full"
            />
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
