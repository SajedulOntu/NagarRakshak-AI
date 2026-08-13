import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Drone,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Moon,
  Settings,
  Sun,
  Users,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { clearSession, getDashboardPath, getSession, USER_ROLES } from "../utils/auth.js";
import { getResolvedTheme, getSavedTheme, saveTheme, THEMES } from "../utils/theme.js";

/* =========================================================
   DESIGN TOKENS
   `color` is the per-role accent passed in by each dashboard
   (e.g. "var(--brand-orange)" for Super Admin). tint() builds
   translucent surfaces from it with color-mix(), so it works
   whether the caller passes a hex value or a CSS variable.
========================================================= */

function tint(colorValue, { bg = 15, border = 35 } = {}) {
  return {
    color: colorValue,
    backgroundColor: `color-mix(in srgb, ${colorValue} ${bg}%, transparent)`,
    borderColor: `color-mix(in srgb, ${colorValue} ${border}%, transparent)`,
  };
}

const navigationItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    type: "dashboard",
    roles: [
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.DNCC_NORTH,
      USER_ROLES.DNCC_SOUTH,
      USER_ROLES.MAINTENANCE,
    ],
  },
  {
    label: "Drone Monitoring",
    icon: Drone,
    path: "/drone",
    roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.DNCC_NORTH, USER_ROLES.DNCC_SOUTH],
  },
  {
    label: "AI Detection",
    icon: BrainCircuit,
    path: "/ai",
    roles: [
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.DNCC_NORTH,
      USER_ROLES.DNCC_SOUTH,
      USER_ROLES.MAINTENANCE,
    ],
  },
  {
    label: "Live Map",
    icon: Map,
    path: "/map",
    roles: [
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.DNCC_NORTH,
      USER_ROLES.DNCC_SOUTH,
      USER_ROLES.MAINTENANCE,
    ],
  },
  {
    label: "Alerts",
    icon: AlertTriangle,
    path: "/alerts",
    roles: [
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.DNCC_NORTH,
      USER_ROLES.DNCC_SOUTH,
      USER_ROLES.MAINTENANCE,
    ],
  },
  {
    label: "Maintenance Teams",
    icon: Users,
    path: "/teams",
    roles: [
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.DNCC_NORTH,
      USER_ROLES.DNCC_SOUTH,
      USER_ROLES.MAINTENANCE,
    ],
  },
  {
    label: "Reports",
    icon: BarChart3,
    path: "/reports",
    roles: [
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.DNCC_NORTH,
      USER_ROLES.DNCC_SOUTH,
      USER_ROLES.MAINTENANCE,
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    path: "/settings",
    roles: [
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.DNCC_NORTH,
      USER_ROLES.DNCC_SOUTH,
      USER_ROLES.MAINTENANCE,
    ],
  },
];

function getRoleLabel(role) {
  const labels = {
    [USER_ROLES.SUPER_ADMIN]: "Super Admin",
    [USER_ROLES.DNCC_NORTH]: "DNCC North",
    [USER_ROLES.DNCC_SOUTH]: "DNCC South",
    [USER_ROLES.MAINTENANCE]: "Maintenance Team",
  };

  return labels[role] || "Portal User";
}

function getPageSubtitle(pathname) {
  if (pathname.includes("/drone")) return "Real-time drone operations and telemetry";
  if (pathname.includes("/ai")) return "AI-powered infrastructure issue detection";
  if (pathname.includes("/map")) return "Live infrastructure issue locations";
  if (pathname.includes("/alerts")) return "Priority alerts and issue notifications";
  if (pathname.includes("/teams")) return "Maintenance team workload and availability";
  if (pathname.includes("/reports")) return "Infrastructure performance and analytics";
  if (pathname.includes("/settings")) return "Portal configuration and preferences";
  if (pathname.includes("/maintenance")) return "Assigned repair and resolution workflow";
  return "Live infrastructure monitoring feed";
}

export default function DashboardLayout({ roleName, color, roleIcon: RoleIcon, stats = [], children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSession();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState(() => getSavedTheme());

  const resolvedTheme = getResolvedTheme(theme);

  useEffect(() => {
    function handleThemeChange(event) {
      setTheme(event.detail?.theme || getSavedTheme());
    }

    window.addEventListener("dhakai-pakhi-theme-change", handleThemeChange);
    return () => window.removeEventListener("dhakai-pakhi-theme-change", handleThemeChange);
  }, []);

  const dashboardPath = getDashboardPath(session?.role);

  const visibleNavigation = useMemo(() => {
    return navigationItems
      .filter((item) => item.roles.includes(session?.role))
      .map((item) => ({
        ...item,
        path: item.type === "dashboard" ? dashboardPath : item.path,
      }));
  }, [dashboardPath, session?.role]);

  const sessionRoleName = session?.roleName || getRoleLabel(session?.role);
  const subtitle = getPageSubtitle(location.pathname);

  function isActivePath(path) {
    if (path === dashboardPath) return location.pathname === dashboardPath;
    return location.pathname.startsWith(path);
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  function handleLogout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  function handleThemeToggle() {
    const nextTheme = resolvedTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    saveTheme(nextTheme);
    setTheme(nextTheme);
  }

  function renderNavigationItem(item) {
    const Icon = item.icon;
    const active = isActivePath(item.path);

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={closeMobileMenu}
        title={sidebarCollapsed ? item.label : undefined}
        className={`group relative flex items-center rounded-xl border transition ${
          sidebarCollapsed ? "justify-center px-3 py-3" : "gap-3 px-4 py-3"
        } ${
          active
            ? "app-text"
            : "border-transparent app-text-muted hover:app-surface-hover hover:app-text"
        }`}
        style={active ? tint(color, { bg: 13, border: 30 }) : undefined}
      >
        {active && (
          <span
            className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full"
            style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }}
          />
        )}

        <Icon size={19} className="shrink-0" style={{ color: active ? color : undefined }} />

        {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
      </Link>
    );
  }

  return (
    <div className="app-background relative min-h-screen">
      <div className="hud-grid-bg pointer-events-none fixed inset-0 opacity-70" />

      <div
        className="pointer-events-none fixed left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, color-mix(in srgb, ${color} 16%, transparent) 0%, transparent 70%)` }}
      />

      {mobileMenuOpen && (
        <button
          type="button"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          aria-label="Close navigation menu"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`app-border fixed inset-y-0 left-0 z-50 flex flex-col border-r backdrop-blur-xl transition-all duration-300 ${
          sidebarCollapsed ? "w-20" : "w-72"
        } ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ backgroundColor: "var(--sidebar-background)" }}
      >
        <div
          className={`app-border flex h-20 items-center border-b ${
            sidebarCollapsed ? "justify-center px-3" : "justify-between px-5"
          }`}
        >
          <Link to={dashboardPath} onClick={closeMobileMenu} className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
              style={tint(color, { bg: 14, border: 35 })}
            >
              <Activity size={22} />
            </div>

            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h1 className="font-display truncate text-base font-bold tracking-wide app-text">
                  DHAKAI PAKHI
                </h1>
                <p className="font-hud mt-1 truncate text-[9px] uppercase leading-4 tracking-[0.08em] app-text-muted">
                  Smart Eyes in the Sky for a Cleaner Dhaka
                </p>
              </div>
            )}
          </Link>

          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={closeMobileMenu}
              className="rounded-lg p-2 app-text-muted transition hover:app-surface-hover hover:app-text lg:hidden"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          {!sidebarCollapsed && <Eyebrow className="mb-3 px-3">Navigation</Eyebrow>}
          <nav className="space-y-2">{visibleNavigation.map(renderNavigationItem)}</nav>
        </div>

        <div className="app-border border-t p-3">
          <div className={`app-input mb-3 rounded-2xl border ${sidebarCollapsed ? "p-2" : "p-4"}`}>
            <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"}`}>
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
              >
                <RoleIcon size={20} />
              </div>

              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold app-text">
                    {session?.name || sessionRoleName}
                  </p>
                  <p className="font-hud mt-1 truncate text-[10px] uppercase tracking-wide app-text-muted">
                    {sessionRoleName}
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title={sidebarCollapsed ? "Log out" : undefined}
            className={`flex w-full items-center rounded-xl border py-3 transition hover:brightness-110 ${
              sidebarCollapsed ? "justify-center px-3" : "gap-3 px-4"
            }`}
            style={tint("var(--brand-red)", { bg: 8, border: 20 })}
          >
            <LogOut size={18} className="shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-semibold">Log Out</span>}
          </button>

          <button
            type="button"
            onClick={() => setSidebarCollapsed((current) => !current)}
            className="app-border mt-3 hidden w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-xs app-text-muted transition hover:app-surface-hover hover:app-text lg:flex"
          >
            {sidebarCollapsed ? (
              <ChevronRight size={17} />
            ) : (
              <>
                <ChevronLeft size={17} />
                Collapse Sidebar
              </>
            )}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className={`relative min-h-screen transition-all duration-300 ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-72"}`}>
        <header
          className="app-border sticky top-0 z-30 border-b backdrop-blur-xl"
          style={{ backgroundColor: "var(--header-background)" }}
        >
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-4 sm:px-6 xl:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="app-input rounded-xl border p-2.5 app-text-secondary transition hover:app-surface-hover hover:app-text lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu size={20} />
              </button>

              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold app-text sm:text-xl">{roleName}</h2>
                <p className="mt-1 truncate text-xs app-text-muted">{subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-5">
              <button
                type="button"
                onClick={handleThemeToggle}
                className="app-input flex h-10 w-10 items-center justify-center rounded-xl border app-text-secondary transition hover:app-surface-hover hover:app-text"
                aria-label={resolvedTheme === THEMES.DARK ? "Switch to light mode" : "Switch to dark mode"}
                title={resolvedTheme === THEMES.DARK ? "Light mode" : "Dark mode"}
              >
                {resolvedTheme === THEMES.DARK ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <div
                className="font-hud hidden items-center gap-2 text-xs font-semibold sm:flex"
                style={{ color: "var(--brand-green)" }}
              >
                <span
                  className="h-2 w-2 animate-pulse rounded-full"
                  style={{ backgroundColor: "var(--brand-green)" }}
                />
                SYSTEM ONLINE
              </div>

              <div className="app-border hidden h-6 w-px border-l sm:block" />

              <div className="hidden text-right sm:block">
                <p className="text-xs app-text-muted">Logged in as</p>
                <p className="mt-0.5 text-xs font-semibold" style={{ color }}>
                  {sessionRoleName}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
          <div className="mx-auto w-full max-w-[1500px]">
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="mb-8 flex flex-wrap items-center justify-between gap-5"
            >
              <div className="flex items-center gap-4">
                <div
                  className="rounded-2xl border p-4"
                  style={{
                    ...tint(color, { bg: 14, border: 32 }),
                    boxShadow: `0 0 30px -12px color-mix(in srgb, ${color} 70%, transparent)`,
                  }}
                >
                  <RoleIcon size={30} style={{ color }} />
                </div>

                <div>
                  <h1 className="font-display text-2xl font-bold app-text">{roleName}</h1>
                  <p className="mt-1 text-sm app-text-secondary">{subtitle}</p>
                </div>
              </div>

              <div
                className="flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-semibold uppercase tracking-wide sm:hidden"
                style={tint("var(--brand-green)")}
              >
                <span
                  className="h-2 w-2 animate-pulse rounded-full"
                  style={{ backgroundColor: "var(--brand-green)" }}
                />
                Online
              </div>
            </motion.section>

            {stats.length > 0 && (
              <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                {stats.map((stat, index) => {
                  const StatIcon = stat.icon;

                  return (
                    <motion.article
                      key={`${stat.label}-${index}`}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.06 }}
                      className="app-card group relative overflow-hidden rounded-2xl p-4 sm:p-5"
                    >
                      <div
                        className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl transition group-hover:opacity-40"
                        style={{ backgroundColor: color }}
                      />

                      <StatIcon size={20} className="relative z-10" style={{ color }} />

                      <p className="font-hud relative z-10 mt-4 text-2xl font-bold app-text sm:text-3xl">
                        {stat.value}
                      </p>

                      <p className="relative z-10 mt-1 text-[10px] uppercase tracking-wide app-text-muted sm:text-xs">
                        {stat.label}
                      </p>
                    </motion.article>
                  );
                })}
              </section>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.1 }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Eyebrow({ children, className = "" }) {
  return (
    <p className={`font-hud text-[10px] font-semibold uppercase tracking-[0.18em] app-text-muted ${className}`}>
      {children}
    </p>
  );
}
