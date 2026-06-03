import { useEffect, useState } from "react";
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  CircularProgress,
} from "@mui/material";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import PeopleIcon from "@mui/icons-material/People";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BarChartIcon from "@mui/icons-material/BarChart";
import { Link } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { dashboardAPI, vehicleAPI, analyticsAPI } from "../../api/client";
import StatCard from "../../components/shared/StatCard";
import AlertBanner from "../../components/shared/AlertBanner";
import {
  statusConfig,
  formatDate,
  vehicleTypeLabel,
} from "../../utils/helpers";

const VEHICLE_STATUS_COLORS = {
  available:      "#4CAF50",
  assigned:       "#2196F3",
  maintenance:    "#FF9800",
  out_of_service: "#F44336",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: "background.paper", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 1, p: 1.5, fontSize: "0.8rem" }}>
      {label && <Typography variant="caption" display="block" fontWeight={700} mb={0.5}>{label}</Typography>}
      {payload.map((p, i) => (
        <Box key={i} display="flex" alignItems="center" gap={1}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: p.color }} />
          <Typography variant="caption" color="text.secondary">{p.name}:</Typography>
          <Typography variant="caption" fontWeight={700}>{p.value}</Typography>
        </Box>
      ))}
    </Box>
  );
};

export default function AdminDashboard() {
  const [stats, setStats]       = useState(null);
  const [alerts, setAlerts]     = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardAPI.stats(),
      dashboardAPI.alerts(),
      vehicleAPI.list({ limit: 8 }),
      analyticsAPI.fleet(),
    ])
      .then(([s, a, v, an]) => {
        setStats(s.data);
        setAlerts(a.data.data);
        setVehicles(v.data.data);
        setAnalytics(an.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalAlerts    = alerts.length;
  const criticalAlerts = alerts.filter((a) => a.severity === "critical").length;

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        mb={3}
      >
        <Box>
          <Typography variant="overline" display="block">
            Overview
          </Typography>
          <Typography variant="h4" fontWeight={800}>
            Fleet Dashboard
          </Typography>
        </Box>
        <Button
          component={Link}
          to="/admin/vehicles/new"
          variant="contained"
          color="primary"
          size="small"
        >
          + Add Vehicle
        </Button>
      </Box>

      {/* Alerts */}
      <AlertBanner alerts={alerts.slice(0, 4)} />

      {/* Stats */}
      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={6} sm={3}>
          <StatCard
            label="Total Vehicles"
            value={stats?.vehicles?.total}
            icon={<DirectionsBusIcon fontSize="inherit" />}
            color="#D32F2F"
            loading={loading}
            sub={`${stats?.vehicles?.available ?? "—"} available`}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            label="Active Drivers"
            value={stats?.drivers?.active}
            icon={<PeopleIcon fontSize="inherit" />}
            color="#2196F3"
            loading={loading}
            sub={`${stats?.drivers?.total ?? "—"} total`}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            label="Expiry Alerts"
            value={totalAlerts}
            icon={<WarningAmberIcon fontSize="inherit" />}
            color={criticalAlerts > 0 ? "#F44336" : "#FF9800"}
            loading={loading}
            sub={criticalAlerts > 0 ? `${criticalAlerts} critical` : "All reviewed"}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            label="In Service"
            value={stats?.vehicles?.assigned}
            icon={<CheckCircleIcon fontSize="inherit" />}
            color="#4CAF50"
            loading={loading}
            sub={`${stats?.vehicles?.maintenance ?? "—"} in maintenance`}
          />
        </Grid>
      </Grid>

      {/* ── Mini Analytics row ─────────────────────────── */}
      {analytics && (
        <Grid container spacing={2.5} mb={3}>
          {/* Fleet Utilization donut */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" fontWeight={700} fontSize="0.85rem">
                    Fleet Utilisation
                  </Typography>
                  <Typography variant="h6" fontWeight={800} color="#D32F2F">
                    {analytics.utilRate}%
                  </Typography>
                </Box>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={Object.entries(analytics.vehicleStatus)
                        .filter(([k]) => k !== "retired")
                        .map(([k, v]) => ({
                          name: k.replace(/_/g, " "),
                          value: v,
                          key: k,
                        }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {Object.entries(analytics.vehicleStatus)
                        .filter(([k]) => k !== "retired")
                        .map(([k]) => (
                          <Cell key={k} fill={VEHICLE_STATUS_COLORS[k] || "#9E9E9E"} />
                        ))}
                    </Pie>
                    <ReTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <Box display="flex" flexWrap="wrap" gap={1} justifyContent="center" mt={0.5}>
                  {Object.entries(VEHICLE_STATUS_COLORS).map(([k, color]) =>
                    analytics.vehicleStatus[k] != null ? (
                      <Box key={k} display="flex" alignItems="center" gap={0.5}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color }} />
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                          {k.replace(/_/g, " ")} {analytics.vehicleStatus[k]}
                        </Typography>
                      </Box>
                    ) : null
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Schedule Activity mini bar */}
          <Grid item xs={12} md={5}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="body2" fontWeight={700} fontSize="0.85rem" mb={1}>
                  Schedule Activity — Last 14 Days
                </Typography>
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart
                    data={analytics.schedulesByDay}
                    margin={{ top: 2, right: 8, left: -24, bottom: 0 }}
                    barSize={10}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 9, fill: "#777" }}
                      axisLine={false}
                      tickLine={false}
                      interval={2}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#777" }} axisLine={false} tickLine={false} />
                    <ReTooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar dataKey="total"     name="Total"     fill="#D32F2F" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill="#4CAF50" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Document expiry snapshot */}
          <Grid item xs={12} md={3}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="body2" fontWeight={700} fontSize="0.85rem" mb={1.5}>
                  Document Expiry Snapshot
                </Typography>
                {analytics.expiryBuckets.slice(0, 4).map((b) => {
                  const total = b.vehicles + b.drivers;
                  const color =
                    b.label === "Overdue"   ? "#F44336" :
                    b.label === "0–7 days"  ? "#FF5722" :
                    b.label === "8–30 days" ? "#FF9800" : "#D32F2F";
                  return (
                    <Box key={b.label} mb={1}>
                      <Box display="flex" justifyContent="space-between" mb={0.3}>
                        <Typography variant="caption" color="text.secondary">{b.label}</Typography>
                        <Typography variant="caption" fontWeight={700} color={color}>{total}</Typography>
                      </Box>
                    </Box>
                  );
                })}
                <Button
                  component={Link}
                  to="/admin/analytics"
                  variant="outlined"
                  color="primary"
                  size="small"
                  fullWidth
                  startIcon={<BarChartIcon />}
                  sx={{ mt: 1 }}
                >
                  Full Analytics
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Fleet Table */}
      <Card>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          px={2.5}
          pt={2.5}
          pb={1.5}
        >
          <Typography variant="h6" fontWeight={700} fontSize="0.95rem">
            Recent Fleet
          </Typography>
          <Button
            component={Link}
            to="/admin/vehicles"
            variant="outlined"
            color="primary"
            size="small"
          >
            View All
          </Button>
        </Box>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small" sx={{ minWidth: 580 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Registration</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Driver</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Insurance Expiry</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehicles.map((v) => {
                  const st = statusConfig.vehicle[v.status] || {};
                  return (
                    <TableRow key={v.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="primary.main">
                          {v.registrationNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {v.make} {v.model}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {vehicleTypeLabel[v.vehicleType] || v.vehicleType}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {v.currentDriver?.name || "—"}
                          <br />
                          {v.currentDriver?.phone || ""}
                          <br />
                          {v.currentDriver?.email || ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={st.label}
                          color={st.color || "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={
                            v.insurance_days_left < 0
                              ? "error.main"
                              : v.insurance_days_left <= 30
                                ? "warning.main"
                                : "text.primary"
                          }
                        >
                          {formatDate(v.insuranceExpiry)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
}
