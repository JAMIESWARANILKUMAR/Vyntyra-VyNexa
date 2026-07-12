import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

async function ensureAdmin(ctx: any) {
  const { data: isAdmin, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!isAdmin) throw new Error("Forbidden");
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
  id: z.string().uuid(),
  status: z.enum(["new", "reviewing", "shortlisted", "rejected", "hired"]),
  note: z.string().trim().min(3, "Note is required (min 3 chars)").max(2000),
});

export const changeApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => changeSchema.parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: app, error: fetchErr } = await supabaseAdmin
      .from("applications")
      .select("id, full_name, email, role_applied, status")
      .eq("id", data.id)
      .single();
    if (fetchErr || !app) throw new Error(fetchErr?.message || "Application not found");

    const from = app.status as AppStatus;
    const to = data.status as AppStatus;

    if (!isAllowed(from, to)) {
      throw new Error(`Invalid transition: ${from} → ${to}`);
    }

    if (from !== to) {
      const { error: updateErr } = await supabaseAdmin
        .from("applications")
        .update({ status: to })
        .eq("id", data.id);
      if (updateErr) throw new Error(updateErr.message);

      const { error: eventErr } = await supabaseAdmin
        .from("application_status_events")
        .insert({
          application_id: data.id,
          from_status: from,
          to_status: to,
          note: data.note,
          changed_by: context.userId,
        });
      if (eventErr) throw new Error(eventErr.message);

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
        await supabaseAdmin.from("applicant_access_tokens").insert({
          application_id: data.id,
          token_hash: tokenHash,
          expires_at: expiresAt,
        });

        const origin = originFromRequest();
        const portalLink = origin ? `${origin}/status/${token}` : `/status/${token}`;

        const { data: tpl } = await supabaseAdmin
          .from("status_email_templates")
          .select("subject, html_body, enabled")
          .eq("status", to)
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
      const { error: eventErr } = await supabaseAdmin
        .from("application_status_events")
        .insert({
          application_id: data.id,
          from_status: from,
          to_status: to,
          note: data.note,
          changed_by: context.userId,
        });
      if (eventErr) throw new Error(eventErr.message);
    }

    return { ok: true };
  });

// ---------- Status event history ----------

const listEventsSchema = z.object({ applicationId: z.string().uuid() });

export const listStatusEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listEventsSchema.parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("application_status_events")
      .select("id, from_status, to_status, note, created_at, changed_by")
      .eq("application_id", data.applicationId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ---------- Templates ----------

export const listStatusTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("status_email_templates")
      .select("*")
      .order("status");
    if (error) throw new Error(error.message);
    return data ?? [];
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("status_email_templates")
      .update({
        subject: data.subject,
        html_body: data.html_body,
        enabled: data.enabled,
        updated_by: context.userId,
      })
      .eq("status", data.status);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
