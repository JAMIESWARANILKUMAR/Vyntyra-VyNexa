import React, { useEffect, useState } from 'react';
import { Bot } from 'lucide-react';
// import { useRtkAudioTracks } from '@cloudflare/realtimekit-react-ui';

export function TranslationOverlay({ isEnabled, targetLanguage }: { isEnabled: boolean, targetLanguage: string }) {
  const [caption, setCaption] = useState("Listening for incoming audio streams...");

  useEffect(() => {
    if (!isEnabled) return;
    
    // In a full implementation, we'd pipe the RealtimeKit audio stream 
    // to Gemini Flash AI here, and read back the translated text stream.
    // We are simulating the connection initialization here.
    
    const id = setInterval(() => {
      setCaption(`[Translated to ${targetLanguage}]: Live transcription translation active.`);
    }, 4000);

    return () => clearInterval(id);
  }, [isEnabled, targetLanguage]);

  if (!isEnabled) return null;

  return (
    <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none w-11/12 max-w-3xl">
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 shadow-2xl flex items-start gap-4">
        <div className="bg-emerald-500/20 p-2 rounded-lg shrink-0">
          <Bot className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-400 mb-1 flex items-center gap-2">
            AI Translation ({targetLanguage})
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </p>
          <p className="text-white text-lg leading-relaxed font-medium">
            {caption}
          </p>
        </div>
      </div>
    </div>
  );
}
