import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { n as getRequestHeader } from "./request-response-BDiR3rEX.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/portal.functions-C0-e3OF0.js
function originFromRequest() {
	const proto = getRequestHeader("x-forwarded-proto") || "https";
	const host = getRequestHeader("x-forwarded-host") || getRequestHeader("host") || "";
	if (!host) return "";
	return `${proto}://${host}`;
}
async function sha256Hex(input) {
	const buf = new TextEncoder().encode(input);
	const digest = await crypto.subtle.digest("SHA-256", buf);
	return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function randomToken() {
	const bytes = /* @__PURE__ */ new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
var requestSchema = objectType({ email: stringType().trim().email().max(255) });
var requestPortalLink_createServerFn_handler = createServerRpc({
	id: "e563446df7e4eb9c1e0c43b354bc4a2dd381062c625fdccaa270ce07aa82ffe4",
	name: "requestPortalLink",
	filename: "src/lib/portal.functions.ts"
}, (opts) => requestPortalLink.__executeServer(opts));
var requestPortalLink = createServerFn({ method: "POST" }).inputValidator((d) => requestSchema.parse(d)).handler(requestPortalLink_createServerFn_handler, async ({ data }) => {
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const email = data.email.toLowerCase();
	const { data: apps } = await supabaseAdmin.from("applications").select("id, full_name, role_applied, email").eq("email", email).order("created_at", { ascending: false }).limit(1);
	const app = apps?.[0];
	if (!app) return { ok: true };
	try {
		const token = randomToken();
		const tokenHash = await sha256Hex(token);
		const expiresAt = new Date(Date.now() + 1800 * 1e3).toISOString();
		await supabaseAdmin.from("applicant_access_tokens").insert({
			application_id: app.id,
			token_hash: tokenHash,
			expires_at: expiresAt
		});
		const origin = originFromRequest();
		const portalLink = origin ? `${origin}/status/${token}` : `/status/${token}`;
		const { Resend } = await import("../_libs/resend+standardwebhooks.mjs").then((n) => n.n);
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
				text: `Open this link to view your application status (valid 30 minutes): ${portalLink}`
			});
		}
	} catch (e) {
		console.warn("[portal] magic link email skipped:", e.message);
	}
	return { ok: true };
});
var checkSchema = objectType({ token: stringType().trim().min(32).max(128) });
var checkPortalToken_createServerFn_handler = createServerRpc({
	id: "1a74851ae317b569d03fc7ae2132700e1bcb80eba5f523d0d16814da7a4a9171",
	name: "checkPortalToken",
	filename: "src/lib/portal.functions.ts"
}, (opts) => checkPortalToken.__executeServer(opts));
var checkPortalToken = createServerFn({ method: "POST" }).inputValidator((d) => checkSchema.parse(d)).handler(checkPortalToken_createServerFn_handler, async ({ data }) => {
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const tokenHash = await sha256Hex(data.token);
	const { data: row } = await supabaseAdmin.from("applicant_access_tokens").select("id, application_id, expires_at, used_at").eq("token_hash", tokenHash).maybeSingle();
	if (!row) return {
		ok: false,
		reason: "invalid"
	};
	if (row.used_at) return {
		ok: false,
		reason: "used"
	};
	if (new Date(row.expires_at).getTime() < Date.now()) return {
		ok: false,
		reason: "expired"
	};
	await supabaseAdmin.from("applicant_access_tokens").update({ used_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", row.id);
	const { data: app } = await supabaseAdmin.from("applications").select("id, full_name, role_applied, status, created_at, updated_at, resume_path").eq("id", row.application_id).single();
	if (!app) return {
		ok: false,
		reason: "invalid"
	};
	let resumeUrl = null;
	let resumeName = null;
	if (app.resume_path) {
		const { data: signed } = await supabaseAdmin.storage.from("resumes").createSignedUrl(app.resume_path, 1800);
		resumeUrl = signed?.signedUrl ?? null;
		resumeName = app.resume_path.split("/").pop() ?? "resume";
	}
	const { data: events } = await supabaseAdmin.from("application_status_events").select("from_status, to_status, created_at").eq("application_id", row.application_id).order("created_at", { ascending: true });
	return {
		ok: true,
		application: {
			full_name: app.full_name,
			role_applied: app.role_applied,
			status: app.status,
			submitted_at: app.created_at,
			updated_at: app.updated_at
		},
		resume: resumeUrl ? {
			url: resumeUrl,
			name: resumeName
		} : null,
		history: events ?? []
	};
});
function escapeHtml(s) {
	return s.replace(/[&<>"']/g, (c) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#39;"
	})[c]);
}
var lookupSchema = objectType({
	referenceId: stringType().trim().min(6).max(16),
	email: stringType().trim().email().max(255)
});
var lookupApplicationStatus_createServerFn_handler = createServerRpc({
	id: "6073a6d983ee0b203e87cf6e5f00dc89f97dd7d1361dcb0d4b9fb3755fd219bf",
	name: "lookupApplicationStatus",
	filename: "src/lib/portal.functions.ts"
}, (opts) => lookupApplicationStatus.__executeServer(opts));
var lookupApplicationStatus = createServerFn({ method: "POST" }).inputValidator((d) => lookupSchema.parse(d)).handler(lookupApplicationStatus_createServerFn_handler, async ({ data }) => {
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const ref = data.referenceId.trim().toLowerCase();
	const email = data.email.trim().toLowerCase();
	const { data: apps } = await supabaseAdmin.from("applications").select("id, full_name, role_applied, status, created_at, updated_at, email").ilike("email", email).filter("id::text", "ilike", `${ref}%`).limit(1);
	const app = apps?.[0];
	if (!app) return {
		ok: false,
		reason: "not_found"
	};
	const { data: events } = await supabaseAdmin.from("application_status_events").select("from_status, to_status, created_at").eq("application_id", app.id).order("created_at", { ascending: true });
	return {
		ok: true,
		application: {
			reference_id: app.id.slice(0, 8).toUpperCase(),
			full_name: app.full_name,
			role_applied: app.role_applied,
			status: app.status,
			submitted_at: app.created_at,
			updated_at: app.updated_at
		},
		history: events ?? []
	};
});
//#endregion
export { checkPortalToken_createServerFn_handler, lookupApplicationStatus_createServerFn_handler, requestPortalLink_createServerFn_handler };
