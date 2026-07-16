// Public (unauthenticated) server functions powering the applicant portal.
// - requestPortalLink: applicant supplies email + optional application ref,
//   we email a one-time link. Always returns success (do not leak existence).
// - checkPortalToken: applicant loads the /status/$token page; we validate,
//   mark used, and return status + minimal metadata.
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

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
    const { adminDb } = await import("@/integrations/firebase/admin");
    const email = data.email.toLowerCase();

    const snapshot = await adminDb!.collection("applications")
      .where("email", "==", email)
      .orderBy("created_at", "desc")
      .limit(1)
      .get();

    // Always return success — do not reveal whether the email exists.
    if (snapshot.empty) return { ok: true };
    const appDoc = snapshot.docs[0];
    const app = appDoc.data();

    try {
      const token = randomToken();
      const tokenHash = await sha256Hex(token);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      await adminDb!.collection("applicant_access_tokens").add({
        application_id: appDoc.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      });

      const origin = originFromRequest();
      const portalLink = origin ? `${origin}/status/${token}` : `/status/${token}`;

      const { Resend } = await import("resend");
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        const resend = new Resend(apiKey);
        const html = `<!doctype html><html><body style="margin:0;background:#fff;font-family:Inter,Arial,sans-serif;">
          <div style="max-width:600px;margin:0 auto;">
            <div style="background:#0A1F44;color:#fff;padding:24px 32px;">
              <div style="font-family:Georgia,serif;font-size:22px;">Your application status link</div>
              <div style="color:#D4AF37;font-size:12px;letter-spacing:.1em;text-transform:uppercase;margin-top:4px;">Project VyNexa</div>
            </div>
            <div style="padding:28px 32px;color:#0A1F44;line-height:1.6;">
              <p>Hello ${escapeHtml(app.full_name)},</p>
              <p>Use the secure link below to view the current status of your application for <strong>${escapeHtml(app.role_applied)}</strong>. The link expires in <strong>30 minutes</strong> and can be used once.</p>
              <p style="margin:24px 0;"><a href="${portalLink}" style="display:inline-block;background:#0A1F44;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">View application status</a></p>
              <p style="color:#64748B;font-size:13px;">If you did not request this, you can safely ignore this email.</p>
            </div>
          </div>
        </body></html>`;
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
    const { adminDb, adminStorage } = await import("@/integrations/firebase/admin");
    const tokenHash = await sha256Hex(data.token);

    const tokenSnap = await adminDb!.collection("applicant_access_tokens")
        .where("token_hash", "==", tokenHash)
        .get();

    if (tokenSnap.empty) return { ok: false as const, reason: "invalid" as const };
    const rowDoc = tokenSnap.docs[0];
    const row = rowDoc.data();

    if (row.used_at) return { ok: false as const, reason: "used" as const };
    if (new Date(row.expires_at).getTime() < Date.now())
      return { ok: false as const, reason: "expired" as const };

    // Mark used
    await rowDoc.ref.update({ used_at: new Date().toISOString() });

    const appDoc = await adminDb!.collection("applications").doc(row.application_id).get();
    
    if (!appDoc.exists) return { ok: false as const, reason: "invalid" as const };
    const app = appDoc.data()!;

    // Short-lived signed URL so the applicant can download their own resume.
    let resumeUrl: string | null = null;
    let resumeName: string | null = null;
    if (app.resume_path) {
        try {
            const bucket = adminStorage!.bucket();
            const file = bucket.file(app.resume_path);
            const [url] = await file.getSignedUrl({
                version: 'v4',
                action: 'read',
                expires: Date.now() + 60 * 30 * 1000 // 30 mins
            });
            resumeUrl = url;
            resumeName = app.resume_path.split("/").pop() ?? "resume";
        } catch(e) {
            console.error("Failed to generate signed URL for resume", e);
        }
    }

    const eventsSnap = await adminDb!.collection("application_status_events")
        .where("application_id", "==", row.application_id)
        .orderBy("created_at", "asc")
        .get();

    const events = eventsSnap.docs.map(doc => doc.data());

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
      history: events ?? [],
    };
  });

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

// Public status lookup by reference ID (first 8 chars of application id) + email.
// Rate-limited implicitly by uniqueness of the pair; always returns a generic
// "not found" error to avoid leaking whether an email exists.
const lookupSchema = z.object({
  referenceId: z.string().trim().min(6).max(16),
  email: z.string().trim().email().max(255),
});

export const lookupApplicationStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => lookupSchema.parse(d))
  .handler(async ({ data }) => {
    const { adminDb } = await import("@/integrations/firebase/admin");
    const ref = data.referenceId.trim().toLowerCase();
    const email = data.email.trim().toLowerCase();

    // Since we don't have ilike and complex querying in Firestore, we will
    // query by email and manually filter by ID prefix.
    const snapshot = await adminDb!.collection("applications")
        .where("email", "==", email)
        .get();

    const apps = snapshot.docs.filter(doc => doc.id.toLowerCase().startsWith(ref));
    
    if (apps.length === 0) {
      return { ok: false as const, reason: "not_found" as const };
    }
    
    const appDoc = apps[0];
    const app = appDoc.data();

    const eventsSnap = await adminDb!.collection("application_status_events")
        .where("application_id", "==", appDoc.id)
        .orderBy("created_at", "asc")
        .get();

    const events = eventsSnap.docs.map(doc => doc.data());

    return {
      ok: true as const,
      application: {
        reference_id: appDoc.id.slice(0, 8).toUpperCase(),
        full_name: app.full_name,
        role_applied: app.role_applied,
        status: app.status,
        submitted_at: app.created_at,
        updated_at: app.updated_at,
      },
      history: events ?? [],
    };
  });
