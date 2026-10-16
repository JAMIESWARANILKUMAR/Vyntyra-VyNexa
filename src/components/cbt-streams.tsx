import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MonitorSmartphone, Video, Loader2, Monitor, MonitorOff, ShieldCheck } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { toggleAdminExamScreenShareFn } from '@/lib/cbt.functions';
import { toast } from 'sonner';

export function ActiveStreamsSection() {
  const [activeCandidates, setActiveCandidates] = useState<any[]>([]);
  const [selectedStream, setSelectedStream] = useState<any | null>(null);

  useEffect(() => {
    const channel = supabase.channel('cbt-active-exams');
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const active: any[] = [];
        Object.keys(state).forEach(key => {
          state[key].forEach((p: any) => {
            if (p.status === 'running') {
              if (!active.find(a => a.internId === p.internId && a.testId === p.testId)) {
                active.push(p);
              }
            }
          });
        });
        setActiveCandidates(active);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="bg-white border rounded-2xl overflow-hidden shadow-sm mt-6 p-6">
      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
        <MonitorSmartphone className="h-5 w-5 text-indigo-500" /> Live Candidates (WebRTC Streams)
      </h3>
      {activeCandidates.length === 0 ? (
         <div className="text-slate-500 text-sm p-4 bg-slate-50 rounded-xl text-center border border-dashed border-slate-300">No candidates currently taking an exam.</div>
      ) : (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCandidates.map((c, i) => (
              <div key={i} className="p-4 border border-slate-200 rounded-xl flex flex-col justify-between bg-slate-50/50">
                 <div className="mb-4">
                   <div className="flex justify-between items-start mb-2">
                     <div className="font-bold text-sm text-slate-800">Intern: {c.internId}</div>
                     <div className="text-xs text-emerald-600 font-bold flex items-center gap-1"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span> LIVE</div>
                   </div>
                   <div className="text-[10px] text-slate-500 font-mono mb-2 truncate">Test: {c.testId}</div>
                   
                   {c.strikes > 0 && (
                     <div className="mb-2 p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 font-bold">
                       ⚠️ {c.strikes} Strike{c.strikes > 1 ? 's' : ''}: {c.latestLog}
                     </div>
                   )}

                   {c.totalQ ? (
                     <div className="mt-3 bg-white p-2 rounded border border-slate-200 text-xs">
                       <div className="flex justify-between font-medium text-slate-700 mb-1">
                         <span>Q: {c.activeQ + 1} / {c.totalQ}</span>
                         <span className={c.timeLeft < 10 ? 'text-rose-500 font-bold' : ''}>{Math.floor(c.timeLeft / 60)}:{(c.timeLeft % 60).toString().padStart(2, '0')}</span>
                       </div>
                       <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                         <div className="bg-indigo-500 h-1.5 transition-all duration-300" style={{ width: `${((c.activeQ + 1) / c.totalQ) * 100}%` }}></div>
                       </div>
                     </div>
                   ) : (
                     <div className="text-[10px] text-slate-500 font-mono mt-1">IP: {c.ip}</div>
                   )}
                 </div>
                 <div className="flex gap-2">
                   <Button size="sm" onClick={() => setSelectedStream(c)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 font-bold"><Video className="h-4 w-4 mr-2"/> Stream</Button>
                   <Button size="sm" variant="destructive" onClick={() => {
                     const channel = supabase.channel('cbt-active-exams');
                     channel.send({ type: 'broadcast', event: 'force_submit', payload: { internId: c.internId, testId: c.testId } });
                   }} className="font-bold">Force Submit</Button>
                 </div>
              </div>
            ))}
         </div>
      )}

      {selectedStream && (
        <StreamModal candidate={selectedStream} onClose={() => setSelectedStream(null)} />
      )}
    </div>
  );
}

function StreamModal({ candidate, onClose }: { candidate: any, onClose: () => void }) {
  const [status, setStatus] = useState('connecting');
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState<boolean>(Boolean(candidate.allow_screen_share));
  const [isTogglingScreen, setIsTogglingScreen] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);
  const channelRef = useRef<any>(null);
  const toggleScreenFn = useServerFn(toggleAdminExamScreenShareFn);

  const handleToggleScreenShare = async () => {
    const nextState = !isScreenShareEnabled;
    setIsTogglingScreen(true);
    setIsScreenShareEnabled(nextState);

    // Notify candidate via real-time WebRTC broadcast channel
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'set_screen_share',
        payload: { enabled: nextState }
      });
    }

    try {
      await toggleScreenFn({ data: { testId: candidate.testId, allowScreenShare: nextState } });
      toast.success(nextState ? "External screen sharing enabled by Admin. Screen feed requested." : "External screen sharing disabled by Admin. Reverted to blank display.");
    } catch (e: any) {
      console.warn("Screen share persistence error:", e);
    } finally {
      setIsTogglingScreen(false);
    }
  };

  useEffect(() => {
    let channel: any;
    const initWebRTC = async () => {
       const channelName = `cbt-exam-${candidate.testId}-${candidate.internId}`;
       channel = supabase.channel(channelName);
       channelRef.current = channel;
       
       const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
       pcRef.current = pc;

       pc.ontrack = (event) => {
         const stream = event.streams[0];
         if (webcamRef.current && !webcamRef.current.srcObject) {
           webcamRef.current.srcObject = stream;
         } else if (screenRef.current && !screenRef.current.srcObject && webcamRef.current?.srcObject !== stream) {
           screenRef.current.srcObject = stream;
         }
         setStatus('connected');
       };

       pc.onicecandidate = (event) => {
         if (event.candidate) {
           channel.send({ type: 'broadcast', event: 'ice_candidate', payload: { candidate: event.candidate, target: 'intern' } });
         }
       };

       channel
         .on('broadcast', { event: 'sdp_offer' }, async ({ payload }: any) => {
           setStatus('negotiating');
           await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
           const answer = await pc.createAnswer();
           await pc.setLocalDescription(answer);
           channel.send({ type: 'broadcast', event: 'sdp_answer', payload: { answer } });
         })
         .on('broadcast', { event: 'ice_candidate' }, async ({ payload }: any) => {
           if (payload.target === 'admin' && pcRef.current) {
             await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
           }
         })
         .subscribe(async (s: string) => {
           if (s === 'SUBSCRIBED') {
             channel.send({ type: 'broadcast', event: 'request_stream', payload: {} });
           }
         });
    };

    initWebRTC();

    return () => {
      if (channel) supabase.removeChannel(channel);
      if (pcRef.current) pcRef.current.close();
      channelRef.current = null;
    };
  }, [candidate]);

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-5xl bg-slate-900 border-slate-700 text-white p-6">
        <DialogHeader>
           <DialogTitle className="text-white flex items-center justify-between">
             <div className="flex items-center gap-2">
               <Video className="h-5 w-5 text-emerald-500" /> 
               Live Stream: {candidate.internId}
             </div>
             <div className="flex items-center gap-3">
               <Button
                 size="sm"
                 variant="outline"
                 onClick={handleToggleScreenShare}
                 disabled={isTogglingScreen}
                 className={`text-xs font-bold border transition-all ${
                   isScreenShareEnabled 
                     ? "border-amber-500/70 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20" 
                     : "border-emerald-500/70 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                 }`}
               >
                 {isScreenShareEnabled ? (
                   <><MonitorOff className="h-3.5 w-3.5 mr-1 text-amber-400" /> Disable Screen Share</>
                 ) : (
                   <><Monitor className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Enable Screen Share</>
                 )}
               </Button>
               <div className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-700">
                 {status.toUpperCase()}
               </div>
             </div>
           </DialogTitle>
           <DialogDescription className="text-slate-400">
             WebRTC secure P2P candidate monitoring. External screen sharing is restricted and managed by admin only.
           </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
           {/* Webcam Feed */}
           <div className="bg-black rounded-lg overflow-hidden border border-slate-700 aspect-video relative flex items-center justify-center">
             {status !== 'connected' && <Loader2 className="h-8 w-8 text-slate-500 animate-spin absolute" />}
             <video ref={webcamRef} autoPlay playsInline className="w-full h-full object-cover" />
             <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded font-bold uppercase flex items-center gap-1.5 border border-slate-700">
               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Webcam Feed
             </div>
           </div>

           {/* External Screen Share Display (Live if Admin Enabled, Blank Screen if Disabled) */}
           <div className="bg-black rounded-lg overflow-hidden border border-slate-700 aspect-video relative flex items-center justify-center">
             {isScreenShareEnabled ? (
               <>
                 {status !== 'connected' && <Loader2 className="h-8 w-8 text-slate-500 animate-spin absolute" />}
                 <video ref={screenRef} autoPlay playsInline className="w-full h-full object-contain" />
                 <div className="absolute bottom-2 left-2 bg-emerald-600/90 text-white text-[10px] px-2 py-1 rounded font-bold uppercase flex items-center gap-1.5 shadow">
                   <div className="h-2 w-2 rounded-full bg-white animate-pulse" /> External Screen Live
                 </div>
               </>
             ) : (
               <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none relative">
                 <div className="h-14 w-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-3">
                   <MonitorOff className="h-7 w-7 text-slate-600" />
                 </div>
                 <div className="text-xs font-bold text-slate-300">External Screen Sharing Disabled</div>
                 <div className="text-[11px] text-slate-500 mt-1 max-w-xs leading-relaxed">
                   Screen display is blank. External screen sharing is disabled and can only be enabled by the admin dashboard.
                 </div>
                 <Button
                   size="sm"
                   onClick={handleToggleScreenShare}
                   disabled={isTogglingScreen}
                   className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-8 px-4 rounded-lg flex items-center gap-1.5 shadow"
                 >
                   <Monitor className="h-3.5 w-3.5" /> Enable Screen Sharing Now
                 </Button>
                 {/* Hidden video track container to preserve WebRTC channel */}
                 <video ref={screenRef} autoPlay playsInline className="hidden" />
               </div>
             )}
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
