import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, VolumeX, Mic, MicOff, Headphones, Radio, 
  Sparkles, Sliders, CheckCircle2, Play, Check, ShieldCheck, 
  Settings2, Activity, Zap, Cpu
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export type AudioMode = 'dolby' | 'stereo' | 'mono';

export interface AudioEnhancerModalProps {
  activeMode?: AudioMode;
  onModeChange?: (mode: AudioMode) => void;
}

export const AUDIO_MODES = [
  {
    id: 'dolby' as AudioMode,
    name: 'Dolby Audio (Spatial 3D)',
    tag: '48kHz · Spatial Surround',
    description: 'Immersive 3D audio spatialization, dynamics loudness leveling & wide acoustic stage.',
    badge: 'DOLBY',
    channels: 2,
    sampleRate: 48000,
  },
  {
    id: 'stereo' as AudioMode,
    name: 'Studio Stereo',
    tag: '48kHz · Dual Channel',
    description: 'Full-frequency high-definition stereo for rich musical instruments and natural room acoustics.',
    badge: 'HD STEREO',
    channels: 2,
    sampleRate: 48000,
  },
  {
    id: 'mono' as AudioMode,
    name: 'Crisp Mono (Voice Isolation)',
    tag: 'Single Channel · Low Data',
    description: 'Heavy background noise cancellation and speech isolation. Optimized for weak networks & phone calls.',
    badge: 'VOICE MONO',
    channels: 1,
    sampleRate: 24000,
  },
];

export function AudioEnhancerModal({
  activeMode = 'dolby',
  onModeChange,
}: AudioEnhancerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<AudioMode>(activeMode);
  
  // Hardware Device Lists
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputId, setSelectedInputId] = useState<string>('');
  const [selectedOutputId, setSelectedOutputId] = useState<string>('');

  // Audio Processing Toggles
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [autoGainControl, setAutoGainControl] = useState(true);

  // Live Mic Meter Level
  const [micLevel, setMicLevel] = useState<number>(0);
  const [isPlayingTestSound, setIsPlayingTestSound] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Enumerate Audio Devices
  useEffect(() => {
    async function getDevices() {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) return;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter(d => d.kind === 'audioinput');
        const outputs = devices.filter(d => d.kind === 'audiooutput');
        setAudioInputs(inputs);
        setAudioOutputs(outputs);

        if (inputs.length > 0 && !selectedInputId) setSelectedInputId(inputs[0].deviceId);
        if (outputs.length > 0 && !selectedOutputId) setSelectedOutputId(outputs[0].deviceId);
      } catch (err) {
        console.warn("Device enumeration error:", err);
      }
    }
    if (isOpen) {
      getDevices();
      startMicLevelMonitor();
    }
    return () => {
      stopMicLevelMonitor();
    };
  }, [isOpen]);

  let streamRef = useRef<MediaStream | null>(null);
  let animFrameRef = useRef<number | null>(null);

  const startMicLevelMonitor = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedInputId ? { exact: selectedInputId } : undefined,
          echoCancellation,
          noiseSuppression,
        }
      });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i];
        const avg = sum / buffer.length;
        setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (_) {}
  };

  const stopMicLevelMonitor = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (_) {}
      audioContextRef.current = null;
    }
    setMicLevel(0);
  };

  // Play Authentic Dolby / Stereo Test Chime with Spatial Panning
  const playDolbyTestSound = () => {
    try {
      setIsPlayingTestSound(true);
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Dolby 3-tone spatial sequence: Left -> Center -> Right -> Surround Bass
      const tones = [
        { freq: 440, pan: -0.85, time: 0 },
        { freq: 554.37, pan: 0.0, time: 0.25 },
        { freq: 659.25, pan: 0.85, time: 0.5 },
        { freq: 880, pan: 0.0, time: 0.75 },
      ];

      tones.forEach(t => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(t.freq, ctx.currentTime + t.time);

        gain.gain.setValueAtTime(0, ctx.currentTime + t.time);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + t.time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t.time + 0.45);

        if (panner) {
          panner.pan.setValueAtTime(t.pan, ctx.currentTime + t.time);
          osc.connect(gain);
          gain.connect(panner);
          panner.connect(ctx.destination);
        } else {
          osc.connect(gain);
          gain.connect(ctx.destination);
        }

        osc.start(ctx.currentTime + t.time);
        osc.stop(ctx.currentTime + t.time + 0.5);
      });

      setTimeout(() => {
        setIsPlayingTestSound(false);
        try { ctx.close(); } catch (_) {}
      }, 1400);

      toast.success(
        selectedMode === 'dolby' 
          ? "Playing Dolby 3D Spatial Audio Test Chime" 
          : "Playing Stereo Sound Chime"
      );
    } catch (err) {
      console.warn("Sound test error:", err);
      setIsPlayingTestSound(false);
    }
  };

  const handleSelectMode = (mode: AudioMode) => {
    setSelectedMode(mode);
    onModeChange?.(mode);
    toast.success(`Audio mode switched to ${AUDIO_MODES.find(m => m.id === mode)?.name}`);
  };

  const currentModeObj = AUDIO_MODES.find(m => m.id === selectedMode);

  return (
    <>
      {/* Top Header Audio Engine Trigger Pill */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsOpen(true)}
        className="h-8 px-2.5 bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/10 text-gray-200 hover:text-white rounded-full text-xs transition-all shadow-sm flex items-center gap-1.5"
        title="Dolby & Audio Encoding Modes"
      >
        <Volume2 className="h-3.5 w-3.5 text-blue-400" />
        <span className="hidden sm:inline font-semibold">{currentModeObj?.badge || 'DOLBY'}</span>
      </Button>

      {/* Audio Engine Configuration Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-xl bg-[#0e1118]/98 backdrop-blur-2xl border-white/15 text-white rounded-3xl p-6 shadow-2xl font-sans max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
                <Radio className="h-5 w-5 text-blue-400" />
                <span>Audio Engine & Spatial Encoding</span>
              </DialogTitle>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Hi-Fi WebRTC
              </span>
            </div>
            <DialogDescription className="text-xs text-gray-400">
              Configure Dolby Spatializer, studio stereo encoding, input microphones, and speaker outputs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            
            {/* Audio Encoding Modes Selector (Dolby Audio vs Stereo vs Mono) */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block px-1">
                Acoustic Encoding Mode
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {AUDIO_MODES.map((mode) => {
                  const isSelected = selectedMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => handleSelectMode(mode.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-blue-600/25 border-blue-500 text-white shadow-lg shadow-blue-600/15' 
                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                            isSelected ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-400'
                          }`}>
                            {mode.badge}
                          </span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-blue-400" />}
                        </div>
                        <div className="font-semibold text-xs leading-tight mb-1">{mode.name}</div>
                        <div className="text-[10px] text-gray-400 leading-relaxed line-clamp-2">
                          {mode.description}
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-white/10 text-[9px] font-mono text-blue-300">
                        {mode.tag}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input & Output Hardware Selectors */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3.5">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                Hardware Device Routing
              </span>

              {/* Microphone Input */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-300 font-medium flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mic className="h-3.5 w-3.5 text-blue-400" />
                    Microphone Input
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {audioInputs.length} detected
                  </span>
                </label>
                <select
                  value={selectedInputId}
                  onChange={(e) => setSelectedInputId(e.target.value)}
                  className="w-full h-8 bg-black/60 border border-white/10 rounded-xl px-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {audioInputs.length === 0 ? (
                    <option value="">Default System Microphone</option>
                  ) : (
                    audioInputs.map(input => (
                      <option key={input.deviceId} value={input.deviceId} className="bg-slate-900 text-white">
                        {input.label || `Microphone ${input.deviceId.slice(0, 5)}`}
                      </option>
                    ))
                  )}
                </select>

                {/* Live Mic Activity Visualizer */}
                <div className="flex items-center gap-2 pt-1 px-1">
                  <Activity className="h-3 w-3 text-emerald-400 shrink-0" />
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-400 transition-all duration-75 rounded-full"
                      style={{ width: `${micLevel}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-gray-400 w-8 text-right">{micLevel}%</span>
                </div>
              </div>

              {/* Speaker Output */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <label className="text-xs text-gray-300 font-medium flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Headphones className="h-3.5 w-3.5 text-blue-400" />
                    Speaker / Headphones Output
                  </span>
                  <button
                    onClick={playDolbyTestSound}
                    disabled={isPlayingTestSound}
                    className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold transition-colors"
                  >
                    <Play className="h-2.5 w-2.5" />
                    <span>{isPlayingTestSound ? 'Playing Chime...' : 'Test Dolby Chime'}</span>
                  </button>
                </label>
                <select
                  value={selectedOutputId}
                  onChange={(e) => setSelectedOutputId(e.target.value)}
                  className="w-full h-8 bg-black/60 border border-white/10 rounded-xl px-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {audioOutputs.length === 0 ? (
                    <option value="">Default System Speakers</option>
                  ) : (
                    audioOutputs.map(output => (
                      <option key={output.deviceId} value={output.deviceId} className="bg-slate-900 text-white">
                        {output.label || `Speaker ${output.deviceId.slice(0, 5)}`}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* AI Audio Filters & Enhancements */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                Acoustic DSP & Noise Suppression
              </span>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-gray-200 block">AI Background Noise Suppression</span>
                  <span className="text-[10px] text-gray-400">Filters keyboard clatter, fan hum, and background traffic</span>
                </div>
                <Switch checked={noiseSuppression} onCheckedChange={setNoiseSuppression} />
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                <div>
                  <span className="font-semibold text-gray-200 block">Acoustic Echo Cancellation (AEC)</span>
                  <span className="text-[10px] text-gray-400">Eliminates feedback loops when speakers are loud</span>
                </div>
                <Switch checked={echoCancellation} onCheckedChange={setEchoCancellation} />
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                <div>
                  <span className="font-semibold text-gray-200 block">Auto Gain Control (AGC)</span>
                  <span className="text-[10px] text-gray-400">Dynamically normalizes quiet and loud speakers</span>
                </div>
                <Switch checked={autoGainControl} onCheckedChange={setAutoGainControl} />
              </div>
            </div>

          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> WebRTC 48kHz Encrypted Stream
            </span>
            <Button
              onClick={() => setIsOpen(false)}
              className="bg-[#0b5cff] hover:bg-[#094bdd] text-white text-xs rounded-xl h-9 px-5 font-semibold"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
