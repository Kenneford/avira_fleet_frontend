// Gentle, dismissible prompt encouraging users without 2FA to set it up.
// Shows only after login, never on auth/security routes, and disappears once
// the user enables 2FA or dismisses it (dismissal persists on their account).
import { useState } from "react";
import { useLocation, Link as RouterLink } from "react-router-dom";
import { Box, Button, IconButton, Typography } from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../api/client";

const HIDE_PREFIXES = ["/login", "/verify", "/reset", "/forgot", "/activate", "/security"];

export default function TwoFactorNudge() {
  const { user, refreshUser } = useAuth();
  const { pathname } = useLocation();
  const [busy, setBusy] = useState(false);

  const hidden =
    !user ||
    user.twoFactorEnabled ||
    user.twoFactorPromptDismissed ||
    HIDE_PREFIXES.some((p) => pathname.startsWith(p));

  if (hidden) return null;

  const dismiss = async () => {
    setBusy(true);
    try { await authAPI.twoFactorDismissPrompt(); await refreshUser(); }
    catch { /* ignore */ }
    finally { setBusy(false); }
  };

  return (
    <Box
      sx={{
        position: "fixed", left: 16, right: 16, bottom: 16, zIndex: 1300,
        mx: "auto", maxWidth: 560,
        display: "flex", alignItems: "center", gap: 1.5,
        bgcolor: "#1f1f29", color: "#fff",
        border: "1px solid rgba(255,255,255,0.12)", borderRadius: 2,
        px: 2, py: 1.5, boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
      }}
    >
      <ShieldIcon sx={{ color: "#dc2626" }} />
      <Box flex={1} minWidth={0}>
        <Typography variant="body2" fontWeight={700}>Secure your account with 2FA</Typography>
        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
          Add a second sign-in step using an authenticator app.
        </Typography>
      </Box>
      <Button component={RouterLink} to="/security" size="small" variant="contained" color="error"
        sx={{ flexShrink: 0 }}>
        Set up
      </Button>
      <IconButton size="small" onClick={dismiss} disabled={busy} sx={{ color: "rgba(255,255,255,0.7)" }} aria-label="Dismiss">
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
