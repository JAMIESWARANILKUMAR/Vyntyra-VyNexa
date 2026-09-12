const fs = require('fs');
const content = fs.readFileSync('src/lib/operations.functions.ts', 'utf8');
const searchStr = 'const assignedRole = roleMap.get(p.id) || (p.intern_id ? "intern" : "employee");';
const index = content.indexOf(searchStr);
if (index > -1) {
    console.log('Found it!');
} else {
    console.log('Not found exactly.');
}
