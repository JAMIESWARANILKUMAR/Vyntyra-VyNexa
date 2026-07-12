import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCloudflareAuth } from "@/integrations/supabase/auth-middleware";
import { db } from "@/db";
import { adminNotifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// ---------- Admin ----------

export const listAdminNotifications = createServerFn({ method: "GET" })
  .middleware([requireCloudflareAuth])
  .handler(async ({ context }) => {
    const rows = await db.select().from(adminNotifications)
      .orderBy(desc(adminNotifications.createdAt))
      .limit(50);
    return rows;
  });

const markReadSchema = z.object({ id: z.string().uuid() });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireCloudflareAuth])
  .inputValidator((d: unknown) => markReadSchema.parse(d))
  .handler(async ({ data, context }) => {
    await db.update(adminNotifications).set({ isRead: true }).where(eq(adminNotifications.id, data.id));
    return { ok: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireCloudflareAuth])
  .handler(async ({ context }) => {
    await db.update(adminNotifications).set({ isRead: true }).where(eq(adminNotifications.isRead, false));
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
    await db.insert(adminNotifications).values({
      type: params.type,
      title: params.title,
      message: params.message,
      metadata: params.metadata ?? null,
    });
  } catch (error: any) {
    console.warn("[notifications] insert failed:", error?.message);
    throw new Error(error?.message);
  }
}
