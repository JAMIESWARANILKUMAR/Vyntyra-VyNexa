import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as WorldClocks } from "./world-clocks-EszHW3xk.mjs";
import { C as Hash, I as Clock, R as CircleCheck, _ as Mail, b as LoaderCircle, z as CircleAlert } from "../_libs/lucide-react.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as useServerFn } from "./useServerFn-CrZF2pjq.mjs";
import { n as Input, t as Button } from "./input-wipxj9S9.mjs";
import { t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as lookupApplicationStatus } from "./portal.functions-Bho1JBSc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/track-1OKB-Ml5.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STATUS_LABEL = {
	new: "Received",
	reviewing: "Under Review",
	shortlisted: "Shortlisted",
	rejected: "Not Selected",
	hired: "Hired"
};
var STATUS_STYLE = {
	new: "bg-secondary/10 text-secondary border-secondary/30",
	reviewing: "bg-gold/15 text-gold-foreground border-gold/40",
	shortlisted: "bg-emerald-50 text-emerald-800 border-emerald-300",
	rejected: "bg-destructive/10 text-destructive border-destructive/30",
	hired: "bg-primary text-primary-foreground border-primary"
};
function TrackPage() {
	const lookup = useServerFn(lookupApplicationStatus);
	const [referenceId, setReferenceId] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const mut = useMutation({
		mutationFn: () => lookup({ data: {
			referenceId,
			email
		} }),
		onError: (e) => toast.error(e.message)
	});
	const data = mut.data;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background flex flex-col",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "border-b border-border bg-card",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto w-full max-w-5xl px-4 sm:px-6 h-14 sm:h-16 flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: "/favicon.png",
					alt: "Vyntyra",
					className: "h-8 sm:h-10 w-auto"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border-l border-border pl-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm font-semibold text-primary leading-none",
						children: "Vyntyra Careers"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[10px] uppercase tracking-widest text-muted-foreground mt-1",
						children: "Track Application"
					})]
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "flex-1 px-4 sm:px-6 py-8 sm:py-16",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto w-full max-w-3xl space-y-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorldClocks, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-border bg-card p-6 sm:p-8 shadow-corp",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-serif text-xl sm:text-2xl font-bold text-primary",
								children: "Track your application"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted-foreground mt-2",
								children: [
									"Enter the ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Reference ID" }),
									" shown after you submitted and the email you applied with. No magic link required."
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								className: "mt-6 grid gap-4 sm:grid-cols-2",
								onSubmit: (e) => {
									e.preventDefault();
									if (!referenceId || !email) return;
									mut.mutate();
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "sm:col-span-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											htmlFor: "ref",
											className: "text-xs uppercase tracking-wider text-muted-foreground",
											children: "Reference ID"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative mt-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hash, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "ref",
												required: true,
												minLength: 6,
												maxLength: 16,
												value: referenceId,
												onChange: (e) => setReferenceId(e.target.value.toUpperCase()),
												placeholder: "e.g. A1B2C3D4",
												className: "pl-9 font-mono uppercase"
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "sm:col-span-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											htmlFor: "email",
											className: "text-xs uppercase tracking-wider text-muted-foreground",
											children: "Registered email"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative mt-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "email",
												type: "email",
												required: true,
												value: email,
												onChange: (e) => setEmail(e.target.value),
												placeholder: "you@example.com",
												className: "pl-9"
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "sm:col-span-2",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "submit",
											disabled: mut.isPending,
											className: "w-full bg-primary hover:bg-secondary",
											children: mut.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), " Checking…"] }) : "Check status"
										})
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-4 text-xs text-muted-foreground",
								children: [
									"Prefer a secure one-time link instead?",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/status",
										className: "text-secondary underline",
										children: "Email me a magic link"
									}),
									"."
								]
							})
						]
					}),
					data && !data.ok && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-destructive/30 bg-destructive/5 p-5 flex gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "h-5 w-5 text-destructive shrink-0 mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-medium text-destructive",
								children: "No matching application"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-muted-foreground mt-1",
								children: "Double-check the Reference ID and email you used when applying. Both must match."
							})]
						})]
					}),
					data && data.ok && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-border bg-card p-6 sm:p-8 shadow-corp",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3 flex-wrap",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs uppercase tracking-widest text-muted-foreground",
										children: "Application"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-serif text-xl sm:text-2xl font-bold text-primary mt-1",
										children: data.application.full_name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-sm text-muted-foreground",
										children: data.application.role_applied
									})
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "inline-flex items-center gap-2 rounded-sm border border-border bg-background px-3 py-1.5 text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "uppercase tracking-widest text-muted-foreground",
										children: "Ref"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-primary font-medium",
										children: data.application.reference_id
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-6 flex items-center gap-3 flex-wrap",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium " + (STATUS_STYLE[data.application.status] || ""),
									children: STATUS_LABEL[data.application.status] || data.application.status
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs text-muted-foreground",
									children: ["Last updated ", new Date(data.application.updated_at).toLocaleString()]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-8",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs uppercase tracking-widest text-muted-foreground mb-3",
									children: "Timeline"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
									className: "space-y-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-4 w-4 text-emerald-600 mt-1 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "font-medium text-foreground",
												children: "Application submitted"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-xs text-muted-foreground",
												children: new Date(data.application.submitted_at).toLocaleString()
											})]
										})]
									}), data.history.map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-4 w-4 text-secondary mt-1 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "font-medium text-foreground",
												children: ["Moved to ", STATUS_LABEL[e.to_status] || e.to_status]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-xs text-muted-foreground",
												children: new Date(e.created_at).toLocaleString()
											})]
										})]
									}, i))]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-8 rounded-md bg-muted/40 border border-border p-4 text-xs text-muted-foreground",
								children: [
									"Questions? Reach us at",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href: "mailto:hr@vyntyraconsultancyservices.in",
										className: "text-secondary underline",
										children: "hr@vyntyraconsultancyservices.in"
									}),
									"."
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-center text-xs text-muted-foreground",
						children: "Vyntyra Consultancy Services · Project VyNexa"
					})
				]
			})
		})]
	});
}
//#endregion
export { TrackPage as component };
