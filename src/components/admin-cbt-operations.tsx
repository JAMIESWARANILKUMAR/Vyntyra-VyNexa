import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { 
  generateAiTestFn, 
  saveGeneratedTestFn, 
  listCbtTargetsFn, 
  listAdminTestsFn, 
  deleteAdminTestFn, 
  toggleAdminTestStatusFn, 
  listAdminTestSubmissionsFn, 
  reassignAdminTestFn,
  extendAdminTestDeadlineFn,
  getAdminSubmissionDetailFn,
  overrideSubmissionScoreFn,
  grantInternRetakeFn,
  clearSubmissionStrikesFn
} from "@/lib/cbt.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  BrainCircuit, Upload, Loader2, Save, Users, FileText, CheckCircle2, Trash2, 
  CheckCircle, XCircle, RefreshCw, AlertTriangle, Search, Activity, Clock, 
  UserPlus, Camera, CameraOff, Calendar, Plus, Edit3, Eye, ShieldAlert, 
  ShieldCheck, Award, Check, Sparkles, AlertCircle, RotateCcw, Sliders, Shield, 
  Shuffle, CheckSquare, ChevronDown, ChevronUp
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ActiveStreamsSection } from "./cbt-streams";

const ALL_MODULES = [
  { id: "mcq", label: "Multiple Choice (MCQ)" },
  { id: "true_false", label: "True / False" },
  { id: "short_answer", label: "Short Answer / Explanation" },
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
            AI & Manual CBT Engine Control Hub
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Complete assessment governance: camera strictness levels, manual/AI authoring, deadline extenders, retake manager, and full mark sheets.
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
            Create / Generate Test
          </button>
        </div>
      </div>

      {activeSubTab === "monitor" ? <AdminCbtSubmissionsView /> : <AdminCbtGenerateView />}
    </div>
  );
}

function AdminCbtGenerateView() {
  const [creationMode, setCreationMode] = useState<"ai" | "manual">("ai");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passingScore, setPassingScore] = useState(50);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [enableCamera, setEnableCamera] = useState(true);
  const [cameraStrictness, setCameraStrictness] = useState<"lenient" | "standard" | "strict">("standard");
  const [deadline, setDeadline] = useState("");
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [showInstantResults, setShowInstantResults] = useState(true);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const [targetType, setTargetType] = useState<"intern" | "team">("intern");
  const [targetId, setTargetId] = useState("");
  const [taskContext, setTaskContext] = useState("");
  const [modules, setModules] = useState<string[]>(["mcq"]);
  const [generated, setGenerated] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Manual questions builder state
  const [manualQuestions, setManualQuestions] = useState<any[]>([
    {
      id: "q1",
      question_type: "mcq",
      question_text: "Which of the following best describes the primary goal of this assessment task?",
      options: [
        { id: "A", text: "To verify technical architecture and implementation standards" },
        { id: "B", text: "To benchmark response latency only" },
        { id: "C", text: "To skip unit testing protocols" },
        { id: "D", text: "None of the above" },
      ],
      correct_answer: "A",
      time_limit_seconds: 60,
      max_points: 10,
    }
  ]);
  
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
    if (!targetId || targetId === "none") return toast.error("Please select a target Intern or Team.");
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
        const questionsWithTimers = (res.questions || []).map((q: any) => ({
          ...q,
          time_limit_seconds: q.time_limit_seconds || 60,
          max_points: q.max_points || 10,
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

  // Add question to manual builder
  const handleAddManualQuestion = () => {
    const newId = `q_${Date.now()}`;
    setManualQuestions([
      ...manualQuestions,
      {
        id: newId,
        question_type: "mcq",
        question_text: "New Technical Assessment Question",
        options: [
          { id: "A", text: "Option A" },
          { id: "B", text: "Option B" },
          { id: "C", text: "Option C" },
          { id: "D", text: "Option D" },
        ],
        correct_answer: "A",
        time_limit_seconds: 60,
        max_points: 10,
      }
    ]);
  };

  const handleRemoveManualQuestion = (idx: number) => {
    if (manualQuestions.length === 1) {
      return toast.error("Test must contain at least one question.");
    }
    setManualQuestions(manualQuestions.filter((_, i) => i !== idx));
  };

  const handleSaveExam = async (questionsList: any[]) => {
    if (!title.trim()) return toast.error("Please provide an Exam Title.");
    if (!targetId || targetId === "none") return toast.error("Please select a target Intern or Team.");
    if (!questionsList || questionsList.length === 0) return toast.error("At least one question is required.");

    // Resolve target IDs (supporting "all" interns)
    let finalTargetId: any = targetId;
    if (targetType === "intern" && targetId === "all") {
      finalTargetId = targets.interns.map(i => i.id);
    }

    setIsSaving(true);
    try {
      const res = await saveFn({ data: {
        testMetadata: { 
          title, 
          description,
          target_type: targetType, 
          target_id: finalTargetId, 
          passing_score: Number(passingScore) || 50,
          time_limit_minutes: Number(timeLimitMinutes) || 30,
          enable_camera: enableCamera,
          camera_strictness: cameraStrictness,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          shuffle_questions: shuffleQuestions,
          show_instant_results: showInstantResults,
          max_attempts: maxAttempts,
          category: "Technical Assessment",
          modules
        },
        questions: questionsList
      } });
      
      if (res.success) {
        toast.success(res.message || "Test successfully created and assigned!");
        setGenerated(null);
        setTitle("");
        setDescription("");
        setTaskContext("");
        setDeadline("");
        setTargetId("");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to save test.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Switcher */}
      <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-xl w-fit">
        <button
          onClick={() => setCreationMode("ai")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            creationMode === "ai" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sparkles className="h-4 w-4 text-indigo-600" />
          AI Generation (Gemini 1.5)
        </button>
        <button
          onClick={() => setCreationMode("manual")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            creationMode === "manual" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Edit3 className="h-4 w-4 text-emerald-600" />
          Manual Question Builder
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Metadata & Assignment Controls */}
        <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500"/> Exam Configuration & Rules
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Exam Title *</label>
                <input 
                  type="text" 
                  className="w-full p-2.5 border rounded-lg mt-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder="e.g., Task 3 Evaluation - Frontend Performance & Architecture"
                  value={title} onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description</label>
                <textarea 
                  className="w-full p-2.5 border rounded-lg mt-1 text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none" 
                  rows={2}
                  placeholder="Instructions or guidelines shown to the candidate..."
                  value={description} onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Passing Score (%)</label>
                  <input 
                    type="number" 
                    min={1} max={100}
                    className="w-full p-2.5 border rounded-lg mt-1 text-sm" 
                    value={passingScore} onChange={e => setPassingScore(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Time Limit (Minutes)</label>
                  <input 
                    type="number" 
                    min={5} max={180}
                    className="w-full p-2.5 border rounded-lg mt-1 text-sm" 
                    value={timeLimitMinutes} onChange={e => setTimeLimitMinutes(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Camera Proctoring Toggle */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Camera Proctoring Policy
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEnableCamera(true)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                      enableCamera 
                        ? "bg-indigo-50 border-indigo-400 text-indigo-900 shadow-xs" 
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Camera className="h-4 w-4 text-indigo-600 shrink-0" />
                    <div>
                      <div>Camera Enforced</div>
                      <div className="text-[10px] font-normal text-slate-500">Live feed & face-tracking active</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEnableCamera(false)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                      !enableCamera 
                        ? "bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs" 
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <CameraOff className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div>
                      <div>Focus Only (No Cam)</div>
                      <div className="text-[10px] font-normal text-slate-500">Only tab & window tracking</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Camera Strictness Selector (Visible when Camera is Enforced) */}
              {enableCamera && (
                <div className="p-3.5 bg-indigo-50/40 border border-indigo-200/80 rounded-xl space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="h-4 w-4 text-indigo-600" />
                      Proctoring Strictness Level
                    </label>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                      {cameraStrictness === "strict" ? "Zero Tolerance" : cameraStrictness === "lenient" ? "Flexible Mode" : "Balanced"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setCameraStrictness("lenient")}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        cameraStrictness === "lenient"
                          ? "bg-white border-emerald-500 shadow-sm ring-2 ring-emerald-500/20"
                          : "bg-slate-50/70 border-slate-200 hover:bg-white text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-slate-800">Lenient</span>
                      </div>
                      <div className="text-[11px] font-black text-emerald-700">3 Strikes Allowed</div>
                      <div className="text-[9px] text-slate-500 mt-0.5 leading-tight">6s gaze tolerance, generous head tilt</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCameraStrictness("standard")}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        cameraStrictness === "standard"
                          ? "bg-white border-amber-500 shadow-sm ring-2 ring-amber-500/20"
                          : "bg-slate-50/70 border-slate-200 hover:bg-white text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-xs font-bold text-slate-800">Standard</span>
                      </div>
                      <div className="text-[11px] font-black text-amber-700">2 Strikes Allowed</div>
                      <div className="text-[9px] text-slate-500 mt-0.5 leading-tight">3s gaze tolerance, corporate benchmark</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCameraStrictness("strict")}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        cameraStrictness === "strict"
                          ? "bg-white border-rose-500 shadow-sm ring-2 ring-rose-500/20"
                          : "bg-slate-50/70 border-slate-200 hover:bg-white text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <div className="h-2 w-2 rounded-full bg-rose-500" />
                        <span className="text-xs font-bold text-slate-800">Ultra-Strict</span>
                      </div>
                      <div className="text-[11px] font-black text-rose-700">1 Strike Max</div>
                      <div className="text-[9px] text-slate-500 mt-0.5 leading-tight">1.5s tolerance, auto-termination</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Assessment Deadline */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between mb-1">
                  <span>Assessment Deadline / Due Date</span>
                  <span className="text-[10px] font-normal text-slate-400">(Optional)</span>
                </label>
                <div className="relative">
                  <input 
                    type="datetime-local" 
                    className="w-full p-2.5 border rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                  />
                </div>
              </div>

              {/* Advanced Controls Toggle */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700"
                >
                  <span className="flex items-center gap-1.5">
                    <Sliders className="h-4 w-4 text-indigo-600" />
                    Advanced Assessment Delivery Settings
                  </span>
                  {showAdvancedSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {showAdvancedSettings && (
                  <div className="p-3.5 space-y-3 bg-white text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                        <input 
                          type="checkbox" 
                          checked={shuffleQuestions} 
                          onChange={e => setShuffleQuestions(e.target.checked)}
                          className="h-4 w-4 text-indigo-600 rounded" 
                        />
                        <span>Shuffle Question Order</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                        <input 
                          type="checkbox" 
                          checked={showInstantResults} 
                          onChange={e => setShowInstantResults(e.target.checked)}
                          className="h-4 w-4 text-indigo-600 rounded" 
                        />
                        <span>Show Score Immediately</span>
                      </label>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Max Retakes / Attempts</label>
                      <select 
                        value={maxAttempts} 
                        onChange={e => setMaxAttempts(Number(e.target.value))}
                        className="w-full text-xs p-2 border rounded-lg bg-white"
                      >
                        <option value={1}>1 Attempt Only (Single Shot)</option>
                        <option value={2}>2 Attempts Allowed</option>
                        <option value={3}>3 Attempts Allowed</option>
                        <option value={999}>Unlimited Attempts</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <hr className="border-slate-100" />
          
          {/* Target Allocation */}
          <div>
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500"/> Candidate Allocation & Automated Email
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Allocated candidate(s) will automatically receive a branded email notification with parameters and test link.
            </p>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                <input type="radio" name="target" checked={targetType === "intern"} onChange={() => { setTargetType("intern"); setTargetId(""); }} /> Individual Intern
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                <input type="radio" name="target" checked={targetType === "team"} onChange={() => { setTargetType("team"); setTargetId(""); }} /> Entire Team
              </label>
            </div>
            
            {targetType === "intern" ? (
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger className="w-full bg-white border-slate-300">
                  <SelectValue placeholder="Select an Intern to assign..." />
                </SelectTrigger>
                <SelectContent>
                  {targets.interns.length > 0 && (
                    <SelectItem value="all" className="font-bold text-indigo-600">
                      ★ Assign to All Active Interns ({targets.interns.length} candidates)
                    </SelectItem>
                  )}
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
                  <SelectValue placeholder="Select a Team to assign..." />
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
        </div>

        {/* Right Column: AI Context OR Manual Question Controls */}
        {creationMode === "ai" ? (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-indigo-500"/> AI Context & Reference Data
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Paste documentation, instructions, or upload a PDF. Gemini will generate high-yield evaluation questions.
              </p>
              <textarea 
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm" 
                rows={5} 
                placeholder="Paste the task documentation or specific scenario details here..."
                value={taskContext}
                onChange={e => setTaskContext(e.target.value)}
              />
              <label className="mt-3 p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-center cursor-pointer hover:bg-slate-100 transition-colors block">
                <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} />
                <Upload className="h-5 w-5 text-slate-400 mx-auto mb-1.5" />
                <div className="text-xs font-bold text-slate-700">Upload PDF / Word Report</div>
                <div className="text-[10px] text-slate-500">Auto-extracted into context box</div>
              </label>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Module Types to Include</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALL_MODULES.map(m => {
                  const checked = modules.includes(m.id);
                  return (
                    <label key={m.id} className={`flex items-start gap-2.5 p-2.5 border rounded-xl cursor-pointer text-xs transition-colors ${checked ? "bg-indigo-50 border-indigo-300 font-bold text-indigo-900" : "hover:bg-slate-50 text-slate-700"}`}>
                      <input type="checkbox" className="mt-0.5 h-3.5 w-3.5 text-indigo-600" checked={checked} onChange={() => toggleModule(m.id)} />
                      <span>{m.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mt-auto pt-4">
              <Button onClick={handleGenerate} disabled={isGenerating} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl shadow-md text-sm">
                {isGenerating ? <><Loader2 className="mr-2 animate-spin h-4 w-4" /> Generating via Gemini AI...</> : <><Sparkles className="mr-2 h-4 w-4" /> Step 1: Generate AI Questions</>}
              </Button>
            </div>
          </div>
        ) : (
          /* Manual Questions Builder Column */
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-emerald-600"/> Manual Question Builder
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Author questions, options, correct answers, points, and timers manually.</p>
              </div>
              <Button size="sm" onClick={handleAddManualQuestion} className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Question
              </Button>
            </div>

            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
              {manualQuestions.map((q, idx) => (
                <div key={q.id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">Question #{idx + 1}</span>
                    <div className="flex items-center gap-2">
                      <select 
                        value={q.question_type} 
                        onChange={(e) => {
                          const updated = [...manualQuestions];
                          updated[idx].question_type = e.target.value;
                          setManualQuestions(updated);
                        }}
                        className="text-xs border rounded p-1 bg-white"
                      >
                        <option value="mcq">MCQ (Multiple Choice)</option>
                        <option value="true_false">True / False</option>
                        <option value="coding">Coding / SQL</option>
                        <option value="long_answer">Subjective / Long Answer</option>
                        <option value="aptitude">Aptitude</option>
                      </select>

                      <div className="flex items-center gap-1 text-xs">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <input 
                          type="number" 
                          min={10} max={300}
                          value={q.time_limit_seconds || 60}
                          onChange={(e) => {
                            const updated = [...manualQuestions];
                            updated[idx].time_limit_seconds = Number(e.target.value);
                            setManualQuestions(updated);
                          }}
                          className="w-12 p-0.5 border rounded text-center text-xs"
                        />
                        <span className="text-[10px] text-slate-500">s</span>
                      </div>

                      <div className="flex items-center gap-1 text-xs">
                        <Award className="h-3.5 w-3.5 text-slate-400" />
                        <input 
                          type="number" 
                          min={1} max={50}
                          value={q.max_points || 10}
                          onChange={(e) => {
                            const updated = [...manualQuestions];
                            updated[idx].max_points = Number(e.target.value);
                            setManualQuestions(updated);
                          }}
                          className="w-12 p-0.5 border rounded text-center text-xs"
                        />
                        <span className="text-[10px] text-slate-500">pts</span>
                      </div>

                      <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500 hover:text-rose-700" onClick={() => handleRemoveManualQuestion(idx)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <textarea 
                    className="w-full p-2.5 border rounded-lg text-xs resize-none focus:ring-1 focus:ring-emerald-500 outline-none" 
                    rows={2}
                    placeholder="Enter question text..."
                    value={q.question_text}
                    onChange={(e) => {
                      const updated = [...manualQuestions];
                      updated[idx].question_text = e.target.value;
                      setManualQuestions(updated);
                    }}
                  />

                  {/* Options editor for MCQ / True False */}
                  {q.question_type === "mcq" && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Options (Mark radio for Correct Answer):</div>
                      {(q.options || []).map((opt: any, optIdx: number) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input 
                            type="radio" 
                            name={`correct_${idx}`}
                            checked={q.correct_answer === opt.id}
                            onChange={() => {
                              const updated = [...manualQuestions];
                              updated[idx].correct_answer = opt.id;
                              setManualQuestions(updated);
                            }}
                            className="text-emerald-600"
                          />
                          <span className="text-xs font-bold w-4 text-slate-600">{opt.id}:</span>
                          <input 
                            type="text" 
                            value={opt.text} 
                            onChange={(e) => {
                              const updated = [...manualQuestions];
                              updated[idx].options[optIdx].text = e.target.value;
                              setManualQuestions(updated);
                            }}
                            className="flex-1 p-1 text-xs border rounded"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {q.question_type === "true_false" && (
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Correct Answer:</span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="radio" 
                          name={`tf_${idx}`}
                          checked={q.correct_answer === "True" || q.correct_answer === "true"} 
                          onChange={() => {
                            const updated = [...manualQuestions];
                            updated[idx].correct_answer = "True";
                            setManualQuestions(updated);
                          }}
                        /> True
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="radio" 
                          name={`tf_${idx}`}
                          checked={q.correct_answer === "False" || q.correct_answer === "false"} 
                          onChange={() => {
                            const updated = [...manualQuestions];
                            updated[idx].correct_answer = "False";
                            setManualQuestions(updated);
                          }}
                        /> False
                      </label>
                    </div>
                  )}

                  {q.question_type !== "mcq" && q.question_type !== "true_false" && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Expected Reference Answer / Solution
                      </label>
                      <textarea 
                        className="w-full p-2 border rounded-lg text-xs resize-none" 
                        rows={2}
                        placeholder="Expected code snippet or model response for grading..."
                        value={typeof q.correct_answer === "string" ? q.correct_answer : JSON.stringify(q.correct_answer)}
                        onChange={(e) => {
                          const updated = [...manualQuestions];
                          updated[idx].correct_answer = e.target.value;
                          setManualQuestions(updated);
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-auto pt-2">
              <Button 
                onClick={() => handleSaveExam(manualQuestions)} 
                disabled={isSaving}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md text-sm"
              >
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing Exam & Notifying...</> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Save, Allocate & Dispatch Exam Email</>}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* AI Generated Review Panel */}
      {creationMode === "ai" && generated && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-200 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Generated Exam Questions ({generated.questions?.length})</h2>
              <p className="text-xs text-slate-500 mt-1">Review questions, fine-tune timers, or click below to publish.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => {
                  setGenerated({
                    ...generated,
                    questions: [
                      ...generated.questions,
                      {
                        question_type: "mcq",
                        question_text: "New Custom Technical Question",
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
              <Button 
                onClick={() => handleSaveExam(generated.questions)} 
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 font-bold px-6 shadow-md shadow-emerald-500/20"
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                Approve, Allocate & Email Candidate
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {generated.questions.map((q: any, i: number) => (
              <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-xs text-slate-800">Q{i+1}: {q.question_type.toUpperCase()}</span>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <input 
                        type="number" 
                        min={10} max={600}
                        className="w-14 p-0.5 text-xs border rounded-md text-center" 
                        value={q.time_limit_seconds || 60}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const newQ = [...generated.questions];
                          newQ[i].time_limit_seconds = val;
                          setGenerated({ ...generated, questions: newQ });
                        }}
                      />
                      <span className="text-[10px] text-slate-500">secs</span>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                    {q.max_points || 10} pts
                  </span>
                </div>
                <textarea 
                  className="w-full p-2 text-slate-700 text-xs border rounded-lg resize-none focus:ring-1 focus:ring-indigo-500" 
                  rows={2}
                  value={q.question_text}
                  onChange={(e) => {
                    const newQ = [...generated.questions];
                    newQ[i].question_text = e.target.value;
                    setGenerated({ ...generated, questions: newQ });
                  }}
                />
                {q.options && (
                  <ul className="space-y-1 pl-2 text-xs text-slate-600">
                    {q.options.map((o: any, idx: number) => {
                      const isCorrect = q.correct_answer === o.id || (typeof q.correct_answer === "object" && q.correct_answer?.id === o.id);
                      return (
                        <li key={idx} className={`flex items-center gap-2 p-1 rounded ${isCorrect ? "bg-emerald-50 text-emerald-800 font-bold" : ""}`}>
                          <span className="h-4 w-4 flex items-center justify-center rounded-full border border-slate-300 text-[9px] font-bold">{o.id || idx+1}</span>
                          <span>{o.text}</span>
                          {isCorrect && <Check className="h-3 w-3 text-emerald-600 ml-auto" />}
                        </li>
                      );
                    })}
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
  const doExtendDeadline = useServerFn(extendAdminTestDeadlineFn);
  
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [assigningExam, setAssigningExam] = useState<any>(null);
  const [assignTargetType, setAssignTargetType] = useState<"intern" | "team">("intern");
  const [assignTargetId, setAssignTargetId] = useState<string>("");
  const [assignStrictness, setAssignStrictness] = useState<string>("standard");
  const [isReassigning, setIsReassigning] = useState<boolean>(false);

  // Extend Deadline Dialog State
  const [extendingExam, setExtendingExam] = useState<any>(null);
  const [newDeadline, setNewDeadline] = useState<string>("");
  const [notifyInternsOnExtend, setNotifyInternsOnExtend] = useState<boolean>(true);
  const [isExtending, setIsExtending] = useState<boolean>(false);

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
          camera_strictness: assignStrictness
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

  const handleConfirmExtend = async () => {
    if (!extendingExam || !newDeadline) return toast.error("Please pick a valid new deadline.");
    setIsExtending(true);
    try {
      const res = await doExtendDeadline({
        data: {
          testId: extendingExam.id,
          deadline: new Date(newDeadline).toISOString(),
          notifyInterns: notifyInternsOnExtend
        }
      });
      toast.success(res.message || "Deadline extended successfully!");
      setExtendingExam(null);
      setNewDeadline("");
      qc.invalidateQueries({ queryKey: ["admin-cbt-tests"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to extend deadline");
    } finally {
      setIsExtending(false);
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
    const activeTest = tests.find((t: any) => t.id === selectedTestId);
    return <AdminCbtTestReviewView testId={selectedTestId} test={activeTest} onBack={() => setSelectedTestId(null)} />;
  }

  return (
    <div className="space-y-6">
      <ActiveStreamsSection />
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Activity className="h-6 w-6" /></div>
          <div><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Published</p><p className="text-2xl font-black text-slate-900">{tests.filter((t: any) => t.status === 'published').length}</p></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Camera className="h-6 w-6" /></div>
          <div><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cam Proctoring</p><p className="text-2xl font-black text-slate-900">{tests.filter((t: any) => t.enable_camera !== false).length}</p></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><Calendar className="h-6 w-6" /></div>
          <div><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">With Deadlines</p><p className="text-2xl font-black text-slate-900">{tests.filter((t: any) => t.deadline).length}</p></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center"><FileText className="h-6 w-6" /></div>
          <div><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tests</p><p className="text-2xl font-black text-slate-900">{tests.length}</p></div>
        </div>
      </div>

      {/* Main Exams Registry Table */}
      <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b text-slate-600 font-bold uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Title & Policy</th>
              <th className="px-6 py-4">Target Candidate</th>
              <th className="px-6 py-4">Proctoring Strictness</th>
              <th className="px-6 py-4">Deadline</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Governance Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoadingTests ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading exams...</td></tr>
            ) : tests.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No exams found.</td></tr>
            ) : (
              tests.map((t: any) => {
                const isExpired = t.deadline && new Date(t.deadline).getTime() < Date.now();
                const strictness = t.camera_strictness || "standard";
                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{t.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {t.time_limit_minutes || 30} mins
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t.enable_camera !== false ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                          {t.enable_camera !== false ? "Camera Enforced" : "Focus Only"}
                        </span>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                          Pass: {t.passing_score || 50}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-700 block">
                        {getTargetName(t.allocation_mode, t.allocation_mode === 'team' ? t.team_ids : t.intern_ids)}
                      </span>
                      <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                        {t.allocation_mode}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {t.enable_camera === false ? (
                        <span className="text-[11px] font-bold text-slate-400">N/A (No Camera)</span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                          strictness === 'strict' 
                            ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                            : strictness === 'lenient'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${
                            strictness === 'strict' ? 'bg-rose-600' : strictness === 'lenient' ? 'bg-emerald-600' : 'bg-amber-600'
                          }`} />
                          {strictness === 'strict' ? 'Ultra-Strict (1 Strike)' : strictness === 'lenient' ? 'Lenient (3 Strikes)' : 'Standard (2 Strikes)'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {t.deadline ? (
                        <div>
                          <span className={`text-xs font-semibold ${isExpired ? "text-red-600 font-bold" : "text-slate-700"}`}>
                            {new Date(t.deadline).toLocaleDateString()} {new Date(t.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isExpired && (
                            <span className="block text-[10px] font-bold text-red-600 uppercase tracking-wider">
                              (Expired)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No Deadline</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase flex w-fit items-center gap-1 ${t.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {t.status === 'published' ? <CheckCircle className="h-3 w-3"/> : <XCircle className="h-3 w-3"/>}
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1 border-purple-200 hover:bg-purple-50 text-purple-700 font-semibold"
                        onClick={() => {
                          setExtendingExam(t);
                          setNewDeadline(t.deadline ? new Date(t.deadline).toISOString().slice(0, 16) : "");
                        }}
                      >
                        <Calendar className="h-3.5 w-3.5" /> Extend Deadline
                      </Button>
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs gap-1"
                        onClick={() => {
                          setAssignTargetType("intern");
                          setAssignTargetId("");
                          setAssignStrictness(t.camera_strictness || "standard");
                          setAssigningExam(t);
                        }}
                      >
                        <UserPlus className="h-3.5 w-3.5" /> Assign Test
                      </Button>
                      <Button variant="secondary" size="sm" className="text-xs font-semibold" onClick={() => setSelectedTestId(t.id)}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> Mark Sheets
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs" onClick={() => toggleMut.mutate({ id: t.id, status: t.status === 'published' ? 'draft' : 'published' })}>
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="destructive" size="sm" className="text-xs" onClick={() => { if(confirm("Permanently delete this test?")) deleteMut.mutate(t.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Extend Deadline Modal */}
      {extendingExam && (
        <Dialog open={!!extendingExam} onOpenChange={(open) => !open && setExtendingExam(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Extend Assessment Deadline
              </DialogTitle>
              <DialogDescription>
                Update the final submission cutoff time for <strong>{extendingExam.title}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  New Deadline Date & Time
                </label>
                <input 
                  type="datetime-local" 
                  className="w-full p-2.5 border rounded-lg text-sm text-slate-800"
                  value={newDeadline}
                  onChange={e => setNewDeadline(e.target.value)}
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
                <input 
                  type="checkbox" 
                  checked={notifyInternsOnExtend} 
                  onChange={e => setNotifyInternsOnExtend(e.target.checked)}
                  className="h-4 w-4 text-purple-600 rounded"
                />
                Dispatch automated email notification with new deadline to assigned intern(s)
              </label>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setExtendingExam(null)}>Cancel</Button>
              <Button 
                onClick={handleConfirmExtend} 
                disabled={isExtending || !newDeadline}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
              >
                {isExtending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Extending...</> : "Confirm & Extend"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Assign Test Modal */}
      {assigningExam && (
        <Dialog open={!!assigningExam} onOpenChange={(open) => !open && setAssigningExam(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-600" />
                Assign CBT Exam & Dispatch Email
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

              {/* Strictness Level during allocation */}
              {assigningExam.enable_camera !== false && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Camera Proctoring Strictness
                  </label>
                  <select 
                    value={assignStrictness} 
                    onChange={e => setAssignStrictness(e.target.value)}
                    className="w-full text-xs p-2 border rounded-lg bg-white"
                  >
                    <option value="lenient">Lenient (3 Warnings Allowed, 6s grace)</option>
                    <option value="standard">Standard (2 Warnings Allowed, 3s grace)</option>
                    <option value="strict">Ultra-Strict (1 Warning Max, 1.5s grace)</option>
                  </select>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setAssigningExam(null)}>Cancel</Button>
              <Button 
                onClick={handleConfirmAssign} 
                disabled={isReassigning || !assignTargetId}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                {isReassigning ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Allocating...</> : "Confirm & Send Email"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function AdminCbtTestReviewView({ testId, test, onBack }: { testId: string, test?: any, onBack: () => void }) {
  const qc = useQueryClient();
  const fetchSubmissions = useServerFn(listAdminTestSubmissionsFn);
  const fetchDetail = useServerFn(getAdminSubmissionDetailFn);
  const doOverride = useServerFn(overrideSubmissionScoreFn);
  const doExtend = useServerFn(extendAdminTestDeadlineFn);
  const doRetake = useServerFn(grantInternRetakeFn);
  const doClearStrikes = useServerFn(clearSubmissionStrikesFn);

  const [activeSubmissionDetail, setActiveSubmissionDetail] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Score override state inside modal
  const [overrideScore, setOverrideScore] = useState<number>(0);
  const [overrideRemarks, setOverrideRemarks] = useState<string>("");
  const [isOverriding, setIsOverriding] = useState<boolean>(false);

  // Extend deadline modal inside test review
  const [showExtendModal, setShowExtendModal] = useState<boolean>(false);
  const [newDeadline, setNewDeadline] = useState<string>("");
  const [isExtending, setIsExtending] = useState<boolean>(false);

  // Retake modal state
  const [retakeSubmission, setRetakeSubmission] = useState<any>(null);
  const [retakeReason, setRetakeReason] = useState<string>("");
  const [isResettingAttempt, setIsResettingAttempt] = useState<boolean>(false);
  
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["admin-cbt-submissions", testId],
    queryFn: () => fetchSubmissions({ data: { testId } }),
  });

  const handleOpenDetail = async (submissionId: string) => {
    setIsLoadingDetail(true);
    try {
      const data = await fetchDetail({ data: { submissionId } });
      setActiveSubmissionDetail(data);
      setOverrideScore(data.submission?.total_score || 0);
      setOverrideRemarks("");
    } catch (e: any) {
      toast.error(e.message || "Failed to load submission audit sheet.");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleSaveOverride = async () => {
    if (!activeSubmissionDetail) return;
    setIsOverriding(true);
    try {
      const res = await doOverride({
        data: {
          submissionId: activeSubmissionDetail.submission.id,
          newScore: Number(overrideScore),
          reviewRemarks: overrideRemarks
        }
      });
      toast.success(res.message || "Score overridden successfully!");
      qc.invalidateQueries({ queryKey: ["admin-cbt-submissions", testId] });
      setActiveSubmissionDetail({
        ...activeSubmissionDetail,
        submission: {
          ...activeSubmissionDetail.submission,
          total_score: overrideScore,
        }
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to override score.");
    } finally {
      setIsOverriding(false);
    }
  };

  const handleConfirmRetake = async () => {
    if (!retakeSubmission) return;
    setIsResettingAttempt(true);
    try {
      const res = await doRetake({
        data: {
          submissionId: retakeSubmission.id,
          reason: retakeReason || "Administrative reset granted."
        }
      });
      toast.success(res.message || "Attempt reset and retake granted!");
      setRetakeSubmission(null);
      setRetakeReason("");
      setActiveSubmissionDetail(null);
      qc.invalidateQueries({ queryKey: ["admin-cbt-submissions", testId] });
    } catch (e: any) {
      toast.error(e.message || "Failed to grant retake.");
    } finally {
      setIsResettingAttempt(false);
    }
  };

  const handleClearStrikes = async (submissionId: string) => {
    try {
      const res = await doClearStrikes({ data: { submissionId } });
      toast.success(res.message || "Strikes cleared!");
      qc.invalidateQueries({ queryKey: ["admin-cbt-submissions", testId] });
      if (activeSubmissionDetail && activeSubmissionDetail.submission.id === submissionId) {
        setActiveSubmissionDetail({
          ...activeSubmissionDetail,
          malpracticeLogs: [],
          submission: {
            ...activeSubmissionDetail.submission,
            malpractice_warnings: 0
          }
        });
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to clear strikes.");
    }
  };

  const handleExtendTestDeadline = async () => {
    if (!newDeadline) return toast.error("Please pick a valid deadline.");
    setIsExtending(true);
    try {
      const res = await doExtend({
        data: {
          testId,
          deadline: new Date(newDeadline).toISOString(),
          notifyInterns: true,
        }
      });
      toast.success(res.message || "Deadline successfully extended!");
      setShowExtendModal(false);
      qc.invalidateQueries({ queryKey: ["admin-cbt-tests"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to extend deadline.");
    } finally {
      setIsExtending(false);
    }
  };

  const passingScore = test?.passing_score || 50;
  const strictness = test?.camera_strictness || "standard";

  return (
    <div className="space-y-6">
      {/* Header with Test Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>&larr; Back to Exams</Button>
          <div>
            <h2 className="text-xl font-black text-slate-900">{test?.title || "Exam Submissions Hub"}</h2>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
              <span>Duration: <strong>{test?.time_limit_minutes || 30} mins</strong></span>
              <span>•</span>
              <span>Pass Benchmark: <strong>{passingScore}%</strong></span>
              <span>•</span>
              <span>Proctoring: <strong>{test?.enable_camera !== false ? `Camera Enforced (${strictness.toUpperCase()})` : "Focus Only"}</strong></span>
              {test?.deadline && (
                <>
                  <span>•</span>
                  <span>Deadline: <strong className="text-purple-700">{new Date(test.deadline).toLocaleString()}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm"
          className="border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold gap-1.5"
          onClick={() => {
            setNewDeadline(test?.deadline ? new Date(test.deadline).toISOString().slice(0, 16) : "");
            setShowExtendModal(true);
          }}
        >
          <Calendar className="h-4 w-4" /> Extend Exam Deadline
        </Button>
      </div>

      {/* Submissions Table */}
      <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b text-slate-600 font-bold uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Candidate Name</th>
              <th className="px-6 py-4">Submitted At</th>
              <th className="px-6 py-4">Total Score</th>
              <th className="px-6 py-4">Result</th>
              <th className="px-6 py-4 text-right">Candidate Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading submissions...</td></tr>
            ) : submissions.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No candidate submissions recorded yet for this assessment.</td></tr>
            ) : (
              submissions.map((sub: any) => {
                const isPassed = (sub.total_score || 0) >= passingScore;
                return (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{sub.profiles?.full_name || "Intern"}</div>
                      <div className="text-xs text-slate-500 font-mono">{sub.profiles?.email || sub.intern_id}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(sub.submitted_at || sub.started_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-black text-lg text-indigo-700">{sub.total_score || 0} pts</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex w-fit items-center gap-1 ${
                        isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isPassed ? <CheckCircle className="h-3.5 w-3.5"/> : <XCircle className="h-3.5 w-3.5"/>}
                        {isPassed ? "Passed" : "Needs Retest"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-xs font-semibold gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        onClick={() => {
                          setRetakeSubmission(sub);
                          setRetakeReason("");
                        }}
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Grant Retake
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1"
                        onClick={() => handleOpenDetail(sub.id)}
                      >
                        <Eye className="h-3.5 w-3.5" /> Mark Sheet
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Grant Retake Confirmation Modal */}
      {retakeSubmission && (
        <Dialog open={!!retakeSubmission} onOpenChange={(open) => !open && setRetakeSubmission(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-emerald-600" />
                Grant Retake / Reset Candidate Session
              </DialogTitle>
              <DialogDescription>
                This will reset the previous submission for <strong>{retakeSubmission.profiles?.full_name || "the candidate"}</strong>, clear any strikes, and dispatch an automated email granting a fresh attempt.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Reason / Administrative Note (Included in Email)
              </label>
              <textarea 
                className="w-full p-2.5 border rounded-lg text-xs resize-none" 
                rows={3}
                placeholder="e.g. Technical network disconnection verified; granting full retake opportunity."
                value={retakeReason}
                onChange={e => setRetakeReason(e.target.value)}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setRetakeSubmission(null)}>Cancel</Button>
              <Button 
                onClick={handleConfirmRetake} 
                disabled={isResettingAttempt}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {isResettingAttempt ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...</> : "Confirm Retake & Send Email"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Comprehensive Mark Sheet & Proctoring Report Modal */}
      {activeSubmissionDetail && (
        <Dialog open={!!activeSubmissionDetail} onOpenChange={(open) => !open && setActiveSubmissionDetail(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Award className="h-6 w-6 text-indigo-600" />
                  Candidate Mark Sheet & Proctoring Audit
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  (activeSubmissionDetail.submission?.total_score || 0) >= passingScore
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800"
                }`}>
                  {(activeSubmissionDetail.submission?.total_score || 0) >= passingScore ? "Passed" : "Failed"}
                </span>
              </DialogTitle>
              <DialogDescription>
                Detailed question-by-question response breakdown, AI scoring verification, and proctoring violation telemetry.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Candidate & Assessment Summary Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase block">Candidate</span>
                  <span className="font-bold text-slate-800 text-sm">{activeSubmissionDetail.submission?.profiles?.full_name || "Intern"}</span>
                  <span className="text-slate-500 block font-mono">{activeSubmissionDetail.submission?.profiles?.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block">Submitted At</span>
                  <span className="font-semibold text-slate-800">{new Date(activeSubmissionDetail.submission?.submitted_at || activeSubmissionDetail.submission?.started_at).toLocaleString()}</span>
                  <span className="text-slate-500 block">Status: {activeSubmissionDetail.submission?.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block">Total Points Awarded</span>
                  <span className="text-2xl font-black text-indigo-600">{activeSubmissionDetail.submission?.total_score || 0} pts</span>
                  <span className="text-slate-500 block font-semibold">Passing Benchmark: {passingScore}%</span>
                </div>
              </div>

              {/* Proctoring & Infractions Log */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-rose-500" />
                    Proctoring Telemetry ({activeSubmissionDetail.malpracticeLogs?.length || 0} Events)
                  </h4>
                  {activeSubmissionDetail.malpracticeLogs?.length > 0 && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-[10px] h-7 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                      onClick={() => handleClearStrikes(activeSubmissionDetail.submission?.id)}
                    >
                      Clear Strikes / Forgive Infractions
                    </Button>
                  )}
                </div>

                {activeSubmissionDetail.malpracticeLogs?.length === 0 ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Zero infractions detected. Candidate adhered strictly to fullscreen and focus requirements.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {activeSubmissionDetail.malpracticeLogs.map((log: any, lIdx: number) => (
                      <div key={lIdx} className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                          <span className="font-bold text-rose-900">{log.infraction_type}</span>
                          <span className="text-rose-700">{log.description}</span>
                        </div>
                        <span className="text-[10px] text-rose-500 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Detailed Question Mark Sheet */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  Question-by-Question Response Audit ({activeSubmissionDetail.questions?.length} Questions)
                </h4>

                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  {activeSubmissionDetail.questions.map((q: any, qIdx: number) => {
                    const ans = activeSubmissionDetail.answers.find((a: any) => a.question_id === q.id);
                    let parsedSelected = ans?.selected_option;
                    try { if (typeof parsedSelected === 'string') parsedSelected = JSON.parse(parsedSelected); } catch(e){}
                    
                    let parsedSubjective = ans?.subjective_answer;
                    try { if (typeof parsedSubjective === 'string') parsedSubjective = JSON.parse(parsedSubjective); } catch(e){}

                    const candidateResponse = parsedSelected?.text || parsedSelected || parsedSubjective || "No answer recorded";
                    const isFullScore = (ans?.ai_score || 0) >= (q.max_points || 10);

                    return (
                      <div key={q.id || qIdx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            Q{qIdx + 1}: {q.question_text}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            isFullScore ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {ans?.ai_score ?? 0} / {q.max_points || 10} pts
                          </span>
                        </div>

                        {/* Candidate response vs benchmark */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Candidate Response:</span>
                            <span className="font-semibold text-slate-800 break-words">{String(candidateResponse)}</span>
                          </div>

                          <div className="p-2.5 bg-white border border-emerald-200 rounded-lg">
                            <span className="text-[10px] uppercase font-bold text-emerald-600 block mb-0.5">Benchmark / Correct Answer:</span>
                            <span className="font-semibold text-slate-800 break-words">
                              {typeof q.correct_answer === "object" ? JSON.stringify(q.correct_answer) : String(q.correct_answer)}
                            </span>
                          </div>
                        </div>

                        {ans?.ai_feedback && (
                          <div className="p-2 bg-indigo-50/70 border border-indigo-100 rounded text-slate-700 text-[11px]">
                            <strong className="text-indigo-800 font-bold">Feedback / Remarks:</strong> {ans.ai_feedback}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Admin Score Adjustment & Override Panel */}
              <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-indigo-600" />
                  Manual Score Adjustment & Admin Override
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">New Total Score (pts)</label>
                    <input 
                      type="number" 
                      min={0} max={100}
                      value={overrideScore}
                      onChange={(e) => setOverrideScore(Number(e.target.value))}
                      className="w-full p-2 border rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Reviewer Remarks / Justification</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Manually verified subjective code structure..."
                      value={overrideRemarks}
                      onChange={(e) => setOverrideRemarks(e.target.value)}
                      className="w-full p-2 border rounded-lg text-sm bg-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline"
                    className="text-xs text-emerald-700 border-emerald-300"
                    onClick={() => {
                      setRetakeSubmission(activeSubmissionDetail.submission);
                      setRetakeReason("");
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" /> Grant Fresh Retake
                  </Button>
                  <Button 
                    onClick={handleSaveOverride} 
                    disabled={isOverriding}
                    className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs"
                  >
                    {isOverriding ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                    Save Score Override
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setActiveSubmissionDetail(null)}>Close Mark Sheet</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Extend Deadline Modal inside Test Review */}
      {showExtendModal && (
        <Dialog open={showExtendModal} onOpenChange={setShowExtendModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Extend Assessment Deadline
              </DialogTitle>
              <DialogDescription>
                Set a new completion deadline for this test. All assigned interns will be notified via email.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  New Deadline Date & Time
                </label>
                <input 
                  type="datetime-local" 
                  className="w-full p-2.5 border rounded-lg text-sm text-slate-800"
                  value={newDeadline}
                  onChange={e => setNewDeadline(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowExtendModal(false)}>Cancel</Button>
              <Button 
                onClick={handleExtendTestDeadline} 
                disabled={isExtending || !newDeadline}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
              >
                {isExtending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Extending...</> : "Confirm Extension"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
