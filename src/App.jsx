import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import MaintenanceGate from "./components/MaintenanceGate";
import TwoFactorNudge from "./components/TwoFactorNudge";
import { lazy, Suspense } from "react";
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
import BugReportIcon from "@mui/icons-material/BugReport";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import GroupIcon from "@mui/icons-material/Group";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import CampaignIcon from "@mui/icons-material/Campaign";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import CodeIcon from "@mui/icons-material/Code";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";

// Layout
import DashboardLayout from "./components/layout/DashboardLayout";

// Route-level code splitting — each page becomes its own chunk loaded on
// demand. This is the big win: previously every page (incl. charts/recharts and
// the heavy dev dashboard) was in one ~1.3MB bundle downloaded up front.
// Auth
const Login = lazy(() => import("./pages/auth/Login"));
const Verify = lazy(() => import("./pages/auth/Verify"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const SecurityPage = lazy(() => import("./pages/account/SecurityPage"));
const ProfilePage = lazy(() => import("./pages/account/ProfilePage"));
const DevTeamPage = lazy(() => import("./pages/dev/DevDashboard").then((m) => ({ default: m.DevTeamPanel })));
const DevUsersPage = lazy(() => import("./pages/dev/DevDashboard").then((m) => ({ default: m.UsersRolesPanel })));
const DevSystemPage = lazy(() => import("./pages/dev/DevDashboard").then((m) => ({ default: m.MaintenancePanel })));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const VehicleList = lazy(() => import("./pages/admin/VehicleList"));
const VehicleForm = lazy(() => import("./pages/admin/VehicleForm"));
const DriverList = lazy(() => import("./pages/admin/DriverList"));
const DriverForm = lazy(() => import("./pages/admin/DriverForm"));
const DriverSalesPage = lazy(() => import("./pages/admin/DriverSalesPage"));
const VehicleHistoryPage = lazy(() => import("./pages/admin/VehicleHistoryPage"));
const DriverHistoryPage = lazy(() => import("./pages/admin/DriverHistoryPage"));
const AlertsPage = lazy(() => import("./pages/admin/AlertsPage"));
const TeamPage = lazy(() => import("./pages/admin/TeamPage"));
const ApplicationsPage = lazy(() => import("./pages/admin/ApplicationsPage"));
const MessagingPage = lazy(() => import("./pages/admin/MessagingPage"));
const RevenuePage = lazy(() => import("./pages/admin/RevenuePage"));
const ActivityLogsPage = lazy(() => import("./pages/admin/ActivityLogsPage"));
const VehicleInspectionPage = lazy(() => import("./pages/admin/VehicleInspectionPage"));
const PromotionsPage = lazy(() => import("./pages/admin/PromotionsPage"));
const GalleryPage = lazy(() => import("./pages/admin/GalleryPage"));

// Analytics
const AnalyticsPage = lazy(() => import("./pages/analytics/AnalyticsPage"));

// Fleet Manager pages
const ManagerDashboard = lazy(() => import("./pages/fleet-manager/ManagerDashboard"));
const ManagerSchedules = lazy(() => import("./pages/fleet-manager/ManagerSchedules"));

// Driver pages
const DriverDashboard = lazy(() => import("./pages/driver/DriverDashboard"));
const DriverSchedule = lazy(() => import("./pages/driver/DriverSchedule"));

// Dev pages
const DevDashboard = lazy(() => import("./pages/dev/DevDashboard"));

// ── Nav configs ──────────────────────────────────────────────────────
const ADMIN_NAV = [
  { label: "Dashboard", icon: <DashboardIcon />, to: "/admin/dashboard" },
  { label: "Analytics", icon: <BarChartIcon />,  to: "/admin/analytics" },
  { label: "Fleet", icon: <LocalShippingIcon />, children: [
    { label: "Vehicles",     icon: <DirectionsBusIcon />,  to: "/admin/vehicles"     },
    { label: "Drivers",      icon: <PeopleIcon />,         to: "/admin/drivers"      },
    { label: "Applications", icon: <AssignmentIndIcon />,  to: "/admin/applications" },
    { label: "Promotions",   icon: <LocalOfferIcon />,     to: "/admin/promotions"   },
  ] },
  { label: "Alerts",    icon: <WarningAmberIcon />, to: "/admin/alerts"  },
  { label: "Revenue",   icon: <AttachMoneyIcon />,  to: "/admin/revenue" },
  { label: "Gallery",   icon: <PhotoLibraryIcon />, to: "/admin/gallery" },
  { label: "Messaging", icon: <CampaignIcon />,     to: "/admin/messaging" },
  { label: "divider-team", divider: true },
  { label: "Team",         icon: <GroupIcon />,     to: "/admin/team"      },
  { label: "Activity Logs",icon: <FactCheckIcon />, to: "/admin/activity"  },
];

const DEV_NAV = [
  { label: "Dev Dashboard", icon: <BugReportIcon />, to: "/dev/dashboard" },
  { label: "Dev Team", icon: <CodeIcon />, to: "/dev/team" },
  { label: "Users & Roles", icon: <ManageAccountsIcon />, to: "/dev/users" },
  { label: "System", icon: <BuildCircleIcon />, to: "/dev/system" },
];

const MANAGER_NAV = [
  { label: "Dashboard", icon: <DashboardIcon />, to: "/manager/dashboard" },
  { label: "Analytics", icon: <BarChartIcon />, to: "/manager/analytics" },
  { label: "Fleet", icon: <LocalShippingIcon />, children: [
    { label: "Vehicles", icon: <DirectionsBusIcon />, to: "/manager/vehicles" },
    { label: "Drivers",  icon: <PeopleIcon />,        to: "/manager/drivers"  },
  ] },
  { label: "Schedules", icon: <CalendarMonthIcon />, to: "/manager/schedules" },
  { label: "Alerts", icon: <WarningAmberIcon />, to: "/manager/alerts" },
  { label: "Messaging", icon: <CampaignIcon />, to: "/manager/messaging" },
];

const DRIVER_NAV = [
  { label: "Dashboard", icon: <HomeIcon />, to: "/driver/dashboard" },
  { label: "My Schedule", icon: <CalendarMonthIcon />, to: "/driver/schedule" },
];

// ── Auth guard ───────────────────────────────────────────────────────
const ROLE_HOME = {
  admin: "/admin/dashboard",
  fleet_manager: "/manager/dashboard",
  driver: "/driver/dashboard",
  developer: "/dev/dashboard",
};
const roleHome = (role) => ROLE_HOME[role] || "/login";

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
  // Authenticated but wrong role → bounce to their OWN dashboard, never expose
  // the page. (Hard block on URL bypass.)
  // Multi-role aware: pass if ANY of the user's roles is allowed.
  const have = user.roles?.length ? user.roles : (user.role ? [user.role] : []);
  const primary = have[0] || user.role;
  if (roles && !roles.some((r) => have.includes(r)))
    return <Navigate to={roleHome(primary)} replace />;

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
const DevLayout = ({ children }) => (
  <DashboardLayout navItems={DEV_NAV}>{children}</DashboardLayout>
);

// ── App ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <MaintenanceGate>
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
          <CircularProgress />
        </Box>
      }
    >
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
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
        path="/admin/vehicles/:id/inspections"
        element={
          <RequireAuth roles={["admin"]}>
            <AdminLayout>
              <VehicleInspectionPage />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/vehicles/:id/history"
        element={
          <RequireAuth roles={["admin"]}>
            <AdminLayout>
              <VehicleHistoryPage />
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
        path="/admin/drivers/:id/sales"
        element={
          <RequireAuth roles={["admin"]}>
            <AdminLayout>
              <DriverSalesPage />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/drivers/:id/history"
        element={
          <RequireAuth roles={["admin"]}>
            <AdminLayout>
              <DriverHistoryPage />
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
        path="/admin/activity"
        element={
          <RequireAuth roles={["admin"]}>
            <AdminLayout>
              <ActivityLogsPage />
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
      <Route
        path="/admin/revenue"
        element={
          <RequireAuth roles={["admin"]}>
            <AdminLayout>
              <RevenuePage />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/promotions"
        element={
          <RequireAuth roles={["admin"]}>
            <AdminLayout>
              <PromotionsPage />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/team"
        element={
          <RequireAuth roles={["admin"]}>
            <AdminLayout>
              <TeamPage />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/gallery"
        element={
          <RequireAuth roles={["admin"]}>
            <AdminLayout>
              <GalleryPage />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/applications"
        element={
          <RequireAuth roles={["admin"]}>
            <AdminLayout>
              <ApplicationsPage />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/messaging"
        element={
          <RequireAuth roles={["admin"]}>
            <AdminLayout>
              <MessagingPage />
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
        path="/manager/vehicles/:id/inspections"
        element={
          <RequireAuth roles={["fleet_manager"]}>
            <ManagerLayout>
              <VehicleInspectionPage />
            </ManagerLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/manager/vehicles/:id/history"
        element={
          <RequireAuth roles={["fleet_manager"]}>
            <ManagerLayout>
              <VehicleHistoryPage />
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
        path="/manager/drivers/:id/history"
        element={
          <RequireAuth roles={["fleet_manager"]}>
            <ManagerLayout>
              <DriverHistoryPage />
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
      <Route
        path="/manager/messaging"
        element={
          <RequireAuth roles={["fleet_manager"]}>
            <ManagerLayout>
              <MessagingPage />
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

      {/* Developer */}
      <Route
        path="/dev/dashboard"
        element={
          <RequireAuth roles={["developer"]}>
            <DevLayout>
              <DevDashboard />
            </DevLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/dev/team"
        element={
          <RequireAuth roles={["developer"]}>
            <DevLayout>
              <DevTeamPage />
            </DevLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/dev/users"
        element={
          <RequireAuth roles={["developer"]}>
            <DevLayout>
              <DevUsersPage />
            </DevLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/dev/system"
        element={
          <RequireAuth roles={["developer"]}>
            <DevLayout>
              <DevSystemPage />
            </DevLayout>
          </RequireAuth>
        }
      />
      <Route path="/dev" element={<Navigate to="/dev/dashboard" replace />} />

      {/* Catch-all */}
      <Route
        path="/security"
        element={
          <RequireAuth roles={["admin", "fleet_manager", "driver", "developer"]}>
            <SecurityPage />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth roles={["admin", "fleet_manager", "driver", "developer"]}>
            <ProfilePage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </Suspense>
    <TwoFactorNudge />
    </MaintenanceGate>
  );
}
