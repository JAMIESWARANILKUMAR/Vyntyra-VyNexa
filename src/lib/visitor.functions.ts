import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdminClient } from "@/integrations/supabase/admin";
const supabase = new Proxy({} as any, { get: (_, prop) => (getAdminClient() as any)[prop] });

// ---------- Public ----------

export const incrementVisitorCount = createServerFn({ method: "POST" }).handler(async () => {
    // Simple fetch and update. For a true atomic increment, a Postgres RPC is recommended.
    const { data: doc, error: fetchError } = await supabase
        .from("visitor_counts")
        .select("count")
        .eq("id", "home")
        .single();
        
    const newCount = (!fetchError && doc ? doc.count : 0) + 1;
    
    await supabase
        .from("visitor_counts")
        .upsert({
            id: "home",
            count: newCount,
            updated_at: new Date().toISOString()
        });
        
    return { count: newCount };
});

// ---------- Admin ----------

async function checkIsAdmin(userId: string) {
    const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'admin');
    return !error && data && data.length > 0;
}

export const getVisitorCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const { data, error } = await supabase
        .from("visitor_counts")
        .select("count")
        .eq("id", "home")
        .single();
    
    return { count: !error && data ? data.count : 0 };
  });
