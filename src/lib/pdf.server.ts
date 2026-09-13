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
    // Check local filesystem first to bypass any domain-level networking blocks
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
    if (!resolvedUrl) {
      console.warn(`[pdf.server] Could not resolve URL: ${url}`);
      return null;
    }

    const res = await fetch(resolvedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      }
    });
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      return `data:image/png;base64,${base64}`;
    }
  } catch (err) {
    console.warn(`[pdf.server] Failed to fetch image from ${url}:`, err);
  }
  return null;
}

export async function generateOfferLetterPDF(details: IOfferDetails): Promise<string> {
  const supabase = getAdminClient();
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ format: "a4", unit: "mm" });

  // ── COLOUR PALETTE ─────────────────────────────────────────
  const navy    = [15,  23,  42];   // Slate-900 – primary
  const slate   = [71,  85, 105];   // Slate-500 – secondary text
  const ink     = [30,  41,  59];   // Slate-800 – body text
  const mist    = [248, 250, 252];  // Slate-50  – row bg
  const rule    = [203, 213, 225];  // Slate-300 – dividers
  const black   = [0,   0,   0];
  const gold    = [176, 136,  24];

  const PW = 210, PH = 297;
  const ML = 18, MR = PW - 18;     // page margins
  const TW = MR - ML;               // text width

  // ── LETTERHEAD TOP BAR ──────────────────────────────────────
  doc.setFillColor(...navy as [number,number,number]);
  doc.rect(0, 0, PW, 5, "F");
  doc.setFillColor(...gold as [number,number,number]);
  doc.rect(0, 5, PW, 0.8, "F");

  // ── LOGO (bigger, left-aligned) ─────────────────────────────
  const logoBase64 = await fetchBase64Image("https://careers.vyntyraconsultancyservices.in/icon-512.png");
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", ML, 10, 22, 22);
  }

  // ── COMPANY NAME (all black, right of logo) ─────────────────
  const logoRight = ML + 26;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...black as [number,number,number]);
  doc.text("VYNTYRA", logoRight, 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...black as [number,number,number]);
  doc.text("CONSULTANCY SERVICES", logoRight, 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...slate as [number,number,number]);
  doc.text("Empowering Careers. Delivering Excellence.", logoRight, 29);

  // ── ADDRESS BLOCK (right-aligned) ───────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...slate as [number,number,number]);
  doc.text("Dwaraka Nagar, Dwaraka Plaza, Visakhapatnam", MR, 14, { align: "right" });
  doc.text("Andhra Pradesh, India – 530016", MR, 19, { align: "right" });
  doc.text("Web: careers.vyntyraconsultancyservices.in", MR, 24, { align: "right" });
  doc.text("Email: careers@vyntyraconsultancyservices.in", MR, 29, { align: "right" });

  // ── HORIZONTAL RULE below header ────────────────────────────
  doc.setDrawColor(...rule as [number,number,number]);
  doc.setLineWidth(0.4);
  doc.line(ML, 36, MR, 36);

  // ── REF / DATE METADATA ROW ─────────────────────────────────
  const refNo  = `Ref: VCS/OL/${new Date().getFullYear()}/${details.applicationId.slice(0, 10).toUpperCase()}`;
  const dateStr = `Date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...ink as [number,number,number]);
  doc.text(refNo, ML, 42);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...slate as [number,number,number]);
  doc.text(dateStr, MR, 42, { align: "right" });

  // ── SUBJECT / TITLE ─────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...navy as [number,number,number]);
  doc.text("LETTER OF OFFER & APPOINTMENT", PW / 2, 53, { align: "center" });

  doc.setDrawColor(...gold as [number,number,number]);
  doc.setLineWidth(0.6);
  const titleW = 94;
  doc.line((PW - titleW) / 2, 56, (PW + titleW) / 2, 56);

  // ── SALUTATION ───────────────────────────────────────────────
  const startDate  = details.joiningDate ? new Date(details.joiningDate)  : null;
  const endDate    = details.endDate     ? new Date(details.endDate)       : null;
  const fmtDate    = (d: Date | null) => d ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "To Be Confirmed";
  const durationMs = startDate && endDate ? endDate.getTime() - startDate.getTime() : 0;
  const durationMonths = durationMs ? Math.round(durationMs / (1000 * 60 * 60 * 24 * 30)) : null;

  let curY = 65;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...ink as [number,number,number]);
  doc.text(`To,`, ML, curY);
  curY += 5;
  doc.setFont("helvetica", "bold");
  doc.text(details.fullName, ML, curY);
  curY += 10;

  // ── OPENING PARAGRAPH ────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...ink as [number,number,number]);
  const para1 = `Dear ${details.fullName.split(" ")[0]},\n\nWe are pleased to inform you that following a thorough review of your application and successful completion of our selection process, Vyntyra Consultancy Services is delighted to extend this formal offer of appointment for the role of ${details.roleApplied}. We believe your skills, dedication, and outlook align well with the vision and values of our organisation, and we look forward to welcoming you to our team.`;
  const splitP1 = doc.splitTextToSize(para1, TW);
  doc.text(splitP1, ML, curY);
  curY += splitP1.length * 4.8 + 5;

  // ── SECTION HEADING helper ────────────────────────────────────
  const sectionHead = (label: string, y: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...navy as [number,number,number]);
    doc.text(label.toUpperCase(), ML, y);
    doc.setDrawColor(...navy as [number,number,number]);
    doc.setLineWidth(0.3);
    doc.line(ML, y + 1.5, MR, y + 1.5);
    return y + 6;
  };

  // ── SECTION 1 – APPOINTMENT DETAILS TABLE ────────────────────
  curY = sectionHead("1.  Appointment Details", curY);

  const rows: [string, string][] = [
    ["Full Name",            details.fullName],
    ["Position / Role",      details.roleApplied],
    ["Department / Domain",  details.domain       || "As Assigned"],
    ["Specialisation",       details.subDomain    || "As Assigned"],
    ["Nature of Engagement", "Internship / Project-Based Engagement"],
    ["Duration",             durationMonths ? `${durationMonths} Month(s)` : "As Per Agreement"],
    ["Date of Commencement", fmtDate(startDate)],
    ["Date of Conclusion",   fmtDate(endDate)],
    ["Work Location",        details.jobLocation  || "Visakhapatnam / Remote (Hybrid)"],
    ["Stipend / Compensation", details.salary     || "Not Applicable (Honorary / Academic)"],
  ];

  const ROW_H = 8.5;
  const COL1 = 62;

  rows.forEach(([label, val], i) => {
    const y = curY + i * ROW_H;
    if (i % 2 === 0) {
      doc.setFillColor(...mist as [number,number,number]);
      doc.rect(ML, y, TW, ROW_H, "F");
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...ink as [number,number,number]);
    doc.text(label, ML + 3, y + 5.8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...slate as [number,number,number]);
    const wrapped = doc.splitTextToSize(val, TW - COL1 - 4);
    doc.text(wrapped, ML + COL1, y + 5.8);
  });

  // Table border
  doc.setDrawColor(...rule as [number,number,number]);
  doc.setLineWidth(0.3);
  doc.roundedRect(ML, curY, TW, rows.length * ROW_H, 1.2, 1.2, "S");
  // Vertical divider
  doc.line(ML + COL1 - 2, curY, ML + COL1 - 2, curY + rows.length * ROW_H);

  curY += rows.length * ROW_H + 8;

  // ── SECTION 2 – DUTIES & RESPONSIBILITIES ────────────────────
  curY = sectionHead("2.  Roles & Responsibilities", curY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...ink as [number,number,number]);

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

  // ── SECTION 3 – TERMS & CONDITIONS ──────────────────────────
  curY = sectionHead("3.  Terms & Conditions", curY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...ink as [number,number,number]);

  const terms = [
    "This offer is contingent upon satisfactory verification of all academic, professional credentials, and any other background information provided during the selection process.",
    "The intern/appointee shall not disclose any proprietary, technical, financial, or operational information of Vyntyra Consultancy Services to any third party, during or after the period of engagement.",
    "This offer does not constitute a permanent employment contract. Continuation beyond the stated engagement period is subject to mutual agreement and organisational requirements.",
    "The appointee is required to adhere to all company policies, including the Code of Conduct, IT Usage Policy, and any departmental SOPs communicated upon joining.",
    "Please sign and return a copy of this letter within 7 (seven) calendar days to confirm your acceptance. Failure to do so shall render this offer null and void.",
  ];

  terms.forEach((t, i) => {
    const lines = doc.splitTextToSize(`${i + 1}.  ${t}`, TW - 6);
    doc.text(lines, ML + 3, curY);
    curY += lines.length * 4.6 + 1.5;
  });

  curY += 6;

  // ── CLOSING PARAGRAPH ────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...ink as [number,number,number]);
  const closing = "We extend our warmest congratulations and sincerely look forward to your contribution to Vyntyra Consultancy Services. Should you have any queries regarding this offer, please do not hesitate to reach out to us at careers@vyntyraconsultancyservices.in.";
  const splitClose = doc.splitTextToSize(closing, TW);
  doc.text(splitClose, ML, curY);
  curY += splitClose.length * 4.8 + 10;

  // ── SIGNATURE BLOCK ──────────────────────────────────────────
  const sigBase64 = await fetchBase64Image("https://kommodo.ai/i/olXE11N8ipqBTR8DBSXt");
  const sigBoxH = 38;

  // Left column – Company signatory
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...ink as [number,number,number]);
  doc.text("For Vyntyra Consultancy Services,", ML, curY);

  if (sigBase64) {
    doc.addImage(sigBase64, "PNG", ML, curY + 3, 40, 13);
  }

  const nameY = curY + 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...navy as [number,number,number]);
  doc.text("Jami Eswar Anil Kumar", ML, nameY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...slate as [number,number,number]);
  doc.text("Founder & Managing Director", ML, nameY + 5);
  doc.text("Vyntyra Consultancy Services", ML, nameY + 10);
  doc.setDrawColor(...rule as [number,number,number]);
  doc.setLineWidth(0.3);
  doc.line(ML, curY + sigBoxH, ML + 72, curY + sigBoxH);
  doc.setFontSize(8);
  doc.text("Authorised Signatory & Seal", ML, curY + sigBoxH + 5);

  // Right column – Candidate acceptance
  const acceptX = PW / 2 + 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...ink as [number,number,number]);
  doc.text("Accepted and agreed by:", acceptX, curY);
  doc.setDrawColor(...rule as [number,number,number]);
  doc.line(acceptX, curY + sigBoxH, MR, curY + sigBoxH);
  doc.setFontSize(8);
  doc.setTextColor(...slate as [number,number,number]);
  doc.text("Candidate Signature & Date", acceptX, curY + sigBoxH + 5);
  doc.text("Name: _______________________________", acceptX, curY + sigBoxH + 11);

  curY += sigBoxH + 18;

  // ── FOOTER ──────────────────────────────────────────────────
  doc.setDrawColor(...rule as [number,number,number]);
  doc.setLineWidth(0.3);
  doc.line(ML, PH - 15, MR, PH - 15);

  doc.setFillColor(...navy as [number,number,number]);
  doc.rect(0, PH - 14, PW, 14, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text("Vyntyra Consultancy Services  |  Dwaraka Nagar, Dwaraka Plaza, Visakhapatnam – 530016  |  careers@vyntyraconsultancyservices.in", PW / 2, PH - 8, { align: "center" });
  doc.text("This document is confidential and intended solely for the named recipient. Unauthorised disclosure is strictly prohibited.", PW / 2, PH - 4, { align: "center" });

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
