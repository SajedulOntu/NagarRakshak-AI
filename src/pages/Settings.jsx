import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Database,
  Lock,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  Wrench,
} from "lucide-react";

import DashboardLayout from "../component/DashboardLayout.jsx";
import { getSession, USER_ROLES } from "../utils/auth.js";
import { getIssues } from "../utils/issues.js";

const SETTINGS_KEY = "nagarRakshakSettings";

const defaultSettings = {
  displayName: "",
  email: "",
  phone: "",
  organization: "",
  emailAlerts: true,
  browserAlerts: true,
  highSeverityAlerts: true,
  assignmentAlerts: true,
  resolutionAlerts: true,
  compactMode: false,
  autoRefresh: true,
  refreshInterval: "30",
  mapLabels: true,
  showResolvedMarkers: true,
};

function getPortalConfig(role) {
  const configurations = {
    [USER_ROLES.SUPER_ADMIN]: {
      roleName: "Super Admin · Settings",
      color: "#ff3b5c",
      icon: ShieldCheck,
      organization: "NagarRakshak Central Administration",
    },

    [USER_ROLES.DNCC_NORTH]: {
      roleName: "DNCC North · Settings",
      color: "#ffb020",
      icon: ShieldCheck,
      organization: "DNCC North Authority",
    },

    [USER_ROLES.DNCC_SOUTH]: {
      roleName: "DNCC South · Settings",
      color: "#22d3ee",
      icon: ShieldCheck,
      organization: "DNCC South Authority",
    },

    [USER_ROLES.MAINTENANCE]: {
      roleName: "Maintenance · Settings",
      color: "#7cff6b",
      icon: Wrench,
      organization: "NagarRakshak Maintenance Division",
    },
  };

  return (
    configurations[role] ||
    configurations[USER_ROLES.SUPER_ADMIN]
  );
}

function getStoredSettings() {
  try {
    const storedValue = localStorage.getItem(SETTINGS_KEY);

    if (!storedValue) {
      return defaultSettings;
    }

    return {
      ...defaultSettings,
      ...JSON.parse(storedValue),
    };
  } catch (error) {
    console.error("Unable to read settings:", error);
    return defaultSettings;
  }
}

function ToggleSwitch({
  id,
  checked,
  onChange,
  label,
  description,
  color,
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
      <div>
        <label
          htmlFor={id}
          className="cursor-pointer text-sm font-semibold text-gray-200"
        >
          {label}
        </label>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          {description}
        </p>
      </div>

      <label
        htmlFor={id}
        className="relative mt-1 inline-flex shrink-0 cursor-pointer items-center"
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
        />

        <span className="h-6 w-11 rounded-full bg-slate-700 transition peer-checked:bg-current" />

        <span
          className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"
          style={{
            color,
          }}
        />
      </label>
    </div>
  );
}

export default function Settings() {
  const session = getSession();
  const portal = getPortalConfig(session?.role);

  const [settings, setSettings] = useState(() => {
    const storedSettings = getStoredSettings();

    return {
      ...storedSettings,
      displayName:
        storedSettings.displayName ||
        session?.name ||
        "Portal User",
      email:
        storedSettings.email ||
        session?.email ||
        "",
      organization:
        storedSettings.organization ||
        portal.organization,
    };
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState("success");

  const issues = useMemo(() => getIssues(), []);

  const statistics = useMemo(() => {
    return {
      storedIssues: issues.length,

      activeAlerts: issues.filter(
        (issue) => issue.status !== "Resolved",
      ).length,

      resolved: issues.filter(
        (issue) => issue.status === "Resolved",
      ).length,

      notificationRules: [
        settings.emailAlerts,
        settings.browserAlerts,
        settings.highSeverityAlerts,
        settings.assignmentAlerts,
        settings.resolutionAlerts,
      ].filter(Boolean).length,
    };
  }, [issues, settings]);

  const stats = [
    {
      label: "Stored Issues",
      value: statistics.storedIssues,
      icon: Database,
    },
    {
      label: "Active Alerts",
      value: statistics.activeAlerts,
      icon: Bell,
    },
    {
      label: "Resolved",
      value: statistics.resolved,
      icon: CheckCircle2,
    },
    {
      label: "Alert Rules",
      value: statistics.notificationRules,
      icon: SlidersHorizontal,
    },
  ];

  useEffect(() => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      organization:
        currentSettings.organization ||
        portal.organization,
    }));
  }, [portal.organization]);

  function updateSetting(key, value) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }));
  }

  function showMessage(text, type = "success") {
    setMessage(text);
    setMessageType(type);

    window.setTimeout(() => {
      setMessage("");
    }, 2000);
  }

  function handleSaveSettings(event) {
    event.preventDefault();

    if (!settings.displayName.trim()) {
      showMessage(
        "Display name cannot be empty.",
        "error",
      );
      return;
    }

    if (
      settings.email &&
      !settings.email.includes("@")
    ) {
      showMessage(
        "Enter a valid email address.",
        "error",
      );
      return;
    }

    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(settings),
      );

      showMessage("Settings saved successfully.");
    } catch (error) {
      console.error("Unable to save settings:", error);

      showMessage(
        "Unable to save settings in this browser.",
        "error",
      );
    }
  }

  function handleResetSettings() {
    const confirmed = window.confirm(
      "Reset all portal settings to their default values?",
    );

    if (!confirmed) {
      return;
    }

    const restoredSettings = {
      ...defaultSettings,
      displayName:
        session?.name || "Portal User",
      email: session?.email || "",
      organization: portal.organization,
    };

    setSettings(restoredSettings);

    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(restoredSettings),
      );

      showMessage(
        "Settings were restored to default values.",
      );
    } catch (error) {
      console.error("Unable to reset settings:", error);

      showMessage(
        "Unable to reset settings.",
        "error",
      );
    }
  }

  return (
    <DashboardLayout
      roleName={portal.roleName}
      color={portal.color}
      roleIcon={portal.icon}
      stats={stats}
    >
      <form
        onSubmit={handleSaveSettings}
        className="space-y-6"
      >
        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div
                  className="rounded-xl p-3"
                  style={{
                    backgroundColor: `${portal.color}15`,
                    color: portal.color,
                  }}
                >
                  <SettingsIcon size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-bold">
                    Portal Settings
                  </h2>

                  <p className="mt-1 text-sm text-gray-400">
                    Manage account, alerts, display, and map preferences.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleResetSettings}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-gray-300 transition hover:bg-white/10"
              >
                Reset Defaults
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:opacity-90"
                style={{
                  backgroundColor: portal.color,
                }}
              >
                <Save size={15} />
                Save Settings
              </button>
            </div>
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
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_1fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div
                  className="rounded-xl p-3"
                  style={{
                    backgroundColor: `${portal.color}15`,
                    color: portal.color,
                  }}
                >
                  <UserRound size={21} />
                </div>

                <div>
                  <h3 className="text-lg font-bold">
                    Account Information
                  </h3>

                  <p className="mt-1 text-sm text-gray-400">
                    Update the profile information shown in this portal.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="display-name"
                    className="mb-2 block text-xs uppercase tracking-wide text-gray-500"
                  >
                    Display name
                  </label>

                  <input
                    id="display-name"
                    type="text"
                    value={settings.displayName}
                    onChange={(event) =>
                      updateSetting(
                        "displayName",
                        event.target.value,
                      )
                    }
                    maxLength={60}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600"
                    placeholder="Enter display name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs uppercase tracking-wide text-gray-500"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(event) =>
                      updateSetting(
                        "email",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600"
                    placeholder="name@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-xs uppercase tracking-wide text-gray-500"
                  >
                    Phone number
                  </label>

                  <input
                    id="phone"
                    type="tel"
                    value={settings.phone}
                    onChange={(event) =>
                      updateSetting(
                        "phone",
                        event.target.value,
                      )
                    }
                    maxLength={20}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600"
                    placeholder="+880..."
                  />
                </div>

                <div>
                  <label
                    htmlFor="organization"
                    className="mb-2 block text-xs uppercase tracking-wide text-gray-500"
                  >
                    Organization
                  </label>

                  <input
                    id="organization"
                    type="text"
                    value={settings.organization}
                    onChange={(event) =>
                      updateSetting(
                        "organization",
                        event.target.value,
                      )
                    }
                    maxLength={100}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600"
                  />
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-start gap-3">
                  <Lock
                    size={19}
                    className="mt-0.5 text-gray-400"
                  />

                  <div>
                    <p className="text-sm font-semibold">
                      Current access role
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {portal.roleName}. Role permissions are controlled by the authentication session.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div
                  className="rounded-xl p-3"
                  style={{
                    backgroundColor: `${portal.color}15`,
                    color: portal.color,
                  }}
                >
                  <Bell size={21} />
                </div>

                <div>
                  <h3 className="text-lg font-bold">
                    Notification Preferences
                  </h3>

                  <p className="mt-1 text-sm text-gray-400">
                    Choose which infrastructure updates should trigger alerts.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <ToggleSwitch
                  id="email-alerts"
                  checked={settings.emailAlerts}
                  onChange={(event) =>
                    updateSetting(
                      "emailAlerts",
                      event.target.checked,
                    )
                  }
                  label="Email alerts"
                  description="Receive issue and maintenance updates by email."
                  color={portal.color}
                />

                <ToggleSwitch
                  id="browser-alerts"
                  checked={settings.browserAlerts}
                  onChange={(event) =>
                    updateSetting(
                      "browserAlerts",
                      event.target.checked,
                    )
                  }
                  label="Portal alerts"
                  description="Display notification messages inside the dashboard."
                  color={portal.color}
                />

                <ToggleSwitch
                  id="high-severity-alerts"
                  checked={
                    settings.highSeverityAlerts
                  }
                  onChange={(event) =>
                    updateSetting(
                      "highSeverityAlerts",
                      event.target.checked,
                    )
                  }
                  label="High-severity alerts"
                  description="Notify when AI detects a high-priority infrastructure issue."
                  color={portal.color}
                />

                <ToggleSwitch
                  id="assignment-alerts"
                  checked={settings.assignmentAlerts}
                  onChange={(event) =>
                    updateSetting(
                      "assignmentAlerts",
                      event.target.checked,
                    )
                  }
                  label="Team assignment alerts"
                  description="Notify when an issue is assigned or reassigned to a team."
                  color={portal.color}
                />

                <ToggleSwitch
                  id="resolution-alerts"
                  checked={settings.resolutionAlerts}
                  onChange={(event) =>
                    updateSetting(
                      "resolutionAlerts",
                      event.target.checked,
                    )
                  }
                  label="Resolution alerts"
                  description="Notify when maintenance work is completed."
                  color={portal.color}
                />
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div
                  className="rounded-xl p-3"
                  style={{
                    backgroundColor: `${portal.color}15`,
                    color: portal.color,
                  }}
                >
                  <SlidersHorizontal size={21} />
                </div>

                <div>
                  <h3 className="text-lg font-bold">
                    Dashboard Preferences
                  </h3>

                  <p className="mt-1 text-sm text-gray-400">
                    Configure dashboard refresh and display behavior.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <ToggleSwitch
                  id="compact-mode"
                  checked={settings.compactMode}
                  onChange={(event) =>
                    updateSetting(
                      "compactMode",
                      event.target.checked,
                    )
                  }
                  label="Compact display"
                  description="Use reduced spacing for issue and report cards."
                  color={portal.color}
                />

                <ToggleSwitch
                  id="auto-refresh"
                  checked={settings.autoRefresh}
                  onChange={(event) =>
                    updateSetting(
                      "autoRefresh",
                      event.target.checked,
                    )
                  }
                  label="Automatic refresh"
                  description="Allow dashboard data to refresh automatically."
                  color={portal.color}
                />

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <label
                    htmlFor="refresh-interval"
                    className="block text-sm font-semibold text-gray-200"
                  >
                    Refresh interval
                  </label>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Select how often dashboard data should refresh.
                  </p>

                  <select
                    id="refresh-interval"
                    value={settings.refreshInterval}
                    onChange={(event) =>
                      updateSetting(
                        "refreshInterval",
                        event.target.value,
                      )
                    }
                    disabled={!settings.autoRefresh}
                    className="mt-4 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <option
                      value="15"
                      className="bg-slate-900"
                    >
                      Every 15 seconds
                    </option>

                    <option
                      value="30"
                      className="bg-slate-900"
                    >
                      Every 30 seconds
                    </option>

                    <option
                      value="60"
                      className="bg-slate-900"
                    >
                      Every 1 minute
                    </option>

                    <option
                      value="300"
                      className="bg-slate-900"
                    >
                      Every 5 minutes
                    </option>
                  </select>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div
                  className="rounded-xl p-3"
                  style={{
                    backgroundColor: `${portal.color}15`,
                    color: portal.color,
                  }}
                >
                  <Database size={21} />
                </div>

                <div>
                  <h3 className="text-lg font-bold">
                    Live Map Preferences
                  </h3>

                  <p className="mt-1 text-sm text-gray-400">
                    Control which information appears on the map.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <ToggleSwitch
                  id="map-labels"
                  checked={settings.mapLabels}
                  onChange={(event) =>
                    updateSetting(
                      "mapLabels",
                      event.target.checked,
                    )
                  }
                  label="Show marker labels"
                  description="Display issue location names beside map markers."
                  color={portal.color}
                />

                <ToggleSwitch
                  id="resolved-markers"
                  checked={
                    settings.showResolvedMarkers
                  }
                  onChange={(event) =>
                    updateSetting(
                      "showResolvedMarkers",
                      event.target.checked,
                    )
                  }
                  label="Show resolved markers"
                  description="Keep completed infrastructure issues visible on the map."
                  color={portal.color}
                />
              </div>
            </section>

            <section
              className="rounded-3xl border p-5 sm:p-6"
              style={{
                borderColor: `${portal.color}35`,
                backgroundColor: `${portal.color}0d`,
              }}
            >
              <h3
                className="font-bold"
                style={{
                  color: portal.color,
                }}
              >
                Local Demo Storage
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-400">
                Account settings and issue records are stored in this browser using localStorage. Clearing browser storage will remove saved demo changes.
              </p>
            </section>
          </div>
        </section>
      </form>
    </DashboardLayout>
  );
}