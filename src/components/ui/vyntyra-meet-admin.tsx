import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createMeetingRoomFn, getActiveMeetingsFn, endMeetingFn } from "@/lib/meetings.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, ShieldAlert, Video, Users, Trash2, Shield, Calendar, Clock, Lock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function VyntyraMeetAdmin() {
  const qc = useQueryClient();
  const fetchMeetings = useServerFn(getActiveMeetingsFn);
  const createMeeting = useServerFn(createMeetingRoomFn);
  const endMeeting = useServerFn(endMeetingFn);

  const [title, setTitle] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(40);
  const [muteOnEntry, setMuteOnEntry] = useState(false);
  const [disableCameras, setDisableCameras] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { data: meetings, isLoading } = useQuery({
    queryKey: ["vyntyra-meet-rooms"],
    queryFn: () => fetchMeetings()
  });

  const createMut = useMutation({
    mutationFn: async () => {
      return await createMeeting({
        data: {
          title,
          maxParticipants,
          settings: { muteOnEntry, disableCameras, recordingEnabled: false }
        }
      });
    },
    onSuccess: (data) => {
      toast.success(`Meeting room created: ${data.title}`);
      setTitle('');
      qc.invalidateQueries({ queryKey: ["vyntyra-meet-rooms"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create meeting.");
    }
  });

  const endMut = useMutation({
    mutationFn: async (roomId: string) => {
      return await endMeeting({ data: { roomId } });
    },
    onSuccess: () => {
      toast.success("Meeting room terminated securely.");
      qc.invalidateQueries({ queryKey: ["vyntyra-meet-rooms"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to end meeting.");
    }
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return toast.error("Please enter a meeting title.");
    createMut.mutate();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl glassmorphism">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-emerald-400 h-6 w-6" />
            Vyntyra Meet Operations
          </h2>
          <p className="text-slate-400 mt-1">Enterprise-grade, E2EE secure video meeting rooms.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Meeting Form */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
            <Plus className="h-5 w-5 text-indigo-500" />
            Create Meeting
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Meeting Title</label>
              <Input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="e.g. Q3 Executive Review"
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Max Participants (up to 40)</label>
              <Input 
                type="number"
                min={2}
                max={40}
                value={maxParticipants} 
                onChange={e => setMaxParticipants(Number(e.target.value))} 
                className="mt-1"
                required
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Mute all on entry</span>
                <Switch checked={muteOnEntry} onCheckedChange={setMuteOnEntry} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Disable cameras on entry</span>
                <Switch checked={disableCameras} onCheckedChange={setDisableCameras} />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={createMut.isPending} 
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
              Generate Secure Room
            </Button>
          </form>
        </div>

        {/* Active Rooms List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Video className="h-5 w-5 text-emerald-500" />
            Live & Upcoming Rooms
          </h3>
          
          {isLoading ? (
            <div className="p-8 text-center text-slate-500"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" /> Loading active rooms...</div>
          ) : !meetings?.length ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <Lock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No active meeting rooms.</p>
              <p className="text-sm text-slate-400 mt-1">Create a room to securely connect with your team.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {meetings.map((room: any) => {
                const settings = JSON.parse(room.settings || '{}');
                return (
                  <div key={room.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-800 dark:text-white">{room.title}</h4>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Live
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Max {room.max_participants}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Created {new Date(room.created_at).toLocaleTimeString()}</span>
                        <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> E2EE Secure</span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded inline-block mt-2">
                        ID: {room.id}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => window.open(`/meet/${room.id}`, '_blank')} className="gap-2 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                        <Video className="h-4 w-4" /> Join as Host
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => endMut.mutate(room.id)} disabled={endMut.isPending} className="gap-2">
                        <Trash2 className="h-4 w-4" /> Terminate
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
