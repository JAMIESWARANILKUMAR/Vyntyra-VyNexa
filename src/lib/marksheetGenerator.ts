import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface MarksheetTask {
  milestone: string;
  title: string;
  domain: string;
  status: string;
  credits: number;
  cbtScore: string;
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
  signatureBase64?: string | null;
  logoBase64?: string | null;
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

  // Header Branding
  doc.setTextColor(11, 92, 255);
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text("VYNTYRA", pageW / 2, 32, { align: "center" });

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("CONSULTANCY SERVICES", pageW / 2, 38, { align: "center" });

  // Marksheet Title
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("KNOWLEDGE & WORK EXPERIENCE MARKSHEET", pageW / 2, 53, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text("Official Record of 6-Task Milestones, CBT Evaluations & Project Credits", pageW / 2, 59, { align: "center" });

  // Divider Line
  doc.setDrawColor(220, 226, 235);
  doc.line(20, 65, pageW - 20, 65);

  // Candidate Metadata
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(11, 92, 255);
  doc.text("CANDIDATE PROFILE & INTERNSHIP SUMMARY", 20, 74);
  
  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  
  doc.text(`Candidate Name:`, 20, 82);
  doc.setFont("helvetica", "bold");
  doc.text(data.candidateName, 52, 82);

  doc.setFont("helvetica", "normal");
  doc.text(`Intern ID / Reg:`, 20, 89);
  doc.setFont("helvetica", "bold");
  doc.text(data.internId, 52, 89);

  doc.setFont("helvetica", "normal");
  doc.text(`Domain Track:`, 115, 82);
  doc.setFont("helvetica", "bold");
  doc.text(data.domainName, 145, 82);

  doc.setFont("helvetica", "normal");
  doc.text(`Tenure Period:`, 115, 89);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.startDate} to ${data.endDate}`, 145, 89);

  // Table Data mapping Task 1..6 + Final Project
  const tableRows = data.tasks.map((t, index) => [
    (index + 1).toString(),
    t.milestone || `Task ${index + 1}`,
    t.title || "Pending Assignment",
    t.credits ? `${t.credits} pts` : "0 pts",
    t.cbtScore || "N/A",
    t.status.toUpperCase()
  ]);

  autoTable(doc, {
    startY: 97,
    head: [['#', 'Milestone', 'Project / Task Description', 'Credits', 'CBT Test Score', 'Status']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [11, 92, 255], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 8.5, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 28, fontStyle: 'bold' },
      2: { cellWidth: 62 },
      3: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 28, halign: 'center' },
      5: { cellWidth: 24, halign: 'center', fontStyle: 'bold' }
    },
    margin: { left: 20, right: 20 },
  });

  // Final Assessment Block
  // @ts-ignore
  const finalY = (doc.lastAutoTable?.finalY || 180) + 10;
  
  doc.setFillColor(245, 248, 255);
  doc.setDrawColor(210, 222, 250);
  doc.rect(20, finalY, pageW - 40, 26, "FD");
  
  doc.setFontSize(11);
  doc.setTextColor(11, 92, 255);
  doc.setFont("helvetica", "bold");
  doc.text("FINAL EVALUATION & CREDIT ACUMULATION", 25, finalY + 8);
  
  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Credits Earned:`, 25, finalY + 18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`${data.totalCredits} / ${data.maxCredits} Points`, 62, finalY + 18);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text(`Overall Performance Grade:`, 115, finalY + 18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(11, 92, 255);
  doc.text(data.grade, 162, finalY + 18);

  // Founder Signature
  if (data.signatureBase64 && data.signatureBase64.startsWith("data:image")) {
    try {
      doc.addImage(data.signatureBase64, "PNG", pageW - 70, pageH - 58, 48, 16);
    } catch (e) {
      console.warn("Could not render signature image on marksheet:", e);
    }
  }

  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("JAMI ESWAR ANIL KUMAR", pageW - 20, pageH - 38, { align: "right" });
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Founder & Director", pageW - 20, pageH - 33, { align: "right" });
  doc.text("Vyntyra Consultancy Services", pageW - 20, pageH - 28, { align: "right" });

  doc.setFontSize(8.5);
  doc.setTextColor(120, 120, 120);
  doc.text(`Issue Date: ${data.issueDate}`, 20, pageH - 28);
  doc.text(`Document Ref: MARKSHEET-${data.internId.toUpperCase()}`, 20, pageH - 23);
  
  return doc;
}
