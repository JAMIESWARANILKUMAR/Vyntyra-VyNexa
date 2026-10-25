import React, { useState, useEffect, useRef } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getMeetingTokenFn, recordMeetingTelemetryFn } from '@/lib/meetings.functions';
import { useServerFn } from '@tanstack/react-start';
import RealtimeKitClient from '@cloudflare/realtimekit';
import { RtkUiProvider, RtkMeeting } from '@cloudflare/realtimekit-react-ui';
import { 
  Globe, Loader2, AlertCircle, Lock, Copy, RotateCw, CheckCircle2, 
  ShieldCheck, Sparkles, Sliders, X, Shield, FileSpreadsheet, Users, UserX,
  Briefcase, GraduationCap, KeyRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Advanced Enterprise Meeting Extensions
import { PreJoinLobby } from '@/components/meet/PreJoinLobby';
import { MeetingNetworkHUD } from '@/components/meet/MeetingNetworkHUD';
import { GridLayoutSelector, GRID_LAYOUT_OPTIONS } from '@/components/meet/GridLayoutSelector';
import { IndianLanguageTranslator, INDIAN_LANGUAGES, IndianLanguage } from '@/components/meet/IndianLanguageTranslator';
import { VideoEnhancerModal, COLOR_FILTERS, BACKGROUND_PRESETS } from '@/components/meet/VideoEnhancerModal';
import { FloatingReactions } from '@/components/meet/FloatingReactions';
import { HostControlsModal } from '@/components/meet/HostControlsModal';
import { MeetingAttendanceModal } from '@/components/meet/MeetingAttendanceModal';
import { AudioEnhancerModal, AudioMode } from '@/components/meet/AudioEnhancerModal';
import { AppleHelloGreeting } from '@/components/meet/AppleHelloGreeting';
import { PostMeetingSummary } from '@/components/meet/PostMeetingSummary';

export const Route = createFileRoute('/meet/$roomId')({
  component: MeetingRoom
});

function MeetingRoom() {
  const params = Route.useParams() as any;
  const roomId = params.roomId;
  const fetchToken = useServerFn(getMeetingTokenFn);
  
  // Meeting Life-cycle & Lobby State
  const [hasJoinedMeeting, setHasJoinedMeeting] = useState(false);
  const [showAppleGreeting, setShowAppleGreeting] = useState(false);
  const [pendingJoinOptions, setPendingJoinOptions] = useState<any>(null);
  const [hasLeftMeeting, setHasLeftMeeting] = useState(false);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(1);
  const [meeting, setMeeting] = useState<any>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [joinTimeout, setJoinTimeout] = useState(false);

  // Advanced Visuals & Effects
  const [selectedFilter, setSelectedFilter] = useState('natural');
  const [selectedBackground, setSelectedBackground] = useState('none');
  const [currentGridLayout, setCurrentGridLayout] = useState('8');
  const [audioMode, setAudioMode] = useState<AudioMode>('dolby');

  // Indian Languages AI Translation State
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const [selectedIndianLanguage, setSelectedIndianLanguage] = useState<IndianLanguage>(INDIAN_LANGUAGES[0]);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);

  // Enterprise Host Controls & Attendance Modals
  const [isHostControlsOpen, setIsHostControlsOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [roomSettings, setRoomSettings] = useState<any>({});

  // Auth, Access Code & Guest Gatekeeper Credentials
  const [accessCodeState, setAccessCodeState] = useState<string | undefined>(undefined);
  const [submittedPassword, setSubmittedPassword] = useState<string | undefined>(undefined);
  const [submittedGuestName, setSubmittedGuestName] = useState<string | undefined>(undefined);
  const [guestCredentials, setGuestCredentials] = useState<{
    guestEmail?: string;
    guestPhone?: string;
    guestOrg?: string;
    internId?: string | null;
    isVerified?: boolean;
  }>({});
  const [passwordInput, setPasswordInput] = useState('');
  const [guestNameInput, setGuestNameInput] = useState('');

  const sessionStartTimeRef = useRef<number>(Date.now());

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['meet-token', roomId, submittedPassword, submittedGuestName, guestCredentials.guestEmail, guestCredentials.internId, accessCodeState],
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
          accessCode: accessCodeState,
          internId: guestCredentials.internId || undefined,
          guestName: submittedGuestName,
          guestEmail: guestCredentials.guestEmail,
          guestPhone: guestCredentials.guestPhone,
          guestOrg: guestCredentials.guestOrg,
          authToken 
        } 
      });
    },
    retry: false
  });

  // Sync room settings
  useEffect(() => {
    if (data?.permissions) {
      setRoomSettings(data.permissions);
    }
  }, [data]);

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

  // Handle joining from Pre-Join Lobby - triggers iconic Apple "hello" animation!
  const handleJoinFromLobby = (options: { 
    isAudioMuted: boolean; 
    isVideoMuted: boolean;
    joinMethod?: string;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    guestOrg?: string;
    accessCode?: string;
    internId?: string | null;
    isVerified?: boolean;
    password?: string;
  }) => {
    if (options.guestName) {
      setSubmittedGuestName(options.guestName);
    }
    if (options.password) {
      setSubmittedPassword(options.password);
    }
    if (options.accessCode) {
      setAccessCodeState(options.accessCode);
    }
    setGuestCredentials({
      guestEmail: options.guestEmail,
      guestPhone: options.guestPhone,
      guestOrg: options.guestOrg,
      internId: options.internId,
      isVerified: options.isVerified,
    });

    setPendingJoinOptions(options);
    // Trigger Apple "hello" text animation before entering conference!
    setShowAppleGreeting(true);
  };

  // Called when Apple "hello" animation completes
  const handleAppleGreetingComplete = () => {
    setShowAppleGreeting(false);
    const opts = pendingJoinOptions;
    if (!opts) return;

    if (!data?.token) {
      refetch().then(res => {
        if (res.data?.token) {
          connectToMeeting(res.data.token, opts);
        } else {
          toast.error("Connecting credentials... please tap Join again.");
        }
      });
      return;
    }

    connectToMeeting(data.token, opts);
  };

  const connectToMeeting = (token: string, options: any) => {
    setHasJoinedMeeting(true);
    setInitError(null);
    sessionStartTimeRef.current = Date.now();

    RealtimeKitClient.init({ 
      authToken: token,
      defaults: {
        audio: !options.isAudioMuted,
        video: !options.isVideoMuted,
      }
    })
      .then(async (m) => {
        setMeeting(m);
        try {
          await m.join();

          // Record connection telemetry in database
          recordMeetingTelemetryFn({
            data: {
              meetingId: roomId,
              participantId: data?.participantId || m.self?.id || 'attendee',
              userName: data?.participantName || options.guestName || "Attendee",
              userEmail: guestCredentials.guestEmail,
              phone: guestCredentials.guestPhone,
              internId: data?.internId || guestCredentials.internId || undefined,
              userType: data?.userType || (data?.isHost ? 'host' : 'guest'),
              action: 'join',
              deviceMetadata: typeof navigator !== 'undefined' ? `${navigator.userAgent}` : undefined,
            }
          }).catch(err => console.warn("Join telemetry error:", err));

        } catch (joinErr: any) {
          console.warn("RealtimeKit m.join error:", joinErr);
        }
      })
      .catch((err: any) => {
        console.error("RealtimeKit init error:", err);
        setInitError(err?.message || "Failed to initialize video call session.");
      });
  };

  // Telemetry Heartbeat & Supabase Realtime Remote Host Actions
  useEffect(() => {
    if (!meeting || !hasJoinedMeeting) return;

    // Heartbeat every 25 seconds to record active duration
    const interval = setInterval(() => {
      const elapsedSeconds = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
      recordMeetingTelemetryFn({
        data: {
          meetingId: roomId,
          participantId: data?.participantId || meeting.self?.id || 'attendee',
          userName: data?.participantName || 'Attendee',
          action: 'ping',
          durationSeconds: elapsedSeconds,
        }
      }).catch(() => {});
    }, 25000);

    // Listen for Host Commands on Realtime Channel
    const channel = supabase.channel(`meet-controls-${roomId}`)
      .on('broadcast', { event: 'mute_all' }, () => {
        if (!data?.isHost && !data?.isCoHost) {
          try {
            if (meeting.self?.disableAudio) {
              meeting.self.disableAudio();
            }
          } catch (_) {}
          toast.info("The host has muted all participants.");
        }
      })
      .on('broadcast', { event: 'meeting_lock_changed' }, ({ payload }: any) => {
        setRoomSettings((prev: any) => ({ ...prev, isLocked: payload?.isLocked }));
        toast.info(payload?.isLocked ? "Meeting has been locked by the host." : "Meeting has been unlocked.");
      })
      .on('broadcast', { event: 'eject_participant' }, ({ payload }: any) => {
        const myId = data?.participantId || meeting.self?.id;
        const myName = data?.participantName;
        if (payload?.targetId === myId || (myName && payload?.targetName === myName)) {
          try { meeting.leave?.(); } catch (_) {}
          toast.error("You have been removed from this meeting by the host.");
          window.location.href = '/';
        }
      })
      .subscribe();

    // Log leave on window unload
    const handleBeforeUnload = () => {
      const elapsedSeconds = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
      recordMeetingTelemetryFn({
        data: {
          meetingId: roomId,
          participantId: data?.participantId || meeting.self?.id || 'attendee',
          userName: data?.participantName || 'Attendee',
          action: 'leave',
          durationSeconds: elapsedSeconds,
        }
      }).catch(() => {});
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [meeting, hasJoinedMeeting, roomId, data]);

  // Listen for room exit to smoothly display stylish post-meeting animation
  useEffect(() => {
    if (!meeting?.self) return;

    const handleRoomLeft = () => {
      const duration = Math.max(1, Math.round((Date.now() - sessionStartTimeRef.current) / 60000));
      setSessionDurationMinutes(duration);
      setHasLeftMeeting(true);
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
            Establishing secure high-speed WebRTC session with RBAC authentication.
          </p>
        </div>
      </div>
    );
  }

  // Handle Auth / Passcode / Lock / Eject errors
  if (error || !data) {
    const errMsg = error?.message || "";
    
    if (errMsg.includes("ROOM_LOCKED")) {
      return (
        <div className="min-h-screen bg-[#090b0e] flex flex-col items-center justify-center text-white p-6 relative">
          <div className="bg-[#12151c] border border-amber-500/30 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
            <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold mb-2 tracking-tight text-white">Meeting is Locked</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              The host has locked this meeting room. No new attendees can enter at this time. Please contact the host or try again later.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => refetch()}
                className="w-full h-11 bg-[#0b5cff] hover:bg-[#094bdd] text-white font-medium rounded-xl"
              >
                <RotateCw className="h-4 w-4 mr-2" /> Check if Unlocked
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="w-full h-11 border-white/10 bg-white/5 text-gray-200 font-medium rounded-xl"
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (errMsg.includes("ACCESS_EJECTED")) {
      return (
        <div className="min-h-screen bg-[#090b0e] flex flex-col items-center justify-center text-white p-6 relative">
          <div className="bg-[#12151c] border border-rose-500/30 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
            <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <UserX className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold mb-2 tracking-tight text-white">Removed from Meeting</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              You were removed from this meeting session by the host and cannot re-enter.
            </p>
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full h-11 bg-[#0b5cff] hover:bg-[#094bdd] text-white font-medium rounded-xl"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    if (errMsg.includes("AUTH_REQUIRED") || errMsg.includes("UNAUTHORIZED_INTERNAL") || errMsg.includes("MANDATORY_DETAILS_REQUIRED")) {
      const returnUrl = encodeURIComponent(`/meet/${roomId}`);
      return (
        <div className="min-h-screen bg-[#090b0e] flex flex-col items-center justify-center text-white p-6 relative">
          <div className="bg-[#12151c] border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
            <div className="w-14 h-14 bg-blue-500/10 text-[#0b5cff] rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold mb-2 tracking-tight text-white">Corporate Sign-In Required</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              This meeting is restricted to verified team members and interns. Please sign in with your Vyntyra account or join using an authorized 8-digit access code.
            </p>

            <div className="space-y-3">
              <Button
                onClick={() => window.location.href = `/auth/admin?redirect=${returnUrl}`}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl flex items-center justify-center gap-2"
              >
                <Briefcase className="h-4 w-4" />
                <span>Sign In as Administrator / Employee</span>
              </Button>
              <Button
                onClick={() => window.location.href = `/auth/intern?redirect=${returnUrl}`}
                variant="outline"
                className="w-full h-11 border-purple-500/30 bg-purple-600/15 hover:bg-purple-600/25 text-purple-200 font-medium rounded-xl flex items-center justify-center gap-2"
              >
                <GraduationCap className="h-4 w-4 text-purple-300" />
                <span>Sign In as Intern</span>
              </Button>

              <div className="relative py-1 flex items-center justify-center">
                <div className="border-t border-white/10 w-full" />
                <span className="bg-[#12151c] px-3 text-[10px] text-gray-400 uppercase tracking-wider absolute">
                  Or Guest Access Code
                </span>
              </div>

              <div className="flex gap-2">
                <Input
                  value={accessCodeState || ''}
                  onChange={(e) => setAccessCodeState(e.target.value.toUpperCase())}
                  placeholder="Enter 8-digit code"
                  className="h-10 bg-black/60 font-mono tracking-widest text-xs uppercase rounded-xl border-white/10"
                />
                <Button
                  onClick={() => {
                    if (!accessCodeState || accessCodeState.length < 6) {
                      toast.error("Please enter a valid 8-digit access code.");
                      return;
                    }
                    refetch();
                  }}
                  className="h-10 bg-[#0b5cff] hover:bg-[#094bdd] text-white text-xs px-4 rounded-xl font-medium"
                >
                  Join
                </Button>
              </div>
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

  // Post-Meeting Thanks for Joining Screen
  if (hasLeftMeeting) {
    return (
      <PostMeetingSummary
        joineeName={data?.participantName || submittedGuestName || "Attendee"}
        meetingTitle={data?.title || "Live Conference Session"}
        roomId={roomId}
        durationMinutes={sessionDurationMinutes}
        internId={data?.internId || guestCredentials.internId}
        audioMode={audioMode === 'dolby' ? 'Dolby Audio (Spatial 3D)' : audioMode === 'stereo' ? 'Studio Stereo' : 'Crisp Mono'}
        onRejoin={() => {
          setHasLeftMeeting(false);
          setHasJoinedMeeting(false);
          refetch();
        }}
        onReturnHome={() => {
          window.location.href = '/';
        }}
      />
    );
  }

  // Apple "hello" Typography & Multilingual Welcome Animation
  if (showAppleGreeting) {
    return (
      <AppleHelloGreeting
        attendeeName={submittedGuestName || data?.participantName || "Attendee"}
        internId={guestCredentials.internId || data?.internId}
        onComplete={handleAppleGreetingComplete}
      />
    );
  }

  // Pre-Join Green Room / Lobby Preview
  if (!hasJoinedMeeting) {
    return (
      <PreJoinLobby
        title={data.title}
        roomId={roomId}
        userName={submittedGuestName || data?.participantName || ""}
        initialUserType={data?.userType}
        initialInternId={data?.internId || guestCredentials.internId}
        initialEmail={guestCredentials.guestEmail}
        isInitiallyVerified={data?.isVerified}
        defaultAccessCode={accessCodeState || data?.accessCode}
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
  const isHostUser = Boolean(data?.isHost || data?.isCoHost || data?.isSuperHost);

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

        /* Hide RealtimeKit's duplicate top header so our unified header looks pristine and clean */
        .rtk-meeting-header, 
        rtk-header, 
        [data-part="header"],
        .rtk-top-bar,
        .rtk-header-container,
        rtk-meeting > header,
        .rtk-meeting-title,
        .rtk-title-bar {
          display: none !important;
        }

        /* Ensure RealtimeKit Meeting Component Fills 100% of Screen and adapts cleanly across all devices */
        rtk-meeting {
          display: flex !important;
          width: 100% !important;
          height: 100% !important;
        }

        /* Responsive layout adaptation for smartphone, laptop, desktop, ultra-wide & projectors */
        @media (max-width: 640px) {
          .rtk-meeting-container {
            padding-bottom: 68px !important;
            padding-top: 56px !important;
          }
          .rtk-control-bar {
            padding: 6px !important;
            gap: 4px !important;
          }
        }

        @media (min-width: 1920px) {
          .rtk-video-tile {
            border-radius: 16px !important;
          }
          .rtk-meeting {
            max-width: 100% !important;
          }
        }
      `}} />

      {/* Sleek Floating Glassmorphic Top Header */}
      <header className="absolute top-0 left-0 right-0 h-14 px-3 sm:px-4 flex items-center justify-between z-40 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none">
        
        {/* Left: Branding, Room Title & Sleek Share Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-black/60 backdrop-blur-xl border border-white/10 px-2.5 sm:px-3 py-1.5 rounded-full shadow-lg">
            <img src="/icon-512.png" alt="Vyntyra Logo" className="h-4.5 w-4.5 sm:h-5 sm:w-5 object-contain rounded-md shadow-sm shrink-0" />
            <span className="font-bold text-white text-xs tracking-tight hidden sm:inline">Vyntyra</span>
            <span className="text-gray-500 text-xs font-light hidden sm:inline">|</span>
            <span className="text-xs font-semibold text-gray-100 max-w-[100px] sm:max-w-[160px] truncate" title={data?.title}>
              {data?.title || "Live Meeting"}
            </span>
            <span className="text-gray-600 text-xs">·</span>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  navigator.clipboard.writeText(roomId);
                  toast.success(`Meeting code copied: ${roomId}`);
                }
              }}
              className="font-mono text-xs text-blue-400 font-semibold hover:underline"
              title="Click to copy code"
            >
              {roomId.length > 15 ? `#${roomId.slice(0, 8)}` : roomId}
            </button>
          </div>

          {/* Desktop Direct Copy Action */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (typeof window !== 'undefined') {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Meeting link copied to clipboard!");
              }
            }}
            className="hidden md:inline-flex h-8 px-2.5 bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/10 text-gray-200 hover:text-white rounded-full text-xs transition-all shadow-sm items-center gap-1.5"
            title="Copy Meeting Link"
          >
            <Copy className="h-3.5 w-3.5 text-blue-400" />
            <span>Copy Link</span>
          </Button>

          {/* Verified Intern / Employee Tag */}
          {data?.internId && (
            <div className="hidden lg:flex items-center gap-1 bg-blue-500/15 border border-blue-500/30 px-2.5 py-1 rounded-full text-[10px] font-mono text-blue-300">
              <ShieldCheck className="h-3 w-3 text-blue-400" />
              <span>{data.internId}</span>
            </div>
          )}
        </div>

        {/* Right Section: Responsive Controls, Host Tools & Attendance */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {/* Live Network Speed & Ping HUD */}
          <MeetingNetworkHUD />

          {/* Desktop Controls */}
          <div className="hidden md:flex items-center gap-2">
            
            {/* Host Tools Pill (Only for Hosts / Co-Hosts / Super Admins) */}
            {isHostUser && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsHostControlsOpen(true)}
                className="h-8 px-2.5 bg-blue-600/25 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                title="Enterprise Host Controls & Security"
              >
                <Shield className="h-3.5 w-3.5 text-blue-400" />
                <span className="hidden lg:inline">Host Controls</span>
              </Button>
            )}

            {/* Smart Attendance & Session Telemetry Pill */}
            {isHostUser && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsAttendanceOpen(true)}
                className="h-8 px-2.5 bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                title="Smart Attendance & Session Telemetry"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden lg:inline">Attendance</span>
              </Button>
            )}

            {/* Dolby Audio & Hi-Fi Encoding Engine */}
            <AudioEnhancerModal
              activeMode={audioMode}
              onModeChange={(m) => setAudioMode(m)}
            />

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
          </div>

          {/* Smartphone Clean Tools Trigger */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsMobileToolsOpen(true)}
            className="md:hidden h-8 px-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-gray-200 rounded-full text-xs flex items-center gap-1 shadow-sm"
            title="Meeting Settings & Tools"
          >
            <Sliders className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-[11px] font-semibold">Tools</span>
          </Button>
        </div>
      </header>

      {/* Main Full-Bleed Video Conference Canvas */}
      <main className="flex-1 w-full h-full relative overflow-hidden bg-[#080808]">
        {/* Transparent Vyntyra Meet Watermark (14px mobile / 16px desktop) */}
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none select-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/25 backdrop-blur-sm border border-white/5 opacity-50 hover:opacity-80 transition-opacity">
          <img src="/icon-512.png" alt="Vyntyra Logo" className="h-4 w-4 object-contain rounded opacity-75" />
          <span className="text-[14px] sm:text-[16px] font-semibold tracking-wider text-white/80 font-sans">
            Vyntyra Meet
          </span>
        </div>

        <RtkUiProvider meeting={meeting}>
          <RtkMeeting meeting={meeting} showSetupScreen={false} />
        </RtkUiProvider>
      </main>

      {/* ─── Bottom Floating Reaction Emoji Launcher ─── */}
      <FloatingReactions 
        roomId={roomId}
        userName={data?.participantName || submittedGuestName || "You"}
      />

      {/* ─── Host Controls Modal ─── */}
      <HostControlsModal
        isOpen={isHostControlsOpen}
        onClose={() => setIsHostControlsOpen(false)}
        roomId={roomId}
        meeting={meeting}
        currentSettings={roomSettings}
        onSettingsUpdate={(newSettings) => setRoomSettings(newSettings)}
      />

      {/* ─── Attendance & Telemetry Modal ─── */}
      <MeetingAttendanceModal
        isOpen={isAttendanceOpen}
        onClose={() => setIsAttendanceOpen(false)}
        roomId={roomId}
        meetingTitle={data?.title || "Live Meeting"}
      />

      {/* ─── Mobile Meeting Controls Drawer ─── */}
      <Dialog open={isMobileToolsOpen} onOpenChange={setIsMobileToolsOpen}>
        <DialogContent className="sm:max-w-md bg-[#0e1118]/98 backdrop-blur-2xl border-white/15 text-white rounded-3xl p-5 shadow-2xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-between text-white">
              <span className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-blue-400" />
                Meeting Controls & Tools
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            
            {/* Host Tools Quick Access for Mobile */}
            {isHostUser && (
              <div className="p-3 bg-blue-600/15 border border-blue-500/30 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-semibold text-blue-300 block">Host Security Controls</span>
                  <span className="text-[10px] text-gray-400">Lock room, mute all, eject participants</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsMobileToolsOpen(false);
                    setIsHostControlsOpen(true);
                  }}
                  className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] rounded-xl font-semibold"
                >
                  Manage
                </Button>
              </div>
            )}

            {/* Smart Attendance Quick Access for Mobile */}
            {isHostUser && (
              <div className="p-3 bg-emerald-600/15 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-semibold text-emerald-300 block">Smart Attendance & Excel</span>
                  <span className="text-[10px] text-gray-400">Track minutes, intern IDs, export .csv</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsMobileToolsOpen(false);
                    setIsAttendanceOpen(true);
                  }}
                  className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] rounded-xl font-semibold"
                >
                  View
                </Button>
              </div>
            )}

            {/* Share Meeting Link & Code */}
            <div className="p-3 bg-black/40 border border-white/10 rounded-2xl space-y-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Meeting Details</span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-blue-400 text-xs truncate select-all">{roomId}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Meeting link copied!");
                    }}
                    className="h-7 px-2.5 text-[11px] border-white/10 bg-white/5"
                  >
                    Copy Link
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(roomId);
                      toast.success("Room code copied!");
                    }}
                    className="h-7 px-2.5 text-[11px] border-white/10 bg-white/5 font-mono"
                  >
                    Copy Code
                  </Button>
                </div>
              </div>
            </div>

            {/* Dolby Audio & Encoding Controls */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Dolby & Audio Encoding</span>
                <span className="text-[11px] text-gray-400">Dolby 3D, Studio Stereo, Mono & mic/speaker</span>
              </div>
              <AudioEnhancerModal
                activeMode={audioMode}
                onModeChange={(m) => setAudioMode(m)}
              />
            </div>

            {/* Video Enhancer Controls */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Video Lighting & Filters</span>
                <span className="text-[11px] text-gray-400">Low-light boost, studio light, and filters</span>
              </div>
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
            </div>

            {/* Indian Languages AI Subtitles */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Indian Languages Translation</span>
                <span className="text-[11px] text-gray-400">13 Indian languages real-time AI subtitles</span>
              </div>
              <IndianLanguageTranslator
                isEnabled={translationEnabled}
                onToggle={() => setTranslationEnabled(!translationEnabled)}
                selectedLanguage={selectedIndianLanguage}
                onLanguageChange={(lang) => {
                  setSelectedIndianLanguage(lang);
                  toast.success(`Translated into ${lang.name}`);
                }}
              />
            </div>

            {/* Dynamic Grid Resizer */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Participant Grid Layout</span>
                <span className="text-[11px] text-gray-400">Switch between 4, 8, 16, or auditorium tiles</span>
              </div>
              <GridLayoutSelector
                currentLayout={currentGridLayout}
                onSelectLayout={(layoutId) => {
                  setCurrentGridLayout(layoutId);
                  toast.info(`Grid layout adjusted to ${layoutId}`);
                }}
              />
            </div>

          </div>

          <div className="pt-2 flex justify-end">
            <Button
              onClick={() => setIsMobileToolsOpen(false)}
              className="bg-[#0b5cff] hover:bg-[#094bdd] text-white text-xs rounded-xl h-9 px-5 font-semibold"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
