import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface MarksheetTask {
  title: string;
  domain: string;
  status: string;
  credits: number;
  completedAt: string;
}

export interface MarksheetData {
  candidateName: string;
  internId: string;
  domainName: string;
  startDate: string;
  endDate: string;
  issueDate: string;
  tasks: MarksheetTask[];
  totalCredits: number;
  maxCredits: number;
  grade: string;
}

export function generateExperienceMarksheetPdf(data: MarksheetData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageW = 210;
  const pageH = 297;

  // Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, pageH, "F");

  // Border
  doc.setDrawColor(11, 92, 255);
  doc.setLineWidth(1.5);
  doc.rect(10, 10, pageW - 20, pageH - 20);

  // Inner Border
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(12, 12, pageW - 24, pageH - 24);

  // Logo / Header
  // Since we don't have the image bytes here natively without fetching, we'll draw text branding
  doc.setTextColor(11, 92, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("VYNTYRA", pageW / 2, 35, { align: "center" });

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("CONSULTANCY SERVICES", pageW / 2, 42, { align: "center" });

  // Marksheet Title
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("KNOWLEDGE & WORK EXPERIENCE MARKSHEET", pageW / 2, 60, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "italic");
  doc.text("Official Record of Project Level Experience & Credits", pageW / 2, 67, { align: "center" });

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 75, pageW - 20, 75);

  // Candidate Details
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Candidate Details", 20, 85);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Name:`, 20, 95);
  doc.setFont("helvetica", "bold");
  doc.text(data.candidateName, 50, 95);

  doc.setFont("helvetica", "normal");
  doc.text(`Intern ID:`, 20, 102);
  doc.setFont("helvetica", "bold");
  doc.text(data.internId, 50, 102);

  doc.setFont("helvetica", "normal");
  doc.text(`Domain:`, 110, 95);
  doc.setFont("helvetica", "bold");
  doc.text(data.domainName, 140, 95);

  doc.setFont("helvetica", "normal");
  doc.text(`Period:`, 110, 102);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.startDate} to ${data.endDate}`, 140, 102);

  // Table
  const tableRows = data.tasks.map((t, index) => [
    (index + 1).toString(),
    t.title,
    t.domain,
    t.credits.toString(),
    t.completedAt
  ]);

  autoTable(doc, {
    startY: 115,
    head: [['#', 'Project / Task Description', 'Domain', 'Credits', 'Completed Date']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [11, 92, 255], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 80 },
      2: { cellWidth: 35 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 35 }
    },
    margin: { left: 20, right: 20 },
  });

  // Final Grade and Credits
  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY + 15;
  
  doc.setFillColor(240, 245, 255);
  doc.rect(20, finalY, pageW - 40, 30, "F");
  
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  
  doc.text("Final Assessment", 25, finalY + 10);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Credits Earned:`, 25, finalY + 18);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.totalCredits} / ${data.maxCredits}`, 65, finalY + 18);

  doc.setFont("helvetica", "normal");
  doc.text(`Overall Performance Grade:`, 25, finalY + 25);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(11, 92, 255);
  doc.text(data.grade, 75, finalY + 25);

  // Signatures
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  // Founder Signature
  doc.text("JAMI ESWAR ANIL KUMAR", pageW - 20, pageH - 40, { align: "right" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Founder & Director", pageW - 20, pageH - 35, { align: "right" });
  doc.text("Vyntyra Consultancy Services", pageW - 20, pageH - 30, { align: "right" });

  doc.setFontSize(9);
  doc.text(`Issue Date: ${data.issueDate}`, 20, pageH - 30);
  
  return doc;
}
