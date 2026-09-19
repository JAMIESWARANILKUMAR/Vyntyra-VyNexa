import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import * as faceDetection from '@tensorflow-models/face-detection';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs-core';

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

  // TFJS Gaze & Face Tracking
  const detectorRef = useRef<faceDetection.FaceDetector | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const trackingRef = useRef<number | null>(null);
  const gazeViolationStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive || !stream) return;

    let isMounted = true;
    const initDetector = async () => {
      try {
        await tf.ready();
        const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
        const detectorConfig = { runtime: 'tfjs' as const };
        const detector = await faceDetection.createDetector(model, detectorConfig);
        if (isMounted) detectorRef.current = detector;
      } catch (e) {
        console.error("Failed to load face detection model:", e);
      }
    };

    initDetector();

    const video = document.createElement("video");
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.onloadedmetadata = () => {
      video.play().catch(() => {});
    };
    videoRef.current = video;

    const detectFaces = async () => {
      if (!isMounted) return;
      
      if (!detectorRef.current || !videoRef.current || videoRef.current.readyState < 2 || activeWarningRef.current) {
        trackingRef.current = requestAnimationFrame(detectFaces);
        return;
      }

      try {
        const faces = await detectorRef.current.estimateFaces(videoRef.current);
        const now = Date.now();

        if (faces.length === 0) {
          if (!gazeViolationStartRef.current) gazeViolationStartRef.current = now;
          else if (now - gazeViolationStartRef.current > 3000) {
            addStrike("Face not visible in camera");
            gazeViolationStartRef.current = null;
          }
        } else if (faces.length > 1) {
          if (!gazeViolationStartRef.current) gazeViolationStartRef.current = now;
          else if (now - gazeViolationStartRef.current > 2000) {
            addStrike("Multiple faces detected in frame");
            gazeViolationStartRef.current = null;
          }
        } else {
          const face = faces[0];
          const box = face.box;
          const centerX = box.xMin + box.width / 2;
          const videoWidth = videoRef.current.videoWidth;
          
          if (centerX < videoWidth * 0.15 || centerX > videoWidth * 0.85) {
            if (!gazeViolationStartRef.current) gazeViolationStartRef.current = now;
            else if (now - gazeViolationStartRef.current > 3000) {
              addStrike("Suspicious gaze / looking away from screen");
              gazeViolationStartRef.current = null;
            }
          } else {
            gazeViolationStartRef.current = null;
          }
        }
      } catch (e) {
        // Ignore estimation errors (e.g. frame not ready)
      }

      trackingRef.current = requestAnimationFrame(detectFaces);
    };

    trackingRef.current = requestAnimationFrame(detectFaces);

    return () => {
      isMounted = false;
      if (trackingRef.current) cancelAnimationFrame(trackingRef.current);
      if (detectorRef.current) {
        detectorRef.current.dispose();
      }
    };
  }, [isActive, stream]);


  // Tab visibility, fullscreen, shortcuts tracking
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
