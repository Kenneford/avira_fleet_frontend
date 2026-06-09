import { useState, useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box, Card, CardContent, Typography, Button, Alert, CircularProgress, Link,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { authAPI } from "../../api/client";
import { errorMessage } from "../../utils/helpers";
import styles from "./Login.module.scss";
import { CustomTextField } from "../../../muiStyling/muiStyling";
import { createFleetTheme } from "../../theme/fleetTheme";

export default function ForgotPassword() {
  const lightTheme = useMemo(() => createFleetTheme("light"), []);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim());
      setSent(true);
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
            <Typography variant="h5" fontWeight={800} mb={0.5}>Forgot password</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Enter your account email and we'll send you a reset link.
            </Typography>

            {sent ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                If an account exists for that email, a password reset link has been sent.
                Check your inbox (and spam). The link expires in 1 hour.
              </Alert>
            ) : (
              <>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2.5}>
                  <CustomTextField
                    fullWidth size="small" label="Email Address" type="email" required autoFocus
                    autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button type="submit" variant="contained" size="small" fullWidth disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                    sx={{ bgcolor: "#292929", color: "#fff", textTransform: "capitalize", height: "2.3rem", "&:hover": { bgcolor: "#383838" } }}>
                    {loading ? "Sending…" : "Send reset link"}
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
