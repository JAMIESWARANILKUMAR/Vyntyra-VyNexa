import React, { useState, useEffect, useRef } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getMeetingTokenFn, recordMeetingTelemetryFn } from '@/lib/meetings.functions';
import { applyDspToAllMeetingMedia } from '@/lib/meet-audio-dsp';
import { useServerFn } from '@tanstack/react-start';
import RealtimeKitClient from '@cloudflare/realtimekit';
import { RtkUiProvider, RtkMeeting, createDefaultConfig } from '@cloudflare/realtimekit-react-ui';
import { 
  Globe, Loader2, AlertCircle, Lock, Copy, RotateCw, CheckCircle2, 
  ShieldCheck, Sparkles, Sliders, X, Shield, FileSpreadsheet, Users, UserX,
  Briefcase, GraduationCap, KeyRound, Pen, FileText, Music, LayoutGrid, Settings
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
import { MeetingSettingsModal, MeetingPreferences, getSavedPreferences, WAVEFORM_THEMES } from '@/components/meet/MeetingSettingsModal';

// Meeting Plugins
import { MeetingWhiteboardModal } from '@/components/meet/MeetingWhiteboardModal';
import { MeetingNotesPlugin } from '@/components/meet/MeetingNotesPlugin';
import { MeetingSoundboardPlugin } from '@/components/meet/MeetingSoundboardPlugin';

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

  // Meeting Preferences & Waveform Styling State
  const [meetingPrefs, setMeetingPrefs] = useState<MeetingPreferences>(getSavedPreferences);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Indian Languages AI Translation State
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const [selectedIndianLanguage, setSelectedIndianLanguage] = useState<IndianLanguage>(INDIAN_LANGUAGES[0]);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);

  // Enterprise Host Controls & Attendance Modals
  const [isHostControlsOpen, setIsHostControlsOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [roomSettings, setRoomSettings] = useState<any>({});

  // Meeting Plugins State
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false);

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
  const [meetingTimer, setMeetingTimer] = useState('00:00');

  // Executive Live Meeting Duration Clock
  useEffect(() => {
    if (!hasJoinedMeeting) return;
    const interval = setInterval(() => {
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - sessionStartTimeRef.current) / 1000));
      const hours = Math.floor(elapsedSeconds / 3600);
      const mins = Math.floor((elapsedSeconds % 3600) / 60);
      const secs = elapsedSeconds % 60;
      if (hours > 0) {
        setMeetingTimer(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      } else {
        setMeetingTimer(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [hasJoinedMeeting]);

  // Clean RealtimeKit configuration that strips out default duplicate headers
  const rtkConfig = React.useMemo(() => {
    try {
      const cfg = createDefaultConfig();
      if (cfg?.root?.['rtk-meeting[meeting=joined]']) {
        cfg.root['rtk-meeting[meeting=joined]'] = [
          'rtk-stage',
          'rtk-controlbar',
          'rtk-participants-audio',
          'rtk-dialog-manager'
        ];
      }
      if (cfg?.styles) {
        cfg.styles['rtk-header'] = { display: 'none !important', height: '0px' };
        cfg.styles['rtk-header.sm'] = { display: 'none !important', height: '0px' };
        cfg.styles['div#header-center'] = { display: 'none !important' };
        cfg.styles['rtk-meeting-title'] = { display: 'none !important' };
      }
      return cfg;
    } catch (e) {
      return undefined;
    }
  }, []);

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

  // Monitor RealtimeKit Live Recording Status
  useEffect(() => {
    if (!meeting?.recording) return;

    const checkRecordingState = () => {
      try {
        const state = meeting.recording?.recordingState;
        setIsRecording(state === 'RECORDING' || state === 'STARTING');
      } catch (_) {}
    };

    checkRecordingState();

    try {
      meeting.recording.on('recordingUpdate', checkRecordingState);
      return () => {
        try {
          if (typeof meeting.recording.removeListener === 'function') {
            meeting.recording.removeListener('recordingUpdate', checkRecordingState);
          }
        } catch (_) {}
      };
    } catch (_) {}
  }, [meeting]);

  // Active Color Filter & Virtual Background Presets
  const activeColorFilterCss = COLOR_FILTERS.find(f => f.id === selectedFilter)?.filterCss || 'none';
  const activeBgPreset = BACKGROUND_PRESETS.find(b => b.id === selectedBackground);
  const activeWaveTheme = WAVEFORM_THEMES.find(t => t.id === meetingPrefs.waveformThemeId) || WAVEFORM_THEMES[0];

  // Direct DOM Video FX Engine (Recursively penetrates Shadow DOM to apply Color Enhancers, Virtual Backgrounds & Waveform Styles)
  useEffect(() => {
    const bgUrl = activeBgPreset?.imageUrl || activeBgPreset?.preview;

    const applyVideoEffects = () => {
      // Helper to recursively traverse light DOM and Web Component Shadow Roots
      function walk(root: Node | ShadowRoot) {
        if (!root) return;

        // Process <video> elements inside Shadow DOM or Light DOM
        if (root instanceof HTMLVideoElement) {
          const combinedFilter = `${activeColorFilterCss !== 'none' ? activeColorFilterCss : ''} ${
            activeBgPreset?.type === 'blur' ? `blur(${Math.min(activeBgPreset.blurAmount || 12, 6)}px)` : ''
          }`.trim() || 'none';

          root.style.setProperty('filter', combinedFilter, 'important');
          root.style.setProperty('transition', 'filter 0.3s ease, mask-image 0.3s ease', 'important');

          if (meetingPrefs.mirrorVideo) {
            root.style.setProperty('transform', 'scaleX(-1)', 'important');
          }

          if (activeBgPreset?.type === 'image') {
            root.style.setProperty('-webkit-mask-image', 'radial-gradient(ellipse 68% 80% at 50% 50%, black 50%, rgba(0,0,0,0.4) 75%, transparent 100%)', 'important');
            root.style.setProperty('mask-image', 'radial-gradient(ellipse 68% 80% at 50% 50%, black 50%, rgba(0,0,0,0.4) 75%, transparent 100%)', 'important');
          } else {
            root.style.removeProperty('-webkit-mask-image');
            root.style.removeProperty('mask-image');
          }
        }

        // Process Speaking Waveform Canvas inside Shadow DOM (e.g. inside rtk-audio-visualizer)
        if (root instanceof HTMLCanvasElement && (root.classList.contains('bars') || root.getAttribute('part') === 'canvas')) {
          root.style.setProperty('color', activeWaveTheme.color, 'important');
          root.style.setProperty('filter', `drop-shadow(0 0 4px ${activeWaveTheme.glow}) drop-shadow(0 0 8px ${activeWaveTheme.glow2})`, 'important');
        }

        // Process Participant Tile containers
        if (root instanceof HTMLElement) {
          const tag = root.tagName.toLowerCase();
          if (tag === 'rtk-participant-tile' || root.classList.contains('rtk-participant-tile') || root.classList.contains('rtk-video-tile')) {
            if (activeBgPreset?.type === 'image' && bgUrl) {
              root.style.setProperty('background-image', `url('${bgUrl}')`, 'important');
              root.style.setProperty('background-size', 'cover', 'important');
              root.style.setProperty('background-position', 'center', 'important');
              root.style.setProperty('background-repeat', 'no-repeat', 'important');
            } else {
              root.style.removeProperty('background-image');
              root.style.removeProperty('background-size');
              root.style.removeProperty('background-position');
              root.style.removeProperty('background-repeat');
            }
          }

          // Style Name Tag Glass Capsule
          if (tag === 'rtk-name-tag' || root.classList.contains('rtk-name-tag')) {
            root.style.setProperty('border-radius', '9999px', 'important');
            root.style.setProperty('backdrop-filter', 'blur(16px)', 'important');
            root.style.setProperty('-webkit-backdrop-filter', 'blur(16px)', 'important');
          }
        }

        // Traverse into Shadow Root
        if ((root as Element).shadowRoot) {
          walk((root as Element).shadowRoot!);
        }
        root.childNodes.forEach(child => walk(child));
      }

      walk(document.body);
    };

    applyVideoEffects();
    const observer = new MutationObserver(applyVideoEffects);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    return () => observer.disconnect();
  }, [activeColorFilterCss, activeBgPreset, activeWaveTheme, meetingPrefs.mirrorVideo]);

  // Real-time Web Audio DSP Engine (Dolby 3D Audio, Studio Stereo, Crisp Mono)
  useEffect(() => {
    if (!meeting || !hasJoinedMeeting) return;
    applyDspToAllMeetingMedia(audioMode);

    const observer = new MutationObserver(() => {
      applyDspToAllMeetingMedia(audioMode);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [audioMode, meeting, hasJoinedMeeting]);

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

  const isSuperHostUser = Boolean(
    data?.isSuperHost || 
    data?.userType === 'super_host' ||
    (guestCredentials.guestEmail && guestCredentials.guestEmail.trim().toLowerCase() === 'hr@vyntyraconsultancyservices.in') ||
    (submittedGuestName && submittedGuestName.toLowerCase().includes('hr')) ||
    (data?.participantName && data.participantName.toLowerCase().includes('hr')) ||
    (meeting?.self?.name && meeting.self.name.toLowerCase().includes('hr')) ||
    (meeting?.self?.email && meeting.self.email.toLowerCase().includes('hr'))
  );
  const isHostUser = Boolean(data?.isHost || data?.isCoHost || data?.isSuperHost || isSuperHostUser || meeting?.self?.isHost || meeting?.self?.permissions?.canManageRoom);

  const activeBgUrl = activeBgPreset?.imageUrl || activeBgPreset?.preview;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#080808] text-white flex flex-col font-sans overflow-hidden select-none">
      
      {/* Dynamic Video Enhancement & Layout CSS Injection */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Dynamic Hardware Color Enhancer & Background Filter penetrating Shadow DOM */
        rtk-participant-tile::part(video),
        rtk-video::part(video),
        *::part(video),
        [part="video"],
        video,
        rtk-video video,
        rtk-participant-tile video,
        .rtk-video-tile video,
        [data-part="video"],
        .rtk-video video,
        rtk-meeting video {
          filter: ${activeColorFilterCss !== 'none' ? activeColorFilterCss : ''} ${activeBgPreset?.type === 'blur' ? `blur(${Math.min(activeBgPreset.blurAmount || 12, 6)}px)` : ''} !important;
          ${activeBgPreset?.type === 'image' ? `
            -webkit-mask-image: radial-gradient(ellipse 68% 80% at 50% 50%, black 50%, rgba(0,0,0,0.4) 75%, transparent 100%) !important;
            mask-image: radial-gradient(ellipse 68% 80% at 50% 50%, black 50%, rgba(0,0,0,0.4) 75%, transparent 100%) !important;
          ` : `
            -webkit-mask-image: none !important;
            mask-image: none !important;
          `}
          transition: filter 0.3s ease, mask-image 0.3s ease !important;
        }

        /* Virtual Background Backdrop on Participant Tiles */
        ${activeBgPreset?.type === 'image' && activeBgUrl ? `
          rtk-participant-tile,
          .rtk-participant-tile,
          .rtk-video-tile,
          rtk-video {
            background-image: url('${activeBgUrl}') !important;
            background-size: cover !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
          }
        ` : ''}

        /* ── RealtimeKit Root Cleanup: completely eliminate ghost headers & titles ── */
        rtk-header,
        .rtk-header,
        .rtk-meeting-header, 
        [data-part="header"],
        .rtk-top-bar,
        .rtk-header-container,
        rtk-meeting > header,
        rtk-meeting-title,
        .rtk-meeting-title,
        .rtk-title-bar,
        div#header-center,
        div#header-left,
        div#header-right {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          max-height: 0 !important;
          opacity: 0 !important;
          pointer-events: none !important;
          overflow: hidden !important;
        }

        /* Ensure RealtimeKit Meeting Component Fills 100% of Screen */
        rtk-meeting,
        .rtk-meeting,
        .rtk-meeting-container {
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
          height: 100% !important;
          background: #080808 !important;
          overflow: hidden !important;
        }

        /* ── Participant Video Tiles: Executive Obsidian Bevel & Cinematic Depth ── */
        rtk-participant-tile,
        .rtk-participant-tile,
        .rtk-video-tile {
          border-radius: 20px !important;
          overflow: hidden !important;
          box-shadow: 0 16px 40px -12px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08) !important;
          background: #0d1017 !important;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        /* ── Speaking Wave Audio Visualizer (Dynamic Color & Neon Glow) ── */
        rtk-audio-visualizer,
        rtk-audio-visualizer::part(canvas),
        canvas.bars,
        [part="canvas"] {
          color: ${activeWaveTheme.color} !important;
          --rtk-colors-brand-500: ${activeWaveTheme.color} !important;
          filter: drop-shadow(0 0 4px ${activeWaveTheme.glow}) drop-shadow(0 0 8px ${activeWaveTheme.glow2}) !important;
          transition: color 0.3s ease, filter 0.3s ease !important;
        }

        @keyframes rtkWavePulse {
          0%, 100% {
            filter: drop-shadow(0 0 3px ${activeWaveTheme.glow}) drop-shadow(0 0 6px ${activeWaveTheme.glow2});
            transform: scale(1);
          }
          50% {
            filter: drop-shadow(0 0 6px ${activeWaveTheme.color}) drop-shadow(0 0 12px ${activeWaveTheme.glow});
            transform: scale(1.05);
          }
        }

        rtk-audio-visualizer canvas.visible,
        rtk-audio-visualizer canvas.bars,
        rtk-audio-visualizer::part(canvas) {
          animation: rtkWavePulse 2s ease-in-out infinite alternate !important;
        }

        /* ── Participant Name Tags: Polished Frosted Glass Capsule ── */
        rtk-name-tag,
        .rtk-name-tag,
        [data-part="name-tag"] {
          background: ${
            meetingPrefs.nameTagStyle === 'minimal'
              ? 'rgba(0, 0, 0, 0.45)'
              : meetingPrefs.nameTagStyle === 'solid'
                ? 'rgba(15, 18, 26, 0.95)'
                : 'rgba(10, 13, 22, 0.82)'
          } !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border: 1px solid rgba(255, 255, 255, 0.14) !important;
          border-radius: 9999px !important;
          color: #f8fafc !important;
          font-weight: 600 !important;
          padding: 4px 12px !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5) !important;
          letter-spacing: 0.02em !important;
          transition: all 0.25s ease !important;
        }

        rtk-name-tag span.name {
          font-weight: 600 !important;
          color: #ffffff !important;
        }

        ${meetingPrefs.hideSelfView ? `
          rtk-participant-tile[is-self="true"],
          rtk-participant-tile[data-self="true"] {
            display: none !important;
          }
        ` : ''}

        /* ── Bottom WebRTC Control Bar: Floating Corporate Glass Dock ── */
        rtk-controlbar,
        .rtk-controlbar,
        [data-part="control-bar"] {
          background: rgba(9, 12, 18, 0.88) !important;
          backdrop-filter: blur(28px) !important;
          border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.6) !important;
          transition: background 0.3s ease !important;
        }

        /* ── Refined Crimson Glass Leave Button ── */
        rtk-leave-button button,
        button[data-part="leave"],
        .rtk-leave-button button {
          background: rgba(239, 68, 68, 0.16) !important;
          border: 1px solid rgba(239, 68, 68, 0.35) !important;
          color: #fca5a5 !important;
          border-radius: 12px !important;
          transition: all 0.2s ease !important;
        }
        rtk-leave-button button:hover,
        button[data-part="leave"]:hover,
        .rtk-leave-button button:hover {
          background: rgba(239, 68, 68, 0.35) !important;
          border-color: rgba(239, 68, 68, 0.6) !important;
          color: #ffffff !important;
        }

        /* ── Responsive Mobile Portrait Video Layout (max-width: 768px) ── */
        @media (max-width: 768px) {
          rtk-meeting,
          .rtk-meeting,
          .rtk-meeting-container,
          [data-part="container"] {
            padding-top: 52px !important;
            padding-bottom: 72px !important;
            box-sizing: border-box !important;
          }

          /* Video grid expands to fill portrait smartphone viewport */
          rtk-grid,
          .rtk-grid,
          [data-part="grid"] {
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            height: 100% !important;
            flex: 1 1 auto !important;
            justify-content: center !important;
            align-items: center !important;
            gap: 8px !important;
            padding: 6px !important;
            box-sizing: border-box !important;
          }

          /* Video tile fills vertical height nicely instead of tiny 16:9 letterbox */
          rtk-participant-tile,
          .rtk-participant-tile,
          .rtk-video-tile {
            width: 100% !important;
            height: 100% !important;
            min-height: 55vh !important;
            max-height: calc(100vh - 135px) !important;
            border-radius: 24px !important;
            overflow: hidden !important;
            background: #11141c !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            margin: 0 !important;
            aspect-ratio: auto !important;
          }

          /* Video stream fills tile in portrait mode */
          rtk-participant-tile video,
          rtk-video video,
          .rtk-video-tile video,
          video {
            object-fit: cover !important;
            width: 100% !important;
            height: 100% !important;
            border-radius: 22px !important;
          }

          /* Clean touch-friendly bottom control bar */
          rtk-control-bar,
          .rtk-control-bar,
          [data-part="control-bar"] {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            height: 64px !important;
            padding: 8px 12px !important;
            padding-bottom: max(8px, env(safe-area-inset-bottom)) !important;
            background: rgba(8, 10, 15, 0.94) !important;
            backdrop-filter: blur(24px) !important;
            border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
            display: flex !important;
            justify-content: space-around !important;
            align-items: center !important;
            z-index: 30 !important;
            gap: 4px !important;
            overflow-x: auto !important;
            scrollbar-width: none !important;
          }

          rtk-control-bar button,
          .rtk-control-bar button,
          rtk-button {
            min-width: 42px !important;
            height: 42px !important;
            border-radius: 14px !important;
          }
        }

        @media (min-width: 1024px) {
          .rtk-video-tile {
            border-radius: 20px !important;
          }
          .rtk-meeting {
            max-width: 100% !important;
          }
        }
      `}} />

      {/* Sleek Floating Glassmorphic Top Header with Mobile Safe Area */}
      <header className="absolute top-0 left-0 right-0 h-14 sm:h-16 pt-[max(6px,env(safe-area-inset-top))] sm:pt-1 px-3 sm:px-5 flex items-center justify-between z-40 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none">
        
        {/* Left: Branding, Room Title, Live Clock & Sleek Share Pill */}
        <div className="flex items-center gap-2 sm:gap-2.5 pointer-events-auto">
          <div className="flex items-center gap-2 bg-[#0a0d14]/85 backdrop-blur-2xl border border-white/10 px-3 py-1.5 rounded-full shadow-2xl">
            <img src="/icon-512.png" alt="Vyntyra Logo" className="h-5 w-5 object-contain rounded-md shadow-sm shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-xs tracking-tight">VCS</span>
              <span className="text-gray-500 text-xs font-light">|</span>
              <span className="text-xs font-medium text-gray-200 max-w-[100px] sm:max-w-[200px] truncate" title={data?.title}>
                {data?.title || "Live Meeting"}
              </span>
            </div>
            <span className="text-gray-600 text-xs">·</span>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  navigator.clipboard.writeText(roomId);
                  toast.success(`Meeting code copied: ${roomId}`);
                }
              }}
              className="font-mono text-xs text-blue-400 font-medium hover:text-blue-300 hover:underline"
              title="Click to copy room code"
            >
              {roomId.length > 12 ? `#${roomId.slice(0, 8)}` : roomId}
            </button>
          </div>

          {/* Live Meeting Duration Timer Pill (Emerald LIVE badge) */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-semibold text-emerald-300 backdrop-blur-md shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="tracking-wider uppercase text-[9px] text-emerald-400 font-bold">LIVE</span>
            <span className="font-mono text-gray-200">{meetingTimer}</span>
          </div>

          {/* Genuine Active Recording Indicator (ONLY visible when recording is truly triggered!) */}
          {isRecording && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-[10px] font-bold text-red-300 backdrop-blur-md shadow-sm animate-pulse">
              <span className="h-2 w-2 rounded-full bg-red-500"></span>
              <span className="tracking-wider uppercase text-[9px] text-red-400 font-bold">REC</span>
            </div>
          )}

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
            className="hidden md:inline-flex h-8 px-3 bg-[#0a0d14]/75 hover:bg-black/90 backdrop-blur-xl border border-white/10 text-gray-300 hover:text-white rounded-full text-xs transition-all shadow-md items-center gap-1.5"
            title="Copy Meeting Link"
          >
            <Copy className="h-3.5 w-3.5 text-blue-400" />
            <span className="font-medium">Copy Link</span>
          </Button>

          {/* Verified Intern / Employee Tag */}
          {data?.internId && (
            <div className="hidden lg:flex items-center gap-1.5 bg-blue-500/15 border border-blue-500/30 px-3 py-1 rounded-full text-[10px] font-mono text-blue-300 backdrop-blur-md">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              <span>{data.internId}</span>
            </div>
          )}
        </div>

        {/* Right Section: Stream HUD & Enterprise Suite Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 pointer-events-auto">
          {/* Live Network Speed & Ping HUD */}
          <MeetingNetworkHUD />

          {/* Desktop Executive Controls (hidden on screens < 1024px to prevent clutter) */}
          <div className="hidden lg:flex items-center gap-2 bg-[#0a0d14]/80 backdrop-blur-2xl border border-white/10 p-1 rounded-full shadow-2xl">
            
            {/* Group 1: Collaboration Suite */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsWhiteboardOpen(true)}
              className="h-7.5 px-2.5 hover:bg-white/10 text-gray-200 hover:text-white rounded-full text-xs transition-all flex items-center gap-1.5"
              title="Collaborative Whiteboard"
            >
              <Pen className="h-3.5 w-3.5 text-blue-400" />
              <span className="font-medium">Whiteboard</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsNotesOpen(true)}
              className="h-7.5 px-2.5 hover:bg-white/10 text-gray-200 hover:text-white rounded-full text-xs transition-all flex items-center gap-1.5"
              title="Meeting Notes & Tasks"
            >
              <FileText className="h-3.5 w-3.5 text-purple-400" />
              <span className="font-medium">Notes</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsSoundboardOpen(true)}
              className="h-7.5 px-2.5 hover:bg-white/10 text-gray-200 hover:text-white rounded-full text-xs transition-all flex items-center gap-1.5"
              title="Meeting Soundboard FX"
            >
              <Music className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-medium">FX</span>
            </Button>

            <div className="h-4 w-px bg-white/10 mx-0.5" />

            {/* Group 2: Audio & Video Studio */}
            <AudioEnhancerModal
              activeMode={audioMode}
              onModeChange={(m) => setAudioMode(m)}
            />

            <GridLayoutSelector
              currentLayout={currentGridLayout}
              onSelectLayout={(layoutId) => {
                setCurrentGridLayout(layoutId);
                toast.info(`Grid adjusted to ${layoutId} tiles format`);
              }}
            />

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

            <IndianLanguageTranslator
              isEnabled={translationEnabled}
              onToggle={() => setTranslationEnabled(!translationEnabled)}
              selectedLanguage={selectedIndianLanguage}
              onLanguageChange={(lang) => {
                setSelectedIndianLanguage(lang);
                toast.success(`Translated into ${lang.name} (${lang.nativeName})`);
              }}
            />

            {/* Group 2.5: Settings & Preferences */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsSettingsOpen(true)}
              className="h-7.5 px-2.5 hover:bg-white/10 text-gray-200 hover:text-white rounded-full text-xs transition-all flex items-center gap-1.5"
              title="Meeting Settings, Devices & Waveform Style"
            >
              <Settings className="h-3.5 w-3.5 text-blue-400" />
              <span className="font-medium">Settings</span>
            </Button>

            {/* Group 2.6: Attendance Action - Visible to ALL participants! */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsAttendanceOpen(true)}
              className="h-7.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/35 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title={isHostUser ? "View Complete Attendance Roster & Export CSV" : "Mark & Verify Your Meeting Attendance"}
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              <span>{isHostUser ? "Attendance Roster" : "Mark Attendance"}</span>
            </Button>

            {/* Group 3: Host Privilege Controls */}
            {isHostUser && (
              <>
                <div className="h-4 w-px bg-white/10 mx-0.5" />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsHostControlsOpen(true)}
                  className={`h-7.5 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isSuperHostUser
                      ? 'bg-amber-500/25 hover:bg-amber-500/40 text-amber-300 border border-amber-500/45 shadow-amber-500/20'
                      : 'bg-blue-600/25 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40'
                  }`}
                  title="Enterprise Host Controls & Security"
                >
                  <Shield className={`h-3.5 w-3.5 ${isSuperHostUser ? 'text-amber-400' : 'text-blue-400'}`} />
                  <span>{isSuperHostUser ? "Super Host" : "Host"}</span>
                </Button>
              </>
            )}

          </div>

          {/* Quick Whiteboard Shortcut for Mobile */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsWhiteboardOpen(true)}
            className="lg:hidden h-8 w-8 p-0 bg-[#0a0d14]/80 hover:bg-black/90 backdrop-blur-xl border border-white/10 text-gray-200 rounded-full flex items-center justify-center shadow-md"
            title="Whiteboard"
          >
            <Pen className="h-3.5 w-3.5 text-blue-400" />
          </Button>

          {/* Smartphone Clean Tools Trigger */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsMobileToolsOpen(true)}
            className="lg:hidden h-8 px-3 bg-[#0a0d14]/80 hover:bg-black/90 backdrop-blur-xl border border-white/10 text-gray-200 rounded-full text-xs flex items-center gap-1.5 shadow-md"
            title="Meeting Settings, Plugins & Tools"
          >
            <Sliders className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-[11px] font-semibold">Tools</span>
          </Button>
        </div>
      </header>

      {/* Main Full-Bleed Video Conference Canvas */}
      <main className="flex-1 w-full h-full relative overflow-hidden bg-[#080808]">
        {/* ─── High-End Enterprise Continuous Security Watermark ─── */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20">
          {meetingPrefs.watermarkVisibility !== 'off' && (
            <div 
              className={`w-[200%] h-[200%] -top-[50%] -left-[50%] absolute grid grid-cols-2 sm:grid-cols-3 gap-y-24 sm:gap-y-32 gap-x-12 sm:gap-x-20 transform -rotate-[22deg] ${
                meetingPrefs.watermarkVisibility === 'high' ? 'opacity-[0.065]' : 'opacity-[0.025] sm:opacity-[0.032]'
              } text-white font-mono text-[9px] sm:text-[11px] font-normal tracking-[0.35em] uppercase justify-items-center items-center`}
            >
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 whitespace-nowrap">
                  <span>VYNTYRA VCS</span>
                  <span>·</span>
                  <span>CONFIDENTIAL</span>
                  <span>·</span>
                  <span>{roomId.slice(0, 8).toUpperCase()}</span>
                  <span>·</span>
                  <span>{(data?.internId || submittedGuestName || data?.participantName || "AUTHORIZED ATTENDEE").toUpperCase()}</span>
                </div>
              ))}
            </div>
          )}

          {/* Top-Right Session Security Stamp */}
          <div className="absolute top-16 right-3 sm:top-16 sm:right-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0a0d14]/75 backdrop-blur-xl border border-white/10 text-[10px] font-mono tracking-wider text-gray-300 shadow-xl pointer-events-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-white/90">VCS ENCRYPTED</span>
            <span className="text-gray-600">|</span>
            <span className="text-blue-400">#{roomId.slice(0, 8).toUpperCase()}</span>
            {data?.internId && (
              <>
                <span className="text-gray-600">·</span>
                <span className="text-emerald-400 font-medium">{data.internId}</span>
              </>
            )}
          </div>
        </div>

        <RtkUiProvider meeting={meeting}>
          <RtkMeeting meeting={meeting} config={rtkConfig} showSetupScreen={false} />
        </RtkUiProvider>
      </main>

      {/* ─── Bottom Floating Reaction Emoji Launcher ─── */}
      <FloatingReactions 
        roomId={roomId}
        userName={data?.participantName || submittedGuestName || "You"}
      />

      {/* ─── Meeting Settings & Studio Preferences Modal ─── */}
      <MeetingSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        meeting={meeting}
        currentPrefs={meetingPrefs}
        onUpdatePrefs={(newPrefs) => setMeetingPrefs(newPrefs)}
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
        isHost={isHostUser}
        currentUser={{
          name: meeting?.self?.name || submittedGuestName || data?.participantName || "Participant",
          email: guestCredentials.guestEmail || data?.email,
          internId: guestCredentials.internId || data?.internId,
          userType: data?.userType
        }}
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
            
            {/* Studio Settings Quick Trigger on Mobile */}
            <div className="p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600/30 text-blue-400">
                  <Settings className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-semibold text-white block">Settings & Waveform FX</span>
                  <span className="text-[10px] text-gray-400">Audio waves color, mic test, video quality</span>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setIsMobileToolsOpen(false);
                  setIsSettingsOpen(true);
                }}
                className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] rounded-xl font-semibold shrink-0"
              >
                Open
              </Button>
            </div>
            
            {/* Host Tools Quick Access for Mobile */}
            {isHostUser && (
              <div className={`p-3 border rounded-2xl flex items-center justify-between ${
                isSuperHostUser ? 'bg-amber-500/15 border-amber-500/35' : 'bg-blue-600/15 border-blue-500/30'
              }`}>
                <div>
                  <span className={`font-semibold block ${isSuperHostUser ? 'text-amber-300' : 'text-blue-300'}`}>
                    {isSuperHostUser ? "👑 Super Host Controls" : "Host Security Controls"}
                  </span>
                  <span className="text-[10px] text-gray-400">Lock room, mute all, eject participants</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsMobileToolsOpen(false);
                    setIsHostControlsOpen(true);
                  }}
                  className={`h-7 px-3 text-white text-[11px] rounded-xl font-semibold ${
                    isSuperHostUser ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Manage
                </Button>
              </div>
            )}

            {/* Attendance Quick Access for Mobile (Visible to ALL participants!) */}
            <div className="p-3 bg-emerald-600/15 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-semibold text-emerald-300 block">
                  {isHostUser ? "Smart Attendance Roster" : "Mark My Attendance"}
                </span>
                <span className="text-[10px] text-gray-400">
                  {isHostUser ? "Track minutes, intern IDs, export .csv" : "Punch-in and confirm your meeting presence"}
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setIsMobileToolsOpen(false);
                  setIsAttendanceOpen(true);
                }}
                className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] rounded-xl font-semibold"
              >
                {isHostUser ? "View" : "Punch In"}
              </Button>
            </div>

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

            {/* ─── Interactive Meeting Plugins Suite ─── */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block px-1">
                Interactive Meeting Plugins
              </span>

              {/* Plugin 1: Collaborative Whiteboard */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/25 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <Pen className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">Collaborative Whiteboard</span>
                    <span className="text-[10px] text-gray-400">Live sketch, architecture diagrams & doubts</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsMobileToolsOpen(false);
                    setIsWhiteboardOpen(true);
                  }}
                  className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] rounded-xl font-semibold shrink-0"
                >
                  Open
                </Button>
              </div>

              {/* Plugin 2: Shared Meeting Notes */}
              <div className="p-3 bg-purple-500/10 border border-purple-500/25 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">Meeting Notes & Action Items</span>
                    <span className="text-[10px] text-gray-400">Shared agenda, tasks checklist & export</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsMobileToolsOpen(false);
                    setIsNotesOpen(true);
                  }}
                  className="h-7 px-3 bg-purple-600 hover:bg-purple-700 text-white text-[11px] rounded-xl font-semibold shrink-0"
                >
                  Open
                </Button>
              </div>

              {/* Plugin 3: Meeting Soundboard FX */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Music className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">Soundboard Audio Cues</span>
                    <span className="text-[10px] text-gray-400">Applause, timer bell, chimes & fanfares</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsMobileToolsOpen(false);
                    setIsSoundboardOpen(true);
                  }}
                  className="h-7 px-3 bg-amber-600 hover:bg-amber-700 text-white text-[11px] rounded-xl font-semibold shrink-0"
                >
                  Open
                </Button>
              </div>
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

      {/* ─── Interactive Whiteboard Plugin Modal ─── */}
      <MeetingWhiteboardModal
        isOpen={isWhiteboardOpen}
        onClose={() => setIsWhiteboardOpen(false)}
        roomId={roomId}
        userName={data?.participantName || submittedGuestName || "You"}
      />

      {/* ─── Collaborative Meeting Notes Plugin Modal ─── */}
      <MeetingNotesPlugin
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        roomId={roomId}
        meetingTitle={data?.title || "Meeting"}
        userName={data?.participantName || submittedGuestName || "You"}
      />

      {/* ─── Meeting Soundboard FX Plugin Modal ─── */}
      <MeetingSoundboardPlugin
        isOpen={isSoundboardOpen}
        onClose={() => setIsSoundboardOpen(false)}
        roomId={roomId}
        userName={data?.participantName || submittedGuestName || "You"}
      />
    </div>
  );
}
