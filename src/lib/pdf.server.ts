import { jsPDF } from "jspdf";
import { getAdminClient } from "@/integrations/supabase/admin";
import fs from "fs";
import path from "path";

export interface IOfferDetails {
  fullName: string;
  roleApplied: string;
  applicationId: string;
  salary?: string;
  joiningDate?: string;
  endDate?: string;
  jobLocation?: string;
  domain?: string;
  subDomain?: string;
}

function getLocalAssetBase64(filename: string): string | null {
  try {
    const projectRoot = process.cwd();
    const publicPath = path.join(projectRoot, "public", filename);
    if (fs.existsSync(publicPath)) {
      const buffer = fs.readFileSync(publicPath);
      const ext = path.extname(filename).toLowerCase().replace(".", "");
      return `data:image/${ext === "jpg" ? "jpeg" : ext};base64,${buffer.toString("base64")}`;
    }
  } catch (err) {
    console.warn(`[pdf.server local-loader] Failed to read ${filename}:`, err);
  }
  return null;
}

async function fetchBase64Image(url: string): Promise<string | null> {
  try {
    if (url.includes("icon-512.png")) {
      const localLogo = getLocalAssetBase64("icon-512.png");
      if (localLogo) return localLogo;
    }
    if (url.includes("signature.png") || url.includes("olXE11N8ipqBTR8DBSXt")) {
      const localSig = getLocalAssetBase64("signature.png");
      if (localSig) return localSig;
    }

    const { resolveGooglePhotosUrl } = await import("./google-photos");
    const resolvedUrl = await resolveGooglePhotosUrl(url);
    if (!resolvedUrl) return null;

    const res = await fetch(resolvedUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      return `data:image/png;base64,${base64}`;
    }
  } catch (err) {
    console.warn(`[pdf.server] Failed to fetch image:`, err);
  }
  return null;
}

export async function generateOfferLetterPDF(details: IOfferDetails): Promise<string> {
  const supabase = getAdminClient();
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ format: "a4", unit: "mm" });

  // ── COLOUR PALETTE ─────────────────────────────────────────
  const navy    = [15,  23,  42];
  const slate   = [71,  85, 105];
  const ink     = [30,  41,  59];
  const mist    = [248, 250, 252];
  const rule    = [203, 213, 225];
  const black   = [0,   0,   0];
  const gold    = [176, 136,  24];
  const sigText = [148, 163, 184]; // #94A3B8

  const PW = 210, PH = 297;
  const ML = 18, MR = PW - 18;
  const TW = MR - ML;

  let logoBase64: string | null = null;
  let sigBase64: string | null = null;
  try {
    logoBase64 = await fetchBase64Image("https://careers.vyntyraconsultancyservices.in/icon-512.png");
    sigBase64 = await fetchBase64Image("https://kommodo.ai/i/olXE11N8ipqBTR8DBSXt");
  } catch (e) {}

  // Helpers
  const drawHeader = (isPage1: boolean) => {
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(0, 0, PW, 5, "F");
    doc.setFillColor(gold[0], gold[1], gold[2]);
    doc.rect(0, 5, PW, 0.8, "F");

    if (isPage1 && logoBase64) {
      doc.addImage(logoBase64, "PNG", ML, 10, 22, 22);
    }
    if (isPage1) {
      const logoRight = ML + 26;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      doc.setTextColor(black[0], black[1], black[2]);
      doc.text("VYNTYRA", logoRight, 18);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(black[0], black[1], black[2]);
      doc.text("CONSULTANCY SERVICES", logoRight, 24);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(slate[0], slate[1], slate[2]);
      doc.text("Empowering Careers. Delivering Excellence.", logoRight, 29);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(slate[0], slate[1], slate[2]);
      doc.text("Dwaraka Nagar, Dwaraka Plaza, Visakhapatnam", MR, 14, { align: "right" });
      doc.text("Andhra Pradesh, India – 530016", MR, 19, { align: "right" });
      doc.text("Web: careers.vyntyraconsultancyservices.in", MR, 24, { align: "right" });
      doc.text("Email: careers@vyntyraconsultancyservices.in", MR, 29, { align: "right" });
    }

    doc.setDrawColor(rule[0], rule[1], rule[2]);
    doc.setLineWidth(0.4);
    doc.line(ML, isPage1 ? 36 : 15, MR, isPage1 ? 36 : 15);
  };

  const drawFooter = () => {
    doc.setDrawColor(rule[0], rule[1], rule[2]);
    doc.setLineWidth(0.3);
    doc.line(ML, PH - 15, MR, PH - 15);
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(0, PH - 14, PW, 14, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(203, 213, 225);
    doc.text("Vyntyra Consultancy Services  |  Dwaraka Nagar, Dwaraka Plaza, Visakhapatnam – 530016  |  careers@vyntyraconsultancyservices.in", PW / 2, PH - 8, { align: "center" });
    doc.text("This document is confidential and intended solely for the named recipient. Unauthorised disclosure is strictly prohibited.", PW / 2, PH - 4, { align: "center" });
  };

  const drawInternSignatureBox = (y: number) => {
    const boxW = 80;
    const boxH = 26;
    const boxX = MR - boxW;
    
    doc.setDrawColor(rule[0], rule[1], rule[2]);
    doc.setLineWidth(0.3);
    doc.setLineDash([1, 1], 0);
    doc.roundedRect(boxX, y, boxW, boxH, 1.5, 1.5, "S");
    doc.setLineDash([], 0);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text("Candidate Signature", boxX + 3, y + 5);
    doc.text("Date:", boxX + boxW - 25, y + 5);

    // Line for sig
    doc.setDrawColor(slate[0], slate[1], slate[2]);
    doc.setLineWidth(0.2);
    doc.line(boxX + 3, y + 16, boxX + boxW - 3, y + 16);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text(details.fullName, boxX + 3, y + 20);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(sigText[0], sigText[1], sigText[2]);
    doc.text("(Sign using any online sign tool)", boxX + 3, y + 24);
  };

  // ── PAGE 1 ──────────────────────────────────────────────────
  drawHeader(true);

  const refNo  = `Ref: VCS/OL/${new Date().getFullYear()}/${details.applicationId.slice(0, 10).toUpperCase()}`;
  const dateStr = `Date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(ink[0], ink[1], ink[2]);
  doc.text(refNo, ML, 42);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text(dateStr, MR, 42, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("LETTER OF OFFER & APPOINTMENT", PW / 2, 53, { align: "center" });

  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.6);
  doc.line((PW - 94) / 2, 56, (PW + 94) / 2, 56);

  const startDate  = details.joiningDate ? new Date(details.joiningDate)  : null;
  const endDate    = details.endDate     ? new Date(details.endDate)       : null;
  const fmtDate    = (d: Date | null) => d ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "To Be Confirmed";
  const durationMs = startDate && endDate ? endDate.getTime() - startDate.getTime() : 0;
  const durationMonths = durationMs ? Math.round(durationMs / (1000 * 60 * 60 * 24 * 30)) : null;

  let curY = 65;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(ink[0], ink[1], ink[2]);
  doc.text(`To,`, ML, curY);
  curY += 5;
  doc.setFont("helvetica", "bold");
  doc.text(details.fullName, ML, curY);
  curY += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(ink[0], ink[1], ink[2]);
  const para1 = `Dear ${details.fullName.split(" ")[0]},\n\nWe are pleased to inform you that following a thorough review of your application and successful completion of our selection process, Vyntyra Consultancy Services is delighted to extend this formal offer of appointment for the role of ${details.roleApplied}. We believe your skills, dedication, and outlook align well with the vision and values of our organisation, and we look forward to welcoming you to our team.`;
  const splitP1 = doc.splitTextToSize(para1, TW);
  doc.text(splitP1, ML, curY);
  curY += splitP1.length * 4.8 + 5;

  const sectionHead = (label: string, y: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text(label.toUpperCase(), ML, y);
    doc.setDrawColor(navy[0], navy[1], navy[2]);
    doc.setLineWidth(0.3);
    doc.line(ML, y + 1.5, MR, y + 1.5);
    return y + 6;
  };

  curY = sectionHead("1.  Appointment Details", curY);

  const rows: [string, string][] = [
    ["Full Name",            details.fullName],
    ["Position / Role",      details.roleApplied],
    ["Department / Domain",  details.domain       || "As Assigned"],
    ["Specialisation",       details.subDomain    || "As Assigned"],
    ["Reporting Manager",    "Assigned Technical Mentor / Lead Developer"],
    ["Nature of Engagement", "Internship / Project-Based Engagement"],
    ["Working Hours",        "Flexible (Subject to project requirements)"],
    ["Duration",             durationMonths ? `${durationMonths} Month(s)` : "As Per Agreement"],
    ["Date of Commencement", fmtDate(startDate)],
    ["Date of Conclusion",   fmtDate(endDate)],
    ["Work Location",        details.jobLocation  || "Visakhapatnam / Remote (Hybrid)"],
    ["Stipend / Compensation", details.salary     || "Not Applicable (Honorary / Academic)"],
  ];

  const ROW_H = 10;
  const COL1 = 65;

  // Draw the main card background and border
  doc.setFillColor(mist[0], mist[1], mist[2]);
  doc.setDrawColor(rule[0], rule[1], rule[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(ML, curY, TW, rows.length * ROW_H, 2, 2, "FD");

  rows.forEach(([label, val], i) => {
    const y = curY + i * ROW_H;
    
    // Horizontal divider for all rows except the first
    if (i > 0) {
      doc.setDrawColor(rule[0], rule[1], rule[2]);
      doc.setLineWidth(0.2);
      doc.line(ML + 3, y, MR - 3, y);
    }
    
    // Label (Left Column)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text(label.toUpperCase(), ML + 6, y + 6.5);
    
    // Value (Right Column)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    const wrapped = doc.splitTextToSize(val, TW - COL1 - 8);
    doc.text(wrapped, ML + COL1, y + 6.5);
  });

  curY += rows.length * ROW_H + 10;

  // Founder Sign-off Block on Page 1
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(ink[0], ink[1], ink[2]);
  doc.text("Warm regards,", ML, curY);
  curY += 5;
  doc.text("For Vyntyra Consultancy Services,", ML, curY);
  if (sigBase64) {
    doc.addImage(sigBase64, "PNG", ML, curY + 2, 40, 13);
  }
  curY += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("Jami Eswar Anil Kumar", ML, curY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("Founder & Managing Director", ML, curY + 5);

  drawFooter();

  // ── PAGE 2 ──────────────────────────────────────────────────
  doc.addPage();
  drawHeader(false);
  curY = 25;

  curY = sectionHead("2.  Roles & Responsibilities", curY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(ink[0], ink[1], ink[2]);

  const duties = [
    "Execute assigned tasks and projects within the designated domain with diligence and within stipulated timelines.",
    "Collaborate actively with mentors, team leads, and cross-functional teams to achieve organisational objectives.",
    "Maintain the highest standards of professionalism, confidentiality, and ethical conduct throughout the engagement.",
    "Submit periodic progress reports or deliverables as outlined by the reporting manager or department head.",
    "Participate in scheduled training sessions, reviews, and knowledge-sharing activities as directed.",
  ];

  duties.forEach((d, i) => {
    const bullet = doc.splitTextToSize(`${i + 1}.  ${d}`, TW - 6);
    doc.text(bullet, ML + 3, curY);
    curY += bullet.length * 4.6 + 1.5;
  });

  curY += 4;

  curY = sectionHead("3.  Terms & Conditions", curY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(ink[0], ink[1], ink[2]);

  const terms = [
    "This offer is contingent upon satisfactory verification of all academic, professional credentials, and any other background information provided during the selection process.",
    "The intern/appointee shall not disclose any proprietary, technical, financial, or operational information of Vyntyra Consultancy Services to any third party, during or after the period of engagement.",
    "Intellectual Property: All code, documentation, designs, and work product developed during the course of the internship shall remain the exclusive intellectual property (IP) of Vyntyra Consultancy Services.",
    "Equipment & Resources: The engagement operates on a Bring Your Own Device (BYOD) model. Interns are expected to use their own hardware unless explicitly specified otherwise.",
    "Termination: Either party may terminate this engagement by providing 7 days' written notice. The company reserves the right to terminate the agreement immediately in the event of misconduct or breach of policies.",
    "Certificate Eligibility: Issuance of an internship completion certificate is strictly subject to the successful submission of all assigned project milestones, deliverables, and satisfactory performance.",
    "This offer does not constitute a permanent employment contract. Continuation beyond the stated engagement period is subject to mutual agreement and organisational requirements.",
    "The appointee is required to adhere to all company policies, including the Code of Conduct, IT Usage Policy, and any departmental SOPs communicated upon joining.",
    "Please sign and return a copy of this letter within 7 (seven) calendar days to confirm your acceptance. Failure to do so shall render this offer null and void.",
  ];

  terms.forEach((t, i) => {
    const lines = doc.splitTextToSize(`${i + 1}.  ${t}`, TW - 6);
    doc.text(lines, ML + 3, curY);
    curY += lines.length * 4.6 + 1.5;
  });

  curY += 8;

  // Acceptance block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("ACCEPTANCE", ML, curY);
  curY += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(ink[0], ink[1], ink[2]);
  const acceptText = doc.splitTextToSize("I accept the terms and conditions outlined above and confirm my intention to join Vyntyra Consultancy Services as per the details provided.", TW);
  doc.text(acceptText, ML, curY);
  
  drawInternSignatureBox(PH - 45);
  drawFooter();

  // ── UPLOAD TO SUPABASE ───────────────────────────────────────
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  const fileName  = `offer_letters/${details.applicationId}_OfferLetter.pdf`;

  const { error } = await supabase.storage
    .from("default")
    .upload(fileName, pdfBuffer, { contentType: "application/pdf", upsert: true });
  if (error) {
    console.error("Failed to upload PDF:", error);
    throw new Error("Failed to upload offer letter PDF");
  }

  const { data: signedData } = await supabase.storage
    .from("default")
    .createSignedUrl(fileName, 7776000);  // 90 days

  if (signedData?.signedUrl) return signedData.signedUrl;

  const { data: { publicUrl } } = supabase.storage.from("default").getPublicUrl(fileName);
  return publicUrl;
}
