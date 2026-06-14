import { useEffect, useState, useCallback } from "react";
import {
  Box, Card, CardContent, Typography, Button, Alert, CircularProgress,
  Chip, Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Divider,
} from "@mui/material";
import PaymentsIcon from "@mui/icons-material/Payments";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { salesAPI } from "../../api/client";
import { usePaged } from "../../hooks/usePaged";
import TablePager from "../../components/common/TablePager";
import { errorMessage, formatDate } from "../../utils/helpers";

const ghs = (n) => `GHS ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dt = (d) => (d ? new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");

const statusChip = (s) => {
  if (s.status === "success") return s.belowTarget ? { label: "Below target", color: "warning", variant: "filled" } : { label: "Settled", color: "success", variant: "outlined" };
  if (s.status === "failed") return { label: "Failed", color: "error", variant: "filled" };
  if (s.status === "pending") return { label: "Pending", color: "info", variant: "outlined" };
  return { label: "Cancelled", color: "default", variant: "outlined" }; // cancelled / abandoned
};

export default function DriverSalesCard() {
  const [config, setConfig] = useState(null);
  const [history, setHistory] = useState([]);
  const { paged: pagedHistory, page: histPage, setPage: setHistPage, pageCount: histPages, total: histTotal } = usePaged(history, 10);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [depStarting, setDepStarting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cfg, mine] = await Promise.all([salesAPI.config(), salesAPI.mine({ limit: 60 })]);
      setConfig(cfg);
      setHistory(mine.data || []);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount: if we've just returned from Paystack (?reference=…), verify it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("reference") || params.get("trxref");
    if (ref) {
      params.delete("reference"); params.delete("trxref");
      const qs = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash);
      setVerifying(true);
      salesAPI.verify(ref)
        .then((r) => { r.settled ? setOk(r.message) : setError(r.message); })
        .catch((e) => setError(errorMessage(e)))
        .finally(() => { setVerifying(false); load(); });
    } else {
      // Returned without a reference → the driver closed the payment window.
      // Cancel any outstanding pending attempt so it shows as cancelled, then load.
      salesAPI.cancelPending().catch(() => {}).finally(load);
    }
  }, [load]);

  const pay = async () => {
    setError(""); setOk(""); setStarting(true);
    try {
      const data = await salesAPI.init();
      window.location.href = data.authorizationUrl; // redirect to Paystack (amount fixed server-side)
    } catch (e) {
      setError(errorMessage(e));
      setStarting(false);
    }
  };

  const payDeposit = async () => {
    setError(""); setOk(""); setDepStarting(true);
    try {
      const data = await salesAPI.initDeposit();
      window.location.href = data.authorizationUrl; // redirect to Paystack (amount fixed server-side)
    } catch (e) {
      setError(errorMessage(e));
      setDepStarting(false);
    }
  };

  if (loading) {
    return <Card sx={{ mb: 3 }}><CardContent><Box display="flex" justifyContent="center" p={3}><CircularProgress size={28} /></Box></CardContent></Card>;
  }

  const target = config?.dailyTarget || 0;
  const accrues = !!config?.accrues;
  const reason = config?.reason;
  const vehicle = config?.vehicle;
  const st = config?.settlement || {};
  const flagged = st.flagged;
  const pauseMsg = reason === "no_vehicle"
    ? "You have no assigned vehicle, so there is nothing to settle right now."
    : reason === "vehicle_off_road"
      ? "Your vehicle is off the road (maintenance/out of service) — settlements are paused."
      : "No daily sales amount is set for your vehicle. Please contact an administrator.";
  const dueAmount = st.nextDueAmount || target;
  const deposit = config?.deposit;
  const nothingDue = accrues && (st.openCount === 0);

  return (
    <Card sx={{ mb: 3, border: flagged ? "1px solid #F44336" : undefined }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1.5} mb={1.5} flexWrap="wrap">
          <PaymentsIcon color="primary" />
          <Typography variant="h6" fontWeight={700} fontSize="1.05rem">Daily Sales Settlement</Typography>
          {vehicle && (
            <Chip size="small" variant="outlined" label={vehicle.registrationNumber} sx={{ ml: "auto" }} />
          )}
          <Chip size="small" label={`Daily total: ${ghs(target)}`} sx={{ ml: vehicle ? 0 : "auto", fontWeight: 700 }} />
        </Box>

        {verifying && <Alert severity="info" sx={{ mb: 2 }}>Confirming your payment…</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        {ok && <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }} onClose={() => setOk("")}>{ok}</Alert>}

        {deposit && !deposit.paid && (
          <Alert
            severity="warning"
            icon={<AccountBalanceWalletIcon />}
            sx={{ mb: 2 }}
            action={
              <Button
                color="warning"
                variant="contained"
                size="small"
                onClick={payDeposit}
                disabled={depStarting || !config?.paystackConfigured}
                startIcon={depStarting ? <CircularProgress size={14} color="inherit" /> : <AccountBalanceWalletIcon />}
              >
                {depStarting ? "Redirecting…" : `Pay ${ghs(deposit.amount)} deposit`}
              </Button>
            }
          >
            <b>Refundable deposit unpaid.</b> You must pay your {ghs(deposit.amount)} refundable deposit before you can be assigned a vehicle.
          </Alert>
        )}

        {accrues && (flagged ? (
          <Alert severity="error" icon={<WarningAmberIcon />} sx={{ mb: 2 }}>
            <b>Account flagged:</b> you have {st.arrearsDays} unsettled day{st.arrearsDays === 1 ? "" : "s"} ({ghs(st.arrearsAmount)}) past the deadline.
            Settle in full immediately to clear the flag.
          </Alert>
        ) : st.nextDueAt ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            You have a sales day awaiting settlement (for <b>{vehicle ? vehicle.registrationNumber : "your car"}</b>). Pay in full by <b>{dt(st.nextDueAt)}</b> (next day, 12:00 noon).
          </Alert>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            All settled. Today's sales become due tomorrow by 12:00 noon.
          </Typography>
        ))}

        {!accrues ? (
          <Alert severity="info" sx={{ mb: 1 }}>{pauseMsg}</Alert>
        ) : nothingDue ? (
          <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 1 }}>
            You're all settled. Today's sales become due tomorrow by 12:00 noon.
          </Alert>
        ) : (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              You pay the full amount for the day being settled — <b>part payments are not allowed</b>. The amount is fixed automatically.
            </Alert>
            <Button
              variant="contained"
              color={flagged ? "error" : "primary"}
              onClick={pay}
              disabled={starting || !config?.paystackConfigured}
              startIcon={starting ? <CircularProgress size={16} color="inherit" /> : <PaymentsIcon />}
            >
              {starting ? "Redirecting…" : `Pay ${ghs(dueAmount)} in full`}
            </Button>
            {!config?.paystackConfigured && (
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                Online payments aren't configured. Please contact an administrator.
              </Typography>
            )}
          </>
        )}

        <Divider sx={{ my: 2.5 }} />

        <Typography variant="subtitle2" fontWeight={700} mb={1}>Payments</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Sales day</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedHistory.map((s) => {
                const c = statusChip(s);
                return (
                  <TableRow key={s._id} hover>
                    <TableCell>{formatDate(s.date)}</TableCell>
                    <TableCell>
                      {s.vehicleReg || "—"}
                      {s.vehicleMake && <Typography variant="caption" color="text.secondary" display="block">{s.vehicleMake}</Typography>}
                    </TableCell>
                    <TableCell align="right">{s.status === "success" ? ghs(s.amount) : ghs(s.target)}</TableCell>
                    <TableCell align="center">
                      <Chip size="small" label={c.label} color={c.color} variant={c.variant} />
                    </TableCell>
                  </TableRow>
                );
              })}
              {!history.length && (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: "text.secondary" }}>No payments yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePager page={histPage} count={histPages} onChange={setHistPage} total={histTotal} />
      </CardContent>
    </Card>
  );
}
