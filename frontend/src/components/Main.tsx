import { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, RotateCcw } from "lucide-react";

export default function Main() {
  // 🔹 State Management
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // 🔹 Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 🔹 Fungsi Kamera
  const startCamera = async () => {
    if (isCameraOn) {
      handleCapture(); // kalau kamera sudah nyala → langsung capture
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setIsCameraOn(true);
    } catch (err) {
      console.error("Gagal akses kamera:", err);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setIsCameraOn(false);
    setCountdown(null);
  };

  // 🔹 Countdown & Capture
  const handleCapture = () => {
    let count = 3;
    setCountdown(count);

    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(interval);
        captureImage();
        setCountdown(null);
      }
    }, 1000);

    // Otomatis stop kamera setelah capture
    setTimeout(() => {
      stopCamera();
    }, 4000);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/png");
    setCapturedImage(imageData);
  };

  return (
    <main className="flex-1 bg-background px-6 py-8">
      <div className="gap-6 grid grid-cols-1 md:grid-cols-2 min-h-[calc(100vh-8rem)]">
        {/* 🔹 Kiri: Kamera Preview */}
        <Card className="relative text-center">
          <CardHeader>
            <CardTitle>Kamera</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center w-full">
            <div className="relative flex justify-center items-center bg-black rounded-lg w-full h-96 overflow-hidden">
              {/* Video */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover ${
                  isCameraOn ? "block" : "hidden"
                }`}
              />

              {/* Countdown Overlay */}
              {countdown && (
                <div className="absolute inset-0 flex justify-center items-center bg-black/40 font-bold text-white text-6xl animate-pulse">
                  {countdown}
                </div>
              )}

              {/* Hasil Capture */}
              {capturedImage && !countdown && (
                <img
                  src={capturedImage}
                  alt="Hasil Capture"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {!isCameraOn && !capturedImage && (
                <span className="text-gray-400">Camera Preview</span>
              )}
            </div>

            {/* Tombol Aksi */}
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {capturedImage ? (
                <Button
                  size={"icon"}
                  disabled={!capturedImage}
                  variant="secondary"
                  onClick={() => setCapturedImage(null)}>
                  <RotateCcw />
                </Button>
              ) : (
                <Button
                  size="icon"
                  onClick={startCamera}
                  disabled={!!countdown}>
                  <Camera />
                </Button>
              )}
              <Button
                disabled={!isCameraOn}
                size="icon"
                variant="destructive"
                onClick={stopCamera}>
                <CameraOff />
              </Button>
            </div>

            {/* Hidden canvas untuk capture */}
            <canvas ref={canvasRef} className="hidden" />
          </CardContent>
        </Card>

        {/* 🔹 Kanan: Hasil Pengecekan */}
        <Card>
          <CardHeader>
            <CardTitle>Hasil Pengecekan</CardTitle>
          </CardHeader>
          <CardContent>
            {capturedImage ? (
              <ul className="space-y-4">
                <li className="flex justify-between items-center pb-2 border-b">
                  <span>Helm (Hardhat)</span>
                  <span className="font-semibold text-green-600">
                    ✅ Lengkap
                  </span>
                </li>
                <li className="flex justify-between items-center pb-2 border-b">
                  <span>Masker</span>
                  <span className="font-semibold text-red-600">
                    ❌ Tidak Ada
                  </span>
                </li>
                <li className="flex justify-between items-center pb-2 border-b">
                  <span>Sepatu Safety</span>
                  <span className="font-semibold text-green-600">
                    ✅ Lengkap
                  </span>
                </li>
              </ul>
            ) : (
              <p className="text-gray-500">Belum ada hasil pengecekan</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
