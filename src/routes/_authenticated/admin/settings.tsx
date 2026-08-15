import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Settings2, ShieldCheck, CreditCard, Lock, ArrowLeft, Save } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getDashboardSettings, updateDashboardSetting, updateInternFeeSettings, initializeDashboardSettings } from "@/lib/operations.functions";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const qc = useQueryClient();
  const fetchDashboardSettings = useServerFn(getDashboardSettings);
  const doUpdateDashboardSetting = useServerFn(updateDashboardSetting);
  const doUpdateInternFeeSettings = useServerFn(updateInternFeeSettings);
  const doInitializeDashboardSettings = useServerFn(initializeDashboardSettings);
  
  const [internId, setInternId] = useState("");
  const [examFeeAmount, setExamFeeAmount] = useState<number>(199);
  const [isFeeExempted, setIsFeeExempted] = useState(false);
  const [examFeePaid, setExamFeePaid] = useState(false);
  const [feePaymentScheduled, setFeePaymentScheduled] = useState(false);
  
  const settingsQ = useQuery({
    queryKey: ["admin-dashboard-settings"],
    queryFn: () => fetchDashboardSettings(),
  });

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
    if (!internId) return toast.error("Please provide an Intern ID.");
    try {
      await doUpdateInternFeeSettings({
        data: {
          internId,
          exam_fee_amount: examFeeAmount,
          is_fee_exempted: isFeeExempted,
          exam_fee_paid: examFeePaid,
          fee_payment_scheduled: feePaymentScheduled,
        }
      });
      toast.success("Fee settings updated for intern.");
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
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Intern ID (UUID)</label>
                <Input placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000" value={internId} onChange={e => setInternId(e.target.value)} />
              </div>
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
      </main>
    </div>
  );
}
