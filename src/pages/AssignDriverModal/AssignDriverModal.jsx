import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import BadgeIcon from "@mui/icons-material/Badge";
import { driverAPI, vehicleAPI } from "../../api/client";
import { formatDate, errorMessage } from "../../utils/helpers";
import styles from "./AssignDriverModal.module.scss";

export default function AssignDriverModal({
  open,
  vehicle,
  onClose,
  onSuccess,
}) {
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const currentDriver = vehicle?.currentDriver;

  const loadDrivers = useCallback(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    driverAPI
      .list({ status: "active", limit: 100 })
      .then(({ data }) => setDrivers(data.data))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (open) {
      setSearch("");
      setSelected(null);
      setError("");
      loadDrivers();
    }
  }, [open, loadDrivers]);

  const filtered = drivers.filter((d) => {
    const term = search.toLowerCase();
    return (
      d.user?.name?.toLowerCase().includes(term) ||
      d.user?.email?.toLowerCase().includes(term) ||
      d.licenseNumber?.toLowerCase().includes(term)
    );
  });

  const handleAssign = async () => {
    setSaving(true);
    setError("");
    try {
      await vehicleAPI.assign(vehicle._id, { driverUserId: selected.user._id });
      onSuccess(
        `${selected.user.name} assigned to ${vehicle.registrationNumber}`,
      );
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async () => {
    setSaving(true);
    setError("");
    try {
      await vehicleAPI.assign(vehicle._id, { driverUserId: null });
      onSuccess(`Driver unassigned from ${vehicle.registrationNumber}`);
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const licDays = (d) =>
    d.licenseDaysLeft ??
    Math.round((new Date(d.licenseExpiry) - new Date()) / 86400000);

  const licColor = (days) =>
    days < 0 ? "error" : days <= 30 ? "warning" : "success";

  if (!vehicle) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: styles.paper }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Assign Driver
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {vehicle.registrationNumber} — {vehicle.make} {vehicle.model}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ color: "text.secondary" }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0 }}>
        {/* Current assignment */}
        <Box className={styles.currentBanner}>
          <DirectionsBusIcon
            sx={{ fontSize: "1rem", color: "text.secondary", flexShrink: 0 }}
          />
          <Box flex={1} minWidth={0}>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Currently assigned
            </Typography>
            {currentDriver ? (
              <Box display="flex" alignItems="center" gap={1} mt={0.25}>
                <Avatar
                  sx={{
                    width: 22,
                    height: 22,
                    bgcolor: "#D32F2F",
                    color: "#fff",
                    fontSize: "0.65rem",
                    fontWeight: 800,
                  }}
                >
                  {currentDriver.name?.charAt(0)}
                </Avatar>
                <Typography variant="body2" fontWeight={600}>
                  {currentDriver.name}
                </Typography>
                <Chip label="assigned" color="info" size="small" />
              </Box>
            ) : (
              <Typography variant="body2" color="text.disabled">
                No driver assigned
              </Typography>
            )}
          </Box>
          {currentDriver && (
            <Button
              size="small"
              color="error"
              variant="outlined"
              startIcon={<PersonOffIcon fontSize="small" />}
              onClick={handleUnassign}
              disabled={saving}
              sx={{ flexShrink: 0, fontSize: "0.72rem" }}
            >
              Unassign
            </Button>
          )}
        </Box>

        <Divider />

        {/* Search */}
        <Box px={2.5} pt={2} pb={1.5}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name, email or license number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    fontSize="small"
                    sx={{ color: "text.secondary" }}
                  />
                </InputAdornment>
              ),
              endAdornment: search && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch("")}>
                    <CloseIcon sx={{ fontSize: "0.9rem" }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.75, display: "block" }}
          >
            {loading
              ? "Loading drivers…"
              : `${filtered.length} active driver${filtered.length !== 1 ? "s" : ""}`}
          </Typography>
        </Box>

        {error && (
          <Box px={2.5} pb={1.5}>
            <Alert severity="error" onClose={() => setError("")}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Driver list */}
        <Box className={styles.listContainer}>
          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              py={5}
            >
              <CircularProgress size={28} />
            </Box>
          ) : !filtered.length ? (
            <Box textAlign="center" py={5}>
              <Typography color="text.secondary">
                {search
                  ? `No drivers match "${search}"`
                  : "No active drivers available"}
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {filtered.map((d, i) => {
                const days = licDays(d);
                const isSelected = selected?._id === d._id;
                const isCurrent =
                  currentDriver && d.user?._id === currentDriver._id;
                const hasVehicle = d.assignedVehicle && !isCurrent;
                const licExpired = days < 0;

                return (
                  <ListItem
                    key={d._id}
                    disablePadding
                    divider={i < filtered.length - 1}
                    className={[
                      styles.driverItem,
                      isSelected ? styles.selected : "",
                      isCurrent ? styles.current : "",
                    ].join(" ")}
                  >
                    <ListItemButton
                      onClick={() =>
                        !isCurrent && setSelected(isSelected ? null : d)
                      }
                      disabled={isCurrent}
                      sx={{ px: 2.5, py: 1.5, gap: 1.5 }}
                    >
                      <ListItemAvatar sx={{ minWidth: 44 }}>
                        <Avatar
                          sx={{
                            width: 38,
                            height: 38,
                            bgcolor: isSelected ? "#D32F2F" : "#2A2A2A",
                            color: isSelected ? "#fff" : "#888",
                            fontWeight: 800,
                            fontSize: "0.85rem",
                            border: isSelected
                              ? "2px solid #D32F2F"
                              : "2px solid transparent",
                            transition: "all 0.15s",
                          }}
                        >
                          {d.user?.name?.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>

                      <ListItemText
                        disableTypography
                        primary={
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            flexWrap="wrap"
                          >
                            <Typography variant="body2" fontWeight={600}>
                              {d.user?.name}
                            </Typography>
                            {isCurrent && (
                              <Chip label="current" color="info" size="small" />
                            )}
                            {licExpired && (
                              <Chip
                                label="License expired"
                                color="error"
                                size="small"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box display="flex" gap={2} flexWrap="wrap" mt={0.3}>
                            <Box display="flex" alignItems="center" gap={0.4}>
                              <BadgeIcon
                                sx={{
                                  fontSize: "0.75rem",
                                  color: "text.secondary",
                                }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {d.licenseNumber}
                              </Typography>
                            </Box>
                            <Typography
                              variant="caption"
                              color={`${licColor(days)}.main`}
                              fontWeight={days <= 30 ? 600 : 400}
                            >
                              {days < 0
                                ? `Expired ${Math.abs(days)}d ago`
                                : `License: ${days}d left`}
                            </Typography>
                            {hasVehicle && (
                              <Box display="flex" alignItems="center" gap={0.4}>
                                <DirectionsBusIcon
                                  sx={{
                                    fontSize: "0.75rem",
                                    color: "warning.main",
                                  }}
                                />
                                <Typography
                                  variant="caption"
                                  color="warning.main"
                                >
                                  On {d.assignedVehicle.registrationNumber}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        }
                      />

                      {isSelected && (
                        <CheckCircleIcon
                          sx={{
                            color: "primary.main",
                            fontSize: "1.25rem",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 2.5, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={!selected || saving}
          onClick={handleAssign}
          startIcon={
            saving ? <CircularProgress size={14} color="inherit" /> : null
          }
          sx={{ minWidth: 140 }}
        >
          {saving
            ? "Assigning…"
            : selected
              ? `Assign ${selected.user?.name?.split(" ")[0]}`
              : "Select a Driver"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
