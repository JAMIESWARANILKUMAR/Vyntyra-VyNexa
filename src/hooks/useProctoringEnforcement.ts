import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import * as faceDetection from '@tensorflow-models/face-detection';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs-core';

export type ProctoringStrictness = "lenient" | "standard" | "strict";

export const STRICTNESS_PROFILES: Record<ProctoringStrictness, {
  maxStrikes: number;
  faceGraceMs: number;
  multiFaceGraceMs: number;
  gazeGraceMs: number;
  gazeMargin: number;
  label: string;
}> = {
  lenient: {
    maxStrikes: 3, // 3 strikes allowed before termination on 4th
    faceGraceMs: 6000,
    multiFaceGraceMs: 4000,
    gazeGraceMs: 6000,
    gazeMargin: 0.10, // allows center 10% to 90%
    label: "Lenient (3 Warnings)"
  },
  standard: {
    maxStrikes: 2, // 2 strikes allowed before termination on 3rd
    faceGraceMs: 3000,
    multiFaceGraceMs: 2000,
    gazeGraceMs: 3000,
    gazeMargin: 0.15, // allows center 15% to 85%
    label: "Standard (2 Warnings)"
  },
  strict: {
    maxStrikes: 1, // 1 strike allowed, 2nd terminates immediately
    faceGraceMs: 1500,
    multiFaceGraceMs: 1000,
    gazeGraceMs: 1500,
    gazeMargin: 0.22, // must look within center 22% to 78%
    label: "Ultra-Strict (1 Warning Max)"
  }
};

export function useProctoringEnforcement(
  isActive: boolean, 
  onTerminate: (reason: string) => void,
  enableCamera: boolean = true,
  strictness: ProctoringStrictness = "standard"
) {
  const profile = STRICTNESS_PROFILES[strictness] || STRICTNESS_PROFILES.standard;
  const maxStrikes = profile.maxStrikes;

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
      
      if (newStrikes > maxStrikes) {
        toast.error(`TERMINATED: Maximum strikes exceeded (${newStrikes}/${maxStrikes}) due to proctoring violation!`, { duration: 6000 });
        onTerminate(reason);
        return newStrikes;
      }
      
      toast.error(`Warning: ${reason}. Strike ${newStrikes}/${maxStrikes}`);
      setActiveWarning({ reason, expiresAt: Date.now() + 20000 }); // 20s warning overlay
      
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
    if (!isActive || !enableCamera || !stream) return;

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
          else if (now - gazeViolationStartRef.current > profile.faceGraceMs) {
            addStrike("Face not visible in camera");
            gazeViolationStartRef.current = null;
          }
        } else if (faces.length > 1) {
          if (!gazeViolationStartRef.current) gazeViolationStartRef.current = now;
          else if (now - gazeViolationStartRef.current > profile.multiFaceGraceMs) {
            addStrike("Multiple faces detected in camera frame");
            gazeViolationStartRef.current = null;
          }
        } else {
          const face = faces[0];
          const box = face.box;
          const centerX = box.xMin + box.width / 2;
          const videoWidth = videoRef.current.videoWidth;
          
          if (centerX < videoWidth * profile.gazeMargin || centerX > videoWidth * (1 - profile.gazeMargin)) {
            if (!gazeViolationStartRef.current) gazeViolationStartRef.current = now;
            else if (now - gazeViolationStartRef.current > profile.gazeGraceMs) {
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
  }, [isActive, stream, enableCamera, strictness]);

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
  }, [isActive, maxStrikes]);

  const requestFullscreen = async () => {
    try {
      if (enableCamera && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const ms = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(ms);
      }
      await document.documentElement.requestFullscreen();
    } catch (e) {
      if (enableCamera) {
        toast.error("Fullscreen and Camera permissions are required to start the exam.");
      } else {
        toast.error("Fullscreen permission is required to start the exam.");
      }
      throw e;
    }
  };

  const clearWarning = () => setActiveWarning(null);

  return { requestFullscreen, strikes, maxStrikes, logs, stream, activeWarning, clearWarning, strictness };
}
