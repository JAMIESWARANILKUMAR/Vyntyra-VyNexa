const fs = require('fs');
const path = './src/lib/operations.functions.ts';
let code = fs.readFileSync(path, 'utf8');

const bulkNocFunctions = `
export async function bulkDeleteNocs() {
  const { createAdminClient } = await import("@/lib/supabase.server");
  const adminClient = await createAdminClient();
  const { data: apps, error } = await adminClient.from("applications").select("id, noc_url").not("noc_url", "is", null);
  if (error) throw new Error("Failed to fetch applications");

  const filesToDelete = apps.map(app => \`noc_documents/\${app.id}_NOC.pdf\`);
  if (filesToDelete.length > 0) {
    await adminClient.storage.from("default").remove(filesToDelete);
  }

  await adminClient.from("applications").update({ noc_url: null }).not("noc_url", "is", null);
  await adminClient.from("profiles").update({ noc_url: null }).not("noc_url", "is", null);

  return { message: "All NOCs deleted successfully" };
}

export async function bulkRegenerateNocs() {
  const { createAdminClient } = await import("@/lib/supabase.server");
  const adminClient = await createAdminClient();
  const { data: interns, error } = await adminClient
    .from("profiles")
    .select("id, role, application_id")
    .eq("role", "intern");
  if (error) throw new Error("Failed to fetch interns");

  let count = 0;
  for (const intern of interns) {
    if (intern.application_id) {
      try {
        await deleteStoredNocAndRegenerate(intern.application_id);
        count++;
      } catch (err) {
        console.error("Failed to regenerate NOC for", intern.id, err);
      }
    }
  }

  return { message: \`Successfully regenerated \${count} NOCs.\` };
}
`;

if (!code.includes('export async function bulkDeleteNocs')) {
    code += '\n' + bulkNocFunctions;
    fs.writeFileSync(path, code);
    console.log('Added bulk NOC functions!');
} else {
    console.log('Bulk NOC functions already exist.');
}