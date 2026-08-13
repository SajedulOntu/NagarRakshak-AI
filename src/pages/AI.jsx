import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  Camera,
  CheckCircle2,
  ImagePlus,
  MapPin,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Upload,
  Wrench,
  X,
} from "lucide-react";

import DashboardLayout from "../component/DashboardLayout.jsx";
import { getSession, USER_ROLES } from "../utils/auth.js";

const API_BASE_URL = "http://localhost:5000";
const AI_BASE_URL = "http://localhost:8000";

const LOCATION_COORDINATES = {
  "Uttara Sector 7": { latitude: 23.8748, longitude: 90.4002 },
  "Mirpur 10": { latitude: 23.8069, longitude: 90.3687 },
  "Banani Road 11": { latitude: 23.7936, longitude: 90.4066 },
  Mohakhali: { latitude: 23.7808, longitude: 90.4072 },
  Agargaon: { latitude: 23.7776, longitude: 90.3804 },
  "Dhanmondi 27": { latitude: 23.7566, longitude: 90.3755 },
  Motijheel: { latitude: 23.733, longitude: 90.4172 },
  "Old Dhaka": { latitude: 23.7104, longitude: 90.4074 },
  Jatrabari: { latitude: 23.7102, longitude: 90.4348 },
  Khilgaon: { latitude: 23.7508, longitude: 90.4277 },
};

const MODEL_CATEGORIES = {
  "Covered-Manhole": "covered-manhole",
  "Damaged-Manhole": "damaged-manhole",
  "Patched Road": "patched-road",
  Pothole: "pothole",
  "Uncovered-Manhole": "uncovered-manhole",
};

const ACTIONABLE_CATEGORIES = new Set([
  "damaged-manhole",
  "pothole",
  "uncovered-manhole",
]);

const NORTH_LOCATIONS = [
  "Uttara Sector 7",
  "Mirpur 10",
  "Banani Road 11",
  "Mohakhali",
  "Agargaon",
];

const SOUTH_LOCATIONS = [
  "Dhanmondi 27",
  "Motijheel",
  "Old Dhaka",
  "Jatrabari",
  "Khilgaon",
];

function capitalize(value = "") {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function normalizeStatus(status = "") {
  switch (status) {
    case "assigned":
      return "Assigned";
    case "in-progress":
      return "In Progress";
    case "resolved":
      return "Resolved";
    case "rejected":
      return "Rejected";
    case "detected":
    case "verified":
    default:
      return "Pending";
  }
}

function normalizeIssue(issue) {
  return {
    id: issue._id || issue.id || "Unknown ID",
    authority: issue.zone || "",
    type:
      issue.title ||
      capitalize(String(issue.category || "issue").replaceAll("-", " ")),
    severity: capitalize(issue.severity || "medium"),
    status: normalizeStatus(issue.status),
    location:
      issue.address ||
      (issue.location?.latitude !== undefined &&
      issue.location?.longitude !== undefined
        ? `${issue.location.latitude}, ${issue.location.longitude}`
        : "Location unavailable"),
    description: issue.description || "",
    confidence:
      issue.aiConfidence === null || issue.aiConfidence === undefined
        ? 0
        : Number(issue.aiConfidence),
    latitude: issue.location?.latitude,
    longitude: issue.location?.longitude,
    detectedAt: issue.createdAt || issue.detectedAt,
    assignedTeam:
      typeof issue.assignedTeam === "object" && issue.assignedTeam !== null
        ? issue.assignedTeam.name || issue.assignedTeam.email || ""
        : issue.assignedTeam || "",
    droneId: issue.droneId || "",
  };
}

function getPortalConfig(role) {
  const configurations = {
    [USER_ROLES.SUPER_ADMIN]: {
      roleName: "Super Admin · AI Detection",
      color: "#ff3b5c",
      icon: ShieldCheck,
    },

    [USER_ROLES.DNCC_NORTH]: {
      roleName: "DNCC North · AI Detection",
      color: "#ffb020",
      icon: ShieldCheck,
    },

    [USER_ROLES.DNCC_SOUTH]: {
      roleName: "DNCC South · AI Detection",
      color: "#22d3ee",
      icon: ShieldCheck,
    },

    [USER_ROLES.MAINTENANCE]: {
      roleName: "Maintenance · AI Detection",
      color: "#7cff6b",
      icon: Wrench,
    },
  };

  return (
    configurations[role] ||
    configurations[USER_ROLES.SUPER_ADMIN]
  );
}

function getSeverityFromConfidence(confidence) {
  if (confidence >= 90) return "Critical";
  if (confidence >= 80) return "High";
  if (confidence >= 60) return "Medium";
  return "Low";
}

function getAuthorityFromRole(role, selectedAuthority) {
  if (role === USER_ROLES.DNCC_NORTH) {
    return "dncc-north";
  }

  if (role === USER_ROLES.DNCC_SOUTH) {
    return "dncc-south";
  }

  return selectedAuthority;
}

function getLocationOptions(authority) {
  if (authority === "dncc-north") {
    return NORTH_LOCATIONS;
  }

  return SOUTH_LOCATIONS;
}

function getBoundingBoxStyle(
  detection,
  imageWidth,
  imageHeight,
) {
  const box = detection?.box;

  if (!box || !imageWidth || !imageHeight) {
    return null;
  }

  const x1 = Number(box.x1);
  const y1 = Number(box.y1);
  const x2 = Number(box.x2);
  const y2 = Number(box.y2);

  if (![x1, y1, x2, y2].every(Number.isFinite)) {
    return null;
  }

  const left = (x1 / imageWidth) * 100;
  const top = (y1 / imageHeight) * 100;
  const width = ((x2 - x1) / imageWidth) * 100;
  const height = ((y2 - y1) / imageHeight) * 100;

  return {
    left: `${Math.max(0, left)}%`,
    top: `${Math.max(0, top)}%`,
    width: `${Math.max(0, Math.min(100 - left, width))}%`,
    height: `${Math.max(0, Math.min(100 - top, height))}%`,
  };
}

export default function AI() {
  const session = getSession();
  const portal = getPortalConfig(session?.role);
  const fileInputRef = useRef(null);

  const [issues, setIssues] = useState([]);
  const [imagePreview, setImagePreview] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [selectedAuthority, setSelectedAuthority] = useState(
    session?.role === USER_ROLES.DNCC_SOUTH
      ? "dncc-south"
      : "dncc-north",
  );

  const [selectedLocation, setSelectedLocation] = useState(
    session?.role === USER_ROLES.DNCC_SOUTH
      ? SOUTH_LOCATIONS[0]
      : NORTH_LOCATIONS[0],
  );

  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [isLoadingIssues, setIsLoadingIssues] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const authority = getAuthorityFromRole(
    session?.role,
    selectedAuthority,
  );

  async function loadIssues() {
    const token = session?.token;

    if (!token) {
      setIssues([]);
      setIsLoadingIssues(false);

      showMessage(
        "Your session token is missing. Please log in again.",
        "error",
      );

      return;
    }

    setIsLoadingIssues(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/issues`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load AI detections.",
        );
      }

      setIssues(
        Array.isArray(data.issues)
          ? data.issues.map(normalizeIssue)
          : [],
      );
    } catch (error) {
      console.error("Unable to load AI detections:", error);

      setIssues([]);

      showMessage(
        error.message || "Unable to connect to the backend server.",
        "error",
      );
    } finally {
      setIsLoadingIssues(false);
    }
  }

  useEffect(() => {
    loadIssues();
  }, []);

  const visibleIssues = useMemo(() => {
    if (session?.role === USER_ROLES.DNCC_NORTH) {
      return issues.filter(
        (issue) => issue.authority === "dncc-north",
      );
    }

    if (session?.role === USER_ROLES.DNCC_SOUTH) {
      return issues.filter(
        (issue) => issue.authority === "dncc-south",
      );
    }

    return issues;
  }, [issues, session?.role]);

  const statistics = useMemo(() => {
    return {
      detections: visibleIssues.length,

      highConfidence: visibleIssues.filter(
        (issue) => Number(issue.confidence) >= 90,
      ).length,

      pending: visibleIssues.filter(
        (issue) => issue.status === "Pending",
      ).length,

      resolved: visibleIssues.filter(
        (issue) => issue.status === "Resolved",
      ).length,
    };
  }, [visibleIssues]);

  const stats = [
    {
      label: "AI Detections",
      value: statistics.detections,
      icon: BrainCircuit,
    },
    {
      label: "High Confidence",
      value: statistics.highConfidence,
      icon: Sparkles,
    },
    {
      label: "Pending Review",
      value: statistics.pending,
      icon: AlertTriangle,
    },
    {
      label: "Resolved",
      value: statistics.resolved,
      icon: CheckCircle2,
    },
  ];

  const canSelectAuthority =
    session?.role === USER_ROLES.SUPER_ADMIN ||
    session?.role === USER_ROLES.MAINTENANCE;

  function showMessage(text, type = "success") {
    setMessage(text);
    setMessageType(type);

    window.setTimeout(() => {
      setMessage("");
    }, 2500);
  }

  function handleAuthorityChange(event) {
    const nextAuthority = event.target.value;

    setSelectedAuthority(nextAuthority);
    setSelectedLocation(
      getLocationOptions(nextAuthority)[0],
    );
    setAnalysisResult(null);
  }

  function handleImageUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      showMessage(
        "Please select a valid image file.",
        "error",
      );

      event.target.value = "";
      return;
    }

    const maximumSize = 10 * 1024 * 1024;

    if (file.size > maximumSize) {
      showMessage(
        "Image must be smaller than 10 MB.",
        "error",
      );

      event.target.value = "";
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();

    reader.onload = () => {
      setImagePreview(String(reader.result));
      setFileName(file.name);
      setAnalysisResult(null);
      setMessage("");
    };

    reader.onerror = () => {
      setSelectedFile(null);

      showMessage(
        "Unable to read this image.",
        "error",
      );
    };

    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImagePreview("");
    setFileName("");
    setSelectedFile(null);
    setAnalysisResult(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function analyzeImage() {
    if (!selectedFile) {
      showMessage(
        "Upload an infrastructure image first.",
        "error",
      );

      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const formData = new FormData();

      formData.append(
        "image",
        selectedFile,
      );

      const response = await fetch(
        `${AI_BASE_URL}/api/ai/analyze-upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "YOLO analysis failed.",
        );
      }

      const detections = Array.isArray(data.detections)
        ? data.detections
        : [];

      if (detections.length === 0) {
        setAnalysisResult({
          noDetection: true,
          detections: [],
          imageWidth: Number(data.imageWidth || 0),
          imageHeight: Number(data.imageHeight || 0),
          authority,
          location: selectedLocation,
        });

        showMessage(
          "Analysis completed. No trained class was detected.",
        );

        return;
      }

      const primary =
        data.primaryDetection ||
        [...detections].sort(
          (a, b) =>
            Number(b.confidence || 0) -
            Number(a.confidence || 0),
        )[0];

      const type =
        primary?.class ||
        data.title ||
        "Unknown";

      const category =
        data.category ||
        MODEL_CATEGORIES[type] ||
        "";

      const confidence = Number(
        primary?.confidence ??
          data.confidence ??
          0,
      );

      const actionable =
        typeof data.actionable === "boolean"
          ? data.actionable
          : ACTIONABLE_CATEGORIES.has(category);

      setAnalysisResult({
        noDetection: false,
        type,
        category,
        confidence,
        severity:
          data.severity
            ? capitalize(data.severity)
            : getSeverityFromConfidence(confidence),
        authority,
        location: selectedLocation,
        description: actionable
          ? `The trained YOLO model detected ${type} at ${selectedLocation}. The detection can be added to the DNCC issue workflow after review.`
          : `The trained YOLO model detected ${type} at ${selectedLocation}. This class is treated as a non-actionable road condition and will not create a defect alert.`,
        actionable,
        detections,
        imageWidth: Number(data.imageWidth || 0),
        imageHeight: Number(data.imageHeight || 0),
      });

      showMessage(
        `${type} detected at ${confidence.toFixed(2)}% confidence.`,
      );
    } catch (error) {
      console.error("AI analysis failed:", error);

      showMessage(
        error.message || "Unable to run the trained YOLO model.",
        "error",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function uploadDetectionImage() {
    if (!selectedFile) {
      throw new Error(
        "Please select an image before saving the detection.",
      );
    }

    const token = session?.token;

    if (!token) {
      throw new Error(
        "Authentication token is missing. Please log in again.",
      );
    }

    const formData = new FormData();

    formData.append(
      "image",
      selectedFile,
    );

    const response = await fetch(
      `${API_BASE_URL}/api/uploads/detection`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Image upload failed.",
      );
    }

    if (!data.imageUrl) {
      throw new Error(
        "The server did not return an image URL.",
      );
    }

    return data.imageUrl.startsWith("http")
      ? data.imageUrl
      : `${API_BASE_URL}${data.imageUrl}`;
  }

  async function saveDetection() {
    if (!analysisResult || analysisResult.noDetection) {
      showMessage(
        "Complete an AI detection before saving.",
        "error",
      );

      return;
    }

    if (!analysisResult.actionable) {
      showMessage(
        "This detected class is not configured as an actionable defect.",
        "error",
      );

      return;
    }

    if (!selectedFile) {
      showMessage(
        "The selected image is missing. Please upload it again.",
        "error",
      );

      return;
    }

    if (session?.role === USER_ROLES.MAINTENANCE) {
      showMessage(
        "Maintenance accounts cannot create new detections.",
        "error",
      );

      return;
    }

    const token = session?.token;

    if (!token) {
      showMessage(
        "Your session token is missing. Please log in again.",
        "error",
      );

      return;
    }

    const coordinates =
      LOCATION_COORDINATES[analysisResult.location] ||
      (analysisResult.authority === "dncc-north"
        ? {
            latitude: 23.8103,
            longitude: 90.4125,
          }
        : {
            latitude: 23.7465,
            longitude: 90.376,
          });

    setIsSaving(true);

    try {
      const imageUrl = await uploadDetectionImage();

      const response = await fetch(
        `${API_BASE_URL}/api/issues`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: analysisResult.type,
            description: analysisResult.description,
            category: analysisResult.category,
            severity: analysisResult.severity.toLowerCase(),
            zone: analysisResult.authority,
            address: analysisResult.location,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            droneId: "AI-UPLOAD",
            aiConfidence: analysisResult.confidence,
            imageUrl,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to save the detected issue.",
        );
      }

      await loadIssues();

      const emailText =
        data.emailNotification?.sent
          ? ` Email sent to ${
              data.emailNotification.authority || "DNCC"
            }.`
          : data.emailNotification?.skipped
            ? " Email notification was skipped."
            : data.emailNotification
              ? " Issue saved, but email notification failed."
              : "";

      showMessage(
        `${
          data.issue?._id || "Detection"
        } was added to the issue workflow.${emailText}`,
      );

      clearImage();
    } catch (error) {
      console.error("Unable to save detection:", error);

      showMessage(
        error.message || "Unable to save the detected issue.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function refreshDetections() {
    await loadIssues();
    showMessage("AI detection data refreshed.");
  }

  return (
    <DashboardLayout
      roleName={portal.roleName}
      color={portal.color}
      roleIcon={portal.icon}
      stats={stats}
    >
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  AI Infrastructure Scanner
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  Upload a road image and analyze it with the trained
                  DhakAI-PAKHI YOLO model.
                </p>
              </div>

              <button
                type="button"
                onClick={refreshDetections}
                disabled={isLoadingIssues}
                className="flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: `${portal.color}40`,
                  backgroundColor: `${portal.color}15`,
                  color: portal.color,
                }}
              >
                <RefreshCw
                  size={15}
                  className={
                    isLoadingIssues
                      ? "animate-spin"
                      : ""
                  }
                />

                {isLoadingIssues
                  ? "Refreshing..."
                  : "Refresh Data"}
              </button>
            </div>

            {message && (
              <div
                className={`mt-5 rounded-xl border p-3 text-xs ${
                  messageType === "error"
                    ? "border-red-400/20 bg-red-400/10 text-red-300"
                    : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                }`}
              >
                {message}
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {canSelectAuthority && (
                <div>
                  <label
                    htmlFor="ai-authority"
                    className="mb-2 block text-xs uppercase tracking-wide text-gray-500"
                  >
                    Authority
                  </label>

                  <select
                    id="ai-authority"
                    value={selectedAuthority}
                    onChange={handleAuthorityChange}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
                  >
                    <option
                      value="dncc-north"
                      className="bg-slate-900"
                    >
                      DNCC North
                    </option>

                    <option
                      value="dncc-south"
                      className="bg-slate-900"
                    >
                      DNCC South
                    </option>
                  </select>
                </div>
              )}

              <div>
                <label
                  htmlFor="ai-location"
                  className="mb-2 block text-xs uppercase tracking-wide text-gray-500"
                >
                  Detection location
                </label>

                <select
                  id="ai-location"
                  value={selectedLocation}
                  onChange={(event) => {
                    setSelectedLocation(event.target.value);
                    setAnalysisResult(null);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
                >
                  {getLocationOptions(authority).map(
                    (location) => (
                      <option
                        key={location}
                        value={location}
                        className="bg-slate-900"
                      >
                        {location}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>

            <div className="mt-6">
              {!imagePreview ? (
                <label
                  htmlFor="ai-image"
                  className="flex min-h-80 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-white/20 bg-black/20 p-8 text-center transition hover:border-cyan-400/40 hover:bg-cyan-400/5"
                >
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-cyan-300">
                    <ImagePlus size={34} />
                  </div>

                  <h3 className="mt-5 font-semibold">
                    Upload infrastructure image
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                    Supported classes: Covered Manhole, Damaged Manhole,
                    Patched Road, Pothole, and Uncovered Manhole.
                  </p>

                  <span className="mt-4 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950">
                    Choose Image
                  </span>

                  <p className="mt-3 text-xs text-gray-600">
                    JPG, PNG or WebP — maximum 10 MB
                  </p>

                  <input
                    ref={fileInputRef}
                    id="ai-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black">
                  <div className="relative w-full">
                    <img
                      src={imagePreview}
                      alt="Infrastructure analysis preview"
                      className="block h-auto w-full"
                    />

                    {analysisResult &&
                      !analysisResult.noDetection &&
                      analysisResult.detections.map(
                        (detection, index) => {
                          const style =
                            getBoundingBoxStyle(
                              detection,
                              analysisResult.imageWidth,
                              analysisResult.imageHeight,
                            );

                          if (!style) {
                            return null;
                          }

                          return (
                            <div
                              key={`${detection.class}-${index}`}
                              className="absolute border-2 border-cyan-300 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
                              style={style}
                            >
                              <span className="absolute -top-7 left-0 whitespace-nowrap rounded-md bg-cyan-400 px-2 py-1 text-[9px] font-bold text-slate-950">
                                {detection.class}{" "}
                                {Number(
                                  detection.confidence || 0,
                                ).toFixed(1)}
                                %
                              </span>
                            </div>
                          );
                        },
                      )}
                  </div>

                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute right-4 top-4 z-20 rounded-xl border border-white/10 bg-slate-950/80 p-2 text-gray-300 backdrop-blur transition hover:bg-red-400/20 hover:text-red-300"
                    aria-label="Remove uploaded image"
                  >
                    <X size={18} />
                  </button>

                  <div className="absolute bottom-4 left-4 z-20 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-gray-300 backdrop-blur">
                    {fileName}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={analyzeImage}
              disabled={!selectedFile || isAnalyzing}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw
                    size={18}
                    className="animate-spin"
                  />
                  Running best.pt...
                </>
              ) : (
                <>
                  <ScanSearch size={18} />
                  Run AI Analysis
                </>
              )}
            </button>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-purple-400/20 bg-purple-400/10 p-3 text-purple-300">
                <BrainCircuit size={22} />
              </div>

              <div>
                <h3 className="text-lg font-bold">
                  AI Analysis Result
                </h3>

                <p className="mt-1 text-sm text-gray-400">
                  Real detections returned by your trained model.
                </p>
              </div>
            </div>

            {analysisResult ? (
              analysisResult.noDetection ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-8 text-center">
                  <Camera
                    size={38}
                    className="mx-auto text-gray-600"
                  />

                  <p className="mt-4 text-sm font-semibold text-gray-300">
                    No trained class detected
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    Try another image or a clearer view.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5">
                    <p className="text-xs uppercase tracking-wide text-cyan-300">
                      Primary detection
                    </p>

                    <h4 className="mt-2 text-xl font-bold">
                      {analysisResult.type}
                    </h4>

                    <p className="mt-2 text-xs text-cyan-200/70">
                      {analysisResult.detections.length} object(s) detected
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs text-gray-500">
                        Confidence
                      </p>

                      <p className="mt-2 text-2xl font-bold text-cyan-300">
                        {analysisResult.confidence.toFixed(2)}%
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs text-gray-500">
                        Severity
                      </p>

                      <p className="mt-2 text-lg font-bold text-amber-300">
                        {analysisResult.severity}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`rounded-xl border p-4 ${
                      analysisResult.actionable
                        ? "border-red-400/20 bg-red-400/10"
                        : "border-emerald-400/20 bg-emerald-400/10"
                    }`}
                  >
                    <p className="text-xs text-gray-400">
                      Workflow classification
                    </p>

                    <p
                      className={`mt-2 text-sm font-bold ${
                        analysisResult.actionable
                          ? "text-red-300"
                          : "text-emerald-300"
                      }`}
                    >
                      {analysisResult.actionable
                        ? "Actionable infrastructure defect"
                        : "Non-actionable road condition"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin size={14} />
                      Detection location
                    </p>

                    <p className="mt-2 text-sm font-semibold">
                      {analysisResult.location}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {analysisResult.authority === "dncc-north"
                        ? "DNCC North"
                        : "DNCC South"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs text-gray-500">
                      AI assessment
                    </p>

                    <p className="mt-2 text-sm leading-6 text-gray-300">
                      {analysisResult.description}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      All detections
                    </p>

                    <div className="mt-3 space-y-2">
                      {analysisResult.detections.map(
                        (detection, index) => (
                          <div
                            key={`${detection.class}-result-${index}`}
                            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
                          >
                            <span className="text-xs font-semibold text-gray-300">
                              {detection.class}
                            </span>

                            <span className="text-xs font-bold text-cyan-300">
                              {Number(
                                detection.confidence || 0,
                              ).toFixed(2)}
                              %
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={saveDetection}
                    disabled={
                      isSaving ||
                      !selectedFile ||
                      !analysisResult.actionable ||
                      session?.role === USER_ROLES.MAINTENANCE
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? (
                      <RefreshCw
                        size={18}
                        className="animate-spin"
                      />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}

                    {isSaving
                      ? "Uploading & Saving..."
                      : session?.role === USER_ROLES.MAINTENANCE
                        ? "Authority Account Required"
                        : !analysisResult.actionable
                          ? "No Defect Alert Required"
                          : "Save as New Issue"}
                  </button>
                </div>
              )
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-10 text-center">
                <Camera
                  size={42}
                  className="mx-auto text-gray-600"
                />

                <p className="mt-4 text-sm text-gray-500">
                  Upload and analyze an image to see the real YOLO result.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={22}
                className="mt-0.5 shrink-0 text-emerald-300"
              />

              <div>
                <h3 className="font-bold text-emerald-300">
                  Trained AI Model Active
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-400">
                  Uploaded images are analyzed by your trained best.pt
                  model. Bounding boxes are generated from the actual
                  YOLO coordinates returned by Flask.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 sm:p-6">
            <h3 className="text-lg font-bold">
              Detection Workflow
            </h3>

            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
                <Upload
                  size={18}
                  className="text-cyan-300"
                />

                <span className="text-sm text-gray-300">
                  Upload field image
                </span>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
                <Sparkles
                  size={18}
                  className="text-purple-300"
                />

                <span className="text-sm text-gray-300">
                  Run trained YOLO best.pt analysis
                </span>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
                <CheckCircle2
                  size={18}
                  className="text-emerald-300"
                />

                <span className="text-sm text-gray-300">
                  Review real bounding boxes and confidence
                </span>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
                <CheckCircle2
                  size={18}
                  className="text-emerald-300"
                />

                <span className="text-sm text-gray-300">
                  Save actionable detection to MongoDB and notify DNCC
                </span>
              </div>
            </div>
          </section>
        </div>
      </section>
    </DashboardLayout>
  );
}