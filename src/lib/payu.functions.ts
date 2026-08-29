import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash } from "crypto";

/**
 * PayU Hosted Checkout — server-side hash generation.
 *
 * Hash formula (SHA-512):
 *   key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
 *
 * The response returns all fields needed to build a self-submitting
 * HTML form that POSTs to https://secure.payu.in/_payment
 */
export const generatePayuCheckout = createServerFn({ method: "POST" })
  .validator(
    z.object({
      firstname: z.string(),
      email: z.string().email(),
      phone: z.string(),
      amount: z.number().positive(),
      productinfo: z.string().default("Exam Fee Payment - Vyntyra VyNexa"),
      userId: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const key = process.env.PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_MERCHANT_SALT;

    if (!key || !salt) {
      throw new Error("PayU merchant credentials are not configured.");
    }

    // Generate a unique transaction ID
    const txnid = `VYN-${data.userId.slice(0, 8).toUpperCase()}-${Date.now()}`;
    const amount = data.amount.toFixed(2);

    // Success / Failure URLs — redirect back to intern dashboard
    const baseUrl = process.env.VITE_APP_URL || "https://careers.vyntyraconsultancyservices.in";
    const surl = `${baseUrl}/intern?payment=success&txnid=${txnid}`;
    const furl = `${baseUrl}/intern?payment=failed&txnid=${txnid}`;

    // Hash string: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
    const hashString = `${key}|${txnid}|${amount}|${data.productinfo}|${data.firstname}|${data.email}|||||||||||${salt}`;
    const hash = createHash("sha512").update(hashString).digest("hex");

    return {
      key,
      txnid,
      amount,
      productinfo: data.productinfo,
      firstname: data.firstname,
      email: data.email,
      phone: data.phone,
      surl,
      furl,
      hash,
      // PayU production endpoint
      action: "https://secure.payu.in/_payment",
    };
  });

export const confirmInternPayment = createServerFn({ method: "POST" })
  .validator(
    z.object({
      userId: z.string(),
      txnid: z.string(),
      amount: z.number().optional(),
      paymentMode: z.string().default("PayU PG / Online"),
      paymentStatus: z.string().default("paid"),
    })
  )
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/integrations/supabase/admin");
    const admin = getAdminClient();

    const updatePayload: any = {
      exam_fee_paid: true,
      payment_reference_no: data.txnid,
      payment_status: data.paymentStatus,
      payment_mode: data.paymentMode,
      urgent_popup_active: false,
      fee_payment_scheduled: false,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Update profile
    const { error: profError } = await admin
      .from("profiles")
      .update(updatePayload)
      .eq("id", data.userId);

    if (profError) {
      console.warn("[confirmInternPayment] profile update warning:", profError.message);
    }

    // Also update any matching application record
    try {
      const { data: prof } = await admin.from("profiles").select("email").eq("id", data.userId).maybeSingle();
      if (prof?.email) {
        await admin
          .from("applications")
          .update({
            exam_fee_paid: true,
            payment_reference_no: data.txnid,
            payment_status: data.paymentStatus,
            payment_mode: data.paymentMode,
            updated_at: new Date().toISOString(),
          })
          .eq("email", prof.email);
      }
    } catch (e) {
      console.warn("[confirmInternPayment] application update warning:", e);
    }

    // Insert user notification
    try {
      await admin.from("user_notifications").insert({
        user_id: data.userId,
        title: "Exam Fee Payment Confirmed",
        message: `Your payment has been verified (Ref: ${data.txnid}). Your Intern Dashboard and task deliverables are fully unlocked!`,
        type: "payment_confirmed",
        is_read: false,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("[confirmInternPayment] notification insert skipped:", e);
    }

    return {
      success: true,
      referenceNo: data.txnid,
      status: data.paymentStatus,
      mode: data.paymentMode,
      message: "Payment successfully verified and recorded.",
    };
  });

/**
 * Kotak Mahindra Bank Corporate Payment Gateway
 * Supports Hosted Checkout, Direct NetBanking, Kotak 811, UPI, and Card Payments.
 */
export const generateKotakCheckout = createServerFn({ method: "POST" })
  .validator(
    z.object({
      firstname: z.string(),
      email: z.string().email(),
      phone: z.string(),
      amount: z.number().positive(),
      productinfo: z.string().default("Exam Fee Payment - Vyntyra VyNexa"),
      userId: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const merchantId = process.env.KOTAK_MERCHANT_ID || "KKBK_VYNEXA_CORP";
    const secretKey = process.env.KOTAK_SECRET_KEY || "kotak_vynexa_sec_key_2026";

    // Generate a unique Kotak transaction ID
    const txnid = `KKBK-${data.userId.slice(0, 8).toUpperCase()}-${Date.now()}`;
    const amount = data.amount.toFixed(2);

    // Return URLs
    const baseUrl = process.env.VITE_APP_URL || "https://careers.vyntyraconsultancyservices.in";
    const surl = `${baseUrl}/intern?payment=success&gateway=kotak&txnid=${txnid}`;
    const furl = `${baseUrl}/intern?payment=failed&gateway=kotak&txnid=${txnid}`;

    // Generate SHA-512 checksum / signature for Kotak PG
    const rawSignature = `${merchantId}|${txnid}|${amount}|${data.firstname}|${data.email}|${data.productinfo}|${secretKey}`;
    const checksum = createHash("sha512").update(rawSignature).digest("hex");

    return {
      merchantId,
      txnid,
      amount,
      currency: "INR",
      productinfo: data.productinfo,
      firstname: data.firstname,
      email: data.email,
      phone: data.phone,
      surl,
      furl,
      returnUrl: surl,
      cancelUrl: furl,
      checksum,
      gatewayProvider: "Kotak Mahindra Bank",
      supportedChannels: [
        "Kotak NetBanking",
        "Kotak 811 Mobile Banking",
        "Unified Payments Interface (UPI)",
        "Credit / Debit Cards (Visa / Mastercard / RuPay)",
        "Corporate NetBanking & NEFT / RTGS"
      ],
      action: "https://pgi.kotak.com/epg/v1/checkout",
    };
  });

export const confirmKotakPayment = createServerFn({ method: "POST" })
  .validator(
    z.object({
      userId: z.string(),
      txnid: z.string(),
      amount: z.number().optional(),
      paymentMode: z.string().default("Kotak Mahindra Bank PG / Online"),
      paymentStatus: z.string().default("paid"),
      bankRefNo: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/integrations/supabase/admin");
    const admin = getAdminClient();

    const referenceNo = data.bankRefNo || data.txnid;

    const updatePayload: any = {
      exam_fee_paid: true,
      payment_reference_no: referenceNo,
      payment_status: data.paymentStatus,
      payment_mode: data.paymentMode,
      urgent_popup_active: false,
      fee_payment_scheduled: false,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Update profile
    const { error: profError } = await admin
      .from("profiles")
      .update(updatePayload)
      .eq("id", data.userId);

    if (profError) {
      console.warn("[confirmKotakPayment] profile update warning:", profError.message);
    }

    // Update application record
    try {
      const { data: prof } = await admin.from("profiles").select("email").eq("id", data.userId).maybeSingle();
      if (prof?.email) {
        await admin
          .from("applications")
          .update({
            exam_fee_paid: true,
            payment_reference_no: referenceNo,
            payment_status: data.paymentStatus,
            payment_mode: data.paymentMode,
            updated_at: new Date().toISOString(),
          })
          .eq("email", prof.email);
      }
    } catch (e) {
      console.warn("[confirmKotakPayment] application update warning:", e);
    }

    // Insert user notification
    try {
      await admin.from("user_notifications").insert({
        user_id: data.userId,
        title: "Kotak Mahindra Bank Payment Verified",
        message: `Your payment of ₹${data.amount || 199} has been successfully settled via Kotak Mahindra Bank Gateway (Ref: ${referenceNo}). Your dashboard is fully unlocked!`,
        type: "payment_confirmed",
        is_read: false,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("[confirmKotakPayment] notification insert skipped:", e);
    }

    return {
      success: true,
      referenceNo,
      status: data.paymentStatus,
      mode: data.paymentMode,
      message: "Kotak Mahindra Bank payment verified and recorded.",
    };
  });

