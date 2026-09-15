const fs = require('fs');
const path = './src/lib/operations.functions.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
    /const signatureBase64 = await urlToBase64\(branding\.founder_signature_url \|\| "\/signature\.png"\);/g,
    'const signatureBase64 = await urlToBase64(branding.founder_signature_url || "https://kommodo.ai/i/olXE11N8ipqBTR8DBSXt");'
);

code = code.replace(
    /const logoBase64 = await urlToBase64\(branding\.vyntyra_logo_url \|\| "\/icon-512\.png"\);/g,
    'const logoBase64 = await urlToBase64(branding.vyntyra_logo_url || "https://careers.vyntyraconsultancyservices.in/icon-512.png");'
);

fs.writeFileSync(path, code);
console.log('Fixed NOC base64 defaults!');