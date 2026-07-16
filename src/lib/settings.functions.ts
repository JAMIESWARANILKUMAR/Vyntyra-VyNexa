import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";

async function checkIsAdmin(userId: string) {
    const { adminDb } = await import("@/integrations/firebase/admin");
    const rolesDoc = await adminDb!.collection("user_roles").where("user_id", "==", userId).where("role", "==", "admin").get();
    return !rolesDoc.empty;
}

export const getApplicationsOpen = createServerFn({ method: "GET" }).handler(async () => {
    const { adminDb } = await import("@/integrations/firebase/admin");
    const doc = await adminDb!.collection("site_settings").doc("applications_open").get();
    if (!doc.exists) return { enabled: true };
    return { enabled: doc.data()?.enabled !== false };
});

export const setApplicationsOpen = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((d: unknown) => z.object({ enabled: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const { adminDb } = await import("@/integrations/firebase/admin");
    
    await adminDb!.collection("site_settings").doc("applications_open").set({
        enabled: data.enabled,
        updated_at: new Date().toISOString(),
        updated_by: context.userId
    }, { merge: true });
    
    return { enabled: data.enabled };
  });
