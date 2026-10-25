import React, { useEffect } from 'react';
import { 
  Volume2, Bell, Sparkles, Trophy, Clock, CheckCircle2, 
  HelpCircle, ThumbsUp, PartyPopper, Music 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MeetingSoundboardPluginProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  userName?: string;
}

interface SoundCue {
  id: string;
  name: string;
  icon: any;
  description: string;
  color: string;
  play: (ctx: AudioContext) => void;
}

const SOUND_CUES: SoundCue[] = [
  {
    id: 'applause',
    name: 'Applause / Kudos',
    icon: PartyPopper,
    description: 'Crowd celebration and clapping applause',
    color: 'from-amber-500 to-orange-500',
    play: (ctx) => {
      // Noise buffer synthesis for applause
      const bufferSize = ctx.sampleRate * 1.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 0.8;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    }
  },
  {
    id: 'hand_chime',
    name: 'Question / Attention',
    icon: Bell,
    description: 'Crystal glass chime for questions & raised hands',
    color: 'from-blue-500 to-indigo-500',
    play: (ctx) => {
      const now = ctx.currentTime;
      [880, 1174.66, 1760].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.1 / (idx + 1), now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + 1.3);
      });
    }
  },
  {
    id: 'timer_bell',
    name: "Time's Up Gong",
    icon: Clock,
    description: 'Deep resonant gong for session countdown & agenda',
    color: 'from-rose-500 to-red-600',
    play: (ctx) => {
      const now = ctx.currentTime;
      [220, 440, 660].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.14 / (idx + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.1);
      });
    }
  },
  {
    id: 'idea_ding',
    name: 'Eureka / Lightbulb',
    icon: Sparkles,
    description: 'Upward bright chime for great ideas and breakthroughs',
    color: 'from-yellow-400 to-amber-500',
    play: (ctx) => {
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.08, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + 1.1);
      });
    }
  },
  {
    id: 'fanfare',
    name: 'Milestone Fanfare',
    icon: Trophy,
    description: 'Triumphant brass fanfare for completed sprints and goals',
    color: 'from-emerald-500 to-teal-500',
    play: (ctx) => {
      const now = ctx.currentTime;
      // C5, E5, G5, C6 triumphant arpeggio
      const notes = [
        { f: 523.25, t: 0.0, d: 0.15 },
        { f: 523.25, t: 0.15, d: 0.15 },
        { f: 523.25, t: 0.30, d: 0.15 },
        { f: 659.25, t: 0.45, d: 0.35 },
        { f: 783.99, t: 0.80, d: 0.25 },
        { f: 1046.50, t: 1.05, d: 0.70 }
      ];
      notes.forEach(({ f, t, d }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + t);
        gain.gain.setValueAtTime(0.12, now + t);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t + d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + d + 0.1);
      });
    }
  }
];

export function MeetingSoundboardPlugin({
  isOpen,
  onClose,
  roomId,
  userName = 'You',
}: MeetingSoundboardPluginProps) {
  // Listen for broadcasted sound cues
  useEffect(() => {
    const channel = supabase.channel(`meet-soundboard-${roomId}`)
      .on('broadcast', { event: 'play_cue' }, ({ payload }) => {
        if (!payload || !payload.cueId) return;
        const cue = SOUND_CUES.find(c => c.id === payload.cueId);
        if (cue) {
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
              const ctx = new AudioCtx();
              cue.play(ctx);
            }
          } catch (_) {}
          toast.info(`${payload.sender || 'Attendee'} triggered: ${cue.name}`);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const handlePlayCue = (cue: SoundCue) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        cue.play(ctx);
      }
    } catch (_) {}

    // Broadcast sound to all peers in the meeting room
    supabase.channel(`meet-soundboard-${roomId}`).send({
      type: 'broadcast',
      event: 'play_cue',
      payload: { cueId: cue.id, sender: userName }
    }).catch(() => {});

    toast.success(`Playing ${cue.name}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-[94vw] bg-[#0c0e14]/98 backdrop-blur-3xl border-white/15 text-white rounded-3xl p-5 shadow-2xl font-sans">
        <DialogHeader className="pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Music className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                <span>Meeting Soundboard & Audio Cues</span>
              </DialogTitle>
              <p className="text-xs text-gray-400">Audible cues broadcasted live across meeting participants.</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-2.5 py-3">
          {SOUND_CUES.map((cue) => {
            const IconComponent = cue.icon;
            return (
              <button
                key={cue.id}
                onClick={() => handlePlayCue(cue)}
                className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center gap-3 text-left group hover:scale-[1.01] active:scale-[0.99]"
              >
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-tr ${cue.color} flex items-center justify-center text-white shadow-md shrink-0`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-xs text-white block group-hover:text-blue-300 transition-colors">
                    {cue.name}
                  </span>
                  <span className="text-[11px] text-gray-400 truncate block">
                    {cue.description}
                  </span>
                </div>
                <Volume2 className="h-4 w-4 text-gray-500 group-hover:text-white shrink-0 transition-colors" />
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
