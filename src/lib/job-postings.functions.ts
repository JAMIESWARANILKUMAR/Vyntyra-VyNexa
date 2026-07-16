import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";

async function checkIsAdmin(userId: string) {
    const { adminDb } = await import("@/integrations/firebase/admin");
    const rolesDoc = await adminDb!.collection("user_roles").where("user_id", "==", userId).where("role", "==", "admin").get();
    return !rolesDoc.empty;
}

// ---------- Admin ----------

export const listJobPostings = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const { adminDb } = await import("@/integrations/firebase/admin");
    const snapshot = await adminDb!.collection("job_postings")
      .orderBy("created_at", "desc")
      .get();
      
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  });

const createJobPostingSchema = z.object({
  title: z.string().trim().min(2).max(200),
  department: z.string().trim().min(1).max(120),
  location: z.string().trim().max(200).default("Remote"),
  type: z.string().trim().max(60).default("Full-time"),
  description: z.string().trim().min(10).max(5000),
  requirements: z.string().trim().max(5000).optional().or(z.literal("")),
  salary_range: z.string().trim().max(100).optional().or(z.literal("")),
});

export const createJobPosting = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((d: unknown) => createJobPostingSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const { adminDb } = await import("@/integrations/firebase/admin");
    
    const insert = {
        title: data.title,
        department: data.department,
        location: data.location,
        type: data.type,
        description: data.description,
        requirements: data.requirements || null,
        salary_range: data.salary_range || null,
        created_by: context.userId,
        is_active: true,
        created_at: new Date().toISOString()
    };
    
    const docRef = await adminDb!.collection("job_postings").add(insert);
    return { id: docRef.id };
  });

const updateJobPostingSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(2).max(200),
  department: z.string().trim().min(1).max(120),
  location: z.string().trim().max(200).default("Remote"),
  type: z.string().trim().max(60).default("Full-time"),
  description: z.string().trim().min(10).max(5000),
  requirements: z.string().trim().max(5000).optional().or(z.literal("")),
  salary_range: z.string().trim().max(100).optional().or(z.literal("")),
});

export const updateJobPosting = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((d: unknown) => updateJobPostingSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const { adminDb } = await import("@/integrations/firebase/admin");
    await adminDb!.collection("job_postings").doc(data.id).update({
        title: data.title,
        department: data.department,
        location: data.location,
        type: data.type,
        description: data.description,
        requirements: data.requirements || null,
        salary_range: data.salary_range || null,
        updated_at: new Date().toISOString()
    });
    return { ok: true };
  });

const toggleJobPostingSchema = z.object({ id: z.string() });

export const toggleJobPosting = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((d: unknown) => toggleJobPostingSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const { adminDb } = await import("@/integrations/firebase/admin");
    const docRef = adminDb!.collection("job_postings").doc(data.id);
    const doc = await docRef.get();
    
    if (!doc.exists) throw new Error("Not found");
    
    const newActive = !doc.data()!.is_active;
    await docRef.update({ is_active: newActive });
    
    return { id: data.id, is_active: newActive };
  });

const deleteJobPostingSchema = z.object({ id: z.string() });

export const deleteJobPosting = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((d: unknown) => deleteJobPostingSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const { adminDb } = await import("@/integrations/firebase/admin");
    await adminDb!.collection("job_postings").doc(data.id).delete();
    return { ok: true };
  });

// ---------- Public ----------

export const listActiveJobPostings = createServerFn({ method: "GET" }).handler(async () => {
    const { adminDb } = await import("@/integrations/firebase/admin");
    const snapshot = await adminDb!.collection("job_postings")
        .where("is_active", "==", true)
        .orderBy("created_at", "desc")
        .get();
        
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});
