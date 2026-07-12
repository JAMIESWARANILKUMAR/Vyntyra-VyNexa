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

export const getApplicationsOpen = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("site_settings")
    .select("value")
    .eq("key", "applications_open")
    .maybeSingle();
  if (error) return { enabled: true };
  const v = (data?.value ?? {}) as { enabled?: boolean };
  return { enabled: v.enabled !== false };
});

export const setApplicationsOpen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ enabled: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: rErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (rErr) throw new Error(rErr.message);
    if (!isAdmin) throw new Error("Forbidden");

    const { error } = await context.supabase
      .from("site_settings")
      .upsert(
        {
          key: "applications_open",
          value: { enabled: data.enabled } as any,
          updated_at: new Date().toISOString(),
          updated_by: context.userId,
        },
        { onConflict: "key" },
      );
    if (error) throw new Error(error.message);
    return { enabled: data.enabled };
  });
