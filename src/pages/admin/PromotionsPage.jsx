import { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, Chip, Button, CircularProgress,
  Table, TableContainer, TableHead, TableBody, TableRow, TableCell,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Alert, Switch,
  FormControlLabel, Grid,
} from "@mui/material";
import AddIcon          from "@mui/icons-material/Add";
import EditIcon         from "@mui/icons-material/Edit";
import DeleteIcon       from "@mui/icons-material/Delete";
import LocalOfferIcon   from "@mui/icons-material/LocalOffer";
import { promoAPI } from "../../api/client";

const BLANK_PROMO = {
  code: "", description: "", type: "percentage", value: "",
  maxDiscount: "", minFare: "", firstRideOnly: false,
  usageLimit: "", perUserLimit: "1", expiresAt: "", active: true,
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");

// Convert blank strings to null / numbers for the API
const clean = (f) => ({
  code: f.code.trim().toUpperCase(),
  description: f.description?.trim() || "",
  type: f.type,
  value: Number(f.value) || 0,
  maxDiscount: f.maxDiscount === "" ? null : Number(f.maxDiscount),
  minFare: f.minFare === "" ? 0 : Number(f.minFare),
  firstRideOnly: !!f.firstRideOnly,
  usageLimit: f.usageLimit === "" ? null : Number(f.usageLimit),
  perUserLimit: f.perUserLimit === "" ? null : Number(f.perUserLimit),
  expiresAt: f.expiresAt || null,
  active: !!f.active,
});

export default function PromotionsPage() {
  const [promos, setPromos]   = useState([]);
  const [flags, setFlags]     = useState({ promotions_enabled: false });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]       = useState(null);   // promo id or null (create)
  const [form, setForm]             = useState(BLANK_PROMO);
  const [saving, setSaving]         = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);   // promo pending delete
  const [deleting, setDeleting]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ promos }, { flags }] = await Promise.all([promoAPI.list(), promoAPI.getFlags()]);
      setPromos(promos);
      setFlags(flags);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load promotions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const masterOn = !!flags.promotions_enabled;

  const toggleMaster = async () => {
    try {
      const next = !masterOn;
      setFlags((f) => ({ ...f, promotions_enabled: next }));   // optimistic
      await promoAPI.setFlag("promotions_enabled", next);
    } catch {
      setFlags((f) => ({ ...f, promotions_enabled: masterOn })); // revert
    }
  };

  const openCreate = () => { setEditing(null); setForm(BLANK_PROMO); setDialogOpen(true); };
  const openEdit = (p) => {
    setEditing(p._id);
    setForm({
      code: p.code, description: p.description ?? "", type: p.type,
      value: String(p.value ?? ""), maxDiscount: p.maxDiscount ?? "",
      minFare: p.minFare ?? "", firstRideOnly: !!p.firstRideOnly,
      usageLimit: p.usageLimit ?? "", perUserLimit: p.perUserLimit ?? "",
      expiresAt: p.expiresAt ? p.expiresAt.slice(0, 10) : "", active: !!p.active,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = clean(form);
      if (editing) await promoAPI.update(editing, payload);
      else await promoAPI.create(payload);
      setDialogOpen(false);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Could not save promo");
    } finally {
      setSaving(false);
    }
  };

  const togglePromo = async (p) => {
    setPromos((list) => list.map((x) => (x._id === p._id ? { ...x, active: !x.active } : x)));
    try { await promoAPI.toggle(p._id); }
    catch { load(); }
  };

  // Native confirm() doesn't work in Electron — use a modal instead.
  const remove = (p) => setConfirmDel(p);

  const doRemove = async () => {
    if (!confirmDel) return;
    setDeleting(true);
    try {
      await promoAPI.remove(confirmDel._id);
      setPromos((l) => l.filter((x) => x._id !== confirmDel._id));
      setConfirmDel(null);
    } catch (e) {
      setError(e?.response?.data?.message || "Could not delete promo");
    } finally {
      setDeleting(false);
    }
  };

  const discountLabel = (p) =>
    p.type === "percentage"
      ? `${p.value}%${p.maxDiscount ? ` (max GH₵${p.maxDiscount})` : ""}`
      : `GH₵${Number(p.value).toFixed(2)}`;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="overline" display="block">Marketing</Typography>
          <Typography variant="h4" fontWeight={800}>Promotions</Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={openCreate} disabled={loading}>
          New Promo
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      {/* Feature flags */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <LocalOfferIcon color="primary" fontSize="small" />
            <Typography variant="h6" fontWeight={700} fontSize="1rem">Feature Flags</Typography>
          </Box>
          <FormControlLabel
            control={<Switch checked={masterOn} onChange={toggleMaster} color="success" />}
            label={
              <Box>
                <Typography variant="body2" fontWeight={700}>Promotions enabled</Typography>
                <Typography variant="caption" color="text.secondary">
                  Master switch — when off, no promo code works regardless of its own status.
                </Typography>
              </Box>
            }
          />
          {!masterOn && (
            <Alert severity="warning" sx={{ mt: 1.5 }}>
              Promotions are globally disabled. Riders cannot redeem any code right now.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Promo table */}
      <Card>
        <Box px={2.5} pt={2.5} pb={1.5}>
          <Typography variant="h6" fontWeight={700} fontSize="0.95rem">Promo Codes</Typography>
        </Box>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}><CircularProgress size={28} /></Box>
        ) : promos.length === 0 ? (
          <Box p={4} textAlign="center">
            <Typography color="text.secondary">No promo codes yet. Create your first one.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small" sx={{ minWidth: 760 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Discount</TableCell>
                  <TableCell>Rules</TableCell>
                  <TableCell>Usage</TableCell>
                  <TableCell>Expires</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {promos.map((p) => (
                  <TableRow key={p._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="primary.main">{p.code}</Typography>
                      {p.description && (
                        <Typography variant="caption" color="text.secondary">{p.description}</Typography>
                      )}
                    </TableCell>
                    <TableCell><Typography variant="body2">{discountLabel(p)}</Typography></TableCell>
                    <TableCell>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {p.minFare > 0 && <Chip size="small" label={`Min GH₵${p.minFare}`} />}
                        {p.firstRideOnly && <Chip size="small" color="info" label="First ride" />}
                        {!p.minFare && !p.firstRideOnly && <Typography variant="caption" color="text.secondary">—</Typography>}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {p.usedCount ?? 0}{p.usageLimit != null ? ` / ${p.usageLimit}` : ""}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {p.perUserLimit != null ? `${p.perUserLimit}/rider` : "∞/rider"}
                      </Typography>
                    </TableCell>
                    <TableCell><Typography variant="body2">{fmtDate(p.expiresAt)}</Typography></TableCell>
                    <TableCell>
                      <Tooltip title={p.active ? "Active — click to disable" : "Disabled — click to enable"}>
                        <Switch size="small" checked={!!p.active} onChange={() => togglePromo(p)} color="success" />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEdit(p)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => remove(p)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Edit Promo" : "New Promo"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Code" fullWidth value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                disabled={!!editing}
                helperText={editing ? "Code can't be changed" : "e.g. WELCOME20"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <MenuItem value="percentage">Percentage off</MenuItem>
                  <MenuItem value="fixed">Fixed amount off</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Description" fullWidth value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={form.type === "percentage" ? "Percent off (%)" : "Amount off (GH₵)"}
                type="number" fullWidth value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </Grid>
            {form.type === "percentage" && (
              <Grid item xs={12} sm={6}>
                <TextField label="Max discount (GH₵)" type="number" fullWidth value={form.maxDiscount}
                  onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                  helperText="Blank = uncapped" />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField label="Minimum fare (GH₵)" type="number" fullWidth value={form.minFare}
                onChange={(e) => setForm({ ...form, minFare: e.target.value })}
                helperText="Blank/0 = none" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Expires on" type="date" fullWidth value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Total usage limit" type="number" fullWidth value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                helperText="Blank = unlimited" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Per-rider limit" type="number" fullWidth value={form.perUserLimit}
                onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
                helperText="Blank = unlimited" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={<Switch checked={form.firstRideOnly} onChange={(e) => setForm({ ...form, firstRideOnly: e.target.checked })} />}
                label="First ride only"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={<Switch checked={form.active} color="success" onChange={(e) => setForm({ ...form, active: e.target.checked })} />}
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={save} variant="contained" disabled={saving || !form.code || form.value === ""}>
            {saving ? "Saving…" : editing ? "Save changes" : "Create promo"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!confirmDel} onClose={() => !deleting && setConfirmDel(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete promo code?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Delete promo <strong>{confirmDel?.code}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDel(null)} color="inherit" disabled={deleting}>Cancel</Button>
          <Button onClick={doRemove} color="error" variant="contained" disabled={deleting}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
