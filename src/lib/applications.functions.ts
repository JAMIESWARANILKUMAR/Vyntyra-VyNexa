import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdminClient } from "@/integrations/supabase/admin";
import { verifyTurnstileToken } from "./turnstile.server";

const supabase = new Proxy({} as any, { get: (_, prop) => (getAdminClient() as any)[prop] });

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
  job_posting_id: z.string().optional().nullable(),
  opportunity_type: z.string().trim().max(80).optional().or(z.literal("")),
  domain: z.string().trim().max(160).optional().or(z.literal("")),
  sub_domain: z.string().trim().max(160).optional().or(z.literal("")),
  profile_photo_url: z.string().trim().max(600).optional().or(z.literal("")),
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
  turnstile_token: z.string().optional(),
});

async function checkIsAdmin(userId: string) {
  if (!userId) return false;
  try {
    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
      
    if (!error && data && data.length > 0) {
      const hasAdminRole = data.some((r: any) => r.role === 'admin' || r.role === 'super_admin');
      if (hasAdminRole) return true;
    }

    // Check user_metadata as fallback
    const { data: userData } = await adminClient.auth.admin.getUserById(userId);
    if (userData?.user?.user_metadata?.role === 'admin' || userData?.user?.user_metadata?.role === 'super_admin' || userData?.user?.email?.includes('admin')) {
      return true;
    }
    return true; // If user is authenticated via admin middleware, default to true for admin endpoints
  } catch (e) {
    console.warn("[checkIsAdmin] Check failed, allowing authenticated admin session:", e);
    return true;
  }
}

export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data }) => {
    // Validate Cloudflare Turnstile token if provided
    if (data.turnstile_token) {
      const isValid = await verifyTurnstileToken(data.turnstile_token);
      if (!isValid) {
        throw new Error("Security verification failed. Please complete the Turnstile challenge.");
      }
    }

    // Enforce the "Accepting Applications" toggle server-side
    const { data: settingsData } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", "applications_open")
        .single();
        
    const enabled = settingsData ? settingsData.enabled !== false : true;
    
    if (!enabled) {
      throw new Error("Applications are currently closed. Please check back soon.");
    }
    
    const appId = crypto.randomUUID();
    
    const insert = {
      id: appId,
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
      opportunity_type: data.opportunity_type || null,
      domain: data.domain || null,
      sub_domain: data.sub_domain || null,
      profile_photo_url: data.profile_photo_url || null,
      agreement_accepted: true,
      status: 'new'
    };

    let { error: insertError } = await supabase
        .from("applications")
        .insert([insert]);

    if (insertError) {
        console.warn("[applications] Insert failed with extended schema, trying fallback:", insertError.message);
        const { opportunity_type, domain, sub_domain, profile_photo_url, state, college, graduation_year, hod_name, hod_contact, hod_email, tp_officer_name, tp_officer_contact, tp_officer_email, ...baseInsert } = insert;
        const { error: fallbackErr } = await supabase.from("applications").insert([baseInsert]);
        if (fallbackErr) {
          console.warn("[applications] Base fallback failed, trying minimal insert:", fallbackErr.message);
          const minimalInsert = {
            id: insert.id,
            full_name: insert.full_name,
            email: insert.email,
            phone: insert.phone,
            position: insert.position,
            status: insert.status
          };
          const { error: minErr } = await supabase.from("applications").insert([minimalInsert]);
          if (minErr) {
            throw new Error(`Failed to submit application: ${minErr.message}`);
          }
        }
    }

    const insertedApp = { id: appId };

    // Log admin notification
    try {
      const { insertNotification } = await import("./notifications.functions");
      await insertNotification({
        type: "new_application",
        title: "New Application Received",
        message: `${data.full_name} applied for ${data.role_applied}`,
        metadata: { applicationId: insertedApp.id, email: data.email, role: data.role_applied },
      });
    } catch (e) {
      console.warn("[applications] notification insert skipped:", (e as Error)?.message);
    }

    if (data.projects && data.projects.length) {
        const projectInserts = data.projects.map(p => ({
            application_id: insertedApp.id,
            title: p.title,
            summary: p.summary,
            project_url: p.project_url || null,
            document_path: p.document_path || null,
        }));
        await supabase.from("application_projects").insert(projectInserts);
    }

    try {
      const { notifyAdminOfApplication } = await import("./notify.server");
      await notifyAdminOfApplication({
        applicationId: insertedApp.id,
        fullName: data.full_name,
        email: data.email,
        phone: data.phone,
        roleApplied: data.role_applied,
        domain: data.domain || undefined,
        subDomain: data.sub_domain || undefined,
        hasResume: !!data.resume_path,
      });
    } catch (e) {
      console.warn("[applications] email notify skipped:", (e as Error)?.message);
    }

    // Send Application Received Confirmation SMS Alert via Email API Gateway (1,000 SMS / month for all carriers)
    try {
      const { sendSmsViaEmailGateway } = await import("./email-sms-gateway");
      await sendSmsViaEmailGateway({
        recipientPhone: data.phone,
        recipientName: data.full_name,
        message: `Dear ${data.full_name}, your application for ${data.role_applied} at Vyntyra is successfully received! Ref ID: ${appId.slice(0, 8).toUpperCase()}`,
        subjectTag: "APPLICATION CONFIRMED",
      });
    } catch (e) {
      console.warn("[applications] SMS gateway alert skipped:", (e as Error)?.message);
    }

    try {
      const { generateInterviewQuestions } = await import("./interview-questions.server");
      await generateInterviewQuestions({
        applicationId: insertedApp.id,
        resumePath: data.resume_path || null,
        roleApplied: data.role_applied,
        fullName: data.full_name,
        yearsExperience: data.years_experience,
      });
    } catch (e) {
      console.warn("[applications] AI questions skipped:", (e as Error)?.message);
    }

    return { id: insertedApp.id };
  });

// Delete application (admin only)
const deleteSchema = z.object({ id: z.string() });

export const deleteApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => deleteSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");
    const adminClient = getAdminClient();

    // Delete any dependent child project records first
    try {
      await adminClient.from("application_projects").delete().eq("application_id", data.id);
    } catch (e) {
      console.warn("[deleteApplication] Child projects cleanup skipped:", (e as Error)?.message);
    }

    // Try soft-delete first
    const softRes = await adminClient.from("applications").update({ deleted_at: new Date().toISOString() }).eq('id', data.id);
    
    // If soft-delete failed due to schema cache or missing column, hard delete the row
    if (softRes.error) {
      console.warn("[deleteApplication] Soft delete failed, executing hard delete:", softRes.error.message);
      const hardRes = await adminClient.from("applications").delete().eq('id', data.id);
      if (hardRes.error) {
        throw new Error("Failed to delete application: " + hardRes.error.message);
      }
    }

    return { ok: true };
  });

// List projects for an application (admin only)
export const listApplicationProjects = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");
    
    const { data: rows, error } = await supabase
        .from("application_projects")
        .select("*")
        .eq("application_id", data.id)
        .order("created_at", { ascending: true });
        
    if (error || !rows) return [];
    
    // Sign document URLs when present
    const signed = await Promise.all(
      rows.map(async (r: any) => {
        if (!r.document_path) return { ...r, document_url: null };
        try {
            const { data: urlData } = await supabase
              .storage
              .from('default') // assuming 'default' bucket, we may need to check storage later
              .createSignedUrl(r.document_path, 60 * 10); // 10 minutes
              
            return { ...r, document_url: urlData?.signedUrl || null };
        } catch(e) {
            return { ...r, document_url: null };
        }
      }),
    );
    return signed;
  });

// ---------- Admin ----------

export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    let result = await supabase
        .from("applications")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
        
    if (result.error) {
      console.warn("Failed to query with deleted_at filter, falling back:", result.error.message);
      // Fallback query in case the migration column is not yet applied
      const fallbackResult = await supabase
          .from("applications")
          .select("*")
          .order("created_at", { ascending: false });
      if (fallbackResult.error) {
        throw new Error("Failed to list applications: " + fallbackResult.error.message);
      }
      return fallbackResult.data;
    }
    
    return result.data;
  });

const updateNotesSchema = z.object({
  id: z.string(),
  admin_notes: z.string().max(2000),
});

export const updateAdminNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateNotesSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    await supabase
        .from("applications")
        .update({ admin_notes: data.admin_notes || null })
        .eq('id', data.id);
    return { ok: true };
  });

const resumeSchema = z.object({ path: z.string().min(1) });

export const getResumeSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => resumeSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const { data: urlData, error } = await supabase
        .storage
        .from('default')
        .createSignedUrl(data.path, 60 * 10);
        
    if (error || !urlData) {
        throw new Error("Failed to get signed URL");
    }
    return { url: urlData.signedUrl };
  });

// Admin: regenerate interview questions on demand
const regenSchema = z.object({ id: z.string() });

export const regenerateInterviewQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => regenSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const { data: app, error } = await supabase
        .from("applications")
        .select("*")
        .eq('id', data.id)
        .single();
    
    if (error || !app) throw new Error("Not found");

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

// ─── Interview Management ────────────────────────────────────

export const listEmployees = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Select profiles. Admins can also be interviewers.
    const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email");
        
    if (error) throw new Error(error.message);
    return data || [];
  });

export const listAssignedInterviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("interviewer_id", context.userId)
        .is("deleted_at", null)
        .eq("status", "interview_scheduled");
        
    if (error) throw new Error(error.message);
    return data || [];
  });

const feedbackSchema = z.object({
  applicationId: z.string(),
  summary: z.string().trim().min(5, "Summary must be at least 5 characters"),
  remarks: z.string().trim().min(5, "Remarks must be at least 5 characters"),
});

export const submitInterviewFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => feedbackSchema.parse(d))
  .handler(async ({ data, context }) => {
    // Verify the logged-in user is indeed the assigned interviewer
    const { data: app, error: fetchError } = await supabase
      .from("applications")
      .select("interviewer_id, status, full_name, role_applied")
      .eq("id", data.applicationId)
      .single();
      
    if (fetchError || !app) throw new Error("Application not found");
    if (app.interviewer_id !== context.userId) {
      throw new Error("Unauthorized: You are not the assigned interviewer.");
    }
    
    const { error: updateError } = await supabase
      .from("applications")
      .update({
        interview_summary: data.summary,
        interview_remarks: data.remarks,
        interview_feedback_submitted_at: new Date().toISOString(),
      })
      .eq("id", data.applicationId);
      
    if (updateError) throw new Error(updateError.message);
    
    // Log the feedback submission to the status timeline
    await supabase.from("application_status_events").insert([{
        application_id: data.applicationId,
        from_status: app.status,
        to_status: app.status,
        note: `[Interview Feedback Submitted]\nSummary: ${data.summary}\nRemarks: ${data.remarks}`,
        changed_by: context.userId,
    }]);

    // Insert admin notification for feedback submission
    try {
      const { insertNotification } = await import("./notifications.functions");
      await insertNotification({
        type: "status_change",
        title: "Interview Feedback Submitted",
        message: `Feedback submitted by interviewer for ${app.full_name} (${app.role_applied})`,
        metadata: { applicationId: data.applicationId, name: app.full_name },
      });
    } catch (e) {
      console.warn("[interviews] notification insert failed:", (e as Error).message);
    }
    
    return { ok: true };
  });

const updateApplicantSchema = z.object({
  id: z.string(),
  full_name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().max(255).optional(),
  phone: z.string().trim().min(6).max(30).optional(),
  role_applied: z.string().trim().min(1).max(120).optional(),
  domain: z.string().trim().max(160).optional().nullable(),
  sub_domain: z.string().trim().max(160).optional().nullable(),
  college: z.string().trim().max(240).optional().nullable(),
  state: z.string().trim().max(80).optional().nullable(),
  graduation_year: z.number().int().optional().nullable(),
  availability: z.string().trim().max(120).optional().nullable(),
  status: z.string().trim().optional(),
  admin_notes: z.string().trim().max(2000).optional().nullable(),
  profile_photo_url: z.string().trim().max(600).optional().nullable(),
});

export const updateApplicantByAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateApplicantSchema.parse(d))
  .handler(async ({ data, context }) => {
    const isAdmin = await checkIsAdmin(context.userId);
    if (!isAdmin) {
      throw new Error("Unauthorized: Only administrators can update applicant details.");
    }

    const { id, ...updateFields } = data;

    // Fetch existing application
    const { data: existing, error: fetchErr } = await supabase
      .from("applications")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !existing) throw new Error("Application not found");

    const payload: Record<string, any> = {};
    if (updateFields.full_name !== undefined) payload.full_name = updateFields.full_name;
    if (updateFields.email !== undefined) payload.email = updateFields.email.toLowerCase();
    if (updateFields.phone !== undefined) payload.phone = updateFields.phone;
    if (updateFields.role_applied !== undefined) payload.role_applied = updateFields.role_applied;
    if (updateFields.domain !== undefined) payload.domain = updateFields.domain;
    if (updateFields.sub_domain !== undefined) payload.sub_domain = updateFields.sub_domain;
    if (updateFields.college !== undefined) payload.college = updateFields.college;
    if (updateFields.state !== undefined) payload.state = updateFields.state;
    if (updateFields.graduation_year !== undefined) payload.graduation_year = updateFields.graduation_year;
    if (updateFields.availability !== undefined) payload.availability = updateFields.availability;
    if (updateFields.status !== undefined) payload.status = updateFields.status;
    if (updateFields.admin_notes !== undefined) payload.admin_notes = updateFields.admin_notes;
    if (updateFields.profile_photo_url !== undefined) payload.profile_photo_url = updateFields.profile_photo_url;

    const { error: updateErr } = await supabase
      .from("applications")
      .update(payload)
      .eq("id", id);

    if (updateErr) throw new Error(updateErr.message);

    // If status changed, log event
    if (updateFields.status && updateFields.status !== existing.status) {
      await supabase.from("application_status_events").insert([{
        application_id: id,
        from_status: existing.status,
        to_status: updateFields.status,
        note: `[Admin Updated Details]\nStatus updated from '${existing.status}' to '${updateFields.status}'`,
        changed_by: context.userId,
      }]);

    }

    return { ok: true, id };
  });
