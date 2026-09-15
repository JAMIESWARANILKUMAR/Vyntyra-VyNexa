import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { 
  ClipboardList, Send, Loader2, Search, User, Eye, HeartHandshake, CheckCircle2, TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";

import { listDetailedFeedbacks, dispatchFeedbackForm } from "@/lib/operations.functions";

export function AdminDetailedFeedbacksView() {
  const qc = useQueryClient();
  const fetchFeedbacks = useServerFn(listDetailedFeedbacks);
  const triggerCampaign = useServerFn(dispatchFeedbackForm);

  const { data: feedbacks, isLoading, refetch } = useQuery({
    queryKey: ["detailed-feedbacks"],
    queryFn: () => fetchFeedbacks(),
  });

  const [isDispatching, setIsDispatching] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [targetType, setTargetType] = useState<"all" | "interns" | "employees">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingFeedback, setViewingFeedback] = useState<any>(null);

  const handleDispatch = async () => {
    setIsDispatching(true);
    try {
      const res = await triggerCampaign({ data: { targetType } });
      toast.success(`Dispatched master feedback form to ${res.count} members.`);
      setShowDispatchModal(false);
      qc.invalidateQueries({ queryKey: ["detailed-feedbacks"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch feedback form.");
    } finally {
      setIsDispatching(false);
    }
  };

  const filteredFeedbacks = (feedbacks || []).filter((f: any) => {
    const term = searchQuery.toLowerCase();
    return (f.intern_name || f.profiles?.full_name || "").toLowerCase().includes(term) ||
           (f.profiles?.email || "").toLowerCase().includes(term) ||
           (f.domain_track || "").toLowerCase().includes(term);
  });

  // Analytics
  const avgNps = filteredFeedbacks.length ? (filteredFeedbacks.reduce((acc: number, f: any) => acc + (f.nps_score || 0), 0) / filteredFeedbacks.length).toFixed(1) : "N/A";
  const promoterCount = filteredFeedbacks.filter((f: any) => (f.nps_score || 0) >= 9).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-indigo-950 p-6 rounded-2xl border border-indigo-900 shadow-sm text-white">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-indigo-400 shrink-0" /> Master Feedback Campaigns
          </h2>
          <p className="text-xs text-indigo-200 mt-1">
            Dispatch the 30-question master feedback form to members and analyze deep organizational metrics and NPS.
          </p>
          <div className="flex items-center gap-4 mt-4">
             <div className="bg-indigo-900/50 rounded-lg px-3 py-1.5 border border-indigo-800/50 flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-medium">Avg NPS: <span className="font-bold">{avgNps}</span></span>
             </div>
             <div className="bg-indigo-900/50 rounded-lg px-3 py-1.5 border border-indigo-800/50 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-medium">Promoters: <span className="font-bold">{promoterCount}</span></span>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => setShowDispatchModal(true)}
            className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold shadow-md h-10"
          >
            <Send className="h-4 w-4 mr-2" /> Dispatch Master Form
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950 border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50">
          <h3 className="font-semibold flex items-center gap-2">
            Submitted Feedbacks
            <Badge className="bg-indigo-100 text-indigo-800">{filteredFeedbacks.length}</Badge>
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search by name, email, domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs bg-white"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-indigo-500" />
            <p className="text-sm font-medium">Loading feedback responses...</p>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <ClipboardList className="h-5 w-5 text-slate-400" />
            </div>
            <h4 className="font-semibold text-slate-900">No Responses Found</h4>
            <p className="text-sm text-slate-500 max-w-sm mt-1">No one has submitted a master feedback form yet.</p>
          </div>
        ) : (
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {filteredFeedbacks.map((f: any) => (
              <div key={f.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{f.intern_name || f.profiles?.full_name || "Unknown"}</h4>
                    <p className="text-xs text-slate-500">{f.domain_track || f.profiles?.role}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="hidden sm:block text-right">
                    <p className="text-xs font-bold text-slate-800">NPS Score</p>
                    <div className="flex items-center justify-end gap-1">
                      <span className={`text-lg font-black ${f.nps_score >= 9 ? 'text-emerald-500' : f.nps_score >= 7 ? 'text-amber-500' : 'text-rose-500'}`}>
                        {f.nps_score}/10
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setViewingFeedback(f)} className="shrink-0 h-9">
                    <Eye className="h-4 w-4 mr-2" /> View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dispatch Modal */}
      <Dialog open={showDispatchModal} onOpenChange={setShowDispatchModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Generate Feedback Campaign</DialogTitle>
            <DialogDescription>
              This will trigger a mandatory onscreen popup for the selected users. They will not be able to dismiss it until they submit their feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Target Audience</label>
              <select
                className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as any)}
              >
                <option value="all">All Active Members (Interns & Employees)</option>
                <option value="interns">Interns Only</option>
                <option value="employees">Employees Only</option>
              </select>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
              <p className="text-xs text-indigo-800 leading-relaxed">
                Users will receive the new comprehensive 30-question Master Feedback form covering 8 sections.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDispatchModal(false)}>Cancel</Button>
            <Button onClick={handleDispatch} disabled={isDispatching} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isDispatching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Dispatch Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Viewing Modal */}
      <Dialog open={!!viewingFeedback} onOpenChange={(open) => !open && setViewingFeedback(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {viewingFeedback && (
            <>
              <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl">Feedback Details</DialogTitle>
                  <p className="text-sm text-slate-300 mt-1">
                    Submitted by {viewingFeedback.intern_name || viewingFeedback.profiles?.full_name} on {new Date(viewingFeedback.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl font-black ${viewingFeedback.nps_score >= 9 ? 'bg-emerald-500' : viewingFeedback.nps_score >= 7 ? 'bg-amber-500' : 'bg-rose-500'}`}>
                  {viewingFeedback.nps_score}
                </div>
              </div>
              
              <ScrollArea className="max-h-[70vh] p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  
                  {/* Section 1 & 2 */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">Context</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between border-b pb-1"><span className="text-sm text-slate-500">Domain</span><span className="text-sm font-medium">{viewingFeedback.domain_track || "N/A"}</span></div>
                        <div className="flex justify-between border-b pb-1"><span className="text-sm text-slate-500">Duration</span><span className="text-sm font-medium">{viewingFeedback.internship_duration || "N/A"}</span></div>
                        <div className="flex justify-between border-b pb-1"><span className="text-sm text-slate-500">Mentorship Checks</span><span className="text-sm font-medium">{viewingFeedback.mentor_checkins || "N/A"}</span></div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">Ratings (out of 5)</h4>
                      <div className="space-y-2 bg-slate-50 p-4 rounded-xl border">
                        <div className="flex justify-between"><span className="text-sm text-slate-600">Mentor Access</span><span className="text-sm font-bold">{viewingFeedback.mentor_accessibility}/5</span></div>
                        <div className="flex justify-between"><span className="text-sm text-slate-600">Feedback Quality</span><span className="text-sm font-bold">{viewingFeedback.feedback_quality}/5</span></div>
                        <div className="flex justify-between"><span className="text-sm text-slate-600">Doubts Resolved</span><span className="text-sm font-bold">{viewingFeedback.doubts_resolved}/5</span></div>
                        <div className="flex justify-between"><span className="text-sm text-slate-600">Tasks Clarity</span><span className="text-sm font-bold">{viewingFeedback.tasks_clarity}/5</span></div>
                        <div className="flex justify-between"><span className="text-sm text-slate-600">Tasks Autonomy</span><span className="text-sm font-bold">{viewingFeedback.tasks_autonomy}/5</span></div>
                        <div className="flex justify-between"><span className="text-sm text-slate-600">Portal Usability</span><span className="text-sm font-bold">{viewingFeedback.portal_usability}/5</span></div>
                        <div className="flex justify-between"><span className="text-sm text-slate-600">Workload Manageability</span><span className="text-sm font-bold">{viewingFeedback.workload_manageability}/5</span></div>
                        <div className="flex justify-between"><span className="text-sm text-slate-600">Collaboration</span><span className="text-sm font-bold">{viewingFeedback.collaboration}/5</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Text Responses */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">Deep Insights</h4>
                      
                      <div className="space-y-4">
                        <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                          <span className="text-xs font-bold text-indigo-800">Biggest Bottleneck</span>
                          <p className="text-sm text-slate-700 mt-1">{viewingFeedback.biggest_bottleneck || "None reported."}</p>
                        </div>
                        <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                          <span className="text-xs font-bold text-emerald-800">Program Change Suggestion</span>
                          <p className="text-sm text-slate-700 mt-1">{viewingFeedback.program_change || "None reported."}</p>
                        </div>
                        <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                          <span className="text-xs font-bold text-amber-800">Best Project / Tasks</span>
                          <p className="text-sm text-slate-700 mt-1">{viewingFeedback.best_project || "None reported."}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-xs font-bold text-slate-800">Missing Tools</span>
                          <p className="text-sm text-slate-700 mt-1">{viewingFeedback.missing_tools || "None reported."}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-100 p-3 rounded-xl">
                       <span className="text-sm font-bold text-slate-700">Would return?</span>
                       <Badge className="bg-white text-slate-800">{viewingFeedback.return_interest}</Badge>
                    </div>
                  </div>

                </div>
              </ScrollArea>
              
              <div className="p-4 border-t bg-slate-50 flex justify-end">
                <Button onClick={() => setViewingFeedback(null)}>Close</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
