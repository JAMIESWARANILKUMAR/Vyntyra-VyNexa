import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdminClient } from "@/integrations/supabase/admin";
import { Resend } from "resend";
import { formatDateTimeDisplay } from "./date-utils";

const supabase = new Proxy({} as any, { get: (_, prop) => (getAdminClient() as any)[prop] });

const SITE_NAME = "VyNexa Connect";
const FROM_DOMAIN = "vyntyraconsultancyservices.in";
const DEFAULT_LOGO_URL = "https://media.licdn.com/dms/image/v2/D560BAQHqR70ldjUQfw/company-logo_100_100/B56ZcLUrrcHoAY-/0/1748241661218?e=1787788800&v=beta&t=P9WCxG463gvoB0RKqmTrmuk0c7o6jVeFZbDmsg5dX9A";
const BASE_APP_URL = process.env.VITE_APP_URL || "https://careers.vyntyraconsultancyservices.in";

async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("*")
    .eq("user_id", userId)
    .eq("role", "admin");
  return !error && data && data.length > 0;
}

// ─── 1. Send Individual Payment Reminder Email ─────────────────────────────
export const sendPaymentReminderEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: unknown) =>
      z.object({
        recipient_email: z.string().email(),
        recipient_name: z.string().optional(),
        recipient_phone: z.string().optional(),
        intern_id: z.string().optional(),
        exam_fee_amount: z.number().default(199),
        payment_deadline: z.string().optional().nullable(),
        custom_subject: z.string().optional(),
        custom_note: z.string().optional(),
      }).parse(d)
  )
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const email = data.recipient_email.trim().toLowerCase();
    const name = data.recipient_name?.trim() || "Intern Candidate";
    const amount = data.exam_fee_amount || 199;
    const deadlineFormatted = data.payment_deadline ? formatDateTimeDisplay(data.payment_deadline) : "Immediate Action Required";
    const paymentUrl = `${BASE_APP_URL}/intern?action=pay_fee`;
    const subject = data.custom_subject || `Urgent: Exam Fee Payment Reminder (₹${amount}) — Project VyNexa`;

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#060b14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#334155;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#060b14;padding:35px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 40px -10px rgba(0,0,0,0.5);">
          
          <!-- Corporate Header -->
          <tr>
            <td style="background-color:#0b1728;padding:24px 32px;text-align:left;border-bottom:3px solid #10b981;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="width:48px;vertical-align:middle;">
                    <img src="${DEFAULT_LOGO_URL}" alt="Vyntyra" width="44" height="44" style="display:block;border-radius:8px;border:1px solid #1e293b;">
                  </td>
                  <td style="padding-left:14px;vertical-align:middle;">
                    <div style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em;">Vyntyra Consultancy Services</div>
                    <div style="color:#10b981;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;margin-top:2px;">Project VyNexa &middot; Financial & Exam Directorate</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding:32px 32px 20px 32px;text-align:left;">
              <div style="display:inline-block;background-color:#fef2f2;color:#dc2626;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:4px 12px;border-radius:20px;border:1px solid #fecaca;margin-bottom:14px;">
                &bull; Mandatory Fee Payment Pending
              </div>

              <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:800;color:#0f172a;line-height:1.35;">
                Action Required: Complete Your Exam Fee Payment
              </h1>

              <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#334155;">
                Dear <strong>${name}</strong>${data.intern_id ? ` (Intern ID: ${data.intern_id})` : ""},
              </p>

              <p style="margin:0 0 16px 0;font-size:14px;line-height:1.65;color:#475569;">
                This is an official reminder regarding your <strong>Exam & Certification Processing Fee</strong> for the <strong>Project VyNexa Internship Program</strong> at Vyntyra Consultancy Services.
              </p>

              <!-- Payment Summary Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin:20px 0;overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Payable Amount</div>
                    <div style="font-size:26px;font-weight:900;color:#0f172a;margin-top:2px;">₹${amount} <span style="font-size:13px;font-weight:500;color:#64748b;">(INR)</span></div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;background-color:#fff1f2;">
                    <div style="font-size:11px;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:0.05em;">Payment Due Deadline</div>
                    <div style="font-size:14px;font-weight:700;color:#dc2626;margin-top:2px;">⏰ ${deadlineFormatted}</div>
                  </td>
                </tr>
              </table>

              ${data.custom_note ? `
              <div style="background-color:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;font-size:13px;color:#1e3a8a;line-height:1.6;">
                <strong>Admin Note:</strong> ${data.custom_note}
              </div>` : ""}

              <!-- Benefits List -->
              <div style="margin:20px 0 24px 0;">
                <div style="font-size:12px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px;">Why Complete Your Payment:</div>
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding:4px 0;font-size:13px;color:#334155;">&check; <strong>Verified ISO-Aligned Certificate</strong> upon successful project completion.</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;font-size:13px;color:#334155;">&check; <strong>Stipend Eligibility</strong> up to ₹5,000 – ₹15,000 for top 10% performing interns.</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;font-size:13px;color:#334155;">&check; <strong>Full Dashboard & Task Submission Unlock</strong> to record deliverables and receive mentor reviews.</td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center;margin:32px 0 24px 0;">
                <a href="${paymentUrl}" target="_blank" style="display:inline-block;background-color:#10b981;color:#ffffff;font-size:16px;font-weight:800;text-decoration:none;padding:16px 36px;border-radius:12px;box-shadow:0 10px 20px -5px rgba(16,185,129,0.5);letter-spacing:0.02em;">
                  Pay Exam Fee Online &rarr;
                </a>
                <div style="font-size:11px;color:#64748b;margin-top:8px;">Instant secure checkout via UPI, Cards, NetBanking, and Wallets</div>
              </div>

              <p style="margin:24px 0 0 0;font-size:13px;line-height:1.6;color:#64748b;border-top:1px solid #f1f5f9;padding-top:16px;">
                If you have already processed your transaction, please allow a few minutes for verification or contact the Directorate at <a href="mailto:hr@vyntyraconsultancyservices.in" style="color:#10b981;font-weight:600;">hr@vyntyraconsultancyservices.in</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0f172a;padding:20px 32px;text-align:center;color:#94a3b8;font-size:11px;">
              <div style="color:#ffffff;font-weight:600;margin-bottom:4px;">Vyntyra Consultancy Services &middot; Project VyNexa</div>
              <div>Global Operations & Corporate Directorate &middot; All Rights Reserved &copy; 2026</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    let resendId: string | null = null;
    let provider: "resend" | "brevo" = "resend";
    let status: "sent" | "failed" = "sent";
    let errorMessage: string | null = null;

    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        const resend = new Resend(apiKey);
        const res = await resend.emails.send({
          from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
          to: email,
          subject,
          html,
        });
        if (res.error) throw new Error(res.error.message);
        resendId = res.data?.id || null;
      } else {
        throw new Error("RESEND_API_KEY not configured");
      }
    } catch (err: any) {
      console.warn("[sendPaymentReminderEmail] Resend attempt failed, trying fallback:", err.message);
      errorMessage = err.message;
      status = "failed";
    }

    // Record log in automated_email_logs
    try {
      await supabase.from("automated_email_logs").insert({
        recipient_email: email,
        recipient_name: name,
        campaign_type: "payment_reminder",
        subject,
        status,
        provider_used: provider,
        resend_message_id: resendId,
        error_message: errorMessage,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("[sendPaymentReminderEmail] Log skipped:", e);
    }

    if (status === "failed" && errorMessage) {
      throw new Error(`Failed to dispatch reminder email: ${errorMessage}`);
    }

    return { success: true, message: `Payment reminder email dispatched to ${email}` };
  });

// ─── 2. Send Bulk Payment Reminder Emails (1-Click) ─────────────────────────
export const sendBulkPaymentReminderEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: unknown) =>
      z.object({
        targetType: z.enum(["all_unpaid", "selected"]).default("all_unpaid"),
        internIds: z.array(z.string().uuid()).optional(),
        customSubject: z.string().optional(),
        customNote: z.string().optional(),
      }).parse(d)
  )
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const admin = getAdminClient();
    let query = admin
      .from("profiles")
      .select("id, full_name, email, phone, phone_number, intern_id, exam_fee_amount, fee_payment_deadline, exam_fee_paid, is_fee_exempted")
      .eq("exam_fee_paid", false)
      .eq("is_fee_exempted", false);

    if (data.targetType === "selected" && data.internIds?.length) {
      query = query.in("id", data.internIds);
    }

    const { data: interns, error } = await query;
    if (error) throw new Error(error.message);

    if (!interns || interns.length === 0) {
      return { success: true, count: 0, message: "No unpaid interns found to send reminders to." };
    }

    let successCount = 0;
    let failCount = 0;

    for (const intern of interns) {
      if (!intern.email) continue;
      try {
        await sendPaymentReminderEmail({
          data: {
            recipient_email: intern.email,
            recipient_name: intern.full_name,
            recipient_phone: intern.phone || intern.phone_number,
            intern_id: intern.intern_id,
            exam_fee_amount: intern.exam_fee_amount || 199,
            payment_deadline: intern.fee_payment_deadline,
            custom_subject: data.customSubject,
            custom_note: data.customNote,
          },
        });
        successCount++;
      } catch (err) {
        console.warn(`[sendBulkPaymentReminderEmails] Failed for ${intern.email}:`, err);
        failCount++;
      }
    }

    return {
      success: true,
      count: successCount,
      failed: failCount,
      message: `Dispatched payment reminder emails to ${successCount} intern(s).` + (failCount > 0 ? ` (${failCount} failed)` : ""),
    };
  });

// ─── 3. Generate WhatsApp Payment Reminder Link ───────────────────────────
export const generatePaymentReminderWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: unknown) =>
      z.object({
        recipientPhone: z.string(),
        recipientName: z.string().optional(),
        examFeeAmount: z.number().default(199),
        paymentDeadline: z.string().optional().nullable(),
      }).parse(d)
  )
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    let cleanPhone = data.recipientPhone.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

    const name = data.recipientName || "Candidate";
    const amount = data.examFeeAmount || 199;
    const deadlineStr = data.paymentDeadline ? formatDateTimeDisplay(data.paymentDeadline) : "as soon as possible";
    const payUrl = `${BASE_APP_URL}/intern?action=pay_fee`;

    const text = `Dear ${name},\n\nThis is an official reminder from *Vyntyra Consultancy Services* regarding your *Project VyNexa Internship Exam & Certification Fee (₹${amount})*.\n\n⏰ *Payment Due Deadline:* ${deadlineStr}\n\n✅ *Benefits:* Verified Certificate + Top 10% Stipend Eligibility (₹5,000 to ₹15,000) + Full Task Dashboard Access.\n\n👉 *Pay Securely Online Now:*\n${payUrl}\n\nFor queries, contact hr@vyntyraconsultancyservices.in\n*Vyntyra Directorate*`;

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;

    return {
      success: true,
      whatsappUrl,
      recipientPhone: cleanPhone,
      messageText: text,
    };
  });

// ─── 4. Task Notification Email & WhatsApp (Status-Specific) ────────────────
export const sendTaskNotificationEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: unknown) =>
      z.object({
        recipient_email: z.string().email(),
        recipient_name: z.string().optional(),
        task_title: z.string(),
        task_status: z.string().optional().default("assigned"), // 'assigned' | 'completed' | 'changes_requested' | 'submitted' | 'deadline_reminder'
        mentor_remarks: z.string().optional(),
        custom_subject: z.string().optional(),
        due_date: z.string().optional(),
        priority: z.string().optional(),
        credits: z.number().optional(),
      }).parse(d)
  )
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    const email = data.recipient_email.trim().toLowerCase();
    const name = data.recipient_name?.trim() || "Intern Candidate";
    const status = (data.task_status || "assigned").toLowerCase();
    const internTaskUrl = `${BASE_APP_URL}/intern`;

    // Determine status badge, headline, and accent colors
    let badgeText = "• TASK ASSIGNMENT UPDATE";
    let badgeBg = "#eff6ff";
    let badgeColor = "#2563eb";
    let badgeBorder = "#bfdbfe";
    let statusHeadline = "Task Milestone Update";
    let statusSummary = `Your internship milestone task <strong>"${data.task_title}"</strong> has been updated.`;
    let defaultSubject = `Task Update: "${data.task_title}" — Project VyNexa`;

    if (status === "completed" || status === "approved") {
      badgeText = "✓ TASK APPROVED & COMPLETED";
      badgeBg = "#ecfdf5";
      badgeColor = "#059669";
      badgeBorder = "#a7f3d0";
      statusHeadline = "Congratulations! Your Deliverable is Approved";
      statusSummary = `Great work! Your submission for <strong>"${data.task_title}"</strong> has been verified and marked as <strong>Completed</strong> by the Directorate.`;
      defaultSubject = `✓ Task Approved: "${data.task_title}" — Project VyNexa`;
    } else if (status === "changes_requested" || status === "needs_revision" || status === "blocked") {
      badgeText = "⚠️ ACTION REQUIRED: REVISIONS REQUESTED";
      badgeBg = "#fff7ed";
      badgeColor = "#ea580c";
      badgeBorder = "#fed7aa";
      statusHeadline = "Revisions Required for Your Submission";
      statusSummary = `Your mentor has reviewed your submission for <strong>"${data.task_title}"</strong> and requested revisions before final sign-off.`;
      defaultSubject = `Action Required: Revisions for "${data.task_title}" — Project VyNexa`;
    } else if (status === "submitted" || status === "under_review") {
      badgeText = "⏳ SUBMISSION RECEIVED & UNDER REVIEW";
      badgeBg = "#f5f3ff";
      badgeColor = "#7c3aed";
      badgeBorder = "#ddd6fe";
      statusHeadline = "Deliverable Received for Review";
      statusSummary = `We have received your deliverable for <strong>"${data.task_title}"</strong>. Your mentor is currently reviewing your work.`;
      defaultSubject = `Submission Received: "${data.task_title}" — Project VyNexa`;
    } else if (status === "deadline_reminder" || status === "overdue") {
      badgeText = "⏰ URGENT: TASK DEADLINE APPROACHING";
      badgeBg = "#fef2f2";
      badgeColor = "#dc2626";
      badgeBorder = "#fecaca";
      statusHeadline = "Urgent: Complete & Submit Your Deliverable";
      statusSummary = `This is a reminder that the milestone deadline for <strong>"${data.task_title}"</strong> is due soon. Please submit your deliverable promptly.`;
      defaultSubject = `⏰ Urgent Task Deadline: "${data.task_title}" — Project VyNexa`;
    } else {
      badgeText = "📋 NEW MILESTONE TASK ASSIGNED";
      badgeBg = "#eff6ff";
      badgeColor = "#2563eb";
      badgeBorder = "#bfdbfe";
      statusHeadline = "New Internship Milestone Task Assigned";
      statusSummary = `A new project task <strong>"${data.task_title}"</strong> has been assigned to you. Review instructions and begin your implementation.`;
      defaultSubject = `New Task Assigned: "${data.task_title}" — Project VyNexa`;
    }

    const subject = data.custom_subject || defaultSubject;

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#060b14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#334155;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#060b14;padding:35px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 40px -10px rgba(0,0,0,0.5);">
          
          <!-- Corporate Header -->
          <tr>
            <td style="background-color:#0b1728;padding:24px 32px;text-align:left;border-bottom:3px solid #10b981;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="width:48px;vertical-align:middle;">
                    <img src="${DEFAULT_LOGO_URL}" alt="Vyntyra" width="44" height="44" style="display:block;border-radius:8px;border:1px solid #1e293b;">
                  </td>
                  <td style="padding-left:14px;vertical-align:middle;">
                    <div style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em;">Vyntyra Consultancy Services</div>
                    <div style="color:#10b981;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;margin-top:2px;">Project VyNexa &middot; Mentor & Task Directorate</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding:32px 32px 24px 32px;text-align:left;">
              <div style="display:inline-block;background-color:${badgeBg};color:${badgeColor};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:4px 12px;border-radius:20px;border:1px solid ${badgeBorder};margin-bottom:14px;">
                ${badgeText}
              </div>

              <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:800;color:#0f172a;line-height:1.35;">
                ${statusHeadline}
              </h1>

              <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#334155;">
                Dear <strong>${name}</strong>,
              </p>

              <p style="margin:0 0 18px 0;font-size:14px;line-height:1.65;color:#475569;">
                ${statusSummary}
              </p>

              <!-- Task Details Summary Card -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin:20px 0;overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size:13px;color:#64748b;font-weight:600;">Task Title:</td>
                        <td align="right" style="font-size:14px;font-weight:800;color:#0f172a;">${data.task_title}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${data.due_date ? `
                <tr>
                  <td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;background-color:#faf5ff;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size:12px;color:#6b21a8;font-weight:600;">Due Deadline:</td>
                        <td align="right" style="font-size:12px;font-weight:700;color:#581c87;">${data.due_date}</td>
                      </tr>
                    </table>
                  </td>
                </tr>` : ""}
                ${data.credits !== undefined ? `
                <tr>
                  <td style="padding:12px 20px;background-color:#f0fdf4;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size:12px;color:#166534;font-weight:600;">Credits / Score:</td>
                        <td align="right" style="font-size:13px;font-weight:800;color:#15803d;">+${data.credits} Credits</td>
                      </tr>
                    </table>
                  </td>
                </tr>` : ""}
              </table>

              <!-- Mentor Feedback Box (if provided) -->
              ${data.mentor_remarks ? `
              <div style="background-color:#f8fafc;border-left:4px solid #10b981;padding:16px 18px;border-radius:0 10px 10px 0;margin:22px 0;">
                <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:6px;">📝 Mentor Remarks &amp; Official Feedback:</div>
                <div style="font-size:13px;line-height:1.6;color:#334155;white-space:pre-wrap;">${data.mentor_remarks}</div>
              </div>` : ""}

              <!-- CTA Button -->
              <div style="text-align:center;margin:32px 0 20px 0;">
                <a href="${internTaskUrl}" target="_blank" style="display:inline-block;background-color:#10b981;color:#ffffff;font-size:15px;font-weight:800;text-decoration:none;padding:15px 34px;border-radius:12px;box-shadow:0 10px 20px -5px rgba(16,185,129,0.5);letter-spacing:0.02em;">
                  Open Intern Task Dashboard &rarr;
                </a>
                <div style="font-size:11px;color:#64748b;margin-top:8px;">View task specifications, upload deliverables, and track performance scores</div>
              </div>

              <p style="margin:24px 0 0 0;font-size:13px;line-height:1.6;color:#64748b;border-top:1px solid #f1f5f9;padding-top:16px;">
                For questions regarding this milestone, you may reply to this email or contact your assigned mentor team at <a href="mailto:hr@vyntyraconsultancyservices.in" style="color:#10b981;font-weight:600;">hr@vyntyraconsultancyservices.in</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0f172a;padding:20px 32px;text-align:center;color:#94a3b8;font-size:11px;">
              <div style="color:#ffffff;font-weight:600;margin-bottom:4px;">Vyntyra Consultancy Services &middot; Project VyNexa</div>
              <div>Global Operations & Corporate Directorate &middot; All Rights Reserved &copy; 2026</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    let resendId: string | null = null;
    let statusLog: "sent" | "failed" = "sent";
    let errorMessage: string | null = null;

    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        const resend = new Resend(apiKey);
        const res = await resend.emails.send({
          from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
          to: email,
          subject,
          html,
        });
        if (res.error) throw new Error(res.error.message);
        resendId = res.data?.id || null;
      } else {
        throw new Error("RESEND_API_KEY not configured");
      }
    } catch (err: any) {
      console.warn("[sendTaskNotificationEmail] Dispatch failed:", err.message);
      errorMessage = err.message;
      statusLog = "failed";
    }

    try {
      await supabase.from("automated_email_logs").insert({
        recipient_email: email,
        recipient_name: name,
        campaign_type: `task_${status}`,
        subject,
        status: statusLog,
        provider_used: "resend",
        resend_message_id: resendId,
        error_message: errorMessage,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("[sendTaskNotificationEmail] Log skipped:", e);
    }

    if (statusLog === "failed" && errorMessage) {
      throw new Error(`Failed to send task notification: ${errorMessage}`);
    }

    return { success: true, message: `Task status email dispatched to ${email}` };
  });

export const generateTaskWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: unknown) =>
      z.object({
        recipientPhone: z.string(),
        recipientName: z.string().optional(),
        taskTitle: z.string(),
        taskStatus: z.string().optional().default("assigned"),
        remarks: z.string().optional(),
      }).parse(d)
  )
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    let cleanPhone = data.recipientPhone.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

    const name = data.recipientName || "Intern";
    const status = data.taskStatus || "assigned";
    let statusHeader = "📋 *Task Update*";
    if (status === "completed" || status === "approved") statusHeader = "✅ *Task Approved & Completed*";
    if (status === "changes_requested" || status === "needs_revision") statusHeader = "⚠️ *Action Required: Task Revisions Requested*";
    if (status === "deadline_reminder") statusHeader = "⏰ *Urgent: Task Deadline Approaching*";

    const text = `Hi ${name},\n\n${statusHeader} for *"${data.taskTitle}"* on the Project VyNexa Portal.${data.remarks ? `\n\n📝 *Mentor Feedback:* ${data.remarks}` : ""}\n\nPlease check your Intern Dashboard: ${BASE_APP_URL}/intern\n\nVyntyra Directorate`;

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;

    return { success: true, whatsappUrl, recipientPhone: cleanPhone, messageText: text };
  });

