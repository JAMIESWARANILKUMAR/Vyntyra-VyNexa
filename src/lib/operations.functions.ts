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
    const [annRes, companyAnnRes, newsRes] = await Promise.all([
      supabase.from("announcements").select("*").order("created_at", { ascending: false }),
      supabase.from("company_announcements").select("*").order("created_at", { ascending: false }),
      supabase.from("news_updates").select("*").order("created_at", { ascending: false }),
    ]);

    const items: any[] = [];
    const seenTitles = new Set<string>();

    if (annRes.data) {
      for (const a of annRes.data) {
        items.push({
          id: a.id,
          title: a.title,
          body: a.body || a.content || "",
          target_role: a.target_role || "all",
          created_at: a.created_at,
          source: "announcement"
        });
        if (a.title) seenTitles.add(a.title.trim().toLowerCase());
      }
    }

    if (companyAnnRes.data) {
      for (const ca of companyAnnRes.data) {
        if (ca.is_active !== false && ca.title && !seenTitles.has(ca.title.trim().toLowerCase())) {
          items.push({
            id: ca.id,
            title: ca.title,
            body: ca.content || "",
            target_role: "all",
            created_at: ca.created_at,
            source: "company_announcement"
          });
          seenTitles.add(ca.title.trim().toLowerCase());
        }
      }
    }

    if (newsRes.data) {
      for (const n of newsRes.data) {
        if (n.is_published !== false && n.title && !seenTitles.has(n.title.trim().toLowerCase())) {
          items.push({
            id: n.id,
            title: n.title,
            body: n.content || "",
            target_role: "all",
            created_at: n.created_at || n.published_at,
            source: "news"
          });
          seenTitles.add(n.title.trim().toLowerCase());
        }
      }
    }

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return items;
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

export const acceptTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString();
    const updatePayload: any = {
      accepted_at: now,
      accepted_by: context.userId,
      assigned_to: context.userId,
      status: "in_progress",
      is_pool_task: false,
    };
    const { error } = await supabase
      .from("tasks")
      .update(updatePayload)
      .eq("id", data.id);
    if (error) {
      // Graceful fallback if columns PGRST204 not yet migrated
      const { error: errFallback } = await supabase
        .from("tasks")
        .update({ assigned_to: context.userId, status: "in_progress", is_pool_task: false })
        .eq("id", data.id);
      if (errFallback) throw new Error(errFallback.message);
    }
    return { success: true, accepted_at: now };
  });

export const updateTaskExecution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(),
    status: z.enum(["pending", "in_progress", "completed", "blocked"]),
    progress_percentage: z.number().min(0).max(100).optional(),
    progress_notes: z.string().optional(),
    project_requirements: z.string().optional(),
    deliverable_url: z.string().optional(),
    time_spent_hours: z.number().optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const updatePayload: any = {
      status: data.status,
      updated_at: new Date().toISOString(),
    };
    if (data.progress_percentage !== undefined) updatePayload.progress_percentage = data.progress_percentage;
    if (data.progress_notes !== undefined) updatePayload.progress_notes = data.progress_notes;
    if (data.project_requirements !== undefined) updatePayload.project_requirements = data.project_requirements;
    if (data.deliverable_url !== undefined) updatePayload.deliverable_url = data.deliverable_url;
    if (data.time_spent_hours !== undefined) updatePayload.time_spent_hours = data.time_spent_hours;

    const { error } = await supabase
      .from("tasks")
      .update(updatePayload)
      .eq("id", data.id);
    if (error) {
      // Graceful fallback if extra columns not migrated
      const { error: errFallback } = await supabase
        .from("tasks")
        .update({ status: data.status, updated_at: new Date().toISOString() })
        .eq("id", data.id);
      if (errFallback) throw new Error(errFallback.message);
    }
    return { success: true };
  });

export const updateTaskByAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(),
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(["pending", "in_progress", "completed", "blocked"]).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    assigned_to: z.string().nullable().optional(),
    progress_percentage: z.number().optional(),
    progress_notes: z.string().optional(),
    project_requirements: z.string().optional(),
    deliverable_url: z.string().optional(),
    time_spent_hours: z.number().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', context.userId).single();
    if (roleData?.role !== 'admin') throw new Error("Unauthorized");

    const updatePayload: any = { ...data };
    delete updatePayload.id;

    const { error } = await supabase
      .from("tasks")
      .update(updatePayload)
      .eq("id", data.id);
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
  meeting_link: z.string().min(1),
  scheduled_at: z.string().optional(),
  start_time: z.string().optional(),
  duration_minutes: z.number().optional(),
  target_role: z.enum(['employee', 'intern', 'all']).optional().default('all'),
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
    
    // Normalize start_time and scheduled_at for frontend compatibility
    return (data || []).map((m: any) => ({
      ...m,
      scheduled_at: m.scheduled_at || m.start_time || m.created_at,
      start_time: m.start_time || m.scheduled_at || m.created_at,
    }));
  });

export const createMeeting = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => meetingSchema.parse(d))
  .handler(async ({ data, context }) => {
    const scheduledAt = data.scheduled_at || data.start_time || new Date().toISOString();
    const { error } = await supabase.from('meetings').insert({
      title: data.title,
      description: data.description || null,
      meeting_link: data.meeting_link,
      scheduled_at: scheduledAt,
      duration_minutes: data.duration_minutes || 30,
      target_role: data.target_role || 'all',
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
  blood_group: z.string().optional().nullable(),
  security_level: z.string().optional().nullable(),
  emergency_contact: z.string().optional().nullable(),
  bank_details: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
});

export const updateUserProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => profileUpdateSchema.parse(d))
  .handler(async ({ data }) => {
    const { id, ...updates } = data;
    
    // Attempt full update
    const { error } = await supabase.from("profiles").upsert({ id, ...updates });
    if (error) {
      if (error.message.includes("schema cache") || error.message.includes("column") || error.code === "PGRST204") {
        // Fallback to core columns if database schema hasn't been migrated yet
        const coreUpdates: Record<string, any> = { id };
        if (updates.full_name !== undefined) coreUpdates.full_name = updates.full_name;
        if (updates.phone !== undefined) coreUpdates.phone = updates.phone;
        if (updates.address !== undefined) coreUpdates.address = updates.address;
        if (updates.intern_id !== undefined) coreUpdates.intern_id = updates.intern_id;
        if (updates.start_date !== undefined) coreUpdates.start_date = updates.start_date;
        if (updates.end_date !== undefined) coreUpdates.end_date = updates.end_date;
        if (updates.avatar_url !== undefined) coreUpdates.avatar_url = updates.avatar_url;
        if (updates.offer_letter_url !== undefined) coreUpdates.offer_letter_url = updates.offer_letter_url;
        
        const { error: fallbackError } = await supabase.from("profiles").upsert(coreUpdates);
        if (fallbackError) throw new Error(fallbackError.message);
        return { success: true };
      }
      throw new Error(error.message);
    }
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

// ─── ESS Enterprise Modules (Expenses, Support Tickets, Kudos) ──────────

const expenseSchema = z.object({
  title: z.string().min(1),
  category: z.enum(["Travel", "Food", "Office Supplies", "Internet", "Medical", "Other"]),
  amount: z.number().min(1),
  date: z.string(),
  receipt_url: z.string().optional(),
  notes: z.string().optional(),
});

export const createExpenseClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => expenseSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await supabase.from("expense_claims").insert({
      user_id: context.userId,
      title: data.title,
      category: data.category,
      amount: data.amount,
      date: data.date,
      receipt_url: data.receipt_url,
      notes: data.notes,
      status: "pending",
    });
    if (error) console.warn("Expense insertion note:", error.message);
    return { success: true };
  });

export const listMyExpenses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabase
      .from("expense_claims")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) return [];
    return data || [];
  });

const ticketSchema = z.object({
  category: z.enum(["IT Support", "HR Inquiry", "Payroll & Finance", "Admin & Workplace", "Other"]),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]),
  subject: z.string().min(1),
  description: z.string().min(1),
});

export const createSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ticketSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await supabase.from("support_tickets").insert({
      user_id: context.userId,
      category: data.category,
      priority: data.priority,
      subject: data.subject,
      description: data.description,
      status: "open",
    });
    if (error) console.warn("Support ticket error:", error.message);
    return { success: true };
  });

export const listMySupportTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) return [];
    return data || [];
  });

const kudosSchema = z.object({
  receiver_id: z.string().uuid(),
  badge: z.enum(["Star Performer", "Team Player", "Problem Solver", "Innovation Champion", "Customer Delight"]),
  message: z.string().min(1),
});

export const createKudos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => kudosSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await supabase.from("kudos").insert({
      sender_id: context.userId,
      receiver_id: data.receiver_id,
      badge: data.badge,
      message: data.message,
    });
    if (error) console.warn("Kudos error:", error.message);
    return { success: true };
  });

export const listKudos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabase
      .from("kudos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return [];
    return data || [];
  });

export const listAllExpenses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', context.userId).single();
    if (roleData?.role !== 'admin') throw new Error("Unauthorized");

    const { data, error } = await supabase
      .from("expense_claims")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false });
    if (error) return [];
    return data || [];
  });

export const updateExpenseStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["pending", "approved", "rejected", "paid"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', context.userId).single();
    if (roleData?.role !== 'admin') throw new Error("Unauthorized");

    const { error } = await supabase.from("expense_claims").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const listAllSupportTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', context.userId).single();
    if (roleData?.role !== 'admin') throw new Error("Unauthorized");

    const { data, error } = await supabase
      .from("support_tickets")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false });
    if (error) return [];
    return data || [];
  });

export const updateSupportTicketStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["open", "in_progress", "resolved"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', context.userId).single();
    if (roleData?.role !== 'admin') throw new Error("Unauthorized");

    const { error } = await supabase.from("support_tickets").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── Intern Daily Standups ──────────────────────────────────────
export const listMyStandups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabase
      .from("intern_standups")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) return [];
    return data || [];
  });

export const createStandup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ did_today: z.string().min(1), will_do_tomorrow: z.string().min(1), blockers: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await supabase.from("intern_standups").insert({
      user_id: context.userId,
      did_today: data.did_today,
      will_do_tomorrow: data.will_do_tomorrow,
      blockers: data.blockers || null,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const listAllStandups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabase
      .from("intern_standups")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false });
    if (error) return [];
    return data || [];
  });

export const updateStandupStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["pending", "approved", "flagged"]) }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabase.from("intern_standups").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── Intern Deliverables ────────────────────────────────────────
export const listMyDeliverables = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabase
      .from("intern_deliverables")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) return [];
    return data || [];
  });

export const createDeliverable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ task_id: z.string().optional(), title: z.string().min(1), submission_url: z.string().min(1), notes: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await supabase.from("intern_deliverables").insert({
      user_id: context.userId,
      task_id: data.task_id || null,
      title: data.title,
      submission_url: data.submission_url,
      notes: data.notes || null,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const listAllDeliverables = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabase
      .from("intern_deliverables")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false });
    if (error) return [];
    return data || [];
  });

export const updateDeliverableStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["submitted", "under_review", "approved", "revision_requested"]), feedback: z.string().optional() }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabase.from("intern_deliverables").update({ status: data.status, feedback: data.feedback || null }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── Intern Tooling & Access Requests ───────────────────────────
export const listMyAccessRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabase
      .from("intern_access_requests")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) return [];
    return data || [];
  });

export const createAccessRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ tool_name: z.string().min(1), reason: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await supabase.from("intern_access_requests").insert({
      user_id: context.userId,
      tool_name: data.tool_name,
      reason: data.reason || null,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const listAllAccessRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabase
      .from("intern_access_requests")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false });
    if (error) return [];
    return data || [];
  });

export const updateAccessRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["pending", "approved", "provisioned", "rejected"]) }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabase.from("intern_access_requests").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── CRM Leads (Non-Tech Sales & Marketing) ─────────────────────
export const listLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return [];
    return data || [];
  });

export const createLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    client_name: z.string().min(1),
    company_name: z.string().min(1),
    email: z.string().optional(),
    phone: z.string().optional(),
    lead_source: z.string().optional(),
    status: z.enum(["New", "Attempted", "Connected", "Requirement Gathered", "Proposal Sent", "Closed-Won", "Closed-Lost"]).optional(),
    project_scope: z.string().optional(),
    estimated_value: z.number().optional(),
    follow_up_date: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await supabase.from("leads").insert({
      user_id: context.userId,
      client_name: data.client_name,
      company_name: data.company_name,
      email: data.email || null,
      phone: data.phone || null,
      lead_source: data.lead_source || "Inbound Website",
      status: data.status || "New",
      project_scope: data.project_scope || null,
      estimated_value: data.estimated_value ?? 0,
      follow_up_date: data.follow_up_date || null,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const updateLeadStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(),
    status: z.enum(["New", "Attempted", "Connected", "Requirement Gathered", "Proposal Sent", "Closed-Won", "Closed-Lost"]).optional(),
    is_contacted: z.boolean().optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const updatePayload: any = {};
    if (data.status) updatePayload.status = data.status;
    if (data.is_contacted !== undefined) updatePayload.is_contacted = data.is_contacted;
    const { error } = await supabase.from("leads").update(updatePayload).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabase.from("leads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── Technical Bug & Ticket Log ─────────────────────────────────
export const listBugs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabase
      .from("bugs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return [];
    return data || [];
  });

export const createBug = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    severity: z.enum(["Blocker", "Major", "Minor"]).default("Major"),
    repo_url: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await supabase.from("bugs").insert({
      user_id: context.userId,
      title: data.title,
      description: data.description || null,
      severity: data.severity,
      status: "open",
      repo_url: data.repo_url || null,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const updateBugStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["open", "in_progress", "resolved"]) }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabase.from("bugs").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── Email Automation & Promotional Campaign Engine ─────────────
export const sendPromotionalInternshipEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    recipient_email: z.string().trim().email(),
    recipient_name: z.string().optional(),
    university_name: z.string().optional(),
    domain: z.string().optional(),
    sub_domain: z.string().optional(),
    custom_subject: z.string().optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const recipientEmail = data.recipient_email.trim().toLowerCase();
    const recipientName = data.recipient_name?.trim() || "Candidate";
    const universityName = data.university_name?.trim() || "";
    const domain = data.domain?.trim() || "";
    const subDomain = data.sub_domain?.trim() || "";
    const subject = data.custom_subject?.trim() || "Invitation: 2026 Official Internship Program — Vyntyra Consultancy Services";

    let resendId: string | null = null;
    let providerUsed: "resend" | "brevo" = "resend";
    let status: "sent" | "failed" = "sent";
    let errorMessage: string | null = null;

    const htmlContent = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#060b14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#334155;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#060b14;padding:40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:620px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
          
          <!-- Header Branding with Official Vyntyra Logo & Corporate Badge -->
          <tr>
            <td style="background-color:#0b1728;padding:28px 40px;text-align:left;border-bottom:3px solid #10b981;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="width:52px;vertical-align:middle;text-align:left;">
                    <img src="https://media.licdn.com/dms/image/v2/D560BAQHqR70ldjUQfw/company-logo_100_100/B56ZcLUrrcHoAY-/0/1748241661218?e=1787788800&v=beta&t=P9WCxG463gvoB0RKqmTrmuk0c7o6jVeFZbDmsg5dX9A" alt="Vyntyra Logo" width="46" height="46" style="display:block;border-radius:10px;border:1px solid #1e293b;box-shadow:0 4px 8px rgba(0,0,0,0.25);">
                  </td>
                  <td style="padding-left:14px;vertical-align:middle;text-align:left;">
                    <div style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;line-height:1.2;">Vyntyra Consultancy Services</div>
                    <div style="color:#10b981;font-size:11px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;margin-top:3px;">Project VyNexa &middot; Global Internship Program</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero & Opening Executive Statement -->
          <tr>
            <td style="padding:40px 40px 24px 40px;text-align:left;">
              <div style="display:inline-block;background-color:#ecfdf5;color:#047857;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;padding:4px 12px;border-radius:20px;border:1px solid #a7f3d0;margin-bottom:12px;text-align:left;">
                &starf; Official Invitation &middot; 2026 Season
              </div>
              <h1 style="margin:0 0 16px 0;font-size:23px;font-weight:800;color:#0f172a;line-height:1.35;letter-spacing:-0.02em;text-align:left;">
                Advance Your Professional Trajectory with Project VyNexa
              </h1>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;text-align:left;">
                Dear <strong>${recipientName}</strong>${universityName ? ` (${universityName})` : ''},
              </p>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#475569;text-align:left;">
                Following a review of academic credentials and candidate profiles, the talent acquisition committee at <strong>Vyntyra Consultancy Services</strong> is pleased to invite you to apply for our <strong>Official 2026 Internship Program</strong> under <strong>Project VyNexa</strong>.
              </p>
              
              <div style="background-color:#f0fdf4;border-left:4px solid #10b981;padding:18px 22px;border-radius:0 10px 10px 0;margin:24px 0;text-align:left;">
                <div style="font-size:12px;font-weight:700;color:#0f172a;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.08em;">About Project VyNexa</div>
                <p style="margin:0;font-size:14px;line-height:1.65;color:#1e293b;text-align:left;">
                  Project VyNexa is Vyntyra’s flag-ship development program designed to bridge the gap between academic learning and high-stakes corporate execution. Participants collaborate on live international initiatives with structured mentorship.
                </p>
              </div>
            </td>
          </tr>

          <!-- Target Candidate Recommendation Track (If Domain/Sub-Domain specified) -->
          ${(domain || subDomain) ? `
          <tr>
            <td style="padding:0 40px 24px 40px;text-align:left;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#eff6ff;border-radius:12px;border:1px solid #bfdbfe;padding:20px;">
                <tr>
                  <td style="text-align:left;">
                    <div style="font-size:11px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;text-align:left;">
                      &star; Recommended Candidate Match
                    </div>
                    <div style="font-size:17px;font-weight:800;color:#1e3a8a;margin-bottom:4px;text-align:left;">
                      ${domain || 'Core Internship Program'}
                    </div>
                    ${subDomain ? `
                    <div style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:12px;font-weight:700;padding:5px 14px;border-radius:6px;margin-top:6px;">
                      Specialization Track: ${subDomain}
                    </div>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>` : ''}

          <!-- Global Domain Tracks & Specialization Sub-Domains Grid -->
          <tr>
            <td style="padding:0 40px 24px 40px;text-align:left;">
              <div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:14px;text-transform:uppercase;letter-spacing:0.08em;text-align:left;">
                Available Domain Tracks &amp; Sub-Domains:
              </div>

              <!-- Track 1: Engineering & Technology -->
              <div style="background-color:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;padding:18px 20px;margin-bottom:14px;text-align:left;">
                <div style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:6px;display:flex;align-items:center;">
                  <span style="color:#10b981;margin-right:8px;">&bull;</span> Engineering &amp; Technology Systems
                </div>
                <div style="font-size:13px;color:#475569;line-height:1.65;padding-left:14px;">
                  <strong>Sub-Domains:</strong> Full Stack Web Development (React/Node), Cloud Architecture &amp; DevOps, AI/ML Research &amp; Data Engineering, Cybersecurity &amp; Systems Architecture.
                </div>
              </div>

              <!-- Track 2: Growth & Commercial Strategy -->
              <div style="background-color:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;padding:18px 20px;margin-bottom:14px;text-align:left;">
                <div style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:6px;display:flex;align-items:center;">
                  <span style="color:#0284c7;margin-right:8px;">&bull;</span> Growth &amp; Commercial Strategy
                </div>
                <div style="font-size:13px;color:#475569;line-height:1.65;padding-left:14px;">
                  <strong>Sub-Domains:</strong> B2B Enterprise Sales &amp; Business Development, CRM Optimization, Financial Modeling &amp; Analytics, Digital Growth Marketing &amp; SEO.
                </div>
              </div>

              <!-- Track 3: Design, Product & Operations -->
              <div style="background-color:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;padding:18px 20px;text-align:left;">
                <div style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:6px;display:flex;align-items:center;">
                  <span style="color:#8b5cf6;margin-right:8px;">&bull;</span> Product, Design &amp; Operations
                </div>
                <div style="font-size:13px;color:#475569;line-height:1.65;padding-left:14px;">
                  <strong>Sub-Domains:</strong> UI/UX &amp; Product Design, HR &amp; Global Talent Acquisition, Technical Quality Assurance, Business Operations.
                </div>
              </div>
            </td>
          </tr>

          <!-- Program Highlights & Corporate Benefits -->
          <tr>
            <td style="padding:0 40px 28px 40px;text-align:left;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#ecfdf5;border-radius:12px;border:1px solid #a7f3d0;padding:22px;">
                <tr>
                  <td style="text-align:left;">
                    <div style="font-size:12px;font-weight:800;color:#047857;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.08em;text-align:left;">
                      &check; Program Highlights &amp; Corporate Benefits:
                    </div>
                    <ul style="margin:0;padding-left:18px;font-size:13.5px;color:#166534;line-height:1.8;text-align:left;">
                      <li style="margin-bottom:6px;text-align:left;"><strong>Live Client Projects:</strong> Work on scalable software and enterprise strategy initiatives.</li>
                      <li style="margin-bottom:6px;text-align:left;"><strong>Executive Mentorship:</strong> 1-on-1 guidance from Senior Architects and Department Directors.</li>
                      <li style="margin-bottom:6px;text-align:left;"><strong>Pre-Placement Offer (PPO):</strong> High performers receive direct fast-track PPO considerations.</li>
                      <li style="text-align:left;"><strong>Verified Certificate &amp; LOR:</strong> Official ISO-aligned experience documentation upon completion.</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Call To Action Section -->
          <tr>
            <td style="padding:0 40px 36px 40px;text-align:left;">
              <div style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:8px;text-align:left;">Application Instructions:</div>
              <p style="margin:0 0 20px 0;font-size:14px;line-height:1.65;color:#475569;text-align:left;">
                Click the button below to review full program details and submit your application on our official careers portal:
              </p>

              <!-- Premium CTA Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-top:4px;padding-bottom:12px;">
                    <a href="https://careers.vyntyraconsultancyservices.in/?apply=true#form" target="_blank" style="display:inline-block;background-color:#10b981;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 42px;border-radius:10px;box-shadow:0 6px 20px rgba(16,185,129,0.35);letter-spacing:0.02em;">
                      Apply For Internship &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0 0;font-size:13px;line-height:1.65;color:#64748b;text-align:left;">
                For candidate queries or institutional partnerships, reach out directly to <a href="mailto:internships@vyntyraconsultancyservices.in" style="color:#0284c7;font-weight:600;text-decoration:underline;">internships@vyntyraconsultancyservices.in</a>.
              </p>

              <!-- Executive Signature Block -->
              <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:left;">
                <div style="font-size:13px;color:#64748b;text-align:left;">Sincerely,</div>
                <div style="font-size:16px;font-weight:800;color:#0f172a;margin-top:4px;text-align:left;">Jami Eswar Anil Kumar</div>
                <div style="font-size:12px;font-weight:700;color:#10b981;text-align:left;">Founder &amp; Managing Director</div>
                <div style="font-size:12px;color:#64748b;text-align:left;">Vyntyra Consultancy Services</div>
              </div>
            </td>
          </tr>

          <!-- Corporate Footer & Social Media Icon Buttons -->
          <tr>
            <td style="background-color:#0b1728;padding:36px 40px;text-align:center;color:#94a3b8;font-size:11px;line-height:1.65;">
              <div style="color:#ffffff;font-weight:700;font-size:14px;margin-bottom:12px;letter-spacing:-0.01em;">Vyntyra Consultancy Services</div>
              
              <!-- Social Media Buttons with Icons -->
              <div style="margin-bottom:22px;padding:14px 0;border-top:1px solid #1e293b;border-bottom:1px solid #1e293b;display:flex;align-items:center;justify-center:center;gap:12px;">
                <a href="https://www.linkedin.com/company/vyntyra-consultancy-services" target="_blank" style="display:inline-flex;align-items:center;background-color:#0284c7;color:#ffffff;font-size:12px;font-weight:700;text-decoration:none;padding:8px 16px;border-radius:6px;margin:0 4px;">
                  <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" width="14" height="14" style="margin-right:6px;vertical-align:middle;filter:brightness(0) invert(1);"> LinkedIn
                </a>
                <a href="https://www.instagram.com/vyntyraindia" target="_blank" style="display:inline-flex;align-items:center;background-color:#e1306c;color:#ffffff;font-size:12px;font-weight:700;text-decoration:none;padding:8px 16px;border-radius:6px;margin:0 4px;">
                  <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" width="14" height="14" style="margin-right:6px;vertical-align:middle;filter:brightness(0) invert(1);"> Instagram
                </a>
                <a href="https://vyntyraconsultancyservices.in/" target="_blank" style="display:inline-flex;align-items:center;background-color:#10b981;color:#ffffff;font-size:12px;font-weight:700;text-decoration:none;padding:8px 16px;border-radius:6px;margin:0 4px;">
                  <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Website" width="14" height="14" style="margin-right:6px;vertical-align:middle;filter:brightness(0) invert(1);"> Corporate Site
                </a>
              </div>

              <div>Visakhapatnam, Andhra Pradesh, India</div>
              <div>ISO 9001:2015 Certified &middot; MSME Registered &middot; NASSCOM Member</div>
              <div style="margin-top:14px;color:#64748b;font-size:10.5px;line-height:1.5;">
                This communication is an official recruitment notification issued by Vyntyra Consultancy Services.<br>
                For recruitment compliance or preference updates, email <a href="mailto:internships@vyntyraconsultancyservices.in" style="color:#34d399;text-decoration:none;">internships@vyntyraconsultancyservices.in</a>.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      // Equal usage strategy: check monthly usage for Resend vs Brevo
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data: monthLogs } = await supabase
        .from("automated_emails_log")
        .select("provider")
        .gte("sent_at", startOfMonth)
        .eq("status", "sent");

      const resendCountThisMonth = monthLogs?.filter((l: any) => l.provider === "resend" || !l.provider).length || 0;
      const brevoCountThisMonth = monthLogs?.filter((l: any) => l.provider === "brevo").length || 0;

      const hasResend = !!process.env.RESEND_API_KEY;
      const hasBrevo = !!process.env.BREVO_API_KEY;

      // Select primary provider based on lower monthly usage for equal load distribution
      let primaryProvider: "resend" | "brevo" = "resend";
      if (hasResend && hasBrevo) {
        if (brevoCountThisMonth < resendCountThisMonth && brevoCountThisMonth < 9000) {
          primaryProvider = "brevo";
        } else if (resendCountThisMonth < 3000) {
          primaryProvider = "resend";
        } else {
          primaryProvider = "brevo";
        }
      } else if (hasBrevo && !hasResend) {
        primaryProvider = "brevo";
      }

      try {
        if (primaryProvider === "brevo" && hasBrevo) {
          try {
            resendId = await sendViaBrevo({ recipientEmail, recipientName, subject, htmlContent });
            providerUsed = "brevo";
          } catch (bErr: any) {
            console.warn("[email-balancer] Brevo primary failed, falling back to Resend:", bErr.message);
            if (hasResend) {
              const { Resend } = await import("resend");
              const resend = new Resend(process.env.RESEND_API_KEY!);
              let resp = await resend.emails.send({
                from: "Vyntyra Careers <careers@vyntyraconsultancyservices.in>",
                to: recipientEmail,
                subject: subject,
                html: htmlContent,
                replyTo: "internships@vyntyraconsultancyservices.in",
              });
              if (resp.error) throw new Error(resp.error.message);
              resendId = resp.data?.id || null;
              providerUsed = "resend";
            } else {
              throw bErr;
            }
          }
        } else {
          // Resend Primary
          try {
            const { Resend } = await import("resend");
            const apiKey = process.env.RESEND_API_KEY;
            if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
            const resend = new Resend(apiKey);
            let resp = await resend.emails.send({
              from: "Vyntyra Careers <careers@vyntyraconsultancyservices.in>",
              to: recipientEmail,
              subject: subject,
              html: htmlContent,
              replyTo: "internships@vyntyraconsultancyservices.in",
            });
            if (resp.error) {
              resp = await resend.emails.send({
                from: "Vyntyra Careers <noreply@vyntyraconsultancyservices.in>",
                to: recipientEmail,
                subject: subject,
                html: htmlContent,
                replyTo: "internships@vyntyraconsultancyservices.in",
              });
            }
            if (resp.error) throw new Error(resp.error.message);
            resendId = resp.data?.id || null;
            providerUsed = "resend";
          } catch (rErr: any) {
            console.warn("[email-balancer] Resend primary failed, falling back to Brevo:", rErr.message);
            if (hasBrevo) {
              resendId = await sendViaBrevo({ recipientEmail, recipientName, subject, htmlContent });
              providerUsed = "brevo";
            } else {
              throw rErr;
            }
          }
        }
      } catch (err: any) {
        status = "failed";
        errorMessage = err.message || "Failed to dispatch promotional email";
      }

      // Record log in automated_emails_log
      const { error: logError } = await supabase.from("automated_emails_log").insert({
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        university_name: universityName || null,
        domain: domain || null,
        sub_domain: subDomain || null,
        subject: subject,
        status: status,
        provider: providerUsed,
        resend_id: resendId,
        error_message: errorMessage,
        sent_at: new Date().toISOString(),
      });

      if (logError) {
        console.warn("[email-automation] Failed to write log:", logError.message);
      }

      if (status === "failed") {
        throw new Error(errorMessage || "Failed to send email");
      }

      return { success: true, resendId, provider: providerUsed };
  });

// Secondary Email Service Helper for Brevo API
async function sendViaBrevo({ recipientEmail, recipientName, subject, htmlContent }: { recipientEmail: string; recipientName?: string; subject: string; htmlContent: string }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY environment variable is not configured");

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: "Vyntyra Careers", email: "careers@vyntyraconsultancyservices.in" },
      to: [{ email: recipientEmail, name: recipientName || "Candidate" }],
      replyTo: { email: "internships@vyntyraconsultancyservices.in", name: "Vyntyra Talent Acquisition" },
      subject: subject,
      htmlContent: htmlContent,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.code || "Brevo email dispatch failed");
  }
  return data.messageId || data.id || "brevo-" + Date.now();
}

// Get Monthly Email Quota & Service Health Stats
export const getEmailQuotaStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const { data: logs } = await supabase
      .from("automated_emails_log")
      .select("provider, status, sent_at")
      .gte("sent_at", startOfMonth)
      .eq("status", "sent");

    const totalSentThisMonth = logs?.length || 0;
    const resendSentThisMonth = logs?.filter((l: any) => l.provider === "resend" || !l.provider).length || 0;
    const brevoSentThisMonth = logs?.filter((l: any) => l.provider === "brevo").length || 0;

    const resendQuota = 3000;
    const brevoQuota = 9000;

    return {
      totalSentThisMonth,
      resendSentThisMonth,
      resendAvailable: Math.max(0, resendQuota - resendSentThisMonth),
      resendQuota,
      brevoSentThisMonth,
      brevoAvailable: Math.max(0, brevoQuota - brevoSentThisMonth),
      brevoQuota,
      hasResendKey: !!process.env.RESEND_API_KEY,
      hasBrevoKey: !!process.env.BREVO_API_KEY,
    };
  });

export const listAutomatedEmailLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabase
      .from("automated_emails_log")
      .select("*")
      .order("sent_at", { ascending: false });
    if (error) return [];
    return data || [];
  });

export const deleteAutomatedEmailLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabase.from("automated_emails_log").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── SMS Gateway & Multi-Provider Automation Engine ─────────────
export const sendSmsNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    recipient_phone: z.string().min(5),
    recipient_name: z.string().optional(),
    message: z.string().min(1),
    preferred_provider: z.enum(['auto', 'textbee', 'httpsms']).optional().default('auto'),
  }).parse(d))
  .handler(async ({ data }) => {
    const rawPhone = data.recipient_phone.trim().replace(/[^\d+]/g, '');
    const recipientPhone = rawPhone.startsWith('+') ? rawPhone : `+91${rawPhone}`;
    const recipientName = data.recipient_name?.trim() || 'Candidate';
    const message = data.message.trim();

    let smsId: string | null = null;
    let providerUsed: 'textbee' | 'httpsms' = 'textbee';
    let status: 'sent' | 'failed' = 'sent';
    let errorMessage: string | null = null;

    // Check monthly & daily usage for load balancing
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const startOfToday = new Date().toISOString().split('T')[0];

    const { data: monthSms } = await supabase
      .from('sms_logs')
      .select('provider, sent_at')
      .gte('sent_at', startOfMonth)
      .eq('status', 'sent');

    const textbeeMonthCount = monthSms?.filter((s: any) => s.provider === 'textbee').length || 0;
    const httpsmsMonthCount = monthSms?.filter((s: any) => s.provider === 'httpsms').length || 0;
    const textbeeTodayCount = monthSms?.filter((s: any) => s.provider === 'textbee' && s.sent_at?.startsWith(startOfToday)).length || 0;

    const hasTextBee = !!(process.env.TEXTBEE_API_KEY && process.env.TEXTBEE_DEVICE_ID);
    const hasHttpSms = !!(process.env.HTTPSMS_API_KEY && process.env.HTTPSMS_PHONE_NUMBER);

    // Load Balancing Strategy: TextBee (300/mo, max 50/day) vs HttpSMS (200/mo, Android app required)
    let selectedProvider: 'textbee' | 'httpsms' = 'textbee';
    if (data.preferred_provider !== 'auto') {
      selectedProvider = data.preferred_provider as 'textbee' | 'httpsms';
    } else {
      if (hasTextBee && textbeeMonthCount < 300 && textbeeTodayCount < 50 && (textbeeMonthCount <= httpsmsMonthCount || !hasHttpSms)) {
        selectedProvider = 'textbee';
      } else if (hasHttpSms && httpsmsMonthCount < 200) {
        selectedProvider = 'httpsms';
      } else if (hasTextBee && textbeeMonthCount < 300 && textbeeTodayCount < 50) {
        selectedProvider = 'textbee';
      }
    }

    try {
      if (selectedProvider === 'textbee' && hasTextBee) {
        try {
          smsId = await sendViaTextBee({ recipientPhone, message });
          providerUsed = 'textbee';
        } catch (tbErr: any) {
          console.warn('[sms-engine] TextBee failed, trying HttpSMS fallback:', tbErr.message);
          if (hasHttpSms) {
            smsId = await sendViaHttpSms({ recipientPhone, message });
            providerUsed = 'httpsms';
          } else {
            throw tbErr;
          }
        }
      } else if (hasHttpSms) {
        try {
          smsId = await sendViaHttpSms({ recipientPhone, message });
          providerUsed = 'httpsms';
        } catch (hsErr: any) {
          console.warn('[sms-engine] HttpSMS failed, trying TextBee fallback:', hsErr.message);
          if (hasTextBee) {
            smsId = await sendViaTextBee({ recipientPhone, message });
            providerUsed = 'textbee';
          } else {
            throw hsErr;
          }
        }
      } else if (hasTextBee) {
        smsId = await sendViaTextBee({ recipientPhone, message });
        providerUsed = 'textbee';
      } else {
        throw new Error('No SMS gateway credentials (TEXTBEE_API_KEY or HTTPSMS_API_KEY) configured in environment');
      }
    } catch (err: any) {
      status = 'failed';
      errorMessage = err.message || 'SMS dispatch failed';
    }

    await supabase.from('sms_logs').insert({
      recipient_phone: recipientPhone,
      recipient_name: recipientName,
      message: message,
      provider: providerUsed,
      status: status,
      gateway_response_id: smsId,
      error_message: errorMessage,
      sent_at: new Date().toISOString(),
    });

    if (status === 'failed') {
      throw new Error(errorMessage || 'Failed to dispatch SMS');
    }

    return { success: true, smsId, provider: providerUsed };
  });

async function sendViaTextBee({ recipientPhone, message }: { recipientPhone: string; message: string }) {
  const apiKey = process.env.TEXTBEE_API_KEY;
  const deviceId = process.env.TEXTBEE_DEVICE_ID;
  if (!apiKey || !deviceId) throw new Error('TextBee credentials (TEXTBEE_API_KEY / TEXTBEE_DEVICE_ID) not set');

  const res = await fetch(`https://api.textbee.dev/api/v1/gateway/devices/${deviceId}/sendSMS`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      recipients: [recipientPhone],
      message: message,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'TextBee SMS dispatch failed');
  }
  return data.id || data.data?.id || 'tb-' + Date.now();
}

async function sendViaHttpSms({ recipientPhone, message }: { recipientPhone: string; message: string }) {
  const apiKey = process.env.HTTPSMS_API_KEY;
  const fromNumber = process.env.HTTPSMS_PHONE_NUMBER;
  if (!apiKey || !fromNumber) throw new Error('HttpSMS credentials (HTTPSMS_API_KEY / HTTPSMS_PHONE_NUMBER) not set');

  const res = await fetch('https://api.httpsms.com/v1/messages/send', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: fromNumber,
      to: recipientPhone,
      content: message,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.code || 'HttpSMS dispatch failed');
  }
  return data.data?.id || data.id || 'hs-' + Date.now();
}

async function sendViaFast2SMS({ recipientPhone, message }: { recipientPhone: string; message: string }) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) throw new Error('Fast2SMS API key (FAST2SMS_API_KEY) not set');

  const cleanPhone = recipientPhone.replace(/[^\d]/g, '').slice(-10);

  const res = await fetch(`https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=q&message=${encodeURIComponent(message)}&flash=0&numbers=${encodeURIComponent(cleanPhone)}`, {
    method: 'GET',
    headers: {
      'authorization': apiKey,
    },
  });

  const data = await res.json();
  if (!res.ok || !data.return) {
    throw new Error(data.message?.[0] || data.message || 'Fast2SMS dispatch failed');
  }
  return data.request_id || 'f2s-' + Date.now();
}

export const getSmsQuotaStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const startOfToday = new Date().toISOString().split('T')[0];

    const { data: logs } = await supabase
      .from('sms_logs')
      .select('provider, status, sent_at')
      .gte('sent_at', startOfMonth)
      .eq('status', 'sent');

    const totalSentThisMonth = logs?.length || 0;
    const textbeeSentThisMonth = logs?.filter((l: any) => l.provider === 'textbee').length || 0;
    const textbeeSentToday = logs?.filter((l: any) => l.provider === 'textbee' && l.sent_at?.startsWith(startOfToday)).length || 0;
    const httpsmsSentThisMonth = logs?.filter((l: any) => l.provider === 'httpsms').length || 0;

    const textbeeMonthQuota = 300;
    const textbeeDayQuota = 50;
    const httpsmsQuota = 200;

    return {
      totalSentThisMonth,
      textbeeSentThisMonth,
      textbeeSentToday,
      textbeeAvailableMonth: Math.max(0, textbeeMonthQuota - textbeeSentThisMonth),
      textbeeAvailableToday: Math.max(0, textbeeDayQuota - textbeeSentToday),
      httpsmsSentThisMonth,
      httpsmsAvailableMonth: Math.max(0, httpsmsQuota - httpsmsSentThisMonth),
      hasTextBee: !!(process.env.TEXTBEE_API_KEY && process.env.TEXTBEE_DEVICE_ID),
      hasHttpSms: !!(process.env.HTTPSMS_API_KEY && process.env.HTTPSMS_PHONE_NUMBER),
    };
  });

export const listSmsLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabase
      .from('sms_logs')
      .select('*')
      .order('sent_at', { ascending: false });
    if (error) return [];
    return data || [];
  });

export const deleteSmsLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabase.from('sms_logs').delete().eq('id', data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
