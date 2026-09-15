const fs = require('fs');
const path = './src/lib/operations.functions.ts';
let code = fs.readFileSync(path, 'utf8');

// The broken bulkRegenerateNocs that calls deleteStoredNocAndRegenerate incorrectly
const oldFn = `export async function bulkRegenerateNocs() {
    const adminClient = getAdminClient();
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
  }`;

const newFn = `export async function bulkRegenerateNocs() {
    const adminClient = getAdminClient();
    const { data: interns, error } = await adminClient
      .from("profiles")
      .select("id, role, application_id")
      .eq("role", "intern");
    if (error) throw new Error("Failed to fetch interns");

    const { urlToBase64, generateNocPdf } = await import("./nocGenerator");
    const { getBrandingSettings } = await import("./settings.functions");
    const branding = await getBrandingSettings();

    const logoBase64 = await urlToBase64(branding.vyntyra_logo_url || "https://careers.vyntyraconsultancyservices.in/icon-512.png");
    const signatureBase64 = await urlToBase64(branding.founder_signature_url || "https://kommodo.ai/i/olXE11N8ipqBTR8DBSXt");

    let count = 0;
    for (const intern of interns) {
      if (!intern.application_id) continue;
      try {
        const { data: app } = await adminClient
          .from("applications")
          .select("*")
          .eq("id", intern.application_id)
          .maybeSingle();
        if (!app) continue;

        const verificationUrl = \`https://careers.vyntyraconsultancyservices.in/verify?id=\${app.id}\`;
        const QRCode = (await import("qrcode")).default;
        const qrBase64 = await QRCode.toDataURL(verificationUrl, { margin: 1, color: { dark: '#0f172a', light: '#ffffff' } });

        let photoBase64: string | null = null;
        if (app.profile_photo_url) {
          photoBase64 = await urlToBase64(app.profile_photo_url);
        }

        const startDateVal = app.internship_start_date || app.joining_date || new Date().toISOString();
        const formattedStartDate = new Date(startDateVal).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

        const doc = generateNocPdf({
          fullName: app.full_name,
          email: app.email,
          phone: app.phone,
          applicationId: app.id,
          college: app.college || "Academic Institution",
          domain: app.domain || "Technology & Software",
          subDomain: app.sub_domain || "Full Stack Web Development",
          internshipStartDate: formattedStartDate,
          profilePhotoUrl: photoBase64,
          qrCodeBase64: qrBase64,
          logoBase64: logoBase64,
          signatureBase64: signatureBase64,
          hodName: app.hod_name,
        });

        const pdfOutput = doc.output("arraybuffer");
        const pdfBuffer = Buffer.from(pdfOutput);
        const filepath = \`nocs/\${app.id}_NOC.pdf\`;

        await adminClient.storage.from("default").upload(filepath, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true
        });

        const { data: signedData } = await adminClient.storage.from("default").createSignedUrl(filepath, 7776000);
        const nocUrl = signedData?.signedUrl || adminClient.storage.from("default").getPublicUrl(filepath).data.publicUrl;

        await adminClient.from("applications").update({ noc_url: nocUrl }).eq("id", app.id);
        await adminClient.from("profiles").update({ noc_url: nocUrl }).eq("id", intern.id);

        count++;
      } catch (err) {
        console.error("Failed to regenerate NOC for intern", intern.id, err);
      }
    }

    return { message: \`Successfully regenerated \${count} NOCs.\` };
  }`;

if (code.includes(oldFn)) {
  code = code.replace(oldFn, newFn);
  fs.writeFileSync(path, code);
  console.log('Fixed bulkRegenerateNocs!');
} else {
  // Try trimmed whitespace matching
  const trimmedOld = oldFn.replace(/\s+/g, ' ');
  const idx = code.replace(/\s+/g, ' ').indexOf(trimmedOld);
  if (idx !== -1) {
    console.log('Found with whitespace normalization but cannot replace safely. Check manually.');
  } else {
    console.log('Could not find bulkRegenerateNocs to replace. Appending...');
    // Append a fixed version
    fs.appendFileSync(path, '\n\n' + newFn);
    console.log('Appended fixed bulkRegenerateNocs');
  }
}
