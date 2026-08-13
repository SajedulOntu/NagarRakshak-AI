import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Image,
  MapPin,
  RefreshCw,
  Upload,
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
        issue.location?.latitude !== undefined &&
        issue.location?.longitude !== undefined
          ? `${issue.location.latitude}, ${issue.location.longitude}`
          : "Location unavailable"
      ),

    latitude:
      issue.location?.latitude,

    longitude:
      issue.location?.longitude,

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

    assignedTeamId:
      typeof issue.assignedTeam === "object" &&
      issue.assignedTeam !== null
        ? issue.assignedTeam._id
        : issue.assignedTeam || "",

    // Before / detection image
    imageUrl:
      issue.imageUrl || "",

    // After / maintenance proof image
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

function getStatusClass(status) {
  switch (status) {
    case "Assigned":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";

    case "In Progress":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";

    case "Resolved":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    default:
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }
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

export default function Maintenance() {
  const session = getSession();

  const [issues, setIssues] =
    useState([]);

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("active");

  const [
    selectedIssue,
    setSelectedIssue,
  ] = useState(null);

  const [
    proofImage,
    setProofImage,
  ] = useState("");

  const [
    proofFile,
    setProofFile,
  ] = useState(null);

  const [
    proofFileName,
    setProofFileName,
  ] = useState("");

  const [
    completionNote,
    setCompletionNote,
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
    updatingId,
    setUpdatingId,
  ] = useState("");

  const [
    isCompleting,
    setIsCompleting,
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

  function resetCompletionForm() {
    setSelectedIssue(null);

    setProofImage("");
    setProofFile(null);
    setProofFileName("");

    setCompletionNote("");
    setModalMessage("");
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
            "Unable to load maintenance tasks.",
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
          "Maintenance tasks refreshed.",
        );
      }
    } catch (error) {
      console.error(
        "Unable to load maintenance tasks:",
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

  useEffect(() => {
    loadIssues(false);
  }, []);

  const statistics =
    useMemo(() => {
      return {
        assigned:
          issues.filter(
            (issue) =>
              issue.status ===
              "Assigned",
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

        teams:
          new Set(
            issues
              .filter(
                (issue) =>
                  issue.assignedTeam,
              )
              .map(
                (issue) =>
                  issue.assignedTeam,
              ),
          ).size,
      };
    }, [issues]);

  const filteredIssues =
    useMemo(() => {
      if (
        statusFilter ===
        "active"
      ) {
        return issues.filter(
          (issue) =>
            issue.status !==
            "Resolved",
        );
      }

      if (
        statusFilter ===
        "all"
      ) {
        return issues;
      }

      return issues.filter(
        (issue) =>
          issue.status ===
          statusFilter,
      );
    }, [
      issues,
      statusFilter,
    ]);

  const stats = [
    {
      label:
        "Assigned Tasks",
      value:
        statistics.assigned,
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
        "Active Teams",
      value:
        statistics.teams,
      icon:
        Users,
    },
  ];

  async function updateStatus(
    issueId,
    status,
    resolutionNote = "",
    proofImageUrl = "",
  ) {
    const token =
      session?.token;

    if (!token) {
      throw new Error(
        "Authentication token is missing.",
      );
    }

    const response =
      await fetch(
        `${API_BASE_URL}/api/issues/${issueId}/status`,
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
              status,
              resolutionNote,
              proofImage:
                proofImageUrl,
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
          "Unable to update issue status.",
      );
    }

    return data;
  }

  async function handleStartWork(
    issue,
  ) {
    setUpdatingId(
      issue.id,
    );

    try {
      await updateStatus(
        issue.id,
        "in-progress",
      );

      await loadIssues(
        false,
      );

      showMessage(
        `Work started for ${issue.type}.`,
      );
    } catch (error) {
      console.error(
        "Unable to start work:",
        error,
      );

      showMessage(
        error.message ||
          "Unable to start work.",
        "error",
      );
    } finally {
      setUpdatingId("");
    }
  }

  function openCompletionModal(
    issue,
  ) {
    setSelectedIssue(
      issue,
    );

    setProofImage("");
    setProofFile(null);
    setProofFileName("");

    setCompletionNote("");
    setModalMessage("");
  }

  function closeCompletionModal() {
    if (isCompleting) {
      return;
    }

    resetCompletionForm();
  }

  function handleProofUpload(
    event,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type,
      )
    ) {
      setModalMessage(
        "Please upload a JPG, PNG, or WebP image.",
      );

      event.target.value =
        "";

      return;
    }

    const maximumSize =
      5 * 1024 * 1024;

    if (
      file.size >
      maximumSize
    ) {
      setModalMessage(
        "Image must be smaller than 5 MB.",
      );

      event.target.value =
        "";

      return;
    }

    setProofFile(file);

    const reader =
      new FileReader();

    reader.onload = () => {
      setProofImage(
        String(
          reader.result,
        ),
      );

      setProofFileName(
        file.name,
      );

      setModalMessage("");
    };

    reader.onerror = () => {
      setProofFile(null);

      setModalMessage(
        "Unable to read this image.",
      );
    };

    reader.readAsDataURL(
      file,
    );
  }

  async function uploadProofImage() {
    if (!proofFile) {
      throw new Error(
        "Repair proof image is required.",
      );
    }

    const token =
      session?.token;

    if (!token) {
      throw new Error(
        "Authentication token is missing.",
      );
    }

    const formData =
      new FormData();

    formData.append(
      "image",
      proofFile,
    );

    const response =
      await fetch(
        `${API_BASE_URL}/api/uploads/detection`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body: formData,
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
          "Unable to upload repair proof.",
      );
    }

    if (!data.imageUrl) {
      throw new Error(
        "The server did not return the uploaded image URL.",
      );
    }

    return `${API_BASE_URL}${data.imageUrl}`;
  }

  async function handleCompleteTask(
    event,
  ) {
    event.preventDefault();

    if (!selectedIssue) {
      return;
    }

    if (!proofFile) {
      setModalMessage(
        "Upload a repair proof image before completing the task.",
      );

      return;
    }

    if (
      !completionNote.trim()
    ) {
      setModalMessage(
        "Please add a short completion note.",
      );

      return;
    }

    setIsCompleting(true);
    setModalMessage("");

    try {
      const proofUrl =
        await uploadProofImage();

      // Proof image is now
      // stored separately in MongoDB.
      await updateStatus(
        selectedIssue.id,
        "resolved",
        completionNote.trim(),
        proofUrl,
      );

      const completedType =
        selectedIssue.type;

      await loadIssues(
        false,
      );

      resetCompletionForm();

      showMessage(
        `${completedType} was marked as resolved.`,
      );
    } catch (error) {
      console.error(
        "Unable to complete maintenance task:",
        error,
      );

      setModalMessage(
        error.message ||
          "Unable to complete the maintenance task.",
      );
    } finally {
      setIsCompleting(false);
    }
  }

  return (
    <DashboardLayout
      roleName="Maintenance Team"
      color="#7cff6b"
      roleIcon={Wrench}
      stats={stats}
    >
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">

        {/* LEFT SIDE */}

        <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-6">

          <div className="flex flex-wrap items-start justify-between gap-4">

            <div>
              <h2 className="text-xl font-bold">
                Assigned Maintenance Tasks
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Start assigned work,
                complete the repair,
                and submit repair proof.
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
                className="flex items-center gap-2 rounded-xl border border-lime-400/20 bg-lime-400/10 px-4 py-2 text-xs font-semibold text-lime-300 transition hover:bg-lime-400/20 disabled:cursor-not-allowed disabled:opacity-50"
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
                  : "Refresh Tasks"}
              </button>

            </div>
          </div>

          {/* FILTER */}

          <div className="mt-6">
            <label
              htmlFor="maintenance-status-filter"
              className="mb-2 block text-xs uppercase tracking-wide text-gray-500"
            >
              Task status
            </label>

            <select
              id="maintenance-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value,
                )
              }
              className="w-full max-w-sm rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-lime-400/40"
            >
              <option
                value="active"
                className="bg-slate-900"
              >
                Active tasks
              </option>

              <option
                value="Assigned"
                className="bg-slate-900"
              >
                Assigned
              </option>

              <option
                value="In Progress"
                className="bg-slate-900"
              >
                In Progress
              </option>

              <option
                value="Resolved"
                className="bg-slate-900"
              >
                Resolved
              </option>

              <option
                value="all"
                className="bg-slate-900"
              >
                All tasks
              </option>
            </select>
          </div>

          {/* GLOBAL MESSAGE */}

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

          {/* LOADING */}

          {loading &&
          issues.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-10 text-center">

              <RefreshCw
                size={40}
                className="mx-auto animate-spin text-lime-300"
              />

              <p className="mt-4 text-sm text-gray-400">
                Loading maintenance tasks...
              </p>
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-10 text-center">

              <CheckCircle2
                size={42}
                className="mx-auto text-emerald-400"
              />

              <h3 className="mt-4 font-semibold">
                No maintenance tasks found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Issues assigned to this
                maintenance account will
                appear here.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">

              {filteredIssues.map(
                (issue) => (
                  <article
                    key={issue.id}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-white/20 hover:bg-white/[0.04]"
                  >

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                      {/* ISSUE INFORMATION */}

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <span className="max-w-[190px] truncate text-xs font-semibold text-gray-500">
                            {issue.id}
                          </span>

                          <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2.5 py-1 text-[10px] font-semibold text-purple-300">

                            {issue.authority ===
                            "dncc-north"
                              ? "DNCC North"
                              : issue.authority ===
                                  "dncc-south"
                                ? "DNCC South"
                                : "Unknown Zone"}

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

                        {/* BEFORE IMAGE */}

                        {issue.imageUrl && (
                          <div className="mt-4">

                            <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-cyan-300">
                              <Image size={14} />
                              Detection / Before
                            </p>

                            <a
                              href={issue.imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block max-w-sm overflow-hidden rounded-xl border border-cyan-400/20"
                            >
                              <img
                                src={issue.imageUrl}
                                alt={`Detection for ${issue.type}`}
                                className="h-40 w-full object-cover"
                                onError={(event) => {
                                  event.currentTarget.style.display =
                                    "none";
                                }}
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

                            {formatDateTime(
                              issue.detectedAt,
                            )}
                          </span>

                        </div>

                        <p className="mt-3 text-xs font-semibold text-lime-300">
                          Assigned team:{" "}
                          {issue.assignedTeam ||
                            "Maintenance Team"}
                        </p>

                        {/* RESOLUTION DETAILS */}

                        {issue.status ===
                          "Resolved" && (
                          <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">

                            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                              <CheckCircle2
                                size={15}
                              />

                              Repair Completed
                            </div>

                            {issue.resolutionNote && (
                              <div className="mt-3">

                                <p className="text-[10px] uppercase tracking-wide text-gray-500">
                                  Completion Note
                                </p>

                                <p className="mt-1 whitespace-pre-line text-xs leading-5 text-gray-300">
                                  {issue.resolutionNote}
                                </p>

                              </div>
                            )}

                            {issue.resolvedAt && (
                              <p className="mt-3 text-xs text-gray-500">
                                Resolved:{" "}
                                {formatDateTime(
                                  issue.resolvedAt,
                                )}
                              </p>
                            )}

                            {/* AFTER IMAGE */}

                            {issue.proofImage && (
                              <div className="mt-4">

                                <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-300">
                                  <Image
                                    size={14}
                                  />
                                  Repair Proof / After
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
                                    alt={`Repair proof for ${issue.type}`}
                                    className="h-40 w-full object-cover"
                                    onError={(event) => {
                                      event.currentTarget.style.display =
                                        "none";
                                    }}
                                  />
                                </a>

                              </div>
                            )}

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

                        {issue.status ===
                          "Assigned" && (
                          <button
                            type="button"
                            disabled={
                              updatingId ===
                              issue.id
                            }
                            onClick={() =>
                              handleStartWork(
                                issue,
                              )
                            }
                            className="rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {updatingId ===
                            issue.id
                              ? "Starting..."
                              : "Start Work"}
                          </button>
                        )}

                        {issue.status ===
                          "In Progress" && (
                          <button
                            type="button"
                            onClick={() =>
                              openCompletionModal(
                                issue,
                              )
                            }
                            className="rounded-xl bg-lime-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-lime-300"
                          >
                            Complete Task
                          </button>
                        )}

                        {issue.status ===
                          "Resolved" && (
                          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-xs font-semibold text-emerald-300">

                            <CheckCircle2
                              size={15}
                            />

                            Completed
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

        {/* RIGHT SIDE */}

        <div className="space-y-6">

          <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-6">

            <h3 className="text-lg font-bold">
              Task Summary
            </h3>

            <p className="mt-1 text-sm text-gray-400">
              Current maintenance
              workflow status.
            </p>

            <div className="mt-5 space-y-3">

              <div className="flex items-center justify-between rounded-xl border border-blue-400/20 bg-blue-400/10 p-4">

                <span className="text-sm text-blue-200">
                  Waiting to start
                </span>

                <span className="font-bold text-blue-300">
                  {statistics.assigned}
                </span>

              </div>

              <div className="flex items-center justify-between rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-4">

                <span className="text-sm text-cyan-200">
                  Work in progress
                </span>

                <span className="font-bold text-cyan-300">
                  {statistics.inProgress}
                </span>

              </div>

              <div className="flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">

                <span className="text-sm text-emerald-200">
                  Successfully resolved
                </span>

                <span className="font-bold text-emerald-300">
                  {statistics.resolved}
                </span>

              </div>

            </div>

          </section>

          <section className="rounded-3xl border border-lime-400/20 bg-lime-400/5 p-5 sm:p-6">

            <div className="flex items-start gap-3">

              <div className="rounded-xl bg-lime-400/10 p-3 text-lime-300">
                <Upload size={22} />
              </div>

              <div>
                <h3 className="font-bold text-lime-300">
                  Completion Requirements
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-400">
                  Start the assigned task,
                  complete the repair,
                  upload an after-repair
                  proof image, and provide
                  a completion note.
                </p>
              </div>

            </div>

          </section>

          <section className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-5 sm:p-6">

            <h3 className="font-bold text-cyan-300">
              Evidence Workflow
            </h3>

            <div className="mt-4 space-y-3 text-sm text-gray-400">

              <div>
                <span className="font-semibold text-cyan-300">
                  Before:
                </span>{" "}
                Original AI/drone
                detection image
              </div>

              <div>
                <span className="font-semibold text-emerald-300">
                  After:
                </span>{" "}
                Maintenance repair
                proof image
              </div>

            </div>

          </section>

        </div>

      </section>

      {/* COMPLETION MODAL */}

      {selectedIssue && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-[#07101f] p-6 shadow-2xl">

            <div className="flex items-start justify-between gap-4">

              <div>
                <h2 className="text-xl font-bold">
                  Complete Maintenance Task
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
                  closeCompletionModal
                }
                disabled={
                  isCompleting
                }
                className="rounded-xl p-2 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                aria-label="Close completion modal"
              >
                <X size={20} />
              </button>

            </div>

            {/* BEFORE IMAGE */}

            {selectedIssue.imageUrl && (
              <div className="mt-5">

                <p className="mb-2 text-xs font-semibold text-cyan-300">
                  Before Repair
                </p>

                <img
                  src={
                    selectedIssue.imageUrl
                  }
                  alt="Original issue"
                  className="h-44 w-full rounded-2xl border border-cyan-400/20 object-cover"
                />

              </div>
            )}

            <form
              onSubmit={
                handleCompleteTask
              }
              className="mt-6 space-y-5"
            >

              {/* PROOF IMAGE */}

              <div>

                <label
                  htmlFor="repair-proof"
                  className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400"
                >
                  Repair Proof Image
                </label>

                <label
                  htmlFor="repair-proof"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-black/20 p-6 text-center transition hover:border-lime-400/40 hover:bg-lime-400/5"
                >

                  <Upload
                    size={28}
                    className="text-lime-300"
                  />

                  <span className="mt-3 text-sm font-semibold text-gray-200">
                    Select After-Repair Image
                  </span>

                  <span className="mt-1 text-xs text-gray-500">
                    JPG, PNG or WebP —
                    maximum 5 MB
                  </span>

                  <input
                    id="repair-proof"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={
                      handleProofUpload
                    }
                    className="hidden"
                  />

                </label>

                {proofFileName && (
                  <p className="mt-2 text-xs text-lime-300">
                    Selected:{" "}
                    {proofFileName}
                  </p>
                )}

                {proofImage && (
                  <div className="mt-4">

                    <p className="mb-2 text-xs font-semibold text-emerald-300">
                      After Repair Preview
                    </p>

                    <img
                      src={proofImage}
                      alt="Repair proof preview"
                      className="max-h-56 w-full rounded-2xl border border-emerald-400/20 object-cover"
                    />

                  </div>
                )}

              </div>

              {/* NOTE */}

              <div>

                <label
                  htmlFor="completion-note"
                  className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400"
                >
                  Completion Note
                </label>

                <textarea
                  id="completion-note"
                  value={
                    completionNote
                  }
                  onChange={(event) =>
                    setCompletionNote(
                      event.target.value,
                    )
                  }
                  rows={4}
                  maxLength={300}
                  placeholder="Describe the repair work completed..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-lime-400/50"
                />

                <p className="mt-1 text-right text-[10px] text-gray-500">
                  {
                    completionNote.length
                  }
                  /300
                </p>

              </div>

              {modalMessage && (
                <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-300">
                  {modalMessage}
                </div>
              )}

              <div className="flex justify-end gap-3">

                <button
                  type="button"
                  disabled={
                    isCompleting
                  }
                  onClick={
                    closeCompletionModal
                  }
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-white/10 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isCompleting
                  }
                  className="flex items-center gap-2 rounded-xl bg-lime-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {isCompleting ? (
                    <RefreshCw
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <CheckCircle2
                      size={17}
                    />
                  )}

                  {isCompleting
                    ? "Uploading & Completing..."
                    : "Mark Resolved"}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </DashboardLayout>
  );
}