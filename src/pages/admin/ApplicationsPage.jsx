import { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Card, Chip, Button, CircularProgress, Avatar,
  Table, TableContainer, TableHead, TableBody, TableRow, TableCell,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Alert, InputAdornment, Divider, Grid,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import BadgeIcon from "@mui/icons-material/Badge";
import { applicationsAPI } from "../../api/client";
import { errorMessage, avatarColor } from "../../utils/helpers";

const STATUS_CFG = {
  pending:   { label: "Pending",   color: "#FF9800", bg: "#FF980020" },
  interview: { label: "Interview", color: "#2196F3", bg: "#2196F320" },
  approved:  { label: "Approved",  color: "#4CAF50", bg: "#4CAF5020" },
  rejected:  { label: "Rejected",  color: "#F44336", bg: "#F4433620" },
};
const STATUS_ORDER = ["pending", "interview", "approved", "rejected"];
const VEHICLE_LABEL = {
  executive_coach: "Executive Coach", midi_coach: "Midi Coach", minibus: "Minibus",
  vip_coach: "VIP Coach", school_bus: "School Bus", sprinter_van: "Sprinter Van",
  "4x4": "4x4 / SUV", other: "Other",
};

const fmtDate = (d) => d ? new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—";
const calcAge = (dob) => {
  if (!dob) return null;
  const age = Math.floor((Date.now() - new Date(dob)) / (365.25 * 86400000));
  return age > 0 && age < 120 ? age : null;
};

export default function ApplicationsPage() {
  const [apps,    setApps]    = useState([]);
  const [byStatus, setByStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [toast,   setToast]   = useState("");

  // filters
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // detail / status dialog
  const [detail,    setDetail]    = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [note,      setNote]      = useState("");
  const [saving,    setSaving]    = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    applicationsAPI.list()
      .then((r) => { setApps(r.data.data || []); setByStatus(r.data.byStatus || {}); })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = apps.filter((a) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q
      || a.fullName?.toLowerCase().includes(q)
      || a.email?.toLowerCase().includes(q)
      || (a.phone || "").toLowerCase().includes(q)
      || (a.licenseNumber || "").toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const filtersActive = search.trim() || statusFilter !== "all";

  const openDetail = (a) => { setDetail(a); setNewStatus(a.status); setNote(a.reviewNote || ""); };

  const saveStatus = async () => {
    setSaving(true);
    try {
      await applicationsAPI.updateStatus(detail._id, { status: newStatus, note });
      setToast(`${detail.fullName} moved to ${STATUS_CFG[newStatus]?.label || newStatus}.`);
      setDetail(null);
      load();
    } catch (e) { setError(errorMessage(e)); }
    finally { setSaving(false); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="overline" display="block">Recruitment</Typography>
          <Typography variant="h4" fontWeight={800}>Driver Applications</Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {toast && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setToast("")}>{toast}</Alert>}

      {/* Status summary */}
      <Box display="flex" gap={1.5} mb={3} flexWrap="wrap">
        {STATUS_ORDER.map((s) => (
          <Card key={s} sx={{ px: 2.5, py: 1.5, minWidth: 120 }}>
            <Typography variant="caption" color="text.secondary" display="block">{STATUS_CFG[s].label}</Typography>
            <Typography variant="h5" fontWeight={800} sx={{ color: STATUS_CFG[s].color }}>{byStatus[s] || 0}</Typography>
          </Card>
        ))}
      </Box>

      <Card>
        <Box px={2.5} pt={2} pb={1} display="flex" alignItems="center" gap={1}>
          <BadgeIcon sx={{ color: "#D32F2F", fontSize: "1.1rem" }} />
          <Typography variant="h6" fontWeight={700} fontSize="0.95rem">Applicants</Typography>
          <Chip
            label={filtersActive ? `${visible.length} / ${apps.length}` : apps.length}
            size="small" sx={{ bgcolor: "rgba(211,47,47,0.12)", color: "#D32F2F" }} />
        </Box>

        {/* Search & filter */}
        <Box px={2.5} pb={1.5} display="flex" gap={1.5} flexWrap="wrap" alignItems="center">
          <TextField
            size="small" placeholder="Search name, email, phone, license…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 220 }}
            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: "text.secondary" }} /></InputAdornment>) }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="all">All statuses</MenuItem>
              {STATUS_ORDER.map((s) => <MenuItem key={s} value={s}>{STATUS_CFG[s].label}</MenuItem>)}
            </Select>
          </FormControl>
          {filtersActive && (
            <Button size="small" onClick={() => { setSearch(""); setStatusFilter("all"); }}>Clear</Button>
          )}
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}><CircularProgress size={28} /></Box>
        ) : (
          <TableContainer>
            <Table size="small" sx={{ minWidth: 820 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Applicant</TableCell>
                  <TableCell>License</TableCell>
                  <TableCell>Experience</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Applied</TableCell>
                  <TableCell align="center">Review</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map((a) => {
                  const sc = STATUS_CFG[a.status] || STATUS_CFG.pending;
                  return (
                    <TableRow key={a._id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: avatarColor(a.fullName), color: "#fff", fontSize: "0.8rem", fontWeight: 800 }}>
                            {a.fullName?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{a.fullName}</Typography>
                            <Typography variant="caption" color="text.secondary">{a.email} · {a.phone}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{a.licenseNumber}</Typography>
                        <Typography variant="caption" color="text.secondary">{a.licenseClass || "—"}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2">{a.yearsExperience || 0} yrs</Typography></TableCell>
                      <TableCell>
                        <Chip label={a.paymentStatus === "paid" ? "Paid" : "Unpaid"} size="small"
                          color={a.paymentStatus === "paid" ? "success" : "default"} />
                      </TableCell>
                      <TableCell>
                        <Chip label={sc.label} size="small" sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 600 }} />
                      </TableCell>
                      <TableCell><Typography variant="caption" color="text.secondary">{fmtDate(a.submittedAt || a.createdAt)}</Typography></TableCell>
                      <TableCell align="center">
                        <Button size="small" variant="outlined" onClick={() => openDetail(a)}>Review</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!visible.length && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5, color: "text.secondary" }}>
                      {filtersActive ? "No applications match your filters" : "No applications yet"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Review dialog */}
      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Review Application — {detail?.fullName}</DialogTitle>
        <DialogContent>
          {detail && (
            <>
              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                {[
                  ["Email", detail.email],
                  ["Phone", detail.phone],
                  ["Region", detail.region || "—"],
                  ["Age", calcAge(detail.dateOfBirth) ? `${calcAge(detail.dateOfBirth)} yrs` : "—"],
                  ["License #", detail.licenseNumber],
                  ["License class", detail.licenseClass || "—"],
                  ["Experience", `${detail.yearsExperience || 0} yrs`],
                  ["Preferred vehicle", VEHICLE_LABEL[detail.preferredVehicleType] || detail.preferredVehicleType],
                  ["Address", detail.address || "—"],
                  ["Deposit", `${detail.paymentStatus === "paid" ? "Paid" : "Unpaid"} · GHS ${(detail.amount / 100).toFixed(2)}`],
                  ["Reference", detail.paymentRef || "—"],
                  ["Submitted", fmtDate(detail.submittedAt || detail.createdAt)],
                ].map(([k, v]) => (
                  <Grid item xs={6} key={k}>
                    <Typography variant="caption" color="text.secondary" display="block">{k}</Typography>
                    <Typography variant="body2" sx={{ wordBreak: "break-word" }}>{v}</Typography>
                  </Grid>
                ))}
              </Grid>

              {/* Documents */}
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Documents</Typography>
              {detail.ghanaCardNumber && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Ghana Card No: {detail.ghanaCardNumber}
                </Typography>
              )}
              <Grid container spacing={1.5}>
                {[
                  ["Passport", detail.passportPictureUrl],
                  ["Ghana Card Front", detail.ghanaCardFrontUrl],
                  ["Ghana Card Back", detail.ghanaCardBackUrl],
                  ["License Front", detail.licenseFrontUrl],
                  ["License Back", detail.licenseBackUrl],
                ].map(([label, url]) => (
                  <Grid item xs={6} sm={4} key={label}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>{label}</Typography>
                    {url ? (
                      <Box component="a" href={url} target="_blank" rel="noreferrer" sx={{ display: "block" }}>
                        <Box component="img" src={url} alt={label}
                          sx={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 1, border: "1px solid", borderColor: "divider" }} />
                      </Box>
                    ) : <Typography variant="caption" color="text.secondary">—</Typography>}
                  </Grid>
                ))}
              </Grid>

              {/* Guarantors */}
              {Array.isArray(detail.guarantors) && detail.guarantors.length > 0 && (
                <>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 2, mb: 1 }}>Guarantors</Typography>
                  {detail.guarantors.map((g, gi) => (
                    <Box key={gi} sx={{ mb: 1.5, p: 1.5, borderRadius: 1, border: "1px solid", borderColor: "divider" }}>
                      <Typography variant="body2" fontWeight={600}>
                        {g.name} · {g.type === "family" ? "Family member" : "Civil Servant / Gov't"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {[g.relationship, g.positionRole, g.workplace, g.contact].filter(Boolean).join(" · ") || "—"}
                      </Typography>
                      {g.ghanaCardNumber && (
                        <Typography variant="caption" color="text.secondary" display="block">Card: {g.ghanaCardNumber}</Typography>
                      )}
                      <Grid container spacing={1.5} sx={{ mt: 0.25 }}>
                        {[["Front", g.ghanaCardFrontUrl], ["Back", g.ghanaCardBackUrl]].map(([lbl, url]) => (
                          <Grid item xs={6} key={lbl}>
                            <Typography variant="caption" color="text.secondary" display="block">{lbl}</Typography>
                            {url ? (
                              <Box component="a" href={url} target="_blank" rel="noreferrer" sx={{ display: "block" }}>
                                <Box component="img" src={url} alt={lbl}
                                  sx={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 1, border: "1px solid", borderColor: "divider" }} />
                              </Box>
                            ) : <Typography variant="caption" color="text.secondary">—</Typography>}
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ))}
                </>
              )}

              <Divider sx={{ my: 2 }} />

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  {STATUS_ORDER.map((s) => <MenuItem key={s} value={s}>{STATUS_CFG[s].label}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField
                fullWidth size="small" multiline minRows={2} label="Review note (optional)"
                value={note} onChange={(e) => setNote(e.target.value)}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetail(null)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={saveStatus} disabled={saving}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
