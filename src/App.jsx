import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./component/ProtectedRoute.jsx";
import { USER_ROLES } from "./utils/auth.js";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Admin from "./pages/Admin.jsx";
import DnccNorth from "./pages/DnccNorth.jsx";
import DnccSouth from "./pages/DnccSouth.jsx";
import Maintenance from "./pages/Maintenance.jsx";
import Drone from "./pages/Drone.jsx";
import AI from "./pages/AI.jsx";
import MapPage from "./pages/Map.jsx";
import Alerts from "./pages/Alerts.jsx";
import Teams from "./pages/Teams.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";

const ALL_ROLES = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.DNCC_NORTH,
  USER_ROLES.DNCC_SOUTH,
  USER_ROLES.MAINTENANCE,
];

const AUTHORITY_ROLES = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.DNCC_NORTH,
  USER_ROLES.DNCC_SOUTH,
];

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* Main dashboards */}
        <Route
          path="/dashboard/super-admin"
          element={
            <ProtectedRoute
              allowedRoles={[
                USER_ROLES.SUPER_ADMIN,
              ]}
            >
              <Admin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/dncc-north"
          element={
            <ProtectedRoute
              allowedRoles={[
                USER_ROLES.DNCC_NORTH,
              ]}
            >
              <DnccNorth />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/dncc-south"
          element={
            <ProtectedRoute
              allowedRoles={[
                USER_ROLES.DNCC_SOUTH,
              ]}
            >
              <DnccSouth />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/maintenance"
          element={
            <ProtectedRoute
              allowedRoles={[
                USER_ROLES.MAINTENANCE,
              ]}
            >
              <Maintenance />
            </ProtectedRoute>
          }
        />

        {/* Drone monitoring */}
        <Route
          path="/drone"
          element={
            <ProtectedRoute
              allowedRoles={AUTHORITY_ROLES}
            >
              <Drone />
            </ProtectedRoute>
          }
        />

        {/* AI detection */}
        <Route
          path="/ai"
          element={
            <ProtectedRoute
              allowedRoles={ALL_ROLES}
            >
              <AI />
            </ProtectedRoute>
          }
        />

        {/* Live issue map */}
        <Route
          path="/map"
          element={
            <ProtectedRoute
              allowedRoles={ALL_ROLES}
            >
              <MapPage />
            </ProtectedRoute>
          }
        />

        {/* Alert monitoring */}
        <Route
          path="/alerts"
          element={
            <ProtectedRoute
              allowedRoles={ALL_ROLES}
            >
              <Alerts />
            </ProtectedRoute>
          }
        />

        {/* Team management */}
        <Route
          path="/teams"
          element={
            <ProtectedRoute
              allowedRoles={ALL_ROLES}
            >
              <Teams />
            </ProtectedRoute>
          }
        />

        {/* Reports */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute
              allowedRoles={ALL_ROLES}
            >
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* Portal settings */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute
              allowedRoles={ALL_ROLES}
            >
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Old or incorrect dashboard links */}
        <Route
          path="/admin"
          element={
            <Navigate
              to="/dashboard/super-admin"
              replace
            />
          }
        />

        <Route
          path="/dncc-north"
          element={
            <Navigate
              to="/dashboard/dncc-north"
              replace
            />
          }
        />

        <Route
          path="/dncc-south"
          element={
            <Navigate
              to="/dashboard/dncc-south"
              replace
            />
          }
        />

        <Route
          path="/maintenance"
          element={
            <Navigate
              to="/dashboard/maintenance"
              replace
            />
          }
        />

        {/* Unknown route */}
        <Route
          path="*"
          element={
            <Navigate to="/login" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;