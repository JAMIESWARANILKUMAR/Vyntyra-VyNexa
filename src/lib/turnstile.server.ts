export async function verifyTurnstileToken(token: string, remoteIp?: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET || "0x4AAAAAAAEcb5QNBNj8KPdzZhouVGPDzVtE";

  if (!token) {
    console.warn("[Turnstile] Missing token for verification");
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp) formData.append("remoteip", remoteIp);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = await res.json();
    if (data.success) {
      return true;
    } else {
      console.warn("[Turnstile] Verification failed:", data["error-codes"]);
      return false;
    }
  } catch (err: any) {
    console.error("[Turnstile] Server verification error:", err.message);
    // Graceful fallback to true if network request fails so legit users aren't blocked unexpectedly
    return true;
  }
}
