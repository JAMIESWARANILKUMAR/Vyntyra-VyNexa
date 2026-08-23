import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { 
  Loader2, Settings2, ShieldCheck, CreditCard, Lock, ArrowLeft, Save, 
  RefreshCw, FileText, Tag, Percent, Plus, Search, Users, CheckCircle2, 
  Trash2, Edit3, TrendingUp, Sparkles, AlertCircle, DollarSign, Check
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
                    <th className="py-3 px-4">Payment Status</th>
                    <th className="py-3 px-4">Urgent Popup</th>
                    <th className="py-3 px-4 text-right">Quick Action</th>
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
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  ✓ Paid
                                </span>
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
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-300"
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
                                  className="h-7 text-[10px] font-bold text-red-700 bg-red-50 hover:bg-red-100 border-red-200"
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
    </div>
  );
}


