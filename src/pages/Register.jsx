import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  User,
  UserPlus,
  Wrench,
} from "lucide-react";

import {
  getDashboardPath,
  saveSession,
  USER_ROLES,
} from "../utils/auth.js";

const roleOptions = [
  {
    value: USER_ROLES.DNCC_NORTH,
    label: "DNCC North Authority",
    description:
      "Manage infrastructure issues in North Dhaka.",
    icon: Building2,
  },
  {
    value: USER_ROLES.DNCC_SOUTH,
    label: "DNCC South Authority",
    description:
      "Manage infrastructure issues in South Dhaka.",
    icon: ShieldCheck,
  },
  {
    value: USER_ROLES.MAINTENANCE,
    label: "Maintenance Team",
    description:
      "Receive, repair, and complete assigned tasks.",
    icon: Wrench,
  },
];

const roleNames = {
  [USER_ROLES.DNCC_NORTH]: "DNCC North",
  [USER_ROLES.DNCC_SOUTH]: "DNCC South",
  [USER_ROLES.MAINTENANCE]: "Maintenance Team",
};

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePassword(password) {
  return {
    minimumLength: password.length >= 6,
    hasLetter: /[A-Za-z]/.test(password),
    hasNumber: /\d/.test(password),
  };
}

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] =
    useState({
      fullName: "",
      email: "",
      role: USER_ROLES.DNCC_NORTH,
      password: "",
      confirmPassword: "",
    });

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const passwordChecks = useMemo(
    () =>
      validatePassword(
        formData.password,
      ),
    [formData.password],
  );

  const passwordStrength = useMemo(() => {
    const passedChecks =
      Object.values(
        passwordChecks,
      ).filter(Boolean).length;

    if (!formData.password) {
      return {
        label: "Not entered",
        width: "0%",
        className: "bg-gray-700",
      };
    }

    if (passedChecks === 1) {
      return {
        label: "Weak",
        width: "34%",
        className: "bg-red-400",
      };
    }

    if (passedChecks === 2) {
      return {
        label: "Medium",
        width: "67%",
        className: "bg-amber-400",
      };
    }

    return {
      label: "Strong",
      width: "100%",
      className: "bg-emerald-400",
    };
  }, [
    formData.password,
    passwordChecks,
  ]);

  function updateFormData(
    field,
    value,
  ) {
    setFormData((currentData) => ({
      ...currentData,
      [field]: value,
    }));

    setErrorMessage("");
  }

  async function handleRegister(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const fullName = formData.fullName.trim();
    const email = formData.email.trim().toLowerCase();

    if (!fullName) {
      setErrorMessage("Enter your full name.");
      return;
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      setErrorMessage("Enter a valid email address.");
      return;
    }

    if (
      !roleOptions.some(
        (option) => option.value === formData.role,
      )
    ) {
      setErrorMessage("Select a valid account role.");
      return;
    }

    if (
      !passwordChecks.minimumLength ||
      !passwordChecks.hasLetter ||
      !passwordChecks.hasNumber
    ) {
      setErrorMessage(
        "Password must contain at least 6 characters, one letter, and one number.",
      );
      return;
    }

    if (
      formData.password !== formData.confirmPassword
    ) {
      setErrorMessage(
        "Password confirmation does not match.",
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: fullName,
            email,
            password: formData.password,
            role: formData.role,
            organization: "DhakAI-PAKHI",
            phone: "",
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to create the account.",
        );
      }

      saveSession({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        roleName:
          roleNames[data.user.role] || data.user.role,
        token: data.token,
        rememberDevice: true,
        loginAt: new Date().toISOString(),
      });

      navigate(
        getDashboardPath(data.user.role),
        {
          replace: true,
        },
      );
    } catch (error) {
      console.error(
        "Unable to register account:",
        error,
      );

      setErrorMessage(
        error.message ||
          "Unable to connect to the server. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 text-white sm:px-6"
      style={{
        backgroundImage:
          "linear-gradient(rgba(2,6,23,0.78), rgba(2,6,23,0.94)), url('/images/dhaka-login-bg.jpg')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.13),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,176,32,0.11),transparent_35%)]" />

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-300">
            <ShieldCheck size={16} />

            DhakAI-PAKHI
          </div>

          <h1 className="mt-6 max-w-xl text-4xl font-black leading-tight xl:text-5xl">
            Join the DhakAI-PAKHI
            platform
          </h1>

          <p className="mt-4 max-w-xl text-sm font-semibold uppercase leading-6 tracking-[0.12em] text-cyan-300">
           Smart Eyes in the Sky for a Cleaner Dhaka
          </p>

          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Register an authority or
            maintenance account to
            monitor infrastructure
            issues, coordinate repair
            teams, and manage
            resolution progress across
            Dhaka.
          </p>

          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-300">
                <Building2
                  size={18}
                />
              </div>

              <div>
                <p className="font-semibold">
                  Authority-specific
                  access
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  North and South
                  portals only display
                  their authorized
                  infrastructure data.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-xl border border-lime-400/20 bg-lime-400/10 p-2 text-lime-300">
                <Wrench size={18} />
              </div>

              <div>
                <p className="font-semibold">
                  Maintenance workflow
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Start assigned work
                  and upload proof when
                  repairs are completed.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-950/85 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
              <UserPlus size={27} />
            </div>

            <h2 className="mt-5 text-2xl font-bold">
              Create Portal Account
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Register for DhakAI-PAKHI and select your authorized portal.
            </p>
          </div>

          <form
            onSubmit={handleRegister}
            className="mt-8 space-y-5"
            noValidate
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="full-name"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400"
                >
                  Full name
                </label>

                <div className="relative">
                  <User
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    id="full-name"
                    type="text"
                    value={
                      formData.fullName
                    }
                    disabled={
                      isSubmitting
                    }
                    onChange={(event) =>
                      updateFormData(
                        "fullName",
                        event.target.value,
                      )
                    }
                    autoComplete="name"
                    maxLength={60}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-email"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    id="register-email"
                    type="email"
                    value={
                      formData.email
                    }
                    disabled={
                      isSubmitting
                    }
                    onChange={(event) =>
                      updateFormData(
                        "email",
                        event.target.value,
                      )
                    }
                    autoComplete="email"
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Account role
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {roleOptions.map(
                  (option) => {
                    const Icon =
                      option.icon;

                    const selected =
                      formData.role ===
                      option.value;

                    return (
                      <label
                        key={
                          option.value
                        }
                        className={`cursor-pointer rounded-2xl border p-4 transition ${
                          selected
                            ? "border-cyan-400/40 bg-cyan-400/10"
                            : "border-white/10 bg-black/20 hover:border-white/20"
                        } ${
                          isSubmitting
                            ? "cursor-not-allowed opacity-60"
                            : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="registration-role"
                          value={
                            option.value
                          }
                          checked={
                            selected
                          }
                          disabled={
                            isSubmitting
                          }
                          onChange={(
                            event,
                          ) =>
                            updateFormData(
                              "role",
                              event.target
                                .value,
                            )
                          }
                          className="sr-only"
                        />

                        <Icon
                          size={21}
                          className={
                            selected
                              ? "text-cyan-300"
                              : "text-slate-500"
                          }
                        />

                        <p className="mt-3 text-sm font-semibold">
                          {
                            option.label
                          }
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {
                            option.description
                          }
                        </p>
                      </label>
                    );
                  },
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="register-password"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400"
                >
                  Password
                </label>

                <div className="relative">
                  <Lock
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    id="register-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      formData.password
                    }
                    disabled={
                      isSubmitting
                    }
                    onChange={(event) =>
                      updateFormData(
                        "password",
                        event.target.value,
                      )
                    }
                    autoComplete="new-password"
                    placeholder="Create password"
                    className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-11 pr-12 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    disabled={
                      isSubmitting
                    }
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current,
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white disabled:cursor-not-allowed"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff
                        size={18}
                      />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <Lock
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    id="confirm-password"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      formData
                        .confirmPassword
                    }
                    disabled={
                      isSubmitting
                    }
                    onChange={(event) =>
                      updateFormData(
                        "confirmPassword",
                        event.target.value,
                      )
                    }
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-11 pr-12 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    disabled={
                      isSubmitting
                    }
                    onClick={() =>
                      setShowConfirmPassword(
                        (current) =>
                          !current,
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white disabled:cursor-not-allowed"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirmation password"
                        : "Show confirmation password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff
                        size={18}
                      />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-semibold text-slate-300">
                  Password strength
                </p>

                <span className="text-xs text-slate-500">
                  {
                    passwordStrength.label
                  }
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all ${passwordStrength.className}`}
                  style={{
                    width:
                      passwordStrength.width,
                  }}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                <span
                  className={
                    passwordChecks.minimumLength
                      ? "text-emerald-300"
                      : "text-slate-500"
                  }
                >
                  At least 6
                  characters
                </span>

                <span
                  className={
                    passwordChecks.hasLetter
                      ? "text-emerald-300"
                      : "text-slate-500"
                  }
                >
                  Contains a letter
                </span>

                <span
                  className={
                    passwordChecks.hasNumber
                      ? "text-emerald-300"
                      : "text-slate-500"
                  }
                >
                  Contains a number
                </span>
              </div>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300"
              >
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UserPlus size={18} />

              {isSubmitting
                ? "Creating Account..."
                : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an
            account?{" "}
            <Link
              to="/login"
              className="font-semibold text-cyan-300 transition hover:text-cyan-200"
            >
              Sign in
            </Link>
          </p>

          <p className="mt-4 text-center text-[11px] leading-5 text-slate-600">
            Account information is securely stored in the DhakAI-PAKHI database.
          </p>
        </div>
      </section>
    </main>
  );
}