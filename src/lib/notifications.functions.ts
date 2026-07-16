import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";

async function checkIsAdmin(userId: string) {
    const { adminDb } = await import("@/integrations/firebase/admin");
    const rolesDoc = await adminDb!.collection("user_roles").where("user_id", "==", userId).where("role", "==", "admin").get();
    return !rolesDoc.empty;
}

// ---------- Admin ----------

export const listAdminNotifications = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const { adminDb } = await import("@/integrations/firebase/admin");
    const snapshot = await adminDb!.collection("admin_notifications")
      .orderBy("created_at", "desc")
      .limit(50)
      .get();
      
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  });

const markReadSchema = z.object({ id: z.string() });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((d: unknown) => markReadSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const { adminDb } = await import("@/integrations/firebase/admin");
    await adminDb!.collection("admin_notifications").doc(data.id).update({ is_read: true });
    return { ok: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const { adminDb } = await import("@/integrations/firebase/admin");
    const snapshot = await adminDb!.collection("admin_notifications")
        .where("is_read", "==", false)
        .get();
        
    const batch = adminDb!.batch();
    snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { is_read: true });
    });
    await batch.commit();

    return { ok: true };
  });

// ---------- Internal helper (not a server fn) ----------

export async function insertNotification(params: {
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}) {
  const { adminDb } = await import("@/integrations/firebase/admin");
  try {
      await adminDb!.collection("admin_notifications").add({
        type: params.type,
        title: params.title,
        message: params.message,
        metadata: params.metadata ?? null,
        is_read: false,
        created_at: new Date().toISOString()
      });
  } catch (error: any) {
    console.warn("[notifications] insert failed:", error.message);
    throw new Error(error.message);
  }
}
