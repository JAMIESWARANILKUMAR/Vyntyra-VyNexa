import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateAiTestFn, saveGeneratedTestFn } from "@/lib/cbt.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BrainCircuit, Upload, Loader2, Save, Users, FileText, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/cbt/generate")({
  component: AdminCbtGenerate,
});

function AdminCbtGenerate() {
  const [targetType, setTargetType] = useState("intern");
  const [targetId, setTargetId] = useState("");
  const [taskContext, setTaskContext] = useState("");
  const [modules, setModules] = useState<string[]>(["mcq"]);
  const [generated, setGenerated] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const generateFn = useServerFn(generateAiTestFn);
  const saveFn = useServerFn(saveGeneratedTestFn);

  const ALL_MODULES = [
    { id: "mcq", label: "Multiple Choice Questions" },
    { id: "coding", label: "Coding Rounds (Syntax checked)" },
    { id: "long_answer", label: "Long Answer / Written" },
    { id: "creativity", label: "Creativity / Scenario Analysis" },
    { id: "aptitude", label: "Mental Ability & Aptitude" },
    { id: "communication", label: "English Communication" }
  ];

  const toggleModule = (mod: string) => {
    setModules(prev => prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]);
  };

  const handleGenerate = async () => {
    if (!targetId || !taskContext) return toast.error("Please provide a target ID and task context.");
    if (modules.length === 0) return toast.error("Select at least one module.");
    setIsGenerating(true);
    try {
      const res = await generateFn({ data: { taskContext, modules } });
      if (res.success) {
        setGenerated(res.data);
        toast.success("AI Test generated successfully!");
      }
    } catch (e) {
      toast.error("Generation failed. Please try again.");
    }
    setIsGenerating(false);
  };

  const handleSave = async () => {
    try {
      const res = await saveFn({ data: {
        testMetadata: { title: `Assigned CBT - ${targetType.toUpperCase()}`, target_type: targetType, target_id: targetId, modules },
        questions: generated.questions
      } });
      if (res.success) {
        toast.success("Test Approved & Published successfully!");
        setGenerated(null);
        setTargetId("");
        setTaskContext("");
      }
    } catch (e) {
      toast.error("Failed to save test.");
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
          <BrainCircuit className="text-emerald-600 h-8 w-8" />
          Generate AI CBT Exam
        </h1>
        <p className="text-slate-500 mt-2">Generate targeted, multi-module proctored exams for your interns or teams using Google Gemini.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-indigo-500"/> Target Selection</h3>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="target" checked={targetType === "intern"} onChange={() => setTargetType("intern")} /> Intern
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="target" checked={targetType === "team"} onChange={() => setTargetType("team")} /> Team
              </label>
            </div>
            <input 
              type="text" 
              placeholder={`Enter ${targetType === "intern" ? "Intern" : "Team"} ID UUID`} 
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              value={targetId}
              onChange={e => setTargetId(e.target.value)}
            />
          </div>

          <div>
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-rose-500"/> Task Context & Reference</h3>
            <textarea 
              className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none" 
              rows={4} 
              placeholder="Paste the task documentation or specific scenario details here. The AI will generate questions based on this."
              value={taskContext}
              onChange={e => setTaskContext(e.target.value)}
            />
            <div className="mt-3 p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-center cursor-pointer hover:bg-slate-100 transition-colors">
              <Upload className="h-6 w-6 text-slate-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-700">Upload PDF / Word Report</div>
              <div className="text-xs text-slate-500 mt-1">Upload to R2 bucket for AI Parsing (Coming Soon)</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 flex flex-col">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-emerald-500"/> Exam Modules</h3>
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
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-emerald-200 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-slate-900">Generated Exam Preview</h2>
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
                <div className="text-slate-700 mb-3">{q.question_text}</div>
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
