import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import RouteIcon from "@mui/icons-material/Route";
import { authAPI, driverAPI } from "../../api/client";
import { formatDate, statusConfig, errorMessage } from "../../utils/helpers";

const statusConf = statusConfig.schedule || {};

// Categorise a schedule relative to today
function category(scheduleDate) {
  const d = new Date(scheduleDate);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 86400000);
  if (d >= start && d < end) return "today";
  if (d >= end) return "upcoming";
  return "past";
}

function ScheduleCard({ s }) {
  const st = statusConf[s.status] || {};
  const cat = category(s.scheduleDate);
  const vehicle = s.vehicle || {};

  const borderColor =
    cat === "today"
      ? "#C8A84B"
      : cat === "upcoming"
        ? "rgba(255,255,255,0.08)"
        : "rgba(255,255,255,0.04)";

  return (
    <Card
      sx={{
        mb: 1.5,
        border: `1px solid ${borderColor}`,
        opacity: cat === "past" ? 0.65 : 1,
        transition: "opacity 0.2s",
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          gap={2}
        >
          {/* Left: date + shift */}
          <Box display="flex" alignItems="flex-start" gap={2}>
            {/* Date block */}
            <Box
              sx={{
                minWidth: 52,
                textAlign: "center",
                background:
                  cat === "today"
                    ? "rgba(200,168,75,0.12)"
                    : "rgba(255,255,255,0.04)",
                border: `1px solid ${cat === "today" ? "rgba(200,168,75,0.3)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 1.5,
                px: 1,
                py: 0.75,
              }}
            >
              <Typography
                variant="caption"
                display="block"
                sx={{
                  color: cat === "today" ? "primary.main" : "text.secondary",
                  fontWeight: 700,
                  fontSize: "0.62rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {new Date(s.scheduleDate).toLocaleDateString("en-GB", {
                  month: "short",
                })}
              </Typography>
              <Typography
                variant="h5"
                fontWeight={800}
                sx={{
                  color: cat === "today" ? "primary.main" : "text.primary",
                  lineHeight: 1.1,
                }}
              >
                {new Date(s.scheduleDate).getDate()}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontSize: "0.62rem" }}
              >
                {new Date(s.scheduleDate).toLocaleDateString("en-GB", {
                  weekday: "short",
                })}
              </Typography>
            </Box>

            {/* Details */}
            <Box>
              <Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
                <AccessTimeIcon
                  sx={{ fontSize: "0.85rem", color: "text.secondary" }}
                />
                <Typography variant="body2" fontWeight={700}>
                  {s.shiftStart?.slice(0, 5)} – {s.shiftEnd?.slice(0, 5)}
                </Typography>
                {cat === "today" && (
                  <Chip
                    label="Today"
                    color="primary"
                    size="small"
                    sx={{ height: 18, fontSize: "0.62rem" }}
                  />
                )}
              </Box>

              {vehicle.registrationNumber && (
                <Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
                  <DirectionsBusIcon
                    sx={{ fontSize: "0.85rem", color: "text.secondary" }}
                  />
                  <Typography
                    variant="body2"
                    color="primary.main"
                    fontWeight={600}
                  >
                    {vehicle.registrationNumber}
                  </Typography>
                  {vehicle.make && (
                    <Typography variant="caption" color="text.secondary">
                      {vehicle.make} {vehicle.model}
                    </Typography>
                  )}
                </Box>
              )}

              {s.routeDescription && (
                <Box display="flex" alignItems="center" gap={0.75}>
                  <RouteIcon
                    sx={{ fontSize: "0.85rem", color: "text.secondary" }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {s.routeDescription}
                  </Typography>
                </Box>
              )}

              {s.notes && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5, display: "block" }}
                >
                  {s.notes}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Right: status chip */}
          <Chip
            label={st.label || s.status}
            color={st.color || "default"}
            size="small"
            sx={{ flexShrink: 0 }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

function Section({ title, items, emptyText }) {
  return (
    <Box mb={4}>
      <Typography
        variant="overline"
        display="block"
        sx={{ mb: 1.5, color: "text.secondary" }}
      >
        {title} ({items.length})
      </Typography>
      {items.length === 0 ? (
        <Typography variant="body2" color="text.disabled" sx={{ pl: 0.5 }}>
          {emptyText}
        </Typography>
      ) : (
        items.map((s) => <ScheduleCard key={s._id || s.id} s={s} />)
      )}
    </Box>
  );
}

export default function DriverSchedule() {
  const [profile, setProfile] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const past14 = new Date(Date.now() - 14 * 86400000)
      .toISOString()
      .slice(0, 10);
    const future60 = new Date(Date.now() + 60 * 86400000)
      .toISOString()
      .slice(0, 10);

    authAPI
      .me()
      .then(({ data }) => {
        setProfile(data.profile);
        const profileId = data.profile?._id || data.profile?.id;
        if (!profileId) return;
        return driverAPI
          .getSchedules(profileId, { from: past14, to: future60 })
          .then(({ data: s }) => setSchedules(s.data || []));
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const todayItems = schedules.filter(
    (s) => category(s.scheduleDate) === "today",
  );
  const upcomingItems = schedules.filter(
    (s) => category(s.scheduleDate) === "upcoming",
  );
  const pastItems = schedules
    .filter((s) => category(s.scheduleDate) === "past")
    .reverse(); // most recent first

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <CalendarMonthIcon
          sx={{ color: "primary.main", fontSize: "1.75rem" }}
        />
        <Box>
          <Typography variant="overline" display="block">
            Driver Portal
          </Typography>
          <Typography variant="h4" fontWeight={800}>
            My Schedule
          </Typography>
        </Box>
      </Box>

      {/* Summary cards */}
      <Box display="flex" gap={2} mb={4} flexWrap="wrap">
        {[
          { label: "Today", value: todayItems.length, color: "#C8A84B" },
          { label: "Upcoming", value: upcomingItems.length, color: "#2196F3" },
          { label: "Past (14d)", value: pastItems.length, color: "#666" },
        ].map((s) => (
          <Card key={s.label} sx={{ flex: "1 1 120px", minWidth: 120 }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="overline" display="block">
                {s.label}
              </Typography>
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{ color: s.color, fontSize: "1.75rem" }}
              >
                {s.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Schedule sections */}
      {todayItems.length > 0 && (
        <Section title="Today" items={todayItems} emptyText="" />
      )}

      <Section
        title="Upcoming"
        items={upcomingItems}
        emptyText="No upcoming schedules in the next 60 days."
      />

      <Divider sx={{ my: 3 }} />

      <Section
        title="Past 14 Days"
        items={pastItems}
        emptyText="No schedules in the past 14 days."
      />
    </Box>
  );
}
