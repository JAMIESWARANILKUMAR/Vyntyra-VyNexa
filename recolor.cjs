
const fs = require("fs");

function recolorFile(filepath) {
  let code = fs.readFileSync(filepath, "utf8");
  
  // Base colors to replace
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
    // Replace bg-old-*, text-old-*, border-old-*, from-old-*, via-old-*, to-old-*
    const regex = new RegExp(`\\b(bg|text|border|from|via|to|ring|shadow)-${oldC}-([0-9]{2,3})\\b`, "g");
    code = code.replace(regex, (match, prefix, shade) => {
      return `${prefix}-${newC}-${shade}`;
    });
  }

  // Make sure inactive tabs or buttons become transparent as requested: "transparent buttons"
  // If the user wants "transparent buttons", it might mean active is solid, inactive is transparent.
  // Actually, standard `bg-slate-100` might be okay, but I can just stick to `emerald` conversions first.

  fs.writeFileSync(filepath, code);
  console.log(`Recolored ${filepath}`);
}

recolorFile("src/routes/_authenticated/intern.tsx");
recolorFile("src/components/employee-refer-earn.tsx");

