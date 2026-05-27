import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { driverAPI } from "../../api/client";
import { errorMessage } from "../../utils/helpers";

const BLANK = {
  name: "",
  email: "",
  phone: "",
  password: "",
  license_number: "",
  license_class: "Class C",
  license_expiry: "",
  license_issue_date: "",
  date_of_birth: "",
  address: "",
  years_experience: 0,
  hire_date: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  status: "active",
  notes: "",
};

export default function DriverForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(BLANK);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    driverAPI
      .get(id)
      .then(({ data }) => {
        console.log("Driver Details: ", data);
        setForm({
          name: data?.user?.name || "",
          email: data?.user?.email || "",
          phone: data?.user?.phone || "",
          password: "",
          license_number: data?.licenseNumber || "",
          license_class: data?.licenseClass || "Class C",
          license_expiry: data?.licenseExpiry?.slice(0, 10) || "",
          license_issue_date: data?.licenseIssueDate?.slice(0, 10) || "",
          date_of_birth: data?.dateOfBirth?.slice(0, 10) || "",
          address: data?.address || "",
          years_experience: data.yearsExperience || 0,
          hire_date: data.hireDate?.slice(0, 10) || "",
          emergency_contact_name: data.emergencyContactName || "",
          emergency_contact_phone: data.emergencyContactPhone || "",
          status: data.status || "active",
          notes: data.notes || "",
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
        await driverAPI.update(id, form);
        setSuccess("Driver updated successfully");
      } else {
        const { data } = await driverAPI.create(form);
        setSuccess(
          data.defaultPassword
            ? `Driver created. Default password: ${data.defaultPassword}`
            : "Driver created successfully",
        );
        setTimeout(() => navigate("/admin/drivers"), 1800);
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
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          size="small"
        >
          Back
        </Button>
        <Box>
          <Typography variant="overline" display="block">
            Personnel
          </Typography>
          <Typography variant="h4" fontWeight={800}>
            {isEdit ? "Edit Driver" : "Add Driver"}
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} icon={false}>
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
              Personal Information
            </Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Full Name"
                  value={form.name}
                  onChange={set("name")}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  disabled={isEdit}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={form.phone}
                  onChange={set("phone")}
                />
              </Grid>
              {!isEdit && (
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Password (leave blank for default)"
                    type="password"
                    value={form.password}
                    onChange={set("password")}
                    helperText="Default: Driver@1234"
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  value={form.date_of_birth}
                  onChange={set("date_of_birth")}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={form.address}
                  onChange={set("address")}
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
              License & Employment
            </Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  required
                  label="License Number"
                  value={form.license_number}
                  onChange={set("license_number")}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  select
                  label="License Class"
                  value={form.license_class}
                  onChange={set("license_class")}
                >
                  {["Class A", "Class B", "Class C", "Class D", "Class E"].map(
                    (c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ),
                  )}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                {isEdit && (
                  <TextField
                    fullWidth
                    select
                    label="Driver Status"
                    value={form.status}
                    onChange={set("status")}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="on_leave">On Leave</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </TextField>
                )}
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  required
                  label="License Expiry"
                  type="date"
                  value={form.license_expiry}
                  onChange={set("license_expiry")}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="License Issue Date"
                  type="date"
                  value={form.license_issue_date}
                  onChange={set("license_issue_date")}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Hire Date"
                  type="date"
                  value={form.hire_date}
                  onChange={set("hire_date")}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Years of Experience"
                  type="number"
                  value={form.years_experience}
                  onChange={set("years_experience")}
                  inputProps={{ min: 0, max: 50 }}
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
              Emergency Contact
            </Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Name"
                  value={form.emergency_contact_name}
                  onChange={set("emergency_contact_name")}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Phone"
                  value={form.emergency_contact_phone}
                  onChange={set("emergency_contact_phone")}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
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
              "Add Driver"
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
