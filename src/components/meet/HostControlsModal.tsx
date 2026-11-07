import React, { useState } from 'react';
import { 
  ShieldAlert, Lock, Unlock, MicOff, Mic, VideoOff, Video, Pin, PinOff, 
  UserMinus, UserCheck, Share2, MessageSquare, Users, Shield, Crown, 
  Search, Volume2, Camera, Sparkles, Check
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { updateHostControlsFn } from '@/lib/meetings.functions';
import { supabase } from '@/integrations/supabase/client';

export interface HostControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  meeting: any;
  currentSettings: {
    isLocked?: boolean;
    waitingRoom?: boolean;
    allowGuestScreenShare?: boolean;
    allowGuestChat?: boolean;
    coHosts?: string[];
  };
  onSettingsUpdate?: (newSettings: any) => void;
  pinnedParticipantIds?: string[];
  onUpdatePinned?: (pinnedIds: string[]) => void;
  isSuperHost?: boolean;
}

export function HostControlsModal({
  isOpen,
  onClose,
  roomId,
  meeting,
  currentSettings,
  onSettingsUpdate,
  pinnedParticipantIds = [],
  onUpdatePinned,
  isSuperHost = false,
}: HostControlsModalProps) {
  const [isLocked, setIsLocked] = useState(Boolean(currentSettings.isLocked));
  const [waitingRoom, setWaitingRoom] = useState(Boolean(currentSettings.waitingRoom));
  const [allowScreenShare, setAllowScreenShare] = useState(currentSettings.allowGuestScreenShare !== false);
  const [allowChat, setAllowChat] = useState(currentSettings.allowGuestChat !== false);
  const [newCoHostEmail, setNewCoHostEmail] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Extract participants from RealtimeKit meeting
  const participants = React.useMemo(() => {
    if (!meeting) return [];
    try {
      const parts: any[] = [];
      if (meeting.self) {
        parts.push({
          id: meeting.self.id || meeting.self.userId || 'self',
          name: `${meeting.self.name || 'You'} (Host)`,
          isSelf: true,
          metadata: meeting.self.metadata || {}
        });
      }
      if (meeting.participants && typeof meeting.participants.values === 'function') {
        for (const p of meeting.participants.values()) {
          parts.push({
            id: p.id || p.userId,
            name: p.name || 'Attendee',
            isSelf: false,
            metadata: p.metadata || {}
          });
        }
      }
      return parts;
    } catch (_) {
      return [];
    }
  }, [meeting]);

  const filteredParticipants = React.useMemo(() => {
    if (!searchQuery.trim()) return participants;
    const q = searchQuery.toLowerCase().trim();
    return participants.filter(p => 
      p.name?.toLowerCase().includes(q) || 
      p.metadata?.intern_id?.toLowerCase().includes(q) ||
      p.metadata?.email?.toLowerCase().includes(q)
    );
  }, [participants, searchQuery]);

  // Broadcast Realtime Mute All Signal
  const handleMuteAll = async () => {
    try {
      const channel = supabase.channel(`meet-controls-${roomId}`);
      await channel.send({
        type: 'broadcast',
        event: 'mute_all',
        payload: { triggeredAt: Date.now() },
      });
      supabase.removeChannel(channel);

      if (meeting?.participants) {
        try {
          if (typeof meeting.muteAll === 'function') {
            await meeting.muteAll();
          }
        } catch (_) {}
      }

      toast.success("Broadcasted 'Mute All' to all attendees.");
    } catch (err) {
      console.warn("Mute all error:", err);
      toast.error("Failed to broadcast mute all command.");
    }
  };

  // Broadcast Realtime Stop All Cameras Signal
  const handleTurnOffAllVideo = async () => {
    try {
      const channel = supabase.channel(`meet-controls-${roomId}`);
      await channel.send({
        type: 'broadcast',
        event: 'stop_all_video',
        payload: { triggeredAt: Date.now() },
      });
      supabase.removeChannel(channel);
      toast.success("Broadcasted 'Turn Off All Cameras' to participants.");
    } catch (err) {
      toast.error("Failed to turn off all cameras");
    }
  };

  // Control Individual Participant Microphone
  const handleRemoteMuteMic = async (p: any) => {
    try {
      const channel = supabase.channel(`meet-controls-${roomId}`);
      await channel.send({
        type: 'broadcast',
        event: 'remote_mute_mic',
        payload: { targetId: p.id, targetName: p.name },
      });
      supabase.removeChannel(channel);
      toast.success(`Muted microphone for ${p.name}`);
    } catch (err) {
      toast.error("Failed to mute participant");
    }
  };

  const handleRemoteRequestUnmute = async (p: any) => {
    try {
      const channel = supabase.channel(`meet-controls-${roomId}`);
      await channel.send({
        type: 'broadcast',
        event: 'remote_request_unmute',
        payload: { targetId: p.id, targetName: p.name },
      });
      supabase.removeChannel(channel);
      toast.info(`Requested ${p.name} to unmute microphone.`);
    } catch (err) {
      toast.error("Failed to send unmute request");
    }
  };

  // Control Individual Participant Video
  const handleRemoteDisableVideo = async (p: any) => {
    try {
      const channel = supabase.channel(`meet-controls-${roomId}`);
      await channel.send({
        type: 'broadcast',
        event: 'remote_disable_video',
        payload: { targetId: p.id, targetName: p.name },
      });
      supabase.removeChannel(channel);
      toast.success(`Turned off camera for ${p.name}`);
    } catch (err) {
      toast.error("Failed to disable participant video");
    }
  };

  const handleRemoteRequestVideo = async (p: any) => {
    try {
      const channel = supabase.channel(`meet-controls-${roomId}`);
      await channel.send({
        type: 'broadcast',
        event: 'remote_request_video',
        payload: { targetId: p.id, targetName: p.name },
      });
      supabase.removeChannel(channel);
      toast.info(`Requested ${p.name} to turn on camera.`);
    } catch (err) {
      toast.error("Failed to send video request");
    }
  };

  // Multi-Pin to Screen (Up to 3 People)
  const handleTogglePinParticipant = async (p: any) => {
    const isPinned = pinnedParticipantIds.includes(p.id);
    let newPinned: string[];
    if (isPinned) {
      newPinned = pinnedParticipantIds.filter(id => id !== p.id);
    } else {
      if (pinnedParticipantIds.length >= 3) {
        toast.warning("Maximum of 3 participants can be pinned to screen at once. Unpin someone first.");
        return;
      }
      newPinned = [...pinnedParticipantIds, p.id];
    }

    onUpdatePinned?.(newPinned);

    try {
      const channel = supabase.channel(`meet-controls-${roomId}`);
      await channel.send({
        type: 'broadcast',
        event: 'pinned_participants_changed',
        payload: { pinnedIds: newPinned },
      });
      supabase.removeChannel(channel);
      toast.success(isPinned ? `Unpinned ${p.name}` : `Pinned ${p.name} (${newPinned.length}/3)`);
    } catch (err) {
      toast.error("Failed to update pin broadcast");
    }
  };

  const handleClearAllPins = async () => {
    onUpdatePinned?.([]);
    try {
      const channel = supabase.channel(`meet-controls-${roomId}`);
      await channel.send({
        type: 'broadcast',
        event: 'pinned_participants_changed',
        payload: { pinnedIds: [] },
      });
      supabase.removeChannel(channel);
      toast.success("Cleared all pinned participants from screen");
    } catch (_) {}
  };

  // Toggle Meeting Lock
  const handleToggleLock = async (checked: boolean) => {
    setIsLocked(checked);
    setIsUpdating(true);
    try {
      const res = await updateHostControlsFn({
        data: {
          meetingId: roomId,
          isLocked: checked,
        }
      });
      if (res.success) {
        toast.success(checked ? "Meeting locked. New attendees blocked." : "Meeting unlocked.");
        onSettingsUpdate?.(res.settings);
        
        const channel = supabase.channel(`meet-controls-${roomId}`);
        await channel.send({
          type: 'broadcast',
          event: 'meeting_lock_changed',
          payload: { isLocked: checked },
        });
        supabase.removeChannel(channel);
      }
    } catch (err) {
      toast.error("Failed to update lock status");
      setIsLocked(!checked);
    } finally {
      setIsUpdating(false);
    }
  };

  // Toggle Screen Share restriction
  const handleToggleScreenShare = async (checked: boolean) => {
    setAllowScreenShare(checked);
    try {
      const res = await updateHostControlsFn({
        data: {
          meetingId: roomId,
          allowGuestScreenShare: checked,
        }
      });
      if (res.success) {
        toast.success(checked ? "Guest screen sharing allowed" : "Guest screen sharing restricted to hosts");
        onSettingsUpdate?.(res.settings);
      }
    } catch (_) {}
  };

  // Toggle Chat restriction
  const handleToggleChat = async (checked: boolean) => {
    setAllowChat(checked);
    try {
      const res = await updateHostControlsFn({
        data: {
          meetingId: roomId,
          allowGuestChat: checked,
        }
      });
      if (res.success) {
        toast.success(checked ? "Guest chat enabled" : "Guest chat restricted");
        onSettingsUpdate?.(res.settings);
      }
    } catch (_) {}
  };

  // Remove / Eject Participant
  const handleEjectParticipant = async (p: any) => {
    if (confirm(`Are you sure you want to remove "${p.name}" from this meeting?`)) {
      try {
        await updateHostControlsFn({
          data: {
            meetingId: roomId,
            ejectUserId: p.id,
          }
        });

        const channel = supabase.channel(`meet-controls-${roomId}`);
        await channel.send({
          type: 'broadcast',
          event: 'eject_participant',
          payload: { targetId: p.id, targetName: p.name },
        });
        supabase.removeChannel(channel);

        toast.success(`Removed ${p.name} from the meeting`);
      } catch (err) {
        toast.error("Failed to remove participant");
      }
    }
  };

  // Assign Co-Host
  const handleAddCoHost = async () => {
    if (!newCoHostEmail.trim()) return;
    try {
      const res = await updateHostControlsFn({
        data: {
          meetingId: roomId,
          addCoHostEmail: newCoHostEmail.trim(),
        }
      });
      if (res.success) {
        toast.success(`Assigned Co-Host permissions to ${newCoHostEmail}`);
        setNewCoHostEmail('');
        onSettingsUpdate?.(res.settings);
      }
    } catch (err) {
      toast.error("Failed to assign co-host");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-[#090c13]/98 backdrop-blur-3xl border border-white/10 text-white rounded-3xl p-6 shadow-2xl font-sans max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pb-1">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-blue-400" />
              <span>Super Admin & Host Control Center</span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-medium">
                Pinned: {pinnedParticipantIds.length}/3
              </span>
            </div>
          </div>
          <DialogDescription className="text-xs text-gray-400">
            Control participant microphones, video feeds, screen sharing, meeting security and pin up to 3 people to screen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Executive Super Host Active Authority Banner */}
          <div className="p-3 bg-gradient-to-r from-amber-500/15 via-blue-500/10 to-purple-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Crown className="h-4 w-4" />
              </div>
              <div>
                <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                  <span>Executive Super Host Authority</span>
                  <span className="text-[10px] text-amber-300 font-normal">(hr@vyntyraconsultancyservices.in)</span>
                </span>
                <span className="text-[10px] text-gray-400">Full moderator control over remote microphones, webcams, pins, and room security</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[9px] font-bold text-amber-300 uppercase tracking-wider shrink-0">
              Active
            </span>
          </div>
          
          {/* Global Quick Action Toggles: Mute All, Turn Off Video, Lock, Clear Pins */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handleMuteAll}
              className="p-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-2xl flex items-center gap-2.5 transition-colors text-left"
            >
              <div className="h-8 w-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                <MicOff className="h-4 w-4 text-rose-400" />
              </div>
              <div>
                <span className="font-semibold text-rose-200 text-xs block">Mute All Microphones</span>
                <span className="text-[10px] text-gray-400">Force mute all participant audio</span>
              </div>
            </button>

            <button
              onClick={handleTurnOffAllVideo}
              className="p-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center gap-2.5 transition-colors text-left"
            >
              <div className="h-8 w-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <VideoOff className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <span className="font-semibold text-amber-200 text-xs block">Stop All Cameras</span>
                <span className="text-[10px] text-gray-400">Disable video for everyone</span>
              </div>
            </button>

            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  isLocked ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                }`}>
                  {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                </div>
                <div>
                  <span className="font-semibold text-white text-xs block">Lock Meeting</span>
                  <span className="text-[10px] text-gray-400">{isLocked ? "Room is locked to guests" : "Open for attendees"}</span>
                </div>
              </div>
              <Switch checked={isLocked} onCheckedChange={handleToggleLock} disabled={isUpdating} />
            </div>

            {pinnedParticipantIds.length > 0 ? (
              <button
                onClick={handleClearAllPins}
                className="p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-2xl flex items-center justify-between transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                    <PinOff className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-blue-200 text-xs block">Clear All Pins ({pinnedParticipantIds.length})</span>
                    <span className="text-[10px] text-gray-400">Reset spotlight stage to default</span>
                  </div>
                </div>
                <span className="text-[10px] text-blue-300 font-semibold px-2 py-1 bg-blue-500/20 rounded-lg">Reset</span>
              </button>
            ) : (
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 shrink-0">
                  <Pin className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-semibold text-gray-200 text-xs block">Screen Pinning (Max 3)</span>
                  <span className="text-[10px] text-gray-400">Pin speakers from the list below</span>
                </div>
              </div>
            )}
          </div>

          {/* Live Participant Moderator List with Mic, Video, & Pin Controls */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-blue-400" />
                <span>Participants ({participants.length})</span>
              </span>
              <div className="w-48">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name/ID..."
                    className="h-7 pl-8 text-[11px] bg-black/50 border-white/10 text-white rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {filteredParticipants.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500 border border-white/5 rounded-2xl bg-white/[0.02]">
                  No matching participants found
                </div>
              ) : (
                filteredParticipants.map((p) => {
                  const isVerified = p.metadata?.is_verified;
                  const internId = p.metadata?.intern_id;
                  const isPinned = pinnedParticipantIds.includes(p.id);

                  return (
                    <div
                      key={p.id}
                      className={`p-2.5 border rounded-2xl flex items-center justify-between text-xs transition-colors ${
                        isPinned 
                          ? 'bg-blue-600/15 border-blue-500/40 shadow-sm' 
                          : 'bg-white/5 border-white/10 hover:bg-white/[0.07]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className={`h-8 w-8 rounded-full font-bold flex items-center justify-center text-[10px] shrink-0 border ${
                          isPinned
                            ? 'bg-blue-500 text-white border-blue-400'
                            : 'bg-blue-600/30 text-blue-400 border-blue-500/30'
                        }`}>
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-semibold text-white truncate">{p.name}</span>
                            {isPinned && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-blue-500/30 border border-blue-400/50 text-blue-300 rounded-full font-semibold flex items-center gap-0.5 shrink-0">
                                <Pin className="h-2.5 w-2.5" />
                                <span>Pinned</span>
                              </span>
                            )}
                            {isVerified && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full font-mono shrink-0">
                                Verified
                              </span>
                            )}
                          </div>
                          {internId && (
                            <span className="text-[10px] text-gray-400 font-mono block">
                              ID: {internId}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Moderator Action Buttons for Remote Control */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Pin to Stage Toggle (Max 3) */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleTogglePinParticipant(p)}
                          className={`h-7 px-2 text-[11px] rounded-lg transition-all ${
                            isPinned
                              ? 'bg-blue-500 text-white hover:bg-blue-600'
                              : 'text-gray-300 hover:text-white hover:bg-white/10'
                          }`}
                          title={isPinned ? "Unpin participant from screen" : "Pin participant to screen (max 3)"}
                        >
                          <Pin className="h-3.5 w-3.5 mr-1" />
                          <span>{isPinned ? "Unpin" : "Pin"}</span>
                        </Button>

                        {!p.isSelf && (
                          <>
                            {/* Microphone Controls: Force Mute & Request Unmute */}
                            <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoteMuteMic(p)}
                                className="h-6 w-6 p-0 text-rose-400 hover:text-white hover:bg-rose-500/30 rounded-md"
                                title="Force Mute Microphone"
                              >
                                <MicOff className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoteRequestUnmute(p)}
                                className="h-6 w-6 p-0 text-gray-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded-md"
                                title="Request to Unmute"
                              >
                                <Mic className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* Video Camera Controls: Force Stop & Request Video */}
                            <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoteDisableVideo(p)}
                                className="h-6 w-6 p-0 text-amber-400 hover:text-white hover:bg-amber-500/30 rounded-md"
                                title="Force Stop Video"
                              >
                                <VideoOff className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoteRequestVideo(p)}
                                className="h-6 w-6 p-0 text-gray-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-md"
                                title="Request Camera On"
                              >
                                <Video className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* Eject Button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEjectParticipant(p)}
                              className="h-7 w-7 p-0 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-lg"
                              title="Eject attendee from meeting"
                            >
                              <UserMinus className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Participant Permissions Toggles */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 space-y-3">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Meeting Policy Restrictions
            </span>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Share2 className="h-4 w-4 text-blue-400" />
                <div>
                  <span className="text-xs font-semibold text-gray-200 block">Allow Screen Sharing</span>
                  <span className="text-[10px] text-gray-400">Permit external guests and interns to present</span>
                </div>
              </div>
              <Switch checked={allowScreenShare} onCheckedChange={handleToggleScreenShare} />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="h-4 w-4 text-emerald-400" />
                <div>
                  <span className="text-xs font-semibold text-gray-200 block">Allow In-Meeting Chat</span>
                  <span className="text-[10px] text-gray-400">Permit attendees to send text messages</span>
                </div>
              </div>
              <Switch checked={allowChat} onCheckedChange={handleToggleChat} />
            </div>
          </div>

          {/* Co-Host Assignment */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Delegate Co-Host Privileges
            </span>
            <div className="flex gap-2">
              <Input
                value={newCoHostEmail}
                onChange={(e) => setNewCoHostEmail(e.target.value)}
                placeholder="Enter member email (e.g. hr@vyntyraconsultancyservices.in)"
                className="h-8.5 bg-black/60 border-white/10 text-white text-xs rounded-xl"
              />
              <Button
                onClick={handleAddCoHost}
                size="sm"
                className="h-8.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-xl shrink-0 font-semibold"
              >
                Assign
              </Button>
            </div>
          </div>

        </div>

        <div className="pt-2 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-[#0b5cff] hover:bg-[#094bdd] text-white text-xs rounded-xl h-9 px-5 font-semibold"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
