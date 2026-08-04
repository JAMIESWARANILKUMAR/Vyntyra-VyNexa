import React, { useState } from "react";
import { 
  Code2, GitBranch, ExternalLink, ShieldAlert, Cpu, Layers, 
  Terminal, CheckCircle2, AlertCircle, Plus, MessageSquare, Play, Bug
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TechWorkspaceProps {
  bugs: any[];
  onAddBug: (title: string, desc: string, severity: "Blocker" | "Major" | "Minor", repoUrl: string) => Promise<void>;
  onUpdateBugStatus: (id: string, status: "open" | "in_progress" | "resolved") => Promise<void>;
}

export function TechDomainWorkspace({ bugs, onAddBug, onUpdateBugStatus }: TechWorkspaceProps) {
  const [prUrl, setPrUrl] = useState("");
  const [repoBranch, setRepoBranch] = useState("main");
  const [prLogs, setPrLogs] = useState<{ title: string; pr: string; status: string; comments: string }[]>([
    { title: "feat(auth): Add 2FA WebAuthn Passkeys", pr: "https://github.com/vyntyra/core/pull/142", status: "Approved", comments: "LGTM! Excellent test coverage." },
    { title: "refactor(db): Migrate RLS policies for leads", pr: "https://github.com/vyntyra/core/pull/139", status: "In Review", comments: "Please check policy index performance." },
  ]);

  const [bugOpen, setBugOpen] = useState(false);
  const [bugForm, setBugForm] = useState<{ title: string; description: string; severity: "Blocker" | "Major" | "Minor"; repo_url: string }>({
    title: "",
    description: "",
    severity: "Major",
    repo_url: "",
  });

  const handlePrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prUrl) return;
    setPrLogs([{ title: `Submission on branch ${repoBranch}`, pr: prUrl, status: "Under Review", comments: "Submitted for mentor review." }, ...prLogs]);
    setPrUrl("");
    toast.success("PR & Code Submission logged!");
  };

  const handleBugSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugForm.title) return;
    try {
      await onAddBug(bugForm.title, bugForm.description, bugForm.severity, bugForm.repo_url);
      setBugForm({ title: "", description: "", severity: "Major", repo_url: "" });
      setBugOpen(false);
      toast.success("Bug reported to mentor!");
    } catch (err) {
      toast.error("Failed to report bug");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Developer IDE & Ecosystem Quick Launch Grid */}
      <div className="rounded-2xl bg-slate-900 text-white p-6 shadow-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cpu className="h-5 w-5 text-emerald-400" />
            <h2 className="font-bold text-base text-slate-100">Integrated Developer Workspace & Deployment Links</h2>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800">
            ENV: STAGING-US-EAST
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { name: "GitHub Repo", icon: <GitBranch className="h-4 w-4 text-purple-400" />, url: "https://github.com" },
            { name: "Supabase DB", icon: <Layers className="h-4 w-4 text-emerald-400" />, url: "https://supabase.com" },
            { name: "Figma Design", icon: <Code2 className="h-4 w-4 text-pink-400" />, url: "https://figma.com" },
            { name: "Vercel Deploy", icon: <ExternalLink className="h-4 w-4 text-white" />, url: "https://vercel.com" },
            { name: "Hostinger Portal", icon: <Cpu className="h-4 w-4 text-amber-400" />, url: "https://hostinger.com" },
            { name: "Render Logs", icon: <Terminal className="h-4 w-4 text-sky-400" />, url: "https://render.com" },
          ].map((item, idx) => (
            <a
              key={idx}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:bg-slate-800 hover:border-emerald-500 transition-all flex flex-col items-center gap-2 group text-center"
            >
              <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <span className="text-xs font-medium text-slate-300 group-hover:text-white truncate max-w-full">{item.name}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 2. Code & PR Submission Hub */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-purple-600" /> Code & PR Submission Hub
          </h3>
          <p className="text-xs text-slate-500">Link your pull request URLs and branches to your daily assigned tasks for mentor code review.</p>

          <form onSubmit={handlePrSubmit} className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                className="col-span-1 rounded-md border p-2 text-xs font-mono"
                placeholder="Branch (e.g. main)"
                value={repoBranch}
                onChange={(e) => setRepoBranch(e.target.value)}
              />
              <input
                type="url"
                required
                className="col-span-2 rounded-md border p-2 text-xs font-mono"
                placeholder="https://github.com/org/repo/pull/123"
                value={prUrl}
                onChange={(e) => setPrUrl(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs">
              Submit PR for Review
            </Button>
          </form>

          {/* Submissions & Mentor Comments */}
          <div className="space-y-2.5 pt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Recent Code Submissions & In-Line Reviews</span>
            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {prLogs.map((p, i) => (
                <div key={i} className="p-3 rounded-lg border bg-slate-50 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <a href={p.pr} target="_blank" rel="noreferrer" className="font-semibold text-purple-700 hover:underline truncate max-w-[240px]">
                      {p.title}
                    </a>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${p.status === "Approved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 italic">💬 Mentor Comment: "{p.comments}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Technical Bug & Ticket Log */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <Bug className="h-4 w-4 text-red-600" /> Technical Bug & Issue Tracker
            </h3>
            <Button size="sm" variant="outline" className="h-7 text-xs text-red-700 border-red-200 hover:bg-red-50" onClick={() => setBugOpen(!bugOpen)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Report Bug
            </Button>
          </div>

          {bugOpen && (
            <form onSubmit={handleBugSubmit} className="p-4 rounded-xl border bg-red-50/40 space-y-3">
              <input
                type="text"
                required
                className="w-full rounded-md border p-2 text-xs"
                placeholder="Bug Title (e.g. Supabase RLS timeout on query)"
                value={bugForm.title}
                onChange={(e) => setBugForm({ ...bugForm, title: e.target.value })}
              />
              <textarea
                className="w-full rounded-md border p-2 text-xs"
                rows={2}
                placeholder="Error log snippet or steps to reproduce..."
                value={bugForm.description}
                onChange={(e) => setBugForm({ ...bugForm, description: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="rounded-md border p-2 text-xs"
                  value={bugForm.severity}
                  onChange={(e: any) => setBugForm({ ...bugForm, severity: e.target.value })}
                >
                  <option value="Blocker">Blocker (Critical)</option>
                  <option value="Major">Major</option>
                  <option value="Minor">Minor</option>
                </select>
                <input
                  type="url"
                  className="rounded-md border p-2 text-xs"
                  placeholder="Repo / Commit URL"
                  value={bugForm.repo_url}
                  onChange={(e) => setBugForm({ ...bugForm, repo_url: e.target.value })}
                />
              </div>
              <Button type="submit" size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs w-full">
                File Technical Ticket
              </Button>
            </form>
          )}

          <div className="divide-y max-h-[260px] overflow-y-auto">
            {bugs.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">No active bugs reported. All systems running cleanly!</div>
            ) : (
              bugs.map((b) => (
                <div key={b.id} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${b.severity === "Blocker" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                        {b.severity}
                      </span>
                      <h4 className="font-semibold text-xs text-slate-900">{b.title}</h4>
                    </div>
                    {b.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{b.description}</p>}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`h-7 text-xs ${b.status === "resolved" ? "text-emerald-600" : "text-slate-500"}`}
                    onClick={() => onUpdateBugStatus(b.id, b.status === "resolved" ? "open" : "resolved")}
                  >
                    {b.status === "resolved" ? <CheckCircle2 className="h-4 w-4" /> : "Resolve"}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
