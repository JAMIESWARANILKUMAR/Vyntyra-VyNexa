import { jsPDF } from "jspdf";
import { getAdminClient } from "@/integrations/supabase/admin";

export interface IOfferDetails {
  fullName: string;
  roleApplied: string;
  applicationId: string;
}

export async function generateOfferLetterPDF(details: IOfferDetails): Promise<string> {
  const doc = new jsPDF();
  const supabase = getAdminClient();

  // Brand Header
  doc.setFontSize(24);
  doc.setTextColor(41, 128, 185);
  doc.text("Vyntyra Consultancy Services", 105, 30, { align: "center" });

  // Offer Letter Title
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text("OFFER OF EMPLOYMENT", 105, 50, { align: "center" });

  // Content
  doc.setFontSize(12);
  const date = new Date().toLocaleDateString();
  
  doc.text(`Date: ${date}`, 20, 70);
  doc.text(`Dear ${details.fullName},`, 20, 90);
  
  const body = `We are thrilled to offer you the position of ${details.roleApplied} at Vyntyra Consultancy Services.\n\nWe were incredibly impressed by your background and would love to welcome you to the team. This document serves as your official offer letter.\n\nPlease sign and return this document to accept the offer.\n\nSincerely,\nHR Department\nVyntyra Consultancy Services`;

  doc.text(body, 20, 105, { maxWidth: 170 });

  // Generate PDF as Buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  const fileName = `offer_letters/${details.applicationId}_${Date.now()}.pdf`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage.from("default").upload(fileName, pdfBuffer, { contentType: "application/pdf" });
  if (error) {
    console.error("Failed to upload PDF:", error);
    throw new Error("Failed to upload offer letter PDF");
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage.from("default").getPublicUrl(fileName);
  return publicUrl;
}
