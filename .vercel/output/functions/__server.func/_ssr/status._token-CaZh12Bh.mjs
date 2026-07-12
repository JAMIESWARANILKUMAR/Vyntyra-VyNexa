import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/status._token-CaZh12Bh.js
var $$splitComponentImporter = () => import("./status._token-B7dHbCqd.mjs");
var Route = createFileRoute("/status/$token")({
	ssr: false,
	head: () => ({ meta: [{ title: "Application Status — Vyntyra Careers" }, {
		name: "robots",
		content: "noindex"
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
