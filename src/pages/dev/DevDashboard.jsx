import { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, Grid, Chip, Button, CircularProgress,
  Table, TableContainer, TableHead, TableBody, TableRow, TableCell,
  Tab, Tabs, Select, MenuItem, FormControl, InputLabel, Alert,
  LinearProgress, Tooltip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Avatar, Switch,
} from "@mui/material";
import RefreshIcon       from "@mui/icons-material/Refresh";
import PlayArrowIcon     from "@mui/icons-material/PlayArrow";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import PersonAddIcon     from "@mui/icons-material/PersonAdd";
import DeleteIcon        from "@mui/icons-material/Delete";
import CodeIcon          from "@mui/icons-material/Code";
import StorageIcon       from "@mui/icons-material/Storage";
import MemoryIcon        from "@mui/icons-material/Memory";
import HttpIcon          from "@mui/icons-material/Http";
import LockIcon          from "@mui/icons-material/Lock";
import AssignmentIcon    from "@mui/icons-material/Assignment";
import ArticleIcon       from "@mui/icons-material/Article";
import WorkIcon          from "@mui/icons-material/Work";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import MonitorHeartIcon  from "@mui/icons-material/MonitorHeart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { devAPI, dashboardAPI } from "../../api/client";
import { errorMessage, avatarColor } from "../../utils/helpers";

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "medium" }) : "—";

const statusColor = (s) => ({
  running:   "#2196F3",
  completed: "#4CAF50",
  failed:    "#F44336",
  idle:      "#9E9E9E",
}[s] || "#9E9E9E");

const levelColor = (l) => ({ error: "#F44336", warn: "#FF9800", info: "#2196F3" }[l] || "#888");

const httpColor = (s) =>
  s >= 500 ? "#F44336" : s >= 400 ? "#FF9800" : s >= 300 ? "#2196F3" : "#4CAF50";

const PIE_COLORS = ["#4CAF50", "#2196F3", "#FF9800", "#F44336", "#9C27B0", "#D32F2F"];

// ─── sub-components ──────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, color = "#D32F2F", icon, pct }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Typography variant="caption" color="text.secondary">{label}</Typography>
          {icon && <Box sx={{ color, opacity: 0.7, fontSize: "1.3rem" }}>{icon}</Box>}
        </Box>
        <Typography variant="h5" fontWeight={800} sx={{ color, mt: 0.5, lineHeight: 1.2 }}>
          {value ?? "—"}
        </Typography>
        {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
        {pct != null && (
          <LinearProgress
            variant="determinate"
            value={Math.min(100, pct)}
            sx={{ mt: 1, height: 4, borderRadius: 2,
              "& .MuiLinearProgress-bar": { bgcolor: pct > 80 ? "#F44336" : pct > 60 ? "#FF9800" : color }
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, onRefresh, loading }) {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
      <Typography variant="h6" fontWeight={700} fontSize="0.95rem">{title}</Typography>
      <Tooltip title="Refresh">
        <IconButton size="small" onClick={onRefresh} disabled={loading}>
          {loading ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
    </Box>
  );
}

// ─── Tab panels ──────────────────────────────────────────────────────────────

// 0. Overview
function OverviewPanel({ data, onRefresh, loading }) {
  if (!data) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;
  const { system, memory, database, requests, activity, jobs } = data;

  const jobStatusCounts = jobs.reduce((a, j) => {
    a[j.status] = (a[j.status] || 0) + 1; return a;
  }, {});

  return (
    <Box>
      <SectionHeader title="System Overview" onRefresh={onRefresh} loading={loading} />

      {/* DB + uptime chips */}
      <Box display="flex" gap={1.5} mb={3} flexWrap="wrap">
        <Chip
          icon={<FiberManualRecordIcon sx={{ fontSize: "0.7rem !important", color: database.healthy ? "#4CAF50" : "#F44336" }} />}
          label={`DB: ${database.state}`}
          size="small"
          sx={{ bgcolor: database.healthy ? "#4CAF5022" : "#F4433622", color: database.healthy ? "#4CAF50" : "#F44336", border: "1px solid currentColor" }}
        />
        <Chip label={`Node ${system.nodeVersion}`} size="small" variant="outlined" />
        <Chip label={system.platform} size="small" variant="outlined" />
        <Chip label={`PID ${system.pid}`} size="small" variant="outlined" />
        <Chip label={`Env: ${system.environment}`} size="small" variant="outlined" color={system.environment === "production" ? "warning" : "default"} />
        <Chip label={`Uptime: ${system.uptime}`} size="small" variant="outlined" sx={{ color: "#4CAF50", borderColor: "#4CAF50" }} />
      </Box>

      {/* Key metrics */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <MetricCard label="Heap Used" value={memory.heapUsedLabel} sub={`of ${memory.heapTotalLabel}`}
            color="#2196F3" icon={<MemoryIcon />} pct={Math.round((memory.heapUsed / memory.heapTotal) * 100)} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard label="System Memory" value={memory.usedMemLabel} sub={`of ${memory.totalMemLabel}`}
            color="#9C27B0" icon={<MemoryIcon />} pct={memory.memPct} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard label="Avg Response" value={`${requests.avgMs}ms`} sub={`${requests.rpmEstimate} req/min`}
            color={requests.avgMs > 500 ? "#F44336" : requests.avgMs > 200 ? "#FF9800" : "#4CAF50"} icon={<HttpIcon />} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard label="Error Rate (24h)" value={`${requests.errorRate}%`} sub={`${activity.recentErrors} errors`}
            color={requests.errorRate > 5 ? "#F44336" : requests.errorRate > 1 ? "#FF9800" : "#4CAF50"} icon={<ReportProblemIcon />} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard label="Auth Failures (24h)" value={activity.recentAuthFails}
            color={activity.recentAuthFails > 10 ? "#F44336" : "#FF9800"} icon={<LockIcon />} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard label="Audit Events" value={activity.totalAuditEvents} color="#D32F2F" icon={<AssignmentIcon />} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard label="RSS Memory" value={memory.rssLabel} color="#607D8B" icon={<MemoryIcon />} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard label="DB Host" value={database.name} sub={database.host}
            color={database.healthy ? "#4CAF50" : "#F44336"} icon={<StorageIcon />} />
        </Grid>
      </Grid>

      {/* Jobs summary */}
      <Typography variant="body2" fontWeight={700} mb={1.5}>Background Jobs</Typography>
      <Grid container spacing={2}>
        {jobs.map((j) => (
          <Grid item xs={12} sm={6} md={3} key={j.id}>
            <Card variant="outlined" sx={{ borderColor: `${statusColor(j.status)}40` }}>
              <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="caption" fontWeight={700} noWrap>{j.name}</Typography>
                  <Chip label={j.status} size="small"
                    sx={{ bgcolor: `${statusColor(j.status)}22`, color: statusColor(j.status), fontSize: "0.65rem", height: 18 }} />
                </Box>
                <Typography variant="caption" color="text.secondary" display="block">{j.schedule}</Typography>
                <Typography variant="caption" color="text.disabled">
                  Last run: {j.lastRun ? fmtDate(j.lastRun) : "never"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

// 1. Database
function DatabasePanel({ onRefresh, loading }) {
  const [data, setData] = useState(null);
  const [err,  setErr]  = useState("");

  const load = useCallback(() => {
    devAPI.database().then(r => setData(r.data)).catch(e => setErr(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (!data) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;
  const { summary, collections } = data;

  const pieData = collections.slice(0, 8).map((c, i) => ({ name: c.name, value: c.storageSize }));

  return (
    <Box>
      <SectionHeader title="Database Stats" onRefresh={load} loading={loading} />
      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

      <Grid container spacing={2} mb={3}>
        {[
          { label: "Collections", value: summary.collections },
          { label: "Documents",   value: summary.documents.toLocaleString() },
          { label: "Data Size",   value: summary.dataSizeLabel },
          { label: "Storage",     value: summary.storageSizeLabel },
          { label: "Index Size",  value: summary.indexSizeLabel },
          { label: "Indexes",     value: summary.indexes },
        ].map(m => (
          <Grid item xs={6} sm={4} md={2} key={m.label}>
            <MetricCard label={m.label} value={m.value} color="#D32F2F" />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="body2" fontWeight={700} mb={1.5}>Storage by Collection</Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={collections.slice(0, 12)} margin={{ left: -20, right: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#777" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#777" }} axisLine={false} tickLine={false} />
                  <ReTooltip formatter={(v, n) => [`${v} bytes`, n]} contentStyle={{ background: "#1a1a1a", border: "1px solid #333" }} />
                  <Bar dataKey="storageSize" name="Storage" fill="#D32F2F" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="body2" fontWeight={700} mb={1}>Size Distribution</Typography>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" paddingAngle={2}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <ReTooltip formatter={(v) => [`${v} bytes`]} contentStyle={{ background: "#1a1a1a", border: "1px solid #333" }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small" sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Collection</TableCell>
                  <TableCell align="right">Documents</TableCell>
                  <TableCell align="right">Data Size</TableCell>
                  <TableCell align="right">Storage</TableCell>
                  <TableCell align="right">Index Size</TableCell>
                  <TableCell align="right">Avg Obj</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {collections.map(c => (
                  <TableRow key={c.name} hover>
                    <TableCell><Typography variant="body2" fontWeight={600}>{c.name}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2">{c.documents.toLocaleString()}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2">{c.dataSizeLabel}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2">{c.storageSizeLabel}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2">{c.indexSizeLabel}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2">{c.avgObjSize}B</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

// 2. Requests
function RequestsPanel() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("");

  const load = useCallback(() => {
    devAPI.requests().then(r => setData(r.data)).catch(console.error);
  }, []);
  useEffect(() => { load(); }, [load]);

  if (!data) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;
  const { stats, statusDist, pathStats, log } = data;

  const filtered = filter
    ? log.filter(r => String(r.status).startsWith(filter.replace("xx","")) || r.path.includes(filter))
    : log;

  const distData = Object.entries(statusDist).map(([k, v]) => ({ name: k, value: v }));

  return (
    <Box>
      <SectionHeader title="Request Performance" onRefresh={load} loading={false} />

      <Grid container spacing={2} mb={3}>
        {[
          { label: "Total Tracked",  value: stats.total.toLocaleString() },
          { label: "Avg Latency",    value: `${stats.avgMs}ms`, color: stats.avgMs > 500 ? "#F44336" : "#4CAF50" },
          { label: "Error Rate",     value: `${stats.errorRate}%`, color: stats.errorRate > 5 ? "#F44336" : "#4CAF50" },
          { label: "Req/min (last)", value: stats.rpmEstimate },
        ].map(m => <Grid item xs={6} sm={3} key={m.label}><MetricCard {...m} color={m.color || "#D32F2F"} /></Grid>)}
      </Grid>

      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="body2" fontWeight={700} mb={1.5}>Slowest Endpoints (avg ms)</Typography>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={pathStats.slice(0, 10)} layout="vertical" margin={{ left: 80, right: 16 }}>
                  <XAxis type="number" tick={{ fontSize: 9, fill: "#777" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="path" tick={{ fontSize: 9, fill: "#aaa" }} width={80} axisLine={false} tickLine={false} />
                  <ReTooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333" }} />
                  <Bar dataKey="avgMs" name="Avg ms" fill="#D32F2F" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="body2" fontWeight={700} mb={1}>Status Distribution</Typography>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={distData} cx="50%" cy="50%" outerRadius={60} dataKey="value" paddingAngle={3} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                    {distData.map((d, i) => (
                      <Cell key={i} fill={d.name.startsWith("5") ? "#F44336" : d.name.startsWith("4") ? "#FF9800" : "#4CAF50"} />
                    ))}
                  </Pie>
                  <ReTooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333" }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <Box p={1.5} display="flex" gap={2} alignItems="center">
          <Typography variant="body2" fontWeight={700}>Request Log</Typography>
          <TextField size="small" placeholder="Filter path or status…" value={filter}
            onChange={e => setFilter(e.target.value)} sx={{ ml: "auto", width: 220 }} />
          <IconButton size="small" onClick={load}><RefreshIcon fontSize="small" /></IconButton>
        </Box>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell>Method</TableCell>
                <TableCell>Path</TableCell>
                <TableCell align="right">Status</TableCell>
                <TableCell align="right">Duration</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>IP</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.slice(0, 100).map((r, i) => (
                <TableRow key={i} hover>
                  <TableCell><Chip label={r.method} size="small" sx={{ fontSize: "0.65rem", height: 18 }} /></TableCell>
                  <TableCell><Typography variant="caption" sx={{ fontFamily: "monospace" }}>{r.path}</Typography></TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={700} sx={{ color: httpColor(r.status) }}>{r.status}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ color: r.duration > 500 ? "#F44336" : r.duration > 200 ? "#FF9800" : "text.primary" }}>
                      {r.duration}ms
                    </Typography>
                  </TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{fmtDate(r.timestamp)}</Typography></TableCell>
                  <TableCell><Typography variant="caption" color="text.disabled">{r.ip || "—"}</Typography></TableCell>
                </TableRow>
              ))}
              {!filtered.length && (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>No requests logged yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}

// 3. Auth Logs
function AuthLogsPanel() {
  const [data, setData]     = useState(null);
  const [filter, setFilter] = useState("");
  const [page, setPage]     = useState(1);

  const load = useCallback(() => {
    const params = { limit: 50, page };
    if (filter) params.action = filter;
    devAPI.authLogs(params).then(r => setData(r.data)).catch(console.error);
  }, [filter, page]);
  useEffect(() => { load(); }, [load]);

  if (!data) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;

  return (
    <Box>
      <SectionHeader title="Auth Logs" onRefresh={load} loading={false} />

      <Grid container spacing={2} mb={3}>
        {[
          { label: "Logins (24h)",   value: data.stats.logins24h,   color: "#4CAF50" },
          { label: "Failures (24h)", value: data.stats.failures24h, color: data.stats.failures24h > 10 ? "#F44336" : "#FF9800" },
          { label: "Total Records",  value: data.total.toLocaleString(), color: "#D32F2F" },
        ].map(m => <Grid item xs={6} sm={4} key={m.label}><MetricCard {...m} /></Grid>)}
      </Grid>

      <Card>
        <Box p={1.5} display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Action Filter</InputLabel>
            <Select label="Action Filter" value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}>
              <MenuItem value="">All Actions</MenuItem>
              <MenuItem value="login">Login</MenuItem>
              <MenuItem value="login_failed">Login Failed</MenuItem>
              <MenuItem value="token_refresh">Token Refresh</MenuItem>
              <MenuItem value="password_change">Password Change</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" ml="auto">{data.total} records · page {data.page}/{data.pages}</Typography>
          <Box display="flex" gap={0.5}>
            <Button size="small" disabled={page <= 1}           onClick={() => setPage(p => p - 1)}>Prev</Button>
            <Button size="small" disabled={page >= data.pages}  onClick={() => setPage(p => p + 1)}>Next</Button>
          </Box>
        </Box>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell>Action</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>IP</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Detail</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.data.map((l, i) => (
                <TableRow key={i} hover>
                  <TableCell>
                    <Chip label={l.action.replace(/_/g," ")} size="small"
                      sx={{ bgcolor: l.action === "login_failed" ? "#F4433622" : "#4CAF5022",
                            color:   l.action === "login_failed" ? "#F44336"   : "#4CAF50",
                            fontSize: "0.65rem", height: 18, textTransform: "capitalize" }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{l.name || "—"}</Typography>
                    <Typography variant="caption" color="text.secondary">{l.email || "—"}</Typography>
                  </TableCell>
                  <TableCell><Typography variant="caption">{l.role || "—"}</Typography></TableCell>
                  <TableCell><Typography variant="caption" sx={{ fontFamily: "monospace" }}>{l.ip || "—"}</Typography></TableCell>
                  <TableCell>
                    <Chip label={l.success ? "OK" : "FAIL"} size="small"
                      color={l.success ? "success" : "error"} sx={{ fontSize: "0.65rem", height: 18 }} />
                  </TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{fmtDate(l.createdAt)}</Typography></TableCell>
                  <TableCell><Typography variant="caption" color="text.disabled">{l.detail || "—"}</Typography></TableCell>
                </TableRow>
              ))}
              {!data.data.length && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>No auth events yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}

// 4. Audit Logs
function AuditLogsPanel() {
  const [data, setData]         = useState(null);
  const [resFilter, setRes]     = useState("");
  const [actFilter, setAct]     = useState("");
  const [page, setPage]         = useState(1);

  const load = useCallback(() => {
    const params = { limit: 50, page };
    if (resFilter) params.resource = resFilter;
    if (actFilter) params.action   = actFilter;
    devAPI.auditLogs(params).then(r => setData(r.data)).catch(console.error);
  }, [resFilter, actFilter, page]);
  useEffect(() => { load(); }, [load]);

  if (!data) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;

  const actionColor = { create: "#4CAF50", update: "#2196F3", delete: "#F44336", status_change: "#FF9800", assign: "#9C27B0", unassign: "#607D8B", role_change: "#D32F2F" };

  return (
    <Box>
      <SectionHeader title="Audit Log" onRefresh={load} loading={false} />
      <Card>
        <Box p={1.5} display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Resource</InputLabel>
            <Select label="Resource" value={resFilter} onChange={e => { setRes(e.target.value); setPage(1); }}>
              <MenuItem value="">All</MenuItem>
              {["vehicle","driver","schedule","user"].map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Action</InputLabel>
            <Select label="Action" value={actFilter} onChange={e => { setAct(e.target.value); setPage(1); }}>
              <MenuItem value="">All</MenuItem>
              {["create","update","delete","status_change","assign","unassign","role_change"].map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" ml="auto">{data.total} records · page {data.page}/{data.pages || 1}</Typography>
          <Box display="flex" gap={0.5}>
            <Button size="small" disabled={page <= 1}           onClick={() => setPage(p => p - 1)}>Prev</Button>
            <Button size="small" disabled={page >= (data.pages||1)} onClick={() => setPage(p => p + 1)}>Next</Button>
          </Box>
        </Box>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 750 }}>
            <TableHead>
              <TableRow>
                <TableCell>Action</TableCell>
                <TableCell>Resource</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>By</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>IP</TableCell>
                <TableCell>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.data.map((l, i) => (
                <TableRow key={i} hover>
                  <TableCell>
                    <Chip label={l.action.replace(/_/g," ")} size="small"
                      sx={{ bgcolor: `${actionColor[l.action] || "#888"}22`, color: actionColor[l.action] || "#888",
                            fontSize: "0.65rem", height: 18, textTransform: "capitalize" }} />
                  </TableCell>
                  <TableCell><Chip label={l.resource} size="small" variant="outlined" sx={{ fontSize: "0.65rem", height: 18 }} /></TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{l.resourceLabel || "—"}</Typography>
                    <Typography variant="caption" color="text.disabled">{l.resourceId || ""}</Typography>
                  </TableCell>
                  <TableCell><Typography variant="body2">{l.userName || "—"}</Typography></TableCell>
                  <TableCell><Typography variant="caption">{l.userRole || "—"}</Typography></TableCell>
                  <TableCell><Typography variant="caption" sx={{ fontFamily: "monospace" }}>{l.ip || "—"}</Typography></TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{fmtDate(l.createdAt)}</Typography></TableCell>
                </TableRow>
              ))}
              {!data.data.length && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>No audit events yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}

// 5. System Logs
function SystemLogsPanel() {
  const [data, setData]     = useState(null);
  const [level, setLevel]   = useState("");
  const [page, setPage]     = useState(1);
  const [stackDlg, setStackDlg] = useState(null);

  const load = useCallback(() => {
    const params = { limit: 50, page };
    if (level) params.level = level;
    devAPI.systemLogs(params).then(r => setData(r.data)).catch(console.error);
  }, [level, page]);
  useEffect(() => { load(); }, [load]);

  if (!data) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;

  return (
    <Box>
      <SectionHeader title="System Logs" onRefresh={load} loading={false} />

      <Grid container spacing={2} mb={3}>
        {[
          { label: "Errors", value: data.dist?.errors ?? "—", color: "#F44336" },
          { label: "Warnings", value: data.dist?.warns ?? "—", color: "#FF9800" },
          { label: "Info", value: data.dist?.infos ?? "—", color: "#2196F3" },
          { label: "Total", value: data.total, color: "#D32F2F" },
        ].map(m => <Grid item xs={6} sm={3} key={m.label}><MetricCard {...m} /></Grid>)}
      </Grid>

      <Card>
        <Box p={1.5} display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Level</InputLabel>
            <Select label="Level" value={level} onChange={e => { setLevel(e.target.value); setPage(1); }}>
              <MenuItem value="">All Levels</MenuItem>
              <MenuItem value="error">Error</MenuItem>
              <MenuItem value="warn">Warning</MenuItem>
              <MenuItem value="info">Info</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" ml="auto">page {data.page}/{data.pages || 1}</Typography>
          <Box display="flex" gap={0.5}>
            <Button size="small" disabled={page <= 1}           onClick={() => setPage(p => p - 1)}>Prev</Button>
            <Button size="small" disabled={page >= (data.pages||1)} onClick={() => setPage(p => p + 1)}>Next</Button>
          </Box>
        </Box>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell>Level</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Time</TableCell>
                <TableCell align="center">Stack</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.data.map((l, i) => (
                <TableRow key={i} hover sx={{ bgcolor: l.level === "error" ? "rgba(244,67,54,0.04)" : l.level === "warn" ? "rgba(255,152,0,0.04)" : "inherit" }}>
                  <TableCell>
                    <Chip label={l.level} size="small"
                      sx={{ bgcolor: `${levelColor(l.level)}22`, color: levelColor(l.level), fontSize: "0.65rem", height: 18 }} />
                  </TableCell>
                  <TableCell><Typography variant="body2" sx={{ maxWidth: 400 }} noWrap>{l.message}</Typography></TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>{l.source || "—"}</Typography></TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{fmtDate(l.createdAt)}</Typography></TableCell>
                  <TableCell align="center">
                    {l.stack ? (
                      <Tooltip title="View stack trace">
                        <IconButton size="small" onClick={() => setStackDlg(l)}><ArticleIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    ) : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {!data.data.length && (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>No logs yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={Boolean(stackDlg)} onClose={() => setStackDlg(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ color: "#F44336" }}>Stack Trace — {stackDlg?.source}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" mb={1} fontWeight={600}>{stackDlg?.message}</Typography>
          <Box component="pre" sx={{ fontSize: "0.72rem", color: "#aaa", overflowX: "auto", whiteSpace: "pre-wrap", bgcolor: "#111", p: 2, borderRadius: 1 }}>
            {stackDlg?.stack}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStackDlg(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// 6. Jobs
function JobsPanel() {
  const [data, setData]   = useState(null);
  const [running, setRun] = useState({});

  const load = useCallback(() => {
    devAPI.jobs().then(r => setData(r.data.data)).catch(console.error);
  }, []);
  useEffect(() => { load(); }, [load]);

  const triggerJob = async (id) => {
    setRun(p => ({ ...p, [id]: true }));
    try {
      await devAPI.runJob(id);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setRun(p => ({ ...p, [id]: false }));
    }
  };

  if (!data) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;

  return (
    <Box>
      <SectionHeader title="Background Jobs" onRefresh={load} loading={false} />
      <Grid container spacing={2.5}>
        {data.map(j => (
          <Grid item xs={12} sm={6} key={j.id}>
            <Card variant="outlined" sx={{ borderColor: `${statusColor(j.status)}44` }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box>
                    <Typography variant="body2" fontWeight={700}>{j.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{j.description}</Typography>
                  </Box>
                  <Chip label={j.status} size="small"
                    sx={{ bgcolor: `${statusColor(j.status)}22`, color: statusColor(j.status), ml: 1 }} />
                </Box>
                <Box display="flex" gap={2} mt={1.5} flexWrap="wrap">
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Schedule</Typography>
                    <Typography variant="caption" fontWeight={600}>{j.schedule}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Last Run</Typography>
                    <Typography variant="caption" fontWeight={600}>{j.lastRun ? fmtDate(j.lastRun) : "Never"}</Typography>
                  </Box>
                  {j.durationMs != null && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Duration</Typography>
                      <Typography variant="caption" fontWeight={600}>{j.durationMs}ms</Typography>
                    </Box>
                  )}
                </Box>
                {j.lastError && (
                  <Alert severity="error" sx={{ mt: 1.5, py: 0.5 }}>
                    <Typography variant="caption">{j.lastError}</Typography>
                  </Alert>
                )}
                <Box mt={2}>
                  <Button size="small" variant="outlined" color="primary" startIcon={running[j.id] ? <CircularProgress size={12} /> : <PlayArrowIcon />}
                    disabled={running[j.id]} onClick={() => triggerJob(j.id)}>
                    {running[j.id] ? "Running…" : "Run Now"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

// 7. Incidents
function IncidentsPanel() {
  const [data, setData] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = useCallback(() => {
    devAPI.incidents().then(r => setData(r.data)).catch(console.error);
  }, []);
  useEffect(() => { load(); }, [load]);

  if (!data) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;

  const sevColor = { critical: "#F44336", high: "#FF5722", medium: "#FF9800", low: "#2196F3" };

  return (
    <Box>
      <SectionHeader title="Incidents" onRefresh={load} loading={false} />
      {!data.data.length ? (
        <Card sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">✅ No incidents detected</Typography>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {data.data.map(inc => (
            <Grid item xs={12} key={inc.id}>
              <Card variant="outlined" sx={{ borderColor: `${sevColor[inc.severity] || "#888"}44` }}>
                <CardContent sx={{ p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Chip label={inc.severity} size="small"
                          sx={{ bgcolor: `${sevColor[inc.severity]}22`, color: sevColor[inc.severity], fontSize: "0.65rem", height: 18 }} />
                        <Chip label={inc.type} size="small" variant="outlined" sx={{ fontSize: "0.65rem", height: 18 }} />
                        <Typography variant="caption" color="text.disabled">×{inc.count}</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={600}>{inc.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Source: {inc.source} · First: {fmtDate(inc.firstSeen)} · Last: {fmtDate(inc.lastSeen)}
                      </Typography>
                    </Box>
                    {inc.stack && (
                      <Button size="small" onClick={() => setDetail(inc)} sx={{ ml: 2 }}>View Stack</Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ color: "#F44336" }}>Incident Stack — {detail?.source}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" mb={1} fontWeight={600}>{detail?.title}</Typography>
          <Box component="pre" sx={{ fontSize: "0.72rem", color: "#aaa", overflowX: "auto", whiteSpace: "pre-wrap", bgcolor: "#111", p: 2, borderRadius: 1 }}>
            {detail?.stack}
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setDetail(null)}>Close</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// 8. Dev Team
const REGIONS = [
  "Greater Accra", "Ashanti", "Volta", "Central", "Eastern", "Western",
  "Oti", "Bono", "Bono East", "Ahafo", "Brong Ahafo", "Northern",
  "Western North", "Upper West", "Upper East", "North East",
];

const BLANK_DEV = { name: "", email: "", phone: "", region: "", password: "" };

function DevTeamPanel() {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [toast,    setToast]    = useState("");

  // Add dialog
  const [addDlg,    setAddDlg]    = useState(false);
  const [addForm,   setAddForm]   = useState(BLANK_DEV);
  const [addSaving, setAddSaving] = useState(false);
  const [addError,  setAddError]  = useState("");

  // Delete dialog
  const [delDlg,   setDelDlg]   = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    dashboardAPI.users()
      .then(r => {
        const devs = (r.data?.data || []).filter(u => u.role === "developer");
        setUsers(devs);
      })
      .catch(e => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!addForm.name || !addForm.email) { setAddError("Name and email are required."); return; }
    setAddSaving(true); setAddError("");
    try {
      const r = await dashboardAPI.createUser({ ...addForm, role: "developer" });
      setAddDlg(false);
      setAddForm(BLANK_DEV);
      setToast(r.data.defaultPassword
        ? `Developer created. Default password: ${r.data.defaultPassword}`
        : "Developer account created.");
      load();
    } catch (e) { setAddError(errorMessage(e)); }
    finally { setAddSaving(false); }
  };

  const handleToggle = async (u) => {
    try {
      await dashboardAPI.toggleUser(u._id);
      setToast(`${u.name} ${u.isActive ? "deactivated" : "activated"}.`);
      load();
    } catch (e) { setError(errorMessage(e)); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await dashboardAPI.deleteUser(delDlg._id);
      setDelDlg(null);
      setToast("Developer account deleted.");
      load();
    } catch (e) { setError(errorMessage(e)); }
    finally { setDeleting(false); }
  };

  const fmtJoined = (d) => d ? new Date(d).toLocaleDateString("en-GB") : "—";

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={700} fontSize="0.95rem">Developer Accounts</Typography>
        <Button variant="contained" color="primary" size="small"
          startIcon={<PersonAddIcon />}
          onClick={() => { setAddForm(BLANK_DEV); setAddError(""); setAddDlg(true); }}>
          Add Developer
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {toast && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setToast("")}>{toast}</Alert>}

      <Alert severity="info" sx={{ mb: 2 }}>
        Developer accounts have access to the Dev Dashboard only. They are invisible to company admins.
      </Alert>

      <Card>
        <Box px={2} pt={2} pb={1} display="flex" alignItems="center" gap={1}>
          <CodeIcon sx={{ color: "#9C27B0", fontSize: "1.1rem" }} />
          <Typography variant="body2" fontWeight={700}>Developers</Typography>
          <Chip label={users.length} size="small"
            sx={{ bgcolor: "#9C27B020", color: "#9C27B0", ml: 0.5 }} />
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}><CircularProgress size={28} /></Box>
        ) : (
          <TableContainer>
            <Table size="small" sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Developer</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u._id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: avatarColor(u.name), color: "#fff", fontSize: "0.8rem", fontWeight: 800 }}>
                          {u.name?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{u.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{u.phone || "—"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={u.isActive ? "Active" : "Inactive"} size="small"
                        color={u.isActive ? "success" : "default"} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{fmtJoined(u.createdAt)}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={0.5} justifyContent="center" alignItems="center">
                        <Tooltip title={u.isActive ? "Deactivate" : "Activate"}>
                          <Switch size="small" checked={u.isActive}
                            onChange={() => handleToggle(u)} color="success" />
                        </Tooltip>
                        <Tooltip title="Delete account">
                          <IconButton size="small" color="error" onClick={() => setDelDlg(u)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {!users.length && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5, color: "text.secondary" }}>
                      No developer accounts yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Add Dialog */}
      <Dialog open={addDlg} onClose={() => setAddDlg(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Developer Account</DialogTitle>
        <DialogContent>
          {addError && <Alert severity="error" sx={{ mb: 2 }}>{addError}</Alert>}
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField size="small" fullWidth label="Full Name *" value={addForm.name}
              onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} />
            <TextField size="small" fullWidth label="Email *" type="email" value={addForm.email}
              onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} />
            <TextField size="small" fullWidth label="Phone" value={addForm.phone}
              onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))} />
            <FormControl size="small" fullWidth>
              <InputLabel>Region</InputLabel>
              <Select label="Region" value={addForm.region}
                onChange={e => setAddForm(p => ({ ...p, region: e.target.value }))}>
                <MenuItem value=""><em>— None —</em></MenuItem>
                {REGIONS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size="small" fullWidth label="Password (blank = Fleet@1234)" type="password"
              value={addForm.password}
              onChange={e => setAddForm(p => ({ ...p, password: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDlg(false)} disabled={addSaving}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd} disabled={addSaving}
            startIcon={addSaving ? <CircularProgress size={14} color="inherit" /> : null}>
            {addSaving ? "Creating…" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={Boolean(delDlg)} onClose={() => setDelDlg(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Developer Account</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Permanently delete <strong>{delDlg?.name}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDelDlg(null)} disabled={deleting}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : null}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Main DevDashboard ────────────────────────────────────────────────────────
const TABS = [
  { label: "Overview",    icon: <MonitorHeartIcon  fontSize="small" /> },
  { label: "Database",    icon: <StorageIcon       fontSize="small" /> },
  { label: "Requests",    icon: <HttpIcon          fontSize="small" /> },
  { label: "Auth Logs",   icon: <LockIcon          fontSize="small" /> },
  { label: "Audit Logs",  icon: <AssignmentIcon    fontSize="small" /> },
  { label: "System Logs", icon: <ArticleIcon       fontSize="small" /> },
  { label: "Jobs",        icon: <WorkIcon          fontSize="small" /> },
  { label: "Incidents",   icon: <ReportProblemIcon fontSize="small" /> },
  { label: "Dev Team",    icon: <CodeIcon          fontSize="small" /> },
];

export default function DevDashboard() {
  const [tab, setTab]         = useState(0);
  const [overview, setOverview] = useState(null);
  const [loadingOv, setLoadingOv] = useState(true);

  const loadOverview = useCallback(() => {
    setLoadingOv(true);
    devAPI.overview()
      .then(r => setOverview(r.data))
      .catch(console.error)
      .finally(() => setLoadingOv(false));
  }, []);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="overline" display="block">Internal</Typography>
          <Typography variant="h4" fontWeight={800}>Developer Dashboard</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          {overview && (
            <Chip
              icon={<FiberManualRecordIcon sx={{ fontSize: "0.7rem !important", color: overview.database.healthy ? "#4CAF50" : "#F44336" }} />}
              label={overview.database.healthy ? "Systems Operational" : "DB Issue"}
              size="small"
              sx={{ bgcolor: overview.database.healthy ? "#4CAF5022" : "#F4433622",
                    color:   overview.database.healthy ? "#4CAF50"   : "#F44336",
                    border: "1px solid currentColor" }}
            />
          )}
        </Box>
      </Box>

      <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.08)", mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          {TABS.map((t, i) => (
            <Tab key={i} label={t.label} icon={t.icon} iconPosition="start"
              sx={{ minHeight: 48, fontSize: "0.78rem" }} />
          ))}
        </Tabs>
      </Box>

      {tab === 0 && <OverviewPanel data={overview}  onRefresh={loadOverview} loading={loadingOv} />}
      {tab === 1 && <DatabasePanel onRefresh={null} loading={false} />}
      {tab === 2 && <RequestsPanel />}
      {tab === 3 && <AuthLogsPanel />}
      {tab === 4 && <AuditLogsPanel />}
      {tab === 5 && <SystemLogsPanel />}
      {tab === 6 && <JobsPanel />}
      {tab === 7 && <IncidentsPanel />}
      {tab === 8 && <DevTeamPanel />}
    </Box>
  );
}
