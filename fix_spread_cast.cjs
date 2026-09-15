const fs = require('fs');
let code = fs.readFileSync('./src/lib/pdf.server.ts', 'utf8');

// Replace spread-with-cast patterns like `...navy as [number,number,number]`
// with explicit destructuring: `navy[0], navy[1], navy[2]`
// Handles all colour variable names used in the file
const vars = ['navy', 'slate', 'ink', 'mist', 'rule', 'black', 'gold'];
for (const v of vars) {
  // Match: ...navy as [number,number,number]  OR  ...navy as [number, number, number]
  const re = new RegExp(`\\.\\.\\.${v}\\s+as\\s+\\[number,\\s*number,\\s*number\\]`, 'g');
  code = code.replace(re, `${v}[0], ${v}[1], ${v}[2]`);
}

fs.writeFileSync('./src/lib/pdf.server.ts', code);
console.log('Patched spread-cast patterns. Verifying...');
// Make sure no spread patterns remain
const remaining = [...code.matchAll(/\.\.\.[a-z]+ as \[number/g)];
console.log('Remaining spread patterns:', remaining.length);
