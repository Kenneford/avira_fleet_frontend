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
  Checkbox,
  FormControlLabel,
  IconButton,
  Divider,
  InputAdornment,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { driverAPI } from "../../api/client";
import { errorMessage } from "../../utils/helpers";
import DocumentUpload from "../../components/DocumentUpload";

const BLANK_GUARANTOR = {
  type: "civil_servant",
  name: "",
  workplace: "",
  positionRole: "",
  contact: "",
  relationship: "",
  ghanaCardNumber: "",
  ghanaCardFrontUrl: "",
  ghanaCardBackUrl: "",
};

// camelCase keys — these map 1:1 to what the backend expects.
const BLANK = {
  name: "",
  email: "",
  phone: "",
  password: "",
  dateOfBirth: "",
  address: "",
  gpsAddress: "",
  nearestLandmark: "",
  licenseNumber: "",
  licenseClass: "Class C",
  licenseExpiry: "",
  licenseIssueDate: "",
  hireDate: "",
  yearsExperience: 0,
  status: "active",
  workAndPay: false,
  dailySales: "",
  deposit: 3000,
  agreementDate: "",
  passportPictureUrl: "",
  ghanaCardNumber: "",
  ghanaCardFrontUrl: "",
  ghanaCardBackUrl: "",
  licenseFrontUrl: "",
  licenseBackUrl: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  notes: "",
  guarantors: [
    { ...BLANK_GUARANTOR, type: "family" },
    { ...BLANK_GUARANTOR, type: "civil_servant" },
  ],
};

const SectionCard = ({ title, sub, children }) => (
  <Card sx={{ mb: 2.5 }}>
    <CardContent sx={{ p: 3 }}>
      <Typography
        variant="h6"
        fontSize="0.9rem"
        fontWeight={700}
        mb={sub ? 0.5 : 2.5}
      >
        {title}
      </Typography>
      {sub && (
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mb={2.5}
        >
          {sub}
        </Typography>
      )}
      {children}
    </CardContent>
  </Card>
);

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
        const guarantors = (data.guarantors || []).map((g) => ({
          type: g.type || "civil_servant",
          name: g.name || "",
          workplace: g.workplace || "",
          positionRole: g.positionRole || "",
          contact: g.contact || "",
          relationship: g.relationship || "",
          ghanaCardNumber: g.ghanaCardNumber || "",
          ghanaCardFrontUrl: g.ghanaCardFrontUrl || "",
          ghanaCardBackUrl: g.ghanaCardBackUrl || "",
        }));
        setForm({
          name: data?.user?.name || "",
          email: data?.user?.email || "",
          phone: data?.user?.phone || "",
          password: "",
          dateOfBirth: data?.dateOfBirth?.slice(0, 10) || "",
          address: data?.address || "",
          gpsAddress: data?.gpsAddress || "",
          nearestLandmark: data?.nearestLandmark || "",
          licenseNumber: data?.licenseNumber || "",
          licenseClass: data?.licenseClass || "Class C",
          licenseExpiry: data?.licenseExpiry?.slice(0, 10) || "",
          licenseIssueDate: data?.licenseIssueDate?.slice(0, 10) || "",
          hireDate: data?.hireDate?.slice(0, 10) || "",
          yearsExperience: data?.yearsExperience || 0,
          status: data?.status || "active",
          workAndPay: Boolean(data?.workAndPay),
          dailySales: data?.dailySales ?? "",
          deposit: data?.deposit ?? 3000,
          agreementDate: data?.agreementDate?.slice(0, 10) || "",
          passportPictureUrl: data?.passportPictureUrl || "",
          ghanaCardNumber: data?.ghanaCardNumber || "",
          ghanaCardFrontUrl: data?.ghanaCardFrontUrl || "",
          ghanaCardBackUrl: data?.ghanaCardBackUrl || "",
          licenseFrontUrl: data?.licenseFrontUrl || "",
          licenseBackUrl: data?.licenseBackUrl || "",
          emergencyContactName: data?.emergencyContactName || "",
          emergencyContactPhone: data?.emergencyContactPhone || "",
          notes: data?.notes || "",
          guarantors: guarantors.length ? guarantors : BLANK.guarantors,
        });
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));
  const setChecked = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.checked }));
  const setValue = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const setGuarantorValue = (i, field, value) =>
    setForm((p) => ({
      ...p,
      guarantors: p.guarantors.map((g, idx) =>
        idx === i ? { ...g, [field]: value } : g,
      ),
    }));

  const setGuarantor = (i, field) => (e) => {
    const value = e.target.value;
    setForm((p) => {
      const guarantors = p.guarantors.map((g, idx) =>
        idx === i ? { ...g, [field]: value } : g,
      );
      return { ...p, guarantors };
    });
  };
  const addGuarantor = () =>
    setForm((p) => ({
      ...p,
      guarantors: [...p.guarantors, { ...BLANK_GUARANTOR }],
    }));
  const removeGuarantor = (i) =>
    setForm((p) => ({
      ...p,
      guarantors: p.guarantors.filter((_, idx) => idx !== i),
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      // Drop empty guarantor rows before sending.
      const payload = {
        ...form,
        guarantors: form.guarantors.filter((g) => g.name.trim()),
      };
      if (isEdit) {
        await driverAPI.update(id, payload);
        setSuccess("Driver updated successfully");
      } else {
        const { data } = await driverAPI.create(payload);
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
        {/* <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          size="small"
        >
          Back
        </Button> */}
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
        {/* Personal */}
        <SectionCard title="Personal Information">
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
                label="Contact / Phone"
                value={form.phone}
                onChange={set("phone")}
              />
            </Grid>
            {!isEdit && (
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Password (blank = default)"
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
                value={form.dateOfBirth}
                onChange={set("dateOfBirth")}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Residential Address"
                value={form.address}
                onChange={set("address")}
              />
            </Grid>
          </Grid>
        </SectionCard>

        {/* Location */}
        <SectionCard
          title="Location"
          sub="Ghana Post GPS address and nearest landmark, as on the agreement form."
        >
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="GPS Address"
                value={form.gpsAddress}
                onChange={set("gpsAddress")}
                placeholder="e.g. GA-123-4567"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location & Nearest Landmark"
                value={form.nearestLandmark}
                onChange={set("nearestLandmark")}
              />
            </Grid>
          </Grid>
        </SectionCard>

        {/* License & Employment */}
        <SectionCard title="License & Employment">
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                label="License Number"
                value={form.licenseNumber}
                onChange={set("licenseNumber")}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="License Class"
                value={form.licenseClass}
                onChange={set("licenseClass")}
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
                value={form.licenseExpiry}
                onChange={set("licenseExpiry")}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="License Issue Date"
                type="date"
                value={form.licenseIssueDate}
                onChange={set("licenseIssueDate")}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Hire Date"
                type="date"
                value={form.hireDate}
                onChange={set("hireDate")}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Years of Experience"
                type="number"
                value={form.yearsExperience}
                onChange={set("yearsExperience")}
                inputProps={{ min: 0, max: 50 }}
              />
            </Grid>
          </Grid>
        </SectionCard>

        {/* Sales Policy Agreement */}
        <SectionCard
          title="Sales Policy Agreement"
          sub="Work-and-pay terms from the Driver's Regular Sales Policy Agreement."
        >
          <Grid container spacing={2.5} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.workAndPay}
                    onChange={setChecked("workAndPay")}
                  />
                }
                label="On Work & Pay program"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Daily Sales"
                type="number"
                value={form.dailySales}
                onChange={set("dailySales")}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">GHS</InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Deposit"
                type="number"
                value={form.deposit}
                onChange={set("deposit")}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">GHC</InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Agreement Date"
                type="date"
                value={form.agreementDate}
                onChange={set("agreementDate")}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </SectionCard>

        {/* Documents */}
        <SectionCard
          title="Documents"
          sub="Upload clear photos/scans. Ghana Card and license require front and back."
        >
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ghana Card Number"
                value={form.ghanaCardNumber}
                onChange={set("ghanaCardNumber")}
                placeholder="GHA-XXXXXXXXX-X"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DocumentUpload
                label="Passport Picture"
                value={form.passportPictureUrl}
                onChange={(u) => setValue("passportPictureUrl", u)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DocumentUpload
                label="Ghana Card — Front"
                value={form.ghanaCardFrontUrl}
                onChange={(u) => setValue("ghanaCardFrontUrl", u)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DocumentUpload
                label="Ghana Card — Back"
                value={form.ghanaCardBackUrl}
                onChange={(u) => setValue("ghanaCardBackUrl", u)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DocumentUpload
                label="Driver's License — Front"
                value={form.licenseFrontUrl}
                onChange={(u) => setValue("licenseFrontUrl", u)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DocumentUpload
                label="Driver's License — Back"
                value={form.licenseBackUrl}
                onChange={(u) => setValue("licenseBackUrl", u)}
              />
            </Grid>
          </Grid>
        </SectionCard>

        {/* Guarantors */}
        <SectionCard
          title="Guarantors"
          sub="The agreement requires two: a family member and a Civil Servant / Government worker, each with a Ghana Card."
        >
          {form.guarantors.map((g, i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={1}
              >
                <Typography variant="subtitle2" fontWeight={700}>
                  Guarantor {i + 1}
                </Typography>
                {form.guarantors.length > 1 && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => removeGuarantor(i)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Type"
                    value={g.type}
                    onChange={setGuarantor(i, "type")}
                  >
                    <MenuItem value="family">Family member</MenuItem>
                    <MenuItem value="civil_servant">
                      Civil Servant / Gov't worker
                    </MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={g.name}
                    onChange={setGuarantor(i, "name")}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Work Place"
                    value={g.workplace}
                    onChange={setGuarantor(i, "workplace")}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Position / Role"
                    value={g.positionRole}
                    onChange={setGuarantor(i, "positionRole")}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Contact"
                    value={g.contact}
                    onChange={setGuarantor(i, "contact")}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Relationship"
                    value={g.relationship}
                    onChange={setGuarantor(i, "relationship")}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Ghana Card No."
                    value={g.ghanaCardNumber}
                    onChange={setGuarantor(i, "ghanaCardNumber")}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DocumentUpload
                    label="Guarantor Ghana Card — Front"
                    value={g.ghanaCardFrontUrl}
                    onChange={(u) =>
                      setGuarantorValue(i, "ghanaCardFrontUrl", u)
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DocumentUpload
                    label="Guarantor Ghana Card — Back"
                    value={g.ghanaCardBackUrl}
                    onChange={(u) =>
                      setGuarantorValue(i, "ghanaCardBackUrl", u)
                    }
                  />
                </Grid>
              </Grid>
              {i < form.guarantors.length - 1 && <Divider sx={{ mt: 2.5 }} />}
            </Box>
          ))}
          <Button size="small" startIcon={<AddIcon />} onClick={addGuarantor}>
            Add guarantor
          </Button>
        </SectionCard>

        {/* Emergency contact & notes */}
        <SectionCard title="Emergency Contact & Notes">
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Emergency Contact Name"
                value={form.emergencyContactName}
                onChange={set("emergencyContactName")}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Emergency Contact Phone"
                value={form.emergencyContactPhone}
                onChange={set("emergencyContactPhone")}
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
        </SectionCard>

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
