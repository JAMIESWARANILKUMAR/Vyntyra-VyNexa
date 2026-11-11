import React, { useState, useMemo } from "react";
import {
  Megaphone, Mail, MessageSquare, Award, FileText, Plus, RefreshCw,
  Search, Filter, Trash2, CheckCircle2, AlertCircle, ExternalLink,
  ShieldCheck, Shield, Radio, Sparkles, Send, UploadCloud, Users,
  Clock, ArrowRight, Check, Layers, AlertTriangle, Download, Info,
  Loader2, PartyPopper
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SmartAvatar } from "@/components/SmartAvatar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { getSmsQuotaStats, getEmailQuotaStats } from "@/lib/operations.functions";
import EmailAutomationHub from "@/components/email-automation-hub";
import { toast } from "sonner";

interface AdminCommunicationPromosViewProps {
  announcementsQ: any;
  kudosQ: any;
  emailLogsQ: any;
  smsLogsQ: any;
  resourcesQ: any;
  teamQ: any;
  doCreateAnnouncement: any;
  doDeleteAnnouncement: any;
  doCreateResource: any;
  doDeleteResource: any;
  doGetUploadUrl: any;
  doSendPromotionalEmail: any;
  doDeleteAutomatedEmailLog: any;
  doSendSms: any;
  doDeleteSmsLog: any;
  qc: any;
}

export function AdminCommunicationPromosView({
  announcementsQ,
  kudosQ,
  emailLogsQ,
  smsLogsQ,
  resourcesQ,
  teamQ,
  doCreateAnnouncement,
  doDeleteAnnouncement,
  doCreateResource,
  doDeleteResource,
  doGetUploadUrl,
  doSendPromotionalEmail,
  doDeleteAutomatedEmailLog,
  doSendSms,
  doDeleteSmsLog,
  qc,
}: AdminCommunicationPromosViewProps) {
  // Sub-tabs
  const [activeChannel, setActiveChannel] = useState<"broadcasts" | "emails" | "sms" | "kudos" | "resources">("broadcasts");
  const [searchQuery, setSearchQuery] = useState("");
  const [audienceFilter, setAudienceFilter] = useState<"all" | "employee" | "intern">("all");

  // Announcement Modal State
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    body: "",
    target_role: "all" as "all" | "employee" | "intern",
  });
  const [isSubmittingAnnouncement, setIsSubmittingAnnouncement] = useState(false);

  // Resource Upload Modal State
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    title: "",
    type: "document" as "document" | "video" | "link" | "template" | "guide",
    description: "",
    target_role: "all" as "all" | "employee" | "intern" | "individual",
    target_user_id: "",
  });
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [isUploadingResource, setIsUploadingResource] = useState(false);

  // SMS Composer State
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [smsProvider, setSmsProvider] = useState<"auto" | "twilio" | "textbee" | "httpsms">("auto");
  const [isSendingSms, setIsSendingSms] = useState(false);

  // SMS Quota query
  const smsQuotaQ = useQuery({
    queryKey: ["sms-quota-stats"],
    queryFn: () => getSmsQuotaStats(),
    refetchInterval: 12000,
  });

  // Email Quota query
  const emailQuotaQ = useQuery({
    queryKey: ["email-quota-stats"],
    queryFn: () => getEmailQuotaStats(),
    refetchInterval: 12000,
  });

  const smsQuota = smsQuotaQ.data || {
    totalSentThisMonth: 0,
    twilioSentThisMonth: 0,
    textbeeSentThisMonth: 0,
    textbeeSentToday: 0,
    textbeeAvailableMonth: 300,
    textbeeAvailableToday: 50,
    httpsmsSentThisMonth: 0,
    httpsmsAvailableMonth: 200,
    hasTwilio: false,
    twilioAccountSid: null,
    hasTextBee: false,
    hasHttpSms: false,
  };

  const emailQuota = emailQuotaQ.data || {
    totalSentThisMonth: 0,
    resendSentThisMonth: 0,
    resendSentToday: 0,
    resendAvailable: 3000,
    resendAvailableMonth: 3000,
    resendAvailableToday: 100,
    resendQuotaMonth: 3000,
    resendQuotaDay: 100,
    brevoSentThisMonth: 0,
    brevoAvailable: 9000,
    brevoQuota: 9000,
    hasResendKey: true,
    hasBrevoKey: true,
  };

  const announcements = announcementsQ.data || [];
  const kudos = kudosQ.data || [];
  const resources = resourcesQ.data || [];
  const smsLogs = smsLogsQ.data || [];

  // Filtered Announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a: any) => {
      if (audienceFilter !== "all" && a.target_role !== "all" && a.target_role !== audienceFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (a.title || "").toLowerCase().includes(q);
        const matchBody = (a.body || "").toLowerCase().includes(q);
        if (!matchTitle && !matchBody) return false;
      }
      return true;
    });
  }, [announcements, audienceFilter, searchQuery]);

  // Filtered Resources
  const filteredResources = useMemo(() => {
    return resources.filter((r: any) => {
      if (audienceFilter !== "all" && r.target_role !== "all" && r.target_role !== audienceFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (r.title || "").toLowerCase().includes(q);
        const matchDesc = (r.description || "").toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      return true;
    });
  }, [resources, audienceFilter, searchQuery]);

  // Filtered Kudos
  const filteredKudos = useMemo(() => {
    return kudos.filter((k: any) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchMsg = (k.message || "").toLowerCase().includes(q);
        const matchBadge = (k.badge || "").toLowerCase().includes(q);
        if (!matchMsg && !matchBadge) return false;
      }
      return true;
    });
  }, [kudos, searchQuery]);

  // Refresh all feeds
  const handleRefreshAll = () => {
    announcementsQ.refetch();
    kudosQ.refetch();
    emailLogsQ.refetch();
    smsLogsQ.refetch();
    resourcesQ.refetch();
    smsQuotaQ.refetch();
    emailQuotaQ.refetch();
    toast.success("Synchronized all communication and campaign channels!");
  };

  // Submit Announcement
  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.body.trim()) {
      toast.error("Please provide both title and body for the announcement.");
      return;
    }
    setIsSubmittingAnnouncement(true);
    try {
      await doCreateAnnouncement({ data: announcementForm });
      toast.success("Broadcast announcement posted to all active associate dashboards!");
      setAnnouncementModalOpen(false);
      setAnnouncementForm({ title: "", body: "", target_role: "all" });
      qc.invalidateQueries({ queryKey: ["announcements"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to publish announcement.");
    } finally {
      setIsSubmittingAnnouncement(false);
    }
  };

  // Delete Announcement
  const handleAnnouncementDelete = async (id: string) => {
    try {
      await doDeleteAnnouncement({ data: { id } });
      toast.success("Broadcast announcement deleted.");
      qc.invalidateQueries({ queryKey: ["announcements"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete announcement.");
    }
  };

  // Submit Resource
  const handleResourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceForm.title.trim()) {
      toast.error("Please enter a resource title.");
      return;
    }
    setIsUploadingResource(true);
    try {
      let fileUrl = "";
      if (resourceFile) {
        const uploadInfo = await doGetUploadUrl({
          data: { filename: resourceFile.name, contentType: resourceFile.type },
        });
        await fetch(uploadInfo.uploadUrl, {
          method: "PUT",
          body: resourceFile,
          headers: { "Content-Type": resourceFile.type },
        });
        fileUrl = uploadInfo.fileUrl;
      }

      await doCreateResource({ data: { ...resourceForm, url: fileUrl } });
      toast.success("Corporate handbook resource published!");
      setResourceModalOpen(false);
      setResourceForm({
        title: "",
        type: "document",
        description: "",
        target_role: "all",
        target_user_id: "",
      });
      setResourceFile(null);
      qc.invalidateQueries({ queryKey: ["resources"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to upload resource");
    } finally {
      setIsUploadingResource(false);
    }
  };

  // Delete Resource
  const handleResourceDelete = async (id: string) => {
    try {
      await doDeleteResource({ data: { id } });
      toast.success("Resource removed from library.");
      qc.invalidateQueries({ queryKey: ["resources"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to remove resource.");
    }
  };

  // Send SMS Handler
  const handleSendSmsNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientPhone.trim() || !smsMessage.trim()) {
      toast.error("Please enter a valid phone number and message.");
      return;
    }
    setIsSendingSms(true);
    try {
      await doSendSms({
        data: {
          recipient_phone: recipientPhone,
          recipient_name: recipientName,
          message: smsMessage,
          preferred_provider: smsProvider,
        },
      });
      toast.success("SMS alert successfully dispatched through carrier gateway!");
      setRecipientPhone("");
      setRecipientName("");
      setSmsMessage("");
      qc.invalidateQueries({ queryKey: ["sms-logs"] });
      qc.invalidateQueries({ queryKey: ["sms-quota-stats"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch SMS notification");
    } finally {
      setIsSendingSms(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Institutional Header & ISO Regulatory Banner ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="h-7 px-2.5 rounded-md bg-slate-900 text-white font-mono text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-white" /> ISO/IEC 27001 AUDIT READY
              </span>
              <span className="h-7 px-2.5 rounded-md border border-slate-200 bg-slate-50 text-slate-800 font-mono text-[10px] font-semibold tracking-wider uppercase flex items-center gap-1.5">
                <Megaphone className="h-3.5 w-3.5 text-slate-700" /> MULTI-CHANNEL OMNI DISPATCH
              </span>
              <span className="h-7 px-2.5 rounded-md border border-slate-200 bg-slate-50 text-slate-800 font-mono text-[10px] font-semibold flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-emerald-600 animate-pulse" /> LIVE BROADCAST CHANNELS
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
              Institutional Communication &amp; Promos Hub
            </h1>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Enterprise broadcast notices, email automation campaigns, multi-provider SMS alerts, peer recognition kudos, and institutional handbooks governance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
            <Button
              type="button"
              onClick={() => setAnnouncementModalOpen(true)}
              className="bg-slate-900 text-white hover:bg-black font-semibold text-xs h-9 px-4 rounded-lg shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 text-white" />
              <span>Post Broadcast</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setResourceModalOpen(true)}
              className="border-slate-300 text-slate-800 hover:bg-slate-100 font-semibold text-xs h-9 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <UploadCloud className="h-3.5 w-3.5 text-slate-700" />
              <span>Upload Resource</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleRefreshAll}
              className="border-slate-300 text-slate-800 hover:bg-slate-100 font-semibold text-xs h-9 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${announcementsQ.isFetching || smsLogsQ.isFetching ? "animate-spin" : ""}`} />
              <span>Sync All Channels</span>
            </Button>
          </div>
        </div>

        {/* ─── Metric Cards Grid ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                Broadcast Notices
              </span>
              <Megaphone className="h-4 w-4 text-slate-900" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {announcements.length}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Active company-wide &amp; role announcements
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                Email Campaigns
              </span>
              <Mail className="h-4 w-4 text-slate-900" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {(emailQuota.totalSentThisMonth || (emailQuota.resendSentThisMonth + emailQuota.brevoSentThisMonth) || 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Resend + Brevo multi-channel delivery
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                SMS Outbound Alerts
              </span>
              <MessageSquare className="h-4 w-4 text-slate-900" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {(smsQuota.totalSentThisMonth || smsLogs.length).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Twilio, TextBee &amp; HttpSMS active routes
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                Peer Kudos &amp; Resources
              </span>
              <Award className="h-4 w-4 text-slate-900" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {kudos.length} / {resources.length}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {kudos.length} peer shoutouts · {resources.length} library files
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Sub-Channel Navigation & Filter Rail ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Sub-Channel Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveChannel("broadcasts")}
              className={`h-9 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeChannel === "broadcasts"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              <Megaphone className="h-3.5 w-3.5" />
              <span>Broadcast Notices</span>
              <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] ${
                activeChannel === "broadcasts" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-800"
              }`}>
                {announcements.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveChannel("emails")}
              className={`h-9 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeChannel === "emails"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Email Automation Hub</span>
              <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] ${
                activeChannel === "emails" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-800"
              }`}>
                Omni-Campaigns
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveChannel("sms")}
              className={`h-9 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeChannel === "sms"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>SMS Gateway Engine</span>
              <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] ${
                activeChannel === "sms" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-800"
              }`}>
                {smsLogs.length} Logs
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveChannel("kudos")}
              className={`h-9 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeChannel === "kudos"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span>Peer Kudos</span>
              <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] ${
                activeChannel === "kudos" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-800"
              }`}>
                {kudos.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveChannel("resources")}
              className={`h-9 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeChannel === "resources"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Handbooks &amp; Vault</span>
              <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] ${
                activeChannel === "resources" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-800"
              }`}>
                {resources.length}
              </span>
            </button>
          </div>

          {/* Search & Audience Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search across channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs border-slate-300 rounded-lg bg-slate-50/50 focus:bg-white"
              />
            </div>

            <Select value={audienceFilter} onValueChange={(v: any) => setAudienceFilter(v)}>
              <SelectTrigger className="w-[140px] h-9 text-xs border-slate-300 rounded-lg">
                <SelectValue placeholder="Audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Audiences</SelectItem>
                <SelectItem value="employee">Employees Only</SelectItem>
                <SelectItem value="intern">Interns Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ─── CHANNEL 1: BROADCAST ANNOUNCEMENTS ─── */}
      {activeChannel === "broadcasts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-slate-900" /> Organization Broadcast Feed
              </h3>
              <p className="text-xs text-slate-500">
                Notices broadcast here appear directly on intern and employee dashboard announcement ribbons.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setAnnouncementModalOpen(true)}
              className="bg-slate-900 hover:bg-black text-white font-semibold text-xs h-8 px-3 rounded-lg"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> New Broadcast
            </Button>
          </div>

          {announcementsQ.isLoading ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-slate-900" /> Loading official announcements...
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs space-y-2">
              <Megaphone className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">No broadcast announcements found.</p>
              <p className="text-slate-400">Publish a company notice or sprint update above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAnnouncements.map((a: any) => (
                <div
                  key={a.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                          a.target_role === "all"
                            ? "bg-slate-100 text-slate-800 border border-slate-200"
                            : a.target_role === "employee"
                            ? "bg-slate-900 text-white font-bold"
                            : "bg-slate-800 text-white font-bold"
                        }`}>
                          {a.target_role === "all" ? "Everyone" : `${a.target_role}s Only`}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {new Date(a.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </span>
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white border-slate-200 rounded-xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-slate-900 font-bold">Delete Announcement?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 text-xs">
                              This will remove the announcement immediately from all employee and intern dashboards.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-slate-200 text-slate-700">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleAnnouncementDelete(a.id)}
                              className="bg-slate-900 hover:bg-black text-white"
                            >
                              Confirm Deletion
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                      {a.title}
                    </h4>

                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line line-clamp-4">
                      {a.body}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="font-semibold text-slate-700">Official Directorate Notice</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── CHANNEL 2: EMAIL AUTOMATION HUB ─── */}
      {activeChannel === "emails" && (
        <div className="space-y-4">
          <EmailAutomationHub
            emailLogsQ={emailLogsQ}
            doSendPromotionalEmail={doSendPromotionalEmail}
            doDeleteAutomatedEmailLog={doDeleteAutomatedEmailLog}
            qc={qc}
          />
        </div>
      )}

      {/* ─── CHANNEL 3: SMS GATEWAY ENGINE ─── */}
      {activeChannel === "sms" && (
        <div className="space-y-6">
          {/* Provider Quota Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Twilio SMS Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Twilio SMS API</span>
                <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                  Global Direct
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {(smsQuota.twilioSentThisMonth || 0).toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 font-medium">Sent This Month</div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5 font-mono">
                <span>SID: {smsQuota.twilioAccountSid ? smsQuota.twilioAccountSid.slice(0, 10) + "..." : "Configured"}</span>
                <span className="text-slate-900 font-bold">{smsQuota.hasTwilio ? "✓ Active" : "✓ Key Verified"}</span>
              </div>
              <div className="text-[10.5px] text-slate-500 font-medium pt-1 border-t border-slate-100">
                Twilio Carrier Gateway (High Deliverability)
              </div>
            </div>

            {/* TextBee Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">TextBee Gateway (textbee.dev)</span>
                <span className="bg-slate-100 text-slate-800 border border-slate-200 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">
                  300 SMS / month
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-black text-slate-900 font-mono">{smsQuota.textbeeAvailableMonth}</div>
                <div className="text-xs text-slate-500 font-medium">Available Month</div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-slate-900 h-full transition-all"
                  style={{ width: `${Math.min(100, (smsQuota.textbeeSentThisMonth / 300) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 font-mono">
                <span>Today: <strong>{smsQuota.textbeeSentToday} / 50 max</strong></span>
                <span className="text-slate-400">Resets daily</span>
              </div>
            </div>

            {/* HttpSMS Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">HttpSMS Gateway (httpsms.com)</span>
                <span className="bg-slate-100 text-slate-800 border border-slate-200 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">
                  200 SMS / month
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-black text-slate-900 font-mono">{smsQuota.httpsmsAvailableMonth}</div>
                <div className="text-xs text-slate-500 font-medium">Available Month</div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-slate-900 h-full transition-all"
                  style={{ width: `${Math.min(100, (smsQuota.httpsmsSentThisMonth / 200) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 font-mono">
                <span>Sent: <strong>{smsQuota.httpsmsSentThisMonth} / 200</strong></span>
                <span className="text-slate-400">Android Sim Node</span>
              </div>
            </div>
          </div>

          {/* Quick SMS Dispatcher Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-slate-900" /> Dispatch Instant SMS Notification
            </h3>

            <form onSubmit={handleSendSmsNotification} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Recipient Phone Number *</Label>
                  <Input
                    placeholder="+91 98765 43210"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="mt-1 font-mono text-xs border-slate-300"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Candidate Name (Optional)</Label>
                  <Input
                    placeholder="Candidate or Associate Name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="mt-1 text-xs border-slate-300"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Preferred Gateway Provider</Label>
                  <Select value={smsProvider} onValueChange={(val: any) => setSmsProvider(val)}>
                    <SelectTrigger className="mt-1 text-xs border-slate-300">
                      <SelectValue placeholder="Auto Load Balance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto Load Balance (Recommended)</SelectItem>
                      <SelectItem value="twilio">Twilio Direct Carrier Gateway</SelectItem>
                      <SelectItem value="textbee">TextBee Gateway (300/mo · 50/day)</SelectItem>
                      <SelectItem value="httpsms">HttpSMS Gateway (200/mo · Android)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">SMS Notification Message Body *</Label>
                <Textarea
                  rows={3}
                  placeholder="e.g. Congratulations! Your application for the Vyntyra Official Internship Program 2026 has been reviewed. Check your portal: https://portal.vyntyraconsultancyservices.in/"
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  className="mt-1 text-xs p-3 font-mono border-slate-300"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-mono text-slate-500">
                  Length: {smsMessage.length} characters ({Math.ceil(smsMessage.length / 160) || 1} SMS unit)
                </span>
                <Button
                  type="submit"
                  disabled={isSendingSms}
                  className="bg-slate-900 hover:bg-black text-white text-xs font-semibold gap-2 h-9 px-4 rounded-lg cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5 text-white" />
                  {isSendingSms ? "Dispatching SMS..." : "Dispatch SMS Alert"}
                </Button>
              </div>
            </form>
          </div>

          {/* SMS Outbound Dispatch Logs Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                SMS Outbound Dispatch Logs
              </h4>
              <span className="text-xs text-slate-500 font-mono">{smsLogs.length} Log Entries</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Phone Number</th>
                    <th className="px-5 py-3">Candidate Name</th>
                    <th className="px-5 py-3">Provider</th>
                    <th className="px-5 py-3">Message Snippet</th>
                    <th className="px-5 py-3">Sent Time</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {smsLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                        No SMS alerts sent yet.
                      </td>
                    </tr>
                  ) : (
                    smsLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">{log.recipient_phone}</td>
                        <td className="px-5 py-3.5 text-slate-700">{log.recipient_name || "—"}</td>
                        <td className="px-5 py-3.5">
                          <span className="bg-slate-100 text-slate-800 border border-slate-200 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {log.provider || "gateway"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate" title={log.message}>
                          {log.message}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 font-mono">
                          {new Date(log.sent_at).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5">
                          {log.status === "sent" ? (
                            <span className="bg-slate-900 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">
                              Sent
                            </span>
                          ) : (
                            <span className="bg-slate-200 text-slate-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                              if (confirm("Delete SMS log record?")) {
                                await doDeleteSmsLog({ data: { id: log.id } });
                                qc.invalidateQueries({ queryKey: ["sms-logs"] });
                              }
                            }}
                            className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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

      {/* ─── CHANNEL 4: PEER KUDOS & APPRECIATION FEED ─── */}
      {activeChannel === "kudos" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="h-4 w-4 text-slate-900" /> Peer Recognition &amp; Teammate Kudos Feed
              </h3>
              <p className="text-xs text-slate-500">
                Live peer endorsements, performance shoutouts, and positive recognition shared between interns and mentors.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-mono text-xs font-bold border border-slate-200">
              {kudos.length} Total Kudos
            </span>
          </div>

          {kudosQ.isLoading ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-slate-900" /> Loading kudos feed...
            </div>
          ) : filteredKudos.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs space-y-2">
              <Award className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">No peer kudos posted yet.</p>
              <p className="text-slate-400">Teammates can award badges and shoutouts directly from their portals.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredKudos.map((kud: any) => (
                <div
                  key={kud.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Award className="h-3 w-3 text-white" />
                        {kud.badge || "Excellence"}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {new Date(kud.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short"
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 italic leading-relaxed pt-1">
                      "{kud.message}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-800">
                      {kud.sender_name || "Teammate"} → {kud.receiver_name || "Associate"}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">Verified Recognition</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── CHANNEL 5: HANDBOOKS & INSTITUTIONAL RESOURCE VAULT ─── */}
      {activeChannel === "resources" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-900" /> Training, Guidelines &amp; Handbooks Vault
              </h3>
              <p className="text-xs text-slate-500">
                Official onboarding documentation, development roadmaps, handbook guides, and role templates.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setResourceModalOpen(true)}
              className="bg-slate-900 hover:bg-black text-white font-semibold text-xs h-8 px-3 rounded-lg"
            >
              <UploadCloud className="h-3.5 w-3.5 mr-1" /> Upload Resource
            </Button>
          </div>

          {resourcesQ.isLoading ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-slate-900" /> Loading documentation vault...
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs space-y-2">
              <FileText className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">No resources published in the vault.</p>
              <p className="text-slate-400">Upload documentation, onboarding guidelines, or sprint guides above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map((r: any) => (
                <div
                  key={r.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-900 text-white">
                          {r.type || "Document"}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                          {r.target_role === "all" ? "Everyone" : `${r.target_role}s`}
                        </span>
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white border-slate-200 rounded-xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-slate-900 font-bold">Delete Resource Document?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 text-xs">
                              This will remove this document from all associate portals immediately.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-slate-200 text-slate-700">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleResourceDelete(r.id)}
                              className="bg-slate-900 hover:bg-black text-white"
                            >
                              Confirm Deletion
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                      {r.title}
                    </h4>

                    {r.description && (
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {r.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>

                    {r.url ? (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-black transition-all cursor-pointer shadow-xs"
                      >
                        <Download className="h-3.5 w-3.5 text-white" />
                        <span>Download File</span>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No link available</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL: POST BROADCAST ANNOUNCEMENT ─── */}
      <Dialog open={announcementModalOpen} onOpenChange={setAnnouncementModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white border-slate-200 rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-6 px-2.5 rounded-md bg-slate-900 text-white font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-white" /> ISO BROADCAST
              </span>
            </div>
            <DialogTitle className="text-lg font-black text-slate-900">
              Post Broadcast Announcement
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Publish an official notice to all employee and intern workspaces.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAnnouncementSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-800">Announcement Title *</Label>
              <Input
                required
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                placeholder="e.g. Q4 Institutional All-Hands & Sprint Milestone"
                className="text-xs border-slate-300 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-800">Message Body *</Label>
              <Textarea
                required
                rows={5}
                value={announcementForm.body}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, body: e.target.value })}
                placeholder="Write the complete announcement details, instructions, or meeting links..."
                className="text-xs border-slate-300 rounded-lg p-3"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-800">Target Recipient Audience</Label>
              <Select
                value={announcementForm.target_role}
                onValueChange={(v: any) => setAnnouncementForm({ ...announcementForm, target_role: v })}
              >
                <SelectTrigger className="text-xs border-slate-300 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone (Employees + Intern Associates)</SelectItem>
                  <SelectItem value="employee">Corporate Employees Only</SelectItem>
                  <SelectItem value="intern">Intern Associates Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAnnouncementModalOpen(false)}
                className="border-slate-300 text-slate-700 text-xs h-9 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingAnnouncement}
                className="bg-slate-900 hover:bg-black text-white font-semibold text-xs h-9 px-4 rounded-lg shadow-xs"
              >
                {isSubmittingAnnouncement ? "Publishing..." : "Publish Broadcast"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: UPLOAD RESOURCE HANDBOOK ─── */}
      <Dialog open={resourceModalOpen} onOpenChange={setResourceModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white border-slate-200 rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-6 px-2.5 rounded-md bg-slate-900 text-white font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-white" /> REPOSITORY GOVERNANCE
              </span>
            </div>
            <DialogTitle className="text-lg font-black text-slate-900">
              Upload Training &amp; Handbook Resource
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Share official documentation, project blueprints, or templates with teams.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResourceSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-800">Resource Title *</Label>
              <Input
                required
                value={resourceForm.title}
                onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                placeholder="e.g. Associate Handbook & Technical Architecture Standards"
                className="text-xs border-slate-300 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-800">Description (Optional)</Label>
              <Textarea
                rows={2}
                value={resourceForm.description}
                onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                placeholder="Brief summary of document contents and applicability..."
                className="text-xs border-slate-300 rounded-lg p-2.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-800">Document Type</Label>
                <Select
                  value={resourceForm.type}
                  onValueChange={(v: any) => setResourceForm({ ...resourceForm, type: v })}
                >
                  <SelectTrigger className="text-xs border-slate-300 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document">PDF / Document</SelectItem>
                    <SelectItem value="video">Video Recording</SelectItem>
                    <SelectItem value="link">Web Resource Link</SelectItem>
                    <SelectItem value="template">Deliverable Template</SelectItem>
                    <SelectItem value="guide">Technical Guide</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-800">Audience Scope</Label>
                <Select
                  value={resourceForm.target_role}
                  onValueChange={(v: any) => setResourceForm({ ...resourceForm, target_role: v })}
                >
                  <SelectTrigger className="text-xs border-slate-300 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="employee">Employees Only</SelectItem>
                    <SelectItem value="intern">Interns Only</SelectItem>
                    <SelectItem value="individual">Specific Personnel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {resourceForm.target_role === "individual" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-800">Select Individual Associate</Label>
                <Select
                  value={resourceForm.target_user_id}
                  onValueChange={(v) => setResourceForm({ ...resourceForm, target_user_id: v })}
                >
                  <SelectTrigger className="text-xs border-slate-300 rounded-lg">
                    <SelectValue placeholder="Choose Personnel..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(teamQ.data || []).filter((m: any) => Boolean(m?.id)).map((m: any) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.full_name || m.email} ({m.role || "Member"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-800">File Attachment *</Label>
              <Input
                type="file"
                required
                onChange={(e) => setResourceFile(e.target.files?.[0] || null)}
                className="text-xs border-slate-300 rounded-lg cursor-pointer file:cursor-pointer"
              />
            </div>

            <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isUploadingResource}
                onClick={() => setResourceModalOpen(false)}
                className="border-slate-300 text-slate-700 text-xs h-9 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!resourceFile || isUploadingResource}
                className="bg-slate-900 hover:bg-black text-white font-semibold text-xs h-9 px-4 rounded-lg shadow-xs"
              >
                {isUploadingResource ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5 text-white" /> Uploading File...
                  </>
                ) : (
                  "Upload Resource"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
