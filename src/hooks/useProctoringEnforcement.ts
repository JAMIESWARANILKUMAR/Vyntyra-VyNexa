import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";

export function useProctoringEnforcement(isActive: boolean, onTerminate: () => void) {
  const [strikes, setStrikes] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const addStrike = (reason: string) => {
    setStrikes(prev => {
      const newStrikes = prev + 1;
      setLogs(l => [...l, { time: new Date().toISOString(), reason }]);
      toast.error(`Warning: ${reason}. Strike ${newStrikes}/2`);
      if (newStrikes >= 2) {
        onTerminate();
      }
      return newStrikes;
    });
  };

  useEffect(() => {
    if (!isActive) return;
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        addStrike("Exited Fullscreen");
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden) addStrike("Switched Tabs/Lost Focus");
    };
    
    const handleBlur = () => {
      addStrike("Window Lost Focus");
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const forbiddenKeys = ["F12", "Meta", "OS", "Alt", "AltGraph"];
      const forbiddenCombos = e.ctrlKey || e.metaKey || e.altKey;
      if (forbiddenKeys.includes(e.key) || forbiddenCombos) {
        e.preventDefault();
        e.stopPropagation();
        addStrike("Restricted Key Combo Detected");
      }
    };
    
    const preventDefault = (e: Event) => {
      e.preventDefault();
      addStrike("Clipboard/Menu Action Disabled");
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    document.addEventListener("contextmenu", preventDefault);
    document.addEventListener("copy", preventDefault);
    document.addEventListener("cut", preventDefault);
    document.addEventListener("paste", preventDefault);
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
      document.removeEventListener("contextmenu", preventDefault);
      document.removeEventListener("copy", preventDefault);
      document.removeEventListener("cut", preventDefault);
      document.removeEventListener("paste", preventDefault);
    };
  }, [isActive, onTerminate]);

  const requestFullscreen = async () => {
    try {
      // Request camera first so the permission prompt doesn't break fullscreen
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const ms = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(ms);
      }
      await document.documentElement.requestFullscreen();
    } catch (e) {
      toast.error("Fullscreen and Camera permissions are required to start the exam.");
      throw e;
    }
  };

  return { requestFullscreen, strikes, logs, stream };
}

