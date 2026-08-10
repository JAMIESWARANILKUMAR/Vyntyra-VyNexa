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

// ── Color Palette ─────────────────────────────────────────────────────
// Header / Banner: Deep Navy Blue (30, 58, 95)
// Accent / Gold:   Corporate Gold (180, 140, 40)
// Sub-header:      Royal Blue (37, 99, 160)
// Body text:       Slate dark (15, 23, 42)
// Muted:           Slate-400 (100, 116, 139)
// Bg tint:         Cool grey (245, 247, 250)

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

  // ── Thin Gold Top Border Stripe ───────────────────────────────────
  doc.setFillColor(180, 140, 40); // Corporate Gold
  doc.rect(0, 0, pageWidth, 3, "F");

  // ── Main Header Banner (Deep Navy Blue) ───────────────────────────
  doc.setFillColor(30, 58, 95); // Deep navy
  doc.rect(margin, 8, contentWidth, 28, "F");

  // Light diagonal pattern overlay (visual richness)
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.05);

  // ── Vyntyra Logo / Crest ──────────────────────────────────────────
  if (data.logoBase64 && data.logoBase64.startsWith("data:image")) {
    try {
      doc.addImage(data.logoBase64, "PNG", margin + 5, 13, 14, 14);
    } catch {
      // fallback gold V crest
      doc.setFillColor(180, 140, 40);
      doc.roundedRect(margin + 5, 12, 14, 14, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("V", margin + 12, 21, { align: "center" });
    }
  } else {
    doc.setFillColor(180, 140, 40);
    doc.roundedRect(margin + 5, 12, 14, 14, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("V", margin + 12, 21, { align: "center" });
  }

  // ── Company Name & Sub-title ──────────────────────────────────────
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("VYNTYRA CONSULTANCY SERVICES", margin + 23, 19);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(200, 215, 235); // light steel blue
  doc.text("Corporate Human Resources & Industrial Training Division", margin + 23, 25);

  // ── Gold separator line inside header ────────────────────────────
  doc.setDrawColor(180, 140, 40);
  doc.setLineWidth(0.4);
  doc.line(margin + 23, 27.5, margin + contentWidth - 5, 27.5);

  // ── Registration & Metadata (right side of header) ───────────────
  doc.setLineWidth(0.1);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(200, 215, 235);
  doc.text("Dwaraka Nagar, Visakhapatnam - 530016, AP, India", margin + contentWidth - 5, 14, { align: "right" });
  doc.text("hr@vyntyraconsultancyservices.in", margin + contentWidth - 5, 19, { align: "right" });
  doc.text("UDYAM: UDYAM-AP-10-0143100", margin + contentWidth - 5, 24, { align: "right" });
  doc.text("Ref: NOC/VYN/2026/" + data.applicationId.slice(0, 8).toUpperCase(), margin + contentWidth - 5, 29, { align: "right" });

  // ── Thin Gold Bottom Border of Header ────────────────────────────
  doc.setFillColor(180, 140, 40);
  doc.rect(margin, 36, contentWidth, 1.2, "F");

  // ── Document Title Strip (Royal Blue) ────────────────────────────
  doc.setFillColor(37, 99, 160); // Royal Blue
  doc.rect(margin, 40, contentWidth, 11, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.text("NO OBJECTION CERTIFICATE  ·  SELECTION CONFIRMATION", pageWidth / 2, 47.5, { align: "center" });

  // ── Details Grid Container ────────────────────────────────────────
  let y = 56;
  doc.setDrawColor(180, 200, 220);
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, y, contentWidth, 56, 1.5, 1.5, "FD");

  // Left blue accent bar
  doc.setFillColor(37, 99, 160);
  doc.rect(margin, y, 3, 56, "F");

  // ── Candidate Photo Box ───────────────────────────────────────────
  const photoW = 32;
  const photoH = 38;
  const photoX = margin + contentWidth - photoW - 6;
  const photoY = y + 9;

  doc.setFillColor(224, 231, 240);
  doc.setDrawColor(37, 99, 160);
  doc.setLineWidth(0.4);
  doc.roundedRect(photoX, photoY, photoW, photoH, 1, 1, "FD");

  if (data.profilePhotoUrl && data.profilePhotoUrl.startsWith("data:image")) {
    try {
      doc.addImage(data.profilePhotoUrl, "JPEG", photoX, photoY, photoW, photoH);
    } catch {
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("PHOTO", photoX + photoW / 2, photoY + photoH / 2, { align: "center" });
    }
  } else {
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("PHOTO", photoX + photoW / 2, photoY + photoH / 2, { align: "center" });
  }

  // ── Detail Rows ───────────────────────────────────────────────────
  doc.setLineWidth(0.1);
  doc.setFontSize(9);
  const leftX = margin + 8;
  const valX = margin + 54;
  let detailY = y + 10;

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
    doc.setTextColor(37, 99, 160); // Royal blue labels
    doc.text(r.label, leftX, detailY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(r.val, valX, detailY);

    detailY += 6.5;
  });

  // ── Certificate Body Paragraphs ───────────────────────────────────
  y = 120;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.2);
  doc.setTextColor(33, 53, 78); // deep blue-grey body text

  const para1 = `This is to certify that ${data.fullName}, a registered student at ${data.college || "their institution"} (Email: ${data.email}), has been officially selected for the Vyntyra Industrial Internship Program 2026 under Project VyNexa.`;
  const para2 = `The candidate will undergo specialized technical training and industrial project implementation in the domain of ${data.domain || "Software Engineering"} (${data.subDomain || "Full Stack Web Development"}), commencing on ${data.internshipStartDate || "the scheduled start date"}.`;
  const para3 = `Vyntyra Consultancy Services issues this NO OBJECTION CERTIFICATE (NOC) to confirm that the company has no objection to ${data.fullName} pursuing this internship concurrently with their academic coursework. All training, project execution, and evaluation sessions will be conducted in full compliance with corporate industry standards.`;
  const para4 = `We extend our warm congratulations to the selected candidate and look forward to a successful and impactful internship engagement.`;

  doc.text(doc.splitTextToSize(para1, contentWidth), margin, y);
  y += 16;
  doc.text(doc.splitTextToSize(para2, contentWidth), margin, y);
  y += 16;
  doc.text(doc.splitTextToSize(para3, contentWidth), margin, y);
  y += 20;
  doc.text(doc.splitTextToSize(para4, contentWidth), margin, y);

  // ── Verification & Security Seal Box ─────────────────────────────
  y = 192;
  doc.setFillColor(235, 242, 250); // light blue tint
  doc.setDrawColor(37, 99, 160);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 27, 1.5, 1.5, "FD");

  // Left accent bar (gold)
  doc.setFillColor(180, 140, 40);
  doc.rect(margin, y, 3, 27, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 58, 95);
  doc.text("VERIFICATION & SECURITY SEAL", margin + 7, y + 6.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(33, 53, 78);
  doc.text("Issue Date: " + (data.issueDate || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })), margin + 7, y + 12);
  doc.text("Verification URL: https://careers.vyntyraconsultancyservices.in/status/" + data.applicationId, margin + 7, y + 17);
  doc.text("System Status: Securely Signed & Verified  ·  ISO 9001:2015 Compliant  ·  UDYAM-AP-10-0143100", margin + 7, y + 22);

  // ── QR Code Box ───────────────────────────────────────────────────
  const qrW = 21;
  const qrH = 21;
  const qrX = margin + contentWidth - qrW - 4;
  const qrY = y + 3;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(180, 140, 40); // gold QR border
  doc.setLineWidth(0.5);
  doc.roundedRect(qrX, qrY, qrW, qrH, 1, 1, "FD");

  if (data.qrCodeBase64 && data.qrCodeBase64.startsWith("data:image")) {
    try {
      doc.addImage(data.qrCodeBase64, "PNG", qrX + 1, qrY + 1, qrW - 2, qrH - 2);
    } catch {
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text("QR", qrX + qrW / 2, qrY + qrH / 2, { align: "center" });
    }
  } else {
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text("QR", qrX + qrW / 2, qrY + qrH / 2, { align: "center" });
  }

  // ── Signatures Section ────────────────────────────────────────────
  y = 228;
  const colW = contentWidth / 3;

  // 1. Candidate (Left)
  const x1 = margin + colW / 2;
  doc.setDrawColor(37, 99, 160);
  doc.setLineWidth(0.4);
  doc.line(margin + 8, y + 10, margin + colW - 8, y + 10);

  doc.setFont("courier", "oblique");
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 95); // deep navy signature
  doc.text(data.fullName, x1, y + 8, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(data.fullName, x1, y + 14, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Candidate Signature", x1, y + 18, { align: "center" });

  // 2. HOD (Middle) — blank cursive line for physical signing
  const x2 = margin + colW + colW / 2;
  doc.line(margin + colW + 8, y + 10, margin + colW * 2 - 8, y + 10);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(data.hodName || "Head of Department", x2, y + 14, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Head of Department", x2, y + 18, { align: "center" });

  // 3. Founder (Right)
  const x3 = margin + colW * 2 + colW / 2;
  doc.line(margin + colW * 2 + 8, y + 10, margin + contentWidth - 8, y + 10);

  doc.setFont("courier", "oblique");
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 95);
  doc.text("Jami Eswar", x3, y + 8, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Jami Eswar Anil Kumar", x3, y + 14, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Founder & Managing Director", x3, y + 18, { align: "center" });

  // ── Footer ────────────────────────────────────────────────────────
  y = 260;
  // Gold footer line
  doc.setFillColor(180, 140, 40);
  doc.rect(margin, y, contentWidth, 0.8, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "This document is an official No Objection Certificate issued by Vyntyra Consultancy Services, Dwaraka Nagar, Visakhapatnam - 530016.",
    pageWidth / 2, y + 5, { align: "center" }
  );
  doc.text(
    "UDYAM Reg: UDYAM-AP-10-0143100  ·  Validity verifiable at careers.vyntyraconsultancyservices.in",
    pageWidth / 2, y + 10, { align: "center" }
  );

  // Bottom gold strip
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 284, pageWidth, 13, "F");
  doc.setFillColor(180, 140, 40);
  doc.rect(0, 284, pageWidth, 1.5, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(200, 215, 235);
  doc.text("Vyntyra Consultancy Services  ·  Dwaraka Nagar, Visakhapatnam - 530016, Andhra Pradesh, India", pageWidth / 2, 290, { align: "center" });
  doc.text("hr@vyntyraconsultancyservices.in  ·  careers.vyntyraconsultancyservices.in", pageWidth / 2, 294, { align: "center" });

  return doc;
}
