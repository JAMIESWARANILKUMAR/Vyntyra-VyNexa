import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Languages, Sparkles, Volume2, VolumeX, Mic, MicOff, 
  Settings2, Check, ChevronDown, Bot, Type, Radio, Sliders, Cpu, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { translateSpeechFn } from '@/lib/meetings.functions';

export interface IndianLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  speechLang: string;
}

export const INDIAN_LANGUAGES: IndianLanguage[] = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', speechLang: 'hi-IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', speechLang: 'te-IN' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', speechLang: 'ta-IN' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', speechLang: 'kn-IN' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', speechLang: 'ml-IN' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', speechLang: 'mr-IN' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', speechLang: 'bn-IN' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', speechLang: 'gu-IN' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', speechLang: 'pa-IN' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳', speechLang: 'or-IN' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇮🇳', speechLang: 'ur-IN' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', flag: '🇮🇳', speechLang: 'as-IN' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', flag: '🇮🇳', speechLang: 'sa-IN' },
  { code: 'en', name: 'English', nativeName: 'English (India)', flag: '🇮🇳', speechLang: 'en-IN' },
];

export const SPOKEN_LANGUAGES = [
  { code: 'auto', name: 'Auto-detect Voice', speechLang: 'en-IN' },
  { code: 'en-IN', name: 'English (India)', speechLang: 'en-IN' },
  { code: 'hi-IN', name: 'Hindi (हिन्दी)', speechLang: 'hi-IN' },
  { code: 'te-IN', name: 'Telugu (తెలుగు)', speechLang: 'te-IN' },
  { code: 'ta-IN', name: 'Tamil (தமிழ்)', speechLang: 'ta-IN' },
  { code: 'kn-IN', name: 'Kannada (ಕನ್ನಡ)', speechLang: 'kn-IN' },
  { code: 'bn-IN', name: 'Bengali (বাংলা)', speechLang: 'bn-IN' },
  { code: 'mr-IN', name: 'Marathi (मराठी)', speechLang: 'mr-IN' },
];

export const OPENROUTER_MODELS = [
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Meta Llama 3.3 70B',
    tag: 'Recommended · High Accuracy',
  },
  {
    id: 'openrouter/auto',
    name: 'OpenRouter Auto',
    tag: 'Dynamic Fast Routing',
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    tag: 'Rapid Conversational',
  },
  {
    id: 'meta-llama/llama-3.1-8b-instruct',
    name: 'Meta Llama 3.1 8B',
    tag: 'Ultra-Low Latency',
  },
];

// In-memory client cache to guarantee instant 0ms responses for repeated translations
const clientTranslationCache = new Map<string, string>();

async function translateWithOpenRouter(
  text: string, 
  targetLang: string, 
  targetLangName: string, 
  sourceLang: string, 
  model: string
): Promise<{ text: string; modelUsed: string; provider: string }> {
  const clean = text.trim();
  if (!clean) return { text: '', modelUsed: 'none', provider: 'none' };
  
  const cacheKey = `${targetLang}:${model}:${clean.toLowerCase()}`;
  if (clientTranslationCache.has(cacheKey)) {
    return { text: clientTranslationCache.get(cacheKey)!, modelUsed: 'cache', provider: 'client-cache' };
  }

  try {
    const res = await translateSpeechFn({
      data: {
        text: clean,
        targetLang,
        targetLangName,
        sourceLang,
        model,
      }
    });

    if (res && res.translatedText) {
      if (clientTranslationCache.size > 1000) clientTranslationCache.clear();
      clientTranslationCache.set(cacheKey, res.translatedText);
      return {
        text: res.translatedText,
        modelUsed: res.modelUsed || model,
        provider: res.provider || 'openrouter'
      };
    }
  } catch (err) {
    console.warn("[OpenRouter AI Translator] Client call failed:", err);
  }

  return { text: clean, modelUsed: 'fallback', provider: 'raw' };
}

export function IndianLanguageTranslator({
  isEnabled,
  onToggle,
  selectedLanguage,
  onLanguageChange,
}: {
  isEnabled: boolean;
  onToggle: () => void;
  selectedLanguage: IndianLanguage;
  onLanguageChange: (lang: IndianLanguage) => void;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [spokenLang, setSpokenLang] = useState('en-IN');
  const [selectedModel, setSelectedModel] = useState('meta-llama/llama-3.3-70b-instruct');
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');
  const [showOriginal, setShowOriginal] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeModelLabel, setActiveModelLabel] = useState('OpenRouter Llama 3.3 70B');
  
  const [currentCaption, setCurrentCaption] = useState<{ original: string; translated: string }>({
    original: "Live speech recognition active. Speak into your microphone.",
    translated: "वास्तविक समय अनुवाद सक्रिय है (OpenRouter AI)। कृपया बोलें।",
  });

  const recognitionRef = useRef<any>(null);
  const isEnabledRef = useRef(isEnabled);
  isEnabledRef.current = isEnabled;
  const targetLangRef = useRef(selectedLanguage);
  targetLangRef.current = selectedLanguage;
  const spokenLangRef = useRef(spokenLang);
  spokenLangRef.current = spokenLang;
  const selectedModelRef = useRef(selectedModel);
  selectedModelRef.current = selectedModel;

  const debounceTimeoutRef = useRef<any>(null);

  // Perform translation safely with debounce and OpenRouter AI models
  const processTranslation = useCallback(async (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setIsTranslating(true);
    try {
      const result = await translateWithOpenRouter(
        clean,
        targetLangRef.current.code,
        targetLangRef.current.name,
        spokenLangRef.current,
        selectedModelRef.current
      );

      setCurrentCaption({
        original: clean,
        translated: result.text || clean,
      });

      if (result.modelUsed && result.modelUsed !== 'none') {
        const shortName = result.modelUsed.split('/').pop() || result.modelUsed;
        setActiveModelLabel(`OpenRouter · ${shortName}`);
      }
    } catch (_) {
      setCurrentCaption(prev => ({ ...prev, original: clean }));
    } finally {
      setIsTranslating(false);
    }
  }, []);

  // Text-to-speech reader for translated voice
  const handleSpeakAudio = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentCaption.translated || currentCaption.original);
      utterance.lang = selectedLanguage.speechLang;
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
      toast.success(`Playing ${selectedLanguage.name} audio voiceover`);
    } catch (e) {
      console.warn("TTS error:", e);
    }
  };

  // Initialize and keep Web Speech Recognition alive continuously
  useEffect(() => {
    if (!isEnabled) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      toast.error("Speech Recognition is not supported in this browser. Please use Google Chrome or Edge.");
      return;
    }

    let recognition: any = null;

    try {
      recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = spokenLang;
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
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

        const textToTranslate = (finalTranscript || interimTranscript).trim();

        if (textToTranslate) {
          // Immediately show live transcript
          setCurrentCaption(prev => ({
            original: textToTranslate,
            translated: prev.translated,
          }));

          // Debounce translation call by 300ms to allow smooth sentence completion
          clearTimeout(debounceTimeoutRef.current);
          debounceTimeoutRef.current = setTimeout(() => {
            processTranslation(textToTranslate);
          }, 300);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("SpeechRecognition error:", event.error);
        if (event.error === 'not-allowed') {
          toast.error("Microphone permission denied for live translation.");
          setIsListening(false);
        }
      };

      // Keep speech recognition permanently running when paused/silent
      recognition.onend = () => {
        setIsListening(false);
        if (isEnabledRef.current) {
          try {
            recognition.start();
          } catch (_) {}
        }
      };

      recognition.start();
    } catch (err) {
      console.warn("Failed to initialize speech recognition:", err);
    }

    return () => {
      clearTimeout(debounceTimeoutRef.current);
      if (recognition) {
        try {
          recognition.stop();
        } catch (_) {}
      }
    };
  }, [isEnabled, spokenLang, processTranslation]);

  // When selected language or model changes, re-translate current caption immediately
  useEffect(() => {
    if (currentCaption.original) {
      processTranslation(currentCaption.original);
    }
  }, [selectedLanguage, selectedModel, processTranslation]);

  return (
    <>
      {/* Top Floating Language Selector Button */}
      <div className="relative">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`h-8 px-2.5 rounded-full text-xs font-medium transition-all backdrop-blur-md border ${
            isEnabled 
              ? 'bg-blue-600/30 text-blue-300 border-blue-500/50 shadow-lg' 
              : 'bg-black/50 hover:bg-black/80 text-gray-200 border-white/10'
          }`}
          title="Live AI Translation & Captions (OpenRouter API)"
        >
          <Languages className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
          <span className="hidden sm:inline">{selectedLanguage.flag} {selectedLanguage.nativeName}</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-blue-500/20 text-blue-300 border border-blue-400/30 font-semibold uppercase">
            AI
          </span>
          <ChevronDown className="h-3 w-3 opacity-60 ml-1" />
        </Button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute top-full mt-2 right-0 w-84 max-w-[92vw] bg-[#0e1118]/98 backdrop-blur-2xl border border-white/15 rounded-2xl p-3 shadow-2xl z-50 text-white animate-in fade-in zoom-in-95 duration-150 font-sans">
            
            {/* Header: Toggle & Status */}
            <div className="flex items-center justify-between px-1 pb-2.5 border-b border-white/10 mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-wide">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                <span>OpenRouter AI Subtitles</span>
              </div>
              <button
                onClick={() => onToggle()}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${
                  isEnabled ? 'bg-emerald-500 text-black' : 'bg-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {isEnabled ? '● Active' : 'Turn On'}
              </button>
            </div>

            {/* OpenRouter AI Model Selector */}
            <div className="mb-3 px-1">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                  <Cpu className="h-3 w-3 text-cyan-400" />
                  <span>OpenRouter AI Model</span>
                </label>
                <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                  Live LLM
                </span>
              </div>
              <select
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  toast.success(`Switched AI model to ${e.target.value.split('/').pop()}`);
                }}
                className="w-full h-8 bg-black/60 border border-white/15 rounded-xl px-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {OPENROUTER_MODELS.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                    {m.name} ({m.tag})
                  </option>
                ))}
              </select>
            </div>

            {/* Input Spoken Language Picker */}
            <div className="mb-3 px-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
                Your Spoken Voice Language
              </label>
              <select
                value={spokenLang}
                onChange={(e) => setSpokenLang(e.target.value)}
                className="w-full h-8 bg-black/50 border border-white/10 rounded-xl px-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {SPOKEN_LANGUAGES.map((sl) => (
                  <option key={sl.code} value={sl.speechLang} className="bg-slate-900 text-white">
                    {sl.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subtitle Target Language Header */}
            <div className="px-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5 flex items-center justify-between">
              <span>Translate Subtitles Into</span>
              <span className="text-blue-400 font-mono text-[9px]">13 Indian Languages</span>
            </div>

            {/* Language Selection Grid */}
            <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
              {INDIAN_LANGUAGES.map((lang) => {
                const isSelected = lang.code === selectedLanguage.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onLanguageChange(lang);
                      if (!isEnabled) onToggle();
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                      isSelected 
                        ? 'bg-blue-600/30 text-blue-300 font-semibold border border-blue-500/40' 
                        : 'hover:bg-white/10 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{lang.flag}</span>
                      <div className="text-left">
                        <div className="font-semibold text-white leading-tight">{lang.nativeName}</div>
                        <div className="text-[10px] text-gray-400 leading-tight">{lang.name}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Bottom Subtitle Settings */}
            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400 px-1">
              <button
                onClick={() => setFontSize(fontSize === 'normal' ? 'large' : 'normal')}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                <Type className="h-3 w-3" />
                <span>Size: {fontSize === 'large' ? 'Large' : 'Normal'}</span>
              </button>

              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                <span>{showOriginal ? 'Bilingual: On' : 'Bilingual: Off'}</span>
              </button>
            </div>

          </div>
        )}
      </div>

      {/* Floating Bilingual Subtitle Canvas (Placed directly above control bar) */}
      {isEnabled && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none w-11/12 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#0b0d13]/95 backdrop-blur-2xl border border-blue-500/30 rounded-2xl p-4 shadow-2xl flex items-start gap-3.5">
            <div className="h-9 w-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0">
              <Bot className="h-5 w-5 text-blue-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-semibold text-blue-400 tracking-wide uppercase flex flex-wrap items-center gap-1.5">
                  <span>{selectedLanguage.flag}</span>
                  <span>{selectedLanguage.name} ({selectedLanguage.nativeName})</span>
                  {isListening && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.2 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Listening
                    </span>
                  )}
                  {isTranslating ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-cyan-300 animate-pulse">
                      <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
                      Translating with OpenRouter...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono text-cyan-400/90 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.2 rounded-full">
                      <Sparkles className="h-2.5 w-2.5 text-cyan-400" />
                      {activeModelLabel}
                    </span>
                  )}
                </span>

                <button
                  onClick={handleSpeakAudio}
                  className="pointer-events-auto text-[10px] text-gray-400 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded-md border border-white/10 transition-colors"
                  title="Read aloud in translated language"
                >
                  <Volume2 className="h-3 w-3 text-blue-400" />
                  <span>Speak</span>
                </button>
              </div>

              {/* Original Spoken Text (if enabled) */}
              {showOriginal && currentCaption.original && (
                <p className="text-xs text-gray-400 font-medium truncate mb-1">
                  "{currentCaption.original}"
                </p>
              )}

              {/* High-Contrast Genuine Translated Script */}
              <p className={`font-semibold text-white leading-relaxed tracking-wide ${fontSize === 'large' ? 'text-2xl' : 'text-lg'}`}>
                {currentCaption.translated || currentCaption.original}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
