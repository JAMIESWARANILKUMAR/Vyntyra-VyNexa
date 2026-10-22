import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Heart, ThumbsUp, Sparkles, Flame, Rocket, PartyPopper, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ReactionItem {
  id: string;
  emoji: string;
  xOffset: number;
  rotation: number;
}

const POPULAR_REACTIONS = [
  { emoji: '❤️', label: 'Love' },
  { emoji: '👍', label: 'Thumbs Up' },
  { emoji: '👏', label: 'Clap' },
  { emoji: '🎉', label: 'Celebration' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '🚀', label: 'Rocket' },
  { emoji: '💡', label: 'Idea' },
  { emoji: '😂', label: 'Laugh' },
];

export function FloatingReactions({ onTriggerReaction }: { onTriggerReaction?: (emoji: string) => void }) {
  const [reactions, setReactions] = useState<ReactionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addReaction = (emoji: string) => {
    const newReaction: ReactionItem = {
      id: `${Date.now()}_${Math.random()}`,
      emoji,
      xOffset: (Math.random() - 0.5) * 160,
      rotation: (Math.random() - 0.5) * 40
    };

    setReactions((prev) => [...prev.slice(-25), newReaction]);
    onTriggerReaction?.(emoji);

    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 2800);
  };

  return (
    <>
      {/* Floating Animated Emojis Screen Container */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {reactions.map((reaction) => (
            <motion.div
              key={reaction.id}
              initial={{
                opacity: 0,
                scale: 0.4,
                y: window.innerHeight - 100,
                x: window.innerWidth - 120 + reaction.xOffset,
                rotate: 0,
              }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.4, 1.4, 1.6, 1.2],
                y: window.innerHeight - 560,
                x: window.innerWidth - 120 + reaction.xOffset * 1.5,
                rotate: reaction.rotation,
              }}
              transition={{
                duration: 2.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute text-4xl filter drop-shadow-lg select-none"
            >
              {reaction.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating Reaction Launcher Trigger */}
      <div className="relative">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-12 right-0 mb-2 p-2 bg-[#12141a]/90 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl flex items-center gap-1 z-50"
            >
              {POPULAR_REACTIONS.map((item) => (
                <button
                  key={item.emoji}
                  onClick={() => addReaction(item.emoji)}
                  title={item.label}
                  className="h-10 w-10 text-xl flex items-center justify-center rounded-xl hover:bg-white/10 hover:scale-125 active:scale-95 transition-all"
                >
                  {item.emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className={`h-8 px-2.5 rounded-full text-xs font-medium transition-all backdrop-blur-md border ${
            isOpen 
              ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 shadow-lg' 
              : 'bg-black/50 hover:bg-black/80 text-gray-200 border-white/10'
          }`}
          title="Send Reaction Emojis"
        >
          <Smile className="h-3.5 w-3.5 mr-1.5 text-yellow-400" />
          <span className="hidden sm:inline">React</span>
        </Button>
      </div>
    </>
  );
}
