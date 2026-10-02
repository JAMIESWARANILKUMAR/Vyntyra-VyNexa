import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { generateAiTestFn, saveGeneratedTestFn, listCbtTargetsFn, listAdminTestsFn, deleteAdminTestFn, toggleAdminTestStatusFn, listAdminTestSubmissionsFn, reassignAdminTestFn } from "@/lib/cbt.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BrainCircuit, Upload, Loader2, Save, Users, FileText, CheckCircle2, Trash2, CheckCircle, XCircle, RefreshCw, AlertTriangle, Search, Activity, Clock, UserPlus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ActiveStreamsSection } from "./cbt-streams";

const ALL_MODULES = [
  { id: "mcq", label: "Multiple Choice (MCQ)" },
  { id: "true_false", label: "True / False" },
  { id: "short_answer", label: "Short Answer" },
  { id: "code_snippet", label: "Code Snippet / SQL" },
  { id: "scenario", label: "Scenario Based" }
];

export function CbtOperationsTab() {
  const [activeSubTab, setActiveSubTab] = useState<"monitor" | "generate">("monitor");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-indigo-600" />
            AI CBT Engine V2
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Manage test generation, proctoring, and live candidate monitoring.
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab("monitor")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeSubTab === "monitor"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            }`}
          >
            Monitor & Submissions
          </button>
          <button
            onClick={() => setActiveSubTab("generate")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeSubTab === "generate"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            }`}
          >
            Generate Test
          </button>
        </div>
      </div>

      {activeSubTab === "monitor" ? <AdminCbtSubmissionsView /> : <AdminCbtGenerateView />}
    </div>
  );
}

function AdminCbtGenerateView() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passingScore, setPassingScore] = useState(50);
  const [targetType, setTargetType] = useState("intern");
  const [targetId, setTargetId] = useState("");
  const [taskContext, setTaskContext] = useState("");
  const [modules, setModules] = useState<string[]>(["mcq"]);
  const [generated, setGenerated] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [targets, setTargets] = useState<{interns: any[], teams: any[]}>({ interns: [], teams: [] });
  
  const generateFn = useServerFn(generateAiTestFn);
  const saveFn = useServerFn(saveGeneratedTestFn);
  const getTargetsFn = useServerFn(listCbtTargetsFn);

  useEffect(() => {
    getTargetsFn().then(res => setTargets(res)).catch(e => console.error(e));
  }, []);

  const toggleModule = (id: string) => {
    if (modules.includes(id)) {
      if (modules.length === 1) return toast.error("Must select at least one module");
      setModules(modules.filter(m => m !== id));
    } else {
      setModules([...modules, id]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsGenerating(true);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(" ");
        text += pageText + "\n";
      }
      setTaskContext(prev => prev + (prev ? "\n\n" : "") + "--- PDF EXTRACTED CONTEXT ---\n" + text);
      toast.success("PDF parsed and appended to context!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to parse PDF.");
    } finally {
      setIsGenerating(false);
      e.target.value = "";
    }
  };

  const handleGenerate = async () => {
    if (!title.trim()) return toast.error("Please provide an Exam Title.");
    if (!targetId || targetId === "none") return toast.error("Please select a valid target Intern or Team.");
    if (!taskContext.trim()) return toast.error("Please provide Task Context.");
    
    setIsGenerating(true);
    try {
      const res = await generateFn({ data: { 
        taskContext, 
        modules
      } });
      
      if (res.error) {
        toast.error(res.error);
      } else {
        // Map questions to include a default manual timer of 60 seconds
        const questionsWithTimers = res.questions.map((q: any) => ({
          ...q,
          time_limit_seconds: 60
        }));
        setGenerated({ ...res, questions: questionsWithTimers });
        toast.success("Exam questions generated! Review below and click 'Approve & Assign CBT Exam' to allocate.");
        setTimeout(() => {
          window.scrollTo({ top: 800, behavior: 'smooth' });
        }, 150);
      }
    } catch (e) {
      toast.error("Generation failed. Please try again.");
    }
    setIsGenerating(false);
  };

  const handleSave = async () => {
    try {
      const res = await saveFn({ data: {
        testMetadata: { 
          title: title, 
          description: description,
          target_type: targetType, 
          target_id: targetId, 
          passing_score: passingScore,
          modules
        },
        questions: generated.questions
      } });
      if (res.success) {
        toast.success(res.message || "Test Approved & Published successfully!");
        setGenerated(null);
        setTargetId("");
        setTaskContext("");
        setTitle("");
        setDescription("");
      }
    } catch (e) {
      toast.error("Failed to save test.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-indigo-500"/> Exam Metadata</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Exam Title</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-lg mt-1" 
                  placeholder="e.g., Senior Frontend Evaluation"
                  value={title} onChange={e => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea 
                  className="w-full p-2 border rounded-lg mt-1 resize-none" 
                  rows={2}
                  placeholder="Brief description of the exam..."
                  value={description} onChange={e => setDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Passing Score (%)</label>
                <input 
                  type="number" 
                  min={1} max={100}
                  className="w-full p-2 border rounded-lg mt-1" 
                  value={passingScore} onChange={e => setPassingScore(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          
          <hr className="border-slate-100" />
          
          <div>
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-indigo-500"/> Target Selection</h3>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="target" checked={targetType === "intern"} onChange={() => { setTargetType("intern"); setTargetId(""); }} /> Intern
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="target" checked={targetType === "team"} onChange={() => { setTargetType("team"); setTargetId(""); }} /> Team
              </label>
            </div>
            
            {targetType === "intern" ? (
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger className="w-full bg-white border-slate-300">
                  <SelectValue placeholder="Select an Intern..." />
                </SelectTrigger>
                <SelectContent>
                  {targets.interns.map(intern => (
                    <SelectItem key={intern.id} value={intern.id}>
                      {intern.full_name} ({intern.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger className="w-full bg-white border-slate-300">
                  <SelectValue placeholder="Select a Team..." />
                </SelectTrigger>
                <SelectContent>
                  {targets.teams.length === 0 && <SelectItem value="none" disabled>No active teams found</SelectItem>}
                  {targets.teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
          </div>

          <div>
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-rose-500"/> Task Context & Reference</h3>
            <textarea 
              className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-sm" 
              rows={4} 
              placeholder="Paste the task documentation or specific scenario details here. The AI will generate questions based on this."
              value={taskContext}
              onChange={e => setTaskContext(e.target.value)}
            />
            <label className="mt-3 p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-center cursor-pointer hover:bg-slate-100 transition-colors block">
              <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} />
              <Upload className="h-6 w-6 text-slate-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-700">Upload PDF / Word Report</div>
              <div className="text-xs text-slate-500 mt-1">Parses directly into context box</div>
            </label>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-emerald-500"/> Exam Config & Modules</h3>
          
          <p className="text-sm text-slate-500 mb-4">Select the specific modules to generate for this CBT run. The AI will mix and match questions accordingly.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {ALL_MODULES.map(m => {
              const checked = modules.includes(m.id);
              return (
                <label key={m.id} className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${checked ? "bg-emerald-50 border-emerald-300" : "hover:bg-slate-50"}`}>
                  <input type="checkbox" className="mt-1 h-4 w-4 text-emerald-600" checked={checked} onChange={() => toggleModule(m.id)} />
                  <span className={`text-sm ${checked ? "font-bold text-emerald-900" : "text-slate-700 font-medium"}`}>{m.label}</span>
                </label>
              );
            })}
          </div>
          <div className="mt-auto">
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-lg font-bold rounded-xl shadow-lg shadow-indigo-500/30">
              {isGenerating ? <><Loader2 className="mr-2 animate-spin h-5 w-5" /> Generating via Gemini AI...</> : <><BrainCircuit className="mr-2 h-5 w-5" /> Step 1: Generate & Review Exam</>}
            </Button>
          </div>
        </div>
      </div>

      {generated && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-200 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h2 className="text-xl font-black text-slate-900">Generated Exam Preview</h2>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                onClick={() => {
                  setGenerated({
                    ...generated,
                    questions: [
                      ...generated.questions,
                      {
                        question_type: "mcq",
                        question_text: "New Custom Question",
                        options: [{ id: "A", text: "Option A" }, { id: "B", text: "Option B" }],
                        correct_answer: "A",
                        time_limit_seconds: 60,
                        max_points: 10,
                        difficulty: "medium"
                      }
                    ]
                  })
                }}
              >
                + Add Custom Question
              </Button>
              <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 font-bold px-6 shadow-md shadow-emerald-500/20">
                <CheckCircle2 className="mr-2 h-5 w-5" /> Approve & Assign CBT Exam
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {generated.questions.map((q: any, i: number) => (
              <div key={i} className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <div className="font-bold text-slate-800">Q{i+1}: {q.question_type.toUpperCase()}</div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <input 
                        type="number" 
                        min={10} max={600}
                        className="w-16 p-1 text-xs border rounded-md text-center" 
                        value={q.time_limit_seconds || 60}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const newQ = [...generated.questions];
                          newQ[i].time_limit_seconds = val;
                          setGenerated({ ...generated, questions: newQ });
                        }}
                      />
                      <span className="text-xs text-slate-500">secs</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${q.difficulty === "hard" ? "bg-rose-100 text-rose-700" : q.difficulty === "medium" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {q.difficulty}
                  </div>
                </div>
                <textarea 
                  className="w-full p-2 text-slate-700 mb-3 text-sm border rounded-lg resize-none focus:ring-1 focus:ring-emerald-500" 
                  rows={2}
                  value={q.question_text}
                  onChange={(e) => {
                    const newQ = [...generated.questions];
                    newQ[i].question_text = e.target.value;
                    setGenerated({ ...generated, questions: newQ });
                  }}
                />
                {q.options && (
                  <ul className="space-y-1 pl-4 text-sm text-slate-600">
                    {q.options.map((o: any, idx: number) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="h-4 w-4 flex items-center justify-center rounded-full border border-slate-300 text-[10px]">{idx+1}</span>
                        {o.text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

  function AdminCbtSubmissionsView() {
    const qc = useQueryClient();
    const fetchTests = useServerFn(listAdminTestsFn);
    const doDelete = useServerFn(deleteAdminTestFn);
    const doToggle = useServerFn(toggleAdminTestStatusFn);
    const fetchTargets = useServerFn(listCbtTargetsFn);
    const doReassign = useServerFn(reassignAdminTestFn);
    
    const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
    const [assigningExam, setAssigningExam] = useState<any>(null);
    const [assignTargetType, setAssignTargetType] = useState<"intern" | "team">("intern");
    const [assignTargetId, setAssignTargetId] = useState<string>("");
    const [isReassigning, setIsReassigning] = useState<boolean>(false);

    const handleConfirmAssign = async () => {
      if (!assigningExam) return;
      if (!assignTargetId) return toast.error("Please select a target Intern or Team.");
      setIsReassigning(true);
      try {
        const res = await doReassign({
          data: {
            testId: assigningExam.id,
            target_type: assignTargetType,
            target_id: assignTargetId,
          }
        });
        toast.success(res.message || "Test allocated and assigned successfully!");
        setAssigningExam(null);
        setAssignTargetId("");
        qc.invalidateQueries({ queryKey: ["admin-cbt-tests"] });
      } catch (err: any) {
        toast.error(err.message || "Failed to assign test");
      } finally {
        setIsReassigning(false);
      }
    };
  
    const { data: tests = [], isLoading: isLoadingTests } = useQuery({
      queryKey: ["admin-cbt-tests"],
      queryFn: () => fetchTests(),
    });
    
    const { data: targets } = useQuery({
      queryKey: ["cbt-targets"],
      queryFn: () => fetchTargets(),
    });
  
    const deleteMut = useMutation({
      mutationFn: (id: string) => doDelete({ data: { testId: id } }),
      onSuccess: () => { toast.success("Test deleted"); qc.invalidateQueries({ queryKey: ["admin-cbt-tests"] }); },
      onError: () => toast.error("Failed to delete test")
    });
  
    const toggleMut = useMutation({
      mutationFn: ({ id, status }: { id: string, status: string }) => doToggle({ data: { testId: id, status } }),
      onSuccess: () => { toast.success("Status updated"); qc.invalidateQueries({ queryKey: ["admin-cbt-tests"] }); },
      onError: () => toast.error("Failed to update status")
    });
  
    const getTargetName = (type: string, ids: string[]) => {
      if (!targets) return "Loading...";
      if (!ids || ids.length === 0) return "Global";
      const id = ids[0];
      if (type === "intern") {
        const intern = targets.interns.find(i => i.id === id);
        return intern ? intern.full_name : id;
      } else {
        const team = targets.teams.find(t => t.id === id);
        return team ? team.name : id;
      }
    };

    if (selectedTestId) {
      return <AdminCbtTestReviewView testId={selectedTestId} onBack={() => setSelectedTestId(null)} />;
    }
  
    return (
      <div className="space-y-6">
        <ActiveStreamsSection />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Activity className="h-6 w-6" /></div>
            <div><p className="text-sm font-bold text-slate-500">Published Exams</p><p className="text-2xl font-black text-slate-900">{tests.filter((t: any) => t.status === 'published').length}</p></div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle className="h-6 w-6" /></div>
            <div><p className="text-sm font-bold text-slate-500">Draft Exams</p><p className="text-2xl font-black text-slate-900">{tests.filter((t: any) => t.status === 'draft').length}</p></div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center"><FileText className="h-6 w-6" /></div>
            <div><p className="text-sm font-bold text-slate-500">Total Exams</p><p className="text-2xl font-black text-slate-900">{tests.length}</p></div>
          </div>
        </div>
  
        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b text-slate-600 font-bold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Target</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingTests ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading exams...</td></tr>
              ) : tests.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No exams found.</td></tr>
              ) : (
                tests.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-800">{t.title}</td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-600">{getTargetName(t.allocation_mode, t.allocation_mode === 'team' ? t.team_ids : t.intern_ids)}</span>
                      <span className="ml-2 text-[10px] uppercase font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{t.allocation_mode}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex w-fit items-center gap-1 ${t.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {t.status === 'published' ? <CheckCircle className="h-3 w-3"/> : <XCircle className="h-3 w-3"/>}
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs gap-1"
                        onClick={() => {
                          setAssignTargetType("intern");
                          setAssignTargetId("");
                          setAssigningExam(t);
                        }}
                      >
                        <UserPlus className="h-3.5 w-3.5" /> Assign Test
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setSelectedTestId(t.id)}>
                        Review Submissions
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleMut.mutate({ id: t.id, status: t.status === 'published' ? 'draft' : 'published' })}>
                        <RefreshCw className="h-4 w-4 mr-1" /> {t.status === 'published' ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => { if(confirm("Delete this test?")) deleteMut.mutate(t.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Assign Test Modal */}
        {assigningExam && (
          <Dialog open={!!assigningExam} onOpenChange={(open) => !open && setAssigningExam(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-indigo-600" />
                  Assign CBT Exam
                </DialogTitle>
                <DialogDescription>
                  Allocate <strong>{assigningExam.title}</strong> directly to an intern or an entire team.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Target Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                      <input 
                        type="radio" 
                        name="assignTargetType" 
                        value="intern" 
                        checked={assignTargetType === "intern"} 
                        onChange={() => { setAssignTargetType("intern"); setAssignTargetId(""); }} 
                      />
                      Individual Intern
                    </label>
                    <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                      <input 
                        type="radio" 
                        name="assignTargetType" 
                        value="team" 
                        checked={assignTargetType === "team"} 
                        onChange={() => { setAssignTargetType("team"); setAssignTargetId(""); }} 
                      />
                      Entire Team
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    {assignTargetType === "intern" ? "Select Intern" : "Select Team"}
                  </label>
                  <Select value={assignTargetId} onValueChange={setAssignTargetId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={assignTargetType === "intern" ? "Choose an intern..." : "Choose a team..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {assignTargetType === "intern"
                        ? (targets?.interns || []).map((i: any) => (
                            <SelectItem key={i.id} value={i.id}>
                              {i.full_name} ({i.email})
                            </SelectItem>
                          ))
                        : (targets?.teams || []).map((t: any) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setAssigningExam(null)}>Cancel</Button>
                <Button 
                  onClick={handleConfirmAssign} 
                  disabled={isReassigning || !assignTargetId}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {isReassigning ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Assigning...</> : "Confirm & Assign Test"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  function AdminCbtTestReviewView({ testId, onBack }: { testId: string, onBack: () => void }) {
    const fetchSubmissions = useServerFn(listAdminTestSubmissionsFn);
    
    const { data: submissions = [], isLoading } = useQuery({
      queryKey: ["admin-cbt-submissions", testId],
      queryFn: () => fetchSubmissions({ data: { testId } }),
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>&larr; Back to Exams</Button>
          <h2 className="text-xl font-black text-slate-900">Exam Submissions Hub</h2>
        </div>
        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b text-slate-600 font-bold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Intern Name</th>
                <th className="px-6 py-4">Submitted At</th>
                <th className="px-6 py-4">AI Score</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading submissions...</td></tr>
              ) : submissions.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No submissions yet.</td></tr>
              ) : (
                submissions.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-800">{sub.profiles?.full_name || sub.intern_id}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(sub.submitted_at || sub.started_at).toLocaleString()}</td>
                    <td className="px-6 py-4 font-black text-indigo-600">{sub.total_score} pts</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${sub.status === 'graded' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button variant="secondary" size="sm" onClick={() => toast.info("Review functionality goes here")}>
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toast.success("Score overridden!")}>
                        Override
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
