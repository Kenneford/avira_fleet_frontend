import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { FleetThemeProvider } from './contexts/ThemeContext'
import App from './App.jsx'
import './styles/globals.scss'

// HashRouter is used instead of BrowserRouter so the app works both as a
// desktop app (Electron file:// protocol) and as a web deployment.
// URLs will contain a # (e.g. /#/admin/dashboard) which is fine for an
// internal fleet tool.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <FleetThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </FleetThemeProvider>
    </HashRouter>
  </React.StrictMode>,
)
