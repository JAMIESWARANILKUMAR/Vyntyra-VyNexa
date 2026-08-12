import { jsPDF } from "jspdf";
import { getAdminClient } from "@/integrations/supabase/admin";

export interface IOfferDetails {
  fullName: string;
  roleApplied: string;
  applicationId: string;
  salary?: string;
  joiningDate?: string;
  jobLocation?: string;
}

async function fetchBase64Image(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
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
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  const supabase = getAdminClient();

  const primaryColor = [15, 32, 67]; // Dark Navy (#0F2043)
  const secondaryColor = [212, 175, 55]; // Gold (#D4AF37)
  const textColor = [51, 51, 51]; // Charcoal (#333333)
  const lightGrey = [248, 249, 250]; // Off-white
  const borderGrey = [222, 226, 230]; // Border grey

  // ─── PAGE HEADER (Accent Top Banner) ───
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 14, "F");
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(0, 14, 210, 3, "F");

  // ─── CORPORATE LETTERHEAD ───
  const logoBase64 = await fetchBase64Image("https://careers.vyntyraconsultancyservices.in/icon-512.png");
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", 20, 22, 13, 13);
    
    // Typographic Brand Logo next to image
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("VYNTYRA", 37, 29);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("CONSULTANCY SERVICES", 37, 34);
  } else {
    // Fallback if logo not loaded
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("VYNTYRA", 20, 33);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("CONSULTANCY SERVICES", 20, 38);
  }

  // Address and Contact Details (Right, aligned right)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(110, 110, 110);
  doc.text("Dwaraka Nagar, Dwaraka Plaza", 190, 26, { align: "right" });
  doc.text("Visakhapatnam, AP, India - 530016", 190, 31, { align: "right" });
  doc.text("Email: careers@vyntyraconsultancyservices.in", 190, 36, { align: "right" });
  doc.text("Web: www.vyntyraconsultancyservices.in", 190, 41, { align: "right" });

  // Thin Elegant Divider
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.setLineWidth(0.4);
  doc.line(20, 48, 190, 48);

  // ─── METADATA (Reference & Date) ───
  const refNo = `Ref: VCS/OL/2026/${details.applicationId.slice(0, 8).toUpperCase()}`;
  const dateStr = `Date: ${new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}`;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(refNo, 20, 56);
  
  doc.setFont("helvetica", "normal");
  doc.text(dateStr, 190, 56, { align: "right" });

  // ─── RECIPIENT INFORMATION ───
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text("TO:", 20, 66);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(details.fullName, 20, 71);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(80, 80, 80);
  doc.text("Subject: Letter of Offer & Appointment", 20, 77);

  // Divider
  doc.line(20, 83, 190, 83);

  // ─── GREETING & INTRO ───
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`Dear ${details.fullName},`, 20, 91);

  const introText = "We are delighted to extend this formal offer of appointment for the position of " + details.roleApplied + " at Vyntyra Consultancy Services. Following your outstanding performance in our recruitment and interview rounds, we are confident that you will bring significant value, expertise, and innovative thinking to our organization.";
  
  const splitIntro = doc.splitTextToSize(introText, 170);
  doc.text(splitIntro, 20, 97);

  // ─── JOB DETAILS CARD (Structured Premium Table Layout) ───
  const cardY = 120;
  doc.setFillColor(lightGrey[0], lightGrey[1], lightGrey[2]);
  doc.rect(20, cardY, 170, 48, "F");
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.rect(20, cardY, 170, 48, "S");

  // Table Headers / Lines
  doc.setDrawColor(235, 235, 235);
  doc.line(20, cardY + 12, 190, cardY + 12);
  doc.line(20, cardY + 24, 190, cardY + 24);
  doc.line(20, cardY + 36, 190, cardY + 36);

  // Table content
  doc.setFont("helvetica", "bold");
  doc.text("Position / Title:", 25, cardY + 8);
  doc.setFont("helvetica", "normal");
  doc.text(details.roleApplied, 75, cardY + 8);

  doc.setFont("helvetica", "bold");
  doc.text("Total Compensation (CTC):", 25, cardY + 20);
  doc.setFont("helvetica", "normal");
  doc.text(details.salary || "As mutually agreed", 75, cardY + 20);

  doc.setFont("helvetica", "bold");
  doc.text("Date of Joining:", 25, cardY + 32);
  doc.setFont("helvetica", "normal");
  doc.text(details.joiningDate ? new Date(details.joiningDate).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : "To be confirmed", 75, cardY + 32);

  doc.setFont("helvetica", "bold");
  doc.text("Job Location:", 25, cardY + 44);
  doc.setFont("helvetica", "normal");
  doc.text(details.jobLocation || "Visakhapatnam / Remote", 75, cardY + 44);

  // ─── SECONDARY TEXT (TERMS) ───
  const termsY = 178;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  const body2 = "This offer is subject to verification of your professional credentials and references. On your day of joining, please submit self-attested copies of your academic records, experience certificates, identity proof, and address proof for administrative filing.\n\nPlease note that the code of conduct, non-disclosure policies, and terms of service of the company will be detailed in your employment contract, which will be executed on your joining date.";
  const splitBody2 = doc.splitTextToSize(body2, 170);
  doc.text(splitBody2, 20, termsY);

  const signInfo = "Kindly confirm your acceptance by signing this letter and returning a scanned copy within 7 business days, failing which this offer shall automatically expire.";
  const splitSignInfo = doc.splitTextToSize(signInfo, 170);
  doc.text(splitSignInfo, 20, termsY + 30);

  // ─── SIGNATURE BLOCK ───
  const signY = 228;
  
  // Vyntyra Signatory
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text("For Vyntyra Consultancy Services,", 20, signY);

  const sigBase64 = await fetchBase64Image("https://careers.vyntyraconsultancyservices.in/signature.png");
  if (sigBase64) {
    doc.addImage(sigBase64, "PNG", 20, signY + 1.5, 30, 9);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Jami Eswar Anil Kumar", 20, signY + 14);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(110, 110, 110);
  doc.text("Founder & Managing Director", 20, signY + 18);
  
  doc.line(20, signY + 21, 75, signY + 21);
  doc.text("Authorized Signatory", 20, signY + 25);

  // Candidate Acceptance
  doc.text("Accepted and Agreed By:", 120, signY);
  doc.line(120, signY + 16, 185, signY + 16);
  doc.text("Candidate Signature & Date", 120, signY + 21);

  // ─── FOOTER ───
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 287, 210, 10, "F");
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("Confidential · Vyntyra Consultancy Services © 2026. All rights reserved.", 105, 293, { align: "center" });

  // Generate PDF as Buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  const fileName = `offer_letters/${details.applicationId}_OfferLetter.pdf`;

  // Upload to Supabase Storage with upsert: true to replace previous version
  const { data, error } = await supabase.storage
    .from("default")
    .upload(fileName, pdfBuffer, { contentType: "application/pdf", upsert: true });
  if (error) {
    console.error("Failed to upload PDF:", error);
    throw new Error("Failed to upload offer letter PDF");
  }

  // Get signed URL (fallback to public URL if signed URL creation fails)
  const { data: signedData } = await supabase.storage
    .from("default")
    .createSignedUrl(fileName, 7200);

  if (signedData?.signedUrl) {
    return signedData.signedUrl;
  }

  const { data: { publicUrl } } = supabase.storage.from("default").getPublicUrl(fileName);
  return publicUrl;
}
