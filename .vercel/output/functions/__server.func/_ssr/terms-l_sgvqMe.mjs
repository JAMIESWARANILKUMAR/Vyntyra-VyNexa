import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { s as Shield } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/terms-l_sgvqMe.js
var import_jsx_runtime = require_jsx_runtime();
function TermsPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-surface",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "border-b border-border bg-card",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto w-full max-w-4xl px-4 sm:px-6 h-16 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "/",
					className: "flex items-center gap-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: "/favicon.png",
						alt: "Vyntyra",
						className: "h-9 w-auto"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "/",
					className: "text-sm text-muted-foreground hover:text-primary",
					children: "← Back to application"
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto w-full max-w-3xl px-4 sm:px-6 py-10 sm:py-14",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold mb-2",
							children: "Legal · Applicants"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-3xl sm:text-4xl font-semibold text-primary tracking-tight",
							children: "Applicant Terms"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground mt-3",
							children: "Effective date: 09 July 2026 · Maintained by Vyntyra Consultancy Services"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-md border border-border bg-card shadow-corp p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
							title: "1. Scope",
							children: [
								"These terms govern your use of the Vyntyra Careers applicant portal (the \"Portal\") operated by Vyntyra Consultancy Services (\"Vyntyra\", \"we\", \"us\") to submit applications for Project VyNexa and other openings. By submitting an application you agree to these terms and to the accompanying",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "/privacy",
									className: "text-secondary underline underline-offset-4 hover:text-primary",
									children: "Privacy Notice"
								}),
								"."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
							title: "2. Eligibility & accuracy",
							children: "You confirm that you are legally eligible to work in the location you have applied to and that all information you submit — including contact details, academic details, resume, portfolio, and project documents — is accurate and your own. Misrepresentation may result in disqualification."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
							title: "3. Your submission",
							children: "You retain ownership of the content you submit. You grant Vyntyra a limited, non-exclusive licence to store, review, share internally with the hiring team, and process your submission for the purpose of evaluating your application and communicating with you about it."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
							title: "4. Automated processing",
							children: "We may use automated tooling to parse your resume, generate interview preparation notes for the hiring team, and send status updates by email. Hiring decisions are made by humans; automated tooling only assists reviewers and never rejects an application on its own."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
							title: "5. Acceptable use",
							children: "Do not submit malware, unlawful content, or information belonging to a third party without their consent. Do not attempt to interfere with the Portal, its security controls, or other applicants' data."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
							title: "6. Communications",
							children: "By applying you agree that we may contact you at the email address and phone number you provide about your application status, interview scheduling, and role updates. You may withdraw your application at any time by contacting hr@vyntyraconsultancyservices.in."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
							title: "7. No offer or guarantee",
							children: "Submitting an application does not create an employment relationship or a guarantee of interview or offer. Any offer of employment will be made in writing on separate terms."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
							title: "8. Changes",
							children: "We may update these terms. The \"Effective date\" above reflects the latest version. Continued use of the Portal after an update constitutes acceptance of the revised terms."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
							title: "9. Contact",
							children: [
								"Questions about these terms: ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									className: "text-secondary underline underline-offset-4",
									href: "mailto:hr@vyntyraconsultancyservices.in",
									children: "hr@vyntyraconsultancyservices.in"
								}),
								"."
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-6 text-xs text-muted-foreground flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "h-3.5 w-3.5 text-secondary" }), " This page is maintained by Vyntyra Consultancy Services and answers common questions about applying through this portal. It is not a legal certification."]
				})
			]
		})]
	});
}
function Section({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
		className: "text-sm font-semibold text-primary uppercase tracking-wider mb-2",
		children: title
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-foreground/90",
		children
	})] });
}
//#endregion
export { TermsPage as component };
