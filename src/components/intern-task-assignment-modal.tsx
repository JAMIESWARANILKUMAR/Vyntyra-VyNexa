import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { bulkAssignTasksFromCsv, assignManualTaskToInterns, listTaskTemplates, listTeamMembers } from "@/lib/operations.functions";
import { parseDocumentAndAssignTasks } from "@/lib/ai-tasks.functions";
import { Upload, FileSpreadsheet, Plus, CheckCircle2, Loader2, Sparkles, Link2, Users, FileText, BookTemplate } from "lucide-react";
import { toast } from "sonner";

interface ParsedTask {
  title: string;
  description: string;
  task_file_url: string;
  task_doc_url: string;
  due_date: string;
  priority: "low" | "medium" | "high";
  domain?: string;
}

export function InternTaskAssignmentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"csv" | "manual" | "ai">("csv");

  // Server functions
  const doBulkAssign = useServerFn(bulkAssignTasksFromCsv);
  const doManualAssign = useServerFn(assignManualTaskToInterns);
  const doAiAssign = useServerFn(parseDocumentAndAssignTasks);
  const fetchTaskTemplates = useServerFn(listTaskTemplates);
  const fetchTeamMembers = useServerFn(listTeamMembers);

  // Fetch active interns list for manual selection
  const internsQ = useQuery({
    queryKey: ["active-interns-for-tasks"],
    queryFn: async () => {
      const members = await fetchTeamMembers();
      return members.filter((m: any) => m.role === "intern" || (m.department || "").toLowerCase().includes("intern") || (m.position || "").toLowerCase().includes("intern"));
    },
    enabled: open,
  });

  const templatesQ = useQuery({
    queryKey: ["task-templates"],
    queryFn: () => fetchTaskTemplates(),
    enabled: open,
  });

  const interns = internsQ.data || [];
  const taskTemplates = templatesQ.data || [];
  const [selectedInternIds, setSelectedInternIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(true);

  // Domains extracted from current interns
  const uniqueDomains = Array.from(new Set(interns.map((i: any) => i.department || "General"))).filter(Boolean);
  const [targetDomain, setTargetDomain] = useState<string>("All Domains");

  // Sub-Domains extracted from current interns
  const uniqueSubDomains = Array.from(new Set(interns
    .filter((i: any) => targetDomain === "All Domains" || (i.department || "General") === targetDomain)
    .map((i: any) => i.position || "General")
  )).filter(Boolean);
  const [targetSubDomain, setTargetSubDomain] = useState<string>("All Sub-Domains");


  // Manual Form State
  const [manualTitle, setManualTitle] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualFileUrl, setManualFileUrl] = useState("");
  const [manualDueDate, setManualDueDate] = useState("");
  const [manualPriority, setManualPriority] = useState<"low" | "medium" | "high">("medium");
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // CSV Import State
  const [csvRawText, setCsvRawText] = useState("");
  const [parsedCsvTasks, setParsedCsvTasks] = useState<ParsedTask[]>([]);
  const [fileName, setFileName] = useState("");
  const [isSubmittingCsv, setIsSubmittingCsv] = useState(false);

  // AI Assignment State
  const [documentText, setDocumentText] = useState("");
  const [isSubmittingAi, setIsSubmittingAi] = useState(false);

  // Handle AI submit
  const handleAiSubmit = async () => {
    if (!documentText.trim()) {
      toast.error("Please paste the document or syllabus text.");
      return;
    }
    setIsSubmittingAi(true);
    try {
      const res = await doAiAssign({ data: { documentText } });
      toast.success(`Successfully parsed ${res.parsedCount} tasks and assigned to ${res.assignedCount} interns!`);
      setDocumentText("");
      qc.invalidateQueries({ queryKey: ["admin-intern-tasks"] });
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate tasks via AI.");
    } finally {
      setIsSubmittingAi(false);
    }
  };

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvRawText(text);
      parseCsvText(text);
    };
    reader.readAsText(file);
  };

  // Simple, robust CSV / TSV text parser
  const parseCsvText = (text: string) => {
    try {
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
      if (lines.length < 2) {
        toast.error("CSV must contain a header row and at least one task data row.");
        return;
      }

      const headers = lines[0].split(/,|\t/).map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ""));
      
      const titleIdx = headers.findIndex((h) => h.includes("title") || h.includes("name") || h.includes("task"));
      const descIdx = headers.findIndex((h) => h.includes("desc") || h.includes("detail") || h.includes("requirement"));
      const fileIdx = headers.findIndex((h) => h.includes("file") || h.includes("resource") || (h.includes("url") && !h.includes("handbook") && !h.includes("doc")));
      const docIdx = headers.findIndex((h) => h.includes("handbook") || h.includes("doc"));
      const dueIdx = headers.findIndex((h) => h.includes("due") || h.includes("date") || h.includes("deadline"));
      const priorityIdx = headers.findIndex((h) => h.includes("priority") || h.includes("importance"));
      const domainIdx = headers.findIndex((h) => h.includes("domain") || h.includes("dept") || h.includes("department"));

      const tasks: ParsedTask[] = [];

      for (let i = 1; i < lines.length; i++) {
        // Handle quote-escaped values
        const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((val) => val.trim().replace(/^["']|["']$/g, ""));
        const title = titleIdx !== -1 && row[titleIdx] ? row[titleIdx] : row[0] || `Internship Task ${i}`;
        const description = descIdx !== -1 && row[descIdx] ? row[descIdx] : "Complete designated internship project requirements.";
        const task_file_url = fileIdx !== -1 && row[fileIdx] ? row[fileIdx] : "";
        const task_doc_url = docIdx !== -1 && row[docIdx] ? row[docIdx] : "";
        const due_date = dueIdx !== -1 && row[dueIdx] ? row[dueIdx] : "";
        const domain = domainIdx !== -1 && row[domainIdx] ? row[domainIdx] : "all";
        let priority: "low" | "medium" | "high" = "medium";
        if (priorityIdx !== -1 && row[priorityIdx]) {
          const p = row[priorityIdx].toLowerCase();
          if (p.includes("high")) priority = "high";
          else if (p.includes("low")) priority = "low";
        }

        tasks.push({ title, description, task_file_url, task_doc_url, due_date, priority, domain });
      }

      setParsedCsvTasks(tasks);
      toast.success(`Successfully parsed ${tasks.length} tasks from file!`);
    } catch (err: any) {
      toast.error("Failed to parse CSV: " + err.message);
    }
  };

  // Toggle selection
  const handleToggleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedInternIds([]);
    } else {
      setSelectedInternIds([]);
    }
  };

  const handleToggleIntern = (id: string) => {
    setSelectAll(false);
    setSelectedInternIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Submit Manual Task
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) {
      toast.error("Task title is required");
      return;
    }

    const targetIds = selectAll ? interns.map((i) => i.id) : selectedInternIds;
    if (targetIds.length === 0) {
      toast.error("Please select at least one intern to assign this task to.");
      return;
    }

    setIsSubmittingManual(true);
    try {
      await doManualAssign({
        data: {
          title: manualTitle,
          description: manualDescription,
          task_file_url: manualFileUrl,
          due_date: manualDueDate,
          priority: manualPriority,
          target_intern_ids: targetIds,
          save_template: saveTemplate,
        },
      });
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      qc.invalidateQueries({ queryKey: ["admin-intern-tasks"] });
      if (saveTemplate) qc.invalidateQueries({ queryKey: ["task-templates"] });
      toast.success(`Task assigned successfully to ${targetIds.length} intern(s)!`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to assign task");
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // Submit CSV Bulk Assignment
  const handleCsvSubmit = async () => {
    if (parsedCsvTasks.length === 0) {
      toast.error("No tasks parsed yet. Upload a valid CSV file or paste task data.");
      return;
    }

    let targetIds = selectAll ? [] : selectedInternIds; // empty = auto assign all
    if (targetDomain !== "All Domains" || targetSubDomain !== "All Sub-Domains") {
      targetIds = interns.filter((i: any) => {
        const matchDomain = targetDomain === "All Domains" || (i.department || "General") === targetDomain;
        const matchSubDomain = targetSubDomain === "All Sub-Domains" || (i.position || "General") === targetSubDomain;
        return matchDomain && matchSubDomain;
      }).map((i: any) => i.id);
      
      if (targetIds.length === 0) {
        toast.error(`No interns found matching the selected domain/sub-domain criteria.`);
        return;
      }
    }
    
    setIsSubmittingCsv(true);
    try {
      const res = await doBulkAssign({
        data: {
          tasks: parsedCsvTasks,
          target_intern_ids: targetIds.length > 0 ? targetIds : undefined,
        },
      });

      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      qc.invalidateQueries({ queryKey: ["admin-intern-tasks"] });
      toast.success(`Assigned ${res.assignedCount} tasks across ${res.internCount} intern(s)! Every intern received a task.`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to bulk assign tasks");
    } finally {
      setIsSubmittingCsv(false);
    }
  };

  const handleDownloadSampleCsv = () => {
    const sampleCsvContent = `"Title","Description","File URL","Handbook URL","Deadline","Priority","Domain"
"Build Full-Stack E-Commerce Dashboard","Develop React frontend with TanStack Router and Supabase REST API authentication","https://drive.google.com/file/d/sample-doc-1/view","https://drive.google.com/handbook-1","2026-08-30","High","tech"
"Implement Microservices Billing Engine","Design Node.js Express microservice for invoice generation & GST calculation","https://github.com/vyntyra/sample-repo-specs","https://drive.google.com/handbook-2","2026-08-28","Medium","tech"
"AI Chatbot Integration & UI Polish","Integrate Gemini AI assistant SDK with dynamic stream rendering & Tailwind CSS","https://drive.google.com/file/d/sample-doc-3/view","","2026-09-05","High","tech"
"Business Operations Auditing","Analyze operational efficiency across departments and prepare recommendations reports","https://drive.google.com/file/d/sample-doc-4/view","","2026-09-02","Medium","management"`;

    const blob = new Blob([sampleCsvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vyntyra_intern_tasks_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Sample task template CSV downloaded!");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2 text-slate-900">
            <Sparkles className="h-5 w-5 text-indigo-600" /> Assign Tasks to Interns
          </DialogTitle>
          <DialogDescription>
            Assign tasks manually or bulk upload a CSV/Excel file. Tasks will be distributed so every intern gets their assigned task in their portal.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="csv" className="flex items-center gap-2 font-medium">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Bulk Upload
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2 font-medium">
              <Sparkles className="h-4 w-4 text-amber-500" /> AI Auto-Assign
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2 font-medium">
              <Plus className="h-4 w-4 text-indigo-600" /> Manual Single Task
            </TabsTrigger>
          </TabsList>

          {/* ─── TAB 1: CSV / EXCEL BULK ASSIGNMENT ─── */}
          <TabsContent value="csv" className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 transition-colors">
              <Upload className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Upload CSV or Excel Task List
              </div>
              
              <div className="mt-4 mb-4 flex flex-col sm:flex-row justify-center items-center gap-3 flex-wrap">
                <span className="text-sm font-semibold text-slate-700">Target Intern Domain:</span>
                <Select value={targetDomain} onValueChange={(val) => { setTargetDomain(val); setTargetSubDomain("All Sub-Domains"); }}>
                  <SelectTrigger className="w-64 h-9 text-sm bg-white border-slate-300">
                    <SelectValue placeholder="Select Domain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Domains">All Domains (Assign to Everyone)</SelectItem>
                    {uniqueDomains.map((d: any) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="text-sm font-semibold text-slate-700 sm:ml-4">Sub-Domain:</span>
                <Select value={targetSubDomain} onValueChange={setTargetSubDomain}>
                  <SelectTrigger className="w-64 h-9 text-sm bg-white border-slate-300">
                    <SelectValue placeholder="Select Sub-Domain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Sub-Domains">All Sub-Domains</SelectItem>
                    {uniqueSubDomains.map((d: any) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs text-slate-500 mt-1 mb-3">
                Required Columns: <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">Title</code>, <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">Description</code>, <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">File URL</code>, <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">Handbook URL</code>, <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">Deadline</code>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Input
                  type="file"
                  accept=".csv, .txt, .tsv"
                  onChange={handleFileUpload}
                  className="max-w-xs text-xs cursor-pointer"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSampleCsv}
                  className="text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-semibold"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Download Sample CSV Template
                </Button>
              </div>

              {fileName && <div className="text-xs font-semibold text-emerald-600 mt-2">Selected: {fileName}</div>}
            </div>

            {/* Direct Paste Fallback */}
            <div>
              <Label className="text-xs font-semibold text-slate-700">Or Paste CSV / Tab-Separated Data Directly:</Label>
              <Textarea
                placeholder="Title, Description, File URL, Deadline, Priority&#10;Full Stack E-Commerce App, Build API & React Frontend, https://drive.google.com/..., 2026-08-30, High"
                rows={3}
                value={csvRawText}
                onChange={(e) => {
                  setCsvRawText(e.target.value);
                  parseCsvText(e.target.value);
                }}
                className="font-mono text-xs mt-1"
              />
            </div>

            {/* Parsed Tasks Preview Table */}
            {parsedCsvTasks.length > 0 && (
              <div className="rounded-xl border bg-white dark:bg-slate-950 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 border-b pb-2">
                  <span>Parsed Tasks Preview ({parsedCsvTasks.length} Tasks)</span>
                  <span className="text-emerald-600 font-medium">Ready to distribute across interns</span>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y text-xs">
                  {parsedCsvTasks.map((t, idx) => (
                    <div key={idx} className="py-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{idx + 1}. {t.title}</span>
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-slate-600">{t.priority}</span>
                      </div>
                      <div className="text-slate-500 line-clamp-1">{t.description}</div>
                      {t.task_file_url && (
                        <div className="text-[11px] text-indigo-600 truncate flex items-center gap-1">
                          <Link2 className="h-3 w-3" /> {t.task_file_url}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Intern Selection for Bulk Assign */}
            <div className="border rounded-xl p-4 bg-white dark:bg-slate-950 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-indigo-600" /> Target Interns ({interns.length} Available)
                </Label>
                <div className="flex items-center gap-2">
                  <Checkbox id="selectAllBulk" checked={selectAll} onCheckedChange={(v) => handleToggleSelectAll(!!v)} />
                  <label htmlFor="selectAllBulk" className="text-xs font-medium text-slate-700 cursor-pointer">
                    All Active Interns ({interns.length})
                  </label>
                </div>
              </div>

              {!selectAll && (
                <div className="max-h-36 overflow-y-auto divide-y border rounded p-2 text-xs">
                  {interns.map((i) => (
                    <div key={i.id} className="flex items-center justify-between py-1.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded">
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{i.full_name || i.email}</div>
                        <div className="text-[10px] text-slate-500">{i.department || "Internship"} &middot; {i.intern_id || i.email}</div>
                      </div>
                      <Checkbox checked={selectedInternIds.includes(i.id)} onCheckedChange={() => handleToggleIntern(i.id)} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-10"
              disabled={isSubmittingCsv || parsedCsvTasks.length === 0}
              onClick={handleCsvSubmit}
            >
              {isSubmittingCsv ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Distributing Tasks...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Bulk Assign & Distribute Tasks to Interns
                </>
              )}
            </Button>
          </TabsContent>

          {/* ─── TAB 2: AI ASSIGNMENT ─── */}
          <TabsContent value="ai" className="space-y-4">
            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-6 text-center">
              <Sparkles className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <div className="text-sm font-bold text-amber-900">
                AI Auto-Assign from Syllabus or Document
              </div>
              <div className="text-xs text-amber-700 mt-2 max-w-lg mx-auto leading-relaxed">
                Paste your syllabus or document text here. The AI will automatically extract actionable tasks, detect the appropriate domain, and randomly assign the tasks to interns in that domain.
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Document Text</Label>
              <Textarea
                placeholder="Paste the syllabus or project requirements here..."
                rows={10}
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
                className="font-mono text-xs mt-1 border-amber-200 focus-visible:ring-amber-500"
              />
            </div>

            <Button
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold flex items-center justify-center gap-2 mt-2"
              onClick={handleAiSubmit}
              disabled={isSubmittingAi}
            >
              {isSubmittingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isSubmittingAi ? "Parsing & Assigning..." : "Generate & Assign Tasks"}
            </Button>
          </TabsContent>

          {/* ─── TAB 3: MANUAL SINGLE TASK CREATION ─── */}
          <TabsContent value="manual" className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-full">
                <Label className="text-xs font-semibold text-slate-700">Load from Template (Optional)</Label>
                <Select onValueChange={(val) => {
                  const t = taskTemplates.find(x => x.id === val);
                  if (t) {
                    setManualTitle(t.title);
                    setManualDescription(t.description || "");
                    setManualFileUrl(t.task_file_url || "");
                    setManualPriority((t.priority as any) || "medium");
                  }
                }}>
                  <SelectTrigger className="mt-1 h-9 bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Select a saved template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTemplates.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <Label className="text-xs font-bold text-slate-700">Task Title *</Label>
                <Input
                  placeholder="e.g. Build Responsive User Dashboard in React"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Task Description & Requirements</Label>
                <Textarea
                  placeholder="Describe step-by-step requirements, expected deliverables, tech stack..."
                  rows={3}
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold text-slate-700">Task Files / Reference Document URL</Label>
                  <Input
                    placeholder="https://drive.google.com/... or https://github.com/..."
                    value={manualFileUrl}
                    onChange={(e) => setManualFileUrl(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700">Deadline Date</Label>
                  <Input
                    type="date"
                    value={manualDueDate}
                    onChange={(e) => setManualDueDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Priority Level</Label>
                <Select value={manualPriority} onValueChange={(v) => setManualPriority(v as any)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target Intern Selection */}
              <div className="border rounded-xl p-4 bg-white dark:bg-slate-950 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Assign To Interns ({selectAll ? `All ${interns.length}` : selectedInternIds.length} Selected)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Checkbox id="selectAllManual" checked={selectAll} onCheckedChange={(v) => handleToggleSelectAll(!!v)} />
                    <label htmlFor="selectAllManual" className="text-xs font-medium text-slate-700 cursor-pointer">
                      All Active Interns ({interns.length})
                    </label>
                  </div>
                </div>

                {!selectAll && (
                  <div className="max-h-36 overflow-y-auto divide-y border rounded p-2 text-xs">
                    {interns.map((i) => (
                      <div key={i.id} className="flex items-center justify-between py-1.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded">
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{i.full_name || i.email}</div>
                          <div className="text-[10px] text-slate-500">{i.department || "Internship"} &middot; {i.intern_id || i.email}</div>
                        </div>
                        <Checkbox checked={selectedInternIds.includes(i.id)} onCheckedChange={() => handleToggleIntern(i.id)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 p-3 rounded-lg">
                <Checkbox id="save-template" checked={saveTemplate} onCheckedChange={(c) => setSaveTemplate(!!c)} />
                <Label htmlFor="save-template" className="text-sm font-medium text-slate-700 cursor-pointer flex items-center gap-2">
                  <BookTemplate className="h-4 w-4 text-indigo-500" /> Save as Task Template for future use
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-10"
                disabled={isSubmittingManual}
              >
                {isSubmittingManual ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Assigning Task...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" /> Assign Task to Interns
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
