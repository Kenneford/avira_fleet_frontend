import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box, Card, CardContent, Typography, Button, Alert, InputAdornment,
  IconButton, CircularProgress, Tooltip, Link,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LockClockIcon from "@mui/icons-material/LockClock";
import ShieldIcon from "@mui/icons-material/Shield";
import { useAuth } from "../../contexts/AuthContext";
import { authAPI } from "../../api/client";
import { errorMessage } from "../../utils/helpers";
import styles from "./Login.module.scss";
import { CustomTextField } from "../../../muiStyling/muiStyling";
import { createFleetTheme } from "../../theme/fleetTheme";
import { useThemeMode } from "../../contexts/ThemeContext";

const ROLE_REDIRECT = {
  admin: "/admin/dashboard",
  fleet_manager: "/manager/dashboard",
  driver: "/driver/dashboard",
  developer: "/dev/dashboard",
};

const fmtCountdown = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function Login() {
  const { login, verifyTwoFactor, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate(ROLE_REDIRECT[user.role] || "/", { replace: true });
    }
  }, [authLoading, user, navigate]);

  const { mode, toggleMode } = useThemeMode();
  const isDark = mode === "dark";
  const lightTheme = useMemo(() => createFleetTheme("light"), []);

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);

  // 2FA step
  const [stage, setStage] = useState("login"); // 'login' | '2fa'
  const [challengeToken, setChallengeToken] = useState("");
  const [code, setCode] = useState("");
  const [info, setInfo] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // Lockout countdown
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const locked = remaining > 0;

  useEffect(() => {
    if (!cooldownUntil) return undefined;
    const tick = () => {
      const secs = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0) { setCooldownUntil(0); setError(""); }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked) return;
    setError(""); setWarning(""); setLoading(true);
    try {
      const data = await login(form.email, form.password);
      if (data?.twoFactorRequired) {
        setChallengeToken(data.challengeToken);
        setStage("2fa");
        setInfo("Enter the 6-digit code from your authenticator app.");
      } else {
        navigate(ROLE_REDIRECT[data.user.role] || "/");
      }
    } catch (err) {
      const data = err?.response?.data;
      if (data?.retryAfterSeconds) {
        setCooldownUntil(Date.now() + data.retryAfterSeconds * 1000);
        setError(data.message || "Too many attempts. Please wait and try again.");
      } else if (typeof data?.attemptsRemaining === "number") {
        setWarning(
          data.attemptsRemaining > 0
            ? `Incorrect email or password. ${data.attemptsRemaining} attempt${data.attemptsRemaining === 1 ? "" : "s"} remaining before this account is temporarily locked.`
            : "Incorrect email or password."
        );
      } else {
        setError(errorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2fa = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const u = await verifyTwoFactor(challengeToken, code.trim());
      navigate(ROLE_REDIRECT[u.role] || "/");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const sendEmailCode = async () => {
    setError(""); setSendingEmail(true);
    try {
      await authAPI.twoFactorEmailCode(challengeToken);
      setInfo("We've emailed you a sign-in code. Enter it above (it expires in 10 minutes).");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSendingEmail(false);
    }
  };

  const backToLogin = () => {
    setStage("login"); setCode(""); setChallengeToken(""); setError(""); setInfo("");
  };

  if (authLoading || user) {
    return (
      <ThemeProvider theme={lightTheme}>
        <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default" }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <Box className={styles.page} sx={{ bgcolor: "background.default" }}>
      <div className={styles.bgGrid} />
      <div className={styles.bgGlow} />

      <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
        <IconButton onClick={toggleMode} size="small"
          sx={{ position: "absolute", top: 16, right: 16, zIndex: 2, color: isDark ? "#aaa" : "#292929" }}>
          {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
        </IconButton>
      </Tooltip>

      <Box className={styles.logoArea}>
        <span className={styles.logoIcon}>▲</span>
        <Box className={styles.logoText} sx={{ color: isDark ? "#f1f1f1" : "#292929" }}>
          AVIRA<span className={styles.logoSub}>FLEET MANAGEMENT</span>
        </Box>
      </Box>

      <ThemeProvider theme={lightTheme}>
        <Card className={styles.card}>
          <CardContent sx={{ p: 4 }}>
            {stage === "login" ? (
              <>
                <Typography variant="h5" fontWeight={800} mb={0.5}>Sign In</Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Enter your credentials to access the system
                </Typography>

                {locked ? (
                  <Alert severity="error" icon={<LockClockIcon fontSize="inherit" />} sx={{ mb: 2 }}>
                    {error || "This account is temporarily locked."}
                    <Box component="span" sx={{ display: "block", fontWeight: 700, mt: 0.5 }}>
                      Try again in {fmtCountdown(remaining)}
                    </Box>
                  </Alert>
                ) : (
                  error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                )}
                {warning && !locked && <Alert severity="warning" sx={{ mb: 2 }}>{warning}</Alert>}

                <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2.5}>
                  <CustomTextField
                    fullWidth size="small" label="Email Address" type="email" required disabled={locked}
                    autoComplete="email" value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    sx={{ fontSize: ".8rem", "& .MuiInputLabel-asterisk": { color: form?.email ? "green" : "red" } }}
                  />
                  <CustomTextField
                    fullWidth size="small" label="Password" required disabled={locked}
                    type={showPwd ? "text" : "password"} autoComplete="current-password" value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPwd((p) => !p)} edge="end" size="small">
                            {showPwd ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ fontSize: ".8rem", "& .MuiInputLabel-asterisk": { color: form?.password ? "green" : "red" } }}
                  />

                  <Box sx={{ textAlign: "right", mt: -1 }}>
                    <Link component={RouterLink} to="/forgot-password" underline="hover"
                      sx={{ fontSize: ".8rem", color: "#292929" }}>
                      Forgot password?
                    </Link>
                  </Box>

                  <Button type="submit" variant="contained" size="small" fullWidth disabled={loading || locked}
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : locked ? <LockClockIcon fontSize="small" /> : null}
                    sx={{ bgcolor: "#292929", color: "#fff", transition: ".5s ease", textTransform: "capitalize", height: "2.3rem", "&:hover": { bgcolor: "#383838" } }}>
                    {locked ? `Locked — ${fmtCountdown(remaining)}` : loading ? "Signing in…" : "Sign In"}
                  </Button>
                </Box>

                <Box className={styles.demoHint}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>Demo credentials:</Typography>
                  {[
                    { role: "Admin", email: "admin@aviralife.test", pwd: "admin123" },
                    { role: "Fleet Manager", email: "manager@aviralife.test", pwd: "manager123" },
                    { role: "Driver", email: "driver@aviralife.test", pwd: "driver123" },
                  ].map(({ role, email, pwd }) => (
                    <Box key={role} className={styles.demoRow} onClick={() => setForm({ email, password: pwd })}>
                      <Typography variant="caption" fontWeight={700} sx={{ color: "", minWidth: 95 }}>{role}</Typography>
                      <Typography variant="caption" color="text.secondary">{email}</Typography>
                    </Box>
                  ))}
                </Box>
              </>
            ) : (
              <>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <ShieldIcon sx={{ color: "#dc2626" }} fontSize="small" />
                  <Typography variant="h5" fontWeight={800}>Two-factor</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Confirm it's you with a 6-digit code.
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {info && !error && <Alert severity="info" sx={{ mb: 2 }}>{info}</Alert>}

                <Box component="form" onSubmit={handleVerify2fa} display="flex" flexDirection="column" gap={2.5}>
                  <CustomTextField
                    fullWidth size="small" label="Authentication code" required autoFocus
                    inputProps={{ inputMode: "numeric", maxLength: 6, style: { letterSpacing: "0.4em", fontWeight: 700 } }}
                    value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                  <Button type="submit" variant="contained" size="small" fullWidth disabled={loading || code.length < 6}
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                    sx={{ bgcolor: "#292929", color: "#fff", textTransform: "capitalize", height: "2.3rem", "&:hover": { bgcolor: "#383838" } }}>
                    {loading ? "Verifying…" : "Verify & sign in"}
                  </Button>
                </Box>

                <Box display="flex" justifyContent="space-between" mt={2}>
                  <Link component="button" type="button" underline="hover" onClick={sendEmailCode}
                    sx={{ fontSize: ".8rem", color: "#292929" }} disabled={sendingEmail}>
                    {sendingEmail ? "Sending…" : "Email me a code instead"}
                  </Link>
                  <Link component="button" type="button" underline="hover" onClick={backToLogin}
                    sx={{ fontSize: ".8rem", color: "#777" }}>
                    Back
                  </Link>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </ThemeProvider>
    </Box>
  );
}
