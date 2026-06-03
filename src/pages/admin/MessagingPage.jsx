import { useEffect, useState, useCallback, useRef } from "react";
import {
  Box, Typography, Card, CardContent, Grid, TextField, MenuItem, Select,
  FormControl, InputLabel, FormControlLabel, Checkbox, Button, Alert,
  CircularProgress, Tabs, Tab, Chip, Divider, IconButton, Tooltip,
  Table, TableContainer, TableHead, TableBody, TableRow, TableCell,
  Dialog, DialogTitle, DialogContent, DialogActions, RadioGroup, Radio,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import ReplayIcon from "@mui/icons-material/Replay";
import CampaignIcon from "@mui/icons-material/Campaign";
import { messagingAPI } from "../../api/client";
import { errorMessage } from "../../utils/helpers";

const AUDIENCES = [
  { key: "drivers", label: "Drivers" },
  { key: "staff", label: "Fleet Managers & Admins" },
  { key: "applicants", label: "Driver Applicants" },
];
const STORAGE_KEY = "avira_campaign_compose";
const STATUS_CFG = {
  draft:     { label: "Draft",     color: "#9E9E9E", bg: "#9E9E9E20" },
  scheduled: { label: "Scheduled", color: "#2196F3", bg: "#2196F320" },
  active:    { label: "Recurring", color: "#9C27B0", bg: "#9C27B020" },
  sending:   { label: "Sending",   color: "#FF9800", bg: "#FF980020" },
  sent:      { label: "Sent",      color: "#4CAF50", bg: "#4CAF5020" },
  failed:    { label: "Failed",    color: "#F44336", bg: "#F4433620" },
  cancelled: { label: "Cancelled", color: "#9E9E9E", bg: "#9E9E9E20" },
};
const rkey = (r) => `${r.email || ""}|${r.phone || ""}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—");

const BLANK = {
  name: "", channel: "email", subject: "", body: "",
  audience: "", recipientMode: "all",
  attachments: [], delivery: "now", scheduledAt: "",
  recurrence: { frequency: "daily", time: "09:00", dayOfWeek: 1, dayOfMonth: 1 },
};

export default function MessagingPage() {
  const [tab, setTab] = useState(0);

  // compose
  const [form, setForm] = useState(BLANK);
  const [pool, setPool] = useState([]);          // resolved recipients for chosen audiences
  const [selected, setSelected] = useState({});  // key -> recipient
  const [loadingPool, setLoadingPool] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [editingId, setEditingId] = useState(null);   // editing an existing draft
  const [savingDraft, setSavingDraft] = useState(false);
  const hydrated = useRef(false);

  // Restore any in-progress compose state once on mount (survives refresh/nav).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved && saved.form) {
        setForm({ ...BLANK, ...saved.form });
        setSelected(saved.selected || {});
        setEditingId(saved.editingId || null);
      }
    } catch { /* ignore */ }
    hydrated.current = true;
  }, []);

  // Persist on change (only after hydration, to avoid clobbering the restore).
  useEffect(() => {
    if (!hydrated.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ form, selected, editingId }));
  }, [form, selected, editingId]);

  const resetCompose = () => {
    setForm(BLANK); setSelected({}); setEditingId(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // campaigns
  const [campaigns, setCampaigns] = useState([]);
  const [loadingC, setLoadingC] = useState(false);
  const [viewCampaign, setViewCampaign] = useState(null);   // preview modal
  const [deleteTarget, setDeleteTarget] = useState(null);   // delete confirm
  const [retrying, setRetrying] = useState(null);           // id being retried
  const [deleting, setDeleting] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const setRec = (k) => (e) => setForm((p) => ({ ...p, recurrence: { ...p.recurrence, [k]: e.target.value } }));

  // Resolve recipients whenever the audience changes (for counts + checkbox list).
  useEffect(() => {
    if (!form.audience) { setPool([]); setSelected({}); return; }
    setLoadingPool(true);
    messagingAPI.recipients([form.audience])
      .then((r) => {
        const data = r.data.data || [];
        setPool(data);
        // keep only still-valid selections
        setSelected((prev) => {
          const valid = {}; const keys = new Set(data.map(rkey));
          Object.entries(prev).forEach(([k, v]) => { if (keys.has(k)) valid[k] = v; });
          return valid;
        });
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoadingPool(false));
  }, [form.audience]);

  const loadCampaigns = useCallback(() => {
    setLoadingC(true);
    messagingAPI.listCampaigns()
      .then((r) => setCampaigns(r.data.data || []))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoadingC(false));
  }, []);
  useEffect(() => { if (tab === 1) loadCampaigns(); }, [tab, loadCampaigns]);

  const toggleRecipient = (r) =>
    setSelected((p) => { const k = rkey(r); const n = { ...p }; if (n[k]) delete n[k]; else n[k] = r; return n; });

  const handleAttach = async (files) => {
    if (!files?.length) return;
    setUploading(true); setError("");
    try {
      for (const file of files) {
        const fd = new FormData(); fd.append("file", file);
        const { data } = await messagingAPI.uploadAttachment(fd);
        setForm((p) => ({ ...p, attachments: [...p.attachments, { name: data.name, url: data.url, type: data.type }] }));
      }
    } catch (e) { setError(errorMessage(e)); }
    finally { setUploading(false); }
  };
  const removeAttachment = (i) => setForm((p) => ({ ...p, attachments: p.attachments.filter((_, idx) => idx !== i) }));

  const recipientCount = form.recipientMode === "selected" ? Object.keys(selected).length : pool.length;

  const validate = () => {
    if (!form.name.trim()) return "Give the campaign a name.";
    if (!form.body.trim()) return "Write a message body.";
    if ((form.channel === "email" || form.channel === "both") && !form.subject.trim()) return "Email subject is required.";
    if (!form.audience) return "Select an audience group.";
    if (form.recipientMode === "selected" && !Object.keys(selected).length) return "Select at least one recipient.";
    if (form.delivery === "once" && !form.scheduledAt) return "Pick a date and time for the scheduled send.";
    return "";
  };

  const openPreview = () => { const v = validate(); if (v) { setError(v); return; } setError(""); setPreview(true); };

  const buildPayload = (asDraft) => ({
    name: form.name, channel: form.channel, subject: form.subject, body: form.body,
    audiences: form.audience ? [form.audience] : [], recipientMode: form.recipientMode,
    recipients: form.recipientMode === "selected" ? Object.values(selected) : [],
    attachments: form.attachments,
    delivery: form.delivery,
    scheduledAt: form.delivery === "once" ? form.scheduledAt : null,
    recurrence: form.delivery === "recurring" ? form.recurrence : undefined,
    asDraft,
  });

  const submit = async () => {
    setSending(true); setError("");
    try {
      const payload = buildPayload(false);
      if (editingId) await messagingAPI.updateCampaign(editingId, payload);
      else await messagingAPI.createCampaign(payload);
      setPreview(false);
      setToast(form.delivery === "now" ? "Campaign sent." : "Campaign scheduled.");
      resetCompose(); setPool([]);
      setTab(1);
    } catch (e) { setError(errorMessage(e)); }
    finally { setSending(false); }
  };

  const saveDraft = async () => {
    if (!form.name.trim()) { setError("Give the campaign a name to save a draft."); return; }
    setSavingDraft(true); setError("");
    try {
      const payload = buildPayload(true);
      if (editingId) await messagingAPI.updateCampaign(editingId, payload);
      else await messagingAPI.createCampaign(payload);
      setToast("Draft saved.");
      resetCompose(); setPool([]);
      setTab(1);
    } catch (e) { setError(errorMessage(e)); }
    finally { setSavingDraft(false); }
  };

  // Load a saved draft back into the composer for editing.
  const editDraft = (c) => {
    setEditingId(c._id);
    setForm({
      name: c.name || "", channel: c.channel || "email", subject: c.subject || "", body: c.body || "",
      audience: (c.audiences && c.audiences[0]) || "",
      recipientMode: c.recipientMode || "all",
      attachments: c.attachments || [],
      delivery: c.delivery || "now",
      scheduledAt: c.scheduledAt ? new Date(c.scheduledAt).toISOString().slice(0, 16) : "",
      recurrence: {
        frequency: c.recurrence?.frequency || "daily",
        time: c.recurrence?.time || "09:00",
        dayOfWeek: c.recurrence?.dayOfWeek ?? 1,
        dayOfMonth: c.recurrence?.dayOfMonth ?? 1,
      },
    });
    const sel = {};
    (c.recipients || []).forEach((r) => { sel[rkey(r)] = r; });
    setSelected(sel);
    setTab(0);
  };

  const cancelCampaign = async (id) => {
    try { await messagingAPI.cancelCampaign(id); setToast("Campaign cancelled."); loadCampaigns(); }
    catch (e) { setError(errorMessage(e)); }
  };

  const canRetry = (c) => c.status === "failed" || (c.stats && (c.stats.emailsFailed || c.stats.smsFailed));

  const handleRetry = async (c) => {
    setRetrying(c._id); setError("");
    try { await messagingAPI.retryCampaign(c._id); setToast("Campaign re-sent."); loadCampaigns(); }
    catch (e) { setError(errorMessage(e)); }
    finally { setRetrying(null); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await messagingAPI.deleteCampaign(deleteTarget._id); setToast("Campaign deleted."); setDeleteTarget(null); loadCampaigns(); }
    catch (e) { setError(errorMessage(e)); }
    finally { setDeleting(false); }
  };

  const deliveryLabel = (c) =>
    c.delivery === "now" ? "Send now"
    : c.delivery === "once" ? `Once · ${fmtDate(c.scheduledAt)}`
    : `Recurring · ${c.recurrence?.frequency} @ ${c.recurrence?.time}`;

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="overline" display="block">Communications</Typography>
        <Typography variant="h4" fontWeight={800}>Bulk Email &amp; SMS</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {toast && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setToast("")}>{toast}</Alert>}

      <Box sx={{ borderBottom: "1px solid rgba(128,128,128,0.2)", mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="primary" indicatorColor="primary">
          <Tab icon={<SendIcon fontSize="small" />} iconPosition="start" label="Compose" sx={{ minHeight: 48 }} />
          <Tab icon={<CampaignIcon fontSize="small" />} iconPosition="start" label="Campaigns" sx={{ minHeight: 48 }} />
        </Tabs>
      </Box>

      {/* ── COMPOSE ─────────────────────────────────────────────────────────── */}
      {tab === 0 && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={7}>
            <Card sx={{ mb: 2.5 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontSize="0.9rem" fontWeight={700} mb={2.5}>Message</Typography>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={8}>
                    <TextField fullWidth label="Campaign name" value={form.name} onChange={set("name")} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth select label="Channel" value={form.channel} onChange={set("channel")}>
                      <MenuItem value="email">Email</MenuItem>
                      <MenuItem value="sms">SMS</MenuItem>
                      <MenuItem value="both">Email + SMS</MenuItem>
                    </TextField>
                  </Grid>
                  {(form.channel === "email" || form.channel === "both") && (
                    <Grid item xs={12}>
                      <TextField fullWidth label="Email subject" value={form.subject} onChange={set("subject")} />
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <TextField fullWidth multiline minRows={6} label="Message body" value={form.body} onChange={set("body")}
                      helperText={form.channel !== "email" ? "Keep it concise for SMS (long texts may split into multiple messages)." : " "} />
                  </Grid>
                </Grid>

                {/* Attachments */}
                <Typography variant="subtitle2" fontWeight={700} mt={1.5} mb={1}>Attachments</Typography>
                <Button component="label" size="small" startIcon={uploading ? <CircularProgress size={14} /> : <AttachFileIcon />} disabled={uploading}>
                  Add files
                  <input type="file" hidden multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,image/*"
                    onChange={(e) => handleAttach(Array.from(e.target.files || []))} />
                </Button>
                <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                  PDF, Word, Excel, txt/csv, zip or images. Email only (SMS can't carry attachments).
                </Typography>
                <Box mt={1} display="flex" flexDirection="column" gap={0.5}>
                  {form.attachments.map((a, i) => (
                    <Box key={i} display="flex" alignItems="center" gap={1}>
                      <AttachFileIcon fontSize="small" sx={{ color: "text.secondary" }} />
                      <Typography variant="body2" sx={{ flex: 1, wordBreak: "break-all" }}>{a.name}</Typography>
                      <IconButton size="small" color="error" onClick={() => removeAttachment(i)}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Delivery */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontSize="0.9rem" fontWeight={700} mb={1.5}>Delivery</Typography>
                <RadioGroup row value={form.delivery} onChange={set("delivery")}>
                  <FormControlLabel value="now" control={<Radio />} label="Send now" />
                  <FormControlLabel value="once" control={<Radio />} label="Schedule once" />
                  <FormControlLabel value="recurring" control={<Radio />} label="Recurring" />
                </RadioGroup>
                {form.delivery === "once" && (
                  <TextField sx={{ mt: 1.5 }} fullWidth type="datetime-local" label="Send at"
                    value={form.scheduledAt} onChange={set("scheduledAt")} InputLabelProps={{ shrink: true }} />
                )}
                {form.delivery === "recurring" && (
                  <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid item xs={6} sm={4}>
                      <TextField fullWidth select label="Frequency" value={form.recurrence.frequency} onChange={setRec("frequency")}>
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <TextField fullWidth type="time" label="Time" value={form.recurrence.time} onChange={setRec("time")} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    {form.recurrence.frequency === "weekly" && (
                      <Grid item xs={12} sm={4}>
                        <TextField fullWidth select label="Day of week" value={form.recurrence.dayOfWeek} onChange={setRec("dayOfWeek")}>
                          {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map((d, i) => <MenuItem key={d} value={i}>{d}</MenuItem>)}
                        </TextField>
                      </Grid>
                    )}
                    {form.recurrence.frequency === "monthly" && (
                      <Grid item xs={12} sm={4}>
                        <TextField fullWidth select label="Day of month" value={form.recurrence.dayOfMonth} onChange={setRec("dayOfMonth")}>
                          {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                        </TextField>
                      </Grid>
                    )}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Recipients */}
          <Grid item xs={12} md={5}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontSize="0.9rem" fontWeight={700} mb={1.5}>Recipients</Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>Audience group</InputLabel>
                  <Select label="Audience group" value={form.audience} onChange={set("audience")}>
                    {AUDIENCES.map((a) => <MenuItem key={a.key} value={a.key}>{a.label}</MenuItem>)}
                  </Select>
                </FormControl>

                <RadioGroup value={form.recipientMode} onChange={set("recipientMode")} sx={{ mt: 1 }}>
                  <FormControlLabel value="all" control={<Radio size="small" />} label={`Send to everyone in this group${pool.length ? ` (${pool.length})` : ""}`} />
                  <FormControlLabel value="selected" control={<Radio size="small" />} label="Pick specific recipients" />
                </RadioGroup>

                {form.recipientMode === "selected" && (
                  <Box sx={{ mt: 1, maxHeight: 280, overflowY: "auto", border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1 }}>
                    {loadingPool ? (
                      <Box display="flex" justifyContent="center" p={2}><CircularProgress size={22} /></Box>
                    ) : pool.length ? (
                      pool.map((r) => (
                        <FormControlLabel key={rkey(r)} sx={{ display: "flex", m: 0 }}
                          control={<Checkbox size="small" checked={Boolean(selected[rkey(r)])} onChange={() => toggleRecipient(r)} />}
                          label={
                            <Box>
                              <Typography variant="body2">{r.name || "(no name)"}</Typography>
                              <Typography variant="caption" color="text.secondary">{[r.email, r.phone].filter(Boolean).join(" · ")}</Typography>
                            </Box>
                          } />
                      ))
                    ) : (
                      <Typography variant="caption" color="text.secondary">Select an audience to list recipients.</Typography>
                    )}
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary" mb={editingId ? 0.5 : 2}>
                  <strong>{recipientCount}</strong> recipient{recipientCount === 1 ? "" : "s"} · {form.channel === "both" ? "Email + SMS" : form.channel.toUpperCase()}
                </Typography>
                {editingId && (
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Chip label="Editing draft" size="small" sx={{ bgcolor: "#9E9E9E20", color: "#9E9E9E" }} />
                    <Button size="small" onClick={resetCompose}>Discard</Button>
                  </Box>
                )}
                <Box display="flex" flexDirection="column" gap={1}>
                  <Button variant="text" onClick={saveDraft} disabled={savingDraft}
                    startIcon={savingDraft ? <CircularProgress size={14} /> : null}>
                    {savingDraft ? "Saving…" : "Save as draft"}
                  </Button>
                  <Box display="flex" gap={1}>
                    <Button variant="outlined" startIcon={<VisibilityIcon />} onClick={openPreview} fullWidth>Preview</Button>
                    <Button variant="contained" startIcon={<SendIcon />} onClick={openPreview} fullWidth>
                      {form.delivery === "now" ? "Send" : "Schedule"}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ── CAMPAIGNS ───────────────────────────────────────────────────────── */}
      {tab === 1 && (
        <Card>
          {loadingC ? (
            <Box display="flex" justifyContent="center" p={4}><CircularProgress size={28} /></Box>
          ) : (
            <TableContainer>
              <Table size="small" sx={{ minWidth: 820 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Campaign</TableCell>
                    <TableCell>Channel</TableCell>
                    <TableCell>Delivery</TableCell>
                    <TableCell>Sent</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {campaigns.map((c) => {
                    const sc = STATUS_CFG[c.status] || STATUS_CFG.scheduled;
                    return (
                      <TableRow key={c._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{(c.audiences || []).join(", ") || `${c.recipients?.length || 0} selected`}</Typography>
                        </TableCell>
                        <TableCell><Typography variant="caption">{c.channel === "both" ? "Email+SMS" : c.channel.toUpperCase()}</Typography></TableCell>
                        <TableCell><Typography variant="caption">{deliveryLabel(c)}</Typography></TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            ✉ {c.stats?.emailsSent || 0}{c.stats?.emailsFailed ? ` (${c.stats.emailsFailed}✗)` : ""} · 📱 {c.stats?.smsSent || 0}{c.stats?.smsFailed ? ` (${c.stats.smsFailed}✗)` : ""}
                          </Typography>
                        </TableCell>
                        <TableCell><Chip label={sc.label} size="small" sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 600 }} /></TableCell>
                        <TableCell><Typography variant="caption" color="text.secondary">{fmtDate(c.createdAt)}</Typography></TableCell>
                        <TableCell align="center">
                          <Box display="flex" gap={0.25} justifyContent="center" alignItems="center">
                            <Tooltip title="Preview"><IconButton size="small" onClick={() => setViewCampaign(c)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                            {c.status === "draft" && (
                              <Button size="small" onClick={() => editDraft(c)}>Edit</Button>
                            )}
                            {canRetry(c) && (
                              <Tooltip title="Retry failed sends">
                                <span>
                                  <IconButton size="small" color="primary" disabled={retrying === c._id} onClick={() => handleRetry(c)}>
                                    {retrying === c._id ? <CircularProgress size={16} /> : <ReplayIcon fontSize="small" />}
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                            {["scheduled", "active"].includes(c.status) && (
                              <Button size="small" color="warning" onClick={() => cancelCampaign(c._id)}>Cancel</Button>
                            )}
                            <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteTarget(c)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!campaigns.length && (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: "text.secondary" }}>No campaigns yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

      {/* Preview modal */}
      <Dialog open={preview} onClose={() => setPreview(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Preview — {form.name || "Campaign"}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="caption" color="text.secondary">Channel</Typography>
          <Typography variant="body2" gutterBottom>{form.channel === "both" ? "Email + SMS" : form.channel.toUpperCase()}</Typography>
          <Typography variant="caption" color="text.secondary">Recipients</Typography>
          <Typography variant="body2" gutterBottom>{recipientCount} ({form.recipientMode === "all" ? (AUDIENCES.find((a) => a.key === form.audience)?.label || "—") : "selected"})</Typography>
          <Typography variant="caption" color="text.secondary">Delivery</Typography>
          <Typography variant="body2" gutterBottom>
            {form.delivery === "now" ? "Send now"
              : form.delivery === "once" ? `Once · ${fmtDate(form.scheduledAt)}`
              : `Recurring · ${form.recurrence.frequency} @ ${form.recurrence.time}`}
          </Typography>
          <Divider sx={{ my: 1.5 }} />
          {(form.channel === "email" || form.channel === "both") && (
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>{form.subject || "(no subject)"}</Typography>
          )}
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{form.body || "(empty)"}</Typography>
          {form.attachments.length > 0 && (
            <Box mt={2}>
              <Typography variant="caption" color="text.secondary">Attachments ({form.attachments.length})</Typography>
              {form.attachments.map((a, i) => <Typography key={i} variant="body2">• {a.name}</Typography>)}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreview(false)} disabled={sending}>Back</Button>
          <Button variant="contained" startIcon={sending ? <CircularProgress size={14} color="inherit" /> : <SendIcon />} onClick={submit} disabled={sending}>
            {form.delivery === "now" ? "Confirm & Send" : "Confirm & Schedule"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Campaign preview (read-only) */}
      <Dialog open={Boolean(viewCampaign)} onClose={() => setViewCampaign(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{viewCampaign?.name}</DialogTitle>
        <DialogContent dividers>
          {viewCampaign && (
            <>
              <Box display="flex" gap={1} flexWrap="wrap" mb={1.5}>
                <Chip size="small" label={STATUS_CFG[viewCampaign.status]?.label || viewCampaign.status}
                  sx={{ bgcolor: STATUS_CFG[viewCampaign.status]?.bg, color: STATUS_CFG[viewCampaign.status]?.color, fontWeight: 600 }} />
                <Chip size="small" label={viewCampaign.channel === "both" ? "Email + SMS" : viewCampaign.channel.toUpperCase()} />
              </Box>
              <Typography variant="caption" color="text.secondary">Recipients</Typography>
              <Typography variant="body2" gutterBottom>
                {viewCampaign.recipientMode === "all"
                  ? `Everyone in: ${(viewCampaign.audiences || []).map((a) => AUDIENCES.find((x) => x.key === a)?.label || a).join(", ") || "—"}`
                  : `${viewCampaign.recipients?.length || 0} selected recipients`}
              </Typography>
              <Typography variant="caption" color="text.secondary">Delivery</Typography>
              <Typography variant="body2" gutterBottom>{deliveryLabel(viewCampaign)}</Typography>
              <Typography variant="caption" color="text.secondary">Results</Typography>
              <Typography variant="body2" gutterBottom>
                ✉ {viewCampaign.stats?.emailsSent || 0} sent{viewCampaign.stats?.emailsFailed ? `, ${viewCampaign.stats.emailsFailed} failed` : ""} · 📱 {viewCampaign.stats?.smsSent || 0} sent{viewCampaign.stats?.smsFailed ? `, ${viewCampaign.stats.smsFailed} failed` : ""}
              </Typography>
              {viewCampaign.lastError && (
                <Alert severity="warning" sx={{ my: 1 }}>{viewCampaign.lastError}</Alert>
              )}
              <Divider sx={{ my: 1.5 }} />
              {(viewCampaign.channel === "email" || viewCampaign.channel === "both") && (
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>{viewCampaign.subject || "(no subject)"}</Typography>
              )}
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{viewCampaign.body}</Typography>
              {viewCampaign.attachments?.length > 0 && (
                <Box mt={2}>
                  <Typography variant="caption" color="text.secondary">Attachments ({viewCampaign.attachments.length})</Typography>
                  {viewCampaign.attachments.map((a, i) => (
                    <Typography key={i} variant="body2">
                      • <a href={a.url} target="_blank" rel="noreferrer">{a.name}</a>
                    </Typography>
                  ))}
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          {viewCampaign && canRetry(viewCampaign) && (
            <Button color="primary" startIcon={<ReplayIcon />} onClick={() => { handleRetry(viewCampaign); setViewCampaign(null); }}>Retry</Button>
          )}
          <Button onClick={() => setViewCampaign(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete campaign?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Permanently delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
            {["scheduled", "active"].includes(deleteTarget?.status) && " It is scheduled — deleting will stop any future sends."}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <DeleteIcon />}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
