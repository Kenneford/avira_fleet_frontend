import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { vehicleAPI } from "../../api/client";
import { errorMessage } from "../../utils/helpers";

const VEHICLE_TYPES = [
  { value: "executive_coach", label: "Executive Coach" },
  { value: "midi_coach", label: "Midi Coach" },
  { value: "minibus", label: "Minibus" },
  { value: "vip_coach", label: "VIP Coach" },
  { value: "school_bus", label: "School Bus" },
  { value: "sprinter_van", label: "Sprinter Van" },
  { value: "4x4", label: "4x4" },
  { value: "other", label: "Other" },
];

const FUEL_TYPES = ["diesel", "petrol", "electric", "hybrid"];
const BLANK = {
  registrationNumber: "",
  make: "",
  model: "",
  year: new Date().getFullYear(),
  vehicleType: "",
  capacity: "",
  color: "",
  chassisNumber: "",
  engineNumber: "",
  fuelType: "diesel",
  insuranceProvider: "",
  insuranceNumber: "",
  insuranceExpiry: "",
  roadworthinessExpiry: "",
  licenseExpiry: "",
  notes: "",
};

export default function VehicleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const base = pathname.startsWith("/manager") ? "/manager" : "/admin";
  const isEdit = Boolean(id);

  const [form, setForm] = useState(BLANK);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    vehicleAPI
      .get(id)
      .then(({ data }) => {
        const d = data;
        setForm({
          registrationNumber: d.registrationNumber || "",
          make: d.make || "",
          model: d.model || "",
          year: d.year || "",
          vehicleType: d.vehicleType || "",
          capacity: d.capacity || "",
          color: d.color || "",
          chassisNumber: d.chassisNumber || "",
          engineNumber: d.engineNumber || "",
          fuelType: d.fuelType || "diesel",
          insuranceProvider: d.insuranceProvider || "",
          insuranceNumber: d.insuranceNumber || "",
          insuranceExpiry: d.insuranceExpiry?.slice(0, 10) || "",
          roadworthinessExpiry: d.roadworthinessExpiry?.slice(0, 10) || "",
          licenseExpiry: d.licenseExpiry?.slice(0, 10) || "",
          notes: d.notes || "",
        });
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await vehicleAPI.update(id, form);
        setSuccess("Vehicle updated successfully");
      } else {
        await vehicleAPI.create(form);
        setSuccess("Vehicle registered successfully");
        setTimeout(() => navigate(`${base}/vehicles`), 1200);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <Box display="flex" justifyContent="center" p={6}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1.5} mb={3}>
        {/* <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          size="small"
        >
          Back
        </Button> */}
        <Box>
          <Typography variant="overline" display="block">
            Fleet
          </Typography>
          <Typography variant="h4" fontWeight={800}>
            {isEdit ? "Edit Vehicle" : "Register Vehicle"}
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Card sx={{ mb: 2.5 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h6"
              fontSize="0.9rem"
              fontWeight={700}
              mb={2.5}
            >
              Vehicle Details
            </Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  required
                  label="Registration Number"
                  value={form.registrationNumber}
                  onChange={set("registrationNumber")}
                  disabled={isEdit}
                  inputProps={{ style: { textTransform: "uppercase" } }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  required
                  label="Make"
                  value={form.make}
                  onChange={set("make")}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  required
                  label="Model"
                  value={form.model}
                  onChange={set("model")}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  required
                  label="Year"
                  type="number"
                  value={form.year}
                  onChange={set("year")}
                  inputProps={{ min: 1990, max: new Date().getFullYear() + 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Vehicle Type"
                  value={form.vehicleType}
                  onChange={set("vehicleType")}
                >
                  {VEHICLE_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  required
                  label="Capacity (seats)"
                  type="number"
                  value={form.capacity}
                  onChange={set("capacity")}
                  inputProps={{ min: 1, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  select
                  label="Fuel Type"
                  value={form.fuelType}
                  onChange={set("fuelType")}
                >
                  {FUEL_TYPES.map((f) => (
                    <MenuItem key={f} value={f}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Color"
                  value={form.color}
                  onChange={set("color")}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Chassis Number"
                  value={form.chassisNumber}
                  onChange={set("chassisNumber")}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Engine Number"
                  value={form.engineNumber}
                  onChange={set("engineNumber")}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 2.5 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h6"
              fontSize="0.9rem"
              fontWeight={700}
              mb={2.5}
            >
              Insurance & Compliance
            </Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Insurance Provider"
                  value={form.insuranceProvider}
                  onChange={set("insuranceProvider")}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Insurance Policy Number"
                  value={form.insuranceNumber}
                  onChange={set("insuranceNumber")}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Insurance Expiry Date"
                  type="date"
                  value={form.insuranceExpiry}
                  onChange={set("insuranceExpiry")}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Roadworthiness Expiry"
                  type="date"
                  value={form.roadworthinessExpiry}
                  onChange={set("roadworthinessExpiry")}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Road License Expiry"
                  type="date"
                  value={form.licenseExpiry}
                  onChange={set("licenseExpiry")}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes"
                  value={form.notes}
                  onChange={set("notes")}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box display="flex" gap={1.5}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={saving}
            size="large"
          >
            {saving ? (
              <CircularProgress size={18} />
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Register Vehicle"
            )}
          </Button>
          <Button onClick={() => navigate(-1)} size="large">
            Cancel
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
