import React, { useState } from "react";
import { 
  Shield, Users, CheckCircle2, AlertTriangle, TrendingUp, DollarSign, 
  Award, Clock, Layers, FileCheck, ArrowUpRight, BarChart2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

  return (
    <div className="space-y-6">
      
      {/* 1. Executive Velocity & Bandwidth Meters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-emerald-400">Milestone Velocity</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold">{standupCompliance}% Compliance</div>
          <p className="text-xs text-slate-400">{approvedStandups}/{standups.length} Standup Logs Approved</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-sky-400">Deliverables Approved</span>
            <Users className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold">{approvedDeliverables} Verified</div>
          <p className="text-xs text-slate-400">Code & document submissions</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-amber-400">Action Queue</span>
            <Award className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold">{standups.filter(s => s.status === "pending").length} Pending Reviews</div>
          <p className="text-xs text-slate-400">Daily Standups awaiting approval</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 2. Intern Bandwidth & Workload Allocation Tracker */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-600" /> Intern Allocation & Bandwidth Tracker
          </h3>
          <p className="text-xs text-slate-500">Monitor active workloads to prevent burnout or idle time and reassign tasks dynamically.</p>

          <div className="space-y-3">
            {activeWorkloads.map((w, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border bg-slate-50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{w.name}</span>
                    <span className="text-slate-500 text-[11px]">{w.role} • {w.tasksAssigned} Tasks</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${w.bandwidth > 90 ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>
                    {w.status} ({w.bandwidth}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${w.bandwidth > 90 ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${w.bandwidth}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Stipend & Operations Approval Center */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-blue-600" /> Stipend & Operations Action Center
          </h3>
          <p className="text-xs text-slate-500">1-Click batch review & approval center for Daily Standups & Code Deliverables.</p>

          <div className="space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Pending Daily Standups</span>
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

    </div>
  );
}
