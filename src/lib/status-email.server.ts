// Server-only helper: sends a status-change email using the admin-editable
// template stored in the database. Content HTML comes from the admins, so we
// substitute {{variables}} then wrap in the branded shell.
import { Resend } from "resend";

const SENDER_DOMAIN = "notify.vyntyraconsultancyservices.in";
const FROM_ADDR = `Vyntyra Careers <careers@vyntyraconsultancyservices.in>`;

interface StatusEmailInput {
  toEmail: string;
  fullName: string;
  roleApplied: string;
  status: string;
  applicationId: string;
  portalLink: string;
  template: { subject: string; html_body: string };
  idempotencyKey: string;
  attachmentUrl?: string | null;
  attachments?: Array<{ filename: string; path: string }> | null;
  ccEmail?: string | null;
  meetLink?: string | null;
  meetingTime?: string | null;
  interviewerName?: string | null;
}

function substitute(source: string, vars: Record<string, string>) {
  return source.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : "",
  );
}

function stripHtml(h: string) {
  return h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const LOGO_URL = 'https://careers.vyntyraconsultancyservices.in/icon-512.png';

function shell(innerHtml: string) {
  return `<!doctype html><html><body style="margin:0;background:#F9FAFB;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;padding:40px 16px;">
    <div style="max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
      <div style="padding:32px 40px;border-bottom:1px solid #F3F4F6;">
        <table style="width:100%;border-collapse:collapse;"><tr>
          <td style="vertical-align:middle;width:40px;">
            <img src="${LOGO_URL}" alt="Vyntyra" width="32" height="32" style="display:block;" />
          </td>
          <td style="vertical-align:middle;padding-left:12px;">
            <div style="color:#111827;font-size:18px;font-weight:600;letter-spacing:-0.01em;">Vyntyra Consultancy Services</div>
          </td>
        </tr></table>
      </div>
      <div style="padding:40px;color:#374151;line-height:1.6;font-size:15px;">
        ${innerHtml}
      </div>
      <div style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:32px 40px;color:#6B7280;font-size:12px;line-height:1.5;">
        <div style="margin-bottom:16px;">
          <strong>Questions?</strong> Contact our Talent Acquisition team at <a href="mailto:hr@vyntyraconsultancyservices.in" style="color:#0f172a;font-weight:600;text-decoration:underline;">hr@vyntyraconsultancyservices.in</a>.
        </div>
        
        <div style="margin-bottom:16px;">
          <a href="https://linkedin.com" style="color:#0f172a;font-weight:600;text-decoration:none;margin-right:12px;">LinkedIn</a>
          <span style="color:#E5E7EB;">|</span>
          <a href="https://instagram.com" style="color:#0f172a;font-weight:600;text-decoration:none;margin-left:12px;margin-right:12px;">Instagram</a>
          <span style="color:#E5E7EB;">|</span>
          <a href="https://twitter.com" style="color:#0f172a;font-weight:600;text-decoration:none;margin-left:12px;">Twitter</a>
        </div>

        <hr style="border:0;border-top:1px solid #E5E7EB;margin:16px 0;" />

        <div style="margin-bottom:12px;">
          This email was sent to you by Vyntyra Consultancy Services in relation to your application for Project VyNexa.
        </div>
        <div style="margin-bottom:12px;">
          <strong>Vyntyra Consultancy Services</strong><br/>
          Visakhapatnam, AP, India<br/>
          ISO-aligned &middot; NASSCOM Verified &middot; MSME Registered
        </div>
        
        <div style="margin-bottom:16px;">
          <a href="https://careers.vyntyraconsultancyservices.in/privacy" style="color:#6B7280;text-decoration:underline;margin-right:12px;">Privacy Policy</a>
          <span style="color:#E5E7EB;">|</span>
          <a href="https://careers.vyntyraconsultancyservices.in/terms" style="color:#6B7280;text-decoration:underline;margin-left:12px;">Applicant Terms</a>
        </div>

        <div style="font-size:10px;color:#9CA3AF;font-style:italic;margin-top:16px;">
          Disclaimer: This electronic mail message, including any attachments, is for the sole use of the intended recipient(s) and may contain confidential or privileged information. Any unauthorized review, use, disclosure, or distribution is prohibited. If you are not the intended recipient, please contact the sender by reply email and destroy all copies of the original message.
        </div>
        
        <div style="margin-top:12px;">&copy; ${new Date().getFullYear()} Vyntyra Consultancy Services. All rights reserved.</div>
      </div>
    </div>
  </body></html>`;
}

export async function sendStatusChangeEmail(input: StatusEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[status-email] RESEND_API_KEY missing; skipping");
    return;
  }
  const resend = new Resend(apiKey);
  const vars = {
    full_name: input.fullName,
    role_applied: input.roleApplied,
    status: input.status,
    application_id: input.applicationId,
    portal_link: input.portalLink,
    meet_link: input.meetLink || "",
    meeting_time: input.meetingTime ? new Date(input.meetingTime).toLocaleString() : "",
    interviewer: input.interviewerName || "",
  };
  const subject = substitute(input.template.subject, vars);
  const body = substitute(input.template.html_body, vars);
  const html = shell(body);
  const text = stripHtml(html);

  try {
    await resend.emails.send({
      to: input.toEmail,
      from: FROM_ADDR,
      subject,
      html,
      text,
      ...(input.ccEmail ? { cc: input.ccEmail } : {}),
      ...(input.attachments && input.attachments.length > 0 ? {
        attachments: input.attachments
      } : (input.attachmentUrl ? {
        attachments: [
          {
            filename: 'Offer_Letter.pdf',
            path: input.attachmentUrl
          }
        ]
      } : {}))
    });
  } catch (err) {
    console.error("[status-email] failed to send email via Resend:", err);
  }
}
