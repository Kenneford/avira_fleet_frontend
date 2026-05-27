import { createTheme, alpha } from '@mui/material/styles'

const gold = '#C8A84B'
const goldDark = '#9E7E32'
const dark2 = '#161616'
const dark3 = '#1E1E1E'
const dark4 = '#252525'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary:    { main: gold, light: '#E5C76A', dark: goldDark, contrastText: '#0A0A0A' },
    secondary:  { main: '#FFFFFF' },
    success:    { main: '#4CAF50', light: '#81C784', dark: '#388E3C' },
    warning:    { main: '#FF9800', light: '#FFB74D', dark: '#F57C00' },
    error:      { main: '#F44336', light: '#E57373', dark: '#D32F2F' },
    info:       { main: '#2196F3', light: '#64B5F6', dark: '#1976D2' },
    background: { default: '#0F0F0F', paper: dark2 },
    text:       { primary: '#FFFFFF', secondary: '#999999', disabled: '#555555' },
    divider:    'rgba(255,255,255,0.07)',
  },

  typography: {
    fontFamily: "'DM Sans', sans-serif",
    h1: { fontFamily: "'Syne', sans-serif", fontWeight: 800 },
    h2: { fontFamily: "'Syne', sans-serif", fontWeight: 800 },
    h3: { fontFamily: "'Syne', sans-serif", fontWeight: 700 },
    h4: { fontFamily: "'Syne', sans-serif", fontWeight: 700 },
    h5: { fontFamily: "'Syne', sans-serif", fontWeight: 700 },
    h6: { fontFamily: "'Syne', sans-serif", fontWeight: 700 },
    overline: {
      fontFamily: "'Syne', sans-serif",
      fontWeight: 700,
      letterSpacing: '0.15em',
      fontSize: '0.68rem',
      color: gold,
    },
    caption: { color: '#999999' },
    body2:   { color: '#BBBBBB', lineHeight: 1.6 },
  },

  shape: { borderRadius: 6 },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { background: '#0F0F0F', scrollbarColor: `${dark4} ${dark2}` }
      }
    },

    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          borderRadius: 4,
          boxShadow: 'none',
          fontSize: '0.78rem',
          '&:hover': { boxShadow: 'none' },
        },
        containedPrimary: {
          color: '#0A0A0A',
          background: gold,
          '&:hover': { background: '#E5C76A', transform: 'translateY(-1px)' },
          transition: 'background 0.2s, transform 0.2s',
        },
        outlinedPrimary: {
          borderColor: alpha(gold, 0.4),
          '&:hover': { borderColor: gold, background: alpha(gold, 0.06) },
        },
        containedError: { color: '#fff' },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: dark2,
          border: '1px solid rgba(255,255,255,0.07)',
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          background: dark2,
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 8,
          boxShadow: 'none',
          backgroundImage: 'none',
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: '#0A0A0A',
          border: 'none',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          background: '#0A0A0A',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: 'none',
          backgroundImage: 'none',
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            background: dark3,
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: '0.72rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#888888',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }
        }
      }
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          fontSize: '0.875rem',
          padding: '12px 16px',
        }
      }
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { background: 'rgba(255,255,255,0.03)' },
          '&:last-child td': { borderBottom: 'none' },
        }
      }
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            background: dark3,
            fontSize: '0.9rem',
            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
            '&:hover fieldset': { borderColor: alpha(gold, 0.4) },
            '&.Mui-focused fieldset': { borderColor: gold },
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.85rem',
            '&.Mui-focused': { color: gold },
          },
        },
      },
    },

    MuiSelect: {
      styleOverrides: {
        root: { background: dark3 }
      }
    },

    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: '0.68rem',
          letterSpacing: '0.06em',
          height: 24,
          borderRadius: 4,
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          background: dark2,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
        }
      }
    },

    MuiMenu: {
      styleOverrides: {
        paper: { background: dark3, border: '1px solid rgba(255,255,255,0.1)' }
      }
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: { background: dark4, fontSize: '0.78rem', border: '1px solid rgba(255,255,255,0.1)' }
      }
    },

    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 6 },
        standardWarning: { background: alpha('#FF9800', 0.1), border: `1px solid ${alpha('#FF9800', 0.3)}` },
        standardError:   { background: alpha('#F44336', 0.1), border: `1px solid ${alpha('#F44336', 0.3)}` },
        standardSuccess: { background: alpha('#4CAF50', 0.1), border: `1px solid ${alpha('#4CAF50', 0.3)}` },
        standardInfo:    { background: alpha('#2196F3', 0.1), border: `1px solid ${alpha('#2196F3', 0.3)}` },
      }
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, background: dark4 },
        barColorPrimary: { background: gold },
      }
    },

    MuiDivider: {
      styleOverrides: { root: { borderColor: 'rgba(255,255,255,0.07)' } }
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          margin: '1px 8px',
          '&.Mui-selected': {
            background: alpha(gold, 0.12),
            color: gold,
            '&:hover': { background: alpha(gold, 0.18) },
            '& .MuiListItemIcon-root': { color: gold },
          },
          '&:hover': { background: 'rgba(255,255,255,0.05)' },
        },
      },
    },

    MuiListItemIcon: {
      styleOverrides: { root: { minWidth: 38, color: '#666' } }
    },
  },
})

export default theme
