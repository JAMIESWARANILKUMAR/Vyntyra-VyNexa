import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdminClient } from "@/integrations/supabase/admin";
const supabase = new Proxy({} as any, { get: (_, prop) => (getAdminClient() as any)[prop] });

async function checkIsAdmin(userId: string) {
    const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'admin');
    return !error && data && data.length > 0;
}

// ---------- Admin ----------

export const listAdminNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const { data, error } = await supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
        
    if (error) throw new Error("Failed to fetch notifications");
    return data;
  });

const markReadSchema = z.object({ id: z.string() });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => markReadSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    await supabase
        .from("admin_notifications")
        .update({ is_read: true })
        .eq("id", data.id);
        
    return { ok: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    await supabase
        .from("admin_notifications")
        .update({ is_read: true })
        .eq("is_read", false);
        
    return { ok: true };
  });

// ---------- Internal helper (not a server fn) ----------

export async function insertNotification(params: {
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}) {
  try {
      await supabase.from("admin_notifications").insert([{
        type: params.type,
        title: params.title,
        message: params.message,
        metadata: params.metadata ?? null,
        is_read: false,
      }]);
  } catch (error: any) {
    console.warn("[notifications] insert failed:", error.message);
    throw new Error(error.message);
  }
}
