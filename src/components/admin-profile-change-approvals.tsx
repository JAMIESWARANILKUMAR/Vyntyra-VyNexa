import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listProfileChangeRequests, reviewProfileChangeRequest, type ProfileChangeRequestItem
} from "@/lib/operations.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
  UserCheck, ShieldCheck, Mail, Phone, MapPin, Image as ImageIcon,
  CheckCircle2, XCircle, Clock, Search, RefreshCw, AlertCircle, Sparkles, Filter, Loader2
} from "lucide-react";
import { toast } from "sonner";

export function AdminProfileChangeApprovals() {
  const qc = useQueryClient();
  const fetchRequests = useServerFn(listProfileChangeRequests);
  const doReviewRequest = useServerFn(reviewProfileChangeRequest);

  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "intern" | "employee">("all");

  // Review Dialog State
  const [selectedReq, setSelectedReq] = useState<ProfileChangeRequestItem | null>(null);
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected">("approved");
  const [adminRemarks, setAdminRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestsQ = useQuery({
    queryKey: ["admin-profile-change-requests"],
    queryFn: () => fetchRequests(),
    refetchInterval: 15000,
  });

  const allRequests: ProfileChangeRequestItem[] = requestsQ.data || [];

  const pendingCount = allRequests.filter((r) => r.status === "pending").length;
  const approvedCount = allRequests.filter((r) => r.status === "approved").length;
  const rejectedCount = allRequests.filter((r) => r.status === "rejected").length;

  const filteredRequests = allRequests.filter((r) => {
    if (activeTab !== "all" && r.status !== activeTab) return false;
    if (roleFilter !== "all" && r.user_role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.user_name.toLowerCase().includes(q);
      const matchEmail = r.user_email.toLowerCase().includes(q);
      const matchReqEmail = (r.requested_values.email || "").toLowerCase().includes(q);
      const matchReqPhone = (r.requested_values.phone || "").toLowerCase().includes(q);
      return matchName || matchEmail || matchReqEmail || matchReqPhone;
    }
    return true;
  });

  const handleReviewSubmit = async () => {
    if (!selectedReq) return;
    setIsSubmitting(true);
    try {
      await doReviewRequest({
        data: {
          requestId: selectedReq.id,
          status: reviewAction,
          admin_remarks: adminRemarks.trim() || undefined,
        },
      });
      toast.success(`Profile update request ${reviewAction.toUpperCase()}! User notified.`);
      setSelectedReq(null);
      setAdminRemarks("");
      qc.invalidateQueries({ queryKey: ["admin-profile-change-requests"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to review profile change request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-lg">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
              <UserCheck className="h-5 w-5" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
              Directorate Governance
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">
            Profile Change Approvals &amp; Identity Verification
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Audit and authorize profile detail change requests (Email, Phone, Photo, Residential Address) submitted by interns and employees before they take effect in production.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => requestsQ.refetch()}
            className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white text-xs h-9 gap-1.5 rounded-xl"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${requestsQ.isFetching ? "animate-spin" : ""}`} />
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "pending"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Pending Review ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("approved")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "approved"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approved ({approvedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rejected")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "rejected"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <XCircle className="h-3.5 w-3.5" />
            Rejected ({rejectedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Logs ({allRequests.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search user name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-8 rounded-xl bg-slate-50 border-slate-200"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 h-8"
          >
            <option value="all">All Roles</option>
            <option value="intern">Interns Only</option>
            <option value="employee">Employees Only</option>
          </select>
        </div>
      </div>

      {/* Requests Grid */}
      {requestsQ.isLoading ? (
        <div className="p-16 flex items-center justify-center gap-2 text-slate-400 text-sm bg-white rounded-2xl border">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading profile change queue...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-16 text-center text-slate-400 text-sm bg-white rounded-2xl border space-y-2">
          <ShieldCheck className="h-10 w-10 mx-auto text-slate-300" />
          <p className="font-semibold text-slate-700">No profile change requests found.</p>
          <p className="text-xs text-slate-400">All submitted changes have been reviewed and resolved.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header User info */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{req.user_name}</span>
                      <Badge className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        req.user_role === "employee" ? "bg-purple-100 text-purple-800 border-purple-200" : "bg-indigo-100 text-indigo-800 border-indigo-200"
                      }`}>
                        {req.user_role}
                      </Badge>
                      {req.department && (
                        <span className="text-[10px] text-slate-400 font-medium">({req.department})</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">{req.user_email}</div>
                  </div>

                  {req.status === "pending" && (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-bold">
                      <Clock className="h-3 w-3 mr-1" /> Pending
                    </Badge>
                  )}
                  {req.status === "approved" && (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
                    </Badge>
                  )}
                  {req.status === "rejected" && (
                    <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10px] font-bold">
                      <XCircle className="h-3 w-3 mr-1" /> Rejected
                    </Badge>
                  )}
                </div>

                {/* Diff Comparison Table */}
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-150 text-xs space-y-2">
                  <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                    Requested Changes Comparison
                  </div>

                  <div className="space-y-1.5 divide-y divide-slate-200/60">
                    {/* Email diff */}
                    {req.requested_values.email && req.requested_values.email !== req.current_values.email && (
                      <div className="pt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                        <span className="font-semibold text-slate-600 flex items-center gap-1">
                          <Mail className="h-3 w-3 text-indigo-500" /> Email:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="line-through text-slate-400 text-[10px]">{req.current_values.email || "Empty"}</span>
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {req.requested_values.email}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Phone diff */}
                    {req.requested_values.phone && req.requested_values.phone !== req.current_values.phone && (
                      <div className="pt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                        <span className="font-semibold text-slate-600 flex items-center gap-1">
                          <Phone className="h-3 w-3 text-emerald-500" /> Phone:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="line-through text-slate-400 text-[10px]">{req.current_values.phone || "Empty"}</span>
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {req.requested_values.phone}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Avatar URL diff */}
                    {req.requested_values.avatar_url && req.requested_values.avatar_url !== req.current_values.avatar_url && (
                      <div className="pt-1.5 flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-semibold text-slate-600 flex items-center gap-1">
                          <ImageIcon className="h-3 w-3 text-purple-500" /> Photo:
                        </span>
                        <div className="flex items-center gap-2">
                          <img
                            src={req.requested_values.avatar_url}
                            alt="New Photo Preview"
                            className="h-8 w-8 rounded-lg object-cover border border-indigo-200 shadow-2xs"
                          />
                          <a
                            href={req.requested_values.avatar_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-indigo-600 underline font-medium"
                          >
                            View Full Photo ↗
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Address diff */}
                    {req.requested_values.address && req.requested_values.address !== req.current_values.address && (
                      <div className="pt-1.5 space-y-1 text-[11px]">
                        <span className="font-semibold text-slate-600 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-rose-500" /> Address:
                        </span>
                        <div className="text-slate-800 font-medium bg-white p-2 rounded-lg border border-slate-200">
                          {req.requested_values.address}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {req.reason && (
                  <div className="text-[11px] text-slate-500 italic">
                    <strong>User Context:</strong> "{req.reason}"
                  </div>
                )}

                {req.admin_remarks && (
                  <div className="text-[11px] p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-100 text-indigo-950 space-y-0.5">
                    <div className="font-bold flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-indigo-600" /> Admin Feedback / Note:
                    </div>
                    <p>{req.admin_remarks}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400">
                  {new Date(req.created_at).toLocaleDateString()} at {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                {req.status === "pending" ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] font-bold h-7 px-2.5 rounded-lg"
                      onClick={() => {
                        setSelectedReq(req);
                        setReviewAction("rejected");
                        setAdminRemarks("");
                      }}
                    >
                      <XCircle className="h-3 w-3 mr-1" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold h-7 px-3 rounded-lg shadow-2xs"
                      onClick={() => {
                        setSelectedReq(req);
                        setReviewAction("approved");
                        setAdminRemarks("");
                      }}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Approve &amp; Apply
                    </Button>
                  </div>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-500">
                    Resolved by {req.reviewed_by || "Admin"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      {selectedReq && (
        <Dialog open={!!selectedReq} onOpenChange={(open) => !open && setSelectedReq(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                {reviewAction === "approved" ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    Approve Profile Change
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-rose-600" />
                    Reject Profile Change Request
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {reviewAction === "approved"
                  ? `Applying requested details for ${selectedReq.user_name} (${selectedReq.user_role}). This will immediately update the database.`
                  : `Rejecting change request for ${selectedReq.user_name}.`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  {reviewAction === "approved" ? "Admin Note / Welcome Remarks (Optional)" : "Rejection Reason *"}
                </label>
                <Input
                  required={reviewAction === "rejected"}
                  placeholder={
                    reviewAction === "approved"
                      ? "e.g. Identity verified via employee records"
                      : "e.g. Invalid phone format / proof of address required"
                  }
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedReq(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isSubmitting || (reviewAction === "rejected" && !adminRemarks.trim())}
                onClick={handleReviewSubmit}
                className={reviewAction === "approved" ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold" : "bg-rose-600 hover:bg-rose-700 text-white font-bold"}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : reviewAction === "approved" ? (
                  "Confirm Approval"
                ) : (
                  "Confirm Rejection"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
