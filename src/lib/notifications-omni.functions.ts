import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdminClient } from "@/integrations/supabase/admin";
import { Resend } from "resend";
import { formatDateTimeDisplay, generateGoogleCalendarUrl, formatMeetingTimeRange } from "./date-utils";

const supabase = new Proxy({} as any, { get: (_, prop) => (getAdminClient() as any)[prop] });

const SITE_NAME = "VyNexa Connect";
const FROM_DOMAIN = "vyntyraconsultancyservices.in";
const DEFAULT_LOGO_URL = "https://raw.githubusercontent.com/JAMIESWARANILKUMAR/Vyntyra-VyNexa/main/public/icon-512.png";
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

// ─── 4. Send Meeting Schedule Email & In-App Notification ──────────────────
export const sendMeetingScheduleNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: unknown) =>
      z.object({
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        meeting_link: z.string().min(1),
        scheduled_at: z.string(), // start time ISO
        end_at: z.string().optional().nullable(), // end time ISO
        duration_minutes: z.number().optional().default(30),
        target_role: z.enum(["all", "employee", "intern", "individual"]).default("all"),
        target_user_id: z.string().optional().nullable(),
        organizer_name: z.string().optional(),
      }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const adminClient = getAdminClient();

    // 1. Determine recipients
    let recipients: { id: string; email: string; full_name?: string }[] = [];
    if (data.target_role === "individual" && data.target_user_id) {
      const { data: userProf } = await adminClient
        .from("profiles")
        .select("id, email, full_name")
        .eq("id", data.target_user_id)
        .maybeSingle();
      if (userProf?.email) {
        recipients = [userProf];
      }
    } else {
      const { data: roles } = await adminClient
        .from("user_roles")
        .select("user_id, role");
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id, email, full_name, intern_id");

      const roleMap = new Map<string, string>();
      (roles || []).forEach((r: any) => roleMap.set(r.user_id, r.role));

      recipients = (profiles || [])
        .filter((p: any) => {
          if (!p.email) return false;
          if (data.target_role === "all") return true;
          const r = roleMap.get(p.id) || (p.intern_id ? "intern" : "employee");
          return r === data.target_role;
        })
        .map((p: any) => ({
          id: p.id,
          email: p.email,
          full_name: p.full_name || p.email.split("@")[0],
        }));
    }

    const startDate = new Date(data.scheduled_at);
    const durationMins = data.duration_minutes || 30;
    const endDate = data.end_at ? new Date(data.end_at) : new Date(startDate.getTime() + durationMins * 60 * 1000);

    const formattedDate = startDate.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const fromTimeStr = startDate.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const toTimeStr = endDate.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const timeRangeStr = `${fromTimeStr} – ${toTimeStr} (IST)`;

    // Format Google Calendar Template URL
    const gcalUrl = generateGoogleCalendarUrl({
      title: data.title,
      description: data.description,
      location: data.meeting_link,
      startTime: startDate,
      endTime: endDate,
    });

    // Generate formatted WhatsApp announcement
    const whatsappMessage = `📢 *OFFICIAL MEETING NOTICE · PROJECT VYNEXA*

📌 *Meeting Topic:* ${data.title}
📅 *Date:* ${formattedDate}
⏰ *Time Schedule:* ${timeRangeStr} (${durationMins} Mins)
🔗 *Join Meeting URL:* ${data.meeting_link}

📝 *Agenda & Discussion Topics:*
${data.description || "General sync, milestone sprint review and interactive Q&A."}

🗓️ *Add to Google Calendar:*
${gcalUrl}

_All attendees are requested to join 5 minutes prior to the scheduled start time._
— *Vyntyra Directorate*`;

    // 2. Dispatch in-app notifications
    const notifPayloads = recipients.map((r) => ({
      user_id: r.id,
      title: `Meeting Scheduled: ${data.title}`,
      message: `You have an upcoming meeting on ${formattedDate} from ${timeRangeStr}. Click to join or add to Google Calendar.`,
      type: "meeting_scheduled",
      is_read: false,
      created_at: new Date().toISOString(),
    }));

    if (notifPayloads.length > 0) {
      try {
        await adminClient.from("user_notifications").insert(notifPayloads);
      } catch (e) {
        console.warn("[sendMeetingScheduleNotification] Notifications insert skipped:", e);
      }
    }

    // 3. Dispatch professional HTML email
    let emailsSent = 0;
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);

      for (const recipient of recipients) {
        const emailHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Official Meeting Invitation: ${data.title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0b1120;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0b1120;padding:36px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:620px;background-color:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.6);border:1px solid #1e293b;">
          <!-- Corporate Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #090e1a 0%, #1e293b 100%);padding:26px 32px;text-align:left;border-bottom:3px solid #6366f1;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="width:52px;vertical-align:middle;">
                    <img src="${DEFAULT_LOGO_URL}" alt="Vyntyra Logo" width="48" height="48" style="display:block;border-radius:10px;background-color:#ffffff;padding:2px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.3);border:1px solid #334155;">
                  </td>
                  <td style="padding-left:16px;vertical-align:middle;">
                    <div style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-0.02em;">Vyntyra Consultancy Services</div>
                    <div style="color:#818cf8;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;margin-top:2px;">Directorate of Operations &middot; Project VyNexa</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding:32px 32px 28px 32px;text-align:left;background-color:#ffffff;">
              <div style="display:inline-block;background-color:#e0e7ff;color:#4338ca;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;padding:5px 14px;border-radius:20px;margin-bottom:18px;border:1px solid #c7d2fe;">
                ⚡ Official Video Sync &middot; Scheduled Session
              </div>

              <h1 style="margin:0 0 14px 0;font-size:23px;font-weight:800;color:#0f172a;line-height:1.3;letter-spacing:-0.02em;">
                ${data.title}
              </h1>

              <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:#334155;">
                Dear <strong>${recipient.full_name || "Team Member"}</strong>,
              </p>

              <p style="margin:0 0 20px 0;font-size:14px;line-height:1.65;color:#475569;">
                You have been invited to an official corporate video sync session on <strong>Project VyNexa</strong>. Please find the scheduled timelines, access links, and conference agenda below:
              </p>

              <!-- Meeting Details Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;margin:20px 0;overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width:50%;vertical-align:top;padding-right:12px;">
                          <div style="font-size:10px;font-weight:800;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;">Meeting Date</div>
                          <div style="font-size:14px;font-weight:700;color:#0f172a;margin-top:3px;">📅 ${formattedDate}</div>
                        </td>
                        <td style="width:50%;vertical-align:top;padding-left:12px;border-left:1px solid #e2e8f0;">
                          <div style="font-size:10px;font-weight:800;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;">Scheduled Duration</div>
                          <div style="font-size:14px;font-weight:700;color:#0f172a;margin-top:3px;">⏱️ ${durationMins} Minutes</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;background-color:#f5f3ff;">
                    <div style="font-size:10px;font-weight:800;color:#6d28d9;letter-spacing:0.08em;text-transform:uppercase;">Official Schedule Window (IST)</div>
                    <div style="font-size:16px;font-weight:800;color:#4c1d95;margin-top:3px;">⏰ ${timeRangeStr}</div>
                  </td>
                </tr>
                ${data.description ? `
                <tr>
                  <td style="padding:16px 20px;">
                    <div style="font-size:10px;font-weight:800;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;">Agenda & Discussion Topics</div>
                    <div style="font-size:13px;color:#334155;margin-top:5px;line-height:1.6;white-space:pre-wrap;background-color:#ffffff;padding:12px 14px;border-radius:8px;border:1px solid #e2e8f0;">${data.description}</div>
                  </td>
                </tr>` : ""}
              </table>

              <!-- Action Buttons: Join Meeting & Google Calendar -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:28px 0 22px 0;">
                <tr>
                  <td align="center" style="padding-bottom:14px;">
                    <a href="${data.meeting_link}" target="_blank" style="display:inline-block;background-color:#4f46e5;color:#ffffff;font-size:16px;font-weight:800;text-decoration:none;padding:16px 40px;border-radius:12px;box-shadow:0 10px 25px -5px rgba(79,70,229,0.45);letter-spacing:-0.01em;">
                      📹 Join Live Video Conference Now &rarr;
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${gcalUrl}" target="_blank" style="display:inline-block;background-color:#f8fafc;color:#3730a3;border:1.5px solid #c7d2fe;font-size:13px;font-weight:700;text-decoration:none;padding:11px 28px;border-radius:10px;">
                      🗓️ Add to Google Calendar
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Corporate Protocol Checklist -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border-radius:10px;padding:14px 18px;margin-top:20px;border:1px solid #e2e8f0;">
                <tr>
                  <td>
                    <div style="font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">
                      🛡️ Meeting Guidelines & Protocols:
                    </div>
                    <ul style="margin:0;padding-left:18px;font-size:12px;color:#64748b;line-height:1.7;">
                      <li>Please ensure your audio/camera are configured and connect <strong>5 minutes prior</strong>.</li>
                      <li>Keep your session microphone muted when not addressing the conference.</li>
                      <li>Use your official registered corporate email profile for meeting admission.</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <p style="margin:22px 0 0 0;font-size:12px;line-height:1.6;color:#64748b;border-top:1px solid #e2e8f0;padding-top:16px;">
                For technical issues or urgent assistance, reach out directly to the <strong>Directorate Support Desk</strong> via your portal dashboard.
              </p>
            </td>
          </tr>

          <!-- Executive Footer -->
          <tr>
            <td style="background-color:#090e1a;padding:24px 32px;text-align:center;color:#64748b;font-size:11px;line-height:1.6;border-top:1px solid #1e293b;">
              <div style="color:#94a3b8;font-weight:700;font-size:12px;margin-bottom:4px;">
                &copy; ${new Date().getFullYear()} Vyntyra Consultancy Services &middot; All Rights Reserved.
              </div>
              <div>This is an automated operational communication issued by the Project VyNexa Corporate Directorate.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        try {
          await resend.emails.send({
            from: `Vyntyra Directorate <directorate@${FROM_DOMAIN}>`,
            to: recipient.email,
            subject: `Meeting Invitation: ${data.title} (${fromTimeStr} IST)`,
            html: emailHtml,
          });
          emailsSent++;
        } catch (mailErr) {
          console.warn("[sendMeetingScheduleNotification] Resend email dispatch failed for", recipient.email, mailErr);
        }
      }
    }

    return {
      success: true,
      recipientsCount: recipients.length,
      emailsSent,
      whatsappMessage,
      gcalUrl,
      timeRangeStr,
    };
  });

export const generateMeetingWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: unknown) =>
      z.object({
        title: z.string(),
        description: z.string().optional(),
        meeting_link: z.string(),
        scheduled_at: z.string(),
        end_at: z.string().optional().nullable(),
        duration_minutes: z.number().optional().default(30),
      }).parse(d)
  )
  .handler(async ({ data }) => {
    const startDate = new Date(data.scheduled_at);
    const durationMins = data.duration_minutes || 30;
    const endDate = data.end_at ? new Date(data.end_at) : new Date(startDate.getTime() + durationMins * 60 * 1000);

    const formattedDate = startDate.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const fromTimeStr = startDate.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const toTimeStr = endDate.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const timeRangeStr = `${fromTimeStr} – ${toTimeStr} (IST)`;

    const gcalUrl = generateGoogleCalendarUrl({
      title: data.title,
      description: data.description,
      location: data.meeting_link,
      startTime: startDate,
      endTime: endDate,
    });

    const text = `📢 *OFFICIAL MEETING NOTICE · PROJECT VYNEXA*

📌 *Meeting Topic:* ${data.title}
📅 *Date:* ${formattedDate}
⏰ *Time Schedule:* ${timeRangeStr} (${durationMins} Mins)
🔗 *Join Meeting URL:* ${data.meeting_link}

📝 *Agenda & Discussion Topics:*
${data.description || "General sync, milestone sprint review and interactive Q&A."}

🗓️ *Add to Google Calendar:*
${gcalUrl}

_All attendees are requested to join 5 minutes prior to the scheduled start time._
— *Vyntyra Directorate*`;

    const whatsappGroupUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    return {
      success: true,
      whatsappUrl: whatsappGroupUrl,
      messageText: text,
      gcalUrl,
    };
  });

// ─── 5. Send Dedicated Meeting Reminder Email & Notification ───────────────
export const sendMeetingReminderEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: unknown) =>
      z.object({
        meetingId: z.string().optional(),
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        meeting_link: z.string().min(1),
        scheduled_at: z.string(),
        end_at: z.string().optional().nullable(),
        duration_minutes: z.number().optional().default(30),
        target_role: z.enum(["all", "employee", "intern", "individual"]).default("all"),
        target_user_id: z.string().optional().nullable(),
        lead_time_text: z.string().optional().default("15 Minutes"),
      }).parse(d)
  )
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();

    // 1. Determine targeted recipients
    let recipients: { id: string; email: string; full_name?: string }[] = [];
    if (data.target_role === "individual" && data.target_user_id) {
      const { data: userProf } = await adminClient
        .from("profiles")
        .select("id, email, full_name")
        .eq("id", data.target_user_id)
        .maybeSingle();
      if (userProf?.email) {
        recipients = [userProf];
      }
    } else {
      const { data: roles } = await adminClient
        .from("user_roles")
        .select("user_id, role");
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id, email, full_name, intern_id");

      const roleMap = new Map<string, string>();
      (roles || []).forEach((r: any) => roleMap.set(r.user_id, r.role));

      recipients = (profiles || [])
        .filter((p: any) => {
          if (!p.email) return false;
          if (data.target_role === "all") return true;
          const r = roleMap.get(p.id) || (p.intern_id ? "intern" : "employee");
          return r === data.target_role;
        })
        .map((p: any) => ({
          id: p.id,
          email: p.email,
          full_name: p.full_name || p.email.split("@")[0],
        }));
    }

    const startDate = new Date(data.scheduled_at);
    const durationMins = data.duration_minutes || 30;
    const endDate = data.end_at ? new Date(data.end_at) : new Date(startDate.getTime() + durationMins * 60 * 1000);

    const formattedDate = startDate.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const fromTimeStr = startDate.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const toTimeStr = endDate.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const timeRangeStr = `${fromTimeStr} – ${toTimeStr} (IST)`;

    const gcalUrl = generateGoogleCalendarUrl({
      title: data.title,
      description: data.description,
      location: data.meeting_link,
      startTime: startDate,
      endTime: endDate,
    });

    // 2. Dispatch in-app notifications
    const notifPayloads = recipients.map((r) => ({
      user_id: r.id,
      title: `⏰ Meeting Reminder: ${data.title}`,
      message: `Your meeting starts in ${data.lead_time_text} (${timeRangeStr}). Click to join now.`,
      type: "meeting_reminder",
      is_read: false,
      created_at: new Date().toISOString(),
    }));

    if (notifPayloads.length > 0) {
      try {
        await adminClient.from("user_notifications").insert(notifPayloads);
      } catch (e) {
        console.warn("[sendMeetingReminderEmail] Notifications insert skipped:", e);
      }
    }

    // 3. Dispatch reminder email via Resend
    let emailsSent = 0;
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);

      for (const recipient of recipients) {
        const emailHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Executive Meeting Reminder: ${data.title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0b1120;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0b1120;padding:36px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:620px;background-color:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.6);border:1px solid #1e293b;">
          
          <!-- Corporate Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #090e1a 0%, #1e293b 100%);padding:26px 32px;text-align:left;border-bottom:3px solid #f59e0b;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="width:52px;vertical-align:middle;">
                    <img src="${DEFAULT_LOGO_URL}" alt="Vyntyra Logo" width="48" height="48" style="display:block;border-radius:10px;background-color:#ffffff;padding:2px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.3);border:1px solid #334155;">
                  </td>
                  <td style="padding-left:16px;vertical-align:middle;">
                    <div style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-0.02em;">Vyntyra Consultancy Services</div>
                    <div style="color:#fbbf24;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;margin-top:2px;">Directorate of Operations &middot; Project VyNexa</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding:32px 32px 28px 32px;text-align:left;background-color:#ffffff;">
              
              <!-- Automatic Countdown & Exact Time Callout -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);border:1.5px solid #f59e0b;border-radius:14px;margin-bottom:24px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(245,158,11,0.15);">
                <tr>
                  <td style="padding:16px 20px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align:middle;">
                          <div style="font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#b45309;">
                            ⏳ AUTOMATED TIMELINE REMINDER &middot; ${data.lead_time_text.toUpperCase()} NOTICE
                          </div>
                          <div style="font-size:18px;font-weight:900;color:#78350f;margin-top:3px;">
                            Commencing Exactly at ${fromTimeStr} (IST)
                          </div>
                        </td>
                        <td align="right" style="vertical-align:middle;padding-left:10px;">
                          <span style="display:inline-block;background-color:#d97706;color:#ffffff;font-size:11px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;padding:6px 14px;border-radius:20px;box-shadow:0 2px 4px rgba(217,119,6,0.3);">
                            ⚡ Starting Today
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <h1 style="margin:0 0 14px 0;font-size:23px;font-weight:800;color:#0f172a;line-height:1.3;letter-spacing:-0.02em;">
                ${data.title}
              </h1>

              <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:#334155;">
                Dear <strong>${recipient.full_name || "Team Member"}</strong>,
              </p>

              <p style="margin:0 0 20px 0;font-size:14px;line-height:1.65;color:#475569;">
                This is an automated priority reminder that your scheduled corporate meeting on <strong>Project VyNexa</strong> is commencing shortly. Please review the official schedule details below:
              </p>

              <!-- Meeting Details Schedule Card -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;margin:20px 0;overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width:50%;vertical-align:top;padding-right:12px;">
                          <div style="font-size:10px;font-weight:800;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;">Meeting Date</div>
                          <div style="font-size:14px;font-weight:700;color:#0f172a;margin-top:3px;">📅 ${formattedDate}</div>
                        </td>
                        <td style="width:50%;vertical-align:top;padding-left:12px;border-left:1px solid #e2e8f0;">
                          <div style="font-size:10px;font-weight:800;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;">Scheduled Duration</div>
                          <div style="font-size:14px;font-weight:700;color:#0f172a;margin-top:3px;">⏱️ ${durationMins} Minutes</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;background-color:#fefce8;">
                    <div style="font-size:10px;font-weight:800;color:#854d0e;letter-spacing:0.08em;text-transform:uppercase;">Official Schedule Window (IST)</div>
                    <div style="font-size:16px;font-weight:800;color:#a16207;margin-top:3px;">⏰ ${timeRangeStr}</div>
                  </td>
                </tr>
                ${data.description ? `
                <tr>
                  <td style="padding:16px 20px;">
                    <div style="font-size:10px;font-weight:800;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;">Agenda & Discussion Topics</div>
                    <div style="font-size:13px;color:#334155;margin-top:5px;line-height:1.6;white-space:pre-wrap;background-color:#ffffff;padding:12px 14px;border-radius:8px;border:1px solid #e2e8f0;">${data.description}</div>
                  </td>
                </tr>` : ""}
              </table>

              <!-- Primary Action CTAs -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:28px 0 22px 0;">
                <tr>
                  <td align="center" style="padding-bottom:14px;">
                    <a href="${data.meeting_link}" target="_blank" style="display:inline-block;background-color:#059669;color:#ffffff;font-size:16px;font-weight:800;text-decoration:none;padding:16px 40px;border-radius:12px;box-shadow:0 10px 25px -5px rgba(5,150,105,0.45);letter-spacing:-0.01em;">
                      📹 Join Live Video Conference Now &rarr;
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${gcalUrl}" target="_blank" style="display:inline-block;background-color:#f8fafc;color:#3730a3;border:1.5px solid #c7d2fe;font-size:13px;font-weight:700;text-decoration:none;padding:11px 28px;border-radius:10px;">
                      🗓️ Sync with Google Calendar
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Corporate Protocol Checklist -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border-radius:10px;padding:14px 18px;margin-top:20px;border:1px solid #e2e8f0;">
                <tr>
                  <td>
                    <div style="font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">
                      🛡️ Meeting Guidelines & Protocols:
                    </div>
                    <ul style="margin:0;padding-left:18px;font-size:12px;color:#64748b;line-height:1.7;">
                      <li>Please ensure your audio/camera are configured and connect <strong>5 minutes prior</strong>.</li>
                      <li>Keep your session microphone muted when not addressing the conference.</li>
                      <li>Use your official registered corporate email profile for meeting admission.</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <p style="margin:22px 0 0 0;font-size:12px;line-height:1.6;color:#64748b;border-top:1px solid #e2e8f0;padding-top:16px;">
                For technical issues or urgent assistance, reach out directly to the <strong>Directorate Support Desk</strong> via your portal dashboard.
              </p>
            </td>
          </tr>

          <!-- Executive Footer -->
          <tr>
            <td style="background-color:#090e1a;padding:24px 32px;text-align:center;color:#64748b;font-size:11px;line-height:1.6;border-top:1px solid #1e293b;">
              <div style="color:#94a3b8;font-weight:700;font-size:12px;margin-bottom:4px;">
                &copy; ${new Date().getFullYear()} Vyntyra Consultancy Services &middot; All Rights Reserved.
              </div>
              <div>This is an automated operational communication issued by the Project VyNexa Corporate Directorate.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        try {
          await resend.emails.send({
            from: `Vyntyra Directorate <directorate@${FROM_DOMAIN}>`,
            to: recipient.email,
            subject: `⏰ [REMINDER] Starting at ${fromTimeStr}: ${data.title}`,
            html: emailHtml,
          });
          emailsSent++;
        } catch (mailErr) {
          console.warn("[sendMeetingReminderEmail] Resend reminder email failed for", recipient.email, mailErr);
        }
      }
    }

    return {
      success: true,
      recipientsCount: recipients.length,
      emailsSent,
      gcalUrl,
      timeRangeStr,
    };
  });

// ─── 6. Automated Background Worker to Process Meeting Reminders ──────────
export const processAutomatedMeetingReminders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const adminClient = getAdminClient();
    const nowMs = Date.now();

    // Look for upcoming meetings within the next 26 hours
    const { data: upcomingMeetings, error } = await adminClient
      .from("meetings")
      .select("*")
      .gte("scheduled_at", new Date(nowMs - 30 * 60 * 1000).toISOString())
      .lte("scheduled_at", new Date(nowMs + 26 * 60 * 60 * 1000).toISOString());

    if (error || !upcomingMeetings || upcomingMeetings.length === 0) {
      return { success: true, processedCount: 0, dispatchedCount: 0 };
    }

    let dispatchedCount = 0;

    for (const m of upcomingMeetings) {
      const scheduledTime = m.scheduled_at || m.start_time;
      if (!scheduledTime) continue;

      const schedMs = new Date(scheduledTime).getTime();
      if (isNaN(schedMs) || schedMs <= nowMs - 15 * 60 * 1000) continue; // Meeting already ended

      const leadTimeMins = m.reminder_lead_time_minutes || 15;
      const targetTriggerMs = schedMs - (leadTimeMins * 60 * 1000);

      // If current time is past the target trigger time but before the meeting starts
      if (nowMs >= targetTriggerMs && nowMs < schedMs) {
        // Check if reminder was already sent
        if (m.reminder_sent_at) {
          const sentMs = new Date(m.reminder_sent_at).getTime();
          if (nowMs - sentMs < Math.max(leadTimeMins * 60 * 1000, 10 * 60 * 1000)) {
            continue;
          }
        }

        const leadTimeText = leadTimeMins >= 60 ? `${Math.round(leadTimeMins / 60)} Hours` : `${leadTimeMins} Minutes`;

        try {
          await sendMeetingReminderEmail({
            data: {
              meetingId: m.id,
              title: m.title,
              description: m.description,
              meeting_link: m.meeting_link,
              scheduled_at: scheduledTime,
              end_at: m.end_at,
              duration_minutes: m.duration_minutes || 30,
              target_role: m.target_role || "all",
              target_user_id: m.target_user_id,
              lead_time_text: leadTimeText,
            },
          });

          dispatchedCount++;

          try {
            await adminClient
              .from("meetings")
              .update({ reminder_sent_at: new Date().toISOString() })
              .eq("id", m.id);
          } catch (updateErr) {
            // Ignore column mismatch if schema is immutable
          }
        } catch (dispatchErr) {
          console.warn("[processAutomatedMeetingReminders] Failed for meeting", m.id, dispatchErr);
        }
      }
    }

    return {
      success: true,
      processedCount: upcomingMeetings.length,
      dispatchedCount,
    };
  });



