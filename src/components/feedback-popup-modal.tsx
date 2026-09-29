import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { listFeedbackFormsFn, submitFeedbackResponseFn } from '@/lib/operations.functions';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function FeedbackPopupModal({ profile }: { profile: any }) {
  const qc = useQueryClient();
  const fetchForms = useServerFn(listFeedbackFormsFn);
  const submitResponse = useServerFn(submitFeedbackResponseFn);

  const { data: forms } = useQuery({
    queryKey: ['active-feedback-forms'],
    queryFn: () => fetchForms()
  });

  const activeForm = forms?.find((f: any) => f.is_active);

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (activeForm && profile && !isDismissed) {
      setIsOpen(true);
    }
  }, [activeForm, profile, isDismissed]);

  const submitMut = useMutation({
    mutationFn: async () => await submitResponse({ data: { form_id: activeForm!.id, answers } }),
    onSuccess: () => {
      toast.success("Thank you for your feedback!");
      setIsOpen(false);
      setIsDismissed(true);
      qc.invalidateQueries({ queryKey: ["active-feedback-forms"] });
    },
    onError: (err: any) => {
      if (err.message.includes("duplicate key")) {
        toast.error("You have already submitted this feedback form.");
        setIsOpen(false);
        setIsDismissed(true);
      } else {
        toast.error("Failed to submit feedback: " + err.message);
      }
    }
  });

  if (!isOpen || !activeForm) return null;

  const questions = activeForm.questions || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{activeForm.title}</h2>
            {activeForm.description && <p className="text-sm text-slate-500 mt-1">{activeForm.description}</p>}
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {questions.map((q: any) => (
            <div key={q.id} className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">{q.text} <span className="text-rose-500">*</span></label>
              {q.type === 'text' && (
                <input type="text" className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all text-sm" value={answers[q.id] || ''} onChange={e => setAnswers({...answers, [q.id]: e.target.value})} required />
              )}
              {q.type === 'textarea' && (
                <textarea className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all text-sm resize-none h-24" value={answers[q.id] || ''} onChange={e => setAnswers({...answers, [q.id]: e.target.value})} required />
              )}
              {q.type === 'rating' && (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setAnswers({...answers, [q.id]: num})}
                      className={`h-10 w-10 rounded-lg font-bold transition-all border ${answers[q.id] === num ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <Button onClick={() => submitMut.mutate()} disabled={submitMut.isPending || Object.keys(answers).length < questions.length} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-11 rounded-xl shadow-md shadow-indigo-200">
            {submitMut.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />} Submit Feedback
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
