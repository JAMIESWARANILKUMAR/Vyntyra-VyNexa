const fs = require('fs');
const code = fs.readFileSync('src/lib/operations.functions.ts', 'utf8');
const lines = code.split('\n');
lines.forEach((line, i) => {
    if (line.includes('from(\"profiles\")') || line.includes('from(''profiles'')')) {
        console.log(lines.slice(i-2, i+10).join('\n'));
    }
});
