import { Box, Card, CardContent, Typography, Skeleton } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'

export default function StatCard({ label, value, icon, color = '#D32F2F', loading, sub }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="overline" display="block" sx={{ mb: 0.5 }}>{label}</Typography>
            {loading
              ? <Skeleton width={60} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.07)' }} />
              : <Typography variant="h3" fontWeight={800} sx={{ color, fontSize: '2rem', lineHeight: 1 }}>
                  {value ?? '—'}
                </Typography>
            }
            {sub && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {sub}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 44, height: 44, borderRadius: 2,
              background: `${color}18`,
              border: `1px solid ${color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color, fontSize: '1.4rem',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
