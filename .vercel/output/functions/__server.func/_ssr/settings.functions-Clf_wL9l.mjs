import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-D3CpJzOb.mjs";
import { n as booleanType, o as objectType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings.functions-Clf_wL9l.js
function publicClient() {
	return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, { auth: {
		storage: void 0,
		persistSession: false,
		autoRefreshToken: false
	} });
}
var getApplicationsOpen_createServerFn_handler = createServerRpc({
	id: "33fb5e61488241cfa21bc975799a6caab1d93852d7df1f6a90bcf63728f534fa",
	name: "getApplicationsOpen",
	filename: "src/lib/settings.functions.ts"
}, (opts) => getApplicationsOpen.__executeServer(opts));
var getApplicationsOpen = createServerFn({ method: "GET" }).handler(getApplicationsOpen_createServerFn_handler, async () => {
	const { data, error } = await publicClient().from("site_settings").select("value").eq("key", "applications_open").maybeSingle();
	if (error) return { enabled: true };
	return { enabled: (data?.value ?? {}).enabled !== false };
});
var setApplicationsOpen_createServerFn_handler = createServerRpc({
	id: "b1379872882ba93f15684bda1f29a1401ff455bd04b31860e9eeaeb43c5715c4",
	name: "setApplicationsOpen",
	filename: "src/lib/settings.functions.ts"
}, (opts) => setApplicationsOpen.__executeServer(opts));
var setApplicationsOpen = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ enabled: booleanType() }).parse(d)).handler(setApplicationsOpen_createServerFn_handler, async ({ data, context }) => {
	const { data: isAdmin, error: rErr } = await context.supabase.rpc("has_role", {
		_user_id: context.userId,
		_role: "admin"
	});
	if (rErr) throw new Error(rErr.message);
	if (!isAdmin) throw new Error("Forbidden");
	const { error } = await context.supabase.from("site_settings").upsert({
		key: "applications_open",
		value: { enabled: data.enabled },
		updated_at: (/* @__PURE__ */ new Date()).toISOString(),
		updated_by: context.userId
	}, { onConflict: "key" });
	if (error) throw new Error(error.message);
	return { enabled: data.enabled };
});
//#endregion
export { getApplicationsOpen_createServerFn_handler, setApplicationsOpen_createServerFn_handler };
