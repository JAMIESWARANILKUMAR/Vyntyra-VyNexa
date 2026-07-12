import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { Z as ArrowLeft, _ as Mail, b as LoaderCircle } from "../_libs/lucide-react.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as useServerFn } from "./useServerFn-CrZF2pjq.mjs";
import { n as Input, r as cn, t as Button } from "./input-wipxj9S9.mjs";
import { a as listStatusTemplates, n as Switch, o as updateStatusTemplate } from "./workflow.functions-DjUu9rSs.mjs";
import { t as Textarea } from "./textarea-DClw33Hu.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as Trigger, n as List, r as Root2, t as Content } from "../_libs/radix-ui__react-tabs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/templates-D7WSmH6n.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Tabs = Root2;
var TabsList = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, {
	ref,
	className: cn("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className),
	...props
}));
TabsList.displayName = List.displayName;
var TabsTrigger = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
	ref,
	className: cn("inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow", className),
	...props
}));
TabsTrigger.displayName = Trigger.displayName;
var TabsContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content, {
	ref,
	className: cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className),
	...props
}));
TabsContent.displayName = Content.displayName;
var STATUSES = [
	"new",
	"reviewing",
	"shortlisted",
	"rejected",
	"hired"
];
function TemplatesPage() {
	const list = useServerFn(listStatusTemplates);
	const { data: tpls = [], isLoading, error } = useQuery({
		queryKey: ["status-templates"],
		queryFn: () => list()
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "border-b border-border bg-card sticky top-0 z-40",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto max-w-5xl px-6 h-16 flex items-center justify-between",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/_authenticated/admin",
						className: "text-muted-foreground hover:text-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-5 w-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-serif text-lg font-bold text-primary leading-none",
						children: "Status Emails"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5",
						children: "Templates sent to applicants on status change"
					})] })]
				})
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto max-w-5xl px-6 py-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-6 rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground",
					children: [
						"Variables you can use: ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
							className: "text-foreground",
							children: "{{full_name}}"
						}),
						",",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
							className: "text-foreground",
							children: "{{role_applied}}"
						}),
						",",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
							className: "text-foreground",
							children: "{{status}}"
						}),
						",",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
							className: "text-foreground",
							children: "{{portal_link}}"
						}),
						",",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
							className: "text-foreground",
							children: "{{application_id}}"
						}),
						"."
					]
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive mb-6",
					children: error.message
				}),
				isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "p-12 flex justify-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-6 w-6 animate-spin text-secondary" })
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
					defaultValue: "new",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsList, {
						className: "grid grid-cols-5",
						children: STATUSES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: s,
							className: "capitalize",
							children: s
						}, s))
					}), STATUSES.map((s) => {
						const tpl = tpls.find((t) => t.status === s);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: s,
							className: "mt-6",
							children: tpl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TemplateEditor, { tpl }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-sm text-muted-foreground",
								children: [
									"Template not found for ",
									s,
									"."
								]
							})
						}, s);
					})]
				})
			]
		})]
	});
}
function TemplateEditor({ tpl }) {
	const qc = useQueryClient();
	const update = useServerFn(updateStatusTemplate);
	const [subject, setSubject] = (0, import_react.useState)(tpl.subject);
	const [body, setBody] = (0, import_react.useState)(tpl.html_body);
	const [enabled, setEnabled] = (0, import_react.useState)(tpl.enabled);
	(0, import_react.useEffect)(() => {
		setSubject(tpl.subject);
		setBody(tpl.html_body);
		setEnabled(tpl.enabled);
	}, [tpl.status]);
	const mut = useMutation({
		mutationFn: () => update({ data: {
			status: tpl.status,
			subject,
			html_body: body,
			enabled
		} }),
		onSuccess: () => {
			toast.success("Template saved");
			qc.invalidateQueries({ queryKey: ["status-templates"] });
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-border bg-card p-6 shadow-corp space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs uppercase tracking-widest text-muted-foreground",
					children: "Status"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-serif text-xl font-bold text-primary capitalize",
					children: tpl.status
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex items-center gap-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
						checked: enabled,
						onCheckedChange: setEnabled
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted-foreground",
						children: "Send email on this status"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				className: "text-xs uppercase tracking-wider text-muted-foreground",
				children: "Subject"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				className: "mt-1.5",
				value: subject,
				onChange: (e) => setSubject(e.target.value)
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				className: "text-xs uppercase tracking-wider text-muted-foreground",
				children: "HTML body"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
				className: "mt-1.5 font-mono text-xs",
				rows: 14,
				value: body,
				onChange: (e) => setBody(e.target.value)
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "h-3 w-3" }), " Preview"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-md border border-border bg-white p-4 text-sm text-[#0A1F44] prose max-w-none",
				dangerouslySetInnerHTML: { __html: renderPreview(body) }
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-end",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => mut.mutate(),
					disabled: mut.isPending,
					className: "bg-primary hover:bg-secondary",
					children: mut.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), " Saving…"] }) : "Save template"
				})
			})
		]
	});
}
function renderPreview(html) {
	const vars = {
		full_name: "Priya Sharma",
		role_applied: "Search Relevance Engineer",
		status: "reviewing",
		portal_link: "https://example.com/status/preview",
		application_id: "00000000-0000-0000-0000-000000000000"
	};
	return html.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}
//#endregion
export { TemplatesPage as component };
