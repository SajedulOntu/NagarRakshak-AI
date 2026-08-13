import { useMemo, useState } from "react";
import {
  Activity,
  BatteryCharging,
  Camera,
  CheckCircle2,
  CircleDot,
  Drone as DroneIcon,
  MapPin,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Satellite,
  ShieldCheck,
  Signal,
  Video,
  Wrench,
} from "lucide-react";

import DashboardLayout from "../component/DashboardLayout.jsx";
import { getSession, USER_ROLES } from "../utils/auth.js";
import { getIssues } from "../utils/issues.js";

const initialDrones = [
  {
    id: "DRN-001",
    name: "North Eagle 01",
    authority: "dncc-north",
    zone: "Uttara Sector 7",
    status: "Patrolling",
    battery: 82,
    signal: 94,
    altitude: 68,
    speed: 24,
    active: true,
  },
  {
    id: "DRN-002",
    name: "North Eagle 02",
    authority: "dncc-north",
    zone: "Mirpur 10",
    status: "Standby",
    battery: 64,
    signal: 87,
    altitude: 0,
    speed: 0,
    active: false,
  },
  {
    id: "DRN-003",
    name: "South Falcon 01",
    authority: "dncc-south",
    zone: "Motijheel",
    status: "Patrolling",
    battery: 76,
    signal: 91,
    altitude: 74,
    speed: 21,
    active: true,
  },
  {
    id: "DRN-004",
    name: "South Falcon 02",
    authority: "dncc-south",
    zone: "Dhanmondi 27",
    status: "Charging",
    battery: 39,
    signal: 100,
    altitude: 0,
    speed: 0,
    active: false,
  },
];

function getPortalConfig(role) {
  const configurations = {
    [USER_ROLES.SUPER_ADMIN]: {
      roleName: "Super Admin · Drone Monitoring",
      color: "#ff3b5c",
      icon: ShieldCheck,
    },

    [USER_ROLES.DNCC_NORTH]: {
      roleName: "DNCC North · Drone Monitoring",
      color: "#ffb020",
      icon: ShieldCheck,
    },

    [USER_ROLES.DNCC_SOUTH]: {
      roleName: "DNCC South · Drone Monitoring",
      color: "#22d3ee",
      icon: ShieldCheck,
    },

    [USER_ROLES.MAINTENANCE]: {
      roleName: "Maintenance · Drone Monitoring",
      color: "#7cff6b",
      icon: Wrench,
    },
  };

  return (
    configurations[role] ||
    configurations[USER_ROLES.SUPER_ADMIN]
  );
}

function getStatusClass(status) {
  switch (status) {
    case "Patrolling":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "Standby":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";

    case "Charging":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";

    default:
      return "border-gray-400/20 bg-gray-400/10 text-gray-300";
  }
}

function getBatteryClass(battery) {
  if (battery >= 70) {
    return "text-emerald-300";
  }

  if (battery >= 40) {
    return "text-amber-300";
  }

  return "text-red-300";
}

export default function Drone() {
  const session = getSession();
  const portal = getPortalConfig(session?.role);

  const [drones, setDrones] = useState(initialDrones);
  const [selectedDroneId, setSelectedDroneId] = useState(
    initialDrones[0].id,
  );
  const [authorityFilter, setAuthorityFilter] = useState("all");
  const [message, setMessage] = useState("");

  const issues = useMemo(() => getIssues(), []);

  const roleVisibleDrones = useMemo(() => {
    if (session?.role === USER_ROLES.DNCC_NORTH) {
      return drones.filter(
        (drone) => drone.authority === "dncc-north",
      );
    }

    if (session?.role === USER_ROLES.DNCC_SOUTH) {
      return drones.filter(
        (drone) => drone.authority === "dncc-south",
      );
    }

    return drones;
  }, [drones, session?.role]);

  const filteredDrones = useMemo(() => {
    return roleVisibleDrones.filter((drone) => {
      return (
        authorityFilter === "all" ||
        drone.authority === authorityFilter
      );
    });
  }, [roleVisibleDrones, authorityFilter]);

  const selectedDrone =
    filteredDrones.find(
      (drone) => drone.id === selectedDroneId,
    ) ||
    filteredDrones[0] ||
    null;

  const statistics = useMemo(() => {
    return {
      total: roleVisibleDrones.length,

      active: roleVisibleDrones.filter(
        (drone) => drone.active,
      ).length,

      charging: roleVisibleDrones.filter(
        (drone) => drone.status === "Charging",
      ).length,

      detections: issues.filter((issue) => {
        if (session?.role === USER_ROLES.DNCC_NORTH) {
          return issue.authority === "dncc-north";
        }

        if (session?.role === USER_ROLES.DNCC_SOUTH) {
          return issue.authority === "dncc-south";
        }

        return true;
      }).length,
    };
  }, [issues, roleVisibleDrones, session?.role]);

  const stats = [
    {
      label: "Registered Drones",
      value: statistics.total,
      icon: DroneIcon,
    },
    {
      label: "Active Patrols",
      value: statistics.active,
      icon: Activity,
    },
    {
      label: "Charging",
      value: statistics.charging,
      icon: BatteryCharging,
    },
    {
      label: "AI Detections",
      value: statistics.detections,
      icon: Camera,
    },
  ];

  const canFilterAuthority =
    session?.role === USER_ROLES.SUPER_ADMIN ||
    session?.role === USER_ROLES.MAINTENANCE;

  function showMessage(text) {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 1800);
  }

  function refreshDroneData() {
    setDrones((currentDrones) =>
      currentDrones.map((drone) => ({
        ...drone,
        signal: Math.min(
          100,
          Math.max(
            70,
            drone.signal +
              Math.floor(Math.random() * 7) -
              3,
          ),
        ),
        battery:
          drone.status === "Charging"
            ? Math.min(100, drone.battery + 4)
            : drone.active
              ? Math.max(10, drone.battery - 1)
              : drone.battery,
      })),
    );

    showMessage("Drone telemetry refreshed.");
  }

  function updateDroneStatus(droneId, nextStatus) {
    setDrones((currentDrones) =>
      currentDrones.map((drone) => {
        if (drone.id !== droneId) {
          return drone;
        }

        if (nextStatus === "Patrolling") {
          return {
            ...drone,
            status: "Patrolling",
            active: true,
            altitude: drone.altitude || 60,
            speed: drone.speed || 20,
          };
        }

        if (nextStatus === "Standby") {
          return {
            ...drone,
            status: "Standby",
            active: false,
            altitude: 0,
            speed: 0,
          };
        }

        return {
          ...drone,
          status: "Charging",
          active: false,
          altitude: 0,
          speed: 0,
        };
      }),
    );

    showMessage(
      `${droneId} status changed to ${nextStatus}.`,
    );
  }

  return (
    <DashboardLayout
      roleName={portal.roleName}
      color={portal.color}
      roleIcon={portal.icon}
      stats={stats}
    >
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  Drone Operations Center
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  Monitor patrol status, battery, signal, and
                  live infrastructure scanning.
                </p>
              </div>

              <button
                type="button"
                onClick={refreshDroneData}
                className="flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition hover:bg-white/10"
                style={{
                  borderColor: `${portal.color}40`,
                  backgroundColor: `${portal.color}15`,
                  color: portal.color,
                }}
              >
                <RefreshCw size={15} />
                Refresh Telemetry
              </button>
            </div>

            {canFilterAuthority && (
              <div className="mt-6 max-w-sm">
                <label
                  htmlFor="drone-authority-filter"
                  className="mb-2 block text-xs uppercase tracking-wide text-gray-500"
                >
                  Authority
                </label>

                <select
                  id="drone-authority-filter"
                  value={authorityFilter}
                  onChange={(event) => {
                    setAuthorityFilter(event.target.value);
                    setSelectedDroneId("");
                  }}
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

            {message && (
              <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-300">
                {message}
              </div>
            )}
          </section>

          <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {filteredDrones.map((drone) => (
              <article
                key={drone.id}
                className={`rounded-3xl border p-5 transition ${
                  selectedDrone?.id === drone.id
                    ? "border-cyan-400/30 bg-cyan-400/[0.07]"
                    : "border-white/10 bg-white/[0.05] hover:border-white/20"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setSelectedDroneId(drone.id)
                  }
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold text-gray-500">
                        {drone.id}
                      </span>

                      <h3 className="mt-2 text-base font-semibold">
                        {drone.name}
                      </h3>

                      <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin size={13} />
                        {drone.zone}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getStatusClass(
                        drone.status,
                      )}`}
                    >
                      {drone.status}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <p className="flex items-center gap-2 text-xs text-gray-500">
                        <BatteryCharging size={14} />
                        Battery
                      </p>

                      <p
                        className={`mt-2 text-lg font-bold ${getBatteryClass(
                          drone.battery,
                        )}`}
                      >
                        {drone.battery}%
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <p className="flex items-center gap-2 text-xs text-gray-500">
                        <Signal size={14} />
                        Signal
                      </p>

                      <p className="mt-2 text-lg font-bold text-cyan-300">
                        {drone.signal}%
                      </p>
                    </div>
                  </div>
                </button>
              </article>
            ))}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-6">
            <div className="flex items-center gap-3">
              <div
                className="rounded-xl p-3"
                style={{
                  backgroundColor: `${portal.color}15`,
                  color: portal.color,
                }}
              >
                <Video size={22} />
              </div>

              <div>
                <h3 className="text-lg font-bold">
                  Live Drone Feed
                </h3>

                <p className="mt-1 text-sm text-gray-400">
                  Selected drone telemetry and camera preview.
                </p>
              </div>
            </div>

            {selectedDrone ? (
              <>
                <div className="relative mt-5 flex min-h-64 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#020916]">
                  <div
                    className="absolute inset-0 opacity-40"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(34,211,238,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.08) 1px, transparent 1px)",
                      backgroundSize: "30px 30px",
                    }}
                  />

                  <div className="relative z-10 text-center">
                    <Camera
                      size={48}
                      className="mx-auto text-cyan-300"
                    />

                    <p className="mt-4 text-sm font-semibold">
                      {selectedDrone.name}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {selectedDrone.active
                        ? "Live camera stream active"
                        : "Camera stream paused"}
                    </p>
                  </div>

                  {selectedDrone.active && (
                    <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-[10px] font-bold text-red-300">
                      <CircleDot size={12} />
                      LIVE
                    </div>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-gray-500">
                      Altitude
                    </p>

                    <p className="mt-1 font-bold">
                      {selectedDrone.altitude} m
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-gray-500">
                      Speed
                    </p>

                    <p className="mt-1 font-bold">
                      {selectedDrone.speed} km/h
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-gray-500">
                      Signal
                    </p>

                    <p className="mt-1 font-bold text-cyan-300">
                      {selectedDrone.signal}%
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-gray-500">
                      Battery
                    </p>

                    <p
                      className={`mt-1 font-bold ${getBatteryClass(
                        selectedDrone.battery,
                      )}`}
                    >
                      {selectedDrone.battery}%
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() =>
                      updateDroneStatus(
                        selectedDrone.id,
                        "Patrolling",
                      )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-3 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-300"
                  >
                    <Play size={15} />
                    Patrol
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateDroneStatus(
                        selectedDrone.id,
                        "Standby",
                      )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border border-blue-400/20 bg-blue-400/10 px-3 py-2.5 text-xs font-semibold text-blue-300 transition hover:bg-blue-400/20"
                  >
                    <Pause size={15} />
                    Standby
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateDroneStatus(
                        selectedDrone.id,
                        "Charging",
                      )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-400/20"
                  >
                    <BatteryCharging size={15} />
                    Charge
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-gray-500">
                Select a drone to view telemetry.
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 sm:p-6">
            <h3 className="text-lg font-bold">
              System Status
            </h3>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <Satellite
                    size={19}
                    className="text-cyan-300"
                  />

                  <span className="text-sm text-gray-300">
                    Satellite connection
                  </span>
                </div>

                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                  <CheckCircle2 size={14} />
                  Online
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <RotateCcw
                    size={19}
                    className="text-cyan-300"
                  />

                  <span className="text-sm text-gray-300">
                    Auto return system
                  </span>
                </div>

                <span className="text-xs font-semibold text-emerald-300">
                  Enabled
                </span>
              </div>
            </div>
          </section>
        </div>
      </section>
    </DashboardLayout>
  );
}