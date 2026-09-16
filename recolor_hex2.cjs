
const fs = require("fs");

function recolorHex(filepath) {
  let code = fs.readFileSync(filepath, "utf8");
  
  // Just strip them and use tailwind classes directly
  code = code.replace(/bg-gradient-to-br from-\[#[^\]]+\] via-\[#[^\]]+\] to-\[#[^\]]+\]/g, "bg-slate-50");
  code = code.replace(/from-\[#[^\]]+\] via-\[#[^\]]+\] to-\[#[^\]]+\]/g, "bg-slate-50");
  code = code.replace(/bg-\[#[^\]]+\]/g, "bg-white");
  code = code.replace(/border-\[#[^\]]+\]/g, "border-slate-100");

  fs.writeFileSync(filepath, code);
  console.log(`Recolored hex 2 in ${filepath}`);
}

recolorHex("src/routes/_authenticated/intern.tsx");
recolorHex("src/components/employee-refer-earn.tsx");

