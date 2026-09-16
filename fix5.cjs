
const fs = require("fs");
let code = fs.readFileSync("src/components/admin-intern-tasks-view.tsx", "utf8");
code = code.replace(/setTab\("reviewed"\)/g, "setTab(\"submissions\")");
code = code.replace(/tab === "reviewed"/g, "tab === \"submissions\"");
code = code.replace(/t\./g, "task.");
fs.writeFileSync("src/components/admin-intern-tasks-view.tsx", code);
let pdfCode = fs.readFileSync("src/lib/pdf.server.ts", "utf8");
pdfCode = pdfCode.replace(/doc\.setLineDash/g, "doc.setLineDashPattern");
fs.writeFileSync("src/lib/pdf.server.ts", pdfCode);

