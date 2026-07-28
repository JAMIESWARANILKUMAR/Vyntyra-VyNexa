import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  Briefcase, ClipboardList, Clock, Mail, Bell, LogOut, Loader2,
  CheckCircle2, Circle, AlertCircle, TrendingUp, Video, CalendarDays,
  User, BarChart3, RefreshCw, Phone, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { MonthlyCalendar } from "@/components/monthly-calendar";
import { MeetingsSection } from "@/components/meetings-section";
import { FloatingAppsPanel } from "@/components/floating-apps-panel";
import { AnalogClock } from "@/components/analog-clock";
import { ProfileAvatar } from "@/components/profile-avatar";
import { listTasks } from "@/lib/operations.functions";
import { listMeetings } from "@/lib/operations.functions";
import { listSchedules } from "@/lib/operations.functions";
import { listAnnouncements } from "@/lib/operations.functions";

export const Route = createFileRoute("/_authenticated/employee")({
  head: () => ({ meta: [{ title: "Employee Dashboard — Vyntyra" }] }),
  component: EmployeeDashboard,
});

const TASK_STATUS_STYLES: Record<string, { dot: string; badge: string; label: string }> = {
  pending:     { dot: "bg-amber-400",   badge: "bg-amber-50 text-amber-700 border-amber-200",    label: "Pending" },
  in_progress: { dot: "bg-blue-500",    badge: "bg-blue-50 text-blue-700 border-blue-200",        label: "In Progress" },
  completed:   { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Completed" },
  blocked:     { dot: "bg-red-500",     badge: "bg-red-50 text-red-700 border-red-200",           label: "Blocked" },
};

function EmployeeDashboard() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "meetings" | "announcements">("overview");

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

  const tasksQ = useQuery({ queryKey: ["my-tasks"], queryFn: () => fetchTasks() });
  const meetingsQ = useQuery({ queryKey: ["my-meetings"], queryFn: () => fetchMeetings() });
  const schedulesQ = useQuery({ queryKey: ["my-schedules"], queryFn: () => fetchSchedules() });
  const announcementsQ = useQuery({ queryKey: ["my-announcements"], queryFn: () => fetchAnnouncements() });

  const tasks: any[] = tasksQ.data || [];
  const meetings: any[] = meetingsQ.data || [];
  const schedules: any[] = schedulesQ.data || [];
  const announcements: any[] = announcementsQ.data || [];

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
  const displayName = profile?.full_name || email.split("@")[0] || "Employee";

  const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const progress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  async function markTaskStatus(taskId: string, status: string) {
    const { error } = await supabase.from("tasks").update({ status, updated_at: new Date().toISOString() }).eq("id", taskId);
    if (error) { toast.error("Failed to update task"); return; }
    toast.success("Task updated!");
    qc.invalidateQueries({ queryKey: ["my-tasks"] });
  }

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "tasks", label: `Tasks (${pendingTasks.length})` },
    { id: "meetings", label: "Meetings" },
    { id: "announcements", label: `News (${announcements.length})` },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/icon-512.png" alt="Vyntyra" className="h-8 w-auto" />
            <div className="border-l border-slate-200 pl-3 hidden sm:block">
              <div className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">Employee Portal</div>
              <div className="text-sm font-semibold text-slate-800 capitalize">{displayName}</div>
            </div>
          </div>

          {/* Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${activeTab === t.id ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-500 hidden sm:block">{email}</div>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5 text-slate-600 hover:text-red-600">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
        {/* Mobile Tabs */}
        <div className="md:hidden flex overflow-x-auto border-t border-slate-100 px-4 gap-1 py-1.5">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`shrink-0 px-3 py-1 text-xs font-medium rounded-full transition-all ${activeTab === t.id ? "bg-primary text-white" : "text-slate-500 bg-slate-100"}`}>
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
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                <span className="font-semibold uppercase tracking-wider text-blue-400">{a.type || 'Update'}</span>
                <span className="opacity-90">{a.title}</span>
              </span>
            ))}
          </div>
          <div className="animate-marquee flex gap-12 shrink-0 min-w-full ml-12">
            {announcements.map((a: any) => (
              <span key={a.id} className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                <span className="font-semibold uppercase tracking-wider text-blue-400">{a.type || 'Update'}</span>
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
            {/* Hero Banner */}
            <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-white p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <ProfileAvatar url={profile?.avatar_url} name={displayName} />
                  <div>
                    <div className="text-xs uppercase tracking-widest opacity-70 mb-1">Welcome back</div>
                    <h1 className="text-2xl font-bold capitalize">{displayName} 👋</h1>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs opacity-90">
                      {profile?.phone && <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 opacity-70"/> {profile.phone}</span>}
                      {profile?.address && <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 opacity-70"/> {profile.address}</span>}
                      <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 opacity-70"/> {email}</span>
                    </div>
                    <p className="text-xs opacity-75 mt-1.5">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <AnalogClock />
                  <div className="text-center">
                    <div className="text-3xl font-bold">{tasks.length}</div>
                    <div className="text-xs opacity-60 uppercase tracking-wider">Total Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{progress}%</div>
                    <div className="text-xs opacity-60 uppercase tracking-wider">Completed</div>
                  </div>
                </div>
              </div>
              {tasks.length > 0 && (
                <div className="mt-4">
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="text-xs opacity-60 mt-1">{completedTasks.length}/{tasks.length} tasks completed</div>
                </div>
              )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: <ClipboardList className="h-5 w-5 text-amber-600" />, label: "Pending", value: pendingTasks.length, color: "bg-amber-50 border-amber-100" },
                { icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />, label: "Completed", value: completedTasks.length, color: "bg-emerald-50 border-emerald-100" },
                { icon: <Video className="h-5 w-5 text-blue-600" />, label: "Meetings", value: meetings.filter(m => new Date(m.scheduled_at) >= new Date()).length, color: "bg-blue-50 border-blue-100" },
                { icon: <Bell className="h-5 w-5 text-purple-600" />, label: "Announcements", value: announcements.length, color: "bg-purple-50 border-purple-100" },
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
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" /> Calendar
                </h2>
                <MonthlyCalendar events={schedules} />
              </div>

              {/* Recent Tasks + Announcements */}
              <div className="lg:col-span-2 space-y-6">
                {/* Recent Tasks */}
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" /> Recent Tasks
                  </h2>
                  <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                    {tasksQ.isLoading ? (
                      <div className="p-8 text-center text-muted-foreground text-sm flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
                    ) : tasks.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm">No tasks assigned yet</div>
                    ) : (
                      <div className="divide-y">
                        {tasks.slice(0, 4).map((task: any) => {
                          const s = TASK_STATUS_STYLES[task.status] || TASK_STATUS_STYLES.pending;
                          return (
                            <div key={task.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className={`h-2 w-2 rounded-full shrink-0 ${s.dot}`} />
                                <div className="min-w-0">
                                  <div className="font-medium text-sm truncate">{task.title}</div>
                                  {task.due_date && <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" />Due {new Date(task.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>}
                                </div>
                              </div>
                              <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${s.badge}`}>{s.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Latest Announcements */}
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                    <Bell className="h-4 w-4" /> Announcements
                  </h2>
                  <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                    {announcementsQ.isLoading ? (
                      <div className="p-6 text-center text-sm text-slate-400 flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading...</div>
                    ) : announcements.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-sm">No announcements</div>
                    ) : (
                      <div className="divide-y">
                        {announcements.slice(0, 3).map((a: any) => (
                          <div key={a.id} className="p-4">
                            <div className="font-semibold text-sm">{a.title}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{new Date(a.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                            <p className="text-sm text-slate-600 mt-2 line-clamp-2">{a.body}</p>
                          </div>
                        ))}
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
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> My Tasks</h2>
              <Button variant="ghost" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["my-tasks"] })} className="gap-1.5">
                <RefreshCw className={`h-3.5 w-3.5 ${tasksQ.isFetching ? "animate-spin" : ""}`} /> Refresh
              </Button>
            </div>
            {tasksQ.isLoading ? (
              <div className="p-12 flex items-center justify-center gap-2 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /> Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-20" />
                No tasks assigned to you yet
              </div>
            ) : (
              <div className="divide-y">
                {tasks.map((task: any) => {
                  const s = TASK_STATUS_STYLES[task.status] || TASK_STATUS_STYLES.pending;
                  return (
                    <div key={task.id} className="p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                            <h3 className="font-semibold text-sm">{task.title}</h3>
                          </div>
                          {task.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{task.description}</p>}
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wide ${s.badge}`}>{s.label}</span>
                            {task.priority && <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${task.priority === "high" ? "bg-red-100 text-red-700" : task.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{task.priority} priority</span>}
                            {task.due_date && <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3" />Due {new Date(task.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
                          {task.status === "pending" && (
                            <Button size="sm" className="h-7 text-xs" onClick={() => markTaskStatus(task.id, "in_progress")}>Start</Button>
                          )}
                          {task.status === "in_progress" && (
                            <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => markTaskStatus(task.id, "completed")}>
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Complete
                            </Button>
                          )}
                          {task.status === "completed" && (
                            <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium"><CheckCircle2 className="h-4 w-4" /> Done</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold uppercase tracking-wide shrink-0">{a.target_role === "all" ? "Everyone" : a.target_role}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-3 leading-relaxed">{a.body}</p>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Floating Apps Panel */}
      <FloatingAppsPanel />
    </div>
  );
}
