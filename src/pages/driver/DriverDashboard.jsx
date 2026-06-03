import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import BadgeIcon from "@mui/icons-material/Badge";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  ResponsiveContainer,
} from "recharts";
import { authAPI, driverAPI } from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";
import {
  formatDate,
  formatDateTime,
  statusConfig,
  expiryLabel,
  expiryColor,
} from "../../utils/helpers";

const SCHEDULE_COLORS = {
  scheduled:   "#2196F3",
  in_progress: "#FF9800",
  completed:   "#4CAF50",
  cancelled:   "#F44336",
};

export default function DriverDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  console.log("profile: ", profile);
  console.log("schedules: ", schedules);

  useEffect(() => {
    authAPI
      .me()
      .then(({ data }) => {
        setProfile(data.profile);
        if (data.profile?.id) {
          return driverAPI
            .getSchedules(data.profile.id)
            .then(({ data: s }) => setSchedules(s.data));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const licDays = profile
    ? Math.round((new Date(profile.licenseExpiry) - new Date()) / 86400000)
    : null;

  // Schedule status breakdown for mini chart
  const scheduleStats = schedules.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});
  const scheduleChartData = Object.entries(scheduleStats).map(([k, v]) => ({
    name: statusConfig.schedule[k]?.label || k,
    value: v,
    key: k,
  }));

  if (loading)
    return (
      <Box display="flex" justifyContent="center" p={6}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Avatar
          sx={{
            width: 48,
            height: 48,
            bgcolor: "#D32F2F",
            color: "#fff",
            fontWeight: 800,
            fontSize: "1.2rem",
          }}
        >
          {user?.name?.charAt(0)}
        </Avatar>
        <Box>
          <Typography variant="overline" display="block">
            Driver Portal
          </Typography>
          <Typography variant="h4" fontWeight={800}>
            Good day, {user?.name?.split(" ")[0]}
          </Typography>
        </Box>
      </Box>

      {licDays !== null && licDays <= 30 && (
        <Alert
          severity={licDays < 0 ? "error" : licDays <= 7 ? "error" : "warning"}
          sx={{ mb: 2.5 }}
        >
          {licDays < 0
            ? `⚠️ Your driver's license expired ${Math.abs(licDays)} days ago — please renew immediately.`
            : `⚠️ Your driver's license expires in ${licDays} day${licDays !== 1 ? "s" : ""} — please renew soon.`}
        </Alert>
      )}

      <Grid container spacing={2.5} mb={3}>
        {/* My Vehicle */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
                <DirectionsBusIcon sx={{ color: "#D32F2F" }} />
                <Typography variant="h6" fontWeight={700} fontSize="0.95rem">
                  Assigned Vehicle
                </Typography>
              </Box>
              {profile?.assignedVehicle ? (
                <>
                  <Typography
                    variant="h4"
                    fontWeight={800}
                    color="primary.main"
                    mb={0.5}
                  >
                    {profile.assignedVehicle?.registrationNumber}
                  </Typography>
                  <Typography color="text.secondary">
                    {profile.assignedVehicle?.make}{" "}
                    {profile.assignedVehicle?.model}
                  </Typography>
                </>
              ) : (
                <Typography color="text.secondary">
                  No vehicle currently assigned
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* My License */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
                <BadgeIcon sx={{ color: "#D32F2F" }} />
                <Typography variant="h6" fontWeight={700} fontSize="0.95rem">
                  My License
                </Typography>
              </Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="flex-end"
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    License Number
                  </Typography>
                  <Typography fontWeight={700} mb={1}>
                    {profile?.licenseNumber || "—"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Class
                  </Typography>
                  <Typography fontWeight={600}>
                    {profile?.licenseClass || "—"}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="body2" color="text.secondary">
                    Expires
                  </Typography>
                  <Typography
                    fontWeight={700}
                    color={expiryColor(licDays || profile?.licenseDaysLeft)}
                  >
                    {formatDate(profile?.licenseExpiry)}
                  </Typography>
                  <Typography
                    variant="caption"
                    color={expiryColor(licDays || profile?.licenseDaysLeft)}
                  >
                    {expiryLabel(licDays || profile?.licenseDaysLeft)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Schedule Summary Mini Stats ── */}
      {schedules.length > 0 && (
        <Grid container spacing={2.5} mb={3}>
          <Grid item xs={12} sm={8}>
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
                  <TrendingUpIcon sx={{ color: "#D32F2F" }} />
                  <Typography variant="h6" fontWeight={700} fontSize="0.9rem">
                    My Schedule Overview
                  </Typography>
                </Box>
                <Box display="flex" gap={2} flexWrap="wrap">
                  {Object.entries(scheduleStats).map(([k, v]) => {
                    const color = SCHEDULE_COLORS[k] || "#888";
                    return (
                      <Box key={k} sx={{ px: 2, py: 1, borderRadius: 2, bgcolor: `${color}20`, border: `1px solid ${color}40` }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {statusConfig.schedule[k]?.label || k}
                        </Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ color, lineHeight: 1.2 }}>
                          {v}
                        </Typography>
                      </Box>
                    );
                  })}
                  <Box sx={{ px: 2, py: 1, borderRadius: 2, bgcolor: "rgba(211,47,47,0.08)", border: "1px solid rgba(211,47,47,0.25)" }}>
                    <Typography variant="caption" color="text.secondary" display="block">Total</Typography>
                    <Typography variant="h6" fontWeight={800} color="#D32F2F" lineHeight={1.2}>{schedules.length}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          {scheduleChartData.length > 1 && (
            <Grid item xs={12} sm={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Status Breakdown</Typography>
                  <ResponsiveContainer width="100%" height={110}>
                    <PieChart>
                      <Pie data={scheduleChartData} cx="50%" cy="50%" outerRadius={48} dataKey="value" paddingAngle={3}>
                        {scheduleChartData.map((entry) => (
                          <Cell key={entry.key} fill={SCHEDULE_COLORS[entry.key] || "#888"} />
                        ))}
                      </Pie>
                      <ReTooltip formatter={(v, name) => [v, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Schedule */}
      <Card>
        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          px={2.5}
          pt={2.5}
          pb={1.5}
        >
          <CalendarMonthIcon sx={{ color: "#D32F2F" }} />
          <Typography variant="h6" fontWeight={700} fontSize="0.95rem">
            Upcoming Schedule
          </Typography>
        </Box>
        <Divider />
        <TableContainer>
        <Table sx={{ minWidth: 550 }}>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Shift</TableCell>
              <TableCell>Vehicle</TableCell>
              <TableCell>Route</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {schedules?.map((s) => {
              const st = statusConfig.schedule[s.status] || {};
              return (
                <TableRow key={s._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {formatDate(s.scheduleDate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {s.shiftStart?.slice(0, 5)} – {s.shiftEnd?.slice(0, 5)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color="primary.main"
                      fontWeight={600}
                    >
                      {s.vehicle?.registrationNumber || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {s.routeDescription || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={st.label || s.status}
                      color={st.color || "default"}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {!schedules.length && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  align="center"
                  sx={{ py: 4, color: "text.secondary" }}
                >
                  No upcoming schedules
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
