import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as render } from "../_libs/@react-email/render+[...].mjs";
import { t as Resend } from "../_libs/resend+standardwebhooks.mjs";
import { t as Body } from "../_libs/react-email__body.mjs";
import { t as Container } from "../_libs/react-email__container.mjs";
import { t as Head } from "../_libs/react-email__head.mjs";
import { t as Heading } from "../_libs/react-email__heading.mjs";
import { t as Html } from "../_libs/react-email__html.mjs";
import { t as Img } from "../_libs/react-email__img.mjs";
import { t as Link } from "../_libs/react-email__link.mjs";
import { t as Preview } from "../_libs/react-email__preview.mjs";
import { t as Section } from "../_libs/react-email__section.mjs";
import { t as Text } from "../_libs/react-email__text.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notify.server-B6OmPXyz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var LOGO_URL$1 = "https://careers.vyntyraconsultancyservices.in/favicon.png";
var INK$1 = "#111827";
var MUTED$1 = "#4B5563";
var LINE$1 = "#E5E7EB";
var CANVAS$1 = "#F9FAFB";
var BRAND$1 = "#0f172a";
var AdminNotify = ({ fullName = "Candidate", email = "candidate@example.com", phone = "1234567890", roleApplied = "Role", applicationId = "", hasResume = true }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Html, {
	lang: "en",
	dir: "ltr",
	children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Head, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Preview, { children: [
			"New Application: ",
			fullName,
			" for ",
			roleApplied
		] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Body, {
			style: {
				backgroundColor: CANVAS$1,
				fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
				margin: 0,
				padding: "40px 16px"
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Container, {
				style: {
					maxWidth: 600,
					margin: "0 auto",
					background: "#ffffff",
					borderRadius: 8,
					border: `1px solid ${LINE$1}`,
					overflow: "hidden"
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
						style: {
							padding: "32px 40px",
							borderBottom: `1px solid ${LINE$1}`
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
							style: {
								width: "100%",
								borderCollapse: "collapse"
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								style: {
									verticalAlign: "middle",
									width: 40
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Img, {
									src: LOGO_URL$1,
									alt: "Vyntyra",
									width: 32,
									height: 32,
									style: { display: "block" }
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								style: {
									verticalAlign: "middle",
									paddingLeft: 12
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									style: {
										color: INK$1,
										fontSize: 18,
										fontWeight: 600,
										letterSpacing: "-0.01em"
									},
									children: "Vyntyra HR Alerts"
								})
							})] }) })
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
						style: {
							padding: "40px 40px 16px",
							color: INK$1,
							lineHeight: 1.6,
							fontSize: 15
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heading, {
								style: {
									color: INK$1,
									fontSize: 24,
									margin: "0 0 16px",
									fontWeight: 600,
									letterSpacing: "-0.02em"
								},
								children: "New Application Received"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Text, {
								style: { margin: "0 0 24px" },
								children: [
									"A new application has been submitted for the ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: roleApplied }),
									" position."
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									border: `1px solid ${LINE$1}`,
									borderRadius: 6,
									padding: "16px",
									background: CANVAS$1,
									marginBottom: "24px"
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
									style: {
										width: "100%",
										fontSize: 14
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											style: {
												padding: "4px 0",
												color: MUTED$1,
												width: "120px"
											},
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Name:" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											style: {
												padding: "4px 0",
												color: INK$1
											},
											children: fullName
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											style: {
												padding: "4px 0",
												color: MUTED$1
											},
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Role:" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											style: {
												padding: "4px 0",
												color: INK$1
											},
											children: roleApplied
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											style: {
												padding: "4px 0",
												color: MUTED$1
											},
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Email:" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											style: {
												padding: "4px 0",
												color: INK$1
											},
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
												href: `mailto:${email}`,
												style: { color: BRAND$1 },
												children: email
											})
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											style: {
												padding: "4px 0",
												color: MUTED$1
											},
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Phone:" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											style: {
												padding: "4px 0",
												color: INK$1
											},
											children: phone
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											style: {
												padding: "4px 0",
												color: MUTED$1
											},
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Resume:" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											style: {
												padding: "4px 0",
												color: INK$1
											},
											children: hasResume ? "Attached" : "Not provided"
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											style: {
												padding: "4px 0",
												color: MUTED$1
											},
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "ID:" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											style: {
												padding: "4px 0",
												color: INK$1
											},
											children: applicationId
										})] })
									] })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								href: `https://careers.vyntyraconsultancyservices.in/admin`,
								style: {
									display: "inline-block",
									backgroundColor: BRAND$1,
									color: "#ffffff",
									padding: "10px 20px",
									borderRadius: 6,
									textDecoration: "none",
									fontWeight: 600,
									fontSize: 14
								},
								children: "Review Application"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
						style: {
							background: CANVAS$1,
							borderTop: `1px solid ${LINE$1}`,
							padding: "24px 40px",
							color: MUTED$1,
							fontSize: 12,
							lineHeight: 1.5
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "This is an automated notification from the Vyntyra Careers Portal." }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							"© ",
							(/* @__PURE__ */ new Date()).getFullYear(),
							" Vyntyra Consultancy Services."
						] })]
					})
				]
			})
		})
	]
});
var template$1 = {
	component: AdminNotify,
	subject: "New Application: {fullName} - {roleApplied}",
	displayName: "Admin: New Application Alert",
	previewData: {
		fullName: "Jane Smith",
		email: "jane@example.com",
		phone: "+91 9876543210",
		roleApplied: "Product Designer",
		applicationId: "12345678-1234-1234-1234-123456789012",
		hasResume: true
	}
};
var LOGO_URL = "https://careers.vyntyraconsultancyservices.in/favicon.png";
var INK = "#111827";
var MUTED = "#4B5563";
var LINE = "#E5E7EB";
var CANVAS = "#F9FAFB";
var BRAND = "#0f172a";
var ApplicantConfirm = ({ fullName = "there", email = "", roleApplied = "the role", applicationId = "", hasResume = false }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Html, {
	lang: "en",
	dir: "ltr",
	children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Head, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Preview, { children: "Your application to Project VyNexa is confirmed — Vyntyra Consultancy Services" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Body, {
			style: {
				backgroundColor: CANVAS,
				fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
				margin: 0,
				padding: "40px 16px"
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Container, {
				style: {
					maxWidth: 600,
					margin: "0 auto",
					background: "#ffffff",
					borderRadius: 8,
					border: `1px solid ${LINE}`,
					overflow: "hidden"
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
						style: {
							padding: "32px 40px",
							borderBottom: `1px solid ${LINE}`
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
							style: {
								width: "100%",
								borderCollapse: "collapse"
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								style: {
									verticalAlign: "middle",
									width: 40
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Img, {
									src: LOGO_URL,
									alt: "Vyntyra",
									width: 32,
									height: 32,
									style: { display: "block" }
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								style: {
									verticalAlign: "middle",
									paddingLeft: 12
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									style: {
										color: INK,
										fontSize: 18,
										fontWeight: 600,
										letterSpacing: "-0.01em"
									},
									children: "Vyntyra Consultancy Services"
								})
							})] }) })
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
						style: { padding: "40px 40px 16px" },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heading, {
							style: {
								color: INK,
								fontSize: 24,
								margin: "0 0 16px",
								fontWeight: 600,
								letterSpacing: "-0.02em"
							},
							children: "Application Received"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
						style: {
							padding: "0 40px",
							color: INK,
							lineHeight: 1.6,
							fontSize: 15
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Text, {
								style: { margin: "0 0 16px" },
								children: [
									"Dear ",
									fullName,
									","
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Text, {
								style: { margin: "0 0 16px" },
								children: [
									"Thank you for applying for the ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: roleApplied }),
									" position at Vyntyra Consultancy Services for ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Project VyNexa" }),
									"."
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Text, {
								style: { margin: "0 0 16px" },
								children: [
									"We have successfully received your application",
									hasResume ? " and resume" : "",
									". Our Talent Acquisition team will review your qualifications against our requirements. If your profile is a strong match for this role, we will contact you ",
									email ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: ["at ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: email })] }) : "shortly",
									" with next steps."
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
						style: { padding: "16px 40px" },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: {
								border: `1px solid ${LINE}`,
								borderRadius: 6,
								padding: "16px",
								background: CANVAS
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Text, {
								style: {
									margin: 0,
									fontSize: 12,
									color: MUTED,
									textTransform: "uppercase",
									fontWeight: 600,
									letterSpacing: "0.05em"
								},
								children: "Application ID"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Text, {
								style: {
									margin: "4px 0 0",
									fontFamily: "ui-monospace, \"SF Mono\", Menlo, monospace",
									fontSize: 14,
									color: INK,
									fontWeight: 600,
									wordBreak: "break-all"
								},
								children: applicationId
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
						style: { padding: "16px 40px 32px" },
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Text, {
								style: {
									margin: "0 0 16px",
									color: INK,
									fontSize: 15,
									lineHeight: 1.6
								},
								children: "You can track the status of your application online by visiting the applicant portal."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								href: "https://careers.vyntyraconsultancyservices.in/track",
								style: {
									display: "inline-block",
									backgroundColor: BRAND,
									color: "#ffffff",
									padding: "10px 20px",
									borderRadius: 6,
									textDecoration: "none",
									fontWeight: 600,
									fontSize: 14
								},
								children: "Track Application"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Text, {
								style: {
									margin: "32px 0 0",
									color: INK,
									fontSize: 15
								},
								children: [
									"Sincerely,",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Vyntyra Talent Acquisition" })
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
						style: {
							background: CANVAS,
							borderTop: `1px solid ${LINE}`,
							padding: "24px 40px",
							color: MUTED,
							fontSize: 12,
							lineHeight: 1.5
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: { marginBottom: 12 },
								children: "This email was sent to you by Vyntyra Consultancy Services in relation to your application for Project VyNexa."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: { marginBottom: 12 },
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Vyntyra Consultancy Services" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
									"Visakhapatnam, AP, India",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
									"ISO-aligned · NASSCOM Verified · MSME Registered"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								"© ",
								(/* @__PURE__ */ new Date()).getFullYear(),
								" Vyntyra Consultancy Services. All rights reserved."
							] })
						]
					})
				]
			})
		})
	]
});
var TEMPLATES = {
	"application-admin": template$1,
	"application-applicant": {
		component: ApplicantConfirm,
		subject: "Application Received: {roleApplied} | Vyntyra",
		displayName: "Applicant: Confirmation",
		previewData: {
			fullName: "John Doe",
			email: "john@example.com",
			roleApplied: "Software Engineer",
			applicationId: "00000000-0000-0000-0000-000000000000",
			hasResume: true
		}
	}
};
var SITE_NAME = "VyNexa Connect";
var FROM_DOMAIN = "vyntyraconsultancyservices.in";
/**
* Renders a registered template and sends it through Resend.
*/
async function sendTemplateEmail(templateName, to, options = {}) {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
	const resend = new Resend(apiKey);
	const template = TEMPLATES[templateName];
	if (!template) throw new Error(`Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(", ")}`);
	const recipient = template.to || to;
	if (!recipient) throw new Error("Recipient is required");
	const templateData = options.templateData ?? {};
	const element = import_react.createElement(template.component, templateData);
	const html = await render(element);
	const text = await render(element, { plainText: true });
	const subject = typeof template.subject === "function" ? template.subject(templateData) : template.subject;
	try {
		const { data, error } = await resend.emails.send({
			to: recipient,
			from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
			subject,
			html,
			text,
			replyTo: options.replyTo
		});
		if (error) throw error;
		return {
			sent: true,
			id: data?.id
		};
	} catch (error) {
		console.error("Error sending email via Resend:", error);
		return {
			sent: false,
			reason: error.message || "Unknown error"
		};
	}
}
async function notifyAdminOfApplication(p) {
	const templateData = {
		fullName: p.fullName,
		email: p.email,
		phone: p.phone,
		roleApplied: p.roleApplied,
		applicationId: p.applicationId,
		hasResume: !!p.hasResume
	};
	await Promise.allSettled([sendTemplateEmail("application-admin", "hr@vyntyraconsultancyservices.in", {
		templateData,
		idempotencyKey: `application-admin-${p.applicationId}`
	}), sendTemplateEmail("application-applicant", p.email, {
		templateData,
		idempotencyKey: `application-applicant-${p.applicationId}`
	})]);
}
//#endregion
export { notifyAdminOfApplication };
