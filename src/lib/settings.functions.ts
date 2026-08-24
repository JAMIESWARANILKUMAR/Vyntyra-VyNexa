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

export const getNocSettings = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", "noc_download_settings")
      .maybeSingle();

    return {
      global_noc_download_enabled: data?.enabled !== undefined ? !!data.enabled : false,
    };
  } catch (e) {
    return { global_noc_download_enabled: false };
  }
});

export const setNocSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ global_noc_download_enabled: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    await supabase
      .from("site_settings")
      .upsert({
        id: "noc_download_settings",
        enabled: data.global_noc_download_enabled,
        updated_at: new Date().toISOString(),
        updated_by: context.userId
      });

    return { success: true, global_noc_download_enabled: data.global_noc_download_enabled };
  });

export interface BrandingSettings {
  founder_signature_url: string;
  vyntyra_logo_url: string;
  founder_name?: string;
  founder_title?: string;
}

export const getBrandingSettings = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", "branding_settings")
      .maybeSingle();

    if (data) {
      return {
        founder_signature_url: data.founder_signature_url || data.signature_url || data.value?.founder_signature_url || "/signature.png",
        vyntyra_logo_url: data.vyntyra_logo_url || data.logo_url || data.value?.vyntyra_logo_url || "/icon-512.png",
        founder_name: data.founder_name || data.value?.founder_name || "Jami Eswar Anil Kumar",
        founder_title: data.founder_title || data.value?.founder_title || "Founder & Managing Director",
      };
    }
  } catch (e) {
    console.warn("[getBrandingSettings] error:", e);
  }

  return {
    founder_signature_url: "/signature.png",
    vyntyra_logo_url: "/icon-512.png",
    founder_name: "Jami Eswar Anil Kumar",
    founder_title: "Founder & Managing Director",
  };
});

export const updateBrandingSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: unknown) =>
      z.object({
        founder_signature_url: z.string().optional(),
        vyntyra_logo_url: z.string().optional(),
        founder_name: z.string().optional(),
        founder_title: z.string().optional(),
      }).parse(d)
  )
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const payload = {
      id: "branding_settings",
      founder_signature_url: data.founder_signature_url || "/signature.png",
      vyntyra_logo_url: data.vyntyra_logo_url || "/icon-512.png",
      founder_name: data.founder_name || "Jami Eswar Anil Kumar",
      founder_title: data.founder_title || "Founder & Managing Director",
      value: {
        founder_signature_url: data.founder_signature_url || "/signature.png",
        vyntyra_logo_url: data.vyntyra_logo_url || "/icon-512.png",
        founder_name: data.founder_name || "Jami Eswar Anil Kumar",
        founder_title: data.founder_title || "Founder & Managing Director",
      },
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    };

    try {
      await supabase.from("site_settings").upsert(payload);
    } catch (e: any) {
      console.warn("[updateBrandingSettings] fallback upsert:", e);
      await supabase.from("site_settings").upsert({
        id: "branding_settings",
        enabled: true,
        updated_at: new Date().toISOString(),
      });
    }

    return { success: true, ...data };
  });
