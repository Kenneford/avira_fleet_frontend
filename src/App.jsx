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
import BugReportIcon from "@mui/icons-material/BugReport";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import GroupIcon from "@mui/icons-material/Group";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import CampaignIcon from "@mui/icons-material/Campaign";

// Layout
import DashboardLayout from "./components/layout/DashboardLayout";

// Auth
import Login from "./pages/auth/Login";
import Verify from "./pages/auth/Verify";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import VehicleList from "./pages/admin/VehicleList";
import VehicleForm from "./pages/admin/VehicleForm";
import DriverList from "./pages/admin/DriverList";
import DriverForm from "./pages/admin/DriverForm";
import AlertsPage from "./pages/admin/AlertsPage";
import TeamPage from "./pages/admin/TeamPage";
import ApplicationsPage from "./pages/admin/ApplicationsPage";
import MessagingPage from "./pages/admin/MessagingPage";
import RevenuePage from "./pages/admin/RevenuePage";
import PromotionsPage from "./pages/admin/PromotionsPage";
import GalleryPage from "./pages/admin/GalleryPage";

// Analytics
import AnalyticsPage from "./pages/analytics/AnalyticsPage";

// Fleet Manager pages
import ManagerDashboard from "./pages/fleet-manager/ManagerDashboard";
import ManagerSchedules from "./pages/fleet-manager/ManagerSchedules";

// Driver pages
import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverSchedule from "./pages/driver/DriverSchedule";

// Dev pages
import DevDashboard from "./pages/dev/DevDashboard";

// ── Nav configs ──────────────────────────────────────────────────────
const ADMIN_NAV = [
  { label: "Dashboard", icon: <DashboardIcon />,      to: "/admin/dashboard"  },
  { label: "Analytics", icon: <BarChartIcon />,        to: "/admin/analytics"  },
  { label: "Vehicles",  icon: <DirectionsBusIcon />,   to: "/admin/vehicles"   },
  { label: "Drivers",   icon: <PeopleIcon />,          to: "/admin/drivers"    },
  { label: "Alerts",    icon: <WarningAmberIcon />,    to: "/admin/alerts"     },
  { label: "Revenue",   icon: <AttachMoneyIcon />,     to: "/admin/revenue"    },
  { label: "Promotions",icon: <LocalOfferIcon />,      to: "/admin/promotions" },
  { label: "Gallery",   icon: <PhotoLibraryIcon />,    to: "/admin/gallery"    },
  { label: "divider-team", divider: true },
  { label: "Team",        icon: <GroupIcon />,          to: "/admin/team"         },
  { label: "Applications",icon: <AssignmentIndIcon />,  to: "/admin/applications" },
  { label: "Messaging",   icon: <CampaignIcon />,       to: "/admin/messaging"    },
];

const DEV_NAV = [
  { label: "Dev Dashboard", icon: <BugReportIcon />, to: "/dev/dashboard" },
];

const MANAGER_NAV = [
  { label: "Dashboard", icon: <DashboardIcon />, to: "/manager/dashboard" },
  { label: "Analytics", icon: <BarChartIcon />, to: "/manager/analytics" },
  { label: "Vehicles", icon: <DirectionsBusIcon />, to: "/manager/vehicles" },
  { label: "Drivers", icon: <PeopleIcon />, to: "/manager/drivers" },
  { label: "Schedules", icon: <CalendarMonthIcon />, to: "/manager/schedules" },
  { label: "Alerts", icon: <WarningAmberIcon />, to: "/manager/alerts" },
  { label: "Messaging", icon: <CampaignIcon />, to: "/manager/messaging" },
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
const DevLayout = ({ children }) => (
  <DashboardLayout navItems={DEV_NAV}>{children}</DashboardLayout>
);

// ── App ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/verify" element={<Verify />} />
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
      <Route path="/dev" element={<Navigate to="/dev/dashboard" replace />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
