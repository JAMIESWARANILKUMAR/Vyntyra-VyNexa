
const fs = require("fs");

function recolorHex(filepath) {
  let code = fs.readFileSync(filepath, "utf8");
  
  // Replace all remaining tailwind hex colors with standard slate/white colors.
  // Using slate-50 for any from-, via-, to-, bg-, border- that uses a hex.
  code = code.replace(/from-\[#[a-fA-F0-9]{6}\]/g, "from-white");
  code = code.replace(/via-\[#[a-fA-F0-9]{6}\]/g, "via-slate-50");
  code = code.replace(/to-\[#[a-fA-F0-9]{6}\]/g, "to-white");
  code = code.replace(/bg-\[#[a-fA-F0-9]{6}\]/g, "bg-white");
  code = code.replace(/border-\[#[a-fA-F0-9]{6}\]/g, "border-slate-100");

  fs.writeFileSync(filepath, code);
  console.log(`Recolored remaining hex in ${filepath}`);
}

recolorHex("src/routes/_authenticated/intern.tsx");
recolorHex("src/components/employee-refer-earn.tsx");

