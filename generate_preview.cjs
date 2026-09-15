const { jsPDF } = require('jspdf');
const fs = require('fs');

const doc = new jsPDF({ format: 'a4', unit: 'mm' });

const primaryNavy = [15, 23, 42];
const secondarySlate = [71, 85, 105];
const textDark = [30, 41, 59];
const lightBg = [248, 250, 252];
const borderLight = [203, 213, 225];

// Header bar
doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
doc.rect(0, 0, 210, 4, 'F');
doc.setFillColor(180, 140, 40);
doc.rect(0, 4, 210, 1, 'F');

// Company name
doc.setFont('helvetica', 'bold');
doc.setFontSize(16);
doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
doc.text('VYNTYRA', 38, 19);

doc.setFont('helvetica', 'normal');
doc.setFontSize(8.5);
doc.setTextColor(180, 140, 40);
doc.text('CONSULTANCY SERVICES', 38, 23);

// Address
doc.setFont('helvetica', 'normal');
doc.setFontSize(8.5);
doc.setTextColor(secondarySlate[0], secondarySlate[1], secondarySlate[2]);
doc.text('Dwaraka Nagar, Dwaraka Plaza', 190, 16, { align: 'right' });
doc.text('Visakhapatnam, AP, India - 530016', 190, 21, { align: 'right' });
doc.text('Email: careers@vyntyraconsultancyservices.in', 190, 26, { align: 'right' });

// Ref/Date pill
doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
doc.roundedRect(20, 36, 170, 10, 1.5, 1.5, 'F');
doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.setTextColor(textDark[0], textDark[1], textDark[2]);
doc.text('Ref: VCS/OL/2026/APP12345', 25, 42.5);
doc.setFont('helvetica', 'normal');
doc.text('Date: September 13, 2026', 185, 42.5, { align: 'right' });

// Title
doc.setFont('helvetica', 'bold');
doc.setFontSize(14);
doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
doc.text('LETTER OF OFFER & APPOINTMENT', 105, 60, { align: 'center', charSpace: 1 });
doc.setDrawColor(180, 140, 40);
doc.setLineWidth(0.5);
doc.line(80, 63, 130, 63);

// Recipient
doc.setFont('helvetica', 'bold');
doc.setFontSize(10.5);
doc.setTextColor(textDark[0], textDark[1], textDark[2]);
doc.text('TO: Guntu Leesha', 20, 75);

// Intro paragraph
doc.setFont('helvetica', 'normal');
doc.setFontSize(10);
doc.setTextColor(secondarySlate[0], secondarySlate[1], secondarySlate[2]);
const introText = 'We are delighted to extend this formal offer of appointment for the position of Internship - Engineering & Technology at Vyntyra Consultancy Services. Following your outstanding performance in our recruitment and interview rounds, we are confident that you will bring significant value, expertise, and innovative thinking to our organization.';
const splitIntro = doc.splitTextToSize(introText, 170);
doc.text(splitIntro, 20, 84);

// Table
const tableStartY = 84 + (splitIntro.length * 5) + 6;
const rowH = 10;

const rows = [
  { label: 'Position / Title', val: 'Internship - Engineering & Technology' },
  { label: 'Domain', val: 'Engineering & Technology' },
  { label: 'Sub-domain', val: 'MERN Stack (MongoDB, Express, React, Node.js)' },
  { label: 'Total Compensation', val: 'N/A' },
  { label: 'Start Date', val: 'August 15, 2026' },
  { label: 'End Date', val: 'November 15, 2026' },
  { label: 'Job Location', val: 'Visakhapatnam / Remote' }
];

rows.forEach((row, i) => {
  const y = tableStartY + (i * rowH);
  if (i % 2 === 0) {
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    if (i === 0) {
      doc.roundedRect(20, y, 170, rowH, 1.5, 1.5, 'F');
      doc.rect(20, y + rowH/2, 170, rowH/2, 'F');
    } else if (i === rows.length - 1) {
      doc.roundedRect(20, y, 170, rowH, 1.5, 1.5, 'F');
      doc.rect(20, y, 170, rowH/2, 'F');
    } else {
      doc.rect(20, y, 170, rowH, 'F');
    }
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(row.label, 25, y + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondarySlate[0], secondarySlate[1], secondarySlate[2]);
  doc.text(row.val, 75, y + 6.5);
});

doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
doc.setLineWidth(0.3);
doc.roundedRect(20, tableStartY, 170, rows.length * rowH, 1.5, 1.5, 'S');

// Terms
const termsY = tableStartY + (rows.length * rowH) + 12;
doc.setFont('helvetica', 'normal');
doc.setFontSize(9);
doc.setTextColor(secondarySlate[0], secondarySlate[1], secondarySlate[2]);

const terms1 = 'This offer is subject to verification of your professional credentials and references. On your day of joining, please submit self-attested copies of your academic records, experience certificates, identity proof, and address proof for administrative filing.';
const splitT1 = doc.splitTextToSize(terms1, 170);
doc.text(splitT1, 20, termsY);
const t1H = splitT1.length * 4.5;

const terms2 = 'Please note that the code of conduct, non-disclosure policies, and terms of service of the company will be detailed in your employment contract, which will be executed on your joining date.';
const splitT2 = doc.splitTextToSize(terms2, 170);
doc.text(splitT2, 20, termsY + t1H + 3);
const t2H = splitT2.length * 4.5;

const signInfo = 'Kindly confirm your acceptance by signing this letter and returning a scanned copy within 7 business days, failing which this offer shall automatically expire.';
const splitSI = doc.splitTextToSize(signInfo, 170);
doc.text(splitSI, 20, termsY + t1H + t2H + 6);
const siH = splitSI.length * 4.5;

// Signature block
const signY = termsY + t1H + t2H + siH + 12;
doc.setFont('helvetica', 'bold');
doc.setFontSize(9.5);
doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
doc.text('For Vyntyra Consultancy Services,', 20, signY);
doc.text('Jami Eswar Anil Kumar', 20, signY + 16);
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.setTextColor(secondarySlate[0], secondarySlate[1], secondarySlate[2]);
doc.text('Founder & Managing Director', 20, signY + 20);
doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
doc.setLineWidth(0.25);
doc.line(20, signY + 23, 75, signY + 23);
doc.text('Authorized Signatory', 20, signY + 27);

doc.text('Accepted and Agreed By:', 120, signY);
doc.line(120, signY + 16, 185, signY + 16);
doc.text('Candidate Signature & Date', 120, signY + 21);

// Footer
doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
doc.rect(0, 287, 210, 10, 'F');
doc.setFont('helvetica', 'normal');
doc.setFontSize(7.5);
doc.setTextColor(203, 213, 225);
doc.text('Confidential | Vyntyra Consultancy Services (C) 2026. All rights reserved.', 105, 293, { align: 'center' });

const buffer = doc.output('arraybuffer');
fs.writeFileSync('C:/Users/Jamia/.gemini/antigravity/brain/68f9bade-1b92-4817-b487-ba92da67c55e/preview.pdf', Buffer.from(buffer));
console.log('PDF saved!');
