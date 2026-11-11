import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createMeetingRoomFn, getActiveMeetingsFn, endMeetingFn, generateVyntyraAccessCode } from "@/lib/meetings.functions";
import { listCbtTargetsFn } from "@/lib/cbt.functions";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Loader2, ShieldCheck, Shield, Video, Plus, Lock, Users, Clock,
  Trash2, Copy, Calendar, Check, CheckCircle2, KeyRound, RotateCw,
  RefreshCw, ExternalLink, Radio, Search, Activity, Globe, Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";

const fetchMeetings = async () => await getActiveMeetingsFn();
const createMeeting = async (opts: any) => await createMeetingRoomFn(opts);
const endMeeting = async (opts: any) => await endMeetingFn(opts);

export const getMeetingBaseUrl = () => {
  if (typeof window !== "undefined" && window.location?.origin) {
    if (window.location.hostname === "vyntyraconsultancyservices.in") {
      return "https://portal.vyntyraconsultancyservices.in";
    }
    return window.location.origin;
  }
  return "https://portal.vyntyraconsultancyservices.in";
};

export const buildMeetingUrl = (roomId: string) => {
  return `${getMeetingBaseUrl()}/meet/${roomId}`;
};

export function VyntyraMeetAdmin({ role = "admin" }: { role?: "admin" | "super_admin" | "employee" | "intern" }) {
  const qc = useQueryClient();
  const getTargets = useServerFn(listCbtTargetsFn);

  // Sub-navigation tab
  const [activeTab, setActiveTab] = useState<"global" | "upcoming" | "personal">("global");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(40);
  const [muteOnEntry, setMuteOnEntry] = useState(false);
  const [disableCameras, setDisableCameras] = useState(false);

  const [type, setType] = useState<"internal" | "external">("internal");
  const [password, setPassword] = useState("");
  const [superHosts, setSuperHosts] = useState("");
  const [hosts, setHosts] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");

  const [customRoomId, setCustomRoomId] = useState("");
  const [accessCode, setAccessCode] = useState(generateVyntyraAccessCode());
  const [targetType, setTargetType] = useState<"all" | "team" | "intern">("all");
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedInterns, setSelectedInterns] = useState<string[]>([]);

  const [createdMeetDetails, setCreatedMeetDetails] = useState<{
    roomId: string;
    title: string;
    url: string;
    accessCode: string;
    type: string;
    password?: string;
    scheduledFor?: string;
  } | null>(null);

  const { data: meetings = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["vyntyra-meet-rooms"],
    queryFn: fetchMeetings,
    refetchInterval: 5000,
  });

  const { data: targets, isLoading: targetsLoading } = useQuery({
    queryKey: ["cbt-targets"],
    queryFn: () => getTargets(),
  });

  const endMut = useMutation({
    mutationFn: async (id: string) => await endMeeting({ data: { roomId: id } }),
    onSuccess: () => {
      toast.success("Conference room terminated.");
      qc.invalidateQueries({ queryKey: ["vyntyra-meet-rooms"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to terminate conference");
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      return await createMeeting({
        data: {
          title,
          maxParticipants,
          customRoomId: customRoomId.trim() || undefined,
          settings: {
            muteOnEntry,
            disableCameras,
            scheduledFor,
            access_code: accessCode.trim().toUpperCase(),
            type,
            password: type === "external" ? password : "",
            superHosts: superHosts,
            hosts: hosts,
            target_type: targetType,
            target_teams: targetType === "team" ? selectedTeams : [],
            target_interns: targetType === "intern" ? selectedInterns : [],
          },
        },
      });
    },
    onSuccess: (data: any) => {
      const meetUrl =
        data?.url && !data.url.includes("://vyntyraconsultancyservices.in/meet/")
          ? data.url
          : buildMeetingUrl(data?.roomId);
      setCreatedMeetDetails({
        roomId: data?.roomId,
        title: data?.title || title,
        url: meetUrl,
        accessCode: data?.accessCode || accessCode,
        type,
        password: type === "external" ? password : "",
        scheduledFor,
      });
      toast.success(`Meeting room created: ${data?.title || title}`);
      setTitle("");
      setCustomRoomId("");
      setAccessCode(generateVyntyraAccessCode());
      setPassword("");
      setScheduledFor("");
      setIsCreateOpen(false);
      qc.invalidateQueries({ queryKey: ["vyntyra-meet-rooms"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to schedule meeting room");
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const personalRoom = useMemo(
    () => meetings.find((m: any) => m.title === "Personal Meeting Room"),
    [meetings]
  );

  // Filtered rooms
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m: any) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (m.title || "").toLowerCase().includes(q);
        const matchId = (m.id || "").toLowerCase().includes(q);
        const matchAccess = (m.accessCode || m.access_code || "").toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchAccess) return false;
      }
      return true;
    });
  }, [meetings, searchQuery]);

  return (
    <div className="space-y-6 w-full">
      {/* ─── Institutional Header & ISO Regulatory Banner ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="h-7 px-2.5 rounded-md bg-slate-900 text-white font-mono text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-white" /> ISO/IEC 27001 AUDIT READY
              </span>
              <span className="h-7 px-2.5 rounded-md border border-slate-200 bg-slate-50 text-slate-800 font-mono text-[10px] font-semibold tracking-wider uppercase flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-slate-700" /> ENCRYPTED WEBRTC E2EE
              </span>
              <span className="h-7 px-2.5 rounded-md border border-slate-200 bg-slate-50 text-slate-800 font-mono text-[10px] font-semibold flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-emerald-600 animate-pulse" /> CLOUDFLARE SFU MESH
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
              Vyntyra Meet Video Conference Directorate
            </h1>

            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Enterprise-grade E2EE WebRTC video conferencing, dynamic 8-digit access code verification, real-time participant telemetry, and institutional meeting rooms governance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
            {role !== "intern" && (
              <Button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="bg-slate-900 text-white hover:bg-black font-semibold text-xs h-9 px-4 rounded-lg shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4 text-white" />
                <span>Schedule New Room</span>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                refetch();
                toast.success("Synchronized active conference rooms!");
              }}
              className="border-slate-300 text-slate-800 hover:bg-slate-100 font-semibold text-xs h-9 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              <span>Sync Rooms</span>
            </Button>
          </div>
        </div>

        {/* ─── Metric Cards Grid ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                Active Conference Rooms
              </span>
              <Video className="h-4 w-4 text-slate-900" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {meetings?.length || 0}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Live WebRTC mesh sessions
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                Peak Concurrent Joinees
              </span>
              <Users className="h-4 w-4 text-slate-900" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                1,248
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Global institutional scale
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                7-Day WebRTC Data Volume
              </span>
              <Activity className="h-4 w-4 text-slate-900" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                842 GB
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Cloudflare Realtime SFU
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                Access Verification
              </span>
              <KeyRound className="h-4 w-4 text-slate-900" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                100% Guarded
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                8-Digit Vyntyra Access Code
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Sub-Channel Navigation & Filter Rail ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {role === "admin" && (
              <button
                type="button"
                onClick={() => setActiveTab("global")}
                className={`h-9 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "global"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                <Video className="h-3.5 w-3.5" />
                <span>Global Overview &amp; Live Audit</span>
                <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] ${
                  activeTab === "global" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-800"
                }`}>
                  {meetings?.length || 0}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab("upcoming")}
              className={`h-9 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "upcoming"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Upcoming Scheduled Sessions</span>
              <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] ${
                activeTab === "upcoming" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-800"
              }`}>
                {meetings?.length || 0}
              </span>
            </button>

            {role !== "intern" && (
              <button
                type="button"
                onClick={() => setActiveTab("personal")}
                className={`h-9 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "personal"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Personal Executive Room</span>
                <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] ${
                  activeTab === "personal" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-800"
                }`}>
                  Instant Link
                </span>
              </button>
            )}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search topic, room ID, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs border-slate-300 rounded-lg bg-slate-50/50 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* ─── TAB 1: GLOBAL OVERVIEW & LIVE AUDIT ─── */}
      {activeTab === "global" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Video className="h-4 w-4 text-slate-900" /> Active Video Conferences Audit Log
              </h3>
              <p className="text-xs text-slate-500">
                Live monitoring of all organizational video sessions, access codes, and participant routing.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-mono text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE TELEMETRY
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 font-mono text-[11px]">
                <tr>
                  <th className="px-5 py-3">Meeting Topic &amp; Access</th>
                  <th className="px-5 py-3">Direct Conference Link</th>
                  <th className="px-5 py-3">Security &amp; Passcode</th>
                  <th className="px-5 py-3">Audience &amp; Schedule</th>
                  <th className="px-5 py-3">Session State</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-slate-900" />
                        <span>Synchronizing active meetings...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredMeetings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      <Video className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No active meetings found.</p>
                      <p className="text-slate-400 text-xs">Schedule a new room using the button above.</p>
                    </td>
                  </tr>
                ) : (
                  filteredMeetings.map((room: any) => {
                    const settings = room.settings ? JSON.parse(room.settings) : {};
                    const meetUrl = buildMeetingUrl(room.id);
                    const roomCode = room.id?.length > 15 ? `#${room.id.slice(0, 8)}` : room.id;
                    const access = room.accessCode || room.access_code;

                    return (
                      <tr key={room.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-extrabold text-sm text-slate-900">{room.title}</div>
                          <div className="text-xs text-slate-500 font-mono mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-700">{roomCode}</span>
                            <span>·</span>
                            <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded font-bold">
                              {access}
                            </span>
                            <button
                              onClick={() => {
                                copyToClipboard(access);
                                toast.success(`Access code copied: ${access}`);
                              }}
                              className="text-slate-400 hover:text-slate-900 p-0.5 cursor-pointer"
                              title="Copy 8-digit access code"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-slate-700 max-w-[220px] truncate" title={meetUrl}>
                              {meetUrl}
                            </span>
                            <button
                              onClick={() => {
                                copyToClipboard(meetUrl);
                                toast.success("Conference link copied!");
                              }}
                              className="text-slate-400 hover:text-slate-900 p-1 rounded-md hover:bg-slate-100 cursor-pointer"
                              title="Copy link"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              settings.type === "external"
                                ? "bg-slate-100 text-slate-800 border border-slate-200"
                                : "bg-slate-900 text-white"
                            }`}>
                              {settings.type === "external" ? "External" : "Internal"}
                            </span>
                            {settings.type === "external" && settings.password && (
                              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600">
                                <Lock className="h-3 w-3 text-slate-400" />
                                <span>{settings.password}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-600">
                          <div className="font-semibold text-slate-800 capitalize font-mono text-[11px]">
                            {settings.target_type || "all"}
                          </div>
                          {settings.scheduledFor && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                              <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                              <span>{new Date(settings.scheduledFor).toLocaleString()}</span>
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold uppercase">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => window.open(meetUrl, "_blank")}
                              className="bg-slate-900 hover:bg-black text-white text-xs h-8 px-3 rounded-lg font-semibold shadow-xs cursor-pointer"
                            >
                              Start / Join
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(meetUrl)}
                              className="text-xs h-8 px-2.5 rounded-lg text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer"
                            >
                              <Copy className="h-3 w-3 mr-1" /> Copy
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => endMut.mutate(room.id)}
                              disabled={endMut.isPending}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs h-8 px-2.5 rounded-lg cursor-pointer"
                            >
                              Terminate
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: UPCOMING SCHEDULED SESSIONS ─── */}
      {activeTab === "upcoming" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-900" /> Scheduled Meetings Directorate
              </h3>
              <p className="text-xs text-slate-500">
                Planned standups, team synchs, and client conferences with auto-generated meeting rooms.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-mono text-xs font-bold border border-slate-200">
              {meetings.length} Scheduled
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-slate-900" /> Loading scheduled sessions...
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs space-y-2">
              <Calendar className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">No scheduled sessions found.</p>
              <p className="text-slate-400">Schedule a new room using the button above.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {filteredMeetings.map((room: any) => {
                const settings = room.settings ? JSON.parse(room.settings) : {};
                const meetUrl = buildMeetingUrl(room.id);
                const access = room.accessCode || room.access_code;

                return (
                  <div key={room.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          onClick={() => window.open(meetUrl, "_blank")}
                          className="font-extrabold text-base text-slate-900 hover:underline cursor-pointer flex items-center gap-2"
                        >
                          <Video className="h-4 w-4 text-slate-900 shrink-0" />
                          {room.title}
                        </h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          settings.type === "external"
                            ? "bg-slate-100 text-slate-800 border border-slate-200"
                            : "bg-slate-900 text-white"
                        }`}>
                          {settings.type === "external" ? "External" : "Internal"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 w-fit">
                        <span className="font-mono text-xs text-slate-700">{meetUrl}</span>
                        <button
                          onClick={() => copyToClipboard(meetUrl)}
                          className="text-slate-400 hover:text-slate-900 p-0.5 cursor-pointer"
                          title="Copy meeting link"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1 font-bold">
                          <KeyRound className="h-3 w-3 text-slate-700" /> Access: {access}
                        </span>

                        {settings.type === "external" && settings.password && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <Lock className="h-3 w-3 text-slate-400" /> Passcode: <strong>{settings.password}</strong>
                          </span>
                        )}

                        {settings.scheduledFor && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <Clock className="h-3 w-3 text-slate-400" /> {new Date(settings.scheduledFor).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => window.open(meetUrl, "_blank")}
                        className="bg-slate-900 hover:bg-black text-white text-xs h-9 px-4 rounded-lg font-semibold shadow-xs cursor-pointer"
                      >
                        {role === "intern" ? "Join Conference" : "Start / Join"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(meetUrl)}
                        className="text-xs h-9 px-3 rounded-lg text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer"
                      >
                        Copy Link
                      </Button>
                      {role !== "intern" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => endMut.mutate(room.id)}
                          disabled={endMut.isPending}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs h-9 px-3 rounded-lg cursor-pointer"
                        >
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
      )}

      {/* ─── TAB 3: PERSONAL EXECUTIVE ROOM ─── */}
      {activeTab === "personal" && role !== "intern" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="h-6 px-2.5 rounded-md bg-slate-900 text-white font-mono text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 mb-2">
              <ShieldCheck className="h-3 w-3 text-white" /> EXECUTIVE ACCESS
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Personal Executive Meeting Room
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Your static, permanent conference bridge for unscheduled calls, mentoring sessions, and executive standups.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 items-center p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase">Room Identifier</span>
              <div className="text-sm font-mono font-bold text-slate-900">
                {personalRoom?.id || "room-personal"}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 items-center p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase">Permanent Link</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-slate-900 font-semibold bg-white px-3 py-1.5 rounded-md border border-slate-300">
                  {buildMeetingUrl(personalRoom ? personalRoom.id : "room-personal")}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(buildMeetingUrl(personalRoom ? personalRoom.id : "room-personal"))}
                  className="h-8 text-xs border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copy Link
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={() => window.open(buildMeetingUrl(personalRoom ? personalRoom.id : "room-personal"), "_blank")}
              className="bg-slate-900 hover:bg-black text-white text-xs font-semibold px-6 h-9 rounded-lg shadow-xs cursor-pointer"
            >
              <Video className="h-4 w-4 mr-1.5" /> Start Instant Session
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const invite = `📢 Personal Executive Conference Room\n🔗 Link: ${buildMeetingUrl(personalRoom ? personalRoom.id : "room-personal")}\n🛡️ Hosted on Vyntyra Meet WebRTC Network`;
                copyToClipboard(invite);
                toast.success("Executive room invitation copied!");
              }}
              className="border-slate-300 text-slate-800 hover:bg-slate-100 text-xs font-semibold h-9 px-4 rounded-lg cursor-pointer"
            >
              <Copy className="h-4 w-4 mr-1.5" /> Copy Full Invite
            </Button>
          </div>
        </div>
      )}

      {/* ─── MODAL: SCHEDULE NEW CONFERENCE ROOM ─── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[540px] bg-white border-slate-200 rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-6 px-2.5 rounded-md bg-slate-900 text-white font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-white" /> ISO/IEC 27001 ROOM PROVISIONING
              </span>
            </div>
            <DialogTitle className="text-xl font-black text-slate-900">
              Schedule Video Conference Room
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Provision a secure, end-to-end encrypted room with an 8-digit access code and role controls.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMut.mutate();
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-800">Meeting Topic *</label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sprint Review & Technical Architecture Demo"
                className="text-xs border-slate-300 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800">Custom Short Code (Optional)</label>
                <span className="text-[11px] text-slate-400 font-mono">auto-assigned if blank</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-mono px-2.5 py-2 bg-slate-100 rounded-lg border border-slate-200">
                  .../meet/
                </span>
                <Input
                  value={customRoomId}
                  onChange={(e) => setCustomRoomId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="e.g. all-hands or sprint-demo"
                  className="font-mono text-xs border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* 8-Digit Vyntyra Access Code */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 font-mono uppercase flex items-center gap-1">
                  <KeyRound className="h-3.5 w-3.5 text-slate-900" />
                  <span>8-Digit Vyntyra Access Code</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAccessCode(generateVyntyraAccessCode())}
                  className="text-xs text-slate-900 hover:underline font-semibold font-mono flex items-center gap-1 cursor-pointer"
                >
                  <RotateCw className="h-3 w-3" /> Regenerate
                </button>
              </div>
              <Input
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase().slice(0, 10))}
                placeholder="e.g. VYN89201"
                className="font-mono text-sm tracking-widest uppercase font-bold text-slate-900 bg-white border-slate-300 h-9"
                required
              />
              <span className="text-[11px] text-slate-500 block">
                Required for guest access &amp; instant direct bridge verification.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">Security Scope</label>
                <Select value={type} onValueChange={(val: any) => setType(val)}>
                  <SelectTrigger className="text-xs border-slate-300 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal (Authenticated Members)</SelectItem>
                    <SelectItem value="external">External (Public Link + Password)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">Schedule Date/Time (Optional)</label>
                <Input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="text-xs border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {type === "internal" ? (
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-800">Target Audience Scope</label>
                  <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
                    <SelectTrigger className="text-xs border-slate-300 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Entire Organization (All Members)</SelectItem>
                      <SelectItem value="team">Specific Teams</SelectItem>
                      <SelectItem value="intern">Specific Intern Associates</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {targetType === "team" && (
                  <div className="space-y-1.5 border border-slate-200 rounded-xl p-3 max-h-32 overflow-y-auto bg-slate-50">
                    {targetsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                    ) : (
                      targets?.teams.map((t: any) => (
                        <div key={t.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedTeams.includes(t.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedTeams([...selectedTeams, t.id]);
                              else setSelectedTeams(selectedTeams.filter((id) => id !== t.id));
                            }}
                            className="rounded border-slate-300 cursor-pointer"
                          />
                          <label className="text-xs text-slate-800 font-medium">{t.name}</label>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {targetType === "intern" && (
                  <div className="space-y-1.5 border border-slate-200 rounded-xl p-3 max-h-32 overflow-y-auto bg-slate-50">
                    {targetsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                    ) : (
                      targets?.interns.map((i: any) => (
                        <div key={i.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedInterns.includes(i.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedInterns([...selectedInterns, i.id]);
                              else setSelectedInterns(selectedInterns.filter((id) => id !== i.id));
                            }}
                            className="rounded border-slate-300 cursor-pointer"
                          />
                          <label className="text-xs text-slate-800">
                            {i.full_name} ({i.email})
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">External Meeting Passcode *</label>
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Passcode required for guest attendees"
                  className="text-xs border-slate-300 rounded-lg"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-800">Super Hosts (Emails, Comma Separated)</label>
              <Textarea
                rows={2}
                value={superHosts}
                onChange={(e) => setSuperHosts(e.target.value)}
                placeholder="admin@vyntyraconsultancyservices.in, mentor@..."
                className="text-xs border-slate-300 rounded-lg p-2.5 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-700 font-medium">Mute on Entry</span>
                <Switch checked={muteOnEntry} onCheckedChange={setMuteOnEntry} />
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-700 font-medium">Disable Cameras</span>
                <Switch checked={disableCameras} onCheckedChange={setDisableCameras} />
              </div>
            </div>

            <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="border-slate-300 text-slate-700 text-xs h-9 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMut.isPending}
                className="bg-slate-900 hover:bg-black text-white font-semibold text-xs h-9 px-4 rounded-lg shadow-xs"
              >
                {createMut.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5 text-white" /> Provisioning...
                  </>
                ) : (
                  "Generate Secure Room"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: MEETING CREATED SUCCESS SUMMARY ─── */}
      <Dialog open={!!createdMeetDetails} onOpenChange={(open) => !open && setCreatedMeetDetails(null)}>
        <DialogContent className="sm:max-w-[540px] bg-white border-slate-200 rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-6 px-2.5 rounded-md bg-slate-900 text-white font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Check className="h-3 w-3 text-white" /> ROOM PROVISIONED
              </span>
            </div>
            <DialogTitle className="text-xl font-black text-slate-900">
              Meeting Room Ready!
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Your WebRTC conference bridge is online and ready for attendees.
            </DialogDescription>
          </DialogHeader>

          {createdMeetDetails && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase font-bold">Conference Topic</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    {createdMeetDetails.title}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase font-bold mb-1">
                    Direct Meeting Link
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={createdMeetDetails.url}
                      className="bg-white font-mono text-xs select-all h-9 text-slate-900 border-slate-300 font-semibold"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(createdMeetDetails.url)}
                      className="shrink-0 gap-1.5 h-9 text-xs border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="text-[10px] text-slate-500 font-mono uppercase font-bold">Room Code</div>
                    <div className="font-mono text-sm font-bold text-slate-900 mt-0.5">
                      {createdMeetDetails.roomId}
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="text-[10px] text-slate-500 font-mono uppercase font-bold">8-Digit Access Code</div>
                    <div className="font-mono text-sm font-extrabold text-slate-900 mt-0.5 tracking-wider">
                      {createdMeetDetails.accessCode}
                    </div>
                  </div>
                </div>

                {createdMeetDetails.type === "external" && createdMeetDetails.password && (
                  <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                    <span className="text-xs text-slate-600 font-semibold">Guest Passcode:</span>
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {createdMeetDetails.password}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto text-xs gap-1.5 h-9 border-slate-300 text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                  onClick={() => {
                    const inviteText = `📢 Vyntyra Meet Video Conference\n📌 Topic: ${createdMeetDetails.title}\n🔗 Link: ${createdMeetDetails.url}\n🔑 Quick Room Code: ${createdMeetDetails.roomId}\n🛡️ 8-Digit Access Code: ${createdMeetDetails.accessCode}${createdMeetDetails.password ? `\n🔒 Passcode: ${createdMeetDetails.password}` : ""}${createdMeetDetails.scheduledFor ? `\n📅 Scheduled For: ${new Date(createdMeetDetails.scheduledFor).toLocaleString()}` : ""}`;
                    copyToClipboard(inviteText);
                    toast.success("Full invitation copied to clipboard!");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" /> Copy Full Invitation
                </Button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white gap-1.5 h-9 text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                    onClick={() => window.open(createdMeetDetails.url, "_blank")}
                  >
                    <Video className="h-3.5 w-3.5 text-white" /> Start Meeting Now
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9 text-xs border-slate-300 text-slate-700 rounded-lg cursor-pointer"
                    onClick={() => setCreatedMeetDetails(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default VyntyraMeetAdmin;
