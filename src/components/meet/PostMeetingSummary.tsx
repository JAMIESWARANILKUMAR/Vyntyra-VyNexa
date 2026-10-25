import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, Video, Clock, ShieldCheck, Copy, 
  RotateCw, ArrowLeft, Sparkles, Award, Volume2, UserCheck, Heart 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export interface PostMeetingSummaryProps {
  joineeName: string;
  meetingTitle?: string;
  roomId: string;
  durationMinutes?: number;
  internId?: string | null;
  audioMode?: string;
  onRejoin?: () => void;
  onReturnHome?: () => void;
}

export function PostMeetingSummary({
  joineeName,
  meetingTitle = "Live Conference Session",
  roomId,
  durationMinutes = 1,
  internId,
  audioMode = "Dolby Audio (Spatial 3D)",
  onRejoin,
  onReturnHome,
}: PostMeetingSummaryProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; color: string; duration: number }>>([]);

  // Generate celebration confetti particles
  useEffect(() => {
    const colors = ['#3b82f6', '#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ec4899'];
    const newParticles = Array.from({ length: 32 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 600,
      y: (Math.random() - 0.5) * 600,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: Math.random() * 2 + 1.5,
    }));
    setParticles(newParticles);
  }, []);

  const handleCopySummary = () => {
    const summaryText = `📋 Vyntyra Meet Attendance Summary\n👤 Attendee: ${joineeName}${internId ? ` (${internId})` : ''}\n📌 Topic: ${meetingTitle}\n🔑 Room: ${roomId}\n⏱️ Session Duration: ${durationMinutes} minute(s)\n📅 Timestamp: ${new Date().toLocaleString()}\n✅ Status: Verified Attendance`;
    navigator.clipboard.writeText(summaryText);
    toast.success("Attendance summary copied to clipboard!");
  };

  const handleReturn = () => {
    if (onReturnHome) {
      onReturnHome();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#07090e] text-white flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans select-none">
      
      {/* Background Animated Aurora Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[450px] bg-gradient-to-tr from-blue-600/20 via-purple-600/15 to-emerald-500/15 rounded-full blur-[140px] opacity-75" />
      </div>

      {/* Floating Confetti Particle Bursts */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
            animate={{
              opacity: [1, 0.8, 0],
              scale: [0, 1.2, 0.6],
              x: p.x,
              y: p.y,
              rotate: Math.random() * 360,
            }}
            transition={{
              duration: p.duration,
              ease: 'easeOut',
              repeat: Infinity,
              repeatDelay: Math.random() * 3 + 2,
            }}
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.size > 8 ? '4px' : '50%',
            }}
            className="absolute shadow-lg"
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-lg bg-[#0e111a]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6"
      >
        
        {/* Animated Celebration Icon Badge */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
            className="w-full h-full rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 p-[1.5px] shadow-2xl shadow-blue-500/30 flex items-center justify-center"
          >
            <div className="w-full h-full bg-[#0b0e14] rounded-[22px] flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 animate-pulse" />
            </div>
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-500 text-black p-1.5 rounded-full shadow-lg"
          >
            <Sparkles className="h-4 w-4" />
          </motion.div>
        </div>

        {/* Heading: Thanks for Joining with joinee name */}
        <div className="space-y-1.5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-300"
          >
            <Heart className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400" />
            <span>Meeting Concluded Successfully</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
          >
            Thanks for joining, <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
              {joineeName || "Attendee"}!
            </span>
          </motion.h1>

          <p className="text-xs sm:text-sm text-gray-400">
            Your attendance and participation have been securely logged in Vyntyra Telemetry.
          </p>
        </div>

        {/* Meeting Metrics Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-black/50 border border-white/10 rounded-2xl p-4 text-left space-y-3"
        >
          <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-2.5">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Meeting Topic</span>
              <span className="text-sm font-semibold text-white truncate max-w-[240px] block">{meetingTitle}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Room</span>
              <span className="text-xs font-mono font-semibold text-blue-400">{roomId}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
            <div>
              <span className="text-[10px] text-gray-400 block mb-0.5">Duration Attended</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1 font-mono">
                <Clock className="h-3.5 w-3.5" />
                {durationMinutes} min{durationMinutes === 1 ? '' : 's'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-gray-400 block mb-0.5">Audio Engine</span>
              <span className="font-semibold text-blue-300 flex items-center gap-1 truncate">
                <Volume2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span className="truncate">{audioMode.split(' ')[0]}</span>
              </span>
            </div>

            {internId && (
              <div className="col-span-2 pt-1 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Verified Intern ID
                </span>
                <span className="font-mono text-xs font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {internId}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="space-y-2.5 pt-1"
        >
          <Button
            onClick={handleReturn}
            className="w-full h-12 bg-[#0b5cff] hover:bg-[#094bdd] text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Workspace Dashboard</span>
          </Button>

          <div className="flex items-center gap-2">
            {onRejoin && (
              <Button
                variant="outline"
                onClick={onRejoin}
                className="flex-1 h-10 border-white/10 bg-white/5 hover:bg-white/10 text-gray-200 text-xs rounded-xl flex items-center justify-center gap-1.5"
              >
                <RotateCw className="h-3.5 w-3.5 text-blue-400" />
                <span>Rejoin Call</span>
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleCopySummary}
              className="flex-1 h-10 border-white/10 bg-white/5 hover:bg-white/10 text-gray-200 text-xs rounded-xl flex items-center justify-center gap-1.5"
            >
              <Copy className="h-3.5 w-3.5 text-emerald-400" />
              <span>Copy Receipt</span>
            </Button>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
