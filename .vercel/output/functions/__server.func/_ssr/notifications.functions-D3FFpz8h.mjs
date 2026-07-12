import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-D3CpJzOb.mjs";
import { t as createSsrRpc } from "./createSsrRpc-CuAasMYK.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notifications.functions-D3FFpz8h.js
var listAdminNotifications = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("6c11e80579f5328ad61b1e7f3901918e5785ddbd12b6c574b3368b761e7b70ee"));
var markReadSchema = objectType({ id: stringType().uuid() });
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => markReadSchema.parse(d)).handler(createSsrRpc("385e76cdf807dd53711b6f969d894db85cf9b0ca7a6373bb34c6352adedccb64"));
var markAllNotificationsRead = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("9450c15293c0a6ae5fe14448bd9f3e0ad58f596f22af371b91f88b98002e414b"));
async function insertNotification(params) {
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { error } = await supabaseAdmin.from("admin_notifications").insert({
		type: params.type,
		title: params.title,
		message: params.message,
		metadata: params.metadata ?? null
	});
	if (error) {
		console.warn("[notifications] insert failed:", error.message);
		throw new Error(error.message);
	}
}
//#endregion
export { insertNotification, listAdminNotifications, markAllNotificationsRead };
