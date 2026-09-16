
const fs = require("fs");

function recolorWorkspace(filepath) {
  let code = fs.readFileSync(filepath, "utf8");
  
  const colors = ["orange", "amber", "indigo", "blue", "purple", "pink", "sky", "zinc"];
  colors.forEach(old => {
    code = code.replace(new RegExp(`\\b(bg|text|border|from|via|to|ring|shadow)-${old}-([0-9]{2,3})\\b`, "g"), (match, p1, p2) => {
      return `${p1}-emerald-${p2}`;
    });
  });

  fs.writeFileSync(filepath, code);
  console.log(`Recolored ${filepath}`);
}

recolorWorkspace("src/components/tech-domain-workspace.tsx");
recolorWorkspace("src/components/non-tech-domain-workspace.tsx");
recolorWorkspace("src/components/management-domain-workspace.tsx");

