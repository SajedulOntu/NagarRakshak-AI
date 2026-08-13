from pathlib import Path
from ultralytics import YOLO


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "best.pt"


if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"YOLO model not found: {MODEL_PATH}"
    )


model = YOLO(str(MODEL_PATH))


def detect_image(
    image_path,
    confidence_threshold=0.25,
):
    results = model.predict(
        source=image_path,
        conf=confidence_threshold,
        verbose=False,
    )

    detections = []

    for result in results:
        if result.boxes is None:
            continue

        for box in result.boxes:
            class_id = int(
                box.cls[0].item()
            )

            confidence = float(
                box.conf[0].item()
            )

            class_name = result.names.get(
                class_id,
                str(class_id),
            )

            xyxy = (
                box.xyxy[0]
                .cpu()
                .tolist()
            )

            detections.append({
                "class": class_name,

                "confidence": round(
                    confidence * 100,
                    2,
                ),

                "box": {
                    "x1": round(xyxy[0], 2),
                    "y1": round(xyxy[1], 2),
                    "x2": round(xyxy[2], 2),
                    "y2": round(xyxy[3], 2),
                },
            })

    return detections