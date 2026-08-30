import React, { useState } from "react";
import { 
  Code2, GitBranch, ExternalLink, ShieldAlert, Cpu, Layers, 
  Terminal, CheckCircle2, AlertCircle, Plus, MessageSquare, Play, Bug, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface TechWorkspaceProps {
  bugs: any[];
  onAddBug: (title: string, desc: string, severity: "Blocker" | "Major" | "Minor", repoUrl: string) => Promise<void>;
  onUpdateBugStatus: (id: string, status: "open" | "in_progress" | "resolved") => Promise<void>;
}

export function TechDomainWorkspace({ bugs, onAddBug, onUpdateBugStatus }: TechWorkspaceProps) {
  const [prUrl, setPrUrl] = useState("");
  const [repoBranch, setRepoBranch] = useState("main");
  const [prLogs, setPrLogs] = useState<{ title: string; pr: string; status: string; comments: string }[]>([]);

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
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* 1. Developer IDE & Ecosystem Quick Launch Grid */}
      <div className="rounded-3xl bg-gradient-to-r from-white via-[#FFF7F4] to-[#FFF1EC] text-slate-900 p-6 sm:p-7 shadow-xl shadow-orange-950/5 border border-orange-200/80 backdrop-blur-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-orange-100 border border-orange-300 flex items-center justify-center shadow-xs">
              <Cpu className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                Tech Engineering Workspace
                <Sparkles className="h-4 w-4 text-orange-500 animate-pulse" />
              </h2>
              <p className="text-xs text-slate-600">Integrated developer tools, deployment links & staging environments</p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-black text-orange-900 bg-orange-100 px-3 py-1 rounded-full border border-orange-300 shadow-xs flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-ping" />
            ENV: STAGING-PROD
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { name: "GitHub Repo", icon: <GitBranch className="h-4 w-4 text-purple-600" />, url: "https://github.com" },
            { name: "Supabase DB", icon: <Layers className="h-4 w-4 text-emerald-600" />, url: "https://supabase.com" },
            { name: "Figma Design", icon: <Code2 className="h-4 w-4 text-pink-600" />, url: "https://figma.com" },
            { name: "Vercel Deploy", icon: <ExternalLink className="h-4 w-4 text-orange-600" />, url: "https://vercel.com" },
            { name: "Hostinger Portal", icon: <Cpu className="h-4 w-4 text-amber-600" />, url: "https://hostinger.com" },
            { name: "Render Logs", icon: <Terminal className="h-4 w-4 text-sky-600" />, url: "https://render.com" },
          ].map((item, idx) => (
            <motion.a
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={idx}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="p-3.5 rounded-2xl bg-white border border-orange-200/80 hover:bg-orange-50 hover:border-orange-300 transition-all flex flex-col items-center gap-2.5 group text-center shadow-xs backdrop-blur-md"
            >
              <div className="h-9 w-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center group-hover:scale-110 group-hover:border-orange-400 transition-all">
                {item.icon}
              </div>
              <span className="text-xs font-extrabold text-slate-800 group-hover:text-orange-600 truncate max-w-full">{item.name}</span>
            </motion.a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 2. Code & PR Submission Hub */}
        <div className="rounded-3xl border border-orange-200/80 bg-white/95 p-6 shadow-xl shadow-orange-950/5 backdrop-blur-xl space-y-4 text-slate-900">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <GitBranch className="h-4.5 w-4.5 text-orange-600" /> Code &amp; PR Submission Hub
          </h3>
          <p className="text-xs text-slate-600">Link your pull request URLs and branches to your daily assigned tasks for mentor code review.</p>

          <form onSubmit={handlePrSubmit} className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                className="col-span-1 rounded-xl border border-orange-200 bg-white p-2.5 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-orange-500 outline-none shadow-xs"
                placeholder="Branch (e.g. main)"
                value={repoBranch}
                onChange={(e) => setRepoBranch(e.target.value)}
              />
              <input
                type="url"
                required
                className="col-span-2 rounded-xl border border-orange-200 bg-white p-2.5 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-orange-500 outline-none shadow-xs"
                placeholder="https://github.com/org/repo/pull/123"
                value={prUrl}
                onChange={(e) => setPrUrl(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm" className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs h-10 rounded-xl shadow-lg shadow-orange-500/25 cursor-pointer border border-orange-400/30">
              Submit PR for Review
            </Button>
          </form>

          {/* Submissions & Mentor Comments */}
          <div className="space-y-2.5 pt-2">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Recent Code Submissions &amp; In-Line Reviews</span>
            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {prLogs.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs italic">No PRs submitted yet today.</div>
              ) : (
                prLogs.map((p, i) => (
                  <div key={i} className="p-3.5 rounded-2xl border border-orange-200/80 bg-orange-50/60 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <a href={p.pr} target="_blank" rel="noreferrer" className="font-extrabold text-orange-600 hover:underline truncate max-w-[240px]">
                        {p.title}
                      </a>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase border ${p.status === "Approved" ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-amber-100 text-amber-800 border-amber-300"}`}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 italic">💬 Mentor Comment: "{p.comments}"</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 3. Technical Bug & Ticket Log */}
        <div className="rounded-3xl border border-orange-200/80 bg-white/95 p-6 shadow-xl shadow-orange-950/5 backdrop-blur-xl space-y-4 text-slate-900">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Bug className="h-4.5 w-4.5 text-rose-500" /> Technical Bug &amp; Issue Tracker
            </h3>
            <Button size="sm" variant="outline" className="h-8 text-xs font-extrabold text-rose-700 border-rose-300 bg-rose-50 hover:bg-rose-100 rounded-xl cursor-pointer" onClick={() => setBugOpen(!bugOpen)}>
              <Plus className="h-3.5 w-3.5 mr-1 text-rose-600" /> Report Bug
            </Button>
          </div>

          {bugOpen && (
            <form onSubmit={handleBugSubmit} className="p-4 rounded-2xl border border-rose-300 bg-rose-50/60 space-y-3">
              <input
                type="text"
                required
                className="w-full rounded-xl border border-rose-200 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-rose-500 outline-none shadow-xs"
                placeholder="Bug Title (e.g. Supabase RLS timeout on query)"
                value={bugForm.title}
                onChange={(e) => setBugForm({ ...bugForm, title: e.target.value })}
              />
              <textarea
                className="w-full rounded-xl border border-rose-200 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-rose-500 outline-none shadow-xs"
                rows={2}
                placeholder="Error log snippet or steps to reproduce..."
                value={bugForm.description}
                onChange={(e) => setBugForm({ ...bugForm, description: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="rounded-xl border border-rose-200 bg-white p-2 text-xs text-slate-900 outline-none shadow-xs"
                  value={bugForm.severity}
                  onChange={(e: any) => setBugForm({ ...bugForm, severity: e.target.value })}
                >
                  <option value="Blocker">Blocker (Critical)</option>
                  <option value="Major">Major</option>
                  <option value="Minor">Minor</option>
                </select>
                <input
                  type="url"
                  className="rounded-xl border border-rose-200 bg-white p-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none shadow-xs"
                  placeholder="Repo / Commit URL"
                  value={bugForm.repo_url}
                  onChange={(e) => setBugForm({ ...bugForm, repo_url: e.target.value })}
                />
              </div>
              <Button type="submit" size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 rounded-xl w-full cursor-pointer shadow-md shadow-rose-500/20">
                File Technical Ticket
              </Button>
            </form>
          )}

          <div className="divide-y divide-orange-200/60 max-h-[260px] overflow-y-auto">
            {bugs.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs italic">No active bugs reported. All systems running cleanly!</div>
            ) : (
              bugs.map((b) => (
                <div key={b.id} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${b.severity === "Blocker" ? "bg-rose-100 text-rose-800 border-rose-300" : "bg-amber-100 text-amber-800 border-amber-300"}`}>
                        {b.severity}
                      </span>
                      <h4 className="font-extrabold text-xs text-slate-900">{b.title}</h4>
                    </div>
                    {b.description && <p className="text-xs text-slate-600 mt-1 line-clamp-1">{b.description}</p>}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`h-7 text-xs font-bold ${b.status === "resolved" ? "text-emerald-600 hover:text-emerald-700" : "text-slate-500 hover:text-slate-900"}`}
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

    </motion.div>
  );
}
