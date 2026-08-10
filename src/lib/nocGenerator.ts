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
  qrCodeBase64?: string | null;
  issueDate?: string;
  logoBase64?: string | null;
  hodName?: string | null;
}

export async function urlToBase64(url: string): Promise<string | null> {
  try {
    if (!url) return null;
    if (url.startsWith("data:image")) return url;
    
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("[nocGenerator] Failed to convert image to base64:", err);
    return null;
  }
}

export function generateNocPdf(data: NocData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const margin = 15;
  const pageWidth = 210;
  const contentWidth = pageWidth - margin * 2; // 180mm

  // Header Banner Background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, 15, contentWidth, 26, "F");

  // Premium Logo Crest (Emblem) or Vyntyra Brand Logo
  if (data.logoBase64 && data.logoBase64.startsWith("data:image")) {
    try {
      doc.addImage(data.logoBase64, "PNG", margin + 6, 21, 12, 12);
    } catch (err) {
      console.warn("[nocGenerator] Failed to render Vyntyra logo:", err);
      doc.setFillColor(16, 185, 129); // emerald-500
      doc.roundedRect(margin + 6, 19, 14, 14, 2.5, 2.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("V", margin + 13, 29, { align: "center" });
    }
  } else {
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.roundedRect(margin + 6, 19, 14, 14, 2.5, 2.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("V", margin + 13, 29, { align: "center" });
  }

  // Company Brand Header Details
  doc.setFontSize(14.5);
  doc.text("VYNTYRA CONSULTANCY SERVICES", margin + 24, 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Corporate Human Resources & Industrial Training Division", margin + 24, 31);

  // Reference & Metadata
  doc.setFontSize(7.5);
  doc.text("Visakhapatnam, AP, India - 530013", margin + contentWidth - 6, 23, { align: "right" });
  doc.text("hr@vyntyraconsultancyservices.in", margin + contentWidth - 6, 28, { align: "right" });
  doc.text("Ref: NOC/VYN/2026/" + data.applicationId.slice(0, 8).toUpperCase(), margin + contentWidth - 6, 33, { align: "right" });

  // Certificate Document Title Banner
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, 46, contentWidth, 12, "F");
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, 46, contentWidth, 12, "S");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.text("NO OBJECTION CERTIFICATE & SELECTION CONFIRMATION", pageWidth / 2, 53.5, { align: "center" });

  // Details Grid Container Box
  let y = 62;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, y, contentWidth, 54, "FD");

  // Premium Image Placeholder Box (32mm x 38mm)
  const photoW = 32;
  const photoH = 38;
  const photoX = margin + contentWidth - photoW - 6;
  const photoY = y + 8;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(148, 163, 184);
  doc.rect(photoX, photoY, photoW, photoH, "FD");

  // Add Candidate photo if available, otherwise draw watermark placeholder
  if (data.profilePhotoUrl && data.profilePhotoUrl.startsWith("data:image")) {
    try {
      doc.addImage(data.profilePhotoUrl, "JPEG", photoX, photoY, photoW, photoH);
    } catch (err) {
      console.warn("[nocGenerator] Failed to render candidate photo:", err);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text("PHOTO", photoX + photoW / 2, photoY + photoH / 2, { align: "center" });
    }
  } else {
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("PHOTO", photoX + photoW / 2, photoY + photoH / 2, { align: "center" });
  }

  // Render Details rows
  doc.setFontSize(9.5);
  const leftX = margin + 6;
  const valX = margin + 52;
  let detailY = y + 9;

  const rows = [
    { label: "Applicant Name:", val: data.fullName },
    { label: "Email Address:", val: data.email },
    { label: "College / Institution:", val: data.college || "Academic Institution" },
    { label: "Selected Domain Track:", val: data.domain || "Technology & Software" },
    { label: "Sub-Domain Specialization:", val: data.subDomain || "Full Stack Web Development" },
    { label: "Internship Start Date:", val: data.internshipStartDate || "Immediate" },
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
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);

  const para1 = `This is to certify that ${data.fullName}, a registered student at ${data.college || "their institution"} (Email: ${data.email}), has been officially selected for the Vyntyra Industrial Internship Program 2026 under Project VyNexa.`;

  const para2 = `The candidate will be undergoing specialized technical training and industrial project implementation in the domain of ${data.domain || "Software Engineering"} (${data.subDomain || "Full Stack Web Development"}), commencing on ${data.internshipStartDate || "the scheduled start date"}.`;

  const para3 = `Vyntyra Consultancy Services issues this NO OBJECTION CERTIFICATE (NOC) to confirm that the company has no objection to ${data.fullName} pursuing this internship program concurrently with their academic coursework. All training modules, project execution, and evaluation sessions will be conducted in full compliance with corporate industry standards.`;

  const para4 = `We extend our warm congratulations to the selected candidate and look forward to a successful internship engagement.`;

  doc.text(doc.splitTextToSize(para1, contentWidth), margin, y);
  y += 15;
  doc.text(doc.splitTextToSize(para2, contentWidth), margin, y);
  y += 15;
  doc.text(doc.splitTextToSize(para3, contentWidth), margin, y);
  y += 20;
  doc.text(doc.splitTextToSize(para4, contentWidth), margin, y);

  // Security Seal & Verification Box (Bottom Left)
  y = 194;
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 26, "F");
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 26, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("VERIFICATION & SECURITY SEAL", margin + 6, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Issue Date: " + (data.issueDate || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })), margin + 6, y + 11);
  doc.text("Portal Verification URL: https://careers.vyntyraconsultancyservices.in/status/" + data.applicationId, margin + 6, y + 16);
  doc.text("System Check: Securely Signed & Verified (ISO 9001:2015 Compliant)", margin + 6, y + 21);

  // Embedded Premium Verification QR Code (Bottom Right of Verification Box)
  const qrW = 20;
  const qrH = 20;
  const qrX = margin + contentWidth - qrW - 4;
  const qrY = y + 3;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.rect(qrX, qrY, qrW, qrH, "FD");

  if (data.qrCodeBase64 && data.qrCodeBase64.startsWith("data:image")) {
    try {
      doc.addImage(data.qrCodeBase64, "PNG", qrX, qrY, qrW, qrH);
    } catch (err) {
      console.warn("[nocGenerator] Failed to render verification QR code:", err);
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text("VERIFY QR", qrX + qrW / 2, qrY + qrH / 2, { align: "center" });
    }
  } else {
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text("VERIFY QR", qrX + qrW / 2, qrY + qrH / 2, { align: "center" });
  }

  // Stylized Hand-Written Signatures Section (Candidate, HOD, Founder)
  y = 230;
  const colW = contentWidth / 3;

  // 1. Candidate Column (Left)
  const x1 = margin + colW / 2;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin + 10, y + 10, margin + colW - 10, y + 10);
  
  // Stylized Hand-written signature name
  doc.setFont("courier", "oblique");
  doc.setFontSize(10);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text(data.fullName, x1, y + 8, { align: "center" });
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(data.fullName, x1, y + 14, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Candidate Signature", x1, y + 18, { align: "center" });

  // 2. HOD Division Column (Middle)
  const x2 = margin + colW + colW / 2;
  doc.line(margin + colW + 10, y + 10, margin + colW * 2 - 10, y + 10);
  
  // Stylized HOD Signature (Left blank as requested for manual/physical signature)
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(data.hodName || "Head of Department", x2, y + 14, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Head of Department", x2, y + 18, { align: "center" });

  // 3. Founder Column (Right)
  const x3 = margin + colW * 2 + colW / 2;
  doc.line(margin + colW * 2 + 10, y + 10, margin + contentWidth - 10, y + 10);
  
  // Stylized Founder Signature
  doc.setFont("courier", "oblique");
  doc.text("Jami Eswar", x3, y + 8, { align: "center" });
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Jami Eswar Anil Kumar", x3, y + 14, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Founder & Managing Director", x3, y + 18, { align: "center" });

  // Footer Divider Line & Official Seal Note
  y = 264;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, margin + contentWidth, y);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("This document is an official No Objection Certificate issued by Vyntyra Consultancy Services. Validity can be verified online.", pageWidth / 2, y + 5, { align: "center" });

  return doc;
}
