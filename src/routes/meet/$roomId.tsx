import React, { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getMeetingTokenFn } from '@/lib/meetings.functions';
import { useServerFn } from '@tanstack/react-start';
import RealtimeKitClient from '@cloudflare/realtimekit';
import { RtkUiProvider, RtkMeeting } from '@cloudflare/realtimekit-react-ui';
import { 
  Globe, Loader2, AlertCircle, Lock, Copy, RotateCw
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
  const [joinTimeout, setJoinTimeout] = useState(false);

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

  if (isLoading || (data && !meeting && !initError)) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex flex-col items-center justify-center text-white relative overflow-hidden p-6">
        <div className="relative z-10 flex flex-col items-center max-w-sm text-center">
          <Loader2 className="h-9 w-9 animate-spin text-[#0b5cff] mb-4" />
          <h2 className="text-xl font-medium tracking-tight mb-2">Connecting to Vyntyra Connect...</h2>
          <p className="text-xs text-gray-400">
            Establishing secure WebRTC conference session.
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
      <div className="min-h-screen bg-[#0f1115] flex flex-col items-center justify-center text-white p-6">
        <div className="bg-[#181b20] border border-white/10 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
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
                refetch();
              }}
              className="w-full h-11 bg-[#0b5cff] hover:bg-[#094bdd] text-white font-medium"
            >
              <RotateCw className="h-4 w-4 mr-2" /> Retry Connection
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full h-11 border-white/10 bg-white/5 hover:bg-white/10 text-gray-200"
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
        <div className="min-h-screen bg-[#0f1115] flex flex-col items-center justify-center text-white p-6 relative">
          <div className="bg-[#181b20] border border-white/10 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
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
                className="w-full h-11 bg-[#0b5cff] hover:bg-[#094bdd] text-white font-medium"
              >
                Sign In as Administrator / Employee
              </Button>
              <Button
                onClick={() => window.location.href = `/auth/intern?redirect=${returnUrl}`}
                variant="outline"
                className="w-full h-11 border-white/10 bg-white/5 hover:bg-white/10 text-gray-200 font-medium"
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
        <div className="min-h-screen bg-[#0f1115] flex flex-col items-center justify-center text-white p-6 relative">
          <div className="bg-[#181b20] border border-white/10 p-8 rounded-2xl shadow-2xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-2 text-center tracking-tight text-white">Enter Meeting Passcode</h2>
            <p className="text-gray-400 text-center mb-8 text-sm">Please enter the meeting passcode to join.</p>
            
            <form onSubmit={(e) => { e.preventDefault(); setSubmittedPassword(passwordInput); setSubmittedGuestName(guestNameInput); }} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Guest Name</label>
                <Input value={guestNameInput} onChange={e => setGuestNameInput(e.target.value)} placeholder="Your Name" className="h-11 bg-black/40 border-white/10 text-white" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Meeting Passcode</label>
                <Input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="Enter passcode" className="h-11 bg-black/40 border-white/10 text-white" required />
              </div>
              {submittedPassword && (
                <div className="text-rose-400 text-sm p-3 rounded-lg flex items-center gap-2 bg-rose-500/10 border border-rose-500/20">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <p>Incorrect passcode. Please try again.</p>
                </div>
              )}
              <Button type="submit" className="w-full h-11 bg-[#0b5cff] hover:bg-[#094bdd] text-white font-medium transition-all">
                Join Meeting
              </Button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#0f1115] flex flex-col items-center justify-center text-white p-6">
        <div className="bg-[#181b20] border border-white/10 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-white">Access Denied</h2>
          <p className="text-gray-400 text-center text-sm mb-6 leading-relaxed">
            {errMsg || "This meeting room is invalid or has been terminated."}
          </p>
          <div className="flex flex-col gap-2.5">
            <Button
              onClick={() => refetch()}
              className="w-full h-11 bg-[#0b5cff] hover:bg-[#094bdd] text-white"
            >
              <RotateCw className="h-4 w-4 mr-2" /> Retry Connection
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full h-11 border-white/10 bg-white/5 hover:bg-white/10 text-gray-200"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#080808] text-white flex flex-col font-sans overflow-hidden select-none">
      
      {/* Sleek Floating Top Header */}
      <header className="absolute top-0 left-0 right-0 h-14 px-4 flex items-center justify-between z-40 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none">
        {/* Left: Branding & Meeting Title */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-lg">
            <span className="font-bold text-[#0b5cff] text-sm tracking-tight">Vyntyra</span>
            <span className="text-gray-500 text-xs font-light">|</span>
            <span className="text-xs font-medium text-gray-100 max-w-[280px] truncate">
              {data?.title || "Vyntyra Meeting"}
            </span>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (typeof window !== 'undefined') {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Meeting invite link copied!");
              }
            }}
            className="h-8 px-2.5 bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/10 text-gray-200 hover:text-white rounded-full text-xs transition-all shadow-sm"
            title="Copy Meeting Invite Link"
          >
            <Copy className="h-3.5 w-3.5 mr-1 text-blue-400" />
            <span className="hidden sm:inline">Copy Link</span>
          </Button>
        </div>

        {/* Right: AI Translation Button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setTranslationEnabled(!translationEnabled);
              toast.info(!translationEnabled ? "AI Translation Enabled" : "AI Translation Disabled");
            }}
            className={`h-8 px-3 rounded-full text-xs font-medium transition-all backdrop-blur-md border shadow-sm ${
              translationEnabled 
                ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20' 
                : 'bg-black/50 hover:bg-black/80 text-gray-200 border-white/10'
            }`}
          >
            <Globe className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
            <span>AI Translation</span>
          </Button>
        </div>
      </header>

      {/* Main Full-Bleed Video Conference Canvas */}
      <main className="flex-1 w-full h-full relative overflow-hidden bg-[#080808]">
        <RtkUiProvider meeting={meeting}>
          <RtkMeeting meeting={meeting} showSetupScreen={false} />
        </RtkUiProvider>

        {/* Live Translation Captions Overlay (Centered cleanly above native control bar) */}
        <div className="absolute bottom-20 left-0 right-0 pointer-events-none z-30 flex justify-center px-4">
          <TranslationOverlay isEnabled={translationEnabled} targetLanguage={targetLang} />
        </div>
      </main>
    </div>
  );
}
