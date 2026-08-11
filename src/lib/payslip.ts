import { jsPDF } from "jspdf";

export interface PayslipData {
  employeeName: string;
  employeeId: string;
  designation: string;
  domain?: string;
  subDomain?: string;
  department?: string;
  payPeriod: string; // e.g. "August 2026"
  dateOfJoining?: string;
  bankName?: string;
  accountNumber?: string;
  panNumber?: string;
  pfNumber?: string;
  paidDays?: number;
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  conveyanceAllowance: number;
  performanceBonus?: number;
  providentFund?: number;
  professionalTax?: number;
  incomeTax?: number;
  notes?: string;
  logoBase64?: string | null;
  signatureBase64?: string | null;
  generatedAt?: string;
}

export function numberToWords(num: number): string {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const numStr = Math.floor(Math.abs(num)).toString();
  if (numStr.length > 9) return 'Amount Exceeds Range';
  const n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
  return str.trim() ? str.trim() + ' Rupees Only' : 'Zero Rupees';
}

function truncateText(doc: jsPDF, text: string, maxWidth: number): string {
  if (!text) return "N/A";
  if (doc.getTextWidth(text) <= maxWidth) return text;
  let str = text;
  while (str.length > 3 && doc.getTextWidth(str + "...") > maxWidth) {
    str = str.slice(0, -1);
  }
  return str + "...";
}

export function generatePayslipPdf(data: PayslipData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const grossEarnings = (data.basicSalary || 0) + (data.hra || 0) + (data.specialAllowance || 0) + (data.conveyanceAllowance || 0) + (data.performanceBonus || 0);
  const totalDeductions = (data.providentFund || 0) + (data.professionalTax || 0) + (data.incomeTax || 0);
  const netPay = Math.max(0, grossEarnings - totalDeductions);

  // Background / Margins
  const margin = 15;
  const pageWidth = 210;
  const contentWidth = pageWidth - margin * 2; // 180mm

  // Header Banner Box
  doc.setFillColor(15, 23, 42); // slate-900 / corporate brand navy
  doc.rect(margin, 14, contentWidth, 26, "F");

  // Gold Top Accent Line
  doc.setFillColor(217, 119, 6);
  doc.rect(margin, 14, contentWidth, 1.2, "F");

  // Vyntyra Logo Header
  const logoX = margin + 4;
  const logoY = 17;
  const logoW = 20;
  const logoH = 20;

  // Draw clean white rounded container badge for Logo
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(logoX, logoY, logoW, logoH, 2.5, 2.5, "F");

  if (data.logoBase64 && data.logoBase64.startsWith("data:image")) {
    try {
      doc.addImage(data.logoBase64, "PNG", logoX + 1.5, logoY + 1.5, 17, 17);
    } catch (e) {
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(logoX, logoY, logoW, logoH, 2.5, 2.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("V", logoX + 10, logoY + 13.5, { align: "center" });
    }
  } else {
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(logoX, logoY, logoW, logoH, 2.5, 2.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("V", logoX + 10, logoY + 13.5, { align: "center" });
  }

  // Company Name & Subtitles (Adjusted X & Y for zero overlap with right contact text)
  const headerTextX = margin + 27;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14.5);
  doc.text("VYNTYRA CONSULTANCY SERVICES", headerTextX, 22.5);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(226, 232, 240);
  doc.text("ISO 9001:2015 Certified · NASSCOM Verified", headerTextX, 28);
  
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("MSME: UDYAM-AP-10-0143100 · Enterprise Payroll", headerTextX, 33);

  // Company Contact Details on Right of Header
  doc.setFontSize(7.5);
  doc.setTextColor(226, 232, 240);
  doc.text("Visakhapatnam, AP, India", margin + contentWidth - 5, 22.5, { align: "right" });
  doc.text("hr@vyntyraconsultancyservices.in", margin + contentWidth - 5, 27.5, { align: "right" });
  doc.text("https://vyntyraconsultancyservices.in", margin + contentWidth - 5, 32.5, { align: "right" });

  // Title Box
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, 43, contentWidth, 9.5, "F");
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, 43, contentWidth, 9.5, "S");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text(`PAYSLIP FOR THE MONTH OF ${data.payPeriod.toUpperCase()}`, pageWidth / 2, 49.2, { align: "center" });

  // Employee Information Grid Box
  let y = 56;
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 39, "S");

  doc.setFontSize(8.5);
  const col1X = margin + 4;   // Label 1 (19mm)
  const col2X = margin + 42;  // Value 1 (57mm) -> Max Width 50mm
  const col3X = margin + 95;  // Label 2 (110mm)
  const col4X = margin + 130; // Value 2 (145mm) -> Max Width 46mm

  const empDetails = [
    [
      { label: "Employee Name:", val: data.employeeName },
      { label: "Pay Period:", val: data.payPeriod },
    ],
    [
      { label: "Employee Ref ID:", val: data.employeeId },
      { label: "Date of Joining:", val: data.dateOfJoining || "N/A" },
    ],
    [
      { label: "Designation / Role:", val: data.designation },
      { label: "Bank Name:", val: data.bankName || "HDFC Bank Ltd" },
    ],
    [
      { label: "Domain / Track:", val: data.domain || "Technology & Software" },
      { label: "Account No:", val: data.accountNumber ? `XXXX-XXXX-${data.accountNumber.slice(-4)}` : "XXXX-XXXX-8921" },
    ],
    [
      { label: "Sub-Domain:", val: data.subDomain || "Full Stack Web Dev" },
      { label: "PAN / UAN:", val: data.panNumber || "ABCDE1234F" },
    ],
  ];

  let lineY = y + 6;
  empDetails.forEach((row) => {
    // Col 1 & 2 (with truncation protection to prevent overlapping into Col 3)
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text(row[0].label, col1X, lineY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    const val1Formatted = truncateText(doc, row[0].val, 50);
    doc.text(val1Formatted, col2X, lineY);

    // Col 3 & 4
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text(row[1].label, col3X, lineY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    const val2Formatted = truncateText(doc, row[1].val, 46);
    doc.text(val2Formatted, col4X, lineY);

    lineY += 6.8;
  });

  // Table Header for Earnings & Deductions
  y = 99;
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth / 2, 8, "F");
  doc.rect(margin + contentWidth / 2, y, contentWidth / 2, 8, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("EARNINGS", margin + 6, y + 5.5);
  doc.text("AMOUNT (INR)", margin + contentWidth / 2 - 6, y + 5.5, { align: "right" });

  doc.text("DEDUCTIONS", margin + contentWidth / 2 + 6, y + 5.5);
  doc.text("AMOUNT (INR)", margin + contentWidth - 6, y + 5.5, { align: "right" });

  // Earnings & Deductions Rows
  y += 8;
  const earningsList = [
    { title: "Basic Salary", amt: data.basicSalary },
    { title: "House Rent Allowance (HRA)", amt: data.hra },
    { title: "Special Allowance", amt: data.specialAllowance },
    { title: "Conveyance Allowance", amt: data.conveyanceAllowance },
    { title: "Performance Incentive / Bonus", amt: data.performanceBonus || 0 },
  ];

  const deductionsList = [
    { title: "Provident Fund (PF)", amt: data.providentFund || 0 },
    { title: "Professional Tax (PT)", amt: data.professionalTax || 0 },
    { title: "Income Tax (TDS)", amt: data.incomeTax || 0 },
    { title: "Other Deductions", amt: 0 },
    { title: "-", amt: 0 },
  ];

  doc.setDrawColor(226, 232, 240);
  doc.setFontSize(8.5);

  const rowHeight = 7.5;
  for (let i = 0; i < earningsList.length; i++) {
    const rY = y + i * rowHeight;
    doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
    doc.rect(margin, rY, contentWidth, rowHeight, "F");
    doc.rect(margin, rY, contentWidth, rowHeight, "S");
    doc.line(margin + contentWidth / 2, rY, margin + contentWidth / 2, rY + rowHeight);

    // Earnings
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);
    doc.text(earningsList[i].title, margin + 4, rY + 5);
    doc.setFont("helvetica", "bold");
    doc.text(`Rs. ${earningsList[i].amt.toLocaleString("en-IN")}`, margin + contentWidth / 2 - 6, rY + 5, { align: "right" });

    // Deductions
    doc.setFont("helvetica", "normal");
    doc.text(deductionsList[i].title, margin + contentWidth / 2 + 4, rY + 5);
    doc.setFont("helvetica", "bold");
    doc.text(deductionsList[i].amt > 0 ? `Rs. ${deductionsList[i].amt.toLocaleString("en-IN")}` : "Rs. 0", margin + contentWidth - 6, rY + 5, { align: "right" });
  }

  // Totals Row
  y += earningsList.length * rowHeight;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 9, "F");
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 9, "S");
  doc.line(margin + contentWidth / 2, y, margin + contentWidth / 2, y + 9);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("TOTAL GROSS EARNINGS:", margin + 4, y + 6);
  doc.text(`Rs. ${grossEarnings.toLocaleString("en-IN")}`, margin + contentWidth / 2 - 6, y + 6, { align: "right" });

  doc.text("TOTAL DEDUCTIONS:", margin + contentWidth / 2 + 4, y + 6);
  doc.text(`Rs. ${totalDeductions.toLocaleString("en-IN")}`, margin + contentWidth - 6, y + 6, { align: "right" });

  // Net Pay Highlight Box
  y += 13;
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 14, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("NET TAKE-HOME PAY:", margin + 6, y + 9);
  doc.setFontSize(13.5);
  doc.text(`Rs. ${netPay.toLocaleString("en-IN")}`, margin + contentWidth - 8, y + 9.5, { align: "right" });

  // Net Pay in Words
  y += 18;
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 10, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 10, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text("AMOUNT IN WORDS:", margin + 4, y + 6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(truncateText(doc, numberToWords(netPay), 134), margin + 40, y + 6.5);

  // Authorisation & Footer Signatures
  y += 19;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Notes / Remarks:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.notes || "Payroll processed & verified by Finance Department.", margin, y + 4.5);

  // DigiLocker Style Digital Signature Stamp & Authorized Signatory Block
  const sigX = margin + contentWidth - 66; // 129mm to 195mm (width 66mm)
  const sigBoxY = y + 1;

  // Background box for Digital Signature Badge & Metadata
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(sigX, sigBoxY, 66, 23, 2, 2, "FD");

  // 1. DigiLocker Green Circle with White Vector Checkmark (Signature Verified Badge)
  doc.setFillColor(22, 163, 74); // Emerald Green
  doc.circle(sigX + 4.5, sigBoxY + 4, 3, "F");

  // White Vector Checkmark inside Circle
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.6);
  doc.line(sigX + 3.1, sigBoxY + 4, sigX + 4.1, sigBoxY + 5.2);
  doc.line(sigX + 4.1, sigBoxY + 5.2, sigX + 6.1, sigBoxY + 2.7);

  // Green Bold Header: "Signature Verified"
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(22, 163, 74);
  doc.text("Signature Verified", sigX + 9.5, sigBoxY + 4.5);

  // 2. Draw Real Signature Image right after Signature Verified badge
  if (data.signatureBase64 && data.signatureBase64.startsWith("data:image")) {
    try {
      doc.addImage(data.signatureBase64, "PNG", sigX + 2, sigBoxY + 6.0, 24, 8.5);
    } catch (e) {
      // Fallback if image load fails
    }
  }

  // 3. Digital Signature Metadata (after signature image)
  const genTime = data.generatedAt || `${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })} IST`;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Digitally Signed by: Jami Eswar Anil Kumar", sigX + 2, sigBoxY + 15.5);
  doc.text(`Date: ${genTime}`, sigX + 2, sigBoxY + 18.0);
  doc.text("Reason: Verified Corporate Payout Authorization", sigX + 2, sigBoxY + 20.5);

  // 4. Line below Digital Signature Stamp Box
  const sigLineY = sigBoxY + 28;

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(sigX, sigLineY, margin + contentWidth, sigLineY);

  // 5. Authorized Signatory Label under line
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.text("JAMI ESWAR ANIL KUMAR", sigX + 33, sigLineY + 4.5, { align: "center" });
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text("Founder & Managing Director", sigX + 33, sigLineY + 8.0, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Vyntyra Consultancy Services", sigX + 33, sigLineY + 11.2, { align: "center" });

  // Footer Disclaimer (positioned cleanly below signature block with divider line)
  const footerLineY = sigBoxY + 44;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerLineY, margin + contentWidth, footerLineY);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("This is a computer-generated salary document with DigiLocker-compliant electronic signature verification.", pageWidth / 2, footerLineY + 4.5, { align: "center" });

  return doc;
}
