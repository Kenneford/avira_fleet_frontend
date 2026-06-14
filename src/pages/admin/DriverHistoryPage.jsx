import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { DriverVehicleHistory } from "../../components/fleet/AssignmentHistory";

export default function DriverHistoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const base = pathname.startsWith("/manager") ? "/manager" : "/admin";

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`${base}/drivers`)} sx={{ mb: 2 }} size="small">
        Back to drivers
      </Button>
      <Box mb={3}>
        <Typography variant="overline" display="block" color="text.secondary">Personnel</Typography>
        <Typography variant="h4" fontWeight={800}>Driver history</Typography>
        <Typography variant="body2" color="text.secondary">All vehicles this driver has been assigned to, over time.</Typography>
      </Box>
      <DriverVehicleHistory driverId={id} />
    </Box>
  );
}
