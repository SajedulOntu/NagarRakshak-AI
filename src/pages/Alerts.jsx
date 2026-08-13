import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  Filter,
  MapPin,
  RefreshCw,
  Search,
} from "lucide-react";

import DashboardLayout from "../component/DashboardLayout.jsx";
import { getSession } from "../utils/auth.js";

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

  const locationText =
    issue.address ||
    (latitude !== undefined && longitude !== undefined
      ? `${latitude}, ${longitude}`
      : "Location unavailable");

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
    location: locationText,
    detectedAt: issue.createdAt || issue.detectedAt,
    assignedTeam,
    confidence:
      issue.aiConfidence === null || issue.aiConfidence === undefined
        ? 0
        : Number(issue.aiConfidence),
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

    default:
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }
}

function formatDateTime(dateValue) {
  if (!dateValue) {
    return "Not available";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function Alerts() {
  const [issues, setIssues] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [authorityFilter, setAuthorityFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadIssues() {
    const session = getSession();
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
        throw new Error(data.message || "Unable to load alerts.");
      }

      setIssues(
        Array.isArray(data.issues)
          ? data.issues.map(normalizeIssue)
          : [],
      );
    } catch (error) {
      console.error("Unable to load alerts:", error);
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

  const alertIssues = useMemo(() => {
    return issues
      .filter((issue) => {
        const searchValue = searchText.trim().toLowerCase();

        const matchesSearch =
          !searchValue ||
          issue.id.toLowerCase().includes(searchValue) ||
          issue.type.toLowerCase().includes(searchValue) ||
          issue.location.toLowerCase().includes(searchValue) ||
          issue.description.toLowerCase().includes(searchValue);

        const matchesSeverity =
          severityFilter === "all" ||
          issue.severity === severityFilter;

        const matchesStatus =
          statusFilter === "all" ||
          issue.status === statusFilter;

        const matchesAuthority =
          authorityFilter === "all" ||
          issue.authority === authorityFilter;

        return (
          matchesSearch &&
          matchesSeverity &&
          matchesStatus &&
          matchesAuthority
        );
      })
      .sort((firstIssue, secondIssue) => {
        const severityOrder = {
          Critical: 4,
          High: 3,
          Medium: 2,
          Low: 1,
        };

        const firstSeverity =
          severityOrder[firstIssue.severity] || 0;

        const secondSeverity =
          severityOrder[secondIssue.severity] || 0;

        if (firstSeverity !== secondSeverity) {
          return secondSeverity - firstSeverity;
        }

        return (
          new Date(secondIssue.detectedAt).getTime() -
          new Date(firstIssue.detectedAt).getTime()
        );
      });
  }, [
    issues,
    searchText,
    severityFilter,
    statusFilter,
    authorityFilter,
  ]);

  const statistics = useMemo(() => {
    return {
      total: issues.length,

      high: issues.filter(
        (issue) =>
          issue.severity === "High" &&
          issue.status !== "Resolved",
      ).length,

      pending: issues.filter(
        (issue) => issue.status === "Pending",
      ).length,

      resolved: issues.filter(
        (issue) => issue.status === "Resolved",
      ).length,
    };
  }, [issues]);

  const stats = [
    {
      label: "Total Alerts",
      value: statistics.total,
      icon: Bell,
    },
    {
      label: "High Priority",
      value: statistics.high,
      icon: AlertTriangle,
    },
    {
      label: "Pending",
      value: statistics.pending,
      icon: Clock3,
    },
    {
      label: "Resolved",
      value: statistics.resolved,
      icon: CheckCircle2,
    },
  ];

  function refreshAlerts() {
    loadIssues();
  }

  function clearFilters() {
    setSearchText("");
    setSeverityFilter("all");
    setStatusFilter("all");
    setAuthorityFilter("all");
  }

  return (
    <DashboardLayout
      roleName="Alert Monitoring"
      color="#fb7185"
      roleIcon={Bell}
      stats={stats}
    >
      <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">
              Infrastructure Alerts
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Search, filter, and monitor detected infrastructure
              problems.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshAlerts}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            {loading ? "Refreshing..." : "Refresh Alerts"}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <label
              htmlFor="alert-search"
              className="mb-2 block text-xs uppercase tracking-wide text-gray-500"
            >
              Search
            </label>

            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                id="alert-search"
                type="search"
                value={searchText}
                onChange={(event) =>
                  setSearchText(event.target.value)
                }
                placeholder="Search ID, type, or location"
                className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-gray-600 focus:border-rose-400/40"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="authority-filter"
              className="mb-2 block text-xs uppercase tracking-wide text-gray-500"
            >
              Authority
            </label>

            <select
              id="authority-filter"
              value={authorityFilter}
              onChange={(event) =>
                setAuthorityFilter(event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-rose-400/40"
            >
              <option value="all" className="bg-slate-900">
                All authorities
              </option>

              <option value="dncc-north" className="bg-slate-900">
                DNCC North
              </option>

              <option value="dncc-south" className="bg-slate-900">
                DNCC South
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="severity-filter"
              className="mb-2 block text-xs uppercase tracking-wide text-gray-500"
            >
              Severity
            </label>

            <select
              id="severity-filter"
              value={severityFilter}
              onChange={(event) =>
                setSeverityFilter(event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-rose-400/40"
            >
              <option value="all" className="bg-slate-900">
                All severities
              </option>

              <option value="Critical" className="bg-slate-900">
                Critical
              </option>

              <option value="High" className="bg-slate-900">
                High
              </option>

              <option value="Medium" className="bg-slate-900">
                Medium
              </option>

              <option value="Low" className="bg-slate-900">
                Low
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="status-filter"
              className="mb-2 block text-xs uppercase tracking-wide text-gray-500"
            >
              Status
            </label>

            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-rose-400/40"
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
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Filter size={14} />

            <span>
              Showing {alertIssues.length} of {issues.length} alert(s)
            </span>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-semibold text-rose-300 transition hover:text-rose-200"
          >
            Clear filters
          </button>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300"
          >
            {errorMessage}
          </div>
        )}

        {loading && issues.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-10 text-center">
            <RefreshCw
              size={40}
              className="mx-auto animate-spin text-rose-300"
            />
            <h3 className="mt-4 font-semibold">Loading alerts</h3>
            <p className="mt-2 text-sm text-gray-500">
              Fetching infrastructure issues from MongoDB.
            </p>
          </div>
        ) : alertIssues.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-10 text-center">
            <Bell
              size={42}
              className="mx-auto text-gray-600"
            />

            <h3 className="mt-4 font-semibold">
              No alerts found
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Change the filters or search terms.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {alertIssues.map((issue) => (
              <article
                key={issue.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500">
                        {issue.id}
                      </span>

                      <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2.5 py-1 text-[10px] font-semibold text-purple-300">
                        {issue.authority === "dncc-north"
                          ? "DNCC North"
                          : issue.authority === "dncc-south"
                            ? "DNCC South"
                            : "Unknown Zone"}
                      </span>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getSeverityClass(
                          issue.severity,
                        )}`}
                      >
                        {issue.severity} severity
                      </span>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getStatusClass(
                          issue.status,
                        )}`}
                      >
                        {issue.status}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-semibold">
                      {issue.type}
                    </h3>

                    {issue.imageUrl && (
                      <a
                        href={issue.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 block max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                      >
                        <img
                          src={issue.imageUrl}
                          alt={`${issue.type} detection`}
                          className="h-52 w-full object-cover transition duration-300 hover:scale-[1.02]"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      </a>
                    )}

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
                      {issue.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} />
                        {issue.location}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Clock3 size={14} />
                        {formatDateTime(issue.detectedAt)}
                      </span>
                    </div>

                    {issue.assignedTeam && (
                      <p className="mt-3 text-xs text-cyan-300">
                        Assigned team: {issue.assignedTeam}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500">
                      AI confidence
                    </p>

                    <p className="mt-1 text-xl font-bold text-cyan-300">
                      {issue.confidence > 0
                        ? `${issue.confidence}%`
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}