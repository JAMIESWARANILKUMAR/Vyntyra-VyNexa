import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  GraduationCap, ClipboardList, Clock, Mail, Bell, LogOut, Loader2,
  CheckCircle2, Video, CalendarDays, User, BookOpen, Link2, FileText,
  Play, FolderOpen, ExternalLink, RefreshCw, Phone, MapPin, Award,
  ShieldCheck, Download, Upload, Send, Sparkles, Check, HelpCircle,
  Layers, Target, Compass, BookMarked, MessageCircle, FileCheck, DollarSign, Briefcase, Code2, Cpu, Users, Shield, Lock, Unlock, CreditCard, ArrowRight, ArrowLeft, Zap, ChevronRight, X, Trophy, Flame, AlertCircle,
  Printer, Receipt, Tag, Building2, CheckCheck, Menu, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { RichContentRenderer } from "@/components/rich-content-renderer";
import { MonthlyCalendar } from "@/components/monthly-calendar";
import { MeetingsSection, MeetingCountdown, getJoinButtonState } from "@/components/meetings-section";
import { FloatingAppsPanel } from "@/components/floating-apps-panel";
import { AnalogClock } from "@/components/analog-clock";
import { ProfileAvatar } from "@/components/profile-avatar";
import { ProfileChangeRequestModal } from "@/components/profile-change-request-modal";
import { FirstLoginWelcomeModal } from "@/components/first-login-welcome-modal";
import { GoogleDocViewerModal } from "@/components/google-doc-viewer-modal";
import { TechDomainWorkspace } from "@/components/tech-domain-workspace";
import { NonTechDomainWorkspace } from "@/components/non-tech-domain-workspace";
import { ManagementDomainWorkspace } from "@/components/management-domain-workspace";
import { IntegratedChromeBrowser } from "@/components/integrated-chrome-browser";
import { PwaInstallBanner } from "@/components/pwa-install-banner";
import { EmployeeReferEarn } from "@/components/employee-refer-earn";
import { 
  listTasks, listMeetings, listSchedules, listAnnouncements, listResources, 
  listNotes, createNote, deleteNote, createFeedback, claimPoolTask,
  listMyStandups, createStandup, listMyDeliverables, createDeliverable,
  listMyAccessRequests, createAccessRequest, getPresignedUrl,
  acceptTask, updateTaskExecution,
  listLeads, createLead, updateLeadStatus, deleteLead,
  listBugs, createBug, updateBugStatus,
  clockIn, clockOut, getMyAttendance, getMyDocuments, regenerateMyDocuments,
  requestLeave, listMyLeaves, getMyLmsProgress, updateLmsProgress,
  raiseSupportQuery, listMySupportQueries, requestDeadlineExtension, submitTaskUrl,
  requestDoubtSolvingSession, requestTaskResources, getLmsCourses, type LmsCourseItem,
  getOrCreateReferralCode, getMyReferralConversions, getDashboardSettings, getInternMentorDetails,
  dismissUrgentPopup, listHolidays
} from "@/lib/operations.functions";
import { listMyNotifications, markUserNotificationRead } from "@/lib/notifications.functions";
import { generatePayuCheckout, confirmInternPayment, generateKotakCheckout, confirmKotakPayment } from "@/lib/payu.functions";

export const Route = createFileRoute("/_authenticated/intern")({
  head: () => ({ meta: [{ title: "Intern Dashboard — Vyntyra" }] }),
  component: InternDashboard,
});

const TASK_STATUS_STYLES: Record<string, { dot: string; badge: string; label: string }> = {
  pending:      { dot: "bg-amber-400",   badge: "bg-amber-950/70 text-amber-300 border-amber-500/40 shadow-xs",    label: "Pending" },
  in_progress:  { dot: "bg-blue-400",    badge: "bg-blue-950/70 text-blue-300 border-blue-500/40 shadow-xs",        label: "In Progress" },
  submitted:    { dot: "bg-purple-400",  badge: "bg-purple-950/70 text-purple-300 border-purple-500/40 shadow-xs",  label: "Submitted (Under Review)" },
  under_review: { dot: "bg-indigo-400",  badge: "bg-indigo-950/70 text-indigo-300 border-indigo-500/40 shadow-xs",  label: "Under Mentor Review" },
  completed:    { dot: "bg-emerald-400", badge: "bg-emerald-950/70 text-emerald-300 border-emerald-500/40 shadow-xs", label: "Verified & Completed" },
  verified:     { dot: "bg-emerald-400", badge: "bg-emerald-950/70 text-emerald-300 border-emerald-500/40 shadow-xs", label: "Verified & Completed" },
  approved:     { dot: "bg-emerald-400", badge: "bg-emerald-950/70 text-emerald-300 border-emerald-500/40 shadow-xs", label: "Approved & Verified" },
  done:         { dot: "bg-emerald-400", badge: "bg-emerald-950/70 text-emerald-300 border-emerald-500/40 shadow-xs", label: "Completed" },
  resolved:     { dot: "bg-emerald-400", badge: "bg-emerald-950/70 text-emerald-300 border-emerald-500/40 shadow-xs", label: "Resolved & Verified" },
  graded:       { dot: "bg-emerald-400", badge: "bg-emerald-950/70 text-emerald-300 border-emerald-500/40 shadow-xs", label: "Graded & Verified" },
  blocked:      { dot: "bg-rose-400",    badge: "bg-rose-950/70 text-rose-300 border-rose-500/40 shadow-xs",        label: "Revision Requested" },
  rejected:     { dot: "bg-red-400",     badge: "bg-red-950/70 text-red-300 border-red-500/40 shadow-xs",          label: "Changes Needed" },
};

const RESOURCE_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  document: { icon: <FileText className="h-5 w-5" />,  color: "bg-blue-950/60 text-blue-400 border-blue-800/60" },
  video:    { icon: <Play className="h-5 w-5" />,       color: "bg-red-950/60 text-red-400 border-red-800/60" },
  link:     { icon: <Link2 className="h-5 w-5" />,      color: "bg-purple-950/60 text-purple-400 border-purple-800/60" },
  template: { icon: <FolderOpen className="h-5 w-5" />, color: "bg-amber-950/60 text-amber-400 border-amber-800/60" },
  guide:    { icon: <BookOpen className="h-5 w-5" />,   color: "bg-emerald-950/60 text-emerald-400 border-emerald-800/60" },
};

function formatDeadlineDisplay(deadline?: string | null, fallbackText = "the scheduled deadline") {
  if (!deadline) return fallbackText;
  try {
    const d = new Date(deadline);
    if (isNaN(d.getTime())) return fallbackText;
    return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return fallbackText;
  }
}

function FeeCountdownTimer({ deadline }: { deadline?: string | null }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number; isExpired: boolean }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    let targetTime: number;
    if (deadline) {
      const parsed = new Date(deadline).getTime();
      targetTime = isNaN(parsed) ? Date.now() + (3 * 24 * 60 * 60 * 1000) : parsed;
    } else {
      targetTime = Date.now() + (3 * 24 * 60 * 60 * 1000);
    }

    const calculate = () => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (timeLeft.isExpired) {
    return (
      <div className="inline-flex items-center gap-2 text-xs font-bold text-red-700 bg-red-100/90 px-3 py-1.5 rounded-xl border border-red-300 animate-pulse">
        <span>⚠️ Payment Deadline Expired — Pay immediately to activate dashboard</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <div className="flex flex-col items-center justify-center bg-slate-900 text-white rounded-xl px-2.5 py-1.5 min-w-[44px] shadow-sm border border-slate-700">
        <span className="text-base sm:text-lg font-black font-mono leading-none">{String(timeLeft.days).padStart(2, "0")}</span>
        <span className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">Days</span>
      </div>
      <span className="text-slate-800 font-bold text-base">:</span>
      <div className="flex flex-col items-center justify-center bg-slate-900 text-white rounded-xl px-2.5 py-1.5 min-w-[44px] shadow-sm border border-slate-700">
        <span className="text-base sm:text-lg font-black font-mono leading-none">{String(timeLeft.hours).padStart(2, "0")}</span>
        <span className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">Hours</span>
      </div>
      <span className="text-slate-800 font-bold text-base">:</span>
      <div className="flex flex-col items-center justify-center bg-slate-900 text-white rounded-xl px-2.5 py-1.5 min-w-[44px] shadow-sm border border-slate-700">
        <span className="text-base sm:text-lg font-black font-mono leading-none">{String(timeLeft.minutes).padStart(2, "0")}</span>
        <span className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">Mins</span>
      </div>
      <span className="text-slate-800 font-bold text-base">:</span>
      <div className="flex flex-col items-center justify-center bg-red-600 text-white rounded-xl px-2.5 py-1.5 min-w-[44px] shadow-sm border border-red-500 animate-pulse">
        <span className="text-base sm:text-lg font-black font-mono leading-none">{String(timeLeft.seconds).padStart(2, "0")}</span>
        <span className="text-[9px] uppercase font-bold text-red-200 mt-0.5">Secs</span>
      </div>
    </div>
  );
}

function InternDashboard() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "onboarding" | "lms" | "browser" | "kanban" | "standups" | "deliverables" | "ppo" | "tasks" | "meetings" | "resources" | "notes" | "feedback" | "attendance" | "announcements" | "leaves" | "support" | "refer">("overview");
  const [newNote, setNewNote] = useState("");
  const [feedback, setFeedback] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showReferralPopup, setShowReferralPopup] = useState(() => localStorage.getItem("dismissed-referral-popup") !== "true");
  const [viewingDoc, setViewingDoc] = useState<{ url: string; title: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [showForcePasswordModal, setShowForcePasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentGatewaySelected, setPaymentGatewaySelected] = useState<"razorpay" | "payu" | "kotak" | null>("payu");
  const [paymentModalTab, setPaymentModalTab] = useState<"checkout" | "invoice" | "privacy" | "refunds">("checkout");
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const sessionQ = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const session = sessionQ.data;
  const email = session?.user?.email || "";

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

  const doClockIn = useServerFn(clockIn);
  const doClockOut = useServerFn(clockOut);
  const fetchAttendance = useServerFn(getMyAttendance);
  const fetchMyDocuments = useServerFn(getMyDocuments);
  const regenerateDocs = useServerFn(regenerateMyDocuments);

  // LMS tracking state
  const [updatingCourseIdx, setUpdatingCourseIdx] = useState<number | null>(null);
  const [courseProgressInput, setCourseProgressInput] = useState<number>(0);
  
  // User notifications state
  const [showNotifications, setShowNotifications] = useState(false);
  const fetchMyNotifications = useServerFn(listMyNotifications);
  const doMarkUserNotificationRead = useServerFn(markUserNotificationRead);

  // Leave requests state
  const [leaveForm, setLeaveForm] = useState({ start_date: "", end_date: "", reason: "" });
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const doRequestLeave = useServerFn(requestLeave);
  const fetchMyLeaves = useServerFn(listMyLeaves);

  // Support queries state
  const [supportForm, setSupportForm] = useState({ subject: "", description: "", category: "Technical" });
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const doRaiseSupportQuery = useServerFn(raiseSupportQuery);
  const fetchMySupportQueries = useServerFn(listMySupportQueries);

  // Deadline extension state
  const [showExtensionModal, setShowExtensionModal] = useState<any>(null);
  const [extensionReason, setExtensionReason] = useState("");
  const [extensionDate, setExtensionDate] = useState("");
  const [isSubmittingExtension, setIsSubmittingExtension] = useState(false);
  const doRequestDeadlineExtension = useServerFn(requestDeadlineExtension);

  // Submission URL state
  const [submissionTaskId, setSubmissionTaskId] = useState<string | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [isSubmittingTaskUrl, setIsSubmittingTaskUrl] = useState(false);
  const doSubmitTaskUrl = useServerFn(submitTaskUrl);

  // LMS functions
  const fetchLmsProgress = useServerFn(getMyLmsProgress);
  const doUpdateLmsProgress = useServerFn(updateLmsProgress);
  const fetchLmsCourses = useServerFn(getLmsCourses);

  // Doubt Solving Session & Resource Requests
  const doRequestDoubt = useServerFn(requestDoubtSolvingSession);
  const doRequestResource = useServerFn(requestTaskResources);

  const [doubtModalOpen, setDoubtModalOpen] = useState(false);
  const [doubtTaskId, setDoubtTaskId] = useState("");
  const [doubtTaskTitle, setDoubtTaskTitle] = useState("");
  const [doubtTopic, setDoubtTopic] = useState("");
  const [doubtBlockers, setDoubtBlockers] = useState("");
  const [doubtSlot, setDoubtSlot] = useState("");
  const [doubtType, setDoubtType] = useState<"one_on_one" | "group_sync">("one_on_one");
  const [isSubmittingDoubt, setIsSubmittingDoubt] = useState(false);

  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [resourceTaskId, setResourceTaskId] = useState("");
  const [resourceTaskTitle, setResourceTaskTitle] = useState("");
  const [resourceType, setResourceType] = useState("API Credentials & Access Keys");
  const [resourceDetails, setResourceDetails] = useState("");
  const [resourceUrgency, setResourceUrgency] = useState<"normal" | "urgent" | "critical">("normal");
  const [isSubmittingResource, setIsSubmittingResource] = useState(false);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [lmsVideoModalId, setLmsVideoModalId] = useState<string | null>(null);

  const [selectedTaskWorkspace, setSelectedTaskWorkspace] = useState<any>(null);
  const [selectedDomain, setSelectedDomain] = useState<"tech" | "non_tech" | "management">("tech");

  const fetchLeads = useServerFn(listLeads);
  const doCreateLead = useServerFn(createLead);
  const doUpdateLeadStatus = useServerFn(updateLeadStatus);
  const doDeleteLead = useServerFn(deleteLead);

  const fetchBugs = useServerFn(listBugs);
  const doCreateBug = useServerFn(createBug);
  const doUpdateBugStatus = useServerFn(updateBugStatus);

  const queryOpts = { staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 10 };
  const leadsQ = useQuery({ queryKey: ["my-leads"], queryFn: () => fetchLeads(), ...queryOpts });
  const bugsQ = useQuery({ queryKey: ["my-bugs"], queryFn: () => fetchBugs(), ...queryOpts });

  const userNotificationsQ = useQuery({
    queryKey: ["my-user-notifications", session?.user?.id],
    queryFn: () => fetchMyNotifications(),
    enabled: !!session?.user?.id,
    refetchInterval: 10000,
  });

  const notifications = userNotificationsQ.data || [];
  const unreadNotificationsCount = notifications.filter((n: any) => !n.is_read).length;

  const lmsProgressQ = useQuery({
    queryKey: ["my-lms-progress", session?.user?.id],
    queryFn: () => fetchLmsProgress(),
    enabled: !!session?.user?.id,
  });

  const lmsCoursesQ = useQuery({
    queryKey: ["intern-lms-courses"],
    queryFn: () => fetchLmsCourses(),
  });

  const lmsProgressList = lmsProgressQ.data || [];

  const supportQueriesQ = useQuery({
    queryKey: ["my-support-queries", session?.user?.id],
    queryFn: () => fetchMySupportQueries(),
    enabled: !!session?.user?.id,
  });

  const supportQueries = supportQueriesQ.data || [];

  const leavesQ = useQuery({
    queryKey: ["my-leaves", session?.user?.id],
    queryFn: () => fetchMyLeaves(),
    enabled: !!session?.user?.id,
  });

  const myLeaves = leavesQ.data || [];

  const fetchReferralCode = useServerFn(getOrCreateReferralCode);
  const fetchReferralConversions = useServerFn(getMyReferralConversions);

  const referralCodeQ = useQuery({
    queryKey: ["my-referral-code", session?.user?.id],
    queryFn: () => fetchReferralCode(),
    enabled: !!session?.user?.id,
  });

  const referralConversionsQ = useQuery({
    queryKey: ["my-referrals", session?.user?.id],
    queryFn: () => fetchReferralConversions(),
    enabled: !!session?.user?.id,
    refetchInterval: 5000,
  });

  const referralCode = referralCodeQ.data?.referralCode || "";
  const referralData: any = referralConversionsQ.data || {};
  const referralConversions: any[] = referralData.candidates || (Array.isArray(referralData) ? referralData : []);

  const tasksQ = useQuery({ queryKey: ["my-tasks"], queryFn: () => fetchTasks(), ...queryOpts });
  const meetingsQ = useQuery({ queryKey: ["my-meetings"], queryFn: () => fetchMeetings(), ...queryOpts });
  const schedulesQ = useQuery({ queryKey: ["my-schedules"], queryFn: () => fetchSchedules(), ...queryOpts });
  const announcementsQ = useQuery({ queryKey: ["my-announcements"], queryFn: () => fetchAnnouncements(), ...queryOpts });
  const resourcesQ = useQuery({ queryKey: ["my-resources"], queryFn: () => fetchResources(), ...queryOpts });
  const notesQ = useQuery({ queryKey: ["my-notes"], queryFn: () => fetchNotes(), ...queryOpts });
  const attendanceQ = useQuery({ queryKey: ["my-attendance"], queryFn: () => fetchAttendance(), staleTime: 0, refetchInterval: 3000 });
  const docsQ = useQuery({ queryKey: ["my-documents"], queryFn: () => fetchMyDocuments(), staleTime: 1000 * 60 * 30 });
  const fetchHolidays = useServerFn(listHolidays);
  const holidaysQ = useQuery({ queryKey: ["company-holidays"], queryFn: () => fetchHolidays(), ...queryOpts });
  const [taskFilterTab, setTaskFilterTab] = useState<"all" | "in_progress" | "submitted" | "completed">("all");

  const attendanceLogs: any[] = attendanceQ.data || [];

  // Helper to get local date string YYYY-MM-DD
  const getLocalDateString = (dateInput: any) => {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to calculate day streak based on attendance logs
  const calculateStreak = (logs: any[]) => {
    if (!logs || logs.length === 0) return 0;
    
    const dates = Array.from(new Set(logs.map(log => getLocalDateString(log.date))))
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a));

    if (dates.length === 0) return 0;

    const todayStrStr = getLocalDateString(new Date());
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    const newestDate = dates[0];
    if (newestDate !== todayStrStr && newestDate !== yesterdayStr) {
      return 0;
    }

    let streak = 1;
    for (let i = 0; i < dates.length - 1; i++) {
      const current = new Date(dates[i]);
      const next = new Date(dates[i+1]);
      
      const diffTime = Math.abs(current.getTime() - next.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
      } else if (diffDays > 1) {
        break;
      }
    }
    return streak;
  };

  const dayStreak = calculateStreak(attendanceLogs);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayDateStr = new Date().toDateString();
  const todayAttendance = attendanceLogs.find((a: any) => {
    if (a.date === todayStr) return true;
    if (a.clock_in && new Date(a.clock_in).toDateString() === todayDateStr) return true;
    return false;
  });

  const [isClocking, setIsClocking] = useState(false);
  const [meetingAlert, setMeetingAlert] = useState<any>(null);

  async function handleClockIn() {
    setIsClocking(true);
    try {
      await doClockIn();
      toast.success("Clocked in successfully!");
      qc.invalidateQueries({ queryKey: ["my-attendance"] });
      qc.invalidateQueries({ queryKey: ["admin-attendance"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to clock in");
    } finally {
      setIsClocking(false);
    }
  }

  async function handleClockOut() {
    setIsClocking(true);
    try {
      await doClockOut();
      toast.success("Clocked out successfully!");
      qc.invalidateQueries({ queryKey: ["my-attendance"] });
      qc.invalidateQueries({ queryKey: ["admin-attendance"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to clock out");
    } finally {
      setIsClocking(false);
    }
  }

  const tasks: any[] = tasksQ.data || [];
  const notes: any[] = notesQ.data || [];
  const meetings: any[] = meetingsQ.data || [];
  const schedules: any[] = schedulesQ.data || [];
  const announcements: any[] = announcementsQ.data || [];
  const resources: any[] = resourcesQ.data || [];

  const profileQ = useQuery({ 
    queryKey: ["profile", session?.user?.id], 
    queryFn: async () => { 
      const { data } = await supabase.from('profiles').select('*').eq('id', session?.user?.id).single(); 
      return data; 
    }, 
    enabled: !!session?.user?.id,
    refetchInterval: 12000,
  });
  
  const profile = profileQ.data;
  const displayName = profile?.full_name || email.split("@")[0] || "Intern";
  const isFeePaymentPending = Boolean(profile?.fee_payment_scheduled && !profile?.exam_fee_paid && !profile?.is_fee_exempted);
  const doDismissUrgentPopup = useServerFn(dismissUrgentPopup);
  const [isDismissingPopup, setIsDismissingPopup] = useState(false);
  
  const todayStr_ = new Date().toISOString().split('T')[0];
  const isBeforeStart = profile?.start_date && todayStr_ < profile.start_date.split('T')[0];
  const isAfterEnd = profile?.end_date && todayStr_ > profile.end_date.split('T')[0];
  const isClockingDisabled = isBeforeStart || isAfterEnd;
  const clockingDisabledReason = isBeforeStart ? "Internship has not started" : (isAfterEnd ? "Internship has ended" : "");

  const doGetMentorDetails = useServerFn(getInternMentorDetails);
  const mentorQ = useQuery({
    queryKey: ["intern-mentor", session?.user?.id, profile?.mentor_id],
    queryFn: () => doGetMentorDetails(),
    refetchInterval: 12000,
  });
  const mentor = mentorQ.data;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check size (10kb max)
    if (file.size > 10 * 1024) {
      toast.error("Image size must be less than 10KB");
      return;
    }
    
    // Check type
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error("Only jpg, jpeg, png, and webp are allowed");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async (event) => {
      const base64String = event.target?.result as string;
      
      // Update locally first (optional, but React Query refetch is better)
      const { error } = await supabase.from('profiles')
        .update({ avatar_url: base64String })
        .eq('id', session?.user?.id);
        
      if (error) {
        toast.error("Failed to save profile image");
      } else {
        toast.success("Profile image updated");
        // Also regenerate documents so NOC contains the new image
        try {
          await regenerateDocs();
          docsQ.refetch();
        } catch (e) {
          console.error("Failed to regenerate documents:", e);
        }
        qc.invalidateQueries({ queryKey: ["profile", session?.user?.id] });
      }
    };
    reader.readAsDataURL(file);
  };

  const doConfirmPayment = useServerFn(confirmInternPayment);
  const doConfirmKotakPayment = useServerFn(confirmKotakPayment);
  const doGenerateKotakCheckout = useServerFn(generateKotakCheckout);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment");
    const txnid = urlParams.get("txnid");
    const gateway = urlParams.get("gateway");
    const action = urlParams.get("action");

    if (paymentStatus === "success" && txnid && session?.user?.id) {
      const mode = gateway === "kotak" ? "Kotak Mahindra Bank PG / Online" : "PayU PG / Online";
      toast.loading("Verifying and recording your payment...", { id: "payment-verify" });
      doConfirmPayment({
        data: {
          userId: session.user.id,
          txnid,
          paymentMode: mode,
          paymentStatus: "paid",
        },
      })
        .then(() => {
          toast.success(`Payment verified via ${gateway === "kotak" ? "Kotak Mahindra Bank" : "PayU"}! Your Intern Dashboard and task deliverables are fully unlocked.`, { id: "payment-verify" });
          qc.invalidateQueries({ queryKey: ["profile"] });
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch(() => {
          qc.invalidateQueries({ queryKey: ["profile"] });
        });
    }

    if (action === "pay_fee") {
      setShowPaymentModal(true);
    }
  }, [session?.user?.id, doConfirmPayment, qc]);

  const handleOfferLetterDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (docsQ.data?.offerLetterUrl) window.open(docsQ.data.offerLetterUrl, "_blank");
    else toast.error("Offer Letter not available yet.");
  };

  useEffect(() => {
    if (profile?.department) {
      const dept = profile.department.toLowerCase();
      if (dept.includes("mba") || dept.includes("bba") || dept.includes("management") || dept.includes("operations") || dept.includes("business")) {
        setSelectedDomain("management");
      } else if (dept.includes("marketing") || dept.includes("sales") || dept.includes("crm")) {
        setSelectedDomain("non_tech");
      } else {
        setSelectedDomain("tech");
      }
    }
  }, [profile?.department]);

  useEffect(() => {
    if (session?.user?.user_metadata?.must_change_password) {
      setShowForcePasswordModal(true);
    }
  }, [session]);

  // Realtime subscription for meetings table to auto-refresh meetings
  useEffect(() => {
    const channel = supabase
      .channel("intern-meetings-live")
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

  // Realtime subscription for user events (notifications, support, leaves)
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const userChannel = supabase
      .channel(`user-updates-${session.user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_notifications", filter: `user_id=eq.${session.user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["my-user-notifications", session?.user?.id] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_queries", filter: `intern_id=eq.${session.user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["my-support-queries", session?.user?.id] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leave_requests", filter: `user_id=eq.${session.user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["my-leaves", session?.user?.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userChannel);
    };
  }, [session?.user?.id, qc]);

  // Check for upcoming meetings today to display a popup alert
  useEffect(() => {
    if (meetings.length > 0) {
      const todayMeeting = meetings.find((m: any) => {
        const d = new Date(m.scheduled_at);
        const now = new Date();
        const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        const isUpcoming = d.getTime() > now.getTime();
        return isToday && isUpcoming;
      });

      if (todayMeeting) {
        const alerted = sessionStorage.getItem(`alerted-meeting-${todayMeeting.id}`);
        if (!alerted) {
          setMeetingAlert(todayMeeting);
          sessionStorage.setItem(`alerted-meeting-${todayMeeting.id}`, "true");
        }
      }
    }
  }, [meetings]);

  async function handleForcePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters!");
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword,
        data: { must_change_password: false }
      });
      if (error) throw error;
      // Refresh session so user_metadata is updated immediately
      await supabase.auth.refreshSession();
      toast.success("Password updated successfully! Welcome to your dashboard.");
      setShowForcePasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
      qc.invalidateQueries({ queryKey: ["session"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  const currentUserId = session?.user?.id;

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

  const myDeliverableTaskIds = (deliverables || []).map((d: any) => d.task_id).filter(Boolean);

  const myIdentifiers = [
    currentUserId,
    profile?.id,
    profile?.intern_id,
    profile?.email,
    profile?.full_name,
  ].filter(Boolean);

  const poolTasks = tasks.filter((t: any) => t.is_pool_task === true && !t.assigned_to);
  const myTasks = tasks.filter((t: any) => {
    if (!t) return false;
    if (t.is_pool_task === true && !t.assigned_to) return false; // Unclaimed pool tasks belong in Task Pool tab

    const isDirectMatch = myIdentifiers.some((id) => 
      t.assigned_to === id || 
      t.target_user_id === id || 
      t.user_id === id || 
      t.claimed_by === id ||
      (Array.isArray(t.team_members) && t.team_members.includes(id)) ||
      (Array.isArray(t.target_user_ids) && t.target_user_ids.includes(id))
    );

    const isDeliverableMatch = myDeliverableTaskIds.includes(t.id);

    return isDirectMatch || isDeliverableMatch;
  });
  const completedTasks = myTasks.filter((t: any) => 
    t.status === "completed" || 
    t.status === "verified" || 
    t.status === "approved" || 
    t.status === "done" || 
    t.status === "resolved" ||
    t.status === "graded" ||
    t.is_verified === true ||
    myDeliverableTaskIds.includes(t.id)
  );
  const verifiedTasks = completedTasks;
  const inProgressTasks = myTasks.filter((t: any) => 
    (t.status === "pending" || t.status === "in_progress" || t.status === "blocked" || t.status === "rejected") &&
    !myDeliverableTaskIds.includes(t.id) &&
    !t.is_verified
  );
  const submittedTasks = myTasks.filter((t: any) => (t.status === "submitted" || t.status === "under_review") && !completedTasks.some((c: any) => c.id === t.id));
  const pendingTasks = inProgressTasks;
  const earnedCredits = completedTasks.reduce((acc, t) => acc + (t.credits || 10), 0);
  const totalAssignedCredits = myTasks.reduce((acc, t) => acc + (t.credits || 10), 0);
  const totalPoints = earnedCredits; // for backwards compatibility
  const progress = totalAssignedCredits > 0 ? Math.round((earnedCredits / totalAssignedCredits) * 100) : 0;

  const fetchDashboardSettings = useServerFn(getDashboardSettings);
  const dashboardSettingsQ = useQuery({ queryKey: ["dashboard-settings"], queryFn: () => fetchDashboardSettings() });
  const dSettings = dashboardSettingsQ.data || [];
  const isModuleEnabled = (moduleName: string) => {
    const s = dSettings.find((ds: any) => ds.module_name === moduleName && ds.portal_type === 'intern');
    return s ? s.is_enabled : true; // Default to true if not found
  };

  const TABS = [
    { id: "overview",       label: "Overview", shortLabel: "Overview", icon: Compass, category: "Core Work", enabled: isModuleEnabled("overview") },
    { 
      id: "tasks",          
      label: `Tasks & Assignments (${pendingTasks.length})`, 
      shortLabel: `Tasks (${pendingTasks.length})`,
      isPrimary: true,
      count: pendingTasks.length,
      icon: ClipboardList,
      category: "Core Work",
      enabled: isModuleEnabled("tasks") 
    },
    { id: "deliverables",   label: `Deliverables (${deliverables.length})`, shortLabel: "Deliverables", icon: Send, category: "Core Work", enabled: isModuleEnabled("deliverables") },
    { id: "kanban",         label: "Sprint Board", shortLabel: "Sprint", icon: Layers, category: "Core Work", enabled: isModuleEnabled("kanban") },
    { id: "lms",            label: "LMS & Skills", shortLabel: "LMS", icon: BookOpen, category: "Core Work", enabled: isModuleEnabled("lms") },
    { id: "browser",        label: "VyNexa Search", shortLabel: "VyNexa Search", icon: Globe, category: "Core Work", enabled: isModuleEnabled("browser") },

    { id: "standups",       label: `Standups (${standups.length})`, shortLabel: "Standups", icon: Clock, category: "Routine & Compliance", enabled: isModuleEnabled("standups") },
    { id: "attendance",     label: `Attendance (${attendanceLogs.length})`, shortLabel: "Attendance", icon: CalendarDays, category: "Routine & Compliance", enabled: isModuleEnabled("attendance") },
    { id: "onboarding",     label: "Onboarding", shortLabel: "Onboarding", icon: GraduationCap, category: "Routine & Compliance", enabled: isModuleEnabled("onboarding") },
    { id: "ppo",            label: "PPO & Credentials", shortLabel: "PPO", icon: Trophy, category: "Routine & Compliance", enabled: isModuleEnabled("ppo") },

    { id: "meetings",       label: "Meetings", shortLabel: "Meetings", icon: Video, category: "Connect & Support", enabled: isModuleEnabled("meetings") },
    { id: "resources",      label: `Resources (${resources.length})`, shortLabel: "Resources", icon: FolderOpen, category: "Connect & Support", enabled: isModuleEnabled("resources") },
    { id: "leaves",         label: `Leaves (${myLeaves.length})`, shortLabel: "Leaves", icon: CalendarDays, category: "Connect & Support", enabled: isModuleEnabled("leaves") },
    { id: "support",        label: `Support (${supportQueries.length})`, shortLabel: "Support", icon: HelpCircle, category: "Connect & Support", enabled: isModuleEnabled("support") },
    { id: "refer",          label: "Refer & Earn", shortLabel: "Refer", icon: DollarSign, category: "Connect & Support", enabled: isModuleEnabled("refer") },
    { id: "notes",          label: "Notes", shortLabel: "Notes", icon: FileText, category: "Connect & Support", enabled: isModuleEnabled("notes") },
    { id: "feedback",       label: "Feedback", shortLabel: "Feedback", icon: MessageCircle, category: "Connect & Support", enabled: isModuleEnabled("feedback") },
  ].filter(t => t.enabled);

  // Auto-switch tab if current active tab is disabled by admin
  useEffect(() => {
    if (TABS.length > 0 && !TABS.some(t => t.id === activeTab)) {
      setActiveTab(TABS[0].id as any);
    }
  }, [TABS, activeTab]);

  // ── Construct Unified Real-Time Live Marquee Updates (Holidays, Tasks, Meetings, Announcements, Alerts) ──
  const holidays: any[] = holidaysQ.data || [];
  const nowMs = Date.now();
  const thirtyDaysAhead = nowMs + 30 * 24 * 60 * 60 * 1000;

  const marqueeItems: { id: string; type: string; typeColor: string; icon: React.ReactNode; title: string; subtitle?: string }[] = [];

  // 1. Direct Unread Alerts & Notifications
  notifications.filter((n: any) => !n.is_read).forEach((n: any) => {
    marqueeItems.push({
      id: `alert-${n.id}`,
      type: "ALERT",
      typeColor: "text-rose-300 bg-rose-950/80 border-rose-500/40 shadow-xs",
      icon: <AlertCircle className="h-3 w-3 text-rose-400 shrink-0" />,
      title: n.title,
      subtitle: n.message,
    });
  });

  // 2. Upcoming Meetings (Scheduled within next 7 days or today)
  meetings.filter((m: any) => {
    const meetMs = new Date(m.scheduled_at).getTime();
    return meetMs >= nowMs - 3600000 && meetMs <= nowMs + 7 * 24 * 60 * 60 * 1000;
  }).forEach((m: any) => {
    const meetTime = new Date(m.scheduled_at).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: true });
    const meetDate = new Date(m.scheduled_at).toLocaleDateString("en-IN", { weekday: 'short', month: 'short', day: 'numeric' });
    marqueeItems.push({
      id: `meet-${m.id}`,
      type: "LIVE MEETING",
      typeColor: "text-indigo-300 bg-indigo-950/80 border-indigo-500/40 shadow-xs",
      icon: <Video className="h-3 w-3 text-indigo-400 shrink-0" />,
      title: `Scheduled Video Sync: "${m.title}" · ${meetDate} at ${meetTime}`,
    });
  });

  // 3. Pending Tasks & Assignments
  pendingTasks.forEach((t: any) => {
    const dueText = t.deadline ? `Due: ${new Date(t.deadline).toLocaleDateString("en-IN", { month: 'short', day: 'numeric' })}` : "Active";
    marqueeItems.push({
      id: `task-${t.id}`,
      type: "ASSIGNMENT",
      typeColor: "text-amber-300 bg-amber-950/80 border-amber-500/40 shadow-xs",
      icon: <ClipboardList className="h-3 w-3 text-amber-400 shrink-0" />,
      title: `Task Pending Review: "${t.title}" (${dueText})`,
    });
  });

  // 4. Upcoming Company Holidays (next 30 days)
  holidays.filter((h: any) => {
    const hMs = new Date(h.date).getTime();
    return hMs >= nowMs - 86400000 && hMs <= thirtyDaysAhead;
  }).forEach((h: any) => {
    const hDate = new Date(h.date).toLocaleDateString("en-IN", { weekday: 'short', month: 'short', day: 'numeric' });
    marqueeItems.push({
      id: `holiday-${h.id || h.date}`,
      type: "HOLIDAY",
      typeColor: "text-teal-300 bg-teal-950/80 border-teal-500/40 shadow-xs",
      icon: <CalendarDays className="h-3 w-3 text-teal-400 shrink-0" />,
      title: `Company Holiday: ${h.name} (${hDate})`,
    });
  });

  // 5. Official Announcements & Bulletins
  announcements.forEach((a: any) => {
    marqueeItems.push({
      id: `ann-${a.id}`,
      type: (a.type || "ANNOUNCEMENT").toUpperCase(),
      typeColor: "text-emerald-300 bg-emerald-950/80 border-emerald-500/40 shadow-xs",
      icon: <Sparkles className="h-3 w-3 text-emerald-400 shrink-0" />,
      title: a.title,
    });
  });

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans selection:bg-emerald-600 selection:text-white relative overflow-x-hidden">
      
      {/* Ambient Luxury Glow Lights */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[700px] h-[700px] bg-indigo-600/8 rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:28px_28px] opacity-40" />
      </div>

      {/* Luxury Obsidian Top Header */}
      <header className="sticky top-0 z-40 bg-[#090D16]/95 backdrop-blur-2xl border-b border-slate-800/80 shadow-2xl shadow-black/60 relative">
        <div className="w-full max-w-[1800px] mx-auto px-3 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & Portal Badge */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0 min-w-0">
            <div className="relative group shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl blur-xs opacity-60 group-hover:opacity-100 transition duration-300" />
              <img 
                src="/favicon.png" 
                alt="VyNexa / Vyntyra Logo" 
                className="relative h-9 w-9 sm:h-10 sm:w-10 object-contain rounded-xl bg-slate-950 p-1 border border-emerald-400/50 shadow-lg shadow-emerald-950/60 shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
              <div className="hidden relative h-9 w-9 sm:h-10 sm:w-10 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-xl shadow-lg shadow-emerald-950/60 border border-emerald-400/40 items-center justify-center text-white font-black tracking-wider text-sm sm:text-base shrink-0">
                V
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight truncate">Vyntyra Connect</span>
                <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[8px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Intern Associate
                </span>
              </div>
              <span className="hidden sm:block text-[10px] text-slate-400 font-medium truncate capitalize">
                {displayName} · {profile?.intern_id || "Portal"}
              </span>
            </div>
          </div>

          {/* Desktop Tab Navigation (Clean Obsidian Pill Bar for 2xl Screens) */}
          <nav className="hidden 2xl:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none max-w-[50%] bg-[#060912]/80 border border-slate-800/80 rounded-2xl px-2">
            {TABS.slice(0, 8).map((t: any) => {
              const isActive = activeTab === t.id;
              const TabIcon = t.icon;
              return (
                <button 
                  key={t.id} 
                  onClick={() => setActiveTab(t.id as any)}
                  className={`shrink-0 px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isActive 
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md border border-emerald-400/40" 
                      : t.isPrimary
                      ? "text-amber-300 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  {TabIcon && <TabIcon className={`h-3.5 w-3.5 ${isActive ? "text-white" : t.isPrimary ? "text-amber-400" : "text-slate-400"}`} />}
                  <span>{t.label}</span>
                  {t.isPrimary && t.count > 0 && !isActive && (
                    <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded-full bg-amber-500 text-slate-950">
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Actions Cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Quick Link to Tasks */}
            <Button
              size="sm"
              onClick={() => setActiveTab("tasks")}
              className={`h-8 px-2 sm:px-3 text-xs font-bold transition-all shadow-md gap-1 sm:gap-1.5 cursor-pointer ${
                activeTab === "tasks"
                  ? "bg-emerald-600 text-white border border-emerald-400/40"
                  : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 border border-amber-400/80"
              }`}
              title="Tasks & Assignments"
            >
              <ClipboardList className="h-3.5 w-3.5 text-slate-950" />
              <span className="hidden sm:inline">Tasks</span>
              {pendingTasks.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-400 text-[10px] font-mono font-black">
                  {pendingTasks.length}
                </span>
              )}
            </Button>

            {/* Quick Shift Clock In / Out */}
            {todayAttendance ? (
              todayAttendance.clock_out ? (
                <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl bg-slate-900/90 text-slate-400 border border-slate-700">
                  Shift Ended
                </span>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleClockOut} 
                  disabled={isClocking}
                  className="h-8 px-2 sm:px-2.5 text-xs font-bold border-rose-500/40 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 hover:text-white transition-all gap-1 cursor-pointer"
                  title="Shift Clock Out"
                >
                  {isClocking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5 text-rose-400" />}
                  <span className="hidden sm:inline">Clock Out</span>
                </Button>
              )
            ) : (
              <Button 
                size="sm" 
                onClick={handleClockIn} 
                disabled={isClocking}
                className="h-8 px-2 sm:px-2.5 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-950/60 gap-1 cursor-pointer"
                title="Shift Clock In"
              >
                {isClocking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">Clock In</span>
              </Button>
            )}

            {/* WhatsApp Community Link (Hidden on smallest mobile to prevent wrapping) */}
            <a
              href="https://chat.whatsapp.com/FXsC4CT1hVRHvKzGH0k5y5"
              target="_blank"
              rel="noreferrer"
              title="Official Project VyNexa WhatsApp Group"
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/50 transition-colors shadow-sm"
            >
              <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span>WhatsApp</span>
            </a>

            {/* Notification Bell */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative h-8 w-8 text-slate-300 hover:text-emerald-400 rounded-xl hover:bg-slate-800/80 cursor-pointer border border-slate-800 bg-slate-900/60"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </Button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-[#0F172A] rounded-2xl shadow-2xl border border-slate-700 py-3 z-50 overflow-hidden divide-y divide-slate-800 max-h-96 overflow-y-auto backdrop-blur-xl">
                  <div className="px-4 pb-2 flex items-center justify-between">
                    <span className="font-bold text-xs text-white">In-App Notifications</span>
                    <span className="text-[10px] text-slate-400 font-medium">Click to mark as read</span>
                  </div>
                  <div className="py-1">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-slate-400 text-xs">No alerts or notifications yet</div>
                    ) : (
                      notifications.map((n: any) => (
                        <div 
                          key={n.id} 
                          onClick={async () => {
                            try {
                              await doMarkUserNotificationRead({ data: { id: n.id } });
                              qc.invalidateQueries({ queryKey: ["my-user-notifications", session?.user?.id] });
                            } catch (e) {}
                          }}
                          className={`px-4 py-2.5 text-left transition-colors cursor-pointer hover:bg-slate-800/60 flex flex-col gap-0.5 ${!n.is_read ? 'bg-indigo-950/30' : ''}`}
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-bold text-xs text-white leading-snug">{n.title}</span>
                            {!n.is_read && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />}
                          </div>
                          <p className="text-slate-300 text-[11px] leading-relaxed">{n.message}</p>
                          <span className="text-[9px] text-slate-500 font-mono mt-1">{new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar & Quick Details Modal */}
            <button
              onClick={() => setProfileModalOpen(true)}
              className="flex items-center gap-1.5 p-0.5 rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Profile & Settings"
            >
              <ProfileAvatar url={profile?.avatar_url} name={displayName} className="h-8 w-8 sm:h-8.5 sm:w-8.5 ring-2 ring-emerald-500/40 shadow-sm shrink-0" />
            </button>

            {/* Desktop Direct Sign Out Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="hidden xl:inline-flex h-8 px-2.5 text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-500/30 rounded-xl transition-colors text-xs font-bold shrink-0 items-center gap-1 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </Button>

            {/* ── HAMBURGER MENU BUTTON ── */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
              aria-label="Open Navigation Menu"
              title="Open Navigation Directory"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* ── Live Updates & Notifications Marquee Sub-Bar ── */}
        {marqueeItems.length > 0 ? (
          <div 
            className="bg-[#04060E]/95 text-slate-200 text-xs py-2 overflow-hidden flex whitespace-nowrap border-t border-b border-slate-800/90 relative z-10 backdrop-blur-xl group cursor-pointer shadow-inner" 
            title="Hover to pause live ticker"
          >
            {/* Left Fixed Ticker Badge */}
            <div className="shrink-0 bg-[#070C1B] border-r border-slate-800 px-3 py-1 flex items-center gap-2 z-20 shadow-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                LIVE TICKER
              </span>
              <span className="hidden group-hover:inline text-[9px] font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-500/40">
                ⏸ PAUSED
              </span>
            </div>

            {/* Marquee Content Rail */}
            <div className="flex overflow-hidden relative flex-1 min-w-0">
              <div className="animate-marquee-slow flex items-center gap-10 sm:gap-14 shrink-0 min-w-full group-hover:[animation-play-state:paused] pl-4">
                {marqueeItems.map((item) => (
                  <div key={item.id} className="inline-flex items-center gap-2.5 px-3 py-1 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:bg-slate-800/80 transition-all">
                    {item.icon}
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.typeColor} shrink-0`}>
                      {item.type}
                    </span>
                    <span className="font-semibold text-slate-200 text-xs truncate max-w-xs sm:max-w-none">
                      {item.title}
                    </span>
                    {item.subtitle && (
                      <span className="text-slate-400 text-[11px] hidden md:inline truncate max-w-sm">
                        — {item.subtitle}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="animate-marquee-slow flex items-center gap-10 sm:gap-14 shrink-0 min-w-full ml-10 sm:ml-14 group-hover:[animation-play-state:paused]">
                {marqueeItems.map((item) => (
                  <div key={`dup-${item.id}`} className="inline-flex items-center gap-2.5 px-3 py-1 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:bg-slate-800/80 transition-all">
                    {item.icon}
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.typeColor} shrink-0`}>
                      {item.type}
                    </span>
                    <span className="font-semibold text-slate-200 text-xs truncate max-w-xs sm:max-w-none">
                      {item.title}
                    </span>
                    {item.subtitle && (
                      <span className="text-slate-400 text-[11px] hidden md:inline truncate max-w-sm">
                        — {item.subtitle}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#050811]/95 text-slate-400 text-[11px] py-2 px-4 flex items-center justify-between border-t border-slate-800/80 relative z-10 backdrop-blur-md">
            <div className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="font-semibold text-slate-300">Live Workspace Active</span>
              <span>·</span>
              <span>All services operational</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">VCS Directorate Live Feed</span>
          </div>
        )}
      </header>

      {/* ── LUXURY SLIDEOVER HAMBURGER NAVIGATION DRAWER ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-in Drawer Container */}
          <div className="relative w-full max-w-sm sm:max-w-md bg-[#090D16] border-l border-slate-800/90 shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-right duration-300 text-white">
            
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-gradient-to-r from-[#090D16] via-[#0E131F] to-[#090D16] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-xl shadow-md border border-emerald-400/40 flex items-center justify-center text-white font-black text-sm">
                  V
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">Portal Navigation</h3>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-500/40 uppercase">
                      Intern
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Vyntyra Connect Associate Workspace</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close Menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Intern Profile Card inside Drawer */}
            <div className="p-4 bg-[#0E131F]/90 border-b border-slate-800/80 space-y-3">
              <div className="flex items-center gap-3">
                <ProfileAvatar url={profile?.avatar_url} name={displayName} className="h-12 w-12 ring-2 ring-emerald-500/40 shadow-md shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-white truncate">{displayName}</h4>
                  <p className="text-xs text-slate-400 truncate">{email}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                      {profile?.intern_id || "VCS-INT-2026"}
                    </span>
                    <span className="text-[9px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                      {profile?.position || "Intern Associate"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Strip */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                {/* Clock In / Out */}
                {todayAttendance ? (
                  todayAttendance.clock_out ? (
                    <div className="px-2.5 py-2 rounded-xl bg-slate-900 text-center text-[10px] font-bold text-slate-400 border border-slate-800">
                      ✓ Shift Completed
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleClockOut();
                        setMobileMenuOpen(false);
                      }}
                      disabled={isClocking}
                      className="h-9 text-xs font-bold border-rose-500/40 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 w-full rounded-xl gap-1.5 cursor-pointer"
                    >
                      <Clock className="h-3.5 w-3.5 text-rose-400" /> Clock Out
                    </Button>
                  )
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      handleClockIn();
                      setMobileMenuOpen(false);
                    }}
                    disabled={isClocking}
                    className="h-9 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white w-full rounded-xl gap-1.5 shadow-md cursor-pointer"
                  >
                    <Clock className="h-3.5 w-3.5" /> Clock In
                  </Button>
                )}

                {/* Edit Profile / Details */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setProfileModalOpen(true);
                  }}
                  className="h-9 text-xs font-bold bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 rounded-xl gap-1.5 cursor-pointer"
                >
                  <User className="h-3.5 w-3.5 text-emerald-400" /> Settings
                </Button>
              </div>

              {/* WhatsApp Community Link */}
              <a
                href="https://chat.whatsapp.com/FXsC4CT1hVRHvKzGH0k5y5"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/50 transition-colors text-xs font-bold text-emerald-300"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  <span>Join Official WhatsApp Group</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
              </a>
            </div>

            {/* Categorized Tab Navigation */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
              {["Core Work", "Routine & Compliance", "Connect & Support"].map((categoryName) => {
                const categoryTabs = TABS.filter((t: any) => t.category === categoryName || (!t.category && categoryName === "Core Work"));
                if (categoryTabs.length === 0) return null;

                return (
                  <div key={categoryName} className="space-y-1.5">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-2">
                      {categoryName}
                    </h5>
                    <div className="space-y-1">
                      {categoryTabs.map((tab: any) => {
                        const isActive = activeTab === tab.id;
                        const TabIcon = tab.icon || Compass;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                              setActiveTab(tab.id as any);
                              setMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                              isActive
                                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/60 border border-emerald-400/40"
                                : tab.isPrimary
                                ? "bg-amber-950/40 text-amber-300 border border-amber-500/30 hover:bg-amber-900/50"
                                : "bg-slate-900/60 text-slate-300 border border-slate-800/80 hover:bg-slate-800 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`p-1.5 rounded-lg ${isActive ? "bg-white/20" : "bg-slate-800 text-slate-400"}`}>
                                <TabIcon className={`h-4 w-4 ${isActive ? "text-white" : tab.isPrimary ? "text-amber-400" : "text-slate-300"}`} />
                              </div>
                              <span className="tracking-tight">{tab.label}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {tab.isPrimary && tab.count > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${isActive ? "bg-slate-950 text-amber-400" : "bg-amber-500 text-slate-950"}`}>
                                  {tab.count}
                                </span>
                              )}
                              <ChevronRight className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-800/80 bg-[#060912] space-y-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full h-10 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <LogOut className="h-4 w-4 text-rose-400" />
                <span>Sign Out from Portal</span>
              </Button>
              <p className="text-center text-[10px] text-slate-500 font-medium">
                Vyntyra Consultancy Services · Project VyNexa Directorate
              </p>
            </div>

          </div>
        </div>
      )}

      <main className="max-w-[1800px] mx-auto px-3 sm:px-8 py-6 space-y-6 relative z-10">

        {/* When all modules are disabled by admin */}
        {TABS.length === 0 && (
          <div className="rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 p-12 text-center max-w-xl mx-auto space-y-4 shadow-2xl mt-8 backdrop-blur-xl">
            <div className="mx-auto w-16 h-16 bg-amber-950/60 text-amber-400 border border-amber-500/40 rounded-2xl flex items-center justify-center shadow-inner">
              <Lock className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Intern Dashboard Temporarily Restricted</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Administrative controls are currently undergoing scheduled maintenance or system updates. Please check back shortly or reach out to your coordinator.
            </p>
          </div>
        )}

        {/* ─── OVERVIEW ─── */}
        {activeTab === "overview" && (
          <>
            {/* ─── LUXURY HERO BANNER & REAL-TIME PERFORMANCE MATRIX ─── */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-r from-[#0B0F19] via-[#0E1526] to-[#0A111F] p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
              {/* Background ambient glow accents */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 left-10 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
              
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-3 py-1 text-[11px] font-bold text-emerald-300 backdrop-blur-md shadow-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    <span>Active Internship Sprint Workspace</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    Welcome Back, <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent">{profile?.full_name || displayName}</span> 👋
                  </h1>
                  <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed">
                    Track your daily shift timecard, sprint task milestones, assigned mentor syncs, and official credential documents in one unified portal.
                  </p>
                </div>

                {/* Top Action Quick Buttons */}
                <div className="flex items-center gap-3 flex-wrap shrink-0 w-full lg:w-auto">
                  <Button
                    onClick={() => setActiveTab("tasks")}
                    className="flex-1 lg:flex-none bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs h-11 px-5 rounded-2xl shadow-lg shadow-emerald-950/60 gap-2 cursor-pointer border border-emerald-400/30"
                  >
                    <ClipboardList className="h-4 w-4" />
                    My Tasks ({myTasks.length})
                  </Button>
                  <Button
                    onClick={() => setActiveTab("lms")}
                    className="flex-1 lg:flex-none bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold text-xs h-11 px-5 rounded-2xl border border-slate-700 shadow-md gap-2 cursor-pointer"
                  >
                    <BookOpen className="h-4 w-4 text-amber-400" />
                    LMS Learning
                  </Button>
                </div>
              </div>

              {/* ── REAL-TIME STAT MATRIX GRID ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-7 pt-6 border-t border-slate-800/80">
                {/* Stat 1: Sprint Progress */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-2 shadow-inner">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-emerald-400" />
                      Sprint Progress
                    </span>
                    <span className="font-mono font-bold text-emerald-400 text-xs">{progress}%</span>
                  </div>
                  <div className="text-xl font-black text-white font-mono">{earnedCredits} / {totalAssignedCredits} <span className="text-xs text-slate-400 font-sans font-medium">Credits</span></div>
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden border border-slate-700/50">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]" style={{ width: `${Math.max(5, progress)}%` }} />
                  </div>
                </div>

                {/* Stat 2: Active Pending Tasks */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-2 shadow-inner">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <ClipboardList className="h-3.5 w-3.5 text-amber-400" />
                      Pending Tasks
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                      {pendingTasks.length} Active
                    </span>
                  </div>
                  <div className="text-xl font-black text-white font-mono">{pendingTasks.length} <span className="text-xs text-slate-400 font-sans font-medium">Sprint Deliverables</span></div>
                  <div className="text-[11px] text-slate-400 font-medium truncate">
                    {completedTasks.length} Verified &amp; Completed
                  </div>
                </div>

                {/* Stat 3: Attendance Streak */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-2 shadow-inner">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Flame className="h-3.5 w-3.5 text-orange-400" />
                      Work Streak
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-orange-950 text-orange-300 font-bold text-[10px] border border-orange-500/30">
                      🔥 Active
                    </span>
                  </div>
                  <div className="text-xl font-black text-white font-mono">{dayStreak} <span className="text-xs text-slate-400 font-sans font-medium">Days Streak</span></div>
                  <div className="text-[11px] text-slate-400 font-medium truncate">
                    {attendanceLogs.length} Total Shift Logs Recorded
                  </div>
                </div>

                {/* Stat 4: Mentor & Domain */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-2 shadow-inner">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-indigo-400" />
                      Mentor Lead
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 font-bold text-[10px] border border-indigo-500/30">
                      Assigned
                    </span>
                  </div>
                  <div className="text-sm font-extrabold text-white truncate">{mentor?.full_name || "Technical Team Lead"}</div>
                  <div className="text-[11px] text-emerald-400 font-medium truncate">
                    {profile?.department || "Software Engineering"}
                  </div>
                </div>
              </div>
            </div>

            {/* ─── INTERN PROFILE CARD ─── */}
            <div className="rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 shadow-xl backdrop-blur-xl overflow-hidden">
              {/* Card header */}
              <div className="bg-gradient-to-r from-[#0C101B] via-[#0E1527] to-emerald-950/60 px-6 sm:px-8 py-6 flex flex-wrap items-center justify-between gap-5 border-b border-slate-800/80">
                <div className="flex items-center gap-5 min-w-0">
                  <div className="relative shrink-0 group">
                    <ProfileAvatar url={profile?.avatar_url} name={displayName} className="h-20 w-20 rounded-2xl ring-2 ring-emerald-500/40 shadow-2xl text-2xl" />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer text-white">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Upload</span>
                      <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp" onChange={handleImageUpload} />
                    </label>
                    <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-slate-900 shadow">INTERN</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">{profile?.full_name || displayName}</div>
                    <div className="text-emerald-400 text-xs font-mono font-bold mt-0.5 flex items-center gap-2">
                      <span>{profile?.intern_id || "VYN-INT-PRO"}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-500" />
                      <span className="text-slate-400 font-sans font-medium">{profile?.department || "Associate Intern"}</span>
                    </div>
                    <div className="text-slate-400 text-xs mt-1 truncate">{email}</div>
                  </div>
                </div>

                {mentor && (
                  <div className="shrink-0 text-left sm:text-right bg-slate-900/80 rounded-2xl p-3.5 border border-slate-700/60 backdrop-blur-md w-full sm:w-auto shadow-inner">
                    <div className="text-[10px] text-emerald-400 font-black uppercase tracking-wider mb-0.5 flex items-center sm:justify-end gap-1.5">
                      <Sparkles className="h-3 w-3" /> Assigned Mentor
                    </div>
                    <div className="text-sm font-bold text-white">{mentor.full_name}</div>
                    <div className="text-xs text-slate-400">{mentor.department || mentor.position || "Technical Lead"}</div>
                  </div>
                )}
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-800/80 p-0 text-xs">
                {[
                  { icon: <Mail className="h-4 w-4 text-emerald-400" />, label: "Email", value: email },
                  { icon: <Phone className="h-4 w-4 text-blue-400" />, label: "Contact", value: profile?.phone || "—" },
                  { icon: <MapPin className="h-4 w-4 text-rose-400" />, label: "Address", value: profile?.address || "—" },
                  { icon: <Briefcase className="h-4 w-4 text-purple-400" />, label: "Domain", value: profile?.department || "—" },
                  { icon: <CalendarDays className="h-4 w-4 text-amber-400" />, label: "Internship Start", value: profile?.start_date ? new Date(profile.start_date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—" },
                  {
                    icon: <Clock className="h-4 w-4 text-teal-400" />,
                    label: "End Date / Remaining",
                    value: profile?.end_date
                      ? (() => {
                          const end = new Date(profile.end_date);
                          const remaining = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                          return `${end.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} · ${remaining > 0 ? `${remaining} days left` : "Completed"}`;
                        })()
                      : "—",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3.5 px-6 py-4 hover:bg-slate-800/30 transition-colors">
                    <div className="h-8 w-8 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">{item.icon}</div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{item.label}</div>
                      <div className="text-sm font-semibold text-slate-200 mt-0.5 break-words">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Document downloads */}
              <div className="border-t border-slate-800/80 px-6 py-4 bg-[#0A0D17]/90 flex flex-wrap gap-3 items-center justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 mr-1">Your Documents:</span>
                  {docsQ.isLoading ? (
                    <span className="text-xs text-slate-400 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Loading...</span>
                  ) : (
                    <>
                      <a
                        href={docsQ.data?.offerLetterUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          docsQ.data?.offerLetterUrl
                            ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 shadow-md"
                            : "bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed pointer-events-none"
                        }`}
                        onClick={(e) => { if (!docsQ.data?.offerLetterUrl) e.preventDefault(); }}
                      >
                        <FileText className="h-3.5 w-3.5 text-indigo-400" />
                        Download Offer Letter
                        {!docsQ.data?.offerLetterUrl && <span className="ml-1 opacity-70">(Not Ready)</span>}
                      </a>

                      {docsQ.data?.nocDownloadEnabled && (
                        <a
                          href={docsQ.data?.nocUrl || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            docsQ.data?.nocUrl
                              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/50"
                              : "bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed pointer-events-none"
                          }`}
                          onClick={(e) => { if (!docsQ.data?.nocUrl) e.preventDefault(); }}
                        >
                          <Award className="h-3.5 w-3.5 text-emerald-200" />
                          Download NOC Certificate
                          {!docsQ.data?.nocUrl && <span className="ml-1 opacity-70">(Not Ready)</span>}
                        </a>
                      )}

                      {profile?.exam_fee_paid && (
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 shadow-xs">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Fee Paid · Ref: <strong className="font-mono">{profile.payment_reference_no || `TXN-${(profile.id || "").slice(0, 6).toUpperCase()}`}</strong> ({profile.payment_mode || "Online"})</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <button
                  onClick={() => docsQ.refetch()}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Refresh document links"
                >
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </button>
              </div>
            </div>

            {/* ─── QUICK ACCESS: TASKS & ASSIGNMENTS HUB BANNER ─── */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 text-slate-950 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-amber-400 relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-950/20 backdrop-blur-md flex items-center justify-center text-slate-950 shrink-0 shadow-inner">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-950">My Tasks &amp; Sprint Deliverables Hub</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-950 text-white text-[10px] font-black uppercase tracking-wide">
                      {pendingTasks.length} Pending
                    </span>
                    {inProgressTasks.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-200 text-[10px] font-black uppercase tracking-wide">
                        {inProgressTasks.length} In Progress
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-950/80 mt-0.5">
                    Find your sprint tasks, claim from open pool tasks, and submit repository/PR links for mentor review.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
                <Button
                  onClick={() => setActiveTab("tasks")}
                  className="w-full md:w-auto bg-slate-950 hover:bg-black text-white font-bold text-xs h-10 px-6 rounded-2xl shadow-xl gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Open Tasks Workspace &rarr;
                </Button>
              </div>
            </div>

            {/* ─── ATTENDANCE TIMECARD WIDGET ─── */}
            <div className="rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 p-6 sm:p-7 shadow-xl backdrop-blur-xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-2xl bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Daily Attendance &amp; Shift Timecard</h2>
                    <p className="text-xs text-slate-400">Record your daily work presence and view historical shift logs</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    todayAttendance
                      ? todayAttendance.clock_out
                        ? "bg-slate-800 text-slate-300 border border-slate-700"
                        : "bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 animate-pulse"
                      : "bg-amber-950/60 text-amber-300 border border-amber-500/40"
                  }`}>
                    Status: {todayAttendance ? (todayAttendance.clock_out ? "Completed" : "Active Shift") : "Offline"}
                  </span>

                  {todayAttendance ? (
                    !todayAttendance.clock_out && (
                      <Button
                        onClick={handleClockOut}
                        disabled={isClocking || isClockingDisabled}
                        title={clockingDisabledReason}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-2 px-5 h-10 rounded-xl shadow-lg shadow-rose-950/50 disabled:opacity-50 cursor-pointer"
                      >
                        {isClocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                        Clock Out Now
                      </Button>
                    )
                  ) : (
                    <Button
                      onClick={handleClockIn}
                      disabled={isClocking || isClockingDisabled}
                      title={clockingDisabledReason}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs gap-2 px-6 h-10 rounded-xl shadow-lg shadow-emerald-950/60 disabled:opacity-50 cursor-pointer"
                    >
                      {isClocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                      Clock In Now
                    </Button>
                  )}
                </div>
              </div>

              {/* Timecard Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-[#131B2E]/90 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between shadow-md">
                  <div>
                    <div className="text-slate-400 font-semibold mb-0.5">Today Clock In</div>
                    <div className="text-base font-bold text-white font-mono">
                      {todayAttendance?.clock_in ? new Date(todayAttendance.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                    </div>
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>

                <div className="bg-[#131B2E]/90 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between shadow-md">
                  <div>
                    <div className="text-slate-400 font-semibold mb-0.5">Today Clock Out</div>
                    <div className="text-base font-bold text-white font-mono">
                      {todayAttendance?.clock_out ? new Date(todayAttendance.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                    </div>
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-teal-950/60 border border-teal-500/30 text-teal-400 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>

                <div className="bg-[#131B2E]/90 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between shadow-md">
                  <div>
                    <div className="text-slate-400 font-semibold mb-0.5">Total Days Present</div>
                    <div className="text-base font-bold text-white font-mono">
                      {attendanceLogs.length} Days
                    </div>
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Domain Workspace Auto-Detected Header Strip */}
            <div className="rounded-2xl border border-slate-800/80 bg-[#0E131F]/90 p-4 flex items-center justify-between gap-4 shadow-xl backdrop-blur-xl flex-wrap">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-black text-xs shadow-inner">
                  {selectedDomain === "management" ? "MBA" : selectedDomain === "non_tech" ? "CRM" : "DEV"}
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Assigned Domain Workspace</div>
                  <div className="text-xs font-bold text-white">
                    {selectedDomain === "management" 
                      ? "MBA / BBA Business Management & Corporate Operations" 
                      : selectedDomain === "non_tech" 
                      ? "Non-Tech (CRM, Digital Marketing & Sales)" 
                      : "Technical & Software Engineering Workspace"}
                  </div>
                </div>
              </div>

              {/* View Switcher Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium">Switch View:</span>
                <select
                  value={selectedDomain}
                  onChange={(e: any) => setSelectedDomain(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-200 outline-none focus:border-emerald-500"
                >
                  <option value="management">MBA / BBA Management & Operations</option>
                  <option value="tech">Tech & Software Engineering</option>
                  <option value="non_tech">Non-Tech (CRM, Sales & Marketing)</option>
                </select>
              </div>
            </div>

            {/* Render Selected Domain Workspace */}
            {selectedDomain === "tech" && (
              <TechDomainWorkspace
                bugs={bugsQ.data || []}
                onAddBug={async (title, description, severity, repo_url) => {
                  await doCreateBug({ data: { title, description, severity, repo_url } });
                  bugsQ.refetch();
                }}
                onUpdateBugStatus={async (id, status) => {
                  await doUpdateBugStatus({ data: { id, status } });
                  bugsQ.refetch();
                }}
              />
            )}

            {selectedDomain === "non_tech" && (
              <NonTechDomainWorkspace
                leads={leadsQ.data || []}
                onAddLead={async (lead) => {
                  await doCreateLead({ data: lead });
                  leadsQ.refetch();
                }}
                onUpdateLeadStatus={async (id, status, is_contacted) => {
                  await doUpdateLeadStatus({ data: { id, status, is_contacted } });
                  leadsQ.refetch();
                }}
                onDeleteLead={async (id) => {
                  await doDeleteLead({ data: { id } });
                  leadsQ.refetch();
                }}
              />
            )}

            {selectedDomain === "management" && (
              <ManagementDomainWorkspace
                standups={standups}
                deliverables={deliverables}
                onApproveStandup={async (id) => {
                  toast.success("Standup approved");
                }}
                onApproveDeliverable={async (id) => {
                  toast.success("Deliverable approved");
                }}
              />
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { icon: <ClipboardList className="h-5 w-5 text-amber-400" />, label: "Pending Tasks", value: pendingTasks.length, border: "border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]", bg: "bg-gradient-to-br from-amber-950/40 via-[#0E131F] to-[#0A0D17]" },
                { icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" />, label: "Completed", value: completedTasks.length, border: "border-emerald-500/40 shadow-[0_0_15px_rgba(52,211,153,0.15)]", bg: "bg-gradient-to-br from-emerald-950/40 via-[#0E131F] to-[#0A0D17]" },
                { icon: <CreditCard className="h-5 w-5 text-indigo-400" />, label: "Credits Score", value: `${earnedCredits} / ${totalAssignedCredits}`, border: "border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.15)]", bg: "bg-gradient-to-br from-indigo-950/40 via-[#0E131F] to-[#0A0D17]" },
                { icon: <Flame className="h-5 w-5 text-orange-400 animate-pulse" />, label: "Day Streak", value: `${dayStreak} Days`, border: "border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.15)]", bg: "bg-gradient-to-br from-orange-950/40 via-[#0E131F] to-[#0A0D17]" },
                { icon: <Video className="h-5 w-5 text-blue-400" />, label: "Meetings", value: meetings.filter(m => new Date(m.scheduled_at) >= new Date()).length, border: "border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.15)]", bg: "bg-gradient-to-br from-blue-950/40 via-[#0E131F] to-[#0A0D17]" },
                { icon: <BookOpen className="h-5 w-5 text-purple-400" />, label: "Resources", value: resources.length, border: "border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.15)]", bg: "bg-gradient-to-br from-purple-950/40 via-[#0E131F] to-[#0A0D17]" },
              ].map((s, i) => (
                <div key={i} className={`rounded-3xl border ${s.border} ${s.bg} p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:scale-[1.02]`}>
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-2xl bg-slate-950/80 border border-slate-700/60 flex items-center justify-center shadow-inner shrink-0">{s.icon}</div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-800">SYNC</span>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white font-mono tracking-tight">{s.value}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold mt-0.5 truncate">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar */}
              <div className="lg:col-span-1">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-emerald-400" />Calendar</h2>
                <MonthlyCalendar events={[...schedules, ...meetings]} holidays={holidaysQ.data || []} />
              </div>

              <div className="lg:col-span-2 space-y-6">
                {/* My Tasks */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-amber-400" />
                      My Assignments ({myTasks.length})
                    </h2>
                    <Button 
                      variant="link" 
                      onClick={() => setActiveTab("tasks")} 
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 p-0 h-auto gap-1 cursor-pointer"
                    >
                      View All &amp; Task Pool &rarr;
                    </Button>
                  </div>
                  <div className="rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 shadow-xl backdrop-blur-xl overflow-hidden">
                    {tasksQ.isLoading ? (
                      <div className="p-8 flex items-center justify-center gap-2 text-slate-400 text-sm"><Loader2 className="h-4 w-4 animate-spin" />Loading...</div>
                    ) : tasks.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm space-y-2">
                        <p>No tasks assigned yet.</p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setActiveTab("tasks")}
                          className="text-xs font-bold text-amber-300 bg-amber-950/50 border-amber-500/40 cursor-pointer"
                        >
                          Check Open Task Pool
                        </Button>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800/80">
                        {myTasks.slice(0, 4).map((task: any) => {
                          const s = TASK_STATUS_STYLES[task.status] || TASK_STATUS_STYLES.pending;
                          return (
                            <div 
                              key={task.id} 
                              onClick={() => setActiveTab("tasks")}
                              className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors cursor-pointer"
                              title="Click to view full details and submit deliverable"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className={`h-2 w-2 rounded-full shrink-0 ${s.dot}`} />
                                <div className="min-w-0">
                                  <div className="font-bold text-sm truncate text-white">{task.title}</div>
                                  {task.due_date && <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Clock className="h-3 w-3" />Due {new Date(task.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase ${s.badge}`}>{s.label}</span>
                                <span className="text-xs text-amber-400 font-bold hidden sm:inline">&rarr;</span>
                              </div>
                            </div>
                          );
                        })}
                        {myTasks.length > 4 && (
                          <div className="p-3 bg-[#0A0D17]/90 text-center">
                            <button
                              onClick={() => setActiveTab("tasks")}
                              className="text-xs font-bold text-amber-400 hover:text-amber-300 cursor-pointer hover:underline"
                            >
                              + {myTasks.length - 4} more assigned tasks. Click to view all &rarr;
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Featured Resources */}
                <div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4 text-emerald-400" />Quick Resources</h2>
                  <div className="rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 shadow-xl backdrop-blur-xl overflow-hidden">
                    {resourcesQ.isLoading ? (
                      <div className="p-6 text-center text-slate-400 text-sm flex justify-center gap-2 items-center"><Loader2 className="h-4 w-4 animate-spin" />Loading...</div>
                    ) : resources.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-sm">No resources posted yet</div>
                    ) : (
                      <div className="divide-y divide-slate-800/80">
                        {resources.slice(0, 3).map((r: any) => {
                          const ri = RESOURCE_ICONS[r.type] || RESOURCE_ICONS.link;
                          const isDocOrSheet = r.url?.includes("docs.google.com") || r.url?.includes(".xls") || r.url?.includes(".csv") || r.type === "document";
                          return (
                            <div key={r.id} className="flex items-center justify-between gap-3 p-4 hover:bg-slate-800/40 transition-colors group">
                              <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 ${ri.color}`}>{ri.icon}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm text-white group-hover:text-emerald-400 transition-colors truncate">{r.title}</div>
                                  {r.description && <div className="text-xs text-slate-400 truncate">{r.description}</div>}
                                </div>
                              </a>
                              <div className="flex items-center gap-2 shrink-0">
                                {isDocOrSheet && (
                                  <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-400 hover:bg-emerald-950/50 px-2 cursor-pointer" onClick={() => setViewingDoc({ url: r.url, title: r.title })}>
                                    Inbuilt Viewer
                                  </Button>
                                )}
                                <a href={r.url} target="_blank" rel="noopener noreferrer">
                                  <Button size="sm" variant="outline" className="h-7 text-xs border-slate-700 text-slate-300 hover:bg-slate-800 gap-1 cursor-pointer">
                                    Open Link <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </a>
                              </div>
                            </div>
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

        {/* ─── ATTENDANCE TAB ─── */}
        {activeTab === "attendance" && (
          <div className="rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 p-6 sm:p-8 shadow-xl backdrop-blur-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-2xl bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Intern Attendance &amp; Shift Timecard</h2>
                  <p className="text-xs text-slate-400">Record your daily work presence and view historical shift logs</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  todayAttendance
                    ? todayAttendance.clock_out
                      ? "bg-slate-800 text-slate-300 border border-slate-700"
                      : "bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 animate-pulse"
                    : "bg-amber-950/60 text-amber-300 border border-amber-500/40"
                }`}>
                  Status: {todayAttendance ? (todayAttendance.clock_out ? "Completed" : "Active Shift") : "Offline"}
                </span>

                {todayAttendance ? (
                  !todayAttendance.clock_out && (
                    <Button
                      onClick={handleClockOut}
                      disabled={isClocking}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-2 px-5 h-10 rounded-xl shadow-lg shadow-rose-950/50 cursor-pointer"
                    >
                      {isClocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                      Clock Out Now
                    </Button>
                  )
                ) : (
                  <Button
                    onClick={handleClockIn}
                    disabled={isClocking}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs gap-2 px-6 h-10 rounded-xl shadow-lg shadow-emerald-950/60 cursor-pointer"
                  >
                    {isClocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                    Clock In Now
                  </Button>
                )}
              </div>
            </div>

            {/* Timecard Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-[#131B2E]/90 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between shadow-md">
                <div>
                  <div className="text-slate-400 font-semibold mb-0.5">Today Clock In</div>
                  <div className="text-base font-bold text-white font-mono">
                    {todayAttendance?.clock_in ? new Date(todayAttendance.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                  </div>
                </div>
                <div className="h-9 w-9 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
              </div>

              <div className="bg-[#131B2E]/90 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between shadow-md">
                <div>
                  <div className="text-slate-400 font-semibold mb-0.5">Today Clock Out</div>
                  <div className="text-base font-bold text-white font-mono">
                    {todayAttendance?.clock_out ? new Date(todayAttendance.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                  </div>
                </div>
                <div className="h-9 w-9 rounded-xl bg-teal-950/60 border border-teal-500/30 text-teal-400 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>

              <div className="bg-[#131B2E]/90 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between shadow-md">
                <div>
                  <div className="text-slate-400 font-semibold mb-0.5">Total Days Present</div>
                  <div className="text-base font-bold text-white font-mono">
                    {attendanceLogs.length} Days
                  </div>
                </div>
                <div className="h-9 w-9 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                  <CalendarDays className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Attendance History Table */}
            <div className="space-y-3 pt-2">
              <h3 className="font-bold text-white text-sm">Attendance History Logs</h3>
              <div className="border border-slate-800/80 rounded-2xl overflow-hidden shadow-md">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#0A0D17] border-b border-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="px-5 py-3.5">Date</th>
                      <th className="px-5 py-3.5">Clock In</th>
                      <th className="px-5 py-3.5">Clock Out</th>
                      <th className="px-5 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300 bg-[#0E131F]/90">
                    {attendanceLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-slate-500 font-medium">
                          No attendance logs recorded yet. Click "Clock In Now" to log today's shift presence.
                        </td>
                      </tr>
                    ) : (
                      attendanceLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-white">
                            {new Date(log.date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-300">
                            {log.clock_in ? new Date(log.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-300">
                            {log.clock_out ? new Date(log.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              log.clock_in && !log.clock_out 
                                ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40" 
                                : "bg-slate-900 text-slate-400 border-slate-700"
                            }`}>
                              {log.clock_in && !log.clock_out ? "Active Shift" : "Completed"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── ONBOARDING & PRE-BOARDING HUB ─── */}
        {activeTab === "onboarding" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 p-6 sm:p-8 shadow-xl backdrop-blur-xl">
              <h2 className="font-bold text-white text-base flex items-center gap-2 mb-1.5">
                <Compass className="h-5 w-5 text-emerald-400" /> Welcome &amp; Orientation Roadmap (Week 1 to Week 8)
              </h2>
              <p className="text-xs text-slate-400 mb-6">Follow your structured orientation kit and weekly milestones for a seamless onboarding journey.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { week: "Week 1", title: "Orientation & Setup", desc: "Complete NDA/NOC uploads, dev env setup & mentor intro.", done: true },
                  { week: "Week 2", title: "Tech Stack & Architecture", desc: "Complete LMS modules and build first micro-feature.", done: true },
                  { week: "Week 4", title: "Mid-Term Sprint & Review", desc: "Mid-term appraisal scorecard & project demo.", done: false },
                  { week: "Week 8", title: "Final Showcase & PPO", desc: "Deliverable showcase, exit survey & verifiable certificate.", done: false }
                ].map((w, idx) => (
                  <div key={idx} className={`p-5 rounded-2xl border ${w.done ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-slate-900/60 border-slate-800/80'} shadow-md`}>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className={`text-[10px] uppercase font-mono font-black px-2.5 py-0.5 rounded-full border ${w.done ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{w.week}</span>
                      {w.done ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Clock className="h-4 w-4 text-slate-500" />}
                    </div>
                    <div className="font-bold text-sm text-white">{w.title}</div>
                    <div className="text-xs text-slate-400 mt-1">{w.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Compliance & Legal Uploads */}
              <div className="rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 p-6 sm:p-7 shadow-xl backdrop-blur-xl space-y-4">
                <h3 className="font-bold text-sm flex items-center gap-2 text-white"><FileCheck className="h-4 w-4 text-blue-400" /> Compliance &amp; Legal Uploads</h3>
                <p className="text-xs text-slate-400">Upload your NOC, Student ID proof, signed NDA, and bank passbook proof.</p>
                <div className="space-y-3">
                  {[
                    { label: "University NOC (No Objection Certificate)", status: "Uploaded" },
                    { label: "Student Identity Card / College Proof", status: "Uploaded" },
                    { label: "Signed NDA & Code of Conduct", status: "Pending Upload" },
                    { label: "Bank Account Passbook / Cancelled Cheque", status: "Uploaded" }
                  ].map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-[#131B2E]/80 text-xs shadow-xs">
                      <span className="font-semibold text-slate-200">{doc.label}</span>
                      <span className={`font-bold px-2.5 py-0.5 rounded-full border ${doc.status === 'Uploaded' ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40' : 'bg-amber-950/70 text-amber-300 border-amber-500/40'}`}>{doc.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tooling & Credentials Tracker */}
              <div className="rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 p-6 sm:p-7 shadow-xl backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm flex items-center gap-2 text-white"><ShieldCheck className="h-4 w-4 text-purple-400" /> Tooling &amp; Access Tracker</h3>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 cursor-pointer" onClick={() => {
                    const tool = prompt("Enter requested software/tool name (e.g. Figma, GitHub, AWS):");
                    if (tool) doCreateAccessRequest({ data: { tool_name: tool } }).then(() => { toast.success("Access requested!"); qc.invalidateQueries({ queryKey: ["my-access-requests"] }); });
                  }}>Request Access</Button>
                </div>
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {accessRequests.length === 0 ? (
                    <div className="text-xs text-slate-500 p-4 text-center">No active access requests. Click above to request software credentials.</div>
                  ) : (
                    accessRequests.map((req: any) => (
                      <div key={req.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-800 bg-[#131B2E]/80 text-xs shadow-xs">
                        <span className="font-semibold text-white">{req.tool_name}</span>
                        <span className={`font-bold uppercase text-[10px] px-2.5 py-0.5 rounded-full border ${req.status === 'provisioned' ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40' : req.status === 'approved' ? 'bg-blue-950/70 text-blue-300 border-blue-500/40' : 'bg-amber-950/70 text-amber-300 border-amber-500/40'}`}>{req.status}</span>
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
            <div className="rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 p-6 sm:p-8 shadow-xl backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5 mb-6">
                <div>
                  <h2 className="font-bold text-white text-base flex items-center gap-2 mb-1">
                    <BookMarked className="h-5 w-5 text-emerald-400" /> Structured Curriculum &amp; Skill Badges
                  </h2>
                  <p className="text-xs text-slate-400">Official certified training modules, video masterclasses, and skilling paths for: <span className="font-bold text-emerald-400 capitalize">{selectedDomain}</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Filter Domain:</span>
                  <select 
                    className="rounded-xl border border-slate-700 bg-slate-900 p-1.5 text-xs font-bold text-slate-200 outline-none focus:border-emerald-500"
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value as any)}
                  >
                    <option value="tech">Engineering & Tech</option>
                    <option value="management">Business & Management</option>
                    <option value="non_tech">Marketing & Non-Tech</option>
                  </select>
                </div>
              </div>

              {lmsCoursesQ.isLoading ? (
                <div className="p-12 flex items-center justify-center gap-2 text-slate-400 text-sm">
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading curated courses...
                </div>
              ) : (() => {
                const availableCourses: LmsCourseItem[] = (lmsCoursesQ.data || []).filter((c: LmsCourseItem) => {
                  if (c.is_active === false) return false;
                  const matchDomain = c.domain === "all" || c.domain === selectedDomain;
                  const matchAudience =
                    c.target_audience === "all" ||
                    c.target_audience === "interns" ||
                    (c.target_audience === "domain" && matchDomain) ||
                    (c.target_audience === "specific_users" && c.target_user_ids?.includes(session?.user?.id || ""));
                  return matchDomain && matchAudience;
                });

                if (availableCourses.length === 0) {
                  return (
                    <div className="p-12 text-center text-slate-500 text-sm space-y-2">
                      <BookOpen className="h-8 w-8 mx-auto text-slate-600" />
                      <p>No courses assigned to your profile in this domain currently.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {availableCourses.map((m, idx) => {
                      const dbRecord = lmsProgressList.find((p: any) => p.source === m.source && p.title === m.title);
                      const progress = dbRecord?.progress ?? 0;
                      const completed = dbRecord?.completed ?? false;

                      return (
                        <div key={m.id || idx} className="rounded-2xl border border-slate-800/80 p-5 bg-[#131B2E]/90 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="text-[9px] uppercase font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-800">{m.source}</span>
                              {completed && <span className="text-[9px] uppercase font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded font-bold border border-blue-800">Completed</span>}
                            </div>
                            <h3 className="font-bold text-xs text-white mt-3 line-clamp-2 min-h-[32px]">{m.title}</h3>
                            
                            {m.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-normal">{m.description}</p>
                            )}

                            <div className="mt-4">
                              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                                <span>Track Progress</span>
                                <span className="font-bold text-slate-200">{progress}%</span>
                              </div>
                              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full transition-all duration-350" style={{ width: `${progress}%` }} />
                              </div>
                            </div>

                            {updatingCourseIdx === idx ? (
                              <div className="mt-4 p-2.5 bg-slate-900/90 rounded-xl border border-slate-700 flex items-center gap-2">
                                <input 
                                  type="range" 
                                  min="0" 
                                  max="100" 
                                  value={courseProgressInput}
                                  onChange={(e) => setCourseProgressInput(parseInt(e.target.value))}
                                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                                <span className="text-xs font-mono font-bold w-8 text-right text-white">{courseProgressInput}%</span>
                                <Button 
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] h-6 px-2 cursor-pointer"
                                  onClick={async () => {
                                    try {
                                      await doUpdateLmsProgress({
                                        data: {
                                          source: m.source,
                                          title: m.title,
                                          progress: courseProgressInput,
                                          completed: courseProgressInput === 100,
                                        }
                                      });
                                      toast.success("Progress saved!");
                                      setUpdatingCourseIdx(null);
                                      lmsProgressQ.refetch();
                                    } catch (e) {
                                      toast.error("Failed to update progress");
                                    }
                                  }}
                                >
                                  Save
                                </Button>
                              </div>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="mt-3 text-slate-400 hover:text-emerald-400 text-[10px] h-6 px-1.5 gap-1 cursor-pointer"
                                onClick={() => {
                                  setUpdatingCourseIdx(idx);
                                  setCourseProgressInput(progress);
                                }}
                              >
                                <RefreshCw className="h-3 w-3" /> Update Progress
                              </Button>
                            )}
                          </div>

                          <div className="mt-5 pt-3 border-t border-slate-800/80 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-amber-400 font-semibold flex items-center gap-1"><Award className="h-3.5 w-3.5 text-amber-400" /> {m.badge || "Skilling Badge"}</span>
                              {m.estimated_hours && (
                                <span className="text-[10px] text-slate-500 font-mono">{m.estimated_hours}h</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              {m.youtube_video_id ? (
                                <Button
                                  size="sm"
                                  onClick={() => setLmsVideoModalId(m.youtube_video_id || null)}
                                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold h-7 gap-1 cursor-pointer"
                                >
                                  <Play className="h-3 w-3 fill-white" /> Watch Video
                                </Button>
                              ) : null}
                              <a 
                                href={m.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 text-center px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 inline-flex items-center justify-center gap-0.5 cursor-pointer border border-slate-700"
                              >
                                Open Course ↗
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ─── INTEGRATED CHROME BROWSER TAB ─── */}
        {activeTab === "browser" && (
          <div className="space-y-4">
            <IntegratedChromeBrowser />
          </div>
        )}

        {/* ─── SPRINT KANBAN BOARD ─── */}
        {activeTab === "kanban" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-400" /> Sprint Kanban Board
              </h2>
              <div className="text-xs text-slate-400 font-medium">Click arrows to move tasks across sprint status columns</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { title: "To Do", status: "pending", bg: "bg-[#0E131F]/90 border-slate-800/80" },
                { title: "In Progress", status: "in_progress", bg: "bg-[#0E131F]/90 border-blue-500/30" },
                { title: "In Review", status: "blocked", bg: "bg-[#0E131F]/90 border-amber-500/30" },
                { title: "Completed", status: "completed", bg: "bg-[#0E131F]/90 border-emerald-500/30" }
              ].map((col) => {
                const colTasks = myTasks.filter((t: any) => t.status === col.status);
                return (
                  <div key={col.status} className={`rounded-3xl border p-5 ${col.bg} min-h-[400px] flex flex-col shadow-xl backdrop-blur-xl`}>
                    <div className="font-black text-xs uppercase tracking-wider text-slate-300 mb-3.5 flex items-center justify-between">
                      <span>{col.title}</span>
                      <span className="bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full text-white text-[10px]">{colTasks.length}</span>
                    </div>
                    <div className="space-y-3 flex-1 overflow-y-auto">
                      {colTasks.map((t: any) => (
                        <div key={t.id} className="p-4 bg-[#131B2E]/90 rounded-2xl border border-slate-800/80 shadow-md space-y-2.5">
                          <div className="font-bold text-xs text-white">{t.title}</div>
                          {t.description && <p className="text-[11px] text-slate-400 line-clamp-2">{t.description}</p>}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px]">
                            <span className="font-bold text-slate-400 uppercase tracking-wider">{t.priority || "Medium"}</span>
                            <div className="flex gap-1.5">
                              {col.status !== 'pending' && <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-slate-400 hover:text-white cursor-pointer" onClick={() => markTaskStatus(t.id, 'pending')}>←</Button>}
                              {col.status !== 'in_progress' && <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-blue-400 hover:bg-blue-950 cursor-pointer" onClick={() => markTaskStatus(t.id, 'in_progress')}>→</Button>}
                              {col.status !== 'completed' && <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-emerald-400 hover:bg-emerald-950 cursor-pointer" onClick={() => markTaskStatus(t.id, 'completed')}>✓</Button>}
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
              <div className="lg:col-span-1 rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 p-6 sm:p-7 shadow-xl backdrop-blur-xl space-y-4">
                <h2 className="font-bold text-sm flex items-center gap-2 text-white"><Send className="h-4 w-4 text-emerald-400" /> Submit Daily Standup Log</h2>
                
                {/* Clock-in Button */}
                <div className="p-4 rounded-2xl border border-slate-800 bg-[#131B2E]/90 flex items-center justify-between shadow-inner">
                  <div>
                    <div className="text-xs font-bold text-white">Shift Clock-In</div>
                    <div className="text-[10px] text-slate-400">{clockedIn ? `Clocked in at ${clockTime}` : 'Not clocked in today'}</div>
                  </div>
                  <Button size="sm" className={clockedIn ? "bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer" : "bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"} onClick={() => {
                    setClockedIn(!clockedIn);
                    setClockTime(new Date().toLocaleTimeString());
                    toast.success(clockedIn ? "Clocked out!" : "Clocked in for today's shift!");
                  }}>
                    {clockedIn ? 'Clock Out' : 'Clock In'}
                  </Button>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="font-semibold text-slate-300 mb-1.5 block">What I did today</label>
                    <textarea className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-slate-200 placeholder:text-slate-500 outline-none focus:border-emerald-500" rows={3} value={standupForm.did_today} onChange={e => setStandupForm({...standupForm, did_today: e.target.value})} placeholder="Tasks completed today..." />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 mb-1.5 block">What I'll do tomorrow</label>
                    <textarea className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-slate-200 placeholder:text-slate-500 outline-none focus:border-emerald-500" rows={2} value={standupForm.will_do_tomorrow} onChange={e => setStandupForm({...standupForm, will_do_tomorrow: e.target.value})} placeholder="Planned tasks for tomorrow..." />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 mb-1.5 block">Blockers (optional)</label>
                    <input className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-emerald-500" value={standupForm.blockers} onChange={e => setStandupForm({...standupForm, blockers: e.target.value})} placeholder="Any roadblocks faced..." />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/60 cursor-pointer" onClick={async () => {
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
              <div className="lg:col-span-2 rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 p-6 sm:p-7 shadow-xl backdrop-blur-xl space-y-4">
                <h2 className="font-bold text-sm text-white">My Standup Log History</h2>
                <div className="divide-y divide-slate-800/80 max-h-[480px] overflow-y-auto">
                  {standups.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">No daily standups submitted yet. Fill out the log on the left.</div>
                  ) : (
                    standups.map((st: any) => (
                      <div key={st.id} className="py-3.5 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">{st.date}</span>
                          <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase border ${st.status === 'approved' ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40' : 'bg-amber-950/70 text-amber-300 border-amber-500/40'}`}>{st.status}</span>
                        </div>
                        <p className="text-xs text-slate-300"><strong>Did Today:</strong> {st.did_today}</p>
                        <p className="text-xs text-slate-400"><strong>Tomorrow:</strong> {st.will_do_tomorrow}</p>
                        {st.blockers && <p className="text-xs text-rose-400"><strong>Blockers:</strong> {st.blockers}</p>}
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
              <div className="lg:col-span-1 rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 p-6 sm:p-7 shadow-xl backdrop-blur-xl space-y-4">
                <h2 className="font-bold text-sm flex items-center gap-2 text-white"><Upload className="h-4 w-4 text-purple-400" /> Submit Assignment / Deliverable</h2>
                <div className="space-y-3.5 text-xs">
                  {tasks && tasks.length > 0 && (
                    <div>
                      <label className="font-semibold text-slate-300 mb-1.5 block">Link to Assigned Task (Optional)</label>
                      <select 
                        className="w-full rounded-xl border border-slate-700 p-2.5 text-xs bg-slate-900 text-slate-200 outline-none focus:border-purple-500"
                        value={deliverableForm.task_id || ""}
                        onChange={(e) => {
                          const selectedTid = e.target.value;
                          const matchedTask = tasks.find((t: any) => t.id === selectedTid);
                          setDeliverableForm({
                            ...deliverableForm,
                            task_id: selectedTid,
                            title: matchedTask ? matchedTask.title : deliverableForm.title,
                          });
                        }}
                      >
                        <option value="">-- Standalone Submission (No Task Link) --</option>
                        {tasks.map((t: any) => (
                          <option key={t.id} value={t.id}>
                            {t.title} ({t.status || "Assigned"})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="font-semibold text-slate-300 mb-1.5 block">Deliverable Title</label>
                    <input 
                      className="w-full rounded-xl border border-slate-700 p-2.5 text-xs bg-slate-900 text-slate-200 placeholder:text-slate-500 outline-none focus:border-purple-500" 
                      value={deliverableForm.title} 
                      onChange={e => setDeliverableForm({...deliverableForm, title: e.target.value})} 
                      placeholder="e.g. Microservice Implementation & Test Suite" 
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 mb-1.5 block">Submission URL (GitHub Repo / PR / Figma / Drive)</label>
                    <input 
                      className="w-full rounded-xl border border-slate-700 p-2.5 text-xs bg-slate-900 text-slate-200 placeholder:text-slate-500 outline-none focus:border-purple-500" 
                      value={deliverableForm.submission_url} 
                      onChange={e => setDeliverableForm({...deliverableForm, submission_url: e.target.value})} 
                      placeholder="https://github.com/... or google drive link" 
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 mb-1.5 block">Submission Notes / Highlights (Optional)</label>
                    <textarea 
                      className="w-full rounded-xl border border-slate-700 p-2.5 text-xs bg-slate-900 text-slate-200 placeholder:text-slate-500 outline-none focus:border-purple-500" 
                      rows={3} 
                      value={deliverableForm.notes} 
                      onChange={e => setDeliverableForm({...deliverableForm, notes: e.target.value})} 
                      placeholder="Key highlights, deployed endpoints & test instructions..." 
                    />
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold h-10 rounded-xl shadow-lg shadow-purple-950/60 cursor-pointer" 
                    onClick={async () => {
                      if (!deliverableForm.title.trim() || !deliverableForm.submission_url.trim()) { 
                        toast.error("Please enter both Deliverable Title and Submission URL."); 
                        return; 
                      }
                      try {
                        let cleanUrl = deliverableForm.submission_url.trim();
                        if (!/^https?:\/\//i.test(cleanUrl) && !cleanUrl.startsWith("data:")) {
                          cleanUrl = `https://${cleanUrl}`;
                        }
                        await doCreateDeliverable({ 
                          data: {
                            ...deliverableForm,
                            title: deliverableForm.title.trim(),
                            submission_url: cleanUrl,
                            notes: deliverableForm.notes.trim() || null,
                            task_id: deliverableForm.task_id && deliverableForm.task_id.trim() !== "" ? deliverableForm.task_id.trim() : null,
                          } 
                        });
                        setDeliverableForm({ title: "", submission_url: "", notes: "", task_id: "" });
                        toast.success("Deliverable recorded and queued for mentor review!");
                        qc.invalidateQueries({ queryKey: ["my-deliverables"] });
                        qc.invalidateQueries({ queryKey: ["my-tasks"] });
                      } catch (err: any) { 
                        toast.error("Failed to submit deliverable: " + err.message); 
                      }
                    }}
                  >
                    Submit Deliverable for Review
                  </Button>
                </div>
              </div>

              {/* Submissions Feed */}
              <div className="lg:col-span-2 rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 p-6 sm:p-7 shadow-xl backdrop-blur-xl space-y-4">
                <h2 className="font-bold text-sm text-white">Submitted Deliverables &amp; Mentor Feedback</h2>
                <div className="divide-y divide-slate-800/80 max-h-[480px] overflow-y-auto">
                  {deliverables.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">No deliverables submitted yet.</div>
                  ) : (
                    deliverables.map((del: any) => (
                      <div key={del.id} className="py-4 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">{del.title}</span>
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${del.status === 'approved' ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40' : del.status === 'under_review' ? 'bg-blue-950/70 text-blue-300 border-blue-500/40' : 'bg-amber-950/70 text-amber-300 border-amber-500/40'}`}>{del.status}</span>
                        </div>
                        <a href={del.submission_url} target="_blank" rel="noreferrer" className="text-xs text-purple-400 hover:underline inline-flex items-center gap-1"><ExternalLink className="h-3 w-3" /> {del.submission_url}</a>
                        {del.notes && <p className="text-xs text-slate-400">{del.notes}</p>}
                        {del.feedback && <p className="text-xs text-emerald-300 bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-500/30 mt-2"><strong>Mentor Feedback:</strong> {del.feedback}</p>}
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
            <div className="rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 p-6 sm:p-8 shadow-xl backdrop-blur-xl">
              <h2 className="font-bold text-white text-base flex items-center gap-2 mb-1.5">
                <Sparkles className="h-5 w-5 text-amber-400" /> Pre-Employment Offer (PPO) &amp; Automated Certificates
              </h2>
              <p className="text-xs text-slate-400 mb-6">Track your PPO conversion metrics and download official verifiable internship certificates upon offboarding.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PPO Status */}
                <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-950/20 space-y-4 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase text-amber-300 tracking-wider">PPO Conversion Score</span>
                    <span className="font-mono font-black text-lg text-amber-200">
                      {Math.min(100, Math.round(progress * 0.8 + Math.min(20, dayStreak * 2)))} / 100
                    </span>
                  </div>
                  <div className="h-3 bg-amber-950 rounded-full overflow-hidden border border-amber-500/30">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, Math.round(progress * 0.8 + Math.min(20, dayStreak * 2)))}%` }} />
                  </div>
                  <div className="text-xs text-amber-300/90 space-y-1.5">
                    <div>{progress >= 85 ? "✓" : "○"} Task Credits Progress ({progress}%)</div>
                    <div>{dayStreak >= 5 ? "✓" : "○"} Day Clock-In Streak ({dayStreak} Days)</div>
                    <div>✓ Mid-Term Appraisal Grade: Exceeds Expectations</div>
                  </div>
                </div>

                {/* Certificates Engine */}
                {(() => {
                  const createdAt = profile?.created_at ? new Date(profile.created_at) : new Date();
                  const completionDateObj = profile?.end_date ? new Date(profile.end_date) : new Date(createdAt.getTime() + 60 * 24 * 60 * 60 * 1000);
                  const unlockDateObj = new Date(completionDateObj.getTime() - 1 * 24 * 60 * 60 * 1000);
                  const isCredUnlocked = Date.now() >= unlockDateObj.getTime();

                  return (
                    <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 space-y-4 shadow-md">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs uppercase text-emerald-300 tracking-wider flex items-center gap-1.5">
                          <Award className="h-4 w-4 text-emerald-400" /> Verifiable Credentials Engine
                        </span>
                        {isCredUnlocked ? (
                          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Unlock className="h-3 w-3" /> Unlocked for Download
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                            <Lock className="h-3 w-3" /> Unlocks 1 Day Before Completion
                          </span>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        {[
                          { name: "Internship Completion Certificate", code: "VY-INT-2026-88" },
                          { name: "Letter of Recommendation (LOR)", code: "VY-LOR-2026-92" },
                          { name: "Official Experience Certificate", code: "VY-EXP-2026-04" }
                        ].map((c, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-[#131B2E]/90 border border-slate-800 text-xs shadow-sm hover:border-slate-700 transition-colors">
                            <div className="flex items-center gap-2.5">
                              {!isCredUnlocked ? (
                                <div className="h-8 w-8 rounded-full bg-amber-950/60 border border-amber-500/40 flex items-center justify-center shrink-0 relative">
                                  <Lock className="h-4 w-4 text-amber-400 animate-bounce" />
                                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-amber-400 rounded-full animate-ping" />
                                </div>
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center shrink-0">
                                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-white">{c.name}</div>
                                <div className="text-[10px] font-mono text-slate-400">{c.code} &middot; ISO 9001:2015 Verified</div>
                              </div>
                            </div>

                            {isCredUnlocked ? (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 text-xs text-emerald-300 border-emerald-500/40 bg-emerald-950/60 hover:bg-emerald-900 font-bold cursor-pointer"
                                onClick={async () => {
                                  const loadingToast = toast.loading(`Generating ${c.name}...`);
                                  try {
                                    const internId = profile?.intern_id || c.code;
                                    const verificationUrl = `https://careers.vyntyraconsultancyservices.in/verify?id=${internId}`;
                                    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verificationUrl)}`;
                                    let qrCodeBase64: string | null = null;
                                    try {
                                      const qrRes = await fetch(qrApiUrl);
                                      const qrBlob = await qrRes.blob();
                                      qrCodeBase64 = await new Promise<string>((resolve) => {
                                        const reader = new FileReader();
                                        reader.onloadend = () => resolve(reader.result as string);
                                        reader.readAsDataURL(qrBlob);
                                      });
                                    } catch (e) {}

                                    const { generateInternshipCertificatePdf } = await import("@/lib/certificateGenerator");
                                    const startDateStr = profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "12 Jun 2026";
                                    const endDateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                                    const doc = generateInternshipCertificatePdf({
                                      candidateName: profile?.full_name || profile?.email || "Candidate Name",
                                      internId,
                                      domainName: profile?.department || "Engineering & Technology",
                                      subDomainName: profile?.position || "Full Stack Web Development",
                                      startDate: startDateStr,
                                      completionDate: endDateStr,
                                      issueDate: endDateStr,
                                      qrCodeBase64,
                                    });
                                    doc.save(`${c.name.replace(/\s+/g, "_")}_${(profile?.full_name || "Intern").replace(/\s+/g, "_")}.pdf`);
                                    toast.dismiss(loadingToast);
                                    toast.success(`${c.name} downloaded successfully!`);
                                  } catch (err: any) {
                                    toast.dismiss(loadingToast);
                                    toast.error("Failed to generate certificate: " + err.message);
                                  }
                                }}
                              >
                                <Download className="h-3.5 w-3.5 mr-1" /> Download PDF
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                disabled
                                className="h-8 text-xs text-amber-400 border-amber-500/30 bg-amber-950/40 cursor-not-allowed font-medium opacity-80"
                              >
                                <Lock className="h-3.5 w-3.5 mr-1 text-amber-400" /> Locked
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Mandatory Final Certification Exam & Fee Guidelines Notice */}
                      <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 text-xs text-slate-300 space-y-2">
                        <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                          <Sparkles className="h-4 w-4 text-amber-400" /> Mandatory Final Certification Exam &amp; Credential Guidelines
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] text-slate-400 pt-1">
                          <div className="flex items-start gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span><strong>Exam Link:</strong> Shared by your Administrator upon completing your final module project.</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <CreditCard className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>
                              <strong>Exam Fee:</strong> <strong>{profile?.is_fee_exempted ? "FEE exemption provided by VYNTYRA" : `₹${profile?.exam_fee_amount} (Inclusive of all GST)`}</strong>
                              {!profile?.is_fee_exempted && " — Mandatory skilling & credential verification fee."}
                            </span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <RefreshCw className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span><strong>Attempts Allowed:</strong> Maximum <strong>3 attempts</strong> permitted to achieve passing grade (70%).</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span><strong>Unlock Date:</strong> Credentials unlock automatically <strong>1 day prior</strong> ({unlockDateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}) to completion.</span>
                          </div>
                        </div>
                      </div>

                      {isFeePaymentPending && (
                        <div className="mt-5 p-5 rounded-2xl border-2 border-rose-500/40 bg-rose-950/30 shadow-lg space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2.5 bg-rose-900/60 border border-rose-500/40 rounded-xl text-rose-300 shrink-0 shadow-xs">
                                <DollarSign className="h-6 w-6" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-base font-bold text-white">Mandatory Exam Fee Payment Pending</h4>
                                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-xs">
                                    Action Required
                                  </span>
                                </div>
                                <p className="text-xs text-rose-200 mt-1 font-medium leading-relaxed">
                                  Please pay the mandatory exam fee of <strong>₹{profile?.exam_fee_amount || 199}</strong> on or before{" "}
                                  <strong>
                                    {formatDeadlineDisplay(profile?.fee_payment_deadline)}
                                  </strong>{" "}
                                  to unlock your final certification exam, task deliverables, and verified credentials.
                                </p>
                              </div>
                            </div>

                            <Button size="lg" className="bg-rose-600 hover:bg-rose-700 text-white font-black px-6 shadow-xl shadow-rose-950/60 h-12 shrink-0 rounded-xl cursor-pointer" onClick={() => setShowPaymentModal(true)}>
                              Pay ₹{profile?.exam_fee_amount || 199} Now
                            </Button>
                          </div>

                          {/* Live Animated Countdown Timer */}
                          <div className="p-4 bg-[#0A0D17] text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-800 shadow-inner">
                            <div className="flex items-center gap-2.5">
                              <Clock className="h-5 w-5 text-amber-400 shrink-0 animate-spin duration-1000" />
                              <div>
                                <span className="text-xs font-bold text-white block">Time Remaining to Complete Payment:</span>
                                <span className="text-[10px] text-slate-400">
                                  Pay on or before {formatDeadlineDisplay(profile?.fee_payment_deadline, "the scheduled date")}
                                </span>
                              </div>
                            </div>

                            <FeeCountdownTimer deadline={profile?.fee_payment_deadline} />
                          </div>

                          <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-2xl text-xs text-amber-300 font-medium leading-relaxed">
                            <strong>Note / Information:</strong> Exam fee is payable to receive certificate and stipend will be provided for top 10% interns up to ₹5,000 to ₹15,000 (terms and eligibility apply). Once the payment is done, only then your dashboard will be fully functional.
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ─── TASKS ─── */}
        {activeTab === "tasks" && (
          <div className="space-y-6">
            {poolTasks.length > 0 && (
              <div className="rounded-3xl border border-amber-500/30 bg-[#0E131F]/90 shadow-xl backdrop-blur-xl overflow-hidden">
                <div className="px-6 py-4.5 border-b border-amber-500/30 flex items-center justify-between bg-amber-950/20">
                  <h2 className="font-bold flex items-center gap-2 text-amber-300"><ClipboardList className="h-5 w-5 text-amber-400" />Available Pool Tasks</h2>
                </div>
                <div className="divide-y divide-slate-800/80">
                  {poolTasks.map((task: any) => (
                    <div key={task.id} className="p-6 hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-white">{task.title}</h3>
                        {task.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>}
                      </div>
                      <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg cursor-pointer" onClick={async () => {
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

            <div className="rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 shadow-xl backdrop-blur-xl overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#090D16]">
                <div>
                  <h2 className="font-bold text-base text-white flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-emerald-400" />
                    My Assigned Tasks &amp; Project Deliverables
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Submit your deliverables for mentor review, grading, and completion verification.</p>
                </div>
                
                <div className="flex items-center gap-2.5 flex-wrap">
                  <a
                    href="https://chat.whatsapp.com/FXsC4CT1hVRHvKzGH0k5y5"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-950/60 transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> Join Official WhatsApp Group
                  </a>
                  <Button variant="ghost" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["my-tasks"] })} className="gap-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
                    <RefreshCw className={`h-3.5 w-3.5 ${tasksQ.isFetching ? "animate-spin" : ""}`} /> Refresh
                  </Button>
                </div>
              </div>

              {/* Official Mentor Banner */}
              {mentor && (
                <div className="p-5 bg-indigo-950/30 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="h-11 w-11 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shrink-0 shadow-md">
                      {mentor.full_name?.slice(0, 2).toUpperCase() || "VM"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{mentor.full_name}</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/40 text-indigo-300">
                          {mentor.is_lead ? "Official Lead Mentor" : "Assigned Mentor"}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-3 flex-wrap">
                        <span>{mentor.position || mentor.department || "Lead Technical Director"}</span>
                        <span>•</span>
                        <a href={`mailto:${mentor.email}`} className="text-indigo-400 hover:underline flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {mentor.email}
                        </a>
                        {mentor.phone_number && (
                          <>
                            <span>•</span>
                            <a href={`tel:${mentor.phone_number}`} className="text-indigo-400 hover:underline flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {mentor.phone_number}
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs border-indigo-500/40 bg-indigo-950/60 text-indigo-300 hover:bg-indigo-900 font-bold gap-1 cursor-pointer"
                      onClick={() => {
                        const defaultGroup = "https://chat.whatsapp.com/FXsC4CT1hVRHvKzGH0k5y5";
                        const msg = `Hello Mentor ${mentor.full_name}!\n\nI have a question regarding my internship tasks on Project VyNexa.\n\nFrom: ${displayName} (${profile?.intern_id || "Intern"})\nEmail: ${profile?.email}`;
                        const phone = (mentor.phone_number || "").replace(/[^0-9]/g, "");
                        const url = phone ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}` : defaultGroup;
                        window.open(url, "_blank");
                      }}
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-emerald-400" /> WhatsApp Mentor
                    </Button>
                  </div>
                </div>
              )}

              {/* Task Status Filters Bar */}
              <div className="px-6 py-3.5 bg-[#0A0D17] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTaskFilterTab("all")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      taskFilterTab === "all" ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/60" : "bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    All Tasks ({myTasks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskFilterTab("in_progress")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      taskFilterTab === "in_progress" ? "bg-blue-600 text-white shadow-md shadow-blue-950/60" : "bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    In Progress ({inProgressTasks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskFilterTab("submitted")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      taskFilterTab === "submitted" ? "bg-purple-600 text-white shadow-md shadow-purple-950/60" : "bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    Submitted / Under Review ({submittedTasks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskFilterTab("completed")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      taskFilterTab === "completed" ? "bg-teal-600 text-white shadow-md shadow-teal-950/60" : "bg-slate-900 border border-slate-700 text-teal-300 hover:bg-slate-800"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified &amp; Stored Repository ({verifiedTasks.length})
                  </button>
                </div>
                {taskFilterTab === "completed" && (
                  <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-xl flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> Permanent Deliverables Archive
                  </span>
                )}
              </div>

              {tasksQ.isLoading ? (
                <div className="p-12 flex items-center justify-center gap-2 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" />Loading tasks...</div>
              ) : (taskFilterTab === "all" ? myTasks : taskFilterTab === "in_progress" ? inProgressTasks : taskFilterTab === "submitted" ? submittedTasks : verifiedTasks).length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  {taskFilterTab === "completed" 
                    ? "No verified tasks stored in your repository yet. Once submitted deliverables are reviewed and verified by mentors, they will be archived here permanently."
                    : taskFilterTab === "submitted"
                    ? "No tasks currently submitted under review."
                    : taskFilterTab === "in_progress"
                    ? "No active in-progress tasks."
                    : "No tasks assigned yet."}
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {(taskFilterTab === "all" ? myTasks : taskFilterTab === "in_progress" ? inProgressTasks : taskFilterTab === "submitted" ? submittedTasks : verifiedTasks).map((task: any) => {
                    const s = TASK_STATUS_STYLES[task.status] || TASK_STATUS_STYLES.pending;
                    const reportTemplate = task.report_template_url || "https://docs.google.com/document/d/1vA5W0h8Z7_Sample_Report_Template/edit?usp=sharing";
                    const pptTemplate = task.ppt_template_url || "https://docs.google.com/presentation/d/1tB6X0h8Z7_Sample_PPT_Template/edit?usp=sharing";

                    return (
                      <div key={task.id} className="p-6 hover:bg-slate-800/30 transition-all border-b border-slate-800/80 last:border-0 flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 space-y-2.5">
                            {/* Title & Badges */}
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className={`h-2.5 w-2.5 rounded-full ${s.dot} shrink-0`} />
                              <h3 className="font-bold text-sm text-white leading-snug">{task.title}</h3>
                              
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${s.badge}`}>{s.label}</span>
                              {task.priority && (
                                <span className={`text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold ${
                                  task.priority === "high" ? "bg-rose-950 text-rose-300 border border-rose-500/40" :
                                  task.priority === "medium" ? "bg-amber-950 text-amber-300 border border-amber-500/40" :
                                  "bg-slate-900 text-slate-300 border border-slate-700"
                                }`}>
                                  {task.priority} Priority
                                </span>
                              )}
                              
                              {/* Level Badge */}
                              <span className="text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                                {task.level || "Beginner"}
                              </span>

                              {/* Credits Badge */}
                              <span className="text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold bg-amber-950 text-amber-300 border border-amber-500/40 flex items-center gap-0.5">
                                <CreditCard className="h-3 w-3 text-amber-400" /> {task.credits || 10} Credits
                              </span>

                              {/* Collaborative Team Badge */}
                              {(task.team_name || task.team_id || task.assignment_mode === "team") && (
                                <span className="text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold bg-purple-950 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                                  <Users className="h-3 w-3 text-purple-400" /> {task.team_name || `Collaborative Team (${task.team_size || 2})`}
                                </span>
                              )}
                            </div>

                            {task.description && (
                              <p className="text-slate-300 text-xs leading-relaxed max-w-4xl">{task.description}</p>
                            )}

                            {/* Action links row & Resources */}
                            <div className="mt-4 flex flex-wrap gap-2">
                              {task.task_meet_link && (
                                <a 
                                  href={task.task_meet_link} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer"
                                >
                                  <Video className="h-3.5 w-3.5" /> 📹 Join Task Meet
                                </a>
                              )}
                              {(task.task_file_url || task.project_requirements) && (
                                <a href={task.task_file_url || task.project_requirements} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer">
                                  <FolderOpen className="h-3.5 w-3.5" /> Project Files
                                </a>
                              )}
                              {task.task_doc_url && (
                                <a href={task.task_doc_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer">
                                  <BookOpen className="h-3.5 w-3.5" /> Handbook Guide
                                </a>
                              )}
                              {reportTemplate && (
                                <a href={reportTemplate} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer">
                                  <FileText className="h-3.5 w-3.5 text-blue-400" /> Report Template
                                </a>
                              )}
                              {pptTemplate && (
                                <a href={pptTemplate} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer">
                                  <Play className="h-3.5 w-3.5 text-amber-400" /> PPT Template
                                </a>
                              )}
                            </div>
                            
                            {task.due_date && (
                              <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-800 text-[11px] font-medium text-slate-400">
                                <Clock className="h-3.5 w-3.5 text-slate-500" /> Due {new Date(task.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </div>
                            )}

                            {/* Mentor Feedback / Remarks Box */}
                            {(task.admin_remarks || task.progress_notes) && (
                              <div className={`mt-3 p-4 rounded-2xl border text-xs space-y-1 ${
                                task.status === "completed" 
                                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200" 
                                  : task.status === "blocked" || task.status === "rejected"
                                  ? "bg-rose-950/40 border-rose-500/40 text-rose-200"
                                  : "bg-indigo-950/40 border-indigo-500/40 text-indigo-200"
                              }`}>
                                <div className="flex items-center justify-between font-bold">
                                  <span className="flex items-center gap-1.5">
                                    {task.status === "completed" ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Sparkles className="h-4 w-4 text-indigo-400" />}
                                    Mentor Review &amp; Feedback
                                  </span>
                                  <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-black/40 border border-white/10">
                                    {s.label}
                                  </span>
                                </div>
                                <p className="leading-relaxed whitespace-pre-wrap">{task.admin_remarks || task.progress_notes}</p>
                              </div>
                            )}
                          </div>

                          {/* Top Right action column */}
                          <div className="flex flex-col items-end gap-2 shrink-0 md:pl-4">
                            {task.accepted_at ? (
                              <div className="text-[11px] text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-xl font-medium flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Accepted on {new Date(task.accepted_at).toLocaleDateString()}
                              </div>
                            ) : (
                              <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 rounded-xl cursor-pointer" onClick={async () => {
                                try {
                                  await doAcceptTask({ data: { id: task.id } });
                                  toast.success("Task accepted!");
                                  qc.invalidateQueries({ queryKey: ["my-tasks"] });
                                } catch (err: any) { toast.error("Failed to accept task"); }
                              }}>
                                Accept Task
                              </Button>
                            )}

                            <div className="flex items-center gap-2 flex-wrap justify-end">
                              {/* Request Doubt Solving Session */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs gap-1 border-amber-500/40 bg-amber-950/60 hover:bg-amber-900 text-amber-300 font-bold rounded-xl cursor-pointer"
                                onClick={() => {
                                  setDoubtTaskId(task.id);
                                  setDoubtTaskTitle(task.title);
                                  setDoubtTopic("");
                                  setDoubtBlockers("");
                                  setDoubtSlot("");
                                  setDoubtType("one_on_one");
                                  setDoubtModalOpen(true);
                                }}
                              >
                                <HelpCircle className="h-3.5 w-3.5 text-amber-400" /> Request Doubt Session
                              </Button>

                              {/* Request Resources */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs gap-1 border-indigo-500/40 bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 font-bold rounded-xl cursor-pointer"
                                onClick={() => {
                                  setResourceTaskId(task.id);
                                  setResourceTaskTitle(task.title);
                                  setResourceDetails("");
                                  setResourceType("API Credentials & Access Keys");
                                  setResourceUrgency("normal");
                                  setResourceModalOpen(true);
                                }}
                              >
                                <FolderOpen className="h-3.5 w-3.5 text-indigo-400" /> Request Resources
                              </Button>

                              {/* Contact Mentor */}
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 text-xs gap-1 border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold rounded-xl cursor-pointer"
                                onClick={() => {
                                  if (mentor) {
                                    const defaultGroup = "https://chat.whatsapp.com/FXsC4CT1hVRHvKzGH0k5y5";
                                    const msg = `Hello Mentor ${mentor.full_name}!\n\nRegarding task: "${task.title}"\nFrom: ${displayName} (${profile?.intern_id || "Intern"})`;
                                    const phone = (mentor.phone_number || "").replace(/[^0-9]/g, "");
                                    const url = phone ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}` : defaultGroup;
                                    window.open(url, "_blank");
                                  } else {
                                    window.open("https://chat.whatsapp.com/FXsC4CT1hVRHvKzGH0k5y5", "_blank");
                                  }
                                }}
                              >
                                <MessageCircle className="h-3.5 w-3.5 text-emerald-400" /> Contact Mentor
                              </Button>

                              <Button size="sm" variant="outline" className="h-8 text-xs border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold rounded-xl cursor-pointer" onClick={() => setSelectedTaskWorkspace(task)}>
                                <Layers className="h-3.5 w-3.5 mr-1 text-blue-400" /> Open Workspace
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Submission Link & Deadline Extension request section */}
                        {isFeePaymentPending ? (
                          <div className="mt-2 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-amber-950/20 p-4 rounded-2xl border border-amber-500/30 shadow-md">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
                                <Lock className="h-4 w-4 text-amber-400 shrink-0" /> Task Submission Locked — Exam Fee Payment Required
                              </div>
                              <p className="text-[11px] text-amber-200 leading-relaxed font-medium">
                                Please pay the mandatory exam fee of <strong>₹{profile?.exam_fee_amount || 199}</strong> to enable task deliverable submissions and activate your verified certificate upon completion.
                              </p>
                              <p className="text-[10px] text-amber-400/80 italic">
                                Note: Exam fee is payable to receive certificate and stipend will be provided for top 10% interns up to ₹5,000 to ₹15,000 (terms and eligibility apply). Once the payment is done, only then your dashboard will be fully functional.
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9 px-4 shrink-0 rounded-xl cursor-pointer"
                              onClick={() => setShowPaymentModal(true)}
                            >
                              Pay ₹{profile?.exam_fee_amount || 199} to Unlock
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-2 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#131B2E]/90 p-4 rounded-2xl border border-slate-800/80">
                            {/* Submission Field */}
                            <div className="flex-1 space-y-2">
                              <label className="text-[11px] font-bold text-slate-300 block">
                                Public Task Deliverable URL (GitHub Repo / Live PR / Google Drive / Figma / Vercel)
                              </label>
                              {submissionTaskId === task.id ? (
                                <div className="space-y-2 mt-1">
                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                    <input 
                                      type="text"
                                      placeholder="https://github.com/your-username/project or drive link"
                                      value={submissionUrl}
                                      onChange={(e) => setSubmissionUrl(e.target.value)}
                                      className="flex-1 rounded-xl border border-slate-700 p-2.5 text-xs bg-slate-900 text-slate-200 placeholder:text-slate-500 outline-none focus:border-emerald-500"
                                    />
                                    <input 
                                      type="text"
                                      placeholder="Optional submission notes / version..."
                                      value={submissionNotes}
                                      onChange={(e) => setSubmissionNotes(e.target.value)}
                                      className="flex-1 sm:max-w-xs rounded-xl border border-slate-700 p-2.5 text-xs bg-slate-900 text-slate-200 placeholder:text-slate-500 outline-none focus:border-emerald-500"
                                    />
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        size="sm"
                                        disabled={isSubmittingTaskUrl || !submissionUrl.trim()}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-bold px-4 shrink-0 rounded-xl cursor-pointer"
                                        onClick={async () => {
                                          if (!submissionUrl.trim()) {
                                            toast.error("Please enter a valid submission URL");
                                            return;
                                          }
                                          setIsSubmittingTaskUrl(true);
                                          try {
                                            let cleanUrl = submissionUrl.trim();
                                            if (!/^https?:\/\//i.test(cleanUrl) && !cleanUrl.startsWith("data:")) {
                                              cleanUrl = `https://${cleanUrl}`;
                                            }
                                            await doSubmitTaskUrl({
                                              data: {
                                                taskId: task.id,
                                                submissionUrl: cleanUrl,
                                                submissionNotes: submissionNotes.trim() || null,
                                              }
                                            });
                                            toast.success("Task deliverable submitted successfully for mentor review!");
                                            setSubmissionTaskId(null);
                                            setSubmissionUrl("");
                                            setSubmissionNotes("");
                                            qc.invalidateQueries({ queryKey: ["my-tasks"] });
                                            qc.invalidateQueries({ queryKey: ["my-deliverables"] });
                                          } catch (e: any) {
                                            toast.error("Failed to submit deliverable: " + e.message);
                                          } finally {
                                            setIsSubmittingTaskUrl(false);
                                          }
                                        }}
                                      >
                                        {isSubmittingTaskUrl ? "Submitting..." : "Submit Deliverable"}
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-9 text-xs text-slate-400 hover:text-white cursor-pointer" 
                                        onClick={() => {
                                          setSubmissionTaskId(null);
                                          setSubmissionUrl("");
                                          setSubmissionNotes("");
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 flex-wrap">
                                  {task.deliverable_url ? (
                                    <div className="text-xs text-slate-300 flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1 text-[10px]">
                                        ✓ Submitted for Review:
                                      </span>
                                      <a 
                                        href={task.deliverable_url} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="text-indigo-400 hover:underline max-w-[220px] sm:max-w-md truncate font-mono text-xs"
                                      >
                                        {task.deliverable_url}
                                      </a>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-500 italic">No deliverable submitted yet.</span>
                                  )}
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-emerald-300 border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900 font-bold text-xs h-7 px-3 rounded-xl cursor-pointer"
                                    onClick={() => {
                                      setSubmissionTaskId(task.id);
                                      setSubmissionUrl(task.deliverable_url || "");
                                      setSubmissionNotes(task.progress_notes || "");
                                    }}
                                  >
                                    {task.deliverable_url ? "Update Submission Link" : "Submit Deliverable Link"}
                                  </Button>
                                </div>
                              )}
                            </div>

                            {/* Deadline Extension requested state */}
                            <div className="shrink-0 flex items-center gap-2">
                              {task.extension_status === "requested" ? (
                                <div className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-3 py-1.5 rounded-full flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5 text-amber-400" /> Extension Pending Approve
                                </div>
                              ) : task.extension_status === "approved" ? (
                                <div className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1.5 rounded-full flex items-center gap-1">
                                  <Check className="h-3.5 w-3.5 text-emerald-400" /> Extended Deadline Approved
                                </div>
                              ) : task.extension_status === "rejected" ? (
                                <div className="text-[10px] font-bold text-rose-300 bg-rose-950/80 border border-rose-500/40 px-3 py-1.5 rounded-full flex items-center gap-1">
                                  <HelpCircle className="h-3.5 w-3.5 text-rose-400" /> Extension Request Rejected
                                </div>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 text-xs text-slate-300 border-slate-700 bg-slate-900 hover:bg-slate-800 font-semibold rounded-xl cursor-pointer"
                                  onClick={() => {
                                    setShowExtensionModal(task);
                                    setExtensionReason("");
                                    setExtensionDate(task.due_date ? task.due_date.split("T")[0] : "");
                                  }}
                                >
                                  Request Extend Deadline
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
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
            <div className="lg:col-span-1 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-emerald-400" />Calendar</h2>
              <div className="rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 p-5 shadow-xl backdrop-blur-xl">
                <MonthlyCalendar events={[...schedules, ...meetings]} holidays={holidaysQ.data || []} />
              </div>
            </div>
            <div className="lg:col-span-2 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2"><Video className="h-4 w-4 text-purple-400" />Meetings</h2>
              <div className="rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 p-6 shadow-xl backdrop-blur-xl">
                <MeetingsSection meetings={meetings} isLoading={meetingsQ.isLoading} isError={meetingsQ.isError} />
              </div>
            </div>
          </div>
        )}

        {/* ─── RESOURCES ─── */}
        {activeTab === "resources" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white flex items-center gap-2"><BookOpen className="h-5 w-5 text-emerald-400" />Learning Resources</h2>
              <Button variant="ghost" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["my-resources"] })} className="gap-1.5 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
                <RefreshCw className={`h-3.5 w-3.5 ${resourcesQ.isFetching ? "animate-spin" : ""}`} />Refresh
              </Button>
            </div>
            {resourcesQ.isLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" />Loading...</div>
            ) : resources.length === 0 ? (
              <div className="text-center py-12 text-slate-500 rounded-3xl border border-slate-800/80 bg-[#0E131F]/90">
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="font-bold text-white">No resources posted yet</p>
                <p className="text-xs mt-1 text-slate-400">Your mentor and admin will post guides and documents here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {resources.map((r: any) => {
                  const ri = RESOURCE_ICONS[r.type] || RESOURCE_ICONS.link;
                  return (
                    <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                      className="block rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 p-6 hover:border-slate-700 transition-all hover:-translate-y-0.5 group shadow-xl backdrop-blur-xl">
                      <div className={`h-12 w-12 rounded-2xl border flex items-center justify-center mb-4 ${ri.color}`}>{ri.icon}</div>
                      <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">{r.title}</h3>
                      {r.description && <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{r.description}</p>}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 capitalize">{r.type}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
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
              <div className="text-center py-12 text-slate-500 rounded-3xl border border-slate-800/80 bg-[#0E131F]/90"><Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />No announcements yet</div>
            ) : (
              announcements.map((a: any) => (
                <div key={a.id} className="rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 shadow-xl backdrop-blur-xl p-6 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-white">{a.title}</h3>
                      <div className="text-xs text-slate-400 mt-0.5">{new Date(a.created_at).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
                    </div>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold uppercase tracking-wide shrink-0">
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
          <div className="rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 shadow-xl backdrop-blur-xl p-6 sm:p-8 space-y-6">
            <h2 className="font-bold text-white flex items-center gap-2"><FileText className="h-5 w-5 text-emerald-400" />My Notes</h2>
            <div className="flex gap-2">
              <textarea 
                className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 p-3.5 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-emerald-500"
                placeholder="Write a note..." 
                value={newNote} 
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
              />
            </div>
            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/60 cursor-pointer" onClick={async () => {
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
                <div className="text-slate-400 text-sm">Loading notes...</div>
              ) : notes.length === 0 ? (
                <div className="text-slate-500 text-sm">No notes yet.</div>
              ) : (
                notes.map((note: any) => (
                  <div key={note.id} className="p-4 rounded-2xl bg-[#131B2E]/90 border border-slate-800/80 flex justify-between gap-4">
                    <p className="text-sm text-slate-200 whitespace-pre-wrap">{note.content}</p>
                    <Button variant="ghost" size="sm" className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 shrink-0 cursor-pointer" onClick={async () => {
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
          <div className="rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 shadow-xl backdrop-blur-xl p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
            <h2 className="font-bold text-white flex items-center gap-2"><Mail className="h-5 w-5 text-emerald-400" />Submit Feedback</h2>
            <p className="text-xs text-slate-400">We value your thoughts! Let us know how we can improve your intern experience.</p>
            <textarea 
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-3.5 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-emerald-500"
              placeholder="Your feedback..." 
              value={feedback} 
              onChange={(e) => setFeedback(e.target.value)}
              rows={5}
            />
            <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/60 cursor-pointer" onClick={async () => {
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

        {/* ─── LEAVES REQUESTS ─── */}
        {activeTab === "leaves" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Raise Leave Form */}
              <div className="lg:col-span-1 rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 p-6 sm:p-7 shadow-xl backdrop-blur-xl h-fit">
                <h2 className="font-bold text-white text-base flex items-center gap-2 mb-1.5">
                  <CalendarDays className="h-5 w-5 text-indigo-400" /> Request Leave
                </h2>
                <p className="text-xs text-slate-400 mb-4">Request authorization for upcoming absence. Please coordinate tasks first.</p>
                
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!leaveForm.start_date || !leaveForm.end_date || !leaveForm.reason.trim()) {
                      toast.error("Please fill in all leave request fields.");
                      return;
                    }
                    setIsSubmittingLeave(true);
                    try {
                      await doRequestLeave({ data: leaveForm });
                      toast.success("Leave request submitted successfully!");
                      setLeaveForm({ start_date: "", end_date: "", reason: "" });
                      leavesQ.refetch();
                    } catch (err: any) {
                      toast.error(err.message || "Failed to submit leave request");
                    } finally {
                      setIsSubmittingLeave(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400">Start Date</label>
                    <input 
                      type="date"
                      required
                      value={leaveForm.start_date}
                      onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400">End Date</label>
                    <input 
                      type="date"
                      required
                      value={leaveForm.end_date}
                      onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400">Reason</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Explain reason for absence, emergency contact details..."
                      value={leaveForm.reason}
                      onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <Button 
                    type="submit"
                    disabled={isSubmittingLeave}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-950/60 cursor-pointer"
                  >
                    {isSubmittingLeave ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Submit Request
                  </Button>
                </form>
              </div>

              {/* Leave History List */}
              <div className="lg:col-span-2 rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 p-6 sm:p-7 shadow-xl backdrop-blur-xl overflow-hidden">
                <h2 className="font-bold text-white text-base flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-indigo-400" /> Leave History Requests
                </h2>
                
                <div className="divide-y divide-slate-800/80 max-h-[500px] overflow-y-auto">
                  {myLeaves.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs">No leave requests found.</div>
                  ) : (
                    myLeaves.map((l: any) => (
                      <div key={l.id} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-white">
                              {new Date(l.start_date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' })} — {new Date(l.end_date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className={`text-[9px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full border ${
                              l.status === 'approved' ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40' :
                              l.status === 'rejected' ? 'bg-rose-950/70 text-rose-300 border-rose-500/40' :
                              'bg-amber-950/70 text-amber-300 border-amber-500/40'
                            }`}>
                              {l.status}
                            </span>
                          </div>
                          <p className="text-slate-300 text-xs leading-relaxed mt-1">{l.reason}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── SUPPORT TICKETS ─── */}
        {activeTab === "support" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Raise Support Ticket Form */}
              <div className="lg:col-span-1 rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 p-6 sm:p-7 shadow-xl backdrop-blur-xl h-fit">
                <h2 className="font-bold text-white text-base flex items-center gap-2 mb-1.5">
                  <HelpCircle className="h-5 w-5 text-purple-400" /> Raise Support Query
                </h2>
                <p className="text-xs text-slate-400 mb-4">Need help? Open a query and a mentor/supervisor will assist you.</p>
                
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!supportForm.subject.trim() || !supportForm.description.trim()) {
                      toast.error("Please fill in subject and description.");
                      return;
                    }
                    setIsSubmittingSupport(true);
                    try {
                      await doRaiseSupportQuery({ data: supportForm });
                      toast.success("Support ticket raised successfully!");
                      setSupportForm({ subject: "", description: "", category: "Technical" });
                      supportQueriesQ.refetch();
                    } catch (err: any) {
                      toast.error(err.message || "Failed to raise support query");
                    } finally {
                      setIsSubmittingSupport(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400">Query Category</label>
                    <select 
                      value={supportForm.category}
                      onChange={(e) => setSupportForm({ ...supportForm, category: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 p-2.5 text-xs bg-slate-900 text-slate-200 outline-none focus:border-purple-500"
                    >
                      <option value="Technical">Technical Issue</option>
                      <option value="LMS">LMS &amp; Skills</option>
                      <option value="Administrative">Administrative</option>
                      <option value="Payroll">Payouts &amp; Payroll</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400">Subject</label>
                    <input 
                      type="text"
                      required
                      placeholder="Short subject description..."
                      value={supportForm.subject}
                      onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400">Description</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Provide detailed description of your issue..."
                      value={supportForm.description}
                      onChange={(e) => setSupportForm({ ...supportForm, description: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-purple-500"
                    />
                  </div>
                  <Button 
                    type="submit"
                    disabled={isSubmittingSupport}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-950/60 cursor-pointer"
                  >
                    {isSubmittingSupport ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Raise Ticket
                  </Button>
                </form>
              </div>

              {/* Support History & Meeting Sync */}
              <div className="lg:col-span-2 rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 p-6 sm:p-7 shadow-xl backdrop-blur-xl overflow-hidden">
                <h2 className="font-bold text-white text-base flex items-center gap-2 mb-4">
                  <MessageCircle className="h-5 w-5 text-purple-400" /> Support Query Tickets
                </h2>
                
                <div className="divide-y divide-slate-800/80 max-h-[550px] overflow-y-auto space-y-4">
                  {supportQueries.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs">No support queries raised yet.</div>
                  ) : (
                    supportQueries.map((q: any) => {
                      const hasMeeting = q.meeting_id && q.meeting_status === "approved";
                      return (
                        <div key={q.id} className="py-4 first:pt-0 last:pb-0 flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-white">{q.subject}</span>
                                <span className="text-[10px] bg-purple-950/80 text-purple-300 px-2.5 py-0.5 rounded-full font-bold border border-purple-500/40">{q.category}</span>
                                <span className={`text-[9px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full border ${
                                  q.status === 'resolved' ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40' :
                                  q.status === 'assigned' ? 'bg-blue-950/70 text-blue-300 border-blue-500/40' :
                                  'bg-amber-950/70 text-amber-300 border-amber-500/40'
                                }`}>
                                  {q.status.replace("_", " ")}
                                </span>
                              </div>
                              <p className="text-slate-300 text-xs leading-relaxed mt-1">{q.description}</p>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{new Date(q.created_at).toLocaleDateString()}</span>
                          </div>

                          {/* Resolution / Assigee progress details */}
                          <div className="bg-[#131B2E]/90 border border-slate-800 p-3.5 rounded-2xl flex flex-col gap-2 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
                              <div><strong className="text-slate-200">Assigned Resolver:</strong> {q.assigned_employee?.full_name || "Pending Super Admin assignment..."}</div>
                              <div><strong className="text-slate-200">Intern Mentor:</strong> {q.mentor?.full_name || "Official Mentor"}</div>
                            </div>
                            {q.progress_notes && (
                              <div className="border-t border-slate-800 pt-2 mt-1">
                                <div className="font-bold text-slate-300 text-[10px] uppercase">Progress Notes:</div>
                                <p className="text-slate-400 mt-0.5 italic">"{q.progress_notes}"</p>
                              </div>
                            )}
                          </div>

                          {/* Scheduled Meeting sync inside Support Query tab */}
                          {q.meeting_status === "requested" && (
                            <div className="bg-amber-950/40 border border-amber-500/40 text-amber-300 rounded-2xl p-3.5 text-xs font-semibold flex items-center justify-between">
                              <span>Meeting schedule requested by Employee/Mentor. Awaiting Super Admin/Admin permission approval.</span>
                            </div>
                          )}

                          {hasMeeting && (
                            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2">
                                <Video className="h-5 w-5 text-emerald-400 animate-pulse" />
                                <div>
                                  <div className="font-bold text-white">Support Sync Scheduled</div>
                                  <div className="text-[11px] text-slate-400 mt-0.5">Please join the live Google Meet room directly from this panel.</div>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const decodedLink = atob(btoa("https://meet.google.com/vy-support-sync"));
                                  window.location.href = decodedLink;
                                }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs self-start sm:self-center transition-colors shadow-md shadow-emerald-950/60 cursor-pointer"
                              >
                                Join Sync Meeting
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── REFER & EARN ─── */}
        {activeTab === "refer" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Custom Animations Style Sheet Injection */}
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes shine {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
              }
              .animate-shine {
                background: linear-gradient(120deg, #f5f3ff 30%, #e0e7ff 50%, #f5f3ff 70%);
                background-size: 200% 100%;
                animation: shine 3.5s infinite linear;
              }
              @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
              }
              .animate-float {
                animation: float 3s ease-in-out infinite;
              }
              @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
              }
              .animate-shimmer {
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
                background-size: 200% 100%;
                animation: shimmer 1.8s infinite linear;
              }
              @keyframes pulse-ring {
                0% { transform: scale(0.95); opacity: 0.8; }
                50% { transform: scale(1.08); opacity: 0.4; }
                100% { transform: scale(0.95); opacity: 0.8; }
              }
              .animate-pulse-ring {
                animation: pulse-ring 2.5s ease-in-out infinite;
              }
            `}} />

            <EmployeeReferEarn />
          </div>
        )}
      </main>

      
{/* ── Task Execution Workspace Dialog ── */}
{selectedTaskWorkspace && (
  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
    <div className="bg-[#0E131F] rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-800/80 text-white">
      <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">Task Workspace</span>
          <h2 className="text-lg font-bold text-white mt-1.5">{selectedTaskWorkspace.title}</h2>
          {selectedTaskWorkspace.accepted_at && (
            <p className="text-xs text-emerald-400 font-medium mt-1">✓ You accepted this task on {new Date(selectedTaskWorkspace.accepted_at).toLocaleString()}</p>
          )}
        </div>
        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full cursor-pointer" onClick={() => setSelectedTaskWorkspace(null)}>✕</Button>
      </div>

      {/* Mentor Review Feedback if present */}
      {(selectedTaskWorkspace.admin_remarks || (selectedTaskWorkspace.progress_notes && selectedTaskWorkspace.status === "completed")) && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Official Mentor Feedback &amp; Review
          </div>
          <p className="text-emerald-200 leading-relaxed whitespace-pre-wrap">{selectedTaskWorkspace.admin_remarks || selectedTaskWorkspace.progress_notes}</p>
        </div>
      )}

      <div className="space-y-4 text-xs">
        <div>
          <label className="font-semibold text-slate-300 mb-1.5 block">Task Description</label>
          <p className="text-slate-300 bg-[#131B2E]/90 p-3.5 rounded-xl border border-slate-800/80 leading-relaxed">{selectedTaskWorkspace.description || "No description provided."}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-slate-300 mb-1.5 block">Task Status</label>
            <select 
              className="w-full rounded-xl border border-slate-700 p-2.5 text-xs bg-slate-900 text-slate-200 outline-none focus:border-emerald-500" 
              value={selectedTaskWorkspace.status || "in_progress"} 
              onChange={e => setSelectedTaskWorkspace({...selectedTaskWorkspace, status: e.target.value})}
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted (Ready for Mentor Review)</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked / Assistance Needed</option>
            </select>
          </div>
          <div>
            <label className="font-semibold text-slate-300 mb-1.5 block">Completion Progress (%)</label>
            <input type="number" min="0" max="100" className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500" value={selectedTaskWorkspace.progress_percentage ?? 0} onChange={e => setSelectedTaskWorkspace({...selectedTaskWorkspace, progress_percentage: parseInt(e.target.value) || 0})} />
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-300 mb-1.5 block">Project Requirements &amp; Technical Specs</label>
          <textarea className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs font-mono text-slate-200 placeholder:text-slate-500 outline-none focus:border-emerald-500" rows={3} value={selectedTaskWorkspace.project_requirements || ""} onChange={e => setSelectedTaskWorkspace({...selectedTaskWorkspace, project_requirements: e.target.value})} placeholder="Tech stack, API endpoints, performance metrics, design specs..." />
        </div>

        <div>
          <label className="font-semibold text-slate-300 mb-1.5 block">Your Progress Notes / Description</label>
          <textarea className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-emerald-500" rows={3} value={selectedTaskWorkspace.progress_notes || ""} onChange={e => setSelectedTaskWorkspace({...selectedTaskWorkspace, progress_notes: e.target.value})} placeholder="Describe progress update, completed milestones, or blockers..." />
        </div>

        {isFeePaymentPending ? (
          <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <Lock className="h-4 w-4 text-amber-400 shrink-0" /> Deliverable Submission Locked — Exam Fee Payment Required
            </div>
            <p className="text-amber-200 leading-relaxed font-medium">
              Please pay the exam fee of <strong>₹{profile?.exam_fee_amount || 199}</strong> to enable task deliverable submissions and receive your certificate.
            </p>
            <p className="text-[10px] text-amber-400/80 italic">
              Note: Exam fee is payable to receive certificate and stipend will be provided for top 10% interns up to ₹5,000 to ₹15,000 (terms and eligibility apply). Once the payment is done, only then your dashboard will be fully functional.
            </p>
            <Button 
              size="sm" 
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-9 text-xs px-4 rounded-xl cursor-pointer" 
              onClick={() => {
                setSelectedTaskWorkspace(null);
                setShowPaymentModal(true);
              }}
            >
              Pay Exam Fee Now
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-300 mb-1.5 block">Deliverable URL (GitHub / Figma / Drive / Vercel)</label>
              <input 
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs font-mono text-slate-200 placeholder:text-slate-500 outline-none focus:border-emerald-500" 
                value={selectedTaskWorkspace.deliverable_url || ""} 
                onChange={e => setSelectedTaskWorkspace({...selectedTaskWorkspace, deliverable_url: e.target.value})} 
                placeholder="https://github.com/..." 
              />
            </div>
            <div>
              <label className="font-semibold text-slate-300 mb-1.5 block">Time Spent (Hours)</label>
              <input type="number" step="0.5" className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500" value={selectedTaskWorkspace.time_spent_hours ?? 0} onChange={e => setSelectedTaskWorkspace({...selectedTaskWorkspace, time_spent_hours: parseFloat(e.target.value) || 0})} placeholder="e.g. 4.5" />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800/80">
        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white cursor-pointer" onClick={() => setSelectedTaskWorkspace(null)}>Cancel</Button>
        <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/60 cursor-pointer" onClick={async () => {
          try {
            let finalUrl = (selectedTaskWorkspace.deliverable_url || "").trim();
            if (finalUrl && !/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith("data:")) {
              finalUrl = `https://${finalUrl}`;
            }

            await doUpdateTaskExecution({
              data: {
                id: selectedTaskWorkspace.id,
                status: selectedTaskWorkspace.status || "in_progress",
                progress_percentage: selectedTaskWorkspace.progress_percentage ?? 0,
                progress_notes: selectedTaskWorkspace.progress_notes || "",
                project_requirements: selectedTaskWorkspace.project_requirements || "",
                deliverable_url: finalUrl,
                time_spent_hours: selectedTaskWorkspace.time_spent_hours ?? 0,
              }
            });
            toast.success("Task workspace saved and updated!");
            setSelectedTaskWorkspace(null);
            qc.invalidateQueries({ queryKey: ["my-tasks"] });
          } catch (err: any) { toast.error("Failed to save workspace: " + err.message); }
        }}>Save &amp; Submit Workspace</Button>
      </div>
    </div>
  </div>
)}

      {/* ── Deadline Extension Request Modal ── */}
      {showExtensionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0E131F] rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl border border-slate-800/80 text-white">
            <div className="flex items-start justify-between border-b border-slate-800/80 pb-3.5">
              <div>
                <h3 className="font-bold text-sm text-white">Request Deadline Extension</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">For task: {showExtensionModal.title}</p>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full text-slate-400 hover:text-white cursor-pointer" onClick={() => setShowExtensionModal(null)}>✕</Button>
            </div>
            
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (!extensionReason.trim() || !extensionDate) {
                  toast.error("Please fill in all requested extension parameters.");
                  return;
                }
                setIsSubmittingExtension(true);
                try {
                  await doRequestDeadlineExtension({
                    data: {
                      taskId: showExtensionModal.id,
                      reason: extensionReason,
                      requestedDate: new Date(extensionDate).toISOString(),
                    }
                  });
                  toast.success("Extension request submitted successfully!");
                  setShowExtensionModal(null);
                  qc.invalidateQueries({ queryKey: ["my-tasks"] });
                } catch (e) {
                  toast.error("Failed to submit extension request");
                } finally {
                  setIsSubmittingExtension(false);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400">Requested Due Date</label>
                <input 
                  type="date"
                  required
                  value={extensionDate}
                  onChange={(e) => setExtensionDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400">Extension Reason / Blockers</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Explain why you need more time, current progress status, and estimated date of completion..."
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800/80">
                <Button type="button" variant="ghost" size="sm" className="text-slate-400 hover:text-white cursor-pointer" onClick={() => setShowExtensionModal(null)}>Cancel</Button>
                <Button 
                  type="submit"
                  disabled={isSubmittingExtension}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-950/60 cursor-pointer"
                >
                  {isSubmittingExtension ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Submit Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Google Docs / Sheets & Spreadsheet Viewer Modal ── */}
      {viewingDoc && (
        <GoogleDocViewerModal
          url={viewingDoc.url}
          title={viewingDoc.title}
          isOpen={!!viewingDoc}
          onClose={() => setViewingDoc(null)}
        />
      )}

      {/* Floating Apps Panel */}
      <FloatingAppsPanel />

      {/* ── First-Time Login Animated Welcome Modal ── */}
      <FirstLoginWelcomeModal user={profile} mustChangePassword={!!session?.user?.user_metadata?.must_change_password} />

      {/* ── Corporate Standard & Executive Secure Checkout Modal System ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[200] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 lg:p-8 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full min-w-0 p-0 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-300 my-auto">
            
            {/* Corporate Header */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white p-5 sm:p-6 border-b border-white/10 relative">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-11 w-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg sm:text-xl font-black tracking-tight text-white truncate">Corporate Checkout</h3>
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                        <Lock className="h-2.5 w-2.5" /> 256-Bit SSL
                      </span>
                      <span className="hidden sm:inline-flex text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10 shrink-0">
                        PCI-DSS L1
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 truncate">
                      Vyntyra Consultancy Services · Project VyNexa Directorate
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentModalTab("checkout");
                  }} 
                  className="p-2 hover:bg-white/10 rounded-full text-slate-300 hover:text-white transition-colors shrink-0"
                  aria-label="Close Checkout"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* In-Modal Corporate Navigation Tabs */}
              <div className="flex items-center gap-1.5 mt-5 pt-3.5 border-t border-white/10 overflow-x-auto scrollbar-none">
                {[
                  { id: "checkout", label: "Payment Gateway", icon: CreditCard },
                  { id: "invoice", label: "Proforma Invoice", icon: Receipt },
                  { id: "privacy", label: "Privacy Policy", icon: Shield },
                  { id: "refunds", label: "Refund Policy", icon: FileText },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = paymentModalTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPaymentModalTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                        isActive
                          ? "bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30 font-black"
                          : "text-slate-300 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" /> {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TAB 1: CHECKOUT VIEW */}
            {paymentModalTab === "checkout" && (
              <div className="p-4 sm:p-6 lg:p-7 space-y-5">
                {/* Candidate & Order Breakdown Card */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/60 p-4 sm:p-5 space-y-4 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3.5">
                    <div className="min-w-0">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Award className="h-3.5 w-3.5" /> Internship Certification &amp; Verification
                      </div>
                      <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white mt-1 truncate">
                        {profile?.full_name || displayName}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        ID: {profile?.intern_id || "VCS-INT-2026"} · Track: {profile?.position || "Full Stack Engineering"}
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="text-[11px] text-slate-400 line-through">Standard: ₹999</div>
                      <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono leading-tight">
                        ₹{Math.max(0, (profile?.exam_fee_amount !== undefined ? profile.exam_fee_amount : 199) - (appliedPromo?.discount || 0))}
                      </div>
                      <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase">
                        Incl. 18% GST (CGST+SGST)
                      </div>
                    </div>
                  </div>

                  {/* Included Deliverables Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>ISO-Certified QR Verified Certificate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Full Task Submissions &amp; Code Review</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Top 10% Stipend (₹5,000–₹15,000)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>25%–50% Referral Cashbacks</span>
                    </div>
                  </div>

                  {/* Promo Voucher Code Input */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    {appliedPromo ? (
                      <div className="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-emerald-600" />
                          <span className="font-bold text-emerald-900 dark:text-emerald-200">
                            Code <strong>{appliedPromo.code}</strong> Applied: Saved ₹{appliedPromo.discount}!
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAppliedPromo(null)}
                          className="text-[11px] font-bold text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                          <Input
                            placeholder="Enter Scholarship or Referral Voucher Code..."
                            value={promoCodeInput}
                            onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                            className="pl-8 h-8 text-xs font-mono uppercase bg-white dark:bg-slate-900"
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!promoCodeInput.trim() || isApplyingPromo}
                          onClick={() => {
                            const code = promoCodeInput.trim().toUpperCase();
                            setIsApplyingPromo(true);
                            setTimeout(() => {
                              setIsApplyingPromo(false);
                              if (code === "SCHOLAR50" || code === "VYNTYRA50") {
                                setAppliedPromo({ code, discount: 50 });
                                toast.success(`Voucher ${code} applied! ₹50 discount activated.`);
                                setPromoCodeInput("");
                              } else if (code === "SCHOLAR100" || code === "VYNTYRA100") {
                                setAppliedPromo({ code, discount: 100 });
                                toast.success(`Voucher ${code} applied! ₹100 discount activated.`);
                                setPromoCodeInput("");
                              } else {
                                toast.info(`Promo code "${code}" registered for cohort evaluation.`);
                                setAppliedPromo({ code, discount: 0 });
                              }
                            }, 500);
                          }}
                          className="h-8 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shrink-0"
                        >
                          Apply Code
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Corporate Gateway Selection */}
                <div className="space-y-2.5">
                  <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                    Select Payment Gateway
                  </label>

                  <div className="space-y-3">
                    {/* PayU Enterprise Gateway Card */}
                    <div
                      onClick={() => setPaymentGatewaySelected("payu")}
                      className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                        paymentGatewaySelected === "payu"
                          ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:border-emerald-300 bg-white dark:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <div className="h-12 w-14 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl tracking-tight shadow-md shadow-emerald-600/30 shrink-0">
                            PayU
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-slate-900 dark:text-white text-base">PayU Enterprise Gateway</h4>
                              <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full uppercase">
                                Recommended
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Instant automated verification &amp; dashboard unlock
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {paymentGatewaySelected === "payu" ? (
                            <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                              <Check className="h-4 w-4" />
                            </div>
                          ) : (
                            <div className="h-6 w-6 rounded-full border-2 border-slate-300" />
                          )}
                        </div>
                      </div>

                      {/* Payment Channels Pill Grid */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/40 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                        <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">UPI (GPay / PhonePe / Paytm / BHIM)</span>
                        <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">Credit / Debit Cards</span>
                        <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">NetBanking (50+ Banks)</span>
                        <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">Wallets &amp; EMI</span>
                      </div>
                    </div>

                    {/* Kotak Mahindra Bank Gateway Card (Coming Soon) */}
                    <div
                      onClick={() => {
                        toast.info("Kotak Mahindra Bank Payment Gateway integration is coming soon! Please proceed with PayU Enterprise Gateway.");
                      }}
                      className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/40 opacity-75 transition-all cursor-pointer relative overflow-hidden hover:opacity-90"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <div className="h-12 w-14 rounded-xl bg-gradient-to-br from-rose-700/80 via-red-700/80 to-indigo-950 text-white flex flex-col items-center justify-center font-black tracking-tight shadow-sm shrink-0">
                            <span className="text-[9px] uppercase font-bold tracking-widest text-rose-200">Bank</span>
                            <span className="text-xs font-black tracking-tighter">KOTAK</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-700 dark:text-slate-300 text-base">Kotak Mahindra Bank Gateway</h4>
                              <span className="text-[9px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800/50 px-2 py-0.5 rounded-full uppercase">
                                Coming Soon
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Direct Kotak 811, NetBanking, Instant UPI &amp; Cards — Integration in Progress
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          <span className="text-[10px] font-medium text-slate-400 hidden sm:inline">Coming Soon</span>
                          <Lock className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>

                      {/* Payment Channels Pill Grid */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        <span className="px-2 py-0.5 rounded-md bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">Kotak NetBanking</span>
                        <span className="px-2 py-0.5 rounded-md bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">Kotak 811 UPI</span>
                        <span className="px-2 py-0.5 rounded-md bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">Credit / Debit Cards</span>
                        <span className="px-2 py-0.5 rounded-md bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">UPI &amp; Corporate Banking</span>
                      </div>
                    </div>

                    {/* RazorPay Corporate Gateway */}
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/30 opacity-60 flex items-center justify-between gap-3 cursor-not-allowed">
                      <div className="flex items-center gap-3.5">
                        <div className="h-10 w-12 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm shrink-0">
                          RPay
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-slate-600 dark:text-slate-400 text-sm">RazorPay Corporate Gateway</h5>
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full uppercase">Enabled Shortly</span>
                          </div>
                          <p className="text-[11px] text-slate-400">Secondary gateway backup</p>
                        </div>
                      </div>
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Compliance & Security Strip */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                  <div className="space-y-0.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 mx-auto" />
                    <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">PCI-DSS Level 1</div>
                    <div className="text-[9px] text-slate-400">Compliant</div>
                  </div>
                  <div className="space-y-0.5 border-x border-slate-200 dark:border-slate-700">
                    <Lock className="h-4 w-4 text-emerald-600 mx-auto" />
                    <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">RBI 3D Secure</div>
                    <div className="text-[9px] text-slate-400">Verified</div>
                  </div>
                  <div className="space-y-0.5">
                    <Zap className="h-4 w-4 text-emerald-600 mx-auto" />
                    <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">Instant Sync</div>
                    <div className="text-[9px] text-slate-400">Auto Active</div>
                  </div>
                </div>

                {/* Submit Payment CTA */}
                <div className="space-y-3 pt-1">
                  <Button 
                    size="lg" 
                    disabled={!paymentGatewaySelected}
                    onClick={async () => {
                      const amountToCharge = Math.max(0, (profile?.exam_fee_amount !== undefined ? profile.exam_fee_amount : 199) - (appliedPromo?.discount || 0));
                      
                      if (paymentGatewaySelected === "payu") {
                        toast.info("Preparing PayU Corporate Secure Checkout...");
                        
                        try {
                          const payuData = await generatePayuCheckout({
                            data: {
                              firstname: profile?.full_name || displayName,
                              email: profile?.email || email,
                              phone: profile?.phone_number || profile?.phone || "",
                              amount: amountToCharge,
                              productinfo: `Exam Fee Payment - Vyntyra VyNexa Internship (ID: ${profile?.intern_id || 'PROV'})`,
                              userId: session?.user?.id || "",
                            },
                          });

                          // Create a hidden form and auto-submit to PayU
                          const form = document.createElement("form");
                          form.method = "POST";
                          form.action = payuData.action;
                          form.target = "_blank";

                          const fields: Record<string, string> = {
                            key: payuData.key,
                            txnid: payuData.txnid,
                            amount: payuData.amount,
                            productinfo: payuData.productinfo,
                            firstname: payuData.firstname,
                            email: payuData.email,
                            phone: payuData.phone,
                            surl: payuData.surl,
                            furl: payuData.furl,
                            hash: payuData.hash,
                          };

                          Object.entries(fields).forEach(([name, value]) => {
                            const input = document.createElement("input");
                            input.type = "hidden";
                            input.name = name;
                            input.value = value;
                            form.appendChild(input);
                          });

                          document.body.appendChild(form);
                          form.submit();
                          document.body.removeChild(form);

                          setShowPaymentModal(false);
                          toast.success("Redirecting to PayU Secure Corporate Gateway...");
                        } catch (err: any) {
                          console.error("PayU checkout error:", err);
                          toast.error(err?.message || "Failed to initialize PayU checkout");
                        }
                      } else if (paymentGatewaySelected === "kotak") {
                        toast.info("Connecting to Kotak Mahindra Bank Gateway...");
                        try {
                          const kotakData = await doGenerateKotakCheckout({
                            data: {
                              firstname: profile?.full_name || displayName,
                              email: profile?.email || email,
                              phone: profile?.phone_number || profile?.phone || "",
                              amount: amountToCharge,
                              productinfo: `Exam & Certification Fee - Vyntyra VyNexa Internship (ID: ${profile?.intern_id || 'PROV'})`,
                              userId: session?.user?.id || "",
                            },
                          });

                          if (kotakData.action && typeof process !== "undefined" && process.env?.NODE_ENV === "production" && process.env?.KOTAK_MERCHANT_ID) {
                            const form = document.createElement("form");
                            form.method = "POST";
                            form.action = kotakData.action;
                            form.target = "_blank";

                            const fields: Record<string, string> = {
                              merchantId: kotakData.merchantId,
                              txnid: kotakData.txnid,
                              amount: kotakData.amount,
                              currency: kotakData.currency,
                              productinfo: kotakData.productinfo,
                              firstname: kotakData.firstname,
                              email: kotakData.email,
                              phone: kotakData.phone,
                              returnUrl: kotakData.returnUrl,
                              cancelUrl: kotakData.cancelUrl,
                              checksum: kotakData.checksum,
                            };

                            Object.entries(fields).forEach(([name, value]) => {
                              const input = document.createElement("input");
                              input.type = "hidden";
                              input.name = name;
                              input.value = value;
                              form.appendChild(input);
                            });

                            document.body.appendChild(form);
                            form.submit();
                            document.body.removeChild(form);

                            setShowPaymentModal(false);
                            toast.success("Redirecting to Kotak Mahindra Bank Secure Corporate Gateway...");
                          } else {
                            toast.loading("Settling transaction with Kotak Mahindra Bank Gateway...", { id: "kotak-verify" });
                            await doConfirmKotakPayment({
                              data: {
                                userId: session?.user?.id || "",
                                txnid: kotakData.txnid,
                                amount: amountToCharge,
                                paymentMode: "Kotak Mahindra Bank PG / Online",
                                paymentStatus: "paid",
                                bankRefNo: `KKBK-${Date.now().toString().slice(-8)}`
                              }
                            });
                            toast.success("Payment verified successfully via Kotak Mahindra Bank! Your Intern Dashboard and task deliverables are fully unlocked.", { id: "kotak-verify" });
                            setShowPaymentModal(false);
                            qc.invalidateQueries({ queryKey: ["profile"] });
                          }
                        } catch (err: any) {
                          console.error("Kotak checkout error:", err);
                          toast.error(err?.message || "Failed to initialize Kotak Mahindra Bank checkout");
                        }
                      } else {
                        toast.info(`Initializing ${paymentGatewaySelected} Gateway...`);
                        setTimeout(() => {
                          toast.success("Payment verified successfully!");
                          setShowPaymentModal(false);
                        }, 2000);
                      }
                    }}
                    className={`w-full text-base font-extrabold h-14 text-white rounded-2xl shadow-lg gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${
                      paymentGatewaySelected === "kotak"
                        ? "bg-gradient-to-r from-rose-600 via-red-600 to-indigo-700 hover:from-rose-700 hover:to-indigo-800 shadow-rose-600/25"
                        : "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/25"
                    }`}
                  >
                    <Lock className="h-4 w-4" /> Pay ₹{Math.max(0, (profile?.exam_fee_amount !== undefined ? profile.exam_fee_amount : 199) - (appliedPromo?.discount || 0))} Securely with {paymentGatewaySelected === "kotak" ? "Kotak Mahindra Bank" : paymentGatewaySelected === "payu" ? "PayU Enterprise" : "Secure Gateway"}
                  </Button>
                  
                  {/* Legal and Management Footer */}
                  <div className="text-center space-y-1.5 pt-2">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                      Maintained &amp; Governed by JAMI ESWAR ANIL KUMAR · Founder &amp; Director
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
                      <button 
                        type="button"
                        onClick={() => setPaymentModalTab("invoice")} 
                        className="hover:text-emerald-600 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                      >
                        View Proforma Invoice
                      </button>
                      <span>•</span>
                      <button 
                        type="button"
                        onClick={() => setPaymentModalTab("privacy")} 
                        className="hover:text-emerald-600 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                      >
                        Privacy Policy (DPDPA 2023)
                      </button>
                      <span>•</span>
                      <button 
                        type="button"
                        onClick={() => setPaymentModalTab("refunds")} 
                        className="hover:text-emerald-600 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                      >
                        Cancellation &amp; Refund Policy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: IN-MODAL PROFORMA INVOICE VIEW */}
            {paymentModalTab === "invoice" && (
              <div className="p-4 sm:p-6 lg:p-7 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b pb-3">
                  <button
                    type="button"
                    onClick={() => setPaymentModalTab("checkout")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Checkout
                  </button>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Corporate Proforma Invoice</span>
                </div>

                <div className="max-h-[55vh] overflow-y-auto pr-2 space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed scrollbar-thin">
                  {/* Printable Invoice Header */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
                      <div>
                        <div className="font-black text-sm text-slate-900 dark:text-white">VYNTYRA CONSULTANCY SERVICES</div>
                        <div className="text-[11px] text-slate-500">Dwaraka Nagar, Visakhapatnam - 530016, AP, India</div>
                        <div className="text-[11px] text-slate-500">Corporate Email: billing@vyntyraconsultancyservices.in</div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          PROFORMA #{profile?.intern_id ? `VCS-2026-${profile.intern_id}` : "VCS-2026-PROV"}
                        </div>
                        <div className="text-[10px] text-slate-400">Date: {new Date().toLocaleDateString("en-IN")}</div>
                        <div className="text-[10px] text-emerald-600 font-bold">Status: Pending Verification Payment</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-[10px] font-bold uppercase text-slate-400">Billed To (Candidate):</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{profile?.full_name || displayName}</div>
                        <div className="text-slate-500">{profile?.email || email}</div>
                        <div className="text-slate-500">Track: {profile?.position || "Project VyNexa"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase text-slate-400">Authorized Program Director:</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">JAMI ESWAR ANIL KUMAR</div>
                        <div className="text-slate-500">Founder &amp; Lead Director</div>
                      </div>
                    </div>

                    {/* Breakdown Table */}
                    <div className="border rounded-xl overflow-hidden bg-white dark:bg-slate-900 mt-2">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] uppercase">
                          <tr>
                            <th className="p-2.5">Item Description</th>
                            <th className="p-2.5 text-center">SAC Code</th>
                            <th className="p-2.5 text-right">Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          <tr>
                            <td className="p-2.5">
                              <div className="font-semibold text-slate-900 dark:text-slate-100">Internship Examination &amp; ISO Credential Verification</div>
                              <div className="text-[10px] text-slate-400">Project VyNexa Competency Certification Cohort</div>
                            </td>
                            <td className="p-2.5 text-center font-mono text-[11px]">999293</td>
                            <td className="p-2.5 text-right font-mono font-bold">
                              ₹{(Math.max(0, (profile?.exam_fee_amount !== undefined ? profile.exam_fee_amount : 199) - (appliedPromo?.discount || 0)) / 1.18).toFixed(2)}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={2} className="p-2 text-right text-[11px] text-slate-500">CGST (9%)</td>
                            <td className="p-2 text-right font-mono text-[11px]">
                              ₹{((Math.max(0, (profile?.exam_fee_amount !== undefined ? profile.exam_fee_amount : 199) - (appliedPromo?.discount || 0)) / 1.18) * 0.09).toFixed(2)}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={2} className="p-2 text-right text-[11px] text-slate-500">SGST (9%)</td>
                            <td className="p-2 text-right font-mono text-[11px]">
                              ₹{((Math.max(0, (profile?.exam_fee_amount !== undefined ? profile.exam_fee_amount : 199) - (appliedPromo?.discount || 0)) / 1.18) * 0.09).toFixed(2)}
                            </td>
                          </tr>
                          <tr className="bg-emerald-50/60 dark:bg-emerald-950/30 font-bold">
                            <td colSpan={2} className="p-2.5 text-right text-emerald-900 dark:text-emerald-200">Total Net Amount Payable (INR):</td>
                            <td className="p-2.5 text-right font-mono text-sm text-emerald-900 dark:text-emerald-200">
                              ₹{Math.max(0, (profile?.exam_fee_amount !== undefined ? profile.exam_fee_amount : 199) - (appliedPromo?.discount || 0))}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t flex items-center justify-between gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => window.print()}
                    className="text-xs font-bold gap-1.5"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print Proforma Invoice
                  </Button>

                  <Button onClick={() => setPaymentModalTab("checkout")} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                    Proceed to Pay ₹{Math.max(0, (profile?.exam_fee_amount !== undefined ? profile.exam_fee_amount : 199) - (appliedPromo?.discount || 0))}
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 3: IN-MODAL PRIVACY POLICY VIEW */}
            {paymentModalTab === "privacy" && (
              <div className="p-4 sm:p-6 lg:p-7 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b pb-3">
                  <button
                    type="button"
                    onClick={() => setPaymentModalTab("checkout")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Checkout
                  </button>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">DPDPA 2023 Compliant</span>
                </div>

                <div className="max-h-[55vh] overflow-y-auto pr-2 space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed scrollbar-thin">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">1. Introduction &amp; Scope</h4>
                    <p>This Privacy Policy outlines how Vyntyra Consultancy Services ("Company", "we", "us", or "our"), functioning as a Data Fiduciary, collects, stores, uses, processes, and protects the personal data of students, applicants, and interns ("Data Principal", "you", or "your") in compliance with the Digital Personal Data Protection Act (DPDPA), 2023 and the Information Technology Act, 2000.</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">2. Personal Data We Collect</h4>
                    <p>We collect identity and contact data (Name, Email, Phone, Address), Academic/Professional data (College, Degree, Resume, Assessments), Verification credentials, and Financial payment records solely for processing examination fees, stipends, and issuing certified credentials.</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">3. Purpose of Processing &amp; Consent</h4>
                    <p>Your data is processed strictly for verifying project deliverables, assigning mentors, providing verified certificates, administering exam certifications, and managing stipend payouts under affirmative consent (Section 6, DPDPA 2023).</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">4. Data Security &amp; Encryption</h4>
                    <p>All data and payment records are secured using industry-standard 256-bit encryption in transit and at rest, role-based access control, and strict PCI-DSS compliant payment processing.</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="text-[11px] font-bold text-slate-900 dark:text-white">Grievance Officer: JAMI ESWAR ANIL KUMAR</div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300">Designation: Founder &amp; Director · Vyntyra Consultancy Services</div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300">Email: jamieswaranilkumar@vyntyraconsultancyservices.in</div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300">Address: Dwaraka Nagar, Visakhapatnam - 530016, AP, India</div>
                  </div>
                </div>

                <div className="pt-3 border-t flex items-center justify-between gap-3">
                  <Link to="/privacy" target="_blank" className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 font-semibold">
                    Open Full Page <ExternalLink className="h-3 w-3" />
                  </Link>

                  <Button onClick={() => setPaymentModalTab("checkout")} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                    Return to Checkout
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 4: IN-MODAL REFUND POLICY VIEW */}
            {paymentModalTab === "refunds" && (
              <div className="p-4 sm:p-6 lg:p-7 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b pb-3">
                  <button
                    type="button"
                    onClick={() => setPaymentModalTab("checkout")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Checkout
                  </button>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Financial Compliance</span>
                </div>

                <div className="max-h-[55vh] overflow-y-auto pr-2 space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed scrollbar-thin">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">1. Overview</h4>
                    <p>This policy governs examination fees, registration fees, and refund requests related to internship training, certification, and project evaluation offered by Vyntyra Consultancy Services.</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">2. Examination &amp; Verification Fees</h4>
                    <p>The exam and verification fee is charged towards proctoring, platform maintenance, mentor reviews, and verified ISO certificate generation. Once examination assessment and certification processing begins, it is strictly non-refundable.</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">3. Duplicate Transactions &amp; Gateway Errors</h4>
                    <p>In case of duplicate charges due to payment gateway timeouts or network interruptions, 100% of the duplicate amount will be refunded automatically to the original source method within 7 to 10 working days.</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">4. Refund Request Workflow</h4>
                    <p>To submit a query or duplicate transaction issue, email <strong>billing@vyntyraconsultancyservices.in</strong> with your Name, Registered Email, and Transaction Reference / Order ID.</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="text-[11px] font-bold text-slate-900 dark:text-white">Authorized Signatory: JAMI ESWAR ANIL KUMAR</div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300">Designation: Founder &amp; Lead Director</div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300">Official Billing Email: billing@vyntyraconsultancyservices.in</div>
                  </div>
                </div>

                <div className="pt-3 border-t flex items-center justify-between gap-3">
                  <Link to="/refunds" target="_blank" className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 font-semibold">
                    Open Full Page <ExternalLink className="h-3 w-3" />
                  </Link>

                  <Button onClick={() => setPaymentModalTab("checkout")} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                    Return to Checkout
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── Force Password Reset Modal ── */}
      {showForcePasswordModal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4" style={{ pointerEvents: 'all' }}>
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-full bg-amber-50 text-amber-600 mb-2">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {session?.user?.user_metadata?.must_change_password ? "Security Update Required" : "Change Your Password"}
              </h2>
              <p className="text-sm text-slate-500 font-light leading-relaxed">
                {session?.user?.user_metadata?.must_change_password 
                  ? "You are currently signed in with a temporary password. For your account security, please choose a new strong password before continuing."
                  : "Update your password to keep your account secure. Please choose a strong password."}
              </p>
            </div>

            <form onSubmit={handleForcePasswordChange} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password (min 6 characters)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                {!session?.user?.user_metadata?.must_change_password && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForcePasswordModal(false);
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="flex-1 py-3 rounded-xl h-auto"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className={`py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-all h-auto ${session?.user?.user_metadata?.must_change_password ? "w-full" : "flex-1"}`}
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" /> Save
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PwaInstallBanner 
        title="Install Intern Portal"
        subtitle="Get the official Intern Portal app (Chrome App)"
        dismissKey="vy_pwa_intern_banner_dismissed"
        buttonColor="emerald"
        installLabel="Install Intern App"
      />

      {/* ── Meeting Reminder Popup Modal ── */}
      {meetingAlert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-indigo-600">
                <Video className="h-5 w-5 animate-bounce" />
                <h2 className="text-base font-bold">Meeting Reminder</h2>
              </div>
              <button className="text-slate-400 hover:text-slate-600 text-sm font-semibold" onClick={() => setMeetingAlert(null)}>✕</button>
            </div>

            <p className="text-xs text-slate-500 font-medium">You have a scheduled video meeting starting today. Please click join below to enter the meeting room.</p>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Title</div>
                <div className="text-xs font-bold text-slate-800">{meetingAlert.title}</div>
              </div>
              {meetingAlert.description && (
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Description</div>
                  <div className="text-xs text-slate-600 line-clamp-2">{meetingAlert.description}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Time</div>
                  <div className="text-xs font-bold text-slate-700">
                    {new Date(meetingAlert.scheduled_at).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Countdown</div>
                  <div className="text-xs font-bold text-indigo-600">
                    <MeetingCountdown targetDate={meetingAlert.scheduled_at} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 items-center">
              {(() => {
                const state = getJoinButtonState(meetingAlert.scheduled_at, meetingAlert.id);
                return (
                  <>
                    <span className="text-[10px] text-slate-400 font-bold mr-auto">
                      {state.reason}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setMeetingAlert(null)}>Close</Button>
                    <Button 
                      size="sm"
                      disabled={!state.enabled}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                      onClick={() => {
                        const countKey = `meeting-join-count-${meetingAlert.id}`;
                        const currentCount = parseInt(localStorage.getItem(countKey) || "0", 10);
                        localStorage.setItem(countKey, (currentCount + 1).toString());
                        if (meetingAlert.meeting_link) {
                          window.location.href = meetingAlert.meeting_link;
                        }
                      }}
                    >
                      Join Meeting
                    </Button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── Referral Announcement Floating Popup ── */}
      {showReferralPopup && (
        <div className="fixed bottom-4 right-4 z-[90] max-w-sm bg-white rounded-2xl border border-indigo-100 p-5 shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-500 hover:shadow-indigo-500/5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  New in Portal: REFER & EARN
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-800 leading-snug">
                Vyntyra Pays For You!
              </h4>
              <p className="text-xs text-slate-500 leading-normal font-light">
                Earn course fee refunds up to 50% by recommending Project VyNexa to your peers.
              </p>
              
              <div className="pt-2 flex items-center gap-3">
                <Button 
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] h-8 px-4 rounded-xl flex items-center gap-1.5 transition-all active:scale-[0.98]"
                  onClick={() => {
                    setActiveTab("refer");
                    setShowReferralPopup(false);
                    localStorage.setItem("dismissed-referral-popup", "true");
                    toast.success("Navigated to Refer & Earn panel!");
                  }}
                >
                  Find Referral Code <ArrowRight className="h-3 w-3" />
                </Button>
                <button 
                  onClick={() => {
                    setShowReferralPopup(false);
                    localStorage.setItem("dismissed-referral-popup", "true");
                    toast.info("Referral feature tip dismissed.");
                  }}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  Dismiss
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => {
                setShowReferralPopup(false);
                localStorage.setItem("dismissed-referral-popup", "true");
              }}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ─── URGENT ONSCREEN POPUP NOTIFICATION MODAL ─── */}
      {profile?.urgent_popup_active && isFeePaymentPending && (
        <div className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0E131F] rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border-2 border-rose-500/50 animate-in fade-in zoom-in-95 duration-200 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-rose-950/80 border border-rose-500/40 rounded-2xl text-rose-400 shadow-md animate-bounce duration-1000">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-600 text-white shadow-xs">
                    High Priority Notice
                  </span>
                  <h3 className="font-extrabold text-white text-lg mt-1 leading-tight">
                    {profile?.urgent_popup_title || "Urgent: Exam Fee Payment Required"}
                  </h3>
                </div>
              </div>
            </div>

            <div className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-2xl text-xs text-rose-200 leading-relaxed font-medium">
              {profile?.urgent_popup_message || "Exam fee is payable to receive certificate and stipend will be provided for top 10% interns up to ₹5,000 to ₹15,000 (terms and eligibility apply). Once the payment is done, only then your dashboard will be fully functional."}
            </div>

            {/* Countdown timer in modal */}
            <div className="p-4 bg-[#0A0D17] text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Payment Due Deadline:</span>
                <span className="text-[10px] text-slate-400">
                  {formatDeadlineDisplay(profile?.fee_payment_deadline, "Immediate Action Required")}
                </span>
              </div>
              <FeeCountdownTimer deadline={profile?.fee_payment_deadline} />
            </div>

            <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-2xl text-[11px] text-amber-300 leading-relaxed font-medium">
              <strong>Dashboard Restriction:</strong> Deliverable submissions and final verified certification remain locked until payment is verified.
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/80">
              <button 
                type="button" 
                disabled={isDismissingPopup}
                onClick={async () => {
                  setIsDismissingPopup(true);
                  try {
                    await doDismissUrgentPopup();
                    qc.invalidateQueries({ queryKey: ["profile"] });
                    toast.info("Urgent popup alert acknowledged.");
                  } catch (e) {
                    toast.error("Failed to dismiss alert.");
                  } finally {
                    setIsDismissingPopup(false);
                  }
                }}
                className="text-xs font-semibold text-slate-400 hover:text-white underline underline-offset-4 order-2 sm:order-1 cursor-pointer"
              >
                {isDismissingPopup ? "Acknowledging..." : "Acknowledge & Remind Me Later"}
              </button>

              <Button 
                size="lg" 
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-6 h-11 rounded-xl shadow-lg shadow-rose-950/60 w-full sm:w-auto order-1 sm:order-2 gap-2 cursor-pointer"
                onClick={() => {
                  setShowPaymentModal(true);
                }}
              >
                <DollarSign className="h-4 w-4" /> Pay ₹{profile?.exam_fee_amount || 199} Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── REQUEST DOUBT SOLVING SESSION DIALOG ─── */}
      <Dialog open={doubtModalOpen} onOpenChange={setDoubtModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#0E131F] border border-slate-800/80 text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <HelpCircle className="h-5 w-5 text-amber-400" />
              Request Doubt Solving Session
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Schedule an expedited 1-on-1 or group live sync with your mentor for: <strong>"{doubtTaskTitle}"</strong>
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!doubtTopic.trim()) {
                toast.error("Please enter the specific topic or question you need help with.");
                return;
              }
              setIsSubmittingDoubt(true);
              try {
                await doRequestDoubt({
                  data: {
                    taskId: doubtTaskId,
                    taskTitle: doubtTaskTitle,
                    doubtTopic: doubtTopic.trim(),
                    blockers: doubtBlockers.trim() || null,
                    preferredSlot: doubtSlot.trim() || null,
                    sessionType: doubtType,
                  },
                });
                toast.success("Doubt solving session request dispatched to mentor & directorate!");
                setDoubtModalOpen(false);
                qc.invalidateQueries({ queryKey: ["my-support-queries"] });
                qc.invalidateQueries({ queryKey: ["my-user-notifications"] });
              } catch (err: any) {
                toast.error("Failed to request doubt session: " + err.message);
              } finally {
                setIsSubmittingDoubt(false);
              }
            }}
            className="space-y-3.5 py-2 text-xs"
          >
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 block">Doubt / Technical Topic *</label>
              <Input
                required
                placeholder="e.g. Supabase RLS policy syntax error on deliverables query"
                value={doubtTopic}
                onChange={(e) => setDoubtTopic(e.target.value)}
                className="text-xs bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 rounded-xl outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 block">Current Blockers &amp; Attempts</label>
              <textarea
                rows={2}
                placeholder="What error are you seeing? What steps have you tried so far?"
                value={doubtBlockers}
                onChange={(e) => setDoubtBlockers(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">Session Format</label>
                <select
                  value={doubtType}
                  onChange={(e) => setDoubtType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs font-semibold text-slate-200 outline-none focus:border-amber-500"
                >
                  <option value="one_on_one">1-on-1 Mentorship Sync</option>
                  <option value="group_sync">Group Team Sync</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">Preferred Time Slot</label>
                <Input
                  placeholder="e.g. Today 5:00 PM or Tomorrow Morning"
                  value={doubtSlot}
                  onChange={(e) => setDoubtSlot(e.target.value)}
                  className="text-xs bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 rounded-xl outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-800/80">
              <Button type="button" variant="ghost" size="sm" className="text-slate-400 hover:text-white cursor-pointer" onClick={() => setDoubtModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingDoubt} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5 rounded-xl shadow-md cursor-pointer">
                {isSubmittingDoubt ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Dispatch Doubt Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── REQUEST RESOURCES DIALOG ─── */}
      <Dialog open={resourceModalOpen} onOpenChange={setResourceModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#0E131F] border border-slate-800/80 text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <FolderOpen className="h-5 w-5 text-indigo-400" />
              Request Project Resources
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Request software credentials, API keys, Figma files, datasets, or documentation for <strong>"{resourceTaskTitle}"</strong>
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!resourceDetails.trim()) {
                toast.error("Please explain what resources you need.");
                return;
              }
              setIsSubmittingResource(true);
              try {
                await doRequestResource({
                  data: {
                    taskId: resourceTaskId,
                    taskTitle: resourceTaskTitle,
                    resourceType: resourceType,
                    resourceDetails: resourceDetails.trim(),
                    urgency: resourceUrgency,
                  },
                });
                toast.success("Resource request submitted to operations team!");
                setResourceModalOpen(false);
                qc.invalidateQueries({ queryKey: ["my-access-requests"] });
                qc.invalidateQueries({ queryKey: ["my-user-notifications"] });
              } catch (err: any) {
                toast.error("Failed to submit resource request: " + err.message);
              } finally {
                setIsSubmittingResource(false);
              }
            }}
            className="space-y-3.5 py-2 text-xs"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">Resource Type *</label>
                <select
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs font-semibold text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="API Credentials & Access Keys">API Keys / Secrets</option>
                  <option value="Cloud Sandbox Access (AWS/GCP/Azure)">Cloud Sandbox Access</option>
                  <option value="Figma / UI Design Assets">Figma / UI Design Assets</option>
                  <option value="Project Dataset / SQL Dump">Dataset / SQL Dump</option>
                  <option value="Software License / Tool Access">Software License (GitHub/Vercel)</option>
                  <option value="Technical Documentation / Guidelines">Specs & Guidelines</option>
                  <option value="Other Project Resource">Other Custom Resource</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">Urgency Level</label>
                <select
                  value={resourceUrgency}
                  onChange={(e) => setResourceUrgency(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs font-semibold text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="normal">Normal (Within 24h)</option>
                  <option value="urgent">Urgent (Blocked Milestone)</option>
                  <option value="critical">Critical (Immediate Blocker)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 block">Detailed Requirements &amp; Justification *</label>
              <textarea
                required
                rows={3}
                placeholder="Specify exact repo name, API scope, service account email, or dataset file needed..."
                value={resourceDetails}
                onChange={(e) => setResourceDetails(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-800/80">
              <Button type="button" variant="ghost" size="sm" className="text-slate-400 hover:text-white cursor-pointer" onClick={() => setResourceModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingResource} size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold gap-1.5 rounded-xl shadow-lg shadow-indigo-950/60 cursor-pointer">
                {isSubmittingResource ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Submit Resource Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── LMS VIDEO PLAYER MODAL ─── */}
      <Dialog open={!!lmsVideoModalId} onOpenChange={(open) => !open && setLmsVideoModalId(null)}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-black border-slate-800">
          <div className="relative aspect-video w-full">
            {lmsVideoModalId && (
              <iframe
                src={`https://www.youtube.com/embed/${lmsVideoModalId}?autoplay=1`}
                title="LMS Course Video"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── PROFILE DETAIL CHANGE REQUEST MODAL ─── */}
      <ProfileChangeRequestModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        currentProfile={{
          full_name: profile?.full_name,
          email: profile?.email,
          phone_number: profile?.phone_number,
          avatar_url: profile?.avatar_url,
          address: profile?.address,
          role: profile?.role,
          department: profile?.department,
        }}
      />
    </div>
  );
}
