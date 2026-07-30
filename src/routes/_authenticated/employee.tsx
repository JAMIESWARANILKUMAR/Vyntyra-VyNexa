import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";


import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, ClipboardList, Clock, Mail, Bell, LogOut, Loader2,
  CheckCircle2, Circle, AlertCircle, TrendingUp, Video, CalendarDays,
  User, BarChart3, RefreshCw, Phone, MapPin, CalendarX2, Users,
  IndianRupee, MessageSquare, BookOpen, Fingerprint, FileText, Send, Download,
  Sparkles, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MonthlyCalendar } from "@/components/monthly-calendar";
import { MeetingsSection } from "@/components/meetings-section";
import { FloatingAppsPanel } from "@/components/floating-apps-panel";
import { AnalogClock } from "@/components/analog-clock";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

// Premium Status Badges
const TASK_STATUS_STYLES: Record<string, { badge: string; label: string }> = {
  pending:     { badge: "bg-slate-100 text-slate-600 border border-slate-200/60 shadow-sm",    label: "Pending" },
  in_progress: { badge: "bg-black text-white shadow-md shadow-black/20",        label: "In Progress" },
  completed:   { badge: "bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-sm", label: "Completed" },
  blocked:     { badge: "bg-rose-50 text-rose-700 border border-rose-200/60 shadow-sm",           label: "Blocked" },
};

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 15, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5,  } },
  exit: { opacity: 0, y: -10, filter: "blur(2px)", transition: { duration: 0.3,  } }
};

const itemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4,  } }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } }
};

function EmployeeDashboard() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // Security States
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // MFA States
  const [mfaStatus, setMfaStatus] = useState<"checking" | "enrolled" | "unenrolled" | "enrolling">("checking");
  const [mfaQrCode, setMfaQrCode] = useState<string | null>(null);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  useEffect(() => {
    async function checkMfa() {
      try {
        const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (error) throw error;
        if (data.currentLevel === 'aal2' || data.nextLevel === 'aal2') {
          setMfaStatus('enrolled');
        } else {
          setMfaStatus('unenrolled');
        }
      } catch (err) {
        console.error(err);
        setMfaStatus('unenrolled');
      }
    }
    checkMfa();
  }, []);


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

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
      if (error) throw error;
      toast.success("Password updated successfully");
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleEnrollMfa() {
    setMfaStatus("enrolling");
    try {
      // Clean up any unverified factors first
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors && factors.all) {
        const unverified = factors.all.filter((f: any) => f.status === 'unverified');
        for (const f of unverified) {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
      }

      const uniqueName = `Vyntyra Security ${Math.floor(Math.random() * 1000)}`;
      const { data, error } = await supabase.auth.mfa.enroll({ 
        factorType: 'totp', 
        friendlyName: uniqueName,
        issuer: 'careers.vyntyraconsultancyservices.in'
      });
      if (error) throw error;
      setMfaFactorId(data.id);
      setMfaQrCode(data.totp.uri); // Use the URI for QRCodeSVG, not the raw SVG string
    } catch (err: any) {
      toast.error(err.message || "Failed to enroll MFA");
      setMfaStatus("unenrolled");
    }
  }

  async function handleVerifyMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!mfaFactorId || !mfaCode) return;
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (challenge.error) throw challenge.error;
      
      const verify = await supabase.auth.mfa.verify({ factorId: mfaFactorId, challengeId: challenge.data.id, code: mfaCode });
      if (verify.error) throw verify.error;

      toast.success("Authenticator app successfully linked!");
      setMfaStatus("enrolled");
      setMfaQrCode(null);
      setMfaCode("");
    } catch (err: any) {
      toast.error(err.message || "Invalid authenticator code");
    }
  }


  async function handleDisableMfa() {
    if (!window.confirm("Are you sure you want to disable 2FA? This will make your account less secure.")) return;
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors && factors.all) {
        for (const f of factors.all) {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
      }
      toast.success("2FA has been disabled");
      setMfaStatus("unenrolled");
    } catch (err: any) {
      toast.error(err.message || "Failed to disable 2FA");
    }
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendanceLogs.find(a => a.date === todayStr);

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "tasks", label: `Tasks`, badge: pendingTasks.length },
    { id: "attendance", label: "Attendance" },
    { id: "leave", label: "Leaves" },
    { id: "payouts", label: "Payouts" },
    { id: "meetings", label: "Meetings" },
    { id: "announcements", label: `News`, badge: announcements.length },
    { id: "team", label: "Team" },
    { id: "resources", label: "Resources" },
    { id: "feedbacks", label: "Feedback" },
    { id: "contact", label: "Contact" },
    { id: "security", label: "Security" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-800 font-sans selection:bg-black selection:text-white">
      
      {/* Dynamic Header */}
      <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-xl border-b border-black/5 shadow-sm" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 bg-black rounded-lg shadow-md shadow-black/20 flex items-center justify-center text-white font-bold tracking-tighter">V</div>
            <div className="hidden lg:flex flex-col">
              <span className="text-sm font-semibold text-slate-900 tracking-tight leading-tight">{displayName}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">Employee Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <div className="text-[11px] font-medium text-slate-900">{email}</div>
                <div className="text-[10px] text-slate-400">Active Session</div>
              </div>
              <ProfileAvatar url={profile?.avatar_url} name={displayName} className="h-8 w-8 ring-2 ring-white shadow-sm" />
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-slate-500 hover:text-black hover:bg-black/5 rounded-full px-4 transition-colors">
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
        
        {/* Premium Animated Tabs */}
        <div className="w-full px-6 overflow-x-auto hide-scrollbar border-t border-black/5">
          <div className="max-w-7xl mx-auto flex items-center gap-2 py-3 relative">
            {TABS.map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`relative flex items-center shrink-0 px-4 py-2 text-[13px] font-medium rounded-full transition-colors duration-300 ${isActive ? "text-white" : "text-slate-500 hover:text-slate-900 hover:bg-black/5"}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-black rounded-full shadow-md"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {t.label}
                    {('badge' in t && t.badge !== undefined) && (t as any).badge > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                        {t.badge}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Marquee Notifications (Premium style) */}
      {announcements.length > 0 && (
        <div className="bg-black text-white text-[11px] uppercase tracking-widest py-2.5 overflow-hidden flex whitespace-nowrap">
          <div className="animate-marquee flex gap-12 shrink-0 min-w-full px-6">
            {announcements.map((a: any) => (
              <span key={a.id} className="inline-flex items-center gap-3">
                <Sparkles className="h-3 w-3 text-emerald-400" />
                <span className="font-semibold text-white/90">{a.type || 'Update'}</span>
                <span className="text-white/60 font-light">{a.title}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-10 relative">
        <AnimatePresence mode="wait">
          
          {/* ─── OVERVIEW ─── */}
          {activeTab === "overview" && (
            <motion.div key="overview" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-12">
              
              {/* Premium Hero Section */}
              <div className="relative overflow-hidden rounded-[2rem] bg-white border border-slate-100 p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="absolute top-0 right-0 p-32 bg-gradient-to-bl from-slate-100 to-transparent rounded-full opacity-50 blur-3xl pointer-events-none" />
                
                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-10">
                  <div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                      <h1 className="text-4xl md:text-5xl font-light tracking-tight text-slate-900 mb-2">
                        Welcome back,<br/><span className="font-semibold">{displayName.split(' ')[0]}</span>.
                      </h1>
                      <p className="text-slate-500 font-light flex items-center gap-4 mt-4">
                        <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 opacity-50"/> {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}</span>
                      </p>
                    </motion.div>
                  </div>
                  
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-8 md:gap-12 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 backdrop-blur-sm">
                    <div>
                      <div className="text-4xl font-light tracking-tighter text-slate-900">{tasks.length}</div>
                      <div className="text-[11px] text-slate-500 uppercase tracking-widest mt-1 font-medium">Total Tasks</div>
                    </div>
                    <div className="w-px h-12 bg-slate-200" />
                    <div>
                      <div className="text-4xl font-light tracking-tighter text-slate-900">{progress}%</div>
                      <div className="text-[11px] text-slate-500 uppercase tracking-widest mt-1 font-medium">Completed</div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Stats Row - Glassmorphism style */}
              <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Pending Tasks", value: pendingTasks.length, icon: <ClipboardList className="h-4 w-4" /> },
                  { label: "Present Days", value: attendanceLogs.length, icon: <Fingerprint className="h-4 w-4" /> },
                  { label: "Meetings", value: meetings.filter(m => new Date(m.scheduled_at) >= new Date()).length, icon: <Video className="h-4 w-4" /> },
                  { label: "Leave Requests", value: leaves.length, icon: <CalendarX2 className="h-4 w-4" /> },
                ].map((s, i) => (
                  <motion.div variants={itemVariants} key={i} className="group p-6 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-[0.03] transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                      {s.icon}
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 mb-4">{s.icon}</div>
                    <div className="text-3xl font-light text-slate-900 mb-1">{s.value}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">{s.label}</div>
                  </motion.div>
                ))}
              </motion.div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div variants={itemVariants} initial="initial" animate="animate" className="lg:col-span-1">
                  <div className="text-sm font-semibold tracking-wide text-slate-900 mb-4 uppercase">Calendar</div>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <MonthlyCalendar events={schedules} />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} initial="initial" animate="animate" className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-semibold tracking-wide text-slate-900 uppercase">Recent Tasks</div>
                    <Button variant="link" className="text-xs text-slate-500 hover:text-black" onClick={() => setActiveTab("tasks")}>View All ↗</Button>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="divide-y divide-slate-50">
                      {tasks.slice(0, 4).map((task: any) => {
                        const s = TASK_STATUS_STYLES[task.status] || TASK_STATUS_STYLES.pending;
                        return (
                          <div key={task.id} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                            <div className="text-sm font-medium text-slate-800">{task.title}</div>
                            <span className={`text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider font-bold ${s.badge}`}>{s.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ─── TASKS ─── */}
          {activeTab === "tasks" && (
            <motion.div key="tasks" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-light tracking-tight text-slate-900">Task Management</h2>
              </div>
              <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
                {tasks.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-light bg-white rounded-2xl border border-slate-100 shadow-sm">No tasks assigned.</div>
                ) : (
                  tasks.map((task: any) => {
                    const s = TASK_STATUS_STYLES[task.status] || TASK_STATUS_STYLES.pending;
                    return (
                      <motion.div variants={itemVariants} key={task.id} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-start justify-between gap-6 group">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-slate-900">{task.title}</h3>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold ${s.badge}`}>{s.label}</span>
                          </div>
                          {task.description && <p className="text-sm text-slate-500 font-light leading-relaxed max-w-2xl">{task.description}</p>}
                        </div>
                        <div className="shrink-0">
                          {task.status === "pending" && <Button variant="outline" size="sm" onClick={() => markTaskStatus(task.id, "in_progress")} className="rounded-full shadow-sm hover:bg-black hover:text-white transition-colors">Start Task</Button>}
                          {task.status === "in_progress" && <Button size="sm" className="bg-black text-white hover:bg-slate-800 rounded-full shadow-md" onClick={() => markTaskStatus(task.id, "completed")}>Mark Complete</Button>}
                          {task.status === "completed" && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full"><CheckCircle2 className="h-3.5 w-3.5" /> Done</span>}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            </motion.div>
          )}

          {/* ─── ATTENDANCE ─── */}
          {activeTab === "attendance" && (
            <motion.div key="attendance" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="p-8 border border-slate-100 rounded-2xl bg-white shadow-sm text-center relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
                  <Fingerprint className="h-10 w-10 text-slate-300 mx-auto mb-6" />
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-6 font-bold">Daily Attendance</div>
                  
                  {todayAttendance ? (
                    todayAttendance.clock_out ? (
                      <div className="bg-slate-50 text-slate-600 border border-slate-100 p-4 rounded-xl text-sm font-medium">Shift Completed</div>
                    ) : (
                      <Button 
                        variant="outline"
                        onClick={handleClockOut} disabled={isClocking}
                        className="w-full h-12 rounded-xl border-2 border-black text-black hover:bg-black hover:text-white transition-all font-semibold uppercase tracking-wider text-xs"
                      >
                        {isClocking ? <Loader2 className="h-4 w-4 animate-spin"/> : "Clock Out"}
                      </Button>
                    )
                  ) : (
                    <Button 
                      onClick={handleClockIn} disabled={isClocking}
                      className="w-full h-12 rounded-xl bg-black hover:bg-slate-800 text-white shadow-lg shadow-black/20 font-semibold uppercase tracking-wider text-xs transition-all hover:-translate-y-0.5"
                    >
                      {isClocking ? <Loader2 className="h-4 w-4 animate-spin"/> : "Clock In"}
                    </Button>
                  )}
                  
                  {todayAttendance && (
                    <div className="text-[11px] font-medium text-slate-500 space-y-2 mt-6 bg-slate-50 p-4 rounded-xl">
                      {todayAttendance.clock_in && <div className="flex justify-between"><span>In</span> <span className="text-slate-900">{new Date(todayAttendance.clock_in).toLocaleTimeString()}</span></div>}
                      {todayAttendance.clock_out && <div className="flex justify-between border-t border-slate-200 pt-2"><span>Out</span> <span className="text-slate-900">{new Date(todayAttendance.clock_out).toLocaleTimeString()}</span></div>}
                    </div>
                  )}
                </div>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-xl font-light text-slate-900 mb-6">Attendance Log</h2>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="divide-y divide-slate-50">
                    {attendanceLogs.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 font-light">No records found.</div>
                    ) : (
                      attendanceLogs.map((log: any) => (
                        <div key={log.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                          <div className="text-sm font-medium text-slate-900">{new Date(log.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</div>
                          <div className="text-sm text-slate-500 font-light font-mono bg-slate-100 px-3 py-1 rounded-md">
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
            </motion.div>
          )}

          {/* ─── LEAVES ─── */}
          {activeTab === "leave" && (
            <motion.div key="leave" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Request Time Off</h2>
                  <form onSubmit={handleSubmitLeave} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Start Date</label>
                      <Input type="date" className="bg-slate-50 border-slate-100 focus:ring-black focus:border-black rounded-xl" required value={leaveForm.start_date} onChange={e => setLeaveForm({...leaveForm, start_date: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">End Date</label>
                      <Input type="date" className="bg-slate-50 border-slate-100 focus:ring-black focus:border-black rounded-xl" required value={leaveForm.end_date} onChange={e => setLeaveForm({...leaveForm, end_date: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reason</label>
                      <Textarea className="bg-slate-50 border-slate-100 focus:ring-black focus:border-black rounded-xl resize-none font-light" required placeholder="Why do you need time off?" value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} />
                    </div>
                    <Button type="submit" className="w-full rounded-xl bg-black text-white hover:bg-slate-800 shadow-md h-11">Submit Request</Button>
                  </form>
                </div>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-xl font-light text-slate-900 mb-6">Leave History</h2>
                <div className="space-y-4">
                  {leaves.length === 0 ? (
                    <div className="py-12 bg-white rounded-2xl border border-slate-100 shadow-sm text-center text-slate-400 font-light">No leave history.</div>
                  ) : (
                    leaves.map((leave: any) => (
                      <motion.div variants={itemVariants} initial="initial" animate="animate" key={leave.id} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-sm font-semibold text-slate-900">
                            {new Date(leave.start_date).toLocaleDateString()} <span className="mx-2 text-slate-300 font-normal">to</span> {new Date(leave.end_date).toLocaleDateString()}
                          </div>
                          <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${leave.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : leave.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{leave.status}</span>
                        </div>
                        <p className="text-sm text-slate-500 font-light">{leave.reason}</p>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── PAYOUTS ─── */}
          {activeTab === "payouts" && (
            <motion.div key="payouts" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-2xl font-light tracking-tight text-slate-900 mb-8">Payouts</h2>
              <div className="space-y-4">
                {payouts.length === 0 ? (
                  <div className="py-12 bg-white rounded-2xl border border-slate-100 shadow-sm text-center text-slate-400 font-light">No payouts recorded.</div>
                ) : (
                  payouts.map((payout: any) => (
                    <motion.div variants={itemVariants} initial="initial" animate="animate" key={payout.id} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                      <div className="flex items-center gap-6">
                        <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <IndianRupee className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-2xl font-medium text-slate-900 tracking-tight">₹{payout.amount}</div>
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{payout.type} • {new Date(payout.date).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${payout.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{payout.status}</span>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-black hover:bg-slate-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Download className="h-4 w-4" /></Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ─── TEAM ─── */}
          {activeTab === "team" && (
            <motion.div key="team" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <h2 className="text-2xl font-light tracking-tight text-slate-900 mb-8">Team Directory</h2>
              <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {team.length === 0 ? (
                  <div className="col-span-full py-12 bg-white rounded-2xl border border-slate-100 shadow-sm text-center text-slate-400 font-light">Directory is empty.</div>
                ) : (
                  team.map((m: any) => (
                    <motion.div variants={itemVariants} key={m.id} className="group p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex flex-col items-center text-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
                      <ProfileAvatar url={m.avatar_url} name={m.full_name} className="h-24 w-24 text-3xl mb-5 shadow-inner ring-4 ring-slate-50 transition-transform duration-500 group-hover:scale-105" />
                      <h3 className="font-semibold text-slate-900 text-lg">{m.full_name}</h3>
                      <div className="text-sm text-slate-500 font-light mt-1">{m.email}</div>
                      <div className="mt-5 text-[10px] font-bold px-3 py-1 bg-slate-100 text-slate-600 rounded-full uppercase tracking-widest">{m.role}</div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </motion.div>
          )}

          {/* ─── MEETINGS ─── */}
          {activeTab === "meetings" && (
            <motion.div key="meetings" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <MeetingsSection meetings={meetings} isLoading={meetingsQ.isLoading} isError={meetingsQ.isError} />
            </motion.div>
          )}
          
          {/* ─── ANNOUNCEMENTS ─── */}
          {activeTab === "announcements" && (
            <motion.div key="announcements" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-light tracking-tight text-slate-900 mb-8">Company News</h2>
              <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
                {announcements.map((a: any) => (
                  <motion.div variants={itemVariants} key={a.id} className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{new Date(a.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
                    <h3 className="text-xl font-medium text-slate-900 mb-4">{a.title}</h3>
                    <p className="text-slate-600 font-light leading-relaxed whitespace-pre-wrap">{a.body}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* ─── RESOURCES ─── */}
          {activeTab === "resources" && (
            <motion.div key="resources" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-light tracking-tight text-slate-900 mb-8">Resources & Documents</h2>
              <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {resources.length === 0 ? (
                  <div className="col-span-full py-12 bg-white rounded-2xl border border-slate-100 shadow-sm text-center text-slate-400 font-light">No resources available.</div>
                ) : (
                  resources.map((r: any) => (
                    <motion.div variants={itemVariants} key={r.id} className="group p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200 transition-all flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{r.title}</div>
                          {r.description && <div className="text-xs text-slate-500 font-light mt-1 line-clamp-2">{r.description}</div>}
                        </div>
                      </div>
                      <a href={r.url} target="_blank" rel="noreferrer" className="shrink-0 h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-black hover:text-white transition-colors">
                        <Download className="h-4 w-4" />
                      </a>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </motion.div>
          )}

          {/* ─── FEEDBACKS ─── */}
          {activeTab === "feedbacks" && (
            <motion.div key="feedbacks" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-light tracking-tight text-slate-900 mb-3">Feedback</h2>
                <p className="text-slate-500 font-light">Send direct, private feedback to the administration team.</p>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-black/[0.03]">
                <form onSubmit={handleSubmitFeedback} className="space-y-6">
                  <Textarea 
                    required 
                    rows={8}
                    className="bg-slate-50/50 border-slate-100 focus:ring-black focus:border-black rounded-2xl resize-none font-light p-4 text-base"
                    placeholder="Share your thoughts, report an issue, or suggest an improvement..." 
                    value={feedbackForm.content} 
                    onChange={e => setFeedbackForm({ content: e.target.value })} 
                  />
                  <Button type="submit" className="w-full h-12 rounded-xl bg-black text-white hover:bg-slate-800 shadow-md font-semibold tracking-wide flex items-center justify-center gap-2">
                    <Send className="h-4 w-4" /> Send Message
                  </Button>
                </form>
              </div>
            </motion.div>
          )}

          {/* ─── CONTACT ─── */}
          {activeTab === "contact" && (
            <motion.div key="contact" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-light tracking-tight text-slate-900 mb-8">Contact Directory</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-10 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-black/[0.04] transition-all group">
                  <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <User className="h-8 w-8 text-slate-700" />
                  </div>
                  <h3 className="text-xl font-medium text-slate-900 mb-2">Human Resources</h3>
                  <p className="text-slate-500 font-light mb-8">For leave, payroll, and policy inquiries.</p>
                  <a href="mailto:hr@vyntyraconsultancyservices.in" className="text-sm font-semibold text-slate-900 underline underline-offset-4 decoration-slate-200 hover:decoration-black transition-colors">hr@vyntyraconsultancyservices.in</a>
                </div>
                <div className="p-10 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-black/[0.04] transition-all group">
                  <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <AlertCircle className="h-8 w-8 text-slate-700" />
                  </div>
                  <h3 className="text-xl font-medium text-slate-900 mb-2">IT Support</h3>
                  <p className="text-slate-500 font-light mb-8">For technical issues or dashboard support.</p>
                  <a href="mailto:support@vyntyraconsultancyservices.in" className="text-sm font-semibold text-slate-900 underline underline-offset-4 decoration-slate-200 hover:decoration-black transition-colors">support@vyntyraconsultancyservices.in</a>
                </div>
              </div>
            </motion.div>
          )}


          {activeTab === "security" && (
            <motion.div key="security" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="max-w-4xl mx-auto space-y-8">
              <h2 className="text-2xl font-light tracking-tight text-slate-900 mb-8">Security Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Change Password Card */}
                <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-black/[0.04] transition-all">
                  <h3 className="text-xl font-medium text-slate-900 mb-2">Change Password</h3>
                  <p className="text-slate-500 font-light mb-6">Update your login password.</p>
                  
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <Input type="password" required minLength={6} value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="bg-slate-50 border-slate-100 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm New Password</Label>
                      <Input type="password" required minLength={6} value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} className="bg-slate-50 border-slate-100 rounded-xl" />
                    </div>
                    <Button type="submit" disabled={isChangingPassword} className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                      {isChangingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </div>

                {/* MFA / 2FA Card */}
                <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-black/[0.04] transition-all">
                  <h3 className="text-xl font-medium text-slate-900 mb-2">Two-Factor Authentication</h3>
                  <p className="text-slate-500 font-light mb-6">Enhance your account security using Microsoft or Google Authenticator.</p>
                  
                  {mfaStatus === "checking" ? (
                    <div className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Checking security status...</div>
                  ) : mfaStatus === "enrolled" ? (
                    <div className="space-y-4">
                      <div className="bg-emerald-50 text-emerald-700 p-6 rounded-2xl border border-emerald-100 flex flex-col gap-2">
                        <div className="font-medium flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" /> 2FA is Enabled
                        </div>
                        <p className="text-sm font-light">Your account is secured with a TOTP Authenticator app.</p>
                      </div>
                      <Button onClick={handleDisableMfa} variant="outline" className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">Disable 2FA</Button>
                    </div>
                  ) : mfaStatus === "enrolling" && mfaQrCode ? (
                    <div className="space-y-6">
                      <div className="text-center space-y-2">
                        <p className="text-sm font-medium text-slate-900">Scan this QR Code</p>
                        <p className="text-xs text-slate-500">Open Google or Microsoft Authenticator and scan.</p>
                      </div>
                      <div className="flex justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <QRCodeSVG value={mfaQrCode} size={160} />
                      </div>
                      <form onSubmit={handleVerifyMfa} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Verification Code</Label>
                          <Input required type="text" placeholder="e.g. 123456" value={mfaCode} onChange={e => setMfaCode(e.target.value)} className="bg-slate-50 border-slate-100 rounded-xl text-center tracking-widest text-lg font-mono" />
                        </div>
                        <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl">Verify and Enable</Button>
                      </form>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-slate-500 font-light">Your account is currently using standard password authentication. Enable 2FA for an extra layer of security.</p>
                      <Button onClick={handleEnrollMfa} variant="outline" className="w-full rounded-xl border-slate-200">Set up Authenticator App</Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
      <FloatingAppsPanel />
    </div>
  );
}
