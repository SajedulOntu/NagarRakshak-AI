import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";

import DashboardLayout from "../component/DashboardLayout.jsx";
import { getIssues } from "../utils/issues.js";
import { getSession, USER_ROLES } from "../utils/auth.js";

const northTeams = [
  "North Repair Unit 01",
  "North Repair Unit 02",
  "North Repair Unit 03",
  "North Emergency Unit",
];

const southTeams = [
  "South Repair Unit 01",
  "South Repair Unit 02",
  "South Repair Unit 03",
  "South Emergency Unit",
];

function getStatusClass(status) {
  switch (status) {
    case "In Progress":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";

    case "Assigned":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";

    case "Resolved":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    default:
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }
}

function getPortalConfig(role) {
  const configurations = {
    [USER_ROLES.SUPER_ADMIN]: {
      roleName: "Super Admin · Teams",
      color: "#ff3b5c",
      icon: ShieldCheck,
    },

    [USER_ROLES.DNCC_NORTH]: {
      roleName: "DNCC North · Teams",
      color: "#ffb020",
      icon: ShieldCheck,
    },

    [USER_ROLES.DNCC_SOUTH]: {
      roleName: "DNCC South · Teams",
      color: "#22d3ee",
      icon: ShieldCheck,
    },

    [USER_ROLES.MAINTENANCE]: {
      roleName: "Maintenance Team Management",
      color: "#7cff6b",
      icon: Wrench,
    },
  };

  return (
    configurations[role] ||
    configurations[USER_ROLES.SUPER_ADMIN]
  );
}

export default function Teams() {
  const session = getSession();
  const portal = getPortalConfig(session?.role);

  const [issues, setIssues] = useState(() => getIssues());
  const [authorityFilter, setAuthorityFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] =
    useState("all");
  const [message, setMessage] = useState("");

  const allTeams = useMemo(() => {
    const north = northTeams.map((team, index) => ({
      id: `NORTH-${index + 1}`,
      name: team,
      authority: "dncc-north",
      zone: `North Zone Unit ${index + 1}`,
    }));

    const south = southTeams.map((team, index) => ({
      id: `SOUTH-${index + 1}`,
      name: team,
      authority: "dncc-south",
      zone: `South Zone Unit ${index + 1}`,
    }));

    return [...north, ...south];
  }, []);

  const roleVisibleTeams = useMemo(() => {
    if (session?.role === USER_ROLES.DNCC_NORTH) {
      return allTeams.filter(
        (team) => team.authority === "dncc-north",
      );
    }

    if (session?.role === USER_ROLES.DNCC_SOUTH) {
      return allTeams.filter(
        (team) => team.authority === "dncc-south",
      );
    }

    return allTeams;
  }, [allTeams, session?.role]);

  const teamDetails = useMemo(() => {
    return roleVisibleTeams.map((team) => {
      const assignedIssues = issues.filter(
        (issue) => issue.assignedTeam === team.name,
      );

      const activeIssues = assignedIssues.filter(
        (issue) => issue.status !== "Resolved",
      );

      const inProgressIssues = assignedIssues.filter(
        (issue) => issue.status === "In Progress",
      );

      const resolvedIssues = assignedIssues.filter(
        (issue) => issue.status === "Resolved",
      );

      return {
        ...team,
        assignedIssues,
        activeIssues,
        inProgressIssues,
        resolvedIssues,
        availability:
          activeIssues.length === 0 ? "Available" : "Busy",
      };
    });
  }, [issues, roleVisibleTeams]);

  const filteredTeams = useMemo(() => {
    return teamDetails.filter((team) => {
      const matchesAuthority =
        authorityFilter === "all" ||
        team.authority === authorityFilter;

      const matchesAvailability =
        availabilityFilter === "all" ||
        team.availability === availabilityFilter;

      return matchesAuthority && matchesAvailability;
    });
  }, [
    teamDetails,
    authorityFilter,
    availabilityFilter,
  ]);

  const statistics = useMemo(() => {
    return {
      total: teamDetails.length,

      available: teamDetails.filter(
        (team) => team.availability === "Available",
      ).length,

      busy: teamDetails.filter(
        (team) => team.availability === "Busy",
      ).length,

      activeTasks: teamDetails.reduce(
        (total, team) =>
          total + team.activeIssues.length,
        0,
      ),
    };
  }, [teamDetails]);

  const stats = [
    {
      label: "Total Teams",
      value: statistics.total,
      icon: Users,
    },
    {
      label: "Available",
      value: statistics.available,
      icon: CheckCircle2,
    },
    {
      label: "Busy Teams",
      value: statistics.busy,
      icon: Wrench,
    },
    {
      label: "Active Tasks",
      value: statistics.activeTasks,
      icon: Clock3,
    },
  ];

  const canFilterAuthority =
    session?.role === USER_ROLES.SUPER_ADMIN ||
    session?.role === USER_ROLES.MAINTENANCE;

  function refreshTeams() {
    setIssues(getIssues());
    setMessage("Team information refreshed.");

    window.setTimeout(() => {
      setMessage("");
    }, 1500);
  }

  return (
    <DashboardLayout
      roleName={portal.roleName}
      color={portal.color}
      roleIcon={portal.icon}
      stats={stats}
    >
      <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">
              Maintenance Team Management
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Monitor team availability, workload, and assigned
              infrastructure tasks.
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
              onClick={refreshTeams}
              className="flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition hover:bg-white/10"
              style={{
                borderColor: `${portal.color}40`,
                backgroundColor: `${portal.color}15`,
                color: portal.color,
              }}
            >
              <RefreshCw size={15} />
              Refresh Teams
            </button>
          </div>
        </div>

        <div
          className={`mt-6 grid grid-cols-1 gap-3 ${
            canFilterAuthority
              ? "sm:grid-cols-2"
              : "sm:grid-cols-1"
          }`}
        >
          {canFilterAuthority && (
            <div>
              <label
                htmlFor="team-authority-filter"
                className="mb-2 block text-xs uppercase tracking-wide text-gray-500"
              >
                Authority
              </label>

              <select
                id="team-authority-filter"
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
            </div>
          )}

          <div>
            <label
              htmlFor="team-availability-filter"
              className="mb-2 block text-xs uppercase tracking-wide text-gray-500"
            >
              Availability
            </label>

            <select
              id="team-availability-filter"
              value={availabilityFilter}
              onChange={(event) =>
                setAvailabilityFilter(event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="all" className="bg-slate-900">
                All teams
              </option>

              <option
                value="Available"
                className="bg-slate-900"
              >
                Available
              </option>

              <option value="Busy" className="bg-slate-900">
                Busy
              </option>
            </select>
          </div>
        </div>

        {message && (
          <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-300">
            {message}
          </div>
        )}

        {filteredTeams.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-10 text-center">
            <AlertTriangle
              size={42}
              className="mx-auto text-gray-600"
            />

            <h3 className="mt-4 font-semibold">
              No matching teams
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Change the authority or availability filter.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {filteredTeams.map((team) => (
              <article
                key={team.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500">
                        {team.id}
                      </span>

                      <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2.5 py-1 text-[10px] font-semibold text-purple-300">
                        {team.authority === "dncc-north"
                          ? "DNCC North"
                          : "DNCC South"}
                      </span>
                    </div>

                    <h3 className="mt-3 text-base font-semibold">
                      {team.name}
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      {team.zone}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      team.availability === "Available"
                        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                        : "border-amber-400/20 bg-amber-400/10 text-amber-300"
                    }`}
                  >
                    {team.availability}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                    <p className="text-lg font-bold">
                      {team.activeIssues.length}
                    </p>

                    <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-500">
                      Active
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                    <p className="text-lg font-bold text-cyan-300">
                      {team.inProgressIssues.length}
                    </p>

                    <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-500">
                      Working
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                    <p className="text-lg font-bold text-emerald-300">
                      {team.resolvedIssues.length}
                    </p>

                    <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-500">
                      Resolved
                    </p>
                  </div>
                </div>

                <div className="mt-5 border-t border-white/10 pt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Current assignments
                  </h4>

                  {team.activeIssues.length === 0 ? (
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-xs text-emerald-300">
                      <CheckCircle2 size={15} />
                      No active task assigned
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {team.activeIssues.map((issue) => (
                        <div
                          key={issue.id}
                          className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-gray-300">
                              {issue.id} · {issue.type}
                            </span>

                            <span
                              className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${getStatusClass(
                                issue.status,
                              )}`}
                            >
                              {issue.status}
                            </span>
                          </div>

                          <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                            <MapPin size={13} />
                            {issue.location}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}