import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Settings2, ShieldCheck, CreditCard, Lock, ArrowLeft, Save, RefreshCw, FileText } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getDashboardSettings, updateDashboardSetting, updateInternFeeSettings, initializeDashboardSettings, listTeamMembers, purgeAllNocs } from "@/lib/operations.functions";

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
  
  const [targetType, setTargetType] = useState<"single" | "selected" | "all">("single");
  const [internId, setInternId] = useState("");
  const [selectedInternIds, setSelectedInternIds] = useState<string[]>([]);
  const [examFeeAmount, setExamFeeAmount] = useState<number>(199);
  const [isFeeExempted, setIsFeeExempted] = useState(false);
  const [examFeePaid, setExamFeePaid] = useState(false);
  const [feePaymentScheduled, setFeePaymentScheduled] = useState(false);
  const [isPaymentEnabled, setIsPaymentEnabled] = useState(false);
  
  const settingsQ = useQuery({
    queryKey: ["admin-dashboard-settings"],
    queryFn: () => fetchDashboardSettings(),
  });

  const membersQ = useQuery({
    queryKey: ["admin-intern-list"],
    queryFn: () => fetchTeamMembers(),
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
          is_payment_enabled: isPaymentEnabled
        }
      });
      toast.success("Fee settings updated successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to update fee settings.");
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Settings2 className="h-5 w-5 text-primary" />
            <span className="font-semibold text-primary">System & Fee Settings</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-8">
        
        {/* Module Controls */}
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
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

        {/* Fee Management */}
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b bg-amber-50 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-bold text-amber-900">Intern Fee Management</h2>
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
                  <div className="text-xs text-slate-500">Show payment banner to intern</div>
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

            <Button onClick={handleUpdateFee} className="mt-4 bg-amber-600 hover:bg-amber-700 text-white">
              <Save className="h-4 w-4 mr-2" /> Update Fee Profile
            </Button>
          </div>
        </div>

        {/* NOC Regeneration */}
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b bg-slate-50 flex items-center gap-2">
            <FileText className="h-5 w-5 text-rose-600" />
            <h2 className="text-lg font-bold text-slate-800">NOC Certificate Management</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-muted-foreground mb-4">Purge all existing cached NOC certificates from storage and force regeneration with the latest template (includes QR verification code and Vyntyra logo). NOCs will be regenerated automatically the next time each intern accesses their dashboard.</p>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={async () => {
                if (!confirm("This will delete all cached NOC PDFs and force regeneration. Continue?")) return;
                try {
                  toast.info("Purging NOCs...");
                  const result = await doPurgeAllNocs();
                  toast.success(`Done! Deleted ${result.filesDeleted} NOC file(s), cleared ${result.applicationsCleared} application URL(s). NOCs will regenerate on next access.`);
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
    </div>
  );
}
