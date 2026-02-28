import { useRef, useEffect, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { useVoiceGuidance } from "@/hooks/useVoiceGuidance";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Loader2, ScanSearch } from "lucide-react";
import Tesseract from "tesseract.js";

type Mode = "obstacle" | "signboard";
type Environment = "indoor" | "outdoor";

interface DetectionCanvasProps {
  mode: Mode;
  environment: Environment;
}

const DetectionCanvas = ({ mode, environment }: DetectionCanvasProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [statusText, setStatusText] = useState("Camera off");
  const [ocrResult, setOcrResult] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const { speak, stop } = useVoiceGuidance();

  // Load COCO-SSD model
  useEffect(() => {
    const loadModel = async () => {
      await tf.ready();
      const loaded = await cocoSsd.load();
      setModel(loaded);
    };
    loadModel();
  }, []);

  const startCamera = useCallback(async () => {
    setLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: environment === "outdoor" ? "environment" : "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setStatusText("Camera active");
    } catch (err) {
      setStatusText("Camera access denied");
      console.error(err);
    }
    setLoading(false);
  }, [environment]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    cancelAnimationFrame(animFrameRef.current);
    setCameraActive(false);
    setStatusText("Camera off");
    stop();
  }, [stop]);

  const getZone = (x: number, width: number, canvasWidth: number): string => {
    const center = x + width / 2;
    const third = canvasWidth / 3;
    if (center < third) return "left";
    if (center > third * 2) return "right";
    return "center";
  };

  const getZoneMessage = (zone: string, label: string): string => {
    if (zone === "center") return `${label} ahead`;
    return `${label} on your ${zone}`;
  };

  // Obstacle detection loop
  useEffect(() => {
    if (!cameraActive || !model || mode !== "obstacle") return;

    const detect = async () => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const predictions = await model.detect(video);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0);

      const alerts: string[] = [];

      predictions.forEach((pred) => {
        const [x, y, w, h] = pred.bbox;
        const zone = getZone(x, w, canvas.width);

        // Draw bounding box
        ctx.strokeStyle = zone === "center" ? "hsl(0, 72%, 51%)" : "hsl(38, 92%, 50%)";
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);

        // Label
        ctx.fillStyle = zone === "center" ? "hsl(0, 72%, 51%)" : "hsl(38, 92%, 50%)";
        ctx.font = "bold 16px Inter, sans-serif";
        const text = `${pred.class} (${zone})`;
        const textWidth = ctx.measureText(text).width;
        ctx.fillRect(x, y - 24, textWidth + 12, 24);
        ctx.fillStyle = "#fff";
        ctx.fillText(text, x + 6, y - 6);

        alerts.push(getZoneMessage(zone, pred.class));
      });

      if (alerts.length > 0) {
        setStatusText(alerts[0]);
        speak(alerts[0]);
      } else {
        setStatusText("Path clear");
      }

      animFrameRef.current = requestAnimationFrame(detect);
    };

    detect();

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [cameraActive, model, mode, speak]);

  // Signboard mode: just show video
  useEffect(() => {
    if (!cameraActive || mode !== "signboard") return;

    const drawVideo = () => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      animFrameRef.current = requestAnimationFrame(drawVideo);
    };

    drawVideo();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [cameraActive, mode]);

  const captureAndOCR = useCallback(async () => {
    if (!canvasRef.current) return;
    setOcrLoading(true);
    setOcrResult("");
    try {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      const { data } = await Tesseract.recognize(dataUrl, "eng");
      const text = data.text.trim();
      setOcrResult(text || "No text detected");

      if (text) {
        const lower = text.toLowerCase();
        if (lower.includes("exit")) {
          speak("Exit ahead");
          setStatusText("Exit ahead");
        } else if (lower.includes("stair")) {
          speak("Stairs ahead, be careful");
          setStatusText("Stairs ahead, be careful");
        } else if (lower.includes("platform")) {
          speak("Platform area detected");
          setStatusText("Platform area detected");
        } else {
          speak(`Sign reads: ${text.substring(0, 60)}`);
          setStatusText(`Sign: ${text.substring(0, 40)}`);
        }
      } else {
        speak("No text detected on sign");
      }
    } catch {
      setOcrResult("OCR failed");
    }
    setOcrLoading(false);
  }, [speak]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Status Bar */}
      <div
        className={`rounded-lg px-4 py-3 text-center font-semibold text-sm sm:text-base transition-colors ${
          statusText === "Path clear"
            ? "bg-success/15 text-success"
            : statusText === "Camera off"
              ? "bg-muted text-muted-foreground"
              : statusText.includes("denied")
                ? "bg-destructive/15 text-destructive"
                : "bg-warning/15 text-warning"
        }`}
        role="status"
        aria-live="polite"
      >
        {statusText}
      </div>

      {/* Video / Canvas Area */}
      <div className="relative w-full aspect-video bg-foreground/5 rounded-xl overflow-hidden border-2 border-border">
        <video ref={videoRef} className="hidden" playsInline muted />
        <canvas ref={canvasRef} className="w-full h-full object-contain" />
        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <CameraOff className="w-12 h-12" />
            <p className="text-lg font-medium">Camera is off</p>
          </div>
        )}
        {/* Zone indicators when active */}
        {cameraActive && mode === "obstacle" && (
          <div className="absolute inset-0 flex pointer-events-none">
            <div className="flex-1 border-r border-dashed border-muted-foreground/20" />
            <div className="flex-1 border-r border-dashed border-muted-foreground/20" />
            <div className="flex-1" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 justify-center">
        {!cameraActive ? (
          <Button
            onClick={startCamera}
            disabled={loading || !model}
            size="lg"
            className="text-lg px-8 py-6 gap-3"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Camera className="w-5 h-5" />
            )}
            {!model ? "Loading AI Model..." : loading ? "Starting..." : "Start Camera"}
          </Button>
        ) : (
          <>
            <Button onClick={stopCamera} variant="destructive" size="lg" className="text-lg px-8 py-6 gap-3">
              <CameraOff className="w-5 h-5" />
              Stop Camera
            </Button>
            {mode === "signboard" && (
              <Button
                onClick={captureAndOCR}
                disabled={ocrLoading}
                variant="secondary"
                size="lg"
                className="text-lg px-8 py-6 gap-3"
              >
                {ocrLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ScanSearch className="w-5 h-5" />
                )}
                {ocrLoading ? "Reading..." : "Read Sign"}
              </Button>
            )}
          </>
        )}
      </div>

      {/* OCR Result */}
      {mode === "signboard" && ocrResult && (
        <div className="rounded-lg bg-card border border-border p-4">
          <p className="text-sm font-medium text-muted-foreground mb-1">Detected Text:</p>
          <p className="text-base font-semibold text-foreground">{ocrResult}</p>
        </div>
      )}
    </div>
  );
};

export default DetectionCanvas;
