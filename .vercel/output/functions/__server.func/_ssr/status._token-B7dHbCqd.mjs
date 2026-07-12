import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as WorldClocks } from "./world-clocks-EszHW3xk.mjs";
import { I as Clock, L as CircleX, P as Download, R as CircleCheck, b as LoaderCircle } from "../_libs/lucide-react.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as useServerFn } from "./useServerFn-CrZF2pjq.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as Route } from "./status._token-CaZh12Bh.mjs";
import { t as checkPortalToken } from "./portal.functions-Bho1JBSc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/status._token-B7dHbCqd.js
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
function StatusView() {
	const { token } = Route.useParams();
	const check = useServerFn(checkPortalToken);
	const { data, isLoading, error } = useQuery({
		queryKey: ["portal-token", token],
		queryFn: () => check({ data: { token } }),
		retry: false,
		refetchOnWindowFocus: false
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background flex flex-col",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "border-b border-border bg-card",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-5xl px-6 h-16 flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: "/favicon.png",
					alt: "Vyntyra",
					className: "h-10 w-auto"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border-l border-border pl-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm font-semibold text-primary leading-none",
						children: "Vyntyra Careers"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[10px] uppercase tracking-widest text-muted-foreground mt-1",
						children: "Applicant Portal"
					})]
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "flex-1 px-6 py-16",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-3xl space-y-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorldClocks, {}),
					isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-border bg-card p-12 text-center shadow-corp",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-6 w-6 animate-spin text-secondary mx-auto" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm text-muted-foreground",
							children: "Verifying your link…"
						})]
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorCard, {
						title: "Something went wrong",
						message: error.message
					}),
					data && !data.ok && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorCard, {
						title: data.reason === "expired" ? "Link expired" : data.reason === "used" ? "Link already used" : "Invalid link",
						message: data.reason === "expired" ? "This link expired. Request a fresh one below." : data.reason === "used" ? "This link has already been opened. Request a new one to check again." : "This link is not valid. Request a new one below."
					}),
					data && data.ok && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-border bg-card p-8 shadow-corp",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs uppercase tracking-widest text-muted-foreground",
								children: "Application"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-serif text-2xl font-bold text-primary mt-1",
								children: data.application.full_name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm text-muted-foreground",
								children: data.application.role_applied
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-6 flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium capitalize " + (STATUS_STYLE[data.application.status] || ""),
									children: STATUS_LABEL[data.application.status] || data.application.status
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs text-muted-foreground",
									children: ["Last updated ", new Date(data.application.updated_at).toLocaleString()]
								})]
							}),
							data.history.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
												className: "font-medium text-foreground capitalize",
												children: ["Moved to ", STATUS_LABEL[e.to_status] || e.to_status]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-xs text-muted-foreground",
												children: new Date(e.created_at).toLocaleString()
											})]
										})]
									}, i))]
								})]
							}),
							data.resume && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-6 rounded-md border border-secondary/30 bg-secondary/5 p-4 flex items-center justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-medium text-foreground",
										children: "Your submitted resume"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs text-muted-foreground",
										children: "Signed link · valid 30 minutes"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: data.resume.url,
									target: "_blank",
									rel: "noreferrer",
									className: "inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground hover:bg-secondary",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "h-3.5 w-3.5" }), " Download"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-8 rounded-md bg-muted/40 border border-border p-4 text-xs text-muted-foreground",
								children: [
									"For any queries reach us at",
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
					})
				]
			})
		})]
	});
}
function ErrorCard({ title, message }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-border bg-card p-8 shadow-corp text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "h-10 w-10 text-destructive mx-auto" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-4 font-serif text-xl font-bold text-primary",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted-foreground",
				children: message
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/status",
				className: "mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-secondary",
				children: "Request a new link"
			})
		]
	});
}
//#endregion
export { StatusView as component };
