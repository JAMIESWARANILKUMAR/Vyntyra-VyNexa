const fs = require('fs');
const path = './src/lib/operations.functions.ts';
let code = fs.readFileSync(path, 'utf8');

const target1 = `        offerLetterUrl = await generateOfferLetterPDF({
          fullName: app.full_name,
          roleApplied: app.role_applied,
          applicationId: app.id,
          salary: app.salary || "Performance Based Stipend",
          joiningDate: startDateVal,
          endDate: endDateVal,
          jobLocation: app.job_location || "Remote Work-from-Home",
        });`;
        
const replace1 = `        offerLetterUrl = await generateOfferLetterPDF({
          fullName: app.full_name,
          roleApplied: app.role_applied,
          applicationId: app.id,
          salary: app.salary || "Performance Based Stipend",
          joiningDate: startDateVal,
          endDate: endDateVal,
          jobLocation: app.job_location || "Remote Work-from-Home",
          domain: app.domain,
          subDomain: app.sub_domain,
        });`;

const target2 = `    const freshOfferLetterUrl = await generateOfferLetterPDF({
      fullName: app.full_name,
      roleApplied: app.role_applied || app.sub_domain || "Software Engineering Intern",
      applicationId: app.id,
      salary: app.salary || "Performance Based Stipend",
      joiningDate: startDateVal,
      endDate: endDateVal,
      jobLocation: app.job_location || "Remote Work-from-Home",
    });`;

const replace2 = `    const freshOfferLetterUrl = await generateOfferLetterPDF({
      fullName: app.full_name,
      roleApplied: app.role_applied || app.sub_domain || "Software Engineering Intern",
      applicationId: app.id,
      salary: app.salary || "Performance Based Stipend",
      joiningDate: startDateVal,
      endDate: endDateVal,
      jobLocation: app.job_location || "Remote Work-from-Home",
      domain: app.domain,
      subDomain: app.sub_domain,
    });`;

// Wait, the indentations in the file for target2:
//       fullName: app.full_name,
// So it is 6 spaces or 8? Let's use regex to be safe.

code = code.replace(/fullName: app\.full_name,[\s\S]*?jobLocation: app\.job_location \|\| "Remote Work-from-Home",\n\s*\}\);/g, function(match) {
    return match.replace(/jobLocation: app\.job_location \|\| "Remote Work-from-Home",\n(\s*)\}\);/, 'jobLocation: app.job_location || "Remote Work-from-Home",\n$1  domain: app.domain,\n$1  subDomain: app.sub_domain,\n$1});');
});

fs.writeFileSync(path, code);
console.log('Patched operations.functions.ts');
