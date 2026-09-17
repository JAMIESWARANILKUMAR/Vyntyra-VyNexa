import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAdminTestsFn, deleteAdminTestFn, toggleAdminTestStatusFn } from "@/lib/cbt.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, CheckCircle, XCircle, BrainCircuit, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/cbt/submissions")({
  component: AdminCbtSubmissions,
});

function AdminCbtSubmissions() {
  const qc = useQueryClient();
  const fetchTests = useServerFn(listAdminTestsFn);
  const doDelete = useServerFn(deleteAdminTestFn);
  const doToggle = useServerFn(toggleAdminTestStatusFn);

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ["admin-cbt-tests"],
    queryFn: () => fetchTests(),
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
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
          <BrainCircuit className="text-emerald-600 h-8 w-8" />
          Test Management & Submissions
        </h1>
        <p className="text-slate-500 mt-2">Manage assigned AI CBT exams, enable/disable access, or delete tests completely.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
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
    </div>
  );
}
