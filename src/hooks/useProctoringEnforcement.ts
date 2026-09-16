
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function useProctoringEnforcement(onTerminate: () => void) {
  const [strikes, setStrikes] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);
  
  const addStrike = (reason: string) => {
    const newStrikes = strikes + 1;
    setStrikes(newStrikes);
    setLogs(prev => [...prev, { time: new Date().toISOString(), reason }]);
    toast.error(`Warning: ${reason}. Strike ${newStrikes}/2`);
    if (newStrikes >= 2) onTerminate();
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        addStrike("Exited Fullscreen");
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden) addStrike("Switched Tabs/Lost Focus");
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F12" || (e.ctrlKey && ["c", "v", "u"].includes(e.key.toLowerCase()))) {
        e.preventDefault();
        addStrike(`Restricted Key: ${e.key}`);
      }
    };
    
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addStrike("Right-Click Disabled");
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [strikes, onTerminate]);

  const requestFullscreen = () => {
    document.documentElement.requestFullscreen().catch(() => toast.error("Please allow fullscreen mode."));
  };

  return { requestFullscreen, strikes, logs };
}

