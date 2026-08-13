import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  RefreshCw,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import DashboardLayout from "../component/DashboardLayout.jsx";
import { getIssues } from "../utils/issues.js";
import { getSession, USER_ROLES } from "../utils/auth.js";

function getPortalConfig(role) {
  const configurations = {
    [USER_ROLES.SUPER_ADMIN]: {
      roleName: "Super Admin · Reports",
      color: "#ff3b5c",
      icon: ShieldCheck,
    },

    [USER_ROLES.DNCC_NORTH]: {
      roleName: "DNCC North · Reports",
      color: "#ffb020",
      icon: ShieldCheck,
    },

    [USER_ROLES.DNCC_SOUTH]: {
      roleName: "DNCC South · Reports",
      color: "#22d3ee",
      icon: ShieldCheck,
    },

    [USER_ROLES.MAINTENANCE]: {
      roleName: "Maintenance · Reports",
      color: "#7cff6b",
      icon: Wrench,
    },
  };

  return (
    configurations[role] ||
    configurations[USER_ROLES.SUPER_ADMIN]
  );
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Not available";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function escapeCsvValue(value) {
  const text = String(value ?? "");

  return `"${text.replaceAll('"', '""')}"`;
}

export default function Reports() {
  const session = getSession();
  const portal = getPortalConfig(session?.role);

  const [issues, setIssues] = useState(() => getIssues());
  const [authorityFilter, setAuthorityFilter] =
    useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");

  const roleVisibleIssues = useMemo(() => {
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

    if (session?.role === USER_ROLES.MAINTENANCE) {
      return issues.filter((issue) =>
        Boolean(issue.assignedTeam),
      );
    }

    return issues;
  }, [issues, session?.role]);

  const filteredIssues = useMemo(() => {
    return roleVisibleIssues.filter((issue) => {
      const matchesAuthority =
        authorityFilter === "all" ||
        issue.authority === authorityFilter;

      const matchesStatus =
        statusFilter === "all" ||
        issue.status === statusFilter;

      return matchesAuthority && matchesStatus;
    });
  }, [
    roleVisibleIssues,
    authorityFilter,
    statusFilter,
  ]);

  const statistics = useMemo(() => {
    const total = roleVisibleIssues.length;

    const pending = roleVisibleIssues.filter(
      (issue) => issue.status === "Pending",
    ).length;

    const assigned = roleVisibleIssues.filter(
      (issue) => issue.status === "Assigned",
    ).length;

    const inProgress = roleVisibleIssues.filter(
      (issue) => issue.status === "In Progress",
    ).length;

    const resolved = roleVisibleIssues.filter(
      (issue) => issue.status === "Resolved",
    ).length;

    const north = roleVisibleIssues.filter(
      (issue) => issue.authority === "dncc-north",
    ).length;

    const south = roleVisibleIssues.filter(
      (issue) => issue.authority === "dncc-south",
    ).length;

    const highSeverity = roleVisibleIssues.filter(
      (issue) => issue.severity === "High",
    ).length;

    const resolutionRate =
      total === 0
        ? 0
        : Math.round((resolved / total) * 100);

    return {
      total,
      pending,
      assigned,
      inProgress,
      resolved,
      north,
      south,
      highSeverity,
      resolutionRate,
    };
  }, [roleVisibleIssues]);

  const stats = [
    {
      label: "Total Issues",
      value: statistics.total,
      icon: AlertTriangle,
    },
    {
      label: "In Progress",
      value: statistics.inProgress,
      icon: Clock3,
    },
    {
      label: "Resolved",
      value: statistics.resolved,
      icon: CheckCircle2,
    },
    {
      label: "Resolution Rate",
      value: `${statistics.resolutionRate}%`,
      icon: BarChart3,
    },
  ];

  const statusSummary = [
    {
      label: "Pending",
      value: statistics.pending,
      color: "text-amber-300",
      background:
        "border-amber-400/20 bg-amber-400/10",
    },
    {
      label: "Assigned",
      value: statistics.assigned,
      color: "text-blue-300",
      background:
        "border-blue-400/20 bg-blue-400/10",
    },
    {
      label: "In Progress",
      value: statistics.inProgress,
      color: "text-cyan-300",
      background:
        "border-cyan-400/20 bg-cyan-400/10",
    },
    {
      label: "Resolved",
      value: statistics.resolved,
      color: "text-emerald-300",
      background:
        "border-emerald-400/20 bg-emerald-400/10",
    },
  ];

  const canFilterAuthority =
    session?.role === USER_ROLES.SUPER_ADMIN ||
    session?.role === USER_ROLES.MAINTENANCE;

  function refreshReports() {
    setIssues(getIssues());
    setMessage("Report data refreshed.");

    window.setTimeout(() => {
      setMessage("");
    }, 1500);
  }

  function downloadCsvReport() {
    if (filteredIssues.length === 0) {
      setMessage("No issue data available to export.");

      window.setTimeout(() => {
        setMessage("");
      }, 1800);

      return;
    }

    const headers = [
      "Issue ID",
      "Authority",
      "Type",
      "Severity",
      "Status",
      "Location",
      "Assigned Team",
      "AI Confidence",
      "Detected Date",
      "Completed Date",
      "Completion Note",
    ];

    const rows = filteredIssues.map((issue) => [
      issue.id,
      issue.authority === "dncc-north"
        ? "DNCC North"
        : "DNCC South",
      issue.type,
      issue.severity,
      issue.status,
      issue.location,
      issue.assignedTeam || "Not assigned",
      `${issue.confidence}%`,
      formatDate(issue.detectedAt),
      formatDate(issue.completedAt),
      issue.completionNote || "",
    ]);

    const csvContent = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) =>
        row.map(escapeCsvValue).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const fileUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");

    downloadLink.href = fileUrl;
    downloadLink.download = `nagar-rakshak-report-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    URL.revokeObjectURL(fileUrl);

    setMessage("CSV report downloaded successfully.");

    window.setTimeout(() => {
      setMessage("");
    }, 1800);
  }

  return (
    <DashboardLayout
      roleName={portal.roleName}
      color={portal.color}
      roleIcon={portal.icon}
      stats={stats}
    >
      <section className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                Infrastructure Reports
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Review issue performance and download report data.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={downloadCsvReport}
                className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
              >
                <Download size={15} />
                Download CSV
              </button>

              <button
                type="button"
                onClick={refreshReports}
                className="flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition hover:bg-white/10"
                style={{
                  borderColor: `${portal.color}40`,
                  backgroundColor: `${portal.color}15`,
                  color: portal.color,
                }}
              >
                <RefreshCw size={15} />
                Refresh Report
              </button>
            </div>
          </div>

          <div
            className={`mt-6 grid grid-cols-1 gap-4 ${
              canFilterAuthority
                ? "sm:grid-cols-2"
                : "sm:grid-cols-1"
            }`}
          >
            {canFilterAuthority && (
              <div>
                <label
                  htmlFor="report-authority-filter"
                  className="mb-2 block text-xs uppercase tracking-wide text-gray-500"
                >
                  Authority
                </label>

                <select
                  id="report-authority-filter"
                  value={authorityFilter}
                  onChange={(event) =>
                    setAuthorityFilter(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
                >
                  <option
                    value="all"
                    className="bg-slate-900"
                  >
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
              </div>
            )}

            <div>
              <label
                htmlFor="report-status-filter"
                className="mb-2 block text-xs uppercase tracking-wide text-gray-500"
              >
                Status
              </label>

              <select
                id="report-status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
              >
                <option
                  value="all"
                  className="bg-slate-900"
                >
                  All statuses
                </option>

                <option
                  value="Pending"
                  className="bg-slate-900"
                >
                  Pending
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
              </select>
            </div>
          </div>

          {message && (
            <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-300">
              {message}
            </div>
          )}
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statusSummary.map((item) => (
            <article
              key={item.label}
              className={`rounded-2xl border p-5 ${item.background}`}
            >
              <p className="text-xs uppercase tracking-wide text-gray-400">
                {item.label}
              </p>

              <p
                className={`mt-3 text-3xl font-bold ${item.color}`}
              >
                {item.value}
              </p>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div
                className="rounded-xl p-3"
                style={{
                  backgroundColor: `${portal.color}15`,
                  color: portal.color,
                }}
              >
                <FileText size={22} />
              </div>

              <div>
                <h3 className="text-lg font-bold">
                  Issue Report Table
                </h3>

                <p className="mt-1 text-sm text-gray-400">
                  Showing {filteredIssues.length} issue record(s).
                </p>
              </div>
            </div>

            {filteredIssues.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-10 text-center">
                <AlertTriangle
                  size={42}
                  className="mx-auto text-gray-600"
                />

                <h4 className="mt-4 font-semibold">
                  No report records
                </h4>

                <p className="mt-2 text-sm text-gray-500">
                  Change the selected report filters.
                </p>
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-3 py-3">
                        Issue
                      </th>

                      <th className="px-3 py-3">
                        Authority
                      </th>

                      <th className="px-3 py-3">
                        Severity
                      </th>

                      <th className="px-3 py-3">
                        Status
                      </th>

                      <th className="px-3 py-3">
                        Team
                      </th>

                      <th className="px-3 py-3">
                        Confidence
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredIssues.map((issue) => (
                      <tr
                        key={issue.id}
                        className="border-b border-white/5 transition hover:bg-white/[0.03]"
                      >
                        <td className="px-3 py-4">
                          <p className="font-semibold text-white">
                            {issue.id}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {issue.type}
                          </p>
                        </td>

                        <td className="px-3 py-4 text-gray-300">
                          {issue.authority ===
                          "dncc-north"
                            ? "DNCC North"
                            : "DNCC South"}
                        </td>

                        <td className="px-3 py-4">
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-gray-300">
                            {issue.severity}
                          </span>
                        </td>

                        <td className="px-3 py-4">
                          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-300">
                            {issue.status}
                          </span>
                        </td>

                        <td className="px-3 py-4 text-gray-400">
                          {issue.assignedTeam ||
                            "Not assigned"}
                        </td>

                        <td className="px-3 py-4 font-semibold text-cyan-300">
                          {issue.confidence}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 sm:p-6">
              <h3 className="text-lg font-bold">
                Authority Distribution
              </h3>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-amber-300">
                    DNCC North
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {statistics.north}
                  </p>
                </div>

                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-cyan-300">
                    DNCC South
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {statistics.south}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-red-400/20 bg-red-400/5 p-5 sm:p-6">
              <h3 className="font-bold text-red-300">
                High-Severity Summary
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-400">
                {statistics.highSeverity} high-severity
                issue(s) are included in the current report.
              </p>
            </section>
          </div>
        </section>
      </section>
    </DashboardLayout>
  );
}