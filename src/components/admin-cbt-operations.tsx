import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { generateAiTestFn, saveGeneratedTestFn, listCbtTargetsFn, listAdminTestsFn, deleteAdminTestFn, toggleAdminTestStatusFn } from "@/lib/cbt.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BrainCircuit, Upload, Loader2, Save, Users, FileText, CheckCircle2, Trash2, CheckCircle, XCircle, RefreshCw, AlertTriangle, Search, Activity } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [targetType, setTargetType] = useState("intern");
  const [targetId, setTargetId] = useState("");
  const [taskContext, setTaskContext] = useState("");
  const [modules, setModules] = useState<string[]>(["mcq"]);
  const [generated, setGenerated] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [timerPerQuestion, setTimerPerQuestion] = useState(60); // default 60s
  
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
    if (!targetId || targetId === "none") return toast.error("Please select a valid target Intern or Team.");
    if (!taskContext.trim()) return toast.error("Please provide Task Context.");
    
    setIsGenerating(true);
    try {
      const res = await generateFn({ data: { 
        targetType, 
        taskContext, 
        modules, 
        difficulty: "mixed" 
      } });
      
      if (res.error) {
        toast.error(res.error);
      } else {
        setGenerated(res);
        toast.success("AI Test generated successfully!");
      }
    } catch (e) {
      toast.error("Generation failed. Please try again.");
    }
    setIsGenerating(false);
  };

  const handleSave = async () => {
    try {
      const totalTime = Math.ceil((generated.questions.length * timerPerQuestion) / 60);
      const res = await saveFn({ data: {
        testMetadata: { 
          title: `Assigned CBT - ${targetType.toUpperCase()}`, 
          target_type: targetType, 
          target_id: targetId, 
          modules,
          time_limit_minutes: totalTime,
          description: JSON.stringify({ per_question_timer: timerPerQuestion })
        },
        questions: generated.questions
      } });
      if (res.success) {
        toast.success(res.message || "Test Approved & Published successfully!");
        setGenerated(null);
        setTargetId("");
        setTaskContext("");
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
          
          <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-sm font-bold text-slate-800 mb-2">Timer Configuration</label>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                min={10} 
                max={300}
                value={timerPerQuestion} 
                onChange={(e) => setTimerPerQuestion(Number(e.target.value))}
                className="w-24 p-2 border rounded-lg text-sm" 
              />
              <span className="text-sm text-slate-600">Seconds per question</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Calculates total exam time based on generated question count.</p>
          </div>

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
              {isGenerating ? <><Loader2 className="mr-2 animate-spin h-5 w-5" /> Generating via Gemini AI...</> : <><BrainCircuit className="mr-2 h-5 w-5" /> Generate CBT Questions</>}
            </Button>
          </div>
        </div>
      </div>

      {generated && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-200 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-slate-900">Generated Exam Preview</h2>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 font-bold px-6 shadow-md shadow-emerald-500/20">
              <CheckCircle2 className="mr-2 h-5 w-5" /> Approve & Publish Test
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {generated.questions.map((q: any, i: number) => (
              <div key={i} className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-slate-800">Q{i+1}: {q.question_type.toUpperCase()}</div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${q.difficulty === "hard" ? "bg-rose-100 text-rose-700" : q.difficulty === "medium" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {q.difficulty}
                  </div>
                </div>
                <div className="text-slate-700 mb-3 text-sm">{q.question_text}</div>
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

  const { data: tests = [], isLoading: isLoadingTests } = useQuery({
    queryKey: ["admin-cbt-tests"],
    queryFn: () => fetchTests(),
  });
  
  const { data: targets } = useQuery({
    queryKey: ["cbt-targets"],
    queryFn: () => fetchTargets(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => doDelete({ data: { id } }),
    onSuccess: () => { toast.success("Test deleted"); qc.invalidateQueries({ queryKey: ["admin-cbt-tests"] }); },
    onError: () => toast.error("Failed to delete test")
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => doToggle({ data: { id, status } }),
    onSuccess: () => { toast.success("Status updated"); qc.invalidateQueries({ queryKey: ["admin-cbt-tests"] }); },
    onError: () => toast.error("Failed to update status")
  });

  const getTargetName = (type: string, id: string) => {
    if (!targets) return id;
    if (type === "intern") {
      const intern = targets.interns.find(i => i.id === id);
      return intern ? intern.full_name : id;
    } else {
      const team = targets.teams.find(t => t.id === id);
      return team ? team.name : id;
    }
  };

  return (
    <div className="space-y-6">
      <ActiveStreamsSection />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Activity className="h-6 w-6" /></div>
          <div><p className="text-sm font-bold text-slate-500">Active Exams</p><p className="text-2xl font-black text-slate-900">{tests.filter((t: any) => t.status === 'active').length}</p></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle className="h-6 w-6" /></div>
          <div><p className="text-sm font-bold text-slate-500">Completed</p><p className="text-2xl font-black text-slate-900">{tests.filter((t: any) => t.status === 'completed').length}</p></div>
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
              <th className="px-6 py-4">Target (Intern/Team)</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoadingTests ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading tests...</td></tr>
            ) : tests.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No tests found.</td></tr>
            ) : (
              tests.map((t: any) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-slate-800">{t.title}</td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-600">{getTargetName(t.target_type, t.target_id)}</span>
                    <span className="ml-2 text-[10px] uppercase font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{t.target_type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex w-fit items-center gap-1 ${t.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {t.status === 'active' ? <CheckCircle className="h-3 w-3"/> : <XCircle className="h-3 w-3"/>}
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => toggleMut.mutate({ id: t.id, status: t.status === 'active' ? 'inactive' : 'active' })}>
                      <RefreshCw className="h-4 w-4 mr-1" /> {t.status === 'active' ? 'Deactivate' : 'Activate'}
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
    </div>
  );
}
