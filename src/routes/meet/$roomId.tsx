import React, { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { getMeetingTokenFn } from '@/lib/meetings.functions';
import RealtimeKitClient from '@cloudflare/realtimekit';
import { 
  RtkUiProvider,
  RtkMeeting, 
  RtkGrid, 
  RtkChat, 
  RtkClock, 
  RtkParticipantCount,
  RtkScreenShareToggle 
} from '@cloudflare/realtimekit-react-ui';
import { Shield, Settings, Globe, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TranslationOverlay } from '@/components/meet/TranslationOverlay';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const Route = createFileRoute('/meet/$roomId')({
  component: MeetingRoom
});

function MeetingRoom() {
  const params = Route.useParams() as any;
  const roomId = params.roomId;
  const fetchToken = useServerFn(getMeetingTokenFn);
  
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const [targetLang, setTargetLang] = useState('Spanish');
  const [meeting, setMeeting] = useState<any>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['meet-token', roomId],
    queryFn: () => fetchToken({ data: { roomId } }),
    retry: false
  });

  useEffect(() => {
    if (data?.token && !meeting) {
      RealtimeKitClient.init({ authToken: data.token })
        .then(m => {
          setMeeting(m);
          m.joinRoom?.();
        })
        .catch(err => console.error("RealtimeKit init error:", err));
    }
  }, [data?.token, meeting]);

  if (isLoading || (data && !meeting)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
        <h2 className="text-xl font-semibold">Preparing Secure Environment...</h2>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-slate-400 text-center max-w-md">
          {error?.message || "This meeting room is invalid or has been terminated."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Prometric/Corporate Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">Vyntyra<span className="text-indigo-400">Meet</span></span>
          </div>
          <div className="h-4 w-px bg-slate-800 mx-2"></div>
          <h1 className="font-medium text-slate-200 truncate max-w-[200px] md:max-w-md">{data.title}</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-slate-800 p-1.5 rounded-lg border border-slate-700">
            <Button 
              variant={translationEnabled ? "secondary" : "ghost"} 
              size="sm"
              onClick={() => setTranslationEnabled(!translationEnabled)}
              className={`gap-2 ${translationEnabled ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              <Globe className="h-4 w-4" />
              Live Translation
            </Button>
            {translationEnabled && (
              <Select value={targetLang} onValueChange={setTargetLang}>
                <SelectTrigger className="w-[120px] h-8 bg-slate-900 border-slate-700 text-xs text-white">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  <SelectItem value="Spanish">Spanish</SelectItem>
                  <SelectItem value="Hindi">Hindi</SelectItem>
                  <SelectItem value="Telugu">Telugu</SelectItem>
                  <SelectItem value="Kannada">Kannada</SelectItem>
                  <SelectItem value="French">French</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-500/20">
            <Shield className="h-3.5 w-3.5" />
            E2EE SECURE
          </div>
          
          <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
            <RtkParticipantCount className="bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700" />
            <RtkClock className="bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700 tabular-nums" />
          </div>
        </div>
      </header>

      {/* Main Meeting Area */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        <RtkUiProvider meeting={meeting}>
          <RtkMeeting />
        </RtkUiProvider>
        <div className="absolute inset-0 pointer-events-none z-50">
          <TranslationOverlay isEnabled={translationEnabled} targetLanguage={targetLang} />
        </div>
      </main>
    </div>
  );
}
