import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdminClient } from "@/integrations/supabase/admin";
const supabase = new Proxy({} as any, { get: (_, prop) => (getAdminClient() as any)[prop] });

// ---------- Transition rules ----------

export type AppStatus = "new" | "reviewing" | "shortlisted" | "rejected" | "hired";

export const ALLOWED_TRANSITIONS: Record<AppStatus, AppStatus[]> = {
  new: ["reviewing", "rejected"],
  reviewing: ["shortlisted", "rejected"],
  shortlisted: ["hired", "rejected"],
  rejected: [],
  hired: [],
};

function isAllowed(from: AppStatus, to: AppStatus) {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

async function checkIsAdmin(userId: string) {
    const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'admin');
    return !error && data && data.length > 0;
}

async function ensureAdmin(ctx: any) {
  if (!await checkIsAdmin(ctx.userId)) throw new Error("Forbidden");
}

function originFromRequest() {
  const forwardedProto = getRequestHeader("x-forwarded-proto") || "https";
  const forwardedHost =
    getRequestHeader("x-forwarded-host") ||
    getRequestHeader("host") ||
    "";
  if (!forwardedHost) return "";
  return `${forwardedProto}://${forwardedHost}`;
}

async function sha256Hex(input: string) {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------- Change status ----------

const changeSchema = z.object({
  id: z.string(),
  status: z.enum(["new", "reviewing", "shortlisted", "rejected", "hired"]),
  note: z.string().trim().min(3, "Note is required (min 3 chars)").max(2000),
});

export const changeApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => changeSchema.parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);

    const { data: app, error: appError } = await supabase
        .from("applications")
        .select("*")
        .eq('id', data.id)
        .single();
    
    if (appError || !app) throw new Error("Application not found");

    const from = app.status as AppStatus;
    const to = data.status as AppStatus;

    if (!isAllowed(from, to)) {
      throw new Error(`Invalid transition: ${from} → ${to}`);
    }

    if (from !== to) {
      await supabase.from("applications").update({ status: to }).eq('id', data.id);

      await supabase.from("application_status_events").insert([{
          application_id: data.id,
          from_status: from,
          to_status: to,
          note: data.note,
          changed_by: context.userId,
      }]);

      // Insert admin notification for status change
      try {
        const { insertNotification } = await import("./notifications.functions");
        await insertNotification({
          type: "status_change",
          title: "Application Status Changed",
          message: `${app.full_name} (${app.role_applied}): ${from} → ${to}`,
          metadata: { applicationId: data.id, from, to, name: app.full_name },
        });
      } catch (e) {
        console.warn("[workflow] notification insert skipped:", (e as Error).message);
      }

      // Issue a fresh magic-link token for this notification
      try {
        const token = randomToken();
        const tokenHash = await sha256Hex(token);
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        await supabase.from("applicant_access_tokens").insert([{
          application_id: data.id,
          token_hash: tokenHash,
          expires_at: expiresAt,
        }]);

        const origin = originFromRequest();
        const portalLink = origin ? `${origin}/status/${token}` : `/status/${token}`;

        const { data: tpl } = await supabase
            .from("status_email_templates")
            .select("*")
            .eq("id", to)
            .single();

        if (tpl?.enabled) {
          const { sendStatusChangeEmail } = await import("./status-email.server");
          await sendStatusChangeEmail({
            toEmail: app.email,
            fullName: app.full_name,
            roleApplied: app.role_applied,
            status: to,
            applicationId: data.id,
            portalLink,
            template: { subject: tpl.subject, html_body: tpl.html_body },
            idempotencyKey: `status-${data.id}-${to}-${Date.now()}`,
          });

          // Insert admin notification for email sent
          try {
            const { insertNotification } = await import("./notifications.functions");
            await insertNotification({
              type: "email_sent",
              title: "Status Email Sent",
              message: `Email sent to ${app.full_name} (${app.email}) — status: ${to}`,
              metadata: { applicationId: data.id, email: app.email, status: to },
            });
          } catch (e) {
            console.warn("[workflow] email notification skipped:", (e as Error).message);
          }
        }
      } catch (e) {
        console.warn("[workflow] email/token skipped:", (e as Error).message);
      }
    } else {
      // Same status; still record the note in event log
      await supabase.from("application_status_events").insert([{
          application_id: data.id,
          from_status: from,
          to_status: to,
          note: data.note,
          changed_by: context.userId,
      }]);
    }

    return { ok: true };
  });

// ---------- Status event history ----------

const listEventsSchema = z.object({ applicationId: z.string() });

export const listStatusEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listEventsSchema.parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    
    const { data: events, error } = await supabase
      .from("application_status_events")
      .select("*")
      .eq("application_id", data.applicationId)
      .order("created_at", { ascending: false });
      
    if (error) throw new Error("Failed to fetch events");
    return events;
  });

// ---------- Templates ----------

export const listStatusTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    
    const { data: templates, error } = await supabase
        .from("status_email_templates")
        .select("*");
        
    if (error) throw new Error("Failed to fetch templates");
    return templates;
  });

const updateTplSchema = z.object({
  status: z.enum(["new", "reviewing", "shortlisted", "rejected", "hired"]),
  subject: z.string().trim().min(3).max(200),
  html_body: z.string().trim().min(10).max(20000),
  enabled: z.boolean(),
});

export const updateStatusTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateTplSchema.parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    
    await supabase
        .from("status_email_templates")
        .upsert({
            id: data.status,
            subject: data.subject,
            html_body: data.html_body,
            enabled: data.enabled,
            updated_by: context.userId,
            updated_at: new Date().toISOString()
        });
    
    return { ok: true };
  });
