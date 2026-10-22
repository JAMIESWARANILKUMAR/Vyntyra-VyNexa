import React, { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { 
  Video, Plus, Keyboard, Copy, Sparkles, ShieldCheck, 
  Languages, Users, ArrowRight, Check, Clock, ExternalLink 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createMeetingRoomFn } from "@/lib/meetings.functions";
import { toast } from "sonner";

export const Route = createFileRoute('/meet/')({
  component: MeetIndexComponent,
});

function MeetIndexComponent() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  const [createdRoom, setCreatedRoom] = useState<{
    roomId: string;
    url: string;
  } | null>(null);

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        " · " +
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Parse and normalize input meeting link or code
  const handleJoin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let raw = meetingCode.trim();
    if (!raw) {
      toast.error("Please enter a meeting code or link");
      return;
    }

    // Extract code from full URL if pasted
    if (raw.includes("/meet/")) {
      const parts = raw.split("/meet/");
      raw = parts[1].split(/[?#]/)[0];
    }

    const cleanCode = raw.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
    if (!cleanCode) {
      toast.error("Invalid meeting code format");
      return;
    }

    navigate({ to: `/meet/${cleanCode}` });
  };

  // Instant Meeting Creator
  const handleStartInstant = async () => {
    setIsCreating(true);
    try {
      const res = await createMeetingRoomFn({
        data: {
          title: "Instant Video Meeting",
          maxParticipants: 40,
        }
      });
      if (res?.roomId) {
        toast.success(`Meeting created: ${res.roomId}`);
        navigate({ to: `/meet/${res.roomId}` });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start meeting. Please sign in.");
    } finally {
      setIsCreating(false);
    }
  };

  // Create For Later
  const handleCreateForLater = async () => {
    setIsCreating(true);
    try {
      const res = await createMeetingRoomFn({
        data: {
          title: "Scheduled Video Meeting",
          maxParticipants: 40,
        }
      });
      if (res?.roomId) {
        const fullUrl = res.url || `${window.location.origin}/meet/${res.roomId}`;
        setCreatedRoom({ roomId: res.roomId, url: fullUrl });
        toast.success("Meeting link generated!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate meeting link. Please sign in.");
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (text: string, msg: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(text);
      toast.success(msg);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col font-sans selection:bg-[#0b5cff]/30">
      
      {/* Top Navbar */}
      <header className="h-16 border-b border-white/5 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/icon-512.png" alt="Vyntyra Logo" className="h-9 w-9 object-contain rounded-xl shadow-lg shadow-blue-500/20" />
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-lg tracking-tight text-white">Vyntyra</span>
            <span className="text-xs uppercase tracking-wider text-blue-400 font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
              Meet
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="hidden sm:inline-block font-medium">{currentTime}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/" })}
            className="border-white/10 bg-white/5 hover:bg-white/10 text-gray-200 rounded-xl text-xs h-8"
          >
            Dashboard
          </Button>
        </div>
      </header>

      {/* Main Hero & Quick Join Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 lg:py-20 flex flex-col lg:flex-row items-center justify-between gap-12">
        
        {/* Left Column: Heading & Actions */}
        <div className="flex-1 max-w-xl space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#0b5cff] text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Short, Memorable Meeting URLs · Zero Latency WebRTC</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
            Premium video meetings. <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Simple to share.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
            Connect with teams and interns with crystal clear audio, AI lighting enhancers, 
            instant Indian language translation, and short shareable links.
          </p>

          {/* Action Row: Start or Join */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
            
            {/* New Meeting Dropdown / Instant Button */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                onClick={handleStartInstant}
                disabled={isCreating}
                className="w-full sm:w-auto h-12 px-6 bg-[#0b5cff] hover:bg-[#094bdd] text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                <span>Instant Meeting</span>
              </Button>

              <Button
                onClick={handleCreateForLater}
                disabled={isCreating}
                variant="outline"
                className="h-12 px-4 border-white/10 bg-white/5 hover:bg-white/10 text-gray-200 font-medium rounded-xl text-xs"
                title="Create meeting link to share later"
              >
                Create for Later
              </Button>
            </div>

            {/* Code / Link Input Field */}
            <form onSubmit={handleJoin} className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Keyboard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  placeholder="Enter a code or link"
                  className="h-12 pl-10 pr-3 bg-white/5 border-white/10 focus:border-[#0b5cff] text-white text-sm rounded-xl font-mono placeholder:font-sans placeholder:text-gray-500"
                />
              </div>

              <Button
                type="submit"
                disabled={!meetingCode.trim()}
                variant="ghost"
                className="h-12 px-5 font-semibold text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-xl transition-all disabled:opacity-40"
              >
                Join
              </Button>
            </form>
          </div>

          {/* Quick Explainer Badges */}
          <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> End-to-End Secure
            </span>
            <span className="text-gray-600">·</span>
            <span className="flex items-center gap-1.5">
              <Languages className="h-4 w-4 text-purple-400" /> 13 Indian Languages
            </span>
            <span className="text-gray-600">·</span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-blue-400" /> Up to 1000 Attendees
            </span>
          </div>
        </div>

        {/* Right Column: Visual Preview Card */}
        <div className="flex-1 max-w-md w-full">
          <div className="relative rounded-3xl p-6 bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 shadow-2xl backdrop-blur-xl space-y-5">
            
            {/* Visual Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-gray-200">Short Link Format</span>
              </div>
              <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                100% Shareable
              </span>
            </div>

            {/* Link Preview Mockup */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
              <div className="text-[11px] text-gray-400 font-medium">Example Meeting URL</div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 font-mono text-xs text-blue-400 break-all select-all flex items-center justify-between">
                <span>portal.vyntyraconsultancyservices.in/meet/vyn-kmp-xyz</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                <span>Room Code:</span>
                <span className="font-mono text-white font-bold bg-white/10 px-2 py-0.5 rounded-md">vyn-kmp-xyz</span>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Compact & WhatsApp Ready</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">URLs are short, neat, and fit in a single line on any mobile chat.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                  <Languages className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Live Indian Languages AI</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">Real-time bilingual captions and translation across Hindi, Telugu, Tamil, and more.</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* "Create for Later" Generated Link Modal */}
      <Dialog open={!!createdRoom} onOpenChange={(open) => !open && setCreatedRoom(null)}>
        <DialogContent className="sm:max-w-[480px] bg-[#0e1118] border-white/10 text-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-400" />
              Here's your meeting link
            </DialogTitle>
          </DialogHeader>

          {createdRoom && (
            <div className="space-y-4 py-3">
              <p className="text-xs text-gray-400 leading-relaxed">
                Copy this short link and send it to people you want to meet with. Be sure to save it so you can use it later too.
              </p>

              <div className="p-3 bg-black/40 border border-white/10 rounded-xl flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-blue-400 truncate select-all">{createdRoom.url}</span>
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(createdRoom.url, "Meeting link copied!")}
                  className="h-8 px-3 bg-[#0b5cff] hover:bg-[#094bdd] text-white shrink-0 text-xs rounded-lg gap-1.5"
                >
                  <Copy className="h-3 w-3" /> Copy
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl text-xs">
                <div>
                  <span className="text-gray-400 block text-[11px]">Meeting Room Code</span>
                  <span className="font-mono text-base font-bold text-white tracking-wide">{createdRoom.roomId}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(createdRoom.roomId, "Meeting code copied!")}
                  className="h-8 border-white/10 bg-white/5 text-gray-200 text-xs"
                >
                  Copy Code
                </Button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setCreatedRoom(null)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Dismiss
                </Button>
                <Button
                  onClick={() => navigate({ to: `/meet/${createdRoom.roomId}` })}
                  className="bg-[#0b5cff] hover:bg-[#094bdd] text-white text-xs font-semibold px-4 h-9 rounded-xl"
                >
                  Join Meeting Now
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
