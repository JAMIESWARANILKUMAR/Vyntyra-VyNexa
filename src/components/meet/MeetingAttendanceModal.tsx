import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Download, RefreshCw, CheckCircle2, Clock, 
  AlertCircle, ShieldCheck, UserX, Search, Filter, Sparkles, Loader2,
  UserCheck, BadgeCheck, User, Calendar, Check, Lock, ShieldAlert
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getMeetingAttendanceFn, updateAttendanceStatusFn, recordMeetingTelemetryFn } from '@/lib/meetings.functions';

export interface AttendanceRecord {
  id: string;
  meeting_id: string;
  participant_id: string;
  user_email?: string | null;
  user_name: string;
  phone?: string | null;
  intern_id?: string | null;
  user_type?: string | null;
  join_time: string;
  leave_time?: string | null;
  duration_seconds: number;
  reconnection_count: number;
  attendance_status: 'Present' | 'Late' | 'Excused' | 'Absent';
  device_metadata?: string | null;
}

export function MeetingAttendanceModal({
  isOpen,
  onClose,
  roomId,
  meetingTitle,
  isHost = false,
  currentUser,
}: {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  meetingTitle: string;
  isHost?: boolean;
  currentUser?: {
    name?: string;
    email?: string;
    internId?: string | null;
    userType?: string | null;
  };
}) {
  // Determine if caller has HR or employee authority
  const isAuthorizedMarker = Boolean(
    isHost ||
    currentUser?.userType === 'admin' ||
    currentUser?.userType === 'employee' ||
    currentUser?.userType === 'super_host' ||
    (currentUser?.email && (
      currentUser.email.trim().toLowerCase() === 'hr@vyntyraconsultancyservices.in' ||
      currentUser.email.trim().toLowerCase().endsWith('@vyntyraconsultancyservices.in') ||
      currentUser.email.trim().toLowerCase().endsWith('@vcs.in')
    )) ||
    (currentUser?.name && currentUser.name.toLowerCase().includes('hr'))
  );

  const [activeTab, setActiveTab] = useState<'roster' | 'markIntern'>(isAuthorizedMarker ? 'roster' : 'roster');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [minDurationThreshold, setMinDurationThreshold] = useState<number>(5);

  // HR / Employee marking form state
  const [targetInternId, setTargetInternId] = useState('');
  const [targetAttendeeName, setTargetAttendeeName] = useState('');
  const [targetStatus, setTargetStatus] = useState<'Present' | 'Late' | 'Excused' | 'Absent'>('Present');

  // Fetch Attendance Records
  const loadAttendance = async () => {
    setIsLoading(true);
    try {
      const res = await getMeetingAttendanceFn({
        data: { meetingId: roomId }
      });
      if (res && res.records) {
        setRecords(res.records as AttendanceRecord[]);
      }
    } catch (err) {
      console.warn("Failed to load meeting attendance:", err);
      toast.error("Failed to load attendance logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAttendance();
    }
  }, [isOpen, roomId]);

  // Handle Status Change by HR / Employee
  const handleStatusChange = async (recordId: string, newStatus: 'Present' | 'Late' | 'Excused' | 'Absent') => {
    if (!isAuthorizedMarker) {
      toast.error("Unauthorized: Only HR and employee logins can mark attendance");
      return;
    }

    setRecords(prev => prev.map(r => r.id === recordId ? { ...r, attendance_status: newStatus } : r));
    try {
      const res = await updateAttendanceStatusFn({
        data: {
          recordId,
          status: newStatus
        }
      });
      if (res.success) {
        toast.success(`Attendee status updated to ${newStatus}`);
      } else {
        toast.error("Failed to persist status change");
      }
    } catch (_) {
      toast.error("Error updating status");
    }
  };

  // HR / Employee: Mark Attendance for a specific Intern or Attendee
  const handleHrMarkIntern = async () => {
    if (!isAuthorizedMarker) {
      toast.error("Only HR or Employee login emails can mark attendance.");
      return;
    }

    if (!targetAttendeeName.trim() && !targetInternId.trim()) {
      toast.error("Please provide the Intern ID or Attendee Name");
      return;
    }

    setIsSubmitting(true);
    try {
      // Find existing record if any
      const existing = records.find(r => 
        (targetInternId && r.intern_id?.toLowerCase() === targetInternId.toLowerCase()) ||
        (targetAttendeeName && r.user_name.toLowerCase() === targetAttendeeName.toLowerCase())
      );

      if (existing) {
        await handleStatusChange(existing.id, targetStatus);
      } else {
        const participantId = `part_${(targetInternId || targetAttendeeName).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
        await recordMeetingTelemetryFn({
          data: {
            meetingId: roomId,
            participantId,
            userName: targetAttendeeName.trim() || `Intern ${targetInternId}`,
            internId: targetInternId.trim() || undefined,
            userType: 'intern',
            action: 'join',
            durationSeconds: 120,
            deviceMetadata: 'HR Manual Record'
          }
        });
      }

      toast.success(`Attendance successfully logged for ${targetAttendeeName || targetInternId} as ${targetStatus}`);
      setTargetAttendeeName('');
      setTargetInternId('');
      loadAttendance();
    } catch (err) {
      toast.error("Error logging attendance");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Run Automated Attendance Threshold Calculation (>5 min duration)
  const handleAutoEvaluate = () => {
    if (!isAuthorizedMarker) {
      toast.error("Only HR or Employee accounts can execute auto-evaluation");
      return;
    }

    let updatedCount = 0;
    setRecords(prev => prev.map(r => {
      const minutes = Math.round(r.duration_seconds / 60);
      if (minutes >= minDurationThreshold && r.attendance_status !== 'Present') {
        updatedCount++;
        handleStatusChange(r.id, 'Present');
        return { ...r, attendance_status: 'Present' };
      }
      return r;
    }));
    toast.success(`Evaluated: ${updatedCount} attendees marked Present (>5 min threshold)`);
  };

  // Filtered List
  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.user_email && r.user_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.intern_id && r.intern_id.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || r.attendance_status.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Calculate Metrics
  const totalCount = records.length;
  const presentCount = records.filter(r => r.attendance_status === 'Present').length;
  const internCount = records.filter(r => Boolean(r.intern_id || r.user_type === 'intern')).length;
  const lateCount = records.filter(r => r.attendance_status === 'Late' || r.attendance_status === 'Excused').length;

  // Find personal record for Intern/User view
  const myRecord = records.find(r => 
    (currentUser?.email && r.user_email?.toLowerCase() === currentUser.email.toLowerCase()) ||
    (currentUser?.internId && r.intern_id === currentUser.internId) ||
    (currentUser?.name && r.user_name.toLowerCase() === currentUser.name.toLowerCase())
  );

  // Export to Excel / CSV
  const handleExportExcel = () => {
    if (records.length === 0) {
      toast.info("No attendance records to export yet.");
      return;
    }

    const headers = [
      "Meeting Title", "Room ID", "Date", "Intern ID", "Attendee Name", 
      "Email Address", "Phone", "Role", "Join Time", "Leave Time", 
      "Active Duration (Minutes)", "Reconnection Count", "Attendance Status"
    ];

    const rows = records.map(r => {
      const durationMin = Math.round(r.duration_seconds / 60);
      const joinStr = new Date(r.join_time).toLocaleString("en-US");
      const leaveStr = r.leave_time ? new Date(r.leave_time).toLocaleString("en-US") : "Still In Call";
      
      return [
        `"${meetingTitle.replace(/"/g, '""')}"`,
        `"${roomId}"`,
        `"${new Date().toLocaleDateString('en-US')}"`,
        `"${r.intern_id || 'N/A'}"`,
        `"${r.user_name.replace(/"/g, '""')}"`,
        `"${r.user_email || 'N/A'}"`,
        `"${r.phone || 'N/A'}"`,
        `"${r.user_type || 'Guest'}"`,
        `"${joinStr}"`,
        `"${leaveStr}"`,
        `"${durationMin}"`,
        `"${r.reconnection_count || 1}"`,
        `"${r.attendance_status}"`,
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTitle = (meetingTitle || "Meeting").replace(/[^a-zA-Z0-9_-]/g, "_");
    const dateStr = new Date().toISOString().split("T")[0];
    
    link.href = url;
    link.setAttribute("download", `Attendance_${safeTitle}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Excel Attendance Report (.csv) downloaded successfully!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl bg-[#0e1118]/98 backdrop-blur-2xl border-white/15 text-white rounded-3xl p-6 shadow-2xl font-sans max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
                <span>{isAuthorizedMarker ? "Smart Attendance & Session Telemetry" : "Meeting Attendance Verification"}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400 mt-1">
                {isAuthorizedMarker 
                  ? "HR & Employee Portal: Mark attendee statuses, monitor duration, and export verified records."
                  : "Attendance is recorded and verified by HR Management. Interns and participants cannot self-mark attendance."}
              </DialogDescription>
            </div>

            {/* Excel Download CTA (HR & Employees only) */}
            {isAuthorizedMarker && (
              <Button
                onClick={handleExportExcel}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-10 px-4 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 shrink-0 transition-transform hover:scale-[1.02]"
              >
                <Download className="h-4 w-4" />
                <span>Export to Excel (.csv)</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* ═══════════════════════════════════════════════════════════════════
            VIEW A: PARTICIPANT / INTERN READ-ONLY ATTENDANCE STATUS
            (Interns and regular users CANNOT mark attendance!)
           ═══════════════════════════════════════════════════════════════════ */}
        {!isAuthorizedMarker ? (
          <div className="space-y-4 my-2">
            
            {/* Policy Enforcement Notice */}
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-xs text-amber-200">
              <Lock className="h-5 w-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-amber-300 block">Attendance Authority Policy</span>
                <span className="text-amber-200/90 text-[11px]">
                  Only HR Management (<code className="font-mono text-amber-300">hr@vyntyraconsultancyservices.in</code>) and authorized VCS employee logins have permission to mark or modify attendance. Interns and general participants cannot mark attendance themselves.
                </span>
              </div>
            </div>

            {/* Personal Verified Telemetry Card */}
            <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Your Session Attendance Status</h4>
                    <span className="text-[11px] text-gray-400">Recorded via automated connection telemetry</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  myRecord?.attendance_status === 'Present'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : myRecord?.attendance_status === 'Late'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${
                    myRecord?.attendance_status === 'Present' ? 'bg-emerald-400 animate-ping' : 'bg-blue-400'
                  }`}></span>
                  <span>{myRecord ? `Status: ${myRecord.attendance_status}` : 'Awaiting HR Verification'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-400 block uppercase font-bold">Attendee Name</span>
                  <span className="font-semibold text-white truncate block mt-0.5">
                    {currentUser?.name || "Participant"}
                  </span>
                </div>

                <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-400 block uppercase font-bold">Intern ID</span>
                  <span className="font-mono text-blue-400 font-bold block mt-0.5">
                    {currentUser?.internId || "Not Registered"}
                  </span>
                </div>

                <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-400 block uppercase font-bold">Active Call Time</span>
                  <span className="font-mono text-emerald-400 font-bold block mt-0.5">
                    {myRecord ? `${Math.round(myRecord.duration_seconds / 60)} min` : "Active now"}
                  </span>
                </div>

                <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-400 block uppercase font-bold">Verified By</span>
                  <span className="text-gray-300 font-medium block mt-0.5">HR Management</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] text-gray-400 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Your continuous presence and active minutes are securely logged. HR Management will review and finalize the roster at session conclusion.</span>
              </div>
            </div>

          </div>
        ) : (

        /* ═══════════════════════════════════════════════════════════════════
            VIEW B: HR MANAGEMENT & EMPLOYEE ATTENDANCE PORTAL
            (Full authority to mark attendance, edit statuses & auto-evaluate)
           ═══════════════════════════════════════════════════════════════════ */
          <div>
            {/* Tab Navigation for HR / Employees */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 my-2">
              <button
                onClick={() => setActiveTab('roster')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === 'roster'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 ring-1 ring-blue-400/30'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Company Attendance Roster ({totalCount})</span>
              </button>

              <button
                onClick={() => setActiveTab('markIntern')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === 'markIntern'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 ring-1 ring-emerald-400/30'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <UserCheck className="h-4 w-4" />
                <span>Mark Attendance for Intern / Attendee</span>
              </button>
            </div>

            {/* TAB: HR MARK INTERN ATTENDANCE FORM */}
            {activeTab === 'markIntern' && (
              <div className="p-5 rounded-3xl bg-black/60 border border-emerald-500/30 my-3 space-y-4">
                <div className="border-b border-white/10 pb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-emerald-400" />
                    HR / Employee Manual Attendance Logging
                  </h4>
                  <p className="text-xs text-gray-400">Directly mark or update an intern's status on the official roster</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
                      Intern ID
                    </label>
                    <Input
                      value={targetInternId}
                      onChange={e => setTargetInternId(e.target.value.toUpperCase())}
                      placeholder="e.g. VCS-INT-2024-001"
                      className="h-10 bg-black/60 border-white/15 text-white font-mono text-xs rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
                      Attendee Name
                    </label>
                    <Input
                      value={targetAttendeeName}
                      onChange={e => setTargetAttendeeName(e.target.value)}
                      placeholder="Full Name"
                      className="h-10 bg-black/60 border-white/15 text-white text-xs rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
                      Mark Status As
                    </label>
                    <select
                      value={targetStatus}
                      onChange={e => setTargetStatus(e.target.value as any)}
                      className="w-full h-10 bg-black/60 border border-white/15 text-white text-xs rounded-xl px-3 outline-none focus:border-blue-500"
                    >
                      <option value="Present">Present (Verified)</option>
                      <option value="Late">Late (Tardy)</option>
                      <option value="Excused">Excused Leave</option>
                      <option value="Absent">Absent</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-gray-400">
                    Will update existing records or insert new attendance record under this session.
                  </span>
                  <Button
                    onClick={handleHrMarkIntern}
                    disabled={isSubmitting}
                    className="h-10 px-5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-600/25"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    <span>Confirm & Mark Attendance</span>
                  </Button>
                </div>
              </div>
            )}

            {/* TAB: FULL COMPANY ATTENDANCE ROSTER */}
            {activeTab === 'roster' && (
              <div>
                {/* Summary Metric Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3">
                  <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Total Attendees</span>
                    <span className="text-xl font-bold text-white mt-1 block">{totalCount}</span>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">Present</span>
                    <span className="text-xl font-bold text-emerald-300 mt-1 block">{presentCount}</span>
                  </div>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-blue-400 block tracking-wider">Verified Interns</span>
                    <span className="text-xl font-bold text-blue-300 mt-1 block">{internCount}</span>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">Late / Excused</span>
                    <span className="text-xl font-bold text-amber-300 mt-1 block">{lateCount}</span>
                  </div>
                </div>

                {/* Controls Bar: Search, Filters & Automated Evaluation */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-black/40 border border-white/10 rounded-2xl mb-4">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="relative flex-1">
                      <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search by name, email, or Intern ID..."
                        className="h-8 pl-8 bg-black/60 border-white/10 text-white text-xs rounded-xl"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                      className="h-8 bg-black/60 border border-white/10 rounded-xl px-2.5 text-xs text-white focus:outline-none"
                    >
                      <option value="all">All Statuses</option>
                      <option value="present">Present</option>
                      <option value="late">Late</option>
                      <option value="excused">Excused</option>
                      <option value="absent">Absent</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAutoEvaluate}
                      className="h-8 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs rounded-xl flex items-center gap-1.5"
                      title="Automatically mark present for attendees with >5 min active duration"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                      <span>Auto-Mark Present (&gt;5m)</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={loadAttendance}
                      className="h-8 px-2.5 text-gray-400 hover:text-white"
                      title="Refresh"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>

                {/* Attendance Records Table */}
                <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/30">
                  <div className="overflow-x-auto max-h-80">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 border-b border-white/10 text-gray-400 uppercase text-[10px] tracking-wider sticky top-0 backdrop-blur-md">
                        <tr>
                          <th className="py-2.5 px-3">Attendee</th>
                          <th className="py-2.5 px-3">Intern ID / Org</th>
                          <th className="py-2.5 px-3">Join Time</th>
                          <th className="py-2.5 px-3">Duration</th>
                          <th className="py-2.5 px-3">Re-joins</th>
                          <th className="py-2.5 px-3 text-right">Attendance Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {isLoading && records.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-gray-400">
                              <Loader2 className="h-6 w-6 animate-spin text-blue-400 mx-auto mb-2" />
                              Loading live attendance telemetry...
                            </td>
                          </tr>
                        ) : filteredRecords.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-gray-400">
                              No attendee telemetry recorded yet.
                            </td>
                          </tr>
                        ) : (
                          filteredRecords.map((r) => {
                            const minutes = Math.round(r.duration_seconds / 60);
                            const isVerified = Boolean(r.intern_id || r.user_type === 'intern' || r.user_type === 'employee');

                            return (
                              <tr key={r.id} className="hover:bg-white/5 transition-colors">
                                <td className="py-2.5 px-3">
                                  <div className="font-semibold text-white flex items-center gap-1.5">
                                    <span>{r.user_name}</span>
                                    {isVerified && (
                                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-mono">
                                        Verified
                                      </span>
                                    )}
                                  </div>
                                  {r.user_email && (
                                    <span className="text-[10px] text-gray-400 block font-mono">
                                      {r.user_email}
                                    </span>
                                  )}
                                </td>

                                <td className="py-2.5 px-3">
                                  {r.intern_id ? (
                                    <span className="font-mono text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 text-[11px]">
                                      {r.intern_id}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-[11px]">External Guest</span>
                                  )}
                                </td>

                                <td className="py-2.5 px-3 text-gray-300 font-mono text-[11px]">
                                  {new Date(r.join_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>

                                <td className="py-2.5 px-3">
                                  <span className="font-semibold text-white font-mono text-xs">
                                    {minutes} min
                                  </span>
                                </td>

                                <td className="py-2.5 px-3 text-gray-400 font-mono text-[11px]">
                                  {r.reconnection_count}x
                                </td>

                                <td className="py-2.5 px-3 text-right">
                                  <select
                                    value={r.attendance_status}
                                    onChange={(e) => handleStatusChange(r.id, e.target.value as any)}
                                    className={`h-7 rounded-lg px-2 text-[11px] font-semibold focus:outline-none border ${
                                      r.attendance_status === 'Present'
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                        : r.attendance_status === 'Late'
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                        : r.attendance_status === 'Excused'
                                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                    }`}
                                  >
                                    <option value="Present" className="bg-slate-900 text-white">Present</option>
                                    <option value="Late" className="bg-slate-900 text-white">Late</option>
                                    <option value="Excused" className="bg-slate-900 text-white">Excused</option>
                                    <option value="Absent" className="bg-slate-900 text-white">Absent</option>
                                  </select>
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
        )}

        <div className="pt-3 flex items-center justify-between text-xs text-gray-400">
          <span>* Telemetry duration accumulates active participant minutes across reconnects.</span>
          <Button
            onClick={onClose}
            className="bg-[#0b5cff] hover:bg-[#094bdd] text-white text-xs rounded-xl h-9 px-5 font-semibold"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
