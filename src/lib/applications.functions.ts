import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const projectSchema = z.object({
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().min(1).max(3000),
  project_url: z.string().trim().max(500).optional().or(z.literal("")),
  document_path: z.string().trim().max(500).optional().or(z.literal("")),
});

const submitSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(6).max(30),
  role_applied: z.string().trim().min(1).max(120),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  position: z.string().trim().max(160).optional().or(z.literal("")),
  linkedin_url: z.string().trim().max(300).optional().or(z.literal("")),
  years_experience: z.string().trim().max(40).optional().or(z.literal("")),
  portfolio_url: z.string().trim().max(300).optional().or(z.literal("")),
  availability: z.string().trim().max(120).optional().or(z.literal("")),
  resume_path: z.string().trim().max(500).optional().or(z.literal("")),
  job_posting_id: z.string().uuid().optional().nullable(),
  // Academic details
  state: z.string().trim().max(80).optional().or(z.literal("")),
  college: z.string().trim().max(240).optional().or(z.literal("")),
  graduation_year: z.number().int().min(2022).max(2035).optional().nullable(),
  hod_name: z.string().trim().max(160).optional().or(z.literal("")),
  hod_contact: z.string().trim().max(40).optional().or(z.literal("")),
  hod_email: z.string().trim().max(255).optional().or(z.literal("")),
  tp_officer_name: z.string().trim().max(160).optional().or(z.literal("")),
  tp_officer_contact: z.string().trim().max(40).optional().or(z.literal("")),
  tp_officer_email: z.string().trim().max(255).optional().or(z.literal("")),
  projects: z.array(projectSchema).max(30).optional(),
  agreement_accepted: z.literal(true),
});

export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Enforce the "Accepting Applications" toggle server-side
    const { data: setting } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "applications_open")
      .maybeSingle();
    const enabled = ((setting?.value ?? {}) as { enabled?: boolean }).enabled !== false;
    if (!enabled) {
      throw new Error("Applications are currently closed. Please check back soon.");
    }
    const insert = {
      full_name: data.full_name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      role_applied: data.role_applied,
      message: data.message || null,
      company: data.company || null,
      position: data.position || null,
      linkedin_url: data.linkedin_url || null,
      years_experience: data.years_experience || null,
      portfolio_url: data.portfolio_url || null,
      availability: data.availability || null,
      resume_path: data.resume_path || null,
      job_posting_id: data.job_posting_id || null,
      state: data.state || null,
      college: data.college || null,
      graduation_year: data.graduation_year ?? null,
      hod_name: data.hod_name || null,
      hod_contact: data.hod_contact || null,
      hod_email: data.hod_email ? data.hod_email.toLowerCase() : null,
      tp_officer_name: data.tp_officer_name || null,
      tp_officer_contact: data.tp_officer_contact || null,
      tp_officer_email: data.tp_officer_email ? data.tp_officer_email.toLowerCase() : null,
      agreement_accepted: true,
    };

    const { data: row, error } = await supabaseAdmin
      .from("applications")
      .insert(insert)
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    // Log admin notification
    try {
      const { insertNotification } = await import("./notifications.functions");
      await insertNotification({
        type: "new_application",
        title: "New Application Received",
        message: `${data.full_name} applied for ${data.role_applied}`,
        metadata: { applicationId: row.id, email: data.email, role: data.role_applied },
      });
    } catch (e) {
      console.warn("[applications] notification insert skipped:", (e as Error)?.message);
    }

    if (data.projects && data.projects.length) {
      const rows = data.projects.map((p) => ({
        application_id: row.id,
        title: p.title,
        summary: p.summary,
        project_url: p.project_url || null,
        document_path: p.document_path || null,
      }));
      const { error: pErr } = await supabaseAdmin.from("application_projects").insert(rows);
      if (pErr) console.warn("[applications] project insert skipped:", pErr.message);
    }

    try {
      const { notifyAdminOfApplication } = await import("./notify.server");
      await notifyAdminOfApplication({
        applicationId: row.id,
        fullName: data.full_name,
        email: data.email,
        phone: data.phone,
        roleApplied: data.role_applied,
        hasResume: !!data.resume_path,
      });
    } catch (e) {
      console.warn("[applications] email notify skipped:", (e as Error)?.message);
    }

    try {
      const { generateInterviewQuestions } = await import("./interview-questions.server");
      await generateInterviewQuestions({
        applicationId: row.id,
        resumePath: data.resume_path || null,
        roleApplied: data.role_applied,
        fullName: data.full_name,
        yearsExperience: data.years_experience,
      });
    } catch (e) {
      console.warn("[applications] AI questions skipped:", (e as Error)?.message);
    }

    return { id: row.id };
  });

// Delete application (admin only)
const deleteSchema = z.object({ id: z.string().uuid() });

export const deleteApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => deleteSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("applications").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// List projects for an application (admin only)
export const listApplicationProjects = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("application_projects")
      .select("*")
      .eq("application_id", data.id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    // Sign document URLs when present
    const signed = await Promise.all(
      (rows ?? []).map(async (r) => {
        if (!r.document_path) return { ...r, document_url: null };
        const { data: s } = await supabaseAdmin.storage
          .from("project-docs")
          .createSignedUrl(r.document_path, 60 * 10);
        return { ...r, document_url: s?.signedUrl ?? null };
      }),
    );
    return signed;
  });

// ---------- Admin ----------

export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// Status transitions live in workflow.functions.ts (require a note + log an event).
// This function only updates internal admin notes.
const updateNotesSchema = z.object({
  id: z.string().uuid(),
  admin_notes: z.string().max(2000),
});

export const updateAdminNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateNotesSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("applications")
      .update({ admin_notes: data.admin_notes || null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const resumeSchema = z.object({ path: z.string().min(1) });

export const getResumeSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => resumeSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("resumes")
      .createSignedUrl(data.path, 60 * 10);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

// Admin: regenerate interview questions on demand
const regenSchema = z.object({ id: z.string().uuid() });

export const regenerateInterviewQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => regenSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: app, error } = await supabaseAdmin
      .from("applications")
      .select("id, full_name, role_applied, resume_path, years_experience")
      .eq("id", data.id)
      .single();
    if (error || !app) throw new Error(error?.message || "Not found");

    const { generateInterviewQuestions } = await import("./interview-questions.server");
    const text = await generateInterviewQuestions({
      applicationId: app.id,
      resumePath: app.resume_path,
      roleApplied: app.role_applied,
      fullName: app.full_name,
      yearsExperience: app.years_experience,
    });
    return { text };
  });
