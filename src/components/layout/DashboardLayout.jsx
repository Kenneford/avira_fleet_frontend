import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  Collapse,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  AppBar,
  Toolbar,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Tooltip,
  useMediaQuery,
  Popover,
  CircularProgress,
  Chip,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import ShieldIcon from "@mui/icons-material/Shield";
import ErrorIcon from "@mui/icons-material/Error";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import BadgeIcon from "@mui/icons-material/Badge";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { useAuth } from "../../contexts/AuthContext";
import { useThemeMode } from "../../contexts/ThemeContext";
import { dashboardAPI, authAPI } from "../../api/client";
import { avatarColor } from "../../utils/helpers";
import styles from "./DashboardLayout.module.scss";

const SIDEBAR_WIDTH = 260;

const TYPE_ICONS = {
  vehicle: <DirectionsBusIcon sx={{ fontSize: "0.85rem" }} />,
  driver: <BadgeIcon sx={{ fontSize: "0.85rem" }} />,
};

export default function DashboardLayout({ navItems, children }) {
  const { user, logout, refreshUser } = useAuth();

  // Password reset (temporary-password flag)
  const [pwDlg, setPwDlg] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwErr, setPwErr] = useState("");

  const submitPassword = async () => {
    setPwErr("");
    if (pw.next.length < 8) { setPwErr("New password must be at least 8 characters."); return; }
    if (pw.next !== pw.confirm) { setPwErr("Passwords don't match."); return; }
    setPwSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: pw.current, newPassword: pw.next });
      await refreshUser();
      setPwDlg(false);
      setPw({ current: "", next: "", confirm: "" });
    } catch (e) {
      setPwErr(e?.response?.data?.message || "Could not update password.");
    } finally {
      setPwSaving(false);
    }
  };
  const { mode, toggleMode } = useThemeMode();
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:960px)");
  const isDark = mode === "dark";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [bellAnchor, setBellAnchor] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // Back navigation — hide on root dashboard pages
  const ROOT_PATHS = ["/admin/dashboard", "/manager/dashboard", "/driver/dashboard", "/dev/dashboard"];
  const canGoBack = !ROOT_PATHS.includes(location.pathname);

  // Alt+Left keyboard shortcut (standard Windows back)
  useEffect(() => {
    const handleKey = (e) => {
      if (e.altKey && e.key === "ArrowLeft" && canGoBack) {
        e.preventDefault();
        navigate(-1);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [canGoBack, navigate]);

  const myRoles = user?.roles?.length ? user.roles : (user?.role ? [user.role] : []);
  const canSeeAlerts = myRoles.includes("admin") || myRoles.includes("fleet_manager");

  const fetchAlerts = useCallback(() => {
    if (!canSeeAlerts) return;
    setAlertsLoading(true);
    dashboardAPI
      .alerts()
      .then(({ data }) => setAlerts(data.data || []))
      .catch(() => setAlerts([]))
      .finally(() => setAlertsLoading(false));
  }, [canSeeAlerts]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleBellOpen = (e) => {
    setBellAnchor(e.currentTarget);
    fetchAlerts();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const totalCount = alerts.length;

  // ── Alert row inside popover ──────────────────────────────────────────────
  const AlertRow = ({ a }) => (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.25,
        px: 2,
        py: 1.25,
        borderBottom: `1px solid ${theme.palette.divider}`,
        background:
          a.severity === "critical"
            ? "rgba(211,47,47,0.05)"
            : "rgba(245,124,0,0.04)",
        "&:last-child": { borderBottom: "none" },
      }}
    >
      <Box
        sx={{
          mt: "2px",
          flexShrink: 0,
          color: a.severity === "critical" ? "error.main" : "warning.main",
        }}
      >
        {a.severity === "critical" ? (
          <ErrorIcon sx={{ fontSize: "1rem" }} />
        ) : (
          <WarningAmberIcon sx={{ fontSize: "1rem" }} />
        )}
      </Box>
      <Box flex={1} minWidth={0}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {a.title}
        </Typography>
        <Box display="flex" alignItems="center" gap={0.75} mt={0.25}>
          <Box
            sx={{
              color: "text.secondary",
              display: "flex",
              alignItems: "center",
            }}
          >
            {TYPE_ICONS[a.entity]}
          </Box>
          <Typography variant="caption" color="text.secondary" noWrap>
            {a.subtitle}
          </Typography>
        </Box>
      </Box>
      <Chip
        label={
          a.days < 0
            ? `${Math.abs(a.days)}d overdue`
            : a.days === 0
              ? "Today"
              : `${a.days}d`
        }
        size="small"
        color={a.severity === "critical" ? "error" : "warning"}
        sx={{ flexShrink: 0, fontSize: "0.65rem", height: 20 }}
      />
    </Box>
  );

  // ── Drawer content ────────────────────────────────────────────────────────
  const drawer = (
    <Box className={styles.drawer} sx={{ bgcolor: "background.paper" }}>
      {/* Logo */}
      <Box
        className={styles.drawerLogo}
        sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
      >
        <Box className={styles.logoBadge}>
          <Box
            component="img"
            src="/assets/logo/avira_logo_new.png"
            alt="Avira Life Transport"
            className={styles.logoImg}
          />
        </Box>
        <Box className={styles.logoText} sx={{ color: "text.primary" }}>
          AVIRA LIFE
          <Box
            component="span"
            className={styles.logoSub}
            sx={{ color: "primary.main" }}
          >
            FLEET
          </Box>
        </Box>
        {isMobile && (
          <IconButton
            onClick={() => setMobileOpen(false)}
            size="small"
            sx={{ ml: "auto", color: "text.secondary" }}
          >
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      {/* Role badge */}
      <Box className={styles.roleTag}>
        <Box
          component="span"
          className={styles.roleBadge}
          sx={{
            color: "primary.main",
            bgcolor: (t) => `${t.palette.primary.main}18`,
            border: (t) => `1px solid ${t.palette.primary.main}33`,
          }}
        >
          {(myRoles.length ? myRoles : [user?.role]).filter(Boolean).map((r) => r.replace("_", " ").toUpperCase()).join(" · ")}
        </Box>
      </Box>

      {/* Nav items — scrolls when the list grows beyond the available height */}
      <List sx={{ px: 1, pt: 0.5, flex: 1, minHeight: 0, overflowY: "auto" }}>
        {navItems.map((item) => {
          const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + "/");
          if (item.divider) return <Divider key={item.label} sx={{ my: 1 }} />;

          // Collapsible group with sub-links.
          if (item.children) {
            const groupActive = item.children.some((c) => isActive(c.to));
            const open = openGroups[item.label] ?? groupActive;
            return (
              <Box key={item.label}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => setOpenGroups((g) => ({ ...g, [item.label]: !open }))}
                    selected={groupActive && !open}
                    sx={{ py: 1 }}
                  >
                    <ListItemIcon sx={{ "& .MuiSvgIcon-root": { fontSize: "1.3rem" } }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600 }} />
                    {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                  </ListItemButton>
                </ListItem>
                <Collapse in={open} timeout="auto" unmountOnExit>
                  <List disablePadding>
                    {item.children.map((c) => (
                      <ListItem key={c.to} disablePadding>
                        <ListItemButton
                          component={Link}
                          to={c.to}
                          selected={isActive(c.to)}
                          onClick={() => isMobile && setMobileOpen(false)}
                          sx={{ py: 0.75, pl: 4 }}
                        >
                          <ListItemIcon sx={{ minWidth: 34, "& .MuiSvgIcon-root": { fontSize: "1.15rem" } }}>{c.icon}</ListItemIcon>
                          <ListItemText primary={c.label} primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 500 }} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </Box>
            );
          }

          // Plain link.
          return (
            <ListItem key={item.to} disablePadding>
              <ListItemButton
                component={Link}
                to={item.to}
                selected={isActive(item.to)}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{ py: 1 }}
              >
                <ListItemIcon sx={{ "& .MuiSvgIcon-root": { fontSize: "1.3rem" } }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer user info */}
      <Box
        className={styles.drawerFooter}
        sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: avatarColor(user?.name),
              color: "#fff",
              fontSize: "0.8rem",
              fontWeight: 800,
            }}
          >
            {user?.name?.charAt(0)}
          </Avatar>
          <Box overflow="hidden">
            <Typography
              variant="body2"
              fontWeight={600}
              noWrap
              sx={{ color: "text.primary" }}
            >
              {user?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.email}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      {/* ── Sidebar ── */}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: SIDEBAR_WIDTH,
            boxSizing: "border-box",
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* ── Main area ── */}
      <Box
        sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}
      >
        {/* AppBar */}
        <AppBar position="sticky" sx={{ zIndex: 100 }}>
          <Toolbar sx={{ gap: 0.5 }}>
            {isMobile && (
              <IconButton
                onClick={() => setMobileOpen(true)}
                size="small"
                sx={{ color: "text.primary" }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* Back button — desktop app navigation */}
            {canGoBack && (
              <Tooltip title="Go back  (Alt+←)">
                <IconButton
                  size="small"
                  onClick={() => navigate(-1)}
                  sx={{ color: isDark ? "grey" : "#292929" }}
                >
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            <Box sx={{ flex: 1 }} />

            {/* Theme toggle */}
            <Tooltip
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <IconButton
                size="small"
                onClick={toggleMode}
                sx={{ color: isDark ? "grey" : "#292929" }}
              >
                {isDark ? (
                  <LightModeIcon fontSize="small" />
                ) : (
                  <DarkModeIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>

            {/* Notification bell */}
            {canSeeAlerts && (
              <Tooltip title="Expiry alerts">
                <IconButton
                  size="small"
                  onClick={handleBellOpen}
                  sx={{
                    color: isDark ? "grey" : "#292929",
                    // color:
                    //   criticalCount > 0
                    //     ? "error.main"
                    //     : totalCount > 0
                    //       ? "warning.main"
                    //       : "text.secondary",
                    transition: "color 0.2s",
                  }}
                >
                  <Badge
                    badgeContent={totalCount || null}
                    // color={isDark ? "grey" : "#292929"}
                    // color={criticalCount > 0 ? "error" : "warning"}
                    max={99}
                    // sx={{ color: isDark ? "grey" : "#292929" }}
                    sx={{
                      "& .MuiBadge-badge": {
                        backgroundColor: isDark ? "#666" : "#292929",
                        color: "#fff",
                      },
                    }}
                  >
                    <NotificationsIcon color="#292929" />
                  </Badge>
                </IconButton>
              </Tooltip>
            )}

            {/* Avatar */}
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: avatarColor(user?.name),
                color: "#fff",
                fontSize: "0.8rem",
                fontWeight: 800,
                cursor: "pointer",
                ml: 0.5,
              }}
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              {user?.name?.charAt(0)}
            </Avatar>
          </Toolbar>
        </AppBar>

        {/* Alerts popover */}
        <Popover
          open={Boolean(bellAnchor)}
          anchorEl={bellAnchor}
          onClose={() => setBellAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            sx: {
              width: 360,
              maxHeight: 480,
              display: "flex",
              flexDirection: "column",
              borderRadius: 2,
              mt: 0.5,
            },
          }}
        >
          {/* Popover header */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={700} fontSize="0.95rem">
                Expiry Alerts
              </Typography>
              {totalCount > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {criticalCount > 0 && (
                    <span
                      style={{
                        color: theme.palette.error.main,
                        fontWeight: 600,
                      }}
                    >
                      {criticalCount} critical
                    </span>
                  )}
                  {criticalCount > 0 && totalCount > criticalCount && " · "}
                  {totalCount > criticalCount &&
                    `${totalCount - criticalCount} warning`}
                </Typography>
              )}
            </Box>
            <Chip
              label={totalCount}
              size="small"
              color={
                criticalCount > 0
                  ? "error"
                  : totalCount > 0
                    ? "warning"
                    : "default"
              }
              sx={{ fontWeight: 700 }}
            />
          </Box>

          {/* Popover body */}
          <Box sx={{ overflowY: "auto", flex: 1 }}>
            {alertsLoading ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                py={4}
              >
                <CircularProgress size={24} />
              </Box>
            ) : alerts.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography fontSize="1.5rem" mb={1}>
                  ✅
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No active alerts
                </Typography>
              </Box>
            ) : (
              alerts.map((a, i) => <AlertRow key={i} a={a} />)
            )}
          </Box>

          {/* Popover footer */}
          {totalCount > 0 && (
            <Box
              sx={{
                px: 2,
                py: 1.25,
                borderTop: `1px solid ${theme.palette.divider}`,
                flexShrink: 0,
              }}
            >
              <Box
                component={Link}
                to={
                  user?.role === "admin" ? "/admin/alerts" : "/manager/alerts"
                }
                onClick={() => setBellAnchor(null)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "primary.main",
                  textDecoration: "none",
                  fontFamily: "'Syne', sans-serif",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  "&:hover": { color: "primary.dark" },
                }}
              >
                View all alerts
                <OpenInNewIcon sx={{ fontSize: "0.85rem" }} />
              </Box>
            </Box>
          )}
        </Popover>

        {/* Avatar menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="body2" fontWeight={600}>
              {user?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { setAnchorEl(null); navigate("/profile"); }}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            My Profile
          </MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); navigate("/security"); }}>
            <ListItemIcon>
              <ShieldIcon fontSize="small" />
            </ListItemIcon>
            Security
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Sign Out
          </MenuItem>
        </Menu>

        {/* Page content */}
        <Box
          component="main"
          sx={{ flex: 1, p: { xs: 2, md: 3 }, overflow: "auto" }}
          className="page-enter"
        >
          {user?.mustResetPassword && (
            <Alert
              severity="warning"
              sx={{ mb: 2 }}
              action={
                <Button color="inherit" size="small" onClick={() => { setPwErr(""); setPwDlg(true); }}>
                  Reset password
                </Button>
              }
            >
              Your account is using a temporary password. Please set a new password to secure it.
            </Alert>
          )}
          {children}
        </Box>
      </Box>

      {/* Reset-password dialog */}
      <Dialog open={pwDlg} onClose={() => !pwSaving && setPwDlg(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Set a new password</DialogTitle>
        <DialogContent>
          {pwErr && <Alert severity="error" sx={{ mb: 2 }}>{pwErr}</Alert>}
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              fullWidth size="small" type="password" label="Current / temporary password"
              value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
            />
            <TextField
              fullWidth size="small" type="password" label="New password (min 8 chars)"
              value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
            />
            <TextField
              fullWidth size="small" type="password" label="Confirm new password"
              value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPwDlg(false)} disabled={pwSaving}>Cancel</Button>
          <Button variant="contained" onClick={submitPassword} disabled={pwSaving}
            startIcon={pwSaving ? <CircularProgress size={14} color="inherit" /> : null}>
            {pwSaving ? "Saving…" : "Update password"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
