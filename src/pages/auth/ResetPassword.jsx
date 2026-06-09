import { useState, useMemo } from "react";
import { Link as RouterLink, useSearchParams, useNavigate } from "react-router-dom";
import {
  Box, Card, CardContent, Typography, Button, Alert, CircularProgress, Link,
  InputAdornment, IconButton,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { ThemeProvider } from "@mui/material/styles";
import { authAPI } from "../../api/client";
import { errorMessage } from "../../utils/helpers";
import styles from "./Login.module.scss";
import { CustomTextField } from "../../../muiStyling/muiStyling";
import { createFleetTheme } from "../../theme/fleetTheme";

export default function ResetPassword() {
  const lightTheme = useMemo(() => createFleetTheme("light"), []);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";

  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (pwd.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (pwd !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await authAPI.resetPassword(token, pwd);
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className={styles.page} sx={{ bgcolor: "background.default" }}>
      <div className={styles.bgGrid} />
      <div className={styles.bgGlow} />
      <Box className={styles.logoArea}>
        <span className={styles.logoIcon}>▲</span>
        <Box className={styles.logoText}>AVIRA<span className={styles.logoSub}>FLEET MANAGEMENT</span></Box>
      </Box>

      <ThemeProvider theme={lightTheme}>
        <Card className={styles.card}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={800} mb={0.5}>Set a new password</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Choose a strong password you haven't used before.
            </Typography>

            {!token ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                This reset link is missing its token. Please use the link from your email, or request a new one.
              </Alert>
            ) : done ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                Your password has been reset. Redirecting you to sign in…
              </Alert>
            ) : (
              <>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2.5}>
                  <CustomTextField
                    fullWidth size="small" label="New password" required autoFocus
                    type={showPwd ? "text" : "password"} value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPwd((p) => !p)} edge="end" size="small">
                            {showPwd ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <CustomTextField
                    fullWidth size="small" label="Confirm new password" required
                    type={showPwd ? "text" : "password"} value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                  <Button type="submit" variant="contained" size="small" fullWidth disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                    sx={{ bgcolor: "#292929", color: "#fff", textTransform: "capitalize", height: "2.3rem", "&:hover": { bgcolor: "#383838" } }}>
                    {loading ? "Saving…" : "Reset password"}
                  </Button>
                </Box>
              </>
            )}

            <Box mt={2.5} textAlign="center">
              <Link component={RouterLink} to="/login" underline="hover" sx={{ fontSize: ".85rem", color: "#292929" }}>
                Back to sign in
              </Link>
            </Box>
          </CardContent>
        </Card>
      </ThemeProvider>
    </Box>
  );
}
