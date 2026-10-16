import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import * as faceDetection from '@tensorflow-models/face-detection';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs-core';

export interface DetectedDeviceInfo {
  type: string;
  location: string;
  confidence: number;
  bbox?: [number, number, number, number];
}

export type ProctoringStrictness = "lenient" | "standard" | "strict";
export type ProctoringMode = "camera_malpractice" | "camera_monitoring" | "focus_only";

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
  strictness: ProctoringStrictness = "standard",
  proctoringMode: ProctoringMode = "camera_malpractice",
  allowCtrlKeys: boolean = false
) {
  const profile = STRICTNESS_PROFILES[strictness] || STRICTNESS_PROFILES.standard;
  const isMonitoringOnly = proctoringMode === "camera_monitoring";
  const maxStrikes = isMonitoringOnly ? 999 : profile.maxStrikes;

  const [strikes, setStrikes] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const [activeWarning, setActiveWarning] = useState<{reason: string, expiresAt: number} | null>(null);
  const activeWarningRef = useRef(activeWarning);
  activeWarningRef.current = activeWarning;

  const [detectedDevice, setDetectedDevice] = useState<DetectedDeviceInfo | null>(null);
  const detectedDeviceRef = useRef<DetectedDeviceInfo | null>(null);
  detectedDeviceRef.current = detectedDevice;
  
  const addStrike = (reason: string, isCameraOnlyEvent: boolean = false) => {
    // In camera monitoring mode, camera/gaze events are logged passively without penalty
    if (isMonitoringOnly && isCameraOnlyEvent) {
      setLogs(l => [...l, { time: new Date().toISOString(), reason: `[Monitoring Telemetry] ${reason}`, passive: true }]);
      return;
    }

    if (activeWarningRef.current) return; 

    setStrikes(prev => {
      const newStrikes = prev + 1;
      setLogs(l => [...l, { time: new Date().toISOString(), reason }]);
      
      if (!isMonitoringOnly && newStrikes > maxStrikes) {
        toast.error(`TERMINATED: Maximum strikes exceeded (${newStrikes}/${maxStrikes}) due to proctoring violation!`, { duration: 6000 });
        onTerminate(reason);
        return newStrikes;
      }
      
      if (isMonitoringOnly) {
        toast.info(`Proctoring Observation: ${reason}`, { duration: 3000 });
      } else {
        toast.error(`Warning: ${reason}. Strike ${newStrikes}/${maxStrikes}`);
        setActiveWarning({ reason, expiresAt: Date.now() + 20000 }); // 20s warning overlay
      }
      
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

  // TFJS Gaze, Face & Device Tracking
  const detectorRef = useRef<faceDetection.FaceDetector | null>(null);
  const objectDetectorRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const trackingRef = useRef<number | null>(null);
  const gazeViolationStartRef = useRef<number | null>(null);
  const deviceViolationStartRef = useRef<number | null>(null);
  const lastObjectCheckRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive || !enableCamera || !stream) return;

    let isMounted = true;
    const initDetectors = async () => {
      try {
        await tf.ready();
        const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
        const detectorConfig = { runtime: 'tfjs' as const };
        const [faceDet, objDet] = await Promise.all([
          faceDetection.createDetector(model, detectorConfig).catch(err => {
            console.error("Face detector initialization error:", err);
            return null;
          }),
          cocoSsd.load({ base: 'lite_mobilenet_v2' }).catch(err => {
            console.warn("Retrying default cocoSsd:", err);
            return cocoSsd.load().catch(() => null);
          })
        ]);
        if (isMounted) {
          detectorRef.current = faceDet;
          objectDetectorRef.current = objDet;
        }
      } catch (e) {
        console.error("Failed to load proctoring detection models:", e);
      }
    };

    initDetectors();

    const video = document.createElement("video");
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.onloadedmetadata = () => {
      video.play().catch(() => {});
    };
    videoRef.current = video;

    const detectFrames = async () => {
      if (!isMounted) return;
      
      if (!videoRef.current || videoRef.current.readyState < 2 || activeWarningRef.current) {
        trackingRef.current = requestAnimationFrame(detectFrames);
        return;
      }

      const now = Date.now();

      // 1. Prohibited Electronic Device Detection (Phone, Laptop, Screen, Tablet, Remote)
      if (objectDetectorRef.current && (now - lastObjectCheckRef.current > 500)) {
        lastObjectCheckRef.current = now;
        try {
          const predictions = await objectDetectorRef.current.detect(videoRef.current);
          const PROHIBITED_CLASSES = ['cell phone', 'laptop', 'tv', 'remote', 'tablet'];
          const found = predictions.find(p => 
            PROHIBITED_CLASSES.includes(p.class.toLowerCase()) && p.score >= 0.45
          );

          if (found) {
            const className = found.class.toLowerCase();
            const deviceName = className === 'cell phone' 
              ? 'Mobile Phone' 
              : className === 'tv' 
              ? 'Secondary Screen / Monitor' 
              : className === 'laptop' 
              ? 'Secondary Laptop' 
              : 'Electronic Device';

            const [x, y, w, h] = found.bbox;
            const vidW = videoRef.current.videoWidth || 640;
            const vidH = videoRef.current.videoHeight || 480;
            const cX = x + w / 2;
            const cY = y + h / 2;
            const isMiddle = (cX >= vidW * 0.20 && cX <= vidW * 0.80) && (cY >= vidH * 0.15 && cY <= vidH * 0.85);
            const loc = isMiddle ? "middle of screen / camera view" : "camera frame";

            const info: DetectedDeviceInfo = {
              type: deviceName,
              location: loc,
              confidence: Math.round(found.score * 100),
              bbox: [x, y, w, h]
            };
            setDetectedDevice(info);

            if (!deviceViolationStartRef.current) {
              deviceViolationStartRef.current = now;
            } else if (now - deviceViolationStartRef.current > 1000) { // 1 second persistent device detected
              const reason = `Prohibited Electronic Device (${deviceName}) detected in ${loc}`;
              addStrike(reason, false);
              setActiveWarning({
                reason: `Prohibited Electronic Device Detected: ${deviceName} in ${loc}. Please remove all unauthorized devices, mobile phones, or secondary screens immediately!`,
                expiresAt: Date.now() + 20000
              });
              deviceViolationStartRef.current = null;
            }
          } else {
            deviceViolationStartRef.current = null;
            if (detectedDeviceRef.current) {
              setDetectedDevice(null);
            }
          }
        } catch (err) {
          // Ignore inference frame error
        }
      }

      // 2. Face and Gaze Detection
      if (detectorRef.current) {
        try {
          const faces = await detectorRef.current.estimateFaces(videoRef.current);

          if (faces.length === 0) {
            if (!gazeViolationStartRef.current) gazeViolationStartRef.current = now;
            else if (now - gazeViolationStartRef.current > profile.faceGraceMs) {
              addStrike("Face not visible in camera", true);
              gazeViolationStartRef.current = null;
            }
          } else if (faces.length > 1) {
            if (!gazeViolationStartRef.current) gazeViolationStartRef.current = now;
            else if (now - gazeViolationStartRef.current > profile.multiFaceGraceMs) {
              addStrike("Multiple faces detected in camera frame", true);
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
                addStrike("Suspicious gaze / looking away from screen", true);
                gazeViolationStartRef.current = null;
              }
            } else {
              gazeViolationStartRef.current = null;
            }
          }
        } catch (e) {
          // Ignore estimation errors
        }
      }

      trackingRef.current = requestAnimationFrame(detectFrames);
    };

    trackingRef.current = requestAnimationFrame(detectFrames);

    return () => {
      isMounted = false;
      if (trackingRef.current) cancelAnimationFrame(trackingRef.current);
      if (detectorRef.current) {
        detectorRef.current.dispose();
      }
      if (objectDetectorRef.current && typeof (objectDetectorRef.current as any).dispose === 'function') {
        try { (objectDetectorRef.current as any).dispose(); } catch (_) {}
      }
    };
  }, [isActive, stream, enableCamera, strictness, isMonitoringOnly]);

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
      // If admin enabled Ctrl keys, permit copy/paste/code editing shortcuts
      if (allowCtrlKeys) {
        if (e.key === "F12" || (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C"))) {
          e.preventDefault();
          e.stopPropagation();
          addStrike("Restricted Developer Tools Shortcut");
        }
        return;
      }

      const forbiddenKeys = ["F12", "Meta", "OS", "Alt", "AltGraph"];
      const forbiddenCombos = e.ctrlKey || e.metaKey || e.altKey;
      if (forbiddenKeys.includes(e.key) || forbiddenCombos) {
        e.preventDefault();
        e.stopPropagation();
        addStrike("Restricted Key Combo Detected");
      }
    };
    
    const preventDefault = (e: Event) => {
      if (allowCtrlKeys) return;
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
  }, [isActive, maxStrikes, allowCtrlKeys]);

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

  return { 
    requestFullscreen, 
    strikes, 
    maxStrikes, 
    logs, 
    stream, 
    activeWarning, 
    clearWarning, 
    strictness, 
    proctoringMode, 
    allowCtrlKeys,
    detectedDevice 
  };
}
