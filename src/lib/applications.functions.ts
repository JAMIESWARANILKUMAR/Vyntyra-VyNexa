import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCloudflareAuth } from "@/integrations/supabase/auth-middleware";
import { db } from "@/db";
import { applications, applicationProjects, siteSettings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { uploadFileToR2, getSignedUrlForR2 } from "@/lib/storage";

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
    // Enforce the "Accepting Applications" toggle server-side
    const settings = await db.select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, "applications_open"));
    
    const setting = settings[0];
    const enabled = ((setting?.value ?? {}) as { enabled?: boolean }).enabled !== false;
    if (!enabled) {
      throw new Error("Applications are currently closed. Please check back soon.");
    }
    
    const insert = {
      fullName: data.full_name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      roleApplied: data.role_applied,
      message: data.message || null,
      company: data.company || null,
      position: data.position || null,
      linkedinUrl: data.linkedin_url || null,
      yearsExperience: data.years_experience || null,
      portfolioUrl: data.portfolio_url || null,
      availability: data.availability || null,
      resumePath: data.resume_path || null,
      jobPostingId: data.job_posting_id || null,
      state: data.state || null,
      college: data.college || null,
      graduationYear: data.graduation_year ?? null,
      hodName: data.hod_name || null,
      hodContact: data.hod_contact || null,
      hodEmail: data.hod_email ? data.hod_email.toLowerCase() : null,
      tpOfficerName: data.tp_officer_name || null,
      tpOfficerContact: data.tp_officer_contact || null,
      tpOfficerEmail: data.tp_officer_email ? data.tp_officer_email.toLowerCase() : null,
      agreementAccepted: true,
      agreementVersion: "1.0",
      status: "new" as const,
    };

    const insertedRows = await db.insert(applications).values(insert).returning({ id: applications.id });
    const row = insertedRows[0];

    if (!row) throw new Error("Failed to insert application");

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
        applicationId: row.id,
        title: p.title,
        summary: p.summary,
        projectUrl: p.project_url || null,
        documentPath: p.document_path || null,
      }));
      try {
        await db.insert(applicationProjects).values(rows);
      } catch (pErr) {
         console.warn("[applications] project insert skipped:", (pErr as Error).message);
      }
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
  .middleware([requireCloudflareAuth])
  .inputValidator((d: unknown) => deleteSchema.parse(d))
  .handler(async ({ data, context }) => {
    // We already requireCloudflareAuth. Usually you'd check role here against db.
    await db.delete(applications).where(eq(applications.id, data.id));
    return { ok: true };
  });

// List projects for an application (admin only)
export const listApplicationProjects = createServerFn({ method: "POST" })
  .middleware([requireCloudflareAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const rows = await db.select().from(applicationProjects).where(eq(applicationProjects.applicationId, data.id));
    
    // Sign document URLs when present
    const signed = await Promise.all(
      (rows ?? []).map(async (r) => {
        if (!r.documentPath) return { ...r, document_url: null };
        const signedUrl = await getSignedUrlForR2(r.documentPath, 60 * 10);
        return { ...r, document_url: signedUrl };
      }),
    );
    return signed;
  });

// ---------- Admin ----------

export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireCloudflareAuth])
  .handler(async ({ context }) => {
    const rows = await db.select().from(applications).orderBy(desc(applications.createdAt));
    return rows;
  });

const updateNotesSchema = z.object({
  id: z.string().uuid(),
  admin_notes: z.string().max(2000),
});

export const updateAdminNotes = createServerFn({ method: "POST" })
  .middleware([requireCloudflareAuth])
  .inputValidator((d: unknown) => updateNotesSchema.parse(d))
  .handler(async ({ data, context }) => {
    await db.update(applications).set({ adminNotes: data.admin_notes || null }).where(eq(applications.id, data.id));
    return { ok: true };
  });

const resumeSchema = z.object({ path: z.string().min(1) });

export const getResumeSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireCloudflareAuth])
  .inputValidator((d: unknown) => resumeSchema.parse(d))
  .handler(async ({ data, context }) => {
    const url = await getSignedUrlForR2(data.path, 60 * 10);
    return { url };
  });

// Admin: regenerate interview questions on demand
const regenSchema = z.object({ id: z.string().uuid() });

export const regenerateInterviewQuestions = createServerFn({ method: "POST" })
  .middleware([requireCloudflareAuth])
  .inputValidator((d: unknown) => regenSchema.parse(d))
  .handler(async ({ data, context }) => {
    const appRows = await db.select({
      id: applications.id,
      full_name: applications.fullName,
      role_applied: applications.roleApplied,
      resume_path: applications.resumePath,
      years_experience: applications.yearsExperience
    }).from(applications).where(eq(applications.id, data.id));
    
    const app = appRows[0];
    if (!app) throw new Error("Not found");

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
