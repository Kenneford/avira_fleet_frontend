import { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Pagination,
  Alert,
  Snackbar,
  LinearProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { vehicleAPI, analyticsAPI } from "../../api/client";
import {
  statusConfig,
  vehicleTypeLabel,
  formatDate,
  errorMessage,
} from "../../utils/helpers";
import AssignDriverModal from "../AssignDriverModal/AssignDriverModal";

const VEHICLE_STATUS_COLORS_BG = {
  available:      { bg: "#4CAF5022", color: "#4CAF50" },
  assigned:       { bg: "#2196F322", color: "#2196F3" },
  maintenance:    { bg: "#FF980022", color: "#FF9800" },
  out_of_service: { bg: "#F4433622", color: "#F44336" },
  retired:        { bg: "#9E9E9E22", color: "#9E9E9E" },
};

const STATUS_OPTIONS = [
  "",
  "available",
  "assigned",
  "maintenance",
  "out_of_service",
];
const NEXT_STATUSES = {
  available: ["assigned", "maintenance", "out_of_service"],
  assigned: ["available", "maintenance", "out_of_service"],
  maintenance: ["available", "out_of_service"],
  out_of_service: ["available", "maintenance"],
};

export default function VehicleList() {
  const { pathname } = useLocation();
  const base = pathname.startsWith("/manager") ? "/manager" : "/admin";
  const [vehicles, setVehicles] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [statusDlg, setStatusDlg] = useState(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [assignVehicle, setAssignVehicle] = useState(null);
  const [toast, setToast] = useState("");
  const [fleetSummary, setFleetSummary] = useState(null);

  useEffect(() => {
    analyticsAPI.fleet().then(({ data }) => setFleetSummary(data)).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    vehicleAPI
      .list({ page, limit: 15, ...filters })
      .then(({ data }) => {
        setVehicles(data.data);
        setTotal(data.total);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [page, filters]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async () => {
    setSaving(true);
    try {
      await vehicleAPI.updateStatus(statusDlg.vehicle.id, {
        status: statusDlg.newStatus,
        reason,
      });
      setStatusDlg(null);
      setReason("");
      load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

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
            Fleet
          </Typography>
          <Typography variant="h4" fontWeight={800}>
            Vehicles
          </Typography>
        </Box>
        <Button
          component={Link}
          to={`${base}/vehicles/new`}
          variant="contained"
          color="primary"
        >
          + Register Vehicle
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* ── Fleet status summary bar ── */}
      {fleetSummary && (
        <Box display="flex" gap={1.5} mb={2.5} flexWrap="wrap">
          {Object.entries(fleetSummary.vehicleStatus)
            .filter(([k]) => k !== "retired" || fleetSummary.vehicleStatus[k] > 0)
            .map(([k, count]) => {
              const cfg = VEHICLE_STATUS_COLORS_BG[k] || { bg: "#88888822", color: "#888" };
              const label = statusConfig.vehicle[k]?.label || k;
              return (
                <Box
                  key={k}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: cfg.bg,
                    border: `1px solid ${cfg.color}40`,
                    cursor: "pointer",
                    transition: "opacity .15s",
                    "&:hover": { opacity: 0.8 },
                  }}
                  onClick={() => setFilters((p) => ({ ...p, status: p.status === k ? "" : k }))}
                >
                  <Typography variant="caption" color="text.secondary" display="block">
                    {label}
                  </Typography>
                  <Typography variant="h6" fontWeight={800} sx={{ color: cfg.color, lineHeight: 1.2 }}>
                    {count}
                  </Typography>
                </Box>
              );
            })}
          <Box sx={{ px: 2, py: 1, borderRadius: 2, bgcolor: "rgba(211,47,47,0.08)", border: "1px solid rgba(211,47,47,0.25)", ml: "auto" }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Seat Utilisation
            </Typography>
            <Typography variant="h6" fontWeight={800} color="#D32F2F" lineHeight={1.2}>
              {fleetSummary.capacity.totalCapacity > 0
                ? `${Math.round((fleetSummary.capacity.assignedCapacity / fleetSummary.capacity.totalCapacity) * 100)}%`
                : "—"}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Filters */}
      <Card sx={{ p: 2, mb: 2.5 }}>
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <TextField
            size="small"
            placeholder="Search reg, make, model…"
            value={filters.search}
            onChange={(e) =>
              setFilters((p) => ({ ...p, search: e.target.value }))
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 240 }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) =>
                setFilters((p) => ({ ...p, status: e.target.value }))
              }
            >
              <MenuItem value="">All Statuses</MenuItem>
              {STATUS_OPTIONS.filter(Boolean).map((s) => (
                <MenuItem key={s} value={s}>
                  {statusConfig.vehicle[s]?.label || s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" ml="auto">
            {total} vehicle{total !== 1 ? "s" : ""}
          </Typography>
        </Box>
      </Card>

      <Card>
        {loading ? (
          <Box display="flex" justifyContent="center" p={5}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <>
            <TableContainer>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Registration</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Cap.</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Driver</TableCell>
                  <TableCell>Insurance</TableCell>
                  <TableCell>Roadworthy</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehicles.map((v) => {
                  const st = statusConfig.vehicle[v.status] || {};
                  const insColor =
                    v.insurance_days_left < 0
                      ? "error.main"
                      : v.insurance_days_left <= 30
                        ? "warning.main"
                        : "text.primary";
                  const rwColor =
                    v.roadworthiness_days_left < 0
                      ? "error.main"
                      : v.roadworthiness_days_left <= 30
                        ? "warning.main"
                        : "text.primary";
                  return (
                    <TableRow key={v.id} hover>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color="primary.main"
                        >
                          {v.registrationNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {v.make} {v.model} ({v.year})
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {vehicleTypeLabel[v.vehicleType] || v.vehicleType}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{v.capacity}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={st.label || v.status}
                          color={st.color || "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {v?.currentDriver?.name || (
                            <span style={{ color: "#555" }}>Unassigned</span>
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          color={insColor}
                          fontWeight={300}
                          fontSize={".8rem"}
                        >
                          {formatDate(v.insuranceExpiry)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          color={rwColor}
                          fontWeight={300}
                          fontSize={".8rem"}
                        >
                          {formatDate(v.roadworthinessExpiry)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={0.5} justifyContent="center">
                          <Tooltip title="Edit vehicle">
                            <IconButton
                              size="small"
                              component={Link}
                              to={`${base}/vehicles/${v.id}`}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {/* ── Assign Driver button ── */}
                          <Tooltip
                            title={
                              v?.currentDriver?.name
                                ? "Change driver"
                                : "Assign driver"
                            }
                          >
                            <IconButton
                              size="small"
                              onClick={() => setAssignVehicle(v)}
                              sx={{
                                color: v?.currentDriver?.name
                                  ? "primary.main"
                                  : "text.secondary",
                              }}
                            >
                              <PersonAddIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Change status">
                            <IconButton
                              size="small"
                              onClick={() =>
                                setStatusDlg({ vehicle: v, newStatus: "" })
                              }
                            >
                              <SwapHorizIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!vehicles.length && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      align="center"
                      sx={{ py: 5, color: "text.secondary" }}
                    >
                      No vehicles found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </TableContainer>
            {total > 15 && (
              <Box display="flex" justifyContent="center" p={2}>
                <Pagination
                  count={Math.ceil(total / 15)}
                  page={page}
                  onChange={(_, p) => setPage(p)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Card>

      {/* ── Assign Driver Modal ── */}
      <AssignDriverModal
        open={Boolean(assignVehicle)}
        vehicle={assignVehicle}
        onClose={() => setAssignVehicle(null)}
        onSuccess={(msg) => {
          setToast(msg);
          load();
        }}
      />

      {/* Status Change Dialog */}
      <Dialog
        open={Boolean(statusDlg)}
        onClose={() => setStatusDlg(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Change Vehicle Status</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Current status: <strong>{statusDlg?.vehicle?.status}</strong> —{" "}
            {statusDlg?.vehicle?.registrationNumber}
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              label="New Status"
              value={statusDlg?.newStatus || ""}
              onChange={(e) =>
                setStatusDlg((p) => ({ ...p, newStatus: e.target.value }))
              }
            >
              {(NEXT_STATUSES[statusDlg?.vehicle?.status] || []).map((s) => (
                <MenuItem key={s} value={s}>
                  {statusConfig.vehicle[s]?.label || s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            size="small"
            label="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDlg(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            disabled={!statusDlg?.newStatus || saving}
            onClick={handleStatusChange}
          >
            {saving ? <CircularProgress size={16} /> : "Update Status"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success toast */}
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
