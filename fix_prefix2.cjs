const fs = require('fs');
let code = fs.readFileSync('src/lib/operations.functions.ts', 'utf8');

const searchBlock = 'const assignedRole = roleMap.get(p.id) || p.role || (p.intern_id ? \"intern\" : \"employee\");';

const replacementBlock = 
  '        let calculatedRole = p.role;\n' +
  '        \n' +
  '        // Explicit ID-based checking (EMP = employee, INT = intern)\n' +
  '        if (p.employee_id && String(p.employee_id).toUpperCase().startsWith(\"EMP\")) {\n' +
  '          calculatedRole = \"employee\";\n' +
  '        } else if (p.intern_id && String(p.intern_id).toUpperCase().startsWith(\"EMP\")) {\n' +
  '          calculatedRole = \"employee\";\n' +
  '        } else if (p.intern_id && String(p.intern_id).toUpperCase().startsWith(\"INT\")) {\n' +
  '          calculatedRole = \"intern\";\n' +
  '        } else if (p.employee_id && String(p.employee_id).toUpperCase().startsWith(\"INT\")) {\n' +
  '          calculatedRole = \"intern\";\n' +
  '        } else if (!calculatedRole) {\n' +
  '          calculatedRole = p.intern_id ? \"intern\" : \"employee\";\n' +
  '        }\n' +
  '\n' +
  '        const assignedRole = roleMap.get(p.id) || calculatedRole;\n';

code = code.replace(searchBlock, replacementBlock);
fs.writeFileSync('src/lib/operations.functions.ts', code);
console.log('Updated role logic based on EMP/INT prefix');
