import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import PeopleIcon from "@mui/icons-material/People";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import SpeedIcon from "@mui/icons-material/Speed";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import { analyticsAPI } from "../../api/client";
import { errorMessage } from "../../utils/helpers";

// ─── Colour palettes ─────────────────────────────────────────────────────────
const VEHICLE_STATUS_COLORS = {
  available:      "#4CAF50",
  assigned:       "#2196F3",
  maintenance:    "#FF9800",
  out_of_service: "#F44336",
  retired:        "#9E9E9E",
};
const VEHICLE_STATUS_LABELS = {
  available:      "Available",
  assigned:       "Assigned",
  maintenance:    "Maintenance",
  out_of_service: "Out of Service",
  retired:        "Retired",
};
const DRIVER_STATUS_COLORS = {
  active:    "#4CAF50",
  on_leave:  "#FF9800",
  suspended: "#F44336",
  inactive:  "#9E9E9E",
};
const DRIVER_STATUS_LABELS = {
  active:    "Active",
  on_leave:  "On Leave",
  suspended: "Suspended",
  inactive:  "Inactive",
};
const PALETTE = ["#D32F2F", "#2196F3", "#4CAF50", "#FF9800", "#F44336", "#9C27B0", "#00BCD4", "#795548"];

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, color, progress }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="overline" color="text.secondary" display="block" lineHeight={1.4}>
              {label}
            </Typography>
            <Typography variant="h3" fontWeight={800} sx={{ color, fontSize: "2rem", mt: 0.5 }}>
              {value ?? "—"}
            </Typography>
            {sub && (
              <Typography variant="caption" color="text.secondary">
                {sub}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              bgcolor: `${color}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem",
              color,
            }}
          >
            {icon}
          </Box>
        </Box>
        {progress !== undefined && (
          <Box mt={1.5}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: "rgba(255,255,255,0.07)",
                "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 },
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <Typography variant="h6" fontWeight={700} fontSize="0.9rem" mb={2} mt={0.5}>
      {children}
    </Typography>
  );
}

// ─── Custom tooltip for Recharts ──────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 1,
        p: 1.5,
        fontSize: "0.8rem",
        minWidth: 120,
      }}
    >
      {label && (
        <Typography variant="caption" display="block" fontWeight={700} mb={0.5}>
          {label}
        </Typography>
      )}
      {payload.map((p, i) => (
        <Box key={i} display="flex" alignItems="center" gap={1}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: p.color }} />
          <Typography variant="caption" color="text.secondary">
            {p.name}:
          </Typography>
          <Typography variant="caption" fontWeight={700}>
            {p.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    analyticsAPI
      .fleet()
      .then(({ data: d }) => setData(d))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  // ── Derived values ───────────────────────────────────────────────────────
  const {
    vehicleStatus,
    vehicleTypes,
    fuelTypes,
    driverStatus,
    expiryBuckets,
    schedulesByDay,
    capacity,
    fleetAge,
    healthScore,
    utilRate,
    driverRate,
    docHealth,
  } = data;

  const vehicleStatusData = Object.entries(vehicleStatus)
    .filter(([k]) => k !== "retired" || vehicleStatus[k] > 0)
    .map(([k, v]) => ({ name: VEHICLE_STATUS_LABELS[k] || k, value: v, key: k }));

  const driverStatusData = Object.entries(driverStatus).map(([k, v]) => ({
    name:  DRIVER_STATUS_LABELS[k] || k,
    value: v,
    key:   k,
  }));

  const capPercent =
    capacity.totalCapacity > 0
      ? Math.round((capacity.assignedCapacity / capacity.totalCapacity) * 100)
      : 0;

  const totalVehicles = Object.values(vehicleStatus).reduce((a, b) => a + b, 0);
  const totalDrivers  = Object.values(driverStatus).reduce((a, b) => a + b, 0);

  const healthColor =
    healthScore >= 75 ? "#4CAF50" : healthScore >= 50 ? "#FF9800" : "#F44336";

  return (
    <Box>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <Box mb={3}>
        <Typography variant="overline" display="block">
          Insights
        </Typography>
        <Typography variant="h4" fontWeight={800}>
          Fleet Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Real-time operational intelligence across your entire fleet.
        </Typography>
      </Box>

      {/* ── KPI row ──────────────────────────────────────────────────── */}
      <Grid container spacing={2.5} mb={3.5}>
        <Grid item xs={6} sm={3}>
          <KpiCard
            label="Fleet Health Score"
            value={`${healthScore}%`}
            sub="Composite operational score"
            icon={<HealthAndSafetyIcon fontSize="inherit" />}
            color={healthColor}
            progress={healthScore}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard
            label="Vehicle Utilisation"
            value={`${utilRate}%`}
            sub={`${vehicleStatus.available ?? 0} available · ${vehicleStatus.assigned ?? 0} assigned`}
            icon={<DirectionsBusIcon fontSize="inherit" />}
            color="#2196F3"
            progress={utilRate}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard
            label="Driver Active Rate"
            value={`${driverRate}%`}
            sub={`${driverStatus.active ?? 0} active of ${totalDrivers} total`}
            icon={<PeopleIcon fontSize="inherit" />}
            color="#4CAF50"
            progress={driverRate}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard
            label="Document Health"
            value={`${docHealth}%`}
            sub={`${expiryBuckets[0].vehicles + expiryBuckets[0].drivers} overdue items`}
            icon={<WarningAmberIcon fontSize="inherit" />}
            color={docHealth >= 80 ? "#4CAF50" : docHealth >= 60 ? "#FF9800" : "#F44336"}
            progress={docHealth}
          />
        </Grid>
      </Grid>

      {/* ── Capacity Utilization banner ──────────────────────────────── */}
      <Card sx={{ mb: 3.5, p: 2.5 }}>
        <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
          <EventSeatIcon sx={{ color: "#D32F2F" }} />
          <Typography fontWeight={700} fontSize="0.9rem">
            Seat Capacity Utilisation
          </Typography>
          <Typography variant="caption" color="text.secondary" ml="auto">
            {capacity.assignedCapacity.toLocaleString()} /{" "}
            {capacity.totalCapacity.toLocaleString()} seats assigned
          </Typography>
          <Typography fontWeight={800} color="#D32F2F">
            {capPercent}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={capPercent}
          sx={{
            height: 10,
            borderRadius: 5,
            bgcolor: "rgba(255,255,255,0.07)",
            "& .MuiLinearProgress-bar": {
              bgcolor: capPercent > 80 ? "#4CAF50" : capPercent > 50 ? "#D32F2F" : "#F44336",
              borderRadius: 5,
            },
          }}
        />
      </Card>

      {/* ── Row: Fleet Status donut + Driver Status donut ────────────── */}
      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle>Vehicle Status Breakdown</SectionTitle>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={vehicleStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) =>
                      percent > 0.04 ? `${Math.round(percent * 100)}%` : ""
                    }
                    labelLine={false}
                  >
                    {vehicleStatusData.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={VEHICLE_STATUS_COLORS[entry.key] || "#9E9E9E"}
                      />
                    ))}
                  </Pie>
                  <ReTooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => (
                      <span style={{ fontSize: "0.78rem", color: "#aaa" }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
              <Divider sx={{ my: 1.5, opacity: 0.15 }} />
              <Box display="flex" flexWrap="wrap" gap={1.5} justifyContent="center">
                {vehicleStatusData.map((d) => (
                  <Box key={d.key} display="flex" alignItems="center" gap={0.5}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: VEHICLE_STATUS_COLORS[d.key] || "#9E9E9E",
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {d.name}
                    </Typography>
                    <Typography variant="caption" fontWeight={700}>
                      {d.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle>Driver Status Breakdown</SectionTitle>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={driverStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) =>
                      percent > 0.04 ? `${Math.round(percent * 100)}%` : ""
                    }
                    labelLine={false}
                  >
                    {driverStatusData.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={DRIVER_STATUS_COLORS[entry.key] || "#9E9E9E"}
                      />
                    ))}
                  </Pie>
                  <ReTooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => (
                      <span style={{ fontSize: "0.78rem", color: "#aaa" }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
              <Divider sx={{ my: 1.5, opacity: 0.15 }} />
              <Box display="flex" flexWrap="wrap" gap={1.5} justifyContent="center">
                {driverStatusData.map((d) => (
                  <Box key={d.key} display="flex" alignItems="center" gap={0.5}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: DRIVER_STATUS_COLORS[d.key] || "#9E9E9E",
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {d.name}
                    </Typography>
                    <Typography variant="caption" fontWeight={700}>
                      {d.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Row: Vehicle Types + Fuel Types ──────────────────────────── */}
      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle>Fleet Composition by Vehicle Type</SectionTitle>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={vehicleTypes}
                  margin={{ top: 4, right: 16, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#888" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#888" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ReTooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="value" name="Vehicles" radius={[4, 4, 0, 0]}>
                    {vehicleTypes.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle>Fuel Type Distribution</SectionTitle>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={fuelTypes}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) =>
                      percent > 0.06 ? `${name} ${Math.round(percent * 100)}%` : ""
                    }
                    labelLine={false}
                  >
                    {fuelTypes.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <ReTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Document Expiry Timeline ──────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <SectionTitle>Document Expiry Timeline</SectionTitle>
          <Typography variant="caption" color="text.secondary" display="block" mb={2}>
            Number of vehicle documents and driver licenses expiring within each window.
          </Typography>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={expiryBuckets}
              margin={{ top: 4, right: 16, left: -16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#888" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#888" }}
                axisLine={false}
                tickLine={false}
              />
              <ReTooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Legend
                formatter={(value) => (
                  <span style={{ fontSize: "0.78rem", color: "#aaa" }}>{value}</span>
                )}
              />
              <Bar dataKey="vehicles" name="Vehicle Docs" fill="#2196F3" radius={[4, 4, 0, 0]} />
              <Bar dataKey="drivers"  name="Driver Licenses" fill="#D32F2F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Schedule Activity ─────────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <SectionTitle>Schedule Activity — Last 14 Days</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart
              data={schedulesByDay}
              margin={{ top: 4, right: 16, left: -16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#888" }}
                axisLine={false}
                tickLine={false}
                interval={1}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#888" }}
                axisLine={false}
                tickLine={false}
              />
              <ReTooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => (
                  <span style={{ fontSize: "0.78rem", color: "#aaa" }}>{value}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey="total"
                name="Total"
                stroke="#D32F2F"
                strokeWidth={2}
                dot={{ r: 3, fill: "#D32F2F" }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="completed"
                name="Completed"
                stroke="#4CAF50"
                strokeWidth={2}
                dot={{ r: 3, fill: "#4CAF50" }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="cancelled"
                name="Cancelled"
                stroke="#F44336"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Fleet Age ─────────────────────────────────────────────────── */}
      {fleetAge.length > 0 && (
        <Card>
          <CardContent sx={{ p: 2.5 }}>
            <SectionTitle>Fleet Age Distribution (by Model Year)</SectionTitle>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={fleetAge}
                margin={{ top: 4, right: 16, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: "#888" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#888" }}
                  axisLine={false}
                  tickLine={false}
                />
                <ReTooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="count" name="Vehicles" fill="#9C27B0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
