import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { s as Shield } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/privacy-BqZMbY3P.js
var import_jsx_runtime = require_jsx_runtime();
function PrivacyPage() {
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
							children: "Privacy Notice"
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
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
							title: "Who we are",
							children: "Vyntyra Consultancy Services (\"Vyntyra\") is the data controller for personal information submitted through the Vyntyra Careers applicant portal. Contact: hr@vyntyraconsultancyservices.in."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
							title: "What we collect",
							children: "Identity and contact details (name, email, phone), professional details (current company, role, LinkedIn, portfolio, years of experience, availability), academic details (state, college, graduation year, HOD and T&P contact details), your resume, project links and summaries, any documents you attach, and the cover message you provide."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
							title: "How we use it",
							children: "We use your data to review your application, contact you about it, schedule interviews, generate internal interview preparation notes for reviewers, send you automated status updates, and keep audit records of status changes. We do not sell your data."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
							title: "Legal basis",
							children: "We process your data on the basis of steps taken at your request prior to entering a possible employment contract, our legitimate interest in evaluating candidates fairly, and your consent captured through the agreement checkbox on the application form."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
							title: "Sharing",
							children: "Access is limited to authorised Vyntyra hiring team members. We use trusted processors to run the portal and send transactional email (application confirmation and status notifications). Resumes are stored in a private storage bucket and shared internally only through time-limited signed links."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
							title: "Security",
							children: "Traffic is served over TLS. Application data is stored with row-level security so records are only accessible to authorised administrators. The portal is fronted by Cloudflare Technologies. We follow ISO-aligned data handling practices. No online system is perfectly secure; we work to reduce risk and respond quickly to incidents."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
							title: "Retention",
							children: "We retain application data for up to 24 months after the final status decision so we can consider you for future roles, then delete or anonymise it. You can ask us to delete it sooner."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
							title: "Your rights",
							children: "You can request access, correction, or deletion of your personal data, withdraw consent, or ask us to restrict processing by emailing hr@vyntyraconsultancyservices.in. You can also track your application status at any time through the applicant portal using the secure link we send you."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
							title: "Cookies & analytics",
							children: "The portal uses only the cookies and local storage entries needed to run the application form, keep you signed in to the applicant portal, and remember your device for the installable app. No third-party advertising trackers are used."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
							title: "Changes",
							children: "We may update this notice. The \"Effective date\" above reflects the latest version."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-6 text-xs text-muted-foreground flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "h-3.5 w-3.5 text-secondary" }), " This page is maintained by Vyntyra Consultancy Services and describes current practices for the applicant portal. It is not a certification."]
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
export { PrivacyPage as component };
