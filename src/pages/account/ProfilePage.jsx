import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box, Card, CardContent, Typography, Button, Alert, CircularProgress,
  TextField, Avatar, Link, Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShieldIcon from "@mui/icons-material/Shield";
import { useAuth } from "../../contexts/AuthContext";
import { errorMessage, avatarColor } from "../../utils/helpers";

const ROLE_REDIRECT = {
  admin: "/admin/dashboard",
  fleet_manager: "/manager/dashboard",
  driver: "/driver/dashboard",
  developer: "/dev/dashboard",
};

// yyyy-mm-dd for <input type="date">
const toDateInput = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
};

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const backTo = useMemo(() => ROLE_REDIRECT[user?.role] || "/", [user]);

  const [form, setForm] = useState({ name: "", phone: "", region: "", dateOfBirth: "", avatarUrl: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  // Seed the form from the current user (and re-seed if it loads late).
  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || "",
      phone: user.phone || "",
      region: user.region || "",
      dateOfBirth: toDateInput(user.dateOfBirth),
      avatarUrl: user.avatarUrl || "",
    });
  }, [user]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setOk("");
    if (!form.name.trim()) { setError("Name is required."); return; }
    setBusy(true);
    try {
      await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        region: form.region.trim(),
        dateOfBirth: form.dateOfBirth || null,
        avatarUrl: form.avatarUrl.trim(),
      });
      setOk("Your profile has been updated.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 560, mx: "auto" }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(backTo)} sx={{ mb: 2 }} size="small">
          Back to dashboard
        </Button>

        <Typography variant="h5" fontWeight={800} mb={0.5}>My profile</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Update your personal details.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        {ok && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setOk("")}>{ok}</Alert>}

        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: avatarColor(user?.name), color: "#fff", fontWeight: 800 }}>
                {user?.name?.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="body1" fontWeight={700}>{user?.email}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.role?.replace("_", " ")}
                </Typography>
              </Box>
            </Box>

            <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2.5}>
              <TextField size="small" label="Full name" required value={form.name} onChange={set("name")} fullWidth />
              <TextField size="small" label="Email" value={user?.email || ""} fullWidth disabled
                helperText="Email can't be changed here — ask an administrator." />
              <TextField size="small" label="Phone" value={form.phone} onChange={set("phone")} fullWidth />
              <TextField size="small" label="Region" value={form.region} onChange={set("region")} fullWidth />
              <TextField size="small" label="Date of birth" type="date" value={form.dateOfBirth}
                onChange={set("dateOfBirth")} fullWidth InputLabelProps={{ shrink: true }} />
              <TextField size="small" label="Avatar image URL" value={form.avatarUrl} onChange={set("avatarUrl")}
                fullWidth placeholder="https://…" />
              <Box>
                <Button type="submit" variant="contained" color="error" disabled={busy}
                  startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}>
                  {busy ? "Saving…" : "Save changes"}
                </Button>
              </Box>
            </Box>

            <Divider sx={{ my: 2.5 }} />
            <Box display="flex" alignItems="center" gap={1}>
              <ShieldIcon fontSize="small" sx={{ color: "#dc2626" }} />
              <Link component={RouterLink} to="/security" underline="hover">
                Security & two-factor authentication
              </Link>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
