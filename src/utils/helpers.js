import { format, parseISO, differenceInDays } from 'date-fns'

export const formatDate = (d) => {
  if (!d) return '—'
  try { return format(parseISO(d.toString().slice(0, 10)), 'dd MMM yyyy') } catch { return d }
}

export const formatDateTime = (d) => {
  if (!d) return '—'
  try { return format(new Date(d), 'dd MMM yyyy, HH:mm') } catch { return d }
}

export const daysLeft = (dateStr) => {
  if (!dateStr) return null
  return differenceInDays(new Date(dateStr), new Date())
}

export const expiryColor = (days) => {
  if (days === null) return 'text.secondary'
  if (days < 0)     return 'error.main'
  if (days <= 7)    return 'error.main'
  if (days <= 30)   return 'warning.main'
  return 'success.main'
}

export const expiryLabel = (days) => {
  if (days === null)   return '—'
  if (days < 0)        return `Expired ${Math.abs(days)}d ago`
  if (days === 0)      return 'Expires today!'
  if (days === 1)      return 'Expires tomorrow'
  return `${days} days left`
}

export const statusConfig = {
  vehicle: {
    available:       { label: 'Available',       color: 'success' },
    assigned:        { label: 'Assigned',         color: 'info'    },
    maintenance:     { label: 'Maintenance',      color: 'warning' },
    out_of_service:  { label: 'Out of Service',   color: 'error'   },
    retired:         { label: 'Retired',          color: 'default' },
  },
  driver: {
    active:     { label: 'Active',     color: 'success' },
    on_leave:   { label: 'On Leave',   color: 'warning' },
    suspended:  { label: 'Suspended',  color: 'error'   },
    inactive:   { label: 'Inactive',   color: 'default' },
  },
  schedule: {
    scheduled:   { label: 'Scheduled',   color: 'info'    },
    in_progress: { label: 'In Progress', color: 'warning' },
    completed:   { label: 'Completed',   color: 'success' },
    cancelled:   { label: 'Cancelled',   color: 'error'   },
  },
}

export const vehicleTypeLabel = {
  executive_coach: 'Executive Coach',
  midi_coach:      'Midi Coach',
  minibus:         'Minibus',
  vip_coach:       'VIP Coach',
  school_bus:      'School Bus',
  sprinter_van:    'Sprinter Van',
  other:           'Other',
}

export const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : ''

export const errorMessage = (err) =>
  err?.response?.data?.message || err?.message || 'Something went wrong'
