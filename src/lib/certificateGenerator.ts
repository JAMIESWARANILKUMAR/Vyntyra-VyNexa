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

  // 2. Render Dynamic Scannable QR Code (Bottom Left)
  if (data.qrCodeBase64 && data.qrCodeBase64.startsWith("data:image")) {
    try {
      // Overlays on top of the left QR box (x: 13.5mm, y: 153mm, size: 25mm x 25mm)
      doc.addImage(data.qrCodeBase64, "PNG", 13.5, 153, 25, 25);
    } catch (e) {
      console.warn("Failed to render QR Code:", e);
    }
  }

  // Certificate / Intern ID Label under QR Code
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`ID: ${data.certificateId || data.internId}`, 26, 182.5, { align: "center" });

  // 3. Intern ID Header (Top of text block)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`INTERN ID : ${data.internId}`, 54, 71);

  // 4. Candidate Name (Ultra-Premium Times Bold Serif Typography)
  doc.setFont("times", "bold");
  doc.setFontSize(26);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text((data.candidateName || "CANDIDATE NAME").toUpperCase(), 54, 85);

  // 5. Completion Sub-heading
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(71, 85, 105);
  doc.text("has successfully completed the industrial internship program and demonstrated exceptional technical proficiency in", 54, 96);

  // 6. Domain Name (Times Bold Serif)
  doc.setFont("times", "bold");
  doc.setFontSize(15.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`DOMAIN NAME : ${(data.domainName || "SOFTWARE ENGINEERING").toUpperCase()}`, 54, 108);

  // 7. Sub-Domain Name (Times Bold Serif)
  doc.setFont("times", "bold");
  doc.setFontSize(15.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`SUB-DOMAIN NAME: ${(data.subDomainName || "FULL STACK WEB DEVELOPMENT").toUpperCase()}`, 54, 118);

  // 8. Detailed Corporate Description Paragraphs
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("During this period, the candidate engaged in real-world project engineering, system architecture design,", 54, 127);
  doc.text("and collaborative software development aligned with international industry benchmarks.", 54, 132);

  // Ownership & Collaboration Line
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Developed & Delivered by Vyntyra Academy  ·  In Collaboration with Vyntyra Consultancy Services Pvt. Ltd.", 54, 140);

  // Accreditation & Quality Alignment Line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("ISO 9001:2015 Quality Certified  ·  NASSCOM FutureSkills Prime Partner  ·  MSME Business Forum India", 54, 146);

  // 9. Date of Certificate (Bottom Left Alignment)
  const certDate = data.issueDate || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Date of Certificate: ${certDate}`, 54, 189);

  return doc;
}
