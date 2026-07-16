import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";

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

async function checkIsAdmin(userId: string) {
    const { adminDb } = await import("@/integrations/firebase/admin");
    const rolesDoc = await adminDb!.collection("user_roles").where("user_id", "==", userId).where("role", "==", "admin").get();
    return !rolesDoc.empty;
}

export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data }) => {
    const { adminDb } = await import("@/integrations/firebase/admin");

    // Enforce the "Accepting Applications" toggle server-side
    const settingsDoc = await adminDb!.collection("site_settings").doc("applications_open").get();
    const enabled = settingsDoc.exists ? settingsDoc.data()?.enabled !== false : true;
    
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
      created_at: new Date().toISOString(),
      status: 'new'
    };

    const docRef = await adminDb!.collection("applications").add(insert);

    // Log admin notification
    try {
      const { insertNotification } = await import("./notifications.functions");
      await insertNotification({
        type: "new_application",
        title: "New Application Received",
        message: `${data.full_name} applied for ${data.role_applied}`,
        metadata: { applicationId: docRef.id, email: data.email, role: data.role_applied },
      });
    } catch (e) {
      console.warn("[applications] notification insert skipped:", (e as Error)?.message);
    }

    if (data.projects && data.projects.length) {
      const batch = adminDb!.batch();
      for(const p of data.projects) {
          const pRef = adminDb!.collection("application_projects").doc();
          batch.set(pRef, {
            application_id: docRef.id,
            title: p.title,
            summary: p.summary,
            project_url: p.project_url || null,
            document_path: p.document_path || null,
            created_at: new Date().toISOString()
          });
      }
      await batch.commit();
    }

    try {
      const { notifyAdminOfApplication } = await import("./notify.server");
      await notifyAdminOfApplication({
        applicationId: docRef.id,
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
        applicationId: docRef.id,
        resumePath: data.resume_path || null,
        roleApplied: data.role_applied,
        fullName: data.full_name,
        yearsExperience: data.years_experience,
      });
    } catch (e) {
      console.warn("[applications] AI questions skipped:", (e as Error)?.message);
    }

    return { id: docRef.id };
  });

// Delete application (admin only)
const deleteSchema = z.object({ id: z.string() });

export const deleteApplication = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((d: unknown) => deleteSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");
    const { adminDb } = await import("@/integrations/firebase/admin");
    await adminDb!.collection("applications").doc(data.id).delete();
    return { ok: true };
  });

// List projects for an application (admin only)
export const listApplicationProjects = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");
    const { adminDb } = await import("@/integrations/firebase/admin");
    
    const snapshot = await adminDb!.collection("application_projects")
      .where("application_id", "==", data.id)
      .orderBy("created_at", "asc")
      .get();
      
    const rows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    
    const { adminStorage } = await import("@/integrations/firebase/admin");
    
    // Sign document URLs when present
    const signed = await Promise.all(
      rows.map(async (r) => {
        if (!r.document_path) return { ...r, document_url: null };
        try {
            const bucket = adminStorage!.bucket();
            const file = bucket.file(r.document_path);
            const [url] = await file.getSignedUrl({
                version: 'v4',
                action: 'read',
                expires: Date.now() + 60 * 10 * 1000 // 10 minutes
            });
            return { ...r, document_url: url };
        } catch(e) {
            return { ...r, document_url: null };
        }
      }),
    );
    return signed;
  });

// ---------- Admin ----------

export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const { adminDb } = await import("@/integrations/firebase/admin");
    const snapshot = await adminDb!.collection("applications")
      .orderBy("created_at", "desc")
      .get();
      
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  });

const updateNotesSchema = z.object({
  id: z.string(),
  admin_notes: z.string().max(2000),
});

export const updateAdminNotes = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((d: unknown) => updateNotesSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const { adminDb } = await import("@/integrations/firebase/admin");
    await adminDb!.collection("applications").doc(data.id).update({
        admin_notes: data.admin_notes || null
    });
    return { ok: true };
  });

const resumeSchema = z.object({ path: z.string().min(1) });

export const getResumeSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((d: unknown) => resumeSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const { adminStorage } = await import("@/integrations/firebase/admin");
    const bucket = adminStorage!.bucket();
    const file = bucket.file(data.path);
    const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 60 * 10 * 1000 // 10 minutes
    });
    return { url };
  });

// Admin: regenerate interview questions on demand
const regenSchema = z.object({ id: z.string() });

export const regenerateInterviewQuestions = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((d: unknown) => regenSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const { adminDb } = await import("@/integrations/firebase/admin");
    const appDoc = await adminDb!.collection("applications").doc(data.id).get();
    
    if (!appDoc.exists) throw new Error("Not found");
    const app = appDoc.data()!;

    const { generateInterviewQuestions } = await import("./interview-questions.server");
    const text = await generateInterviewQuestions({
      applicationId: appDoc.id,
      resumePath: app.resume_path,
      roleApplied: app.role_applied,
      fullName: app.full_name,
      yearsExperience: app.years_experience,
    });
    return { text };
  });
