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

// ── Palette ──────────────────────────────────────────────────────────────
// Navy:   (30, 58, 95)   │  Gold:  (180, 140, 40)
// Royal:  (37, 99, 160)  │  Body:  (33, 53, 78)
// Muted:  (100,116,139)  │  Bg:    (245, 247, 250)

import { resolveGooglePhotosUrl } from "./google-photos";

export async function urlToBase64(url: string): Promise<string | null> {
  try {
    if (!url) return null;
    const resolvedUrl = await resolveGooglePhotosUrl(url);
    if (!resolvedUrl) return null;
    if (resolvedUrl.startsWith("data:image")) return resolvedUrl;
    const res = await fetch(resolvedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("[nocGenerator] urlToBase64 error:", err);
    return null;
  }
}

export function generateNocPdf(data: NocData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const margin   = 14;
  const pageW    = 210;
  const cW       = pageW - margin * 2;       // 182 mm content width
  const rEdge    = margin + cW;              // right edge  = 196 mm

  // ── Top gold stripe ─────────────────────────────────────────────────
  doc.setFillColor(180, 140, 40);
  doc.rect(0, 0, pageW, 2.5, "F");

  // ── Header banner ───────────────────────────────────────────────────
  doc.setFillColor(30, 58, 95);
  doc.rect(margin, 6, cW, 30, "F");

  // Logo / crest (left zone: margin+4 to margin+22)
  if (data.logoBase64 && data.logoBase64.startsWith("data:image")) {
    try {
      doc.addImage(data.logoBase64, "PNG", margin + 4, 11, 14, 14);
    } catch {
      _drawVCrest(doc, margin + 4, 11);
    }
  } else {
    _drawVCrest(doc, margin + 4, 11);
  }

  // Company name & subtitle (logo width 14 + 4 gap = margin+22)
  const brandX = margin + 22;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("VYNTYRA CONSULTANCY SERVICES", brandX, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(190, 210, 235);
  doc.text("Corporate Human Resources & Industrial Training Division", brandX, 22);

  // Gold rule below subtitle
  doc.setDrawColor(180, 140, 40);
  doc.setLineWidth(0.35);
  doc.line(brandX, 24.5, rEdge - 4, 24.5);

  // Right-side metadata block — kept in right 72 mm to avoid overlap
  // (brandX ≈ 36 mm; right meta max width ≈ 70 mm ending at rEdge-4 ≈ 192 mm)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(190, 210, 235);
  const metaX = rEdge - 4;
  doc.text("Dwaraka Nagar, Visakhapatnam - 530016, AP", metaX, 11, { align: "right" });
  doc.text("hr@vyntyraconsultancyservices.in", metaX, 16, { align: "right" });
  doc.text("UDYAM: UDYAM-AP-10-0143100", metaX, 21, { align: "right" });
  doc.text("Ref: NOC/VYN/2026/" + data.applicationId.slice(0, 8).toUpperCase(), metaX, 26, { align: "right" });

  // Gold bottom border of header
  doc.setFillColor(180, 140, 40);
  doc.rect(margin, 36, cW, 1, "F");

  // ── Title strip (royal blue) ─────────────────────────────────────────
  doc.setFillColor(37, 99, 160);
  doc.rect(margin, 39, cW, 10, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text(
    "NO OBJECTION CERTIFICATE  ·  SELECTION CONFIRMATION",
    pageW / 2, 45.5, { align: "center" }
  );

  // ── Candidate details card ───────────────────────────────────────────
  const cardY  = 52;
  const cardH  = 54;
  doc.setDrawColor(180, 200, 220);
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, cardY, cW, cardH, 1.5, 1.5, "FD");

  // Blue left accent bar
  doc.setFillColor(37, 99, 160);
  doc.rect(margin, cardY, 3, cardH, "F");

  // Photo box  — right side of card, 30 × 37 mm
  const photoW = 30;
  const photoH = 37;
  const photoX = rEdge - photoW - 5;
  const photoY = cardY + 8;

  doc.setFillColor(220, 230, 245);
  doc.setDrawColor(37, 99, 160);
  doc.setLineWidth(0.4);
  doc.roundedRect(photoX, photoY, photoW, photoH, 1, 1, "FD");

  if (data.profilePhotoUrl && data.profilePhotoUrl.startsWith("data:image")) {
    try {
      doc.addImage(data.profilePhotoUrl, "JPEG", photoX, photoY, photoW, photoH);
    } catch {
      _photoPlaceholder(doc, photoX, photoY, photoW, photoH);
    }
  } else {
    _photoPlaceholder(doc, photoX, photoY, photoW, photoH);
  }

  // Detail rows — values capped so they don't reach the photo
  const labelX  = margin + 7;
  const valueX  = margin + 52;
  const valueMaxW = photoX - valueX - 3;   // ~75 mm — safe zone before photo
  let rowY = cardY + 10;

  const rows = [
    { label: "Applicant Name:",        val: data.fullName },
    { label: "Email Address:",         val: data.email },
    { label: "College / Institution:", val: data.college || "Academic Institution" },
    { label: "Domain Track:",          val: data.domain || "Technology & Software" },
    { label: "Sub-Domain:",            val: data.subDomain || "Full Stack Web Development" },
    { label: "Start Date:",            val: data.internshipStartDate || "Immediate" },
    { label: "Application Ref:",       val: data.applicationId.slice(0, 8).toUpperCase() },
  ];

  doc.setFontSize(8.5);
  rows.forEach((r) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 160);
    doc.text(r.label, labelX, rowY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    // Clamp long values to a single line by truncating with splitTextToSize
    const lines = doc.splitTextToSize(r.val, valueMaxW) as string[];
    doc.text(lines[0] + (lines.length > 1 ? "…" : ""), valueX, rowY);
    rowY += 6.2;
  });

  // ── Body paragraphs ──────────────────────────────────────────────────
  let y = 113;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(33, 53, 78);
  const lineH = 5.2;

  const paras = [
    `This is to certify that ${data.fullName}, a registered student at ${data.college || "their institution"} (Email: ${data.email}), has been officially selected for the Vyntyra Industrial Internship Program 2026 under Project VyNexa.`,
    `The candidate will undergo specialised technical training and industrial project implementation in ${data.domain || "Software Engineering"} (${data.subDomain || "Full Stack Web Development"}), commencing on ${data.internshipStartDate || "the scheduled start date"}.`,
    `Vyntyra Consultancy Services hereby issues this NO OBJECTION CERTIFICATE (NOC) confirming that the organisation has no objection to ${data.fullName} pursuing this internship concurrently with their academic programme. All training, project execution and evaluation shall comply with corporate industry standards.`,
    `We extend our warmest congratulations to the selected candidate and look forward to a productive and impactful internship engagement.`,
  ];

  paras.forEach((p) => {
    const lines = doc.splitTextToSize(p, cW) as string[];
    doc.text(lines, margin, y);
    y += lines.length * lineH + 4;
  });

  // ── Verification & Security Seal ─────────────────────────────────────
  const sealY = 192;
  const sealH = 28;
  doc.setFillColor(235, 242, 250);
  doc.setDrawColor(37, 99, 160);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, sealY, cW, sealH, 1.5, 1.5, "FD");

  // Gold left bar
  doc.setFillColor(180, 140, 40);
  doc.rect(margin, sealY, 3, sealH, "F");

  // QR code (right of seal box)
  const qrW  = 22;
  const qrH  = 22;
  const qrX  = rEdge - qrW - 3;
  const qrY  = sealY + 3;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(180, 140, 40);
  doc.setLineWidth(0.5);
  doc.roundedRect(qrX, qrY, qrW, qrH, 1, 1, "FD");

  if (data.qrCodeBase64 && data.qrCodeBase64.startsWith("data:image")) {
    try {
      doc.addImage(data.qrCodeBase64, "PNG", qrX + 1, qrY + 1, qrW - 2, qrH - 2);
    } catch {
      _qrPlaceholder(doc, qrX, qrY, qrW, qrH);
    }
  } else {
    _qrPlaceholder(doc, qrX, qrY, qrW, qrH);
  }

  // Seal text — max width stops before QR box
  const sealTextMaxW = qrX - margin - 10;
  const refId  = data.applicationId.slice(0, 8).toUpperCase();
  const issued = data.issueDate || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.setTextColor(30, 58, 95);
  doc.text("VERIFICATION & SECURITY SEAL", margin + 7, sealY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(33, 53, 78);
  doc.text(`Issue Date: ${issued}`, margin + 7, sealY + 13);
  doc.text(`Verification: careers.vyntyraconsultancyservices.in/verify?id=${refId}`, margin + 7, sealY + 18, { maxWidth: sealTextMaxW });
  doc.text("ISO 9001:2015 Compliant  ·  UDYAM-AP-10-0143100  ·  Securely Signed & Verified", margin + 7, sealY + 23, { maxWidth: sealTextMaxW });

  // ── Signature section ────────────────────────────────────────────────
  const sigY  = 228;
  const colW  = cW / 3;

  // Helper draws one signature column
  function drawSig(cx: number, line1: string, line2: string, label: string, isScript: boolean) {
    const lx1 = cx - colW / 2 + 8;
    const lx2 = cx + colW / 2 - 8;
    doc.setDrawColor(37, 99, 160);
    doc.setLineWidth(0.4);
    doc.line(lx1, sigY + 10, lx2, sigY + 10);

    if (isScript && line1) {
      doc.setFont("courier", "oblique");
      doc.setFontSize(9.5);
      doc.setTextColor(30, 58, 95);
      // Clamp cursive name to column width
      const scriptLines = doc.splitTextToSize(line1, colW - 16) as string[];
      doc.text(scriptLines[0], cx, sigY + 8, { align: "center" });
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    const boldLines = doc.splitTextToSize(line2, colW - 10) as string[];
    doc.text(boldLines[0], cx, sigY + 14, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(label, cx, sigY + 18.5, { align: "center" });
  }

  const c1 = margin + colW / 2;
  const c2 = margin + colW + colW / 2;
  const c3 = margin + colW * 2 + colW / 2;

  drawSig(c1, data.fullName, data.fullName, "Candidate Signature", true);
  drawSig(c2, "", data.hodName || "Head of Department", "Head of Department", false);
  drawSig(c3, "Jami Eswar", "Jami Eswar Anil Kumar", "Founder & Managing Director", true);

  // ── Footer ───────────────────────────────────────────────────────────
  const footerY = 254;
  doc.setFillColor(180, 140, 40);
  doc.rect(margin, footerY, cW, 0.7, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(120, 130, 145);
  doc.text(
    "Official No Objection Certificate — Vyntyra Consultancy Services, Dwaraka Nagar, Visakhapatnam - 530016, AP",
    pageW / 2, footerY + 4.5, { align: "center" }
  );
  doc.text(
    "UDYAM Reg: UDYAM-AP-10-0143100  ·  careers.vyntyraconsultancyservices.in",
    pageW / 2, footerY + 9, { align: "center" }
  );

  // Bottom navy bar
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 269, pageW, 28, "F");
  doc.setFillColor(180, 140, 40);
  doc.rect(0, 269, pageW, 1.5, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(200, 215, 235);
  doc.text(
    "Vyntyra Consultancy Services  ·  Dwaraka Nagar, Visakhapatnam - 530016, Andhra Pradesh, India",
    pageW / 2, 276, { align: "center" }
  );
  doc.text(
    "hr@vyntyraconsultancyservices.in  ·  careers.vyntyraconsultancyservices.in",
    pageW / 2, 281, { align: "center" }
  );
  doc.text(
    "UDYAM: UDYAM-AP-10-0143100  ·  ISO 9001:2015 Compliant",
    pageW / 2, 286, { align: "center" }
  );

  return doc;
}

// ── Internal helpers ──────────────────────────────────────────────────────
function _drawVCrest(doc: jsPDF, x: number, y: number) {
  doc.setFillColor(180, 140, 40);
  doc.roundedRect(x, y, 14, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("V", x + 7, y + 9, { align: "center" });
}

function _photoPlaceholder(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("PHOTO", x + w / 2, y + h / 2, { align: "center" });
}

function _qrPlaceholder(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("QR", x + w / 2, y + h / 2, { align: "center" });
}
