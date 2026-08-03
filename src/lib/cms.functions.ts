import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdminClient } from "@/integrations/supabase/admin";
const supabase = new Proxy({} as any, { get: (_, prop) => (getAdminClient() as any)[prop] });

export interface INewsUpdate {
  id: string;
  title: string;
  content: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ICompanyAnnouncement {
  id: string;
  title: string;
  content: string;
  severity: "info" | "warning" | "urgent";
  is_active: boolean;
  active_until: string | null;
  created_at: string;
  updated_at: string;
}

async function checkIsAdmin(userId: string) {
  const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", userId)
      .eq("role", "admin");
  return !error && data && data.length > 0;
}

// News & Updates API
export const listNews = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabase.from("news_updates").select("*").order("created_at", { ascending: false });
  if (error) throw new Error("Failed to fetch news");
  return data as INewsUpdate[];
});

const createNewsSchema = z.object({ title: z.string(), content: z.string(), is_published: z.boolean() });
export const createNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createNewsSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");
    const { error } = await supabase.from("news_updates").insert([{ ...data, published_at: data.is_published ? new Date().toISOString() : null }]);
    if (error) throw new Error("Failed to create news");

    // Also sync to main announcements table for Dashboards
    await supabase.from("announcements").insert([{
      title: data.title,
      body: data.content,
      target_role: "all",
      created_by: context.userId,
    }]).catch((err: any) => console.warn("[cms] announcements sync error:", err.message));

    return { ok: true };
  });

const deleteNewsSchema = z.object({ id: z.string() });
export const deleteNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => deleteNewsSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const { data: item } = await supabase.from("news_updates").select("title").eq("id", data.id).single();

    const { error } = await supabase.from("news_updates").delete().eq("id", data.id);
    if (error) throw new Error("Failed to delete news");

    if (item?.title) {
      await supabase.from("announcements").delete().eq("title", item.title).catch(() => {});
    }

    return { ok: true };
  });

// Announcements API
export const listAnnouncements = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabase.from("company_announcements").select("*").order("created_at", { ascending: false });
  if (error) throw new Error("Failed to fetch announcements");
  return data as ICompanyAnnouncement[];
});

const createAnnouncementSchema = z.object({ title: z.string(), content: z.string(), severity: z.enum(["info", "warning", "urgent"]), is_active: z.boolean() });
export const createAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createAnnouncementSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");
    const { error } = await supabase.from("company_announcements").insert([data]);
    if (error) throw new Error("Failed to create announcement");

    // Also sync to main announcements table for Dashboards
    await supabase.from("announcements").insert([{
      title: data.title,
      body: data.content,
      target_role: "all",
      created_by: context.userId,
    }]).catch((err: any) => console.warn("[cms] announcements sync error:", err.message));

    return { ok: true };
  });

const deleteAnnouncementSchema = z.object({ id: z.string() });
export const deleteAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => deleteAnnouncementSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const { data: item } = await supabase.from("company_announcements").select("title").eq("id", data.id).single();

    const { error } = await supabase.from("company_announcements").delete().eq("id", data.id);
    if (error) throw new Error("Failed to delete announcement");

    if (item?.title) {
      await supabase.from("announcements").delete().eq("title", item.title).catch(() => {});
    }

    return { ok: true };
  });
