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
  templateBase64?: string | null;
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

  // Render Full-Bleed Background Template if available
  if (data.templateBase64 && data.templateBase64.startsWith("data:image")) {
    try {
      doc.addImage(data.templateBase64, "PNG", 0, 0, pageW, pageH);
    } catch (e) {
      console.warn("Failed to render background template image:", e);
    }
  }

  // 1. Intern ID Label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Intern ID: ${data.internId}`, 54, 76);

  // 2. Name of the Candidate (Prominent Uppercase)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text((data.candidateName || "CANDIDATE NAME").toUpperCase(), 54, 91);

  // 3. Completion Sub-heading
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(100, 116, 139);
  doc.text("has Successfully Participated & Completed", 54, 103);

  // 4. Domain Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`DOMAIN NAME : ${(data.domainName || "SOFTWARE ENGINEERING").toUpperCase()}`, 54, 116);

  // 5. Sub-Domain Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`SUB-DOMAIN NAME: ${(data.subDomainName || "FULL STACK WEB DEVELOPMENT").toUpperCase()}`, 54, 127);

  // 6. Program Description Text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text("This Program has been developed and delivered by Vyntyra Academy.", 54, 139);
  doc.text("With Collaboration with Vyntyra Consultancy Services Pvt. Ltd.", 54, 145);

  // 7. Date of Certificate (Bottom Left Alignment)
  const certDate = data.issueDate || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text(`Date of Certificate: ${certDate}`, 54, 189);

  // 8. Certificate / Intern ID Label under QR Code
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`ID: ${data.certificateId || data.internId}`, 26, 189, { align: "center" });

  return doc;
}
