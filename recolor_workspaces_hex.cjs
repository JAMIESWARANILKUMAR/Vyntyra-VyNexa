
const fs = require("fs");
const files = ["src/components/tech-domain-workspace.tsx", "src/components/management-domain-workspace.tsx"];
files.forEach(f => {
  let code = fs.readFileSync(f, "utf8");
  code = code.replace(/from-\[#[a-fA-F0-9]{6}\]/g, "from-white");
  code = code.replace(/via-\[#[a-fA-F0-9]{6}\]/g, "via-slate-50");
  code = code.replace(/to-\[#[a-fA-F0-9]{6}\]/g, "to-white");
  code = code.replace(/bg-\[#[a-fA-F0-9]{6}\]/g, "bg-white");
  code = code.replace(/border-\[#[a-fA-F0-9]{6}\]/g, "border-slate-100");
  fs.writeFileSync(f, code);
  console.log("Stripped hex from", f);
});

