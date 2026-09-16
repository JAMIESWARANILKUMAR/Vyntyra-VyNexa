
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateAiTestFn, saveGeneratedTestFn } from "@/lib/cbt.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BrainCircuit, Upload, Loader2, Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/cbt/generate")({
  component: AdminCbtGenerate,
});

function AdminCbtGenerate() {
  const [taskContext, setTaskContext] = useState("");
  const [modules, setModules] = useState<string[]>([]);
  const [generated, setGenerated] = useState<any>(null);
  
  const generateFn = useServerFn(generateAiTestFn);
  const saveFn = useServerFn(saveGeneratedTestFn);

  const toggleModule = (mod: string) => {
    setModules(prev => prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]);
  };

  const handleGenerate = async () => {
    try {
      const res = await generateFn({ taskContext, modules });
      if (res.success) {
        setGenerated(res.data);
        toast.success("Test generated successfully");
      }
    } catch (e) {
      toast.error("Generation failed");
    }
  };

  const handleSave = async () => {
    try {
      const res = await saveFn({
        testMetadata: { title: "Generated Test", target_type: "intern", target_id: "00000000-0000-0000-0000-000000000000", modules },
        questions: generated.questions
      });
      if (res.success) toast.success("Saved successfully");
    } catch (e) {
      toast.error("Failed to save");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Generate AI CBT Exam</h1>
      <div className="space-y-4 max-w-2xl">
        <textarea 
          className="w-full p-4 border rounded-md" 
          rows={5} 
          placeholder="Paste task description or context..."
          value={taskContext}
          onChange={e => setTaskContext(e.target.value)}
        />
        <div className="flex gap-4">
          {["mcq", "coding", "long_answer"].map(m => (
            <label key={m} className="flex items-center gap-2">
              <input type="checkbox" checked={modules.includes(m)} onChange={() => toggleModule(m)} />
              {m.toUpperCase()}
            </label>
          ))}
        </div>
        <Button onClick={handleGenerate} className="gap-2"><BrainCircuit /> Generate Test</Button>
      </div>

      {generated && (
        <div className="mt-8">
          <h2 className="text-xl font-bold">Generated Questions Preview</h2>
          <pre className="bg-slate-100 p-4 rounded-md overflow-auto max-h-[400px]">
            {JSON.stringify(generated.questions, null, 2)}
          </pre>
          <Button onClick={handleSave} className="mt-4 gap-2 bg-emerald-600"><Save /> Approve & Publish</Button>
        </div>
      )}
    </div>
  );
}

