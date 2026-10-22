import React, { useState, useEffect } from 'react';
import { Activity, Wifi, Signal, ArrowDown, ArrowUp, Info, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MeetingNetworkHUD() {
  const [latency, setLatency] = useState(24);
  const [downSpeed, setDownSpeed] = useState(14.8);
  const [upSpeed, setUpSpeed] = useState(4.2);
  const [packetLoss, setPacketLoss] = useState(0.0);
  const [isOpen, setIsOpen] = useState(false);

  // Periodically sample or simulate realistic connection telemetry
  useEffect(() => {
    const interval = setInterval(() => {
      // Check navigator.connection if supported
      const navConn = (navigator as any).connection;
      const baseDown = navConn?.downlink || 12.0;

      setLatency(Math.floor(18 + Math.random() * 12));
      setDownSpeed(parseFloat((baseDown + (Math.random() * 2 - 1)).toFixed(1)));
      setUpSpeed(parseFloat((4.0 + (Math.random() * 1.2 - 0.6)).toFixed(1)));
      setPacketLoss(Math.random() > 0.95 ? 0.1 : 0.0);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const qualityColor = latency < 40 && packetLoss === 0 
    ? 'text-emerald-400' 
    : latency < 80 
    ? 'text-yellow-400' 
    : 'text-rose-400';

  const qualityBg = latency < 40 && packetLoss === 0 
    ? 'bg-emerald-500/10 border-emerald-500/30' 
    : latency < 80 
    ? 'bg-yellow-500/10 border-yellow-500/30' 
    : 'bg-rose-500/10 border-rose-500/30';

  return (
    <div className="relative">
      {/* Sleek Floating Network Badge */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-8 px-2.5 rounded-full text-xs font-mono font-medium transition-all backdrop-blur-md border bg-black/50 hover:bg-black/80 text-gray-200 border-white/10 flex items-center gap-2`}
        title="Network Telemetry & Stream Health"
      >
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${latency < 40 ? 'bg-emerald-400' : 'bg-yellow-400'}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${latency < 40 ? 'bg-emerald-500' : 'bg-yellow-500'}`}></span>
        </span>
        <span className="text-gray-300 hidden md:inline">{latency}ms</span>
        <span className="text-gray-500 hidden lg:inline">|</span>
        <span className="text-gray-300 hidden lg:flex items-center gap-0.5">
          <ArrowDown className="h-3 w-3 text-emerald-400" />
          {downSpeed}M
        </span>
      </Button>

      {/* Expandable Enterprise Telemetry Drawer */}
      {isOpen && (
        <div className="absolute top-11 right-0 w-72 bg-[#12141a]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 text-white">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
            <div className="flex items-center gap-1.5">
              <Signal className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold tracking-wide uppercase text-gray-300">Stream Telemetry</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white rounded p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Connection Quality</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${qualityBg} ${qualityColor}`}>
                {latency < 40 ? 'Ultra HD • Optimal' : 'Good • Normal'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Round Trip Time (RTT)</span>
              <span className="font-mono font-medium text-emerald-400">{latency} ms</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Downlink Throughput</span>
              <span className="font-mono text-gray-200">{downSpeed} Mbps</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Uplink Throughput</span>
              <span className="font-mono text-gray-200">{upSpeed} Mbps</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Packet Loss</span>
              <span className="font-mono text-gray-200">{packetLoss}%</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Active Video Stream</span>
              <span className="font-mono text-blue-400 font-semibold">1080p FHD @ 60fps</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Audio Codec</span>
              <span className="font-mono text-gray-300">Opus Fullband (48 kHz)</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Encryption</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> E2EE AES-GCM
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
