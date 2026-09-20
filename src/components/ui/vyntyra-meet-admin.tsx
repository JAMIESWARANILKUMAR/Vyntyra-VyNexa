import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createMeetingRoomFn, getActiveMeetingsFn, endMeetingFn } from "@/lib/meetings.functions";
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

export function VyntyraMeetAdmin() {
  const qc = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(40);
  const [muteOnEntry, setMuteOnEntry] = useState(false);
  const [disableCameras, setDisableCameras] = useState(false);
  
  const [type, setType] = useState<"internal"|"external">("internal");
  const [allowedEmails, setAllowedEmails] = useState("");
  const [password, setPassword] = useState("");
  const [superHosts, setSuperHosts] = useState("");
  const [hosts, setHosts] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");

  const { data: meetings, isLoading } = useQuery({
    queryKey: ["vyntyra-meet-rooms"],
    queryFn: fetchMeetings,
    refetchInterval: 5000 
  });

  const createMut = useMutation({
    mutationFn: async () => {
      return await createMeeting({
        data: {
          title,
          maxParticipants,
          type,
          allowedEmails: allowedEmails.split(",").map(e => e.trim()).filter(Boolean),
          password,
          superHosts: superHosts.split(",").map(e => e.trim()).filter(Boolean),
          hosts: hosts.split(",").map(e => e.trim()).filter(Boolean),
          settings: { muteOnEntry, disableCameras, scheduledFor }
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

  const personalRoom = meetings?.find((m: any) => {
    const s = m.settings ? JSON.parse(m.settings) : {};
    return s.type === 'internal';
  }) || meetings?.[0];

  return (
    <div className="bg-white dark:bg-slate-950 min-h-[calc(100vh-4rem)] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Meetings</h1>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#0b5cff] hover:bg-[#094bdd] text-white rounded-md shadow-sm px-4">
                <Plus className="h-4 w-4 mr-2" /> Schedule a Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Schedule a Meeting</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
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
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Allowed Intern Emails</label>
                    <Textarea 
                      value={allowedEmails} 
                      onChange={e => setAllowedEmails(e.target.value)} 
                      placeholder="Comma separated"
                      className="mt-1"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Meeting Password</label>
                    <Input 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      placeholder="Required for External"
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
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Hosts (Emails)</label>
                  <Input 
                    value={hosts} 
                    onChange={e => setHosts(e.target.value)} 
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
                  className="w-full mt-4 bg-[#0b5cff] hover:bg-[#094bdd] text-white"
                >
                  {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Generate Secure Room
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs layout exactly like the image */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="bg-transparent border-b border-slate-200 dark:border-slate-800 w-full justify-start rounded-none h-12 gap-8 mb-8 overflow-x-auto">
            <TabsTrigger value="upcoming" className="text-[15px] data-[state=active]:border-b-2 data-[state=active]:border-[#0b5cff] data-[state=active]:text-[#0b5cff] text-slate-500 rounded-none px-0 bg-transparent shadow-none hover:text-slate-800 transition-colors">Upcoming</TabsTrigger>
            <TabsTrigger value="previous" className="text-[15px] data-[state=active]:border-b-2 data-[state=active]:border-[#0b5cff] data-[state=active]:text-[#0b5cff] text-slate-500 rounded-none px-0 bg-transparent shadow-none hover:text-slate-800 transition-colors">Previous</TabsTrigger>
            <TabsTrigger value="personal" className="text-[15px] data-[state=active]:border-b-2 data-[state=active]:border-[#0b5cff] data-[state=active]:text-[#0b5cff] text-slate-500 rounded-none px-0 bg-transparent shadow-none hover:text-slate-800 transition-colors">Personal Room</TabsTrigger>
            <TabsTrigger value="templates" className="text-[15px] data-[state=active]:border-b-2 data-[state=active]:border-[#0b5cff] data-[state=active]:text-[#0b5cff] text-slate-500 rounded-none px-0 bg-transparent shadow-none hover:text-slate-800 transition-colors">Meeting Templates</TabsTrigger>
            <TabsTrigger value="agendas" className="text-[15px] data-[state=active]:border-b-2 data-[state=active]:border-[#0b5cff] data-[state=active]:text-[#0b5cff] text-slate-500 rounded-none px-0 bg-transparent shadow-none hover:text-slate-800 transition-colors">Meeting Agendas</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-0 outline-none">
            {/* The exact layout from the image */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-0 md:p-6 pb-24">
              
              <div className="grid grid-cols-[140px_1fr] md:grid-cols-[240px_1fr] gap-4 md:gap-8 items-start py-4 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-[14px] text-slate-500 dark:text-slate-400">Topic</span>
                <span className="text-[15px] text-slate-800 dark:text-slate-200">JAMI ESWAR ANIL KUMAR's Personal Meeting Room</span>
              </div>
              
              <div className="grid grid-cols-[140px_1fr] md:grid-cols-[240px_1fr] gap-4 md:gap-8 items-start py-4 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-[14px] text-slate-500 dark:text-slate-400">Meeting ID</span>
                <span className="text-[15px] text-slate-800 dark:text-slate-200 font-mono tracking-wide">
                  {personalRoom ? personalRoom.id.substring(0,25) : '233 828 4128'}
                </span>
              </div>

              <div className="grid grid-cols-[140px_1fr] md:grid-cols-[240px_1fr] gap-4 md:gap-8 items-start py-4 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-[14px] text-slate-500 dark:text-slate-400">Security</span>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[14px] text-slate-800 dark:text-slate-200">
                    <Check className="h-3.5 w-3.5 text-slate-400" /> Passcode <span className="text-slate-400 mx-1">********</span> 
                    <button className="text-[#0b5cff] hover:underline cursor-pointer">Show</button>
                  </div>
                  <div className="flex items-center gap-2 text-[14px] text-slate-800 dark:text-slate-200">
                    <Check className="h-3.5 w-3.5 text-slate-400" /> Everyone goes into the waiting room
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] md:grid-cols-[240px_1fr] gap-4 md:gap-8 items-start py-4 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">Invite Link</span>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] text-[#0b5cff] break-all">
                      {personalRoom ? `https://vyntyra.com/meet/${personalRoom.id}` : 'https://us05web.zoom.us/j/2338284128?pwd=uJuDVWgHJARgDw4nQKaNcu9uAyccz1.1'}
                    </span>
                    <button onClick={() => copyToClipboard(personalRoom ? `https://vyntyra.com/meet/${personalRoom.id}` : 'https://us05web.zoom.us/j/2338284128?pwd=uJuDVWgHJARgDw4nQKaNcu9uAyccz1.1')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] md:grid-cols-[240px_1fr] gap-4 md:gap-8 items-start py-4 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-[14px] text-slate-500 dark:text-slate-400">Add to</span>
                <div className="flex flex-wrap items-center gap-6 text-[14px] text-[#0b5cff]">
                  <span className="flex items-center gap-1.5 cursor-pointer hover:underline"><span className="text-blue-500 border border-blue-500 rounded-sm text-[10px] px-1 font-bold">31</span> Google Calendar</span>
                  <span className="flex items-center gap-1.5 cursor-pointer hover:underline"><span className="text-blue-600 bg-blue-100 rounded-sm text-[10px] px-1 font-bold">o</span> Outlook Calendar (.ics)</span>
                  <span className="flex items-center gap-1.5 cursor-pointer hover:underline"><span className="text-purple-600 font-bold italic">Y!</span> Yahoo Calendar</span>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] md:grid-cols-[240px_1fr] gap-4 md:gap-8 items-start py-4 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-[14px] text-slate-500 dark:text-slate-400">Encryption</span>
                <div className="flex items-center gap-2 text-[14px] text-slate-800 dark:text-slate-200">
                  <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center"><Check className="h-3 w-3 text-white" /></div>
                  Enhanced encryption
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] md:grid-cols-[240px_1fr] gap-4 md:gap-8 items-start py-4 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-[14px] text-slate-500 dark:text-slate-400">My Notes</span>
                <div className="text-[14px] text-slate-800 dark:text-slate-200">
                  Allow participants to transcribe meeting with My Notes<br/>
                  <span className="text-slate-500 mt-1 block">All participants</span>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] md:grid-cols-[240px_1fr] gap-4 md:gap-8 items-start py-4 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-[14px] text-slate-500 dark:text-slate-400">Video</span>
                <div className="text-[14px] text-slate-800 dark:text-slate-200 space-y-1">
                  <div className="grid grid-cols-[100px_1fr]"><span>Host</span><span>on</span></div>
                  <div className="grid grid-cols-[100px_1fr]"><span>Participant</span><span>on</span></div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] md:grid-cols-[240px_1fr] gap-4 md:gap-8 items-start py-4">
                <span className="text-[14px] text-slate-500 dark:text-slate-400">Options</span>
                <div className="text-[14px] text-slate-800 dark:text-slate-200">
                  Allow participants to join anytime
                </div>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <Button 
                  onClick={() => window.open(`/meet/${personalRoom ? personalRoom.id : 'zoom-demo'}`, '_blank')} 
                  className="bg-[#0b5cff] hover:bg-[#094bdd] text-white px-8 rounded-md"
                >
                  Start
                </Button>
                <Button variant="outline" className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 bg-transparent rounded-md gap-2" onClick={() => copyToClipboard('Invitation copied')}>
                  <Copy className="h-4 w-4" /> Copy Invitation
                </Button>
                <Button variant="outline" className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 bg-transparent rounded-md">
                  Edit
                </Button>
              </div>

            </div>
          </TabsContent>
          
          <TabsContent value="upcoming" className="mt-0 outline-none">
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
                            Start
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => copyToClipboard(meetUrl)} className="rounded text-slate-600 border-slate-300">
                            Copy Link
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => endMut.mutate(room.id)} disabled={endMut.isPending} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                            Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="previous" className="py-12 text-center text-slate-500">
            No previous meetings found.
          </TabsContent>
          
        </Tabs>
      </div>
    </div>
  );
}
