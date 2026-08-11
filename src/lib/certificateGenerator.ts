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
  templateBase64?: string | null;
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

  // 1. Render Full-Bleed Background Template
  if (data.templateBase64 && data.templateBase64.startsWith("data:image")) {
    try {
      doc.addImage(data.templateBase64, "PNG", 0, 0, pageW, pageH);
    } catch (e) {
      console.warn("Failed to render background template image:", e);
    }
  }

  // 2. Render Dynamic Scannable QR Code (Bottom Left - Perfect Non-overlapping Box Position)
  if (data.qrCodeBase64 && data.qrCodeBase64.startsWith("data:image")) {
    try {
      // Positioned cleanly inside the left QR box above SCAN TO VERIFY (x: 14.5mm, y: 136.5mm, size: 22mm x 22mm)
      doc.addImage(data.qrCodeBase64, "PNG", 14.5, 136.5, 22, 22);
    } catch (e) {
      console.warn("Failed to render QR Code:", e);
    }
  }

  // Certificate / Intern ID Label neatly under the QR Code
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text(data.certificateId || data.internId, 25.5, 169.5, { align: "center" });

  // 3. Intern ID Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`INTERN ID : ${data.internId}`, 54, 71);

  // 4. Candidate Name (Ultra-Stylish Executive International Times Serif)
  doc.setFont("times", "bold");
  doc.setFontSize(26);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text((data.candidateName || "CANDIDATE NAME").toUpperCase(), 54, 84);

  // 5. Completion Sub-heading
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text("has successfully completed the industrial internship program with distinction in", 54, 94);

  // 6. Domain Name (Times Bold Serif)
  doc.setFont("times", "bold");
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(`DOMAIN NAME : ${(data.domainName || "SOFTWARE ENGINEERING").toUpperCase()}`, 54, 105);

  // 7. Sub-Domain Name (Times Bold Serif)
  doc.setFont("times", "bold");
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(`SUB-DOMAIN NAME: ${(data.subDomainName || "FULL STACK WEB DEVELOPMENT").toUpperCase()}`, 54, 115);

  // 8. Internship Period (From Date - End Date)
  const startDateStr = data.startDate || "12 Jun 2026";
  const endDateStr = data.completionDate || "12 Aug 2026";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Internship Period : ${startDateStr} to ${endDateStr}`, 54, 125);

  // 9. Detailed Corporate Description Paragraphs
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text("During this internship, the candidate engaged in real-world project engineering, system architecture design,", 54, 134);
  doc.text("and collaborative software development adhering to global corporate benchmarks.", 54, 139);

  // Ownership & Collaboration Line
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("Developed & Delivered by Vyntyra Academy  ·  In Collaboration with Vyntyra Consultancy Services Pvt. Ltd.", 54, 147);

  // 10. Date of Certificate (Issue Date)
  const certDate = data.issueDate || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Date of Certificate: ${certDate}`, 54, 168);

  // 11. Crisp Clear Macro Disclaimer Text at Bottom
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("This is an Official Blockchain-Verified Credential issued by Vyntyra Consultancy Services Pvt. Ltd.", 54, 185);
  doc.text("Registered & Verified Employer on NASSCOM Talent Connect Portal  ·  ISO 9001:2015 Quality Certified  ·  MSME Member", 54, 190);
  doc.text("Authenticity can be verified 24/7 by scanning the QR code or visiting https://careers.vyntyraconsultancyservices.in/verify", 54, 195);

  return doc;
}
