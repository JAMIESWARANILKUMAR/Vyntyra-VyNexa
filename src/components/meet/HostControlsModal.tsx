import React, { useState } from 'react';
import { 
  ShieldAlert, Lock, Unlock, MicOff, UserMinus, UserCheck, 
  Share2, MessageSquare, AlertTriangle, Users, CheckCircle2, Shield, Loader2, Crown 
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
}

export function HostControlsModal({
  isOpen,
  onClose,
  roomId,
  meeting,
  currentSettings,
  onSettingsUpdate,
}: HostControlsModalProps) {
  const [isLocked, setIsLocked] = useState(Boolean(currentSettings.isLocked));
  const [waitingRoom, setWaitingRoom] = useState(Boolean(currentSettings.waitingRoom));
  const [allowScreenShare, setAllowScreenShare] = useState(currentSettings.allowGuestScreenShare !== false);
  const [allowChat, setAllowChat] = useState(currentSettings.allowGuestChat !== false);
  const [newCoHostEmail, setNewCoHostEmail] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

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

      // Also try muting local RealtimeKit participants if method supported
      if (meeting?.participants) {
        try {
          if (typeof meeting.muteAll === 'function') {
            await meeting.muteAll();
          }
        } catch (_) {}
      }

      toast.success("Broadcasted 'Mute All' to all participants.");
    } catch (err) {
      console.warn("Mute all error:", err);
      toast.error("Failed to broadcast mute all command.");
    }
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
        
        // Broadcast lock status
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

        // Broadcast eject event
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
      <DialogContent className="sm:max-w-xl bg-[#0e1118]/98 backdrop-blur-2xl border-white/15 text-white rounded-3xl p-6 shadow-2xl font-sans max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
            <Shield className="h-5 w-5 text-blue-400" />
            <span>Enterprise Host Controls & RBAC</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-400">
            Manage meeting security, participant privileges, and access permissions in real time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Executive Super Host Active Authority Banner */}
          <div className="p-3 bg-gradient-to-r from-amber-500/15 via-blue-500/10 to-purple-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Crown className="h-4 w-4" />
              </div>
              <div>
                <span className="font-semibold text-white text-xs block flex items-center gap-1.5">
                  <span>Executive Super Host Authority</span>
                  <span className="text-[10px] text-amber-300 font-normal">(hr@vyntyraconsultancyservices.in)</span>
                </span>
                <span className="text-[10px] text-gray-400">Unrestricted privileges to lock, mute, moderate, and govern all room policies</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[9px] font-bold text-amber-300 uppercase tracking-wider shrink-0">
              Active
            </span>
          </div>
          
          {/* Quick Actions Bar: Mute All & Lock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleMuteAll}
              className="p-3.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-2xl flex items-center gap-3 transition-colors text-left"
            >
              <div className="h-10 w-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                <MicOff className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <span className="font-semibold text-rose-200 text-xs block">Mute All Participants</span>
                <span className="text-[10px] text-gray-400">Force mute all microphones</span>
              </div>
            </button>

            <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  isLocked ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                }`}>
                  {isLocked ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
                </div>
                <div>
                  <span className="font-semibold text-white text-xs block">Lock Meeting</span>
                  <span className="text-[10px] text-gray-400">{isLocked ? "Room is locked" : "Anyone can join"}</span>
                </div>
              </div>
              <Switch checked={isLocked} onCheckedChange={handleToggleLock} disabled={isUpdating} />
            </div>
          </div>

          {/* Participant Permissions Toggles */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Guest & Attendee Permissions
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
                  <span className="text-[10px] text-gray-400">Permit participants to send public messages</span>
                </div>
              </div>
              <Switch checked={allowChat} onCheckedChange={handleToggleChat} />
            </div>
          </div>

          {/* Co-Host Assignment */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Delegate Co-Host Privileges
            </span>
            <div className="flex gap-2">
              <Input
                value={newCoHostEmail}
                onChange={(e) => setNewCoHostEmail(e.target.value)}
                placeholder="Enter member email (e.g. hr@vyntyraconsultancyservices.in)"
                className="h-9 bg-black/60 border-white/10 text-white text-xs rounded-xl"
              />
              <Button
                onClick={handleAddCoHost}
                size="sm"
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-xl shrink-0 font-semibold"
              >
                Assign
              </Button>
            </div>
          </div>

          {/* Live Participant Moderator List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Active Participants ({participants.length})
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {participants.map((p) => {
                const isVerified = p.metadata?.is_verified;
                const internId = p.metadata?.intern_id;
                return (
                  <div
                    key={p.id}
                    className="p-2.5 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-blue-600/30 text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0 border border-blue-500/30">
                        {p.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-semibold text-white truncate">{p.name}</span>
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

                    {!p.isSelf && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEjectParticipant(p)}
                        className="h-7 px-2 text-rose-400 hover:text-white hover:bg-rose-500/20 text-[11px] rounded-lg shrink-0"
                        title="Remove attendee from call"
                      >
                        <UserMinus className="h-3.5 w-3.5 mr-1" />
                        <span>Eject</span>
                      </Button>
                    )}
                  </div>
                );
              })}
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
