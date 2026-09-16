
const fs = require("fs");
let code = fs.readFileSync("src/components/employee-refer-earn.tsx", "utf8");

// Hex backgrounds
code = code.replace(/bg-\[#0E131F\]/g, "bg-white");
code = code.replace(/bg-\[#131B2E\]/g, "bg-slate-50");
code = code.replace(/from-\[#0E131F\]/g, "from-white");
code = code.replace(/via-\[#131B2E\]/g, "via-slate-50");
code = code.replace(/to-slate-900/g, "to-white");

// Texts
code = code.replace(/text-white/g, "text-slate-900");
code = code.replace(/text-slate-400/g, "text-slate-500");
code = code.replace(/text-slate-300/g, "text-slate-600");
code = code.replace(/text-slate-200/g, "text-slate-700");
code = code.replace(/text-slate-100/g, "text-slate-800");

// Borders
code = code.replace(/border-slate-800/g, "border-slate-200");
code = code.replace(/border-slate-700/g, "border-slate-300");

// Backgrounds
code = code.replace(/bg-slate-950/g, "bg-white");
code = code.replace(/bg-slate-900/g, "bg-slate-50");
code = code.replace(/bg-slate-800/g, "bg-slate-100");
code = code.replace(/hover:bg-slate-800/g, "hover:bg-slate-200");

// Vivid Emeralds
// We want vivid!
code = code.replace(/text-emerald-400/g, "text-emerald-600");
code = code.replace(/text-emerald-300/g, "text-emerald-700");
code = code.replace(/text-emerald-200/g, "text-emerald-800");
code = code.replace(/bg-emerald-950/g, "bg-emerald-50");
code = code.replace(/border-emerald-500\/40/g, "border-emerald-300");
code = code.replace(/border-emerald-500\/30/g, "border-emerald-300");
code = code.replace(/bg-emerald-600/g, "bg-emerald-600"); // Keep

// Indigo -> Emerald
code = code.replace(/text-indigo-400/g, "text-emerald-600");
code = code.replace(/text-indigo-300/g, "text-emerald-700");
code = code.replace(/bg-indigo-950/g, "bg-emerald-50");
code = code.replace(/border-indigo-500/g, "border-emerald-300");
code = code.replace(/bg-indigo-500/g, "bg-emerald-500");
code = code.replace(/bg-indigo-600/g, "bg-emerald-600");

// Purple -> Emerald
code = code.replace(/bg-purple-950/g, "bg-emerald-50");
code = code.replace(/text-purple-300/g, "text-emerald-700");
code = code.replace(/border-purple-500/g, "border-emerald-300");

// Amber (Keep for pending, but make it light)
code = code.replace(/bg-amber-950/g, "bg-amber-50");
code = code.replace(/text-amber-300/g, "text-amber-700");
code = code.replace(/border-amber-500/g, "border-amber-300");

fs.writeFileSync("src/components/employee-refer-earn.tsx", code);

