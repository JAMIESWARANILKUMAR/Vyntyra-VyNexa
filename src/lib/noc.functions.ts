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
    let profileRecord: any = null;
    if (!appRecord) {
      const searchConditions = [`email.eq.${qLower}`];
      if (shortId) searchConditions.push(`intern_id.ilike.%${shortId}%`);
      else searchConditions.push(`intern_id.ilike.%${q}%`);

      const { data: prof } = await adminClient
        .from("profiles")
        .select("*, applications(*)")
        .or(searchConditions.join(","))
        .maybeSingle();

      if (prof) {
        profileRecord = prof;
        if (prof.applications) {
          appRecord = Array.isArray(prof.applications) ? prof.applications[0] : prof.applications;
        }
      }
    }

    if (!appRecord && profileRecord) {
      // Synthesize appRecord from profile details
      appRecord = {
        id: profileRecord.id,
        full_name: profileRecord.full_name,
        email: profileRecord.email,
        phone: profileRecord.emergency_contact || "",
        college: "Academic Institution",
        state: "Andhra Pradesh",
        domain: profileRecord.department || "Technology & Software",
        sub_domain: profileRecord.position || "Full Stack Web Development",
        status: "hired",
        created_at: profileRecord.created_at || new Date().toISOString(),
        profile_photo_url: profileRecord.avatar_url || null,
        certificate_url: null
      };
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
  .validator((d: any) => z.object({ data: z.string() }).parse(d))
  .handler(async ({ data }) => {
    try {
      const rawUrl = data.data;
      if (!rawUrl) return null;

      // Handle relative paths directly on server filesystem
      if (rawUrl.startsWith("/")) {
        try {
          const fs = await import("fs");
          const path = await import("path");
          const filePath = path.join(process.cwd(), "public", rawUrl.replace(/^\//, ""));
          if (fs.existsSync(filePath)) {
            const buffer = fs.readFileSync(filePath);
            const ext = rawUrl.split(".").pop()?.toLowerCase() || "png";
            const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "svg" ? "image/svg+xml" : "image/png";
            return `data:${mime};base64,${buffer.toString("base64")}`;
          }
        } catch (localErr) {
          console.warn("[proxyImageFetch] Local file read failed:", localErr);
        }
      }

      const { resolveGooglePhotosUrl } = await import("./google-photos");
      const url = (await resolveGooglePhotosUrl(rawUrl)) || rawUrl;
      
      let res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        redirect: "follow"
      });

      // If initial fetch failed and it was a Google Drive link, try alternative direct CDN
      if ((!res.ok || (res.headers.get("content-type") || "").includes("text/html")) && rawUrl.includes("drive.google.com")) {
        const driveMatch = rawUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || rawUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (driveMatch && driveMatch[1]) {
          const fallbackUrl = `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
          const fallbackRes = await fetch(fallbackUrl, { redirect: "follow" });
          if (fallbackRes.ok && !(fallbackRes.headers.get("content-type") || "").includes("text/html")) {
            res = fallbackRes;
          }
        }
      }

      if (!res.ok) return null;
      const contentType = res.headers.get("content-type") || "image/png";
      if (contentType.includes("text/html") || contentType.includes("application/json")) {
        console.warn("[proxyImageFetch] Non-image content type returned:", contentType);
        return null;
      }

      const buffer = await res.arrayBuffer();
      const b64 = Buffer.from(buffer).toString("base64");
      return `data:${contentType};base64,${b64}`;
    } catch (err) {
      console.error("[proxyImageFetch] error:", err);
      return null;
    }
  });

export const updateNocUrl = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ applicationId: z.string(), publicUrl: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();
    await adminClient.from("applications").update({ noc_url: data.publicUrl, updated_at: new Date().toISOString() }).eq("id", data.applicationId);
    try {
      const { data: appData } = await adminClient.from("applications").select("email").eq("id", data.applicationId).maybeSingle();
      if (appData?.email) {
        await adminClient.from("profiles").update({ noc_url: data.publicUrl, updated_at: new Date().toISOString() }).eq("email", appData.email);
      }
      await adminClient.from("profiles").update({ noc_url: data.publicUrl, updated_at: new Date().toISOString() }).eq("id", data.applicationId);
    } catch (e) {
      console.warn("[updateNocUrl] profile noc_url update non-fatal:", e);
    }
    return { success: true, url: data.publicUrl };
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

    await adminClient.from("applications").update({ noc_url: publicUrl, updated_at: new Date().toISOString() }).eq("id", data.applicationId);

    try {
      const { data: appData } = await adminClient.from("applications").select("email").eq("id", data.applicationId).maybeSingle();
      if (appData?.email) {
        await adminClient.from("profiles").update({ noc_url: publicUrl, updated_at: new Date().toISOString() }).eq("email", appData.email);
      }
      await adminClient.from("profiles").update({ noc_url: publicUrl, updated_at: new Date().toISOString() }).eq("id", data.applicationId);
    } catch (e) {
      console.warn("[saveNocPdf] profile noc_url update non-fatal:", e);
    }

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
