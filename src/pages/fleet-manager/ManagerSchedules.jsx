import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  Avatar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
} from "recharts";
import { driverAPI, vehicleAPI, analyticsAPI } from "../../api/client";
import { formatDate, statusConfig, errorMessage } from "../../utils/helpers";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: "background.paper", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 1, p: 1.5 }}>
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

const BLANK_FORM = {
  driverId: "",
  vehicleId: "",
  scheduleDate: "",
  shiftStart: "",
  shiftEnd: "",
  routeDescription: "",
  notes: "",
};

const today = () => new Date().toISOString().slice(0, 10);
const in60 = () =>
  new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);

export default function ManagerSchedules() {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [filterDriver, setFilterDriver] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // Create dialog
  const [dlgOpen, setDlgOpen] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [dlgError, setDlgError] = useState("");

  // Delete confirm
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Analytics
  const [scheduleActivity, setScheduleActivity] = useState([]);

  useEffect(() => {
    analyticsAPI.fleet().then(({ data }) => setScheduleActivity(data.schedulesByDay || [])).catch(() => {});
  }, []);

  // Load drivers and vehicles once
  useEffect(() => {
    Promise.all([
      driverAPI.list({ status: "active", limit: 100 }),
      vehicleAPI.list({ limit: 100 }),
    ])
      .then(([d, v]) => {
        setDrivers(d.data.data || []);
        setVehicles(v.data.data || []);
      })
      .catch((e) => setError(errorMessage(e)));
  }, []);

  // Load schedules whenever driver filter changes
  const loadSchedules = useCallback(async () => {
    if (!drivers.length) return;
    setLoading(true);
    setError("");
    try {
      const params = { from: today(), to: in60() };
      let rows = [];

      if (filterDriver === "all") {
        const results = await Promise.all(
          drivers.map((d) =>
            driverAPI
              .getSchedules(d._id || d.id, params)
              .then(({ data }) =>
                (data.data || []).map((s) => ({ ...s, _driverProfile: d })),
              )
              .catch(() => []),
          ),
        );
        rows = results.flat();
      } else {
        const { data } = await driverAPI.getSchedules(filterDriver, params);
        const driver = drivers.find((d) => (d._id || d.id) === filterDriver);
        rows = (data.data || []).map((s) => ({ ...s, _driverProfile: driver }));
      }

      // Sort by date ascending
      rows.sort((a, b) => new Date(a.scheduleDate) - new Date(b.scheduleDate));
      setSchedules(rows);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [drivers, filterDriver]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // Create schedule
  const handleCreate = async () => {
    if (
      !form.driverId ||
      !form.scheduleDate ||
      !form.shiftStart ||
      !form.shiftEnd
    ) {
      setDlgError("Driver, date, shift start and end are required.");
      return;
    }
    setSaving(true);
    setDlgError("");
    try {
      await driverAPI.createSchedule(form.driverId, {
        vehicleId: form.vehicleId || null,
        scheduleDate: form.scheduleDate,
        shiftStart: form.shiftStart,
        shiftEnd: form.shiftEnd,
        routeDescription: form.routeDescription || null,
        notes: form.notes || null,
      });
      setDlgOpen(false);
      setForm(BLANK_FORM);
      setToast("Schedule created successfully");
      loadSchedules();
    } catch (e) {
      setDlgError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  // Delete schedule
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await driverAPI.deleteSchedule(deletingId);
      setDeletingId(null);
      setToast("Schedule deleted");
      loadSchedules();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const statusConf = statusConfig.schedule || {};

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
            Operations
          </Typography>
          <Typography variant="h4" fontWeight={800}>
            Schedules
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            setForm(BLANK_FORM);
            setDlgError("");
            setDlgOpen(true);
          }}
        >
          New Schedule
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* ── Schedule Activity Chart ── */}
      {scheduleActivity.length > 0 && (
        <Card sx={{ mb: 2.5 }}>
          <Box px={2.5} pt={2} pb={0.5}>
            <Typography variant="body2" fontWeight={700} fontSize="0.85rem">
              Schedule Activity — Last 14 Days
            </Typography>
          </Box>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart
              data={scheduleActivity}
              margin={{ top: 4, right: 16, left: -16, bottom: 0 }}
              barSize={12}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#777" }} axisLine={false} tickLine={false} interval={2} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#777" }} axisLine={false} tickLine={false} />
              <ReTooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="scheduled" name="Scheduled" fill="#2196F3" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="completed" name="Completed" fill="#4CAF50" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="cancelled" name="Cancelled" fill="#F44336" stackId="a" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Filter */}
      <Card sx={{ p: 2, mb: 2.5 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Driver</InputLabel>
            <Select
              label="Driver"
              value={filterDriver}
              onChange={(e) => setFilterDriver(e.target.value)}
            >
              <MenuItem value="all">All Drivers</MenuItem>
              {drivers.map((d) => (
                <MenuItem key={d._id || d.id} value={d._id || d.id}>
                  {d.user?.name || "Unknown"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" ml="auto">
            Showing next 60 days · {schedules.length} schedule
            {schedules.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <Box display="flex" justifyContent="center" p={5}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Shift</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell>Route</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.map((s) => {
                const st = statusConf[s.status] || {};
                const driver = s._driverProfile;
                const isToday =
                  new Date(s.scheduleDate).toDateString() ===
                  new Date().toDateString();
                const vehicle = s.vehicle || {};

                return (
                  <TableRow key={s._id || s.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {isToday && (
                          <Chip label="Today" color="primary" size="small" />
                        )}
                        <Typography
                          variant="body2"
                          fontWeight={isToday ? 700 : 400}
                        >
                          {formatDate(s.scheduleDate)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar
                          sx={{
                            width: 28,
                            height: 28,
                            bgcolor: "#C8A84B",
                            color: "#000",
                            fontSize: "0.7rem",
                            fontWeight: 800,
                          }}
                        >
                          {driver?.user?.name?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {driver?.user?.name || "—"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {driver?.licenseNumber || ""}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {s.shiftStart?.slice(0, 5)} – {s.shiftEnd?.slice(0, 5)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="primary.main"
                        fontWeight={600}
                      >
                        {vehicle.registrationNumber || "—"}
                      </Typography>
                      {vehicle.make && (
                        <Typography variant="caption" color="text.secondary">
                          {vehicle.make} {vehicle.model}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {s.routeDescription || (
                          <span style={{ color: "#555" }}>—</span>
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={st.label || s.status}
                        color={st.color || "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Delete schedule">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeletingId(s._id || s.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!schedules.length && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{ py: 6, color: "text.secondary" }}
                  >
                    <CalendarMonthIcon
                      sx={{ fontSize: "2rem", mb: 1, opacity: 0.3 }}
                    />
                    <Typography display="block">
                      No schedules in the next 60 days
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </TableContainer>
        )}
      </Card>

      {/* ── Create Schedule Dialog ── */}
      <Dialog
        open={dlgOpen}
        onClose={() => setDlgOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>New Schedule</DialogTitle>
        <DialogContent>
          {dlgError && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => setDlgError("")}
            >
              {dlgError}
            </Alert>
          )}
          <Box display="flex" flexDirection="column" gap={2.5} pt={1}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Driver *</InputLabel>
              <Select
                label="Driver *"
                value={form.driverId}
                onChange={set("driverId")}
              >
                {drivers.map((d) => (
                  <MenuItem key={d._id || d.id} value={d._id || d.id}>
                    {d.user?.name} — {d.licenseNumber}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Vehicle (optional)</InputLabel>
              <Select
                label="Vehicle (optional)"
                value={form.vehicleId}
                onChange={set("vehicleId")}
              >
                <MenuItem value="">None</MenuItem>
                {vehicles
                  .filter((v) => ["available", "assigned"].includes(v.status))
                  .map((v) => (
                    <MenuItem key={v._id || v.id} value={v._id || v.id}>
                      {v.registrationNumber} — {v.make} {v.model}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              required
              size="small"
              label="Schedule Date"
              type="date"
              value={form.scheduleDate}
              onChange={set("scheduleDate")}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: today() }}
            />

            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                required
                size="small"
                label="Shift Start"
                type="time"
                value={form.shiftStart}
                onChange={set("shiftStart")}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                required
                size="small"
                label="Shift End"
                type="time"
                value={form.shiftEnd}
                onChange={set("shiftEnd")}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <TextField
              fullWidth
              size="small"
              label="Route Description"
              value={form.routeDescription}
              onChange={set("routeDescription")}
              placeholder="e.g. Accra–Kumasi Route 1"
            />

            <TextField
              fullWidth
              size="small"
              multiline
              rows={2}
              label="Notes"
              value={form.notes}
              onChange={set("notes")}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDlgOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={saving}
            onClick={handleCreate}
            startIcon={
              saving ? <CircularProgress size={14} color="inherit" /> : null
            }
          >
            {saving ? "Creating…" : "Create Schedule"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog
        open={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Schedule</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete this schedule? This cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeletingId(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleting}
            onClick={handleDelete}
            startIcon={
              deleting ? <CircularProgress size={14} color="inherit" /> : null
            }
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        message={toast}
      />
    </Box>
  );
}
