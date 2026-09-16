
const fs = require("fs");
function check(file) {
  const code = fs.readFileSync(file, "utf8");
  const matches = code.match(/\[#[a-fA-F0-9]{6}\]/g);
  console.log(file, matches ? [...new Set(matches)] : "none");
}
check("src/routes/_authenticated/intern.tsx");
check("src/components/employee-refer-earn.tsx");

