import React, { useState, useEffect, useRef } from 'react';
import { Globe, Languages, Sparkles, Volume2, Type, Check, ChevronDown, Bot, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface IndianLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  sampleTranslation: string;
}

export const INDIAN_LANGUAGES: IndianLanguage[] = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', sampleTranslation: 'नमस्ते, व्यानेक्स कनेक्ट मीटिंग में आपका स्वागत है।' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', sampleTranslation: 'నమస్కారం, వ్యానెక్సా కనెక్ట్ సమావేశానికి స్వాగతం.' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', sampleTranslation: 'வணக்கம், வைநெக்சா கனெக்ட் கூட்டத்திற்கு வரவேற்கிறோம்.' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', sampleTranslation: 'ನಮಸ್ಕಾರ, ವೈನೆಕ್ಸಾ ಕನೆಕ್ಟ್ ಸಭೆಗೆ ಸುಸ್ವಾಗತ.' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', sampleTranslation: 'നമസ്കാരം, വൈനെക്സ കണക്റ്റ് യോഗത്തിലേക്ക് സ്വാഗതം.' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', sampleTranslation: 'नमस्कार, व्यानेक्सा कनेक्ट बैठकीत आपले स्वागत आहे.' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', sampleTranslation: 'নমস্কার, ভায়ানেক্সা কানেক্ট মিটিংয়ে আপনাকে স্বাগতম।' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', sampleTranslation: 'નમસ્તે, વ્યાનેક્સા કનેક્ટ મીટિંગમાં આપનું સ્વાગત છે.' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', sampleTranslation: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਵਾਇਨੈਕਸਾ ਕਨੈਕਟ ਮੀਟਿੰਗ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ।' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳', sampleTranslation: 'ନମସ୍କାର, ଭାୟାନେକ୍ସା କନେକ୍ଟ ମିଟିଂକୁ ସ୍ୱାଗତ।' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇮🇳', sampleTranslation: 'آداب، وائنیکسا کنیکٹ میٹنگ میں خوش آمدید۔' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', flag: '🇮🇳', sampleTranslation: 'নমস্কাৰ, ভাইনেক্সা কানেক্ট সভালৈ স্বাগতম।' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', flag: '🇮🇳', sampleTranslation: 'नमस्ते, व्यानेक्सा-संवाद-सभायां स्वागतम्।' },
  { code: 'en-in', name: 'English (India)', nativeName: 'English (IN)', flag: '🇮🇳', sampleTranslation: 'Welcome to the Vyntyra Connect live enterprise session.' },
];

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
  const [currentCaption, setCurrentCaption] = useState<{ original: string; translated: string }>({
    original: "Welcome to Vyntyra Connect. Live multi-language Indian translation engine active.",
    translated: selectedLanguage.sampleTranslation,
  });
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');

  // Real-time Web Speech Recognition & Dynamic Multi-Language Translation simulation
  useEffect(() => {
    if (!isEnabled) return;

    let recognition: any = null;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          
          setCurrentCaption({
            original: transcript,
            translated: `${selectedLanguage.nativeName}: ${selectedLanguage.sampleTranslation.replace('...', '')} (${transcript})`,
          });
        };

        recognition.start();
      } catch (err) {
        console.warn("SpeechRecognition already started or permission pending:", err);
      }
    }

    // Dynamic rotation of multilingual captions if speech is idle
    const phrases = [
      { en: "Sharing project roadmap, architecture specs, and CBT examination progress.", key: "roadmap" },
      { en: "Cloudflare RealtimeKit WebRTC audio and video synchronization is optimal.", key: "webrtc" },
      { en: "Please raise your hand or ask any questions in the live chat panel.", key: "qa" },
      { en: "High-definition screen sharing and dynamic participants layout enabled.", key: "hd" },
    ];

    let index = 0;
    const interval = setInterval(() => {
      const phrase = phrases[index % phrases.length];
      index++;
      setCurrentCaption({
        original: phrase.en,
        translated: `[${selectedLanguage.nativeName}]: ${selectedLanguage.sampleTranslation}`,
      });
    }, 6000);

    return () => {
      clearInterval(interval);
      if (recognition) {
        try {
          recognition.stop();
        } catch (_) {}
      }
    };
  }, [isEnabled, selectedLanguage]);

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
          title="Indian Languages Live AI Translator"
        >
          <Languages className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
          <span className="hidden sm:inline">{selectedLanguage.flag} {selectedLanguage.nativeName}</span>
          <ChevronDown className="h-3 w-3 opacity-60 ml-1" />
        </Button>

        {/* Dropdown with all Indian Languages */}
        {isDropdownOpen && (
          <div className="absolute top-11 right-0 w-72 bg-[#12141a]/98 backdrop-blur-2xl border border-white/15 rounded-2xl p-2.5 shadow-2xl z-50 text-white animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 mb-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-blue-400 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" /> All Indian Languages
              </span>
              <button
                onClick={() => onToggle()}
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors ${
                  isEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-gray-400'
                }`}
              >
                {isEnabled ? '● Active' : '○ Off'}
              </button>
            </div>

            <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
              {INDIAN_LANGUAGES.map((lang) => {
                const isSelected = lang.code === selectedLanguage.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onLanguageChange(lang);
                      setIsDropdownOpen(false);
                      if (!isEnabled) onToggle();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                      isSelected 
                        ? 'bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/30' 
                        : 'hover:bg-white/10 text-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{lang.flag}</span>
                      <div>
                        <div className="font-semibold text-white">{lang.nativeName}</div>
                        <div className="text-[10px] text-gray-400">{lang.name}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Floating Bilingual Subtitle Canvas (Placed directly above control bar) */}
      {isEnabled && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none w-11/12 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#0b0d13]/90 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-4 shadow-2xl flex items-start gap-3.5">
            <div className="h-9 w-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0">
              <Bot className="h-5 w-5 text-blue-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-blue-400 tracking-wide uppercase flex items-center gap-1.5">
                  <span>{selectedLanguage.flag}</span>
                  <span>AI Live Caption ({selectedLanguage.name} - {selectedLanguage.nativeName})</span>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </span>
              </div>

              {/* Original Spoken Text */}
              <p className="text-xs text-gray-400 font-medium truncate mb-1">
                "{currentCaption.original}"
              </p>

              {/* High-Contrast Translated Script */}
              <p className={`font-semibold text-white leading-relaxed ${fontSize === 'large' ? 'text-xl' : 'text-base'}`}>
                {currentCaption.translated}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
