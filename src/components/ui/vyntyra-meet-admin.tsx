import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createMeetingRoomFn, getActiveMeetingsFn, endMeetingFn } from "@/lib/meetings.functions";
import { listCbtTargetsFn } from "@/lib/cbt.functions";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Shield, Video, Plus, Lock, Users, Clock, Trash2, Copy, Calendar, Edit, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const fetchMeetings = async () => await getActiveMeetingsFn();
const createMeeting = async (opts: any) => await createMeetingRoomFn(opts);
const endMeeting = async (opts: any) => await endMeetingFn(opts);

export function VyntyraMeetAdmin({ role = 'admin' }: { role?: 'admin' | 'super_admin' | 'employee' | 'intern' }) {
  const qc = useQueryClient();
  const getTargets = useServerFn(listCbtTargetsFn);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(40);
  const [muteOnEntry, setMuteOnEntry] = useState(false);
  const [disableCameras, setDisableCameras] = useState(false);
  
  const [type, setType] = useState<"internal"|"external">("internal");
  const [password, setPassword] = useState("");
  const [superHosts, setSuperHosts] = useState("");
  const [hosts, setHosts] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");

  const [targetType, setTargetType] = useState<"all"|"team"|"intern">("all");
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedInterns, setSelectedInterns] = useState<string[]>([]);

  const { data: meetings, isLoading } = useQuery({
    queryKey: ["vyntyra-meet-rooms"],
    queryFn: fetchMeetings,
    refetchInterval: 5000 
  });
  
  const { data: targets, isLoading: targetsLoading } = useQuery({
    queryKey: ["cbt-targets"],
    queryFn: () => getTargets()
  });

  const endMut = useMutation({
    mutationFn: async (id: string) => await endMeeting({ data: { roomId: id } }),
    onSuccess: () => {
      toast.success("Meeting ended manually");
      qc.invalidateQueries({ queryKey: ["vyntyra-meet-rooms"] });
    }
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
            scheduledFor,
            type,
            password: type === 'external' ? password : '',
            superHosts: superHosts,
            hosts: hosts,
            target_type: targetType,
            target_teams: targetType === 'team' ? selectedTeams : [],
            target_interns: targetType === 'intern' ? selectedInterns : []
          }
        }
      });
    },
    onSuccess: (data) => {
      toast.success(`Meeting room created: ${data.title}`);
      setTitle('');
      setScheduledFor('');
      setIsCreateOpen(false);
      qc.invalidateQueries({ queryKey: ["vyntyra-meet-rooms"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create meeting");
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copied to clipboard");
  };

  const personalRoom = meetings?.find((m: any) => m.title === "Personal Meeting Room");

  return (
    <div className="w-full flex justify-center py-8">
      <div className="max-w-[1000px] w-full px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Video className="h-8 w-8 text-[#0b5cff]" />
              Vyntyra Meet
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Enterprise-grade secure video conferencing</p>
          </div>
          
          {role !== 'intern' && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#0b5cff] hover:bg-[#094bdd] text-white shadow-sm gap-2">
                  <Plus className="h-4 w-4" /> Schedule Meeting
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Schedule a Meeting</DialogTitle>
                </DialogHeader>
                <form onSubmit={e => { e.preventDefault(); createMut.mutate(); }} className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Meeting Topic</label>
                    <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Weekly All-Hands" className="mt-1" />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Security Type</label>
                    <Select value={type} onValueChange={(val: any) => setType(val)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">Internal (Authenticated Employee/Interns only)</SelectItem>
                        <SelectItem value="external">External (Public Link with Password)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {type === 'internal' ? (
                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Target Audience</label>
                        <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Company</SelectItem>
                            <SelectItem value="team">Specific Teams</SelectItem>
                            <SelectItem value="intern">Specific Interns</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {targetType === 'team' && (
                        <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-md p-3 max-h-32 overflow-y-auto">
                           {targetsLoading ? <Loader2 className="h-4 w-4 animate-spin text-slate-500" /> : targets?.teams.map((t: any) => (
                             <div key={t.id} className="flex items-center gap-2">
                                <input 
                                  type="checkbox"
                                  checked={selectedTeams.includes(t.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedTeams([...selectedTeams, t.id]);
                                    else setSelectedTeams(selectedTeams.filter(id => id !== t.id));
                                  }}
                                />
                                <label className="text-sm">{t.name}</label>
                             </div>
                           ))}
                        </div>
                      )}

                      {targetType === 'intern' && (
                        <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-md p-3 max-h-32 overflow-y-auto">
                           {targetsLoading ? <Loader2 className="h-4 w-4 animate-spin text-slate-500" /> : targets?.interns.map((i: any) => (
                             <div key={i.id} className="flex items-center gap-2">
                                <input 
                                  type="checkbox"
                                  checked={selectedInterns.includes(i.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedInterns([...selectedInterns, i.id]);
                                    else setSelectedInterns(selectedInterns.filter(id => id !== i.id));
                                  }}
                                />
                                <label className="text-sm">{i.full_name} ({i.email})</label>
                             </div>
                           ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Meeting Password</label>
                      <Input value={password} onChange={e => setPassword(e.target.value)} required placeholder="Password required for guests" className="mt-1" />
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Super Hosts (Emails)</label>
                    <Textarea value={superHosts} onChange={e => setSuperHosts(e.target.value)} placeholder="Comma separated..." className="mt-1" />
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
                  <Button type="submit" disabled={createMut.isPending} className="w-full mt-4 bg-[#0b5cff] hover:bg-[#094bdd] text-white">
                    {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Generate Secure Room
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Tabs defaultValue={role === 'admin' ? "global" : "upcoming"} className="w-full">
          <TabsList className="bg-transparent border-b border-slate-200 dark:border-slate-800 w-full justify-start rounded-none h-12 gap-8 mb-8 overflow-x-auto">
            {role === 'admin' && (
              <TabsTrigger value="global" className="text-[15px] data-[state=active]:border-b-2 data-[state=active]:border-[#0b5cff] data-[state=active]:text-[#0b5cff] text-slate-500 rounded-none px-0 bg-transparent shadow-none hover:text-slate-800 transition-colors">Global Overview</TabsTrigger>
            )}
            <TabsTrigger value="upcoming" className="text-[15px] data-[state=active]:border-b-2 data-[state=active]:border-[#0b5cff] data-[state=active]:text-[#0b5cff] text-slate-500 rounded-none px-0 bg-transparent shadow-none hover:text-slate-800 transition-colors">Upcoming</TabsTrigger>
            {role !== 'intern' && (
              <TabsTrigger value="personal" className="text-[15px] data-[state=active]:border-b-2 data-[state=active]:border-[#0b5cff] data-[state=active]:text-[#0b5cff] text-slate-500 rounded-none px-0 bg-transparent shadow-none hover:text-slate-800 transition-colors">Personal Room</TabsTrigger>
            )}
          </TabsList>

          {role === 'admin' && (
            <TabsContent value="global" className="mt-0 outline-none space-y-6 pb-24">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                  <div className="text-sm text-slate-500 font-medium">Total Active Rooms</div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{meetings?.length || 0}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                  <div className="text-sm text-slate-500 font-medium">Peak Participant Count</div>
                  <div className="text-3xl font-bold text-emerald-600 mt-1">1,248</div>
                  <div className="text-xs text-emerald-500 mt-1">+14% from last week</div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                  <div className="text-sm text-slate-500 font-medium">Data Bandwidth (7d)</div>
                  <div className="text-3xl font-bold text-indigo-600 mt-1">842 GB</div>
                  <div className="text-xs text-indigo-500 mt-1">Cloudflare WebRTC</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 dark:text-white">Global Meeting Audit Log</h3>
                  <Badge variant="outline" className="text-xs">Live Sync</Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Meeting Title</th>
                        <th className="px-4 py-3">Host / Creator</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Target</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {isLoading ? (
                        <tr><td colSpan={6} className="text-center py-8 text-slate-500">Loading metrics...</td></tr>
                      ) : !meetings?.length ? (
                        <tr><td colSpan={6} className="text-center py-8 text-slate-500">No active meetings across the organization.</td></tr>
                      ) : meetings.map((room: any) => {
                        const settings = room.settings ? JSON.parse(room.settings) : {};
                        return (
                          <tr key={room.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200">
                              {room.title}
                              <div className="text-xs text-slate-500 font-mono mt-0.5">{room.id.substring(0, 12)}...</div>
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                              {room.host_id?.substring(0, 8)}...
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={settings.type === 'external' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                                {settings.type === 'external' ? 'External' : 'Internal'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                              <span className="capitalize">{settings.target_type || 'all'}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Active
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button variant="ghost" size="sm" onClick={() => endMut.mutate(room.id)} disabled={endMut.isPending} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                Terminate
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          )}

          {role !== 'intern' && (
            <TabsContent value="personal" className="mt-0 outline-none pb-24">
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                <h2 className="text-[22px] font-semibold text-slate-900 dark:text-white">Personal Meeting Room</h2>
                <div className="grid grid-cols-[140px_1fr] md:grid-cols-[240px_1fr] gap-4 md:gap-8 items-start py-4 border-b border-slate-100 dark:border-slate-800/60 mt-6">
                  <span className="text-[14px] text-slate-500 dark:text-slate-400">Meeting ID</span>
                  <div className="text-[14px] text-slate-800 dark:text-slate-200 font-mono">
                    *** *** **** <Button variant="link" className="h-auto p-0 px-2 text-[#0b5cff]">Show</Button>
                  </div>
                </div>
                <div className="grid grid-cols-[140px_1fr] md:grid-cols-[240px_1fr] gap-4 md:gap-8 items-start py-4 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-[14px] text-slate-500 dark:text-slate-400">Invite Link</span>
                  <div className="text-[14px] text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded">
                        {personalRoom ? `https://vyntyra.com/meet/${personalRoom.id}` : 'https://vyntyra.com/meet/demo-1234'}
                      </span>
                      <button onClick={() => copyToClipboard(personalRoom ? `https://vyntyra.com/meet/${personalRoom.id}` : 'https://vyntyra.com/meet/demo-1234')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Button onClick={() => window.open(`/meet/${personalRoom ? personalRoom.id : 'zoom-demo'}`, '_blank')} className="bg-[#0b5cff] hover:bg-[#094bdd] text-white px-8 rounded-md">
                    Start
                  </Button>
                  <Button variant="outline" className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 bg-transparent rounded-md gap-2" onClick={() => copyToClipboard(personalRoom ? `https://vyntyra.com/meet/${personalRoom.id}` : 'https://vyntyra.com/meet/demo-1234')}>
                    <Copy className="h-4 w-4" /> Copy Invitation
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}

          <TabsContent value="upcoming" className="mt-0 outline-none pb-24">
            <div className="space-y-4">
              {isLoading ? (
                <div className="py-12 text-center text-slate-500"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" /> Loading rooms...</div>
              ) : !meetings?.length ? (
                <div className="py-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
                  <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No upcoming meetings.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/60">
                  {meetings.map((room: any) => {
                    const settings = room.settings ? JSON.parse(room.settings) : {};
                    const meetUrl = `${window.location.origin}/meet/${room.id}`;
                    
                    return (
                      <div key={room.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h4 className="font-semibold text-[15px] text-[#0b5cff] hover:underline cursor-pointer">{room.title}</h4>
                          <div className="flex flex-wrap items-center gap-3 text-[13px] text-slate-500 mt-1.5">
                            <span className="font-mono text-slate-600 dark:text-slate-400">ID: {room.id.substring(0,18)}...</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {settings.type === 'external' ? 'External' : 'Internal'}
                            </span>
                            {settings.scheduledFor && <span>Scheduled: {new Date(settings.scheduledFor).toLocaleString()}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={() => window.open(`/meet/${room.id}`, '_blank')} className="bg-[#0b5cff] hover:bg-[#094bdd] text-white rounded">
                            {role === 'intern' ? 'Join Live' : 'Start'}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => copyToClipboard(meetUrl)} className="rounded text-slate-600 border-slate-300">
                            Copy Link
                          </Button>
                          {role !== 'intern' && (
                             <Button variant="ghost" size="sm" onClick={() => endMut.mutate(room.id)} disabled={endMut.isPending} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                Delete
                             </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
          
        </Tabs>
      </div>
    </div>
  );
}
