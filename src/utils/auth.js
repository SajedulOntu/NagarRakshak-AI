const SESSION_KEY = "dhakaipakhiSession";

export const USER_ROLES = {
  SUPER_ADMIN: "super-admin",
  DNCC_NORTH: "dncc-north",
  DNCC_SOUTH: "dncc-south",
  MAINTENANCE: "maintenance",
};

export const ROLE_DASHBOARDS = {
  [USER_ROLES.SUPER_ADMIN]:
    "/dashboard/super-admin",

  [USER_ROLES.DNCC_NORTH]:
    "/dashboard/dncc-north",

  [USER_ROLES.DNCC_SOUTH]:
    "/dashboard/dncc-south",

  [USER_ROLES.MAINTENANCE]:
    "/dashboard/maintenance",
};

const VALID_ROLES =
  Object.values(USER_ROLES);

export function saveSession(user) {
  if (
    !user ||
    typeof user !== "object"
  ) {
    throw new Error(
      "A valid user object is required.",
    );
  }

  const email = String(
    user.email || "",
  )
    .trim()
    .toLowerCase();

  const role = String(
    user.role || "",
  ).trim();

  const token = String(
    user.token || "",
  ).trim();

  if (!email || !role) {
    throw new Error(
      "User email and role are required.",
    );
  }

  if (
    !VALID_ROLES.includes(role)
  ) {
    throw new Error(
      "The selected user role is invalid.",
    );
  }

  if (!token) {
    throw new Error(
      "Authentication token is required.",
    );
  }

  const session = {
    id:
      user.id ||
      user._id ||
      "",

    name:
      String(
        user.name || "",
      ).trim() ||
      user.roleName ||
      "",

    email,

    role,

    token,

    roleName:
      String(
        user.roleName || "",
      ).trim(),

    organization:
      String(
        user.organization || "",
      ).trim(),

    phone:
      String(
        user.phone || "",
      ).trim(),

    rememberDevice:
      Boolean(
        user.rememberDevice,
      ),

    loggedInAt:
      user.loginAt ||
      user.loggedInAt ||
      new Date().toISOString(),
  };

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(session),
  );

  return session;
}

export function getSession() {
  try {
    const storedSession =
      localStorage.getItem(
        SESSION_KEY,
      );

    if (!storedSession) {
      return null;
    }

    const session =
      JSON.parse(
        storedSession,
      );

    const hasValidEmail =
      typeof session?.email ===
        "string" &&
      session.email.trim().length > 0;

    const hasValidRole =
      VALID_ROLES.includes(
        session?.role,
      );

    const hasToken =
      typeof session?.token ===
        "string" &&
      session.token.trim().length > 0;

    if (
      !hasValidEmail ||
      !hasValidRole ||
      !hasToken
    ) {
      clearSession();

      return null;
    }

    return {
      id:
        session.id || "",

      name:
        session.name || "",

      email:
        session.email
          .trim()
          .toLowerCase(),

      role:
        session.role,

      token:
        session.token,

      roleName:
        session.roleName || "",

      organization:
        session.organization || "",

      phone:
        session.phone || "",

      rememberDevice:
        Boolean(
          session.rememberDevice,
        ),

      loggedInAt:
        session.loggedInAt || "",
    };
  } catch (error) {
    console.error(
      "Unable to read login session:",
      error,
    );

    clearSession();

    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(
    SESSION_KEY,
  );
}

export function isAuthenticated() {
  return Boolean(
    getSession(),
  );
}

export function getDashboardPath(
  role,
) {
  return (
    ROLE_DASHBOARDS[role] ||
    "/login"
  );
}

export function hasAllowedRole(
  allowedRoles = [],
) {
  const session =
    getSession();

  if (!session) {
    return false;
  }

  if (
    !Array.isArray(
      allowedRoles,
    ) ||
    allowedRoles.length === 0
  ) {
    return true;
  }

  return allowedRoles.includes(
    session.role,
  );
}