const fs = require('fs');
const lines = fs.readFileSync('./src/lib/pdf.server.ts', 'utf8').split('\n');
// Keep only up to line 367 (index 366) and remove trailing dead code
const cleaned = lines.slice(0, 368).join('\n').trimEnd() + '\n';
fs.writeFileSync('./src/lib/pdf.server.ts', cleaned);
console.log('Cleaned. Total lines:', cleaned.split('\n').length);
