const fs = require('fs');
let code = fs.readFileSync('patch_pdf_premium.cjs', 'utf8');
code = code.replace(
    'Confidential A Vyntyra Consultancy Services Ac 2026', 
    'Confidential | Vyntyra Consultancy Services (C) 2026'
);
fs.writeFileSync('patch_pdf_premium.cjs', code);