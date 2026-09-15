const fs = require('fs');
const path = './src/lib/workflow.functions.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
    /const signatureBase64 = await urlToBase64\(branding\.founder_signature_url \|\| "\/signature\.png"\);/g,
    'const signatureBase64 = await urlToBase64(branding.founder_signature_url || "https://kommodo.ai/i/olXE11N8ipqBTR8DBSXt");'
);

fs.writeFileSync(path, code);
console.log('Fixed NOC base64 defaults in workflow!');