import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  GraduationCap, ClipboardList, Clock, Mail, Bell, LogOut, Loader2,
  CheckCircle2, Video, CalendarDays, User, BookOpen, Link2, FileText,
  Play, FolderOpen, ExternalLink, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { MonthlyCalendar } from "@/components/monthly-calendar";
import { MeetingsSection } from "@/components/meetings-section";
import { FloatingAppsPanel } from "@/components/floating-apps-panel";
import { listTasks, listMeetings, listSchedules, listAnnouncements, listResources, listNotes, createNote, deleteNote, createFeedback, claimPoolTask } from "@/lib/operations.functions";

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
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "meetings" | "resources" | "announcements" | "notes" | "feedback">("overview");
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
  const displayName = email.split("@")[0] || "Intern";

  const poolTasks = tasks.filter((t: any) => t.is_pool_task === true && !t.assigned_to);
  const myTasks = tasks.filter((t: any) => !(t.is_pool_task === true && !t.assigned_to));
  const pendingTasks = myTasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  const completedTasks = myTasks.filter((t) => t.status === "completed");
  const progress = myTasks.length > 0 ? Math.round((completedTasks.length / myTasks.length) * 100) : 0;

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  async function markTaskStatus(taskId: string, status: string) {
    const { error } = await supabase.from("tasks").update({ status, updated_at: new Date().toISOString() }).eq("id", taskId);
    if (error) { toast.error("Failed to update task"); return; }
    toast.success("Task updated!");
    qc.invalidateQueries({ queryKey: ["my-tasks"] });
  }

  const TABS = [
    { id: "overview",       label: "Overview" },
    { id: "tasks",          label: `Tasks (${pendingTasks.length})` },
    { id: "meetings",       label: "Meetings" },
    { id: "resources",      label: `Resources (${resources.length})` },
    { id: "announcements",  label: `News (${announcements.length})` },
    { id: "notes",          label: "Notes" },
    { id: "feedback",       label: "Feedback" },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="https://vyntyraconsultancyservices.in/logo.png" alt="Vyntyra" className="h-8 w-auto" />
            <div className="border-l border-slate-200 pl-3 hidden sm:block">
              <div className="text-[10px] uppercase tracking-widest text-emerald-500 font-semibold">Intern Portal</div>
              <div className="text-sm font-semibold text-slate-800 capitalize">{displayName}</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${activeTab === t.id ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}>
                {t.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-500 hidden sm:block">{email}</div>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5 text-slate-600 hover:text-red-600">
              <LogOut className="h-4 w-4" /><span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
        <div className="md:hidden flex overflow-x-auto border-t border-slate-100 px-4 gap-1 py-1.5">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`shrink-0 px-3 py-1 text-xs font-medium rounded-full transition-all ${activeTab === t.id ? "bg-emerald-600 text-white" : "text-slate-500 bg-slate-100"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ─── OVERVIEW ─── */}
        {activeTab === "overview" && (
          <>
            {/* Hero */}
            <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-widest opacity-70 mb-1 flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5" /> Vyntyra Academy
                  </div>
                  <h1 className="text-2xl font-bold capitalize">{displayName} 👋</h1>
                  <p className="text-sm opacity-75 mt-1">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
                <div className="flex gap-4">
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
                          await doClaimPoolTask({ data: { taskId: task.id } });
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
                        <div className="flex flex-col gap-1.5 shrink-0">
                          {task.status === "pending" && (
                            <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => markTaskStatus(task.id, "in_progress")}>Accept</Button>
                          )}
                          {task.status === "in_progress" && (
                            <Button size="sm" className="h-7 text-xs" onClick={() => markTaskStatus(task.id, "completed")}>
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Mark Done
                            </Button>
                          )}
                          {task.status === "completed" && (
                            <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium"><CheckCircle2 className="h-4 w-4" />Done</span>
                          )}
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
                <div key={a.id} className="rounded-xl border bg-white shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{a.title}</h3>
                      <div className="text-xs text-slate-400 mt-0.5">{new Date(a.created_at).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold uppercase tracking-wide shrink-0">{a.target_role === "all" ? "Everyone" : a.target_role}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-3 leading-relaxed">{a.body}</p>
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

      {/* Floating Apps Panel */}
      <FloatingAppsPanel />
    </div>
  );
}
