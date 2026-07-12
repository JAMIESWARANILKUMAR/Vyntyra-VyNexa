import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Public ----------

export const incrementVisitorCount = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: existing } = await supabaseAdmin
    .from("visitor_counts")
    .select("count")
    .eq("page_key", "home")
    .maybeSingle();

  const currentCount = existing?.count ?? 0;

  const { data: row, error } = await supabaseAdmin
    .from("visitor_counts")
    .upsert(
      { page_key: "home", count: currentCount + 1 },
      { onConflict: "page_key" },
    )
    .select("count")
    .single();
  if (error) throw new Error(error.message);
  return { count: row.count };
});

// ---------- Admin ----------

export const getVisitorCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("visitor_counts")
      .select("count")
      .eq("page_key", "home")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { count: data?.count ?? 0 };
  });
