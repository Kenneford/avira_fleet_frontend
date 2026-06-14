import { useState, useMemo, useEffect, useRef } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box, Card, CardContent, Typography, Button, Alert, CircularProgress,
  TextField, Avatar, Link, Divider, IconButton, Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShieldIcon from "@mui/icons-material/Shield";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import { useAuth } from "../../contexts/AuthContext";
import { authAPI } from "../../api/client";
import { errorMessage, avatarColor } from "../../utils/helpers";

const ROLE_REDIRECT = {
  admin: "/admin/dashboard",
  fleet_manager: "/manager/dashboard",
  driver: "/driver/dashboard",
  developer: "/dev/dashboard",
};

const toDateInput = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
};

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const backTo = useMemo(() => ROLE_REDIRECT[user?.role] || "/", [user]);
  const fileRef = useRef(null);

  const [form, setForm] = useState({ name: "", email: "", phone: "", region: "", dateOfBirth: "", avatarUrl: "" });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      region: user.region || "",
      dateOfBirth: toDateInput(user.dateOfBirth),
      avatarUrl: user.avatarUrl || "",
    });
  }, [user]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const onPickFile = () => fileRef.current?.click();

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    if (file.size > 8 * 1024 * 1024) { setError("Image must be 8 MB or smaller."); return; }
    setError(""); setOk(""); setUploading(true);
    try {
      const data = await authAPI.uploadImage(file);
      setForm((p) => ({ ...p, avatarUrl: data.url }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setOk("");
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (!form.email.trim()) { setError("Email is required."); return; }
    setBusy(true);
    try {
      await updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
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
            {/* Avatar + upload */}
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Box sx={{ position: "relative" }}>
                <Avatar
                  src={form.avatarUrl || undefined}
                  sx={{ width: 72, height: 72, bgcolor: avatarColor(user?.name), color: "#fff", fontWeight: 800, fontSize: "1.6rem" }}
                >
                  {user?.name?.charAt(0)}
                </Avatar>
                <IconButton
                  size="small"
                  onClick={onPickFile}
                  disabled={uploading}
                  sx={{
                    position: "absolute", bottom: -4, right: -4,
                    bgcolor: "primary.main", color: "#fff",
                    "&:hover": { bgcolor: "primary.dark" }, width: 28, height: 28,
                  }}
                >
                  {uploading ? <CircularProgress size={14} color="inherit" /> : <PhotoCameraIcon sx={{ fontSize: 16 }} />}
                </IconButton>
              </Box>
              <Box>
                <Button variant="outlined" size="small" onClick={onPickFile} disabled={uploading}>
                  {uploading ? "Uploading…" : "Change photo"}
                </Button>
                <Typography variant="caption" display="block" color="text.secondary" mt={0.5}>
                  JPG, PNG or WebP, up to 8 MB.
                </Typography>
                {user?.uniqueId && (
                  <Chip size="small" label={`ID: ${user.uniqueId}`} sx={{ mt: 1, fontWeight: 700, color: "primary.main" }} />
                )}
              </Box>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFileChange} />
            </Box>

            <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2.5}>
              <TextField size="small" label="Full name" required value={form.name} onChange={set("name")} fullWidth />
              <TextField size="small" label="Email" type="email" required value={form.email} onChange={set("email")} fullWidth />
              <TextField size="small" label="Phone" value={form.phone} onChange={set("phone")} fullWidth />
              <TextField size="small" label="Region" value={form.region} onChange={set("region")} fullWidth />
              <TextField size="small" label="Date of birth" type="date" value={form.dateOfBirth}
                onChange={set("dateOfBirth")} fullWidth InputLabelProps={{ shrink: true }} />
              <Box>
                <Button type="submit" variant="contained" color="error" disabled={busy || uploading}
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
