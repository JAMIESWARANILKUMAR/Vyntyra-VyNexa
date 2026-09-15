const fs = require('fs');
const path = './src/lib/pdf.server.ts';
let code = fs.readFileSync(path, 'utf8');

// Update IOfferDetails
code = code.replace(
    /export interface IOfferDetails \{[\s\S]*?\}/,
    \export interface IOfferDetails {
  fullName: string;
  roleApplied: string;
  applicationId: string;
  salary?: string;
  joiningDate?: string;
  endDate?: string;
  jobLocation?: string;
  domain?: string;
  subDomain?: string;
}\
);

// Update Job Details Card
const oldCardStr = \  //  JOB DETAILS CARD (Structured Premium Table Layout) 
  const cardY = 120;
  doc.setFillColor(lightGrey[0], lightGrey[1], lightGrey[2]);
  doc.rect(20, cardY, 170, 60, "F");
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.rect(20, cardY, 170, 60, "S");

  // Table Headers / Lines
  doc.setDrawColor(235, 235, 235);
  doc.line(20, cardY + 12, 190, cardY + 12);
  doc.line(20, cardY + 24, 190, cardY + 24);
  doc.line(20, cardY + 36, 190, cardY + 36);
  doc.line(20, cardY + 48, 190, cardY + 48);

  // Table content
  doc.setFont("helvetica", "bold");
  doc.text("Position / Title:", 25, cardY + 8);
  doc.setFont("helvetica", "normal");
  doc.text(details.roleApplied, 75, cardY + 8);

  doc.setFont("helvetica", "bold");
  doc.text("Total Compensation (CTC):", 25, cardY + 20);
  doc.setFont("helvetica", "normal");
  doc.text(details.salary || "As mutually agreed", 75, cardY + 20);

  doc.setFont("helvetica", "bold");
  doc.text("Start Date:", 25, cardY + 32);
  doc.setFont("helvetica", "normal");
  doc.text(details.joiningDate ? new Date(details.joiningDate).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : "To be confirmed", 75, cardY + 32);

  doc.setFont("helvetica", "bold");
  doc.text("End Date:", 25, cardY + 44);
  doc.setFont("helvetica", "normal");
  doc.text(details.endDate ? new Date(details.endDate).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : "To be confirmed", 75, cardY + 44);

  doc.setFont("helvetica", "bold");
  doc.text("Job Location:", 25, cardY + 56);
  doc.setFont("helvetica", "normal");
  doc.text(details.jobLocation || "Visakhapatnam / Remote", 75, cardY + 56);\;

const newCardStr = \  //  JOB DETAILS CARD (Structured Premium Table Layout) 
  const cardY = 115;
  doc.setFillColor(lightGrey[0], lightGrey[1], lightGrey[2]);
  doc.rect(20, cardY, 170, 84, "F");
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.rect(20, cardY, 170, 84, "S");

  // Table Headers / Lines
  doc.setDrawColor(235, 235, 235);
  doc.line(20, cardY + 12, 190, cardY + 12);
  doc.line(20, cardY + 24, 190, cardY + 24);
  doc.line(20, cardY + 36, 190, cardY + 36);
  doc.line(20, cardY + 48, 190, cardY + 48);
  doc.line(20, cardY + 60, 190, cardY + 60);
  doc.line(20, cardY + 72, 190, cardY + 72);

  // Table content
  doc.setFont("helvetica", "bold");
  doc.text("Position / Title:", 25, cardY + 8);
  doc.setFont("helvetica", "normal");
  doc.text(details.roleApplied, 75, cardY + 8);

  doc.setFont("helvetica", "bold");
  doc.text("Domain:", 25, cardY + 20);
  doc.setFont("helvetica", "normal");
  doc.text(details.domain || "N/A", 75, cardY + 20);

  doc.setFont("helvetica", "bold");
  doc.text("Sub-domain:", 25, cardY + 32);
  doc.setFont("helvetica", "normal");
  doc.text(details.subDomain || "N/A", 75, cardY + 32);

  doc.setFont("helvetica", "bold");
  doc.text("Total Compensation (CTC):", 25, cardY + 44);
  doc.setFont("helvetica", "normal");
  doc.text(details.salary || "As mutually agreed", 75, cardY + 44);

  doc.setFont("helvetica", "bold");
  doc.text("Start Date:", 25, cardY + 56);
  doc.setFont("helvetica", "normal");
  doc.text(details.joiningDate ? new Date(details.joiningDate).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : "To be confirmed", 75, cardY + 56);

  doc.setFont("helvetica", "bold");
  doc.text("End Date:", 25, cardY + 68);
  doc.setFont("helvetica", "normal");
  doc.text(details.endDate ? new Date(details.endDate).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : "To be confirmed", 75, cardY + 68);

  doc.setFont("helvetica", "bold");
  doc.text("Job Location:", 25, cardY + 80);
  doc.setFont("helvetica", "normal");
  doc.text(details.jobLocation || "Visakhapatnam / Remote", 75, cardY + 80);\;

// The emojis might cause issues with string matching, so we will use regex to replace it
const regexReplace = /doc\.setFillColor\(lightGrey\[0\], lightGrey\[1\], lightGrey\[2\]\);[\s\S]*?doc\.text\(details\.jobLocation \|\| "Visakhapatnam \/ Remote", 75, cardY \+ 56\);/;
code = code.replace(regexReplace, newCardStr.replace("  //  JOB DETAILS CARD (Structured Premium Table Layout) \\n  const cardY = 115;\\n  ", ""));
// Also need to change cardY = 120 to cardY = 115 so it fits better
code = code.replace("const cardY = 120;", "const cardY = 110;");

// Update termsY to accommodate the larger table
code = code.replace("const termsY = 190;", "const termsY = 205;");
code = code.replace("doc.text(\"Authorized Signatory\", 20, 275);", "doc.text(\"Authorized Signatory\", 20, 280);");
code = code.replace("doc.addImage(signatureBase64, \"PNG\", 15, 255, 45, 15);", "doc.addImage(signatureBase64, \"PNG\", 15, 260, 45, 15);");

fs.writeFileSync(path, code);
console.log('PDF layout updated');