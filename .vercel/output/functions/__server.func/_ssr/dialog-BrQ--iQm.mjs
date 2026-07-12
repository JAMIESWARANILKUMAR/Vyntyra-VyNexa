import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { B as ChevronUp, H as ChevronDown, U as Check, t as X } from "../_libs/lucide-react.mjs";
import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-D3CpJzOb.mjs";
import { t as createSsrRpc } from "./createSsrRpc-CuAasMYK.mjs";
import { a as numberType, i as literalType, n as booleanType, o as objectType, s as stringType, t as arrayType } from "../_libs/zod.mjs";
import { r as cn } from "./input-wipxj9S9.mjs";
import { a as DialogOverlay$1, i as DialogDescription$1, n as DialogClose, o as DialogPortal$1, r as DialogContent$1, s as DialogTitle$1, t as Dialog$1 } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { a as SelectItemIndicator, c as SelectPortal, d as SelectSeparator$1, f as SelectTrigger$1, i as SelectItem$1, l as SelectScrollDownButton$1, m as SelectViewport, n as SelectContent$1, o as SelectItemText, p as SelectValue$1, r as SelectIcon, s as SelectLabel$1, t as Select$1, u as SelectScrollUpButton$1 } from "../_libs/@radix-ui/react-select+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dialog-BrQ--iQm.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
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
var submitApplication = createServerFn({ method: "POST" }).inputValidator((data) => submitSchema.parse(data)).handler(createSsrRpc("0eb51b4df6b0d88ecdda68f490c97172a3b61b1cca7dcca9590a260f83d004f5"));
var deleteSchema = objectType({ id: stringType().uuid() });
var deleteApplication = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => deleteSchema.parse(d)).handler(createSsrRpc("f2230dc746209b9f8095d9c0f0a17af8ce01170d30958f46bd3d310800d7cb66"));
var listApplicationProjects = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("d042b33956b60126b2c8aaceb671e4819329365366ddac008d0c87913feef343"));
var listApplications = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("1e9e3b335f696f04224ab187fa3131a6d38970d9a29a8de98e16b829548176a3"));
var updateNotesSchema = objectType({
	id: stringType().uuid(),
	admin_notes: stringType().max(2e3)
});
var updateAdminNotes = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => updateNotesSchema.parse(d)).handler(createSsrRpc("f2c758cc35f3fb9455847d51deb45649892e063b91aaa3b851519171e88add34"));
var resumeSchema = objectType({ path: stringType().min(1) });
var getResumeSignedUrl = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => resumeSchema.parse(d)).handler(createSsrRpc("f9fd2fc96a19b437032795f5191b7b834c418dfd54b4ca43994afd1230e09582"));
var regenSchema = objectType({ id: stringType().uuid() });
var regenerateInterviewQuestions = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => regenSchema.parse(d)).handler(createSsrRpc("313712601da9721b31159a80693ec675a516672d28110d3004d18ac20aecdd6a"));
var getApplicationsOpen = createServerFn({ method: "GET" }).handler(createSsrRpc("33fb5e61488241cfa21bc975799a6caab1d93852d7df1f6a90bcf63728f534fa"));
var setApplicationsOpen = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ enabled: booleanType() }).parse(d)).handler(createSsrRpc("b1379872882ba93f15684bda1f29a1401ff455bd04b31860e9eeaeb43c5715c4"));
var listJobPostings = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("ba4aba33896db0b18e7cbb16a716b445c2a0f4463b3161f9d11b1b59071bd7cc"));
var createJobPostingSchema = objectType({
	title: stringType().trim().min(2).max(200),
	department: stringType().trim().min(1).max(120),
	location: stringType().trim().max(200).default("Remote"),
	type: stringType().trim().max(60).default("Full-time"),
	description: stringType().trim().min(10).max(5e3),
	requirements: stringType().trim().max(5e3).optional().or(literalType("")),
	salary_range: stringType().trim().max(100).optional().or(literalType(""))
});
var createJobPosting = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => createJobPostingSchema.parse(d)).handler(createSsrRpc("9b54b41c456da27f6b6d4023ed5ca1cf0fd53969a6af6e052eba82453be592ae"));
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
var updateJobPosting = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => updateJobPostingSchema.parse(d)).handler(createSsrRpc("cfe4749eb187c9daf52ed6c1a3dd8e195118a777da6e59c79060850c780dc9f9"));
var toggleJobPostingSchema = objectType({ id: stringType().uuid() });
var toggleJobPosting = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => toggleJobPostingSchema.parse(d)).handler(createSsrRpc("d2bd5bd4712c022272921c14893f862e4170325373e786a00467d84bc9193e1e"));
var deleteJobPostingSchema = objectType({ id: stringType().uuid() });
var deleteJobPosting = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => deleteJobPostingSchema.parse(d)).handler(createSsrRpc("2dea93df518ea9c608fce499c86f27df9a34bd918401580337aeba49bb401910"));
var listActiveJobPostings = createServerFn({ method: "GET" }).handler(createSsrRpc("71a7c688aab4cbbc8e71a1f1706b0942fedd7cc59e073d4b20c820aa18690063"));
var incrementVisitorCount = createServerFn({ method: "POST" }).handler(createSsrRpc("c60bc5f97e3ec48f6af983f940bb79c815a241744d46655d0f8fc288d95c54ce"));
var getVisitorCount = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("b9c563618cf9b04a4aa7e20575c8f353cc17d38c107c77d367b1b0f3e6974705"));
function InstallPwaButton({ className = "" }) {
	const [deferred, setDeferred] = (0, import_react.useState)(null);
	const [installed, setInstalled] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (typeof window === "undefined") return;
		if (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true) setInstalled(true);
		const onPrompt = (e) => {
			e.preventDefault();
			setDeferred(e);
		};
		const onInstalled = () => {
			setInstalled(true);
			setDeferred(null);
		};
		window.addEventListener("beforeinstallprompt", onPrompt);
		window.addEventListener("appinstalled", onInstalled);
		return () => {
			window.removeEventListener("beforeinstallprompt", onPrompt);
			window.removeEventListener("appinstalled", onInstalled);
		};
	}, []);
	if (installed || !deferred) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: async () => {
			try {
				await deferred.prompt();
				const { outcome } = await deferred.userChoice;
				if (outcome === "accepted") setInstalled(true);
				setDeferred(null);
			} catch {
				setDeferred(null);
			}
		},
		className: "inline-flex items-center gap-2 rounded-sm border border-gold/50 bg-gold/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gold hover:bg-gold/20 transition-colors " + className,
		"aria-label": "Install VyNexa App",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: "/favicon.png",
				alt: "VyNexa Logo",
				className: "h-3.5 w-3.5 object-contain rounded-sm"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "hidden sm:inline",
				children: "Install VyNexa App"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "sm:hidden",
				children: "Install"
			})
		]
	});
}
var Select = Select$1;
var SelectValue = SelectValue$1;
var SelectTrigger = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectTrigger$1, {
	ref,
	className: cn("flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectIcon, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4 opacity-50" })
	})]
}));
SelectTrigger.displayName = SelectTrigger$1.displayName;
var SelectScrollUpButton = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollUpButton$1, {
	ref,
	className: cn("flex cursor-default items-center justify-center py-1", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "h-4 w-4" })
}));
SelectScrollUpButton.displayName = SelectScrollUpButton$1.displayName;
var SelectScrollDownButton = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollDownButton$1, {
	ref,
	className: cn("flex cursor-default items-center justify-center py-1", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4" })
}));
SelectScrollDownButton.displayName = SelectScrollDownButton$1.displayName;
var SelectContent = import_react.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent$1, {
	ref,
	className: cn("relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-select-content-transform-origin)", position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className),
	position,
	...props,
	children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollUpButton, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectViewport, {
			className: cn("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"),
			children
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollDownButton, {})
	]
}) }));
SelectContent.displayName = SelectContent$1.displayName;
var SelectLabel = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectLabel$1, {
	ref,
	className: cn("px-2 py-1.5 text-sm font-semibold", className),
	...props
}));
SelectLabel.displayName = SelectLabel$1.displayName;
var SelectItem = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem$1, {
	ref,
	className: cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemText, { children })]
}));
SelectItem.displayName = SelectItem$1.displayName;
var SelectSeparator = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectSeparator$1, {
	ref,
	className: cn("-mx-1 my-1 h-px bg-muted", className),
	...props
}));
SelectSeparator.displayName = SelectSeparator$1.displayName;
var Dialog = Dialog$1;
var DialogPortal = DialogPortal$1;
var DialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
	ref,
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props
}));
DialogOverlay.displayName = DialogOverlay$1.displayName;
var DialogContent = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	})]
})] }));
DialogContent.displayName = DialogContent$1.displayName;
var DialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className),
	...props
});
DialogHeader.displayName = "DialogHeader";
var DialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
DialogFooter.displayName = "DialogFooter";
var DialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
	ref,
	className: cn("text-lg font-semibold leading-none tracking-tight", className),
	...props
}));
DialogTitle.displayName = DialogTitle$1.displayName;
var DialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
DialogDescription.displayName = DialogDescription$1.displayName;
//#endregion
export { listJobPostings as C, toggleJobPosting as D, submitApplication as E, updateAdminNotes as O, listApplications as S, setApplicationsOpen as T, getResumeSignedUrl as _, DialogHeader as a, listActiveJobPostings as b, Select as c, SelectTrigger as d, SelectValue as f, getApplicationsOpen as g, deleteJobPosting as h, DialogFooter as i, updateJobPosting as k, SelectContent as l, deleteApplication as m, DialogContent as n, DialogTitle as o, createJobPosting as p, DialogDescription as r, InstallPwaButton as s, Dialog as t, SelectItem as u, getVisitorCount as v, regenerateInterviewQuestions as w, listApplicationProjects as x, incrementVisitorCount as y };
