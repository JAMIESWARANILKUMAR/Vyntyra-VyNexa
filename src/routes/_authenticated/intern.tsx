import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  GraduationCap, ClipboardList, Clock, Mail, Bell, LogOut, Loader2,
  CheckCircle2, Video, CalendarDays, User, BookOpen, Link2, FileText,
  Play, FolderOpen, ExternalLink, RefreshCw, Phone, MapPin, Award,
  ShieldCheck, Download, Upload, Send, Sparkles, Check, HelpCircle,
  Layers, Target, Compass, BookMarked, MessageCircle, FileCheck, DollarSign, Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { RichContentRenderer } from "@/components/rich-content-renderer";
import { MonthlyCalendar } from "@/components/monthly-calendar";
import { MeetingsSection } from "@/components/meetings-section";
import { FloatingAppsPanel } from "@/components/floating-apps-panel";
import { AnalogClock } from "@/components/analog-clock";
import { ProfileAvatar } from "@/components/profile-avatar";
import { 
  listTasks, listMeetings, listSchedules, listAnnouncements, listResources, 
  listNotes, createNote, deleteNote, createFeedback, claimPoolTask,
  listMyStandups, createStandup, listMyDeliverables, createDeliverable,
  listMyAccessRequests, createAccessRequest, getPresignedUrl,
  acceptTask, updateTaskExecution
} from "@/lib/operations.functions";

export const Route = createFileRoute("/_authenticated/intern")({
  head: () => ({ meta: [{ title: "Intern Dashboard — Vyntyra" }] }),
  component: InternDashboard,
});

const TASK_STATUS_STYLES: Record<string, { dot: string; badge: string; label: string }> = {
  pending:     { dot: "bg-amber-400",   badge: "bg-amber-50 text-amber-700 border-amber-200",    label: "Pending" },
  in_progress: { dot: "bg-blue-500",    badge: "bg-blue-50 text-blue-700 border-blue-200",        label: "In Progress" },
  completed:   { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Completed" },
  blocked:     { dot: "bg-red-500",     badge: "bg-red-50 text-red-700 border-red-200",           label: "Blocked" },
};

const RESOURCE_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  document: { icon: <FileText className="h-5 w-5" />,  color: "bg-blue-50 text-blue-600 border-blue-100" },
  video:    { icon: <Play className="h-5 w-5" />,       color: "bg-red-50 text-red-600 border-red-100" },
  link:     { icon: <Link2 className="h-5 w-5" />,      color: "bg-purple-50 text-purple-600 border-purple-100" },
  template: { icon: <FolderOpen className="h-5 w-5" />, color: "bg-amber-50 text-amber-600 border-amber-100" },
  guide:    { icon: <BookOpen className="h-5 w-5" />,   color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
};

function InternDashboard() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "onboarding" | "lms" | "kanban" | "standups" | "deliverables" | "ppo" | "tasks" | "meetings" | "resources" | "announcements" | "notes" | "feedback">("overview");
  const [newNote, setNewNote] = useState("");
  const [feedback, setFeedback] = useState("");

  const sessionQ = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const fetchTasks = useServerFn(listTasks);
  const fetchMeetings = useServerFn(listMeetings);
  const fetchSchedules = useServerFn(listSchedules);
  const fetchAnnouncements = useServerFn(listAnnouncements);
  const fetchResources = useServerFn(listResources);
  const fetchNotes = useServerFn(listNotes);
  const doCreateNote = useServerFn(createNote);
  const doDeleteNote = useServerFn(deleteNote);
  const doCreateFeedback = useServerFn(createFeedback);
  const doClaimPoolTask = useServerFn(claimPoolTask);
  const doAcceptTask = useServerFn(acceptTask);
  const doUpdateTaskExecution = useServerFn(updateTaskExecution);

  const [selectedTaskWorkspace, setSelectedTaskWorkspace] = useState<any>(null);

  const tasksQ = useQuery({ queryKey: ["my-tasks"], queryFn: () => fetchTasks() });
  const meetingsQ = useQuery({ queryKey: ["my-meetings"], queryFn: () => fetchMeetings() });
  const schedulesQ = useQuery({ queryKey: ["my-schedules"], queryFn: () => fetchSchedules() });
  const announcementsQ = useQuery({ queryKey: ["my-announcements"], queryFn: () => fetchAnnouncements() });
  const resourcesQ = useQuery({ queryKey: ["my-resources"], queryFn: () => fetchResources() });
  const notesQ = useQuery({ queryKey: ["my-notes"], queryFn: () => fetchNotes() });

  const tasks: any[] = tasksQ.data || [];
  const notes: any[] = notesQ.data || [];
  const meetings: any[] = meetingsQ.data || [];
  const schedules: any[] = schedulesQ.data || [];
  const announcements: any[] = announcementsQ.data || [];
  const resources: any[] = resourcesQ.data || [];

  const session = sessionQ.data;
  const email = session?.user?.email || "";
  
  const profileQ = useQuery({ 
    queryKey: ["profile", session?.user?.id], 
    queryFn: async () => { 
      const { data } = await supabase.from('profiles').select('*').eq('id', session?.user?.id).single(); 
      return data; 
    }, 
    enabled: !!session?.user?.id 
  });
  
  const profile = profileQ.data;
  const displayName = profile?.full_name || email.split("@")[0] || "Intern";

  const poolTasks = tasks.filter((t: any) => t.is_pool_task === true && !t.assigned_to);
  const myTasks = tasks.filter((t: any) => !(t.is_pool_task === true && !t.assigned_to));
  const pendingTasks = myTasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  const completedTasks = myTasks.filter((t) => t.status === "completed");
  const progress = myTasks.length > 0 ? Math.round((completedTasks.length / myTasks.length) * 100) : 0;

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function markTaskStatus(taskId: string, status: string) {
    const { error } = await supabase.from("tasks").update({ status, updated_at: new Date().toISOString() }).eq("id", taskId);
    if (error) { toast.error("Failed to update task"); return; }
    toast.success("Task updated!");
    qc.invalidateQueries({ queryKey: ["my-tasks"] });
  }

  const fetchMyStandups = useServerFn(listMyStandups);
  const doCreateStandup = useServerFn(createStandup);
  const fetchMyDeliverables = useServerFn(listMyDeliverables);
  const doCreateDeliverable = useServerFn(createDeliverable);
  const fetchMyAccessRequests = useServerFn(listMyAccessRequests);
  const doCreateAccessRequest = useServerFn(createAccessRequest);

  const standupsQ = useQuery({ queryKey: ["my-standups"], queryFn: () => fetchMyStandups() });
  const deliverablesQ = useQuery({ queryKey: ["my-deliverables"], queryFn: () => fetchMyDeliverables() });
  const accessRequestsQ = useQuery({ queryKey: ["my-access-requests"], queryFn: () => fetchMyAccessRequests() });

  const [standupForm, setStandupForm] = useState({ did_today: "", will_do_tomorrow: "", blockers: "" });
  const [deliverableForm, setDeliverableForm] = useState({ title: "", submission_url: "", notes: "", task_id: "" });
  const [accessRequestForm, setAccessRequestForm] = useState({ tool_name: "", reason: "" });
  const [clockedIn, setClockedIn] = useState(false);
  const [clockTime, setClockTime] = useState<string | null>(null);

  const standups: any[] = standupsQ.data || [];
  const deliverables: any[] = deliverablesQ.data || [];
  const accessRequests: any[] = accessRequestsQ.data || [];

  const TABS = [
    { id: "overview",       label: "Overview" },
    { id: "onboarding",     label: "Onboarding" },
    { id: "lms",            label: "LMS & Skills" },
    { id: "kanban",         label: "Sprint Board" },
    { id: "standups",       label: `Standups (${standups.length})` },
    { id: "deliverables",   label: `Deliverables (${deliverables.length})` },
    { id: "ppo",            label: "PPO & Credentials" },
    { id: "tasks",          label: `Tasks (${pendingTasks.length})` },
    { id: "meetings",       label: "Meetings" },
    { id: "resources",      label: `Resources (${resources.length})` },
    { id: "notes",          label: "Notes" },
    { id: "feedback",       label: "Feedback" },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-xs">
        <div className="w-full max-w-[1800px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & User Info */}
          <div className="flex items-center gap-2.5 shrink-0">
            <img src="/icon-512.png" alt="Vyntyra" className="h-8 w-auto rounded-md shadow-xs" />
            <div className="border-l border-slate-200 pl-2.5">
              <div className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold leading-none">Intern Portal</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-900 capitalize truncate max-w-[120px] sm:max-w-[200px]">{displayName}</div>
            </div>
          </div>

          {/* Desktop & Tablet Navigation */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none max-w-[65%]">
            {TABS.map((t) => (
              <button 
                key={t.id} 
                onClick={() => setActiveTab(t.id)}
                className={`shrink-0 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                  activeTab === t.id 
                    ? "bg-emerald-600 text-white shadow-xs" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {/* User Profile & Sign Out */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <ProfileAvatar url={profile?.avatar_url} name={displayName} className="h-8 w-8 sm:h-9 sm:w-9" />
              <div className="text-xs text-slate-500 hidden xl:block truncate max-w-[160px]">{email}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5 text-slate-600 hover:text-red-600 px-2 sm:px-3 text-xs">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Mobile / Smartphone Touch-Scrollable Navigation */}
        <div className="lg:hidden flex items-center overflow-x-auto border-t border-slate-100 px-3 gap-1.5 py-2 scrollbar-none bg-slate-50/50">
          {TABS.map((t) => (
            <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id)}
              className={`shrink-0 px-3 py-1 text-xs font-semibold rounded-full transition-all whitespace-nowrap ${
                activeTab === t.id 
                  ? "bg-emerald-600 text-white shadow-xs" 
                  : "text-slate-600 bg-white border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Marquee Notifications */}
      {announcements.length > 0 && (
        <div className="bg-slate-900 text-white text-xs py-2 overflow-hidden flex whitespace-nowrap border-b border-slate-800">
          <div className="animate-marquee flex gap-12 shrink-0 min-w-full">
            {announcements.map((a: any) => (
              <span key={a.id} className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="font-semibold uppercase tracking-wider text-emerald-400">{a.type || 'Update'}</span>
                <span className="opacity-90">{a.title}</span>
              </span>
            ))}
          </div>
          <div className="animate-marquee flex gap-12 shrink-0 min-w-full ml-12">
            {announcements.map((a: any) => (
              <span key={a.id} className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="font-semibold uppercase tracking-wider text-emerald-400">{a.type || 'Update'}</span>
                <span className="opacity-90">{a.title}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ─── OVERVIEW ─── */}
        {activeTab === "overview" && (
          <>
            {/* Hero */}
            <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <ProfileAvatar url={profile?.avatar_url} name={displayName} />
                  <div>
                    <div className="text-xs uppercase tracking-widest opacity-70 mb-1 flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5" /> Vyntyra Academy
                    </div>
                    <h1 className="text-2xl font-bold capitalize">{displayName} 👋</h1>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs opacity-90">
                      {profile?.intern_id && <span className="bg-white/20 px-2 py-0.5 rounded font-mono font-medium tracking-wide">{profile.intern_id}</span>}
                      {profile?.phone && <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 opacity-70"/> {profile.phone}</span>}
                      {profile?.address && <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 opacity-70"/> {profile.address}</span>}
                      <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 opacity-70"/> {email}</span>
                    </div>
                    <p className="text-xs opacity-75 mt-1.5">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <AnalogClock />
                  <div className="text-center bg-white/10 rounded-xl px-4 py-2">
                    <div className="text-3xl font-bold">{myTasks.length}</div>
                    <div className="text-xs opacity-60 uppercase tracking-wider">Tasks</div>
                  </div>
                  <div className="text-center bg-white/10 rounded-xl px-4 py-2">
                    <div className="text-3xl font-bold">{progress}%</div>
                    <div className="text-xs opacity-60 uppercase tracking-wider">Done</div>
                  </div>
                </div>
              </div>
              {myTasks.length > 0 && (
                <div className="mt-4">
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="text-xs opacity-60 mt-1">{completedTasks.length}/{myTasks.length} tasks completed</div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: <ClipboardList className="h-5 w-5 text-amber-600" />, label: "Pending Tasks", value: pendingTasks.length, color: "bg-amber-50 border-amber-100" },
                { icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />, label: "Completed", value: completedTasks.length, color: "bg-emerald-50 border-emerald-100" },
                { icon: <Video className="h-5 w-5 text-blue-600" />, label: "Meetings", value: meetings.filter(m => new Date(m.scheduled_at) >= new Date()).length, color: "bg-blue-50 border-blue-100" },
                { icon: <BookOpen className="h-5 w-5 text-purple-600" />, label: "Resources", value: resources.length, color: "bg-purple-50 border-purple-100" },
              ].map((s, i) => (
                <div key={i} className={`rounded-xl border p-4 flex items-center gap-3 ${s.color}`}>
                  <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shadow-sm">{s.icon}</div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800">{s.value}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar */}
              <div className="lg:col-span-1">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2"><CalendarDays className="h-4 w-4" />Calendar</h2>
                <MonthlyCalendar events={schedules} />
              </div>

              <div className="lg:col-span-2 space-y-6">
                {/* My Tasks */}
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2"><ClipboardList className="h-4 w-4" />My Assignments</h2>
                  <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                    {tasksQ.isLoading ? (
                      <div className="p-8 flex items-center justify-center gap-2 text-slate-400 text-sm"><Loader2 className="h-4 w-4 animate-spin" />Loading...</div>
                    ) : tasks.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm">No tasks assigned yet</div>
                    ) : (
                      <div className="divide-y">
                        {myTasks.slice(0, 4).map((task: any) => {
                          const s = TASK_STATUS_STYLES[task.status] || TASK_STATUS_STYLES.pending;
                          return (
                            <div key={task.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className={`h-2 w-2 rounded-full shrink-0 ${s.dot}`} />
                                <div className="min-w-0">
                                  <div className="font-medium text-sm truncate">{task.title}</div>
                                  {task.due_date && <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Clock className="h-3 w-3" />Due {new Date(task.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>}
                                </div>
                              </div>
                              <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${s.badge}`}>{s.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Featured Resources */}
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4" />Quick Resources</h2>
                  <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                    {resourcesQ.isLoading ? (
                      <div className="p-6 text-center text-slate-400 text-sm flex justify-center gap-2 items-center"><Loader2 className="h-4 w-4 animate-spin" />Loading...</div>
                    ) : resources.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-sm">No resources posted yet</div>
                    ) : (
                      <div className="divide-y">
                        {resources.slice(0, 3).map((r: any) => {
                          const ri = RESOURCE_ICONS[r.type] || RESOURCE_ICONS.link;
                          return (
                            <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors group">
                              <div className={`h-9 w-9 rounded-lg border flex items-center justify-center shrink-0 ${ri.color}`}>{ri.icon}</div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm group-hover:text-primary transition-colors truncate">{r.title}</div>
                                {r.description && <div className="text-xs text-slate-400 truncate">{r.description}</div>}
                              </div>
                              <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors shrink-0" />
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

                {/* ─── ONBOARDING & PRE-BOARDING HUB ─── */}
        {activeTab === "onboarding" && (
          <div className="space-y-6">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-800 text-base flex items-center gap-2 mb-2">
                <Compass className="h-5 w-5 text-emerald-600" /> Welcome & Orientation Roadmap (Week 1 to Week 8)
              </h2>
              <p className="text-xs text-slate-500 mb-6">Follow your structured orientation kit and weekly milestones for a seamless onboarding journey.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { week: "Week 1", title: "Orientation & Setup", desc: "Complete NDA/NOC uploads, dev env setup & mentor intro.", done: true },
                  { week: "Week 2", title: "Tech Stack & Architecture", desc: "Complete LMS modules and build first micro-feature.", done: true },
                  { week: "Week 4", title: "Mid-Term Sprint & Review", desc: "Mid-term appraisal scorecard & project demo.", done: false },
                  { week: "Week 8", title: "Final Showcase & PPO", desc: "Deliverable showcase, exit survey & verifiable certificate.", done: false }
                ].map((w, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border ${w.done ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded ${w.done ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>{w.week}</span>
                      {w.done ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Clock className="h-4 w-4 text-slate-400" />}
                    </div>
                    <div className="font-semibold text-sm text-slate-900">{w.title}</div>
                    <div className="text-xs text-slate-500 mt-1">{w.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Compliance & Legal Uploads */}
              <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2 text-slate-800"><FileCheck className="h-4 w-4 text-blue-600" /> Compliance & Legal Uploads</h3>
                <p className="text-xs text-slate-500">Upload your NOC, Student ID proof, signed NDA, and bank passbook proof.</p>
                <div className="space-y-3">
                  {[
                    { label: "University NOC (No Objection Certificate)", status: "Uploaded" },
                    { label: "Student Identity Card / College Proof", status: "Uploaded" },
                    { label: "Signed NDA & Code of Conduct", status: "Pending Upload" },
                    { label: "Bank Account Passbook / Cancelled Cheque", status: "Uploaded" }
                  ].map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 text-xs">
                      <span className="font-medium text-slate-700">{doc.label}</span>
                      <span className={`font-bold px-2 py-0.5 rounded ${doc.status === 'Uploaded' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{doc.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tooling & Credentials Tracker */}
              <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-slate-800"><ShieldCheck className="h-4 w-4 text-purple-600" /> Tooling & Access Tracker</h3>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                    const tool = prompt("Enter requested software/tool name (e.g. Figma, GitHub, AWS):");
                    if (tool) doCreateAccessRequest({ data: { tool_name: tool } }).then(() => { toast.success("Access requested!"); qc.invalidateQueries({ queryKey: ["my-access-requests"] }); });
                  }}>Request Access</Button>
                </div>
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {accessRequests.length === 0 ? (
                    <div className="text-xs text-slate-400 p-4 text-center">No active access requests. Click above to request software credentials.</div>
                  ) : (
                    accessRequests.map((req: any) => (
                      <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 text-xs">
                        <span className="font-semibold text-slate-800">{req.tool_name}</span>
                        <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${req.status === 'provisioned' ? 'bg-emerald-100 text-emerald-800' : req.status === 'approved' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>{req.status}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── LEARNING & SKILL PATH (LMS) ─── */}
        {activeTab === "lms" && (
          <div className="space-y-6">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-800 text-base flex items-center gap-2 mb-1">
                <BookMarked className="h-5 w-5 text-emerald-600" /> Structured Curriculum & Certification Path
              </h2>
              <p className="text-xs text-slate-500 mb-6">Complete mandatory training modules to earn digital skill badges.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: "Vyntyra Architecture 101", category: "Core Engineering", progress: 100, badge: "Architecture Specialist" },
                  { title: "Git, CI/CD & Code Review", category: "DevOps & Workflow", progress: 80, badge: "Git Pro" },
                  { title: "Enterprise AI Infrastructure", category: "Machine Learning", progress: 40, badge: "AI Practitioner" }
                ].map((m, idx) => (
                  <div key={idx} className="rounded-xl border p-5 bg-white hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">{m.category}</span>
                      <h3 className="font-bold text-sm text-slate-900 mt-2">{m.title}</h3>
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Progress</span>
                          <span className="font-bold">{m.progress}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${m.progress}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 pt-3 border-t flex items-center justify-between text-xs">
                      <span className="text-amber-700 font-semibold flex items-center gap-1"><Award className="h-3.5 w-3.5 text-amber-500" /> {m.badge}</span>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600">Resume Module</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── SPRINT KANBAN BOARD ─── */}
        {activeTab === "kanban" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 text-base flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" /> Sprint Kanban Board
              </h2>
              <div className="text-xs text-slate-500 font-medium">Click arrows to move tasks across sprint status columns</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { title: "To Do", status: "pending", bg: "bg-slate-100 border-slate-200" },
                { title: "In Progress", status: "in_progress", bg: "bg-blue-50 border-blue-200" },
                { title: "In Review", status: "blocked", bg: "bg-amber-50 border-amber-200" },
                { title: "Completed", status: "completed", bg: "bg-emerald-50 border-emerald-200" }
              ].map((col) => {
                const colTasks = myTasks.filter((t: any) => t.status === col.status);
                return (
                  <div key={col.status} className={`rounded-xl border p-4 ${col.bg} min-h-[400px] flex flex-col`}>
                    <div className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
                      <span>{col.title}</span>
                      <span className="bg-white/80 px-2 py-0.5 rounded-full text-slate-800">{colTasks.length}</span>
                    </div>
                    <div className="space-y-3 flex-1 overflow-y-auto">
                      {colTasks.map((t: any) => (
                        <div key={t.id} className="p-3 bg-white rounded-lg border shadow-sm space-y-2">
                          <div className="font-semibold text-xs text-slate-900">{t.title}</div>
                          {t.description && <p className="text-[11px] text-slate-500 line-clamp-2">{t.description}</p>}
                          <div className="flex items-center justify-between pt-2 border-t text-[10px]">
                            <span className="font-bold text-slate-600">{t.priority || "Medium"}</span>
                            <div className="flex gap-1">
                              {col.status !== 'pending' && <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-slate-400 hover:text-slate-700" onClick={() => markTaskStatus(t.id, 'pending')}>←</Button>}
                              {col.status !== 'in_progress' && <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-blue-600 hover:bg-blue-50" onClick={() => markTaskStatus(t.id, 'in_progress')}>→</Button>}
                              {col.status !== 'completed' && <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-emerald-600 hover:bg-emerald-50" onClick={() => markTaskStatus(t.id, 'completed')}>✓</Button>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── DAILY STANDUPS ─── */}
        {activeTab === "standups" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Standup Form */}
              <div className="lg:col-span-1 rounded-xl border bg-white p-6 shadow-sm space-y-4">
                <h2 className="font-semibold text-sm flex items-center gap-2 text-slate-800"><Send className="h-4 w-4 text-emerald-600" /> Submit Daily Standup Log</h2>
                
                {/* Clock-in Button */}
                <div className="p-4 rounded-xl border bg-emerald-50/50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Shift Clock-In</div>
                    <div className="text-[10px] text-slate-500">{clockedIn ? `Clocked in at ${clockTime}` : 'Not clocked in today'}</div>
                  </div>
                  <Button size="sm" className={clockedIn ? "bg-red-600 hover:bg-red-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"} onClick={() => {
                    setClockedIn(!clockedIn);
                    setClockTime(new Date().toLocaleTimeString());
                    toast.success(clockedIn ? "Clocked out!" : "Clocked in for today's shift!");
                  }}>
                    {clockedIn ? 'Clock Out' : 'Clock In'}
                  </Button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 mb-1 block">What I did today</label>
                    <textarea className="w-full rounded-md border p-2.5" rows={3} value={standupForm.did_today} onChange={e => setStandupForm({...standupForm, did_today: e.target.value})} placeholder="Tasks completed today..." />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 mb-1 block">What I'll do tomorrow</label>
                    <textarea className="w-full rounded-md border p-2.5" rows={2} value={standupForm.will_do_tomorrow} onChange={e => setStandupForm({...standupForm, will_do_tomorrow: e.target.value})} placeholder="Planned tasks for tomorrow..." />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 mb-1 block">Blockers (optional)</label>
                    <input className="w-full rounded-md border p-2 text-xs" value={standupForm.blockers} onChange={e => setStandupForm({...standupForm, blockers: e.target.value})} placeholder="Any roadblocks faced..." />
                  </div>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={async () => {
                    if (!standupForm.did_today || !standupForm.will_do_tomorrow) { toast.error("Please fill required standup fields"); return; }
                    try {
                      await doCreateStandup({ data: standupForm });
                      setStandupForm({ did_today: "", will_do_tomorrow: "", blockers: "" });
                      toast.success("Daily standup logged!");
                      qc.invalidateQueries({ queryKey: ["my-standups"] });
                    } catch (err) { toast.error("Failed to log standup"); }
                  }}>Submit Standup</Button>
                </div>
              </div>

              {/* Standup History */}
              <div className="lg:col-span-2 rounded-xl border bg-white p-6 shadow-sm space-y-4">
                <h2 className="font-semibold text-sm text-slate-800">My Standup Log History</h2>
                <div className="divide-y max-h-[480px] overflow-y-auto">
                  {standups.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">No daily standups submitted yet. Fill out the log on the left.</div>
                  ) : (
                    standups.map((st: any) => (
                      <div key={st.id} className="py-3 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{st.date}</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${st.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{st.status}</span>
                        </div>
                        <p className="text-xs text-slate-700"><strong>Did Today:</strong> {st.did_today}</p>
                        <p className="text-xs text-slate-500"><strong>Tomorrow:</strong> {st.will_do_tomorrow}</p>
                        {st.blockers && <p className="text-xs text-red-500"><strong>Blockers:</strong> {st.blockers}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── DELIVERABLES & CODE SUBMISSIONS ─── */}
        {activeTab === "deliverables" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Submission Form */}
              <div className="lg:col-span-1 rounded-xl border bg-white p-6 shadow-sm space-y-4">
                <h2 className="font-semibold text-sm flex items-center gap-2 text-slate-800"><Upload className="h-4 w-4 text-purple-600" /> Submit Assignment / Deliverable</h2>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 mb-1 block">Deliverable Title</label>
                    <input className="w-full rounded-md border p-2" value={deliverableForm.title} onChange={e => setDeliverableForm({...deliverableForm, title: e.target.value})} placeholder="e.g. Search Indexer Microservice PR" />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 mb-1 block">Submission URL (GitHub PR / Figma / Docs)</label>
                    <input className="w-full rounded-md border p-2" value={deliverableForm.submission_url} onChange={e => setDeliverableForm({...deliverableForm, submission_url: e.target.value})} placeholder="https://github.com/... or https://figma.com/..." />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 mb-1 block">Submission Notes</label>
                    <textarea className="w-full rounded-md border p-2" rows={3} value={deliverableForm.notes} onChange={e => setDeliverableForm({...deliverableForm, notes: e.target.value})} placeholder="Key highlights & test results..." />
                  </div>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" onClick={async () => {
                    if (!deliverableForm.title || !deliverableForm.submission_url) { toast.error("Title and URL required"); return; }
                    try {
                      await doCreateDeliverable({ data: deliverableForm });
                      setDeliverableForm({ title: "", submission_url: "", notes: "", task_id: "" });
                      toast.success("Deliverable submitted for review!");
                      qc.invalidateQueries({ queryKey: ["my-deliverables"] });
                    } catch (err) { toast.error("Failed to submit deliverable"); }
                  }}>Submit for Review</Button>
                </div>
              </div>

              {/* Submissions Feed */}
              <div className="lg:col-span-2 rounded-xl border bg-white p-6 shadow-sm space-y-4">
                <h2 className="font-semibold text-sm text-slate-800">Submitted Deliverables & Mentor Feedback</h2>
                <div className="divide-y max-h-[480px] overflow-y-auto">
                  {deliverables.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">No deliverables submitted yet.</div>
                  ) : (
                    deliverables.map((del: any) => (
                      <div key={del.id} className="py-4 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">{del.title}</span>
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${del.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : del.status === 'under_review' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>{del.status}</span>
                        </div>
                        <a href={del.submission_url} target="_blank" rel="noreferrer" className="text-xs text-purple-600 hover:underline inline-flex items-center gap-1"><ExternalLink className="h-3 w-3" /> {del.submission_url}</a>
                        {del.notes && <p className="text-xs text-slate-600">{del.notes}</p>}
                        {del.feedback && <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-100 mt-2"><strong>Mentor Feedback:</strong> {del.feedback}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── PPO & CERTIFICATES ─── */}
        {activeTab === "ppo" && (
          <div className="space-y-6">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-800 text-base flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-amber-500" /> Pre-Employment Offer (PPO) & Automated Certificates
              </h2>
              <p className="text-xs text-slate-500 mb-6">Track your PPO conversion metrics and download official verifiable internship certificates upon offboarding.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PPO Status */}
                <div className="p-5 rounded-xl border bg-amber-50/50 border-amber-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase text-amber-800">PPO Conversion Score</span>
                    <span className="font-mono font-bold text-base text-amber-900">88 / 100</span>
                  </div>
                  <div className="h-3 bg-amber-200/60 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '88%' }} />
                  </div>
                  <div className="text-xs text-amber-800 space-y-1">
                    <div>✓ Task Completion Rate &gt; 85%</div>
                    <div>✓ Daily Standup Compliance &gt; 90%</div>
                    <div>✓ Mid-Term Appraisal Grade: Exceeds Expectations</div>
                  </div>
                </div>

                {/* Certificates Engine */}
                <div className="p-5 rounded-xl border bg-emerald-50/50 border-emerald-200 space-y-4">
                  <span className="font-bold text-xs uppercase text-emerald-800 block">Verifiable Credentials</span>
                  <div className="space-y-2">
                    {[
                      { name: "Internship Completion Certificate", code: "VY-INT-2026-88" },
                      { name: "Letter of Recommendation (LOR)", code: "VY-LOR-2026-92" },
                      { name: "Official Experience Certificate", code: "VY-EXP-2026-04" }
                    ].map((c, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded bg-white border text-xs">
                        <div>
                          <div className="font-semibold text-slate-800">{c.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">{c.code}</div>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={() => toast.success(`Downloading ${c.name}...`)}>
                          <Download className="h-3 w-3 mr-1" /> PDF
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* ─── TASKS ─── */}
        {activeTab === "tasks" && (
          <div className="space-y-6">
            {poolTasks.length > 0 && (
              <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b flex items-center justify-between bg-amber-50">
                  <h2 className="font-semibold flex items-center gap-2 text-amber-800"><ClipboardList className="h-5 w-5 text-amber-600" />Available Pool Tasks</h2>
                </div>
                <div className="divide-y">
                  {poolTasks.map((task: any) => (
                    <div key={task.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{task.title}</h3>
                        {task.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{task.description}</p>}
                      </div>
                      <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={async () => {
                        try {
                          await doClaimPoolTask({ data: { id: task.id } });
                          toast.success("Task claimed!");
                          qc.invalidateQueries({ queryKey: ["my-tasks"] });
                        } catch (err) {
                          toast.error("Failed to claim task");
                        }
                      }}>Claim Task</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2"><ClipboardList className="h-5 w-5 text-emerald-600" />My Tasks</h2>
                <Button variant="ghost" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["my-tasks"] })} className="gap-1.5">
                  <RefreshCw className={`h-3.5 w-3.5 ${tasksQ.isFetching ? "animate-spin" : ""}`} />Refresh
                </Button>
              </div>
              {tasksQ.isLoading ? (
                <div className="p-12 flex items-center justify-center gap-2 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" />Loading tasks...</div>
              ) : myTasks.length === 0 ? (
                <div className="p-12 text-center text-slate-400"><ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-20" />No tasks assigned yet</div>
              ) : (
                <div className="divide-y">
                  {myTasks.map((task: any) => {
                  const s = TASK_STATUS_STYLES[task.status] || TASK_STATUS_STYLES.pending;
                  return (
                    <div key={task.id} className="p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                            <h3 className="font-semibold text-sm">{task.title}</h3>
                          </div>
                          {task.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2 pl-4">{task.description}</p>}
                          <div className="flex flex-wrap items-center gap-3 mt-2 pl-4">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wide ${s.badge}`}>{s.label}</span>
                            {task.priority && <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${task.priority === "high" ? "bg-red-100 text-red-700" : task.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{task.priority}</span>}
                            {task.due_date && <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3" />Due {new Date(task.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {task.accepted_at ? (
                            <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-medium flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Accepted on {new Date(task.accepted_at).toLocaleDateString()} at {new Date(task.accepted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          ) : (
                            <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={async () => {
                              try {
                                await doAcceptTask({ data: { id: task.id } });
                                toast.success("Task accepted!");
                                qc.invalidateQueries({ queryKey: ["my-tasks"] });
                              } catch (err: any) { toast.error("Failed to accept task"); }
                            }}>Accept Task</Button>
                          )}

                          <Button size="sm" variant="outline" className="h-7 text-xs border-slate-300 hover:bg-slate-100" onClick={() => setSelectedTaskWorkspace(task)}>
                            <Layers className="h-3.5 w-3.5 mr-1 text-blue-600" /> Open Workspace & Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MEETINGS ─── */}
      {activeTab === "meetings" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2"><CalendarDays className="h-4 w-4" />Calendar</h2>
              <MonthlyCalendar events={schedules} />
            </div>
            <div className="lg:col-span-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2"><Video className="h-4 w-4" />Meetings</h2>
              <MeetingsSection meetings={meetings} isLoading={meetingsQ.isLoading} isError={meetingsQ.isError} />
            </div>
          </div>
        )}

        {/* ─── RESOURCES ─── */}
        {activeTab === "resources" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2 text-slate-700"><BookOpen className="h-5 w-5 text-emerald-600" />Learning Resources</h2>
              <Button variant="ghost" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["my-resources"] })} className="gap-1.5">
                <RefreshCw className={`h-3.5 w-3.5 ${resourcesQ.isFetching ? "animate-spin" : ""}`} />Refresh
              </Button>
            </div>
            {resourcesQ.isLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" />Loading...</div>
            ) : resources.length === 0 ? (
              <div className="text-center py-12 text-slate-400 rounded-xl border bg-white">
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No resources posted yet</p>
                <p className="text-sm mt-1">Your admin will post guides and documents here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {resources.map((r: any) => {
                  const ri = RESOURCE_ICONS[r.type] || RESOURCE_ICONS.link;
                  return (
                    <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                      className="block rounded-xl border bg-white p-5 hover:shadow-md transition-all hover:-translate-y-0.5 group">
                      <div className={`h-12 w-12 rounded-xl border flex items-center justify-center mb-3 ${ri.color}`}>{ri.icon}</div>
                      <h3 className="font-semibold text-sm group-hover:text-emerald-700 transition-colors">{r.title}</h3>
                      {r.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{r.description}</p>}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 capitalize">{r.type}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── ANNOUNCEMENTS ─── */}
        {activeTab === "announcements" && (
          <div className="space-y-4">
            {announcementsQ.isLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" />Loading...</div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-12 text-slate-400"><Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />No announcements yet</div>
            ) : (
              announcements.map((a: any) => (
                <div key={a.id} className="rounded-xl border bg-white shadow-sm p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{a.title}</h3>
                      <div className="text-xs text-slate-400 mt-0.5">{new Date(a.created_at).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold uppercase tracking-wide shrink-0">
                      {a.source === "news" ? "News" : a.target_role === "all" ? "Everyone" : a.target_role}
                    </span>
                  </div>
                  <RichContentRenderer content={a.body || ""} />
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── NOTES ─── */}
        {activeTab === "notes" && (
          <div className="rounded-xl border bg-white shadow-sm p-6 space-y-6">
            <h2 className="font-semibold flex items-center gap-2 text-slate-700"><FileText className="h-5 w-5 text-emerald-600" />My Notes</h2>
            <div className="flex gap-2">
              <textarea 
                className="flex-1 rounded-md border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Write a note..." 
                value={newNote} 
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
              />
            </div>
            <Button onClick={async () => {
              if (!newNote.trim()) return;
              try {
                await doCreateNote({ data: { content: newNote } });
                setNewNote("");
                toast.success("Note saved!");
                qc.invalidateQueries({ queryKey: ["my-notes"] });
              } catch (err) {
                toast.error("Failed to save note");
              }
            }}>Save Note</Button>

            <div className="mt-8 space-y-4">
              {notesQ.isLoading ? (
                <div className="text-slate-500 text-sm">Loading notes...</div>
              ) : notes.length === 0 ? (
                <div className="text-slate-400 text-sm">No notes yet.</div>
              ) : (
                notes.map((note: any) => (
                  <div key={note.id} className="p-4 rounded-lg bg-slate-50 border flex justify-between gap-4">
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0" onClick={async () => {
                      try {
                        await doDeleteNote({ data: { noteId: note.id } });
                        toast.success("Note deleted");
                        qc.invalidateQueries({ queryKey: ["my-notes"] });
                      } catch (err) {
                        toast.error("Failed to delete note");
                      }
                    }}>Delete</Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─── FEEDBACK ─── */}
        {activeTab === "feedback" && (
          <div className="rounded-xl border bg-white shadow-sm p-6 max-w-2xl mx-auto space-y-6">
            <h2 className="font-semibold flex items-center gap-2 text-slate-700"><Mail className="h-5 w-5 text-emerald-600" />Submit Feedback</h2>
            <p className="text-sm text-slate-500">We value your thoughts! Let us know how we can improve your intern experience.</p>
            <textarea 
              className="w-full rounded-md border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Your feedback..." 
              value={feedback} 
              onChange={(e) => setFeedback(e.target.value)}
              rows={5}
            />
            <Button onClick={async () => {
              if (!feedback.trim()) return;
              try {
                await doCreateFeedback({ data: { content: feedback } });
                setFeedback("");
                toast.success("Feedback submitted! Thank you.");
              } catch (err) {
                toast.error("Failed to submit feedback");
              }
            }}>Submit Feedback</Button>
          </div>
        )}

      </main>

      
{/* ── Task Execution Workspace Dialog ── */}
{selectedTaskWorkspace && (
  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
      <div className="flex items-start justify-between border-b pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Task Workspace</span>
          <h2 className="text-lg font-bold text-slate-900 mt-1">{selectedTaskWorkspace.title}</h2>
          {selectedTaskWorkspace.accepted_at && (
            <p className="text-xs text-emerald-700 font-medium mt-1">✓ You accepted this task on {new Date(selectedTaskWorkspace.accepted_at).toLocaleString()}</p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setSelectedTaskWorkspace(null)}>✕</Button>
      </div>

      <div className="space-y-4 text-xs">
        <div>
          <label className="font-semibold text-slate-800 mb-1 block">Task Description</label>
          <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border leading-relaxed">{selectedTaskWorkspace.description || "No description provided."}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-slate-800 mb-1 block">Task Status</label>
            <select className="w-full rounded-md border p-2 text-xs" value={selectedTaskWorkspace.status || "in_progress"} onChange={e => setSelectedTaskWorkspace({...selectedTaskWorkspace, status: e.target.value})}>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div>
            <label className="font-semibold text-slate-800 mb-1 block">Completion Progress (%)</label>
            <input type="number" min="0" max="100" className="w-full rounded-md border p-2 text-xs" value={selectedTaskWorkspace.progress_percentage ?? 0} onChange={e => setSelectedTaskWorkspace({...selectedTaskWorkspace, progress_percentage: parseInt(e.target.value) || 0})} />
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-800 mb-1 block">Project Requirements & Technical Specs</label>
          <textarea className="w-full rounded-md border p-2.5 text-xs font-mono" rows={3} value={selectedTaskWorkspace.project_requirements || ""} onChange={e => setSelectedTaskWorkspace({...selectedTaskWorkspace, project_requirements: e.target.value})} placeholder="Tech stack, API endpoints, performance metrics, design specs..." />
        </div>

        <div>
          <label className="font-semibold text-slate-800 mb-1 block">Status & Progress Notes</label>
          <textarea className="w-full rounded-md border p-2.5 text-xs" rows={3} value={selectedTaskWorkspace.progress_notes || ""} onChange={e => setSelectedTaskWorkspace({...selectedTaskWorkspace, progress_notes: e.target.value})} placeholder="Describe progress update, completed milestones, or blockers..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-slate-800 mb-1 block">Deliverable URL (GitHub PR / Figma / Doc)</label>
            <input className="w-full rounded-md border p-2 text-xs" value={selectedTaskWorkspace.deliverable_url || ""} onChange={e => setSelectedTaskWorkspace({...selectedTaskWorkspace, deliverable_url: e.target.value})} placeholder="https://github.com/..." />
          </div>
          <div>
            <label className="font-semibold text-slate-800 mb-1 block">Time Spent (Hours)</label>
            <input type="number" step="0.5" className="w-full rounded-md border p-2 text-xs" value={selectedTaskWorkspace.time_spent_hours ?? 0} onChange={e => setSelectedTaskWorkspace({...selectedTaskWorkspace, time_spent_hours: parseFloat(e.target.value) || 0})} placeholder="e.g. 4.5" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" size="sm" onClick={() => setSelectedTaskWorkspace(null)}>Cancel</Button>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={async () => {
          try {
            await doUpdateTaskExecution({
              data: {
                id: selectedTaskWorkspace.id,
                status: selectedTaskWorkspace.status || "in_progress",
                progress_percentage: selectedTaskWorkspace.progress_percentage ?? 0,
                progress_notes: selectedTaskWorkspace.progress_notes || "",
                project_requirements: selectedTaskWorkspace.project_requirements || "",
                deliverable_url: selectedTaskWorkspace.deliverable_url || "",
                time_spent_hours: selectedTaskWorkspace.time_spent_hours ?? 0,
              }
            });
            toast.success("Task workspace saved!");
            setSelectedTaskWorkspace(null);
            qc.invalidateQueries({ queryKey: ["my-tasks"] });
          } catch (err: any) { toast.error("Failed to save workspace"); }
        }}>Save Workspace Changes</Button>
      </div>
    </div>
  </div>
)}

      {/* Floating Apps Panel */}
      <FloatingAppsPanel />
    </div>
  );
}
