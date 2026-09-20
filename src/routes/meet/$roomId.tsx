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
import { Shield, Settings, Globe, Loader2, AlertCircle, Lock, User, Layers, Video, Hand, Circle, X, Info, MessageSquare, Users, MoreVertical, Copy, Link2 } from 'lucide-react';
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

  // Corporate Meeting Features State
  const [activeSidebar, setActiveSidebar] = useState<'chat' | 'participants' | 'info' | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

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
    <div className="min-h-screen bg-black text-slate-100 flex flex-col font-sans overflow-hidden relative">
      
      {/* Zoom-style CSS Overrides */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Main Video Grid */
        .rtk-video-grid {
          padding: 0 !important;
          gap: 2px !important;
          height: 100% !important;
          background-color: #000 !important;
        }
        
        .rtk-video-tile {
          border-radius: 0 !important;
          border: 2px solid transparent !important;
          background: #111 !important;
          overflow: hidden;
          transition: border-color 0.1s ease !important;
          box-shadow: none !important;
        }
        
        /* Zoom Active Speaker Green */
        .rtk-active-speaker {
          border: 2px solid #58B020 !important;
          box-shadow: none !important;
        }

        /* Participant Names (Zoom style: bottom left, black box, small font) */
        .rtk-participant-label {
          position: absolute;
          bottom: 0;
          left: 0;
          background: rgba(0, 0, 0, 0.7) !important;
          color: #fff !important;
          border-radius: 0 4px 0 0 !important;
          padding: 4px 8px !important;
          font-size: 12px !important;
          font-weight: 400 !important;
          border: none !important;
          display: flex;
          align-items: center;
          gap: 6px;
          backdrop-filter: none !important;
        }

        .rtk-participant-label::before {
          content: '';
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #58B020;
        }
        .rtk-participant-label[data-muted="true"]::before {
          background-color: #ff3b30;
        }

        /* Avatar styling */
        .rtk-video-avatar {
          background: #333 !important;
          color: #fff !important;
          font-weight: 500 !important;
          border-radius: 50% !important;
          border: none !important;
        }

        /* Zoom Bottom Control Bar */
        .rtk-control-bar {
          background: #1a1a1a !important;
          border-top: 1px solid #2d2d2d !important;
          border-radius: 0 !important;
          padding: 0 16px !important;
          height: 64px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 4px !important;
          width: 100% !important;
          margin: 0 !important;
          position: relative;
          z-index: 50;
        }
        
        /* Zoom Transparent Control Buttons */
        .rtk-btn {
          border-radius: 8px !important;
          width: 60px !important;
          height: 52px !important;
          background-color: transparent !important;
          border: none !important;
          color: #b3b3b3 !important;
          transition: background-color 0.1s ease !important;
          transform: none !important;
        }
        .rtk-btn:hover {
          background-color: #333 !important;
          color: #fff !important;
        }
        
        /* Muted State - Zoom usually just strikes through, but we can make it red text or standard */
        .rtk-btn-muted {
          background-color: transparent !important;
          color: #ff3b30 !important;
        }
        .rtk-btn-muted:hover {
          background-color: #333 !important;
        }
        
        /* Leave Button - Zoom style small red rectangle on the far right */
        .rtk-btn-danger {
          background-color: #e02828 !important;
          color: white !important;
          width: 72px !important;
          height: 32px !important;
          border-radius: 4px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          border: none !important;
          position: absolute !important;
          right: 16px !important;
        }
        .rtk-btn-danger:hover {
          background-color: #b81c1c !important;
        }
      `}} />

      {/* Minimal Top-Left Info Overlay (Zoom Style) */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
        <div className="flex items-center gap-2 bg-black/60 px-2 py-1 rounded shadow-sm border border-white/10">
          <Shield className="h-4 w-4 text-green-500" />
          {isRecording && (
            <>
              <div className="w-px h-3 bg-white/20 mx-1"></div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-[11px] font-medium text-white tracking-wide">Recording</span>
              </div>
            </>
          )}
        </div>
        <div className="bg-black/60 px-3 py-1 rounded shadow-sm border border-white/10 text-xs font-semibold text-white/90">
          <RtkClock />
        </div>
      </div>

      {/* Main Meeting Area */}
      <main className="flex-1 relative flex overflow-hidden bg-black z-10">
        <RtkUiProvider meeting={meeting}>
          <div className="flex-1 relative flex flex-col min-w-0 h-full">
            <RtkMeeting />
            
            {/* Overlay for translation */}
            <div className="absolute inset-0 pointer-events-none z-40">
              <TranslationOverlay isEnabled={translationEnabled} targetLanguage={targetLang} />
            </div>

            {/* Custom Zoom-style Buttons overlaid on the bottom bar */}
            {/* Since RtkMeeting renders its own .rtk-control-bar full width at the bottom, 
                we absolute-position our custom buttons over it in the center-right. */}
            <div className="absolute bottom-1.5 right-[120px] flex items-center gap-1 z-[60] h-[52px]">
              
              <Button 
                variant="ghost" 
                className={`flex-col h-[52px] w-[64px] gap-1 rounded-lg hover:bg-[#333] transition-none ${activeSidebar === 'participants' ? 'bg-[#333] text-white' : 'text-[#b3b3b3] hover:text-white'}`}
                onClick={() => setActiveSidebar(activeSidebar === 'participants' ? null : 'participants')}
              >
                <div className="relative">
                  <Users className="h-5 w-5" />
                  <div className="absolute -top-1 -right-2 bg-[#333] border border-[#1a1a1a] text-[9px] font-bold px-1 rounded">
                    <RtkParticipantCount />
                  </div>
                </div>
                <span className="text-[10px]">Participants</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className={`flex-col h-[52px] w-[64px] gap-1 rounded-lg hover:bg-[#333] transition-none ${activeSidebar === 'chat' ? 'bg-[#333] text-white' : 'text-[#b3b3b3] hover:text-white'}`}
                onClick={() => setActiveSidebar(activeSidebar === 'chat' ? null : 'chat')}
              >
                <MessageSquare className="h-5 w-5" />
                <span className="text-[10px]">Chat</span>
              </Button>

              <Button 
                variant="ghost" 
                className="flex-col h-[52px] w-[64px] gap-1 rounded-lg hover:bg-[#333] text-[#b3b3b3] hover:text-white transition-none"
                onClick={() => setIsRecording(!isRecording)}
              >
                <Circle className={`h-5 w-5 ${isRecording ? 'text-red-500 fill-red-500' : ''}`} />
                <span className="text-[10px]">{isRecording ? 'Stop Rec' : 'Record'}</span>
              </Button>

              <Button 
                variant="ghost" 
                className="flex-col h-[52px] w-[64px] gap-1 rounded-lg hover:bg-[#333] text-[#b3b3b3] hover:text-white transition-none"
                onClick={() => setIsHandRaised(!isHandRaised)}
              >
                <Hand className={`h-5 w-5 ${isHandRaised ? 'text-yellow-400' : ''}`} />
                <span className="text-[10px]">Reactions</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className={`flex-col h-[52px] w-[64px] gap-1 rounded-lg hover:bg-[#333] transition-none ${translationEnabled ? 'bg-[#333] text-white' : 'text-[#b3b3b3] hover:text-white'}`}
                onClick={() => setTranslationEnabled(!translationEnabled)}
              >
                <Globe className="h-5 w-5" />
                <span className="text-[10px]">Translate</span>
              </Button>

            </div>
          </div>

          {/* Zoom-style Sidebar Overlay (White/Light theme typically for Zoom chat) */}
          {activeSidebar && (
            <aside className="w-[320px] shrink-0 bg-white border-l border-gray-200 flex flex-col shadow-2xl relative z-50 transition-all">
              <div className="h-[52px] px-4 flex items-center justify-between shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800 text-sm">
                    {activeSidebar === 'chat' && 'Meeting Chat'}
                    {activeSidebar === 'participants' && 'Participants'}
                  </h3>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-gray-100 border border-gray-200">
                     <Shield className="h-3 w-3 text-green-600" />
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveSidebar(null)} className="h-8 w-8 p-0 text-gray-500 hover:text-gray-800 rounded">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#f7f7f7]">
                {activeSidebar === 'chat' && (
                  <div className="absolute inset-0 flex flex-col bg-white">
                    <RtkChat />
                  </div>
                )}
                
                {activeSidebar === 'participants' && (
                  <div className="flex flex-col bg-white h-full">
                    <div className="p-3 text-xs font-semibold text-gray-500 uppercase">In Meeting</div>
                    <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs">M</div>
                        <span className="text-sm font-medium text-gray-800">Me (Host)</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-400">
                         <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center font-bold text-gray-600 text-xs">G</div>
                        <span className="text-sm font-medium text-gray-800">Guest User</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-400">
                         <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          )}
        </RtkUiProvider>
      </main>
    </div>
  );
}
