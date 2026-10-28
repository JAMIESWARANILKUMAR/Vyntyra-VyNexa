import React, { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { 
  Sparkles, Users, Award, Clock, Search, Filter, Eye, ShieldCheck, 
  UserCheck, AlertCircle, Calendar, Plus, RefreshCw, CheckCircle2, 
  ExternalLink, ArrowUpRight, BarChart3, TrendingUp, Radio, Laptop, 
  ShieldAlert, Settings, FileSpreadsheet, Lock, Mic
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  listAdminMockSessionsFn, 
  assignUserRoleFn, 
  listManageableUsersFn,
  scheduleMockInterviewFn,
  INTERVIEW_DOMAINS 
} from '@/lib/mock-interview.functions';
import { supabase } from '@/integrations/supabase/client';
import { AdminVoiceTrainingStudio } from '@/components/interview/AdminVoiceTrainingStudio';

export const Route = createFileRoute('/_authenticated/admin/interviews')({
  component: AdminMockInterviewsDashboard
});

function AdminMockInterviewsDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const listAdminSessions = useServerFn(listAdminMockSessionsFn);
  const listUsers = useServerFn(listManageableUsersFn);
  const assignRole = useServerFn(assignUserRoleFn);
  const scheduleSession = useServerFn(scheduleMockInterviewFn);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<'sessions' | 'users' | 'scheduler' | 'voice_studio'>('sessions');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Role Assignment Modal State
  const [roleModalUser, setRoleModalUser] = useState<any | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<'super_admin' | 'admin' | 'employee' | 'candidate'>('employee');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // New Interview Scheduling Form State
  const [schedCandidateName, setSchedCandidateName] = useState('');
  const [schedCandidateEmail, setSchedCandidateEmail] = useState('');
  const [schedInternId, setSchedInternId] = useState('');
  const [schedDomain, setSchedDomain] = useState('fullstack');
  const [schedDifficulty, setSchedDifficulty] = useState<'junior' | 'mid' | 'senior'>('mid');
  const [schedDate, setSchedDate] = useState('');
  const [schedMentorName, setSchedMentorName] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  // 1. Fetch Admin Sessions & Metrics
  const { data: adminData, isLoading: isLoadingSessions, refetch: refetchSessions } = useQuery({
    queryKey: ['admin_mock_sessions', statusFilter, deptFilter, searchQuery],
    queryFn: () => listAdminSessions({
      data: {
        status: statusFilter,
        department: deptFilter,
        search: searchQuery || undefined
      }
    }),
    refetchInterval: 10000 // Real-time 10s polling for live monitoring
  });

  // 2. Fetch Users for User Hub
  const { data: usersData, isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['manageable_users'],
    queryFn: () => listUsers({ data: {} }),
    enabled: activeTab === 'users'
  });

  // Handle Role Assignment
  const handleAssignRoleSubmit = async () => {
    if (!roleModalUser) return;
    setIsUpdatingRole(true);
    try {
      await assignRole({
        data: {
          targetUserId: roleModalUser.id,
          targetEmail: roleModalUser.email,
          targetName: roleModalUser.full_name,
          newRole: selectedNewRole,
          callerRole: 'super_admin'
        }
      });
      toast.success(`Role for ${roleModalUser.full_name || roleModalUser.email} updated to ${selectedNewRole}`);
      setRoleModalUser(null);
      refetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update user role");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Handle Schedule Interview Submit
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedCandidateName.trim() || !schedCandidateEmail.trim() || !schedDate) {
      toast.error("Please fill in candidate name, email, and scheduled date/time.");
      return;
    }

    setIsScheduling(true);
    try {
      await scheduleSession({
        data: {
          candidateName: schedCandidateName.trim(),
          candidateEmail: schedCandidateEmail.trim(),
          internId: schedInternId.trim() || undefined,
          domain: schedDomain,
          targetRole: INTERVIEW_DOMAINS.find(d => d.id === schedDomain)?.recommendedRole || 'Full-Stack Software Engineer',
          difficulty: schedDifficulty,
          scheduledAt: new Date(schedDate).toISOString(),
          mentorName: schedMentorName.trim() || undefined,
          callerRole: 'admin'
        }
      });
      toast.success(`Mock interview scheduled for ${schedCandidateName}!`);
      setSchedCandidateName('');
      setSchedCandidateEmail('');
      setSchedInternId('');
      setSchedDate('');
      setSchedMentorName('');
      setActiveTab('sessions');
      refetchSessions();
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule interview");
    } finally {
      setIsScheduling(false);
    }
  };

  const metrics = adminData?.metrics || {
    totalInterviews: 0,
    activeSessions: 0,
    scheduledSessions: 0,
    averageScore: 0,
    hireRatePercent: 0
  };

  return (
    <div className="min-h-screen bg-[#07090f] text-white font-sans p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* ─── Breadcrumb & Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Link to="/admin" className="hover:text-white transition-colors">Admin Hub</Link>
            <span>/</span>
            <span className="text-blue-400 font-semibold">AI Mock Interviews (RBAC)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="h-6 w-6 text-blue-400" />
            Super Admin &amp; Admin Interview Control Center
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Institutional oversight: real-time session audit, user role assignment, and multi-department analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setActiveTab('voice_studio')}
            className="h-9 px-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
          >
            <Mic className="h-4 w-4" />
            <span>Voice Studio &amp; Training</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setActiveTab('scheduler')}
            className="h-9 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-600/25"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule Interview</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => { refetchSessions(); refetchUsers(); }}
            className="h-9 px-3 rounded-xl border-white/15 text-gray-300 hover:text-white hover:bg-white/10 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ─── KPI Overview Analytics Grid ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#0c101c] border border-white/10 space-y-1">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Sessions</span>
          <div className="text-2xl font-black text-white">{metrics.totalInterviews}</div>
          <span className="text-[11px] text-gray-400">All departments</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c101c] border border-emerald-500/30 space-y-1 shadow-lg shadow-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Active Live</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="text-2xl font-black text-emerald-300">{metrics.activeSessions}</div>
          <span className="text-[11px] text-emerald-400/80">In-progress rooms</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c101c] border border-white/10 space-y-1">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Scheduled Ahead</span>
          <div className="text-2xl font-black text-blue-400">{metrics.scheduledSessions}</div>
          <span className="text-[11px] text-gray-400">Upcoming queue</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c101c] border border-white/10 space-y-1">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Avg Platform Score</span>
          <div className="text-2xl font-black text-indigo-300">{metrics.averageScore}%</div>
          <span className="text-[11px] text-gray-400">Evaluated candidates</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c101c] border border-white/10 space-y-1">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Bar Raiser Pass Rate</span>
          <div className="text-2xl font-black text-purple-300">{metrics.hireRatePercent}%</div>
          <span className="text-[11px] text-gray-400">"Hire" or "Strong Hire"</span>
        </div>
      </div>

      {/* ─── Tabs Navigation ─── */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'sessions'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Radio className="h-4 w-4" />
          <span>Global Monitoring Grid</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>User Role Assignment Hub</span>
        </button>

        <button
          onClick={() => setActiveTab('scheduler')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'scheduler'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Schedule Candidate Interview</span>
        </button>

        <button
          onClick={() => setActiveTab('voice_studio')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'voice_studio'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Mic className="h-4 w-4" />
          <span>AI Voice Training Studio</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 1: GLOBAL MONITORING GRID
         ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'sessions' && (
        <div className="rounded-3xl bg-[#0c101c] border border-white/10 p-5 space-y-4 shadow-2xl">
          
          {/* Grid Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-3" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search candidate name, email, or role..."
                className="h-9 pl-9 bg-black/50 border-white/15 text-white text-xs rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="h-9 px-3 bg-black/50 border border-white/15 text-white text-xs rounded-xl focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="in_progress">Active / Live Rooms</option>
                <option value="scheduled">Scheduled Queue</option>
                <option value="completed">Completed Evaluations</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="h-9 px-3 bg-black/50 border border-white/15 text-white text-xs rounded-xl focus:outline-none"
              >
                <option value="all">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="AI / ML">AI / ML Track</option>
                <option value="Product">Product &amp; Systems</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121727] text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Candidate &amp; ID</th>
                  <th className="py-3 px-4">Role &amp; Domain</th>
                  <th className="py-3 px-4">Scheduled / Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Overall Score</th>
                  <th className="py-3 px-4 text-right">Audit &amp; Observer Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoadingSessions ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      Loading session logs...
                    </td>
                  </tr>
                ) : !adminData?.sessions || adminData.sessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No matching interview sessions found.
                    </td>
                  </tr>
                ) : (
                  adminData.sessions.map((sess: any) => {
                    const isLive = sess.status === 'in_progress';

                    return (
                      <tr key={sess.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-white block">{sess.candidate_name}</span>
                          <span className="text-[10px] text-gray-400 block font-mono">
                            {sess.intern_id || sess.candidate_email || 'General User'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-gray-200 block">{sess.target_role}</span>
                          <span className="text-[10px] text-blue-400 font-mono capitalize">
                            {sess.domain?.replace('_', ' ')} • {sess.difficulty}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-gray-300 font-mono text-[11px]">
                          {sess.scheduled_at 
                            ? new Date(sess.scheduled_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                            : new Date(sess.created_at).toLocaleDateString()}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono inline-flex items-center gap-1.5 ${
                            isLive 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm animate-pulse'
                              : sess.status === 'scheduled'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : sess.status === 'completed'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {isLive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                            <span>{sess.status?.toUpperCase()}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {sess.overall_score ? (
                            <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              {sess.overall_score}% ({sess.hiring_verdict || 'Reviewed'})
                            </span>
                          ) : (
                            <span className="text-gray-500 font-mono text-[11px]">Pending</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right space-x-2">
                          {isLive ? (
                            <Button
                              size="sm"
                              onClick={() => window.open(`/interview/${sess.id}?observer=true`, '_blank')}
                              className="h-7 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] rounded-lg shadow-sm"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> Join as Observer
                            </Button>
                          ) : sess.status === 'completed' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate({ to: `/interview/report/${sess.id}` })}
                              className="h-7 px-2.5 border-white/15 text-blue-400 hover:text-white hover:bg-blue-600 rounded-lg text-[11px]"
                            >
                              View Debrief
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate({ to: `/interview/${sess.id}` })}
                              className="h-7 px-2.5 border-white/15 text-gray-300 hover:text-white rounded-lg text-[11px]"
                            >
                              Manage Session
                            </Button>
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
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 2: USER ROLE ASSIGNMENT HUB (SUPER ADMIN / ADMIN)
         ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'users' && (
        <div className="rounded-3xl bg-[#0c101c] border border-white/10 p-5 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Staff &amp; User Role Management
              </h3>
              <p className="text-xs text-gray-400">Promote users to Super Admin, Admin, or Employee (Mentor) tiers</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121727] text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Current Role</th>
                  <th className="py-3 px-4 text-right">Assign Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoadingUsers ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">Loading user directory...</td>
                  </tr>
                ) : !usersData?.users || usersData.users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">No users found.</td>
                  </tr>
                ) : (
                  usersData.users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{u.full_name || "VCS Member"}</td>
                      <td className="py-3 px-4 font-mono text-gray-300">{u.email}</td>
                      <td className="py-3 px-4 text-gray-400">{u.department || "Engineering"}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          u.role === 'super_admin'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : u.role === 'admin'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : u.role === 'employee'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                        }`}>
                          {u.role || 'candidate'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            setRoleModalUser(u);
                            setSelectedNewRole(u.role || 'employee');
                          }}
                          className="h-7 px-3 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs"
                        >
                          Change Role
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 3: SCHEDULE INTERVIEW FOR CANDIDATE
         ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'scheduler' && (
        <div className="max-w-2xl mx-auto rounded-3xl bg-[#0c101c] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              Schedule Mock Interview for Candidate
            </h3>
            <p className="text-xs text-gray-400 mt-1">Assign curriculum, track, scheduled date/time, and mentor</p>
          </div>

          <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-300 uppercase block mb-1">Candidate Name *</label>
                <Input
                  value={schedCandidateName}
                  onChange={e => setSchedCandidateName(e.target.value)}
                  placeholder="e.g. Jordan Lee"
                  required
                  className="h-10 bg-black/50 border-white/15 text-white rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-300 uppercase block mb-1">Candidate Email *</label>
                <Input
                  type="email"
                  value={schedCandidateEmail}
                  onChange={e => setSchedCandidateEmail(e.target.value)}
                  placeholder="candidate@example.com"
                  required
                  className="h-10 bg-black/50 border-white/15 text-white rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-300 uppercase block mb-1">Intern ID (Optional)</label>
                <Input
                  value={schedInternId}
                  onChange={e => setSchedInternId(e.target.value.toUpperCase())}
                  placeholder="VCS-INT-2024-..."
                  className="h-10 bg-black/50 border-white/15 text-white rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-300 uppercase block mb-1">Assigned Mentor Name</label>
                <Input
                  value={schedMentorName}
                  onChange={e => setSchedMentorName(e.target.value)}
                  placeholder="e.g. Staff Mentor John"
                  className="h-10 bg-black/50 border-white/15 text-white rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-300 uppercase block mb-1">Domain Track</label>
                <select
                  value={schedDomain}
                  onChange={e => setSchedDomain(e.target.value)}
                  className="w-full h-10 px-3 bg-black/50 border border-white/15 text-white rounded-xl text-xs focus:outline-none"
                >
                  {INTERVIEW_DOMAINS.map(d => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-300 uppercase block mb-1">Difficulty</label>
                <select
                  value={schedDifficulty}
                  onChange={e => setSchedDifficulty(e.target.value as any)}
                  className="w-full h-10 px-3 bg-black/50 border border-white/15 text-white rounded-xl text-xs focus:outline-none font-mono"
                >
                  <option value="junior">Junior</option>
                  <option value="mid">Mid-Level</option>
                  <option value="senior">Senior</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-300 uppercase block mb-1">Scheduled Date &amp; Time *</label>
              <Input
                type="datetime-local"
                value={schedDate}
                onChange={e => setSchedDate(e.target.value)}
                required
                className="h-10 bg-black/50 border-white/15 text-white rounded-xl text-xs font-mono"
              />
            </div>

            <Button
              type="submit"
              disabled={isScheduling}
              className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              <span>{isScheduling ? "Generating Curriculum & Scheduling..." : "Confirm & Schedule Interview"}</span>
            </Button>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 4: AI VOICE STUDIO & CUSTOM VOICE TRAINING
         ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'voice_studio' && (
        <AdminVoiceTrainingStudio />
      )}

      {/* ─── Role Assignment Dialog ─── */}
      <Dialog open={Boolean(roleModalUser)} onOpenChange={() => setRoleModalUser(null)}>
        <DialogContent className="sm:max-w-md bg-[#0e1118]/98 backdrop-blur-2xl border-white/15 text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-400" />
              Assign User Role
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              Select tier permissions for <strong className="text-white">{roleModalUser?.full_name || roleModalUser?.email}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            {(['super_admin', 'admin', 'employee', 'candidate'] as const).map(roleOption => (
              <label
                key={roleOption}
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedNewRole === roleOption
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                    : 'bg-black/40 border-white/10 text-gray-300 hover:bg-white/5'
                }`}
              >
                <div>
                  <span className="font-bold text-xs uppercase font-mono block text-white">{roleOption.replace('_', ' ')}</span>
                  <span className="text-[10px] text-gray-400">
                    {roleOption === 'super_admin' && "Global control, role assignment, live observer, platform analytics"}
                    {roleOption === 'admin' && "Departmental management, template creation, live monitor, reports"}
                    {roleOption === 'employee' && "Mentor scheduler, review assigned candidate reports, add grades"}
                    {roleOption === 'candidate' && "Access scheduled sessions, take interviews, view personal report"}
                  </span>
                </div>
                <input
                  type="radio"
                  name="user_role"
                  checked={selectedNewRole === roleOption}
                  onChange={() => setSelectedNewRole(roleOption)}
                  className="accent-blue-500"
                />
              </label>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRoleModalUser(null)}
              className="h-8 border-white/15 text-xs text-gray-300 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAssignRoleSubmit}
              disabled={isUpdatingRole}
              className="h-8 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl"
            >
              {isUpdatingRole ? "Updating..." : "Save Role"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
