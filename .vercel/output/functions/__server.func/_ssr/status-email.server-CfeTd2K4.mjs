import { t as Resend } from "../_libs/resend+standardwebhooks.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/status-email.server-CfeTd2K4.js
var FROM_ADDR = `Vyntyra Careers <careers@vyntyraconsultancyservices.in>`;
function substitute(source, vars) {
	return source.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_, k) => vars[k] !== void 0 ? String(vars[k]) : "");
}
function stripHtml(h) {
	return h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
var LOGO_URL = "https://careers.vyntyraconsultancyservices.in/favicon.png";
function shell(innerHtml) {
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
      <div style="background:#F9FAFB;border-top:1px solid #F3F4F6;padding:24px 40px;color:#6B7280;font-size:12px;line-height:1.5;">
        <div style="margin-bottom:12px;">
          This email was sent to you by Vyntyra Consultancy Services in relation to your application for Project VyNexa.
        </div>
        <div style="margin-bottom:12px;">
          <strong>Vyntyra Consultancy Services</strong><br/>
          Visakhapatnam, AP, India<br/>
          ISO-aligned &middot; NASSCOM Verified &middot; MSME Registered
        </div>
        <div>&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} Vyntyra Consultancy Services. All rights reserved.</div>
      </div>
    </div>
  </body></html>`;
}
async function sendStatusChangeEmail(input) {
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
		portal_link: input.portalLink
	};
	const subject = substitute(input.template.subject, vars);
	const html = shell(substitute(input.template.html_body, vars));
	const text = stripHtml(html);
	try {
		await resend.emails.send({
			to: input.toEmail,
			from: FROM_ADDR,
			subject,
			html,
			text
		});
	} catch (err) {
		console.error("[status-email] failed to send email via Resend:", err);
	}
}
//#endregion
export { sendStatusChangeEmail };
