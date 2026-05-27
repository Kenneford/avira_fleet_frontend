import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { Box, CircularProgress } from "@mui/material";

// Icons
import DashboardIcon from "@mui/icons-material/Dashboard";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import PeopleIcon from "@mui/icons-material/People";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import HomeIcon from "@mui/icons-material/Home";
import BarChartIcon from "@mui/icons-material/BarChart";

// Layout
import DashboardLayout from "./components/layout/DashboardLayout";

// Auth
import Login from "./pages/auth/Login";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import VehicleList from "./pages/admin/VehicleList";
import VehicleForm from "./pages/admin/VehicleForm";
import DriverList from "./pages/admin/DriverList";
import DriverForm from "./pages/admin/DriverForm";
import AlertsPage from "./pages/admin/AlertsPage";

// Analytics
import AnalyticsPage from "./pages/analytics/AnalyticsPage";

// Fleet Manager pages
import ManagerDashboard from "./pages/fleet-manager/ManagerDashboard";
import ManagerSchedules from "./pages/fleet-manager/ManagerSchedules";

// Driver pages
import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverSchedule from "./pages/driver/DriverSchedule";

// ── Nav configs ──────────────────────────────────────────────────────
const ADMIN_NAV = [
  { label: "Dashboard", icon: <DashboardIcon />, to: "/admin/dashboard" },
  { label: "Analytics", icon: <BarChartIcon />, to: "/admin/analytics" },
  { label: "Vehicles", icon: <DirectionsBusIcon />, to: "/admin/vehicles" },
  { label: "Drivers", icon: <PeopleIcon />, to: "/admin/drivers" },
  { label: "Alerts", icon: <WarningAmberIcon />, to: "/admin/alerts" },
  { divider: true, label: "sep1" },
  { label: "Users", icon: <ManageAccountsIcon />, to: "/admin/users" },
];

const MANAGER_NAV = [
  { label: "Dashboard", icon: <DashboardIcon />, to: "/manager/dashboard" },
  { label: "Analytics", icon: <BarChartIcon />, to: "/manager/analytics" },
  { label: "Vehicles", icon: <DirectionsBusIcon />, to: "/manager/vehicles" },
  { label: "Drivers", icon: <PeopleIcon />, to: "/manager/drivers" },
  { label: "Schedules", icon: <CalendarMonthIcon />, to: "/manager/schedules" },
  { label: "Alerts", icon: <WarningAmberIcon />, to: "/manager/alerts" },
];

const DRIVER_NAV = [
  { label: "Dashboard", icon: <HomeIcon />, to: "/driver/dashboard" },
  { label: "My Schedule", icon: <CalendarMonthIcon />, to: "/driver/schedule" },
];

// ── Auth guard ───────────────────────────────────────────────────────
function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading)
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role))
    return <Navigate to="/login" replace />;

  return children;
}

// ── Layouts ──────────────────────────────────────────────────────────
const AdminLayout = ({ children }) => (
  <DashboardLayout navItems={ADMIN_NAV}>{children}</DashboardLayout>
);
const ManagerLayout = ({ children }) => (
  <DashboardLayout navItems={MANAGER_NAV}>{children}</DashboardLayout>
);
const DriverLayout = ({ children }) => (
  <DashboardLayout navItems={DRIVER_NAV}>{children}</DashboardLayout>
);

// ── App ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <RequireAuth roles={["admin"]}>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <RequireAuth roles={["admin"]}>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/vehicles"
        element={
          <RequireAuth roles={["admin"]}>
            <AdminLayout>
              <VehicleList />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/vehicles/new"
        element={
          <RequireAuth roles={["admin"]}>
            <AdminLayout>
              <VehicleForm />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/vehicles/:id"
        element={
          <RequireAuth roles={["admin"]}>
            <AdminLayout>
              <VehicleForm />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/drivers"
        element={
          <RequireAuth roles={["admin"]}>
            <AdminLayout>
              <DriverList />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/drivers/new"
        element={
          <RequireAuth roles={["admin"]}>
            <AdminLayout>
              <DriverForm />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/drivers/:id"
        element={
          <RequireAuth roles={["admin"]}>
            <AdminLayout>
              <DriverForm />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/alerts"
        element={
          <RequireAuth roles={["admin"]}>
            <AdminLayout>
              <AlertsPage />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <RequireAuth roles={["admin"]}>
            <AdminLayout>
              <AnalyticsPage />
            </AdminLayout>
          </RequireAuth>
        }
      />

      {/* Fleet Manager */}
      <Route
        path="/manager/dashboard"
        element={
          <RequireAuth roles={["fleet_manager"]}>
            <ManagerLayout>
              <ManagerDashboard />
            </ManagerLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/manager/vehicles"
        element={
          <RequireAuth roles={["fleet_manager"]}>
            <ManagerLayout>
              <VehicleList />
            </ManagerLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/manager/vehicles/new"
        element={
          <RequireAuth roles={["fleet_manager"]}>
            <ManagerLayout>
              <VehicleForm />
            </ManagerLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/manager/vehicles/:id"
        element={
          <RequireAuth roles={["fleet_manager"]}>
            <ManagerLayout>
              <VehicleForm />
            </ManagerLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/manager/drivers"
        element={
          <RequireAuth roles={["fleet_manager"]}>
            <ManagerLayout>
              <DriverList />
            </ManagerLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/manager/drivers/new"
        element={
          <RequireAuth roles={["fleet_manager"]}>
            <ManagerLayout>
              <DriverForm />
            </ManagerLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/manager/drivers/:id"
        element={
          <RequireAuth roles={["fleet_manager"]}>
            <ManagerLayout>
              <DriverForm />
            </ManagerLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/manager/schedules"
        element={
          <RequireAuth roles={["fleet_manager"]}>
            <ManagerLayout>
              <ManagerSchedules />
            </ManagerLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/manager/alerts"
        element={
          <RequireAuth roles={["fleet_manager"]}>
            <ManagerLayout>
              <AlertsPage />
            </ManagerLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/manager/analytics"
        element={
          <RequireAuth roles={["fleet_manager"]}>
            <ManagerLayout>
              <AnalyticsPage />
            </ManagerLayout>
          </RequireAuth>
        }
      />

      {/* Driver */}
      <Route
        path="/driver/dashboard"
        element={
          <RequireAuth roles={["driver"]}>
            <DriverLayout>
              <DriverDashboard />
            </DriverLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/driver/schedule"
        element={
          <RequireAuth roles={["driver"]}>
            <DriverLayout>
              <DriverSchedule />
            </DriverLayout>
          </RequireAuth>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
