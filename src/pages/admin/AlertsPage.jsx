import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
} from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { dashboardAPI, analyticsAPI } from "../../api/client";
import { formatDate, errorMessage } from "../../utils/helpers";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: "background.paper", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 1, p: 1.5 }}>
      <Typography variant="caption" display="block" fontWeight={700} mb={0.5}>{label}</Typography>
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

const TYPE_LABELS = {
  insurance_expiry: "Vehicle Insurance",
  vehicle_license_expiry: "Road License",
  roadworthiness_expiry: "Roadworthiness",
  driver_license_expiry: "Driver License",
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(0); // 0=all, 1=critical, 2=warning
  const [expiryBuckets, setExpiryBuckets] = useState([]);

  useEffect(() => {
    Promise.all([dashboardAPI.alerts(), analyticsAPI.fleet()])
      .then(([alertRes, analyticsRes]) => {
        setAlerts(alertRes.data.data);
        setExpiryBuckets(analyticsRes.data.expiryBuckets || []);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const critical = alerts.filter((a) => a.severity === "critical");
  const warnings = alerts.filter((a) => a.severity === "warning");
  const displayed = tab === 0 ? alerts : tab === 1 ? critical : warnings;

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="overline" display="block">
          System
        </Typography>
        <Typography variant="h4" fontWeight={800}>
          Expiry Alerts
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Documents expiring within 30 days across your fleet and drivers.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box display="flex" gap={2.5} mb={3} flexWrap="wrap">
        {[
          { label: "Total Alerts", value: alerts.length, color: "#C8A84B" },
          { label: "Critical", value: critical.length, color: "#F44336" },
          { label: "Warnings", value: warnings.length, color: "#FF9800" },
        ].map((s) => (
          <Card key={s.label} sx={{ flex: "1 1 140px", p: 2.5 }}>
            <Typography variant="overline" display="block">
              {s.label}
            </Typography>
            <Typography
              variant="h3"
              fontWeight={800}
              sx={{ color: s.color, fontSize: "2rem", mt: 0.5 }}
            >
              {loading ? "—" : s.value}
            </Typography>
          </Card>
        ))}
      </Box>

      {/* ── Expiry Timeline Chart ── */}
      {expiryBuckets.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="body2" fontWeight={700} fontSize="0.9rem" mb={0.5}>
              Document Expiry Timeline
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              Vehicle documents and driver licenses grouped by expiry window.
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={expiryBuckets}
                margin={{ top: 4, right: 16, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#888" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#888" }}
                  axisLine={false}
                  tickLine={false}
                />
                <ReTooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Legend formatter={(v) => <span style={{ fontSize: "0.78rem", color: "#aaa" }}>{v}</span>} />
                <Bar dataKey="vehicles" name="Vehicle Docs" radius={[4, 4, 0, 0]}>
                  {expiryBuckets.map((b, i) => (
                    <Cell
                      key={i}
                      fill={
                        b.label === "Overdue"   ? "#F44336" :
                        b.label === "0–7 days"  ? "#FF5722" :
                        b.label === "8–30 days" ? "#FF9800" :
                        b.label === "31–60 d"   ? "#C8A84B" : "#2196F3"
                      }
                    />
                  ))}
                </Bar>
                <Bar dataKey="drivers" name="Driver Licenses" fill="#9C27B0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <Box borderBottom="1px solid rgba(255,255,255,0.07)">
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label={`All (${alerts.length})`} />
            <Tab label={`Critical (${critical.length})`} />
            <Tab label={`Warnings (${warnings.length})`} />
          </Tabs>
        </Box>
        {loading ? (
          <Box display="flex" justifyContent="center" p={5}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Severity</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Detail</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Days Left</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayed.map((a, i) => (
                <TableRow key={i} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {a.severity === "critical" ? (
                        <ErrorIcon fontSize="small" color="error" />
                      ) : (
                        <WarningAmberIcon fontSize="small" color="warning" />
                      )}
                      <Chip
                        label={a.severity}
                        size="small"
                        color={a.severity === "critical" ? "error" : "warning"}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {TYPE_LABELS[a.type] || a.type}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={a.entity} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {a.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {a.subtitle}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color={a.days < 0 ? "error.main" : "text.primary"}
                    >
                      {formatDate(a.date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color={
                        a.days < 0
                          ? "error.main"
                          : a.days <= 7
                            ? "error.main"
                            : "warning.main"
                      }
                    >
                      {a.days < 0
                        ? `${Math.abs(a.days)}d overdue`
                        : `${a.days}d`}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {!displayed.length && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{ py: 5, color: "text.secondary" }}
                  >
                    ✅ No alerts in this category
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </Box>
  );
}
