import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, Settings, Volume2, ShieldCheck, 
  Sparkles, Wand2, ArrowRight, UserCheck, CheckCircle2, Copy, 
  User, Mail, Phone, Building, Loader2, BadgeCheck, KeyRound, 
  Briefcase, GraduationCap, Lock, AlertCircle, ExternalLink, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { BACKGROUND_PRESETS, COLOR_FILTERS } from './VideoEnhancerModal';
import { verifyGuestIdentityFn } from '@/lib/meetings.functions';

export type JoinMethod = 'employee' | 'intern' | 'access_code';

export interface PreJoinLobbyProps {
  title: string;
  roomId: string;
  userName: string;
  userAvatar?: string | null;
  defaultAccessCode?: string;
  initialUserType?: 'admin' | 'employee' | 'intern' | 'guest' | null;
  initialInternId?: string | null;
  initialEmail?: string | null;
  isInitiallyVerified?: boolean;
  onJoin: (options: { 
    isAudioMuted: boolean; 
    isVideoMuted: boolean;
    joinMethod: JoinMethod;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    guestOrg?: string;
    accessCode?: string;
    internId?: string | null;
    isVerified?: boolean;
    password?: string;
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
  defaultAccessCode = '',
  initialUserType = null,
  initialInternId = null,
  initialEmail = null,
  isInitiallyVerified = false,
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

  // 3 Methods to Join
  const [joinMethod, setJoinMethod] = useState<JoinMethod>(
    initialUserType === 'intern' 
      ? 'intern' 
      : (initialUserType === 'admin' || initialUserType === 'employee') 
        ? 'employee' 
        : 'access_code'
  );

  // Form Fields
  const [fullName, setFullName] = useState(initialUserName || '');
  const [email, setEmail] = useState(initialEmail || '');
  const [phone, setPhone] = useState('');
  const [collegeOrg, setCollegeOrg] = useState('');
  const [accessCode, setAccessCode] = useState(defaultAccessCode || '');
  const [internId, setInternId] = useState(initialInternId || '');
  const [employeePasscode, setEmployeePasscode] = useState('');

  // Auto-verification & Loading states
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [verifiedInternId, setVerifiedInternId] = useState<string | null>(initialInternId || null);
  const [verifiedUserType, setVerifiedUserType] = useState<string | null>(initialUserType || null);
  const [isVerified, setIsVerified] = useState<boolean>(isInitiallyVerified);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Auto-detect active corporate / intern Supabase session on mount (Same as previous!)
  useEffect(() => {
    let mounted = true;

    async function loadActiveSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted || !session?.user) return;

        const sUser = session.user;
        const sEmail = sUser.email || '';
        setEmail(sEmail);

        // Fetch user profile from database
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone, intern_id, role, department')
          .eq('id', sUser.id)
          .maybeSingle();

        if (!mounted) return;

        const resolvedName = profile?.full_name || sUser.user_metadata?.full_name || sEmail.split('@')[0];
        setFullName(resolvedName);
        if (profile?.phone) setPhone(profile.phone);

        if (profile?.intern_id) {
          // Authorized Intern!
          setInternId(profile.intern_id);
          setVerifiedInternId(profile.intern_id);
          setVerifiedUserType('intern');
          setIsVerified(true);
          setJoinMethod('intern');
        } else if (
          profile?.role === 'admin' || 
          profile?.role === 'super_admin' || 
          sEmail.endsWith('@vyntyraconsultancyservices.in') || 
          sEmail.endsWith('@vcs.in')
        ) {
          // Authorized Employee / Administrator!
          const roleType = (profile?.role === 'admin' || profile?.role === 'super_admin') ? 'admin' : 'employee';
          setVerifiedUserType(roleType);
          setIsVerified(true);
          setJoinMethod('employee');
        }
      } catch (err) {
        console.warn("Session check in lobby:", err);
      }
    }

    loadActiveSession();

    return () => {
      mounted = false;
    };
  }, []);

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
          fullName: fullName || "Attendee",
          phone: phone || undefined,
          organization: collegeOrg || undefined,
        }
      });

      if (res && res.isVerified) {
        setIsVerified(true);
        setVerifiedInternId(res.internId);
        setVerifiedUserType(res.userType);
        if (res.internId) {
          setInternId(res.internId);
          setJoinMethod('intern');
          toast.success(`Recognized Intern: ${res.fullName} (${res.internId})`);
        } else {
          setJoinMethod('employee');
          toast.success(`Recognized Team Member: ${res.fullName}`);
        }
        if (res.fullName && (!fullName || fullName === 'Attendee')) {
          setFullName(res.fullName);
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

  // Strictly enforce required details based on auth state
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = "Full name is mandatory.";
    }

    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      errors.email = "Valid official email address is mandatory.";
    }

    // Phone is mandatory for guests, recommended for verified
    if (!isVerified && (!phone.trim() || phone.replace(/\D/g, '').length < 8)) {
      errors.phone = "Valid contact phone number is mandatory.";
    }

    if (joinMethod === 'access_code') {
      const cleanCode = accessCode.trim().toUpperCase();
      if (!cleanCode || cleanCode.length < 6) {
        errors.accessCode = "8-Digit Vyntyra Access Code is mandatory.";
      }
      if (!collegeOrg.trim()) {
        errors.collegeOrg = "College or Organization is mandatory.";
      }
    }

    if (joinMethod === 'employee' && !isVerified) {
      if (!email.toLowerCase().includes('@vyntyraconsultancyservices.in') && !email.toLowerCase().includes('@vcs.in')) {
        errors.email = "Employee email must be registered under company domain.";
      }
      if (!employeePasscode.trim()) {
        errors.employeePasscode = "Employee security passcode is mandatory for unauthenticated entry.";
      }
    }

    if (joinMethod === 'intern' && !isVerified) {
      const targetInternId = internId.trim() || verifiedInternId;
      if (!targetInternId) {
        errors.internId = "Assigned Intern ID is mandatory.";
      }
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      toast.error(`Mandatory field missing: ${firstError}`);
      return false;
    }

    return true;
  };

  const handleJoinClick = () => {
    if (!validateForm()) return;

    onJoin({
      isAudioMuted,
      isVideoMuted,
      joinMethod,
      guestName: fullName.trim(),
      guestEmail: email.trim().toLowerCase(),
      guestPhone: phone.trim() || '+910000000000',
      guestOrg: collegeOrg.trim() || (isVerified ? "VCS Corporate Workspace" : undefined),
      accessCode: accessCode.trim().toUpperCase() || undefined,
      internId: internId.trim() || verifiedInternId || undefined,
      isVerified,
      password: employeePasscode.trim() || undefined,
    });
  };

  const currentColorFilter = COLOR_FILTERS.find(f => f.id === selectedFilter)?.filterCss || 'none';
  const returnUrl = typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname) : '';

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#090b0e] text-white flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans select-none">
      <div className="w-full max-w-5xl bg-[#11141c]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 sm:p-8 shadow-2xl flex flex-col lg:flex-row gap-6 lg:gap-8 items-center max-h-[96vh] overflow-y-auto">
        
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
                  {fullName ? fullName.slice(0, 2).toUpperCase() : 'ME'}
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
                <span>
                  {verifiedUserType === 'intern' 
                    ? `Verified Intern (${verifiedInternId || 'VCS'})` 
                    : verifiedUserType === 'admin' 
                      ? 'Administrator' 
                      : 'Verified Employee'}
                </span>
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

        {/* Right: 3 Methods to Join & Authorization Selector */}
        <div className="w-full lg:w-[430px] flex flex-col justify-between h-full py-1">
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

            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">
              {title || "Live Conference Session"}
            </h1>

            {/* 3 Methods to Join Switcher */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/60 border border-white/10 rounded-2xl mb-3.5">
              <button
                type="button"
                onClick={() => {
                  setJoinMethod('employee');
                  setValidationErrors({});
                }}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-semibold transition-all ${
                  joinMethod === 'employee'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Briefcase className="h-3.5 w-3.5 mb-1" />
                <span>Employee/Admin</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setJoinMethod('intern');
                  setValidationErrors({});
                }}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-semibold transition-all ${
                  joinMethod === 'intern'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <GraduationCap className="h-3.5 w-3.5 mb-1" />
                <span>Intern</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setJoinMethod('access_code');
                  setValidationErrors({});
                }}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-semibold transition-all ${
                  joinMethod === 'access_code'
                    ? 'bg-[#0b5cff] text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <KeyRound className="h-3.5 w-3.5 mb-1" />
                <span>Access Code</span>
              </button>
            </div>

            {/* Entry Form Card */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 mb-3.5 space-y-3 max-h-[380px] overflow-y-auto">
              
              {/* Method 1: Employee / Administrator */}
              {joinMethod === 'employee' && (
                <div className="space-y-3">
                  {isVerified && (verifiedUserType === 'employee' || verifiedUserType === 'admin') ? (
                    <div className="p-3 bg-indigo-500/15 border border-indigo-500/30 rounded-xl space-y-1">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-indigo-400" />
                        <span className="text-xs font-bold text-indigo-200">
                          {verifiedUserType === 'admin' ? 'Authorized Administrator' : 'Authorized Employee'}
                        </span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-medium ml-auto">
                          Verified Session
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-300">
                        Signed in as <strong className="text-white">{fullName}</strong> ({email})
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* One-Click Corporate Sign In Button */}
                      <Button
                        type="button"
                        onClick={() => {
                          window.location.href = `/auth/admin?redirect=${returnUrl}`;
                        }}
                        className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        <span>Sign In with Corporate Account</span>
                        <ExternalLink className="h-3 w-3 ml-auto opacity-70" />
                      </Button>

                      <div className="relative py-0.5 flex items-center justify-center">
                        <div className="border-t border-white/10 w-full" />
                        <span className="bg-[#11141c] px-2 text-[10px] text-gray-400 uppercase tracking-wider absolute">
                          Or Enter Employee Passcode
                        </span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-indigo-300 font-semibold flex items-center gap-1">
                          <Lock className="h-3 w-3 text-indigo-400" />
                          <span>Employee Passcode</span>
                          <span className="text-rose-400">*</span>
                        </label>
                        <Input
                          type="password"
                          value={employeePasscode}
                          onChange={(e) => setEmployeePasscode(e.target.value)}
                          placeholder="Enter meeting or employee passcode"
                          className={`h-9 bg-black/60 text-xs rounded-xl ${
                            validationErrors.employeePasscode ? 'border-rose-500 text-rose-300' : 'border-white/10 text-white'
                          }`}
                        />
                        {validationErrors.employeePasscode && (
                          <span className="text-[10px] text-rose-400 block">{validationErrors.employeePasscode}</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Method 2: Intern */}
              {joinMethod === 'intern' && (
                <div className="space-y-3">
                  {isVerified && verifiedUserType === 'intern' ? (
                    <div className="p-3 bg-purple-500/15 border border-purple-500/30 rounded-xl space-y-1">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-purple-400" />
                        <span className="text-xs font-bold text-purple-200">
                          Authorized VCS Intern
                        </span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-medium ml-auto">
                          Verified {verifiedInternId}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-300">
                        Signed in as <strong className="text-white">{fullName}</strong> ({email})
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* One-Click Intern Sign In Button */}
                      <Button
                        type="button"
                        onClick={() => {
                          window.location.href = `/auth/intern?redirect=${returnUrl}`;
                        }}
                        className="w-full h-10 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg"
                      >
                        <GraduationCap className="h-3.5 w-3.5" />
                        <span>Sign In with Intern Account</span>
                        <ExternalLink className="h-3 w-3 ml-auto opacity-70" />
                      </Button>

                      <div className="relative py-0.5 flex items-center justify-center">
                        <div className="border-t border-white/10 w-full" />
                        <span className="bg-[#11141c] px-2 text-[10px] text-gray-400 uppercase tracking-wider absolute">
                          Or Enter Intern ID
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] text-purple-300 font-semibold flex items-center gap-1">
                            <GraduationCap className="h-3 w-3 text-purple-400" />
                            <span>Assigned Intern ID</span>
                            <span className="text-rose-400">*</span>
                          </label>
                          <span className="text-[10px] font-mono text-purple-400">VCS-INT-XXXX</span>
                        </div>
                        <Input
                          value={internId}
                          onChange={(e) => setInternId(e.target.value.toUpperCase())}
                          placeholder="e.g. VCS-INT-1042"
                          className={`h-9 bg-black/60 font-mono text-xs rounded-xl ${
                            validationErrors.internId ? 'border-rose-500 text-rose-300' : 'border-white/10 text-white'
                          }`}
                        />
                        {validationErrors.internId && (
                          <span className="text-[10px] text-rose-400 block">{validationErrors.internId}</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Method 3: 8-Digit Access Code */}
              {joinMethod === 'access_code' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-gray-300 font-semibold flex items-center gap-1">
                      <KeyRound className="h-3 w-3 text-blue-400" />
                      <span>8-Digit Vyntyra Access Code</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[10px] font-mono text-blue-400">e.g. VYN89201</span>
                  </div>
                  <Input
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase().slice(0, 10))}
                    placeholder="Enter 8-digit access code"
                    className={`h-9 bg-black/60 font-mono tracking-widest uppercase text-xs rounded-xl ${
                      validationErrors.accessCode ? 'border-rose-500 text-rose-300' : 'border-white/10 text-white'
                    }`}
                  />
                  {validationErrors.accessCode && (
                    <span className="text-[10px] text-rose-400 block">{validationErrors.accessCode}</span>
                  )}
                </div>
              )}

              {/* Common Details (Full Name, Email, Phone, College) */}
              <div className="space-y-2 pt-1 border-t border-white/5">
                
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-300 font-medium flex items-center gap-1">
                    <User className="h-3 w-3 text-blue-400" />
                    <span>Full Name</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className={`h-9 bg-black/60 text-xs rounded-xl ${
                      validationErrors.fullName ? 'border-rose-500 text-rose-300' : 'border-white/10 text-white'
                    }`}
                  />
                  {validationErrors.fullName && (
                    <span className="text-[10px] text-rose-400 block">{validationErrors.fullName}</span>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-gray-300 font-medium flex items-center gap-1">
                      <Mail className="h-3 w-3 text-blue-400" />
                      <span>{joinMethod === 'employee' ? 'Work Email' : 'Official Email'}</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    {isCheckingEmail && (
                      <span className="text-[10px] text-blue-400 flex items-center gap-1">
                        <Loader2 className="h-2.5 w-2.5 animate-spin" /> Verifying...
                      </span>
                    )}
                  </div>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={(e) => handleCheckEmail(e.target.value)}
                    placeholder={
                      joinMethod === 'employee'
                        ? "name@vyntyraconsultancyservices.in"
                        : "name@email.com (Auto-detects Intern ID)"
                    }
                    className={`h-9 bg-black/60 text-xs rounded-xl ${
                      validationErrors.email ? 'border-rose-500 text-rose-300' : 'border-white/10 text-white'
                    }`}
                  />
                  {validationErrors.email && (
                    <span className="text-[10px] text-rose-400 block">{validationErrors.email}</span>
                  )}
                </div>

                {/* Phone & College/Org */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                      <Phone className="h-2.5 w-2.5" />
                      <span>Phone No.</span>
                      {!isVerified && <span className="text-rose-400">*</span>}
                    </label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91..."
                      className={`h-8 bg-black/60 text-[11px] rounded-xl ${
                        validationErrors.phone ? 'border-rose-500 text-rose-300' : 'border-white/10 text-white'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                      <Building className="h-2.5 w-2.5" />
                      <span>College/Org</span>
                      {joinMethod === 'access_code' && <span className="text-rose-400">*</span>}
                    </label>
                    <Input
                      value={collegeOrg}
                      onChange={(e) => setCollegeOrg(e.target.value)}
                      placeholder="University/Co."
                      className={`h-8 bg-black/60 text-[11px] rounded-xl ${
                        validationErrors.collegeOrg ? 'border-rose-500 text-rose-300' : 'border-white/10 text-white'
                      }`}
                    />
                  </div>
                </div>

              </div>

            </div>

            {/* Room Code Pill */}
            <div className="flex items-center justify-between text-xs text-gray-400 mb-3 px-1">
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

          <div className="space-y-2.5">
            <Button
              onClick={handleJoinClick}
              className="w-full h-12 text-sm sm:text-base font-semibold bg-[#0b5cff] hover:bg-[#094bdd] text-white rounded-2xl shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>Join Meeting Now</span>
              <ArrowRight className="h-4.5 w-4.5" />
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Meeting link copied to clipboard");
              }}
              className="w-full h-9 border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 text-xs rounded-xl"
            >
              <Copy className="h-3.5 w-3.5 mr-1.5 text-blue-400" /> Copy Meeting Invite Link
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
