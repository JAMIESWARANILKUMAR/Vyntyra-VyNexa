import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createMeetingRoomFn, getActiveMeetingsFn, endMeetingFn } from "@/lib/meetings.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Shield, Video, Plus, Lock, Users, Clock, Trash2, Copy, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MonthlyCalendar } from "@/components/monthly-calendar";

// Need to wrap Server Functions for React Query
const fetchMeetings = async () => await getActiveMeetingsFn();
const createMeeting = async (opts: any) => await createMeetingRoomFn(opts);
const endMeeting = async (opts: any) => await endMeetingFn(opts);

export function VyntyraMeetAdmin() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(40);
  const [muteOnEntry, setMuteOnEntry] = useState(false);
  const [disableCameras, setDisableCameras] = useState(false);
  
  // Advanced Settings
  const [type, setType] = useState<"internal" | "external">("internal");
  const [password, setPassword] = useState("");
  const [allowedEmails, setAllowedEmails] = useState("");
  const [superHosts, setSuperHosts] = useState("");
  const [hosts, setHosts] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");

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
          settings: { 
            muteOnEntry, 
            disableCameras, 
            recordingEnabled: false,
            type,
            password: type === "external" ? password : "",
            allowedEmails,
            superHosts,
            hosts,
            scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : undefined
          }
        }
      });
    },
    onSuccess: (data) => {
      toast.success(`Meeting room created: ${data.title}`);
      setTitle('');
      setScheduledFor('');
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

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Link copied to clipboard");
  }

  // Map meetings to Calendar Events
  const calendarEvents = (meetings || []).map((m: any) => {
    const settings = m.settings ? JSON.parse(m.settings) : {};
    return {
      id: m.id,
      title: m.title,
      date: settings.scheduledFor ? settings.scheduledFor.split('T')[0] : m.created_at.split('T')[0],
      description: settings.type === 'external' ? 'External Meeting' : 'Internal Meeting'
    };
  });

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
      
      {/* Calendar View */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-500" />
          Schedule Calendar
        </h3>
        <MonthlyCalendar events={calendarEvents} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Create Meeting Form */}
        <div className="xl:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-y-auto max-h-[800px]">
          <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
            <Plus className="h-5 w-5 text-indigo-500" />
            Schedule Meeting
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
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Scheduled For (Optional)</label>
              <Input 
                type="datetime-local"
                value={scheduledFor} 
                onChange={e => setScheduledFor(e.target.value)} 
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Type</label>
                <Select value={type} onValueChange={(val: any) => setType(val)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal (Strict)</SelectItem>
                    <SelectItem value="external">External (Public)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Max Users</label>
                <Input 
                  type="number" min={2} max={40}
                  value={maxParticipants} 
                  onChange={e => setMaxParticipants(Number(e.target.value))} 
                  className="mt-1" required
                />
              </div>
            </div>

            {type === "internal" ? (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Allowed Intern Emails (Comma separated)</label>
                <Textarea 
                  value={allowedEmails} 
                  onChange={e => setAllowedEmails(e.target.value)} 
                  placeholder="Leave blank to allow all internals, or restrict to specific emails."
                  className="mt-1 min-h-[60px]"
                />
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Meeting Password (Required for External)</label>
                <Input 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="Enter a secure pin or password"
                  className="mt-1"
                  required
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Super Hosts (Emails)</label>
              <Input 
                value={superHosts} 
                onChange={e => setSuperHosts(e.target.value)} 
                placeholder="admin@vynexa.com"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Hosts (Emails)</label>
              <Input 
                value={hosts} 
                onChange={e => setHosts(e.target.value)} 
                placeholder="mentor@vynexa.com"
                className="mt-1"
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
        <div className="xl:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Video className="h-5 w-5 text-emerald-500" />
            Live & Scheduled Rooms
          </h3>
          
          {isLoading ? (
            <div className="p-8 text-center text-slate-500"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" /> Loading rooms...</div>
          ) : !meetings?.length ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <Lock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No scheduled meeting rooms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {meetings.map((room: any) => {
                const settings = room.settings ? JSON.parse(room.settings) : {};
                const meetUrl = `${window.location.origin}/meet/${room.id}`;
                
                return (
                  <div key={room.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 justify-between">
                        <h4 className="font-semibold text-lg text-slate-800 dark:text-white">{room.title}</h4>
                        <Badge variant="outline" className={settings.type === 'external' ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"}>
                          {settings.type === 'external' ? 'External' : 'Internal'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Max {room.max_participants}</span>
                        {settings.scheduledFor && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Scheduled: {new Date(settings.scheduledFor).toLocaleString()}</span>}
                        <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> E2EE</span>
                      </div>
                      
                      {settings.type === 'external' && settings.password && (
                        <div className="text-xs mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded border border-amber-200 dark:border-amber-800/50 flex items-center justify-between">
                          <span>Password: <strong className="font-mono">{settings.password}</strong></span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(settings.password)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <Button variant="secondary" size="sm" onClick={() => copyToClipboard(meetUrl)} className="gap-2">
                        <Copy className="h-4 w-4" /> Copy Link
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => window.open(`/meet/${room.id}`, '_blank')} className="gap-2 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                        <Video className="h-4 w-4" /> Join 
                      </Button>
                      <div className="flex-1"></div>
                      <Button variant="destructive" size="sm" onClick={() => endMut.mutate(room.id)} disabled={endMut.isPending} className="gap-2">
                        <Trash2 className="h-4 w-4" />
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
