const fs = require('fs');
let code = fs.readFileSync('src/lib/operations.functions.ts', 'utf8');
code = code.replace(
  'const assignedRole = roleMap.get(p.id) || (p.intern_id ? "intern" : "employee");',
  'const assignedRole = roleMap.get(p.id) || p.role || (p.intern_id ? "intern" : "employee");'
);
fs.writeFileSync('src/lib/operations.functions.ts', code);
console.log('Fixed assignedRole fallback');
