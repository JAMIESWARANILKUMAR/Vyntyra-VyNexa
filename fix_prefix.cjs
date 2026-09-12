const fs = require('fs');
let code = fs.readFileSync('src/lib/operations.functions.ts', 'utf8');

// The block we want to replace
const searchBlock = 'const assignedRole = roleMap.get(p.id) || p.role || (p.intern_id ? "intern" : "employee");';

// The replacement logic
const replacementBlock = \
        let calculatedRole = p.role;
        
        // Explicit ID-based checking (EMP = employee, INT = intern)
        if (p.employee_id && String(p.employee_id).toUpperCase().startsWith("EMP")) {
          calculatedRole = "employee";
        } else if (p.intern_id && String(p.intern_id).toUpperCase().startsWith("EMP")) {
          calculatedRole = "employee";
        } else if (p.intern_id && String(p.intern_id).toUpperCase().startsWith("INT")) {
          calculatedRole = "intern";
        } else if (p.employee_id && String(p.employee_id).toUpperCase().startsWith("INT")) {
          calculatedRole = "intern";
        } else if (!calculatedRole) {
          calculatedRole = p.intern_id ? "intern" : "employee"; // last resort fallback
        }

        const assignedRole = roleMap.get(p.id) || calculatedRole;
\;

code = code.replace(searchBlock, replacementBlock);
fs.writeFileSync('src/lib/operations.functions.ts', code);
console.log('Updated role logic based on EMP/INT prefix');
