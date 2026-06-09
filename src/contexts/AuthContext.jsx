import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on mount. On desktop the httpOnly cookie carries auth; on
  // mobile/cross-site the cookie is blocked, so if /me fails we exchange the
  // stored refresh token for a fresh access token and try once more. This keeps
  // users signed in across a page refresh without relying on third-party cookies.
  useEffect(() => {
    let active = true
    const restore = async () => {
      try {
        const { data } = await authAPI.me()
        if (active) setUser(data.user)
      } catch {
        try {
          await authAPI.refresh()            // uses the persisted refresh token
          const { data } = await authAPI.me()
          if (active) setUser(data.user)
        } catch {
          if (active) setUser(null)
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    restore()
    return () => { active = false }
  }, [])

  // Password login. Returns the raw response:
  //   { user, ... }                      → logged in (user set)
  //   { twoFactorRequired, challengeToken } → caller must complete 2FA
  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password })
    if (data.twoFactorRequired) return data
    setUser(data.user)
    return data
  }, [])

  // Complete a 2FA login with a TOTP or emailed code.
  const verifyTwoFactor = useCallback(async (challengeToken, code) => {
    const { data } = await authAPI.twoFactorVerify(challengeToken, code)
    setUser(data.user)
    return data.user
  }, [])

  // Verify a new account via emailed token + code, then auto-login.
  const verify = useCallback(async (token, code) => {
    const { data } = await authAPI.verify({ token, code })
    setUser(data.user)
    return data.user
  }, [])

  // Re-fetch the current user (e.g. after enabling 2FA or dismissing a prompt).
  const refreshUser = useCallback(async () => {
    const { data } = await authAPI.me()
    setUser(data.user)
    return data.user
  }, [])

  // Update the signed-in user's own profile, then sync local state.
  const updateProfile = useCallback(async (body) => {
    const data = await authAPI.updateProfile(body)
    if (data?.user) setUser(data.user)
    return data
  }, [])

  const logout = useCallback(() => {
    authAPI.logout().catch(() => {}) // clear the httpOnly cookies server-side
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyTwoFactor, verify, refreshUser, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
