import React, { useState, useMemo } from "react";
import {
  Users, Briefcase, GraduationCap, Plus, RefreshCw, Search,
  Filter, Key, Mail, UserX, Shield, ShieldCheck, Check,
  AlertTriangle, Clock, ChevronRight, FileText, Download,
  Trash2, Building2, LayoutGrid, List, Sparkles, ExternalLink,
  ShieldAlert, MoreHorizontal, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SmartAvatar } from "@/components/SmartAvatar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { sendPaymentReminderEmail } from "@/lib/notifications-omni.functions";
import {
  bulkDeleteOfferLetters, bulkRegenerateOfferLetters,
  bulkDeleteNocs, bulkRegenerateNocs
} from "@/lib/operations.functions";
import { toast } from "sonner";

interface AdminDirectoryOperationsViewProps {
  team: any[];
  isLoading: boolean;
  isError: boolean;
  onRefresh: () => void;
  onAddMember: () => void;
  onSelectUser: (user: any) => void;
  onResetPassword: (user: any) => void;
  onRevoke: (id: string, name: string) => void;
}

export function AdminDirectoryOperationsView({
  team = [],
  isLoading,
  isError,
  onRefresh,
  onAddMember,
  onSelectUser,
  onResetPassword,
  onRevoke,
}: AdminDirectoryOperationsViewProps) {
  const [roleFilter, setRoleFilter] = useState<"all" | "employee" | "intern">("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [feeStatusFilter, setFeeStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [isDocGovernanceOpen, setIsDocGovernanceOpen] = useState(false);

  // Split roles
  const employees = useMemo(() => team.filter((m) => m.role === "employee"), [team]);
  const interns = useMemo(() => team.filter((m) => m.role === "intern"), [team]);

  // Unique departments list
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    team.forEach((m) => {
      if (m.department) set.add(m.department);
    });
    return Array.from(set);
  }, [team]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return team.filter((m) => {
      if (roleFilter !== "all" && m.role !== roleFilter) return false;
      if (departmentFilter !== "all" && m.department !== departmentFilter) return false;

      if (feeStatusFilter !== "all" && m.role === "intern") {
        if (feeStatusFilter === "paid" && !m.exam_fee_paid) return false;
        if (
          feeStatusFilter === "scheduled" &&
          (!m.fee_payment_scheduled || m.exam_fee_paid)
        )
          return false;
        if (feeStatusFilter === "exempted" && !m.is_fee_exempted) return false;
        if (
          feeStatusFilter === "unscheduled" &&
          (m.exam_fee_paid || m.is_fee_exempted || m.fee_payment_scheduled)
        )
          return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (m.full_name || "").toLowerCase();
        const email = (m.email || "").toLowerCase();
        const internId = (m.intern_id || "").toLowerCase();
        const empId = (m.employee_id || "").toLowerCase();
        const dept = (m.department || "").toLowerCase();
        const pos = (m.position || "").toLowerCase();
        if (
          !name.includes(q) &&
          !email.includes(q) &&
          !internId.includes(q) &&
          !empId.includes(q) &&
          !dept.includes(q) &&
          !pos.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [team, roleFilter, departmentFilter, feeStatusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ─── Institutional Header & ISO Regulatory Banner ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="h-7 px-2.5 rounded-md bg-slate-900 text-white font-mono text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-white" /> ISO/IEC 27001 ACCESS CONTROL
              </span>
              <span className="h-7 px-2.5 rounded-md border border-slate-200 bg-slate-50 text-slate-800 font-mono text-[10px] font-semibold tracking-wider uppercase flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-slate-700" /> RBAC IDENTITY DIRECTORY
              </span>
              <span className="h-7 px-2.5 rounded-md border border-slate-200 bg-slate-50 text-slate-800 font-mono text-[10px] font-semibold flex items-center gap-1.5">
                {team.length} REGISTERED IDENTITIES
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
              Institutional Identity &amp; Access Directory
            </h1>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Enterprise role provisioning, mentor mappings, identity compliance, and auditable credential governance for full-time employees and internship associates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
            <Button
              type="button"
              onClick={onAddMember}
              className="bg-slate-900 text-white hover:bg-black font-semibold text-xs h-9 px-4 rounded-lg shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 text-white" />
              <span>Add Personnel</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDocGovernanceOpen(true)}
              className="border-slate-300 text-slate-800 hover:bg-slate-100 font-semibold text-xs h-9 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-slate-700" />
              <span>Document Governance</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onRefresh}
              className="border-slate-300 text-slate-800 hover:bg-slate-100 font-semibold text-xs h-9 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Sync Directory</span>
            </Button>
          </div>
        </div>

        {/* ─── Metric Cards Grid ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                Total Personnel
              </span>
              <Users className="h-4 w-4 text-slate-900" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {team.length}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Active registered corporate accounts
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                Corporate Employees
              </span>
              <Briefcase className="h-4 w-4 text-slate-900" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {employees.length}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Staff, project leads &amp; mentors
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                Intern Cohort
              </span>
              <GraduationCap className="h-4 w-4 text-slate-900" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {interns.length}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Active student associates
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                Functional Divisions
              </span>
              <Building2 className="h-4 w-4 text-slate-900" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {departmentsList.length}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Engineering, HR, Research &amp; Operations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Filter & Command Rail ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold self-start">
            <button
              type="button"
              onClick={() => setRoleFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                roleFilter === "all"
                  ? "bg-slate-900 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              All Personnel ({team.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("employee")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                roleFilter === "employee"
                  ? "bg-slate-900 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Employees ({employees.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("intern")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                roleFilter === "intern"
                  ? "bg-slate-900 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Interns ({interns.length})</span>
            </button>
          </div>

          {/* Search Box & View Mode Toggle */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search name, institutional ID, email, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs border-slate-200 bg-slate-50 focus:bg-white rounded-lg"
              />
            </div>

            <div className="flex items-center p-1 rounded-lg border border-slate-200 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                title="Card Grid View"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "cards"
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                title="Data Table View"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "table"
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
              Department:
            </span>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="h-8 text-xs border-slate-200 bg-slate-50 w-48 rounded-lg font-medium">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departmentsList.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fee Status Filter (Interns only) */}
          {(roleFilter === "all" || roleFilter === "intern") && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                Fee Status:
              </span>
              <Select value={feeStatusFilter} onValueChange={setFeeStatusFilter}>
                <SelectTrigger className="h-8 text-xs border-slate-200 bg-slate-50 w-44 rounded-lg font-medium">
                  <SelectValue placeholder="All Fee Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fee Statuses</SelectItem>
                  <SelectItem value="paid">Fee Paid (₹199)</SelectItem>
                  <SelectItem value="scheduled">Payment Scheduled</SelectItem>
                  <SelectItem value="exempted">Fee Exempted</SelectItem>
                  <SelectItem value="unscheduled">Unscheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="ml-auto text-[11px] font-mono text-slate-500">
            Showing {filteredMembers.length} of {team.length} accounts
          </div>
        </div>
      </div>

      {/* ─── Members Presentation ─── */}
      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
              <Users className="h-8 w-8 mx-auto text-slate-300 stroke-[1.5] mb-2" />
              <p className="font-semibold text-slate-700">No personnel match current criteria</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting the search query or clearing department filters.</p>
            </div>
          ) : (
            filteredMembers.map((member) => {
              const assignedMentor =
                member.mentor_id && team
                  ? team.find((t: any) => t.id === member.mentor_id || t.user_id === member.mentor_id)
                  : null;
              const mentorDisplayName = assignedMentor
                ? assignedMentor.full_name
                : member.mentor_id
                ? "Assigned Mentor"
                : "Lead Mentor (Jami Eswar Anil Kumar)";

              return (
                <div
                  key={member.id}
                  onClick={() => onSelectUser(member)}
                  className="rounded-2xl border border-slate-200 bg-white hover:border-slate-400 hover:shadow-md transition-all p-5 flex flex-col justify-between cursor-pointer group space-y-4"
                >
                  <div className="space-y-3">
                    {/* Top Identity Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <SmartAvatar
                          src={member.avatar_url}
                          alt={member.full_name}
                          fallbackInitials={(member.full_name || member.email || "?")[0]}
                          className="h-10 w-10 rounded-full border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-slate-900 group-hover:underline truncate">
                            {member.full_name || "—"}
                          </h3>
                          <div className="text-[10px] font-mono text-slate-500 truncate">
                            {member.intern_id || member.employee_id || "ID: UNASSIGNED"}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider shrink-0 ${
                          member.role === "employee"
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-800 border border-slate-300"
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Department:</span>
                        <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                          {member.department || "General"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Position / Track:</span>
                        <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                          {member.position || (member.role === "employee" ? "Employee" : "Intern Associate")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Email:</span>
                        <span className="font-mono text-slate-600 truncate max-w-[170px]" title={member.email}>
                          {member.email}
                        </span>
                      </div>
                    </div>

                    {/* Mentor badge for Interns */}
                    {member.role === "intern" && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] flex items-center justify-between">
                        <span className="text-slate-500 font-mono text-[10px] uppercase">Assigned Mentor</span>
                        <span className="font-semibold text-slate-900 truncate max-w-[150px]">
                          {mentorDisplayName}
                        </span>
                      </div>
                    )}

                    {/* Fee Status Chips for Interns */}
                    {member.role === "intern" && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {member.exam_fee_paid ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white flex items-center gap-1 shadow-xs">
                            <Check className="h-3 w-3 text-white" />
                            Fee Verified (₹{member.exam_fee_amount || 199})
                          </span>
                        ) : member.is_fee_exempted ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                            Fee Exempted
                          </span>
                        ) : member.fee_payment_scheduled ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-700" />
                            Fee Scheduled (₹{member.exam_fee_amount || 199})
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-50 text-slate-400 border border-slate-200">
                            Fee Unscheduled
                          </span>
                        )}

                        {member.urgent_popup_active && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-white" />
                            Urgent Alert
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div
                    className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onSelectUser(member)}
                        className="h-8 px-2.5 text-xs font-semibold bg-slate-900 text-white hover:bg-black rounded-lg gap-1.5"
                      >
                        Manage Profile
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onResetPassword(member)}
                        title="Reset Account Password"
                        className="h-8 px-2 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg gap-1"
                      >
                        <Key className="h-3.5 w-3.5 text-slate-600" />
                        <span className="hidden sm:inline">Pass</span>
                      </Button>

                      {member.role === "intern" && !member.exam_fee_paid && !member.is_fee_exempted && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const loadingToast = toast.loading(`Sending payment reminder to ${member.email}...`);
                            try {
                              await sendPaymentReminderEmail({
                                data: {
                                  recipient_email: member.email,
                                  recipient_name: member.full_name,
                                  recipient_phone: member.phone || member.phone_number,
                                  intern_id: member.intern_id,
                                  exam_fee_amount:
                                    member.exam_fee_amount !== undefined ? member.exam_fee_amount : 199,
                                  payment_deadline: member.fee_payment_deadline,
                                },
                              });
                              toast.dismiss(loadingToast);
                              toast.success(`Payment reminder email sent to ${member.email}!`);
                            } catch (err: any) {
                              toast.dismiss(loadingToast);
                              toast.error("Failed to send reminder: " + err.message);
                            }
                          }}
                          title="Send Fee Reminder Email"
                          className="h-8 px-2 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg gap-1"
                        >
                          <Mail className="h-3.5 w-3.5 text-slate-600" />
                          <span className="hidden sm:inline">Reminder</span>
                        </Button>
                      )}
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-black hover:bg-slate-100 rounded-lg"
                          title="Revoke Access"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-slate-900" /> Revoke Account Access?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will immediately revoke access and permanently de-provision <strong>{member.full_name}</strong> ({member.email}). This operation is logged for ISO-27001 compliance.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onRevoke(member.id, member.full_name)}
                            className="bg-slate-900 text-white hover:bg-black"
                          >
                            Revoke Access
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ─── High-Density Table View ─── */
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] uppercase font-mono font-bold tracking-wider text-slate-700">
                  <th className="px-5 py-3">Associate Identity</th>
                  <th className="px-5 py-3">Institutional ID</th>
                  <th className="px-5 py-3">Role &amp; Track</th>
                  <th className="px-5 py-3">Functional Department</th>
                  <th className="px-5 py-3">Assigned Mentor</th>
                  <th className="px-5 py-3">Compliance / Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      No personnel match criteria
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => {
                    const assignedMentor =
                      member.mentor_id && team
                        ? team.find((t: any) => t.id === member.mentor_id || t.user_id === member.mentor_id)
                        : null;
                    const mentorDisplayName = assignedMentor
                      ? assignedMentor.full_name
                      : member.mentor_id
                      ? "Assigned Mentor"
                      : "Lead Mentor (Jami Eswar Anil Kumar)";

                    return (
                      <tr
                        key={member.id}
                        onClick={() => onSelectUser(member)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <SmartAvatar
                              src={member.avatar_url}
                              alt={member.full_name}
                              fallbackInitials={(member.full_name || "?")[0]}
                              className="h-8 w-8 rounded-full border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 group-hover:underline">
                                {member.full_name || "—"}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate font-mono">
                                {member.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-800">
                          {member.intern_id || member.employee_id || "—"}
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                              member.role === "employee"
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-800 border border-slate-300"
                            }`}
                          >
                            {member.role}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-xs text-slate-800">
                          {member.department || "General Operations"}
                        </td>

                        <td className="px-5 py-3.5 text-xs text-slate-700">
                          {member.role === "intern" ? mentorDisplayName : "—"}
                        </td>

                        <td className="px-5 py-3.5">
                          {member.role === "intern" ? (
                            member.exam_fee_paid ? (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white inline-flex items-center gap-1">
                                <Check className="h-3 w-3 text-white" /> Paid
                              </span>
                            ) : member.is_fee_exempted ? (
                              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                                Exempted
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-400">
                                Unpaid
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] font-mono text-slate-600 font-semibold">
                              Verified Staff
                            </span>
                          )}
                        </td>

                        <td
                          className="px-5 py-3.5 text-right space-x-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onResetPassword(member)}
                            className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
                            title="Reset Password"
                          >
                            <Key className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelectUser(member)}
                            className="h-7 px-2 text-xs text-slate-900 font-bold hover:bg-slate-100"
                          >
                            Manage
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Document Governance Modal (Offer Letters & NOCs) ─── */}
      <Dialog open={isDocGovernanceOpen} onOpenChange={setIsDocGovernanceOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold">
              <FileText className="h-5 w-5 text-slate-900" /> Document Governance &amp; Generation Vault
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Bulk generation, verification, and database reconciliation for all internship Offer Letters and No-Objection Certificates (NOCs).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Offer Letters Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Internship Offer Letters</h4>
                  <p className="text-xs text-slate-500">Regenerate all offer letters or purge expired artifacts.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  onClick={async () => {
                    if (confirm("Are you sure you want to regenerate offer letters for all interns?")) {
                      const lToast = toast.loading("Regenerating all Offer Letters...");
                      try {
                        const res = await bulkRegenerateOfferLetters();
                        toast.dismiss(lToast);
                        toast.success(res.message);
                        onRefresh();
                      } catch (e) {
                        toast.dismiss(lToast);
                        toast.error("Failed to regenerate offer letters.");
                      }
                    }
                  }}
                  className="bg-slate-900 text-white hover:bg-black text-xs font-semibold gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-white" /> Regenerate All Letters
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (confirm("Are you sure you want to completely delete all Offer Letters from database and storage?")) {
                      const lToast = toast.loading("Deleting all Offer Letters...");
                      try {
                        await bulkDeleteOfferLetters();
                        toast.dismiss(lToast);
                        toast.success("All Offer Letters deleted successfully!");
                        onRefresh();
                      } catch (e) {
                        toast.dismiss(lToast);
                        toast.error("Failed to delete offer letters.");
                      }
                    }
                  }}
                  className="border-slate-300 text-slate-800 hover:bg-slate-100 text-xs font-semibold gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5 text-slate-700" /> Purge All Letters
                </Button>
              </div>
            </div>

            {/* NOCs Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">No Objection Certificates (NOCs)</h4>
                  <p className="text-xs text-slate-500">Regenerate college-compliant NOC documents or purge records.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  onClick={async () => {
                    if (confirm("Are you sure you want to regenerate NOCs for all interns?")) {
                      const lToast = toast.loading("Regenerating all NOCs...");
                      try {
                        const res = await bulkRegenerateNocs();
                        toast.dismiss(lToast);
                        toast.success(res.message);
                        onRefresh();
                      } catch (e) {
                        toast.dismiss(lToast);
                        toast.error("Failed to regenerate NOCs.");
                      }
                    }
                  }}
                  className="bg-slate-900 text-white hover:bg-black text-xs font-semibold gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-white" /> Regenerate All NOCs
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (confirm("Are you sure you want to completely delete all NOCs from database and storage?")) {
                      const lToast = toast.loading("Deleting all NOCs...");
                      try {
                        await bulkDeleteNocs();
                        toast.dismiss(lToast);
                        toast.success("All NOCs deleted successfully!");
                        onRefresh();
                      } catch (e) {
                        toast.dismiss(lToast);
                        toast.error("Failed to delete NOCs.");
                      }
                    }
                  }}
                  className="border-slate-300 text-slate-800 hover:bg-slate-100 text-xs font-semibold gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5 text-slate-700" /> Purge All NOCs
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDocGovernanceOpen(false)}
              className="text-xs border-slate-200"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
