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

export interface AiVoiceSettings {
  voice_id: string;
  voice_name: string;
  speaker_identity: string;
  speaker_gender: "female" | "male" | "neutral";
  accent: "en-IN" | "en-US" | "en-GB" | "en-AU";
  rate: number;
  pitch: number;
  volume: number;
  clarity_boost: boolean;
  custom_audio_url?: string;
  custom_voice_script?: string;
  trained_date?: string;
  preferred_browser_voices: string[];
  selected_voice_name?: string;
  use_custom_audio?: boolean;
  question_audio_clips?: Record<string, string>;
}

export const DEFAULT_AI_VOICE_SETTINGS: AiVoiceSettings = {
  voice_id: "natural_in_female",
  voice_name: "Dr. Sarah - Executive Tech Lead (Natural)",
  speaker_identity: "Admin (VCS Bar Raiser)",
  speaker_gender: "female",
  accent: "en-IN",
  rate: 0.94,
  pitch: 1.0,
  volume: 1.0,
  clarity_boost: true,
  custom_audio_url: "",
  custom_voice_script: "Welcome to your 1:1 technical interview. Today we will explore clean code principles and system design.",
  trained_date: "",
  preferred_browser_voices: [
    "Google UK English Female",
    "Microsoft Neerja Online (Natural) - English (India)",
    "Microsoft Aria Online (Natural)",
    "Google US English",
    "Samantha",
    "Karen",
    "Victoria",
    "Daniel",
    "Google UK English Male"
  ],
  selected_voice_name: "",
  use_custom_audio: true,
  question_audio_clips: {}
};

export const getAiVoiceSettings = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", "ai_interview_voice_settings")
      .maybeSingle();

    if (data && data.value) {
      return {
        ...DEFAULT_AI_VOICE_SETTINGS,
        ...(typeof data.value === "string" ? JSON.parse(data.value) : data.value),
      } as AiVoiceSettings;
    }
  } catch (e) {
    console.warn("[getAiVoiceSettings] error:", e);
  }
  return DEFAULT_AI_VOICE_SETTINGS;
});

export const updateAiVoiceSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    voice_id: z.string(),
    voice_name: z.string(),
    speaker_identity: z.string(),
    speaker_gender: z.enum(["female", "male", "neutral"]),
    accent: z.enum(["en-IN", "en-US", "en-GB", "en-AU"]),
    rate: z.number().min(0.7).max(1.5),
    pitch: z.number().min(0.7).max(1.5),
    volume: z.number().min(0.1).max(1.0),
    clarity_boost: z.boolean(),
    custom_audio_url: z.string().optional(),
    custom_voice_script: z.string().optional(),
    preferred_browser_voices: z.array(z.string()).optional(),
    selected_voice_name: z.string().optional(),
    use_custom_audio: z.boolean().optional(),
    question_audio_clips: z.record(z.string()).optional()
  }).parse(d))
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const settingsData = {
      ...data,
      trained_date: new Date().toISOString(),
      preferred_browser_voices: data.preferred_browser_voices || DEFAULT_AI_VOICE_SETTINGS.preferred_browser_voices
    };

    const payload = {
      id: "ai_interview_voice_settings",
      value: settingsData,
      updated_at: new Date().toISOString(),
      updated_by: context.userId
    };

    try {
      await supabase.from("site_settings").upsert(payload);
    } catch (e: any) {
      console.warn("[updateAiVoiceSettings] error:", e);
      throw new Error("Failed to save voice settings");
    }

    return { success: true, settings: settingsData };
  });
