import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Sparkles,
  Mail,
  Send,
  MessageSquare,
  Users,
  CheckCircle2,
  Copy,
  ExternalLink,
  Gift,
  Award,
  TrendingUp,
  Zap,
  Plane,
  FileCheck2,
  Crown,
  Search,
  CheckSquare,
  Square,
  RefreshCw,
  Loader2,
  Phone,
  Building2,
  Eye,
  FileText,
  Clock,
  XCircle,
  AlertCircle,
  Sliders,
  Settings2,
  Check,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getInternsForAmbassadorCampaign,
  sendAmbassadorPromotionalEmail,
  listAmbassadorRegistrations,
  updateAmbassadorApplicantStatus,
  getAmbassadorEmailTemplates,
  updateAmbassadorEmailTemplate,
  updateAmbassadorApplicationStatusWithEmail,
  sendTestAmbassadorStatusEmail,
  AmbassadorRegistration,
  AmbassadorEmailTemplate,
  DEFAULT_AMBASSADOR_EMAIL_TEMPLATES,
} from "@/lib/ambassador.functions";

type LifecycleStage =
  | "all"
  | "under_review"
  | "shortlisted"
  | "selected"
  | "agreement_sent"
  | "rejected";

export function AdminAmbassadorCampaign() {
  const qc = useQueryClient();
  const fetchInternsFn = useServerFn(getInternsForAmbassadorCampaign);
  const sendEmailFn = useServerFn(sendAmbassadorPromotionalEmail);
  const listRegistrationsFn = useServerFn(listAmbassadorRegistrations);
  const getEmailTemplatesFn = useServerFn(getAmbassadorEmailTemplates);
  const updateEmailTemplateFn = useServerFn(updateAmbassadorEmailTemplate);
  const updateStatusWithEmailFn = useServerFn(updateAmbassadorApplicationStatusWithEmail);
  const sendTestStatusEmailFn = useServerFn(sendTestAmbassadorStatusEmail);

  // Queries
  const internsQuery = useQuery({
    queryKey: ["admin-ambassador-interns"],
    queryFn: () => fetchInternsFn(),
    staleTime: 60000,
  });

  const registrationsQuery = useQuery({
    queryKey: ["admin-ambassador-registrations"],
    queryFn: () => listRegistrationsFn(),
    staleTime: 30000,
  });

  const emailTemplatesQuery = useQuery({
    queryKey: ["admin-ambassador-email-templates"],
    queryFn: () => getEmailTemplatesFn(),
    staleTime: 60000,
  });

  const interns = internsQuery.data || [];
  const registrations: AmbassadorRegistration[] = registrationsQuery.data || [];
  const emailTemplates: AmbassadorEmailTemplate[] =
    emailTemplatesQuery.data || DEFAULT_AMBASSADOR_EMAIL_TEMPLATES;

  // Active top-level mode
  const [activeChannel, setActiveChannel] = useState<
    "email" | "whatsapp" | "registrations" | "templates"
  >("registrations");

  // Broadcast state
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [subjectText, setSubjectText] = useState(
    "🚀 Launching Soon: Vyntyra Institutional Relations Associate (Campus Ambassador) — First Cohort"
  );
  const [isSending, setIsSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [testEmail, setTestEmail] = useState("");

  // Applicant Lifecycle Filtering
  const [applicantSearch, setApplicantSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<LifecycleStage>("all");

  // Status Change Dialog State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<AmbassadorRegistration | null>(null);
  const [newStatus, setNewStatus] = useState<
    "under_review" | "shortlisted" | "selected" | "agreement_sent" | "rejected"
  >("under_review");
  const [reviewNotes, setReviewNotes] = useState("");
  const [agreementUrl, setAgreementUrl] = useState(
    "https://vyntyraconsultancyservices.in/campus-ambassador/agreement-sample.pdf"
  );
  const [triggerEmail, setTriggerEmail] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Email Template Studio Editing State
  const [selectedTemplateStage, setSelectedTemplateStage] = useState<
    "under_review" | "shortlisted" | "selected" | "agreement_sent" | "rejected"
  >("under_review");
  const [editingTemplate, setEditingTemplate] = useState<AmbassadorEmailTemplate | null>(null);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [testTemplateEmail, setTestTemplateEmail] = useState("");
  const [isSendingTemplateTest, setIsSendingTemplateTest] = useState(false);

  // Sync selected template when stage changes or templates load
  React.useEffect(() => {
    const tmpl = emailTemplates.find((t) => t.status_trigger === selectedTemplateStage);
    if (tmpl) {
      setEditingTemplate({ ...tmpl });
    } else {
      const def = DEFAULT_AMBASSADOR_EMAIL_TEMPLATES.find(
        (t) => t.status_trigger === selectedTemplateStage
      );
      if (def) setEditingTemplate({ ...def });
    }
  }, [selectedTemplateStage, emailTemplates]);

  // Stage Metrics Calculation
  const stageCounts = useMemo(() => {
    const counts = {
      all: registrations.length,
      under_review: 0,
      shortlisted: 0,
      selected: 0,
      agreement_sent: 0,
      rejected: 0,
    };

    registrations.forEach((r) => {
      const s = (r.status || "pending").toLowerCase();
      if (s === "under_review" || s === "pending") counts.under_review++;
      else if (s === "shortlisted") counts.shortlisted++;
      else if (s === "selected" || s === "accepted") counts.selected++;
      else if (s === "agreement_sent" || s === "enrolled") counts.agreement_sent++;
      else if (s === "rejected") counts.rejected++;
      else counts.under_review++;
    });

    return counts;
  }, [registrations]);

  // Filtered applicants
  const filteredApplicants = useMemo(() => {
    let list = registrations;

    // Filter by stage
    if (stageFilter !== "all") {
      list = list.filter((r) => {
        const s = (r.status || "pending").toLowerCase();
        if (stageFilter === "under_review") return s === "under_review" || s === "pending";
        if (stageFilter === "shortlisted") return s === "shortlisted";
        if (stageFilter === "selected") return s === "selected" || s === "accepted";
        if (stageFilter === "agreement_sent") return s === "agreement_sent" || s === "enrolled";
        if (stageFilter === "rejected") return s === "rejected";
        return true;
      });
    }

    // Filter by search
    const q = applicantSearch.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (r) =>
          r.full_name?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q) ||
          r.phone?.includes(q) ||
          r.college_name?.toLowerCase().includes(q) ||
          r.state?.toLowerCase().includes(q) ||
          r.district?.toLowerCase().includes(q) ||
          r.id?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [registrations, stageFilter, applicantSearch]);

  // Open status modal
  const openStatusDialog = (applicant: AmbassadorRegistration) => {
    setSelectedApplicant(applicant);
    const curr = (applicant.status || "pending").toLowerCase();
    if (curr === "shortlisted") setNewStatus("shortlisted");
    else if (curr === "selected" || curr === "accepted") setNewStatus("selected");
    else if (curr === "agreement_sent" || curr === "enrolled") setNewStatus("agreement_sent");
    else if (curr === "rejected") setNewStatus("rejected");
    else setNewStatus("under_review");

    setReviewNotes(applicant.notes || "");
    const selectedTmpl = emailTemplates.find((t) => t.status_trigger === "selected");
    setAgreementUrl(
      applicant.agreement_document_url ||
        selectedTmpl?.agreement_url ||
        "https://vyntyraconsultancyservices.in/campus-ambassador/agreement-sample.pdf"
    );
    setTriggerEmail(true);
    setStatusModalOpen(true);
  };

  // Submit status update with automated email
  const handleSaveStatusWithEmail = async () => {
    if (!selectedApplicant) return;
    setIsUpdatingStatus(true);
    try {
      const res = await updateStatusWithEmailFn({
        data: {
          application_id: selectedApplicant.id,
          new_status: newStatus,
          notes: reviewNotes,
          agreement_document_url:
            newStatus === "selected" || newStatus === "agreement_sent" ? agreementUrl : undefined,
          send_email: triggerEmail,
        },
      });

      if (res.email_dispatched) {
        toast.success(`Status updated to "${newStatus}" and notification email dispatched!`);
      } else if (triggerEmail && res.email_error) {
        toast.warning(
          `Status updated to "${newStatus}", but email dispatch warning: ${res.email_error}`
        );
      } else {
        toast.success(`Status updated to "${newStatus}"!`);
      }

      setStatusModalOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-ambassador-registrations"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update application status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Save Email Template
  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    setIsSavingTemplate(true);
    try {
      await updateEmailTemplateFn({
        data: {
          status_trigger: editingTemplate.status_trigger,
          title: editingTemplate.title,
          subject: editingTemplate.subject,
          body_html: editingTemplate.body_html,
          is_enabled: editingTemplate.is_enabled,
          agreement_url: editingTemplate.agreement_url,
        },
      });
      toast.success(
        `Automated template for "${editingTemplate.status_trigger}" updated and activated!`
      );
      qc.invalidateQueries({ queryKey: ["admin-ambassador-email-templates"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to save email template.");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Send Test Status Email from Studio
  const handleSendTemplateTestEmail = async () => {
    if (!testTemplateEmail || !testTemplateEmail.includes("@")) {
      toast.error("Please enter a valid recipient email for the test.");
      return;
    }
    if (!editingTemplate) return;

    setIsSendingTemplateTest(true);
    try {
      const res = await sendTestStatusEmailFn({
        data: {
          target_email: testTemplateEmail,
          status_trigger: editingTemplate.status_trigger,
          custom_subject: editingTemplate.subject,
          custom_body: editingTemplate.body_html,
          agreement_url: editingTemplate.agreement_url || null,
        },
      });
      if (res && (res as any).success === false) {
        toast.error((res as any).error || "Failed to dispatch test email. Please check provider credentials.");
      } else {
        toast.success(`Test email for "${editingTemplate.status_trigger}" sent to ${testTemplateEmail}!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send test email.");
    } finally {
      setIsSendingTemplateTest(false);
    }
  };

  // WhatsApp Message Generator
  const generateWhatsAppMessage = (name: string, college: string) => {
    return `🚀 *EXCLUSIVE LAUNCH: Vyntyra Institutional Relations Associate (Campus Ambassador) — First Cohort 2026-27*

Hi *${name || "Associate"}*, represent Vyntyra Consultancy Services at *${college || "your campus"}*!

🎁 *Exclusive Perks for First Cohort:*
• 📦 *Official IRA Welcome Kit:* (Dispatched after 1st milestone only) Personalized Associate ID, Custom Badge, Stationery & Swag
• 👕 *Corporate Merchandise:* (Dispatched after 1st milestone only) Branded Hoodies, Tees, Laptop Sleeves & Bottles
• 💰 *Ambassador Rewards:* Earn up to *₹15,000* (*T&C Apply)
• ⚡ *Branded Electronic Gadgets:* Powerbanks, Wireless Earbuds, Soundbars, Smartwatches & Webcams
• ✈️ *Top 10 Travel Retreat:* All-expenses-paid curated corporate retreat with co-associates
• 📜 *Dual Certification:* Certificate of Recognition + Corporate Internship Experience Letter
• 👑 *VVIP Access:* Free VIP access to all Vyntyra Workshops, Bootcamps, Masterclasses & Sessions

📢 *Pre-Register Now for First Cohort Priority Access:*
👉 https://vyntyraconsultancyservices.in/campus-ambassador

— Vyntyra Consultancy Services Pvt. Ltd. (Great Place to Work® Certified)`;
  };

  const handleCopyWhatsApp = (name: string, college: string) => {
    const text = generateWhatsAppMessage(name, college);
    navigator.clipboard.writeText(text);
    toast.success("WhatsApp message copied to clipboard!");
  };

  const handleOpenWhatsApp = (phone: string, name: string, college: string) => {
    if (!phone) {
      toast.error("No phone number available for this applicant.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const text = encodeURIComponent(generateWhatsAppMessage(name, college));
    window.open(`https://wa.me/${formattedPhone}?text=${text}`, "_blank");
  };

  // Bulk Email Broadcast (Interns)
  const filteredInterns = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return interns;
    return interns.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.email.toLowerCase().includes(q) ||
        i.college.toLowerCase().includes(q) ||
        i.phone.includes(q)
    );
  }, [interns, search]);

  const toggleSelectAll = () => {
    if (selectedEmails.size === filteredInterns.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(filteredInterns.map((i) => i.email)));
    }
  };

  const toggleSelectOne = (email: string) => {
    const next = new Set(selectedEmails);
    if (next.has(email)) next.delete(email);
    else next.add(email);
    setSelectedEmails(next);
  };

  const handleSendTestEmail = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      toast.error("Please provide a valid test email address.");
      return;
    }
    try {
      await sendEmailFn({
        data: {
          recipient_email: testEmail,
          recipient_name: "Test Associate",
          college_name: "Vyntyra Test Campus",
          custom_subject: subjectText,
        },
      });
      toast.success(`Test email sent to ${testEmail}!`);
    } catch (e: any) {
      toast.error(e.message || "Failed to send test email.");
    }
  };

  const handleBulkEmailBroadcast = async () => {
    const targets = interns.filter((i) => selectedEmails.has(i.email));
    if (targets.length === 0) {
      toast.error("Please select at least one recipient.");
      return;
    }

    setIsSending(true);
    setSentCount(0);
    setFailedCount(0);

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      try {
        await sendEmailFn({
          data: {
            recipient_email: target.email,
            recipient_name: target.name,
            college_name: target.college,
            custom_subject: subjectText,
          },
        });
        setSentCount((c) => c + 1);
      } catch (err) {
        console.warn(`Failed sending to ${target.email}:`, err);
        setFailedCount((c) => c + 1);
      }
      await new Promise((res) => setTimeout(res, 1000));
    }

    setIsSending(false);
    toast.success("Broadcast completed!");
    qc.invalidateQueries({ queryKey: ["admin-automated-email-logs"] });
  };

  return (
    <div className="space-y-6">
      {/* ─── Hero Operations Banner ─── */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-slate-950 via-amber-950/20 to-slate-900 p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs font-mono font-bold tracking-widest uppercase">
              <Sparkles className="h-3 w-3" />
              CAMPUS AMBASSADOR OPERATIONS CONTROL
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Campus Ambassador Applications &amp; Email Automation
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Track applicant lifecycle stages (<strong>Under Review</strong>, <strong>Shortlisted</strong>, <strong>Selected / 6-Mo Agreement</strong>, <strong>Enrolled</strong>, <strong>Rejected</strong>) and manage instant automated email dispatch with live template controls.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                internsQuery.refetch();
                registrationsQuery.refetch();
                emailTemplatesQuery.refetch();
              }}
              className="border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white"
            >
              <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
            </Button>
            <a
              href="/campus-ambassador"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-colors"
            >
              <span>Live Landing Page</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* ─── Mode Selector Tabs ─── */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-4">
          <button
            onClick={() => setActiveChannel("registrations")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeChannel === "registrations"
                ? "bg-amber-500 text-slate-950 shadow-md font-black"
                : "bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800"
            }`}
          >
            <Users className="h-4 w-4" /> Applications &amp; Tracking ({registrations.length})
          </button>
          <button
            onClick={() => setActiveChannel("templates")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeChannel === "templates"
                ? "bg-indigo-600 text-white shadow-md font-black"
                : "bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800"
            }`}
          >
            <Settings2 className="h-4 w-4" /> Automated Email Templates Studio
          </button>
          <button
            onClick={() => setActiveChannel("email")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeChannel === "email"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800"
            }`}
          >
            <Mail className="h-4 w-4" /> 1-Click Email Broadcast ({interns.length})
          </button>
          <button
            onClick={() => setActiveChannel("whatsapp")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeChannel === "whatsapp"
                ? "bg-emerald-500 text-white shadow-md"
                : "bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800"
            }`}
          >
            <MessageSquare className="h-4 w-4" /> 1-Click WhatsApp Broadcast
          </button>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ─── TAB 1: APPLICATIONS LIFECYCLE & TRACKING ─────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeChannel === "registrations" && (
        <div className="space-y-6">
          {/* Stage Metric Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { id: "all", label: "Total Applications", count: stageCounts.all, color: "border-slate-300 bg-slate-50 text-slate-900" },
              { id: "under_review", label: "Under Review", count: stageCounts.under_review, color: "border-sky-300 bg-sky-50 text-sky-800" },
              { id: "shortlisted", label: "Shortlisted", count: stageCounts.shortlisted, color: "border-amber-300 bg-amber-50 text-amber-800" },
              { id: "selected", label: "Selected / Signed", count: stageCounts.selected, color: "border-emerald-300 bg-emerald-50 text-emerald-800" },
              { id: "agreement_sent", label: "Agreement Active", count: stageCounts.agreement_sent, color: "border-purple-300 bg-purple-50 text-purple-800" },
              { id: "rejected", label: "Not Shortlisted", count: stageCounts.rejected, color: "border-rose-300 bg-rose-50 text-rose-800" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStageFilter(st.id as LifecycleStage)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${st.color} ${
                  stageFilter === st.id ? "ring-2 ring-amber-500 shadow-md font-bold" : "opacity-85 hover:opacity-100"
                }`}
              >
                <div className="text-[11px] font-semibold text-slate-600 truncate">{st.label}</div>
                <div className="text-xl font-black mt-1">{st.count}</div>
              </button>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, ID, college, state, phone..."
                value={applicantSearch}
                onChange={(e) => setApplicantSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-end">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "under_review", label: "Under Review" },
                  { id: "shortlisted", label: "Shortlisted" },
                  { id: "selected", label: "Selected" },
                  { id: "agreement_sent", label: "Agreement Sent" },
                  { id: "rejected", label: "Rejected" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStageFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    stageFilter === tab.id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Applications Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="p-3">Applicant &amp; Photo</th>
                    <th className="p-3">Contact &amp; Physical Address</th>
                    <th className="p-3">College &amp; Location</th>
                    <th className="p-3">Education &amp; Year</th>
                    <th className="p-3">Video Pitch (Drive)</th>
                    <th className="p-3">Lifecycle Stage &amp; Agreement</th>
                    <th className="p-3 text-right">Operations Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApplicants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-400">
                        No applicants found matching stage <strong>"{stageFilter}"</strong> and query.
                      </td>
                    </tr>
                  ) : (
                    filteredApplicants.map((reg) => {
                      const st = (reg.status || "pending").toLowerCase();
                      return (
                        <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Applicant & Photo */}
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              {reg.portrait_photo_url ? (
                                <img
                                  src={reg.portrait_photo_url}
                                  alt={reg.full_name}
                                  className="w-11 h-11 rounded-full object-cover border-2 border-slate-200 bg-white shadow-sm shrink-0"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                                  {reg.full_name?.charAt(0) || "A"}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-900 text-xs">{reg.full_name}</div>
                                <div className="text-[10px] text-amber-600 font-mono font-bold">
                                  {reg.id}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  {(reg.linkedin_url || reg.linkedin_profile) && (
                                    <a
                                      href={reg.linkedin_url || reg.linkedin_profile}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[10px] text-sky-600 hover:underline font-medium"
                                    >
                                      LinkedIn
                                    </a>
                                  )}
                                  {reg.instagram_url && (
                                    <a
                                      href={
                                        reg.instagram_url.startsWith("http")
                                          ? reg.instagram_url
                                          : `https://instagram.com/${reg.instagram_url.replace("@", "")}`
                                      }
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[10px] text-pink-600 hover:underline font-medium"
                                    >
                                      Instagram
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Contact & Physical Address */}
                          <td className="p-3">
                            <div className="text-slate-900 font-medium">{reg.email}</div>
                            <div className="text-slate-500 text-[11px] font-mono">{reg.phone}</div>
                            {reg.full_address && (
                              <div
                                className="text-[10px] text-slate-500 mt-1 max-w-[220px] line-clamp-2"
                                title={reg.full_address}
                              >
                                🏠 {reg.full_address}
                              </div>
                            )}
                          </td>

                          {/* College & Location */}
                          <td className="p-3">
                            <div className="font-semibold text-slate-900 max-w-[200px] truncate" title={reg.college_name}>
                              {reg.college_name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {reg.college_location || "Campus"}
                            </div>
                            <div className="text-[10px] text-indigo-600 font-medium">
                              {reg.district ? `${reg.district}, ${reg.state}` : reg.city_state}
                            </div>
                          </td>

                          {/* Education & Year */}
                          <td className="p-3">
                            <div className="font-medium text-slate-800">
                              {reg.branch || reg.degree_branch || "Undergraduate"}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {reg.department || "General"} · Grad: {reg.expected_graduation_year || reg.graduation_year || "2026"}
                            </div>
                            {reg.languages_known && (
                              <div className="text-[10px] text-purple-600 mt-0.5">
                                🗣️ {Array.isArray(reg.languages_known) ? reg.languages_known.join(", ") : reg.languages_known}
                              </div>
                            )}
                          </td>

                          {/* Video Pitch Link */}
                          <td className="p-3">
                            {reg.video_pitch_url ? (
                              <a
                                href={reg.video_pitch_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 font-bold text-[11px] transition-colors shadow-sm"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span>Drive Video Pitch</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 text-[11px]">No video pitch link</span>
                            )}
                          </td>

                          {/* Lifecycle Stage & Agreement */}
                          <td className="p-3 space-y-1.5">
                            <div>
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                  st === "shortlisted"
                                    ? "bg-amber-100 text-amber-800 border-amber-300"
                                    : st === "selected" || st === "accepted"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                    : st === "agreement_sent" || st === "enrolled"
                                    ? "bg-purple-100 text-purple-800 border-purple-300"
                                    : st === "rejected"
                                    ? "bg-rose-100 text-rose-800 border-rose-300"
                                    : "bg-sky-100 text-sky-800 border-sky-300"
                                }`}
                              >
                                {st === "shortlisted" && <Sparkles className="h-3 w-3" />}
                                {(st === "selected" || st === "accepted") && <CheckCircle2 className="h-3 w-3" />}
                                {(st === "agreement_sent" || st === "enrolled") && <Award className="h-3 w-3" />}
                                {st === "rejected" && <XCircle className="h-3 w-3" />}
                                {(st === "under_review" || st === "pending") && <Clock className="h-3 w-3" />}
                                <span>{st.replace("_", " ")}</span>
                              </span>
                            </div>

                            <div className="text-[10px] text-emerald-700 flex items-center gap-1 font-medium">
                              <CheckCircle2 className="h-3 w-3 shrink-0" />
                              <span>6-Month Agreement Accepted</span>
                            </div>

                            {reg.notes && (
                              <div className="text-[10px] text-slate-500 italic max-w-[180px] truncate" title={reg.notes}>
                                Note: {reg.notes}
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-3 text-right space-y-1.5">
                            <Button
                              onClick={() => openStatusDialog(reg)}
                              size="sm"
                              className="w-full h-8 px-3 text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold gap-1 cursor-pointer"
                            >
                              <Sliders className="h-3.5 w-3.5" /> Manage Status &amp; Email
                            </Button>

                            <div className="flex items-center gap-1 justify-end">
                              <Button
                                onClick={() => handleOpenWhatsApp(reg.phone, reg.full_name, reg.college_name)}
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[11px] border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1"
                              >
                                <MessageSquare className="h-3 w-3" /> WhatsApp
                              </Button>
                              <a
                                href={`mailto:${reg.email}?subject=${encodeURIComponent(
                                  `Vyntyra Institutional Relations Associate — Application (${reg.id})`
                                )}`}
                                className="inline-flex items-center justify-center gap-1 h-7 px-2 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-300 font-medium"
                              >
                                <Mail className="h-3 w-3" />
                              </a>
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
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ─── TAB 2: AUTOMATED EMAIL TEMPLATES STUDIO ─────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeChannel === "templates" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Template Selector List */}
          <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Automated Status Triggers</h3>
              <p className="text-xs text-slate-500">
                Select a stage to customize the email automatically sent when an applicant is moved to that stage.
              </p>
            </div>

            <div className="space-y-2">
              {(
                [
                  {
                    stage: "under_review",
                    title: "Application Under Review",
                    badge: "Trigger: Under Review",
                    color: "border-sky-300 bg-sky-50 text-sky-900",
                  },
                  {
                    stage: "shortlisted",
                    title: "Candidate Shortlisted",
                    badge: "Trigger: Shortlisted",
                    color: "border-amber-300 bg-amber-50 text-amber-900",
                  },
                  {
                    stage: "selected",
                    title: "Selection & 6-Mo Agreement Sent",
                    badge: "Trigger: Selected / Accepted",
                    color: "border-emerald-300 bg-emerald-50 text-emerald-900",
                  },
                  {
                    stage: "agreement_sent",
                    title: "Agreement Received & Enrolled",
                    badge: "Trigger: Agreement Sent / Enrolled",
                    color: "border-purple-300 bg-purple-50 text-purple-900",
                  },
                  {
                    stage: "rejected",
                    title: "Not Shortlisted / Rejection",
                    badge: "Trigger: Rejected",
                    color: "border-rose-300 bg-rose-50 text-rose-900",
                  },
                ] as const
              ).map((item) => {
                const isSelected = selectedTemplateStage === item.stage;
                const tmpl = emailTemplates.find((t) => t.status_trigger === item.stage);
                const isEnabled = tmpl ? tmpl.is_enabled : true;

                return (
                  <button
                    key={item.stage}
                    onClick={() => setSelectedTemplateStage(item.stage)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/30 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${item.color}`}>
                          {item.badge}
                        </span>
                        {isEnabled ? (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">Disabled</span>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 text-xs mt-1.5">{item.title}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[220px]">
                        {tmpl?.subject || "Default Subject configured"}
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 ${isSelected ? "text-amber-600" : "text-slate-400"}`} />
                  </button>
                );
              })}
            </div>

            {/* Variable Tokens Legend */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-xs text-indigo-950 space-y-2">
              <div className="font-bold text-[11px] uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Dynamic Placeholders
              </div>
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                Use these tokens inside the subject and HTML body. They will be auto-replaced with applicant data upon dispatch:
              </p>
              <div className="grid grid-cols-2 gap-1 text-[10px] font-mono font-semibold">
                <div><code>{"{{full_name}}"}</code></div>
                <div><code>{"{{college_name}}"}</code></div>
                <div><code>{"{{id}}"}</code></div>
                <div><code>{"{{branch}}"}</code></div>
                <div><code>{"{{cohort_name}}"}</code></div>
                <div><code>{"{{agreement_link}}"}</code></div>
              </div>
            </div>
          </div>

          {/* Right: Template Form & Live Preview */}
          <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
            {editingTemplate ? (
              <div className="space-y-4">
                {/* Header & Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {editingTemplate.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Configuring automated notification for status: <strong>{editingTemplate.status_trigger}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700">Automated Dispatch:</span>
                    <Switch
                      checked={editingTemplate.is_enabled}
                      onCheckedChange={(checked) =>
                        setEditingTemplate({ ...editingTemplate, is_enabled: checked })
                      }
                    />
                    <span className={`text-xs font-bold ${editingTemplate.is_enabled ? "text-emerald-600" : "text-slate-400"}`}>
                      {editingTemplate.is_enabled ? "ENABLED" : "PAUSED"}
                    </span>
                  </div>
                </div>

                {/* Subject Line */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Email Subject Line *
                  </label>
                  <Input
                    value={editingTemplate.subject}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                    className="text-xs h-9 font-medium"
                    placeholder="Subject..."
                  />
                </div>

                {/* Agreement Document URL (if selected/agreement_sent) */}
                {(editingTemplate.status_trigger === "selected" ||
                  editingTemplate.status_trigger === "agreement_sent") && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      6-Month Association Agreement Document Link (PDF / DocuSign / Drive)
                    </label>
                    <Input
                      value={editingTemplate.agreement_url || ""}
                      onChange={(e) =>
                        setEditingTemplate({ ...editingTemplate, agreement_url: e.target.value })
                      }
                      className="text-xs h-9 font-medium"
                      placeholder="https://..."
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Injected into <code>{"{{agreement_link}}"}</code> for candidate review and digital sign-off.
                    </p>
                  </div>
                )}

                {/* Email Body HTML */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Email Body Content (HTML Supported) *
                  </label>
                  <Textarea
                    rows={8}
                    value={editingTemplate.body_html}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, body_html: e.target.value })
                    }
                    className="text-xs font-mono leading-relaxed"
                  />
                </div>

                {/* Rendered Preview Box */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Real-Time Rendered Preview
                  </label>
                  <div className="border rounded-xl p-4 bg-slate-950 text-white space-y-2 text-xs">
                    <div className="text-[11px] text-slate-400 pb-2 border-b border-slate-800">
                      Subject:{" "}
                      <span className="text-amber-400 font-bold">
                        {editingTemplate.subject
                          .replace("{{full_name}}", "Rahul Sharma")
                          .replace("{{college_name}}", "Andhra University")
                          .replace("{{cohort_name}}", "First Cohort 2026-27")}
                      </span>
                    </div>
                    <div
                      className="prose prose-invert prose-xs max-w-none text-slate-300"
                      dangerouslySetInnerHTML={{
                        __html: editingTemplate.body_html
                          .replace(/\{\{full_name\}\}/g, "Rahul Sharma")
                          .replace(/\{\{college_name\}\}/g, "Andhra University")
                          .replace(/\{\{id\}\}/g, "VCS-IRA-2026-0042")
                          .replace(
                            /\{\{agreement_link\}\}/g,
                            editingTemplate.agreement_url || "#"
                          ),
                      }}
                    />
                  </div>
                </div>

                {/* Footer Controls: Test Email & Save */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Input
                      placeholder="Enter test email..."
                      value={testTemplateEmail}
                      onChange={(e) => setTestTemplateEmail(e.target.value)}
                      className="text-xs h-9 w-52"
                    />
                    <Button
                      onClick={handleSendTemplateTestEmail}
                      disabled={isSendingTemplateTest}
                      size="sm"
                      variant="outline"
                      className="h-9 text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-50 shrink-0 cursor-pointer"
                    >
                      {isSendingTemplateTest ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5 mr-1" />
                      )}
                      Send Test
                    </Button>
                  </div>

                  <Button
                    onClick={handleSaveTemplate}
                    disabled={isSavingTemplate}
                    className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs h-9 px-6 rounded-xl shadow-md cursor-pointer"
                  >
                    {isSavingTemplate ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Check className="h-4 w-4" /> Save Template &amp; Activate
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-10 text-center text-slate-400">Select a template on the left to edit.</div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ─── TAB 3: EMAIL BROADCAST MODE (INTERNS) ───────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeChannel === "email" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Audience Selector */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Select Target Audience</h3>
                <p className="text-xs text-slate-500">
                  {selectedEmails.size} of {filteredInterns.length} interns selected
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="text-xs h-8 gap-1.5 border-slate-300"
              >
                {selectedEmails.size === filteredInterns.length ? (
                  <>
                    <CheckSquare className="h-3.5 w-3.5 text-amber-600" /> Deselect All
                  </>
                ) : (
                  <>
                    <Square className="h-3.5 w-3.5" /> Select All ({filteredInterns.length})
                  </>
                )}
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search intern name, college, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 border rounded-xl">
              {filteredInterns.map((intern, i) => {
                const isSelected = selectedEmails.has(intern.email);
                return (
                  <div
                    key={i}
                    onClick={() => toggleSelectOne(intern.email)}
                    className={`p-3 flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                      isSelected ? "bg-amber-50/70" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{intern.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{intern.email}</div>
                        {intern.college && (
                          <div className="text-[10px] text-slate-400 truncate">{intern.college}</div>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {intern.phone ? intern.phone.slice(-4).padStart(intern.phone.length, "*") : ""}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Test Email Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5 text-amber-600" />
                Send Single Test Email
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="admin@vyntyraconsultancyservices.in"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="text-xs h-9"
                />
                <Button
                  onClick={handleSendTestEmail}
                  size="sm"
                  variant="outline"
                  className="text-xs h-9 shrink-0 border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  <Send className="h-3.5 w-3.5 mr-1" /> Test
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Email Template & Broadcast Control */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Subject Line
                </label>
                <Input
                  value={subjectText}
                  onChange={(e) => setSubjectText(e.target.value)}
                  className="text-xs h-9 font-medium"
                />
              </div>

              {/* Email Content Preview */}
              <div className="border rounded-xl p-4 bg-slate-950 text-white space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px]">
                  <span className="font-bold text-amber-400">✨ FIRST COHORT 2026-27</span>
                  <span className="text-slate-400">Official Preview</span>
                </div>
                <div className="text-sm font-bold text-white">
                  Vyntyra Institutional Relations Associate (Campus Ambassador Program)
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Hi [Candidate Name], represent Vyntyra at your institution. Unlock exclusive welcome kits (dispatched after 1st milestone only), earn rewards up to ₹15,000, win branded electronic gadgets, and qualify for an all-expenses-paid curated travel retreat for Top 10.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                  <div>🎁 IRA Welcome Kit (After 1st Milestone)</div>
                  <div>👕 Corporate Swags (After 1st Milestone)</div>
                  <div className="text-emerald-400">💰 Earn up to ₹15,000 Rewards*</div>
                  <div className="text-sky-400">⚡ Branded Electronic Gadgets</div>
                  <div className="text-pink-400">✈️ Top 10 Curated Travel Retreat</div>
                  <div>📜 Dual Certificate of Recognition</div>
                  <div className="col-span-2 text-amber-400 font-semibold text-[10px] pt-1 border-t border-slate-800/80">
                    ⭐ Official swags and welcome kits will be dispatched after reaching 1st milestone only.
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <span className="inline-block px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider">
                    Pre-Register for First Cohort &rarr;
                  </span>
                </div>
              </div>
            </div>

            {/* Broadcast Action Box */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Target: {selectedEmails.size} Interns Selected
                </div>
                {isSending && (
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Progress: {sentCount} sent, {failedCount} failed
                  </div>
                )}
              </div>

              <Button
                disabled={isSending || selectedEmails.size === 0}
                onClick={handleBulkEmailBroadcast}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs px-6 h-10 rounded-xl shadow-md cursor-pointer"
              >
                {isSending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Broadcasting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" /> 1-Click Send Email Broadcast ({selectedEmails.size})
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ─── TAB 4: WHATSAPP BROADCAST MODE ──────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeChannel === "whatsapp" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Interns List for WhatsApp */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Registered Interns &amp; Contacts</h3>
                <p className="text-xs text-slate-500">{filteredInterns.length} interns loaded</p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search intern name, college, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100 border rounded-xl">
              {filteredInterns.map((intern, i) => (
                <div
                  key={i}
                  className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{intern.name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Phone className="h-3 w-3 text-emerald-600" />
                      <span>{intern.phone || "No phone recorded"}</span>
                    </div>
                    {intern.college && (
                      <div className="text-[10px] text-slate-400 truncate">{intern.college}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      onClick={() => handleCopyWhatsApp(intern.name, intern.college)}
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 text-[11px] border-slate-200"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={() => handleOpenWhatsApp(intern.phone, intern.name, intern.college)}
                      size="sm"
                      className="h-8 px-3 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1"
                    >
                      <MessageSquare className="h-3 w-3" /> Send
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: WhatsApp Copy Preview & Fast Copy */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-emerald-600" />
                  Pre-Formatted WhatsApp Copy (First Cohort)
                </h3>
                <Button
                  onClick={() => handleCopyWhatsApp("Candidate", "Your College")}
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy Broadcast Text
                </Button>
              </div>

              {/* Chat Bubble Preview */}
              <div className="p-4 rounded-2xl bg-[#0b141a] text-[#e9edef] border border-[#202c33] font-mono text-xs whitespace-pre-line leading-relaxed shadow-inner max-h-[420px] overflow-y-auto">
                {generateWhatsAppMessage("Rahul Sharma", "Andhra University, Vizag")}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
              <span>Click <strong>Send</strong> on any intern card to directly launch WhatsApp Web with this customized text.</span>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ─── MODAL: MANAGE STATUS & DISPATCH AUTOMATED EMAIL ─────────── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-amber-600" />
              Manage Application Lifecycle &amp; Email Dispatch
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update candidate status and optionally trigger the configured automated notification email.
            </DialogDescription>
          </DialogHeader>

          {selectedApplicant && (
            <div className="space-y-4 py-2 text-xs">
              {/* Applicant Card Summary */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {selectedApplicant.full_name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {selectedApplicant.email} · {selectedApplicant.phone}
                  </div>
                  <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                    {selectedApplicant.college_name} ({selectedApplicant.district}, {selectedApplicant.state})
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-mono">ID: {selectedApplicant.id}</div>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold mt-1">
                    Current: {selectedApplicant.status || "pending"}
                  </Badge>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Select New Lifecycle Stage *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { val: "under_review", label: "Under Review", icon: Clock },
                    { val: "shortlisted", label: "Shortlisted", icon: Sparkles },
                    { val: "selected", label: "Selected", icon: CheckCircle2 },
                    { val: "agreement_sent", label: "Agreement Sent", icon: Award },
                    { val: "rejected", label: "Rejected", icon: XCircle },
                  ].map((item) => {
                    const isPicked = newStatus === item.val;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setNewStatus(item.val as any)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          isPicked
                            ? "border-amber-500 bg-amber-500 text-slate-950 shadow-sm"
                            : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Agreement Document URL (conditional) */}
              {(newStatus === "selected" || newStatus === "agreement_sent") && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    6-Month Agreement Document URL
                  </label>
                  <Input
                    value={agreementUrl}
                    onChange={(e) => setAgreementUrl(e.target.value)}
                    placeholder="https://..."
                    className="h-9 text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    This link will be included in the automated selection email for candidate digital acceptance.
                  </p>
                </div>
              )}

              {/* Review Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Internal Reviewer Notes
                </label>
                <Textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Excellent video pitch, demonstrated strong campus leadership..."
                  className="text-xs"
                />
              </div>

              {/* Automated Email Toggle & Preview */}
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-amber-700" />
                    <span className="font-bold text-slate-900 text-xs">
                      Send Automated Email to Candidate
                    </span>
                  </div>
                  <Switch checked={triggerEmail} onCheckedChange={setTriggerEmail} />
                </div>

                {triggerEmail && (
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    An email will be dispatched to <strong>{selectedApplicant.email}</strong> using the automated template configured for <strong>"{newStatus}"</strong>.
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setStatusModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveStatusWithEmail}
              disabled={isUpdatingStatus}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
            >
              {isUpdatingStatus ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4" /> Save Status &amp; Notify
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
