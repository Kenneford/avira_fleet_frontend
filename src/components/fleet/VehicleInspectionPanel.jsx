import { useEffect, useState, useCallback } from "react";
import {
  Card, CardContent, Typography, Box, Chip, Button, Alert, CircularProgress,
  TextField, MenuItem, Select, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Divider, Tooltip, IconButton,
} from "@mui/material";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import EditIcon from "@mui/icons-material/Edit";
import { vehicleAPI } from "../../api/client";
import { usePaged } from "../../hooks/usePaged";
import TablePager from "../../components/common/TablePager";
import { errorMessage } from "../../utils/helpers";

const fmt = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—");
const toInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
const OUTCOME = { passed: { label: "Passed", color: "success" }, maintenance: { label: "Maintenance completed", color: "warning" }, failed: { label: "Failed", color: "error" } };

const STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "assigned", label: "Assigned" },
  { value: "maintenance", label: "In maintenance" },
  { value: "out_of_service", label: "Out of service" },
  { value: "retired", label: "Retired" },
];
const statusLabel = (v) => STATUS_OPTIONS.find((s) => s.value === v)?.label || v || "—";

const STATE = {
  none: { sev: "info", label: "No inspection scheduled" },
  ok: { sev: "success", label: "Up to date" },
  due_soon: { sev: "warning", label: "Due soon" },
  overdue: { sev: "error", label: "Overdue" },
};

export default function VehicleInspectionPanel({ vehicleId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [form, setForm] = useState({ nextInspectionDue: "", inspectionIntervalDays: 30 });
  const [saving, setSaving] = useState(false);
  const [dlg, setDlg] = useState(false);
  const [comp, setComp] = useState({ outcome: "passed", notes: "", odometer: "", cost: "", setStatus: "" });
  const [completing, setCompleting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [vehStatus, setVehStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    vehicleAPI.inspections(vehicleId)
      .then((d) => {
        setData(d);
        setForm({
          nextInspectionDue: toInput(d.vehicle?.nextInspectionDue),
          inspectionIntervalDays: d.vehicle?.inspectionIntervalDays || 30,
        });
        setVehStatus(d.vehicle?.status || "");
        setStatusReason("");
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [vehicleId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setError(""); setOk("");
    try {
      await vehicleAPI.scheduleInspection(vehicleId, {
        nextInspectionDue: form.nextInspectionDue || null,
        inspectionIntervalDays: Number(form.inspectionIntervalDays) || 30,
      });
      setOk("Inspection schedule saved.");
      await load();
    } catch (e) { setError(errorMessage(e)); } finally { setSaving(false); }
  };

  const submit = async () => {
    setCompleting(true); setError(""); setOk("");
    try {
      const body = {
        outcome: comp.outcome,
        notes: comp.notes.trim() || null,
        odometer: comp.odometer || null,
        cost: comp.cost || 0,
        setStatus: comp.setStatus || undefined,
      };
      if (editId) {
        await vehicleAPI.updateInspection(vehicleId, editId, body);
        setOk("Inspection updated." + (comp.setStatus ? ` Vehicle set to ${statusLabel(comp.setStatus)}.` : ""));
      } else {
        await vehicleAPI.completeInspection(vehicleId, body);
        setOk("Inspection recorded." + (comp.setStatus ? ` Vehicle set to ${statusLabel(comp.setStatus)}.` : " Next due date advanced."));
      }
      setDlg(false); setEditId(null);
      setComp({ outcome: "passed", notes: "", odometer: "", cost: "", setStatus: "" });
      await load();
    } catch (e) { setError(errorMessage(e)); } finally { setCompleting(false); }
  };

  const saveStatus = async () => {
    setSavingStatus(true); setError(""); setOk("");
    try {
      await vehicleAPI.updateStatus(vehicleId, { status: vehStatus, reason: statusReason.trim() || undefined });
      setOk(`Vehicle status updated to ${statusLabel(vehStatus)}.`);
      await load();
    } catch (e) { setError(errorMessage(e)); } finally { setSavingStatus(false); }
  };

  const st = data?.inspection?.state || "none";
  const days = data?.inspection?.daysLeft;
  const cfg = STATE[st] || STATE.none;
  const latest = data?.history?.[0] || null;
  const alreadyMarked = !!data?.vehicle?.lastInspectionAt && ["ok", "due_soon"].includes(st);
  const openComplete = () => {
    setEditId(null);
    setComp({ outcome: "passed", notes: "", odometer: "", cost: "", setStatus: "" });
    setDlg(true);
  };
  const openEdit = (rec) => {
    setEditId(rec._id);
    setComp({ outcome: rec.outcome || "passed", notes: rec.notes || "", odometer: rec.odometer ?? "", cost: rec.cost ?? "", setStatus: "" });
    setDlg(true);
  };
  const { paged: pagedHistory, page: histPage, setPage: setHistPage, pageCount: histPages, total: histTotal } = usePaged(data?.history || [], 10, [data]);

  return (
    <Card sx={{ mb: 2.5 }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <BuildCircleIcon fontSize="small" color="action" />
          <Typography variant="h6" fontSize="0.9rem" fontWeight={700}>Inspection & Maintenance</Typography>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}><CircularProgress size={24} /></Box>
        ) : (
          <>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
            {ok && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setOk("")}>{ok}</Alert>}

            <Alert
              severity={cfg.sev}
              icon={st === "overdue" ? <WarningAmberIcon /> : st === "ok" ? <CheckCircleIcon /> : undefined}
              sx={{ mb: 2 }}
            >
              <b>{cfg.label}.</b>{" "}
              {st === "overdue" && `Inspection overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} (was due ${fmt(data?.vehicle?.nextInspectionDue)}).`}
              {st === "due_soon" && `Due in ${days} day${days === 1 ? "" : "s"} (${fmt(data?.vehicle?.nextInspectionDue)}).`}
              {st === "ok" && `Next inspection ${fmt(data?.vehicle?.nextInspectionDue)}.`}
              {st === "none" && "Set a next-due date to start monthly inspection tracking."}
              {data?.vehicle?.lastInspectionAt ? ` Last done ${fmt(data.vehicle.lastInspectionAt)}.` : ""}
            </Alert>

            {/* Vehicle operational status — send it to maintenance or back to service. */}
            <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" mb={2}>
              <Chip
                size="small"
                color={data?.vehicle?.status === "available" ? "success" : data?.vehicle?.status === "maintenance" ? "warning" : data?.vehicle?.status === "out_of_service" ? "error" : "default"}
                label={`Status: ${statusLabel(data?.vehicle?.status)}`}
                sx={{ fontWeight: 700 }}
              />
              <TextField
                select size="small" label="Set status" sx={{ minWidth: 170 }}
                value={vehStatus} onChange={(e) => setVehStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
              <TextField
                size="small" label="Reason (optional)" value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)} sx={{ minWidth: 180 }}
              />
              <Button
                variant="outlined" onClick={saveStatus}
                disabled={savingStatus || !vehStatus || vehStatus === data?.vehicle?.status}
              >
                {savingStatus ? <CircularProgress size={16} /> : "Update status"}
              </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" mb={1}>
              <TextField
                size="small" type="date" label="Next inspection due" InputLabelProps={{ shrink: true }}
                value={form.nextInspectionDue} onChange={(e) => setForm((f) => ({ ...f, nextInspectionDue: e.target.value }))}
              />
              <Tooltip title="Days between inspections — 30 = monthly">
                <TextField
                  size="small" type="number" label="Interval (days)" sx={{ width: 140 }}
                  value={form.inspectionIntervalDays} onChange={(e) => setForm((f) => ({ ...f, inspectionIntervalDays: e.target.value }))}
                  inputProps={{ min: 1 }}
                />
              </Tooltip>
              <Button variant="outlined" onClick={save} disabled={saving}>
                {saving ? <CircularProgress size={16} /> : "Save schedule"}
              </Button>
              <Tooltip title={alreadyMarked ? "Already recorded for this period — edit it in the history below" : ""}>
                <span style={{ marginLeft: "auto" }}>
                  <Button
                    variant="contained" color="success" startIcon={<CheckCircleIcon />}
                    onClick={openComplete} disabled={alreadyMarked}
                  >
                    Mark inspection complete
                  </Button>
                </span>
              </Tooltip>
            </Box>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={700} mb={1}>History</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Outcome</TableCell>
                    <TableCell>By</TableCell>
                    <TableCell align="right">Odometer</TableCell>
                    <TableCell align="right">Cost</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell align="center">Edit</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedHistory.map((h) => {
                    const oc = OUTCOME[h.outcome] || OUTCOME.passed;
                    return (
                      <TableRow key={h._id} hover>
                        <TableCell>{fmt(h.performedAt)}</TableCell>
                        <TableCell><Chip size="small" color={oc.color} label={oc.label} /></TableCell>
                        <TableCell>{h.performedBy?.name || h.performedByName || "—"}</TableCell>
                        <TableCell align="right">{h.odometer != null ? h.odometer.toLocaleString() : "—"}</TableCell>
                        <TableCell align="right">{h.cost ? `GHS ${Number(h.cost).toLocaleString()}` : "—"}</TableCell>
                        <TableCell>{h.notes || "—"}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit this record">
                            <IconButton size="small" onClick={() => openEdit(h)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!(data?.history || []).length && (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color: "text.secondary" }}>No inspections recorded yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePager page={histPage} count={histPages} onChange={setHistPage} total={histTotal} />
          </>
        )}
      </CardContent>

      <Dialog open={dlg} onClose={() => !completing && setDlg(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editId ? "Edit inspection" : "Record inspection"}</DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            select
            size="small"
            fullWidth
            label="Outcome"
            value={comp.outcome}
            onChange={(e) => setComp((c) => ({ ...c, outcome: e.target.value }))}
          >
            <MenuItem value="passed">Passed</MenuItem>
            <MenuItem value="maintenance">Maintenance completed</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
          </TextField>
          <TextField size="small" type="number" label="Odometer (optional)" value={comp.odometer} onChange={(e) => setComp((c) => ({ ...c, odometer: e.target.value }))} />
          <TextField size="small" type="number" label="Cost GHS (optional)" value={comp.cost} onChange={(e) => setComp((c) => ({ ...c, cost: e.target.value }))} />
          <TextField size="small" multiline rows={2} label="Notes (optional)" value={comp.notes} onChange={(e) => setComp((c) => ({ ...c, notes: e.target.value }))} />
          <TextField
            select size="small" label="Set vehicle status (optional)"
            value={comp.setStatus} onChange={(e) => setComp((c) => ({ ...c, setStatus: e.target.value }))}
          >
            <MenuItem value="">— No change —</MenuItem>
            {STATUS_OPTIONS.filter((o) => o.value !== "assigned" && o.value !== "retired").map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </TextField>
          <Typography variant="caption" color="text.secondary">
            Next due advances by the interval ({form.inspectionIntervalDays} days) from today.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlg(false)} disabled={completing}>Cancel</Button>
          <Button variant="contained" color="success" onClick={submit} disabled={completing}>
            {completing ? <CircularProgress size={18} /> : editId ? "Save" : "Record"}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
