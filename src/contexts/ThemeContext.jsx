import { createContext, useContext, useState, useMemo, useCallback } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { createFleetTheme } from '../theme/fleetTheme'

const ThemeModeContext = createContext({ mode: 'light', toggleMode: () => {} })

export function FleetThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('fleet_theme_mode') || 'light' }
    catch { return 'light' }
  })

  const toggleMode = useCallback(() => {
    setMode(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem('fleet_theme_mode', next) } catch {}
      return next
    })
  }, [])

  const theme = useMemo(() => createFleetTheme(mode), [mode])

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  )
}

export const useThemeMode = () => useContext(ThemeModeContext)
