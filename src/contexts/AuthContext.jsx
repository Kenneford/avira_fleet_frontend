import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on mount — the httpOnly auth cookie is sent automatically.
  useEffect(() => {
    authAPI.me()
      .then(({ data }) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  // login/verify rely on the server setting httpOnly cookies — no tokens are
  // stored in JS (cookie-only auth, XSS-safe).
  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password })
    setUser(data.user)
    return data.user
  }, [])

  // Verify a new account via emailed token + code, then auto-login.
  const verify = useCallback(async (token, code) => {
    const { data } = await authAPI.verify({ token, code })
    setUser(data.user)
    return data.user
  }, [])

  // Re-fetch the current user (e.g. after a password reset clears the flag).
  const refreshUser = useCallback(async () => {
    const { data } = await authAPI.me()
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    authAPI.logout().catch(() => {}) // clear the httpOnly cookies server-side
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, verify, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
