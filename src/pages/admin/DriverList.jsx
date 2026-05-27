import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Card,
  Table,
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
  CircularProgress,
  Pagination,
  Alert,
  Avatar,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import { driverAPI, analyticsAPI } from "../../api/client";
import { statusConfig, formatDate, errorMessage } from "../../utils/helpers";

const DRIVER_STATUS_COLORS = {
  active:    { bg: "#4CAF5022", color: "#4CAF50" },
  on_leave:  { bg: "#FF980022", color: "#FF9800" },
  suspended: { bg: "#F4433622", color: "#F44336" },
  inactive:  { bg: "#9E9E9E22", color: "#9E9E9E" },
};

export default function DriverList() {
  const [drivers, setDrivers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [error, setError] = useState("");
  const [driverSummary, setDriverSummary] = useState(null);

  useEffect(() => {
    analyticsAPI.fleet().then(({ data }) => setDriverSummary(data.driverStatus)).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    driverAPI
      .list({ page, limit: 15, ...filters })
      .then(({ data }) => {
        setDrivers(data.data);
        setTotal(data.total);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [page, filters]);

  useEffect(() => {
    load();
  }, [load]);

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
            Personnel
          </Typography>
          <Typography variant="h4" fontWeight={800}>
            Drivers
          </Typography>
        </Box>
        <Button
          component={Link}
          to="/admin/drivers/new"
          variant="contained"
          color="primary"
        >
          + Add Driver
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* ── Driver status summary bar ── */}
      {driverSummary && (
        <Box display="flex" gap={1.5} mb={2.5} flexWrap="wrap">
          {Object.entries(driverSummary).map(([k, count]) => {
            const cfg = DRIVER_STATUS_COLORS[k] || { bg: "#88888822", color: "#888" };
            const label = statusConfig.driver[k]?.label || k;
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
        </Box>
      )}

      <Card sx={{ p: 2, mb: 2.5 }}>
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <TextField
            size="small"
            placeholder="Search name, email, license…"
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
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) =>
                setFilters((p) => ({ ...p, status: e.target.value }))
              }
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="on_leave">On Leave</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" ml="auto">
            {total} driver{total !== 1 ? "s" : ""}
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
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Driver</TableCell>
                  <TableCell>License</TableCell>
                  <TableCell>License Expiry</TableCell>
                  <TableCell>Assigned Vehicle</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Experience</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {drivers.map((d) => {
                  const st = statusConfig.driver[d.status] || {};
                  const licColor =
                    d.license_days_left < 0
                      ? "error.main"
                      : d.license_days_left <= 30
                        ? "warning.main"
                        : "text.primary";
                  return (
                    <TableRow key={d.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: "#C8A84B",
                              color: "#000",
                              fontSize: "0.8rem",
                              fontWeight: 800,
                            }}
                          >
                            {d?.user?.name?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {d?.user?.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {d?.user?.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {d.licenseNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {d.licenseClass}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color={licColor}>
                          {formatDate(d.licenseExpiry)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {d.assignedVehicle ? (
                          <>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color="primary.main"
                            >
                              {d.assignedVehicle?.registrationNumber}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {d.assignedVehicle?.make}{" "}
                              {d.assignedVehicle?.model}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            Unassigned
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={st.label || d.status}
                          color={st.color || "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {d.yearsExperience} yr
                          {d.yearsExperience !== 1 ? "s" : ""}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit driver">
                          <IconButton
                            size="small"
                            component={Link}
                            to={`/admin/drivers/${d.id}`}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!drivers.length && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      align="center"
                      sx={{ py: 5, color: "text.secondary" }}
                    >
                      No drivers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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
    </Box>
  );
}
