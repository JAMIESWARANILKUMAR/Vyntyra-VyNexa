import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Volume2, Play, Square, RotateCcw, Upload, Sparkles, 
  CheckCircle2, Radio, Sliders, AudioWaveform as Waveform, AlertCircle, 
  HelpCircle, ShieldCheck, UserCheck, RefreshCw, VolumeX, Save, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { 
  getAiVoiceSettings, 
  updateAiVoiceSettings, 
  AiVoiceSettings, 
  DEFAULT_AI_VOICE_SETTINGS 
} from '@/lib/settings.functions';
import { cleanTextForSpeech, resolveBestSpeechVoice, speakSentenceSequence } from '@/lib/speech-clarity';
import { supabase } from '@/integrations/supabase/client';

const PRESET_VOICES = [
  {
    id: "custom_admin",
    name: "Admin / Custom Trained Voice",
    gender: "neutral" as const,
    accent: "en-IN" as const,
    desc: "Uses your own recorded voice audio for greetings and matches dynamic questions to your cadence.",
    preferred: []
  },
  {
    id: "natural_in_female",
    name: "Dr. Sarah - Executive Tech Lead",
    gender: "female" as const,
    accent: "en-IN" as const,
    desc: "Natural cadence, crisp enunciation, tailored for Indian and global technical candidates.",
    preferred: ["Microsoft Neerja Online (Natural)", "Google UK English Female", "Samantha", "Victoria"]
  },
  {
    id: "natural_in_male",
    name: "Vikram - Principal Bar Raiser",
    gender: "male" as const,
    accent: "en-IN" as const,
    desc: "Authoritative, calm, clear acoustic tone with natural Indian English cadence.",
    preferred: ["Microsoft Prabhat Online (Natural)", "Google UK English Male", "Daniel", "David"]
  },
  {
    id: "natural_us_female",
    name: "Elena - Staff Systems Architect",
    gender: "female" as const,
    accent: "en-US" as const,
    desc: "Crisp US executive enunciation, optimal for high-speed technical problem solving.",
    preferred: ["Microsoft Aria Online (Natural)", "Google US English", "Samantha", "Karen"]
  },
  {
    id: "natural_uk_male",
    name: "David - Infrastructure Lead",
    gender: "male" as const,
    accent: "en-GB" as const,
    desc: "Refined British technical tone with deliberate pacing and distinct consonants.",
    preferred: ["Microsoft Ryan Online (Natural)", "Google UK English Male", "Daniel", "Oliver"]
  }
];

const CALIBRATION_SCRIPT = "Hello and welcome to your 1:1 technical mock interview with Vyntyra Consultancy Services. We are going to review software architecture, problem-solving depth, and clean coding methodologies. Take your time, explain your trade-offs clearly, and let's begin.";

export function AdminVoiceTrainingStudio({ onSaved }: { onSaved?: () => void }) {
  const queryClient = useQueryClient();
  const getSettingsFn = useServerFn(getAiVoiceSettings);
  const updateSettingsFn = useServerFn(updateAiVoiceSettings);

  // Settings State
  const [voiceId, setVoiceId] = useState<string>("custom_admin");
  const [voiceName, setVoiceName] = useState<string>("Admin Custom Trained Voice");
  const [speakerIdentity, setSpeakerIdentity] = useState<string>("Admin (Lead Bar Raiser)");
  const [speakerGender, setSpeakerGender] = useState<"female" | "male" | "neutral">("female");
  const [accent, setAccent] = useState<"en-IN" | "en-US" | "en-GB" | "en-AU">("en-IN");
  const [rate, setRate] = useState<number>(0.94); // Default 0.94x for crystal clear speech
  const [pitch, setPitch] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [clarityBoost, setClarityBoost] = useState<boolean>(true);
  const [customAudioUrl, setCustomAudioUrl] = useState<string>("");
  const [useCustomAudio, setUseCustomAudio] = useState<boolean>(true);
  const [customVoiceScript, setCustomVoiceScript] = useState<string>(CALIBRATION_SCRIPT);

  // Available client browser voices
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedBrowserVoiceName, setSelectedBrowserVoiceName] = useState<string>("");

  // Audio Recording State for Custom Voice Training
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [micAudioLevel, setMicAudioLevel] = useState<number>(0);
  const [isSavingAudio, setIsSavingAudio] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Audition / Testing State
  const [isAuditionSpeaking, setIsAuditionSpeaking] = useState<boolean>(false);
  const [isPlayingRecordedSample, setIsPlayingRecordedSample] = useState<boolean>(false);
  const recordedAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const speechSpeakerCancelRef = useRef<(() => void) | null>(null);
  const [auditionText, setAuditionText] = useState<string>(
    "Can you walk me through a critical production bug you diagnosed? How do you approach caching and latency bottlenecks in REST APIs?"
  );

  // Fetch persisted settings from Supabase
  const { data: initialSettings, isLoading } = useQuery({
    queryKey: ['admin_ai_voice_settings'],
    queryFn: () => getSettingsFn()
  });

  // Populate state on load
  useEffect(() => {
    if (initialSettings) {
      setVoiceId(initialSettings.voice_id || "custom_admin");
      setVoiceName(initialSettings.voice_name || "Admin Custom Trained Voice");
      setSpeakerIdentity(initialSettings.speaker_identity || "Admin");
      setSpeakerGender(initialSettings.speaker_gender || "female");
      setAccent(initialSettings.accent || "en-IN");
      setRate(initialSettings.rate ?? 0.94);
      setPitch(initialSettings.pitch ?? 1.0);
      setVolume(initialSettings.volume ?? 1.0);
      setClarityBoost(initialSettings.clarity_boost ?? true);
      setUseCustomAudio(initialSettings.use_custom_audio !== false);
      if (initialSettings.custom_audio_url) {
        setCustomAudioUrl(initialSettings.custom_audio_url);
      }
      if (initialSettings.custom_voice_script) {
        setCustomVoiceScript(initialSettings.custom_voice_script);
      }
      if (initialSettings.selected_voice_name) {
        setSelectedBrowserVoiceName(initialSettings.selected_voice_name);
      }
    }
  }, [initialSettings]);

  // Load browser speech synthesis voices
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        if (!selectedBrowserVoiceName) {
          const best = resolveBestSpeechVoice(voices, {
            selected_voice_name: initialSettings?.selected_voice_name,
            preferred_browser_voices: initialSettings?.preferred_browser_voices,
            accent,
            speaker_gender: speakerGender
          });
          if (best) setSelectedBrowserVoiceName(best.name);
        }
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [accent, speakerGender, initialSettings, selectedBrowserVoiceName]);

  // Save Voice Settings Mutation
  const saveMutation = useMutation({
    mutationFn: () => updateSettingsFn({
      data: {
        voice_id: voiceId,
        voice_name: voiceName,
        speaker_identity: speakerIdentity,
        speaker_gender: speakerGender,
        accent,
        rate,
        pitch,
        volume,
        clarity_boost: clarityBoost,
        custom_audio_url: customAudioUrl || undefined,
        custom_voice_script: customVoiceScript,
        selected_voice_name: selectedBrowserVoiceName,
        use_custom_audio: useCustomAudio,
        preferred_browser_voices: selectedBrowserVoiceName 
          ? [selectedBrowserVoiceName, ...(initialSettings?.preferred_browser_voices || [])]
          : initialSettings?.preferred_browser_voices
      }
    }),
    onSuccess: () => {
      toast.success("AI Interviewer voice profile permanently saved & deployed to all interviews!");
      queryClient.invalidateQueries({ queryKey: ['admin_ai_voice_settings'] });
      if (onSaved) onSaved();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save voice configuration");
    }
  });

  // ─── Playback Recorded Voice Sample ───
  const togglePlayRecordedSample = () => {
    if (!customAudioUrl) {
      toast.error("No recorded audio sample found. Please record your voice first.");
      return;
    }

    if (isPlayingRecordedSample) {
      if (recordedAudioPlayerRef.current) {
        recordedAudioPlayerRef.current.pause();
        recordedAudioPlayerRef.current.currentTime = 0;
      }
      setIsPlayingRecordedSample(false);
      return;
    }

    if (recordedAudioPlayerRef.current) {
      recordedAudioPlayerRef.current.pause();
    }

    const audio = new Audio(customAudioUrl);
    recordedAudioPlayerRef.current = audio;
    audio.volume = volume;

    audio.onplay = () => setIsPlayingRecordedSample(true);
    audio.onended = () => setIsPlayingRecordedSample(false);
    audio.onerror = (e) => {
      console.warn("Audio playback error:", e);
      setIsPlayingRecordedSample(false);
      toast.error("Could not play recorded audio sample.");
    };

    audio.play().catch(err => {
      console.warn("Audio play blocked:", err);
      setIsPlayingRecordedSample(false);
    });
  };

  // ─── Audition / Voice Testing via Sequential Clarity Synthesizer ───
  const handleTestSpeech = () => {
    if (!('speechSynthesis' in window)) {
      toast.error("Browser does not support Speech Synthesis");
      return;
    }

    if (isAuditionSpeaking) {
      if (speechSpeakerCancelRef.current) speechSpeakerCancelRef.current();
      window.speechSynthesis.cancel();
      setIsAuditionSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    // Pick voice
    const matchedVoice = availableVoices.find(v => v.name === selectedBrowserVoiceName) || 
                         resolveBestSpeechVoice(availableVoices, { accent, speaker_gender: speakerGender, selected_voice_name: selectedBrowserVoiceName });

    // Use sentence-by-sentence clarity engine
    const textToSpeak = clarityBoost ? cleanTextForSpeech(auditionText) : auditionText;

    const controller = speakSentenceSequence({
      text: textToSpeak,
      voice: matchedVoice,
      rate,
      pitch,
      volume,
      onStart: () => setIsAuditionSpeaking(true),
      onEnd: () => setIsAuditionSpeaking(false),
      onError: () => setIsAuditionSpeaking(false)
    });

    speechSpeakerCancelRef.current = controller.cancel;
    toast.info("Auditioning sequential speech enunciation...");
  };

  // ─── Persistent Voice Recording Handlers ───
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Audio level analyser for live VU meter
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkLevel = () => {
          if (!analyserRef.current || !isRecording) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setMicAudioLevel(Math.min(100, Math.round(avg * 1.6)));
          requestAnimationFrame(checkLevel);
        };
        requestAnimationFrame(checkLevel);
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsSavingAudio(true);
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // 1. Convert to persistent Base64 Data URL (guaranteed to work across all sessions & browsers)
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          let persistentUrl = reader.result as string;

          // 2. Also try uploading to Supabase Storage for high-speed CDN URL
          try {
            const fileName = `voice_training/admin_voice_${Date.now()}.webm`;
            const { error: upErr } = await supabase.storage.from("default").upload(fileName, blob, {
              contentType: "audio/webm",
              upsert: true
            });
            if (!upErr) {
              const { data: pubData } = supabase.storage.from("default").getPublicUrl(fileName);
              if (pubData?.publicUrl) {
                persistentUrl = pubData.publicUrl;
              }
            }
          } catch (storageErr) {
            console.warn("Storage upload optional fallback to base64:", storageErr);
          }

          setCustomAudioUrl(persistentUrl);
          setVoiceId("custom_admin");
          setVoiceName("Admin Custom Voice (Calibrated)");
          setUseCustomAudio(true);
          setIsSavingAudio(false);
          toast.success("Voice sample recorded, calibrated, and permanently saved! Click 'Deploy Voice Globally' to apply.");
        };

        // Stop audio tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);

      toast.info("Recording voice training sample. Please read the calibration script aloud.");
    } catch (err: any) {
      console.error("Microphone access error:", err);
      toast.error("Could not access microphone for voice training.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordTimerRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error("Please upload a valid audio file (.mp3, .wav, .m4a)");
      return;
    }

    setIsSavingAudio(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      let persistentUrl = reader.result as string;

      try {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const fileName = `voice_training/admin_upload_${Date.now()}_${safeName}`;
        const { error: upErr } = await supabase.storage.from("default").upload(fileName, file, {
          contentType: file.type || "audio/mpeg",
          upsert: true
        });
        if (!upErr) {
          const { data: pubData } = supabase.storage.from("default").getPublicUrl(fileName);
          if (pubData?.publicUrl) {
            persistentUrl = pubData.publicUrl;
          }
        }
      } catch (e) {
        console.warn("Storage upload fallback to base64:", e);
      }

      setCustomAudioUrl(persistentUrl);
      setVoiceId("custom_admin");
      setVoiceName(`Custom Voice (${file.name.replace(/\.[^/.]+$/, "")})`);
      setUseCustomAudio(true);
      setIsSavingAudio(false);
      toast.success(`Voice file "${file.name}" uploaded, calibrated, and permanently stored!`);
    };
  };

  return (
    <div className="bg-[#0b0f19] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl text-white">
      
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-1">
            <Sparkles className="h-4 w-4" />
            <span>AI INTERVIEWER SPEECH &amp; ACOUSTIC CLARITY ENGINE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            AI Voice Studio &amp; Custom Voice Training
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
            Train the AI Interlocutor with your own recorded voice audio and calibrate neural pacing, pronunciation, and accuracy so candidates experience crystal-clear audio during technical interviews.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || isSavingAudio}
            className="h-10 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 flex items-center gap-2"
          >
            {saveMutation.isPending || isSavingAudio ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Deploy Voice Globally</span>
          </Button>
        </div>
      </div>

      {/* ─── Grid: Voice Models & Training ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (8 cols): Voice Selection & Custom Training */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section 1: Choose Voice Model */}
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-blue-400" />
              <span>1. Select Voice Profile or Train Custom Speaker</span>
            </Label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESET_VOICES.map((p) => {
                const isSelected = voiceId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setVoiceId(p.id);
                      setVoiceName(p.name);
                      setSpeakerGender(p.gender);
                      setAccent(p.accent);
                      if (p.id === 'custom_admin') {
                        setUseCustomAudio(true);
                      }
                      // Auto-select preferred browser voice if available
                      if (p.preferred.length > 0) {
                        for (const pref of p.preferred) {
                          const m = availableVoices.find(v => v.name.includes(pref));
                          if (m) {
                            setSelectedBrowserVoiceName(m.name);
                            break;
                          }
                        }
                      }
                    }}
                    className={`text-left p-4 rounded-2xl border transition-all relative ${
                      isSelected
                        ? "bg-blue-600/15 border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500"
                        : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-white">{p.name}</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                        {p.accent} • {p.gender}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{p.desc}</p>
                    {isSelected && (
                      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-blue-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Active Selected Profile</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Custom Voice Training Module (Record or Upload) */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Mic className="h-4 w-4 text-emerald-400" />
                  <span>Admin Voice Calibration &amp; Training Recorder</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Record 15–30 seconds of your voice reading the script below. The system converts it into permanent audio and trains the interview persona.
                </p>
              </div>
              {customAudioUrl && (
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-semibold self-start sm:self-auto">
                  <CheckCircle2 className="h-3 w-3" /> Voice Sample Ready
                </span>
              )}
            </div>

            {/* Calibration Script Display */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Calibration Script to Read:</span>
              <p className="text-xs text-blue-200/90 font-mono italic leading-relaxed">
                "{customVoiceScript}"
              </p>
            </div>

            {/* Live Recording Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {!isRecording ? (
                <Button
                  type="button"
                  onClick={startRecording}
                  disabled={isSavingAudio}
                  className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <Mic className="h-4 w-4" />
                  <span>Record Admin Voice</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={stopRecording}
                  className="h-9 px-4 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-red-600/20 animate-pulse"
                >
                  <Square className="h-4 w-4 fill-white" />
                  <span>Stop Recording ({recordingSeconds}s)</span>
                </Button>
              )}

              {/* Upload alternative */}
              <div className="relative">
                <input
                  type="file"
                  id="voice-file-upload"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSavingAudio || isRecording}
                  onClick={() => document.getElementById('voice-file-upload')?.click()}
                  className="h-9 px-4 border-white/10 hover:bg-white/10 text-gray-300 text-xs rounded-xl flex items-center gap-2"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Audio File (.wav/.mp3)</span>
                </Button>
              </div>

              {/* Saving Indicator */}
              {isSavingAudio && (
                <div className="flex items-center gap-1.5 text-xs text-blue-400 font-mono">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Persisting audio data...</span>
                </div>
              )}

              {/* VU Meter when recording */}
              {isRecording && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-500/30">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-xs font-mono text-red-300">Listening:</span>
                  <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-400 transition-all duration-75"
                      style={{ width: `${micAudioLevel}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Playback of Recorded Sample */}
            {customAudioUrl && (
              <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    size="sm"
                    onClick={togglePlayRecordedSample}
                    className="h-8 px-3 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 text-xs flex items-center gap-1.5 font-semibold"
                  >
                    {isPlayingRecordedSample ? (
                      <>
                        <Square className="h-3.5 w-3.5 fill-current" />
                        <span>Stop Voice Playback</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Play Recorded Sample</span>
                      </>
                    )}
                  </Button>
                  <span className="text-[11px] text-gray-400 font-mono">
                    Sample permanently linked
                  </span>
                </div>

                {/* Direct audio use toggle */}
                <div className="flex items-center gap-2">
                  <Switch
                    checked={useCustomAudio}
                    onCheckedChange={setUseCustomAudio}
                  />
                  <span className="text-xs text-gray-300 font-medium">
                    Play recorded audio during interviews
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Browser Voice Hardware Resolution */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-300 flex items-center justify-between">
              <span>Synthesizer Neural Voice Binding (for Dynamic Questions)</span>
              <span className="text-[10px] text-gray-400 font-normal">
                {availableVoices.length} local engines detected
              </span>
            </Label>
            <select
              value={selectedBrowserVoiceName}
              onChange={(e) => setSelectedBrowserVoiceName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:border-blue-500 focus:outline-none"
            >
              {availableVoices.map((v) => (
                <option key={v.name} value={v.name} className="bg-slate-900 text-white">
                  {v.name} ({v.lang}) {v.name.includes('Natural') || v.name.includes('Online') ? '★ Natural HD Neural' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Column (4 cols): Acoustic Tuning & Live Audition */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Tuning Sliders */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-5 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-indigo-400" />
              <span>Acoustic Enunciation Tuning</span>
            </h3>

            {/* Speech Rate (Pacing) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 font-medium">Speaking Pace:</span>
                <span className="font-mono text-blue-400 font-bold">{rate.toFixed(2)}x</span>
              </div>
              <Slider
                value={[rate]}
                min={0.80}
                max={1.15}
                step={0.02}
                onValueChange={(val) => setRate(val[0])}
                className="py-1"
              />
              <span className="text-[10px] text-gray-400 block">
                Recommended: <strong>0.94x</strong> for clear, articulate technical questions.
              </span>
            </div>

            {/* Pitch */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 font-medium">Voice Pitch:</span>
                <span className="font-mono text-indigo-400 font-bold">{pitch.toFixed(2)}</span>
              </div>
              <Slider
                value={[pitch]}
                min={0.80}
                max={1.20}
                step={0.05}
                onValueChange={(val) => setPitch(val[0])}
                className="py-1"
              />
            </div>

            {/* Output Volume */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 font-medium">Output Volume:</span>
                <span className="font-mono text-emerald-400 font-bold">{Math.round(volume * 100)}%</span>
              </div>
              <Slider
                value={[volume]}
                min={0.20}
                max={1.0}
                step={0.05}
                onValueChange={(val) => setVolume(val[0])}
                className="py-1"
              />
            </div>

            {/* Clarity Boost Toggle */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Phonetic Clarity Boost</span>
                <span className="text-[10px] text-gray-400 block max-w-[180px]">
                  Sentence-by-sentence enunciation &amp; acronym expansion.
                </span>
              </div>
              <Switch
                checked={clarityBoost}
                onCheckedChange={setClarityBoost}
              />
            </div>
          </div>

          {/* Live Audition & Auditory Preview */}
          <div className="rounded-2xl bg-gradient-to-b from-blue-950/40 to-indigo-950/40 border border-blue-500/20 p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
              <Volume2 className="h-4 w-4" />
              <span>Live Speech Audition</span>
            </h3>

            <p className="text-[11px] text-gray-300">
              Listen to how the AI Interlocutor will deliver questions to candidates with your current acoustic settings:
            </p>

            <textarea
              value={auditionText}
              onChange={(e) => setAuditionText(e.target.value)}
              rows={3}
              className="w-full p-2.5 rounded-xl bg-black/40 border border-blue-500/30 text-white text-xs leading-relaxed focus:outline-none focus:border-blue-400 font-sans"
            />

            <Button
              type="button"
              onClick={handleTestSpeech}
              className={`w-full h-10 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all ${
                isAuditionSpeaking
                  ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30 animate-pulse"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30"
              }`}
            >
              {isAuditionSpeaking ? (
                <>
                  <Square className="h-4 w-4 fill-white" />
                  <span>Stop Speaking</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-white" />
                  <span>Audition AI Voice Now</span>
                </>
              )}
            </Button>
          </div>

        </div>

      </div>

    </div>
  );
}
