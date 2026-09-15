const fs = require('fs');
const path = './src/lib/pdf.server.ts';
let code = fs.readFileSync(path, 'utf8');

const startIndex = code.indexOf('const cardY = 110;');
const endIndex = code.indexOf('// ', code.indexOf('doc.text("Candidate Signature & Date", 120, signY + 21);'));

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find the target section to replace.');
    process.exit(1);
}

const replacement = `const cardY = 115;
  
  // Top thick border
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.8);
  doc.line(20, cardY - 4, 190, cardY - 4);

  // Thin separators between rows
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(20, cardY + 10, 190, cardY + 10);
  doc.line(20, cardY + 22, 190, cardY + 22);
  doc.line(20, cardY + 34, 190, cardY + 34);
  doc.line(20, cardY + 46, 190, cardY + 46);
  doc.line(20, cardY + 58, 190, cardY + 58);
  doc.line(20, cardY + 70, 190, cardY + 70);

  // Bottom thick border
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.8);
  doc.line(20, cardY + 82, 190, cardY + 82);

  // Table content labels
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9.5);

  doc.text("Position / Title", 22, cardY + 4);
  doc.text("Domain", 22, cardY + 16);
  doc.text("Sub-domain", 22, cardY + 28);
  doc.text("Total Compensation (CTC)", 22, cardY + 40);
  doc.text("Start Date", 22, cardY + 52);
  doc.text("End Date", 22, cardY + 64);
  doc.text("Job Location", 22, cardY + 76);

  // Table content values
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  
  doc.text(details.roleApplied, 80, cardY + 4);
  doc.text(details.domain || "N/A", 80, cardY + 16);
  doc.text(details.subDomain || "N/A", 80, cardY + 28);
  doc.text(details.salary || "As mutually agreed", 80, cardY + 40);
  doc.text(details.joiningDate ? new Date(details.joiningDate).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : "To be confirmed", 80, cardY + 52);
  doc.text(details.endDate ? new Date(details.endDate).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : "To be confirmed", 80, cardY + 64);
  doc.text(details.jobLocation || "Visakhapatnam / Remote", 80, cardY + 76);

  // SECONDARY TEXT (TERMS)
  const termsY = 208;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  const body2 = "This offer is subject to verification of your professional credentials and references. On your day of joining, please submit self-attested copies of your academic records, experience certificates, identity proof, and address proof for administrative filing.\\n\\nPlease note that the code of conduct, non-disclosure policies, and terms of service of the company will be detailed in your employment contract, which will be executed on your joining date.";
  const splitBody2 = doc.splitTextToSize(body2, 170);
  doc.text(splitBody2, 20, termsY);
  
  const body2Height = splitBody2.length * 4.5;

  const signInfo = "Kindly confirm your acceptance by signing this letter and returning a scanned copy within 7 business days, failing which this offer shall automatically expire.";
  const splitSignInfo = doc.splitTextToSize(signInfo, 170);
  doc.text(splitSignInfo, 20, termsY + body2Height + 5);

  const signInfoHeight = splitSignInfo.length * 4.5;

  // SIGNATURE BLOCK
  const signY = termsY + body2Height + 5 + signInfoHeight + 7;
  
  // Vyntyra Signatory
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text("For Vyntyra Consultancy Services,", 20, signY);

  const sigBase64 = await fetchBase64Image("https://kommodo.ai/i/olXE11N8ipqBTR8DBSXt");
  if (sigBase64) {
    doc.addImage(sigBase64, "PNG", 20, signY + 2, 32, 10.5);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Jami Eswar Anil Kumar", 20, signY + 16);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(110, 110, 110);
  doc.text("Founder & Managing Director", 20, signY + 20);
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.25);
  doc.line(20, signY + 23, 75, signY + 23);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(110, 110, 110);
  doc.text("Authorized Signatory", 20, signY + 27);

  // Candidate Acceptance
  doc.text("Accepted and Agreed By:", 120, signY);
  doc.line(120, signY + 16, 185, signY + 16);
  doc.text("Candidate Signature & Date", 120, signY + 21);

  \n  `;

const newCode = code.slice(0, startIndex) + replacement + code.slice(endIndex);
fs.writeFileSync(path, newCode);
console.log('Successfully updated the design to minimalistic premium!');
