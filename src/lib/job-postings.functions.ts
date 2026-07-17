import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabase } from "@/integrations/supabase/client";

async function checkIsAdmin(userId: string) {
    const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'admin');
    return !error && data && data.length > 0;
}

// ---------- Admin ----------

export const listJobPostings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const { data, error } = await supabase
        .from("job_postings")
        .select("*")
        .order("created_at", { ascending: false });
        
    if (error) throw new Error("Failed to fetch job postings");
    return data;
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
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createJobPostingSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

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
    };
    
    const { data: inserted, error } = await supabase
        .from("job_postings")
        .insert([insert])
        .select()
        .single();
        
    if (error || !inserted) throw new Error("Failed to create job posting");
    return { id: inserted.id };
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
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateJobPostingSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const { error } = await supabase
        .from("job_postings")
        .update({
            title: data.title,
            department: data.department,
            location: data.location,
            type: data.type,
            description: data.description,
            requirements: data.requirements || null,
            salary_range: data.salary_range || null,
        })
        .eq("id", data.id);
        
    if (error) throw new Error("Failed to update job posting");
    return { ok: true };
  });

const toggleJobPostingSchema = z.object({ id: z.string() });

export const toggleJobPosting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => toggleJobPostingSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const { data: doc, error: fetchError } = await supabase
        .from("job_postings")
        .select("is_active")
        .eq("id", data.id)
        .single();
    
    if (fetchError || !doc) throw new Error("Not found");
    
    const newActive = !doc.is_active;
    
    const { error: updateError } = await supabase
        .from("job_postings")
        .update({ is_active: newActive })
        .eq("id", data.id);
        
    if (updateError) throw new Error("Failed to toggle job posting");
    
    return { id: data.id, is_active: newActive };
  });

const deleteJobPostingSchema = z.object({ id: z.string() });

export const deleteJobPosting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => deleteJobPostingSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const { error } = await supabase
        .from("job_postings")
        .delete()
        .eq("id", data.id);
        
    if (error) throw new Error("Failed to delete job posting");
    return { ok: true };
  });

// ---------- Public ----------

export const listActiveJobPostings = createServerFn({ method: "GET" }).handler(async () => {
    const { data, error } = await supabase
        .from("job_postings")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
        
    if (error) throw new Error("Failed to fetch active job postings");
    return data;
});
