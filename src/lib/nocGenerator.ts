import { jsPDF } from "jspdf";

export interface NocData {
  fullName: string;
  email: string;
  phone?: string;
  applicationId: string;
  college: string;
  domain: string;
  subDomain: string;
  internshipStartDate: string;
  profilePhotoUrl?: string | null;
  issueDate?: string;
}

export function generateNocPdf(data: NocData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const margin = 15;
  const pageWidth = 210;
  const contentWidth = pageWidth - margin * 2; // 180mm

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900 / corporate brand navy
  doc.rect(margin, 15, contentWidth, 26, "F");

  // Company Title & Seal Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("VYNTYRA CONSULTANCY SERVICES", margin + 6, 26);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Corporate Human Resources & Industrial Training Division", margin + 6, 33);

  // Address
  doc.setFontSize(8);
  doc.text("Visakhapatnam, AP, India - 530013", margin + contentWidth - 6, 24, { align: "right" });
  doc.text("hr@vyntyraconsultancyservices.in", margin + contentWidth - 6, 29, { align: "right" });
  doc.text("Ref: NOC/VYN/2026/" + data.applicationId.slice(0, 8).toUpperCase(), margin + contentWidth - 6, 34, { align: "right" });

  // Document Title
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, 46, contentWidth, 12, "F");
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, 46, contentWidth, 12, "S");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("NO OBJECTION CERTIFICATE & SELECTION CONFIRMATION", pageWidth / 2, 53.5, { align: "center" });

  // Candidate Details Card with Photo Box
  let y = 64;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, y, contentWidth, 54, "FD");

  // Photo Box on Right (35mm x 42mm)
  const photoW = 32;
  const photoH = 38;
  const photoX = margin + contentWidth - photoW - 6;
  const photoY = y + 8;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(148, 163, 184);
  doc.rect(photoX, photoY, photoW, photoH, "FD");

  // Add Candidate Photo if provided, else Placeholder
  if (data.profilePhotoUrl && data.profilePhotoUrl.startsWith("data:image")) {
    try {
      doc.addImage(data.profilePhotoUrl, "JPEG", photoX, photoY, photoW, photoH);
    } catch {
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("CANDIDATE", photoX + photoW / 2, photoY + photoH / 2 - 2, { align: "center" });
      doc.text("PHOTO", photoX + photoW / 2, photoY + photoH / 2 + 3, { align: "center" });
    }
  } else {
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("CANDIDATE", photoX + photoW / 2, photoY + photoH / 2 - 2, { align: "center" });
    doc.text("PHOTO", photoX + photoW / 2, photoY + photoH / 2 + 3, { align: "center" });
  }

  // Candidate Details Grid
  doc.setFontSize(9.5);
  const leftX = margin + 6;
  const valX = margin + 52;
  let detailY = y + 9;

  const rows = [
    { label: "Applicant Name:", val: data.fullName },
    { label: "Email Address:", val: data.email },
    { label: "College / Institution:", val: data.college || "N/A" },
    { label: "Selected Domain Track:", val: data.domain || "Technology & Software" },
    { label: "Sub-Domain Specialization:", val: data.subDomain || "Full Stack Web Development" },
    { label: "Internship Start Date:", val: data.internshipStartDate || "Immediate / Pending Schedule" },
    { label: "Application Reference:", val: data.applicationId.slice(0, 8).toUpperCase() },
  ];

  rows.forEach((r) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text(r.label, leftX, detailY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(r.val, valX, detailY);

    detailY += 6.5;
  });

  // Certificate Body Paragraphs
  y = 125;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  const para1 = `This is to certify that ${data.fullName}, a registered student at ${data.college || "their institution"} (Email: ${data.email}), has been officially selected for the Vyntyra Industrial Internship Program 2026 under Project VyNexa.`;

  const para2 = `The candidate will be undergoing specialized technical training and industrial project implementation in the domain of ${data.domain || "Software Engineering"} (${data.subDomain || "Full Stack Web Development"}), commencing on ${data.internshipStartDate || "the scheduled start date"}.`;

  const para3 = `Vyntyra Consultancy Services issues this NO OBJECTION CERTIFICATE (NOC) to confirm that the company has no objection to ${data.fullName} pursuing this internship program concurrently with their academic coursework. All training modules, project execution, and evaluation sessions will be conducted in full compliance with corporate industry standards.`;

  const para4 = `We extend our warm congratulations to the selected candidate and look forward to a successful internship engagement.`;

  doc.text(doc.splitTextToSize(para1, contentWidth), margin, y);
  y += 18;
  doc.text(doc.splitTextToSize(para2, contentWidth), margin, y);
  y += 18;
  doc.text(doc.splitTextToSize(para3, contentWidth), margin, y);
  y += 24;
  doc.text(doc.splitTextToSize(para4, contentWidth), margin, y);

  // Security Seal & Verification Box
  y += 18;
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 22, "F");
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 22, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("VERIFICATION & SECURITY SEAL", margin + 6, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Issue Date: " + (data.issueDate || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })), margin + 6, y + 11);
  doc.text("Portal Verification URL: https://careers.vyntyraconsultancyservices.in/status/" + data.applicationId, margin + 6, y + 16);

  // Authorization Block
  const sigX = margin + contentWidth - 60;
  doc.setDrawColor(148, 163, 184);
  doc.line(sigX, y + 12, margin + contentWidth - 6, y + 12);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("Head of Talent Acquisition", sigX + 2, y + 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Vyntyra Consultancy Services", sigX + 2, y + 20);

  // Footer Disclaimer
  y += 28;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, margin + contentWidth, y);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("This document is an official No Objection Certificate issued by Vyntyra Consultancy Services. Validity can be verified online.", pageWidth / 2, y + 5, { align: "center" });

  return doc;
}
