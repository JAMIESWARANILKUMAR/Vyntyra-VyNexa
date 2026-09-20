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
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 overflow-hidden relative">
      {/* Dynamic CSS Overrides for RTK SDK - Vyntyra Classic Theme */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Video Grid & Tiles */
        .rtk-video-grid {
          padding: 24px !important;
          gap: 16px !important;
          height: 100% !important;
        }
        .rtk-video-tile {
          border-radius: 12px !important;
          border: 1px solid rgba(51, 65, 85, 0.5) !important; /* border-slate-700/50 */
          background: #0f172a !important; /* bg-slate-900 */
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
          transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
        }
        
        /* Active Speaker (Vyntyra Emerald Accent) */
        .rtk-active-speaker {
          border: 2px solid #10b981 !important; /* emerald-500 */
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2), 0 8px 24px rgba(16, 185, 129, 0.15) !important;
        }

        /* Participant Names (Bottom Left) */
        .rtk-participant-label {
          position: absolute;
          bottom: 12px;
          left: 12px;
          background: rgba(15, 23, 42, 0.85) !important;
          backdrop-filter: blur(8px) !important;
          color: #f8fafc !important;
          border: 1px solid rgba(51, 65, 85, 0.6) !important;
          border-radius: 6px !important;
          padding: 4px 10px !important;
          font-size: 13px !important;
          font-weight: 600 !important;
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
          background-color: #10b981; /* emerald-500 */
        }
        .rtk-participant-label[data-muted="true"]::before {
          background-color: #ef4444; /* red-500 */
        }

        /* Avatar styling */
        .rtk-video-avatar {
          background: linear-gradient(135deg, #312e81, #064e3b) !important; /* Indigo to Emerald dark gradient */
          color: #10b981 !important; /* emerald-500 text */
          font-weight: 600 !important;
          border-radius: 50% !important;
          border: 1px solid rgba(16, 185, 129, 0.3) !important;
        }

        /* Control Dock (Classic Bottom Bar) */
        .rtk-control-bar {
          background: #0f172a !important; /* slate-900 */
          border-top: 1px solid rgba(51, 65, 85, 0.5) !important; /* border-slate-700/50 */
          padding: 12px 24px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 16px !important;
          position: relative;
          z-index: 50;
        }
        
        /* Control Buttons */
        .rtk-btn {
          border-radius: 50% !important;
          width: 48px !important;
          height: 48px !important;
          background-color: rgba(30, 41, 59, 0.8) !important; /* slate-800 */
          border: 1px solid rgba(51, 65, 85, 0.5) !important; /* border-slate-700/50 */
          color: #f1f5f9 !important; /* slate-100 */
          transition: background-color 0.2s ease, transform 0.1s ease !important;
        }
        .rtk-btn:hover {
          background-color: rgba(51, 65, 85, 0.8) !important; /* slate-700 */
          transform: scale(1.05);
        }
        
        /* Muted State */
        .rtk-btn-muted {
          background-color: rgba(225, 29, 72, 0.15) !important; /* rose-600/15 */
          border-color: rgba(225, 29, 72, 0.3) !important;
          color: #f43f5e !important; /* rose-400 */
        }
        .rtk-btn-muted:hover {
          background-color: rgba(225, 29, 72, 0.25) !important;
        }
        
        /* Leave Button */
        .rtk-btn-danger {
          background-color: #e11d48 !important; /* rose-600 */
          color: white !important;
          width: 64px !important;
          border-radius: 24px !important;
          border: none !important;
        }
        .rtk-btn-danger:hover {
          background-color: #be123c !important; /* rose-700 */
        }
      `}} />

      {/* Vyntyra Classic Header */}
      <header className="h-[64px] bg-[#0A0D14] border-b border-slate-800/60 px-6 flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-default">
            <Layers className="h-5 w-5 text-indigo-500" />
            <span className="font-bold text-lg tracking-tight text-slate-100">Vyntyra</span>
          </div>
          
          <div className="h-5 w-px bg-slate-700/50 mx-2"></div>
          
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-slate-200 text-sm truncate max-w-[200px] md:max-w-md">
              {data.title}
            </h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                <Shield className="h-3 w-3 text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">E2EE</span>
              </div>
              {isRecording && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 animate-pulse">
                  <div className="h-2 w-2 rounded-full bg-rose-500"></div>
                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">REC</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="hidden md:flex items-center gap-2 bg-slate-900/50 p-1 rounded-md border border-slate-700/50">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setTranslationEnabled(!translationEnabled)}
              className={`h-7 px-3 gap-2 rounded-sm transition-colors ${translationEnabled ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">Translate</span>
            </Button>
            
            {translationEnabled && (
              <Select value={targetLang} onValueChange={setTargetLang}>
                <SelectTrigger className="w-[110px] h-7 bg-slate-900 border-slate-700 text-xs text-white rounded-sm focus:ring-1 focus:ring-indigo-500">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
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

          <div className="flex items-center gap-4 text-sm font-medium text-slate-300">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" />
              <RtkParticipantCount />
            </div>
            <div className="h-4 w-px bg-slate-700/50"></div>
            <div className="font-mono text-slate-200 font-semibold">
              <RtkClock />
            </div>
          </div>
        </div>
      </header>

      {/* Main Meeting Area */}
      <main className="flex-1 relative flex overflow-hidden bg-transparent z-10">
        <RtkUiProvider meeting={meeting}>
          
          {/* Left Side: Video Grid & Controls */}
          <div className="flex-1 relative flex flex-col min-w-0">
            <RtkMeeting />
            
            {/* Overlay for translation */}
            <div className="absolute inset-0 pointer-events-none z-40">
              <TranslationOverlay isEnabled={translationEnabled} targetLanguage={targetLang} />
            </div>

            {/* Corporate Floating Features Dock */}
            <div className="absolute bottom-6 right-6 flex items-center gap-2 z-[60]">
              <Button 
                variant="outline" 
                className={`h-12 w-12 rounded-full border-slate-700/50 shadow-xl transition-all ${isHandRaised ? 'bg-amber-500/20 text-amber-500 border-amber-500/50' : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'}`}
                onClick={() => setIsHandRaised(!isHandRaised)}
                title="Raise Hand"
              >
                <Hand className={`h-5 w-5 ${isHandRaised ? 'animate-bounce' : ''}`} />
              </Button>
              
              <Button 
                variant="outline" 
                className={`h-12 w-12 rounded-full border-slate-700/50 shadow-xl transition-all ${isRecording ? 'bg-rose-500/20 text-rose-500 border-rose-500/50' : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'}`}
                onClick={() => setIsRecording(!isRecording)}
                title="Record Meeting"
              >
                <Circle className={`h-5 w-5 ${isRecording ? 'fill-rose-500 animate-pulse' : ''}`} />
              </Button>

              <Button 
                variant="outline" 
                className={`h-12 w-12 rounded-full border-slate-700/50 shadow-xl transition-all ${activeSidebar === 'participants' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'}`}
                onClick={() => setActiveSidebar(activeSidebar === 'participants' ? null : 'participants')}
                title="Participants"
              >
                <Users className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="outline" 
                className={`h-12 w-12 rounded-full border-slate-700/50 shadow-xl transition-all ${activeSidebar === 'chat' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'}`}
                onClick={() => setActiveSidebar(activeSidebar === 'chat' ? null : 'chat')}
                title="Chat"
              >
                <MessageSquare className="h-5 w-5" />
              </Button>

              <Button 
                variant="outline" 
                className={`h-12 w-12 rounded-full border-slate-700/50 shadow-xl transition-all ${activeSidebar === 'info' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'}`}
                onClick={() => setActiveSidebar(activeSidebar === 'info' ? null : 'info')}
                title="Meeting Info"
              >
                <Info className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Right Side: Corporate Sidebar */}
          {activeSidebar && (
            <aside className="w-[340px] shrink-0 bg-[#0A0D14] border-l border-slate-800/60 flex flex-col shadow-2xl relative z-50">
              <div className="h-[60px] px-4 border-b border-slate-800/60 flex items-center justify-between shrink-0">
                <h3 className="font-semibold text-slate-200">
                  {activeSidebar === 'chat' && 'Meeting Chat'}
                  {activeSidebar === 'participants' && 'Participants'}
                  {activeSidebar === 'info' && 'Meeting Details'}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveSidebar(null)} className="h-8 w-8 p-0 text-slate-400 hover:text-white rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
                {activeSidebar === 'chat' && (
                  <div className="absolute inset-0 flex flex-col bg-slate-950/50">
                    <RtkChat />
                  </div>
                )}
                
                {activeSidebar === 'participants' && (
                  <div className="p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-900 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">Me</div>
                        <span className="text-sm font-medium text-slate-200">You</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-500">
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                      </div>
                    </div>
                    
                    <div className="px-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">In Meeting</div>
                    {/* Mock other participants */}
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-900 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-xs border border-slate-700">G</div>
                        <span className="text-sm font-medium text-slate-300">Guest User</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-rose-500"></div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeSidebar === 'info' && (
                  <div className="p-5 flex flex-col gap-6">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Joining Info</h4>
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                        <span className="text-sm font-mono text-slate-300 truncate">meet.vyntyra.com/{roomId}</span>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-white" title="Copy Link">
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Encryption</h4>
                      <div className="flex items-start gap-3 bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
                        <Shield className="h-5 w-5 text-emerald-500 shrink-0" />
                        <p className="text-xs text-slate-400 leading-relaxed">This meeting is secured with end-to-end encryption. Your audio, video, and screen sharing are private.</p>
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
