from fastapi import FastAPI, UploadFile, File, Response
from fastapi.middleware.cors import CORSMiddleware
import cv2
import cvzone
import numpy as np
from ultralytics import YOLO

app = FastAPI()

# Aktifkan CORS agar frontend bisa mengakses API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Sesuaikan dengan domain frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model YOLOv8
model = YOLO("models/ppe.pt")

# Daftar class yang bisa dideteksi
classNames = {
    0: 'Hardhat', 1: 'Mask', 2: 'NO-Hardhat', 3: 'NO-Mask', 4: 'NO-Safety Vest', 
    5: 'Person', 6: 'Safety Cone', 7: 'Safety Vest', 8: 'machinery', 9: 'vehicle'
}

@app.get("/")
def home():
    return {"message": "Server is running"}

@app.post("/api/detect/")
async def detect_image(file: UploadFile = File(...), return_json: bool = False):
    # Baca gambar dari file upload
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Lakukan deteksi dengan model YOLOv8
    results = model(img, stream=True)

    detected_objects = []

    for r in results:
        for box in r.boxes:
            if box.conf is None or box.cls is None:
                continue  # Skip jika tidak ada confidence atau class

            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf = round(float(box.conf[0]), 2)
            cls = int(box.cls[0])
            currentClass = classNames.get(cls, "Unknown")

            # **Skip Mask dan NO-Mask**
            if currentClass in ["Mask", "NO-Mask", "Person"]:
                continue  # Lewati proses deteksi untuk kelas ini

            if conf > 0.5:
                color = (0, 255, 0) if "NO-" not in currentClass else (0, 0, 255)
                cvzone.putTextRect(img, f'{currentClass} {conf}', (x1, y1), scale=1, thickness=1, colorB=color)
                cv2.rectangle(img, (x1, y1), (x2, y2), color, 3)

                detected_objects.append({
                    "class": currentClass,
                    "bbox": [x1, y1, x2, y2],
                    "confidence": conf
                })

    if return_json:
        return {"detected_objects": detected_objects}

    # Encode hasil gambar ke format JPEG
    _, buffer = cv2.imencode('.jpg', img)

    # Return image dengan bounding box
    return Response(content=buffer.tobytes(), media_type="image/jpeg")
