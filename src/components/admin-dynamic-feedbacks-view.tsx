import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listFeedbackFormsFn, createFeedbackFormFn, toggleFeedbackFormFn, deleteFeedbackFormFn, listFeedbackResponsesFn } from "@/lib/operations.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Edit, ChevronDown, ChevronUp, Loader2, MessageSquare, Power, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AdminDynamicFeedbacksView() {
  const qc = useQueryClient();
  const fetchForms = useServerFn(listFeedbackFormsFn);
  const createForm = useServerFn(createFeedbackFormFn);
  const toggleForm = useServerFn(toggleFeedbackFormFn);
  const deleteForm = useServerFn(deleteFeedbackFormFn);
  const fetchResponses = useServerFn(listFeedbackResponsesFn);

  const { data: forms, isLoading } = useQuery({ queryKey: ["feedback-forms"], queryFn: () => fetchForms() });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<any[]>([{ id: "q1", text: "How would you rate your experience?", type: "rating" }]);
  const [activeFormId, setActiveFormId] = useState<string | null>(null);

  const responsesQ = useQuery({
    queryKey: ["feedback-responses", activeFormId],
    queryFn: () => fetchResponses({ data: { form_id: activeFormId! } }),
    enabled: !!activeFormId
  });

  const createMut = useMutation({
    mutationFn: async () => await createForm({ data: { title, description, questions, is_active: false } }),
    onSuccess: () => {
      toast.success("Feedback form created!");
      setIsCreateOpen(false);
      qc.invalidateQueries({ queryKey: ["feedback-forms"] });
    }
  });

  const toggleMut = useMutation({
    mutationFn: async (opts: any) => await toggleForm({ data: opts }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["feedback-forms"] });
    }
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => await deleteForm({ data: { id } }),
    onSuccess: () => {
      toast.success("Form deleted");
      qc.invalidateQueries({ queryKey: ["feedback-forms"] });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Dynamic Feedback Campaigns</h2>
          <p className="text-sm text-slate-500">Create custom feedback forms and collect responses from users.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Plus className="h-4 w-4" /> Create Form
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Feedback Form</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Form Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. End of Internship Survey" />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center justify-between">
                  Questions
                  <Button type="button" variant="outline" size="sm" onClick={() => setQuestions([...questions, { id: 'q'+Date.now(), text: '', type: 'text' }])}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </label>
                {questions.map((q, idx) => (
                  <div key={q.id} className="flex gap-2 items-center bg-slate-50 p-2 rounded border border-slate-200">
                    <Input className="flex-1 bg-white" value={q.text} onChange={(e) => {
                      const newQ = [...questions];
                      newQ[idx].text = e.target.value;
                      setQuestions(newQ);
                    }} placeholder="Question text..." />
                    <select className="h-10 rounded-md border border-slate-200 px-3 bg-white text-sm" value={q.type} onChange={(e) => {
                      const newQ = [...questions];
                      newQ[idx].type = e.target.value;
                      setQuestions(newQ);
                    }}>
                      <option value="text">Short Text</option>
                      <option value="textarea">Long Text</option>
                      <option value="rating">Rating (1-5)</option>
                    </select>
                    <Button variant="ghost" size="icon" onClick={() => setQuestions(questions.filter(x => x.id !== q.id))} className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button onClick={() => createMut.mutate()} disabled={createMut.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Feedback Form"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Form Title</th>
              <th className="px-4 py-3">Questions</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={4} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" /></td></tr>
            ) : !forms?.length ? (
              <tr><td colSpan={4} className="text-center py-8 text-slate-500">No feedback forms created yet.</td></tr>
            ) : forms.map((form: any) => (
              <React.Fragment key={form.id}>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{form.title}</td>
                  <td className="px-4 py-3 text-slate-500">{(form.questions || []).length} questions</td>
                  <td className="px-4 py-3">
                    <Badge variant={form.is_active ? "default" : "secondary"} className={form.is_active ? "bg-emerald-100 text-emerald-800" : ""}>
                      {form.is_active ? "Active" : "Draft"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant={form.is_active ? "destructive" : "outline"} onClick={() => toggleMut.mutate({ id: form.id, is_active: !form.is_active })}>
                        <Power className="h-3.5 w-3.5 mr-1" /> {form.is_active ? "Disable" : "Publish"}
                      </Button>
                      <Button size="sm" variant={activeFormId === form.id ? "default" : "outline"} onClick={() => setActiveFormId(activeFormId === form.id ? null : form.id)}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> Responses
                      </Button>
                      <Button size="icon" variant="ghost" className="text-red-500" onClick={() => deleteMut.mutate(form.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
                {activeFormId === form.id && (
                  <tr>
                    <td colSpan={4} className="bg-slate-50 p-4 border-b border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-4">Responses for {form.title}</h4>
                      {responsesQ.isLoading ? (
                        <div className="py-4 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-400" /></div>
                      ) : !responsesQ.data?.length ? (
                        <div className="py-4 text-center text-slate-500">No responses yet.</div>
                      ) : (
                        <div className="space-y-4">
                          {responsesQ.data.map((r: any) => (
                            <div key={r.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                              <div className="font-semibold text-slate-900 mb-2">{r.profiles?.full_name || 'Anonymous User'} <span className="text-xs text-slate-500 ml-2">{new Date(r.created_at).toLocaleString()}</span></div>
                              <div className="space-y-2">
                                {(form.questions || []).map((q: any) => (
                                  <div key={q.id}>
                                    <div className="text-xs font-medium text-slate-500">{q.text}</div>
                                    <div className="text-sm text-slate-800">{r.answers?.[q.id] || '-'}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
