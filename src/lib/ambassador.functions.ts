import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAdminClient } from "@/integrations/supabase/admin";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AmbassadorRegistration {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  college_name: string;
  degree_branch: string;
  graduation_year: string;
  city_state: string;
  linkedin_profile?: string;
  motivation?: string;
  created_at: string;
  status: "pending" | "shortlisted" | "enrolled";
}

// ─── Pre-Register Candidate for First Cohort ───────────────────────
export const submitAmbassadorApplication = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({
      full_name: z.string().trim().min(2, "Name must be at least 2 characters"),
      email: z.string().trim().email("Invalid email address"),
      phone: z.string().trim().min(10, "Phone number must be at least 10 digits"),
      college_name: z.string().trim().min(3, "College name is required"),
      degree_branch: z.string().trim().min(2, "Degree & branch is required"),
      graduation_year: z.string().trim().min(4, "Graduation year is required"),
      city_state: z.string().trim().min(2, "City & State is required"),
      linkedin_profile: z.string().optional(),
      motivation: z.string().optional(),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    const admin = getAdminClient();
    const cleanEmail = data.email.toLowerCase().trim();

    const record: AmbassadorRegistration = {
      id: `amb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      full_name: data.full_name.trim(),
      email: cleanEmail,
      phone: data.phone.trim(),
      college_name: data.college_name.trim(),
      degree_branch: data.degree_branch.trim(),
      graduation_year: data.graduation_year.trim(),
      city_state: data.city_state.trim(),
      linkedin_profile: data.linkedin_profile?.trim() || "",
      motivation: data.motivation?.trim() || "",
      created_at: new Date().toISOString(),
      status: "pending",
    };

    // Store in site_settings under 'ambassador_first_cohort_registrations'
    const { data: existingSetting } = await admin
      .from("site_settings")
      .select("value")
      .eq("id", "ambassador_first_cohort_registrations")
      .maybeSingle();

    let list: AmbassadorRegistration[] = [];
    if (existingSetting?.value) {
      try {
        list = Array.isArray(existingSetting.value) ? existingSetting.value : JSON.parse(existingSetting.value);
      } catch {
        list = [];
      }
    }

    // Check if already registered
    const existingIndex = list.findIndex((r) => r.email === cleanEmail);
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...record, id: list[existingIndex].id };
    } else {
      list.unshift(record);
    }

    const { error: upsertErr } = await admin.from("site_settings").upsert({
      id: "ambassador_first_cohort_registrations",
      value: list,
      updated_at: new Date().toISOString(),
    });

    if (upsertErr) {
      console.error("Failed to save ambassador registration:", upsertErr);
      throw new Error("Unable to save your registration. Please try again.");
    }

    // Optionally notify via user_notifications if profile exists
    try {
      const { data: profile } = await admin
        .from("profiles")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (profile?.id) {
        await admin.from("user_notifications").insert({
          user_id: profile.id,
          title: "Ambassador First Cohort — Registration Confirmed!",
          message: "You have successfully pre-registered for the Vyntyra Institutional Relations Associate (Campus Ambassador) First Cohort. Stay tuned for selection updates!",
          type: "announcement",
          read: false,
          created_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn("Notification logging failed silently:", e);
    }

    return { success: true, id: record.id, message: "Successfully pre-registered for First Cohort!" };
  });

// ─── List Registered Campus Ambassadors for Admin ───────────────────
export const listAmbassadorRegistrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const admin = getAdminClient();
    const { data: setting } = await admin
      .from("site_settings")
      .select("value")
      .eq("id", "ambassador_first_cohort_registrations")
      .maybeSingle();

    if (!setting?.value) return [];
    try {
      const parsed = Array.isArray(setting.value) ? setting.value : JSON.parse(setting.value);
      return (parsed || []) as AmbassadorRegistration[];
    } catch {
      return [];
    }
  });

// ─── Fetch Interns for Promotional Ambassador Campaign ─────────────
export const getInternsForAmbassadorCampaign = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const admin = getAdminClient();

    // Query active applications
    const { data: apps } = await admin
      .from("applications")
      .select("id, email, phone, full_name, college, domain, sub_domain")
      .order("created_at", { ascending: false })
      .limit(300);

    // Query profiles
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email, full_name, role, phone")
      .eq("role", "intern")
      .limit(300);

    const map = new Map<string, { email: string; name: string; phone: string; college: string; domain: string }>();

    (apps || []).forEach((a) => {
      if (a.email) {
        map.set(a.email.toLowerCase(), {
          email: a.email.toLowerCase(),
          name: a.full_name || "Intern",
          phone: a.phone || "",
          college: a.college || "",
          domain: a.domain || "",
        });
      }
    });

    (profiles || []).forEach((p) => {
      if (p.email && !map.has(p.email.toLowerCase())) {
        map.set(p.email.toLowerCase(), {
          email: p.email.toLowerCase(),
          name: p.full_name || "Intern",
          phone: p.phone || "",
          college: "",
          domain: "",
        });
      }
    });

    return Array.from(map.values());
  });

// ─── Send Campus Ambassador Promotional Email (1-Click) ────────────
export const sendAmbassadorPromotionalEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({
      recipient_email: z.string().trim().email(),
      recipient_name: z.string().optional(),
      college_name: z.string().optional(),
      custom_subject: z.string().optional(),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    const admin = getAdminClient();
    const recipientEmail = data.recipient_email.trim().toLowerCase();
    const recipientName = data.recipient_name?.trim() || "Associate";
    const collegeName = data.college_name?.trim() || "Your Institution";
    const subject = data.custom_subject?.trim() || "🚀 Launching Soon: Vyntyra Institutional Relations Associate (Campus Ambassador) — First Cohort";

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b1120; padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background: linear-gradient(180deg, #131d36 0%, #0d1527 100%); border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          
          <!-- Top Accent Stripe -->
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #f59e0b 0%, #ec4899 50%, #6366f1 100%);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: center;">
              <div style="display: inline-block; padding: 6px 14px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 9999px; margin-bottom: 16px;">
                <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.15em; color: #fbbf24; text-transform: uppercase;">✨ FIRST COHORT 2026-27 · LAUNCHING SOON</span>
              </div>
              <h1 style="margin: 0 0 12px 0; font-size: 26px; line-height: 1.25; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                Vyntyra Institutional Relations Associate<br/>
                <span style="background: linear-gradient(90deg, #fbbf24, #f43f5e); -webkit-background-clip: text; -webkit-text-fill-color: transparent; color: #fbbf24;">(Campus Ambassador Program)</span>
              </h1>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                Dear <strong>${recipientName}</strong>, represent Vyntyra Consultancy Services at <strong>${collegeName}</strong>. Build executive leadership, unlock prestigious rewards, and bridge institutional technology networks.
              </p>
            </td>
          </tr>

          <!-- Perks Highlights Table -->
          <tr>
            <td style="padding: 10px 32px 30px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(148, 163, 184, 0.15); border-radius: 12px; padding: 20px;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
                    <div style="font-size: 14px; font-weight: 700; color: #f8fafc;">🎁 Exclusive IRA Welcome Kit</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 3px;">Official Associate Badge, Corporate ID Card, Welcome Stationery & Premium Swag.</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
                    <div style="font-size: 14px; font-weight: 700; color: #f8fafc;">👕 Performance-Based Corporate Merchandise</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 3px;">Exclusive branded apparel, premium hoodies, t-shirts, laptop bags, and water bottles.</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
                    <div style="font-size: 14px; font-weight: 700; color: #10b981;">💰 Ambassador Rewards: Earn up to ₹15,000</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 3px;">Generous milestone stipends & cash incentives within the program (*Performance & T&C Apply).</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
                    <div style="font-size: 14px; font-weight: 700; color: #38bdf8;">⚡ Branded Electronic Gadgets</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 3px;">Top performers receive high-capacity Powerbanks, True Wireless Earbuds, Soundbars, Smartwatches & Webcams.</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
                    <div style="font-size: 14px; font-weight: 700; color: #ec4899;">✈️ Curated Travel Experience (Top 10 Associates)</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 3px;">Top 10 Associates win an all-expenses-paid curated corporate & retreat experience with co-associates.</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
                    <div style="font-size: 14px; font-weight: 700; color: #f8fafc;">📜 Certificate of Recognition & Internship</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 3px;">Dual credentials for your resume: Institutional Leadership & Corporate Relations Internship Letter.</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <div style="font-size: 14px; font-weight: 700; color: #a855f7;">👑 Exclusive VVIP Access to all Vyntyra Events</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 3px;">Free VIP access to all Workshops, Bootcamps, Masterclasses, Sessions, Learning Modules & Courses.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 0 32px 36px 32px;">
              <a href="https://vyntyraconsultancyservices.in/campus-ambassador" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0b1120; font-weight: 800; font-size: 15px; text-decoration: none; padding: 14px 36px; border-radius: 8px; box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.4); text-transform: uppercase; letter-spacing: 0.05em;">
                Pre-Register for First Cohort &rarr;
              </a>
              <p style="margin: 14px 0 0 0; font-size: 12px; color: #64748b;">
                Announcement coming soon. Early applicants receive priority review for Cohort 1.0.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #080d19; padding: 24px; text-align: center; border-top: 1px solid #1e293b;">
              <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.6;">
                Vyntyra Consultancy Services Pvt. Ltd. · Great Place to Work® Certified 2026-27<br/>
                Recognized by NASSCOM FutureSkills Prime · MSME Registered Govt. of India<br/>
                Questions? Email us at <a href="mailto:hr@vyntyraconsultancyservices.in" style="color: #fbbf24; text-decoration: none;">hr@vyntyraconsultancyservices.in</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Attempt to send via Resend or Brevo API
    let sent = false;
    let provider = "none";
    let errorMsg: string | null = null;

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: "Vyntyra Careers <careers@vyntyraconsultancyservices.in>",
            to: [recipientEmail],
            subject,
            html: htmlBody,
          }),
        });

        if (res.ok) {
          sent = true;
          provider = "resend";
        } else {
          const errJson = await res.json().catch(() => ({}));
          errorMsg = `Resend error: ${JSON.stringify(errJson)}`;
        }
      } catch (e: any) {
        errorMsg = e.message;
      }
    }

    if (!sent && process.env.BREVO_API_KEY) {
      try {
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": process.env.BREVO_API_KEY,
          },
          body: JSON.stringify({
            sender: { name: "Vyntyra Consultancy Services", email: "hr@vyntyraconsultancyservices.in" },
            to: [{ email: recipientEmail, name: recipientName }],
            subject,
            htmlContent: htmlBody,
          }),
        });

        if (res.ok) {
          sent = true;
          provider = "brevo";
        } else {
          const errJson = await res.json().catch(() => ({}));
          errorMsg = `Brevo error: ${JSON.stringify(errJson)}`;
        }
      } catch (e: any) {
        errorMsg = e.message;
      }
    }

    // Log the promotional campaign email in automated email logs
    try {
      await admin.from("automated_email_logs").insert({
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        subject,
        status: sent ? "sent" : "failed",
        provider_used: provider,
        error_message: errorMsg,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Ignored if table doesn't have identical schema
    }

    if (!sent && errorMsg) {
      throw new Error(`Email delivery failed: ${errorMsg}`);
    }

    return { success: true, provider, recipient: recipientEmail };
  });
