import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";

export function useProctoringEnforcement(isActive: boolean, onTerminate: (reason: string) => void) {
  const [strikes, setStrikes] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const [activeWarning, setActiveWarning] = useState<{reason: string, expiresAt: number} | null>(null);
  const activeWarningRef = useRef(activeWarning);
  activeWarningRef.current = activeWarning;
  
  const addStrike = (reason: string) => {
    if (activeWarningRef.current) return; 

    setStrikes(prev => {
      const newStrikes = prev + 1;
      setLogs(l => [...l, { time: new Date().toISOString(), reason }]);
      
      if (newStrikes >= 3) {
        toast.error("FINAL STRIKE: Exam Terminated due to malpractice!", { duration: 5000 });
        onTerminate(reason);
        return newStrikes;
      }
      
      toast.error(`Warning: ${reason}. Strike ${newStrikes}/2`);
      setActiveWarning({ reason, expiresAt: Date.now() + 20000 }); // 20s timer
      
      return newStrikes;
    });
  };

  useEffect(() => {
    if (!activeWarning) return;
    const interval = setInterval(() => {
      if (Date.now() >= activeWarning.expiresAt) {
        setActiveWarning(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeWarning]);

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
  }, [isActive]);

  const requestFullscreen = async () => {
    try {
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

  const clearWarning = () => setActiveWarning(null);

  return { requestFullscreen, strikes, logs, stream, activeWarning, clearWarning };
}
