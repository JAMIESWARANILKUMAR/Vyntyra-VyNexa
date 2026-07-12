import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-D3CpJzOb.mjs";
import { i as literalType, o as objectType, s as stringType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/job-postings.functions-D8XxCZBf.js
function publicClient() {
	return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, { auth: {
		storage: void 0,
		persistSession: false,
		autoRefreshToken: false
	} });
}
var listJobPostings_createServerFn_handler = createServerRpc({
	id: "ba4aba33896db0b18e7cbb16a716b445c2a0f4463b3161f9d11b1b59071bd7cc",
	name: "listJobPostings",
	filename: "src/lib/job-postings.functions.ts"
}, (opts) => listJobPostings.__executeServer(opts));
var listJobPostings = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listJobPostings_createServerFn_handler, async ({ context }) => {
	const { data: isAdmin } = await context.supabase.rpc("has_role", {
		_user_id: context.userId,
		_role: "admin"
	});
	if (!isAdmin) throw new Error("Forbidden");
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { data, error } = await supabaseAdmin.from("job_postings").select("*").order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	return data ?? [];
});
var createJobPostingSchema = objectType({
	title: stringType().trim().min(2).max(200),
	department: stringType().trim().min(1).max(120),
	location: stringType().trim().max(200).default("Remote"),
	type: stringType().trim().max(60).default("Full-time"),
	description: stringType().trim().min(10).max(5e3),
	requirements: stringType().trim().max(5e3).optional().or(literalType("")),
	salary_range: stringType().trim().max(100).optional().or(literalType(""))
});
var createJobPosting_createServerFn_handler = createServerRpc({
	id: "9b54b41c456da27f6b6d4023ed5ca1cf0fd53969a6af6e052eba82453be592ae",
	name: "createJobPosting",
	filename: "src/lib/job-postings.functions.ts"
}, (opts) => createJobPosting.__executeServer(opts));
var createJobPosting = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => createJobPostingSchema.parse(d)).handler(createJobPosting_createServerFn_handler, async ({ data, context }) => {
	const { data: isAdmin } = await context.supabase.rpc("has_role", {
		_user_id: context.userId,
		_role: "admin"
	});
	if (!isAdmin) throw new Error("Forbidden");
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { data: row, error } = await supabaseAdmin.from("job_postings").insert({
		title: data.title,
		department: data.department,
		location: data.location,
		type: data.type,
		description: data.description,
		requirements: data.requirements || null,
		salary_range: data.salary_range || null,
		created_by: context.userId
	}).select("id").single();
	if (error) throw new Error(error.message);
	return { id: row.id };
});
var updateJobPostingSchema = objectType({
	id: stringType().uuid(),
	title: stringType().trim().min(2).max(200),
	department: stringType().trim().min(1).max(120),
	location: stringType().trim().max(200).default("Remote"),
	type: stringType().trim().max(60).default("Full-time"),
	description: stringType().trim().min(10).max(5e3),
	requirements: stringType().trim().max(5e3).optional().or(literalType("")),
	salary_range: stringType().trim().max(100).optional().or(literalType(""))
});
var updateJobPosting_createServerFn_handler = createServerRpc({
	id: "cfe4749eb187c9daf52ed6c1a3dd8e195118a777da6e59c79060850c780dc9f9",
	name: "updateJobPosting",
	filename: "src/lib/job-postings.functions.ts"
}, (opts) => updateJobPosting.__executeServer(opts));
var updateJobPosting = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => updateJobPostingSchema.parse(d)).handler(updateJobPosting_createServerFn_handler, async ({ data, context }) => {
	const { data: isAdmin } = await context.supabase.rpc("has_role", {
		_user_id: context.userId,
		_role: "admin"
	});
	if (!isAdmin) throw new Error("Forbidden");
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { error } = await supabaseAdmin.from("job_postings").update({
		title: data.title,
		department: data.department,
		location: data.location,
		type: data.type,
		description: data.description,
		requirements: data.requirements || null,
		salary_range: data.salary_range || null
	}).eq("id", data.id);
	if (error) throw new Error(error.message);
	return { ok: true };
});
var toggleJobPostingSchema = objectType({ id: stringType().uuid() });
var toggleJobPosting_createServerFn_handler = createServerRpc({
	id: "d2bd5bd4712c022272921c14893f862e4170325373e786a00467d84bc9193e1e",
	name: "toggleJobPosting",
	filename: "src/lib/job-postings.functions.ts"
}, (opts) => toggleJobPosting.__executeServer(opts));
var toggleJobPosting = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => toggleJobPostingSchema.parse(d)).handler(toggleJobPosting_createServerFn_handler, async ({ data, context }) => {
	const { data: isAdmin } = await context.supabase.rpc("has_role", {
		_user_id: context.userId,
		_role: "admin"
	});
	if (!isAdmin) throw new Error("Forbidden");
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { data: row, error: fetchErr } = await supabaseAdmin.from("job_postings").select("id, is_active").eq("id", data.id).single();
	if (fetchErr || !row) throw new Error(fetchErr?.message || "Not found");
	const newActive = !row.is_active;
	const { error } = await supabaseAdmin.from("job_postings").update({ is_active: newActive }).eq("id", data.id);
	if (error) throw new Error(error.message);
	return {
		id: data.id,
		is_active: newActive
	};
});
var deleteJobPostingSchema = objectType({ id: stringType().uuid() });
var deleteJobPosting_createServerFn_handler = createServerRpc({
	id: "2dea93df518ea9c608fce499c86f27df9a34bd918401580337aeba49bb401910",
	name: "deleteJobPosting",
	filename: "src/lib/job-postings.functions.ts"
}, (opts) => deleteJobPosting.__executeServer(opts));
var deleteJobPosting = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => deleteJobPostingSchema.parse(d)).handler(deleteJobPosting_createServerFn_handler, async ({ data, context }) => {
	const { data: isAdmin } = await context.supabase.rpc("has_role", {
		_user_id: context.userId,
		_role: "admin"
	});
	if (!isAdmin) throw new Error("Forbidden");
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { error } = await supabaseAdmin.from("job_postings").delete().eq("id", data.id);
	if (error) throw new Error(error.message);
	return { ok: true };
});
var listActiveJobPostings_createServerFn_handler = createServerRpc({
	id: "71a7c688aab4cbbc8e71a1f1706b0942fedd7cc59e073d4b20c820aa18690063",
	name: "listActiveJobPostings",
	filename: "src/lib/job-postings.functions.ts"
}, (opts) => listActiveJobPostings.__executeServer(opts));
var listActiveJobPostings = createServerFn({ method: "GET" }).handler(listActiveJobPostings_createServerFn_handler, async () => {
	const { data, error } = await publicClient().from("job_postings").select("id, title, department, location, type, description, requirements").eq("is_active", true).order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	return data ?? [];
});
//#endregion
export { createJobPosting_createServerFn_handler, deleteJobPosting_createServerFn_handler, listActiveJobPostings_createServerFn_handler, listJobPostings_createServerFn_handler, toggleJobPosting_createServerFn_handler, updateJobPosting_createServerFn_handler };
