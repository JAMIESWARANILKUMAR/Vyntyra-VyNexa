import { listAssignedInterviews, submitInterviewFeedback } from "@/lib/applications.functions";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";


import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, ClipboardList, Clock, Mail, Bell, LogOut, Loader2,
  CheckCircle2, Circle, AlertCircle, TrendingUp, Video, CalendarDays,
  User, BarChart3, RefreshCw, Phone, MapPin, CalendarX2, Users,
  IndianRupee, MessageSquare, BookOpen, Fingerprint, FileText, Send, Download,
  Sparkles, Zap, Wallet, ExternalLink, VolumeX, ShieldCheck, Laptop, Receipt,
  LifeBuoy, Award, GraduationCap, FileCheck, HelpCircle, Layers, CreditCard,
  Building2, Plus, ArrowUpRight, HeartHandshake, CheckSquare, FileUp, Printer, Shield, Radio, Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { RichContentRenderer } from "@/components/rich-content-renderer";
import { MonthlyCalendar } from "@/components/monthly-calendar";
import { MeetingsSection } from "@/components/meetings-section";
import { FirstLoginWelcomeModal } from "@/components/first-login-welcome-modal";
import { FloatingAppsPanel } from "@/components/floating-apps-panel";
import { AnalogClock } from "@/components/analog-clock";
import { ProfileAvatar } from "@/components/profile-avatar";
import { PayslipModal } from "@/components/payslip-modal";
import { IdCardModal } from "@/components/id-card-modal";
import { PwaInstallBanner } from "@/components/pwa-install-banner";
import { EmployeeReferEarn } from "@/components/employee-refer-earn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { 
  listTasks, listMeetings, listSchedules, listAnnouncements,
  requestLeave, listMyLeaves, listMyPayouts, clockIn, clockOut, getMyAttendance,
  listTeamMembers, createFeedback, listResources, listMyExpenses, createExpenseClaim,
  listMySupportTickets, createSupportTicket, listKudos, createKudos, updateUserProfile,
  assignManualTaskToInterns, getMenteeAttendance,
  listAssignedSupportQueries, updateSupportProgressNotes, requestSupportMeeting,
  reviewDeadlineExtension, getDashboardSettings,
  listInternTasksForMentor, updateTaskExecution,
  listHolidays, createMeeting, updateMeeting
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



interface BankAd {
  videoId: string;
  title: string;
  slogan: string;
  feature: string;
}

function BankAdCard({ 
  bankName, 
  logoUrl, 
  ads, 
  link, 
  themeColor, 
  borderColor, 
  bgColor,
  accountType,
  branches,
  bankSupport,
  vyntyraManager = "Available Soon"
}: { 
  bankName: string; 
  logoUrl: string; 
  ads: BankAd[]; 
  link: string; 
  themeColor: string; 
  borderColor: string; 
  bgColor: string;
  accountType: string;
  branches: string[];
  bankSupport: string;
  vyntyraManager?: string;
}) {
  const [activeAdIndex, setActiveAdIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveAdIndex((prevIndex) => (prevIndex + 1) % ads.length);
          return 0;
        }
        return prev + 1.25; // 8 seconds per ad (100 / 1.25 * 100ms)
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, [activeAdIndex, ads.length]);

  const activeAd = ads[activeAdIndex];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative overflow-hidden rounded-3xl border ${borderColor} bg-gradient-to-br ${bgColor} to-white p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300 w-full`}
    >
      {/* Decorative background blur */}
      <div 
        className="absolute top-0 right-0 w-72 h-72 rounded-full filter blur-[100px] opacity-10 pointer-events-none"
        style={{ backgroundColor: themeColor }}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Side: YouTube Embed (Cropped to hide UI controls and titles) */}
        <div className="lg:col-span-5 flex flex-col justify-center w-full">
          {/* Stories indicators */}
          <div className="flex gap-1.5 mb-3 px-1">
            {ads.map((_, index) => (
              <div key={index} className="h-1 flex-1 bg-slate-200/50 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-100"
                  style={{ 
                    width: index === activeAdIndex ? `${progress}%` : index < activeAdIndex ? '100%' : '0%',
                    backgroundColor: themeColor
                  }}
                />
              </div>
            ))}
          </div>

          {/* Autoplay Video Crop Container */}
          <div 
            className="relative overflow-hidden w-full aspect-video rounded-2xl shadow-md border border-slate-100/50 bg-black z-0 lightning-glow"
            style={{ '--glow-color': themeColor } as React.CSSProperties}
          >
            {activeAd.videoId.endsWith(".mp4") || activeAd.videoId.startsWith("/videos/") ? (
              <video 
                key={activeAd.videoId}
                src={activeAd.videoId}
                autoPlay 
                muted 
                loop 
                playsInline
                ref={(el) => {
                  if (el) {
                    el.muted = true;
                    el.play().catch(() => {});
                  }
                }}
                className="absolute inset-0 w-full h-full object-cover z-10"
              />
            ) : (
              <iframe 
                src={`https://www.youtube.com/embed/${activeAd.videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${activeAd.videoId}&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&showinfo=0&fs=0&autohide=1`} 
                className="absolute top-[-25%] left-[-10%] w-[120%] h-[150%] pointer-events-none z-10"
                allow="autoplay; encrypted-media"
                tabIndex={-1}
              />
            )}
            {/* Click Blocker Overlay - Capture pointer-events so video/iframe never gets hover or touch events */}
            <div className="absolute inset-0 bg-transparent z-20 pointer-events-auto" />
            
            {/* Custom Overlay Tag */}
            <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 rounded-md text-[9px] text-white flex items-center gap-1 backdrop-blur-sm pointer-events-none uppercase tracking-wider font-semibold z-30">
              <VolumeX className="w-3.5 h-3.5" /> Live Ad
            </div>
          </div>
        </div>

        {/* Right Side: Premium Details, Instructions, and Call to Action */}
        <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-10 flex items-center">
                {logoError ? (
                  <div className="text-xl font-black tracking-tight" style={{ color: themeColor }}>
                    {bankName.toUpperCase()}
                  </div>
                ) : (
                  <img 
                    src={logoUrl} 
                    alt={bankName} 
                    className="h-full object-contain" 
                    onError={() => setLogoError(true)} 
                  />
                )}
              </div>
              <span className="text-[9px] px-2.5 py-1 bg-slate-100 text-slate-600 font-bold uppercase tracking-wider rounded-full border border-slate-200/60">
                Preferred Partner
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900 tracking-tight transition-all duration-300">{activeAd.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed transition-all duration-300">{activeAd.slogan}</p>
            </div>

            {/* Instruction Grid Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-100">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Type</div>
                <div className="text-xs font-semibold text-slate-700">{accountType}</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Key Reward</div>
                <div className="text-xs font-semibold text-slate-700">{activeAd.feature}</div>
              </div>

              <div className="space-y-1 border-t border-slate-200/50 pt-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Bank Support</div>
                <div className="text-xs font-semibold text-slate-700">{bankSupport}</div>
              </div>

              <div className="space-y-1 border-t border-slate-200/50 pt-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vyntyra Account Manager</div>
                <div className="text-xs font-semibold text-slate-600 italic">{vyntyraManager}</div>
              </div>

              <div className="space-y-1 md:col-span-2 border-t border-slate-200/50 pt-2.5 mt-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available Branch Locations</div>
                <div className="text-xs text-slate-600 font-medium leading-relaxed">
                  {branches.join(", ")}
                </div>
              </div>
            </div>
          </div>

          <a href={link} target="_self" className="block w-full sm:w-fit sm:min-w-[200px]">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
              className="w-full py-3 px-6 rounded-xl text-white font-medium text-sm transition-colors shadow-md relative overflow-hidden group flex items-center justify-center gap-2"
              style={{ backgroundColor: themeColor }}
            >
              <span className="relative z-10 flex items-center gap-2 font-semibold">
                Open Account Now <ExternalLink className="w-4 h-4" />
              </span>
              <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            </motion.button>
          </a>
        </div>
      </div>



    </motion.div>
  );
}
function EmployeeDashboard() {
  const qc = useQueryClient();
  const sessionQ = useQuery({ queryKey: ["session"], queryFn: async () => (await supabase.auth.getSession()).data.session });
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [scrolled, setScrolled] = useState(false);
  const [selectedQueryToResolve, setSelectedQueryToResolve] = useState<any>(null);
  const [progressNotesInput, setProgressNotesInput] = useState<string>("");
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);
  const [isSchedulingMeeting, setIsSchedulingMeeting] = useState(false);
  const [selectedInternForTasks, setSelectedInternForTasks] = useState<any>(null);
  const [internTasksList, setInternTasksList] = useState<any[]>([]);
  const [isLoadingInternTasks, setIsLoadingInternTasks] = useState(false);
  const doReviewDeadlineExtension = useServerFn(reviewDeadlineExtension);
  const doCreateMeeting = useServerFn(createMeeting);

  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    title: "",
    description: "",
    meeting_link: "",
    date: new Date().toISOString().split("T")[0],
    from_time: "10:00",
    to_time: "10:45",
    target_role: "all" as "employee" | "intern" | "all" | "individual",
    target_user_id: "",
    send_email_notification: true,
  });
  const [isSavingMeeting, setIsSavingMeeting] = useState(false);

  async function handleScheduleMeetingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!meetingForm.title || !meetingForm.meeting_link || !meetingForm.date || !meetingForm.from_time) {
      toast.error("Please fill in meeting title, link, date, and from-time.");
      return;
    }

    setIsSavingMeeting(true);
    try {
      const startIso = new Date(`${meetingForm.date}T${meetingForm.from_time}:00`).toISOString();
      let endIso = meetingForm.to_time ? new Date(`${meetingForm.date}T${meetingForm.to_time}:00`).toISOString() : null;

      let durationMins = 30;
      if (endIso) {
        const diffMs = new Date(endIso).getTime() - new Date(startIso).getTime();
        if (diffMs > 0) {
          durationMins = Math.round(diffMs / (60 * 1000));
        } else {
          endIso = new Date(new Date(startIso).getTime() + 30 * 60 * 1000).toISOString();
        }
      }

      let cleanLink = meetingForm.meeting_link.trim();
      if (!/^https?:\/\//i.test(cleanLink)) {
        cleanLink = `https://${cleanLink}`;
      }

      await doCreateMeeting({
        data: {
          title: meetingForm.title.trim(),
          description: meetingForm.description || null,
          meeting_link: cleanLink,
          scheduled_at: startIso,
          end_at: endIso,
          duration_minutes: durationMins,
          target_role: meetingForm.target_role,
          target_user_id: meetingForm.target_role === "individual" && meetingForm.target_user_id ? meetingForm.target_user_id : null,
          send_email_notification: meetingForm.send_email_notification,
        }
      });

      toast.success(
        meetingForm.send_email_notification
          ? "Meeting scheduled & automated email invitations dispatched!"
          : "Meeting scheduled successfully!"
      );
      setMeetingModalOpen(false);
      setMeetingForm({
        title: "",
        description: "",
        meeting_link: "",
        date: new Date().toISOString().split("T")[0],
        from_time: "10:00",
        to_time: "10:45",
        target_role: "all",
        target_user_id: "",
        send_email_notification: true,
      });
      qc.invalidateQueries({ queryKey: ["my-meetings"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule meeting");
    } finally {
      setIsSavingMeeting(false);
    }
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Realtime subscription for meetings table to auto-refresh meetings
  useEffect(() => {
    const channel = supabase
      .channel("employee-meetings-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meetings" },
        () => {
          qc.invalidateQueries({ queryKey: ["my-meetings"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  // Realtime subscription for support_queries table to auto-refresh assigned queries
  useEffect(() => {
    const userId = sessionQ.data?.user?.id;
    if (!userId) return;
    const supportChannel = supabase
      .channel(`employee-support-updates-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_queries", filter: `assigned_employee_id=eq.${userId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["assigned-support-queries", userId] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(supportChannel);
    };
  }, [sessionQ.data?.user?.id, qc]);

  const fetchInterviews = useServerFn(listAssignedInterviews);
  const sendFeedback = useServerFn(submitInterviewFeedback);

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
  const fetchMenteeAttendance = useServerFn(getMenteeAttendance);
  const assignInternTask = useServerFn(assignManualTaskToInterns);
  const fetchTeam = useServerFn(listTeamMembers);
  const doCreateFeedback = useServerFn(createFeedback);
  const fetchResources = useServerFn(listResources);
  const fetchExpenses = useServerFn(listMyExpenses);
  const doCreateExpense = useServerFn(createExpenseClaim);
  const fetchTickets = useServerFn(listMySupportTickets);
  const doCreateTicket = useServerFn(createSupportTicket);
  const fetchKudos = useServerFn(listKudos);
  const doCreateKudos = useServerFn(createKudos);
  const doUpdateProfile = useServerFn(updateUserProfile);

  const fetchAssignedSupportQueries = useServerFn(listAssignedSupportQueries);
  const doUpdateSupportProgressNotes = useServerFn(updateSupportProgressNotes);
  const doRequestSupportMeeting = useServerFn(requestSupportMeeting);

  const fetchHolidays = useServerFn(listHolidays);
  const holidaysQ = useQuery({ queryKey: ["company-holidays"], queryFn: () => fetchHolidays() });

  const tasksQ = useQuery({ queryKey: ["my-tasks"], queryFn: () => fetchTasks() });
  const meetingsQ = useQuery({ queryKey: ["my-meetings"], queryFn: () => fetchMeetings() });
  const schedulesQ = useQuery({ queryKey: ["my-schedules"], queryFn: () => fetchSchedules() });
  const announcementsQ = useQuery({ queryKey: ["my-announcements"], queryFn: () => fetchAnnouncements() });

  const assignedSupportQueriesQ = useQuery({
    queryKey: ["assigned-support-queries", sessionQ.data?.user?.id],
    queryFn: () => fetchAssignedSupportQueries(),
    enabled: !!sessionQ.data?.user?.id
  });
  const assignedSupportQueries: any[] = assignedSupportQueriesQ.data || [];
  const leavesQ = useQuery({ queryKey: ["my-leaves"], queryFn: () => fetchLeaves() });
  const payoutsQ = useQuery({ queryKey: ["my-payouts"], queryFn: () => fetchPayouts() });
  const attendanceQ = useQuery({ queryKey: ["my-attendance"], queryFn: () => fetchAttendance() });
  const teamQ = useQuery({ queryKey: ["team-members"], queryFn: () => fetchTeam() });
  const resourcesQ = useQuery({ queryKey: ["resources"], queryFn: () => fetchResources() });
  const expensesQ = useQuery({ queryKey: ["my-expenses"], queryFn: () => fetchExpenses() });
  const ticketsQ = useQuery({ queryKey: ["my-tickets"], queryFn: () => fetchTickets() });
  const kudosQ = useQuery({ queryKey: ["kudos-feed"], queryFn: () => fetchKudos() });
  const internsQ = useQuery({
    queryKey: ["my-interns", sessionQ.data?.user?.id],
    queryFn: async () => {
      if (!sessionQ.data?.user?.id) return [];
      const { data } = await supabase.from('profiles').select('*').eq('mentor_id', sessionQ.data.user.id);
      return data || [];
    },
    enabled: !!sessionQ.data?.user?.id
  });

  const tasks: any[] = tasksQ.data || [];
  const meetings: any[] = meetingsQ.data || [];
  const schedules: any[] = schedulesQ.data || [];
  const announcements: any[] = announcementsQ.data || [];
  const leaves: any[] = leavesQ.data || [];
  const payouts: any[] = payoutsQ.data || [];
  const attendanceLogs: any[] = attendanceQ.data || [];
  const team: any[] = teamQ.data || [];
  const resources: any[] = resourcesQ.data || [];
  const expenses: any[] = expensesQ.data || [];
  const tickets: any[] = ticketsQ.data || [];
  const kudosList: any[] = kudosQ.data || [];
  const myInterns: any[] = internsQ.data || [];

  const session = sessionQ.data;
  const email = session?.user?.email || "";
  
  const [interviewsFeedback, setInterviewsFeedback] = useState<Record<string, { summary: string; remarks: string }>>({});

  const interviewsQ = useQuery({
    queryKey: ["assigned-interviews"],
    queryFn: () => fetchInterviews(),
    enabled: !!session?.user?.id,
  });
  const assignedInterviews = interviewsQ.data || [];

  const feedbackMut = useMutation({
    mutationFn: (args: { applicationId: string; summary: string; remarks: string }) => sendFeedback({ data: args }),
    onSuccess: () => {
      toast.success("Interview feedback submitted successfully");
      qc.invalidateQueries({ queryKey: ["assigned-interviews"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit feedback");
    }
  });
  
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
  
  const todayStr_ = new Date().toISOString().split('T')[0];
  const isBeforeStart = profile?.start_date && todayStr_ < profile.start_date.split('T')[0];
  const isAfterEnd = profile?.end_date && todayStr_ > profile.end_date.split('T')[0];
  const isClockingDisabled = isBeforeStart || isAfterEnd;
  const clockingDisabledReason = isBeforeStart ? "Employment has not started" : (isAfterEnd ? "Employment has ended" : "");

  const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const progress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const [leaveForm, setLeaveForm] = useState({ start_date: "", end_date: "", reason: "" });
  const [feedbackForm, setFeedbackForm] = useState({ content: "" });

  // ESS Enterprise Form States
  const [expenseForm, setExpenseForm] = useState({ title: "", category: "Travel" as any, amount: "", date: "", receipt_url: "", notes: "" });
  const [ticketForm, setTicketForm] = useState({ category: "IT Support" as any, priority: "Medium" as any, subject: "", description: "" });
  const [kudosForm, setKudosForm] = useState({ receiver_id: "", badge: "Star Performer" as any, message: "" });
  const [profileForm, setProfileForm] = useState({ phone: "", address: "", emergency_contact: "", bank_details: "" });
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);
  const [isPayslipOpen, setIsPayslipOpen] = useState(false);
  const [isIdCardOpen, setIsIdCardOpen] = useState(false);

  function openPayslipModal(payout?: any) {
    const amt = payout?.amount || 75000;
    const basic = Math.round(amt * 0.5);
    const hra = Math.round(amt * 0.3);
    const special = amt - basic - hra;
    setSelectedPayslip({
      payoutId: payout?.id || "PAY-" + Math.floor(100000 + Math.random() * 900000),
      employeeName: displayName,
      employeeId: session?.user?.id?.slice(0, 8).toUpperCase() || "VY-EMP-1001",
      designation: "Software Engineer / Senior Associate",
      department: "Engineering & Technology",
      email: email,
      bankDetails: profile?.bank_details || "Kotak Mahindra Bank · A/C 882101923 · IFSC: KKBK0001823",
      payPeriod: payout?.date ? new Date(payout.date).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
      paymentDate: payout?.date ? new Date(payout.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      basicSalary: basic,
      hra: hra,
      specialAllowance: special,
      pfDeduction: 1800,
      professionalTax: 200,
      tds: Math.round(amt * 0.05),
      netPay: amt
    });
    setIsPayslipOpen(true);
  }

  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [isSubmittingKudos, setIsSubmittingKudos] = useState(false);

  async function handleSubmitExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount || !expenseForm.date) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSubmittingExpense(true);
    try {
      await doCreateExpense({
        data: {
          title: expenseForm.title,
          category: expenseForm.category,
          amount: parseFloat(expenseForm.amount),
          date: expenseForm.date,
          receipt_url: expenseForm.receipt_url || undefined,
          notes: expenseForm.notes || undefined,
        }
      });
      toast.success("Expense claim submitted!");
      setExpenseForm({ title: "", category: "Travel", amount: "", date: "", receipt_url: "", notes: "" });
      qc.invalidateQueries({ queryKey: ["my-expenses"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit expense claim");
    } finally {
      setIsSubmittingExpense(false);
    }
  }

  const ticketMutation = useMutation({
    mutationFn: async (payload: { category: string; priority: string; subject: string; description: string }) => {
      return doCreateTicket({ data: payload });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-support"] });
      toast.success("Support ticket created!");
      setIsTicketModalOpen(false);
      setTicketSubject("");
      setTicketCategory("HR");
      setTicketDescription("");
    },
    onError: (err: Error) => toast.error(err.message)
  });

  const assignTaskMutation = useMutation({
    mutationFn: async (payload: { title: string; description: string; priority: "low"|"medium"|"high"; due_date: string; target_intern_ids: string[] }) => {
      return assignInternTask({ data: payload });
    },
    onSuccess: (res) => {
      toast.success(`Task successfully assigned to ${res.count} intern(s).`);
      setIsTaskModalOpen(false);
      setTaskTitle("");
      setTaskDesc("");
      setSelectedInterns([]);
      setTargetInternId(null);
    },
    onError: (err: Error) => toast.error(err.message)
  });

  const handleAssignTask = (internId?: string) => {
    if (internId) {
      setTargetInternId(internId);
    } else {
      setTargetInternId(null);
      if (selectedInterns.length === 0) {
        toast.error("Please select at least one intern to assign a task.");
        return;
      }
    }
    setIsTaskModalOpen(true);
  };

  const submitAssignTask = () => {
    if (!taskTitle) {
      toast.error("Task title is required.");
      return;
    }
    const ids = targetInternId ? [targetInternId] : selectedInterns;
    assignTaskMutation.mutate({
      title: taskTitle,
      description: taskDesc,
      priority: taskPriority,
      due_date: taskDueDate,
      target_intern_ids: ids
    });
  };

  const handleViewAttendance = async (intern: any) => {
    setViewingIntern(intern);
    setIsAttendanceModalOpen(true);
    setIsLoadingMenteeAttendance(true);
    try {
      const att = await fetchMenteeAttendance({ data: { internId: intern.id } });
      setViewingInternAttendance(att);
    } catch (e: any) {
      toast.error(e.message || "Failed to fetch attendance.");
    } finally {
      setIsLoadingMenteeAttendance(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function handleSubmitKudos(e: React.FormEvent) {
    e.preventDefault();
    if (!kudosForm.receiver_id || !kudosForm.message) {
      toast.error("Please select a colleague and write an appreciation note");
      return;
    }
    setIsSubmittingKudos(true);
    try {
      await doCreateKudos({
        data: {
          receiver_id: kudosForm.receiver_id,
          badge: kudosForm.badge,
          message: kudosForm.message,
        }
      });
      toast.success("Kudos sent successfully! 🎉");
      setKudosForm({ receiver_id: "", badge: "Star Performer", message: "" });
      qc.invalidateQueries({ queryKey: ["kudos-feed"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to send kudos");
    } finally {
      setIsSubmittingKudos(false);
    }
  }

  const [isClocking, setIsClocking] = useState(false);

  // Security States
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // MFA States
  const [mfaStatus, setMfaStatus] = useState<"checking" | "enrolled" | "unenrolled" | "enrolling">("checking");
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(null);

  // Mentor management state
  const [selectedInterns, setSelectedInterns] = useState<string[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low"|"medium"|"high">("medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [targetInternId, setTargetInternId] = useState<string | null>(null); // null means bulk
  
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [viewingIntern, setViewingIntern] = useState<any>(null);
  const [viewingInternAttendance, setViewingInternAttendance] = useState<any[]>([]);
  const [isLoadingMenteeAttendance, setIsLoadingMenteeAttendance] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaQrCode, setMfaQrCode] = useState<string | null>(null);

  // Ticket states
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("IT Support");
  const [ticketDescription, setTicketDescription] = useState("");

  async function handleSubmitTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    try {
      await ticketMutation.mutateAsync({
        category: ticketCategory,
        priority: "medium", // or low/high depending on what's needed
        subject: ticketSubject,
        description: ticketDescription,
      });
      setIsTicketModalOpen(false);
      setTicketSubject("");
      setTicketDescription("");
      toast.success("Ticket submitted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit ticket");
    }
  }

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

  const fetchInternTasksForMentor = useServerFn(listInternTasksForMentor);
  const doUpdateTaskExecution = useServerFn(updateTaskExecution);

  async function loadInternTasks(internId: string) {
    setIsLoadingInternTasks(true);
    try {
      const data = await fetchInternTasksForMentor({ data: { internId } });
      setInternTasksList(data || []);
    } catch (e) {
      console.warn("Server function fetch failed, trying fallback:", e);
      try {
        const { data: fallback, error: fbErr } = await supabase
          .from("tasks")
          .select("*")
          .or(`assigned_to.eq.${internId},target_user_id.eq.${internId}`)
          .order("created_at", { ascending: false });
        if (fbErr) throw fbErr;
        setInternTasksList(fallback || []);
      } catch (err2) {
        toast.error("Failed to load tasks for intern");
      }
    } finally {
      setIsLoadingInternTasks(false);
    }
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

  const fetchDashboardSettings = useServerFn(getDashboardSettings);
  const dashboardSettingsQ = useQuery({ queryKey: ["dashboard-settings"], queryFn: () => fetchDashboardSettings() });
  const dSettings = dashboardSettingsQ.data || [];
  const isModuleEnabled = (moduleName: string) => {
    const s = dSettings.find((ds: any) => ds.module_name === moduleName && ds.portal_type === 'employee');
    return s ? s.is_enabled : true; // Default to true if not found
  };

  const TABS = [
    { id: "overview", label: "Overview", enabled: true },
    { id: "tasks", label: `Tasks`, badge: pendingTasks.length, enabled: isModuleEnabled("tasks") },
    { id: "attendance", label: "Attendance & Time", enabled: isModuleEnabled("attendance") },
    { id: "leave", label: "Leaves", enabled: isModuleEnabled("leave") },
    { id: "payouts", label: "Payouts & Expenses", enabled: isModuleEnabled("payouts") },
    { id: "support", label: "Helpdesk Tickets", badge: tickets.filter((t: any) => t.status === "open").length, enabled: isModuleEnabled("support") },
    { id: "resolver_support", label: "Intern Queries", badge: assignedSupportQueries.filter((q: any) => q.status !== "resolved").length, enabled: isModuleEnabled("resolver_support") },
    { id: "meetings", label: "Meetings", enabled: isModuleEnabled("meetings") },
    { id: "interviews", label: "Interviews", badge: assignedInterviews.length, enabled: isModuleEnabled("interviews") },
    { id: "my_interns", label: "My Interns", badge: myInterns.length, enabled: isModuleEnabled("my_interns") },
    { id: "announcements", label: `News`, badge: announcements.length, enabled: isModuleEnabled("announcements") },
    { id: "team", label: "Team & Kudos", enabled: isModuleEnabled("team") },
    { id: "resources", label: "Resources & LMS", enabled: isModuleEnabled("resources") },
    { id: "locker", label: "Doc Locker", enabled: isModuleEnabled("locker") },
    { id: "contact", label: "Profile (ESS)", enabled: isModuleEnabled("contact") },
    { id: "security", label: "Security & NOC", enabled: isModuleEnabled("security") },
    { id: "refer", label: "Refer & Earn", enabled: isModuleEnabled("refer") },
  ].filter(t => t.enabled);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-800 font-sans selection:bg-black selection:text-white">
      
      {/* Dynamic Header */}
      <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-xl border-b border-black/5 shadow-sm" : "bg-transparent"}`}>
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
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
        <div className="w-full px-4 sm:px-8 overflow-x-auto hide-scrollbar border-t border-black/5">
          <div className="w-full max-w-[1800px] mx-auto flex items-center gap-2 py-3 relative">
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

      <main className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 py-4 sm:py-6 relative">
        <AnimatePresence mode="wait">
          
          {/* ─── OVERVIEW ─── */}
          {activeTab === "overview" && (
            <motion.div key="overview" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
              
              {/* Premium Hero Section */}
              <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-6 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
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
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div variants={itemVariants} initial="initial" animate="animate" className="lg:col-span-1">
                  <div className="text-sm font-semibold tracking-wide text-slate-900 mb-3 uppercase">Calendar</div>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <MonthlyCalendar events={[...schedules, ...meetings]} holidays={holidaysQ.data || []} />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} initial="initial" animate="animate" className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold tracking-wide text-slate-900 uppercase">Recent Tasks</div>
                    <Button variant="link" className="text-xs text-slate-500 hover:text-black" onClick={() => setActiveTab("tasks")}>View All ↗</Button>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
                    <div className="divide-y divide-slate-50">
                      {tasks.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400 font-light">No tasks assigned currently.</div>
                      ) : (
                        tasks.slice(0, 4).map((task: any) => {
                          const s = TASK_STATUS_STYLES[task.status] || TASK_STATUS_STYLES.pending;
                          return (
                            <div key={task.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                              <div className="text-sm font-medium text-slate-800">{task.title}</div>
                              <span className={`text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider font-bold ${s.badge}`}>{s.label}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Assigned Assets & Onboarding Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Assigned Hardware & Credentials */}
                    <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-900 uppercase">Assigned Assets</div>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Active</span>
                      </div>
                      <div className="space-y-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Laptop className="h-4 w-4 text-slate-500" />
                            <div>
                              <div className="font-semibold text-slate-800">MacBook Pro M3 Max</div>
                              <div className="text-[10px] text-slate-400 font-mono">SN: VY-MAC-2026-981</div>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium">Assigned</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-indigo-500" />
                            <div>
                              <div className="font-semibold text-slate-800">YubiKey 5C NFC 2FA</div>
                              <div className="text-[10px] text-slate-400 font-mono">SN: VY-KEY-4490</div>
                            </div>
                          </div>
                          <span className="text-[10px] text-emerald-600 font-medium">Enrolled</span>
                        </div>
                      </div>
                    </div>

                    {/* Onboarding Checklist */}
                    <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-900 uppercase">Onboarding Lifecycle</div>
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">Completed</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        {[
                          "Company Email & Slack Setup",
                          "Identity Verification & NDA Upload",
                          "Bank Account & Salary Setup",
                          "Security & Compliance Training"
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-slate-700">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ─── TASKS ─── */}
          {activeTab === "tasks" && (
            <motion.div key="tasks" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-7xl mx-auto space-y-6">
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
                        size="sm" 
                        className="w-full bg-slate-900 hover:bg-black text-white disabled:opacity-50" 
                        onClick={handleClockOut} 
                        disabled={isClocking || isClockingDisabled}
                        title={clockingDisabledReason}
                      >
                        {isClocking ? <Loader2 className="h-4 w-4 animate-spin"/> : "Clock Out"}
                      </Button>
                    )
                  ) : (
                    <Button 
                      onClick={handleClockIn} 
                      disabled={isClocking || isClockingDisabled}
                      title={clockingDisabledReason}
                      className="w-full h-12 rounded-xl bg-black hover:bg-slate-800 text-white shadow-lg shadow-black/20 font-semibold uppercase tracking-wider text-xs transition-all hover:-translate-y-0.5 disabled:opacity-50"
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

          {/* ─── PAYOUTS & EXPENSES ─── */}
          {activeTab === "payouts" && (
            <motion.div key="payouts" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-7xl mx-auto space-y-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-light tracking-tight text-slate-900">Payroll, Compensation & Payslips</h2>
                  <p className="text-sm text-slate-500 font-light mt-1">View your monthly payout history, download official PDF payslips, and submit expense reimbursements.</p>
                </div>
                <Button onClick={() => openPayslipModal()} className="bg-slate-900 hover:bg-black text-white rounded-xl h-11 px-5 text-xs font-semibold gap-2 shadow-md shrink-0">
                  <FileText className="h-4 w-4 text-emerald-400" /> Generate Official Payslip
                </Button>
              </div>

              {/* Expense Claim Submission Form */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-emerald-600" />
                  Submit Out-of-Pocket Expense Claim
                </h3>
                <form onSubmit={handleSubmitExpense} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">Expense Title</Label>
                    <Input placeholder="e.g. Client Travel / Internet" value={expenseForm.title} onChange={e => setExpenseForm({...expenseForm, title: e.target.value})} required className="bg-slate-50 border-slate-100 rounded-xl mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Category</Label>
                    <select value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value as any})} className="w-full h-10 px-3 mt-1 bg-slate-50 border border-slate-100 rounded-xl text-sm">
                      <option value="Travel">Travel</option>
                      <option value="Food">Food</option>
                      <option value="Office Supplies">Office Supplies</option>
                      <option value="Internet">Internet</option>
                      <option value="Medical">Medical</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Amount (₹)</Label>
                    <Input type="number" step="0.01" placeholder="Amount" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} required className="bg-slate-50 border-slate-100 rounded-xl mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Expense Date</Label>
                    <Input type="date" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} required className="bg-slate-50 border-slate-100 rounded-xl mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Receipt / Document URL (Optional)</Label>
                    <Input placeholder="https://..." value={expenseForm.receipt_url} onChange={e => setExpenseForm({...expenseForm, receipt_url: e.target.value})} className="bg-slate-50 border-slate-100 rounded-xl mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Notes</Label>
                    <Input placeholder="Brief details" value={expenseForm.notes} onChange={e => setExpenseForm({...expenseForm, notes: e.target.value})} className="bg-slate-50 border-slate-100 rounded-xl mt-1" />
                  </div>
                  <div className="col-span-full flex justify-end">
                    <Button type="submit" disabled={isSubmittingExpense} className="bg-black hover:bg-slate-800 text-white rounded-xl h-10 px-6">
                      {isSubmittingExpense ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      Submit Reimbursement Claim
                    </Button>
                  </div>
                </form>

                {/* Submitted Expenses List */}
                {expenses.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">My Expense Claims</h4>
                    <div className="space-y-2">
                      {expenses.map((exp: any) => (
                        <div key={exp.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-sm">
                          <div>
                            <div className="font-semibold text-slate-900">{exp.title} <span className="text-xs text-slate-400">({exp.category})</span></div>
                            <div className="text-xs text-slate-500 font-light mt-0.5">{new Date(exp.date).toLocaleDateString("en-IN")} • {exp.notes || 'No notes'}</div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-slate-900">₹{exp.amount}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${exp.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{exp.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Premium Bank Account Recommendation Section */}
                <div className="mb-8">
                  <div className="flex flex-col mb-6">
                    <h3 className="text-xl font-semibold text-slate-900">Don't have a Bank Account?</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      VyNexa recommends opening a Zero Balance account for seamless and fast salary credits. Choose a premium banking partner below:
                    </p>
                  </div>
                  
                  <div className="space-y-8 max-w-5xl mx-auto">
                    <BankAdCard 
                      bankName="Kotak Mahindra Bank"
                      logoUrl="https://www.logo.wine/a/logo/Kotak_Mahindra_Bank/Kotak_Mahindra_Bank-Logo.wine.svg"
                      link="https://www.kotak811.bank.in/open-zero-balance-savings-account/zba-8?utm_source=GoogleSEMiQ&utm_medium=Paid&utm_campaign=iQ-Kotak811-PMax-03-25&gad_source=1&gad_campaignid=23479404668&gbraid=0AAAAACQ2IDljm3gMtRRPTAIrvNheMuWvK&gclid=CjwKCAjwyabTBhBFEiwAM3mNUEXJ3jfac5acjqCf7LlAslQGKKDLr6i4006q7RQWwhH_Uu14yzjtqxoC8bQQAvD_BwE"
                      themeColor="#e61a22"
                      borderColor="border-red-100"
                      bgColor="from-red-50/30"
                      accountType="Salary / Zero Balance Digital Account"
                      branches={["Visakhapatnam", "Bengaluru", "Hyderabad", "Gujarat"]}
                      bankSupport="1860 266 2666 (Local) / 1800 209 0000"
                      vyntyraManager="Available Soon"
                      ads={[
                        { videoId: "/videos/kotak/kotak_ad_2.mp4", title: "Zero Balance Savings Account", slogan: "Open Kotak811 Zero Balance Account from anywhere digitally using Video KYC.", feature: "100% Digital Banking" },
                        { videoId: "/videos/kotak/kotak_ad_1.mp4", title: "FD Wala Savings with ActivMoney", slogan: "Earn FD-like interest up to 7% p.a. on your standard savings account balance.", feature: "Up to 7% Interest Rate" },
                        { videoId: "/videos/kotak/kotak_ad_3.mp4", title: "Scan, Pay and Earn Rewards", slogan: "Use the new Kotak811 Mobile Banking app to pay seamlessly and grab rewards.", feature: "Reward Points on Scan & Pay" }
                      ]}
                    />

                    <BankAdCard 
                      bankName="IDFC First Bank"
                      logoUrl="https://www.logo.wine/a/logo/IDFC_First_Bank/IDFC_First_Bank-Logo.wine.svg"
                      link="https://www.idfcfirst.bank.in/"
                      themeColor="#901235"
                      borderColor="border-rose-100"
                      bgColor="from-rose-50/30"
                      accountType="Premium Salary Account / Savings Account"
                      branches={["Visakhapatnam", "Bengaluru", "Hyderabad", "Gujarat"]}
                      bankSupport="1800 10 888 (Toll Free)"
                      vyntyraManager="Available Soon"
                      ads={[
                        { videoId: "/videos/idfc/idfc_ad_2.mp4", title: "Open Savings Account in 5 Mins", slogan: "Open your IDFC FIRST Bank Savings Account online in just 5 mins.", feature: "5-Minute Online Setup" },
                        { videoId: "/videos/idfc/idfc_ad_1.mp4", title: "Lifetime Free Credit Cards", slogan: "Enjoy premium credit cards with zero annual fees and robust rewards.", feature: "No Annual Fee Cards" }
                      ]}
                    />

                    <BankAdCard 
                      bankName="Axis Bank"
                      logoUrl="https://www.logo.wine/a/logo/Axis_Bank/Axis_Bank-Logo.wine.svg"
                      link="https://www.axis.bank.in/"
                      themeColor="#97144D"
                      borderColor="border-pink-100"
                      bgColor="from-pink-50/30"
                      accountType="Salary / ASAP Zero Balance Savings"
                      branches={["Visakhapatnam", "Bengaluru", "Hyderabad", "Gujarat"]}
                      bankSupport="1860 419 5555 / 1860 500 5555"
                      vyntyraManager="Available Soon"
                      ads={[
                        { videoId: "/videos/axis/axis_ad_2.mp4", title: "Digital Savings Account", slogan: "Make every moment special with an Axis Bank Digital Savings Account.", feature: "Open in 4 Easy Steps" },
                        { videoId: "/videos/axis/axis_ad_3.mp4", title: "Open Account in 4 Steps", slogan: "Experience paperless account opening instantly using Video KYC.", feature: "100% Digital Setup" },
                        { videoId: "/videos/axis/axis_ad_1.mp4", title: "Dil Se Open Celebrations", slogan: "Celebrate every moment with exclusive rewards and lifestyle benefits.", feature: "Dil Se Open Privileges" }
                      ]}
                    />
                  </div>
                </div>

                {payouts.length === 0 ? (
                  <div className="py-10 bg-white rounded-2xl border border-slate-100 shadow-sm text-center space-y-4">
                    <div className="text-slate-400 font-light">No historical payouts recorded yet.</div>
                    <Button onClick={() => openPayslipModal()} variant="outline" className="rounded-xl text-xs gap-2 border-slate-200">
                      <FileText className="h-4 w-4 text-emerald-600" /> Generate & View Current Month Payslip
                    </Button>
                  </div>
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
                      <div className="flex items-center gap-4">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${payout.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{payout.status}</span>
                        <Button 
                          onClick={() => openPayslipModal(payout)} 
                          className="bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-700 rounded-xl px-4 py-2 text-xs font-semibold gap-1.5 transition-all shadow-sm"
                        >
                          <FileText className="h-3.5 w-3.5 text-emerald-500" /> Payslip PDF
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ─── MY INTERNS ─── */}
          {activeTab === "my_interns" && (
            <motion.div key="my_interns" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-8 max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-light tracking-tight text-slate-900">My Interns</h2>
                  <p className="text-sm text-slate-500 font-light mt-1">Manage tasks and view attendance for interns assigned to you.</p>
                </div>
                {selectedInterns.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500 font-medium">{selectedInterns.length} selected</span>
                    <Button onClick={() => handleAssignTask()} className="bg-slate-900 hover:bg-black text-white rounded-xl shadow-sm">
                      <Plus className="h-4 w-4 mr-2" /> Assign Bulk Task
                    </Button>
                  </div>
                )}
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 w-10">
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-black focus:ring-black"
                            checked={selectedInterns.length === myInterns.length && myInterns.length > 0}
                            onChange={(e) => setSelectedInterns(e.target.checked ? myInterns.map((i:any) => i.id) : [])}
                          />
                        </th>
                        <th className="px-6 py-4">Intern</th>
                        <th className="px-6 py-4">Department</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myInterns.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400 font-light">No interns assigned.</td></tr>
                      ) : (
                        myInterns.map((intern: any) => (
                          <tr key={intern.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <input 
                                type="checkbox" 
                                className="rounded border-slate-300 text-black focus:ring-black"
                                checked={selectedInterns.includes(intern.id)}
                                onChange={(e) => setSelectedInterns(prev => e.target.checked ? [...prev, intern.id] : prev.filter(id => id !== intern.id))}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <ProfileAvatar url={intern.avatar_url} name={intern.full_name} className="h-10 w-10 rounded-xl" />
                                <div>
                                  <div className="font-semibold text-slate-900">{intern.full_name}</div>
                                  <div className="text-xs text-slate-500">{intern.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600">{intern.department || "—"}</td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleViewAttendance(intern)} className="rounded-xl">
                                <Clock className="h-4 w-4 mr-2 text-slate-500" /> Attendance
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => {
                                setSelectedInternForTasks(intern);
                                loadInternTasks(intern.id);
                              }} className="rounded-xl">
                                <FileText className="h-4 w-4 mr-2 text-slate-500" /> View Tasks
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleAssignTask(intern.id)} className="rounded-xl">
                                <Plus className="h-4 w-4 mr-2 text-slate-500" /> Assign Task
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── TEAM & KUDOS ─── */}
          {activeTab === "team" && (
            <motion.div key="team" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-light tracking-tight text-slate-900">Team Directory & Peer Kudos</h2>
                  <p className="text-sm text-slate-500 font-light mt-1">Connect with colleagues and recognize team achievements with peer shoutouts.</p>
                </div>
              </div>

              {/* Give Kudos Section */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  Recognize a Colleague (Send Kudos)
                </h3>
                <form onSubmit={handleSubmitKudos} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">Colleague</Label>
                    <select value={kudosForm.receiver_id} onChange={e => setKudosForm({...kudosForm, receiver_id: e.target.value})} required className="w-full h-10 px-3 mt-1 bg-slate-50 border border-slate-100 rounded-xl text-sm">
                      <option value="">Select team member...</option>
                      {team.map((m: any) => (
                        <option key={m.id} value={m.id}>{m.full_name} ({m.role})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Badge</Label>
                    <select value={kudosForm.badge} onChange={e => setKudosForm({...kudosForm, badge: e.target.value as any})} className="w-full h-10 px-3 mt-1 bg-slate-50 border border-slate-100 rounded-xl text-sm">
                      <option value="Star Performer">⭐ Star Performer</option>
                      <option value="Team Player">🤝 Team Player</option>
                      <option value="Problem Solver">💡 Problem Solver</option>
                      <option value="Innovation Champion">🚀 Innovation Champion</option>
                      <option value="Customer Delight">❤️ Customer Delight</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-xs">Appreciation Message</Label>
                    <Input placeholder="Write a brief shoutout for their great work..." value={kudosForm.message} onChange={e => setKudosForm({...kudosForm, message: e.target.value})} required className="bg-slate-50 border-slate-100 rounded-xl mt-1" />
                  </div>
                  <div className="sm:col-span-3 flex justify-end">
                    <Button type="submit" disabled={isSubmittingKudos} className="bg-black hover:bg-slate-800 text-white rounded-xl h-10 px-6">
                      {isSubmittingKudos ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Award className="h-4 w-4 mr-2 text-amber-400" />}
                      Send Kudos
                    </Button>
                  </div>
                </form>
              </div>

              {/* Team Directory Grid */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-slate-900">Organization Directory</h3>
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
              </div>
            </motion.div>
          )}

          {/* ─── MEETINGS ─── */}
          {activeTab === "interviews" && (
            <motion.div {...pageVariants} className="space-y-8">
              <div className="flex items-center justify-between border-b border-black/5 pb-5">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">Assigned Interviews</h2>
                  <p className="text-sm text-slate-500 mt-1">Review candidate details, join calls, and submit interview feedback.</p>
                </div>
              </div>

              {assignedInterviews.length === 0 ? (
                <div className="rounded-2xl border border-black/5 bg-white p-12 text-center text-slate-500 shadow-sm">
                  No interviews assigned to you currently. Any scheduled candidate interviews where you are the interviewer will appear here.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {assignedInterviews.map((app: any) => {
                    const hasSubmitted = !!app.interview_summary || !!app.interview_remarks;
                    const feedback = interviewsFeedback[app.id] || { summary: "", remarks: "" };
                    
                    return (
                      <div key={app.id} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm space-y-6 hover:shadow-md transition-shadow duration-300">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h3 className="font-serif text-lg font-bold text-slate-900">{app.full_name}</h3>
                            <div className="text-sm font-medium text-slate-500 mt-0.5">{app.role_applied}</div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">
                              Ref: {app.id.slice(0, 8).toUpperCase()}
                            </span>
                            {hasSubmitted && (
                              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 rounded-full font-medium">
                                Feedback Submitted
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm border-y border-black/5 py-4">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Meeting Time</span>
                            <span className="font-medium text-slate-700 mt-1 block">
                              {app.meeting_time ? new Date(app.meeting_time).toLocaleString() : "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Meeting Link</span>
                            {app.meet_link ? (
                              <a href={app.meet_link} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 underline font-medium mt-1 block truncate">
                                Join Video Call ↗
                              </a>
                            ) : (
                              <span className="text-slate-500 mt-1 block">—</span>
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Contact Candidate</span>
                            <span className="text-slate-700 mt-1 block truncate">
                              {app.email} {app.phone ? `· ${app.phone}` : ""}
                            </span>
                          </div>
                        </div>

                        {!hasSubmitted ? (
                          <div className="space-y-4 pt-2">
                            <h4 className="text-sm font-semibold text-slate-900">Submit Interview Feedback & Remarks</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`summary-${app.id}`} className="text-xs font-medium text-slate-500">Interview Summary / Topics Covered</Label>
                                <Textarea 
                                  id={`summary-${app.id}`}
                                  className="mt-1.5 text-sm"
                                  rows={4}
                                  value={feedback.summary}
                                  onChange={(e) => setInterviewsFeedback({
                                    ...interviewsFeedback,
                                    [app.id]: { ...feedback, summary: e.target.value }
                                  })}
                                  placeholder="e.g. Discussed search ranking, TF-IDF, vector search experience. Evaluated coding skills..."
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`remarks-${app.id}`} className="text-xs font-medium text-slate-500">Detailed Remarks / Recommendation</Label>
                                <Textarea 
                                  id={`remarks-${app.id}`}
                                  className="mt-1.5 text-sm"
                                  rows={4}
                                  value={feedback.remarks}
                                  onChange={(e) => setInterviewsFeedback({
                                    ...interviewsFeedback,
                                    [app.id]: { ...feedback, remarks: e.target.value }
                                  })}
                                  placeholder="e.g. Recommended for final super-admin review. Candidate exhibits solid grasp of MLE principles..."
                                />
                              </div>
                            </div>

                            <div className="flex justify-end">
                              <Button 
                                onClick={() => feedbackMut.mutate({ 
                                  applicationId: app.id, 
                                  summary: feedback.summary, 
                                  remarks: feedback.remarks 
                                })}
                                disabled={feedbackMut.isPending || !feedback.summary.trim() || !feedback.remarks.trim()}
                                className="bg-black hover:bg-slate-800 text-white rounded-full px-6"
                              >
                                {feedbackMut.isPending ? "Submitting..." : "Submit Remarks to Super Admin"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-50 rounded-xl p-4 border border-black/5 space-y-3">
                            <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold">Your Submitted Remarks</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-semibold text-slate-600 block">Summary</span>
                                <p className="text-slate-700 mt-1 whitespace-pre-wrap">{app.interview_summary}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-slate-600 block">Remarks & Recommendations</span>
                                <p className="text-slate-700 mt-1 whitespace-pre-wrap">{app.interview_remarks}</p>
                              </div>
                            </div>
                            {app.interview_feedback_submitted_at && (
                              <div className="text-[10px] text-slate-400 italic text-right">
                                Submitted on {new Date(app.interview_feedback_submitted_at).toLocaleString()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ─── ASSIGNED INTERN SUPPORT QUERIES ─── */}
          {activeTab === "resolver_support" && (
            <motion.div key="resolver_support" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-7xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-light tracking-tight text-slate-900">Intern Support Resolver Panel</h2>
                <p className="text-sm text-slate-500 font-light mt-1">Review, add resolver progress notes, update status, and request sync meetings for intern support queries assigned to you by Super Admin.</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
                {assignedSupportQueries.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-light">
                    <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    No intern support queries assigned to you yet.
                  </div>
                ) : (
                  assignedSupportQueries.map((q: any) => {
                    const hasMeeting = q.meeting_id && q.meeting_status === "approved";
                    return (
                      <div key={q.id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-base text-slate-950">{q.subject}</span>
                              <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold border border-purple-100">{q.category}</span>
                              <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                                q.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                q.status === 'assigned' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                {q.status.replace("_", " ")}
                              </span>
                            </div>
                            
                            {/* Intern details */}
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                              <span>Intern: <strong className="text-slate-800">{q.intern?.full_name || "Assigned Intern"}</strong> ({q.intern?.email || ""})</span>
                              <span>•</span>
                              <span>Domain: <strong className="text-slate-800 capitalize">{q.intern?.department || "General"}</strong></span>
                            </div>

                            <p className="text-slate-600 text-xs leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">{q.description}</p>
                          </div>
                          
                          <div className="shrink-0 flex flex-col items-end gap-2">
                            <span className="text-[11px] text-slate-400 font-mono">{new Date(q.created_at).toLocaleString()}</span>
                            
                            {q.status !== "resolved" ? (
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  className="bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
                                  onClick={() => {
                                    setSelectedQueryToResolve(q);
                                    setProgressNotesInput(q.progress_notes || "");
                                  }}
                                >
                                  Resolve & Update Notes
                                </Button>

                                {q.meeting_status !== "requested" && !q.meeting_id && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="rounded-xl text-xs border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                                    onClick={async () => {
                                      try {
                                        await doRequestSupportMeeting({ data: { queryId: q.id } });
                                        toast.success("Sync meeting requested from Admin!");
                                        qc.invalidateQueries({ queryKey: ["assigned-support-queries", sessionQ.data?.user?.id] });
                                      } catch (err: any) {
                                        toast.error(err.message || "Failed to request meeting");
                                      }
                                    }}
                                  >
                                    <Video className="h-3.5 w-3.5 mr-1" /> Request Sync Meeting
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                                ✓ Resolved Successfully
                              </div>
                            )}

                            {q.meeting_status === "requested" && (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                Meeting Sync Requested
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Meeting Room indicator */}
                        {hasMeeting && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <Video className="h-5 w-5 text-emerald-600 animate-pulse" />
                              <div>
                                <div className="font-bold text-slate-800">Assigned Sync Meeting Approved</div>
                                <div className="text-[11px] text-slate-500 mt-0.5">Official sync scheduled. Participants: Intern, assigned resolver, and official mentor.</div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const decodedLink = atob(btoa("https://meet.google.com/vy-support-sync"));
                                window.location.href = decodedLink;
                              }}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs self-start sm:self-center transition-colors shadow-sm"
                            >
                              Join Sync Room
                            </button>
                          </div>
                        )}

                        {q.progress_notes && (
                          <div className="text-xs text-slate-500 border-t pt-3 flex flex-col gap-0.5">
                            <span className="font-bold text-slate-700 text-[10px] uppercase">Active Resolution Notes:</span>
                            <p className="text-slate-600 italic">"{q.progress_notes}"</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "meetings" && (
            <motion.div key="meetings" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-7xl mx-auto space-y-6">
              {/* Meeting Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Video className="h-5 w-5 text-indigo-600" /> Meetings & Video Syncs
                  </h2>
                  <p className="text-xs text-slate-500">
                    Host team syncs, 1-on-1 intern reviews, or sprint milestone discussions.
                  </p>
                </div>

                <Dialog open={meetingModalOpen} onOpenChange={setMeetingModalOpen}>
                  <Button 
                    size="sm" 
                    onClick={() => setMeetingModalOpen(true)}
                    className="gap-1.5 text-xs h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" /> Schedule Meeting
                  </Button>

                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Video className="h-5 w-5 text-indigo-600" /> Schedule Meeting
                      </DialogTitle>
                      <DialogDescription>
                        Set up a live meeting with dedicated start/end times and Google Calendar sync.
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleScheduleMeetingSubmit} className="space-y-3.5 py-2">
                      <div className="space-y-1.5">
                        <Label>Meeting Title / Topic</Label>
                        <Input 
                          required 
                          value={meetingForm.title} 
                          onChange={e => setMeetingForm({ ...meetingForm, title: e.target.value })} 
                          placeholder="e.g. Sprint Review & Code Walkthrough" 
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label>Agenda & Discussion Details (Optional)</Label>
                        <Input 
                          value={meetingForm.description} 
                          onChange={e => setMeetingForm({ ...meetingForm, description: e.target.value })} 
                          placeholder="e.g. Discuss milestone progress, unblock issues, and next deliverables." 
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label>Meeting Video Link (Google Meet / Zoom / Teams)</Label>
                        <Input 
                          required 
                          type="url" 
                          value={meetingForm.meeting_link} 
                          onChange={e => setMeetingForm({ ...meetingForm, meeting_link: e.target.value })} 
                          placeholder="https://meet.google.com/xyz-abcd-efg" 
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label>Meeting Date</Label>
                          <Input 
                            required 
                            type="date" 
                            value={meetingForm.date} 
                            onChange={e => setMeetingForm({ ...meetingForm, date: e.target.value })} 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>From (Start Time)</Label>
                          <Input 
                            required 
                            type="time" 
                            value={meetingForm.from_time} 
                            onChange={e => setMeetingForm({ ...meetingForm, from_time: e.target.value })} 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>To (End Time)</Label>
                          <Input 
                            required 
                            type="time" 
                            value={meetingForm.to_time} 
                            onChange={e => setMeetingForm({ ...meetingForm, to_time: e.target.value })} 
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Target Audience</Label>
                        <Select 
                          value={meetingForm.target_role} 
                          onValueChange={(v: any) => setMeetingForm({ ...meetingForm, target_role: v })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Everyone (Employees & Interns)</SelectItem>
                            <SelectItem value="intern">Interns Only</SelectItem>
                            <SelectItem value="employee">Employees Only</SelectItem>
                            <SelectItem value="individual">Specific Person (Individual)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {meetingForm.target_role === "individual" && (
                        <div className="space-y-1.5">
                          <Label>Select Team Member / Intern</Label>
                          <Select 
                            value={meetingForm.target_user_id} 
                            onValueChange={(v) => setMeetingForm({ ...meetingForm, target_user_id: v })}
                          >
                            <SelectTrigger><SelectValue placeholder="Choose Person..." /></SelectTrigger>
                            <SelectContent>
                              {(teamQ.data || []).map((m: any) => (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.full_name || m.email} ({m.role || "Member"})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="pt-2 border-t flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="employee_send_meeting_email"
                          checked={meetingForm.send_email_notification}
                          onChange={(e) => setMeetingForm({ ...meetingForm, send_email_notification: e.target.checked })}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <Label htmlFor="employee_send_meeting_email" className="text-xs text-slate-700 font-medium cursor-pointer">
                          Send automated email notification with Google Calendar link to participants
                        </Label>
                      </div>

                      <DialogFooter className="pt-2">
                        <Button type="button" variant="ghost" onClick={() => setMeetingModalOpen(false)}>Cancel</Button>
                        <Button 
                          type="submit" 
                          disabled={isSavingMeeting}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                        >
                          {isSavingMeeting ? "Scheduling..." : "Schedule Meeting"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <MeetingsSection meetings={meetings} isLoading={meetingsQ.isLoading} isError={meetingsQ.isError} />
            </motion.div>
          )}
          
          {/* ─── ANNOUNCEMENTS ─── */}
          {activeTab === "announcements" && (
            <motion.div key="announcements" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-7xl mx-auto space-y-6">
              <h2 className="text-2xl font-light tracking-tight text-slate-900 mb-8">Company News & Updates</h2>
              {announcements.length === 0 ? (
                <div className="p-12 bg-white rounded-2xl border border-slate-100 shadow-sm text-center text-slate-400 font-light">
                  <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  No news or announcements posted yet.
                </div>
              ) : (
                <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
                  {announcements.map((a: any) => (
                    <motion.div variants={itemVariants} key={a.id} className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(a.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider">
                          {a.source === "news" ? "News Update" : "Announcement"}
                        </span>
                      </div>
                      <h3 className="text-xl font-medium text-slate-900 mb-4">{a.title}</h3>
                      <RichContentRenderer content={a.body || ""} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ─── RESOURCES & LMS ─── */}
          {activeTab === "resources" && (
            <motion.div key="resources" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-7xl mx-auto space-y-8">
              <div>
                <h2 className="text-2xl font-light tracking-tight text-slate-900">Knowledge Base, Handbooks & LMS</h2>
                <p className="text-sm text-slate-500 font-light mt-1">Access official company handbooks, travel policies, SOPs, and complete mandatory learning & compliance courses.</p>
              </div>

              {/* LMS Courses Section */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-indigo-600" />
                  Learning & Development (LMS) Courses
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: "Information Security & Data Privacy 2026", cat: "Mandatory Compliance", progress: 100, status: "Certified", badge: "🛡️ Security Champion" },
                    { title: "Workplace Ethics & Code of Conduct", cat: "HR Policy", progress: 100, status: "Certified", badge: "⚖️ Ethics Leader" },
                    { title: "Enterprise Cloud Security & Architecture", cat: "Technical Certification", progress: 65, status: "In Progress", badge: "☁️ Tech Explorer" },
                    { title: "Agile Engineering & Development SOPs", cat: "Operations SOP", progress: 40, status: "In Progress", badge: "🚀 Agile Practitioner" },
                  ].map((c, i) => (
                    <div key={i} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.cat}</span>
                          <h4 className="font-semibold text-slate-900 text-sm mt-0.5">{c.title}</h4>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${c.status === 'Certified' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{c.status}</span>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-slate-500">
                          <span>Course Completion</span>
                          <span>{c.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${c.progress}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-xs">
                        <span className="text-slate-500 font-light">{c.badge}</span>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 hover:text-indigo-800 p-0">
                          {c.status === 'Certified' ? "View Certificate ↗" : "Continue Course →"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Handbooks & Downloads */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-slate-900">Company Policies & Handbooks</h3>
                <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {resources.length === 0 ? (
                    <div className="col-span-full py-12 bg-white rounded-2xl border border-slate-100 shadow-sm text-center text-slate-400 font-light">No additional resource documents uploaded.</div>
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
              </div>
            </motion.div>
          )}

          {/* ─── HELPDESK TICKETS ─── */}
          {activeTab === "support" && (
            <motion.div key="support" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-7xl mx-auto space-y-8">
              <div>
                <h2 className="text-2xl font-light tracking-tight text-slate-900">Service Desk & IT/HR Tickets</h2>
                <p className="text-sm text-slate-500 font-light mt-1">Raise support requests for hardware, software access, payroll inquiries, or administrative assistance.</p>
              </div>

              {/* Create Ticket Form */}
              <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <LifeBuoy className="h-5 w-5 text-indigo-600" />
                  Raise New Ticket
                </h3>
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Category</Label>
                      <select value={ticketForm.category} onChange={e => setTicketForm({...ticketForm, category: e.target.value as any})} className="w-full h-10 px-3 mt-1 bg-slate-50 border border-slate-100 rounded-xl text-sm">
                        <option value="IT Support">IT Support (Hardware/Software)</option>
                        <option value="HR Inquiry">HR Inquiry (Policies/Verification)</option>
                        <option value="Payroll & Finance">Payroll & Finance (Salary/Tax)</option>
                        <option value="Admin & Workplace">Admin & Workplace (Badge/Desk)</option>
                        <option value="Other">Other Query</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Priority</Label>
                      <select value={ticketForm.priority} onChange={e => setTicketForm({...ticketForm, priority: e.target.value as any})} className="w-full h-10 px-3 mt-1 bg-slate-50 border border-slate-100 rounded-xl text-sm">
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent (System Blocked)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Subject</Label>
                    <Input placeholder="Short summary of the issue..." value={ticketForm.subject} onChange={e => setTicketForm({...ticketForm, subject: e.target.value})} required className="bg-slate-50 border-slate-100 rounded-xl mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Detailed Description</Label>
                    <Textarea rows={4} placeholder="Provide details, error messages, or requested items..." value={ticketForm.description} onChange={e => setTicketForm({...ticketForm, description: e.target.value})} required className="bg-slate-50 border-slate-100 rounded-xl mt-1 resize-none text-sm" />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmittingTicket} className="bg-black hover:bg-slate-800 text-white rounded-xl h-11 px-8">
                      {isSubmittingTicket ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                      Submit Ticket
                    </Button>
                  </div>
                </form>
              </div>

              {/* My Support Tickets List */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-slate-900">My Support Tickets</h3>
                {tickets.length === 0 ? (
                  <div className="py-12 bg-white rounded-2xl border border-slate-100 shadow-sm text-center text-slate-400 font-light">No support tickets raised.</div>
                ) : (
                  tickets.map((ticket: any) => (
                    <div key={ticket.id} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">#{ticket.id.slice(0, 8).toUpperCase()}</span>
                            <h4 className="font-semibold text-slate-900">{ticket.subject}</h4>
                          </div>
                          <div className="text-xs text-slate-500 font-light mt-1">{ticket.category} • Priority: <span className="font-semibold">{ticket.priority}</span> • Raised {new Date(ticket.created_at).toLocaleDateString()}</div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${ticket.status === 'open' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{ticket.status}</span>
                      </div>
                      <p className="text-sm text-slate-600 font-light leading-relaxed">{ticket.description}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ─── DOCUMENT LOCKER ─── */}
          {activeTab === "locker" && (
            <motion.div key="locker" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-7xl mx-auto space-y-8">
              <div>
                <h2 className="text-2xl font-light tracking-tight text-slate-900">Document Locker & Vault</h2>
                <p className="text-sm text-slate-500 font-light mt-1">Upload and access your personal verification documents, ID proofs, degree certificates, and signed employment contracts.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: "National ID / Aadhaar / PAN Card", category: "Government ID Proof", status: "Verified", date: "2026-01-15" },
                  { name: "Passport / Birth Certificate", category: "Identity & Residency", status: "Verified", date: "2026-01-15" },
                  { name: "Degree & Marksheet Certifications", category: "Education Qualification", status: "Verified", date: "2026-01-16" },
                  { name: "Signed Offer Letter & NDA", category: "Legal & Employment", status: "Verified", date: "2026-01-10" },
                  { name: "Form 16 / Tax Declaration Proofs", category: "Payroll & Finance", status: "Pending Action", date: "2026-03-01" },
                ].map((doc, idx) => (
                  <div key={idx} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-start justify-between group hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-slate-500">
                        <FileCheck className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{doc.name}</div>
                        <div className="text-xs text-slate-400 font-light mt-0.5">{doc.category}</div>
                        <div className="text-[10px] text-slate-400 mt-2">Uploaded on {doc.date}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${doc.status === 'Verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{doc.status}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── FEEDBACKS ─── */}
          {activeTab === "feedbacks" && (
            <motion.div key="feedbacks" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-5xl mx-auto">
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

          {/* ─── PROFILE & ESS ─── */}
          {activeTab === "contact" && (
            <motion.div key="contact" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-7xl mx-auto space-y-8">
              <div>
                <h2 className="text-2xl font-light tracking-tight text-slate-900">Profile & Employee Self-Service (ESS)</h2>
                <p className="text-sm text-slate-500 font-light mt-1">Manage your personal contact details, emergency contacts, bank information, and print your Digital ID badge.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Digital ID Badge */}
                <div className="md:col-span-1 p-6 bg-gradient-to-b from-slate-900 to-black text-white rounded-[2rem] shadow-xl flex flex-col items-center text-center relative overflow-hidden group">
                  <div className="absolute top-0 inset-x-0 h-1 bg-emerald-400" />
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2">
                    <Radio className="h-3 w-3 animate-pulse" /> NFC & RFID Active
                  </div>

                  <ProfileAvatar url={profile?.avatar_url} name={displayName} className="h-20 w-20 text-2xl mb-2 ring-4 ring-white/20" />
                  <h3 className="font-bold text-lg text-white">{displayName}</h3>
                  <p className="text-xs text-white/60 uppercase tracking-widest mt-0.5">Employee · VyNexa</p>
                  <p className="text-[11px] text-emerald-400 font-mono mt-0.5">ID: {session?.user?.id?.slice(0, 8).toUpperCase()}</p>
                  
                  <div className="p-3 bg-white rounded-xl my-4">
                    <QRCodeSVG value={`VY-EMP-${session?.user?.id}`} size={105} />
                  </div>
                  
                  <Button onClick={() => setIsIdCardOpen(true)} className="w-full text-xs text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-xl gap-1.5 font-bold shadow-md">
                    <Cpu className="h-3.5 w-3.5" /> View Smart NFC Badge
                  </Button>
                </div>

                {/* ESS Personal Information Form */}
                <div className="md:col-span-2 p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-6">
                  <h3 className="text-lg font-semibold text-slate-900">Personal & Financial Information</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!session?.user?.id) return;
                    try {
                      await doUpdateProfile({
                        data: {
                          id: session.user.id,
                          phone: profileForm.phone || profile?.phone,
                          address: profileForm.address || profile?.address,
                        }
                      });
                      toast.success("Profile details updated!");
                      qc.invalidateQueries({ queryKey: ["profile"] });
                    } catch (err: any) {
                      toast.error(err.message || "Failed to update profile");
                    }
                  }} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Full Name</Label>
                        <Input value={displayName} disabled className="bg-slate-50 rounded-xl mt-1 text-sm font-medium" />
                      </div>
                      <div>
                        <Label className="text-xs">Work Email</Label>
                        <Input value={email} disabled className="bg-slate-50 rounded-xl mt-1 text-sm font-medium" />
                      </div>
                      <div>
                        <Label className="text-xs">Phone Number</Label>
                        <Input placeholder="+91 98765 43210" defaultValue={profile?.phone || ""} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="bg-slate-50 border-slate-100 rounded-xl mt-1 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs">Emergency Contact</Label>
                        <Input placeholder="Name & Phone Number" defaultValue={profile?.emergency_contact || "+91 98765 00000"} onChange={e => setProfileForm({...profileForm, emergency_contact: e.target.value})} className="bg-slate-50 border-slate-100 rounded-xl mt-1 text-sm" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Residential Address</Label>
                      <Input placeholder="Current residential address..." defaultValue={profile?.address || ""} onChange={e => setProfileForm({...profileForm, address: e.target.value})} className="bg-slate-50 border-slate-100 rounded-xl mt-1 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Bank Account & IFSC / UPI Details</Label>
                      <Input placeholder="HDFC Bank · A/C ****8821 · IFSC: HDFC0001234" defaultValue={profile?.bank_details || "Kotak Mahindra Bank · A/C 882101923 · IFSC: KKBK0001823"} onChange={e => setProfileForm({...profileForm, bank_details: e.target.value})} className="bg-slate-50 border-slate-100 rounded-xl mt-1 text-sm" />
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button type="submit" className="bg-black hover:bg-slate-800 text-white rounded-xl px-6">Save Profile Changes</Button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex items-start gap-4">
                  <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0">
                    <User className="h-6 w-6 text-slate-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 mb-1">Human Resources Helpdesk</h3>
                    <p className="text-sm text-slate-500 font-light mb-3">For leave, payroll, and policy inquiries.</p>
                    <a href="mailto:hr@vyntyraconsultancyservices.in" className="text-sm font-semibold text-slate-900 underline">hr@vyntyraconsultancyservices.in</a>
                  </div>
                </div>
                <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex items-start gap-4">
                  <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0">
                    <AlertCircle className="h-6 w-6 text-slate-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 mb-1">IT & System Support</h3>
                    <p className="text-sm text-slate-500 font-light mb-3">For technical issues or dashboard access.</p>
                    <a href="mailto:support@vyntyraconsultancyservices.in" className="text-sm font-semibold text-slate-900 underline">support@vyntyraconsultancyservices.in</a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── SECURITY & OFFBOARDING ─── */}
          {activeTab === "security" && (
            <motion.div key="security" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-7xl mx-auto space-y-8">
              <h2 className="text-2xl font-light tracking-tight text-slate-900 mb-8">Security & Offboarding Lifecycle</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Change Password Card */}
                <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl transition-all">
                  <h3 className="text-xl font-medium text-slate-900 mb-2">Change Password</h3>
                  <p className="text-slate-500 font-light mb-6">Update your portal login password.</p>
                  
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
                <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl transition-all">
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

              {/* Offboarding & NOC Clearance Tracker */}
              <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Offboarding & No-Objection Certificate (NOC) Tracker</h3>
                  <p className="text-sm text-slate-500 font-light mt-0.5">Track exit clearances across departments upon notice period submission.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { dept: "HR Clearance", status: "Active / No Pending Dues" },
                    { dept: "IT Hardware NOC", status: "Active / Laptop Assigned" },
                    { dept: "Finance Clearance", status: "Active / Salary Credit Clear" }
                  ].map((noc, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                      <div className="font-semibold text-slate-900">{noc.dept}</div>
                      <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {noc.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "refer" && (
            <motion.div key="refer" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full">
              <EmployeeReferEarn />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Task Assignment Modal */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsTaskModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 z-10 overflow-hidden">
              <h3 className="text-2xl font-light tracking-tight text-slate-900 mb-1">Assign Task</h3>
              <p className="text-slate-500 text-sm mb-6">
                {targetInternId ? "Assigning task to 1 intern." : `Assigning bulk task to ${selectedInterns.length} interns.`}
              </p>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5 block">Task Title</Label>
                  <Input placeholder="E.g., Complete UI mockups" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="rounded-xl bg-slate-50/50" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5 block">Description</Label>
                  <Textarea placeholder="Provide task details..." value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} className="min-h-[100px] rounded-xl bg-slate-50/50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5 block">Due Date (Optional)</Label>
                    <Input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} className="rounded-xl bg-slate-50/50" />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5 block">Priority</Label>
                    <select 
                      value={taskPriority} 
                      onChange={(e) => setTaskPriority(e.target.value as "low"|"medium"|"high")}
                      className="w-full rounded-xl border border-input bg-slate-50/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsTaskModalOpen(false)} className="rounded-xl text-slate-500">Cancel</Button>
                <Button 
                  onClick={submitAssignTask} 
                  disabled={assignTaskMutation.isPending}
                  className="rounded-xl bg-black text-white hover:bg-slate-800"
                >
                  {assignTaskMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Assign Task
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Intern Attendance Modal */}
      <AnimatePresence>
        {isAttendanceModalOpen && viewingIntern && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAttendanceModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 z-10 overflow-hidden max-h-[85vh] flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <ProfileAvatar url={viewingIntern.avatar_url} name={viewingIntern.full_name} className="h-12 w-12 rounded-xl" />
                <div>
                  <h3 className="text-xl font-light tracking-tight text-slate-900">{viewingIntern.full_name}'s Attendance</h3>
                  <p className="text-slate-500 text-sm">{viewingIntern.email}</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto min-h-[300px] border border-slate-100 rounded-2xl">
                {isLoadingMenteeAttendance ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                  </div>
                ) : viewingInternAttendance.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 font-light p-8 text-center">
                    No attendance records found for this intern.
                  </div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0">
                      <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Clock In</th>
                        <th className="px-6 py-4">Clock Out</th>
                        <th className="px-6 py-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingInternAttendance.map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900">{log.date}</td>
                          <td className="px-6 py-4 text-slate-600">
                            {log.clock_in ? new Date(log.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {log.clock_out ? new Date(log.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              log.clock_out ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {log.clock_out ? 'Completed' : 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <Button variant="ghost" onClick={() => setIsAttendanceModalOpen(false)} className="rounded-xl text-slate-500 bg-slate-50 hover:bg-slate-100 px-6">Close</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PayslipModal isOpen={isPayslipOpen} onClose={() => setIsPayslipOpen(false)} payslip={selectedPayslip} />
      <IdCardModal 
        isOpen={isIdCardOpen} 
        onClose={() => setIsIdCardOpen(false)} 
        employee={{
          employeeId: profile?.intern_id || session?.user?.id || 'VY-EMP-1001',
          fullName: displayName,
          email: email,
          avatarUrl: profile?.avatar_url,
          phone: profile?.phone,
          emergencyContact: profile?.emergency_contact || profile?.phone || "+91 98765 00000",
          role: profile?.role || 'Software Engineer / Executive',
          department: profile?.department || 'Engineering & Technology',
          bloodGroup: profile?.blood_group || 'O+ Positive',
          securityLevel: profile?.security_level || 'L3 - Enterprise Access',
          dateOfJoining: profile?.start_date || '15 Jan 2026',
          validUntil: profile?.end_date || '31 Dec 2028',
          officeLocation: profile?.address || 'VyNexa IT Tower, Cyber Hills, Visakhapatnam, AP, 530045'
        }} 
      />
      <FloatingAppsPanel />
      {/* ── Support Query Resolver Modal ── */}
      {selectedQueryToResolve && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Resolve Intern Support Query</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Intern: {selectedQueryToResolve.intern?.full_name}</p>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full" onClick={() => setSelectedQueryToResolve(null)}>✕</Button>
            </div>
            
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                setIsUpdatingNotes(true);
                try {
                  await doUpdateSupportProgressNotes({
                    data: {
                      queryId: selectedQueryToResolve.id,
                      notes: progressNotesInput,
                      status: "resolved", // Resolve the query when saving
                    }
                  });
                  toast.success("Query resolved and notes updated!");
                  setSelectedQueryToResolve(null);
                  qc.invalidateQueries({ queryKey: ["assigned-support-queries", sessionQ.data?.user?.id] });
                } catch (e) {
                  toast.error("Failed to update resolution details");
                } finally {
                  setIsUpdatingNotes(false);
                }
              }}
              className="space-y-4"
            >
              <div className="bg-slate-50 p-3 rounded-lg border text-xs text-slate-600">
                <strong className="text-slate-800">Intern Query Description:</strong>
                <p className="mt-1">"{selectedQueryToResolve.description}"</p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">Progress / Resolution Notes</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Explain how you resolved this query (e.g. fixed server configurations, explained concepts, unlocked files)..."
                  value={progressNotesInput}
                  onChange={(e) => setProgressNotesInput(e.target.value)}
                  className="w-full rounded-lg border p-2 text-xs bg-white text-slate-800 focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedQueryToResolve(null)}>Cancel</Button>
                <Button 
                  type="submit"
                  disabled={isUpdatingNotes}
                  className="bg-black hover:bg-slate-900 text-white text-xs font-semibold"
                >
                  {isUpdatingNotes ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Resolve Query
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Intern Tasks Inspector Modal ── */}
      {selectedInternForTasks && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="flex items-start justify-between border-b pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <ProfileAvatar url={selectedInternForTasks.avatar_url} name={selectedInternForTasks.full_name} className="h-10 w-10 rounded-xl" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{selectedInternForTasks.full_name}'s Task Board</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{selectedInternForTasks.email} • Domain: {selectedInternForTasks.department}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full" onClick={() => setSelectedInternForTasks(null)}>✕</Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {isLoadingInternTasks ? (
                <div className="py-12 flex items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading intern tasks...
                </div>
              ) : internTasksList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No tasks assigned to this intern yet.</div>
              ) : (
                internTasksList.map((task: any) => {
                  const s = TASK_STATUS_STYLES[task.status] || TASK_STATUS_STYLES.pending;
                  return (
                    <div key={task.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 text-xs">{task.title}</h4>
                          <p className="text-[11px] text-slate-500 line-clamp-2">{task.description || "No description provided."}</p>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${s.badge}`}>{s.label}</span>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 border text-slate-600 font-bold uppercase tracking-wider">{task.priority || 'medium'} priority</span>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold uppercase tracking-wider">{task.credits || 10} Credits</span>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold uppercase tracking-wider">{task.level || 'Beginner'}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{task.due_date ? new Date(task.due_date).toLocaleDateString() : ""}</span>
                      </div>

                      {/* Deliverable link & Mentor Review block */}
                      {task.deliverable_url && (
                        <div className="bg-white border p-3 rounded-xl text-xs space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="truncate text-slate-700">
                              <strong className="text-slate-900">Submitted Deliverable:</strong>{" "}
                              <a href={task.deliverable_url} target="_blank" rel="noreferrer" className="text-blue-600 font-mono underline ml-1 hover:text-blue-800">
                                {task.deliverable_url}
                              </a>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${task.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}`}>
                              {task.status === "completed" ? "✓ Verified & Approved" : "Ready to Review"}
                            </span>
                          </div>

                          {task.progress_notes && (
                            <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border">
                              <span className="font-semibold text-slate-700">Intern Notes:</span> {task.progress_notes}
                            </div>
                          )}

                          {task.admin_remarks && (
                            <div className="text-[11px] text-emerald-800 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200">
                              <span className="font-semibold">Mentor Feedback:</span> {task.admin_remarks}
                            </div>
                          )}

                          {task.status !== "completed" && (
                            <div className="flex items-center gap-2 pt-1 border-t">
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1"
                                onClick={async () => {
                                  try {
                                    await doUpdateTaskExecution({
                                      data: {
                                        id: task.id,
                                        status: "completed",
                                        progress_percentage: 100,
                                        admin_remarks: "Verified & approved by mentor.",
                                      }
                                    });
                                    toast.success("Deliverable verified & task marked completed!");
                                    loadInternTasks(selectedInternForTasks.id);
                                  } catch (e: any) {
                                    toast.error("Failed to approve task: " + e.message);
                                  }
                                }}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Verify & Approve Task
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-amber-700 border-amber-300 hover:bg-amber-50 font-semibold"
                                onClick={async () => {
                                  const feedback = prompt("Enter feedback / revision requirements for the intern:", task.admin_remarks || "");
                                  if (feedback === null) return;
                                  try {
                                    await doUpdateTaskExecution({
                                      data: {
                                        id: task.id,
                                        status: "in_progress",
                                        admin_remarks: feedback,
                                      }
                                    });
                                    toast.success("Feedback sent to intern!");
                                    loadInternTasks(selectedInternForTasks.id);
                                  } catch (e: any) {
                                    toast.error("Failed to send feedback: " + e.message);
                                  }
                                }}
                              >
                                Request Revision
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Deadline Extension block */}
                      {task.extension_status === "requested" && (
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex flex-col gap-2 text-xs">
                          <div className="font-bold text-amber-900 flex items-center gap-1">
                            <Clock className="h-4 w-4 text-amber-700" /> Deadline Extension Requested
                          </div>
                          <div className="text-slate-700">
                            <strong>Reason:</strong> "{task.extension_reason || 'No explanation provided.'}"
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            <strong>Requested Due Date:</strong> {task.extension_requested_date ? new Date(task.extension_requested_date).toLocaleDateString() : ""}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Button 
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                              onClick={async () => {
                                try {
                                  await doReviewDeadlineExtension({ data: { taskId: task.id, status: 'approved' } });
                                  toast.success("Deadline extension approved!");
                                  loadInternTasks(selectedInternForTasks.id);
                                } catch (e) {
                                  toast.error("Failed to approve extension");
                                }
                              }}
                            >
                              Approve Extension
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              className="border-slate-300 text-rose-600 hover:bg-rose-50 font-bold"
                              onClick={async () => {
                                try {
                                  await doReviewDeadlineExtension({ data: { taskId: task.id, status: 'rejected' } });
                                  toast.success("Deadline extension rejected!");
                                  loadInternTasks(selectedInternForTasks.id);
                                } catch (e) {
                                  toast.error("Failed to reject extension");
                                }
                              }}
                            >
                              Reject Extension
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="border-t pt-3 shrink-0 flex justify-end">
              <Button size="sm" onClick={() => setSelectedInternForTasks(null)}>Close Inspector</Button>
            </div>
          </div>
        </div>
      )}

      <FirstLoginWelcomeModal user={profile} />
      <PwaInstallBanner 
        title="Install Employee Portal"
        subtitle="Get the official Employee App for offline access"
        dismissKey="vy_pwa_employee_banner_dismissed"
        buttonColor="blue"
        installLabel="Install Employee App"
      />
    </div>
  );
}
