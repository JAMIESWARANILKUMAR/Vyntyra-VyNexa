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
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#334155;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:620px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05),0 2px 4px -1px rgba(0,0,0,0.025);">
          
          <!-- Header Branding -->
          <tr>
            <td style="background-color:#ffffff;padding:24px 40px;text-align:left;border-bottom:1px solid #e2e8f0;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="width:36px;vertical-align:middle;text-align:left;">
                    <img src="${LOGO_URL}" alt="Vyntyra Logo" width="30" height="30" style="display:block;border-radius:6px;">
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;text-align:left;">
                    <div style="color:#0f172a;font-size:16px;font-weight:600;letter-spacing:-0.01em;">Vyntyra Consultancy Services</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:40px;color:#334155;line-height:1.7;font-size:15px;text-align:left;">
              ${innerHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:32px 40px;text-align:center;color:#64748b;font-size:11.5px;line-height:1.65;border-top:1px solid #e2e8f0;">
              <div style="color:#0f172a;font-weight:600;font-size:13px;margin-bottom:12px;">Vyntyra Consultancy Services</div>
              
              <div style="margin-bottom:18px;">
                <a href="https://www.linkedin.com/company/vyntyra-consultancy-services" style="color:#2563eb;font-weight:500;text-decoration:none;margin:0 8px;">LinkedIn</a>
                <span style="color:#cbd5e1;">|</span>
                <a href="https://www.instagram.com/vyntyraindia" style="color:#2563eb;font-weight:500;text-decoration:none;margin:0 8px;">Instagram</a>
                <span style="color:#cbd5e1;">|</span>
                <a href="https://careers.vyntyraconsultancyservices.in/" style="color:#2563eb;font-weight:500;text-decoration:none;margin:0 8px;">Official Portal</a>
              </div>

              <div style="padding-top:12px;color:#64748b;">
                Dwaraka Nagar, Visakhapatnam - 530016, AP, India<br>
                ISO 9001:2015 Certified &middot; MSME Registered &middot; UDYAM-AP-10-0143100
              </div>

              <div style="margin-top:14px;color:#94a3b8;font-size:10px;line-height:1.5;">
                This communication relates to your application for Project VyNexa.<br>
                Need assistance? Email <a href="mailto:hr@vyntyraconsultancyservices.in" style="color:#2563eb;text-decoration:underline;">hr@vyntyraconsultancyservices.in</a>
              </div>

              <div style="margin-top:14px;font-size:10px;color:#94a3b8;font-style:italic;">
                Disclaimer: This transmission contains confidential information intended solely for the recipient. If received in error, please notify the sender immediately and delete all copies.
              </div>

              <div style="margin-top:14px;color:#94a3b8;">&copy; ${new Date().getFullYear()} Vyntyra Consultancy Services. All rights reserved.</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendStatusChangeEmail(input: StatusEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const brevoKey = process.env.BREVO_API_KEY;

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

  const rawAttachments = input.attachments && input.attachments.length > 0
    ? input.attachments
    : (input.attachmentUrl ? [{ filename: 'Offer_Letter.pdf', path: input.attachmentUrl }] : []);

  // Pre-fetch remote PDF attachments into Base64 buffers for 100% reliable MIME delivery
  const resendAttachments: Array<{ filename: string; content: Buffer }> = [];
  const brevoAttachments: Array<{ name: string; content: string }> = [];

  for (const att of rawAttachments) {
    try {
      if (att.path.startsWith("http://") || att.path.startsWith("https://")) {
        const fetchRes = await fetch(att.path);
        if (fetchRes.ok) {
          const arrBuf = await fetchRes.arrayBuffer();
          const buf = Buffer.from(arrBuf);
          resendAttachments.push({ filename: att.filename, content: buf });
          brevoAttachments.push({ name: att.filename, content: buf.toString("base64") });
        } else {
          console.warn("[status-email] Remote attachment fetch returned status:", fetchRes.status, att.path);
        }
      }
    } catch (attErr) {
      console.warn("[status-email] Failed to pre-fetch attachment:", att.path, attErr);
    }
  }

  const fromAddr = process.env.RESEND_FROM || FROM_ADDR;
  let sent = false;
  let lastError = "";

  // 1. Try Primary Resend Dispatch
  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      const res = await resend.emails.send({
        to: input.toEmail,
        from: fromAddr,
        subject,
        html,
        text,
        ...(input.ccEmail ? { cc: input.ccEmail } : {}),
        ...(resendAttachments.length > 0 ? { attachments: resendAttachments } : {})
      });

      if (res.error) {
        lastError = `Resend Error: ${res.error.message}`;
        console.warn("[status-email] Resend returned error:", res.error);

        // Fallback: If domain verification issue, try fallback address if configured
        if (res.error.message.includes("domain") || res.error.message.includes("verify") || res.error.message.includes("validation")) {
          const fallbackRes = await resend.emails.send({
            to: input.toEmail,
            from: "Vyntyra Careers <onboarding@resend.dev>",
            subject,
            html,
            text,
            ...(resendAttachments.length > 0 ? { attachments: resendAttachments } : {})
          });
          if (!fallbackRes.error) {
            return { messageId: fallbackRes.data?.id || "resend-fallback-ok", provider: 'resend' as const };
          }
        }
      } else {
        return { messageId: res.data?.id || "resend-ok", provider: 'resend' as const };
      }
    } catch (err: any) {
      lastError = `Resend Exception: ${err.message}`;
      console.warn("[status-email] Resend failed, trying Brevo fallback:", err);
    }
  }

  // 2. Try Brevo API Fallback
  if (brevoKey) {
    try {
      const bRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "api-key": brevoKey,
        },
        body: JSON.stringify({
          sender: { name: "Vyntyra Careers", email: "careers@vyntyraconsultancyservices.in" },
          to: [{ email: input.toEmail, name: input.fullName }],
          subject,
          htmlContent: html,
          ...(input.ccEmail ? { cc: [{ email: input.ccEmail }] } : {}),
          ...(brevoAttachments.length > 0 ? { attachment: brevoAttachments } : {})
        }),
      });

      if (bRes.ok) {
        const bJson = await bRes.json().catch(() => ({}));
        return { messageId: bJson.messageId || "brevo-ok", provider: 'brevo' as const };
      } else {
        const bErrJson = await bRes.json().catch(() => ({ message: bRes.statusText }));
        lastError = `Brevo Error (${bRes.status}): ${bErrJson.message || bRes.statusText}`;
        console.error("[status-email] Brevo returned error:", bErrJson);
      }
    } catch (bErr: any) {
      lastError = `Brevo Exception: ${bErr.message}`;
      console.error("[status-email] Brevo fallback failed:", bErr);
    }
  }

  throw new Error(`Email delivery failed for ${input.toEmail}. Reason: ${lastError || "No valid email API credentials found."}`);
}
