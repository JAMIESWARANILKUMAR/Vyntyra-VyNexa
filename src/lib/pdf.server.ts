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
  
  // Color Palette (Premium Slate & Navy)
  const primaryNavy = [15, 23, 42]; // Slate 900
  const secondarySlate = [71, 85, 105]; // Slate 500
  const textDark = [30, 41, 59]; // Slate 800
  const lightBg = [248, 250, 252]; // Slate 50
  const borderLight = [203, 213, 225]; // Slate 300

  // 🔹 TOP HEADER ACCENT 🔹
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, 210, 4, "F");
  doc.setFillColor(180, 140, 40); // Gold accent
  doc.rect(0, 4, 210, 1, "F");

  // 🔹 LOGO AND COMPANY INFO 🔹
  const logoBase64 = await fetchBase64Image("https://careers.vyntyraconsultancyservices.in/icon-512.png");
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", 20, 12, 14, 14);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("VYNTYRA", 38, 19);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(180, 140, 40);
  doc.text("CONSULTANCY SERVICES", 38, 23);

  // Address right-aligned
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(secondarySlate[0], secondarySlate[1], secondarySlate[2]);
  doc.text("Dwaraka Nagar, Dwaraka Plaza", 190, 16, { align: "right" });
  doc.text("Visakhapatnam, AP, India - 530016", 190, 21, { align: "right" });
  doc.text("Email: careers@vyntyraconsultancyservices.in", 190, 26, { align: "right" });

  // 🔹 METADATA BAR 🔹
  const refNo = `Ref: VCS/OL/2026/${details.applicationId.slice(0, 8).toUpperCase()}`;
  const dateStr = `Date: ${new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}`;
  
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(20, 36, 170, 10, 1.5, 1.5, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(refNo, 25, 42.5);
  
  doc.setFont("helvetica", "normal");
  doc.text(dateStr, 185, 42.5, { align: "right" });

  // 🔹 DOCUMENT TITLE 🔹
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("LETTER OF OFFER & APPOINTMENT", 105, 60, { align: "center", charSpace: 1 });
  
  doc.setDrawColor(180, 140, 40); // Gold accent line
  doc.setLineWidth(0.5);
  doc.line(80, 63, 130, 63);

  // 🔹 RECIPIENT & INTRO 🔹
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`TO: ${details.fullName}`, 20, 75);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(secondarySlate[0], secondarySlate[1], secondarySlate[2]);
  const introText = "We are delighted to extend this formal offer of appointment for the position of " + details.roleApplied + " at Vyntyra Consultancy Services. Following your outstanding performance in our recruitment and interview rounds, we are confident that you will bring significant value, expertise, and innovative thinking to our organization.";
  
  const splitIntro = doc.splitTextToSize(introText, 170);
  doc.text(splitIntro, 20, 84);

  // 🔹 JOB DETAILS (PREMIUM ZEBRA TABLE) 🔹
  // Calculate startY based on intro length
  const tableStartY = 84 + (splitIntro.length * 5) + 6;
  const rowH = 10;
  
  const rows = [
    { label: "Position / Title", val: details.roleApplied },
    { label: "Domain", val: details.domain || "N/A" },
    { label: "Sub-domain", val: details.subDomain || "N/A" },
    { label: "Total Compensation", val: details.salary || "As mutually agreed" },
    { label: "Start Date", val: details.joiningDate ? new Date(details.joiningDate).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : "To be confirmed" },
    { label: "End Date", val: details.endDate ? new Date(details.endDate).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : "To be confirmed" },
    { label: "Job Location", val: details.jobLocation || "Visakhapatnam / Remote" }
  ];

  rows.forEach((row, i) => {
    const y = tableStartY + (i * rowH);
    if (i % 2 === 0) {
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      if (i === 0) {
        // top rounded
        doc.roundedRect(20, y, 170, rowH, 1.5, 1.5, "F");
        // fix bottom corners to be square
        doc.rect(20, y + rowH/2, 170, rowH/2, "F");
      } else if (i === rows.length - 1) {
        // bottom rounded
        doc.roundedRect(20, y, 170, rowH, 1.5, 1.5, "F");
        doc.rect(20, y, 170, rowH/2, "F");
      } else {
        doc.rect(20, y, 170, rowH, "F");
      }
    }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(row.label, 25, y + 6.5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(secondarySlate[0], secondarySlate[1], secondarySlate[2]);
    doc.text(row.val, 75, y + 6.5);
  });

  // Table Border
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(20, tableStartY, 170, rows.length * rowH, 1.5, 1.5, "S");

  // 🔹 TERMS & CONDITIONS 🔹
  const termsY = tableStartY + (rows.length * rowH) + 12;
  
  const termsText1 = "This offer is subject to verification of your professional credentials and references. On your day of joining, please submit self-attested copies of your academic records, experience certificates, identity proof, and address proof for administrative filing.";
  const termsText2 = "Please note that the code of conduct, non-disclosure policies, and terms of service of the company will be detailed in your employment contract, which will be executed on your joining date.";
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(secondarySlate[0], secondarySlate[1], secondarySlate[2]);
  
  const splitTerms1 = doc.splitTextToSize(termsText1, 170);
  doc.text(splitTerms1, 20, termsY);
  const t1Height = splitTerms1.length * 4.5;
  
  const splitTerms2 = doc.splitTextToSize(termsText2, 170);
  doc.text(splitTerms2, 20, termsY + t1Height + 3);
  const t2Height = splitTerms2.length * 4.5;

  const signInfo = "Kindly confirm your acceptance by signing this letter and returning a scanned copy within 7 business days, failing which this offer shall automatically expire.";
  const splitSignInfo = doc.splitTextToSize(signInfo, 170);
  doc.text(splitSignInfo, 20, termsY + t1Height + t2Height + 6);
  const signInfoHeight = splitSignInfo.length * 4.5;

  // 🔹 SIGNATURE BLOCK 🔹
  const signY = termsY + t1Height + t2Height + signInfoHeight + 12;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("For Vyntyra Consultancy Services,", 20, signY);

  const sigBase64 = await fetchBase64Image("https://kommodo.ai/i/olXE11N8ipqBTR8DBSXt");
  if (sigBase64) {
    doc.addImage(sigBase64, "PNG", 20, signY + 2, 32, 10.5);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("Jami Eswar Anil Kumar", 20, signY + 16);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(secondarySlate[0], secondarySlate[1], secondarySlate[2]);
  doc.text("Founder & Managing Director", 20, signY + 20);
  
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.25);
  doc.line(20, signY + 23, 75, signY + 23);
  doc.text("Authorized Signatory", 20, signY + 27);

  // Candidate Acceptance
  doc.text("Accepted and Agreed By:", 120, signY);
  doc.line(120, signY + 16, 185, signY + 16);
  doc.text("Candidate Signature & Date", 120, signY + 21);

  // 🔹 FOOTER 🔹
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 287, 210, 10, "F");
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text("Confidential | Vyntyra Consultancy Services (C) 2026. All rights reserved.", 105, 293, { align: "center" });

  // Generate and Upload
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  const fileName = `offer_letters/${details.applicationId}_OfferLetter.pdf`;

  const { data, error } = await supabase.storage
    .from("default")
    .upload(fileName, pdfBuffer, { contentType: "application/pdf", upsert: true });
  if (error) {
    console.error("Failed to upload PDF:", error);
    throw new Error("Failed to upload offer letter PDF");
  }

  const { data: signedData } = await supabase.storage
    .from("default")
    .createSignedUrl(fileName, 7200);

  if (signedData?.signedUrl) {
    return signedData.signedUrl;
  }

  const { data: { publicUrl } } = supabase.storage.from("default").getPublicUrl(fileName);
  return publicUrl;
}
