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
import { Shield, Settings, Globe, Loader2, AlertCircle, Lock, User, Layers, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  // Auth States for External Guests
  const [submittedPassword, setSubmittedPassword] = useState<string | undefined>(undefined);
  const [submittedGuestName, setSubmittedGuestName] = useState<string | undefined>(undefined);
  const [passwordInput, setPasswordInput] = useState('');
  const [guestNameInput, setGuestNameInput] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['meet-token', roomId, submittedPassword, submittedGuestName],
    queryFn: () => fetchToken({ data: { roomId, password: submittedPassword, guestName: submittedGuestName } }),
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative h-16 w-16 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-emerald-400 rounded-2xl blur-md animate-pulse opacity-70"></div>
            <div className="relative h-full w-full bg-slate-900 border border-slate-700/50 rounded-2xl flex items-center justify-center overflow-hidden">
              <Layers className="h-8 w-8 text-indigo-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400">Vyntyra Secure Meet</h2>
          <p className="text-slate-400 mt-2 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin text-indigo-500" /> Connecting to E2EE network...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    const errMsg = error?.message || "";
    
    if (errMsg.includes("INVALID_PASSWORD")) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>
          
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-[0_0_50px_-12px_rgba(99,102,241,0.2)] max-w-md w-full relative z-10">
            <div className="w-16 h-16 bg-slate-800/80 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-700/50 shadow-inner">
              <Lock className="h-8 w-8 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-center text-white tracking-tight">Secure External Meeting</h2>
            <p className="text-slate-400 text-center mb-8 text-sm leading-relaxed">This room is protected by Vyntyra E2EE. Please enter your guest credentials to join.</p>
            
            <form onSubmit={(e) => { e.preventDefault(); setSubmittedPassword(passwordInput); setSubmittedGuestName(guestNameInput); }} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><User className="h-3.5 w-3.5" /> Guest Name</label>
                <Input value={guestNameInput} onChange={e => setGuestNameInput(e.target.value)} placeholder="e.g. John Doe" className="h-11 bg-slate-950/50 border-slate-700/80 focus-visible:ring-indigo-500/50" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Lock className="h-3.5 w-3.5" /> Access PIN</label>
                <Input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="Enter meeting password" className="h-11 bg-slate-950/50 border-slate-700/80 focus-visible:ring-indigo-500/50" required />
              </div>
              {submittedPassword && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>Incorrect credentials. Please verify your access pin.</p>
                </div>
              )}
              <Button type="submit" className="w-full h-11 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-500/25 border-t border-indigo-400/30 transition-all">
                Authenticate & Join
              </Button>
            </form>
          </div>
        </div>
      );
    }

    if (errMsg.includes("UNAUTHORIZED_INTERNAL")) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 relative">
          <Shield className="h-16 w-16 text-indigo-500 mb-6 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
          <h2 className="text-3xl font-bold mb-3 tracking-tight">Authentication Required</h2>
          <p className="text-slate-400 text-center max-w-md text-lg">This is a strictly internal meeting. Please log in to your dashboard to access this room.</p>
          <Button onClick={() => window.location.href = '/'} className="mt-8 h-12 px-8 bg-slate-800 hover:bg-slate-700 rounded-full">Go to Dashboard</Button>
        </div>
      );
    }

    if (errMsg.includes("ACCESS_DENIED_GUEST_LIST")) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
          <AlertCircle className="h-16 w-16 text-amber-500 mb-6 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
          <h2 className="text-3xl font-bold mb-3 tracking-tight">Access Restricted</h2>
          <p className="text-slate-400 text-center max-w-md text-lg">You are authenticated, but your email is not on the approved guest list for this internal meeting.</p>
          <Button onClick={() => window.location.href = '/'} className="mt-8 h-12 px-8 bg-slate-800 hover:bg-slate-700 rounded-full">Return to Dashboard</Button>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-slate-400 text-center max-w-md">
          {errMsg || "This meeting room is invalid or has been terminated."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* Enterprise CSS Overrides for RTK SDK */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Video Grid & Tiles */
        .rtk-video-grid {
          padding: 16px !important;
          gap: 12px !important;
          height: 100% !important;
        }
        .rtk-video-tile {
          border-radius: 8px !important;
          border: 1px solid #333 !important;
          background: #1f1f1f !important;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
          transition: border-color 0.2s ease !important;
        }
        
        /* Active Speaker (Teams/Meet style solid ring) */
        .rtk-active-speaker {
          border: 2px solid #60a5fa !important; /* Professional Blue */
          box-shadow: 0 0 0 1px #60a5fa !important;
        }

        /* Participant Names (Bottom Left) */
        .rtk-participant-label {
          position: absolute;
          bottom: 12px;
          left: 12px;
          background: rgba(0, 0, 0, 0.6) !important;
          color: #fff !important;
          border-radius: 4px !important;
          padding: 4px 8px !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          border: none !important;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Live Audio Indicator */
        .rtk-participant-label::before {
          content: '';
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #34d399; /* emerald-400 */
        }
        .rtk-participant-label[data-muted="true"]::before {
          background-color: #ef4444; /* red-500 */
        }

        /* Avatar styling */
        .rtk-video-avatar {
          background: #3c4043 !important;
          color: white !important;
          font-weight: 400 !important;
          border-radius: 50% !important;
          border: 1px solid #555 !important;
        }

        /* Floating Control Dock (Meet Style) */
        .rtk-control-bar {
          background: #202124 !important;
          border: 1px solid #3c4043 !important;
          border-radius: 100px !important;
          padding: 10px 24px !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6) !important;
          margin-bottom: 24px !important;
          gap: 12px !important;
          position: relative;
          z-index: 50;
        }
        
        /* Control Buttons */
        .rtk-btn {
          border-radius: 50% !important;
          width: 44px !important;
          height: 44px !important;
          background-color: #3c4043 !important;
          border: none !important;
          color: #e8eaed !important;
          transition: background-color 0.2s ease !important;
        }
        .rtk-btn:hover {
          background-color: #5f6368 !important;
        }
        
        /* Muted State */
        .rtk-btn-muted {
          background-color: #ea4335 !important;
          color: white !important;
        }
        .rtk-btn-muted:hover {
          background-color: #d93025 !important;
        }
        
        /* Leave Button */
        .rtk-btn-danger {
          background-color: #ea4335 !important;
          color: white !important;
          width: 60px !important;
          border-radius: 100px !important;
          border: none !important;
        }
        .rtk-btn-danger:hover {
          background-color: #d93025 !important;
        }
      `}} />

      {/* Enterprise Header (Teams/Meet Inspired) */}
      <header className="h-[60px] bg-[#202124] border-b border-[#3c4043] px-6 flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-default text-white">
            <Layers className="h-5 w-5 text-blue-400" />
            <span className="font-semibold text-lg tracking-tight">Vyntyra</span>
          </div>
          
          <div className="h-5 w-px bg-gray-600 mx-2"></div>
          
          <div className="flex items-center gap-3">
            <h1 className="font-medium text-gray-200 text-sm truncate max-w-[200px] md:max-w-md">
              {data.title}
            </h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-900/30 border border-green-800/50">
              <Shield className="h-3 w-3 text-green-400" />
              <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wider">E2EE</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-[#303134] p-1 rounded-md border border-[#3c4043]">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setTranslationEnabled(!translationEnabled)}
              className={`h-7 px-3 gap-2 rounded-sm transition-colors ${translationEnabled ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-gray-300 hover:text-white hover:bg-[#3c4043]'}`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Translate</span>
            </Button>
            
            {translationEnabled && (
              <Select value={targetLang} onValueChange={setTargetLang}>
                <SelectTrigger className="w-[110px] h-7 bg-[#202124] border-[#3c4043] text-xs text-white rounded-sm focus:ring-1 focus:ring-blue-500">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent className="bg-[#202124] border-[#3c4043] text-gray-200">
                  <SelectItem value="Spanish">Spanish</SelectItem>
                  <SelectItem value="Hindi">Hindi</SelectItem>
                  <SelectItem value="Telugu">Telugu</SelectItem>
                  <SelectItem value="Kannada">Kannada</SelectItem>
                  <SelectItem value="French">French</SelectItem>
                  <SelectItem value="German">German</SelectItem>
                  <SelectItem value="Japanese">Japanese</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm font-medium text-gray-300">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <RtkParticipantCount />
            </div>
            <div className="h-4 w-px bg-gray-600"></div>
            <div className="font-mono text-gray-200">
              <RtkClock />
            </div>
          </div>
        </div>
      </header>

      {/* Main Meeting Area */}
      <main className="flex-1 relative flex flex-col overflow-hidden bg-transparent z-10">
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
