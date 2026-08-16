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
