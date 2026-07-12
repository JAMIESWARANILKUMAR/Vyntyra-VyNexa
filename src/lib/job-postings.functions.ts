import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCloudflareAuth } from "@/integrations/supabase/auth-middleware";
import { db } from "@/db";
import { jobPostings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// ---------- Admin ----------

export const listJobPostings = createServerFn({ method: "GET" })
  .middleware([requireCloudflareAuth])
  .handler(async ({ context }) => {
    const rows = await db.select().from(jobPostings).orderBy(desc(jobPostings.createdAt));
    return rows;
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
  .middleware([requireCloudflareAuth])
  .inputValidator((d: unknown) => createJobPostingSchema.parse(d))
  .handler(async ({ data, context }) => {
    const insertedRows = await db.insert(jobPostings).values({
      title: data.title,
      department: data.department,
      location: data.location,
      type: data.type,
      description: data.description,
      requirements: data.requirements || null,
      salaryRange: data.salary_range || null,
      createdBy: context.userEmail,
    }).returning({ id: jobPostings.id });
    
    return { id: insertedRows[0].id };
  });

const updateJobPostingSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(2).max(200),
  department: z.string().trim().min(1).max(120),
  location: z.string().trim().max(200).default("Remote"),
  type: z.string().trim().max(60).default("Full-time"),
  description: z.string().trim().min(10).max(5000),
  requirements: z.string().trim().max(5000).optional().or(z.literal("")),
  salary_range: z.string().trim().max(100).optional().or(z.literal("")),
});

export const updateJobPosting = createServerFn({ method: "POST" })
  .middleware([requireCloudflareAuth])
  .inputValidator((d: unknown) => updateJobPostingSchema.parse(d))
  .handler(async ({ data, context }) => {
    await db.update(jobPostings).set({
      title: data.title,
      department: data.department,
      location: data.location,
      type: data.type,
      description: data.description,
      requirements: data.requirements || null,
      salaryRange: data.salary_range || null,
    }).where(eq(jobPostings.id, data.id));

    return { ok: true };
  });

const toggleJobPostingSchema = z.object({ id: z.string().uuid() });

export const toggleJobPosting = createServerFn({ method: "POST" })
  .middleware([requireCloudflareAuth])
  .inputValidator((d: unknown) => toggleJobPostingSchema.parse(d))
  .handler(async ({ data, context }) => {
    const rows = await db.select({
      id: jobPostings.id,
      isActive: jobPostings.isActive,
    }).from(jobPostings).where(eq(jobPostings.id, data.id));
    
    const row = rows[0];
    if (!row) throw new Error("Not found");

    const newActive = !row.isActive;
    
    await db.update(jobPostings).set({ isActive: newActive }).where(eq(jobPostings.id, data.id));
    
    return { id: data.id, is_active: newActive };
  });

const deleteJobPostingSchema = z.object({ id: z.string().uuid() });

export const deleteJobPosting = createServerFn({ method: "POST" })
  .middleware([requireCloudflareAuth])
  .inputValidator((d: unknown) => deleteJobPostingSchema.parse(d))
  .handler(async ({ data, context }) => {
    await db.delete(jobPostings).where(eq(jobPostings.id, data.id));
    return { ok: true };
  });

// ---------- Public ----------

export const listActiveJobPostings = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await db.select({
    id: jobPostings.id,
    title: jobPostings.title,
    department: jobPostings.department,
    location: jobPostings.location,
    type: jobPostings.type,
    description: jobPostings.description,
    requirements: jobPostings.requirements,
  }).from(jobPostings).where(eq(jobPostings.isActive, true)).orderBy(desc(jobPostings.createdAt));
  
  return rows;
});
