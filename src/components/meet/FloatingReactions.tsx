import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Search, X, Hand, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ReactionItem {
  id: string;
  emoji: string;
  senderName?: string;
  xOffset: number;
  rotation: number;
  sizeMultiplier: number;
}

// ── Global Professional Emoji Categories ─────────────────────────────────────
export const PROFESSIONAL_EMOJIS = {
  quick: [
    { emoji: '✋', label: 'Raise Hand', action: 'raise_hand' },
    { emoji: '👍', label: 'Agree / Thumbs Up' },
    { emoji: '👏', label: 'Applause / Kudos' },
    { emoji: '❤️', label: 'Appreciation' },
    { emoji: '🎉', label: 'Celebrate Milestone' },
    { emoji: '💡', label: 'Great Idea' },
    { emoji: '🚀', label: 'Launched / On Track' },
    { emoji: '💯', label: '100% Perfect' },
  ],
  corporate: [
    { emoji: '✋', label: 'Raise Hand', action: 'raise_hand' },
    { emoji: '👍', label: 'Agree / Yes' },
    { emoji: '👎', label: 'Disagree / No' },
    { emoji: '🤝', label: 'Agreed / Deal' },
    { emoji: '🎯', label: 'On Target' },
    { emoji: '💯', label: '100% Spot On' },
    { emoji: '📌', label: 'Noted / Pinned' },
    { emoji: '⏳', label: 'In Progress' },
    { emoji: '✅', label: 'Approved' },
    { emoji: '❌', label: 'Blocked / Issue' },
    { emoji: '💼', label: 'Business Priority' },
    { emoji: '📊', label: 'Data & Metrics' },
    { emoji: '⚡', label: 'Fast Track' },
    { emoji: '🏆', label: 'Excellence' },
    { emoji: '🏅', label: 'Top Standard' },
    { emoji: '💡', label: 'Insight' },
  ],
  civility: [
    { emoji: '🙏', label: 'Thank You / Namaste' },
    { emoji: '👏', label: 'Kudos' },
    { emoji: '❤️', label: 'Respect & Care' },
    { emoji: '🌟', label: 'Outstanding' },
    { emoji: '✨', label: 'Inspiring' },
    { emoji: '🫡', label: 'Understood' },
    { emoji: '☕', label: 'Coffee Break' },
    { emoji: '👂', label: 'Listening' },
    { emoji: '🧐', label: 'Reviewing' },
    { emoji: '🙌', label: 'Team Win' },
    { emoji: '💪', label: 'Keep Pushing' },
    { emoji: '🤝', label: 'Partnership' },
  ],
  expressions: [
    { emoji: '😊', label: 'Warm Smile' },
    { emoji: '😂', label: 'Good Humor' },
    { emoji: '😮', label: 'Impressed / Wow' },
    { emoji: '🤔', label: 'Thinking' },
    { emoji: '🔥', label: 'Great Momentum' },
    { emoji: '🚀', label: 'Rocket Speed' },
    { emoji: '🎉', label: 'Celebration' },
    { emoji: '🥳', label: 'Party' },
    { emoji: '🤩', label: 'Excited' },
    { emoji: '💡', label: 'Lightbulb' },
  ]
};

// Subtle Web Audio Pop/Chime on reaction
function playReactionSound(isHandRaise = false) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isHandRaise ? 'triangle' : 'sine';
    const now = ctx.currentTime;

    if (isHandRaise) {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (_) {}
}

export function FloatingReactions({ 
  roomId,
  userName = "Attendee",
  onTriggerReaction 
}: { 
  roomId: string;
  userName?: string;
  onTriggerReaction?: (emoji: string) => void;
}) {
  const [reactions, setReactions] = useState<ReactionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'corporate' | 'civility' | 'expressions'>('quick');
  const [searchQuery, setSearchQuery] = useState('');
  const [isHandRaised, setIsHandRaised] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // Spawns a floating reaction on the screen
  const spawnFloatingEmoji = (emoji: string, senderName?: string) => {
    const newReaction: ReactionItem = {
      id: `${Date.now()}_${Math.random()}`,
      emoji,
      senderName,
      xOffset: (Math.random() - 0.5) * 220,
      rotation: (Math.random() - 0.5) * 35,
      sizeMultiplier: 1 + Math.random() * 0.4
    };

    setReactions((prev) => [...prev.slice(-30), newReaction]);
    onTriggerReaction?.(emoji);

    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 2800);
  };

  // Connect to Supabase Realtime Channel so ALL participants see reactions in real time
  useEffect(() => {
    if (!roomId) return;

    const channelTopic = `meet-reactions-${roomId.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const channel = supabase.channel(channelTopic, {
      config: { broadcast: { self: true } }
    });

    channel
      .on('broadcast', { event: 'reaction' }, ({ payload }) => {
        if (payload?.emoji) {
          spawnFloatingEmoji(payload.emoji, payload.senderName);
        }
      })
      .on('broadcast', { event: 'hand_raise' }, ({ payload }) => {
        if (payload?.isRaised && payload.senderName !== userName) {
          toast.info(`✋ ${payload.senderName || 'Participant'} raised their hand`);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channelRef.current = channel;
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, userName]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const sendReaction = (emoji: string, action?: string) => {
    if (action === 'raise_hand' || emoji === '✋') {
      const nextState = !isHandRaised;
      setIsHandRaised(nextState);
      playReactionSound(true);

      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'hand_raise',
          payload: {
            isRaised: nextState,
            senderName: userName
          }
        });
      }

      if (nextState) {
        toast.info("✋ You raised your hand", {
          description: "Other participants and hosts can see your hand is raised."
        });
      } else {
        toast.info("Hand lowered");
      }
    } else {
      playReactionSound(false);
    }

    // Broadcast reaction to ALL participants in the call!
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'reaction',
        payload: {
          emoji,
          senderName: userName,
          id: `${Date.now()}_${Math.random()}`
        }
      });
    } else {
      // Fallback local spawn if channel connecting
      spawnFloatingEmoji(emoji, userName);
    }
  };

  // Filtered emojis when searching
  const allEmojisFlat = [
    ...PROFESSIONAL_EMOJIS.quick,
    ...PROFESSIONAL_EMOJIS.corporate,
    ...PROFESSIONAL_EMOJIS.civility,
    ...PROFESSIONAL_EMOJIS.expressions,
  ];

  const uniqueFlat = Array.from(new Map(allEmojisFlat.map(item => [item.emoji, item])).values());
  const displayedEmojis = searchQuery.trim()
    ? uniqueFlat.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()) || item.emoji.includes(searchQuery))
    : PROFESSIONAL_EMOJIS[activeTab];

  return (
    <>
      {/* Floating Animated Emojis Screen Layer */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {reactions.map((reaction) => (
            <motion.div
              key={reaction.id}
              initial={{
                opacity: 0,
                scale: 0.3,
                y: typeof window !== 'undefined' ? window.innerHeight - 100 : 600,
                x: typeof window !== 'undefined' ? window.innerWidth - 120 + reaction.xOffset : 300,
                rotate: 0,
              }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.3, 1.4 * reaction.sizeMultiplier, 1.6 * reaction.sizeMultiplier, 1.2],
                y: typeof window !== 'undefined' ? window.innerHeight - 620 : 100,
                x: typeof window !== 'undefined' ? window.innerWidth - 120 + reaction.xOffset * 1.6 : 320,
                rotate: reaction.rotation,
              }}
              transition={{
                duration: 2.7,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute flex flex-col items-center filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] select-none pointer-events-none"
            >
              <span className="text-4xl sm:text-5xl">{reaction.emoji}</span>
              {reaction.senderName && reaction.senderName !== "Attendee" && (
                <span className="mt-1 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[10px] font-semibold text-white border border-white/10 shadow-md">
                  {reaction.senderName}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Persistent Hand Raise Banner on Screen (when user has raised hand) */}
      <AnimatePresence>
        {isHandRaised && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-40 bg-[#0b5cff] text-white px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-2 border border-blue-400/40 text-xs font-semibold backdrop-blur-md cursor-pointer hover:bg-blue-600 transition-colors pointer-events-auto"
            onClick={() => {
              sendReaction('✋', 'raise_hand');
            }}
          >
            <span className="text-base animate-bounce">✋</span>
            <span>You raised your hand</span>
            <span className="text-[10px] text-blue-200 bg-black/25 px-2 py-0.5 rounded-full ml-1">Tap to lower</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Bottom Floating Reaction Emoji Launcher Button ─── */}
      <div 
        className="fixed bottom-[74px] right-3 sm:bottom-20 sm:right-6 z-40 pointer-events-auto flex flex-col items-end"
        ref={containerRef}
      >
        
        {/* Global Professional Emoji Picker Popup (Opens UPWARDS above the bottom bar) */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.94 }}
              transition={{ duration: 0.16 }}
              className="mb-3 w-[calc(100vw-32px)] sm:w-84 max-w-sm bg-[#0e1118]/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-3.5 shadow-2xl z-50 text-white font-sans"
            >
              
              {/* Header with Hand Raise Action & Close Button */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-200">
                  <span className="text-base">😊</span>
                  <span>Meeting Reactions</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant={isHandRaised ? "default" : "outline"}
                    onClick={() => sendReaction('✋', 'raise_hand')}
                    className={`h-7 px-2.5 text-[11px] rounded-full gap-1 transition-all ${
                      isHandRaised 
                        ? 'bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-md' 
                        : 'border-white/10 bg-white/5 hover:bg-white/10 text-gray-200'
                    }`}
                  >
                    <span>✋</span>
                    <span>{isHandRaised ? 'Lower Hand' : 'Raise Hand'}</span>
                  </Button>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    title="Close"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Quick Reactions Bar (Always 1-tap accessible, sends repeatedly without closing) */}
              <div className="flex items-center justify-between gap-1 mb-3 p-1.5 bg-black/40 border border-white/5 rounded-2xl overflow-x-auto">
                {PROFESSIONAL_EMOJIS.quick.map((item) => (
                  <button
                    key={item.emoji + item.label}
                    onClick={() => {
                      sendReaction(item.emoji, (item as any).action);
                    }}
                    title={`${item.label} (Tap repeatedly to burst)`}
                    className="h-9 w-9 text-xl flex items-center justify-center rounded-xl hover:bg-white/15 active:scale-125 transition-transform shrink-0"
                  >
                    {item.emoji}
                  </button>
                ))}
              </div>

              {/* Search Field */}
              <div className="relative mb-2.5">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reactions (e.g. Agree, Kudos, Goal)..."
                  className="h-8 pl-8 pr-7 text-xs bg-black/50 border-white/10 rounded-xl text-white placeholder:text-gray-500"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Category Pills (when not searching) */}
              {!searchQuery && (
                <div className="flex items-center gap-1 mb-2 p-1 bg-black/40 rounded-xl border border-white/5 overflow-x-auto text-[10px] font-medium">
                  <button
                    onClick={() => setActiveTab('quick')}
                    className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 ${
                      activeTab === 'quick' ? 'bg-[#0b5cff] text-white font-semibold' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    ⚡ Quick
                  </button>
                  <button
                    onClick={() => setActiveTab('corporate')}
                    className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 ${
                      activeTab === 'corporate' ? 'bg-[#0b5cff] text-white font-semibold' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    💼 Sync
                  </button>
                  <button
                    onClick={() => setActiveTab('civility')}
                    className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 ${
                      activeTab === 'civility' ? 'bg-[#0b5cff] text-white font-semibold' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🙏 Respect
                  </button>
                  <button
                    onClick={() => setActiveTab('expressions')}
                    className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 ${
                      activeTab === 'expressions' ? 'bg-[#0b5cff] text-white font-semibold' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🎉 Fun
                  </button>
                </div>
              )}

              {/* Emoji Grid (Tap repeatedly to burst animations!) */}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-44 overflow-y-auto pr-1">
                {displayedEmojis.map((item) => (
                  <button
                    key={item.emoji + item.label}
                    onClick={() => {
                      sendReaction(item.emoji, (item as any).action);
                    }}
                    title={`${item.label} (Tap repeatedly)`}
                    className="h-10 w-full flex flex-col items-center justify-center rounded-xl bg-white/[0.03] hover:bg-white/10 active:scale-125 transition-transform group"
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-[8px] text-gray-400 group-hover:text-gray-200 truncate max-w-full px-0.5 line-clamp-1 leading-tight mt-0.5">
                      {item.label.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Footer Note */}
              <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400 px-1">
                <span className="flex items-center gap-1 text-blue-300">
                  <Sparkles className="h-3 w-3 text-blue-400" />
                  <span>Tap repeatedly to burst</span>
                </span>
                <span className="text-emerald-400 flex items-center gap-1 font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live
                </span>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Thumb-Friendly Floating Reaction Emoji Button ── */}
        <Button
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className={`h-11 w-11 sm:h-11 sm:w-auto sm:px-3.5 rounded-full shadow-2xl flex items-center justify-center gap-1.5 border transition-all hover:scale-105 active:scale-95 ${
            isHandRaised 
              ? 'bg-amber-500 hover:bg-amber-600 text-black border-amber-300 shadow-amber-500/30' 
              : isOpen
              ? 'bg-[#0b5cff] hover:bg-[#094bdd] text-white border-blue-400 shadow-blue-500/30'
              : 'bg-[#12151c]/90 hover:bg-[#1a1f2b] text-white border-white/20 backdrop-blur-xl'
          }`}
          title="Send Reaction or Raise Hand"
        >
          {isHandRaised ? (
            <>
              <span className="text-xl animate-bounce">✋</span>
              <span className="hidden sm:inline font-bold text-xs uppercase tracking-wider">Hand Up</span>
            </>
          ) : (
            <>
              <span className="text-xl">😊</span>
              <span className="hidden sm:inline font-bold text-xs uppercase tracking-wider text-amber-300">React</span>
            </>
          )}
        </Button>

      </div>
    </>
  );
}
