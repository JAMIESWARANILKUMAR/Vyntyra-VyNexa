const fs = require('fs');
let code = fs.readFileSync('src/lib/pdf.server.ts', 'utf8');

code = code.replace(
    'const { createAdminClient } = await import("./supabase.server");',
    ''
);
code = code.replace(
    'const supabase = await createAdminClient();',
    'const { getAdminClient } = await import("@/integrations/supabase/admin");\\n  const supabase = getAdminClient();'
);
fs.writeFileSync('src/lib/pdf.server.ts', code);