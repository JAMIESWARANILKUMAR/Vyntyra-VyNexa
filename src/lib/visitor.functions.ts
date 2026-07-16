import { createServerFn } from "@tanstack/react-start";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";

// ---------- Public ----------

export const incrementVisitorCount = createServerFn({ method: "POST" }).handler(async () => {
    const { adminDb } = await import("@/integrations/firebase/admin");

    const docRef = adminDb!.collection("visitor_counts").doc("home");
    
    const count = await adminDb!.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        const newCount = (doc.exists ? (doc.data()?.count || 0) : 0) + 1;
        transaction.set(docRef, { count: newCount, updated_at: new Date().toISOString() }, { merge: true });
        return newCount;
    });

    return { count };
});

// ---------- Admin ----------

async function checkIsAdmin(userId: string) {
    const { adminDb } = await import("@/integrations/firebase/admin");
    const rolesDoc = await adminDb!.collection("user_roles").where("user_id", "==", userId).where("role", "==", "admin").get();
    return !rolesDoc.empty;
}

export const getVisitorCount = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const { adminDb } = await import("@/integrations/firebase/admin");
    const doc = await adminDb!.collection("visitor_counts").doc("home").get();
    
    return { count: doc.exists ? (doc.data()?.count || 0) : 0 };
  });
