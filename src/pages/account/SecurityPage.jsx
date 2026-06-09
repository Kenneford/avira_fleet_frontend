import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Card, CardContent, Typography, Button, Alert, CircularProgress,
  TextField, Chip, Divider,
} from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { authAPI } from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";
import { errorMessage } from "../../utils/helpers";

const ROLE_REDIRECT = {
  admin: "/admin/dashboard",
  fleet_manager: "/manager/dashboard",
  driver: "/driver/dashboard",
  developer: "/dev/dashboard",
};

export default function SecurityPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const enabled = !!user?.twoFactorEnabled;

  const [setup, setSetup] = useState(null); // { secret, otpauth }
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [disableValue, setDisableValue] = useState("");
  const canvasRef = useRef(null);

  const backTo = useMemo(() => ROLE_REDIRECT[user?.role] || "/", [user]);

  // Render the QR for the otpauth URI. Tries a CDN qrcode lib; if that's
  // unavailable the secret below can always be typed in manually.
  useEffect(() => {
    if (!setup?.otpauth || !canvasRef.current) return;
    let cancelled = false;
    import(/* @vite-ignore */ "https://esm.sh/qrcode@1.5.3")
      .then((QR) => {
        if (cancelled) return;
        (QR.toCanvas || QR.default?.toCanvas)(canvasRef.current, setup.otpauth, { width: 200, margin: 1 }, () => {});
      })
      .catch(() => { /* fall back to manual entry (secret shown below) */ });
    return () => { cancelled = true; };
  }, [setup]);

  const startSetup = async () => {
    setError(""); setOk(""); setBusy(true);
    try {
      const data = await authAPI.twoFactorSetup();
      setSetup(data);
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  };

  const confirmEnable = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      await authAPI.twoFactorEnable(code.trim());
      await refreshUser();
      setSetup(null); setCode("");
      setOk("Two-factor authentication is now enabled. You'll be asked for a code at each sign-in.");
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  };

  const disable = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const v = disableValue.trim();
      // Accept either a 6-digit code or the account password.
      const body = /^\d{6}$/.test(v) ? { code: v } : { password: v };
      await authAPI.twoFactorDisable(body);
      await refreshUser();
      setDisableValue("");
      setOk("Two-factor authentication has been disabled.");
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 560, mx: "auto" }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(backTo)} sx={{ mb: 2 }} size="small">
          Back to dashboard
        </Button>

        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
          <ShieldIcon sx={{ color: "#dc2626" }} />
          <Typography variant="h5" fontWeight={800}>Security</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Two-factor authentication (2FA) adds a second step at sign-in using an
          authenticator app — or a code emailed to you as a backup.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        {ok && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setOk("")}>{ok}</Alert>}

        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="h6" fontWeight={700} fontSize="1rem">Two-factor authentication</Typography>
              <Chip
                label={enabled ? "Enabled" : "Disabled"}
                color={enabled ? "success" : "default"}
                size="small" sx={{ fontWeight: 700 }}
              />
            </Box>

            {!enabled && !setup && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Protect your account with an authenticator app (Google Authenticator, Authy, 1Password, …).
                  It will appear as <b>Avira Fleet</b>.
                </Typography>
                <Button variant="contained" color="error" onClick={startSetup} disabled={busy}
                  startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <ShieldIcon />}>
                  Set up 2FA
                </Button>
              </>
            )}

            {!enabled && setup && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1.5 }}>
                  1. Scan this QR code with your authenticator app:
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "center", my: 1 }}>
                  <canvas ref={canvasRef} width={200} height={200} style={{ background: "#fff", borderRadius: 8 }} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Can't scan? Enter this key manually (issuer <b>Avira Fleet</b>):
                </Typography>
                <Box sx={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, letterSpacing: 1,
                  bgcolor: "rgba(0,0,0,0.05)", p: 1, borderRadius: 1, wordBreak: "break-all", mb: 2 }}>
                  {setup.secret}
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" sx={{ mb: 1.5 }}>
                  2. Enter the 6-digit code from the app to confirm:
                </Typography>
                <Box component="form" onSubmit={confirmEnable} display="flex" gap={1.5} alignItems="center">
                  <TextField
                    size="small" label="6-digit code" required
                    inputProps={{ inputMode: "numeric", maxLength: 6, style: { letterSpacing: "0.3em", fontWeight: 700 } }}
                    value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                  <Button type="submit" variant="contained" color="error" disabled={busy || code.length < 6}>
                    {busy ? "Verifying…" : "Confirm & enable"}
                  </Button>
                </Box>
              </Box>
            )}

            {enabled && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  2FA is protecting your account. To turn it off, enter a current
                  authenticator code or your account password.
                </Typography>
                <Box component="form" onSubmit={disable} display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
                  <TextField
                    size="small" type="password" label="Code or password" required
                    value={disableValue} onChange={(e) => setDisableValue(e.target.value)} sx={{ minWidth: 220 }}
                  />
                  <Button type="submit" variant="outlined" color="error" disabled={busy || !disableValue}>
                    {busy ? "Working…" : "Disable 2FA"}
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
