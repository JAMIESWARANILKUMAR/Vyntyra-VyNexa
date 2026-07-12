import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-D3CpJzOb.mjs";
import { t as createSsrRpc } from "./createSsrRpc-CuAasMYK.mjs";
import { n as booleanType, o as objectType, r as enumType, s as stringType } from "../_libs/zod.mjs";
import { r as cn } from "./input-wipxj9S9.mjs";
import { n as SwitchThumb, t as Switch$1 } from "../_libs/radix-ui__react-switch.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/workflow.functions-DjUu9rSs.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Switch = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch$1, {
	className: cn("peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input", className),
	...props,
	ref,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchThumb, { className: cn("pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0") })
}));
Switch.displayName = Switch$1.displayName;
var ALLOWED_TRANSITIONS = {
	new: ["reviewing", "rejected"],
	reviewing: ["shortlisted", "rejected"],
	shortlisted: ["hired", "rejected"],
	rejected: [],
	hired: []
};
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
var changeApplicationStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => changeSchema.parse(d)).handler(createSsrRpc("c112c62f0e21c423d830f79554ba7d95bbfffea9b500b3d1f9bb7658c986bd17"));
var listEventsSchema = objectType({ applicationId: stringType().uuid() });
var listStatusEvents = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => listEventsSchema.parse(d)).handler(createSsrRpc("0e76d63bf07de5248afa8034a8c85ca24649a9c5289b9b0901c7d2b08e322c79"));
var listStatusTemplates = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("badb8e6514eb83d0d2ce8ef7e3f70156f3c1ffd2d7dcd9d775b3b65219ed3b35"));
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
var updateStatusTemplate = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => updateTplSchema.parse(d)).handler(createSsrRpc("3f9110fc21809952bbcfa1e59f9116c92e7383123306f0f9ad20c232a1161a29"));
//#endregion
export { listStatusTemplates as a, listStatusEvents as i, Switch as n, updateStatusTemplate as o, changeApplicationStatus as r, ALLOWED_TRANSITIONS as t };
