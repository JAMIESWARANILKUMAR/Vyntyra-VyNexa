import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Download, RefreshCw, CheckCircle2, Clock, 
  AlertCircle, ShieldCheck, UserX, Search, Filter, Sparkles, Loader2,
  UserCheck, BadgeCheck, User, Calendar, Check, ExternalLink, QrCode
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
  const [activeTab, setActiveTab] = useState<'mark' | 'roster'>(isHost ? 'roster' : 'mark');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [minDurationThreshold, setMinDurationThreshold] = useState<number>(5);

  // Participant self-marking fields
  const [selfInternId, setSelfInternId] = useState(currentUser?.internId || '');
  const [selfName, setSelfName] = useState(currentUser?.name || '');
  const [selfEmail, setSelfEmail] = useState(currentUser?.email || '');
  const [hasMarkedPresent, setHasMarkedPresent] = useState(false);

  // Sync tab with host status on modal open
  useEffect(() => {
    if (isOpen) {
      setActiveTab(isHost ? 'roster' : 'mark');
      if (currentUser?.internId) setSelfInternId(currentUser.internId);
      if (currentUser?.name) setSelfName(currentUser.name);
      if (currentUser?.email) setSelfEmail(currentUser.email);
    }
  }, [isOpen, isHost, currentUser]);

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

  // Participant Self Punch-In / Mark Attendance Action
  const handleSelfPunchIn = async () => {
    if (!selfName.trim()) {
      toast.error("Please enter your name to mark attendance");
      return;
    }

    setIsSubmitting(true);
    try {
      const participantId = `part_${(selfEmail || selfName).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
      const res = await recordMeetingTelemetryFn({
        data: {
          meetingId: roomId,
          participantId,
          userName: selfName.trim(),
          userEmail: selfEmail.trim() || undefined,
          internId: selfInternId.trim() || undefined,
          userType: selfInternId.trim() ? 'intern' : (currentUser?.userType || 'guest'),
          action: 'join',
          durationSeconds: 60,
          deviceMetadata: navigator?.userAgent ? navigator.userAgent.slice(0, 100) : 'Browser'
        }
      });

      if (res?.success) {
        setHasMarkedPresent(true);
        toast.success("Attendance marked as Present! Recorded on company roster.", {
          description: `Verified for ${selfName} ${selfInternId ? `(${selfInternId})` : ''}`,
          icon: '✓'
        });
        loadAttendance();
      } else {
        toast.error("Could not record attendance. Please try again.");
      }
    } catch (err) {
      console.warn("Error marking attendance:", err);
      toast.error("Network error while recording attendance");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pre-check if current user is already present in records
  const myRecord = records.find(r => 
    (currentUser?.email && r.user_email?.toLowerCase() === currentUser.email.toLowerCase()) ||
    (currentUser?.internId && r.intern_id === currentUser.internId) ||
    (currentUser?.name && r.user_name.toLowerCase() === currentUser.name.toLowerCase())
  );
  const isAlreadyPresent = Boolean(myRecord && myRecord.attendance_status === 'Present') || hasMarkedPresent;

  // Handle Manual Status Change
  const handleStatusChange = async (recordId: string, newStatus: 'Present' | 'Late' | 'Excused' | 'Absent') => {
    // Optimistic UI update
    setRecords(prev => prev.map(r => r.id === recordId ? { ...r, attendance_status: newStatus } : r));
    try {
      const res = await updateAttendanceStatusFn({
        data: {
          recordId,
          status: newStatus
        }
      });
      if (res.success) {
        toast.success(`Status updated to ${newStatus}`);
      } else {
        toast.error("Failed to persist status change");
      }
    } catch (_) {
      toast.error("Error updating status");
    }
  };

  // Run Automated Attendance Threshold Calculation
  const handleAutoEvaluate = () => {
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
    toast.success(`Evaluated attendance: marked ${updatedCount} attendees Present based on >${minDurationThreshold} min threshold.`);
  };

  // Filtered Records
  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.user_email && r.user_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.intern_id && r.intern_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.phone && r.phone.includes(searchQuery));

    const matchesFilter = filterStatus === 'all' || r.attendance_status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  // Calculate Summary Metrics
  const totalCount = records.length;
  const presentCount = records.filter(r => r.attendance_status === 'Present').length;
  const lateCount = records.filter(r => r.attendance_status === 'Late').length;
  const internCount = records.filter(r => r.intern_id || r.user_type === 'intern').length;

  // One-Click Excel / CSV Export with UTF-8 BOM
  const handleExportExcel = () => {
    if (records.length === 0) {
      toast.error("No attendance records to export yet.");
      return;
    }

    const headers = [
      "Meeting Title",
      "Room ID",
      "Date",
      "Intern ID",
      "Full Name",
      "Email Address",
      "Phone Number",
      "User Type",
      "Join Time (IST/UTC)",
      "Leave Time",
      "Total Minutes Attended",
      "Reconnections",
      "Final Attendance Status",
    ];

    const rows = records.map(r => {
      const durationMin = (r.duration_seconds / 60).toFixed(1);
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

    // Prepend UTF-8 BOM (\uFEFF) so Microsoft Excel opens it with perfect unicode and Indian fonts
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
                <span>Smart Attendance & Session Telemetry</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400 mt-1">
                Real-time tracking of attendee duration, intern recognition, and automated status evaluation.
              </DialogDescription>
            </div>

            {/* Excel Download CTA */}
            {activeTab === 'roster' && (
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

        {/* Tab Switcher: Mark My Attendance vs Complete Roster */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 my-2">
          <button
            onClick={() => setActiveTab('mark')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'mark'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 ring-1 ring-emerald-400/30'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Mark My Attendance</span>
            {isAlreadyPresent && (
              <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse"></span>
            )}
          </button>

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
        </div>

        {/* ═════════ TAB: MARK MY ATTENDANCE ═════════ */}
        {activeTab === 'mark' && (
          <div className="space-y-4 py-2">
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-black/90 via-[#0e1624] to-black/90 border border-emerald-500/30 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      Digital Meeting Attendance Punch-In
                    </h3>
                    <p className="text-xs text-gray-400">Official VCS Enterprise Meeting Presence Verification</p>
                  </div>
                </div>

                <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 self-start sm:self-auto ${
                  isAlreadyPresent 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${isAlreadyPresent ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
                  <span>{isAlreadyPresent ? '✓ Verified Present' : 'Pending Punch-In'}</span>
                </div>
              </div>

              {/* Form Inputs for Name, Intern ID, and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
                    Your Full Name
                  </label>
                  <Input
                    value={selfName}
                    onChange={(e) => setSelfName(e.target.value)}
                    placeholder="Enter your name"
                    className="h-10 bg-black/60 border-white/15 text-white text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
                    Intern ID / Employee Code
                  </label>
                  <Input
                    value={selfInternId}
                    onChange={(e) => setSelfInternId(e.target.value.toUpperCase())}
                    placeholder="e.g. VCS-INT-2024-001"
                    className="h-10 bg-black/60 border-white/15 text-white font-mono text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
                    Corporate / Verified Email
                  </label>
                  <Input
                    value={selfEmail}
                    onChange={(e) => setSelfEmail(e.target.value)}
                    placeholder="e.g. name@vyntyraconsultancyservices.in"
                    className="h-10 bg-black/60 border-white/15 text-white text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Punch-In CTA Box */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.03] p-4 rounded-2xl border border-white/10">
                <div>
                  <span className="text-sm font-bold text-white block">
                    {isAlreadyPresent ? "✓ Attendance Successfully Logged on Roster" : "Click below to confirm your presence for this session"}
                  </span>
                  <span className="text-xs text-gray-400">
                    Meeting ID: <span className="font-mono text-blue-400 font-semibold">#{roomId.slice(0, 8).toUpperCase()}</span> · Live session duration is tracked automatically
                  </span>
                </div>

                <Button
                  onClick={handleSelfPunchIn}
                  disabled={isSubmitting}
                  className={`h-11 px-6 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xl transition-all shrink-0 ${
                    isAlreadyPresent 
                      ? 'bg-emerald-600/80 hover:bg-emerald-600 text-white' 
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 hover:scale-[1.02]'
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <span>{isAlreadyPresent ? "Re-Confirm / Update Punch-In" : "Punch-In / Mark My Attendance"}</span>
                </Button>
              </div>

              {/* Verification Slip Information */}
              <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between text-gray-400">
                  <span>Session Title</span>
                  <span className="text-white font-semibold">{meetingTitle}</span>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span>Official Punch-In Seal</span>
                  <span className="font-mono text-emerald-400 font-bold">VCS-ATTENDANCE-{roomId.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span>Verification Guarantee</span>
                  <span className="text-emerald-300 font-medium flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    Encrypted Session Telemetry Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═════════ TAB: COMPLETE ROSTER ═════════ */}
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
