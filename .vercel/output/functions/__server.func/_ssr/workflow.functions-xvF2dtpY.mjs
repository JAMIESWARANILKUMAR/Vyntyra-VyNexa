import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { n as getRequestHeader } from "./request-response-BDiR3rEX.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-D3CpJzOb.mjs";
import { n as booleanType, o as objectType, r as enumType, s as stringType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/workflow.functions-xvF2dtpY.js
var ALLOWED_TRANSITIONS = {
	new: ["reviewing", "rejected"],
	reviewing: ["shortlisted", "rejected"],
	shortlisted: ["hired", "rejected"],
	rejected: [],
	hired: []
};
function isAllowed(from, to) {
	if (from === to) return true;
	return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
async function ensureAdmin(ctx) {
	const { data: isAdmin, error } = await ctx.supabase.rpc("has_role", {
		_user_id: ctx.userId,
		_role: "admin"
	});
	if (error) throw new Error(error.message);
	if (!isAdmin) throw new Error("Forbidden");
}
function originFromRequest() {
	const forwardedProto = getRequestHeader("x-forwarded-proto") || "https";
	const forwardedHost = getRequestHeader("x-forwarded-host") || getRequestHeader("host") || "";
	if (!forwardedHost) return "";
	return `${forwardedProto}://${forwardedHost}`;
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
var changeSchema = objectType({
	id: stringType().uuid(),
	status: enumType([
		"new",
		"reviewing",
		"shortlisted",
		"rejected",
		"hired"
	]),
	note: stringType().trim().min(3, "Note is required (min 3 chars)").max(2e3)
});
var changeApplicationStatus_createServerFn_handler = createServerRpc({
	id: "c112c62f0e21c423d830f79554ba7d95bbfffea9b500b3d1f9bb7658c986bd17",
	name: "changeApplicationStatus",
	filename: "src/lib/workflow.functions.ts"
}, (opts) => changeApplicationStatus.__executeServer(opts));
var changeApplicationStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => changeSchema.parse(d)).handler(changeApplicationStatus_createServerFn_handler, async ({ data, context }) => {
	await ensureAdmin(context);
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { data: app, error: fetchErr } = await supabaseAdmin.from("applications").select("id, full_name, email, role_applied, status").eq("id", data.id).single();
	if (fetchErr || !app) throw new Error(fetchErr?.message || "Application not found");
	const from = app.status;
	const to = data.status;
	if (!isAllowed(from, to)) throw new Error(`Invalid transition: ${from} → ${to}`);
	if (from !== to) {
		const { error: updateErr } = await supabaseAdmin.from("applications").update({ status: to }).eq("id", data.id);
		if (updateErr) throw new Error(updateErr.message);
		const { error: eventErr } = await supabaseAdmin.from("application_status_events").insert({
			application_id: data.id,
			from_status: from,
			to_status: to,
			note: data.note,
			changed_by: context.userId
		});
		if (eventErr) throw new Error(eventErr.message);
		try {
			const { insertNotification } = await import("./notifications.functions-D3FFpz8h.mjs");
			await insertNotification({
				type: "status_change",
				title: "Application Status Changed",
				message: `${app.full_name} (${app.role_applied}): ${from} → ${to}`,
				metadata: {
					applicationId: data.id,
					from,
					to,
					name: app.full_name
				}
			});
		} catch (e) {
			console.warn("[workflow] notification insert skipped:", e.message);
		}
		try {
			const token = randomToken();
			const tokenHash = await sha256Hex(token);
			const expiresAt = new Date(Date.now() + 1800 * 1e3).toISOString();
			await supabaseAdmin.from("applicant_access_tokens").insert({
				application_id: data.id,
				token_hash: tokenHash,
				expires_at: expiresAt
			});
			const origin = originFromRequest();
			const portalLink = origin ? `${origin}/status/${token}` : `/status/${token}`;
			const { data: tpl } = await supabaseAdmin.from("status_email_templates").select("subject, html_body, enabled").eq("status", to).single();
			if (tpl?.enabled) {
				const { sendStatusChangeEmail } = await import("./status-email.server-CfeTd2K4.mjs");
				await sendStatusChangeEmail({
					toEmail: app.email,
					fullName: app.full_name,
					roleApplied: app.role_applied,
					status: to,
					applicationId: data.id,
					portalLink,
					template: {
						subject: tpl.subject,
						html_body: tpl.html_body
					},
					idempotencyKey: `status-${data.id}-${to}-${Date.now()}`
				});
				try {
					const { insertNotification } = await import("./notifications.functions-D3FFpz8h.mjs");
					await insertNotification({
						type: "email_sent",
						title: "Status Email Sent",
						message: `Email sent to ${app.full_name} (${app.email}) — status: ${to}`,
						metadata: {
							applicationId: data.id,
							email: app.email,
							status: to
						}
					});
				} catch (e) {
					console.warn("[workflow] email notification skipped:", e.message);
				}
			}
		} catch (e) {
			console.warn("[workflow] email/token skipped:", e.message);
		}
	} else {
		const { error: eventErr } = await supabaseAdmin.from("application_status_events").insert({
			application_id: data.id,
			from_status: from,
			to_status: to,
			note: data.note,
			changed_by: context.userId
		});
		if (eventErr) throw new Error(eventErr.message);
	}
	return { ok: true };
});
var listEventsSchema = objectType({ applicationId: stringType().uuid() });
var listStatusEvents_createServerFn_handler = createServerRpc({
	id: "0e76d63bf07de5248afa8034a8c85ca24649a9c5289b9b0901c7d2b08e322c79",
	name: "listStatusEvents",
	filename: "src/lib/workflow.functions.ts"
}, (opts) => listStatusEvents.__executeServer(opts));
var listStatusEvents = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => listEventsSchema.parse(d)).handler(listStatusEvents_createServerFn_handler, async ({ data, context }) => {
	await ensureAdmin(context);
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { data: rows, error } = await supabaseAdmin.from("application_status_events").select("id, from_status, to_status, note, created_at, changed_by").eq("application_id", data.applicationId).order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	return rows ?? [];
});
var listStatusTemplates_createServerFn_handler = createServerRpc({
	id: "badb8e6514eb83d0d2ce8ef7e3f70156f3c1ffd2d7dcd9d775b3b65219ed3b35",
	name: "listStatusTemplates",
	filename: "src/lib/workflow.functions.ts"
}, (opts) => listStatusTemplates.__executeServer(opts));
var listStatusTemplates = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listStatusTemplates_createServerFn_handler, async ({ context }) => {
	await ensureAdmin(context);
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { data, error } = await supabaseAdmin.from("status_email_templates").select("*").order("status");
	if (error) throw new Error(error.message);
	return data ?? [];
});
var updateTplSchema = objectType({
	status: enumType([
		"new",
		"reviewing",
		"shortlisted",
		"rejected",
		"hired"
	]),
	subject: stringType().trim().min(3).max(200),
	html_body: stringType().trim().min(10).max(2e4),
	enabled: booleanType()
});
var updateStatusTemplate_createServerFn_handler = createServerRpc({
	id: "3f9110fc21809952bbcfa1e59f9116c92e7383123306f0f9ad20c232a1161a29",
	name: "updateStatusTemplate",
	filename: "src/lib/workflow.functions.ts"
}, (opts) => updateStatusTemplate.__executeServer(opts));
var updateStatusTemplate = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => updateTplSchema.parse(d)).handler(updateStatusTemplate_createServerFn_handler, async ({ data, context }) => {
	await ensureAdmin(context);
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { error } = await supabaseAdmin.from("status_email_templates").update({
		subject: data.subject,
		html_body: data.html_body,
		enabled: data.enabled,
		updated_by: context.userId
	}).eq("status", data.status);
	if (error) throw new Error(error.message);
	return { ok: true };
});
//#endregion
export { changeApplicationStatus_createServerFn_handler, listStatusEvents_createServerFn_handler, listStatusTemplates_createServerFn_handler, updateStatusTemplate_createServerFn_handler };
