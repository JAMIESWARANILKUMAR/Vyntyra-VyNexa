import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as createSsrRpc } from "./createSsrRpc-CuAasMYK.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/portal.functions-Bho1JBSc.js
var requestSchema = objectType({ email: stringType().trim().email().max(255) });
var requestPortalLink = createServerFn({ method: "POST" }).inputValidator((d) => requestSchema.parse(d)).handler(createSsrRpc("e563446df7e4eb9c1e0c43b354bc4a2dd381062c625fdccaa270ce07aa82ffe4"));
var checkSchema = objectType({ token: stringType().trim().min(32).max(128) });
var checkPortalToken = createServerFn({ method: "POST" }).inputValidator((d) => checkSchema.parse(d)).handler(createSsrRpc("1a74851ae317b569d03fc7ae2132700e1bcb80eba5f523d0d16814da7a4a9171"));
var lookupSchema = objectType({
	referenceId: stringType().trim().min(6).max(16),
	email: stringType().trim().email().max(255)
});
var lookupApplicationStatus = createServerFn({ method: "POST" }).inputValidator((d) => lookupSchema.parse(d)).handler(createSsrRpc("6073a6d983ee0b203e87cf6e5f00dc89f97dd7d1361dcb0d4b9fb3755fd219bf"));
//#endregion
export { lookupApplicationStatus as n, requestPortalLink as r, checkPortalToken as t };
