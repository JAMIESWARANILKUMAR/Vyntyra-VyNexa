
const fs = require("fs");
const code = fs.readFileSync("src/routes/_authenticated/intern.tsx", "utf8");
const match = code.match(/<div className="min-h-screen[^>]*>/);
console.log(match ? match[0] : "Not found");

