import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Card, CardContent, Typography, Button, Alert, CircularProgress,
  Grid, Avatar, Chip, Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, TextField,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import UndoIcon from "@mui/icons-material/Undo";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
} from "recharts";
import CustomTooltip from "../../components/charts/CustomTooltip";
import { salesAPI } from "../../api/client";
import { usePaged } from "../../hooks/usePaged";
import TablePager from "../../components/common/TablePager";
import { errorMessage, formatDate, avatarColor } from "../../utils/helpers";

const dtl = (d) => (d ? new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");
const statusChip = (s) => {
  if (s.status === "success") return s.belowTarget ? { label: "Below target", color: "warning", variant: "filled" } : { label: "Settled", color: "success", variant: "outlined" };
  if (s.status === "failed") return { label: "Failed", color: "error", variant: "filled" };
  if (s.status === "pending") return { label: "Pending", color: "info", variant: "outlined" };
  if (s.status === "voided") return { label: "Voided", color: "default", variant: "filled" };
  if (s.status === "abandoned") return { label: "Abandoned", color: "default", variant: "outlined" };
  return { label: "Cancelled", color: "default", variant: "outlined" };
};
const ghs = (n) => `GHS ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function PeriodCard({ title, data }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary">{title}</Typography>
        <Typography variant="h4" fontWeight={800} sx={{ color: "#D32F2F", lineHeight: 1.2, mt: 0.5 }}>
          {ghs(data?.total)}
        </Typography>
        <Box display="flex" gap={1} mt={1.5} flexWrap="wrap">
          <Chip size="small" label={`${data?.count || 0} payment${data?.count === 1 ? "" : "s"}`} />
          <Chip size="small" color="success" variant="outlined" label={`${data?.onTarget || 0} on target`} />
          {data?.belowTarget > 0 && (
            <Chip size="small" color="warning" label={`${data.belowTarget} below`} />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DriverSalesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [voidTarget, setVoidTarget] = useState(null);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);
  const { paged: pagedRecords, page: recPage, setPage: setRecPage, pageCount: recPages, total: recTotal } = usePaged(data?.records || [], 10, [data]);

  const reload = () =>
    salesAPI.driver(id)
      .then((d) => setData(d))
      .catch((e) => setError(errorMessage(e)));

  useEffect(() => {
    let active = true;
    setLoading(true);
    salesAPI.driver(id)
      .then((d) => { if (active) setData(d); })
      .catch((e) => { if (active) setError(errorMessage(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const confirmVoid = async () => {
    if (!voidTarget) return;
    setVoiding(true);
    setError("");
    try {
      const r = await salesAPI.voidSale(voidTarget._id, voidReason.trim());
      setNotice(r?.message || "Settlement voided.");
      setVoidTarget(null);
      setVoidReason("");
      await reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setVoiding(false);
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" p={6}><CircularProgress /></Box>;
  }
  if (error) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/admin/drivers")} sx={{ mb: 2 }}>Back to drivers</Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const d = data.driver;
  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/admin/drivers")} sx={{ mb: 2 }} size="small">
        Back to drivers
      </Button>

      <Box display="flex" alignItems="center" gap={2} mb={3} flexWrap="wrap">
        <Avatar sx={{ width: 52, height: 52, bgcolor: avatarColor(d?.name), color: "#fff", fontWeight: 800 }}>
          {d?.name?.charAt(0)}
        </Avatar>
        <Box>
          <Typography variant="overline" display="block" color="text.secondary">Driver sales</Typography>
          <Typography variant="h4" fontWeight={800}>{d?.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {d?.email} · Daily target {ghs(d?.dailyTarget)}
          </Typography>
        </Box>
      </Box>

      {data.settlement && (
        data.settlement.flagged ? (
          <Alert severity="error" icon={<WarningAmberIcon />} sx={{ mb: 3 }}>
            <b>Flagged:</b> {data.settlement.arrearsDays} unsettled day{data.settlement.arrearsDays === 1 ? "" : "s"} ({ghs(data.settlement.arrearsAmount)})
            past the deadline{data.settlement.oldestUnsettled ? `, oldest since ${new Date(data.settlement.oldestUnsettled).toLocaleDateString()}` : ""}.
          </Alert>
        ) : (
          <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 3 }}>
            Up to date — no overdue settlements{data.settlement.nextDueAt ? `. Next due ${dtl(data.settlement.nextDueAt)}.` : "."}
          </Alert>
        )
      )}

      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} sm={4}><PeriodCard title="This week"  data={data.periods.week} /></Grid>
        <Grid item xs={12} sm={4}><PeriodCard title="This month" data={data.periods.month} /></Grid>
        <Grid item xs={12} sm={4}><PeriodCard title="This year"  data={data.periods.year} /></Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} fontSize="1rem" mb={2}>Monthly sales (this year)</Typography>
          <Box sx={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ReTooltip content={<CustomTooltip />} />
                <Bar dataKey="total" fill="#D32F2F" radius={[4, 4, 0, 0]} name="Sales (GHS)" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {notice && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice("")}>{notice}</Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={700} fontSize="1rem" mb={1}>Recent payments</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Vehicle</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Target</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedRecords.map((s) => {
                  const c = statusChip(s);
                  return (
                    <TableRow key={s._id} hover>
                      <TableCell>{formatDate(s.date)}</TableCell>
                      <TableCell>
                        {s.vehicleReg || "—"}
                        {s.vehicleMake && <Typography variant="caption" color="text.secondary" display="block">{s.vehicleMake}</Typography>}
                      </TableCell>
                      <TableCell align="right">{s.status === "success" ? ghs(s.amount) : ghs(s.target)}</TableCell>
                      <TableCell align="right">{ghs(s.target)}</TableCell>
                      <TableCell align="center">
                        <Chip size="small" label={c.label} color={c.color} variant={c.variant} />
                      </TableCell>
                      <TableCell align="center">
                        {s.status === "success" ? (
                          <Tooltip title="Void this settlement (reopens the day & reverses revenue)">
                            <IconButton size="small" color="error" onClick={() => { setVoidTarget(s); setVoidReason(""); }}>
                              <UndoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.disabled">{"—"}</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!data.records.length && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      No payments recorded this year
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePager page={recPage} count={recPages} onChange={setRecPage} total={recTotal} />
        </CardContent>
      </Card>

      <Dialog open={!!voidTarget} onClose={() => !voiding && setVoidTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Void this settlement?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {voidTarget && (
              <>This reverses the {ghs(voidTarget.amount)} settlement for{" "}
              <strong>{voidTarget.day}</strong>{voidTarget.vehicleReg ? ` (${voidTarget.vehicleReg})` : ""}. The day
              becomes unsettled again and a reversing entry is booked in Revenue. The
              original record is kept for the audit trail.</>
            )}
          </DialogContentText>
          <TextField
            fullWidth
            size="small"
            label="Reason (optional)"
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            placeholder="e.g. duplicate / charged in error"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVoidTarget(null)} disabled={voiding}>Cancel</Button>
          <Button onClick={confirmVoid} color="error" variant="contained" disabled={voiding}>
            {voiding ? <CircularProgress size={18} /> : "Void settlement"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
