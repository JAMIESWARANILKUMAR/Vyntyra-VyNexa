import { getEnv } from '@/lib/env';
// Public (unauthenticated) server functions powering the applicant portal.
// - requestPortalLink: applicant supplies email + optional application ref,
//   we email a one-time link. Always returns success (do not leak existence).
// - checkPortalToken: applicant loads the /status/$token page; we validate,
//   mark used, and return status + minimal metadata.
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

function originFromRequest() {
  const proto = getRequestHeader("x-forwarded-proto") || "https";
  const host = getRequestHeader("x-forwarded-host") || getRequestHeader("host") || "";
  if (!host) return "";
  return `${proto}://${host}`;
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

const requestSchema = z.object({
  email: z.string().trim().email().max(255),
});

export const requestPortalLink = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => requestSchema.parse(d))
  .handler(async ({ data }) => {
    const email = data.email.toLowerCase();
    const client = getPortalClient();

    const { data: apps, error: appsError } = await client
      .from("applications")
      .select("*")
      .ilike("email", email)
      .order("created_at", { ascending: false })
      .limit(1);

    // Always return success — do not reveal whether the email exists.
    if (appsError || !apps || apps.length === 0) return { ok: true };
    const app = apps[0];

    try {
      const token = randomToken();
      const tokenHash = await sha256Hex(token);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      await supabase.from("applicant_access_tokens").insert([{
        application_id: app.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      }]);

      const origin = originFromRequest();
      const portalLink = origin ? `${origin}/status/${token}` : `/status/${token}`;

      const { Resend } = await import("resend");
      const apiKey = getEnv("RESEND_API_KEY");
      if (apiKey) {
        const resend = new Resend(apiKey);
        const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Your Application Status Link</title></head>
<body style="margin:0;padding:32px 16px;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
    <tr>
      <td style="padding:28px 36px;border-bottom:1px solid #e5e7eb;">
        <table role="presentation" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td style="vertical-align:middle;width:36px;">
              <img src="https://portal.vyntyraconsultancyservices.in/icon-512.png" alt="Vyntyra" width="32" height="32" style="display:block;border-radius:6px;" />
            </td>
            <td style="vertical-align:middle;padding-left:12px;">
              <span style="font-size:17px;font-weight:600;color:#111827;letter-spacing:-0.01em;">Vyntyra Consultancy Services</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:36px;line-height:1.6;font-size:15px;color:#111827;">
        <h2 style="font-size:22px;font-weight:600;color:#111827;margin:0 0 16px;letter-spacing:-0.02em;">Your Application Status Link</h2>
        <p style="margin:0 0 16px;color:#374151;">Dear ${escapeHtml(app.full_name)},</p>
        <p style="margin:0 0 20px;color:#374151;">Use the secure authentication link below to view the real-time status of your application for <strong>${escapeHtml(app.role_applied)}</strong>.</p>
        <div style="border:1px solid #e5e7eb;border-radius:6px;padding:16px 20px;background:#f9fafb;margin-bottom:24px;">
          <div style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Security Notice</div>
          <div style="font-size:13.5px;color:#374151;">This one-time access link expires in <strong>30 minutes</strong> and grants immediate encrypted access to your candidate file.</div>
        </div>
        <div style="margin:24px 0;">
          <a href="${portalLink}" style="display:inline-block;background-color:#0f172a;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">View Application Status</a>
        </div>
        <p style="margin:20px 0 0;font-size:13px;color:#6b7280;">If you did not request this link, you can safely disregard this message.</p>
        <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;">
          <p style="margin:0 0 8px 0;color:#111827;font-size:15px;">Sincerely,</p>
          <div style="margin:8px 0 10px 0;">
            <img src="https://portal.vyntyraconsultancyservices.in/signature.png" alt="Executive Signature" width="130" style="display:block;max-width:130px;height:auto;" />
          </div>
          <div style="font-size:15px;font-weight:700;color:#111827;line-height:1.4;">Jami Eswar Anil Kumar</div>
          <div style="font-size:13px;color:#0284c7;font-weight:600;">Founder &amp; Managing Director</div>
          <div style="font-size:12px;color:#64748b;">Vyntyra Consultancy Services &middot; Project VyNexa</div>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 36px;color:#64748b;font-size:11.5px;line-height:1.6;">
        <div><strong>Vyntyra Consultancy Services</strong> &middot; ISO 9001:2015 Certified &middot; MSME Registered</div>
        <div style="margin-top:4px;">&copy; ${new Date().getFullYear()} Vyntyra Consultancy Services. All rights reserved.</div>
      </td>
    </tr>
  </table>
</body>
</html>`;
        await resend.emails.send({
          to: app.email,
          from: "Vyntyra Careers <careers@vyntyraconsultancyservices.in>",
          subject: "Your application status link — Project VyNexa",
          html,
          text: `Open this link to view your application status (valid 30 minutes): ${portalLink}`,
        });
      }
    } catch (e) {
      console.warn("[portal] magic link email skipped:", (e as Error).message);
    }

    return { ok: true };
  });

const checkSchema = z.object({ token: z.string().trim().min(32).max(128) });

export const checkPortalToken = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => checkSchema.parse(d))
  .handler(async ({ data }) => {
    const tokenHash = await sha256Hex(data.token);

    const { data: tokens, error: tokensError } = await supabase
        .from("applicant_access_tokens")
        .select("*")
        .eq("token_hash", tokenHash);

    if (tokensError || !tokens || tokens.length === 0) return { ok: false as const, reason: "invalid" as const };
    const row = tokens[0];

    if (row.used_at) return { ok: false as const, reason: "used" as const };
    if (new Date(row.expires_at).getTime() < Date.now())
      return { ok: false as const, reason: "expired" as const };

    // Mark used
    await supabase.from("applicant_access_tokens").update({ used_at: new Date().toISOString() }).eq('id', row.id);

    const { data: app, error: appError } = await supabase.from("applications").select("*").eq('id', row.application_id).single();
    
    if (appError || !app) return { ok: false as const, reason: "invalid" as const };

    // Short-lived signed URL so the applicant can download their own resume.
    let resumeUrl: string | null = null;
    let resumeName: string | null = null;
    if (app.resume_path) {
        try {
            const { data: urlData, error } = await supabase.storage.from('default').createSignedUrl(app.resume_path, 60 * 30);
            if (!error && urlData) {
                resumeUrl = urlData.signedUrl;
                resumeName = app.resume_path.split("/").pop() ?? "resume";
            }
        } catch(e) {
            console.error("Failed to generate signed URL for resume", e);
        }
    }

    const { data: events, error: eventsError } = await supabase
        .from("application_status_events")
        .select("*")
        .eq("application_id", row.application_id)
        .order("created_at", { ascending: true });

    return {
      ok: true as const,
      application: {
        full_name: app.full_name,
        role_applied: app.role_applied,
        status: app.status,
        submitted_at: app.created_at,
        updated_at: app.updated_at,
      },
      resume: resumeUrl ? { url: resumeUrl, name: resumeName } : null,
      history: (eventsError ? [] : events) ?? [],
    };
  });

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

import { getAdminClient } from "@/integrations/supabase/admin";

function getPortalClient() {
  try {
    return getAdminClient();
  } catch (e) {
    return supabase;
  }
}

// Public status lookup by reference ID (first 8 chars of application id) + email.
const lookupSchema = z.object({
  referenceId: z.string().trim().min(1).max(64),
  email: z.string().trim().email().max(255),
});

export const lookupApplicationStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => lookupSchema.parse(d))
  .handler(async ({ data }) => {
    const rawRef = data.referenceId.trim().toLowerCase();
    const cleanRef = rawRef.replaceAll("-", "");
    const email = data.email.trim().toLowerCase();
    const client = getPortalClient();

    // Query by email first
    let { data: apps, error: appsError } = await client
        .from("applications")
        .select("*")
        .ilike("email", email);

    // If query by email returned no rows, fallback to querying by application ID
    if (!apps || apps.length === 0) {
      const { data: appsById } = await client
        .from("applications")
        .select("*")
        .or(`id.eq.${rawRef},id.ilike.${cleanRef}%`);
      apps = appsById || [];
    }

    if (!apps || apps.length === 0) {
      return { ok: false as const, reason: "not_found" as const };
    }
    
    // Match reference ID against:
    // 1. Full UUID (with or without hyphens)
    // 2. First 8 characters of UUID
    // 3. UUID prefix
    const app = apps.find((a) => {
      const fullId = a.id.toLowerCase();
      const cleanId = fullId.replaceAll("-", "");
      const appEmail = (a.email || "").trim().toLowerCase();
      
      const idMatches = (
        fullId === rawRef ||
        cleanId === cleanRef ||
        cleanId.startsWith(cleanRef) ||
        cleanId.slice(0, 8) === cleanRef.slice(0, 8)
      );
      const emailMatches = appEmail === email;
      return idMatches && emailMatches;
    }) || apps.find((a) => (a.email || "").trim().toLowerCase() === email);

    if (!app) {
      return { ok: false as const, reason: "not_found" as const };
    }

    const { data: events, error: eventsError } = await client
        .from("application_status_events")
        .select("*")
        .eq("application_id", app.id)
        .order("created_at", { ascending: true });

    return {
      ok: true as const,
      application: {
        reference_id: app.id.slice(0, 8).toUpperCase(),
        full_name: app.full_name,
        role_applied: app.role_applied || app.position || "Applicant",
        status: app.status || "new",
        submitted_at: app.created_at,
        updated_at: app.updated_at || app.created_at,
      },
      history: (eventsError ? [] : events) ?? [],
    };
  });
