import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  Briefcase, ClipboardList, Clock, Mail, Bell, LogOut, Loader2,
  CheckCircle2, Circle, AlertCircle, TrendingUp, Video, CalendarDays,
  User, BarChart3, RefreshCw, Phone, MapPin, CalendarX2, Users,
  IndianRupee, MessageSquare, BookOpen, Fingerprint, FileText, Send, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { MonthlyCalendar } from "@/components/monthly-calendar";
import { MeetingsSection } from "@/components/meetings-section";
import { FloatingAppsPanel } from "@/components/floating-apps-panel";
import { AnalogClock } from "@/components/analog-clock";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { 
  listTasks, listMeetings, listSchedules, listAnnouncements,
  requestLeave, listMyLeaves, listMyPayouts, clockIn, clockOut, getMyAttendance,
  listTeamMembers, createFeedback, listResources
} from "@/lib/operations.functions";

export const Route = createFileRoute("/_authenticated/employee")({
  head: () => ({ meta: [{ title: "Employee Dashboard — Vyntyra" }] }),
  component: EmployeeDashboard,
});

// Minimalist status styles
const TASK_STATUS_STYLES: Record<string, { dot: string; badge: string; label: string }> = {
  pending:     { dot: "bg-slate-300",   badge: "bg-slate-100 text-slate-600",    label: "Pending" },
  in_progress: { dot: "bg-slate-800",    badge: "bg-slate-800 text-white",        label: "In Progress" },
  completed:   { dot: "bg-slate-400", badge: "bg-white text-slate-400 border border-slate-200", label: "Completed" },
  blocked:     { dot: "bg-red-500",     badge: "bg-red-50 text-red-700",           label: "Blocked" },
};

function EmployeeDashboard() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("overview");

  const sessionQ = useQuery({ queryKey: ["session"], queryFn: async () => (await supabase.auth.getSession()).data.session });
  
  const fetchTasks = useServerFn(listTasks);
  const fetchMeetings = useServerFn(listMeetings);
  const fetchSchedules = useServerFn(listSchedules);
  const fetchAnnouncements = useServerFn(listAnnouncements);
  
  const doRequestLeave = useServerFn(requestLeave);
  const fetchLeaves = useServerFn(listMyLeaves);
  const fetchPayouts = useServerFn(listMyPayouts);
  const doClockIn = useServerFn(clockIn);
  const doClockOut = useServerFn(clockOut);
  const fetchAttendance = useServerFn(getMyAttendance);
  const fetchTeam = useServerFn(listTeamMembers);
  const doCreateFeedback = useServerFn(createFeedback);
  const fetchResources = useServerFn(listResources);

  const tasksQ = useQuery({ queryKey: ["my-tasks"], queryFn: () => fetchTasks() });
  const meetingsQ = useQuery({ queryKey: ["my-meetings"], queryFn: () => fetchMeetings() });
  const schedulesQ = useQuery({ queryKey: ["my-schedules"], queryFn: () => fetchSchedules() });
  const announcementsQ = useQuery({ queryKey: ["my-announcements"], queryFn: () => fetchAnnouncements() });
  const leavesQ = useQuery({ queryKey: ["my-leaves"], queryFn: () => fetchLeaves() });
  const payoutsQ = useQuery({ queryKey: ["my-payouts"], queryFn: () => fetchPayouts() });
  const attendanceQ = useQuery({ queryKey: ["my-attendance"], queryFn: () => fetchAttendance() });
  const teamQ = useQuery({ queryKey: ["team-members"], queryFn: () => fetchTeam() });
  const resourcesQ = useQuery({ queryKey: ["resources"], queryFn: () => fetchResources() });

  const tasks: any[] = tasksQ.data || [];
  const meetings: any[] = meetingsQ.data || [];
  const schedules: any[] = schedulesQ.data || [];
  const announcements: any[] = announcementsQ.data || [];
  const leaves: any[] = leavesQ.data || [];
  const payouts: any[] = payoutsQ.data || [];
  const attendanceLogs: any[] = attendanceQ.data || [];
  const team: any[] = teamQ.data || [];
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
  const displayName = profile?.full_name || email.split("@")[0] || "Employee";

  const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const progress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const [leaveForm, setLeaveForm] = useState({ start_date: "", end_date: "", reason: "" });
  const [feedbackForm, setFeedbackForm] = useState({ content: "" });
  const [isClocking, setIsClocking] = useState(false);

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

  async function handleSubmitLeave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await doRequestLeave({ data: leaveForm });
      toast.success("Leave requested successfully");
      setLeaveForm({ start_date: "", end_date: "", reason: "" });
      qc.invalidateQueries({ queryKey: ["my-leaves"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to request leave");
    }
  }

  async function handleClockIn() {
    setIsClocking(true);
    try {
      await doClockIn();
      toast.success("Clocked in successfully!");
      qc.invalidateQueries({ queryKey: ["my-attendance"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to clock in");
    } finally { setIsClocking(false); }
  }

  async function handleClockOut() {
    setIsClocking(true);
    try {
      await doClockOut();
      toast.success("Clocked out successfully!");
      qc.invalidateQueries({ queryKey: ["my-attendance"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to clock out");
    } finally { setIsClocking(false); }
  }

  async function handleSubmitFeedback(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin").limit(1);
      if (!admins || admins.length === 0) throw new Error("No admin found to receive feedback");
      await doCreateFeedback({ data: { content: feedbackForm.content, target_user_id: admins[0].user_id } });
      toast.success("Feedback submitted!");
      setFeedbackForm({ content: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit feedback");
    }
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendanceLogs.find(a => a.date === todayStr);

  const TABS = [
    { id: "overview", label: "Overview", icon: <Briefcase className="w-3.5 h-3.5 mr-2" /> },
    { id: "tasks", label: `Tasks (${pendingTasks.length})`, icon: <ClipboardList className="w-3.5 h-3.5 mr-2" /> },
    { id: "attendance", label: "Attendance", icon: <Fingerprint className="w-3.5 h-3.5 mr-2" /> },
    { id: "leave", label: "Leaves", icon: <CalendarX2 className="w-3.5 h-3.5 mr-2" /> },
    { id: "payouts", label: "Payouts", icon: <IndianRupee className="w-3.5 h-3.5 mr-2" /> },
    { id: "meetings", label: "Meetings", icon: <Video className="w-3.5 h-3.5 mr-2" /> },
    { id: "announcements", label: `News (${announcements.length})`, icon: <Bell className="w-3.5 h-3.5 mr-2" /> },
    { id: "team", label: "Team", icon: <Users className="w-3.5 h-3.5 mr-2" /> },
    { id: "resources", label: "Resources", icon: <BookOpen className="w-3.5 h-3.5 mr-2" /> },
    { id: "feedbacks", label: "Feedback", icon: <MessageSquare className="w-3.5 h-3.5 mr-2" /> },
    { id: "contact", label: "Contact", icon: <Phone className="w-3.5 h-3.5 mr-2" /> },
  ] as const;

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-slate-200">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-slate-900 rounded flex items-center justify-center text-white font-bold tracking-tighter">V</div>
            <div className="hidden lg:block">
              <div className="text-sm font-medium text-slate-900 tracking-tight">{displayName}</div>
              <div className="text-[11px] text-slate-500 tracking-wide uppercase">Employee</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-slate-500 hover:text-slate-900 hover:bg-slate-50">
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
        
        {/* Minimalist Tabs */}
        <div className="w-full bg-white px-6 overflow-x-auto hide-scrollbar border-t border-slate-50">
          <div className="max-w-7xl mx-auto flex items-center gap-6 py-3">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center shrink-0 text-sm transition-all pb-1 border-b-2 ${activeTab === t.id ? "border-slate-900 text-slate-900 font-medium" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Marquee Notifications */}
      {announcements.length > 0 && (
        <div className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-widest py-2 overflow-hidden flex whitespace-nowrap border-b border-slate-100">
          <div className="animate-marquee flex gap-12 shrink-0 min-w-full px-6">
            {announcements.map((a: any) => (
              <span key={a.id} className="inline-flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-slate-400" />
                <span className="font-semibold text-slate-900">{a.type || 'Update'}</span>
                <span className="opacity-80">{a.title}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-12">

        {/* ─── OVERVIEW ─── */}
        {activeTab === "overview" && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Minimalist Hero */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-slate-100">
              <div>
                <h1 className="text-3xl font-light tracking-tight text-slate-900">Good morning, <span className="font-medium">{displayName.split(' ')[0]}</span>.</h1>
                <p className="text-sm text-slate-500 mt-2 flex items-center gap-4">
                  <span>{new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}</span>
                  {profile?.phone && <span className="flex items-center gap-1.5"><Phone className="h-3 w-3"/> {profile.phone}</span>}
                </p>
              </div>
              <div className="flex items-center gap-8 text-right">
                <div>
                  <div className="text-3xl font-light tracking-tighter text-slate-900">{tasks.length}</div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-widest mt-1">Total Tasks</div>
                </div>
                <div>
                  <div className="text-3xl font-light tracking-tighter text-slate-900">{progress}%</div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-widest mt-1">Completed</div>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Pending Tasks", value: pendingTasks.length },
                { label: "Present Days", value: attendanceLogs.length },
                { label: "Meetings", value: meetings.filter(m => new Date(m.scheduled_at) >= new Date()).length },
                { label: "Leave Requests", value: leaves.length },
              ].map((s, i) => (
                <div key={i} className="p-5 border border-slate-100 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="text-2xl font-light text-slate-900">{s.value}</div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-widest mt-2">{s.label}</div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1">
                <div className="text-sm font-medium text-slate-900 mb-6">Calendar</div>
                <MonthlyCalendar events={schedules} />
              </div>
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-sm font-medium text-slate-900">Recent Tasks</div>
                  <Button variant="link" className="text-xs text-slate-500" onClick={() => setActiveTab("tasks")}>View All</Button>
                </div>
                <div className="divide-y divide-slate-100 border-t border-slate-100">
                  {tasks.slice(0, 4).map((task: any) => {
                    const s = TASK_STATUS_STYLES[task.status] || TASK_STATUS_STYLES.pending;
                    return (
                      <div key={task.id} className="py-4 flex items-center justify-between gap-4 group">
                        <div className="flex items-center gap-4">
                          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                          <div className="text-sm font-medium text-slate-800 group-hover:text-slate-900">{task.title}</div>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-medium ${s.badge}`}>{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TASKS ─── */}
        {activeTab === "tasks" && (
          <div className="max-w-4xl animate-in fade-in duration-500">
             <div className="pb-6 border-b border-slate-100 mb-6">
              <h2 className="text-xl font-light text-slate-900">Tasks</h2>
            </div>
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <div className="py-12 text-slate-400 font-light">No tasks assigned.</div>
              ) : (
                tasks.map((task: any) => {
                  const s = TASK_STATUS_STYLES[task.status] || TASK_STATUS_STYLES.pending;
                  return (
                    <div key={task.id} className="p-6 border border-slate-100 rounded-lg flex items-start justify-between gap-6 hover:shadow-sm transition-shadow">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                          <h3 className="font-medium text-slate-900">{task.title}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-medium ${s.badge}`}>{s.label}</span>
                        </div>
                        {task.description && <p className="text-sm text-slate-500 font-light leading-relaxed max-w-2xl">{task.description}</p>}
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {task.status === "pending" && <Button variant="outline" size="sm" onClick={() => markTaskStatus(task.id, "in_progress")}>Start</Button>}
                        {task.status === "in_progress" && <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => markTaskStatus(task.id, "completed")}>Complete</Button>}
                        {task.status === "completed" && <span className="text-xs text-slate-400 font-medium">Done</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ─── ATTENDANCE ─── */}
        {activeTab === "attendance" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-in fade-in duration-500">
            <div className="lg:col-span-1">
              <div className="p-8 border border-slate-100 rounded-lg bg-slate-50/50 text-center">
                <div className="text-[11px] text-slate-500 uppercase tracking-widest mb-6">Daily Log</div>
                
                {todayAttendance ? (
                  todayAttendance.clock_out ? (
                    <div className="text-sm font-medium text-slate-700 pb-4">
                      Shift Completed
                    </div>
                  ) : (
                    <Button 
                      variant="outline"
                      onClick={handleClockOut} disabled={isClocking}
                      className="w-full mb-4 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white"
                    >
                      {isClocking ? "Processing..." : "Clock Out"}
                    </Button>
                  )
                ) : (
                  <Button 
                    onClick={handleClockIn} disabled={isClocking}
                    className="w-full mb-4 bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    {isClocking ? "Processing..." : "Clock In"}
                  </Button>
                )}
                
                {todayAttendance && (
                  <div className="text-xs text-slate-400 space-y-2 mt-4 font-light">
                    {todayAttendance.clock_in && <div>In: {new Date(todayAttendance.clock_in).toLocaleTimeString()}</div>}
                    {todayAttendance.clock_out && <div>Out: {new Date(todayAttendance.clock_out).toLocaleTimeString()}</div>}
                  </div>
                )}
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="pb-6 border-b border-slate-100 mb-6">
                <h2 className="text-lg font-light text-slate-900">Attendance Log</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {attendanceLogs.length === 0 ? (
                  <div className="py-8 text-slate-400 font-light">No records found.</div>
                ) : (
                  attendanceLogs.map((log: any) => (
                    <div key={log.id} className="py-4 flex items-center justify-between">
                      <div className="text-sm font-medium text-slate-900">{new Date(log.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}</div>
                      <div className="text-sm text-slate-500 font-light">
                        {log.clock_in ? new Date(log.clock_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'} 
                        <span className="mx-2 text-slate-300">→</span> 
                        {log.clock_out ? new Date(log.clock_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── LEAVES ─── */}
        {activeTab === "leave" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-in fade-in duration-500">
            <div className="lg:col-span-1">
              <div className="pb-6 border-b border-slate-100 mb-6">
                <h2 className="text-lg font-light text-slate-900">Request Leave</h2>
              </div>
              <form onSubmit={handleSubmitLeave} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Start Date</label>
                  <Input type="date" className="bg-slate-50 border-transparent focus:border-slate-300 focus:ring-0 shadow-none" required value={leaveForm.start_date} onChange={e => setLeaveForm({...leaveForm, start_date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">End Date</label>
                  <Input type="date" className="bg-slate-50 border-transparent focus:border-slate-300 focus:ring-0 shadow-none" required value={leaveForm.end_date} onChange={e => setLeaveForm({...leaveForm, end_date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Reason</label>
                  <Textarea className="bg-slate-50 border-transparent focus:border-slate-300 focus:ring-0 shadow-none resize-none" required placeholder="Why are you taking time off?" value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} />
                </div>
                <Button type="submit" className="w-full bg-slate-900 text-white hover:bg-slate-800">Submit Request</Button>
              </form>
            </div>
            <div className="lg:col-span-2">
              <div className="pb-6 border-b border-slate-100 mb-6">
                <h2 className="text-lg font-light text-slate-900">History</h2>
              </div>
              <div className="space-y-4">
                {leaves.length === 0 ? (
                  <div className="py-8 text-slate-400 font-light">No leave history.</div>
                ) : (
                  leaves.map((leave: any) => (
                    <div key={leave.id} className="p-6 border border-slate-100 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm font-medium text-slate-900">
                          {new Date(leave.start_date).toLocaleDateString()} <span className="mx-2 text-slate-300">→</span> {new Date(leave.end_date).toLocaleDateString()}
                        </div>
                        <span className="text-[11px] text-slate-500 uppercase tracking-widest">{leave.status}</span>
                      </div>
                      <p className="text-sm text-slate-500 font-light">{leave.reason}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── PAYOUTS ─── */}
        {activeTab === "payouts" && (
          <div className="max-w-4xl animate-in fade-in duration-500">
            <div className="pb-6 border-b border-slate-100 mb-6">
              <h2 className="text-xl font-light text-slate-900">Payouts</h2>
            </div>
            <div className="space-y-4">
              {payouts.length === 0 ? (
                <div className="py-8 text-slate-400 font-light">No payouts recorded.</div>
              ) : (
                payouts.map((payout: any) => (
                  <div key={payout.id} className="p-6 border border-slate-100 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-light text-slate-900 mb-1">₹{payout.amount}</div>
                      <div className="text-[11px] text-slate-500 uppercase tracking-widest">{payout.type} • {new Date(payout.date).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-[11px] text-slate-500 uppercase tracking-widest">{payout.status}</span>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-900 hover:bg-slate-50">Download</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─── TEAM ─── */}
        {activeTab === "team" && (
          <div className="animate-in fade-in duration-500">
            <div className="pb-6 border-b border-slate-100 mb-8">
              <h2 className="text-xl font-light text-slate-900">Team Directory</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {team.length === 0 ? (
                <div className="col-span-full py-8 text-slate-400 font-light">Directory is empty.</div>
              ) : (
                team.map((m: any) => (
                  <div key={m.id} className="p-6 border border-slate-100 rounded-lg flex flex-col items-center text-center">
                    <ProfileAvatar url={m.avatar_url} name={m.full_name} className="h-20 w-20 text-2xl mb-4 bg-slate-50 text-slate-400 font-light" />
                    <h3 className="font-medium text-slate-900">{m.full_name}</h3>
                    <div className="text-xs text-slate-500 font-light mt-1">{m.email}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-4">{m.role}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─── MEETINGS ─── */}
        {activeTab === "meetings" && <MeetingsSection meetings={meetings} isLoading={meetingsQ.isLoading} isError={meetingsQ.isError} />}
        
        {/* ─── ANNOUNCEMENTS ─── */}
        {activeTab === "announcements" && (
          <div className="max-w-3xl animate-in fade-in duration-500">
            <div className="pb-6 border-b border-slate-100 mb-6">
              <h2 className="text-xl font-light text-slate-900">Announcements</h2>
            </div>
            <div className="space-y-8">
              {announcements.map((a: any) => (
                <div key={a.id} className="pb-8 border-b border-slate-50 last:border-0">
                  <div className="text-[11px] text-slate-400 uppercase tracking-widest mb-2">{new Date(a.created_at).toLocaleDateString()}</div>
                  <h3 className="text-lg font-medium text-slate-900 mb-3">{a.title}</h3>
                  <p className="text-sm text-slate-600 font-light leading-relaxed">{a.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── RESOURCES ─── */}
        {activeTab === "resources" && (
          <div className="max-w-4xl animate-in fade-in duration-500">
            <div className="pb-6 border-b border-slate-100 mb-6">
              <h2 className="text-xl font-light text-slate-900">Resources</h2>
            </div>
            <div className="space-y-4">
              {resources.length === 0 ? (
                <div className="py-8 text-slate-400 font-light">No resources available.</div>
              ) : (
                resources.map((r: any) => (
                  <div key={r.id} className="p-5 border border-slate-100 rounded-lg flex items-center justify-between group hover:border-slate-200 transition-colors">
                    <div>
                      <div className="font-medium text-slate-900">{r.title}</div>
                      {r.description && <div className="text-sm text-slate-500 font-light mt-1">{r.description}</div>}
                    </div>
                    <a href={r.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-slate-400 hover:text-slate-900 transition-colors">View</a>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─── FEEDBACKS ─── */}
        {activeTab === "feedbacks" && (
          <div className="max-w-2xl animate-in fade-in duration-500">
            <div className="pb-6 border-b border-slate-100 mb-6">
              <h2 className="text-xl font-light text-slate-900">Feedback</h2>
              <p className="text-sm text-slate-500 mt-2 font-light">Send private feedback to the administration team.</p>
            </div>
            <form onSubmit={handleSubmitFeedback} className="space-y-6">
              <Textarea 
                required 
                rows={8}
                className="bg-slate-50 border-transparent focus:border-slate-300 focus:ring-0 shadow-none resize-none font-light"
                placeholder="Type your message here..." 
                value={feedbackForm.content} 
                onChange={e => setFeedbackForm({ content: e.target.value })} 
              />
              <div className="flex justify-end">
                <Button type="submit" className="bg-slate-900 text-white hover:bg-slate-800">Send Message</Button>
              </div>
            </form>
          </div>
        )}

        {/* ─── CONTACT ─── */}
        {activeTab === "contact" && (
          <div className="max-w-4xl animate-in fade-in duration-500">
            <div className="pb-6 border-b border-slate-100 mb-8">
              <h2 className="text-xl font-light text-slate-900">Contact Directory</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 border border-slate-100 rounded-lg bg-slate-50/50">
                <h3 className="font-medium text-slate-900 mb-2">Human Resources</h3>
                <p className="text-sm text-slate-500 font-light mb-6">For leave, payroll, and policy inquiries.</p>
                <a href="mailto:hr@vyntyraconsultancyservices.in" className="text-sm font-medium text-slate-900 hover:underline">hr@vyntyraconsultancyservices.in</a>
              </div>
              <div className="p-8 border border-slate-100 rounded-lg bg-slate-50/50">
                <h3 className="font-medium text-slate-900 mb-2">IT Support</h3>
                <p className="text-sm text-slate-500 font-light mb-6">For technical issues or dashboard support.</p>
                <a href="mailto:support@vyntyraconsultancyservices.in" className="text-sm font-medium text-slate-900 hover:underline">support@vyntyraconsultancyservices.in</a>
              </div>
            </div>
          </div>
        )}

      </main>
      <FloatingAppsPanel />
    </div>
  );
}
