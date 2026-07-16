import { useEffect } from "react";

// Registers /sw.js in production only. Skips Lovable preview & dev.
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.getRegistrations?.().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
  }, []);
  return null;
}
