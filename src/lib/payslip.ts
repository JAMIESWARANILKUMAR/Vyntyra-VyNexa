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

export function generatePayslipPdf(data: PayslipData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const grossEarnings = (data.basicSalary || 0) + (data.hra || 0) + (data.specialAllowance || 0) + (data.conveyanceAllowance || 0) + (data.performanceBonus || 0);
  const totalDeductions = (data.providentFund || 0) + (data.professionalTax || 0) + (data.incomeTax || 0);
  const netPay = Math.max(0, grossEarnings - totalDeductions);

  // Background / Margins
  const margin = 15;
  const pageWidth = 210;
  const contentWidth = pageWidth - margin * 2; // 180mm

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900 / corporate brand navy
  doc.rect(margin, 15, contentWidth, 24, "F");

  // Company Name & Subtitle in Header
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("VYNTYRA CONSULTANCY SERVICES", margin + 6, 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("ISO 9001:2015 Certified | NASSCOM Verified | MSME Reg. AP-03-00128", margin + 6, 32);

  // Company Contact Details on Right of Header
  doc.setFontSize(8);
  doc.text("Visakhapatnam, AP, India", margin + contentWidth - 6, 23, { align: "right" });
  doc.text("hr@vyntyraconsultancyservices.in", margin + contentWidth - 6, 28, { align: "right" });
  doc.text("https://vyntyraconsultancyservices.in", margin + contentWidth - 6, 33, { align: "right" });

  // Title Box
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, 43, contentWidth, 10, "F");
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, 43, contentWidth, 10, "S");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`PAYSLIP FOR THE MONTH OF ${data.payPeriod.toUpperCase()}`, pageWidth / 2, 49.5, { align: "center" });

  // Employee Information Grid Box
  let y = 57;
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 38, "S");

  doc.setFontSize(9);
  const col1X = margin + 4;
  const col2X = margin + 50;
  const col3X = margin + 98;
  const col4X = margin + 144;

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
    // Col 1 & 2
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text(row[0].label, col1X, lineY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(row[0].val, col2X, lineY);

    // Col 3 & 4
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text(row[1].label, col3X, lineY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(row[1].val, col4X, lineY);

    lineY += 6.8;
  });

  // Table Header for Earnings & Deductions
  y = 100;
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
    doc.text(`₹ ${earningsList[i].amt.toLocaleString("en-IN")}`, margin + contentWidth / 2 - 4, rY + 5, { align: "right" });

    // Deductions
    doc.setFont("helvetica", "normal");
    doc.text(deductionsList[i].title, margin + contentWidth / 2 + 4, rY + 5);
    doc.setFont("helvetica", "bold");
    doc.text(deductionsList[i].amt > 0 ? `₹ ${deductionsList[i].amt.toLocaleString("en-IN")}` : "₹ 0", margin + contentWidth - 4, rY + 5, { align: "right" });
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
  doc.text(`₹ ${grossEarnings.toLocaleString("en-IN")}`, margin + contentWidth / 2 - 4, y + 6, { align: "right" });

  doc.text("TOTAL DEDUCTIONS:", margin + contentWidth / 2 + 4, y + 6);
  doc.text(`₹ ${totalDeductions.toLocaleString("en-IN")}`, margin + contentWidth - 4, y + 6, { align: "right" });

  // Net Pay Highlight Box
  y += 13;
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 14, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("NET TAKE-HOME PAY:", margin + 6, y + 9);
  doc.setFontSize(14);
  doc.text(`₹ ${netPay.toLocaleString("en-IN")}`, margin + contentWidth - 6, y + 9.5, { align: "right" });

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
  doc.text(numberToWords(netPay), margin + 42, y + 6.5);

  // Authorisation & Footer Signatures
  y += 20;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Notes / Remarks:", margin, y);
  doc.text(data.notes || "Payroll processed & verified by Finance Department.", margin, y + 4);

  // Signatures Right
  const sigX = margin + contentWidth - 50;
  doc.setDrawColor(148, 163, 184);
  doc.line(sigX, y + 16, margin + contentWidth, y + 16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.text("Authorized Signatory", sigX + 10, y + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Vyntyra Consultancy Services", sigX + 5, y + 24);

  // Footer Disclaimer
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y + 30, margin + contentWidth, y + 30);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("This is a computer-generated salary document and does not require a physical signature.", pageWidth / 2, y + 34, { align: "center" });

  return doc;
}
