import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Map as MapIcon,
  MapPin,
  Navigation,
  Radio,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import DashboardLayout from "../component/DashboardLayout.jsx";
import { getSession, USER_ROLES } from "../utils/auth.js";

const DHAKA_CENTER = [23.8103, 90.4125];

const API_BASE_URL = "http://localhost:5000";

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
  const latitude = issue.location?.latitude;
  const longitude = issue.location?.longitude;

  const assignedTeam =
    typeof issue.assignedTeam === "object" && issue.assignedTeam !== null
      ? issue.assignedTeam.name || issue.assignedTeam.email || ""
      : issue.assignedTeam || "";

  return {
    id: issue._id || issue.id || "Unknown ID",
    type:
      issue.title ||
      capitalize(String(issue.category || "issue").replaceAll("-", " ")),
    description: issue.description || "",
    severity: capitalize(issue.severity || "medium"),
    status: normalizeStatus(issue.status),
    authority: issue.zone || "",
    location:
      issue.address ||
      (latitude !== undefined && longitude !== undefined
        ? `${latitude}, ${longitude}`
        : "Location unavailable"),
    latitude,
    longitude,
    confidence:
      issue.aiConfidence === null || issue.aiConfidence === undefined
        ? 0
        : Number(issue.aiConfidence),
    assignedTeam,
    detectedAt: issue.createdAt || issue.detectedAt,
    droneId: issue.droneId || "",
    category: issue.category || "",
    imageUrl: issue.imageUrl || "",
  };
}

function getMarkerColor(issue) {
  if (issue.status === "Resolved") {
    return "#34d399";
  }

  if (issue.severity === "Critical") {
    return "#d946ef";
  }

  if (issue.severity === "High") {
    return "#fb7185";
  }

  if (issue.severity === "Medium") {
    return "#fbbf24";
  }

  return "#22d3ee";
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
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
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

    default:
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }
}

function formatCoordinate(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "N/A";
  }

  return numericValue.toFixed(5);
}

function formatDateTime(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}


function isValidCoordinate(issue) {
  const latitude = Number(issue.latitude);
  const longitude = Number(issue.longitude);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function MapController({
  issues,
  selectedIssue,
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedIssue && isValidCoordinate(selectedIssue)) {
      map.flyTo(
        [
          Number(selectedIssue.latitude),
          Number(selectedIssue.longitude),
        ],
        15,
        {
          duration: 0.8,
        },
      );

      return;
    }

    if (issues.length === 0) {
      map.setView(DHAKA_CENTER, 11);
      return;
    }

    const bounds = issues
      .filter(isValidCoordinate)
      .map((issue) => [
        Number(issue.latitude),
        Number(issue.longitude),
      ]);

    if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, {
        padding: [45, 45],
        maxZoom: 14,
      });
    }
  }, [issues, selectedIssue, map]);

  return null;
}

export default function Map() {
  const session = getSession();

  const portalConfig = {
    [USER_ROLES.SUPER_ADMIN]: {
      roleName: "Super Admin",
      color: "#ff3b5c",
    },

    [USER_ROLES.DNCC_NORTH]: {
      roleName: "DNCC North Authority",
      color: "#ffb020",
    },

    [USER_ROLES.DNCC_SOUTH]: {
      roleName: "DNCC South Authority",
      color: "#22d3ee",
    },

    [USER_ROLES.MAINTENANCE]: {
      roleName: "Maintenance Team",
      color: "#7cff6b",
    },
  };

  const currentPortal =
    portalConfig[session?.role] ||
    portalConfig[USER_ROLES.SUPER_ADMIN];

  const [issues, setIssues] = useState([]);
  const [selectedIssueId, setSelectedIssueId] = useState("");
  const [authorityFilter, setAuthorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [refreshMessage, setRefreshMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const markerRefs = useRef({});

  async function loadIssues() {
    const token = session?.token;

    if (!token) {
      setIssues([]);
      setErrorMessage(
        "Your login session does not contain an authentication token. Please log in again.",
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/issues`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load map issues.");
      }

      const normalizedIssues = Array.isArray(data.issues)
        ? data.issues.map(normalizeIssue)
        : [];

      setIssues(normalizedIssues);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Unable to load map issues:", error);

      setIssues([]);
      setErrorMessage(
        error.message || "Unable to connect to the backend server.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIssues();
  }, []);

  useEffect(() => {
    if (!autoRefresh) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      loadIssues();
    }, 20000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoRefresh]);

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

  const filteredIssues = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return visibleIssues.filter((issue) => {
      const matchesAuthority =
        authorityFilter === "all" ||
        issue.authority === authorityFilter;

      const matchesStatus =
        statusFilter === "all" ||
        issue.status === statusFilter;

      const matchesSearch =
        !query ||
        String(issue.id || "")
          .toLowerCase()
          .includes(query) ||
        String(issue.type || "")
          .toLowerCase()
          .includes(query) ||
        String(issue.location || "")
          .toLowerCase()
          .includes(query);

      return (
        matchesAuthority &&
        matchesStatus &&
        matchesSearch &&
        isValidCoordinate(issue)
      );
    });
  }, [
    visibleIssues,
    authorityFilter,
    statusFilter,
    searchText,
  ]);

  const selectedIssue =
    filteredIssues.find(
      (issue) => issue.id === selectedIssueId,
    ) ||
    filteredIssues[0] ||
    null;

  useEffect(() => {
    if (
      selectedIssue &&
      selectedIssue.id !== selectedIssueId
    ) {
      setSelectedIssueId(selectedIssue.id);
    }
  }, [selectedIssue, selectedIssueId]);

  useEffect(() => {
    if (!selectedIssue) {
      return;
    }

    const marker = markerRefs.current[selectedIssue.id];

    if (marker) {
      marker.openPopup();
    }
  }, [selectedIssue]);

  const statistics = useMemo(() => {
    const mapped = visibleIssues.filter(isValidCoordinate);

    return {
      total: mapped.length,

      critical: mapped.filter(
        (issue) =>
          issue.severity === "Critical" &&
          issue.status !== "Resolved",
      ).length,

      highPriority: mapped.filter(
        (issue) =>
          (issue.severity === "Critical" ||
            issue.severity === "High") &&
          issue.status !== "Resolved",
      ).length,

      resolved: mapped.filter(
        (issue) => issue.status === "Resolved",
      ).length,
    };
  }, [visibleIssues]);

  const stats = [
    {
      label: "Mapped Issues",
      value: statistics.total,
      icon: MapPin,
    },
    {
      label: "Critical Active",
      value: statistics.critical,
      icon: AlertTriangle,
    },
    {
      label: "High Priority",
      value: statistics.highPriority,
      icon: Navigation,
    },
    {
      label: "Resolved",
      value: statistics.resolved,
      icon: CheckCircle2,
    },
  ];

  const canFilterAuthority =
    session?.role === USER_ROLES.SUPER_ADMIN ||
    session?.role === USER_ROLES.MAINTENANCE;

  async function refreshMap() {
    await loadIssues();

    setRefreshMessage("Map data refreshed.");

    window.setTimeout(() => {
      setRefreshMessage("");
    }, 1600);
  }

  function clearFilters() {
    setAuthorityFilter("all");
    setStatusFilter("all");
    setSearchText("");
  }

  function selectIssue(issueId) {
    setSelectedIssueId(issueId);
  }

  function openGoogleMaps(issue) {
    const latitude = Number(issue.latitude);
    const longitude = Number(issue.longitude);

    window.open(
      `https://www.google.com/maps?q=${latitude},${longitude}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <DashboardLayout
      roleName={`${currentPortal.roleName} · Live Map`}
      color={currentPortal.color}
      roleIcon={MapIcon}
      stats={stats}
    >
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                Dhaka Infrastructure Issue Map
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Real OpenStreetMap locations using stored issue
                coordinates.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                <Radio
                  size={13}
                  className={autoRefresh ? "animate-pulse" : ""}
                />
                {autoRefresh ? "Live · 20s" : "Live Paused"}
              </div>

              <button
                type="button"
                onClick={() => setAutoRefresh((current) => !current)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-300 transition hover:bg-white/10"
              >
                {autoRefresh ? "Pause Auto Refresh" : "Resume Auto Refresh"}
              </button>

              <button
                type="button"
                onClick={refreshMap}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: `${currentPortal.color}45`,
                  backgroundColor: `${currentPortal.color}18`,
                  color: currentPortal.color,
                }}
              >
                <RefreshCw
                  size={15}
                  className={loading ? "animate-spin" : ""}
                />
                {loading ? "Refreshing..." : "Refresh Map"}
              </button>
            </div>
          </div>

          {refreshMessage && (
            <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-300">
              {refreshMessage}
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-300"
            >
              {errorMessage}
            </div>
          )}

          <div
            className={`mt-6 grid grid-cols-1 gap-3 ${
              canFilterAuthority
                ? "lg:grid-cols-[1.4fr_1fr_1fr]"
                : "lg:grid-cols-[1.5fr_1fr]"
            }`}
          >
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-gray-500"
              />

              <input
                type="search"
                value={searchText}
                onChange={(event) =>
                  setSearchText(event.target.value)
                }
                placeholder="Search location or issue"
                className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-gray-600"
                style={{
                  caretColor: currentPortal.color,
                }}
              />
            </div>

            {canFilterAuthority && (
              <select
                value={authorityFilter}
                onChange={(event) =>
                  setAuthorityFilter(event.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="all" className="bg-slate-900">
                  All authorities
                </option>

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
            )}

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="all" className="bg-slate-900">
                All statuses
              </option>

              <option value="Pending" className="bg-slate-900">
                Pending
              </option>

              <option value="Assigned" className="bg-slate-900">
                Assigned
              </option>

              <option
                value="In Progress"
                className="bg-slate-900"
              >
                In Progress
              </option>

              <option value="Resolved" className="bg-slate-900">
                Resolved
              </option>
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-gray-500">
                Showing {filteredIssues.length} mapped issue(s)
              </span>

              <p className="mt-1 text-[10px] text-gray-600">
                Last updated:{" "}
                {lastUpdated
                  ? lastUpdated.toLocaleTimeString()
                  : "Not yet updated"}
              </p>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="font-semibold transition hover:opacity-80"
              style={{
                color: currentPortal.color,
              }}
            >
              Clear filters
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-[10px] uppercase tracking-wide text-gray-500">
                Visible
              </p>
              <p className="mt-1 text-lg font-bold">
                {filteredIssues.length}
              </p>
            </div>

            <div className="rounded-xl border border-fuchsia-400/20 bg-fuchsia-400/[0.07] p-3">
              <p className="text-[10px] uppercase tracking-wide text-fuchsia-300">
                Critical
              </p>
              <p className="mt-1 text-lg font-bold text-fuchsia-300">
                {filteredIssues.filter(
                  (issue) =>
                    issue.severity === "Critical" &&
                    issue.status !== "Resolved",
                ).length}
              </p>
            </div>

            <div className="rounded-xl border border-rose-400/20 bg-rose-400/[0.07] p-3">
              <p className="text-[10px] uppercase tracking-wide text-rose-300">
                High Priority
              </p>
              <p className="mt-1 text-lg font-bold text-rose-300">
                {filteredIssues.filter(
                  (issue) =>
                    (issue.severity === "Critical" ||
                      issue.severity === "High") &&
                    issue.status !== "Resolved",
                ).length}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] p-3">
              <p className="text-[10px] uppercase tracking-wide text-emerald-300">
                Resolved
              </p>
              <p className="mt-1 text-lg font-bold text-emerald-300">
                {filteredIssues.filter(
                  (issue) => issue.status === "Resolved",
                ).length}
              </p>
            </div>
          </div>

          <div className="relative mt-6 h-[560px] overflow-hidden rounded-3xl border border-white/10 bg-[#020916]">
            <MapContainer
              center={DHAKA_CENTER}
              zoom={11}
              scrollWheelZoom
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapController
                issues={filteredIssues}
                selectedIssue={selectedIssue}
              />

              {filteredIssues.map((issue) => {
                const markerColor = getMarkerColor(issue);
                const selected =
                  selectedIssue?.id === issue.id;

                return (
                  <CircleMarker
                    key={issue.id}
                    center={[
                      Number(issue.latitude),
                      Number(issue.longitude),
                    ]}
                    radius={
                      selected
                        ? 14
                        : issue.status !== "Resolved" &&
                            (issue.severity === "Critical" ||
                              issue.severity === "High")
                          ? 11
                          : 9
                    }
                    pathOptions={{
                      color: "#ffffff",
                      weight: selected ? 3 : 2,
                      fillColor: markerColor,
                      fillOpacity: 0.9,
                    }}
                    eventHandlers={{
                      click: () => selectIssue(issue.id),
                    }}
                    ref={(marker) => {
                      if (marker) {
                        markerRefs.current[issue.id] = marker;
                      }
                    }}
                  >
                    <Popup>
                      <div className="min-w-[210px] text-slate-900">
                        <p className="text-xs font-semibold text-slate-500">
                          {issue.id}
                        </p>

                        <h3 className="mt-1 text-base font-bold">
                          {issue.type}
                        </h3>

                        {issue.imageUrl && (
                          <img
                            src={issue.imageUrl}
                            alt={`${issue.type} detection`}
                            className="mt-3 h-28 w-full rounded-lg object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        )}

                        <p className="mt-2 text-sm">
                          {issue.location}
                        </p>

                        <p className="mt-2 text-xs">
                          Severity:{" "}
                          <strong>{issue.severity}</strong>
                        </p>

                        <p className="mt-1 text-xs">
                          Status: <strong>{issue.status}</strong>
                        </p>

                        <p className="mt-1 text-xs">
                          AI Confidence:{" "}
                          <strong>
                            {issue.confidence > 0
                              ? `${issue.confidence}%`
                              : "N/A"}
                          </strong>
                        </p>

                        <p className="mt-1 text-xs">
                          Detected:{" "}
                          <strong>
                            {formatDateTime(issue.detectedAt)}
                          </strong>
                        </p>

                        <button
                          type="button"
                          onClick={() => openGoogleMaps(issue)}
                          className="mt-3 inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                        >
                          <ExternalLink size={13} />
                          Google Maps
                        </button>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>

            {loading && filteredIssues.length === 0 ? (
              <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center bg-slate-950/70">
                <div className="text-center">
                  <RefreshCw
                    size={42}
                    className="mx-auto animate-spin text-cyan-300"
                  />

                  <p className="mt-4 text-sm text-gray-400">
                    Loading map issues...
                  </p>
                </div>
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center bg-slate-950/70">
                <div className="text-center">
                  <AlertTriangle
                    size={42}
                    className="mx-auto text-gray-500"
                  />

                  <p className="mt-4 text-sm text-gray-400">
                    No valid map locations match the filters.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-6">
            <h3 className="text-lg font-bold">
              Selected Location
            </h3>

            {selectedIssue ? (
              <div className="mt-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">
                    {selectedIssue.id}
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getSeverityClass(
                      selectedIssue.severity,
                    )}`}
                  >
                    {selectedIssue.severity}
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getStatusClass(
                      selectedIssue.status,
                    )}`}
                  >
                    {selectedIssue.status}
                  </span>
                </div>

                <h4 className="mt-4 text-lg font-semibold">
                  {selectedIssue.type}
                </h4>

                {selectedIssue.imageUrl && (
                  <a
                    href={selectedIssue.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 block overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                  >
                    <img
                      src={selectedIssue.imageUrl}
                      alt={`${selectedIssue.type} detection`}
                      className="h-48 w-full object-cover transition duration-300 hover:scale-[1.02]"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  </a>
                )}

                <p className="mt-2 text-sm leading-6 text-gray-400">
                  {selectedIssue.description}
                </p>

                <div className="mt-5 space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin
                      size={18}
                      className="mt-0.5 shrink-0"
                      style={{
                        color: currentPortal.color,
                      }}
                    />

                    <div>
                      <p className="text-xs text-gray-500">
                        Location
                      </p>

                      <p className="mt-1 text-gray-200">
                        {selectedIssue.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Navigation
                      size={18}
                      className="mt-0.5 shrink-0"
                      style={{
                        color: currentPortal.color,
                      }}
                    />

                    <div>
                      <p className="text-xs text-gray-500">
                        Coordinates
                      </p>

                      <p className="mt-1 text-gray-200">
                        {formatCoordinate(
                          selectedIssue.latitude,
                        )}
                        ,{" "}
                        {formatCoordinate(
                          selectedIssue.longitude,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock3
                      size={18}
                      className="mt-0.5 shrink-0"
                      style={{
                        color: currentPortal.color,
                      }}
                    />

                    <div>
                      <p className="text-xs text-gray-500">
                        Detected
                      </p>

                      <p className="mt-1 text-gray-200">
                        {formatDateTime(
                          selectedIssue.detectedAt,
                        )}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Drone ID
                    </p>

                    <p className="mt-1 text-gray-200">
                      {selectedIssue.droneId || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Authority
                    </p>

                    <p className="mt-1 text-gray-200">
                      {selectedIssue.authority === "dncc-north"
                        ? "DNCC North"
                        : selectedIssue.authority === "dncc-south"
                          ? "DNCC South"
                          : "Unknown Zone"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      AI confidence
                    </p>

                    <p
                      className="mt-1 font-bold"
                      style={{
                        color: currentPortal.color,
                      }}
                    >
                      {selectedIssue.confidence > 0
                        ? `${selectedIssue.confidence}%`
                        : "N/A"}
                    </p>
                  </div>
                </div>

                {selectedIssue.assignedTeam && (
                  <div
                    className="mt-4 rounded-xl border p-3 text-xs"
                    style={{
                      borderColor: `${currentPortal.color}40`,
                      backgroundColor: `${currentPortal.color}15`,
                      color: currentPortal.color,
                    }}
                  >
                    Assigned team:{" "}
                    {selectedIssue.assignedTeam}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    openGoogleMaps(selectedIssue)
                  }
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-semibold text-gray-200 transition hover:bg-white/10"
                >
                  <ExternalLink size={15} />
                  Open in Google Maps
                </button>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-gray-500">
                Select a marker to view details.
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 sm:p-6">
            <h3 className="text-lg font-bold">
              Map Legend
            </h3>

            <div className="mt-5 space-y-3 text-sm text-gray-300">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-fuchsia-400" />
                Critical active issue
              </div>

              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-rose-400" />
                High-severity active issue
              </div>

              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                Medium-severity issue
              </div>

              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-cyan-400" />
                Low-severity issue
              </div>

              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                Resolved issue
              </div>
            </div>
          </section>
        </div>
      </section>
    </DashboardLayout>
  );
}