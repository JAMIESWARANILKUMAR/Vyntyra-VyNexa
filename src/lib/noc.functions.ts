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

    let appRecord: any = null;

    // Determine if query looks like an email or a UUID
    const isEmail = q.includes("@");
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);
    
    // Extract a possible short ID (8 hex chars) for fallback searching
    const shortIdMatch = q.match(/[0-9a-fA-F]{8}/);
    const shortId = shortIdMatch ? shortIdMatch[0] : null;

    if (isUUID) {
      const { data: byId } = await adminClient
        .from("applications")
        .select("*")
        .eq("id", q)
        .maybeSingle();
      if (byId) appRecord = byId;
    } else if (isEmail) {
      const { data: byEmail } = await adminClient
        .from("applications")
        .select("*")
        .eq("email", qLower)
        .order("created_at", { ascending: false })
        .limit(1);
      if (byEmail && byEmail.length > 0) appRecord = byEmail[0];
    } else {
      // It might be a phone number
      const { data: byPhone } = await adminClient
        .from("applications")
        .select("*")
        .eq("phone", q)
        .order("created_at", { ascending: false })
        .limit(1);
      if (byPhone && byPhone.length > 0) appRecord = byPhone[0];
    }

    // 2. If not found by application table directly, try matching profiles intern_id
    if (!appRecord) {
      const searchConditions = [`email.eq.${qLower}`];
      if (shortId) searchConditions.push(`intern_id.ilike.%${shortId}%`);
      else searchConditions.push(`intern_id.ilike.%${q}%`);

      const { data: prof } = await adminClient
        .from("profiles")
        .select("*, applications(*)")
        .or(searchConditions.join(","))
        .maybeSingle();

      if (prof && prof.applications) {
        appRecord = Array.isArray(prof.applications) ? prof.applications[0] : prof.applications;
      }
    }

    if (!appRecord || !appRecord.id) {
      return {
        found: false,
        message: "No official NOC or selection record found matching the provided Registration ID or Email address.",
      };
    }

    // Fetch corresponding profile for intern_id & dates if present
    const { data: profile } = await adminClient
      .from("profiles")
      .select("intern_id, start_date, end_date, department, position, avatar_url")
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
        profilePhotoUrl: profile?.avatar_url || appRecord.profile_photo_url || null,
        internId: profile?.intern_id || `VYNT-08/26-${refId}`,
        startDate: profile?.start_date || formattedDate,
        endDate: profile?.end_date || "3 Months Duration",
        pdfUrl: nocPdfUrl,
        certificateUrl: appRecord.certificate_url || null,
        udyamReg: "UDYAM-AP-10-0143100",
        corporateAddress: "Dwaraka Nagar, Visakhapatnam - 530016, AP, India",
        isoStatus: "ISO 9001:2015 Certified & Digitally Signed",
      },
    };
  });

const savePdfSchema = z.object({
  applicationId: z.string().min(1),
  pdfBase64: z.string().min(1),
});

export const proxyImageFetch = createServerFn({ method: "POST" })
  .validator((url: string) => url)
  .handler(async ({ data: url }) => {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (!res.ok) return null;
      const buffer = await res.arrayBuffer();
      const contentType = res.headers.get("content-type") || "image/jpeg";
      const b64 = Buffer.from(buffer).toString("base64");
      return `data:${contentType};base64,${b64}`;
    } catch (err) {
      console.error("[proxyImageFetch] error:", err);
      return null;
    }
  });

export const saveNocPdf = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => savePdfSchema.parse(d))
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();
    const base64Data = data.pdfBase64.replace(/^data:application\/pdf;base64,/, "");
    const pdfBuffer = Buffer.from(base64Data, "base64");
    const filepath = `nocs/${data.applicationId}_NOC.pdf`;

    const { error: uploadError } = await adminClient.storage
      .from("default")
      .upload(filepath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) throw new Error(uploadError.message);

    const { data: { publicUrl } } = adminClient.storage
      .from("default")
      .getPublicUrl(filepath);

    await adminClient.from("applications").update({ noc_url: publicUrl }).eq("id", data.applicationId);

    return { success: true, url: publicUrl };
  });

export const saveInternshipCertificatePdf = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => savePdfSchema.parse(d))
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();
    const base64Data = data.pdfBase64.replace(/^data:application\/pdf;base64,/, "");
    const pdfBuffer = Buffer.from(base64Data, "base64");
    const filepath = `certificates/${data.applicationId}_Certificate.pdf`;

    const { error: uploadError } = await adminClient.storage
      .from("default")
      .upload(filepath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) throw new Error(uploadError.message);

    const { data: { publicUrl } } = adminClient.storage
      .from("default")
      .getPublicUrl(filepath);

    await adminClient.from("applications").update({ certificate_url: publicUrl }).eq("id", data.applicationId);

    return { success: true, url: publicUrl };
  });
