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
  clearSubmissionStrikesFn,
  getAdminTestQuestionsFn,
  getAdminExamPaperDownloadsFn
} from "@/lib/cbt.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  BrainCircuit, Upload, Loader2, Save, Users, FileText, CheckCircle2, Trash2, 
  CheckCircle, XCircle, RefreshCw, AlertTriangle, Search, Activity, Clock, 
  UserPlus, Camera, CameraOff, Calendar, Plus, Edit3, Eye, ShieldAlert, 
  ShieldCheck, Award, Check, Sparkles, AlertCircle, RotateCcw, Sliders, Shield, 
  Shuffle, CheckSquare, ChevronDown, ChevronUp, Download, X
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

  const [targetType, setTargetType] = useState<"intern" | "team" | "manual">("intern");
  const [selectedInternIds, setSelectedInternIds] = useState<string[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [targetSearchQuery, setTargetSearchQuery] = useState("");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [defaultQuestionTime, setDefaultQuestionTime] = useState<number>(60);
  const [savedExamDownloads, setSavedExamDownloads] = useState<{ pdfUrl: string; csvUrl: string; title: string } | null>(null);

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

  // Pre-allocation Question Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewQuestionsList, setPreviewQuestionsList] = useState<any[]>([]);
  const [previewExamMeta, setPreviewExamMeta] = useState<any>(null);

  const handleOpenPreview = (questionsToPreview: any[]) => {
    if (!title.trim()) return toast.error("Please provide an Exam Title first.");
    const totalCount = targetType === "intern" 
      ? selectedInternIds.length 
      : targetType === "team" 
      ? selectedTeamIds.length 
      : selectedInternIds.length + selectedTeamIds.length;
    if (totalCount === 0) {
      return toast.error("Please select at least one target candidate or team.");
    }
    if (!questionsToPreview || questionsToPreview.length === 0) {
      return toast.error("No questions available to preview. Add questions or generate first.");
    }

    let targetLabel = "";
    if (targetType === "intern") {
      if (selectedInternIds.length === 1) {
        targetLabel = targets.interns.find(i => i.id === selectedInternIds[0])?.full_name || selectedInternIds[0];
      } else {
        targetLabel = `${selectedInternIds.length} Selected Candidates`;
      }
    } else if (targetType === "team") {
      if (selectedTeamIds.length === 1) {
        targetLabel = targets.teams.find(t => t.id === selectedTeamIds[0])?.name || selectedTeamIds[0];
      } else {
        targetLabel = `${selectedTeamIds.length} Selected Teams`;
      }
    } else {
      targetLabel = `Custom Mix (${selectedInternIds.length} Candidates, ${selectedTeamIds.length} Teams)`;
    }

    setPreviewExamMeta({
      title: title || "New AI CBT Exam",
      description: description || "Technical Assessment",
      timeLimitMinutes,
      passingScore,
      enableCamera,
      cameraStrictness,
      deadline,
      targetLabel,
      shuffleQuestions,
      showInstantResults,
      maxAttempts
    });
    setPreviewQuestionsList(questionsToPreview);
    setPreviewModalOpen(true);
  };
  
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
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
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
        setTaskContext(prev => prev + (prev ? "\n\n" : "") + `--- RESOURCE DOCUMENT: ${file.name} ---\n` + text.trim());
        toast.success(`PDF parsed successfully (${pdf.numPages} pages)!`);
      } else {
        // Plain text, markdown, CSV, JSON, code files
        const text = await file.text();
        setTaskContext(prev => prev + (prev ? "\n\n" : "") + `--- RESOURCE MATERIAL: ${file.name} ---\n` + text.trim());
        toast.success(`Resource file "${file.name}" loaded into context!`);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to parse file: ${error?.message || "Unknown error"}`);
    } finally {
      setIsGenerating(false);
      e.target.value = "";
    }
  };

  const handleGenerate = async () => {
    if (!title.trim()) return toast.error("Please provide an Exam Title.");
    const totalCount = targetType === "intern" 
      ? selectedInternIds.length 
      : targetType === "team" 
      ? selectedTeamIds.length 
      : selectedInternIds.length + selectedTeamIds.length;
    if (totalCount === 0) {
      return toast.error("Please select at least one target candidate or team to allocate.");
    }
    if (!taskContext.trim()) return toast.error("Please provide Task Context or Syllabus.");
    
    setIsGenerating(true);
    try {
      const res = await generateFn({ data: { 
        taskContext, 
        documentText: taskContext,
        modules,
        questionCount,
        defaultTimeSeconds: defaultQuestionTime
      } });
      
      if (res.error) {
        toast.error(res.error);
      } else if (res.questions && res.questions.length > 0) {
        const questionsWithTimers = (res.questions || []).map((q: any) => ({
          ...q,
          time_limit_seconds: Number(q.time_limit_seconds) || defaultQuestionTime,
          max_points: Number(q.max_points) || 10,
        }));
        setGenerated({ ...res, questions: questionsWithTimers });
        toast.success(`Generated ${questionsWithTimers.length} exam questions! Review below, fine-tune timers, and click 'Preview & Allocate Test' to assign.`);
        setTimeout(() => {
          window.scrollTo({ top: 800, behavior: 'smooth' });
        }, 150);
      } else {
        toast.error("No questions were generated. Please check your syllabus context.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Generation failed. Please try again.");
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
        time_limit_seconds: defaultQuestionTime,
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
    const totalCount = targetType === "intern" 
      ? selectedInternIds.length 
      : targetType === "team" 
      ? selectedTeamIds.length 
      : selectedInternIds.length + selectedTeamIds.length;
    if (totalCount === 0) return toast.error("Please select at least one target candidate or team.");
    if (!questionsList || questionsList.length === 0) return toast.error("At least one question is required.");

    setIsSaving(true);
    try {
      const res = await saveFn({ data: {
        testMetadata: { 
          title, 
          description,
          target_type: targetType, 
          target_intern_ids: selectedInternIds,
          target_team_ids: selectedTeamIds,
          target_id: targetType === "team" ? selectedTeamIds[0] : selectedInternIds[0],
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
        setPreviewModalOpen(false);
        if (res.pdfUrl || res.csvUrl) {
          setSavedExamDownloads({
            pdfUrl: res.pdfUrl,
            csvUrl: res.csvUrl,
            title
          });
        }
        setGenerated(null);
        setTitle("");
        setDescription("");
        setTaskContext("");
        setDeadline("");
        setSelectedInternIds([]);
        setSelectedTeamIds([]);
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

              {/* Question Count & Default Per-Question Timer */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Total Questions</label>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/80 px-1.5 py-0.5 rounded">
                      {questionCount} Qs
                    </span>
                  </div>
                  <input 
                    type="number" 
                    min={1} max={250}
                    className="w-full p-2 border rounded-lg mt-1 text-sm bg-white" 
                    value={questionCount} 
                    onChange={e => setQuestionCount(Math.max(1, Math.min(250, Number(e.target.value) || 1)))}
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[5, 10, 20, 30, 40, 50, 75, 100].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setQuestionCount(cnt)}
                        className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all ${
                          questionCount === cnt 
                            ? "bg-indigo-600 text-white shadow-xs" 
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Default Q-Timer</label>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/80 px-1.5 py-0.5 rounded">
                      {defaultQuestionTime}s
                    </span>
                  </div>
                  <input 
                    type="number" 
                    min={10} max={600}
                    className="w-full p-2 border rounded-lg mt-1 text-sm bg-white" 
                    value={defaultQuestionTime} 
                    onChange={e => setDefaultQuestionTime(Math.max(10, Number(e.target.value) || 60))}
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[30, 45, 60, 90, 120, 180].map(sec => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setDefaultQuestionTime(sec)}
                        className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all ${
                          defaultQuestionTime === sec 
                            ? "bg-indigo-600 text-white shadow-xs" 
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500"/> Candidate Allocation & Automated Email
              </h3>
              <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                {targetType === "intern" 
                  ? `${selectedInternIds.length} Candidate(s) Selected` 
                  : targetType === "team" 
                  ? `${selectedTeamIds.length} Team(s) Selected` 
                  : `${selectedInternIds.length} Interns + ${selectedTeamIds.length} Teams`}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Admin can assign tests to multiple teams, multiple individual candidates, or custom manual multi-selection with no limit. Allocated candidates automatically receive branded email notifications.
            </p>

            {/* Mode Switcher */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setTargetType("intern")}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  targetType === "intern"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Users className="h-3.5 w-3.5" /> Individual Candidates
              </button>
              <button
                type="button"
                onClick={() => setTargetType("team")}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  targetType === "team"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Shield className="h-3.5 w-3.5" /> Entire Teams
              </button>
              <button
                type="button"
                onClick={() => setTargetType("manual")}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  targetType === "manual"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CheckSquare className="h-3.5 w-3.5" /> Manual Multi-Select
              </button>
            </div>

            {/* Search Filter & Bulk Action Row */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter candidates or teams by name or email..."
                  value={targetSearchQuery}
                  onChange={e => setTargetSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => {
                  if (targetType === "intern") {
                    setSelectedInternIds(targets.interns.map(i => i.id));
                  } else if (targetType === "team") {
                    setSelectedTeamIds(targets.teams.map(t => t.id));
                  } else {
                    setSelectedInternIds(targets.interns.map(i => i.id));
                    setSelectedTeamIds(targets.teams.map(t => t.id));
                  }
                }}
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8 text-slate-500"
                onClick={() => {
                  if (targetType === "intern") setSelectedInternIds([]);
                  else if (targetType === "team") setSelectedTeamIds([]);
                  else {
                    setSelectedInternIds([]);
                    setSelectedTeamIds([]);
                  }
                }}
              >
                Clear
              </Button>
            </div>

            {/* Checkbox Target List */}
            <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
              {/* Individual Interns List */}
              {(targetType === "intern" || targetType === "manual") && (
                <>
                  {targetType === "manual" && (
                    <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                      Candidates / Interns ({targets.interns.length})
                    </div>
                  )}
                  {targets.interns
                    .filter(i => {
                      if (!targetSearchQuery.trim()) return true;
                      const q = targetSearchQuery.toLowerCase();
                      return (i.full_name?.toLowerCase().includes(q) || i.email?.toLowerCase().includes(q));
                    })
                    .map(intern => {
                      const isChecked = selectedInternIds.includes(intern.id);
                      return (
                        <label
                          key={intern.id}
                          className={`flex items-center justify-between p-2.5 cursor-pointer text-xs transition-colors hover:bg-slate-50 ${
                            isChecked ? "bg-indigo-50/50" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedInternIds([...selectedInternIds, intern.id]);
                                } else {
                                  setSelectedInternIds(selectedInternIds.filter(id => id !== intern.id));
                                }
                              }}
                              className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{intern.full_name}</div>
                              <div className="text-[11px] text-slate-500">{intern.email}</div>
                            </div>
                          </div>
                          {isChecked && (
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                              Selected
                            </span>
                          )}
                        </label>
                      );
                    })}
                </>
              )}

              {/* Teams List */}
              {(targetType === "team" || targetType === "manual") && (
                <>
                  {targetType === "manual" && (
                    <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10 border-t border-slate-200">
                      Teams ({targets.teams.length})
                    </div>
                  )}
                  {targets.teams
                    .filter(t => {
                      if (!targetSearchQuery.trim()) return true;
                      return t.name?.toLowerCase().includes(targetSearchQuery.toLowerCase());
                    })
                    .map(team => {
                      const isChecked = selectedTeamIds.includes(team.id);
                      return (
                        <label
                          key={team.id}
                          className={`flex items-center justify-between p-2.5 cursor-pointer text-xs transition-colors hover:bg-slate-50 ${
                            isChecked ? "bg-indigo-50/50" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedTeamIds([...selectedTeamIds, team.id]);
                                } else {
                                  setSelectedTeamIds(selectedTeamIds.filter(id => id !== team.id));
                                }
                              }}
                              className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{team.name}</div>
                              <div className="text-[11px] text-slate-500">Team ID: {team.id}</div>
                            </div>
                          </div>
                          {isChecked && (
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                              Selected
                            </span>
                          )}
                        </label>
                      );
                    })}
                </>
              )}
            </div>

            {/* Selected Chips Strip */}
            {(selectedInternIds.length > 0 || selectedTeamIds.length > 0) && (
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Active Selected Targets ({selectedInternIds.length + selectedTeamIds.length}):
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {selectedInternIds.map(id => {
                    const intern = targets.interns.find(i => i.id === id);
                    return (
                      <span key={id} className="inline-flex items-center gap-1 text-[11px] font-medium bg-white text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-full shadow-2xs">
                        <span>👤 {intern?.full_name || id}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedInternIds(selectedInternIds.filter(i => i !== id))}
                          className="hover:text-red-600 text-slate-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                  {selectedTeamIds.map(id => {
                    const team = targets.teams.find(t => t.id === id);
                    return (
                      <span key={id} className="inline-flex items-center gap-1 text-[11px] font-medium bg-white text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full shadow-2xs">
                        <span>👥 Team: {team?.name || id}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedTeamIds(selectedTeamIds.filter(t => t !== id))}
                          className="hover:text-red-600 text-slate-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
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
                Paste syllabus, lecture notes, textbook chapters, or upload resources (.pdf, .txt, .md, .csv, .json, .doc). AI strictly generates questions customized to your specific content.
              </p>
              <textarea 
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm" 
                rows={5} 
                placeholder="Paste the syllabus, task documentation, course modules, or specific scenario details here..."
                value={taskContext}
                onChange={e => setTaskContext(e.target.value)}
              />
              <label className="mt-3 p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-center cursor-pointer hover:bg-slate-100 transition-colors block">
                <input type="file" accept=".pdf,.txt,.md,.doc,.docx,.csv,.json,.sql" className="hidden" onChange={handleFileUpload} />
                <Upload className="h-5 w-5 text-slate-400 mx-auto mb-1.5" />
                <div className="text-xs font-bold text-slate-700">Upload PDF / Syllabus / Resource File</div>
                <div className="text-[10px] text-slate-500">Supports PDF, TXT, MD, CSV, Word, Code — Auto-appended to context</div>
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

            <div className="mt-auto pt-2 flex flex-col sm:flex-row items-center gap-3">
              <Button 
                type="button"
                variant="outline"
                onClick={() => handleOpenPreview(manualQuestions)}
                className="w-full sm:w-1/2 h-12 border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl text-xs gap-1.5 shadow-xs"
              >
                <Eye className="h-4 w-4 text-emerald-600" /> Preview Questions Mode
              </Button>
              <Button 
                onClick={() => handleOpenPreview(manualQuestions)} 
                disabled={isSaving}
                className="w-full sm:w-1/2 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md text-xs gap-1.5"
              >
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing & Notifying...</> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Preview & Allocate Test</>}
              </Button>
            </div>
          </div>
        )}
      </div>

{/* Question Pre-Allocation Preview Modal */}
      <ExamQuestionPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        examMeta={previewExamMeta}
        questions={previewQuestionsList}
        onConfirmAllocate={() => handleSaveExam(previewQuestionsList)}
        isAllocating={isSaving}
      />

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
                type="button"
                variant="outline"
                onClick={() => handleOpenPreview(generated.questions)}
                className="font-bold border-indigo-300 text-indigo-700 hover:bg-indigo-50 gap-1.5"
              >
                <Eye className="h-4 w-4 text-indigo-600" /> Preview Questions Mode
              </Button>
              <Button 
                onClick={() => handleOpenPreview(generated.questions)} 
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 font-bold px-6 shadow-md shadow-emerald-500/20"
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                Preview & Allocate Test
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

      {/* Exam Generation & Cloudflare Storage Download Dialog */}
      {savedExamDownloads && (
        <Dialog open={!!savedExamDownloads} onOpenChange={() => setSavedExamDownloads(null)}>
          <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-xl">
            <DialogHeader>
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <DialogTitle className="text-center text-xl font-black text-slate-900">
                Exam Paper Generated & Allocated!
              </DialogTitle>
              <DialogDescription className="text-center text-xs text-slate-500">
                The test has been assigned and candidate notification emails were dispatched. The official question paper and solutions have been converted and saved in Cloudflare R2 with full Vyntyra branding and Founder Signature.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Exam Title</div>
                <div className="text-sm font-black text-slate-900 mt-0.5">{savedExamDownloads.title}</div>
              </div>

              {savedExamDownloads.pdfUrl ? (
                <a
                  href={savedExamDownloads.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors text-amber-950 group"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Official Question Paper & Solution Guide (.PDF)</div>
                      <div className="text-[10px] text-amber-700">Vyntyra Branding • Founder Signature • Corporate Seal</div>
                    </div>
                  </div>
                  <Download className="h-4 w-4 text-amber-700 group-hover:scale-110 transition-transform shrink-0" />
                </a>
              ) : null}

              {savedExamDownloads.csvUrl ? (
                <a
                  href={savedExamDownloads.csvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 transition-colors text-emerald-950 group"
                >
                  <div className="flex items-center gap-2.5">
                    <Download className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Structured Question Dataset (.CSV)</div>
                      <div className="text-[10px] text-emerald-700">RFC-4180 • Full Options, Pre-Marked Answers & Timers</div>
                    </div>
                  </div>
                  <Download className="h-4 w-4 text-emerald-700 group-hover:scale-110 transition-transform shrink-0" />
                </a>
              ) : null}
            </div>

            <DialogFooter>
              <Button onClick={() => setSavedExamDownloads(null)} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold">
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


function ExamQuestionPreviewModal({
  isOpen,
  onClose,
  examMeta,
  questions,
  onConfirmAllocate,
  isAllocating
}: {
  isOpen: boolean;
  onClose: () => void;
  examMeta: any;
  questions: any[];
  onConfirmAllocate?: () => void;
  isAllocating?: boolean;
}) {
  if (!isOpen) return null;
  const totalPoints = (questions || []).reduce((acc, q) => acc + (Number(q.max_points) || 10), 0);
  const mcqCount = (questions || []).filter(q => q.question_type === 'mcq' || q.question_type === 'true_false').length;
  const codingCount = (questions || []).filter(q => q.question_type === 'coding').length;
  const otherCount = (questions || []).length - mcqCount - codingCount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50 border-slate-200">
        <DialogHeader className="p-6 bg-slate-900 text-white shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500 text-white tracking-widest">
                  Assessment Preview Mode
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {questions.length} Modules Configured
                </span>
              </div>
              <DialogTitle className="text-2xl font-black text-white">
                {examMeta?.title || "Exam Preview"}
              </DialogTitle>
              {examMeta?.description && (
                <p className="text-xs text-slate-300 mt-1 line-clamp-1">{examMeta.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2 text-right">
              <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Total Points</span>
                <span className="text-emerald-400 font-black text-base">{totalPoints} pts</span>
              </div>
            </div>
          </div>

          {/* Policy Strip */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-3 text-xs text-slate-300">
            {examMeta?.targetLabel && (
              <span className="bg-slate-800 px-2.5 py-1 rounded-md text-[11px] font-bold text-indigo-300">
                🎯 Target: {examMeta.targetLabel}
              </span>
            )}
            <span className="bg-slate-800 px-2.5 py-1 rounded-md text-[11px]">
              ⏱️ {examMeta?.timeLimitMinutes || 30} Mins
            </span>
            <span className="bg-slate-800 px-2.5 py-1 rounded-md text-[11px]">
              🏆 Pass: {examMeta?.passingScore || 50}%
            </span>
            <span className="bg-slate-800 px-2.5 py-1 rounded-md text-[11px]">
              {examMeta?.enableCamera !== false ? `📹 ${examMeta?.cameraStrictness || 'Standard'} Cam` : "🛡️ Focus Only"}
            </span>
            {examMeta?.deadline && (
              <span className="bg-slate-800 px-2.5 py-1 rounded-md text-[11px] text-amber-300">
                📅 Deadline: {new Date(examMeta.deadline).toLocaleString()}
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Question Cards List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Pre-Marked Question Breakdown ({questions.length})</span>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px]">{mcqCount} MCQ</span>
              {codingCount > 0 && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px]">{codingCount} Coding</span>}
              {otherCount > 0 && <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px]">{otherCount} Subjective</span>}
            </div>
          </div>

          {questions.map((q: any, idx: number) => {
            const correctOptId = typeof q.correct_answer === 'object' ? q.correct_answer?.id : String(q.correct_answer || '');
            return (
              <div key={q.id || idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="h-6 w-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {q.question_type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-slate-400" /> {q.time_limit_seconds || 60}s</span>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black">{q.max_points || 10} pts</span>
                  </div>
                </div>

                <div className="text-sm font-semibold text-slate-900 leading-relaxed whitespace-pre-wrap">
                  {q.question_text}
                </div>

                {/* MCQ Options with Pre-marked Correct Answer */}
                {q.options && Array.isArray(q.options) && q.options.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Candidate Options & Pre-Marked Solution:</div>
                    {q.options.map((opt: any, optIdx: number) => {
                      const isPreMarked = opt.id === correctOptId || opt.text === correctOptId;
                      return (
                        <div 
                          key={optIdx} 
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                            isPreMarked 
                              ? "bg-emerald-50 border-emerald-400 text-emerald-900 font-bold shadow-xs ring-1 ring-emerald-500/30" 
                              : "bg-slate-50/70 border-slate-200 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                              isPreMarked ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
                            }`}>
                              {opt.id || String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                          {isPreMarked && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-300">
                              <Check className="h-3 w-3 text-emerald-600" /> Pre-Marked Solution
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pre-Solution Explanation */}
                {q.explanation && (
                  <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs text-amber-900">
                    <strong className="block text-[10px] uppercase font-bold text-amber-700 mb-0.5">💡 Solution Explanation / Reference Context:</strong>
                    {q.explanation}
                  </div>
                )}

                {/* Coding Reference Code & Unit Test Cases */}
                {q.question_type === 'coding' && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {q.correct_answer && (
                      <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs">
                        <div className="text-[10px] font-sans font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Pre-Marked Reference Solution Code
                        </div>
                        <pre className="whitespace-pre-wrap overflow-x-auto text-[11px]">
                          {typeof q.correct_answer === 'string' ? q.correct_answer : JSON.stringify(q.correct_answer, null, 2)}
                        </pre>
                      </div>
                    )}
                    {q.test_cases && Array.isArray(q.test_cases) && q.test_cases.length > 0 && (
                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-1.5">
                        <div className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">Automated Verification Test Cases ({q.test_cases.length}):</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.test_cases.map((tc: any, tcIdx: number) => (
                            <div key={tcIdx} className="bg-white p-2 rounded-lg border border-indigo-100 text-[11px] font-mono">
                              <div className="text-slate-500">Input: <span className="text-slate-900 font-bold">{tc.input || "Default"}</span></div>
                              <div className="text-emerald-700 font-bold">Required Output: {tc.expected_output}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Subjective Model Answer */}
                {q.question_type !== 'mcq' && q.question_type !== 'true_false' && q.question_type !== 'coding' && q.correct_answer && (
                  <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-800">
                    <strong className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Model Answer / Grading Rubric:</strong>
                    {typeof q.correct_answer === 'string' ? q.correct_answer : JSON.stringify(q.correct_answer)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <DialogFooter className="p-4 bg-white border-t border-slate-200 flex sm:items-center justify-between gap-3 shrink-0">
          <Button variant="outline" onClick={onClose} className="font-bold text-xs">
            ✏️ Back to Edit
          </Button>
          {onConfirmAllocate && (
            <Button 
              onClick={onConfirmAllocate} 
              disabled={isAllocating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-emerald-500/20"
            >
              {isAllocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Confirm Allocation & Dispatch Exam Emails
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const fetchExamQuestions = useServerFn(getAdminTestQuestionsFn);
  const [existingExamPreview, setExistingExamPreview] = useState<{ exam: any, questions: any[] } | null>(null);
  const [isLoadingExistingQuestions, setIsLoadingExistingQuestions] = useState(false);

  const handlePreviewExistingExam = async (exam: any) => {
    setIsLoadingExistingQuestions(true);
    try {
      const qs = await fetchExamQuestions({ data: { testId: exam.id } });
      setExistingExamPreview({ exam, questions: qs });
    } catch (e: any) {
      toast.error("Failed to load questions: " + e.message);
    } finally {
      setIsLoadingExistingQuestions(false);
    }
  };
  
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [assigningExam, setAssigningExam] = useState<any>(null);
  const [assignTargetType, setAssignTargetType] = useState<"intern" | "team" | "manual">("intern");
  const [assignSelectedInternIds, setAssignSelectedInternIds] = useState<string[]>([]);
  const [assignSelectedTeamIds, setAssignSelectedTeamIds] = useState<string[]>([]);
  const [assignStrictness, setAssignStrictness] = useState<string>("standard");
  const [assignSearchQuery, setAssignSearchQuery] = useState<string>("");
  const [isReassigning, setIsReassigning] = useState<boolean>(false);

  const [downloadingFormat, setDownloadingFormat] = useState<{ testId: string; format: 'pdf' | 'csv' } | null>(null);
  const getPaperDownloads = useServerFn(getAdminExamPaperDownloadsFn);

  const handleDownloadPaper = async (exam: any, format: 'pdf' | 'csv') => {
    setDownloadingFormat({ testId: exam.id, format });
    const toastId = toast.loading(`Retrieving official ${format.toUpperCase()} paper from Cloudflare...`);
    try {
      const res = await getPaperDownloads({ data: { testId: exam.id } });
      const url = format === 'pdf' ? res.pdfUrl : res.csvUrl;
      if (url) {
        toast.success(`Official ${format.toUpperCase()} Paper ready! Opening download...`, { id: toastId });
        window.open(url, '_blank');
      } else {
        toast.error(`Unable to retrieve ${format.toUpperCase()} paper URL. Please try again.`, { id: toastId });
      }
    } catch (err: any) {
      toast.error(err?.message || `Failed to download ${format.toUpperCase()} paper`, { id: toastId });
    } finally {
      setDownloadingFormat(null);
    }
  };

  // Extend Deadline Dialog State
  const [extendingExam, setExtendingExam] = useState<any>(null);
  const [newDeadline, setNewDeadline] = useState<string>("");
  const [notifyInternsOnExtend, setNotifyInternsOnExtend] = useState<boolean>(true);
  const [isExtending, setIsExtending] = useState<boolean>(false);

  // Adjust Exam Settings State
  const [adjustingExam, setAdjustingExam] = useState<any>(null);
  const [adjustTime, setAdjustTime] = useState<number>(30);
  const [adjustPassScore, setAdjustPassScore] = useState<number>(50);
  const [adjustEnableCamera, setAdjustEnableCamera] = useState<boolean>(true);
  const [adjustStrictness, setAdjustStrictness] = useState<string>("standard");
  const [adjustDeadline, setAdjustDeadline] = useState<string>("");
  const [isSavingAdjustments, setIsSavingAdjustments] = useState<boolean>(false);

  // Delete Exam Confirmation Dialog State
  const [deletingExam, setDeletingExam] = useState<any>(null);

  const handleConfirmAdjust = async () => {
    if (!adjustingExam) return;
    setIsSavingAdjustments(true);
    try {
      const res = await doReassign({
        data: {
          testId: adjustingExam.id,
          target_type: adjustingExam.allocation_mode === 'team' ? 'team' : 'intern',
          target_intern_ids: adjustingExam.intern_ids || [],
          target_team_ids: adjustingExam.team_ids || [],
          time_limit_minutes: Number(adjustTime) || 30,
          passing_score: Number(adjustPassScore) || 50,
          enable_camera: adjustEnableCamera,
          camera_strictness: adjustStrictness,
          deadline: adjustDeadline ? new Date(adjustDeadline).toISOString() : ""
        }
      });
      toast.success(res.message || "Assessment adjustments saved successfully!");
      setAdjustingExam(null);
      qc.invalidateQueries({ queryKey: ["admin-cbt-tests"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update test adjustments");
    } finally {
      setIsSavingAdjustments(false);
    }
  };

  const handleConfirmAssign = async () => {
    if (!assigningExam) return;
    const totalCount = assignTargetType === "intern" 
      ? assignSelectedInternIds.length 
      : assignTargetType === "team" 
      ? assignSelectedTeamIds.length 
      : assignSelectedInternIds.length + assignSelectedTeamIds.length;
    if (totalCount === 0) return toast.error("Please select at least one candidate or team.");
    
    setIsReassigning(true);
    try {
      const res = await doReassign({
        data: {
          testId: assigningExam.id,
          target_type: assignTargetType,
          target_intern_ids: assignSelectedInternIds,
          target_team_ids: assignSelectedTeamIds,
          target_id: assignTargetType === "team" ? assignSelectedTeamIds[0] : assignSelectedInternIds[0],
          camera_strictness: assignStrictness
        }
      });
      toast.success(res.message || "Test allocated and assigned successfully!");
      setAssigningExam(null);
      setAssignSelectedInternIds([]);
      setAssignSelectedTeamIds([]);
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
    onSuccess: () => { 
      toast.success("Assigned test and all associated submissions/questions deleted successfully."); 
      qc.invalidateQueries({ queryKey: ["admin-cbt-tests"] }); 
      qc.invalidateQueries({ queryKey: ["all-cbt-submissions"] }); 
    },
    onError: (err: any) => toast.error(err?.message || "Failed to delete test")
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => doToggle({ data: { testId: id, status } }),
    onSuccess: () => { toast.success("Status updated"); qc.invalidateQueries({ queryKey: ["admin-cbt-tests"] }); },
    onError: () => toast.error("Failed to update status")
  });

  const getTargetName = (type: string, ids: string[]) => {
    if (!targets) return "Loading...";
    if (!ids || ids.length === 0) return "Global";
    if (ids.length === 1) {
      const id = ids[0];
      if (type === "intern") {
        const intern = targets.interns.find(i => i.id === id);
        return intern ? intern.full_name : id;
      } else {
        const team = targets.teams.find(t => t.id === id);
        return team ? team.name : id;
      }
    }
    const names = ids.map(id => {
      const intern = targets.interns.find(i => i.id === id);
      if (intern) return intern.full_name;
      const team = targets.teams.find(t => t.id === id);
      if (team) return team.name;
      return id;
    });
    return `${ids.length} Targets (${names.slice(0, 2).join(", ")}${ids.length > 2 ? "..." : ""})`;
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
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm min-w-[1100px]">
            <thead className="bg-slate-50 border-b text-slate-600 font-bold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Title & Policy</th>
                <th className="px-6 py-4">Target Candidate</th>
                <th className="px-6 py-4">Proctoring Strictness</th>
                <th className="px-6 py-4">Deadline</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions & Controls</th>
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
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-2">
                          {/* Tier 1: Primary Allocation & Review Controls */}
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <Button
                              size="sm"
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1 shadow-xs h-7 px-2.5"
                              onClick={() => {
                                setAssignTargetType(t.allocation_mode === 'team' ? 'team' : 'intern');
                                setAssignSelectedInternIds(t.intern_ids || []);
                                setAssignSelectedTeamIds(t.team_ids || []);
                                setAssignStrictness(t.camera_strictness || "standard");
                                setAssigningExam(t);
                              }}
                            >
                              <UserPlus className="h-3.5 w-3.5" /> Assign Test
                            </Button>

                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 h-7 px-2.5" 
                              onClick={() => setSelectedTestId(t.id)}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> Mark Sheets
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs gap-1 border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-semibold h-7 px-2.5"
                              onClick={() => handlePreviewExistingExam(t)}
                              disabled={isLoadingExistingQuestions}
                            >
                              <Eye className="h-3.5 w-3.5" /> Preview Qs
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs gap-1 border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold h-7 px-2.5"
                              onClick={() => {
                                setAdjustingExam(t);
                                setAdjustTime(t.time_limit_minutes || 30);
                                setAdjustPassScore(t.passing_score || 50);
                                setAdjustEnableCamera(t.enable_camera !== false);
                                setAdjustStrictness(t.camera_strictness || "standard");
                                setAdjustDeadline(t.deadline ? new Date(t.deadline).toISOString().slice(0, 16) : "");
                              }}
                              title="Adjust Time Limit, Passing Score, Camera Strictness & Deadline"
                            >
                              <Sliders className="h-3.5 w-3.5 text-sky-600" /> Adjust Settings
                            </Button>
                          </div>

                          {/* Tier 2: Downloads, Extensions, Status & Deletion */}
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs gap-1 border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold h-7 px-2"
                              onClick={() => handleDownloadPaper(t, 'pdf')}
                              disabled={downloadingFormat?.testId === t.id && downloadingFormat?.format === 'pdf'}
                              title="Download Vyntyra Branded Official Exam Paper (.PDF) with Founder Signature"
                            >
                              {downloadingFormat?.testId === t.id && downloadingFormat?.format === 'pdf' ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                              ) : (
                                <FileText className="h-3.5 w-3.5 text-amber-600" />
                              )}
                              PDF
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs gap-1 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold h-7 px-2"
                              onClick={() => handleDownloadPaper(t, 'csv')}
                              disabled={downloadingFormat?.testId === t.id && downloadingFormat?.format === 'csv'}
                              title="Download Structured Questions Dataset (.CSV)"
                            >
                              {downloadingFormat?.testId === t.id && downloadingFormat?.format === 'csv' ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                              ) : (
                                <Download className="h-3.5 w-3.5 text-emerald-600" />
                              )}
                              CSV
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs gap-1 border-purple-200 hover:bg-purple-50 text-purple-700 font-semibold h-7 px-2"
                              onClick={() => {
                                setExtendingExam(t);
                                setNewDeadline(t.deadline ? new Date(t.deadline).toISOString().slice(0, 16) : "");
                              }}
                            >
                              <Calendar className="h-3.5 w-3.5" /> Extend
                            </Button>

                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs h-7 px-2 text-slate-600 hover:text-slate-900" 
                              title={t.status === 'published' ? "Pause/Draft Test" : "Publish Test"}
                              onClick={() => toggleMut.mutate({ id: t.id, status: t.status === 'published' ? 'draft' : 'published' })}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>

                            {/* Dedicated Prominent Red Delete Test Button */}
                            <Button
                              variant="destructive"
                              size="sm"
                              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1 h-7 px-2.5 shadow-xs"
                              onClick={() => setDeletingExam(t)}
                              title="Permanently Delete Test and All Submissions"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete Test</span>
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Test Settings Dialog */}
      {adjustingExam && (
        <Dialog open={!!adjustingExam} onOpenChange={(open) => !open && setAdjustingExam(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-sky-600" />
                Adjust Assessment Settings
              </DialogTitle>
              <DialogDescription>
                Fine-tune exam policies, time limits, passing score, proctoring, and deadline for <strong>{adjustingExam.title}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Duration (Minutes)
                  </label>
                  <input 
                    type="number"
                    min={5}
                    max={360}
                    value={adjustTime}
                    onChange={e => setAdjustTime(Number(e.target.value))}
                    className="w-full p-2.5 border rounded-lg text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Passing Score (%)
                  </label>
                  <input 
                    type="number"
                    min={10}
                    max={100}
                    value={adjustPassScore}
                    onChange={e => setAdjustPassScore(Number(e.target.value))}
                    className="w-full p-2.5 border rounded-lg text-sm text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Submission Deadline
                </label>
                <input 
                  type="datetime-local" 
                  value={adjustDeadline}
                  onChange={e => setAdjustDeadline(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-sm text-slate-800"
                />
              </div>

              <div className="p-3.5 bg-slate-50 border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">Webcam Proctoring</div>
                    <div className="text-[11px] text-slate-500">Require camera & periodic candidate snapshots</div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={adjustEnableCamera}
                    onChange={e => setAdjustEnableCamera(e.target.checked)}
                    className="h-4 w-4 text-sky-600 rounded"
                  />
                </div>

                {adjustEnableCamera && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Camera Strictness & Malpractice Tolerance
                    </label>
                    <Select value={adjustStrictness} onValueChange={(val: any) => setAdjustStrictness(val)}>
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lenient">Lenient (3 strikes before auto-submission)</SelectItem>
                        <SelectItem value="standard">Standard (2 strikes before auto-submission)</SelectItem>
                        <SelectItem value="strict">Ultra-Strict (1 strike terminates test immediately)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setAdjustingExam(null)} disabled={isSavingAdjustments}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmAdjust} 
                disabled={isSavingAdjustments}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold"
              >
                {isSavingAdjustments ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Adjustments"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Exam Confirmation Dialog */}
      {deletingExam && (
        <Dialog open={!!deletingExam} onOpenChange={(open) => !open && setDeletingExam(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                Permanently Delete Assessment
              </DialogTitle>
              <DialogDescription className="text-slate-600 pt-2 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-900 font-bold">{deletingExam.title}</strong>?
                <br /><br />
                <span className="text-rose-700 font-semibold bg-rose-50 p-2.5 rounded-lg border border-rose-200 block text-xs">
                  ⚠️ This action is irreversible. All generated questions, candidate submissions, answer sheets, and malpractice proctoring logs for this test will be permanently erased.
                </span>
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-2 sm:gap-0 mt-4">
              <Button variant="outline" onClick={() => setDeletingExam(null)} disabled={deleteMut.isPending}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={async () => {
                  try {
                    await deleteMut.mutateAsync(deletingExam.id);
                    setDeletingExam(null);
                  } catch (e) {
                    // Handled by mutation onError toast
                  }
                }}
                disabled={deleteMut.isPending}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5"
              >
                {deleteMut.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</>
                ) : (
                  <><Trash2 className="h-4 w-4" /> Yes, Permanently Delete Test</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
          <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-600" />
                Assign CBT Exam & Dispatch Email
              </DialogTitle>
              <DialogDescription>
                Allocate <strong>{assigningExam.title}</strong> to multiple individual candidates, multiple teams, or manual multi-selection with no limit.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 overflow-y-auto flex-1 pr-1">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Target Allocation Mode</label>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    {assignTargetType === "intern" 
                      ? `${assignSelectedInternIds.length} Candidate(s)` 
                      : assignTargetType === "team" 
                      ? `${assignSelectedTeamIds.length} Team(s)` 
                      : `${assignSelectedInternIds.length} Candidates + ${assignSelectedTeamIds.length} Teams`}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAssignTargetType("intern")}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      assignTargetType === "intern"
                        ? "bg-white text-indigo-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Users className="h-3.5 w-3.5" /> Individual Candidates
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignTargetType("team")}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      assignTargetType === "team"
                        ? "bg-white text-indigo-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Shield className="h-3.5 w-3.5" /> Entire Teams
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignTargetType("manual")}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      assignTargetType === "manual"
                        ? "bg-white text-indigo-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <CheckSquare className="h-3.5 w-3.5" /> Manual Multi-Select
                  </button>
                </div>
              </div>

              {/* Filter and Bulk Action */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search candidates or teams..."
                    value={assignSearchQuery}
                    onChange={e => setAssignSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 px-2.5"
                  onClick={() => {
                    if (assignTargetType === "intern") {
                      setAssignSelectedInternIds((targets?.interns || []).map((i: any) => i.id));
                    } else if (assignTargetType === "team") {
                      setAssignSelectedTeamIds((targets?.teams || []).map((t: any) => t.id));
                    } else {
                      setAssignSelectedInternIds((targets?.interns || []).map((i: any) => i.id));
                      setAssignSelectedTeamIds((targets?.teams || []).map((t: any) => t.id));
                    }
                  }}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 px-2.5 text-slate-500"
                  onClick={() => {
                    if (assignTargetType === "intern") setAssignSelectedInternIds([]);
                    else if (assignTargetType === "team") setAssignSelectedTeamIds([]);
                    else {
                      setAssignSelectedInternIds([]);
                      setAssignSelectedTeamIds([]);
                    }
                  }}
                >
                  Clear
                </Button>
              </div>

              {/* Checkbox List */}
              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                {(assignTargetType === "intern" || assignTargetType === "manual") && (
                  <>
                    {assignTargetType === "manual" && (
                      <div className="px-3 py-1 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                        Candidates / Interns ({(targets?.interns || []).length})
                      </div>
                    )}
                    {(targets?.interns || [])
                      .filter((i: any) => 
                        !assignSearchQuery || 
                        i.full_name?.toLowerCase().includes(assignSearchQuery.toLowerCase()) || 
                        i.email?.toLowerCase().includes(assignSearchQuery.toLowerCase())
                      )
                      .map((intern: any) => {
                        const isSelected = assignSelectedInternIds.includes(intern.id);
                        return (
                          <label 
                            key={intern.id} 
                            className={`flex items-center gap-3 p-2.5 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${isSelected ? "bg-indigo-50/50" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAssignSelectedInternIds([...assignSelectedInternIds, intern.id]);
                                } else {
                                  setAssignSelectedInternIds(assignSelectedInternIds.filter(id => id !== intern.id));
                                }
                              }}
                              className="h-4 w-4 text-indigo-600 rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 truncate">{intern.full_name}</p>
                              <p className="text-[11px] text-slate-500 truncate">{intern.email}</p>
                            </div>
                          </label>
                        );
                      })}
                  </>
                )}

                {(assignTargetType === "team" || assignTargetType === "manual") && (
                  <>
                    {assignTargetType === "manual" && (
                      <div className="px-3 py-1 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                        Teams ({(targets?.teams || []).length})
                      </div>
                    )}
                    {(targets?.teams || [])
                      .filter((t: any) => 
                        !assignSearchQuery || 
                        t.name?.toLowerCase().includes(assignSearchQuery.toLowerCase())
                      )
                      .map((team: any) => {
                        const isSelected = assignSelectedTeamIds.includes(team.id);
                        return (
                          <label 
                            key={team.id} 
                            className={`flex items-center gap-3 p-2.5 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${isSelected ? "bg-indigo-50/50" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAssignSelectedTeamIds([...assignSelectedTeamIds, team.id]);
                                } else {
                                  setAssignSelectedTeamIds(assignSelectedTeamIds.filter(id => id !== team.id));
                                }
                              }}
                              className="h-4 w-4 text-indigo-600 rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 truncate">{team.name}</p>
                              <p className="text-[11px] text-slate-500">Entire Team Allocation</p>
                            </div>
                          </label>
                        );
                      })}
                  </>
                )}
              </div>

              {/* Selected Pills Preview */}
              {(assignSelectedInternIds.length > 0 || assignSelectedTeamIds.length > 0) && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-lg max-h-24 overflow-y-auto">
                  {assignSelectedInternIds.map(id => {
                    const intern = (targets?.interns || []).find((i: any) => i.id === id);
                    return (
                      <span key={id} className="inline-flex items-center gap-1 text-[11px] font-medium bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                        {intern?.full_name || id}
                        <button
                          type="button"
                          onClick={() => setAssignSelectedInternIds(assignSelectedInternIds.filter(x => x !== id))}
                          className="hover:text-indigo-950 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                  {assignSelectedTeamIds.map(id => {
                    const team = (targets?.teams || []).find((t: any) => t.id === id);
                    return (
                      <span key={id} className="inline-flex items-center gap-1 text-[11px] font-medium bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                        {team?.name || id}
                        <button
                          type="button"
                          onClick={() => setAssignSelectedTeamIds(assignSelectedTeamIds.filter(x => x !== id))}
                          className="hover:text-purple-950 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

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

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
              <Button variant="outline" onClick={() => setAssigningExam(null)}>Cancel</Button>
              <Button 
                onClick={handleConfirmAssign} 
                disabled={isReassigning || (assignSelectedInternIds.length === 0 && assignSelectedTeamIds.length === 0)}
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
