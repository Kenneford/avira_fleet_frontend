import { useEffect, useState } from "react";
import {
  Card, CardContent, Typography, Box, Chip, CircularProgress, Alert,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import { vehicleAPI, driverAPI } from "../../api/client";
import { usePaged } from "../../hooks/usePaged";
import TablePager from "../../components/common/TablePager";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—");
const dur = (days) => {
  if (days == null) return "—";
  if (days < 1) return "<1 day";
  if (days < 30) return `${days} day${days === 1 ? "" : "s"}`;
  const m = Math.floor(days / 30);
  return `${m} mo${m === 1 ? "" : "s"}${days % 30 ? ` ${days % 30}d` : ""}`;
};
const REASON = {
  reassigned: "Reassigned", unassigned: "Unassigned",
  vehicle_retired: "Vehicle retired", backfill: "From records",
};

function HistoryShell({ icon, title, count, countLabel, loading, error, empty, children }) {
  return (
    <Card sx={{ mb: 2.5 }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          {icon}
          <Typography variant="h6" fontSize="0.9rem" fontWeight={700}>{title}</Typography>
          {count != null && (
            <Chip size="small" label={`${count} ${countLabel}`} sx={{ ml: 0.5 }} />
          )}
        </Box>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}><CircularProgress size={24} /></Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : empty ? (
          <Typography variant="body2" color="text.secondary">No assignment history yet.</Typography>
        ) : children}
      </CardContent>
    </Card>
  );
}

const StatusCell = ({ r }) =>
  r.active ? (
    <Chip size="small" color="success" label="Current" sx={{ fontWeight: 700 }} />
  ) : (
    <Chip size="small" variant="outlined" label={REASON[r.endedReason] || "Ended"} />
  );

export function VehicleDriverHistory({ vehicleId }) {
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let on = true;
    vehicleAPI.driverHistory(vehicleId)
      .then((r) => on && setD(r))
      .catch((e) => on && setError(e?.response?.data?.message || "Could not load driver history"))
      .finally(() => on && setLoading(false));
    return () => { on = false; };
  }, [vehicleId]);

  const rows = d?.history || [];
  const { paged, page, setPage, pageCount, total } = usePaged(rows, 10, [d]);
  return (
    <HistoryShell
      icon={<HistoryIcon fontSize="small" color="action" />}
      title="Driver history"
      count={d ? d.totalDrivers : null}
      countLabel={d?.totalDrivers === 1 ? "driver all-time" : "drivers all-time"}
      loading={loading} error={error} empty={!loading && !error && !rows.length}
    >
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Driver</TableCell>
              <TableCell>From</TableCell>
              <TableCell>To</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paged.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{r.driverName || "—"}</Typography>
                  {r.licenseNumber && <Typography variant="caption" color="text.secondary">{r.licenseNumber}</Typography>}
                </TableCell>
                <TableCell>{fmtDate(r.assignedAt)}</TableCell>
                <TableCell>{r.active ? "—" : fmtDate(r.unassignedAt)}</TableCell>
                <TableCell>{dur(r.days)}</TableCell>
                <TableCell align="center"><StatusCell r={r} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePager page={page} count={pageCount} onChange={setPage} total={total} />
    </HistoryShell>
  );
}

export function DriverVehicleHistory({ driverId }) {
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let on = true;
    driverAPI.vehicleHistory(driverId)
      .then((r) => on && setD(r))
      .catch((e) => on && setError(e?.response?.data?.message || "Could not load vehicle history"))
      .finally(() => on && setLoading(false));
    return () => { on = false; };
  }, [driverId]);

  const rows = d?.history || [];
  const { paged, page, setPage, pageCount, total } = usePaged(rows, 10, [d]);
  return (
    <HistoryShell
      icon={<HistoryIcon fontSize="small" color="action" />}
      title="Vehicles driven"
      count={d ? d.totalVehicles : null}
      countLabel={d?.totalVehicles === 1 ? "vehicle all-time" : "vehicles all-time"}
      loading={loading} error={error} empty={!loading && !error && !rows.length}
    >
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Vehicle</TableCell>
              <TableCell>From</TableCell>
              <TableCell>To</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paged.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600} color="primary.main">{r.registrationNumber || "—"}</Typography>
                  <Typography variant="caption" color="text.secondary">{[r.make, r.model].filter(Boolean).join(" ")}</Typography>
                </TableCell>
                <TableCell>{fmtDate(r.assignedAt)}</TableCell>
                <TableCell>{r.active ? "—" : fmtDate(r.unassignedAt)}</TableCell>
                <TableCell>{dur(r.days)}</TableCell>
                <TableCell align="center"><StatusCell r={r} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePager page={page} count={pageCount} onChange={setPage} total={total} />
    </HistoryShell>
  );
}
