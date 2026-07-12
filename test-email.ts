import { sendTemplateEmail } from "./src/lib/email-templates/send-email.ts";
import { TEMPLATES } from "./src/lib/email-templates/registry.ts";

async function main() {
    const to = "jamianil37@gmail.com";
    const templateName = "application-applicant";
    const data = TEMPLATES[templateName].previewData || {};
    
    console.log(`Sending ${templateName} to ${to}...`);
    try {
        const result = await sendTemplateEmail(templateName, to, { templateData: data });
        console.log("Result:", result);
    } catch (e) {
        console.error("Failed:", e);
    }
}

main();
