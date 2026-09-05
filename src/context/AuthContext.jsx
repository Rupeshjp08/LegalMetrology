import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getUser as getStoredUser } from '../services/storage/authStorage'

const AuthContext = createContext(null)

/**
 * Authentication context foundation.
 *
 * Currently provides the skeleton for the future auth module:
 * - isAuthenticated / isLoading
 * - user object with role for role-based access control
 *
 * Real login/session handling will be wired in the auth module
 * without changing the shape of this context.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const storedUser = getStoredUser()
      setUser(storedUser)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (authData) => {
    setUser(authData.user)
  }, [])

  const logout = useCallback(async () => {
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}