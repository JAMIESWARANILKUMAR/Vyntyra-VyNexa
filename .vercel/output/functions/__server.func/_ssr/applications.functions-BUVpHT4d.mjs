import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-D3CpJzOb.mjs";
import { a as numberType, i as literalType, o as objectType, s as stringType, t as arrayType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/applications.functions-BUVpHT4d.js
var projectSchema = objectType({
	title: stringType().trim().min(1).max(200),
	summary: stringType().trim().min(1).max(3e3),
	project_url: stringType().trim().max(500).optional().or(literalType("")),
	document_path: stringType().trim().max(500).optional().or(literalType(""))
});
var submitSchema = objectType({
	full_name: stringType().trim().min(2).max(120),
	email: stringType().trim().email().max(255),
	phone: stringType().trim().min(6).max(30),
	role_applied: stringType().trim().min(1).max(120),
	message: stringType().trim().max(2e3).optional().or(literalType("")),
	company: stringType().trim().max(160).optional().or(literalType("")),
	position: stringType().trim().max(160).optional().or(literalType("")),
	linkedin_url: stringType().trim().max(300).optional().or(literalType("")),
	years_experience: stringType().trim().max(40).optional().or(literalType("")),
	portfolio_url: stringType().trim().max(300).optional().or(literalType("")),
	availability: stringType().trim().max(120).optional().or(literalType("")),
	resume_path: stringType().trim().max(500).optional().or(literalType("")),
	job_posting_id: stringType().uuid().optional().nullable(),
	state: stringType().trim().max(80).optional().or(literalType("")),
	college: stringType().trim().max(240).optional().or(literalType("")),
	graduation_year: numberType().int().min(2022).max(2035).optional().nullable(),
	hod_name: stringType().trim().max(160).optional().or(literalType("")),
	hod_contact: stringType().trim().max(40).optional().or(literalType("")),
	hod_email: stringType().trim().max(255).optional().or(literalType("")),
	tp_officer_name: stringType().trim().max(160).optional().or(literalType("")),
	tp_officer_contact: stringType().trim().max(40).optional().or(literalType("")),
	tp_officer_email: stringType().trim().max(255).optional().or(literalType("")),
	projects: arrayType(projectSchema).max(30).optional(),
	agreement_accepted: literalType(true)
});
var submitApplication_createServerFn_handler = createServerRpc({
	id: "0eb51b4df6b0d88ecdda68f490c97172a3b61b1cca7dcca9590a260f83d004f5",
	name: "submitApplication",
	filename: "src/lib/applications.functions.ts"
}, (opts) => submitApplication.__executeServer(opts));
var submitApplication = createServerFn({ method: "POST" }).inputValidator((data) => submitSchema.parse(data)).handler(submitApplication_createServerFn_handler, async ({ data }) => {
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { data: setting } = await supabaseAdmin.from("site_settings").select("value").eq("key", "applications_open").maybeSingle();
	if (!((setting?.value ?? {}).enabled !== false)) throw new Error("Applications are currently closed. Please check back soon.");
	const insert = {
		full_name: data.full_name,
		email: data.email.toLowerCase(),
		phone: data.phone,
		role_applied: data.role_applied,
		message: data.message || null,
		company: data.company || null,
		position: data.position || null,
		linkedin_url: data.linkedin_url || null,
		years_experience: data.years_experience || null,
		portfolio_url: data.portfolio_url || null,
		availability: data.availability || null,
		resume_path: data.resume_path || null,
		job_posting_id: data.job_posting_id || null,
		state: data.state || null,
		college: data.college || null,
		graduation_year: data.graduation_year ?? null,
		hod_name: data.hod_name || null,
		hod_contact: data.hod_contact || null,
		hod_email: data.hod_email ? data.hod_email.toLowerCase() : null,
		tp_officer_name: data.tp_officer_name || null,
		tp_officer_contact: data.tp_officer_contact || null,
		tp_officer_email: data.tp_officer_email ? data.tp_officer_email.toLowerCase() : null,
		agreement_accepted: true
	};
	const { data: row, error } = await supabaseAdmin.from("applications").insert(insert).select("id").single();
	if (error) throw new Error(error.message);
	try {
		const { insertNotification } = await import("./notifications.functions-D3FFpz8h.mjs");
		await insertNotification({
			type: "new_application",
			title: "New Application Received",
			message: `${data.full_name} applied for ${data.role_applied}`,
			metadata: {
				applicationId: row.id,
				email: data.email,
				role: data.role_applied
			}
		});
	} catch (e) {
		console.warn("[applications] notification insert skipped:", e?.message);
	}
	if (data.projects && data.projects.length) {
		const rows = data.projects.map((p) => ({
			application_id: row.id,
			title: p.title,
			summary: p.summary,
			project_url: p.project_url || null,
			document_path: p.document_path || null
		}));
		const { error: pErr } = await supabaseAdmin.from("application_projects").insert(rows);
		if (pErr) console.warn("[applications] project insert skipped:", pErr.message);
	}
	try {
		const { notifyAdminOfApplication } = await import("./notify.server-B6OmPXyz.mjs");
		await notifyAdminOfApplication({
			applicationId: row.id,
			fullName: data.full_name,
			email: data.email,
			phone: data.phone,
			roleApplied: data.role_applied,
			hasResume: !!data.resume_path
		});
	} catch (e) {
		console.warn("[applications] email notify skipped:", e?.message);
	}
	try {
		const { generateInterviewQuestions } = await import("./interview-questions.server-DdvLTJFZ.mjs");
		await generateInterviewQuestions({
			applicationId: row.id,
			resumePath: data.resume_path || null,
			roleApplied: data.role_applied,
			fullName: data.full_name,
			yearsExperience: data.years_experience
		});
	} catch (e) {
		console.warn("[applications] AI questions skipped:", e?.message);
	}
	return { id: row.id };
});
var deleteSchema = objectType({ id: stringType().uuid() });
var deleteApplication_createServerFn_handler = createServerRpc({
	id: "f2230dc746209b9f8095d9c0f0a17af8ce01170d30958f46bd3d310800d7cb66",
	name: "deleteApplication",
	filename: "src/lib/applications.functions.ts"
}, (opts) => deleteApplication.__executeServer(opts));
var deleteApplication = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => deleteSchema.parse(d)).handler(deleteApplication_createServerFn_handler, async ({ data, context }) => {
	const { data: isAdmin } = await context.supabase.rpc("has_role", {
		_user_id: context.userId,
		_role: "admin"
	});
	if (!isAdmin) throw new Error("Forbidden");
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { error } = await supabaseAdmin.from("applications").delete().eq("id", data.id);
	if (error) throw new Error(error.message);
	return { ok: true };
});
var listApplicationProjects_createServerFn_handler = createServerRpc({
	id: "d042b33956b60126b2c8aaceb671e4819329365366ddac008d0c87913feef343",
	name: "listApplicationProjects",
	filename: "src/lib/applications.functions.ts"
}, (opts) => listApplicationProjects.__executeServer(opts));
var listApplicationProjects = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(listApplicationProjects_createServerFn_handler, async ({ data, context }) => {
	const { data: isAdmin } = await context.supabase.rpc("has_role", {
		_user_id: context.userId,
		_role: "admin"
	});
	if (!isAdmin) throw new Error("Forbidden");
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { data: rows, error } = await supabaseAdmin.from("application_projects").select("*").eq("application_id", data.id).order("created_at", { ascending: true });
	if (error) throw new Error(error.message);
	return await Promise.all((rows ?? []).map(async (r) => {
		if (!r.document_path) return {
			...r,
			document_url: null
		};
		const { data: s } = await supabaseAdmin.storage.from("project-docs").createSignedUrl(r.document_path, 600);
		return {
			...r,
			document_url: s?.signedUrl ?? null
		};
	}));
});
var listApplications_createServerFn_handler = createServerRpc({
	id: "1e9e3b335f696f04224ab187fa3131a6d38970d9a29a8de98e16b829548176a3",
	name: "listApplications",
	filename: "src/lib/applications.functions.ts"
}, (opts) => listApplications.__executeServer(opts));
var listApplications = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listApplications_createServerFn_handler, async ({ context }) => {
	const { data: isAdmin } = await context.supabase.rpc("has_role", {
		_user_id: context.userId,
		_role: "admin"
	});
	if (!isAdmin) throw new Error("Forbidden");
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { data, error } = await supabaseAdmin.from("applications").select("*").order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	return data ?? [];
});
var updateNotesSchema = objectType({
	id: stringType().uuid(),
	admin_notes: stringType().max(2e3)
});
var updateAdminNotes_createServerFn_handler = createServerRpc({
	id: "f2c758cc35f3fb9455847d51deb45649892e063b91aaa3b851519171e88add34",
	name: "updateAdminNotes",
	filename: "src/lib/applications.functions.ts"
}, (opts) => updateAdminNotes.__executeServer(opts));
var updateAdminNotes = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => updateNotesSchema.parse(d)).handler(updateAdminNotes_createServerFn_handler, async ({ data, context }) => {
	const { data: isAdmin } = await context.supabase.rpc("has_role", {
		_user_id: context.userId,
		_role: "admin"
	});
	if (!isAdmin) throw new Error("Forbidden");
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { error } = await supabaseAdmin.from("applications").update({ admin_notes: data.admin_notes || null }).eq("id", data.id);
	if (error) throw new Error(error.message);
	return { ok: true };
});
var resumeSchema = objectType({ path: stringType().min(1) });
var getResumeSignedUrl_createServerFn_handler = createServerRpc({
	id: "f9fd2fc96a19b437032795f5191b7b834c418dfd54b4ca43994afd1230e09582",
	name: "getResumeSignedUrl",
	filename: "src/lib/applications.functions.ts"
}, (opts) => getResumeSignedUrl.__executeServer(opts));
var getResumeSignedUrl = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => resumeSchema.parse(d)).handler(getResumeSignedUrl_createServerFn_handler, async ({ data, context }) => {
	const { data: isAdmin } = await context.supabase.rpc("has_role", {
		_user_id: context.userId,
		_role: "admin"
	});
	if (!isAdmin) throw new Error("Forbidden");
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { data: signed, error } = await supabaseAdmin.storage.from("resumes").createSignedUrl(data.path, 600);
	if (error) throw new Error(error.message);
	return { url: signed.signedUrl };
});
var regenSchema = objectType({ id: stringType().uuid() });
var regenerateInterviewQuestions_createServerFn_handler = createServerRpc({
	id: "313712601da9721b31159a80693ec675a516672d28110d3004d18ac20aecdd6a",
	name: "regenerateInterviewQuestions",
	filename: "src/lib/applications.functions.ts"
}, (opts) => regenerateInterviewQuestions.__executeServer(opts));
var regenerateInterviewQuestions = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => regenSchema.parse(d)).handler(regenerateInterviewQuestions_createServerFn_handler, async ({ data, context }) => {
	const { data: isAdmin } = await context.supabase.rpc("has_role", {
		_user_id: context.userId,
		_role: "admin"
	});
	if (!isAdmin) throw new Error("Forbidden");
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { data: app, error } = await supabaseAdmin.from("applications").select("id, full_name, role_applied, resume_path, years_experience").eq("id", data.id).single();
	if (error || !app) throw new Error(error?.message || "Not found");
	const { generateInterviewQuestions } = await import("./interview-questions.server-DdvLTJFZ.mjs");
	return { text: await generateInterviewQuestions({
		applicationId: app.id,
		resumePath: app.resume_path,
		roleApplied: app.role_applied,
		fullName: app.full_name,
		yearsExperience: app.years_experience
	}) };
});
//#endregion
export { deleteApplication_createServerFn_handler, getResumeSignedUrl_createServerFn_handler, listApplicationProjects_createServerFn_handler, listApplications_createServerFn_handler, regenerateInterviewQuestions_createServerFn_handler, submitApplication_createServerFn_handler, updateAdminNotes_createServerFn_handler };
