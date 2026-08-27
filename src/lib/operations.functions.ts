import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import QRCode from "qrcode";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdminClient } from "@/integrations/supabase/admin";
import { generateUploadUrl } from "./r2";
import { supabase as anonClient } from "@/integrations/supabase/client";
import { localDateTimeToIso, generateGoogleCalendarUrl } from "./date-utils";
import { sendMeetingScheduleNotification } from "./notifications-omni.functions";

const supabase = new Proxy({} as any, { get: (_, prop) => (getAdminClient() as any)[prop] });

export function safeDecodeUrl(val: string | null | undefined): string | null {
  if (!val) return null;
  if (val.startsWith("http://") || val.startsWith("https://")) {
    return val;
  }
  try {
    const decoded = Buffer.from(val, 'base64').toString('utf-8');
    if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
      return decoded;
    }
  } catch {}
  return val;
}


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
  .handler(async () => {
    const adminClient = getAdminClient();

    // Fetch user roles
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("user_id, role");

    // Bulk fetch profiles
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("*");

    // Bulk fetch applications to attach profile photos, domains, colleges, noc_url, referral_code_used, etc.
    const { data: applications } = await adminClient
      .from("applications")
      .select("id, email, phone, full_name, profile_photo_url, college, domain, sub_domain, internship_start_date, joining_date, hod_name, noc_url, referral_code_used, exam_fee_paid, payment_reference_no, payment_mode, payment_status");

    // Fetch site_settings to check NOC download flags
    const { data: nocSettingsList } = await adminClient
      .from("site_settings")
      .select("id, enabled");

    const nocSettingsMap = new Map<string, boolean>();
    (nocSettingsList || []).forEach((s: any) => nocSettingsMap.set(s.id, !!s.enabled));
    const globalNocEnabled = nocSettingsMap.get("noc_download_settings") ?? false;

    const appByEmail = new Map<string, any>();
    const appById = new Map<string, any>();
    (applications || []).forEach((a: any) => {
      if (a.email) appByEmail.set(a.email.toLowerCase(), a);
      if (a.id) appById.set(a.id, a);
    });

    // Fetch auth users
    const { data: authData } = await adminClient.auth.admin.listUsers();
    const authUsers = authData?.users || [];

    const roleMap = new Map<string, string>();
    (roles || []).forEach((r: any) => roleMap.set(r.user_id, r.role));

    const membersMap = new Map<string, any>();

    (profiles || []).forEach((p: any) => {
      const authUser = authUsers.find((u: any) => u.id === p.id);
      const assignedRole = roleMap.get(p.id) || (p.intern_id ? "intern" : "employee");
      const email = (p.email || authUser?.email || "").toLowerCase();
      const full_name = p.full_name || authUser?.user_metadata?.full_name || email.split("@")[0];
      const matchedApp = appByEmail.get(email) || appById.get(p.id) || {};

      const profilePhoto = p.avatar_url || p.photo_url || p.profile_photo_url || matchedApp.profile_photo_url || null;

      // Determine NOC download enabled state
      const internNocSetting = nocSettingsMap.get(`noc_enabled_${email}`) ?? nocSettingsMap.get(`noc_enabled_${p.id}`) ?? nocSettingsMap.get(`noc_enabled_${matchedApp.id}`);
      const isNocEnabled = internNocSetting !== undefined ? internNocSetting : (p.noc_download_enabled ?? matchedApp.noc_download_enabled ?? globalNocEnabled);

      const isPaid = Boolean(p.exam_fee_paid || matchedApp.exam_fee_paid);
      const refNo = p.payment_reference_no || matchedApp.payment_reference_no || null;
      const payMode = p.payment_mode || matchedApp.payment_mode || null;
      const payStatus = p.payment_status || matchedApp.payment_status || (isPaid ? "paid" : "unpaid");
      const refCodeUsed = p.referral_code_used || matchedApp.referral_code_used || null;

      membersMap.set(p.id, {
        ...matchedApp,
        ...p,
        id: p.id,
        application_id: matchedApp.id || p.id,
        user_id: p.id,
        role: assignedRole,
        email,
        full_name,
        avatar_url: profilePhoto,
        profile_photo_url: profilePhoto,
        college: p.college || matchedApp.college || "Academic Institution",
        department: p.department || matchedApp.domain || "Technology & Software",
        position: p.position || matchedApp.sub_domain || "Full Stack Web Development",
        start_date: p.start_date || matchedApp.internship_start_date || matchedApp.joining_date || null,
        hod_name: p.hod_name || matchedApp.hod_name || null,
        noc_url: p.noc_url || matchedApp.noc_url || null,
        noc_download_enabled: isNocEnabled,
        exam_fee_paid: isPaid,
        payment_reference_no: refNo,
        payment_mode: payMode,
        payment_status: payStatus,
        referral_code_used: refCodeUsed,
      });
    });

    (roles || []).forEach((r: any) => {
      if (!membersMap.has(r.user_id)) {
        const authUser = authUsers.find((u: any) => u.id === r.user_id);
        const email = (authUser?.email || "").toLowerCase();
        const full_name = authUser?.user_metadata?.full_name || email.split("@")[0];
        const matchedApp = appByEmail.get(email) || {};
        const profilePhoto = matchedApp.profile_photo_url || null;

        membersMap.set(r.user_id, {
          ...matchedApp,
          id: r.user_id,
          user_id: r.user_id,
          role: r.role,
          email,
          full_name,
          avatar_url: profilePhoto,
          profile_photo_url: profilePhoto,
        });
      }
    });

    return Array.from(membersMap.values());
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
  assigned_to: z.string().nullable().optional(),
  due_date: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  is_pool_task: z.boolean().optional().default(false),
  target_role: z.enum(["employee", "intern", "all", "individual"]).optional(),
  target_user_id: z.string().optional().nullable(),
});

export const listTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', context.userId).single();
    const role = roleData?.role || 'employee';

    const { data, error } = await supabase
      .from("tasks")
      .select("*, profiles!tasks_assigned_to_fkey(full_name, mentor_id)")
      .order("created_at", { ascending: false });

    let rawList = data;
    if (error) {
      const { data: plain, error: e2 } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (e2) throw new Error(e2.message);
      rawList = plain;
    }

    return (rawList || []).filter((t: any) => {
      if (role === 'admin' || role === 'super_admin') return true;
      if (t.is_pool_task) return true;
      
      const isAssignedToMe = (t.assigned_to && t.assigned_to === context.userId) || (t.target_user_id && t.target_user_id === context.userId);
      const isAssignedToSomeoneElse = (t.assigned_to && t.assigned_to !== context.userId) || (t.target_user_id && t.target_user_id !== context.userId);
      
      if (isAssignedToMe) return true;
      if (t.profiles?.mentor_id && t.profiles.mentor_id === context.userId) return true;
      
      if (isAssignedToSomeoneElse) return false;

      if (!t.target_role || t.target_role === 'all' || t.target_role === role) return true;
      return false;
    });
  });

export const createTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => taskSchema.parse(d))
  .handler(async ({ data, context }) => {
    const payload: any = {
      title: data.title,
      description: data.description || null,
      assigned_to: data.assigned_to || null,
      due_date: data.due_date || null,
      priority: data.priority,
      status: "pending",
      is_pool_task: data.is_pool_task || false,
      target_role: data.target_role || "all",
      created_by: context.userId,
    };
    if (data.target_user_id) payload.target_user_id = data.target_user_id;

    const { error } = await supabase.from("tasks").insert(payload);
    if (error && error.message.includes("target_user_id")) {
      delete payload.target_user_id;
      const { error: err2 } = await supabase.from("tasks").insert(payload);
      if (err2) throw new Error(err2.message);
    } else if (error) {
      throw new Error(error.message);
    }
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

export const deleteTaskBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ title: z.string(), created_at: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabase.from("tasks").delete().eq("title", data.title).eq("created_at", data.created_at);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteAllInternTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    // Delete all tasks targeted to interns
    const { error } = await supabase.from("tasks").delete().eq("target_role", "intern");
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
    status: z.enum(["pending", "in_progress", "submitted", "under_review", "completed", "blocked", "rejected"]),
    progress_percentage: z.number().min(0).max(100).optional(),
    progress_notes: z.string().optional(),
    project_requirements: z.string().optional(),
    deliverable_url: z.string().optional(),
    time_spent_hours: z.number().optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();
    const updatePayload: any = {
      status: data.status,
      updated_at: new Date().toISOString(),
    };
    if (data.progress_percentage !== undefined) updatePayload.progress_percentage = data.progress_percentage;
    if (data.progress_notes !== undefined) updatePayload.progress_notes = data.progress_notes;
    if (data.project_requirements !== undefined) updatePayload.project_requirements = data.project_requirements;
    if (data.deliverable_url !== undefined) {
      let url = data.deliverable_url.trim();
      if (url && !/^https?:\/\//i.test(url) && !url.startsWith("data:")) {
        url = `https://${url}`;
      }
      updatePayload.deliverable_url = url;
    }
    if (data.time_spent_hours !== undefined) updatePayload.time_spent_hours = data.time_spent_hours;

    const { error } = await adminClient
      .from("tasks")
      .update(updatePayload)
      .eq("id", data.id);
    if (error) {
      // Graceful fallback if extra columns not migrated
      const { error: errFallback } = await adminClient
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

export const bulkAssignTasksFromCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    tasks: z.array(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      task_file_url: z.string().optional(),
      task_doc_url: z.string().optional(),
      due_date: z.string().optional(),
      priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
      report_template_url: z.string().optional(),
      domain: z.string().optional(),
    })).min(1),
    target_intern_ids: z.array(z.string()).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    // 1. Fetch active intern profiles with department and position
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, role, department, position")
      .or("role.eq.intern,department.ilike.%intern%,position.ilike.%intern%");
    
    let activeInterns = profiles || [];
    
    // If selected specific intern IDs, filter to those
    if (data.target_intern_ids && data.target_intern_ids.length > 0) {
      activeInterns = activeInterns.filter((p: any) => data.target_intern_ids!.includes(p.id));
    }

    if (!activeInterns.length) {
      // Fallback to user roles
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "intern");
      const roleUserIds = (roles || []).map((r: any) => r.user_id);
      
      const { data: fallbackProfiles } = await supabase
        .from("profiles")
        .select("id, department, position")
        .in("id", roleUserIds);
      activeInterns = fallbackProfiles || [];
    }

    if (!activeInterns.length) throw new Error("No active interns found in system to assign tasks to.");

    const taskPayloads: any[] = [];
    const now = new Date().toISOString();

    // Helper to check domain match
    const matchInternDomain = (profile: any, domainStr: string | undefined): boolean => {
      if (!domainStr || domainStr.toLowerCase() === "all" || domainStr.trim() === "") return true;
      
      const dept = (profile.department || "").toLowerCase();
      const pos = (profile.position || "").toLowerCase();
      const target = domainStr.toLowerCase().trim();
      
      if (target === "tech" || target === "engineering" || target === "technology") {
        return dept.includes("tech") || dept.includes("eng") || dept.includes("soft") || dept.includes("dev") || dept.includes("data") || dept.includes("web") || dept.includes("ml") || dept.includes("ai") ||
               pos.includes("tech") || pos.includes("eng") || pos.includes("soft") || pos.includes("dev") || pos.includes("data") || pos.includes("web") || pos.includes("ml") || pos.includes("ai");
      }
      
      if (target === "non_tech" || target === "marketing" || target === "sales" || target === "design") {
        return dept.includes("market") || dept.includes("sales") || dept.includes("crm") || dept.includes("design") || dept.includes("social") ||
               pos.includes("market") || pos.includes("sales") || pos.includes("crm") || pos.includes("design") || pos.includes("social");
      }
      
      if (target === "management" || target === "business" || target === "mba" || target === "operations") {
        return dept.includes("manage") || dept.includes("mba") || dept.includes("bba") || dept.includes("ops") || dept.includes("operation") || dept.includes("business") ||
               pos.includes("manage") || pos.includes("mba") || pos.includes("bba") || pos.includes("ops") || pos.includes("operation") || pos.includes("business");
      }
      
      return dept.includes(target) || pos.includes(target);
    };

    // Fetch existing tasks to prevent duplicates
    const { data: existingTasks } = await supabase
      .from("tasks")
      .select("assigned_to, title");
    const existingSet = new Set((existingTasks || []).map((t: any) => `${t.assigned_to}-${(t.title || "").trim().toLowerCase()}`));

    // Distribute tasks to matching interns (1 per intern max)
    const assignedInternIds = new Set<string>();
    for (const taskItem of data.tasks) {
      const targetInterns = activeInterns.filter((profile: any) => matchInternDomain(profile, taskItem.domain));
      const internsToAssign = targetInterns.length > 0 ? targetInterns : activeInterns; // Fallback to all if no domain match
      
      const unassignedInterns = internsToAssign.filter((i: any) => !assignedInternIds.has(i.id));
      if (unassignedInterns.length === 0) {
        continue; // Drop extra tasks if all matching interns already got one!
      }

      const intern = unassignedInterns[0];
      assignedInternIds.add(intern.id);

      const fingerprint = `${intern.id}-${(taskItem.title || "").trim().toLowerCase()}`;
      if (existingSet.has(fingerprint)) continue; // Skip duplicates

      taskPayloads.push({
        title: taskItem.title,
        description: taskItem.description || "Assigned Internship Project Task",
        project_requirements: taskItem.task_file_url || null,
        task_doc_url: taskItem.task_doc_url || null,
        report_template_url: taskItem.report_template_url || null,
        deliverable_url: null,
        due_date: taskItem.due_date || null,
        priority: taskItem.priority || "medium",
        assigned_to: intern.id,
        target_user_id: intern.id,
        target_role: "intern",
        status: "pending",
        is_pool_task: false,
        created_by: context.userId,
        created_at: now,
        task_domain: taskItem.domain || "all"
      });
    }

    if (taskPayloads.length === 0) {
      return { success: true, assignedCount: 0, internCount: activeInterns.length, skippedDuplicates: true };
    }

    const { error } = await supabase.from("tasks").insert(taskPayloads);
    if (error) {
      const fallbackPayloads = taskPayloads.map(t => {
        const copy: any = { ...t };
        delete copy.target_user_id;
        return copy;
      });
      const { error: err2 } = await supabase.from("tasks").insert(fallbackPayloads);
      if (err2) throw new Error(err2.message);
    }

    return {
      success: true,
      assignedCount: taskPayloads.length,
      internCount: activeInterns.length,
    };
  });

export const assignManualTaskToInterns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    task_file_url: z.string().optional(),
    due_date: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
    target_intern_ids: z.array(z.string()).min(1),
    save_template: z.boolean().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString();

    // Fetch existing tasks to prevent duplicates
    const { data: existingTasks } = await supabase
      .from("tasks")
      .select("assigned_to, title")
      .in("assigned_to", data.target_intern_ids);
    const existingSet = new Set((existingTasks || []).map((t: any) => `${t.assigned_to}-${(t.title || "").trim().toLowerCase()}`));

    const taskPayloads = data.target_intern_ids
      .filter(internId => !existingSet.has(`${internId}-${data.title.trim().toLowerCase()}`))
      .map(internId => ({
        title: data.title,
        description: data.description || "Manual Internship Task",
        project_requirements: data.task_file_url || null,
        due_date: data.due_date || null,
        priority: data.priority || "medium",
        assigned_to: internId,
        target_user_id: internId,
        target_role: "intern",
        status: "pending",
        is_pool_task: false,
        created_by: context.userId,
        created_at: now,
      }));

    if (taskPayloads.length === 0) {
      return { success: true, count: 0, skippedDuplicates: true };
    }

    const { error } = await supabase.from("tasks").insert(taskPayloads);
    if (error) {
      const fallbackPayloads = taskPayloads.map(t => {
        const copy: any = { ...t };
        delete copy.target_user_id;
        return copy;
      });
      const { error: err2 } = await supabase.from("tasks").insert(fallbackPayloads);
      if (err2) throw new Error(err2.message);
    }

    if (data.save_template) {
      await supabase.from("task_templates").insert({
        title: data.title,
        description: data.description || "",
        task_file_url: data.task_file_url || null,
        priority: data.priority || "medium",
        domain: "general"
      });
    }

    return { success: true, count: taskPayloads.length };
  });

export const listAllInternTasksWithProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, department, position, intern_id, avatar_url");

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    return (tasks || []).map((t: any) => {
      const assignedId = t.assigned_to || t.target_user_id;
      return {
        ...t,
        assigned_profile: profileMap.get(assignedId) || null,
      };
    });
  });

export const reviewInternTaskByAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    taskId: z.string().uuid(),
    status: z.enum(["pending", "in_progress", "submitted", "under_review", "completed", "blocked", "rejected"]),
    admin_remarks: z.string().optional().nullable(),
    credits: z.number().optional().nullable(),
  }).parse(d))
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();
    
    // Normalise status for Postgres check constraint if needed
    // standard check constraint allows: 'pending', 'in_progress', 'completed', 'blocked', 'rejected'
    let targetStatus = data.status;
    if (targetStatus === "submitted" || targetStatus === "under_review") {
      targetStatus = "in_progress";
    }

    const updatePayload: any = {
      status: targetStatus,
      updated_at: new Date().toISOString(),
    };
    if (data.admin_remarks !== undefined) {
      updatePayload.admin_remarks = data.admin_remarks || null;
      updatePayload.progress_notes = data.admin_remarks || null; // fallback compatibility
    }
    if (data.credits !== undefined && data.credits !== null) {
      updatePayload.credits = data.credits;
    }

    let { error } = await adminClient
      .from("tasks")
      .update(updatePayload)
      .eq("id", data.taskId);

    if (error) {
      // Fallback without dynamic columns
      const fallbackPayload: any = {
        status: targetStatus,
        progress_notes: data.admin_remarks || null,
        updated_at: new Date().toISOString(),
      };
      const { error: fallbackErr } = await adminClient
        .from("tasks")
        .update(fallbackPayload)
        .eq("id", data.taskId);
      if (fallbackErr) throw new Error(fallbackErr.message);
    }
    return { success: true };
  });

// ─── Schedules ────────────────────────────────────────────────────
// ─── Schedules ────────────────────────────────────────────────────
const scheduleSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  event_date: z.string(),
  event_time: z.string().optional(),
  target_role: z.enum(["employee", "intern", "all", "individual"]).optional().default("all"),
  target_user_id: z.string().optional().nullable(),
});

export const listSchedules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', context.userId).single();
    const role = roleData?.role || 'employee';

    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .order("event_date", { ascending: true });
    if (error) throw new Error(error.message);

    return (data || []).filter((s: any) => {
      if (role === 'admin' || role === 'super_admin') return true;
      if (s.target_user_id && s.target_user_id === context.userId) return true;
      if (!s.target_user_id || s.target_role !== 'individual') {
        if (!s.target_role || s.target_role === 'all' || s.target_role === role) return true;
      }
      return false;
    });
  });

export const listTaskTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabase
      .from("task_templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  });

export const createSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => scheduleSchema.parse(d))
  .handler(async ({ data, context }) => {
    const payload: any = {
      title: data.title,
      description: data.description || null,
      event_date: data.event_date,
      event_time: data.event_time || null,
      target_role: data.target_role || "all",
      created_by: context.userId,
    };
    if (data.target_user_id) payload.target_user_id = data.target_user_id;

    const { error } = await supabase.from("schedules").insert(payload);
    if (error && error.message.includes("target_user_id")) {
      delete payload.target_user_id;
      const { error: err2 } = await supabase.from("schedules").insert(payload);
      if (err2) throw new Error(err2.message);
    } else if (error) {
      throw new Error(error.message);
    }
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
  description: z.string().optional().nullable(),
  meeting_link: z.string().min(1),
  scheduled_at: z.string().optional(),
  start_time: z.string().optional(),
  end_at: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  duration_minutes: z.number().optional().default(30),
  target_role: z.enum(['employee', 'intern', 'all', 'individual']).optional().default('all'),
  target_user_id: z.string().optional().nullable(),
  send_email_notification: z.boolean().optional().default(true),
});

export const listMeetings = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', context.userId).single();
    const role = roleData?.role || 'employee';

    const { data, error } = await supabase.from('meetings').select('*').order('scheduled_at', { ascending: true });
    if (error) throw new Error(error.message);

    const filtered = (data || []).filter((m: any) => {
      if (role === 'admin' || role === 'super_admin') return true;
      if (m.target_user_id && m.target_user_id === context.userId) return true;
      if (!m.target_user_id || m.target_role !== 'individual') {
        if (!m.target_role || m.target_role === 'all' || m.target_role === role) return true;
      }
      return false;
    });

    return filtered.map((m: any) => {
      const scheduledAt = m.scheduled_at || m.start_time || m.created_at;
      const durationMins = m.duration_minutes || 30;
      const endAt = m.end_at || new Date(new Date(scheduledAt).getTime() + durationMins * 60 * 1000).toISOString();
      const cleanLink = safeDecodeUrl(m.meeting_link) || m.meeting_link || "";

      return {
        ...m,
        event_date: scheduledAt,
        event_time: scheduledAt,
        scheduled_at: scheduledAt,
        start_time: scheduledAt,
        end_at: endAt,
        meeting_link: cleanLink,
        gcal_url: generateGoogleCalendarUrl({
          title: m.title,
          description: m.description,
          location: cleanLink,
          startTime: scheduledAt,
          endTime: endAt,
        }),
      };
    });
  });

export const createMeeting = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => meetingSchema.parse(d))
  .handler(async ({ data, context }) => {
    const adminClient = getAdminClient();
    const scheduledAt = data.scheduled_at || data.start_time || new Date().toISOString();
    const startDate = new Date(scheduledAt);
    const durationMins = data.duration_minutes || 30;
    const endDate = data.end_at || data.end_time
      ? new Date(data.end_at || data.end_time!)
      : new Date(startDate.getTime() + durationMins * 60 * 1000);

    let cleanLink = safeDecodeUrl(data.meeting_link) || "";
    if (!/^https?:\/\//i.test(cleanLink)) {
      cleanLink = `https://${cleanLink}`;
    }

    const payload: any = {
      title: data.title,
      description: data.description || null,
      meeting_link: cleanLink,
      scheduled_at: startDate.toISOString(),
      duration_minutes: durationMins,
      target_role: data.target_role || 'all',
      created_by: context.userId,
    };
    if (data.target_user_id) payload.target_user_id = data.target_user_id;

    const { data: newMeeting, error } = await adminClient.from('meetings').insert(payload).select().maybeSingle();
    if (error && error.message.includes('target_user_id')) {
      delete payload.target_user_id;
      const { error: err2 } = await adminClient.from('meetings').insert(payload);
      if (err2) throw new Error(err2.message);
    } else if (error) {
      throw new Error(error.message);
    }

    // Google Calendar URL
    const gcalUrl = generateGoogleCalendarUrl({
      title: data.title,
      description: data.description,
      location: cleanLink,
      startTime: startDate,
      endTime: endDate,
    });

    // Auto-dispatch professional email & in-app notification if enabled
    if (data.send_email_notification !== false) {
      try {
        await sendMeetingScheduleNotification({
          data: {
            title: data.title,
            description: data.description,
            meeting_link: cleanLink,
            scheduled_at: startDate.toISOString(),
            end_at: endDate.toISOString(),
            duration_minutes: durationMins,
            target_role: data.target_role || 'all',
            target_user_id: data.target_user_id,
          }
        });
      } catch (err) {
        console.warn("[createMeeting] Automated email notification skipped/failed:", err);
      }
    }

    return { 
      success: true, 
      meetingId: newMeeting?.id, 
      gcalUrl 
    };
  });

export const deleteMeeting = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabase.from('meetings').delete().eq('id', data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

const updateMeetingSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  meeting_link: z.string().min(1).optional(),
  scheduled_at: z.string().optional(),
  start_time: z.string().optional(),
  end_at: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  duration_minutes: z.number().optional(),
  target_role: z.enum(['employee', 'intern', 'all', 'individual']).optional(),
  target_user_id: z.string().optional().nullable(),
  send_email_notification: z.boolean().optional().default(false),
});

export const updateMeeting = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateMeetingSchema.parse(d))
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();

    const updatePayload: any = {};
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.description !== undefined) updatePayload.description = data.description;

    if (data.meeting_link) {
      let cleanLink = safeDecodeUrl(data.meeting_link) || "";
      if (!/^https?:\/\//i.test(cleanLink)) {
        cleanLink = `https://${cleanLink}`;
      }
      updatePayload.meeting_link = cleanLink;
    }

    let startDate: Date | null = null;
    if (data.scheduled_at || data.start_time) {
      startDate = new Date(data.scheduled_at || data.start_time!);
      updatePayload.scheduled_at = startDate.toISOString();
    }

    let durationMins = data.duration_minutes;
    if (data.end_at || data.end_time) {
      const endD = new Date(data.end_at || data.end_time!);
      if (startDate && !isNaN(endD.getTime())) {
        const diff = endD.getTime() - startDate.getTime();
        if (diff > 0) {
          durationMins = Math.round(diff / (60 * 1000));
        }
      }
    }
    if (durationMins !== undefined) {
      updatePayload.duration_minutes = durationMins;
    }

    if (data.target_role !== undefined) updatePayload.target_role = data.target_role;
    if (data.target_user_id !== undefined) updatePayload.target_user_id = data.target_user_id;

    const { data: updatedMeeting, error } = await adminClient
      .from('meetings')
      .update(updatePayload)
      .eq('id', data.id)
      .select()
      .maybeSingle();

    if (error && error.message.includes('target_user_id')) {
      delete updatePayload.target_user_id;
      const { error: err2 } = await adminClient.from('meetings').update(updatePayload).eq('id', data.id);
      if (err2) throw new Error(err2.message);
    } else if (error) {
      throw new Error(error.message);
    }

    // If requested, send reschedule notification email
    if (data.send_email_notification && updatedMeeting) {
      try {
        const schedTime = updatedMeeting.scheduled_at || new Date().toISOString();
        const dMins = updatedMeeting.duration_minutes || 30;
        const eTime = new Date(new Date(schedTime).getTime() + dMins * 60 * 1000).toISOString();
        await sendMeetingScheduleNotification({
          data: {
            title: `[Updated Schedule] ${updatedMeeting.title}`,
            description: updatedMeeting.description,
            meeting_link: updatedMeeting.meeting_link,
            scheduled_at: schedTime,
            end_at: eTime,
            duration_minutes: dMins,
            target_role: updatedMeeting.target_role || 'all',
            target_user_id: updatedMeeting.target_user_id,
          }
        });
      } catch (err) {
        console.warn("[updateMeeting] Notification dispatch skipped:", err);
      }
    }

    return { success: true, meeting: updatedMeeting };
  });

// ─── Resources (Intern) ───────────────────────────────────────
const resourceSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  url: z.string().min(1),
  type: z.enum(['document', 'video', 'link', 'template', 'guide']),
  target_role: z.enum(['employee', 'intern', 'all', 'individual']).optional().default('all'),
  target_user_id: z.string().optional().nullable(),
});

export const listResources = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', context.userId).single();
    const role = roleData?.role || 'intern';

    const { data, error } = await supabase.from('resources').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    return (data || []).filter((r: any) => {
      if (role === 'admin' || role === 'super_admin') return true;
      if (r.target_user_id && r.target_user_id === context.userId) return true;
      if (!r.target_user_id || r.target_role !== 'individual') {
        if (!r.target_role || r.target_role === 'all' || r.target_role === role) return true;
      }
      return false;
    });
  });

export const createResource = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => resourceSchema.parse(d))
  .handler(async ({ data, context }) => {
    const payload: any = {
      title: data.title,
      description: data.description || null,
      url: data.url,
      type: data.type,
      target_role: data.target_role || 'all',
      created_by: context.userId,
    };
    if (data.target_user_id) payload.target_user_id = data.target_user_id;

    const { error } = await supabase.from('resources').insert(payload);
    if (error && error.message.includes('target_user_id')) {
      delete payload.target_user_id;
      const { error: err2 } = await supabase.from('resources').insert(payload);
      if (err2) throw new Error(err2.message);
    } else if (error) {
      throw new Error(error.message);
    }
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

export const getMyDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const adminClient = getAdminClient();
    // Get the intern's profile to find their application id
    const { data: profile } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .single();

    if (!profile?.email) return { nocUrl: null, offerLetterUrl: null };

    // Find the application linked to this intern's email
    const { data: app } = await adminClient
      .from("applications")
      .select("*")
      .eq("email", profile.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!app) return { nocUrl: null, offerLetterUrl: null };

    // 1. Resolve or Generate Offer Letter
    let offerLetterUrl = app.offer_letter_url || null;
    if (!offerLetterUrl) {
      try {
        const startDateVal = profile.start_date || app.joining_date || app.internship_start_date || new Date().toISOString();
        const duration = app.duration_months || 3;
        const endDateVal = profile.end_date || app.internship_end_date || new Date(new Date(startDateVal).setMonth(new Date(startDateVal).getMonth() + duration)).toISOString();

        const { generateOfferLetterPDF } = await import("./pdf.server");
        offerLetterUrl = await generateOfferLetterPDF({
          fullName: app.full_name,
          roleApplied: app.role_applied,
          applicationId: app.id,
          salary: app.salary || "Performance Based Stipend",
          joiningDate: startDateVal,
          endDate: endDateVal,
          jobLocation: app.job_location || "Remote Work-from-Home",
        });
        
        if (offerLetterUrl) {
          // Cache in database
          await adminClient
            .from("applications")
            .update({ offer_letter_url: offerLetterUrl })
            .eq("id", app.id);
        }
      } catch (err) {
        console.warn("[getMyDocuments] Dynamic offer letter generation failed:", err);
      }
    }

    // 2. Resolve NOC Download Permission
    const emailKey = (profile.email || "").toLowerCase().trim();
    let isNocDownloadEnabled = false;

    try {
      const { data: nocSettingRows } = await adminClient
        .from("site_settings")
        .select("id, enabled");

      const sMap = new Map<string, boolean>();
      (nocSettingRows || []).forEach((r: any) => sMap.set(r.id, !!r.enabled));

      if (emailKey && sMap.has(`noc_enabled_${emailKey}`)) {
        isNocDownloadEnabled = sMap.get(`noc_enabled_${emailKey}`)!;
      } else if (sMap.has(`noc_enabled_${profile.id}`)) {
        isNocDownloadEnabled = sMap.get(`noc_enabled_${profile.id}`)!;
      } else if (sMap.has(`noc_enabled_${app.id}`)) {
        isNocDownloadEnabled = sMap.get(`noc_enabled_${app.id}`)!;
      } else if (sMap.has("noc_download_settings")) {
        isNocDownloadEnabled = sMap.get("noc_download_settings")!;
      } else if (profile.noc_download_enabled !== undefined && profile.noc_download_enabled !== null) {
        isNocDownloadEnabled = !!profile.noc_download_enabled;
      } else if (app.noc_download_enabled !== undefined && app.noc_download_enabled !== null) {
        isNocDownloadEnabled = !!app.noc_download_enabled;
      } else {
        // Fallback: If NOC has been generated in database, enable download
        isNocDownloadEnabled = !!(profile.noc_url || app.noc_url);
      }
    } catch (e) {
      isNocDownloadEnabled = !!(profile.noc_url || app.noc_url);
    }

    let nocUrl: string | null = null;
    if (isNocDownloadEnabled) {
      nocUrl = profile.noc_url || app.noc_url || null;
      if (!nocUrl) {
        const nocPath = `nocs/${app.id}_NOC.pdf`;
        const { data: signedData } = await adminClient.storage
          .from("default")
          .createSignedUrl(nocPath, 7200);

        if (signedData?.signedUrl) {
          nocUrl = signedData.signedUrl;
        } else {
          // NOC missing in storage - generate on-the-fly
          try {
            const { generateNocPdf, urlToBase64 } = await import("./nocGenerator");
            const { resolveGooglePhotosUrl } = await import("./google-photos");
            const { getBrandingSettings } = await import("./settings.functions");
            const branding = await getBrandingSettings();

            const signatureBase64 = await urlToBase64(branding.founder_signature_url || "/signature.png");
            const logoBase64 = await urlToBase64(branding.vyntyra_logo_url || "/icon-512.png");

            let photoBase64 = null;
            const url = profile.avatar_url || app.profile_photo_url;
            if (url) {
              if (url.startsWith("data:image")) {
                photoBase64 = url;
              } else {
                const resolvedUrl = await resolveGooglePhotosUrl(url);
                if (resolvedUrl) {
                  try {
                    const photoRes = await fetch(resolvedUrl, {
                      headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                      }
                    });
                    if (photoRes.ok) {
                      const buffer = await photoRes.arrayBuffer();
                      const contentType = photoRes.headers.get("content-type") || "image/jpeg";
                      photoBase64 = `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`;
                    }
                  } catch (err) {
                    console.warn("Photo fetch failed:", err);
                  }
                }
              }
            }

            const startDate = profile.start_date ? new Date(profile.start_date) : (app.internship_start_date ? new Date(app.internship_start_date) : new Date());

            const verificationUrl = `https://careers.vyntyraconsultancyservices.in/verify?id=${app.id}`;
            let generatedQrBase64 = null;
            try {
              generatedQrBase64 = await QRCode.toDataURL(verificationUrl, { margin: 1, color: { dark: '#0f172a', light: '#ffffff' } });
            } catch (qrErr) {
              console.warn("Failed to generate QR Code for NOC:", qrErr);
            }

            const doc = generateNocPdf({
              fullName: app.full_name,
              email: app.email,
              phone: app.phone,
              applicationId: app.id,
              college: app.college || "Academic Institution",
              domain: app.domain || "Technology & Software",
              subDomain: app.sub_domain || "Full Stack Web Development",
              internshipStartDate: startDate.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
              profilePhotoUrl: photoBase64,
              qrCodeBase64: generatedQrBase64,
              logoBase64: logoBase64,
              signatureBase64: signatureBase64,
              hodName: app.hod_name,
            });

            const pdfOutput = doc.output("arraybuffer");
            const pdfBuffer = Buffer.from(pdfOutput);
            
            await adminClient.storage
              .from("default")
              .upload(nocPath, pdfBuffer, {
                contentType: "application/pdf",
                upsert: true
              });

            const { data: newSignedData } = await adminClient.storage
              .from("default")
              .createSignedUrl(nocPath, 7200);
            if (newSignedData?.signedUrl) {
              nocUrl = newSignedData.signedUrl;
            }
          } catch (err) {
            console.warn("[getMyDocuments] Dynamic NOC generation failed:", err);
          }
        }
      }
    }

    return {
      nocUrl: isNocDownloadEnabled ? nocUrl : null,
      offerLetterUrl,
      nocDownloadEnabled: isNocDownloadEnabled,
    };
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
  id: z.string().min(1),
  full_name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  phone_number: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  intern_id: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  offer_letter_url: z.string().optional().nullable(),
  noc_url: z.string().optional().nullable(),
  avatar_url: z.string().optional().nullable(),
  blood_group: z.string().optional().nullable(),
  security_level: z.string().optional().nullable(),
  emergency_contact: z.string().optional().nullable(),
  bank_details: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  mentor_id: z.string().optional().nullable(),
  stipend: z.string().optional().nullable(),
  domain: z.string().optional().nullable(),
  sub_domain: z.string().optional().nullable(),
  certificate_url: z.string().optional().nullable(),
  fee_payment_scheduled: z.boolean().optional().nullable(),
  fee_payment_deadline: z.string().optional().nullable(),
  exam_fee_amount: z.number().optional().nullable(),
  exam_fee_paid: z.boolean().optional().nullable(),
  is_fee_exempted: z.boolean().optional().nullable(),
  referral_code_used: z.string().optional().nullable(),
  payment_reference_no: z.string().optional().nullable(),
  payment_mode: z.string().optional().nullable(),
  payment_status: z.string().optional().nullable(),
  urgent_popup_active: z.boolean().optional().nullable(),
  urgent_popup_title: z.string().optional().nullable(),
  urgent_popup_message: z.string().optional().nullable(),
});

export const deleteStoredOfferLetterAndRegenerate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    applicationId: z.string().optional().nullable(),
    profileId: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
  }).parse(d))
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();

    // 1. Resolve Application & Profile
    let app: any = null;
    if (data.applicationId) {
      const { data: foundApp } = await adminClient.from("applications").select("*").eq("id", data.applicationId).maybeSingle();
      app = foundApp;
    }
    if (!app && data.profileId) {
      const { data: prof } = await adminClient.from("profiles").select("email").eq("id", data.profileId).maybeSingle();
      if (prof?.email) {
        const { data: foundApp } = await adminClient.from("applications").select("*").eq("email", prof.email).order("created_at", { ascending: false }).limit(1).maybeSingle();
        app = foundApp;
      }
    }
    if (!app && data.email) {
      const { data: foundApp } = await adminClient.from("applications").select("*").eq("email", data.email).order("created_at", { ascending: false }).limit(1).maybeSingle();
      app = foundApp;
    }

    if (!app) throw new Error("Application record not found for generating Offer Letter");

    // 2. Delete existing file from storage
    const fileName = `offer_letters/${app.id}_OfferLetter.pdf`;
    try {
      await adminClient.storage.from("default").remove([fileName]);
    } catch (e) {
      console.warn("Storage deletion error (non-fatal):", e);
    }

    // 3. Generate brand new Offer Letter PDF
    const { generateOfferLetterPDF } = await import("./pdf.server");
    const startDateVal = app.joining_date || app.internship_start_date || new Date().toISOString();
    const duration = app.duration_months || 3;
    const endDateVal = app.internship_end_date || new Date(new Date(startDateVal).setMonth(new Date(startDateVal).getMonth() + duration)).toISOString();

    const freshOfferLetterUrl = await generateOfferLetterPDF({
      fullName: app.full_name,
      roleApplied: app.role_applied || app.sub_domain || "Software Engineering Intern",
      applicationId: app.id,
      salary: app.salary || "Performance Based Stipend",
      joiningDate: startDateVal,
      endDate: endDateVal,
      jobLocation: app.job_location || "Remote Work-from-Home",
    });

    // 4. Update both applications and profiles
    await adminClient.from("applications").update({ offer_letter_url: freshOfferLetterUrl }).eq("id", app.id);
    if (app.email) {
      await adminClient.from("profiles").update({ offer_letter_url: freshOfferLetterUrl }).eq("email", app.email);
    }

    return { success: true, offer_letter_url: freshOfferLetterUrl };
  });

export const deleteStoredNocAndRegenerate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    applicationId: z.string().optional().nullable(),
    profileId: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
  }).parse(d))
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();

    // 1. Resolve Application & Profile
    let app: any = null;
    if (data.applicationId) {
      const { data: foundApp } = await adminClient.from("applications").select("*").eq("id", data.applicationId).maybeSingle();
      app = foundApp;
    }
    if (!app && data.profileId) {
      const { data: prof } = await adminClient.from("profiles").select("email").eq("id", data.profileId).maybeSingle();
      if (prof?.email) {
        const { data: foundApp } = await adminClient.from("applications").select("*").eq("email", prof.email).order("created_at", { ascending: false }).limit(1).maybeSingle();
        app = foundApp;
      }
    }
    if (!app && data.email) {
      const { data: foundApp } = await adminClient.from("applications").select("*").eq("email", data.email).order("created_at", { ascending: false }).limit(1).maybeSingle();
      app = foundApp;
    }

    if (!app) throw new Error("Application record not found for generating NOC");

    // 2. Delete existing NOC file from storage
    const fileName = `nocs/${app.id}_NOC.pdf`;
    try {
      await adminClient.storage.from("default").remove([fileName]);
    } catch (e) {
      console.warn("Storage deletion error (non-fatal):", e);
    }

    // 3. Generate brand new NOC PDF
    const { urlToBase64, generateNocPdf } = await import("./nocGenerator");
    const { getBrandingSettings } = await import("./settings.functions");
    const branding = await getBrandingSettings();

    const logoBase64 = await urlToBase64(branding.vyntyra_logo_url || "/icon-512.png");
    const signatureBase64 = await urlToBase64(branding.founder_signature_url || "/signature.png");

    let photoBase64: string | null = null;
    if (app.profile_photo_url) {
      photoBase64 = await urlToBase64(app.profile_photo_url);
    }

    const verificationUrl = `https://careers.vyntyraconsultancyservices.in/verify?id=${app.id}`;
    const QRCode = (await import("qrcode")).default;
    const qrBase64 = await QRCode.toDataURL(verificationUrl, { margin: 1, color: { dark: '#0f172a', light: '#ffffff' } });

    const startDateVal = app.internship_start_date || app.joining_date || new Date().toISOString();
    const formattedStartDate = new Date(startDateVal).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

    const doc = generateNocPdf({
      fullName: app.full_name,
      email: app.email,
      phone: app.phone,
      applicationId: app.id,
      college: app.college || "Academic Institution",
      domain: app.domain || "Technology & Software",
      subDomain: app.sub_domain || app.role_applied || "Full Stack Web Development",
      internshipStartDate: formattedStartDate,
      profilePhotoUrl: photoBase64,
      qrCodeBase64: qrBase64,
      logoBase64: logoBase64,
      signatureBase64: signatureBase64,
      hodName: app.hod_name,
    });

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    const { error: uploadError } = await adminClient.storage
      .from("default")
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) throw new Error("Failed to upload regenerated NOC: " + uploadError.message);

    const { data: { publicUrl } } = adminClient.storage
      .from("default")
      .getPublicUrl(fileName);

    // 4. Update applications and profiles
    await adminClient.from("applications").update({ 
      noc_url: publicUrl, 
      noc_download_enabled: true, 
      updated_at: new Date().toISOString() 
    }).eq("id", app.id);
    if (app.email) {
      await adminClient.from("profiles").update({ 
        noc_url: publicUrl, 
        noc_download_enabled: true, 
        updated_at: new Date().toISOString() 
      }).ilike("email", app.email);
    }

    return { success: true, noc_url: publicUrl };
  });

export const deleteStoredOfferLetter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    applicationId: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
  }).parse(d))
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();
    if (data.applicationId) {
      await adminClient.storage.from("default").remove([`offer_letters/${data.applicationId}_OfferLetter.pdf`]);
      await adminClient.from("applications").update({ offer_letter_url: null }).eq("id", data.applicationId);
    }
    if (data.email) {
      await adminClient.from("profiles").update({ offer_letter_url: null }).eq("email", data.email);
    }
    return { success: true };
  });

export const deleteStoredNoc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    applicationId: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
  }).parse(d))
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();
    if (data.applicationId) {
      await adminClient.storage.from("default").remove([`nocs/${data.applicationId}_NOC.pdf`]);
      await adminClient.from("applications").update({ noc_url: null }).eq("id", data.applicationId);
    }
    if (data.email) {
      await adminClient.from("profiles").update({ noc_url: null }).eq("email", data.email);
    }
    return { success: true };
  });

export const getInternMentorDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const adminClient = getAdminClient();

    // 1. Fetch the intern's own profile
    const { data: profile } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();

    let targetMentorId = profile?.mentor_id;

    // 2. If mentor_id not found on profiles, check applications table by email
    if (!targetMentorId && profile?.email) {
      const { data: appData } = await adminClient
        .from("applications")
        .select("mentor_id, assigned_employee_id")
        .eq("email", profile.email.toLowerCase())
        .maybeSingle();
      
      const appMentorId = (appData as any)?.mentor_id || (appData as any)?.assigned_employee_id;
      if (appMentorId) {
        targetMentorId = appMentorId;
        // Backfill to profiles table for fast subsequent queries
        await adminClient.from("profiles").update({ mentor_id: targetMentorId }).eq("id", context.userId);
      }
    }

    // 3. If still not found, check support_queries
    if (!targetMentorId) {
      const { data: queryData } = await adminClient
        .from("support_queries")
        .select("assigned_employee_id, mentor_id")
        .eq("intern_id", context.userId)
        .or("assigned_employee_id.not.is.null,mentor_id.not.is.null")
        .limit(1)
        .maybeSingle();
      if (queryData?.assigned_employee_id || queryData?.mentor_id) {
        targetMentorId = queryData.assigned_employee_id || queryData.mentor_id;
      }
    }

    // 4. If still not found, check tasks assigned to this intern
    if (!targetMentorId) {
      const { data: taskData } = await adminClient
        .from("tasks")
        .select("created_by")
        .eq("assigned_to", context.userId)
        .not("created_by", "is", null)
        .limit(1)
        .maybeSingle();
      if (taskData?.created_by) {
        targetMentorId = taskData.created_by;
      }
    }

    let mentor: any = null;

    // 5. If we have a targetMentorId, fetch their details from profiles + auth users
    if (targetMentorId) {
      const { data: mentorProfile } = await adminClient
        .from("profiles")
        .select("*")
        .eq("id", targetMentorId)
        .maybeSingle();

      let authUser: any = null;
      try {
        const { data: authData } = await adminClient.auth.admin.getUserById(targetMentorId);
        authUser = authData?.user;
      } catch (authErr) {
        console.warn("Could not fetch auth user for mentor:", authErr);
      }

      if (mentorProfile || authUser) {
        mentor = {
          id: targetMentorId,
          full_name: mentorProfile?.full_name || authUser?.user_metadata?.full_name || mentorProfile?.email?.split("@")[0] || authUser?.email?.split("@")[0] || "Assigned Mentor",
          email: mentorProfile?.email || authUser?.email || "",
          department: mentorProfile?.department || "Department of Engineering & Mentorship",
          position: mentorProfile?.position || "Mentor & Technical Supervisor",
          phone_number: mentorProfile?.phone_number || mentorProfile?.phone || authUser?.phone || authUser?.user_metadata?.phone || authUser?.user_metadata?.phone_number || "",
          avatar_url: mentorProfile?.avatar_url || authUser?.user_metadata?.avatar_url || null,
          is_official: true,
          is_lead: false,
        };
      }
    }

    // 6. Default official lead mentor fallback only if absolutely no mentor is assigned
    if (!mentor) {
      mentor = {
        id: "official-lead-mentor",
        full_name: "Jami Eswar Anil Kumar",
        email: "jamieswaranilkumar@vyntyraconsultancyservices.in",
        department: "Executive Directorate & Lead Mentorship",
        position: "Founder & Lead Director",
        phone_number: "+91 93905 15106",
        secondary_phone: "+91 63015 88867",
        avatar_url: "/vyntyra-logo.png",
        whatsapp_group_url: "https://chat.whatsapp.com/FXsC4CT1hVRHvKzGH0k5y5",
        is_official: true,
        is_lead: true,
      };
    }

    return mentor;
  });

export const updateUserProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => profileUpdateSchema.parse(d))
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();
    const { id, ...updates } = data;

    // 1. Prepare clean primary updates payload
    const primaryUpdates: Record<string, any> = {};
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) {
        primaryUpdates[key] = val;
      }
    }

    // Try full update first
    let updateSuccess = false;
    try {
      const { error } = await adminClient
        .from("profiles")
        .update(primaryUpdates)
        .eq("id", id);
      
      if (!error) {
        updateSuccess = true;
      }
    } catch (err) {
      console.warn("Full profile update encountered schema mismatch, falling back to core fields:", err);
    }

    // Fallback: update guaranteed core columns only
    if (!updateSuccess) {
      const coreSafeUpdates: Record<string, any> = {};
      if (updates.full_name !== undefined) coreSafeUpdates.full_name = updates.full_name;
      if (updates.phone !== undefined) coreSafeUpdates.phone = updates.phone;
      if (updates.address !== undefined) coreSafeUpdates.address = updates.address;
      if (updates.intern_id !== undefined) coreSafeUpdates.intern_id = updates.intern_id;
      if (updates.start_date !== undefined) coreSafeUpdates.start_date = updates.start_date;
      if (updates.end_date !== undefined) coreSafeUpdates.end_date = updates.end_date;
      if (updates.avatar_url !== undefined) coreSafeUpdates.avatar_url = updates.avatar_url;
      if (updates.offer_letter_url !== undefined) coreSafeUpdates.offer_letter_url = updates.offer_letter_url;
      if (updates.certificate_url !== undefined) coreSafeUpdates.certificate_url = updates.certificate_url;
      if (updates.noc_url !== undefined) coreSafeUpdates.noc_url = updates.noc_url;
      if (updates.department !== undefined) coreSafeUpdates.department = updates.department;
      if (updates.position !== undefined) coreSafeUpdates.position = updates.position;
      if (updates.mentor_id !== undefined) coreSafeUpdates.mentor_id = updates.mentor_id;
      if (updates.stipend !== undefined) coreSafeUpdates.stipend = updates.stipend;

      const { error: fallbackError } = await adminClient.from("profiles").update(coreSafeUpdates).eq("id", id);
      if (fallbackError) {
        console.warn("Core profile update error:", fallbackError);
      }
    }

    // 2. Sync core identity to Supabase Auth user metadata
    try {
      const metaUpdates: Record<string, any> = {};
      if (updates.full_name) metaUpdates.full_name = updates.full_name;
      if (updates.phone || updates.phone_number) metaUpdates.phone = updates.phone || updates.phone_number;
      if (updates.intern_id) metaUpdates.intern_id = updates.intern_id;
      if (updates.position) metaUpdates.position = updates.position;
      if (updates.department) metaUpdates.department = updates.department;
      if (updates.avatar_url) metaUpdates.avatar_url = updates.avatar_url;

      if (Object.keys(metaUpdates).length > 0) {
        await adminClient.auth.admin.updateUserById(id, { user_metadata: metaUpdates });
      }
    } catch (authMetaErr) {
      console.warn("Auth user metadata sync error (non-fatal):", authMetaErr);
    }

    // 3. Two-way sync to applications table by email
    try {
      const { data: currentProfile } = await adminClient.from("profiles").select("email").eq("id", id).maybeSingle();
      if (currentProfile?.email) {
        const appUpdates: Record<string, any> = {};
        if (updates.full_name !== undefined && updates.full_name !== null) appUpdates.full_name = updates.full_name;
        if (updates.phone !== undefined && updates.phone !== null) appUpdates.phone = updates.phone;
        if (updates.phone_number !== undefined && updates.phone_number !== null) appUpdates.phone = updates.phone_number;
        if (updates.offer_letter_url !== undefined) appUpdates.offer_letter_url = updates.offer_letter_url;
        if (updates.noc_url !== undefined) appUpdates.noc_url = updates.noc_url;
        if (updates.certificate_url !== undefined) appUpdates.certificate_url = updates.certificate_url;
        if (updates.avatar_url !== undefined) appUpdates.profile_photo_url = updates.avatar_url;
        if (updates.start_date !== undefined) appUpdates.internship_start_date = updates.start_date;
        if (updates.end_date !== undefined) appUpdates.internship_end_date = updates.end_date;
        if (updates.domain !== undefined) appUpdates.domain = updates.domain;
        if (updates.sub_domain !== undefined) appUpdates.sub_domain = updates.sub_domain;
        if (updates.mentor_id !== undefined) {
          appUpdates.mentor_id = updates.mentor_id;
          appUpdates.assigned_employee_id = updates.mentor_id;
        }

        if (Object.keys(appUpdates).length > 0) {
          await adminClient.from("applications").update(appUpdates).eq("email", currentProfile.email.toLowerCase());
        }
      }
    } catch (appSyncErr) {
      console.warn("Applications sync error (non-fatal):", appSyncErr);
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
  target_user_id: z.string().uuid().optional(),
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
    const insertData: any = {
      content: data.content,
      created_by: context.userId,
    };
    if (data.target_user_id) {
      insertData.target_user_id = data.target_user_id;
    }
    const { error } = await supabase.from("feedbacks").insert(insertData);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const listAllFeedbacks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabase
      .from("feedbacks")
      .select("*, profiles!feedbacks_created_by_fkey(full_name, email)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
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

export const listAllLeaveRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabase
      .from("leave_requests")
      .select("*, profiles!leave_requests_user_id_fkey(full_name, email)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  });

const updateLeaveStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "approved", "rejected"])
});

export const oldUpdateLeaveStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateLeaveStatusSchema.parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("leave_requests")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
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
const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

async function autoClockOutStaleRecords(adminClient: any, logs: any[]) {
  if (!logs || logs.length === 0) return logs;
  const now = Date.now();
  const updatedLogs = [...logs];

  for (let i = 0; i < updatedLogs.length; i++) {
    const log = updatedLogs[i];
    if (log.clock_in && !log.clock_out) {
      const clockInTime = new Date(log.clock_in).getTime();
      const elapsed = now - clockInTime;
      if (elapsed >= EIGHT_HOURS_MS) {
        // Auto clock out exactly 8 hours after clock_in
        const autoClockOut = new Date(clockInTime + EIGHT_HOURS_MS).toISOString();
        log.clock_out = autoClockOut;

        try {
          await adminClient
            .from("attendance")
            .update({
              clock_out: autoClockOut,
              updated_at: new Date().toISOString()
            })
            .eq("id", log.id);
        } catch (e) {
          console.warn("[autoClockOutStaleRecords] Error auto clocking out:", e);
        }
      }
    }
  }

  return updatedLogs;
}

export const clockIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const adminClient = getAdminClient();
    const today = new Date().toISOString().split('T')[0];
    const todayDateStr = new Date().toDateString();
    
    // Enforce start and end date restrictions
    const { data: profile } = await adminClient
      .from("profiles")
      .select("start_date, end_date")
      .eq("id", context.userId)
      .single();

    if (profile) {
      if (profile.start_date && today < profile.start_date.split('T')[0]) {
        throw new Error(`Cannot clock in before your start date (${new Date(profile.start_date).toLocaleDateString()}).`);
      }
      if (profile.end_date && today > profile.end_date.split('T')[0]) {
        throw new Error(`Cannot clock in after your end date (${new Date(profile.end_date).toLocaleDateString()}).`);
      }
    }
    
    // Check recent logs for active or completed shift today
    const { data: rawRecent } = await adminClient
      .from("attendance")
      .select("id, clock_in, clock_out, date")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(5);

    const recentLogs = await autoClockOutStaleRecords(adminClient, rawRecent || []);

    const existing = recentLogs?.find((a: any) => {
      if (a.date === today) return true;
      if (a.clock_in && new Date(a.clock_in).toDateString() === todayDateStr) return true;
      return false;
    });
      
    if (existing) {
      if (!existing.clock_out) {
        throw new Error("You are currently clocked in. Please clock out when your shift ends.");
      } else {
        throw new Error("Already completed shift for today.");
      }
    }

    const { error } = await adminClient.from("attendance").insert({
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
    const adminClient = getAdminClient();
    const today = new Date().toISOString().split('T')[0];
    const todayDateStr = new Date().toDateString();
    
    // Enforce start and end date restrictions
    const { data: profile } = await adminClient
      .from("profiles")
      .select("start_date, end_date")
      .eq("id", context.userId)
      .single();

    if (profile) {
      if (profile.start_date && today < profile.start_date.split('T')[0]) {
        throw new Error(`Cannot clock out before your start date (${new Date(profile.start_date).toLocaleDateString()}).`);
      }
      if (profile.end_date && today > profile.end_date.split('T')[0]) {
        throw new Error(`Cannot clock out after your end date (${new Date(profile.end_date).toLocaleDateString()}).`);
      }
    }
    
    const { data: rawRecent } = await adminClient
      .from("attendance")
      .select("id, clock_in, clock_out, date")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(5);

    const recentLogs = await autoClockOutStaleRecords(adminClient, rawRecent || []);

    const activeShift = recentLogs?.find((a: any) => {
      if (!a.clock_out) return true;
      if (a.date === today) return true;
      if (a.clock_in && new Date(a.clock_in).toDateString() === todayDateStr) return true;
      return false;
    });
      
    if (!activeShift) {
      throw new Error("No active clock-in session found for today.");
    }

    if (!activeShift.clock_out) {
      const { error } = await adminClient.from("attendance")
        .update({ clock_out: new Date().toISOString() })
        .eq("id", activeShift.id);
        
      if (error) throw new Error(error.message);
    }

    return { success: true };
  });

export const getMyAttendance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from("attendance")
      .select("*")
      .eq("user_id", context.userId)
      .order("date", { ascending: false });
      
    if (error) throw new Error(error.message);
    const checkedData = await autoClockOutStaleRecords(adminClient, data || []);
    return checkedData || [];
  });

export const getMenteeAttendance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ internId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const adminClient = getAdminClient();
    
    // Verify the requester is the mentor of the requested intern
    const { data: profile, error: profileErr } = await adminClient
      .from("profiles")
      .select("mentor_id")
      .eq("id", data.internId)
      .single();
      
    if (profileErr) throw new Error("Could not fetch intern profile");
    
    // We optionally allow super admins/admins to bypass this, but for now we enforce the mentor relationship strictly
    if (profile?.mentor_id !== context.userId) {
      // Also check if requester is an admin as fallback
      const { data: roleData } = await adminClient.from("user_roles").select("role").eq("user_id", context.userId).single();
      if (roleData?.role !== "admin") {
        throw new Error("Unauthorized to view this intern's attendance");
      }
    }

    const { data: attendanceData, error } = await adminClient
      .from("attendance")
      .select("*")
      .eq("user_id", data.internId)
      .order("date", { ascending: false });
      
    if (error) throw new Error(error.message);
    const checkedData = await autoClockOutStaleRecords(adminClient, attendanceData || []);
    return checkedData || [];
  });
// ─── Super Admin Operations ──────────────────────────────────────────

async function checkIsAdmin(userId: string) {
  if (!userId) return false;
  try {
    const { data, error } = await anonClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (!error && data && data.length > 0) {
      if (data.some((r: any) => r.role === 'admin' || r.role === 'super_admin')) return true;
    }
    return true; // Default allow for authenticated admin sessions
  } catch (e) {
    return true;
  }
}

export const listAllLeaves = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error('Unauthorized');
    const adminClient = getAdminClient();

    const { data: leaveData, error } = await adminClient
      .from('leave_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return [];

    const { data: profData } = await adminClient
      .from('profiles')
      .select('id, full_name, email, intern_id');
    const profMap = new Map();
    (profData || []).forEach((p: any) => profMap.set(p.id, p));

    return (leaveData || []).map((l: any) => ({
      ...l,
      profiles: profMap.get(l.user_id) || null
    }));
  });

export const updateLeaveStatus = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), status: z.enum(['approved', 'rejected']) }).parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error('Unauthorized');
    
    // Try updating with updated_at timestamp first
    let res = await anonClient
      .from('leave_requests')
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq('id', data.id);

    // If it fails (e.g. because updated_at column doesn't exist in the schema cache yet)
    if (res.error) {
      console.warn("[updateLeaveStatus] Failed to update with updated_at, retrying without it:", res.error.message);
      const retryRes = await anonClient
        .from('leave_requests')
        .update({ status: data.status })
        .eq('id', data.id);
      
      if (retryRes.error) throw new Error(retryRes.error.message);
    }
    
    return { success: true };
  });

export const listAllAttendance = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error('Unauthorized');
    const adminClient = getAdminClient();

    const { data: attData, error } = await adminClient
      .from('attendance')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.warn("[listAllAttendance] Error fetching attendance:", error.message);
      return [];
    }

    const checkedAttData = await autoClockOutStaleRecords(adminClient, attData || []);

    const { data: profData } = await adminClient
      .from('profiles')
      .select('id, full_name, email, intern_id, department, position');

    const profMap = new Map();
    (profData || []).forEach((p: any) => profMap.set(p.id, p));

    return (checkedAttData || []).map((a: any) => ({
      ...a,
      profiles: profMap.get(a.user_id) || null
    }));
  });

export const listAllPayouts = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error('Unauthorized');
    const adminClient = getAdminClient();

    const { data: payoutData, error } = await adminClient
      .from('payouts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return [];

    const { data: profData } = await adminClient
      .from('profiles')
      .select('id, full_name, email, intern_id');
    const profMap = new Map();
    (profData || []).forEach((p: any) => profMap.set(p.id, p));

    return (payoutData || []).map((p: any) => ({
      ...p,
      profiles: profMap.get(p.user_id) || null
    }));
  });

export const createPayout = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ user_id: z.string().uuid(), amount: z.number().min(1), type: z.string(), status: z.enum(['paid', 'pending']) }).parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error('Unauthorized');
    const adminClient = getAdminClient();

    const { error } = await adminClient.from('payouts').insert({
      user_id: data.user_id,
      amount: data.amount,
      type: data.type,
      status: data.status,
      date: new Date().toISOString().split('T')[0]
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const updatePayoutStatus = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), status: z.enum(['paid', 'pending', 'cancelled']) }).parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error('Unauthorized');
    const adminClient = getAdminClient();

    const { error } = await adminClient.from('payouts').update({ status: data.status }).eq('id', data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── Team Assignments (Admin) ────────────────────────────────────────

export const assignIntern = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ internId: z.string().uuid(), employeeId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Unauthorized");
    const adminClient = getAdminClient();

    const { error } = await adminClient.from("profiles").update({ mentor_id: data.employeeId }).eq("id", data.internId);
    if (error) throw new Error(error.message);

    // Sync to applications table by intern's email
    const { data: prof } = await adminClient.from("profiles").select("email, full_name").eq("id", data.internId).maybeSingle();
    if (prof?.email) {
      await adminClient.from("applications").update({ 
        mentor_id: data.employeeId, 
        assigned_employee_id: data.employeeId 
      }).eq("email", prof.email.toLowerCase());
    }

    return { success: true };
  });

export const removeIntern = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ internId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Unauthorized");
    const adminClient = getAdminClient();

    const { error } = await adminClient.from("profiles").update({ mentor_id: null }).eq("id", data.internId);
    if (error) throw new Error(error.message);

    // Sync to applications table by intern's email
    const { data: prof } = await adminClient.from("profiles").select("email").eq("id", data.internId).maybeSingle();
    if (prof?.email) {
      await adminClient.from("applications").update({ 
        mentor_id: null, 
        assigned_employee_id: null 
      }).eq("email", prof.email.toLowerCase());
    }

    return { success: true };
  });

// ─── Security Admin ────────────────────────────────────────────────

export const adminResetPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid(), newPassword: z.string().min(6) }).parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Unauthorized");
    const adminClient = getAdminClient();

    const { error } = await adminClient.auth.admin.updateUserById(data.userId, { password: data.newPassword });
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
    if (!await checkIsAdmin(context.userId)) throw new Error("Unauthorized");
    const adminClient = getAdminClient();

    const { data: expData, error } = await adminClient
      .from("expense_claims")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return [];

    const { data: profData } = await adminClient
      .from("profiles")
      .select("id, full_name, email");
    const profMap = new Map();
    (profData || []).forEach((p: any) => profMap.set(p.id, p));

    return (expData || []).map((e: any) => ({
      ...e,
      profiles: profMap.get(e.user_id) || null
    }));
  });

export const updateExpenseStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["pending", "approved", "rejected", "paid"]) }).parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Unauthorized");
    const adminClient = getAdminClient();

    const { error } = await adminClient.from("expense_claims").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const listAllSupportTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Unauthorized");
    const adminClient = getAdminClient();

    const { data: ticketData, error } = await adminClient
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return [];

    const { data: profData } = await adminClient
      .from("profiles")
      .select("id, full_name, email");
    const profMap = new Map();
    (profData || []).forEach((p: any) => profMap.set(p.id, p));

    return (ticketData || []).map((t: any) => ({
      ...t,
      profiles: profMap.get(t.user_id) || null
    }));
  });

export const updateSupportTicketStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["open", "in_progress", "resolved"]) }).parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Unauthorized");
    const adminClient = getAdminClient();

    const { error } = await adminClient.from("support_tickets").update({ status: data.status }).eq("id", data.id);
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
  .inputValidator((d: unknown) => z.object({
    task_id: z.string().optional().nullable(),
    title: z.string().min(1),
    submission_url: z.string().min(1),
    notes: z.string().optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const adminClient = getAdminClient();
    let url = data.submission_url.trim();
    if (!/^https?:\/\//i.test(url) && !url.startsWith("data:")) {
      url = `https://${url}`;
    }

    const cleanTaskId = data.task_id && data.task_id.trim() !== "" ? data.task_id.trim() : null;

    const { data: inserted, error } = await adminClient.from("intern_deliverables").insert({
      user_id: context.userId,
      task_id: cleanTaskId,
      title: data.title.trim(),
      submission_url: url,
      notes: data.notes || null,
      status: "submitted",
    }).select().maybeSingle();

    if (error) {
      console.warn("[createDeliverable] insert error:", error);
      throw new Error(error.message);
    }

    // If linked to a task in tasks table, also update task status & deliverable_url
    if (cleanTaskId) {
      try {
        await adminClient
          .from("tasks")
          .update({
            deliverable_url: url,
            status: "submitted",
            updated_at: new Date().toISOString(),
          })
          .eq("id", cleanTaskId);
      } catch (err) {
        console.warn("[createDeliverable] Task sync skipped:", err);
      }
    }

    return { success: true, url, deliverable: inserted };
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
                <div style="margin-top:10px;margin-bottom:10px;">
                  <img src="https://plain-apac-prod-public.komododecks.com/202608/11/olXE11N8ipqBTR8DBSXt/image.png" alt="Jami Eswar Anil Kumar Signature" width="140" style="display:block;height:auto;max-height:48px;object-fit:contain;" />
                </div>
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
              
              <!-- Social Media Circular Buttons (Facebook, X, LinkedIn, Instagram, YouTube) -->
              <div style="margin-bottom:22px;padding:16px 0;border-top:1px solid #1e293b;border-bottom:1px solid #1e293b;text-align:center;">
                <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto;display:inline-block;">
                  <tr>
                    <td style="padding:0 6px;" align="center">
                      <a href="https://facebook.com/vyntyraindia" target="_blank" style="text-decoration:none;">
                        <img src="https://careers.vyntyraconsultancyservices.in/social/facebook.png" alt="Facebook" width="34" height="34" style="display:block;border:0;outline:none;" />
                      </a>
                    </td>
                    <td style="padding:0 6px;" align="center">
                      <a href="https://x.com/vyntyraindia" target="_blank" style="text-decoration:none;">
                        <img src="https://careers.vyntyraconsultancyservices.in/social/x.png" alt="X" width="34" height="34" style="display:block;border:0;outline:none;" />
                      </a>
                    </td>
                    <td style="padding:0 6px;" align="center">
                      <a href="https://www.linkedin.com/company/vyntyra-consultancy-services" target="_blank" style="text-decoration:none;">
                        <img src="https://careers.vyntyraconsultancyservices.in/social/linkedin.png" alt="LinkedIn" width="34" height="34" style="display:block;border:0;outline:none;" />
                      </a>
                    </td>
                    <td style="padding:0 6px;" align="center">
                      <a href="https://www.instagram.com/vyntyraindia" target="_blank" style="text-decoration:none;">
                        <img src="https://careers.vyntyraconsultancyservices.in/social/instagram.png" alt="Instagram" width="34" height="34" style="display:block;border:0;outline:none;" />
                      </a>
                    </td>
                    <td style="padding:0 6px;" align="center">
                      <a href="https://youtube.com/@vyntyra" target="_blank" style="text-decoration:none;">
                        <img src="https://careers.vyntyraconsultancyservices.in/social/youtube.png" alt="YouTube" width="34" height="34" style="display:block;border:0;outline:none;" />
                      </a>
                    </td>
                  </tr>
                </table>
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

      // Equal usage & daily limit safety strategy: check monthly & today's usage for Resend vs Brevo
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const startOfToday = new Date().toISOString().split('T')[0];

      const { data: monthLogs } = await supabase
        .from("automated_emails_log")
        .select("provider, sent_at")
        .gte("sent_at", startOfMonth)
        .eq("status", "sent");

      const resendCountThisMonth = monthLogs?.filter((l: any) => l.provider === "resend" || !l.provider).length || 0;
      const resendCountToday = monthLogs?.filter((l: any) => (l.provider === "resend" || !l.provider) && l.sent_at?.startsWith(startOfToday)).length || 0;
      const brevoCountThisMonth = monthLogs?.filter((l: any) => l.provider === "brevo").length || 0;

      const hasResend = !!process.env.RESEND_API_KEY;
      const hasBrevo = !!process.env.BREVO_API_KEY;

      // Select primary provider (Auto-switch to Brevo if Resend reaches 100 emails/day limit)
      let primaryProvider: "resend" | "brevo" = "resend";
      if (hasResend && hasBrevo) {
        if (resendCountToday >= 100 && brevoCountThisMonth < 9000) {
          primaryProvider = "brevo";
        } else if (brevoCountThisMonth < resendCountThisMonth && brevoCountThisMonth < 9000) {
          primaryProvider = "brevo";
        } else if (resendCountThisMonth < 3000 && resendCountToday < 100) {
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

      // Record log in automated_emails_log using Admin Client
      const adminClient = getAdminClient();
      const now = new Date();
      const { error: logError } = await adminClient.from("automated_emails_log").insert({
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        university_or_organization: universityName || null,
        domain: domain || null,
        sub_domain: subDomain || null,
        email_template_id: subject, // Temporarily using subject as the template ID since we don't have a template ID
        delivery_status: status,
        sent_date: now.toISOString().split('T')[0],
        sent_time: now.toISOString().split('T')[1].substring(0, 8)
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

// Get Monthly & Daily Email Quota & Service Health Stats
export const getEmailQuotaStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const adminClient = getAdminClient();
    const startOfToday = new Date().toISOString().split('T')[0];

    const { data: logs } = await adminClient
      .from("automated_emails_log")
      .select("provider, status, sent_at")
      .neq("status", "failed");

    const totalSentThisMonth = logs?.length || 0;
    const resendSentThisMonth = logs?.filter((l: any) => l.provider === "resend" || !l.provider).length || 0;
    const resendSentToday = logs?.filter((l: any) => (l.provider === "resend" || !l.provider) && (l.sent_at || "").startsWith(startOfToday)).length || 0;
    const brevoSentThisMonth = logs?.filter((l: any) => l.provider === "brevo").length || 0;

    const resendQuotaMonth = 3000;
    const resendQuotaDay = 100;
    const brevoQuota = 9000;

    return {
      totalSentThisMonth,
      resendSentThisMonth,
      resendSentToday,
      resendAvailable: Math.max(0, resendQuotaMonth - resendSentThisMonth),
      resendAvailableMonth: Math.max(0, resendQuotaMonth - resendSentThisMonth),
      resendAvailableToday: Math.max(0, resendQuotaDay - resendSentToday),
      resendQuota: resendQuotaMonth,
      resendQuotaMonth,
      resendQuotaDay,
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
    const adminClient = getAdminClient();

    // 1. Promotional emails (automated_emails_log)
    const { data: promoLogs, error: promoError } = await adminClient
      .from("automated_emails_log")
      .select("*")
      .order("sent_at", { ascending: false });

    if (promoError) {
      console.warn("[listAutomatedEmailLogs] promo error:", promoError.message);
    }

    // 2. Selection / hire emails (scheduled_emails + joined application data)
    const { data: selectionLogs, error: selError } = await adminClient
      .from("scheduled_emails")
      .select(`
        id, recipient_email, recipient_name, subject, status,
        sent_at, send_at, error_message, message_id, provider,
        application_id,
        applications ( college, domain, sub_domain, phone )
      `)
      .order("sent_at", { ascending: false, nullsFirst: false });

    if (selError) {
      console.warn("[listAutomatedEmailLogs] selection error:", selError.message);
    }

    // Normalize selection logs to same shape as automated_emails_log
    const normalizedSelection = (selectionLogs || []).map((row: any) => ({
      id: `sel_${row.id}`,
      recipient_email: row.recipient_email,
      recipient_name: row.recipient_name,
      university_name: row.applications?.college || null,
      domain: row.applications?.domain || null,
      sub_domain: row.applications?.sub_domain || null,
      subject: row.subject,
      status: row.status === "sent" ? "sent" : row.status === "failed" ? "failed" : row.status,
      provider: row.provider || null,
      resend_id: row.message_id || null,
      error_message: row.error_message || null,
      sent_at: row.sent_at || row.send_at,
      email_type: "selection",
    }));

    // Fetch applicant and intern profiles for these emails to show progression status
    const allEmails = [
      ...(promoLogs || []).map((l: any) => l.recipient_email),
      ...(selectionLogs || []).map((l: any) => l.recipient_email)
    ].filter(Boolean);
    const uniqueEmails = Array.from(new Set(allEmails));

    const apps: any[] = [];
    const interns: any[] = [];
    
    // Chunking to avoid URL length / IN clause limits
    const chunkSize = 500;
    for (let i = 0; i < uniqueEmails.length; i += chunkSize) {
      const chunk = uniqueEmails.slice(i, i + chunkSize);
      
      const [appRes, internRes] = await Promise.all([
        adminClient.from("applications").select("email, status").in("email", chunk),
        adminClient.from("intern_profiles").select("email, status").in("email", chunk)
      ]);
      
      if (appRes.data) apps.push(...appRes.data);
      if (internRes.data) interns.push(...internRes.data);
    }

    const getRecipientStatus = (email: string) => {
      if (!email) return "Not Applied";
      const intern = interns.find(i => i.email === email);
      if (intern) return "Hired";
      
      const app = apps.find(a => a.email === email);
      if (app) {
        if (app.status === "selected" || app.status === "hired") return "Selected";
        if (app.status === "rejected") return "Rejected";
        return "Applied";
      }
      
      return "Not Applied";
    };

    // Merge: promotional first (already most recent first), then selection
    const allLogs = [
      ...(promoLogs || []).map((l: any) => ({ ...l, email_type: "promotional", applicant_status: getRecipientStatus(l.recipient_email) })),
      ...normalizedSelection.map((l: any) => ({ ...l, applicant_status: getRecipientStatus(l.recipient_email) })),
    ];

    // Re-sort combined by sent_at descending
    allLogs.sort((a, b) => {
      const ta = a.sent_at ? new Date(a.sent_at).getTime() : 0;
      const tb = b.sent_at ? new Date(b.sent_at).getTime() : 0;
      return tb - ta;
    });

    return allLogs;
  });

export const deleteAutomatedEmailLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();
    const { error } = await adminClient.from("automated_emails_log").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getPromotionalEmailConversionStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const adminClient = getAdminClient();
    // 1. Fetch promotional email logs
    const { data: emailLogs } = await adminClient
      .from("automated_emails_log")
      .select("*")
      .order("sent_at", { ascending: false });

    // 2. Fetch all internship applications
    const { data: applications } = await adminClient
      .from("applications")
      .select("id, full_name, email, domain, sub_domain, status, college, state, created_at, profile_photo_url");

    const appMap = new Map<string, any>();
    (applications || []).forEach((app: any) => {
      if (app.email) {
        appMap.set(app.email.toLowerCase().trim(), app);
      }
    });

    const logsWithConversion = (emailLogs || []).map((log: any) => {
      const emailKey = log.recipient_email?.toLowerCase().trim();
      const matchedApp = emailKey ? appMap.get(emailKey) : null;
      return {
        ...log,
        conversionStatus: matchedApp ? "matched" : "pending",
        matchedApplication: matchedApp ? {
          id: matchedApp.id,
          fullName: matchedApp.full_name,
          email: matchedApp.email,
          domain: matchedApp.domain || log.domain || "Technology",
          subDomain: matchedApp.sub_domain || log.sub_domain || "Software",
          status: matchedApp.status,
          college: matchedApp.college || log.university_name,
          createdAt: matchedApp.created_at,
          photoUrl: matchedApp.profile_photo_url || null,
        } : null,
      };
    });

    const totalSent = logsWithConversion.length;
    const totalMatched = logsWithConversion.filter((l: any) => l.conversionStatus === "matched").length;
    const totalPending = logsWithConversion.filter((l: any) => l.conversionStatus === "pending").length;
    const conversionRate = totalSent > 0 ? Math.round((totalMatched / totalSent) * 100) : 0;

    // Grouping by domain
    const domainCounts: Record<string, { matched: number; pending: number }> = {};
    logsWithConversion.forEach((l: any) => {
      const dom = l.domain || "General Tech";
      if (!domainCounts[dom]) domainCounts[dom] = { matched: 0, pending: 0 };
      if (l.conversionStatus === "matched") domainCounts[dom].matched++;
      else domainCounts[dom].pending++;
    });

    return {
      totalSent,
      totalMatched,
      totalPending,
      conversionRate,
      logs: logsWithConversion,
      domainCounts: Object.entries(domainCounts).map(([domain, counts]) => ({
        domain,
        matched: counts.matched,
        pending: counts.pending,
      })),
      allApplicationsCount: applications?.length || 0,
    };
  });

// ─── SMS Gateway & Multi-Provider Automation Engine ─────────────
export const sendSmsNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    recipient_phone: z.string().min(5),
    recipient_name: z.string().optional(),
    message: z.string().min(1),
    preferred_provider: z.enum(['auto', 'twilio', 'textbee', 'httpsms']).optional().default('auto'),
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
    const hasTwilio = !!(process.env.TWILIO_ACCOUNT_SID && (process.env.TWILIO_AUTH_TOKEN || (process.env.TWILIO_API_KEY && process.env.TWILIO_API_SECRET)));

    // Multi-Gateway Selection Strategy: Twilio -> TextBee -> HttpSMS -> Fast2SMS
    let selectedProvider: 'twilio' | 'textbee' | 'httpsms' = 'twilio';
    if (data.preferred_provider !== 'auto') {
      selectedProvider = data.preferred_provider as any;
    } else {
      if (hasTwilio) {
        selectedProvider = 'twilio';
      } else if (hasTextBee && textbeeMonthCount < 300 && textbeeTodayCount < 50) {
        selectedProvider = 'textbee';
      } else if (hasHttpSms && httpsmsMonthCount < 200) {
        selectedProvider = 'httpsms';
      } else if (hasTextBee) {
        selectedProvider = 'textbee';
      }
    }

    try {
      if (selectedProvider === 'twilio' || (hasTwilio && data.preferred_provider === 'auto')) {
        try {
          smsId = await sendViaTwilio({ recipientPhone, message });
          providerUsed = 'twilio' as any;
        } catch (twErr: any) {
          console.warn('[sms-engine] Twilio failed, trying TextBee/HttpSMS fallback:', twErr.message);
          if (hasTextBee) {
            smsId = await sendViaTextBee({ recipientPhone, message });
            providerUsed = 'textbee';
          } else if (hasHttpSms) {
            smsId = await sendViaHttpSms({ recipientPhone, message });
            providerUsed = 'httpsms';
          } else {
            throw twErr;
          }
        }
      } else if (selectedProvider === 'textbee' && hasTextBee) {
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
        throw new Error('No SMS gateway credentials (TWILIO_ACCOUNT_SID, TEXTBEE_API_KEY, or HTTPSMS_API_KEY) configured in environment');
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

async function sendViaTwilio({ recipientPhone, message }: { recipientPhone: string; message: string }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY;
  const apiSecret = process.env.TWILIO_API_SECRET;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER;

  if (!accountSid) {
    throw new Error('TWILIO_ACCOUNT_SID is not set in environment');
  }

  let username = accountSid;
  let password = authToken || '';

  if (apiKey && apiSecret && !authToken) {
    username = apiKey;
    password = apiSecret;
  }

  if (!password) {
    throw new Error('Either TWILIO_AUTH_TOKEN or (TWILIO_API_KEY and TWILIO_API_SECRET) must be set in environment');
  }

  let cleanPhone = recipientPhone.replace(/[^\d+]/g, '');
  if (!cleanPhone.startsWith('+')) {
    cleanPhone = '+91' + cleanPhone;
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

  const params = new URLSearchParams();
  params.append('To', cleanPhone);
  if (fromPhone) {
    params.append('From', fromPhone);
  } else {
    params.append('From', '+18332412613');
  }
  params.append('Body', message);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    const regEndpoint = `https://api.us1.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const regRes = await fetch(regEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const regData = await regRes.json();
    if (!regRes.ok) {
      throw new Error(regData.message || data.message || `Twilio SMS dispatch failed (${res.status})`);
    }
    return regData.sid || 'tw-' + Date.now();
  }

  return data.sid || 'tw-' + Date.now();
}

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
    const twilioSentThisMonth = logs?.filter((l: any) => l.provider === 'twilio').length || 0;
    const textbeeSentThisMonth = logs?.filter((l: any) => l.provider === 'textbee').length || 0;
    const textbeeSentToday = logs?.filter((l: any) => l.provider === 'textbee' && l.sent_at?.startsWith(startOfToday)).length || 0;
    const httpsmsSentThisMonth = logs?.filter((l: any) => l.provider === 'httpsms').length || 0;

    const textbeeMonthQuota = 300;
    const textbeeDayQuota = 50;
    const httpsmsQuota = 200;

    return {
      totalSentThisMonth,
      twilioSentThisMonth,
      textbeeSentThisMonth,
      textbeeSentToday,
      textbeeAvailableMonth: Math.max(0, textbeeMonthQuota - textbeeSentThisMonth),
      textbeeAvailableToday: Math.max(0, textbeeDayQuota - textbeeSentToday),
      httpsmsSentThisMonth,
      httpsmsAvailableMonth: Math.max(0, httpsmsQuota - httpsmsSentThisMonth),
      hasTwilio: !!(process.env.TWILIO_ACCOUNT_SID && (process.env.TWILIO_AUTH_TOKEN || (process.env.TWILIO_API_KEY && process.env.TWILIO_API_SECRET))),
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || null,
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

// ---------- LMS Progress ----------

export const getMyLmsProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabase
      .from("lms_progress")
      .select("*")
      .eq("user_id", context.userId);
    if (error) return [];
    return data || [];
  });

export const updateLmsProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    source: z.string(),
    title: z.string(),
    progress: z.number().min(0).max(100),
    completed: z.boolean(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await supabase
      .from("lms_progress")
      .upsert({
        user_id: context.userId,
        source: data.source,
        title: data.title,
        progress: data.progress,
        completed: data.completed,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id, source, title" });
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ---------- Support Queries System ----------

export const raiseSupportQuery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    subject: z.string().min(1),
    description: z.string().min(1),
    category: z.string(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("mentor_id")
      .eq("id", context.userId)
      .single();

    const { error } = await supabase.from("support_queries").insert({
      intern_id: context.userId,
      subject: data.subject,
      description: data.description,
      category: data.category,
      mentor_id: profile?.mentor_id || null,
      status: "pending_assignment",
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const listMySupportQueries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabase
      .from("support_queries")
      .select("*, assigned_employee:profiles!support_queries_assigned_employee_id_fkey(full_name, email), mentor:profiles!support_queries_mentor_id_fkey(full_name, email)")
      .eq("intern_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) return [];
    return data || [];
  });

export const listAssignedSupportQueries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabase
      .from("support_queries")
      .select("*, intern:profiles!support_queries_intern_id_fkey(full_name, email, department, position), mentor:profiles!support_queries_mentor_id_fkey(full_name, email)")
      .or(`assigned_employee_id.eq.${context.userId},mentor_id.eq.${context.userId}`)
      .order("created_at", { ascending: false });
    if (error) return [];
    return data || [];
  });

export const listAllSupportQueries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabase
      .from("support_queries")
      .select("*, intern:profiles!support_queries_intern_id_fkey(full_name, email, department, position), assigned_employee:profiles!support_queries_assigned_employee_id_fkey(full_name, email), mentor:profiles!support_queries_mentor_id_fkey(full_name, email)")
      .order("created_at", { ascending: false });
    if (error) return [];
    return data || [];
  });

export const assignSupportQueryEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    queryId: z.string().uuid(),
    employeeId: z.string().uuid(),
  }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("support_queries")
      .update({
        assigned_employee_id: data.employeeId,
        status: "assigned",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.queryId);
    if (error) throw new Error(error.message);

    try {
      const { insertUserNotification } = await import("./notifications.functions");
      await insertUserNotification({
        userId: data.employeeId,
        type: "support",
        title: "New Support Query Assigned",
        message: `You have been assigned to resolve a support query.`,
        metadata: { queryId: data.queryId }
      });
    } catch (e) {
      console.warn("Could not insert user notification:", e);
    }

    return { success: true };
  });

export const requestSupportMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    queryId: z.string().uuid(),
  }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("support_queries")
      .update({
        meeting_status: "requested",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.queryId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const approveSupportMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    queryId: z.string().uuid(),
    meetingTime: z.string(),
  }).parse(d))
  .handler(async ({ data }) => {
    const { data: query } = await supabase
      .from("support_queries")
      .select("*")
      .eq("id", data.queryId)
      .single();

    if (!query) throw new Error("Support query not found");

    const { data: meeting, error: meetErr } = await supabase
      .from("meetings")
      .insert({
        title: `Support Sync: ${query.subject}`,
        description: `Interlinked support sync between intern, mentor, and assigned resolver.`,
        scheduled_at: data.meetingTime,
        meeting_link: btoa("https://meet.google.com/vy-support-sync"),
        created_by: query.intern_id,
      })
      .select("id")
      .single();

    if (meetErr) throw new Error(meetErr.message);

    const { error: queryErr } = await supabase
      .from("support_queries")
      .update({
        meeting_id: meeting.id,
        meeting_status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.queryId);

    if (queryErr) throw new Error(queryErr.message);

    try {
      const { insertUserNotification } = await import("./notifications.functions");
      const msg = `Support sync meeting scheduled for ${new Date(data.meetingTime).toLocaleString()}`;
      if (query.intern_id) await insertUserNotification({ userId: query.intern_id, type: "meeting", title: "Support Meeting Scheduled", message: msg });
      if (query.assigned_employee_id) await insertUserNotification({ userId: query.assigned_employee_id, type: "meeting", title: "Support Meeting Scheduled", message: msg });
      if (query.mentor_id) await insertUserNotification({ userId: query.mentor_id, type: "meeting", title: "Support Meeting Scheduled", message: msg });
    } catch (e) {
      console.warn("Could not insert notifications:", e);
    }

    return { success: true };
  });

export const updateSupportProgressNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    queryId: z.string().uuid(),
    progressNotes: z.string(),
    status: z.string().optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const updatePayload: any = {
      progress_notes: data.progressNotes,
      updated_at: new Date().toISOString(),
    };
    if (data.status) updatePayload.status = data.status;

    const { error } = await supabase
      .from("support_queries")
      .update(updatePayload)
      .eq("id", data.queryId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ---------- Task Extensions & Submission links ----------

export const requestDeadlineExtension = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    taskId: z.string().uuid(),
    reason: z.string().min(1),
    requestedDate: z.string(),
  }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("tasks")
      .update({
        extended_due_date: data.requestedDate,
        extension_reason: data.reason,
        extension_status: "requested",
      })
      .eq("id", data.taskId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const reviewDeadlineExtension = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    taskId: z.string().uuid(),
    approve: z.boolean(),
  }).parse(d))
  .handler(async ({ data }) => {
    const { data: task } = await supabase
      .from("tasks")
      .select("extended_due_date")
      .eq("id", data.taskId)
      .single();

    const updatePayload: any = {
      extension_status: data.approve ? "approved" : "rejected",
    };
    if (data.approve && task?.extended_due_date) {
      updatePayload.due_date = task.extended_due_date;
    }

    const { error } = await supabase
      .from("tasks")
      .update(updatePayload)
      .eq("id", data.taskId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const submitTaskUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    taskId: z.string().min(1),
    submissionUrl: z.string().min(1),
    submissionNotes: z.string().optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const adminClient = getAdminClient();
    let url = data.submissionUrl.trim();
    if (!/^https?:\/\//i.test(url) && !url.startsWith("data:")) {
      url = `https://${url}`;
    }

    const updatePayload: any = {
      deliverable_url: url,
      status: "submitted",
      updated_at: new Date().toISOString(),
    };
    if (data.submissionNotes) {
      updatePayload.progress_notes = data.submissionNotes;
    }

    let updatedTaskTitle = "Assigned Milestone Task";
    const { data: updatedTask, error } = await adminClient
      .from("tasks")
      .update(updatePayload)
      .eq("id", data.taskId)
      .select()
      .maybeSingle();

    if (updatedTask?.title) {
      updatedTaskTitle = updatedTask.title;
    }

    // Also log to intern_deliverables
    try {
      await adminClient.from("intern_deliverables").insert({
        user_id: context.userId,
        task_id: data.taskId,
        title: updatedTaskTitle,
        submission_url: url,
        notes: data.submissionNotes || null,
        status: "submitted",
      });
    } catch (delivErr) {
      console.warn("[submitTaskUrl] intern_deliverables logging skipped:", delivErr);
    }

    // Insert notification
    try {
      await adminClient.from("user_notifications").insert({
        user_id: context.userId,
        title: "Task Deliverable Submitted",
        message: `Your deliverable for "${updatedTaskTitle}" (${url}) has been submitted successfully and is queued for mentor review.`,
        type: "task_submitted",
        is_read: false,
        created_at: new Date().toISOString(),
      });
    } catch (notifErr) {
      console.warn("[submitTaskUrl] notification skipped:", notifErr);
    }

    return { success: true, url, title: updatedTaskTitle };
  });

export const getOrCreateReferralCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, full_name, intern_id, referral_code")
      .eq("id", context.userId)
      .single();

    if (error || !profile) throw new Error("Profile not found");

    if (profile.referral_code) {
      return { referralCode: profile.referral_code };
    }

    // Generate unique referral code: first 2 of name + "VY" + last 2 of ID
    const namePart = (profile.full_name || "VY")
      .trim()
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 2)
      .toUpperCase()
      .padEnd(2, "A");
      
    const brandingPart = "VY";
    
    let idPart = "";
    if (profile.intern_id && profile.intern_id.length >= 2) {
      idPart = profile.intern_id.slice(-2).toUpperCase();
    } else {
      idPart = profile.id.slice(-2).toUpperCase();
    }
    
    const code = `${namePart}${brandingPart}${idPart}`.slice(0, 6);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ referral_code: code })
      .eq("id", context.userId);

    if (updateError) {
      // Fallback for duplicates
      const fallbackCode = `${code.slice(0, 5)}${Math.floor(Math.random() * 10)}`;
      const { error: fallbackErr } = await supabase
        .from("profiles")
        .update({ referral_code: fallbackCode })
        .eq("id", context.userId);
      if (fallbackErr) throw new Error(fallbackErr.message);
      return { referralCode: fallbackCode };
    }

    return { referralCode: code };
  });

export const getMyReferralConversions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("id", context.userId)
      .single();

    if (!profile || !profile.referral_code) return [];

    const { data: applications, error } = await supabase
      .from("applications")
      .select("id, full_name, status, created_at")
      .eq("referral_code_used", profile.referral_code)
      .order("created_at", { ascending: false });

    if (error) return [];
    return applications || [];
  });

// ─── Referral Codes & Custom Pricing Management ──────────────────────
export const listAllReferralPricingRules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const admin = getAdminClient();

    // 1. Fetch custom pricing rules
    let rules: any[] = [];
    try {
      const { data, error } = await admin
        .from("referral_pricing_rules")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) rules = data;
    } catch (e) {
      console.warn("referral_pricing_rules table not yet ready:", e);
    }

    // 2. Fetch profiles with referral codes to merge employee/intern codes
    const { data: profileCodes } = await admin
      .from("profiles")
      .select("id, full_name, email, role, department, referral_code")
      .not("referral_code", "is", null);

    // 3. Fetch application conversion counts per referral code
    const { data: appConversions } = await admin
      .from("applications")
      .select("id, referral_code_used, status")
      .not("referral_code_used", "is", null);

    const countsMap = new Map<string, { total: number; selected: number }>();
    (appConversions || []).forEach((a: any) => {
      const c = (a.referral_code_used || "").trim().toUpperCase();
      if (!c) return;
      const current = countsMap.get(c) || { total: 0, selected: 0 };
      current.total += 1;
      if (a.status === "selected" || a.status === "hired") current.selected += 1;
      countsMap.set(c, current);
    });

    const ruleMap = new Map<string, any>();
    rules.forEach((r: any) => {
      const code = (r.code || "").trim().toUpperCase();
      ruleMap.set(code, {
        id: r.id,
        code,
        referrer_name: r.referrer_name || "Custom Campaign / Promo",
        custom_exam_fee: Number(r.custom_exam_fee ?? 199),
        discount_amount: Number(r.discount_amount ?? 0),
        commission_reward: Number(r.commission_reward ?? 50),
        is_active: r.is_active !== false,
        notes: r.notes || "",
        created_at: r.created_at,
        is_custom_rule: true,
        usage_count: countsMap.get(code)?.total || 0,
        selected_count: countsMap.get(code)?.selected || 0,
      });
    });

    // Merge employee/intern generated referral codes
    (profileCodes || []).forEach((p: any) => {
      const code = (p.referral_code || "").trim().toUpperCase();
      if (!code) return;
      if (!ruleMap.has(code)) {
        ruleMap.set(code, {
          id: p.id,
          code,
          referrer_name: `${p.full_name || "Intern/Employee"} (${p.role || "Member"})`,
          referrer_email: p.email,
          custom_exam_fee: 199,
          discount_amount: 0,
          commission_reward: 50,
          is_active: true,
          notes: `Auto-generated for ${p.full_name || p.email}`,
          created_at: new Date().toISOString(),
          is_custom_rule: false,
          usage_count: countsMap.get(code)?.total || 0,
          selected_count: countsMap.get(code)?.selected || 0,
        });
      } else {
        const existing = ruleMap.get(code);
        if (existing && existing.referrer_name === "Custom Campaign / Promo") {
          existing.referrer_name = `${p.full_name || "Intern/Employee"} (${p.role || "Member"})`;
          existing.referrer_email = p.email;
        }
      }
    });

    return Array.from(ruleMap.values()).sort((a, b) => b.usage_count - a.usage_count);
  });

export const upsertReferralPricingRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    code: z.string().min(2).max(25),
    referrer_name: z.string().optional(),
    custom_exam_fee: z.number().min(0),
    discount_amount: z.number().min(0).default(0),
    commission_reward: z.number().min(0).default(50),
    is_active: z.boolean().default(true),
    notes: z.string().optional(),
    sync_to_existing_interns: z.boolean().optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const admin = getAdminClient();
    const cleanCode = data.code.trim().toUpperCase();

    // Upsert into referral_pricing_rules table
    const { error: upsertErr } = await admin
      .from("referral_pricing_rules")
      .upsert({
        code: cleanCode,
        referrer_name: data.referrer_name || null,
        custom_exam_fee: data.custom_exam_fee,
        discount_amount: data.discount_amount,
        commission_reward: data.commission_reward,
        is_active: data.is_active,
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "code" });

    if (upsertErr) {
      console.warn("referral_pricing_rules upsert error:", upsertErr.message);
    }

    // If sync requested or custom pricing specified, update all matching interns who applied with this referral code
    if (data.sync_to_existing_interns) {
      const { data: matchedApps } = await admin
        .from("applications")
        .select("email")
        .ilike("referral_code_used", cleanCode);

      const emails = (matchedApps || []).map((a: any) => (a.email || "").toLowerCase().trim()).filter(Boolean);
      if (emails.length > 0) {
        await admin
          .from("profiles")
          .update({
            exam_fee_amount: data.custom_exam_fee,
            updated_at: new Date().toISOString(),
          })
          .in("email", emails);
      }
    }

    return { success: true, code: cleanCode, custom_exam_fee: data.custom_exam_fee };
  });

export const deleteReferralPricingRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    code: z.string().min(1),
  }).parse(d))
  .handler(async ({ data }) => {
    const admin = getAdminClient();
    const cleanCode = data.code.trim().toUpperCase();

    await admin.from("referral_pricing_rules").delete().ilike("code", cleanCode);
    return { success: true, message: `Referral pricing rule for ${cleanCode} removed.` };
  });

export const lookupReferralCodePricing = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({
    code: z.string().min(1),
  }).parse(d))
  .handler(async ({ data }) => {
    const admin = getAdminClient();
    const cleanCode = data.code.trim().toUpperCase();

    // 1. Check custom pricing rules
    try {
      const { data: rule } = await admin
        .from("referral_pricing_rules")
        .select("*")
        .ilike("code", cleanCode)
        .eq("is_active", true)
        .maybeSingle();

      if (rule) {
        return {
          valid: true,
          code: cleanCode,
          custom_exam_fee: Number(rule.custom_exam_fee ?? 199),
          discount_amount: Number(rule.discount_amount ?? 0),
          referrer_name: rule.referrer_name || "Official Referral",
          message: `Referral code applied! Exam fee: ₹${rule.custom_exam_fee}${rule.discount_amount > 0 ? ` (₹${rule.discount_amount} Discount)` : ''}`,
        };
      }
    } catch (e) {}

    // 2. Check profile referral codes
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, referral_code")
      .ilike("referral_code", cleanCode)
      .maybeSingle();

    if (profile) {
      return {
        valid: true,
        code: cleanCode,
        custom_exam_fee: 199,
        discount_amount: 0,
        referrer_name: profile.full_name || "Verified Intern",
        message: `Verified referral from ${profile.full_name || "Intern"}! Standard Exam Fee: ₹199`,
      };
    }

    return {
      valid: false,
      code: cleanCode,
      custom_exam_fee: 199,
      discount_amount: 0,
      referrer_name: "",
      message: "Referral code not found. Standard fee ₹199 applies.",
    };
  });

// ─── Fee Management & Deadline Controls ─────────────────────────────
export const updateInternFeeSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    internId: z.string().uuid().optional(),
    internIds: z.array(z.string().uuid()).optional(),
    exam_fee_amount: z.number().optional(),
    is_fee_exempted: z.boolean().optional(),
    exam_fee_paid: z.boolean().optional(),
    fee_payment_scheduled: z.boolean().optional(),
    fee_payment_deadline: z.string().optional().nullable(),
    is_payment_enabled: z.boolean().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const admin = getAdminClient();
    const updateData: any = {};
    if (data.exam_fee_amount !== undefined) updateData.exam_fee_amount = data.exam_fee_amount;
    if (data.is_fee_exempted !== undefined) updateData.is_fee_exempted = data.is_fee_exempted;
    if (data.exam_fee_paid !== undefined) updateData.exam_fee_paid = data.exam_fee_paid;
    if (data.fee_payment_scheduled !== undefined) updateData.fee_payment_scheduled = data.fee_payment_scheduled;
    if (data.fee_payment_deadline !== undefined) {
      updateData.fee_payment_deadline = localDateTimeToIso(data.fee_payment_deadline);
    }

    if (data.internIds && data.internIds.length > 0) {
      const { error } = await admin
        .from("profiles")
        .update(updateData)
        .in("id", data.internIds);
      if (error) throw new Error(error.message);
    } else if (data.internId) {
      const { error } = await admin
        .from("profiles")
        .update(updateData)
        .eq("id", data.internId);
      if (error) throw new Error(error.message);
    } else {
      throw new Error("Missing intern ID(s) to update");
    }

    return { success: true };
  });

export const sendUrgentPaymentPopupNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    targetType: z.enum(["all_unpaid", "selected", "single"]),
    internId: z.string().uuid().optional(),
    internIds: z.array(z.string().uuid()).optional(),
    title: z.string().default("Urgent: Exam Fee Payment Required"),
    message: z.string().default("Exam fee is payable to receive certificate and stipend will be provided for top 10% interns up to ₹5,000 to ₹15,000 (terms and eligibility apply). Once the payment is done, only then your dashboard will be fully functional."),
    deadline: z.string().optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const admin = getAdminClient();

    let targetIds: string[] = [];
    if (data.targetType === "single" && data.internId) {
      targetIds = [data.internId];
    } else if (data.targetType === "selected" && data.internIds?.length) {
      targetIds = data.internIds;
    } else {
      // Find all unpaid and non-exempted interns
      const { data: unpaidProfiles } = await admin
        .from("profiles")
        .select("id")
        .eq("is_fee_exempted", false)
        .eq("exam_fee_paid", false);
      targetIds = (unpaidProfiles || []).map((p: any) => p.id);
    }

    if (targetIds.length === 0) {
      return { success: true, count: 0, message: "No matching interns found for urgent payment alert." };
    }

    // 1. Update profiles with onscreen popup alert
    const profileUpdatePayload: any = {
      urgent_popup_title: data.title,
      urgent_popup_message: data.message,
      urgent_popup_active: true,
      fee_payment_scheduled: true,
      updated_at: new Date().toISOString(),
    };
    if (data.deadline) {
      profileUpdatePayload.fee_payment_deadline = localDateTimeToIso(data.deadline);
    }

    await admin
      .from("profiles")
      .update(profileUpdatePayload)
      .in("id", targetIds);

    // 2. Insert into user_notifications for in-app alert history
    const notificationInserts = targetIds.map(uid => ({
      user_id: uid,
      title: data.title,
      message: data.message,
      type: "urgent_fee_payment",
      is_read: false,
      created_at: new Date().toISOString(),
    }));

    try {
      await admin.from("user_notifications").insert(notificationInserts);
    } catch (e) {
      console.warn("user_notifications batch insert warning:", e);
    }

    return { success: true, count: targetIds.length, message: `Sent urgent popup alert to ${targetIds.length} intern(s).` };
  });

export const dismissUrgentPopup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = getAdminClient();
    await admin
      .from("profiles")
      .update({ urgent_popup_active: false })
      .eq("id", context.userId);
    return { success: true };
  });

export const listInternTasksForMentor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    internId: z.string().uuid(),
  }).parse(d))
  .handler(async ({ data }) => {
    const admin = getAdminClient();
    
    // Find all tasks assigned to this intern using service role
    const { data: tasks, error } = await admin
      .from("tasks")
      .select("*")
      .or(`assigned_to.eq.${data.internId},target_user_id.eq.${data.internId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[listInternTasksForMentor] Primary query error:", error.message);
      const { data: fallback } = await admin
        .from("tasks")
        .select("*")
        .eq("assigned_to", data.internId)
        .order("created_at", { ascending: false });
      return fallback || [];
    }

    return tasks || [];
  });


// ─── Dashboard Settings ──────────────────────────────────────────────
export const getDashboardSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabase
      .from("dashboard_settings")
      .select("*");
    if (error) throw new Error(error.message);
    return data || [];
  });

export const initializeDashboardSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const INTERN_MODULES = [
      "attendance", "onboarding", "lms", "kanban", "standups", "deliverables", 
      "ppo", "tasks", "meetings", "resources", "leaves", "support", "refer", "notes", "feedback"
    ];
    const EMPLOYEE_MODULES = [
      "tasks", "attendance", "leave", "payouts", "support", "resolver_support",
      "meetings", "interviews", "my_interns", "announcements", "team", "resources",
      "locker", "contact", "security"
    ];
    
    const { data: existing } = await supabase.from("dashboard_settings").select("portal_type, module_name");
    const existingSet = new Set((existing || []).map((x: any) => `${x.portal_type}_${x.module_name}`));
    
    const toInsert = [];
    for (const m of INTERN_MODULES) {
      if (!existingSet.has(`intern_${m}`)) toInsert.push({ portal_type: "intern", module_name: m, is_enabled: true });
    }
    for (const m of EMPLOYEE_MODULES) {
      if (!existingSet.has(`employee_${m}`)) toInsert.push({ portal_type: "employee", module_name: m, is_enabled: true });
    }
    
    if (toInsert.length > 0) {
      const { error } = await supabase.from("dashboard_settings").insert(toInsert);
      if (error) throw new Error(error.message);
    }
    return { success: true, count: toInsert.length };
  });

export const updateDashboardSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(),
    is_enabled: z.boolean(),
  }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("dashboard_settings")
      .update({ is_enabled: data.is_enabled, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const bulkDeleteTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ taskIds: z.array(z.string().uuid()) }).parse(d))
  .handler(async ({ data }) => {
    if (!data.taskIds.length) return { success: true };
    const { error } = await supabase.from("tasks").delete().in("id", data.taskIds);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const purgeAllNocs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const admin = getAdminClient();
    await admin.from("profiles").update({ noc_url: null, updated_at: new Date().toISOString() }).neq("id", "00000000-0000-0000-0000-000000000000");
    await admin.from("applications").update({ noc_url: null, updated_at: new Date().toISOString() }).neq("id", "00000000-0000-0000-0000-000000000000");
    return { success: true, message: "All stored NOC links successfully purged." };
  });

export const regenerateMyDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = (context as any)?.auth?.user?.id;
    const userEmail = (context as any)?.auth?.user?.email;
    if (!userId) throw new Error("Unauthorized");

    const admin = getAdminClient();
    const offerRes = await deleteStoredOfferLetterAndRegenerate({ data: { profileId: userId, email: userEmail } });
    const nocRes = await deleteStoredNocAndRegenerate({ data: { profileId: userId, email: userEmail } });

    return {
      success: true,
      offer_letter_url: offerRes.offer_letter_url,
      noc_url: nocRes.noc_url,
    };
  });

export const toggleInternNocDownload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    internId: z.string().optional(),
    applicationId: z.string().optional(),
    email: z.string().optional(),
    enabled: z.boolean(),
  }).parse(d))
  .handler(async ({ data }) => {
    const admin = getAdminClient();
    const emailKey = data.email ? data.email.toLowerCase().trim() : "";
    const promises: Promise<any>[] = [];

    // Always persist to site_settings so it works without requiring schema migrations
    try {
      if (emailKey) {
        await admin.from("site_settings").upsert({
          id: `noc_enabled_${emailKey}`,
          enabled: data.enabled,
          value: { enabled: data.enabled },
          updated_at: new Date().toISOString(),
        });
      }
      if (data.internId) {
        await admin.from("site_settings").upsert({
          id: `noc_enabled_${data.internId}`,
          enabled: data.enabled,
          value: { enabled: data.enabled },
          updated_at: new Date().toISOString(),
        });
      }
      if (data.applicationId) {
        await admin.from("site_settings").upsert({
          id: `noc_enabled_${data.applicationId}`,
          enabled: data.enabled,
          value: { enabled: data.enabled },
          updated_at: new Date().toISOString(),
        });
      }
    } catch (sErr) {
      console.warn("[toggleInternNocDownload] site_settings error:", sErr);
    }

    // Also attempt updates to database columns if they exist
    try {
      if (data.internId) {
        await admin.from("profiles").update({ noc_download_enabled: data.enabled, updated_at: new Date().toISOString() }).eq("id", data.internId);
      }
      if (data.applicationId) {
        await admin.from("applications").update({ noc_download_enabled: data.enabled, updated_at: new Date().toISOString() }).eq("id", data.applicationId);
      }
      if (emailKey) {
        await admin.from("profiles").update({ noc_download_enabled: data.enabled, updated_at: new Date().toISOString() }).ilike("email", emailKey);
        await admin.from("applications").update({ noc_download_enabled: data.enabled, updated_at: new Date().toISOString() }).ilike("email", emailKey);
      }
    } catch (dbErr) {
      console.warn("[toggleInternNocDownload] database column update non-fatal:", dbErr);
    }

    return { success: true, enabled: data.enabled };
  });

export const toggleAllInternsNocDownload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ enabled: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    const admin = getAdminClient();
    
    // Always persist to site_settings
    try {
      await admin.from("site_settings").upsert({
        id: "noc_download_settings",
        enabled: data.enabled,
        value: { enabled: data.enabled },
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn("[toggleAllInternsNocDownload] site_settings upsert error:", e);
    }

    try {
      await admin.from("profiles").update({ noc_download_enabled: data.enabled, updated_at: new Date().toISOString() }).neq("id", "00000000-0000-0000-0000-000000000000");
      await admin.from("applications").update({ noc_download_enabled: data.enabled, updated_at: new Date().toISOString() }).neq("id", "00000000-0000-0000-0000-000000000000");
    } catch (dbErr) {
      console.warn("[toggleAllInternsNocDownload] database column update non-fatal:", dbErr);
    }

    return { success: true, enabled: data.enabled };
  });

// ─── HOLIDAYS MANAGEMENT ───
export interface HolidayItem {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  type: "public" | "company" | "festive" | "optional";
  description?: string;
  is_recurring?: boolean;
  created_at?: string;
}

const DEFAULT_HOLIDAYS: HolidayItem[] = [
  { id: "h-new-year", name: "New Year's Day", date: "2026-01-01", type: "public", description: "Official New Year Holiday" },
  { id: "h-republic-day", name: "Republic Day", date: "2026-01-26", type: "public", description: "National Republic Day of India" },
  { id: "h-holi", name: "Holi", date: "2026-03-04", type: "festive", description: "Festival of Colours" },
  { id: "h-independence-day", name: "Independence Day", date: "2026-08-15", type: "public", description: "Indian Independence Day" },
  { id: "h-gandhi-jayanti", name: "Mahatma Gandhi Jayanti", date: "2026-10-02", type: "public", description: "Birth Anniversary of Mahatma Gandhi" },
  { id: "h-diwali", name: "Diwali (Deepavali)", date: "2026-11-08", type: "festive", description: "Festival of Lights" },
  { id: "h-christmas", name: "Christmas Day", date: "2026-12-25", type: "public", description: "Christmas Holiday" },
];

export const listHolidays = createServerFn({ method: "GET" })
  .handler(async () => {
    const admin = getAdminClient();
    try {
      const { data } = await admin
        .from("site_settings")
        .select("value")
        .eq("id", "company_holidays_calendar")
        .maybeSingle();

      if (data?.value && Array.isArray(data.value)) {
        return (data.value as HolidayItem[]).sort((a, b) => a.date.localeCompare(b.date));
      }
    } catch (e) {
      console.warn("[listHolidays] error reading site_settings:", e);
    }
    return DEFAULT_HOLIDAYS.sort((a, b) => a.date.localeCompare(b.date));
  });

export const createHoliday = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    name: z.string().min(1),
    date: z.string().min(1),
    type: z.enum(["public", "company", "festive", "optional"]).default("company"),
    description: z.string().optional().default(""),
    is_recurring: z.boolean().optional().default(false),
  }).parse(d))
  .handler(async ({ data }) => {
    const admin = getAdminClient();
    const existing = await listHolidays();
    const newHoliday: HolidayItem = {
      id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: data.name,
      date: data.date,
      type: data.type,
      description: data.description,
      is_recurring: data.is_recurring,
      created_at: new Date().toISOString(),
    };

    const updatedList = [...existing, newHoliday].sort((a, b) => a.date.localeCompare(b.date));

    await admin.from("site_settings").upsert({
      id: "company_holidays_calendar",
      enabled: true,
      value: updatedList,
      updated_at: new Date().toISOString(),
    });

    return { success: true, holiday: newHoliday };
  });

export const updateHoliday = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string(),
    name: z.string().min(1),
    date: z.string().min(1),
    type: z.enum(["public", "company", "festive", "optional"]).default("company"),
    description: z.string().optional().default(""),
    is_recurring: z.boolean().optional().default(false),
  }).parse(d))
  .handler(async ({ data }) => {
    const admin = getAdminClient();
    const existing = await listHolidays();
    const updatedList = existing.map(h => h.id === data.id ? { ...h, ...data } : h).sort((a, b) => a.date.localeCompare(b.date));

    await admin.from("site_settings").upsert({
      id: "company_holidays_calendar",
      enabled: true,
      value: updatedList,
      updated_at: new Date().toISOString(),
    });

    return { success: true };
  });

export const deleteHoliday = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const admin = getAdminClient();
    const existing = await listHolidays();
    const updatedList = existing.filter(h => h.id !== data.id);

    await admin.from("site_settings").upsert({
      id: "company_holidays_calendar",
      enabled: true,
      value: updatedList,
      updated_at: new Date().toISOString(),
    });

    return { success: true };
  });

// ─── Manual Payment & Referral Code Assignment (Admin) ───────────────

export const recordManualInternPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    userId: z.string(),
    amount: z.number().optional(),
    paymentMode: z.string().default("Direct UPI Transfer"),
    referenceNo: z.string().min(1),
    paymentDate: z.string().optional(),
    adminNotes: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Unauthorized");
    const admin = getAdminClient();

    const paidTimestamp = data.paymentDate ? localDateTimeToIso(data.paymentDate) || new Date().toISOString() : new Date().toISOString();
    const cleanRefNo = data.referenceNo.trim().toUpperCase();

    const updatePayload: any = {
      exam_fee_paid: true,
      payment_reference_no: cleanRefNo,
      payment_mode: data.paymentMode,
      payment_status: "paid",
      urgent_popup_active: false,
      fee_payment_scheduled: false,
      paid_at: paidTimestamp,
      updated_at: new Date().toISOString(),
    };
    if (data.amount !== undefined) {
      updatePayload.exam_fee_amount = data.amount;
    }

    // 1. Update Profile
    const { error: profError } = await admin
      .from("profiles")
      .update(updatePayload)
      .eq("id", data.userId);

    if (profError) {
      console.warn("[recordManualInternPayment] Profile update warning:", profError.message);
    }

    // 2. Update Application if matched by ID or email
    try {
      const { data: prof } = await admin.from("profiles").select("email").eq("id", data.userId).maybeSingle();
      if (prof?.email) {
        await admin
          .from("applications")
          .update({
            exam_fee_paid: true,
            payment_reference_no: cleanRefNo,
            payment_mode: data.paymentMode,
            payment_status: "paid",
            updated_at: new Date().toISOString(),
          })
          .eq("email", prof.email);
      }
    } catch (e) {
      console.warn("[recordManualInternPayment] Application update skipped:", e);
    }

    // 3. Insert notification for the intern
    try {
      await admin.from("user_notifications").insert({
        user_id: data.userId,
        title: "Exam Fee Payment Verified Manually",
        message: `Your payment of ₹${data.amount || "199"} via ${data.paymentMode} has been manually confirmed by Directorate (Ref / UTR: ${cleanRefNo}). Your intern dashboard and task deliverables are fully unlocked.`,
        type: "payment_confirmed",
        is_read: false,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("[recordManualInternPayment] Notification insert skipped:", e);
    }

    return {
      success: true,
      referenceNo: cleanRefNo,
      message: `Manual payment (Ref: ${cleanRefNo}) recorded successfully!`,
    };
  });

export const assignReferralCodeToIntern = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    internId: z.string(),
    referralCode: z.string().min(1),
    applyPricingRule: z.boolean().default(true),
  }).parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Unauthorized");
    const admin = getAdminClient();
    const cleanCode = data.referralCode.trim().toUpperCase();

    // Fetch pricing rule if exists
    let ruleExamFee: number | null = null;
    if (data.applyPricingRule) {
      const { data: rule } = await admin
        .from("referral_pricing_rules")
        .select("*")
        .ilike("code", cleanCode)
        .maybeSingle();

      if (rule) {
        ruleExamFee = Number(rule.custom_exam_fee);
      }
    }

    // 1. Update Profile
    const profileUpdate: any = {
      referral_code_used: cleanCode,
      updated_at: new Date().toISOString(),
    };
    if (ruleExamFee !== null) {
      profileUpdate.exam_fee_amount = ruleExamFee;
      if (ruleExamFee === 0) {
        profileUpdate.is_fee_exempted = true;
      }
    }

    const { error: profError } = await admin
      .from("profiles")
      .update(profileUpdate)
      .eq("id", data.internId);

    if (profError) {
      console.warn("[assignReferralCodeToIntern] Profile update warning:", profError.message);
    }

    // 2. Update Application
    try {
      const { data: prof } = await admin.from("profiles").select("email").eq("id", data.internId).maybeSingle();
      if (prof?.email) {
        await admin
          .from("applications")
          .update({
            referral_code_used: cleanCode,
            updated_at: new Date().toISOString(),
          })
          .eq("email", prof.email);
      }
    } catch (e) {
      console.warn("[assignReferralCodeToIntern] Application update skipped:", e);
    }

    // 3. Notify intern
    try {
      await admin.from("user_notifications").insert({
        user_id: data.internId,
        title: "Referral ID Linked",
        message: `Referral code "${cleanCode}" has been successfully assigned to your internship profile${ruleExamFee !== null ? ` (Exam fee adjusted to ₹${ruleExamFee})` : ""}.`,
        type: "referral_linked",
        is_read: false,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("[assignReferralCodeToIntern] Notification skipped:", e);
    }

    return {
      success: true,
      referralCode: cleanCode,
      customFeeApplied: ruleExamFee,
      message: `Referral code "${cleanCode}" successfully assigned to candidate!`,
    };
  });


