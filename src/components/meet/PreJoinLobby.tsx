import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, Settings, Volume2, ShieldCheck, 
  Sparkles, Wand2, ArrowRight, UserCheck, CheckCircle2, Copy, 
  User, Mail, Phone, Building, Loader2, BadgeCheck, KeyRound, 
  Briefcase, GraduationCap, Lock, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { BACKGROUND_PRESETS, COLOR_FILTERS } from './VideoEnhancerModal';
import { verifyGuestIdentityFn } from '@/lib/meetings.functions';

export type JoinMethod = 'employee' | 'intern' | 'access_code';

export interface PreJoinLobbyProps {
  title: string;
  roomId: string;
  userName: string;
  userAvatar?: string | null;
  defaultAccessCode?: string;
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
  const [joinMethod, setJoinMethod] = useState<JoinMethod>('access_code');

  // Form Fields - All Mandatory based on method
  const [fullName, setFullName] = useState(initialUserName || '');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [collegeOrg, setCollegeOrg] = useState('');
  const [accessCode, setAccessCode] = useState(defaultAccessCode || '');
  const [internId, setInternId] = useState('');
  const [employeePasscode, setEmployeePasscode] = useState('');

  // Auto-verification & Loading states
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [verifiedInternId, setVerifiedInternId] = useState<string | null>(null);
  const [verifiedUserType, setVerifiedUserType] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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
          fullName: fullName || "Attendee",
          phone: phone || undefined,
          organization: collegeOrg || undefined,
        }
      });

      if (res && res.isVerified) {
        setIsVerified(true);
        setVerifiedInternId(res.internId);
        setVerifiedUserType(res.userType);
        if (res.internId && !internId) {
          setInternId(res.internId);
        }
        if (res.fullName && (!fullName || fullName === 'Attendee')) {
          setFullName(res.fullName);
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

  // Strictly enforce that all required details are filled out
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = "Full name is mandatory.";
    }

    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      errors.email = "Valid official email address is mandatory.";
    }

    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) {
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

    if (joinMethod === 'employee') {
      if (!email.toLowerCase().includes('@vyntyraconsultancyservices.in') && !email.toLowerCase().includes('@vcs.in') && !isVerified) {
        errors.email = "Employee email must be registered under company domain.";
      }
      if (!employeePasscode.trim()) {
        errors.employeePasscode = "Employee security passcode is mandatory.";
      }
    }

    if (joinMethod === 'intern') {
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
      guestPhone: phone.trim(),
      guestOrg: collegeOrg.trim() || undefined,
      accessCode: accessCode.trim().toUpperCase() || undefined,
      internId: internId.trim() || verifiedInternId,
      isVerified,
      password: employeePasscode.trim() || undefined,
    });
  };

  const currentColorFilter = COLOR_FILTERS.find(f => f.id === selectedFilter)?.filterCss || 'none';

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

        {/* Right: 3 Methods to Join & Mandatory Fields Form */}
        <div className="w-full lg:w-[420px] flex flex-col justify-between h-full py-1">
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
            </div>

            {/* Mandatory Entry Form Card */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 mb-3.5 space-y-2.5 max-h-[360px] overflow-y-auto">
              
              <div className="flex items-center justify-between pb-1 border-b border-white/5">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  Mandatory Attendee Credentials
                </span>
                <span className="text-[10px] text-amber-400 font-medium">* All fields required</span>
              </div>

              {/* Method 1: 8-Digit Access Code Field */}
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
                    required
                  />
                  {validationErrors.accessCode && (
                    <span className="text-[10px] text-rose-400 block">{validationErrors.accessCode}</span>
                  )}
                </div>
              )}

              {/* Method 2: Intern ID Field */}
              {joinMethod === 'intern' && (
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
                    required
                  />
                  {validationErrors.internId && (
                    <span className="text-[10px] text-rose-400 block">{validationErrors.internId}</span>
                  )}
                </div>
              )}

              {/* Method 3: Employee Passcode Field */}
              {joinMethod === 'employee' && (
                <div className="space-y-1">
                  <label className="text-[11px] text-indigo-300 font-semibold flex items-center gap-1">
                    <Lock className="h-3 w-3 text-indigo-400" />
                    <span>Employee Security Passcode</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <Input
                    type="password"
                    value={employeePasscode}
                    onChange={(e) => setEmployeePasscode(e.target.value)}
                    placeholder="Enter employee authentication passcode"
                    className={`h-9 bg-black/60 text-xs rounded-xl ${
                      validationErrors.employeePasscode ? 'border-rose-500 text-rose-300' : 'border-white/10 text-white'
                    }`}
                    required
                  />
                  {validationErrors.employeePasscode && (
                    <span className="text-[10px] text-rose-400 block">{validationErrors.employeePasscode}</span>
                  )}
                </div>
              )}

              {/* Full Name (Mandatory for all 3 methods) */}
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
                  required
                />
                {validationErrors.fullName && (
                  <span className="text-[10px] text-rose-400 block">{validationErrors.fullName}</span>
                )}
              </div>

              {/* Official Email (Mandatory for all 3 methods) */}
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
                  required
                />
                {validationErrors.email && (
                  <span className="text-[10px] text-rose-400 block">{validationErrors.email}</span>
                )}
              </div>

              {/* Phone & College/Org (Mandatory) */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                    <Phone className="h-2.5 w-2.5" />
                    <span>Phone No.</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91..."
                    className={`h-8 bg-black/60 text-[11px] rounded-xl ${
                      validationErrors.phone ? 'border-rose-500 text-rose-300' : 'border-white/10 text-white'
                    }`}
                    required
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
                    required={joinMethod === 'access_code'}
                  />
                </div>
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
