import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabase } from "@/integrations/supabase/client";

async function checkIsAdmin(userId: string) {
    const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'admin');
    return !error && data && data.length > 0;
}

export const getApplicationsOpen = createServerFn({ method: "GET" }).handler(async () => {
    const { data, error } = await supabase
        .from("site_settings")
        .select("enabled")
        .eq("id", "applications_open")
        .single();
        
    if (error || !data) return { enabled: true };
    return { enabled: data.enabled !== false };
});

export const setApplicationsOpen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ enabled: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    // Supabase upsert
    await supabase
        .from("site_settings")
        .upsert({
            id: "applications_open",
            enabled: data.enabled,
            updated_at: new Date().toISOString(),
            updated_by: context.userId
        });
    
    return { enabled: data.enabled };
  });
