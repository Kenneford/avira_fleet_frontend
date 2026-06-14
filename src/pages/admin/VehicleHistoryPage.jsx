import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { VehicleDriverHistory } from "../../components/fleet/AssignmentHistory";

export default function VehicleHistoryPage() {
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
        <Typography variant="h4" fontWeight={800}>Vehicle history</Typography>
        <Typography variant="body2" color="text.secondary">All drivers this vehicle has been assigned to, over time.</Typography>
      </Box>
      <VehicleDriverHistory vehicleId={id} />
    </Box>
  );
}
