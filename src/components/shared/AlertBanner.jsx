import { Box, Typography, Chip, Alert } from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ErrorIcon from '@mui/icons-material/Error'
import { formatDate, expiryLabel } from '../../utils/helpers'

export default function AlertBanner({ alerts = [], maxShow = 5 }) {
  if (!alerts.length) return null

  const critical = alerts.filter(a => a.severity === 'critical')
  const warnings = alerts.filter(a => a.severity === 'warning')
  const shown    = alerts.slice(0, maxShow)

  return (
    <Box display="flex" flexDirection="column" gap={1} mb={3}>
      {critical.length > 0 && (
        <Alert severity="error" icon={<ErrorIcon />}>
          <strong>{critical.length} critical alert{critical.length > 1 ? 's' : ''}</strong>
          {' '}— Immediate action required on expired or near-expiry documents.
        </Alert>
      )}

      {shown.map((a, i) => (
        <Box
          key={i}
          sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            px: 2, py: 1.25,
            background: a.severity === 'critical' ? 'rgba(244,67,54,0.07)' : 'rgba(255,152,0,0.07)',
            border: `1px solid ${a.severity === 'critical' ? 'rgba(244,67,54,0.25)' : 'rgba(255,152,0,0.25)'}`,
            borderRadius: 1.5,
          }}
        >
          {a.severity === 'critical'
            ? <ErrorIcon sx={{ color: 'error.main', fontSize: '1rem', flexShrink: 0 }} />
            : <WarningAmberIcon sx={{ color: 'warning.main', fontSize: '1rem', flexShrink: 0 }} />
          }
          <Box flex={1} minWidth={0}>
            <Typography variant="body2" fontWeight={600} noWrap>{a.title}</Typography>
            <Typography variant="caption" color="text.secondary">{a.subtitle}</Typography>
          </Box>
          <Chip
            label={expiryLabel(a.days)}
            size="small"
            color={a.severity === 'critical' ? 'error' : 'warning'}
            sx={{ flexShrink: 0 }}
          />
        </Box>
      ))}

      {alerts.length > maxShow && (
        <Typography variant="caption" color="text.secondary" textAlign="center">
          +{alerts.length - maxShow} more alerts
        </Typography>
      )}
    </Box>
  )
}
