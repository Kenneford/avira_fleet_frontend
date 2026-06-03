import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useAuth } from "../../contexts/AuthContext";
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

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const { mode, toggleMode } = useThemeMode();
  const isDark = mode === "dark";

  // Light theme pinned permanently — form never changes when mode is toggled
  const lightTheme = useMemo(() => createFleetTheme("light"), []);

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      // const user = { role: "admin" };
      navigate(ROLE_REDIRECT[user.role] || "/");
    } catch (err) {
      console.log("Error: ", error);

      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className={styles.page} sx={{ bgcolor: "background.default" }}>
      <div className={styles.bgGrid} />
      <div className={styles.bgGlow} />

      {/* Theme toggle — top-right corner */}
      <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
        <IconButton
          onClick={toggleMode}
          size="small"
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 2,
            color: isDark ? "#aaa" : "#292929",
          }}
        >
          {isDark ? (
            <LightModeIcon fontSize="small" />
          ) : (
            <DarkModeIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>

      <Box className={styles.logoArea}>
        <span className={styles.logoIcon}>▲</span>
        <Box
          className={styles.logoText}
          sx={{ color: isDark ? "#f1f1f1" : "#292929" }}
        >
          AVIRA
          <span className={styles.logoSub}>FLEET MANAGEMENT</span>
        </Box>
      </Box>

      {/* ThemeProvider pinned to light — form looks identical in dark or light mode */}
      <ThemeProvider theme={lightTheme}>
        <Card className={styles.card}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={800} mb={0.5}>
              Sign In
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Enter your credentials to access the system
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit}
              display="flex"
              flexDirection="column"
              gap={2.5}
            >
              <CustomTextField
                fullWidth
                size="small"
                label="Email Address"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                sx={{
                  fontSize: ".8rem",
                  "& .MuiInputLabel-asterisk": {
                    color: form?.email ? "green" : "red",
                  },
                }}
              />
              <CustomTextField
                fullWidth
                size="small"
                label="Password"
                required
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                value={form.password}
                onChange={(e) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPwd((p) => !p)}
                        edge="end"
                        size="small"
                      >
                        {showPwd ? (
                          <VisibilityOffIcon fontSize="small" />
                        ) : (
                          <VisibilityIcon fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  fontSize: ".8rem",
                  "& .MuiInputLabel-asterisk": {
                    color: form?.password ? "green" : "red",
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                size="small"
                // color="primary"
                // size="large"
                fullWidth
                disabled={loading}
                startIcon={
                  loading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : null
                }
                sx={{
                  bgcolor: "#292929",
                  color: "#fff",
                  transition: ".5s ease",
                  textTransform: "capitalize",
                  // mt: 3,
                  height: "2.3rem",
                  "&:hover": {
                    bgcolor: "#383838",
                  },
                }}
              >
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </Box>

            <Box className={styles.demoHint}>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                mb={1}
              >
                Demo credentials:
              </Typography>
              {[
                {
                  role: "Admin",
                  email: "admin@aviratransport.com",
                  pwd: "111666",
                },
                {
                  role: "Fleet Manager",
                  email: "kwame@aviratransport.com",
                  pwd: "111666",
                },
                {
                  role: "Driver",
                  email: "kofi@aviratransport.com",
                  pwd: "111666",
                },
              ].map(({ role, email, pwd }) => (
                <Box
                  key={role}
                  className={styles.demoRow}
                  onClick={() => setForm({ email, password: pwd })}
                >
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{ color: "", minWidth: 95 }}
                  >
                    {role}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {email}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </ThemeProvider>
    </Box>
  );
}
