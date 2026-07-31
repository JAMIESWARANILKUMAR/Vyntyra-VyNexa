import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdminClient } from "@/integrations/supabase/admin";
import { generateUploadUrl } from "./r2";

const supabase = new Proxy({} as any, { get: (_, prop) => (getAdminClient() as any)[prop] });

const provisionSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'employee', 'intern', 'recruiter', 'viewer']),
  department: z.string().optional(),
  position: z.string().optional(),
  bank_account_number: z.string().optional(),
  employee_id: z.string().optional(),
  intern_id: z.string().optional(),
  duration_months: z.number().optional(),
  avatar_url: z.string().optional()
});

export const provisionUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => provisionSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create auth user: ${authError?.message}`);
    }

    const userId = authData.user.id;

    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: userId,
      role: data.role,
    });

    if (roleError) {
      await supabase.auth.admin.deleteUser(userId);
      throw new Error(`Failed to assign role: ${roleError.message}`);
    }

    await supabase.from("profiles").upsert({
      id: userId,
      full_name: data.full_name,
      email: data.email,
      department: data.department,
      position: data.position,
      bank_account_number: data.bank_account_number,
      employee_id: data.employee_id,
      intern_id: data.intern_id,
      duration_months: data.duration_months,
      avatar_url: data.avatar_url || null
    });

    return { success: true, userId };
  });

const revokeSchema = z.object({ userId: z.string().uuid() });

export const revokeUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => revokeSchema.parse(data))
  .handler(async ({ data, context }) => {
    if (data.userId === context.userId) {
      throw new Error("Cannot delete your own admin account");
    }
    const { error } = await supabase.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(`Failed to delete user: ${error.message}`);
    return { success: true };
  });

export const listTeamMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Fetch users who have employee or intern role
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["employee", "intern"]);

    if (rolesError) throw new Error(rolesError.message);
    if (!roles || roles.length === 0) return [];

    const userIds = roles.map((r: any) => r.user_id);

    // Bulk fetch profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);

    // Fetch all auth users to avoid rate limiting on getUserById
    const { data: authData } = await supabase.auth.admin.listUsers();
    const authUsers = authData?.users || [];

    const members = roles.map((r: any) => {
      const authUser = authUsers.find((u: any) => u.id === r.user_id);
      const profile = profiles?.find((p: any) => p.id === r.user_id) || {};
      
      const email = authUser?.email || profile.email || "";
      const full_name = profile.full_name || authUser?.user_metadata?.full_name || email.split("@")[0];

      return {
        id: r.user_id,
        role: r.role,
        ...profile,
        email,
        full_name,
      };
    });

    return members.filter((m: any) => m.email || m.full_name);
  });

// ─── Announcements ────────────────────────────────────────────────
const announcementSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  target_role: z.enum(["employee", "intern", "all"]),
});

export const listAnnouncements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  });

export const createAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => announcementSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await supabase.from("announcements").insert({
      title: data.title,
      body: data.body,
      target_role: data.target_role,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabase.from("announcements").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── Tasks ────────────────────────────────────────────────────────
const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  due_date: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  is_pool_task: z.boolean().optional().default(false),
  target_role: z.enum(["employee", "intern", "all"]).optional(),
});

export const listTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*, profiles!tasks_assigned_to_fkey(full_name)")
      .order("created_at", { ascending: false });
    if (error) {
      // Fallback: try without join
      const { data: plain, error: e2 } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (e2) throw new Error(e2.message);
      return plain || [];
    }
    return data || [];
  });

export const createTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => taskSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await supabase.from("tasks").insert({
      title: data.title,
      description: data.description,
      assigned_to: data.assigned_to,
      due_date: data.due_date,
      priority: data.priority,
      status: "pending",
      is_pool_task: data.is_pool_task,
      target_role: data.target_role,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabase.from("tasks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── Schedules ────────────────────────────────────────────────────
const scheduleSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  event_date: z.string(),
  event_time: z.string().optional(),
  target_role: z.enum(["employee", "intern", "all"]),
});

export const listSchedules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .order("event_date", { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  });

export const createSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => scheduleSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await supabase.from("schedules").insert({
      title: data.title,
      description: data.description,
      event_date: data.event_date,
      event_time: data.event_time,
      target_role: data.target_role,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabase.from("schedules").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── Meetings ────────────────────────────────────────────────
const meetingSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  meeting_link: z.string().url(),
  scheduled_at: z.string(),
  duration_minutes: z.number().optional(),
  target_role: z.enum(['employee', 'intern', 'all']),
});

export const listMeetings = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Get the user's role
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', context.userId).single();
    const role = roleData?.role || 'employee';

    let query = supabase.from('meetings').select('*').order('scheduled_at', { ascending: true });

    // Admins see all meetings
    if (role !== 'admin') {
      query = query.or(`target_role.eq.all,target_role.eq.${role}`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  });

export const createMeeting = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => meetingSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await supabase.from('meetings').insert({
      title: data.title,
      description: data.description,
      meeting_link: data.meeting_link,
      scheduled_at: data.scheduled_at,
      duration_minutes: data.duration_minutes,
      target_role: data.target_role,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteMeeting = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabase.from('meetings').delete().eq('id', data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── Resources (Intern) ───────────────────────────────────────
const resourceSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  url: z.string().min(1),
  type: z.enum(['document', 'video', 'link', 'template', 'guide']),
  target_role: z.enum(['employee', 'intern', 'all']),
});

export const listResources = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', context.userId).single();
    const role = roleData?.role || 'intern';

    let query = supabase.from('resources').select('*').order('created_at', { ascending: false });
    if (role !== 'admin') {
      query = query.or(`target_role.eq.all,target_role.eq.${role}`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  });

export const createResource = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => resourceSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await supabase.from('resources').insert({
      title: data.title,
      description: data.description,
      url: data.url,
      type: data.type,
      target_role: data.target_role,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteResource = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabase.from('resources').delete().eq('id', data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getPresignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ filename: z.string(), contentType: z.string() }).parse(d))
  .handler(async ({ data }) => {
    return await generateUploadUrl(data.filename, data.contentType);
  });

export const claimPoolTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await supabase
      .from("tasks")
      .update({ assigned_to: context.userId, is_pool_task: false })
      .eq("id", data.id)
      .eq("is_pool_task", true);
    if (error) throw new Error(error.message);
    return { success: true };
  });

const profileUpdateSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  intern_id: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  offer_letter_url: z.string().optional().nullable(),
  avatar_url: z.string().optional().nullable(),
});

export const updateUserProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => profileUpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { id, ...updates } = data;
    const { error } = await supabase.from("profiles").upsert({ id, ...updates });
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── Notes ────────────────────────────────────────────────────────

const noteSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
});

export const listNotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  });

export const createNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => noteSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await supabase.from("notes").insert({
      title: data.title,
      content: data.content,
      user_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await supabase.from("notes").delete().eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── Feedbacks ────────────────────────────────────────────────────

const feedbackSchema = z.object({
  content: z.string().min(1),
  target_user_id: z.string().uuid(),
});

export const listFeedbacks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabase
      .from("feedbacks")
      .select("*, profiles!feedbacks_created_by_fkey(full_name)")
      .eq("target_user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  });

export const createFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => feedbackSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await supabase.from("feedbacks").insert({
      content: data.content,
      target_user_id: data.target_user_id,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const markFeedbackRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await supabase
      .from("feedbacks")
      .update({ is_read: true })
      .eq("id", data.id)
      .eq("target_user_id", context.userId);
    if (error) throw new Error(error.message);
    return { success: true };
  });



// ─── Leaves ───────────────────────────────────────────────────────
const leaveSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  reason: z.string().min(1),
});

export const requestLeave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => leaveSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await supabase.from("leave_requests").insert({
      user_id: context.userId,
      start_date: data.start_date,
      end_date: data.end_date,
      reason: data.reason,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const listMyLeaves = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  });

// ─── Payouts ──────────────────────────────────────────────────────
export const listMyPayouts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabase
      .from("payouts")
      .select("*")
      .eq("user_id", context.userId)
      .order("date", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  });

// ─── Attendance ───────────────────────────────────────────────────
export const clockIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already clocked in today
    const { data: existing } = await supabase
      .from("attendance")
      .select("id")
      .eq("user_id", context.userId)
      .eq("date", today)
      .single();
      
    if (existing) {
      throw new Error("Already clocked in for today");
    }

    const { error } = await supabase.from("attendance").insert({
      user_id: context.userId,
      date: today,
      clock_in: new Date().toISOString(),
      status: 'present'
    });
    
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const clockOut = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existing } = await supabase
      .from("attendance")
      .select("id, clock_in")
      .eq("user_id", context.userId)
      .eq("date", today)
      .single();
      
    if (!existing) {
      throw new Error("No clock in found for today");
    }

    const { error } = await supabase.from("attendance")
      .update({ clock_out: new Date().toISOString() })
      .eq("id", existing.id);
      
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getMyAttendance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", context.userId)
      .order("date", { ascending: false });
      
    if (error) throw new Error(error.message);
    return data || [];
  });
// ─── Super Admin Operations ──────────────────────────────────────────

export const listAllLeaves = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', context.userId).single();
    if (roleData?.role !== 'admin') throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('leave_requests')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  });

export const updateLeaveStatus = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), status: z.enum(['approved', 'rejected']) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', context.userId).single();
    if (roleData?.role !== 'admin') throw new Error('Unauthorized');

    const { error } = await supabase.from('leave_requests').update({ status: data.status, updated_at: new Date().toISOString() }).eq('id', data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const listAllAttendance = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', context.userId).single();
    if (roleData?.role !== 'admin') throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('attendance')
      .select('*, profiles(full_name, email)')
      .order('date', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  });

export const listAllPayouts = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', context.userId).single();
    if (roleData?.role !== 'admin') throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('payouts')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  });

export const createPayout = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ user_id: z.string().uuid(), amount: z.number().min(1), type: z.string(), status: z.enum(['paid', 'pending']) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', context.userId).single();
    if (roleData?.role !== 'admin') throw new Error('Unauthorized');

    const { error } = await supabase.from('payouts').insert({
      user_id: data.user_id,
      amount: data.amount,
      type: data.type,
      status: data.status,
      date: new Date().toISOString().split('T')[0]
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── Team Assignments (Admin) ────────────────────────────────────────

export const assignIntern = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ internId: z.string().uuid(), employeeId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', context.userId).single();
    if (roleData?.role !== 'admin') throw new Error("Unauthorized");

    const { error } = await supabase.from("profiles").update({ mentor_id: data.employeeId }).eq("id", data.internId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const removeIntern = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ internId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', context.userId).single();
    if (roleData?.role !== 'admin') throw new Error("Unauthorized");

    const { error } = await supabase.from("profiles").update({ mentor_id: null }).eq("id", data.internId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── Security Admin ────────────────────────────────────────────────

export const adminResetPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid(), newPassword: z.string().min(6) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', context.userId).single();
    if (roleData?.role !== 'admin') throw new Error("Unauthorized");

    const { error } = await supabase.auth.admin.updateUserById(data.userId, { password: data.newPassword });
    if (error) throw new Error(error.message);
    return { success: true };
  });
