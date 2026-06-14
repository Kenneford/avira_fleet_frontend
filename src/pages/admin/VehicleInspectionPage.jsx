import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VehicleInspectionPanel from "../../components/fleet/VehicleInspectionPanel";

export default function VehicleInspectionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const base = pathname.startsWith("/manager") ? "/manager" : "/admin";

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`${base}/vehicles`)} sx={{ mb: 2 }} size="small">
        Back to vehicles
      </Button>
      <Box mb={3}>
        <Typography variant="overline" display="block" color="text.secondary">Fleet</Typography>
        <Typography variant="h4" fontWeight={800}>Inspection & Maintenance</Typography>
        <Typography variant="body2" color="text.secondary">Schedule, record and review this vehicle's inspection history.</Typography>
      </Box>
      <VehicleInspectionPanel vehicleId={id} />
    </Box>
  );
}
