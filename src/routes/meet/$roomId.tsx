import React, { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getMeetingTokenFn } from '@/lib/meetings.functions';
import { useServerFn } from '@tanstack/react-start';
import RealtimeKitClient from '@cloudflare/realtimekit';
import { RtkUiProvider, RtkMeeting, RtkChat, RtkParticipantCount } from '@cloudflare/realtimekit-react-ui';
import { 
  Shield, Settings, Globe, Loader2, AlertCircle, Lock, User, Layers, Hand, Circle, X, 
  Info, MessageSquare, Users, Copy, Link2, ChevronLeft, ChevronRight, RotateCw, Search, 
  Home, Calendar, MoreHorizontal, Maximize, ArrowUpSquare, LayoutGrid, CheckCircle2,
  Mic, MicOff, Video, VideoOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TranslationOverlay } from '@/components/meet/TranslationOverlay';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [initError, setInitError] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [screenShareEnabled, setScreenShareEnabled] = useState(false);
  const [joinTimeout, setJoinTimeout] = useState(false);

  // Corporate Meeting Features State
  const [activeSidebar, setActiveSidebar] = useState<'chat' | 'participants' | 'info' | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  // Auth States for External Guests
  const [submittedPassword, setSubmittedPassword] = useState<string | undefined>(undefined);
  const [submittedGuestName, setSubmittedGuestName] = useState<string | undefined>(undefined);
  const [passwordInput, setPasswordInput] = useState('');
  const [guestNameInput, setGuestNameInput] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['meet-token', roomId, submittedPassword, submittedGuestName],
    queryFn: async () => {
      let authToken: string | undefined = undefined;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        authToken = session?.access_token || undefined;
      } catch (err) {
        console.warn("Failed to get session for meet-token:", err);
      }
      return await fetchToken({ 
        data: { 
          roomId, 
          password: submittedPassword, 
          guestName: submittedGuestName,
          authToken 
        } 
      });
    },
    retry: false
  });

  // Watch for slow connection / timeout to give immediate actionable feedback
  useEffect(() => {
    if (isLoading || (data && !meeting && !initError)) {
      const timer = setTimeout(() => {
        setJoinTimeout(true);
      }, 10000);
      return () => clearTimeout(timer);
    } else {
      setJoinTimeout(false);
    }
  }, [isLoading, data, meeting, initError]);

  // Initialize RealtimeKit Client with non-blocking media defaults
  useEffect(() => {
    if (data?.token && !meeting) {
      let isMounted = true;
      setInitError(null);

      // We explicitly set audio: false, video: false during initialization
      // so that browser device enumeration and permission prompts NEVER block room connection.
      RealtimeKitClient.init({ 
        authToken: data.token,
        defaults: {
          audio: false,
          video: false
        }
      })
        .then(async (m) => {
          if (!isMounted) return;
          setMeeting(m);
          try {
            await m.join();
          } catch (joinErr: any) {
            console.warn("RealtimeKit m.join error:", joinErr);
          }
        })
        .catch((err: any) => {
          console.error("RealtimeKit init error:", err);
          if (isMounted) {
            setInitError(err?.message || "Failed to initialize video call session.");
          }
        });

      return () => {
        isMounted = false;
      };
    }
  }, [data?.token, meeting]);

  // Synchronize media states with RealtimeKit client
  useEffect(() => {
    if (!meeting?.self) return;

    const handleAudioUpdate = (payload: any) => {
      setAudioEnabled(!!payload.audioEnabled);
    };
    const handleVideoUpdate = (payload: any) => {
      setVideoEnabled(!!payload.videoEnabled);
    };
    const handleScreenShareUpdate = (payload: any) => {
      setScreenShareEnabled(!!payload.screenShareEnabled);
    };

    try {
      meeting.self.on('audioUpdate', handleAudioUpdate);
      meeting.self.on('videoUpdate', handleVideoUpdate);
      meeting.self.on('screenShareUpdate', handleScreenShareUpdate);
    } catch (_) {}

    setAudioEnabled(!!meeting.self.audioEnabled);
    setVideoEnabled(!!meeting.self.videoEnabled);
    setScreenShareEnabled(!!meeting.self.screenShareEnabled);

    return () => {
      try {
        if (typeof meeting.self.removeListener === 'function') {
          meeting.self.removeListener('audioUpdate', handleAudioUpdate);
          meeting.self.removeListener('videoUpdate', handleVideoUpdate);
          meeting.self.removeListener('screenShareUpdate', handleScreenShareUpdate);
        }
      } catch (_) {}
    };
  }, [meeting]);

  const toggleAudio = async () => {
    if (!meeting?.self) return;
    try {
      if (audioEnabled) {
        await meeting.self.disableAudio();
        setAudioEnabled(false);
      } else {
        await meeting.self.enableAudio();
        setAudioEnabled(true);
        toast.success("Microphone enabled");
      }
    } catch (err: any) {
      console.error("Audio toggle error:", err);
      toast.error("Microphone access failed: " + (err?.message || "Please check browser permissions"));
    }
  };

  const toggleVideo = async () => {
    if (!meeting?.self) return;
    try {
      if (videoEnabled) {
        await meeting.self.disableVideo();
        setVideoEnabled(false);
      } else {
        await meeting.self.enableVideo();
        setVideoEnabled(true);
        toast.success("Camera enabled");
      }
    } catch (err: any) {
      console.error("Video toggle error:", err);
      toast.error("Camera access failed: " + (err?.message || "Please check browser permissions"));
    }
  };

  const toggleScreenShare = async () => {
    if (!meeting?.self) return;
    try {
      if (screenShareEnabled) {
        await meeting.self.disableScreenShare();
        setScreenShareEnabled(false);
      } else {
        await meeting.self.enableScreenShare();
        setScreenShareEnabled(true);
      }
    } catch (err: any) {
      console.error("Screen share error:", err);
      toast.error("Screen share failed: " + (err?.message || "Permission denied"));
    }
  };

  const handleLeave = async () => {
    try {
      if (meeting) {
        await meeting.leave();
      }
    } catch (err) {
      console.warn("Leave meeting error:", err);
    }
    window.location.href = '/';
  };

  if (isLoading || (data && !meeting && !initError)) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center text-white relative overflow-hidden p-6">
        <div className="relative z-10 flex flex-col items-center max-w-sm text-center">
          <Loader2 className="h-9 w-9 animate-spin text-[#0b5cff] mb-4" />
          <h2 className="text-xl font-medium tracking-tight mb-2">Connecting to Vyntyra Connect...</h2>
          <p className="text-xs text-gray-400">
            Establishing secure WebRTC session and joining room.
          </p>

          {joinTimeout && (
            <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center animate-in fade-in duration-300">
              <p className="text-xs text-yellow-400 mb-3">
                Connection is taking longer than usual. You can retry the handshake.
              </p>
              <Button
                onClick={() => {
                  setMeeting(null);
                  refetch();
                }}
                size="sm"
                className="bg-[#0b5cff] hover:bg-[#094bdd] text-white text-xs h-8 px-4"
              >
                <RotateCw className="h-3.5 w-3.5 mr-1.5" /> Reconnect Now
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex flex-col items-center justify-center text-slate-800 p-6">
        <div className="bg-white border border-gray-200 p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-slate-900">Connection Failed</h2>
          <p className="text-gray-500 text-center text-sm mb-6">
            {initError}
          </p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => {
                setInitError(null);
                setMeeting(null);
                refetch();
              }}
              className="w-full h-11 bg-[#0b5cff] hover:bg-[#094bdd] text-white"
            >
              <RotateCw className="h-4 w-4 mr-2" /> Retry Connection
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full h-11 border-gray-300 text-slate-700"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    const errMsg = error?.message || "";
    
    if (errMsg.includes("AUTH_REQUIRED") || errMsg.includes("UNAUTHORIZED_INTERNAL")) {
      const returnUrl = encodeURIComponent(`/meet/${roomId}`);
      return (
        <div className="min-h-screen bg-[#f8f9fb] flex flex-col items-center justify-center text-slate-800 p-6 relative">
          <div className="bg-white border border-gray-200 p-8 rounded-xl shadow-lg max-w-md w-full text-center">
            <div className="w-14 h-14 bg-blue-50 text-[#0b5cff] rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold mb-2 tracking-tight text-slate-900">Corporate Sign-In Required</h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              This meeting is an internal video conference restricted to verified team members and interns. Please sign in to verify your identity and enter the room.
            </p>

            <div className="space-y-3">
              <Button
                onClick={() => window.location.href = `/auth/admin?redirect=${returnUrl}`}
                className="w-full h-11 bg-[#0b5cff] hover:bg-[#094bdd] text-white font-medium"
              >
                Sign In as Administrator / Employee
              </Button>
              <Button
                onClick={() => window.location.href = `/auth/intern?redirect=${returnUrl}`}
                variant="outline"
                className="w-full h-11 border-gray-300 text-slate-700 hover:bg-slate-50 font-medium"
              >
                Sign In as Intern
              </Button>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                <RotateCw className="h-3.5 w-3.5 mr-1" /> Retry Connection
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (errMsg.includes("ACCESS_DENIED_GUEST_LIST")) {
      return (
        <div className="min-h-screen bg-[#f8f9fb] flex flex-col items-center justify-center text-slate-800 p-6 relative">
          <div className="bg-white border border-gray-200 p-8 rounded-xl shadow-lg max-w-md w-full text-center">
            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold mb-2 tracking-tight text-slate-900">Access Restricted</h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Your account is not on the attendee list for this private session. Please contact the meeting organizer to request access.
            </p>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full h-11 border-gray-300 text-slate-700"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    if (errMsg.includes("INVALID_PASSWORD")) {
      return (
        <div className="min-h-screen bg-[#f8f9fb] flex flex-col items-center justify-center text-slate-800 p-6 relative">
          <div className="bg-white border border-gray-200 p-8 rounded-xl shadow-lg max-w-md w-full relative z-10">
            <h2 className="text-2xl font-bold mb-2 text-center tracking-tight">Enter Meeting Passcode</h2>
            <p className="text-gray-500 text-center mb-8 text-sm">Please enter the meeting passcode to join.</p>
            
            <form onSubmit={(e) => { e.preventDefault(); setSubmittedPassword(passwordInput); setSubmittedGuestName(guestNameInput); }} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">Guest Name</label>
                <Input value={guestNameInput} onChange={e => setGuestNameInput(e.target.value)} placeholder="Your Name" className="h-11 bg-white border-gray-300" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">Meeting Passcode</label>
                <Input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="Enter passcode" className="h-11 bg-white border-gray-300" required />
              </div>
              {submittedPassword && (
                <div className="text-rose-500 text-sm p-3 rounded-lg flex items-center gap-2 bg-rose-50">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>Incorrect passcode. Please try again.</p>
                </div>
              )}
              <Button type="submit" className="w-full h-11 bg-[#0b5cff] hover:bg-[#094bdd] text-white transition-all">
                Join Meeting
              </Button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#f8f9fb] flex flex-col items-center justify-center text-slate-800 p-6">
        <div className="bg-white border border-gray-200 p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-slate-900">Access Denied</h2>
          <p className="text-gray-500 text-center text-sm mb-6">
            {errMsg || "This meeting room is invalid or has been terminated."}
          </p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => refetch()}
              className="w-full h-11 bg-[#0b5cff] hover:bg-[#094bdd] text-white"
            >
              <RotateCw className="h-4 w-4 mr-2" /> Retry Connection
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full h-11 border-gray-300 text-slate-700"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#f8f9fb] text-slate-800 flex flex-col font-sans overflow-hidden">
      
      {/* Zoom-style CSS Overrides */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Main Video Grid */
        .rtk-video-grid {
          padding: 0 !important;
          gap: 2px !important;
          height: 100% !important;
          background-color: #1a1a1a !important; /* Zoom dark gray video background */
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
          background: #000000 !important; /* Extremely dark bottom bar */
          border-top: none !important;
          border-radius: 0 !important;
          padding: 0 16px !important;
          height: 60px !important;
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
          border-radius: 6px !important;
          width: 64px !important;
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
        
        .rtk-btn-label {
          font-size: 10px !important;
          margin-top: 2px !important;
          font-weight: 400 !important;
        }
        
        /* Icon sizes */
        .rtk-btn svg {
          width: 20px !important;
          height: 20px !important;
          stroke-width: 1.5 !important;
        }
        
        /* Specific colors */
        .rtk-btn.rtk-muted {
          color: #ff3b30 !important;
        }
        
        .rtk-btn-end {
          background-color: #ff3b30 !important;
          color: #fff !important;
          width: auto !important;
          padding: 0 16px !important;
          border-radius: 4px !important;
          height: 32px !important;
          font-weight: 500 !important;
          font-size: 13px !important;
        }
        
        /* Hide SDK's default left-aligned meeting info if present */
        .rtk-meeting-info {
          display: none !important;
        }
      `}} />

      {/* Top Application Navbar (Zoom Workplace Style) */}
      <header className="h-[48px] bg-[#f8f9fb] border-b border-[#e6e6e6] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center text-[#0b5cff] font-semibold tracking-tight text-lg">
            <span className="font-bold">Vyntyra</span>
            <span className="text-gray-800 ml-1 font-normal text-[15px] mt-0.5">Connect</span>
          </div>
          
          <div className="hidden md:flex items-center gap-1 text-gray-400">
            <Button variant="ghost" className="h-7 w-7 p-0 rounded hover:bg-gray-200">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" className="h-7 w-7 p-0 rounded hover:bg-gray-200">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" className="h-7 w-7 p-0 rounded hover:bg-gray-200 ml-1">
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 max-w-[500px] px-4 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search Ctrl+K" 
              className="w-full h-8 bg-[#e8e9ec] border-none rounded-full pl-9 pr-4 text-sm focus-visible:ring-1 focus-visible:ring-[#0b5cff] text-gray-700 placeholder:text-gray-500" 
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" className="bg-[#0b5cff] hover:bg-[#094bdd] text-white h-7 px-4 rounded-full text-xs font-medium">
            Upgrade
          </Button>
          <div className="h-7 w-7 rounded bg-gray-300 overflow-hidden cursor-pointer flex items-center justify-center">
            {/* Mock User Avatar */}
            <div className="w-full h-full bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold">ME</div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Zoom Workplace Style) */}
        <nav className="w-[64px] bg-[#f8f9fb] border-r border-[#e6e6e6] flex flex-col items-center py-2 shrink-0">
          <div className="flex flex-col gap-2 w-full px-2">
            <div className="flex flex-col items-center justify-center py-2 rounded-lg text-gray-500 hover:bg-gray-200 cursor-pointer">
              <Home className="h-5 w-5 mb-1" />
              <span className="text-[10px]">Home</span>
            </div>
            
            <div className="relative flex flex-col items-center justify-center py-2 rounded-lg text-[#0b5cff] bg-[#e6f0ff] cursor-pointer">
              <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#0b5cff] rounded-r-md"></div>
              <Calendar className="h-5 w-5 mb-1" />
              <span className="text-[10px] font-medium">Meetings</span>
            </div>
            
            <div className="flex flex-col items-center justify-center py-2 rounded-lg text-gray-500 hover:bg-gray-200 cursor-pointer">
              <MessageSquare className="h-5 w-5 mb-1" />
              <span className="text-[10px]">Chat</span>
            </div>
            
            <div className="flex flex-col items-center justify-center py-2 rounded-lg text-gray-500 hover:bg-gray-200 cursor-pointer">
              <MoreHorizontal className="h-5 w-5 mb-1" />
              <span className="text-[10px]">More</span>
            </div>
          </div>
          
          <div className="mt-auto pb-4 w-full px-2">
            <div className="flex flex-col items-center justify-center py-2 rounded-lg text-gray-500 hover:bg-gray-200 cursor-pointer">
              <Settings className="h-5 w-5" />
            </div>
          </div>
        </nav>

        {/* Main Meeting Area */}
        <main className="flex-1 relative flex overflow-hidden bg-[#1a1a1a] z-10 p-[1px]">
          <RtkUiProvider meeting={meeting}>
            <div className="flex-1 w-full h-full flex relative overflow-hidden bg-black rounded-tl-sm">
              <div className="flex-1 relative flex flex-col min-w-0 h-full">
                
                {/* Custom Overlay for Top-Left Meeting Info */}
                <div className="absolute top-3 left-4 z-40 flex items-center gap-2">
                  <div 
                    className="text-white hover:text-gray-300 flex items-center gap-2 cursor-pointer transition-colors"
                    onClick={() => setActiveSidebar(activeSidebar === 'info' ? null : 'info')}
                  >
                    <Info className="h-4 w-4" />
                    <span className="text-xs font-semibold drop-shadow-md">
                      {data?.title || "Vyntyra Meeting Room"}
                    </span>
                  </div>
                </div>

                {/* Custom Overlay for Top-Right Controls */}
                <div className="absolute top-3 right-4 z-40 flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-2 py-1 text-white cursor-pointer">
                    <CheckCircle2 className="h-4 w-4 text-[#58B020] fill-[#58B020] text-black" />
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 text-white cursor-pointer hover:bg-white/10 rounded">
                    <LayoutGrid className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 text-white cursor-pointer hover:bg-white/10 rounded">
                    <Maximize className="h-4 w-4" />
                  </div>
                </div>

                {/* RtkMeeting Grid component handles the actual video tiles */}
                <RtkMeeting meeting={meeting} showSetupScreen={false} mode="fill" />
                
                {/* Overlay for translation */}
                <div className="absolute inset-0 pointer-events-none z-40">
                  <TranslationOverlay isEnabled={translationEnabled} targetLanguage={targetLang} />
                </div>

                {/* Zoom-style Interactive Control Bar overlaid on the bottom bar */}
                <div className="absolute bottom-[4px] left-0 right-0 flex items-center justify-between px-4 z-[60] h-[52px]">
                  
                  {/* Left Controls: Working Audio & Video toggles */}
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      onClick={toggleAudio}
                      title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}
                      className={`flex-col h-[52px] w-[64px] gap-1 rounded-lg hover:bg-[#333] transition-colors ${audioEnabled ? 'text-white' : 'text-red-400'}`}
                    >
                      <div className="relative pointer-events-none">
                        {audioEnabled ? (
                          <Mic className="h-5 w-5 text-white" />
                        ) : (
                          <MicOff className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <span className="text-[10px] pointer-events-none">
                        {audioEnabled ? "Mute" : "Unmute"}
                      </span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      onClick={toggleVideo}
                      title={videoEnabled ? "Stop Camera" : "Start Camera"}
                      className={`flex-col h-[52px] w-[64px] gap-1 rounded-lg hover:bg-[#333] transition-colors ${videoEnabled ? 'text-white' : 'text-red-400'}`}
                    >
                      <div className="relative pointer-events-none">
                        {videoEnabled ? (
                          <Video className="h-5 w-5 text-white" />
                        ) : (
                          <VideoOff className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <span className="text-[10px] pointer-events-none">
                        {videoEnabled ? "Stop Video" : "Start Video"}
                      </span>
                    </Button>
                  </div>

                  {/* Center Controls */}
                  <div className="flex items-center gap-0 absolute left-1/2 -translate-x-1/2">
                    <Button 
                      variant="ghost" 
                      className={`flex-col h-[52px] w-[64px] gap-1 rounded-lg hover:bg-[#333] transition-colors ${activeSidebar === 'participants' ? 'bg-[#333] text-white' : 'text-[#b3b3b3] hover:text-white'}`}
                      onClick={() => setActiveSidebar(activeSidebar === 'participants' ? null : 'participants')}
                    >
                      <div className="relative pointer-events-none">
                        <Users className="h-5 w-5" />
                        <div className="absolute -top-1 -right-2 bg-[#333] border border-[#1a1a1a] text-[9px] font-bold px-1 rounded text-white">
                          <RtkParticipantCount />
                        </div>
                      </div>
                      <span className="text-[10px] pointer-events-none">Participants</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className={`flex-col h-[52px] w-[64px] gap-1 rounded-lg hover:bg-[#333] transition-colors ${activeSidebar === 'chat' ? 'bg-[#333] text-white' : 'text-[#b3b3b3] hover:text-white'}`}
                      onClick={() => setActiveSidebar(activeSidebar === 'chat' ? null : 'chat')}
                    >
                      <MessageSquare className="h-5 w-5 pointer-events-none" />
                      <span className="text-[10px] pointer-events-none">Chat</span>
                    </Button>

                    <Button 
                      variant="ghost" 
                      className="flex-col h-[52px] w-[64px] gap-1 rounded-lg hover:bg-[#333] text-[#b3b3b3] hover:text-white transition-colors"
                      onClick={() => {
                        setIsHandRaised(!isHandRaised);
                        toast.info(!isHandRaised ? "Hand raised" : "Hand lowered");
                      }}
                    >
                      <Hand className={`h-5 w-5 pointer-events-none ${isHandRaised ? 'text-yellow-400 fill-yellow-400' : ''}`} />
                      <span className="text-[10px] pointer-events-none">React</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      onClick={toggleScreenShare}
                      title={screenShareEnabled ? "Stop Sharing Screen" : "Share Screen"}
                      className={`flex-col h-[52px] w-[64px] gap-1 rounded-lg hover:bg-[#333] transition-colors ${screenShareEnabled ? 'text-blue-400' : 'text-[#58B020] hover:text-[#58B020]'}`}
                    >
                      <ArrowUpSquare className="h-5 w-5 pointer-events-none" />
                      <span className="text-[10px] pointer-events-none">
                        {screenShareEnabled ? "Stop Share" : "Share"}
                      </span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      onClick={() => setActiveSidebar(activeSidebar === 'info' ? null : 'info')}
                      className="flex-col h-[52px] w-[64px] gap-1 rounded-lg hover:bg-[#333] text-[#b3b3b3] hover:text-white transition-colors"
                    >
                      <Shield className="h-5 w-5 pointer-events-none" />
                      <span className="text-[10px] pointer-events-none">Info</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className={`flex-col h-[52px] w-[64px] gap-1 rounded-lg hover:bg-[#333] transition-colors ${translationEnabled ? 'bg-[#333] text-white' : 'text-[#b3b3b3] hover:text-white'}`}
                      onClick={() => setTranslationEnabled(!translationEnabled)}
                    >
                      <div className="relative pointer-events-none">
                        <Globe className="h-5 w-5" />
                        <span className="absolute -top-1 -right-1 text-[8px] text-blue-400">✨</span>
                      </div>
                      <span className="text-[10px] pointer-events-none">Vyntyra AI</span>
                    </Button>

                  </div>
                  
                  {/* Right Controls: End Call */}
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={handleLeave}
                      className="bg-[#ff3b30] hover:bg-[#ff3b30]/90 text-white font-semibold rounded-md h-[32px] px-4 text-xs"
                    >
                      End
                    </Button>
                  </div>
                </div>
              </div>

              {/* Zoom-style Sidebar Overlay */}
              {activeSidebar && (
                <aside className="w-[320px] shrink-0 bg-white border-l border-gray-200 flex flex-col shadow-2xl relative z-50 transition-all">
                  <div className="h-[52px] px-4 flex items-center justify-between shrink-0 shadow-sm z-10 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800 text-sm">
                        {activeSidebar === 'chat' && 'Meeting Chat'}
                        {activeSidebar === 'participants' && 'Participants'}
                        {activeSidebar === 'info' && 'Meeting Information'}
                      </h3>
                      {(activeSidebar === 'chat' || activeSidebar === 'participants') && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-gray-100 border border-gray-200">
                          <Shield className="h-3 w-3 text-green-600" />
                        </div>
                      )}
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
                        <div className="p-3 text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b border-gray-100">In Meeting</div>
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

                    {activeSidebar === 'info' && (
                      <div className="flex flex-col bg-white h-full p-4 space-y-4">
                        <h4 className="font-semibold text-gray-800">{data?.title || "Vyntyra Meeting Room"}</h4>
                        
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase">Meeting ID / Room</span>
                          <div className="text-sm text-gray-800 font-mono break-all">{roomId}</div>
                        </div>
                        
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase">Status</span>
                          <div className="text-sm text-emerald-600 font-medium">Active & Connected</div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase">Invite Link</span>
                          <div className="text-sm text-[#0b5cff] break-all">{typeof window !== 'undefined' ? window.location.href : ''}</div>
                          <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={() => {
                            if (typeof window !== 'undefined') {
                              navigator.clipboard.writeText(window.location.href);
                              toast.success('Meeting link copied to clipboard');
                            }
                          }}>
                            <Copy className="h-3 w-3 mr-1" /> Copy Link
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </aside>
              )}
            </div>
          </RtkUiProvider>
        </main>
      </div>
    </div>
  );
}
