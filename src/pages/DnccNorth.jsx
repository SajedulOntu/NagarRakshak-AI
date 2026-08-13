import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  Image,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Users,
  Wrench,
  X,
} from "lucide-react";

import DashboardLayout from "../component/DashboardLayout.jsx";
import { getSession } from "../utils/auth.js";

const API_BASE_URL = "http://localhost:5000";

function capitalize(value = "") {
  if (!value) {
    return "";
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
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

function normalizeIssue(issue) {
  const assignedTeam =
    typeof issue.assignedTeam === "object" &&
    issue.assignedTeam !== null
      ? issue.assignedTeam.name ||
        issue.assignedTeam.email ||
        "Maintenance Team"
      : issue.assignedTeam || "";

  const assignedTeamId =
    typeof issue.assignedTeam === "object" &&
    issue.assignedTeam !== null
      ? issue.assignedTeam._id
      : issue.assignedTeam || "";

  return {
    id:
      issue._id ||
      issue.id ||
      "Unknown ID",

    authority:
      issue.zone || "",

    type:
      issue.title ||
      capitalize(
        String(
          issue.category || "issue",
        ).replaceAll("-", " "),
      ),

    severity:
      capitalize(
        issue.severity || "medium",
      ),

    status:
      normalizeStatus(issue.status),

    location:
      issue.address ||
      (
        issue.location?.latitude !==
          undefined &&
        issue.location?.longitude !==
          undefined
          ? `${issue.location.latitude}, ${issue.location.longitude}`
          : "Location unavailable"
      ),

    description:
      issue.description || "",

    confidence:
      issue.aiConfidence === null ||
      issue.aiConfidence === undefined
        ? 0
        : Number(issue.aiConfidence),

    detectedAt:
      issue.createdAt ||
      issue.detectedAt,

    assignedAt:
      issue.assignedAt || null,

    assignedTeam,

    assignedTeamId,

    imageUrl:
      issue.imageUrl || "",

    proofImage:
      issue.proofImage || "",

    resolutionNote:
      issue.resolutionNote || "",

    resolvedAt:
      issue.resolvedAt || null,

    droneId:
      issue.droneId || "",
  };
}

function normalizeTeam(team) {
  return {
    id:
      team._id ||
      team.id ||
      "",

    name:
      team.name ||
      "Maintenance Team",

    email:
      team.email || "",

    organization:
      team.organization || "",

    phone:
      team.phone || "",
  };
}

function getSeverityClass(severity) {
  switch (severity) {
    case "Critical":
      return "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-300";

    case "High":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    case "Medium":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";

    default:
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }
}

function getStatusClass(status) {
  switch (status) {
    case "Assigned":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";

    case "In Progress":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";

    case "Resolved":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "Verified":
      return "border-purple-400/20 bg-purple-400/10 text-purple-300";

    case "Rejected":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    default:
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }
}

function formatTime(dateValue) {
  if (!dateValue) {
    return "Unknown";
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Unknown";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(dateValue) {
  if (!dateValue) {
    return "Not available";
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Not available";
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function DnccNorth() {
  const session = getSession();

  const [
    issues,
    setIssues,
  ] = useState([]);

  const [
    maintenanceTeams,
    setMaintenanceTeams,
  ] = useState([]);

  const [
    selectedIssue,
    setSelectedIssue,
  ] = useState(null);

  const [
    selectedTeam,
    setSelectedTeam,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    messageType,
    setMessageType,
  ] = useState("success");

  const [
    modalMessage,
    setModalMessage,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    teamsLoading,
    setTeamsLoading,
  ] = useState(true);

  const [
    assigning,
    setAssigning,
  ] = useState(false);

  function showMessage(
    text,
    type = "success",
  ) {
    setMessage(text);
    setMessageType(type);

    window.setTimeout(() => {
      setMessage("");
    }, 2200);
  }

  async function loadIssues(
    showSuccessMessage = false,
  ) {
    const token =
      session?.token;

    if (!token) {
      setIssues([]);
      setLoading(false);

      showMessage(
        "Authentication token is missing. Please log in again.",
        "error",
      );

      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/api/issues`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to load DNCC North issues.",
        );
      }

      const normalizedIssues =
        Array.isArray(data.issues)
          ? data.issues.map(
              normalizeIssue,
            )
          : [];

      setIssues(
        normalizedIssues,
      );

      if (
        showSuccessMessage
      ) {
        showMessage(
          "North Zone issues refreshed.",
        );
      }
    } catch (error) {
      console.error(
        "Unable to load DNCC North issues:",
        error,
      );

      setIssues([]);

      showMessage(
        error.message ||
          "Unable to connect to the backend.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadMaintenanceTeams() {
    const token =
      session?.token;

    if (!token) {
      setMaintenanceTeams([]);
      setTeamsLoading(false);

      return;
    }

    setTeamsLoading(true);

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/api/issues/maintenance-teams`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to load maintenance teams.",
        );
      }

      const normalizedTeams =
        Array.isArray(data.teams)
          ? data.teams.map(
              normalizeTeam,
            )
          : [];

      setMaintenanceTeams(
        normalizedTeams,
      );
    } catch (error) {
      console.error(
        "Unable to load maintenance teams:",
        error,
      );

      setMaintenanceTeams([]);

      showMessage(
        error.message ||
          "Unable to load maintenance teams.",
        "error",
      );
    } finally {
      setTeamsLoading(false);
    }
  }

  useEffect(() => {
    loadIssues(false);
    loadMaintenanceTeams();
  }, []);

  const statistics =
    useMemo(() => {
      return {
        active:
          issues.filter(
            (issue) =>
              issue.status !==
              "Resolved",
          ).length,

        inProgress:
          issues.filter(
            (issue) =>
              issue.status ===
              "In Progress",
          ).length,

        resolved:
          issues.filter(
            (issue) =>
              issue.status ===
              "Resolved",
          ).length,

        availableTeams:
          maintenanceTeams.length,
      };
    }, [
      issues,
      maintenanceTeams,
    ]);

  // =========================================================
  // NOTIFICATIONS
  // =========================================================

  const notifications =
    useMemo(() => {
      return [...issues]
        .filter(
          (issue) =>
            issue.status !==
              "Resolved" &&
            issue.status !==
              "Rejected",
        )
        .sort(
          (a, b) =>
            new Date(
              b.detectedAt || 0,
            ) -
            new Date(
              a.detectedAt || 0,
            ),
        )
        .slice(0, 6);
    }, [issues]);

  const stats = [
    {
      label:
        "Active Issues",

      value:
        statistics.active,

      icon:
        AlertTriangle,
    },

    {
      label:
        "In Progress",

      value:
        statistics.inProgress,

      icon:
        Wrench,
    },

    {
      label:
        "Resolved",

      value:
        statistics.resolved,

      icon:
        CheckCircle2,
    },

    {
      label:
        "Maintenance Teams",

      value:
        statistics.availableTeams,

      icon:
        Users,
    },
  ];

  function openAssignModal(issue) {
    setSelectedIssue(issue);

    setSelectedTeam(
      issue.assignedTeamId ||
      "",
    );

    setModalMessage("");
  }

  function closeAssignModal() {
    if (assigning) {
      return;
    }

    setSelectedIssue(null);
    setSelectedTeam("");
    setModalMessage("");
  }

  async function handleAssignTeam(
    event,
  ) {
    event.preventDefault();

    if (
      !selectedIssue
    ) {
      return;
    }

    if (
      !selectedTeam
    ) {
      setModalMessage(
        "Please select a maintenance team.",
      );

      return;
    }

    const token =
      session?.token;

    if (!token) {
      setModalMessage(
        "Authentication token is missing.",
      );

      return;
    }

    setAssigning(true);
    setModalMessage("");

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/api/issues/${selectedIssue.id}/assign`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                maintenanceUserId:
                  selectedTeam,
              }),
          },
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to assign maintenance team.",
        );
      }

      const assignedTeam =
        maintenanceTeams.find(
          (team) =>
            team.id ===
            selectedTeam,
        );

      await loadIssues(false);

      setSelectedIssue(null);
      setSelectedTeam("");
      setModalMessage("");

      showMessage(
        `${assignedTeam?.name || "Maintenance team"} assigned successfully.`,
      );
    } catch (error) {
      console.error(
        "Unable to assign maintenance team:",
        error,
      );

      setModalMessage(
        error.message ||
          "Unable to assign the maintenance team.",
      );
    } finally {
      setAssigning(false);
    }
  }

  function getTeamActiveTasks(
    teamId,
  ) {
    return issues.filter(
      (issue) =>
        issue.assignedTeamId ===
          teamId &&
        issue.status !==
          "Resolved",
    ).length;
  }

  return (
    <DashboardLayout
      roleName="DNCC North Authority"
      color="#ffb020"
      roleIcon={ShieldCheck}
      stats={stats}
    >

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">

        {/* =====================================================
            ISSUES
        ====================================================== */}

        <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-6">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>

              <h2 className="text-xl font-bold">
                North Zone Infrastructure Issues
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Review infrastructure alerts and
                assign registered maintenance
                accounts.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <Link
                to="/map"
                className="flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
              >

                <MapPin size={15} />

                Open Live Map

              </Link>

              <button
                type="button"
                onClick={() =>
                  loadIssues(true)
                }
                disabled={loading}
                className="flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              >

                <RefreshCw
                  size={15}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />

                {loading
                  ? "Refreshing..."
                  : "Refresh Issues"}

              </button>

            </div>

          </div>

          {message && (

            <div
              className={`mt-4 rounded-xl border p-3 text-xs ${
                messageType === "error"
                  ? "border-red-400/20 bg-red-400/10 text-red-300"
                  : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              }`}
            >
              {message}
            </div>

          )}

          {loading &&
          issues.length === 0 ? (

            <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-10 text-center">

              <RefreshCw
                size={40}
                className="mx-auto animate-spin text-amber-300"
              />

              <p className="mt-4 text-sm text-gray-400">
                Loading North Zone issues...
              </p>

            </div>

          ) : issues.length === 0 ? (

            <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-10 text-center">

              <CheckCircle2
                size={40}
                className="mx-auto text-emerald-400"
              />

              <h3 className="mt-4 font-semibold">
                No North Zone issues found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                New infrastructure alerts will
                appear here.
              </p>

            </div>

          ) : (

            <div className="mt-6 space-y-4">

              {issues.map(
                (issue) => (

                  <article
                    key={issue.id}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-white/20 hover:bg-white/[0.04]"
                  >

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                      <div className="min-w-0 flex-1">

                        {/* BADGES */}

                        <div className="flex flex-wrap items-center gap-2">

                          <span className="max-w-[190px] truncate text-xs font-semibold text-gray-500">
                            {issue.id}
                          </span>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getSeverityClass(
                              issue.severity,
                            )}`}
                          >
                            {issue.severity}
                          </span>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getStatusClass(
                              issue.status,
                            )}`}
                          >
                            {issue.status}
                          </span>

                        </div>

                        <h3 className="mt-3 text-base font-semibold">
                          {issue.type}
                        </h3>

                        {/* DETECTION IMAGE */}

                        {issue.imageUrl && (

                          <div className="mt-4">

                            <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-cyan-300">

                              <Image size={14} />

                              Detection Image

                            </p>

                            <a
                              href={
                                issue.imageUrl
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="block max-w-sm overflow-hidden rounded-xl border border-cyan-400/20"
                            >

                              <img
                                src={
                                  issue.imageUrl
                                }
                                alt={
                                  issue.type
                                }
                                className="h-40 w-full object-cover"
                              />

                            </a>

                          </div>

                        )}

                        <p className="mt-3 text-sm leading-6 text-gray-400">
                          {issue.description}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-400">

                          <span className="flex items-center gap-1.5">

                            <MapPin size={14} />

                            {issue.location}

                          </span>

                          <span className="flex items-center gap-1.5">

                            <Clock3 size={14} />

                            {formatTime(
                              issue.detectedAt,
                            )}

                          </span>

                        </div>

                        {/* ASSIGNMENT */}

                        {issue.assignedTeam && (

                          <div className="mt-3 rounded-xl border border-blue-400/20 bg-blue-400/10 p-3">

                            <p className="text-xs font-semibold text-blue-300">
                              Assigned Maintenance Team
                            </p>

                            <p className="mt-1 text-xs text-gray-300">
                              {issue.assignedTeam}
                            </p>

                            {issue.assignedAt && (

                              <p className="mt-1 text-[10px] text-gray-500">

                                Assigned:{" "}

                                {formatDateTime(
                                  issue.assignedAt,
                                )}

                              </p>

                            )}

                          </div>

                        )}

                        {/* REPAIR PROOF */}

                        {issue.status ===
                          "Resolved" &&
                          issue.proofImage && (

                          <div className="mt-4">

                            <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-300">

                              <CheckCircle2
                                size={14}
                              />

                              Repair Proof

                            </p>

                            <a
                              href={
                                issue.proofImage
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="block max-w-sm overflow-hidden rounded-xl border border-emerald-400/20"
                            >

                              <img
                                src={
                                  issue.proofImage
                                }
                                alt="Repair proof"
                                className="h-40 w-full object-cover"
                              />

                            </a>

                          </div>

                        )}

                        {issue.resolutionNote && (

                          <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3">

                            <p className="text-xs font-semibold text-emerald-300">
                              Resolution Note
                            </p>

                            <p className="mt-1 text-xs leading-5 text-gray-300">
                              {issue.resolutionNote}
                            </p>

                          </div>

                        )}

                      </div>

                      {/* ACTIONS */}

                      <div className="flex shrink-0 flex-wrap items-center gap-3">

                        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">

                          <p className="text-[10px] uppercase tracking-wide text-gray-500">
                            AI confidence
                          </p>

                          <p className="mt-1 font-bold text-cyan-300">

                            {issue.confidence > 0
                              ? `${issue.confidence}%`
                              : "N/A"}

                          </p>

                        </div>

                        {issue.status !==
                          "Resolved" && (

                          <button
                            type="button"
                            onClick={() =>
                              openAssignModal(
                                issue,
                              )
                            }
                            className="rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-amber-300"
                          >

                            {issue.assignedTeam
                              ? "Change Team"
                              : "Assign Team"}

                          </button>

                        )}

                        {issue.status ===
                          "Resolved" && (

                          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-xs font-semibold text-emerald-300">

                            <CheckCircle2
                              size={15}
                            />

                            Resolved

                          </div>

                        )}

                      </div>

                    </div>

                  </article>

                ),
              )}

            </div>

          )}

        </div>

        {/* =====================================================
            RIGHT SIDE
        ====================================================== */}

        <div className="space-y-6">

          {/* ===================================================
              DETECTION NOTIFICATIONS
          ==================================================== */}

          <section className="rounded-3xl border border-amber-400/20 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-6">

            <div className="flex items-start justify-between gap-3">

              <div>

                <div className="flex items-center gap-2">

                  <Bell
                    size={20}
                    className="text-amber-300"
                  />

                  <h3 className="text-lg font-bold">
                    Detection Notifications
                  </h3>

                </div>

                <p className="mt-1 text-sm text-gray-400">
                  New infrastructure alerts for
                  DNCC North.
                </p>

              </div>

              {notifications.length > 0 && (

                <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">

                  {notifications.length}

                </span>

              )}

            </div>

            {notifications.length === 0 ? (

              <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-6 text-center">

                <Bell
                  size={32}
                  className="mx-auto text-gray-600"
                />

                <p className="mt-3 text-sm text-gray-400">
                  No new detection alerts.
                </p>

              </div>

            ) : (

              <div className="mt-5 space-y-3">

                {notifications.map(
                  (issue) => (

                    <div
                      key={issue.id}
                      className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.05] p-4"
                    >

                      <div className="flex items-start gap-3">

                        {issue.imageUrl ? (

                          <img
                            src={
                              issue.imageUrl
                            }
                            alt={
                              issue.type
                            }
                            className="h-16 w-16 shrink-0 rounded-xl border border-white/10 object-cover"
                          />

                        ) : (

                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20">

                            <Image
                              size={22}
                              className="text-gray-600"
                            />

                          </div>

                        )}

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <span className="rounded-full border border-red-400/20 bg-red-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-red-300">
                              New Detection
                            </span>

                            <span
                              className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${getSeverityClass(
                                issue.severity,
                              )}`}
                            >
                              {issue.severity}
                            </span>

                          </div>

                          <h4 className="mt-2 truncate text-sm font-semibold text-white">
                            {issue.type}
                          </h4>

                          <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-400">

                            <MapPin
                              size={11}
                            />

                            <span className="truncate">
                              {issue.location}
                            </span>

                          </p>

                          <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">

                            <Clock3
                              size={11}
                            />

                            {formatDateTime(
                              issue.detectedAt,
                            )}

                          </p>

                        </div>

                      </div>

                      {/* DETAILS */}

                      <div className="mt-3 grid grid-cols-2 gap-2">

                        <div className="rounded-xl border border-white/10 bg-black/20 p-2">

                          <p className="text-[9px] uppercase tracking-wide text-gray-500">
                            AI Confidence
                          </p>

                          <p className="mt-1 text-xs font-bold text-cyan-300">

                            {issue.confidence > 0
                              ? `${issue.confidence}%`
                              : "N/A"}

                          </p>

                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/20 p-2">

                          <p className="text-[9px] uppercase tracking-wide text-gray-500">
                            Drone
                          </p>

                          <p className="mt-1 truncate text-xs font-semibold text-gray-300">

                            {issue.droneId ||
                              "Not available"}

                          </p>

                        </div>

                      </div>

                      {issue.description && (

                        <p className="mt-3 line-clamp-2 text-xs leading-5 text-gray-400">
                          {
                            issue.description
                          }
                        </p>

                      )}

                      {/* NOTIFICATION ACTIONS */}

                      <div className="mt-3 flex flex-wrap gap-2">

                        {issue.imageUrl && (

                          <a
                            href={
                              issue.imageUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[10px] font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
                          >
                            View Detection
                          </a>

                        )}

                        {issue.status !==
                          "Resolved" && (

                          <button
                            type="button"
                            onClick={() =>
                              openAssignModal(
                                issue,
                              )
                            }
                            className="rounded-xl bg-amber-400 px-3 py-2 text-[10px] font-bold text-slate-950 transition hover:bg-amber-300"
                          >

                            {issue.assignedTeam
                              ? "Change Team"
                              : "Assign Maintenance"}

                          </button>

                        )}

                      </div>

                    </div>

                  ),
                )}

              </div>

            )}

          </section>

          {/* ===================================================
              MAINTENANCE TEAMS
          ==================================================== */}

          <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-6">

            <div className="flex items-start justify-between gap-3">

              <div>

                <h3 className="text-lg font-bold">
                  Maintenance Teams
                </h3>

                <p className="mt-1 text-sm text-gray-400">
                  Registered maintenance
                  accounts available for
                  assignment.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  loadMaintenanceTeams
                }
                disabled={
                  teamsLoading
                }
                className="rounded-xl border border-white/10 p-2 text-gray-400 transition hover:bg-white/10"
              >

                <RefreshCw
                  size={16}
                  className={
                    teamsLoading
                      ? "animate-spin"
                      : ""
                  }
                />

              </button>

            </div>

            {teamsLoading &&
            maintenanceTeams.length ===
              0 ? (

              <div className="mt-5 rounded-xl border border-dashed border-white/10 p-6 text-center">

                <RefreshCw
                  size={25}
                  className="mx-auto animate-spin text-amber-300"
                />

                <p className="mt-3 text-xs text-gray-500">
                  Loading teams...
                </p>

              </div>

            ) : maintenanceTeams.length ===
              0 ? (

              <div className="mt-5 rounded-xl border border-dashed border-white/10 p-6 text-center">

                <Users
                  size={30}
                  className="mx-auto text-gray-600"
                />

                <p className="mt-3 text-sm text-gray-400">
                  No maintenance accounts
                  found.
                </p>

              </div>

            ) : (

              <div className="mt-5 space-y-3">

                {maintenanceTeams.map(
                  (team) => {

                    const activeTasks =
                      getTeamActiveTasks(
                        team.id,
                      );

                    return (

                      <div
                        key={
                          team.id
                        }
                        className="rounded-2xl border border-white/10 bg-black/20 p-4"
                      >

                        <div className="flex items-center justify-between gap-3">

                          <div className="min-w-0">

                            <h4 className="truncate text-sm font-semibold">
                              {team.name}
                            </h4>

                            {team.email && (

                              <p className="mt-1 truncate text-xs text-gray-500">
                                {team.email}
                              </p>

                            )}

                            {team.organization && (

                              <p className="mt-1 truncate text-[10px] text-gray-600">
                                {
                                  team.organization
                                }
                              </p>

                            )}

                          </div>

                          <span
                            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                              activeTasks ===
                              0
                                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                                : "border-amber-400/20 bg-amber-400/10 text-amber-300"
                            }`}
                          >

                            {activeTasks ===
                            0
                              ? "Available"
                              : `${activeTasks} active`}

                          </span>

                        </div>

                      </div>

                    );
                  },
                )}

              </div>

            )}

          </section>

          {/* ===================================================
              HIGH PRIORITY
          ==================================================== */}

          <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-amber-400/10 to-transparent p-5 sm:p-6">

            <div className="flex items-start gap-3">

              <div className="rounded-xl bg-amber-400/15 p-3 text-amber-300">

                <AlertTriangle
                  size={22}
                />

              </div>

              <div>

                <h3 className="font-bold">
                  High-Priority Issues
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-400">

                  {
                    issues.filter(
                      (issue) =>
                        (
                          issue.severity ===
                            "High" ||
                          issue.severity ===
                            "Critical"
                        ) &&
                        issue.status !==
                          "Resolved",
                    ).length
                  }{" "}
                  high-priority issue(s)
                  currently require attention
                  in DNCC North.

                </p>

              </div>

            </div>

          </section>

        </div>

      </section>

      {/* =====================================================
          ASSIGNMENT MODAL
      ====================================================== */}

      {selectedIssue && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#07101f] p-6 shadow-2xl">

            <div className="flex items-start justify-between gap-4">

              <div>

                <h2 className="text-xl font-bold">
                  Assign Maintenance Team
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  {selectedIssue.type}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {selectedIssue.location}
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeAssignModal
                }
                disabled={assigning}
                className="rounded-xl p-2 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                aria-label="Close assignment window"
              >

                <X size={20} />

              </button>

            </div>

            {selectedIssue.imageUrl && (

              <img
                src={
                  selectedIssue.imageUrl
                }
                alt={
                  selectedIssue.type
                }
                className="mt-5 h-40 w-full rounded-2xl border border-white/10 object-cover"
              />

            )}

            <form
              onSubmit={
                handleAssignTeam
              }
              className="mt-6"
            >

              <label
                htmlFor="north-team"
                className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400"
              >
                Select Maintenance Team
              </label>

              <select
                id="north-team"
                value={
                  selectedTeam
                }
                onChange={(event) => {
                  setSelectedTeam(
                    event.target.value,
                  );

                  setModalMessage("");
                }}
                disabled={
                  assigning ||
                  teamsLoading
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/50 disabled:opacity-50"
              >

                <option value="">
                  Choose a maintenance team
                </option>

                {maintenanceTeams.map(
                  (team) => (

                    <option
                      key={
                        team.id
                      }
                      value={
                        team.id
                      }
                      className="bg-slate-900"
                    >

                      {team.name}

                      {team.email
                        ? ` — ${team.email}`
                        : ""}

                    </option>

                  ),
                )}

              </select>

              {maintenanceTeams.length ===
                0 &&
                !teamsLoading && (

                <p className="mt-3 text-xs text-amber-300">
                  Create a Maintenance
                  account first before
                  assigning this issue.
                </p>

              )}

              {modalMessage && (

                <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-300">
                  {modalMessage}
                </div>

              )}

              <div className="mt-6 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={
                    closeAssignModal
                  }
                  disabled={assigning}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-white/10 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    assigning ||
                    !selectedTeam
                  }
                  className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {assigning ? (

                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />

                  ) : (

                    <Users
                      size={16}
                    />

                  )}

                  {assigning
                    ? "Assigning..."
                    : selectedIssue.assignedTeam
                      ? "Change Assignment"
                      : "Confirm Assignment"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </DashboardLayout>
  );
}