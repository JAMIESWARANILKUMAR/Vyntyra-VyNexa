
const fs = require("fs");

function recolorFile(filepath) {
  if (!fs.existsSync(filepath)) return;
  let code = fs.readFileSync(filepath, "utf8");
  
  // Replace base colors
  const colorMap = {
    "amber": "emerald",
    "orange": "emerald",
    "blue": "emerald",
    "purple": "emerald",
    "indigo": "emerald",
    "teal": "emerald",
    "cyan": "emerald",
    "fuchsia": "emerald"
  };

  for (const [oldC, newC] of Object.entries(colorMap)) {
    const regex = new RegExp(`\\b(bg|text|border|from|via|to|ring|shadow|fill|stroke)-${oldC}-([0-9]{2,3})\\b`, "g");
    code = code.replace(regex, (match, prefix, shade) => {
      // Make it slightly more vivid for 600->500 maybe? The user wants VIVID.
      // Emerald 500/600 are quite vivid greens. Let us just swap to emerald first.
      return `${prefix}-${newC}-${shade}`;
    });
  }

  // Handle Hex
  code = code.replace(/from-\[#[a-fA-F0-9]{6}\]/g, "from-white");
  code = code.replace(/via-\[#[a-fA-F0-9]{6}\]/g, "via-slate-50");
  code = code.replace(/to-\[#[a-fA-F0-9]{6}\]/g, "to-white");
  code = code.replace(/bg-\[#[a-fA-F0-9]{6}\]/g, "bg-white");
  code = code.replace(/border-\[#[a-fA-F0-9]{6}\]/g, "border-slate-100");

  fs.writeFileSync(filepath, code);
  console.log(`Recolored ${filepath}`);
}

const files = [
  "src/components/tech-domain-workspace.tsx",
  "src/components/non-tech-domain-workspace.tsx",
  "src/components/management-domain-workspace.tsx",
  "src/components/employee-refer-earn.tsx"
];

files.forEach(recolorFile);

