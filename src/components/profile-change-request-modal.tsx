import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  User, Mail, Phone, MapPin, Image as ImageIcon, ShieldAlert, CheckCircle2,
  Clock, XCircle, Send, Loader2, History
} from "lucide-react";
import { toast } from "sonner";
import { requestProfileChange, getMyProfileChangeRequests, type ProfileChangeRequestItem } from "@/lib/operations.functions";

interface ProfileChangeRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProfile: {
    full_name?: string;
    email?: string;
    phone_number?: string;
    avatar_url?: string;
    address?: string;
    role?: string;
    department?: string;
  };
}

export function ProfileChangeRequestModal({
  open,
  onOpenChange,
  currentProfile,
}: ProfileChangeRequestModalProps) {
  const qc = useQueryClient();
  const doRequestChange = useServerFn(requestProfileChange);
  const fetchMyRequests = useServerFn(getMyProfileChangeRequests);

  const [email, setEmail] = useState(currentProfile.email || "");
  const [phone, setPhone] = useState(currentProfile.phone_number || "");
  const [avatarUrl, setAvatarUrl] = useState(currentProfile.avatar_url || "");
  const [address, setAddress] = useState(currentProfile.address || "");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeView, setActiveView] = useState<"form" | "history">("form");

  const myRequestsQ = useQuery({
    queryKey: ["my-profile-change-requests"],
    queryFn: () => fetchMyRequests(),
    enabled: open,
  });

  const requestsList: ProfileChangeRequestItem[] = myRequestsQ.data || [];
  const latestPending = requestsList.find((r) => r.status === "pending");

  const hasChanges =
    (email && email !== currentProfile.email) ||
    (phone && phone !== currentProfile.phone_number) ||
    (avatarUrl && avatarUrl !== currentProfile.avatar_url) ||
    (address && address !== currentProfile.address);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) {
      toast.info("Please modify at least one field (Email, Phone, Image, or Address) before requesting approval.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await doRequestChange({
        data: {
          requested_email: email.trim() || undefined,
          requested_phone: phone.trim() || undefined,
          requested_avatar_url: avatarUrl.trim() || undefined,
          requested_address: address.trim() || undefined,
          reason: reason.trim() || undefined,
        },
      });

      toast.success(res.message);
      qc.invalidateQueries({ queryKey: ["my-profile-change-requests"] });
      setActiveView("history");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit profile change request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600">
                <User className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Update Profile Details
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Secure change requests for sensitive identity and contact information
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveView("form")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  activeView === "form"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Edit Form
              </button>
              <button
                type="button"
                onClick={() => setActiveView("history")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                  activeView === "history"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <History className="h-3 w-3" />
                History ({requestsList.length})
              </button>
            </div>
          </div>
        </DialogHeader>

        {activeView === "form" ? (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Informational Policy Banner */}
            <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 text-xs text-amber-900 dark:text-amber-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                Admin Verification Policy
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-400">
                To maintain corporate compliance and prevent identity spoofing, edits to your official <strong>Email</strong>, <strong>Phone Number</strong>, <strong>Profile Photo</strong>, and <strong>Residential Address</strong> are routed to Directorate Admin for manual verification and approval.
              </p>
            </div>

            {latestPending && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
                  <span>You have an active profile change request awaiting Admin review.</span>
                </div>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-[10px]">
                  Pending Admin Approval
                </Badge>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Email */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-indigo-500" /> Official Email Address
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@vyntyra.com"
                  className="text-xs"
                />
                {currentProfile.email && (
                  <span className="text-[10px] text-slate-400">Current: {currentProfile.email}</span>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-emerald-500" /> Phone / WhatsApp Number
                </Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="text-xs"
                />
                {currentProfile.phone_number && (
                  <span className="text-[10px] text-slate-400">Current: {currentProfile.phone_number}</span>
                )}
              </div>
            </div>

            {/* Profile Avatar Image URL */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5 text-purple-500" /> Profile Image / Avatar Direct URL
              </Label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or Google Drive / Cloudinary URL"
                  className="text-xs flex-1"
                />
                {avatarUrl && (
                  <img
                    src={avatarUrl}
                    alt="Preview"
                    className="h-9 w-9 rounded-xl object-cover border border-slate-200"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                )}
              </div>
            </div>

            {/* Residential Address */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-rose-500" /> Residential / Current Address
              </Label>
              <Textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House / Flat No., Street, City, State, PIN Code"
                className="text-xs"
              />
              {currentProfile.address && (
                <span className="text-[10px] text-slate-400 line-clamp-1">Current: {currentProfile.address}</span>
              )}
            </div>

            {/* Reason / Justification */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">
                Reason for Change (Optional Context for Admin)
              </Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Relocated to new apartment / Corrected phone typo"
                className="text-xs"
              />
            </div>

            <div className="pt-3 border-t flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">
                {hasChanges ? "✨ Changes detected ready for submission" : "No fields modified yet"}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !hasChanges}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 px-4 h-9 shadow-sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Submit for Admin Approval
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-3 pt-2">
            {myRequestsQ.isLoading ? (
              <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading change history...
              </div>
            ) : requestsList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <History className="h-8 w-8 mx-auto text-slate-300" />
                <p>No profile change requests submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                {requestsList.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        Request ID: <span className="font-mono text-indigo-600">#{req.id.slice(-6)}</span>
                      </span>
                      {req.status === "pending" && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">
                          <Clock className="h-3 w-3 mr-1" /> Pending Admin Review
                        </Badge>
                      )}
                      {req.status === "approved" && (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Approved & Applied
                        </Badge>
                      )}
                      {req.status === "rejected" && (
                        <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10px]">
                          <XCircle className="h-3 w-3 mr-1" /> Rejected
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-slate-400 block font-semibold">Requested Phone:</span>
                        <span className="text-slate-700">{req.requested_values.phone || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Requested Email:</span>
                        <span className="text-slate-700 truncate block">{req.requested_values.email || "—"}</span>
                      </div>
                      {req.requested_values.address && (
                        <div className="col-span-2">
                          <span className="text-slate-400 block font-semibold">Requested Address:</span>
                          <span className="text-slate-700">{req.requested_values.address}</span>
                        </div>
                      )}
                    </div>

                    {req.admin_remarks && (
                      <div className="text-[11px] p-2 rounded bg-indigo-50 border border-indigo-100 text-indigo-900">
                        <strong>Admin Feedback:</strong> {req.admin_remarks}
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                      <span>Submitted: {new Date(req.created_at).toLocaleString()}</span>
                      {req.reviewed_at && (
                        <span>Reviewed: {new Date(req.reviewed_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setActiveView("form")} className="text-xs">
                Back to Edit Form
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
