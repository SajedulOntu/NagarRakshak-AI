import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock3,
  Cpu,
  Image,
  Loader2,
  MapPin,
  Radio,
  RefreshCw,
  ScanLine,
  Server,
  Shield,
  Users,
  Wrench,
} from "lucide-react";

import DashboardLayout from "../component/DashboardLayout.jsx";
import { getSession } from "../utils/auth.js";

const API_BASE_URL = "http://localhost:5000";
const AI_BASE_URL = "http://127.0.0.1:8000";

/* =========================================================
   DESIGN TOKENS
   Single signature accent (orange) for primary actions / focus,
   a small fixed semantic palette for status + severity, all
   pulled from the app's existing --brand-* CSS variables so the
   page still adapts automatically between light and dark mode.
========================================================= */

const STATUS_COLOR_VAR = {
  Pending: "--brand-yellow",
  Assigned: "--brand-blue",
  "In Progress": "--brand-orange",
  Resolved: "--brand-green",
  Verified: "--brand-purple",
  Rejected: "--brand-red",
};

const SEVERITY_COLOR_VAR = {
  Critical: "--brand-red",
  High: "--brand-orange",
  Medium: "--brand-yellow",
  Low: "--brand-green",
};

function tint(colorVar, { bg = 12, border = 28 } = {}) {
  return {
    color: `var(${colorVar})`,
    backgroundColor: `color-mix(in srgb, var(${colorVar}) ${bg}%, transparent)`,
    borderColor: `color-mix(in srgb, var(${colorVar}) ${border}%, transparent)`,
  };
}

function statusStyle(status) {
  return tint(STATUS_COLOR_VAR[status] || "--brand-yellow");
}

function severityStyle(severity) {
  return tint(SEVERITY_COLOR_VAR[severity] || "--brand-green");
}

/* =========================================================
   HELPERS
========================================================= */

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
    case "verified":
      return "Verified";
    case "rejected":
      return "Rejected";
    case "detected":
    default:
      return "Pending";
  }
}

function resolveImageUrl(url = "") {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }
  if (url.startsWith("/uploads")) {
    return `${API_BASE_URL}${url}`;
  }
  return url;
}

function normalizeIssue(issue) {
  const assignedTeamObject =
    typeof issue.assignedTeam === "object" && issue.assignedTeam !== null
      ? issue.assignedTeam
      : null;

  return {
    id: issue._id || issue.id || "Unknown ID",
    authority: issue.zone || "",
    type:
      issue.title ||
      capitalize(String(issue.category || "issue").replaceAll("-", " ")),
    category: issue.category || "",
    severity: capitalize(issue.severity || "medium"),
    status: normalizeStatus(issue.status),
    location:
      issue.address ||
      (issue.location?.latitude !== undefined &&
      issue.location?.longitude !== undefined
        ? `${issue.location.latitude}, ${issue.location.longitude}`
        : "Location unavailable"),
    latitude: issue.location?.latitude,
    longitude: issue.location?.longitude,
    description: issue.description || "",
    confidence:
      issue.aiConfidence === null || issue.aiConfidence === undefined
        ? 0
        : Number(issue.aiConfidence),
    detectedAt: issue.createdAt || issue.detectedAt,
    assignedAt: issue.assignedAt || null,
    assignedTeam: assignedTeamObject
      ? assignedTeamObject.name || assignedTeamObject.email || "Maintenance Team"
      : issue.assignedTeam || "",
    assignedTeamId: assignedTeamObject
      ? assignedTeamObject._id
      : issue.assignedTeam || "",
    imageUrl: resolveImageUrl(issue.imageUrl || ""),
    proofImage: resolveImageUrl(issue.proofImage || ""),
    resolutionNote: issue.resolutionNote || "",
    resolvedAt: issue.resolvedAt || null,
    droneId: issue.droneId || "",
    reportedBy:
      typeof issue.reportedBy === "object" && issue.reportedBy !== null
        ? issue.reportedBy.name || issue.reportedBy.email || ""
        : "",
  };
}

function normalizeTeam(team) {
  return {
    id: team._id || team.id || "",
    name: team.name || "Maintenance Team",
    email: team.email || "",
    organization: team.organization || "",
    phone: team.phone || "",
  };
}

function formatDateTime(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

/* =========================================================
   SHARED UI PRIMITIVES
========================================================= */

function Eyebrow({ children }) {
  return (
    <p className="font-hud text-[10px] font-semibold uppercase tracking-[0.22em] app-text-muted">
      {children}
    </p>
  );
}

function Badge({ children, style, className = "" }) {
  return (
    <span
      style={style}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function ServiceRow({ label, meta, online }) {
  const dotColor = online ? "--brand-green" : "--brand-red";
  return (
    <div className="app-input flex items-center justify-between rounded-xl border px-3 py-2.5">
      <div>
        <p className="text-xs font-semibold app-text">{label}</p>
        <p className="font-hud mt-0.5 text-[10px] uppercase tracking-wider app-text-muted">
          {meta}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: `var(${dotColor})` }}
        />
        <span
          className="font-hud text-[11px] font-bold"
          style={{ color: `var(${dotColor})` }}
        >
          {online ? "ONLINE" : "OFFLINE"}
        </span>
      </div>
    </div>
  );
}

// Tick-mark "instrument" slider, styled after the reference's
// Altitude-limited / Resolution-px sliders — a row of hairline
// ticks with a filled handle sitting at the current value.
function TickSlider({ label, value, total, colorVar, ticks = 12 }) {
  const percentage = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  const handleTick = Math.round((percentage / 100) * (ticks - 1));

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold app-text-secondary">{label}</span>
        <span className="font-hud text-[11px] font-bold app-text">
          {value} <span className="app-text-muted">/ {total}</span>
        </span>
      </div>

      <div className="app-input mt-2.5 flex h-6 items-center gap-[3px] rounded-lg border px-2">
        {Array.from({ length: ticks }).map((_, index) => {
          const isHandle = index === handleTick;
          return (
            <span
              key={index}
              className="flex-1 rounded-full transition-all"
              style={{
                height: isHandle ? "16px" : "6px",
                backgroundColor: isHandle
                  ? `var(${colorVar})`
                  : "color-mix(in srgb, var(--app-text-muted) 35%, transparent)",
              }}
            />
          );
        })}
      </div>

      <p className="font-hud mt-1 text-right text-[10px] app-text-muted">{percentage}%</p>
    </div>
  );
}

// Circular gauge readout, styled after the reference's compass
// dial ("315 NW") — used for the AI confidence percentage.
function ConfidenceGauge({ value = 0, label = "N/A", colorVar = "--brand-orange", size = 92 }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={6}
          style={{ stroke: "color-mix(in srgb, var(--app-text-muted) 25%, transparent)" }}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ stroke: `var(${colorVar})`, transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-hud text-lg font-black app-text">{label}</span>
        <span className="text-[9px] uppercase tracking-wider app-text-muted">Confidence</span>
      </div>
    </div>
  );
}

function StatPair({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
        style={tint("--brand-orange", { bg: 10, border: 22 })}
      >
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider app-text-muted">{label}</p>
        <p className="font-hud truncate text-sm font-bold app-text">{value}</p>
      </div>
    </div>
  );
}

function OperationTimeline({ events, onClear }) {
  function eventColorVar(type) {
    switch (type) {
      case "success":
        return "--brand-green";
      case "error":
        return "--brand-red";
      case "warning":
        return "--brand-yellow";
      case "detection":
        return "--brand-orange";
      default:
        return "--app-text-muted";
    }
  }

  return (
    <section className="app-card rounded-3xl p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Eyebrow>Live Operation Log</Eyebrow>
          <h3 className="mt-1 text-lg font-bold app-text">Surveillance &amp; AI Events</h3>
        </div>

        {events.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="app-border rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide app-text-secondary transition hover:app-surface-hover"
          >
            Clear
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="app-border mt-5 rounded-2xl border border-dashed p-8 text-center">
          <Radio size={28} className="mx-auto app-text-muted" />
          <p className="mt-3 text-sm app-text-secondary">No operation events yet.</p>
          <p className="mt-1 text-xs app-text-muted">
            Connect the drone or run AI analysis.
          </p>
        </div>
      ) : (
        <div className="mt-5 max-h-[320px] space-y-1 overflow-y-auto pr-2">
          {events.map((event) => {
            const colorVar = eventColorVar(event.type);
            return (
              <div key={event.id} className="app-border relative flex gap-4 border-l py-3 pl-5">
                <span
                  className="absolute -left-[5px] top-[18px] h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: `var(${colorVar})` }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium" style={{ color: `var(${colorVar})` }}>
                    {event.message}
                  </p>
                  <p className="font-hud mt-1 text-[11px] app-text-muted">
                    {event.time.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* =========================================================
   ADMIN
========================================================= */

export default function Admin() {
  const session = getSession();

  const [issues, setIssues] = useState([]);
  const [maintenanceTeams, setMaintenanceTeams] = useState([]);
  const [authorityFilter, setAuthorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [cameraConnected, setCameraConnected] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [captureLoading, setCaptureLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [operationEvents, setOperationEvents] = useState([]);

  const [aiOnline, setAiOnline] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [databaseOnline, setDatabaseOnline] = useState(false);
  const [systemChecking, setSystemChecking] = useState(false);

  // Temporary routing data — later: drone GPS -> automatic DNCC boundary detection
  const [detectionZone, setDetectionZone] = useState("dncc-north");
  const [detectionLatitude, setDetectionLatitude] = useState("23.8103");
  const [detectionLongitude, setDetectionLongitude] = useState("90.4125");
  const [detectionAddress, setDetectionAddress] = useState(
    "Dhaka test surveillance location",
  );
  const [droneId, setDroneId] = useState("DHAKAI-DRONE-TEST-01");

  function showMessage(text, type = "success") {
    setMessage(text);
    setMessageType(type);
    window.setTimeout(() => setMessage(""), 3000);
  }

  function addOperationEvent(eventMessage, type = "info") {
    const event = {
      id: `${Date.now()}-${Math.random()}`,
      message: eventMessage,
      type,
      time: new Date(),
    };
    setOperationEvents((current) => [event, ...current].slice(0, 12));
  }

  async function checkSystemHealth(showSuccessMessage = false) {
    setSystemChecking(true);
    let backendIsOnline = false;
    let aiIsOnline = false;

    try {
      try {
        const backendResponse = await fetch(`${API_BASE_URL}/api/health`);
        const backendData = await backendResponse.json();
        backendIsOnline = backendResponse.ok && backendData.success === true;
        setBackendOnline(backendIsOnline);
        // The current Express server connects to MongoDB before it starts
        // listening, so a healthy backend means the startup DB connection succeeded.
        setDatabaseOnline(backendIsOnline);
      } catch (error) {
        console.error("Backend health check failed:", error);
        setBackendOnline(false);
        setDatabaseOnline(false);
      }

      try {
        const aiResponse = await fetch(`${AI_BASE_URL}/api/ai/health`);
        const aiData = await aiResponse.json();
        aiIsOnline = aiResponse.ok && aiData.success === true;
        setAiOnline(aiIsOnline);
      } catch (error) {
        console.error("AI health check failed:", error);
        setAiOnline(false);
      }

      if (showSuccessMessage) {
        if (backendIsOnline && aiIsOnline) {
          showMessage("Core systems are online.");
        } else {
          showMessage(
            "One or more services are offline. Check the command center status.",
            "error",
          );
        }
      }
    } finally {
      setSystemChecking(false);
    }
  }

  async function connectCamera() {
    setCameraLoading(true);
    setCameraError("");
    setAiResult(null);

    try {
      const response = await fetch(`${AI_BASE_URL}/api/ai/connect`, { method: "POST" });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to connect to camera.");
      }

      setCameraConnected(true);
      addOperationEvent("Drone video source connected.", "success");
      showMessage("Drone camera connected.");
    } catch (error) {
      console.error("Camera connection error:", error);
      setCameraConnected(false);
      addOperationEvent("Unable to connect drone video source.", "error");
      setCameraError(error.message || "Unable to connect to the Python AI service.");
    } finally {
      setCameraLoading(false);
    }
  }

  async function disconnectCamera() {
    try {
      await fetch(`${AI_BASE_URL}/api/ai/disconnect`, { method: "POST" });
    } catch (error) {
      console.error("Unable to disconnect camera:", error);
    }

    setCameraConnected(false);
    addOperationEvent("Drone video source disconnected.", "warning");
    setAiResult(null);
    setCameraError("");
    showMessage("Drone camera disconnected.");
  }

  async function captureAndAnalyze() {
    if (!cameraConnected) {
      setCameraError("Connect the camera first.");
      return;
    }

    const token = session?.token;
    if (!token) {
      setCameraError("Authentication token is missing. Please log in again.");
      return;
    }

    if (detectionZone !== "dncc-north" && detectionZone !== "dncc-south") {
      setCameraError("Select a valid DNCC authority.");
      return;
    }

    const latitude = Number(detectionLatitude);
    const longitude = Number(detectionLongitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setCameraError("Enter valid latitude and longitude.");
      return;
    }

    setCaptureLoading(true);
    setCameraError("");
    setAiResult(null);
    addOperationEvent("Frame capture and AI analysis started.");

    try {
      const response = await fetch(`${AI_BASE_URL}/api/ai/capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          zone: detectionZone,
          latitude,
          longitude,
          address: detectionAddress.trim() || "Drone surveillance location",
          droneId: droneId.trim() || "DHAKAI-DRONE-TEST-01",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to capture and analyze image.");
      }

      setAiResult(data);
      addOperationEvent("Camera frame captured successfully.", "success");

      if (data.detections?.length > 0) {
        const primaryDetection = data.detections[0];
        const detectionLabel = String(primaryDetection.class || "issue")
          .replaceAll("-", " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());

        addOperationEvent(
          `${detectionLabel} detected — ${primaryDetection.confidence}% confidence.`,
          "detection",
        );
      }

      if (data.issueCreated) {
        addOperationEvent("Infrastructure issue saved to MongoDB.", "success");
        const authorityName = detectionZone === "dncc-north" ? "DNCC North" : "DNCC South";
        addOperationEvent(`Issue routed to ${authorityName}.`, "success");

        await loadIssues(false);
        showMessage(`Detection saved and sent to ${authorityName}.`);
        return;
      }

      if (data.detections?.length > 0) {
        addOperationEvent("Detection completed, but the issue was not saved.", "warning");
        showMessage(
          data.message || "Detection completed, but the issue was not created.",
          "error",
        );
        return;
      }

      addOperationEvent("Analysis completed — no infrastructure issue detected.", "warning");
      showMessage(data.message || "Frame analyzed. No infrastructure issue detected.");
    } catch (error) {
      console.error("Capture error:", error);
      addOperationEvent(error.message || "Capture and AI analysis failed.", "error");
      setCameraError(error.message || "Unable to capture and analyze the frame.");
    } finally {
      setCaptureLoading(false);
    }
  }

  async function loadIssues(showSuccessMessage = false) {
    const token = session?.token;

    if (!token) {
      setIssues([]);
      setLoading(false);
      showMessage("Authentication token is missing. Please log in again.", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/issues`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load issues.");
      }

      const normalized = Array.isArray(data.issues) ? data.issues.map(normalizeIssue) : [];
      setIssues(normalized);

      if (showSuccessMessage) {
        showMessage("Dashboard data refreshed.");
      }
    } catch (error) {
      console.error("Unable to load admin issues:", error);
      setIssues([]);
      showMessage(error.message || "Unable to connect to the backend.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadMaintenanceTeams() {
    const token = session?.token;

    if (!token) {
      setMaintenanceTeams([]);
      setTeamsLoading(false);
      return;
    }

    setTeamsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/issues/maintenance-teams`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load maintenance teams.");
      }

      const normalized = Array.isArray(data.teams) ? data.teams.map(normalizeTeam) : [];
      setMaintenanceTeams(normalized);
    } catch (error) {
      console.error("Unable to load maintenance teams:", error);
      setMaintenanceTeams([]);
    } finally {
      setTeamsLoading(false);
    }
  }

  async function refreshDashboard() {
    await Promise.all([loadIssues(false), loadMaintenanceTeams()]);
    showMessage("Dashboard data refreshed.");
  }

  useEffect(() => {
    loadIssues(false);
    loadMaintenanceTeams();
    checkSystemHealth(false);
  }, []);

  const statistics = useMemo(() => {
    return {
      total: issues.length,
      active: issues.filter((i) => i.status !== "Resolved" && i.status !== "Rejected").length,
      pending: issues.filter((i) => i.status === "Pending").length,
      assigned: issues.filter((i) => i.status === "Assigned").length,
      inProgress: issues.filter((i) => i.status === "In Progress").length,
      resolved: issues.filter((i) => i.status === "Resolved").length,
      north: issues.filter((i) => i.authority === "dncc-north").length,
      south: issues.filter((i) => i.authority === "dncc-south").length,
      highSeverity: issues.filter(
        (i) => (i.severity === "High" || i.severity === "Critical") && i.status !== "Resolved",
      ).length,
      assignedTeams: new Set(
        issues.filter((i) => i.assignedTeamId).map((i) => i.assignedTeamId),
      ).size,
    };
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchesAuthority = authorityFilter === "all" || issue.authority === authorityFilter;
      const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
      return matchesAuthority && matchesStatus;
    });
  }, [issues, authorityFilter, statusFilter]);

  const stats = [
    { label: "Total Issues", value: statistics.total, icon: AlertTriangle },
    { label: "Active Issues", value: statistics.active, icon: Wrench },
    { label: "In Progress", value: statistics.inProgress, icon: Clock3 },
    { label: "Resolved", value: statistics.resolved, icon: CheckCircle2 },
  ];

  function getTeamActiveTasks(teamId) {
    return issues.filter(
      (issue) =>
        issue.assignedTeamId === teamId &&
        issue.status !== "Resolved" &&
        issue.status !== "Rejected",
    ).length;
  }

  const latestDetection = aiResult?.detections?.length > 0 ? aiResult.detections[0] : null;

  const latestDetectionName = latestDetection?.class
    ? String(latestDetection.class)
        .replaceAll("-", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "No Detection";

  const latestConfidence =
    latestDetection?.confidence !== undefined && latestDetection?.confidence !== null
      ? `${latestDetection.confidence}%`
      : "N/A";

  const totalAiDetections = issues.filter((issue) => Number(issue.confidence) > 0).length;

  const coreOnline = backendOnline && aiOnline;

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <DashboardLayout roleName="Super Admin" color="var(--brand-orange)" roleIcon={Shield} stats={stats}>
      {/* =====================================================
          OPERATIONS DECK
      ====================================================== */}
      <section className="mb-7 overflow-hidden rounded-[28px] app-card">
        {/* TOP BAR */}
        <div className="app-border flex flex-col gap-4 border-b px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
              style={tint("--brand-orange", { bg: 12, border: 25 })}
            >
              <Activity size={20} />
            </div>
            <div className="min-w-0">
              <p
                className="font-hud text-[11px] font-bold uppercase tracking-[0.22em]"
                style={{ color: "var(--brand-orange)" }}
              >
                DhakAI · PAKHI Ops
              </p>
              <h2 className="font-display truncate text-xl font-bold tracking-tight app-text">
                Urban Infrastructure Operations
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="app-input hidden items-center gap-2 rounded-xl border px-3 py-2 text-xs app-text-secondary md:flex">
              <MapPin size={13} />
              <span className="max-w-[220px] truncate">
                {detectionAddress || "Location not set"}
              </span>
            </div>

            <span
              className="flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{
                backgroundColor: cameraConnected
                  ? "color-mix(in srgb, var(--brand-red) 12%, transparent)"
                  : "var(--app-input)",
                borderColor: cameraConnected
                  ? "color-mix(in srgb, var(--brand-red) 25%, transparent)"
                  : "var(--app-border)",
                color: cameraConnected ? "var(--brand-red)" : "var(--app-text-muted)",
              }}
            >
              <span
                className={`h-2 w-2 rounded-full ${cameraConnected ? "animate-pulse" : ""}`}
                style={{
                  backgroundColor: cameraConnected ? "var(--brand-red)" : "var(--app-text-muted)",
                }}
              />
              {cameraConnected ? "Feed Live" : "Feed Offline"}
            </span>

            <button
              type="button"
              onClick={() => checkSystemHealth(true)}
              disabled={systemChecking}
              className="app-input flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold app-text-secondary transition hover:app-surface-hover disabled:opacity-50"
            >
              <RefreshCw size={13} className={systemChecking ? "animate-spin" : ""} />
              Systems
            </button>

            <span
              className="flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={tint(coreOnline ? "--brand-green" : "--brand-red")}
            >
              <span
                className="h-2 w-2 rounded-full animate-pulse"
                style={{ backgroundColor: `var(${coreOnline ? "--brand-green" : "--brand-red"})` }}
              />
              {coreOnline ? "Core Online" : "Check Systems"}
            </span>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-[1.65fr_0.72fr]">
          {/* SURVEILLANCE PANEL */}
          <div className="media-surface overflow-hidden rounded-[22px] border app-border">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    cameraConnected ? "animate-pulse bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)]" : "bg-gray-600"
                  }`}
                />
                <div>
                  <p className="text-xs font-bold text-white">Live Drone Surveillance</p>
                  <p className="font-hud mt-0.5 text-[10px] uppercase tracking-[0.15em] text-gray-500">
                    DJI Mini 4K · Operator-Guided Monitoring
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="font-hud rounded-lg border px-2.5 py-1.5 text-[11px] font-bold"
                  style={tint("--brand-orange")}
                >
                  best.pt
                </span>
                <span
                  className="rounded-lg border px-2.5 py-1.5 text-[11px] font-bold"
                  style={
                    cameraConnected
                      ? tint("--brand-green")
                      : { color: "#8793a6", backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }
                  }
                >
                  {cameraConnected ? "LIVE" : "OFFLINE"}
                </span>
              </div>
            </div>

            <div className="relative aspect-[16/9] min-h-[420px] bg-[#03060b]">
              {cameraConnected ? (
                <>
                  <img
                    src={`${AI_BASE_URL}/api/ai/live`}
                    alt="Live DJI Mini 4K surveillance feed"
                    className="absolute inset-0 h-full w-full object-contain"
                  />

                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-4 top-4 rounded-xl border border-white/10 bg-black/60 px-3 py-2 backdrop-blur">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500">Drone ID</p>
                      <p className="font-hud mt-1 text-xs font-bold text-white">
                        {droneId || "DHAKAI-DRONE"}
                      </p>
                    </div>

                    <div className="absolute right-4 top-4 rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-right backdrop-blur">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500">Routing Zone</p>
                      <p
                        className="font-hud mt-1 text-xs font-bold"
                        style={{ color: "var(--brand-orange)" }}
                      >
                        {detectionZone === "dncc-north" ? "DNCC North" : "DNCC South"}
                      </p>
                    </div>

                    <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-end justify-between gap-3">
                      <div className="rounded-xl border border-white/10 bg-black/65 px-3 py-2 backdrop-blur">
                        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500">
                          <MapPin size={10} />
                          Current Surveillance Area
                        </p>
                        <p className="mt-1 max-w-[260px] truncate text-xs font-bold text-white">
                          {detectionAddress || "Location not set"}
                        </p>
                      </div>

                      <div
                        className="rounded-xl border px-4 py-2.5 backdrop-blur"
                        style={tint("--brand-orange", { bg: 16, border: 30 })}
                      >
                        <p className="text-[10px] uppercase tracking-wider opacity-80">AI Analysis Mode</p>
                        <p className="mt-1 text-xs font-black">Manual Capture + YOLO Analysis</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full min-h-[420px] items-center justify-center p-8">
                  <div className="max-w-md text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.035]">
                      <Radio size={34} className="text-gray-600" />
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-gray-300">
                      Drone Stream Not Connected
                    </h3>
                    <p className="mx-auto mt-2 text-sm leading-6 text-gray-500">
                      Start the DJI Fly RTMP stream through MediaMTX, then connect the
                      drone feed from the control panel.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* PRIMARY ACTION BAR */}
            <div className="flex flex-col gap-3 border-t border-white/10 p-4 sm:flex-row">
              {!cameraConnected ? (
                <button
                  type="button"
                  onClick={connectCamera}
                  disabled={cameraLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-black text-slate-950 transition hover:brightness-110 disabled:opacity-40"
                  style={{ backgroundColor: "var(--brand-green)" }}
                >
                  {cameraLoading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                  {cameraLoading ? "Connecting..." : "Connect Drone Feed"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={disconnectCamera}
                  className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition hover:brightness-125"
                  style={tint("--brand-red")}
                >
                  <Camera size={16} />
                  Disconnect
                </button>
              )}

              <button
                type="button"
                onClick={captureAndAnalyze}
                disabled={!cameraConnected || captureLoading}
                className="flex flex-[1.3] items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-black text-slate-950 shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
                style={{ backgroundColor: "var(--brand-orange)" }}
              >
                {captureLoading ? <Loader2 size={16} className="animate-spin" /> : <ScanLine size={16} />}
                {captureLoading ? "Running best.pt..." : "Capture Frame & Analyze"}
              </button>
            </div>
          </div>

          {/* RIGHT STATUS COLUMN */}
          <div className="grid gap-4">
            {/* SYSTEM HEALTH */}
            <div className="app-card rounded-[20px] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Eyebrow>Connected Services</Eyebrow>
                  <p className="mt-1 text-sm font-bold app-text">Platform Status</p>
                </div>
                <Server size={17} style={{ color: "var(--brand-orange)" }} />
              </div>

              <div className="mt-4 space-y-3">
                <ServiceRow label="AI Service" meta="Flask + YOLO" online={aiOnline} />
                <ServiceRow label="Backend API" meta="Express" online={backendOnline} />
                <ServiceRow label="MongoDB" meta="Database" online={databaseOnline} />
                <ServiceRow label="Drone Feed" meta="RTMP / MediaMTX" online={cameraConnected} />
              </div>
            </div>

            {/* MISSION STATUS */}
            <div className="app-card rounded-[20px] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Eyebrow>Live Workflow Overview</Eyebrow>
                  <p className="mt-1 text-sm font-bold app-text">Issue Resolution Status</p>
                </div>
                <Activity size={17} style={{ color: "var(--brand-green)" }} />
              </div>

              <div className="mt-4 space-y-5">
                <TickSlider
                  label="Pending Review"
                  value={statistics.pending}
                  total={statistics.total}
                  colorVar="--brand-yellow"
                />
                <TickSlider
                  label="In Progress"
                  value={statistics.inProgress}
                  total={statistics.total}
                  colorVar="--brand-orange"
                />
                <TickSlider
                  label="Resolved"
                  value={statistics.resolved}
                  total={statistics.total}
                  colorVar="--brand-green"
                />
              </div>
            </div>

            {/* LATEST DETECTION — signature instrument readout */}
            <div className="app-card overflow-hidden rounded-[20px] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Eyebrow>Captured Frame</Eyebrow>
                  <p className="mt-1 text-sm font-bold app-text">Latest Detection</p>
                </div>
                <ScanLine size={17} style={{ color: "var(--brand-purple)" }} />
              </div>

              <div className="app-input mt-4 flex items-center gap-4 rounded-xl border p-4">
                <ConfidenceGauge
                  value={latestDetection?.confidence ?? 0}
                  label={latestDetection ? latestConfidence : "N/A"}
                  colorVar={latestDetection ? "--brand-orange" : "--app-text-muted"}
                />

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider app-text-muted">Detected Issue</p>
                  <p
                    className="font-display truncate text-sm font-bold"
                    style={{ color: latestDetection ? "var(--brand-orange)" : "var(--app-text-muted)" }}
                  >
                    {latestDetectionName}
                  </p>

                  <p className="mt-3 text-[10px] uppercase tracking-wider app-text-muted">Model</p>
                  <p className="font-hud mt-1 text-xs font-bold" style={{ color: "var(--brand-purple)" }}>
                    best.pt
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ANALYTICS — unified stat strip */}
        <div className="app-border grid grid-cols-1 gap-4 border-t p-4 md:grid-cols-3">
          <div className="app-card rounded-[20px] p-4">
            <div className="flex items-center justify-between">
              <Eyebrow>DNCC Issue Distribution</Eyebrow>
              <MapPin size={15} style={{ color: "var(--brand-orange)" }} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <StatPair icon={MapPin} label="DNCC North" value={statistics.north} />
              <StatPair icon={MapPin} label="DNCC South" value={statistics.south} />
            </div>
          </div>

          <div className="app-card rounded-[20px] p-4">
            <div className="flex items-center justify-between">
              <Eyebrow>AI Detection Summary</Eyebrow>
              <AlertTriangle size={15} style={{ color: "var(--brand-yellow)" }} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <StatPair icon={Cpu} label="AI Detected" value={totalAiDetections} />
              <StatPair icon={AlertTriangle} label="High / Critical" value={statistics.highSeverity} />
            </div>
          </div>

          <div className="app-card rounded-[20px] p-4">
            <div className="flex items-center justify-between">
              <Eyebrow>Maintenance Response</Eyebrow>
              <Users size={15} style={{ color: "var(--brand-green)" }} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <StatPair icon={Wrench} label="Active Issues" value={statistics.active} />
              <StatPair icon={Users} label="Assigned Teams" value={statistics.assignedTeams} />
            </div>
          </div>
        </div>

        {/* WORKFLOW RIBBON — real sequence, numbering kept intentionally */}
        <div className="app-border grid grid-cols-2 border-t sm:grid-cols-5">
          {[
            ["01", "Monitor", cameraConnected ? "Live" : "Waiting"],
            ["02", "Observe", "Operator"],
            ["03", "Capture", "Manual"],
            ["04", "Analyze", "best.pt"],
            ["05", "Route", "DNCC"],
          ].map(([step, title, state], index) => (
            <div key={step} className={`p-4 ${index < 4 ? "app-border border-r" : ""}`}>
              <p className="font-hud text-xs app-text-muted">{step}</p>
              <p className="mt-1 text-xs font-bold app-text">{title}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider app-text-muted">{state}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================
          CAPTURE ROUTING + AI RESULT
      ====================================================== */}
      <section className="app-card mb-6 overflow-hidden rounded-3xl p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Radio size={20} style={{ color: cameraConnected ? "var(--brand-green)" : "var(--app-text-muted)" }} className={cameraConnected ? "animate-pulse" : ""} />
          <div>
            <h2 className="text-xl font-bold app-text">Capture &amp; Analysis Workspace</h2>
            <p className="mt-1 text-sm app-text-secondary">
              Attach routing details to the frame the operator is about to analyze, then
              review the YOLO result below before it enters the municipal workflow.
            </p>
          </div>
        </div>

        {cameraError && (
          <div
            className="mt-4 flex items-center gap-2 rounded-xl border p-3 text-xs"
            style={tint("--brand-red")}
          >
            <AlertTriangle size={15} />
            {cameraError}
          </div>
        )}

        {/* ROUTING PANEL */}
        <div className="app-input mt-5 rounded-2xl border p-4">
          <div className="flex items-center gap-2">
            <MapPin size={16} style={{ color: "var(--brand-orange)" }} />
            <h3 className="text-sm font-semibold app-text">Captured Frame Routing</h3>
          </div>
          <p className="mt-1 text-xs app-text-muted">
            Live drone GPS can replace these manual fields in a future version.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label htmlFor="detection-zone" className="mb-2 block text-[11px] uppercase tracking-wide app-text-muted">
                Authority
              </label>
              <select
                id="detection-zone"
                value={detectionZone}
                onChange={(event) => setDetectionZone(event.target.value)}
                className="app-input w-full rounded-xl border px-3 py-2.5 text-xs app-text outline-none focus:border-[var(--brand-orange)]"
              >
                <option value="dncc-north">DNCC North</option>
                <option value="dncc-south">DNCC South</option>
              </select>
            </div>

            <div>
              <label htmlFor="detection-latitude" className="mb-2 block text-[11px] uppercase tracking-wide app-text-muted">
                Latitude
              </label>
              <input
                id="detection-latitude"
                type="number"
                step="any"
                value={detectionLatitude}
                onChange={(event) => setDetectionLatitude(event.target.value)}
                className="app-input w-full rounded-xl border px-3 py-2.5 text-xs app-text outline-none focus:border-[var(--brand-orange)]"
              />
            </div>

            <div>
              <label htmlFor="detection-longitude" className="mb-2 block text-[11px] uppercase tracking-wide app-text-muted">
                Longitude
              </label>
              <input
                id="detection-longitude"
                type="number"
                step="any"
                value={detectionLongitude}
                onChange={(event) => setDetectionLongitude(event.target.value)}
                className="app-input w-full rounded-xl border px-3 py-2.5 text-xs app-text outline-none focus:border-[var(--brand-orange)]"
              />
            </div>

            <div>
              <label htmlFor="detection-address" className="mb-2 block text-[11px] uppercase tracking-wide app-text-muted">
                Location
              </label>
              <input
                id="detection-address"
                type="text"
                value={detectionAddress}
                onChange={(event) => setDetectionAddress(event.target.value)}
                placeholder="Mirpur, Dhaka"
                className="app-input w-full rounded-xl border px-3 py-2.5 text-xs app-text outline-none focus:border-[var(--brand-orange)]"
              />
            </div>

            <div>
              <label htmlFor="drone-id" className="mb-2 block text-[11px] uppercase tracking-wide app-text-muted">
                Drone ID
              </label>
              <input
                id="drone-id"
                type="text"
                value={droneId}
                onChange={(event) => setDroneId(event.target.value)}
                className="app-input w-full rounded-xl border px-3 py-2.5 text-xs app-text outline-none focus:border-[var(--brand-orange)]"
              />
            </div>
          </div>
        </div>

        {/* CAPTURED FRAME + AI RESULT */}
        <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
          <div className="media-surface overflow-hidden rounded-2xl border app-border">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${cameraConnected ? "animate-pulse bg-red-500" : "bg-gray-600"}`}
                />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                  {aiResult?.imageUrl ? "Captured Frame" : "Capture Preview"}
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-gray-500">Operator Review</span>
            </div>

            <div className="relative flex aspect-video items-center justify-center">
              {aiResult?.imageUrl ? (
                <div className="relative h-full w-full">
                  <img
                    src={aiResult.imageUrl}
                    alt="Captured frame analyzed by YOLO"
                    className="h-full w-full object-contain"
                  />
                  <div
                    className="absolute left-4 top-4 rounded-lg border px-3 py-2 backdrop-blur"
                    style={{ backgroundColor: "rgba(0,0,0,0.7)", borderColor: "color-mix(in srgb, var(--brand-orange) 25%, transparent)" }}
                  >
                    <p className="font-hud text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--brand-orange)" }}>
                      Captured for AI analysis
                    </p>
                  </div>
                </div>
              ) : (
                <div className="max-w-sm px-6 text-center">
                  <Image size={40} className="mx-auto text-gray-600" />
                  <p className="mt-4 text-sm font-semibold text-gray-400">No frame captured yet</p>
                  <p className="mt-2 text-xs leading-5 text-gray-500">
                    Use the capture button above to send the exact frame you want best.pt
                    to analyze.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* AI ANALYSIS */}
          <div className="app-card rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <ScanLine size={18} style={{ color: "var(--brand-orange)" }} />
              <h3 className="font-semibold app-text">YOLO Detection Result</h3>
            </div>

            {!aiResult ? (
              <div className="mt-8 text-center">
                <ScanLine size={38} className="mx-auto app-text-muted" />
                <p className="mt-3 text-sm app-text-secondary">Waiting for a captured frame.</p>
                <p className="mt-1 text-xs app-text-muted">
                  The result will appear here after the operator captures a frame and
                  runs best.pt.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {aiResult.issueCreated && (
                  <div className="rounded-xl border p-4" style={tint("--brand-green")}>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      <p className="text-sm font-semibold">Issue Successfully Routed</p>
                    </div>
                    <p className="mt-2 text-xs app-text-secondary">
                      Sent to{" "}
                      <span className="font-semibold app-text">
                        {detectionZone === "dncc-north" ? "DNCC North" : "DNCC South"}
                      </span>
                    </p>
                    <p className="mt-1 text-xs app-text-muted">
                      MongoDB record created. Authority notification and email alert are
                      triggered by the backend.
                    </p>
                  </div>
                )}

                <div className="rounded-xl border p-3" style={tint("--brand-green")}>
                  <p className="text-xs font-semibold">Capture Successful</p>
                  {aiResult.imagePath && (
                    <p className="mt-1 break-all text-xs app-text-muted">{aiResult.imagePath}</p>
                  )}
                </div>

                {aiResult.imageUrl && (
                  <a
                    href={aiResult.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="app-border block overflow-hidden rounded-xl border"
                  >
                    <img src={aiResult.imageUrl} alt="Captured detection" className="h-40 w-full object-cover" />
                  </a>
                )}

                {aiResult.detections?.length > 0 ? (
                  <div className="space-y-3">
                    {aiResult.detections.map((detection, index) => (
                      <div
                        key={`${detection.class}-${index}`}
                        className="rounded-xl border p-4"
                        style={tint("--brand-orange")}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-wide app-text-muted">Detected Issue</p>
                            <p className="mt-1 font-semibold capitalize">
                              {String(detection.class).replaceAll("-", " ")}
                            </p>
                            {detection.temporary && (
                              <p className="mt-1 text-[10px] uppercase tracking-wide" style={{ color: "var(--brand-yellow)" }}>
                                Temporary Test Detection
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] uppercase app-text-muted">Confidence</p>
                            <p className="font-hud mt-1 font-bold app-text">{detection.confidence}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border p-4" style={tint("--brand-yellow")}>
                    <p className="text-sm font-semibold">No Detection</p>
                    <p className="mt-1 text-xs leading-5 app-text-secondary">
                      The frame was captured, but no infrastructure issue was detected.
                    </p>
                  </div>
                )}

                {aiResult.usingTestDetection && (
                  <div className="rounded-xl border p-3" style={tint("--brand-yellow")}>
                    <p className="text-xs font-semibold">Test Detection Mode</p>
                    <p className="mt-1 text-xs leading-5 app-text-secondary">
                      Your trained best.pt model is not connected yet. Temporary
                      detection is being used to test the complete workflow.
                    </p>
                  </div>
                )}

                {aiResult.aiError && (
                  <div className="rounded-xl border p-3" style={tint("--brand-yellow")}>
                    <p className="text-xs font-semibold">YOLO Model Not Ready</p>
                    <p className="mt-1 text-xs leading-5 app-text-secondary">
                      Add the trained models/best.pt file when it becomes available.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mb-6">
        <OperationTimeline events={operationEvents} onClear={() => setOperationEvents([])} />
      </div>

      {/* GLOBAL MESSAGE */}
      {message && (
        <div
          className="mb-6 rounded-xl border p-3 text-xs"
          style={tint(messageType === "error" ? "--brand-red" : "--brand-green")}
        >
          {message}
        </div>
      )}

      {/* =====================================================
          MAIN ADMIN GRID
      ====================================================== */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">
        {/* CITYWIDE ISSUES */}
        <div className="app-card rounded-3xl p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold app-text">Citywide Infrastructure Issues</h2>
              <p className="mt-1 text-sm app-text-secondary">
                Monitor DNCC North and DNCC South infrastructure activity from MongoDB.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/map"
                className="flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition hover:brightness-110"
                style={tint("--brand-blue")}
              >
                <MapPin size={15} />
                Open Live Map
              </Link>

              <button
                type="button"
                onClick={refreshDashboard}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                style={tint("--brand-orange")}
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                {loading ? "Refreshing..." : "Refresh Data"}
              </button>
            </div>
          </div>

          {/* FILTERS */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="authority-filter" className="mb-2 block text-[11px] uppercase tracking-wide app-text-muted">
                Authority
              </label>
              <select
                id="authority-filter"
                value={authorityFilter}
                onChange={(event) => setAuthorityFilter(event.target.value)}
                className="app-input w-full rounded-xl border px-4 py-3 text-sm app-text outline-none focus:border-[var(--brand-orange)]"
              >
                <option value="all">All Authorities</option>
                <option value="dncc-north">DNCC North</option>
                <option value="dncc-south">DNCC South</option>
              </select>
            </div>

            <div>
              <label htmlFor="status-filter" className="mb-2 block text-[11px] uppercase tracking-wide app-text-muted">
                Status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="app-input w-full rounded-xl border px-4 py-3 text-sm app-text outline-none focus:border-[var(--brand-orange)]"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Verified">Verified</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* ISSUE LIST */}
          {loading && issues.length === 0 ? (
            <div className="app-border mt-6 rounded-2xl border border-dashed p-10 text-center">
              <RefreshCw size={36} className="mx-auto animate-spin" style={{ color: "var(--brand-orange)" }} />
              <p className="mt-4 text-sm app-text-secondary">Loading citywide issues...</p>
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="app-border mt-6 rounded-2xl border border-dashed p-10 text-center">
              <AlertTriangle size={38} className="mx-auto app-text-muted" />
              <h3 className="mt-4 font-semibold app-text">No Matching Issues</h3>
              <p className="mt-2 text-sm app-text-secondary">Change the authority or status filter.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredIssues.map((issue) => (
                <article key={issue.id} className="app-card-soft app-border rounded-2xl border p-4 transition hover:app-surface-hover">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      {/* BADGES */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-hud max-w-[190px] truncate text-xs app-text-muted">{issue.id}</span>

                        <Badge style={tint(issue.authority === "dncc-north" ? "--brand-yellow" : "--brand-blue")}>
                          {issue.authority === "dncc-north"
                            ? "DNCC North"
                            : issue.authority === "dncc-south"
                              ? "DNCC South"
                              : "Unknown"}
                        </Badge>

                        <Badge style={severityStyle(issue.severity)}>{issue.severity}</Badge>
                        <Badge style={statusStyle(issue.status)}>{issue.status}</Badge>
                      </div>

                      <h3 className="mt-3 text-base font-semibold app-text">{issue.type}</h3>

                      {issue.imageUrl && (
                        <div className="mt-4">
                          <p className="mb-2 flex items-center gap-2 text-xs font-semibold" style={{ color: "var(--brand-orange)" }}>
                            <Image size={14} />
                            Detection / Before
                          </p>
                          <a
                            href={issue.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block max-w-sm overflow-hidden rounded-xl border"
                            style={{ borderColor: "color-mix(in srgb, var(--brand-orange) 25%, transparent)" }}
                          >
                            <img src={issue.imageUrl} alt={issue.type} className="h-40 w-full object-cover" />
                          </a>
                        </div>
                      )}

                      <p className="mt-3 text-sm leading-6 app-text-secondary">{issue.description}</p>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs app-text-secondary">
                        <span className="flex items-center gap-1.5">
                          <MapPin size={14} />
                          {issue.location}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock3 size={14} />
                          {formatDateTime(issue.detectedAt)}
                        </span>
                      </div>

                      {issue.droneId && (
                        <p className="mt-2 text-xs app-text-muted">
                          Drone: <span style={{ color: "var(--brand-orange)" }}>{issue.droneId}</span>
                        </p>
                      )}

                      {issue.reportedBy && (
                        <p className="mt-1 text-xs app-text-muted">
                          Reported by: <span className="app-text-secondary">{issue.reportedBy}</span>
                        </p>
                      )}

                      {issue.assignedTeam && (
                        <div className="mt-4 rounded-xl border p-3" style={tint("--brand-blue")}>
                          <p className="text-xs font-semibold">Assigned Maintenance</p>
                          <p className="mt-1 text-xs app-text-secondary">{issue.assignedTeam}</p>
                          {issue.assignedAt && (
                            <p className="mt-1 text-xs app-text-muted">
                              Assigned: {formatDateTime(issue.assignedAt)}
                            </p>
                          )}
                        </div>
                      )}

                      {issue.status === "Resolved" && (
                        <div className="mt-4 rounded-2xl border p-4" style={tint("--brand-green", { bg: 8 })}>
                          <div className="flex items-center gap-2 text-xs font-semibold">
                            <CheckCircle2 size={15} />
                            Maintenance Completed
                          </div>

                          {issue.resolutionNote && (
                            <div className="mt-3">
                              <p className="text-[11px] uppercase tracking-wide app-text-muted">Resolution Note</p>
                              <p className="mt-1 whitespace-pre-line text-xs leading-5 app-text-secondary">
                                {issue.resolutionNote}
                              </p>
                            </div>
                          )}

                          {issue.resolvedAt && (
                            <p className="mt-3 text-xs app-text-muted">
                              Resolved: {formatDateTime(issue.resolvedAt)}
                            </p>
                          )}

                          {issue.proofImage && (
                            <div className="mt-4">
                              <p className="mb-2 flex items-center gap-2 text-xs font-semibold">
                                <Image size={14} />
                                Repair Proof / After
                              </p>
                              <a
                                href={issue.proofImage}
                                target="_blank"
                                rel="noreferrer"
                                className="block max-w-sm overflow-hidden rounded-xl border"
                                style={{ borderColor: "color-mix(in srgb, var(--brand-green) 25%, transparent)" }}
                              >
                                <img
                                  src={issue.proofImage}
                                  alt={`Repair proof for ${issue.type}`}
                                  className="h-40 w-full object-cover"
                                />
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* CONFIDENCE */}
                    <div className="app-input shrink-0 rounded-xl border px-4 py-3 text-center">
                      <p className="text-[10px] uppercase tracking-wide app-text-muted">AI Confidence</p>
                      <p className="font-hud mt-1 text-lg font-bold" style={{ color: "var(--brand-orange)" }}>
                        {issue.confidence > 0 ? `${issue.confidence}%` : "N/A"}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">
          {/* AUTHORITY OVERVIEW */}
          <section className="app-card rounded-3xl p-5 sm:p-6">
            <h3 className="text-lg font-bold app-text">Authority Overview</h3>
            <p className="mt-1 text-sm app-text-secondary">Distribution of infrastructure issues.</p>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border p-4" style={tint("--brand-yellow")}>
                <p className="text-[11px] uppercase tracking-wide">DNCC North</p>
                <p className="font-hud mt-2 text-3xl font-bold app-text">{statistics.north}</p>
                <p className="mt-1 text-xs app-text-secondary">Registered issues</p>
              </div>

              <div className="rounded-2xl border p-4" style={tint("--brand-blue")}>
                <p className="text-[11px] uppercase tracking-wide">DNCC South</p>
                <p className="font-hud mt-2 text-3xl font-bold app-text">{statistics.south}</p>
                <p className="mt-1 text-xs app-text-secondary">Registered issues</p>
              </div>
            </div>
          </section>

          {/* WORKFLOW SUMMARY */}
          <section className="app-card rounded-3xl p-5 sm:p-6">
            <h3 className="text-lg font-bold app-text">Workflow Summary</h3>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-xl border p-4" style={tint("--brand-yellow")}>
                <span className="text-sm">Pending</span>
                <span className="font-hud font-bold">{statistics.pending}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border p-4" style={tint("--brand-blue")}>
                <span className="text-sm">Assigned</span>
                <span className="font-hud font-bold">{statistics.assigned}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border p-4" style={tint("--brand-orange")}>
                <span className="text-sm">In Progress</span>
                <span className="font-hud font-bold">{statistics.inProgress}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border p-4" style={tint("--brand-green")}>
                <span className="text-sm">Resolved</span>
                <span className="font-hud font-bold">{statistics.resolved}</span>
              </div>
            </div>
          </section>

          {/* OPERATIONAL SUMMARY */}
          <section className="app-card rounded-3xl p-5 sm:p-6">
            <h3 className="text-lg font-bold app-text">Operational Summary</h3>

            <div className="mt-5 space-y-3">
              <div className="app-input flex items-center justify-between rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={20} style={{ color: "var(--brand-red)" }} />
                  <span className="text-sm app-text-secondary">High-priority issues</span>
                </div>
                <span className="font-hud font-bold" style={{ color: "var(--brand-red)" }}>
                  {statistics.highSeverity}
                </span>
              </div>

              <div className="app-input flex items-center justify-between rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <Users size={20} style={{ color: "var(--brand-blue)" }} />
                  <span className="text-sm app-text-secondary">Active assigned teams</span>
                </div>
                <span className="font-hud font-bold" style={{ color: "var(--brand-blue)" }}>
                  {statistics.assignedTeams}
                </span>
              </div>

              <div className="app-input flex items-center justify-between rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={20} style={{ color: "var(--brand-green)" }} />
                  <span className="text-sm app-text-secondary">Resolved issues</span>
                </div>
                <span className="font-hud font-bold" style={{ color: "var(--brand-green)" }}>
                  {statistics.resolved}
                </span>
              </div>
            </div>
          </section>

          {/* MAINTENANCE ACCOUNTS */}
          <section className="app-card rounded-3xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold app-text">Maintenance Accounts</h3>
                <p className="mt-1 text-sm app-text-secondary">
                  Registered maintenance users and current workload.
                </p>
              </div>

              <button
                type="button"
                onClick={loadMaintenanceTeams}
                disabled={teamsLoading}
                className="app-border rounded-xl border p-2 app-text-secondary transition hover:app-surface-hover disabled:opacity-50"
              >
                <RefreshCw size={16} className={teamsLoading ? "animate-spin" : ""} />
              </button>
            </div>

            {teamsLoading && maintenanceTeams.length === 0 ? (
              <div className="app-border mt-5 rounded-xl border border-dashed p-6 text-center">
                <RefreshCw size={24} className="mx-auto animate-spin" style={{ color: "var(--brand-orange)" }} />
                <p className="mt-3 text-xs app-text-secondary">Loading accounts...</p>
              </div>
            ) : maintenanceTeams.length === 0 ? (
              <div className="app-border mt-5 rounded-xl border border-dashed p-6 text-center">
                <Users size={28} className="mx-auto app-text-muted" />
                <p className="mt-3 text-sm app-text-secondary">No maintenance accounts registered.</p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {maintenanceTeams.map((team) => {
                  const activeTasks = getTeamActiveTasks(team.id);
                  return (
                    <div key={team.id} className="app-input rounded-2xl border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-semibold app-text">{team.name}</h4>
                          {team.email && (
                            <p className="mt-1 truncate text-xs app-text-muted">{team.email}</p>
                          )}
                          {team.organization && (
                            <p className="mt-1 truncate text-xs app-text-muted">{team.organization}</p>
                          )}
                        </div>

                        <Badge
                          className="shrink-0"
                          style={tint(activeTasks === 0 ? "--brand-green" : "--brand-orange")}
                        >
                          {activeTasks === 0 ? "Available" : `${activeTasks} active`}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </section>
    </DashboardLayout>
  );
}
