import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as WorldClocks } from "./world-clocks-EszHW3xk.mjs";
import { A as Eye, E as FolderGit2, G as Briefcase, I as Clock, J as BellOff, M as ExternalLink, O as FileText, P as Download, S as Link2, T as Funnel, W as Building2, _ as Mail, a as Trash2, b as LoaderCircle, c as Settings2, d as Plus, f as Phone, g as MapPin, i as TrendingUp, j as EyeOff, k as FileDown, l as Search, n as Users, o as Sparkles, p as PenLine, q as Bell, s as Shield, t as X, u as RefreshCw, v as LogOut, w as GraduationCap } from "../_libs/lucide-react.mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as useServerFn } from "./useServerFn-CrZF2pjq.mjs";
import { listAdminNotifications, markAllNotificationsRead } from "./notifications.functions-D3FFpz8h.mjs";
import { t as supabase } from "./client-Fdjwgnl3.mjs";
import { n as Input, t as Button } from "./input-wipxj9S9.mjs";
import { C as listJobPostings, D as toggleJobPosting, O as updateAdminNotes, S as listApplications, T as setApplicationsOpen, _ as getResumeSignedUrl, a as DialogHeader, c as Select, d as SelectTrigger, f as SelectValue, g as getApplicationsOpen, h as deleteJobPosting, k as updateJobPosting, l as SelectContent, m as deleteApplication, n as DialogContent, o as DialogTitle, p as createJobPosting, s as InstallPwaButton, t as Dialog, u as SelectItem, v as getVisitorCount, w as regenerateInterviewQuestions, x as listApplicationProjects } from "./dialog-BrQ--iQm.mjs";
import { i as listStatusEvents, n as Switch, r as changeApplicationStatus, t as ALLOWED_TRANSITIONS } from "./workflow.functions-DjUu9rSs.mjs";
import { t as Textarea } from "./textarea-DClw33Hu.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-D6nem0lx.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STATUS_COLORS = {
	new: "bg-secondary/15 text-secondary border-secondary/30",
	reviewing: "bg-amber-100 text-amber-800 border-amber-300",
	shortlisted: "bg-emerald-100 text-emerald-800 border-emerald-300",
	rejected: "bg-destructive/10 text-destructive border-destructive/30",
	hired: "bg-primary text-primary-foreground border-primary"
};
var STATUS_OPTIONS = [
	"all",
	"new",
	"reviewing",
	"shortlisted",
	"hired",
	"rejected"
];
var JOB_TYPES = [
	"Full-time",
	"Part-time",
	"Internship",
	"Contract"
];
var NOTIF_ICONS = {
	new_application: "🆕",
	status_change: "🔄",
	email_sent: "📧"
};
function AdminDashboard() {
	const navigate = useNavigate();
	const qc = useQueryClient();
	const list = useServerFn(listApplications);
	const fetchOpen = useServerFn(getApplicationsOpen);
	const setOpen = useServerFn(setApplicationsOpen);
	const fetchJobs = useServerFn(listJobPostings);
	const fetchNotifications = useServerFn(listAdminNotifications);
	const markAllRead = useServerFn(markAllNotificationsRead);
	const fetchVisitorCount = useServerFn(getVisitorCount);
	const [selected, setSelected] = (0, import_react.useState)(null);
	const [statusFilter, setStatusFilter] = (0, import_react.useState)("all");
	const [search, setSearch] = (0, import_react.useState)("");
	const [dateFrom, setDateFrom] = (0, import_react.useState)("");
	const [dateTo, setDateTo] = (0, import_react.useState)("");
	const [jobDialogOpen, setJobDialogOpen] = (0, import_react.useState)(false);
	const [editingJob, setEditingJob] = (0, import_react.useState)(null);
	const { data: apps = [], isLoading, error } = useQuery({
		queryKey: ["applications"],
		queryFn: () => list()
	});
	const openQ = useQuery({
		queryKey: ["applications-open"],
		queryFn: () => fetchOpen()
	});
	const toggleOpen = useMutation({
		mutationFn: (enabled) => setOpen({ data: { enabled } }),
		onSuccess: (r) => {
			qc.setQueryData(["applications-open"], r);
			toast.success(r.enabled ? "Applications are now OPEN" : "Applications are now PAUSED");
		},
		onError: (e) => toast.error(e?.message || "Failed to update")
	});
	const applicationsOpen = openQ.data?.enabled !== false;
	const jobsQ = useQuery({
		queryKey: ["job-postings"],
		queryFn: () => fetchJobs()
	});
	const notifsQ = useQuery({
		queryKey: ["admin-notifications"],
		queryFn: () => fetchNotifications(),
		refetchInterval: 6e4
	});
	const visitorQ = useQuery({
		queryKey: ["visitor-count"],
		queryFn: () => fetchVisitorCount()
	});
	const markAllReadMut = useMutation({
		mutationFn: () => markAllRead(),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["admin-notifications"] });
			toast.success("All notifications marked as read");
		}
	});
	const filtered = (0, import_react.useMemo)(() => {
		const q = search.trim().toLowerCase();
		const from = dateFrom ? new Date(dateFrom).getTime() : null;
		const to = dateTo ? new Date(dateTo).getTime() + 1440 * 60 * 1e3 : null;
		return apps.filter((a) => {
			if (statusFilter !== "all" && a.status !== statusFilter) return false;
			const t = new Date(a.created_at).getTime();
			if (from && t < from) return false;
			if (to && t > to) return false;
			if (q) {
				if (![
					a.full_name,
					a.email,
					a.phone,
					a.role_applied,
					a.company,
					a.position
				].filter(Boolean).join(" ").toLowerCase().includes(q)) return false;
			}
			return true;
		});
	}, [
		apps,
		statusFilter,
		search,
		dateFrom,
		dateTo
	]);
	const hasFilters = statusFilter !== "all" || search || dateFrom || dateTo;
	async function signOut() {
		await qc.cancelQueries();
		qc.clear();
		await supabase.auth.signOut();
		navigate({
			to: "/auth",
			replace: true
		});
	}
	function resetFilters() {
		setStatusFilter("all");
		setSearch("");
		setDateFrom("");
		setDateTo("");
	}
	function exportCsv() {
		if (filtered.length === 0) {
			toast.error("No applications to export");
			return;
		}
		const csv = [[
			"ID",
			"Submitted",
			"Status",
			"Full Name",
			"Email",
			"Phone",
			"Role Applied",
			"State",
			"College",
			"Graduation Year",
			"HOD Name",
			"HOD Contact",
			"HOD Email",
			"T&P Officer Name",
			"T&P Officer Contact",
			"T&P Officer Email",
			"Company",
			"Position",
			"Years Experience",
			"Availability",
			"LinkedIn",
			"Portfolio",
			"Resume Path",
			"Cover Message",
			"Admin Notes"
		], ...filtered.map((a) => [
			a.id,
			new Date(a.created_at).toISOString(),
			a.status,
			a.full_name,
			a.email,
			a.phone,
			a.role_applied,
			a.state ?? "",
			a.college ?? "",
			a.graduation_year ?? "",
			a.hod_name ?? "",
			a.hod_contact ?? "",
			a.hod_email ?? "",
			a.tp_officer_name ?? "",
			a.tp_officer_contact ?? "",
			a.tp_officer_email ?? "",
			a.company ?? "",
			a.position ?? "",
			a.years_experience ?? "",
			a.availability ?? "",
			a.linkedin_url ?? "",
			a.portfolio_url ?? "",
			a.resume_path ?? "",
			a.message ?? "",
			a.admin_notes ?? ""
		])].map((r) => r.map((v) => `"${String(v).replace(/"/g, "\"\"").replace(/\r?\n/g, " ")}"`).join(",")).join("\n");
		const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `vynexa-applications-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		toast.success(`Exported ${filtered.length} application${filtered.length === 1 ? "" : "s"}`);
	}
	const stats = {
		total: apps.length,
		new: apps.filter((a) => a.status === "new").length,
		reviewing: apps.filter((a) => a.status === "reviewing").length,
		shortlisted: apps.filter((a) => a.status === "shortlisted").length,
		hired: apps.filter((a) => a.status === "hired").length,
		rejected: apps.filter((a) => a.status === "rejected").length
	};
	const unreadCount = (notifsQ.data ?? []).filter((n) => !n.is_read).length;
	function timeAgo(dateStr) {
		const now = Date.now();
		const d = new Date(dateStr).getTime();
		const diff = Math.max(0, now - d);
		const mins = Math.floor(diff / 6e4);
		if (mins < 1) return "Just now";
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		return `${Math.floor(hrs / 24)}d ago`;
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-surface",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "border-b border-border bg-card sticky top-0 z-40",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto w-full max-w-7xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: "/favicon.png",
							alt: "Vyntyra",
							className: "h-8 sm:h-10 w-auto shrink-0"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "border-l border-border pl-3 min-w-0 hidden xs:block sm:block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium",
								children: "Admin"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm font-semibold text-primary truncate",
								children: "Vyntyra Careers"
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1 sm:gap-2 shrink-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InstallPwaButton, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/_authenticated/templates",
								className: "inline-flex items-center gap-1.5 rounded-sm px-2 sm:px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings2, { className: "h-4 w-4" }),
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "hidden sm:inline",
										children: "Templates"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "ghost",
								size: "sm",
								onClick: signOut,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-4 w-4 sm:mr-2" }),
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "hidden sm:inline",
										children: "Sign out"
									})
								]
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative rounded-lg overflow-hidden bg-gradient-hero text-primary-foreground mb-8 shadow-elev",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 corporate-grid" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-gold/10 to-transparent hidden lg:block" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "relative px-6 sm:px-8 py-8 sm:py-10",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "inline-flex items-center gap-2 rounded-sm border border-gold/40 bg-gold/10 px-3 py-1 text-[10px] font-medium text-gold uppercase tracking-[0.18em] mb-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-gold animate-pulse" }), "Admin Panel"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
											className: "text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight leading-tight",
											children: ["Hello, ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-gold",
												children: "Recruiter"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-lg sm:text-xl text-primary-foreground/80 mt-1",
											children: ["@ ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-medium text-primary-foreground",
												children: "Vyntyra Consultancy Services"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-sm text-primary-foreground/60 mt-3 max-w-xl",
											children: [
												(/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", {
													weekday: "long",
													year: "numeric",
													month: "long",
													day: "numeric"
												}),
												" · ",
												stats.total,
												" total applications · ",
												stats.new,
												" new · ",
												stats.shortlisted,
												" shortlisted"
											]
										})
									] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex flex-col items-end gap-2 shrink-0",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-right hidden sm:block",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-5xl font-bold tracking-tight",
												children: stats.total
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-xs uppercase tracking-widest text-primary-foreground/60 mt-1",
												children: "Total Applications"
											})]
										})
									})]
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorldClocks, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-md border border-border bg-card shadow-corp p-5 mb-8",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[10px] font-medium uppercase tracking-[0.2em] text-secondary mb-4",
							children: "At a Glance"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid md:grid-cols-3 gap-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-9 w-9 flex-shrink-0 rounded-sm bg-secondary/10 flex items-center justify-center",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-4.5 w-4.5 text-secondary" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[11px] uppercase tracking-wider text-muted-foreground mb-1",
										children: "Locations"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-sm font-medium text-foreground leading-snug",
										children: ["India — Visakhapatnam, Bengaluru, Hyderabad, Uttar Pradesh", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground",
											children: " · Remote"
										})]
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-9 w-9 flex-shrink-0 rounded-sm bg-secondary/10 flex items-center justify-center",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-4.5 w-4.5 text-secondary" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[11px] uppercase tracking-wider text-muted-foreground mb-1",
										children: "Response Time"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-2xl font-semibold text-foreground",
										children: "5–7 days"
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-9 w-9 flex-shrink-0 rounded-sm bg-secondary/10 flex items-center justify-center",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "h-4.5 w-4.5 text-secondary" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[11px] uppercase tracking-wider text-muted-foreground mb-1",
										children: "Data Handling"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-sm font-medium text-foreground leading-snug",
										children: ["Secured by Cloudflare Technologies", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block text-muted-foreground mt-0.5",
											children: "ISO-aligned · NASSCOM Verified · Registered under MSME"
										})]
									})] })]
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-md border border-border bg-card shadow-corp p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `mt-0.5 h-9 w-9 rounded-sm flex items-center justify-center ${applicationsOpen ? "bg-destructive/10" : "bg-muted"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-2.5 w-2.5 rounded-full ${applicationsOpen ? "bg-destructive animate-pulse" : "bg-muted-foreground/50"}` })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[10px] font-medium uppercase tracking-[0.2em] text-secondary",
									children: "Public Application Form"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm font-semibold text-primary mt-0.5",
									children: applicationsOpen ? "LIVE · Accepting Applications" : "Paused · Not Accepting Applications"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-muted-foreground mt-0.5",
									children: "Toggling this instantly updates the public form and the LIVE badge — no deploy needed."
								})
							] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3 shrink-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted-foreground",
								children: applicationsOpen ? "On" : "Off"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
								checked: applicationsOpen,
								disabled: openQ.isLoading || toggleOpen.isPending,
								onCheckedChange: (v) => toggleOpen.mutate(v)
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Total",
								value: stats.total
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "New",
								value: stats.new,
								tone: "secondary"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Reviewing",
								value: stats.reviewing,
								tone: "amber"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Shortlisted",
								value: stats.shortlisted,
								tone: "emerald"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Hired",
								value: stats.hired,
								tone: "primary"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Rejected",
								value: stats.rejected,
								tone: "destructive"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-md border border-border bg-card shadow-corp mb-8 overflow-hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between px-5 py-3 border-b border-border bg-surface",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "h-4 w-4 text-secondary" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-semibold text-primary",
										children: "Notifications"
									}),
									unreadCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5",
										children: unreadCount
									})
								]
							}), unreadCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "ghost",
								size: "sm",
								onClick: () => markAllReadMut.mutate(),
								disabled: markAllReadMut.isPending,
								className: "text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BellOff, { className: "h-3.5 w-3.5 mr-1.5" }), " Mark all read"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "max-h-[280px] overflow-y-auto divide-y divide-border",
							children: notifsQ.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "p-6 flex justify-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-5 w-5 animate-spin text-secondary" })
							}) : (notifsQ.data ?? []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "p-6 text-center text-sm text-muted-foreground",
								children: "No notifications yet. They'll appear here when applications are submitted or statuses change."
							}) : (notifsQ.data ?? []).map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `px-5 py-3 flex items-start gap-3 text-sm transition-colors ${n.is_read ? "opacity-60" : "bg-secondary/[0.03]"}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-lg leading-none mt-0.5 shrink-0",
										children: NOTIF_ICONS[n.type] ?? "🔔"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0 flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "font-medium text-foreground",
											children: n.title
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-muted-foreground text-xs mt-0.5 leading-relaxed",
											children: n.message
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[10px] text-muted-foreground shrink-0 mt-0.5 whitespace-nowrap",
										children: timeAgo(n.created_at)
									})
								]
							}, n.id))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JobPostingsSection, {
						jobs: jobsQ.data ?? [],
						isLoading: jobsQ.isLoading,
						apps,
						onCreateNew: () => {
							setEditingJob(null);
							setJobDialogOpen(true);
						},
						onEdit: (j) => {
							setEditingJob(j);
							setJobDialogOpen(true);
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-8 mt-8",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-2xl font-semibold text-primary tracking-tight",
							children: "Applications"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground mt-1",
							children: "Review candidate submissions for Project VyNexa. Status changes require a note and email the applicant automatically."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-md border border-border bg-card shadow-corp p-4 mb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 sm:flex sm:flex-wrap sm:items-end gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "col-span-2 sm:flex-1 sm:min-w-[220px]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
										children: "Search"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative mt-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: search,
											onChange: (e) => setSearch(e.target.value),
											className: "pl-9",
											placeholder: "Name, email, phone, role, company…"
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "sm:w-[160px]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
										children: "Status"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: statusFilter,
										onValueChange: setStatusFilter,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "mt-1",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: STATUS_OPTIONS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: s,
											className: "capitalize",
											children: s === "all" ? "All statuses" : s
										}, s)) })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "sm:w-[150px]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
										children: "From"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "date",
										value: dateFrom,
										onChange: (e) => setDateFrom(e.target.value),
										className: "mt-1"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "sm:w-[150px]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
										children: "To"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "date",
										value: dateTo,
										onChange: (e) => setDateTo(e.target.value),
										className: "mt-1"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2 ml-auto",
									children: [hasFilters && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "ghost",
										size: "sm",
										onClick: resetFilters,
										className: "text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4 mr-1.5" }), " Clear"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "outline",
										size: "sm",
										onClick: exportCsv,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileDown, { className: "h-4 w-4 mr-1.5" }), " Export CSV"]
									})]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex items-center gap-2 text-xs text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Funnel, { className: "h-3 w-3" }),
								"Showing ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium text-foreground",
									children: filtered.length
								}),
								" of",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium text-foreground",
									children: apps.length
								}),
								" applications"
							]
						})]
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive mb-6",
						children: error.message.includes("Forbidden") ? "Your account does not have admin access. Ask a platform admin to grant your user the admin role." : error.message
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-md border border-border bg-card shadow-corp overflow-hidden",
						children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-12 flex justify-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-6 w-6 animate-spin text-secondary" })
						}) : filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-12 text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-10 w-10 text-muted-foreground mx-auto mb-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted-foreground",
								children: apps.length === 0 ? "No applications yet." : "No applications match your filters."
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "overflow-x-auto",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
								className: "w-full text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-b border-border bg-surface text-left text-[11px] uppercase tracking-wider text-muted-foreground",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "px-6 py-3 font-medium",
											children: "Candidate"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "px-6 py-3 font-medium",
											children: "Role"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "px-6 py-3 font-medium",
											children: "Contact"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "px-6 py-3 font-medium",
											children: "Status"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "px-6 py-3 font-medium",
											children: "Applied"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-6 py-3 font-medium" })
									]
								}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: filtered.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-b border-border last:border-0 hover:bg-surface cursor-pointer",
									onClick: () => setSelected(a),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "px-6 py-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "font-medium text-foreground",
												children: a.full_name
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-xs text-muted-foreground",
												children: a.years_experience || "—"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-6 py-4 text-foreground",
											children: a.role_applied
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "px-6 py-4 text-xs text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: a.email }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: a.phone })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-6 py-4",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize " + (STATUS_COLORS[a.status] || ""),
												children: a.status
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-6 py-4 text-xs text-muted-foreground",
											children: new Date(a.created_at).toLocaleDateString()
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-6 py-4 text-right",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "ghost",
												size: "sm",
												children: "View"
											})
										})
									]
								}, a.id)) })]
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-10 mb-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-md border border-border bg-card shadow-corp p-5 flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-10 w-10 rounded-sm bg-secondary/10 flex items-center justify-center",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "h-5 w-5 text-secondary" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[11px] uppercase tracking-widest text-muted-foreground font-medium",
									children: "Public Page Visitors"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-muted-foreground mt-0.5",
									children: "Total visits to the careers landing page"
								})] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-right",
								children: visitorQ.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-5 w-5 animate-spin text-secondary" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-3xl font-bold text-primary tracking-tight",
									children: (visitorQ.data?.count ?? 0).toLocaleString()
								})
							})]
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ApplicationDialog, {
				app: selected,
				onClose: () => setSelected(null)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JobPostingDialog, {
				open: jobDialogOpen,
				onClose: () => {
					setJobDialogOpen(false);
					setEditingJob(null);
				},
				editing: editingJob
			})
		]
	});
}
function JobPostingsSection({ jobs, isLoading, apps, onCreateNew, onEdit }) {
	const qc = useQueryClient();
	const toggleFn = useServerFn(toggleJobPosting);
	const deleteFn = useServerFn(deleteJobPosting);
	const toggleMut = useMutation({
		mutationFn: (id) => toggleFn({ data: { id } }),
		onSuccess: (r) => {
			qc.invalidateQueries({ queryKey: ["job-postings"] });
			toast.success(r.is_active ? "Job posting activated" : "Job posting deactivated");
		},
		onError: (e) => toast.error(e.message)
	});
	const deleteMut = useMutation({
		mutationFn: (id) => deleteFn({ data: { id } }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["job-postings"] });
			toast.success("Job posting deleted");
		},
		onError: (e) => toast.error(e.message)
	});
	function appCountForJob(jobId) {
		return apps.filter((a) => a.job_posting_id === jobId).length;
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md border border-border bg-card shadow-corp overflow-hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between px-5 py-3 border-b border-border bg-surface",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Briefcase, { className: "h-4 w-4 text-secondary" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-semibold text-primary",
						children: "Job Postings"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-xs text-muted-foreground",
						children: [
							"(",
							jobs.length,
							")"
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				onClick: onCreateNew,
				className: "bg-primary hover:bg-secondary",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-3.5 w-3.5 mr-1.5" }), " Post New Job"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "divide-y divide-border",
			children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "p-8 flex justify-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-5 w-5 animate-spin text-secondary" })
			}) : jobs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-8 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "h-10 w-10 text-muted-foreground mx-auto mb-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted-foreground text-sm",
					children: "No job postings yet. Create your first job opening to start receiving targeted applications."
				})]
			}) : jobs.map((j) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 ${!j.is_active ? "opacity-50" : ""}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium text-foreground truncate",
							children: j.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${j.is_active ? "border-emerald-300 bg-emerald-100 text-emerald-800" : "border-border bg-muted text-muted-foreground"}`,
							children: j.is_active ? "Active" : "Inactive"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: j.department }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-3 w-3" }), j.location]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: j.type }),
							j.salary_range && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-secondary font-medium",
								children: j.salary_range
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-3 w-3" }),
									appCountForJob(j.id),
									" applications"
								]
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1.5 shrink-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "sm",
							onClick: () => toggleMut.mutate(j.id),
							disabled: toggleMut.isPending,
							title: j.is_active ? "Deactivate" : "Activate",
							children: j.is_active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "sm",
							onClick: () => onEdit(j),
							title: "Edit",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "sm",
							onClick: () => {
								if (confirm("Delete this job posting? Applications linked to it will keep their data.")) deleteMut.mutate(j.id);
							},
							disabled: deleteMut.isPending,
							title: "Delete",
							className: "text-destructive hover:text-destructive",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
						})
					]
				})]
			}, j.id))
		})]
	});
}
function JobPostingDialog({ open, onClose, editing }) {
	const qc = useQueryClient();
	const createFn = useServerFn(createJobPosting);
	const updateFn = useServerFn(updateJobPosting);
	const [form, setForm] = (0, import_react.useState)({
		title: "",
		department: "",
		location: "Remote",
		type: "Full-time",
		description: "",
		requirements: "",
		salary_range: ""
	});
	(0, import_react.useEffect)(() => {
		if (editing) setForm({
			title: editing.title ?? "",
			department: editing.department ?? "",
			location: editing.location ?? "Remote",
			type: editing.type ?? "Full-time",
			description: editing.description ?? "",
			requirements: editing.requirements ?? "",
			salary_range: editing.salary_range ?? ""
		});
		else setForm({
			title: "",
			department: "",
			location: "Remote",
			type: "Full-time",
			description: "",
			requirements: "",
			salary_range: ""
		});
	}, [editing, open]);
	const mutation = useMutation({
		mutationFn: async () => {
			if (editing) {
				await updateFn({ data: {
					id: editing.id,
					...form
				} });
				return { id: editing.id };
			} else return { id: (await createFn({ data: form })).id };
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["job-postings"] });
			toast.success(editing ? "Job posting updated" : "Job posting created");
			onClose();
		},
		onError: (e) => toast.error(e.message)
	});
	const u = (k) => (v) => setForm((s) => ({
		...s,
		[k]: v
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: (v) => !v && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-2xl max-h-[92vh] overflow-y-auto",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
				className: "text-xl text-primary tracking-tight",
				children: editing ? "Edit Job Posting" : "Post New Job Opening"
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-5 mt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid md:grid-cols-2 gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-[11px] uppercase tracking-wider text-muted-foreground font-medium",
								children: "Job Title *"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "mt-1.5",
								value: form.title,
								onChange: (e) => u("title")(e.target.value),
								placeholder: "e.g. Frontend Engineer"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-[11px] uppercase tracking-wider text-muted-foreground font-medium",
								children: "Department *"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "mt-1.5",
								value: form.department,
								onChange: (e) => u("department")(e.target.value),
								placeholder: "e.g. Engineering"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-[11px] uppercase tracking-wider text-muted-foreground font-medium",
								children: "Location"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "mt-1.5",
								value: form.location,
								onChange: (e) => u("location")(e.target.value),
								placeholder: "Remote"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-[11px] uppercase tracking-wider text-muted-foreground font-medium",
								children: "Type"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: form.type,
								onValueChange: u("type"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									className: "mt-1.5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: JOB_TYPES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: t,
									children: t
								}, t)) })]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "md:col-span-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-[11px] uppercase tracking-wider text-muted-foreground font-medium",
									children: "Salary Range (optional)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									className: "mt-1.5",
									value: form.salary_range,
									onChange: (e) => u("salary_range")(e.target.value),
									placeholder: "e.g. ₹8–12 LPA"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-[11px] uppercase tracking-wider text-muted-foreground font-medium",
						children: "Job Description *"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						className: "mt-1.5",
						rows: 5,
						value: form.description,
						onChange: (e) => u("description")(e.target.value),
						placeholder: "Describe the role, responsibilities, and what the candidate will work on…"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-[11px] uppercase tracking-wider text-muted-foreground font-medium",
						children: "Requirements (optional)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						className: "mt-1.5",
						rows: 4,
						value: form.requirements,
						onChange: (e) => u("requirements")(e.target.value),
						placeholder: "Skills, qualifications, and experience needed…"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-end gap-3 pt-2 border-t border-border",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							onClick: onClose,
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => mutation.mutate(),
							disabled: mutation.isPending || !form.title.trim() || !form.department.trim() || form.description.trim().length < 10,
							className: "bg-primary hover:bg-secondary",
							children: mutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), " Saving…"] }) : editing ? "Update Posting" : "Publish Job Opening"
						})]
					})
				]
			})]
		})
	});
}
function Stat({ label, value, tone = "default" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md border border-border bg-card p-5 shadow-corp",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-[11px] uppercase tracking-widest text-muted-foreground font-medium",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2 text-3xl font-semibold tracking-tight " + ({
				default: "text-primary",
				secondary: "text-secondary",
				amber: "text-amber-600",
				emerald: "text-emerald-600",
				primary: "text-primary",
				destructive: "text-destructive"
			}[tone] || "text-primary"),
			children: value
		})]
	});
}
function ApplicationDialog({ app, onClose }) {
	const qc = useQueryClient();
	const changeStatus = useServerFn(changeApplicationStatus);
	const saveNotes = useServerFn(updateAdminNotes);
	const listEvents = useServerFn(listStatusEvents);
	const signed = useServerFn(getResumeSignedUrl);
	const regenAi = useServerFn(regenerateInterviewQuestions);
	const [status, setStatus] = (0, import_react.useState)(app?.status ?? "new");
	const [note, setNote] = (0, import_react.useState)("");
	const [notes, setNotes] = (0, import_react.useState)(app?.admin_notes ?? "");
	const [resumeUrl, setResumeUrl] = (0, import_react.useState)(null);
	const [aiText, setAiText] = (0, import_react.useState)(app?.interview_questions ?? null);
	const [regenerating, setRegenerating] = (0, import_react.useState)(false);
	const isPdf = !!app?.resume_path && /\.pdf$/i.test(app.resume_path);
	(0, import_react.useEffect)(() => {
		if (app) {
			setStatus(app.status);
			setNote("");
			setNotes(app.admin_notes ?? "");
			setAiText(app.interview_questions ?? null);
			setResumeUrl(null);
			if (app.resume_path) signed({ data: { path: app.resume_path } }).then((r) => setResumeUrl(r.url)).catch(() => {});
		}
	}, [app?.id]);
	const currentStatus = app?.status ?? "new";
	const allowedNext = ALLOWED_TRANSITIONS[currentStatus] ?? [];
	const options = Array.from(/* @__PURE__ */ new Set([currentStatus, ...allowedNext]));
	const events = useQuery({
		queryKey: ["status-events", app?.id],
		queryFn: () => listEvents({ data: { applicationId: app.id } }),
		enabled: !!app
	});
	const projectsList = useServerFn(listApplicationProjects);
	const projects = useQuery({
		queryKey: ["app-projects", app?.id],
		queryFn: () => projectsList({ data: { id: app.id } }),
		enabled: !!app
	});
	const statusMut = useMutation({
		mutationFn: () => changeStatus({ data: {
			id: app.id,
			status,
			note
		} }),
		onSuccess: () => {
			toast.success(status === currentStatus ? "Note added to timeline" : "Status updated — applicant notified");
			qc.invalidateQueries({ queryKey: ["applications"] });
			qc.invalidateQueries({ queryKey: ["status-events", app.id] });
			qc.invalidateQueries({ queryKey: ["admin-notifications"] });
			setNote("");
		},
		onError: (e) => toast.error(e.message)
	});
	const notesMut = useMutation({
		mutationFn: () => saveNotes({ data: {
			id: app.id,
			admin_notes: notes
		} }),
		onSuccess: () => {
			toast.success("Internal notes saved");
			qc.invalidateQueries({ queryKey: ["applications"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const deleteApp = useServerFn(deleteApplication);
	const delMut = useMutation({
		mutationFn: () => deleteApp({ data: { id: app.id } }),
		onSuccess: () => {
			toast.success("Application deleted");
			qc.invalidateQueries({ queryKey: ["applications"] });
			onClose();
		},
		onError: (e) => toast.error(e.message)
	});
	async function regenerate() {
		setRegenerating(true);
		try {
			const { text } = await regenAi({ data: { id: app.id } });
			setAiText(text);
			qc.invalidateQueries({ queryKey: ["applications"] });
			toast.success("Interview questions regenerated");
		} catch (e) {
			toast.error(e.message);
		} finally {
			setRegenerating(false);
		}
	}
	if (!app) return null;
	const isTerminal = currentStatus === "hired" || currentStatus === "rejected";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: !!app,
		onOpenChange: (v) => !v && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-4xl max-h-[92vh] overflow-y-auto",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, {
				className: "flex flex-row items-start justify-between sm:items-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "text-2xl text-primary tracking-tight",
					children: app.full_name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-sm text-muted-foreground",
					children: app.role_applied
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "ghost",
					size: "sm",
					onClick: () => {
						if (confirm("Are you sure you want to delete this application? This action cannot be undone.")) delMut.mutate();
					},
					disabled: delMut.isPending,
					className: "text-destructive hover:text-destructive hover:bg-destructive/10 -mt-1 sm:mt-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4 mr-1.5" }), "Delete"]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-6 mt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-4 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
								icon: Mail,
								label: "Email",
								value: app.email
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
								icon: Phone,
								label: "Phone",
								value: app.phone
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
								icon: Briefcase,
								label: "Company",
								value: app.company || "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
								icon: Briefcase,
								label: "Position",
								value: app.position || "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
								label: "Experience",
								value: app.years_experience || "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
								label: "Availability",
								value: app.availability || "—"
							}),
							app.linkedin_url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
								icon: ExternalLink,
								label: "LinkedIn",
								value: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: app.linkedin_url,
									target: "_blank",
									rel: "noreferrer",
									className: "text-secondary underline",
									children: "Open"
								})
							}),
							app.portfolio_url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
								icon: ExternalLink,
								label: "Portfolio",
								value: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: app.portfolio_url,
									target: "_blank",
									rel: "noreferrer",
									className: "text-secondary underline",
									children: "Open"
								})
							})
						]
					}),
					(app.state || app.college || app.graduation_year || app.hod_name || app.tp_officer_name) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-md border border-border bg-surface p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-sm font-semibold text-primary mb-3 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GraduationCap, { className: "h-4 w-4" }), " Education & Department Contacts"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 md:grid-cols-3 gap-4 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
									label: "State",
									value: app.state || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
									label: "College",
									value: app.college || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
									label: "Graduation",
									value: app.graduation_year ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
									label: "HOD",
									value: app.hod_name || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
									label: "HOD contact",
									value: app.hod_contact || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
									label: "HOD email",
									value: app.hod_email || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
									label: "T&P officer",
									value: app.tp_officer_name || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
									label: "T&P contact",
									value: app.tp_officer_contact || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
									label: "T&P email",
									value: app.tp_officer_email || "—"
								})
							]
						})]
					}),
					(projects.data?.length ?? 0) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-md border border-border bg-surface",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "px-4 py-3 border-b border-border text-sm font-semibold text-primary flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderGit2, { className: "h-4 w-4" }),
								" Candidate Projects (",
								projects.data.length,
								")"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "divide-y divide-border",
							children: projects.data.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-4 space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-medium text-foreground",
										children: p.title
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3 text-xs",
										children: [p.project_url && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
											href: p.project_url,
											target: "_blank",
											rel: "noreferrer",
											className: "text-secondary hover:underline inline-flex items-center gap-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "h-3 w-3" }), " URL"]
										}), p.document_url && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
											href: p.document_url,
											target: "_blank",
											rel: "noreferrer",
											className: "text-secondary hover:underline inline-flex items-center gap-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "h-3 w-3" }), " Document"]
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted-foreground whitespace-pre-wrap",
									children: p.summary
								})]
							}, p.id))
						})]
					}),
					app.resume_path && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-md border border-border bg-surface overflow-hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between px-4 py-3 border-b border-border",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-sm font-semibold text-primary flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-4 w-4" }),
									" Resume",
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-xs font-normal text-muted-foreground",
										children: ["· ", app.resume_path.split("/").pop()]
									})
								]
							}), resumeUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: resumeUrl,
								target: "_blank",
								rel: "noreferrer",
								className: "inline-flex items-center gap-1.5 text-xs text-secondary hover:text-primary font-medium",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "h-3.5 w-3.5" }), " Open in new tab"]
							})]
						}), resumeUrl ? isPdf ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
							src: resumeUrl + "#toolbar=1&view=FitH",
							title: "Resume preview",
							className: "w-full h-[520px] border-0 bg-white"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-6 text-sm text-muted-foreground text-center",
							children: "Inline preview available only for PDF files. Use \"Open in new tab\" to view/download."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-6 flex justify-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-5 w-5 animate-spin text-secondary" })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-md border border-border bg-surface overflow-hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between px-4 py-3 border-b border-border",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-sm font-semibold text-primary flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4 text-amber-500" }), " AI-Generated Interview Kit"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "ghost",
								onClick: regenerate,
								disabled: regenerating,
								children: regenerating ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3.5 w-3.5 mr-1.5 animate-spin" }), " Generating…"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-3.5 w-3.5 mr-1.5" }),
									" ",
									aiText ? "Regenerate" : "Generate"
								] })
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-4 max-h-[420px] overflow-y-auto",
							children: aiText ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "prose prose-sm max-w-none text-sm whitespace-pre-wrap text-foreground leading-relaxed",
								children: aiText
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm text-muted-foreground text-center py-6",
								children: regenerating ? "Analysing resume and generating questions…" : "No AI-generated questions yet. Click Generate to analyse the resume and produce a tailored interview kit."
							})
						})]
					}),
					app.message && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 font-medium",
						children: "Cover message"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-sm border border-border bg-surface p-4 text-sm whitespace-pre-wrap",
						children: app.message
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-md border border-border bg-surface p-5 space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-base font-semibold text-primary",
									children: "Change status"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-xs text-muted-foreground",
									children: [
										"Current: ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "capitalize font-medium text-foreground",
											children: currentStatus
										}),
										isTerminal && " · terminal state (no further transitions)"
									]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/_authenticated/templates",
									className: "text-xs text-secondary underline",
									children: "Edit email templates"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-2 gap-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-[11px] uppercase tracking-wider text-muted-foreground font-medium",
									children: "Next status"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: status,
									onValueChange: (v) => setStatus(v),
									disabled: isTerminal,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										className: "mt-1.5",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: options.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
										value: s,
										className: "capitalize",
										children: [
											s,
											" ",
											s === currentStatus && "(current)"
										]
									}, s)) })]
								})] })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-[11px] uppercase tracking-wider text-muted-foreground font-medium",
								children: "Note (required · logged to timeline)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								className: "mt-1.5",
								rows: 2,
								value: note,
								onChange: (e) => setNote(e.target.value),
								placeholder: "Why this change? e.g. 'Passed initial screen — schedule technical round.'"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex justify-end",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									onClick: () => statusMut.mutate(),
									disabled: statusMut.isPending || note.trim().length < 3 || isTerminal,
									className: "bg-primary hover:bg-secondary",
									children: statusMut.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), " Saving…"] }) : status === currentStatus ? "Add note" : `Move to ${status} & email applicant`
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5 font-medium",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-3 w-3" }), " Timeline"]
					}), events.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm text-muted-foreground",
						children: "Loading…"
					}) : (events.data?.length ?? 0) === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-sm text-muted-foreground",
						children: [
							"No status changes yet. Application submitted ",
							new Date(app.created_at).toLocaleString(),
							"."
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "space-y-2",
						children: events.data.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "rounded-sm border border-border bg-card p-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "font-medium",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "capitalize",
											children: e.from_status ?? "—"
										}),
										" →",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "capitalize text-primary",
											children: e.to_status
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-muted-foreground",
									children: new Date(e.created_at).toLocaleString()
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-muted-foreground mt-1 whitespace-pre-wrap",
								children: e.note
							})]
						}, e.id))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pt-4 border-t border-border",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-[11px] uppercase tracking-wider text-muted-foreground font-medium",
								children: "Internal notes (private to admins)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								className: "mt-1.5",
								rows: 3,
								value: notes,
								onChange: (e) => setNotes(e.target.value)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex justify-end mt-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									size: "sm",
									onClick: () => notesMut.mutate(),
									disabled: notesMut.isPending,
									children: notesMut.isPending ? "Saving…" : "Save notes"
								})
							})
						]
					})
				]
			})]
		})
	});
}
function InfoRow({ icon: Icon, label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 font-medium",
		children: [
			Icon && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-3 w-3" }),
			" ",
			label
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-1 text-foreground",
		children: value
	})] });
}
//#endregion
export { AdminDashboard as component };
