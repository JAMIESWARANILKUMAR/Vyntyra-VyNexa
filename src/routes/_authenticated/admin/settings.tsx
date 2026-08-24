import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { 
  Loader2, Settings2, ShieldCheck, CreditCard, Lock, ArrowLeft, Save, 
  RefreshCw, FileText, Tag, Percent, Plus, Search, Users, CheckCircle2, 
  Trash2, Edit3, TrendingUp, Sparkles, AlertCircle, DollarSign, Check,
  Mail, MessageSquare, Send, Award, Image, Upload, ExternalLink, Globe2,
  CheckCheck, Layers
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  getDashboardSettings, updateDashboardSetting, updateInternFeeSettings, 
  initializeDashboardSettings, listTeamMembers, purgeAllNocs,
  listAllReferralPricingRules, upsertReferralPricingRule, deleteReferralPricingRule,
  sendUrgentPaymentPopupNotification
} from "@/lib/operations.functions";
import { getBrandingSettings, updateBrandingSettings } from "@/lib/settings.functions";
import { 
  listCareerDomains, addOrUpdateCareerDomain, removeCareerDomainOrSubdomain, 
  saveCareerDomains, type DomainItem, DEFAULT_CAREER_DOMAINS 
} from "@/lib/domains.functions";
import { 
  sendPaymentReminderEmail, sendBulkPaymentReminderEmails, 
  generatePaymentReminderWhatsApp 
} from "@/lib/notifications-omni.functions";
import { generateNocPdf, urlToBase64 } from "@/lib/nocGenerator";
import { saveNocPdf, updateNocUrl } from "@/lib/noc.functions";
import { localDateTimeToIso, isoToLocalDateTimeInput, formatDateTimeDisplay } from "@/lib/date-utils";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const qc = useQueryClient();
  const fetchDashboardSettings = useServerFn(getDashboardSettings);
  const doUpdateDashboardSetting = useServerFn(updateDashboardSetting);
  const doUpdateInternFeeSettings = useServerFn(updateInternFeeSettings);
  const doInitializeDashboardSettings = useServerFn(initializeDashboardSettings);
  const fetchTeamMembers = useServerFn(listTeamMembers);
  const doPurgeAllNocs = useServerFn(purgeAllNocs);

  const fetchReferralPricingRules = useServerFn(listAllReferralPricingRules);
  const doUpsertReferralPricingRule = useServerFn(upsertReferralPricingRule);
  const doDeleteReferralPricingRule = useServerFn(deleteReferralPricingRule);
  const doSendUrgentPopup = useServerFn(sendUrgentPaymentPopupNotification);

  const fetchBranding = useServerFn(getBrandingSettings);
  const doUpdateBranding = useServerFn(updateBrandingSettings);
  const fetchDomains = useServerFn(listCareerDomains);
  const doAddOrUpdateDomain = useServerFn(addOrUpdateCareerDomain);
  const doRemoveDomain = useServerFn(removeCareerDomainOrSubdomain);
  const doSaveNocPdf = useServerFn(saveNocPdf);
  const doUpdateNocUrl = useServerFn(updateNocUrl);
  const doSendPaymentEmail = useServerFn(sendPaymentReminderEmail);
  const doSendBulkPaymentEmails = useServerFn(sendBulkPaymentReminderEmails);
  const doGenWhatsApp = useServerFn(generatePaymentReminderWhatsApp);
  
  const [targetType, setTargetType] = useState<"single" | "selected" | "all">("single");
  const [internId, setInternId] = useState("");
  const [selectedInternIds, setSelectedInternIds] = useState<string[]>([]);
  const [examFeeAmount, setExamFeeAmount] = useState<number>(199);
  const [isFeeExempted, setIsFeeExempted] = useState(false);
  const [examFeePaid, setExamFeePaid] = useState(false);
  const [feePaymentScheduled, setFeePaymentScheduled] = useState(false);
  const [feePaymentDeadline, setFeePaymentDeadline] = useState("");
  const [isPaymentEnabled, setIsPaymentEnabled] = useState(false);

  // Urgent Popup Notification Modal State
  const [isPopupModalOpen, setIsPopupModalOpen] = useState(false);
  const [isSendingPopup, setIsSendingPopup] = useState(false);
  const [popupForm, setPopupForm] = useState({
    targetType: "all_unpaid" as "all_unpaid" | "selected" | "single",
    title: "Urgent: Exam Fee Payment Required",
    message: "Exam fee is payable to receive certificate and stipend will be provided for top 10% interns up to ₹5,000 to ₹15,000 (terms and eligibility apply). Once the payment is done, only then your dashboard will be fully functional.",
    deadline: "",
  });

  // Referral code management state
  const [referralSearch, setReferralSearch] = useState("");
  const [internFeeSearch, setInternFeeSearch] = useState("");
  const [internFeeFilter, setInternFeeFilter] = useState<"all" | "scheduled" | "unpaid" | "paid" | "exempted">("all");
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isSavingReferral, setIsSavingReferral] = useState(false);
  const [referralForm, setReferralForm] = useState({
    id: "",
    code: "",
    referrer_name: "",
    custom_exam_fee: 199,
    discount_amount: 0,
    commission_reward: 50,
    is_active: true,
    notes: "",
    sync_to_existing_interns: true,
  });
  
  const settingsQ = useQuery({
    queryKey: ["admin-dashboard-settings"],
    queryFn: () => fetchDashboardSettings(),
  });

  const membersQ = useQuery({
    queryKey: ["admin-intern-list"],
    queryFn: () => fetchTeamMembers(),
  });

  const referralRulesQ = useQuery({
    queryKey: ["admin-referral-pricing-rules"],
    queryFn: () => fetchReferralPricingRules(),
    refetchInterval: 15000,
  });

  const brandingQ = useQuery({
    queryKey: ["admin-branding-settings"],
    queryFn: () => fetchBranding(),
  });

  const domainsQ = useQuery({
    queryKey: ["admin-career-domains"],
    queryFn: () => fetchDomains(),
  });

  const [brandingForm, setBrandingForm] = useState({
    founder_signature_url: "/signature.png",
    vyntyra_logo_url: "/icon-512.png",
    founder_name: "Jami Eswar Anil Kumar",
    founder_title: "Founder & Managing Director",
  });

  useEffect(() => {
    if (brandingQ.data) {
      setBrandingForm({
        founder_signature_url: brandingQ.data.founder_signature_url || "/signature.png",
        vyntyra_logo_url: brandingQ.data.vyntyra_logo_url || "/icon-512.png",
        founder_name: brandingQ.data.founder_name || "Jami Eswar Anil Kumar",
        founder_title: brandingQ.data.founder_title || "Founder & Managing Director",
      });
    }
  }, [brandingQ.data]);

  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [isBulkSendingEmail, setIsBulkSendingEmail] = useState(false);

  // Individual Payment Reminder Modal State
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isSendingReminderEmail, setIsSendingReminderEmail] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    internId: "",
    name: "",
    email: "",
    phone: "",
    amount: 199,
    deadline: "",
    customSubject: "",
    customNote: "",
  });

  function openPaymentReminderModal(intern: any) {
    setReminderForm({
      internId: intern.id,
      name: intern.full_name || "",
      email: intern.email || "",
      phone: intern.phone || intern.phone_number || "",
      amount: intern.exam_fee_amount !== undefined ? intern.exam_fee_amount : 199,
      deadline: isoToLocalDateTimeInput(intern.fee_payment_deadline),
      customSubject: `Urgent: Exam Fee Payment Reminder (₹${intern.exam_fee_amount !== undefined ? intern.exam_fee_amount : 199}) — Project VyNexa`,
      customNote: "",
    });
    setIsReminderModalOpen(true);
  }

  async function handleSendReminderEmailFromModal() {
    if (!reminderForm.email) return toast.error("Intern email is missing.");
    setIsSendingReminderEmail(true);
    try {
      await doSendPaymentEmail({
        data: {
          recipient_email: reminderForm.email,
          recipient_name: reminderForm.name,
          recipient_phone: reminderForm.phone,
          intern_id: reminderForm.internId,
          exam_fee_amount: reminderForm.amount,
          payment_deadline: reminderForm.deadline ? localDateTimeToIso(reminderForm.deadline) : null,
          custom_subject: reminderForm.customSubject,
          custom_note: reminderForm.customNote,
        },
      });
      toast.success(`Payment reminder email sent successfully to ${reminderForm.email}!`);
      setIsReminderModalOpen(false);
    } catch (err: any) {
      toast.error("Failed to send email: " + err.message);
    } finally {
      setIsSendingReminderEmail(false);
    }
  }

  async function handleSendReminderWhatsAppFromModal() {
    if (!reminderForm.phone) return toast.error("Please enter a phone number for WhatsApp.");
    try {
      const res = await doGenWhatsApp({
        data: {
          recipientPhone: reminderForm.phone,
          recipientName: reminderForm.name,
          examFeeAmount: reminderForm.amount,
          paymentDeadline: reminderForm.deadline ? localDateTimeToIso(reminderForm.deadline) : null,
        },
      });
      window.open(res.whatsappUrl, "_blank");
    } catch (err: any) {
      toast.error("Failed to prepare WhatsApp message: " + err.message);
    }
  }

  // Dynamic Domain management form state
  const [domainNameInput, setDomainNameInput] = useState("");
  const [domainCategoryInput, setDomainCategoryInput] = useState<"Internship" | "Full Time Role" | "Both">("Both");
  const [domainIsNewInput, setDomainIsNewInput] = useState(true);
  const [selectedParentDomain, setSelectedParentDomain] = useState("");
  const [subdomainNameInput, setSubdomainNameInput] = useState("");
  const [subdomainIsNewInput, setSubdomainIsNewInput] = useState(true);
  const [isSavingDomain, setIsSavingDomain] = useState(false);

  async function handleSaveBranding(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingBranding(true);
    try {
      await doUpdateBranding({ data: brandingForm });
      toast.success("Founder Signature and Vyntyra Logo settings updated successfully!");
      qc.invalidateQueries({ queryKey: ["admin-branding-settings"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update branding settings");
    } finally {
      setIsSavingBranding(false);
    }
  }

  async function handleAddDomain() {
    if (!domainNameInput.trim()) return toast.error("Please enter a domain name.");
    setIsSavingDomain(true);
    try {
      await doAddOrUpdateDomain({
        data: {
          domainName: domainNameInput.trim(),
          category: domainCategoryInput,
          isNew: domainIsNewInput,
        },
      });
      toast.success(`Domain "${domainNameInput}" added successfully!`);
      setDomainNameInput("");
      qc.invalidateQueries({ queryKey: ["admin-career-domains"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to add domain");
    } finally {
      setIsSavingDomain(false);
    }
  }

  async function handleAddSubdomain() {
    if (!selectedParentDomain) return toast.error("Please choose a primary domain.");
    if (!subdomainNameInput.trim()) return toast.error("Please enter a sub-domain track name.");
    setIsSavingDomain(true);
    try {
      await doAddOrUpdateDomain({
        data: {
          domainName: selectedParentDomain,
          subdomainName: subdomainNameInput.trim(),
          isNew: subdomainIsNewInput,
        },
      });
      toast.success(`Sub-domain "${subdomainNameInput}" added under ${selectedParentDomain}!`);
      setSubdomainNameInput("");
      qc.invalidateQueries({ queryKey: ["admin-career-domains"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to add sub-domain");
    } finally {
      setIsSavingDomain(false);
    }
  }

  async function handleDeleteDomainOrSubdomain(domainId: string, subdomainId?: string) {
    if (!confirm(`Are you sure you want to delete this ${subdomainId ? "sub-domain" : "domain"}?`)) return;
    try {
      await doRemoveDomain({ data: { domainId, subdomainId } });
      toast.success(`${subdomainId ? "Sub-domain" : "Domain"} removed successfully.`);
      qc.invalidateQueries({ queryKey: ["admin-career-domains"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to remove domain");
    }
  }

  async function handleBulkPaymentReminders() {
    if (!confirm("Send personalized Payment Reminder emails with 'Pay Exam Fee Online' buttons to all unpaid interns?")) return;
    setIsBulkSendingEmail(true);
    try {
      const res = await doSendBulkPaymentEmails({ data: { targetType: "all_unpaid" } });
      toast.success(res.message);
    } catch (err: any) {
      toast.error(err.message || "Failed to send bulk reminders");
    } finally {
      setIsBulkSendingEmail(false);
    }
  }

  async function handleSendIndividualPaymentEmail(intern: any) {
    const loadingToast = toast.loading(`Sending payment reminder email to ${intern.email}...`);
    try {
      await doSendPaymentEmail({
        data: {
          recipient_email: intern.email,
          recipient_name: intern.full_name,
          recipient_phone: intern.phone || intern.phone_number,
          intern_id: intern.intern_id,
          exam_fee_amount: intern.exam_fee_amount !== undefined ? intern.exam_fee_amount : 199,
          payment_deadline: intern.fee_payment_deadline,
        },
      });
      toast.dismiss(loadingToast);
      toast.success(`Payment reminder email sent to ${intern.email}!`);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error("Failed to send email: " + err.message);
    }
  }

  async function handleSendIndividualWhatsApp(intern: any) {
    const phone = intern.phone || intern.phone_number;
    if (!phone) return toast.error("No phone number found for this intern.");
    try {
      const res = await doGenWhatsApp({
        data: {
          recipientPhone: phone,
          recipientName: intern.full_name,
          examFeeAmount: intern.exam_fee_amount !== undefined ? intern.exam_fee_amount : 199,
          paymentDeadline: intern.fee_payment_deadline,
        },
      });
      window.open(res.whatsappUrl, "_blank");
    } catch (err: any) {
      toast.error("Failed to prepare WhatsApp reminder: " + err.message);
    }
  }

  async function handleGenerateIndividualNoc(intern: any) {
    const loadingToast = toast.loading(`Generating customized NOC for ${intern.full_name || intern.email}...`);
    try {
      const QRCode = (await import("qrcode")).default;
      const verificationUrl = `https://careers.vyntyraconsultancyservices.in/verify?id=${intern.id}`;
      const qrBase64 = await QRCode.toDataURL(verificationUrl, { margin: 1, color: { dark: "#0f172a", light: "#ffffff" } });

      const sigUrl = brandingForm.founder_signature_url || "/signature.png";
      const logoUrl = brandingForm.vyntyra_logo_url || "/icon-512.png";
      const signatureBase64 = await urlToBase64(sigUrl, 260, 80, true);
      const logoBase64 = await urlToBase64(logoUrl, 160, 160, false);
      let photoUrl = intern.profile_photo_url || intern.avatar_url || intern.photo_url || null;
      if (!photoUrl) {
        try {
          const { supabase } = await import("@/integrations/supabase/client");
          const { data: appRec } = await supabase
            .from("applications")
            .select("profile_photo_url")
            .or(`id.eq.${intern.id},email.eq.${intern.email}`)
            .maybeSingle();
          if (appRec?.profile_photo_url) {
            photoUrl = appRec.profile_photo_url;
          }
        } catch (e) {
          console.warn("Photo fallback lookup error:", e);
        }
      }

      const photoBase64 = photoUrl ? await urlToBase64(photoUrl, 180, 220, false) : null;

      const selectionDate = intern.created_at ? new Date(intern.created_at) : new Date();
      const calcStartDate = intern.start_date ? new Date(intern.start_date) : new Date(selectionDate.getTime() + 4 * 24 * 60 * 60 * 1000);
      const formattedStartDate = calcStartDate.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

      const doc = generateNocPdf({
        fullName: intern.full_name || "Intern Candidate",
        email: intern.email || "",
        phone: intern.phone || intern.phone_number || "",
        applicationId: intern.id,
        college: intern.college || "Academic Institution",
        domain: intern.department || "Technology & Software",
        subDomain: intern.position || "Full Stack Web Development",
        internshipStartDate: formattedStartDate,
        profilePhotoUrl: photoBase64,
        qrCodeBase64: qrBase64,
        logoBase64: logoBase64,
        signatureBase64: signatureBase64,
        hodName: intern.hod_name || null,
      });

      const pdfBlob = doc.output("blob");
      const filepath = `nocs/${intern.id}_NOC.pdf`;

      let uploadSuccess = false;
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { error: storageError } = await supabase.storage
          .from("default")
          .upload(filepath, pdfBlob, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (!storageError) {
          const { data: { publicUrl } } = supabase.storage.from("default").getPublicUrl(filepath);
          await doUpdateNocUrl({ data: { applicationId: intern.id, publicUrl } });
          uploadSuccess = true;
        }
      } catch (clientUploadErr) {
        console.warn("Client storage upload failed, using server fallback:", clientUploadErr);
      }

      if (!uploadSuccess) {
        const pdfDataUri = doc.output("datauristring");
        await doSaveNocPdf({ data: { applicationId: intern.id, pdfBase64: pdfDataUri } });
      }

      toast.dismiss(loadingToast);
      toast.success(`NOC successfully generated and assigned to ${intern.full_name}!`);
      membersQ.refetch();
      doc.save(`NOC_${(intern.full_name || "Intern").replace(/\s+/g, "_")}_Vyntyra.pdf`);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error("Failed to generate NOC: " + err.message);
    }
  }

  const allInterns = (membersQ.data || []).filter((m: any) => 
    m.role === "intern" || 
    (m.department || "").toLowerCase().includes("intern") || 
    (m.position || "").toLowerCase().includes("intern")
  );

  const updateSettingsMut = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string, is_enabled: boolean }) => {
      await doUpdateDashboardSetting({ data: { id, is_enabled } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-dashboard-settings"] });
      toast.success("Dashboard setting updated!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  async function handleInitialize() {
    try {
      const res = await doInitializeDashboardSettings();
      if (res.count > 0) {
        toast.success(`Initialized ${res.count} default module settings!`);
        qc.invalidateQueries({ queryKey: ["admin-dashboard-settings"] });
      } else {
        toast.info("All modules are already initialized.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to initialize settings.");
    }
  }

  async function handleUpdateFee() {
    if (targetType === "single" && !internId) return toast.error("Please provide an Intern ID.");
    if (targetType === "selected" && selectedInternIds.length === 0) return toast.error("Please select at least one intern.");
    
    try {
      let finalInternIds: string[] | undefined = undefined;
      if (targetType === "all") finalInternIds = allInterns.map((i: any) => i.id);
      if (targetType === "selected") finalInternIds = selectedInternIds;

      await doUpdateInternFeeSettings({
        data: {
          internId: targetType === "single" ? internId : undefined,
          internIds: finalInternIds,
          exam_fee_amount: examFeeAmount,
          is_fee_exempted: isFeeExempted,
          exam_fee_paid: examFeePaid,
          fee_payment_scheduled: feePaymentScheduled,
          fee_payment_deadline: feePaymentDeadline ? localDateTimeToIso(feePaymentDeadline) : null,
          is_payment_enabled: isPaymentEnabled
        }
      });
      toast.success("Fee settings and deadline updated successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to update fee settings.");
    }
  }

  async function handleSendUrgentPopup(e: React.FormEvent) {
    e.preventDefault();
    if (!popupForm.title.trim()) return toast.error("Please enter a title.");
    if (!popupForm.message.trim()) return toast.error("Please enter a message.");

    setIsSendingPopup(true);
    try {
      let finalInternIds: string[] | undefined = undefined;
      if (popupForm.targetType === "selected") finalInternIds = selectedInternIds;

      const res = await doSendUrgentPopup({
        data: {
          targetType: popupForm.targetType,
          internId: popupForm.targetType === "single" ? internId : undefined,
          internIds: finalInternIds,
          title: popupForm.title.trim(),
          message: popupForm.message.trim(),
          deadline: popupForm.deadline ? localDateTimeToIso(popupForm.deadline) || undefined : (feePaymentDeadline ? localDateTimeToIso(feePaymentDeadline) || undefined : undefined),
        }
      });
      toast.success(res.message || "Urgent onscreen popup notification dispatched!");
      setIsPopupModalOpen(false);
      qc.invalidateQueries();
    } catch (err: any) {
      toast.error(err.message || "Failed to send popup alert.");
    } finally {
      setIsSendingPopup(false);
    }
  }

  async function handleSaveReferralRule(e: React.FormEvent) {
    e.preventDefault();
    if (!referralForm.code.trim()) return toast.error("Please enter a referral code.");
    
    setIsSavingReferral(true);
    try {
      await doUpsertReferralPricingRule({
        data: {
          id: referralForm.id || undefined,
          code: referralForm.code.trim().toUpperCase(),
          referrer_name: referralForm.referrer_name.trim() || undefined,
          custom_exam_fee: Number(referralForm.custom_exam_fee),
          discount_amount: Number(referralForm.discount_amount),
          commission_reward: Number(referralForm.commission_reward),
          is_active: referralForm.is_active,
          notes: referralForm.notes.trim() || undefined,
          sync_to_existing_interns: referralForm.sync_to_existing_interns,
        }
      });
      toast.success(`Referral pricing for "${referralForm.code.toUpperCase()}" saved successfully!`);
      setIsReferralModalOpen(false);
      setReferralForm({
        id: "",
        code: "",
        referrer_name: "",
        custom_exam_fee: 199,
        discount_amount: 0,
        commission_reward: 50,
        is_active: true,
        notes: "",
        sync_to_existing_interns: true,
      });
      qc.invalidateQueries({ queryKey: ["admin-referral-pricing-rules"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to save referral pricing rule.");
    } finally {
      setIsSavingReferral(false);
    }
  }

  async function handleDeleteReferralRule(code: string) {
    if (!confirm(`Are you sure you want to remove custom pricing rule for "${code}"? Standard fee of ₹199 will apply.`)) return;
    try {
      await doDeleteReferralPricingRule({ data: { code } });
      toast.success(`Referral pricing rule for ${code} removed.`);
      qc.invalidateQueries({ queryKey: ["admin-referral-pricing-rules"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete rule.");
    }
  }

  const referralRules: any[] = referralRulesQ.data || [];
  const filteredReferralRules = referralRules.filter((r) => {
    if (!referralSearch.trim()) return true;
    const q = referralSearch.toLowerCase();
    return (
      (r.code || "").toLowerCase().includes(q) ||
      (r.referrer_name || "").toLowerCase().includes(q) ||
      (r.notes || "").toLowerCase().includes(q)
    );
  });

  const totalConversions = referralRules.reduce((acc, r) => acc + (r.usage_count || 0), 0);
  const totalCustomRules = referralRules.filter(r => r.is_custom_rule).length;

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Settings2 className="h-5 w-5 text-primary" />
            <span className="font-semibold text-primary">System, Pricing & Referral Controls</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => qc.invalidateQueries()} className="gap-1.5 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh All
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-8">
        
        {/* ─── REFERRAL CODES & DYNAMIC PRICING HUB ─── */}
        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden border-indigo-100">
          <div className="p-5 border-b bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Referral Codes & Dynamic Pricing Hub</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customize intern exam fee, discounts, and rewards by referral ID or create promotional campus codes.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                onClick={() => {
                  setReferralForm({
                    id: "",
                    code: "",
                    referrer_name: "",
                    custom_exam_fee: 99,
                    discount_amount: 100,
                    commission_reward: 50,
                    is_active: true,
                    notes: "Campus Special Promo",
                    sync_to_existing_interns: true,
                  });
                  setIsReferralModalOpen(true);
                }} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-xs font-semibold text-xs h-9"
              >
                <Plus className="h-4 w-4" /> Add Referral Code / Custom Pricing
              </Button>
            </div>
          </div>

          {/* Key Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x border-b bg-slate-50/60 text-xs">
            <div className="p-4">
              <span className="text-slate-500 font-medium block">Total Referral Codes</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">{referralRules.length}</span>
            </div>
            <div className="p-4">
              <span className="text-slate-500 font-medium block">Custom Pricing Rules</span>
              <span className="text-xl font-bold text-indigo-600 mt-1 block">{totalCustomRules}</span>
            </div>
            <div className="p-4">
              <span className="text-slate-500 font-medium block">Total Conversions / Uses</span>
              <span className="text-xl font-bold text-emerald-600 mt-1 block">{totalConversions}</span>
            </div>
            <div className="p-4">
              <span className="text-slate-500 font-medium block">Default Standard Fee</span>
              <span className="text-xl font-bold text-slate-800 mt-1 block">₹199</span>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <Input 
                  placeholder="Search by code, referrer name, or notes..." 
                  value={referralSearch} 
                  onChange={(e) => setReferralSearch(e.target.value)} 
                  className="pl-9 text-xs h-9"
                />
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Interns who apply with these codes automatically receive the configured custom exam fee.
              </div>
            </div>

            {/* Referral Table */}
            {referralRulesQ.isLoading ? (
              <div className="p-12 flex items-center justify-center gap-2 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" /> Loading referral pricing matrix...
              </div>
            ) : filteredReferralRules.length === 0 ? (
              <div className="p-12 text-center text-slate-400 border rounded-xl bg-slate-50/50">
                <Tag className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p className="font-semibold text-sm text-slate-700">No referral codes found</p>
                <p className="text-xs text-slate-400 mt-1">Create your first custom referral code or pricing override above.</p>
              </div>
            ) : (
              <div className="border rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-700 font-bold border-b text-[11px] uppercase tracking-wider">
                        <th className="p-3.5">Referral Code</th>
                        <th className="p-3.5">Referrer / Owner</th>
                        <th className="p-3.5">Exam Fee (₹)</th>
                        <th className="p-3.5">Discount</th>
                        <th className="p-3.5">Reward</th>
                        <th className="p-3.5">Usage / Hired</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredReferralRules.map((rule) => {
                        const isCustom = rule.is_custom_rule;
                        return (
                          <tr key={rule.code} className="hover:bg-indigo-50/40 transition-colors">
                            <td className="p-3.5 font-mono font-bold text-indigo-900 flex items-center gap-2">
                              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-xs">
                                {rule.code}
                              </span>
                              {isCustom && (
                                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                  Custom Price
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-slate-800">
                              <div className="font-medium">{rule.referrer_name || "Official Promotion"}</div>
                              {rule.notes && <div className="text-[10px] text-slate-400 italic max-w-xs truncate">{rule.notes}</div>}
                            </td>
                            <td className="p-3.5 font-bold text-slate-900">
                              <span className={`px-2 py-0.5 rounded-lg text-xs font-extrabold ${
                                rule.custom_exam_fee === 0 ? "bg-emerald-100 text-emerald-800" :
                                rule.custom_exam_fee < 199 ? "bg-blue-100 text-blue-800" :
                                "bg-slate-100 text-slate-700"
                              }`}>
                                {rule.custom_exam_fee === 0 ? "FREE (₹0)" : `₹${rule.custom_exam_fee}`}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-600 font-medium">
                              {rule.discount_amount > 0 ? (
                                <span className="text-emerald-700 font-semibold">₹{rule.discount_amount} OFF</span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="p-3.5 text-slate-600 font-medium">
                              ₹{rule.commission_reward}
                            </td>
                            <td className="p-3.5">
                              <span className="font-bold text-slate-900">{rule.usage_count || 0}</span>
                              <span className="text-slate-400 text-[10px] ml-1">({rule.selected_count || 0} hired)</span>
                            </td>
                            <td className="p-3.5">
                              <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                                rule.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${rule.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                                {rule.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-xs text-indigo-600 hover:bg-indigo-50 font-semibold"
                                  onClick={() => {
                                    setReferralForm({
                                      id: rule.id || "",
                                      code: rule.code,
                                      referrer_name: rule.referrer_name || "",
                                      custom_exam_fee: rule.custom_exam_fee,
                                      discount_amount: rule.discount_amount,
                                      commission_reward: rule.commission_reward,
                                      is_active: rule.is_active,
                                      notes: rule.notes || "",
                                      sync_to_existing_interns: true,
                                    });
                                    setIsReferralModalOpen(true);
                                  }}
                                >
                                  <Edit3 className="h-3 w-3 mr-1" /> Edit Pricing
                                </Button>
                                {isCustom && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                                    title="Reset / Delete Custom Pricing"
                                    onClick={() => handleDeleteReferralRule(rule.code)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── MODULE CONTROLS ─── */}
        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-800">Global Dashboard Controls</h2>
            </div>
            <Button size="sm" variant="outline" onClick={handleInitialize}>Initialize Defaults</Button>
          </div>
          <div className="p-6">
            <p className="text-sm text-muted-foreground mb-6">Enable or disable specific modules for Interns and Employees across the portal.</p>
            
            {settingsQ.isLoading ? (
              <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(settingsQ.data || []).map((setting: any) => (
                  <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="text-sm font-semibold capitalize text-slate-800">{setting.module_name}</div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider">{setting.portal_type} Portal</div>
                    </div>
                    <Switch 
                      checked={setting.is_enabled} 
                      onCheckedChange={(v) => updateSettingsMut.mutate({ id: setting.id, is_enabled: v })} 
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── DIRECT INTERN FEE OVERRIDE ─── */}
        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b bg-amber-50 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-bold text-amber-900">Direct Intern Fee Override</h2>
          </div>
          <div className="p-6 space-y-6">
            <p className="text-sm text-slate-600">Update the final certification exam fee for a specific intern, grant fee exemptions (provided by VYNTYRA), or schedule payment announcements.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
              <div className="space-y-3 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Target Audience</label>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="targetType" checked={targetType === "single"} onChange={() => setTargetType("single")} className="accent-amber-600" />
                    Single Intern ID
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="targetType" checked={targetType === "selected"} onChange={() => setTargetType("selected")} className="accent-amber-600" />
                    Selected Interns
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="targetType" checked={targetType === "all"} onChange={() => setTargetType("all")} className="accent-amber-600" />
                    Apply to All Interns
                  </label>
                </div>
              </div>

              {targetType === "single" && (
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">Intern ID (UUID)</label>
                  <Input placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000" value={internId} onChange={e => setInternId(e.target.value)} />
                </div>
              )}

              {targetType === "selected" && (
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">Select Interns</label>
                  <div className="max-h-48 overflow-y-auto border rounded-xl bg-slate-50 p-2 space-y-1">
                    {allInterns.map((intern: any) => (
                      <label key={intern.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedInternIds.includes(intern.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedInternIds(prev => [...prev, intern.id]);
                            else setSelectedInternIds(prev => prev.filter(id => id !== intern.id));
                          }}
                          className="accent-amber-600 rounded"
                        />
                        <div className="text-sm">
                          <span className="font-semibold text-slate-800">{intern.full_name || "Unknown"}</span>
                          <span className="text-xs text-slate-500 ml-2">({intern.email})</span>
                        </div>
                      </label>
                    ))}
                    {allInterns.length === 0 && <div className="text-xs text-slate-500 p-2 italic">No interns found.</div>}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Exam Fee Amount (₹)</label>
                <Input type="number" value={examFeeAmount} onChange={e => setExamFeeAmount(Number(e.target.value))} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Fee Payment Deadline (Date &amp; Time)</label>
                <Input 
                  type="datetime-local" 
                  value={feePaymentDeadline} 
                  onChange={e => setFeePaymentDeadline(e.target.value)} 
                />
                <span className="text-[10px] text-slate-400">Live animated countdown timer will tick on intern portal until this deadline.</span>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                <div>
                  <div className="text-sm font-bold text-slate-800">Fee Exempted (by Vyntyra)</div>
                  <div className="text-xs text-slate-500">Intern does not need to pay</div>
                </div>
                <Switch checked={isFeeExempted} onCheckedChange={setIsFeeExempted} />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                <div>
                  <div className="text-sm font-bold text-slate-800">Fee Payment Scheduled</div>
                  <div className="text-xs text-slate-500">Show payment banner and countdown to intern</div>
                </div>
                <Switch checked={feePaymentScheduled} onCheckedChange={setFeePaymentScheduled} />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                <div>
                  <div className="text-sm font-bold text-slate-800">Exam Fee Paid</div>
                  <div className="text-xs text-slate-500">Mark as paid manually</div>
                </div>
                <Switch checked={examFeePaid} onCheckedChange={setExamFeePaid} />
              </div>

            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button onClick={handleUpdateFee} className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5 shadow-xs">
                <Save className="h-4 w-4" /> Save Fee Profile &amp; Deadline
              </Button>

              <Button 
                variant="outline" 
                onClick={() => {
                  setPopupForm({
                    targetType: targetType === "single" ? "single" : targetType === "selected" ? "selected" : "all_unpaid",
                    title: "Urgent: Exam Fee Payment Required",
                    message: "Exam fee is payable to receive certificate and stipend will be provided for top 10% interns up to ₹5,000 to ₹15,000 (terms and eligibility apply). Once the payment is done, only then your dashboard will be fully functional.",
                    deadline: feePaymentDeadline,
                  });
                  setIsPopupModalOpen(true);
                }}
                className="border-red-300 text-red-700 hover:bg-red-50 font-bold gap-1.5 shadow-2xs"
              >
                <AlertCircle className="h-4 w-4 text-red-600" /> Send Urgent Onscreen Popup Alert
              </Button>
            </div>
          </div>
        </div>

        {/* ─── INTERN FEE SCHEDULES & VERIFICATION OVERVIEW TABLE ─── */}
        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden space-y-0">
          <div className="p-5 border-b bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-bold">Scheduled Intern Fee &amp; Mentor Overview</h2>
              </div>
              <p className="text-xs text-slate-300 mt-1">Live visibility of all assigned mentors, scheduled fee amounts, deadlines, and payment statuses.</p>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={handleBulkPaymentReminders}
                disabled={isBulkSendingEmail}
                className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1.5"
              >
                {isBulkSendingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Send Bulk Payment Reminders (Email)
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => membersQ.refetch()} 
                className="h-8 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border-white/20 gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${membersQ.isFetching ? "animate-spin" : ""}`} /> Refresh
              </Button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search by intern name, email or ID..." 
                  value={internFeeSearch} 
                  onChange={e => setInternFeeSearch(e.target.value)} 
                  className="pl-9 h-9 text-xs"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs font-medium">
                {[
                  { id: "all", label: `All Interns (${allInterns.length})` },
                  { id: "scheduled", label: `Scheduled (${allInterns.filter((i: any) => i.fee_payment_scheduled && !i.exam_fee_paid && !i.is_fee_exempted).length})` },
                  { id: "unpaid", label: `Unpaid (${allInterns.filter((i: any) => !i.exam_fee_paid && !i.is_fee_exempted).length})` },
                  { id: "paid", label: `Paid (${allInterns.filter((i: any) => i.exam_fee_paid).length})` },
                  { id: "exempted", label: `Exempted (${allInterns.filter((i: any) => i.is_fee_exempted).length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setInternFeeFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                      internFeeFilter === tab.id
                        ? "bg-slate-900 text-white font-bold"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="border rounded-xl overflow-x-auto bg-white shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Intern</th>
                    <th className="py-3 px-4">Assigned Mentor</th>
                    <th className="py-3 px-4">Exam Fee (₹)</th>
                    <th className="py-3 px-4">Fee Scheduled</th>
                    <th className="py-3 px-4">Payment Deadline</th>
                    <th className="py-3 px-4">Payment Status &amp; Ref</th>
                    <th className="py-3 px-4">Urgent Popup</th>
                    <th className="py-3 px-4 text-right">Omnichannel &amp; Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {membersQ.isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-slate-500" />
                        Loading intern fee schedules...
                      </td>
                    </tr>
                  ) : (
                    allInterns
                      .filter((intern: any) => {
                        const matchQuery = 
                          (intern.full_name || "").toLowerCase().includes(internFeeSearch.toLowerCase()) ||
                          (intern.email || "").toLowerCase().includes(internFeeSearch.toLowerCase()) ||
                          (intern.intern_id || "").toLowerCase().includes(internFeeSearch.toLowerCase());
                        if (!matchQuery) return false;

                        if (internFeeFilter === "scheduled") return intern.fee_payment_scheduled && !intern.exam_fee_paid && !intern.is_fee_exempted;
                        if (internFeeFilter === "unpaid") return !intern.exam_fee_paid && !intern.is_fee_exempted;
                        if (internFeeFilter === "paid") return intern.exam_fee_paid;
                        if (internFeeFilter === "exempted") return intern.is_fee_exempted;
                        return true;
                      })
                      .map((intern: any) => {
                        const assignedMentor = intern.mentor_id ? (membersQ.data || []).find((m: any) => (m.id === intern.mentor_id || m.user_id === intern.mentor_id)) : null;
                        const isExpired = intern.fee_payment_deadline ? new Date(intern.fee_payment_deadline).getTime() < Date.now() : false;

                        return (
                          <tr key={intern.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-800">{intern.full_name || "—"}</div>
                              <div className="text-[11px] text-slate-400">{intern.email} {intern.intern_id && `· ID: ${intern.intern_id}`}</div>
                            </td>

                            <td className="py-3 px-4">
                              {assignedMentor ? (
                                <div>
                                  <span className="font-bold text-indigo-700 block">{assignedMentor.full_name}</span>
                                  <span className="text-[10px] text-slate-400">{assignedMentor.email}</span>
                                </div>
                              ) : intern.mentor_id ? (
                                <span className="font-semibold text-indigo-600">Assigned Mentor</span>
                              ) : (
                                <span className="text-slate-500 font-medium text-[11px]">Lead Mentor (Jami Eswar Anil Kumar)</span>
                              )}
                            </td>

                            <td className="py-3 px-4 font-mono font-bold text-slate-800">
                              ₹{intern.exam_fee_amount !== undefined ? intern.exam_fee_amount : 199}
                            </td>

                            <td className="py-3 px-4">
                              {intern.fee_payment_scheduled ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  Scheduled
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                                  Unscheduled
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              {intern.fee_payment_deadline ? (
                                <div>
                                  <span className={`font-semibold block ${isExpired ? "text-red-600" : "text-slate-700"}`}>
                                    {formatDateTimeDisplay(intern.fee_payment_deadline)}
                                  </span>
                                  {isExpired && (
                                    <span className="text-[9px] font-bold uppercase text-red-600 bg-red-50 px-1.5 py-0.2 rounded border border-red-200">Expired</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">No deadline set</span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              {intern.exam_fee_paid ? (
                                <div>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    ✓ Paid
                                  </span>
                                  <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                                    Ref: {intern.payment_reference_no || `TXN-${(intern.id || "").slice(0, 6).toUpperCase()}`}
                                  </div>
                                  <div className="text-[9px] text-slate-400">
                                    {intern.payment_mode || "PayU PG / Online"}
                                  </div>
                                </div>
                              ) : intern.is_fee_exempted ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                                  Exempted
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  Unpaid
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              {intern.urgent_popup_active ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse">
                                  Active Alert
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">—</span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end flex-wrap gap-1">
                                {/* Individual Customized NOC generation */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  title="Generate customized NOC with Founder Signature & Logo"
                                  className="h-7 px-2 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-300 gap-1"
                                  onClick={() => handleGenerateIndividualNoc(intern)}
                                >
                                  <Award className="h-3 w-3" /> NOC
                                </Button>

                                {/* Dedicated Individual Payment Reminder Button */}
                                {!intern.exam_fee_paid && !intern.is_fee_exempted && (
                                  <Button
                                    size="sm"
                                    title="Open Individual Payment Reminder Console (Email & WhatsApp)"
                                    className="h-7 px-2.5 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-2xs gap-1"
                                    onClick={() => openPaymentReminderModal(intern)}
                                  >
                                    <Mail className="h-3 w-3" /> Payment Reminder
                                  </Button>
                                )}

                                {/* Quick WhatsApp Reminder */}
                                {!intern.exam_fee_paid && !intern.is_fee_exempted && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    title="Quick WhatsApp payment reminder"
                                    className="h-7 px-2 text-[10px] font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border-teal-300 gap-1"
                                    onClick={() => handleSendIndividualWhatsApp(intern)}
                                  >
                                    <MessageSquare className="h-3 w-3" /> WhatsApp
                                  </Button>
                                )}

                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-300"
                                  onClick={() => {
                                    setTargetType("single");
                                    setInternId(intern.id);
                                    setExamFeeAmount(intern.exam_fee_amount !== undefined ? intern.exam_fee_amount : 199);
                                    setFeePaymentScheduled(Boolean(intern.fee_payment_scheduled));
                                    setExamFeePaid(Boolean(intern.exam_fee_paid));
                                    setIsFeeExempted(Boolean(intern.is_fee_exempted));
                                    setFeePaymentDeadline(isoToLocalDateTimeInput(intern.fee_payment_deadline));
                                    window.scrollTo({ top: 400, behavior: "smooth" });
                                    toast.info(`Loaded settings for ${intern.full_name || intern.email}`);
                                  }}
                                >
                                  Edit Fee
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-[10px] font-bold text-red-700 bg-red-50 hover:bg-red-100 border-red-200"
                                  onClick={() => {
                                    setPopupForm({
                                      targetType: "single",
                                      title: "Urgent: Exam Fee Payment Required",
                                      message: "Exam fee is payable to receive certificate and stipend will be provided for top 10% interns up to ₹5,000 to ₹15,000 (terms and eligibility apply). Once the payment is done, only then your dashboard will be fully functional.",
                                      deadline: isoToLocalDateTimeInput(intern.fee_payment_deadline),
                                    });
                                    setInternId(intern.id);
                                    setIsPopupModalOpen(true);
                                  }}
                                >
                                  Alert
                                </Button>
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

        {/* ─── BRANDING & FOUNDER SIGNATURE / LOGO CUSTOMIZER ─── */}
        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden border-emerald-100">
          <div className="p-5 border-b bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Certificate Branding, Signature &amp; Logo Settings</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure the official Founder Signature URL, Vyntyra Logo URL, and signatory credentials applied during NOC &amp; certificate issuance.
                </p>
              </div>
            </div>
            <Button
              onClick={handleSaveBranding}
              disabled={isSavingBranding}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 gap-1.5 shadow-xs"
            >
              {isSavingBranding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Branding Settings
            </Button>
          </div>

          <form onSubmit={handleSaveBranding} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Founder Signature URL & Live Preview */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-emerald-600" /> Founder Signature Image URL
                  </label>
                  <span className="text-[10px] text-slate-400">PNG / WebP / JPG</span>
                </div>
                <Input
                  placeholder="https://.../signature.png or /signature.png"
                  value={brandingForm.founder_signature_url}
                  onChange={(e) => setBrandingForm({ ...brandingForm, founder_signature_url: e.target.value })}
                  className="bg-white text-xs"
                />
                <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Signature Preview</span>
                    <span className="text-xs text-slate-600 font-semibold">{brandingForm.founder_name}</span>
                  </div>
                  <div className="h-12 w-28 bg-slate-50 border border-dashed rounded flex items-center justify-center overflow-hidden p-1">
                    {brandingForm.founder_signature_url ? (
                      <img
                        src={brandingForm.founder_signature_url}
                        alt="Signature Preview"
                        className="max-h-full max-w-full object-contain"
                        onError={(e: any) => { (e.target as HTMLElement).style.display = "none"; }}
                      />
                    ) : (
                      <span className="text-[9px] text-slate-400 italic">No image</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Vyntyra Logo URL & Live Preview */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Image className="h-4 w-4 text-emerald-600" /> Vyntyra Official Logo URL
                  </label>
                  <span className="text-[10px] text-slate-400">PNG / WebP / SVG</span>
                </div>
                <Input
                  placeholder="https://.../logo.png or /icon-512.png"
                  value={brandingForm.vyntyra_logo_url}
                  onChange={(e) => setBrandingForm({ ...brandingForm, vyntyra_logo_url: e.target.value })}
                  className="bg-white text-xs"
                />
                <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Logo Preview</span>
                    <span className="text-xs text-slate-600 font-semibold">Project VyNexa</span>
                  </div>
                  <div className="h-12 w-16 bg-slate-900 rounded flex items-center justify-center overflow-hidden p-1">
                    {brandingForm.vyntyra_logo_url ? (
                      <img
                        src={brandingForm.vyntyra_logo_url}
                        alt="Logo Preview"
                        className="max-h-full max-w-full object-contain"
                        onError={(e: any) => { (e.target as HTMLElement).style.display = "none"; }}
                      />
                    ) : (
                      <span className="text-[9px] text-slate-400 italic">No image</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Signatory Name & Title */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Signatory / Founder Name</label>
                <Input
                  value={brandingForm.founder_name}
                  onChange={(e) => setBrandingForm({ ...brandingForm, founder_name: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Signatory Title / Designation</label>
                <Input
                  value={brandingForm.founder_title}
                  onChange={(e) => setBrandingForm({ ...brandingForm, founder_title: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>
          </form>
        </div>

        {/* ─── DYNAMIC APPLICATION DOMAINS & SUB-DOMAINS MANAGER ─── */}
        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden border-blue-100">
          <div className="p-5 border-b bg-gradient-to-r from-blue-50/80 via-white to-blue-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Application Domains &amp; Sub-Domains Manager</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add or remove primary domains and specialization tracks in the Careers application form. Newly added tracks show a vibrant "NEW" badge.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => domainsQ.refetch()}
              className="h-8 text-xs font-semibold gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${domainsQ.isFetching ? "animate-spin" : ""}`} /> Refresh Tracks
            </Button>
          </div>

          <div className="p-6 space-y-6">
            {/* Add Forms Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
              {/* Add Primary Domain */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Add Primary Domain / Department</h3>
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="e.g. Artificial Intelligence & Robotics"
                    value={domainNameInput}
                    onChange={(e) => setDomainNameInput(e.target.value)}
                    className="bg-white text-xs h-9"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={domainIsNewInput}
                        onChange={(e) => setDomainIsNewInput(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Mark with <strong>"NEW"</strong> Badge</span>
                    </label>
                    <Button
                      size="sm"
                      onClick={handleAddDomain}
                      disabled={isSavingDomain || !domainNameInput.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 font-bold"
                    >
                      {isSavingDomain ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      Add Domain
                    </Button>
                  </div>
                </div>
              </div>

              {/* Add Sub-domain / Track */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Add Sub-Domain / Track under Domain</h3>
                </div>
                <div className="space-y-2">
                  <select
                    value={selectedParentDomain}
                    onChange={(e) => setSelectedParentDomain(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">-- Choose Primary Domain --</option>
                    {(domainsQ.data || DEFAULT_CAREER_DOMAINS).map((d: DomainItem) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                  <Input
                    placeholder="e.g. LLM Fine-Tuning & Prompt Engineering"
                    value={subdomainNameInput}
                    onChange={(e) => setSubdomainNameInput(e.target.value)}
                    className="bg-white text-xs h-9"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={subdomainIsNewInput}
                        onChange={(e) => setSubdomainIsNewInput(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Mark with <strong>"NEW"</strong> Badge</span>
                    </label>
                    <Button
                      size="sm"
                      onClick={handleAddSubdomain}
                      disabled={isSavingDomain || !selectedParentDomain || !subdomainNameInput.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 font-bold"
                    >
                      {isSavingDomain ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      Add Sub-Domain Track
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* List of Configured Domains & Sub-domains */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Configured Application Tracks ({(domainsQ.data || DEFAULT_CAREER_DOMAINS).length} Domains)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(domainsQ.data || DEFAULT_CAREER_DOMAINS).map((dom: DomainItem) => (
                  <div key={dom.id} className="p-4 bg-white border rounded-xl shadow-xs space-y-3 hover:border-slate-300 transition-colors">
                    <div className="flex items-start justify-between gap-2 border-b pb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{dom.name}</span>
                          {dom.is_new && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-600 text-white shadow-xs">
                              <Sparkles className="h-2.5 w-2.5" /> NEW
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{dom.subdomains?.length || 0} tracks</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteDomainOrSubdomain(dom.id)}
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Delete this domain"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Subdomains list */}
                    <div className="flex flex-wrap gap-1.5">
                      {(dom.subdomains || []).map((sub) => (
                        <span
                          key={sub.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {sub.name}
                          {sub.is_new && (
                            <span className="text-[8px] font-black text-emerald-700 bg-emerald-100 px-1 rounded uppercase">NEW</span>
                          )}
                          <button
                            onClick={() => handleDeleteDomainOrSubdomain(dom.id, sub.id)}
                            className="ml-1 text-slate-400 hover:text-red-600"
                            title="Remove track"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── NOC REGENERATION ─── */}
        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b bg-slate-50 flex items-center gap-2">
            <FileText className="h-5 w-5 text-rose-600" />
            <h2 className="text-lg font-bold text-slate-800">NOC Certificate Management</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-muted-foreground mb-4">Purge all existing cached NOC certificates from storage and force regeneration with the latest template (includes QR verification code and Vyntyra logo). NOCs will be regenerated automatically the next time each intern accesses their dashboard.</p>
            <Button
              variant="destructive"
              className="gap-2 font-bold"
              onClick={async () => {
                if (!confirm("This will delete all cached NOC PDFs and force regeneration. Continue?")) return;
                try {
                  toast.info("Purging NOCs...");
                  const result = await doPurgeAllNocs();
                  toast.success(result.message || "All stored NOC links successfully purged. NOCs will regenerate on next access.");
                } catch (err: any) {
                  toast.error(err.message || "Failed to purge NOCs");
                }
              }}
            >
              <RefreshCw className="h-4 w-4" /> Regenerate All NOCs
            </Button>
          </div>
        </div>
      </main>

      {/* ─── REFERRAL CODE & PRICING MODAL ─── */}
      {isReferralModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600 text-white rounded-lg">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {referralForm.id ? "Edit Referral Code Pricing" : "Add Referral Code & Custom Pricing"}
                  </h3>
                  <p className="text-xs text-slate-500">Configure custom exam fees or promotional campaign rules.</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsReferralModalOpen(false)}>✕</Button>
            </div>

            <form onSubmit={handleSaveReferralRule} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Referral Code *</label>
                <Input 
                  placeholder="e.g. CAMPUS99, TECHFEST, JAVYE4"
                  value={referralForm.code}
                  onChange={(e) => setReferralForm({ ...referralForm, code: e.target.value.toUpperCase() })}
                  required
                  className="font-mono font-bold uppercase tracking-wider text-sm"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Will be automatically converted to uppercase.</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Referrer Name / Campaign Description</label>
                <Input 
                  placeholder="e.g. College Placement Cell / Student Ambassador / Fest"
                  value={referralForm.referrer_name}
                  onChange={(e) => setReferralForm({ ...referralForm, referrer_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Custom Exam Fee (₹) *</label>
                  <Input 
                    type="number"
                    min="0"
                    value={referralForm.custom_exam_fee}
                    onChange={(e) => setReferralForm({ ...referralForm, custom_exam_fee: Number(e.target.value) })}
                    required
                    className="font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Default standard fee is ₹199. Set 0 for free.</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Amount (₹)</label>
                  <Input 
                    type="number"
                    min="0"
                    value={referralForm.discount_amount}
                    onChange={(e) => setReferralForm({ ...referralForm, discount_amount: Number(e.target.value) })}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Displayed on application form as savings.</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Referrer Reward / Commission (₹)</label>
                  <Input 
                    type="number"
                    min="0"
                    value={referralForm.commission_reward}
                    onChange={(e) => setReferralForm({ ...referralForm, commission_reward: Number(e.target.value) })}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Payable to referrer per hired intern.</span>
                </div>

                <div className="flex flex-col justify-end">
                  <div className="flex items-center justify-between p-2.5 border rounded-lg bg-slate-50">
                    <span className="font-semibold text-slate-700">Code Active</span>
                    <Switch 
                      checked={referralForm.is_active}
                      onCheckedChange={(v) => setReferralForm({ ...referralForm, is_active: v })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Internal Notes</label>
                <Input 
                  placeholder="e.g. Valid until Q3 end / Specific college MoU"
                  value={referralForm.notes}
                  onChange={(e) => setReferralForm({ ...referralForm, notes: e.target.value })}
                />
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={referralForm.sync_to_existing_interns} 
                    onChange={(e) => setReferralForm({ ...referralForm, sync_to_existing_interns: e.target.checked })}
                    className="mt-0.5 accent-indigo-600 rounded"
                  />
                  <span className="text-xs text-indigo-950 font-medium">
                    Automatically sync this custom pricing to all existing interns who applied with this referral code.
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsReferralModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSavingReferral}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {isSavingReferral ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Saving...</> : "Save Pricing Rule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── URGENT POPUP NOTIFICATION DISPATCH MODAL ─── */}
      {isPopupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-600 text-white rounded-lg shadow-xs">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Dispatch Urgent Onscreen Popup Alert
                  </h3>
                  <p className="text-xs text-slate-500">Sends an immediate high-priority onscreen modal to target interns.</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsPopupModalOpen(false)}>✕</Button>
            </div>

            <form onSubmit={handleSendUrgentPopup} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Interns *</label>
                <select 
                  className="w-full rounded-md border p-2 text-xs bg-white font-medium"
                  value={popupForm.targetType}
                  onChange={(e: any) => setPopupForm({ ...popupForm, targetType: e.target.value })}
                >
                  <option value="all_unpaid">All Unpaid &amp; Non-Exempted Interns</option>
                  <option value="selected">Selected Interns Only ({selectedInternIds.length} chosen)</option>
                  <option value="single">Single Intern (UUID: {internId || "None specified"})</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Popup Alert Title *</label>
                <Input 
                  value={popupForm.title}
                  onChange={(e) => setPopupForm({ ...popupForm, title: e.target.value })}
                  required
                  className="font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Popup Message Content *</label>
                <textarea 
                  rows={4}
                  value={popupForm.message}
                  onChange={(e) => setPopupForm({ ...popupForm, message: e.target.value })}
                  required
                  className="w-full rounded-md border p-2.5 text-xs text-slate-800 leading-relaxed"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Fee Payment Deadline (Date &amp; Time)</label>
                <Input 
                  type="datetime-local"
                  value={popupForm.deadline}
                  onChange={(e) => setPopupForm({ ...popupForm, deadline: e.target.value })}
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Displays live ticking countdown on their screen.</span>
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs">
                <strong>Notice:</strong> This alert will immediately interrupt the intern's workflow on login or active session, prompting them to pay the fee and complete verification.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsPopupModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSendingPopup}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  {isSendingPopup ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Dispatching Alert...</> : "Broadcast Onscreen Alert"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── INDIVIDUAL PAYMENT REMINDER MODAL ─── */}
      {isReminderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Send Individual Payment Reminder</h3>
                  <p className="text-xs text-slate-500">Corporate Email &amp; WhatsApp Reminder for {reminderForm.name || reminderForm.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsReminderModalOpen(false)}>✕</Button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Candidate Name</label>
                  <Input value={reminderForm.name} onChange={(e) => setReminderForm({ ...reminderForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Recipient Email *</label>
                  <Input value={reminderForm.email} onChange={(e) => setReminderForm({ ...reminderForm, email: e.target.value })} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Recipient Phone (for WhatsApp)</label>
                  <Input placeholder="e.g. 9876543210" value={reminderForm.phone} onChange={(e) => setReminderForm({ ...reminderForm, phone: e.target.value })} />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Exam Fee Amount (₹) *</label>
                  <Input type="number" min="0" value={reminderForm.amount} onChange={(e) => setReminderForm({ ...reminderForm, amount: Number(e.target.value) })} required />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Due Deadline</label>
                <Input type="datetime-local" value={reminderForm.deadline} onChange={(e) => setReminderForm({ ...reminderForm, deadline: e.target.value })} />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Subject</label>
                <Input value={reminderForm.customSubject} onChange={(e) => setReminderForm({ ...reminderForm, customSubject: e.target.value })} />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Custom Note / Remarks (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please clear the pending fee today to avoid onboarding delays..."
                  value={reminderForm.customNote}
                  onChange={(e) => setReminderForm({ ...reminderForm, customNote: e.target.value })}
                  className="w-full rounded-md border p-2 text-xs bg-slate-50"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-xs">
                <strong>Email Template:</strong> Includes corporate Vyntyra branding, deadline box, and a direct <strong>"Pay Exam Fee Online"</strong> CTA button.
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t">
                <Button variant="outline" size="sm" onClick={() => setIsReminderModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendReminderWhatsAppFromModal}
                  className="text-teal-700 border-teal-300 hover:bg-teal-50 font-bold gap-1 text-xs"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Send via WhatsApp
                </Button>
                <Button
                  type="button"
                  disabled={isSendingReminderEmail}
                  onClick={handleSendReminderEmailFromModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1 text-xs"
                >
                  {isSendingReminderEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                  Dispatch Email Reminder
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


