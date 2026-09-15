import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/start";
import { 
  ClipboardList, Star, Send, Loader2, Search, User
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";

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

  const handleDispatch = async () => {
    setIsDispatching(true);
    try {
      const res = await triggerCampaign({ data: { targetType } });
      toast.success(`Dispatched feedback form to ${res.count} members.`);
      setShowDispatchModal(false);
      qc.invalidateQueries({ queryKey: ["detailed-feedbacks"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch feedback form.");
    } finally {
      setIsDispatching(false);
    }
  };

  const filteredFeedbacks = (feedbacks || []).filter((f: any) => 
    (f.profiles?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.profiles?.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star key={star} className={`h-3 w-3 ${star <= (rating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white dark:bg-slate-950 p-5 sm:p-6 rounded-2xl border shadow-sm">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-blue-600 shrink-0" /> Structured Feedback Campaigns
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Dispatch mandatory structured feedback forms to members via in-app popup notifications and review their responses.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => setShowDispatchModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md h-9 text-xs"
          >
            <Send className="h-3.5 w-3.5 mr-2" /> Generate Feedback Form
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950 border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/20">
          <h3 className="font-semibold flex items-center gap-2">
            Submitted Feedbacks
            <Badge className="bg-blue-100 text-blue-800">{filteredFeedbacks.length}</Badge>
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-white"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-500" />
            <p className="text-sm font-medium">Loading feedback responses...</p>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <ClipboardList className="h-5 w-5 text-slate-400" />
            </div>
            <h4 className="font-semibold text-slate-900">No Structured Feedbacks Found</h4>
            <p className="text-sm text-slate-500 max-w-sm mt-1">No one has submitted a structured feedback form yet, or it doesn't match your search.</p>
          </div>
        ) : (
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {filteredFeedbacks.map((f: any) => (
              <div key={f.id} className="p-5 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left: User Info & Ratings */}
                  <div className="md:w-64 shrink-0 space-y-4 border-b md:border-b-0 md:border-r pb-4 md:pb-0 md:pr-4 border-slate-100">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{f.profiles?.full_name || "Unknown"}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><User className="h-3 w-3" /> {f.profiles?.email}</p>
                      <Badge variant="outline" className="mt-2 text-[10px] bg-slate-100">{f.profiles?.role}</Badge>
                    </div>
                    
                    <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Company</span>
                        {renderStars(f.company_rating)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Resources</span>
                        {renderStars(f.resources_rating)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Tasks</span>
                        {renderStars(f.task_level_rating)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Mentorship</span>
                        {renderStars(f.mentorship_rating)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Nature</span>
                        {renderStars(f.nature_of_internship_rating)}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium pt-1">
                      Submitted: {new Date(f.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Right: Text Responses */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span> Experience in Vyntyra
                      </h5>
                      <p className="text-sm text-slate-600 bg-blue-50/50 p-3 rounded-xl leading-relaxed whitespace-pre-wrap border border-blue-100/50">
                        {f.experience_text || "No response provided."}
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span> Trouble Faced Throughout Internship
                      </h5>
                      <p className="text-sm text-slate-600 bg-rose-50/50 p-3 rounded-xl leading-relaxed whitespace-pre-wrap border border-rose-100/50">
                        {f.trouble_faced_text || "No troubles reported."}
                      </p>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Feedback on Mentor
                      </h5>
                      <p className="text-sm text-slate-600 bg-emerald-50/50 p-3 rounded-xl leading-relaxed whitespace-pre-wrap border border-emerald-100/50">
                        {f.mentor_feedback_text || "No mentor feedback provided."}
                      </p>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span> Suggestions
                      </h5>
                      <p className="text-sm text-slate-600 bg-purple-50/50 p-3 rounded-xl leading-relaxed whitespace-pre-wrap border border-purple-100/50">
                        {f.suggestions_text || "No suggestions provided."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
                className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as any)}
              >
                <option value="all">All Active Members (Interns & Employees)</option>
                <option value="interns">Interns Only</option>
                <option value="employees">Employees Only</option>
              </select>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2">
              <ClipboardList className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-800 leading-relaxed">
                Users will be asked to rate Vyntyra's company, resources, task level, mentorship, and nature of internship, as well as provide detailed written feedback on their experience and troubles faced.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDispatchModal(false)}>Cancel</Button>
            <Button onClick={handleDispatch} disabled={isDispatching} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isDispatching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Dispatch Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
