import React, { useState } from "react";
import { 
  Shield, Users, CheckCircle2, AlertTriangle, TrendingUp, DollarSign, 
  Award, Clock, Layers, FileCheck, ArrowUpRight, BarChart2, Briefcase, FileText, PieChart, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ManagementWorkspaceProps {
  standups: any[];
  deliverables: any[];
  onApproveStandup: (id: string) => Promise<void>;
  onApproveDeliverable: (id: string) => Promise<void>;
}

export function ManagementDomainWorkspace({ standups, deliverables, onApproveStandup, onApproveDeliverable }: ManagementWorkspaceProps) {
  const approvedStandups = standups.filter(s => s.status === "approved").length;
  const approvedDeliverables = deliverables.filter(d => d.status === "approved").length;
  const standupCompliance = standups.length > 0 ? Math.round((approvedStandups / standups.length) * 100) : 100;

  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalClient, setProposalClient] = useState("");
  const [proposalValue, setProposalValue] = useState("");
  const [proposals, setProposals] = useState<{ title: string; client: string; value: string; status: string }[]>([]);

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalTitle || !proposalClient) return;
    setProposals([
      { title: proposalTitle, client: proposalClient, value: proposalValue ? `₹${Number(proposalValue).toLocaleString("en-IN")}` : "₹1,50,000", status: "Draft Proposal" },
      ...proposals
    ]);
    setProposalTitle("");
    setProposalClient("");
    setProposalValue("");
    toast.success("MBA Corporate Client Proposal Pitch saved!");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* 1. Header Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div whileHover={{ y: -3 }} className="p-5 rounded-3xl bg-white border border-orange-200/80 backdrop-blur-xl shadow-xl shadow-orange-950/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-orange-600 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Standup Compliance
            </span>
            <Sparkles className="h-4 w-4 text-orange-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{standupCompliance}%</p>
          <p className="text-xs text-slate-600 font-medium">{approvedStandups} of {standups.length} daily logs verified</p>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} className="p-5 rounded-3xl bg-white border border-orange-200/80 backdrop-blur-xl shadow-xl shadow-orange-950/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-orange-600 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="h-4 w-4" /> Sprint Deliverables
            </span>
            <span className="text-xs font-mono font-black text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-300">VERIFIED</span>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{approvedDeliverables} Approved</p>
          <p className="text-xs text-slate-600 font-medium">Verified deliverables in database</p>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} className="p-5 rounded-3xl bg-white border border-orange-200/80 backdrop-blur-xl shadow-xl shadow-orange-950/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="h-4 w-4" /> Management Status
            </span>
            <span className="text-xs font-mono font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">ACTIVE</span>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">Lead Operations</p>
          <p className="text-xs text-slate-600 font-medium">Executive oversight & milestone management</p>
        </motion.div>
      </div>    

      {/* MBA & BBA Specialized Domain Header */}
      <div className="rounded-2xl bg-gradient-to-r from-white via-[#FFF7F4] to-[#FFF1EC] text-slate-900 p-6 shadow-xl shadow-orange-950/5 border border-orange-200/80 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center border border-orange-300">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-800 bg-orange-100 px-2.5 py-0.5 rounded border border-orange-300">
                  MBA / BBA Domain Workspace
                </span>
                <span className="text-xs text-slate-600">Business Operations & Corporate Strategy</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-1">Executive Command Center & Client Deck Hub</h2>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Executive Velocity & Bandwidth Meters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-white text-slate-900 shadow-xl shadow-orange-950/5 border border-orange-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-orange-600">Milestone & Ops Velocity</span>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black">{standupCompliance}% Compliance</div>
          <p className="text-xs text-slate-600">{approvedStandups}/{standups.length} Standup Logs Approved</p>
        </div>

        <div className="p-5 rounded-2xl bg-white text-slate-900 shadow-xl shadow-orange-950/5 border border-orange-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-orange-600">Executive Deliverables</span>
            <Users className="h-4 w-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black">{approvedDeliverables} Verified</div>
          <p className="text-xs text-slate-600">Decks, financial models & proposals</p>
        </div>

        <div className="p-5 rounded-2xl bg-white text-slate-900 shadow-xl shadow-orange-950/5 border border-orange-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-amber-600">Operations Action Queue</span>
            <Award className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black">{standups.filter(s => s.status === "pending").length} Pending Reviews</div>
          <p className="text-xs text-slate-600">Daily Standups awaiting approval</p>
        </div>
      </div>

      {/* 2. MBA/BBA Pitch Deck & Proposal Builder */}
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-emerald-600" /> Corporate Pitch & Client Deck Builder (MBA/BBA)
        </h3>
        <p className="text-xs text-slate-500">Draft commercial proposals, financial estimates, and pitch presentations for corporate client accounts.</p>

        <form onSubmit={handleCreateProposal} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-emerald-50/40 p-4 rounded-xl border border-emerald-200">
          <input
            type="text"
            required
            className="rounded border p-2 text-xs bg-white"
            placeholder="Proposal / Deck Title (e.g. Q4 Strategy Pitch)"
            value={proposalTitle}
            onChange={(e) => setProposalTitle(e.target.value)}
          />
          <input
            type="text"
            required
            className="rounded border p-2 text-xs bg-white"
            placeholder="Target Client Name"
            value={proposalClient}
            onChange={(e) => setProposalClient(e.target.value)}
          />
          <input
            type="number"
            className="rounded border p-2 text-xs bg-white"
            placeholder="Est. Value (₹)"
            value={proposalValue}
            onChange={(e) => setProposalValue(e.target.value)}
          />
          <Button type="submit" size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs">
            Generate Proposal Draft
          </Button>
        </form>

        <div className="space-y-2">
          {proposals.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 rounded-lg">No client proposals drafted yet. Use the builder above to draft your first MBA case study / proposal.</div>
          ) : (
            proposals.map((p, idx) => (
              <div key={idx} className="p-3 rounded-lg border bg-slate-50 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{p.title}</span>
                  <span className="text-slate-500 text-[11px]">Client: {p.client} • Commercials: {p.value}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                  {p.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 3. Intern Workload & Operations Tracker */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-600" /> Operations Standup Tracker
          </h3>
          <p className="text-xs text-slate-500">Monitor active daily standups submitted by team members.</p>

          <div className="space-y-3">
            {standups.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
                No active intern standup logs recorded.
              </div>
            ) : (
              standups.map((s: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl border bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{s.profiles?.full_name || "Intern"}</span>
                      <span className="text-slate-500 text-[11px]">Daily Log • {s.date}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${s.status === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {s.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 4. Stipend & Operations Action Center */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-blue-600" /> Executive Action Center
          </h3>
          <p className="text-xs text-slate-500">1-Click review & approval center for Daily Standups & Deliverables.</p>

          <div className="space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Pending Review Requests</span>
            <div className="space-y-2 max-h-[180px] overflow-y-auto">
              {standups.filter(s => s.status === "pending").length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 rounded-lg">No pending standups requiring review.</div>
              ) : (
                standups.filter(s => s.status === "pending").map((s) => (
                  <div key={s.id} className="p-3 rounded-lg border bg-slate-50 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-900 block">{s.profiles?.full_name || "Intern"}</span>
                      <span className="text-slate-500 text-[11px]">"{s.did_today}"</span>
                    </div>
                    <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onApproveStandup(s.id)}>
                      Approve
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </motion.div>
  );
}
