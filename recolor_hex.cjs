
const fs = require("fs");

function recolorHex(filepath) {
  let code = fs.readFileSync(filepath, "utf8");
  
  // Replace all the light orange-ish hex codes with generic white/slate-50
  code = code.replace(/from-\[#[Ff]{3}[A-Fa-f0-9]{3}\]/g, "from-slate-50");
  code = code.replace(/via-\[#[Ff]{3}[A-Fa-f0-9]{3}\]/g, "via-white");
  code = code.replace(/to-\[#[Ff]{3}[A-Fa-f0-9]{3}\]/g, "to-slate-50");
  
  code = code.replace(/bg-\[#[Ff]{3}[A-Fa-f0-9]{3}\]/g, "bg-white");
  code = code.replace(/border-\[#[Ff]{3}[A-Fa-f0-9]{3}\]/g, "border-slate-100");

  fs.writeFileSync(filepath, code);
  console.log(`Recolored hex in ${filepath}`);
}

recolorHex("src/routes/_authenticated/intern.tsx");
recolorHex("src/components/employee-refer-earn.tsx");

