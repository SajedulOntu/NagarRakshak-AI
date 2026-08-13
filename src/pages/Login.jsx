import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertCircle,
  Building2,
  Eye,
  EyeOff,
  Landmark,
  Loader2,
  Lock,
  Mail,
  Shield,
  Wrench,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import {
  getDashboardPath,
  getSession,
  saveSession,
  USER_ROLES,
} from "../utils/auth.js";

const roles = [
  {
    id: USER_ROLES.SUPER_ADMIN,
    name: "Super Admin",
    icon: Shield,
    color: "#e11d48",
    tag: "ROOT ACCESS",
  },
  {
    id: USER_ROLES.DNCC_NORTH,
    name: "DNCC North",
    icon: Building2,
    color: "#f59e0b",
    tag: "CIVIC OPS · NORTH",
  },
  {
    id: USER_ROLES.DNCC_SOUTH,
    name: "DNCC South",
    icon: Landmark,
    color: "#0ea5e9",
    tag: "CIVIC OPS · SOUTH",
  },
  {
    id: USER_ROLES.MAINTENANCE,
    name: "Maintenance Team",
    icon: Wrench,
    color: "#22c55e",
    tag: "FIELD UNIT",
  },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getRoleById(roleId) {
  return roles.find((role) => role.id === roleId) || roles[0];
}

function CornerBrackets({ color }) {
  const base =
    "pointer-events-none absolute h-6 w-6 border-solid opacity-70 transition-colors duration-500";

  return (
    <>
      <span
        className={`${base} left-0 top-0 rounded-tl-2xl border-l-2 border-t-2`}
        style={{ borderColor: color }}
      />

      <span
        className={`${base} right-0 top-0 rounded-tr-2xl border-r-2 border-t-2`}
        style={{ borderColor: color }}
      />

      <span
        className={`${base} bottom-0 left-0 rounded-bl-2xl border-b-2 border-l-2`}
        style={{ borderColor: color }}
      />

      <span
        className={`${base} bottom-0 right-0 rounded-br-2xl border-b-2 border-r-2`}
        style={{ borderColor: color }}
      />
    </>
  );
}

export default function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState(roles[0]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const existingSession = getSession();

  function validate() {
    const nextErrors = {};
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      nextErrors.email = "Official email is required.";
    } else if (!EMAIL_REGEX.test(cleanEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    } else if (password.length < 6) {
      nextErrors.password =
        "Password must contain at least 6 characters.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function handleRoleChange(selectedRole) {
    if (loading) {
      return;
    }

    setRole(selectedRole);

    setErrors((currentErrors) => ({
      ...currentErrors,
      general: "",
    }));
  }

  async function handleLogin(event) {
    event.preventDefault();

    if (loading || !validate()) {
      return;
    }

    setLoading(true);
    setErrors({});

    const cleanEmail = email.trim().toLowerCase();

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
            password,
            role: role.id,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to log in.",
        );
      }

      const selectedRole = getRoleById(data.user.role);

      saveSession({
        id: data.user.id,
        name: data.user.name || selectedRole.name,
        email: data.user.email,
        role: data.user.role,
        roleName: selectedRole.name,
        token: data.token,
        rememberDevice,
        loginAt: new Date().toISOString(),
      });

      window.setTimeout(() => {
        setLoading(false);

        navigate(getDashboardPath(data.user.role), {
          replace: true,
        });
      }, 500);
    } catch (error) {
      console.error("Unable to log in:", error);

      setLoading(false);

      setErrors({
        general:
          error.message ||
          "Unable to connect to the server. Please try again.",
      });
    }
  }

  function continueExistingSession() {
    const session = getSession();

    if (!session) {
      return;
    }

    navigate(getDashboardPath(session.role), {
      replace: true,
    });
  }

  return (
    <main
      className="relative min-h-dvh overflow-x-hidden bg-cover bg-center bg-fixed bg-no-repeat px-4 py-8 text-white sm:px-6 lg:py-12"
      style={{
        backgroundImage:
          "linear-gradient(rgba(2, 6, 23, 0.78), rgba(2, 6, 23, 0.94)), url('/images/dhaka-login-bg.jpg')",
      }}
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 hud-grid-bg opacity-30" />

      <motion.div
        aria-hidden="true"
        animate={{
          background: `radial-gradient(circle, ${role.color}22 0%, transparent 70%)`,
          scale: [1, 1.12, 1],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none fixed left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl sm:h-[650px] sm:w-[650px]"
      />

      <motion.section
        initial={{ opacity: 0, y: 36 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 mx-auto w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/85 p-5 shadow-[0_20px_70px_-15px_rgba(0,0,0,0.7)] backdrop-blur-xl sm:p-8"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 right-0 h-20 animate-[scan-sweep_4s_linear_infinite]"
          style={{
            background: `linear-gradient(to bottom, transparent, ${role.color}14, transparent)`,
          }}
        />

        <CornerBrackets color={role.color} />

        <header className="relative z-10 text-center">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white p-2 transition-colors duration-500 sm:h-24 sm:w-24"
            style={{
              boxShadow: `0 8px 30px -6px ${role.color}55`,
            }}
          >
            <img
              src="/images/dhakaipakhi-logo.jpg"
              alt="DhakAI-PAKHI logo"
              className="h-full w-full object-contain"
            />
          </motion.div>

          <h1 className="mt-5 bg-gradient-to-r from-cyan-300 via-white to-sky-300 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
            DhakAI-PAKHI
          </h1>

          <p className="mx-auto mt-2 max-w-md text-[10px] uppercase leading-5 tracking-[0.12em] text-gray-400 sm:text-xs">
            Smart Eyes in the Sky for a Cleaner Dhaka
          </p>
        </header>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="relative z-10 mt-5 flex items-center justify-center gap-2 text-xs text-emerald-400 sm:mt-6 sm:text-sm"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.5)]" />

          <Activity size={16} />

          <span>SYSTEM ONLINE</span>
        </motion.div>

        <AnimatePresence>
          {existingSession && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="relative z-10 mt-5 rounded-xl border border-sky-400/20 bg-sky-400/[0.06] p-3 text-center"
            >
              <p className="text-xs text-slate-400">
                An active session was found for{" "}
                <span className="font-semibold text-white">
                  {existingSession.roleName || existingSession.role}
                </span>
                .
              </p>

              <button
                type="button"
                onClick={continueExistingSession}
                className="mt-2 rounded-lg px-3 py-1 text-xs font-semibold text-sky-400 transition hover:bg-sky-400/10 hover:text-sky-300"
              >
                Continue to dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form
          onSubmit={handleLogin}
          noValidate
          className="relative z-10"
        >
          <h2 className="mt-6 text-xs uppercase tracking-widest text-gray-400 sm:mt-8">
            Select Access Portal
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {roles.map((item, index) => {
              const Icon = item.icon;
              const selected = role.id === item.id;

              return (
                <motion.button
                  key={item.id}
                  type="button"
                  disabled={loading}
                  onClick={() => handleRoleChange(item)}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.08, duration: 0.4 }}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex min-h-24 items-center gap-3 rounded-2xl border p-4 text-left transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-60 sm:block sm:text-center"
                  style={{
                    borderColor: selected
                      ? item.color
                      : "rgba(255,255,255,0.08)",

                    background: selected
                      ? `linear-gradient(135deg, ${item.color}26, ${item.color}0d)`
                      : "rgba(255,255,255,0.02)",

                    boxShadow: selected
                      ? `0 8px 24px -8px ${item.color}66, inset 0 0 0 1px ${item.color}33`
                      : "none",
                  }}
                >
                  <Icon
                    size={24}
                    className="shrink-0 sm:mx-auto"
                    style={{
                      color: selected ? item.color : "#9ca3af",
                    }}
                  />

                  <div className="min-w-0">
                    <p
                      className="mt-0 text-xs font-medium sm:mt-2"
                      style={{
                        color: selected ? "white" : "#9ca3af",
                      }}
                    >
                      {item.name}
                    </p>

                    <p
                      className="mt-1 truncate text-[9px] tracking-wider sm:mt-0.5"
                      style={{
                        color: selected ? item.color : "#4b5563",
                      }}
                    >
                      {item.tag}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {role.id === USER_ROLES.SUPER_ADMIN && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-5 overflow-hidden rounded-xl border border-rose-400/15 bg-rose-400/[0.06] p-3 text-xs text-rose-200"
              >
                Super Admin access requires an authorized database account.
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6">
            <label
              htmlFor="official-email"
              className="mb-2 block text-xs text-gray-400"
            >
              Official email
            </label>

            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                size={18}
              />

              <input
                id="official-email"
                type="email"
                value={email}
                disabled={loading}
                onChange={(event) => {
                  setEmail(event.target.value);

                  setErrors((currentErrors) => ({
                    ...currentErrors,
                    email: "",
                    general: "",
                  }));
                }}
                placeholder="name@organization.gov.bd"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                className="w-full rounded-xl border bg-black/30 py-3 pl-12 pr-4 text-sm text-white outline-none transition focus:border-sky-400/40 focus:ring-2 focus:ring-sky-400/15 disabled:cursor-not-allowed disabled:opacity-60 placeholder:text-gray-600"
                style={{
                  borderColor: errors.email
                    ? "#e11d48"
                    : "rgba(255,255,255,0.08)",
                }}
              />
            </div>

            <AnimatePresence>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-1.5 flex items-center gap-1 text-xs text-rose-400"
                >
                  <AlertCircle size={12} />
                  {errors.email}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-4">
            <label
              htmlFor="login-password"
              className="mb-2 block text-xs text-gray-400"
            >
              Password
            </label>

            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                size={18}
              />

              <input
                id="login-password"
                type={passwordVisible ? "text" : "password"}
                value={password}
                disabled={loading}
                onChange={(event) => {
                  setPassword(event.target.value);

                  setErrors((currentErrors) => ({
                    ...currentErrors,
                    password: "",
                    general: "",
                  }));
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                className="w-full rounded-xl border bg-black/30 py-3 pl-12 pr-12 text-sm text-white outline-none transition focus:border-sky-400/40 focus:ring-2 focus:ring-sky-400/15 disabled:cursor-not-allowed disabled:opacity-60 placeholder:text-gray-600"
                style={{
                  borderColor: errors.password
                    ? "#e11d48"
                    : "rgba(255,255,255,0.08)",
                }}
              />

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  setPasswordVisible((currentValue) => !currentValue)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-500 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed"
                aria-label={
                  passwordVisible
                    ? "Hide password"
                    : "Show password"
                }
              >
                {passwordVisible ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            <AnimatePresence>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-1.5 flex items-center gap-1 text-xs text-rose-400"
                >
                  <AlertCircle size={12} />
                  {errors.password}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <label className="flex cursor-pointer select-none items-center gap-2 text-gray-400">
              <input
                type="checkbox"
                checked={rememberDevice}
                disabled={loading}
                onChange={(event) =>
                  setRememberDevice(event.target.checked)
                }
                className="h-4 w-4 rounded accent-sky-500"
              />

              <span>Remember this device</span>
            </label>

            <span className="text-gray-600">
              Contact administrator for password recovery
            </span>
          </div>

          <AnimatePresence>
            {errors.general && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                role="alert"
                className="mt-4 flex items-center justify-center gap-1 rounded-lg border border-rose-400/15 bg-rose-400/[0.06] p-3 text-center text-xs text-rose-400"
              >
                <AlertCircle size={13} />
                {errors.general}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.015 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white transition-shadow duration-300 disabled:cursor-not-allowed disabled:opacity-70"
            style={{
              background: `linear-gradient(135deg, ${role.color}, ${role.color}cc)`,
              boxShadow: `0 10px 30px -8px ${role.color}80`,
            }}
          >
            {loading ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />

                <span>AUTHENTICATING...</span>
              </>
            ) : (
              "ACCESS SYSTEM"
            )}
          </motion.button>

          <p className="mt-5 text-center text-sm text-gray-400">
            No organization account?{" "}
            <Link
              to="/register"
              className="font-semibold text-sky-400 transition hover:text-sky-300 hover:underline"
            >
              Create Account
            </Link>
          </p>

          <p className="mt-4 text-center text-[10px] tracking-wide text-gray-600">
            Authorized personnel only · All access is logged
          </p>
        </form>
      </motion.section>
    </main>
  );
}