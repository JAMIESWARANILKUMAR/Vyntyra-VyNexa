
const fs = require("fs");
const files = ["src/components/tech-domain-workspace.tsx", "src/components/non-tech-domain-workspace.tsx", "src/components/management-domain-workspace.tsx"];
files.forEach(f => {
  const code = fs.readFileSync(f, "utf8");
  const matches = code.match(/\[#[a-fA-F0-9]{6}\]/g);
  console.log(f, matches ? [...new Set(matches)] : "none");
});

