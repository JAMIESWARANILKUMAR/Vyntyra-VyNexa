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
  Building2, Plus, ArrowUpRight, HeartHandshake, CheckSquare, FileUp, Printer, Shield, Radio, Cpu, RotateCcw,
  Coins, CheckCheck, Target, Flame, Calendar, Play, FolderOpen,
  Menu, X, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ProfileChangeRequestModal } from "@/components/profile-change-request-modal";
import EmailAutomationHub from "@/components/email-automation-hub";
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
  listInternTasksForMentor, updateTaskExecution, updateTaskByAdmin,
  listHolidays, createMeeting, updateMeeting,
  submitMentorTaskVerificationReport, scheduleMentorMeeting,
  listAutomatedEmailLogs, deleteAutomatedEmailLog, sendPromotionalInternshipEmail
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
        return prev + 1.25; // 8 seconds per ad
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
      className={`relative overflow-hidden rounded-3xl border ${borderColor} bg-gradient-to-br ${bgColor} via-[#0E131F] to-[#0A0E1A] p-6 md:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 w-full`}
    >
      {/* Decorative background blur */}
      <div 
        className="absolute top-0 right-0 w-72 h-72 rounded-full filter blur-[100px] opacity-15 pointer-events-none"
        style={{ backgroundColor: themeColor }}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Side: YouTube Embed / MP4 Video */}
        <div className="lg:col-span-5 flex flex-col justify-center w-full">
          {/* Stories indicators */}
          <div className="flex gap-1.5 mb-3 px-1">
            {ads.map((_, index) => (
              <div key={index} className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
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
            className="relative overflow-hidden w-full aspect-video rounded-2xl shadow-xl border border-slate-700/60 bg-black z-0"
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
            <div className="absolute inset-0 bg-transparent z-20 pointer-events-auto" />
            
            <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/80 rounded-md text-[9px] text-white flex items-center gap-1.5 backdrop-blur-md pointer-events-none uppercase tracking-wider font-bold border border-white/10 z-30">
              <VolumeX className="w-3.5 h-3.5 text-amber-400" /> Official Video Ad
            </div>
          </div>
        </div>

        {/* Right Side: Details & Call to Action */}
        <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-10 flex items-center px-3 py-1 bg-white/95 rounded-xl shadow-sm border border-slate-200">
                {logoError ? (
                  <div className="text-sm font-black tracking-tight" style={{ color: themeColor }}>
                    {bankName.toUpperCase()}
                  </div>
                ) : (
                  <img 
                    src={logoUrl} 
                    alt={bankName} 
                    className="h-7 object-contain max-w-[160px]" 
                    onError={() => setLogoError(true)} 
                  />
                )}
              </div>
              <span className="text-[9px] px-3 py-1 bg-amber-500/10 text-amber-300 font-extrabold uppercase tracking-widest rounded-full border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-400" /> Preferred Partner
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-extrabold text-white tracking-tight transition-all duration-300">{activeAd.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed transition-all duration-300">{activeAd.slogan}</p>
            </div>

            {/* Instruction Grid Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800">
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Type</div>
                <div className="text-xs font-bold text-white">{accountType}</div>
              </div>
              
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Key Benefit / Reward</div>
                <div className="text-xs font-bold text-emerald-400">{activeAd.feature}</div>
              </div>

              <div className="space-y-0.5 border-t border-slate-800 pt-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Helpline</div>
                <div className="text-xs font-semibold text-slate-200">{bankSupport}</div>
              </div>

              <div className="space-y-0.5 border-t border-slate-800 pt-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vyntyra Fin Desk Contact</div>
                <div className="text-xs font-semibold text-indigo-300">{vyntyraManager}</div>
              </div>

              <div className="space-y-0.5 md:col-span-2 border-t border-slate-800 pt-2 mt-0.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available Branch Hubs</div>
                <div className="text-xs text-slate-300 font-medium leading-relaxed">
                  {branches.join(", ")}
                </div>
              </div>
            </div>
          </div>

          <a href={link} target="_blank" rel="noreferrer" className="block w-full sm:w-fit sm:min-w-[220px]">
            <motion.button 
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              className="w-full py-3 px-6 rounded-xl text-white font-bold text-xs transition-all shadow-xl relative overflow-hidden group flex items-center justify-center gap-2 cursor-pointer border border-white/20"
              style={{ backgroundColor: themeColor }}
            >
              <span className="relative z-10 flex items-center gap-2 font-bold tracking-wide">
                Apply / Open Account Now <ExternalLink className="w-4 h-4" />
              </span>
              <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            </motion.button>
          </a>
        </div>
      </div>
    </motion.div>
  );
}

function BankAdsSection() {
  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pt-2">
      <div className="bg-gradient-to-r from-indigo-950 via-[#0E131F] to-slate-900 rounded-3xl border border-indigo-500/30 p-6 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-900/80 border border-indigo-500/40 rounded-xl text-amber-400">
              <Building2 className="h-5 w-5" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              Exclusive Financial Perks & Corporate Salary Accounts
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Vyntyra Official Partner Banking Ads & Account Benefits
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Zero-balance corporate salary accounts, auto-sweep FD interest rates up to 7.25% p.a., monthly interest credits, lifetime free credit cards, and direct Vyntyra account manager support.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3.5 py-1.5 rounded-full font-extrabold uppercase tracking-widest flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Verified Banking Partners
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <BankAdCard 
          bankName="Kotak Mahindra Bank"
          logoUrl="https://upload.wikimedia.org/wikipedia/commons/e/ea/Kotak_Mahindra_Bank_logo.svg"
          link="https://www.kotak.com/en/home.html"
          themeColor="#e61a22"
          borderColor="border-red-500/30"
          bgColor="from-red-950/30"
          accountType="Zero-Balance Corporate Salary Account"
          branches={["Visakhapatnam (Dwaraka Nagar, MVP Colony)", "Hyderabad (Hitec City, Gachibowli)", "Bengaluru (Indiranagar, Koramangala)", "Chennai (T. Nagar)"]}
          bankSupport="1860 266 2666 / 24x7 Corporate Helpline"
          vyntyraManager="Anil Kumar (Fin-Desk) · Ext: 402"
          ads={[
            { videoId: "1qvcBjU_1Mk", title: "Kotak 811 Zero Balance Salary Account", slogan: "Zero maintenance fees with instant video KYC onboarding in 3 minutes.", feature: "100% digital onboarding & instant virtual Visa card" },
            { videoId: "5UenpW0G6Jk", title: "ActivMoney Auto-Sweep Account", slogan: "Earn FD-like high interest rates up to 7% p.a. on surplus savings while retaining 100% liquidity.", feature: "Auto-sweep FD interest on liquid balance" },
            { videoId: "O-fDk4lI09E", title: "Kotak League Corporate Credit Card", slogan: "Lifetime free credit card with 4x reward points on online shopping & fuel surcharge waiver.", feature: "Zero annual fees for Vyntyra employees" }
          ]}
        />

        <BankAdCard 
          bankName="IDFC FIRST Bank"
          logoUrl="https://upload.wikimedia.org/wikipedia/commons/e/ec/Logo_of_IDFC_First_Bank.svg"
          link="https://www.idfcfirstbank.com/"
          themeColor="#901235"
          borderColor="border-rose-500/30"
          bgColor="from-rose-950/30"
          accountType="Monthly Interest Credit Salary Account"
          branches={["Visakhapatnam (Siripuram, Gajuwaka)", "Hyderabad (Banjara Hills, Madhapur)", "Bengaluru (MG Road, HSR Layout)", "Mumbai (BKC)"]}
          bankSupport="1800 108 8888 / 24x7 Support"
          vyntyraManager="Vyntyra Partner Desk · Ext: 405"
          ads={[
            { videoId: "tpKwQZ9_fEQ", title: "Monthly Interest Payouts up to 7.25% p.a.", slogan: "Earn high interest credited directly to your account every single month instead of quarterly.", feature: "Monthly interest payout compounding" },
            { videoId: "a7Sg-H2bWjE", title: "Zero Fee Banking Guarantee", slogan: "IDFC FIRST Bank guarantees zero fees on 28 essential savings services including IMPS & ATM transactions.", feature: "100% zero hidden charges" },
            { videoId: "2XoQ0z4fIks", title: "Visa Signature Debit Card Perks", slogan: "Free domestic airport lounge access, complimentary insurance coverage & cashback on dining.", feature: "Free airport lounge access & ₹1Cr insurance" }
          ]}
        />

        <BankAdCard 
          bankName="Axis Bank"
          logoUrl="https://upload.wikimedia.org/wikipedia/commons/c/c8/Axis_Bank_logo.svg"
          link="https://www.axisbank.com/"
          themeColor="#97144D"
          borderColor="border-pink-500/30"
          bgColor="from-pink-950/30"
          accountType="Axis Corporate Salary & Wealth Account"
          branches={["Visakhapatnam (VIP Road, Sampath Vinayaka Temple Rd)", "Hyderabad (Jubilee Hills)", "Bengaluru (Koramangala, Whitefield)"]}
          bankSupport="1860 419 5555 / 1860 500 5555"
          vyntyraManager="Vyntyra Partner Desk · Ext: 408"
          ads={[
            { videoId: "xVi-fgAlrEs", title: "Axis Corporate Salary Account", slogan: "Instant account setup, zero minimum balance requirement, and free personal accident cover up to ₹10 Lakhs.", feature: "₹10L Complimentary Accident Cover" },
            { videoId: "O8486c0t6uI", title: "Grab Deals Shopping & Dining Cashback", slogan: "Get up to 15% instant cashback on Amazon, Flipkart, Swiggy, and Zomato via Axis Grab Deals.", feature: "15% Instant cashback on top apps" }
          ]}
        />

        <BankAdCard 
          bankName="HDFC Bank"
          logoUrl="https://upload.wikimedia.org/wikipedia/commons/2/28/HDFC_Bank_Logo.svg"
          link="https://www.hdfcbank.com/"
          themeColor="#004c8f"
          borderColor="border-blue-500/30"
          bgColor="from-blue-950/30"
          accountType="HDFC Premium Corporate Salary Account"
          branches={["Visakhapatnam (Waltair Uplands, Ram Nagar)", "Hyderabad (Ameerpet, Kondapur)", "Bengaluru (UB City)"]}
          bankSupport="1800 202 6161 / Corporate Helpdesk"
          vyntyraManager="Vyntyra Partner Desk · Ext: 401"
          ads={[
            { videoId: "4uXk3r1s378", title: "HDFC Millennium Corporate Salary", slogan: "Zero balance salary account with preferential home loan rates & instant pre-approved personal loans.", feature: "Preferential loan rates & pre-approved credit" },
            { videoId: "92183_7_x1M", title: "Millennia Credit Card Cashback", slogan: "5% cashback on Amazon, Flipkart, Myntra, Swiggy & Uber with complimentary lounge access.", feature: "5% Unlimited cashback on top brands" }
          ]}
        />
      </div>
    </div>
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

  // Profile Change Request Modal State
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Mentor Task Verification Modal State
  const [mentorVerifyTask, setMentorVerifyTask] = useState<any>(null);
  const [mentorReportText, setMentorReportText] = useState("");
  const [mentorRating, setMentorRating] = useState<number>(5);
  const [mentorRecommendedCredits, setMentorRecommendedCredits] = useState<number>(10);
  const [mentorStatus, setMentorStatus] = useState<"verified" | "needs_revision">("verified");
  const [isSubmittingMentorReport, setIsSubmittingMentorReport] = useState(false);
  const doSubmitMentorReport = useServerFn(submitMentorTaskVerificationReport);

  // Mentee Meeting Scheduling State
  const [menteeMeetingOpen, setMenteeMeetingOpen] = useState(false);
  const [menteeMeetingTitle, setMenteeMeetingTitle] = useState("Weekly Mentorship Review Sync");
  const [menteeMeetingDesc, setMenteeMeetingDesc] = useState("Progress evaluation, task blockers review, and roadmap alignment.");
  const [menteeMeetingDate, setMenteeMeetingDate] = useState(new Date().toISOString().split("T")[0]);
  const [menteeMeetingTime, setMenteeMeetingTime] = useState("11:00");
  const [menteeMeetingLink, setMenteeMeetingLink] = useState("");
  const [selectedMenteeIds, setSelectedMenteeIds] = useState<string[]>([]);
  const [isSchedulingMenteeMeeting, setIsSchedulingMenteeMeeting] = useState(false);
  const doScheduleMentorMeeting = useServerFn(scheduleMentorMeeting);

  // Promotional Email Campaigns Functions
  const fetchEmailLogs = useServerFn(listAutomatedEmailLogs);
  const doSendPromotionalEmail = useServerFn(sendPromotionalInternshipEmail);
  const doDeleteAutomatedEmailLog = useServerFn(deleteAutomatedEmailLog);
  const emailLogsQ = useQuery({ queryKey: ["admin-automated-email-logs"], queryFn: () => fetchEmailLogs(), enabled: activeTab === "campaigns" });

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
      const { data: profs } = await supabase.from('profiles').select('*').eq('mentor_id', sessionQ.data.user.id);
      if (!profs || profs.length === 0) return [];

      const emails = profs.map((p: any) => p.email).filter(Boolean);
      if (emails.length > 0) {
        const { data: apps } = await supabase
          .from('applications')
          .select('email, domain, sub_domain, role_applied')
          .in('email', emails);

        const appMap = new Map((apps || []).map((a: any) => [a.email?.toLowerCase(), a]));

        return profs.map((p: any) => {
          const app = appMap.get(p.email?.toLowerCase()) || {};
          const domain = app.domain || p.department || "Technology & Software";
          const subDomain = app.sub_domain || app.role_applied || p.sub_domain || p.subdomain || p.position || "Full Stack Web Development";
          return {
            ...p,
            department: domain,
            domain,
            sub_domain: subDomain,
            subdomain: subDomain,
          };
        });
      }

      return profs;
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
    mutationFn: async (payload: { 
      title: string; 
      description: string; 
      priority: "low"|"medium"|"high"; 
      due_date: string; 
      target_intern_ids: string[];
      task_doc_url?: string;
      report_template_url?: string;
      ppt_template_url?: string;
      task_file_url?: string;
      task_meet_link?: string;
    }) => {
      return assignInternTask({ data: payload });
    },
    onSuccess: (res) => {
      toast.success(`Task successfully assigned to ${res.count} intern(s).`);
      setIsTaskModalOpen(false);
      setTaskTitle("");
      setTaskDesc("");
      setTaskDocUrl("");
      setReportTemplateUrl("");
      setPptTemplateUrl("");
      setTaskFileUrl("");
      setTaskMeetLink("");
      setSelectedInterns([]);
      setTargetInternId(null);
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["all-tasks"] });
    },
    onError: (err: Error) => toast.error(err.message)
  });

  const handleAssignTaskMode = (scope: "single" | "multiple" | "all", internId?: string) => {
    setAssignScope(scope);
    if (scope === "all") {
      setTargetInternId(null);
    } else if (scope === "single") {
      setTargetInternId(internId || (myInterns[0]?.id || null));
    } else if (scope === "multiple") {
      setTargetInternId(null);
      if (selectedInterns.length === 0 && myInterns.length > 0) {
        setSelectedInterns(myInterns.map((i: any) => i.id));
      }
    }
    setIsTaskModalOpen(true);
  };

  const handleAssignTask = (internId?: string) => {
    if (internId) {
      handleAssignTaskMode("single", internId);
    } else if (selectedInterns.length > 0) {
      handleAssignTaskMode("multiple");
    } else {
      handleAssignTaskMode("all");
    }
  };

  const submitAssignTask = () => {
    if (!taskTitle) {
      toast.error("Task title is required.");
      return;
    }

    let ids: string[] = [];
    if (assignScope === "single") {
      if (!targetInternId) {
        toast.error("Please select a target intern.");
        return;
      }
      ids = [targetInternId];
    } else if (assignScope === "multiple") {
      if (selectedInterns.length === 0) {
        toast.error("Please select at least 1 intern to assign task.");
        return;
      }
      ids = selectedInterns;
    } else if (assignScope === "all") {
      ids = myInterns.map((i: any) => i.id);
      if (ids.length === 0) {
        toast.error("No allocated interns found to assign task.");
        return;
      }
    }

    assignTaskMutation.mutate({
      title: taskTitle,
      description: taskDesc,
      priority: taskPriority,
      due_date: taskDueDate,
      target_intern_ids: ids,
      task_doc_url: taskDocUrl.trim() || undefined,
      report_template_url: reportTemplateUrl.trim() || undefined,
      ppt_template_url: pptTemplateUrl.trim() || undefined,
      task_file_url: taskFileUrl.trim() || undefined,
      task_meet_link: taskMeetLink.trim() || undefined,
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
  const [assignScope, setAssignScope] = useState<"single" | "multiple" | "all">("single");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low"|"medium"|"high">("medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [targetInternId, setTargetInternId] = useState<string | null>(null); // null means bulk
  
  // Task Document & Assignment States
  const [taskDocUrl, setTaskDocUrl] = useState("");
  const [reportTemplateUrl, setReportTemplateUrl] = useState("");
  const [pptTemplateUrl, setPptTemplateUrl] = useState("");
  const [taskFileUrl, setTaskFileUrl] = useState("");
  const [taskMeetLink, setTaskMeetLink] = useState("");

  const [editTaskModalOpen, setEditTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const doUpdateTaskByAdmin = useServerFn(updateTaskByAdmin);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);

  const handleEditTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setIsUpdatingTask(true);
    try {
      await doUpdateTaskByAdmin({
        data: {
          id: editingTask.id,
          title: editingTask.title,
          description: editingTask.description,
          priority: editingTask.priority,
          due_date: editingTask.due_date,
          status: editingTask.status,
          task_doc_url: editingTask.task_doc_url || null,
          report_template_url: editingTask.report_template_url || null,
          ppt_template_url: editingTask.ppt_template_url || null,
          task_file_url: editingTask.task_file_url || null,
          task_meet_link: editingTask.task_meet_link || null,
        }
      });
      toast.success("Task & Document links updated successfully!");
      setEditTaskModalOpen(false);
      setEditingTask(null);
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update task");
    } finally {
      setIsUpdatingTask(false);
    }
  };

  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [viewingIntern, setViewingIntern] = useState<any>(null);
  const [viewingInternAttendance, setViewingInternAttendance] = useState<any[]>([]);
  const [isLoadingMenteeAttendance, setIsLoadingMenteeAttendance] = useState(false);
  const [isContactInternModalOpen, setIsContactInternModalOpen] = useState(false);
  const [contactingIntern, setContactingIntern] = useState<any>(null);

  const getInternContactUrls = (intern: any) => {
    if (!intern) return { callUrl: null, waUrl: null, emailUrl: null, waText: "", emailBody: "", emailSubject: "", empName: "", empRole: "", empPhone: "", empEmail: "", company: "" };
    const empName = profile?.full_name || displayName;
    const empRole = profile?.position || profile?.role || "Mentor / Team Lead";
    const empPhone = profile?.phone || "Direct Corporate Line";
    const empEmail = profile?.email || email;
    const company = "Vyntyra Consultancy Services Pvt. Ltd.";

    const rawPhone = (intern.phone || "").replace(/[^0-9]/g, "");
    const waPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

    const waText = `Hello ${intern.full_name},\n\nHope you are doing well. I am reaching out regarding your internship tasks and mentorship updates at Vyntyra Consultancy Services.\n\nWith regards,\n${empName}\n${empRole}\nContact: ${empPhone}\nEmail: ${empEmail}\n${company}`;

    const emailSubject = `Internship Mentorship Update · ${company}`;
    const emailBody = `Hello ${intern.full_name},\n\nI hope this email finds you well.\n\nI am reaching out to check on your current sprint progress, task deliverables, and any guidance or assistance you may need with your project milestones.\n\nPlease feel free to reply to this email or connect directly if you have any questions or require review feedback.\n\nWith regards,\n${empName}\n${empRole}\nContact: ${empPhone}\nEmail: ${empEmail}\n${company}`;

    return {
      callUrl: intern.phone ? `tel:${intern.phone}` : null,
      waUrl: waPhone ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}` : null,
      emailUrl: intern.email ? `mailto:${intern.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}` : null,
      waText,
      emailBody,
      emailSubject,
      empName,
      empRole,
      empPhone,
      empEmail,
      company
    };
  };

  const handleOpenContactModal = (intern: any) => {
    setContactingIntern(intern);
    setIsContactInternModalOpen(true);
  };
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

  // Biometric Fingerprint States
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const [biometricActionType, setBiometricActionType] = useState<"in" | "out">("in");
  const [biometricState, setBiometricState] = useState<"idle" | "scanning" | "verifying" | "success" | "error">("idle");
  const [biometricMessage, setBiometricMessage] = useState("");

  async function startBiometricAuthentication(type: "in" | "out") {
    if (isClockingDisabled) {
      toast.error(clockingDisabledReason || "Attendance clocking is disabled");
      return;
    }
    setBiometricActionType(type);
    setIsBiometricModalOpen(true);
    setBiometricState("scanning");
    setBiometricMessage("Place finger on your device sensor or tap sensor below...");

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try { navigator.vibrate([40, 30, 40]); } catch (_) {}
    }

    // Attempt Native WebAuthn Platform Authenticator (Android Fingerprint / Touch ID / Windows Hello)
    try {
      if (typeof window !== "undefined" && window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().catch(() => false);
        if (available) {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          
          const credential = await navigator.credentials.create({
            publicKey: {
              challenge,
              rp: { name: "Vyntyra Operations", id: window.location.hostname },
              user: {
                id: new Uint8Array(16),
                name: email || "employee",
                displayName: displayName || "Employee"
              },
              pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
              authenticatorSelection: {
                authenticatorAttachment: "platform",
                userVerification: "required"
              },
              timeout: 30000
            }
          }).catch(() => null);

          if (credential) {
            await completeBiometricScan(type);
            return;
          }
        }
      }
    } catch (err) {
      console.log("WebAuthn biometric fallback active:", err);
    }

    // Fallback message if native dialog was dismissed or not configured
    setBiometricState("scanning");
    setBiometricMessage("Touch or hold the fingerprint sensor pad to verify identity");
  }

  async function completeBiometricScan(type: "in" | "out") {
    setBiometricState("verifying");
    setBiometricMessage("Matching biometric template with device security enclave...");
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try { navigator.vibrate([50, 30, 80]); } catch (_) {}
    }

    setTimeout(async () => {
      setBiometricState("success");
      setBiometricMessage(`Biometric Verified! Recording ${type === "in" ? "Clock-In" : "Clock-Out"}...`);
      try {
        if (type === "in") {
          await doClockIn();
          toast.success("Biometric Verified: Shift Clocked In!");
        } else {
          await doClockOut();
          toast.success("Biometric Verified: Shift Clocked Out!");
        }
        qc.invalidateQueries({ queryKey: ["my-attendance"] });
        setTimeout(() => {
          setIsBiometricModalOpen(false);
          setBiometricState("idle");
        }, 1200);
      } catch (err: any) {
        setBiometricState("error");
        setBiometricMessage(err.message || "Failed to log attendance");
        toast.error(err.message || "Biometric attendance failed");
      }
    }, 700);
  }

  async function handleClockIn() {
    startBiometricAuthentication("in");
  }

  async function handleClockOut() {
    startBiometricAuthentication("out");
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
    { id: "banking", label: "Banking & Perks", enabled: true },
    { id: "support", label: "Helpdesk Tickets", badge: tickets.filter((t: any) => t.status === "open").length, enabled: isModuleEnabled("support") },
    { id: "resolver_support", label: "Intern Queries", badge: assignedSupportQueries.filter((q: any) => q.status !== "resolved").length, enabled: isModuleEnabled("resolver_support") },
    { id: "meetings", label: "Meetings", enabled: isModuleEnabled("meetings") },
    { id: "interviews", label: "Interviews", badge: assignedInterviews.length, enabled: isModuleEnabled("interviews") },
    { id: "my_interns", label: "My Interns & Mentorship", badge: myInterns.length, enabled: isModuleEnabled("my_interns") },
    { id: "campaigns", label: "Email Campaigns", enabled: true },
    { id: "announcements", label: `News`, badge: announcements.length, enabled: isModuleEnabled("announcements") },
    { id: "team", label: "Team & Kudos", enabled: isModuleEnabled("team") },
    { id: "resources", label: "Resources & LMS", enabled: isModuleEnabled("resources") },
    { id: "locker", label: "Doc Locker", enabled: isModuleEnabled("locker") },
    { id: "contact", label: "Profile (ESS)", enabled: isModuleEnabled("contact") },
    { id: "security", label: "Security & NOC", enabled: isModuleEnabled("security") },
    { id: "refer", label: "Refer & Earn", enabled: isModuleEnabled("refer") },
  ].filter(t => t.enabled);

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans selection:bg-indigo-600 selection:text-white relative overflow-x-hidden">
      
      {/* Ambient Executive Luxury Glow Lights */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[700px] h-[700px] bg-emerald-600/8 rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:28px_28px] opacity-40" />
      </div>

      {/* Corporate Executive Top Header */}
      <header className={`sticky top-0 z-40 transition-all duration-300 relative ${scrolled ? "bg-[#090D16]/95 backdrop-blur-2xl border-b border-slate-800/80 shadow-2xl shadow-black/60" : "bg-[#090D16] border-b border-slate-800"}`}>
        <div className="w-full max-w-[1800px] mx-auto px-3 sm:px-8 h-16 flex items-center justify-between gap-2 overflow-hidden">
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 shrink">
            <div className="h-9 w-9 sm:h-10 sm:w-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl shadow-lg shadow-indigo-950/60 border border-indigo-400/40 flex items-center justify-center text-white font-black tracking-wider text-sm sm:text-base shrink-0">
              V
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight truncate">Vyntyra Ops</span>
                <span className="bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[8px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                  Executive
                </span>
              </div>
              <span className="hidden md:block text-[10px] text-slate-400 font-medium truncate">Employee &amp; Mentorship Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Quick Shift Biometric Status Badge (Desktop) */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${todayAttendance?.clock_out_time ? 'bg-amber-400' : todayAttendance ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${todayAttendance?.clock_out_time ? 'bg-amber-500' : todayAttendance ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
              </span>
              <span className="text-[11px] font-semibold text-slate-300">
                {todayAttendance?.clock_out_time ? "Shift Ended" : todayAttendance ? "On Shift" : "Clocked Out"}
              </span>
              {!todayAttendance ? (
                <button
                  onClick={handleClockIn}
                  className="ml-1 text-[10px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-2.5 py-0.5 rounded-full transition-all shadow-md flex items-center gap-1 cursor-pointer"
                >
                  <Fingerprint className="h-3 w-3" /> Fingerprint In
                </button>
              ) : !todayAttendance.clock_out_time ? (
                <button
                  onClick={handleClockOut}
                  className="ml-1 text-[10px] bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-2.5 py-0.5 rounded-full transition-all shadow-md flex items-center gap-1 cursor-pointer"
                >
                  <Fingerprint className="h-3 w-3" /> Fingerprint Out
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-white max-w-[120px] truncate">{displayName}</span>
                <span className="text-[10px] text-slate-400 font-mono max-w-[120px] truncate">{email}</span>
              </div>
              <ProfileAvatar url={profile?.avatar_url} name={displayName} className="h-8 w-8 sm:h-9 sm:w-9 ring-2 ring-indigo-500/40 shadow-sm shrink-0" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProfileModalOpen(true)}
                className="h-8 px-2 sm:px-2.5 text-xs font-bold rounded-xl border-slate-700 bg-slate-900/90 text-slate-200 hover:bg-slate-800 hover:text-white gap-1 shadow-2xs shrink-0 cursor-pointer"
                title="Edit Details"
              >
                <User className="h-3.5 w-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="h-8 px-2 sm:px-3 text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-500/30 rounded-xl transition-colors text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>

            {/* ── HAMBURGER MENU BUTTON ── */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="h-9 px-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white border border-indigo-400/40 shadow-md shadow-indigo-950/60 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
              aria-label="Open Employee Navigation Menu"
              title="Open Executive Operations Directory"
            >
              <Menu className="h-4.5 w-4.5 text-white stroke-[2.5]" />
              <span className="text-xs font-black tracking-wider uppercase hidden sm:inline text-white">Menu</span>
            </button>
          </div>
        </div>
        
        {/* Executive Animated Tabs Navigation */}
        <div className="w-full px-4 sm:px-8 overflow-x-auto hide-scrollbar border-t border-slate-800/80 bg-[#050811]/90">
          <div className="w-full max-w-[1800px] mx-auto flex items-center gap-1.5 py-2.5 relative">
            {TABS.map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`relative flex items-center shrink-0 px-3.5 py-1.5 text-[12px] font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? "text-white bg-indigo-600 shadow-lg shadow-indigo-950/60 border border-indigo-400/30" 
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    {t.label}
                    {('badge' in t && t.badge !== undefined) && (t as any).badge > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                        isActive ? "bg-white/30 text-white" : "bg-slate-800 text-indigo-300 border border-slate-700"
                      }`}>
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

      {/* ── EMPLOYEE MOBILE SLIDE-IN NAVIGATION DRAWER ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-in Drawer Container */}
          <div className="relative w-full max-w-sm sm:max-w-md bg-[#090D16] border-l border-slate-800 shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-right duration-300 text-white">
            
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-indigo-950 via-[#0E131F] to-indigo-950 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl shadow-lg border border-indigo-400/40 flex items-center justify-center text-white font-black text-sm">
                  V
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">Vyntyra Ops</h3>
                    <span className="bg-indigo-500/20 text-indigo-300 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border border-indigo-500/40 uppercase">
                      Executive
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Employee &amp; Mentorship Directory</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close Navigation Menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Employee Profile Card inside Drawer */}
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <ProfileAvatar url={profile?.avatar_url} name={displayName} className="h-12 w-12 rounded-2xl ring-2 ring-indigo-500/40 shadow-md shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-sm text-white truncate">{displayName}</h4>
                  <p className="text-xs text-slate-400 font-mono truncate">{email}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[9px] font-mono font-bold text-indigo-300 bg-indigo-950 border border-indigo-500/40 px-2 py-0.5 rounded-md">
                      {profile?.position || "Executive Associate"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shift Biometric Action */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                {!todayAttendance ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      handleClockIn();
                      setMobileMenuOpen(false);
                    }}
                    className="h-9 text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white w-full rounded-xl gap-1.5 shadow-md cursor-pointer"
                  >
                    <Fingerprint className="h-3.5 w-3.5" /> Clock In
                  </Button>
                ) : !todayAttendance.clock_out_time ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      handleClockOut();
                      setMobileMenuOpen(false);
                    }}
                    className="h-9 text-xs font-bold border-rose-500/40 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 w-full rounded-xl gap-1.5 cursor-pointer"
                  >
                    <Fingerprint className="h-3.5 w-3.5 text-rose-400" /> Clock Out
                  </Button>
                ) : (
                  <div className="px-2.5 py-2 rounded-xl bg-slate-900 text-center text-[10px] font-bold text-slate-400 border border-slate-800">
                    ✓ Shift Ended
                  </div>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setProfileModalOpen(true);
                  }}
                  className="h-9 text-xs font-bold bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 rounded-xl gap-1.5 cursor-pointer"
                >
                  <User className="h-3.5 w-3.5 text-indigo-400" /> Settings
                </Button>
              </div>
            </div>

            {/* Categorized Executive Tab List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
              <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-2 mb-2">
                Executive Modules &amp; Directories
              </h5>
              <div className="space-y-1">
                {TABS.map((tab: any) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-lg shadow-indigo-950/60 border border-indigo-400/40"
                          : "bg-slate-900/60 text-slate-300 border border-slate-800/80 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="tracking-tight">{tab.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {('badge' in tab && tab.badge !== undefined) && tab.badge > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                            isActive ? "bg-white/30 text-white" : "bg-slate-800 text-indigo-300 border border-slate-700"
                          }`}>
                            {tab.badge}
                          </span>
                        )}
                        <ChevronRight className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-800 bg-[#060912] space-y-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full h-10 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <LogOut className="h-4 w-4 text-rose-400" />
                <span>Sign Out from Executive Portal</span>
              </Button>
              <p className="text-center text-[10px] text-slate-500 font-medium">
                Vyntyra Ops · Project VyNexa Directorate
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Marquee Notifications (Corporate broadcast ticker) */}
      {announcements.length > 0 && (
        <div className="bg-[#04060C] border-b border-slate-800/80 text-slate-300 text-[11px] uppercase tracking-wider py-2 overflow-hidden flex whitespace-nowrap relative z-10">
          <div className="animate-marquee flex gap-12 shrink-0 min-w-full px-6">
            {announcements.map((a: any) => (
              <span key={a.id} className="inline-flex items-center gap-2.5">
                <Sparkles className="h-3 w-3 text-indigo-400" />
                <span className="font-bold text-indigo-300">{a.type || 'Broadcast'}:</span>
                <span className="text-slate-300 font-normal">{a.title}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <main className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 py-6 relative z-10">
        <AnimatePresence mode="wait">
          
          {/* ─── OVERVIEW ─── */}
          {activeTab === "overview" && (
            <motion.div key="overview" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
              
              {/* Executive Hero Banner */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B101E] via-[#111827] to-[#080C16] text-white border border-slate-800 p-6 sm:p-8 shadow-2xl shadow-black/60">
                <div className="absolute top-0 right-0 p-40 bg-gradient-to-bl from-indigo-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 p-32 bg-gradient-to-tr from-emerald-500/15 to-transparent rounded-full blur-2xl pointer-events-none" />
                
                <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  <div className="space-y-3 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        {profile?.department || "Operations & Engineering"}
                      </span>
                      <span className="bg-slate-800/90 border border-slate-700 text-slate-300 text-[10px] font-mono px-3 py-1 rounded-full">
                        {profile?.intern_id || "EMP-OPERATIONS"}
                      </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                      Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-200 to-white">{displayName.split(' ')[0]}</span>.
                    </h1>

                    <p className="text-slate-300 text-xs sm:text-sm font-normal flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <CalendarDays className="h-4 w-4 text-indigo-400" />
                        {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400">Sprint Velocity: <strong className="text-emerald-400">{progress}%</strong></span>
                    </p>
                  </div>
                  
                  {/* Executive KPI Counter Ring */}
                  <div className="flex items-center gap-6 bg-slate-900/90 p-5 rounded-2xl border border-slate-700/80 backdrop-blur-md shadow-inner shrink-0">
                    <div className="text-center px-3">
                      <div className="text-3xl font-black tracking-tight text-white">{tasks.length}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1 font-bold">Assigned Tasks</div>
                    </div>
                    <div className="w-px h-10 bg-slate-800" />
                    <div className="text-center px-3">
                      <div className="text-3xl font-black tracking-tight text-indigo-400">{myInterns.length}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1 font-bold">Mentees</div>
                    </div>
                    <div className="w-px h-10 bg-slate-800" />
                    <div className="text-center px-3">
                      <div className="text-3xl font-black tracking-tight text-emerald-400">{attendanceLogs.length}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1 font-bold">Workdays</div>
                    </div>
                  </div>
                </div>

                {/* Quick Corporate Action Buttons */}
                <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  <button
                    onClick={() => setActiveTab("tasks")}
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-indigo-600/30 border border-slate-800 hover:border-indigo-500/50 text-left transition-all group cursor-pointer"
                  >
                    <ClipboardList className="h-4 w-4 text-indigo-400 group-hover:text-white mb-1.5 transition-colors" />
                    <div className="text-xs font-bold text-slate-200 group-hover:text-white">Tasks Hub</div>
                    <div className="text-[10px] text-slate-400">{pendingTasks.length} pending</div>
                  </button>

                  <button
                    onClick={() => setActiveTab("my_interns")}
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-purple-600/30 border border-slate-800 hover:border-purple-500/50 text-left transition-all group cursor-pointer"
                  >
                    <GraduationCap className="h-4 w-4 text-purple-400 group-hover:text-white mb-1.5 transition-colors" />
                    <div className="text-xs font-bold text-slate-200 group-hover:text-white">Mentorship</div>
                    <div className="text-[10px] text-slate-400">{myInterns.length} active</div>
                  </button>

                  <button
                    onClick={() => setActiveTab("attendance")}
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-emerald-600/30 border border-slate-800 hover:border-emerald-500/50 text-left transition-all group cursor-pointer"
                  >
                    <Fingerprint className="h-4 w-4 text-emerald-400 group-hover:text-white mb-1.5 transition-colors" />
                    <div className="text-xs font-bold text-slate-200 group-hover:text-white">Biometric Shift</div>
                    <div className="text-[10px] text-slate-400">{todayAttendance ? "Logged today" : "Pending clock-in"}</div>
                  </button>

                  <button
                    onClick={() => setActiveTab("campaigns")}
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-cyan-600/30 border border-slate-800 hover:border-cyan-500/50 text-left transition-all group cursor-pointer"
                  >
                    <Mail className="h-4 w-4 text-cyan-400 group-hover:text-white mb-1.5 transition-colors" />
                    <div className="text-xs font-bold text-slate-200 group-hover:text-white">Campaigns</div>
                    <div className="text-[10px] text-slate-400">Promotions &amp; Outreach</div>
                  </button>

                  <button
                    onClick={() => setActiveTab("payouts")}
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-amber-600/30 border border-slate-800 hover:border-amber-500/50 text-left transition-all group cursor-pointer"
                  >
                    <CreditCard className="h-4 w-4 text-amber-400 group-hover:text-white mb-1.5 transition-colors" />
                    <div className="text-xs font-bold text-slate-200 group-hover:text-white">Payouts</div>
                    <div className="text-[10px] text-slate-400">Claims &amp; Salary Slip</div>
                  </button>

                  <button
                    onClick={() => setActiveTab("refer")}
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-rose-600/30 border border-slate-800 hover:border-rose-500/50 text-left transition-all group cursor-pointer"
                  >
                    <Coins className="h-4 w-4 text-rose-400 group-hover:text-white mb-1.5 transition-colors" />
                    <div className="text-xs font-bold text-slate-200 group-hover:text-white">Refer &amp; Earn</div>
                    <div className="text-[10px] text-slate-400">Live Commission</div>
                  </button>
                </div>
              </div>

              {/* Stats Row - High-Density Glassmorphism Cards */}
              <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Pending Sprint Tasks", value: pendingTasks.length, icon: <ClipboardList className="h-5 w-5 text-indigo-400" />, change: `${tasks.length} total`, color: "indigo" },
                  { label: "Present Workdays", value: attendanceLogs.length, icon: <Fingerprint className="h-5 w-5 text-emerald-400" />, change: "100% attendance", color: "emerald" },
                  { label: "Upcoming Meetings", value: meetings.filter(m => new Date(m.scheduled_at) >= new Date()).length, icon: <Video className="h-5 w-5 text-purple-400" />, change: "Sync scheduled", color: "purple" },
                  { label: "Leave Requests", value: leaves.length, icon: <CalendarX2 className="h-5 w-5 text-amber-400" />, change: "View status", color: "amber" },
                ].map((s, i) => (
                  <motion.div variants={itemVariants} key={i} className="group p-5 rounded-3xl bg-[#0E131F]/90 border border-slate-800/80 backdrop-blur-xl shadow-xl hover:border-slate-700 transition-all duration-300 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/80">{s.icon}</div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.change}</span>
                    </div>
                    <div className="text-3xl font-black text-white mb-1">{s.value}</div>
                    <div className="text-[11px] text-slate-400 font-semibold">{s.label}</div>
                  </motion.div>
                ))}
              </motion.div>
              
              {/* Split Corporate Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div variants={itemVariants} initial="initial" animate="animate" className="lg:col-span-1 space-y-6">
                  <div className="bg-[#0E131F]/90 rounded-3xl border border-slate-800/80 shadow-xl backdrop-blur-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-indigo-400" /> Corporate Calendar
                      </div>
                      <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                        {holidaysQ.data?.length || 0} Holidays
                      </span>
                    </div>
                    <MonthlyCalendar events={[...schedules, ...meetings]} holidays={holidaysQ.data || []} />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} initial="initial" animate="animate" className="lg:col-span-2 space-y-6">
                  <div className="bg-[#0E131F]/90 rounded-3xl border border-slate-800/80 shadow-xl backdrop-blur-xl p-6">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                          <Target className="h-4 w-4 text-indigo-400" /> Active Priority Tasks
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">High-priority milestones currently in progress or awaiting completion.</p>
                      </div>
                      <Button variant="outline" size="sm" className="text-xs font-bold text-indigo-300 border-indigo-500/40 bg-indigo-950/40 hover:bg-indigo-900/60" onClick={() => setActiveTab("tasks")}>
                        View All Tasks ↗
                      </Button>
                    </div>

                    <div className="divide-y divide-slate-800/60">
                      {tasks.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 font-light">No tasks assigned currently.</div>
                      ) : (
                        tasks.slice(0, 4).map((task: any) => {
                          const s = TASK_STATUS_STYLES[task.status] || TASK_STATUS_STYLES.pending;
                          return (
                            <div key={task.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-800/40 px-2 rounded-xl transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-indigo-400" />
                                <div>
                                  <div className="text-xs font-bold text-white">{task.title}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">Due: {task.due_date ? new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Ongoing sprint"}</div>
                                </div>
                              </div>
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
                    <div className="p-6 bg-[#0E131F]/90 border border-slate-800/80 rounded-3xl shadow-xl backdrop-blur-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Laptop className="h-4 w-4 text-indigo-400" /> Assigned Hardware
                        </div>
                        <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">Active</span>
                      </div>
                      <div className="space-y-2.5 text-xs">
                        <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Laptop className="h-4 w-4 text-slate-400" />
                            <div>
                              <div className="font-bold text-slate-200">MacBook Pro M3 Max</div>
                              <div className="text-[10px] text-slate-400 font-mono">SN: VY-MAC-2026-981</div>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold">Assigned</span>
                        </div>
                        <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Shield className="h-4 w-4 text-indigo-400" />
                            <div>
                              <div className="font-bold text-slate-200">YubiKey 5C NFC 2FA</div>
                              <div className="text-[10px] text-slate-400 font-mono">SN: VY-KEY-4490</div>
                            </div>
                          </div>
                          <span className="text-[10px] text-emerald-400 font-bold">Enrolled</span>
                        </div>
                      </div>
                    </div>

                    {/* Onboarding Checklist */}
                    <div className="p-6 bg-[#0E131F]/90 border border-slate-800/80 rounded-3xl shadow-xl backdrop-blur-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-400" /> Compliance &amp; Security
                        </div>
                        <span className="text-[10px] bg-blue-950/80 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">Verified</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        {[
                          "Corporate Workspace & SSO Access",
                          "Identity Verification & Signed NDA",
                          "Payroll & Bank Details Setup",
                          "Annual Security & Compliance Training"
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-slate-300">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            <span className="font-medium text-[11px]">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Partner Banking Ads Card Row */}
              <div className="pt-4 border-t border-slate-800/80">
                <BankAdsSection />
              </div>
            </motion.div>
          )}

          {/* ─── TASKS ─── */}
          {activeTab === "tasks" && (
            <motion.div key="tasks" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-7xl mx-auto space-y-6">
              <div className="bg-[#0E131F]/90 rounded-3xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-indigo-400" /> Sprint Task Management
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Track sprint deliverables, update milestone execution, and monitor active deliverables.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-bold px-3 py-1.5 rounded-xl">
                    {pendingTasks.length} Active / {tasks.length} Total
                  </span>
                </div>
              </div>

              <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
                {tasks.length === 0 ? (
                  <div className="p-16 text-center text-slate-400 font-light bg-[#0E131F]/80 rounded-3xl border border-dashed border-slate-800 shadow-xl backdrop-blur-xl">
                    <ClipboardList className="h-10 w-10 text-slate-500 mx-auto mb-3 opacity-60" />
                    <p className="text-sm font-semibold text-slate-300">No sprint tasks assigned.</p>
                    <p className="text-xs text-slate-400 mt-1">New tasks assigned by administrators or team leads will appear here.</p>
                  </div>
                ) : (
                  tasks.map((task: any) => {
                    const s = TASK_STATUS_STYLES[task.status] || TASK_STATUS_STYLES.pending;
                    return (
                      <motion.div
                        variants={itemVariants}
                        key={task.id}
                        className="p-5 bg-[#0E131F]/90 border border-slate-800/80 rounded-2xl shadow-xl backdrop-blur-xl hover:border-indigo-500/50 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="font-bold text-sm text-white">{task.title}</h3>
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold ${s.badge}`}>
                              {s.label}
                            </span>
                            {task.priority && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase">
                                {task.priority}
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-xs text-slate-400 font-normal leading-relaxed max-w-3xl line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 flex-wrap">
                            {task.due_date && <span>Deadline: <strong className="text-slate-300">{new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</strong></span>}
                            {task.credits && <span>Credits: <strong className="text-indigo-400">{task.credits}</strong></span>}
                            
                            {/* Document & Template Links */}
                            {task.task_doc_url && (
                              <a href={task.task_doc_url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline flex items-center gap-1 font-bold">
                                <BookOpen className="h-3 w-3" /> Handbook
                              </a>
                            )}
                            {task.report_template_url && (
                              <a href={task.report_template_url} target="_blank" rel="noreferrer" className="text-orange-400 hover:underline flex items-center gap-1 font-bold">
                                <FileText className="h-3 w-3" /> Report Template
                              </a>
                            )}
                            {task.ppt_template_url && (
                              <a href={task.ppt_template_url} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline flex items-center gap-1 font-bold">
                                <Play className="h-3 w-3" /> PPT File
                              </a>
                            )}
                            {task.task_file_url && (
                              <a href={task.task_file_url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1 font-bold">
                                <FolderOpen className="h-3 w-3" /> Project Files
                              </a>
                            )}
                            {task.task_meet_link && (
                              <a href={task.task_meet_link} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1 font-bold">
                                <Video className="h-3 w-3" /> Meet Link
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingTask(task);
                              setEditTaskModalOpen(true);
                            }}
                            className="bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 text-xs font-semibold rounded-xl cursor-pointer"
                          >
                            Edit Task &amp; Docs
                          </Button>
                          {task.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => markTaskStatus(task.id, "in_progress")}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                            >
                              Start Task
                            </Button>
                          )}
                          {task.status === "in_progress" && (
                            <Button
                              size="sm"
                              onClick={() => markTaskStatus(task.id, "completed")}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 cursor-pointer"
                            >
                              <CheckCheck className="h-3.5 w-3.5" /> Mark Complete
                            </Button>
                          )}
                          {task.status === "completed" && (
                            <span className="text-xs text-emerald-300 font-bold flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Completed
                            </span>
                          )}
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
            <motion.div key="attendance" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-7xl mx-auto space-y-6">
              <div className="bg-[#0E131F]/90 rounded-3xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                    <Fingerprint className="h-5 w-5 text-indigo-400" /> Biometric Time &amp; Attendance Desk
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Real-time device fingerprint verification, automated daily work-hour logs, and shift verification records.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {attendanceLogs.length} Shifts Logged
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                  {/* Shift Clock Card */}
                  <div className="p-6 border border-slate-800/80 rounded-3xl bg-gradient-to-b from-[#0F172A] to-[#0A0E1A] shadow-2xl backdrop-blur-xl text-center relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400" />
                    
                    <div className="inline-flex p-4 rounded-2xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 mb-4 shadow-inner">
                      <Fingerprint className="h-8 w-8 animate-pulse" />
                    </div>

                    <div className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest mb-1.5">Biometric Sensor Ready</div>
                    
                    <div className="text-2xl font-black text-white tracking-tight mb-4">
                      {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                    </div>
                    
                    {todayAttendance ? (
                      todayAttendance.clock_out ? (
                        <div className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Today's Shift Completed
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          className="w-full h-12 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-950/50 disabled:opacity-50 gap-2 cursor-pointer" 
                          onClick={handleClockOut} 
                          disabled={isClocking || isClockingDisabled}
                          title={clockingDisabledReason}
                        >
                          <Fingerprint className="h-4 w-4" />
                          Fingerprint Clock Out
                        </Button>
                      )
                    ) : (
                      <Button 
                        onClick={handleClockIn} 
                        disabled={isClocking || isClockingDisabled}
                        title={clockingDisabledReason}
                        className="w-full h-12 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white shadow-xl shadow-indigo-950/60 font-black tracking-wide text-xs transition-all disabled:opacity-50 gap-2 cursor-pointer border border-indigo-400/30"
                      >
                        <Fingerprint className="h-4 w-4 animate-pulse" />
                        Clock In with Fingerprint Sensor
                      </Button>
                    )}
                    
                    {todayAttendance && (
                      <div className="text-xs font-medium text-slate-400 space-y-2.5 mt-5 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-inner">
                        <div className="flex justify-between items-center text-slate-400">
                          <span>Clock In Time:</span>
                          <span className="font-bold text-white font-mono">{todayAttendance.clock_in ? new Date(todayAttendance.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400 border-t border-slate-800 pt-2">
                          <span>Clock Out Time:</span>
                          <span className="font-bold text-white font-mono">{todayAttendance.clock_out ? new Date(todayAttendance.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "In Progress"}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-[#0E131F]/90 rounded-3xl shadow-xl border border-slate-800/80 backdrop-blur-xl p-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-indigo-400" /> Historical Attendance Registry
                    </h3>

                    <div className="divide-y divide-slate-800/60">
                      {attendanceLogs.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 font-light text-xs">No attendance records logged yet.</div>
                      ) : (
                        attendanceLogs.slice(0, 15).map((log: any) => (
                          <div key={log.id} className="py-3.5 flex items-center justify-between hover:bg-slate-800/40 px-2 rounded-xl transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                              <div>
                                <div className="text-xs font-bold text-white">
                                  {new Date(log.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                                </div>
                                <div className="text-[10px] text-slate-400">Biometric Verified Shift</div>
                              </div>
                            </div>
                            <div className="text-xs font-mono font-bold bg-slate-900 border border-slate-700 text-slate-200 px-3 py-1 rounded-xl">
                              {log.clock_in ? new Date(log.clock_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'} 
                              <span className="mx-2 text-slate-500 font-normal">→</span> 
                              {log.clock_out ? new Date(log.clock_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── LEAVES ─── */}
          {activeTab === "leave" && (
            <motion.div key="leave" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-7xl mx-auto space-y-6">
              <div className="bg-[#0E131F]/90 rounded-3xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                    <CalendarX2 className="h-5 w-5 text-indigo-400" /> Leave &amp; Time-Off Management
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Submit planned vacation, medical leave, or emergency time-off requests with instant administrative routing.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-slate-900 border border-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl">
                    {leaves.length} Total Requests
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <div className="bg-[#0E131F]/90 p-6 rounded-3xl border border-slate-800/80 shadow-xl backdrop-blur-xl">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                      <Plus className="h-4 w-4 text-indigo-400" /> Request Time Off
                    </h3>
                    <form onSubmit={handleSubmitLeave} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Start Date</label>
                        <Input type="date" className="bg-[#131B2E] border-slate-700 focus:ring-indigo-500 focus:border-indigo-500 text-white rounded-xl text-xs font-medium" required value={leaveForm.start_date} onChange={e => setLeaveForm({...leaveForm, start_date: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">End Date</label>
                        <Input type="date" className="bg-[#131B2E] border-slate-700 focus:ring-indigo-500 focus:border-indigo-500 text-white rounded-xl text-xs font-medium" required value={leaveForm.end_date} onChange={e => setLeaveForm({...leaveForm, end_date: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Reason / Justification</label>
                        <Textarea className="bg-[#131B2E] border-slate-700 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder:text-slate-500 rounded-xl resize-none text-xs font-normal" rows={3} required placeholder="Specify the reason for time-off..." value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} />
                      </div>
                      <Button type="submit" className="w-full rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-bold shadow-md h-11 text-xs cursor-pointer">
                        Submit Leave Application
                      </Button>
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="bg-[#0E131F]/90 rounded-3xl border border-slate-800/80 shadow-xl backdrop-blur-xl p-6 space-y-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Clock className="h-4 w-4 text-indigo-400" /> Leave Application History
                    </h3>
                    
                    <div className="space-y-3">
                      {leaves.length === 0 ? (
                        <div className="py-12 bg-slate-900/60 rounded-2xl border border-slate-800 text-center text-slate-400 font-light text-xs">No leave applications submitted yet.</div>
                      ) : (
                        leaves.map((leave: any) => (
                          <motion.div variants={itemVariants} initial="initial" animate="animate" key={leave.id} className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl hover:border-slate-700 transition-all space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="text-xs font-bold text-white">
                                {new Date(leave.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} <span className="mx-1 text-slate-400 font-normal">to</span> {new Date(leave.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </div>
                              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                leave.status === 'approved' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 
                                leave.status === 'rejected' ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30' : 
                                'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                              }`}>{leave.status}</span>
                            </div>
                            <p className="text-xs text-slate-300 font-normal">{leave.reason}</p>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── PAYOUTS & EXPENSES ─── */}
          {activeTab === "payouts" && (
            <motion.div key="payouts" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-7xl mx-auto space-y-6">
              <div className="bg-[#0E131F]/90 rounded-3xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-indigo-400" /> Payroll, Compensation &amp; Payslips
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Access monthly verified payslips, download official PDF statements, and submit out-of-pocket reimbursement claims.</p>
                </div>
                <Button onClick={() => openPayslipModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-10 px-4 text-xs font-bold gap-2 shadow-md shrink-0 cursor-pointer">
                  <FileText className="h-4 w-4" /> Generate Official Payslip
                </Button>
              </div>

              {/* Expense Claim Submission Form */}
              <div className="bg-[#0E131F]/90 p-6 rounded-3xl border border-slate-800/80 shadow-xl backdrop-blur-xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-emerald-400" />
                    Submit Out-of-Pocket Expense Claim
                  </h3>
                  <span className="text-[10px] bg-slate-900 border border-slate-700 text-slate-300 px-2.5 py-0.5 rounded-full font-bold">
                    Reimbursement Desk
                  </span>
                </div>

                <form onSubmit={handleSubmitExpense} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-slate-300">Expense Title</Label>
                    <Input placeholder="e.g. Client Travel / Internet" value={expenseForm.title} onChange={e => setExpenseForm({...expenseForm, title: e.target.value})} required className="bg-[#131B2E] border-slate-700 text-white placeholder:text-slate-500 rounded-xl text-xs mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-300">Category</Label>
                    <select value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value as any})} className="w-full h-10 px-3 mt-1 bg-[#131B2E] border border-slate-700 text-white rounded-xl text-xs font-medium">
                      <option value="Travel" className="bg-[#0E131F]">Travel &amp; Fuel</option>
                      <option value="Food" className="bg-[#0E131F]">Meals &amp; Subsistence</option>
                      <option value="Office Supplies" className="bg-[#0E131F]">Hardware &amp; Equipment</option>
                      <option value="Internet" className="bg-[#0E131F]">Internet &amp; Connectivity</option>
                      <option value="Medical" className="bg-[#0E131F]">Medical Insurance</option>
                      <option value="Other" className="bg-[#0E131F]">Other Expenses</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-300">Amount (₹)</Label>
                    <Input type="number" step="0.01" placeholder="₹ Amount" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} required className="bg-[#131B2E] border-slate-700 text-white placeholder:text-slate-500 rounded-xl text-xs mt-1 font-bold" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-300">Expense Incurred Date</Label>
                    <Input type="date" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} required className="bg-[#131B2E] border-slate-700 text-white rounded-xl text-xs mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-300">Receipt / Bill URL (Optional)</Label>
                    <Input placeholder="https://..." value={expenseForm.receipt_url} onChange={e => setExpenseForm({...expenseForm, receipt_url: e.target.value})} className="bg-[#131B2E] border-slate-700 text-white placeholder:text-slate-500 rounded-xl text-xs mt-1 font-mono" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-300">Business Justification</Label>
                    <Input placeholder="Client meeting / Team sync" value={expenseForm.notes} onChange={e => setExpenseForm({...expenseForm, notes: e.target.value})} className="bg-[#131B2E] border-slate-700 text-white placeholder:text-slate-500 rounded-xl text-xs mt-1" />
                  </div>
                  <div className="col-span-full flex justify-end pt-2">
                    <Button type="submit" disabled={isSubmittingExpense} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl h-10 px-6 text-xs gap-1.5 cursor-pointer">
                      {isSubmittingExpense ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Submit Reimbursement Claim
                    </Button>
                  </div>
                </form>

                {/* Submitted Expenses List */}
                {expenses.length > 0 && (
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Submitted Reimbursements</h4>
                    <div className="space-y-2">
                      {expenses.map((exp: any) => (
                        <div key={exp.id} className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-white">{exp.title} <span className="text-slate-400 font-normal">({exp.category})</span></div>
                            <div className="text-[11px] text-slate-400 font-light mt-0.5">{new Date(exp.date).toLocaleDateString("en-IN")} • {exp.notes || 'No notes'}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-white font-mono text-sm">₹{exp.amount}</span>
                            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${exp.status === 'approved' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'}`}>{exp.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Payouts History */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-emerald-400" /> Historical Compensation Records
                </h3>

                {payouts.length === 0 ? (
                  <div className="py-12 bg-[#0E131F]/90 rounded-3xl border border-slate-800 shadow-xl text-center space-y-3 p-6">
                    <div className="text-slate-400 text-xs">No historical payout vouchers recorded yet.</div>
                    <Button onClick={() => openPayslipModal()} variant="outline" className="rounded-xl text-xs gap-2 border-indigo-500/40 text-indigo-300 bg-indigo-950/40">
                      <FileText className="h-4 w-4 text-indigo-400" /> Generate &amp; View Current Month Statement
                    </Button>
                  </div>
                ) : (
                  payouts.map((payout: any) => (
                    <motion.div variants={itemVariants} initial="initial" animate="animate" key={payout.id} className="p-5 bg-[#0E131F]/90 border border-slate-800/80 rounded-2xl shadow-xl backdrop-blur-xl flex items-center justify-between group hover:border-slate-700 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-2xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                          <IndianRupee className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xl font-black text-white tracking-tight">₹{payout.amount}</div>
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{payout.type} • {new Date(payout.date).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full ${payout.status === 'paid' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-300'}`}>{payout.status}</span>
                        <Button 
                          onClick={() => openPayslipModal(payout)} 
                          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-3.5 py-1.5 text-xs font-bold gap-1.5 transition-all shadow-md cursor-pointer"
                        >
                          <FileText className="h-3.5 w-3.5 text-emerald-300" /> View Payslip
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Partner Banking Ads & Account Benefits */}
              <div className="pt-6 border-t border-slate-800/80">
                <BankAdsSection />
              </div>
            </motion.div>
          )}

          {/* ─── OFFICIAL PARTNER BANKING & PERKS TAB ─── */}
          {activeTab === "banking" && (
            <motion.div key="banking" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-7xl mx-auto space-y-6">
              <BankAdsSection />
            </motion.div>
          )}

          {/* ─── MY INTERNS & MENTORSHIP ─── */}
          {activeTab === "my_interns" && (
            <motion.div key="my_interns" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-7xl mx-auto">
              <div className="bg-[#0E131F]/90 rounded-3xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-950/80 border border-indigo-500/30 rounded-xl text-indigo-400">
                      <GraduationCap className="h-5 w-5" />
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-950/80 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                      Mentorship Hub
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold tracking-tight text-white">
                    Assigned Mentees &amp; Task Deliverables
                  </h2>
                  <p className="text-xs text-slate-400 max-w-2xl">
                    Track your assigned interns' sprint tasks, review submitted links, and host 1-on-1 mentorship sync meetings.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    onClick={() => {
                      setSelectedMenteeIds(myInterns.map((i: any) => i.id));
                      setMenteeMeetingOpen(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md gap-1.5 h-9 cursor-pointer"
                    disabled={myInterns.length === 0}
                  >
                    <Video className="h-4 w-4" /> Schedule Mentee Meeting
                  </Button>

                  <Button 
                    onClick={() => handleAssignTaskMode("all")} 
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md gap-1.5 h-9 cursor-pointer"
                    disabled={myInterns.length === 0}
                    title="Assign task to ALL allocated interns in 1 click"
                  >
                    <Sparkles className="h-4 w-4" /> Assign to ALL ({myInterns.length})
                  </Button>

                  {selectedInterns.length > 0 ? (
                    <Button onClick={() => handleAssignTaskMode("multiple")} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md gap-1.5 h-9 cursor-pointer">
                      <Plus className="h-4 w-4" /> Assign Selected ({selectedInterns.length})
                    </Button>
                  ) : (
                    <Button onClick={() => handleAssignTaskMode("single")} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl shadow-md gap-1.5 h-9 cursor-pointer">
                      <Plus className="h-4 w-4" /> Assign Task
                    </Button>
                  )}
                </div>
              </div>

              <div className="bg-[#0E131F]/90 border border-slate-800/80 rounded-3xl shadow-xl backdrop-blur-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900/90 text-slate-300 font-bold border-b border-slate-800 uppercase text-[11px] tracking-wider">
                      <tr>
                        <th className="px-5 py-4 w-10">
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            checked={selectedInterns.length === myInterns.length && myInterns.length > 0}
                            onChange={(e) => setSelectedInterns(e.target.checked ? myInterns.map((i:any) => i.id) : [])}
                          />
                        </th>
                        <th className="px-5 py-4">Intern / Mentee</th>
                        <th className="px-5 py-4">Department &amp; Sub-Domain</th>
                        <th className="px-5 py-4">Direct Contact</th>
                        <th className="px-5 py-4 text-right">Actions &amp; Oversight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {myInterns.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-light">No interns allocated to you currently. Contact Admin to assign mentees.</td></tr>
                      ) : (
                        myInterns.map((intern: any) => {
                          const urls = getInternContactUrls(intern);
                          const subDomainText = intern.sub_domain || intern.subdomain || "Full Stack Web Development";
                          return (
                            <tr key={intern.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="px-5 py-4">
                                <input 
                                  type="checkbox" 
                                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                  checked={selectedInterns.includes(intern.id)}
                                  onChange={(e) => setSelectedInterns(prev => e.target.checked ? [...prev, intern.id] : prev.filter(id => id !== intern.id))}
                                />
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <ProfileAvatar url={intern.avatar_url} name={intern.full_name} className="h-10 w-10 rounded-xl ring-1 ring-indigo-500/30" />
                                  <div>
                                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                                      {intern.full_name}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{intern.email}</div>
                                    {intern.phone && (
                                      <div className="text-[10px] text-indigo-300 font-mono mt-0.5 flex items-center gap-1">
                                        <Phone className="h-2.5 w-2.5" /> {intern.phone}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[11px] font-extrabold text-amber-300 bg-amber-950/90 px-2.5 py-1 rounded-lg border border-amber-500/40 tracking-tight shadow-xs">
                                    🎯 {subDomainText}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium">
                                  {intern.department || "Technology & Software"}
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {urls.callUrl ? (
                                    <a
                                      href={urls.callUrl}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-blue-300 bg-blue-950/80 border border-blue-500/30 hover:bg-blue-900/80 hover:text-white transition-all shadow-xs"
                                      title={`Direct Call ${intern.full_name} (${intern.phone})`}
                                    >
                                      <Phone className="h-3.5 w-3.5 text-blue-400" />
                                      <span>Contact Now</span>
                                    </a>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenContactModal(intern)}
                                      className="rounded-xl text-[11px] font-bold text-blue-300 bg-blue-950/60 border-blue-500/30 hover:bg-blue-900/60 h-8 px-2.5"
                                      title="Open Contact Options"
                                    >
                                      <Phone className="h-3.5 w-3.5 mr-1 text-blue-400" />
                                      Contact Now
                                    </Button>
                                  )}

                                  {urls.waUrl ? (
                                    <a
                                      href={urls.waUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 hover:bg-emerald-900/80 hover:text-white transition-all shadow-xs"
                                      title={`Send WhatsApp message with official regards`}
                                    >
                                      <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                                      <span>WhatsApp Now</span>
                                    </a>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenContactModal(intern)}
                                      className="rounded-xl text-[11px] font-bold text-emerald-300 bg-emerald-950/60 border-emerald-500/30 hover:bg-emerald-900/60 h-8 px-2.5"
                                      title="Open WhatsApp template"
                                    >
                                      <MessageSquare className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                                      WhatsApp Now
                                    </Button>
                                  )}

                                  {urls.emailUrl ? (
                                    <a
                                      href={urls.emailUrl}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-500/30 hover:bg-indigo-900/80 hover:text-white transition-all shadow-xs"
                                      title={`Send Email with official regards`}
                                    >
                                      <Mail className="h-3.5 w-3.5 text-indigo-400" />
                                      <span>Email Now</span>
                                    </a>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenContactModal(intern)}
                                      className="rounded-xl text-[11px] font-bold text-indigo-300 bg-indigo-950/60 border-indigo-500/30 hover:bg-indigo-900/60 h-8 px-2.5"
                                      title="Open Email template"
                                    >
                                      <Mail className="h-3.5 w-3.5 mr-1 text-indigo-400" />
                                      Email Now
                                    </Button>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-4 text-right space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMenteeIds([intern.id]);
                                    setMenteeMeetingTitle(`Mentorship 1-on-1 Sync: ${intern.full_name}`);
                                    setMenteeMeetingOpen(true);
                                  }}
                                  className="rounded-xl text-xs font-bold text-indigo-300 bg-indigo-950/60 border-indigo-500/30 hover:bg-indigo-900/60 h-8"
                                >
                                  <Video className="h-3.5 w-3.5 mr-1" /> 1-on-1 Sync
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleViewAttendance(intern)} className="rounded-xl text-xs font-medium border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 h-8">
                                  <Clock className="h-3.5 w-3.5 mr-1 text-slate-400" /> Attendance
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedInternForTasks(intern);
                                    loadInternTasks(intern.id);
                                  }}
                                  className="rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white h-8"
                                >
                                  <FileText className="h-3.5 w-3.5 mr-1 text-amber-300" /> Task Board
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleAssignTask(intern.id)} className="rounded-xl text-xs font-medium border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 h-8">
                                  <Plus className="h-3.5 w-3.5 mr-1 text-slate-400" /> Assign Task
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── EMAIL & PROMOTIONAL CAMPAIGNS ─── */}
          {activeTab === "campaigns" && (
            <motion.div key="campaigns" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-7xl mx-auto space-y-6">
              <EmailAutomationHub 
                emailLogsQ={emailLogsQ} 
                doSendPromotionalEmail={doSendPromotionalEmail} 
                doDeleteAutomatedEmailLog={doDeleteAutomatedEmailLog} 
                qc={qc} 
              />
            </motion.div>
          )}

          {/* ─── TEAM & KUDOS ─── */}
          {activeTab === "team" && (
            <motion.div key="team" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-7xl mx-auto">
              <div className="bg-[#0E131F]/90 rounded-3xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-400" /> Team Directory &amp; Peer Recognition
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Explore the organization chart, connect with functional leads, and award merit badges.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-bold px-3 py-1.5 rounded-xl">
                    {team.length} Team Members
                  </span>
                </div>
              </div>

              {/* Give Kudos Section */}
              <div className="bg-[#0E131F]/90 p-6 rounded-3xl border border-slate-800/80 shadow-xl backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-400" />
                    Recognize a Colleague (Send Peer Kudos)
                  </h3>
                  <span className="text-[10px] bg-amber-950/80 text-amber-300 px-2.5 py-0.5 rounded-full font-bold border border-amber-500/30">
                    Culture &amp; Merit
                  </span>
                </div>

                <form onSubmit={handleSubmitKudos} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-slate-300">Team Colleague</Label>
                    <select value={kudosForm.receiver_id} onChange={e => setKudosForm({...kudosForm, receiver_id: e.target.value})} required className="w-full h-10 px-3 mt-1 bg-[#131B2E] border border-slate-700 text-white rounded-xl text-xs font-medium">
                      <option value="" className="bg-[#0E131F]">Select team member...</option>
                      {team.map((m: any) => (
                        <option key={m.id} value={m.id} className="bg-[#0E131F]">{m.full_name} ({m.role})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-300">Merit Badge</Label>
                    <select value={kudosForm.badge} onChange={e => setKudosForm({...kudosForm, badge: e.target.value as any})} className="w-full h-10 px-3 mt-1 bg-[#131B2E] border border-slate-700 text-white rounded-xl text-xs font-medium">
                      <option value="Star Performer" className="bg-[#0E131F]">⭐ Star Performer</option>
                      <option value="Team Player" className="bg-[#0E131F]">🤝 Team Player</option>
                      <option value="Problem Solver" className="bg-[#0E131F]">💡 Problem Solver</option>
                      <option value="Innovation Champion" className="bg-[#0E131F]">🚀 Innovation Champion</option>
                      <option value="Customer Delight" className="bg-[#0E131F]">❤️ Customer Delight</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-xs font-bold text-slate-300">Appreciation Message</Label>
                    <Input placeholder="Write a brief shoutout for their great work and collaboration..." value={kudosForm.message} onChange={e => setKudosForm({...kudosForm, message: e.target.value})} required className="bg-[#131B2E] border-slate-700 text-white placeholder:text-slate-500 rounded-xl text-xs mt-1" />
                  </div>
                  <div className="sm:col-span-3 flex justify-end">
                    <Button type="submit" disabled={isSubmittingKudos} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl h-10 px-6 text-xs gap-1.5 cursor-pointer">
                      {isSubmittingKudos ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Award className="h-4 w-4 mr-2 text-amber-300" />}
                      Send Kudos Badge
                    </Button>
                  </div>
                </form>
              </div>

              {/* Team Directory Grid */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Corporate Directory</h3>
                <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {team.length === 0 ? (
                    <div className="col-span-full py-12 bg-[#0E131F]/90 rounded-3xl border border-slate-800 shadow-xl text-center text-slate-400 font-light text-xs">Directory is currently updating.</div>
                  ) : (
                    team.map((m: any) => (
                      <motion.div variants={itemVariants} key={m.id} className="p-6 bg-[#0E131F]/90 border border-slate-800/80 rounded-3xl shadow-xl flex flex-col items-center text-center hover:border-indigo-500/50 transition-all duration-200">
                        <ProfileAvatar url={m.avatar_url} name={m.full_name} className="h-16 w-16 text-xl mb-3 ring-2 ring-indigo-500/30 shadow-lg" />
                        <h4 className="font-bold text-white text-sm">{m.full_name}</h4>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-full">{m.email}</div>
                        <div className="mt-3 text-[10px] font-bold px-2.5 py-0.5 bg-slate-900 border border-slate-700 text-slate-300 rounded-full uppercase tracking-wider">{m.role || "Team Member"}</div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ─── INTERVIEWS ─── */}
          {activeTab === "interviews" && (
            <motion.div {...pageVariants} className="space-y-6 max-w-7xl mx-auto">
              <div className="bg-[#0E131F]/90 rounded-3xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                    <Video className="h-5 w-5 text-indigo-400" /> Candidate Interviews &amp; Evaluation Desk
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Conduct candidate interviews, join video links, and submit official evaluations directly to the Super Admin hiring desk.</p>
                </div>
                <span className="bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-bold px-3 py-1.5 rounded-xl">
                  {assignedInterviews.length} Assigned
                </span>
              </div>

              {assignedInterviews.length === 0 ? (
                <div className="rounded-3xl border border-slate-800 bg-[#0E131F]/90 p-12 text-center text-slate-400 text-xs shadow-xl">
                  No interviews assigned to you currently. Any scheduled candidate interviews where you are the interviewer will appear here.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {assignedInterviews.map((app: any) => {
                    const hasSubmitted = !!app.interview_summary || !!app.interview_remarks;
                    const feedback = interviewsFeedback[app.id] || { summary: "", remarks: "" };
                    
                    return (
                      <div key={app.id} className="rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 p-6 shadow-xl space-y-4 hover:border-slate-700 transition-all">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h3 className="text-base font-bold text-white">{app.full_name}</h3>
                            <div className="text-xs font-medium text-slate-400 mt-0.5">{app.role_applied}</div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono bg-slate-900 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
                              REF: {app.id.slice(0, 8).toUpperCase()}
                            </span>
                            {hasSubmitted && (
                              <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                                Feedback Submitted
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs border-y border-slate-800 py-3">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Interview Time</span>
                            <span className="font-bold text-white mt-0.5 block">
                              {app.meeting_time ? new Date(app.meeting_time).toLocaleString() : "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Video Link</span>
                            {app.meet_link ? (
                              <a href={app.meet_link} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 font-bold mt-0.5 block truncate">
                                Join Video Call ↗
                              </a>
                            ) : (
                              <span className="text-slate-400 mt-0.5 block">—</span>
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Candidate Email</span>
                            <span className="text-slate-300 mt-0.5 block truncate font-mono">
                              {app.email}
                            </span>
                          </div>
                        </div>

                        {!hasSubmitted ? (
                          <div className="space-y-3 pt-2">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Submit Assessment &amp; Remarks</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor={`summary-${app.id}`} className="text-xs font-bold text-slate-300">Interview Summary / Topics Evaluated</Label>
                                <Textarea 
                                  id={`summary-${app.id}`}
                                  className="mt-1 text-xs bg-[#131B2E] border-slate-700 text-white rounded-xl placeholder:text-slate-500"
                                  rows={3}
                                  value={feedback.summary}
                                  onChange={(e) => setInterviewsFeedback({
                                    ...interviewsFeedback,
                                    [app.id]: { ...feedback, summary: e.target.value }
                                  })}
                                  placeholder="e.g. Evaluated coding skills, system design, communication and domain basics..."
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`remarks-${app.id}`} className="text-xs font-bold text-slate-300">Detailed Recommendation</Label>
                                <Textarea 
                                  id={`remarks-${app.id}`}
                                  className="mt-1 text-xs bg-[#131B2E] border-slate-700 text-white rounded-xl placeholder:text-slate-500"
                                  rows={3}
                                  value={feedback.remarks}
                                  onChange={(e) => setInterviewsFeedback({
                                    ...interviewsFeedback,
                                    [app.id]: { ...feedback, remarks: e.target.value }
                                  })}
                                  placeholder="e.g. Strongly recommended for Cohort selection. Good technical aptitude..."
                                />
                              </div>
                            </div>

                            <div className="flex justify-end pt-1">
                              <Button 
                                onClick={() => feedbackMut.mutate({ 
                                  applicationId: app.id, 
                                  summary: feedback.summary, 
                                  remarks: feedback.remarks 
                                })}
                                disabled={feedbackMut.isPending || !feedback.summary.trim() || !feedback.remarks.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs px-6 h-10 cursor-pointer"
                              >
                                {feedbackMut.isPending ? "Submitting..." : "Submit Remarks to Super Admin"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 space-y-2 text-xs">
                            <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Your Submitted Evaluation</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <span className="font-bold text-slate-300 block">Summary</span>
                                <p className="text-slate-400 mt-0.5 whitespace-pre-wrap">{app.interview_summary}</p>
                              </div>
                              <div>
                                <span className="font-bold text-slate-300 block">Remarks &amp; Recommendation</span>
                                <p className="text-slate-400 mt-0.5 whitespace-pre-wrap">{app.interview_remarks}</p>
                              </div>
                            </div>
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
              <div className="bg-[#0E131F]/90 rounded-3xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-indigo-400" /> Intern Support Resolver Panel
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Review ticket descriptions, update resolution notes, and trigger support sync video calls.</p>
                </div>
                <span className="bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-bold px-3 py-1.5 rounded-xl">
                  {assignedSupportQueries.length} Assigned
                </span>
              </div>

              <div className="bg-[#0E131F]/90 border border-slate-800/80 rounded-3xl shadow-xl backdrop-blur-xl overflow-hidden divide-y divide-slate-800/60">
                {assignedSupportQueries.length === 0 ? (
                  <div className="p-16 text-center text-slate-400 text-xs font-light">
                    <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30 text-indigo-400" />
                    No intern support queries assigned to you currently.
                  </div>
                ) : (
                  assignedSupportQueries.map((q: any) => {
                    const hasMeeting = q.meeting_id && q.meeting_status === "approved";
                    return (
                      <div key={q.id} className="p-5 hover:bg-slate-800/40 transition-colors flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-white">{q.subject}</span>
                              <span className="text-[10px] bg-purple-950/80 text-purple-300 px-2.5 py-0.5 rounded-full font-bold border border-purple-500/30">{q.category}</span>
                              <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                                q.status === 'resolved' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' :
                                q.status === 'assigned' ? 'bg-blue-950/80 text-blue-300 border border-blue-500/30' :
                                'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                              }`}>
                                {q.status.replace("_", " ")}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                              <span>Intern: <strong className="text-white">{q.intern?.full_name || "Assigned Intern"}</strong> ({q.intern?.email || ""})</span>
                              <span>•</span>
                              <span>Domain: <strong className="text-white capitalize">{q.intern?.department || "General"}</strong></span>
                            </div>

                            <p className="text-slate-300 text-xs leading-relaxed bg-slate-900/80 p-3 rounded-2xl border border-slate-800 mt-2">{q.description}</p>
                          </div>
                          
                          <div className="shrink-0 flex flex-col items-end gap-2">
                            <span className="text-[11px] text-slate-400 font-mono">{new Date(q.created_at).toLocaleDateString()}</span>
                            
                            {q.status !== "resolved" ? (
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                                  onClick={() => {
                                    setSelectedQueryToResolve(q);
                                    setProgressNotesInput(q.progress_notes || "");
                                  }}
                                >
                                  Resolve &amp; Update Notes
                                </Button>

                                {q.meeting_status !== "requested" && !q.meeting_id && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="rounded-xl text-xs border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/60 font-bold cursor-pointer"
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
                              <div className="text-xs text-emerald-300 font-bold bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                                ✓ Resolved
                              </div>
                            )}
                          </div>
                        </div>

                        {q.progress_notes && (
                          <div className="text-xs text-slate-400 border-t border-slate-800 pt-2 flex flex-col gap-0.5">
                            <span className="font-bold text-slate-300 text-[10px] uppercase">Active Resolution Notes:</span>
                            <p className="text-slate-400 italic">"{q.progress_notes}"</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {/* ─── MEETINGS ─── */}
          {activeTab === "meetings" && (
            <motion.div key="meetings" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0E131F]/90 p-6 rounded-3xl border border-slate-800/80 shadow-xl backdrop-blur-xl">
                <div className="space-y-1">
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <Video className="h-5 w-5 text-indigo-400" /> Meetings &amp; Video Syncs
                  </h2>
                  <p className="text-xs text-slate-400">
                    Host team syncs, 1-on-1 intern reviews, or sprint milestone discussions.
                  </p>
                </div>

                <Dialog open={meetingModalOpen} onOpenChange={setMeetingModalOpen}>
                  <Button 
                    size="sm" 
                    onClick={() => setMeetingModalOpen(true)}
                    className="gap-1.5 text-xs h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Schedule Meeting
                  </Button>

                  <DialogContent className="sm:max-w-lg bg-[#0F172A] border border-slate-700 text-white">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-white">
                        <Video className="h-5 w-5 text-indigo-400" /> Schedule Meeting
                      </DialogTitle>
                      <DialogDescription className="text-slate-400">
                        Set up a live meeting with dedicated start/end times and Google Calendar sync.
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleScheduleMeetingSubmit} className="space-y-3.5 py-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-300">Meeting Title / Topic</Label>
                        <Input 
                          required 
                          value={meetingForm.title} 
                          onChange={e => setMeetingForm({ ...meetingForm, title: e.target.value })} 
                          placeholder="e.g. Sprint Review & Code Walkthrough" 
                          className="rounded-xl text-xs bg-[#131B2E] border-slate-700 text-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-300">Agenda &amp; Discussion Details</Label>
                        <Input 
                          value={meetingForm.description} 
                          onChange={e => setMeetingForm({ ...meetingForm, description: e.target.value })} 
                          placeholder="e.g. Milestone progress and next deliverables." 
                          className="rounded-xl text-xs bg-[#131B2E] border-slate-700 text-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-300">Meeting Video Link (Google Meet)</Label>
                        <Input 
                          required 
                          type="url" 
                          value={meetingForm.meeting_link} 
                          onChange={e => setMeetingForm({ ...meetingForm, meeting_link: e.target.value })} 
                          placeholder="https://meet.google.com/xyz-abcd-efg" 
                          className="rounded-xl text-xs font-mono bg-[#131B2E] border-slate-700 text-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-300">Date</Label>
                          <Input 
                            required 
                            type="date" 
                            value={meetingForm.date} 
                            onChange={e => setMeetingForm({ ...meetingForm, date: e.target.value })} 
                            className="rounded-xl text-xs bg-[#131B2E] border-slate-700 text-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-300">From Time</Label>
                          <Input 
                            required 
                            type="time" 
                            value={meetingForm.from_time} 
                            onChange={e => setMeetingForm({ ...meetingForm, from_time: e.target.value })} 
                            className="rounded-xl text-xs bg-[#131B2E] border-slate-700 text-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-300">To Time</Label>
                          <Input 
                            required 
                            type="time" 
                            value={meetingForm.to_time} 
                            onChange={e => setMeetingForm({ ...meetingForm, to_time: e.target.value })} 
                            className="rounded-xl text-xs bg-[#131B2E] border-slate-700 text-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-300">Target Audience</Label>
                        <Select 
                          value={meetingForm.target_role} 
                          onValueChange={(v: any) => setMeetingForm({ ...meetingForm, target_role: v })}
                        >
                          <SelectTrigger className="rounded-xl text-xs bg-[#131B2E] border-slate-700 text-white"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[#0F172A] border-slate-700 text-white">
                            <SelectItem value="all">Everyone (Employees &amp; Interns)</SelectItem>
                            <SelectItem value="intern">Interns Only</SelectItem>
                            <SelectItem value="employee">Employees Only</SelectItem>
                            <SelectItem value="individual">Specific Person (Individual)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <DialogFooter className="pt-2">
                        <Button type="button" variant="ghost" onClick={() => setMeetingModalOpen(false)} className="text-slate-400 hover:text-white">Cancel</Button>
                        <Button 
                          type="submit" 
                          disabled={isSavingMeeting}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs"
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
              <div className="bg-[#0E131F]/90 rounded-3xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-xl">
                <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  <Bell className="h-5 w-5 text-indigo-400" /> Company News &amp; Broadcast Updates
                </h2>
                <p className="text-xs text-slate-400 mt-1">Official circulars, product releases, and corporate announcements.</p>
              </div>

              {announcements.length === 0 ? (
                <div className="p-16 bg-[#0E131F]/90 rounded-3xl border border-slate-800 shadow-xl text-center text-slate-400 text-xs font-light">
                  <Bell className="h-10 w-10 mx-auto mb-3 opacity-30 text-indigo-400" />
                  No news or announcements posted yet.
                </div>
              ) : (
                <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
                  {announcements.map((a: any) => (
                    <motion.div variants={itemVariants} key={a.id} className="p-6 bg-[#0E131F]/90 rounded-3xl border border-slate-800/80 shadow-xl hover:border-slate-700 transition-all space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{new Date(a.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 font-bold uppercase tracking-wider">
                          {a.source === "news" ? "News Bulletin" : "Announcement"}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white">{a.title}</h3>
                      <div className="text-xs text-slate-300 leading-relaxed">
                        <RichContentRenderer content={a.body || ""} />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ─── RESOURCES & LMS ─── */}
          {activeTab === "resources" && (
            <motion.div key="resources" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-7xl mx-auto space-y-6">
              <div className="bg-[#0E131F]/90 rounded-3xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-xl">
                <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-indigo-400" /> Knowledge Base &amp; LMS Learning Academy
                </h2>
                <p className="text-xs text-slate-400 mt-1">Official employee handbooks, security standards, and compliance certifications.</p>
              </div>

              {/* LMS Courses Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-indigo-400" /> Mandatory Compliance &amp; Certifications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: "Information Security & Data Privacy 2026", cat: "Mandatory Compliance", progress: 100, status: "Certified", badge: "🛡️ Security Champion" },
                    { title: "Workplace Ethics & Code of Conduct", cat: "HR Policy", progress: 100, status: "Certified", badge: "⚖️ Ethics Leader" },
                    { title: "Enterprise Cloud Architecture & Governance", cat: "Technical Certification", progress: 75, status: "In Progress", badge: "☁️ Tech Explorer" },
                    { title: "Agile Engineering & Development SOPs", cat: "Operations SOP", progress: 50, status: "In Progress", badge: "🚀 Agile Practitioner" },
                  ].map((c, i) => (
                    <div key={i} className="p-6 bg-[#0E131F]/90 border border-slate-800/80 rounded-3xl shadow-xl space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{c.cat}</span>
                          <h4 className="font-bold text-white text-sm mt-0.5">{c.title}</h4>
                        </div>
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${c.status === 'Certified' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 'bg-blue-950/80 text-blue-300 border border-blue-500/30'}`}>{c.status}</span>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-400">
                          <span>Completion</span>
                          <span className="text-emerald-400">{c.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-500 shadow-[0_0_8px_#10b981]" style={{ width: `${c.progress}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                        <span className="text-slate-400 font-medium">{c.badge}</span>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-400 hover:text-indigo-300 p-0 font-bold">
                          {c.status === 'Certified' ? "View Certificate ↗" : "Continue Course →"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── HELPDESK TICKETS ─── */}
          {activeTab === "support" && (
            <motion.div key="support" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-7xl mx-auto space-y-6">
              <div className="bg-[#0E131F]/90 rounded-3xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-xl">
                <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  <LifeBuoy className="h-5 w-5 text-indigo-400" /> IT &amp; Administrative Service Desk
                </h2>
                <p className="text-xs text-slate-400 mt-1">Submit internal helpdesk tickets for hardware allocation, software licenses, HR queries, or payroll adjustments.</p>
              </div>

              {/* Create Ticket Form */}
              <div className="bg-[#0E131F]/90 p-6 rounded-3xl border border-slate-800/80 shadow-xl backdrop-blur-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <LifeBuoy className="h-4 w-4 text-indigo-400" /> Raise New Ticket
                </h3>
                <form onSubmit={handleSubmitTicket} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-bold text-slate-300">Category</Label>
                      <select value={ticketForm.category} onChange={e => setTicketForm({...ticketForm, category: e.target.value as any})} className="w-full h-10 px-3 mt-1 bg-[#131B2E] border border-slate-700 text-white rounded-xl text-xs font-medium">
                        <option value="IT Support" className="bg-[#0E131F]">IT Support (Hardware/Software)</option>
                        <option value="HR Inquiry" className="bg-[#0E131F]">HR Inquiry (Policies/Verification)</option>
                        <option value="Payroll & Finance" className="bg-[#0E131F]">Payroll &amp; Finance (Salary/Tax)</option>
                        <option value="Admin & Workplace" className="bg-[#0E131F]">Admin &amp; Workplace (Access/Badge)</option>
                        <option value="Other" className="bg-[#0E131F]">Other Query</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-300">Priority</Label>
                      <select value={ticketForm.priority} onChange={e => setTicketForm({...ticketForm, priority: e.target.value as any})} className="w-full h-10 px-3 mt-1 bg-[#131B2E] border border-slate-700 text-white rounded-xl text-xs font-medium">
                        <option value="Low" className="bg-[#0E131F]">Low</option>
                        <option value="Medium" className="bg-[#0E131F]">Medium</option>
                        <option value="High" className="bg-[#0E131F]">High</option>
                        <option value="Urgent" className="bg-[#0E131F]">Urgent (Blocker)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-300">Subject</Label>
                    <Input placeholder="Short summary of the issue..." value={ticketForm.subject} onChange={e => setTicketForm({...ticketForm, subject: e.target.value})} required className="bg-[#131B2E] border-slate-700 text-white placeholder:text-slate-500 rounded-xl mt-1 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-300">Detailed Description</Label>
                    <Textarea rows={3} placeholder="Provide details, error messages, or requested items..." value={ticketForm.description} onChange={e => setTicketForm({...ticketForm, description: e.target.value})} required className="bg-[#131B2E] border-slate-700 text-white placeholder:text-slate-500 rounded-xl mt-1 resize-none text-xs" />
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button type="submit" disabled={isSubmittingTicket} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl h-10 px-6 text-xs cursor-pointer">
                      {isSubmittingTicket ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                      Submit Ticket
                    </Button>
                  </div>
                </form>
              </div>

              {/* My Support Tickets List */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">My Active Tickets</h3>
                {tickets.length === 0 ? (
                  <div className="py-12 bg-[#0E131F]/90 rounded-3xl border border-slate-800 shadow-xl text-center text-slate-400 text-xs font-light">No support tickets raised yet.</div>
                ) : (
                  tickets.map((ticket: any) => (
                    <div key={ticket.id} className="p-5 bg-[#0E131F]/90 border border-slate-800/80 rounded-2xl shadow-xl space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-full text-slate-300">#{ticket.id.slice(0, 8).toUpperCase()}</span>
                            <h4 className="font-bold text-white text-xs">{ticket.subject}</h4>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">{ticket.category} • Priority: <span className="font-bold text-slate-200">{ticket.priority}</span> • Raised {new Date(ticket.created_at).toLocaleDateString()}</div>
                        </div>
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${ticket.status === 'open' ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'}`}>{ticket.status}</span>
                      </div>
                      <p className="text-xs text-slate-300 font-normal">{ticket.description}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ─── DOCUMENT LOCKER ─── */}
          {activeTab === "locker" && (
            <motion.div key="locker" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-7xl mx-auto space-y-6">
              <div className="bg-[#0E131F]/90 rounded-3xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-xl">
                <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-indigo-400" /> Digital Document Vault
                </h2>
                <p className="text-xs text-slate-400 mt-1">Verified records, compliance documents, and signed offer credentials.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "National ID / Aadhaar / PAN Card", category: "Government ID Proof", status: "Verified", date: "2026-01-15" },
                  { name: "Passport / Identity & Residency", category: "Identity Proof", status: "Verified", date: "2026-01-15" },
                  { name: "Degree & Professional Certifications", category: "Academic Credentials", status: "Verified", date: "2026-01-16" },
                  { name: "Signed Employment Agreement & NDA", category: "Legal & Corporate", status: "Verified", date: "2026-01-10" },
                  { name: "Form 16 / Tax Declaration Proofs", category: "Payroll & Tax", status: "Verified", date: "2026-03-01" },
                ].map((doc, idx) => (
                  <div key={idx} className="p-5 bg-[#0E131F]/90 border border-slate-800/80 rounded-2xl shadow-xl flex items-center justify-between hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-3.5">
                      <div className="h-10 w-10 rounded-2xl bg-indigo-950/80 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                        <FileCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">{doc.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{doc.category} • {doc.date}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">{doc.status}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── PROFILE & ESS ─── */}
          {activeTab === "contact" && (
            <motion.div key="contact" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-7xl mx-auto space-y-6">
              <div className="bg-[#0E131F]/90 rounded-3xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-xl">
                <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-indigo-400" /> Employee Profile &amp; Self-Service (ESS)
                </h2>
                <p className="text-xs text-slate-400 mt-1">Manage personal contact info, bank details, and view your official smart NFC identity badge.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Digital ID Badge */}
                <div className="md:col-span-1 p-6 bg-gradient-to-b from-[#0F172A] to-[#0A0E1A] text-white rounded-3xl shadow-2xl flex flex-col items-center text-center relative overflow-hidden border border-slate-700">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-emerald-400" />
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-3">
                    <Radio className="h-3 w-3 animate-pulse" /> NFC Active
                  </div>

                  <ProfileAvatar url={profile?.avatar_url} name={displayName} className="h-20 w-20 text-2xl mb-2 ring-4 ring-indigo-500/40 shadow-lg" />
                  <h3 className="font-extrabold text-base text-white">{displayName}</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mt-0.5">{profile?.position || "Operations & Engineering"}</p>
                  <p className="text-[11px] text-emerald-400 font-mono mt-0.5">ID: {session?.user?.id?.slice(0, 8).toUpperCase()}</p>
                  
                  <div className="p-3 bg-white rounded-2xl my-4 shadow-md">
                    <QRCodeSVG value={`VY-EMP-${session?.user?.id}`} size={105} />
                  </div>
                  
                  <Button onClick={() => setIsIdCardOpen(true)} className="w-full text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-1.5 font-bold shadow-md cursor-pointer">
                    <Cpu className="h-3.5 w-3.5" /> View Smart Badge
                  </Button>
                </div>

                {/* ESS Personal Information Form */}
                <div className="md:col-span-2 p-6 bg-[#0E131F]/90 border border-slate-800/80 rounded-3xl shadow-xl backdrop-blur-xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Personal &amp; Banking Records</h3>
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
                  }} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-bold text-slate-300">Full Name</Label>
                        <Input value={displayName} disabled className="bg-slate-900 border-slate-700 text-slate-300 rounded-xl mt-1 text-xs font-bold" />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-300">Work Email</Label>
                        <Input value={email} disabled className="bg-slate-900 border-slate-700 text-slate-300 rounded-xl mt-1 text-xs font-mono" />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-300">Phone Number</Label>
                        <Input placeholder="+91 98765 43210" defaultValue={profile?.phone || ""} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="bg-[#131B2E] border-slate-700 text-white placeholder:text-slate-500 rounded-xl mt-1 text-xs" />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-300">Emergency Contact</Label>
                        <Input placeholder="Name & Phone Number" defaultValue={profile?.emergency_contact || "+91 98765 00000"} onChange={e => setProfileForm({...profileForm, emergency_contact: e.target.value})} className="bg-[#131B2E] border-slate-700 text-white placeholder:text-slate-500 rounded-xl mt-1 text-xs" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-300">Residential Address</Label>
                      <Input placeholder="Current residential address..." defaultValue={profile?.address || ""} onChange={e => setProfileForm({...profileForm, address: e.target.value})} className="bg-[#131B2E] border-slate-700 text-white placeholder:text-slate-500 rounded-xl mt-1 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-300">Bank Account &amp; IFSC / UPI Details</Label>
                      <Input placeholder="HDFC Bank · A/C ****8821 · IFSC: HDFC0001234" defaultValue={profile?.bank_details || "Kotak Mahindra Bank · A/C 882101923 · IFSC: KKBK0001823"} onChange={e => setProfileForm({...profileForm, bank_details: e.target.value})} className="bg-[#131B2E] border-slate-700 text-white placeholder:text-slate-500 rounded-xl mt-1 text-xs font-mono" />
                    </div>
                    <div className="flex justify-end pt-1">
                      <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl px-6 text-xs h-10 cursor-pointer">Save Profile Changes</Button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── SECURITY & OFFBOARDING ─── */}
          {activeTab === "security" && (
            <motion.div key="security" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-7xl mx-auto space-y-6">
              <div className="bg-[#0E131F]/90 rounded-3xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-xl">
                <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-indigo-400" /> Security, Credentials &amp; 2FA
                </h2>
                <p className="text-xs text-slate-400 mt-1">Manage portal credentials, configure Two-Factor Authentication, and check clearance status.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Change Password Card */}
                <div className="p-6 bg-[#0E131F]/90 border border-slate-800/80 rounded-3xl shadow-xl backdrop-blur-xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Change Portal Password</h3>
                  
                  <form onSubmit={handleChangePassword} className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-300">New Password</Label>
                      <Input type="password" required minLength={6} value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="bg-[#131B2E] border-slate-700 text-white rounded-xl text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-300">Confirm New Password</Label>
                      <Input type="password" required minLength={6} value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} className="bg-[#131B2E] border-slate-700 text-white rounded-xl text-xs" />
                    </div>
                    <Button type="submit" disabled={isChangingPassword} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl h-10 text-xs cursor-pointer">
                      {isChangingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </div>

                {/* MFA / 2FA Card */}
                <div className="p-6 bg-[#0E131F]/90 border border-slate-800/80 rounded-3xl shadow-xl backdrop-blur-xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Two-Factor Authentication (2FA)</h3>
                  
                  {mfaStatus === "checking" ? (
                    <div className="text-xs text-slate-400 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Checking security status...</div>
                  ) : mfaStatus === "enrolled" ? (
                    <div className="space-y-4">
                      <div className="bg-emerald-950/80 text-emerald-300 p-4 rounded-2xl border border-emerald-500/30 flex flex-col gap-1 text-xs">
                        <div className="font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" /> 2FA Protection Active
                        </div>
                        <p className="text-slate-400 font-normal">Your account is secured with a TOTP Authenticator app.</p>
                      </div>
                      <Button onClick={handleDisableMfa} variant="outline" className="w-full rounded-2xl border-rose-500/30 text-rose-400 hover:bg-rose-950/40 text-xs font-bold">Disable 2FA</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-400 font-normal">Enable Two-Factor Authentication with Google Authenticator or Microsoft Authenticator for enterprise security.</p>
                      <Button onClick={handleEnrollMfa} className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 cursor-pointer">Set up Authenticator App</Button>
                    </div>
                  )}
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

      {/* ─── BIOMETRIC FINGERPRINT AUTHENTICATION MODAL ─── */}
      <AnimatePresence>
        {isBiometricModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
              onClick={() => setIsBiometricModalOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="relative w-full max-w-md bg-[#0F172A] border border-slate-700 rounded-3xl shadow-2xl p-8 z-10 overflow-hidden text-center"
            >
              {/* Top ambient glow */}
              <div className={`absolute top-0 inset-x-0 h-1.5 transition-colors duration-500 ${
                biometricState === 'success' ? 'bg-gradient-to-r from-emerald-400 to-teal-300' :
                biometricState === 'error' ? 'bg-gradient-to-r from-rose-500 to-amber-500' :
                'bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400'
              }`} />

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-950/60 border border-indigo-500/30 px-3 py-1 rounded-full">
                  <ShieldCheck className="h-3.5 w-3.5" /> Biometric Security Guard
                </div>
                <button 
                  onClick={() => setIsBiometricModalOpen(false)} 
                  className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              <h3 className="text-xl font-black tracking-tight text-white mb-1">
                {biometricActionType === 'in' ? 'Shift Clock-In Verification' : 'Shift Clock-Out Verification'}
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Touch your device's biometric fingerprint sensor or tap the sensor pad below to verify your shift attendance.
              </p>

              {/* Interactive Biometric Sensor Pad */}
              <div className="relative my-6 flex flex-col items-center justify-center">
                <button
                  type="button"
                  onClick={() => completeBiometricScan(biometricActionType)}
                  disabled={biometricState === 'verifying' || biometricState === 'success'}
                  className={`relative group cursor-pointer p-8 rounded-full border-2 transition-all duration-500 ${
                    biometricState === 'success' 
                      ? 'bg-emerald-950/60 border-emerald-400 shadow-[0_0_50px_rgba(52,211,153,0.35)] scale-105' 
                      : biometricState === 'error'
                      ? 'bg-rose-950/60 border-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.35)]'
                      : 'bg-slate-900/90 border-indigo-500/60 hover:border-indigo-400 shadow-[0_0_40px_rgba(99,102,241,0.25)] hover:scale-105 active:scale-95'
                  }`}
                >
                  {/* Pulsing ring animation */}
                  {biometricState === 'scanning' && (
                    <div className="absolute inset-0 rounded-full border border-indigo-400/40 animate-ping" />
                  )}

                  <Fingerprint className={`h-20 w-20 transition-all duration-300 ${
                    biometricState === 'success' ? 'text-emerald-400 scale-110' :
                    biometricState === 'error' ? 'text-rose-400' :
                    biometricState === 'verifying' ? 'text-indigo-300 animate-pulse' :
                    'text-indigo-400 group-hover:text-indigo-300'
                  }`} />
                </button>

                <p className="mt-5 text-xs font-bold text-slate-200">
                  {biometricMessage}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Touch sensor icon above or accept system biometric prompt
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-[10px]">ENCLAVE: HARDWARE_KEY</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsBiometricModalOpen(false)} 
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Assignment Modal */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsTaskModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-lg bg-[#0F172A] border border-slate-700 rounded-3xl shadow-2xl p-8 z-10 overflow-hidden text-white">
              <h3 className="text-xl font-bold tracking-tight text-white mb-1">Assign Task</h3>
              <p className="text-slate-400 text-xs mb-5">
                Assign tasks to 1 intern, multiple selected interns, or all allocated mentees in 1 click.
              </p>
              
              <div className="space-y-4">
                {/* Target Scope Switcher (1, Multiple, ALL) */}
                <div>
                  <Label className="text-xs uppercase tracking-wider text-slate-300 font-bold mb-1.5 block">
                    Assign Target Scope
                  </Label>
                  <div className="grid grid-cols-3 gap-2 bg-[#131B2E] p-1.5 rounded-2xl border border-slate-700">
                    <button
                      type="button"
                      onClick={() => {
                        setAssignScope("single");
                        if (!targetInternId && myInterns.length > 0) {
                          setTargetInternId(myInterns[0].id);
                        }
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        assignScope === "single"
                          ? "bg-indigo-600 text-white shadow-md"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <User className="h-3.5 w-3.5" /> 1 Intern
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAssignScope("multiple");
                        if (selectedInterns.length === 0 && myInterns.length > 0) {
                          setSelectedInterns(myInterns.slice(0, Math.min(2, myInterns.length)).map((i: any) => i.id));
                        }
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        assignScope === "multiple"
                          ? "bg-emerald-600 text-white shadow-md"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Users className="h-3.5 w-3.5" /> Multiple ({selectedInterns.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setAssignScope("all")}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        assignScope === "all"
                          ? "bg-purple-600 text-white shadow-md"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5" /> ALL ({myInterns.length})
                    </button>
                  </div>
                </div>

                {/* Scope-specific Target Controls */}
                {assignScope === "single" && myInterns.length > 0 && (
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-slate-300 font-bold mb-1.5 block">Select Target Intern</Label>
                    <select
                      value={targetInternId || (myInterns[0]?.id || "")}
                      onChange={(e) => setTargetInternId(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-[#131B2E] text-white px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {myInterns.map((i: any) => (
                        <option key={i.id} value={i.id} className="bg-[#0F172A]">
                          {i.full_name} ({i.email}) {i.sub_domain ? `• Sub-domain: ${i.sub_domain}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {assignScope === "multiple" && myInterns.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs uppercase tracking-wider text-slate-300 font-bold block">Select Target Interns ({selectedInterns.length} selected)</Label>
                      <button
                        type="button"
                        onClick={() => setSelectedInterns(selectedInterns.length === myInterns.length ? [] : myInterns.map((i: any) => i.id))}
                        className="text-[11px] text-indigo-400 hover:underline font-semibold"
                      >
                        {selectedInterns.length === myInterns.length ? "Deselect All" : "Select All"}
                      </button>
                    </div>
                    <div className="max-h-36 overflow-y-auto bg-[#131B2E] border border-slate-700 rounded-2xl p-2.5 space-y-1.5">
                      {myInterns.map((i: any) => (
                        <label key={i.id} className="flex items-center justify-between p-2 hover:bg-slate-800/60 rounded-xl cursor-pointer text-xs">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedInterns.includes(i.id)}
                              onChange={(e) => setSelectedInterns(prev => e.target.checked ? [...prev, i.id] : prev.filter(id => id !== i.id))}
                              className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span className="font-bold text-white">{i.full_name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{i.sub_domain || i.department || i.email}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {assignScope === "all" && (
                  <div className="p-3 bg-purple-950/60 border border-purple-500/30 rounded-2xl flex items-center gap-3 text-xs text-purple-200">
                    <Sparkles className="h-5 w-5 text-purple-400 shrink-0" />
                    <div>
                      <div className="font-bold">1-Click Global Assignment for All Mentees</div>
                      <div className="text-[11px] text-purple-300/80">This sprint task will be simultaneously assigned to all {myInterns.length} assigned interns in 1 click.</div>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-xs uppercase tracking-wider text-slate-300 font-bold mb-1.5 block">Task Title</Label>
                  <Input placeholder="E.g., Complete UI mockups" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="rounded-xl bg-[#131B2E] border-slate-700 text-white placeholder:text-slate-500" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-slate-300 font-bold mb-1.5 block">Description</Label>
                  <Textarea placeholder="Provide task details..." value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} className="min-h-[100px] rounded-xl bg-[#131B2E] border-slate-700 text-white placeholder:text-slate-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-slate-300 font-bold mb-1.5 block">Due Date (Optional)</Label>
                    <Input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} className="rounded-xl bg-[#131B2E] border-slate-700 text-white" />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-slate-300 font-bold mb-1.5 block">Priority</Label>
                    <select 
                      value={taskPriority} 
                      onChange={(e) => setTaskPriority(e.target.value as "low"|"medium"|"high")}
                      className="w-full rounded-xl border border-slate-700 bg-[#131B2E] text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="low" className="bg-[#0F172A]">Low</option>
                      <option value="medium" className="bg-[#0F172A]">Medium</option>
                      <option value="high" className="bg-[#0F172A]">High</option>
                    </select>
                  </div>
                </div>

                {/* Additional Document & Template Links */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-slate-300 font-bold mb-1.5 block">Task Handbook / Guide URL (Optional)</Label>
                    <Input placeholder="https://docs.google.com/document/d/... or PDF URL" value={taskDocUrl} onChange={(e) => setTaskDocUrl(e.target.value)} className="rounded-xl bg-[#131B2E] border-slate-700 text-white placeholder:text-slate-500 text-xs" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-slate-300 font-bold mb-1.5 block">Task Report Template URL</Label>
                      <Input placeholder="https://docs.google.com/document/..." value={reportTemplateUrl} onChange={(e) => setReportTemplateUrl(e.target.value)} className="rounded-xl bg-[#131B2E] border-slate-700 text-white placeholder:text-slate-500 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-slate-300 font-bold mb-1.5 block">PPT Presentation URL</Label>
                      <Input placeholder="https://docs.google.com/presentation/..." value={pptTemplateUrl} onChange={(e) => setPptTemplateUrl(e.target.value)} className="rounded-xl bg-[#131B2E] border-slate-700 text-white placeholder:text-slate-500 text-xs" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-slate-300 font-bold mb-1.5 block">Project Files / Specs URL</Label>
                      <Input placeholder="https://github.com/... or Google Drive" value={taskFileUrl} onChange={(e) => setTaskFileUrl(e.target.value)} className="rounded-xl bg-[#131B2E] border-slate-700 text-white placeholder:text-slate-500 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-slate-300 font-bold mb-1.5 block">Google Meet Link</Label>
                      <Input placeholder="https://meet.google.com/..." value={taskMeetLink} onChange={(e) => setTaskMeetLink(e.target.value)} className="rounded-xl bg-[#131B2E] border-slate-700 text-white placeholder:text-slate-500 text-xs" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsTaskModalOpen(false)} className="rounded-xl text-slate-400 hover:text-white">Cancel</Button>
                <Button 
                  onClick={submitAssignTask} 
                  disabled={assignTaskMutation.isPending}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  {assignTaskMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Assign Task
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── EDIT ASSIGNED TASK & DOC LINKS MODAL ─── */}
      <Dialog open={editTaskModalOpen} onOpenChange={setEditTaskModalOpen}>
        <DialogContent className="sm:max-w-lg bg-[#0F172A] border border-slate-700 text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <ClipboardList className="h-5 w-5 text-indigo-400" />
              Edit Task &amp; Document Links
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Update task description, deadline, report URL, handbook guide, PPT file, and project links.
            </DialogDescription>
          </DialogHeader>

          {editingTask && (
            <form onSubmit={handleEditTaskSubmit} className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-slate-300 font-bold block">Task Title</Label>
                <Input
                  required
                  value={editingTask.title || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="rounded-xl bg-[#131B2E] border-slate-700 text-white text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-slate-300 font-bold block">Description</Label>
                <Textarea
                  rows={2}
                  value={editingTask.description || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="rounded-xl bg-[#131B2E] border-slate-700 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-slate-300 font-bold block">Priority</Label>
                  <select
                    value={editingTask.priority || "medium"}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-[#131B2E] text-white p-2.5 text-xs font-semibold outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-slate-300 font-bold block">Due Date</Label>
                  <Input
                    type="date"
                    value={editingTask.due_date ? editingTask.due_date.split("T")[0] : ""}
                    onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                    className="rounded-xl bg-[#131B2E] border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-slate-300 font-bold block">Task Handbook / Guide URL</Label>
                  <Input
                    placeholder="https://docs.google.com/document/d/..."
                    value={editingTask.task_doc_url || ""}
                    onChange={(e) => setEditingTask({ ...editingTask, task_doc_url: e.target.value })}
                    className="rounded-xl bg-[#131B2E] border-slate-700 text-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-slate-300 font-bold block">Task Report Template URL</Label>
                    <Input
                      placeholder="https://docs.google.com/document/..."
                      value={editingTask.report_template_url || ""}
                      onChange={(e) => setEditingTask({ ...editingTask, report_template_url: e.target.value })}
                      className="rounded-xl bg-[#131B2E] border-slate-700 text-white text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-slate-300 font-bold block">PPT Presentation URL</Label>
                    <Input
                      placeholder="https://docs.google.com/presentation/..."
                      value={editingTask.ppt_template_url || ""}
                      onChange={(e) => setEditingTask({ ...editingTask, ppt_template_url: e.target.value })}
                      className="rounded-xl bg-[#131B2E] border-slate-700 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-slate-300 font-bold block">Project Files / Specs URL</Label>
                    <Input
                      placeholder="https://github.com/... or Drive"
                      value={editingTask.task_file_url || ""}
                      onChange={(e) => setEditingTask({ ...editingTask, task_file_url: e.target.value })}
                      className="rounded-xl bg-[#131B2E] border-slate-700 text-white text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-slate-300 font-bold block">Google Meet Link</Label>
                    <Input
                      placeholder="https://meet.google.com/..."
                      value={editingTask.task_meet_link || ""}
                      onChange={(e) => setEditingTask({ ...editingTask, task_meet_link: e.target.value })}
                      className="rounded-xl bg-[#131B2E] border-slate-700 text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-800">
                <Button type="button" variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => setEditTaskModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdatingTask} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md">
                  {isUpdatingTask ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  Save Task &amp; Doc Links
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Intern Attendance Modal */}
      <AnimatePresence>
        {isAttendanceModalOpen && viewingIntern && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsAttendanceModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-2xl bg-[#0F172A] border border-slate-700 rounded-3xl shadow-2xl p-8 z-10 overflow-hidden max-h-[85vh] flex flex-col text-white">
              <div className="flex items-center gap-4 mb-6">
                <ProfileAvatar url={viewingIntern.avatar_url} name={viewingIntern.full_name} className="h-12 w-12 rounded-xl ring-2 ring-indigo-500/40" />
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-white">{viewingIntern.full_name}'s Attendance</h3>
                  <p className="text-slate-400 text-xs font-mono">{viewingIntern.email}</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto min-h-[300px] border border-slate-800 rounded-2xl bg-slate-900/60">
                {isLoadingMenteeAttendance ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                  </div>
                ) : viewingInternAttendance.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 font-light p-8 text-center text-xs">
                    No attendance records found for this intern.
                  </div>
                ) : (
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900 text-slate-400 font-bold sticky top-0 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Clock In</th>
                        <th className="px-6 py-4">Clock Out</th>
                        <th className="px-6 py-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {viewingInternAttendance.map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4 font-bold text-white">{log.date}</td>
                          <td className="px-6 py-4 text-slate-300 font-mono">
                            {log.clock_in ? new Date(log.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                          </td>
                          <td className="px-6 py-4 text-slate-300 font-mono">
                            {log.clock_out ? new Date(log.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              log.clock_out ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
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
                <Button variant="ghost" onClick={() => setIsAttendanceModalOpen(false)} className="rounded-xl text-slate-400 hover:text-white bg-slate-900 px-6 text-xs">Close</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MENTEE DIRECT COMMUNICATION & CONTACT MODAL ─── */}
      <AnimatePresence>
        {isContactInternModalOpen && contactingIntern && (() => {
          const urls = getInternContactUrls(contactingIntern);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-black/80 backdrop-blur-md" 
                onClick={() => setIsContactInternModalOpen(false)} 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 15 }} 
                className="relative w-full max-w-xl bg-[#0F172A] border border-slate-700 rounded-3xl shadow-2xl p-6 sm:p-8 z-10 overflow-hidden max-h-[90vh] flex flex-col text-white"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                  <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-950/80 border border-indigo-500/30 px-3 py-1 rounded-full">
                    <MessageSquare className="h-3.5 w-3.5" /> Mentee Communication Hub
                  </div>
                  <button 
                    onClick={() => setIsContactInternModalOpen(false)} 
                    className="text-slate-400 hover:text-white text-xs font-bold px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Intern Profile Summary */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-4 mb-5 shadow-inner">
                  <ProfileAvatar url={contactingIntern.avatar_url} name={contactingIntern.full_name} className="h-12 w-12 rounded-2xl ring-2 ring-indigo-500/40" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-white text-sm truncate">{contactingIntern.full_name}</h3>
                    <div className="text-xs text-slate-400 font-mono truncate">{contactingIntern.email}</div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                      <span>Department: <strong className="text-slate-200">{contactingIntern.department || "Technology & Software"}</strong></span>
                      <span>•</span>
                      <span>Sub-Domain: <strong className="text-amber-300 font-bold">{contactingIntern.sub_domain || contactingIntern.subdomain || "Full Stack Web Development"}</strong></span>
                      {contactingIntern.phone && (
                        <>
                          <span>•</span>
                          <span>Phone: <strong className="text-indigo-300 font-mono">{contactingIntern.phone}</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Action Channels */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                  {/* Phone Call */}
                  <div className="p-4 rounded-2xl bg-[#131B2E] border border-slate-700/80 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold mb-1">
                        <Phone className="h-4 w-4" /> Direct Call
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {contactingIntern.phone ? contactingIntern.phone : "No phone provided"}
                      </p>
                    </div>
                    {urls.callUrl ? (
                      <a 
                        href={urls.callUrl} 
                        className="w-full text-center py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Phone className="h-3.5 w-3.5" /> Contact Now
                      </a>
                    ) : (
                      <Button disabled variant="outline" size="sm" className="w-full text-xs opacity-50 rounded-xl">
                        Unavailable
                      </Button>
                    )}
                  </div>

                  {/* WhatsApp */}
                  <div className="p-4 rounded-2xl bg-[#131B2E] border border-slate-700/80 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-1">
                        <MessageSquare className="h-4 w-4" /> WhatsApp
                      </div>
                      <p className="text-[11px] text-slate-400">With official company signature</p>
                    </div>
                    {urls.waUrl ? (
                      <a 
                        href={urls.waUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-full text-center py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> WhatsApp Now
                      </a>
                    ) : (
                      <Button 
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(urls.waText);
                          toast.success("WhatsApp message copied to clipboard!");
                        }}
                        className="w-full text-xs font-bold bg-emerald-700 hover:bg-emerald-600 rounded-xl"
                      >
                        Copy Text
                      </Button>
                    )}
                  </div>

                  {/* Email */}
                  <div className="p-4 rounded-2xl bg-[#131B2E] border border-slate-700/80 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold mb-1">
                        <Mail className="h-4 w-4" /> Email Client
                      </div>
                      <p className="text-[11px] text-slate-400">Pre-filled mentorship memo</p>
                    </div>
                    {urls.emailUrl ? (
                      <a 
                        href={urls.emailUrl} 
                        className="w-full text-center py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Mail className="h-3.5 w-3.5" /> Email Now
                      </a>
                    ) : (
                      <Button disabled variant="outline" size="sm" className="w-full text-xs opacity-50 rounded-xl">
                        Unavailable
                      </Button>
                    )}
                  </div>
                </div>

                {/* Live Message & Official Regards Preview */}
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>Message Body &amp; Corporate Signature</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(urls.waText);
                        toast.success("Message & signature copied to clipboard!");
                      }}
                      className="h-7 text-[11px] text-indigo-400 hover:text-indigo-300 p-0 font-bold"
                    >
                      Copy Full Message 📋
                    </Button>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans select-all whitespace-pre-wrap shadow-inner max-h-[160px] overflow-y-auto">
                    {urls.waText}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-[10px]">ORGANIZATION: VYNTYRA CONSULTANCY SERVICES</span>
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsContactInternModalOpen(false)} 
                    className="rounded-xl text-slate-400 hover:text-white bg-slate-900 px-5 text-xs"
                  >
                    Done
                  </Button>
                </div>
              </motion.div>
            </div>
          );
        })()}
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
                        <div className="bg-white border p-3.5 rounded-xl text-xs space-y-3 shadow-2xs">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="truncate text-slate-700">
                              <strong className="text-slate-900">Submitted Deliverable:</strong>{" "}
                              <a href={task.deliverable_url} target="_blank" rel="noreferrer" className="text-blue-600 font-mono underline ml-1 hover:text-blue-800">
                                {task.deliverable_url}
                              </a>
                            </div>
                            <Badge className={`text-[10px] font-bold ${
                              task.status === "completed" 
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200" 
                                : task.mentor_verification_status === "mentor_verified"
                                ? "bg-purple-100 text-purple-800 border-purple-200"
                                : "bg-blue-100 text-blue-800 border-blue-200"
                            }`}>
                              {task.status === "completed" 
                                ? "✓ Completed & Finalized by Admin" 
                                : task.mentor_verification_status === "mentor_verified"
                                ? "⭐ Mentor Verified (Awaiting Admin Points)"
                                : "Deliverable Ready for Mentor Review"}
                            </Badge>
                          </div>

                          {task.progress_notes && (
                            <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border">
                              <span className="font-semibold text-slate-700">Intern Submission Note:</span> {task.progress_notes}
                            </div>
                          )}

                          {task.mentor_report && (
                            <div className="text-[11px] text-purple-900 bg-purple-50/80 p-2.5 rounded-lg border border-purple-200 space-y-1">
                              <div className="font-bold flex items-center justify-between">
                                <span>⭐ Mentor Verification Report ({task.mentor_rating || 5}/5):</span>
                                <span className="text-[10px] text-purple-700 font-bold">Rec: +{task.mentor_recommended_credits || task.credits || 10} Credits</span>
                              </div>
                              <p className="italic">"{task.mentor_report}"</p>
                            </div>
                          )}

                          {task.admin_remarks && (
                            <div className="text-[11px] text-emerald-800 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200">
                              <span className="font-semibold">Admin Final Remarks:</span> {task.admin_remarks}
                            </div>
                          )}

                          {task.status !== "completed" && (
                            <div className="flex items-center gap-2 pt-1 border-t flex-wrap">
                              <Button
                                size="sm"
                                className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5 shadow-2xs rounded-lg"
                                onClick={() => {
                                  setMentorVerifyTask(task);
                                  setMentorReportText(task.mentor_report || "");
                                  setMentorRating(task.mentor_rating || 5);
                                  setMentorRecommendedCredits(task.mentor_recommended_credits || task.credits || 10);
                                  setMentorStatus("verified");
                                }}
                              >
                                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                                🔍 Verify &amp; Submit Mentor Report
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs text-amber-700 border-amber-300 hover:bg-amber-50 font-semibold rounded-lg"
                                onClick={() => {
                                  setMentorVerifyTask(task);
                                  setMentorReportText(task.mentor_report || "");
                                  setMentorRating(task.mentor_rating || 3);
                                  setMentorRecommendedCredits(task.credits || 5);
                                  setMentorStatus("needs_revision");
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

      {/* ── Mentor Verification Report Dialog ── */}
      {mentorVerifyTask && (
        <Dialog open={!!mentorVerifyTask} onOpenChange={(open) => !open && setMentorVerifyTask(null)}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                Mentor Task Verification Report
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Evaluate deliverables submitted by your allocated intern. Your assessment report and recommended credits will be routed to Admin for final authorization.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmittingMentorReport(true);
                try {
                  await doSubmitMentorReport({
                    data: {
                      taskId: mentorVerifyTask.id,
                      mentor_report: mentorReportText.trim(),
                      mentor_rating: Number(mentorRating),
                      mentor_recommended_credits: Number(mentorRecommendedCredits),
                      status: mentorStatus,
                    },
                  });
                  toast.success("Mentor evaluation report submitted to Directorate Admin!");
                  setMentorVerifyTask(null);
                  if (selectedInternForTasks) {
                    loadInternTasks(selectedInternForTasks.id);
                  }
                  qc.invalidateQueries({ queryKey: ["admin-intern-tasks"] });
                } catch (err: any) {
                  toast.error(err.message || "Failed to submit mentor verification report");
                } finally {
                  setIsSubmittingMentorReport(false);
                }
              }}
              className="space-y-4 pt-2 text-xs"
            >
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 text-xs">{mentorVerifyTask.title}</span>
                {mentorVerifyTask.deliverable_url && (
                  <div className="text-[11px] truncate">
                    <span className="text-slate-500">Deliverable Link: </span>
                    <a href={mentorVerifyTask.deliverable_url} target="_blank" rel="noreferrer" className="text-indigo-600 font-mono underline">
                      {mentorVerifyTask.deliverable_url}
                    </a>
                  </div>
                )}
              </div>

              {/* Status Recommendation */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Verification Outcome</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMentorStatus("verified")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      mentorStatus === "verified"
                        ? "bg-emerald-50 border-emerald-400 text-emerald-800 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Verified (Recommend Approval)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMentorStatus("needs_revision")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      mentorStatus === "needs_revision"
                        ? "bg-amber-50 border-amber-400 text-amber-800 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <RotateCcw className="h-4 w-4 text-amber-600" />
                    Needs Revision
                  </button>
                </div>
              </div>

              {/* Rating and Credits */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Mentor Rating (1 - 5 Stars)</Label>
                  <select
                    value={mentorRating}
                    onChange={(e) => setMentorRating(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-800"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5/5 - Outstanding)</option>
                    <option value={4}>⭐⭐⭐⭐ (4/5 - Exceeds Expectations)</option>
                    <option value={3}>⭐⭐⭐ (3/5 - Meets Requirements)</option>
                    <option value={2}>⭐⭐ (2/5 - Partial Completion)</option>
                    <option value={1}>⭐ (1/5 - Unsatisfactory)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Recommended Credits / Points</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={mentorRecommendedCredits}
                    onChange={(e) => setMentorRecommendedCredits(Number(e.target.value))}
                    className="text-xs font-bold"
                  />
                </div>
              </div>

              {/* Mentor Detailed Report Text */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">
                  Mentor Evaluation Report &amp; Observations *
                </Label>
                <Textarea
                  required
                  rows={4}
                  value={mentorReportText}
                  onChange={(e) => setMentorReportText(e.target.value)}
                  placeholder="Detail the quality of the submission, architecture decisions, code readability, test coverage, and feedback for the intern..."
                  className="text-xs"
                />
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setMentorVerifyTask(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingMentorReport || !mentorReportText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  {isSubmittingMentorReport ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                  Submit Verification to Admin
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Schedule Mentee Meeting Modal ── */}
      {menteeMeetingOpen && (
        <Dialog open={menteeMeetingOpen} onOpenChange={setMenteeMeetingOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Video className="h-5 w-5 text-indigo-600" />
                Schedule Mentorship Meeting &amp; Dispatch Invites
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Creates a sync on the company calendar and immediately sends official email invitations with direct Google Meet links to your allocated interns.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (selectedMenteeIds.length === 0) {
                  toast.error("Please select at least one assigned mentee.");
                  return;
                }
                setIsSchedulingMenteeMeeting(true);
                try {
                  const scheduledIso = new Date(`${menteeMeetingDate}T${menteeMeetingTime}:00`).toISOString();
                  const res = await doScheduleMentorMeeting({
                    data: {
                      title: menteeMeetingTitle.trim(),
                      description: menteeMeetingDesc.trim() || undefined,
                      scheduled_at: scheduledIso,
                      meeting_link: menteeMeetingLink.trim(),
                      intern_ids: selectedMenteeIds,
                    },
                  });
                  toast.success(res.message);
                  setMenteeMeetingOpen(false);
                  qc.invalidateQueries({ queryKey: ["meetings"] });
                } catch (err: any) {
                  toast.error(err.message || "Failed to schedule mentee meeting");
                } finally {
                  setIsSchedulingMenteeMeeting(false);
                }
              }}
              className="space-y-4 pt-2 text-xs"
            >
              {/* Meeting Title */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Meeting Title *</Label>
                <Input
                  required
                  value={menteeMeetingTitle}
                  onChange={(e) => setMenteeMeetingTitle(e.target.value)}
                  placeholder="e.g. Weekly Mentorship Review & Task Unblockers"
                  className="text-xs"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Meeting Date *</Label>
                  <Input
                    type="date"
                    required
                    value={menteeMeetingDate}
                    onChange={(e) => setMenteeMeetingDate(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Start Time *</Label>
                  <Input
                    type="time"
                    required
                    value={menteeMeetingTime}
                    onChange={(e) => setMenteeMeetingTime(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Meeting Link */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Google Meet / Zoom URL *</Label>
                <Input
                  type="url"
                  required
                  value={menteeMeetingLink}
                  onChange={(e) => setMenteeMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/xyz-abcd-efg"
                  className="text-xs"
                />
              </div>

              {/* Target Mentees Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700">Invited Mentees ({selectedMenteeIds.length} Selected)</Label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedMenteeIds.length === myInterns.length) {
                        setSelectedMenteeIds([]);
                      } else {
                        setSelectedMenteeIds(myInterns.map((i: any) => i.id));
                      }
                    }}
                    className="text-[11px] text-indigo-600 hover:underline font-bold"
                  >
                    {selectedMenteeIds.length === myInterns.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-xl border border-slate-200 bg-slate-50">
                  {myInterns.map((intern: any) => (
                    <label key={intern.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-white transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedMenteeIds.includes(intern.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMenteeIds([...selectedMenteeIds, intern.id]);
                          } else {
                            setSelectedMenteeIds(selectedMenteeIds.filter((id) => id !== intern.id));
                          }
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                      />
                      <span className="text-xs font-medium text-slate-800">{intern.full_name}</span>
                      <span className="text-[10px] text-slate-400">({intern.email})</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Agenda / Discussion Points</Label>
                <Textarea
                  rows={2}
                  value={menteeMeetingDesc}
                  onChange={(e) => setMenteeMeetingDesc(e.target.value)}
                  placeholder="Items to discuss..."
                  className="text-xs"
                />
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setMenteeMeetingOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSchedulingMenteeMeeting || !menteeMeetingTitle || !menteeMeetingLink || selectedMenteeIds.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  {isSchedulingMenteeMeeting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                  Schedule &amp; Dispatch Invites
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Reusable Profile Change Request Modal ── */}
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
