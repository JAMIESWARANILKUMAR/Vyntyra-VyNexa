import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAdminTestsFn, deleteAdminTestFn, toggleAdminTestStatusFn } from "@/lib/cbt.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, CheckCircle, XCircle, BrainCircuit, RefreshCw, AlertTriangle, Search, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/cbt/submissions")({
  component: AdminCbtSubmissions,
});

function AdminCbtSubmissions() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"tests" | "submissions">("tests");
  
  const fetchTests = useServerFn(listAdminTestsFn);
  const doDelete = useServerFn(deleteAdminTestFn);
  const doToggle = useServerFn(toggleAdminTestStatusFn);

  const { data: tests = [], isLoading: isLoadingTests } = useQuery({
    queryKey: ["admin-cbt-tests"],
    queryFn: () => fetchTests(),
  });

  const { data: submissions = [], isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ["admin-cbt-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cbt_submissions").select("*, cbt_tests(*), profiles(first_name, last_name, intern_id)").order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: activeTab === "submissions"
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this test? All questions and submissions will be lost.")) return;
    try {
      await doDelete({ data: { testId: id } });
      toast.success("Test deleted successfully");
      qc.invalidateQueries({ queryKey: ["admin-cbt-tests"] });
    } catch (e) {
      toast.error("Failed to delete test");
    }
  };

  const handleToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "draft" : "active";
    try {
      await doToggle({ data: { testId: id, status: newStatus } });
      toast.success(`Test is now ${newStatus}`);
      qc.invalidateQueries({ queryKey: ["admin-cbt-tests"] });
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
          <BrainCircuit className="text-emerald-600 h-8 w-8" />
          CBT Management & Submissions
        </h1>
        <p className="text-slate-500 mt-2">Manage assigned AI CBT exams, monitor intern progress, and review AI grading justifications & proctoring logs.</p>
      </div>

      <div className="flex gap-4 border-b border-slate-200 pb-px">
        <button 
          onClick={() => setActiveTab("tests")} 
          className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 ${activeTab === "tests" ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          Manage Tests
        </button>
        <button 
          onClick={() => setActiveTab("submissions")} 
          className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 ${activeTab === "submissions" ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          Intern Submissions
        </button>
      </div>

      {activeTab === "tests" && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {isLoadingTests ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
              <RefreshCw className="h-8 w-8 animate-spin mb-4 text-emerald-500" />
              Loading assigned tests...
            </div>
          ) : tests.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No AI CBT exams generated yet.</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-sm">
                <tr>
                  <th className="p-4">Test Title & ID</th>
                  <th className="p-4">Target Type</th>
                  <th className="p-4">Created At</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tests.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{t.title}</div>
                      <div className="text-xs font-mono text-slate-400 mt-1">{t.id}</div>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-600 uppercase">{t.target_type}</td>
                    <td className="p-4 text-sm text-slate-500">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${t.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 flex items-center justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleToggle(t.id, t.status)}
                        className={t.status === "active" ? "text-amber-600 border-amber-200 hover:bg-amber-50" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"}
                      >
                        {t.status === "active" ? <XCircle className="h-4 w-4 mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                        {t.status === "active" ? "Disable" : "Enable"}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(t.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "submissions" && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {isLoadingSubmissions ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
              <RefreshCw className="h-8 w-8 animate-spin mb-4 text-indigo-500" />
              Loading intern submissions...
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No submissions received yet.</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-sm">
                <tr>
                  <th className="p-4">Intern & Profile</th>
                  <th className="p-4">Test Attempted</th>
                  <th className="p-4">Score & AI Status</th>
                  <th className="p-4">Proctoring Logs</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((s: any) => {
                  const strikes = (s.proctoring_logs as any[])?.length || 0;
                  const isTerminated = s.status === "terminated_cheating";
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{s.profiles?.first_name} {s.profiles?.last_name}</div>
                        <div className="text-xs text-slate-500 mt-1">{s.profiles?.intern_id}</div>
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-700">
                        {s.cbt_tests?.title || "Unknown Test"}
                        <div className="text-xs text-slate-400 font-mono mt-1">{new Date(s.submitted_at || s.created_at).toLocaleString()}</div>
                      </td>
                      <td className="p-4">
                        {isTerminated ? (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase">Terminated (Cheating)</span>
                        ) : s.status === "graded" ? (
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-black ${s.passed ? "text-emerald-600" : "text-rose-600"}`}>{s.score} / {s.max_score}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{s.passed ? "Pass" : "Fail"}</span>
                          </div>
                        ) : (
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase">Pending Grading</span>
                        )}
                      </td>
                      <td className="p-4">
                        {strikes > 0 ? (
                          <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-rose-200">
                            <AlertTriangle className="h-4 w-4" /> {strikes} Violation(s) Logged
                          </div>
                        ) : (
                          <div className="text-emerald-600 text-xs font-bold flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Clean Session</div>
                        )}
                      </td>
                      <td className="p-4 flex items-center justify-end">
                        <Button variant="outline" size="sm" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => {
                          alert(JSON.stringify(s.ai_feedback || s.proctoring_logs, null, 2));
                        }}>
                          <FileText className="h-4 w-4 mr-2" /> View Full Report
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
