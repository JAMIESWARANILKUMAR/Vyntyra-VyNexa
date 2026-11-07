import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Languages, Sparkles, Volume2, Mic, MicOff, 
  Check, ChevronDown, Cpu, X, Subtitles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { translateSpeechFn } from '@/lib/meetings.functions';
import { supabase } from '@/integrations/supabase/client';
import { INDIAN_LANGUAGES, IndianLanguage } from './IndianLanguageTranslator';

export interface LiveTranscriptItem {
  speakerId?: string;
  speakerName: string;
  text: string;
  translatedText?: string;
  lang?: string;
  timestamp: number;
}

interface LiveTranscriptionOverlayProps {
  roomId: string;
  currentUserId?: string;
  currentUserName: string;
  isCaptionsEnabled: boolean;
  onToggleCaptions: () => void;
  selectedLanguage: IndianLanguage;
  onSelectLanguage: (lang: IndianLanguage) => void;
  isMicActive: boolean;
}

export function LiveTranscriptionOverlay({
  roomId,
  currentUserId,
  currentUserName,
  isCaptionsEnabled,
  onToggleCaptions,
  selectedLanguage,
  onSelectLanguage,
  isMicActive,
}: LiveTranscriptionOverlayProps) {
  const [activeTranscript, setActiveTranscript] = useState<LiveTranscriptItem | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

  const recognitionRef = useRef<any>(null);
  const fadeTimeoutRef = useRef<any>(null);
  const debounceTranslateTimeoutRef = useRef<any>(null);
  const isCaptionsEnabledRef = useRef(isCaptionsEnabled);
  isCaptionsEnabledRef.current = isCaptionsEnabled;
  const selectedLanguageRef = useRef(selectedLanguage);
  selectedLanguageRef.current = selectedLanguage;

  // Clear transcript after silence
  const resetFadeTimer = useCallback(() => {
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    fadeTimeoutRef.current = setTimeout(() => {
      setActiveTranscript(null);
    }, 6500);
  }, []);

  // Translate with server fn
  const translateText = useCallback(async (text: string): Promise<string> => {
    if (!text || !text.trim() || selectedLanguageRef.current.code === 'en') return text;
    try {
      setIsTranslating(true);
      const res = await translateSpeechFn({
        data: {
          text: text.trim(),
          targetLang: selectedLanguageRef.current.code,
          targetLangName: selectedLanguageRef.current.name,
          sourceLang: 'auto',
          model: 'meta-llama/llama-3.3-70b-instruct',
        }
      });
      if (res && res.translatedText) {
        return res.translatedText;
      }
    } catch (e) {
      console.warn("Translation failed:", e);
    } finally {
      setIsTranslating(false);
    }
    return text;
  }, []);

  // Broadcast spoken transcript to all participants in the meeting room
  const broadcastTranscript = useCallback(async (item: LiveTranscriptItem) => {
    try {
      const channel = supabase.channel(`meet-controls-${roomId}`);
      await channel.send({
        type: 'broadcast',
        event: 'live_transcript',
        payload: item,
      });
      supabase.removeChannel(channel);
    } catch (_) {}
  }, [roomId]);

  // Setup Web Speech Recognition for local speech-to-text
  useEffect(() => {
    if (!isCaptionsEnabled || !isMicActive) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
        recognitionRef.current = null;
      }
      return;
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      return;
    }

    let recognition: any = null;
    try {
      recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = 'en-IN';
      recognitionRef.current = recognition;

      recognition.onresult = async (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += piece;
          } else {
            interimTranscript += piece;
          }
        }

        const spoken = (finalTranscript || interimTranscript).trim();
        if (spoken) {
          const item: LiveTranscriptItem = {
            speakerId: currentUserId,
            speakerName: currentUserName,
            text: spoken,
            timestamp: Date.now(),
          };

          setActiveTranscript(item);
          resetFadeTimer();

          // Debounce translation & broadcast
          clearTimeout(debounceTranslateTimeoutRef.current);
          debounceTranslateTimeoutRef.current = setTimeout(async () => {
            let translated = undefined;
            if (selectedLanguageRef.current.code !== 'en') {
              translated = await translateText(spoken);
            }
            const completeItem: LiveTranscriptItem = {
              ...item,
              translatedText: translated,
            };
            setActiveTranscript(completeItem);
            broadcastTranscript(completeItem);
          }, 350);
        }
      };

      recognition.onerror = (e: any) => {
        // If aborted or silenced, restart if captions still enabled
        if (e.error === 'no-speech' && isCaptionsEnabledRef.current) {
          try { recognition.start(); } catch (_) {}
        }
      };

      recognition.onend = () => {
        if (isCaptionsEnabledRef.current && isMicActive) {
          try { recognition.start(); } catch (_) {}
        }
      };

      recognition.start();
    } catch (err) {
      console.warn("Speech recognition initialization error:", err);
    }

    return () => {
      clearTimeout(debounceTranslateTimeoutRef.current);
      if (recognition) {
        try { recognition.stop(); } catch (_) {}
      }
    };
  }, [isCaptionsEnabled, isMicActive, currentUserId, currentUserName, translateText, broadcastTranscript, resetFadeTimer]);

  // Listen for broadcasted transcripts from other participants
  useEffect(() => {
    const channel = supabase.channel(`meet-controls-${roomId}`)
      .on('broadcast', { event: 'live_transcript' }, ({ payload }: any) => {
        if (!isCaptionsEnabledRef.current) return;
        if (payload?.text && payload?.speakerId !== currentUserId) {
          setActiveTranscript(payload);
          resetFadeTimer();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, [roomId, currentUserId, resetFadeTimer]);

  // Read translated speech out loud
  const handleTtsPlayback = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !activeTranscript) return;
    try {
      window.speechSynthesis.cancel();
      const textToSpeak = activeTranscript.translatedText || activeTranscript.text;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = selectedLanguage.speechLang;
      window.speechSynthesis.speak(utterance);
      toast.success(`Playing ${selectedLanguage.name} voiceover`);
    } catch (_) {}
  };

  if (!isCaptionsEnabled) return null;

  return (
    <>
      {/* Floating Subtitle Banner - Sleek Minimalist Stage Overlay */}
      {activeTranscript && (
        <div className="fixed bottom-24 sm:bottom-28 left-1/2 transform -translate-x-1/2 z-40 w-11/12 max-w-2xl pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-[#0b0e14]/92 backdrop-blur-2xl border border-white/10 rounded-2xl p-3.5 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/5 mb-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-blue-300">
                  {activeTranscript.speakerName}
                </span>
                <span className="text-[10px] text-gray-500">·</span>
                <span className="text-[10px] font-mono text-gray-400">
                  Live Transcription
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {activeTranscript.translatedText && (
                  <button
                    onClick={handleTtsPlayback}
                    className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Speak translated audio"
                  >
                    <Volume2 className="h-3.5 w-3.5 text-blue-400" />
                  </button>
                )}
                <button
                  onClick={() => setActiveTranscript(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              {/* Spoken original transcript */}
              <p className="text-sm font-medium text-white/95 leading-relaxed tracking-wide">
                {activeTranscript.text}
              </p>

              {/* AI Indian Language Translation if enabled */}
              {activeTranscript.translatedText && activeTranscript.translatedText !== activeTranscript.text && (
                <div className="pt-1.5 border-t border-white/5 flex items-start gap-2">
                  <span className="text-xs">{selectedLanguage.flag}</span>
                  <p className="text-xs text-blue-300 font-normal leading-relaxed">
                    {activeTranscript.translatedText}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
