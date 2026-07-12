import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPwaButton({ className = "" }: { className?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    if (standalone) setInstalled(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !deferred) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await deferred.prompt();
          const { outcome } = await deferred.userChoice;
          if (outcome === "accepted") setInstalled(true);
          setDeferred(null);
        } catch {
          setDeferred(null);
        }
      }}
      className={
        "inline-flex items-center gap-2 rounded-sm border border-gold/50 bg-gold/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gold hover:bg-gold/20 transition-colors " +
        className
      }
      aria-label="Install VyNexa App"
    >
      <img src="/favicon.png" alt="VyNexa Logo" className="h-3.5 w-3.5 object-contain rounded-sm" />
      <span className="hidden sm:inline">Install VyNexa App</span>
      <span className="sm:hidden">Install</span>
    </button>
  );
}
