import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "./@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "./@radix-ui/react-arrow+[...].mjs";
//#region node_modules/@react-email/img/dist/index.mjs
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var Img = import_react.forwardRef(({ alt, src, width, height, style, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
	...props,
	alt,
	height,
	ref,
	src,
	style: {
		display: "block",
		outline: "none",
		border: "none",
		textDecoration: "none",
		...style
	},
	width
}));
Img.displayName = "Img";
//#endregion
export { Img as t };
