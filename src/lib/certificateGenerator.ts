import jsPDF from "jspdf";

export interface InternshipCertificateData {
  candidateName: string;
  internId: string;
  domainName: string;
  subDomainName: string;
  startDate?: string;
  completionDate?: string;
  issueDate?: string;
  certificateId?: string;
  qrCodeBase64?: string | null;
  performanceGrade?: string;
}

export function generateInternshipCertificatePdf(data: InternshipCertificateData): jsPDF {
  // A4 Landscape orientation: 297mm width x 210mm height
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageW = 297;
  const pageH = 210;

  // ─── 1. PURE VECTOR CANVAS BACKGROUND ────────────────────────
  // Pure crisp white canvas background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, pageH, "F");

  // Premium Gold & Navy Double Line Border
  doc.setDrawColor(217, 119, 6); // Amber / Gold (1.2mm)
  doc.setLineWidth(1.2);
  doc.rect(6, 6, pageW - 12, pageH - 12);

  doc.setDrawColor(15, 23, 42); // Slate / Royal Navy (0.4mm)
  doc.setLineWidth(0.4);
  doc.rect(8, 8, pageW - 16, pageH - 16);

  // Corner Accent Diamonds (Gold)
  const drawCornerDiamond = (x: number, y: number) => {
    doc.setFillColor(217, 119, 6);
    doc.polygon([
      { x: x, y: y - 2.5 },
      { x: x + 2.5, y: y },
      { x: x, y: y + 2.5 },
      { x: x - 2.5, y: y },
    ], "F");
  };
  drawCornerDiamond(8, 8);
  drawCornerDiamond(pageW - 8, 8);
  drawCornerDiamond(8, pageH - 8);
  drawCornerDiamond(pageW - 8, pageH - 8);

  // ─── 2. LEFT EXECUTIVE PURPLE / MAGENTA RIBBON PILLAR ─────────
  const ribbonX = 12;
  const ribbonY = 12;
  const ribbonW = 34;
  const ribbonH = pageH - 24;

  doc.setFillColor(153, 27, 107); // Rich Magenta / Deep Purple
  doc.rect(ribbonX, ribbonY, ribbonW, ribbonH, "F");

  // Ribbon Top Decorative Notch
  doc.setFillColor(255, 255, 255);
  doc.polygon([
    { x: ribbonX, y: ribbonY },
    { x: ribbonX + ribbonW / 2, y: ribbonY + 6 },
    { x: ribbonX + ribbonW, y: ribbonY },
  ], "F");

  // Vyntyra Academy Brand Title in Left Ribbon Pillar
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("Vyntyra", ribbonX + ribbonW / 2, ribbonY + 22, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(252, 211, 77); // Amber Gold
  doc.text("ACADEMY", ribbonX + ribbonW / 2, ribbonY + 27, { align: "center" });

  // Circuit Pattern Accents inside Ribbon
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.line(ribbonX + 6, ribbonY + 36, ribbonX + ribbonW - 6, ribbonY + 36);
  doc.line(ribbonX + 6, ribbonY + 44, ribbonX + ribbonW - 6, ribbonY + 44);

  // ─── 3. SCANNABLE QR CODE & CREDENTIAL BADGE (IN LEFT RIBBON) ──
  const qrBoxX = ribbonX + 4.5;
  const qrBoxY = ribbonY + 118;
  const qrBoxSize = 25;

  // QR Code Container Box
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(qrBoxX - 1, qrBoxY - 1, qrBoxSize + 2, qrBoxSize + 2, 2, 2, "F");

  if (data.qrCodeBase64 && data.qrCodeBase64.startsWith("data:image")) {
    try {
      doc.addImage(data.qrCodeBase64, "PNG", qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
    } catch (e) {
      console.warn("Failed to render QR code:", e);
    }
  } else {
    // Placeholder QR Box Graphic
    doc.setDrawColor(153, 27, 107);
    doc.rect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
  }

  // QR Verification Label Text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text("SCAN TO VERIFY", ribbonX + ribbonW / 2, qrBoxY + qrBoxSize + 5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(252, 211, 77); // Amber Gold
  doc.text(data.certificateId || data.internId, ribbonX + ribbonW / 2, qrBoxY + qrBoxSize + 8.5, { align: "center" });

  // ─── 4. TOP CORPORATE ACCREDITATION HEADER LOGOS ───────────────
  const contentLeft = 54;
  const headerY = 20;

  // Left Accreditation: NASSCOM | FutureSkills Prime
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(185, 28, 28); // Nasscom Red
  doc.text("nasscom", contentLeft, headerY + 6);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(contentLeft + 27, headerY, contentLeft + 27, headerY + 12);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(3, 105, 161); // FutureSkills Blue
  doc.text("futureskills", contentLeft + 31, headerY + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(225, 29, 72);
  doc.text("prime", contentLeft + 72, headerY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("A MeitY - nasscom Digital Skilling Initiative", contentLeft + 31, headerY + 9.5);

  // Right Accreditation Logos: MSME · VYNTYRA · SKILL INDIA · GOVT OF INDIA
  const rightHeaderX = pageW - 18;

  // Govt Emblem
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text("GOVERNMENT OF INDIA", rightHeaderX, headerY + 2, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text("MINISTRY OF SKILL DEVELOPMENT", rightHeaderX, headerY + 5.5, { align: "right" });
  doc.text("& ENTREPRENEURSHIP", rightHeaderX, headerY + 8.5, { align: "right" });

  // Skill India
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 58, 138);
  doc.text("Skill India", rightHeaderX - 58, headerY + 4, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text("कौशल भारत - कुशल भारत", rightHeaderX - 58, headerY + 7.5, { align: "right" });

  // VYNTYRA
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("VYNTYRA", rightHeaderX - 98, headerY + 4, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5);
  doc.setTextColor(100, 116, 139);
  doc.text("CONSULTANCY SERVICES", rightHeaderX - 98, headerY + 7.5, { align: "right" });

  // MSME
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(67, 56, 202);
  doc.text("MSME", rightHeaderX - 138, headerY + 4, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.setTextColor(100, 116, 139);
  doc.text("BUSINESS FORUM INDIA", rightHeaderX - 138, headerY + 7.5, { align: "right" });

  // Divider line under header
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(contentLeft, headerY + 16, pageW - 18, headerY + 16);

  // ─── 5. CERTIFICATE BODY CONTENT & TYPOGRAPHY ─────────────────

  // Intern ID Badge Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`INTERN ID : ${data.internId}`, contentLeft, 66);

  // Candidate Name (Ultra-Stylish Executive International Times Serif)
  doc.setFont("times", "bold");
  doc.setFontSize(26);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text((data.candidateName || "CANDIDATE NAME").toUpperCase(), contentLeft, 79);

  // Completion Sub-heading
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text("has successfully completed the industrial internship program with distinction in", contentLeft, 89);

  // Domain Name (Times Bold Serif)
  doc.setFont("times", "bold");
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(`DOMAIN NAME : ${(data.domainName || "SOFTWARE ENGINEERING").toUpperCase()}`, contentLeft, 100);

  // Sub-Domain Name (Times Bold Serif)
  doc.setFont("times", "bold");
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(`SUB-DOMAIN NAME: ${(data.subDomainName || "FULL STACK WEB DEVELOPMENT").toUpperCase()}`, contentLeft, 110);

  // Internship Period (From Date - End Date)
  const startDateStr = data.startDate || "12 Jun 2026";
  const endDateStr = data.completionDate || "12 Aug 2026";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Internship Period : ${startDateStr} to ${endDateStr}`, contentLeft, 120);

  // Detailed Corporate Description Paragraphs
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text("During this internship, the candidate engaged in real-world project engineering, system architecture design,", contentLeft, 129);
  doc.text("and collaborative software development adhering to global corporate benchmarks.", contentLeft, 134);

  // Ownership & Collaboration Line
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("Developed & Delivered by Vyntyra Academy  ·  In Collaboration with Vyntyra Consultancy Services Pvt. Ltd.", contentLeft, 142);

  // Date of Certificate (Issue Date)
  const certDate = data.issueDate || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Date of Certificate: ${certDate}`, contentLeft, 164);

  // ─── 6. BOTTOM AUTHORIZED SIGNATORY SECTION ─────────────────────
  const sigX = pageW - 24;

  // Digital Signature Graphic Line / Handwriting
  doc.setFont("times", "bolditalic");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text("J. Eswar Anil Kumar..", sigX, 150, { align: "right" });

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.line(sigX - 60, 153, sigX, 153);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("JAMI ESWAR ANIL KUMAR", sigX, 158, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Founder & Managing Director", sigX, 162.5, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text("Vyntyra Academy & Vyntyra Consultancy Services", sigX, 166.5, { align: "right" });

  // ─── 7. CRISP CLEAR MACRO DISCLAIMER TEXT AT BOTTOM ────────────
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(contentLeft, 177, pageW - 18, 177);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("This is an Official Blockchain-Verified Credential issued by Vyntyra Consultancy Services Pvt. Ltd.", contentLeft, 183);
  doc.text("Registered & Verified Employer on NASSCOM Talent Connect Portal  ·  ISO 9001:2015 Quality Certified  ·  MSME Member", contentLeft, 188);
  doc.text("Authenticity can be verified 24/7 by scanning the QR code or visiting https://careers.vyntyraconsultancyservices.in/verify", contentLeft, 193);

  return doc;
}
