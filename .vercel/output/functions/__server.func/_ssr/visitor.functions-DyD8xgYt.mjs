import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-D3CpJzOb.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/visitor.functions-DyD8xgYt.js
var incrementVisitorCount_createServerFn_handler = createServerRpc({
	id: "c60bc5f97e3ec48f6af983f940bb79c815a241744d46655d0f8fc288d95c54ce",
	name: "incrementVisitorCount",
	filename: "src/lib/visitor.functions.ts"
}, (opts) => incrementVisitorCount.__executeServer(opts));
var incrementVisitorCount = createServerFn({ method: "POST" }).handler(incrementVisitorCount_createServerFn_handler, async () => {
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { data: existing } = await supabaseAdmin.from("visitor_counts").select("count").eq("page_key", "home").maybeSingle();
	const currentCount = existing?.count ?? 0;
	const { data: row, error } = await supabaseAdmin.from("visitor_counts").upsert({
		page_key: "home",
		count: currentCount + 1
	}, { onConflict: "page_key" }).select("count").single();
	if (error) throw new Error(error.message);
	return { count: row.count };
});
var getVisitorCount_createServerFn_handler = createServerRpc({
	id: "b9c563618cf9b04a4aa7e20575c8f353cc17d38c107c77d367b1b0f3e6974705",
	name: "getVisitorCount",
	filename: "src/lib/visitor.functions.ts"
}, (opts) => getVisitorCount.__executeServer(opts));
var getVisitorCount = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getVisitorCount_createServerFn_handler, async ({ context }) => {
	const { data: isAdmin } = await context.supabase.rpc("has_role", {
		_user_id: context.userId,
		_role: "admin"
	});
	if (!isAdmin) throw new Error("Forbidden");
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { data, error } = await supabaseAdmin.from("visitor_counts").select("count").eq("page_key", "home").maybeSingle();
	if (error) throw new Error(error.message);
	return { count: data?.count ?? 0 };
});
//#endregion
export { getVisitorCount_createServerFn_handler, incrementVisitorCount_createServerFn_handler };
