import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdminClient } from "@/integrations/supabase/admin";
const supabase = new Proxy({} as any, { get: (_, prop) => (getAdminClient() as any)[prop] });

// ---------- Transition rules ----------

export type AppStatus = "new" | "reviewing" | "interview_scheduled" | "shortlisted" | "finalised" | "selected" | "rejected" | "hired";

export const ALLOWED_TRANSITIONS: Record<AppStatus, AppStatus[]> = {
  new: ["reviewing", "interview_scheduled", "shortlisted", "finalised", "selected", "rejected", "hired"],
  reviewing: ["new", "interview_scheduled", "shortlisted", "finalised", "selected", "rejected", "hired"],
  interview_scheduled: ["new", "reviewing", "shortlisted", "finalised", "selected", "rejected", "hired"],
  shortlisted: ["new", "reviewing", "interview_scheduled", "finalised", "selected", "rejected", "hired"],
  finalised: ["new", "reviewing", "interview_scheduled", "shortlisted", "selected", "rejected", "hired"],
  selected: ["new", "reviewing", "interview_scheduled", "shortlisted", "finalised", "rejected", "hired"],
  rejected: ["new", "reviewing", "interview_scheduled", "shortlisted", "finalised", "selected", "hired"],
  hired: ["new", "reviewing", "interview_scheduled", "shortlisted", "finalised", "selected", "rejected"],
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
  status: z.enum(["new", "reviewing", "interview_scheduled", "shortlisted", "finalised", "selected", "rejected", "hired"]),
  note: z.string().trim().min(3, "Note is required (min 3 chars)").max(2000),
  meetLink: z.string().optional().nullable(),
  meetingTime: z.string().optional().nullable(),
  interviewerName: z.string().optional().nullable(),
  interviewerId: z.string().optional().nullable(),
  ccEmail: z.string().optional().nullable(),
  salary: z.string().optional().nullable(),
  joiningDate: z.string().optional().nullable(),
  jobLocation: z.string().optional().nullable(),
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
      const adminClient = getAdminClient();
      const updateData: any = { status: to };
      if (to === "interview_scheduled") {
        updateData.meet_link = data.meetLink || null;
        updateData.meeting_time = data.meetingTime || null;
        updateData.interviewer_name = data.interviewerName || null;
        updateData.interviewer_id = data.interviewerId || null;
      }
      if (to === "hired") {
        updateData.salary = data.salary || null;
        updateData.joining_date = data.joiningDate || null;
        updateData.job_location = data.jobLocation || null;
      }

      // Try updating with updated_at timestamp first
      let { error: updateError } = await adminClient
        .from("applications")
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', data.id);

      // If updated_at is missing from schema cache, update without updated_at
      if (updateError) {
        console.warn("[workflow] update with updated_at failed, retrying without updated_at:", updateError.message);
        const retryRes = await adminClient
          .from("applications")
          .update(updateData)
          .eq('id', data.id);
        
        if (retryRes.error) {
          // Final fallback: update status only
          const fallbackRes = await adminClient
            .from("applications")
            .update({ status: to })
            .eq('id', data.id);
          if (fallbackRes.error) throw new Error(fallbackRes.error.message);
        }
      }



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

        if (tpl?.enabled && to !== "hired") {
          try {
            let attachmentUrl = null;
            
            if (to === "hired") {
               const { generateOfferLetterPDF } = await import("./pdf.server");
               attachmentUrl = await generateOfferLetterPDF({
                 fullName: app.full_name,
                 roleApplied: app.role_applied,
                 applicationId: data.id,
               });
            }
  
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
              attachmentUrl,
              ccEmail: data.ccEmail || null,
              meetLink: data.meetLink || null,
              meetingTime: data.meetingTime || null,
              interviewerName: data.interviewerName || null,
            });

            // Trigger Selection / Status Confirmation SMS via Email-to-SMS Gateway API (1,000 SMS / month for all carriers)
            if (app.phone) {
              try {
                const { sendSmsViaEmailGateway } = await import("./email-sms-gateway");
                let statusLabel = to.toUpperCase();
                if (to === "shortlisted") statusLabel = "SHORTLISTED FOR INTERVIEW";
                if (to === "selected" || to === "hired") statusLabel = "SELECTION CONFIRMED";

                await sendSmsViaEmailGateway({
                  recipientPhone: app.phone,
                  recipientName: app.full_name,
                  message: `Dear ${app.full_name}, your application status for ${app.role_applied} has been updated to: ${statusLabel}. Check portal: ${portalLink}`,
                  subjectTag: `SELECTION ${statusLabel}`,
                });
              } catch (smsErr) {
                console.warn("[workflow] Email-to-SMS alert skipped:", (smsErr as Error).message);
              }
            }
  
            // Enterprise Backup hook
            try {
              const { syncToReplica } = await import("./backup.server");
              await syncToReplica("applications", { ...app, status: to }, app.id);
            } catch (bkpErr) {
              console.error("Backup failed", bkpErr);
            }
          } catch (emailErr) {
            console.error("Failed to process email automation", emailErr);
          }
        }

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
  status: z.enum(["new", "reviewing", "interview_scheduled", "shortlisted", "finalised", "selected", "rejected", "hired"]),
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

export async function autoProvisionIntern(app: any, changedBy: string) {
  try {
    const { data: existingProf } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", app.email)
      .maybeSingle();

    if (!existingProf) {
      let tempPassword = app.phone ? app.phone.trim().replace(/[^\d]/g, '') : "";
      if (tempPassword.length < 6) {
        tempPassword = "VyNexa@" + (app.id ? app.id.toString().slice(-4) : "2026");
      }

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: app.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { must_change_password: true }
      });

      if (authError) {
        console.error("[workflow] Failed to create auth user:", authError.message);
        return;
      }

      if (authData?.user) {
        const userId = authData.user.id;

        await supabase.from("user_roles").insert({
          user_id: userId,
          role: "intern"
        });

        const now = new Date();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yy = String(now.getFullYear()).slice(-2);
        const registrationId = app.id.slice(0, 8).toUpperCase();
        const internId = `VYNT-${mm}/${yy}-${registrationId}`;

        const startDate = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
        const endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + 3);

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        await supabase.from("profiles").upsert({
          id: userId,
          full_name: app.full_name,
          email: app.email,
          department: app.domain || "Technology & Software",
          position: app.sub_domain || "Intern",
          intern_id: internId,
          start_date: startDateStr,
          end_date: endDateStr,
          duration_months: 3,
    }
  } catch (provErr: any) {
    console.error("[workflow] Failed to auto-provision intern user:", provErr.message);
  }
}

// ─── Selection Email Scheduling & Bulk Despatch Engine ──────────

export async function dispatchSelectionEmail(applicationId: string) {
  const { data: app, error: appError } = await supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (appError || !app) throw new Error("Application not found");

  let tempPassword = app.phone ? app.phone.trim().replace(/[^\d]/g, '') : "";
  if (tempPassword.length < 6) {
    tempPassword = "VyNexa@" + app.id.slice(-4);
  }

  let userId = "";
  const { data: existingProf } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", app.email)
    .maybeSingle();

  if (existingProf) {
    userId = existingProf.id;
  } else {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: app.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { must_change_password: true }
    });

    if (authError) throw new Error(`Auth creation failed: ${authError.message}`);
    userId = authData.user.id;

    await supabase.from("user_roles").insert({
      user_id: userId,
      role: "intern"
    });
  }

  const sendDay = new Date();
  const startDate = new Date(sendDay.getTime() + 4 * 24 * 60 * 60 * 1000);
  const endDate = new Date(startDate);
  endDate.setMonth(startDate.getMonth() + 3);

  const mm = String(sendDay.getMonth() + 1).padStart(2, '0');
  const yy = String(sendDay.getFullYear()).slice(-2);
  const registrationId = app.id.slice(0, 8).toUpperCase();
  const internId = `VYNT-${mm}/${yy}-${registrationId}`;

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  await supabase.from("profiles").upsert({
    id: userId,
    full_name: app.full_name,
    email: app.email,
    phone: app.phone,
    department: app.domain || "Technology & Software",
    position: app.sub_domain || "Intern",
    intern_id: internId,
    start_date: startDateStr,
    end_date: endDateStr,
    duration_months: 3,
    avatar_url: app.profile_photo_url || null
  });

  const verificationUrl = `https://careers.vyntyraconsultancyservices.in/status/${app.id}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;
  
  let qrBase64 = null;
  try {
    const qrRes = await fetch(qrApiUrl);
    if (qrRes.ok) {
      const buffer = await qrRes.arrayBuffer();
      qrBase64 = `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
    }
  } catch (qrErr) {
    console.warn("QR code fetch failed in dispatchSelectionEmail:", qrErr);
  }

  let photoBase64 = null;
  if (app.profile_photo_url) {
    try {
      const photoRes = await fetch(app.profile_photo_url);
      if (photoRes.ok) {
        const buffer = await photoRes.arrayBuffer();
        photoBase64 = `data:image/jpeg;base64,${Buffer.from(buffer).toString('base64')}`;
      }
    } catch (photoErr) {
      console.warn("Photo fetch failed:", photoErr);
    }
  }

  const { generateNocPdf } = await import("./nocGenerator");
  const doc = generateNocPdf({
    fullName: app.full_name,
    email: app.email,
    phone: app.phone,
    applicationId: app.id,
    college: app.college || "Academic Institution",
    domain: app.domain || "Technology & Software",
    subDomain: app.sub_domain || "Full Stack Web Development",
    internshipStartDate: startDate.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
    profilePhotoUrl: photoBase64,
    qrCodeBase64: qrBase64
  });

  const pdfOutput = doc.output("arraybuffer");
  const pdfBuffer = Buffer.from(pdfOutput);

  const filepath = `nocs/${app.id}_NOC.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("default")
    .upload(filepath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true
    });

  if (uploadError) {
    console.warn("NOC upload failed:", uploadError.message);
  }

  const { data: { publicUrl: nocUrl } } = supabase.storage
    .from("default")
    .getPublicUrl(filepath);

  let offerLetterUrl = null;
  try {
    const { generateOfferLetterPDF } = await import("./pdf.server");
    offerLetterUrl = await generateOfferLetterPDF({
      fullName: app.full_name,
      roleApplied: app.role_applied,
      applicationId: app.id,
    });
  } catch (pdfErr) {
    console.warn("Offer Letter PDF generation failed:", pdfErr);
  }

  const subject = `OFFICIAL SELECTION: Vyntyra Industrial Internship Program 2026`;
  const portalLink = `https://careers.vyntyraconsultancyservices.in/auth/intern`;
  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #0f172a; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Selection Confirmation & Joining Offer</h2>
      <p>Dear <strong>${app.full_name}</strong>,</p>
      <p>Congratulations! You have been officially selected for the <strong>Vyntyra Industrial Internship Program 2026</strong> under Project VyNexa.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0f172a;">Intern Portal Login Credentials:</h3>
        <p style="margin: 5px 0;"><strong>Portal URL:</strong> <a href="${portalLink}">${portalLink}</a></p>
        <p style="margin: 5px 0;"><strong>Username:</strong> ${app.email}</p>
        <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
        <p style="font-size: 12px; color: #64748b; margin-top: 10px;">*You will be prompted to update your password on your first login for security reasons.</p>
      </div>

      <p>Your official <strong>No Objection Certificate (NOC)</strong> and <strong>Offer Letter</strong> have been generated with your official internship start date set for <strong>${startDate.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</strong> (4 days from today).</p>
      <p>Please log in to your Intern Dashboard to accept your offer, complete onboarding, and access your project resources.</p>
      
      <p style="margin-top: 30px;">Best Regards,<br><strong>Corporate HR Division</strong><br>Vyntyra Consultancy Services</p>
    </div>
  `;

  const { sendStatusChangeEmail } = await import("./status-email.server");
  
  const attachments = [];
  if (nocUrl) {
    attachments.push({ filename: 'No_Objection_Certificate.pdf', path: nocUrl });
  }
  if (offerLetterUrl) {
    attachments.push({ filename: 'Offer_Letter.pdf', path: offerLetterUrl });
  }

  await sendStatusChangeEmail({
    toEmail: app.email,
    fullName: app.full_name,
    roleApplied: app.role_applied,
    status: "hired",
    applicationId: app.id,
    portalLink,
    template: { subject, html_body: htmlBody },
    idempotencyKey: `selection-${app.id}-${Date.now()}`,
    attachments,
    ccEmail: null,
  });

  await supabase.from("application_status_events").insert([{
    application_id: app.id,
    from_status: "selected",
    to_status: "hired",
    note: `[Selection Email Sent] Intern credentials created. Temporary Password: ${tempPassword}`,
    changed_by: "00000000-0000-0000-0000-000000000000"
  }]);

  if (app.phone) {
    try {
      const { sendSmsViaEmailGateway } = await import("./email-sms-gateway");
      await sendSmsViaEmailGateway({
        recipientPhone: app.phone,
        recipientName: app.full_name,
        message: `Congratulations ${app.full_name}! You have been selected for Vyntyra Internship. Credentials sent to your email. Login: ${portalLink}`,
        subjectTag: "SELECTION CONFIRMATION",
      });
    } catch (smsErr) {
      console.warn("SMS dispatch skipped:", smsErr);
    }
  }

  await supabase
    .from("applications")
    .update({ status: "hired" })
    .eq("id", applicationId);
}

const scheduleSchema = z.object({
  applicationId: z.string().uuid(),
  sendAt: z.string().optional()
});

export const scheduleSelectionEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => scheduleSchema.parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);

    const { data: app, error } = await supabase
      .from("applications")
      .select("*")
      .eq("id", data.applicationId)
      .single();

    if (error || !app) throw new Error("Application not found");

    const sendAt = data.sendAt ? new Date(data.sendAt) : new Date();

    if (sendAt.getTime() <= Date.now() + 60000) {
      await dispatchSelectionEmail(data.applicationId);
      return { success: true, dispatched: true };
    }

    const { error: insertError } = await supabase.from("scheduled_emails").insert({
      application_id: data.applicationId,
      recipient_email: app.email,
      recipient_name: app.full_name,
      subject: `OFFICIAL SELECTION: Vyntyra Industrial Internship Program 2026`,
      send_at: sendAt.toISOString(),
      status: "pending"
    });

    if (insertError) throw new Error(`Failed to schedule email: ${insertError.message}`);

    return { success: true, dispatched: false };
  });

export const sendBulkSelectionEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);

    const { data: hiredApps, error } = await supabase
      .from("applications")
      .select("id, email, status")
      .eq("status", "hired");

    if (error) throw new Error(error.message);

    let sentCount = 0;
    for (const app of hiredApps || []) {
      const { data: existingProf } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", app.email)
        .maybeSingle();

      if (!existingProf) {
        await dispatchSelectionEmail(app.id);
        sentCount++;
      }
    }

    return { success: true, sentCount };
  });

export const listScheduledEmails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);

    const { data, error } = await supabase
      .from("scheduled_emails")
      .select(`
        *,
        applications:application_id (
          full_name,
          role_applied,
          status
        )
      `)
      .order("send_at", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  });

export const processScheduledEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);

    const { data: pending, error } = await supabase
      .from("scheduled_emails")
      .select("*")
      .eq("status", "pending")
      .lte("send_at", new Date().toISOString());

    if (error || !pending || pending.length === 0) {
      return { success: true, processedCount: 0 };
    }

    let processedCount = 0;
    for (const email of pending) {
      try {
        await supabase
          .from("scheduled_emails")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", email.id);

        await dispatchSelectionEmail(email.application_id);
        processedCount++;
      } catch (err: any) {
        await supabase
          .from("scheduled_emails")
          .update({ status: "failed", error_message: err.message })
          .eq("id", email.id);
      }
    }

    return { success: true, processedCount };
  });
