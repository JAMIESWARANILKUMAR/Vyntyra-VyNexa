const fs = require('fs');
let code = fs.readFileSync('src/lib/operations.functions.ts', 'utf8');

code = code.replace(
    /const { createAdminClient } = await import\("@\/lib\/supabase\.server"\);\s*const adminClient = await createAdminClient\(\);/g,
    'const adminClient = getAdminClient();'
);
fs.writeFileSync('src/lib/operations.functions.ts', code);