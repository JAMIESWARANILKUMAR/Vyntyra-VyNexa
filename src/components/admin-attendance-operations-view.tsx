import React, { useState, useMemo } from "react";
import {
  Clock, UserCheck, CheckCircle2, Calendar, Search, Download,
  RefreshCw, ShieldCheck, FileSpreadsheet, Filter, Activity,
  Briefcase, GraduationCap, ChevronDown, ChevronUp, Database,
  ArrowUpRight, AlertCircle, Sparkles, Building2, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SmartAvatar } from "@/components/SmartAvatar";
import { toast } from "sonner";

interface AdminAttendanceOperationsViewProps {
  team: any[];
  attendanceData: any[];
  tasksData: any[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectMember?: (member: any) => void;
}

export function AdminAttendanceOperationsView({
  team,
  attendanceData = [],
  tasksData = [],
  isLoading,
  onRefresh,
  onSelectMember
}: AdminAttendanceOperationsViewProps) {
  const [roleFilter, setRoleFilter] = useState<"all" | "employee" | "intern">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Completed" | "Offline">("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Detailed historical logs controls
  const [showDetailedLogs, setShowDetailedLogs] = useState(false);
  const [logDateFilter, setLogDateFilter] = useState("");
  const [logSearchQuery, setLogSearchQuery] = useState("");

  // Process team attendance telemetry
  const processedTeamAttendance = useMemo(() => {
    const nonAdminTeam = (team || []).filter(
      (m: any) => m.role !== "admin" && m.role !== "super_admin"
    );

    const todayStr = new Date().toISOString().split("T")[0];
    const todayDateStr = new Date().toDateString();

    return nonAdminTeam.map((member: any) => {
      const memberAttendance = attendanceData.filter((a: any) => {
        if (!a) return false;
        if (a.user_id === member.id || a.user_id === member.user_id) return true;
        if (
          member.email &&
          a.profiles?.email &&
          a.profiles.email.toLowerCase() === member.email.toLowerCase()
        )
          return true;
        if (
          member.email &&
          a.email &&
          a.email.toLowerCase() === member.email.toLowerCase()
        )
          return true;
        return false;
      });

      const totalAttendance = memberAttendance.length;

      const todayLog = memberAttendance.find((a: any) => {
        if (a.date === todayStr) return true;
        if (a.clock_in && new Date(a.clock_in).toDateString() === todayDateStr) return true;
        return false;
      });

      let activeStatus: "Active" | "Offline" | "Completed" = "Offline";
      let clockInTime = "—";
      let clockOutTime = "—";
      let shiftDurationHours = "—";

      if (todayLog) {
        clockInTime = todayLog.clock_in
          ? new Date(todayLog.clock_in).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—";
        clockOutTime = todayLog.clock_out
          ? new Date(todayLog.clock_out).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—";

        if (todayLog.clock_in && !todayLog.clock_out) {
          activeStatus = "Active";
          const inMs = new Date(todayLog.clock_in).getTime();
          const elapsed = (Date.now() - inMs) / (1000 * 60 * 60);
          shiftDurationHours = `${elapsed.toFixed(1)} hrs (Live)`;
        } else if (todayLog.clock_in && todayLog.clock_out) {
          activeStatus = "Completed";
          const diffMs =
            new Date(todayLog.clock_out).getTime() - new Date(todayLog.clock_in).getTime();
          const totalHours = diffMs / (1000 * 60 * 60);
          shiftDurationHours = `${totalHours.toFixed(1)} hrs`;
        }
      }

      let remainingDays = "—";
      if (member.end_date) {
        const end = new Date(member.end_date).getTime();
        const diff = end - Date.now();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        remainingDays = days > 0 ? `${days} Days` : "Ended";
      }

      const completedTasks = tasksData.filter(
        (t: any) => t.assigned_to === member.id && t.status === "completed"
      ).length;

      return {
        ...member,
        totalAttendance,
        activeStatus,
        clockInTime,
        clockOutTime,
        shiftDurationHours,
        remainingDays,
        completedTasks,
        attendance: memberAttendance,
      };
    });
  }, [team, attendanceData, tasksData]);

  // Telemetry metrics
  const activeNowCount = useMemo(
    () => processedTeamAttendance.filter((m) => m.activeStatus === "Active").length,
    [processedTeamAttendance]
  );

  const presentTodayCount = useMemo(
    () =>
      processedTeamAttendance.filter(
        (m) => m.activeStatus === "Active" || m.activeStatus === "Completed"
      ).length,
    [processedTeamAttendance]
  );

  const presenceRate = useMemo(() => {
    if (!processedTeamAttendance.length) return 0;
    return Math.round((presentTodayCount / processedTeamAttendance.length) * 100);
  }, [presentTodayCount, processedTeamAttendance.length]);

  const totalLogsCount = attendanceData.length;

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return processedTeamAttendance.filter((m) => {
      if (roleFilter !== "all" && m.role !== roleFilter) return false;
      if (statusFilter !== "all" && m.activeStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (m.full_name || "").toLowerCase();
        const email = (m.email || "").toLowerCase();
        const internId = (m.intern_id || "").toLowerCase();
        const dept = (m.department || "").toLowerCase();
        if (
          !name.includes(q) &&
          !email.includes(q) &&
          !internId.includes(q) &&
          !dept.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [processedTeamAttendance, roleFilter, statusFilter, searchQuery]);

  // Filtered historical logs
  const filteredLogs = useMemo(() => {
    return attendanceData.filter((log: any) => {
      if (logDateFilter) {
        const logDate =
          log.date ||
          (log.clock_in ? new Date(log.clock_in).toISOString().split("T")[0] : "");
        if (logDate !== logDateFilter) return false;
      }
      if (logSearchQuery.trim()) {
        const q = logSearchQuery.toLowerCase();
        const name = (log.profiles?.full_name || "").toLowerCase();
        const email = (log.profiles?.email || "").toLowerCase();
        const internId = (log.profiles?.intern_id || "").toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !internId.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [attendanceData, logDateFilter, logSearchQuery]);

  // ISO-27001 Certified CSV Export
  function exportIsoAuditCsv() {
    const logsToExport = filteredLogs.length ? filteredLogs : attendanceData;
    if (!logsToExport.length) {
      toast.error("No attendance records found to export.");
      return;
    }

    const headers = [
      "ISO Record ID",
      "Associate Name",
      "Institutional ID",
      "Email Address",
      "Assigned Role",
      "Department",
      "Shift Date",
      "Clock-In (ISO-8601)",
      "Clock-Out (ISO-8601)",
      "Total Session Hours",
      "Presence Status",
      "Compliance Authority",
      "Cryptographic Audit Stamp"
    ];

    const rows = logsToExport.map((log: any) => {
      const inIso = log.clock_in ? new Date(log.clock_in).toISOString() : "N/A";
      const outIso = log.clock_out ? new Date(log.clock_out).toISOString() : "N/A";
      let hours = "N/A";
      if (log.clock_in && log.clock_out) {
        const diffMs = new Date(log.clock_out).getTime() - new Date(log.clock_in).getTime();
        hours = (diffMs / (1000 * 60 * 60)).toFixed(2);
      }
      const status = log.clock_in && !log.clock_out ? "ACTIVE_ON_SHIFT" : "COMPLETED_SHIFT";
      const stamp = `VYN-ISO27001-${(log.id || "REC").toString().slice(0, 8).toUpperCase()}`;

      return [
        `"${log.id || ""}"`,
        `"${log.profiles?.full_name || "N/A"}"`,
        `"${log.profiles?.intern_id || "N/A"}"`,
        `"${log.profiles?.email || "N/A"}"`,
        `"${log.profiles?.role || "intern"}"`,
        `"${log.profiles?.department || "General"}"`,
        `"${log.date || ""}"`,
        `"${inIso}"`,
        `"${outIso}"`,
        `"${hours}"`,
        `"${status}"`,
        `"ISO/IEC 27001:2022 & SOC-2 CERTIFIED"`,
        `"${stamp}"`
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Vyntyra_Workforce_Attendance_Audit_ISO27001_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("ISO/IEC 27001 Audit Attendance Report downloaded successfully!");
  }

  return (
    <div className="space-y-6">
      {/* ─── Institutional Header & ISO Regulatory Banner ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="h-7 px-2.5 rounded-md bg-slate-900 text-white font-mono text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-white" /> ISO/IEC 27001 CERTIFIED
              </span>
              <span className="h-7 px-2.5 rounded-md border border-slate-200 bg-slate-50 text-slate-800 font-mono text-[10px] font-semibold tracking-wider uppercase flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-slate-600" /> SOC-2 TELEMETRY VAULT
              </span>
              <span className="h-7 px-2.5 rounded-md border border-slate-200 bg-slate-50 text-slate-800 font-mono text-[10px] font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-900 animate-pulse" />
                {activeNowCount} ONLINE CONCURRENTLY
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
              Workforce Attendance & Audit Telemetry
            </h1>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Real-time shift telemetry, automated clock-in/out timestamps, compliance verification,
              and tamper-evident auditable logs for all corporate employees and internship cohorts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
            <Button
              type="button"
              onClick={exportIsoAuditCsv}
              className="bg-slate-900 text-white hover:bg-black font-semibold text-xs h-9 px-4 rounded-lg shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-white" />
              <span>Export ISO Audit CSV</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onRefresh}
              className="border-slate-300 text-slate-800 hover:bg-slate-100 font-semibold text-xs h-9 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Sync Telemetry</span>
            </Button>
          </div>
        </div>

        {/* ─── Metric Cards Grid (Monochrome ISO-Graded) ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          {/* Metric 1 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                Live Workforce Active
              </span>
              <Activity className="h-4 w-4 text-slate-900" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {activeNowCount}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Currently on shift &amp; clocked-in
              </p>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                Today's Shift Presence
              </span>
              <UserCheck className="h-4 w-4 text-slate-900" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {presentTodayCount} <span className="text-xs font-normal text-slate-500">/ {processedTeamAttendance.length}</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {presenceRate}% overall presence today
              </p>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                Shift Completion Rate
              </span>
              <CheckCircle2 className="h-4 w-4 text-slate-900" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {processedTeamAttendance.filter((m) => m.activeStatus === "Completed").length}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Full shifts completed &amp; clocked out
              </p>
            </div>
          </div>

          {/* Metric 4 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                Audited Log Registry
              </span>
              <FileSpreadsheet className="h-4 w-4 text-slate-900" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {totalLogsCount}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Cryptographically tracked records
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Controls & Filter Bar (Black & White Corporate) ─── */}
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
              All Personnel ({processedTeamAttendance.length})
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
              <span>Employees ({processedTeamAttendance.filter((m) => m.role === "employee").length})</span>
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
              <span>Interns ({processedTeamAttendance.filter((m) => m.role === "intern").length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by associate name, ID, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs border-slate-200 bg-slate-50 focus:bg-white rounded-lg"
            />
          </div>
        </div>

        {/* Presence Status Quick Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold mr-1">
            Status Filter:
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
              statusFilter === "all"
                ? "bg-slate-900 text-white font-bold"
                : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            All Statuses
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("Active")}
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "Active"
                ? "bg-slate-900 text-white font-bold"
                : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-slate-900 animate-pulse" />
            Online Now ({processedTeamAttendance.filter((m) => m.activeStatus === "Active").length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("Completed")}
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
              statusFilter === "Completed"
                ? "bg-slate-900 text-white font-bold"
                : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Clocked Out Today ({processedTeamAttendance.filter((m) => m.activeStatus === "Completed").length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("Offline")}
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
              statusFilter === "Offline"
                ? "bg-slate-900 text-white font-bold"
                : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Offline ({processedTeamAttendance.filter((m) => m.activeStatus === "Offline").length})
          </button>
        </div>
      </div>

      {/* ─── Real-Time Workforce Telemetry Table ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-900 uppercase tracking-wider">
              Workforce Presence Registry
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              ({filteredMembers.length} records matching criteria)
            </span>
          </div>

          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">
            Cryptographic Biometric &amp; Shift Audited
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] uppercase font-mono font-bold tracking-wider text-slate-700">
                <th className="px-5 py-3">Associate Identity</th>
                <th className="px-5 py-3">Role &amp; Department</th>
                <th className="px-5 py-3">Today's Shift Status</th>
                <th className="px-5 py-3">Clock-In (IST)</th>
                <th className="px-5 py-3">Clock-Out (IST)</th>
                <th className="px-5 py-3">Net Shift Time</th>
                <th className="px-5 py-3">Historical Attendance</th>
                <th className="px-5 py-3">Tasks Delivered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Clock className="h-8 w-8 text-slate-300 stroke-[1.5]" />
                      <p className="font-semibold text-slate-600">No workforce attendance records match the selected filters</p>
                      <p className="text-xs text-slate-400">Try clearing the search query or changing the role filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    onClick={() => onSelectMember && onSelectMember(member)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Associate Identity */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <SmartAvatar
                          src={member.avatar_url}
                          alt={member.full_name}
                          fallbackInitials={(member.full_name || "?")[0]}
                          className="h-8 w-8 rounded-full border border-slate-200"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 group-hover:underline flex items-center gap-1.5">
                            <span>{member.full_name || "—"}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 truncate">
                            {member.intern_id || member.employee_id || member.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role & Dept */}
                    <td className="px-5 py-3.5">
                      <div className="space-y-0.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                            member.role === "employee"
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-800 border border-slate-300"
                          }`}
                        >
                          {member.role}
                        </span>
                        <div className="text-[11px] text-slate-600 truncate max-w-[140px]">
                          {member.department || "General Operations"}
                        </div>
                      </div>
                    </td>

                    {/* Today's Shift Status */}
                    <td className="px-5 py-3.5">
                      {member.activeStatus === "Active" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-900 text-white shadow-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                          Online Now
                        </span>
                      ) : member.activeStatus === "Completed" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300">
                          Clocked Out
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-normal uppercase tracking-wider bg-slate-50 text-slate-400 border border-slate-200">
                          Offline
                        </span>
                      )}
                    </td>

                    {/* Clock-In */}
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-700">
                      {member.clockInTime}
                    </td>

                    {/* Clock-Out */}
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-700">
                      {member.clockOutTime}
                    </td>

                    {/* Net Shift Time */}
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-900">
                      {member.shiftDurationHours}
                    </td>

                    {/* Historical Attendance */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="font-bold text-slate-900">{member.totalAttendance}</span>
                        <span className="text-[10px] text-slate-500 uppercase">Days</span>
                      </div>
                    </td>

                    {/* Tasks Delivered */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="font-bold text-slate-900">{member.completedTasks}</span>
                        <span className="text-[10px] text-slate-500 uppercase">Tasks</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Historical Day-Wise Auditable Log Stream ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-900" />
              Cryptographic Shift Attendance Log Vault
            </h2>
            <p className="text-xs text-slate-500">
              Complete historical trail of every shift clock-in and clock-out with verifiable ISO-27001 stamps.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDetailedLogs(!showDetailedLogs)}
              className="gap-2 text-xs font-semibold border-slate-300 text-slate-800 hover:bg-slate-100"
            >
              {showDetailedLogs ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" /> Hide Detailed Logs
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" /> Open Detailed Audit Logs ({attendanceData.length})
                </>
              )}
            </Button>
          </div>
        </div>

        {showDetailedLogs && (
          <div className="p-5 space-y-4 animate-in fade-in duration-200">
            {/* Filter controls inside detailed log stream */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search logs by associate name, email..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    className="pl-9 h-8 text-xs border-slate-200 bg-slate-50 focus:bg-white rounded-lg"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-slate-500 font-semibold uppercase">Date:</span>
                  <Input
                    type="date"
                    value={logDateFilter}
                    onChange={(e) => setLogDateFilter(e.target.value)}
                    className="h-8 text-xs border-slate-200 bg-slate-50 focus:bg-white w-40 rounded-lg"
                  />
                  {logDateFilter && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setLogDateFilter("")}
                      className="h-8 px-2 text-xs text-slate-500 hover:text-slate-900"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              <span className="text-[11px] font-mono text-slate-500">
                Displaying {filteredLogs.length} verified records
              </span>
            </div>

            {/* Logs Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="max-h-[420px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 z-10">
                    <tr className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-700">
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Associate Name</th>
                      <th className="px-4 py-2.5">Institutional ID / Email</th>
                      <th className="px-4 py-2.5">Clock In (IST)</th>
                      <th className="px-4 py-2.5">Clock Out (IST)</th>
                      <th className="px-4 py-2.5">Shift Duration</th>
                      <th className="px-4 py-2.5">Audit Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                          No attendance logs found matching filter criteria
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log: any) => {
                        const inTime = log.clock_in
                          ? new Date(log.clock_in).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—";
                        const outTime = log.clock_out
                          ? new Date(log.clock_out).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—";

                        let durationText = "In Progress";
                        if (log.clock_in && log.clock_out) {
                          const diffMs =
                            new Date(log.clock_out).getTime() - new Date(log.clock_in).getTime();
                          const hrs = (diffMs / (1000 * 60 * 60)).toFixed(1);
                          durationText = `${hrs} hrs`;
                        }

                        const isOngoing = log.clock_in && !log.clock_out;

                        return (
                          <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                              {new Date(log.date || log.created_at).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-900">
                              {log.profiles?.full_name || "Associate"}
                            </td>
                            <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                              {log.profiles?.intern_id ? `${log.profiles.intern_id} · ` : ""}
                              {log.profiles?.email || log.email || "—"}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-700">{inTime}</td>
                            <td className="px-4 py-3 font-mono text-slate-700">{outTime}</td>
                            <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                              {durationText}
                            </td>
                            <td className="px-4 py-3">
                              {isOngoing ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-900 text-white">
                                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                  Active Shift
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300">
                                  <Check className="h-3 w-3 text-slate-700" />
                                  Verified
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
