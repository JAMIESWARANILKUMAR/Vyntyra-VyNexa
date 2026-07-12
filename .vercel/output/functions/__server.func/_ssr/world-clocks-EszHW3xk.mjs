import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/world-clocks-EszHW3xk.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var CITIES = [
	{
		label: "Visakhapatnam",
		tz: "Asia/Kolkata",
		abbr: "IST"
	},
	{
		label: "Bengaluru",
		tz: "Asia/Kolkata",
		abbr: "IST"
	},
	{
		label: "New Delhi",
		tz: "Asia/Kolkata",
		abbr: "IST"
	},
	{
		label: "New York",
		tz: "America/New_York",
		abbr: "ET"
	},
	{
		label: "Kuala Lumpur",
		tz: "Asia/Kuala_Lumpur",
		abbr: "MYT"
	}
];
function partsForTz(tz, now) {
	const parts = new Intl.DateTimeFormat("en-GB", {
		timeZone: tz,
		hour12: false,
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		weekday: "short",
		day: "2-digit",
		month: "short",
		year: "numeric"
	}).formatToParts(now).reduce((acc, p) => {
		acc[p.type] = p.value;
		return acc;
	}, {});
	return {
		h: parseInt(parts.hour ?? "0", 10),
		m: parseInt(parts.minute ?? "0", 10),
		s: parseInt(parts.second ?? "0", 10),
		date: `${parts.weekday}, ${parts.day} ${parts.month} ${parts.year}`,
		time: `${parts.hour}:${parts.minute}:${parts.second}`
	};
}
function AnalogClock({ h, m, s, size = 68 }) {
	const hourAngle = (h % 12 + m / 60) * 30;
	const minAngle = (m + s / 60) * 6;
	const secAngle = s * 6;
	const r = size / 2;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: `0 0 ${size} ${size}`,
		width: size,
		height: size,
		className: "shrink-0",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: r,
				cy: r,
				r: r - 1.5,
				fill: "white",
				stroke: "currentColor",
				strokeOpacity: "0.25",
				strokeWidth: "1.5"
			}),
			Array.from({ length: 12 }).map((_, i) => {
				const a = i * 30 * Math.PI / 180;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: r + Math.sin(a) * (r - 4),
					y1: r - Math.cos(a) * (r - 4),
					x2: r + Math.sin(a) * (r - (i % 3 === 0 ? 8 : 6)),
					y2: r - Math.cos(a) * (r - (i % 3 === 0 ? 8 : 6)),
					stroke: "currentColor",
					strokeOpacity: i % 3 === 0 ? .7 : .35,
					strokeWidth: i % 3 === 0 ? 1.4 : .9
				}, i);
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: r,
				y1: r,
				x2: r + Math.sin(hourAngle * Math.PI / 180) * (r * .45),
				y2: r - Math.cos(hourAngle * Math.PI / 180) * (r * .45),
				stroke: "currentColor",
				strokeWidth: "2.6",
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: r,
				y1: r,
				x2: r + Math.sin(minAngle * Math.PI / 180) * (r * .7),
				y2: r - Math.cos(minAngle * Math.PI / 180) * (r * .7),
				stroke: "currentColor",
				strokeWidth: "1.8",
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: r,
				y1: r,
				x2: r + Math.sin(secAngle * Math.PI / 180) * (r * .78),
				y2: r - Math.cos(secAngle * Math.PI / 180) * (r * .78),
				stroke: "#C9A227",
				strokeWidth: "1",
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: r,
				cy: r,
				r: "1.8",
				fill: "#C9A227"
			})
		]
	});
}
function useIsMobile() {
	const [isMobile, setIsMobile] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const mq = window.matchMedia("(max-width: 640px)");
		const update = () => setIsMobile(mq.matches);
		update();
		mq.addEventListener("change", update);
		return () => mq.removeEventListener("change", update);
	}, []);
	return isMobile;
}
function WorldClocks({ variant = "light" }) {
	const [now, setNow] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		let timeoutId = null;
		let cancelled = false;
		const tick = () => {
			if (cancelled) return;
			const d = /* @__PURE__ */ new Date();
			setNow(d);
			const delay = 1e3 - d.getTime() % 1e3;
			timeoutId = setTimeout(tick, delay);
		};
		const start = () => {
			if (timeoutId) clearTimeout(timeoutId);
			tick();
		};
		const stop = () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
		};
		const onVis = () => document.hidden ? stop() : start();
		start();
		document.addEventListener("visibilitychange", onVis);
		return () => {
			cancelled = true;
			stop();
			document.removeEventListener("visibilitychange", onVis);
		};
	}, []);
	const isMobile = useIsMobile();
	if (!now) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-[110px]",
		"aria-hidden": true
	});
	const isDark = variant === "dark";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md border " + (isDark ? "border-primary-foreground/15 bg-primary-foreground/[0.03]" : "border-border bg-card"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "px-3 sm:px-4 py-2 border-b flex items-center justify-between " + (isDark ? "border-primary-foreground/10" : "border-border bg-surface"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[10px] uppercase tracking-[0.2em] font-semibold " + (isDark ? "text-gold" : "text-secondary"),
				children: "Global Operations · Live Time"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[10px] sm:text-[11px] font-mono " + (isDark ? "text-primary-foreground/60" : "text-muted-foreground"),
				children: Intl.DateTimeFormat().resolvedOptions().timeZone
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 p-3 sm:p-4",
			children: CITIES.map((c) => {
				const p = partsForTz(c.tz, now);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 sm:gap-3 rounded-sm border px-2 sm:px-3 py-2 " + (isDark ? "border-primary-foreground/10 bg-primary-foreground/[0.03] text-primary-foreground" : "border-border bg-surface text-foreground"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: isDark ? "text-primary-foreground/85" : "text-primary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnalogClock, {
							h: p.h,
							m: p.m,
							s: p.s,
							size: isMobile ? 52 : 68
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold truncate",
								children: c.label
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-mono text-base sm:text-lg leading-tight tabular-nums",
								children: p.time
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-[9px] sm:text-[10px] mt-0.5 leading-tight " + (isDark ? "text-primary-foreground/55" : "text-muted-foreground"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "hidden sm:inline",
									children: [p.date, " · "]
								}), c.abbr]
							})
						]
					})]
				}, c.label);
			})
		})]
	});
}
//#endregion
export { WorldClocks as t };
