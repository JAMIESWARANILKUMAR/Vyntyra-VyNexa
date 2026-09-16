
const fs = require("fs");
let code = fs.readFileSync("src/components/employee-refer-earn.tsx", "utf8");

const colors = ["indigo", "purple", "blue", "pink", "cyan"];
colors.forEach(old => {
  code = code.replace(new RegExp(`\\b(bg|text|border|from|via|to|ring|shadow)-${old}-([0-9]{2,3})\\b`, "g"), (match, p1, p2) => {
    // If it was dark (900/950), make it light (50/100)
    let newShade = p2;
    if (p2 === "950" || p2 === "900") newShade = "50";
    if (p2 === "800") newShade = "100";
    if (p2 === "400") newShade = "600";
    if (p2 === "300") newShade = "700";
    if (p2 === "200") newShade = "800";
    
    return `${p1}-emerald-${newShade}`;
  });
});

fs.writeFileSync("src/components/employee-refer-earn.tsx", code);

