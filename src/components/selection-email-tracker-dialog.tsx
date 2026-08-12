import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getBulkSelectionEmailTracker, sendBulkSelectionEmails } from "@/lib/workflow.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, RefreshCw, Send, CheckCircle2, AlertCircle, Clock, Loader2, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function SelectionEmailTrackerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const fetchTracker = useServerFn(getBulkSelectionEmailTracker);
  const doSendBulk = useServerFn(sendBulkSelectionEmails);

  const [search, setSearch] = useState("");
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  const trackerQ = useQuery({
    queryKey: ["selection-email-tracker"],
    queryFn: () => fetchTracker(),
    enabled: open,
    refetchInterval: 5000,
  });

  const list: any[] = trackerQ.data || [];

  const filteredList = list.filter((item) => {
    const term = search.toLowerCase();
    return (
      (item.full_name || "").toLowerCase().includes(term) ||
      (item.email || "").toLowerCase().includes(term) ||
      (item.role_applied || "").toLowerCase().includes(term)
    );
  });

  const deliveredCount = list.filter((i) => i.email_status === "delivered").length;
  const pendingCount = list.filter((i) => i.email_status === "pending").length;
  const failedCount = list.filter((i) => i.email_status === "failed").length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAppIds(filteredList.map((i) => i.id));
    } else {
      setSelectedAppIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedAppIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDispatchEmails = async (targetIds?: string[]) => {
    setIsSending(true);
    const toastId = toast.loading("Dispatching selection emails with credentials & PDF attachments...");
    try {
      const res = await doSendBulk({
        data: targetIds && targetIds.length > 0 ? { applicationIds: targetIds } : undefined,
      });

      qc.invalidateQueries({ queryKey: ["selection-email-tracker"] });
      qc.invalidateQueries({ queryKey: ["admin-applications"] });

      toast.dismiss(toastId);
      toast.success(
        `Selection emails dispatched! Sent: ${res.sentCount}${res.failedCount > 0 ? `, Failed: ${res.failedCount}` : ""}`
      );
      setSelectedAppIds([]);
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error("Failed to dispatch selection emails: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Mail className="h-6 w-6 text-indigo-600" /> Selection Email Delivery Tracker & Control
          </DialogTitle>
          <DialogDescription>
            Monitor real-time selection email delivery status for hired candidates and manually resend credentials to selected candidates.
          </DialogDescription>
        </DialogHeader>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 my-2">
          <div className="p-3.5 rounded-xl border bg-emerald-50/60 border-emerald-200">
            <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Delivered / Sent
            </div>
            <div className="text-2xl font-black text-emerald-900 mt-1">{deliveredCount}</div>
          </div>
          <div className="p-3.5 rounded-xl border bg-amber-50/60 border-amber-200">
            <div className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-600" /> Pending Dispatch
            </div>
            <div className="text-2xl font-black text-amber-900 mt-1">{pendingCount}</div>
          </div>
          <div className="p-3.5 rounded-xl border bg-red-50/60 border-red-200">
            <div className="text-xs font-semibold text-red-800 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-red-600" /> Failed / Error
            </div>
            <div className="text-2xl font-black text-red-900 mt-1">{failedCount}</div>
          </div>
        </div>

        {/* Search & Bulk Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search candidate name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => qc.invalidateQueries({ queryKey: ["selection-email-tracker"] })}
              className="text-xs gap-1"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${trackerQ.isFetching ? "animate-spin" : ""}`} /> Refresh Status
            </Button>

            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm"
              disabled={isSending || filteredList.length === 0}
              onClick={() => handleDispatchEmails(selectedAppIds.length > 0 ? selectedAppIds : undefined)}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Dispatching...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  {selectedAppIds.length > 0
                    ? `Dispatch to (${selectedAppIds.length}) Selected`
                    : `Dispatch All Selection Emails`}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Candidate List Table */}
        <div className="border rounded-xl bg-white overflow-hidden divide-y text-xs">
          <div className="bg-slate-100 p-3 font-semibold text-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedAppIds.length > 0 && selectedAppIds.length === filteredList.length}
                onCheckedChange={(v) => handleSelectAll(!!v)}
              />
              <span>Candidate ({filteredList.length})</span>
            </div>
            <div className="flex items-center gap-6 mr-4">
              <span>Role / Domain</span>
              <span>Delivery Status</span>
              <span>Action</span>
            </div>
          </div>

          {trackerQ.isLoading ? (
            <div className="p-8 text-center text-slate-400 flex justify-center items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" /> Loading candidate delivery status...
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No hired or selected applicants found in pipeline.
            </div>
          ) : (
            filteredList.map((app) => (
              <div key={app.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <Checkbox
                    checked={selectedAppIds.includes(app.id)}
                    onCheckedChange={() => handleToggleSelect(app.id)}
                  />
                  <div>
                    <div className="font-bold text-slate-900">{app.full_name || app.email}</div>
                    <div className="text-[11px] text-slate-500">{app.email} &middot; {app.phone || "No Phone"}</div>
                    {app.scheduled_info?.error_message && (
                      <div className="text-[10px] text-red-600 font-mono mt-0.5 max-w-xs truncate" title={app.scheduled_info.error_message}>
                        Error: {app.scheduled_info.error_message}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-[11px] font-medium text-slate-600 max-w-[140px] truncate hidden sm:block">
                    {app.role_applied || app.domain || "Intern"}
                  </div>

                  <div>
                    {app.email_status === "delivered" ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Delivered
                      </Badge>
                    ) : app.email_status === "failed" ? (
                      <Badge className="bg-red-100 text-red-800 border-red-200 text-[10px] font-bold" title={app.scheduled_info?.error_message}>
                        <AlertCircle className="h-3 w-3 mr-1" /> Failed
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-bold animate-pulse">
                        <Clock className="h-3 w-3 mr-1" /> Pending
                      </Badge>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] font-semibold text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                    disabled={isSending}
                    onClick={() => handleDispatchEmails([app.id])}
                  >
                    <Send className="h-3 w-3 mr-1" /> Send Now
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
