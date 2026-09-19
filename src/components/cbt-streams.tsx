import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MonitorSmartphone, Video, Loader2 } from 'lucide-react';

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
                   <div className="font-bold text-sm text-slate-800">Intern ID: {c.internId}</div>
                   <div className="text-[10px] text-slate-500 font-mono">Test ID: {c.testId}</div>
                   <div className="text-[10px] text-slate-500 font-mono mt-1">IP: {c.ip}</div>
                   <div className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span> LIVE</div>
                 </div>
                 <Button size="sm" onClick={() => setSelectedStream(c)} className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold"><Video className="h-4 w-4 mr-2"/> Connect Stream</Button>
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
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let channel: any;
    const initWebRTC = async () => {
       const channelName = `cbt-exam-${candidate.testId}-${candidate.internId}`;
       channel = supabase.channel(channelName);
       
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
             <div className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded">{status.toUpperCase()}</div>
           </DialogTitle>
           <DialogDescription className="text-slate-400">WebRTC secure P2P connection to candidate machine.</DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
           <div className="bg-black rounded-lg overflow-hidden border border-slate-700 aspect-video relative flex items-center justify-center">
             {status !== 'connected' && <Loader2 className="h-8 w-8 text-slate-500 animate-spin absolute" />}
             <video ref={webcamRef} autoPlay playsInline className="w-full h-full object-cover" />
             <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded font-bold uppercase">Webcam</div>
           </div>
           <div className="bg-black rounded-lg overflow-hidden border border-slate-700 aspect-video relative flex items-center justify-center">
             {status !== 'connected' && <Loader2 className="h-8 w-8 text-slate-500 animate-spin absolute" />}
             <video ref={screenRef} autoPlay playsInline className="w-full h-full object-contain" />
             <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded font-bold uppercase">Screen Share</div>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
