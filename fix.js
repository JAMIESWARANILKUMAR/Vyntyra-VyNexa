
const fs = require("fs");
let code = fs.readFileSync("src/components/feedback-popup-modal.tsx", "utf8");
code = code.replace("useState(false);\\n  const [isDismissed", "useState(false);\n  const [isDismissed");
code = code.replace("return null;\\n  if (profile?", "return null;\n  if (profile?");
fs.writeFileSync("src/components/feedback-popup-modal.tsx", code);

