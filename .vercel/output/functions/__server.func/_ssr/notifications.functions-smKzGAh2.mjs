import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-D3CpJzOb.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notifications.functions-smKzGAh2.js
var listAdminNotifications_createServerFn_handler = createServerRpc({
	id: "6c11e80579f5328ad61b1e7f3901918e5785ddbd12b6c574b3368b761e7b70ee",
	name: "listAdminNotifications",
	filename: "src/lib/notifications.functions.ts"
}, (opts) => listAdminNotifications.__executeServer(opts));
var listAdminNotifications = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listAdminNotifications_createServerFn_handler, async ({ context }) => {
	const { data: isAdmin } = await context.supabase.rpc("has_role", {
		_user_id: context.userId,
		_role: "admin"
	});
	if (!isAdmin) throw new Error("Forbidden");
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { data, error } = await supabaseAdmin.from("admin_notifications").select("*").order("created_at", { ascending: false }).limit(50);
	if (error) throw new Error(error.message);
	return data ?? [];
});
var markReadSchema = objectType({ id: stringType().uuid() });
var markNotificationRead_createServerFn_handler = createServerRpc({
	id: "385e76cdf807dd53711b6f969d894db85cf9b0ca7a6373bb34c6352adedccb64",
	name: "markNotificationRead",
	filename: "src/lib/notifications.functions.ts"
}, (opts) => markNotificationRead.__executeServer(opts));
var markNotificationRead = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => markReadSchema.parse(d)).handler(markNotificationRead_createServerFn_handler, async ({ data, context }) => {
	const { data: isAdmin } = await context.supabase.rpc("has_role", {
		_user_id: context.userId,
		_role: "admin"
	});
	if (!isAdmin) throw new Error("Forbidden");
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { error } = await supabaseAdmin.from("admin_notifications").update({ is_read: true }).eq("id", data.id);
	if (error) throw new Error(error.message);
	return { ok: true };
});
var markAllNotificationsRead_createServerFn_handler = createServerRpc({
	id: "9450c15293c0a6ae5fe14448bd9f3e0ad58f596f22af371b91f88b98002e414b",
	name: "markAllNotificationsRead",
	filename: "src/lib/notifications.functions.ts"
}, (opts) => markAllNotificationsRead.__executeServer(opts));
var markAllNotificationsRead = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(markAllNotificationsRead_createServerFn_handler, async ({ context }) => {
	const { data: isAdmin } = await context.supabase.rpc("has_role", {
		_user_id: context.userId,
		_role: "admin"
	});
	if (!isAdmin) throw new Error("Forbidden");
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { error } = await supabaseAdmin.from("admin_notifications").update({ is_read: true }).eq("is_read", false);
	if (error) throw new Error(error.message);
	return { ok: true };
});
//#endregion
export { listAdminNotifications_createServerFn_handler, markAllNotificationsRead_createServerFn_handler, markNotificationRead_createServerFn_handler };
