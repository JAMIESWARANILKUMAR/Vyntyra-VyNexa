const fs = require('fs');
const path = './src/lib/pdf.server.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace('const signY = 238;', 'const signY = 248;');
code = code.replace('doc.text(splitSignInfo, 20, termsY + 28);', 'doc.text(splitSignInfo, 20, termsY + 30);');

fs.writeFileSync(path, code);
console.log('Fixed alignments in pdf.server.ts');