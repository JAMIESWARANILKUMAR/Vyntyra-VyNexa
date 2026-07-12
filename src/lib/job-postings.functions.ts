import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function publicClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

// ---------- Admin ----------

export const listJobPostings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("job_postings")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
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
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("job_postings")
      .insert({
        title: data.title,
        department: data.department,
        location: data.location,
        type: data.type,
        description: data.description,
        requirements: data.requirements || null,
        salary_range: data.salary_range || null,
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
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
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateJobPostingSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
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
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const toggleJobPostingSchema = z.object({ id: z.string().uuid() });

export const toggleJobPosting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => toggleJobPostingSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error: fetchErr } = await supabaseAdmin
      .from("job_postings")
      .select("id, is_active")
      .eq("id", data.id)
      .single();
    if (fetchErr || !row) throw new Error(fetchErr?.message || "Not found");

    const newActive = !row.is_active;
    const { error } = await supabaseAdmin
      .from("job_postings")
      .update({ is_active: newActive })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { id: data.id, is_active: newActive };
  });

const deleteJobPostingSchema = z.object({ id: z.string().uuid() });

export const deleteJobPosting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => deleteJobPostingSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("job_postings")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Public ----------

export const listActiveJobPostings = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("job_postings")
    .select("id, title, department, location, type, description, requirements")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});
