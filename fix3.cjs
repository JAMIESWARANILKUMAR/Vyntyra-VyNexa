
const fs = require("fs");
let code = fs.readFileSync("src/components/feedback-popup-modal.tsx", "utf8");
code = code.replace("if (isDismissed) return null;\\n  if (profile?.feedback", "if (isDismissed) return null;\n  if (profile?.feedback");
fs.writeFileSync("src/components/feedback-popup-modal.tsx", code);

