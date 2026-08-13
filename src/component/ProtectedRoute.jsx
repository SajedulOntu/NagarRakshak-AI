import { Navigate, useLocation } from "react-router-dom";

import {
  clearSession,
  getDashboardPath,
  getSession,
  USER_ROLES,
} from "../utils/auth.js";

const VALID_ROLES = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.DNCC_NORTH,
  USER_ROLES.DNCC_SOUTH,
  USER_ROLES.MAINTENANCE,
];

export default function ProtectedRoute({
  children,
  allowedRoles = [],
}) {
  const location = useLocation();
  const session = getSession();

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  const hasValidSession =
    session.email &&
    VALID_ROLES.includes(session.role);

  if (!hasValidSession) {
    clearSession();

    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  const routeHasRoleRestriction =
    Array.isArray(allowedRoles) &&
    allowedRoles.length > 0;

  const userHasPermission =
    !routeHasRoleRestriction ||
    allowedRoles.includes(session.role);

  if (!userHasPermission) {
    return (
      <Navigate
        to={getDashboardPath(session.role)}
        replace
      />
    );
  }

  return children;
}