import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Tooltip,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterListIcon from "@mui/icons-material/FilterList";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CloseIcon from "@mui/icons-material/Close";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { revenueAPI } from "../../api/client";

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: "vehicle_hire", label: "Vehicle Hire", dir: "income" },
  { value: "trip_earning", label: "Trip Earning", dir: "income" },
  { value: "maintenance", label: "Maintenance", dir: "expense" },
  { value: "fuel", label: "Fuel", dir: "expense" },
  { value: "custom", label: "Custom", dir: null },
];

const TYPE_LABELS = Object.fromEntries(
  TYPE_OPTIONS.map((t) => [t.value, t.label]),
);

const PIE_GREEN = ["#4CAF50", "#2E7D32", "#66BB6A", "#1B5E20", "#81C784", "#388E3C"];
const PIE_RED   = ["#F44336", "#B71C1C", "#EF5350", "#C62828", "#E57373", "#D32F2F"];

const BLANK = {
  type: "vehicle_hire",
  direction: "income",
  amount: "",
  currency: "GHS",
  description: "",
  date: new Date().toISOString().split("T")[0],
  category: "",
  reference: "",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n) =>
  new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 2,
  }).format(n || 0);

const fmtShort = (n) => {
  if (Math.abs(n) >= 1_000_000) return `GH₵${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `GH₵${(n / 1_000).toFixed(1)}K`;
  return `GH₵${(n || 0).toFixed(0)}`;
};

const getDirection = (type) =>
  TYPE_OPTIONS.find((t) => t.value === type)?.dir || null;

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ title, value, subtitle, icon, color, trend }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                textTransform: "uppercase",
                letterSpacing: 1,
                fontSize: 10,
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color, mt: 0.5, lineHeight: 1.2 }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: `${color}22`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        </Stack>
        {trend !== undefined && (
          <Stack direction="row" alignItems="center" gap={0.5} mt={1}>
            {trend >= 0 ? (
              <TrendingUpIcon sx={{ fontSize: 14, color: "#4CAF50" }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: 14, color: "#F44336" }} />
            )}
            <Typography
              variant="caption"
              sx={{
                color: trend >= 0 ? "#4CAF50" : "#F44336",
                fontWeight: 600,
              }}
            >
              {Math.abs(trend).toFixed(1)}% vs last month
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

function TypeChip({ type }) {
  const colors = {
    vehicle_hire: { bg: "#1565C022", text: "#1565C0" },
    trip_earning: { bg: "#2E7D3222", text: "#2E7D32" },
    maintenance: { bg: "#E65100  22", text: "#E65100" },
    fuel: { bg: "#6A1B9A22", text: "#6A1B9A" },
    custom: { bg: "#37474F22", text: "#37474F" },
  };
  const c = colors[type] || colors.custom;
  return (
    <Chip
      label={TYPE_LABELS[type] || type}
      size="small"
      sx={{
        bgcolor: c.bg,
        color: c.text,
        fontWeight: 600,
        fontSize: 11,
        border: `1px solid ${c.text}33`,
      }}
    />
  );
}

function DirectionChip({ direction }) {
  return (
    <Chip
      label={direction === "income" ? "Income" : "Expense"}
      size="small"
      sx={{
        bgcolor: direction === "income" ? "#4CAF5022" : "#F4433622",
        color: direction === "income" ? "#4CAF50" : "#F44336",
        fontWeight: 700,
        fontSize: 11,
        border: `1px solid ${direction === "income" ? "#4CAF5033" : "#F4433633"}`,
      }}
    />
  );
}

// ─── Transaction Dialog ───────────────────────────────────────────────────────

function TransactionDialog({
  open,
  onClose,
  entry,
  onSave,
  vehicles,
  drivers,
}) {
  const isEdit = Boolean(entry?._id);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      if (entry?._id) {
        setForm({
          type: entry.type,
          direction: entry.direction,
          amount: entry.amount,
          currency: entry.currency || "GHS",
          description: entry.description,
          date: entry.date
            ? entry.date.split("T")[0]
            : new Date().toISOString().split("T")[0],
          category: entry.category || "",
          reference: entry.reference || "",
        });
      } else {
        setForm(BLANK);
      }
      setError("");
    }
  }, [open, entry]);

  const handleTypeChange = (type) => {
    const dir = getDirection(type);
    setForm((f) => ({ ...f, type, direction: dir || f.direction }));
  };

  const handleSubmit = async () => {
    if (!form.type || !form.amount || !form.description || !form.date) {
      setError("Type, amount, description and date are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        category: form.category || undefined,
        reference: form.reference || undefined,
      };
      if (isEdit) {
        await revenueAPI.update(entry._id, payload);
      } else {
        await revenueAPI.create(payload);
      }
      onSave();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const needsDirection = form.type === "custom";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {isEdit ? "Edit Transaction" : "Add Transaction"}
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={form.type}
                label="Type"
                onChange={(e) => handleTypeChange(e.target.value)}
              >
                {TYPE_OPTIONS.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small" disabled={!needsDirection}>
              <InputLabel>Direction</InputLabel>
              <Select
                value={form.direction}
                label="Direction"
                onChange={(e) =>
                  setForm((f) => ({ ...f, direction: e.target.value }))
                }
              >
                <MenuItem value="income">Income</MenuItem>
                <MenuItem value="expense">Expense</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Amount"
              type="number"
              value={form.amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, amount: e.target.value }))
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">GH₵</InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Description"
              required
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Category (optional)"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Reference / Invoice #"
              value={form.reference}
              onChange={(e) =>
                setForm((f) => ({ ...f, reference: e.target.value }))
              }
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={14} /> : null}
        >
          {isEdit ? "Save Changes" : "Add Transaction"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteDialog({ open, onClose, entry, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const handleConfirm = async () => {
    setDeleting(true);
    await onConfirm(entry._id);
    setDeleting(false);
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Transaction</DialogTitle>
      <DialogContent>
        <Typography>
          Delete <strong>{entry?.description}</strong>? This cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={deleting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirm}
          disabled={deleting}
          startIcon={deleting ? <CircularProgress size={14} /> : null}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RevenuePage() {
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(0);
  const [txRowsPerPage, setTxRowsPerPage] = useState(20);
  const [txLoading, setTxLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState("");
  const [filterDirection, setFilterDirection] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Dialogs
  const [txDialog, setTxDialog] = useState({ open: false, entry: null });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    entry: null,
  });

  // Chart tab
  const [chartTab, setChartTab] = useState("monthly");

  // ── Fetch analytics ────────────────────────────────────────────────────────
  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    setAnalyticsError("");
    try {
      const data = await revenueAPI.analytics();
      setAnalytics(data);
    } catch {
      setAnalyticsError("Failed to load analytics.");
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  // ── Fetch transactions ─────────────────────────────────────────────────────
  const loadTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const params = {
        page: txPage + 1,
        limit: txRowsPerPage,
      };
      if (filterType) params.type = filterType;
      if (filterDirection) params.direction = filterDirection;
      if (filterFrom) params.from = filterFrom;
      if (filterTo) params.to = filterTo;
      const data = await revenueAPI.list(params);
      setTransactions(data.data);
      setTxTotal(data.total);
    } catch {
      /* silent */
    } finally {
      setTxLoading(false);
    }
  }, [
    txPage,
    txRowsPerPage,
    filterType,
    filterDirection,
    filterFrom,
    filterTo,
  ]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleSave = () => {
    setTxDialog({ open: false, entry: null });
    loadAnalytics();
    loadTransactions();
  };

  const handleDelete = async (id) => {
    await revenueAPI.delete(id);
    setDeleteDialog({ open: false, entry: null });
    loadAnalytics();
    loadTransactions();
  };

  const handleApplyFilters = () => {
    setTxPage(0);
    loadTransactions();
  };

  const handleClearFilters = () => {
    setFilterType("");
    setFilterDirection("");
    setFilterFrom("");
    setFilterTo("");
    setTxPage(0);
  };

  // ── Derived numbers ────────────────────────────────────────────────────────
  const summary = analytics?.summary || {};
  const byMonth = analytics?.byMonth || [];
  const byType = analytics?.byType || [];

  const incomeChangePct = summary.lastMonthIncome
    ? ((summary.thisMonthIncome - summary.lastMonthIncome) /
        summary.lastMonthIncome) *
      100
    : null;
  const expenseChangePct = summary.lastMonthExpenses
    ? ((summary.thisMonthExpenses - summary.lastMonthExpenses) /
        summary.lastMonthExpenses) *
      100
    : null;

  // Pie data for by-type breakdown (income side)
  const typeIncomeData = byType
    .filter((t) => t.income > 0)
    .map((t, i) => ({
      name: TYPE_LABELS[t.type] || t.type,
      value: t.income,
      fill: PIE_GREEN[i % PIE_GREEN.length],
    }));
  const typeExpenseData = byType
    .filter((t) => t.expense > 0)
    .map((t, i) => ({
      name: TYPE_LABELS[t.type] || t.type,
      value: t.expense,
      fill: PIE_RED[i % PIE_RED.length],
    }));

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* ── Header ── */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Revenue & Expenses
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track all financial activities — income, costs, and net performance.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setTxDialog({ open: true, entry: null })}
          sx={{ flexShrink: 0 }}
        >
          Add Transaction
        </Button>
      </Stack>

      {analyticsError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {analyticsError}
        </Alert>
      )}

      {/* ── Summary Cards ── */}
      {analyticsLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Income"
              value={fmtShort(summary.totalIncome)}
              subtitle={`${summary.transactionCount || 0} transactions`}
              icon={<TrendingUpIcon sx={{ color: "#4CAF50", fontSize: 22 }} />}
              color="#4CAF50"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Expenses"
              value={fmtShort(summary.totalExpenses)}
              subtitle="All time"
              icon={
                <TrendingDownIcon sx={{ color: "#F44336", fontSize: 22 }} />
              }
              color="#F44336"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Net Profit"
              value={fmtShort(summary.netProfit)}
              subtitle="Total income − expenses"
              icon={
                <AccountBalanceWalletIcon
                  sx={{ color: "#D32F2F", fontSize: 22 }}
                />
              }
              color={summary.netProfit >= 0 ? "#D32F2F" : "#F44336"}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="This Month Net"
              value={fmtShort(summary.thisMonthNet)}
              subtitle={`Income ${fmtShort(summary.thisMonthIncome)} · Exp ${fmtShort(summary.thisMonthExpenses)}`}
              icon={
                <CalendarMonthIcon sx={{ color: "#2196F3", fontSize: 22 }} />
              }
              color={summary.thisMonthNet >= 0 ? "#2196F3" : "#F44336"}
              trend={incomeChangePct}
            />
          </Grid>
        </Grid>
      )}

      {/* ── Charts ── */}
      {!analyticsLoading && (
        <Grid container spacing={2} mb={3}>
          {/* Monthly chart */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    Monthly Overview (Last 12 Months)
                  </Typography>
                </Stack>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={byMonth}
                    margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(128,128,128,0.15)"
                    />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis
                      tickFormatter={(v) => fmtShort(v)}
                      tick={{ fontSize: 11 }}
                      width={60}
                    />
                    <RTooltip formatter={(v) => fmt(v)} />
                    <Legend />
                    <Bar
                      dataKey="income"
                      name="Income"
                      fill="#4CAF50"
                      radius={[3, 3, 0, 0]}
                    />
                    <Bar
                      dataKey="expense"
                      name="Expense"
                      fill="#F44336"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* By-type breakdown */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1.5}
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    By Type
                  </Typography>
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={chartTab}
                    onChange={(_, v) => v && setChartTab(v)}
                  >
                    <ToggleButton
                      value="monthly"
                      sx={{ py: 0.25, px: 1, fontSize: 11 }}
                    >
                      Income
                    </ToggleButton>
                    <ToggleButton
                      value="expense"
                      sx={{ py: 0.25, px: 1, fontSize: 11 }}
                    >
                      Expense
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Stack>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={
                        chartTab === "monthly"
                          ? typeIncomeData
                          : typeExpenseData
                      }
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) =>
                        percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
                      }
                      labelLine={false}
                    >
                      {(chartTab === "monthly"
                        ? typeIncomeData
                        : typeExpenseData
                      ).map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RTooltip formatter={(v) => fmt(v)} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Type summary rows */}
                <Divider sx={{ my: 1 }} />
                {byType.slice(0, 4).map((t) => (
                  <Stack
                    key={t.type}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    py={0.4}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {TYPE_LABELS[t.type] || t.type}
                    </Typography>
                    <Stack direction="row" gap={1}>
                      <Typography
                        variant="caption"
                        sx={{ color: "#4CAF50", fontWeight: 600 }}
                      >
                        {fmtShort(t.income)}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "#F44336", fontWeight: 600 }}
                      >
                        -{fmtShort(t.expense)}
                      </Typography>
                    </Stack>
                  </Stack>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ── Transactions Table ── */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            px={2.5}
            py={2}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              Transactions
            </Typography>
            <Button
              size="small"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters((f) => !f)}
              variant={showFilters ? "contained" : "outlined"}
              sx={{ fontSize: 12 }}
            >
              Filters
            </Button>
          </Stack>

          {/* Filter row */}
          {showFilters && (
            <Box sx={{ px: 2.5, pb: 2 }}>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={1.5} alignItems="flex-end">
                <Grid item xs={6} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={filterType}
                      label="Type"
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <MenuItem value="">All</MenuItem>
                      {TYPE_OPTIONS.map((t) => (
                        <MenuItem key={t.value} value={t.value}>
                          {t.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Direction</InputLabel>
                    <Select
                      value={filterDirection}
                      label="Direction"
                      onChange={(e) => setFilterDirection(e.target.value)}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="income">Income</MenuItem>
                      <MenuItem value="expense">Expense</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="From"
                    type="date"
                    value={filterFrom}
                    onChange={(e) => setFilterFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="To"
                    type="date"
                    value={filterTo}
                    onChange={(e) => setFilterTo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Stack direction="row" gap={1}>
                    <Button
                      variant="contained"
                      size="small"
                      fullWidth
                      onClick={handleApplyFilters}
                    >
                      Apply
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      onClick={handleClearFilters}
                    >
                      Clear
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          )}

          <Divider />

          <TableContainer sx={{ minWidth: 700 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Direction</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Amount
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Reference</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {txLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No transactions found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx._id} hover>
                      <TableCell sx={{ whiteSpace: "nowrap", fontSize: 13 }}>
                        {new Date(tx.date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {tx.description}
                        </Typography>
                        {tx.category && (
                          <Typography variant="caption" color="text.secondary">
                            {tx.category}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <TypeChip type={tx.type} />
                      </TableCell>
                      <TableCell>
                        <DirectionChip direction={tx.direction} />
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color:
                              tx.direction === "income" ? "#4CAF50" : "#F44336",
                          }}
                        >
                          {tx.direction === "income" ? "+" : "-"}
                          {fmt(tx.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {tx.reference || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() =>
                              setTxDialog({ open: true, entry: tx })
                            }
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              setDeleteDialog({ open: true, entry: tx })
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={txTotal}
            page={txPage}
            rowsPerPage={txRowsPerPage}
            onPageChange={(_, p) => setTxPage(p)}
            onRowsPerPageChange={(e) => {
              setTxRowsPerPage(parseInt(e.target.value, 10));
              setTxPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </CardContent>
      </Card>

      {/* ── Dialogs ── */}
      <TransactionDialog
        open={txDialog.open}
        onClose={() => setTxDialog({ open: false, entry: null })}
        entry={txDialog.entry}
        onSave={handleSave}
      />
      <DeleteDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, entry: null })}
        entry={deleteDialog.entry}
        onConfirm={handleDelete}
      />
    </Box>
  );
}
