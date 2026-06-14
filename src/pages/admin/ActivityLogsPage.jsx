import { useEffect, useState, useCallback } from "react";
import {
  Box, Card, CardContent, Typography, Tabs, Tab, Chip, Avatar, TextField,
  Select, MenuItem, FormControl, InputLabel, InputAdornment, Table, TableHead,
  TableBody, TableRow, TableCell, TableContainer, Pagination, CircularProgress,
  Alert, Stack, Button, Dialog, DialogTitle, DialogContent, IconButton, Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { auditAPI } from "../../api/client";
import { errorMessage } from "../../utils/helpers";

const ACTIVITY_ACTIONS = [
  "create", "update", "delete", "status_change", "assign", "unassign",
  "role_change", "password_reset", "payment", "deposit_paid", "deposit_refund",
  "void", "refund",
];
const RESOURCES = ["vehicle", "driver", "schedule", "user", "revenue", "daily_sales", "driver_application"];
const SECURITY_ACTIONS = [
  "login", "login_failed", "logout", "token_refresh", "password_change",
  "password_reset", "password_reset_requested", "2fa_challenge", "2fa_enabled", "2fa_disabled",
];

const ACTION_COLOR = {
  create: "success", update: "info", delete: "error", status_change: "warning",
  assign: "primary", unassign: "default", role_change: "secondary",
  payment: "success", deposit_paid: "success", deposit_refund: "warning",
  void: "error", refund: "warning", password_reset: "warning",
  login: "success", login_failed: "error", logout: "default",
  token_refresh: "default", password_change: "info",
  password_reset_requested: "warning", "2fa_challenge": "info",
  "2fa_enabled": "success", "2fa_disabled": "warning",
};
const ROLE_COLOR = { admin: "error", fleet_manager: "warning", driver: "info", developer: "secondary" };
const label = (s) => String(s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const dt = (d) => (d ? new Date(d).toLocaleString(undefined, { dateStyle: "full", timeStyle: "medium" }) : "—");
const dtShort = (d) => (d ? new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");

const fmtVal = (v) =>
  v == null ? "—" : typeof v === "object" ? JSON.stringify(v, null, 2) : String(v);

// A diff value looks like { from, to }.
const isDiff = (v) => v && typeof v === "object" && !Array.isArray(v) && ("from" in v || "to" in v);
const changedCount = (changes) =>
  changes && typeof changes === "object" ? Object.values(changes).filter(isDiff).length : 0;

// A labelled row in the snapshot.
function Field({ k, children }) {
  return (
    <Box display="flex" gap={1.5} py={0.75} sx={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 120, fontWeight: 600 }}>{k}</Typography>
      <Box flex={1} sx={{ fontSize: "0.8rem", wordBreak: "break-word" }}>{children}</Box>
    </Box>
  );
}

// Detailed snapshot of a single log entry.
function SnapshotDialog({ entry, mode, onClose }) {
  if (!entry) return null;
  const changeEntries = entry.changes && typeof entry.changes === "object" ? Object.entries(entry.changes) : [];
  return (
    <Dialog open={!!entry} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pr: 6 }}>
        <FactCheckIcon color="primary" fontSize="small" />
        <Box>
          <Typography variant="overline" color="text.secondary" display="block" lineHeight={1}>
            {mode === 0 ? "Activity snapshot" : "Security snapshot"}
          </Typography>
          <Typography variant="h6" fontSize="1rem" fontWeight={800}>{label(entry.action)}</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Field k="When">{dt(entry.createdAt)}</Field>
        <Field k="User">
          <Box display="flex" alignItems="center" gap={1}>
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }}>{entry.userName || entry.name || "—"}</Typography>
            {(entry.userRole || entry.role) && (
              <Chip size="small" label={label(entry.userRole || entry.role)} color={ROLE_COLOR[entry.userRole || entry.role] || "default"} sx={{ height: 18, fontSize: "0.7rem", border: "none" }} />
            )}
          </Box>
        </Field>
        <Field k="Action">
          <Chip size="small" label={label(entry.action)} color={ACTION_COLOR[entry.action] || "default"} sx={{ fontSize: "0.8rem", border: "none" }} />
        </Field>
        {mode === 0 ? (
          <>
            <Field k="Resource">{label(entry.resource)}</Field>
            {entry.resourceLabel && <Field k="Target">{entry.resourceLabel}</Field>}
            {entry.resourceId && <Field k="Record ID">{entry.resourceId}</Field>}
          </>
        ) : (
          <>
            <Field k="Result">
              <Chip size="small" label={entry.success ? "Success" : "Failed"} color={entry.success ? "success" : "error"} sx={{ fontSize: "0.8rem", border: "none" }} />
            </Field>
            {entry.email && <Field k="Email">{entry.email}</Field>}
            {entry.detail && <Field k="Detail">{entry.detail}</Field>}
            {entry.userAgent && <Field k="Device">{entry.userAgent}</Field>}
          </>
        )}
        <Field k="IP address">{entry.ip || "—"}</Field>

        {mode === 0 && changeEntries.length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                {changedCount(entry.changes) > 0 ? "What changed" : "Details"}
              </Typography>
              {changedCount(entry.changes) > 0 && (
                <Chip size="small" color="warning" label={`${changedCount(entry.changes)} field${changedCount(entry.changes) === 1 ? "" : "s"} changed`} sx={{ fontSize: "0.7rem", border: "none" }} />
              )}
            </Box>
            <Box mt={0.5}>
              {changeEntries.map(([k, v]) => (
                <Box key={k} display="flex" gap={1.5} py={0.5} alignItems="flex-start">
                  <Typography variant="caption" sx={{ minWidth: 120, fontWeight: 600 }}>{k}</Typography>
                  {isDiff(v) ? (
                    <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Typography component="span" sx={{ fontSize: "0.8rem", textDecoration: "line-through", color: "text.disabled", wordBreak: "break-word" }}>
                        {fmtVal(v.from)}
                      </Typography>
                      <Typography component="span" sx={{ fontSize: "0.9rem", color: "text.secondary" }}>→</Typography>
                      <Typography component="span" sx={{ fontSize: "0.8rem", fontWeight: 700, color: "success.main", wordBreak: "break-word" }}>
                        {fmtVal(v.to)}
                      </Typography>
                    </Box>
                  ) : (
                    <Box component="pre" sx={{ m: 0, flex: 1, fontSize: "0.8rem", whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit" }}>
                      {fmtVal(v)}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ActivityLogsPage() {
  const [tab, setTab] = useState(0); // 0 = activity, 1 = security
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [stats, setStats] = useState(null);
  const [retention, setRetention] = useState(180);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actors, setActors] = useState([]);
  const [snap, setSnap] = useState(null);
  const [f, setF] = useState({ q: "", action: "", resource: "", userId: "", success: "", from: "", to: "" });
  const LIMIT = 10;

  useEffect(() => { auditAPI.users().then((d) => setActors(d.users || [])).catch(() => {}); }, []);
  useEffect(() => { setPage(1); }, [tab]);

  const load = useCallback(() => {
    setLoading(true);
    const common = { page, limit: LIMIT, q: f.q || undefined, userId: f.userId || undefined, action: f.action || undefined, from: f.from || undefined, to: f.to || undefined };
    const call = tab === 0
      ? auditAPI.activity({ ...common, resource: f.resource || undefined })
      : auditAPI.security({ ...common, success: f.success === "" ? undefined : f.success });
    call
      .then((d) => {
        setRows(d.data || []); setTotal(d.total || 0); setPages(d.pages || 1);
        setStats(d.stats || null); setRetention(d.retentionDays || 180);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [tab, page, f]);

  useEffect(() => { load(); }, [load]);
  const setField = (k) => (e) => { setF((p) => ({ ...p, [k]: e.target.value })); setPage(1); };

  const actionChipSx = { fontSize: "0.8rem", border: "none" };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1.5} mb={1}>
        <FactCheckIcon color="primary" />
        <Box>
          <Typography variant="overline" display="block" color="text.secondary">Oversight</Typography>
          <Typography variant="h4" fontWeight={800}>Activity Logs</Typography>
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Every action by team members and drivers. Entries auto-delete after {retention} days.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      <Card sx={{ mb: 2.5 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}>
          <Tab label="Activity" />
          <Tab label="Sign-in & Security" />
        </Tabs>
        <CardContent>
          <Stack direction="row" gap={1.5} flexWrap="wrap" alignItems="center">
            <TextField
              size="small" placeholder="Search…" value={f.q} onChange={setField("q")}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              sx={{ minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Action</InputLabel>
              <Select label="Action" value={f.action} onChange={setField("action")}>
                <MenuItem value="">All</MenuItem>
                {(tab === 0 ? ACTIVITY_ACTIONS : SECURITY_ACTIONS).map((a) => (
                  <MenuItem key={a} value={a}>{label(a)}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {tab === 0 && (
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Resource</InputLabel>
                <Select label="Resource" value={f.resource} onChange={setField("resource")}>
                  <MenuItem value="">All</MenuItem>
                  {RESOURCES.map((r) => <MenuItem key={r} value={r}>{label(r)}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            {tab === 1 && (
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Result</InputLabel>
                <Select label="Result" value={f.success} onChange={setField("success")}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Success</MenuItem>
                  <MenuItem value="false">Failed</MenuItem>
                </Select>
              </FormControl>
            )}
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>User</InputLabel>
              <Select label="User" value={f.userId} onChange={setField("userId")}>
                <MenuItem value="">All</MenuItem>
                {actors.map((u) => <MenuItem key={u.id} value={u.id}>{u.name} ({label(u.role)})</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }} value={f.from} onChange={setField("from")} />
            <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }} value={f.to} onChange={setField("to")} />
            <Box ml="auto" display="flex" gap={1}>
              {tab === 1 && stats && (
                <>
                  <Chip size="small" color="success" variant="outlined" label={`${stats.logins24h ?? 0} logins/24h`} />
                  <Chip size="small" color="error" variant="outlined" label={`${stats.failures24h ?? 0} failed/24h`} />
                </>
              )}
              {tab === 0 && stats && (
                <Chip size="small" variant="outlined" label={`${stats.last24h ?? 0} actions/24h`} />
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        {loading ? (
          <Box display="flex" justifyContent="center" p={5}><CircularProgress size={32} /></Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>When</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Action</TableCell>
                    {tab === 0 ? <TableCell>Target</TableCell> : <TableCell>Result</TableCell>}
                    <TableCell align="right">Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r._id} hover>
                      <TableCell><Typography variant="caption">{dtShort(r.createdAt)}</Typography></TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 26, height: 26, fontSize: "0.7rem", bgcolor: "#37474F" }}>
                            {(r.userName || r.name || "?").charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{r.userName || r.name || "—"}</Typography>
                            {(r.userRole || r.role) && (
                              <Chip size="small" label={label(r.userRole || r.role)} color={ROLE_COLOR[r.userRole || r.role] || "default"}
                                sx={{ height: 16, fontSize: "0.6rem", border: "none" }} />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={label(r.action)} color={ACTION_COLOR[r.action] || "default"} sx={actionChipSx} />
                      </TableCell>
                      {tab === 0 ? (
                        <TableCell>
                          <Typography variant="body2">{label(r.resource)}</Typography>
                          {r.resourceLabel && <Typography variant="caption" color="text.secondary" display="block">{r.resourceLabel}</Typography>}
                          {changedCount(r.changes) > 0 && (
                            <Chip size="small" color="warning" label={`${changedCount(r.changes)} changed`} sx={{ mt: 0.3, border: "none" }} />
                          )}
                        </TableCell>
                      ) : (
                        <TableCell>
                          <Chip size="small" label={r.success ? "Success" : "Failed"} color={r.success ? "success" : "error"} sx={actionChipSx} />
                        </TableCell>
                      )}
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<VisibilityIcon sx={{ fontSize: "1rem" }} />}
                          onClick={() => setSnap(r)}
                          sx={{ fontSize: "0.8rem", border: "none" }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!rows.length && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5, color: "text.secondary" }}>No log entries match these filters.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box display="flex" justifyContent="space-between" alignItems="center" p={2} flexWrap="wrap" gap={1}>
              <Typography variant="caption" color="text.secondary">
                {total === 0 ? "No entries" : `Showing ${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} of ${total}`}
              </Typography>
              {pages > 1 && <Pagination count={pages} page={page} onChange={(_, p) => setPage(p)} color="primary" size="small" />}
            </Box>
          </>
        )}
      </Card>

      <SnapshotDialog entry={snap} mode={tab} onClose={() => setSnap(null)} />
    </Box>
  );
}
