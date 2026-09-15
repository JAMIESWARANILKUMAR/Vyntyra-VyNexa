const fs = require('fs');
const path = './src/lib/operations.functions.ts';
let code = fs.readFileSync(path, 'utf8');

const anchor = `export const purgeAllNocs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const admin = getAdminClient();
    await admin.from("profiles").update({ noc_url: null, updated_at: new Date().toISOString() }).neq("id", "00000000-0000-0000-0000-000000000000");
    await admin.from("applications").update({ noc_url: null, updated_at: new Date().toISOString() }).neq("id", "00000000-0000-0000-0000-000000000000");
    return { success: true, message: "All stored NOC links successfully purged." };
  });`;

const additions = `export const bulkDeleteOfferLetters = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const admin = getAdminClient();
    await admin.from("profiles").update({ offer_letter_url: null, updated_at: new Date().toISOString() }).neq("id", "00000000-0000-0000-0000-000000000000");
    await admin.from("applications").update({ offer_letter_url: null, updated_at: new Date().toISOString() }).neq("id", "00000000-0000-0000-0000-000000000000");
    try {
       const { data: files } = await admin.storage.from("default").list("offer_letters", { limit: 1000 });
       if (files && files.length > 0) {
         await admin.storage.from("default").remove(files.map(f => \`offer_letters/\${f.name}\`));
       }
    } catch(e) {}
    return { success: true, message: "All Offer Letters successfully deleted." };
  });

export const bulkRegenerateOfferLetters = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const admin = getAdminClient();
    const { data: interns } = await admin.from("profiles").select("id, email").eq("role", "intern");
    if (!interns) return { success: false, message: "No interns found" };
    
    let successCount = 0;
    for (const intern of interns) {
       try {
         await deleteStoredOfferLetterAndRegenerate({ data: { profileId: intern.id, email: intern.email } });
         successCount++;
       } catch(e) {
         console.warn("Failed to regenerate offer letter for", intern.email, e);
       }
    }
    return { success: true, count: successCount, message: \`Regenerated offer letters for \${successCount} interns.\` };
  });

`;

// Let's use regex to insert this securely.
code = code.replace(/export const purgeAllNocs = createServerFn\(\{ method: "POST" \}\)[\s\S]*?return \{ success: true, message: "All stored NOC links successfully purged." \};\n  \}\);/, (match) => {
    return match + "\n\n" + additions;
});

fs.writeFileSync(path, code);
console.log('Added bulk actions to operations.functions.ts');
