import { useState, useRef } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, RotateCcw } from "lucide-react";

export default function Home() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [resultJson, setResultJson] = useState<any>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 🔹 Start Camera
  const startCamera = async () => {
    if (isCameraOn) {
      handleCapture();
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

    // otomatis kirim ke backend setelah capture
    sendToBackend(imageData);
  };

  // 🔹 Kirim ke Backend
  const sendToBackend = async (imageData: string) => {
    try {
      // convert base64 → Blob
      const byteString = atob(imageData.split(",")[1]);
      const mimeString = imageData.split(",")[0].split(":")[1].split(";")[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });

      // masukkan ke FormData
      const formData = new FormData();
      formData.append("file", blob, "capture.png");

      // 🔹 Ambil JSON
      const jsonRes = await axios.post(
        "http://localhost:8000/api/detect/?return_json=true",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setResultJson(jsonRes.data);

      // 🔹 Ambil Image
      const imgRes = await axios.post(
        "http://localhost:8000/api/detect/",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          responseType: "blob",
        }
      );
      const imageUrl = URL.createObjectURL(imgRes.data);
      setResultImage(imageUrl);
    } catch (error) {
      console.error("Gagal kirim ke backend:", error);
    }
  };

  return (
    <div className="gap-6 grid grid-cols-1 md:grid-cols-2 min-h-[calc(100vh-12rem)]">
      {/* Kamera Preview */}
      <Card className="relative text-center">
        <CardHeader>
          <CardTitle>Kamera</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center w-full">
          <div className="relative flex justify-center items-center bg-black rounded-lg w-full h-96 overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${
                isCameraOn ? "block" : "hidden"
              }`}
            />

            {countdown && (
              <div className="absolute inset-0 flex justify-center items-center bg-black/40 font-bold text-white text-6xl animate-pulse">
                {countdown}
              </div>
            )}

            {capturedImage && !countdown && (
              <img
                src={capturedImage}
                alt="Hasil Capture"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {!isCameraOn && !capturedImage && (
              <span className="text-muted-foreground">
                Preview kamera akan muncul di sini
              </span>
            )}
          </div>

          {/* Tombol */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {capturedImage ? (
              <Button
                size={"icon"}
                variant="secondary"
                onClick={() => {
                  setCapturedImage(null);
                  setResultJson(null);
                  setResultImage(null);
                }}>
                <RotateCcw />
              </Button>
            ) : (
              <Button size="icon" onClick={startCamera} disabled={!!countdown}>
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

          <canvas ref={canvasRef} className="hidden" />
        </CardContent>
      </Card>

      {/* Hasil Pengecekan (JSON + IMAGE) */}
      <Card>
        <CardHeader>
          <CardTitle>Hasil Deteksi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* JSON sebagai list class */}
          {resultJson && resultJson.detected_objects.length > 0 ? (
            <ul className="space-y-4">
              {resultJson.detected_objects.map((obj: any, index: number) => (
                <li className="border-b text-red-600" key={index}>
                  {obj.class}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">Belum ada hasil deteksi</p>
          )}

          {/* IMAGE */}
          {resultImage && (
            <img
              src={resultImage}
              alt="Hasil Deteksi"
              className="mx-auto rounded-md max-h-64"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
