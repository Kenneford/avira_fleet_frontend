import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useAuth } from "../../contexts/AuthContext";
import { errorMessage } from "../../utils/helpers";
import styles from "./Login.module.scss";

const ROLE_REDIRECT = {
  admin: "/admin/dashboard",
  fleet_manager: "/manager/dashboard",
  driver: "/driver/dashboard",
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

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
    <Box className={styles.page}>
      <div className={styles.bgGrid} />
      <div className={styles.bgGlow} />

      <Box className={styles.logoArea}>
        <span className={styles.logoIcon}>▲</span>
        <Box className={styles.logoText}>
          AVIRA
          <span className={styles.logoSub}>FLEET MANAGEMENT</span>
        </Box>
      </Box>

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
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
            />
            <TextField
              fullWidth
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
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={16} color="inherit" /> : null
              }
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
                  sx={{ color: "#C8A84B", minWidth: 95 }}
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
    </Box>
  );
}
