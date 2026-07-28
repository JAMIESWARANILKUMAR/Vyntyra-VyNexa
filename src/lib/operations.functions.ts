import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdminClient } from "@/integrations/supabase/admin";
import { generateUploadUrl } from "./r2";

const supabase = new Proxy({} as any, { get: (_, prop) => (getAdminClient() as any)[prop] });

const provisionSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["employee", "intern"]),
  full_name: z.string().min(2),
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

    // Fetch auth users for email and metadata
    const members = await Promise.all(
      roles.map(async (r: any) => {
        const { data: authUser } = await supabase.auth.admin.getUserById(r.user_id);
        const email = authUser?.user?.email || "";
        const full_name = authUser?.user?.user_metadata?.full_name || email.split("@")[0];

        // Also check profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", r.user_id)
          .single();

        return {
          id: r.user_id,
          email,
          full_name: profile?.full_name || full_name,
          role: r.role,
        };
      })
    );

    return members.filter((m: any) => m.email);
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
  full_name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  intern_id: z.string().optional(),
  end_date: z.string().optional(),
  offer_letter_url: z.string().optional(),
  avatar_url: z.string().optional(),
});

export const updateUserProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => profileUpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { id, ...updates } = data;
    const { error } = await supabase.from("profiles").update(updates).eq("id", id);
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


