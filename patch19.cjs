const fs = require('fs');
const path = './src/lib/operations.functions.ts';
let code = fs.readFileSync(path, 'utf8');

// Replace in submitTaskUrl
const oldStr = 'html: <p>Hi ,</p>\\n          <p>Your task deliverable for <strong></strong> has been submitted successfully.</p>\\n          <p>Deliverable URL: <a href=""></a></p>\\n          <p>It is now queued for mentor review.</p>';

const newStr = 'html: <p>Hi ,</p>\\n          <p>Your task deliverable for <strong></strong> has been submitted successfully.</p>\\n          <p>Deliverable URL: <a href=""></a></p>\\n          <p>It is now queued for mentor review.</p>\\n          <br><p>Best,</p><p><strong>Jamieswaran Ilkumar</strong><br>Founder & CEO<br>Vyntyra Consultancy Services</p><p><img src="/signature.png" alt="Founder Signature" style="max-width: 150px;" /></p>';

// Because of exact string matching, we might have issues with whitespace. Let's just use regex.
code = code.replace(/html:\s*<p>Hi \$\{internProfile\.full_name \|\| 'Intern'\},<\/p>[\s\S]*?<p>It is now queued for mentor review\.<\/p>/, newStr);

fs.writeFileSync(path, code);
console.log('Patched');