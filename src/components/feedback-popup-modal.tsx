import { useState } from "react";
import { useServerFn } from "@tanstack/start";
import { useQueryClient } from "@tanstack/react-query";
import { Star, MessageSquare, Send, Loader2, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";

import { submitDetailedFeedback } from "@/lib/operations.functions";

export function FeedbackPopupModal({ profile }: { profile: any }) {
  const qc = useQueryClient();
  const submitFeedback = useServerFn(submitDetailedFeedback);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    company_rating: 0,
    resources_rating: 0,
    task_level_rating: 0,
    mentorship_rating: 0,
    nature_of_internship_rating: 0,
    experience_text: "",
    trouble_faced_text: "",
    mentor_feedback_text: "",
    suggestions_text: "",
  });

  if (!profile?.feedback_popup_active) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_rating || !form.resources_rating || !form.task_level_rating || !form.mentorship_rating || !form.nature_of_internship_rating) {
      return toast.error("Please provide a star rating for all fields.");
    }
    if (!form.experience_text.trim()) {
      return toast.error("Please describe your experience in Vyntyra.");
    }
    
    setIsSubmitting(true);
    try {
      await submitFeedback({ data: form });
      toast.success("Thank you! Your feedback has been submitted successfully.");
      // Invalidate profile to hide modal
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, label }: { value: number, onChange: (val: number) => void, label: string }) => (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-bold text-slate-700">{label}</span>
      <div className="flex items-center gap-1 cursor-pointer">
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star} 
            className={`h-6 w-6 transition-colors ${star <= value ? "fill-amber-400 text-amber-400" : "text-slate-200 hover:text-amber-200"}`}
            onClick={() => onChange(star)}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 text-slate-900 my-8">
        
        <div className="flex items-center gap-4 border-b pb-4">
          <div className="p-3 bg-blue-100 border border-blue-200 rounded-2xl text-blue-600 shadow-sm">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-xl leading-tight">
              Mandatory Feedback Form
            </h3>
            <p className="text-sm text-slate-500 mt-1">Please share your experience with us. This helps us improve!</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <StarRating label="Vyntyra Company Rating" value={form.company_rating} onChange={v => setForm({ ...form, company_rating: v })} />
            <StarRating label="Provided Resources" value={form.resources_rating} onChange={v => setForm({ ...form, resources_rating: v })} />
            <StarRating label="Task Level & Workload" value={form.task_level_rating} onChange={v => setForm({ ...form, task_level_rating: v })} />
            <StarRating label="Mentorship & Guidance" value={form.mentorship_rating} onChange={v => setForm({ ...form, mentorship_rating: v })} />
            <StarRating label="Nature of Internship" value={form.nature_of_internship_rating} onChange={v => setForm({ ...form, nature_of_internship_rating: v })} />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span> 
                What has been your experience in Vyntyra so far? <span className="text-rose-500">*</span>
              </label>
              <textarea
                className="w-full h-24 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                placeholder="Share your thoughts about your journey..."
                value={form.experience_text}
                onChange={e => setForm({ ...form, experience_text: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span> 
                What trouble did you face throughout this internship?
              </label>
              <textarea
                className="w-full h-20 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                placeholder="Any technical or operational challenges? Let us know..."
                value={form.trouble_faced_text}
                onChange={e => setForm({ ...form, trouble_faced_text: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> 
                Feedback on your Mentor
              </label>
              <textarea
                className="w-full h-20 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                placeholder="How was the guidance and support from your mentor?"
                value={form.mentor_feedback_text}
                onChange={e => setForm({ ...form, mentor_feedback_text: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span> 
                Suggestions for Improvement
              </label>
              <textarea
                className="w-full h-20 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                placeholder="How can we make this program better for future interns?"
                value={form.suggestions_text}
                onChange={e => setForm({ ...form, suggestions_text: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4 border-t flex items-center justify-end">
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 h-12 rounded-xl">
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
              Submit Feedback
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
