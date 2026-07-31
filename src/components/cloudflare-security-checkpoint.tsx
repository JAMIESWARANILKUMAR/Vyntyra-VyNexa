import React, { useState, useEffect } from "react";
import { ShieldCheck, Check, Loader2 } from "lucide-react";

interface CloudflareSecurityCheckpointProps {
  onVerified?: () => void;
  hostname?: string;
  className?: string;
}

export function CloudflareSecurityCheckpoint({
  onVerified,
  hostname = "careers.vyntyraconsultancyservices.in",
  className = "",
}: CloudflareSecurityCheckpointProps) {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [rayId, setRayId] = useState("");

  useEffect(() => {
    // Generate realistic Cloudflare Ray ID
    const randomHex = Math.random().toString(16).substring(2, 18);
    setRayId(`${randomHex}-BOM`);
  }, []);

  const handleVerify = () => {
    if (verified || verifying) return;
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
      setTimeout(() => {
        if (onVerified) onVerified();
      }, 600);
    }, 1200);
  };

  return (
    <div className={`min-h-screen bg-[#FBFBFB] dark:bg-[#121212] text-slate-900 dark:text-slate-100 flex flex-col justify-between font-sans px-4 py-8 select-none ${className}`}>
      {/* Header Logo */}
      <header className="max-w-3xl w-full mx-auto flex items-center justify-between pb-8">
        <div className="flex items-center gap-2.5">
          {/* Cloudflare Cloud Logo SVG */}
          <svg className="h-7 w-auto text-[#F38020]" viewBox="0 0 120 48" fill="currentColor">
            <path d="M91.8 24.6c-.6-4.5-4.4-8-9.1-8-3.4 0-6.4 1.8-8 4.6-1.5-3.3-4.8-5.6-8.7-5.6-4.5 0-8.3 3.1-9.3 7.3-1.6-1.5-3.8-2.4-6.2-2.4-5 0-9.1 4.1-9.1 9.1 0 .6.1 1.1.2 1.7-4.1.8-7.2 4.4-7.2 8.7 0 4.9 4 8.9 8.9 8.9h48.5c4.7 0 8.5-3.8 8.5-8.5 0-4.3-3.2-7.8-7.5-8.4z" fill="#F38020"/>
            <text x="50" y="32" fontFamily="sans-serif" fontSize="20" fontWeight="bold" fill="currentColor" className="text-slate-800 dark:text-slate-200">
              cloudflare
            </text>
          </svg>
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Secure Connection</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl w-full mx-auto my-auto bg-white dark:bg-[#1E1E1E] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">
            {verified ? "Verification Successful" : "Just a moment..."}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-800 dark:text-slate-200">{hostname}</span> needs to review the security of your connection before proceeding.
          </p>
        </div>

        {/* Cloudflare Turnstile Challenge Box */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#262626] p-4 sm:p-5">
          <div 
            onClick={handleVerify}
            className={`flex items-center justify-between cursor-pointer p-3.5 rounded-md transition-all border ${
              verified 
                ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500/30" 
                : "bg-white dark:bg-[#1E1E1E] border-slate-300 dark:border-slate-700 hover:border-slate-400"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="relative flex items-center justify-center">
                {verifying ? (
                  <Loader2 className="h-6 w-6 text-[#F38020] animate-spin" />
                ) : verified ? (
                  <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm">
                    <Check className="h-4 w-4 stroke-[3]" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded border-2 border-slate-400 dark:border-slate-500 bg-white dark:bg-[#2A2A2A] hover:border-[#F38020] transition-colors" />
                )}
              </div>
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {verifying ? "Verifying..." : verified ? "Success!" : "Verify you are human"}
              </span>
            </div>

            {/* Cloudflare Badge */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <svg className="h-4 w-4 text-[#F38020]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
              </svg>
              <span>Cloudflare</span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span>Cloudflare Turnstile Privacy Protection</span>
            <span className="hover:underline cursor-pointer">Privacy · Terms</span>
          </div>
        </div>

        {/* Security details note */}
        <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800/80">
          Why am I seeing this page? Requests from your browser require security verification before accessing corporate portals.
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-3xl w-full mx-auto text-center space-y-2 pt-8 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center justify-center gap-2">
          <span>Performance &amp; security by</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">Cloudflare</span>
        </div>
        <div>
          Ray ID: <code className="font-mono text-slate-600 dark:text-slate-300 bg-slate-200/50 dark:bg-slate-800 px-1.5 py-0.5 rounded">{rayId || "87f9c2e1d0ab412-BOM"}</code>
        </div>
      </footer>
    </div>
  );
}
