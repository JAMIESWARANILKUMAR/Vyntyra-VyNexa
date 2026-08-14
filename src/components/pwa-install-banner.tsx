import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner({
  title = "Install VyNexa Portal",
  subtitle = "Access your dashboard offline",
  dismissKey = "vy_pwa_banner_dismissed",
  buttonColor = "emerald",
  installLabel = "Install App"
}: {
  title?: string;
  subtitle?: string;
  dismissKey?: string;
  buttonColor?: "emerald" | "gold" | "blue";
  installLabel?: string;
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(dismissKey);
    if (dismissed) return;

    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as any).standalone === true;
    if (isStandalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissKey]);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(dismissKey, "true");
    }
    setShow(false);
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    localStorage.setItem(dismissKey, "true");
    setShow(false);
  }

  if (!show) return null;

  const btnColorClass = 
    buttonColor === "gold" 
      ? "text-gold hover:text-gold/90 hover:bg-gold/10" 
      : buttonColor === "blue"
      ? "text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
      : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10";

  const iconBgClass = 
    buttonColor === "gold" 
      ? "bg-gold/15 border-gold/30" 
      : buttonColor === "blue"
      ? "bg-blue-500/15 border-blue-500/30"
      : "bg-emerald-500/15 border-emerald-500/30";

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[300] w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl shadow-black/40 border border-slate-700/50 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className={`h-10 w-10 rounded-xl ${iconBgClass} border flex items-center justify-center shrink-0`}>
            <img src="/icon-192.png" alt="VyNexa" className="h-7 w-7 rounded-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white leading-tight">{title}</div>
            <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>
          </div>
          <button
            onClick={handleDismiss}
            className="h-7 w-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center shrink-0 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
        <div className="flex border-t border-slate-800">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Not now
          </button>
          <button
            onClick={handleInstall}
            className={`flex-1 py-2.5 text-xs font-bold ${btnColorClass} transition-colors border-l border-slate-800 flex items-center justify-center gap-1.5`}
          >
            <Download className="h-3.5 w-3.5" />
            {installLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
