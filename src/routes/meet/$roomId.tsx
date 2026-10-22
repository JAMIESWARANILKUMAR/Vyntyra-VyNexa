import React, { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getMeetingTokenFn } from '@/lib/meetings.functions';
import { useServerFn } from '@tanstack/react-start';
import RealtimeKitClient from '@cloudflare/realtimekit';
import { RtkUiProvider, RtkMeeting } from '@cloudflare/realtimekit-react-ui';
import { 
  Globe, Loader2, AlertCircle, Lock, Copy, RotateCw, CheckCircle2, ShieldCheck, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Advanced Enterprise Meeting Extensions
import { PreJoinLobby } from '@/components/meet/PreJoinLobby';
import { MeetingNetworkHUD } from '@/components/meet/MeetingNetworkHUD';
import { GridLayoutSelector, GRID_LAYOUT_OPTIONS } from '@/components/meet/GridLayoutSelector';
import { IndianLanguageTranslator, INDIAN_LANGUAGES, IndianLanguage } from '@/components/meet/IndianLanguageTranslator';
import { VideoEnhancerModal, COLOR_FILTERS, BACKGROUND_PRESETS } from '@/components/meet/VideoEnhancerModal';
import { FloatingReactions } from '@/components/meet/FloatingReactions';

export const Route = createFileRoute('/meet/$roomId')({
  component: MeetingRoom
});

function MeetingRoom() {
  const params = Route.useParams() as any;
  const roomId = params.roomId;
  const fetchToken = useServerFn(getMeetingTokenFn);
  
  // Meeting Life-cycle & Lobby State
  const [hasJoinedMeeting, setHasJoinedMeeting] = useState(false);
  const [meeting, setMeeting] = useState<any>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [joinTimeout, setJoinTimeout] = useState(false);

  // Advanced Visuals & Effects
  const [selectedFilter, setSelectedFilter] = useState('natural');
  const [selectedBackground, setSelectedBackground] = useState('none');
  const [currentGridLayout, setCurrentGridLayout] = useState('8');

  // Indian Languages AI Translation State
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const [selectedIndianLanguage, setSelectedIndianLanguage] = useState<IndianLanguage>(INDIAN_LANGUAGES[0]);

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
    if (isLoading || (data && hasJoinedMeeting && !meeting && !initError)) {
      const timer = setTimeout(() => {
        setJoinTimeout(true);
      }, 10000);
      return () => clearTimeout(timer);
    } else {
      setJoinTimeout(false);
    }
  }, [isLoading, data, hasJoinedMeeting, meeting, initError]);

  // Handle joining from Pre-Join Lobby
  const handleJoinFromLobby = (options: { isAudioMuted: boolean; isVideoMuted: boolean }) => {
    if (!data?.token) {
      toast.error("Meeting credentials not ready. Please try again.");
      return;
    }

    setHasJoinedMeeting(true);
    setInitError(null);

    RealtimeKitClient.init({ 
      authToken: data.token,
      defaults: {
        audio: !options.isAudioMuted,
        video: !options.isVideoMuted,
      }
    })
      .then(async (m) => {
        setMeeting(m);
        try {
          await m.join();
        } catch (joinErr: any) {
          console.warn("RealtimeKit m.join error:", joinErr);
        }
      })
      .catch((err: any) => {
        console.error("RealtimeKit init error:", err);
        setInitError(err?.message || "Failed to initialize video call session.");
      });
  };

  // Listen for room exit to smoothly return to portal
  useEffect(() => {
    if (!meeting?.self) return;

    const handleRoomLeft = () => {
      window.location.href = '/';
    };

    try {
      meeting.self.on('roomLeft', handleRoomLeft);
    } catch (_) {}

    return () => {
      try {
        if (typeof meeting.self.removeListener === 'function') {
          meeting.self.removeListener('roomLeft', handleRoomLeft);
        }
      } catch (_) {}
    };
  }, [meeting]);

  // Loading initial token
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090b0e] flex flex-col items-center justify-center text-white relative overflow-hidden p-6">
        <div className="relative z-10 flex flex-col items-center max-w-sm text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#0b5cff] mb-4" />
          <h2 className="text-xl font-medium tracking-tight mb-2">Connecting to Vyntyra Connect...</h2>
          <p className="text-xs text-gray-400">
            Establishing secure high-speed WebRTC session.
          </p>
        </div>
      </div>
    );
  }

  // Handle Auth / Passcode errors
  if (error || !data) {
    const errMsg = error?.message || "";
    
    if (errMsg.includes("AUTH_REQUIRED") || errMsg.includes("UNAUTHORIZED_INTERNAL")) {
      const returnUrl = encodeURIComponent(`/meet/${roomId}`);
      return (
        <div className="min-h-screen bg-[#090b0e] flex flex-col items-center justify-center text-white p-6 relative">
          <div className="bg-[#12151c] border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
            <div className="w-14 h-14 bg-blue-500/10 text-[#0b5cff] rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold mb-2 tracking-tight text-white">Corporate Sign-In Required</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              This meeting is restricted to verified team members and interns. Please sign in to verify your identity and enter the room.
            </p>

            <div className="space-y-3">
              <Button
                onClick={() => window.location.href = `/auth/admin?redirect=${returnUrl}`}
                className="w-full h-11 bg-[#0b5cff] hover:bg-[#094bdd] text-white font-medium rounded-xl"
              >
                Sign In as Administrator / Employee
              </Button>
              <Button
                onClick={() => window.location.href = `/auth/intern?redirect=${returnUrl}`}
                variant="outline"
                className="w-full h-11 border-white/10 bg-white/5 hover:bg-white/10 text-gray-200 font-medium rounded-xl"
              >
                Sign In as Intern
              </Button>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                className="text-xs text-gray-400 hover:text-white"
              >
                <RotateCw className="h-3.5 w-3.5 mr-1" /> Retry Connection
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (errMsg.includes("INVALID_PASSWORD")) {
      return (
        <div className="min-h-screen bg-[#090b0e] flex flex-col items-center justify-center text-white p-6 relative">
          <div className="bg-[#12151c] border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-2 text-center tracking-tight text-white">Enter Meeting Passcode</h2>
            <p className="text-gray-400 text-center mb-8 text-sm">Please enter the meeting passcode to join.</p>
            
            <form onSubmit={(e) => { e.preventDefault(); setSubmittedPassword(passwordInput); setSubmittedGuestName(guestNameInput); }} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Guest Name</label>
                <Input value={guestNameInput} onChange={e => setGuestNameInput(e.target.value)} placeholder="Your Name" className="h-11 bg-black/40 border-white/10 text-white rounded-xl" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Meeting Passcode</label>
                <Input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="Enter passcode" className="h-11 bg-black/40 border-white/10 text-white rounded-xl" required />
              </div>
              {submittedPassword && (
                <div className="text-rose-400 text-sm p-3 rounded-xl flex items-center gap-2 bg-rose-500/10 border border-rose-500/20">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <p>Incorrect passcode. Please try again.</p>
                </div>
              )}
              <Button type="submit" className="w-full h-11 bg-[#0b5cff] hover:bg-[#094bdd] text-white font-medium rounded-xl transition-all">
                Join Meeting
              </Button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#090b0e] flex flex-col items-center justify-center text-white p-6">
        <div className="bg-[#12151c] border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-white">Access Denied</h2>
          <p className="text-gray-400 text-center text-sm mb-6 leading-relaxed">
            {errMsg || "This meeting room is invalid or has been terminated."}
          </p>
          <div className="flex flex-col gap-2.5">
            <Button
              onClick={() => refetch()}
              className="w-full h-11 bg-[#0b5cff] hover:bg-[#094bdd] text-white rounded-xl"
            >
              <RotateCw className="h-4 w-4 mr-2" /> Retry Connection
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full h-11 border-white/10 bg-white/5 hover:bg-white/10 text-gray-200 rounded-xl"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Pre-Join Green Room / Lobby Preview
  if (!hasJoinedMeeting) {
    return (
      <PreJoinLobby
        title={data.title}
        roomId={roomId}
        userName={submittedGuestName || ""}
        onJoin={handleJoinFromLobby}
        selectedFilter={selectedFilter}
        selectedBackground={selectedBackground}
        onSelectFilter={setSelectedFilter}
        onSelectBackground={setSelectedBackground}
      />
    );
  }

  // Joining In Progress
  if (hasJoinedMeeting && !meeting && !initError) {
    return (
      <div className="min-h-screen bg-[#090b0e] flex flex-col items-center justify-center text-white relative overflow-hidden p-6">
        <div className="relative z-10 flex flex-col items-center max-w-sm text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#0b5cff] mb-4" />
          <h2 className="text-xl font-medium tracking-tight mb-2">Entering Live Conference...</h2>
          <p className="text-xs text-gray-400">
            Synchronizing participants, camera feeds, and encryption keys.
          </p>

          {joinTimeout && (
            <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center animate-in fade-in duration-300">
              <p className="text-xs text-yellow-400 mb-3">
                Connection is taking longer than usual. You can retry the handshake.
              </p>
              <Button
                onClick={() => {
                  setMeeting(null);
                  refetch();
                }}
                size="sm"
                className="bg-[#0b5cff] hover:bg-[#094bdd] text-white text-xs h-8 px-4 rounded-xl"
              >
                <RotateCw className="h-3.5 w-3.5 mr-1.5" /> Reconnect Now
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Error during initialization
  if (initError) {
    return (
      <div className="min-h-screen bg-[#090b0e] flex flex-col items-center justify-center text-white p-6">
        <div className="bg-[#12151c] border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-white">Connection Failed</h2>
          <p className="text-gray-400 text-center text-sm mb-6 leading-relaxed">
            {initError}
          </p>
          <div className="flex flex-col gap-2.5">
            <Button
              onClick={() => {
                setInitError(null);
                setMeeting(null);
                setHasJoinedMeeting(false);
                refetch();
              }}
              className="w-full h-11 bg-[#0b5cff] hover:bg-[#094bdd] text-white font-medium rounded-xl"
            >
              <RotateCw className="h-4 w-4 mr-2" /> Back to Green Room
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full h-11 border-white/10 bg-white/5 hover:bg-white/10 text-gray-200 rounded-xl"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const activeColorFilterCss = COLOR_FILTERS.find(f => f.id === selectedFilter)?.filterCss || 'none';
  const activeBgPreset = BACKGROUND_PRESETS.find(b => b.id === selectedBackground);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#080808] text-white flex flex-col font-sans overflow-hidden select-none">
      
      {/* Dynamic Video Enhancement & Layout CSS Injection */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Dynamic Hardware Color Enhancer */
        .rtk-video-tile video {
          filter: ${activeColorFilterCss} !important;
          transition: filter 0.3s ease !important;
        }

        /* Virtual Background Simulation on Video Canvas */
        ${activeBgPreset?.type === 'blur' ? `
          .rtk-video-tile {
            backdrop-filter: blur(${activeBgPreset.blurAmount || 12}px) !important;
          }
        ` : ''}

        ${activeBgPreset?.type === 'image' ? `
          .rtk-video-tile {
            background-image: url('${activeBgPreset.preview}') !important;
            background-size: cover !important;
            background-position: center !important;
          }
        ` : ''}

        /* Ensure RealtimeKit Meeting Component Fills 100% of Screen */
        rtk-meeting {
          display: flex !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}} />

      {/* Sleek Floating Glassmorphic Top Header */}
      <header className="absolute top-0 left-0 right-0 h-14 px-4 flex items-center justify-between z-40 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none">
        
        {/* Left: Branding, Room Title & Copy Invite */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-lg">
            <span className="font-bold text-[#0b5cff] text-sm tracking-tight">Vyntyra</span>
            <span className="text-gray-500 text-xs font-light">|</span>
            <span className="text-xs font-medium text-gray-100 max-w-[200px] truncate">
              {data?.title || "Vyntyra Meeting"}
            </span>
            <span className="text-gray-500 text-xs font-light">·</span>
            <span className="font-mono text-xs text-blue-400 font-semibold">{roomId}</span>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (typeof window !== 'undefined') {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Short meeting link copied!");
              }
            }}
            className="h-8 px-2.5 bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/10 text-gray-200 hover:text-white rounded-full text-xs transition-all shadow-sm"
            title="Copy Short Link"
          >
            <Copy className="h-3.5 w-3.5 mr-1 text-blue-400" />
            <span className="hidden sm:inline">Copy Link</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (typeof window !== 'undefined') {
                navigator.clipboard.writeText(roomId);
                toast.success(`Meeting code copied: ${roomId}`);
              }
            }}
            className="h-8 px-2 bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/10 text-gray-300 hover:text-white rounded-full text-xs transition-all shadow-sm font-mono"
            title="Copy Room Code Only"
          >
            Copy Code
          </Button>
        </div>

        {/* Right: Telemetry, Grid Resizer, Video Enhancer, Indian Languages & Reactions */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Live Network Speed & Ping HUD */}
          <MeetingNetworkHUD />

          {/* Dynamic Grid Resizer (4 to 1000 participants) */}
          <GridLayoutSelector
            currentLayout={currentGridLayout}
            onSelectLayout={(layoutId) => {
              setCurrentGridLayout(layoutId);
              toast.info(`Grid adjusted to ${layoutId} tiles format`);
            }}
          />

          {/* Video Enhancer & Dynamic Color View */}
          <VideoEnhancerModal
            activeFilter={selectedFilter}
            activeBackground={selectedBackground}
            onSelectFilter={(f) => {
              setSelectedFilter(f);
              toast.success("Video filter applied");
            }}
            onSelectBackground={(b) => {
              setSelectedBackground(b);
              toast.success("Background effect updated");
            }}
          />

          {/* Indian Languages AI Translator */}
          <IndianLanguageTranslator
            isEnabled={translationEnabled}
            onToggle={() => setTranslationEnabled(!translationEnabled)}
            selectedLanguage={selectedIndianLanguage}
            onLanguageChange={(lang) => {
              setSelectedIndianLanguage(lang);
              toast.success(`Translated into ${lang.name} (${lang.nativeName})`);
            }}
          />

          {/* Animated Floating Emojis Burst */}
          <FloatingReactions />
        </div>
      </header>

      {/* Main Full-Bleed Video Conference Canvas */}
      <main className="flex-1 w-full h-full relative overflow-hidden bg-[#080808]">
        <RtkUiProvider meeting={meeting}>
          <RtkMeeting meeting={meeting} showSetupScreen={false} />
        </RtkUiProvider>
      </main>
    </div>
  );
}
