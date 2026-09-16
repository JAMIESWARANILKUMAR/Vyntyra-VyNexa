
const fs = require("fs");
let code = fs.readFileSync("src/components/feedback-popup-modal.tsx", "utf8");
code = code.replace("const slideVariants = {", "const slideVariants: any = {");
fs.writeFileSync("src/components/feedback-popup-modal.tsx", code);

