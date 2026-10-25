import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, Settings, Volume2, ShieldCheck, 
  Sparkles, Wand2, ArrowRight, UserCheck, CheckCircle2, Copy, 
  User, Mail, Phone, Building, Loader2, BadgeCheck 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { BACKGROUND_PRESETS, COLOR_FILTERS } from './VideoEnhancerModal';
import { verifyGuestIdentityFn } from '@/lib/meetings.functions';

export interface PreJoinLobbyProps {
  title: string;
  roomId: string;
  userName: string;
  userAvatar?: string | null;
  onJoin: (options: { 
    isAudioMuted: boolean; 
    isVideoMuted: boolean;
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    guestOrg?: string;
    internId?: string | null;
    isVerified?: boolean;
  }) => void;
  selectedFilter: string;
  selectedBackground: string;
  onSelectFilter: (f: string) => void;
  onSelectBackground: (b: string) => void;
}

export function PreJoinLobby({
  title,
  roomId,
  userName: initialUserName,
  userAvatar,
  onJoin,
  selectedFilter,
  selectedBackground,
  onSelectFilter,
  onSelectBackground,
}: PreJoinLobbyProps) {
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Guest Gatekeeper Form States
  const [guestName, setGuestName] = useState(initialUserName || '');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestOrg, setGuestOrg] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [verifiedInternId, setVerifiedInternId] = useState<string | null>(null);
  const [verifiedUserType, setVerifiedUserType] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize local device preview for Green Room
  useEffect(() => {
    let active = true;

    async function startPreview() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        setHasPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Simple audio visualizer meter
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const analyser = audioContext.createAnalyser();
          const microphone = audioContext.createMediaStreamSource(stream);
          microphone.connect(analyser);
          analyser.fftSize = 256;
          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const checkVolume = () => {
            if (!active) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            setAudioVolume(Math.min(100, Math.round((average / 128) * 100)));
            requestAnimationFrame(checkVolume);
          };
          checkVolume();
        } catch (_) {}
      } catch (err: any) {
        console.warn("Could not access camera/mic for pre-join lobby:", err);
        if (active) setHasPermission(false);
      }
    }

    startPreview();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Check email for Intern / Employee recognition
  const handleCheckEmail = async (emailToCheck: string) => {
    const clean = emailToCheck.trim().toLowerCase();
    if (!clean || !clean.includes('@') || !clean.includes('.')) return;

    setIsCheckingEmail(true);
    try {
      const res = await verifyGuestIdentityFn({
        data: {
          roomId,
          email: clean,
          fullName: guestName || "Guest",
          phone: guestPhone || undefined,
          organization: guestOrg || undefined,
        }
      });

      if (res && res.isVerified) {
        setIsVerified(true);
        setVerifiedInternId(res.internId);
        setVerifiedUserType(res.userType);
        if (res.fullName && (!guestName || guestName === 'Guest')) {
          setGuestName(res.fullName);
        }
        if (res.internId) {
          toast.success(`Recognized as Intern: ${res.fullName} (${res.internId})`);
        } else {
          toast.success(`Recognized as verified Vyntyra team member!`);
        }
      } else {
        setIsVerified(false);
        setVerifiedInternId(null);
        setVerifiedUserType('guest');
      }
    } catch (e) {
      console.warn("Email verification error:", e);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => {
        t.enabled = isAudioMuted;
      });
    }
    setIsAudioMuted(!isAudioMuted);
  };

  const toggleCam = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => {
        t.enabled = isVideoMuted;
      });
    }
    setIsVideoMuted(!isVideoMuted);
  };

  const handleJoinClick = () => {
    const finalName = guestName.trim() || initialUserName || "Guest";
    onJoin({
      isAudioMuted,
      isVideoMuted,
      guestName: finalName,
      guestEmail: guestEmail.trim() || undefined,
      guestPhone: guestPhone.trim() || undefined,
      guestOrg: guestOrg.trim() || undefined,
      internId: verifiedInternId,
      isVerified,
    });
  };

  const currentColorFilter = COLOR_FILTERS.find(f => f.id === selectedFilter)?.filterCss || 'none';

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#090b0e] text-white flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-5xl bg-[#11141c]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col lg:flex-row gap-8 items-center">
        
        {/* Left: Video Preview & Hardware Controls */}
        <div className="flex-1 w-full flex flex-col items-center">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/80 border border-white/10 shadow-2xl flex items-center justify-center">
            
            {/* Camera Video Stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ filter: currentColorFilter }}
              className={`w-full h-full object-cover transform -scale-x-100 transition-all duration-300 ${
                isVideoMuted ? 'hidden' : 'block'
              }`}
            />

            {/* Camera Off Placeholder */}
            {isVideoMuted && (
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="h-20 w-20 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center font-bold text-2xl text-blue-400">
                  {guestName ? guestName.slice(0, 2).toUpperCase() : 'ME'}
                </div>
                <span className="text-xs font-medium text-gray-400">Camera is turned off</span>
              </div>
            )}

            {/* Bottom Controls Floating Dock */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-black/70 backdrop-blur-xl border border-white/15 px-4 py-2 rounded-full shadow-2xl z-20">
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleMic}
                className={`h-10 w-10 p-0 rounded-full transition-all ${
                  isAudioMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title={isAudioMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {isAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5 text-emerald-400" />}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={toggleCam}
                className={`h-10 w-10 p-0 rounded-full transition-all ${
                  isVideoMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title={isVideoMuted ? "Turn On Camera" : "Turn Off Camera"}
              >
                {isVideoMuted ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5 text-blue-400" />}
              </Button>
            </div>

            {/* Audio Meter Visualizer Pill */}
            {!isAudioMuted && (
              <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[11px] text-gray-300">
                <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-400 transition-all duration-75 rounded-full" 
                    style={{ width: `${audioVolume}%` }}
                  />
                </div>
              </div>
            )}

            {/* Verified Intern / Employee Live Pill Overlay */}
            {isVerified && (
              <div className="absolute top-4 right-4 bg-emerald-600/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-semibold text-white flex items-center gap-1.5 border border-emerald-400/40 shadow-lg">
                <BadgeCheck className="h-3.5 w-3.5 text-emerald-300" />
                <span>{verifiedUserType === 'intern' ? `Verified Intern (${verifiedInternId})` : 'Verified Team Member'}</span>
              </div>
            )}
          </div>

          {/* Quick Filter Selection Chips */}
          <div className="w-full mt-3 flex items-center justify-between text-xs text-gray-400 px-1">
            <span className="flex items-center gap-1 text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Hardware Verified & Encrypted
            </span>
            <div className="flex items-center gap-1">
              {COLOR_FILTERS.slice(0, 3).map((f) => (
                <button
                  key={f.id}
                  onClick={() => onSelectFilter(f.id)}
                  className={`px-2 py-0.5 rounded-full text-[10px] transition-colors ${
                    selectedFilter === f.id ? 'bg-[#0b5cff] text-white' : 'bg-white/5 hover:bg-white/10 text-gray-400'
                  }`}
                >
                  {f.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Guest Gatekeeper, Intern Recognition & Join Action */}
        <div className="w-full lg:w-96 flex flex-col justify-between h-full py-2">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <img src="/icon-512.png" alt="Vyntyra Logo" className="h-6 w-6 object-contain rounded-md" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#0b5cff] px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                Vyntyra Meet
              </span>
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="h-3 w-3" /> Ready to Join
              </span>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2 leading-tight">
              {title || "Live Conference Session"}
            </h1>

            {/* Guest Entry & Intern Auto-Recognition Form */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 mb-5 space-y-3">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                Attendee Identification & Credentials
              </span>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[11px] text-gray-300 font-medium flex items-center gap-1">
                  <User className="h-3 w-3 text-blue-400" /> Full Name
                </label>
                <Input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="h-9 bg-black/60 border-white/10 text-white text-xs rounded-xl"
                  required
                />
              </div>

              {/* Official Email with Auto-Detection */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-gray-300 font-medium flex items-center gap-1">
                    <Mail className="h-3 w-3 text-blue-400" /> Official Email
                  </label>
                  {isCheckingEmail && (
                    <span className="text-[10px] text-blue-400 flex items-center gap-1">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" /> Verifying...
                    </span>
                  )}
                </div>
                <Input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  onBlur={(e) => handleCheckEmail(e.target.value)}
                  placeholder="name@email.com (Auto-detects Intern ID)"
                  className="h-9 bg-black/60 border-white/10 text-white text-xs rounded-xl"
                />
              </div>

              {/* Verified Intern Banner */}
              {isVerified && (
                <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs text-emerald-300 animate-in fade-in duration-200">
                  <BadgeCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold block">
                      {verifiedUserType === 'intern' ? 'Verified Intern Account' : 'Verified Company Member'}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-200">
                      {verifiedInternId ? `Assigned ID: ${verifiedInternId}` : 'VCS Official Workspace'}
                    </span>
                  </div>
                </div>
              )}

              {/* Phone & College/Organization */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                    <Phone className="h-2.5 w-2.5" /> Phone No.
                  </label>
                  <Input
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+91..."
                    className="h-8 bg-black/60 border-white/10 text-white text-[11px] rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                    <Building className="h-2.5 w-2.5" /> College/Org
                  </label>
                  <Input
                    value={guestOrg}
                    onChange={(e) => setGuestOrg(e.target.value)}
                    placeholder="University/Co."
                    className="h-8 bg-black/60 border-white/10 text-white text-[11px] rounded-xl"
                  />
                </div>
              </div>

            </div>

            {/* Room Code Pill */}
            <div className="flex items-center justify-between text-xs text-gray-400 mb-5 px-1">
              <span>Room Code:</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-blue-400 font-bold">{roomId}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Meeting link copied!");
                  }}
                  className="p-1 hover:text-white"
                  title="Copy link"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleJoinClick}
              className="w-full h-13 text-base font-semibold bg-[#0b5cff] hover:bg-[#094bdd] text-white rounded-2xl shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>Join Meeting Now</span>
              <ArrowRight className="h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Meeting link copied to clipboard");
              }}
              className="w-full h-10 border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 text-xs rounded-xl"
            >
              <Copy className="h-3.5 w-3.5 mr-1.5 text-blue-400" /> Copy Meeting Invite Link
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
