
const fs = require("fs");
const code = fs.readFileSync("src/routes/_authenticated/intern.tsx", "utf8");
const matches = code.match(/import .* from "[^"]+"/g);
if (matches) console.log(matches.join("\n"));

