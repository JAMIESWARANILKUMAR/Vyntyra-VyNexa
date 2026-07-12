import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireCloudflareAuth } from "@/integrations/supabase/auth-middleware";
import { db } from "@/db";
import { applications, applicantAccessTokens, applicationStatusEvents, statusEmailTemplates, ApplicationStatus } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// ---------- Transition rules ----------

export type AppStatus = ApplicationStatus;

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
  .middleware([requireCloudflareAuth])
  .inputValidator((d: unknown) => changeSchema.parse(d))
  .handler(async ({ data, context }) => {
    const appRows = await db.select({
      id: applications.id,
      full_name: applications.fullName,
      email: applications.email,
      role_applied: applications.roleApplied,
      status: applications.status,
    }).from(applications).where(eq(applications.id, data.id));

    const app = appRows[0];
    if (!app) throw new Error("Application not found");

    const from = app.status as AppStatus;
    const to = data.status as AppStatus;

    if (!isAllowed(from, to)) {
      throw new Error(`Invalid transition: ${from} → ${to}`);
    }

    if (from !== to) {
      await db.update(applications).set({ status: to }).where(eq(applications.id, data.id));

      await db.insert(applicationStatusEvents).values({
        applicationId: data.id,
        fromStatus: from,
        toStatus: to,
        note: data.note,
        changedBy: context.userEmail,
      });

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
        
        await db.insert(applicantAccessTokens).values({
          applicationId: data.id,
          tokenHash: tokenHash,
          expiresAt: expiresAt,
        });

        const origin = originFromRequest();
        const portalLink = origin ? `${origin}/status/${token}` : `/status/${token}`;

        const tplRows = await db.select().from(statusEmailTemplates).where(eq(statusEmailTemplates.status, to));
        const tpl = tplRows[0];

        if (tpl?.enabled) {
          const { sendStatusChangeEmail } = await import("./status-email.server");
          await sendStatusChangeEmail({
            toEmail: app.email,
            fullName: app.full_name,
            roleApplied: app.role_applied,
            status: to,
            applicationId: data.id,
            portalLink,
            template: { subject: tpl.subject, html_body: tpl.htmlBody },
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
      await db.insert(applicationStatusEvents).values({
        applicationId: data.id,
        fromStatus: from,
        toStatus: to,
        note: data.note,
        changedBy: context.userEmail,
      });
    }

    return { ok: true };
  });

// ---------- Status event history ----------

const listEventsSchema = z.object({ applicationId: z.string().uuid() });

export const listStatusEvents = createServerFn({ method: "POST" })
  .middleware([requireCloudflareAuth])
  .inputValidator((d: unknown) => listEventsSchema.parse(d))
  .handler(async ({ data, context }) => {
    const rows = await db.select({
      id: applicationStatusEvents.id,
      from_status: applicationStatusEvents.fromStatus,
      to_status: applicationStatusEvents.toStatus,
      note: applicationStatusEvents.note,
      created_at: applicationStatusEvents.createdAt,
      changed_by: applicationStatusEvents.changedBy,
    }).from(applicationStatusEvents)
      .where(eq(applicationStatusEvents.applicationId, data.applicationId))
      .orderBy(desc(applicationStatusEvents.createdAt));
      
    return rows;
  });

// ---------- Templates ----------

export const listStatusTemplates = createServerFn({ method: "GET" })
  .middleware([requireCloudflareAuth])
  .handler(async ({ context }) => {
    const rows = await db.select().from(statusEmailTemplates);
    return rows;
  });

const updateTplSchema = z.object({
  status: z.enum(["new", "reviewing", "shortlisted", "rejected", "hired"]),
  subject: z.string().trim().min(3).max(200),
  html_body: z.string().trim().min(10).max(20000),
  enabled: z.boolean(),
});

export const updateStatusTemplate = createServerFn({ method: "POST" })
  .middleware([requireCloudflareAuth])
  .inputValidator((d: unknown) => updateTplSchema.parse(d))
  .handler(async ({ data, context }) => {
    await db.update(statusEmailTemplates).set({
      subject: data.subject,
      htmlBody: data.html_body,
      enabled: data.enabled,
      updatedBy: context.userEmail,
    }).where(eq(statusEmailTemplates.status, data.status as ApplicationStatus));
    
    return { ok: true };
  });
