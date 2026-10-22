import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smile, Sparkles, Hand, Search, X, Check, 
  ThumbsUp, Heart, Flame, Rocket, PartyPopper, Lightbulb, 
  Briefcase, Award, Coffee, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export interface ReactionItem {
  id: string;
  emoji: string;
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
  onTriggerReaction,
  userName = "You" 
}: { 
  onTriggerReaction?: (emoji: string) => void;
  userName?: string;
}) {
  const [reactions, setReactions] = useState<ReactionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'corporate' | 'civility' | 'expressions'>('quick');
  const [searchQuery, setSearchQuery] = useState('');
  const [isHandRaised, setIsHandRaised] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const addReaction = (emoji: string, action?: string) => {
    if (action === 'raise_hand' || emoji === '✋') {
      const nextState = !isHandRaised;
      setIsHandRaised(nextState);
      playReactionSound(true);
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

    const newReaction: ReactionItem = {
      id: `${Date.now()}_${Math.random()}`,
      emoji,
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
                y: typeof window !== 'undefined' ? window.innerHeight - 80 : 600,
                x: typeof window !== 'undefined' ? window.innerWidth - 180 + reaction.xOffset : 300,
                rotate: 0,
              }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.3, 1.4 * reaction.sizeMultiplier, 1.6 * reaction.sizeMultiplier, 1.2],
                y: typeof window !== 'undefined' ? window.innerHeight - 620 : 100,
                x: typeof window !== 'undefined' ? window.innerWidth - 180 + reaction.xOffset * 1.6 : 320,
                rotate: reaction.rotation,
              }}
              transition={{
                duration: 2.7,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute text-5xl filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] select-none"
            >
              {reaction.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Persistent Hand Raise Banner (when active) */}
      <AnimatePresence>
        {isHandRaised && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#0b5cff] text-white px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-2 border border-blue-400/40 text-xs font-semibold backdrop-blur-md cursor-pointer hover:bg-blue-600 transition-colors"
            onClick={() => {
              setIsHandRaised(false);
              toast.info("Hand lowered");
            }}
          >
            <span className="text-base animate-bounce">✋</span>
            <span>You raised your hand</span>
            <span className="text-[10px] text-blue-200 bg-black/20 px-2 py-0.5 rounded-full ml-1">Click to lower</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher Trigger Button & Dropdown Menu */}
      <div className="relative" ref={containerRef}>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className={`h-8 px-2.5 rounded-full text-xs transition-all shadow-sm flex items-center gap-1.5 border ${
            isHandRaised 
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30' 
              : isOpen
              ? 'bg-[#0b5cff] text-white border-blue-400'
              : 'bg-black/50 hover:bg-black/80 backdrop-blur-md border-white/10 text-gray-200 hover:text-white'
          }`}
          title="Global Professional Emojis & Hand Raise"
        >
          {isHandRaised ? (
            <>
              <span className="text-sm animate-pulse">✋</span>
              <span className="hidden md:inline font-semibold">Hand Raised</span>
            </>
          ) : (
            <>
              <Smile className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden md:inline font-medium">Reactions</span>
            </>
          )}
        </Button>

        {/* Global Professional Emoji Picker Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.16 }}
              className="absolute top-full mt-2 right-0 w-80 bg-[#0e1118]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl z-50 p-3 overflow-hidden text-white font-sans"
            >
              
              {/* Header with Quick Hand Raise Toggle */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-200">
                  <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                  <span>Professional Reactions</span>
                </div>

                <Button
                  size="sm"
                  variant={isHandRaised ? "default" : "outline"}
                  onClick={() => addReaction('✋', 'raise_hand')}
                  className={`h-7 px-2.5 text-[11px] rounded-lg gap-1 transition-all ${
                    isHandRaised 
                      ? 'bg-amber-500 hover:bg-amber-600 text-black font-bold' 
                      : 'border-white/10 bg-white/5 hover:bg-white/10 text-gray-200'
                  }`}
                >
                  <span>✋</span>
                  <span>{isHandRaised ? 'Lower Hand' : 'Raise Hand'}</span>
                </Button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-2.5">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reactions (e.g. Agree, Kudos, Goal)..."
                  className="h-8 pl-8 pr-7 text-xs bg-black/40 border-white/10 rounded-xl text-white placeholder:text-gray-500"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Category Navigation Pills (only if not searching) */}
              {!searchQuery && (
                <div className="flex items-center gap-1 mb-2.5 p-1 bg-black/40 rounded-xl border border-white/5 overflow-x-auto text-[10px] font-medium">
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

              {/* Emoji Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {displayedEmojis.map((item) => (
                  <button
                    key={item.emoji + item.label}
                    onClick={() => addReaction(item.emoji, (item as any).action)}
                    title={item.label}
                    className="h-10 w-full flex flex-col items-center justify-center rounded-xl bg-white/[0.03] hover:bg-white/10 hover:scale-115 active:scale-95 transition-all group relative"
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-[8px] text-gray-400 group-hover:text-gray-200 truncate max-w-full px-0.5 line-clamp-1 leading-tight mt-0.5">
                      {item.label.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Footer Tip */}
              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400 px-1">
                <span>Clicking sends animated floating reaction</span>
                <span className="text-blue-400 font-mono">Real-time</span>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
