import { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, Grid, Chip, Button, CircularProgress,
  Table, TableContainer, TableHead, TableBody, TableRow, TableCell,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Alert, Avatar, Switch,
  InputAdornment,
} from "@mui/material";
import SearchIcon      from "@mui/icons-material/Search";
import PersonAddIcon   from "@mui/icons-material/PersonAdd";
import EditIcon        from "@mui/icons-material/Edit";
import DeleteIcon      from "@mui/icons-material/Delete";
import VpnKeyIcon      from "@mui/icons-material/VpnKey";
import GroupsIcon      from "@mui/icons-material/Groups";
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { dashboardAPI } from "../../api/client";
import { usePaged } from "../../hooks/usePaged";
import TablePager from "../../components/common/TablePager";
import { useAuth } from "../../contexts/AuthContext";
import { errorMessage, avatarColor } from "../../utils/helpers";

// ─── Config ──────────────────────────────────────────────────────────────────
const REGIONS = [
  "Greater Accra", "Ashanti", "Volta", "Central", "Eastern", "Western",
  "Oti", "Bono", "Bono East", "Ahafo", "Brong Ahafo", "Northern",
  "Western North", "Upper West", "Upper East", "North East",
];

const ROLE_CFG = {
  admin:         { label: "Admin",         color: "#F44336", bg: "#F4433620" },
  fleet_manager: { label: "Fleet Manager", color: "#2196F3", bg: "#2196F320" },
  developer:     { label: "Developer",     color: "#9C27B0", bg: "#9C27B020" },
  driver:        { label: "Driver",        color: "#4CAF50", bg: "#4CAF5020" },
};
const ROLE_COLORS = ["#F44336","#2196F3","#9C27B0","#4CAF50","#FF9800"];
const AGE_COLORS  = ["#D32F2F","#2196F3","#4CAF50","#FF9800","#9C27B0","#9E9E9E"];
const BLANK_USER = { name: "", email: "", phone: "", role: "fleet_manager", password: "", region: "", dateOfBirth: "" };

// ─── Small helpers ────────────────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB") : "—";
const calcAge  = (dob) => {
  if (!dob) return null;
  const age = Math.floor((Date.now() - new Date(dob)) / (365.25 * 86400000));
  return age > 0 && age < 120 ? age : null;
};

// ─── Chart tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1.5 }}>
      {label && <Typography variant="caption" display="block" fontWeight={700} mb={0.5}>{label}</Typography>}
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TeamPage() {
  const { user: currentUser } = useAuth();
  // Developers manage the whole system and get the technical role-override.
  const isDeveloper = (currentUser?.roles?.length ? currentUser.roles : [currentUser?.role]).includes("developer");

  const [users,       setUsers]       = useState([]);
  const [analytics,   setAnalytics]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [toast,       setToast]       = useState("");

  // Add dialog
  const [addDlg,    setAddDlg]    = useState(false);
  const [addForm,   setAddForm]   = useState(BLANK_USER);
  const [addSaving, setAddSaving] = useState(false);
  const [addError,  setAddError]  = useState("");

  // Edit dialog
  const [editDlg,    setEditDlg]    = useState(null);   // user
  const [editForm,   setEditForm]   = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError,  setEditError]  = useState("");

  // Role dialog
  const [roleDlg,    setRoleDlg]    = useState(null);   // user
  const [newRoles,   setNewRoles]    = useState([]);
  const [roleSaving, setRoleSaving] = useState(false);

  // Delete dialog
  const [delDlg,   setDelDlg]   = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Search & filters
  const [search,       setSearch]       = useState("");
  const [roleFilter,   setRoleFilter]   = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // ── Data loading ────────────────────────────────────────────────────────────
  const loadAll = useCallback(() => {
    setLoading(true);
    Promise.all([dashboardAPI.users(), dashboardAPI.teamAnalytics()])
      .then(([u, a]) => {
        setUsers(u.data.data);
        setAnalytics(a.data);
      })
      .catch(e => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Admins see staff only (drivers live in the Drivers page, developers are
  // hidden). The developer manages the whole system, so they see everyone.
  const teamMembers = isDeveloper
    ? users
    : users.filter(u => u.role !== "driver" && u.role !== "developer");

  // Roles actually present, for the filter dropdown.
  const presentRoles = [...new Set(teamMembers.map(u => u.role))];

  // Apply search + role + status filters.
  const visibleMembers = teamMembers.filter(u => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q
      || u.name?.toLowerCase().includes(q)
      || u.email?.toLowerCase().includes(q)
      || (u.uniqueId || "").toLowerCase().includes(q)
      || (u.phone  || "").toLowerCase().includes(q)
      || (u.region || "").toLowerCase().includes(q);
    const matchesRole   = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus = statusFilter === "all"
      || (statusFilter === "active" ? u.isActive : !u.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });
  const { paged: pagedMembers, page: memPage, setPage: setMemPage, pageCount: memPages, total: memTotal } = usePaged(visibleMembers, 10, [search, roleFilter, statusFilter]);
  const filtersActive = search.trim() || roleFilter !== "all" || statusFilter !== "all";

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!addForm.name || !addForm.email || !addForm.role) { setAddError("Name, email and role are required."); return; }
    setAddSaving(true); setAddError("");
    try {
      const r = await dashboardAPI.createUser(addForm);
      const d = r.data;
      setAddDlg(false); setAddForm(BLANK_USER);
      setToast(
        `User created. They sign in with their email and this code: ${d.defaultPassword} (an activation email is also sent if email is enabled).`
      );
      loadAll();
    } catch (e) { setAddError(errorMessage(e)); }
    finally { setAddSaving(false); }
  };

  const handleEditSave = async () => {
    setEditSaving(true); setEditError("");
    try {
      await dashboardAPI.updateUser(editDlg._id, editForm);
      setEditDlg(null);
      setToast("Profile updated.");
      loadAll();
    } catch (e) { setEditError(errorMessage(e)); }
    finally { setEditSaving(false); }
  };

  const handleRoleSave = async () => {
    if (!newRoles.length) return;
    setRoleSaving(true);
    try {
      // Developers use the technical override (any role, any user);
      // admins use the standard role endpoint (admin / fleet_manager only).
      const res = isDeveloper
        ? await dashboardAPI.devUpdateUserRole(roleDlg._id, { roles: newRoles })
        : await dashboardAPI.updateUserRole(roleDlg._id, { roles: newRoles });
      setRoleDlg(null); setNewRoles([]);
      setToast(res?.data?.note || "Roles updated.");
      loadAll();
    } catch (e) { setError(errorMessage(e)); }
    finally { setRoleSaving(false); }
  };
  const rolesArr = (u) => (u?.roles?.length ? u.roles : (u?.role ? [u.role] : []));

  const resetPassword = async (u) => {
    try {
      const { data } = await dashboardAPI.resetUserPassword(u._id);
      setToast(`New code for ${u.name} (${u.email}): ${data.defaultPassword} — they sign in with their email and this code.`);
      loadAll();
    } catch (e) { setError(errorMessage(e)); }
  };

  const handleToggle = async (u) => {
    try {
      await dashboardAPI.toggleUser(u._id);
      setToast(`${u.name} ${u.isActive ? "deactivated" : "activated"}.`);
      loadAll();
    } catch (e) { setError(errorMessage(e)); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await dashboardAPI.deleteUser(delDlg._id);
      setDelDlg(null); setToast("User deleted.");
      loadAll();
    } catch (e) { setError(errorMessage(e)); }
    finally { setDeleting(false); }
  };

  // ── Pie data from analytics ──────────────────────────────────────────────────
  const roleChartData = analytics
    ? Object.entries(analytics.byRole).map(([role, count]) => ({
        name: ROLE_CFG[role]?.label || role, value: count, role
      }))
    : [];

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="overline" display="block">Admin</Typography>
          <Typography variant="h4" fontWeight={800}>Team</Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<PersonAddIcon />}
          onClick={() => { setAddForm(BLANK_USER); setAddError(""); setAddDlg(true); }}>
          Add Member
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {toast && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setToast("")}>{toast}</Alert>}

      {/* ── Summary chips ────────────────────────────────────────────────── */}
      {analytics && (
        <Box display="flex" gap={1.5} mb={3} flexWrap="wrap">
          {[
            { label: "Total Members", value: analytics.total, color: "#D32F2F" },
            { label: "Active",        value: analytics.activeCount,   color: "#4CAF50" },
            { label: "Inactive",      value: analytics.inactiveCount, color: "#9E9E9E" },
            { label: "Joined (30d)",  value: analytics.recentJoins,  color: "#2196F3" },
          ].map(s => (
            <Card key={s.label} sx={{ px: 2.5, py: 1.5, minWidth: 130 }}>
              <Typography variant="caption" color="text.secondary" display="block">{s.label}</Typography>
              <Typography variant="h5" fontWeight={800} sx={{ color: s.color }}>{s.value}</Typography>
            </Card>
          ))}
        </Box>
      )}

      {/* ── Analytics charts ──────────────────────────────────────────────── */}
      {analytics && (
        <Grid container spacing={2.5} mb={3}>
          {/* Role distribution */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="body2" fontWeight={700} fontSize="0.85rem" mb={1}>
                  Role Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={roleChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                      paddingAngle={3} dataKey="value" label={({ name, percent }) => percent > 0.05 ? `${(percent*100).toFixed(0)}%` : ""}>
                      {roleChartData.map((d, i) => (
                        <Cell key={i} fill={ROLE_CFG[d.role]?.color || ROLE_COLORS[i % ROLE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <Box display="flex" flexWrap="wrap" gap={1} justifyContent="center">
                  {roleChartData.map((d, i) => (
                    <Box key={i} display="flex" alignItems="center" gap={0.5}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: ROLE_CFG[d.role]?.color || ROLE_COLORS[i] }} />
                      <Typography variant="caption" color="text.secondary">{d.name} ({d.value})</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Age distribution */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="body2" fontWeight={700} fontSize="0.85rem" mb={0.5}>
                  Age Distribution
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                  {analytics.withRegionCount < analytics.total
                    ? `${analytics.total - (analytics.ageData?.find(a => a.range === "N/A")?.count || 0)} of ${analytics.total} have DOB set`
                    : ""}
                </Typography>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={analytics.ageData?.filter(a => a.range !== "N/A")} margin={{ left: -20, right: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                    <XAxis dataKey="range" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <ReTooltip content={<CustomTooltip />} cursor={{ fill: "rgba(211,47,47,0.06)" }} />
                    <Bar dataKey="count" name="Members" radius={[4, 4, 0, 0]}>
                      {analytics.ageData?.filter(a => a.range !== "N/A").map((_, i) => (
                        <Cell key={i} fill={AGE_COLORS[i % AGE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Region distribution */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="body2" fontWeight={700} fontSize="0.85rem" mb={1}>
                  Team by Region
                </Typography>
                {analytics.regionData?.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={150}>
                      <BarChart data={analytics.regionData.slice(0, 8)} layout="vertical"
                        margin={{ left: 60, right: 16, top: 4, bottom: 0 }}>
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="region" tick={{ fontSize: 9 }} width={60} axisLine={false} tickLine={false} />
                        <ReTooltip content={<CustomTooltip />} cursor={{ fill: "rgba(211,47,47,0.06)" }} />
                        <Bar dataKey="count" name="Members" fill="#D32F2F" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <Typography variant="caption" color="text.secondary" display="block" mt={1} textAlign="center">
                      {analytics.withRegionCount} of {analytics.total} have region set
                    </Typography>
                  </>
                ) : (
                  <Box display="flex" alignItems="center" justifyContent="center" height={160}>
                    <Typography variant="caption" color="text.secondary" textAlign="center">
                      No region data yet.<br />Add region when editing team members.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ── Members table ──────────────────────────────────────────────────── */}
      <Card>
        <Box px={2.5} pt={2} pb={1} display="flex" alignItems="center" gap={1}>
          <GroupsIcon sx={{ color: "#D32F2F", fontSize: "1.1rem" }} />
          <Typography variant="h6" fontWeight={700} fontSize="0.95rem">Members</Typography>
          <Chip
            label={filtersActive ? `${visibleMembers.length} / ${teamMembers.length}` : teamMembers.length}
            size="small" sx={{ bgcolor: "rgba(211,47,47,0.12)", color: "#D32F2F" }} />
        </Box>

        {/* Search & filter toolbar */}
        <Box px={2.5} pb={1.5} display="flex" gap={1.5} flexWrap="wrap" alignItems="center">
          <TextField
            size="small" placeholder="Search name, email, phone, region…"
            value={search} onChange={e => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 220 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Role</InputLabel>
            <Select label="Role" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <MenuItem value="all">All roles</MenuItem>
              {presentRoles.map(r => (
                <MenuItem key={r} value={r}>{ROLE_CFG[r]?.label || r}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <MenuItem value="all">All statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          {filtersActive && (
            <Button size="small" onClick={() => { setSearch(""); setRoleFilter("all"); setStatusFilter("all"); }}>
              Clear
            </Button>
          )}
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}><CircularProgress size={28} /></Box>
        ) : (
          <TableContainer>
            <Table size="small" sx={{ minWidth: 750 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Member</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Region</TableCell>
                  <TableCell>Age</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedMembers.map(u => {
                  const rc   = ROLE_CFG[u.role] || ROLE_CFG.driver;
                  const isSelf = u._id === currentUser?.id;
                  const age  = calcAge(u.dateOfBirth);
                  return (
                    <TableRow key={u._id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: avatarColor(u.name), color: "#fff", fontSize: "0.8rem", fontWeight: 800 }}>
                            {u.name?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {u.name}
                              {isSelf && <Chip label="You" size="small" sx={{ height: 16, fontSize: "0.6rem", ml: 0.5 }} />}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                            {u.uniqueId && (
                              <Typography variant="caption" sx={{ display: "block", fontWeight: 700, color: "primary.main", letterSpacing: 0.3 }}>
                                {u.uniqueId}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          {rolesArr(u).map((rid) => {
                            const c = ROLE_CFG[rid] || ROLE_CFG.driver;
                            return <Chip key={rid} label={c.label} size="small" sx={{ bgcolor: c.bg, color: c.color, fontWeight: 600 }} />;
                          })}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{u.region || "—"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{age != null ? `${age} yrs` : "—"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">{u.phone || "—"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={u.isActive ? "Active" : "Inactive"} size="small"
                          color={u.isActive ? "success" : "default"} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">{fmtDate(u.createdAt)}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={0.5} justifyContent="center">
                          <Tooltip title={u.isActive ? "Deactivate" : "Activate"}>
                            <Switch size="small" checked={u.isActive} disabled={isSelf}
                              onChange={() => handleToggle(u)} color="success" />
                          </Tooltip>
                          <Tooltip title="Edit profile">
                            <IconButton size="small" onClick={() => {
                              setEditDlg(u);
                              setEditForm({ name: u.name, phone: u.phone || "", region: u.region || "",
                                dateOfBirth: u.dateOfBirth ? new Date(u.dateOfBirth).toISOString().slice(0,10) : "" });
                              setEditError("");
                            }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {!isSelf && (
                            <Tooltip title={isDeveloper ? "Override role (technical)" : "Change role"}>
                              <IconButton size="small" onClick={() => { setRoleDlg(u); setNewRoles(rolesArr(u)); }}
                                sx={{ color: isDeveloper ? "warning.main" : "text.secondary" }}>
                                <Typography variant="caption" fontWeight={700} sx={{ fontSize: "0.6rem", letterSpacing: 0 }}>
                                  ROLE
                                </Typography>
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Reset password / resend code">
                            <IconButton size="small" onClick={() => resetPassword(u)} sx={{ color: "text.secondary" }}>
                              <VpnKeyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {!isSelf && (
                            <Tooltip title="Delete user">
                              <IconButton size="small" color="error" onClick={() => setDelDlg(u)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!visibleMembers.length && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5, color: "text.secondary" }}>
                      {filtersActive ? "No members match your filters" : "No team members found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePager page={memPage} count={memPages} onChange={setMemPage} total={memTotal} />
      </Card>

      {/* ── Add Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={addDlg} onClose={() => setAddDlg(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Team Member</DialogTitle>
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
            <TextField size="small" fullWidth label="Date of Birth" type="date" value={addForm.dateOfBirth}
              onChange={e => setAddForm(p => ({ ...p, dateOfBirth: e.target.value }))}
              InputLabelProps={{ shrink: true }} />
            <FormControl size="small" fullWidth>
              <InputLabel>Role *</InputLabel>
              <Select label="Role *" value={addForm.role} onChange={e => setAddForm(p => ({ ...p, role: e.target.value }))}>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="fleet_manager">Fleet Manager</MenuItem>
              </Select>
            </FormControl>
            <TextField size="small" fullWidth label="Password (blank = Fleet@1234)" type="password"
              value={addForm.password} onChange={e => setAddForm(p => ({ ...p, password: e.target.value }))} />
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

      {/* ── Edit Profile Dialog ─────────────────────────────────────────────── */}
      <Dialog open={Boolean(editDlg)} onClose={() => setEditDlg(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Profile — {editDlg?.name}</DialogTitle>
        <DialogContent>
          {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField size="small" fullWidth label="Full Name" value={editForm.name || ""}
              onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
            <TextField size="small" fullWidth label="Phone" value={editForm.phone || ""}
              onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
            <FormControl size="small" fullWidth>
              <InputLabel>Region</InputLabel>
              <Select label="Region" value={editForm.region || ""}
                onChange={e => setEditForm(p => ({ ...p, region: e.target.value }))}>
                <MenuItem value=""><em>— None —</em></MenuItem>
                {REGIONS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size="small" fullWidth label="Date of Birth" type="date" value={editForm.dateOfBirth || ""}
              onChange={e => setEditForm(p => ({ ...p, dateOfBirth: e.target.value }))}
              InputLabelProps={{ shrink: true }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDlg(null)} disabled={editSaving}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave} disabled={editSaving}
            startIcon={editSaving ? <CircularProgress size={14} color="inherit" /> : null}>
            {editSaving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Role Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={Boolean(roleDlg)} onClose={() => setRoleDlg(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {isDeveloper ? "Override Role" : "Change Role"} — {roleDlg?.name}
        </DialogTitle>
        <DialogContent>
          {isDeveloper && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Technical override — sets any role directly, bypassing the normal
              restrictions. Use with care.
            </Alert>
          )}
          <Box pt={1}>
            <FormControl fullWidth size="small">
              <InputLabel>Roles</InputLabel>
              <Select
                multiple
                label="Roles"
                value={newRoles}
                onChange={(e) => setNewRoles(typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value)}
                renderValue={(sel) => sel.map((r) => ROLE_CFG[r]?.label || r).join(", ")}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="fleet_manager">Fleet Manager</MenuItem>
                {isDeveloper && <MenuItem value="driver">Driver</MenuItem>}
                {isDeveloper && <MenuItem value="developer">Developer</MenuItem>}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              Select one or more roles. The first becomes the primary role.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDlg(null)} disabled={roleSaving}>Cancel</Button>
          <Button variant="contained" color={isDeveloper ? "warning" : "primary"} onClick={handleRoleSave}
            disabled={roleSaving || !newRoles.length}
            startIcon={roleSaving ? <CircularProgress size={14} color="inherit" /> : null}>
            {roleSaving ? "Saving…" : isDeveloper ? "Override Roles" : "Update Roles"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={Boolean(delDlg)} onClose={() => setDelDlg(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete User</DialogTitle>
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
