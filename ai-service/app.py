from flask import (
    Flask,
    jsonify,
    Response,
    request,
    send_from_directory,
)

from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

import cv2
import os
import requests
from uuid import uuid4

from stream import DroneStream
from detector import detect_image


# ==========================================================
# LOAD ENVIRONMENT
# ==========================================================

load_dotenv()


# ==========================================================
# APP SETUP
# ==========================================================

app = Flask(__name__)

CORS(app)

drone = DroneStream()


# ==========================================================
# CONFIG
# ==========================================================

EXPRESS_API_URL = os.getenv(
    "EXPRESS_API_URL",
    "http://localhost:5000",
)

AI_PUBLIC_URL = os.getenv(
    "AI_PUBLIC_URL",
    "http://localhost:8000",
)

VIDEO_SOURCE = os.getenv(
    "VIDEO_SOURCE",
    "0",
)

# Convert webcam source "0" to integer.
# RTMP URL remains a string.
if VIDEO_SOURCE.isdigit():
    VIDEO_SOURCE = int(VIDEO_SOURCE)


# Only these YOLO classes create DNCC issue alerts.
# Covered manholes and patched roads are still detected,
# but they are treated as non-actionable observations.
ALERT_CATEGORIES = {
    "damaged-manhole",
    "pothole",
    "uncovered-manhole",
}


# ==========================================================
# HELPERS
# ==========================================================

def normalize_category(class_name):
    value = str(
        class_name
    ).lower().strip()

    mapping = {
        "covered-manhole":
            "covered-manhole",

        "damaged-manhole":
            "damaged-manhole",

        "patched road":
            "patched-road",

        "patched-road":
            "patched-road",

        "pothole":
            "pothole",

        "uncovered-manhole":
            "uncovered-manhole",
    }

    return mapping.get(
        value,
        "",
    )


def create_title(class_name):
    return (
        str(class_name)
        .replace("-", " ")
        .strip()
        .title()
    )


def validate_coordinates(
    latitude,
    longitude,
):
    try:
        latitude = float(
            latitude
        )

        longitude = float(
            longitude
        )

    except (
        TypeError,
        ValueError,
    ):
        return None, None

    if not (
        -90 <= latitude <= 90
    ):
        return None, None

    if not (
        -180 <= longitude <= 180
    ):
        return None, None

    return (
        latitude,
        longitude,
    )


def get_email_notification(
    backend_data,
):
    """
    Safely normalize the email result
    returned by the Express backend.
    """

    email_data = backend_data.get(
        "emailNotification"
    )

    if not isinstance(
        email_data,
        dict,
    ):
        return {
            "success": False,
            "sent": False,
            "skipped": True,
            "authority": None,
            "recipients": [],
            "messageId": None,
            "message":
                "Email notification result was not returned by the backend.",
        }

    recipients = email_data.get(
        "recipients",
        [],
    )

    if not isinstance(
        recipients,
        list,
    ):
        recipients = []

    return {
        "success":
            bool(
                email_data.get(
                    "success",
                    False,
                )
            ),

        "sent":
            bool(
                email_data.get(
                    "sent",
                    False,
                )
            ),

        "skipped":
            bool(
                email_data.get(
                    "skipped",
                    False,
                )
            ),

        "authority":
            email_data.get(
                "authority"
            ),

        "recipients":
            recipients,

        "messageId":
            email_data.get(
                "messageId"
            ),

        "message":
            email_data.get(
                "message",
                "Email notification status unavailable.",
            ),
    }


# ==========================================================
# HEALTH
# ==========================================================

@app.route(
    "/api/ai/health",
    methods=["GET"],
)
def health():
    return jsonify({
        "success": True,

        "message":
            "AI service is running.",

        "videoSource":
            str(VIDEO_SOURCE),
    })


# ==========================================================
# CONNECT VIDEO SOURCE
# ==========================================================

@app.route(
    "/api/ai/connect",
    methods=["POST"],
)
def connect_drone():
    print(
        "Connecting video source:",
        VIDEO_SOURCE,
    )

    success = drone.connect(
        VIDEO_SOURCE
    )

    if not success:
        return jsonify({
            "success": False,

            "message":
                "Unable to connect video source.",

            "source":
                str(VIDEO_SOURCE),
        }), 500

    return jsonify({
        "success": True,

        "message":
            "Drone stream connected successfully.",

        "source":
            str(VIDEO_SOURCE),
    })


# ==========================================================
# LIVE STREAM
# ==========================================================

def generate_stream():
    while True:
        frame = drone.get_frame()

        if frame is None:
            break

        success, buffer = (
            cv2.imencode(
                ".jpg",
                frame,
            )
        )

        if not success:
            continue

        frame_bytes = (
            buffer.tobytes()
        )

        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n"
            + frame_bytes
            + b"\r\n"
        )


@app.route(
    "/api/ai/live",
    methods=["GET"],
)
def live_stream():
    return Response(
        generate_stream(),

        mimetype=(
            "multipart/x-mixed-replace;"
            " boundary=frame"
        ),
    )


# ==========================================================
# SERVE CAPTURED IMAGES
# ==========================================================

@app.route(
    "/captures/<path:filename>",
    methods=["GET"],
)
def get_capture(filename):
    captures_directory = os.path.join(
        os.getcwd(),
        "captures",
    )

    return send_from_directory(
        captures_directory,
        filename,
    )


# ==========================================================
# ANALYZE UPLOADED IMAGE WITH REAL YOLO MODEL
# ==========================================================

@app.route(
    "/api/ai/analyze-upload",
    methods=["POST"],
)
def analyze_uploaded_image():
    if "image" not in request.files:
        return jsonify({
            "success": False,
            "message": "Image file is required.",
        }), 400

    image_file = request.files["image"]

    if not image_file or not image_file.filename:
        return jsonify({
            "success": False,
            "message": "Please select a valid image.",
        }), 400

    original_name = secure_filename(
        image_file.filename
    )

    extension = os.path.splitext(
        original_name
    )[1].lower()

    allowed_extensions = {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
    }

    if extension not in allowed_extensions:
        return jsonify({
            "success": False,
            "message": "Only JPG, JPEG, PNG, and WebP images are supported.",
        }), 400

    captures_directory = os.path.join(
        os.getcwd(),
        "captures",
    )

    os.makedirs(
        captures_directory,
        exist_ok=True,
    )

    filename = (
        f"upload_{uuid4().hex}"
        f"{extension}"
    )

    image_path = os.path.join(
        captures_directory,
        filename,
    )

    image_file.save(
        image_path
    )

    image = cv2.imread(
        image_path
    )

    if image is None:
        try:
            os.remove(image_path)
        except OSError:
            pass

        return jsonify({
            "success": False,
            "message": "The uploaded image could not be decoded.",
        }), 400

    image_height, image_width = image.shape[:2]

    image_url = (
        f"{AI_PUBLIC_URL}"
        f"/captures/{filename}"
    )

    try:
        detections = detect_image(
            image_path
        )

    except Exception as error:
        print(
            "YOLO upload analysis error:",
            str(error),
        )

        return jsonify({
            "success": False,
            "message": "YOLO analysis failed.",
            "error": str(error),
            "imageUrl": image_url,
            "imageWidth": image_width,
            "imageHeight": image_height,
            "detections": [],
        }), 500

    if not detections:
        return jsonify({
            "success": True,
            "message": "No trained infrastructure class detected.",
            "imageUrl": image_url,
            "imageWidth": image_width,
            "imageHeight": image_height,
            "detections": [],
            "primaryDetection": None,
            "actionable": False,
        })

    primary_detection = max(
        detections,
        key=lambda item:
            item.get(
                "confidence",
                0,
            ),
    )

    class_name = primary_detection.get(
        "class",
        "",
    )

    category = normalize_category(
        class_name
    )

    confidence = float(
        primary_detection.get(
            "confidence",
            0,
        )
    )

    if confidence >= 90:
        severity = "critical"
    elif confidence >= 80:
        severity = "high"
    elif confidence >= 60:
        severity = "medium"
    else:
        severity = "low"

    actionable = (
        category in ALERT_CATEGORIES
    )

    return jsonify({
        "success": True,
        "message": "YOLO analysis completed successfully.",
        "imageUrl": image_url,
        "imageWidth": image_width,
        "imageHeight": image_height,
        "detections": detections,
        "primaryDetection": primary_detection,
        "category": category,
        "title": create_title(class_name),
        "confidence": confidence,
        "severity": severity,
        "actionable": actionable,
    })


# ==========================================================
# CAPTURE + YOLO + CREATE ISSUE
# ==========================================================

@app.route(
    "/api/ai/capture",
    methods=["POST"],
)
def capture_frame():
    data = request.get_json(
        silent=True
    ) or {}

    token = data.get(
        "token"
    )

    zone = data.get(
        "zone"
    )

    latitude = data.get(
        "latitude"
    )

    longitude = data.get(
        "longitude"
    )

    address = data.get(
        "address",
        "Drone surveillance location",
    )

    drone_id = data.get(
        "droneId",
        "DHAKAI-DRONE-TEST-01",
    )


    # ======================================================
    # CAPTURE IMAGE
    # ======================================================

    image_path = (
        drone.capture_image()
    )

    if not image_path:
        return jsonify({
            "success": False,

            "message":
                "Unable to capture image.",

            "issueCreated":
                False,
        }), 500


    filename = os.path.basename(
        image_path
    )

    image_url = (
        f"{AI_PUBLIC_URL}"
        f"/captures/{filename}"
    )


    # ======================================================
    # RUN YOLO
    # ======================================================

    ai_error = None

    try:
        detections = detect_image(
            image_path
        )

    except Exception as error:
        print(
            "YOLO model error:",
            str(error),
        )

        ai_error = str(error)

        return jsonify({
            "success": False,

            "message":
                "YOLO analysis failed.",

            "imagePath":
                image_path,

            "imageUrl":
                image_url,

            "detections":
                [],

            "issueCreated":
                False,

            "aiError":
                ai_error,

            "emailNotification":
                None,
        }), 500


    # ======================================================
    # NO DETECTION
    # ======================================================

    if not detections:
        return jsonify({
            "success": True,

            "message":
                "No infrastructure issue detected.",

            "imagePath":
                image_path,

            "imageUrl":
                image_url,

            "detections":
                [],

            "issueCreated":
                False,

            "actionable":
                False,

            "aiError":
                ai_error,

            "emailNotification":
                None,
        })


    # ======================================================
    # GET HIGHEST CONFIDENCE DETECTION
    # ======================================================

    primary_detection = max(
        detections,

        key=lambda item:
            item.get(
                "confidence",
                0,
            ),
    )

    class_name = (
        primary_detection.get(
            "class",
            "other",
        )
    )

    confidence = float(
        primary_detection.get(
            "confidence",
            0,
        )
    )

    category = normalize_category(
        class_name
    )

    title = create_title(
        class_name
    )


    # ======================================================
    # NON-ACTIONABLE OBSERVATION
    # ======================================================

    if category not in ALERT_CATEGORIES:
        return jsonify({
            "success": True,

            "message":
                f"{title} detected. No DNCC defect alert was created.",

            "imagePath":
                image_path,

            "imageUrl":
                image_url,

            "detections":
                detections,

            "issueCreated":
                False,

            "actionable":
                False,

            "category":
                category,

            "confidence":
                confidence,

            "aiError":
                ai_error,

            "emailNotification":
                None,
        })


    # ======================================================
    # VALIDATE TOKEN
    # ======================================================

    if not token:
        return jsonify({
            "success": True,

            "message":
                "Detection completed, but login token is missing.",

            "imagePath":
                image_path,

            "imageUrl":
                image_url,

            "detections":
                detections,

            "issueCreated":
                False,

            "aiError":
                ai_error,

            "emailNotification":
                None,
        })


    # ======================================================
    # VALIDATE DNCC ZONE
    # ======================================================

    if zone not in (
        "dncc-north",
        "dncc-south",
    ):
        return jsonify({
            "success": True,

            "message":
                "Detection completed, but DNCC zone is invalid.",

            "imagePath":
                image_path,

            "imageUrl":
                image_url,

            "detections":
                detections,

            "issueCreated":
                False,

            "aiError":
                ai_error,

            "emailNotification":
                None,
        })


    # ======================================================
    # VALIDATE GPS
    # ======================================================

    (
        latitude,
        longitude,
    ) = validate_coordinates(
        latitude,
        longitude,
    )

    if (
        latitude is None
        or longitude is None
    ):
        return jsonify({
            "success": True,

            "message":
                "Detection completed, but valid GPS coordinates are required.",

            "imagePath":
                image_path,

            "imageUrl":
                image_url,

            "detections":
                detections,

            "issueCreated":
                False,

            "aiError":
                ai_error,

            "emailNotification":
                None,
        })


    # ======================================================
    # DETERMINE SEVERITY
    # ======================================================

    if confidence >= 90:
        severity = "critical"

    elif confidence >= 80:
        severity = "high"

    elif confidence >= 60:
        severity = "medium"

    else:
        severity = "low"


    # ======================================================
    # EXPRESS / MONGODB PAYLOAD
    # ======================================================

    issue_payload = {
        "title":
            title,

        "description":
            (
                "Infrastructure issue "
                "detected from DhakAI-PAKHI "
                "drone surveillance."
            ),

        "category":
            category,

        "severity":
            severity,

        "zone":
            zone,

        "address":
            address,

        "latitude":
            latitude,

        "longitude":
            longitude,

        "imageUrl":
            image_url,

        "droneId":
            drone_id,

        "aiConfidence":
            confidence,
    }


    # ======================================================
    # CREATE ISSUE IN EXPRESS BACKEND
    # ======================================================

    try:
        backend_response = (
            requests.post(
                (
                    f"{EXPRESS_API_URL}"
                    "/api/issues"
                ),

                json=
                    issue_payload,

                headers={
                    "Authorization":
                        f"Bearer {token}",

                    "Content-Type":
                        "application/json",
                },

                timeout=15,
            )
        )


        # ==================================================
        # PARSE BACKEND JSON
        # ==================================================

        try:
            backend_data = (
                backend_response.json()
            )

        except ValueError:
            backend_data = {}


        # ==================================================
        # BACKEND ERROR
        # ==================================================

        if not backend_response.ok:
            error_message = (
                backend_data.get(
                    "message"
                )
                or
                "AI detection succeeded, "
                "but issue creation failed."
            )

            print(
                "Backend issue creation failed:",
                error_message,
            )

            return jsonify({
                "success": False,

                "message":
                    error_message,

                "imagePath":
                    image_path,

                "imageUrl":
                    image_url,

                "detections":
                    detections,

                "issueCreated":
                    False,

                "aiError":
                    ai_error,

                "emailNotification":
                    backend_data.get(
                        "emailNotification"
                    ),
            }), backend_response.status_code


        # ==================================================
        # ISSUE CREATION RESULT
        # ==================================================

        issue_created = bool(
            backend_data.get(
                "issueCreated",
                True,
            )
        )


        if not issue_created:
            return jsonify({
                "success": False,

                "message":
                    backend_data.get(
                        "message",
                        "Issue was not created.",
                    ),

                "imagePath":
                    image_path,

                "imageUrl":
                    image_url,

                "detections":
                    detections,

                "issueCreated":
                    False,

                "aiError":
                    ai_error,

                "emailNotification":
                    backend_data.get(
                        "emailNotification"
                    ),
            }), 500


        # ==================================================
        # EMAIL RESULT
        # ==================================================

        email_notification = (
            get_email_notification(
                backend_data
            )
        )


        print(
            "ISSUE CREATED:",
            category,
            zone,
            confidence,
        )


        if email_notification.get(
            "sent"
        ):
            print(
                "EMAIL SENT:",
                email_notification.get(
                    "authority"
                ),
            )

        elif email_notification.get(
            "skipped"
        ):
            print(
                "EMAIL SKIPPED:",
                email_notification.get(
                    "message"
                ),
            )

        else:
            print(
                "EMAIL FAILED:",
                email_notification.get(
                    "message"
                ),
            )


        # ==================================================
        # FINAL MESSAGE
        # ==================================================

        if email_notification.get(
            "sent"
        ):
            final_message = (
                "Image captured, analyzed, "
                "issue created, and email "
                "notification sent successfully."
            )

        elif email_notification.get(
            "skipped"
        ):
            final_message = (
                "Image captured, analyzed, "
                "and issue created successfully. "
                "Email notification was skipped."
            )

        else:
            final_message = (
                "Image captured, analyzed, "
                "and issue created successfully, "
                "but email notification failed."
            )


        # ==================================================
        # RETURN TO REACT ADMIN
        # ==================================================

        return jsonify({
            "success": True,

            "message":
                final_message,

            "imagePath":
                image_path,

            "imageUrl":
                image_url,

            "detections":
                detections,

            "aiError":
                ai_error,

            "issueCreated":
                True,

            "actionable":
                True,

            "zone":
                zone,

            "category":
                category,

            "severity":
                severity,

            "confidence":
                confidence,

            "issue":
                backend_data.get(
                    "issue"
                ),

            "emailNotification":
                email_notification,
        })


    # ======================================================
    # EXPRESS TIMEOUT
    # ======================================================

    except requests.Timeout:
        return jsonify({
            "success": False,

            "message":
                "Express backend request timed out.",

            "imagePath":
                image_path,

            "imageUrl":
                image_url,

            "detections":
                detections,

            "issueCreated":
                False,

            "emailNotification":
                None,
        }), 504


    # ======================================================
    # EXPRESS CONNECTION ERROR
    # ======================================================

    except requests.RequestException as error:
        print(
            "Express backend connection error:",
            str(error),
        )

        return jsonify({
            "success": False,

            "message":
                "AI analysis completed, but the Express backend could not be reached.",

            "error":
                str(error),

            "imagePath":
                image_path,

            "imageUrl":
                image_url,

            "detections":
                detections,

            "issueCreated":
                False,

            "emailNotification":
                None,
        }), 500


# ==========================================================
# DISCONNECT
# ==========================================================

@app.route(
    "/api/ai/disconnect",
    methods=["POST"],
)
def disconnect_drone():
    drone.disconnect()

    return jsonify({
        "success": True,

        "message":
            "Video source disconnected.",
    })


# ==========================================================
# RUN
# ==========================================================

if __name__ == "__main__":
    print(
        "======================================"
    )

    print(
        "DhakAI-PAKHI AI Service"
    )

    print(
        f"Video source: {VIDEO_SOURCE}"
    )

    print(
        f"Backend: {EXPRESS_API_URL}"
    )

    print(
        "======================================"
    )

    app.run(
        host="0.0.0.0",
        port=8000,
        debug=True,
    )