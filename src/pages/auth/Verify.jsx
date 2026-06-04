import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box, Card, CardContent, Typography, Button, Alert, CircularProgress,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { useAuth } from "../../contexts/AuthContext";
import { authAPI } from "../../api/client";
import { errorMessage } from "../../utils/helpers";
import styles from "./Login.module.scss";
import { CustomTextField } from "../../../muiStyling/muiStyling";
import { createFleetTheme } from "../../theme/fleetTheme";

const ROLE_REDIRECT = {
  admin: "/admin/dashboard",
  fleet_manager: "/manager/dashboard",
  driver: "/driver/dashboard",
  developer: "/dev/dashboard",
};

export default function Verify() {
  const { verify } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const lightTheme = useMemo(() => createFleetTheme("light"), []);

  const [info, setInfo] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Validate the link + fetch who it's for.
  useEffect(() => {
    if (!token) { setError("This verification link is missing its token."); setChecking(false); return; }
    authAPI
      .verifyInfo(token)
      .then(({ data }) => setInfo(data))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setChecking(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await verify(token, code.trim());
      navigate(ROLE_REDIRECT[user.role] || "/");
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
        <Box className={styles.logoText} sx={{ color: "#f1f1f1" }}>
          AVIRA<span className={styles.logoSub}>FLEET MANAGEMENT</span>
        </Box>
      </Box>

      <ThemeProvider theme={lightTheme}>
        <Card className={styles.card}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={800} mb={0.5}>
              Activate Your Account
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {info
                ? `Welcome, ${info.name}. Enter the verification code from your email to log in.`
                : "Enter the verification code from your email to log in."}
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {checking ? (
              <Box display="flex" justifyContent="center" p={3}><CircularProgress size={24} /></Box>
            ) : (
              <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2.5}>
                <CustomTextField
                  fullWidth size="small" label="Verification Code" required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={!info}
                  autoFocus
                  sx={{ fontSize: ".8rem" }}
                />
                <Button
                  type="submit" variant="contained" size="small" fullWidth
                  disabled={loading || !info}
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                  sx={{ bgcolor: "#292929", color: "#fff", textTransform: "capitalize", height: "2.3rem", "&:hover": { bgcolor: "#383838" } }}
                >
                  {loading ? "Verifying…" : "Verify & Log In"}
                </Button>
              </Box>
            )}

            <Typography variant="caption" color="text.secondary" display="block" mt={2}>
              After logging in you'll be prompted to set a new password.
            </Typography>
          </CardContent>
        </Card>
      </ThemeProvider>
    </Box>
  );
}
