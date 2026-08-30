import { useState, useEffect } from "react";
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
import { bulkAssignTasksFromCsv, assignManualTaskToInterns, listTaskTemplates, listActiveInternsForCohortAssignment } from "@/lib/operations.functions";
import { parseDocumentAndAssignTasks } from "@/lib/ai-tasks.functions";
import { sendTaskNotificationEmail } from "@/lib/notifications-omni.functions";
import { Upload, FileSpreadsheet, Plus, CheckCircle2, Loader2, Sparkles, Link2, Users, FileText, BookTemplate, Mail, Check, Search } from "lucide-react";
import { toast } from "sonner";

interface ParsedTask {
  title: string;
  description: string;
  task_file_url: string;
  task_doc_url: string;
  report_template_url: string;
  due_date: string;
  priority: "low" | "medium" | "high";
  domain?: string;
}

export function InternTaskAssignmentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"csv" | "manual" | "ai">("manual");

  // Server functions
  const doBulkAssign = useServerFn(bulkAssignTasksFromCsv);
  const doManualAssign = useServerFn(assignManualTaskToInterns);
  const doAiAssign = useServerFn(parseDocumentAndAssignTasks);
  const fetchTaskTemplates = useServerFn(listTaskTemplates);
  const fetchActiveInterns = useServerFn(listActiveInternsForCohortAssignment);
  const doSendTaskEmail = useServerFn(sendTaskNotificationEmail);
  const [notifyViaEmail, setNotifyViaEmail] = useState(true);

  // Fetch active interns list for manual selection
  const internsQ = useQuery({
    queryKey: ["active-interns-for-tasks"],
    queryFn: () => fetchActiveInterns(),
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
  const [selectAll, setSelectAll] = useState(false);
  const [internSearch, setInternSearch] = useState("");

  // Domains extracted from current interns
  const uniqueDomains = Array.from(new Set(interns.map((i: any) => i.department || i.domain || "General"))).filter(Boolean);
  const [targetDomain, setTargetDomain] = useState<string>("All Domains");
  const [targetSubDomain, setTargetSubDomain] = useState<string>("All Sub-Domains");

  // Sub-Domains extracted from current interns
  const uniqueSubDomains = Array.from(new Set(interns
    .filter((i: any) => targetDomain === "All Domains" || (i.department || i.domain || "General") === targetDomain)
    .map((i: any) => i.position || "General")
  )).filter(Boolean);

  // Manual Form State
  const [manualTitle, setManualTitle] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualFileUrl, setManualFileUrl] = useState("");
  const [manualDocUrl, setManualDocUrl] = useState("");
  const [manualReportUrl, setManualReportUrl] = useState("");
  const [manualMeetLink, setManualMeetLink] = useState("");
  const [assignmentMode, setAssignmentMode] = useState<"individual" | "team" | "all">("individual");
  const [teamSize, setTeamSize] = useState<2 | 3 | 4>(2);
  const [teamName, setTeamName] = useState("");
  const [manualDueDate, setManualDueDate] = useState("");
  const [manualPriority, setManualPriority] = useState<"low" | "medium" | "high">("medium");
  const [manualLevel, setManualLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [manualCredits, setManualCredits] = useState<number>(10);
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

    if (file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls")) {
      toast.error("Excel files (.xlsx) are not supported directly. Please save the file as a CSV and upload the CSV file.");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text.startsWith("PK") || text.includes("\x00")) {
        toast.error("Invalid file format. Please upload a valid plain text CSV file.");
        return;
      }
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
      const fileIdx = headers.findIndex((h) => h.includes("file") || h.includes("resource") || (h.includes("url") && !h.includes("handbook") && !h.includes("doc") && !h.includes("report")));
      const docIdx = headers.findIndex((h) => h.includes("handbook") || h.includes("doc"));
      const reportIdx = headers.findIndex((h) => h.includes("report"));
      const dueIdx = headers.findIndex((h) => h.includes("due") || h.includes("date") || h.includes("deadline"));
      const priorityIdx = headers.findIndex((h) => h.includes("priority") || h.includes("importance"));
      const domainIdx = headers.findIndex((h) => h.includes("domain") || h.includes("dept") || h.includes("department"));

      const tasks: ParsedTask[] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((val) => val.trim().replace(/^["']|["']$/g, ""));
        const title = titleIdx !== -1 && row[titleIdx] ? row[titleIdx] : row[0] || `Internship Task ${i}`;
        const description = descIdx !== -1 && row[descIdx] ? row[descIdx] : "Complete designated internship project requirements.";
        const task_file_url = fileIdx !== -1 && row[fileIdx] ? row[fileIdx] : "";
        const task_doc_url = docIdx !== -1 && row[docIdx] ? row[docIdx] : "";
        const report_template_url = reportIdx !== -1 && row[reportIdx] ? row[reportIdx] : "";
        const due_date = dueIdx !== -1 && row[dueIdx] ? row[dueIdx] : "";
        const domain = domainIdx !== -1 && row[domainIdx] ? row[domainIdx] : "all";
        let priority: "low" | "medium" | "high" = "medium";
        if (priorityIdx !== -1 && row[priorityIdx]) {
          const p = row[priorityIdx].toLowerCase();
          if (p.includes("high")) priority = "high";
          else if (p.includes("low")) priority = "low";
        }

        tasks.push({ title, description, task_file_url, task_doc_url, report_template_url, due_date, priority, domain });
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
      setSelectedInternIds(interns.map((i: any) => i.id));
    } else {
      setSelectedInternIds([]);
    }
  };

  const handleToggleIntern = (id: string) => {
    setSelectAll(false);
    setSelectedInternIds((prev) => {
      if (assignmentMode === "individual") {
        return prev.includes(id) ? [] : [id];
      }
      if (assignmentMode === "team") {
        if (prev.includes(id)) return prev.filter((i) => i !== id);
        if (prev.length >= teamSize) {
          toast.info(`Team size limit is ${teamSize} members. Deselect one or increase team size.`);
          return prev;
        }
        return [...prev, id];
      }
      return prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
    });
  };

  // Submit Manual Task
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) {
      toast.error("Task title is required");
      return;
    }

    let targetIds: string[] = [];
    if (assignmentMode === "all") {
      targetIds = selectedInternIds.length > 0 ? selectedInternIds : interns.map((i) => i.id);
    } else if (assignmentMode === "team") {
      if (selectedInternIds.length === 0) {
        toast.error("Please select interns for this collaborative team assignment.");
        return;
      }
      targetIds = selectedInternIds;
    } else if (assignmentMode === "individual") {
      if (selectedInternIds.length === 0) {
        toast.error("Please select an intern to assign this task to.");
        return;
      }
      targetIds = [selectedInternIds[0]];
    } else {
      targetIds = selectedInternIds;
    }

    if (targetIds.length === 0) {
      toast.error("Please select at least one intern to assign this task to.");
      return;
    }

    const assignedInterns = interns.filter((i: any) => targetIds.includes(i.id));
    const teamMemberNames = assignedInterns.map((i: any) => i.full_name || i.email);

    setIsSubmittingManual(true);
    try {
      await doManualAssign({
        data: {
          title: manualTitle.trim(),
          description: manualDescription.trim(),
          task_file_url: manualFileUrl.trim() || undefined,
          task_doc_url: manualDocUrl.trim() || undefined,
          task_meet_link: manualMeetLink.trim() || undefined,
          assignment_mode: assignmentMode === "team" ? "team" : "individual",
          team_name: assignmentMode === "team" ? (teamName.trim() || `Collaborative Team (${targetIds.length})`) : undefined,
          team_size: assignmentMode === "team" ? targetIds.length : 1,
          team_member_names: teamMemberNames,
          level: manualLevel,
          credits: manualCredits,
          due_date: manualDueDate || undefined,
          priority: manualPriority,
          target_intern_ids: targetIds,
          save_template: saveTemplate,
        },
      });
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      qc.invalidateQueries({ queryKey: ["admin-intern-tasks"] });
      if (saveTemplate) qc.invalidateQueries({ queryKey: ["task-templates"] });
      
      if (notifyViaEmail) {
        for (const intern of assignedInterns) {
          if (intern.email) {
            try {
              await doSendTaskEmail({
                data: {
                  recipient_email: intern.email,
                  recipient_name: intern.full_name,
                  task_title: manualTitle,
                  task_status: "assigned",
                  mentor_remarks: manualDescription,
                  due_date: manualDueDate || undefined,
                  priority: manualPriority,
                },
              });
            } catch (e) {
              console.warn("Task assignment email skipped:", e);
            }
          }
        }
      }

      toast.success(
        assignmentMode === "team"
          ? `Collaborative team task created for ${targetIds.length} members!`
          : `Task assigned successfully to ${targetIds.length} intern(s)!` + (notifyViaEmail ? " Email notifications sent." : "")
      );
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
      toast.success(`Assigned ${res.count} tasks to active intern(s)!`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to bulk assign tasks");
    } finally {
      setIsSubmittingCsv(false);
    }
  };

  const handleDownloadSampleCsv = () => {
    const sampleCsvContent = `"Title","Description","File URL","Handbook URL","Report Doc URL","Deadline","Priority","Domain"
"Build Full-Stack E-Commerce Dashboard","Develop React frontend with TanStack Router and Supabase REST API authentication","https://drive.google.com/file/d/sample-doc-1/view","https://drive.google.com/handbook-1","https://docs.google.com/document/d/report-1","2026-08-30","High","tech"
"Implement Microservices Billing Engine","Design Node.js Express microservice for invoice generation & GST calculation","https://github.com/vyntyra/sample-repo-specs","https://drive.google.com/handbook-2","https://docs.google.com/document/d/report-2","2026-08-28","Medium","tech"
"AI Chatbot Integration & UI Polish","Integrate Gemini AI assistant SDK with dynamic stream rendering & Tailwind CSS","https://drive.google.com/file/d/sample-doc-3/view","","","2026-09-05","High","tech"
"Business Operations Auditing","Analyze operational efficiency across departments and prepare recommendations reports","https://drive.google.com/file/d/sample-doc-4/view","","","2026-09-02","Medium","management"`;

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
            Assign tasks manually or bulk upload a CSV file. Tasks will be distributed so every intern gets their assigned task in their portal.
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
                Upload CSV Task List
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
                Required Columns: <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">Title</code>, <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">Description</code>, <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">File URL</code>, <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">Handbook URL</code>, <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">Report URL</code>, <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">Deadline</code>
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
                placeholder="Title, Description, File URL, Handbook URL, Report URL, Deadline, Priority&#10;Full Stack E-Commerce App, Build API & React Frontend, https://drive.google.com/..., https://..., https://..., 2026-08-30, High"
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
                  <Users className="h-4 w-4 text-indigo-600" /> Target Interns (
                  {interns.filter((i: any) => {
                    const matchDomain = targetDomain === "All Domains" || (i.department || "General") === targetDomain;
                    const matchSubDomain = targetSubDomain === "All Sub-Domains" || (i.position || "General") === targetSubDomain;
                    return matchDomain && matchSubDomain;
                  }).length} Available)
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
                  {interns.filter((i: any) => {
                    const matchDomain = targetDomain === "All Domains" || (i.department || "General") === targetDomain;
                    const matchSubDomain = targetSubDomain === "All Sub-Domains" || (i.position || "General") === targetSubDomain;
                    return matchDomain && matchSubDomain;
                  }).map((i) => {
                    const isSelected = selectedInternIds.includes(i.id);
                    return (
                      <div
                        key={i.id}
                        onClick={() => handleToggleIntern(i.id)}
                        className={`flex items-center justify-between py-1.5 px-2 rounded cursor-pointer transition-all ${
                          isSelected ? "bg-indigo-50 dark:bg-indigo-950/40 font-semibold" : "hover:bg-slate-50 dark:hover:bg-slate-900"
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{i.full_name || i.email}</div>
                          <div className="text-[10px] text-slate-500">{i.department || "Internship"} &middot; {i.intern_id || i.email}</div>
                        </div>
                        <div className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                          isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white"
                        }`}>
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
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
                  const t = taskTemplates.find((x: any) => x.id === val);
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
                    {taskTemplates.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              {/* Assignment Mode Selector */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-indigo-600" /> Assignment Mode & Target
                  </Label>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {assignmentMode === "team" ? `Team of ${teamSize} Members` : assignmentMode === "individual" ? "Single Intern" : "Bulk All"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { id: "individual", label: "👤 Individual Intern", desc: "Assign task to 1 specific intern" },
                    { id: "team", label: "👥 Collaborative Team", desc: "Group 2, 3, or 4 interns together" },
                    { id: "all", label: "🌐 All Active Interns", desc: "Assign to everyone / domain" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setAssignmentMode(mode.id as any);
                        setSelectedInternIds([]);
                        setSelectAll(mode.id === "all");
                      }}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        assignmentMode === mode.id
                          ? "bg-white border-indigo-600 shadow-xs ring-2 ring-indigo-500/20 text-indigo-950"
                          : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                      }`}
                    >
                      <span className="font-bold text-xs">{mode.label}</span>
                      <span className="text-[10px] text-slate-400 mt-1">{mode.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Team Configuration Sub-panel */}
                {assignmentMode === "team" && (
                  <div className="pt-2 border-t border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <Label className="text-xs font-bold text-slate-700">Team Size (Select 2, 3, or 4 Interns):</Label>
                      <div className="flex items-center gap-2">
                        {[2, 3, 4].map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              setTeamSize(size as any);
                              if (selectedInternIds.length > size) {
                                setSelectedInternIds(selectedInternIds.slice(0, size));
                              }
                            }}
                            className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                              teamSize === size
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {size} Members
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-slate-700">Custom Team Name (Optional)</Label>
                      <Input
                        placeholder="e.g. Alpha Squad - Frontend Core"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="mt-1 text-xs bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

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

              {/* Dedicated Task Communication Meet Link */}
              <div className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">📹</span>
                  <Label className="text-xs font-bold text-blue-950">Dedicated Task Discussion & Meet Link (Optional)</Label>
                </div>
                <Input
                  placeholder="https://meet.google.com/abc-defg-hij or Zoom / Teams URL"
                  value={manualMeetLink}
                  onChange={(e) => setManualMeetLink(e.target.value)}
                  className="text-xs font-mono bg-white border-blue-200"
                />
                <p className="text-[10px] text-blue-800">
                  Interns will see a 1-click <strong>"📹 Join Task Meet"</strong> button directly in their task workspace for daily syncs and queries.
                </p>
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
                  <Label className="text-xs font-bold text-slate-700">Handbook URL</Label>
                  <Input
                    placeholder="https://drive.google.com/handbook..."
                    value={manualDocUrl}
                    onChange={(e) => setManualDocUrl(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-xs font-bold text-slate-700">Report Template URL (Optional)</Label>
                  <Input
                    placeholder="https://docs.google.com/document/d/..."
                    value={manualReportUrl}
                    onChange={(e) => setManualReportUrl(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-bold text-slate-700">Deadline Date</Label>
                  <Input
                    type="date"
                    value={manualDueDate}
                    onChange={(e) => setManualDueDate(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700">Priority Level</Label>
                  <Select value={manualPriority} onValueChange={(v) => setManualPriority(v as any)}>
                    <SelectTrigger className="mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700">Skill Level</Label>
                  <Select value={manualLevel} onValueChange={(v) => setManualLevel(v as any)}>
                    <SelectTrigger className="mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Target Intern Selection */}
              <div className="border rounded-xl p-4 bg-white dark:bg-slate-950 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-indigo-600" />
                    {assignmentMode === "team"
                      ? `Select Team Members (${selectedInternIds.length} of ${teamSize} selected)`
                      : assignmentMode === "individual"
                      ? `Select Target Intern (${selectedInternIds.length === 1 ? "1 Selected" : "None Selected"})`
                      : `Assign To Interns (${selectAll ? `All ${interns.length}` : selectedInternIds.length} Selected)`}
                  </Label>
                  {assignmentMode === "all" ? (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (selectAll || selectedInternIds.length === interns.length) {
                            setSelectAll(false);
                            setSelectedInternIds([]);
                          } else {
                            setSelectAll(true);
                            setSelectedInternIds(interns.map((i: any) => i.id));
                          }
                        }}
                        className="text-xs font-bold h-7 px-2.5"
                      >
                        {selectAll || selectedInternIds.length === interns.length ? "Deselect All" : "Select All Active Interns"}
                      </Button>
                    </div>
                  ) : (
                    selectedInternIds.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedInternIds([])}
                        className="text-xs text-slate-500 hover:text-slate-800 h-7 px-2"
                      >
                        Clear Selection
                      </Button>
                    )
                  )}
                </div>

                {/* Intern Search Filter */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search interns by name, email, roll number, or domain..."
                    value={internSearch}
                    onChange={(e) => setInternSearch(e.target.value)}
                    className="pl-8 text-xs h-8 bg-slate-50 dark:bg-slate-900"
                  />
                </div>

                {/* Selected Interns Highlight Tag Bar */}
                {selectedInternIds.length > 0 && (
                  <div className="p-2.5 bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 rounded-lg text-xs flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-indigo-900 dark:text-indigo-300">
                      {assignmentMode === "team" ? "👥 Team Members:" : "👤 Assigned To:"}
                    </span>
                    {interns
                      .filter((i: any) => selectedInternIds.includes(i.id))
                      .map((i: any) => (
                        <span key={i.id} className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 text-[11px] font-semibold">
                          {i.full_name || i.email}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInternIds(prev => prev.filter(id => id !== i.id));
                            }}
                            className="hover:text-rose-600 font-bold ml-1"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                  </div>
                )}

                <div className="max-h-64 overflow-y-auto divide-y border rounded bg-slate-50/50 text-xs">
                  {internsQ.isLoading ? (
                    <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-600" /> Loading active interns...
                    </div>
                  ) : interns.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      No registered interns found.
                    </div>
                  ) : (
                    uniqueDomains.map((domain: any) => {
                      const domainInterns = interns
                        .filter((i: any) => (i.department || i.domain || "General") === domain)
                        .filter((i: any) => {
                          const s = internSearch.toLowerCase().trim();
                          if (!s) return true;
                          return (i.full_name || "").toLowerCase().includes(s) ||
                                 (i.email || "").toLowerCase().includes(s) ||
                                 (i.intern_id || "").toLowerCase().includes(s) ||
                                 (i.position || "").toLowerCase().includes(s);
                        });

                      if (domainInterns.length === 0) return null;
                      
                      return (
                        <div key={domain} className="p-3">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 border-b pb-1 flex items-center justify-between">
                            <span>Domain: <span className="text-indigo-700 dark:text-indigo-400">{domain}</span></span>
                            <span className="text-[10px] text-slate-500 font-normal">{domainInterns.length} Interns</span>
                          </h4>
                          <div className="space-y-1.5">
                            {domainInterns.map((i: any) => {
                              const isSelected = selectedInternIds.includes(i.id);
                              return (
                                <div
                                  key={i.id}
                                  onClick={() => handleToggleIntern(i.id)}
                                  className={`flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-all border ${
                                    isSelected
                                      ? "bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 shadow-2xs font-semibold"
                                      : "bg-white dark:bg-slate-900 hover:bg-slate-100/80 dark:hover:bg-slate-800 border-slate-200/80"
                                  }`}
                                >
                                  <div className="flex-1 min-w-0 pr-2">
                                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{i.full_name || i.email}</div>
                                    <div className="text-[10px] text-slate-500 truncate">
                                      <span className="font-medium text-indigo-600 dark:text-indigo-400">{i.position || "General"}</span> &middot; {i.intern_id || i.email}
                                    </div>
                                  </div>
                                  <div className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                                    isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white"
                                  }`}>
                                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 p-3 rounded-lg">
                  <Checkbox id="save-template" checked={saveTemplate} onCheckedChange={(c) => setSaveTemplate(!!c)} />
                  <Label htmlFor="save-template" className="text-xs font-medium text-slate-700 cursor-pointer flex items-center gap-1.5">
                    <BookTemplate className="h-4 w-4 text-indigo-500" /> Save as Template
                  </Label>
                </div>

                <div className="flex items-center space-x-2 bg-blue-50/60 border border-blue-200 p-3 rounded-lg">
                  <Checkbox id="notify-email" checked={notifyViaEmail} onCheckedChange={(c) => setNotifyViaEmail(!!c)} />
                  <Label htmlFor="notify-email" className="text-xs font-bold text-blue-900 cursor-pointer flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-blue-600" /> Email Assigned Interns
                  </Label>
                </div>
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
