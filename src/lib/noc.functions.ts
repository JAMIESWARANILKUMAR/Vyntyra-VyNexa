import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAdminClient } from "@/integrations/supabase/admin";

const verifySchema = z.object({
  query: z.string().trim().min(1).max(200),
});

export const verifyNocCertificate = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => verifySchema.parse(d))
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();
    const q = data.query.trim();
    const qLower = q.toLowerCase();

    // 1. First search applications table
    let appRecord: any = null;

    // Search by UUID / exact ID
    const { data: byId } = await adminClient
      .from("applications")
      .select("*")
      .eq("id", q)
      .maybeSingle();

    if (byId) {
      appRecord = byId;
    } else {
      // Search by partial ID or Email
      const { data: byEmail } = await adminClient
        .from("applications")
        .select("*")
        .or(`email.ilike.${qLower},id.ilike.%${q}%,phone.eq.${q}`)
        .order("created_at", { ascending: false })
        .limit(1);

      if (byEmail && byEmail.length > 0) {
        appRecord = byEmail[0];
      }
    }

    // 2. If not found by application table directly, try matching profiles intern_id
    if (!appRecord) {
      const { data: prof } = await adminClient
        .from("profiles")
        .select("*, applications(*)")
        .or(`intern_id.ilike.%${q}%,email.ilike.${qLower}`)
        .maybeSingle();

      if (prof && prof.applications) {
        appRecord = prof.applications;
      }
    }

    if (!appRecord) {
      return {
        found: false,
        message: "No official NOC or selection record found matching the provided Registration ID or Email address.",
      };
    }

    // Fetch corresponding profile for intern_id & dates if present
    const { data: profile } = await adminClient
      .from("profiles")
      .select("intern_id, start_date, end_date, department, position")
      .eq("email", appRecord.email)
      .maybeSingle();

    // Sign NOC PDF URL from storage bucket
    let nocPdfUrl: string | null = null;
    try {
      const filepath = `nocs/${appRecord.id}_NOC.pdf`;
      const { data: signedData } = await adminClient.storage
        .from("default")
        .createSignedUrl(filepath, 60 * 60 * 24); // 24 hours validity

      if (signedData?.signedUrl) {
        nocPdfUrl = signedData.signedUrl;
      } else {
        const { data: pubData } = adminClient.storage
          .from("default")
          .getPublicUrl(filepath);
        nocPdfUrl = pubData?.publicUrl || null;
      }
    } catch (e) {
      console.warn("[verifyNocCertificate] NOC PDF fetch error:", e);
    }

    const refId = appRecord.id.slice(0, 8).toUpperCase();
    const formattedDate = new Date(appRecord.created_at).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    return {
      found: true,
      certificate: {
        id: appRecord.id,
        referenceId: `NOC/VYN/2026/${refId}`,
        fullName: appRecord.full_name,
        email: appRecord.email,
        phone: appRecord.phone,
        college: appRecord.college || "Academic Institution",
        state: appRecord.state || "Andhra Pradesh",
        domain: appRecord.domain || appRecord.role_applied || "Technology & Software",
        subDomain: appRecord.sub_domain || "Full Stack Web Development",
        status: appRecord.status || "selected",
        issueDate: formattedDate,
        profilePhotoUrl: appRecord.profile_photo_url || null,
        internId: profile?.intern_id || `VYNT-08/26-${refId}`,
        startDate: profile?.start_date || formattedDate,
        endDate: profile?.end_date || "3 Months Duration",
        pdfUrl: nocPdfUrl,
        udyamReg: "UDYAM-AP-10-0143100",
        corporateAddress: "Dwaraka Nagar, Visakhapatnam - 530016, AP, India",
        isoStatus: "ISO 9001:2015 Certified & Digitally Signed",
      },
    };
  });
